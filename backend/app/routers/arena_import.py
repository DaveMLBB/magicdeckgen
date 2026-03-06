from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Card, User, CardCollection, MTGCard
from app.routers.tokens import consume_token
import re
from datetime import datetime

router = APIRouter()

# Pattern per estrarre le carte dalla sezione Inventory del log di Arena
# Riga tipica: "Completed  Draft  (all  0  sets) (Event_PlayerDraft_...) > ...
# La sezione inventory del Player.log ha righe tipo:
#   <PlayerName> <SetCode> <CollectorNumber> <Quantity>
# oppure il formato moderno del log:
#   Inventory.Updated ... "Cards":{"12345":4,"67890":2}
# Usiamo regex multipli per supportare entrambi i formati

ARENA_LOG_CARD_PATTERN = re.compile(
    r'"Cards"\s*:\s*(\{[^}]+\})',
    re.DOTALL
)

ARENA_LOG_INVENTORY_PATTERN = re.compile(
    r'<Duel\.Announce>.*?inventory.*?"cards"\s*:\s*\{([^}]*)\}',
    re.IGNORECASE | re.DOTALL
)

# Pattern per il formato testo esportato da Arena (Collection export)
# "4 Lightning Bolt (M10) 147"
ARENA_EXPORT_LINE = re.compile(
    r'^(\d+)\s+(.+?)\s+\([A-Z0-9]{2,6}\)\s+\d+\s*$'
)

# Pattern semplice: "4 Lightning Bolt"
SIMPLE_LINE = re.compile(r'^(\d+)\s+(.+)$')


def parse_arena_log(content: str) -> dict[str, int]:
    """
    Parsa il file Player.log di Arena ed estrae le carte con le quantità.
    Supporta:
    1. Formato JSON "Cards":{"arenaId":qty,...} (log completo)
    2. Formato export testuale Arena: "4 Lightning Bolt (M10) 147"
    3. Formato semplice: "4 Lightning Bolt"
    """
    cards: dict[str, int] = {}

    # Strategia 1: cerca blocchi JSON "Cards":{...} nel log
    # Prendiamo l'ultimo trovato (il più aggiornato)
    json_matches = list(ARENA_LOG_CARD_PATTERN.finditer(content))
    if json_matches:
        last_match = json_matches[-1]
        cards_json_str = last_match.group(1)
        # Estrai coppie "arenaId": qty
        id_qty_pairs = re.findall(r'"(\d+)"\s*:\s*(\d+)', cards_json_str)
        if id_qty_pairs:
            # In questo caso abbiamo solo gli Arena ID, non i nomi
            # Restituiamo un dizionario speciale da gestire separatamente
            return {"__arena_ids__": {aid: int(qty) for aid, qty in id_qty_pairs}}

    # Strategia 2: formato export testuale Arena
    # "4 Lightning Bolt (M10) 147"
    lines = content.splitlines()
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#') or line.startswith('//'):
            continue

        # Formato export Arena con set code
        m = ARENA_EXPORT_LINE.match(line)
        if m:
            qty = int(m.group(1))
            name = m.group(2).strip()
            if name:
                cards[name] = cards.get(name, 0) + qty
            continue

        # Formato semplice "4 CardName"
        m = SIMPLE_LINE.match(line)
        if m:
            qty = int(m.group(1))
            name = m.group(2).strip()
            # Ignora righe che sembrano metadati
            if name and len(name) > 1 and not name.startswith('{'):
                cards[name] = cards.get(name, 0) + qty

    return cards


@router.post("/import-log")
async def import_arena_log(
    user_id: int,
    collection_name: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Parsa il file Player.log di Magic Arena ed crea una nuova collezione
    con tutte le carte trovate nel log.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Leggi il contenuto del file
    try:
        raw = await file.read()
        try:
            content = raw.decode('utf-8', errors='replace')
        except Exception:
            content = raw.decode('latin-1', errors='replace')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Errore lettura file: {str(e)}")

    if len(content) < 10:
        raise HTTPException(status_code=400, detail="File vuoto o non valido")

    # Parsa le carte
    parsed = parse_arena_log(content)

    if not parsed:
        raise HTTPException(
            status_code=400,
            detail="Nessuna carta trovata nel file. Assicurati di aver abilitato i registri dettagliati in Arena e di aver visitato la tua Collezione dopo il riavvio."
        )

    # Se abbiamo Arena ID invece di nomi, gestiscili tramite DB MTG
    if "__arena_ids__" in parsed:
        arena_ids_map = parsed["__arena_ids__"]
        cards_by_name: dict[str, int] = {}

        for arena_id, qty in arena_ids_map.items():
            mtg_card = db.query(MTGCard).filter(
                MTGCard.arena_id == int(arena_id)
            ).first()
            if mtg_card:
                name = mtg_card.name
                cards_by_name[name] = cards_by_name.get(name, 0) + qty
            # Se non trovato, lo saltiamo (carta non nel nostro DB)

        if not cards_by_name:
            raise HTTPException(
                status_code=400,
                detail="Carte trovate nel log ma non nel database. Il file potrebbe non essere un log di Arena valido."
            )
        parsed = cards_by_name

    # Controlla nome collezione duplicato
    coll_name = collection_name.strip() or f"Arena Import {datetime.utcnow().strftime('%d/%m/%Y %H:%M')}"
    existing = db.query(CardCollection).filter(
        CardCollection.user_id == user_id,
        CardCollection.name == coll_name
    ).first()
    if existing:
        # Aggiungi timestamp per evitare duplicati
        coll_name = f"{coll_name} ({datetime.utcnow().strftime('%d/%m %H:%M')})"

    # Consuma 1 token
    consume_token(user, 'collection', f'Arena import: {coll_name}', db)

    # Crea la collezione
    new_collection = CardCollection(
        name=coll_name,
        description="Importata da Magic Arena (Player.log)",
        user_id=user_id
    )
    db.add(new_collection)
    db.flush()

    # Aggiungi le carte, arricchendo dal DB MTG se possibile
    cards_added = 0
    cards_enriched = 0
    cards_skipped = 0

    for card_name, qty in parsed.items():
        if not card_name or qty <= 0:
            continue

        # Cerca nel DB MTG per arricchire i metadati
        mtg_card = db.query(MTGCard).filter(
            MTGCard.name == card_name
        ).first()

        card_type = 'Unknown'
        mana_cost = None
        colors = None

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
        "cards_skipped": cards_skipped,
        "tokens_remaining": user.tokens
    }
