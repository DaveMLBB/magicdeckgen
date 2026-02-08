from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
from io import BytesIO
from app.database import get_db
from app.models import Card

router = APIRouter()

@router.post("/upload/{user_id}")
async def upload_cards(user_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Carica carte da file Excel (.xlsx)"""
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Il file deve essere .xlsx")
    
    contents = await file.read()
    df = pd.read_excel(BytesIO(contents))
    
    # Normalizza nomi colonne
    df.columns = df.columns.str.lower().str.strip()
    
    # Rimuovi carte esistenti dell'utente
    db.query(Card).filter(Card.user_id == user_id).delete()
    
    cards_added = 0
    for _, row in df.iterrows():
        card = Card(
            name=str(row.get('name', row.get('nome', ''))),
            mana_cost=str(row.get('mana_cost', row.get('costo_mana', ''))) if pd.notna(row.get('mana_cost', row.get('costo_mana', ''))) else None,
            card_type=str(row.get('type', row.get('tipo', 'unknown'))),
            colors=str(row.get('colors', row.get('colori', ''))),
            rarity=str(row.get('rarity', row.get('rarita', ''))) if pd.notna(row.get('rarity', row.get('rarita', ''))) else None,
            quantity_owned=int(row.get('quantity', row.get('quantita', 1))) if pd.notna(row.get('quantity', row.get('quantita', 1))) else 1,
            user_id=user_id
        )
        db.add(card)
        cards_added += 1
    
    db.commit()
    return {"message": f"Caricate {cards_added} carte", "count": cards_added}

@router.get("/{user_id}")
def get_user_cards(user_id: str, db: Session = Depends(get_db)):
    """Ottieni tutte le carte di un utente"""
    cards = db.query(Card).filter(Card.user_id == user_id).all()
    return cards

@router.delete("/{user_id}")
def delete_user_cards(user_id: str, db: Session = Depends(get_db)):
    """Elimina tutte le carte di un utente"""
    deleted = db.query(Card).filter(Card.user_id == user_id).delete()
    db.commit()
    return {"deleted": deleted}

@router.post("/add/{user_id}")
def add_card(user_id: str, card_data: dict, db: Session = Depends(get_db)):
    """Aggiungi una singola carta"""
    card = Card(
        name=card_data.get('name'),
        mana_cost=card_data.get('mana_cost'),
        card_type=card_data.get('card_type'),
        colors=card_data.get('colors'),
        rarity=card_data.get('rarity'),
        quantity_owned=card_data.get('quantity_owned', 1),
        user_id=user_id
    )
    db.add(card)
    db.commit()
    return {"message": "Carta aggiunta"}
