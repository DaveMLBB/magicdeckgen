import { useState, useEffect, useRef } from 'react'
import './AIDeckBoost.css'
import './AIDeckBuilder.css'
import CardPreviewModal from './CardPreviewModal'

const API_URL = import.meta.env.PROD
  ? 'https://api.mtgdecksbuilder.com'
  : 'http://localhost:8000'

const CATEGORY_COLORS = {
  Creature: '#10b981', Instant: '#6366f1', Sorcery: '#8b5cf6',
  Enchantment: '#ec4899', Equipment: '#f97316', Artifact: '#94a3b8',
  Planeswalker: '#f59e0b', Land: '#78716c', Other: '#64748b',
  // legacy fallback
  Spell: '#6366f1',
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
    collectionHint: "L'AI userà solo le carte di questa collezione (max 415)",
    formatLabel: 'Formato', colorsLabel: 'Colori (es. WU)',
    resetBtn: '↩️ Nuova conversazione',
    deckUpdated: '✏️ Mazzo aggiornato',
    statsTitle: '📊 Statistiche',
    avgCmc: 'CMC Medio',
    uniqueCardsLabel: 'Carte Uniche',
    manaCurve: 'Curva di Mana',
    types: 'Tipi',
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
    collectionHint: 'AI will only use cards from this collection (max 415)',
    formatLabel: 'Format', colorsLabel: 'Colors (e.g. WU)',
    resetBtn: '↩️ New conversation',
    deckUpdated: '✏️ Deck updated',
    statsTitle: '📊 Stats',
    avgCmc: 'Avg CMC',
    uniqueCardsLabel: 'Unique Cards',
    manaCurve: 'Mana Curve',
    types: 'Types',
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

function AIDeckBuilder({ user, language, onBack, onSaved, onTokensUpdate }) {
  const t = tr[language] || tr.en
  const messagesEndRef = useRef(null)

  const [history, setHistory] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tokens, setTokens] = useState(user?.tokens || 0)

  useEffect(() => {
    if (user?.tokens != null) setTokens(user.tokens)
  }, [user?.tokens])

  const [currentDeck, setCurrentDeck] = useState(null)   // { cards, deck_name, format, colors, ... }
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [copied, setCopied] = useState(false)
  const [previewCard, setPreviewCard] = useState(null)
  const [collections, setCollections] = useState([])
  const [selectedCollectionId, setSelectedCollectionId] = useState(null)
  const [format, setFormat] = useState('')
  const [colors, setColors] = useState('')
  const [mobileTab, setMobileTab] = useState('chat') // 'chat' | 'deck'

  // Calcola diff carte tra deck precedente e attuale
  const prevDeckRef = useRef(null)
  const [deckDiff, setDeckDiff] = useState(null) // { added: [], removed: [] }

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
          current_deck: currentDeck || null,
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
        // mantieni il messaggio utente nella history
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
      if (onTokensUpdate) onTokensUpdate()

      if (data.deck_updated && data.deck?.cards) {
        const prevCards = prevDeckRef.current?.cards || []
        const newCards = data.deck.cards
        const prevMap = Object.fromEntries(prevCards.map(c => [c.card_name, c.quantity]))
        const newMap = Object.fromEntries(newCards.map(c => [c.card_name, c.quantity]))

        const added = []
        const removed = []
        for (const [name, qty] of Object.entries(newMap)) {
          if (!prevMap[name]) added.push({ card_name: name, quantity: qty })
          else if (qty > prevMap[name]) added.push({ card_name: name, quantity: qty - prevMap[name] })
        }
        for (const [name, qty] of Object.entries(prevMap)) {
          if (!newMap[name]) removed.push({ card_name: name, quantity: qty })
          else if (qty > newMap[name]) removed.push({ card_name: name, quantity: qty - newMap[name] })
        }
        setDeckDiff(added.length || removed.length ? { added, removed } : null)
        prevDeckRef.current = data.deck
        setCurrentDeck(data.deck)
        setSaveStatus(null)
      }
    } catch (e) {
      console.error('Chat build error:', e)
      setError(t.errorGeneric)
      // mantieni il messaggio utente nella history (newHistory già settato)
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
    setDeckDiff(null)
    prevDeckRef.current = null
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
  const uniqueCards = currentDeck?.cards?.length || 0

  // Statistiche e curva mana calcolate dal deck
  const deckStats = currentDeck?.cards?.length ? (() => {
    const nonLand = currentDeck.cards.filter(c => c.category !== 'Land')
    const totalNonLand = nonLand.reduce((s, c) => s + (c.quantity || 0), 0)
    const avgCmc = totalNonLand > 0
      ? nonLand.reduce((s, c) => s + (c.cmc || 0) * (c.quantity || 0), 0) / totalNonLand
      : 0

    const curve = {}
    nonLand.forEach(c => {
      const bucket = Math.min(c.cmc || 0, 7)
      curve[bucket] = (curve[bucket] || 0) + (c.quantity || 0)
    })

    const typeCount = {}
    currentDeck.cards.forEach(c => {
      const cat = c.category || 'Other'
      typeCount[cat] = (typeCount[cat] || 0) + (c.quantity || 0)
    })

    return { avgCmc, curve, typeCount }
  })() : null

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

      {/* Tab switcher mobile */}
      <div className="abb-mobile-tabs">
        <button
          className={`abb-mobile-tab ${mobileTab === 'chat' ? 'active' : ''}`}
          onClick={() => setMobileTab('chat')}
        >
          💬 Chat
        </button>
        <button
          className={`abb-mobile-tab ${mobileTab === 'cards' ? 'active' : ''}`}
          onClick={() => setMobileTab('cards')}
        >
          🃏 {language === 'it' ? 'Carte' : 'Cards'} {totalCards > 0 && `(${totalCards})`}
        </button>
        <button
          className={`abb-mobile-tab ${mobileTab === 'deck' ? 'active' : ''}`}
          onClick={() => setMobileTab('deck')}
        >
          ⚙️ {language === 'it' ? 'Opzioni' : 'Options'}
        </button>
      </div>

      <div className="abb-layout">
        {/* Pannello destro: suggerimenti o diff mazzo — integrato nel tab Opzioni */}
        <div className={`abb-deck-panel${mobileTab === 'deck' ? ' abb-mobile-visible' : ''}`} style={{ gap: '1rem' }}>
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
                    {c.name} ({c.card_count} {language === 'it' ? 'carte' : 'cards'})
                  </option>
                ))}
              </select>
              {selectedCollectionId && (
                <p className="abb-collection-hint">{t.collectionHint}</p>
              )}
            </div>
          )}

          {/* Suggerimenti o diff */}
          {history.length === 0 ? (
            <>
              <p className="abb-panel-title">{t.suggestionsTitle}</p>
              {(SUGGESTIONS[language] || SUGGESTIONS.en).map((s, i) => (
                <button
                  key={i}
                  className="abb-suggestion-btn"
                  onClick={() => { setMessage(s.replace(/^[^\s]+ /, '')); setMobileTab('chat') }}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </>
          ) : (
            <>
              <p className="abb-panel-title">
                {language === 'it' ? '🔄 Ultime modifiche' : '🔄 Last changes'}
              </p>
              {!deckDiff && !currentDeck && (
                <p className="abb-diff-empty">
                  {language === 'it' ? 'Nessun mazzo ancora generato.' : 'No deck generated yet.'}
                </p>
              )}
              {!deckDiff && currentDeck && (
                <p className="abb-diff-empty">
                  {language === 'it' ? 'Nessuna modifica nell\'ultimo messaggio.' : 'No changes in last message.'}
                </p>
              )}
              {deckDiff?.added?.length > 0 && (
                <div className="abb-diff-section">
                  <p className="abb-diff-label added">➕ {language === 'it' ? 'Aggiunte' : 'Added'}</p>
                  {deckDiff.added.map((c, i) => (
                    <div key={i} className="abb-diff-row added" onClick={() => setPreviewCard(c.card_name)} style={{ cursor: 'pointer' }}>
                      <span className="abb-card-qty">{c.quantity}x</span>
                      <span className="abb-card-name">{c.card_name}</span>
                    </div>
                  ))}
                </div>
              )}
              {deckDiff?.removed?.length > 0 && (
                <div className="abb-diff-section">
                  <p className="abb-diff-label removed">➖ {language === 'it' ? 'Rimosse' : 'Removed'}</p>
                  {deckDiff.removed.map((c, i) => (
                    <div key={i} className="abb-diff-row removed" onClick={() => setPreviewCard(c.card_name)} style={{ cursor: 'pointer' }}>
                      <span className="abb-card-qty">{c.quantity}x</span>
                      <span className="abb-card-name">{c.card_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
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

        {/* Pannello mobile: lista carte del mazzo */}
        <div className={`abb-mobile-cards-panel${mobileTab === 'cards' ? ' abb-mobile-visible' : ''}`}>
          {!currentDeck?.cards?.length ? (
            <div className="abb-empty-chat">
              <div className="abb-empty-icon">🃏</div>
              <p>{language === 'it' ? 'Nessun mazzo generato ancora.\nChiedi all\'AI di costruire un mazzo!' : 'No deck generated yet.\nAsk the AI to build a deck!'}</p>
            </div>
          ) : (
            <>
              <div className="abb-mobile-cards-list">
                {currentDeck.cards.map((card, i) => (
                  <div
                    key={i}
                    className="abb-card-row"
                    onClick={() => setPreviewCard(card.card_name)}
                  >
                    <span className="abb-card-qty">{card.quantity}x</span>
                    <span className="abb-card-dot" style={{ background: CATEGORY_COLORS[card.category] || CATEGORY_COLORS.Other }} />
                    <span className="abb-card-name">{card.card_name}</span>
                    <span className="abb-card-cat" style={{ color: CATEGORY_COLORS[card.category] || CATEGORY_COLORS.Other }}>{card.category}</span>
                  </div>
                ))}
              </div>
              <div className="abb-mobile-cards-footer">
                <div className="abb-card-total">{totalCards} {t.totalCards}</div>
                <div className="abb-deck-actions">
                  <button
                    className={`abb-save-btn ${saveStatus === 'saved' ? 'saved' : saveStatus === 'error' ? 'error' : ''}`}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? t.saving : saveStatus === 'saved' ? t.saved : saveStatus === 'error' ? t.saveError : t.saveBtn}
                  </button>
                  <button className="abb-save-btn" style={{ background: '#475569' }} onClick={handleCopy}>
                    {copied ? t.copied : t.copyList}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pannello centrale: chat */}
        <div className={`abb-chat-panel${mobileTab === 'chat' ? ' abb-mobile-visible' : ''}`}>
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
