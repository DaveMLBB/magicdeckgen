import { useState, useEffect, useRef } from 'react'
import React from 'react'
import './CardSearch.css'
import { cardImageCache } from '../utils/cardImageCache'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

// Componente per caricare le immagini delle carte con lazy loading
const CardImage = React.memo(function CardImage({ card }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const imgRef = useRef(null)

  // Intersection Observer per lazy loading
  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Inizia a caricare 50px prima che sia visibile
        threshold: 0.01
      }
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let mounted = true
    let abortController = new AbortController()

    const loadImage = async () => {
      try {
        // Prova prima con l'immagine locale se disponibile
        if (card.image_url && card.image_url.startsWith('/card-images/')) {
          // Verifica se l'immagine locale esiste
          const img = new Image()
          img.onload = () => {
            if (mounted) {
              setImageUrl(card.image_url)
              setLoading(false)
            }
          }
          img.onerror = async () => {
            // Se l'immagine locale non esiste, carica da Scryfall
            if (mounted && !abortController.signal.aborted) {
              const scryfallUrl = await cardImageCache.getCardImage(card.name_en || card.name, card.scryfallId)
              if (mounted) {
                setImageUrl(scryfallUrl)
                setLoading(false)
              }
            }
          }
          img.src = card.image_url
        } else {
          // Carica direttamente da Scryfall
          if (!abortController.signal.aborted) {
            const scryfallUrl = await cardImageCache.getCardImage(card.name_en || card.name, card.scryfallId)
            if (mounted) {
              setImageUrl(scryfallUrl)
              setLoading(false)
            }
          }
        }
      } catch (err) {
        if (mounted && !abortController.signal.aborted) {
          console.error('Error loading image:', err)
          setLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      mounted = false
      abortController.abort()
    }
  }, [isVisible, card.name, card.name_en, card.image_url, card.scryfallId])

  if (!isVisible || loading) {
    return (
      <div ref={imgRef} className="card-image-placeholder">
        <div className="placeholder-content">
          {loading && isVisible ? (
            <div className="spinner-small"></div>
          ) : (
            <span className="placeholder-text">📷</span>
          )}
        </div>
      </div>
    )
  }

  if (!imageUrl) {
    return (
      <div ref={imgRef} className="card-image-placeholder">
        <div className="placeholder-content">
          <span className="placeholder-text">❌</span>
          <small>{card.name.substring(0, 20)}</small>
        </div>
      </div>
    )
  }

  return (
    <img 
      ref={imgRef}
      src={imageUrl}
      alt={card.name}
      className="card-image"
      loading="lazy"
    />
  )
})

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
    colorIdentity: [],
    types: [],
    subtypes: '',
    supertypes: '',
    rarity: '',
    cmcMin: '',
    cmcMax: '',
    format: '',
    text: '',
    power: '',
    toughness: '',
    keywords: '',
    setCode: '',
    artist: '',
    layout: '',
    loyalty: '',
    defense: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false)
  const [cardToAdd, setCardToAdd] = useState(null)
  const [collections, setCollections] = useState([])
  const [selectedCollectionId, setSelectedCollectionId] = useState(null)
  const [addQuantity, setAddQuantity] = useState(1)
  const [addMessage, setAddMessage] = useState('')

  const translations = {
    it: {
      title: '🔍 Ricerca Carte',
      searchPlaceholder: 'Cerca per nome...',
      search: 'Cerca',
      filters: 'Filtri',
      hideFilters: 'Nascondi Filtri',
      advancedFilters: 'Filtri Avanzati',
      showAdvanced: 'Mostra Avanzati',
      hideAdvanced: 'Nascondi Avanzati',
      colors: 'Colori',
      colorIdentity: 'Identità Colore',
      type: 'Tipo',
      subtypes: 'Sottotipi',
      supertypes: 'Supertipi',
      rarity: 'Rarità',
      cmc: 'Costo Mana Convertito',
      format: 'Formato',
      cardText: 'Testo Carta',
      power: 'Forza',
      toughness: 'Costituzione',
      keywords: 'Parole Chiave',
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
      setCode: 'Codice Set',
      layout: 'Layout',
      loyalty: 'Fedeltà',
      defense: 'Difesa',
      close: 'Chiudi',
      addToCollection: 'Aggiungi alla Collezione',
      selectCollection: 'Seleziona Collezione',
      createNewCollection: '+ Crea Nuova Collezione',
      quantity: 'Quantità',
      add: 'Aggiungi',
      cancel: 'Annulla',
      cardAdded: '✓ Carta aggiunta alla collezione',
      errorAddingCard: 'Errore nell\'aggiunta della carta',
      noCollections: 'Nessuna collezione disponibile',
      createFirst: 'Crea prima una collezione dalla pagina principale',
      italianWarning: 'Non tutte le carte sono disponibili in italiano. Per risultati migliori, cerca usando il nome inglese della carta.',
      uniqueCardsDisclaimer: 'La ricerca non punta a trovare carte specifiche di set. Le carte caricate nel database sono uniche, quindi molte carte sono disponibili solo in una versione.'
    },
    en: {
      title: '🔍 Card Search',
      searchPlaceholder: 'Search by name...',
      search: 'Search',
      filters: 'Filters',
      hideFilters: 'Hide Filters',
      advancedFilters: 'Advanced Filters',
      showAdvanced: 'Show Advanced',
      hideAdvanced: 'Hide Advanced',
      colors: 'Colors',
      colorIdentity: 'Color Identity',
      type: 'Type',
      subtypes: 'Subtypes',
      supertypes: 'Supertypes',
      rarity: 'Rarity',
      cmc: 'Converted Mana Cost',
      format: 'Format',
      cardText: 'Card Text',
      power: 'Power',
      toughness: 'Toughness',
      keywords: 'Keywords',
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
      setCode: 'Set Code',
      layout: 'Layout',
      loyalty: 'Loyalty',
      defense: 'Defense',
      close: 'Close',
      addToCollection: 'Add to Collection',
      selectCollection: 'Select Collection',
      createNewCollection: '+ Create New Collection',
      quantity: 'Quantity',
      add: 'Add',
      cancel: 'Cancel',
      cardAdded: '✓ Card added to collection',
      errorAddingCard: 'Error adding card',
      noCollections: 'No collections available',
      createFirst: 'Create a collection first from the main page',
      italianWarning: 'Not all cards are available in Italian. For best results, search using the English card name.',
      uniqueCardsDisclaimer: 'The search does not aim to find set-specific cards. Cards loaded in the database are unique, so many cards are available in only one version.'
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
  const layoutOptions = ['normal', 'split', 'flip', 'transform', 'modal_dfc', 'meld', 'leveler', 'saga', 'adventure', 'planar', 'scheme', 'vanguard', 'token', 'double_faced_token', 'emblem', 'augment', 'host', 'art_series', 'reversible_card']

  useEffect(() => {
    searchCards()
  }, [page])

  useEffect(() => {
    if (user) {
      loadCollections()
    }
  }, [user])

  const loadCollections = async () => {
    try {
      const res = await fetch(`${API_URL}/api/collections/user/${user.userId}`)
      const data = await res.json()
      setCollections(data.collections || [])
    } catch (err) {
      console.error('Error loading collections:', err)
    }
  }

  const openAddToCollectionModal = (card) => {
    setCardToAdd(card)
    setAddQuantity(1)
    setAddMessage('')
    setSelectedCollectionId(collections.length > 0 ? collections[0].id : null)
    setShowAddToCollectionModal(true)
  }

  const handleAddToCollection = async () => {
    if (!cardToAdd || !selectedCollectionId) return

    try {
      const res = await fetch(`${API_URL}/api/cards/add/${user.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cardToAdd.name_en || cardToAdd.name,
          mana_cost: cardToAdd.mana_cost,
          card_type: cardToAdd.type,
          colors: cardToAdd.colors,
          rarity: cardToAdd.rarity,
          quantity_owned: addQuantity,
          collection_id: selectedCollectionId
        })
      })

      if (res.ok) {
        setAddMessage(t.cardAdded)
        setTimeout(() => {
          setShowAddToCollectionModal(false)
          setCardToAdd(null)
          setAddMessage('')
        }, 1500)
      } else {
        setAddMessage(t.errorAddingCard)
      }
    } catch (err) {
      console.error('Error adding card:', err)
      setAddMessage(t.errorAddingCard)
    }
  }

  // Autocomplete suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        fetchSuggestions()
      }, 500) // Debounce aumentato a 500ms per ridurre richieste
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
      if (filters.colorIdentity.length > 0) params.append('color_identity', filters.colorIdentity.join(','))
      if (filters.types.length > 0) params.append('types', filters.types.join(','))
      if (filters.subtypes) params.append('subtypes', filters.subtypes)
      if (filters.supertypes) params.append('supertypes', filters.supertypes)
      if (filters.rarity) params.append('rarity', filters.rarity)
      if (filters.cmcMin) params.append('cmc_min', filters.cmcMin)
      if (filters.cmcMax) params.append('cmc_max', filters.cmcMax)
      if (filters.format) params.append('format', filters.format)
      if (filters.text) params.append('text', filters.text)
      if (filters.power) params.append('power', filters.power)
      if (filters.toughness) params.append('toughness', filters.toughness)
      if (filters.keywords) params.append('keywords', filters.keywords)
      if (filters.setCode) params.append('set_code', filters.setCode)
      if (filters.artist) params.append('artist', filters.artist)
      if (filters.layout) params.append('layout', filters.layout)
      if (filters.loyalty) params.append('loyalty', filters.loyalty)
      if (filters.defense) params.append('defense', filters.defense)
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

  const toggleColorIdentity = (color) => {
    setFilters(prev => ({
      ...prev,
      colorIdentity: prev.colorIdentity.includes(color)
        ? prev.colorIdentity.filter(c => c !== color)
        : [...prev.colorIdentity, color]
    }))
  }

  const resetFilters = () => {
    setFilters({
      colors: [],
      colorIdentity: [],
      types: [],
      subtypes: '',
      supertypes: '',
      rarity: '',
      cmcMin: '',
      cmcMax: '',
      format: '',
      text: '',
      power: '',
      toughness: '',
      keywords: '',
      setCode: '',
      artist: '',
      layout: '',
      loyalty: '',
      defense: ''
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
        {language === 'it' && (
          <div className="language-warning">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              {t.italianWarning}
            </span>
          </div>
        )}

        <div className="info-disclaimer">
          <span className="info-icon">ℹ️</span>
          <span className="info-text">
            {t.uniqueCardsDisclaimer}
          </span>
        </div>
        
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

            <div className="advanced-filters-toggle">
              <button 
                type="button" 
                className="advanced-toggle-btn"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {showAdvancedFilters ? t.hideAdvanced : t.showAdvanced}
              </button>
            </div>

            {showAdvancedFilters && (
              <div className="advanced-filters-section">
                <div className="filter-group">
                  <label>{t.colorIdentity}</label>
                  <div className="color-filters">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        className={`color-btn ${filters.colorIdentity.includes(color.value) ? 'active' : ''}`}
                        onClick={() => toggleColorIdentity(color.value)}
                        title={color.name}
                      >
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-row">
                  <div className="filter-group">
                    <label>{t.subtypes}</label>
                    <input
                      type="text"
                      placeholder="Human, Wizard, Equipment..."
                      value={filters.subtypes}
                      onChange={(e) => setFilters({...filters, subtypes: e.target.value})}
                      className="filter-input"
                    />
                  </div>

                  <div className="filter-group">
                    <label>{t.supertypes}</label>
                    <input
                      type="text"
                      placeholder="Legendary, Snow, Basic..."
                      value={filters.supertypes}
                      onChange={(e) => setFilters({...filters, supertypes: e.target.value})}
                      className="filter-input"
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label>{t.cardText}</label>
                  <input
                    type="text"
                    placeholder={language === 'it' ? 'Cerca nel testo della carta...' : 'Search in card text...'}
                    value={filters.text}
                    onChange={(e) => setFilters({...filters, text: e.target.value})}
                    className="filter-input"
                  />
                </div>

                <div className="filter-row">
                  <div className="filter-group">
                    <label>{t.power}</label>
                    <input
                      type="text"
                      placeholder="*,0,1,2..."
                      value={filters.power}
                      onChange={(e) => setFilters({...filters, power: e.target.value})}
                      className="filter-input-small"
                    />
                  </div>

                  <div className="filter-group">
                    <label>{t.toughness}</label>
                    <input
                      type="text"
                      placeholder="*,0,1,2..."
                      value={filters.toughness}
                      onChange={(e) => setFilters({...filters, toughness: e.target.value})}
                      className="filter-input-small"
                    />
                  </div>

                  <div className="filter-group">
                    <label>{t.loyalty}</label>
                    <input
                      type="text"
                      placeholder="1,2,3,4..."
                      value={filters.loyalty}
                      onChange={(e) => setFilters({...filters, loyalty: e.target.value})}
                      className="filter-input-small"
                    />
                  </div>

                  <div className="filter-group">
                    <label>{t.defense}</label>
                    <input
                      type="text"
                      placeholder="0,1,2,3..."
                      value={filters.defense}
                      onChange={(e) => setFilters({...filters, defense: e.target.value})}
                      className="filter-input-small"
                    />
                  </div>
                </div>

                <div className="filter-row">
                  <div className="filter-group">
                    <label>{t.keywords}</label>
                    <input
                      type="text"
                      placeholder="Flying, Haste, Trample..."
                      value={filters.keywords}
                      onChange={(e) => setFilters({...filters, keywords: e.target.value})}
                      className="filter-input"
                    />
                  </div>

                  <div className="filter-group">
                    <label>{t.setCode}</label>
                    <input
                      type="text"
                      placeholder="MH3, BLB, OTJ..."
                      value={filters.setCode}
                      onChange={(e) => setFilters({...filters, setCode: e.target.value})}
                      className="filter-input"
                    />
                  </div>
                </div>

                <div className="filter-row">
                  <div className="filter-group">
                    <label>{t.artist}</label>
                    <input
                      type="text"
                      placeholder={language === 'it' ? 'Nome artista...' : 'Artist name...'}
                      value={filters.artist}
                      onChange={(e) => setFilters({...filters, artist: e.target.value})}
                      className="filter-input"
                    />
                  </div>

                  <div className="filter-group">
                    <label>{t.layout}</label>
                    <select 
                      value={filters.layout} 
                      onChange={(e) => setFilters({...filters, layout: e.target.value})}
                      className="filter-select"
                    >
                      <option value="">All</option>
                      {layoutOptions.map(l => (
                        <option key={l} value={l}>{l.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

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
              >
                <div onClick={() => openCardDetail(card.uuid)}>
                  <CardImage card={card} />
                </div>
                <button 
                  className="add-to-collection-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    openAddToCollectionModal(card)
                  }}
                  title={t.addToCollection}
                >
                  + 📚
                </button>
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
              <CardDetailImage card={selectedCard} />
              
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

      {showAddToCollectionModal && (
        <div className="modal-overlay" onClick={() => setShowAddToCollectionModal(false)}>
          <div className="modal-content add-to-collection-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t.addToCollection}</h2>
            
            {addMessage && (
              <div className={`add-message ${addMessage.includes('✓') ? 'success' : 'error'}`}>
                {addMessage}
              </div>
            )}
            
            {cardToAdd && (
              <div className="card-to-add-info">
                <strong>{cardToAdd.name}</strong>
                <span className="card-type-small">{cardToAdd.type}</span>
              </div>
            )}
            
            {collections.length === 0 ? (
              <div className="no-collections-message">
                <p>{t.noCollections}</p>
                <p><small>{t.createFirst}</small></p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>{t.selectCollection}</label>
                  <select 
                    value={selectedCollectionId || ''} 
                    onChange={(e) => setSelectedCollectionId(parseInt(e.target.value))}
                    className="collection-select"
                  >
                    {collections.map(col => (
                      <option key={col.id} value={col.id}>
                        {col.name} ({col.card_count} {language === 'it' ? 'carte' : 'cards'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>{t.quantity}</label>
                  <input
                    type="number"
                    min="1"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                    className="quantity-input"
                  />
                </div>
              </>
            )}
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowAddToCollectionModal(false)}
              >
                {t.cancel}
              </button>
              {collections.length > 0 && (
                <button 
                  className="add-btn"
                  onClick={handleAddToCollection}
                  disabled={!selectedCollectionId}
                >
                  {t.add}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente per le immagini nel modal di dettaglio
const CardDetailImage = React.memo(function CardDetailImage({ card }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let abortController = new AbortController()

    const loadImage = async () => {
      try {
        if (card.image_url && card.image_url.startsWith('/card-images/')) {
          const img = new Image()
          img.onload = () => {
            if (mounted) {
              setImageUrl(card.image_url)
              setLoading(false)
            }
          }
          img.onerror = async () => {
            if (mounted && !abortController.signal.aborted) {
              const scryfallUrl = await cardImageCache.getCardImage(card.name_en || card.name, card.scryfallId)
              if (mounted) {
                setImageUrl(scryfallUrl)
                setLoading(false)
              }
            }
          }
          img.src = card.image_url
        } else {
          if (!abortController.signal.aborted) {
            const scryfallUrl = await cardImageCache.getCardImage(card.name_en || card.name, card.scryfallId)
            if (mounted) {
              setImageUrl(scryfallUrl)
              setLoading(false)
            }
          }
        }
      } catch (err) {
        if (mounted && !abortController.signal.aborted) {
          console.error('Error loading detail image:', err)
          setLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      mounted = false
      abortController.abort()
    }
  }, [card.name, card.name_en, card.image_url, card.scryfallId])

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

  return (
    <img 
      src={imageUrl}
      alt={card.name}
      className="card-detail-image"
    />
  )
})

export default CardSearch
