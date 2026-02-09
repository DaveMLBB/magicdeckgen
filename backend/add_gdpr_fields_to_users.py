#!/usr/bin/env python3
"""
Migration script to add GDPR-related fields to the users table.
These fields support data retention policies and user preferences.
"""
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import engine
from sqlalchemy import text

print("🔧 Adding GDPR fields to users table\n")

try:
    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text("PRAGMA table_info(users)"))
        existing_columns = {row[1] for row in result}
        
        columns_to_add = []
        
        if 'last_login_at' not in existing_columns:
            columns_to_add.append(('last_login_at', 'DATETIME'))
        
        if 'inactive_warning_sent_at' not in existing_columns:
            columns_to_add.append(('inactive_warning_sent_at', 'DATETIME'))
        
        if 'privacy_policy_version' not in existing_columns:
            columns_to_add.append(('privacy_policy_version', 'VARCHAR'))
        
        if 'terms_version' not in existing_columns:
            columns_to_add.append(('terms_version', 'VARCHAR'))
        
        if 'marketing_emails_enabled' not in existing_columns:
            columns_to_add.append(('marketing_emails_enabled', 'BOOLEAN DEFAULT 1'))
        
        if not columns_to_add:
            print("✅ All GDPR fields already exist in users table!")
        else:
            # Add each column
            for column_name, column_type in columns_to_add:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
                print(f"   ✓ Added column: {column_name}")
            
            conn.commit()
            print("\n✅ GDPR fields added successfully!")
        
        print("\nGDPR fields in users table:")
        print("   - last_login_at: DateTime - Tracks last user login for inactivity detection")
        print("   - inactive_warning_sent_at: DateTime - Tracks when inactivity warning was sent")
        print("   - privacy_policy_version: String - Version of privacy policy user accepted")
        print("   - terms_version: String - Version of terms of service user accepted")
        print("   - marketing_emails_enabled: Boolean - User preference for marketing emails (default: True)")
        print()
        print("These fields support:")
        print("   - Requirement 8.2: Inactive account cleanup (3 years)")
        print("   - Requirement 14.2: Email communication preferences")
        print()
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
