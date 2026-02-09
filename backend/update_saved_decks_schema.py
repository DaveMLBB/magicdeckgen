import os
import sys

# Aggiungi il percorso del backend al PYTHONPATH
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from sqlalchemy import text
from app.database import engine

print("🔧 Aggiornamento schema saved_decks")

with engine.connect() as conn:
    try:
        # 1. Rimuovi la colonna collection_id (sostituita da tabella many-to-many)
        print("1. Rimozione colonna collection_id...")
        try:
            conn.execute(text("ALTER TABLE saved_decks DROP COLUMN collection_id"))
            print("   ✅ Colonna collection_id rimossa")
        except Exception as e:
            if "no such column" in str(e).lower():
                print("   ℹ️  Colonna collection_id non esistente")
            else:
                print(f"   ⚠️  Errore rimozione: {e}")
        
        # 2. Aggiungi colonna is_public
        print("2. Aggiunta colonna is_public...")
        try:
            conn.execute(text("ALTER TABLE saved_decks ADD COLUMN is_public BOOLEAN DEFAULT 0"))
            print("   ✅ Colonna is_public aggiunta")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print("   ℹ️  Colonna is_public già esistente")
            else:
                print(f"   ⚠️  Errore: {e}")
        
        # 3. Crea tabella saved_deck_collections (many-to-many)
        print("3. Creazione tabella saved_deck_collections...")
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS saved_deck_collections (
                    deck_id INTEGER NOT NULL,
                    collection_id INTEGER NOT NULL,
                    PRIMARY KEY (deck_id, collection_id),
                    FOREIGN KEY (deck_id) REFERENCES saved_decks(id) ON DELETE CASCADE,
                    FOREIGN KEY (collection_id) REFERENCES card_collections(id) ON DELETE CASCADE
                )
            """))
            print("   ✅ Tabella saved_deck_collections creata")
        except Exception as e:
            print(f"   ⚠️  Errore: {e}")
        
        conn.commit()
        print("\n✅ Schema aggiornato con successo!")
        
    except Exception as e:
        print(f"\n❌ Errore generale: {e}")
        raise
