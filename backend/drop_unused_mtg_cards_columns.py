#!/usr/bin/env python3
"""
Migration per rimuovere colonne inutilizzate dalla tabella mtg_cards.

Colonne da rimuovere (mai usate nel codice):
- ID esterni: arena_id, mtgo_id, mtgo_foil_id, tcgplayer_id, cardmarket_id
- Traduzioni non usate: text_it, type_it
- Flavor: flavor_text, flavor_name
- Stats rari: defense, hand_modifier, life_modifier
- Set metadata: set_type, set_uri
- Layout/Frame: layout, border_color, frame, frame_effects, finishes
- Flags: oversized, digital, full_art, textless, story_spotlight
- Artista: artist, artist_ids, illustration_id, watermark
- Altro: color_indicator, produced_mana, games, image_status
- Prezzi rari: price_usd_etched, price_tix
- URI: scryfall_uri, rulings_uri, prints_search_uri
- JSON: card_faces

TOTALE: 38 colonne da eliminare

Colonne MANTENUTE (usate nel codice):
- Identificatori: uuid, scryfall_id, oracle_id
- Nomi: name, name_it, lang
- Mana: mana_cost, mana_value
- Colori: colors, color_identity
- Tipo: type_line, types, subtypes, supertypes
- Testo: text
- Stats: power, toughness, loyalty
- Set: set_code, set_name, collector_number, rarity, released_at
- Immagini: image_url, image_url_small, image_url_large, image_url_art_crop, image_url_border_crop
- Prezzi: price_eur, price_usd, price_eur_foil, price_usd_foil
- Altro: keywords, legalities, promo, reprint
- Sync: last_synced_at
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.database import engine

# Colonne da eliminare
COLUMNS_TO_DROP = [
    # ID esterni (5)
    'arena_id',
    'mtgo_id',
    'mtgo_foil_id',
    'tcgplayer_id',
    'cardmarket_id',
    
    # Traduzioni non usate (2)
    'text_it',
    'type_it',
    
    # Flavor (2)
    'flavor_text',
    'flavor_name',
    
    # Stats rari (3)
    'defense',
    'hand_modifier',
    'life_modifier',
    
    # Set metadata (2)
    'set_type',
    'set_uri',
    
    # Layout/Frame (5)
    'layout',
    'border_color',
    'frame',
    'frame_effects',
    'finishes',
    
    # Flags (5)
    'oversized',
    'digital',
    'full_art',
    'textless',
    'story_spotlight',
    
    # Artista (4)
    'artist',
    'artist_ids',
    'illustration_id',
    'watermark',
    
    # Altro (4)
    'color_indicator',
    'produced_mana',
    'games',
    'image_status',
    
    # Prezzi rari (2)
    'price_usd_etched',
    'price_tix',
    
    # URI (3)
    'scryfall_uri',
    'rulings_uri',
    'prints_search_uri',
    
    # JSON (1)
    'card_faces',
]

print("🗑️  Rimozione colonne inutilizzate da mtg_cards\n")
print(f"Colonne da eliminare: {len(COLUMNS_TO_DROP)}\n")

# Mostra le colonne
for i, col in enumerate(COLUMNS_TO_DROP, 1):
    print(f"  {i:2d}. {col}")

print("\n" + "=" * 80)
print("⚠️  ATTENZIONE: Questa operazione è IRREVERSIBILE!")
print("=" * 80)

response = input("\nProcedere con l'eliminazione? (yes/no): ")

if response.lower() != 'yes':
    print("\n❌ Operazione annullata.")
    sys.exit(0)

print("\n🔧 Inizio eliminazione colonne...\n")

try:
    with engine.connect() as conn:
        dropped = 0
        skipped = 0
        
        for col in COLUMNS_TO_DROP:
            try:
                print(f"Eliminando {col}...", end=" ")
                conn.execute(text(f"ALTER TABLE mtg_cards DROP COLUMN IF EXISTS {col}"))
                conn.commit()
                print("✅")
                dropped += 1
            except Exception as e:
                print(f"⚠️  Saltata ({e})")
                skipped += 1
        
        print("\n" + "=" * 80)
        print("✅ Migration completata!")
        print(f"   Colonne eliminate: {dropped}")
        print(f"   Colonne saltate: {skipped}")
        print("=" * 80)
        
        # Calcola spazio risparmiato (stima)
        with conn.begin():
            result = conn.execute(text("SELECT COUNT(*) FROM mtg_cards"))
            total_cards = result.scalar()
        
        # Stima: ~50 bytes per colonna in media
        estimated_space_mb = (dropped * total_cards * 50) / (1024 * 1024)
        print(f"\n💾 Spazio stimato risparmiato: ~{estimated_space_mb:.1f} MB")
        print(f"   (basato su {total_cards:,} carte nel database)")
        
        print("\n📝 IMPORTANTE:")
        print("   1. Aggiorna anche app/models.py per rimuovere i campi dal modello MTGCard")
        print("   2. Aggiorna app/services/scryfall_sync.py per non mappare più questi campi")
        print("   3. Esegui VACUUM FULL (PostgreSQL) per recuperare lo spazio su disco")
        
except Exception as e:
    print(f"\n❌ Migration fallita: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
