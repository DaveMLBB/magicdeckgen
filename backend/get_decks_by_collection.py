"""
Endpoint per ottenere i mazzi collegati a una collezione
Aggiungere questo al router saved_decks.py
"""

@router.get("/by-collection/{collection_id}")
def get_decks_by_collection(
    collection_id: int,
    db: Session = Depends(get_db)
):
    """Ottieni tutti i mazzi collegati a una collezione"""
    decks = db.query(SavedDeck).filter(SavedDeck.collection_id == collection_id).all()
    
    decks_data = []
    for deck in decks:
        # Count cards
        total_cards = db.query(SavedDeckCard).filter(
            SavedDeckCard.deck_id == deck.id
        ).count()
        
        decks_data.append({
            "id": deck.id,
            "name": deck.name,
            "total_cards": total_cards,
            "completion_percentage": deck.completion_percentage
        })
    
    return {
        "decks": decks_data,
        "count": len(decks_data)
    }
