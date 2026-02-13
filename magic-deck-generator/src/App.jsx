import { useState, useEffect } from 'react'
import './App.css'
import './mobile.css'
import Auth from './components/Auth'
import Subscriptions from './components/Subscriptions'
import Collection from './components/Collection'
import CollectionsList from './components/CollectionsList'
import CardSearch from './components/CardSearch'
import SavedDecksList from './components/SavedDecksList'
import SavedDeck from './components/SavedDeck'
import CookieConsentBanner from './components/CookieConsentBanner'
import PrivacySettings from './components/PrivacySettings'
import LegalPages from './components/LegalPages'
import CookieSettings from './components/CookieSettings'
import EmailPreferences from './components/EmailPreferences'
import { cardImageCache } from './utils/cardImageCache'
import './components/ColumnMapper.css' // IMPORTATO PER ULTIMO - VINCE SU TUTTO

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
  const [currentView, setCurrentView] = useState('main') // 'main', 'collections', 'collection-detail', 'card-search', 'saved-decks', 'saved-deck-detail', 'subscriptions', 'privacy-settings', 'privacy-policy', 'terms-of-service', 'cookie-settings', 'email-preferences'
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [selectedSavedDeck, setSelectedSavedDeck] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [hasShownSubscriptionModal, setHasShownSubscriptionModal] = useState(false)
  const [loadingDeckCards, setLoadingDeckCards] = useState(false)
  const [loadedDeckIds, setLoadedDeckIds] = useState(new Set()) // Track which decks have been loaded
  const [filters, setFilters] = useState({
    colors: [],
    minMatch: 80,
    buildableOnly: false,
    formats: [],
    deckSource: 'system', // 'system', 'users', 'both'
    collectionId: null // collezione specifica per la ricerca
  })
  const [availableFormats, setAvailableFormats] = useState([])
  const [searchCollections, setSearchCollections] = useState([])
  
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  
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
      uploading: 'Ricerca...',
      cardsLoaded: 'carte caricate',
      searchFilters: '🔍 Filtri di Ricerca',
      colors: 'Colori:',
      format: 'Formato:',
      minCompletion: 'Completamento minimo:',
      buildableOnly: 'Solo mazzi costruibili (≥90%)',
      resetFilters: '🔄 Reset Filtri',
      findDecks: '🔍 Trova Mazzi Compatibili',
      analyzing: 'Ricerca...',
      deckSearchDisclaimer: 'Una singola richiesta può richiedere fino a 10 minuti se molto estesa.',
      searchCollection: 'Collezione:',
      allCollections: 'Tutte le collezioni',
      deckSource: 'Fonte Mazzi:',
      deckSourceSystem: 'Solo Sistema',
      deckSourceUsers: 'Solo Utenti',
      deckSourceBoth: 'Entrambi',
      deckSourceSystemDesc: 'Mazzi competitivi del database',
      deckSourceUsersDesc: 'Mazzi pubblici degli utenti',
      deckSourceBothDesc: 'Sistema + Utenti',
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
      viewDecks: '🃏 Mazzi Salvati',
      complete: 'completo',
      saveDeck: 'Salva Mazzo',
      saving: 'Salvando...',
      deckSaved: 'Mazzo salvato con successo!',
      errorSaving: 'Errore nel salvataggio del mazzo',
      cards: 'carte',
      noCardsFound: '⚠️ Nessuna carta trovata per questo mazzo',
      errorAnalyzing: 'Errore: Impossibile analizzare il file',
      errorUploading: 'Errore nel caricamento del file',
      errorSearching: 'Errore nella ricerca dei deck',
      limitReached: 'Limite raggiunto. Aggiorna il tuo abbonamento per continuare.',
      upgradePlanTitle: 'Limite del piano raggiunto',
      upgradePlanBtn: 'Vedi Piani di Abbonamento',
      upgradePlanClose: 'Chiudi',
      errorImporting: 'Errore nell\'importazione del mazzo',
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
      formatWarningMessage: 'Non hai selezionato un formato. La ricerca potrebbe richiedere fino a 10 minuti per analizzare tutti i 7200+ mazzi disponibili.',
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
      deckImported: 'Mazzo importato con successo!'
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
      analyzing: 'Loading...',
      deckSearchDisclaimer: 'A single request can take up to 10 minutes if very extensive.',
      searchCollection: 'Collection:',
      allCollections: 'All collections',
      deckSource: 'Deck Source:',
      deckSourceSystem: 'System Only',
      deckSourceUsers: 'Users Only',
      deckSourceBoth: 'Both',
      deckSourceSystemDesc: 'Competitive decks from database',
      deckSourceUsersDesc: 'Public user decks',
      deckSourceBothDesc: 'System + Users',
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
      searchCards: '🔍 Search Cards',
      viewDecks: '🃏 Saved Decks',
      complete: 'complete',
      saveDeck: 'Save Deck',
      saving: 'Saving...',
      deckSaved: 'Deck saved successfully!',
      errorSaving: 'Error saving deck',
      cards: 'cards',
      noCardsFound: '⚠️ No cards found for this deck',
      errorAnalyzing: 'Error: Unable to analyze file',
      errorUploading: 'Error uploading file',
      errorSearching: 'Error searching for decks',
      limitReached: 'Limit reached. Upgrade your subscription to continue.',
      upgradePlanTitle: 'Plan Limit Reached',
      upgradePlanBtn: 'View Subscription Plans',
      upgradePlanClose: 'Close',
      errorImporting: 'Error importing deck',
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
      deckImported: 'Deck imported successfully!'
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
        setCurrentView('subscriptions')
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

  // Helper: mostra modale upgrade quando si raggiunge un limite
  const showLimitError = (detail) => {
    setUpgradeMessage(detail || t.limitReached)
    setShowUpgradeModal(true)
  }

  // Gestione ritorno da Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const stripeStatus = params.get('stripe_status')
    if (stripeStatus) {
      setCurrentView('subscriptions')
    }
  }, [])

  // Gestione verifica email da URL (/verify?token=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verifyToken = params.get('token')
    const isVerifyPage = window.location.pathname === '/verify'

    if (isVerifyPage && verifyToken) {
      const verifyEmail = async () => {
        try {
          const res = await fetch(`${API_URL}/api/auth/verify/${verifyToken}`, {
            method: 'POST'
          })
          const data = await res.json()
          if (res.ok) {
            setMessage('✅ Email verificata con successo! Ora puoi effettuare il login.')
            localStorage.setItem('isVerified', 'true')
            // Aggiorna user se già loggato
            setUser(prev => prev ? { ...prev, isVerified: true } : prev)
          } else {
            setMessage(`❌ ${data.detail || 'Errore nella verifica'}`)
          }
        } catch (err) {
          console.error('Errore verifica email:', err)
          setMessage('❌ Errore nella verifica email')
        }
        // Pulisci URL
        window.history.replaceState({}, '', '/')
      }
      verifyEmail()
    }
  }, [])

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
      loadSearchCollections()
    }
  }, [language, user])

  // Carica le carte quando viene selezionato un mazzo pubblico
  useEffect(() => {
    const loadUserDeckCards = async () => {
      if (!user || selectedDeck === null || !decks[selectedDeck]) return
      
      const deck = decks[selectedDeck]
      
      // Carica solo se è un mazzo utente, ha saved_deck_id, non ha già deck_list e non è già stato caricato
      if (deck.source === 'user' && 
          deck.saved_deck_id && 
          (!deck.deck_list || deck.deck_list.length === 0) &&
          !loadedDeckIds.has(deck.saved_deck_id)) {
        
        setLoadingDeckCards(true)
        setLoadedDeckIds(prev => new Set([...prev, deck.saved_deck_id]))
        
        try {
          const res = await fetch(`${API_URL}/api/saved-decks/${deck.saved_deck_id}?user_id=${user.userId}`)
          const data = await res.json()
          
          // Aggiorna il deck con le carte caricate
          setDecks(prevDecks => {
            const newDecks = [...prevDecks]
            newDecks[selectedDeck] = {
              ...newDecks[selectedDeck],
              deck_list: data.cards.map(card => ({
                name: card.card_name,
                quantity_needed: card.quantity,
                type: card.card_type,
                missing: card.quantity_missing
              }))
            }
            return newDecks
          })
        } catch (err) {
          console.error('Error loading user deck cards:', err)
        } finally {
          setLoadingDeckCards(false)
        }
      }
    }
    
    loadUserDeckCards()
  }, [selectedDeck, user]) // Rimuovi 'decks' dalle dipendenze

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
    return <Auth onLogin={handleLogin} language={language} setLanguage={setLanguage} />
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
      
      // Imposta la collezione caricata come filtro di ricerca predefinito
      setFilters(prev => ({ ...prev, collectionId: collectionId }))
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
      // 1. Elimina tutte le carte esistenti dell'utente (per evitare duplicati nell'analisi mazzi)
      console.log('🗑️ Eliminazione carte esistenti...')
      await fetch(`${API_URL}/api/cards/${user.userId}`, {
        method: 'DELETE'
      })
      
      // 2. Crea automaticamente una collezione con la data come nome
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
      
      if (createCollectionRes.status === 403) {
        const errorData = await createCollectionRes.json()
        showLimitError(errorData.detail)
        setLoading(false)
        return
      }
      if (!createCollectionRes.ok) {
        const errorData = await createCollectionRes.json()
        setMessage(`${t.errorUploading}: ${errorData.detail || ''}`)
        setLoading(false)
        return
      }
      
      const newCollection = await createCollectionRes.json()
      console.log('✅ Collezione creata:', newCollection)
      
      // 3. Carica le carte nella nuova collezione
      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('mapping', JSON.stringify(columnMapping))
      formData.append('collection_id', newCollection.id.toString())

      const uploadRes = await fetch(`${API_URL}/api/cards/upload/${user.userId}`, {
        method: 'POST',
        body: formData
      })
      
      if (uploadRes.status === 403) {
        const err = await uploadRes.json()
        showLimitError(err.detail)
        setLoading(false)
        return
      }
      
      const data = await uploadRes.json()
      setMessage(`✓ ${data.message}`)
      loadCards()
      loadSearchCollections()
      loadSubscriptionStatus()
      
      // Imposta la collezione appena creata come filtro di ricerca predefinito
      setFilters(prev => ({ ...prev, collectionId: newCollection.id }))
      
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

  const loadSearchCollections = async () => {
    try {
      const res = await fetch(`${API_URL}/api/collections/user/${user.userId}`)
      const data = await res.json()
      setSearchCollections(data.collections || data || [])
    } catch (err) {
      console.error('Errore caricamento collezioni per ricerca:', err)
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
    setLoadedDeckIds(new Set()) // Reset loaded decks when performing new search
    try {
      let allDecks = []
      
      // Cerca nei mazzi di sistema se richiesto
      if (filters.deckSource === 'system' || filters.deckSource === 'both') {
        const params = new URLSearchParams()
        
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
        
        if (filters.collectionId) {
          params.append('collection_id', filters.collectionId)
        }
        
        const url = `${API_URL}/api/decks/match/${user.userId}?${params.toString()}`
        console.log('🔍 Ricerca mazzi sistema:', url)
        
        const res = await fetch(url)
        if (res.status === 403) {
          const err = await res.json()
          showLimitError(err.detail)
          setDeckLoading(false)
          return
        }
        const data = await res.json()
        
        if (data.decks) {
          allDecks = [...allDecks, ...data.decks.map(d => ({ ...d, source: 'system' }))]
        }
      }
      
      // Cerca nei mazzi pubblici degli utenti se richiesto
      if (filters.deckSource === 'users' || filters.deckSource === 'both') {
        const params = new URLSearchParams()
        
        // Passa user_id per calcolare la compatibilità
        params.append('user_id', user.userId.toString())
        
        if (filters.formats.length > 0) {
          params.append('format', filters.formats[0])
        }
        
        if (filters.colors.length > 0) {
          params.append('colors', filters.colors.join(','))
        }
        
        params.append('page_size', '100') // Prendi più risultati
        
        if (filters.collectionId) {
          params.append('collection_id', filters.collectionId)
        }
        
        // Conta come ricerca solo se non abbiamo già cercato nei mazzi sistema
        if (filters.deckSource === 'users') {
          params.append('count_search', 'true')
        }
        
        const url = `${API_URL}/api/saved-decks/public/search?${params.toString()}`
        console.log('🔍 Ricerca mazzi utenti:', url)
        
        const res = await fetch(url)
        if (res.status === 403) {
          const err = await res.json()
          showLimitError(err.detail)
          setDeckLoading(false)
          return
        }
        const data = await res.json()
        
        if (data.decks) {
          // Converti formato mazzi pubblici in formato compatibile
          const userDecks = data.decks.map(deck => ({
            name: deck.name,
            colors: deck.colors,
            format: deck.format,
            archetype: deck.archetype,
            total_cards: deck.total_cards,
            match_percentage: deck.match_percentage || 0,
            cards_owned: deck.cards_owned || 0,
            missing_cards_count: deck.missing_cards_count || deck.total_cards,
            can_build: deck.can_build || false,
            deck_list: [],
            source: 'user',
            deck_template_id: null,
            saved_deck_id: deck.id
          }))
          allDecks = [...allDecks, ...userDecks]
        }
      }
      
      // Ordina per match percentage (mazzi sistema) e poi per data
      allDecks.sort((a, b) => {
        if (a.match_percentage !== b.match_percentage) {
          return b.match_percentage - a.match_percentage
        }
        return 0
      })
      
      setDecks(allDecks)
      
      // Mostra messaggio
      if (allDecks.length === 0) {
        setMessage(t.noDecksFound)
      } else {
        const sourceText = {
          system: language === 'it' ? 'sistema' : 'system',
          users: language === 'it' ? 'utenti' : 'users',
          both: language === 'it' ? 'sistema + utenti' : 'system + users'
        }
        const msg = `✓ ${t.foundDecks} ${allDecks.length} ${t.decksCompatible} (${sourceText[filters.deckSource]})`
        setMessage(msg)
      }
    } catch (err) {
      console.error('Errore ricerca:', err)
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

  const setDeckSource = (source) => {
    setFilters(prev => ({ ...prev, deckSource: source }))
  }

  const resetFilters = () => {
    setFilters({
      colors: [],
      minMatch: 80,
      buildableOnly: false,
      collectionId: null,
      formats: [],
      deckSource: 'system'
    })
  }

  const getColorEmoji = (colors) => {
    if (!colors) return '⚪'
    const colorMap = { W: '⚪', U: '🔵', B: '⚫', R: '🔴', G: '🟢' }
    return colors.split('/').map(c => colorMap[c] || c).join('')
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

      if (res.status === 403) {
        showLimitError(data.detail)
        setImporting(false)
        return
      }

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

  const saveDeckToSaved = async (deckIndex) => {
    const deck = decks[deckIndex]
    if (!deck || !deck.deck_list) {
      setMessage(t.errorSaving)
      return
    }

    setImporting(true)
    try {
      // Prepara le carte per il salvataggio
      const cards = deck.deck_list.map(card => ({
        card_name: card.name,
        quantity: card.quantity_needed,
        card_type: card.type || null,
        colors: null,
        mana_cost: null,
        rarity: null
      }))

      const res = await fetch(
        `${API_URL}/api/saved-decks/create?user_id=${user.userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: deck.name,
            description: deck.format ? `${deck.format} deck` : null,
            format: deck.format || null,
            colors: deck.colors || null,
            archetype: null,
            source: 'from_search',
            is_public: false,
            collection_ids: [],  // Nessuna collezione collegata di default
            cards: cards
          })
        }
      )

      const data = await res.json()

      if (res.status === 403) {
        showLimitError(data.detail)
        setImporting(false)
        return
      }

      if (!res.ok) {
        throw new Error(data.detail || t.errorSaving)
      }

      setMessage(`✅ ${t.deckSaved} "${data.name}" (${data.total_cards} ${t.cards})`)
      
      // Opzionale: reindirizza ai mazzi salvati
      setTimeout(() => {
        setCurrentView('saved-decks')
      }, 2000)

    } catch (err) {
      console.error('Errore salvataggio deck:', err)
      setMessage(`❌ ${err.message || t.errorSaving}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="app">
      {currentView === 'subscriptions' ? (
        <Subscriptions
          user={user}
          onBack={() => setCurrentView('main')}
          language={language}
        />
      ) : currentView === 'collections' ? (
        <CollectionsList
          user={user}
          onBack={() => setCurrentView('main')}
          onSelectCollection={(collection) => {
            setSelectedCollection(collection)
            setCurrentView('collection-detail')
          }}
          onSelectDeck={(deck) => {
            setSelectedSavedDeck(deck)
            setCurrentView('saved-deck-detail')
          }}
          language={language}
          onShowSubscriptions={() => setCurrentView('subscriptions')}
          onLimitError={showLimitError}
        />
      ) : currentView === 'collection-detail' ? (
        <Collection
          user={user}
          collection={selectedCollection}
          onBack={() => {
            setSelectedCollection(null)
            setCurrentView('collections')
          }}
          onSelectDeck={(deck) => {
            setSelectedSavedDeck(deck)
            setCurrentView('saved-deck-detail')
          }}
          language={language}
          onShowSubscriptions={() => setCurrentView('subscriptions')}
          onUploadComplete={() => loadSubscriptionStatus()}
          onLimitError={showLimitError}
        />
      ) : currentView === 'card-search' ? (
        <CardSearch
          user={user}
          onBack={() => setCurrentView('main')}
          language={language}
          onLimitError={showLimitError}
        />
      ) : currentView === 'saved-decks' ? (
        <SavedDecksList
          user={user}
          onBack={() => setCurrentView('main')}
          onSelectDeck={(deck) => {
            setSelectedSavedDeck(deck)
            setCurrentView('saved-deck-detail')
          }}
          language={language}
          onShowSubscriptions={() => setCurrentView('subscriptions')}
        />
      ) : currentView === 'saved-deck-detail' ? (
        <SavedDeck
          user={user}
          deck={selectedSavedDeck}
          onBack={() => {
            setSelectedSavedDeck(null)
            setCurrentView('saved-decks')
          }}
          language={language}
          onLimitError={showLimitError}
        />
      ) : currentView === 'privacy-settings' ? (
        <PrivacySettings
          user={user}
          language={language}
          onBack={() => setCurrentView('main')}
        />
      ) : currentView === 'privacy-policy' ? (
        <LegalPages
          pageType="privacy"
          user={user}
          language={language}
          onBack={() => setCurrentView('main')}
        />
      ) : currentView === 'terms-of-service' ? (
        <LegalPages
          pageType="terms"
          user={user}
          language={language}
          onBack={() => setCurrentView('main')}
        />
      ) : currentView === 'cookie-settings' ? (
        <CookieSettings
          user={user}
          language={language}
          onBack={() => setCurrentView('main')}
        />
      ) : currentView === 'email-preferences' ? (
        <EmailPreferences
          user={user}
          language={language}
          onBack={() => setCurrentView('main')}
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
                <button className="collection-btn" onClick={() => setCurrentView('saved-decks')}>
                  {t.viewDecks}
                </button>
                {subscriptionStatus && (
                  <button className="subscription-btn" onClick={() => setCurrentView('subscriptions')}>
                    💎 {subscriptionStatus.uploads_remaining} {t.uploadsRemaining}
                  </button>
                )}
                <button className="collection-btn" onClick={() => setCurrentView('privacy-settings')}>
                  🔒 {language === 'it' ? 'Privacy' : 'Privacy'}
                </button>
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
          <div className="collection-selector-overlay" onClick={() => setShowCollectionSelector(false)}>
            <div className="collection-selector-modal" onClick={(e) => e.stopPropagation()}>
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
          <div className="column-mapper-overlay">
            <div className="column-mapper">
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

              {searchCollections.length > 0 && (
                <div className="filter-group">
                  <label>{t.searchCollection}</label>
                  <select
                    className="collection-select"
                    value={filters.collectionId || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, collectionId: e.target.value ? parseInt(e.target.value) : null }))}
                  >
                    <option value="">{t.allCollections}</option>
                    {searchCollections.map(col => (
                      <option key={col.id} value={col.id}>
                        {col.name} ({col.card_count || 0})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="filter-group">
                <label>{t.deckSource}</label>
                <div className="deck-source-filters">
                  <button
                    className={`source-btn ${filters.deckSource === 'system' ? 'active' : ''}`}
                    onClick={() => setDeckSource('system')}
                    title={t.deckSourceSystemDesc}
                  >
                    🏛️ {t.deckSourceSystem}
                  </button>
                  <button
                    className={`source-btn ${filters.deckSource === 'users' ? 'active' : ''}`}
                    onClick={() => setDeckSource('users')}
                    title={t.deckSourceUsersDesc}
                  >
                    👥 {t.deckSourceUsers}
                  </button>
                  <button
                    className={`source-btn ${filters.deckSource === 'both' ? 'active' : ''}`}
                    onClick={() => setDeckSource('both')}
                    title={t.deckSourceBothDesc}
                  >
                    🌐 {t.deckSourceBoth}
                  </button>
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

              {(filters.colors.length > 0 || filters.minMatch > 10 || filters.buildableOnly || filters.formats.length > 0 || filters.deckSource !== 'system' || filters.collectionId) && (
                <button className="reset-filters-btn-inline" onClick={resetFilters}>
                  🔄 Reset Filtri
                </button>
              )}
            </div>

            <div className="deck-search-disclaimer">
              <span className="info-icon">⏱️</span>
              <span className="info-text">
                {t.deckSearchDisclaimer}
              </span>
            </div>

            <button className="generate-btn" onClick={generateDecks} disabled={deckLoading}>
              {deckLoading ? (
                <>
                  <span style={{ alignItems: 'center' }} className="spinner"></span>
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
                    {deck.source === 'user' && (
                      <span className="deck-source-badge">
                        👥 {language === 'it' ? 'Utente' : 'User'}
                      </span>
                    )}
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
              <div className="deck-actions-group">
                {decks[selectedDeck].source === 'system' && (
                  <>
                    <button 
                      className="save-deck-btn"
                      onClick={() => saveDeckToSaved(selectedDeck)}
                      disabled={importing}
                    >
                      {importing ? (
                        <>
                          <span className="spinner"></span>
                          {t.saving}
                        </>
                      ) : (
                        <>💾 {t.saveDeck}</>
                      )}
                    </button>
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
                  </>
                )}
                {decks[selectedDeck].source === 'user' && (
                  <button 
                    className="save-deck-btn"
                    onClick={() => saveDeckToSaved(selectedDeck)}
                    disabled={importing}
                  >
                    {importing ? (
                      <>
                        <span className="spinner"></span>
                        {t.saving}
                      </>
                    ) : (
                      <>💾 {t.saveDeck}</>
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="deck-info">
              {decks[selectedDeck].format && <p>{t.format}: <strong>{decks[selectedDeck].format}</strong></p>}
              <p>{t.match}: <strong>{decks[selectedDeck].match_percentage}%</strong></p>
              <p>{t.cardsOwned}: <strong>{decks[selectedDeck].cards_owned}/{decks[selectedDeck].total_cards}</strong></p>
              {decks[selectedDeck].can_build && <p className="can-build">{t.canBuild}</p>}
            </div>
            
            {loadingDeckCards ? (
              <div className="loading-cards">
                <div className="spinner"></div>
                <p>{language === 'it' ? 'Caricamento carte...' : 'Loading cards...'}</p>
              </div>
            ) : decks[selectedDeck].deck_list && decks[selectedDeck].deck_list.length > 0 ? (
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
        
        {/* Card Preview Tooltip - mostra solo quando l'immagine è pronta */}
        {hoveredCard && cardImageUrl && (
          <div className="card-preview-tooltip">
            <img src={cardImageUrl} alt={hoveredCard} className="card-preview-image" />
          </div>
        )}
        
        {/* Format Warning Modal */}
        {showFormatWarning && (
          <div className="format-warning-overlay" onClick={() => setShowFormatWarning(false)}>
            <div className="format-warning-modal" onClick={(e) => e.stopPropagation()}>
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
            <div className="footer-content">
              <p>Magic Deck Builder © 2026</p>
              <div className="footer-links">
                <button onClick={() => setCurrentView('privacy-policy')} className="footer-link">
                  {language === 'it' ? 'Privacy' : 'Privacy Policy'}
                </button>
                <span className="footer-separator">•</span>
                <button onClick={() => setCurrentView('terms-of-service')} className="footer-link">
                  {language === 'it' ? 'Termini' : 'Terms'}
                </button>
                <span className="footer-separator">•</span>
                <button onClick={() => setCurrentView('cookie-settings')} className="footer-link">
                  {language === 'it' ? 'Cookie' : 'Cookies'}
                </button>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Cookie Consent Banner - always visible until consent given */}
      <CookieConsentBanner 
        language={language}
        onConsentChange={(consent) => {
          console.log('Consent updated:', consent)
        }}
        onPrivacyClick={() => setCurrentView('privacy-policy')}
      />

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

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="upgrade-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
            <div className="upgrade-modal-icon">🔒</div>
            <h2 className="upgrade-modal-title">{t.upgradePlanTitle}</h2>
            <p className="upgrade-modal-message">{upgradeMessage}</p>
            <div className="upgrade-modal-actions">
              <button 
                className="upgrade-modal-btn-primary"
                onClick={() => {
                  setShowUpgradeModal(false)
                  setCurrentView('subscriptions')
                }}
              >
                💎 {t.upgradePlanBtn}
              </button>
              <button 
                className="upgrade-modal-btn-secondary"
                onClick={() => setShowUpgradeModal(false)}
              >
                {t.upgradePlanClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
