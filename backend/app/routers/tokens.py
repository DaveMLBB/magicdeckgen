from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.models import User, TokenTransaction, CouponCode, CouponRedemption
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

# Token packages
TOKEN_PACKAGES = {
    'mini': {
        'name': 'Mini',
        'price': 1.00,
        'tokens': 15,
        'description': '15 token'
    },
    'starter': {
        'name': 'Starter',
        'price': 5.00,
        'tokens': 100,
        'description': '100 token'
    },
    'base': {
        'name': 'Base',
        'price': 10.00,
        'tokens': 250,
        'description': '250 token'
    },
    'pro': {
        'name': 'Pro',
        'price': 25.00,
        'tokens': 750,
        'description': '750 token',
        'featured': True
    },
    'mega': {
        'name': 'Mega',
        'price': 50.00,
        'tokens': 2000,
        'description': '2000 token'
    },
    'ultra': {
        'name': 'Ultra',
        'price': 100.00,
        'tokens': 5000,
        'description': '5000 token',
        'best_value': True
    }
}

class TokenPurchase(BaseModel):
    package: str

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

def consume_token(user: User, action: str, description: str, db: Session):
    """Consume 1 token from user balance. Returns True if successful, raises 403 if insufficient."""
    if user.tokens <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient tokens. Please purchase more tokens to continue."
        )
    
    user.tokens -= 1
    
    transaction = TokenTransaction(
        user_id=user.id,
        amount=-1,
        action=action,
        description=description
    )
    db.add(transaction)
    db.commit()
    
    return True

@router.get("/packages")
def get_packages():
    """Get all available token packages"""
    return {
        "packages": [
            {
                "id": pkg_id,
                **pkg_data
            }
            for pkg_id, pkg_data in TOKEN_PACKAGES.items()
        ]
    }

@router.get("/balance")
def get_token_balance(token: str, db: Session = Depends(get_db)):
    """Get user token balance and recent transaction history"""
    user = get_current_user(token, db)
    
    # Get recent transactions (last 20)
    transactions = db.query(TokenTransaction).filter(
        TokenTransaction.user_id == user.id
    ).order_by(TokenTransaction.created_at.desc()).limit(20).all()
    
    transactions_data = [
        {
            "id": t.id,
            "amount": t.amount,
            "action": t.action,
            "description": t.description,
            "created_at": t.created_at.isoformat()
        }
        for t in transactions
    ]
    
    return {
        "tokens": user.tokens,
        "transactions": transactions_data
    }

@router.post("/purchase")
def create_token_checkout(
    purchase: TokenPurchase,
    token: str,
    db: Session = Depends(get_db)
):
    """Create a Stripe Checkout Session for token purchase"""
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe not configured"
        )
    
    user = get_current_user(token, db)
    
    if purchase.package not in TOKEN_PACKAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid package"
        )
    
    pkg = TOKEN_PACKAGES[purchase.package]
    
    # Create or retrieve Stripe Customer
    if not user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            metadata={'user_id': str(user.id)}
        )
        user.stripe_customer_id = customer.id
        db.commit()
    
    # All token purchases are one-time payments
    try:
        session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f"Magic Deck Builder - {pkg['name']} ({pkg['tokens']} token)",
                        'description': pkg['description'],
                    },
                    'unit_amount': int(pkg['price'] * 100),  # Stripe uses cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{FRONTEND_URL}?stripe_status=success&package={purchase.package}",
            cancel_url=f"{FRONTEND_URL}?stripe_status=cancel",
            metadata={
                'user_id': str(user.id),
                'package_id': purchase.package,
                'tokens': str(pkg['tokens'])
            },
        )
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
    """Stripe webhook for payment confirmation"""
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
        # In test without webhook secret, accept everything
        import json
        event = json.loads(payload)
    
    event_type = event.get('type', '') if isinstance(event, dict) else event['type']
    data = event.get('data', {}).get('object', {}) if isinstance(event, dict) else event['data']['object']
    
    logger.info(f"Stripe webhook received: {event_type}")
    
    if event_type == 'checkout.session.completed':
        metadata = data.get('metadata', {})
        user_id = metadata.get('user_id')
        package_id = metadata.get('package_id')
        tokens_str = metadata.get('tokens')
        session_id = data.get('id', '')
        
        if user_id and tokens_str:
            tokens_amount = int(tokens_str)
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                # Credit tokens
                user.tokens += tokens_amount
                
                # Record transaction
                pkg_name = TOKEN_PACKAGES.get(package_id, {}).get('name', package_id)
                transaction = TokenTransaction(
                    user_id=user.id,
                    amount=tokens_amount,
                    action='purchase',
                    description=f"Purchased {pkg_name} package ({tokens_amount} tokens)",
                    stripe_session_id=session_id
                )
                db.add(transaction)
                db.commit()
                
                logger.info(f"Tokens credited: user={user_id}, tokens={tokens_amount}, package={package_id}")
                
                # Send confirmation email
                try:
                    from app.email import send_token_purchase_email
                    send_token_purchase_email(user.email, pkg_name, tokens_amount, user.tokens)
                except Exception as e:
                    logger.error(f"Error sending token purchase email: {e}")
    
    return {"status": "ok"}

@router.post("/verify-session")
def verify_stripe_session(token: str, session_id: str = None, package: str = None, db: Session = Depends(get_db)):
    """Verify a Stripe Checkout Session and credit tokens.
    Fallback for when webhook is not reachable (e.g. local development)."""
    user = get_current_user(token, db)
    
    if session_id and STRIPE_SECRET_KEY:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status == 'paid':
                metadata = session.metadata or {}
                pkg_id = metadata.get('package_id', package)
                tokens_str = metadata.get('tokens')
                session_user_id = metadata.get('user_id')
                
                # Verify session belongs to this user
                if session_user_id and int(session_user_id) == user.id:
                    # Check if already credited (avoid double-credit)
                    existing = db.query(TokenTransaction).filter(
                        TokenTransaction.stripe_session_id == session.id,
                        TokenTransaction.user_id == user.id
                    ).first()
                    
                    if not existing and tokens_str:
                        tokens_amount = int(tokens_str)
                        user.tokens += tokens_amount
                        
                        pkg_name = TOKEN_PACKAGES.get(pkg_id, {}).get('name', pkg_id)
                        transaction = TokenTransaction(
                            user_id=user.id,
                            amount=tokens_amount,
                            action='purchase',
                            description=f"Purchased {pkg_name} package ({tokens_amount} tokens)",
                            stripe_session_id=session.id
                        )
                        db.add(transaction)
                        db.commit()
                        
                        logger.info(f"Session verified: user={user.id}, tokens={tokens_amount}")
                        return {"status": "credited", "tokens_added": tokens_amount, "balance": user.tokens}
                    
                    return {"status": "already_credited", "balance": user.tokens}
                else:
                    raise HTTPException(status_code=403, detail="Session does not belong to this user")
            else:
                return {"status": "not_paid", "payment_status": session.payment_status}
        except stripe.StripeError as e:
            logger.error(f"Stripe verify error: {e}")
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
    
    # Fallback: check recent sessions for this customer
    if package and package in TOKEN_PACKAGES and user.stripe_customer_id and STRIPE_SECRET_KEY:
        try:
            sessions = stripe.checkout.Session.list(
                customer=user.stripe_customer_id,
                limit=5
            )
            for s in sessions.data:
                if s.payment_status == 'paid':
                    meta_pkg = (s.metadata or {}).get('package_id', '')
                    if meta_pkg == package:
                        existing = db.query(TokenTransaction).filter(
                            TokenTransaction.stripe_session_id == s.id,
                            TokenTransaction.user_id == user.id
                        ).first()
                        if not existing:
                            tokens_amount = int((s.metadata or {}).get('tokens', 0))
                            if tokens_amount > 0:
                                user.tokens += tokens_amount
                                pkg_name = TOKEN_PACKAGES.get(package, {}).get('name', package)
                                transaction = TokenTransaction(
                                    user_id=user.id,
                                    amount=tokens_amount,
                                    action='purchase',
                                    description=f"Purchased {pkg_name} package ({tokens_amount} tokens)",
                                    stripe_session_id=s.id
                                )
                                db.add(transaction)
                                db.commit()
                                return {"status": "credited", "tokens_added": tokens_amount, "balance": user.tokens}
            return {"status": "no_paid_session_found"}
        except stripe.StripeError as e:
            logger.error(f"Stripe list sessions error: {e}")
    
    return {"status": "no_action", "balance": user.tokens}

@router.get("/stripe-config")
def get_stripe_config():
    """Return the publishable key for the frontend"""
    return {
        "publishable_key": STRIPE_PUBLISHABLE_KEY,
        "stripe_enabled": bool(STRIPE_SECRET_KEY)
    }

class CouponRedeemRequest(BaseModel):
    code: str

@router.post("/redeem-coupon")
def redeem_coupon(
    request: CouponRedeemRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """Redeem a coupon code for tokens"""
    logger.info(f"Redeem coupon request received: code='{request.code}'")
    token = authorization.replace("Bearer ", "") if authorization else ""
    user = get_current_user(token, db)
    logger.info(f"User {user.id} attempting to redeem coupon")
    
    # Find the coupon
    coupon = db.query(CouponCode).filter(
        CouponCode.code == request.code.strip(),
        CouponCode.is_active == True
    ).first()
    
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Codice coupon non valido o scaduto"
        )
    
    # Check if coupon is expired
    if coupon.expires_at and coupon.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Questo coupon è scaduto"
        )
    
    # Check if user has already redeemed this coupon
    existing_redemption = db.query(CouponRedemption).filter(
        CouponRedemption.user_id == user.id,
        CouponRedemption.coupon_id == coupon.id
    ).first()
    
    if existing_redemption:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hai già riscattato questo coupon"
        )
    
    # Add tokens to user
    user.tokens += coupon.token_amount
    
    # Create redemption record
    redemption = CouponRedemption(
        user_id=user.id,
        coupon_id=coupon.id
    )
    db.add(redemption)
    
    # Create transaction record
    transaction = TokenTransaction(
        user_id=user.id,
        amount=coupon.token_amount,
        action='coupon',
        description=f"Riscattato coupon '{coupon.code}' ({coupon.token_amount} token)"
    )
    db.add(transaction)
    
    db.commit()
    
    return {
        "success": True,
        "tokens_added": coupon.token_amount,
        "new_balance": user.tokens,
        "message": f"Hai ricevuto {coupon.token_amount} token!"
    }
