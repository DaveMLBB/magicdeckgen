"""Migration: aggiunge colonna set_code alla tabella cards."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from sqlalchemy import text
from app.database import engine

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE cards ADD COLUMN IF NOT EXISTS set_code VARCHAR"))
        conn.commit()
        print("✅ Colonna set_code aggiunta alla tabella cards")
    except Exception as e:
        if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
            print("ℹ️  Colonna set_code già esistente")
        else:
            raise
