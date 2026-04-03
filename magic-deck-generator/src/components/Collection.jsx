import { useState, useEffect, useRef, useMemo } from 'react'
import './Collection.css'
import { cardImageCache } from '../utils/cardImageCache'
import { exportCollectionCSV, exportCollectionManaBox, exportCollectionXLSX, exportCollectionTXT } from '../utils/exportCards'

const API_URL = import.meta.env.PROD 
  ? 'https://api.mtgdecksbuilder.com' 
  : 'http://localhost:8000'

function Collection({ user, collection, onBack, onSelectDeck, language, onShowSubscriptions, onUploadComplete, onLimitError }) {
  const [cards, setCards] = useState([])
  
  // Deduplicate cards as safety net
  const uniqueCards = useMemo(() => {
    const seen = new Set()
    const unique = []
    for (const card of cards) {
      if (!seen.has(card.id)) {
        seen.add(card.id)
        unique.push(card)
      }
    }
    return unique
  }, [cards])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showUploadModal, setShowUploadModal] = useState(false)
  
  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    colors: [],
    types: [],
    setCode: '',
    cmcMin: '',
    cmcMax: ''
  })
  const [pendingFilters, setPendingFilters] = useState({
    colors: [],
    types: [],
    setCode: '',
    cmcMin: '',
    cmcMax: ''
  })
  
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
  const hoverTimerRef = useRef(null)
  const hoveredCardRef = useRef(null)
  
  // Mobile card detail modal
  const [selectedCard, setSelectedCard] = useState(null)
  const [selectedCardImageUrl, setSelectedCardImageUrl] = useState(null)
  const [linkedDecks, setLinkedDecks] = useState([])
  const [showLinkDeckModal, setShowLinkDeckModal] = useState(false)
  const [availableDecks, setAvailableDecks] = useState([])
  const [loadingDecks, setLoadingDecks] = useState(false)

  // Move cards states
  const [selectedCardIds, setSelectedCardIds] = useState([])
  const [selectAllPages, setSelectAllPages] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [targetCollectionId, setTargetCollectionId] = useState('')
  const [availableCollections, setAvailableCollections] = useState([])
  const [moving, setMoving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit set states
  const [setPickerCardId, setSetPickerCardId] = useState(null)
  const [setPickerEditions, setSetPickerEditions] = useState([])
  const [setPickerLoading, setSetPickerLoading] = useState(false)

  // Export
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Debug: verify onShowSubscriptions is available
  //console.log('Collection mounted - onShowSubscriptions type:', typeof onShowSubscriptions, 'value:', !!onShowSubscriptions)

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
      manaCostCol: 'Costo Mana',
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
      limitedView: '⚠️ Token insufficienti',
      upgradeToView: 'Acquista token per vedere tutte le',
      upgradeWarning: '⚠️ Ti rimangono solo',
      cardsRemaining: 'carte uniche disponibili',
      upgradePlan: 'Acquista Token',
      lockedCard: '🔒 Acquista token',
      cards: 'carte',
      asc: 'Crescente',
      desc: 'Decrescente',
      uploadTitle: 'Carica Carte nella Collezione',
      selectFile: 'Seleziona File Excel o CSV',
      uploading: 'Caricamento...',
      mapColumns: '📋 Mappa le Colonne del File',
      rowsFound: 'righe. Seleziona quale colonna del tuo file corrisponde a ciascun campo.',
      cardName: 'Nome Carta',
      cardType: 'Tipo Carta',
      manaCost: 'Costo Mana',
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
      cardRemoved: 'Carta rimossa',
      filters: 'Filtri',
      hideFilters: 'Nascondi Filtri',
      cmc: 'CMC',
      setCode: 'Set',
      setCodePlaceholder: 'es. MOM, LTR...',
      min: 'Min',
      max: 'Max',
      reset: 'Reset',
      applyFilters: 'Applica Filtri',
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
      moveCards: 'Sposta in collezione',
      moveSelected: 'Sposta selezionate',
      selectTarget: 'Seleziona collezione di destinazione',
      moving: 'Spostamento...',
      moveConfirm: 'Sposta',
      cardsSelected: 'carte selezionate',
      selectAll: 'Seleziona tutto',
      deselectAll: 'Deseleziona tutto',
      moveSuccess: 'Carte spostate con successo',
      deleteSelected: 'Elimina selezionate',
      deleteConfirmTitle: 'Conferma eliminazione',
      deleteConfirmMsg: 'Sei sicuro di voler eliminare le carte selezionate? L\'operazione non è reversibile.',
      deleteConfirmAll: 'Sei sicuro di voler eliminare tutte le carte della collezione? L\'operazione non è reversibile.',
      deleting: 'Eliminazione...',
      deleteConfirm: 'Elimina',
      deleteSuccess: 'Carte eliminate con successo',
      exportBtn: '⬇️ Esporta',
      exportCSV: 'CSV generico',
      exportManaBox: 'ManaBox CSV',
      exportXLSX: 'Excel (.xlsx)',
      exportTXT: 'Testo MTGA/MTGO',
      changeSet: 'Cambia edizione',
      noEditions: 'Nessuna edizione trovata',
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
      manaCostCol: 'Mana Cost',
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
      limitedView: '⚠️ Insufficient tokens',
      upgradeToView: 'Purchase tokens to view all',
      upgradeWarning: '⚠️ You only have',
      cardsRemaining: 'unique cards remaining',
      upgradePlan: 'Buy Tokens',
      lockedCard: '🔒 Buy tokens',
      cards: 'cards',
      asc: 'Ascending',
      desc: 'Descending',
      uploadTitle: 'Upload Cards to Collection',
      selectFile: 'Select Excel or CSV File',
      uploading: 'Uploading...',
      mapColumns: '📋 Map File Columns',
      rowsFound: 'rows found. Select which column from your file corresponds to each field.',
      cardName: 'Card Name',
      cardType: 'Card Type',
      manaCost: 'Mana Cost',
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
      cardRemoved: 'Card removed',
      filters: 'Filters',
      hideFilters: 'Hide Filters',
      cmc: 'CMC',
      setCode: 'Set',
      setCodePlaceholder: 'e.g. MOM, LTR...',
      min: 'Min',
      max: 'Max',
      reset: 'Reset',
      applyFilters: 'Apply Filters',
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
      moveCards: 'Move to collection',
      moveSelected: 'Move selected',
      selectTarget: 'Select target collection',
      moving: 'Moving...',
      moveConfirm: 'Move',
      cardsSelected: 'cards selected',
      selectAll: 'Select all',
      deselectAll: 'Deselect all',
      moveSuccess: 'Cards moved successfully',
      deleteSelected: 'Delete selected',
      deleteConfirmTitle: 'Confirm deletion',
      deleteConfirmMsg: 'Are you sure you want to delete the selected cards? This cannot be undone.',
      deleteConfirmAll: 'Are you sure you want to delete all cards in this collection? This cannot be undone.',
      deleting: 'Deleting...',
      deleteConfirm: 'Delete',
      deleteSuccess: 'Cards deleted successfully',
      exportBtn: '⬇️ Export',
      exportCSV: 'Generic CSV',
      exportManaBox: 'ManaBox CSV',
      exportXLSX: 'Excel (.xlsx)',
      exportTXT: 'MTGA/MTGO Text',
      changeSet: 'Change edition',
      noEditions: 'No editions found',
    }
  }

  const t = translations[language]

  const manaSymbolMap = {
    'W': { bg: '#f9faf4', border: '#ccc', text: '#333' },
    'U': { bg: '#0e68ab', border: '#0e68ab', text: '#fff' },
    'B': { bg: '#150b00', border: '#555', text: '#fff' },
    'R': { bg: '#d3202a', border: '#d3202a', text: '#fff' },
    'G': { bg: '#00733e', border: '#00733e', text: '#fff' }
  }

  const typeTranslations = {
    'Creature': 'Creatura',
    'Instant': 'Istantaneo',
    'Sorcery': 'Stregoneria',
    'Enchantment': 'Incantesimo',
    'Artifact': 'Artefatto',
    'Planeswalker': 'Planeswalker',
    'Land': 'Terra',
    'Battle': 'Battaglia',
    'Kindred': 'Stirpe',
    'Tribal': 'Tribale',
    'Conspiracy': 'Cospirazione',
    'Phenomenon': 'Fenomeno',
    'Plane': 'Piano',
    'Scheme': 'Stratagemma',
    'Vanguard': 'Avanguardia',
    'Dungeon': 'Sotterraneo',
    'Unknown': 'Sconosciuto'
  }

  const translateType = (type) => {
    if (!type) return 'Sconosciuto'
    return typeTranslations[type] || type
  }

  const typeOptions = ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land']
  const rarityOptions = ['common', 'uncommon', 'rare', 'mythic']

  useEffect(() => {
    if (setPickerCardId === null) return
    const close = () => setSetPickerCardId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [setPickerCardId])

  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      if (isMounted) {
        await loadCollection()
        await loadStats()
        // Reset selezione quando cambiano i filtri/ricerca
        setSelectedCardIds([])
        setSelectAllPages(false)
      }
    }
    
    fetchData()
    
    return () => {
      isMounted = false
    }
  }, [page, search, sortBy, sortOrder, filters])

  useEffect(() => {
    if (collection) {
      loadLinkedDecks()
    }
  }, [collection])

  const loadLinkedDecks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/saved-decks/by-collection/${collection.id}`)
      const data = await res.json()
      setLinkedDecks(data.decks || [])
    } catch (err) {
      console.error('Error loading linked decks:', err)
    }
  }

  const openLinkDeckModal = async () => {
    setShowLinkDeckModal(true)
    setLoadingDecks(true)
    try {
      const res = await fetch(`${API_URL}/api/saved-decks/user/${user.userId}`)
      const data = await res.json()
      const linkedIds = linkedDecks.map(d => d.id)
      setAvailableDecks((data.decks || []).filter(d => !linkedIds.includes(d.id)))
    } catch (err) {
      console.error('Error loading decks:', err)
    }
    setLoadingDecks(false)
  }

  const handleLinkDeck = async (deckId) => {
    try {
      const res = await fetch(`${API_URL}/api/collections/${collection.id}/link-deck/${deckId}?user_id=${user.userId}`, {
        method: 'POST'
      })
      if (res.ok) {
        setShowLinkDeckModal(false)
        loadLinkedDecks()
      }
    } catch (err) {
      console.error('Error linking deck:', err)
    }
  }

  const loadAllForExport = async () => {
    const params = new URLSearchParams({ page: '1', page_size: '5000', sort_by: 'name', sort_order: 'asc' })
    if (collection) params.append('collection_id', collection.id.toString())
    const res = await fetch(`${API_URL}/api/cards/collection/${user.userId}?${params}`)
    const data = await res.json()
    return data.cards || []
  }

  const handleExport = async (format) => {
    setShowExportMenu(false)
    setExporting(true)
    try {
      const allCards = await loadAllForExport()
      const name = collection?.name || 'collection'
      if (format === 'csv')     exportCollectionCSV(allCards, name)
      if (format === 'manabox') exportCollectionManaBox(allCards, name)
      if (format === 'xlsx')    exportCollectionXLSX(allCards, name)
      if (format === 'txt')     exportCollectionTXT(allCards, name)
    } catch (e) { console.error('Export error', e) }
    setExporting(false)
  }

  const loadCollection = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('page_size', '50')
      params.append('sort_by', sortBy)
      params.append('sort_order', sortOrder)

      if (collection) {
        params.append('collection_id', collection.id.toString())
      }

      if (search) {
        params.append('search', search)
      }

      // Add filters
      if (filters.colors.length > 0) {
        params.append('colors', filters.colors.join(','))
      }
      if (filters.types.length > 0) {
        params.append('types', filters.types.join(','))
      }
      if (filters.setCode) {
        params.append('set_code', filters.setCode)
      }
      if (filters.cmcMin) {
        params.append('cmc_min', filters.cmcMin)
      }
      if (filters.cmcMax) {
        params.append('cmc_max', filters.cmcMax)
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

  const toggleColor = (color) => {
    setPendingFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }))
  }

  const toggleType = (type) => {
    setPendingFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }))
  }

  const resetFilters = () => {
    const empty = { colors: [], types: [], setCode: '', cmcMin: '', cmcMax: '' }
    setPendingFilters(empty)
    setFilters(empty)
    setPage(1)
  }

  const applyFilters = () => {
    setFilters({ ...pendingFilters })
    setPage(1)
  }

  // Handle card click for card detail modal
  const handleCardClick = async (card) => {
    if (card.locked) return
    
    // Start with basic card data
    setSelectedCard({ ...card, quantity: card.quantity })
    setSelectedCardImageUrl(null)
    
    // Try to load full card data from backend (same as CardSearch)
    try {
      // First, search for the card to get its UUID
      const searchRes = await fetch(`${API_URL}/api/mtg-cards/search?query=${encodeURIComponent(card.name)}&page_size=1&language=${language}`)
      if (searchRes.ok) {
        const searchData = await searchRes.json()
        if (searchData.cards && searchData.cards.length > 0) {
          const foundCard = searchData.cards[0]
          
          // Now get the full card details with the UUID
          if (foundCard.uuid) {
            const detailRes = await fetch(`${API_URL}/api/mtg-cards/card/${foundCard.uuid}?language=${language}`)
            if (detailRes.ok) {
              const fullCard = await detailRes.json()
              fullCard.quantity = card.quantity
              setSelectedCard(fullCard)
              
              // Load image
              const imageUrl = await cardImageCache.getCardImage(card.name, card.set_code || null, language, card.set_code || null)
              if (imageUrl) {
                setSelectedCardImageUrl(imageUrl)
              }
              return
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading card from backend:', err)
    }
    
    // Fallback: just load image
    try {
      const imageUrl = await cardImageCache.getCardImage(card.name, card.set_code || null, language, card.set_code || null)
      if (imageUrl) {
        setSelectedCardImageUrl(imageUrl)
      }
    } catch (err) {
      console.error('Error loading card image:', err)
    }
  }

  const closeCardDetail = () => {
    setSelectedCard(null)
    setSelectedCardImageUrl(null)
  }

  const renderManaCost = (manaCost) => {
    if (!manaCost || manaCost.trim() === '') return <span className="mana-empty">—</span>
    const symbols = manaCost.match(/\{([^}]+)\}/g)
    if (!symbols) return <span className="mana-text">{manaCost}</span>
    return symbols.map((sym, i) => {
      const val = sym.replace(/[{}]/g, '')
      const colorInfo = manaSymbolMap[val]
      if (colorInfo) {
        return <span key={i} className="mana-symbol" style={{ background: colorInfo.bg, borderColor: colorInfo.border, color: colorInfo.text }}>{val}</span>
      }
      // Generic/colorless mana (numbers, X, etc.)
      return <span key={i} className="mana-symbol mana-generic">{val}</span>
    })
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
      
      if (res.status === 403 && onLimitError) {
        const errorData = await res.json()
        onLimitError(errorData.detail)
        setUploading(false)
        return
      }
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

  const toggleCardSelection = (cardId) => {
    setSelectAllPages(false)
    setSelectedCardIds(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    )
  }

  const toggleSelectAll = () => {
    // Se è già attivo "seleziona tutto pagine", deseleziona tutto
    if (selectAllPages) {
      setSelectAllPages(false)
      setSelectedCardIds([])
      return
    }
    const selectableIds = uniqueCards.filter(c => !c.locked).map(c => c.id)
    const allCurrentSelected = selectableIds.every(id => selectedCardIds.includes(id))
    if (allCurrentSelected) {
      setSelectedCardIds([])
    } else {
      setSelectedCardIds(selectableIds)
    }
  }

  const activateSelectAllPages = () => {
    setSelectAllPages(true)
    setSelectedCardIds([])
  }

  const openMoveModal = async () => {
    try {
      const res = await fetch(`${API_URL}/api/collections/user/${user.userId}`)
      const data = await res.json()
      const others = (data.collections || []).filter(c => c.id !== collection?.id)
      setAvailableCollections(others)
    } catch (err) {
      console.error('Error loading collections:', err)
    }
    setTargetCollectionId('')
    setShowMoveModal(true)
  }

  const handleMoveCards = async () => {
    if (!targetCollectionId || (!selectAllPages && selectedCardIds.length === 0)) return
    setMoving(true)
    try {
      const body = {
        target_collection_id: parseInt(targetCollectionId),
        user_id: user.userId,
        ...(selectAllPages
          ? {
              source_collection_id: collection?.id,
              search: search || undefined,
              colors: filters.colors.length ? filters.colors.join(',') : undefined,
              types: filters.types.length ? filters.types.join(',') : undefined,
              cmc_min: filters.cmcMin ? parseInt(filters.cmcMin) : undefined,
              cmc_max: filters.cmcMax ? parseInt(filters.cmcMax) : undefined,
            }
          : { card_ids: selectedCardIds })
      }
      const res = await fetch(`${API_URL}/api/collections/move-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        setShowMoveModal(false)
        setSelectedCardIds([])
        setSelectAllPages(false)
        setUploadMessage(`✓ ${t.moveSuccess}`)
        setTimeout(() => setUploadMessage(''), 3000)
        loadCollection()
        loadStats()
      }
    } catch (err) {
      console.error('Error moving cards:', err)
    }
    setMoving(false)
  }

  const handleDeleteCards = async () => {
    setDeleting(true)
    try {
      const body = {
        user_id: user.userId,
        ...(selectAllPages
          ? {
              source_collection_id: collection?.id,
              search: search || undefined,
              colors: filters.colors.length ? filters.colors.join(',') : undefined,
              types: filters.types.length ? filters.types.join(',') : undefined,
              cmc_min: filters.cmcMin ? parseInt(filters.cmcMin) : undefined,
              cmc_max: filters.cmcMax ? parseInt(filters.cmcMax) : undefined,
            }
          : { card_ids: selectedCardIds })
      }
      const res = await fetch(`${API_URL}/api/collections/delete-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        setShowDeleteConfirm(false)
        setSelectedCardIds([])
        setSelectAllPages(false)
        setUploadMessage(`✓ ${t.deleteSuccess}`)
        setTimeout(() => setUploadMessage(''), 3000)
        loadCollection()
        loadStats()
      }
    } catch (err) {
      console.error('Error deleting cards:', err)
    }
    setDeleting(false)
  }

  const openSetPicker = async (e, card) => {
    e.stopPropagation()
    if (card.locked) return
    setSetPickerCardId(card.id)
    setSetPickerEditions([])
    setSetPickerLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/cards/card/${card.id}/editions`)
      const data = await res.json()
      setSetPickerEditions(data.editions || [])
    } catch (err) { console.error(err) }
    setSetPickerLoading(false)
  }

  const handleChangeSet = async (cardId, setCode) => {
    try {
      const res = await fetch(`${API_URL}/api/cards/card/${cardId}/set?set_code=${setCode}`, { method: 'PUT' })
      if (res.ok) {
        const data = await res.json()
        setCards(prev => prev.map(c => {
          if (c.id === cardId) {
            // Sostituisci completamente i campi per evitare merge issues
            // Forza conversione esplicita a Number per evitare concatenazione
            return {
              ...c,
              set_code: data.set_code,
              set_name: data.set_name,
              price_eur: data.price_eur != null ? Number(data.price_eur) : null,
              price_usd: data.price_usd != null ? Number(data.price_usd) : null,
            }
          }
          return c
        }))
      }
    } catch (err) { console.error(err) }
    setSetPickerCardId(null)
  }

  const handleCardHover = (cardName, setCode) => {
    if (!cardName) return
    
    // Cancella timer precedente
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
    }
    
    hoveredCardRef.current = cardName
    setHoveredCard(cardName)
    setImageLoading(true)
    setCardImageUrl(null)
    
    // Debounce: carica immagine solo se il mouse resta sulla riga
    hoverTimerRef.current = setTimeout(async () => {
      if (hoveredCardRef.current !== cardName) return
      const imageUrl = await cardImageCache.getCardImage(cardName, setCode || null, language, setCode || null)
      if (hoveredCardRef.current === cardName) {
        setCardImageUrl(imageUrl)
        setImageLoading(false)
      }
    }, 150)
  }

  const handleCardLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    hoveredCardRef.current = null
    setHoveredCard(null)
    setCardImageUrl(null)
    setImageLoading(false)
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
                onShowSubscriptions && onShowSubscriptions()
              }}
            >
              🪙
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
            {/* Export dropdown */}
            <div className="export-dropdown-wrapper">
              <button
                className="export-btn"
                onClick={() => setShowExportMenu(v => !v)}
                disabled={exporting}
              >
                {exporting ? '⏳' : t.exportBtn}
              </button>
              {showExportMenu && (
                <div className="export-menu">
                  {[
                    { key: 'csv',     label: t.exportCSV },
                    { key: 'manabox', label: t.exportManaBox },
                    { key: 'xlsx',    label: t.exportXLSX },
                    { key: 'txt',     label: t.exportTXT },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => handleExport(opt.key)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {collection && collection.description && (
          <p className="collection-description">{collection.description}</p>
        )}
        <div className={`collection-linked-decks ${linkedDecks.length === 0 ? 'collection-linked-decks-empty' : ''}`}>
          <div className="linked-decks-title">
            🃏 {language === 'it' ? 'Mazzi Collegati' : 'Linked Decks'}
          </div>
          <div className="linked-decks-chips">
            {linkedDecks.map(deck => (
              <button
                key={deck.id}
                className="linked-deck-chip"
                onClick={() => onSelectDeck && onSelectDeck(deck)}
              >
                {deck.name}
                <span className="deck-chip-info">{deck.total_cards} {language === 'it' ? 'carte' : 'cards'}</span>
              </button>
            ))}
            <button className="link-deck-btn" onClick={openLinkDeckModal}>
              + {language === 'it' ? 'Collega Deck' : 'Link Deck'}
            </button>
          </div>
        </div>
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

        <div className="collection-controls">
          {stats && (
            <div className="collection-stats-inline">
              <span className="stat-badge">
                <strong>{stats.total_unique_cards}</strong> {t.totalUnique}
              </span>
              <span className="stat-separator">·</span>
              <span className="stat-badge">
                <strong>{stats.total_cards}</strong> {t.totalCards}
              </span>
              {(stats.total_value_eur > 0 || stats.total_value_usd > 0) && (
                <>
                  <span className="stat-separator">·</span>
                  <span className="stat-badge stat-value">
                    <strong>
                      {stats.total_value_eur > 0 
                        ? `€${stats.total_value_eur.toFixed(2)}`
                        : `$${stats.total_value_usd.toFixed(2)}`}
                    </strong> {language === 'it' ? 'Valore' : 'Value'}
                  </span>
                </>
              )}
            </div>
          )}
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
              <option value="mana_cost">{t.manaCostCol}</option>
              <option value="price">{language === 'it' ? 'Prezzo' : 'Price'}</option>
            </select>
            <button 
              className="sort-order-btn"
              onClick={() => { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); setPage(1); }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <button 
            className="filters-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? t.hideFilters : t.filters}
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-row">
              <div className="filter-group">
                <label>{language === 'it' ? 'Colore' : 'Color'}</label>
                <div className="mana-cmc-group">
                  <div className="mana-color-filters">
                    {Object.entries(manaSymbolMap).map(([key, info]) => (
                      <button
                        key={key}
                        className={`mana-color-btn ${pendingFilters.colors.includes(key) ? 'active' : ''}`}
                        style={{ background: info.bg, borderColor: info.border, color: info.text }}
                        onClick={() => toggleColor(key)}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                  <div className="cmc-inputs">
                    <span className="cmc-label">{t.cmc}</span>
                    <input
                      type="number"
                      placeholder={t.min}
                      value={pendingFilters.cmcMin}
                      onChange={(e) => setPendingFilters({...pendingFilters, cmcMin: e.target.value})}
                      className="cmc-input"
                      min="0"
                    />
                    <span className="cmc-separator">–</span>
                    <input
                      type="number"
                      placeholder={t.max}
                      value={pendingFilters.cmcMax}
                      onChange={(e) => setPendingFilters({...pendingFilters, cmcMax: e.target.value})}
                      className="cmc-input"
                      min="0"
                    />
                  </div>
                  <div className="set-code-input-wrapper">
                    <span className="set-code-label">{t.setCode}</span>
                    <input
                      type="text"
                      placeholder={t.setCodePlaceholder}
                      value={pendingFilters.setCode}
                      onChange={(e) => setPendingFilters({...pendingFilters, setCode: e.target.value})}
                      className="set-code-input"
                      maxLength="5"
                    />
                  </div>
                </div>
              </div>

              <div className="filter-group">
                <label>{t.type}</label>
                <div className="type-filters">
                  {typeOptions.map(type => (
                    <button
                      key={type}
                      className={`type-btn ${pendingFilters.types.includes(type) ? 'active' : ''}`}
                      onClick={() => toggleType(type)}
                    >
                      {t[type.toLowerCase()] || type}
                    </button>
                  ))}
                </div>
              </div>

              <button className="reset-btn" onClick={resetFilters}>{t.reset}</button>
              <button className="apply-filters-btn" onClick={applyFilters}>{t.applyFilters}</button>
            </div>
          </div>
        )}

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
            {language === 'it' && (
              <div className="translation-disclaimer">
                Non tutte le carte sono state tradotte in italiano. Anche le immagini di anteprima potrebbero essere disponibili solo in inglese.
              </div>
            )}
            <div className={`cards-table ${setPickerCardId !== null ? 'picker-open' : ''}`}>
              {selectedCardIds.length > 0 || selectAllPages ? (
                <div className="selection-bar">
                  <span className="selection-count">
                    {selectAllPages
                      ? `${pagination?.total_cards ?? '?'} ${t.cardsSelected}`
                      : `${selectedCardIds.length} ${t.cardsSelected}`}
                  </span>
                  {!selectAllPages && pagination && pagination.total_pages > 1 && (
                    <button className="select-all-pages-btn" onClick={activateSelectAllPages}>
                      {language === 'it'
                        ? `Seleziona tutte le ${pagination.total_cards} carte filtrate`
                        : `Select all ${pagination.total_cards} filtered cards`}
                    </button>
                  )}
                  {selectAllPages && (
                    <button className="select-all-btn" onClick={() => { setSelectAllPages(false); setSelectedCardIds([]) }}>
                      {t.deselectAll}
                    </button>
                  )}
                  <button className="move-cards-btn" onClick={openMoveModal}>
                    📦 {t.moveSelected}
                  </button>
                  <button className="delete-cards-btn" onClick={() => setShowDeleteConfirm(true)}>
                    🗑️ {t.deleteSelected}
                  </button>
                  <button className="deselect-btn" onClick={() => { setSelectedCardIds([]); setSelectAllPages(false) }}>✕</button>
                </div>
              ) : null}
              <table>
                <thead>
                  <tr>
                    <th className="col-check">
                      <input type="checkbox" onChange={toggleSelectAll}
                        checked={selectAllPages || (uniqueCards.filter(c => !c.locked).length > 0 && uniqueCards.filter(c => !c.locked).every(c => selectedCardIds.includes(c.id)))}
                      />
                    </th>
                    <th className="col-qty sortable" onClick={() => handleSort('quantity')}>
                      {t.quantity} {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="col-name sortable" onClick={() => handleSort('name')}>
                      {t.name} {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="col-price sortable" onClick={() => handleSort('price')}>
                      {language === 'it' ? 'Prezzo' : 'Price'} {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="col-set">Set</th>
                    <th className="col-mana sortable" onClick={() => handleSort('mana_cost')}>
                      {t.manaCostCol} {sortBy === 'mana_cost' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody key={uniqueCards.map(c => c.id).join(',')}>
                  {uniqueCards.map((card) => (
                    <tr
                      key={card.id}
                      className={`${card.locked ? 'locked-row' : 'clickable-row'} ${selectAllPages || selectedCardIds.includes(card.id) ? 'selected-row' : ''} ${setPickerCardId === card.id ? 'set-picker-active' : ''}`}
                      onMouseEnter={() => !card.locked && handleCardHover(card.name, card.set_code)}
                      onMouseLeave={handleCardLeave}
                      onClick={() => handleCardClick(card)}
                    >
                      <td className="col-check" onClick={e => e.stopPropagation()}>
                        {!card.locked && (
                          <input type="checkbox"
                            checked={selectAllPages || selectedCardIds.includes(card.id)}
                            onChange={() => toggleCardSelection(card.id)}
                          />
                        )}
                      </td>
                      <td className="col-qty" onClick={e => e.stopPropagation()}>
                        {card.locked ? (
                          <span className="blur-text">{card.quantity}</span>
                        ) : editingCardId === card.id ? (
                          <div className="qty-edit-inline">
                            <input type="number" min="0" value={editQuantity}
                              onChange={e => setEditQuantity(e.target.value)}
                              className="qty-input-small" autoFocus
                            />
                            <button className="qty-save" onClick={() => handleUpdateQuantity(card.id, parseInt(editQuantity))}>✓</button>
                            <button className="qty-cancel" onClick={cancelEditQuantity}>✕</button>
                          </div>
                        ) : (
                          <div className="qty-display" onClick={() => startEditQuantity(card)}>
                            <span className="qty-number">{card.quantity}</span>
                            <span className="qty-edit-icon">✏️</span>
                          </div>
                        )}
                      </td>
                      <td className="col-name">
                        {card.locked ? (
                          <span className="locked-overlay">
                            <span className="blur-text">{card.name}</span>
                            <span className="lock-badge">{t.lockedCard}</span>
                          </span>
                        ) : (
                          <>
                            <span className="card-name-main">{language === 'it' && card.name_it ? card.name_it : card.name}</span>
                            {language === 'it' && card.name_it && (
                              <span className="card-name-sub">{card.name}</span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="col-price">
                        {card.locked ? <span className="blur-text">—</span> : (
                          card.price_eur != null
                            ? <span className="price-tag">€{Number(card.price_eur).toFixed(2)}</span>
                            : card.price_usd != null
                              ? <span className="price-tag price-usd">${Number(card.price_usd).toFixed(2)}</span>
                              : <span className="price-none">—</span>
                        )}
                      </td>
                      <td className="col-set" onClick={e => e.stopPropagation()}>
                        {card.locked ? <span className="blur-text">—</span> : (
                          <div className="set-cell">
                            <span
                              className="set-badge set-badge-clickable"
                              title={t.changeSet}
                              onClick={e => openSetPicker(e, card)}
                            >
                              {(card.set_code || '—').toUpperCase()}
                            </span>
                            {setPickerCardId === card.id && (
                              <div className="set-picker-popover" onClick={e => e.stopPropagation()}>
                                <div className="set-picker-header">
                                  <span>{t.changeSet}</span>
                                  <button className="set-picker-close" onClick={() => setSetPickerCardId(null)}>✕</button>
                                </div>
                                {setPickerLoading ? (
                                  <div className="set-picker-loading">⏳</div>
                                ) : setPickerEditions.length === 0 ? (
                                  <div className="set-picker-empty">{t.noEditions}</div>
                                ) : (
                                  <div className="set-picker-list">
                                    {setPickerEditions.map(ed => (
                                      <button
                                        key={ed.set_code + ed.collector_number}
                                        className={`set-picker-item ${ed.set_code === card.set_code ? 'active' : ''}`}
                                        onClick={() => handleChangeSet(card.id, ed.set_code)}
                                      >
                                        <span className="set-picker-code">{ed.set_code?.toUpperCase()}</span>
                                        <span className="set-picker-name">{ed.set_name}</span>
                                        {ed.price_eur != null && (
                                          <span className="set-picker-price">€{Number(ed.price_eur).toFixed(2)}</span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="col-mana">
                        {card.locked
                          ? <span className="blur-text">{renderManaCost(card.mana_cost)}</span>
                          : renderManaCost(card.mana_cost)}
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

      {/* Card Preview Tooltip - mostra solo quando l'immagine è pronta */}
      {hoveredCard && cardImageUrl && (
        <div className="card-preview-tooltip">
          <img src={cardImageUrl} alt={hoveredCard} className="card-preview-image" />
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="modal-overlay" onClick={closeCardDetail}>
          <div className="modal-content card-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeCardDetail}>✕</button>
            
            <div className="card-detail-content">
              <div className="card-detail-image-wrapper">
                {selectedCardImageUrl ? (
                  <img 
                    src={selectedCardImageUrl} 
                    alt={selectedCard.name} 
                    className="card-detail-image"
                  />
                ) : (
                  <div className="card-image-loading">
                    <div className="spinner"></div>
                  </div>
                )}
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
                  {selectedCard.quantity && <p><strong>{t.quantity}:</strong> {selectedCard.quantity}</p>}
                  {selectedCard.rarity && <p><strong>{language === 'it' ? 'Rarità' : 'Rarity'}:</strong> {selectedCard.rarity}</p>}
                  {selectedCard.set_code && <p><strong>Set:</strong> {selectedCard.set_code}</p>}
                  {selectedCard.artist && <p><strong>{language === 'it' ? 'Artista' : 'Artist'}:</strong> {selectedCard.artist}</p>}
                </div>
                
                {selectedCard.legalities && Object.keys(selectedCard.legalities).length > 0 && (
                  <div className="detail-legalities">
                    <strong>{language === 'it' ? 'Legalità' : 'Legalities'}:</strong>
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

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🗑️ {t.deleteConfirmTitle}</h2>
            <p className="modal-subtitle">
              {selectAllPages ? t.deleteConfirmAll : t.deleteConfirmMsg}
            </p>
            <p className="delete-count">
              {selectAllPages
                ? `${pagination?.total_cards ?? '?'} ${t.cardsSelected}`
                : `${selectedCardIds.length} ${t.cardsSelected}`}
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>{t.cancel}</button>
              <button className="delete-confirm-btn" onClick={handleDeleteCards} disabled={deleting}>
                {deleting ? t.deleting : t.deleteConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Cards Modal */}
      {showMoveModal && (
        <div className="modal-overlay" onClick={() => setShowMoveModal(false)}>
          <div className="modal-content move-cards-modal" onClick={(e) => e.stopPropagation()}>
            <h2>📦 {t.moveCards}</h2>
            <p className="modal-subtitle">{selectedCardIds.length} {t.cardsSelected}</p>
            <div className="form-group">
              <label>{t.selectTarget}</label>
              <select
                value={targetCollectionId}
                onChange={(e) => setTargetCollectionId(e.target.value)}
                className="collection-select"
              >
                <option value="">-- {t.selectTarget} --</option>
                {availableCollections.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.card_count} {t.cards})</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowMoveModal(false)}>{t.cancel}</button>
              <button
                className="confirm-btn"
                onClick={handleMoveCards}
                disabled={!targetCollectionId || moving}
              >
                {moving ? t.moving : t.moveConfirm}
              </button>
            </div>
          </div>
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

      {/* Link Deck Modal */}
      {showLinkDeckModal && (
        <div className="modal-overlay" onClick={() => setShowLinkDeckModal(false)}>
          <div className="modal-content link-deck-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{language === 'it' ? 'Collega un Deck' : 'Link a Deck'}</h2>
            {loadingDecks ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : availableDecks.length === 0 ? (
              <p className="no-decks-msg">{language === 'it' ? 'Nessun deck disponibile da collegare' : 'No available decks to link'}</p>
            ) : (
              <div className="link-deck-list">
                {availableDecks.map(deck => (
                  <button
                    key={deck.id}
                    className="link-deck-option"
                    onClick={() => handleLinkDeck(deck.id)}
                  >
                    <span className="link-deck-name">🃏 {deck.name}</span>
                    <span className="link-deck-info">{deck.total_cards} {language === 'it' ? 'carte' : 'cards'}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowLinkDeckModal(false)}>
                {language === 'it' ? 'Chiudi' : 'Close'}
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
