"""
Migration script: Add tokens column to users table and create token_transactions table.
Run this after updating models.py but before starting the backend.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.connect() as conn:
        # 1. Add tokens column to users if not exists
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN tokens INTEGER DEFAULT 0"))
            conn.commit()
            print("✅ Added 'tokens' column to users table")
        except Exception as e:
            conn.rollback()
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print("ℹ️  'tokens' column already exists")
            else:
                print(f"⚠️  Error adding tokens column: {e}")
        
        # 2. Create token_transactions table if not exists
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS token_transactions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    amount INTEGER NOT NULL,
                    action VARCHAR NOT NULL,
                    description VARCHAR,
                    stripe_session_id VARCHAR,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_token_transactions_user_id ON token_transactions(user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_token_transactions_id ON token_transactions(id)"))
            conn.commit()
            print("✅ Created 'token_transactions' table")
        except Exception as e:
            conn.rollback()
            print(f"⚠️  Error creating token_transactions table: {e}")
        
        # 3. Give existing users some free tokens based on their old plan
        try:
            # Give 5 free tokens to all existing users who have 0 tokens
            result = conn.execute(text("""
                UPDATE users SET tokens = 5 WHERE tokens = 0 OR tokens IS NULL
            """))
            conn.commit()
            print(f"✅ Gave 5 free tokens to {result.rowcount} existing users")
        except Exception as e:
            conn.rollback()
            print(f"⚠️  Error giving free tokens: {e}")
        
        print("\n🎉 Migration complete!")

if __name__ == "__main__":
    migrate()
