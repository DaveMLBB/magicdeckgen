"""
GDPR Data Retention Service

Handles automatic cleanup of old data according to retention policies.
Implements requirements 8.2, 8.3, 8.4, 8.5, 8.6, 7.8.
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import User
from app.services.deletion_service import DeletionService
from app.services.consent_service import ConsentService


class RetentionService:
    """Service for enforcing GDPR data retention policies"""
    
    def __init__(self, db: Session):
        self.db = db
        self.deletion_service = DeletionService(db)
        self.consent_service = ConsentService()
    
    def cleanup_inactive_accounts(self) -> int:
        """
        Delete accounts inactive for 3+ years.
        
        Process:
        1. Find users with last_login_at > 3 years ago and inactive_warning_sent_at is NULL
        2. Send warning emails and set inactive_warning_sent_at
        3. Find users with inactive_warning_sent_at > 30 days ago
        4. Delete those accounts using DeletionService.execute_deletion
        
        Returns:
            int: Number of accounts deleted
            
        Requirements: 8.2, 8.3
        """
        now = datetime.utcnow()
        three_years_ago = now - timedelta(days=365 * 3)
        thirty_days_ago = now - timedelta(days=30)
        
        # Step 1 & 2: Find inactive users who haven't been warned yet
        users_to_warn = self.db.query(User).filter(
            User.last_login_at < three_years_ago,
            User.inactive_warning_sent_at.is_(None)
        ).all()
        
        for user in users_to_warn:
            try:
                # Send warning email
                self._send_inactive_warning_email(user.email, user.last_login_at)
                
                # Mark warning as sent
                user.inactive_warning_sent_at = now
                self.db.commit()
                
                print(f"⚠️  Sent inactivity warning to user {user.id} ({user.email})")
            except Exception as e:
                print(f"❌ Error sending warning to user {user.id}: {e}")
                self.db.rollback()
        
        # Step 3 & 4: Find users who were warned 30+ days ago and delete them
        users_to_delete = self.db.query(User).filter(
            User.inactive_warning_sent_at < thirty_days_ago
        ).all()
        
        deleted_count = 0
        for user in users_to_delete:
            try:
                print(f"🗑️  Deleting inactive user {user.id} ({user.email})")
                self.deletion_service.execute_deletion(user.id)
                deleted_count += 1
            except Exception as e:
                print(f"❌ Error deleting inactive user {user.id}: {e}")
                self.db.rollback()
        
        return deleted_count
    
    def _send_inactive_warning_email(self, email: str, last_login: datetime):
        """
        Send warning email about account inactivity.
        
        Args:
            email: User's email address
            last_login: Date of last login
        """
        from app.email import send_inactive_warning_email
        
        try:
            send_inactive_warning_email(email, last_login)
        except Exception as e:
            # Log error but don't fail the process
            print(f"⚠️  Failed to send inactive warning email to {email}: {e}")
    
    def cleanup_unverified_accounts(self) -> int:
        """
        Delete unverified accounts older than 90 days.
        
        Returns:
            int: Number of accounts deleted
            
        Requirements: 8.4
        """
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        
        # Find unverified accounts older than 90 days
        unverified_users = self.db.query(User).filter(
            User.is_verified == False,
            User.created_at < ninety_days_ago
        ).all()
        
        deleted_count = 0
        for user in unverified_users:
            try:
                print(f"🗑️  Deleting unverified user {user.id} ({user.email})")
                self.deletion_service.execute_deletion(user.id)
                deleted_count += 1
            except Exception as e:
                print(f"❌ Error deleting unverified user {user.id}: {e}")
                self.db.rollback()
        
        return deleted_count
    
    def cleanup_expired_tokens(self) -> int:
        """
        Delete expired password reset and verification tokens.
        
        Password reset tokens: 24 hours
        Email verification tokens: 7 days
        
        Returns:
            int: Number of tokens deleted
            
        Requirements: 8.5, 8.6
        """
        now = datetime.utcnow()
        twenty_four_hours_ago = now - timedelta(hours=24)
        seven_days_ago = now - timedelta(days=7)
        
        deleted_count = 0
        
        # Delete expired password reset tokens (24 hours)
        # Note: We need to check when the token was created, but we don't have a created_at field
        # So we'll clear reset_token for users who haven't logged in recently
        # This is a simplified approach - in production, you'd want a separate tokens table with timestamps
        
        # For now, we'll clear reset tokens for users who haven't updated in 24 hours
        # and have a reset_token set
        users_with_old_reset_tokens = self.db.query(User).filter(
            User.reset_token.isnot(None),
            User.updated_at < twenty_four_hours_ago
        ).all()
        
        for user in users_with_old_reset_tokens:
            user.reset_token = None
            deleted_count += 1
        
        # Delete expired verification tokens (7 days)
        users_with_old_verification_tokens = self.db.query(User).filter(
            User.verification_token.isnot(None),
            User.is_verified == False,
            User.created_at < seven_days_ago
        ).all()
        
        for user in users_with_old_verification_tokens:
            user.verification_token = None
            deleted_count += 1
        
        if deleted_count > 0:
            self.db.commit()
        
        return deleted_count
    
    def run_all_cleanup_tasks(self) -> dict:
        """
        Execute all retention cleanup tasks.
        
        Returns:
            dict: Summary of deletions by category
            
        Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 7.8
        """
        print("🧹 Starting GDPR retention cleanup tasks...")
        
        results = {
            "inactive_accounts_deleted": 0,
            "unverified_accounts_deleted": 0,
            "expired_tokens_deleted": 0,
            "old_consents_deleted": 0,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            # Cleanup inactive accounts
            results["inactive_accounts_deleted"] = self.cleanup_inactive_accounts()
            print(f"✅ Deleted {results['inactive_accounts_deleted']} inactive accounts")
        except Exception as e:
            print(f"❌ Error in cleanup_inactive_accounts: {e}")
        
        try:
            # Cleanup unverified accounts
            results["unverified_accounts_deleted"] = self.cleanup_unverified_accounts()
            print(f"✅ Deleted {results['unverified_accounts_deleted']} unverified accounts")
        except Exception as e:
            print(f"❌ Error in cleanup_unverified_accounts: {e}")
        
        try:
            # Cleanup expired tokens
            results["expired_tokens_deleted"] = self.cleanup_expired_tokens()
            print(f"✅ Deleted {results['expired_tokens_deleted']} expired tokens")
        except Exception as e:
            print(f"❌ Error in cleanup_expired_tokens: {e}")
        
        try:
            # Cleanup old consent logs
            results["old_consents_deleted"] = self.consent_service.cleanup_old_consents(self.db)
            print(f"✅ Deleted {results['old_consents_deleted']} old consent logs")
        except Exception as e:
            print(f"❌ Error in cleanup_old_consents: {e}")
        
        print(f"🧹 Cleanup complete: {results}")
        
        return results
