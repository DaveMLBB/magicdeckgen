from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import User, SavedDeck, SavedDeckCard
from app.routers.ai_builder import check_ai_rate_limit, enforce_deck_size
import os
import json

router = APIRouter()

BOOST_TOKEN_COST = 10

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class BoostDeckInput(BaseModel):
    user_id: int
    deck_id: int                        # mazzo salvato da modificare
    message: str                        # nuovo messaggio utente
    history: List[ChatMessage] = []     # cronologia chat precedente
    current_deck: Optional[dict] = None # stato attuale del mazzo (se già modificato)

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

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=503, detail="Servizio AI non configurato")

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=groq_api_key, base_url="https://api.groq.com/openai/v1")
    except ImportError:
        raise HTTPException(status_code=503, detail="Libreria OpenAI non installata")

    lang_label = "Italian (italiano)" if language == "it" else "English"
    deck_format = saved_deck.format or "non specificato"
    deck_name = saved_deck.name or "Mazzo senza nome"
    total_cards = sum(c.get("quantity", 1) for c in deck_cards)

    system_prompt = f"""Sei un esperto costruttore di mazzi Magic: The Gathering. Stai aiutando un giocatore a modificare il suo mazzo esistente tramite una conversazione.

MAZZO ATTUALE: "{deck_name}"
Formato: {deck_format}
Totale carte: {total_cards}
Carte: {json.dumps(deck_cards, ensure_ascii=False)}

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
            model="moonshotai/kimi-k2-instruct-0905",
            messages=messages,
            temperature=0.7,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )
        raw = response.choices[0].message.content
        result = json.loads(raw)

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
