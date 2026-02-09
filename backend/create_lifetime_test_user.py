#!/usr/bin/env python3
"""
Script per creare un utente di test con piano lifetime
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
from datetime import datetime

# Verifica percorso database
db_path = backend_dir / 'data' / 'magic.db'
print(f"🔍 Database path: {db_path}")
print(f"🔍 Current working directory: {os.getcwd()}")

def create_lifetime_user():
    db = SessionLocal()
    
    try:
        print("🃏 Creazione utente lifetime test\n")
        
        # Verifica se l'utente esiste già
        existing_user = db.query(User).filter(User.email == "lifetime@example.com").first()
        if existing_user:
            print("⚠️  Utente lifetime@example.com già esistente. Eliminazione...")
            db.delete(existing_user)
            db.commit()
        
        # Hash della password
        password = "lifetime123"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Crea nuovo utente con piano lifetime
        # Piano lifetime: nessuna scadenza (None), limiti illimitati
        user = User(
            email="lifetime@example.com",
            hashed_password=hashed.decode('utf-8'),
            is_verified=True,
            subscription_type='lifetime',
            subscription_expires_at=None,  # Nessuna scadenza per lifetime
            uploads_count=0,
            uploads_limit=999999,  # Praticamente illimitato
            searches_count=0,
            searches_limit=999999  # Praticamente illimitato
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print("✅ Utente lifetime creato con successo!")
        print(f"   Email: lifetime@example.com")
        print(f"   Password: lifetime123")
        print(f"   ID: {user.id}")
        print(f"   Verificato: {user.is_verified}")
        print(f"   Piano: {user.subscription_type}")
        print(f"   Caricamenti: {user.uploads_count}/{user.uploads_limit}")
        print(f"   Ricerche: {user.searches_count}/{user.searches_limit}")
        print(f"   Scadenza: Nessuna (Lifetime)")
        print()
        print("🎉 L'utente ha accesso illimitato a tutte le funzionalità!")
        print()
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_lifetime_user()
