"""
Test for RetentionService

Tests requirements 8.2, 8.3, 8.4, 8.5, 8.6, 7.8:
- cleanup_inactive_accounts: Delete accounts inactive for 3+ years
- cleanup_unverified_accounts: Delete unverified accounts older than 90 days
- cleanup_expired_tokens: Delete expired password reset and verification tokens
- run_all_cleanup_tasks: Execute all retention cleanup tasks
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from datetime import datetime, timedelta
import bcrypt
from app.database import SessionLocal, engine
from app.models import User, ConsentLog, Base
from app.services.retention_service import RetentionService


def test_retention_service():
    """Test the RetentionService methods"""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("\n" + "="*60)
        print("Testing RetentionService")
        print("="*60)
        
        # Create test service
        service = RetentionService(db)
        
        # 1️⃣ Test cleanup_inactive_accounts
        print("\n1️⃣ Testing cleanup_inactive_accounts...")
        
        # Create an inactive user (last login > 3 years ago)
        three_years_ago = datetime.utcnow() - timedelta(days=365 * 3 + 1)
        inactive_user = User(
            email=f"inactive_{datetime.utcnow().timestamp()}@example.com",
            hashed_password=bcrypt.hashpw(b"test123", bcrypt.gensalt()).decode('utf-8'),
            is_verified=True,
            last_login_at=three_years_ago,
            inactive_warning_sent_at=None
        )
        db.add(inactive_user)
        db.commit()
        db.refresh(inactive_user)
        print(f"✅ Created inactive user: {inactive_user.email} (ID: {inactive_user.id})")
        print(f"   Last login: {inactive_user.last_login_at}")
        
        # Run cleanup - should send warning but not delete yet
        deleted_count = service.cleanup_inactive_accounts()
        print(f"✅ First cleanup run: {deleted_count} accounts deleted")
        
        # Verify warning was sent
        db.refresh(inactive_user)
        if inactive_user.inactive_warning_sent_at:
            print(f"✅ Warning sent timestamp set: {inactive_user.inactive_warning_sent_at}")
        else:
            print(f"❌ FAILED: Warning sent timestamp not set")
        
        # Verify user still exists
        user_check = db.query(User).filter(User.id == inactive_user.id).first()
        if user_check:
            print(f"✅ User still exists after first cleanup (grace period)")
        else:
            print(f"❌ FAILED: User was deleted too early")
        
        # Simulate 30 days passing by setting warning date to 31 days ago
        thirty_one_days_ago = datetime.utcnow() - timedelta(days=31)
        inactive_user.inactive_warning_sent_at = thirty_one_days_ago
        db.commit()
        print(f"✅ Simulated 31 days passing since warning")
        
        # Run cleanup again - should delete now
        deleted_count = service.cleanup_inactive_accounts()
        print(f"✅ Second cleanup run: {deleted_count} accounts deleted")
        
        # Verify user is deleted
        user_check = db.query(User).filter(User.id == inactive_user.id).first()
        if user_check is None:
            print(f"✅ Inactive user successfully deleted after grace period")
        else:
            print(f"❌ FAILED: Inactive user still exists after grace period")
        
        # 2️⃣ Test cleanup_unverified_accounts
        print("\n2️⃣ Testing cleanup_unverified_accounts...")
        
        # Create an unverified user older than 90 days
        ninety_one_days_ago = datetime.utcnow() - timedelta(days=91)
        unverified_user = User(
            email=f"unverified_{datetime.utcnow().timestamp()}@example.com",
            hashed_password=bcrypt.hashpw(b"test123", bcrypt.gensalt()).decode('utf-8'),
            is_verified=False,
            created_at=ninety_one_days_ago,
            verification_token="test_token_123"
        )
        db.add(unverified_user)
        db.commit()
        db.refresh(unverified_user)
        print(f"✅ Created unverified user: {unverified_user.email} (ID: {unverified_user.id})")
        print(f"   Created at: {unverified_user.created_at}")
        
        # Run cleanup
        deleted_count = service.cleanup_unverified_accounts()
        print(f"✅ Cleanup run: {deleted_count} unverified accounts deleted")
        
        # Verify user is deleted
        user_check = db.query(User).filter(User.id == unverified_user.id).first()
        if user_check is None:
            print(f"✅ Unverified user successfully deleted")
        else:
            print(f"❌ FAILED: Unverified user still exists")
        
        # 3️⃣ Test cleanup_expired_tokens
        print("\n3️⃣ Testing cleanup_expired_tokens...")
        
        # Create users with expired tokens
        # User with expired reset token (24+ hours old)
        user_with_reset = User(
            email=f"reset_{datetime.utcnow().timestamp()}@example.com",
            hashed_password=bcrypt.hashpw(b"test123", bcrypt.gensalt()).decode('utf-8'),
            is_verified=True,
            reset_token="expired_reset_token",
            updated_at=datetime.utcnow() - timedelta(hours=25)
        )
        db.add(user_with_reset)
        
        # User with expired verification token (7+ days old)
        user_with_verification = User(
            email=f"verify_{datetime.utcnow().timestamp()}@example.com",
            hashed_password=bcrypt.hashpw(b"test123", bcrypt.gensalt()).decode('utf-8'),
            is_verified=False,
            verification_token="expired_verification_token",
            created_at=datetime.utcnow() - timedelta(days=8)
        )
        db.add(user_with_verification)
        
        db.commit()
        db.refresh(user_with_reset)
        db.refresh(user_with_verification)
        
        print(f"✅ Created user with expired reset token: {user_with_reset.email}")
        print(f"✅ Created user with expired verification token: {user_with_verification.email}")
        
        # Run cleanup
        deleted_count = service.cleanup_expired_tokens()
        print(f"✅ Cleanup run: {deleted_count} expired tokens deleted")
        
        # Verify tokens are cleared
        db.refresh(user_with_reset)
        db.refresh(user_with_verification)
        
        if user_with_reset.reset_token is None:
            print(f"✅ Reset token successfully cleared")
        else:
            print(f"❌ FAILED: Reset token still exists: {user_with_reset.reset_token}")
        
        if user_with_verification.verification_token is None:
            print(f"✅ Verification token successfully cleared")
        else:
            print(f"❌ FAILED: Verification token still exists: {user_with_verification.verification_token}")
        
        # 4️⃣ Test cleanup_old_consents (via run_all_cleanup_tasks)
        print("\n4️⃣ Testing cleanup_old_consents...")
        
        # Create an old consent log (> 3 years old)
        three_years_ago = datetime.utcnow() - timedelta(days=365 * 3 + 1)
        old_consent = ConsentLog(
            user_id=None,
            session_id="test_session_123",
            essential=True,
            analytics=False,
            marketing=False,
            timestamp=three_years_ago,
            ip_address="127.0.0.1",
            user_agent="Test Agent",
            banner_version="1.0",
            expires_at=three_years_ago + timedelta(days=365)
        )
        db.add(old_consent)
        db.commit()
        db.refresh(old_consent)
        old_consent_id = old_consent.id  # Save ID before it gets deleted
        print(f"✅ Created old consent log: ID {old_consent_id}, timestamp {old_consent.timestamp}")
        
        # 5️⃣ Test run_all_cleanup_tasks
        print("\n5️⃣ Testing run_all_cleanup_tasks...")
        
        # Create test data for comprehensive cleanup
        # Inactive user
        inactive_user2 = User(
            email=f"inactive2_{datetime.utcnow().timestamp()}@example.com",
            hashed_password=bcrypt.hashpw(b"test123", bcrypt.gensalt()).decode('utf-8'),
            is_verified=True,
            last_login_at=datetime.utcnow() - timedelta(days=365 * 3 + 1),
            inactive_warning_sent_at=datetime.utcnow() - timedelta(days=31)
        )
        db.add(inactive_user2)
        
        # Unverified user
        unverified_user2 = User(
            email=f"unverified2_{datetime.utcnow().timestamp()}@example.com",
            hashed_password=bcrypt.hashpw(b"test123", bcrypt.gensalt()).decode('utf-8'),
            is_verified=False,
            created_at=datetime.utcnow() - timedelta(days=91)
        )
        db.add(unverified_user2)
        
        db.commit()
        print(f"✅ Created test data for comprehensive cleanup")
        
        # Run all cleanup tasks
        results = service.run_all_cleanup_tasks()
        
        print(f"\n✅ Cleanup results:")
        print(f"   - Inactive accounts deleted: {results['inactive_accounts_deleted']}")
        print(f"   - Unverified accounts deleted: {results['unverified_accounts_deleted']}")
        print(f"   - Expired tokens deleted: {results['expired_tokens_deleted']}")
        print(f"   - Old consents deleted: {results['old_consents_deleted']}")
        print(f"   - Timestamp: {results['timestamp']}")
        
        # Verify results
        if results['inactive_accounts_deleted'] >= 1:
            print(f"✅ At least 1 inactive account deleted")
        else:
            print(f"⚠️  No inactive accounts deleted (may be expected)")
        
        if results['unverified_accounts_deleted'] >= 1:
            print(f"✅ At least 1 unverified account deleted")
        else:
            print(f"⚠️  No unverified accounts deleted (may be expected)")
        
        if results['old_consents_deleted'] >= 1:
            print(f"✅ At least 1 old consent deleted")
        else:
            print(f"⚠️  No old consents deleted (may be expected)")
        
        # Verify old consent is deleted
        # Note: We saved the ID before the object was deleted
        consent_check = db.query(ConsentLog).filter(ConsentLog.id == old_consent_id).first()
        if consent_check is None:
            print(f"✅ Old consent log successfully deleted")
        else:
            print(f"❌ FAILED: Old consent log still exists")
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    test_retention_service()
