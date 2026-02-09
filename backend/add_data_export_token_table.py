#!/usr/bin/env python3
"""
Migration script to add the data_export_tokens table for GDPR compliance.
This table stores secure tokens for downloading user data exports with 24-hour expiry.
"""
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import engine, Base
from app.models import DataExportToken

print("🔧 Adding data_export_tokens table to database for GDPR compliance\n")

try:
    # Create the data_export_tokens table
    DataExportToken.__table__.create(engine, checkfirst=True)
    
    print("✅ Table created successfully!")
    print("   - data_export_tokens")
    print("\nTable structure:")
    print("   - id: Primary key")
    print("   - user_id: Foreign key to users (not null, indexed)")
    print("   - token: Unique secure token for download access (unique, not null, indexed)")
    print("   - file_path: Path to the exported data file (not null)")
    print("   - file_size_bytes: Size of the export file in bytes (not null)")
    print("   - created_at: DateTime when token was created")
    print("   - expires_at: DateTime when token expires (created_at + 24 hours)")
    print()
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
