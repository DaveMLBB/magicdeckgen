# Fix per Visualizzazione Mazzi Utenti

## Problema
I mazzi pubblici degli utenti non mostrano le carte quando vengono cliccati.

## Soluzione Implementata

### 1. Aggiunto stato per caricamento carte
```javascript
const [loadingDeckCards, setLoadingDeckCards] = useState(false)
```

### 2. Aggiunto useEffect per caricare carte mazzi pubblici
```javascript
// Carica le carte quando viene selezionato un mazzo pubblico
useEffect(() => {
  const loadUserDeckCards = async () => {
    if (selectedDeck !== null && decks[selectedDeck] && decks[selectedDeck].source === 'user' && decks[selectedDeck].saved_deck_id) {
      setLoadingDeckCards(true)
      try {
        const res = await fetch(`${API_URL}/api/saved-decks/${decks[selectedDeck].saved_deck_id}`)
        const data = await res.json()
        
        // Aggiorna il deck con le carte caricate
        setDecks(prevDecks => {
          const newDecks = [...prevDecks]
          newDecks[selectedDeck] = {
            ...newDecks[selectedDeck],
            deck_list: data.cards.map(card => ({
              name: card.card_name,
              quantity_needed: card.quantity,
              type: card.card_type,
              missing: card.quantity_missing
            }))
          }
          return newDecks
        })
      } catch (err) {
        console.error('Error loading user deck cards:', err)
      }
      setLoadingDeckCards(false)
    }
  }
  
  loadUserDeckCards()
}, [selectedDeck, decks])
```

### 3. Modifiche alla sezione deck-detail

#### A. Bottoni azioni condizionali
- Mazzi sistema: mostra "Salva Mazzo" + "Importa in Collezione"
- Mazzi utenti: mostra solo "Salva Mazzo"

#### B. Info deck condizionali
- Mazzi sistema: mostra match %, carte possedute, can_build
- Mazzi utenti: mostra solo numero carte totali

#### C. Indicatore caricamento
```javascript
{loadingDeckCards ? (
  <div className="loading-cards">
    <div className="spinner"></div>
    <p>{language === 'it' ? 'Caricamento carte...' : 'Loading cards...'}</p>
  </div>
) : decks[selectedDeck].deck_list && decks[selectedDeck].deck_list.length > 0 ? (
  // ... lista carte
)}
```

#### D. Status carte condizionale
- Mazzi sistema: mostra ✅/❌ con carte mancanti
- Mazzi utenti: non mostra status (non calcolato)

## Modifiche Manuali Necessarie

### In App.jsx, linea ~1421, sostituire:
```javascript
// VECCHIO
<div className="deck-actions-group">
  <button className="save-deck-btn"...>
    ...
    <>💾 {t.saveDeck}</>  // C'è un ? invece di 💾
  </button>
  <button className="import-deck-btn"...>
    ...
  </button>
</div>
```

### CON:
```javascript
<div className="deck-actions-group">
  {decks[selectedDeck].source === 'system' && (
    <>
      <button className="save-deck-btn"...>
        ...
        <>💾 {t.saveDeck}</>
      </button>
      <button className="import-deck-btn"...>
        ...
      </button>
    </>
  )}
  {decks[selectedDeck].source === 'user' && (
    <button className="save-deck-btn"...>
      ...
      <>💾 {t.saveDeck}</>
    </button>
  )}
</div>
```

## Test
1. Seleziona "Solo Utenti" o "Entrambi" nei filtri
2. Clicca "Trova Mazzi Compatibili"
3. Clicca su un mazzo con badge 👥 "Utente"
4. Dovrebbe mostrare:
   - Spinner "Caricamento carte..."
   - Poi lista completa delle carte
   - Solo bottone "Salva Mazzo" (no "Importa in Collezione")
   - Info semplificata (no match %)
