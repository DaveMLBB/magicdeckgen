import { useState, useRef } from 'react'
import './CardTwins.css'
import CardPreviewModal from './CardPreviewModal'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const FORMATS = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper', 'historic', 'explorer']
const BUDGETS = [
  { value: 'budget', label: { it: 'Solo economiche (<$2)', en: 'Budget only (<$2)' } },
  { value: 'affordable', label: { it: 'Accessibili (<$10)', en: 'Affordable (<$10)' } },
  { value: 'any', label: { it: 'Qualsiasi prezzo', en: 'Any price' } },
  { value: 'expensive', label: { it: 'Anche costose', en: 'Including expensive' } },
]

const RELATIONSHIP_CONFIG = {
  strictly_better:  { color: '#10b981', icon: '⬆️', label: { it: 'Superiore',       en: 'Strictly Better'  } },
  strictly_worse:   { color: '#f59e0b', icon: '⬇️', label: { it: 'Inferiore',       en: 'Strictly Worse'   } },
  lateral:          { color: '#6366f1', icon: '↔️', label: { it: 'Laterale',        en: 'Lateral'          } },
  functional_copy:  { color: '#ec4899', icon: '🪞', label: { it: 'Copia Funzionale', en: 'Functional Copy'  } },
}

const translations = {
  it: {
    title: '🪞 AI Gemelli',
    subtitle: 'Trova carte che fanno esattamente la stessa cosa con nomi diversi',
    seedLabel: 'Carte di partenza',
    seedPlaceholder: 'Nome carta (in inglese)...',
    addCard: '+ Aggiungi carta',
    format: 'Formato',
    formatAny: 'Qualsiasi formato',
    budget: 'Budget',
    searchBtn: 'Trova Gemelli (3 🪙)',
    searching: 'Analisi in corso...',
    noResults: 'Inserisci almeno una carta e clicca "Trova Gemelli"',
    errorTokens: 'Token insufficienti. Acquista token per continuare.',
    errorGeneric: 'Errore durante l\'analisi AI. Riprova.',
    errorRateLimit: '⏱️ Limite raggiunto: max 3 richieste AI al minuto. Attendi qualche secondo e riprova.',
    maxCards: 'Massimo 5 carte',
    remove: 'Rimuovi',
    back: 'Indietro',
    notes: 'Note AI',
    sourceSummary: 'Cosa fa questa carta',
    similarity: 'Somiglianza',
    differences: 'Differenze',
    whySimilar: 'Perché è equivalente',
    price: 'Prezzo',
    formats: 'Formati',
    twins: 'Gemelli trovati',
    copyList: '📋 Copia Lista',
    copied: '✅ Copiato!',
    filterAll: 'Tutti',
    filterBetter: 'Solo superiori',
    filterWorse: 'Solo inferiori',
    filterLateral: 'Solo laterali',
    filterCopy: 'Solo copie',
    sortBySimilarity: 'Per somiglianza',
    sortByRelationship: 'Per tipo',
    sortByPrice: 'Per prezzo',
    analyzed: 'Carte analizzate',
    example: 'Esempi:',
  },
  en: {
    title: '🪞 AI Twins',
    subtitle: 'Find cards that do exactly the same thing with different names',
    seedLabel: 'Source Cards',
    seedPlaceholder: 'Card name (in English)...',
    addCard: '+ Add card',
    format: 'Format',
    formatAny: 'Any format',
    budget: 'Budget',
    searchBtn: 'Find Twins (3 🪙)',
    searching: 'Analyzing...',
    noResults: 'Enter at least one card and click "Find Twins"',
    errorTokens: 'Insufficient tokens. Purchase tokens to continue.',
    errorGeneric: 'Error during AI analysis. Please try again.',
    errorRateLimit: '⏱️ Rate limit: max 3 AI requests per minute. Wait a few seconds and try again.',
    maxCards: 'Maximum 5 cards',
    remove: 'Remove',
    back: 'Back',
    notes: 'AI Notes',
    sourceSummary: 'What this card does',
    similarity: 'Similarity',
    differences: 'Differences',
    whySimilar: 'Why it\'s equivalent',
    price: 'Price',
    formats: 'Formats',
    twins: 'Twins found',
    copyList: '📋 Copy List',
    copied: '✅ Copied!',
    filterAll: 'All',
    filterBetter: 'Strictly better',
    filterWorse: 'Strictly worse',
    filterLateral: 'Lateral',
    filterCopy: 'Functional copies',
    sortBySimilarity: 'By similarity',
    sortByRelationship: 'By type',
    sortByPrice: 'By price',
    analyzed: 'Analyzed cards',
    example: 'Examples:',
  }
}

function SimilarityBar({ score }) {
  const color = score >= 90 ? '#10b981' : score >= 70 ? '#6366f1' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="ct-sim-bar-wrap">
      <div className="ct-sim-bar">
        <div className="ct-sim-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="ct-sim-label" style={{ color }}>{score}%</span>
    </div>
  )
}

function CardTwins({ user, onBack, language }) {
  const t = translations[language] || translations.en

  const [seedCards, setSeedCards] = useState([''])
  const [format, setFormat] = useState('')
  const [budget, setBudget] = useState('any')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [tokens, setTokens] = useState(user?.tokens || 0)

  useEffect(() => {
    if (user?.tokens != null) setTokens(user.tokens)
  }, [user?.tokens])
  const [sortMode, setSortMode] = useState('similarity')
  const [copied, setCopied] = useState(false)
  const [previewCard, setPreviewCard] = useState(null)
  const suggestionsRef = useRef({ list: [], idx: null })
  const [suggestTick, setSuggestTick] = useState(0)
  const debounceRef = useRef(null)

  const cardSuggestions = suggestionsRef.current.list
  const activeSuggestionIdx = suggestionsRef.current.idx

  const setSuggestions = (list, idx) => {
    suggestionsRef.current = { list, idx }
    setSuggestTick(t => t + 1)
  }

  const fetchCardSuggestions = async (query, idx) => {
    if (!query || query.length < 2) { setSuggestions([], null); return }
    try {
      const res = await fetch(`${API_URL}/api/mtg-cards/search?query=${encodeURIComponent(query)}&page_size=8&language=${language}`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.cards?.map(c => c.name) || [], idx)
      }
    } catch { setSuggestions([], null) }
  }

  const handleCardInput = (idx, value) => {
    const updated = [...seedCards]; updated[idx] = value
    suggestionsRef.current = { list: [], idx: null }
    setSeedCards(updated)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchCardSuggestions(value, idx), 300)
  }

  const selectSuggestion = (idx, name) => {
    const updated = [...seedCards]; updated[idx] = name
    suggestionsRef.current = { list: [], idx: null }
    setSeedCards(updated)
  }

  const addCard = () => { if (seedCards.length < 5) setSeedCards([...seedCards, '']) }
  const removeCard = (idx) => { const u = seedCards.filter((_, i) => i !== idx); setSeedCards(u.length === 0 ? [''] : u) }

  const handleSearch = async () => {
    const valid = seedCards.map(c => c.trim()).filter(Boolean)
    if (valid.length === 0) { setError(language === 'it' ? 'Inserisci almeno una carta' : 'Enter at least one card'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(`${API_URL}/api/ai/find-twins?language=${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.userId, card_names: valid, format: format || null, budget: budget || null })
      })
      const data = await res.json()
      if (!res.ok) { setError(res.status === 429 ? t.errorRateLimit : res.status === 403 ? t.errorTokens : (data.detail || t.errorGeneric)); setLoading(false); return }
      setResult(data)
      setTokens(data.tokens_remaining)
      if (user) user.tokens = data.tokens_remaining
    } catch { setError(t.errorGeneric) }
    setLoading(false)
  }

  const getFilteredTwins = (twins) => {
    if (!twins) return []
    let list = filterRel === 'all' ? twins : twins.filter(tw => tw.relationship === filterRel)
    if (sortMode === 'similarity') list = [...list].sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
    else if (sortMode === 'relationship') {
      const order = { functional_copy: 0, strictly_better: 1, lateral: 2, strictly_worse: 3 }
      list = [...list].sort((a, b) => (order[a.relationship] ?? 9) - (order[b.relationship] ?? 9))
    }
    return list
  }

  const copyAllList = () => {
    if (!result?.result?.cards) return
    const lines = result.result.cards.flatMap(c => c.twins?.map(tw => `1x ${tw.card_name}`) || [])
    navigator.clipboard.writeText([...new Set(lines)].join('\n')).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const relConfig = (rel) => RELATIONSHIP_CONFIG[rel] || { color: '#6b7280', icon: '?', label: { it: rel, en: rel } }

  return (
    <div className="card-twins">
      <div className="ct-header">
        <button onClick={onBack} className="ct-back-btn">← {t.back}</button>
        <div className="ct-header-content">
          <h1>{t.title}</h1>
          <p className="ct-subtitle">{t.subtitle}</p>
        </div>
        <div className="ct-token-badge">🪙 {tokens}</div>
      </div>

      {error && <div className="ct-error">⚠️ {error}</div>}

      <div className="ct-layout">
        {/* LEFT — Input */}
        <div className="ct-input-panel">
          <div className="ct-section">
            <h2 className="ct-section-title">🃏 {t.seedLabel}</h2>
            <div className="ct-seed-cards">
              {seedCards.map((card, idx) => (
                <div key={idx} className="ct-card-input-wrapper">
                  <div className="ct-card-input-row">
                    <span className="ct-card-num">{idx + 1}</span>
                    <input
                      className="ct-card-input"
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
                      <button className="ct-remove-btn" onClick={() => removeCard(idx)} title={t.remove}>✕</button>
                    )}
                  </div>
                  {activeSuggestionIdx === idx && cardSuggestions.length > 0 && (
                    <div className="ct-suggestions-dropdown">
                      {cardSuggestions.map((name, si) => (
                        <button key={si} className="ct-suggestion-item" onMouseDown={() => selectSuggestion(idx, name)}>{name}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {seedCards.length < 5
                ? <button className="ct-add-btn" onClick={addCard}>{t.addCard}</button>
                : <p className="ct-max-note">⚠️ {t.maxCards}</p>
              }
            </div>
          </div>

          <div className="ct-section">
            <h2 className="ct-section-title">⚙️ {language === 'it' ? 'Opzioni' : 'Options'}</h2>
            <div className="ct-options">
              <div className="ct-option-group">
                <label className="ct-label">{t.format}</label>
                <select className="ct-select" value={format} onChange={e => setFormat(e.target.value)}>
                  <option value="">{t.formatAny}</option>
                  {FORMATS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                </select>
              </div>
              <div className="ct-option-group">
                <label className="ct-label">{t.budget}</label>
                <select className="ct-select" value={budget} onChange={e => setBudget(e.target.value)}>
                  {BUDGETS.map(b => <option key={b.value} value={b.value}>{b.label[language] || b.label.en}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button
            className="ct-search-btn"
            onClick={handleSearch}
            disabled={loading || seedCards.every(c => !c.trim())}
          >
            {loading
              ? <span className="ct-btn-loading"><span className="ct-spinner"></span>{t.searching}</span>
              : t.searchBtn
            }
          </button>

          {result && (
            <div className="ct-seed-recap">
              <h3>{t.analyzed}</h3>
              <div className="ct-seed-tags">
                {result.source_cards.map((name, i) => <span key={i} className="ct-seed-tag">🃏 {name}</span>)}
              </div>
              {result.format && <span className="ct-meta-tag">📋 {result.format}</span>}
            </div>
          )}

          {/* Legend */}
          <div className="ct-legend">
            {Object.entries(RELATIONSHIP_CONFIG).map(([key, cfg]) => (
              <div key={key} className="ct-legend-item">
                <span className="ct-legend-dot" style={{ background: cfg.color }}></span>
                <span className="ct-legend-icon">{cfg.icon}</span>
                <span className="ct-legend-label">{cfg.label[language] || cfg.label.en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Results */}
        <div className="ct-results-panel">
          {loading && (
            <div className="ct-loading-state">
              <div className="ct-loading-spinner"></div>
              <p>🪞 {language === 'it' ? 'L\'AI sta cercando i gemelli funzionali...' : 'AI is searching for functional twins...'}</p>
              <p className="ct-loading-sub">{language === 'it' ? 'Questo può richiedere 10-20 secondi' : 'This may take 10-20 seconds'}</p>
            </div>
          )}

          {!loading && !result && (
            <div className="ct-empty-state">
              <div className="ct-empty-icon">🪞</div>
              <p>{t.noResults}</p>
              <p className="ct-example-title">{t.example}</p>
              <div className="ct-example-cards">
                {['Lightning Bolt', 'Counterspell', 'Sol Ring', 'Swords to Plowshares', 'Dark Ritual'].map(name => (
                  <button key={name} className="ct-example-btn" onClick={() => {
                    const empty = seedCards.findIndex(c => !c.trim())
                    if (empty !== -1) { const u = [...seedCards]; u[empty] = name; setSeedCards(u) }
                    else if (seedCards.length < 5) setSeedCards([...seedCards, name])
                  }}>{name}</button>
                ))}
              </div>
            </div>
          )}

          {!loading && result?.result?.cards && (
            <div className="ct-result-content">
              {/* Controls */}
              <div className="ct-controls-bar">
                <div className="ct-filter-group">
                  {[
                    ['all', t.filterAll],
                    ['functional_copy', `🪞 ${language === 'it' ? 'Copie' : 'Copies'}`],
                    ['strictly_better', `⬆️ ${language === 'it' ? 'Superiori' : 'Better'}`],
                    ['lateral', `↔️ ${language === 'it' ? 'Laterali' : 'Lateral'}`],
                    ['strictly_worse', `⬇️ ${language === 'it' ? 'Inferiori' : 'Worse'}`],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      className={`ct-filter-btn ${filterRel === val ? 'active' : ''}`}
                      onClick={() => setFilterRel(val)}
                    >{label}</button>
                  ))}
                </div>
                <div className="ct-sort-copy">
                  <select className="ct-mini-select" value={sortMode} onChange={e => setSortMode(e.target.value)}>
                    <option value="similarity">{t.sortBySimilarity}</option>
                    <option value="relationship">{t.sortByRelationship}</option>
                  </select>
                  <button className="ct-copy-btn" onClick={copyAllList}>{copied ? t.copied : t.copyList}</button>
                </div>
              </div>

              {/* Cards */}
              {result.result.cards.map((cardResult, ci) => (
                <div key={ci} className="ct-source-block">
                  <div className="ct-source-header">
                    <span className="ct-source-name">
                      <button className="ct-card-link ct-card-link-btn" onClick={() => setPreviewCard(cardResult.source_card)}>
                        {cardResult.source_card}
                      </button>
                    </span>
                    <span className="ct-twins-count">{getFilteredTwins(cardResult.twins).length} {t.twins}</span>
                  </div>
                  {cardResult.source_summary && (
                    <p className="ct-source-summary">💡 {cardResult.source_summary}</p>
                  )}

                  <div className="ct-twins-grid">
                    {getFilteredTwins(cardResult.twins).map((twin, ti) => {
                      const cfg = relConfig(twin.relationship)
                      return (
                        <div key={ti} className="ct-twin-card" style={{ borderLeftColor: cfg.color }}>
                          <div className="ct-twin-header">
                            <span className="ct-rel-badge" style={{ background: cfg.color }}>
                              {cfg.icon} {cfg.label[language] || cfg.label.en}
                            </span>
                            <span className="ct-twin-name">
                              <button className="ct-card-link ct-card-link-btn" onClick={() => setPreviewCard(twin.card_name)}>
                                {twin.card_name}
                              </button>
                            </span>
                          </div>

                          {twin.similarity_score != null && (
                            <SimilarityBar score={twin.similarity_score} />
                          )}

                          {twin.why_similar && (
                            <p className="ct-twin-why">✅ {twin.why_similar}</p>
                          )}
                          {twin.key_differences && (
                            <p className="ct-twin-diff">⚡ {twin.key_differences}</p>
                          )}

                          <div className="ct-twin-meta">
                            {twin.estimated_price && (
                              <span className="ct-price-tag">💰 {twin.estimated_price}</span>
                            )}
                            {twin.formats && twin.formats.length > 0 && (
                              <span className="ct-formats-tag">📋 {twin.formats.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* AI Notes */}
              {result.result.notes && (
                <div className="ct-notes-card">
                  <h3>🤖 {t.notes}</h3>
                  <p>{result.result.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {previewCard && (
        <CardPreviewModal
          cardName={previewCard}
          language={language}
          onClose={() => setPreviewCard(null)}
        />
      )}
    </div>
  )
}

export default CardTwins
