from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Card, User, CardCollection
from app.routers.tokens import consume_token
import re
import json
import os
from datetime import datetime

router = APIRouter()

# ---------------------------------------------------------------------------
# Caricamento database Scryfall (arena_id -> card info)
# Il file JSON e' nella root del backend (stessa cartella di run.py)
# ---------------------------------------------------------------------------
_SCRYFALL_DB: dict = {}       # arena_id -> card info
_SCRYFALL_BY_NAME: dict = {}  # name -> card info (primo trovato)

def _load_scryfall_db():
    global _SCRYFALL_DB
    if _SCRYFALL_DB:
        return  # gia' caricato

    # Cerca il file JSON nella cartella backend (un livello sopra /app)
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    candidates = [
        os.path.join(base_dir, f)
        for f in os.listdir(base_dir)
        if f.startswith('default-cards') and f.endswith('.json')
    ]
    if not candidates:
        return  # file non trovato, fallback al DB SQL

    json_path = candidates[0]
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            cards_data = json.load(f)
        for card in cards_data:
            colors = card.get('colors', [])
            type_line = card.get('type_line', '')
            name = card.get('name', 'Unknown')
            info = {
                'name': name,
                'set': card.get('set', '').upper(),
                'rarity': card.get('rarity', 'unknown'),
                'colors': ','.join(colors) if colors else None,
                'type_line': type_line,
                'mana_cost': card.get('mana_cost', ''),
                'cmc': card.get('cmc', 0),
            }
            arena_id = card.get('arena_id')
            if arena_id:
                _SCRYFALL_DB[str(arena_id)] = info
            if name not in _SCRYFALL_BY_NAME:
                _SCRYFALL_BY_NAME[name] = info
    except Exception:
        pass  # fallback al DB SQL


# ---------------------------------------------------------------------------
# Regex per formati testuali
# ---------------------------------------------------------------------------
# "4 Lightning Bolt (M10) 147"
_ARENA_EXPORT_LINE = re.compile(r'^(\d+)\s+(.+?)\s+\([A-Z0-9]{2,6}\)\s+\d+\s*$')
# "4 Lightning Bolt"
_SIMPLE_LINE = re.compile(r'^(\d+)\s+(.+)$')


# ---------------------------------------------------------------------------
# Parser principale
# ---------------------------------------------------------------------------
def parse_arena_log(content: str) -> dict:
    """
    Parsa il Player.log di Arena ed estrae le carte con le quantita'.
    Strategia 1: JSON InventoryInfo > Decks (formato reale del log Arena)
    Strategia 2: formato export testuale "4 Lightning Bolt (M10) 147"
    Strategia 3: formato semplice "4 Lightning Bolt"
    """
    # Strategia 1: blocco JSON InventoryInfo
    match = re.search(r'\{"InventoryInfo".*', content)
    if match:
        try:
            data = json.loads(match.group(0))
            decks = data.get('Decks', {})
            if decks:
                all_cards: dict = {}
                for deck in decks.values():
                    for section in ['MainDeck', 'Sideboard', 'CommandZone', 'Companions']:
                        for entry in deck.get(section, []):
                            if isinstance(entry, dict):
                                card_id = str(entry.get('cardId', ''))
                                quantity = entry.get('quantity', 1)
                                if card_id:
                                    all_cards[card_id] = max(all_cards.get(card_id, 0), quantity)
                if all_cards:
                    return {'__arena_ids__': all_cards}
        except Exception:
            pass

    # Strategia 2 & 3: formato testuale
    cards: dict = {}
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith('#') or line.startswith('//'):
            continue
        m = _ARENA_EXPORT_LINE.match(line)
        if m:
            qty, name = int(m.group(1)), m.group(2).strip()
            if name:
                cards[name] = cards.get(name, 0) + qty
            continue
        m = _SIMPLE_LINE.match(line)
        if m:
            qty, name = int(m.group(1)), m.group(2).strip()
            if name and len(name) > 1 and not name.startswith('{'):
                cards[name] = cards.get(name, 0) + qty

    return cards


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@router.post("/import-log")
async def import_arena_log(
    user_id: int,
    collection_name: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        raw = await file.read()
        content = raw.decode('utf-8', errors='replace')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Errore lettura file: {str(e)}")

    if len(content) < 10:
        raise HTTPException(status_code=400, detail="File vuoto o non valido")

    parsed = parse_arena_log(content)

    if not parsed:
        raise HTTPException(
            status_code=400,
            detail="Nessuna carta trovata nel file. Il Player.log di Arena contiene solo le carte presenti nei mazzi costruiti, non l'intera collezione. Per importare la collezione completa, usa un file CSV/Excel."
        )

    # Risolvi Arena ID -> nome carta
    if '__arena_ids__' in parsed:
        _load_scryfall_db()
        arena_ids_map = parsed['__arena_ids__']
        cards_by_name: dict = {}

        for arena_id, qty in arena_ids_map.items():
            if _SCRYFALL_DB and arena_id in _SCRYFALL_DB:
                # Usa il JSON Scryfall (piu' veloce e completo)
                name = _SCRYFALL_DB[arena_id]['name']
                cards_by_name[name] = cards_by_name.get(name, 0) + qty
            # Nota: non c'e' fallback al DB SQL perche' MTGCard non ha la colonna arena_id

        if not cards_by_name:
            raise HTTPException(
                status_code=400,
                detail="Carte trovate nel log ma non nel database Scryfall. Il file potrebbe non essere un log di Arena valido."
            )
        parsed = cards_by_name

    # Gestione nome collezione duplicato
    coll_name = collection_name.strip() or f"Arena Import {datetime.utcnow().strftime('%d/%m/%Y %H:%M')}"
    existing = db.query(CardCollection).filter(
        CardCollection.user_id == user_id,
        CardCollection.name == coll_name
    ).first()
    if existing:
        coll_name = f"{coll_name} ({datetime.utcnow().strftime('%d/%m %H:%M')})"

    consume_token(user, 'collection', f'Arena import: {coll_name}', db)

    new_collection = CardCollection(
        name=coll_name,
        description="Importata da Magic Arena (Player.log) — contiene le carte presenti nei mazzi costruiti",
        user_id=user_id
    )
    db.add(new_collection)
    db.flush()

    cards_added = 0
    cards_enriched = 0

    for card_name, qty in parsed.items():
        if not card_name or qty <= 0:
            continue

        card_type = 'Unknown'
        mana_cost = None
        colors = None

        # Arricchisci dai dati Scryfall se disponibili
        scryfall_info = _SCRYFALL_BY_NAME.get(card_name)

        if scryfall_info:
            type_line = scryfall_info.get('type_line', '')
            if type_line:
                card_type = type_line.split('—')[0].strip().split()[-1] if type_line else 'Unknown'
            mana_cost = scryfall_info.get('mana_cost') or None
            colors = scryfall_info.get('colors') or None
            cards_enriched += 1
        else:
            # Fallback al DB SQL
            from app.models import MTGCard
            mtg_card = db.query(MTGCard).filter(MTGCard.name == card_name).first()
            if mtg_card:
                if mtg_card.types:
                    card_type = mtg_card.types.split(',')[0].strip()
                elif mtg_card.type_line:
                    type_parts = mtg_card.type_line.split('—')[0].strip()
                    card_type = type_parts.split()[0] if type_parts else 'Unknown'
                mana_cost = mtg_card.mana_cost
                colors = mtg_card.colors
                cards_enriched += 1

        new_card = Card(
            name=card_name,
            mana_cost=mana_cost,
            card_type=card_type,
            colors=colors,
            quantity_owned=qty,
            user_id=user_id,
            collection_id=new_collection.id
        )
        db.add(new_card)
        cards_added += 1

    if cards_added == 0:
        db.rollback()
        raise HTTPException(status_code=400, detail="Nessuna carta valida trovata nel file.")

    db.commit()
    db.refresh(new_collection)

    return {
        "success": True,
        "collection_id": new_collection.id,
        "collection_name": new_collection.name,
        "cards_added": cards_added,
        "cards_enriched": cards_enriched,
        "cards_skipped": 0,
        "tokens_remaining": user.tokens
    }
