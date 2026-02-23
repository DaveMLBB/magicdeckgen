from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import User, SavedDeck, SavedDeckCard, MTGCard
import os
import json

router = APIRouter()

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
    Consuma 10 token.
    """
    user = db.query(User).filter(User.id == input_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not input_data.description or len(input_data.description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Description too short (min 10 characters)")

    from app.routers.tokens import consume_token
    consume_token(user, 'ai_build_deck', f'AI build deck: {input_data.description[:60]}', db, tokens_to_consume=10)

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=groq_api_key, base_url="https://api.groq.com/openai/v1")
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
            coll_cards = db.query(Card).filter(Card.collection_id == input_data.collection_id).all()
            if coll_cards:
                card_list = ", ".join(
                    f"{c.name} (x{c.quantity_owned})" for c in coll_cards
                )
                collection_constraint = f"""

COLLECTION CONSTRAINT (VERY IMPORTANT):
The user wants to build this deck using ONLY cards from their collection "{collection.name}".
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
            model="llama-3.3-70b-versatile",
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
        deck_data = json.loads(response.choices[0].message.content)
        print(f"✅ AI built deck: {deck_data.get('deck_name', 'unnamed')}")
        return {
            "deck": deck_data,
            "tokens_remaining": user.tokens
        }
    except Exception as e:
        print(f"❌ AI build-deck failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"AI processing error: {str(e)}")

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

    if not input_data.card_names or len(input_data.card_names) == 0:
        raise HTTPException(status_code=400, detail="Provide at least one card name")

    if len(input_data.card_names) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 cards allowed")

    from app.routers.tokens import consume_token
    consume_token(user, 'ai_twins', f'AI twins search: {", ".join(input_data.card_names)}', db, tokens_to_consume=10)

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
        print(f"❌ AI twins failed: {str(e)}")
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
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise Exception("Groq API key not configured")

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=groq_api_key,
            base_url="https://api.groq.com/openai/v1"
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
        model="llama-3.3-70b-versatile",
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

    if not input_data.card_names or len(input_data.card_names) == 0:
        raise HTTPException(status_code=400, detail="Provide at least one card name")

    if len(input_data.card_names) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 seed cards allowed")

    from app.routers.tokens import consume_token
    consume_token(user, 'ai_synergy', f'AI synergy search: {", ".join(input_data.card_names)}', db, tokens_to_consume=10)

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
        print(f"❌ AI synergy failed: {str(e)}")
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
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise Exception("Groq API key not configured")

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=groq_api_key,
            base_url="https://api.groq.com/openai/v1"
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
        model="llama-3.3-70b-versatile",
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
        # If AI fails, provide basic analysis
        print(f"❌ AI failed: {str(e)}")
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
    groq_api_key = os.getenv("GROQ_API_KEY")
    
    if not groq_api_key:
        raise Exception("Groq API key not configured")
    
    # Import Groq (compatible with OpenAI SDK)
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=groq_api_key,
            base_url="https://api.groq.com/openai/v1"
        )
    except ImportError:
        raise Exception("OpenAI library not installed (needed for Groq compatibility)")
    
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
    
    # Call Groq (Llama 3.1 70B - FREE and FAST!)
    # Use different temperature based on goal for more variation
    temp = 0.8 if optimization_goal in ['casual', 'thematic'] else 0.7
    
    print(f"🚀 Sending request to Groq AI (goal: {optimization_goal}, temp: {temp})")
    
    lang_instruction = "Respond in Italian (italiano)" if language == "it" else "Respond in English"
    
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": f"You are an expert Magic: The Gathering deck builder specializing in {optimization_goal} strategies. {lang_instruction}. Provide detailed, actionable advice for improving decks. Always respond with valid JSON. Make your suggestions SPECIFIC to the {optimization_goal} optimization goal."},
            {"role": "user", "content": prompt}
        ],
        temperature=temp,
        max_tokens=2500,
        response_format={"type": "json_object"}
    )
    
    print(f"✅ Received response from Groq AI")
    
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
