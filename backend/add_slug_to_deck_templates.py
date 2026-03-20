"""
Migration: aggiunge colonna 'slug' a deck_templates e la popola per tutti i mazzi.
Esegui con: python add_slug_to_deck_templates.py

Con 7000+ mazzi usa batch da 500 per non bloccare il DB.
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
        try:
            conn.execute(text("ALTER TABLE deck_templates ADD COLUMN slug VARCHAR"))
            conn.commit()
            print("Colonna 'slug' aggiunta a deck_templates.")
        except Exception as e:
            print(f"Colonna già esistente o errore: {e}")

        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_deck_templates_slug ON deck_templates(slug)"))
            conn.commit()
            print("Indice creato.")
        except Exception as e:
            print(f"Indice già esistente: {e}")

    db = SessionLocal()
    try:
        total_rows = db.execute(text("SELECT COUNT(*) FROM deck_templates WHERE slug IS NULL OR slug = ''")).scalar()
        print(f"Template da aggiornare: {total_rows}")

        batch_size = 500
        offset = 0
        updated = 0

        while True:
            rows = db.execute(
                text("SELECT id, name FROM deck_templates WHERE slug IS NULL OR slug = '' ORDER BY id LIMIT :limit OFFSET :offset"),
                {"limit": batch_size, "offset": offset}
            ).fetchall()

            if not rows:
                break

            for row in rows:
                base = slugify(row.name) if row.name else ""
                if not base:
                    base = "deck"
                slug = f"{base}-{row.id}"
                db.execute(
                    text("UPDATE deck_templates SET slug = :slug WHERE id = :id"),
                    {"slug": slug, "id": row.id}
                )

            db.commit()
            updated += len(rows)
            print(f"  Aggiornati {updated}/{total_rows}...")
            offset += batch_size

        print(f"✅ Completato: {updated} slug generati.")
    finally:
        db.close()

if __name__ == "__main__":
    run()
