"""
Card Scanner endpoint — riconoscimento carta via GPT-4o Vision.
Il frontend manda il frame come base64, il backend chiede a GPT nome EN + collector number,
poi cerca nel DB Scryfall locale con nome + collector number.
"""

from itertools import combinations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
import os, base64, json, re
from app.database import get_db
from app.models import User, Card, CardCollection, MTGCard, TokenTransaction

router = APIRouter()

SCANS_PER_TOKEN = 25  # ogni 25 carte aggiunte scala 1 token


# ── Input models ──────────────────────────────────────────────────────────────

class CardScanVisionInput(BaseModel):
    """Frame catturato dal frontend (JPEG base64) da analizzare con GPT-4o Vision."""
    image_b64: str          # data:image/jpeg;base64,... oppure solo la parte base64
    language: str = "it"


class CardAddInput(BaseModel):
    """Aggiunge una carta alla collezione con quantità scelta dall'utente."""
    user_id: int
    collection_id: int
    card_uuid: str
    quantity: int = 1


class CardLookupInput(BaseModel):
    """Cerca una carta per nome nel DB locale (usato anche dalla ricerca manuale)."""
    raw_name: str
    collector_number: Optional[str] = None
    language: str = "it"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/recognize")
async def recognize_card(input_data: CardScanVisionInput, db: Session = Depends(get_db)):
    """
    Riceve un frame JPEG base64, chiede a GPT-4o Vision:
    - nome della carta in inglese
    - collector number (numero in basso a sinistra)

    Poi cerca nel DB con nome + collector number e ritorna i candidati.
    """
    openai_api_key = os.getenv("OPENAI_API_KEY", "")
    if not openai_api_key:
        raise HTTPException(status_code=503, detail="OpenAI API key non configurata")

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=openai_api_key)
    except ImportError:
        raise HTTPException(status_code=503, detail="Libreria OpenAI non installata")

    # Normalizza base64 (rimuovi eventuale data URI prefix)
    img_b64 = input_data.image_b64
    mime = "image/jpeg"
    if "," in img_b64:
        header, img_b64 = img_b64.split(",", 1)
        if "png" in header:
            mime = "image/png"
    print(f"[SCAN] image received: {mime}, {len(img_b64)} chars (~{len(img_b64)*3//4//1024} KB)")

    prompt = """This is a Magic: The Gathering card photo.
Tell me:
1. The card name in ENGLISH (if the card is in another language translate it and give me the English name)
2. The collector number (bottom-left of the card, e.g. "123" or "123/456")

Reply ONLY with this JSON, nothing else:
{"name": "Card Name", "collector_number": "123"}

If collector number is not visible, use null for that field."""

    try:
        response = await client.chat.completions.create(
            model="gpt-5-mini",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {
                        "url": f"data:{mime};base64,{img_b64}",
                        "detail": "high"
                    }}
                ]
            }],
            max_completion_tokens=100,
            temperature=1,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or ""
        usage = response.usage
        print(f"[SCAN] GPT tokens — prompt: {usage.prompt_tokens}, completion: {usage.completion_tokens}, total: {usage.total_tokens}")
        print(f"[SCAN] GPT raw response: {raw!r}")
        gpt_data = json.loads(raw) if raw.strip() else {}
        print(f"[SCAN] GPT parsed: {gpt_data}")
    except Exception as e:
        print(f"[SCAN] GPT error: {e}")
        return {"found": False, "candidates": [], "error": str(e)}

    card_name = (gpt_data.get("name") or "").strip()
    collector_number = (str(gpt_data.get("collector_number") or "")).strip() or None
    # Pulisci collector number: solo cifre
    if collector_number and collector_number != "None":
        m = re.match(r'(\d+)', collector_number)
        collector_number = m.group(1) if m else None
    else:
        collector_number = None

    print(f"[SCAN] card_name={card_name!r} collector_number={collector_number!r}")

    if not card_name:
        return {"found": False, "candidates": [], "gpt_name": None, "gpt_collector": collector_number}

    # Cerca nel DB
    candidates = _find_by_name(db, card_name)
    print(f"[SCAN] DB candidates for {card_name!r}: {[c.name for c in candidates]}")
    if not candidates:
        return {"found": False, "candidates": [], "gpt_name": card_name, "gpt_collector": collector_number}

    # Se abbiamo il collector number, query diretta nome + numero (non filtrare su subset)
    if collector_number:
        exact = (
            db.query(MTGCard)
            .filter(func.lower(MTGCard.name) == card_name.lower())
            .filter(MTGCard.collector_number == collector_number)
            .first()
        )
        if exact:
            return {
                "found": True,
                "exact_match": True,
                "candidates": [_card_to_dict(exact)],
                "gpt_name": card_name,
                "gpt_collector": collector_number,
            }

    return {
        "found": True,
        "exact_match": False,
        "candidates": [_card_to_dict(c) for c in candidates[:5]],
        "gpt_name": card_name,
        "gpt_collector": collector_number,
    }


@router.post("/lookup")
def lookup_card(input_data: CardLookupInput, db: Session = Depends(get_db)):
    """Ricerca manuale per nome (fallback quando la scansione non funziona)."""
    raw = input_data.raw_name.strip()
    if not raw or len(raw) < 2:
        return {"found": False, "candidates": []}

    collector_number = (input_data.collector_number or "").strip() or None
    candidates = _find_by_name(db, raw)

    if not candidates:
        return {"found": False, "candidates": [], "raw_name": raw}

    if collector_number:
        matched = [c for c in candidates if c.collector_number == collector_number]
        if matched:
            return {"found": True, "exact_match": True, "candidates": [_card_to_dict(matched[0])], "raw_name": raw}

    return {"found": True, "exact_match": False, "candidates": [_card_to_dict(c) for c in candidates[:5]], "raw_name": raw}


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
            set_code=mtg.set_code,
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

def _find_by_name(db, raw: str) -> list:
    """Cerca carte per nome con 5 livelli di fuzzy matching. Ritorna fino a 10 risultati."""
    # 1. Esatta
    results = db.query(MTGCard).filter(
        func.lower(MTGCard.name) == raw.lower()
    ).limit(10).all()
    if results:
        return results

    # 2. Parziale (raw contenuto nel nome)
    results = db.query(MTGCard).filter(
        MTGCard.name.ilike(f"%{raw}%")
    ).limit(10).all()
    if results:
        return results

    # 3. Tutte le parole significative (≥3 char) presenti nel nome
    words = [w for w in raw.split() if len(w) >= 3]
    if words:
        q = db.query(MTGCard)
        for w in words:
            q = q.filter(MTGCard.name.ilike(f"%{w}%"))
        results = q.limit(10).all()
        if results:
            return results

    # 4. Almeno metà delle parole significative
    if len(words) >= 2:
        min_match = max(1, len(words) // 2)
        for combo in combinations(words, min_match):
            q = db.query(MTGCard)
            for w in combo:
                q = q.filter(MTGCard.name.ilike(f"%{w}%"))
            results = q.limit(10).all()
            if results:
                return results

    # 5. Prima parola lunga (≥4 char)
    long_words = [w for w in raw.split() if len(w) >= 4]
    if long_words:
        results = db.query(MTGCard).filter(
            MTGCard.name.ilike(f"%{long_words[0]}%")
        ).limit(10).all()
        if results:
            return results

    return []

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
