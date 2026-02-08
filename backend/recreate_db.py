"""
Script per ricreare il database con lo schema aggiornato
"""
import os
from app.database import engine, Base
from app.models import User, Card, Deck, DeckTemplate, DeckTemplateCard, CardCollection

# Path del database
DB_PATH = "data/magic.db"

def recreate_database():
    # Rimuovi il database esistente se esiste
    if os.path.exists(DB_PATH):
        print(f"Rimozione database esistente: {DB_PATH}")
        os.remove(DB_PATH)
    
    # Crea tutte le tabelle con lo schema aggiornato
    print("Creazione nuovo database con schema aggiornato...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database ricreato con successo!")
    print("\nOra puoi eseguire create_test_user.py per creare un nuovo utente di test.")

if __name__ == "__main__":
    recreate_database()
