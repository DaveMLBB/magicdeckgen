import { useState, useRef } from 'react'
import CardPreviewModal from '../../components/CardPreviewModal'
import { getTrialHeaders, isTrialLimitError } from '../../utils/anonymousTrial'
import '../../components/CardTwins.css'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const FORMATS = ['standard','pioneer','modern','legacy','vintage','commander','pauper']
const BUDGETS = [
  { value:'budget', label:{ it:'Solo economiche (<$2)', en:'Budget only (<$2)' } },
  { value:'any',    label:{ it:'Qualsiasi prezzo',      en:'Any price'          } },
  { value:'expensive', label:{ it:'Anche costose',      en:'Including expensive'} },
]

const RELATIONSHIP_CONFIG = {
  strictly_better: { color:'#10b981', icon:'⬆️', label:{ it:'Superiore',        en:'Strictly Better'  } },
  strictly_worse:  { color:'#f59e0b', icon:'⬇️', label:{ it:'Inferiore',        en:'Strictly Worse'   } },
  lateral:         { color:'#6366f1', icon:'↔️', label:{ it:'Laterale',         en:'Lateral'          } },
  functional_copy: { color:'#ec4899', icon:'🪞', label:{ it:'Copia Funzionale', en:'Functional Copy'  } },
}

const tr = {
  it: {
    title:'🪞 AI Gemelli', subtitle:'Trova carte che fanno esattamente la stessa cosa con nomi diversi',
    seedLabel:'Carte di partenza', seedPlaceholder:'Nome carta (in inglese)...',
    addCard:'+ Aggiungi carta', format:'Formato', formatAny:'Qualsiasi formato', budget:'Budget',
    searchBtn:'Trova Gemelli', searching:'Analisi in corso...',
    noResults:'Inserisci almeno una carta e clicca "Trova Gemelli"',
    errorGeneric:'Errore durante l\'analisi AI. Riprova.',
    errorRateLimit:'⏱️ Limite raggiunto. Attendi qualche secondo e riprova.',
    maxCards:'Massimo 5 carte', remove:'Rimuovi', back:'Indietro',
    trialHint:'2 prove gratuite al mese — Registrati per accesso illimitato',
    twins:'Gemelli trovati', analyzed:'Carte analizzate',
  },
  en: {
    title:'🪞 AI Twins', subtitle:'Find cards that do exactly the same thing with different names',
    seedLabel:'Source Cards', seedPlaceholder:'Card name (in English)...',
    addCard:'+ Add card', format:'Format', formatAny:'Any format', budget:'Budget',
    searchBtn:'Find Twins', searching:'Analyzing...',
    noResults:'Enter at least one card and click "Find Twins"',
    errorGeneric:'Error during AI analysis. Please try again.',
    errorRateLimit:'⏱️ Rate limit. Wait a few seconds and try again.',
    maxCards:'Maximum 5 cards', remove:'Remove', back:'Back',
    trialHint:'2 free tries per month — Sign up for unlimited access',
    twins:'Twins found', analyzed:'Analyzed cards',
  }
}

function SimilarityBar({ score }) {
  const color = score >= 90 ? '#10b981' : score >= 70 ? '#6366f1' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="ct-sim-bar-wrap">
      <div className="ct-sim-bar"><div className="ct-sim-fill" style={{ width:`${score}%`, background:color }} /></div>
      <span className="ct-sim-label" style={{ color }}>{score}%</span>
    </div>
  )
}

export default function CardTwinsAnon({ language, onBack, onTrialLimit }) {
  const t = tr[language] || tr.en
  const [seedCards, setSeedCards] = useState([''])
  const [format, setFormat] = useState('')
  const [budget, setBudget] = useState('any')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [previewCard, setPreviewCard] = useState(null)
  const suggestionsRef = useRef({ list: [], idx: null })
  const [, forceUpdate] = useState(0)
  const debounceRef = useRef(null)

  const fetchSuggestions = async (query, idx) => {
    if (!query || query.length < 2) { suggestionsRef.current = { list:[], idx:null }; forceUpdate(n=>n+1); return }
    try {
      const res = await fetch(`${API_URL}/api/mtg-cards/search?query=${encodeURIComponent(query)}&page_size=8&language=${language}`)
      if (res.ok) { const d = await res.json(); suggestionsRef.current = { list: d.cards?.map(c=>c.name)||[], idx }; forceUpdate(n=>n+1) }
    } catch {}
  }

  const handleCardInput = (idx, value) => {
    const u = [...seedCards]; u[idx] = value; setSeedCards(u)
    suggestionsRef.current = { list:[], idx:null }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value, idx), 300)
  }

  const selectSuggestion = (idx, name) => {
    const u = [...seedCards]; u[idx] = name; setSeedCards(u)
    suggestionsRef.current = { list:[], idx:null }; forceUpdate(n=>n+1)
  }

  const handleSearch = async () => {
    const valid = seedCards.map(c => c.trim()).filter(Boolean)
    if (!valid.length) { setError(language === 'it' ? 'Inserisci almeno una carta' : 'Enter at least one card'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(`${API_URL}/api/ai/find-twins?language=${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getTrialHeaders() },
        body: JSON.stringify({ user_id: 0, card_names: valid, format: format || null, budget: budget || null })
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

  const { list: cardSuggestions, idx: activeSuggestionIdx } = suggestionsRef.current
  const relConfig = (rel) => RELATIONSHIP_CONFIG[rel] || { color:'#6b7280', icon:'?', label:{ it:rel, en:rel } }

  return (
    <div className="card-twins">
      <div className="ct-header">
        <button onClick={onBack} className="ct-back-btn">← {t.back}</button>
        <div className="ct-header-content"><h1>{t.title}</h1><p className="ct-subtitle">{t.subtitle}</p></div>
        <div className="ct-token-badge" style={{ background:'#f59e0b', color:'#000' }}>🧪 Trial</div>
      </div>
      <div className="try-trial-hint">{t.trialHint}</div>
      {error && <div className="ct-error">⚠️ {error}</div>}

      <div className="ct-layout">
        <div className="ct-input-panel">
          <div className="ct-section">
            <h2 className="ct-section-title">🃏 {t.seedLabel}</h2>
            <div className="ct-seed-cards">
              {seedCards.map((card, idx) => (
                <div key={idx} className="ct-card-input-wrapper">
                  <div className="ct-card-input-row">
                    <span className="ct-card-num">{idx+1}</span>
                    <input className="ct-card-input" type="text" value={card} placeholder={t.seedPlaceholder}
                      onChange={e => handleCardInput(idx, e.target.value)} autoComplete="off" />
                    {seedCards.length > 1 && <button className="ct-remove-btn" onClick={() => setSeedCards(seedCards.filter((_,i)=>i!==idx))}>✕</button>}
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
                ? <button className="ct-add-btn" onClick={() => setSeedCards([...seedCards,''])}>{t.addCard}</button>
                : <p className="ct-max-note">⚠️ {t.maxCards}</p>}
            </div>
          </div>
          <div className="ct-section">
            <div className="ct-options">
              <div className="ct-option-group">
                <label className="ct-label">{t.format}</label>
                <select className="ct-select" value={format} onChange={e => setFormat(e.target.value)}>
                  <option value="">{t.formatAny}</option>
                  {FORMATS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
                </select>
              </div>
              <div className="ct-option-group">
                <label className="ct-label">{t.budget}</label>
                <select className="ct-select" value={budget} onChange={e => setBudget(e.target.value)}>
                  {BUDGETS.map(b => <option key={b.value} value={b.value}>{b.label[language]||b.label.en}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button className="ct-search-btn" onClick={handleSearch} disabled={loading || seedCards.every(c=>!c.trim())}>
            {loading ? <span className="ct-btn-loading"><span className="ct-spinner"></span>{t.searching}</span> : t.searchBtn}
          </button>
          <div className="ct-legend">
            {Object.entries(RELATIONSHIP_CONFIG).map(([key, cfg]) => (
              <div key={key} className="ct-legend-item">
                <span className="ct-legend-dot" style={{ background:cfg.color }}></span>
                <span className="ct-legend-icon">{cfg.icon}</span>
                <span className="ct-legend-label">{cfg.label[language]||cfg.label.en}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ct-results-panel">
          {loading && <div className="ct-loading-state"><div className="ct-loading-spinner"></div><p>🪞 {language==='it'?'Ricerca gemelli...':'Searching twins...'}</p></div>}
          {!loading && !result && <div className="ct-empty-state"><div className="ct-empty-icon">🪞</div><p>{t.noResults}</p></div>}
          {!loading && result?.result?.cards && (
            <div className="ct-result-content">
              {result.result.cards.map((cardResult, ci) => (
                <div key={ci} className="ct-source-block">
                  <div className="ct-source-header">
                    <button className="ct-card-link ct-card-link-btn" onClick={() => setPreviewCard(cardResult.source_card)}>{cardResult.source_card}</button>
                    <span className="ct-twins-count">{cardResult.twins?.length||0} {t.twins}</span>
                  </div>
                  {cardResult.source_summary && <p className="ct-source-summary">💡 {cardResult.source_summary}</p>}
                  <div className="ct-twins-grid">
                    {(cardResult.twins||[]).map((twin, ti) => {
                      const cfg = relConfig(twin.relationship)
                      return (
                        <div key={ti} className="ct-twin-card" style={{ borderLeftColor:cfg.color }}>
                          <div className="ct-twin-header">
                            <span className="ct-rel-badge" style={{ background:cfg.color }}>{cfg.icon} {cfg.label[language]||cfg.label.en}</span>
                            <button className="ct-card-link ct-card-link-btn" onClick={() => setPreviewCard(twin.card_name)}>{twin.card_name}</button>
                          </div>
                          {twin.similarity_score != null && <SimilarityBar score={twin.similarity_score} />}
                          {twin.why_similar && <p className="ct-twin-why">✅ {twin.why_similar}</p>}
                          {twin.key_differences && <p className="ct-twin-diff">⚡ {twin.key_differences}</p>}
                          <div className="ct-twin-meta">
                            {twin.estimated_price && <span className="ct-price-tag">💰 {twin.estimated_price}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {previewCard && <CardPreviewModal cardName={previewCard} language={language} onClose={() => setPreviewCard(null)} />}
    </div>
  )
}
