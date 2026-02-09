#!/usr/bin/env python3
"""
Test script to verify the ConsentService.log_consent method works correctly.
Tests task 2.1: Implement log_consent method
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

print("🧪 Testing ConsentService.log_consent method\n")

db = SessionLocal()
consent_service = ConsentService()

try:
    # Create a test user for authenticated consent logging
    print("Setting up test user...")
    test_user = User(
        email="test_consent@example.com",
        hashed_password="test_hash",
        is_verified=True
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    print(f"✅ Created test user with ID: {test_user.id}\n")
    
    # Test 1: Log consent for authenticated user
    print("Test 1: Logging consent for authenticated user...")
    consent1 = consent_service.log_consent(
        db=db,
        user_id=test_user.id,
        session_id=None,
        essential=True,
        analytics=True,
        marketing=False,
        ip_address="192.168.1.100",
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        banner_version="1.0"
    )
    
    # Verify all fields are set correctly
    assert consent1.id is not None, "Consent log should have an ID"
    assert consent1.user_id == test_user.id, "User ID should match"
    assert consent1.session_id is None, "Session ID should be None for authenticated users"
    assert consent1.essential is True, "Essential should be True"
    assert consent1.analytics is True, "Analytics should be True"
    assert consent1.marketing is False, "Marketing should be False"
    assert consent1.ip_address == "192.168.1.100", "IP address should match"
    assert consent1.user_agent == "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "User agent should match"
    assert consent1.banner_version == "1.0", "Banner version should match"
    assert consent1.timestamp is not None, "Timestamp should be set"
    assert consent1.expires_at is not None, "Expires_at should be set"
    
    # Verify expires_at is 12 months from timestamp
    expected_expiry = consent1.timestamp + timedelta(days=365)
    time_diff = abs((consent1.expires_at - expected_expiry).total_seconds())
    assert time_diff < 2, f"Expires_at should be 12 months from timestamp (diff: {time_diff}s)"
    
    print(f"✅ Created consent log with ID: {consent1.id}")
    print(f"   User ID: {consent1.user_id}")
    print(f"   Timestamp: {consent1.timestamp}")
    print(f"   Expires at: {consent1.expires_at}")
    print(f"   Essential: {consent1.essential}, Analytics: {consent1.analytics}, Marketing: {consent1.marketing}")
    
    # Test 2: Log consent for anonymous user (session_id)
    print("\nTest 2: Logging consent for anonymous user...")
    consent2 = consent_service.log_consent(
        db=db,
        user_id=None,
        session_id="anon-session-abc123",
        essential=True,
        analytics=False,
        marketing=False,
        ip_address="10.0.0.50",
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        banner_version="1.0"
    )
    
    # Verify all fields are set correctly
    assert consent2.id is not None, "Consent log should have an ID"
    assert consent2.user_id is None, "User ID should be None for anonymous users"
    assert consent2.session_id == "anon-session-abc123", "Session ID should match"
    assert consent2.essential is True, "Essential should be True"
    assert consent2.analytics is False, "Analytics should be False"
    assert consent2.marketing is False, "Marketing should be False"
    assert consent2.ip_address == "10.0.0.50", "IP address should match"
    assert consent2.user_agent == "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)", "User agent should match"
    assert consent2.banner_version == "1.0", "Banner version should match"
    assert consent2.timestamp is not None, "Timestamp should be set"
    assert consent2.expires_at is not None, "Expires_at should be set"
    
    # Verify expires_at is 12 months from timestamp
    expected_expiry2 = consent2.timestamp + timedelta(days=365)
    time_diff2 = abs((consent2.expires_at - expected_expiry2).total_seconds())
    assert time_diff2 < 2, f"Expires_at should be 12 months from timestamp (diff: {time_diff2}s)"
    
    print(f"✅ Created consent log with ID: {consent2.id}")
    print(f"   Session ID: {consent2.session_id}")
    print(f"   Timestamp: {consent2.timestamp}")
    print(f"   Expires at: {consent2.expires_at}")
    print(f"   Essential: {consent2.essential}, Analytics: {consent2.analytics}, Marketing: {consent2.marketing}")
    
    # Test 3: Log consent with all cookies accepted
    print("\nTest 3: Logging consent with all cookies accepted...")
    consent3 = consent_service.log_consent(
        db=db,
        user_id=test_user.id,
        session_id=None,
        essential=True,
        analytics=True,
        marketing=True,
        ip_address="172.16.0.1",
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        banner_version="1.1"
    )
    
    assert consent3.essential is True, "Essential should be True"
    assert consent3.analytics is True, "Analytics should be True"
    assert consent3.marketing is True, "Marketing should be True"
    assert consent3.banner_version == "1.1", "Banner version should be 1.1"
    
    print(f"✅ Created consent log with ID: {consent3.id}")
    print(f"   All cookies accepted: Essential={consent3.essential}, Analytics={consent3.analytics}, Marketing={consent3.marketing}")
    
    # Test 4: Verify consent logs are persisted in database
    print("\nTest 4: Verifying consent logs are persisted...")
    all_consents = db.query(ConsentLog).filter(
        (ConsentLog.user_id == test_user.id) | 
        (ConsentLog.session_id == "anon-session-abc123")
    ).all()
    
    assert len(all_consents) == 3, f"Should have 3 consent logs, found {len(all_consents)}"
    print(f"✅ Found {len(all_consents)} consent logs in database")
    
    # Test 5: Verify consent logs can be queried by user_id
    print("\nTest 5: Querying consent logs by user_id...")
    user_consents = db.query(ConsentLog).filter(
        ConsentLog.user_id == test_user.id
    ).all()
    
    assert len(user_consents) == 2, f"Should have 2 consent logs for user, found {len(user_consents)}"
    print(f"✅ Found {len(user_consents)} consent logs for user_id={test_user.id}")
    
    # Test 6: Verify consent logs can be queried by session_id
    print("\nTest 6: Querying consent logs by session_id...")
    session_consents = db.query(ConsentLog).filter(
        ConsentLog.session_id == "anon-session-abc123"
    ).all()
    
    assert len(session_consents) == 1, f"Should have 1 consent log for session, found {len(session_consents)}"
    print(f"✅ Found {len(session_consents)} consent log for session_id='anon-session-abc123'")
    
    # Test 7: Verify all required fields are present (Requirements 7.1-7.7)
    print("\nTest 7: Verifying all required fields are present...")
    test_consent = consent1
    
    required_fields = {
        'user_id': test_consent.user_id,
        'timestamp': test_consent.timestamp,
        'essential': test_consent.essential,
        'analytics': test_consent.analytics,
        'marketing': test_consent.marketing,
        'banner_version': test_consent.banner_version,
        'ip_address': test_consent.ip_address,
        'user_agent': test_consent.user_agent,
        'expires_at': test_consent.expires_at
    }
    
    for field_name, field_value in required_fields.items():
        assert field_value is not None, f"Required field '{field_name}' should not be None"
    
    print("✅ All required fields are present:")
    print(f"   - User identifier: {test_consent.user_id}")
    print(f"   - Timestamp: {test_consent.timestamp}")
    print(f"   - Cookie categories: Essential={test_consent.essential}, Analytics={test_consent.analytics}, Marketing={test_consent.marketing}")
    print(f"   - Banner version: {test_consent.banner_version}")
    print(f"   - IP address: {test_consent.ip_address}")
    print(f"   - User agent: {test_consent.user_agent[:50]}...")
    print(f"   - Expires at: {test_consent.expires_at}")
    
    # Clean up test data
    print("\nCleaning up test data...")
    db.query(ConsentLog).filter(
        (ConsentLog.user_id == test_user.id) | 
        (ConsentLog.session_id == "anon-session-abc123")
    ).delete()
    db.query(User).filter(User.id == test_user.id).delete()
    db.commit()
    print("✅ Test data cleaned up")
    
    print("\n" + "="*60)
    print("✅ All tests passed!")
    print("="*60)
    print("\nTask 2.1 Implementation Summary:")
    print("- ✅ ConsentLog entry created with all required fields")
    print("- ✅ expires_at set to 12 months from timestamp")
    print("- ✅ Handles authenticated users (user_id)")
    print("- ✅ Handles anonymous users (session_id)")
    print("- ✅ Requirements validated: 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7")
    
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
