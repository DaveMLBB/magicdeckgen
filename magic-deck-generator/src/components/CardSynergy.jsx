import { useState, useRef, useEffect } from 'react'
import './CardSynergy.css'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const FORMATS = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper', 'historic', 'explorer']
const STRATEGIES = ['aggro', 'control', 'combo', 'midrange', 'tempo', 'ramp', 'tribal', 'tokens', 'graveyard', 'artifacts', 'enchantments', 'spellslinger', 'landfall', 'lifegain', 'voltron']

const ROLE_COLORS = {
  Enabler: '#6366f1',
  Payoff: '#f59e0b',
  Support: '#10b981',
  Removal: '#ef4444',
  Land: '#84cc16',
  Ramp: '#22d3ee',
  Protection: '#8b5cf6',
  Draw: '#3b82f6',
}

const POWER_COLORS = {
  'value': '#10b981',
  'strong': '#f59e0b',
  'game-winning': '#ef4444',
}

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
}

const translations = {
  it: {
    title: '✨ AI Synergy Finder',
    subtitle: 'Inserisci fino a 5 carte e l\'AI troverà le carte più sinergiche e compatibili',
    seedLabel: 'Carte di partenza',
    seedPlaceholder: 'Nome carta (in inglese)...',
    addCard: '+ Aggiungi carta',
    format: 'Formato',
    formatAny: 'Qualsiasi formato',
    strategy: 'Strategia',
    strategyAny: 'Suggerisci tu',
    searchBtn: 'Trova Sinergie (10 🪙)',
    searching: 'Analisi in corso...',
    tokens: 'token',
    overview: 'Panoramica Strategica',
    themes: 'Temi Identificati',
    suggestedCards: 'Carte Suggerite',
    synergyChains: 'Catene di Sinergia',
    avoid: 'Carte da Evitare',
    avoidReason: 'Motivazione',
    role: 'Ruolo',
    priority: 'Priorità',
    price: 'Prezzo',
    why: 'Perché funziona',
    powerLevel: 'Potenza',
    noResults: 'Inserisci almeno una carta e clicca "Trova Sinergie"',
    errorTokens: 'Token insufficienti. Acquista token per continuare.',
    errorGeneric: 'Errore durante l\'analisi AI. Riprova.',
    cardNotFound: '⚠️ Carta non trovata nel database, ma l\'AI la analizzerà comunque',
    maxCards: 'Massimo 5 carte',
    remove: 'Rimuovi',
    back: 'Indietro',
    filterHigh: 'Solo Alta Priorità',
    filterAll: 'Tutte le carte',
    sortByPriority: 'Ordina per priorità',
    sortByRole: 'Ordina per ruolo',
    copyList: '📋 Copia Lista',
    copied: '✅ Copiato!',
    searchCard: 'Cerca carta...',
    suggestions: 'Suggerimenti',
  },
  en: {
    title: '✨ AI Synergy Finder',
    subtitle: 'Enter up to 5 cards and the AI will find the most synergistic and compatible cards',
    seedLabel: 'Seed Cards',
    seedPlaceholder: 'Card name (in English)...',
    addCard: '+ Add card',
    format: 'Format',
    formatAny: 'Any format',
    strategy: 'Strategy',
    strategyAny: 'AI decides',
    searchBtn: 'Find Synergies (10 🪙)',
    searching: 'Analyzing...',
    tokens: 'tokens',
    overview: 'Strategic Overview',
    themes: 'Identified Themes',
    suggestedCards: 'Suggested Cards',
    synergyChains: 'Synergy Chains',
    avoid: 'Cards to Avoid',
    avoidReason: 'Reason',
    role: 'Role',
    priority: 'Priority',
    price: 'Price',
    why: 'Why it works',
    powerLevel: 'Power',
    noResults: 'Enter at least one card and click "Find Synergies"',
    errorTokens: 'Insufficient tokens. Purchase tokens to continue.',
    errorGeneric: 'Error during AI analysis. Please try again.',
    cardNotFound: '⚠️ Card not found in database, but AI will analyze it anyway',
    maxCards: 'Maximum 5 cards',
    remove: 'Remove',
    back: 'Back',
    filterHigh: 'High Priority Only',
    filterAll: 'All cards',
    sortByPriority: 'Sort by priority',
    sortByRole: 'Sort by role',
    copyList: '📋 Copy List',
    copied: '✅ Copied!',
    searchCard: 'Search card...',
    suggestions: 'Suggestions',
  }
}

function CardSynergy({ user, onBack, language, onCardSearch }) {
  const t = translations[language] || translations.en

  const [seedCards, setSeedCards] = useState([''])
  const [format, setFormat] = useState('')
  const [strategy, setStrategy] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [tokens, setTokens] = useState(user?.tokens || 0)
  const [filterPriority, setFilterPriority] = useState('all')
  const [sortMode, setSortMode] = useState('priority')
  const [copied, setCopied] = useState(false)
  const [cardSuggestions, setCardSuggestions] = useState([])
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(null)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (user?.tokens !== undefined) setTokens(user.tokens)
  }, [user])

  const fetchCardSuggestions = async (query, idx) => {
    if (!query || query.length < 2) {
      setCardSuggestions([])
      setActiveSuggestionIdx(null)
      return
    }
    setSuggestionLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/mtg-cards/search?query=${encodeURIComponent(query)}&page_size=8&language=${language}`)
      if (res.ok) {
        const data = await res.json()
        setCardSuggestions(data.cards?.map(c => c.name) || [])
        setActiveSuggestionIdx(idx)
      }
    } catch {
      setCardSuggestions([])
    }
    setSuggestionLoading(false)
  }

  const handleCardInput = (idx, value) => {
    const updated = [...seedCards]
    updated[idx] = value
    setSeedCards(updated)
    setCardSuggestions([])
    setActiveSuggestionIdx(null)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchCardSuggestions(value, idx), 300)
  }

  const selectSuggestion = (idx, name) => {
    const updated = [...seedCards]
    updated[idx] = name
    setSeedCards(updated)
    setCardSuggestions([])
    setActiveSuggestionIdx(null)
  }

  const addCard = () => {
    if (seedCards.length < 5) setSeedCards([...seedCards, ''])
  }

  const removeCard = (idx) => {
    const updated = seedCards.filter((_, i) => i !== idx)
    setSeedCards(updated.length === 0 ? [''] : updated)
  }

  const handleSearch = async () => {
    const validCards = seedCards.map(c => c.trim()).filter(Boolean)
    if (validCards.length === 0) {
      setError(language === 'it' ? 'Inserisci almeno una carta' : 'Enter at least one card')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API_URL}/api/ai/find-synergies?language=${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          card_names: validCards,
          format: format || null,
          strategy: strategy || null,
        })
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403) {
          setError(t.errorTokens)
        } else {
          setError(data.detail || t.errorGeneric)
        }
        setLoading(false)
        return
      }
      setResult(data)
      setTokens(data.tokens_remaining)
      if (user) user.tokens = data.tokens_remaining
    } catch {
      setError(t.errorGeneric)
    }
    setLoading(false)
  }

  const getSortedCards = (cards) => {
    if (!cards) return []
    let filtered = filterPriority === 'high' ? cards.filter(c => c.priority === 'high') : cards
    if (sortMode === 'priority') {
      const order = { high: 0, medium: 1, low: 2 }
      filtered = [...filtered].sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3))
    } else {
      filtered = [...filtered].sort((a, b) => (a.role || '').localeCompare(b.role || ''))
    }
    return filtered
  }

  const copyCardList = () => {
    if (!result?.result?.suggested_cards) return
    const list = result.result.suggested_cards.map(c => `1x ${c.card_name}`).join('\n')
    navigator.clipboard.writeText(list).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="card-synergy">
      <div className="cs-header">
        <button onClick={onBack} className="cs-back-btn">← {t.back}</button>
        <div className="cs-header-content">
          <h1>{t.title}</h1>
          <p className="cs-subtitle">{t.subtitle}</p>
        </div>
        <div className="cs-token-badge">🪙 {tokens}</div>
      </div>

      {error && (
        <div className="cs-error">⚠️ {error}</div>
      )}

      <div className="cs-layout">
        {/* LEFT PANEL - Input */}
        <div className="cs-input-panel">
          <div className="cs-section">
            <h2 className="cs-section-title">🃏 {t.seedLabel}</h2>
            <div className="cs-seed-cards">
              {seedCards.map((card, idx) => (
                <div key={idx} className="cs-card-input-wrapper">
                  <div className="cs-card-input-row">
                    <span className="cs-card-num">{idx + 1}</span>
                    <input
                      className="cs-card-input"
                      type="text"
                      value={card}
                      placeholder={t.seedPlaceholder}
                      onChange={e => handleCardInput(idx, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && idx === seedCards.length - 1 && seedCards.length < 5) addCard()
                        if (e.key === 'Escape') { setCardSuggestions([]); setActiveSuggestionIdx(null) }
                      }}
                      autoComplete="off"
                    />
                    {seedCards.length > 1 && (
                      <button className="cs-remove-btn" onClick={() => removeCard(idx)} title={t.remove}>✕</button>
                    )}
                  </div>
                  {activeSuggestionIdx === idx && cardSuggestions.length > 0 && (
                    <div className="cs-suggestions-dropdown">
                      {cardSuggestions.map((name, si) => (
                        <button
                          key={si}
                          className="cs-suggestion-item"
                          onMouseDown={() => selectSuggestion(idx, name)}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {seedCards.length < 5 && (
                <button className="cs-add-btn" onClick={addCard}>
                  {t.addCard}
                </button>
              )}
              {seedCards.length >= 5 && (
                <p className="cs-max-note">⚠️ {t.maxCards}</p>
              )}
            </div>
          </div>

          <div className="cs-section">
            <h2 className="cs-section-title">⚙️ {language === 'it' ? 'Opzioni' : 'Options'}</h2>
            <div className="cs-options">
              <div className="cs-option-group">
                <label className="cs-label">{t.format}</label>
                <select className="cs-select" value={format} onChange={e => setFormat(e.target.value)}>
                  <option value="">{t.formatAny}</option>
                  {FORMATS.map(f => (
                    <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="cs-option-group">
                <label className="cs-label">{t.strategy}</label>
                <select className="cs-select" value={strategy} onChange={e => setStrategy(e.target.value)}>
                  <option value="">{t.strategyAny}</option>
                  {STRATEGIES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            className="cs-search-btn"
            onClick={handleSearch}
            disabled={loading || seedCards.every(c => !c.trim())}
          >
            {loading ? (
              <span className="cs-btn-loading">
                <span className="cs-spinner"></span>
                {t.searching}
              </span>
            ) : t.searchBtn}
          </button>

          {/* Seed cards recap after result */}
          {result && (
            <div className="cs-seed-recap">
              <h3>{language === 'it' ? 'Carte analizzate' : 'Analyzed cards'}</h3>
              <div className="cs-seed-tags">
                {result.seed_cards.map((name, i) => (
                  <span key={i} className="cs-seed-tag">🃏 {name}</span>
                ))}
              </div>
              {result.format && <span className="cs-meta-tag">📋 {result.format}</span>}
              {result.strategy && <span className="cs-meta-tag">⚔️ {result.strategy}</span>}
            </div>
          )}
        </div>

        {/* RIGHT PANEL - Results */}
        <div className="cs-results-panel">
          {loading && (
            <div className="cs-loading-state">
              <div className="cs-loading-spinner"></div>
              <p>🤖 {language === 'it' ? 'L\'AI sta analizzando le sinergie...' : 'AI is analyzing synergies...'}</p>
              <p className="cs-loading-sub">{language === 'it' ? 'Questo può richiedere 10-20 secondi' : 'This may take 10-20 seconds'}</p>
            </div>
          )}

          {!loading && !result && (
            <div className="cs-empty-state">
              <div className="cs-empty-icon">✨</div>
              <p>{t.noResults}</p>
              <div className="cs-example-cards">
                <p className="cs-example-title">{language === 'it' ? 'Esempi di carte:' : 'Example cards:'}</p>
                {['Lightning Bolt', 'Snapcaster Mage', 'Tarmogoyf', 'Sol Ring', 'Counterspell'].map(name => (
                  <button
                    key={name}
                    className="cs-example-btn"
                    onClick={() => {
                      const empty = seedCards.findIndex(c => !c.trim())
                      if (empty !== -1) {
                        const updated = [...seedCards]
                        updated[empty] = name
                        setSeedCards(updated)
                      } else if (seedCards.length < 5) {
                        setSeedCards([...seedCards, name])
                      }
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && result && result.result && (
            <div className="cs-result-content">
              {/* Strategic Overview */}
              {result.result.strategic_overview && (
                <div className="cs-result-card cs-overview">
                  <h3>🎯 {t.overview}</h3>
                  <p>{result.result.strategic_overview}</p>
                  {result.result.themes_identified && result.result.themes_identified.length > 0 && (
                    <div className="cs-themes">
                      <span className="cs-themes-label">{t.themes}:</span>
                      {result.result.themes_identified.map((theme, i) => (
                        <span key={i} className="cs-theme-tag">{theme}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Suggested Cards */}
              {result.result.suggested_cards && result.result.suggested_cards.length > 0 && (
                <div className="cs-result-card">
                  <div className="cs-cards-header">
                    <h3>🃏 {t.suggestedCards} ({result.result.suggested_cards.length})</h3>
                    <div className="cs-cards-controls">
                      <select
                        className="cs-mini-select"
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
                      >
                        <option value="all">{t.filterAll}</option>
                        <option value="high">{t.filterHigh}</option>
                      </select>
                      <select
                        className="cs-mini-select"
                        value={sortMode}
                        onChange={e => setSortMode(e.target.value)}
                      >
                        <option value="priority">{t.sortByPriority}</option>
                        <option value="role">{t.sortByRole}</option>
                      </select>
                      <button className="cs-copy-btn" onClick={copyCardList}>
                        {copied ? t.copied : t.copyList}
                      </button>
                    </div>
                  </div>

                  <div className="cs-cards-grid">
                    {getSortedCards(result.result.suggested_cards).map((card, i) => (
                      <div key={i} className="cs-card-item">
                        <div className="cs-card-item-header">
                          <span
                            className="cs-role-badge"
                            style={{ background: ROLE_COLORS[card.role] || '#6b7280' }}
                          >
                            {card.role}
                          </span>
                          <span className="cs-card-name">
                            {onCardSearch ? (
                              <button className="cs-card-link cs-card-link-btn" onClick={() => onCardSearch(card.card_name)}>
                                {card.card_name}
                              </button>
                            ) : (
                              <span>{card.card_name}</span>
                            )}
                          </span>
                          <span
                            className="cs-priority-dot"
                            style={{ background: PRIORITY_COLORS[card.priority] || '#6b7280' }}
                            title={`${t.priority}: ${card.priority}`}
                          ></span>
                        </div>
                        <p className="cs-synergy-reason">{card.synergy_reason}</p>
                        {card.estimated_price && (
                          <span className="cs-price-tag">💰 {card.estimated_price}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Synergy Chains */}
              {result.result.synergy_chains && result.result.synergy_chains.length > 0 && (
                <div className="cs-result-card cs-chains">
                  <h3>🔗 {t.synergyChains}</h3>
                  <div className="cs-chains-list">
                    {result.result.synergy_chains.map((chain, i) => (
                      <div key={i} className="cs-chain-item">
                        <div className="cs-chain-header">
                          <div className="cs-chain-cards">
                            {chain.cards.map((c, ci) => (
                              <span key={ci} className="cs-chain-card">
                                {c}
                                {ci < chain.cards.length - 1 && <span className="cs-chain-sep"> ➜ </span>}
                              </span>
                            ))}
                          </div>
                          <span
                            className="cs-power-badge"
                            style={{ background: POWER_COLORS[chain.power_level] || '#6b7280' }}
                          >
                            {chain.power_level}
                          </span>
                        </div>
                        <p className="cs-chain-desc">{chain.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cards to Avoid */}
              {result.result.cards_to_avoid && result.result.cards_to_avoid.length > 0 && (
                <div className="cs-result-card cs-avoid">
                  <h3>🚫 {t.avoid}</h3>
                  <div className="cs-avoid-tags">
                    {result.result.cards_to_avoid.map((c, i) => (
                      <span key={i} className="cs-avoid-tag">{c}</span>
                    ))}
                  </div>
                  {result.result.avoid_reason && (
                    <p className="cs-avoid-reason">💡 {result.result.avoid_reason}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CardSynergy
