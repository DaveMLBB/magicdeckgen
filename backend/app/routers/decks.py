from fastapi import APIRouter, Depends, Request, HTTPException, Query
from sqlalchemy.orm import Session
from collections import defaultdict
from app.database import get_db
from app.models import Card
from app.dependencies import anonymous_trial_guard

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
    request: Request,
    format: str = None,
    colors: str = None,
    min_match: int = 10,
    buildable_only: bool = False,
    collection_id: int = None,
    db: Session = Depends(get_db)
):
    """Trova mazzi template che puoi costruire con le tue carte"""
    from app.models import DeckTemplate, DeckTemplateCard, User
    from app.anonymous_trial import check_and_increment_trial, _extract_ip

    # Gestione utenti anonimi (user_id=0 o non numerico)
    is_anon = False
    try:
        uid_int = int(user_id)
        is_anon = uid_int <= 0
    except (ValueError, TypeError):
        is_anon = True

    if is_anon:
        # Applica trial guard per anonimi
        browser_id = request.headers.get("X-Browser-ID")
        ip = _extract_ip(request)
        check_and_increment_trial("tournament_deck", ip, browser_id)
        return {"decks": [], "message": "Anonymous users cannot use deck matching without a collection."}

    # Get user to check subscription
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        return {"decks": [], "message": "User not found"}
    
    # Consume 1 token for search (before heavy computation)
    from app.routers.tokens import consume_token
    consume_token(user, 'search', f'Deck search: format={format}, colors={colors}', db)
    
    # No result limit with token system
    result_limit = None
    
    # Terre base da normalizzare
    BASIC_LANDS = {
        'plains': 'Plains',
        'island': 'Island', 
        'swamp': 'Swamp',
        'mountain': 'Mountain',
        'forest': 'Forest'
    }
    
    def normalize_card_name(name: str) -> str:
        """Normalizza il nome della carta, specialmente per le terre base.
        Solo nomi che sono ESATTAMENTE una terra base (es. 'Forest', 'Forest (123)', 'Snow-Covered Forest')
        NON carte come 'Karplusan Forest' che sono terre duali."""
        if not name:
            return name
        
        name_lower = name.lower().strip()
        
        # Controlla se è esattamente una terra base (con possibili varianti numeriche/set)
        for basic_land_key, basic_land_name in BASIC_LANDS.items():
            # Match esatto: "forest", "forest (123)", "snow-covered forest"
            if name_lower == basic_land_key:
                return basic_land_name
            # Match con parentesi: "forest (456)"
            if name_lower.startswith(basic_land_key + ' (') and name_lower.endswith(')'):
                return basic_land_name
            # Match snow-covered: "snow-covered forest"
            if name_lower == 'snow-covered ' + basic_land_key:
                return basic_land_name
        
        return name
    
    # Carica le carte dell'utente (filtrate per collezione se specificata)
    cards_query = db.query(Card).filter(Card.user_id == user_id)
    if collection_id:
        cards_query = cards_query.filter(Card.collection_id == collection_id)
    user_cards = cards_query.all()
    
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
                "mana_cost": tc.mana_cost or "",
                "colors": tc.colors or "",
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
        
        # Usa colori dal template (pre-calcolati) o fallback dalle carte
        deck_colors = set()
        if template.colors:
            for c in template.colors.upper().replace(' ', '').replace(',', ''):
                if c in 'WUBRG':
                    deck_colors.add(c)
        else:
            for tc in template_cards:
                if tc.colors:
                    for c in tc.colors.upper().replace(' ', '').replace(',', ''):
                        if c in 'WUBRG':
                            deck_colors.add(c)
        
        # Applica filtro colori (il mazzo deve contenere TUTTI i colori selezionati)
        if colors:
            required_colors = set(colors.split(','))
            if not required_colors.issubset(deck_colors):
                continue
        
        matched_decks.append({
            "deck_template_id": template.id,
            "name": template.name,
            "source": template.source,
            "format": template.format,
            "match_percentage": round(match_percentage, 1),
            "cards_owned": cards_owned,
            "total_cards": total_cards_needed,
            "missing_cards_count": missing_cards_total,
            "missing_cards": missing_cards[:10],
            "colors": '/'.join(sorted(deck_colors)) if deck_colors else 'C',
            "deck_list": deck_list,
            "can_build": match_percentage >= 90
        })
    
    # Ordina per match percentage
    matched_decks.sort(key=lambda d: d["match_percentage"], reverse=True)
    
    # No result limit with token system
    limited_decks = matched_decks
    
    print(f"✅ Trovati {len(matched_decks)} mazzi con match >= {min_match}%")
    print(f"📊 Restituiti {len(limited_decks)} mazzi")
    print(f"🪙 Token rimanenti: {user.tokens}")
    
    return {
        "decks": limited_decks,
        "total_templates": len(templates),
        "total_matches": len(matched_decks),
        "user_cards_count": len(owned_cards),
        "subscription_type": "token",
        "result_limit": None,
        "limited": False,
        "tokens_remaining": user.tokens
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


# ─── PUBLIC INDEXABLE TEMPLATE PAGES ────────────────────────────────────────

@router.get("/public/template/{slug}")
def get_public_template_by_slug(slug: str, db: Session = Depends(get_db)):
    """
    Endpoint pubblico (no auth) per pagine SEO dei mazzi template.
    Arricchisce i dati con JOIN su mtg_cards per mana_cost, cmc, card_type reali.
    """
    from app.models import DeckTemplate, DeckTemplateCard, MTGCard
    from sqlalchemy import func

    template = db.query(DeckTemplate).filter(DeckTemplate.slug == slug).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    cards = db.query(DeckTemplateCard).filter(
        DeckTemplateCard.deck_template_id == template.id
    ).all()

    # Build lookup from mtg_cards for enrichment (one query, group by name)
    card_names = list({c.card_name for c in cards})
    mtg_rows = db.query(
        MTGCard.name, MTGCard.mana_cost, MTGCard.mana_value,
        MTGCard.types, MTGCard.type_line, MTGCard.rarity
    ).filter(
        MTGCard.name.in_(card_names),
        MTGCard.lang == 'en'
    ).distinct(MTGCard.name).all()

    mtg_lookup = {r.name: r for r in mtg_rows}

    groups: dict = {}
    cards_out = []
    for c in cards:
        mtg = mtg_lookup.get(c.card_name)
        mana_cost = c.mana_cost or (mtg.mana_cost if mtg else None)
        cmc       = float(mtg.mana_value) if mtg and mtg.mana_value is not None else None
        # Determine card_type: prefer stored, fallback to mtg_cards types field
        raw_type  = c.card_type or (mtg.types if mtg else None) or (mtg.type_line if mtg else None) or 'Other'
        # Normalize to first type word (e.g. "Creature — Elf" → "Creature")
        card_type = raw_type.split('—')[0].split(',')[0].strip() if raw_type else 'Other'
        rarity    = mtg.rarity if mtg else None  # DeckTemplateCard has no rarity field

        groups.setdefault(card_type, []).append({
            "name": c.card_name,
            "quantity": c.quantity,
            "mana_cost": mana_cost,
            "cmc": cmc,
            "rarity": rarity,
        })
        cards_out.append({
            "name": c.card_name,
            "quantity": c.quantity,
            "card_type": card_type,
            "mana_cost": mana_cost,
            "cmc": cmc,
            "rarity": rarity,
        })

    total_cards = sum(c.quantity for c in cards)

    return {
        "id": template.id,
        "slug": template.slug,
        "name": template.name,
        "format": template.format,
        "colors": template.colors,
        "source": template.source,
        "total_cards": total_cards,
        "cards": cards_out,
        "cards_by_type": groups,
    }


@router.get("/public/templates/sitemap")
def get_templates_sitemap(
    page: int = Query(1, ge=1),
    page_size: int = Query(500, ge=1, le=1000),
    format: str = Query(None),
    db: Session = Depends(get_db)
):
    """Lista slug/url per sitemap dei template."""
    from app.models import DeckTemplate

    query = db.query(DeckTemplate.slug, DeckTemplate.name, DeckTemplate.format).filter(
        DeckTemplate.slug != None,
        DeckTemplate.slug != ''
    )
    if format:
        query = query.filter(DeckTemplate.format == format)

    query = query.order_by(DeckTemplate.id)
    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "templates": [
            {"slug": r.slug, "name": r.name, "format": r.format, "url": f"/decks/{r.slug}"}
            for r in rows
        ]
    }


@router.get("/public/templates/search")
def search_public_templates(
    page: int = Query(1, ge=1),
    page_size: int = Query(40, ge=1, le=100),
    format: str = Query(None),
    colors: str = Query(None),       # es. "R" o "U,B"
    name: str = Query(None),         # ricerca per nome
    db: Session = Depends(get_db)
):
    """Ricerca template con filtri per pagina /decks."""
    from app.models import DeckTemplate
    from sqlalchemy import or_

    query = db.query(DeckTemplate).filter(
        DeckTemplate.slug != None,
        DeckTemplate.slug != ''
    )
    if format:
        query = query.filter(DeckTemplate.format == format)
    if name:
        query = query.filter(DeckTemplate.name.ilike(f"%{name}%"))
    if colors:
        for c in colors.split(','):
            c = c.strip()
            if c:
                query = query.filter(DeckTemplate.colors.ilike(f"%{c}%"))

    total = query.count()
    rows = query.order_by(DeckTemplate.id).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "total_pages": max(1, (total + page_size - 1) // page_size),
        "has_next": page * page_size < total,
        "has_prev": page > 1,
        "templates": [
            {
                "id": t.id,
                "slug": t.slug,
                "name": t.name,
                "format": t.format,
                "colors": t.colors,
                "source": t.source,
            }
            for t in rows
        ]
    }
