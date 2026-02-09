from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User
from jose import JWTError, jwt

router = APIRouter()

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

# Subscription plans
SUBSCRIPTION_PLANS = {
    'free': {
        'name': 'Free',
        'price': 0,
        'uploads_limit': 10,
        'duration_days': None,
        'description': '10 uploads • 5 collections • 3 saved decks • 20 unique cards per collection • 10 deck results'
    },
    'monthly_10': {
        'name': '30 Uploads',
        'price': 5.00,
        'uploads_limit': 30,
        'duration_days': 30,
        'description': '30 uploads/month • 10 collections • 10 saved decks • Unlimited cards • 20 deck results'
    },
    'monthly_30': {
        'name': '50 Uploads',
        'price': 10.00,
        'uploads_limit': 50,
        'duration_days': 30,
        'description': '50 uploads/month • 50 collections • 30 saved decks • Unlimited cards • 30 deck results'
    },
    'yearly': {
        'name': 'Yearly Unlimited',
        'price': 25.00,
        'uploads_limit': 999999,
        'duration_days': 365,
        'description': 'Unlimited uploads • Unlimited collections • 50 saved decks • Unlimited cards • Unlimited deck results'
    },
    'lifetime': {
        'name': 'Lifetime Unlimited',
        'price': 60.00,
        'uploads_limit': 999999,
        'duration_days': None,  # No expiration
        'description': 'Unlimited uploads • Unlimited collections • Unlimited saved decks • Unlimited cards • Unlimited deck results • Forever'
    }
}

class SubscriptionPurchase(BaseModel):
    plan: str
    payment_method: str = 'stripe'  # stripe, paypal, etc.

def get_current_user(token: str, db: Session):
    """Get current user from token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.get("/plans")
def get_plans():
    """Get all available plans"""
    return {
        "plans": [
            {
                "id": plan_id,
                **plan_data
            }
            for plan_id, plan_data in SUBSCRIPTION_PLANS.items()
        ]
    }

@router.get("/status")
def get_subscription_status(token: str, db: Session = Depends(get_db)):
    """Get user subscription status"""
    from app.models import CardCollection
    
    user = get_current_user(token, db)
    
    # Check if subscription is expired
    is_expired = False
    if user.subscription_expires_at:
        is_expired = datetime.utcnow() > user.subscription_expires_at
        
        # If expired, reset to free
        if is_expired and user.subscription_type != 'lifetime':
            user.subscription_type = 'free'
            user.uploads_limit = 3
            user.uploads_count = 0
            user.subscription_expires_at = None
            db.commit()
    
    plan = SUBSCRIPTION_PLANS.get(user.subscription_type, SUBSCRIPTION_PLANS['free'])
    
    # Get collection limits based on subscription
    collection_limits = {
        'free': 5,
        'monthly_10': 10,
        'monthly_30': 50,
        'yearly': None,  # unlimited
        'lifetime': None  # unlimited
    }
    collections_limit = collection_limits.get(user.subscription_type, 5)
    
    # Get search limits based on subscription
    search_limits = {
        'free': 10,
        'monthly_10': 20,
        'monthly_30': 30,
        'yearly': None,  # unlimited
        'lifetime': None  # unlimited
    }
    searches_limit = search_limits.get(user.subscription_type, 10)
    
    # Get saved decks limits based on subscription
    saved_decks_limits = {
        'free': 3,
        'monthly_10': 10,
        'monthly_30': 30,
        'yearly': 50,
        'lifetime': None  # unlimited
    }
    saved_decks_limit = saved_decks_limits.get(user.subscription_type, 3)
    
    # Get deck results limits (max results shown in deck search)
    deck_results_limits = {
        'free': 10,
        'monthly_10': 20,
        'monthly_30': 30,
        'yearly': None,  # unlimited
        'lifetime': None  # unlimited
    }
    deck_results_limit = deck_results_limits.get(user.subscription_type, 10)
    
    # Count user's collections
    collections_count = db.query(CardCollection).filter(
        CardCollection.user_id == user.id
    ).count()
    
    # Count user's saved decks
    from app.models import SavedDeck
    saved_decks_count = db.query(SavedDeck).filter(
        SavedDeck.user_id == user.id
    ).count()
    
    return {
        "subscription_type": user.subscription_type,
        "plan_name": plan['name'],
        "plan_description": plan['description'],
        "uploads_count": user.uploads_count,
        "uploads_limit": user.uploads_limit,
        "uploads_remaining": max(0, user.uploads_limit - user.uploads_count),
        "collections_count": collections_count,
        "collections_limit": collections_limit,
        "collections_remaining": max(0, collections_limit - collections_count) if collections_limit else None,
        "saved_decks_count": saved_decks_count,
        "saved_decks_limit": saved_decks_limit,
        "saved_decks_remaining": max(0, saved_decks_limit - saved_decks_count) if saved_decks_limit else None,
        "searches_count": user.searches_count,
        "searches_limit": searches_limit,
        "searches_remaining": max(0, searches_limit - user.searches_count) if searches_limit else None,
        "deck_results_limit": deck_results_limit,
        "expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
        "is_expired": is_expired,
        "can_upload": user.uploads_count < user.uploads_limit
    }

@router.post("/purchase")
def purchase_subscription(
    purchase: SubscriptionPurchase,
    token: str,
    db: Session = Depends(get_db)
):
    """Purchase subscription (simulated - to be integrated with Stripe/PayPal)"""
    user = get_current_user(token, db)
    
    if purchase.plan not in SUBSCRIPTION_PLANS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan"
        )
    
    plan = SUBSCRIPTION_PLANS[purchase.plan]
    
    # TODO: Integrate with Stripe/PayPal for real payment
    # For now we simulate successful payment
    
    # Determine search limit based on plan
    search_limits = {
        'free': 10,
        'monthly_10': 20,
        'monthly_30': 30,
        'yearly': 999999,
        'lifetime': 999999
    }
    
    # Update user subscription
    user.subscription_type = purchase.plan
    user.uploads_limit = plan['uploads_limit']
    user.uploads_count = 0  # Reset counter
    user.searches_limit = search_limits.get(purchase.plan, 10)
    user.searches_count = 0  # Reset search counter
    
    # Set expiration
    if plan['duration_days']:
        user.subscription_expires_at = datetime.utcnow() + timedelta(days=plan['duration_days'])
    else:
        user.subscription_expires_at = None  # Lifetime
    
    db.commit()
    
    return {
        "message": "Subscription activated successfully!",
        "subscription_type": user.subscription_type,
        "plan_name": plan['name'],
        "uploads_limit": user.uploads_limit,
        "expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None
    }

@router.post("/increment-upload")
def increment_upload_count(token: str, db: Session = Depends(get_db)):
    """Increment upload counter (called after successful upload)"""
    user = get_current_user(token, db)
    
    # Verifica se può ancora caricare
    if user.uploads_count >= user.uploads_limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Upload limit reached. Please upgrade your subscription."
        )
    
    user.uploads_count += 1
    db.commit()
    
    return {
        "uploads_count": user.uploads_count,
        "uploads_remaining": user.uploads_limit - user.uploads_count
    }

@router.get("/can-upload")
def can_upload(token: str, db: Session = Depends(get_db)):
    """Check if user can upload"""
    user = get_current_user(token, db)
    
    # Check expiration
    if user.subscription_expires_at and datetime.utcnow() > user.subscription_expires_at:
        if user.subscription_type != 'lifetime':
            user.subscription_type = 'free'
            user.uploads_limit = 3
            user.uploads_count = 0
            user.subscription_expires_at = None
            db.commit()
    
    can_upload = user.uploads_count < user.uploads_limit
    
    return {
        "can_upload": can_upload,
        "uploads_count": user.uploads_count,
        "uploads_limit": user.uploads_limit,
        "uploads_remaining": max(0, user.uploads_limit - user.uploads_count),
        "subscription_type": user.subscription_type
    }
