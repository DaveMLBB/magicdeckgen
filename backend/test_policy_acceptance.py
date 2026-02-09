#!/usr/bin/env python3
"""
Test script for PolicyAcceptance model.
Tests creating, querying, and managing policy acceptance records.
"""
import sys
from pathlib import Path
from datetime import datetime

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import PolicyAcceptance, User
import bcrypt

def test_policy_acceptance():
    """Test PolicyAcceptance model functionality"""
    db = SessionLocal()
    
    try:
        print("🧪 Testing PolicyAcceptance Model\n")
        
        # Create a test user
        print("1️⃣ Creating test user...")
        test_email = f"policy_test_{datetime.utcnow().timestamp()}@example.com"
        hashed_password = bcrypt.hashpw("testpass123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        test_user = User(
            email=test_email,
            hashed_password=hashed_password,
            is_verified=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"   ✅ Created user with ID: {test_user.id}")
        
        # Test 1: Create privacy policy acceptance
        print("\n2️⃣ Creating privacy policy acceptance...")
        privacy_acceptance = PolicyAcceptance(
            user_id=test_user.id,
            policy_type='privacy',
            policy_version='1.0',
            accepted_at=datetime.utcnow()
        )
        db.add(privacy_acceptance)
        db.commit()
        db.refresh(privacy_acceptance)
        print(f"   ✅ Created privacy policy acceptance with ID: {privacy_acceptance.id}")
        print(f"      - User ID: {privacy_acceptance.user_id}")
        print(f"      - Policy Type: {privacy_acceptance.policy_type}")
        print(f"      - Policy Version: {privacy_acceptance.policy_version}")
        print(f"      - Accepted At: {privacy_acceptance.accepted_at}")
        
        # Test 2: Create terms of service acceptance
        print("\n3️⃣ Creating terms of service acceptance...")
        terms_acceptance = PolicyAcceptance(
            user_id=test_user.id,
            policy_type='terms',
            policy_version='1.0',
            accepted_at=datetime.utcnow()
        )
        db.add(terms_acceptance)
        db.commit()
        db.refresh(terms_acceptance)
        print(f"   ✅ Created terms acceptance with ID: {terms_acceptance.id}")
        print(f"      - User ID: {terms_acceptance.user_id}")
        print(f"      - Policy Type: {terms_acceptance.policy_type}")
        print(f"      - Policy Version: {terms_acceptance.policy_version}")
        
        # Test 3: Query all acceptances for user
        print("\n4️⃣ Querying all policy acceptances for user...")
        acceptances = db.query(PolicyAcceptance).filter(
            PolicyAcceptance.user_id == test_user.id
        ).all()
        print(f"   ✅ Found {len(acceptances)} policy acceptances")
        for acceptance in acceptances:
            print(f"      - {acceptance.policy_type} v{acceptance.policy_version}")
        
        # Test 4: Query specific policy acceptance
        print("\n5️⃣ Querying specific policy acceptance (privacy v1.0)...")
        specific_acceptance = db.query(PolicyAcceptance).filter(
            PolicyAcceptance.user_id == test_user.id,
            PolicyAcceptance.policy_type == 'privacy',
            PolicyAcceptance.policy_version == '1.0'
        ).first()
        if specific_acceptance:
            print(f"   ✅ Found privacy policy v1.0 acceptance")
            print(f"      - Accepted at: {specific_acceptance.accepted_at}")
        else:
            print("   ❌ Privacy policy acceptance not found")
        
        # Test 5: Create new version acceptance
        print("\n6️⃣ Creating acceptance for updated privacy policy (v2.0)...")
        privacy_v2_acceptance = PolicyAcceptance(
            user_id=test_user.id,
            policy_type='privacy',
            policy_version='2.0',
            accepted_at=datetime.utcnow()
        )
        db.add(privacy_v2_acceptance)
        db.commit()
        print(f"   ✅ Created privacy policy v2.0 acceptance")
        
        # Test 6: Query latest version for each policy type
        print("\n7️⃣ Querying latest acceptance for each policy type...")
        from sqlalchemy import func
        
        # Get latest privacy policy acceptance
        latest_privacy = db.query(PolicyAcceptance).filter(
            PolicyAcceptance.user_id == test_user.id,
            PolicyAcceptance.policy_type == 'privacy'
        ).order_by(PolicyAcceptance.accepted_at.desc()).first()
        
        if latest_privacy:
            print(f"   ✅ Latest privacy policy: v{latest_privacy.policy_version}")
            print(f"      - Accepted at: {latest_privacy.accepted_at}")
        
        # Get latest terms acceptance
        latest_terms = db.query(PolicyAcceptance).filter(
            PolicyAcceptance.user_id == test_user.id,
            PolicyAcceptance.policy_type == 'terms'
        ).order_by(PolicyAcceptance.accepted_at.desc()).first()
        
        if latest_terms:
            print(f"   ✅ Latest terms of service: v{latest_terms.policy_version}")
            print(f"      - Accepted at: {latest_terms.accepted_at}")
        
        # Test 7: Test composite index query
        print("\n8️⃣ Testing composite index query performance...")
        result = db.query(PolicyAcceptance).filter(
            PolicyAcceptance.user_id == test_user.id,
            PolicyAcceptance.policy_type == 'privacy',
            PolicyAcceptance.policy_version == '2.0'
        ).first()
        if result:
            print(f"   ✅ Composite index query successful")
            print(f"      - Found acceptance for privacy v2.0")
        
        # Cleanup
        print("\n9️⃣ Cleaning up test data...")
        db.query(PolicyAcceptance).filter(PolicyAcceptance.user_id == test_user.id).delete()
        db.query(User).filter(User.id == test_user.id).delete()
        db.commit()
        print("   ✅ Test data cleaned up")
        
        print("\n✅ All PolicyAcceptance tests passed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = test_policy_acceptance()
    sys.exit(0 if success else 1)
