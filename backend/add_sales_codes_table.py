"""Crea la tabella sales_codes nel database e aggiunge sales_code_id agli utenti"""
import sys
sys.path.insert(0, '/var/www/magicdeckgen/backend')

from app.database import engine
from app.models import Base, SalesCode
from sqlalchemy import text

# Crea solo la tabella sales_codes se non esiste
SalesCode.__table__.create(bind=engine, checkfirst=True)
print("✅ Tabella sales_codes creata (o già esistente)")

# Aggiunge la colonna sales_code_id alla tabella users se non esiste
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN sales_code_id INTEGER REFERENCES sales_codes(id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_sales_code_id ON users(sales_code_id)"))
        conn.commit()
        print("✅ Colonna sales_code_id aggiunta alla tabella users")
    except Exception as e:
        if 'already exists' in str(e).lower() or 'duplicate column' in str(e).lower():
            print("ℹ️  Colonna sales_code_id già presente")
        else:
            raise

# Esempio: inserisci un codice di test
from sqlalchemy.orm import Session
with Session(engine) as db:
    existing = db.query(SalesCode).filter(SalesCode.code == "YOUTUBE2024").first()
    if not existing:
        code = SalesCode(
            code="YOUTUBE2024",
            description="Codice esempio per youtuber",
            bonus_tokens=200,
            is_active=True
        )
        db.add(code)
        db.commit()
        print("✅ Codice YOUTUBE2024 inserito come esempio")
    else:
        print("ℹ️  Codice YOUTUBE2024 già presente")
