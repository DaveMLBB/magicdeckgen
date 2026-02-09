import os
import sys

# Aggiungi il percorso del backend al PYTHONPATH
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from sqlalchemy import text
from app.database import engine

print("🔧 Aggiunta colonna collection_id alla tabella saved_decks")

with engine.connect() as conn:
    try:
        # Aggiungi la colonna collection_id
        conn.execute(text("""
            ALTER TABLE saved_decks 
            ADD COLUMN collection_id INTEGER REFERENCES card_collections(id)
        """))
        conn.commit()
        print("✅ Colonna collection_id aggiunta con successo!")
    except Exception as e:
        if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
            print("ℹ️  Colonna collection_id già esistente")
        else:
            print(f"❌ Errore: {e}")
            raise
