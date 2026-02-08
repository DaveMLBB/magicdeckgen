from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import secrets
from app.database import get_db
from app.models import User
from app.email import send_verification_email

router = APIRouter()

# Configurazione
SECRET_KEY = "your-secret-key-change-in-production"  # CAMBIARE IN PRODUZIONE
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 giorni

# Modelli Pydantic
class UserRegister(BaseModel):
    email: EmailStr
    password: str

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
    
    # Crea nuovo utente
    verification_token = generate_verification_token()
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        verification_token=verification_token,
        is_verified=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Invia email di verifica tramite Brevo
    send_verification_email(user_data.email, verification_token)
    
    return {
        "message": "Registration completed. Check your email to verify your account.",
        "user_id": new_user.id
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
        send_verification_email(user_data.email, user.verification_token)
    
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
