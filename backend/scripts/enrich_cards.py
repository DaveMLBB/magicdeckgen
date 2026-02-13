"""
Script per arricchire le carte nella tabella 'cards' con dati dal database MTG.
- Aggiunge mana_cost, colors e card_type mancanti
- Aggiunge nomi italiani (name_it) dal database MTG
- Rimuove duplicati con newline nel nome
- Pulisce nomi con spazi/newline

Uso:
  cd /path/to/backend
  source venv/bin/activate
  python scripts/enrich_cards.py

Oppure con --dry-run per vedere cosa farebbe senza modificare:
  python scripts/enrich_cards.py --dry-run
"""

import sys
import os

# Aggiungi il path del backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import or_, func
from app.database import SessionLocal
from app.models import Card, MTGCard


def clean_card_names(db, dry_run=False):
    """Pulisce nomi carte con newline o spazi extra"""
    print("\n=== PULIZIA NOMI CARTE ===")
    
    # Trova carte con newline nel nome
    dirty_cards = db.query(Card).filter(Card.name.contains('\n')).all()
    print(f"Trovate {len(dirty_cards)} carte con newline nel nome")
    
    removed = 0
    cleaned = 0
    
    for card in dirty_cards:
        clean_name = card.name.strip().replace('\n', '').replace('\r', '')
        
        # Controlla se esiste già una carta con il nome pulito nella stessa collezione
        existing = db.query(Card).filter(
            Card.name == clean_name,
            Card.collection_id == card.collection_id,
            Card.user_id == card.user_id
        ).first()
        
        if existing:
            # Somma la quantità al duplicato esistente e rimuovi questo
            if not dry_run:
                existing.quantity_owned += card.quantity_owned
                db.delete(card)
            removed += 1
            print(f"  Rimosso duplicato: '{card.name.strip()[:40]}' (qty {card.quantity_owned} -> sommato a esistente)")
        else:
            # Pulisci il nome
            if not dry_run:
                card.name = clean_name
            cleaned += 1
            print(f"  Pulito nome: '{clean_name[:40]}'")
    
    # Trova carte con spazi extra
    space_cards = db.query(Card).filter(
        or_(
            Card.name.startswith(' '),
            Card.name.endswith(' ')
        )
    ).all()
    
    for card in space_cards:
        clean_name = card.name.strip()
        if clean_name != card.name:
            if not dry_run:
                card.name = clean_name
            cleaned += 1
    
    if space_cards:
        print(f"  Puliti {len(space_cards)} nomi con spazi extra")
    
    print(f"Risultato: {removed} duplicati rimossi, {cleaned} nomi puliti")
    return removed, cleaned


def enrich_cards(db, dry_run=False):
    """Arricchisce carte con dati mancanti dal database MTG"""
    print("\n=== ARRICCHIMENTO CARTE ===")
    
    # Trova carte con dati mancanti
    cards = db.query(Card).filter(
        or_(
            Card.mana_cost == None,
            Card.mana_cost == '',
            Card.colors == None,
            Card.colors == '',
            Card.card_type == None,
            Card.card_type == 'Unknown',
            Card.card_type == ''
        )
    ).all()
    
    print(f"Trovate {len(cards)} carte con dati mancanti")
    
    enriched = 0
    not_found = 0
    
    for c in cards:
        name = c.name.strip() if c.name else None
        if not name:
            continue
        
        mtg = db.query(MTGCard).filter(MTGCard.name == name).first()
        if not mtg:
            not_found += 1
            continue
        
        updated = False
        
        # Arricchisci mana_cost
        if not c.mana_cost and mtg.mana_cost:
            if not dry_run:
                c.mana_cost = mtg.mana_cost
            updated = True
        
        # Arricchisci colors
        if (not c.colors or c.colors == '') and mtg.colors:
            if not dry_run:
                c.colors = mtg.colors
            updated = True
        
        # Arricchisci card_type
        if not c.card_type or c.card_type in ['Unknown', '']:
            if mtg.types:
                if not dry_run:
                    c.card_type = mtg.types.split(',')[0].strip()
                updated = True
            elif mtg.type_line:
                type_parts = mtg.type_line.split('\u2014')[0].strip()
                if not dry_run:
                    c.card_type = type_parts.split()[0] if type_parts else 'Unknown'
                updated = True
        
        if updated:
            enriched += 1
            if enriched <= 10:
                print(f"  Arricchita: {name} -> type={c.card_type}, mana={c.mana_cost}, colors={c.colors}")
    
    if enriched > 10:
        print(f"  ... e altre {enriched - 10} carte")
    
    print(f"Risultato: {enriched} carte arricchite, {not_found} non trovate nel DB MTG")
    return enriched, not_found


def enrich_italian_names(db, dry_run=False):
    """Aggiunge nomi italiani a tutte le carte dalla tabella MTG"""
    print("\n=== NOMI ITALIANI ===")
    
    # Trova carte senza nome italiano
    cards = db.query(Card).filter(
        or_(Card.name_it == None, Card.name_it == '')
    ).all()
    
    print(f"Trovate {len(cards)} carte senza nome italiano")
    
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
        if enriched <= 10:
            print(f"  {name} -> {mtg.name_it}")
    
    if enriched > 10:
        print(f"  ... e altre {enriched - 10} carte")
    
    print(f"Risultato: {enriched} nomi italiani aggiunti, {not_found} non trovati")
    return enriched, not_found


def main():
    dry_run = '--dry-run' in sys.argv
    
    if dry_run:
        print("*** MODALITÀ DRY-RUN: nessuna modifica verrà salvata ***")
    
    print("Connessione al database...")
    db = SessionLocal()
    
    try:
        removed, cleaned = clean_card_names(db, dry_run)
        enriched, not_found = enrich_cards(db, dry_run)
        it_enriched, it_not_found = enrich_italian_names(db, dry_run)
        
        if not dry_run:
            db.commit()
            print("\n✅ Modifiche salvate nel database")
        else:
            db.rollback()
            print("\n⚠️  Dry-run completato, nessuna modifica salvata")
        
        print(f"\n=== RIEPILOGO ===")
        print(f"  Duplicati rimossi: {removed}")
        print(f"  Nomi puliti: {cleaned}")
        print(f"  Carte arricchite: {enriched}")
        print(f"  Nomi italiani aggiunti: {it_enriched}")
        print(f"  Non trovate in MTG DB: {not_found}")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Errore: {e}")
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()
