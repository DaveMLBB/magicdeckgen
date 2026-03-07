import { useState, useEffect, useRef } from 'react'
import './AIBuilder.css'
import './AIBuilder-combos.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function AIBuilder({ user, onBack, language }) {
  const [decks, setDecks] = useState([])
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [deckStats, setDeckStats] = useState(null)
  const [optimizationGoal, setOptimizationGoal] = useState('balanced')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const [error, setError] = useState(null)
  const [mobileTab, setMobileTab] = useState('analysis') // 'analysis' or 'chat'

  // Chat Build Deck states
  const [mainView, setMainView] = useState('optimize') // 'optimize' | 'chat-build'
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatDeck, setChatDeck] = useState(null)
  const [chatCollections, setChatCollections] = useState([])
  const [chatCollectionId, setChatCollectionId] = useState(null)
  const [chatFormat, setChatFormat] = useState('')
  const [chatColors, setChatColors] = useState('')
  const [tokens, setTokens] = useState(user?.tokens || 0)
  const chatEndRef = useRef(null)

  console.log('🤖 AI Builder component mounted/updated', { 
    userId: user?.userId, 
    hasUser: !!user,
    userObject: user 
  })

  useEffect(() => {
    if (user && user.userId) {
      loadUserDecks()
      loadCollections()
    }
  }, [user])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const loadCollections = async () => {
    try {
      const res = await fetch(`${API_URL}/api/collections/user/${user.userId}`)
      const data = await res.json()
      setChatCollections(data.collections || [])
    } catch (err) {
      console.error('Error loading collections:', err)
    }
  }

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }]
    setChatHistory(newHistory)
    setChatLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/ai/chat-build-deck?language=${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          message: userMsg,
          history: chatHistory,
          collection_id: chatCollectionId || null,
          format: chatFormat || null,
          colors: chatColors || null
        })
      })
      const data = await res.json()
      if (!res.ok) {
        const errMsg = data.detail === 'DEMO_RATE_LIMIT'
          ? '⚠️ Limite richieste AI raggiunto. Riprova tra poco.'
          : data.detail || 'Errore AI'
        setChatHistory([...newHistory, { role: 'assistant', content: errMsg }])
      } else {
        setChatHistory([...newHistory, { role: 'assistant', content: data.assistant_message }])
        if (data.deck_updated && data.deck) setChatDeck(data.deck)
        if (data.tokens_remaining !== undefined) {
          setTokens(data.tokens_remaining)
          if (user) user.tokens = data.tokens_remaining
        }
      }
    } catch (err) {
      setChatHistory([...newHistory, { role: 'assistant', content: 'Errore di connessione. Riprova.' }])
    }
    setChatLoading(false)
  }

  const loadUserDecks = async () => {
    if (!user || !user.userId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/saved-decks/user/${user.userId}?page=1&page_size=100`)
      if (!res.ok) throw new Error('Failed to load decks')
      const data = await res.json()
      setDecks(data.decks || [])
    } catch (err) {
      setError('Errore nel caricamento dei mazzi')
    }
    setLoading(false)
  }

  const handleDeckSelect = async (deck) => {
    setSelectedDeck(deck)
    setSuggestions(null)
    setError(null)
    
    if (!user || !user.userId) {
      setError('User not loaded')
      return
    }
    
    // Load deck stats
    try {
      const res = await fetch(`${API_URL}/api/ai/deck-stats/${deck.id}?user_id=${user.userId}`)
      if (!res.ok) {
        throw new Error('Failed to load deck stats')
      }
      const data = await res.json()
      setDeckStats(data)
    } catch (err) {
      console.error('Error loading deck stats:', err)
      setError('Errore nel caricamento delle statistiche del mazzo')
    }
  }

  const handleOptimize = async () => {
    if (!selectedDeck || !user || !user.userId) {
      setError('Seleziona un mazzo e assicurati di essere autenticato')
      return
    }
    
    setAnalyzing(true)
    setError(null)
    setSuggestions(null)
    
    try {
      const res = await fetch(`${API_URL}/api/ai/optimize-deck?language=${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deck_id: selectedDeck.id,
          user_id: user.userId,
          optimization_goal: optimizationGoal
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Errore durante l\'analisi')
      }
      
      const data = await res.json()
      setSuggestions(data)
      
      // Update token balance
      if (data.tokens_remaining !== undefined) {
        user.tokens = data.tokens_remaining
      }
    } catch (err) {
      console.error('Error optimizing deck:', err)
      setError(err.message || 'Errore durante l\'analisi AI del mazzo')
    }
    
    setAnalyzing(false)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f5576c'
      case 'medium': return '#fbbf24'
      case 'low': return '#68d391'
      default: return '#a0aec0'
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'add': return '➕'
      case 'remove': return '➖'
      case 'replace': return '🔄'
      default: return '📝'
    }
  }

  const translations = {
    en: {
      title: 'AI Deck Builder',
      subtitle: 'Optimize your decks with AI-powered suggestions',
      tabOptimize: '📊 Optimize Deck',
      tabChatBuild: '✨ Build with AI',
      selectDeck: 'Select a deck to optimize',
      noDeck: 'No decks found. Create a deck first!',
      deckStats: 'Deck Statistics',
      totalCards: 'Total Cards',
      uniqueCards: 'Unique Cards',
      avgCMC: 'Average CMC',
      manaCurve: 'Mana Curve',
      typeDistribution: 'Type Distribution',
      colorDistribution: 'Color Distribution',
      optimizationGoal: 'Optimization Goal',
      balanced: 'Balanced', aggressive: 'Aggressive', defensive: 'Defensive/Control',
      midrange: 'Midrange', combo: 'Combo-Focused', tempo: 'Tempo',
      ramp: 'Ramp/Acceleration', tribal: 'Tribal Synergy', budget: 'Budget-Friendly',
      competitive: 'Competitive/cEDH', casual: 'Casual/Fun', thematic: 'Thematic/Flavor',
      voltron: 'Voltron', tokens: 'Token Strategy', graveyard: 'Graveyard Synergy',
      artifacts: 'Artifact-Focused', enchantments: 'Enchantment-Focused',
      spellslinger: 'Spellslinger', landfall: 'Landfall', lifegain: 'Lifegain',
      analyzeButton: 'Analyze Deck (2 🪙)', analyzing: 'Analyzing...',
      aiSuggestions: 'AI Suggestions', overallAssessment: 'Overall Assessment',
      manaCurveAnalysis: 'Mana Curve Analysis', synergyEvaluation: 'Synergy Evaluation',
      cardSuggestions: 'Card Suggestions', strategicRecommendations: 'Strategic Recommendations',
      priority: 'Priority', action: 'Action', reason: 'Reason', back: 'Back',
      chatPlaceholder: 'Describe the deck you want to build...',
      chatSend: 'Send',
      chatWelcome: 'Hi! Describe the deck you want to build. You can specify format, colors, strategy, or ask me to build from your collection.',
      chatFormat: 'Format (optional)',
      chatColors: 'Colors (optional)',
      chatCollection: 'Collection (optional)',
      chatCollectionNone: 'None — any card',
      chatDeckReady: '✅ Deck generated',
      chatTokenCost: '5 🪙 per message',
      chatReset: 'New conversation',
    },
    it: {
      title: 'AI Deck Builder',
      subtitle: 'Ottimizza i tuoi mazzi con suggerimenti AI',
      tabOptimize: '📊 Ottimizza Mazzo',
      tabChatBuild: '✨ Crea con AI',
      selectDeck: 'Seleziona un mazzo da ottimizzare',
      noDeck: 'Nessun mazzo trovato. Crea prima un mazzo!',
      deckStats: 'Statistiche Mazzo',
      totalCards: 'Carte Totali',
      uniqueCards: 'Carte Uniche',
      avgCMC: 'CMC Medio',
      manaCurve: 'Curva di Mana',
      typeDistribution: 'Distribuzione Tipi',
      colorDistribution: 'Distribuzione Colori',
      optimizationGoal: 'Obiettivo Ottimizzazione',
      balanced: 'Bilanciato', aggressive: 'Aggressivo', defensive: 'Difensivo/Controllo',
      midrange: 'Midrange', combo: 'Combo', tempo: 'Tempo',
      ramp: 'Ramp/Accelerazione', tribal: 'Sinergia Tribale', budget: 'Economico',
      competitive: 'Competitivo/cEDH', casual: 'Casual/Divertente', thematic: 'Tematico/Flavor',
      voltron: 'Voltron', tokens: 'Strategia Token', graveyard: 'Sinergia Cimitero',
      artifacts: 'Focus Artefatti', enchantments: 'Focus Incantesimi',
      spellslinger: 'Spellslinger', landfall: 'Landfall', lifegain: 'Guadagno Vita',
      analyzeButton: 'Analizza Mazzo (2 🪙)', analyzing: 'Analisi in corso...',
      aiSuggestions: 'Suggerimenti AI', overallAssessment: 'Valutazione Generale',
      manaCurveAnalysis: 'Analisi Curva di Mana', synergyEvaluation: 'Valutazione Sinergie',
      cardSuggestions: 'Suggerimenti Carte', strategicRecommendations: 'Raccomandazioni Strategiche',
      priority: 'Priorità', action: 'Azione', reason: 'Motivazione', back: 'Indietro',
      chatPlaceholder: 'Descrivi il mazzo che vuoi costruire...',
      chatSend: 'Invia',
      chatWelcome: 'Ciao! Descrivi il mazzo che vuoi costruire. Puoi specificare formato, colori, strategia, o chiedermi di costruire dalla tua collezione.',
      chatFormat: 'Formato (opzionale)',
      chatColors: 'Colori (opzionale)',
      chatCollection: 'Collezione (opzionale)',
      chatCollectionNone: 'Nessuna — qualsiasi carta',
      chatDeckReady: '✅ Mazzo generato',
      chatTokenCost: '5 🪙 per messaggio',
      chatReset: 'Nuova conversazione',
    }
  }

  const t = translations[language] || translations.en

  if (!user) {
    return (
      <div className="ai-builder">
        <div className="loading">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="ai-builder">
      <div className="ai-builder-header">
        <button onClick={onBack} className="back-button">← {t.back}</button>
        <div className="header-content">
          <h1>🤖 {t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <div className="token-display">
          🪙 {tokens}
        </div>
      </div>

      {/* Main view tabs */}
      <div className="main-view-tabs">
        <button
          className={`main-tab-btn ${mainView === 'optimize' ? 'active' : ''}`}
          onClick={() => setMainView('optimize')}
        >{t.tabOptimize}</button>
        <button
          className={`main-tab-btn ${mainView === 'chat-build' ? 'active' : ''}`}
          onClick={() => setMainView('chat-build')}
        >{t.tabChatBuild}</button>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {/* ── Chat Build Deck view ── */}
      {mainView === 'chat-build' && (
        <div className="chat-build-container">
          {/* Filters bar */}
          <div className="chat-build-filters">
            <select
              value={chatFormat}
              onChange={e => setChatFormat(e.target.value)}
              className="chat-filter-select"
            >
              <option value="">{t.chatFormat}</option>
              {['standard','modern','legacy','vintage','commander','pioneer','pauper'].map(f => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>
              ))}
            </select>
            <input
              type="text"
              value={chatColors}
              onChange={e => setChatColors(e.target.value.toUpperCase())}
              placeholder={t.chatColors + ' (es. WU, BRG)'}
              className="chat-filter-input"
              maxLength={5}
            />
            <select
              value={chatCollectionId || ''}
              onChange={e => setChatCollectionId(e.target.value ? parseInt(e.target.value) : null)}
              className="chat-filter-select"
            >
              <option value="">{t.chatCollectionNone}</option>
              {chatCollections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              className="chat-reset-btn"
              onClick={() => { setChatHistory([]); setChatDeck(null) }}
              title={t.chatReset}
            >🔄</button>
          </div>

          <div className="chat-build-body">
            {/* Chat panel */}
            <div className="chat-build-messages">
              {chatHistory.length === 0 && (
                <div className="chat-welcome-msg">
                  <span>🤖</span>
                  <p>{t.chatWelcome}</p>
                  <small>{t.chatTokenCost}</small>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                  <span className="chat-msg-avatar">{msg.role === 'user' ? '👤' : '🤖'}</span>
                  <div className="chat-msg-content">{msg.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="chat-msg chat-msg-assistant">
                  <span className="chat-msg-avatar">🤖</span>
                  <div className="chat-msg-content chat-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Deck preview panel */}
            {chatDeck && (
              <div className="chat-deck-preview">
                <div className="chat-deck-header">
                  <h3>{chatDeck.deck_name}</h3>
                  <span className="chat-deck-meta">{chatDeck.format} · {chatDeck.colors} · {chatDeck.archetype}</span>
                </div>
                <p className="chat-deck-desc">{chatDeck.deck_description}</p>
                <div className="chat-deck-cards">
                  {chatDeck.cards?.map((c, i) => (
                    <div key={i} className="chat-deck-card-row">
                      <span className="chat-deck-qty">{c.quantity}x</span>
                      <span className="chat-deck-name">{c.card_name}</span>
                      <span className="chat-deck-role">{c.role}</span>
                    </div>
                  ))}
                </div>
                {chatDeck.key_cards?.length > 0 && (
                  <div className="chat-deck-key-cards">
                    🔑 {chatDeck.key_cards.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="chat-build-input-row">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
              placeholder={t.chatPlaceholder}
              className="chat-build-input"
              disabled={chatLoading}
            />
            <button
              onClick={handleChatSend}
              disabled={chatLoading || !chatInput.trim()}
              className="chat-build-send-btn"
            >{t.chatSend}</button>
          </div>
        </div>
      )}

      {/* ── Optimize Deck view ── */}
      {mainView === 'optimize' && (
      <div className="ai-builder-content">
        {!selectedDeck ? (
          <div className="deck-selection-section">
            <h2>{t.selectDeck}</h2>
            {loading ? (
              <div className="loading">Caricamento...</div>
            ) : decks.length === 0 ? (
              <div className="no-decks">{t.noDeck}</div>
            ) : (
              <div className="ai-deck-grid">
                {decks.map(deck => (
                  <div
                    key={deck.id}
                    className="ai-deck-card"
                    onClick={() => handleDeckSelect(deck)}
                  >
                    <div className="ai-deck-card-header">
                      <h3>{deck.name}</h3>
                      {deck.colors && (
                        <div className="ai-deck-colors">
                          {deck.colors.split(',').map(c => (
                            <span key={c} className={`mana-symbol mana-${c.trim()}`}>{c.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ai-deck-card-info">
                      <span>{deck.total_cards} carte</span>
                      {deck.format && <span className="format-badge">{deck.format}</span>}
                      {deck.archetype && <span className="archetype-badge">{deck.archetype}</span>}
                    </div>
                    <div className="completion-bar">
                      <div 
                        className="completion-fill" 
                        style={{ 
                          width: `${deck.completion_percentage}%`,
                          backgroundColor: deck.completion_percentage >= 90 ? '#68d391' : 
                                         deck.completion_percentage >= 70 ? '#fbbf24' : '#f5576c'
                        }}
                      />
                      <span className="completion-text">{deck.completion_percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="ai-workspace">
            {/* Mobile Tab Navigation */}
            <div className="mobile-tab-nav">
              <button 
                className={`tab-btn ${mobileTab === 'analysis' ? 'active' : ''}`}
                onClick={() => setMobileTab('analysis')}
              >
                📊 Analisi Mazzo
              </button>
              <button 
                className={`tab-btn ${mobileTab === 'chat' ? 'active' : ''}`}
                onClick={() => setMobileTab('chat')}
              >
                🤖 Chat AI
              </button>
            </div>

            <div className={`deck-details-panel ${mobileTab === 'analysis' ? 'mobile-active' : 'mobile-hidden'}`}>
              <div className="panel-header">
                <h2>📋 {selectedDeck.name}</h2>
                <button onClick={() => {
                  setSelectedDeck(null)
                  setDeckStats(null)
                  setSuggestions(null)
                }} className="close-deck-btn">✕</button>
              </div>
              
              {deckStats && (
                <div className="deck-content">
                  {/* Statistics Section */}
                  <div className="stats-section">
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-value">{deckStats.stats.total_cards}</div>
                        <div className="stat-label">{t.totalCards}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{deckStats.stats.unique_cards}</div>
                        <div className="stat-label">{t.uniqueCards}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{deckStats.stats.average_cmc.toFixed(1)}</div>
                        <div className="stat-label">{t.avgCMC}</div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="charts-section">
                    {Object.keys(deckStats.stats.mana_curve).length > 0 && (
                      <div className="mana-curve-chart">
                        <h3>{t.manaCurve}</h3>
                        <div className="chart-bars">
                          {[0, 1, 2, 3, 4, 5, 6, 7].map(cmc => {
                            const count = deckStats.stats.mana_curve[cmc] || 0
                            const maxCount = Math.max(...Object.values(deckStats.stats.mana_curve))
                            const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                            
                            return (
                              <div key={cmc} className="chart-bar-container">
                                <div 
                                  className="chart-bar" 
                                  style={{ height: `${height}%` }}
                                  title={`${count} carte`}
                                >
                                  <span className="bar-count">{count}</span>
                                </div>
                                <div className="bar-label">{cmc === 7 ? '7+' : cmc}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {Object.keys(deckStats.stats.type_distribution).length > 0 && (
                      <div className="distribution-section">
                        <h3>{t.typeDistribution}</h3>
                        <div className="distribution-list">
                          {Object.entries(deckStats.stats.type_distribution)
                            .sort((a, b) => b[1] - a[1])
                            .map(([type, count]) => (
                              <div key={type} className="distribution-item">
                                <span className="dist-label">{type}</span>
                                <div className="dist-bar-container">
                                  <div 
                                    className="dist-bar" 
                                    style={{ width: `${(count / deckStats.stats.total_cards) * 100}%` }}
                                  />
                                </div>
                                <span className="dist-count">{count}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Optimization Section */}
                  <div className="optimization-section">
                    <div className="optimization-controls">
                      <div className="goal-selector">
                        <label>{t.optimizationGoal}</label>
                        <select 
                          value={optimizationGoal} 
                          onChange={(e) => setOptimizationGoal(e.target.value)}
                        >
                          <optgroup label="⚖️ Generali">
                            <option value="balanced">{t.balanced}</option>
                            <option value="budget">{t.budget}</option>
                            <option value="competitive">{t.competitive}</option>
                            <option value="casual">{t.casual}</option>
                            <option value="thematic">{t.thematic}</option>
                          </optgroup>
                          
                          <optgroup label="⚔️ Archetipi">
                            <option value="aggressive">{t.aggressive}</option>
                            <option value="defensive">{t.defensive}</option>
                            <option value="midrange">{t.midrange}</option>
                            <option value="combo">{t.combo}</option>
                            <option value="tempo">{t.tempo}</option>
                            <option value="ramp">{t.ramp}</option>
                            <option value="voltron">{t.voltron}</option>
                          </optgroup>
                          
                          <optgroup label="🎯 Strategie Specifiche">
                            <option value="tribal">{t.tribal}</option>
                            <option value="tokens">{t.tokens}</option>
                            <option value="graveyard">{t.graveyard}</option>
                            <option value="artifacts">{t.artifacts}</option>
                            <option value="enchantments">{t.enchantments}</option>
                            <option value="spellslinger">{t.spellslinger}</option>
                            <option value="landfall">{t.landfall}</option>
                            <option value="lifegain">{t.lifegain}</option>
                          </optgroup>
                        </select>
                      </div>
                      <button 
                        className="analyze-button"
                        onClick={() => {
                          handleOptimize()
                          setMobileTab('chat')
                        }}
                        disabled={analyzing}
                      >
                        {analyzing ? t.analyzing : t.analyzeButton}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`ai-chat-panel ${mobileTab === 'chat' ? 'mobile-active' : 'mobile-hidden'}`}>
              <div className="panel-header">
                <h2>🤖 AI Assistant</h2>
              </div>
              
              <div className="chat-content">
                {analyzing ? (
                  <div className="chat-loading">
                    <div className="spinner"></div>
                    <p>🤖 Analisi in corso con AI...</p>
                    <p className="loading-subtext">Sto analizzando il tuo mazzo con Groq AI</p>
                  </div>
                ) : !suggestions ? (
                  <div className="chat-empty">
                    <p>Seleziona un obiettivo di ottimizzazione e clicca "Analizza" per ricevere suggerimenti AI.</p>
                  </div>
                ) : (
                  <div className="suggestions-content">
                    {suggestions.suggestions.overall_assessment && (
                      <div className="suggestion-card">
                        <h3>{t.overallAssessment}</h3>
                        <p>{suggestions.suggestions.overall_assessment}</p>
                      </div>
                    )}

                    {suggestions.suggestions.mana_curve_analysis && (
                      <div className="suggestion-card">
                        <h3>{t.manaCurveAnalysis}</h3>
                        <p>{suggestions.suggestions.mana_curve_analysis}</p>
                      </div>
                    )}

                    {suggestions.suggestions.synergy_evaluation && (
                      <div className="suggestion-card">
                        <h3>{t.synergyEvaluation}</h3>
                        <p>{suggestions.suggestions.synergy_evaluation}</p>
                      </div>
                    )}

                    {suggestions.suggestions.card_suggestions && suggestions.suggestions.card_suggestions.length > 0 && (
                      <div className="suggestion-card">
                        <h3>{t.cardSuggestions}</h3>
                        <div className="card-suggestions-list">
                          {suggestions.suggestions.card_suggestions.map((suggestion, idx) => (
                            <div key={idx} className="card-suggestion-item">
                              <div className="suggestion-header">
                                <span className="action-icon">{getActionIcon(suggestion.action)}</span>
                                <span className="card-name">{suggestion.card_name}</span>
                                {suggestion.replace_with && (
                                  <span className="replace-arrow">→ {suggestion.replace_with}</span>
                                )}
                                {suggestion.estimated_price && (
                                  <span className="price-badge">{suggestion.estimated_price}</span>
                                )}
                                <span 
                                  className="priority-badge"
                                  style={{ backgroundColor: getPriorityColor(suggestion.priority) }}
                                >
                                  {suggestion.priority}
                                </span>
                              </div>
                              <p className="suggestion-reason">{suggestion.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestions.suggestions.combos && suggestions.suggestions.combos.length > 0 && (
                      <div className="suggestion-card combos-section">
                        <h3>🔗 Combo del Mazzo</h3>
                        <div className="combos-list">
                          {suggestions.suggestions.combos.map((combo, idx) => (
                            <div key={idx} className="combo-item">
                              <div className="combo-header">
                                <div className="combo-cards">
                                  {combo.cards.map((card, cardIdx) => (
                                    <span key={cardIdx} className="combo-card-name">
                                      {card}
                                      {cardIdx < combo.cards.length - 1 && <span className="combo-separator"> + </span>}
                                    </span>
                                  ))}
                                </div>
                                <div className="combo-badges">
                                  <span className={`combo-type-badge ${combo.type}`}>{combo.type}</span>
                                  <span className={`combo-difficulty-badge ${combo.difficulty}`}>{combo.difficulty}</span>
                                </div>
                              </div>
                              <p className="combo-description">{combo.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestions.suggestions.strategic_recommendations && suggestions.suggestions.strategic_recommendations.length > 0 && (
                      <div className="suggestion-card">
                        <h3>{t.strategicRecommendations}</h3>
                        <ul className="recommendations-list">
                          {suggestions.suggestions.strategic_recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      )} {/* end optimize view */}
    </div>
  )
}

export default AIBuilder
