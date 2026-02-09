#!/usr/bin/env python3
"""
Migration script to add the policy_acceptances table for GDPR compliance.
This table tracks user acceptance of privacy policy and terms of service versions.
"""
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import engine, Base
from app.models import PolicyAcceptance

print("🔧 Adding policy_acceptances table to database for GDPR compliance\n")

try:
    # Create the policy_acceptances table
    PolicyAcceptance.__table__.create(engine, checkfirst=True)
    
    print("✅ Table created successfully!")
    print("   - policy_acceptances")
    print("\nTable structure:")
    print("   - id: Primary key")
    print("   - user_id: Foreign key to users (not null, indexed)")
    print("   - policy_type: Type of policy ('privacy' or 'terms', not null)")
    print("   - policy_version: Version string of the policy (not null)")
    print("   - accepted_at: DateTime when user accepted the policy")
    print("\nIndexes:")
    print("   - idx_user_policy: Composite index on (user_id, policy_type, policy_version)")
    print()
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
