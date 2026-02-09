#!/usr/bin/env python3
"""
Test script to verify the DeletionRequest model works correctly.
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta
import secrets

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models import DeletionRequest, User
from sqlalchemy.exc import IntegrityError

print("🧪 Testing DeletionRequest model\n")

db = SessionLocal()

try:
    # Test 1: Create a test user if not exists
    print("Test 1: Creating test user...")
    test_user = db.query(User).filter(User.email == "deletion_test@example.com").first()
    if not test_user:
        test_user = User(
            email="deletion_test@example.com",
            hashed_password="test_hash",
            is_verified=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"✅ Test user created with ID: {test_user.id}")
    else:
        print(f"✅ Test user already exists with ID: {test_user.id}")
    
    # Clean up any existing deletion requests for this user
    existing_request = db.query(DeletionRequest).filter(
        DeletionRequest.user_id == test_user.id
    ).first()
    if existing_request:
        db.delete(existing_request)
        db.commit()
        print("   Cleaned up existing deletion request")
    
    # Test 2: Create a deletion request
    print("\nTest 2: Creating deletion request...")
    requested_at = datetime.utcnow()
    scheduled_for = requested_at + timedelta(days=7)
    cancellation_token = secrets.token_urlsafe(32)
    
    deletion_request = DeletionRequest(
        user_id=test_user.id,
        requested_at=requested_at,
        scheduled_for=scheduled_for,
        cancellation_token=cancellation_token,
        status='pending'
    )
    db.add(deletion_request)
    db.commit()
    db.refresh(deletion_request)
    print(f"✅ Deletion request created with ID: {deletion_request.id}")
    print(f"   User ID: {deletion_request.user_id}")
    print(f"   Requested at: {deletion_request.requested_at}")
    print(f"   Scheduled for: {deletion_request.scheduled_for}")
    print(f"   Status: {deletion_request.status}")
    print(f"   Cancellation token: {deletion_request.cancellation_token[:20]}...")
    
    # Test 3: Query the deletion request
    print("\nTest 3: Querying deletion request...")
    found_request = db.query(DeletionRequest).filter(
        DeletionRequest.user_id == test_user.id
    ).first()
    assert found_request is not None, "Deletion request not found"
    assert found_request.status == 'pending', "Status should be pending"
    assert found_request.cancelled_at is None, "cancelled_at should be None"
    assert found_request.completed_at is None, "completed_at should be None"
    print("✅ Deletion request queried successfully")
    
    # Test 4: Update status to cancelled
    print("\nTest 4: Cancelling deletion request...")
    found_request.status = 'cancelled'
    found_request.cancelled_at = datetime.utcnow()
    db.commit()
    db.refresh(found_request)
    assert found_request.status == 'cancelled', "Status should be cancelled"
    assert found_request.cancelled_at is not None, "cancelled_at should be set"
    print("✅ Deletion request cancelled successfully")
    print(f"   Status: {found_request.status}")
    print(f"   Cancelled at: {found_request.cancelled_at}")
    
    # Test 5: Test unique constraint on user_id
    print("\nTest 5: Testing unique constraint on user_id...")
    try:
        duplicate_request = DeletionRequest(
            user_id=test_user.id,
            requested_at=datetime.utcnow(),
            scheduled_for=datetime.utcnow() + timedelta(days=7),
            cancellation_token=secrets.token_urlsafe(32),
            status='pending'
        )
        db.add(duplicate_request)
        db.commit()
        print("❌ Should have raised IntegrityError for duplicate user_id")
    except IntegrityError:
        db.rollback()
        print("✅ Unique constraint on user_id working correctly")
    
    # Test 6: Test unique constraint on cancellation_token
    print("\nTest 6: Testing unique constraint on cancellation_token...")
    # First, delete the existing request
    db.delete(found_request)
    db.commit()
    
    # Create two requests with the same token
    token = secrets.token_urlsafe(32)
    request1 = DeletionRequest(
        user_id=test_user.id,
        requested_at=datetime.utcnow(),
        scheduled_for=datetime.utcnow() + timedelta(days=7),
        cancellation_token=token,
        status='pending'
    )
    db.add(request1)
    db.commit()
    
    # Create another user for the second request
    test_user2 = User(
        email="deletion_test2@example.com",
        hashed_password="test_hash",
        is_verified=True
    )
    db.add(test_user2)
    db.commit()
    db.refresh(test_user2)
    
    try:
        request2 = DeletionRequest(
            user_id=test_user2.id,
            requested_at=datetime.utcnow(),
            scheduled_for=datetime.utcnow() + timedelta(days=7),
            cancellation_token=token,  # Same token
            status='pending'
        )
        db.add(request2)
        db.commit()
        print("❌ Should have raised IntegrityError for duplicate cancellation_token")
    except IntegrityError:
        db.rollback()
        print("✅ Unique constraint on cancellation_token working correctly")
    
    # Cleanup
    print("\nCleaning up test data...")
    db.query(DeletionRequest).filter(DeletionRequest.user_id == test_user.id).delete()
    db.query(User).filter(User.email == "deletion_test@example.com").delete()
    db.query(User).filter(User.email == "deletion_test2@example.com").delete()
    db.commit()
    print("✅ Test data cleaned up")
    
    print("\n🎉 All tests passed!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    db.close()
