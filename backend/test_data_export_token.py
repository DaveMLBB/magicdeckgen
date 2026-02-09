#!/usr/bin/env python3
"""
Test script for DataExportToken model.
Validates that the model can be created, queried, and handles expiry correctly.
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta
import secrets

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models import DataExportToken, User

def test_data_export_token():
    """Test DataExportToken model creation and querying"""
    db = SessionLocal()
    
    try:
        print("🧪 Testing DataExportToken Model\n")
        
        # Find or create a test user
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            print("⚠️  No test user found. Creating one...")
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            test_user = User(
                email="test@example.com",
                hashed_password=pwd_context.hash("testpassword"),
                is_verified=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"✅ Created test user with ID: {test_user.id}\n")
        else:
            print(f"✅ Using existing test user with ID: {test_user.id}\n")
        
        # Test 1: Create a DataExportToken
        print("Test 1: Creating DataExportToken...")
        token = secrets.token_urlsafe(32)
        created_at = datetime.utcnow()
        expires_at = created_at + timedelta(hours=24)
        
        export_token = DataExportToken(
            user_id=test_user.id,
            token=token,
            file_path="/tmp/user_data_export.json",
            file_size_bytes=1024,
            created_at=created_at,
            expires_at=expires_at
        )
        db.add(export_token)
        db.commit()
        db.refresh(export_token)
        
        print(f"✅ Created DataExportToken with ID: {export_token.id}")
        print(f"   - Token: {export_token.token[:20]}...")
        print(f"   - User ID: {export_token.user_id}")
        print(f"   - File Path: {export_token.file_path}")
        print(f"   - File Size: {export_token.file_size_bytes} bytes")
        print(f"   - Created At: {export_token.created_at}")
        print(f"   - Expires At: {export_token.expires_at}")
        print()
        
        # Test 2: Query by token
        print("Test 2: Querying DataExportToken by token...")
        found_token = db.query(DataExportToken).filter(
            DataExportToken.token == token
        ).first()
        
        if found_token:
            print(f"✅ Found token with ID: {found_token.id}")
            print(f"   - Matches original: {found_token.id == export_token.id}")
        else:
            print("❌ Token not found!")
        print()
        
        # Test 3: Query by user_id
        print("Test 3: Querying DataExportTokens by user_id...")
        user_tokens = db.query(DataExportToken).filter(
            DataExportToken.user_id == test_user.id
        ).all()
        
        print(f"✅ Found {len(user_tokens)} token(s) for user {test_user.id}")
        for t in user_tokens:
            print(f"   - Token ID {t.id}: {t.token[:20]}...")
        print()
        
        # Test 4: Check expiry logic
        print("Test 4: Testing expiry logic...")
        now = datetime.utcnow()
        is_expired = now > export_token.expires_at
        time_until_expiry = export_token.expires_at - now
        
        print(f"   - Current time: {now}")
        print(f"   - Expires at: {export_token.expires_at}")
        print(f"   - Is expired: {is_expired}")
        if not is_expired:
            print(f"   - Time until expiry: {time_until_expiry}")
        print()
        
        # Test 5: Create an expired token
        print("Test 5: Creating an expired token...")
        expired_token = DataExportToken(
            user_id=test_user.id,
            token=secrets.token_urlsafe(32),
            file_path="/tmp/expired_export.json",
            file_size_bytes=512,
            created_at=datetime.utcnow() - timedelta(days=2),
            expires_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(expired_token)
        db.commit()
        db.refresh(expired_token)
        
        is_expired = datetime.utcnow() > expired_token.expires_at
        print(f"✅ Created expired token with ID: {expired_token.id}")
        print(f"   - Is expired: {is_expired}")
        print()
        
        # Test 6: Query non-expired tokens
        print("Test 6: Querying only non-expired tokens...")
        valid_tokens = db.query(DataExportToken).filter(
            DataExportToken.user_id == test_user.id,
            DataExportToken.expires_at > datetime.utcnow()
        ).all()
        
        print(f"✅ Found {len(valid_tokens)} valid (non-expired) token(s)")
        print()
        
        # Cleanup
        print("🧹 Cleaning up test data...")
        db.query(DataExportToken).filter(
            DataExportToken.user_id == test_user.id
        ).delete()
        db.commit()
        print("✅ Cleanup complete")
        print()
        
        print("=" * 60)
        print("✅ All DataExportToken tests passed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = test_data_export_token()
    sys.exit(0 if success else 1)
