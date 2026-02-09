# Modifiche Rimanenti da Implementare

## Backend - saved_decks.py

### 1. get_deck_details
- Aggiungere recupero collezioni collegate (many-to-many)
- Ritornare `collection_ids` e `collection_names`
- Ritornare `is_public`

### 2. refresh_ownership  
- Controllare possesso carte in TUTTE le collezioni collegate
- Sommare quantità da collezioni multiple

### 3. by-collection endpoint
- Rimuovere (non più necessario con many-to-many)
- O modificare per supportare ricerca inversa

### 4. Nuovo endpoint: search_public_decks
```python
@router.get("/public/search")
def search_public_decks(
    format: Optional[str] = None,
    colors: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    """Cerca tra i mazzi pubblici degli utenti"""
    query = db.query(SavedDeck).filter(SavedDeck.is_public == True)
    
    if format:
        query = query.filter(SavedDeck.format == format)
    if colors:
        query = query.filter(SavedDeck.colors.contains(colors))
    
    # ... paginazione e return
```

## Frontend

### App.jsx
- Rimuovere auto-link collezione in `saveDeckToSaved`
- Aggiungere parametro `collection_ids: []` e `is_public: false`
- Aggiungere filtro ricerca mazzi: "Sistema", "Utenti", "Entrambi"

### SavedDecksList.jsx
- Mostrare badge collezioni multiple (se > 1: "3 collezioni")
- Aggiungere icona 🌐 per mazzi pubblici

### SavedDeck.jsx
- Mostrare lista collezioni collegate
- Aggiungere toggle "Pubblico/Privato"
- Permettere aggiunta/rimozione collezioni

### CollectionsList.jsx
- Rimuovere warning mazzi collegati (non più necessario con many-to-many)
- O modificare per mostrare "Questo mazzo è collegato a X mazzi"

## Priorità
1. ✅ Database schema aggiornato
2. ✅ CreateDeckInput aggiornato
3. ✅ get_user_decks aggiornato
4. ✅ create_deck aggiornato
5. ⏳ get_deck_details
6. ⏳ refresh_ownership
7. ⏳ search_public_decks endpoint
8. ⏳ Frontend updates
