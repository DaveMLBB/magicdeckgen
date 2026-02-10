from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Dict, List, Optional
import pandas as pd
from io import BytesIO
from app.database import get_db
from app.models import Card, User

router = APIRouter()

# Terre base da normalizzare
BASIC_LANDS = {
    'plains': 'Plains',
    'island': 'Island', 
    'swamp': 'Swamp',
    'mountain': 'Mountain',
    'forest': 'Forest'
}

def normalize_card_name(name: str) -> str:
    """
    Normalizza il nome della carta, specialmente per le terre base.
    Esempi:
    - "Mountain v1" -> "Mountain"
    - "Mountain (V1)" -> "Mountain"
    - "Forest - Full Art" -> "Forest"
    - "Plains [Dominaria]" -> "Plains"
    """
    if not name:
        return name
    
    name_lower = name.lower().strip()
    
    # Controlla se contiene una terra base
    for basic_land_key, basic_land_name in BASIC_LANDS.items():
        if basic_land_key in name_lower:
            # Se il nome inizia con la terra base, normalizzalo
            if name_lower.startswith(basic_land_key):
                return basic_land_name
            # Se contiene la parola completa (non parte di un'altra parola)
            # es: "Snow-Covered Mountain" non deve diventare "Mountain"
            words = name_lower.replace('-', ' ').replace('(', ' ').replace(')', ' ').split()
            if basic_land_key in words:
                return basic_land_name
    
    return name

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
    print(f"📁 Analisi file: {file.filename}")
    
    if not file.filename.endswith(('.xlsx', '.csv')):
        error_msg = f"Il file deve essere .xlsx o .csv (ricevuto: {file.filename})"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    
    contents = await file.read()
    print(f"📊 Dimensione file: {len(contents)} bytes")
    
    try:
        if file.filename.endswith('.xlsx'):
            df = pd.read_excel(BytesIO(contents))
        else:
            # Decodifica il contenuto e gestisci diversi line endings
            try:
                text_content = contents.decode('utf-8')
            except:
                text_content = contents.decode('latin-1')
            
            # Normalizza line endings
            text_content = text_content.replace('\r\n', '\n').replace('\r', '\n')
            
            # Rimuovi righe di metadati che iniziano con #
            lines = [line for line in text_content.split('\n') if line.strip() and not line.startswith('#')]
            text_content = '\n'.join(lines)
            
            # Prova diversi metodi per CSV
            from io import StringIO
            import csv as csv_module
            
            try:
                # Prima prova: CSV con engine python e escape (per gestire backslash)
                df = pd.read_csv(StringIO(text_content), engine='python', escapechar='\\')
            except Exception as e1:
                print(f"⚠️  Tentativo 1 fallito: {e1}")
                try:
                    # Seconda prova: CSV standard
                    df = pd.read_csv(StringIO(text_content))
                except Exception as e2:
                    print(f"⚠️  Tentativo 2 fallito: {e2}")
                    try:
                        # Terza prova: CSV con separatore punto e virgola
                        df = pd.read_csv(StringIO(text_content), sep=';')
                    except Exception as e3:
                        print(f"⚠️  Tentativo 3 fallito: {e3}")
                        # Quarta prova: CSV con quoting NONE
                        df = pd.read_csv(
                            StringIO(text_content),
                            escapechar='\\',
                            quoting=csv_module.QUOTE_NONE,
                            on_bad_lines='skip',
                            engine='python'
                        )
        
        print(f"✅ File letto: {len(df)} righe, {len(df.columns)} colonne")
        print(f"📋 Colonne: {df.columns.tolist()}")
    except Exception as e:
        error_msg = f"Errore nella lettura del file: {str(e)}"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    
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
    collection_id: int = Form(None),  # ID della collezione
    db: Session = Depends(get_db)
):
    """Upload cards from Excel/CSV file with custom mapping"""
    from app.models import User, CardCollection
    from datetime import datetime
    
    # Check subscription limits
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify collection belongs to user
    if collection_id:
        collection = db.query(CardCollection).filter(
            CardCollection.id == collection_id,
            CardCollection.user_id == int(user_id)
        ).first()
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
    
    # Check subscription expiration
    if user.subscription_expires_at and datetime.utcnow() > user.subscription_expires_at:
        if user.subscription_type != 'lifetime':
            user.subscription_type = 'free'
            user.uploads_limit = 3
            user.uploads_count = 0
            user.subscription_expires_at = None
            db.commit()
    
    # Check if can upload
    if user.uploads_count >= user.uploads_limit:
        raise HTTPException(
            status_code=403,
            detail=f"Upload limit reached ({user.uploads_limit}). Please upgrade your subscription to continue."
        )
    
    if not file.filename.endswith(('.xlsx', '.csv')):
        raise HTTPException(status_code=400, detail="Il file deve essere .xlsx o .csv")
    
    contents = await file.read()
    
    try:
        if file.filename.endswith('.xlsx'):
            df = pd.read_excel(BytesIO(contents))
        else:
            # Decodifica il contenuto e gestisci diversi line endings
            try:
                text_content = contents.decode('utf-8')
            except:
                text_content = contents.decode('latin-1')
            
            # Normalizza line endings
            text_content = text_content.replace('\r\n', '\n').replace('\r', '\n')
            
            # Rimuovi righe di metadati che iniziano con #
            lines = [line for line in text_content.split('\n') if line.strip() and not line.startswith('#')]
            text_content = '\n'.join(lines)
            
            # Prova diversi metodi per CSV
            from io import StringIO
            import csv as csv_module
            
            try:
                # Prima prova: CSV con engine python e escape (per gestire backslash)
                df = pd.read_csv(StringIO(text_content), engine='python', escapechar='\\')
            except:
                try:
                    # Seconda prova: CSV standard
                    df = pd.read_csv(StringIO(text_content))
                except:
                    try:
                        # Terza prova: CSV con separatore punto e virgola
                        df = pd.read_csv(StringIO(text_content), sep=';')
                    except:
                        # Quarta prova: CSV con quoting NONE
                        df = pd.read_csv(
                            StringIO(text_content),
                            escapechar='\\',
                            quoting=csv_module.QUOTE_NONE,
                            on_bad_lines='skip',
                            engine='python'
                        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
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
    
    # Check unique cards per collection limit
    unique_card_limits = {
        'free': 20,
        'monthly_10': None,
        'monthly_30': None,
        'yearly': None,
        'lifetime': None
    }
    card_limit = unique_card_limits.get(user.subscription_type, 20)
    
    if card_limit is not None:
        # Count unique card names in the uploaded file
        name_col = column_mapping.get('name')
        if name_col and name_col in df.columns:
            unique_names = df[name_col].dropna().nunique()
            if unique_names > card_limit:
                raise HTTPException(
                    status_code=403,
                    detail=f"File contains {unique_names} unique cards, but your plan allows max {card_limit} per collection. Upgrade your subscription for unlimited cards."
                )
    
    # Rimuovi carte esistenti dell'utente (solo per la collezione specifica se fornita)
    if collection_id:
        db.query(Card).filter(
            Card.user_id == user_id,
            Card.collection_id == collection_id
        ).delete()
    else:
        # Se non c'è collection_id, rimuovi solo le carte senza collezione (non toccare le altre collezioni)
        db.query(Card).filter(
            Card.user_id == user_id,
            Card.collection_id == None
        ).delete()
    
    cards_added = 0
    cards_enriched = 0
    errors = []
    
    # Import MTGCard per il lookup
    from app.models import MTGCard
    
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
            
            # Normalizza il nome (specialmente per le terre base)
            name = normalize_card_name(name)
            
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
            card_type = str(row[type_col]) if type_col and type_col in df.columns and pd.notna(row[type_col]) else None
            
            # Se il tipo è vuoto, Unknown o nan, cerca nel database MTG
            if not card_type or card_type.lower() in ['unknown', 'nan', 'none', '']:
                mtg_card = db.query(MTGCard).filter(MTGCard.name == name).first()
                if mtg_card:
                    if mtg_card.types:
                        card_type = mtg_card.types.split(',')[0].strip()
                        cards_enriched += 1
                    elif mtg_card.type_line:
                        type_parts = mtg_card.type_line.split('—')[0].strip()
                        card_type = type_parts.split()[0] if type_parts else 'Unknown'
                        cards_enriched += 1
            
            # Se ancora non abbiamo un tipo, usa Unknown
            if not card_type or card_type.lower() in ['nan', 'none', '']:
                card_type = 'Unknown'
            
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
                user_id=user_id,
                collection_id=collection_id
            )
            db.add(card)
            cards_added += 1
            
            if idx < 3:
                print(f"✓ Carta {idx+1}: {name} x{quantity} ({card_type})")
            
        except Exception as e:
            errors.append(f"Riga {idx + 1}: {str(e)}")
            if idx < 3:
                print(f"❌ Errore riga {idx+1}: {e}")
    
    db.commit()
    
    # Incrementa contatore caricamenti
    user.uploads_count += 1
    db.commit()
    
    print(f"✅ Caricate {cards_added} carte su {len(df)} righe")
    print(f"🔍 Arricchite {cards_enriched} carte dal database MTG")
    print(f"📊 Caricamenti: {user.uploads_count}/{user.uploads_limit}")
    
    enriched_msg = f" ({cards_enriched} enriched from MTG database)" if cards_enriched > 0 else ""
    
    return {
        "message": f"Loaded {cards_added} cards{enriched_msg}",
        "count": cards_added,
        "cards_enriched": cards_enriched,
        "errors": errors[:10] if errors else [],
        "uploads_remaining": user.uploads_limit - user.uploads_count
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
    from app.models import MTGCard, User, CardCollection
    
    # Check subscription limits for unique cards per collection
    collection_id = card_data.get('collection_id')
    if collection_id:
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user:
            unique_card_limits = {
                'free': 20,
                'monthly_10': None,  # unlimited
                'monthly_30': None,
                'yearly': None,
                'lifetime': None
            }
            card_limit = unique_card_limits.get(user.subscription_type, 20)
            
            if card_limit is not None:
                # Check if card already exists (update quantity doesn't count as new)
                existing = db.query(Card).filter(
                    Card.user_id == user_id,
                    Card.name == card_data.get('name'),
                    Card.collection_id == collection_id
                ).first()
                
                if not existing:
                    unique_count = db.query(func.count(Card.id)).filter(
                        Card.collection_id == collection_id
                    ).scalar()
                    
                    if unique_count >= card_limit:
                        raise HTTPException(
                            status_code=403,
                            detail=f"Unique card limit per collection reached ({card_limit}). Upgrade your subscription for unlimited cards."
                        )
    
    # Cerca la carta nel database MTG per arricchire i dati
    card_name = card_data.get('name')
    mtg_card = db.query(MTGCard).filter(MTGCard.name == card_name).first()
    
    # Usa i dati dal database MTG se disponibili
    if mtg_card:
        card_type = mtg_card.types.split(',')[0].strip() if mtg_card.types else card_data.get('card_type', 'Unknown')
        colors = mtg_card.colors or card_data.get('colors', '')
        mana_cost = mtg_card.mana_cost or card_data.get('mana_cost')
        rarity = mtg_card.rarity or card_data.get('rarity')
    else:
        card_type = card_data.get('card_type', 'Unknown')
        colors = card_data.get('colors', '')
        mana_cost = card_data.get('mana_cost')
        rarity = card_data.get('rarity')
    
    # Verifica se la carta esiste già nella collezione
    collection_id = card_data.get('collection_id')
    existing_card = db.query(Card).filter(
        Card.user_id == user_id,
        Card.name == card_name,
        Card.collection_id == collection_id
    ).first()
    
    if existing_card:
        # Incrementa la quantità
        existing_card.quantity_owned += card_data.get('quantity_owned', 1)
        db.commit()
        return {
            "message": "Card quantity updated",
            "card_id": existing_card.id,
            "new_quantity": existing_card.quantity_owned
        }
    else:
        # Crea nuova carta
        card = Card(
            name=card_name,
            mana_cost=mana_cost,
            card_type=card_type,
            colors=colors,
            rarity=rarity,
            quantity_owned=card_data.get('quantity_owned', 1),
            user_id=user_id,
            collection_id=collection_id
        )
        db.add(card)
        db.commit()
        return {
            "message": "Card added",
            "card_id": card.id
        }

@router.get("/collection/{user_id}")
def get_user_collection(
    user_id: int,
    collection_id: int = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    colors: Optional[str] = None,
    types: Optional[str] = None,
    rarity: Optional[str] = None,
    cmc_min: Optional[int] = None,
    cmc_max: Optional[int] = None,
    sort_by: str = Query("name", regex="^(name|quantity|type|colors)$"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """
    Get user's card collection with pagination and filters.
    Free plan: limited to 20 unique cards per collection
    Paid plans: unlimited
    Cards are enriched with data from MTG database
    """
    from app.models import MTGCard
    
    # Get user to check subscription
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Determine display limit based on subscription (20 unique cards for free)
    unique_card_limit = 20 if user.subscription_type == 'free' else None
    
    # Base query - join with MTG cards for enrichment
    query = db.query(Card).filter(Card.user_id == user_id)
    
    # Filter by collection if specified
    if collection_id:
        query = query.filter(Card.collection_id == collection_id)
    
    # Apply search filter
    if search:
        query = query.filter(Card.name.ilike(f"%{search}%"))
    
    # Apply color filter - check both Card.colors and MTGCard.colors
    if colors:
        color_list = colors.split(',')
        color_conditions = []
        for color in color_list:
            color_conditions.append(Card.colors.like(f"%{color}%"))
        query = query.filter(or_(*color_conditions))
    
    # Apply type filter
    if types:
        type_list = types.split(',')
        type_conditions = []
        for t in type_list:
            type_conditions.append(Card.card_type.like(f"%{t}%"))
        query = query.filter(or_(*type_conditions))
    
    # Apply rarity filter
    if rarity:
        query = query.filter(Card.rarity == rarity)
    
    # Get total count (unique cards)
    total_unique_cards = query.count()
    
    # Check if user exceeds limit
    limited = False
    locked_cards = 0
    if unique_card_limit and total_unique_cards > unique_card_limit:
        limited = True
        locked_cards = total_unique_cards - unique_card_limit
    
    # Apply sorting
    if sort_by == "name":
        query = query.order_by(Card.name.asc() if sort_order == "asc" else Card.name.desc())
    elif sort_by == "quantity":
        query = query.order_by(Card.quantity_owned.asc() if sort_order == "asc" else Card.quantity_owned.desc())
    elif sort_by == "type":
        query = query.order_by(Card.card_type.asc() if sort_order == "asc" else Card.card_type.desc())
    elif sort_by == "colors":
        query = query.order_by(Card.colors.asc() if sort_order == "asc" else Card.colors.desc())
    
    # Get all cards
    all_cards = query.all()
    
    # Enrich cards with MTG database data and apply CMC filter
    enriched_cards = []
    for card in all_cards:
        # Get MTG card data
        mtg_card = db.query(MTGCard).filter(MTGCard.name == card.name).first()
        
        # Apply CMC filter if specified
        if mtg_card:
            if cmc_min is not None and (mtg_card.mana_value is None or mtg_card.mana_value < cmc_min):
                continue
            if cmc_max is not None and (mtg_card.mana_value is None or mtg_card.mana_value > cmc_max):
                continue
        else:
            # If no MTG card found and CMC filter is active, skip
            if cmc_min is not None or cmc_max is not None:
                continue
        
        enriched_cards.append({
            'card': card,
            'mtg_card': mtg_card
        })
    
    # Apply pagination on enriched cards
    offset = (page - 1) * page_size
    paginated_cards = enriched_cards[offset:offset + page_size]
    
    # Calculate total pages
    total_pages = (len(enriched_cards) + page_size - 1) // page_size
    
    # Format response
    cards_data = []
    for idx, item in enumerate(paginated_cards):
        card = item['card']
        mtg_card = item['mtg_card']
        global_idx = offset + idx
        is_locked = unique_card_limit and global_idx >= unique_card_limit
        
        # Use MTG card data if available, otherwise use collection card data
        card_type = card.card_type or "Unknown"
        colors = card.colors or ""
        mana_cost = card.mana_cost or ""
        rarity = card.rarity or ""
        mana_value = None
        
        if mtg_card:
            if mtg_card.types:
                card_type = mtg_card.types.split(',')[0].strip()
            elif mtg_card.type_line:
                type_parts = mtg_card.type_line.split('—')[0].strip()
                card_type = type_parts.split()[0] if type_parts else card_type
            
            colors = mtg_card.colors or colors
            mana_cost = mtg_card.mana_cost or mana_cost
            rarity = mtg_card.rarity or rarity
            mana_value = mtg_card.mana_value
        
        cards_data.append({
            "id": card.id,
            "name": card.name,
            "quantity": card.quantity_owned,
            "type": card_type,
            "colors": colors,
            "mana_cost": mana_cost,
            "rarity": rarity,
            "mana_value": mana_value,
            "locked": is_locked
        })
    
    return {
        "cards": cards_data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_cards": len(enriched_cards),
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        },
        "subscription": {
            "type": user.subscription_type,
            "limited": limited,
            "unique_card_limit": unique_card_limit,
            "total_unique_cards": total_unique_cards,
            "locked_cards": locked_cards,
            "cards_remaining": max(0, unique_card_limit - total_unique_cards) if unique_card_limit else None
        }
    }

@router.get("/collection/{user_id}/stats")
def get_collection_stats(
    user_id: int,
    collection_id: int = Query(None),
    db: Session = Depends(get_db)
):
    """Get statistics about user's collection"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all cards (filtered by collection if specified)
    query = db.query(Card).filter(Card.user_id == user_id)
    if collection_id:
        query = query.filter(Card.collection_id == collection_id)
    
    cards = query.all()
    
    # Calculate stats
    total_unique = len(cards)
    total_quantity = sum(card.quantity_owned for card in cards)
    
    # Count by colors
    colors_count = {}
    for card in cards:
        color = card.colors or "Colorless"
        colors_count[color] = colors_count.get(color, 0) + 1
    
    # Count by type
    types_count = {}
    for card in cards:
        card_type = card.card_type or "Unknown"
        types_count[card_type] = types_count.get(card_type, 0) + 1
    
    # Check if limited (20 unique cards for free)
    unique_card_limit = 20 if user.subscription_type == 'free' else None
    limited = unique_card_limit and total_unique > unique_card_limit
    locked_cards = max(0, total_unique - unique_card_limit) if unique_card_limit else 0
    cards_remaining = max(0, unique_card_limit - total_unique) if unique_card_limit else None
    
    # Show warning when 5 or fewer cards remaining
    show_upgrade_warning = unique_card_limit and cards_remaining is not None and cards_remaining <= 5 and cards_remaining > 0
    
    return {
        "total_unique_cards": total_unique,
        "total_cards": total_quantity,
        "colors_distribution": colors_count,
        "types_distribution": types_count,
        "subscription_type": user.subscription_type,
        "limited": limited,
        "unique_card_limit": unique_card_limit,
        "locked_cards": locked_cards,
        "cards_remaining": cards_remaining,
        "show_upgrade_warning": show_upgrade_warning,
        "viewable_cards": min(total_unique, unique_card_limit) if unique_card_limit else total_unique
    }

@router.put("/card/{card_id}/quantity")
def update_card_quantity(
    card_id: int,
    quantity: int,
    db: Session = Depends(get_db)
):
    """Update card quantity"""
    if quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")
    
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if quantity == 0:
        # Remove card if quantity is 0
        db.delete(card)
        db.commit()
        return {"message": "Card removed", "deleted": True}
    else:
        card.quantity_owned = quantity
        db.commit()
        return {
            "message": "Quantity updated",
            "card_id": card.id,
            "new_quantity": card.quantity_owned,
            "deleted": False
        }
