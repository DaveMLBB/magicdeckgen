from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app.models import User, SavedDeck, SavedDeckCard, Card, MTGCard, CardCollection, saved_deck_collections
from datetime import datetime
import re

router = APIRouter()


def _slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')

class DeckCardInput(BaseModel):
    card_name: str
    quantity: int
    card_type: Optional[str] = None
    colors: Optional[str] = None
    mana_cost: Optional[str] = None
    rarity: Optional[str] = None

class CreateDeckInput(BaseModel):
    name: str
    description: Optional[str] = None
    format: Optional[str] = None
    colors: Optional[str] = None
    archetype: Optional[str] = None
    source: Optional[str] = "manual"
    is_public: bool = False  # Se il mazzo è pubblico
    collection_ids: List[int] = []  # Lista di collezioni collegate
    cards: List[DeckCardInput]

class EditDeckInput(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    format: Optional[str] = None
    colors: Optional[str] = None
    archetype: Optional[str] = None
    cards: Optional[List[DeckCardInput]] = None

@router.get("/user/{user_id}")
def get_user_decks(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Ottieni tutti i mazzi salvati dell'utente"""
    from datetime import datetime
    
    # Get user to check subscription
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Base query
    query = db.query(SavedDeck).filter(SavedDeck.user_id == user_id)
    
    # Count total
    total = query.count()
    
    # Order by most recent
    query = query.order_by(SavedDeck.created_at.desc())
    
    # Pagination
    offset = (page - 1) * page_size
    decks = query.offset(offset).limit(page_size).all()
    
    # Format response
    from sqlalchemy import func as sqlfunc
    from app.models import CardCollection, saved_deck_collections
    
    decks_data = []
    for deck in decks:
        deck_cards = db.query(SavedDeckCard).filter(
            SavedDeckCard.deck_id == deck.id
        ).all()
        
        # Get linked collections
        linked_collections = db.query(CardCollection).join(
            saved_deck_collections,
            CardCollection.id == saved_deck_collections.c.collection_id
        ).filter(
            saved_deck_collections.c.deck_id == deck.id
        ).all()
        
        collection_names = [c.name for c in linked_collections]
        collection_ids = [c.id for c in linked_collections]
        
        # Ricalcola ownership in tempo reale (case-insensitive, GROUP BY SUM)
        user_cards_dict = {}
        if collection_ids:
            card_sums = db.query(
                sqlfunc.lower(Card.name), sqlfunc.sum(Card.quantity_owned)
            ).filter(
                Card.user_id == user_id,
                Card.collection_id.in_(collection_ids)
            ).group_by(sqlfunc.lower(Card.name)).all()
        else:
            card_sums = db.query(
                sqlfunc.lower(Card.name), sqlfunc.sum(Card.quantity_owned)
            ).filter(
                Card.user_id == user_id
            ).group_by(sqlfunc.lower(Card.name)).all()
        for name, total_qty in card_sums:
            user_cards_dict[name] = int(total_qty)
        
        total_cards = sum(c.quantity for c in deck_cards)
        owned_cards = sum(min(user_cards_dict.get(c.card_name.lower(), 0), c.quantity) for c in deck_cards)
        
        # Calculate completion
        completion = int((owned_cards / total_cards * 100)) if total_cards > 0 else 0
        
        decks_data.append({
            "id": deck.id,
            "name": deck.name,
            "description": deck.description,
            "format": deck.format,
            "colors": deck.colors,
            "archetype": deck.archetype,
            "source": deck.source,
            "is_public": deck.is_public,
            "collection_ids": collection_ids,
            "collection_names": collection_names,
            "total_cards": total_cards,
            "owned_cards": owned_cards,
            "completion_percentage": completion,
            "created_at": deck.created_at.isoformat(),
            "updated_at": deck.updated_at.isoformat()
        })
    
    return {
        "decks": decks_data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
            "has_next": page * page_size < total,
            "has_prev": page > 1
        },
        "subscription": {
            "type": "token",
            "deck_limit": None,
            "current_count": total,
            "can_create_more": user.tokens > 0,
            "remaining": None,
            "tokens": user.tokens
        }
    }

@router.post("/create")
def create_deck(
    user_id: int,
    deck_input: CreateDeckInput,
    db: Session = Depends(get_db)
):
    """Crea un nuovo mazzo salvato"""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Consume 1 token for saving deck (before processing)
    from app.routers.tokens import consume_token
    consume_token(user, 'save_deck', f'Save deck: {deck_input.name}', db)
    
    # Verify collections exist if provided
    from app.models import CardCollection, saved_deck_collections
    if deck_input.collection_ids:
        for coll_id in deck_input.collection_ids:
            collection = db.query(CardCollection).filter(
                CardCollection.id == coll_id,
                CardCollection.user_id == user_id
            ).first()
            if not collection:
                raise HTTPException(status_code=404, detail=f"Collection {coll_id} not found")
    
    # Create deck
    deck = SavedDeck(
        name=deck_input.name,
        description=deck_input.description,
        format=deck_input.format,
        colors=deck_input.colors,
        archetype=deck_input.archetype,
        source=deck_input.source,
        is_public=deck_input.is_public,
        user_id=user_id
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)

    # Auto-generate slug for public decks
    if deck_input.is_public and not deck.slug:
        base = _slugify(deck_input.name) or "deck"
        deck.slug = f"{base}-{deck.id}"
        db.commit()
        db.refresh(deck)
    if deck_input.collection_ids:
        for coll_id in deck_input.collection_ids:
            db.execute(
                saved_deck_collections.insert().values(
                    deck_id=deck.id,
                    collection_id=coll_id
                )
            )
        db.commit()
    
    # Pre-build ownership dict (sum ALL entries per card name, case-insensitive)
    from sqlalchemy import func as sqlfunc
    user_cards_dict = {}
    if deck_input.collection_ids:
        card_sums = db.query(
            sqlfunc.lower(Card.name), sqlfunc.sum(Card.quantity_owned)
        ).filter(
            Card.user_id == user_id,
            Card.collection_id.in_(deck_input.collection_ids)
        ).group_by(sqlfunc.lower(Card.name)).all()
    else:
        card_sums = db.query(
            sqlfunc.lower(Card.name), sqlfunc.sum(Card.quantity_owned)
        ).filter(
            Card.user_id == user_id
        ).group_by(sqlfunc.lower(Card.name)).all()
    
    for name, total_qty in card_sums:
        user_cards_dict[name] = int(total_qty)
    
    # Add cards and check ownership
    total_cards_needed = 0
    cards_owned_qty = 0
    for card_input in deck_input.cards:
        quantity_owned = user_cards_dict.get(card_input.card_name.lower(), 0)
        
        # Calcolo basato sulle quantità (coerente con ricerca compatibilità)
        total_cards_needed += card_input.quantity
        cards_owned_qty += min(quantity_owned, card_input.quantity)
        
        # Enrich with MTG data if available
        mtg_card = db.query(MTGCard).filter(MTGCard.name == card_input.card_name).first()
        if mtg_card:
            card_type = mtg_card.types.split(',')[0].strip() if mtg_card.types else card_input.card_type
            colors = mtg_card.colors or card_input.colors
            mana_cost = mtg_card.mana_cost or card_input.mana_cost
            rarity = mtg_card.rarity or card_input.rarity
        else:
            card_type = card_input.card_type
            colors = card_input.colors
            mana_cost = card_input.mana_cost
            rarity = card_input.rarity
        
        deck_card = SavedDeckCard(
            deck_id=deck.id,
            card_name=card_input.card_name,
            quantity=card_input.quantity,
            card_type=card_type,
            colors=colors,
            mana_cost=mana_cost,
            rarity=rarity,
            is_owned=quantity_owned >= card_input.quantity,
            quantity_owned=quantity_owned
        )
        db.add(deck_card)
    
    # Update completion percentage (basato sulle quantità, coerente con ricerca compatibilità)
    deck.completion_percentage = int((cards_owned_qty / total_cards_needed * 100)) if total_cards_needed > 0 else 0
    
    db.commit()
    db.refresh(deck)
    
    return {
        "id": deck.id,
        "name": deck.name,
        "completion_percentage": deck.completion_percentage,
        "total_cards": total_cards_needed,
        "owned_cards": cards_owned_qty,
        "tokens_remaining": user.tokens
    }

@router.get("/public/deck/{slug}")
def get_public_deck_by_slug(slug: str, db: Session = Depends(get_db)):
    """Endpoint pubblico SEO - deve stare PRIMA di /{deck_id}"""
    deck = db.query(SavedDeck).filter(
        SavedDeck.slug == slug,
        SavedDeck.is_public == True
    ).first()

    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    cards = db.query(SavedDeckCard).filter(SavedDeckCard.deck_id == deck.id).all()

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
        raw_type  = c.card_type or (mtg.types if mtg else None) or (mtg.type_line if mtg else None) or 'Other'
        card_type = raw_type.split('—')[0].split(',')[0].strip() if raw_type else 'Other'
        rarity    = c.rarity or (mtg.rarity if mtg else None)
        groups.setdefault(card_type, []).append({"name": c.card_name, "quantity": c.quantity, "mana_cost": mana_cost, "cmc": cmc, "rarity": rarity})
        cards_out.append({"name": c.card_name, "quantity": c.quantity, "card_type": card_type, "mana_cost": mana_cost, "cmc": cmc, "rarity": rarity})

    total_cards = sum(c.quantity for c in cards)
    return {
        "id": deck.id, "slug": deck.slug, "name": deck.name, "description": deck.description,
        "format": deck.format, "colors": deck.colors, "archetype": deck.archetype,
        "total_cards": total_cards, "created_at": deck.created_at.isoformat() if deck.created_at else None,
        "cards": cards_out, "cards_by_type": groups,
    }


@router.get("/public/sitemap")
def get_public_decks_sitemap(
    page: int = Query(1, ge=1),
    page_size: int = Query(500, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    query = db.query(SavedDeck.slug, SavedDeck.name, SavedDeck.updated_at).filter(
        SavedDeck.is_public == True, SavedDeck.slug != None, SavedDeck.slug != ''
    ).order_by(SavedDeck.updated_at.desc())
    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "page": page, "decks": [
        {"slug": r.slug, "name": r.name, "updated_at": r.updated_at.isoformat() if r.updated_at else None, "url": f"/decks/{r.slug}"}
        for r in rows
    ]}


@router.get("/{deck_id}")
def get_deck_details(
    deck_id: int,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Ottieni dettagli completi di un mazzo con calcolo possesso carte"""
    deck = db.query(SavedDeck).filter(SavedDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    linked_collections = db.query(CardCollection).join(
        saved_deck_collections,
        CardCollection.id == saved_deck_collections.c.collection_id
    ).filter(
        saved_deck_collections.c.deck_id == deck.id
    ).all()
    
    collection_names = [c.name for c in linked_collections]
    collection_ids = [c.id for c in linked_collections]
    
    # Get user's cards if user_id provided (for ownership calculation)
    # Sum ALL entries per card name using linked collections, case-insensitive
    from sqlalchemy import func as sqlfunc
    user_cards_dict = {}
    if user_id:
        if collection_ids:
            card_sums = db.query(
                sqlfunc.lower(Card.name), sqlfunc.sum(Card.quantity_owned)
            ).filter(
                Card.user_id == user_id,
                Card.collection_id.in_(collection_ids)
            ).group_by(sqlfunc.lower(Card.name)).all()
        else:
            card_sums = db.query(
                sqlfunc.lower(Card.name), sqlfunc.sum(Card.quantity_owned)
            ).filter(
                Card.user_id == user_id
            ).group_by(sqlfunc.lower(Card.name)).all()
        for name, total_qty in card_sums:
            user_cards_dict[name] = int(total_qty)
    
    # Get all cards
    cards = db.query(SavedDeckCard).filter(SavedDeckCard.deck_id == deck_id).all()
    
    cards_data = []
    total_cards_needed = 0
    cards_owned_qty = 0
    
    for card in cards:
        # Calculate ownership if user_id provided
        if user_id and user_cards_dict:
            owned_qty = user_cards_dict.get(card.card_name.lower(), 0)
            is_owned = owned_qty >= card.quantity
            quantity_missing = max(0, card.quantity - owned_qty)
        else:
            # Use stored values if no user_id
            is_owned = card.is_owned
            owned_qty = card.quantity_owned
            quantity_missing = max(0, card.quantity - card.quantity_owned)
        
        cards_data.append({
            "id": card.id,
            "card_name": card.card_name,
            "quantity": card.quantity,
            "card_type": card.card_type,
            "colors": card.colors,
            "mana_cost": card.mana_cost,
            "rarity": card.rarity,
            "is_owned": is_owned,
            "quantity_owned": owned_qty,
            "quantity_missing": quantity_missing,
            "cmc": int(db.query(MTGCard.mana_value).filter(MTGCard.name == card.card_name).limit(1).scalar() or 0)
        })
        
        # Calcolo basato sulle quantità (coerente con ricerca compatibilità)
        total_cards_needed += card.quantity
        cards_owned_qty += min(owned_qty, card.quantity)
    
    # Ricalcola completion percentage in modo coerente
    completion = int((cards_owned_qty / total_cards_needed * 100)) if total_cards_needed > 0 else 0
    
    return {
        "id": deck.id,
        "name": deck.name,
        "description": deck.description,
        "format": deck.format,
        "colors": deck.colors,
        "archetype": deck.archetype,
        "source": deck.source,
        "is_public": deck.is_public,
        "collection_ids": collection_ids,
        "collection_names": collection_names,
        "completion_percentage": completion,
        "total_cards": total_cards_needed,
        "owned_cards": cards_owned_qty,
        "missing_cards": max(0, total_cards_needed - cards_owned_qty),
        "cards": cards_data,
        "created_at": deck.created_at.isoformat(),
        "updated_at": deck.updated_at.isoformat()
    }

@router.delete("/{deck_id}")
def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db)
):
    """Elimina un mazzo salvato"""
    deck = db.query(SavedDeck).filter(SavedDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    # Delete collection links first (many-to-many)
    from app.models import saved_deck_collections
    db.execute(
        saved_deck_collections.delete().where(
            saved_deck_collections.c.deck_id == deck_id
        )
    )
    
    # Delete all cards
    db.query(SavedDeckCard).filter(SavedDeckCard.deck_id == deck_id).delete()
    
    # Delete deck
    db.delete(deck)
    db.commit()
    
    return {"message": "Deck deleted successfully"}

@router.put("/{deck_id}")
def update_deck(
    deck_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    is_public: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Aggiorna nome/descrizione/visibilità di un mazzo"""
    deck = db.query(SavedDeck).filter(SavedDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    if name:
        deck.name = name
    if description is not None:
        deck.description = description
    if is_public is not None:
        deck.is_public = is_public
        # Auto-generate slug when making public
        if is_public and not deck.slug:
            base = _slugify(deck.name) or "deck"
            deck.slug = f"{base}-{deck.id}"
    
    deck.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Deck updated successfully"}

@router.put("/{deck_id}/edit")
def edit_deck(
    deck_id: int,
    user_id: int,
    deck_input: EditDeckInput,
    db: Session = Depends(get_db)
):
    """Modifica completa di un mazzo: metadati e/o carte"""
    deck = db.query(SavedDeck).filter(SavedDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Aggiorna metadati (solo se forniti)
    if deck_input.name is not None:
        deck.name = deck_input.name
    if deck_input.description is not None:
        deck.description = deck_input.description
    if deck_input.format is not None:
        deck.format = deck_input.format
    if deck_input.colors is not None:
        deck.colors = deck_input.colors
    if deck_input.archetype is not None:
        deck.archetype = deck_input.archetype
    
    # Aggiorna carte (se fornite)
    if deck_input.cards is not None:
        # Elimina carte esistenti
        db.query(SavedDeckCard).filter(SavedDeckCard.deck_id == deck_id).delete()
        
        # Inserisci nuove carte
        for card_input in deck_input.cards:
            mtg_card = db.query(MTGCard).filter(MTGCard.name == card_input.card_name).first()
            if mtg_card:
                card_type = mtg_card.types.split(',')[0].strip() if mtg_card.types else card_input.card_type
                colors = mtg_card.colors or card_input.colors
                mana_cost = mtg_card.mana_cost or card_input.mana_cost
                rarity = mtg_card.rarity or card_input.rarity
            else:
                card_type = card_input.card_type
                colors = card_input.colors
                mana_cost = card_input.mana_cost
                rarity = card_input.rarity
            
            deck_card = SavedDeckCard(
                deck_id=deck.id,
                card_name=card_input.card_name,
                quantity=card_input.quantity,
                card_type=card_type,
                colors=colors,
                mana_cost=mana_cost,
                rarity=rarity,
                is_owned=False,
                quantity_owned=0
            )
            db.add(deck_card)
    
    deck.updated_at = datetime.utcnow()
    db.commit()
    
    # Refresh ownership dopo modifica
    from app.models import saved_deck_collections
    linked_collection_ids = db.query(saved_deck_collections.c.collection_id).filter(
        saved_deck_collections.c.deck_id == deck_id
    ).all()
    linked_collection_ids = [c[0] for c in linked_collection_ids]
    
    if linked_collection_ids or deck_input.cards is not None:
        refresh_deck_ownership(deck_id, user_id, db)
    
    return {"message": "Deck updated successfully", "id": deck.id}

@router.post("/{deck_id}/duplicate")
def duplicate_deck(
    deck_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Duplica un mazzo esistente"""
    # Verifica utente
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Consume 1 token for duplicating deck (before processing)
    from app.routers.tokens import consume_token
    consume_token(user, 'save_deck', f'Duplicate deck #{deck_id}', db)
    
    # Carica mazzo originale
    original = db.query(SavedDeck).filter(SavedDeck.id == deck_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    # Crea copia
    new_deck = SavedDeck(
        name=f"{original.name} (copy)",
        description=original.description,
        format=original.format,
        colors=original.colors,
        archetype=original.archetype,
        source=original.source,
        is_public=False,
        user_id=user_id,
        completion_percentage=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_deck)
    db.flush()  # Per ottenere l'ID
    
    # Copia carte
    original_cards = db.query(SavedDeckCard).filter(SavedDeckCard.deck_id == deck_id).all()
    for card in original_cards:
        new_card = SavedDeckCard(
            deck_id=new_deck.id,
            card_name=card.card_name,
            quantity=card.quantity,
            card_type=card.card_type,
            colors=card.colors,
            mana_cost=card.mana_cost,
            rarity=card.rarity,
            is_owned=False,
            quantity_owned=0
        )
        db.add(new_card)
    
    # Copia collezioni collegate
    from app.models import saved_deck_collections
    linked = db.query(saved_deck_collections.c.collection_id).filter(
        saved_deck_collections.c.deck_id == deck_id
    ).all()
    for (coll_id,) in linked:
        db.execute(
            saved_deck_collections.insert().values(
                deck_id=new_deck.id,
                collection_id=coll_id
            )
        )
    
    db.commit()
    
    # Refresh ownership sulla copia
    if linked:
        refresh_deck_ownership(new_deck.id, user_id, db)
    
    return {
        "message": "Deck duplicated successfully",
        "id": new_deck.id,
        "name": new_deck.name,
        "tokens_remaining": user.tokens
    }

@router.post("/{deck_id}/collections")
def update_deck_collections(
    deck_id: int,
    collection_ids: List[int],
    user_id: int,
    db: Session = Depends(get_db)
):
    """Aggiorna le collezioni collegate al mazzo"""
    deck = db.query(SavedDeck).filter(SavedDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    # Verify user owns the deck
    if deck.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify collections exist and belong to user
    from app.models import CardCollection, saved_deck_collections
    for coll_id in collection_ids:
        collection = db.query(CardCollection).filter(
            CardCollection.id == coll_id,
            CardCollection.user_id == user_id
        ).first()
        if not collection:
            raise HTTPException(status_code=404, detail=f"Collection {coll_id} not found")
    
    # Remove old links
    db.execute(
        saved_deck_collections.delete().where(
            saved_deck_collections.c.deck_id == deck_id
        )
    )
    
    # Add new links
    for coll_id in collection_ids:
        db.execute(
            saved_deck_collections.insert().values(
                deck_id=deck_id,
                collection_id=coll_id
            )
        )
    
    db.commit()
    
    # Refresh ownership after changing collections
    refresh_deck_ownership(deck_id, user_id, db)
    
    return {"message": "Collections updated successfully"}

@router.post("/{deck_id}/refresh-ownership")
def refresh_deck_ownership(
    deck_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Aggiorna lo stato di possesso delle carte nel mazzo"""
    deck = db.query(SavedDeck).filter(SavedDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    # Get linked collections
    from app.models import CardCollection, saved_deck_collections
    linked_collection_ids = db.query(saved_deck_collections.c.collection_id).filter(
        saved_deck_collections.c.deck_id == deck_id
    ).all()
    linked_collection_ids = [c[0] for c in linked_collection_ids]
    
    # Get all deck cards
    deck_cards = db.query(SavedDeckCard).filter(SavedDeckCard.deck_id == deck_id).all()
    
    # Pre-build ownership dict (sum ALL entries per card name, case-insensitive)
    from sqlalchemy import func as sqlfunc
    user_cards_dict = {}
    if linked_collection_ids:
        card_sums = db.query(
            sqlfunc.lower(Card.name), sqlfunc.sum(Card.quantity_owned)
        ).filter(
            Card.user_id == user_id,
            Card.collection_id.in_(linked_collection_ids)
        ).group_by(sqlfunc.lower(Card.name)).all()
    else:
        card_sums = db.query(
            sqlfunc.lower(Card.name), sqlfunc.sum(Card.quantity_owned)
        ).filter(
            Card.user_id == user_id
        ).group_by(sqlfunc.lower(Card.name)).all()
    
    for name, total_qty in card_sums:
        user_cards_dict[name] = int(total_qty)
    
    total_cards_needed = 0
    cards_owned_qty = 0
    for deck_card in deck_cards:
        quantity_owned = user_cards_dict.get(deck_card.card_name.lower(), 0)
        
        deck_card.is_owned = quantity_owned >= deck_card.quantity
        deck_card.quantity_owned = quantity_owned
        
        # Calcolo basato sulle quantità (coerente con ricerca compatibilità)
        total_cards_needed += deck_card.quantity
        cards_owned_qty += min(quantity_owned, deck_card.quantity)
    
    # Update completion percentage (basato sulle quantità, non sul conteggio booleano)
    deck.completion_percentage = int((cards_owned_qty / total_cards_needed * 100)) if total_cards_needed > 0 else 0
    deck.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "completion_percentage": deck.completion_percentage,
        "owned_cards": cards_owned_qty,
        "total_cards": total_cards_needed
    }

@router.get("/by-collection/{collection_id}")
def get_decks_by_collection(
    collection_id: int,
    db: Session = Depends(get_db)
):
    """Ottieni tutti i mazzi collegati a una collezione"""
    from app.models import saved_deck_collections
    
    deck_ids = db.query(saved_deck_collections.c.deck_id).filter(
        saved_deck_collections.c.collection_id == collection_id
    ).all()
    deck_ids = [d[0] for d in deck_ids]
    
    if not deck_ids:
        return {"decks": [], "count": 0}
    
    decks = db.query(SavedDeck).filter(SavedDeck.id.in_(deck_ids)).all()
    
    decks_data = []
    for deck in decks:
        # Count cards
        total_cards = db.query(SavedDeckCard).filter(
            SavedDeckCard.deck_id == deck.id
        ).count()
        
        decks_data.append({
            "id": deck.id,
            "name": deck.name,
            "total_cards": total_cards,
            "completion_percentage": deck.completion_percentage
        })
    
    return {
        "decks": decks_data,
        "count": len(decks_data)
    }

class AddCardToDeckInput(BaseModel):
    card_name: str
    quantity: int = 1
    card_type: Optional[str] = None
    colors: Optional[str] = None
    mana_cost: Optional[str] = None
    rarity: Optional[str] = None

@router.post("/{deck_id}/add-card")
def add_card_to_deck(
    deck_id: int,
    user_id: int,
    card_input: AddCardToDeckInput,
    db: Session = Depends(get_db)
):
    """Aggiungi una singola carta a un mazzo esistente"""
    deck = db.query(SavedDeck).filter(SavedDeck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if card already exists in deck
    existing = db.query(SavedDeckCard).filter(
        SavedDeckCard.deck_id == deck_id,
        SavedDeckCard.card_name == card_input.card_name
    ).first()
    
    if existing:
        existing.quantity += card_input.quantity
    else:
        # Enrich with MTG data if available
        mtg_card = db.query(MTGCard).filter(MTGCard.name == card_input.card_name).first()
        if mtg_card:
            card_type = mtg_card.types.split(',')[0].strip() if mtg_card.types else card_input.card_type
            colors = mtg_card.colors or card_input.colors
            mana_cost = mtg_card.mana_cost or card_input.mana_cost
            rarity = mtg_card.rarity or card_input.rarity
        else:
            card_type = card_input.card_type
            colors = card_input.colors
            mana_cost = card_input.mana_cost
            rarity = card_input.rarity
        
        deck_card = SavedDeckCard(
            deck_id=deck_id,
            card_name=card_input.card_name,
            quantity=card_input.quantity,
            card_type=card_type,
            colors=colors,
            mana_cost=mana_cost,
            rarity=rarity,
            is_owned=False,
            quantity_owned=0
        )
        db.add(deck_card)
    
    deck.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Card added to deck", "card_name": card_input.card_name}

@router.get("/public/search")
def search_public_decks(
    user_id: Optional[int] = Query(None),
    format: Optional[str] = Query(None),
    colors: Optional[str] = Query(None),
    collection_id: Optional[int] = Query(None),
    count_search: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Cerca tra i mazzi pubblici degli utenti con calcolo compatibilità"""
    # Check token balance if user_id provided and counting search
    if user_id and count_search:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            from app.routers.tokens import consume_token
            consume_token(user, 'public_search', 'Public deck search', db)
    
    query = db.query(SavedDeck).filter(SavedDeck.is_public == True)
    
    if format:
        query = query.filter(SavedDeck.format == format)
    if colors:
        # Filter by colors (contains any of the specified colors)
        for color in colors.split(','):
            query = query.filter(SavedDeck.colors.contains(color.strip()))
    
    # Count total
    total = query.count()
    
    # Order by most recent
    query = query.order_by(SavedDeck.created_at.desc())
    
    # Pagination
    offset = (page - 1) * page_size
    decks = query.offset(offset).limit(page_size).all()
    
    # Get user's cards if user_id provided (for match calculation)
    user_cards_dict = {}
    if user_id:
        cards_q = db.query(Card).filter(Card.user_id == user_id)
        if collection_id:
            cards_q = cards_q.filter(Card.collection_id == collection_id)
        user_cards = cards_q.all()
        for card in user_cards:
            if card.name in user_cards_dict:
                user_cards_dict[card.name] += card.quantity_owned
            else:
                user_cards_dict[card.name] = card.quantity_owned
    
    # Format response
    decks_data = []
    for deck in decks:
        # Get deck cards
        deck_cards = db.query(SavedDeckCard).filter(
            SavedDeckCard.deck_id == deck.id
        ).all()
        
        # Calcolo basato sulle quantità (coerente con ricerca compatibilità)
        total_cards = sum(dc.quantity for dc in deck_cards)
        
        # Calculate match if user_id provided
        match_percentage = 0
        cards_owned = 0
        missing_cards_count = 0
        can_build = False
        
        if user_id and user_cards_dict:
            for deck_card in deck_cards:
                owned_qty = user_cards_dict.get(deck_card.card_name, 0)
                cards_owned += min(owned_qty, deck_card.quantity)
                missing_qty = max(0, deck_card.quantity - owned_qty)
                missing_cards_count += missing_qty
            
            if total_cards > 0:
                match_percentage = int((cards_owned / total_cards) * 100)
                can_build = match_percentage >= 90
        
        decks_data.append({
            "id": deck.id,
            "slug": deck.slug,
            "name": deck.name,
            "description": deck.description,
            "format": deck.format,
            "colors": deck.colors,
            "archetype": deck.archetype,
            "total_cards": total_cards,
            "match_percentage": match_percentage,
            "cards_owned": cards_owned,
            "missing_cards_count": missing_cards_count,
            "can_build": can_build,
            "created_at": deck.created_at.isoformat()
        })
    
    return {
        "decks": decks_data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
            "has_next": page * page_size < total,
            "has_prev": page > 1
        }
    }


# ─── PUBLIC INDEXABLE DECK PAGES ────────────────────────────────────────────
# (moved before /{deck_id} to avoid route conflict — see above)


@router.post("/{deck_id}/publish")
def publish_deck(deck_id: int, user_id: int, db: Session = Depends(get_db)):
    """
    Rende un mazzo pubblico e genera/aggiorna il suo slug.
    """
    deck = db.query(SavedDeck).filter(
        SavedDeck.id == deck_id,
        SavedDeck.user_id == user_id
    ).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    deck.is_public = True
    if not deck.slug:
        base = _slugify(deck.name) or f"deck"
        deck.slug = f"{base}-{deck.id}"

    db.commit()
    db.refresh(deck)
    return {"slug": deck.slug, "url": f"/decks/{deck.slug}"}
