"""
Migration: aggiunge colonne 'is_public' e 'share_token' a card_collections.
Esegui con: python add_collection_sharing.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE card_collections ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE"))
            conn.commit()
            print("Colonna 'is_public' aggiunta.")
        except Exception as e:
            print(f"'is_public' già esistente o errore: {e}")

        try:
            conn.execute(text("ALTER TABLE card_collections ADD COLUMN share_token VARCHAR"))
            conn.commit()
            print("Colonna 'share_token' aggiunta.")
        except Exception as e:
            print(f"'share_token' già esistente o errore: {e}")

        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_card_collections_share_token ON card_collections (share_token)"))
            conn.commit()
            print("Indice su 'share_token' creato.")
        except Exception as e:
            print(f"Indice già esistente o errore: {e}")

    print("Migration completata.")

if __name__ == "__main__":
    run()
