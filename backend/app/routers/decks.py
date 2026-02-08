from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import defaultdict
from app.database import get_db
from app.models import Card

router = APIRouter()

# Archetipi base con requisiti
ARCHETYPES = {
    "aggro": {
        "description": "Deck veloce con creature a basso costo",
        "max_avg_cmc": 2.5,
        "min_creatures": 20,
        "preferred_types": ["creature"]
    },
    "midrange": {
        "description": "Deck bilanciato con creature di medio costo",
        "max_avg_cmc": 3.5,
        "min_creatures": 15,
        "preferred_types": ["creature", "planeswalker"]
    },
    "control": {
        "description": "Deck difensivo con rimozioni e counterspell",
        "max_avg_cmc": 4.0,
        "min_creatures": 5,
        "preferred_types": ["instant", "sorcery", "enchantment"]
    },
    "combo": {
        "description": "Deck basato su sinergie specifiche",
        "max_avg_cmc": 3.0,
        "min_creatures": 8,
        "preferred_types": ["instant", "sorcery", "artifact"]
    }
}

def parse_mana_cost(mana_cost: str) -> int:
    """Calcola CMC da stringa mana cost"""
    if not mana_cost or mana_cost == 'None':
        return 0
    cmc = 0
    i = 0
    while i < len(mana_cost):
        char = mana_cost[i]
        if char.isdigit():
            num = ""
            while i < len(mana_cost) and mana_cost[i].isdigit():
                num += mana_cost[i]
                i += 1
            cmc += int(num)
            continue
        elif char in 'WUBRG':
            cmc += 1
        i += 1
    return cmc

def get_card_colors(card: Card) -> set:
    """Estrai colori dalla carta"""
    colors = set()
    if card.colors:
        for c in card.colors.upper():
            if c in 'WUBRG':
                colors.add(c)
    if card.mana_cost:
        for c in card.mana_cost.upper():
            if c in 'WUBRG':
                colors.add(c)
    return colors

@router.get("/generate/{user_id}")
def generate_decks(user_id: str, format: str = "standard", db: Session = Depends(get_db)):
    """Genera deck possibili basati sulle carte dell'utente"""
    cards = db.query(Card).filter(Card.user_id == user_id).all()
    
    if not cards:
        return {"decks": [], "message": "No cards found. Please upload a file first."}
    
    # Raggruppa carte per colore
    cards_by_color = defaultdict(list)
    for card in cards:
        colors = get_card_colors(card)
        if not colors:
            cards_by_color['C'].append(card)  # Colorless
        else:
            for color in colors:
                cards_by_color[color].append(card)
    
    # Genera deck per ogni combinazione di colori viable
    generated_decks = []
    color_combos = [
        ['W'], ['U'], ['B'], ['R'], ['G'],  # Mono
        ['W', 'U'], ['U', 'B'], ['B', 'R'], ['R', 'G'], ['G', 'W'],  # Allied
        ['W', 'B'], ['U', 'R'], ['B', 'G'], ['R', 'W'], ['G', 'U'],  # Enemy
    ]
    
    for colors in color_combos:
        deck_cards = []
        seen_names = set()
        
        # Raccogli carte dei colori selezionati
        for color in colors:
            for card in cards_by_color.get(color, []):
                if card.name not in seen_names:
                    deck_cards.append(card)
                    seen_names.add(card.name)
        
        # Aggiungi carte colorless
        for card in cards_by_color.get('C', []):
            if card.name not in seen_names:
                deck_cards.append(card)
                seen_names.add(card.name)
        
        if len(deck_cards) < 20:
            continue
        
        # Analizza per ogni archetipo
        for archetype, reqs in ARCHETYPES.items():
            creatures = [c for c in deck_cards if 'creature' in (c.card_type or '').lower()]
            spells = [c for c in deck_cards if c.card_type and c.card_type.lower() in ['instant', 'sorcery']]
            
            # Calcola CMC medio
            cmcs = [parse_mana_cost(c.mana_cost) for c in deck_cards if c.mana_cost]
            avg_cmc = sum(cmcs) / len(cmcs) if cmcs else 0
            
            # Verifica requisiti archetipo
            if archetype == "aggro" and (len(creatures) < reqs["min_creatures"] or avg_cmc > reqs["max_avg_cmc"]):
                continue
            if archetype == "control" and len(spells) < 10:
                continue
            
            # Seleziona le migliori 60 carte per il deck
            selected = select_deck_cards(deck_cards, archetype, 60)
            
            if len(selected) >= 40:
                generated_decks.append({
                    "name": f"{'/'.join(colors)} {archetype.capitalize()}",
                    "archetype": archetype,
                    "colors": '/'.join(colors),
                    "format": format,
                    "card_count": len(selected),
                    "avg_cmc": round(avg_cmc, 2),
                    "cards": [{"name": c.name, "type": c.card_type, "quantity": min(c.quantity_owned, 4)} for c in selected[:60]],
                    "description": reqs["description"]
                })
    
    # Ordina per numero di carte (deck più completi prima)
    generated_decks.sort(key=lambda d: d["card_count"], reverse=True)
    
    return {
        "decks": generated_decks[:10],  # Top 10 deck
        "total_cards": len(cards),
        "colors_available": list(cards_by_color.keys())
    }

def select_deck_cards(cards: list, archetype: str, target: int) -> list:
    """Seleziona carte per un deck specifico"""
    selected = []
    creatures = []
    spells = []
    lands = []
    others = []
    
    for card in cards:
        card_type = (card.card_type or '').lower()
        if 'creature' in card_type:
            creatures.append(card)
        elif 'land' in card_type:
            lands.append(card)
        elif card_type in ['instant', 'sorcery']:
            spells.append(card)
        else:
            others.append(card)
    
    # Ordina creature per CMC
    creatures.sort(key=lambda c: parse_mana_cost(c.mana_cost))
    
    if archetype == "aggro":
        selected.extend(creatures[:24])
        selected.extend(spells[:12])
    elif archetype == "control":
        selected.extend(spells[:20])
        selected.extend(creatures[:8])
        selected.extend(others[:8])
    elif archetype == "midrange":
        selected.extend(creatures[:18])
        selected.extend(spells[:12])
        selected.extend(others[:6])
    else:  # combo
        selected.extend(spells[:16])
        selected.extend(creatures[:12])
        selected.extend(others[:8])
    
    selected.extend(lands[:24])
    
    return selected[:target]


@router.get("/match/{user_id}")
def match_decks(
    user_id: str, 
    format: str = None,  # OPZIONALE - Formato del mazzo
    colors: str = None,  # Colori separati da virgola: "W,U,B"
    min_match: int = 10,  # Percentuale minima di match
    buildable_only: bool = False,  # Solo mazzi costruibili (>=90%)
    db: Session = Depends(get_db)
):
    """Trova mazzi template che puoi costruire con le tue carte"""
    from app.models import DeckTemplate, DeckTemplateCard, User
    
    # Get user to check subscription
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        return {"decks": [], "message": "User not found"}
    
    # Check if user can search (has searches remaining)
    if user.searches_count >= user.searches_limit:
        raise HTTPException(
            status_code=403,
            detail=f"Search limit reached ({user.searches_limit}). Please upgrade your subscription to continue."
        )
    
    # Determine result limit based on subscription
    result_limits = {
        'free': 10,
        'monthly_10': 20,
        'monthly_30': 30,
        'yearly': None,  # unlimited
        'lifetime': None  # unlimited
    }
    result_limit = result_limits.get(user.subscription_type, 10)
    
    # Terre base da normalizzare
    BASIC_LANDS = {
        'plains': 'Plains',
        'island': 'Island', 
        'swamp': 'Swamp',
        'mountain': 'Mountain',
        'forest': 'Forest'
    }
    
    def normalize_card_name(name: str) -> str:
        """Normalizza il nome della carta, specialmente per le terre base"""
        if not name:
            return name
        
        name_lower = name.lower().strip()
        
        # Controlla se contiene una terra base
        for basic_land_key, basic_land_name in BASIC_LANDS.items():
            if basic_land_key in name_lower:
                if name_lower.startswith(basic_land_key):
                    return basic_land_name
                words = name_lower.replace('-', ' ').replace('(', ' ').replace(')', ' ').split()
                if basic_land_key in words:
                    return basic_land_name
        
        return name
    
    # Carica le carte dell'utente
    user_cards = db.query(Card).filter(Card.user_id == user_id).all()
    
    if not user_cards:
        return {"decks": [], "message": "No cards found. Please upload a file first."}
    
    # Crea un dizionario delle carte possedute (con normalizzazione)
    owned_cards = {}
    for card in user_cards:
        card_name = normalize_card_name(card.name).lower().strip()
        if card_name in owned_cards:
            owned_cards[card_name] += card.quantity_owned
        else:
            owned_cards[card_name] = card.quantity_owned
    
    print(f"🃏 Carte possedute: {len(owned_cards)}")
    
    # Costruisci query - formato opzionale
    query = db.query(DeckTemplate)
    if format:
        query = query.filter(DeckTemplate.format == format)
        print(f"🎯 Filtro formato: {format}")
    else:
        print(f"🎯 Nessun filtro formato - cerca in tutti i formati")
    
    templates = query.all()
    print(f"📋 Template disponibili: {len(templates)}")
    
    # Log filtri applicati
    if colors:
        print(f"🎨 Filtro colori: {colors}")
    if min_match > 10:
        print(f"📊 Match minimo: {min_match}%")
    if buildable_only:
        print(f"🎯 Solo costruibili (>=90%)")
    
    print(f"👤 Utente: {user.subscription_type} - Limite risultati: {result_limit if result_limit else 'illimitato'}")
    
    matched_decks = []
    
    for template in templates:
        # Carica le carte del template
        template_cards = db.query(DeckTemplateCard).filter(
            DeckTemplateCard.deck_template_id == template.id
        ).all()
        
        if not template_cards:
            continue
        
        # Calcola match percentage
        total_cards_needed = 0
        cards_owned = 0
        missing_cards = []
        missing_cards_total = 0  # Totale carte mancanti (somma quantità)
        deck_list = []
        
        for tc in template_cards:
            # Normalizza anche il nome della carta del template
            card_name = normalize_card_name(tc.card_name).lower().strip()
            quantity_needed = tc.quantity
            total_cards_needed += quantity_needed
            
            quantity_have = owned_cards.get(card_name, 0)
            cards_owned += min(quantity_have, quantity_needed)
            
            missing_qty = max(0, quantity_needed - quantity_have)
            
            deck_list.append({
                "name": tc.card_name,
                "type": tc.card_type or "Unknown",
                "quantity_needed": quantity_needed,
                "quantity_owned": quantity_have,
                "missing": missing_qty
            })
            
            if quantity_have < quantity_needed:
                missing_cards.append({
                    "name": tc.card_name,
                    "missing": missing_qty
                })
                missing_cards_total += missing_qty
        
        match_percentage = (cards_owned / total_cards_needed * 100) if total_cards_needed > 0 else 0
        
        # Applica filtro percentuale minima
        if match_percentage < min_match:
            continue
        
        # Applica filtro buildable_only
        if buildable_only and match_percentage < 90:
            continue
        
        # Determina colori del mazzo
        deck_colors = set()
        for tc in template_cards:
            if tc.colors:
                for c in tc.colors.upper():
                    if c in 'WUBRG':
                        deck_colors.add(c)
        
        # Applica filtro colori (il mazzo deve contenere TUTTI i colori selezionati)
        if colors:
            required_colors = set(colors.split(','))
            if not required_colors.issubset(deck_colors):
                continue
        
        # Ora salva il mazzo
        if True:
            matched_decks.append({
                "deck_template_id": template.id,  # Aggiungi l'ID del template
                "name": template.name,
                "source": template.source,
                "format": template.format,
                "match_percentage": round(match_percentage, 1),
                "cards_owned": cards_owned,
                "total_cards": total_cards_needed,
                "missing_cards_count": missing_cards_total,  # Totale carte mancanti (somma quantità)
                "missing_cards": missing_cards[:10],  # Top 10 carte mancanti
                "colors": '/'.join(sorted(deck_colors)) if deck_colors else 'C',
                "deck_list": deck_list,
                "can_build": match_percentage >= 90
            })
    
    # Ordina per match percentage
    matched_decks.sort(key=lambda d: d["match_percentage"], reverse=True)
    
    # Apply subscription limit
    limited_decks = matched_decks[:result_limit] if result_limit else matched_decks
    
    # Increment search counter
    user.searches_count += 1
    db.commit()
    
    print(f"✅ Trovati {len(matched_decks)} mazzi con match >= {min_match}%")
    print(f"📊 Restituiti {len(limited_decks)} mazzi (limite: {result_limit if result_limit else 'illimitato'})")
    print(f"🔍 Ricerche: {user.searches_count}/{user.searches_limit}")
    
    return {
        "decks": limited_decks,
        "total_templates": len(templates),
        "total_matches": len(matched_decks),
        "user_cards_count": len(owned_cards),
        "subscription_type": user.subscription_type,
        "result_limit": result_limit,
        "limited": result_limit is not None and len(matched_decks) > result_limit,
        "searches_count": user.searches_count,
        "searches_limit": user.searches_limit,
        "searches_remaining": max(0, user.searches_limit - user.searches_count)
    }


@router.get("/formats")
def get_available_formats(db: Session = Depends(get_db)):
    """Ottieni tutti i formati disponibili nei template"""
    from app.models import DeckTemplate
    from sqlalchemy import func
    
    formats = db.query(
        DeckTemplate.format,
        func.count(DeckTemplate.id).label('count')
    ).group_by(DeckTemplate.format).all()
    
    return {
        "formats": [{"name": fmt, "count": count} for fmt, count in formats if fmt != "Unknown"]
    }
