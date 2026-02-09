#!/usr/bin/env python3
"""
Test script to verify GDPR fields in User model.
"""
import sys
from pathlib import Path
from datetime import datetime

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models import User

print("🧪 Testing User model with GDPR fields\n")

try:
    db = SessionLocal()
    
    # Test 1: Create a new user with GDPR fields
    print("Test 1: Creating user with GDPR fields...")
    test_email = f"gdpr_test_{datetime.now().timestamp()}@example.com"
    test_user = User(
        email=test_email,
        hashed_password="$2b$12$test_hashed_password",  # Dummy hash for testing
        is_verified=True,
        last_login_at=datetime.utcnow(),
        privacy_policy_version="1.0",
        terms_version="1.0",
        marketing_emails_enabled=True
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    print(f"   ✓ User created with ID: {test_user.id}")
    
    # Test 2: Verify GDPR fields are set correctly
    print("\nTest 2: Verifying GDPR fields...")
    assert test_user.last_login_at is not None, "last_login_at should be set"
    assert test_user.privacy_policy_version == "1.0", "privacy_policy_version should be '1.0'"
    assert test_user.terms_version == "1.0", "terms_version should be '1.0'"
    assert test_user.marketing_emails_enabled == True, "marketing_emails_enabled should be True"
    assert test_user.inactive_warning_sent_at is None, "inactive_warning_sent_at should be None initially"
    print("   ✓ All GDPR fields verified")
    
    # Test 3: Update GDPR fields
    print("\nTest 3: Updating GDPR fields...")
    test_user.inactive_warning_sent_at = datetime.utcnow()
    test_user.marketing_emails_enabled = False
    test_user.privacy_policy_version = "2.0"
    db.commit()
    db.refresh(test_user)
    assert test_user.inactive_warning_sent_at is not None, "inactive_warning_sent_at should be set"
    assert test_user.marketing_emails_enabled == False, "marketing_emails_enabled should be False"
    assert test_user.privacy_policy_version == "2.0", "privacy_policy_version should be '2.0'"
    print("   ✓ GDPR fields updated successfully")
    
    # Test 4: Query user by GDPR fields
    print("\nTest 4: Querying users by GDPR fields...")
    users_with_marketing = db.query(User).filter(User.marketing_emails_enabled == False).all()
    assert len(users_with_marketing) > 0, "Should find users with marketing disabled"
    print(f"   ✓ Found {len(users_with_marketing)} user(s) with marketing emails disabled")
    
    # Test 5: Default value for marketing_emails_enabled
    print("\nTest 5: Testing default value for marketing_emails_enabled...")
    test_email2 = f"gdpr_test_default_{datetime.now().timestamp()}@example.com"
    test_user2 = User(
        email=test_email2,
        hashed_password="$2b$12$test_hashed_password",  # Dummy hash for testing
        is_verified=True
    )
    db.add(test_user2)
    db.commit()
    db.refresh(test_user2)
    assert test_user2.marketing_emails_enabled == True, "marketing_emails_enabled should default to True"
    print("   ✓ Default value works correctly")
    
    # Cleanup
    print("\nCleaning up test users...")
    db.delete(test_user)
    db.delete(test_user2)
    db.commit()
    print("   ✓ Test users deleted")
    
    db.close()
    
    print("\n✅ All tests passed! GDPR fields are working correctly.\n")
    
except Exception as e:
    print(f"\n❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
