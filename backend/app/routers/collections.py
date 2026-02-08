from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import CardCollection, Card, User
from datetime import datetime

router = APIRouter()

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

@router.get("/user/{user_id}")
def get_user_collections(user_id: int, db: Session = Depends(get_db)):
    """Get all collections for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    collections = db.query(CardCollection).filter(CardCollection.user_id == user_id).all()
    
    # Collection limits based on subscription
    collection_limits = {
        'free': 5,
        'monthly_10': 10,
        'monthly_30': 50,
        'yearly': None,  # Unlimited
        'lifetime': None  # Unlimited
    }
    
    limit = collection_limits.get(user.subscription_type, 5)
    current_count = len(collections)
    can_create_more = limit is None or current_count < limit
    
    # Get card count for each collection
    result = []
    for collection in collections:
        card_count = db.query(func.count(Card.id)).filter(
            Card.collection_id == collection.id
        ).scalar()
        
        total_cards = db.query(func.sum(Card.quantity_owned)).filter(
            Card.collection_id == collection.id
        ).scalar() or 0
        
        result.append({
            "id": collection.id,
            "name": collection.name,
            "description": collection.description,
            "card_count": card_count,
            "total_cards": int(total_cards),
            "created_at": collection.created_at.isoformat(),
            "updated_at": collection.updated_at.isoformat()
        })
    
    return {
        "collections": result,
        "subscription": {
            "type": user.subscription_type,
            "collection_limit": limit,
            "current_count": current_count,
            "can_create_more": can_create_more,
            "remaining": (limit - current_count) if limit else None
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
    
    # Check collection limits based on subscription
    collection_limits = {
        'free': 5,
        'monthly_10': 10,
        'monthly_30': 50,
        'yearly': None,  # Unlimited
        'lifetime': None  # Unlimited
    }
    
    limit = collection_limits.get(user.subscription_type, 5)
    
    if limit is not None:
        current_count = db.query(func.count(CardCollection.id)).filter(
            CardCollection.user_id == user_id
        ).scalar()
        
        if current_count >= limit:
            raise HTTPException(
                status_code=403,
                detail=f"Collection limit reached ({limit}). Upgrade your subscription to create more collections."
            )
    
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
        "created_at": new_collection.created_at.isoformat()
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
