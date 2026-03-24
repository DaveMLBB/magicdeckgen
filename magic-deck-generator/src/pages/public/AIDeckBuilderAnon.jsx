import { useState, useRef, useEffect } from 'react'
import CardPreviewModal from '../../components/CardPreviewModal'
import { getTrialHeaders, isTrialLimitError } from '../../utils/anonymousTrial'
import '../../components/AIDeckBuilder.css'
import '../../components/AIDeckBoost.css'

const API_URL = import.meta.env.PROD
  ? 'https://api.mtgdecksbuilder.com'
  : 'http://localhost:8000'

const CATEGORY_COLORS = {
  Creature: '#10b981', Instant: '#6366f1', Sorcery: '#8b5cf6',
  Enchantment: '#ec4899', Equipment: '#f97316', Artifact: '#94a3b8',
  Planeswalker: '#f59e0b', Land: '#78716c', Other: '#64748b',
}

const SUGGESTIONS = {
  it: ['🔥 Mazzo aggro rosso in Modern', '🧙 Commander Atraxa con counter +1/+1', '🛡️ Control blu-bianco in Standard', '🐉 Dragon Tribal Commander budget'],
  en: ['🔥 Red aggro deck in Modern', '🧙 Atraxa Commander with +1/+1 counters', '🛡️ Blue-white control in Standard', '🐉 Dragon Tribal Commander budget'],
}

const tr = {
  it: {
    title: '🏗️ AI Deck Builder', subtitle: 'Costruisci mazzi tramite chat AI',
    back: 'Indietro', deckPanel: 'Mazzo Generato', totalCards: 'carte totali',
    emptyChat: 'Descrivi il mazzo che vuoi costruire. Puoi specificare formato, colori e strategia.',
    placeholder: 'Es: "Costruisci un mazzo aggro rosso per Modern"...',
    trialHint: '2 prove gratuite al mese — Registrati per accesso illimitato',
    sendBtn: 'Invia', sending: '...', suggestionsTitle: '💡 Suggerimenti',
    formatLabel: 'Formato', colorsLabel: 'Colori (es. WU)',
    resetBtn: '↩️ Nuova conversazione', deckUpdated: '✏️ Mazzo aggiornato',
    copyList: '📋 Copia Lista', copied: '✅ Copiato!',
    mainDeck: 'Mazzo',
    errorGeneric: 'Errore durante la generazione. Riprova.',
    errorDemoLimit: "⚠️ L'AI ha raggiunto il limite di richieste. Torna domani!",
    errorRateLimit: '⏱️ Limite raggiunto: max 3 richieste AI al minuto. Attendi e riprova.',
    trialExhausted: 'Hai esaurito le prove gratuite per questo strumento.',
  },
  en: {
    title: '🏗️ AI Deck Builder', subtitle: 'Build decks via AI chat',
    back: 'Back', deckPanel: 'Generated Deck', totalCards: 'total cards',
    emptyChat: 'Describe the deck you want to build. You can specify format, colors and strategy.',
    placeholder: 'E.g. "Build a red aggro deck for Modern"...',
    trialHint: '2 free tries per month — Sign up for unlimited access',
    sendBtn: 'Send', sending: '...', suggestionsTitle: '💡 Suggestions',
    formatLabel: 'Format', colorsLabel: 'Colors (e.g. WU)',
    resetBtn: '↩️ New conversation', deckUpdated: '✏️ Deck updated',
    copyList: '📋 Copy List', copied: '✅ Copied!',
    mainDeck: 'Main Deck',
    errorGeneric: 'Error during generation. Please try again.',
    errorDemoLimit: '⚠️ AI has reached its request limit. Come back tomorrow!',
    errorRateLimit: '⏱️ Rate limit: max 3 AI requests per minute. Wait and retry.',
    trialExhausted: 'You have exhausted your free tries for this tool.',
  }
}

export default function AIDeckBuilderAnon({ language, onBack, onTrialLimit }) {
  const t = tr[language] || tr.en
  const messagesEndRef = useRef(null)
  const [history, setHistory] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentDeck, setCurrentDeck] = useState(null)
  const [copied, setCopied] = useState(false)
  const [previewCard, setPreviewCard] = useState(null)
  const [format, setFormat] = useState('')
  const [colors, setColors] = useState('')
  const [mobileTab, setMobileTab] = useState('chat')

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history, loading])

  const handleSend = async () => {
    if (!message.trim()) return
    const userMsg = message.trim()
    setMessage('')
    setError(null)
    setLoading(true)
    const newHistory = [...history, { role: 'user', content: userMsg }]
    setHistory(newHistory)

    try {
      const res = await fetch(`${API_URL}/api/ai/chat-build-deck?language=${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getTrialHeaders() },
        body: JSON.stringify({
          user_id: 0,
          message: userMsg,
          history,
          collection_id: null,
          format: format || null,
          colors: colors || null,
          current_deck: currentDeck || null,
        })
      })
      const data = await res.json()

      if (res.status === 429) {
        if (isTrialLimitError(res, data)) { onTrialLimit(data); setLoading(false); return }
        setError(t.errorRateLimit); setLoading(false); return
      }
      if (!res.ok) {
        const detail = data.detail || ''
        setError(detail === 'DEMO_RATE_LIMIT' ? t.errorDemoLimit : t.errorGeneric)
        setLoading(false); return
      }

      setHistory([...newHistory, { role: 'assistant', content: data.assistant_message, deck_updated: data.deck_updated }])
      if (data.deck_updated && data.deck?.cards) setCurrentDeck(data.deck)
    } catch { setError(t.errorGeneric) }
    setLoading(false)
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const handleReset = () => { setHistory([]); setCurrentDeck(null); setError(null) }

  const handleCopy = () => {
    if (!currentDeck?.cards?.length) return
    navigator.clipboard.writeText(currentDeck.cards.map(c => `${c.quantity} ${c.card_name}`).join('\n'))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const totalCards = currentDeck?.cards?.reduce((s, c) => s + (c.quantity || 0), 0) || 0

  return (
    <div className="ai-deck-boost">
      <div className="abb-header">
        <button onClick={onBack} className="abb-back-btn">← {t.back}</button>
        <div className="abb-header-content">
          <h1>{t.title}</h1>
          <p className="abb-subtitle">{t.subtitle}</p>
        </div>
        <div className="abb-token-badge" style={{ background: '#f59e0b', color: '#000' }}>🧪 Trial</div>
      </div>

      <div className="try-trial-hint">{t.trialHint}</div>
      {error && <div className="abb-error">⚠️ {error}</div>}

      <div className="abb-mobile-tabs">
        <button className={`abb-mobile-tab ${mobileTab === 'chat' ? 'active' : ''}`} onClick={() => setMobileTab('chat')}>💬 Chat</button>
        <button className={`abb-mobile-tab ${mobileTab === 'cards' ? 'active' : ''}`} onClick={() => setMobileTab('cards')}>🃏 {language === 'it' ? 'Carte' : 'Cards'} {totalCards > 0 && `(${totalCards})`}</button>
        <button className={`abb-mobile-tab ${mobileTab === 'deck' ? 'active' : ''}`} onClick={() => setMobileTab('deck')}>⚙️ {language === 'it' ? 'Opzioni' : 'Options'}</button>
      </div>

      <div className="abb-layout">
        <div className={`abb-deck-panel${mobileTab === 'deck' ? ' abb-mobile-visible' : ''}`}>
          <div>
            <p className="abb-panel-title">{t.formatLabel}</p>
            <select className="abb-deck-select" value={format} onChange={e => setFormat(e.target.value)}>
              <option value="">— {language === 'it' ? 'Qualsiasi' : 'Any'} —</option>
              {['Standard','Pioneer','Modern','Legacy','Vintage','Commander','Pauper'].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <p className="abb-panel-title">{t.colorsLabel}</p>
            <input className="abb-deck-select" type="text" value={colors} onChange={e => setColors(e.target.value.toUpperCase())} placeholder="WU, BRG..." maxLength={5} />
          </div>
          <p className="abb-panel-title">🃏 {t.deckPanel}</p>
          <div className="abb-card-list">
            {(currentDeck?.cards || []).map((card, i) => (
              <div key={i} className="abb-card-row" onClick={() => setPreviewCard(card.card_name)}>
                <span className="abb-card-qty">{card.quantity}x</span>
                <span className="abb-card-dot" style={{ background: CATEGORY_COLORS[card.category] || CATEGORY_COLORS.Other }} />
                <span className="abb-card-name">{card.card_name}</span>
              </div>
            ))}
          </div>
          {totalCards > 0 && <div className="abb-card-total">{totalCards} {t.totalCards}</div>}
          <div className="abb-deck-actions">
            {currentDeck?.cards?.length > 0 && (
              <button className="abb-save-btn" style={{ background: '#475569' }} onClick={handleCopy}>
                {copied ? t.copied : t.copyList}
              </button>
            )}
            {history.length > 0 && <button className="abb-reset-btn" onClick={handleReset}>{t.resetBtn}</button>}
          </div>
        </div>

        <div className={`abb-chat-panel${mobileTab === 'chat' ? ' abb-mobile-visible' : ''}`}>
          <div className="abb-messages">
            {history.length === 0 && !loading && (
              <div className="abb-empty-chat"><div className="abb-empty-icon">🏗️</div><p>{t.emptyChat}</p></div>
            )}
            {history.map((msg, i) => (
              <div key={i} className={`abb-msg ${msg.role}`}>
                <div className="abb-msg-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
                <div>
                  <div className="abb-msg-bubble">{msg.content}</div>
                  {msg.deck_updated && <span className="abb-msg-modified-badge">{t.deckUpdated}</span>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="abb-msg assistant">
                <div className="abb-msg-avatar">🤖</div>
                <div className="abb-typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="abb-cost-hint">{t.trialHint}</div>
          <div className="abb-input-area">
            <textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder={t.placeholder} rows={2} disabled={loading} />
            <button className="abb-send-btn" onClick={handleSend} disabled={loading || !message.trim()}>
              {loading ? t.sending : t.sendBtn}
            </button>
          </div>
        </div>

        <div className="abb-suggestions-panel">
          {history.length === 0 && (
            <>
              <p className="abb-panel-title">{t.suggestionsTitle}</p>
              {(SUGGESTIONS[language] || SUGGESTIONS.en).map((s, i) => (
                <button key={i} className="abb-suggestion-btn" onClick={() => setMessage(s.replace(/^[^\s]+ /, ''))} disabled={loading}>{s}</button>
              ))}
            </>
          )}
        </div>
      </div>

      {previewCard && <CardPreviewModal cardName={previewCard} language={language} onClose={() => setPreviewCard(null)} />}
    </div>
  )
}
