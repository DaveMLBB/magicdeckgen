from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import User, SavedDeck, SavedDeckCard, Card, CardCollection, MTGCard
from app.routers.ai_builder import check_ai_rate_limit, enforce_deck_size, get_user_or_anon, maybe_consume_token
from app.dependencies import anonymous_trial_guard
import os
import json

router = APIRouter()

MAX_COLLECTION_CARDS = 300
BOOST_TOKEN_COST = 5  # Token cost per AI boost message

GPT4O_INPUT_COST  = 2.50
GPT4O_OUTPUT_COST = 10.00

def log_openai_cost(usage, endpoint: str, model: str = "gpt-4o"):
    pricing = {
        "gpt-4o":      {"input": 2.50,  "output": 10.00},
        "gpt-4o-mini": {"input": 0.15,  "output": 0.60},
        "gpt-5-nano":  {"input": 0.05,  "output": 0.40},
        "gpt-5-mini":  {"input": 0.25,  "output": 2.00},
        "gpt-5":       {"input": 1.25,  "output": 10.00},
    }
    p = pricing.get(model, pricing["gpt-4o"])
    cost = (usage.prompt_tokens * p["input"] + usage.completion_tokens * p["output"]) / 1_000_000
    print(f"[AI:{endpoint}] model={model} tokens — prompt: {usage.prompt_tokens}, completion: {usage.completion_tokens}, total: {usage.total_tokens} (~${cost:.5f})")

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class BoostDeckInput(BaseModel):
    user_id: int
    deck_id: int                        # mazzo salvato da modificare
    message: str                        # nuovo messaggio utente
    history: List[ChatMessage] = []     # cronologia chat precedente
    current_deck: Optional[dict] = None # stato attuale del mazzo (se già modificato)
    collection_id: Optional[int] = None # collezione da usare come vincolo
    deck_size_override: Optional[int] = None  # se impostato, ignora il vincolo delle 60 carte

@router.post("/boost-deck")
async def boost_deck(
    input_data: BoostDeckInput,
    request: Request,
    language: str = "it",
    _trial: None = Depends(anonymous_trial_guard("boost_ai_anon")),
    db: Session = Depends(get_db)
):
    """
    Modifica un mazzo esistente tramite chat AI con memoria della sessione.
    Costo: 5 token per messaggio (utenti registrati). 1 utilizzo/mese per anonimi.
    """
    user, is_anon = get_user_or_anon(input_data.user_id, db)

    if is_anon:
        raise HTTPException(status_code=400, detail="AI Deck Boost richiede un mazzo salvato. Registrati per usare questa funzione.")

    check_ai_rate_limit(input_data.user_id)

    if not input_data.message or len(input_data.message.strip()) < 3:
        raise HTTPException(status_code=400, detail="Messaggio troppo corto")

    # Carica il mazzo originale dal DB
    saved_deck = db.query(SavedDeck).filter(
        SavedDeck.id == input_data.deck_id,
        SavedDeck.user_id == input_data.user_id
    ).first()
    if not saved_deck:
        raise HTTPException(status_code=404, detail="Mazzo non trovato")

    # Usa il mazzo corrente (già modificato) se fornito, altrimenti carica dal DB
    if input_data.current_deck and input_data.current_deck.get("cards"):
        deck_cards = input_data.current_deck["cards"]
    else:
        db_cards = db.query(SavedDeckCard).filter(
            SavedDeckCard.deck_id == input_data.deck_id
        ).all()
        deck_cards = [
            {
                "card_name": c.card_name,
                "quantity": c.quantity,
                "category": c.card_type or "Unknown",
                "role": ""
            }
            for c in db_cards
        ]

    from app.routers.tokens import consume_token
    maybe_consume_token(user, is_anon, 'ai_boost_deck',
        f'AI Deck Boost: {input_data.message[:50]}', db,
        tokens_to_consume=BOOST_TOKEN_COST)

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=503, detail="Servizio AI non configurato")

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=openai_api_key)
    except ImportError:
        raise HTTPException(status_code=503, detail="Libreria OpenAI non installata")

    lang_label = "Italian (italiano)" if language == "it" else "English"
    deck_format = saved_deck.format or "non specificato"
    deck_name = saved_deck.name or "Mazzo senza nome"
    total_cards = sum(c.get("quantity", 1) for c in deck_cards)

    # Determina il target size
    target_size = input_data.deck_size_override if input_data.deck_size_override else total_cards
    size_rule = f"Il mazzo PUÒ avere qualsiasi numero di carte — l'utente ha disabilitato il vincolo sul numero di carte." if input_data.deck_size_override == 0 else f"Il mazzo DEVE avere esattamente {target_size} carte totali (somma di tutte le quantity)."

    # Carica la collezione se fornita (max 300 carte uniche)
    collection_constraint = ""
    if input_data.collection_id:
        collection = db.query(CardCollection).filter(
            CardCollection.id == input_data.collection_id,
            CardCollection.user_id == input_data.user_id
        ).first()
        if collection:
            coll_cards = db.query(Card).filter(
                Card.collection_id == input_data.collection_id
            ).order_by(Card.quantity_owned.desc()).limit(MAX_COLLECTION_CARDS).all()

            if coll_cards:
                BASIC_LANDS = {"plains", "island", "swamp", "mountain", "forest",
                               "wastes", "snow-covered plains", "snow-covered island",
                               "snow-covered swamp", "snow-covered mountain", "snow-covered forest"}
                card_list = ", ".join(
                    f"{c.name} (x{c.quantity_owned})" for c in coll_cards
                )
                collection_constraint = f"""

VINCOLO COLLEZIONE (OBBLIGATORIO):
Il giocatore vuole modificare il mazzo usando le carte della sua collezione "{collection.name}".
Carte disponibili (max {MAX_COLLECTION_CARDS} per quantità): {card_list}

REGOLE COLLEZIONE:
- Usa SOLO le carte presenti in questa lista, rispettando i limiti di quantità (xN)
- Le TERRE BASE (Plains, Island, Swamp, Mountain, Forest, Wastes, snow-covered variants) sono SEMPRE permesse anche se non nella lista
- Puoi aggiungere al massimo 5 carte NON presenti nella collezione (solo se strettamente necessario per bilanciare il mazzo)
- Se una carta del mazzo attuale non è nella collezione, sostituiscila con un'alternativa disponibile nella lista
- NON inventare carte che non sono nella lista sopra (eccetto le 5 eccezioni e le terre base)"""

    system_prompt = f"""Sei un esperto costruttore di mazzi Magic: The Gathering. Stai aiutando un giocatore a modificare il suo mazzo esistente tramite una conversazione.

MAZZO ATTUALE: "{deck_name}"
Formato: {deck_format}
Totale carte: {total_cards}
Carte: {json.dumps(deck_cards, ensure_ascii=False)}{collection_constraint}

REGOLE ASSOLUTE — NON VIOLARLE MAI:
1. {size_rule}
2. Le TERRE (category "Land") devono rispettare questi range in base al totale carte:
   - 40 carte: 15-18 terre
   - 60 carte: 15-25 terre (ideale ~22-24 per mazzi normali, ~18-20 per mazzi aggro con curva bassa)
   - 75 carte: 20-28 terre
   - 80 carte: 22-30 terre
   - 99/100 carte (Commander): 33-38 terre
   - Regola generale: circa il 35-40% del mazzo per mazzi midrange/control, 25-30% per aggro con curva bassa
   - Se l'utente non chiede esplicitamente di cambiare le terre, MANTIENI il numero attuale SE è già nel range corretto.
3. Terre base (Plains, Island, Swamp, Mountain, Forest, Wastes e varianti snow-covered) sono SEMPRE permesse anche se non nella collezione.
4. Bilancia la curva di mana: distribuisci le carte non-terra su costi 1-6+ in modo sensato per il formato.

ISTRUZIONI:
- Rispondi SEMPRE in {lang_label}
- Quando l'utente chiede modifiche al mazzo, applica le modifiche e restituisci il mazzo aggiornato
- Spiega brevemente le modifiche apportate, incluso quante terre ci sono e la curva di mana
- Se l'utente fa domande senza chiedere modifiche, rispondi normalmente senza aggiornare il mazzo
- Rispondi SEMPRE con JSON valido nel formato specificato

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

Formato risposta JSON:
{{
  "message": "La tua risposta testuale qui",
  "deck_modified": true/false,
  "updated_deck": {{
    "cards": [
      {{"card_name": "Nome Carta", "quantity": 4, "cmc": 2, "category": "Creature|Instant|Sorcery|Enchantment|Equipment|Artifact|Planeswalker|Land|Other", "role": "ruolo"}}
    ]
  }}
}}

Se deck_modified è false, updated_deck può essere null."""

    # Costruisci la lista messaggi con la history
    messages = [{"role": "system", "content": system_prompt}]
    for msg in input_data.history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": input_data.message.strip()})

    try:
        response = await client.chat.completions.create(
            model="gpt-5.1",
            messages=messages,
            temperature=0.7,
            max_completion_tokens=10000,
            response_format={"type": "json_object"}
        )
        raw = response.choices[0].message.content
        log_openai_cost(response.usage, "deck-boost", "gpt-5.1")
        print(f"[AI:deck-boost] raw response: {raw[:300] if raw else 'EMPTY'}")
        
        if not raw or not raw.strip():
            raise ValueError("GPT-5.1-nano returned empty response")
        
        # Estrai JSON dalla risposta (potrebbe avere testo prima/dopo)
        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            # Cerca blocco JSON nella risposta
            import re
            json_match = re.search(r'\{.*\}', raw, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(0))
            else:
                raise ValueError(f"No valid JSON found in response: {raw[:200]}")

        assistant_message = result.get("message", "")
        deck_modified = result.get("deck_modified", False)
        updated_deck = result.get("updated_deck")

        # Se il mazzo è stato modificato, applica enforce_deck_size
        if deck_modified and updated_deck and updated_deck.get("cards"):
            BASIC_LANDS = {"plains", "island", "swamp", "mountain", "forest",
                           "wastes", "snow-covered plains", "snow-covered island",
                           "snow-covered swamp", "snow-covered mountain", "snow-covered forest"}

            # Range terre validi in base al totale carte
            def get_land_range(n):
                if n <= 40:   return (15, 18)
                if n <= 60:   return (15, 25)
                if n <= 75:   return (20, 28)
                if n <= 80:   return (22, 30)
                return (33, 38)  # Commander 99/100

            land_min, land_max = get_land_range(total_cards)

            updated_lands = [c for c in updated_deck["cards"] if c.get("category") == "Land" or c.get("card_name", "").lower() in BASIC_LANDS]
            updated_land_count = sum(c.get("quantity", 1) for c in updated_lands)
            original_lands = [c for c in deck_cards if c.get("category") == "Land" or c.get("card_name", "").lower() in BASIC_LANDS]
            original_land_count = sum(c.get("quantity", 1) for c in original_lands)

            # Intervieni solo se l'AI è uscita dal range valido
            if updated_land_count < land_min:
                print(f"⚠️ Troppe poche terre ({updated_land_count}), minimo {land_min} per {total_cards} carte — ripristino terre originali")
                non_land_updated = [c for c in updated_deck["cards"] if c.get("category") != "Land" and c.get("card_name", "").lower() not in BASIC_LANDS]
                updated_deck["cards"] = non_land_updated + original_lands
                # Ribilancia il totale
                current_total = sum(c.get("quantity", 1) for c in updated_deck["cards"])
                diff = total_cards - current_total
                if diff != 0 and non_land_updated:
                    non_land_updated[-1]["quantity"] = max(1, non_land_updated[-1].get("quantity", 1) + diff)
            elif updated_land_count > land_max:
                print(f"⚠️ Troppe terre ({updated_land_count}), massimo {land_max} per {total_cards} carte — riduco")
                # Riduci le terre in eccesso togliendo dalle terre non-base prima
                excess = updated_land_count - land_max
                non_basic_lands = [c for c in updated_lands if c.get("card_name", "").lower() not in BASIC_LANDS]
                for land in non_basic_lands:
                    if excess <= 0:
                        break
                    remove = min(excess, land.get("quantity", 1) - 1)
                    land["quantity"] = land.get("quantity", 1) - remove
                    excess -= remove
                # Se ancora troppe, riduci le terre base
                if excess > 0:
                    basic_lands = [c for c in updated_lands if c.get("card_name", "").lower() in BASIC_LANDS]
                    for land in basic_lands:
                        if excess <= 0:
                            break
                        remove = min(excess, land.get("quantity", 1) - 1)
                        land["quantity"] = land.get("quantity", 1) - remove
                        excess -= remove
                # Rimuovi carte con quantity 0
                updated_deck["cards"] = [c for c in updated_deck["cards"] if c.get("quantity", 0) > 0]

            updated_deck = enforce_deck_size(updated_deck, deck_format, saved_deck.colors) if input_data.deck_size_override != 0 else updated_deck
            # Arricchisci cmc dal DB MTG (fallback al valore fornito dall'AI)
            # Costruisci lookup dalle carte originali per preservare cmc esistente
            original_cmc = {c["card_name"]: c.get("cmc", 0) for c in deck_cards}
            for card in updated_deck.get("cards", []):
                mtg = db.query(MTGCard).filter(MTGCard.name == card.get("card_name")).first()
                if mtg and mtg.mana_value is not None:
                    card["cmc"] = int(mtg.mana_value)
                elif card.get("cmc") is None or card.get("cmc") == 0:
                    # fallback: usa il cmc della carta originale se era già nel mazzo
                    card["cmc"] = original_cmc.get(card["card_name"], 0)
        else:
            # Restituisce il mazzo corrente invariato
            updated_deck = {"cards": deck_cards}

        print(f"✅ AI Beck Boost: deck_modified={deck_modified}, message={assistant_message[:60]}")

        return {
            "assistant_message": assistant_message,
            "deck_modified": deck_modified,
            "updated_deck": updated_deck,
            "tokens_remaining": user.tokens if not is_anon else 0
        }

    except Exception as e:
        import traceback
        err_str = str(e)
        print(f"❌ AI boost-deck fallito: {err_str}")
        print(f"❌ Full traceback:\n{traceback.format_exc()}")
        if hasattr(e, 'body'): print(f"❌ OpenAI error body: {e.body}")
        if '413' in err_str or 'rate_limit_exceeded' in err_str or 'Request too large' in err_str:
            raise HTTPException(status_code=503, detail="DEMO_RATE_LIMIT")
        raise HTTPException(status_code=503, detail=f"Errore AI: {err_str}")
