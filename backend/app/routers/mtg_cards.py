from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import Optional
import json
from app.database import get_db
from app.models import MTGCard

router = APIRouter()

@router.get("/search")
def search_cards(
    query: Optional[str] = None,
    colors: Optional[str] = None,  # W,U,B,R,G
    color_identity: Optional[str] = None,
    types: Optional[str] = None,  # Creature, Instant, etc
    subtypes: Optional[str] = None,
    supertypes: Optional[str] = None,
    rarity: Optional[str] = None,
    cmc_min: Optional[int] = None,
    cmc_max: Optional[int] = None,
    format: Optional[str] = None,  # standard, modern, etc
    text: Optional[str] = None,
    power: Optional[str] = None,
    toughness: Optional[str] = None,
    keywords: Optional[str] = None,
    set_code: Optional[str] = None,
    artist: Optional[str] = None,
    layout: Optional[str] = None,
    loyalty: Optional[str] = None,
    defense: Optional[str] = None,
    language: str = "en",  # en or it
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort_by: str = Query("name", regex="^(name|cmc|rarity)$"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """
    Ricerca avanzata carte MTG con filtri multipli
    """
    # Base query - escludi carte senza immagine
    q = db.query(MTGCard).filter(
        MTGCard.image_url.isnot(None),
        MTGCard.image_url != ''
    )
    
    # Filtro per nome (cerca in entrambe le lingue)
    # Usa func.lower() invece di ilike per migliori performance con indici
    if query:
        query_lower = query.lower()
        if language == "it":
            q = q.filter(
                or_(
                    func.lower(MTGCard.name).like(f"%{query_lower}%"),
                    func.lower(MTGCard.name_it).like(f"%{query_lower}%")
                )
            )
        else:
            q = q.filter(func.lower(MTGCard.name).like(f"%{query_lower}%"))
    
    # Filtro per colori (exact match o contains)
    if colors:
        color_list = colors.split(',')
        for color in color_list:
            q = q.filter(MTGCard.colors.like(f"%{color}%"))
    
    # Filtro per color identity
    if color_identity:
        ci_list = color_identity.split(',')
        for ci in ci_list:
            q = q.filter(MTGCard.color_identity.like(f"%{ci}%"))
    
    # Filtro per tipo
    if types:
        type_list = types.split(',')
        for t in type_list:
            q = q.filter(MTGCard.types.like(f"%{t}%"))
    
    # Filtro per sottotipo
    if subtypes:
        subtype_list = subtypes.split(',')
        for st in subtype_list:
            q = q.filter(MTGCard.subtypes.like(f"%{st}%"))
    
    # Filtro per supertipo
    if supertypes:
        supertype_list = supertypes.split(',')
        for spt in supertype_list:
            q = q.filter(MTGCard.supertypes.like(f"%{spt}%"))
    
    # Filtro per rarità
    if rarity:
        q = q.filter(MTGCard.rarity == rarity)
    
    # Filtro per CMC
    if cmc_min is not None:
        q = q.filter(MTGCard.mana_value >= cmc_min)
    if cmc_max is not None:
        q = q.filter(MTGCard.mana_value <= cmc_max)
    
    # Filtro per testo
    if text:
        text_lower = text.lower()
        if language == "it":
            q = q.filter(
                or_(
                    func.lower(MTGCard.text).like(f"%{text_lower}%"),
                    func.lower(MTGCard.text_it).like(f"%{text_lower}%")
                )
            )
        else:
            q = q.filter(func.lower(MTGCard.text).like(f"%{text_lower}%"))
    
    # Filtro per power
    if power:
        q = q.filter(MTGCard.power == power)
    
    # Filtro per toughness
    if toughness:
        q = q.filter(MTGCard.toughness == toughness)
    
    # Filtro per loyalty
    if loyalty:
        q = q.filter(MTGCard.loyalty == loyalty)
    
    # Filtro per defense
    if defense:
        q = q.filter(MTGCard.defense == defense)
    
    # Filtro per keywords
    if keywords:
        keyword_list = keywords.split(',')
        for kw in keyword_list:
            q = q.filter(MTGCard.keywords.like(f"%{kw.strip()}%"))
    
    # Filtro per set code
    if set_code:
        q = q.filter(func.lower(MTGCard.set_code).like(f"%{set_code.lower()}%"))
    
    # Filtro per artist
    if artist:
        q = q.filter(func.lower(MTGCard.artist).like(f"%{artist.lower()}%"))
    
    # Filtro per layout
    if layout:
        q = q.filter(MTGCard.layout == layout)
    
    # Filtro per formato (legality)
    if format:
        # Cerca nelle legalità JSON
        q = q.filter(MTGCard.legalities.like(f'%"{format}"%'))
        q = q.filter(MTGCard.legalities.like(f'%"Legal"%'))
    
    # Count totale - usa subquery per migliori performance
    from sqlalchemy import select
    total = db.scalar(select(func.count()).select_from(q.subquery()))
    
    # Ordinamento
    if sort_by == "name":
        if language == "it":
            # Ordina per nome italiano se disponibile, altrimenti inglese
            q = q.order_by(
                MTGCard.name_it.asc() if sort_order == "asc" else MTGCard.name_it.desc(),
                MTGCard.name.asc() if sort_order == "asc" else MTGCard.name.desc()
            )
        else:
            q = q.order_by(MTGCard.name.asc() if sort_order == "asc" else MTGCard.name.desc())
    elif sort_by == "cmc":
        q = q.order_by(MTGCard.mana_value.asc() if sort_order == "asc" else MTGCard.mana_value.desc())
    elif sort_by == "rarity":
        q = q.order_by(MTGCard.rarity.asc() if sort_order == "asc" else MTGCard.rarity.desc())
    
    # Paginazione
    offset = (page - 1) * page_size
    cards = q.offset(offset).limit(page_size).all()
    
    # Formatta risultati
    results = []
    for card in cards:
        # Parse legalities
        legalities = {}
        if card.legalities:
            try:
                legalities = json.loads(card.legalities)
            except:
                pass
        
        # Usa nome/testo nella lingua richiesta
        display_name = card.name_it if language == "it" and card.name_it else card.name
        display_text = card.text_it if language == "it" and card.text_it else card.text
        display_type = card.type_it if language == "it" and card.type_it else card.type_line
        
        results.append({
            "uuid": card.uuid,
            "name": display_name,
            "name_en": card.name,
            "name_it": card.name_it,
            "mana_cost": card.mana_cost,
            "mana_value": card.mana_value,
            "colors": card.colors,
            "color_identity": card.color_identity,
            "type": display_type,
            "text": display_text,
            "power": card.power,
            "toughness": card.toughness,
            "loyalty": card.loyalty,
            "defense": card.defense,
            "rarity": card.rarity,
            "set_code": card.set_code,
            "artist": card.artist,
            "image_url": card.image_url,
            "legalities": legalities,
            "keywords": card.keywords,
            "layout": card.layout
        })
    
    return {
        "cards": results,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
            "has_next": page * page_size < total,
            "has_prev": page > 1
        }
    }

@router.get("/card/{uuid}")
def get_card_detail(uuid: str, language: str = "en", db: Session = Depends(get_db)):
    """Ottieni dettagli completi di una carta"""
    card = db.query(MTGCard).filter(MTGCard.uuid == uuid).first()
    
    if not card:
        return {"error": "Card not found"}
    
    # Parse legalities
    legalities = {}
    if card.legalities:
        try:
            legalities = json.loads(card.legalities)
        except:
            pass
    
    # Usa lingua richiesta
    display_name = card.name_it if language == "it" and card.name_it else card.name
    display_text = card.text_it if language == "it" and card.text_it else card.text
    display_type = card.type_it if language == "it" and card.type_it else card.type_line
    
    return {
        "uuid": card.uuid,
        "name": display_name,
        "name_en": card.name,
        "name_it": card.name_it,
        "mana_cost": card.mana_cost,
        "mana_value": card.mana_value,
        "colors": card.colors,
        "color_identity": card.color_identity,
        "type": display_type,
        "type_en": card.type_line,
        "type_it": card.type_it,
        "text": display_text,
        "text_en": card.text,
        "text_it": card.text_it,
        "power": card.power,
        "toughness": card.toughness,
        "loyalty": card.loyalty,
        "defense": card.defense,
        "rarity": card.rarity,
        "set_code": card.set_code,
        "artist": card.artist,
        "flavor_text": card.flavor_text,
        "image_url": card.image_url,
        "legalities": legalities,
        "keywords": card.keywords,
        "layout": card.layout
    }

@router.get("/random")
def get_random_cards(count: int = Query(10, ge=1, le=50), language: str = "en", db: Session = Depends(get_db)):
    """Ottieni carte casuali"""
    from sqlalchemy.sql.expression import func
    
    cards = db.query(MTGCard).order_by(func.random()).limit(count).all()
    
    results = []
    for card in cards:
        display_name = card.name_it if language == "it" and card.name_it else card.name
        results.append({
            "uuid": card.uuid,
            "name": display_name,
            "mana_cost": card.mana_cost,
            "type": card.type_line,
            "image_url": card.image_url,
            "rarity": card.rarity
        })
    
    return {"cards": results}
