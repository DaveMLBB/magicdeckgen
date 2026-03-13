from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import User, SavedDeck, SavedDeckCard, MTGCard
import os
import json
import time
from collections import deque
from threading import Lock

router = APIRouter()

# ── Prezzi modelli OpenAI ($/1M tokens) ──
MODEL_PRICING = {
    "gpt-4o":       {"input": 2.50,  "output": 10.00},
    "gpt-4o-mini":  {"input": 0.15,  "output": 0.60},
    "gpt-5-nano":   {"input": 0.05,  "output": 0.40},
    "gpt-5-mini":   {"input": 0.25,  "output": 2.00},
    "gpt-5":        {"input": 1.25,  "output": 10.00},
    "gpt-5.1":      {"input": 1.25,  "output": 10.00},
    "gpt-5.2":      {"input": 1.75,  "output": 14.00},


}

def log_openai_cost(usage, endpoint: str, model: str = "gpt-4o"):
    """Logga token e costo stimato di una chiamata OpenAI."""
    pricing = MODEL_PRICING.get(model, MODEL_PRICING["gpt-4o"])
    cost = (usage.prompt_tokens * pricing["input"] + usage.completion_tokens * pricing["output"]) / 1_000_000
    print(f"[AI:{endpoint}] model={model} tokens — prompt: {usage.prompt_tokens}, completion: {usage.completion_tokens}, total: {usage.total_tokens} (~${cost:.5f})")

# ── Costanti formato ──
FORMAT_MIN_CARDS = {
    "commander": 100,
    "edh": 100,
    "brawl": 60,
    "standardbrawl": 60,
    "historicbrawl": 100,
}
DEFAULT_MIN_CARDS = 60

BASIC_LANDS_BY_COLOR = {
    "W": "Plains", "U": "Island", "B": "Swamp", "R": "Mountain", "G": "Forest"
}
BASIC_LANDS_SET = {"plains", "island", "swamp", "mountain", "forest",
                   "wastes", "snow-covered plains", "snow-covered island",
                   "snow-covered swamp", "snow-covered mountain", "snow-covered forest"}


def get_min_deck_size(fmt: str | None) -> int:
    if not fmt:
        return DEFAULT_MIN_CARDS
    return FORMAT_MIN_CARDS.get(fmt.lower().strip(), DEFAULT_MIN_CARDS)


def enforce_deck_size(deck_data: dict, fmt: str | None, colors: str | None) -> dict:
    """
    Garantisce che il mazzo abbia esattamente il numero minimo di carte.
    - Se mancano carte: aggiunge terre base appropriate
    - Se ci sono troppe carte: rimuove copie eccedenti partendo dalle terre
    """
    min_size = get_min_deck_size(fmt)
    cards = deck_data.get("cards", [])

    # Calcola totale attuale
    total = sum(int(c.get("quantity", 1)) for c in cards)

    if total == min_size:
        return deck_data

    # Determina quali terre base usare
    color_str = (colors or deck_data.get("colors") or "").upper()
    color_letters = [c for c in ["W", "U", "B", "R", "G"] if c in color_str]
    if not color_letters:
        color_letters = ["W"]  # fallback
    basic_land_name = BASIC_LANDS_BY_COLOR[color_letters[0]]

    if total < min_size:
        # Mancano carte: aggiungi terre base
        missing = min_size - total
        # Cerca se c'è già una entry per questa terra base
        existing = next(
            (c for c in cards if c.get("card_name", "").lower() == basic_land_name.lower()),
            None
        )
        if existing:
            existing["quantity"] = int(existing.get("quantity", 0)) + missing
        else:
            cards.append({
                "card_name": basic_land_name,
                "quantity": missing,
                "category": "Land",
                "role": "Mana base"
            })
        print(f"🔧 enforce_deck_size: added {missing}x {basic_land_name} (total was {total}, needed {min_size})")

    elif total > min_size:
        # Troppe carte: rimuovi eccedenza partendo dalle terre base
        excess = total - min_size
        for entry in cards:
            if excess <= 0:
                break
            name_key = entry.get("card_name", "").lower()
            if name_key in BASIC_LANDS_SET:
                qty = int(entry.get("quantity", 0))
                remove = min(qty, excess)
                entry["quantity"] = qty - remove
                excess -= remove
        # Rimuovi entries con quantity 0
        cards = [c for c in cards if int(c.get("quantity", 0)) > 0]
        print(f"🔧 enforce_deck_size: removed excess cards (total was {total}, needed {min_size})")

    deck_data["cards"] = cards
    return deck_data


# ── Rate limiter: max 3 AI requests per minute per user ──
_rate_limit_store: dict[int, deque] = {}
_rate_limit_lock = Lock()
AI_RATE_LIMIT = 3
AI_RATE_WINDOW = 60  # seconds

def check_ai_rate_limit(user_id: int):
    """Raises 429 if user has made >= 3 AI requests in the last 60 seconds."""
    now = time.time()
    with _rate_limit_lock:
        if user_id not in _rate_limit_store:
            _rate_limit_store[user_id] = deque()
        timestamps = _rate_limit_store[user_id]
        # Remove timestamps older than the window
        while timestamps and now - timestamps[0] > AI_RATE_WINDOW:
            timestamps.popleft()
        if len(timestamps) >= AI_RATE_LIMIT:
            oldest = timestamps[0]
            retry_after = int(AI_RATE_WINDOW - (now - oldest)) + 1
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit: max {AI_RATE_LIMIT} AI requests per minute. Retry in {retry_after}s."
            )
        timestamps.append(now)

MAX_UNIQUE_CARDS_DECK_BUILDER = 3000

class OptimizeDeckInput(BaseModel):
    deck_id: int
    user_id: int
    optimization_goal: Optional[str] = "balanced"  # balanced, aggressive, defensive, budget

class FindSynergiesInput(BaseModel):
    user_id: int
    card_names: List[str]  # 1-5 seed cards
    format: Optional[str] = None
    strategy: Optional[str] = None  # aggro, control, combo, midrange, etc.

class FindTwinsInput(BaseModel):
    user_id: int
    card_names: List[str]  # 1-5 cards to find twins for
    format: Optional[str] = None  # restrict to a specific format
    budget: Optional[str] = None  # any, budget, expensive

class BuildDeckInput(BaseModel):
    user_id: int
    description: str  # free-text description of the desired deck
    format: Optional[str] = None
    colors: Optional[str] = None  # e.g. "WU", "BRG"
    budget: Optional[str] = None  # budget, affordable, any, expensive
    deck_size: Optional[int] = 60  # 60 or 100 (commander)
    collection_id: Optional[int] = None  # restrict to cards in this collection

@router.post("/build-deck")
async def build_deck(
    input_data: BuildDeckInput,
    language: str = "it",
    db: Session = Depends(get_db)
):
    """
    Genera un mazzo completo da una descrizione testuale usando AI.
    Consuma 30 token.
    """
    user = db.query(User).filter(User.id == input_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    check_ai_rate_limit(input_data.user_id)

    if not input_data.description or len(input_data.description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Description too short (min 10 characters)")

    from app.routers.tokens import consume_token
    consume_token(user, 'ai_build_deck', f'AI build deck: {input_data.description[:60]}', db, tokens_to_consume=5)

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=openai_api_key)
    except ImportError:
        raise HTTPException(status_code=503, detail="OpenAI library not installed")

    lang_label = "Italian (italiano)" if language == "it" else "English"
    deck_size = input_data.deck_size or 60
    format_line = f"Format: {input_data.format}" if input_data.format else "Format: not specified (use Modern as default)"
    colors_line = f"Color restriction: {input_data.colors}" if input_data.colors else "Colors: not restricted (choose what fits best)"
    budget_line = f"Budget preference: {input_data.budget}" if input_data.budget else "Budget: no restriction"

    # Load collection cards if collection_id provided
    collection_constraint = ""
    if input_data.collection_id:
        from app.models import Card, CardCollection
        collection = db.query(CardCollection).filter(
            CardCollection.id == input_data.collection_id,
            CardCollection.user_id == input_data.user_id
        ).first()
        if collection:
            coll_cards = db.query(Card).filter(Card.collection_id == input_data.collection_id)\
                .order_by(Card.quantity_owned.desc())\
                .limit(MAX_UNIQUE_CARDS_DECK_BUILDER).all()
            if coll_cards:
                total_in_coll = db.query(Card).filter(Card.collection_id == input_data.collection_id).count()
                card_list = ", ".join(
                    f"{c.name} (x{c.quantity_owned})" for c in coll_cards
                )
                truncation_note = f" (showing top {MAX_UNIQUE_CARDS_DECK_BUILDER} by quantity out of {total_in_coll} total)" if total_in_coll > MAX_UNIQUE_CARDS_DECK_BUILDER else ""
                collection_constraint = f"""

COLLECTION CONSTRAINT (VERY IMPORTANT):
The user wants to build this deck using ONLY cards from their collection "{collection.name}"{truncation_note}.
Available cards: {card_list}
- You MUST use only cards from this list (you may use basic lands freely even if not in the list)
- Respect the quantity_owned limits — do not use more copies than available
- If the collection does not have enough cards to fill the deck, use the best subset and note it in strategy_notes"""

    prompt = f"""You are an expert Magic: The Gathering deck builder. Build a complete, competitive and well-structured deck based on the user's description.

USER DESCRIPTION: {input_data.description}

CONSTRAINTS:
- {format_line}
- {colors_line}
- {budget_line}
- Deck size: exactly {deck_size} cards (not counting basic lands unless specified)
- All card names must be REAL Magic: The Gathering cards
- Include a proper mana base (lands)
- The deck must be playable and coherent{collection_constraint}

LANGUAGE: Respond in {lang_label}.

Respond ONLY with valid JSON in this exact structure:
{{
  "deck_name": "A creative and fitting name for the deck",
  "deck_description": "A 2-3 sentence description of the deck's strategy and win conditions",
  "format": "the format this deck is built for",
  "colors": "color identity abbreviation (e.g. WU, BRG, WUBRG)",
  "archetype": "the archetype (e.g. Aggro, Control, Combo, Midrange, Tempo, Ramp, Tribal, Burn, etc.)",
  "estimated_budget": "Budget (<$50)|Affordable ($50-150)|Moderate ($150-400)|Expensive ($400-800)|Premium (>$800)",
  "strategy_notes": "Detailed explanation of how to play the deck, key synergies, and win conditions",
  "cards": [
    {{
      "card_name": "Exact MTG card name",
      "quantity": 4,
      "category": "Creature|Spell|Enchantment|Artifact|Planeswalker|Land|Other",
      "role": "short role description (e.g. Win Condition, Removal, Ramp, Draw, Protection, Mana Fixer)"
    }}
  ],
  "sideboard": [
    {{
      "card_name": "Exact MTG card name",
      "quantity": 2,
      "role": "short role description"
    }}
  ],
  "key_cards": ["Card Name 1", "Card Name 2", "Card Name 3"],
  "upgrade_path": "Suggestions for how to improve the deck with a higher budget or future additions"
}}

IMPORTANT:
- The total quantity of all cards in "cards" must sum to exactly {deck_size}
- Include 15 sideboard cards (if format supports sideboard, otherwise empty array)
- Distribute cards logically: creatures, spells, lands in appropriate ratios
- For Commander/EDH: 1 commander + 99 cards, no duplicates except basic lands
"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": f"You are an expert Magic: The Gathering deck builder. You build complete, tournament-ready decks. Respond in {lang_label}. Always respond with valid JSON only."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        log_openai_cost(response.usage, "deck-builder", "gpt-4o")
        deck_data = json.loads(response.choices[0].message.content)
        print(f"✅ AI built deck: {deck_data.get('deck_name', 'unnamed')}")

        # Verification pass: ask AI to review and improve the deck
        verify_prompt = f"""Review this Magic: The Gathering deck and improve it if needed.

DECK: {json.dumps(deck_data)}

ORIGINAL REQUEST: {input_data.description}
FORMAT: {input_data.format or 'not specified'}
COLORS: {input_data.colors or 'not restricted'}

Check:
1. Card count sums to exactly {deck_size}
2. Mana curve is appropriate
3. Land count is correct (usually 22-26 for 60-card, 36-38 for Commander)
4. No illegal cards for the format
5. Synergies are coherent

Return the improved deck as the same JSON structure. If no changes needed, return the same deck. Respond with valid JSON only."""

        verify_response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"You are an expert MTG deck reviewer. Respond in {lang_label}. Always respond with valid JSON only."},
                {"role": "user", "content": verify_prompt}
            ],
            temperature=0.3,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        log_openai_cost(verify_response.usage, "deck-builder-verify", "gpt-4o")
        final_deck = json.loads(verify_response.choices[0].message.content)
        print(f"✅ AI verified deck: {final_deck.get('deck_name', 'unnamed')}")

        # Garantisce il conteggio minimo carte
        final_deck = enforce_deck_size(final_deck, input_data.format, input_data.colors)

        return {
            "deck": final_deck,
            "tokens_remaining": user.tokens
        }
    except Exception as e:
        import traceback
        err_str = str(e)
        print(f"❌ AI build-deck failed: {err_str}")
        print(f"❌ Full traceback:\n{traceback.format_exc()}")
        if hasattr(e, 'response'):
            try: print(f"❌ OpenAI response body: {e.response.text}")
            except: pass
        if hasattr(e, 'body'):
            print(f"❌ OpenAI error body: {e.body}")
        if '413' in err_str or 'rate_limit_exceeded' in err_str or 'Request too large' in err_str:
            raise HTTPException(status_code=503, detail="DEMO_RATE_LIMIT")
        raise HTTPException(status_code=503, detail=f"AI processing error: {err_str}")

class BuildDeckFullCollectionInput(BaseModel):
    user_id: int
    description: str
    format: Optional[str] = None
    colors: Optional[str] = None
    budget: Optional[str] = None
    deck_size: Optional[int] = 60
    collection_id: int

@router.get("/build-deck-full-collection/cost")
def get_full_collection_cost(collection_id: int, user_id: int, db: Session = Depends(get_db)):
    """Returns the token cost for building a deck from the full collection."""
    import math
    from app.models import Card, CardCollection
    collection = db.query(CardCollection).filter(
        CardCollection.id == collection_id,
        CardCollection.user_id == user_id
    ).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    total = db.query(Card).filter(Card.collection_id == collection_id).count()
    chunks = math.ceil(total / 200) if total > 0 else 1
    token_cost = 30
    return {"total_cards": total, "chunks": chunks, "token_cost": token_cost}

@router.post("/build-deck-full-collection")
async def build_deck_full_collection(
    input_data: BuildDeckFullCollectionInput,
    language: str = "it",
    db: Session = Depends(get_db)
):
    """
    Genera un mazzo usando TUTTA la collezione, elaborata in chunk da 200 carte.
    Costo: 10 + ceil(total_cards / 200) token.
    """
    import math
    from app.models import Card, CardCollection

    user = db.query(User).filter(User.id == input_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    check_ai_rate_limit(input_data.user_id)

    if not input_data.description or len(input_data.description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Description too short (min 10 characters)")

    collection = db.query(CardCollection).filter(
        CardCollection.id == input_data.collection_id,
        CardCollection.user_id == input_data.user_id
    ).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    all_cards = db.query(Card).filter(Card.collection_id == input_data.collection_id)\
        .order_by(Card.quantity_owned.desc()).all()
    total = len(all_cards)
    if total == 0:
        raise HTTPException(status_code=400, detail="Collection is empty")

    chunk_size = 200
    chunks = math.ceil(total / chunk_size)
    token_cost = 30

    from app.routers.tokens import consume_token
    consume_token(user, 'ai_build_deck_full', f'AI full collection deck: {input_data.description[:50]}', db, tokens_to_consume=token_cost)

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=openai_api_key)
    except ImportError:
        raise HTTPException(status_code=503, detail="OpenAI library not installed")

    lang_label = "Italian (italiano)" if language == "it" else "English"
    deck_size = input_data.deck_size or 60
    format_line = f"Format: {input_data.format}" if input_data.format else "Format: Modern"
    colors_line = f"Color restriction: {input_data.colors}" if input_data.colors else "Colors: not restricted"
    budget_line = f"Budget: {input_data.budget}" if input_data.budget else "Budget: no restriction"

    # Phase 1: for each chunk, ask AI to select the most useful cards for the description
    selected_cards = []
    for i in range(chunks):
        chunk = all_cards[i * chunk_size:(i + 1) * chunk_size]
        card_list = ", ".join(f"{c.name} (x{c.quantity_owned})" for c in chunk)
        selection_prompt = f"""You are a Magic: The Gathering expert. Given this deck description and a list of available cards, select the most useful cards for building the deck.

DECK DESCRIPTION: {input_data.description}
CONSTRAINTS: {format_line}, {colors_line}, {budget_line}, deck size {deck_size}

AVAILABLE CARDS (chunk {i+1}/{chunks}): {card_list}

Select up to 30 cards from this list that would fit the deck. Return ONLY valid JSON in this exact format:
{{"cards": ["Card Name 1", "Card Name 2", ...]}}
Only include card names that appear exactly in the list above. Respond with JSON only."""

        try:
            resp = await client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": selection_prompt}],
                temperature=0.3,
                max_tokens=800,
                response_format={"type": "json_object"}
            )
            log_openai_cost(resp.usage, "collection-select", "gpt-4o")
            raw = resp.choices[0].message.content
            print(f"🔍 Chunk {i+1} raw response: {raw[:200]}")
            parsed = json.loads(raw)
            # Robust extraction: look for any list value in the object
            if isinstance(parsed, dict):
                names = next((v for v in parsed.values() if isinstance(v, list)), [])
            elif isinstance(parsed, list):
                names = parsed
            else:
                names = []
            print(f"🔍 Chunk {i+1} extracted {len(names)} card names")
            # match back to card objects to get quantity
            name_set = {n.lower() for n in names if isinstance(n, str)}
            for c in chunk:
                if c.name.lower() in name_set:
                    selected_cards.append(f"{c.name} (x{c.quantity_owned})")
        except Exception as e:
            print(f"⚠️ Chunk {i+1} selection failed: {e}")
            if hasattr(e, 'body'): print(f"⚠️ Chunk {i+1} OpenAI error body: {e.body}")
            continue

    if not selected_cards:
        raise HTTPException(status_code=503, detail="AI could not select cards from collection")

    # Phase 2: build the final deck from selected cards
    final_card_list = ", ".join(selected_cards)
    final_prompt = f"""You are an expert Magic: The Gathering deck builder. Build a complete deck using ONLY the cards listed below.

USER DESCRIPTION: {input_data.description}

CONSTRAINTS:
- {format_line}
- {colors_line}
- {budget_line}
- Deck size: exactly {deck_size} cards
- You MUST use only cards from the list below (basic lands are always allowed)
- Respect quantity limits shown as (xN)

AVAILABLE CARDS FROM COLLECTION "{collection.name}": {final_card_list}

LANGUAGE: Respond in {lang_label}.

Respond ONLY with valid JSON:
{{
  "deck_name": "name",
  "deck_description": "2-3 sentence strategy description",
  "format": "format",
  "colors": "color identity",
  "archetype": "archetype",
  "estimated_budget": "budget range",
  "strategy_notes": "detailed strategy explanation",
  "cards": [{{"card_name": "name", "quantity": 4, "category": "Creature|Spell|Enchantment|Artifact|Planeswalker|Land|Other", "role": "role"}}],
  "sideboard": [{{"card_name": "name", "quantity": 2, "role": "role"}}],
  "key_cards": ["Card 1", "Card 2", "Card 3"],
  "upgrade_path": "upgrade suggestions"
}}

IMPORTANT: total cards must sum to exactly {deck_size}. Include 15 sideboard cards if format supports it."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"You are an expert MTG deck builder. Respond in {lang_label}. Always respond with valid JSON only."},
                {"role": "user", "content": final_prompt}
            ],
            temperature=0.7,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        log_openai_cost(response.usage, "collection-build", "gpt-4o")
        deck_data = json.loads(response.choices[0].message.content)
        print(f"✅ AI full-collection deck: {deck_data.get('deck_name', 'unnamed')} ({chunks} chunks, {token_cost} tokens)")

        # --- Server-side enforcement: remove cards not in collection ---
        BASIC_LANDS = {"plains", "island", "swamp", "mountain", "forest",
                       "wastes", "snow-covered plains", "snow-covered island",
                       "snow-covered swamp", "snow-covered mountain", "snow-covered forest"}

        # Build a lookup: lowercase name -> max quantity owned
        collection_limit: dict[str, int] = {}
        for c in all_cards:
            key = c.name.lower()
            collection_limit[key] = collection_limit.get(key, 0) + c.quantity_owned

        def enforce_collection(card_list: list) -> tuple[list, list]:
            """Return (kept_cards, removed_card_names)"""
            kept, removed = [], []
            used_qty: dict[str, int] = {}
            for entry in (card_list or []):
                name = entry.get("card_name", "")
                qty = int(entry.get("quantity", 1))
                key = name.lower()
                if key in BASIC_LANDS:
                    kept.append(entry)
                    continue
                if key not in collection_limit:
                    removed.append(name)
                    print(f"⚠️ Removed from deck (not in collection): {name}")
                    continue
                already_used = used_qty.get(key, 0)
                allowed = collection_limit[key] - already_used
                if allowed <= 0:
                    removed.append(name)
                    print(f"⚠️ Removed from deck (quantity exceeded): {name}")
                    continue
                actual_qty = min(qty, allowed)
                used_qty[key] = already_used + actual_qty
                new_entry = dict(entry)
                new_entry["quantity"] = actual_qty
                kept.append(new_entry)
            return kept, removed

        filtered_main, removed_main = enforce_collection(deck_data.get("cards", []))
        filtered_side, removed_side = enforce_collection(deck_data.get("sideboard", []))
        deck_data["cards"] = filtered_main
        deck_data["sideboard"] = filtered_side
        all_removed = list(set(removed_main + removed_side))
        if all_removed:
            deck_data["_enforcement_note"] = f"Removed {len(all_removed)} card(s) not in collection: {', '.join(all_removed[:10])}"
            print(f"⚠️ Enforcement removed {len(all_removed)} cards: {all_removed[:10]}")
        # --- End enforcement ---

        # Verification pass
        verify_prompt = f"""Review this Magic: The Gathering deck and improve it if needed.

DECK: {json.dumps(deck_data)}

ORIGINAL REQUEST: {input_data.description}
FORMAT: {input_data.format or 'not specified'}
COLORS: {input_data.colors or 'not restricted'}
COLLECTION: only cards from "{collection.name}" are allowed (plus basic lands)

Check:
1. Card count sums to exactly {deck_size}
2. Mana curve is appropriate
3. Land count is correct (usually 22-26 for 60-card, 36-38 for Commander)
4. All cards are from the available collection (basic lands always allowed)
5. Synergies are coherent

Return the improved deck as the same JSON structure. Respond with valid JSON only."""

        verify_response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"You are an expert MTG deck reviewer. Respond in {lang_label}. Always respond with valid JSON only."},
                {"role": "user", "content": verify_prompt}
            ],
            temperature=0.3,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        log_openai_cost(verify_response.usage, "collection-build-verify", "gpt-4o")
        final_deck = json.loads(verify_response.choices[0].message.content)
        print(f"✅ AI verified full-collection deck: {final_deck.get('deck_name', 'unnamed')}")

        # Re-apply enforcement after verification (verifier may reintroduce invalid cards)
        final_main, final_removed_main = enforce_collection(final_deck.get("cards", []))
        final_side, final_removed_side = enforce_collection(final_deck.get("sideboard", []))
        final_deck["cards"] = final_main
        final_deck["sideboard"] = final_side
        all_removed_final = list(set(final_removed_main + final_removed_side))
        if all_removed_final:
            final_deck["_enforcement_note"] = f"Removed {len(all_removed_final)} card(s) not in collection: {', '.join(all_removed_final[:10])}"
            print(f"⚠️ Post-verify enforcement removed {len(all_removed_final)} cards: {all_removed_final[:10]}")

        # Garantisce il conteggio minimo carte (dopo enforcement collezione)
        final_deck = enforce_deck_size(final_deck, input_data.format, input_data.colors)

        # --- Fix mana base: replace basic lands with color-appropriate ones ---
        COLOR_TO_BASIC = {"W": "Plains", "U": "Island", "B": "Swamp", "R": "Mountain", "G": "Forest"}
        deck_colors_raw = (final_deck.get("colors") or input_data.colors or "").upper()
        deck_color_letters = [c for c in ["W", "U", "B", "R", "G"] if c in deck_colors_raw]

        if deck_color_letters:
            correct_basics = {COLOR_TO_BASIC[c].lower() for c in deck_color_letters}
            wrong_basics_in_deck = []
            fixed_cards = []
            for entry in final_deck.get("cards", []):
                name_key = entry.get("card_name", "").lower()
                if name_key in BASIC_LANDS and name_key not in correct_basics:
                    wrong_basics_in_deck.append(entry["card_name"])
                    # Replace with the first correct basic land
                    replacement = COLOR_TO_BASIC[deck_color_letters[0]]
                    new_entry = dict(entry)
                    new_entry["card_name"] = replacement
                    new_entry["category"] = "Land"
                    fixed_cards.append(new_entry)
                    print(f"🔧 Replaced wrong basic land '{entry['card_name']}' with '{replacement}'")
                else:
                    fixed_cards.append(entry)
            if wrong_basics_in_deck:
                # Merge duplicates (e.g. multiple Plains entries)
                merged: dict[str, dict] = {}
                for entry in fixed_cards:
                    key = entry["card_name"].lower()
                    if key in merged:
                        merged[key]["quantity"] = merged[key].get("quantity", 0) + entry.get("quantity", 1)
                    else:
                        merged[key] = dict(entry)
                final_deck["cards"] = list(merged.values())
                print(f"🔧 Fixed mana base: replaced {len(wrong_basics_in_deck)} wrong basic(s) for colors {deck_color_letters}")
        # --- End mana base fix ---

        # --- MTGA legality check ---
        ARENA_FORMATS = {"alchemy", "historic", "historicbrawl", "timeless", "standardbrawl", "explorer", "gladiator"}
        is_arena_request = any(kw in input_data.description.lower() for kw in ["arena", "mtga", "magic arena"])
        if input_data.format:
            is_arena_request = is_arena_request or input_data.format.lower() in ARENA_FORMATS

        arena_unavailable: list[str] = []
        arena_warnings: list[str] = []

        all_deck_card_names = [
            e.get("card_name", "") for e in (final_deck.get("cards", []) + final_deck.get("sideboard", []))
            if e.get("card_name", "").lower() not in BASIC_LANDS
        ]

        for card_name in set(all_deck_card_names):
            if not card_name:
                continue
            mtg_row = db.query(MTGCard).filter(MTGCard.name == card_name).first()
            if mtg_row and mtg_row.legalities:
                import json as _json
                try:
                    leg = _json.loads(mtg_row.legalities)
                    on_arena = any(leg.get(fmt, "") == "Legal" for fmt in ARENA_FORMATS)
                    if not on_arena:
                        arena_unavailable.append(card_name)
                except Exception:
                    pass
            elif not mtg_row:
                # Card not in our DB at all — can't verify
                pass

        if arena_unavailable:
            print(f"ℹ️ Cards not on MTGA: {arena_unavailable}")
        # --- End MTGA check ---

        return {
            "deck": final_deck,
            "tokens_remaining": user.tokens,
            "collection_stats": {"total_cards": total, "chunks_processed": chunks, "cards_selected": len(selected_cards)},
            "arena_unavailable": arena_unavailable,
            "arena_check": is_arena_request,
        }
    except Exception as e:
        import traceback
        err_str = str(e)
        print(f"❌ AI build-deck-full-collection failed: {err_str}")
        print(f"❌ Full traceback:\n{traceback.format_exc()}")
        if hasattr(e, 'body'): print(f"❌ OpenAI error body: {e.body}")
        if '413' in err_str or 'rate_limit_exceeded' in err_str or 'Request too large' in err_str:
            raise HTTPException(status_code=503, detail="DEMO_RATE_LIMIT")
        raise HTTPException(status_code=503, detail=f"AI processing error: {err_str}")


@router.post("/find-twins")
async def find_twins(
    input_data: FindTwinsInput,
    language: str = "it",
    db: Session = Depends(get_db)
):
    """
    Dato un set di carte, trova carte che fanno la stessa cosa (twins/gemelli).
    Consuma 1 token.
    """
    user = db.query(User).filter(User.id == input_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    check_ai_rate_limit(input_data.user_id)

    if not input_data.card_names or len(input_data.card_names) == 0:
        raise HTTPException(status_code=400, detail="Provide at least one card name")

    if len(input_data.card_names) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 cards allowed")

    from app.routers.tokens import consume_token
    consume_token(user, 'ai_twins', f'AI twins search: {", ".join(input_data.card_names)}', db, tokens_to_consume=3)

    # Fetch card data from DB
    cards_data = []
    for card_name in input_data.card_names:
        card = db.query(MTGCard).filter(MTGCard.name.ilike(card_name)).first()
        if card:
            cards_data.append({
                "name": card.name,
                "mana_cost": card.mana_cost or "",
                "cmc": card.mana_value or 0,
                "types": card.types or "",
                "subtypes": card.subtypes or "",
                "text": card.text or "",
                "keywords": card.keywords or "",
                "colors": card.colors or "",
                "power": card.power,
                "toughness": card.toughness,
                "rarity": card.rarity or "",
            })
        else:
            cards_data.append({"name": card_name, "text": "", "types": "", "colors": "", "cmc": 0})

    try:
        result = await find_twins_with_ai(cards_data, input_data.format, input_data.budget, language)
    except Exception as e:
        import traceback
        print(f"❌ AI twins failed: {str(e)}")
        print(f"❌ Full traceback:\n{traceback.format_exc()}")
        if hasattr(e, 'body'): print(f"❌ OpenAI error body: {e.body}")
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

    return {
        "source_cards": [c["name"] for c in cards_data],
        "format": input_data.format,
        "budget": input_data.budget,
        "result": result,
        "tokens_remaining": user.tokens
    }


async def find_twins_with_ai(cards: list, format: Optional[str], budget: Optional[str], language: str) -> dict:
    """
    Usa Groq (Llama 3.3 70B) per trovare carte funzionalmente equivalenti.
    """
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise Exception("OpenAI API key not configured")

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=openai_api_key
        )
    except ImportError:
        raise Exception("OpenAI library not installed")

    lang_label = "Italian (italiano)" if language == "it" else "English"
    format_line = f"Restrict results to cards legal in: {format}" if format else "Any format/legality is acceptable"
    budget_line = f"Budget preference: {budget}" if budget else "No budget restriction"

    cards_block = "\n".join(
        f"- {c['name']} | Types: {c.get('types','')} {c.get('subtypes','')} | Colors: {c.get('colors','')} | CMC: {c.get('cmc','')} | Rarity: {c.get('rarity','')} | Text: {c.get('text','')[:300]}"
        for c in cards
    )

    prompt = f"""You are an expert Magic: The Gathering card analyst specializing in finding functional equivalents and "twin" cards.

SOURCE CARDS (the user wants to find cards that do the same thing):
{cards_block}

{format_line}
{budget_line}

TASK:
For EACH source card, find 3-8 Magic: The Gathering cards that are functionally equivalent or very similar. 
"Functionally equivalent" means:
- They achieve the same or very similar game effect
- They fill the same role in a deck
- They have similar power/toughness or similar activated/triggered abilities
- They may cost more or less mana but do essentially the same thing
- They may be strictly better, strictly worse, or lateral upgrades/downgrades

For each twin card, classify the relationship:
- "strictly_better": the twin is objectively better in almost all situations
- "strictly_worse": the twin is objectively worse (budget replacement)
- "lateral": similar power level, different context or minor tradeoffs
- "functional_copy": nearly identical effect, different name/flavor

LANGUAGE: Respond in {lang_label}.

Respond ONLY with valid JSON in this exact structure:
{{
  "cards": [
    {{
      "source_card": "Exact name of the source card",
      "source_summary": "One sentence describing what this card does",
      "twins": [
        {{
          "card_name": "Exact MTG card name",
          "relationship": "strictly_better|strictly_worse|lateral|functional_copy",
          "similarity_score": 85,
          "key_differences": "string - what is different (mana cost, small text differences, etc.)",
          "why_similar": "string - what makes it functionally equivalent",
          "estimated_price": "Budget (<$2)|Affordable ($2-10)|Moderate ($10-30)|Expensive (>$30)",
          "formats": ["modern", "legacy"]
        }}
      ]
    }}
  ],
  "notes": "string - general observations about the functional equivalence landscape for these cards"
}}
"""
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": f"You are an expert Magic: The Gathering card analyst. Your specialty is finding cards that are functionally equivalent or serve the same purpose. Respond in {lang_label}. Always respond with valid JSON only."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.5,
        max_tokens=3500,
        response_format={"type": "json_object"}
    )

    log_openai_cost(response.usage, "find-twins", "gpt-4o-mini")
    return json.loads(response.choices[0].message.content)

@router.post("/find-synergies")
async def find_synergies(
    input_data: FindSynergiesInput,
    language: str = "it",
    db: Session = Depends(get_db)
):
    """
    Dato un set di carte seme, trova carte compatibili/sinergiche usando AI.
    Consuma 1 token.
    """
    user = db.query(User).filter(User.id == input_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    check_ai_rate_limit(input_data.user_id)

    if not input_data.card_names or len(input_data.card_names) == 0:
        raise HTTPException(status_code=400, detail="Provide at least one card name")

    if len(input_data.card_names) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 seed cards allowed")

    from app.routers.tokens import consume_token
    consume_token(user, 'ai_synergy', f'AI synergy search: {", ".join(input_data.card_names)}', db, tokens_to_consume=3)

    # Fetch card data from DB to enrich the prompt
    seed_cards_data = []
    for card_name in input_data.card_names:
        card = db.query(MTGCard).filter(
            MTGCard.name.ilike(card_name)
        ).first()
        if card:
            seed_cards_data.append({
                "name": card.name,
                "mana_cost": card.mana_cost or "",
                "cmc": card.mana_value or 0,
                "types": card.types or "",
                "subtypes": card.subtypes or "",
                "text": card.text or "",
                "keywords": card.keywords or "",
                "colors": card.colors or "",
                "power": card.power,
                "toughness": card.toughness,
            })
        else:
            seed_cards_data.append({"name": card_name, "text": "", "types": "", "colors": ""})

    try:
        result = await find_synergies_with_ai(seed_cards_data, input_data.format, input_data.strategy, language)
    except Exception as e:
        import traceback
        print(f"❌ AI synergy failed: {str(e)}")
        print(f"❌ Full traceback:\n{traceback.format_exc()}")
        if hasattr(e, 'body'): print(f"❌ OpenAI error body: {e.body}")
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

    return {
        "seed_cards": [c["name"] for c in seed_cards_data],
        "format": input_data.format,
        "strategy": input_data.strategy,
        "result": result,
        "tokens_remaining": user.tokens
    }


async def find_synergies_with_ai(seed_cards: list, format: Optional[str], strategy: Optional[str], language: str) -> dict:
    """
    Usa Groq (Llama 3.3 70B) per trovare carte sinergiche con le carte seme.
    """
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise Exception("OpenAI API key not configured")

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=openai_api_key
        )
    except ImportError:
        raise Exception("OpenAI library not installed")

    lang_label = "Italian (italiano)" if language == "it" else "English"
    format_line = f"Format: {format}" if format else "Format: any/casual"
    strategy_line = f"Preferred strategy/archetype: {strategy}" if strategy else "Strategy: not specified, suggest what fits best"

    cards_block = "\n".join(
        f"- {c['name']} | Types: {c.get('types','')} {c.get('subtypes','')} | Colors: {c.get('colors','')} | CMC: {c.get('cmc','')} | Text: {c.get('text','')[:200]}"
        for c in seed_cards
    )

    prompt = f"""You are an expert Magic: The Gathering deck builder.
The user provides a set of "seed" cards and wants to find compatible, synergistic cards that work well with them.

SEED CARDS:
{cards_block}

{format_line}
{strategy_line}

TASK:
1. Analyze the seed cards: identify their mechanics, synergies, themes, and strategies.
2. Suggest 15-25 specific Magic: The Gathering cards that synergize well with the seed cards.
3. Group suggestions by role (e.g., "Enablers", "Payoffs", "Support/Utility", "Lands", "Removal").
4. For each card explain WHY it synergizes with the seed cards.
5. Identify 2-5 powerful combos or synergy chains involving the seed cards + suggested cards.
6. Give a brief strategic overview of what kind of deck these cards could form.

LANGUAGE: Respond in {lang_label}.

Respond ONLY with valid JSON in this exact structure:
{{
  "strategic_overview": "string - brief description of the deck strategy these cards suggest",
  "themes_identified": ["theme1", "theme2", ...],
  "suggested_cards": [
    {{
      "card_name": "Exact MTG card name",
      "role": "Enabler|Payoff|Support|Removal|Land|Ramp|Protection|Draw",
      "synergy_reason": "string - why this card works with the seed cards",
      "priority": "high|medium|low",
      "estimated_price": "Budget (<$2)|Affordable ($2-10)|Moderate ($10-30)|Expensive (>$30)"
    }}
  ],
  "synergy_chains": [
    {{
      "cards": ["card1", "card2", "card3"],
      "description": "string - how these cards interact",
      "power_level": "value|strong|game-winning"
    }}
  ],
  "cards_to_avoid": ["card1", "card2"],
  "avoid_reason": "string - brief explanation of what to avoid"
}}
"""
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": f"You are an expert Magic: The Gathering card synergy analyst. Respond in {lang_label}. Always respond with valid JSON only."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=3000,
        response_format={"type": "json_object"}
    )

    log_openai_cost(response.usage, "find-synergies", "gpt-4o-mini")
    return json.loads(response.choices[0].message.content)

@router.post("/optimize-deck")
async def optimize_deck(
    input_data: OptimizeDeckInput,
    language: str = "it",
    db: Session = Depends(get_db)
):
    """
    Analizza un mazzo esistente e suggerisce ottimizzazioni usando AI
    Consuma 2 token (operazione premium)
    """
    # Verify user exists and has tokens
    user = db.query(User).filter(User.id == input_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    check_ai_rate_limit(input_data.user_id)

    # Consume 2 tokens for AI optimization (premium feature)
    from app.routers.tokens import consume_token
    consume_token(user, 'ai_optimization', f'AI deck optimization: deck {input_data.deck_id}', db, tokens_to_consume=10)
    
    # Get deck
    deck = db.query(SavedDeck).filter(SavedDeck.id == input_data.deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    if deck.user_id != input_data.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get deck cards
    deck_cards = db.query(SavedDeckCard).filter(SavedDeckCard.deck_id == input_data.deck_id).all()
    
    if not deck_cards:
        raise HTTPException(status_code=400, detail="Deck is empty")
    
    # Prepare deck analysis
    deck_list = []
    mana_curve = {}
    card_types = {}
    total_cards = 0
    
    for card in deck_cards:
        deck_list.append(f"{card.quantity}x {card.card_name}")
        total_cards += card.quantity
        
        # Analyze mana curve
        mtg_card = db.query(MTGCard).filter(MTGCard.name == card.card_name).first()
        if mtg_card and mtg_card.mana_value is not None:
            cmc = mtg_card.mana_value
            mana_curve[cmc] = mana_curve.get(cmc, 0) + card.quantity
        
        # Analyze card types
        card_type = card.card_type or "Unknown"
        card_types[card_type] = card_types.get(card_type, 0) + card.quantity
    
    # Build AI prompt
    deck_info = {
        "name": deck.name,
        "format": deck.format or "casual",
        "colors": deck.colors or "colorless",
        "archetype": deck.archetype or "unknown",
        "total_cards": total_cards,
        "cards": deck_list,
        "mana_curve": mana_curve,
        "card_types": card_types
    }
    
    # Call AI service
    try:
        print(f"🤖 Calling AI with optimization goal: {input_data.optimization_goal}, language: {language}")
        suggestions = await analyze_deck_with_ai(deck_info, input_data.optimization_goal, language)
        print(f"✅ AI analysis completed successfully")
    except Exception as e:
        import traceback
        print(f"❌ AI failed: {str(e)}")
        print(f"❌ Full traceback:\n{traceback.format_exc()}")
        if hasattr(e, 'body'): print(f"❌ OpenAI error body: {e.body}")
        print(f"⚠️ Using fallback basic suggestions (always the same)")
        suggestions = generate_basic_suggestions(deck_info, deck_cards, db)
    
    return {
        "deck_id": deck.id,
        "deck_name": deck.name,
        "analysis": {
            "total_cards": total_cards,
            "mana_curve": mana_curve,
            "card_types": card_types,
            "format": deck.format,
            "colors": deck.colors,
            "archetype": deck.archetype
        },
        "suggestions": suggestions,
        "tokens_remaining": user.tokens
    }

async def analyze_deck_with_ai(deck_info: dict, optimization_goal: str, language: str = "it") -> dict:
    """
    Usa Groq (Llama 3.1) per analizzare il mazzo e generare suggerimenti - GRATIS!
    """
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    if not openai_api_key:
        raise Exception("OpenAI API key not configured")
    
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=openai_api_key
        )
    except ImportError:
        raise Exception("OpenAI library not installed")
    
    # Build goal-specific instructions
    goal_instructions = {
        "balanced": "Focus on creating a well-rounded deck with good balance between threats, answers, and card advantage.",
        "aggressive": "Prioritize low-cost creatures, burn spells, and cards that deal damage quickly. Suggest fast, efficient threats.",
        "defensive": "Focus on control elements: removal, counterspells, board wipes, and card advantage engines. Suggest defensive cards.",
        "midrange": "Balance early interaction with powerful mid-game threats. Suggest value creatures and efficient removal.",
        "combo": "Identify combo pieces and tutors. Suggest cards that enable or protect the combo. Find infinite or game-winning combinations.",
        "tempo": "Focus on efficient threats and disruption. Suggest cards that maintain board presence while disrupting opponent.",
        "ramp": "Prioritize mana acceleration and big payoffs. Suggest ramp spells and high-impact finishers.",
        "tribal": "Focus on tribal synergies. Suggest lords, tribal payoffs, and creatures of the same type.",
        "budget": "Suggest affordable alternatives to expensive cards. Prioritize budget-friendly options under $5.",
        "competitive": "Suggest the most powerful, efficient cards regardless of price. Focus on competitive viability.",
        "casual": "Prioritize fun interactions and interesting plays over pure efficiency.",
        "thematic": "Maintain flavor and theme consistency. Suggest cards that fit the deck's story or concept.",
        "voltron": "Focus on auras, equipment, and cards that buff a single creature. Suggest protection and evasion.",
        "tokens": "Prioritize token generators and anthem effects. Suggest cards that create and benefit from tokens.",
        "graveyard": "Focus on graveyard synergies, recursion, and self-mill. Suggest reanimation and flashback cards.",
        "artifacts": "Prioritize artifact synergies and artifact creatures. Suggest artifact-matters cards.",
        "enchantments": "Focus on enchantment synergies and enchantress effects. Suggest enchantment-matters cards.",
        "spellslinger": "Prioritize instants and sorceries. Suggest cards that benefit from casting spells.",
        "landfall": "Focus on land-matters cards and extra land drops. Suggest landfall triggers and ramp.",
        "lifegain": "Prioritize lifegain triggers and payoffs. Suggest cards that gain life and benefit from it."
    }
    
    goal_instruction = goal_instructions.get(optimization_goal, "Provide balanced optimization suggestions.")
    
    # Build prompt
    prompt = f"""Analyze this Magic: The Gathering deck and provide optimization suggestions.

OPTIMIZATION GOAL: {optimization_goal.upper()}
SPECIFIC FOCUS: {goal_instruction}

Deck Information:
- Name: {deck_info['name']}
- Format: {deck_info['format']}
- Colors: {deck_info['colors']}
- Archetype: {deck_info['archetype']}
- Total Cards: {deck_info['total_cards']}

Decklist:
{chr(10).join(deck_info['cards'])}

Mana Curve:
{json.dumps(deck_info['mana_curve'], indent=2)}

Card Types Distribution:
{json.dumps(deck_info['card_types'], indent=2)}

LANGUAGE: Respond in {"Italian" if language == "it" else "English"}.

CRITICAL: Your suggestions MUST align with the optimization goal "{optimization_goal}". 
{goal_instruction}

Please provide (in {"Italian" if language == "it" else "English"}):
1. Overall deck assessment focused on the {optimization_goal} strategy
2. Mana curve analysis relative to {optimization_goal} goals
3. Card synergy evaluation for {optimization_goal} strategy
4. 8-15 specific card suggestions with EXACT card names that support {optimization_goal}
5. Combo analysis - identify combos that fit the {optimization_goal} strategy
6. Strategic recommendations specifically for {optimization_goal}

IMPORTANT: 
- Provide REAL Magic: The Gathering card names
- ALL suggestions must support the {optimization_goal} optimization goal
- For budget goal, suggest cards under $5
- For competitive goal, suggest the best cards regardless of price
- For combo goal, focus heavily on combo pieces and tutors

Format your response as JSON with this structure:
{{
  "overall_assessment": "string",
  "mana_curve_analysis": "string",
  "synergy_evaluation": "string",
  "card_suggestions": [
    {{
      "action": "add|remove|replace",
      "card_name": "string (EXACT card name)",
      "replace_with": "string (EXACT card name if action is replace)",
      "reason": "string (detailed explanation)",
      "priority": "high|medium|low",
      "estimated_price": "string (e.g., '$2-5', 'Budget', 'Expensive')"
    }}
  ],
  "combos": [
    {{
      "cards": ["card1", "card2", "card3"],
      "description": "string (how the combo works)",
      "type": "infinite|game-winning|value|synergy",
      "difficulty": "easy|medium|hard"
    }}
  ],
  "strategic_recommendations": ["string", "string", ...]
}}
"""
    
    # Use different temperature based on goal for more variation
    temp = 0.8 if optimization_goal in ['casual', 'thematic'] else 0.7
    
    print(f"🚀 Sending request to Groq AI (goal: {optimization_goal}, temp: {temp})")
    
    lang_instruction = "Respond in Italian (italiano)" if language == "it" else "Respond in English"
    
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": f"You are an expert Magic: The Gathering deck builder specializing in {optimization_goal} strategies. {lang_instruction}. Provide detailed, actionable advice for improving decks. Always respond with valid JSON. Make your suggestions SPECIFIC to the {optimization_goal} optimization goal."},
            {"role": "user", "content": prompt}
        ],
        temperature=temp,
        max_tokens=2500,
        response_format={"type": "json_object"}
    )
    print(f"✅ Received response from Groq AI")
    log_openai_cost(response.usage, "deck-analyzer", "gpt-4o")
    
    # Parse response
    suggestions = json.loads(response.choices[0].message.content)
    
    return suggestions

def generate_basic_suggestions(deck_info: dict, deck_cards: List[SavedDeckCard], db: Session) -> dict:
    """
    Genera suggerimenti base senza AI (fallback)
    """
    suggestions = {
        "overall_assessment": "Deck analysis completed using basic heuristics.",
        "mana_curve_analysis": "",
        "synergy_evaluation": "Manual review recommended for detailed synergy analysis.",
        "card_suggestions": [],
        "strategic_recommendations": []
    }
    
    total_cards = deck_info['total_cards']
    mana_curve = deck_info['mana_curve']
    
    # Mana curve analysis
    avg_cmc = sum(cmc * count for cmc, count in mana_curve.items()) / total_cards if total_cards > 0 else 0
    suggestions["mana_curve_analysis"] = f"Average CMC: {avg_cmc:.2f}. "
    
    if avg_cmc > 3.5:
        suggestions["mana_curve_analysis"] += "Deck may be too slow. Consider adding more low-cost cards."
        suggestions["strategic_recommendations"].append("Add more 1-2 mana cards to improve early game")
    elif avg_cmc < 2.0:
        suggestions["mana_curve_analysis"] += "Deck is very aggressive. Ensure you have enough card draw."
        suggestions["strategic_recommendations"].append("Include card draw to maintain momentum")
    else:
        suggestions["mana_curve_analysis"] += "Mana curve looks balanced."
    
    # Check deck size
    if total_cards < 60 and deck_info['format'] != 'commander':
        suggestions["card_suggestions"].append({
            "action": "add",
            "card_name": "Additional cards needed",
            "reason": f"Deck has only {total_cards} cards. Standard decks should have 60+ cards.",
            "priority": "high"
        })
        suggestions["strategic_recommendations"].append(f"Add {60 - total_cards} more cards to reach minimum deck size")
    elif total_cards > 60 and deck_info['format'] != 'commander':
        suggestions["strategic_recommendations"].append("Consider reducing to 60 cards for consistency")
    
    # Check land count (estimate ~24 lands for 60-card deck)
    creature_count = deck_info['card_types'].get('Creature', 0)
    land_count = deck_info['card_types'].get('Land', 0)
    
    if land_count < total_cards * 0.35:
        suggestions["card_suggestions"].append({
            "action": "add",
            "card_name": "Basic lands",
            "reason": "Deck appears to have too few lands. Add more mana sources.",
            "priority": "high"
        })
    
    # Archetype-specific suggestions
    if deck_info['archetype'] == 'aggro' and creature_count < total_cards * 0.4:
        suggestions["strategic_recommendations"].append("Aggro decks typically run 40%+ creatures")
    
    return suggestions

@router.get("/deck-stats/{deck_id}")
def get_deck_stats(
    deck_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Ottieni statistiche dettagliate del mazzo per l'AI Builder
    """
    deck = db.query(SavedDeck).filter(SavedDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    if deck.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get deck cards with MTG data
    deck_cards = db.query(SavedDeckCard).filter(SavedDeckCard.deck_id == deck_id).all()
    
    # Calculate statistics
    stats = {
        "total_cards": 0,
        "unique_cards": len(deck_cards),
        "mana_curve": {},
        "color_distribution": {},
        "type_distribution": {},
        "rarity_distribution": {},
        "average_cmc": 0,
        "cards_by_type": {}
    }
    
    total_cmc = 0
    cards_with_cmc = 0
    
    for card in deck_cards:
        stats["total_cards"] += card.quantity
        
        # Get MTG card data
        mtg_card = db.query(MTGCard).filter(MTGCard.name == card.card_name).first()
        
        if mtg_card:
            # Mana curve
            if mtg_card.mana_value is not None:
                cmc = int(mtg_card.mana_value)
                if cmc > 7:
                    cmc = 7  # Group 7+ together
                stats["mana_curve"][cmc] = stats["mana_curve"].get(cmc, 0) + card.quantity
                total_cmc += mtg_card.mana_value * card.quantity
                cards_with_cmc += card.quantity
            
            # Colors
            if mtg_card.colors:
                for color in mtg_card.colors.split(','):
                    color = color.strip()
                    stats["color_distribution"][color] = stats["color_distribution"].get(color, 0) + card.quantity
            
            # Types
            if mtg_card.types:
                card_type = mtg_card.types.split(',')[0].strip()
                stats["type_distribution"][card_type] = stats["type_distribution"].get(card_type, 0) + card.quantity
            
            # Rarity
            if mtg_card.rarity:
                stats["rarity_distribution"][mtg_card.rarity] = stats["rarity_distribution"].get(mtg_card.rarity, 0) + card.quantity
    
    # Calculate average CMC
    if cards_with_cmc > 0:
        stats["average_cmc"] = round(total_cmc / cards_with_cmc, 2)
    
    return {
        "deck_id": deck_id,
        "deck_name": deck.name,
        "format": deck.format,
        "colors": deck.colors,
        "archetype": deck.archetype,
        "stats": stats
    }

# ── Chat Build Deck ──
MAX_COLLECTION_CARDS_CHAT = 415
CHAT_BUILD_TOKEN_COST = 5

class ChatBuildMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ChatBuildDeckInput(BaseModel):
    user_id: int
    message: str
    history: List[ChatBuildMessage] = []
    collection_id: Optional[int] = None
    format: Optional[str] = None
    colors: Optional[str] = None
    current_deck: Optional[dict] = None  # stato attuale del mazzo in costruzione

@router.post("/chat-build-deck")
async def chat_build_deck(
    input_data: ChatBuildDeckInput,
    language: str = "it",
    db: Session = Depends(get_db)
):
    """
    Costruisce o modifica un mazzo tramite chat AI con memoria della sessione.
    Costo: 5 token per messaggio.
    """
    user = db.query(User).filter(User.id == input_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    check_ai_rate_limit(input_data.user_id)

    if not input_data.message or len(input_data.message.strip()) < 3:
        raise HTTPException(status_code=400, detail="Messaggio troppo corto")

    from app.routers.tokens import consume_token
    consume_token(user, 'ai_chat_build', f'AI Chat Build: {input_data.message[:50]}', db, tokens_to_consume=CHAT_BUILD_TOKEN_COST)

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=openai_api_key)
    except ImportError:
        raise HTTPException(status_code=503, detail="OpenAI library not installed")

    lang_label = "Italian (italiano)" if language == "it" else "English"

    # Carica la collezione se fornita (max 300 carte)
    collection_constraint = ""
    if input_data.collection_id:
        from app.models import Card, CardCollection
        collection = db.query(CardCollection).filter(
            CardCollection.id == input_data.collection_id,
            CardCollection.user_id == input_data.user_id
        ).first()
        if collection:
            coll_cards = db.query(Card).filter(
                Card.collection_id == input_data.collection_id
            ).order_by(Card.quantity_owned.desc()).limit(MAX_COLLECTION_CARDS_CHAT).all()
            if coll_cards:
                card_list = ", ".join(f"{c.name} (x{c.quantity_owned})" for c in coll_cards)
                collection_constraint = f"""

VINCOLO COLLEZIONE (OBBLIGATORIO):
Usa SOLO le carte della collezione "{collection.name}" (max {MAX_COLLECTION_CARDS_CHAT} per quantità).
Carte disponibili: {card_list}
- Le terre base sono sempre permesse anche se non in lista
- Rispetta i limiti di quantità (xN)"""

    format_line = f"Formato: {input_data.format}" if input_data.format else ""
    colors_line = f"Colori: {input_data.colors}" if input_data.colors else ""
    constraints = "\n".join(filter(None, [format_line, colors_line]))

    # Stato attuale del mazzo (se già in costruzione)
    current_deck_context = ""
    if input_data.current_deck and input_data.current_deck.get("cards"):
        deck_cards = input_data.current_deck["cards"]
        total = sum(c.get("quantity", 1) for c in deck_cards)
        deck_name = input_data.current_deck.get("deck_name", "Mazzo in costruzione")
        current_deck_context = f"""

MAZZO ATTUALE IN COSTRUZIONE: "{deck_name}"
Totale carte: {total}
Carte: {json.dumps(deck_cards, ensure_ascii=False)}
- Quando l'utente chiede modifiche, parti da questo mazzo e aggiornalo
- Mantieni il totale di {total} carte salvo diversa indicazione"""

    system_prompt = f"""Sei un esperto costruttore di mazzi Magic: The Gathering. Aiuti l'utente a costruire mazzi tramite conversazione.

ISTRUZIONI:
- Rispondi SEMPRE in {lang_label}
- Quando l'utente descrive un mazzo o chiede modifiche, costruisci/aggiorna il mazzo e restituiscilo nel JSON
- Se l'utente fa domande generali su MTG, rispondi senza aggiornare il mazzo
- Mantieni la coerenza con i messaggi precedenti della conversazione
- Spiega le tue scelte in modo chiaro e conciso
{constraints}{collection_constraint}{current_deck_context}

CATEGORIE CARTE (usa ESATTAMENTE questi valori per il campo "category"):
- "Creature" → creature
- "Instant" → istantanei
- "Sorcery" → stregonerie
- "Enchantment" → incantesimi (NON Equipment)
- "Equipment" → equipaggiamenti (sottotipo artefatto)
- "Artifact" → artefatti generici (non Equipment)
- "Planeswalker" → planeswalker
- "Land" → terre
- "Other" → altro

LINEE GUIDA PROPORZIONI (adatta alla strategia, ma rispetta questi range):
- Terre: 33-40 carte (Commander 100 carte), 20-26 (60 carte), 17-24 (40 carte)
- Creature: bilancia in base all'archetipo (aggro: 24-30, control: 6-12, midrange: 16-24)
- Istantanei + Stregonerie: rimozioni, draw, interazione (8-16 in 60 carte)
- Incantesimi + Artefatti + Equipment: supporto e sinergie (4-12 in 60 carte)
- Assicurati che le proporzioni siano coerenti con la strategia dichiarata

Rispondi SEMPRE con JSON valido in questo formato:
{{
  "message": "La tua risposta testuale qui",
  "deck_updated": true/false,
  "deck": {{
    "deck_name": "nome",
    "deck_description": "descrizione strategia",
    "format": "formato",
    "colors": "identità colore (es. WU, BRG)",
    "archetype": "archetipo",
    "strategy_notes": "note strategia",
    "cards": [
      {{"card_name": "Nome Carta", "quantity": 4, "cmc": 2, "category": "Creature|Instant|Sorcery|Enchantment|Equipment|Artifact|Planeswalker|Land|Other", "role": "ruolo"}}
    ],
    "key_cards": ["Carta1", "Carta2"]
  }}
}}

Se deck_updated è false, deck può essere null."""

    messages = [{"role": "system", "content": system_prompt}]
    for msg in input_data.history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": input_data.message.strip()})

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            max_completion_tokens=10000,
            response_format={"type": "json_object"}
        )
        log_openai_cost(response.usage, "chat-build", "gpt-4o")
        result = json.loads(response.choices[0].message.content)

        deck_updated = result.get("deck_updated", False)
        deck = result.get("deck")

        if deck_updated and deck and deck.get("cards"):
            deck = enforce_deck_size(deck, input_data.format, input_data.colors)
            # Arricchisci con mana_value dal DB MTG (fallback al cmc fornito dall'AI)
            for card in deck.get("cards", []):
                mtg = db.query(MTGCard).filter(MTGCard.name == card.get("card_name")).first()
                if mtg and mtg.mana_value is not None:
                    card["cmc"] = int(mtg.mana_value)

        print(f"✅ Chat Build Deck: deck_updated={deck_updated}, msg={result.get('message','')[:60]}")

        return {
            "assistant_message": result.get("message", ""),
            "deck_updated": deck_updated,
            "deck": deck,
            "tokens_remaining": user.tokens
        }

    except Exception as e:
        import traceback
        err_str = str(e)
        print(f"❌ Chat Build Deck failed: {err_str}")
        print(f"❌ Full traceback:\n{traceback.format_exc()}")
        if hasattr(e, 'body'): print(f"❌ OpenAI error body: {e.body}")
        if '413' in err_str or 'rate_limit_exceeded' in err_str:
            raise HTTPException(status_code=503, detail="DEMO_RATE_LIMIT")
        raise HTTPException(status_code=503, detail=f"AI error: {err_str}")
