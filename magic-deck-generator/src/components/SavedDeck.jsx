import { useState, useEffect } from 'react'
import './SavedDeck.css'
import { cardImageCache } from '../utils/cardImageCache'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function SavedDeck({ user, deck, onBack, language }) {
  const [deckDetails, setDeckDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMissingOnly, setShowMissingOnly] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [updatingPublic, setUpdatingPublic] = useState(false)
  const [showCollectionManager, setShowCollectionManager] = useState(false)
  const [userCollections, setUserCollections] = useState([])
  const [selectedCollectionIds, setSelectedCollectionIds] = useState([])
  const [loadingCollections, setLoadingCollections] = useState(false)
  const [updatingCollections, setUpdatingCollections] = useState(false)
  
  // Edit/Duplicate states
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState({ name: '', description: '', format: '', colors: '', archetype: '', cardsText: '' })
  const [saving, setSaving] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  
  // Card preview states
  const [hoveredCard, setHoveredCard] = useState(null)
  const [cardImageUrl, setCardImageUrl] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)

  const translations = {
    it: {
      backToDecks: '← Torna ai Mazzi',
      refreshOwnership: '🔄 Aggiorna Possesso',
      refreshing: 'Aggiornando...',
      showAll: 'Mostra Tutte',
      showMissing: 'Solo Mancanti',
      publicDeck: 'Mazzo Pubblico',
      privateDeck: 'Mazzo Privato',
      publicDesc: 'Visibile nella ricerca mazzi utenti',
      privateDesc: 'Visibile solo a te',
      linkedCollections: 'Collezioni Collegate',
      noCollections: 'Nessuna collezione collegata',
      manageCollections: 'Gestisci Collezioni',
      selectCollections: 'Seleziona Collezioni',
      selectCollectionsDesc: 'Collega una o più collezioni per calcolare il possesso delle carte',
      saveCollections: 'Salva Collezioni',
      cancel: 'Annulla',
      saving: 'Salvando...',
      loadingCollections: 'Caricamento...',
      noCollectionsAvailable: 'Nessuna collezione disponibile',
      createCollectionFirst: 'Crea prima una collezione dalla sezione "📚 Collezione"',
      completion: 'Completamento',
      totalCards: 'Carte Totali',
      ownedCards: 'Possedute',
      missingCards: 'Mancanti',
      cardsList: 'Lista Carte',
      noCards: 'Nessuna carta trovata',
      owned: 'Posseduta',
      missing: 'Mancante',
      quantity: 'Quantità',
      have: 'Hai',
      need: 'Servono',
      editDeck: 'Modifica',
      duplicateDeck: 'Duplica',
      editDeckTitle: 'Modifica Mazzo',
      deckName: 'Nome Mazzo',
      deckDescription: 'Descrizione',
      deckFormat: 'Formato',
      deckColors: 'Colori',
      deckArchetype: 'Archetipo',
      deckCards: 'Carte',
      deckCardsHelp: 'Formato: "4 Lightning Bolt" (una carta per riga)',
      saveChanges: 'Salva Modifiche',
      savingChanges: 'Salvando...',
      duplicating: 'Duplicando...',
      duplicateSuccess: 'Mazzo duplicato!',
      editSuccess: 'Mazzo aggiornato!'
    },
    en: {
      backToDecks: '← Back to Decks',
      refreshOwnership: '🔄 Refresh Ownership',
      refreshing: 'Refreshing...',
      showAll: 'Show All',
      showMissing: 'Missing Only',
      publicDeck: 'Public Deck',
      privateDeck: 'Private Deck',
      publicDesc: 'Visible in user deck search',
      privateDesc: 'Visible only to you',
      linkedCollections: 'Linked Collections',
      noCollections: 'No collections linked',
      manageCollections: 'Manage Collections',
      selectCollections: 'Select Collections',
      selectCollectionsDesc: 'Link one or more collections to calculate card ownership',
      saveCollections: 'Save Collections',
      cancel: 'Cancel',
      saving: 'Saving...',
      loadingCollections: 'Loading...',
      noCollectionsAvailable: 'No collections available',
      createCollectionFirst: 'Create a collection first from "📚 Collection" section',
      completion: 'Completion',
      totalCards: 'Total Cards',
      ownedCards: 'Owned',
      missingCards: 'Missing',
      cardsList: 'Cards List',
      noCards: 'No cards found',
      owned: 'Owned',
      missing: 'Missing',
      quantity: 'Quantity',
      have: 'Have',
      need: 'Need',
      editDeck: 'Edit',
      duplicateDeck: 'Duplicate',
      editDeckTitle: 'Edit Deck',
      deckName: 'Deck Name',
      deckDescription: 'Description',
      deckFormat: 'Format',
      deckColors: 'Colors',
      deckArchetype: 'Archetype',
      deckCards: 'Cards',
      deckCardsHelp: 'Format: "4 Lightning Bolt" (one card per line)',
      saveChanges: 'Save Changes',
      savingChanges: 'Saving...',
      duplicating: 'Duplicating...',
      duplicateSuccess: 'Deck duplicated!',
      editSuccess: 'Deck updated!'
    }
  }

  const t = translations[language]

  useEffect(() => {
    loadDeckDetails()
  }, [deck.id])

  const loadDeckDetails = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/saved-decks/${deck.id}?user_id=${user.userId}`)
      const data = await res.json()
      setDeckDetails(data)
      setIsPublic(data.is_public || false)
      setSelectedCollectionIds(data.collection_ids || [])
    } catch (err) {
      console.error('Error loading deck details:', err)
    }
    setLoading(false)
  }

  const loadUserCollections = async () => {
    setLoadingCollections(true)
    try {
      const res = await fetch(`${API_URL}/api/collections/user/${user.userId}`)
      const data = await res.json()
      setUserCollections(data.collections || [])
    } catch (err) {
      console.error('Error loading collections:', err)
    }
    setLoadingCollections(false)
  }

  const handleOpenCollectionManager = () => {
    setShowCollectionManager(true)
    loadUserCollections()
  }

  const handleToggleCollection = (collectionId) => {
    setSelectedCollectionIds(prev => {
      if (prev.includes(collectionId)) {
        return prev.filter(id => id !== collectionId)
      } else {
        return [...prev, collectionId]
      }
    })
  }

  const handleSaveCollections = async () => {
    setUpdatingCollections(true)
    try {
      const res = await fetch(
        `${API_URL}/api/saved-decks/${deck.id}/collections?user_id=${user.userId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selectedCollectionIds)
        }
      )
      
      if (res.ok) {
        setShowCollectionManager(false)
        await loadDeckDetails() // Reload to get updated ownership
      }
    } catch (err) {
      console.error('Error updating collections:', err)
    }
    setUpdatingCollections(false)
  }

  const handleTogglePublic = async () => {
    setUpdatingPublic(true)
    try {
      const res = await fetch(
        `${API_URL}/api/saved-decks/${deck.id}?is_public=${!isPublic}`,
        { method: 'PUT' }
      )
      
      if (res.ok) {
        setIsPublic(!isPublic)
      }
    } catch (err) {
      console.error('Error updating public status:', err)
    }
    setUpdatingPublic(false)
  }

  const handleOpenEdit = () => {
    if (!deckDetails) return
    const cardsText = deckDetails.cards
      .map(c => `${c.quantity} ${c.card_name}`)
      .join('\n')
    setEditData({
      name: deckDetails.name || '',
      description: deckDetails.description || '',
      format: deckDetails.format || '',
      colors: deckDetails.colors || '',
      archetype: deckDetails.archetype || '',
      cardsText
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const cards = editData.cardsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => {
          const match = line.match(/^(\d+)x?\s+(.+)$/i)
          if (match) {
            return { card_name: match[2].trim(), quantity: parseInt(match[1]) }
          }
          return null
        })
        .filter(Boolean)

      const body = {}
      if (editData.name !== deckDetails.name) body.name = editData.name
      if (editData.description !== (deckDetails.description || '')) body.description = editData.description
      if (editData.format !== (deckDetails.format || '')) body.format = editData.format
      if (editData.colors !== (deckDetails.colors || '')) body.colors = editData.colors
      if (editData.archetype !== (deckDetails.archetype || '')) body.archetype = editData.archetype
      if (cards.length > 0) body.cards = cards

      const res = await fetch(
        `${API_URL}/api/saved-decks/${deck.id}/edit?user_id=${user.userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      )

      if (res.ok) {
        setShowEditModal(false)
        await loadDeckDetails()
      }
    } catch (err) {
      console.error('Error editing deck:', err)
    }
    setSaving(false)
  }

  const handleDuplicate = async () => {
    setDuplicating(true)
    try {
      const res = await fetch(
        `${API_URL}/api/saved-decks/${deck.id}/duplicate?user_id=${user.userId}`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (res.ok) {
        alert(t.duplicateSuccess)
        onBack()
      } else {
        alert(data.detail || 'Error')
      }
    } catch (err) {
      console.error('Error duplicating deck:', err)
    }
    setDuplicating(false)
  }

  const handleRefreshOwnership = async () => {
    setRefreshing(true)
    try {
      const res = await fetch(
        `${API_URL}/api/saved-decks/${deck.id}/refresh-ownership?user_id=${user.userId}`,
        { method: 'POST' }
      )
      const data = await res.json()
      
      // Reload deck details
      await loadDeckDetails()
    } catch (err) {
      console.error('Error refreshing ownership:', err)
    }
    setRefreshing(false)
  }

  const getColorEmoji = (colors) => {
    if (!colors) return '⚪'
    const colorMap = { W: '⚪', U: '🔵', B: '⚫', R: '🔴', G: '🟢' }
    return colors.split(',').map(c => colorMap[c.trim()] || '⚪').join('')
  }

  const getCompletionColor = (percentage) => {
    if (percentage >= 90) return '#68d391'
    if (percentage >= 70) return '#fbbf24'
    if (percentage >= 50) return '#f59e0b'
    return '#f5576c'
  }

  const handleCardHover = async (cardName) => {
    if (!cardName || cardName === hoveredCard) return
    
    setHoveredCard(cardName)
    setImageLoading(true)
    setCardImageUrl(null)
    
    // Usa la cache per ottenere l'immagine
    const imageUrl = await cardImageCache.getCardImage(cardName)
    setCardImageUrl(imageUrl)
    setImageLoading(false)
  }

  const handleCardLeave = () => {
    setHoveredCard(null)
    setCardImageUrl(null)
  }

  const filteredCards = deckDetails?.cards.filter(card => 
    !showMissingOnly || !card.is_owned || card.quantity_missing > 0
  ) || []

  if (loading) {
    return (
      <div className="saved-deck-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (!deckDetails) {
    return (
      <div className="saved-deck-page">
        <p>Deck not found</p>
      </div>
    )
  }

  return (
    <div className="saved-deck-page">
      <header className="deck-detail-header">
        <div className="header-top">
          <button className="back-btn" onClick={onBack}>
            {t.backToDecks}
          </button>
          <div className="header-buttons">
            <button 
              className="edit-btn"
              onClick={handleOpenEdit}
            >
              ✏️ {t.editDeck}
            </button>
            <button 
              className="duplicate-btn"
              onClick={handleDuplicate}
              disabled={duplicating}
            >
              {duplicating ? t.duplicating : `📋 ${t.duplicateDeck}`}
            </button>
            <button 
              className="refresh-btn"
              onClick={handleRefreshOwnership}
              disabled={refreshing}
            >
              {refreshing ? t.refreshing : t.refreshOwnership}
            </button>
          </div>
        </div>

        <div className="deck-title-section">
          <div className="title-row">
            <h1>{deckDetails.name}</h1>
            {deckDetails.colors && (
              <div className="deck-colors-large">{getColorEmoji(deckDetails.colors)}</div>
            )}
          </div>
          
          {deckDetails.description && (
            <p className="deck-description">{deckDetails.description}</p>
          )}

          <div className="deck-controls-row">
            <div className="deck-collections-section">
              {deckDetails.collection_names && deckDetails.collection_names.length > 0 ? (
                <div className="deck-collections-info">
                  <span className="collections-label">{t.linkedCollections}:</span>
                  <div className="collections-tags">
                    {deckDetails.collection_names.map((name, idx) => (
                      <span key={idx} className="collection-tag">
                        📚 {name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="deck-collections-info no-collections">
                  <span className="no-collections-text">⚠️ {t.noCollections}</span>
                </div>
              )}
              <button 
                className="manage-collections-btn"
                onClick={handleOpenCollectionManager}
              >
                ⚙️ {t.manageCollections}
              </button>
            </div>

            <div className="public-toggle">
              <button 
                className={`toggle-public-btn ${isPublic ? 'public' : 'private'}`}
                onClick={handleTogglePublic}
                disabled={updatingPublic}
              >
                {isPublic ? '🌐' : '🔒'} {isPublic ? t.publicDeck : t.privateDeck}
              </button>
              <span className="toggle-desc">{isPublic ? t.publicDesc : t.privateDesc}</span>
            </div>
          </div>

          <div className="deck-meta">
            {deckDetails.format && (
              <span className="meta-tag format-tag">{deckDetails.format.toUpperCase()}</span>
            )}
            {deckDetails.archetype && (
              <span className="meta-tag archetype-tag">{deckDetails.archetype}</span>
            )}
            {deckDetails.source && (
              <span className="meta-tag source-tag">{deckDetails.source}</span>
            )}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{deckDetails.completion_percentage}%</div>
              <div className="stat-label">{t.completion}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🃏</div>
            <div className="stat-content">
              <div className="stat-value">{deckDetails.total_cards}</div>
              <div className="stat-label">{t.totalCards}</div>
            </div>
          </div>

          <div className="stat-card owned">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{deckDetails.owned_cards}</div>
              <div className="stat-label">{t.ownedCards}</div>
            </div>
          </div>

          <div className="stat-card missing">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-value">{deckDetails.missing_cards}</div>
              <div className="stat-label">{t.missingCards}</div>
            </div>
          </div>
        </div>

        <div className="completion-bar-large">
          <div 
            className="completion-fill-large"
            style={{
              width: `${deckDetails.completion_percentage}%`,
              backgroundColor: getCompletionColor(deckDetails.completion_percentage)
            }}
          />
        </div>
      </header>

      <main className="deck-cards-section">
        <div className="cards-header">
          <h2>{t.cardsList} ({filteredCards.length})</h2>
          <div className="filter-toggle">
            <button 
              className={`toggle-btn ${!showMissingOnly ? 'active' : ''}`}
              onClick={() => setShowMissingOnly(false)}
            >
              {t.showAll}
            </button>
            <button 
              className={`toggle-btn ${showMissingOnly ? 'active' : ''}`}
              onClick={() => setShowMissingOnly(true)}
            >
              {t.showMissing}
            </button>
          </div>
        </div>

        {filteredCards.length === 0 ? (
          <div className="no-cards-message">
            <p>{t.noCards}</p>
          </div>
        ) : (
          <div className="cards-grid">
            {filteredCards.map((card) => (
              <div 
                key={card.id} 
                className={`card-item ${card.is_owned && card.quantity_missing === 0 ? 'owned' : 'missing'}`}
                onMouseEnter={() => handleCardHover(card.card_name)}
                onMouseLeave={handleCardLeave}
              >
                <div className="card-main-info">
                  <div className="card-name-section">
                    <span className="card-name">{card.card_name}</span>
                    {card.card_type && (
                      <span className="card-type">{card.card_type}</span>
                    )}
                  </div>
                  
                  <div className="card-quantity-info">
                    <span className="quantity-badge">
                      {card.quantity}x
                    </span>
                  </div>
                </div>

                <div className="card-details">
                  {card.mana_cost && (
                    <span className="mana-cost">{card.mana_cost}</span>
                  )}
                  {card.colors && (
                    <span className="card-colors">{getColorEmoji(card.colors)}</span>
                  )}
                  {card.rarity && (
                    <span className={`rarity-badge ${card.rarity.toLowerCase()}`}>
                      {card.rarity}
                    </span>
                  )}
                </div>

                <div className="ownership-status">
                  {card.is_owned && card.quantity_missing === 0 ? (
                    <div className="status-owned">
                      <span className="status-icon">✅</span>
                      <span className="status-text">{t.owned}</span>
                    </div>
                  ) : (
                    <div className="status-missing">
                      <span className="status-icon">❌</span>
                      <span className="status-text">
                        {card.quantity_owned > 0 
                          ? `${t.have} ${card.quantity_owned}, ${t.need} ${card.quantity_missing}`
                          : `${t.need} ${card.quantity}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Card Preview Tooltip */}
      {hoveredCard && (
        <div className="card-preview-tooltip">
          {imageLoading ? (
            <div className="card-preview-loading">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : cardImageUrl ? (
            <img src={cardImageUrl} alt={hoveredCard} className="card-preview-image" />
          ) : (
            <div className="card-preview-error">
              <p>Image not available</p>
              <small>{hoveredCard}</small>
            </div>
          )}
        </div>
      )}

      {/* Collection Manager Modal */}
      {showCollectionManager && (
        <div className="modal-overlay" onClick={() => setShowCollectionManager(false)}>
          <div className="modal-content collection-manager-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t.selectCollections}</h2>
            <p className="modal-subtitle">{t.selectCollectionsDesc}</p>
            
            {loadingCollections ? (
              <div className="loading-section">
                <div className="spinner"></div>
                <p>{t.loadingCollections}</p>
              </div>
            ) : userCollections.length === 0 ? (
              <div className="no-collections-message">
                <p>{t.noCollectionsAvailable}</p>
                <small>{t.createCollectionFirst}</small>
              </div>
            ) : (
              <div className="collections-list">
                {userCollections.map(collection => (
                  <label 
                    key={collection.id} 
                    className={`collection-checkbox-item ${selectedCollectionIds.includes(collection.id) ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCollectionIds.includes(collection.id)}
                      onChange={() => handleToggleCollection(collection.id)}
                    />
                    <div className="collection-info">
                      <div className="collection-name">📚 {collection.name}</div>
                      <div className="collection-stats">
                        {collection.card_count} carte uniche • {collection.total_cards} totali
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowCollectionManager(false)}
                disabled={updatingCollections}
              >
                {t.cancel}
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleSaveCollections}
                disabled={updatingCollections || loadingCollections}
              >
                {updatingCollections ? (
                  <>
                    <span className="spinner"></span>
                    {t.saving}
                  </>
                ) : (
                  <>✓ {t.saveCollections}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deck Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content edit-deck-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t.editDeckTitle}</h2>
            
            <div className="form-group">
              <label>{t.deckName}</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>{t.deckDescription}</label>
              <input
                type="text"
                value={editData.description}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t.deckFormat}</label>
                <input
                  type="text"
                  value={editData.format}
                  onChange={(e) => setEditData({...editData, format: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>{t.deckColors}</label>
                <input
                  type="text"
                  value={editData.colors}
                  onChange={(e) => setEditData({...editData, colors: e.target.value})}
                  className="form-input"
                  placeholder="W,U,B,R,G"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t.deckArchetype}</label>
              <input
                type="text"
                value={editData.archetype}
                onChange={(e) => setEditData({...editData, archetype: e.target.value})}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>{t.deckCards}</label>
              <textarea
                value={editData.cardsText}
                onChange={(e) => setEditData({...editData, cardsText: e.target.value})}
                className="form-textarea"
                rows="12"
              />
              <small className="form-help">{t.deckCardsHelp}</small>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowEditModal(false)}
                disabled={saving}
              >
                {t.cancel}
              </button>
              <button 
                className="confirm-btn"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner"></span>
                    {t.savingChanges}
                  </>
                ) : (
                  <>✓ {t.saveChanges}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="deck-footer">
        <p>Magic Deck Builder © 2026</p>
      </footer>
    </div>
  )
}

export default SavedDeck
