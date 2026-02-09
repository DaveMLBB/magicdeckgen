#!/usr/bin/env python3
"""
Migration script to add the consent_logs table for GDPR compliance.
This table stores user cookie consent decisions and audit information.
"""
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import engine, Base
from app.models import ConsentLog

print("🔧 Adding consent_logs table to database for GDPR compliance\n")

try:
    # Create the consent_logs table
    ConsentLog.__table__.create(engine, checkfirst=True)
    
    print("✅ Table created successfully!")
    print("   - consent_logs")
    print("\nTable structure:")
    print("   - id: Primary key")
    print("   - user_id: Foreign key to users (nullable for anonymous users)")
    print("   - session_id: Session identifier for non-authenticated users")
    print("   - essential: Boolean (always true)")
    print("   - analytics: Boolean")
    print("   - marketing: Boolean")
    print("   - timestamp: DateTime of consent decision")
    print("   - ip_address: IP address at time of consent")
    print("   - user_agent: Browser user agent string")
    print("   - banner_version: Version of consent banner shown")
    print("   - expires_at: DateTime when consent expires (12 months)")
    print()
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
