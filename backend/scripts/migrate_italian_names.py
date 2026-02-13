"""
Script di migrazione per aggiungere supporto nomi italiani alle carte.
Da eseguire in produzione dopo il deploy del nuovo codice.

Operazioni:
1. Aggiunge colonna 'name_it' alla tabella 'cards' (se non esiste)
2. Popola name_it dal database MTG per tutte le carte esistenti
3. Pulisce nomi con newline/spazi e rimuove duplicati
4. Arricchisce mana_cost, colors e card_type mancanti

Uso:
  cd /path/to/backend
  source venv/bin/activate
  python scripts/migrate_italian_names.py

Con --dry-run per vedere cosa farebbe senza modificare:
  python scripts/migrate_italian_names.py --dry-run
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import text, or_
from app.database import SessionLocal, engine
from app.models import Card, MTGCard


def add_name_it_column():
    """Aggiunge la colonna name_it alla tabella cards se non esiste"""
    print("\n=== STEP 1: AGGIUNTA COLONNA name_it ===")
    with engine.connect() as conn:
        # Controlla se la colonna esiste già
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='cards' AND column_name='name_it'"
        ))
        if result.fetchone():
            print("  Colonna 'name_it' già presente, skip.")
        else:
            conn.execute(text("ALTER TABLE cards ADD COLUMN name_it VARCHAR"))
            conn.commit()
            print("  Colonna 'name_it' aggiunta alla tabella 'cards'.")


def clean_card_names(db, dry_run=False):
    """Pulisce nomi carte con newline o spazi extra"""
    print("\n=== STEP 2: PULIZIA NOMI CARTE ===")
    
    dirty_cards = db.query(Card).filter(Card.name.contains('\n')).all()
    print(f"  Trovate {len(dirty_cards)} carte con newline nel nome")
    
    removed = 0
    cleaned = 0
    
    for card in dirty_cards:
        clean_name = card.name.strip().replace('\n', '').replace('\r', '')
        existing = db.query(Card).filter(
            Card.name == clean_name,
            Card.collection_id == card.collection_id,
            Card.user_id == card.user_id
        ).first()
        
        if existing:
            if not dry_run:
                existing.quantity_owned += card.quantity_owned
                db.delete(card)
            removed += 1
        else:
            if not dry_run:
                card.name = clean_name
            cleaned += 1
    
    space_cards = db.query(Card).filter(
        or_(Card.name.startswith(' '), Card.name.endswith(' '))
    ).all()
    for card in space_cards:
        clean_name = card.name.strip()
        if clean_name != card.name:
            if not dry_run:
                card.name = clean_name
            cleaned += 1
    
    print(f"  Duplicati rimossi: {removed}, nomi puliti: {cleaned}")
    return removed, cleaned


def enrich_cards(db, dry_run=False):
    """Arricchisce carte con dati mancanti dal database MTG"""
    print("\n=== STEP 3: ARRICCHIMENTO DATI MANCANTI ===")
    
    cards = db.query(Card).filter(
        or_(
            Card.mana_cost == None, Card.mana_cost == '',
            Card.colors == None, Card.colors == '',
            Card.card_type == None, Card.card_type == 'Unknown', Card.card_type == ''
        )
    ).all()
    
    print(f"  Trovate {len(cards)} carte con dati mancanti")
    enriched = 0
    
    for c in cards:
        name = c.name.strip() if c.name else None
        if not name:
            continue
        mtg = db.query(MTGCard).filter(MTGCard.name == name).first()
        if not mtg:
            continue
        
        updated = False
        if not c.mana_cost and mtg.mana_cost:
            if not dry_run: c.mana_cost = mtg.mana_cost
            updated = True
        if (not c.colors or c.colors == '') and mtg.colors:
            if not dry_run: c.colors = mtg.colors
            updated = True
        if not c.card_type or c.card_type in ['Unknown', '']:
            if mtg.types:
                if not dry_run: c.card_type = mtg.types.split(',')[0].strip()
                updated = True
            elif mtg.type_line:
                type_parts = mtg.type_line.split('\u2014')[0].strip()
                if not dry_run: c.card_type = type_parts.split()[0] if type_parts else 'Unknown'
                updated = True
        if updated:
            enriched += 1
    
    print(f"  Carte arricchite: {enriched}")
    return enriched


def enrich_italian_names(db, dry_run=False):
    """Aggiunge nomi italiani a tutte le carte dalla tabella MTG"""
    print("\n=== STEP 4: NOMI ITALIANI ===")
    
    cards = db.query(Card).filter(
        or_(Card.name_it == None, Card.name_it == '')
    ).all()
    
    print(f"  Trovate {len(cards)} carte senza nome italiano")
    enriched = 0
    not_found = 0
    
    for c in cards:
        name = c.name.strip() if c.name else None
        if not name:
            continue
        mtg = db.query(MTGCard).filter(MTGCard.name == name).first()
        if not mtg or not mtg.name_it or mtg.name_it == 'None':
            not_found += 1
            continue
        if not dry_run:
            c.name_it = mtg.name_it
        enriched += 1
    
    print(f"  Nomi italiani aggiunti: {enriched}")
    print(f"  Non trovati nel DB MTG: {not_found}")
    return enriched, not_found


def main():
    dry_run = '--dry-run' in sys.argv
    
    if dry_run:
        print("*** MODALITÀ DRY-RUN: nessuna modifica verrà salvata ***\n")
    
    print("=" * 50)
    print("MIGRAZIONE: Supporto nomi italiani")
    print("=" * 50)
    
    # Step 1: non dipende da dry_run (DDL)
    if not dry_run:
        add_name_it_column()
    else:
        print("\n=== STEP 1: AGGIUNTA COLONNA name_it === (skip in dry-run)")
    
    db = SessionLocal()
    try:
        clean_card_names(db, dry_run)
        enrich_cards(db, dry_run)
        enrich_italian_names(db, dry_run)
        
        if not dry_run:
            db.commit()
            print("\n✅ Migrazione completata con successo!")
        else:
            db.rollback()
            print("\n⚠️  Dry-run completato, nessuna modifica salvata.")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Errore: {e}")
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()
