#!/usr/bin/env python3
"""
Script per aggiornare il bonus di benvenuto da 10 a 100 token
Esegui questo script DOPO aver aggiornato il codice in produzione
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine, SessionLocal
from app.models import User, TokenTransaction
from datetime import datetime

def update_welcome_tokens():
    """
    Aggiorna gli utenti esistenti che hanno ancora solo 10 token (bonus vecchio)
    e non hanno mai acquistato token, dandogli 90 token extra per arrivare a 100
    """
    
    print("🎁 Aggiornamento Bonus di Benvenuto: 10 → 100 token")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Trova utenti con 10 token o meno che non hanno mai acquistato
        users = db.query(User).filter(User.tokens <= 10).all()
        
        updated_count = 0
        skipped_count = 0
        
        for user in users:
            # Verifica se l'utente ha mai acquistato token
            has_purchases = db.query(TokenTransaction).filter(
                TokenTransaction.user_id == user.id,
                TokenTransaction.action.in_(['purchase', 'stripe_payment'])
            ).first()
            
            if has_purchases:
                print(f"⏭️  Utente {user.email}: ha già acquistato token, skip")
                skipped_count += 1
                continue
            
            # Calcola quanti token aggiungere per arrivare a 100
            current_tokens = user.tokens
            tokens_to_add = 100 - current_tokens
            
            if tokens_to_add <= 0:
                print(f"⏭️  Utente {user.email}: ha già {current_tokens} token, skip")
                skipped_count += 1
                continue
            
            # Aggiorna i token
            user.tokens = 100
            
            # Crea transazione per tracciare l'aggiornamento
            transaction = TokenTransaction(
                user_id=user.id,
                amount=tokens_to_add,
                action='welcome_bonus_upgrade',
                description=f'🎉 Bonus di benvenuto aggiornato: +{tokens_to_add} token (da {current_tokens} a 100)'
            )
            db.add(transaction)
            
            print(f"✅ Utente {user.email}: {current_tokens} → 100 token (+{tokens_to_add})")
            updated_count += 1
        
        # Commit tutte le modifiche
        db.commit()
        
        print("\n" + "=" * 60)
        print(f"✨ Aggiornamento completato!")
        print(f"   ✅ Utenti aggiornati: {updated_count}")
        print(f"   ⏭️  Utenti saltati: {skipped_count}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Errore: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    print("\n⚠️  ATTENZIONE: Questo script aggiornerà il bonus di benvenuto")
    print("   per gli utenti esistenti che hanno ancora solo 10 token.")
    print("\nVuoi continuare? (y/n): ", end="")
    
    response = input().lower()
    if response == 'y':
        update_welcome_tokens()
    else:
        print("Operazione annullata.")
