from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import secrets
import logging
from app.database import get_db
from app.models import User, PolicyAcceptance
from app.email import send_verification_email

logger = logging.getLogger(__name__)

router = APIRouter()

# Configurazione
SECRET_KEY = "your-secret-key-change-in-production"  # CAMBIARE IN PRODUZIONE
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 giorni

# Modelli Pydantic
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    referral_code: str = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    email: EmailStr = None
    password: str = None
    current_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    is_verified: bool

# Utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica password con bcrypt"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """Hash password con bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_verification_token():
    return secrets.token_urlsafe(32)

# Endpoints
@router.post("/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Registra un nuovo utente"""
    # Verifica se email già esiste
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già registrata"
        )

    # Verifica codice referral se fornito
    sales_code = None
    if user_data.referral_code:
        from app.models import SalesCode
        sales_code = db.query(SalesCode).filter(
            SalesCode.code == user_data.referral_code.strip().upper(),
            SalesCode.is_active == True
        ).first()
        if not sales_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Codice referral non valido o scaduto"
            )
    
    # Crea nuovo utente
    verification_token = generate_verification_token()
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        verification_token=verification_token,
        is_verified=False,
        privacy_policy_version="1.0",
        terms_version="1.0"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Registra accettazione Privacy Policy e Terms of Service
    privacy_acceptance = PolicyAcceptance(
        user_id=new_user.id,
        policy_type="privacy_policy",
        policy_version="1.0",
        accepted_at=datetime.utcnow()
    )
    terms_acceptance = PolicyAcceptance(
        user_id=new_user.id,
        policy_type="terms_of_service",
        policy_version="1.0",
        accepted_at=datetime.utcnow()
    )
    
    db.add(privacy_acceptance)
    db.add(terms_acceptance)
    db.commit()
    
    # Regala 100 token di benvenuto al nuovo utente
    from app.models import TokenTransaction
    welcome_tokens = 100
    new_user.tokens = welcome_tokens
    welcome_transaction = TokenTransaction(
        user_id=new_user.id,
        amount=welcome_tokens,
        action='welcome_bonus',
        description='🎉 Bonus di benvenuto - 100 token gratuiti!'
    )
    db.add(welcome_transaction)

    # Gestione codice referral opzionale
    referral_bonus = 0
    if user_data.referral_code and sales_code:
        referral_bonus = sales_code.bonus_tokens
        new_user.tokens += referral_bonus
        new_user.sales_code_id = sales_code.id
        sales_code.uses_count += 1
        referral_transaction = TokenTransaction(
            user_id=new_user.id,
            amount=referral_bonus,
            action='referral_bonus',
            description=f'🎁 Bonus codice referral {sales_code.code} - {referral_bonus} token!'
        )
        db.add(referral_transaction)

    db.commit()
    
    # Invia email di verifica tramite Brevo (non blocca la registrazione se fallisce)
    email_sent = False
    try:
        email_sent = send_verification_email(user_data.email, verification_token)
        if not email_sent:
            logger.error(f"send_verification_email returned False for user {new_user.id} ({user_data.email})")
    except Exception as e:
        logger.error(f"Exception sending verification email to {user_data.email} (user_id={new_user.id}): {e}")
    
    return {
        "message": "Registration completed. Check your email to verify your account. You received 100 free tokens!",
        "user_id": new_user.id,
        "welcome_tokens": welcome_tokens + referral_bonus,
        "email_sent": email_sent
    }

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login utente"""
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password non corretti"
        )
    
    # Verifica e registra accettazione policy se non presente
    # (per utenti creati prima dell'implementazione GDPR)
    if not user.privacy_policy_version or not user.terms_version:
        user.privacy_policy_version = "1.0"
        user.terms_version = "1.0"
        
        # Verifica se esistono già accettazioni
        existing_privacy = db.query(PolicyAcceptance).filter(
            PolicyAcceptance.user_id == user.id,
            PolicyAcceptance.policy_type == "privacy_policy"
        ).first()
        
        existing_terms = db.query(PolicyAcceptance).filter(
            PolicyAcceptance.user_id == user.id,
            PolicyAcceptance.policy_type == "terms_of_service"
        ).first()
        
        # Crea accettazioni se non esistono
        if not existing_privacy:
            privacy_acceptance = PolicyAcceptance(
                user_id=user.id,
                policy_type="privacy_policy",
                policy_version="1.0",
                accepted_at=datetime.utcnow()
            )
            db.add(privacy_acceptance)
        
        if not existing_terms:
            terms_acceptance = PolicyAcceptance(
                user_id=user.id,
                policy_type="terms_of_service",
                policy_version="1.0",
                accepted_at=datetime.utcnow()
            )
            db.add(terms_acceptance)
        
        db.commit()
    
    # Aggiorna last_login_at per retention policy
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    # Crea token JWT
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "is_verified": user.is_verified
    }

@router.post("/verify/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verifica email con token"""
    user = db.query(User).filter(User.verification_token == token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token di verifica non valido"
        )
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    
    return {"message": "Email verified successfully!"}

@router.put("/update")
def update_user(user_data: UserUpdate, token: str, db: Session = Depends(get_db)):
    """Aggiorna email o password"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato"
        )
    
    # Verifica password corrente
    if not verify_password(user_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password corrente non corretta"
        )
    
    # Aggiorna email
    if user_data.email and user_data.email != user.email:
        # Verifica se email già esiste
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email già in uso"
            )
        
        user.email = user_data.email
        user.is_verified = False
        user.verification_token = generate_verification_token()
        
        # Invia email di verifica tramite Brevo
        try:
            sent = send_verification_email(user_data.email, user.verification_token)
            if not sent:
                logger.error(f"send_verification_email returned False for updated email {user_data.email} (user_id={user.id})")
        except Exception as e:
            logger.error(f"Exception sending verification email on update to {user_data.email} (user_id={user.id}): {e}")
    
    # Aggiorna password
    if user_data.password:
        user.hashed_password = get_password_hash(user_data.password)
    
    db.commit()
    
    return {
        "message": "Account updated successfully",
        "email_changed": user_data.email is not None,
        "password_changed": user_data.password is not None
    }

@router.get("/me")
def get_current_user(token: str, db: Session = Depends(get_db)):
    """Ottieni informazioni utente corrente"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato"
        )
    
    return {
        "id": user.id,
        "email": user.email,
        "is_verified": user.is_verified,
        "created_at": user.created_at
    }

@router.post("/resend-verification")
def resend_verification(token: str, db: Session = Depends(get_db)):
    """Reinvia email di verifica all'utente autenticato"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato"
        )

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già verificata"
        )

    # Rigenera token se non presente
    if not user.verification_token:
        user.verification_token = generate_verification_token()
        db.commit()

    email_sent = False
    try:
        email_sent = send_verification_email(user.email, user.verification_token)
        if not email_sent:
            logger.error(f"resend_verification: send returned False for user {user.id} ({user.email})")
    except Exception as e:
        logger.error(f"resend_verification: exception for user {user.id} ({user.email}): {e}")

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Impossibile inviare l'email al momento. Riprova più tardi."
        )

    return {"message": "Email di verifica inviata"}
