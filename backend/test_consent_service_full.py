#!/usr/bin/env python3
"""
Full test of ConsentService including all methods.
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models import ConsentLog, User
from app.services.consent_service import ConsentService

print("🧪 Testing all ConsentService methods\n")

db = SessionLocal()
consent_service = ConsentService()

try:
    # Create a test user
    print("Setting up test user...")
    test_user = User(
        email="test_full_consent@example.com",
        hashed_password="test_hash",
        is_verified=True
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    print(f"✅ Created test user with ID: {test_user.id}\n")
    
    # Test log_consent
    print("Test 1: log_consent method...")
    consent1 = consent_service.log_consent(
        db=db,
        user_id=test_user.id,
        session_id=None,
        essential=True,
        analytics=True,
        marketing=False,
        ip_address="192.168.1.1",
        user_agent="Test Browser 1",
        banner_version="1.0"
    )
    print(f"✅ Logged consent with ID: {consent1.id}")
    
    # Log another consent for the same user
    consent2 = consent_service.log_consent(
        db=db,
        user_id=test_user.id,
        session_id=None,
        essential=True,
        analytics=False,
        marketing=False,
        ip_address="192.168.1.1",
        user_agent="Test Browser 1",
        banner_version="1.1"
    )
    print(f"✅ Logged second consent with ID: {consent2.id}")
    
    # Test get_user_consent_history
    print("\nTest 2: get_user_consent_history method...")
    history = consent_service.get_user_consent_history(db, test_user.id)
    assert len(history) == 2, f"Should have 2 consent logs, found {len(history)}"
    assert history[0].id == consent2.id, "Most recent consent should be first"
    assert history[1].id == consent1.id, "Older consent should be second"
    print(f"✅ Retrieved {len(history)} consent logs in correct order")
    
    # Test get_current_consent
    print("\nTest 3: get_current_consent method...")
    current = consent_service.get_current_consent(db, user_id=test_user.id)
    assert current is not None, "Should find current consent"
    assert current.id == consent2.id, "Should return most recent consent"
    assert current.analytics is False, "Should have correct analytics value"
    print(f"✅ Retrieved current consent with ID: {current.id}")
    
    # Test get_current_consent with session_id
    print("\nTest 4: get_current_consent with session_id...")
    anon_consent = consent_service.log_consent(
        db=db,
        user_id=None,
        session_id="test-session-123",
        essential=True,
        analytics=True,
        marketing=True,
        ip_address="10.0.0.1",
        user_agent="Test Browser 2",
        banner_version="1.0"
    )
    
    current_anon = consent_service.get_current_consent(db, session_id="test-session-123")
    assert current_anon is not None, "Should find consent for session"
    assert current_anon.id == anon_consent.id, "Should return correct consent"
    print(f"✅ Retrieved current consent for session with ID: {current_anon.id}")
    
    # Test get_current_consent with expired consent
    print("\nTest 5: get_current_consent with expired consent...")
    expired_consent = ConsentLog(
        user_id=test_user.id,
        session_id=None,
        essential=True,
        analytics=True,
        marketing=False,
        timestamp=datetime.utcnow() - timedelta(days=400),
        ip_address="192.168.1.1",
        user_agent="Test Browser",
        banner_version="0.9",
        expires_at=datetime.utcnow() - timedelta(days=35)  # Expired 35 days ago
    )
    db.add(expired_consent)
    db.commit()
    
    # Create a new user for this test
    test_user2 = User(
        email="test_expired@example.com",
        hashed_password="test_hash",
        is_verified=True
    )
    db.add(test_user2)
    db.commit()
    db.refresh(test_user2)
    
    expired_consent2 = ConsentLog(
        user_id=test_user2.id,
        session_id=None,
        essential=True,
        analytics=True,
        marketing=False,
        timestamp=datetime.utcnow() - timedelta(days=400),
        ip_address="192.168.1.1",
        user_agent="Test Browser",
        banner_version="0.9",
        expires_at=datetime.utcnow() - timedelta(days=35)  # Expired 35 days ago
    )
    db.add(expired_consent2)
    db.commit()
    
    current_expired = consent_service.get_current_consent(db, user_id=test_user2.id)
    assert current_expired is None, "Should return None for expired consent"
    print("✅ Correctly returns None for expired consent")
    
    # Test cleanup_old_consents
    print("\nTest 6: cleanup_old_consents method...")
    # Create an old consent log (older than 3 years)
    old_consent = ConsentLog(
        user_id=test_user.id,
        session_id=None,
        essential=True,
        analytics=True,
        marketing=False,
        timestamp=datetime.utcnow() - timedelta(days=365 * 3 + 10),  # 3 years + 10 days old
        ip_address="192.168.1.1",
        user_agent="Old Browser",
        banner_version="0.5",
        expires_at=datetime.utcnow() - timedelta(days=365 * 2 + 10)
    )
    db.add(old_consent)
    db.commit()
    
    # Count consents before cleanup
    count_before = db.query(ConsentLog).count()
    
    # Run cleanup
    deleted_count = consent_service.cleanup_old_consents(db)
    
    # Count consents after cleanup
    count_after = db.query(ConsentLog).count()
    
    assert deleted_count >= 1, f"Should have deleted at least 1 old consent, deleted {deleted_count}"
    assert count_after < count_before, "Should have fewer consents after cleanup"
    print(f"✅ Cleaned up {deleted_count} old consent logs")
    
    # Clean up all test data
    print("\nCleaning up test data...")
    db.query(ConsentLog).filter(
        (ConsentLog.user_id == test_user.id) | 
        (ConsentLog.user_id == test_user2.id) |
        (ConsentLog.session_id == "test-session-123")
    ).delete()
    db.query(User).filter(
        (User.id == test_user.id) | 
        (User.id == test_user2.id)
    ).delete()
    db.commit()
    print("✅ Test data cleaned up")
    
    print("\n" + "="*60)
    print("✅ All ConsentService methods work correctly!")
    print("="*60)
    
except AssertionError as e:
    print(f"\n❌ Assertion failed: {e}")
    db.rollback()
    sys.exit(1)
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
    sys.exit(1)
finally:
    db.close()
