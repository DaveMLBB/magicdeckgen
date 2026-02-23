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
    consume_token(user, 'ai_optimization', f'AI deck optimization: deck {input_data.deck_id}', db, tokens_to_consume=2)
    
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
