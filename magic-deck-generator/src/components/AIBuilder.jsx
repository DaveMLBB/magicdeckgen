import { useState, useEffect, useRef } from 'react'
import './AIBuilder.css'
import './AIBuilder-combos.css'
import CardPreviewModal from './CardPreviewModal'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const CATEGORY_COLORS = {
  Creature: '#10b981', Spell: '#6366f1', Enchantment: '#ec4899',
  Artifact: '#94a3b8', Planeswalker: '#f59e0b', Land: '#78716c', Other: '#64748b',
}

const CHAT_SUGGESTIONS = {
  it: [
    '🏔️ Costruisci un mazzo Commander mono-verde con Ramp',
    '⚡ Mazzo aggro rosso-bianco per Modern, budget sotto $50',
    '🧙 Mazzo control blu-nero per Standard',
    '🐉 Mazzo Dragon Tribal per Commander',
    '💀 Mazzo Reanimator per Legacy',
    '🌊 Mazzo Merfolk Tribal per Pioneer',
    '🔥 Mazzo Burn veloce per Modern',
    '🤝 Mazzo Tokens bianco-verde per Commander',
  ],
  en: [
    '🏔️ Build a mono-green Commander deck with Ramp',
    '⚡ Red-white aggro deck for Modern, budget under $50',
    '🧙 Blue-black control deck for Standard',
    '🐉 Dragon Tribal Commander deck',
    '💀 Reanimator deck for Legacy',
    '🌊 Merfolk Tribal deck for Pioneer',
    '🔥 Fast Burn deck for Modern',
    '🤝 White-green Tokens Commander deck',
  ]
}

const tr = {
  it: {
    title: '🤖 AI Deck Builder',
    subtitle: 'Ottimizza o crea mazzi con AI',
    back: 'Indietro',
    tabOptimize: '📊 Ottimizza Mazzo',
    tabChatBuild: '✨ Crea con AI',
    // optimize
    selectDeck: 'Seleziona un mazzo da ottimizzare',
    noDeck: 'Nessun mazzo trovato. Crea prima un mazzo!',
    totalCards: 'Carte Totali', uniqueCards: 'Carte Uniche', avgCMC: 'CMC Medio',
    manaCurve: 'Curva di Mana', typeDistribution: 'Distribuzione Tipi',
    optimizationGoal: 'Obiettivo Ottimizzazione',
    balanced: 'Bilanciato', aggressive: 'Aggressivo', defensive: 'Difensivo/Controllo',
    midrange: 'Midrange', combo: 'Combo', tempo: 'Tempo', ramp: 'Ramp/Accelerazione',
    tribal: 'Sinergia Tribale', budget: 'Economico', competitive: 'Competitivo/cEDH',
    casual: 'Casual/Divertente', thematic: 'Tematico/Flavor', voltron: 'Voltron',
    tokens: 'Strategia Token', graveyard: 'Sinergia Cimitero', artifacts: 'Focus Artefatti',
    enchantments: 'Focus Incantesimi', spellslinger: 'Spellslinger', landfall: 'Landfall', lifegain: 'Guadagno Vita',
    analyzeButton: 'Analizza Mazzo (10 🪙)', analyzing: 'Analisi in corso...',
    overallAssessment: 'Valutazione Generale', manaCurveAnalysis: 'Analisi Curva di Mana',
    synergyEvaluation: 'Valutazione Sinergie', cardSuggestions: 'Suggerimenti Carte',
    strategicRecommendations: 'Raccomandazioni Strategiche',
    // chat build
    deckPanel: 'Mazzo Generato', totalCardsLabel: 'carte totali',
    emptyChat: 'Descrivi il mazzo che vuoi costruire. Puoi specificare formato, colori, strategia o chiedere di usare la tua collezione.',
    placeholder: 'Es: "Costruisci un mazzo aggro rosso per Modern", "Aggiungi più rimozioni", "Rendilo più economico"...',
    costHint: '5 🪙 per messaggio',
    sendBtn: 'Invia', sending: '...',
    suggestionsTitle: '💡 Suggerimenti',
    collectionLabel: '📚 Collezione (opzionale)',
    collectionNone: 'Nessuna — qualsiasi carta',
    collectionHint: 'L\'AI userà solo le carte di questa collezione (max 300)',
    formatLabel: 'Formato', colorsLabel: 'Colori (es. WU)',
    resetBtn: '↩️ Nuova conversazione',
    deckUpdated: '✏️ Mazzo aggiornato',
  },
  en: {
    title: '🤖 AI Deck Builder',
    subtitle: 'Optimize or create decks with AI',
    back: 'Back',
    tabOptimize: '📊 Optimize Deck',
    tabChatBuild: '✨ Build with AI',
    selectDeck: 'Select a deck to optimize',
    noDeck: 'No decks found. Create a deck first!',
    totalCards: 'Total Cards', uniqueCards: 'Unique Cards', avgCMC: 'Average CMC',
    manaCurve: 'Mana Curve', typeDistribution: 'Type Distribution',
    optimizationGoal: 'Optimization Goal',
    balanced: 'Balanced', aggressive: 'Aggressive', defensive: 'Defensive/Control',
    midrange: 'Midrange', combo: 'Combo-Focused', tempo: 'Tempo', ramp: 'Ramp/Acceleration',
    tribal: 'Tribal Synergy', budget: 'Budget-Friendly', competitive: 'Competitive/cEDH',
    casual: 'Casual/Fun', thematic: 'Thematic/Flavor', voltron: 'Voltron',
    tokens: 'Token Strategy', graveyard: 'Graveyard Synergy', artifacts: 'Artifact-Focused',
    enchantments: 'Enchantment-Focused', spellslinger: 'Spellslinger', landfall: 'Landfall', lifegain: 'Lifegain',
    analyzeButton: 'Analyze Deck (10 🪙)', analyzing: 'Analyzing...',
    overallAssessment: 'Overall Assessment', manaCurveAnalysis: 'Mana Curve Analysis',
    synergyEvaluation: 'Synergy Evaluation', cardSuggestions: 'Card Suggestions',
    strategicRecommendations: 'Strategic Recommendations',
    deckPanel: 'Generated Deck', totalCardsLabel: 'total cards',
    emptyChat: 'Describe the deck you want to build. You can specify format, colors, strategy, or ask to use your collection.',
    placeholder: 'E.g. "Build a red aggro deck for Modern", "Add more removal", "Make it more budget"...',
    costHint: '5 🪙 per message',
    sendBtn: 'Send', sending: '...',
    suggestionsTitle: '💡 Suggestions',
    collectionLabel: '📚 Collection (optional)',
    collectionNone: 'None — any card',
    collectionHint: 'AI will only use cards from this collection (max 300)',
    formatLabel: 'Format', colorsLabel: 'Colors (e.g. WU)',
    resetBtn: '↩️ New conversation',
    deckUpdated: '✏️ Deck updated',
  }
}

function AIBuilder({ user, onBack, language }) {
  const t = tr[language] || tr.it
  const messagesEndRef = useRef(null)

  // Optimize states
  const [mainView, setMainView] = useState('optimize')
  const [decks, setDecks] = useState([])
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [deckStats, setDeckStats] = useState(null)
  const [optimizationGoal, setOptimizationGoal] = useState('balanced')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const [error, setError] = useState(null)
  const [mobileTab, setMobileTab] = useState('analysis')

  // Chat Build states
  const [chatHistory, setChatHistory] = useState([])
  const [chatMessage, setChatMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatDeck, setChatDeck] = useState(null)
  const [collections, setCollections] = useState([])
  const [chatCollectionId, setChatCollectionId] = useState(null)
  const [chatFormat, setChatFormat] = useState('')
  const [chatColors, setChatColors] = useState('')
  const [tokens, setTokens] = useState(user?.tokens || 0)
  const [previewCard, setPreviewCard] = useState(null)

  useEffect(() => {
    if (user?.userId) { loadUserDecks(); loadCollections() }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatLoading])

  const loadUserDecks = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/saved-decks/user/${user.userId}?page=1&page_size=100`)
      const data = await res.json()
      setDecks(data.decks || [])
    } catch { setError('Errore nel caricamento dei mazzi') }
    setLoading(false)
  }

  const loadCollections = async () => {
    try {
      const res = await fetch(`${API_URL}/api/collections/user/${user.userId}`)
      const data = await res.json()
      setCollections(data.collections || [])
    } catch {}
  }

  const handleDeckSelect = async (deck) => {
    setSelectedDeck(deck); setSuggestions(null); setError(null)
    try {
      const res = await fetch(`${API_URL}/api/ai/deck-stats/${deck.id}?user_id=${user.userId}`)
      const data = await res.json()
      setDeckStats(data)
    } catch { setError('Errore nel caricamento delle statistiche') }
  }

  const handleOptimize = async () => {
    if (!selectedDeck) return
    setAnalyzing(true); setError(null); setSuggestions(null)
    try {
      const res = await fetch(`${API_URL}/api/ai/optimize-deck?language=${language}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck_id: selectedDeck.id, user_id: user.userId, optimization_goal: optimizationGoal })
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Errore') }
      const data = await res.json()
      setSuggestions(data)
      if (data.tokens_remaining !== undefined) { setTokens(data.tokens_remaining); if (user) user.tokens = data.tokens_remaining }
    } catch (err) { setError(err.message) }
    setAnalyzing(false)
  }

  const handleChatSend = async () => {
    if (!chatMessage.trim() || chatLoading) return
    const userMsg = chatMessage.trim()
    setChatMessage('')
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }]
    setChatHistory(newHistory)
    setChatLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/ai/chat-build-deck?language=${language}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId, message: userMsg, history: chatHistory,
          collection_id: chatCollectionId || null,
          format: chatFormat || null, colors: chatColors || null
        })
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.detail === 'DEMO_RATE_LIMIT'
          ? '⚠️ Limite richieste AI raggiunto. Riprova tra poco.'
          : data.detail === 'Token insufficienti' ? '❌ Token insufficienti.'
          : data.detail || 'Errore AI'
        setChatHistory([...newHistory, { role: 'assistant', content: msg }])
      } else {
        setChatHistory([...newHistory, { role: 'assistant', content: data.assistant_message, deck_updated: data.deck_updated }])
        if (data.deck_updated && data.deck) setChatDeck(data.deck)
        if (data.tokens_remaining !== undefined) { setTokens(data.tokens_remaining); if (user) user.tokens = data.tokens_remaining }
      }
    } catch { setChatHistory([...newHistory, { role: 'assistant', content: 'Errore di connessione. Riprova.' }]) }
    setChatLoading(false)
  }

  const handleChatKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend() } }

  const getPriorityColor = (p) => ({ high: '#f5576c', medium: '#fbbf24', low: '#68d391' }[p] || '#a0aec0')
  const getActionIcon = (a) => ({ add: '➕', remove: '➖', replace: '🔄' }[a] || '📝')

  const chatTotalCards = chatDeck?.cards?.reduce((s, c) => s + (c.quantity || 0), 0) || 0

  if (!user) return <div className="ai-builder"><div className="loading">Caricamento...</div></div>

  return (
    <div className="ai-builder">
      {/* Header */}
      <div className="abb-header">
        <button onClick={onBack} className="abb-back-btn">← {t.back}</button>
        <div className="abb-header-content">
          <h1>{t.title}</h1>
          <p className="abb-subtitle">{t.subtitle}</p>
        </div>
        <div className="abb-token-badge">🪙 {tokens}</div>
      </div>

      {/* Tab switcher */}
      <div className="aib-tabs">
        <button className={`aib-tab ${mainView === 'optimize' ? 'active' : ''}`} onClick={() => setMainView('optimize')}>{t.tabOptimize}</button>
        <button className={`aib-tab ${mainView === 'chat-build' ? 'active' : ''}`} onClick={() => setMainView('chat-build')}>{t.tabChatBuild}</button>
      </div>

      {error && <div className="abb-error">⚠️ {error}</div>}

      {/* ── CHAT BUILD VIEW ── */}
      {mainView === 'chat-build' && (
        <div className="abb-layout">
          {/* Left: generated deck */}
          <div className="abb-deck-panel">
            <p className="abb-panel-title">⚙️ {t.formatLabel}</p>
            <select className="abb-deck-select" value={chatFormat} onChange={e => setChatFormat(e.target.value)}>
              <option value="">— {t.formatLabel} —</option>
              {['standard','modern','legacy','vintage','commander','pioneer','pauper'].map(f => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>
              ))}
            </select>

            <p className="abb-panel-title">🎨 {t.colorsLabel}</p>
            <input
              className="abb-deck-select"
              type="text" value={chatColors}
              onChange={e => setChatColors(e.target.value.toUpperCase())}
              placeholder="WU, BRG, WUBRG..."
              maxLength={5}
            />

            {collections.length > 0 && (
              <>
                <p className="abb-panel-title">{t.collectionLabel}</p>
                <select className="abb-deck-select" value={chatCollectionId || ''} onChange={e => { setChatCollectionId(e.target.value ? Number(e.target.value) : null); setChatHistory([]) }}>
                  <option value="">{t.collectionNone}</option>
                  {collections.map(c => <option key={c.id} value={c.id}>{c.name} ({c.total_cards} {language === 'it' ? 'carte' : 'cards'})</option>)}
                </select>
                {chatCollectionId && <p className="abb-collection-hint">{t.collectionHint}</p>}
              </>
            )}

            <p className="abb-panel-title">🃏 {t.deckPanel}</p>
            <div className="abb-card-list">
              {!chatDeck && <div style={{ color: 'var(--text-secondary,#94a3b8)', fontSize: '0.82rem', padding: '0.5rem 0' }}>—</div>}
              {chatDeck?.cards?.map((card, i) => (
                <div key={i} className="abb-card-row" onClick={() => setPreviewCard(card.card_name)} title={card.card_name}>
                  <span className="abb-card-qty">{card.quantity}x</span>
                  <span className="abb-card-dot" style={{ background: CATEGORY_COLORS[card.category] || CATEGORY_COLORS.Other }} />
                  <span className="abb-card-name">{card.card_name}</span>
                </div>
              ))}
            </div>
            {chatDeck && <div className="abb-card-total">{chatTotalCards} {t.totalCardsLabel}</div>}

            <button className="abb-reset-btn" onClick={() => { setChatHistory([]); setChatDeck(null) }} style={{ marginTop: '0.5rem' }}>
              {t.resetBtn}
            </button>
          </div>

          {/* Center: chat */}
          <div className="abb-chat-panel">
            <div className="abb-messages">
              {chatHistory.length === 0 && !chatLoading && (
                <div className="abb-empty-chat">
                  <div className="abb-empty-icon">✨</div>
                  <p>{t.emptyChat}</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`abb-msg ${msg.role}`}>
                  <div className="abb-msg-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
                  <div>
                    <div className="abb-msg-bubble">{msg.content}</div>
                    {msg.deck_updated && <span className="abb-msg-modified-badge">{t.deckUpdated}</span>}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="abb-msg assistant">
                  <div className="abb-msg-avatar">🤖</div>
                  <div className="abb-typing"><span /><span /><span /></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="abb-cost-hint">{t.costHint}</div>
            <div className="abb-input-area">
              <textarea value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={handleChatKeyDown}
                placeholder={t.placeholder} rows={2} disabled={chatLoading} />
              <button className="abb-send-btn" onClick={handleChatSend} disabled={chatLoading || !chatMessage.trim()}>
                {chatLoading ? t.sending : t.sendBtn}
              </button>
            </div>
          </div>

          {/* Right: suggestions */}
          <div className="abb-suggestions-panel">
            <p className="abb-panel-title">{t.suggestionsTitle}</p>
            {(CHAT_SUGGESTIONS[language] || CHAT_SUGGESTIONS.it).map((s, i) => (
              <button key={i} className="abb-suggestion-btn" onClick={() => setChatMessage(s.replace(/^[^\s]+ /, ''))} disabled={chatLoading}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── OPTIMIZE VIEW ── */}
      {mainView === 'optimize' && (
        <div className="ai-builder-content">
          {!selectedDeck ? (
            <div className="deck-selection-section">
              <h2>{t.selectDeck}</h2>
              {loading ? <div className="loading">Caricamento...</div>
                : decks.length === 0 ? <div className="no-decks">{t.noDeck}</div>
                : (
                  <div className="ai-deck-grid">
                    {decks.map(deck => (
                      <div key={deck.id} className="ai-deck-card" onClick={() => handleDeckSelect(deck)}>
                        <div className="ai-deck-card-header">
                          <h3>{deck.name}</h3>
                          {deck.colors && (
                            <div className="ai-deck-colors">
                              {deck.colors.split(',').map(c => <span key={c} className={`mana-symbol mana-${c.trim()}`}>{c.trim()}</span>)}
                            </div>
                          )}
                        </div>
                        <div className="ai-deck-card-info">
                          <span>{deck.total_cards} carte</span>
                          {deck.format && <span className="format-badge">{deck.format}</span>}
                          {deck.archetype && <span className="archetype-badge">{deck.archetype}</span>}
                        </div>
                        <div className="completion-bar">
                          <div className="completion-fill" style={{
                            width: `${deck.completion_percentage}%`,
                            backgroundColor: deck.completion_percentage >= 90 ? '#68d391' : deck.completion_percentage >= 70 ? '#fbbf24' : '#f5576c'
                          }} />
                          <span className="completion-text">{deck.completion_percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ) : (
            <div className="ai-workspace">
              <div className="mobile-tab-nav">
                <button className={`tab-btn ${mobileTab === 'analysis' ? 'active' : ''}`} onClick={() => setMobileTab('analysis')}>📊 Analisi Mazzo</button>
                <button className={`tab-btn ${mobileTab === 'chat' ? 'active' : ''}`} onClick={() => setMobileTab('chat')}>🤖 Chat AI</button>
              </div>

              <div className={`deck-details-panel ${mobileTab === 'analysis' ? 'mobile-active' : 'mobile-hidden'}`}>
                <div className="panel-header">
                  <h2>📋 {selectedDeck.name}</h2>
                  <button onClick={() => { setSelectedDeck(null); setDeckStats(null); setSuggestions(null) }} className="close-deck-btn">✕</button>
                </div>
                {deckStats && (
                  <div className="deck-content">
                    <div className="stats-section">
                      <div className="stats-grid">
                        <div className="stat-card"><div className="stat-value">{deckStats.stats.total_cards}</div><div className="stat-label">{t.totalCards}</div></div>
                        <div className="stat-card"><div className="stat-value">{deckStats.stats.unique_cards}</div><div className="stat-label">{t.uniqueCards}</div></div>
                        <div className="stat-card"><div className="stat-value">{deckStats.stats.average_cmc.toFixed(1)}</div><div className="stat-label">{t.avgCMC}</div></div>
                      </div>
                    </div>
                    <div className="charts-section">
                      {Object.keys(deckStats.stats.mana_curve).length > 0 && (
                        <div className="mana-curve-chart">
                          <h3>{t.manaCurve}</h3>
                          <div className="chart-bars">
                            {[0,1,2,3,4,5,6,7].map(cmc => {
                              const count = deckStats.stats.mana_curve[cmc] || 0
                              const maxCount = Math.max(...Object.values(deckStats.stats.mana_curve))
                              const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                              return (
                                <div key={cmc} className="chart-bar-container">
                                  <div className="chart-bar" style={{ height: `${height}%` }} title={`${count} carte`}>
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
                            {Object.entries(deckStats.stats.type_distribution).sort((a,b) => b[1]-a[1]).map(([type, count]) => (
                              <div key={type} className="distribution-item">
                                <span className="dist-label">{type}</span>
                                <div className="dist-bar-container"><div className="dist-bar" style={{ width: `${(count/deckStats.stats.total_cards)*100}%` }} /></div>
                                <span className="dist-count">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="optimization-section">
                      <div className="optimization-controls">
                        <div className="goal-selector">
                          <label>{t.optimizationGoal}</label>
                          <select value={optimizationGoal} onChange={e => setOptimizationGoal(e.target.value)}>
                            <optgroup label="⚖️ Generali">
                              <option value="balanced">{t.balanced}</option><option value="budget">{t.budget}</option>
                              <option value="competitive">{t.competitive}</option><option value="casual">{t.casual}</option><option value="thematic">{t.thematic}</option>
                            </optgroup>
                            <optgroup label="⚔️ Archetipi">
                              <option value="aggressive">{t.aggressive}</option><option value="defensive">{t.defensive}</option>
                              <option value="midrange">{t.midrange}</option><option value="combo">{t.combo}</option>
                              <option value="tempo">{t.tempo}</option><option value="ramp">{t.ramp}</option><option value="voltron">{t.voltron}</option>
                            </optgroup>
                            <optgroup label="🎯 Strategie">
                              <option value="tribal">{t.tribal}</option><option value="tokens">{t.tokens}</option>
                              <option value="graveyard">{t.graveyard}</option><option value="artifacts">{t.artifacts}</option>
                              <option value="enchantments">{t.enchantments}</option><option value="spellslinger">{t.spellslinger}</option>
                              <option value="landfall">{t.landfall}</option><option value="lifegain">{t.lifegain}</option>
                            </optgroup>
                          </select>
                        </div>
                        <button className="analyze-button" onClick={() => { handleOptimize(); setMobileTab('chat') }} disabled={analyzing}>
                          {analyzing ? t.analyzing : t.analyzeButton}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`ai-chat-panel ${mobileTab === 'chat' ? 'mobile-active' : 'mobile-hidden'}`}>
                <div className="panel-header"><h2>🤖 AI Assistant</h2></div>
                <div className="chat-content">
                  {analyzing ? (
                    <div className="chat-loading"><div className="spinner"></div><p>🤖 Analisi in corso con AI...</p></div>
                  ) : !suggestions ? (
                    <div className="chat-empty"><p>Seleziona un obiettivo e clicca "Analizza" per ricevere suggerimenti AI.</p></div>
                  ) : (
                    <div className="suggestions-content">
                      {suggestions.suggestions.overall_assessment && <div className="suggestion-card"><h3>{t.overallAssessment}</h3><p>{suggestions.suggestions.overall_assessment}</p></div>}
                      {suggestions.suggestions.mana_curve_analysis && <div className="suggestion-card"><h3>{t.manaCurveAnalysis}</h3><p>{suggestions.suggestions.mana_curve_analysis}</p></div>}
                      {suggestions.suggestions.synergy_evaluation && <div className="suggestion-card"><h3>{t.synergyEvaluation}</h3><p>{suggestions.suggestions.synergy_evaluation}</p></div>}
                      {suggestions.suggestions.card_suggestions?.length > 0 && (
                        <div className="suggestion-card">
                          <h3>{t.cardSuggestions}</h3>
                          <div className="card-suggestions-list">
                            {suggestions.suggestions.card_suggestions.map((s, idx) => (
                              <div key={idx} className="card-suggestion-item">
                                <div className="suggestion-header">
                                  <span className="action-icon">{getActionIcon(s.action)}</span>
                                  <span className="card-name">{s.card_name}</span>
                                  {s.replace_with && <span className="replace-arrow">→ {s.replace_with}</span>}
                                  {s.estimated_price && <span className="price-badge">{s.estimated_price}</span>}
                                  <span className="priority-badge" style={{ backgroundColor: getPriorityColor(s.priority) }}>{s.priority}</span>
                                </div>
                                <p className="suggestion-reason">{s.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {suggestions.suggestions.combos?.length > 0 && (
                        <div className="suggestion-card combos-section">
                          <h3>🔗 Combo del Mazzo</h3>
                          <div className="combos-list">
                            {suggestions.suggestions.combos.map((combo, idx) => (
                              <div key={idx} className="combo-item">
                                <div className="combo-header">
                                  <div className="combo-cards">
                                    {combo.cards.map((card, ci) => (
                                      <span key={ci} className="combo-card-name">{card}{ci < combo.cards.length-1 && <span className="combo-separator"> + </span>}</span>
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
                      {suggestions.suggestions.strategic_recommendations?.length > 0 && (
                        <div className="suggestion-card">
                          <h3>{t.strategicRecommendations}</h3>
                          <ul className="recommendations-list">
                            {suggestions.suggestions.strategic_recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
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
      )}

      {previewCard && <CardPreviewModal cardName={previewCard} language={language} onClose={() => setPreviewCard(null)} />}
    </div>
  )
}

export default AIBuilder
