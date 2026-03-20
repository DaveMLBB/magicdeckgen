"""
Migration: aggiunge colonna 'slug' a saved_decks e la popola per i mazzi esistenti.
Esegui con: python add_slug_to_saved_decks.py
"""
import re
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal
from sqlalchemy import text

def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')

def run():
    with engine.connect() as conn:
        # Add slug column if not exists
        try:
            conn.execute(text("ALTER TABLE saved_decks ADD COLUMN slug VARCHAR"))
            conn.commit()
            print("Colonna 'slug' aggiunta.")
        except Exception as e:
            print(f"Colonna già esistente o errore: {e}")

    db = SessionLocal()
    try:
        rows = db.execute(text("SELECT id, name FROM saved_decks WHERE slug IS NULL OR slug = ''")).fetchall()
        print(f"Mazzi da aggiornare: {len(rows)}")

        slug_counts = {}
        for row in rows:
            base = slugify(row.name)
            if not base:
                base = f"deck-{row.id}"
            # Ensure uniqueness by appending deck id
            slug = f"{base}-{row.id}"
            db.execute(text("UPDATE saved_decks SET slug = :slug WHERE id = :id"), {"slug": slug, "id": row.id})
            slug_counts[slug] = row.id

        db.commit()
        print(f"Aggiornati {len(rows)} slug.")
    finally:
        db.close()

if __name__ == "__main__":
    run()
