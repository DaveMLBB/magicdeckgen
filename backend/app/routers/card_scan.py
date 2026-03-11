"""
Card Scanner endpoint.
Riceve un frame (base64 JPEG) dalla webcam, identifica la carta MTG
usando OpenAI Vision, e la aggiunge alla collezione dell'utente.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import User, Card, CardCollection, MTGCard
from datetime import datetime
import os, json, base64

router = APIRouter()

SCAN_TOKEN_COST = 0  # gratis — il costo è nell'abbonamento
SCANS_PER_TOKEN = 100  # ogni 100 scansioni scala 1 token


class ScanFrameInput(BaseModel):
    user_id: int
    image_base64: str          # JPEG base64, senza prefisso data:
    collection_id: int
    language: str = "en"


class ScanResultCard(BaseModel):
    name: str
    set_code: Optional[str] = None
    collector_number: Optional[str] = None
    confidence: float = 0.0


class ScanGridInput(BaseModel):
    user_id: int
    image_base64: str          # JPEG base64 del frame intero con 9 carte
    collection_id: int
    language: str = "en"
    rows: int = 3              # righe griglia (default 3)
    cols: int = 3              # colonne griglia (default 3)


@router.post("/identify")
async def identify_card(
    input_data: ScanFrameInput,
    db: Session = Depends(get_db)
):
    """
    Identifica una carta MTG da un frame webcam e la aggiunge alla collezione.
    Usa OpenAI Vision per riconoscere nome ed edizione.
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

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    # Identifica la carta con OpenAI Vision
    identified = await _identify_with_vision(input_data.image_base64, openai_api_key)
    if not identified:
        return {"identified": False, "message": "Card not recognized"}

    card_name = identified.get("name", "").strip()
    set_code   = identified.get("set_code", "").strip().lower() or None
    confidence = identified.get("confidence", 0.0)

    if not card_name or confidence < 0.6:
        return {"identified": False, "message": "Low confidence", "confidence": confidence}

    # Cerca la carta nel DB MTG (con set se disponibile)
    mtg_card = _find_mtg_card(db, card_name, set_code)

    # Aggiunge o incrementa nella collezione
    card_added = _upsert_card(db, user.id, input_data.collection_id, card_name, mtg_card)

    # Incrementa contatore scan e scala 1 token ogni SCANS_PER_TOKEN
    if user.scan_count is None:
        user.scan_count = 0
    user.scan_count += 1
    token_consumed = False
    if user.scan_count % SCANS_PER_TOKEN == 0:
        if user.tokens > 0:
            user.tokens -= 1
            token_consumed = True
            from app.models import TokenTransaction
            db.add(TokenTransaction(
                user_id=user.id,
                amount=-1,
                action='card_scan',
                description=f'📷 Card scan: {user.scan_count} scansioni completate',
            ))
    db.commit()

    return {
        "identified": True,
        "card_name": card_name,
        "set_code": set_code or (mtg_card.set_code if mtg_card else None),
        "collector_number": mtg_card.collector_number if mtg_card else None,
        "image_url": mtg_card.image_url if mtg_card else None,
        "rarity": mtg_card.rarity if mtg_card else None,
        "mana_cost": mtg_card.mana_cost if mtg_card else None,
        "type_line": mtg_card.type_line if mtg_card else None,
        "price_eur": mtg_card.price_eur if mtg_card else None,
        "price_usd": mtg_card.price_usd if mtg_card else None,
        "confidence": confidence,
        "quantity_owned": card_added.quantity_owned,
        "card_id": card_added.id,
        "scan_count": user.scan_count,
        "tokens_remaining": user.tokens,
        "token_consumed": token_consumed,
        "scans_to_next_token": SCANS_PER_TOKEN - (user.scan_count % SCANS_PER_TOKEN),
    }


async def _identify_with_vision(image_b64: str, api_key: str) -> dict | None:
    """Usa OpenAI Vision per identificare nome ed edizione della carta."""
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)

        prompt = """You are an expert Magic: The Gathering card identifier.
Look at this card image and identify:
1. The exact English card name (as printed on the card)
2. The set code (3-4 letter abbreviation, e.g. "MOM", "LTR", "DMU") if visible on the card
3. Your confidence level (0.0 to 1.0)

Respond ONLY with valid JSON:
{"name": "Card Name", "set_code": "XXX", "confidence": 0.95}

If you cannot identify the card, respond: {"name": "", "set_code": "", "confidence": 0.0}
If the set symbol is not clearly visible, omit set_code or set it to "".
"""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {
                        "url": f"data:image/jpeg;base64,{image_b64}",
                        "detail": "low"   # low = veloce e economico
                    }}
                ]
            }],
            max_tokens=100,
            temperature=0,
        )

        raw = response.choices[0].message.content.strip()
        # Estrai JSON
        import re
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            return json.loads(m.group(0))
    except Exception as e:
        print(f"Vision error: {e}")
    return None


def _find_mtg_card(db: Session, name: str, set_code: str | None) -> MTGCard | None:
    """Cerca la carta nel DB, preferendo l'edizione specificata."""
    from sqlalchemy import func
    q = db.query(MTGCard).filter(func.lower(MTGCard.name) == name.lower())
    if set_code:
        card = q.filter(func.lower(MTGCard.set_code) == set_code.lower()).first()
        if card:
            return card
    return q.first()


def _upsert_card(db: Session, user_id: int, collection_id: int, name: str, mtg: MTGCard | None) -> Card:
    """Aggiunge 1 copia della carta alla collezione, o incrementa se già presente."""
    existing = db.query(Card).filter(
        Card.user_id == user_id,
        Card.collection_id == collection_id,
        Card.name == (mtg.name if mtg else name)
    ).first()

    if existing:
        existing.quantity_owned += 1
        db.commit()
        db.refresh(existing)
        return existing

    card = Card(
        name=mtg.name if mtg else name,
        name_it=mtg.name_it if mtg else None,
        mana_cost=mtg.mana_cost if mtg else None,
        card_type=_extract_main_type(mtg.type_line if mtg else None),
        colors=mtg.colors if mtg else None,
        rarity=mtg.rarity if mtg else None,
        quantity_owned=1,
        user_id=user_id,
        collection_id=collection_id,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


def _extract_main_type(type_line: str | None) -> str:
    if not type_line:
        return "Unknown"
    SUPERS = {"Legendary", "Basic", "Snow"}
    main = type_line.split("—")[0].strip()
    types = [t for t in main.split() if t not in SUPERS]
    return types[-1] if types else "Unknown"


@router.post("/identify-grid")
async def identify_grid(
    input_data: ScanGridInput,
    db: Session = Depends(get_db)
):
    """
    Identifica fino a rows*cols carte MTG da un singolo frame (raccoglitore/binder).
    Restituisce un array di carte riconosciute e le aggiunge alla collezione.
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

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    max_cards = input_data.rows * input_data.cols
    cards_raw = await _identify_grid_with_vision(
        input_data.image_base64, openai_api_key, max_cards
    )

    results = []
    recognized_count = 0

    for item in cards_raw:
        card_name = item.get("name", "").strip()
        set_code  = item.get("set_code", "").strip().lower() or None
        confidence = item.get("confidence", 0.0)
        position  = item.get("position", None)  # es. "row1_col2"

        if not card_name or confidence < 0.5:
            results.append({"identified": False, "position": position})
            continue

        mtg_card = _find_mtg_card(db, card_name, set_code)
        card_added = _upsert_card(db, user.id, input_data.collection_id, card_name, mtg_card)
        recognized_count += 1

        results.append({
            "identified": True,
            "position": position,
            "card_name": card_name,
            "set_code": set_code or (mtg_card.set_code if mtg_card else None),
            "image_url": mtg_card.image_url if mtg_card else None,
            "rarity": mtg_card.rarity if mtg_card else None,
            "price_eur": mtg_card.price_eur if mtg_card else None,
            "price_usd": mtg_card.price_usd if mtg_card else None,
            "confidence": confidence,
            "quantity_owned": card_added.quantity_owned,
        })

    # Aggiorna contatore scan (ogni carta riconosciuta conta come 1 scan)
    if user.scan_count is None:
        user.scan_count = 0
    prev_count = user.scan_count
    user.scan_count += recognized_count
    token_consumed = 0
    for i in range(recognized_count):
        if (prev_count + i + 1) % SCANS_PER_TOKEN == 0 and user.tokens > 0:
            user.tokens -= 1
            token_consumed += 1
            from app.models import TokenTransaction
            db.add(TokenTransaction(
                user_id=user.id,
                amount=-1,
                action='card_scan',
                description=f'📷 Grid scan: {prev_count + i + 1} scansioni completate',
            ))
    db.commit()

    return {
        "cards": results,
        "recognized": recognized_count,
        "total_slots": max_cards,
        "scan_count": user.scan_count,
        "tokens_remaining": user.tokens,
        "tokens_consumed": token_consumed,
        "scans_to_next_token": SCANS_PER_TOKEN - (user.scan_count % SCANS_PER_TOKEN),
    }


async def _identify_grid_with_vision(image_b64: str, api_key: str, max_cards: int) -> list:
    """
    Usa OpenAI Vision per identificare più carte in una griglia (raccoglitore).
    Usa detail:high per leggere i nomi delle carte più piccole.
    """
    try:
        from openai import AsyncOpenAI
        import re
        client = AsyncOpenAI(api_key=api_key)

        prompt = f"""You are an expert Magic: The Gathering card identifier.
This image shows a binder/collector page with up to {max_cards} MTG cards arranged in a grid.
Identify each visible card from left to right, top to bottom.

For each card slot, provide:
- "name": exact English card name (empty string if slot is empty or unreadable)
- "set_code": 3-4 letter set abbreviation if visible (empty string if not)
- "confidence": 0.0 to 1.0
- "position": "r0c0", "r0c1", ... (row and column index, 0-based)

Respond ONLY with a valid JSON array, one object per card slot:
[
  {{"name": "Lightning Bolt", "set_code": "M11", "confidence": 0.95, "position": "r0c0"}},
  {{"name": "Counterspell", "set_code": "", "confidence": 0.80, "position": "r0c1"}},
  ...
]
Include all {max_cards} slots even if empty (use empty name and confidence 0.0 for empty slots).
"""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {
                        "url": f"data:image/jpeg;base64,{image_b64}",
                        "detail": "high"  # high = necessario per leggere nomi piccoli
                    }}
                ]
            }],
            max_tokens=800,
            temperature=0,
        )

        raw = response.choices[0].message.content.strip()
        m = re.search(r'\[.*\]', raw, re.DOTALL)
        if m:
            return json.loads(m.group(0))
    except Exception as e:
        print(f"Grid vision error: {e}")
    return []
