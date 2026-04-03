#!/usr/bin/env python3
"""
Migration: Ripristina le colonne eliminate da mtg_cards per supporto completo multilingua.

Questo script ripristina tutte le colonne precedentemente eliminate per permettere
il caricamento completo dei dati Scryfall in tutte le lingue e con tutti i metadati.

Eseguire con:
    python restore_mtg_cards_columns.py

ATTENZIONE: Eseguire PRIMA sul database di sviluppo per test!
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from pathlib import Path

# Setup path
BACKEND_DIR = Path(__file__).parent
sys.path.insert(0, str(BACKEND_DIR))

# Carica variabili d'ambiente
load_dotenv(BACKEND_DIR / ".env")

def restore_columns():
    """Ripristina le colonne eliminate dalla tabella mtg_cards."""
    
    # Leggi DATABASE_URL da env
    DATABASE_URL = os.environ.get(
        "DATABASE_URL",
        "postgresql://magicdeckgen:magicdeckgen_dev@localhost:5434/magicdeckgen"
    )
    
    engine = create_engine(DATABASE_URL)
    
    print("=" * 80)
    print("RIPRISTINO COLONNE mtg_cards - Supporto Multilingua Completo")
    print("=" * 80)
    print()
    
    # Lista delle colonne da ripristinare
    columns_to_restore = [
        # ID esterni (per integrazione con altre piattaforme)
        ("arena_id", "INTEGER"),
        ("mtgo_id", "INTEGER"),
        ("mtgo_foil_id", "INTEGER"),
        ("tcgplayer_id", "INTEGER"),
        ("cardmarket_id", "INTEGER"),
        
        # Traduzioni (ESSENZIALI per multilingua)
        ("text_it", "TEXT"),
        ("type_it", "TEXT"),
        
        # Testo aggiuntivo
        ("flavor_text", "TEXT"),
        ("flavor_name", "TEXT"),
        
        # Stats aggiuntive
        ("defense", "TEXT"),
        ("hand_modifier", "TEXT"),
        ("life_modifier", "TEXT"),
        
        # Set metadata
        ("set_type", "TEXT"),
        ("set_uri", "TEXT"),
        
        # Layout e frame
        ("layout", "TEXT"),
        ("border_color", "TEXT"),
        ("frame", "TEXT"),
        ("frame_effects", "TEXT"),
        ("finishes", "TEXT"),
        
        # Flags
        ("oversized", "BOOLEAN"),
        ("digital", "BOOLEAN"),
        ("full_art", "BOOLEAN"),
        ("textless", "BOOLEAN"),
        ("story_spotlight", "BOOLEAN"),
        
        # Artista
        ("artist", "TEXT"),
        ("artist_ids", "TEXT"),
        ("illustration_id", "TEXT"),
        ("watermark", "TEXT"),
        
        # Colori e mana
        ("color_indicator", "TEXT"),
        ("produced_mana", "TEXT"),
        
        # Piattaforme
        ("games", "TEXT"),
        
        # Immagini
        ("image_status", "TEXT"),
        
        # Prezzi
        ("price_usd_etched", "NUMERIC"),
        ("price_tix", "NUMERIC"),
        
        # URI
        ("scryfall_uri", "TEXT"),
        ("rulings_uri", "TEXT"),
        ("prints_search_uri", "TEXT"),
        
        # Double-faced cards (JSON)
        ("card_faces", "TEXT"),
    ]
    
    print(f"📋 Colonne da ripristinare: {len(columns_to_restore)}")
    print()
    
    with engine.connect() as conn:
        for col_name, col_type in columns_to_restore:
            try:
                # Verifica se la colonna esiste già
                check_sql = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'mtg_cards' 
                    AND column_name = :col_name
                """)
                result = conn.execute(check_sql, {"col_name": col_name})
                exists = result.fetchone() is not None
                
                if exists:
                    print(f"⏭️  {col_name:25} - già presente, skip")
                else:
                    # Aggiungi la colonna
                    alter_sql = text(f"ALTER TABLE mtg_cards ADD COLUMN {col_name} {col_type}")
                    conn.execute(alter_sql)
                    conn.commit()
                    print(f"✅ {col_name:25} - ripristinata ({col_type})")
                    
            except Exception as e:
                print(f"❌ {col_name:25} - errore: {e}")
                conn.rollback()
    
    print()
    print("=" * 80)
    print("✅ Ripristino completato!")
    print("=" * 80)
    print()
    print("Prossimi passi:")
    print("1. Aggiornare il modello MTGCard in app/models.py")
    print("2. Aggiornare scryfall_sync.py per mappare tutti i campi")
    print("3. Implementare sync multilingua")
    print("4. Eseguire sync completo da Scryfall")
    print()

if __name__ == "__main__":
    restore_columns()
