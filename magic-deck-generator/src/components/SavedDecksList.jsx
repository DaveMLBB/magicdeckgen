import { useState, useEffect } from 'react'
import './SavedDecksList.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function SavedDecksList({ user, onBack, onSelectDeck, language }) {
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deckToDelete, setDeckToDelete] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [newDeck, setNewDeck] = useState({
    name: '',
    description: '',
    format: '',
    colors: '',
    archetype: '',
    cardsText: ''
  })

  // Limiti mazzi per tipo abbonamento - CORRETTI
  const DECK_LIMITS = {
    'free': 3,
    'premium': 5,
    'premium_monthly': 5,
    'premium_10': 5,
    '10_uploads': 5,
    'premium_30': 10,
    '30_uploads': 10,
    'premium_30_monthly': 10,
    'premium_annual': 50,
    'yearly': 50,
    'annual': 50,
    'yearly_unlimited': 50,
    'lifetime': -1, // illimitato
    'lifetime_unlimited': -1
  }

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
      deckFormat: 'Formato (opzionale)',
      deckFormatPlaceholder: 'Es: Standard, Modern, Commander',
      deckColors: 'Colori (opzionale)',
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
      deckCardsRequired: 'Devi inserire almeno una carta',
      limitReached: 'Limite Mazzi Raggiunto',
      limitReachedMessage: 'Hai raggiunto il limite di {limit} mazzi per il tuo piano {plan}.',
      limitReachedUpgrade: 'Aggiorna il tuo abbonamento per salvare più mazzi:',
      limitPremium: '• Premium (10 caricamenti/mese): fino a 5 mazzi',
      limitPremium30: '• Premium (30 caricamenti/mese): fino a 10 mazzi',
      limitAnnual: '• Premium Annuale: fino a 50 mazzi',
      limitLifetime: '• Lifetime: mazzi illimitati',
      upgradeNow: 'Aggiorna Ora',
      deckCount: '{current} di {limit} mazzi salvati',
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
      deckFormat: 'Format (optional)',
      deckFormatPlaceholder: 'E.g: Standard, Modern, Commander',
      deckColors: 'Colors (optional)',
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
      deckCardsRequired: 'You must enter at least one card',
      limitReached: 'Deck Limit Reached',
      limitReachedMessage: 'You have reached the limit of {limit} decks for your {plan} plan.',
      limitReachedUpgrade: 'Upgrade your subscription to save more decks:',
      limitPremium: '• Premium (10 uploads/month): up to 5 decks',
      limitPremium30: '• Premium (30 uploads/month): up to 10 decks',
      limitAnnual: '• Premium Annual: up to 50 decks',
      limitLifetime: '• Lifetime: unlimited decks',
      upgradeNow: 'Upgrade Now',
      deckCount: '{current} of {limit} decks saved',
      deckCountUnlimited: '{current} decks saved'
    }
  }

  const t = translations[language]

  useEffect(() => {
    loadDecks()
    loadSubscriptionStatus()
  }, [])

  const loadSubscriptionStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/status?token=${user.token}`)
      const data = await res.json()
      setSubscriptionStatus(data)
    } catch (err) {
      console.error('Error loading subscription status:', err)
    }
  }

  const loadDecks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/saved-decks/user/${user.userId}`)
      const data = await res.json()
      setDecks(data.decks || [])
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
    // Controlla limiti prima di creare
    if (subscriptionStatus) {
      const limit = DECK_LIMITS[subscriptionStatus.subscription_type] || 3
      if (limit !== -1 && decks.length >= limit) {
        setShowLimitModal(true)
        return
      }
    }

    // Validazione
    if (!newDeck.name.trim()) {
      alert(t.deckNameRequired)
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

  const getColorEmoji = (colors) => {
    if (!colors) return '⚪'
    const colorMap = { W: '⚪', U: '🔵', B: '⚫', R: '🔴', G: '🟢' }
    return colors.split(',').map(c => colorMap[c.trim()] || '⚪').join('')
  }

  const getCompletionColor = (percentage) => {
    if (percentage >= 90) return '#68d391' // green
    if (percentage >= 70) return '#fbbf24' // yellow
    if (percentage >= 50) return '#f59e0b' // orange
    return '#f5576c' // red
  }

  const getDeckLimit = () => {
    if (!subscriptionStatus) return 3
    const type = subscriptionStatus.subscription_type.toLowerCase()
    return DECK_LIMITS[type] || 3 // default fallback
  }

  const canCreateDeck = () => {
    const limit = getDeckLimit()
    return limit === -1 || decks.length < limit
  }

  const getDeckCountText = () => {
    const limit = getDeckLimit()
    if (limit === -1) {
      return t.deckCountUnlimited.replace('{current}', decks.length)
    }
    return t.deckCount.replace('{current}', decks.length).replace('{limit}', limit)
  }

  const getPlanName = () => {
    if (!subscriptionStatus) return 'Free'
    const type = subscriptionStatus.subscription_type
    if (type === 'premium' || type === 'premium_monthly') return 'Premium (10/mese)'
    if (type === 'premium_30') return 'Premium (30/mese)'
    if (type === 'premium_annual') return 'Premium Annuale'
    if (type === 'lifetime') return 'Lifetime'
    return 'Free'
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
            {subscriptionStatus && (
              <div className="deck-counter">
                {getDeckCountText()}
              </div>
            )}
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
                  {deck.colors && (
                    <div className="deck-colors">{getColorEmoji(deck.colors)}</div>
                  )}
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
                <label>{t.deckFormat}</label>
                <input
                  type="text"
                  placeholder={t.deckFormatPlaceholder}
                  value={newDeck.format}
                  onChange={(e) => setNewDeck({...newDeck, format: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>{t.deckColors}</label>
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

      {showLimitModal && subscriptionStatus && (
        <div className="modal-overlay" onClick={() => setShowLimitModal(false)}>
          <div className="modal-content limit-modal" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ {t.limitReached}</h2>
            <div className="limit-modal-content">
              <p className="limit-message">
                {t.limitReachedMessage
                  .replace('{limit}', getDeckLimit())
                  .replace('{plan}', getPlanName())}
              </p>
              <div className="upgrade-info">
                <p className="upgrade-title">{t.limitReachedUpgrade}</p>
                <ul className="upgrade-list">
                  <li>{t.limitPremium}</li>
                  <li>{t.limitPremium30}</li>
                  <li>{t.limitAnnual}</li>
                  <li>{t.limitLifetime}</li>
                </ul>
              </div>
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
                  // Qui potresti aprire la modale subscriptions
                  // onShowSubscriptions() se passi la prop
                }}
              >
                💎 {t.upgradeNow}
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
