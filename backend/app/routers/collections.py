from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models import CardCollection, Card, User, saved_deck_collections, SavedDeck
from datetime import datetime

router = APIRouter()

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class MoveCardsInput(BaseModel):
    card_ids: Optional[List[int]] = None
    source_collection_id: Optional[int] = None  # se presente, sposta TUTTE le carte della collezione
    target_collection_id: int
    user_id: int

@router.post("/move-cards")
def move_cards_to_collection(
    data: MoveCardsInput,
    db: Session = Depends(get_db)
):
    """Sposta una lista di carte (o tutte quelle di una collezione) in un'altra collezione"""
    target = db.query(CardCollection).filter(
        CardCollection.id == data.target_collection_id,
        CardCollection.user_id == data.user_id
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target collection not found")

    # Determina le carte da spostare
    if data.source_collection_id is not None:
        # Sposta TUTTE le carte della collezione sorgente
        cards_to_move = db.query(Card).filter(
            Card.collection_id == data.source_collection_id,
            Card.user_id == data.user_id
        ).all()
    elif data.card_ids:
        cards_to_move = db.query(Card).filter(
            Card.id.in_(data.card_ids),
            Card.user_id == data.user_id
        ).all()
    else:
        raise HTTPException(status_code=400, detail="Provide card_ids or source_collection_id")

    moved = 0
    for card in cards_to_move:
        existing = db.query(Card).filter(
            Card.collection_id == data.target_collection_id,
            Card.name == card.name
        ).first()
        if existing:
            existing.quantity_owned += card.quantity_owned
            db.delete(card)
        else:
            card.collection_id = data.target_collection_id
        moved += 1

    db.commit()
    return {"moved": moved, "target_collection": target.name}


@router.get("/user/{user_id}")
def get_user_collections(user_id: int, db: Session = Depends(get_db)):
    """Get all collections for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    collections = db.query(CardCollection).filter(CardCollection.user_id == user_id).all()
    
    # No collection limit with token system
    current_count = len(collections)
    can_create_more = user.tokens > 0
    
    # Get card count for each collection
    result = []
    for collection in collections:
        card_count = db.query(func.count(Card.id)).filter(
            Card.collection_id == collection.id
        ).scalar()
        
        total_cards = db.query(func.sum(Card.quantity_owned)).filter(
            Card.collection_id == collection.id
        ).scalar() or 0
        
        # Get linked decks
        deck_ids = db.query(saved_deck_collections.c.deck_id).filter(
            saved_deck_collections.c.collection_id == collection.id
        ).all()
        linked_decks = []
        if deck_ids:
            decks = db.query(SavedDeck).filter(SavedDeck.id.in_([d[0] for d in deck_ids])).all()
            linked_decks = [{"id": d.id, "name": d.name} for d in decks]
        
        result.append({
            "id": collection.id,
            "name": collection.name,
            "description": collection.description,
            "card_count": card_count,
            "total_cards": int(total_cards),
            "created_at": collection.created_at.isoformat(),
            "updated_at": collection.updated_at.isoformat(),
            "linked_decks": linked_decks
        })
    
    return {
        "collections": result,
        "subscription": {
            "type": "token",
            "collection_limit": None,
            "current_count": current_count,
            "can_create_more": can_create_more,
            "remaining": None,
            "tokens": user.tokens
        }
    }

@router.post("/create")
def create_collection(
    user_id: int,
    collection_data: CollectionCreate,
    db: Session = Depends(get_db)
):
    """Create a new collection"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if collection name already exists for this user
    existing = db.query(CardCollection).filter(
        CardCollection.user_id == user_id,
        CardCollection.name == collection_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A collection with this name already exists"
        )
    
    # Consume 1 token for creating collection (before processing)
    from app.routers.tokens import consume_token
    consume_token(user, 'collection', f'Create collection: {collection_data.name}', db)
    
    new_collection = CardCollection(
        name=collection_data.name,
        description=collection_data.description,
        user_id=user_id
    )
    
    db.add(new_collection)
    db.commit()
    db.refresh(new_collection)
    
    return {
        "id": new_collection.id,
        "name": new_collection.name,
        "description": new_collection.description,
        "created_at": new_collection.created_at.isoformat(),
        "tokens_remaining": user.tokens
    }

@router.put("/{collection_id}")
def update_collection(
    collection_id: int,
    collection_data: CollectionUpdate,
    db: Session = Depends(get_db)
):
    """Update a collection"""
    collection = db.query(CardCollection).filter(CardCollection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if collection_data.name:
        # Check if new name already exists for this user
        existing = db.query(CardCollection).filter(
            CardCollection.user_id == collection.user_id,
            CardCollection.name == collection_data.name,
            CardCollection.id != collection_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="A collection with this name already exists"
            )
        
        collection.name = collection_data.name
    
    if collection_data.description is not None:
        collection.description = collection_data.description
    
    collection.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "id": collection.id,
        "name": collection.name,
        "description": collection.description,
        "updated_at": collection.updated_at.isoformat()
    }

@router.delete("/{collection_id}")
def delete_collection(collection_id: int, db: Session = Depends(get_db)):
    """Delete a collection and all its cards"""
    collection = db.query(CardCollection).filter(CardCollection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Delete saved_deck_collections associations
    db.execute(saved_deck_collections.delete().where(saved_deck_collections.c.collection_id == collection_id))
    
    # Delete all cards in this collection
    db.query(Card).filter(Card.collection_id == collection_id).delete()
    
    # Delete the collection
    db.delete(collection)
    db.commit()
    
    return {"message": "Collection deleted successfully"}

@router.get("/{collection_id}")
def get_collection(collection_id: int, db: Session = Depends(get_db)):
    """Get a specific collection with details"""
    collection = db.query(CardCollection).filter(CardCollection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    card_count = db.query(func.count(Card.id)).filter(
        Card.collection_id == collection_id
    ).scalar()
    
    total_cards = db.query(func.sum(Card.quantity_owned)).filter(
        Card.collection_id == collection_id
    ).scalar() or 0
    
    return {
        "id": collection.id,
        "name": collection.name,
        "description": collection.description,
        "card_count": card_count,
        "total_cards": int(total_cards),
        "created_at": collection.created_at.isoformat(),
        "updated_at": collection.updated_at.isoformat()
    }

@router.post("/import-deck/{user_id}/{deck_template_id}")
def import_deck_as_collection(
    user_id: int,
    deck_template_id: int,
    db: Session = Depends(get_db)
):
    """Import a deck template as a new collection"""
    from app.models import DeckTemplate, DeckTemplateCard, MTGCard
    
    # Check user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get deck template
    deck_template = db.query(DeckTemplate).filter(DeckTemplate.id == deck_template_id).first()
    if not deck_template:
        raise HTTPException(status_code=404, detail="Deck template not found")
    
    # Get template cards
    template_cards = db.query(DeckTemplateCard).filter(
        DeckTemplateCard.deck_template_id == deck_template_id
    ).all()
    
    if not template_cards:
        raise HTTPException(status_code=400, detail="Deck template has no cards")
    
    # Consume 1 token for importing deck as collection (before processing)
    from app.routers.tokens import consume_token
    consume_token(user, 'collection', f'Import deck as collection: {deck_template.name}', db)
    
    # Check if collection with this name already exists
    base_name = deck_template.name
    collection_name = base_name
    counter = 1
    
    while db.query(CardCollection).filter(
        CardCollection.user_id == user_id,
        CardCollection.name == collection_name
    ).first():
        collection_name = f"{base_name} ({counter})"
        counter += 1
    
    # Create collection
    new_collection = CardCollection(
        name=collection_name,
        description=f"Imported from {deck_template.format} deck: {deck_template.name}",
        user_id=user_id
    )
    
    db.add(new_collection)
    db.flush()  # Get collection ID
    
    # Add cards to collection with enriched data from MTG database
    cards_added = 0
    cards_enriched = 0
    
    for template_card in template_cards:
        card_type = template_card.card_type
        
        # Se il tipo è vuoto o Unknown, cerca nel database MTG
        if not card_type or card_type == 'Unknown' or card_type.strip() == '':
            # Cerca la carta nel database MTG
            mtg_card = db.query(MTGCard).filter(
                MTGCard.name == template_card.card_name
            ).first()
            
            if mtg_card:
                # Usa il campo 'types' che contiene il tipo principale
                if mtg_card.types:
                    card_type = mtg_card.types.split(',')[0].strip()
                    cards_enriched += 1
                elif mtg_card.type_line:
                    # Fallback: estrai dal type_line
                    type_parts = mtg_card.type_line.split('—')[0].strip()
                    card_type = type_parts.split()[0] if type_parts else 'Unknown'
                    cards_enriched += 1
        
        # Se ancora non abbiamo un tipo, usa Unknown
        if not card_type or card_type.strip() == '':
            card_type = 'Unknown'
        
        new_card = Card(
            name=template_card.card_name,
            mana_cost=template_card.mana_cost,
            card_type=card_type,
            colors=template_card.colors,
            quantity_owned=template_card.quantity,
            user_id=user_id,
            collection_id=new_collection.id
        )
        db.add(new_card)
        cards_added += 1
    
    db.commit()
    db.refresh(new_collection)
    
    print(f"✅ Importate {cards_added} carte, {cards_enriched} arricchite dal database MTG")
    
    return {
        "id": new_collection.id,
        "name": new_collection.name,
        "description": new_collection.description,
        "cards_added": cards_added,
        "cards_enriched": cards_enriched,
        "created_at": new_collection.created_at.isoformat(),
        "tokens_remaining": user.tokens
    }

@router.post("/{collection_id}/link-deck/{deck_id}")
def link_deck_to_collection(
    collection_id: int,
    deck_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Link a saved deck to a collection"""
    collection = db.query(CardCollection).filter(
        CardCollection.id == collection_id,
        CardCollection.user_id == user_id
    ).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    deck = db.query(SavedDeck).filter(
        SavedDeck.id == deck_id,
        SavedDeck.user_id == user_id
    ).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    # Check if already linked
    existing = db.execute(
        saved_deck_collections.select().where(
            saved_deck_collections.c.deck_id == deck_id,
            saved_deck_collections.c.collection_id == collection_id
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Deck already linked to this collection")
    
    db.execute(
        saved_deck_collections.insert().values(
            deck_id=deck_id,
            collection_id=collection_id
        )
    )
    db.commit()
    
    return {"message": "Deck linked successfully"}

@router.delete("/{collection_id}/unlink-deck/{deck_id}")
def unlink_deck_from_collection(
    collection_id: int,
    deck_id: int,
    db: Session = Depends(get_db)
):
    """Unlink a saved deck from a collection"""
    db.execute(
        saved_deck_collections.delete().where(
            saved_deck_collections.c.deck_id == deck_id,
            saved_deck_collections.c.collection_id == collection_id
        )
    )
    db.commit()
    
    return {"message": "Deck unlinked successfully"}

