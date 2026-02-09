#!/usr/bin/env python3
"""
Script per aggiungere le tabelle saved_decks e saved_deck_cards al database
"""
import sys
from pathlib import Path

# Aggiungi la directory backend al path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import engine, Base
from app.models import SavedDeck, SavedDeckCard

print("🔧 Aggiunta tabelle saved_decks al database\n")

try:
    # Crea solo le nuove tabelle
    SavedDeck.__table__.create(engine, checkfirst=True)
    SavedDeckCard.__table__.create(engine, checkfirst=True)
    
    print("✅ Tabelle create con successo!")
    print("   - saved_decks")
    print("   - saved_deck_cards")
    print()
    
except Exception as e:
    print(f"❌ Errore: {e}")
