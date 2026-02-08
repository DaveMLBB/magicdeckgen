#!/usr/bin/env python3
"""
Aggiunge i campi searches_count e searches_limit alla tabella users
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "magic.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Aggiungi colonna searches_count
        cursor.execute("ALTER TABLE users ADD COLUMN searches_count INTEGER DEFAULT 0")
        print("✅ Aggiunta colonna searches_count")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️  Colonna searches_count già esistente")
        else:
            raise
    
    try:
        # Aggiungi colonna searches_limit
        cursor.execute("ALTER TABLE users ADD COLUMN searches_limit INTEGER DEFAULT 10")
        print("✅ Aggiunta colonna searches_limit")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️  Colonna searches_limit già esistente")
        else:
            raise
    
    # Imposta i limiti corretti in base al subscription_type
    cursor.execute("""
        UPDATE users 
        SET searches_limit = CASE subscription_type
            WHEN 'free' THEN 10
            WHEN 'monthly_10' THEN 20
            WHEN 'monthly_30' THEN 30
            WHEN 'yearly' THEN 999999
            WHEN 'lifetime' THEN 999999
            ELSE 10
        END
    """)
    
    conn.commit()
    print("✅ Limiti ricerca aggiornati in base al piano")
    
    conn.close()
    print("\n✅ Migrazione completata!")

if __name__ == "__main__":
    migrate()
