import React, { useState, useEffect, useRef } from 'react'
import './SavedDeck.css'
import { cardImageCache } from '../utils/cardImageCache'
import { exportDeckCSV, exportDeckManaBox, exportDeckXLSX, exportDeckTXT } from '../utils/exportCards'

const CardDetailImage = React.memo(function CardDetailImage({ card, language }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const loadImage = async () => {
      try {
        const scryfallUrl = await cardImageCache.getCardImage(card.name_en || card.name, card.scryfallId, language)
        if (mounted) {
          setImageUrl(scryfallUrl)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) setLoading(false)
      }
    }
    loadImage()
    return () => { mounted = false }
  }, [card.name, card.name_en, card.scryfallId, language])

  if (loading) {
    return (
      <div className="card-detail-image-placeholder">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }
  if (!imageUrl) {
    return (
      <div className="card-detail-image-placeholder">
        <p>Image Not Found</p>
      </div>
    )
  }
  return <img src={imageUrl} alt={card.name} className="card-detail-image" />
})

function CardArtBackground({ cardName }) {
  const [artUrl, setArtUrl] = useState(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    cardImageCache.getCardArt(cardName, 'en').then(url => {
      if (mounted.current) setArtUrl(url)
    })
    return () => { mounted.current = false }
  }, [cardName])
  if (!artUrl) return null
  return (
    <div className="card-art-bg" style={{ backgroundImage: `url(${artUrl})` }} />
  )
}

const API_URL = import.meta.env.PROD 
  ? 'https://api.mtgdecksbuilder.com' 
  : 'http://localhost:8000'

function SavedDeck({ user, deck, onBack, language, onLimitError }) {
  const [deckDetails, setDeckDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMissingOnly, setShowMissingOnly] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
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
  
  // Copy state
  const [copySuccess, setCopySuccess] = useState(false)
  // Export
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  // Card detail modal
  const [selectedCard, setSelectedCard] = useState(null)

  const translations = {
    it: {
      backToDecks: '← Torna ai Mazzi',
      refreshOwnership: '🔄 Aggiorna Possesso',
      refreshing: 'Aggiornando...',
      showAll: 'Mostra Tutte',
      showMissing: 'Solo Mancanti',
      publicDeck: 'Pubblico',
      privateDeck: 'Privato',
      publicDesc: 'Visibile nella ricerca mazzi utenti',
      privateDesc: 'Visibile solo a te',
      linkedCollections: 'Collezioni Collegate',
      noCollections: 'Nessuna collezione collegata',
      manageCollections: 'Gestisci',
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
      editSuccess: 'Mazzo aggiornato!',
      copyMTGO: 'Copia Lista MTGO',
      exportBtn: '⬇️ Esporta',
      exportCSV: 'CSV generico',
      exportManaBox: 'ManaBox CSV',
      exportXLSX: 'Excel (.xlsx)',
      exportTXT: 'Testo MTGA/MTGO',
      copied: 'Copiato!',
      gridView: 'Griglia',
      listView: 'Lista',
      rarity: 'Rarità',
      set: 'Set',
      artist: 'Artista',
      legalities: 'Legalità'
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
      editSuccess: 'Deck updated!',
      copyMTGO: 'Copy MTGO List',
      exportBtn: '⬇️ Export',
      exportCSV: 'Generic CSV',
      exportManaBox: 'ManaBox CSV',
      exportXLSX: 'Excel (.xlsx)',
      exportTXT: 'MTGA/MTGO Text',
      copied: 'Copied!',
      gridView: 'Grid',
      listView: 'List',
      rarity: 'Rarity',
      set: 'Set',
      artist: 'Artist',
      legalities: 'Legalities'
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
      } else if (res.status === 403 && onLimitError) {
        onLimitError(data.detail)
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
        >
          {style.label}
        </span>
      )
    })
  }

  const manaSymbolMap = {
    W: { color: '#F9FAF4', textColor: '#333', label: 'W' },
    U: { color: '#0E68AB', textColor: '#fff', label: 'U' },
    B: { color: '#2B2B2B', textColor: '#fff', label: 'B' },
    R: { color: '#D32029', textColor: '#fff', label: 'R' },
    G: { color: '#00733E', textColor: '#fff', label: 'G' },
    C: { color: '#888', textColor: '#fff', label: 'C' },
  }

  const renderManaCost = (manaCost) => {
    if (!manaCost) return null
    const symbols = manaCost.match(/\{([^}]+)\}/g)
    if (!symbols) return <span className="mana-cost-text">{manaCost}</span>
    return (
      <span className="mana-symbols">
        {symbols.map((sym, i) => {
          const val = sym.replace(/[{}]/g, '')
          const mapped = manaSymbolMap[val]
          if (mapped) {
            return (
              <span key={i} className="mana-symbol" style={{ background: mapped.color, color: mapped.textColor }}>
                {mapped.label}
              </span>
            )
          }
          return (
            <span key={i} className="mana-symbol mana-generic">
              {val}
            </span>
          )
        })}
      </span>
    )
  }

  const getCompletionColor = (percentage) => {
    if (percentage >= 90) return '#68d391'
    if (percentage >= 70) return '#fbbf24'
    if (percentage >= 50) return '#f59e0b'
    return '#f5576c'
  }

  const openCardDetail = async (cardName) => {
    try {
      const res = await fetch(`${API_URL}/api/mtg-cards/search?query=${encodeURIComponent(cardName)}&page_size=1&language=${language}`)
      if (res.ok) {
        const data = await res.json()
        if (data.cards && data.cards.length > 0) {
          const card = data.cards[0]
          const detailRes = await fetch(`${API_URL}/api/mtg-cards/card/${card.uuid}?language=${language}`)
          if (detailRes.ok) {
            const detailData = await detailRes.json()
            setSelectedCard(detailData)
          }
        }
      }
    } catch (err) {
      console.error('Error loading card detail:', err)
    }
  }

  const handleCopyMTGO = () => {
    if (!deckDetails?.cards) return
    const mtgoList = deckDetails.cards
      .map(card => `${card.quantity} ${card.card_name}`)
      .join('\n')
    navigator.clipboard.writeText(mtgoList).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
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
        </div>

        <div className="deck-title-section">
          <div className="title-row">
            <h1>{deckDetails.name}</h1>
            <div className="deck-colors-large">
              {deckDetails.colors ? renderDeckColors(deckDetails.colors) : (
                <span className="deck-color-pip" style={{ background: '#888', borderColor: '#666', color: '#fff' }}>C</span>
              )}
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
          
          {deckDetails.description && (
            <p className="deck-description">{deckDetails.description}</p>
          )}

          <div className="deck-collections-row">
            {deckDetails.collection_names && deckDetails.collection_names.length > 0 ? (
              <div className="collections-tags">
                <span className="collections-label">{t.linkedCollections}:</span>
                {deckDetails.collection_names.map((name, idx) => (
                  <span key={idx} className="collection-tag">📚 {name}</span>
                ))}
              </div>
            ) : (
              <span className="no-collections-text">⚠️ {t.noCollections}</span>
            )}
            <button 
              className="manage-collections-btn"
              onClick={handleOpenCollectionManager}
            >
              ⚙️ {t.manageCollections}
            </button>
          </div>
        </div>

        <div className="stats-actions-row">
          <div className="stats-grid">
            <div 
              className={`stat-card visibility ${updatingPublic ? 'disabled' : ''}`}
              onClick={() => !updatingPublic && handleTogglePublic()}
            >
              <div className="stat-icon">{isPublic ? '🌐' : '🔒'}</div>
              <div className="stat-content">
                <div className={`stat-value visibility-label ${isPublic ? 'public' : 'private'}`}>
                  {isPublic ? t.publicDeck : t.privateDeck}
                </div>
              </div>
            </div>
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

          <div className="deck-actions">
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
          <div className="cards-header-controls">
            <button 
              className={`copy-mtgo-btn ${copySuccess ? 'copied' : ''}`}
              onClick={handleCopyMTGO}
            >
              {copySuccess ? `✅ ${t.copied}` : `📋 ${t.copyMTGO}`}
            </button>
            {/* Export dropdown */}
            <div className="export-dropdown-wrapper">
              <button className="export-btn" onClick={() => setShowExportMenu(v => !v)}>
                {t.exportBtn}
              </button>
              {showExportMenu && (
                <div className="export-menu">
                  {[
                    { key: 'csv',     label: t.exportCSV },
                    { key: 'manabox', label: t.exportManaBox },
                    { key: 'xlsx',    label: t.exportXLSX },
                    { key: 'txt',     label: t.exportTXT },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => {
                      setShowExportMenu(false)
                      const cards = deckDetails?.cards || []
                      const name = deckDetails?.name || 'deck'
                      if (opt.key === 'csv')     exportDeckCSV(cards, name)
                      if (opt.key === 'manabox') exportDeckManaBox(cards, name)
                      if (opt.key === 'xlsx')    exportDeckXLSX(cards, name)
                      if (opt.key === 'txt')     exportDeckTXT(cards, name)
                    }}>{opt.label}</button>
                  ))}
                </div>
              )}
            </div>
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
            <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ▦ {t.gridView}
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰ {t.listView}
            </button>
            </div>
          </div>
        </div>

        {filteredCards.length === 0 ? (
          <div className="no-cards-message">
            <p>{t.noCards}</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="cards-list-table">
            <div className="list-header-row">
              <span className="list-col-name">{t.cardsList}</span>
              <span className="list-col-type">Tipo</span>
              <span className="list-col-mana">Mana</span>
              <span className="list-col-qty">Qty</span>
              <span className="list-col-status">Status</span>
            </div>
            {filteredCards.map((card) => (
              <div 
                key={card.id} 
                className={`list-card-row ${card.is_owned && card.quantity_missing === 0 ? 'owned' : 'missing'}`}
                onClick={() => openCardDetail(card.card_name)}
              >
                <span className="list-col-name">{card.card_name}</span>
                <span className="list-col-type">{card.card_type || '—'}</span>
                <span className="list-col-mana">
                  {card.mana_cost ? renderManaCost(card.mana_cost) : '—'}
                </span>
                <span className="list-col-qty">{card.quantity}x</span>
                <span className="list-col-status">
                  {card.is_owned && card.quantity_missing === 0 ? (
                    <span className="status-owned-badge">✅ {t.owned}</span>
                  ) : (
                    <span className="status-missing-badge">
                      ❌ {card.quantity_owned > 0 
                        ? `${t.have} ${card.quantity_owned}, ${t.need} ${card.quantity_missing}`
                        : `${t.need} ${card.quantity}`
                      }
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="cards-grid">
            {filteredCards.map((card) => (
              <div 
                key={card.id} 
                className={`card-item ${card.is_owned && card.quantity_missing === 0 ? 'owned' : 'missing'}`}
                onClick={() => openCardDetail(card.card_name)}
              >
                <CardArtBackground cardName={card.card_name} />
                <div className="card-item-content">
                  <div className="card-top-row">
                    <span className="card-name">{card.card_name}</span>
                    <span className="quantity-badge">{card.quantity}x</span>
                  </div>
                  {card.card_type && (
                    <div className="card-type-row">{card.card_type}</div>
                  )}
                  <div className="card-bottom-row">
                    {card.mana_cost && (
                      <span className="mana-cost">{renderManaCost(card.mana_cost)}</span>
                    )}
                    <div className="ownership-status">
                      {card.is_owned && card.quantity_missing === 0 ? (
                        <span className="status-owned-badge">✅ {t.owned}</span>
                      ) : (
                        <span className="status-missing-badge">
                          ❌ {card.quantity_owned > 0 
                            ? `${t.have} ${card.quantity_owned}, ${t.need} ${card.quantity_missing}`
                            : `${t.need} ${card.quantity}`
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="modal-overlay" onClick={() => setSelectedCard(null)}>
          <div className="modal-content card-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setSelectedCard(null)}>✕</button>
            
            <div className="card-detail-content">
              <div className="card-detail-image-wrapper">
                <CardDetailImage card={selectedCard} language={language} />
              </div>
              
              <div className="card-detail-info">
                <h2>{selectedCard.name}</h2>
                {language === 'it' && selectedCard.name_en && selectedCard.name !== selectedCard.name_en && (
                  <p className="detail-name-en">{selectedCard.name_en}</p>
                )}
                {selectedCard.mana_cost && <p className="detail-mana">{renderManaCost(selectedCard.mana_cost)}</p>}
                <p className="detail-type">{selectedCard.type}</p>
                {language === 'it' && selectedCard.type_en && selectedCard.type !== selectedCard.type_en && (
                  <p className="detail-type-en">{selectedCard.type_en}</p>
                )}
                
                {selectedCard.text && (
                  <div className="detail-text">
                    {selectedCard.text.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                )}
                
                {(selectedCard.power || selectedCard.toughness) && (
                  <p className="detail-pt">
                    <strong>P/T:</strong> {selectedCard.power}/{selectedCard.toughness}
                  </p>
                )}
                
                {selectedCard.loyalty && (
                  <p className="detail-loyalty">
                    <strong>Loyalty:</strong> {selectedCard.loyalty}
                  </p>
                )}
                
                <div className="detail-meta">
                  <p><strong>{t.rarity}:</strong> {selectedCard.rarity}</p>
                  <p><strong>{t.set}:</strong> {selectedCard.set_code}</p>
                  {selectedCard.artist && <p><strong>{t.artist}:</strong> {selectedCard.artist}</p>}
                </div>
                
                {selectedCard.legalities && Object.keys(selectedCard.legalities).length > 0 && (
                  <div className="detail-legalities">
                    <strong>{t.legalities}:</strong>
                    <div className="legalities-grid">
                      {Object.entries(selectedCard.legalities).map(([format, status]) => (
                        <span key={format} className={`legality-badge ${status.toLowerCase()}`}>
                          {format}: {status}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
