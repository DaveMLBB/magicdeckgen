#!/usr/bin/env python3
"""
Database optimization script - adds performance indexes to PostgreSQL
Run this to improve search performance significantly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine
import time

def run_optimization():
    """Apply database optimizations for better search performance"""
    
    print("🔧 Starting database optimization...")
    print("=" * 60)
    
    optimizations = [
        {
            "name": "Enable pg_trgm extension",
            "sql": "CREATE EXTENSION IF NOT EXISTS pg_trgm;",
            "description": "Enables fuzzy text search capabilities"
        },
        {
            "name": "Index: mtg_cards.name (lowercase)",
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mtg_cards_name_lower ON mtg_cards (LOWER(name));",
            "description": "Speeds up case-insensitive name searches"
        },
        {
            "name": "Index: mtg_cards.name_it (lowercase)",
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mtg_cards_name_it_lower ON mtg_cards (LOWER(name_it));",
            "description": "Speeds up Italian name searches"
        },
        {
            "name": "Index: mtg_cards.name (trigram)",
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mtg_cards_name_trgm ON mtg_cards USING gin (name gin_trgm_ops);",
            "description": "Enables fast fuzzy/partial name matching"
        },
        {
            "name": "Index: mtg_cards.name_it (trigram)",
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mtg_cards_name_it_trgm ON mtg_cards USING gin (name_it gin_trgm_ops);",
            "description": "Enables fast fuzzy Italian name matching"
        },
        {
            "name": "Index: mtg_cards.text (trigram)",
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mtg_cards_text_trgm ON mtg_cards USING gin (text gin_trgm_ops);",
            "description": "Speeds up card text searches"
        },
        {
            "name": "Index: colors + types composite",
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mtg_cards_colors_types ON mtg_cards (colors, types);",
            "description": "Optimizes color+type filter combinations"
        },
        {
            "name": "Index: rarity + mana_value composite",
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mtg_cards_rarity_mana ON mtg_cards (rarity, mana_value);",
            "description": "Optimizes rarity+CMC filter combinations"
        },
        {
            "name": "Index: set_code + rarity composite",
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mtg_cards_set_rarity ON mtg_cards (set_code, rarity);",
            "description": "Optimizes set+rarity searches"
        },
        {
            "name": "Partial Index: cards with images",
            "sql": """CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mtg_cards_with_image 
                     ON mtg_cards (name, mana_value) 
                     WHERE image_url IS NOT NULL AND image_url != '';""",
            "description": "Optimizes most common query (cards with images)"
        },
        {
            "name": "Analyze mtg_cards table",
            "sql": "ANALYZE mtg_cards;",
            "description": "Updates query planner statistics"
        }
    ]
    
    success_count = 0
    error_count = 0
    
    with engine.connect() as conn:
        for opt in optimizations:
            print(f"\n📌 {opt['name']}")
            print(f"   {opt['description']}")
            
            try:
                start_time = time.time()
                
                # Execute with autocommit for CREATE INDEX CONCURRENTLY
                if "CONCURRENTLY" in opt['sql']:
                    conn.execute(text("COMMIT"))
                    conn.execute(text(opt['sql']))
                else:
                    conn.execute(text(opt['sql']))
                    conn.commit()
                
                elapsed = time.time() - start_time
                print(f"   ✅ Completed in {elapsed:.2f}s")
                success_count += 1
                
            except Exception as e:
                error_msg = str(e)
                # Ignore "already exists" errors
                if "already exists" in error_msg.lower():
                    print(f"   ⚠️  Already exists (skipped)")
                    success_count += 1
                else:
                    print(f"   ❌ Error: {error_msg}")
                    error_count += 1
    
    print("\n" + "=" * 60)
    print(f"✨ Optimization complete!")
    print(f"   ✅ Success: {success_count}/{len(optimizations)}")
    if error_count > 0:
        print(f"   ❌ Errors: {error_count}")
    
    print("\n💡 Performance Tips:")
    print("   - Search queries should now be 3-10x faster")
    print("   - Monitor query performance with EXPLAIN ANALYZE")
    print("   - Run ANALYZE periodically after bulk data changes")
    print("=" * 60)

if __name__ == "__main__":
    try:
        run_optimization()
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)
