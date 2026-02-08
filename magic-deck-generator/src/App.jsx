import { useState, useEffect } from 'react'
import './App.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function App() {
  const [userId] = useState(() => localStorage.getItem('userId') || crypto.randomUUID())
  const [cards, setCards] = useState([])
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [message, setMessage] = useState('')
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

  useEffect(() => {
    localStorage.setItem('userId', userId)
    loadAvailableFormats()
  }, [userId])

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
      const res = await fetch(`${API_URL}/api/cards/analyze/${userId}`, {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('❌ Errore analisi:', errorData)
        setMessage(`Errore: ${errorData.detail || 'Impossibile analizzare il file'}`)
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
      setMessage('Errore nell\'analisi del file')
    }
    setLoading(false)
    
    // Reset input
    e.target.value = ''
  }
  
  const confirmUpload = async () => {
    if (!fileToUpload) return
    
    // Verifica che almeno nome e quantità siano mappati
    if (!columnMapping.name || !columnMapping.quantity) {
      setMessage('⚠️ Devi mappare almeno le colonne Nome e Quantità')
      return
    }
    
    setLoading(true)
    setMessage('')
    
    const formData = new FormData()
    formData.append('file', fileToUpload)
    formData.append('mapping', JSON.stringify(columnMapping))

    try {
      const res = await fetch(`${API_URL}/api/cards/upload/${userId}`, {
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
      setMessage('Errore nel caricamento del file')
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
      const res = await fetch(`${API_URL}/api/cards/${userId}`)
      const data = await res.json()
      setCards(data)
    } catch (err) {
      console.error(err)
    }
  }

  const generateDecks = async () => {
    setLoading(true)
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
      
      const url = `${API_URL}/api/decks/match/${userId}?${params.toString()}`
      console.log('🔍 Ricerca con filtri:', url)
      
      const res = await fetch(url)
      const data = await res.json()
      setDecks(data.decks || [])
      if (data.decks?.length === 0) {
        setMessage(data.message || 'Nessun deck trovato con i filtri selezionati')
      } else {
        setMessage(`✓ Trovati ${data.total_matches} mazzi compatibili (mostrando top 20)`)
      }
    } catch (err) {
      setMessage('Errore nella ricerca dei deck')
    }
    setLoading(false)
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
      <header>
        <h1>🃏 Magic Deck Matcher</h1>
        <p>Carica le tue carte e scopri quali mazzi competitivi puoi costruire</p>
      </header>

      <main>
        <section className="upload-section">
          <label className={`upload-btn ${loading ? 'disabled' : ''}`}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Caricamento...
              </>
            ) : (
              '📁 Carica Collezione (Excel/CSV)'
            )}
            <input type="file" accept=".xlsx,.csv" onChange={handleUpload} hidden disabled={loading} />
          </label>
          {cards.length > 0 && !loading && (
            <span className="card-count">✅ {cards.length} carte caricate</span>
          )}
        </section>

        {message && <div className="message">{message}</div>}
        
        {/* Modal per mappare le colonne */}
        {showColumnMapper && (
          <div className="modal-overlay">
            <div className="modal-content column-mapper">
              <h2>📋 Mappa le Colonne del File</h2>
              <p className="modal-subtitle">
                Trovate {totalRows} righe. Seleziona quale colonna del tuo file corrisponde a ciascun campo.
              </p>
              
              <div className="mapping-grid">
                <div className="mapping-row required-field">
                  <label>Nome Carta <span className="required">*</span></label>
                  <select 
                    value={columnMapping.name || ''} 
                    onChange={(e) => updateMapping('name', e.target.value)}
                  >
                    <option value="">-- Seleziona colonna --</option>
                    {fileColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mapping-row required-field">
                  <label>Quantità <span className="required">*</span></label>
                  <select 
                    value={columnMapping.quantity || ''} 
                    onChange={(e) => updateMapping('quantity', e.target.value)}
                  >
                    <option value="">-- Seleziona colonna --</option>
                    {fileColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mapping-row">
                  <label>Tipo Carta</label>
                  <select 
                    value={columnMapping.card_type || ''} 
                    onChange={(e) => updateMapping('card_type', e.target.value)}
                  >
                    <option value="">-- Opzionale --</option>
                    {fileColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mapping-row">
                  <label>Colori</label>
                  <select 
                    value={columnMapping.colors || ''} 
                    onChange={(e) => updateMapping('colors', e.target.value)}
                  >
                    <option value="">-- Opzionale --</option>
                    {fileColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mapping-row">
                  <label>Costo Mana</label>
                  <select 
                    value={columnMapping.mana_cost || ''} 
                    onChange={(e) => updateMapping('mana_cost', e.target.value)}
                  >
                    <option value="">-- Opzionale --</option>
                    {fileColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mapping-row">
                  <label>Rarità</label>
                  <select 
                    value={columnMapping.rarity || ''} 
                    onChange={(e) => updateMapping('rarity', e.target.value)}
                  >
                    <option value="">-- Opzionale --</option>
                    {fileColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {filePreview.length > 0 && (
                <div className="preview-section">
                  <h3>Anteprima Dati (prime 5 righe)</h3>
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
                  Annulla
                </button>
                <button 
                  className="confirm-btn" 
                  onClick={confirmUpload}
                  disabled={!columnMapping.name || !columnMapping.quantity}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Caricamento...
                    </>
                  ) : (
                    '✓ Conferma e Carica'
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
                <label>Colori:</label>
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
                <label>Formato:</label>
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
                <label>Completamento minimo: {filters.minMatch}%</label>
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
                  <span>Solo mazzi costruibili (≥90%)</span>
                </label>
              </div>

              {(filters.colors.length > 0 || filters.minMatch > 10 || filters.buildableOnly || filters.formats.length > 0) && (
                <button className="reset-filters-btn-inline" onClick={resetFilters}>
                  🔄 Reset Filtri
                </button>
              )}
            </div>

            <button className="generate-btn" onClick={generateDecks} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analizzando mazzi...
                </>
              ) : (
                '🔍 Trova Mazzi Compatibili'
              )}
            </button>
          </>
        )}

        {decks.length > 0 && (
          <section className="decks-section">
            <div className="results-header">
              <h2>Mazzi Compatibili ({decks.length})</h2>
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
                    <span className="match-text">{deck.match_percentage}% completo</span>
                  </div>
                  <div className="deck-stats">
                    <span>✅ {deck.cards_owned}/{deck.total_cards} carte</span>
                    {deck.missing_cards_count > 0 && (
                      <span>❌ Mancano {deck.missing_cards_count}</span>
                    )}
                  </div>
                  {deck.can_build && <div className="buildable-badge">🎯 Costruibile!</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {selectedDeck !== null && decks[selectedDeck] && (
          <section className="deck-detail">
            <h2>{decks[selectedDeck].name}</h2>
            <div className="deck-info">
              <p>Match: <strong>{decks[selectedDeck].match_percentage}%</strong></p>
              <p>Carte possedute: <strong>{decks[selectedDeck].cards_owned}/{decks[selectedDeck].total_cards}</strong></p>
              {decks[selectedDeck].can_build && <p className="can-build">✅ Puoi costruire questo mazzo!</p>}
            </div>
            
            {decks[selectedDeck].deck_list && decks[selectedDeck].deck_list.length > 0 ? (
              <>
                <h3>Lista Completa ({decks[selectedDeck].deck_list.length} carte uniche)</h3>
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
              <p>⚠️ Nessuna carta trovata per questo mazzo</p>
            )}
          </section>
        )}
      </main>

      <footer>
        <p>Magic Deck Builder © 2026</p>
      </footer>
    </div>
  )
}

export default App
