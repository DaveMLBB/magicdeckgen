"""
Migration: set uploads_limit and searches_limit to 999999 for all existing users.
The token system is now used for all rate-limiting; legacy counters are no longer enforced.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import User

def run():
    db = SessionLocal()
    try:
        updated = db.query(User).filter(
            (User.uploads_limit < 999999) | (User.searches_limit < 999999)
        ).update(
            {"uploads_limit": 999999, "searches_limit": 999999},
            synchronize_session=False
        )
        db.commit()
        print(f"✅ Updated {updated} users → uploads_limit=999999, searches_limit=999999")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run()
