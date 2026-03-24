import { useState, useRef } from 'react'
import CardPreviewModal from '../../components/CardPreviewModal'
import { getTrialHeaders, isTrialLimitError } from '../../utils/anonymousTrial'
import '../../components/CardSynergy.css'

const API_URL = import.meta.env.PROD
  ? 'https://api.mtgdecksbuilder.com'
  : 'http://localhost:8000'

const FORMATS = ['standard','pioneer','modern','legacy','vintage','commander','pauper']
const STRATEGIES = ['aggro','control','combo','midrange','tempo','ramp','tribal','tokens','graveyard']

const ROLE_COLORS = { Enabler:'#6366f1', Payoff:'#f59e0b', Support:'#10b981', Removal:'#ef4444', Land:'#84cc16', Ramp:'#22d3ee', Protection:'#8b5cf6', Draw:'#3b82f6' }
const PRIORITY_COLORS = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' }

const tr = {
  it: {
    title:'✨ AI Synergy Finder', subtitle:'Inserisci fino a 5 carte e l\'AI troverà le carte più sinergiche',
    seedLabel:'Carte di partenza', seedPlaceholder:'Nome carta (in inglese)...',
    addCard:'+ Aggiungi carta', format:'Formato', formatAny:'Qualsiasi formato',
    strategy:'Strategia', strategyAny:'Suggerisci tu',
    searchBtn:'Trova Sinergie', searching:'Analisi in corso...',
    noResults:'Inserisci almeno una carta e clicca "Trova Sinergie"',
    errorGeneric:'Errore durante l\'analisi AI. Riprova.',
    errorRateLimit:'⏱️ Limite raggiunto. Attendi qualche secondo e riprova.',
    maxCards:'Massimo 5 carte', remove:'Rimuovi', back:'Indietro',
    suggestedCards:'Carte Suggerite', overview:'Panoramica Strategica',
    trialHint:'2 prove gratuite al mese — Registrati per accesso illimitato',
    copyList:'📋 Copia Lista', copied:'✅ Copiato!',
  },
  en: {
    title:'✨ AI Synergy Finder', subtitle:'Enter up to 5 cards and the AI will find the most synergistic cards',
    seedLabel:'Seed Cards', seedPlaceholder:'Card name (in English)...',
    addCard:'+ Add card', format:'Format', formatAny:'Any format',
    strategy:'Strategy', strategyAny:'AI decides',
    searchBtn:'Find Synergies', searching:'Analyzing...',
    noResults:'Enter at least one card and click "Find Synergies"',
    errorGeneric:'Error during AI analysis. Please try again.',
    errorRateLimit:'⏱️ Rate limit. Wait a few seconds and try again.',
    maxCards:'Maximum 5 cards', remove:'Remove', back:'Back',
    suggestedCards:'Suggested Cards', overview:'Strategic Overview',
    trialHint:'2 free tries per month — Sign up for unlimited access',
    copyList:'📋 Copy List', copied:'✅ Copied!',
  }
}

export default function CardSynergyAnon({ language, onBack, onTrialLimit }) {
  const t = tr[language] || tr.en
  const [seedCards, setSeedCards] = useState([''])
  const [format, setFormat] = useState('')
  const [strategy, setStrategy] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [previewCard, setPreviewCard] = useState(null)
  const [copied, setCopied] = useState(false)
  const [filterPriority, setFilterPriority] = useState('all')
  const suggestionsRef = useRef({ list: [], idx: null })
  const [, forceUpdate] = useState(0)
  const debounceRef = useRef(null)

  const fetchSuggestions = async (query, idx) => {
    if (!query || query.length < 2) { suggestionsRef.current = { list: [], idx: null }; forceUpdate(n => n+1); return }
    try {
      const res = await fetch(`${API_URL}/api/mtg-cards/search?query=${encodeURIComponent(query)}&page_size=8&language=${language}`)
      if (res.ok) { const d = await res.json(); suggestionsRef.current = { list: d.cards?.map(c => c.name) || [], idx }; forceUpdate(n => n+1) }
    } catch {}
  }

  const handleCardInput = (idx, value) => {
    const u = [...seedCards]; u[idx] = value; setSeedCards(u)
    suggestionsRef.current = { list: [], idx: null }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value, idx), 300)
  }

  const selectSuggestion = (idx, name) => {
    const u = [...seedCards]; u[idx] = name; setSeedCards(u)
    suggestionsRef.current = { list: [], idx: null }; forceUpdate(n => n+1)
  }

  const handleSearch = async () => {
    const valid = seedCards.map(c => c.trim()).filter(Boolean)
    if (!valid.length) { setError(language === 'it' ? 'Inserisci almeno una carta' : 'Enter at least one card'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(`${API_URL}/api/ai/find-synergies?language=${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getTrialHeaders() },
        body: JSON.stringify({ user_id: 0, card_names: valid, format: format || null, strategy: strategy || null })
      })
      const data = await res.json()
      if (res.status === 429) {
        if (isTrialLimitError(res, data)) { onTrialLimit(data); setLoading(false); return }
        setError(t.errorRateLimit); setLoading(false); return
      }
      if (!res.ok) { setError(t.errorGeneric); setLoading(false); return }
      setResult(data)
    } catch { setError(t.errorGeneric) }
    setLoading(false)
  }

  const copyList = () => {
    if (!result?.result?.suggested_cards) return
    navigator.clipboard.writeText(result.result.suggested_cards.map(c => `1x ${c.card_name}`).join('\n'))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const { list: cardSuggestions, idx: activeSuggestionIdx } = suggestionsRef.current

  return (
    <div className="card-synergy">
      <div className="cs-header">
        <button onClick={onBack} className="cs-back-btn">← {t.back}</button>
        <div className="cs-header-content"><h1>{t.title}</h1><p className="cs-subtitle">{t.subtitle}</p></div>
        <div className="cs-token-badge" style={{ background: '#f59e0b', color: '#000' }}>🧪 Trial</div>
      </div>
      <div className="try-trial-hint">{t.trialHint}</div>
      {error && <div className="cs-error">⚠️ {error}</div>}

      <div className="cs-layout">
        <div className="cs-input-panel">
          <div className="cs-section">
            <h2 className="cs-section-title">🃏 {t.seedLabel}</h2>
            <div className="cs-seed-cards">
              {seedCards.map((card, idx) => (
                <div key={idx} className="cs-card-input-wrapper">
                  <div className="cs-card-input-row">
                    <span className="cs-card-num">{idx + 1}</span>
                    <input className="cs-card-input" type="text" value={card} placeholder={t.seedPlaceholder}
                      onChange={e => handleCardInput(idx, e.target.value)} autoComplete="off" />
                    {seedCards.length > 1 && <button className="cs-remove-btn" onClick={() => setSeedCards(seedCards.filter((_,i) => i !== idx))}>✕</button>}
                  </div>
                  {activeSuggestionIdx === idx && cardSuggestions.length > 0 && (
                    <div className="cs-suggestions-dropdown">
                      {cardSuggestions.map((name, si) => (
                        <button key={si} className="cs-suggestion-item" onMouseDown={() => selectSuggestion(idx, name)}>{name}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {seedCards.length < 5
                ? <button className="cs-add-btn" onClick={() => setSeedCards([...seedCards, ''])}>{t.addCard}</button>
                : <p className="cs-max-note">⚠️ {t.maxCards}</p>}
            </div>
          </div>
          <div className="cs-section">
            <div className="cs-options">
              <div className="cs-option-group">
                <label className="cs-label">{t.format}</label>
                <select className="cs-select" value={format} onChange={e => setFormat(e.target.value)}>
                  <option value="">{t.formatAny}</option>
                  {FORMATS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
                </select>
              </div>
              <div className="cs-option-group">
                <label className="cs-label">{t.strategy}</label>
                <select className="cs-select" value={strategy} onChange={e => setStrategy(e.target.value)}>
                  <option value="">{t.strategyAny}</option>
                  {STRATEGIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button className="cs-search-btn" onClick={handleSearch} disabled={loading || seedCards.every(c => !c.trim())}>
            {loading ? <span className="cs-btn-loading"><span className="cs-spinner"></span>{t.searching}</span> : t.searchBtn}
          </button>
        </div>

        <div className="cs-results-panel">
          {loading && <div className="cs-loading-state"><div className="cs-loading-spinner"></div><p>🤖 {language === 'it' ? 'Analisi in corso...' : 'Analyzing...'}</p></div>}
          {!loading && !result && <div className="cs-empty-state"><div className="cs-empty-icon">✨</div><p>{t.noResults}</p></div>}
          {!loading && result?.result && (
            <div className="cs-result-content">
              {result.result.strategic_overview && (
                <div className="cs-result-card cs-overview">
                  <h3>🎯 {t.overview}</h3>
                  <p>{result.result.strategic_overview}</p>
                </div>
              )}
              {result.result.suggested_cards?.length > 0 && (
                <div className="cs-result-card">
                  <div className="cs-cards-header">
                    <h3>🃏 {t.suggestedCards} ({result.result.suggested_cards.length})</h3>
                    <button className="cs-copy-btn" onClick={copyList}>{copied ? t.copied : t.copyList}</button>
                  </div>
                  <div className="cs-cards-grid">
                    {result.result.suggested_cards
                      .filter(c => filterPriority === 'all' || c.priority === filterPriority)
                      .map((card, i) => (
                        <div key={i} className="cs-card-item">
                          <div className="cs-card-item-header">
                            <span className="cs-role-badge" style={{ background: ROLE_COLORS[card.role] || '#6b7280' }}>{card.role}</span>
                            <button className="cs-card-link cs-card-link-btn" onClick={() => setPreviewCard(card.card_name)}>{card.card_name}</button>
                            <span className="cs-priority-dot" style={{ background: PRIORITY_COLORS[card.priority] || '#6b7280' }} />
                          </div>
                          <p className="cs-synergy-reason">{card.synergy_reason}</p>
                          {card.estimated_price && <span className="cs-price-tag">💰 {card.estimated_price}</span>}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {previewCard && <CardPreviewModal cardName={previewCard} language={language} onClose={() => setPreviewCard(null)} />}
    </div>
  )
}
