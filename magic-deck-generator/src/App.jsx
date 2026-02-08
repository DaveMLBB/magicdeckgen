import { useState, useEffect } from 'react'
import './App.css'
import Auth from './components/Auth'
import Subscriptions from './components/Subscriptions'
import Collection from './components/Collection'
import CollectionsList from './components/CollectionsList'
import CardSearch from './components/CardSearch'

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
  const [currentView, setCurrentView] = useState('main') // 'main', 'collections', 'collection-detail', 'card-search'
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
  
  // Stati per la selezione collezione
  const [showCollectionSelector, setShowCollectionSelector] = useState(false)
  const [userCollections, setUserCollections] = useState([])
  const [loadingCollections, setLoadingCollections] = useState(false)
  const [showFormatWarning, setShowFormatWarning] = useState(false)
  const [importing, setImporting] = useState(false)
  
  // Stati per card preview
  const [hoveredCard, setHoveredCard] = useState(null)
  const [cardImageUrl, setCardImageUrl] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)

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
      searchCards: '🔍 Cerca Carte',
      complete: 'completo',
      cards: 'carte',
      noCardsFound: '⚠️ Nessuna carta trovata per questo mazzo',
      errorAnalyzing: 'Errore: Impossibile analizzare il file',
      errorUploading: 'Errore nel caricamento del file',
      errorSearching: 'Errore nella ricerca dei deck',
      mustMapColumns: '⚠️ Devi mappare almeno le colonne Nome e Quantità',
      foundDecks: 'Trovati',
      decksCompatible: 'mazzi compatibili (mostrando top 20)',
      howToTitle: '📋 Come Preparare il File',
      howToStep1: '1. Esporta la tua collezione da un\'app di gestione carte (es. Delver Lens, TCGPlayer, ecc.)',
      howToStep2: '2. Il file deve contenere almeno due colonne: Nome Carta e Quantità',
      howToStep3: '3. Formati supportati: Excel (.xlsx) o CSV (.csv)',
      howToStep4: '⚠️ IMPORTANTE: I nomi delle carte devono essere in INGLESE',
      howToExample: 'Esempio formato:',
      exampleName: 'Nome',
      exampleQty: 'Quantità',
      exampleCard1: 'Lightning Bolt',
      exampleCard2: 'Counterspell',
      exampleCard3: 'Sol Ring',
      noDecksFound: 'Nessun deck trovato con i filtri selezionati',
      selectCollectionSource: 'Seleziona Origine Collezione',
      formatWarningTitle: '⚠️ Nessun Formato Selezionato',
      formatWarningMessage: 'Non hai selezionato un formato. La ricerca potrebbe richiedere fino a 5 minuti per analizzare tutti i 7200+ mazzi disponibili.',
      formatWarningContinue: 'Continua Comunque',
      formatWarningCancel: 'Annulla',
      uploadNewFile: '📁 Carica Nuovo File',
      uploadNewFileDesc: 'Carica un file Excel o CSV',
      loadExistingCollection: '📚 Carica Collezione Esistente',
      loadExistingCollectionDesc: 'Seleziona una collezione già creata',
      selectCollection: 'Seleziona Collezione',
      noCollectionsAvailable: 'Nessuna collezione disponibile',
      createCollectionFirst: 'Crea prima una collezione dalla sezione "📚 Collezione"',
      loadCollection: 'Carica Collezione',
      collectionLoaded: 'Collezione caricata con successo',
      close: 'Chiudi',
      importToCollection: 'Importa in Collezione',
      importing: 'Importando...',
      deckImported: 'Mazzo importato con successo!',
      errorImporting: 'Errore durante l\'importazione del mazzo'
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
      howToTitle: '📋 How to Prepare Your File',
      howToStep1: '1. Export your collection from a card management app (e.g., Delver Lens, TCGPlayer, etc.)',
      howToStep2: '2. The file must contain at least two columns: Card Name and Quantity',
      howToStep3: '3. Supported formats: Excel (.xlsx) or CSV (.csv)',
      howToStep4: '⚠️ IMPORTANT: Card names must be in ENGLISH',
      howToExample: 'Example format:',
      exampleName: 'Name',
      exampleQty: 'Quantity',
      exampleCard1: 'Lightning Bolt',
      exampleCard2: 'Counterspell',
      exampleCard3: 'Sol Ring',
      noDecksFound: 'No decks found with selected filters',
      selectCollectionSource: 'Select Collection Source',
      formatWarningTitle: '⚠️ No Format Selected',
      formatWarningMessage: 'You have not selected a format. The search may take up to 5 minutes to analyze all 3930+ available decks.',
      formatWarningContinue: 'Continue Anyway',
      formatWarningCancel: 'Cancel',
      uploadNewFile: '📁 Upload New File',
      uploadNewFileDesc: 'Upload an Excel or CSV file',
      loadExistingCollection: '📚 Load Existing Collection',
      loadExistingCollectionDesc: 'Select an already created collection',
      selectCollection: 'Select Collection',
      noCollectionsAvailable: 'No collections available',
      createCollectionFirst: 'Create a collection first from "📚 Collection" section',
      loadCollection: 'Load Collection',
      collectionLoaded: 'Collection loaded successfully',
      close: 'Close',
      importToCollection: 'Import to Collection',
      importing: 'Importing...',
      deckImported: 'Deck imported successfully!',
      errorImporting: 'Error importing deck'
    }
  }

  const t = translations[language]

  // Definisci le funzioni prima degli useEffect
  const loadSubscriptionStatus = async () => {
    if (!user) return
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

  const loadAvailableFormats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/decks/formats`)
      const data = await res.json()
      setAvailableFormats(data.formats || [])
    } catch (err) {
      console.error('Errore caricamento formati:', err)
    }
  }

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

  const handleLogin = (userData) => {
    setUser(userData)
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

  const handleUpload = async (e) => {
    // Se chiamato da input file, procedi con l'upload
    if (e && e.target && e.target.files) {
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
        setShowCollectionSelector(false)
        
      } catch (err) {
        console.error('❌ Errore:', err)
        setMessage(t.errorAnalyzing)
      }
      setLoading(false)
      
      // Reset input
      e.target.value = ''
    } else {
      // Altrimenti apri la modale di selezione
      setShowCollectionSelector(true)
      loadUserCollections()
    }
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
  
  const loadExistingCollection = async (collectionId) => {
    setLoading(true)
    setMessage('')
    try {
      // Carica tutte le carte con paginazione (max 100 per pagina)
      let allCards = []
      let page = 1
      let hasMore = true
      
      while (hasMore) {
        const res = await fetch(`${API_URL}/api/cards/collection/${user.userId}?collection_id=${collectionId}&page=${page}&page_size=100`)
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        const data = await res.json()
        
        allCards = [...allCards, ...data.cards]
        hasMore = data.pagination.has_next
        page++
      }
      
      // Converti le carte nel formato atteso
      const formattedCards = allCards.map(card => ({
        id: card.id,
        name: card.name,
        quantity_owned: card.quantity,
        card_type: card.type,
        colors: card.colors,
        mana_cost: card.mana_cost,
        rarity: card.rarity
      }))
      
      setCards(formattedCards)
      setMessage(`✓ ${t.collectionLoaded}: ${formattedCards.length} ${t.cardsLoaded}`)
      setShowCollectionSelector(false)
    } catch (err) {
      console.error('Error loading collection:', err)
      setMessage(t.errorUploading)
    }
    setLoading(false)
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
    
    try {
      // 1. Crea automaticamente una collezione con la data come nome
      const now = new Date()
      const collectionName = now.toLocaleString(language === 'it' ? 'it-IT' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      console.log('📁 Creazione collezione automatica:', collectionName)
      
      const createCollectionRes = await fetch(`${API_URL}/api/collections/create?user_id=${user.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: collectionName,
          description: null
        })
      })
      
      if (!createCollectionRes.ok) {
        const errorData = await createCollectionRes.json()
        setMessage(`${t.errorUploading}: ${errorData.detail || ''}`)
        setLoading(false)
        return
      }
      
      const newCollection = await createCollectionRes.json()
      console.log('✅ Collezione creata:', newCollection)
      
      // 2. Carica le carte nella nuova collezione
      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('mapping', JSON.stringify(columnMapping))
      formData.append('collection_id', newCollection.id.toString())

      const uploadRes = await fetch(`${API_URL}/api/cards/upload/${user.userId}`, {
        method: 'POST',
        body: formData
      })
      
      const data = await uploadRes.json()
      setMessage(`✓ ${data.message}`)
      loadCards()
      loadSubscriptionStatus()
      
      // Chiudi il mapper
      setShowColumnMapper(false)
      setFileToUpload(null)
      
    } catch (err) {
      console.error('Errore upload:', err)
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
    // Se non è selezionato un formato, mostra avviso
    if (filters.formats.length === 0) {
      setShowFormatWarning(true)
      return
    }
    
    performSearch()
  }
  
  const performSearch = async () => {
    setShowFormatWarning(false)
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
      
      // Mostra messaggio con info sui limiti
      if (data.decks?.length === 0) {
        setMessage(data.message || t.noDecksFound)
      } else {
        let msg = `✓ ${t.foundDecks} ${data.total_matches} ${t.decksCompatible}`
        
        // Se i risultati sono limitati, mostra avviso
        if (data.limited) {
          const limitInfo = {
            it: `(mostrando ${data.decks.length} di ${data.total_matches} - limite piano ${data.subscription_type})`,
            en: `(showing ${data.decks.length} of ${data.total_matches} - ${data.subscription_type} plan limit)`
          }
          msg += ` ${limitInfo[language]}`
        } else {
          msg += ` ${language === 'it' ? `(mostrando top ${data.decks.length})` : `(showing top ${data.decks.length})`}`
        }
        
        setMessage(msg)
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

  const handleCardHover = async (cardName) => {
    if (!cardName || cardName === hoveredCard) return
    
    setHoveredCard(cardName)
    setImageLoading(true)
    setCardImageUrl(null)
    
    try {
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

  const importDeckAsCollection = async (deckIndex) => {
    const deck = decks[deckIndex]
    if (!deck || !deck.deck_template_id) {
      setMessage(t.errorImporting)
      return
    }

    setImporting(true)
    try {
      const res = await fetch(
        `${API_URL}/api/collections/import-deck/${user.userId}/${deck.deck_template_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || t.errorImporting)
      }

      const enrichedMsg = data.cards_enriched > 0 
        ? ` (${data.cards_enriched} ${language === 'it' ? 'arricchite' : 'enriched'})`
        : ''
      
      setMessage(`✅ ${t.deckImported} "${data.name}" (${data.cards_added} ${t.cards}${enrichedMsg})`)
      
      // Opzionale: reindirizza alla collezione appena creata
      setTimeout(() => {
        setCurrentView('collections')
      }, 2000)

    } catch (err) {
      console.error('Errore import deck:', err)
      setMessage(`❌ ${err.message || t.errorImporting}`)
    } finally {
      setImporting(false)
    }
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
      ) : currentView === 'card-search' ? (
        <CardSearch
          user={user}
          onBack={() => setCurrentView('main')}
          language={language}
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
                <button className="collection-btn" onClick={() => setCurrentView('card-search')}>
                  {t.searchCards}
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
        {/* Sezione istruzioni */}
        {cards.length === 0 && (
          <section className="instructions-section">
            <h2>{t.howToTitle}</h2>
            <div className="instructions-content">
              <div className="instruction-steps">
                <p>✓ {t.howToStep1}</p>
                <p>✓ {t.howToStep2}</p>
                <p>✓ {t.howToStep3}</p>
                <p className="important-note">⚠️ {t.howToStep4}</p>
              </div>
              <div className="example-table">
                <h3>{t.howToExample}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>{t.exampleName}</th>
                      <th>{t.exampleQty}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{t.exampleCard1}</td>
                      <td>4</td>
                    </tr>
                    <tr>
                      <td>{t.exampleCard2}</td>
                      <td>3</td>
                    </tr>
                    <tr>
                      <td>{t.exampleCard3}</td>
                      <td>1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        <section className="upload-section">
          <button 
            className={`upload-btn ${loading ? 'disabled' : ''}`}
            onClick={() => handleUpload()}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {t.uploading}
              </>
            ) : (
              t.uploadBtn
            )}
          </button>
          {cards.length > 0 && !loading && (
            <span className="card-count">✅ {cards.length} {t.cardsLoaded}</span>
          )}
        </section>

        {message && <div className="message">{message}</div>}
        
        {/* Modal per selezionare origine collezione */}
        {showCollectionSelector && (
          <div className="modal-overlay" onClick={() => setShowCollectionSelector(false)}>
            <div className="modal-content collection-selector-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{t.selectCollectionSource}</h2>
              
              {loadingCollections ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                </div>
              ) : userCollections.length === 0 ? (
                <>
                  <div className="no-collections-message" style={{ marginBottom: '2rem' }}>
                    <p>{t.noCollectionsAvailable}</p>
                    <small>{t.createCollectionFirst}</small>
                  </div>
                  <div className="collection-source-options" style={{ gridTemplateColumns: '1fr', justifyItems: 'center' }}>
                    <label className="source-option" style={{ maxWidth: '400px' }}>
                      <div className="source-icon">📁</div>
                      <div className="source-title">{t.uploadNewFile}</div>
                      <div className="source-desc">{t.uploadNewFileDesc}</div>
                      <input 
                        type="file" 
                        accept=".xlsx,.csv" 
                        onChange={handleUpload} 
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="collection-source-options" style={{ gridTemplateColumns: '1fr', justifyItems: 'center' }}>
                    <label className="source-option" style={{ maxWidth: '400px' }}>
                      <div className="source-icon">📁</div>
                      <div className="source-title">{t.uploadNewFile}</div>
                      <div className="source-desc">{t.uploadNewFileDesc}</div>
                      <input 
                        type="file" 
                        accept=".xlsx,.csv" 
                        onChange={handleUpload} 
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  
                  <div className="collection-select-section">
                    <h3>{t.selectCollection}</h3>
                    <div className="collections-list">
                      {userCollections.map(collection => (
                        <div 
                          key={collection.id} 
                          className="collection-item"
                          onClick={() => loadExistingCollection(collection.id)}
                        >
                          <div className="collection-item-name">{collection.name}</div>
                          <div className="collection-item-stats">
                            {collection.card_count} {t.uniqueCards} • {collection.total_cards} {t.cards}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <div className="modal-actions">
                <button 
                  className="cancel-btn" 
                  onClick={() => setShowCollectionSelector(false)}
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        )}
        
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
                    {deck.format && <span className="deck-format">{deck.format}</span>}
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
            <div className="deck-detail-header">
              <h2>{decks[selectedDeck].name}</h2>
              <button 
                className="import-deck-btn"
                onClick={() => importDeckAsCollection(selectedDeck)}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <span className="spinner"></span>
                    {t.importing}
                  </>
                ) : (
                  <>📥 {t.importToCollection}</>
                )}
              </button>
            </div>
            <div className="deck-info">
              {decks[selectedDeck].format && <p>{t.format}: <strong>{decks[selectedDeck].format}</strong></p>}
              <p>{t.match}: <strong>{decks[selectedDeck].match_percentage}%</strong></p>
              <p>{t.cardsOwned}: <strong>{decks[selectedDeck].cards_owned}/{decks[selectedDeck].total_cards}</strong></p>
              {decks[selectedDeck].can_build && <p className="can-build">{t.canBuild}</p>}
            </div>
            
            {decks[selectedDeck].deck_list && decks[selectedDeck].deck_list.length > 0 ? (
              <>
                <h3>{t.completeList} ({decks[selectedDeck].deck_list.length} {t.uniqueCards})</h3>
                <div className="cards-list">
                  {decks[selectedDeck].deck_list.map((card, i) => (
                    <div 
                      key={i} 
                      className={`card-item ${card.missing > 0 ? 'missing' : 'owned'}`}
                      onMouseEnter={() => handleCardHover(card.name)}
                      onMouseLeave={handleCardLeave}
                    >
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
        
        {/* Format Warning Modal */}
        {showFormatWarning && (
          <div className="modal-overlay" onClick={() => setShowFormatWarning(false)}>
            <div className="modal-content format-warning-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{t.formatWarningTitle}</h2>
              <p className="warning-message">{t.formatWarningMessage}</p>
              <div className="modal-actions">
                <button 
                  className="cancel-btn" 
                  onClick={() => setShowFormatWarning(false)}
                >
                  {t.formatWarningCancel}
                </button>
                <button 
                  className="confirm-btn warning-btn" 
                  onClick={performSearch}
                >
                  {t.formatWarningContinue}
                </button>
              </div>
            </div>
          </div>
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

      {/* Bug Report Button - always visible */}
      <a 
        href="https://cloudsw.site/contatti" 
        target="_blank" 
        rel="noopener noreferrer"
        className="bug-report-btn"
        title={language === 'it' ? 'Segnala un problema' : 'Report a bug'}
      >
        🐛 {language === 'it' ? 'Segnala Bug' : 'Report Bug'}
      </a>
    </div>
  )
}

export default App
