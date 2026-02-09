"""
GDPR Router - API endpoints for GDPR compliance

This router implements all GDPR-related endpoints:
- Cookie consent management
- Data export and download
- Account deletion with grace period
- Legal document access (privacy policy, terms of service)
- Policy acceptance tracking
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from jose import JWTError, jwt

from app.database import get_db
from app.models import User, PolicyAcceptance
from app.services.consent_service import ConsentService
from app.services.data_export_service import DataExportService
from app.services.deletion_service import (
    DeletionService,
    InvalidPasswordException,
    DeletionAlreadyPendingException,
    DeletionServiceException
)

router = APIRouter()

# JWT Configuration (should match auth.py)
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

# Pydantic Models
class ConsentRequest(BaseModel):
    """Request model for logging consent decisions"""
    essential: bool = True
    analytics: bool
    marketing: bool
    banner_version: str = "1.0"


class ConsentResponse(BaseModel):
    """Response model for consent logging"""
    success: bool
    consent_id: int
    timestamp: str


class ConsentHistoryItem(BaseModel):
    """Model for a single consent history entry"""
    consent_id: int
    essential: bool
    analytics: bool
    marketing: bool
    timestamp: str
    banner_version: str


class ConsentHistoryResponse(BaseModel):
    """Response model for consent history"""
    current_consent: Optional[dict]
    history: List[ConsentHistoryItem]


class DataExportResponse(BaseModel):
    """Response model for data export request"""
    download_url: str
    expires_at: str
    file_size_bytes: int


class DeleteAccountRequest(BaseModel):
    """Request model for account deletion"""
    password: str
    confirmation: str


class DeleteAccountResponse(BaseModel):
    """Response model for account deletion"""
    success: bool
    deletion_scheduled: str
    cancellation_token: str
    message: str


class CancelDeletionRequest(BaseModel):
    """Request model for cancelling deletion"""
    cancellation_token: str


class CancelDeletionResponse(BaseModel):
    """Response model for deletion cancellation"""
    success: bool
    message: str


class PolicyResponse(BaseModel):
    """Response model for legal documents"""
    content: str
    version: str
    last_updated: str
    effective_date: str


class AcceptPolicyRequest(BaseModel):
    """Request model for accepting policies"""
    policy_type: str  # 'privacy' or 'terms'
    version: str


class AcceptPolicyResponse(BaseModel):
    """Response model for policy acceptance"""
    success: bool
    accepted_at: str


# Utility Functions
def get_current_user_id(token: str, db: Session) -> int:
    """
    Extract and validate user ID from JWT token.
    
    Args:
        token: JWT token from Authorization header
        db: Database session
        
    Returns:
        int: User ID
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user_id


def get_client_ip(request: Request) -> str:
    """
    Extract client IP address from request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: Client IP address
    """
    # Check for X-Forwarded-For header (proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    # Fall back to direct client IP
    return request.client.host if request.client else "unknown"


def get_user_agent(request: Request) -> str:
    """
    Extract user agent string from request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: User agent string
    """
    return request.headers.get("User-Agent", "unknown")


# Endpoints

@router.post("/consent", response_model=ConsentResponse)
def log_consent(
    consent_data: ConsentRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Log a cookie consent decision.
    
    This endpoint accepts consent decisions from both authenticated and
    anonymous users. For authenticated users, the consent is linked to
    their user_id. For anonymous users, a session_id should be provided
    in the request (future enhancement).
    
    Requirements: 1.3, 1.4, 1.5, 1.6
    """
    # Extract request metadata
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    # Try to get user_id from Authorization header (optional)
    user_id = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        try:
            user_id = get_current_user_id(token, db)
        except HTTPException:
            # If token is invalid, treat as anonymous user
            pass
    
    # For now, use a session_id based on IP + User Agent if no user_id
    # In production, this should be a proper session management system
    session_id = None if user_id else f"{ip_address}_{hash(user_agent)}"
    
    # Log consent using ConsentService
    consent_service = ConsentService()
    consent_log = consent_service.log_consent(
        db=db,
        user_id=user_id,
        session_id=session_id,
        essential=consent_data.essential,
        analytics=consent_data.analytics,
        marketing=consent_data.marketing,
        ip_address=ip_address,
        user_agent=user_agent,
        banner_version=consent_data.banner_version
    )
    
    return ConsentResponse(
        success=True,
        consent_id=consent_log.id,
        timestamp=consent_log.timestamp.isoformat() + "Z"
    )


@router.get("/consent", response_model=ConsentHistoryResponse)
def get_consent_history(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get current consent and consent history for authenticated user.
    
    Requires authentication via Bearer token.
    
    Requirements: 4.5, 7.9
    """
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    token = auth_header.replace("Bearer ", "")
    user_id = get_current_user_id(token, db)
    
    # Get consent history
    consent_service = ConsentService()
    
    # Get current consent
    current_consent_log = consent_service.get_current_consent(db, user_id=user_id)
    current_consent = None
    if current_consent_log:
        current_consent = {
            "essential": current_consent_log.essential,
            "analytics": current_consent_log.analytics,
            "marketing": current_consent_log.marketing,
            "timestamp": current_consent_log.timestamp.isoformat() + "Z"
        }
    
    # Get full history
    history_logs = consent_service.get_user_consent_history(db, user_id)
    history = [
        ConsentHistoryItem(
            consent_id=log.id,
            essential=log.essential,
            analytics=log.analytics,
            marketing=log.marketing,
            timestamp=log.timestamp.isoformat() + "Z",
            banner_version=log.banner_version
        )
        for log in history_logs
    ]
    
    return ConsentHistoryResponse(
        current_consent=current_consent,
        history=history
    )


@router.post("/export", response_model=DataExportResponse)
def request_data_export(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Request a data export for the authenticated user.
    
    Generates a JSON file containing all user data and returns a
    download URL with a token valid for 24 hours.
    
    Requirements: 4.1, 4.9
    """
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    token = auth_header.replace("Bearer ", "")
    user_id = get_current_user_id(token, db)
    
    # Generate export file
    export_service = DataExportService()
    try:
        download_token = export_service.generate_export_file(db, user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate export: {str(e)}"
        )
    
    # Get token details for response
    from app.models import DataExportToken
    export_token_record = db.query(DataExportToken).filter(
        DataExportToken.token == download_token
    ).first()
    
    # Build download URL
    download_url = f"/api/gdpr/download/{download_token}"
    
    # Log data access request (simple print for now, should be proper logging)
    print(f"📊 Data export requested by user {user_id} at {datetime.utcnow().isoformat()}")
    
    return DataExportResponse(
        download_url=download_url,
        expires_at=export_token_record.expires_at.isoformat() + "Z",
        file_size_bytes=export_token_record.file_size_bytes
    )


@router.get("/download/{token}")
def download_export_file(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Download a data export file using a valid token.
    
    Returns the JSON file as a downloadable attachment.
    
    Requirements: 6.7
    """
    export_service = DataExportService()
    
    try:
        file_content, filename = export_service.get_export_file(db, token)
    except ValueError as e:
        error_message = str(e)
        if "expired" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Export token has expired"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid export token"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve export: {str(e)}"
        )
    
    # Return file as JSON response with download headers
    return Response(
        content=file_content,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
            "Pragma": "no-cache"
        }
    )


@router.post("/delete-account", response_model=DeleteAccountResponse)
def request_account_deletion(
    deletion_data: DeleteAccountRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Request account deletion with 7-day grace period.
    
    Requires password confirmation and explicit confirmation text.
    Sends email with cancellation link.
    
    Requirements: 5.7, 5.8
    """
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    token = auth_header.replace("Bearer ", "")
    user_id = get_current_user_id(token, db)
    
    # Verify confirmation text
    if deletion_data.confirmation != "DELETE MY ACCOUNT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation text must be exactly 'DELETE MY ACCOUNT'"
        )
    
    # Initiate deletion
    deletion_service = DeletionService(db)
    
    try:
        deletion_request = deletion_service.initiate_deletion(
            user_id=user_id,
            password=deletion_data.password
        )
    except InvalidPasswordException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except DeletionAlreadyPendingException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except DeletionServiceException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    
    return DeleteAccountResponse(
        success=True,
        deletion_scheduled=deletion_request.scheduled_for.isoformat() + "Z",
        cancellation_token=deletion_request.cancellation_token,
        message="Account deletion scheduled. Check email for cancellation link."
    )


@router.post("/cancel-deletion", response_model=CancelDeletionResponse)
def cancel_account_deletion(
    cancellation_data: CancelDeletionRequest,
    db: Session = Depends(get_db)
):
    """
    Cancel a pending account deletion request.
    
    Uses the cancellation token from the email link.
    Does not require authentication.
    
    Requirements: 5.9
    """
    deletion_service = DeletionService(db)
    
    success = deletion_service.cancel_deletion(cancellation_data.cancellation_token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired cancellation token"
        )
    
    return CancelDeletionResponse(
        success=True,
        message="Account deletion cancelled successfully."
    )


@router.get("/privacy-policy", response_model=PolicyResponse)
def get_privacy_policy():
    """
    Get the current privacy policy.
    
    Returns the privacy policy content in markdown format with version info.
    
    Requirements: 2.1
    """
    # In a real implementation, this would read from a file or database
    # For now, return a placeholder
    content = """# Privacy Policy

## Last Updated: January 2024
## Version: 1.0

### 1. Introduction

This Privacy Policy describes how Magic Deck Generator ("we", "us", or "our") collects, uses, and protects your personal data in accordance with the General Data Protection Regulation (GDPR).

### 2. Data Controller

Magic Deck Generator
https://cloudsw.site/contatti

### 3. Data We Collect

We collect the following types of personal data:

- **Account Information**: Email address, hashed password, registration date
- **Deck Data**: Saved decks, card collections, deck preferences
- **Usage Data**: Login timestamps, feature usage statistics
- **Consent Records**: Cookie preferences, policy acceptance history

### 4. Legal Basis for Processing

We process your personal data based on:

- **Consent**: For cookie usage and marketing communications
- **Contract Performance**: To provide our deck building services
- **Legitimate Interest**: To improve our services and prevent fraud

### 5. Data Retention

We retain your personal data for the following periods:

- **Active Accounts**: Until account deletion or 3 years of inactivity
- **Unverified Accounts**: 90 days from registration
- **Consent Logs**: 3 years for compliance purposes
- **Transaction Records**: As required by law

### 6. Your Rights Under GDPR

You have the following rights:

- **Right to Access**: Request a copy of your personal data
- **Right to Erasure**: Request deletion of your account and data
- **Right to Portability**: Export your data in JSON format
- **Right to Object**: Opt out of marketing communications
- **Right to Restriction**: Limit how we process your data

### 7. Cookie Usage

We use three categories of cookies:

- **Essential Cookies**: Required for authentication and core functionality
- **Analytics Cookies**: Help us understand how you use our service
- **Marketing Cookies**: Used for advertising and promotional content

You can manage your cookie preferences at any time through your account settings.

### 8. Data Security

We implement appropriate technical and organizational measures to protect your personal data:

- Passwords are hashed using bcrypt
- All communications use HTTPS encryption
- Access to personal data is restricted to authorized personnel
- Regular security audits and updates

### 9. Third-Party Services

We may share data with:

- **Email Service Provider**: For sending verification and notification emails
- **Analytics Provider**: For anonymized usage statistics (if analytics cookies enabled)

### 10. International Data Transfers

Your data is stored within the European Union. If we transfer data outside the EU, we ensure appropriate safeguards are in place.

### 11. Changes to This Policy

We may update this Privacy Policy from time to time. Material changes will be notified to you via email or through the application.

### 12. Contact Us

For questions about this Privacy Policy or to exercise your rights, contact us at:

https://cloudsw.site/contatti

### 13. Supervisory Authority

You have the right to lodge a complaint with your local data protection authority if you believe we have not handled your personal data appropriately.
"""
    
    return PolicyResponse(
        content=content,
        version="1.0",
        last_updated="2024-01-15",
        effective_date="2024-01-15"
    )


@router.get("/terms-of-service", response_model=PolicyResponse)
def get_terms_of_service():
    """
    Get the current terms of service.
    
    Returns the terms of service content in markdown format with version info.
    
    Requirements: 3.1
    """
    # In a real implementation, this would read from a file or database
    # For now, return a placeholder
    content = """# Terms of Service

## Last Updated: January 2024
## Version: 1.0

### 1. Acceptance of Terms

By accessing and using Magic Deck Generator ("the Service"), you accept and agree to be bound by these Terms of Service.

### 2. Description of Service

Magic Deck Generator is a web application that helps Magic: The Gathering players build, manage, and optimize their decks.

### 3. User Accounts

#### 3.1 Registration

- You must provide a valid email address to register
- You are responsible for maintaining the confidentiality of your password
- You must be at least 13 years old to use the Service

#### 3.2 Account Security

- You are responsible for all activities under your account
- Notify us immediately of any unauthorized access
- We are not liable for losses due to unauthorized account use

### 4. Acceptable Use

You agree NOT to:

- Use the Service for any illegal purpose
- Attempt to gain unauthorized access to our systems
- Upload malicious code or viruses
- Harass, abuse, or harm other users
- Scrape or automatically collect data from the Service
- Impersonate others or misrepresent your affiliation

### 5. Intellectual Property

#### 5.1 Service Content

- The Service and its original content are owned by Magic Deck Generator
- Magic: The Gathering and related trademarks are property of Wizards of the Coast

#### 5.2 User Content

- You retain ownership of decks and collections you create
- By using the Service, you grant us a license to store and display your content
- You can delete your content at any time

### 6. Subscriptions and Payments

#### 6.1 Subscription Plans

- Free: Limited uploads and searches
- Monthly ($10): Unlimited uploads and searches
- Monthly ($30): Premium features
- Yearly: Discounted annual subscription
- Lifetime: One-time payment for permanent access

#### 6.2 Billing

- Subscriptions are billed in advance
- Payments are non-refundable except as required by law
- We may change subscription prices with 30 days notice

#### 6.3 Cancellation

- You can cancel your subscription at any time
- Access continues until the end of the billing period
- No refunds for partial periods

### 7. Privacy and Data Protection

Your use of the Service is also governed by our Privacy Policy. We comply with GDPR and respect your data rights.

### 8. Disclaimer of Warranties

THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE:

- Uninterrupted or error-free operation
- Accuracy of deck recommendations
- Compatibility with all devices or browsers

### 9. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:

- Indirect, incidental, or consequential damages
- Loss of profits, data, or goodwill
- Damages exceeding the amount you paid us in the past 12 months

### 10. Indemnification

You agree to indemnify and hold us harmless from claims arising from:

- Your use of the Service
- Your violation of these Terms
- Your violation of any third-party rights

### 11. Termination

We may terminate or suspend your account if you:

- Violate these Terms
- Engage in fraudulent activity
- Request account deletion

### 12. Governing Law

These Terms are governed by the laws of the European Union and the jurisdiction where our company is registered.

### 13. Dispute Resolution

Any disputes shall be resolved through:

1. Good faith negotiation
2. Mediation (if negotiation fails)
3. Arbitration or courts in our jurisdiction

### 14. Changes to Terms

We may modify these Terms at any time. Material changes will be notified via email. Continued use after changes constitutes acceptance.

### 15. Severability

If any provision of these Terms is found invalid, the remaining provisions remain in effect.

### 16. Contact Information

For questions about these Terms, contact us at:

https://cloudsw.site/contatti

### 17. Entire Agreement

These Terms, together with our Privacy Policy, constitute the entire agreement between you and Magic Deck Generator.
"""
    
    return PolicyResponse(
        content=content,
        version="1.0",
        last_updated="2024-01-15",
        effective_date="2024-01-15"
    )


@router.post("/accept-policy", response_model=AcceptPolicyResponse)
def accept_policy(
    policy_data: AcceptPolicyRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Record user acceptance of a policy (privacy or terms).
    
    Updates the user's policy version and creates a PolicyAcceptance record.
    
    Requirements: 2.10, 3.8, 3.9
    """
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    token = auth_header.replace("Bearer ", "")
    user_id = get_current_user_id(token, db)
    
    # Validate policy_type
    if policy_data.policy_type not in ["privacy", "terms"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="policy_type must be 'privacy' or 'terms'"
        )
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    
    # Create PolicyAcceptance record
    accepted_at = datetime.utcnow()
    policy_acceptance = PolicyAcceptance(
        user_id=user_id,
        policy_type=policy_data.policy_type,
        policy_version=policy_data.version,
        accepted_at=accepted_at
    )
    
    db.add(policy_acceptance)
    
    # Update user's policy version
    if policy_data.policy_type == "privacy":
        user.privacy_policy_version = policy_data.version
    else:  # terms
        user.terms_version = policy_data.version
    
    db.commit()
    
    return AcceptPolicyResponse(
        success=True,
        accepted_at=accepted_at.isoformat() + "Z"
    )
