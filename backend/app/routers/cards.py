from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, List, Optional
import pandas as pd
from io import BytesIO
from app.database import get_db
from app.models import Card

router = APIRouter()

class ColumnMapping(BaseModel):
    name: str
    quantity: str
    mana_cost: Optional[str] = None
    card_type: Optional[str] = None
    colors: Optional[str] = None
    rarity: Optional[str] = None

@router.post("/analyze/{user_id}")
async def analyze_file(user_id: str, file: UploadFile = File(...)):
    """Analizza il file e restituisce le colonne disponibili"""
    if not file.filename.endswith(('.xlsx', '.csv')):
        raise HTTPException(status_code=400, detail="Il file deve essere .xlsx o .csv")
    
    contents = await file.read()
    
    try:
        if file.filename.endswith('.xlsx'):
            df = pd.read_excel(BytesIO(contents))
        else:
            df = pd.read_csv(BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Errore nella lettura del file: {str(e)}")
    
    # Pulisci i nomi delle colonne (converti tutto a stringa e rimuovi spazi)
    df.columns = [str(col).strip() for col in df.columns]
    
    # Ottieni le colonne disponibili (escludi colonne vuote o unnamed)
    columns = [col for col in df.columns.tolist() if col and not col.startswith('Unnamed')]
    
    if not columns:
        raise HTTPException(status_code=400, detail="Nessuna colonna valida trovata nel file")
    
    # Prova a suggerire mapping automatico
    suggested_mapping = {}
    
    # Normalizza nomi colonne per il matching
    columns_lower = {col: col.lower().strip() for col in columns}
    
    # Mapping suggerito per nome
    name_keywords = ['name', 'nome', 'card', 'carta', 'card name']
    for col, col_lower in columns_lower.items():
        if any(keyword == col_lower or keyword in col_lower.split() for keyword in name_keywords):
            suggested_mapping['name'] = col
            break
    
    # Mapping suggerito per quantità
    qty_keywords = ['quantity', 'quantita', 'qty', 'qta', 'amount', 'count']
    for col, col_lower in columns_lower.items():
        if any(keyword == col_lower or keyword in col_lower.split() for keyword in qty_keywords):
            suggested_mapping['quantity'] = col
            break
    
    # Mapping suggerito per tipo
    type_keywords = ['type', 'tipo', 'card type', 'card_type']
    for col, col_lower in columns_lower.items():
        if any(keyword == col_lower or keyword in col_lower.split() for keyword in type_keywords):
            suggested_mapping['card_type'] = col
            break
    
    # Mapping suggerito per colori
    color_keywords = ['colors', 'colori', 'color', 'colore']
    for col, col_lower in columns_lower.items():
        if any(keyword == col_lower or keyword in col_lower.split() for keyword in color_keywords):
            suggested_mapping['colors'] = col
            break
    
    # Mapping suggerito per mana cost
    mana_keywords = ['mana', 'cost', 'costo', 'mana_cost', 'costo_mana']
    for col, col_lower in columns_lower.items():
        if any(keyword == col_lower or keyword in col_lower.split() for keyword in mana_keywords):
            suggested_mapping['mana_cost'] = col
            break
    
    # Mapping suggerito per rarità
    rarity_keywords = ['rarity', 'rarita', 'rarità']
    for col, col_lower in columns_lower.items():
        if any(keyword == col_lower or keyword in col_lower.split() for keyword in rarity_keywords):
            suggested_mapping['rarity'] = col
            break
    
    # Mostra preview dei dati (prime 5 righe) - converti tutto a stringa per evitare problemi JSON
    preview_df = df[columns].head(5)
    preview = []
    for _, row in preview_df.iterrows():
        preview_row = {}
        for col in columns:
            val = row[col]
            # Converti a stringa gestendo NaN
            if pd.isna(val):
                preview_row[col] = ''
            else:
                preview_row[col] = str(val)
        preview.append(preview_row)
    
    return {
        "columns": columns,
        "suggested_mapping": suggested_mapping,
        "preview": preview,
        "total_rows": len(df)
    }

@router.post("/upload/{user_id}")
async def upload_cards(
    user_id: str, 
    file: UploadFile = File(...), 
    mapping: str = Form(None),  # JSON string del mapping come Form data
    db: Session = Depends(get_db)
):
    """Carica carte da file Excel/CSV con mapping personalizzato"""
    if not file.filename.endswith(('.xlsx', '.csv')):
        raise HTTPException(status_code=400, detail="Il file deve essere .xlsx o .csv")
    
    contents = await file.read()
    
    try:
        if file.filename.endswith('.xlsx'):
            df = pd.read_excel(BytesIO(contents))
        else:
            df = pd.read_csv(BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Errore nella lettura del file: {str(e)}")
    
    # Parse mapping se fornito
    import json
    column_mapping = json.loads(mapping) if mapping else {}
    
    print(f"📋 Mapping ricevuto: {column_mapping}")
    print(f"📋 Colonne nel file: {df.columns.tolist()[:5]}")
    
    # Se non c'è mapping, usa quello automatico (vecchio comportamento)
    if not column_mapping:
        df.columns = df.columns.str.lower().str.strip()
        column_mapping = {
            'name': 'name',
            'quantity': 'quantity',
            'mana_cost': 'mana_cost',
            'card_type': 'type',
            'colors': 'colors',
            'rarity': 'rarity'
        }
    
    # Rimuovi carte esistenti dell'utente
    db.query(Card).filter(Card.user_id == user_id).delete()
    
    cards_added = 0
    errors = []
    
    for idx, row in df.iterrows():
        try:
            # Estrai valori usando il mapping
            name_col = column_mapping.get('name')
            if not name_col or name_col not in df.columns:
                if idx == 0:
                    print(f"❌ Colonna nome '{name_col}' non trovata in {df.columns.tolist()}")
                continue
                
            name = str(row[name_col]) if pd.notna(row[name_col]) else ''
            
            if not name or name == 'nan' or name.strip() == '':
                continue
            
            quantity_col = column_mapping.get('quantity')
            quantity_raw = row[quantity_col] if quantity_col and quantity_col in df.columns else 1
            
            # Gestisci float (1.0 -> 1)
            if pd.notna(quantity_raw):
                try:
                    quantity = int(float(quantity_raw))
                except:
                    quantity = 1
            else:
                quantity = 1
            
            mana_cost_col = column_mapping.get('mana_cost')
            mana_cost = str(row[mana_cost_col]) if mana_cost_col and mana_cost_col in df.columns and pd.notna(row[mana_cost_col]) else None
            
            type_col = column_mapping.get('card_type')
            card_type = str(row[type_col]) if type_col and type_col in df.columns and pd.notna(row[type_col]) else 'unknown'
            
            colors_col = column_mapping.get('colors')
            colors = str(row[colors_col]) if colors_col and colors_col in df.columns and pd.notna(row[colors_col]) else ''
            
            rarity_col = column_mapping.get('rarity')
            rarity = str(row[rarity_col]) if rarity_col and rarity_col in df.columns and pd.notna(row[rarity_col]) else None
            
            card = Card(
                name=name,
                mana_cost=mana_cost,
                card_type=card_type,
                colors=colors,
                rarity=rarity,
                quantity_owned=quantity,
                user_id=user_id
            )
            db.add(card)
            cards_added += 1
            
            if idx < 3:
                print(f"✓ Carta {idx+1}: {name} x{quantity}")
            
        except Exception as e:
            errors.append(f"Riga {idx + 1}: {str(e)}")
            if idx < 3:
                print(f"❌ Errore riga {idx+1}: {e}")
    
    db.commit()
    
    print(f"✅ Caricate {cards_added} carte su {len(df)} righe")
    
    return {
        "message": f"Caricate {cards_added} carte",
        "count": cards_added,
        "errors": errors[:10] if errors else []
    }

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
