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
    minMatch: 50,
    buildableOnly: false,
    formats: []
  })
  const [availableFormats, setAvailableFormats] = useState([])

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

    setLoading(true)
    setMessage('')
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_URL}/api/cards/upload/${userId}`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      setMessage(`✓ ${data.message}`)
      loadCards()
    } catch (err) {
      setMessage('Errore nel caricamento del file')
    }
    setLoading(false)
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
      
      if (filters.colors.length > 0) {
        params.append('colors', filters.colors.join(','))
      }
      
      if (filters.formats.length > 0) {
        params.append('formats', filters.formats.join(','))
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
    setFilters(prev => {
      const newFormats = prev.formats.includes(format)
        ? prev.formats.filter(f => f !== format)
        : [...prev.formats, format]
      return { ...prev, formats: newFormats }
    })
  }

  const resetFilters = () => {
    setFilters({
      colors: [],
      minMatch: 50,
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
          <label className="upload-btn">
            📁 Carica Collezione Excel
            <input type="file" accept=".xlsx" onChange={handleUpload} hidden />
          </label>
          {cards.length > 0 && (
            <span className="card-count">✅ {cards.length} carte caricate</span>
          )}
        </section>

        {message && <div className="message">{message}</div>}

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
                <label>Formati:</label>
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
                  min="50"
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

              {(filters.colors.length > 0 || filters.minMatch > 50 || filters.buildableOnly || filters.formats.length > 0) && (
                <button className="reset-filters-btn-inline" onClick={resetFilters}>
                  🔄 Reset Filtri
                </button>
              )}
            </div>

            <button className="generate-btn" onClick={generateDecks} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analizzando 736 mazzi...
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
                  onClick={() => setSelectedDeck(selectedDeck === i ? null : i)}
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
            
            {decks[selectedDeck].missing_cards && decks[selectedDeck].missing_cards.length > 0 && (
              <div className="missing-section">
                <h3>Carte Mancanti (top 10)</h3>
                <div className="missing-list">
                  {decks[selectedDeck].missing_cards.map((card, i) => (
                    <div key={i} className="missing-item">
                      <span className="missing-qty">{card.missing}x</span>
                      <span className="missing-name">{card.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <h3>Lista Completa</h3>
            <div className="cards-list">
              {decks[selectedDeck].deck_list.map((card, i) => (
                <div key={i} className={`card-item ${card.missing > 0 ? 'missing' : 'owned'}`}>
                  <span className="card-qty">{card.quantity_needed}x</span>
                  <span className="card-name">{card.name}</span>
                  <span className="card-type">{card.type}</span>
                  <span className="card-status">
                    {card.missing > 0 ? `❌ -${card.missing}` : '✅'}
                  </span>
                </div>
              ))}
            </div>
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
