import { useState, useEffect } from 'react'
import './SavedDecksList.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.mtgdecksbuilder.com' 
  : 'http://localhost:8000'

function SavedDecksList({ user, onBack, onSelectDeck, language, onShowSubscriptions, onLimitError }) {
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deckToDelete, setDeckToDelete] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [tokenBalance, setTokenBalance] = useState(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [deckSubscription, setDeckSubscription] = useState(null)
  const [newDeck, setNewDeck] = useState({
    name: '',
    description: '',
    format: '',
    colors: '',
    archetype: '',
    cardsText: ''
  })


  const translations = {
    it: {
      title: 'I Miei Mazzi',
      backToMain: '← Torna alla Ricerca Mazzi',
      createNewDeck: '+ Crea Nuovo Mazzo',
      noDecks: 'Nessun mazzo salvato',
      noDecksDesc: 'Salva i tuoi mazzi preferiti per tenere traccia delle carte mancanti',
      totalCards: 'carte totali',
      completion: 'Completamento',
      viewDeck: 'Visualizza',
      createdOn: 'Creato il',
      deleteModalTitle: 'Elimina Mazzo',
      deleteModalMessage: 'Sei sicuro di voler eliminare questo mazzo?',
      deleteModalWarning: 'Questa azione non può essere annullata.',
      confirmDelete: 'Sì, Elimina',
      cancelDelete: 'Annulla',
      createDeckTitle: 'Crea Nuovo Mazzo',
      deckName: 'Nome Mazzo',
      deckNamePlaceholder: 'Es: Mono Red Aggro',
      deckDescription: 'Descrizione (opzionale)',
      deckDescPlaceholder: 'Descrizione del mazzo...',
      deckFormat: 'Formato',
      deckFormatPlaceholder: 'Es: Standard, Modern, Commander',
      deckColors: 'Colori',
      deckColorsPlaceholder: 'Es: W,U,B,R,G',
      deckArchetype: 'Archetipo (opzionale)',
      deckArchetypePlaceholder: 'Es: Aggro, Control, Midrange',
      deckCards: 'Lista Carte',
      deckCardsPlaceholder: 'Inserisci le carte, una per riga:\n4 Lightning Bolt\n3 Counterspell\n1 Sol Ring',
      deckCardsHelp: 'Formato: [quantità] [nome carta] (una per riga)',
      createDeck: 'Crea Mazzo',
      creating: 'Creando...',
      cancel: 'Annulla',
      errorCreating: 'Errore nella creazione del mazzo',
      deckNameRequired: 'Il nome del mazzo è obbligatorio',
      deckFormatRequired: 'Il formato è obbligatorio',
      deckColorsRequired: 'I colori sono obbligatori',
      deckCardsRequired: 'Devi inserire almeno una carta',
      limitReached: 'Token Insufficienti',
      limitReachedMessage: 'Non hai abbastanza token per creare un nuovo mazzo.',
      limitReachedUpgrade: 'Acquista token per continuare:',
      buyTokens: 'Acquista Token',
      deckCount: '{current} mazzi salvati',
      deckCountUnlimited: '{current} mazzi salvati'
    },
    en: {
      title: 'My Decks',
      backToMain: '← Back to Deck Search',
      createNewDeck: '+ Create New Deck',
      noDecks: 'No saved decks',
      noDecksDesc: 'Save your favorite decks to track missing cards',
      totalCards: 'total cards',
      completion: 'Completion',
      viewDeck: 'View',
      createdOn: 'Created on',
      deleteModalTitle: 'Delete Deck',
      deleteModalMessage: 'Are you sure you want to delete this deck?',
      deleteModalWarning: 'This action cannot be undone.',
      confirmDelete: 'Yes, Delete',
      cancelDelete: 'Cancel',
      createDeckTitle: 'Create New Deck',
      deckName: 'Deck Name',
      deckNamePlaceholder: 'E.g: Mono Red Aggro',
      deckDescription: 'Description (optional)',
      deckDescPlaceholder: 'Deck description...',
      deckFormat: 'Format',
      deckFormatPlaceholder: 'E.g: Standard, Modern, Commander',
      deckColors: 'Colors',
      deckColorsPlaceholder: 'E.g: W,U,B,R,G',
      deckArchetype: 'Archetype (optional)',
      deckArchetypePlaceholder: 'E.g: Aggro, Control, Midrange',
      deckCards: 'Card List',
      deckCardsPlaceholder: 'Enter cards, one per line:\n4 Lightning Bolt\n3 Counterspell\n1 Sol Ring',
      deckCardsHelp: 'Format: [quantity] [card name] (one per line)',
      createDeck: 'Create Deck',
      creating: 'Creating...',
      cancel: 'Cancel',
      errorCreating: 'Error creating deck',
      deckNameRequired: 'Deck name is required',
      deckFormatRequired: 'Format is required',
      deckColorsRequired: 'Colors are required',
      deckCardsRequired: 'You must enter at least one card',
      limitReached: 'Insufficient Tokens',
      limitReachedMessage: 'You don\'t have enough tokens to create a new deck.',
      limitReachedUpgrade: 'Purchase tokens to continue:',
      buyTokens: 'Buy Tokens',
      deckCount: '{current} decks saved',
      deckCountUnlimited: '{current} decks saved'
    }
  }

  const t = translations[language]

  useEffect(() => {
    loadDecks()
    loadTokenBalance()
  }, [])

  const loadTokenBalance = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tokens/balance?token=${user.token}`)
      const data = await res.json()
      setTokenBalance(data.tokens)
    } catch (err) {
      console.error('Error loading token balance:', err)
    }
  }

  const loadDecks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/saved-decks/user/${user.userId}`)
      const data = await res.json()
      setDecks(data.decks || [])
      if (data.subscription) {
        setDeckSubscription(data.subscription)
      }
    } catch (err) {
      console.error('Error loading decks:', err)
    }
    setLoading(false)
  }

  const openDeleteModal = (deck) => {
    setDeckToDelete(deck)
    setShowDeleteModal(true)
  }

  const handleDeleteDeck = async () => {
    if (!deckToDelete) return

    try {
      const res = await fetch(`${API_URL}/api/saved-decks/${deckToDelete.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setShowDeleteModal(false)
        setDeckToDelete(null)
        loadDecks()
      }
    } catch (err) {
      console.error('Error deleting deck:', err)
    }
  }

  const handleCreateDeck = async () => {
    // Check token balance before creating
    if (tokenBalance !== null && tokenBalance <= 0) {
      setShowLimitModal(true)
      return
    }

    // Validazione
    if (!newDeck.name.trim()) {
      alert(t.deckNameRequired)
      return
    }
    if (!newDeck.format.trim()) {
      alert(t.deckFormatRequired)
      return
    }
    if (!newDeck.colors.trim()) {
      alert(t.deckColorsRequired)
      return
    }
    if (!newDeck.cardsText.trim()) {
      alert(t.deckCardsRequired)
      return
    }

    setCreating(true)
    try {
      // Parse cards from text - supporta vari formati
      let text = newDeck.cardsText
      
      // Rimuovi la sezione Sideboard se presente (per ora ignoriamo la sideboard)
      const sideboardIndex = text.toLowerCase().indexOf('sideboard')
      if (sideboardIndex !== -1) {
        text = text.substring(0, sideboardIndex)
      }
      
      // Split per linee o per pattern "numero nome"
      const cards = []
      
      // Prova prima a splittare per linee
      let lines = text.split('\n').filter(line => line.trim())
      
      // Se c'è solo una linea, prova a splittare per pattern "numero nome numero nome"
      if (lines.length === 1) {
        const singleLine = lines[0]
        // Match pattern: numero seguito da testo fino al prossimo numero
        const matches = singleLine.matchAll(/(\d+)\s+([^0-9]+?)(?=\d+\s+|$)/g)
        lines = []
        for (const match of matches) {
          lines.push(`${match[1]} ${match[2].trim()}`)
        }
      }
      
      for (const line of lines) {
        // Match pattern: "4 Lightning Bolt" o "4x Lightning Bolt"
        const match = line.trim().match(/^(\d+)x?\s+(.+)$/i)
        if (match) {
          const quantity = parseInt(match[1])
          const cardName = match[2].trim()
          
          // Ignora carte con nomi strani o troppo corti
          if (cardName.length > 2) {
            cards.push({
              card_name: cardName,
              quantity: quantity,
              card_type: null,
              colors: null,
              mana_cost: null,
              rarity: null
            })
          }
        }
      }

      if (cards.length === 0) {
        alert(t.deckCardsRequired)
        setCreating(false)
        return
      }

      // Create deck
      const res = await fetch(
        `${API_URL}/api/saved-decks/create?user_id=${user.userId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newDeck.name.trim(),
            description: newDeck.description.trim() || null,
            format: newDeck.format.trim() || null,
            colors: newDeck.colors.trim() || null,
            archetype: newDeck.archetype.trim() || null,
            source: 'manual',
            is_public: false,
            collection_ids: [],
            cards: cards
          })
        }
      )

      if (res.ok) {
        setShowCreateModal(false)
        setNewDeck({
          name: '',
          description: '',
          format: '',
          colors: '',
          archetype: '',
          cardsText: ''
        })
        loadDecks()
      } else if (res.status === 403 && onLimitError) {
        const error = await res.json()
        onLimitError(error.detail)
      } else {
        const error = await res.json()
        alert(`${t.errorCreating}: ${error.detail || ''}`)
      }
    } catch (err) {
      console.error('Error creating deck:', err)
      alert(t.errorCreating)
    }
    setCreating(false)
  }

  const colorStyleMap = {
    W: { background: '#F9FAF4', border: '#E0D6B8', label: 'W' },
    U: { background: '#0E68AB', border: '#0A4F82', label: 'U' },
    B: { background: '#2B2B2B', border: '#555', label: 'B' },
    R: { background: '#D32029', border: '#A01820', label: 'R' },
    G: { background: '#00733E', border: '#005A2E', label: 'G' }
  }

  const renderDeckColors = (colors) => {
    if (!colors) return null
    const parts = colors.split(/[,\/]/).map(c => c.trim()).filter(Boolean)
    if (parts.length === 0) return null
    return parts.map((c, i) => {
      const style = colorStyleMap[c]
      if (!style) return null
      return (
        <span
          key={i}
          className="deck-color-pip"
          style={{
            background: style.background,
            borderColor: style.border,
            color: c === 'W' ? '#333' : '#fff'
          }}
          title={c}
        >
          {style.label}
        </span>
      )
    })
  }

  const getCompletionColor = (percentage) => {
    if (percentage >= 90) return '#68d391' // green
    if (percentage >= 70) return '#fbbf24' // yellow
    if (percentage >= 50) return '#f59e0b' // orange
    return '#f5576c' // red
  }

  const canCreateDeck = () => {
    return tokenBalance === null || tokenBalance > 0
  }

  const getDeckCountText = () => {
    return t.deckCount.replace('{current}', decks.length)
  }

  return (
    <div className="saved-decks-list-page">
      <header className="decks-header">
        <div className="header-top">
          <button className="back-btn" onClick={onBack}>
            {t.backToMain}
          </button>
          <div className="header-actions">
            <span className="user-email">{user.email}</span>
          </div>
        </div>
        <div className="header-title-row">
          <h1>{t.title}</h1>
          <div className="header-right">
            <div className="deck-counter">
              {getDeckCountText()}
              {tokenBalance !== null && (
                <span className="token-badge"> | 🪙 {tokenBalance} token</span>
              )}
            </div>
            <button 
              className="create-deck-btn" 
              onClick={() => {
                if (canCreateDeck()) {
                  setShowCreateModal(true)
                } else {
                  setShowLimitModal(true)
                }
              }}
              disabled={!canCreateDeck()}
              title={!canCreateDeck() ? t.limitReached : ''}
            >
              {t.createNewDeck}
            </button>
          </div>
        </div>
      </header>

      <main className="decks-main">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : decks.length === 0 ? (
          <div className="no-decks">
            <div className="empty-icon">🃏</div>
            <h3>{t.noDecks}</h3>
            <p>{t.noDecksDesc}</p>
          </div>
        ) : (
          <div className="decks-grid">
            {decks.map((deck) => (
              <div key={deck.id} className="deck-card">
                <div className="deck-header">
                  <h3>{deck.name}</h3>
                  <div className="deck-colors">
                    {deck.colors ? renderDeckColors(deck.colors) : (
                      <span className="deck-color-pip" style={{ background: '#888', borderColor: '#666', color: '#fff' }} title="Colorless">C</span>
                    )}
                  </div>
                </div>
                
                {deck.description && (
                  <p className="deck-desc">{deck.description}</p>
                )}
                
                {deck.collection_names && deck.collection_names.length > 0 && (
                  <div className="deck-collection">
                    <span className="collection-icon">📚</span>
                    {deck.collection_names.length === 1 ? (
                      <span className="collection-name">{deck.collection_names[0]}</span>
                    ) : (
                      <span className="collection-name">{deck.collection_names.length} {language === 'it' ? 'collezioni' : 'collections'}</span>
                    )}
                  </div>
                )}
                
                <div className="deck-info">
                  {deck.is_public && (
                    <span className="public-badge">🌐 {language === 'it' ? 'Pubblico' : 'Public'}</span>
                  )}
                  {deck.format && (
                    <span className="deck-format">{deck.format.toUpperCase()}</span>
                  )}
                  {deck.archetype && (
                    <span className="deck-archetype">{deck.archetype}</span>
                  )}
                </div>

                <div className="deck-stats">
                  <div className="stat">
                    <span className="stat-value">{deck.total_cards}</span>
                    <span className="stat-label">{t.totalCards}</span>
                  </div>
                </div>

                <div className="completion-bar-container">
                  <div className="completion-label">
                    <span>{t.completion}</span>
                    <span className="completion-percentage">{deck.completion_percentage}%</span>
                  </div>
                  <div className="completion-bar">
                    <div 
                      className="completion-fill"
                      style={{
                        width: `${deck.completion_percentage}%`,
                        backgroundColor: getCompletionColor(deck.completion_percentage)
                      }}
                    />
                  </div>
                  <div className="completion-stats">
                    <span className="owned">{deck.owned_cards} {language === 'it' ? 'possedute' : 'owned'}</span>
                    <span className="missing">{deck.total_cards - deck.owned_cards} {language === 'it' ? 'mancanti' : 'missing'}</span>
                  </div>
                </div>

                <div className="deck-date">
                  {t.createdOn} {new Date(deck.created_at).toLocaleDateString()}
                </div>

                <div className="deck-actions">
                  <button 
                    className="view-btn"
                    onClick={() => onSelectDeck(deck)}
                  >
                    {t.viewDeck}
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => openDeleteModal(deck)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showDeleteModal && deckToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-deck-modal">
            <h2>{t.deleteModalTitle}</h2>
            <div className="delete-modal-content">
              <div className="warning-icon-large">⚠️</div>
              <p className="delete-message">{t.deleteModalMessage}</p>
              <div className="deck-to-delete">
                <strong>{deckToDelete.name}</strong>
                <span className="deck-stats-small">
                  {deckToDelete.total_cards} {t.totalCards} • {deckToDelete.completion_percentage}% {t.completion}
                </span>
              </div>
              <p className="delete-warning">{t.deleteModalWarning}</p>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeckToDelete(null)
                }}
              >
                {t.cancelDelete}
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={handleDeleteDeck}
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-deck-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t.createDeckTitle}</h2>
            
            <div className="form-group">
              <label>{t.deckName} <span className="required">*</span></label>
              <input
                type="text"
                placeholder={t.deckNamePlaceholder}
                value={newDeck.name}
                onChange={(e) => setNewDeck({...newDeck, name: e.target.value})}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>{t.deckDescription}</label>
              <input
                type="text"
                placeholder={t.deckDescPlaceholder}
                value={newDeck.description}
                onChange={(e) => setNewDeck({...newDeck, description: e.target.value})}
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t.deckFormat} <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder={t.deckFormatPlaceholder}
                  value={newDeck.format}
                  onChange={(e) => setNewDeck({...newDeck, format: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>{t.deckColors} <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder={t.deckColorsPlaceholder}
                  value={newDeck.colors}
                  onChange={(e) => setNewDeck({...newDeck, colors: e.target.value})}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t.deckArchetype}</label>
              <input
                type="text"
                placeholder={t.deckArchetypePlaceholder}
                value={newDeck.archetype}
                onChange={(e) => setNewDeck({...newDeck, archetype: e.target.value})}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>{t.deckCards} <span className="required">*</span></label>
              <textarea
                placeholder={t.deckCardsPlaceholder}
                value={newDeck.cardsText}
                onChange={(e) => setNewDeck({...newDeck, cardsText: e.target.value})}
                className="form-textarea"
                rows="10"
              />
              <small className="form-help">{t.deckCardsHelp}</small>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                {t.cancel}
              </button>
              <button 
                className="confirm-btn"
                onClick={handleCreateDeck}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <span className="spinner"></span>
                    {t.creating}
                  </>
                ) : (
                  <>✓ {t.createDeck}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLimitModal && (
        <div className="modal-overlay" onClick={() => setShowLimitModal(false)}>
          <div className="modal-content limit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ {t.limitReached}</h2>
            <div className="limit-modal-content">
              <p className="limit-message">
                {t.limitReachedMessage}
              </p>
              <p className="upgrade-title">{t.limitReachedUpgrade}</p>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowLimitModal(false)}
              >
                {t.cancel}
              </button>
              <button 
                className="upgrade-btn"
                onClick={() => {
                  setShowLimitModal(false)
                  if (onShowSubscriptions) onShowSubscriptions()
                }}
              >
                🪙 {t.buyTokens}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="decks-footer">
        <p>Magic Deck Builder © 2026</p>
      </footer>
    </div>
  )
}

export default SavedDecksList
