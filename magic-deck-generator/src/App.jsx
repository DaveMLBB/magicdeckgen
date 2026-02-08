import { useState, useEffect } from 'react'
import './App.css'
import Auth from './components/Auth'
import Subscriptions from './components/Subscriptions'
import Collection from './components/Collection'
import CollectionsList from './components/CollectionsList'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'it')
  const [cards, setCards] = useState([])
  const [decks, setDecks] = useState([])
  const [deckLoading, setDeckLoading] = useState(false)
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [message, setMessage] = useState('')
  const [showSubscriptions, setShowSubscriptions] = useState(false)
  const [currentView, setCurrentView] = useState('main') // 'main', 'collections', 'collection-detail'
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [hasShownSubscriptionModal, setHasShownSubscriptionModal] = useState(false)
  const [filters, setFilters] = useState({
    colors: [],
    minMatch: 10,
    buildableOnly: false,
    formats: []
  })
  const [availableFormats, setAvailableFormats] = useState([])
  
  // Stati per il mapping delle colonne
  const [showColumnMapper, setShowColumnMapper] = useState(false)
  const [fileToUpload, setFileToUpload] = useState(null)
  const [fileColumns, setFileColumns] = useState([])
  const [columnMapping, setColumnMapping] = useState({})
  const [filePreview, setFilePreview] = useState([])
  const [totalRows, setTotalRows] = useState(0)

  // Traduzioni
  const translations = {
    it: {
      title: '🃏 Magic Deck Matcher',
      subtitle: 'Carica le tue carte e scopri quali mazzi competitivi puoi costruire',
      uploadBtn: '📁 Carica Collezione (Excel/CSV)',
      uploading: 'Caricamento...',
      cardsLoaded: 'carte caricate',
      searchFilters: '🔍 Filtri di Ricerca',
      colors: 'Colori:',
      format: 'Formato:',
      minCompletion: 'Completamento minimo:',
      buildableOnly: 'Solo mazzi costruibili (≥90%)',
      resetFilters: '🔄 Reset Filtri',
      findDecks: '🔍 Trova Mazzi Compatibili',
      analyzing: 'Analizzando mazzi...',
      compatibleDecks: 'Mazzi Compatibili',
      match: 'Match:',
      cardsOwned: 'Carte possedute:',
      canBuild: '✅ Puoi costruire questo mazzo!',
      completeList: 'Lista Completa',
      uniqueCards: 'carte uniche',
      buildable: '🎯 Costruibile!',
      missing: 'Mancano',
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
      footer: 'Magic Deck Builder © 2026',
      logout: '🚪 Esci',
      unverified: '⚠️ Non verificato',
      uploadsRemaining: 'caricamenti',
      viewCollection: '📚 Collezione',
      complete: 'completo',
      cards: 'carte',
      noCardsFound: '⚠️ Nessuna carta trovata per questo mazzo',
      errorAnalyzing: 'Errore: Impossibile analizzare il file',
      errorUploading: 'Errore nel caricamento del file',
      errorSearching: 'Errore nella ricerca dei deck',
      mustMapColumns: '⚠️ Devi mappare almeno le colonne Nome e Quantità',
      foundDecks: 'Trovati',
      decksCompatible: 'mazzi compatibili (mostrando top 20)',
      noDecksFound: 'Nessun deck trovato con i filtri selezionati'
    },
    en: {
      title: '🃏 Magic Deck Matcher',
      subtitle: 'Upload your cards and discover which competitive decks you can build',
      uploadBtn: '📁 Upload Collection (Excel/CSV)',
      uploading: 'Uploading...',
      cardsLoaded: 'cards loaded',
      searchFilters: '🔍 Search Filters',
      colors: 'Colors:',
      format: 'Format:',
      minCompletion: 'Minimum completion:',
      buildableOnly: 'Buildable decks only (≥90%)',
      resetFilters: '🔄 Reset Filters',
      findDecks: '🔍 Find Compatible Decks',
      analyzing: 'Analyzing decks...',
      compatibleDecks: 'Compatible Decks',
      match: 'Match:',
      cardsOwned: 'Cards owned:',
      canBuild: '✅ You can build this deck!',
      completeList: 'Complete List',
      uniqueCards: 'unique cards',
      buildable: '🎯 Buildable!',
      missing: 'Missing',
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
      footer: 'Magic Deck Builder © 2026',
      logout: '🚪 Logout',
      unverified: '⚠️ Unverified',
      uploadsRemaining: 'uploads',
      viewCollection: '📚 Collection',
      complete: 'complete',
      cards: 'cards',
      noCardsFound: '⚠️ No cards found for this deck',
      errorAnalyzing: 'Error: Unable to analyze file',
      errorUploading: 'Error uploading file',
      errorSearching: 'Error searching for decks',
      mustMapColumns: '⚠️ You must map at least Name and Quantity columns',
      foundDecks: 'Found',
      decksCompatible: 'compatible decks (showing top 20)',
      noDecksFound: 'No decks found with selected filters'
    }
  }

  const t = translations[language]

  // Verifica autenticazione all'avvio
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      const userEmail = localStorage.getItem('userEmail')
      const isVerified = localStorage.getItem('isVerified') === 'true'

      if (token && userId) {
        setUser({
          userId: parseInt(userId),
          email: userEmail,
          isVerified,
          token
        })
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    localStorage.setItem('language', language)
    if (user) {
      loadAvailableFormats()
      loadSubscriptionStatus()
    }
  }, [language, user])

  const loadSubscriptionStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/status?token=${user.token}`)
      const data = await res.json()
      setSubscriptionStatus(data)
      
      // Se l'utente è free e non abbiamo ancora mostrato la modale, mostrala
      if (data.subscription_type === 'free' && !hasShownSubscriptionModal) {
        setShowSubscriptions(true)
        setHasShownSubscriptionModal(true)
      }
    } catch (err) {
      console.error('Errore caricamento stato abbonamento:', err)
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
    loadAvailableFormats()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('isVerified')
    setUser(null)
    setCards([])
    setDecks([])
  }

  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: '50px', height: '50px' }}></div>
      </div>
    )
  }

  if (!user) {
    return <Auth onLogin={handleLogin} language={language} />
  }

  const loadAvailableFormats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/decks/formats`)
      const data = await res.json()
      setAvailableFormats(data.formats || [])
    } catch (err) {
      console.error('Errore caricamento formati:', err)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    console.log('📁 File selezionato:', file.name, 'Tipo:', file.type, 'Dimensione:', file.size)

    setLoading(true)
    setMessage('')
    
    // Prima analizza il file per ottenere le colonne
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_URL}/api/cards/analyze/${user.userId}`, {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('❌ Errore analisi:', errorData)
        setMessage(`${t.errorAnalyzing}: ${errorData.detail || ''}`)
        setLoading(false)
        e.target.value = ''
        return
      }
      
      const data = await res.json()
      
      // Mostra l'interfaccia di mapping
      setFileToUpload(file)
      setFileColumns(data.columns)
      setColumnMapping(data.suggested_mapping)
      setFilePreview(data.preview)
      setTotalRows(data.total_rows)
      setShowColumnMapper(true)
      
    } catch (err) {
      console.error('❌ Errore:', err)
      setMessage(t.errorAnalyzing)
    }
    setLoading(false)
    
    // Reset input
    e.target.value = ''
  }
  
  const confirmUpload = async () => {
    if (!fileToUpload) return
    
    // Verifica che almeno nome e quantità siano mappati
    if (!columnMapping.name || !columnMapping.quantity) {
      setMessage(t.mustMapColumns)
      return
    }
    
    setLoading(true)
    setMessage('')
    
    const formData = new FormData()
    formData.append('file', fileToUpload)
    formData.append('mapping', JSON.stringify(columnMapping))

    try {
      const res = await fetch(`${API_URL}/api/cards/upload/${user.userId}`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      setMessage(`✓ ${data.message}`)
      loadCards()
      
      // Chiudi il mapper
      setShowColumnMapper(false)
      setFileToUpload(null)
      
    } catch (err) {
      setMessage(t.errorUploading)
    }
    setLoading(false)
  }
  
  const cancelUpload = () => {
    setShowColumnMapper(false)
    setFileToUpload(null)
    setFileColumns([])
    setColumnMapping({})
    setFilePreview([])
  }
  
  const updateMapping = (field, column) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: column === '' ? null : column
    }))
  }

  const loadCards = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cards/${user.userId}`)
      const data = await res.json()
      setCards(data)
    } catch (err) {
      console.error(err)
    }
  }

  const generateDecks = async () => {
    setDeckLoading(true)
    try {
      // Costruisci URL con parametri di filtro
      const params = new URLSearchParams()
      
      // Formato è opzionale - se selezionato, filtra per formato
      if (filters.formats.length > 0) {
        params.append('format', filters.formats[0])
      }
      
      if (filters.colors.length > 0) {
        params.append('colors', filters.colors.join(','))
      }
      
      params.append('min_match', filters.minMatch)
      
      if (filters.buildableOnly) {
        params.append('buildable_only', 'true')
      }
      
      const url = `${API_URL}/api/decks/match/${user.userId}?${params.toString()}`
      console.log('🔍 Ricerca con filtri:', url)
      
      const res = await fetch(url)
      const data = await res.json()
      setDecks(data.decks || [])
      if (data.decks?.length === 0) {
        setMessage(data.message || t.noDecksFound)
      } else {
        setMessage(`✓ ${t.foundDecks} ${data.total_matches} ${t.decksCompatible}`)
      }
    } catch (err) {
      setMessage(t.errorSearching)
    }
    setDeckLoading(false)
  }

  const toggleColorFilter = (color) => {
    setFilters(prev => {
      const newColors = prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
      return { ...prev, colors: newColors }
    })
  }

  const updateMinMatch = (value) => {
    setFilters(prev => ({ ...prev, minMatch: value }))
  }

  const toggleBuildableOnly = () => {
    setFilters(prev => ({ ...prev, buildableOnly: !prev.buildableOnly }))
  }

  const toggleFormatFilter = (format) => {
    // Permetti solo un formato alla volta (radio button behavior)
    setFilters(prev => ({
      ...prev,
      formats: prev.formats.includes(format) ? [] : [format]
    }))
  }

  const resetFilters = () => {
    setFilters({
      colors: [],
      minMatch: 10,
      buildableOnly: false,
      formats: []
    })
  }

  const getColorEmoji = (colors) => {
    const colorMap = { W: '⚪', U: '🔵', B: '⚫', R: '🔴', G: '🟢' }
    return colors.split('/').map(c => colorMap[c] || c).join('')
  }

  return (
    <div className="app">
      {currentView === 'collections' ? (
        <CollectionsList
          user={user}
          onBack={() => setCurrentView('main')}
          onSelectCollection={(collection) => {
            setSelectedCollection(collection)
            setCurrentView('collection-detail')
          }}
          language={language}
          onShowSubscriptions={() => setShowSubscriptions(true)}
        />
      ) : currentView === 'collection-detail' ? (
        <Collection
          user={user}
          collection={selectedCollection}
          onBack={() => {
            setSelectedCollection(null)
            setCurrentView('collections')
          }}
          language={language}
          onShowSubscriptions={() => setShowSubscriptions(true)}
          onUploadComplete={() => loadSubscriptionStatus()}
        />
      ) : (
        <>
          <header>
            <div className="header-top">
              <div className="language-selector">
                <button 
                  className={`lang-btn ${language === 'it' ? 'active' : ''}`}
                  onClick={() => setLanguage('it')}
                >
                  🇮🇹 IT
                </button>
                <button 
                  className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  🇬🇧 EN
                </button>
              </div>
              <div className="user-info">
                <span className="user-email">{user.email}</span>
                {!user.isVerified && (
                  <span className="unverified-badge">{t.unverified}</span>
                )}
                <button className="collection-btn" onClick={() => setCurrentView('collections')}>
                  {t.viewCollection}
                </button>
                {subscriptionStatus && (
                  <button className="subscription-btn" onClick={() => setShowSubscriptions(true)}>
                    💎 {subscriptionStatus.uploads_remaining} {t.uploadsRemaining}
                  </button>
                )}
                <button className="logout-btn" onClick={handleLogout}>
                  {t.logout}
                </button>
              </div>
            </div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </header>

      <main>
        <section className="upload-section">
          <label className={`upload-btn ${loading ? 'disabled' : ''}`}>
            {loading ? (
              <>
                <span className="spinner"></span>
                {t.uploading}
              </>
            ) : (
              t.uploadBtn
            )}
            <input type="file" accept=".xlsx,.csv" onChange={handleUpload} hidden disabled={loading} />
          </label>
          {cards.length > 0 && !loading && (
            <span className="card-count">✅ {cards.length} {t.cardsLoaded}</span>
          )}
        </section>

        {message && <div className="message">{message}</div>}
        
        {/* Modal per mappare le colonne */}
        {showColumnMapper && (
          <div className="modal-overlay">
            <div className="modal-content column-mapper">
              <h2>{t.mapColumns}</h2>
              <p className="modal-subtitle">
                {totalRows} {t.rowsFound}
              </p>
              
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
                  disabled={!columnMapping.name || !columnMapping.quantity}
                >
                  {loading ? (
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

        {cards.length > 0 && (
          <>
            <div className="filters-section">
              <h3>🔍 Filtri di Ricerca</h3>
              
              <div className="filter-group">
                <label>{t.colors}</label>
                <div className="color-filters">
                  {['W', 'U', 'B', 'R', 'G'].map(color => (
                    <button
                      key={color}
                      className={`color-btn ${filters.colors.includes(color) ? 'active' : ''}`}
                      onClick={() => toggleColorFilter(color)}
                    >
                      {getColorEmoji(color)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label>{t.format}</label>
                <div className="format-filters">
                  {availableFormats.map(format => (
                    <button
                      key={format.name}
                      className={`format-btn ${filters.formats.includes(format.name) ? 'active' : ''}`}
                      onClick={() => toggleFormatFilter(format.name)}
                    >
                      {format.name} ({format.count})
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label>{t.minCompletion}: {filters.minMatch}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={filters.minMatch}
                  onChange={(e) => updateMinMatch(Number(e.target.value))}
                  className="slider"
                />
              </div>

              <div className="filter-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.buildableOnly}
                    onChange={toggleBuildableOnly}
                  />
                  <span>{t.buildableOnly}</span>
                </label>
              </div>

              {(filters.colors.length > 0 || filters.minMatch > 10 || filters.buildableOnly || filters.formats.length > 0) && (
                <button className="reset-filters-btn-inline" onClick={resetFilters}>
                  🔄 Reset Filtri
                </button>
              )}
            </div>

            <button className="generate-btn" onClick={generateDecks} disabled={deckLoading}>
              {deckLoading ? (
                <>
                  <span className="spinner"></span>
                  {t.analyzing}
                </>
              ) : (
                t.findDecks
              )}
            </button>
          </>
        )}

        {decks.length > 0 && (
          <section className="decks-section">
            <div className="results-header">
              <h2>{t.compatibleDecks} ({decks.length})</h2>
            </div>
            <div className="decks-grid">
              {decks.map((deck, i) => (
                <div 
                  key={i} 
                  className={`deck-card ${selectedDeck === i ? 'selected' : ''} ${deck.can_build ? 'buildable' : ''}`}
                  onClick={() => {
                    const newSelection = selectedDeck === i ? null : i
                    setSelectedDeck(newSelection)
                    
                    // Scroll alla sezione dettagli dopo un breve delay
                    if (newSelection !== null) {
                      setTimeout(() => {
                        const detailSection = document.querySelector('.deck-detail')
                        if (detailSection) {
                          detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }, 100)
                    }
                  }}
                >
                  <div className="deck-header">
                    <span className="deck-colors">{getColorEmoji(deck.colors)}</span>
                    <h3>{deck.name}</h3>
                  </div>
                  <div className="match-bar">
                    <div className="match-fill" style={{width: `${deck.match_percentage}%`}}></div>
                    <span className="match-text">{deck.match_percentage}% {t.complete}</span>
                  </div>
                  <div className="deck-stats">
                    <span>✅ {deck.cards_owned}/{deck.total_cards} {t.cards}</span>
                    {deck.missing_cards_count > 0 && (
                      <span>❌ {t.missing} {deck.missing_cards_count}</span>
                    )}
                  </div>
                  {deck.can_build && <div className="buildable-badge">{t.buildable}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {selectedDeck !== null && decks[selectedDeck] && (
          <section className="deck-detail">
            <h2>{decks[selectedDeck].name}</h2>
            <div className="deck-info">
              <p>{t.match}: <strong>{decks[selectedDeck].match_percentage}%</strong></p>
              <p>{t.cardsOwned}: <strong>{decks[selectedDeck].cards_owned}/{decks[selectedDeck].total_cards}</strong></p>
              {decks[selectedDeck].can_build && <p className="can-build">{t.canBuild}</p>}
            </div>
            
            {decks[selectedDeck].deck_list && decks[selectedDeck].deck_list.length > 0 ? (
              <>
                <h3>{t.completeList} ({decks[selectedDeck].deck_list.length} {t.uniqueCards})</h3>
                <div className="cards-list">
                  {decks[selectedDeck].deck_list.map((card, i) => (
                    <div key={i} className={`card-item ${card.missing > 0 ? 'missing' : 'owned'}`}>
                      <span className="card-qty">{card.quantity_needed}x</span>
                      <span className="card-name">{card.name}</span>
                      {card.type && card.type !== 'Unknown' && (
                        <span className="card-type">{card.type}</span>
                      )}
                      <span className="card-status">
                        {card.missing > 0 ? `❌ -${card.missing}` : '✅'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p>{t.noCardsFound}</p>
            )}
          </section>
        )}
      </main>

          <footer>
            <p>Magic Deck Builder © 2026</p>
          </footer>
        </>
      )}

      {/* Subscriptions modal - always available regardless of view */}
      {showSubscriptions && (
        <Subscriptions 
          user={user} 
          onClose={() => {
            setShowSubscriptions(false)
            loadSubscriptionStatus()
          }}
          language={language}
        />
      )}
    </div>
  )
}

export default App
