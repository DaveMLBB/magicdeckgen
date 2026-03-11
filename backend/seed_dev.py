"""
Seed ambiente di sviluppo locale.
Crea un utente di test già verificato con 100 token.

Uso:
  cd backend
  python seed_dev.py

Credenziali create:
  email:    test@dev.local
  password: test1234
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models import User, TokenTransaction, PolicyAcceptance
from app.routers.auth import get_password_hash
from datetime import datetime

Base.metadata.create_all(bind=engine)
db = SessionLocal()

EMAIL    = "test@dev.com"
PASSWORD = "test1234"
TOKENS   = 100

existing = db.query(User).filter(User.email == EMAIL).first()
if existing:
    # Aggiorna i token se l'utente esiste già
    existing.tokens = TOKENS
    db.commit()
    print(f"✅ Utente già esistente — token aggiornati a {TOKENS}")
    print(f"   email:    {EMAIL}")
    print(f"   password: {PASSWORD}")
    db.close()
    sys.exit(0)

user = User(
    email=EMAIL,
    hashed_password=get_password_hash(PASSWORD),
    is_verified=True,           # salta la verifica email
    verification_token=None,
    tokens=TOKENS,
    privacy_policy_version="1.0",
    terms_version="1.0",
    created_at=datetime.utcnow(),
    last_login_at=datetime.utcnow(),
)
db.add(user)
db.flush()

# Policy acceptance
for policy_type in ("privacy_policy", "terms_of_service"):
    db.add(PolicyAcceptance(
        user_id=user.id,
        policy_type=policy_type,
        policy_version="1.0",
        accepted_at=datetime.utcnow(),
    ))

# Token transaction
db.add(TokenTransaction(
    user_id=user.id,
    amount=TOKENS,
    action="dev_seed",
    description=f"🛠️ Token sviluppo locale",
))

db.commit()
print(f"✅ Utente di test creato:")
print(f"   email:    {EMAIL}")
print(f"   password: {PASSWORD}")
print(f"   token:    {TOKENS}")
print(f"   id:       {user.id}")
db.close()
