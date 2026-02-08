import { useState, useEffect } from 'react'
import './Collection.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function Collection({ user, collection, onBack, language, onShowSubscriptions, onUploadComplete }) {
  const [cards, setCards] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showUploadModal, setShowUploadModal] = useState(false)
  
  // Upload states
  const [uploading, setUploading] = useState(false)
  const [showColumnMapper, setShowColumnMapper] = useState(false)
  const [fileToUpload, setFileToUpload] = useState(null)
  const [fileColumns, setFileColumns] = useState([])
  const [columnMapping, setColumnMapping] = useState({})
  const [filePreview, setFilePreview] = useState([])
  const [totalRows, setTotalRows] = useState(0)
  const [uploadMessage, setUploadMessage] = useState('')
  
  // Rename collection states
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [renaming, setRenaming] = useState(false)
  
  // Edit quantity states
  const [editingCardId, setEditingCardId] = useState(null)
  const [editQuantity, setEditQuantity] = useState('')
  
  // Card preview states
  const [hoveredCard, setHoveredCard] = useState(null)
  const [cardImageUrl, setCardImageUrl] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)

  // Debug: verify onShowSubscriptions is available
  console.log('Collection mounted - onShowSubscriptions type:', typeof onShowSubscriptions, 'value:', !!onShowSubscriptions)

  const translations = {
    it: {
      title: 'Collezione',
      backToCollections: '← Torna alle Collezioni',
      uploadCards: '📁 Carica Carte',
      search: 'Cerca carte...',
      sortBy: 'Ordina per:',
      name: 'Nome',
      quantity: 'Quantità',
      type: 'Tipo',
      colors: 'Colori',
      loading: 'Caricamento...',
      noCards: 'Nessuna carta nella collezione',
      noCardsYet: 'Non hai ancora caricato nessuna carta',
      uploadFirst: 'Carica un file Excel o CSV per iniziare a costruire la tua collezione',
      stats: 'Statistiche',
      totalUnique: 'Carte uniche',
      totalCards: 'Carte totali',
      colorDistribution: 'Distribuzione colori',
      typeDistribution: 'Distribuzione tipi',
      page: 'Pagina',
      of: 'di',
      previous: 'Precedente',
      next: 'Successivo',
      close: 'Chiudi',
      limitedView: '⚠️ Piano Free: limite di 20 carte uniche per collezione',
      upgradeToView: 'Aggiorna il tuo piano per vedere tutte le',
      upgradeWarning: '⚠️ Ti rimangono solo',
      cardsRemaining: 'carte uniche disponibili',
      upgradePlan: 'Aggiorna Piano',
      lockedCard: '🔒 Aggiorna piano',
      cards: 'carte',
      viewable: 'Visualizzabili',
      asc: 'Crescente',
      desc: 'Decrescente',
      uploadTitle: 'Carica Carte nella Collezione',
      selectFile: 'Seleziona File Excel o CSV',
      uploading: 'Caricamento...',
      mapColumns: '📋 Mappa le Colonne del File',
      rowsFound: 'righe. Seleziona quale colonna del tuo file corrisponde a ciascun campo.',
      cardName: 'Nome Carta',
      quantity: 'Quantità',
      cardType: 'Tipo Carta',
      manaCost: 'Costo Mana',
      rarity: 'Rarità',
      optional: '-- Opzionale --',
      selectColumn: '-- Seleziona colonna --',
      preview: 'Anteprima Dati (prime 5 righe)',
      cancel: 'Annulla',
      confirm: '✓ Conferma e Carica',
      required: '*',
      mustMapColumns: '⚠️ Devi mappare almeno le colonne Nome e Quantità',
      errorAnalyzing: 'Errore: Impossibile analizzare il file',
      errorUploading: 'Errore nel caricamento del file',
      renameCollection: 'Rinomina Collezione',
      collectionName: 'Nome Collezione',
      save: 'Salva',
      editQuantity: 'Modifica Quantità',
      remove: 'Rimuovi',
      quantityUpdated: 'Quantità aggiornata',
      cardRemoved: 'Carta rimossa'
    },
    en: {
      title: 'Collection',
      backToCollections: '← Back to Collections',
      uploadCards: '📁 Upload Cards',
      search: 'Search cards...',
      sortBy: 'Sort by:',
      name: 'Name',
      quantity: 'Quantity',
      type: 'Type',
      colors: 'Colors',
      loading: 'Loading...',
      noCards: 'No cards in collection',
      noCardsYet: 'You haven\'t uploaded any cards yet',
      uploadFirst: 'Upload an Excel or CSV file to start building your collection',
      stats: 'Statistics',
      totalUnique: 'Unique cards',
      totalCards: 'Total cards',
      colorDistribution: 'Color distribution',
      typeDistribution: 'Type distribution',
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
      close: 'Close',
      limitedView: '⚠️ Free Plan: limit of 20 unique cards per collection',
      upgradeToView: 'Upgrade your plan to view all',
      upgradeWarning: '⚠️ You only have',
      cardsRemaining: 'unique cards remaining',
      upgradePlan: 'Upgrade Plan',
      lockedCard: '🔒 Upgrade plan',
      cards: 'cards',
      viewable: 'Viewable',
      asc: 'Ascending',
      desc: 'Descending',
      uploadTitle: 'Upload Cards to Collection',
      selectFile: 'Select Excel or CSV File',
      uploading: 'Uploading...',
      mapColumns: '📋 Map File Columns',
      rowsFound: 'rows found. Select which column from your file corresponds to each field.',
      cardName: 'Card Name',
      quantity: 'Quantity',
      cardType: 'Card Type',
      manaCost: 'Mana Cost',
      rarity: 'Rarity',
      optional: '-- Optional --',
      selectColumn: '-- Select column --',
      preview: 'Data Preview (first 5 rows)',
      cancel: 'Cancel',
      confirm: '✓ Confirm and Upload',
      required: '*',
      mustMapColumns: '⚠️ You must map at least Name and Quantity columns',
      errorAnalyzing: 'Error: Unable to analyze file',
      errorUploading: 'Error uploading file',
      renameCollection: 'Rename Collection',
      collectionName: 'Collection Name',
      save: 'Save',
      editQuantity: 'Edit Quantity',
      remove: 'Remove',
      quantityUpdated: 'Quantity updated',
      cardRemoved: 'Card removed'
    }
  }

  const t = translations[language]

  useEffect(() => {
    loadCollection()
    loadStats()
  }, [page, search, sortBy, sortOrder])

  const loadCollection = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '50',
        sort_by: sortBy,
        sort_order: sortOrder
      })
      
      if (collection) {
        params.append('collection_id', collection.id.toString())
      }
      
      if (search) {
        params.append('search', search)
      }

      const res = await fetch(`${API_URL}/api/cards/collection/${user.userId}?${params}`)
      const data = await res.json()
      
      setCards(data.cards)
      setPagination(data.pagination)
    } catch (err) {
      console.error('Error loading collection:', err)
    }
    setLoading(false)
  }

  const loadStats = async () => {
    try {
      const params = new URLSearchParams()
      if (collection) {
        params.append('collection_id', collection.id.toString())
      }
      
      const res = await fetch(`${API_URL}/api/cards/collection/${user.userId}/stats?${params}`)
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const handleSearch = (value) => {
    setSearch(value)
    setPage(1)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const getColorEmoji = (colors) => {
    if (!colors) return '⚪'
    const colorMap = { W: '⚪', U: '🔵', B: '⚫', R: '🔴', G: '🟢' }
    return colors.split('/').map(c => colorMap[c] || '⚪').join('')
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setUploadMessage('')
    
    // Analyze file to get columns
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_URL}/api/cards/analyze/${user.userId}`, {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        setUploadMessage(`${t.errorAnalyzing}: ${errorData.detail || ''}`)
        setUploading(false)
        e.target.value = ''
        return
      }
      
      const data = await res.json()
      
      // Show column mapper
      setFileToUpload(file)
      setFileColumns(data.columns)
      setColumnMapping(data.suggested_mapping)
      setFilePreview(data.preview)
      setTotalRows(data.total_rows)
      setShowUploadModal(false)
      setShowColumnMapper(true)
      
    } catch (err) {
      console.error('Error analyzing file:', err)
      setUploadMessage(t.errorAnalyzing)
    }
    setUploading(false)
    e.target.value = ''
  }

  const confirmUpload = async () => {
    if (!fileToUpload) return
    
    // Verify name and quantity are mapped
    if (!columnMapping.name || !columnMapping.quantity) {
      setUploadMessage(t.mustMapColumns)
      return
    }
    
    setUploading(true)
    setUploadMessage('')
    
    const formData = new FormData()
    formData.append('file', fileToUpload)
    formData.append('mapping', JSON.stringify(columnMapping))
    if (collection) {
      formData.append('collection_id', collection.id.toString())
    }

    try {
      const res = await fetch(`${API_URL}/api/cards/upload/${user.userId}`, {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        setUploadMessage(`${t.errorUploading}: ${errorData.detail || ''}`)
        setUploading(false)
        return
      }
      
      const data = await res.json()
      setUploadMessage(`✓ ${data.message}`)
      
      // Close mapper and reload collection
      setShowColumnMapper(false)
      setFileToUpload(null)
      loadCollection()
      loadStats()
      
      // Notify parent to reload subscription status
      if (onUploadComplete) {
        onUploadComplete()
      }
      
    } catch (err) {
      console.error('Error uploading:', err)
      setUploadMessage(t.errorUploading)
    }
    setUploading(false)
  }

  const cancelUpload = () => {
    setShowColumnMapper(false)
    setShowUploadModal(false)
    setFileToUpload(null)
    setFileColumns([])
    setColumnMapping({})
    setFilePreview([])
    setUploadMessage('')
  }

  const updateMapping = (field, column) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: column === '' ? null : column
    }))
  }

  const handleRenameCollection = async () => {
    if (!newCollectionName.trim() || !collection) return
    
    setRenaming(true)
    try {
      const res = await fetch(`${API_URL}/api/collections/${collection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName })
      })
      
      if (res.ok) {
        collection.name = newCollectionName
        setShowRenameModal(false)
        setNewCollectionName('')
      }
    } catch (err) {
      console.error('Error renaming collection:', err)
    }
    setRenaming(false)
  }

  const handleUpdateQuantity = async (cardId, newQuantity) => {
    try {
      const res = await fetch(`${API_URL}/api/cards/card/${cardId}/quantity?quantity=${newQuantity}`, {
        method: 'PUT'
      })
      
      if (res.ok) {
        const data = await res.json()
        setUploadMessage(data.deleted ? `✓ ${t.cardRemoved}` : `✓ ${t.quantityUpdated}`)
        setEditingCardId(null)
        setEditQuantity('')
        loadCollection()
        loadStats()
        
        // Clear message after 2 seconds
        setTimeout(() => setUploadMessage(''), 2000)
      }
    } catch (err) {
      console.error('Error updating quantity:', err)
    }
  }

  const startEditQuantity = (card) => {
    setEditingCardId(card.id)
    setEditQuantity(card.quantity.toString())
  }

  const cancelEditQuantity = () => {
    setEditingCardId(null)
    setEditQuantity('')
  }

  const handleCardHover = async (cardName) => {
    if (!cardName || cardName === hoveredCard) return
    
    setHoveredCard(cardName)
    setImageLoading(true)
    setCardImageUrl(null)
    
    try {
      // Cerca l'immagine nella cartella public/card-images
      // Il nome del file è l'UUID della carta, quindi dobbiamo fare una ricerca
      // Per ora usiamo l'API Scryfall come fallback
      const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`)
      
      if (response.ok) {
        const data = await response.json()
        setCardImageUrl(data.image_uris?.normal || data.image_uris?.small)
      }
    } catch (err) {
      console.error('Error loading card image:', err)
    } finally {
      setImageLoading(false)
    }
  }

  const handleCardLeave = () => {
    setHoveredCard(null)
    setCardImageUrl(null)
  }

  return (
    <div className="collection-page">
      <header className="collection-header">
        <div className="header-top">
          <button className="back-btn" onClick={onBack}>
            {t.backToCollections}
          </button>
          <div className="header-actions">
            <span className="user-email">{user.email}</span>
            <button 
              className="subscription-btn-small" 
              onClick={(e) => {
                e.stopPropagation()
                console.log('Subscription button (💎) clicked!')
                onShowSubscriptions && onShowSubscriptions()
              }}
            >
              💎
            </button>
          </div>
        </div>
        <div className="header-title-row">
          <h1>{collection ? collection.name : t.title}</h1>
          <div className="header-buttons">
            {collection && (
              <button 
                className="rename-btn" 
                onClick={() => {
                  setNewCollectionName(collection.name)
                  setShowRenameModal(true)
                }}
              >
                ✏️
              </button>
            )}
            <button className="upload-cards-btn" onClick={() => setShowUploadModal(true)}>
              {t.uploadCards}
            </button>
          </div>
        </div>
        {collection && collection.description && (
          <p className="collection-description">{collection.description}</p>
        )}
      </header>

      <main className="collection-main">
        {stats && stats.limited && (
          <div 
            className="limited-warning clickable" 
            onClick={(e) => {
              e.stopPropagation()
              console.log('Limited warning clicked!')
              onShowSubscriptions && onShowSubscriptions()
            }}
          >
            {t.limitedView}
            <br />
            <small>
              {t.upgradeToView} {stats.total_unique_cards} {t.cards}
            </small>
          </div>
        )}

        {stats && stats.show_upgrade_warning && !stats.limited && (
          <div className="upgrade-warning">
            {t.upgradeWarning} {stats.cards_remaining} {t.cardsRemaining}
            <button 
              className="upgrade-btn-inline" 
              onClick={(e) => {
                e.stopPropagation()
                console.log('Upgrade button clicked!')
                onShowSubscriptions && onShowSubscriptions()
              }}
            >
              {t.upgradePlan}
            </button>
          </div>
        )}

        {stats && (
          <div className="collection-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.viewable_cards}</div>
              <div className="stat-label">{t.viewable}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.total_unique_cards}</div>
              <div className="stat-label">{t.totalUnique}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.total_cards}</div>
              <div className="stat-label">{t.totalCards}</div>
            </div>
          </div>
        )}

        <div className="collection-controls">
          <input
            type="text"
            className="search-input"
            placeholder={t.search}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          
          <div className="sort-controls">
            <label>{t.sortBy}</label>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
              <option value="name">{t.name}</option>
              <option value="quantity">{t.quantity}</option>
              <option value="type">{t.type}</option>
              <option value="colors">{t.colors}</option>
            </select>
            <button 
              className="sort-order-btn"
              onClick={() => { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); setPage(1); }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{t.loading}</p>
          </div>
        ) : stats && stats.total_unique_cards === 0 ? (
          <div className="no-cards-empty">
            <div className="empty-icon">📚</div>
            <h3>{t.noCardsYet}</h3>
            <p>{t.uploadFirst}</p>
            <button className="back-to-main-btn" onClick={() => setShowUploadModal(true)}>
              {t.uploadCards}
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="no-cards">
            <p>{t.noCards}</p>
          </div>
        ) : (
          <>
            <div className="cards-table">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')} className="sortable">
                      {t.name} {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('quantity')} className="sortable">
                      {t.quantity} {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('type')} className="sortable">
                      {t.type} {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('colors')} className="sortable">
                      {t.colors} {sortBy === 'colors' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="actions-header">{language === 'it' ? 'Azioni' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr 
                      key={card.id} 
                      className={card.locked ? 'locked-row' : ''}
                      onMouseEnter={() => !card.locked && handleCardHover(card.name)}
                      onMouseLeave={handleCardLeave}
                    >
                      <td className="card-name">
                        {card.locked ? (
                          <span className="locked-overlay">
                            <span className="blur-text">{card.name}</span>
                            <span className="lock-badge">{t.lockedCard}</span>
                          </span>
                        ) : (
                          card.name
                        )}
                      </td>
                      <td className="card-quantity">
                        {card.locked ? (
                          <span className="blur-text">{card.quantity}</span>
                        ) : editingCardId === card.id ? (
                          <div className="quantity-edit">
                            <input
                              type="number"
                              min="0"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              className="quantity-input"
                              autoFocus
                            />
                            <button 
                              className="save-qty-btn"
                              onClick={() => handleUpdateQuantity(card.id, parseInt(editQuantity))}
                            >
                              ✓
                            </button>
                            <button 
                              className="cancel-qty-btn"
                              onClick={cancelEditQuantity}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          card.quantity
                        )}
                      </td>
                      <td className="card-type">
                        {card.locked ? <span className="blur-text">{card.type}</span> : card.type}
                      </td>
                      <td className="card-colors">
                        {card.locked ? <span className="blur-text">{getColorEmoji(card.colors)}</span> : getColorEmoji(card.colors)}
                      </td>
                      <td className="card-actions">
                        {!card.locked && editingCardId !== card.id && (
                          <button 
                            className="edit-qty-btn"
                            onClick={() => startEditQuantity(card)}
                            title={t.editQuantity}
                          >
                            ✏️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.total_pages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setPage(page - 1)} 
                  disabled={!pagination.has_prev}
                  className="pagination-btn"
                >
                  {t.previous}
                </button>
                <span className="pagination-info">
                  {t.page} {page} {t.of} {pagination.total_pages}
                </span>
                <button 
                  onClick={() => setPage(page + 1)} 
                  disabled={!pagination.has_next}
                  className="pagination-btn"
                >
                  {t.next}
                </button>
              </div>
            )}
          </>
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

      <footer className="collection-footer">
        <p>Magic Deck Builder © 2026</p>
      </footer>

      {/* Rename Collection Modal */}
      {showRenameModal && (
        <div className="modal-overlay">
          <div className="modal-content rename-modal">
            <h2>{t.renameCollection}</h2>
            <div className="form-group">
              <label>{t.collectionName}</label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowRenameModal(false)
                  setNewCollectionName('')
                }}
              >
                {t.cancel}
              </button>
              <button 
                className="confirm-btn"
                onClick={handleRenameCollection}
                disabled={!newCollectionName.trim() || renaming}
              >
                {renaming ? `${t.save}...` : t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content upload-modal">
            <h2>{t.uploadTitle}</h2>
            {uploadMessage && <div className="upload-message">{uploadMessage}</div>}
            <label className={`upload-btn-modal ${uploading ? 'disabled' : ''}`}>
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  {t.uploading}
                </>
              ) : (
                t.selectFile
              )}
              <input 
                type="file" 
                accept=".xlsx,.csv" 
                onChange={handleFileSelect} 
                hidden 
                disabled={uploading} 
              />
            </label>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={cancelUpload}>
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Mapper Modal */}
      {showColumnMapper && (
        <div className="modal-overlay">
          <div className="modal-content column-mapper">
            <h2>{t.mapColumns}</h2>
            <p className="modal-subtitle">
              {totalRows} {t.rowsFound}
            </p>
            
            {uploadMessage && <div className="upload-message">{uploadMessage}</div>}
            
            <div className="mapping-grid">
              <div className="mapping-row required-field">
                <label>{t.cardName} <span className="required">{t.required}</span></label>
                <select 
                  value={columnMapping.name || ''} 
                  onChange={(e) => updateMapping('name', e.target.value)}
                >
                  <option value="">{t.selectColumn}</option>
                  {fileColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              
              <div className="mapping-row required-field">
                <label>{t.quantity} <span className="required">{t.required}</span></label>
                <select 
                  value={columnMapping.quantity || ''} 
                  onChange={(e) => updateMapping('quantity', e.target.value)}
                >
                  <option value="">{t.selectColumn}</option>
                  {fileColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              
              <div className="mapping-row">
                <label>{t.cardType}</label>
                <select 
                  value={columnMapping.card_type || ''} 
                  onChange={(e) => updateMapping('card_type', e.target.value)}
                >
                  <option value="">{t.optional}</option>
                  {fileColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              
              <div className="mapping-row">
                <label>{t.colors}</label>
                <select 
                  value={columnMapping.colors || ''} 
                  onChange={(e) => updateMapping('colors', e.target.value)}
                >
                  <option value="">{t.optional}</option>
                  {fileColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              
              <div className="mapping-row">
                <label>{t.manaCost}</label>
                <select 
                  value={columnMapping.mana_cost || ''} 
                  onChange={(e) => updateMapping('mana_cost', e.target.value)}
                >
                  <option value="">{t.optional}</option>
                  {fileColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              
              <div className="mapping-row">
                <label>{t.rarity}</label>
                <select 
                  value={columnMapping.rarity || ''} 
                  onChange={(e) => updateMapping('rarity', e.target.value)}
                >
                  <option value="">{t.optional}</option>
                  {fileColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {filePreview.length > 0 && (
              <div className="preview-section">
                <h3>{t.preview}</h3>
                <div className="preview-table-container">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {fileColumns.map(col => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filePreview.map((row, idx) => (
                        <tr key={idx}>
                          {fileColumns.map(col => (
                            <td key={col}>{String(row[col] || '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={cancelUpload}>
                {t.cancel}
              </button>
              <button 
                className="confirm-btn" 
                onClick={confirmUpload}
                disabled={!columnMapping.name || !columnMapping.quantity || uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    {t.uploading}
                  </>
                ) : (
                  t.confirm
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Collection
