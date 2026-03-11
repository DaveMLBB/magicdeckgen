"""
Card Scanner endpoint — ricerca per nome nel DB Scryfall locale.
Nessuna AI esterna: il frontend fa OCR con Tesseract.js e manda il testo grezzo.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models import User, Card, CardCollection, MTGCard, TokenTransaction

router = APIRouter()

SCANS_PER_TOKEN = 25  # ogni 25 carte aggiunte scala 1 token


# ── Input models ──────────────────────────────────────────────────────────────

class CardLookupInput(BaseModel):
    """Cerca una carta per nome (testo OCR grezzo) nel DB locale."""
    raw_name: str              # testo letto dall'OCR, può essere sporco
    set_code: Optional[str] = None   # set code letto dall'OCR se disponibile
    language: str = "en"


class CardAddInput(BaseModel):
    """Aggiunge una carta alla collezione con quantità scelta dall'utente."""
    user_id: int
    collection_id: int
    card_uuid: str             # uuid della carta trovata nel DB
    quantity: int = 1


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/lookup")
def lookup_card(input_data: CardLookupInput, db: Session = Depends(get_db)):
    """
    Cerca una carta nel DB Scryfall per nome grezzo (output OCR).
    1. Cerca corrispondenza esatta (case-insensitive)
    2. Se non trovata, cerca per nome italiano
    3. Se non trovata, cerca per corrispondenza parziale
    Restituisce le prime 5 corrispondenze con dati completi.
    """
    raw = input_data.raw_name.strip()
    if not raw or len(raw) < 2:
        return {"found": False, "candidates": []}

    set_code = (input_data.set_code or "").strip().lower() or None

    # 1. Corrispondenza esatta sul nome inglese
    candidates = _search_by_name(db, raw, set_code, exact=True)

    # 2. Corrispondenza esatta sul nome italiano
    if not candidates:
        candidates = _search_by_name_it(db, raw, set_code, exact=True)

    # 3. Corrispondenza parziale inglese
    if not candidates:
        candidates = _search_by_name(db, raw, set_code, exact=False)

    # 4. Corrispondenza parziale italiano
    if not candidates:
        candidates = _search_by_name_it(db, raw, set_code, exact=False)

    if not candidates:
        return {"found": False, "candidates": [], "raw_name": raw}

    return {
        "found": True,
        "candidates": [_card_to_dict(c) for c in candidates[:5]],
        "raw_name": raw,
    }


@router.post("/add")
def add_card_to_collection(input_data: CardAddInput, db: Session = Depends(get_db)):
    """
    Aggiunge N copie di una carta alla collezione.
    Incrementa se già presente, crea altrimenti.
    Scala 1 token ogni SCANS_PER_TOKEN carte aggiunte.
    """
    user = db.query(User).filter(User.id == input_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    collection = db.query(CardCollection).filter(
        CardCollection.id == input_data.collection_id,
        CardCollection.user_id == input_data.user_id
    ).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    mtg = db.query(MTGCard).filter(MTGCard.uuid == input_data.card_uuid).first()
    if not mtg:
        raise HTTPException(status_code=404, detail="Card not found in DB")

    qty = max(1, input_data.quantity)

    # Upsert nella collezione
    existing = db.query(Card).filter(
        Card.user_id == input_data.user_id,
        Card.collection_id == input_data.collection_id,
        Card.name == mtg.name,
    ).first()

    if existing:
        existing.quantity_owned += qty
        db.commit()
        db.refresh(existing)
        card_entry = existing
    else:
        card_entry = Card(
            name=mtg.name,
            name_it=mtg.name_it,
            mana_cost=mtg.mana_cost,
            card_type=_extract_main_type(mtg.type_line),
            colors=mtg.colors,
            rarity=mtg.rarity,
            quantity_owned=qty,
            user_id=input_data.user_id,
            collection_id=input_data.collection_id,
        )
        db.add(card_entry)
        db.commit()
        db.refresh(card_entry)

    # Contatore scan e token
    if user.scan_count is None:
        user.scan_count = 0
    prev = user.scan_count
    user.scan_count += qty
    token_consumed = 0
    for i in range(qty):
        if (prev + i + 1) % SCANS_PER_TOKEN == 0 and user.tokens > 0:
            user.tokens -= 1
            token_consumed += 1
            db.add(TokenTransaction(
                user_id=user.id, amount=-1, action='card_scan',
                description=f'📷 Scan: {prev + i + 1} carte aggiunte',
            ))
    db.commit()

    return {
        "added": True,
        "card_name": mtg.name,
        "set_code": mtg.set_code,
        "set_name": mtg.set_name,
        "image_url": mtg.image_url,
        "rarity": mtg.rarity,
        "price_eur": mtg.price_eur,
        "price_usd": mtg.price_usd,
        "quantity_owned": card_entry.quantity_owned,
        "scan_count": user.scan_count,
        "tokens_remaining": user.tokens,
        "token_consumed": token_consumed,
        "scans_to_next_token": SCANS_PER_TOKEN - (user.scan_count % SCANS_PER_TOKEN),
    }


@router.get("/sets")
def get_available_sets(db: Session = Depends(get_db)):
    """Restituisce tutti i set disponibili nel DB (per il dropdown espansione)."""
    rows = db.query(MTGCard.set_code, MTGCard.set_name).distinct().filter(
        MTGCard.set_code.isnot(None)
    ).order_by(MTGCard.set_name).all()
    return {"sets": [{"code": r[0], "name": r[1] or r[0]} for r in rows if r[0]]}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _search_by_name(db, name: str, set_code: str | None, exact: bool) -> list:
    q = db.query(MTGCard)
    if exact:
        q = q.filter(func.lower(MTGCard.name) == name.lower())
    else:
        q = q.filter(MTGCard.name.ilike(f"%{name}%"))
    if set_code:
        # Preferisci il set richiesto ma includi anche altri
        exact_set = q.filter(func.lower(MTGCard.set_code) == set_code).limit(3).all()
        others = q.filter(func.lower(MTGCard.set_code) != set_code).limit(2).all()
        return exact_set + others
    return q.limit(5).all()


def _search_by_name_it(db, name: str, set_code: str | None, exact: bool) -> list:
    q = db.query(MTGCard).filter(MTGCard.name_it.isnot(None))
    if exact:
        q = q.filter(func.lower(MTGCard.name_it) == name.lower())
    else:
        q = q.filter(MTGCard.name_it.ilike(f"%{name}%"))
    if set_code:
        exact_set = q.filter(func.lower(MTGCard.set_code) == set_code).limit(3).all()
        others = q.filter(func.lower(MTGCard.set_code) != set_code).limit(2).all()
        return exact_set + others
    return q.limit(5).all()


def _card_to_dict(c: MTGCard) -> dict:
    return {
        "uuid": c.uuid,
        "name": c.name,
        "name_it": c.name_it,
        "set_code": c.set_code,
        "set_name": c.set_name,
        "collector_number": c.collector_number,
        "rarity": c.rarity,
        "mana_cost": c.mana_cost,
        "type_line": c.type_line,
        "image_url": c.image_url,
        "image_url_small": c.image_url_small,
        "price_eur": c.price_eur,
        "price_usd": c.price_usd,
        "artist": c.artist,
        "released_at": c.released_at,
    }


def _extract_main_type(type_line: str | None) -> str:
    if not type_line:
        return "Unknown"
    SUPERS = {"Legendary", "Basic", "Snow"}
    main = type_line.split("—")[0].strip()
    types = [t for t in main.split() if t not in SUPERS]
    return types[-1] if types else "Unknown"
