import { useState, useEffect } from 'react'
import './CardSearch.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function CardSearch({ user, onBack, language }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filters, setFilters] = useState({
    colors: [],
    types: [],
    rarity: '',
    cmcMin: '',
    cmcMax: '',
    format: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const translations = {
    it: {
      title: '🔍 Ricerca Carte',
      searchPlaceholder: 'Cerca per nome...',
      search: 'Cerca',
      filters: 'Filtri',
      hideFilters: 'Nascondi Filtri',
      colors: 'Colori',
      type: 'Tipo',
      rarity: 'Rarità',
      cmc: 'Costo Mana Convertito',
      format: 'Formato',
      min: 'Min',
      max: 'Max',
      reset: 'Reset',
      loading: 'Caricamento...',
      noResults: 'Nessuna carta trovata',
      page: 'Pagina',
      of: 'di',
      back: '← Indietro',
      creature: 'Creatura',
      instant: 'Istantaneo',
      sorcery: 'Stregoneria',
      enchantment: 'Incantesimo',
      artifact: 'Artefatto',
      planeswalker: 'Planeswalker',
      land: 'Terra',
      common: 'Comune',
      uncommon: 'Non Comune',
      rare: 'Rara',
      mythic: 'Mitica',
      legalities: 'Legalità',
      artist: 'Artista',
      set: 'Set',
      close: 'Chiudi'
    },
    en: {
      title: '🔍 Card Search',
      searchPlaceholder: 'Search by name...',
      search: 'Search',
      filters: 'Filters',
      hideFilters: 'Hide Filters',
      colors: 'Colors',
      type: 'Type',
      rarity: 'Rarity',
      cmc: 'Converted Mana Cost',
      format: 'Format',
      min: 'Min',
      max: 'Max',
      reset: 'Reset',
      loading: 'Loading...',
      noResults: 'No cards found',
      page: 'Page',
      of: 'of',
      back: '← Back',
      creature: 'Creature',
      instant: 'Instant',
      sorcery: 'Sorcery',
      enchantment: 'Enchantment',
      artifact: 'Artifact',
      planeswalker: 'Planeswalker',
      land: 'Land',
      common: 'Common',
      uncommon: 'Uncommon',
      rare: 'Rare',
      mythic: 'Mythic',
      legalities: 'Legalities',
      artist: 'Artist',
      set: 'Set',
      close: 'Close'
    }
  }

  const t = translations[language]

  const colorOptions = [
    { value: 'W', label: '⚪', name: 'White' },
    { value: 'U', label: '🔵', name: 'Blue' },
    { value: 'B', label: '⚫', name: 'Black' },
    { value: 'R', label: '🔴', name: 'Red' },
    { value: 'G', label: '🟢', name: 'Green' }
  ]

  const typeOptions = ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land']
  const rarityOptions = ['common', 'uncommon', 'rare', 'mythic']
  const formatOptions = ['standard', 'modern', 'legacy', 'vintage', 'commander', 'pioneer', 'pauper']

  useEffect(() => {
    searchCards()
  }, [page])

  // Autocomplete suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        fetchSuggestions()
      }, 300) // Debounce di 300ms
      return () => clearTimeout(timer)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery])

  const fetchSuggestions = async () => {
    try {
      const params = new URLSearchParams()
      params.append('query', searchQuery)
      params.append('language', language)
      params.append('page_size', 10) // Solo 10 suggerimenti
      
      const res = await fetch(`${API_URL}/api/mtg-cards/search?${params}`)
      const data = await res.json()
      setSuggestions(data.cards || [])
      setShowSuggestions(true)
    } catch (err) {
      console.error('Error fetching suggestions:', err)
    }
  }

  const searchCards = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('query', searchQuery)
      if (filters.colors.length > 0) params.append('colors', filters.colors.join(','))
      if (filters.types.length > 0) params.append('types', filters.types.join(','))
      if (filters.rarity) params.append('rarity', filters.rarity)
      if (filters.cmcMin) params.append('cmc_min', filters.cmcMin)
      if (filters.cmcMax) params.append('cmc_max', filters.cmcMax)
      if (filters.format) params.append('format', filters.format)
      params.append('language', language)
      params.append('page', page)
      params.append('page_size', 24)

      const res = await fetch(`${API_URL}/api/mtg-cards/search?${params}`)
      const data = await res.json()
      setCards(data.cards || [])
      setTotalPages(data.pagination?.total_pages || 1)
    } catch (err) {
      console.error('Error searching cards:', err)
    }
    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setShowSuggestions(false)
    searchCards()
  }

  const selectSuggestion = (cardName) => {
    setSearchQuery(cardName)
    setShowSuggestions(false)
    setPage(1)
    // Trigger search with the selected card name
    setTimeout(() => searchCards(), 100)
  }

  const toggleColor = (color) => {
    setFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }))
  }

  const toggleType = (type) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }))
  }

  const resetFilters = () => {
    setFilters({
      colors: [],
      types: [],
      rarity: '',
      cmcMin: '',
      cmcMax: '',
      format: ''
    })
    setSearchQuery('')
    setPage(1)
  }

  const openCardDetail = async (uuid) => {
    try {
      const res = await fetch(`${API_URL}/api/mtg-cards/card/${uuid}?language=${language}`)
      const data = await res.json()
      setSelectedCard(data)
    } catch (err) {
      console.error('Error loading card:', err)
    }
  }

  return (
    <div className="card-search">
      <header className="search-header">
        <button className="back-btn" onClick={onBack}>{t.back}</button>
        <h1>{t.title}</h1>
      </header>

      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
              placeholder={t.searchPlaceholder}
              className="search-input"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map(card => (
                  <div 
                    key={card.uuid}
                    className="suggestion-item"
                    onClick={() => selectSuggestion(card.name)}
                  >
                    <span className="suggestion-name">{card.name}</span>
                    <span className="suggestion-type">{card.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="search-btn">{t.search}</button>
          <button 
            type="button" 
            className="filters-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? t.hideFilters : t.filters}
          </button>
        </form>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>{t.colors}</label>
              <div className="color-filters">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    className={`color-btn ${filters.colors.includes(color.value) ? 'active' : ''}`}
                    onClick={() => toggleColor(color.value)}
                    title={color.name}
                  >
                    {color.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label>{t.type}</label>
              <div className="type-filters">
                {typeOptions.map(type => (
                  <button
                    key={type}
                    className={`type-btn ${filters.types.includes(type) ? 'active' : ''}`}
                    onClick={() => toggleType(type)}
                  >
                    {t[type.toLowerCase()] || type}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>{t.rarity}</label>
                <select 
                  value={filters.rarity} 
                  onChange={(e) => setFilters({...filters, rarity: e.target.value})}
                  className="filter-select"
                >
                  <option value="">All</option>
                  {rarityOptions.map(r => (
                    <option key={r} value={r}>{t[r] || r}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>{t.cmc}</label>
                <div className="cmc-inputs">
                  <input
                    type="number"
                    placeholder={t.min}
                    value={filters.cmcMin}
                    onChange={(e) => setFilters({...filters, cmcMin: e.target.value})}
                    className="cmc-input"
                    min="0"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder={t.max}
                    value={filters.cmcMax}
                    onChange={(e) => setFilters({...filters, cmcMax: e.target.value})}
                    className="cmc-input"
                    min="0"
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>{t.format}</label>
                <select 
                  value={filters.format} 
                  onChange={(e) => setFilters({...filters, format: e.target.value})}
                  className="filter-select"
                >
                  <option value="">All</option>
                  {formatOptions.map(f => (
                    <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <button className="reset-btn" onClick={resetFilters}>{t.reset}</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t.loading}</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="no-results">
          <p>{t.noResults}</p>
        </div>
      ) : (
        <>
          <div className="cards-grid">
            {cards.map(card => (
              <div 
                key={card.uuid} 
                className="card-item"
                onClick={() => openCardDetail(card.uuid)}
              >
                <img 
                  src={card.image_url && card.image_url.startsWith('/card-images/') 
                    ? card.image_url 
                    : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="223" height="310"%3E%3Crect width="223" height="310" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" fill="%23999" text-anchor="middle" dy=".3em" font-family="Arial" font-size="14"%3ELoading...%3C/text%3E%3C/svg%3E'
                  } 
                  alt={card.name}
                  className="card-image"
                  loading="lazy"
                  onError={(e) => {
                    // Se l'immagine locale non esiste, mostra placeholder
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="223" height="310"%3E%3Crect width="223" height="310" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" fill="%23999" text-anchor="middle" dy=".3em" font-family="Arial" font-size="14"%3EImage%3C/text%3E%3Ctext x="50%25" y="55%25" fill="%23999" text-anchor="middle" dy=".3em" font-family="Arial" font-size="14"%3ENot Ready%3C/text%3E%3C/svg%3E'
                  }}
                />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="page-btn"
              >
                ←
              </button>
              <span className="page-info">
                {t.page} {page} {t.of} {totalPages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="page-btn"
              >
                →
              </button>
            </div>
          )}
        </>
      )}

      {selectedCard && (
        <div className="modal-overlay" onClick={() => setSelectedCard(null)}>
          <div className="modal-content card-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setSelectedCard(null)}>✕</button>
            
            <div className="card-detail-content">
              <img 
                src={selectedCard.image_url && selectedCard.image_url.startsWith('/card-images/') 
                  ? selectedCard.image_url 
                  : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="488" height="680"%3E%3Crect width="488" height="680" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" fill="%23999" text-anchor="middle" dy=".3em" font-family="Arial" font-size="20"%3EImage Not Ready%3C/text%3E%3C/svg%3E'
                } 
                alt={selectedCard.name}
                className="card-detail-image"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="488" height="680"%3E%3Crect width="488" height="680" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" fill="%23999" text-anchor="middle" dy=".3em" font-family="Arial" font-size="20"%3EImage Not Ready%3C/text%3E%3C/svg%3E'
                }}
              />
              
              <div className="card-detail-info">
                <h2>{selectedCard.name}</h2>
                {selectedCard.mana_cost && <p className="detail-mana">{selectedCard.mana_cost}</p>}
                <p className="detail-type">{selectedCard.type}</p>
                
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
    </div>
  )
}

export default CardSearch
