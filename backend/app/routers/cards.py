from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
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
    set_code: Optional[str] = None


def _resolve_set_code(db: Session, name: str, provided_set_code: Optional[str]) -> Optional[str]:
    from app.models import MTGCard
    if provided_set_code:
        s = str(provided_set_code).strip()
        if s and s.lower() not in ["nan", "none", "null"]:
            return s

    mtg_row = (
        db.query(MTGCard.set_code)
        .filter(MTGCard.name == name)
        .order_by(MTGCard.released_at.desc().nullslast())
        .first()
    )
    return mtg_row[0] if mtg_row and mtg_row[0] else None

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
    
    # Consume 1 token for upload (before processing)
    from app.routers.tokens import consume_token
    consume_token(user, 'upload', f'Upload file: {file.filename}', db)
    
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
    
    # No card limit per collection with token system
    
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
            
            colors_col = column_mapping.get('colors')
            colors = str(row[colors_col]) if colors_col and colors_col in df.columns and pd.notna(row[colors_col]) else ''
            
            rarity_col = column_mapping.get('rarity')
            rarity = str(row[rarity_col]) if rarity_col and rarity_col in df.columns and pd.notna(row[rarity_col]) else None

            set_code_col = column_mapping.get('set_code')
            set_code = str(row[set_code_col]) if set_code_col and set_code_col in df.columns and pd.notna(row[set_code_col]) else None
            
            # Arricchisci dal database MTG se mancano tipo, mana_cost o colors
            needs_type = not card_type or card_type.lower() in ['unknown', 'nan', 'none', '']
            needs_mana = not mana_cost or mana_cost.lower() in ['nan', 'none', '']
            needs_colors = not colors or colors.lower() in ['nan', 'none', '']
            
            name_it = None
            
            if needs_type or needs_mana or needs_colors:
                mtg_card = (
                    db.query(MTGCard)
                    .filter(MTGCard.name == name)
                    .order_by(MTGCard.released_at.desc().nullslast())
                    .first()
                )
                if mtg_card:
                    if needs_type:
                        if mtg_card.types:
                            card_type = mtg_card.types.split(',')[0].strip()
                        elif mtg_card.type_line:
                            type_parts = mtg_card.type_line.split('—')[0].strip()
                            card_type = type_parts.split()[0] if type_parts else 'Unknown'
                    if needs_mana and mtg_card.mana_cost:
                        mana_cost = mtg_card.mana_cost
                    if needs_colors and mtg_card.colors:
                        colors = mtg_card.colors
                    if mtg_card.name_it and mtg_card.name_it != 'None':
                        name_it = mtg_card.name_it
                    cards_enriched += 1
            
            # Se non abbiamo ancora name_it, cercalo comunque
            if not name_it:
                if not (needs_type or needs_mana or needs_colors):
                    mtg_card = (
                        db.query(MTGCard)
                        .filter(MTGCard.name == name)
                        .order_by(MTGCard.released_at.desc().nullslast())
                        .first()
                    )
                    if mtg_card and mtg_card.name_it and mtg_card.name_it != 'None':
                        name_it = mtg_card.name_it

            set_code = _resolve_set_code(db, name, set_code)
            
            # Se ancora non abbiamo un tipo, usa Unknown
            if not card_type or card_type.lower() in ['nan', 'none', '']:
                card_type = 'Unknown'
            
            card = Card(
                name=name,
                name_it=name_it,
                mana_cost=mana_cost,
                card_type=card_type,
                colors=colors,
                rarity=rarity,
                set_code=set_code,
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
    
    print(f"✅ Caricate {cards_added} carte su {len(df)} righe")
    print(f"🔍 Arricchite {cards_enriched} carte dal database MTG")
    print(f"🪙 Token rimanenti: {user.tokens}")
    
    enriched_msg = f" ({cards_enriched} enriched from MTG database)" if cards_enriched > 0 else ""
    
    return {
        "message": f"Loaded {cards_added} cards{enriched_msg}",
        "count": cards_added,
        "cards_enriched": cards_enriched,
        "errors": errors[:10] if errors else [],
        "tokens_remaining": user.tokens
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
    
    collection_id = card_data.get('collection_id')
    
    # Cerca la carta nel database MTG per arricchire i dati
    card_name = card_data.get('name')
    mtg_card = (
        db.query(MTGCard)
        .filter(MTGCard.name == card_name)
        .order_by(MTGCard.released_at.desc().nullslast())
        .first()
    )
    
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

    set_code = _resolve_set_code(db, card_name, card_data.get('set_code'))
    
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

        if not existing_card.set_code and set_code:
            existing_card.set_code = set_code
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
            set_code=set_code,
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
    page_size: int = Query(50, ge=1, le=5000),
    search: Optional[str] = None,
    colors: Optional[str] = None,
    types: Optional[str] = None,
    rarity: Optional[str] = None,
    set_code: Optional[str] = None,
    cmc_min: Optional[int] = None,
    cmc_max: Optional[int] = None,
    sort_by: str = Query("name", regex="^(name|quantity|type|mana_cost|price)$"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """
    Get user's card collection with pagination and filters.
    Uses a single SQL query with LEFT JOIN + subquery for best MTGCard match.
    Pagination happens at DB level — no full table scan in Python.
    """
    from app.models import MTGCard
    from sqlalchemy.orm import aliased

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ── Subquery: pick the best MTGCard row per card name ──────────────────
    # Priority: set_code match > has price_eur > first row
    # We use a lateral-style approach via a correlated subquery on uuid.
    # Simpler and portable: for each Card we join the MTGCard with the lowest
    # "priority" value (1 = set match, 2 = has price, 3 = any).
    # We achieve this with a subquery that selects the best uuid per name.

    # Build the base Card query with DISTINCT to avoid duplicates from JOINs
    q = db.query(Card).distinct().filter(Card.user_id == user_id)

    if collection_id:
        q = q.filter(Card.collection_id == collection_id)

    if search:
        q = q.filter(or_(Card.name.ilike(f"%{search}%"), Card.name_it.ilike(f"%{search}%")))

    if colors:
        from sqlalchemy import not_
        color_list = [c.strip() for c in colors.split(',')]
        all_colors = ['W', 'U', 'B', 'R', 'G']
        excluded_colors = [c for c in all_colors if c not in color_list]
        has_selected = or_(*[or_(
            Card.mana_cost.like(f"%{{{color}}}%"),
            Card.colors.like(f"%{color}%"),
        ) for color in color_list])
        q = q.filter(has_selected)
        for excl in excluded_colors:
            q = q.filter(
                not_(Card.mana_cost.like(f"%{{{excl}}}%")),
                not_(Card.colors.like(f"%{excl}%")),
            )

    if types:
        type_list = types.split(',')
        q = q.filter(or_(*[Card.card_type.like(f"%{t}%") for t in type_list]))

    if rarity:
        q = q.filter(Card.rarity == rarity)

    if set_code:
        q = q.filter(func.lower(Card.set_code) == set_code.lower())

    # CMC filter requires joining MTGCard — handle separately
    if cmc_min is not None or cmc_max is not None:
        mtg_alias = aliased(MTGCard)
        q = q.join(mtg_alias, mtg_alias.name == Card.name, isouter=True)
        if cmc_min is not None:
            q = q.filter(mtg_alias.mana_value >= cmc_min)
        if cmc_max is not None:
            q = q.filter(mtg_alias.mana_value <= cmc_max)

    # Total count (fast, DB-level)
    total_unique_cards = q.count()

    # Sorting
    if sort_by == "name":
        q = q.order_by(Card.name.asc() if sort_order == "asc" else Card.name.desc())
    elif sort_by == "quantity":
        q = q.order_by(Card.quantity_owned.asc() if sort_order == "asc" else Card.quantity_owned.desc())
    elif sort_by == "type":
        q = q.order_by(Card.card_type.asc() if sort_order == "asc" else Card.card_type.desc())
    elif sort_by == "mana_cost":
        q = q.order_by(Card.mana_cost.asc() if sort_order == "asc" else Card.mana_cost.desc())
    elif sort_by == "price":
        # For price sort we need the join — do it via subquery
        best_price_sub = (
            db.query(
                MTGCard.name.label("card_name"),
                func.max(MTGCard.price_eur).label("best_price")
            )
            .group_by(MTGCard.name)
            .subquery()
        )
        q = q.outerjoin(best_price_sub, best_price_sub.c.card_name == Card.name)
        if sort_order == "desc":
            q = q.order_by(best_price_sub.c.best_price.desc().nullslast())
        else:
            q = q.order_by(best_price_sub.c.best_price.asc().nullsfirst())

    # DB-level pagination
    offset = (page - 1) * page_size
    page_cards = q.offset(offset).limit(page_size).all()

    total_pages = (total_unique_cards + page_size - 1) // page_size

    # Bulk-fetch MTGCard data for only the cards on this page (N names → 1 query)
    card_names = [c.name for c in page_cards]
    if card_names:
        # Fetch all matching MTGCard rows for these names in one query
        mtg_rows = db.query(MTGCard).filter(MTGCard.name.in_(card_names)).all()
    else:
        mtg_rows = []

    # Helper function to get valid price (>= 0.02€)
    def get_valid_price(card):
        """Restituisce il prezzo valido (EUR preferito, altrimenti USD) o None"""
        if card.price_eur is not None and card.price_eur >= 0.02:
            return card.price_eur
        if card.price_usd is not None and card.price_usd >= 0.02:
            return card.price_usd
        return None
    
    # Build a dict: (name, set_code) → MTGCard for exact matches
    # Prefer cards with valid prices, and among those, the lowest price
    mtg_by_name_and_set: dict = {}
    mtg_by_name: dict = {}
    
    for m in mtg_rows:
        # Store by (name, set_code) for exact matches
        if m.set_code:
            key = (m.name, m.set_code.lower())
            existing = mtg_by_name_and_set.get(key)
            
            if existing is None:
                mtg_by_name_and_set[key] = m
            else:
                # Prefer card with valid price, then lowest price
                existing_price = get_valid_price(existing)
                new_price = get_valid_price(m)
                
                if existing_price is None and new_price is not None:
                    # Existing has no valid price, new one does → replace
                    mtg_by_name_and_set[key] = m
                elif existing_price is not None and new_price is not None:
                    # Both have valid prices → choose lowest
                    if new_price < existing_price:
                        mtg_by_name_and_set[key] = m
        
        # Store by name for fallback (prefer cards with valid prices, then lowest)
        existing = mtg_by_name.get(m.name)
        if existing is None:
            mtg_by_name[m.name] = m
        else:
            existing_price = get_valid_price(existing)
            new_price = get_valid_price(m)
            
            if existing_price is None and new_price is not None:
                mtg_by_name[m.name] = m
            elif existing_price is not None and new_price is not None:
                if new_price < existing_price:
                    mtg_by_name[m.name] = m

    # Format response
    cards_data = []
    for card in page_cards:
        # PRIORITY 1: Exact match by name + set_code
        mtg_card = None
        if card.set_code:
            key = (card.name, card.set_code.lower())
            mtg_card = mtg_by_name_and_set.get(key)
        
        # PRIORITY 2: Fallback to any card with that name
        if not mtg_card:
            mtg_card = mtg_by_name.get(card.name)

        card_type = card.card_type or "Unknown"
        colors_val = card.colors or ""
        mana_cost = card.mana_cost or ""
        rarity_val = card.rarity or ""
        mana_value = None
        set_code = None
        set_name = None
        price_eur = None
        price_usd = None

        if mtg_card:
            if mtg_card.types:
                card_type = mtg_card.types.split(',')[0].strip()
            elif mtg_card.type_line:
                type_parts = mtg_card.type_line.split('—')[0].strip()
                card_type = type_parts.split()[0] if type_parts else card_type
            colors_val = mtg_card.colors or colors_val
            mana_cost = mtg_card.mana_cost or mana_cost
            rarity_val = mtg_card.rarity or rarity_val
            mana_value = mtg_card.mana_value
            set_code = mtg_card.set_code or None
            set_name = mtg_card.set_name or None
            price_eur = mtg_card.price_eur
            price_usd = mtg_card.price_usd
        
        # Nome italiano: prendi dal card, altrimenti dal mtg_card
        name_it = card.name_it or ''
        if not name_it and mtg_card and mtg_card.name_it and mtg_card.name_it != 'None':
            name_it = mtg_card.name_it
        
        cards_data.append({
            "id": card.id,
            "name": card.name,
            "name_it": name_it,
            "quantity": card.quantity_owned,
            "type": card_type,
            "colors": colors_val,
            "mana_cost": mana_cost,
            "rarity": rarity_val,
            "mana_value": mana_value,
            "set_code": set_code or "—",
            "set_name": set_name,
            "price_eur": price_eur,
            "price_usd": price_usd,
            "locked": False
        })

    return {
        "cards": cards_data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_cards": total_unique_cards,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        },
        "subscription": {
            "type": "token",
            "limited": False,
            "unique_card_limit": None,
            "total_unique_cards": total_unique_cards,
            "locked_cards": 0,
            "cards_remaining": None
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
    
    # Calculate total value (EUR preferred, USD fallback)
    total_value_eur = 0.0
    total_value_usd = 0.0
    from app.models import MTGCard
    
    for card in cards:
        # Get price from MTGCard based on set_code
        mtg_card = None
        if card.set_code:
            mtg_card = db.query(MTGCard).filter(
                MTGCard.name == card.name,
                MTGCard.set_code == card.set_code
            ).first()
        
        # Fallback to any card with that name if no set match
        if not mtg_card:
            mtg_card = db.query(MTGCard).filter(MTGCard.name == card.name).first()
        
        if mtg_card:
            quantity = card.quantity_owned or 1
            # Only add EUR OR USD, not both (prefer EUR)
            if mtg_card.price_eur and mtg_card.price_eur >= 0.02:
                total_value_eur += mtg_card.price_eur * quantity
            elif mtg_card.price_usd and mtg_card.price_usd >= 0.02:
                total_value_usd += mtg_card.price_usd * quantity
    
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
    
    # No card limit per collection with token system
    unique_card_limit = None
    limited = False
    locked_cards = 0
    cards_remaining = None
    show_upgrade_warning = False
    
    return {
        "total_unique_cards": total_unique,
        "total_cards": total_quantity,
        "total_value_eur": round(total_value_eur, 2),
        "total_value_usd": round(total_value_usd, 2),
        "colors_distribution": colors_count,
        "types_distribution": types_count,
        "subscription_type": "token",
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

@router.get("/card/{card_id}/editions")
def get_card_editions(card_id: int, db: Session = Depends(get_db)):
    """Restituisce tutte le edizioni disponibili nel DB per la carta specificata."""
    from app.models import MTGCard
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    editions = (
        db.query(MTGCard.set_code, MTGCard.set_name, MTGCard.collector_number,
                 MTGCard.rarity, MTGCard.price_eur, MTGCard.price_usd, MTGCard.image_url)
        .filter(MTGCard.name == card.name)
        .all()
    )
    
    # Helper per calcolare prezzo valido (>= 0.02€)
    def get_valid_price(price_eur, price_usd):
        if price_eur is not None and price_eur >= 0.02:
            return price_eur
        if price_usd is not None and price_usd >= 0.02:
            return price_usd
        return None
    
    # Raggruppa per set_code e scegli la stampa con prezzo più basso valido
    editions_by_set = {}
    for e in editions:
        set_key = e.set_code
        if not set_key:
            continue
            
        valid_price = get_valid_price(e.price_eur, e.price_usd)
        
        if set_key not in editions_by_set:
            editions_by_set[set_key] = {
                "set_code": e.set_code,
                "set_name": e.set_name or e.set_code,
                "collector_number": e.collector_number,
                "rarity": e.rarity,
                "price_eur": e.price_eur,
                "price_usd": e.price_usd,
                "image_url": e.image_url,
                "valid_price": valid_price,
            }
        else:
            # Se questa stampa ha un prezzo valido migliore, sostituisci
            existing_price = editions_by_set[set_key]["valid_price"]
            if existing_price is None and valid_price is not None:
                editions_by_set[set_key].update({
                    "collector_number": e.collector_number,
                    "rarity": e.rarity,
                    "price_eur": e.price_eur,
                    "price_usd": e.price_usd,
                    "image_url": e.image_url,
                    "valid_price": valid_price,
                })
            elif existing_price is not None and valid_price is not None and valid_price < existing_price:
                editions_by_set[set_key].update({
                    "collector_number": e.collector_number,
                    "rarity": e.rarity,
                    "price_eur": e.price_eur,
                    "price_usd": e.price_usd,
                    "image_url": e.image_url,
                    "valid_price": valid_price,
                })
    
    # Converti in lista e ordina: prima con prezzo valido (dal più basso), poi senza prezzo
    editions_list = list(editions_by_set.values())
    editions_with_price = [e for e in editions_list if e["valid_price"] is not None]
    editions_without_price = [e for e in editions_list if e["valid_price"] is None]
    
    editions_with_price.sort(key=lambda e: e["valid_price"])
    editions_without_price.sort(key=lambda e: e["set_name"] or "")
    
    # Rimuovi il campo helper valid_price
    for e in editions_with_price + editions_without_price:
        e.pop("valid_price", None)
    
    return {
        "card_name": card.name,
        "current_set_code": card.set_code,
        "editions": editions_with_price + editions_without_price
    }


@router.put("/card/{card_id}/set")
def update_card_set(card_id: int, set_code: str, db: Session = Depends(get_db)):
    """Aggiorna il set_code di una carta nella collezione."""
    from app.models import MTGCard
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Verifica che il set esista per questa carta
    edition = db.query(MTGCard).filter(
        MTGCard.name == card.name,
        MTGCard.set_code == set_code
    ).first()
    if not edition:
        raise HTTPException(status_code=404, detail="Edition not found for this card")

    card.set_code = set_code
    db.commit()
    return {
        "updated": True,
        "card_id": card.id,
        "set_code": card.set_code,
        "set_name": edition.set_name,
        "price_eur": edition.price_eur,
        "price_usd": edition.price_usd,
    }
