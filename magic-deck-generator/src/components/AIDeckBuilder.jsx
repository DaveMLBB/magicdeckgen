import { useState, useEffect, useRef } from 'react'
import './AIDeckBoost.css'
import './AIDeckBuilder.css'
import CardPreviewModal from './CardPreviewModal'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const CATEGORY_COLORS = {
  Creature: '#10b981', Spell: '#6366f1', Enchantment: '#ec4899',
  Artifact: '#94a3b8', Planeswalker: '#f59e0b', Land: '#78716c', Other: '#64748b',
}

const SUGGESTIONS = {
  it: [
    '🔥 Mazzo aggro rosso in Modern con burn spells',
    '🧙 Commander Atraxa con counter +1/+1 e proliferate',
    '🛡️ Control blu-bianco in Standard con counterspell',
    '🐉 Dragon Tribal Commander, budget medio',
    '💀 Reanimator nero in Legacy',
    '🌊 Merfolk Tribal in Pioneer',
    '⚡ Storm combo in Modern, turno 3-4',
    '🌲 Elfi verde in Legacy, molto aggressivo',
  ],
  en: [
    '🔥 Red aggro deck in Modern with burn spells',
    '🧙 Atraxa Commander with +1/+1 counters and proliferate',
    '🛡️ Blue-white control in Standard with counterspells',
    '🐉 Dragon Tribal Commander, mid budget',
    '💀 Black Reanimator in Legacy',
    '🌊 Merfolk Tribal in Pioneer',
    '⚡ Storm combo in Modern, turn 3-4',
    '🌲 Green Elves in Legacy, very aggressive',
  ]
}

const tr = {
  it: {
    title: '🏗️ AI Deck Builder',
    subtitle: 'Costruisci mazzi tramite chat AI',
    back: 'Indietro',
    deckPanel: 'Mazzo Generato',
    totalCards: 'carte totali',
    emptyChat: 'Descrivi il mazzo che vuoi costruire. Puoi specificare formato, colori, strategia o chiedere di usare la tua collezione.',
    placeholder: 'Es: "Costruisci un mazzo aggro rosso per Modern", "Aggiungi più rimozioni", "Rendilo più economico"...',
    costHint: '5 🪙 per messaggio',
    sendBtn: 'Invia', sending: '...',
    suggestionsTitle: '💡 Suggerimenti',
    collectionLabel: '📚 Collezione (opzionale)',
    collectionNone: 'Nessuna — qualsiasi carta',
    collectionHint: "L'AI userà solo le carte di questa collezione (max 300)",
    formatLabel: 'Formato', colorsLabel: 'Colori (es. WU)',
    resetBtn: '↩️ Nuova conversazione',
    deckUpdated: '✏️ Mazzo aggiornato',
    saveBtn: '💾 Salva Mazzo',
    saving: 'Salvataggio...', saved: '✅ Salvato!', saveError: 'Errore salvataggio',
    copyList: '📋 Copia Lista', copied: '✅ Copiato!',
    mainDeck: 'Mazzo', sideboard: 'Sideboard',
    errorTokens: 'Token insufficienti. Acquista token per continuare.',
    errorGeneric: 'Errore durante la generazione. Riprova.',
    errorDemoLimit: "⚠️ L'AI ha raggiunto il limite di richieste. Torna domani!",
    errorRateLimit: '⏱️ Limite raggiunto: max 3 richieste AI al minuto. Attendi e riprova.',
  },
  en: {
    title: '🏗️ AI Deck Builder',
    subtitle: 'Build decks via AI chat',
    back: 'Back',
    deckPanel: 'Generated Deck',
    totalCards: 'total cards',
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
    saveBtn: '💾 Save Deck',
    saving: 'Saving...', saved: '✅ Saved!', saveError: 'Save error',
    copyList: '📋 Copy List', copied: '✅ Copied!',
    mainDeck: 'Main Deck', sideboard: 'Sideboard',
    errorTokens: 'Insufficient tokens. Purchase tokens to continue.',
    errorGeneric: 'Error during generation. Please try again.',
    errorDemoLimit: '⚠️ AI has reached its request limit. Come back tomorrow!',
    errorRateLimit: '⏱️ Rate limit: max 3 AI requests per minute. Wait and retry.',
  }
}

function AIDeckBuilder({ user, language, onBack, onSaved }) {
  const t = tr[language] || tr.en
  const messagesEndRef = useRef(null)

  const [history, setHistory] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tokens, setTokens] = useState(user?.tokens || 0)
  const [currentDeck, setCurrentDeck] = useState(null)   // { cards, deck_name, format, colors, ... }
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [copied, setCopied] = useState(false)
  const [previewCard, setPreviewCard] = useState(null)
  const [collections, setCollections] = useState([])
  const [selectedCollectionId, setSelectedCollectionId] = useState(null)
  const [format, setFormat] = useState('')
  const [colors, setColors] = useState('')

  useEffect(() => {
    if (!user?.userId) return
    fetch(`${API_URL}/api/collections/user/${user.userId}`)
      .then(r => r.json())
      .then(data => setCollections(data.collections || []))
      .catch(() => {})
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          message: userMsg,
          history: history,
          collection_id: selectedCollectionId || null,
          format: format || null,
          colors: colors || null,
        })
      })
      const data = await res.json()

      if (!res.ok) {
        const detail = data.detail || ''
        setError(
          res.status === 429 ? t.errorRateLimit :
          res.status === 403 ? t.errorTokens :
          detail === 'DEMO_RATE_LIMIT' ? t.errorDemoLimit :
          t.errorGeneric
        )
        setHistory(history)
        setLoading(false)
        return
      }

      const assistantMsg = {
        role: 'assistant',
        content: data.assistant_message,
        deck_updated: data.deck_updated
      }
      setHistory([...newHistory, assistantMsg])
      setTokens(data.tokens_remaining)
      if (user) user.tokens = data.tokens_remaining

      if (data.deck_updated && data.deck?.cards) {
        setCurrentDeck(data.deck)
        setSaveStatus(null)
      }
    } catch {
      setError(t.errorGeneric)
      setHistory(history)
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReset = () => {
    setHistory([])
    setCurrentDeck(null)
    setSaveStatus(null)
    setError(null)
  }

  const handleSave = async () => {
    if (!currentDeck?.cards?.length) return
    setSaving(true)
    setSaveStatus(null)
    try {
      const cards = currentDeck.cards.map(c => ({
        card_name: c.card_name,
        quantity: c.quantity,
        card_type: c.category || null,
      }))
      const res = await fetch(`${API_URL}/api/saved-decks/create?user_id=${user.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentDeck.deck_name || 'AI Built Deck',
          description: currentDeck.deck_description || currentDeck.strategy_notes || '',
          format: currentDeck.format || format || null,
          colors: currentDeck.colors || colors || null,
          archetype: currentDeck.archetype || null,
          source: 'ai_chat_build',
          is_public: false,
          collection_ids: [],
          cards,
        })
      })
      if (res.ok) {
        setSaveStatus('saved')
        setTimeout(() => { if (onSaved) onSaved() }, 800)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    }
    setSaving(false)
  }

  const handleCopy = () => {
    if (!currentDeck?.cards?.length) return
    const lines = currentDeck.cards.map(c => `${c.quantity} ${c.card_name}`).join('\n')
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const totalCards = currentDeck?.cards?.reduce((s, c) => s + (c.quantity || 0), 0) || 0

  return (
    <div className="ai-deck-boost">
      {/* Header */}
      <div className="abb-header">
        <button onClick={onBack} className="abb-back-btn">← {t.back}</button>
        <div className="abb-header-content">
          <h1>{t.title}</h1>
          <p className="abb-subtitle">{t.subtitle}</p>
        </div>
        <div className="abb-token-badge">🪙 {tokens}</div>
      </div>

      {error && <div className="abb-error">⚠️ {error}</div>}

      <div className="abb-layout">
        {/* Pannello sinistro */}
        <div className="abb-deck-panel">
          {/* Formato e colori */}
          <div>
            <p className="abb-panel-title">{t.formatLabel}</p>
            <select
              className="abb-deck-select"
              value={format}
              onChange={e => setFormat(e.target.value)}
            >
              <option value="">— {language === 'it' ? 'Qualsiasi' : 'Any'} —</option>
              {['Standard','Pioneer','Modern','Legacy','Vintage','Commander','Pauper','Draft'].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="abb-panel-title">{t.colorsLabel}</p>
            <input
              className="abb-deck-select"
              type="text"
              value={colors}
              onChange={e => setColors(e.target.value.toUpperCase())}
              placeholder="WU, BRG, WUBRG..."
              maxLength={5}
            />
          </div>

          {/* Collezione opzionale */}
          {collections.length > 0 && (
            <div className="abb-collection-section">
              <p className="abb-panel-title">{t.collectionLabel}</p>
              <select
                className="abb-deck-select"
                value={selectedCollectionId || ''}
                onChange={e => {
                  setSelectedCollectionId(e.target.value ? Number(e.target.value) : null)
                  setHistory([])
                }}
              >
                <option value="">{t.collectionNone}</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.total_cards} {language === 'it' ? 'carte' : 'cards'})
                  </option>
                ))}
              </select>
              {selectedCollectionId && (
                <p className="abb-collection-hint">{t.collectionHint}</p>
              )}
            </div>
          )}

          {/* Mazzo generato */}
          <p className="abb-panel-title">🃏 {t.deckPanel}</p>
          <div className="abb-card-list">
            {(currentDeck?.cards || []).map((card, i) => (
              <div
                key={i}
                className="abb-card-row"
                onClick={() => setPreviewCard(card.card_name)}
                title={card.card_name}
              >
                <span className="abb-card-qty">{card.quantity}x</span>
                <span
                  className="abb-card-dot"
                  style={{ background: CATEGORY_COLORS[card.category] || CATEGORY_COLORS.Other }}
                />
                <span className="abb-card-name">{card.card_name}</span>
              </div>
            ))}
          </div>
          {totalCards > 0 && (
            <div className="abb-card-total">{totalCards} {t.totalCards}</div>
          )}

          {/* Azioni */}
          <div className="abb-deck-actions">
            {currentDeck?.cards?.length > 0 && (
              <>
                <button
                  className={`abb-save-btn ${saveStatus === 'saved' ? 'saved' : saveStatus === 'error' ? 'error' : ''}`}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? t.saving : saveStatus === 'saved' ? t.saved : saveStatus === 'error' ? t.saveError : t.saveBtn}
                </button>
                <button
                  className="abb-save-btn"
                  style={{ background: '#475569' }}
                  onClick={handleCopy}
                >
                  {copied ? t.copied : t.copyList}
                </button>
              </>
            )}
            {history.length > 0 && (
              <button className="abb-reset-btn" onClick={handleReset}>
                {t.resetBtn}
              </button>
            )}
          </div>
        </div>

        {/* Pannello centrale: chat */}
        <div className="abb-chat-panel">
          <div className="abb-messages">
            {history.length === 0 && !loading && (
              <div className="abb-empty-chat">
                <div className="abb-empty-icon">🏗️</div>
                <p>{t.emptyChat}</p>
              </div>
            )}
            {history.map((msg, i) => (
              <div key={i} className={`abb-msg ${msg.role}`}>
                <div className="abb-msg-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div>
                  <div className="abb-msg-bubble">{msg.content}</div>
                  {msg.deck_updated && (
                    <span className="abb-msg-modified-badge">{t.deckUpdated}</span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="abb-msg assistant">
                <div className="abb-msg-avatar">🤖</div>
                <div className="abb-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="abb-cost-hint">{t.costHint}</div>
          <div className="abb-input-area">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              rows={2}
              disabled={loading}
            />
            <button
              className="abb-send-btn"
              onClick={handleSend}
              disabled={loading || !message.trim()}
            >
              {loading ? t.sending : t.sendBtn}
            </button>
          </div>
        </div>

        {/* Pannello destro: suggerimenti */}
        <div className="abb-suggestions-panel">
          <p className="abb-panel-title">{t.suggestionsTitle}</p>
          {(SUGGESTIONS[language] || SUGGESTIONS.en).map((s, i) => (
            <button
              key={i}
              className="abb-suggestion-btn"
              onClick={() => setMessage(s.replace(/^[^\s]+ /, ''))}
              disabled={loading}
            >
              {s}
            </button>
          ))}
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

export default AIDeckBuilder
