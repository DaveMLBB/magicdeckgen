#!/usr/bin/env python3
"""
Migration script to drop legacy deck tables (decks and deck_cards).
These tables are obsolete and have been replaced by saved_decks and saved_deck_cards.
"""
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.database import engine

print("🔧 Dropping legacy deck tables (decks and deck_cards)\n")

try:
    with engine.connect() as conn:
        # Drop deck_cards first (has FK to decks)
        print("Dropping deck_cards table...")
        conn.execute(text("DROP TABLE IF EXISTS deck_cards CASCADE"))
        conn.commit()
        print("✅ deck_cards dropped")
        
        # Drop decks table
        print("Dropping decks table...")
        conn.execute(text("DROP TABLE IF EXISTS decks CASCADE"))
        conn.commit()
        print("✅ decks dropped")
    
    print("\n✅ Migration completed successfully!")
    print("\nLegacy tables removed:")
    print("   - deck_cards")
    print("   - decks")
    print("\nActive tables for deck management:")
    print("   - saved_decks")
    print("   - saved_deck_cards")
    print("   - saved_deck_collections")
    
except Exception as e:
    print(f"\n❌ Migration failed: {e}")
    sys.exit(1)
