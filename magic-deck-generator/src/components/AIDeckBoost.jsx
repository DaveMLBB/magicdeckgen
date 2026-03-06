import { useState, useEffect, useRef } from 'react'
import './AIDeckBoost.css'
import CardPreviewModal from './CardPreviewModal'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const CATEGORY_COLORS = {
  Creature:     '#10b981',
  Spell:        '#6366f1',
  Enchantment:  '#ec4899',
  Artifact:     '#94a3b8',
  Planeswalker: '#f59e0b',
  Land:         '#78716c',
  Other:        '#64748b',
}

const t = {
  it: {
    title: '⚡ AI Deck Boost',
    subtitle: 'Modifica il tuo mazzo tramite chat AI con memoria della sessione',
    back: 'Indietro',
    selectDeck: 'Seleziona un mazzo...',
    noDecks: 'Nessun mazzo salvato',
    deckPanel: 'Mazzo Corrente',
    totalCards: 'carte totali',
    saveBtn: '💾 Salva Modifiche',
    saveNew: '💾 Salva come Nuovo',
    saving: 'Salvataggio...',
    saved: '✅ Salvato!',
    saveError: 'Errore salvataggio',
    resetBtn: '↩️ Ripristina Originale',
    sendBtn: 'Invia',
    sending: '...',
    placeholder: 'Es: "Rendilo più aggressivo", "Sostituisci le creature costose con quelle a 2 mana", "Aggiungi più rimozioni"...',
    costHint: '10 🪙 per messaggio',
    suggestionsTitle: '💡 Suggerimenti',
    emptyChat: 'Seleziona un mazzo e inizia a chattare con l\'AI per modificarlo',
    modified: '✏️ Mazzo aggiornato',
    errorTokens: 'Token insufficienti. Acquista token per continuare.',
    errorGeneric: 'Errore durante la generazione. Riprova.',
    errorDemoLimit: '⚠️ L\'AI ha raggiunto il limite di richieste. Torna domani!',
    errorRateLimit: '⏱️ Limite raggiunto: max 3 richieste AI al minuto. Attendi e riprova.',
    errorNoDecks: 'Seleziona prima un mazzo',
  },
  en: {
    title: '⚡ AI Deck Boost',
    subtitle: 'Modify your deck via AI chat with session memory',
    back: 'Back',
    selectDeck: 'Select a deck...',
    noDecks: 'No saved decks',
    deckPanel: 'Current Deck',
    totalCards: 'total cards',
    saveBtn: '💾 Save Changes',
    saveNew: '💾 Save as New',
    saving: 'Saving...',
    saved: '✅ Saved!',
    saveError: 'Save error',
    resetBtn: '↩️ Reset to Original',
    sendBtn: 'Send',
    sending: '...',
    placeholder: 'E.g. "Make it more aggressive", "Replace expensive creatures with 2-mana ones", "Add more removal"...',
    costHint: '10 🪙 per message',
    suggestionsTitle: '💡 Suggestions',
    emptyChat: 'Select a deck and start chatting with the AI to modify it',
    modified: '✏️ Deck updated',
    errorTokens: 'Insufficient tokens. Purchase tokens to continue.',
    errorGeneric: 'Error during generation. Please try again.',
    errorDemoLimit: '⚠️ AI has reached its request limit. Come back tomorrow!',
    errorRateLimit: '⏱️ Rate limit: max 3 AI requests per minute. Wait and retry.',
    errorNoDecks: 'Please select a deck first',
  }
}

const SUGGESTIONS = {
  it: [
    '🔥 Rendilo più aggressivo, abbassa la curva di mana',
    '🛡️ Aggiungi più carte difensive e rimozioni',
    '⚡ Sostituisci le creature costose con quelle a basso costo',
    '🔄 Migliora la consistenza aggiungendo più copie delle carte chiave',
    '💰 Sostituisci le carte costose con alternative economiche',
    '🎯 Ottimizza il mana base per i colori del mazzo',
    '🌊 Aggiungi più draw e card advantage',
    '💥 Aggiungi win condition più forti',
  ],
  en: [
    '🔥 Make it more aggressive, lower the mana curve',
    '🛡️ Add more defensive cards and removal',
    '⚡ Replace expensive creatures with low-cost ones',
    '🔄 Improve consistency by adding more copies of key cards',
    '💰 Replace expensive cards with budget alternatives',
    '🎯 Optimize the mana base for the deck\'s colors',
    '🌊 Add more draw and card advantage',
    '💥 Add stronger win conditions',
  ]
}

function AIDeckBoost({ user, language, onBack, onSaved }) {
  const tr = t[language] || t.en
  const messagesEndRef = useRef(null)

  const [decks, setDecks] = useState([])
  const [selectedDeckId, setSelectedDeckId] = useState(null)
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [originalCards, setOriginalCards] = useState([])
  const [currentCards, setCurrentCards] = useState([])
  const [history, setHistory] = useState([])   // [{role, content}]
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tokens, setTokens] = useState(user?.tokens || 0)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [previewCard, setPreviewCard] = useState(null)
  const [deckModified, setDeckModified] = useState(false)

  // Carica lista mazzi salvati
  useEffect(() => {
    if (!user?.userId) return
    fetch(`${API_URL}/api/saved-decks/user/${user.userId}`)
      .then(r => r.json())
      .then(data => {
        const list = data.decks || data || []
        setDecks(list)
        if (list.length > 0) setSelectedDeckId(list[0].id)
      })
      .catch(() => {})
  }, [user])

  // Carica carte del mazzo selezionato
  useEffect(() => {
    if (!selectedDeckId || !user?.userId) return
    const deck = decks.find(d => d.id === selectedDeckId)
    setSelectedDeck(deck || null)
    setHistory([])
    setDeckModified(false)
    setSaveStatus(null)
    setError(null)

    fetch(`${API_URL}/api/saved-decks/${selectedDeckId}?user_id=${user.userId}`)
      .then(r => r.json())
      .then(data => {
        const cards = (data.cards || []).map(c => ({
          card_name: c.card_name,
          quantity: c.quantity,
          category: c.card_type || 'Other',
          role: ''
        }))
        setOriginalCards(cards)
        setCurrentCards(cards)
      })
      .catch(() => {})
  }, [selectedDeckId])

  // Scroll automatico ai nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  const handleSend = async () => {
    if (!message.trim()) return
    if (!selectedDeckId) { setError(tr.errorNoDecks); return }

    const userMsg = message.trim()
    setMessage('')
    setError(null)
    setLoading(true)

    // Aggiunge subito il messaggio utente alla history visiva
    const newHistory = [...history, { role: 'user', content: userMsg }]
    setHistory(newHistory)

    try {
      const res = await fetch(`${API_URL}/api/ai/boost-deck?language=${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          deck_id: selectedDeckId,
          message: userMsg,
          history: history,  // history PRIMA del nuovo messaggio
          current_deck: { cards: currentCards }
        })
      })
      const data = await res.json()

      if (!res.ok) {
        const detail = data.detail || ''
        setError(
          res.status === 429 ? tr.errorRateLimit :
          res.status === 403 ? tr.errorTokens :
          detail === 'DEMO_RATE_LIMIT' ? tr.errorDemoLimit :
          tr.errorGeneric
        )
        // Rimuove il messaggio utente dalla history se c'è stato errore
        setHistory(history)
        setLoading(false)
        return
      }

      const assistantMsg = {
        role: 'assistant',
        content: data.assistant_message,
        deck_modified: data.deck_modified
      }
      setHistory([...newHistory, assistantMsg])
      setTokens(data.tokens_remaining)
      if (user) user.tokens = data.tokens_remaining

      if (data.deck_modified && data.updated_deck?.cards) {
        setCurrentCards(data.updated_deck.cards)
        setDeckModified(true)
        setSaveStatus(null)
      }
    } catch {
      setError(tr.errorGeneric)
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
    setCurrentCards(originalCards)
    setDeckModified(false)
    setSaveStatus(null)
    setHistory([])
  }

  const handleSave = async (asNew = false) => {
    if (!selectedDeck) return
    setSaving(true)
    setSaveStatus(null)
    try {
      const cards = currentCards.map(c => ({
        card_name: c.card_name,
        quantity: c.quantity,
        card_type: c.category || null,
      }))

      if (asNew) {
        // Crea nuovo mazzo
        const res = await fetch(`${API_URL}/api/saved-decks/create?user_id=${user.userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${selectedDeck.name} (Boosted)`,
            description: selectedDeck.description || '',
            format: selectedDeck.format || null,
            colors: selectedDeck.colors || null,
            archetype: selectedDeck.archetype || null,
            source: 'ai_boost',
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
      } else {
        // Sovrascrive il mazzo esistente tramite endpoint /edit
        const res = await fetch(`${API_URL}/api/saved-decks/${selectedDeckId}/edit?user_id=${user.userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards })
        })
        if (res.ok) {
          setSaveStatus('saved')
          setOriginalCards(currentCards)
          setDeckModified(false)
        } else {
          setSaveStatus('error')
        }
      }
    } catch {
      setSaveStatus('error')
    }
    setSaving(false)
  }

  const totalCards = currentCards.reduce((s, c) => s + (c.quantity || 0), 0)

  return (
    <div className="ai-deck-boost">
      {/* Header */}
      <div className="abb-header">
        <button onClick={onBack} className="abb-back-btn">← {tr.back}</button>
        <div className="abb-header-content">
          <h1>{tr.title}</h1>
          <p className="abb-subtitle">{tr.subtitle}</p>
        </div>
        <div className="abb-token-badge">🪙 {tokens}</div>
      </div>

      {error && <div className="abb-error">⚠️ {error}</div>}

      <div className="abb-layout">
        {/* Pannello sinistro: mazzo corrente */}
        <div className="abb-deck-panel">
          <p className="abb-panel-title">🗂️ {language === 'it' ? 'Seleziona Mazzo' : 'Select Deck'}</p>
          <select
            className="abb-deck-select"
            value={selectedDeckId || ''}
            onChange={e => setSelectedDeckId(Number(e.target.value))}
          >
            {decks.length === 0
              ? <option value="">{tr.noDecks}</option>
              : decks.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))
            }
          </select>

          {selectedDeck && (
            <div className="abb-deck-info">
              <div className="abb-deck-info-name">{selectedDeck.name}</div>
              <div className="abb-deck-info-meta">
                {selectedDeck.format && <span>📋 {selectedDeck.format}</span>}
                {selectedDeck.colors && <span>🎨 {selectedDeck.colors}</span>}
              </div>
            </div>
          )}

          <p className="abb-panel-title">🃏 {tr.deckPanel}</p>
          <div className="abb-card-list">
            {currentCards.map((card, i) => (
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
          {currentCards.length > 0 && (
            <div className="abb-card-total">{totalCards} {tr.totalCards}</div>
          )}

          {/* Azioni */}
          <div className="abb-deck-actions">
            <button
              className={`abb-save-btn ${saveStatus === 'saved' ? 'saved' : saveStatus === 'error' ? 'error' : ''}`}
              onClick={() => handleSave(false)}
              disabled={saving || !deckModified}
            >
              {saving ? tr.saving : saveStatus === 'saved' ? tr.saved : saveStatus === 'error' ? tr.saveError : tr.saveBtn}
            </button>
            <button
              className="abb-save-btn"
              style={{ background: '#7c3aed' }}
              onClick={() => handleSave(true)}
              disabled={saving || !deckModified}
            >
              {tr.saveNew}
            </button>
            {deckModified && (
              <button className="abb-reset-btn" onClick={handleReset}>
                {tr.resetBtn}
              </button>
            )}
          </div>
        </div>

        {/* Pannello centrale: chat */}
        <div className="abb-chat-panel">
          <div className="abb-messages">
            {history.length === 0 && !loading && (
              <div className="abb-empty-chat">
                <div className="abb-empty-icon">⚡</div>
                <p>{tr.emptyChat}</p>
              </div>
            )}
            {history.map((msg, i) => (
              <div key={i} className={`abb-msg ${msg.role}`}>
                <div className="abb-msg-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div>
                  <div className="abb-msg-bubble">{msg.content}</div>
                  {msg.deck_modified && (
                    <span className="abb-msg-modified-badge">{tr.modified}</span>
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

          <div className="abb-cost-hint">{tr.costHint}</div>
          <div className="abb-input-area">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tr.placeholder}
              rows={2}
              disabled={loading || !selectedDeckId}
            />
            <button
              className="abb-send-btn"
              onClick={handleSend}
              disabled={loading || !message.trim() || !selectedDeckId}
            >
              {loading ? tr.sending : tr.sendBtn}
            </button>
          </div>
        </div>

        {/* Pannello destro: suggerimenti */}
        <div className="abb-suggestions-panel">
          <p className="abb-panel-title">{tr.suggestionsTitle}</p>
          {(SUGGESTIONS[language] || SUGGESTIONS.en).map((s, i) => (
            <button
              key={i}
              className="abb-suggestion-btn"
              onClick={() => setMessage(s.replace(/^[^\s]+ /, ''))}
              disabled={loading || !selectedDeckId}
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

export default AIDeckBoost
