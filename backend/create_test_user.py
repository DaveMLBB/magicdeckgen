#!/usr/bin/env python3
"""
Crea un utente di test già verificato
"""
import sys
import os
from pathlib import Path
import bcrypt

# Cambia directory al backend
backend_dir = Path(__file__).parent
os.chdir(backend_dir)

# Aggiungi il path del backend
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models import User

def create_test_user():
    """Crea utente di test"""
    db = SessionLocal()
    
    try:
        # Verifica se esiste già
        existing = db.query(User).filter(User.email == "test@example.com").first()
        if existing:
            # Elimina l'utente esistente per ricrearlo
            db.delete(existing)
            db.commit()
            print("🗑️  Utente test esistente eliminato")
        
        # Genera hash della password "test123"
        password = "test123"
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        test_user = User(
            email="test@example.com",
            hashed_password=hashed_password,
            is_verified=True,  # Già verificato
            verification_token=None,
            subscription_type='free',
            uploads_count=0,
            uploads_limit=3
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print("✅ Utente test creato con successo!")
        print(f"   Email: test@example.com")
        print(f"   Password: test123")
        print(f"   ID: {test_user.id}")
        print(f"   Verificato: {test_user.is_verified}")
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🃏 Creazione utente test\n")
    create_test_user()
