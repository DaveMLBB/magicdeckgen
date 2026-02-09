#!/usr/bin/env python3
"""
Migration script to add the deletion_requests table for GDPR compliance.
This table stores account deletion requests with a 7-day grace period.
"""
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import engine, Base
from app.models import DeletionRequest

print("🔧 Adding deletion_requests table to database for GDPR compliance\n")

try:
    # Create the deletion_requests table
    DeletionRequest.__table__.create(engine, checkfirst=True)
    
    print("✅ Table created successfully!")
    print("   - deletion_requests")
    print("\nTable structure:")
    print("   - id: Primary key")
    print("   - user_id: Foreign key to users (unique, not null)")
    print("   - requested_at: DateTime when deletion was requested")
    print("   - scheduled_for: DateTime when deletion will be executed (requested_at + 7 days)")
    print("   - cancellation_token: Unique token for cancelling the deletion")
    print("   - status: Status of the request (pending, cancelled, completed)")
    print("   - cancelled_at: DateTime when deletion was cancelled (nullable)")
    print("   - completed_at: DateTime when deletion was completed (nullable)")
    print()
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
