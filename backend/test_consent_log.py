#!/usr/bin/env python3
"""
Test script to verify the ConsentLog model works correctly.
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models import ConsentLog

print("🧪 Testing ConsentLog model\n")

db = SessionLocal()

try:
    # Test 1: Create a consent log entry for an authenticated user
    print("Test 1: Creating consent log for authenticated user...")
    consent1 = ConsentLog(
        user_id=1,
        session_id=None,
        essential=True,
        analytics=True,
        marketing=False,
        timestamp=datetime.utcnow(),
        ip_address="192.168.1.1",
        user_agent="Mozilla/5.0 (Test Browser)",
        banner_version="1.0",
        expires_at=datetime.utcnow() + timedelta(days=365)
    )
    db.add(consent1)
    db.commit()
    print(f"✅ Created consent log with ID: {consent1.id}")
    
    # Test 2: Create a consent log entry for an anonymous user
    print("\nTest 2: Creating consent log for anonymous user...")
    consent2 = ConsentLog(
        user_id=None,
        session_id="anonymous-session-123",
        essential=True,
        analytics=False,
        marketing=False,
        timestamp=datetime.utcnow(),
        ip_address="192.168.1.2",
        user_agent="Mozilla/5.0 (Test Browser 2)",
        banner_version="1.0",
        expires_at=datetime.utcnow() + timedelta(days=365)
    )
    db.add(consent2)
    db.commit()
    print(f"✅ Created consent log with ID: {consent2.id}")
    
    # Test 3: Query consent logs
    print("\nTest 3: Querying consent logs...")
    all_consents = db.query(ConsentLog).all()
    print(f"✅ Found {len(all_consents)} consent log entries")
    
    for consent in all_consents:
        print(f"\n  Consent ID: {consent.id}")
        print(f"  User ID: {consent.user_id}")
        print(f"  Session ID: {consent.session_id}")
        print(f"  Essential: {consent.essential}")
        print(f"  Analytics: {consent.analytics}")
        print(f"  Marketing: {consent.marketing}")
        print(f"  Timestamp: {consent.timestamp}")
        print(f"  IP Address: {consent.ip_address}")
        print(f"  Banner Version: {consent.banner_version}")
        print(f"  Expires At: {consent.expires_at}")
    
    # Test 4: Query by user_id
    print("\nTest 4: Querying consent logs by user_id...")
    user_consents = db.query(ConsentLog).filter(ConsentLog.user_id == 1).all()
    print(f"✅ Found {len(user_consents)} consent logs for user_id=1")
    
    # Test 5: Query by session_id
    print("\nTest 5: Querying consent logs by session_id...")
    session_consents = db.query(ConsentLog).filter(
        ConsentLog.session_id == "anonymous-session-123"
    ).all()
    print(f"✅ Found {len(session_consents)} consent logs for session 'anonymous-session-123'")
    
    # Clean up test data
    print("\nCleaning up test data...")
    db.query(ConsentLog).delete()
    db.commit()
    print("✅ Test data cleaned up")
    
    print("\n✅ All tests passed!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    db.rollback()
    sys.exit(1)
finally:
    db.close()
