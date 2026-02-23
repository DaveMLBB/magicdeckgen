from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User
from app.email import send_subscription_activated_email, send_subscription_renewed_email, send_subscription_cancelled_email
from jose import JWTError, jwt
import stripe
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

# Stripe configuration
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")

# Frontend URLs for redirect after checkout
FRONTEND_URL = os.environ.get(
    "FRONTEND_URL",
    "https://magicdeckbuilder.app.cloudsw.site" if os.environ.get("PRODUCTION") else "http://localhost:5173"
)

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

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

# Stripe Price IDs mapping (set via env vars or Stripe Dashboard)
# Format: STRIPE_PRICE_MONTHLY_10=price_xxx
STRIPE_PRICE_IDS = {
    'monthly_10': os.environ.get('STRIPE_PRICE_MONTHLY_10', ''),
    'monthly_30': os.environ.get('STRIPE_PRICE_MONTHLY_30', ''),
    'yearly': os.environ.get('STRIPE_PRICE_YEARLY', ''),
    'lifetime': os.environ.get('STRIPE_PRICE_LIFETIME', ''),
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
        
        # If expired, check Stripe first before resetting to free
        if is_expired and user.subscription_type != 'lifetime':
            if not check_stripe_subscription_active(user, db):
                user.subscription_type = 'free'
                user.uploads_limit = 999999  # Unlimited - token system used
                user.uploads_count = 0
                user.subscription_expires_at = None
                db.commit()
            else:
                is_expired = False
    
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

def check_stripe_subscription_active(user: User, db: Session) -> bool:
    """Verifica su Stripe se l'utente ha una subscription attiva.
    Se sì, rinnova subscription_expires_at nel DB e ritorna True."""
    if not STRIPE_SECRET_KEY or not user.stripe_customer_id:
        return False
    
    try:
        subscriptions = stripe.Subscription.list(
            customer=user.stripe_customer_id,
            status='active',
            limit=5
        )
        
        for sub in subscriptions.data:
            # Subscription attiva trovata su Stripe
            plan_id = (sub.metadata or {}).get('plan_id')
            
            if not plan_id:
                # Fallback: determina dal price ID
                if sub.get('items') and sub['items'].get('data'):
                    price_id = sub['items']['data'][0].get('price', {}).get('id', '')
                    for pid, sid in STRIPE_PRICE_IDS.items():
                        if sid and sid == price_id:
                            plan_id = pid
                            break
            
            if not plan_id:
                plan_id = user.subscription_type if user.subscription_type != 'free' else None
            
            if plan_id and plan_id in SUBSCRIPTION_PLANS:
                activate_subscription(user, plan_id, db)
                logger.info(f"Stripe fallback: renewed user={user.id}, plan={plan_id}")
                return True
        
        return False
    except stripe.StripeError as e:
        logger.error(f"Stripe check error: {e}")
        return False

def activate_subscription(user: User, plan_id: str, db: Session):
    """Attiva un abbonamento per l'utente (usato sia da checkout che da webhook)"""
    plan = SUBSCRIPTION_PLANS.get(plan_id)
    if not plan:
        return
    
    user.subscription_type = plan_id
    user.uploads_limit = 999999  # Unlimited - token system used
    user.uploads_count = 0
    user.searches_limit = 999999  # Unlimited - token system used
    user.searches_count = 0
    
    if plan['duration_days']:
        user.subscription_expires_at = datetime.utcnow() + timedelta(days=plan['duration_days'])
    else:
        user.subscription_expires_at = None
    
    db.commit()

@router.post("/purchase")
def purchase_subscription(
    purchase: SubscriptionPurchase,
    token: str,
    db: Session = Depends(get_db)
):
    """Purchase subscription - solo per piano free (downgrade)"""
    user = get_current_user(token, db)
    
    if purchase.plan not in SUBSCRIPTION_PLANS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan"
        )
    
    # Solo il piano free può essere attivato senza pagamento
    if purchase.plan != 'free':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use /create-checkout-session for paid plans"
        )
    
    activate_subscription(user, purchase.plan, db)
    plan = SUBSCRIPTION_PLANS[purchase.plan]
    
    return {
        "message": "Subscription activated successfully!",
        "subscription_type": user.subscription_type,
        "plan_name": plan['name'],
        "uploads_limit": user.uploads_limit,
        "expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None
    }

@router.post("/create-checkout-session")
def create_checkout_session(
    purchase: SubscriptionPurchase,
    token: str,
    db: Session = Depends(get_db)
):
    """Crea una Stripe Checkout Session per il pagamento"""
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe not configured"
        )
    
    user = get_current_user(token, db)
    
    if purchase.plan not in SUBSCRIPTION_PLANS or purchase.plan == 'free':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan for checkout"
        )
    
    plan = SUBSCRIPTION_PLANS[purchase.plan]
    stripe_price_id = STRIPE_PRICE_IDS.get(purchase.plan)
    
    # Crea o recupera Stripe Customer
    if not user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            metadata={'user_id': str(user.id)}
        )
        user.stripe_customer_id = customer.id
        db.commit()
    
    # Determina il tipo di pagamento
    # Lifetime = one-time payment, altri = subscription
    is_recurring = purchase.plan in ('monthly_10', 'monthly_30', 'yearly')
    
    checkout_params = {
        'customer': user.stripe_customer_id,
        'success_url': f"{FRONTEND_URL}?stripe_status=success&plan={purchase.plan}",
        'cancel_url': f"{FRONTEND_URL}?stripe_status=cancel",
        'metadata': {
            'user_id': str(user.id),
            'plan_id': purchase.plan
        },
    }
    
    # Per subscriptions ricorrenti, aggiungi metadata alla subscription stessa
    if is_recurring:
        checkout_params['subscription_data'] = {
            'metadata': {
                'user_id': str(user.id),
                'plan_id': purchase.plan
            }
        }
    
    if stripe_price_id:
        # Usa Price ID pre-configurato da Stripe Dashboard
        checkout_params['line_items'] = [{
            'price': stripe_price_id,
            'quantity': 1,
        }]
        checkout_params['mode'] = 'subscription' if is_recurring else 'payment'
    else:
        # Crea price al volo (per test)
        checkout_params['line_items'] = [{
            'price_data': {
                'currency': 'eur',
                'product_data': {
                    'name': f"Magic Deck Builder - {plan['name']}",
                    'description': plan['description'],
                },
                'unit_amount': int(plan['price'] * 100),  # Stripe usa centesimi
                **({
                    'recurring': {
                        'interval': 'month' if plan['duration_days'] == 30 else 'year'
                    }
                } if is_recurring else {}),
            },
            'quantity': 1,
        }]
        checkout_params['mode'] = 'subscription' if is_recurring else 'payment'
    
    try:
        session = stripe.checkout.Session.create(**checkout_params)
        return {
            'checkout_url': session.url,
            'session_id': session.id
        }
    except stripe.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stripe error: {str(e)}"
        )

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook Stripe per conferma pagamento"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature', '')
    
    if STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # In test senza webhook secret, accetta tutto
        import json
        event = json.loads(payload)
    
    event_type = event.get('type', '') if isinstance(event, dict) else event['type']
    data = event.get('data', {}).get('object', {}) if isinstance(event, dict) else event['data']['object']
    
    logger.info(f"Stripe webhook received: {event_type}")
    
    if event_type == 'checkout.session.completed':
        # Pagamento completato
        metadata = data.get('metadata', {})
        user_id = metadata.get('user_id')
        plan_id = metadata.get('plan_id')
        
        if user_id and plan_id:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                activate_subscription(user, plan_id, db)
                logger.info(f"Subscription activated: user={user_id}, plan={plan_id}")
                # Invia email di conferma attivazione
                plan_info = SUBSCRIPTION_PLANS.get(plan_id, {})
                try:
                    send_subscription_activated_email(
                        user.email,
                        plan_info.get('name', plan_id),
                        user.subscription_expires_at
                    )
                except Exception as e:
                    logger.error(f"Error sending activation email: {e}")
    
    elif event_type in ('invoice.paid', 'invoice.payment_succeeded'):
        # Rinnovo abbonamento riuscito (Stripe auto-renewal)
        customer_id = data.get('customer')
        billing_reason = data.get('billing_reason', '')
        
        if customer_id:
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                plan_id = None
                subscription_id = data.get('subscription')
                
                if subscription_id and STRIPE_SECRET_KEY:
                    try:
                        sub = stripe.Subscription.retrieve(subscription_id)
                        plan_id = (sub.metadata or {}).get('plan_id')
                        
                        if not plan_id and hasattr(sub, 'items') and sub['items'].get('data'):
                            price_id = sub['items']['data'][0].get('price', {}).get('id', '')
                            for pid, sid in STRIPE_PRICE_IDS.items():
                                if sid and sid == price_id:
                                    plan_id = pid
                                    break
                    except stripe.StripeError as e:
                        logger.error(f"Error retrieving subscription: {e}")
                
                if not plan_id:
                    plan_id = user.subscription_type if user.subscription_type != 'free' else None
                
                if plan_id and plan_id in SUBSCRIPTION_PLANS:
                    activate_subscription(user, plan_id, db)
                    logger.info(f"Subscription renewed: user={user.id}, plan={plan_id}, reason={billing_reason}")
                    # Invia email di conferma rinnovo (solo per rinnovi, non primo pagamento)
                    if billing_reason in ('subscription_cycle', 'subscription_update'):
                        plan_info = SUBSCRIPTION_PLANS.get(plan_id, {})
                        try:
                            send_subscription_renewed_email(
                                user.email,
                                plan_info.get('name', plan_id),
                                user.subscription_expires_at
                            )
                        except Exception as e:
                            logger.error(f"Error sending renewal email: {e}")
                else:
                    logger.warning(f"Invoice paid but could not determine plan for user={user.id}")
    
    elif event_type == 'customer.subscription.deleted':
        # Abbonamento cancellato/scaduto
        customer_id = data.get('customer')
        if customer_id:
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                old_plan = user.subscription_type
                old_plan_info = SUBSCRIPTION_PLANS.get(old_plan, {})
                activate_subscription(user, 'free', db)
                logger.info(f"Subscription cancelled: user={user.id}, reset to free")
                # Invia email di conferma cancellazione definitiva
                try:
                    send_subscription_cancelled_email(
                        user.email,
                        old_plan_info.get('name', old_plan),
                        None  # Già scaduto
                    )
                except Exception as e:
                    logger.error(f"Error sending cancellation email: {e}")
    
    elif event_type == 'invoice.payment_failed':
        # Pagamento fallito
        customer_id = data.get('customer')
        if customer_id:
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if user:
                logger.warning(f"Payment failed for user={user.id}")
    
    return {"status": "ok"}

@router.post("/verify-session")
def verify_stripe_session(token: str, session_id: str = None, plan: str = None, db: Session = Depends(get_db)):
    """Verifica una Stripe Checkout Session e attiva l'abbonamento.
    Fallback per quando il webhook non è raggiungibile (es. sviluppo locale)."""
    user = get_current_user(token, db)
    
    if session_id and STRIPE_SECRET_KEY:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status == 'paid':
                metadata = session.metadata or {}
                plan_id = metadata.get('plan_id', plan)
                session_user_id = metadata.get('user_id')
                
                # Verifica che la sessione appartenga a questo utente
                if session_user_id and int(session_user_id) == user.id:
                    if plan_id and plan_id in SUBSCRIPTION_PLANS and user.subscription_type != plan_id:
                        activate_subscription(user, plan_id, db)
                        logger.info(f"Session verified: user={user.id}, plan={plan_id}")
                        # Invia email di conferma attivazione
                        plan_info = SUBSCRIPTION_PLANS.get(plan_id, {})
                        try:
                            send_subscription_activated_email(
                                user.email,
                                plan_info.get('name', plan_id),
                                user.subscription_expires_at
                            )
                        except Exception as e:
                            logger.error(f"Error sending activation email: {e}")
                        return {"status": "activated", "plan": plan_id}
                    return {"status": "already_active", "plan": user.subscription_type}
                else:
                    raise HTTPException(status_code=403, detail="Session does not belong to this user")
            else:
                return {"status": "not_paid", "payment_status": session.payment_status}
        except stripe.StripeError as e:
            logger.error(f"Stripe verify error: {e}")
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
    
    # Fallback: se non c'è session_id ma c'è plan, verifica via Stripe customer
    if plan and plan in SUBSCRIPTION_PLANS and user.stripe_customer_id and STRIPE_SECRET_KEY:
        try:
            sessions = stripe.checkout.Session.list(
                customer=user.stripe_customer_id,
                limit=5
            )
            for s in sessions.data:
                if s.payment_status == 'paid':
                    meta_plan = (s.metadata or {}).get('plan_id', '')
                    if meta_plan == plan and user.subscription_type != plan:
                        activate_subscription(user, plan, db)
                        logger.info(f"Session found by customer: user={user.id}, plan={plan}")
                        return {"status": "activated", "plan": plan}
            return {"status": "no_paid_session_found"}
        except stripe.StripeError as e:
            logger.error(f"Stripe list sessions error: {e}")
    
    return {"status": "no_action", "current_plan": user.subscription_type}

@router.post("/cancel-subscription")
def cancel_subscription(token: str, db: Session = Depends(get_db)):
    """Annulla l'abbonamento Stripe dell'utente (a fine periodo)"""
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe not configured"
        )
    
    user = get_current_user(token, db)
    
    if user.subscription_type == 'free':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription to cancel"
        )
    
    if user.subscription_type == 'lifetime':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lifetime subscriptions cannot be cancelled"
        )
    
    if not user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Stripe customer found"
        )
    
    try:
        # Trova le subscriptions attive per questo customer
        subscriptions = stripe.Subscription.list(
            customer=user.stripe_customer_id,
            status='active',
            limit=10
        )
        
        cancelled_count = 0
        for sub in subscriptions.data:
            # Cancella a fine periodo (l'utente mantiene l'accesso fino alla scadenza)
            stripe.Subscription.modify(
                sub.id,
                cancel_at_period_end=True
            )
            cancelled_count += 1
            logger.info(f"Subscription {sub.id} set to cancel at period end for user={user.id}")
        
        plan_info = SUBSCRIPTION_PLANS.get(user.subscription_type, {})
        plan_name = plan_info.get('name', user.subscription_type)
        
        if cancelled_count == 0:
            # Nessuna subscription attiva su Stripe, reset diretto
            activate_subscription(user, 'free', db)
            # Invia email di annullamento
            try:
                send_subscription_cancelled_email(user.email, plan_name, None)
            except Exception as e:
                logger.error(f"Error sending cancellation email: {e}")
            return {
                "status": "cancelled_immediately",
                "message": "No active Stripe subscription found. Reset to free plan."
            }
        
        # Invia email di annullamento programmato
        try:
            send_subscription_cancelled_email(user.email, plan_name, user.subscription_expires_at)
        except Exception as e:
            logger.error(f"Error sending cancellation email: {e}")
        
        return {
            "status": "cancel_scheduled",
            "message": f"Subscription will be cancelled at the end of the current billing period.",
            "expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
            "cancelled_subscriptions": cancelled_count
        }
    except stripe.StripeError as e:
        logger.error(f"Stripe cancel error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stripe error: {str(e)}"
        )

@router.get("/stripe-config")
def get_stripe_config():
    """Restituisce la publishable key per il frontend"""
    return {
        "publishable_key": STRIPE_PUBLISHABLE_KEY,
        "stripe_enabled": bool(STRIPE_SECRET_KEY)
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
    
    # Check expiration - verify Stripe first
    if user.subscription_expires_at and datetime.utcnow() > user.subscription_expires_at:
        if user.subscription_type != 'lifetime':
            if not check_stripe_subscription_active(user, db):
                user.subscription_type = 'free'
                user.uploads_limit = 999999  # Unlimited - token system used
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
