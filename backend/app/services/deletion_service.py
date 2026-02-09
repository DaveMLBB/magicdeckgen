"""
GDPR Account Deletion Service

Handles account deletion requests with a 7-day grace period.
Implements requirements 5.7, 5.8, 5.9, 5.1-5.6, 5.11.
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import secrets
import bcrypt
from app.models import User, DeletionRequest, SavedDeck, SavedDeckCard, CardCollection, Card, ConsentLog, PolicyAcceptance, DataExportToken


class DeletionServiceException(Exception):
    """Base exception for deletion service errors"""
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class InvalidPasswordException(DeletionServiceException):
    """Raised when password verification fails"""
    def __init__(self):
        super().__init__(
            code="INVALID_PASSWORD",
            message="The password provided is incorrect",
            status_code=401
        )


class DeletionAlreadyPendingException(DeletionServiceException):
    """Raised when user already has a pending deletion request"""
    def __init__(self):
        super().__init__(
            code="DELETION_ALREADY_PENDING",
            message="Account deletion is already pending for this user",
            status_code=400
        )


class DeletionService:
    """Service for handling GDPR account deletion requests"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def initiate_deletion(self, user_id: int, password: str) -> DeletionRequest:
        """
        Initiate account deletion with 7-day grace period.
        
        Steps:
        1. Verify password using bcrypt
        2. Check if deletion already pending (raise exception if yes)
        3. Generate secure cancellation token
        4. Create DeletionRequest with scheduled_for = now + 7 days
        5. Send confirmation email with cancellation link
        
        Args:
            user_id: ID of the user requesting deletion
            password: Plain text password for verification
            
        Returns:
            DeletionRequest: The created deletion request
            
        Raises:
            InvalidPasswordException: If password verification fails
            DeletionAlreadyPendingException: If deletion already pending
            
        Requirements: 5.7, 5.8
        """
        # Get user from database
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise DeletionServiceException(
                code="USER_NOT_FOUND",
                message="User not found",
                status_code=404
            )
        
        # 1. Verify password using bcrypt
        if not bcrypt.checkpw(password.encode('utf-8'), user.hashed_password.encode('utf-8')):
            raise InvalidPasswordException()
        
        # 2. Check if deletion already pending
        existing_request = self.db.query(DeletionRequest).filter(
            DeletionRequest.user_id == user_id
        ).first()
        
        if existing_request:
            if existing_request.status == 'pending':
                raise DeletionAlreadyPendingException()
            elif existing_request.status == 'cancelled':
                # Delete the old cancelled request to allow a new one
                self.db.delete(existing_request)
                self.db.commit()
            # If status is 'completed', the user shouldn't exist, but we'll continue anyway
        
        # 3. Generate secure cancellation token
        cancellation_token = secrets.token_urlsafe(32)
        
        # 4. Create DeletionRequest with scheduled_for = now + 7 days
        now = datetime.utcnow()
        scheduled_for = now + timedelta(days=7)
        
        deletion_request = DeletionRequest(
            user_id=user_id,
            requested_at=now,
            scheduled_for=scheduled_for,
            cancellation_token=cancellation_token,
            status='pending'
        )
        
        self.db.add(deletion_request)
        self.db.commit()
        self.db.refresh(deletion_request)
        
        # 5. Send confirmation email with cancellation link
        self._send_deletion_confirmation_email(user.email, cancellation_token, scheduled_for)
        
        return deletion_request
    
    def _send_deletion_confirmation_email(self, email: str, cancellation_token: str, scheduled_for: datetime):
        """
        Send confirmation email with cancellation link.
        
        Args:
            email: User's email address
            cancellation_token: Token for cancelling deletion
            scheduled_for: When the deletion is scheduled
        """
        from app.email import send_deletion_confirmation_email
        
        try:
            send_deletion_confirmation_email(email, cancellation_token, scheduled_for)
        except Exception as e:
            # Log error but don't fail the deletion request
            print(f"⚠️  Failed to send deletion confirmation email to {email}: {e}")
            # In development, print the cancellation link
            import os
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            cancellation_link = f"{frontend_url}/cancel-deletion?token={cancellation_token}"
            print(f"🔗 Cancellation link (dev): {cancellation_link}")
    
    def cancel_deletion(self, cancellation_token: str) -> bool:
        """
        Cancel a pending deletion request.
        
        Args:
            cancellation_token: The cancellation token from the email
            
        Returns:
            bool: True if successful, False if token invalid/expired
            
        Requirements: 5.9
        """
        deletion_request = self.db.query(DeletionRequest).filter(
            DeletionRequest.cancellation_token == cancellation_token,
            DeletionRequest.status == 'pending'
        ).first()
        
        if not deletion_request:
            return False
        
        # Update status to cancelled
        deletion_request.status = 'cancelled'
        deletion_request.cancelled_at = datetime.utcnow()
        
        self.db.commit()
        
        return True
    
    def execute_deletion(self, user_id: int) -> None:
        """
        Permanently delete all user data.
        
        Deletes:
        - All SavedDeck records for user
        - All SavedDeckCard records for user's decks
        - All CardCollection records for user
        - All Card records for user
        - All ConsentLog records for user
        - All PolicyAcceptance records for user
        - All DataExportToken records for user
        - User record
        
        Sends final confirmation email.
        
        Args:
            user_id: ID of the user to delete
            
        Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.11
        """
        # Get user before deletion (for email)
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return  # User already deleted
        
        user_email = user.email
        
        # Delete all saved decks and their cards
        saved_decks = self.db.query(SavedDeck).filter(SavedDeck.user_id == user_id).all()
        for deck in saved_decks:
            # Delete deck cards
            self.db.query(SavedDeckCard).filter(SavedDeckCard.deck_id == deck.id).delete()
        # Delete decks
        self.db.query(SavedDeck).filter(SavedDeck.user_id == user_id).delete()
        
        # Delete all card collections and their cards
        collections = self.db.query(CardCollection).filter(CardCollection.user_id == user_id).all()
        for collection in collections:
            # Delete cards in collection
            self.db.query(Card).filter(Card.collection_id == collection.id).delete()
        # Delete collections
        self.db.query(CardCollection).filter(CardCollection.user_id == user_id).delete()
        
        # Delete consent logs
        self.db.query(ConsentLog).filter(ConsentLog.user_id == user_id).delete()
        
        # Delete policy acceptances
        self.db.query(PolicyAcceptance).filter(PolicyAcceptance.user_id == user_id).delete()
        
        # Delete data export tokens
        self.db.query(DataExportToken).filter(DataExportToken.user_id == user_id).delete()
        
        # Delete user record
        self.db.delete(user)
        
        self.db.commit()
        
        # Send final confirmation email
        self._send_deletion_complete_email(user_email)
    
    def _send_deletion_complete_email(self, email: str):
        """
        Send final confirmation email after deletion is complete.
        
        Args:
            email: User's email address
        """
        from app.email import send_deletion_complete_email
        
        try:
            send_deletion_complete_email(email)
        except Exception as e:
            # Log error but don't fail the deletion
            print(f"⚠️  Failed to send deletion complete email to {email}: {e}")
    
    def process_pending_deletions(self) -> int:
        """
        Background job: process all deletion requests past grace period.
        
        Returns:
            int: Count of accounts deleted
            
        Requirements: 5.1
        """
        now = datetime.utcnow()
        
        # Query pending deletions that are past their scheduled time
        pending_deletions = self.db.query(DeletionRequest).filter(
            DeletionRequest.status == 'pending',
            DeletionRequest.scheduled_for <= now
        ).all()
        
        count = 0
        for deletion_request in pending_deletions:
            try:
                # Execute the deletion
                self.execute_deletion(deletion_request.user_id)
                
                # Update deletion request status
                deletion_request.status = 'completed'
                deletion_request.completed_at = now
                self.db.commit()
                
                count += 1
            except Exception as e:
                print(f"❌ Error processing deletion for user {deletion_request.user_id}: {e}")
                self.db.rollback()
        
        return count
