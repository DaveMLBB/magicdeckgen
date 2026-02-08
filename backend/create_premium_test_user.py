#!/usr/bin/env python3
"""
Script per creare un utente di test con piano premium (monthly_10)
"""
import sys
import os
from pathlib import Path

# Aggiungi la directory backend al path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal, engine, Base
from app.models import User
import bcrypt
from datetime import datetime, timedelta

# Verifica percorso database
db_path = backend_dir / 'data' / 'magic.db'
print(f"🔍 Database path: {db_path}")
print(f"🔍 Current working directory: {os.getcwd()}")

def create_premium_user():
    db = SessionLocal()
    
    try:
        print("🃏 Creazione utente premium test\n")
        
        # Verifica se l'utente esiste già
        existing_user = db.query(User).filter(User.email == "premium@example.com").first()
        if existing_user:
            print("⚠️  Utente premium@example.com già esistente. Eliminazione...")
            db.delete(existing_user)
            db.commit()
        
        # Hash della password
        password = "premium123"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Calcola data di scadenza (30 giorni da oggi)
        expires_at = datetime.utcnow() + timedelta(days=30)
        
        # Crea nuovo utente con piano monthly_10
        user = User(
            email="premium@example.com",
            hashed_password=hashed.decode('utf-8'),
            is_verified=True,
            subscription_type='monthly_10',
            subscription_expires_at=expires_at,
            uploads_count=0,
            uploads_limit=10
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print("✅ Utente premium creato con successo!")
        print(f"   Email: premium@example.com")
        print(f"   Password: premium123")
        print(f"   ID: {user.id}")
        print(f"   Verificato: {user.is_verified}")
        print(f"   Piano: {user.subscription_type}")
        print(f"   Caricamenti: {user.uploads_count}/{user.uploads_limit}")
        print(f"   Scadenza: {user.subscription_expires_at.strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_premium_user()
