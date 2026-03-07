from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import User, SavedDeck, SavedDeckCard, Card, CardCollection
from app.routers.ai_builder import check_ai_rate_limit, enforce_deck_size
import os
import json

router = APIRouter()

MAX_COLLECTION_CARDS = 300
BOOST_TOKEN_COST = 2  # Token cost per AI boost message

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

@router.post("/boost-deck")
async def boost_deck(
    input_data: BoostDeckInput,
    language: str = "it",
    db: Session = Depends(get_db)
):
    """
    Modifica un mazzo esistente tramite chat AI con memoria della sessione.
    Costo: 10 token per messaggio.
    """
    user = db.query(User).filter(User.id == input_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")

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
    consume_token(
        user, 'ai_boost_deck',
        f'AI Deck Boost: {input_data.message[:50]}',
        db,
        tokens_to_consume=BOOST_TOKEN_COST
    )

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

VINCOLO COLLEZIONE (MOLTO IMPORTANTE):
Il giocatore vuole modificare il mazzo usando SOLO le carte della sua collezione "{collection.name}".
Carte disponibili (max {MAX_COLLECTION_CARDS} per quantità): {card_list}
- Puoi usare SOLO carte presenti in questa lista (le terre base sono sempre permesse)
- Rispetta i limiti di quantità indicati come (xN)
- Se una carta del mazzo attuale non è nella collezione, sostituiscila con una alternativa disponibile"""

    system_prompt = f"""Sei un esperto costruttore di mazzi Magic: The Gathering. Stai aiutando un giocatore a modificare il suo mazzo esistente tramite una conversazione.

MAZZO ATTUALE: "{deck_name}"
Formato: {deck_format}
Totale carte: {total_cards}
Carte: {json.dumps(deck_cards, ensure_ascii=False)}{collection_constraint}

ISTRUZIONI:
- Rispondi SEMPRE in {lang_label}
- Quando l'utente chiede modifiche al mazzo, applica le modifiche e restituisci il mazzo aggiornato
- Mantieni il numero totale di carte uguale all'originale ({total_cards} carte)
- Spiega brevemente le modifiche apportate
- Se l'utente fa domande senza chiedere modifiche, rispondi normalmente senza aggiornare il mazzo
- Rispondi SEMPRE con JSON valido nel formato specificato

Formato risposta JSON:
{{
  "message": "La tua risposta testuale qui",
  "deck_modified": true/false,
  "updated_deck": {{
    "cards": [
      {{"card_name": "Nome Carta", "quantity": 4, "category": "Creature|Spell|Enchantment|Artifact|Planeswalker|Land|Other", "role": "ruolo"}}
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
            max_tokens=3000,
            response_format={"type": "json_object"}
        )
        raw = response.choices[0].message.content
        print(f"🔍 GPT-4o raw response: {raw[:300] if raw else 'EMPTY'}")
        
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
            updated_deck = enforce_deck_size(updated_deck, deck_format, saved_deck.colors)
        else:
            # Restituisce il mazzo corrente invariato
            updated_deck = {"cards": deck_cards}

        print(f"✅ AI Beck Boost: deck_modified={deck_modified}, message={assistant_message[:60]}")

        return {
            "assistant_message": assistant_message,
            "deck_modified": deck_modified,
            "updated_deck": updated_deck,
            "tokens_remaining": user.tokens
        }

    except Exception as e:
        err_str = str(e)
        print(f"❌ AI boost-deck fallito: {err_str}")
        if '413' in err_str or 'rate_limit_exceeded' in err_str or 'Request too large' in err_str:
            raise HTTPException(status_code=503, detail="DEMO_RATE_LIMIT")
        raise HTTPException(status_code=503, detail=f"Errore AI: {err_str}")
