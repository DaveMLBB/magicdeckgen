"""
Import completo Scryfall nel DB locale (SQLite o PostgreSQL).
Legge DATABASE_URL dal .env — usa il DB configurato.

Uso:
  cd backend
  source venv/bin/activate
  python import_scryfall.py

Per importare solo N carte (test rapido):
  python import_scryfall.py --limit 1000
"""
import sys, os, argparse
sys.path.insert(0, os.path.dirname(__file__))

import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

parser = argparse.ArgumentParser()
parser.add_argument("--limit", type=int, default=None, help="Importa solo N carte (test)")
args = parser.parse_args()

from app.database import engine, Base
from app.services.scryfall_sync import run_sync

# Crea tutte le tabelle (incluse le nuove colonne)
Base.metadata.create_all(bind=engine)
print("✅ Tabelle create/aggiornate")

# Seed utente di test
from app.database import SessionLocal
from app.models import User, TokenTransaction, PolicyAcceptance
from app.routers.auth import get_password_hash
from datetime import datetime

db = SessionLocal()
EMAIL, PASSWORD, TOKENS = "test@dev.com", "test1234", 100
existing = db.query(User).filter(User.email == EMAIL).first()
if existing:
    existing.tokens = TOKENS
    db.commit()
    print(f"✅ Utente test già esistente — token resettati a {TOKENS}")
else:
    user = User(
        email=EMAIL, hashed_password=get_password_hash(PASSWORD),
        is_verified=True, verification_token=None, tokens=TOKENS,
        privacy_policy_version="1.0", terms_version="1.0",
        created_at=datetime.utcnow(), last_login_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()
    for pt in ("privacy_policy", "terms_of_service"):
        db.add(PolicyAcceptance(user_id=user.id, policy_type=pt, policy_version="1.0", accepted_at=datetime.utcnow()))
    db.add(TokenTransaction(user_id=user.id, amount=TOKENS, action="dev_seed", description="🛠️ Token sviluppo"))
    db.commit()
    print(f"✅ Utente test creato: {EMAIL} / {PASSWORD} ({TOKENS} token)")
db.close()

print(f"🚀 Avvio import Scryfall{f' (limite: {args.limit})' if args.limit else ' (completo)'}...")
stats = run_sync(limit=args.limit)

print(f"\n📊 Risultato:")
print(f"   Inserite  : {stats['inserted']}")
print(f"   Aggiornate: {stats['updated']}")
print(f"   Saltate   : {stats['skipped']}")
print(f"   Errori    : {stats['errors']}")
print(f"   Totale DB : {stats.get('total_in_db', '?')}")
