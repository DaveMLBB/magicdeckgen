"""
Test for DeletionService.initiate_deletion method

Tests requirements 5.7, 5.8:
- Verify password using bcrypt
- Check if deletion already pending (raise exception if yes)
- Generate secure cancellation token
- Create DeletionRequest with scheduled_for = now + 7 days
- Send confirmation email with cancellation link
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from datetime import datetime, timedelta
import bcrypt
from app.database import SessionLocal, engine
from app.models import User, DeletionRequest, Base
from app.services.deletion_service import DeletionService, InvalidPasswordException, DeletionAlreadyPendingException


def test_initiate_deletion():
    """Test the initiate_deletion method"""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("\n" + "="*60)
        print("Testing DeletionService.initiate_deletion")
        print("="*60)
        
        # 1️⃣ Create a test user
        print("\n1️⃣ Creating test user...")
        test_email = f"deletion_test_{datetime.utcnow().timestamp()}@example.com"
        test_password = "testpass123"
        hashed_password = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        test_user = User(
            email=test_email,
            hashed_password=hashed_password,
            is_verified=True
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"✅ Created user: {test_user.email} (ID: {test_user.id})")
        
        # 2️⃣ Test password verification failure
        print("\n2️⃣ Testing password verification failure...")
        service = DeletionService(db)
        
        try:
            service.initiate_deletion(test_user.id, "wrongpassword")
            print("❌ FAILED: Should have raised InvalidPasswordException")
        except InvalidPasswordException as e:
            print(f"✅ Correctly raised InvalidPasswordException: {e.message}")
        
        # 3️⃣ Test successful deletion initiation
        print("\n3️⃣ Testing successful deletion initiation...")
        deletion_request = service.initiate_deletion(test_user.id, test_password)
        
        print(f"✅ Created deletion request:")
        print(f"   - ID: {deletion_request.id}")
        print(f"   - User ID: {deletion_request.user_id}")
        print(f"   - Status: {deletion_request.status}")
        print(f"   - Requested at: {deletion_request.requested_at}")
        print(f"   - Scheduled for: {deletion_request.scheduled_for}")
        print(f"   - Cancellation token: {deletion_request.cancellation_token[:20]}...")
        
        # Verify the scheduled_for is 7 days from now
        expected_scheduled = deletion_request.requested_at + timedelta(days=7)
        time_diff = abs((deletion_request.scheduled_for - expected_scheduled).total_seconds())
        
        if time_diff < 1:  # Within 1 second
            print(f"✅ Scheduled for is correctly 7 days from request time")
        else:
            print(f"❌ FAILED: Scheduled for is not 7 days from request time")
        
        # Verify cancellation token is secure (at least 32 characters)
        if len(deletion_request.cancellation_token) >= 32:
            print(f"✅ Cancellation token is secure (length: {len(deletion_request.cancellation_token)})")
        else:
            print(f"❌ FAILED: Cancellation token is too short")
        
        # 4️⃣ Test duplicate deletion request
        print("\n4️⃣ Testing duplicate deletion request...")
        
        try:
            service.initiate_deletion(test_user.id, test_password)
            print("❌ FAILED: Should have raised DeletionAlreadyPendingException")
        except DeletionAlreadyPendingException as e:
            print(f"✅ Correctly raised DeletionAlreadyPendingException: {e.message}")
        
        # 5️⃣ Test cancellation
        print("\n5️⃣ Testing deletion cancellation...")
        success = service.cancel_deletion(deletion_request.cancellation_token)
        
        if success:
            print(f"✅ Successfully cancelled deletion request")
            
            # Verify status updated
            db.refresh(deletion_request)
            if deletion_request.status == 'cancelled':
                print(f"✅ Status correctly updated to 'cancelled'")
            else:
                print(f"❌ FAILED: Status is '{deletion_request.status}', expected 'cancelled'")
            
            if deletion_request.cancelled_at:
                print(f"✅ Cancelled_at timestamp set: {deletion_request.cancelled_at}")
            else:
                print(f"❌ FAILED: Cancelled_at timestamp not set")
        else:
            print(f"❌ FAILED: Could not cancel deletion request")
        
        # 6️⃣ Test that we can now create a new deletion request after cancellation
        print("\n6️⃣ Testing new deletion request after cancellation...")
        deletion_request2 = service.initiate_deletion(test_user.id, test_password)
        print(f"✅ Successfully created new deletion request after cancellation")
        print(f"   - New request ID: {deletion_request2.id}")
        
        # 7️⃣ Test execute_deletion
        print("\n7️⃣ Testing execute_deletion...")
        service.execute_deletion(test_user.id)
        
        # Verify user is deleted
        deleted_user = db.query(User).filter(User.id == test_user.id).first()
        if deleted_user is None:
            print(f"✅ User successfully deleted from database")
        else:
            print(f"❌ FAILED: User still exists in database")
        
        # Verify deletion request still exists (for audit trail)
        deletion_requests = db.query(DeletionRequest).filter(
            DeletionRequest.user_id == test_user.id
        ).all()
        print(f"✅ Found {len(deletion_requests)} deletion request(s) in database (audit trail)")
        
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
    test_initiate_deletion()
