import { useState, useEffect } from 'react'
import './AIDeckBuilder.css'
import CardPreviewModal from './CardPreviewModal'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const FORMATS = ['standard', 'pioneer', 'modern', 'legacy', 'vintage', 'commander', 'pauper', 'historic', 'explorer', 'brawl']
const BUDGETS = [
  { value: 'budget',     label: { it: 'Economico (<$50)',      en: 'Budget (<$50)'      } },
  { value: 'affordable', label: { it: 'Accessibile ($50-150)', en: 'Affordable ($50-150)' } },
  { value: 'any',        label: { it: 'Qualsiasi',             en: 'Any'                } },
  { value: 'expensive',  label: { it: 'Premium (>$400)',       en: 'Premium (>$400)'    } },
]
const COLOR_OPTIONS = [
  { code: 'W', symbol: '☀️', name: { it: 'Bianco', en: 'White' } },
  { code: 'U', symbol: '💧', name: { it: 'Blu',    en: 'Blue'  } },
  { code: 'B', symbol: '💀', name: { it: 'Nero',   en: 'Black' } },
  { code: 'R', symbol: '🔥', name: { it: 'Rosso',  en: 'Red'   } },
  { code: 'G', symbol: '🌲', name: { it: 'Verde',  en: 'Green' } },
]
const CATEGORY_ORDER = ['Creature', 'Spell', 'Enchantment', 'Artifact', 'Planeswalker', 'Land', 'Other']
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
    title: '🏗️ AI Deck Builder',
    subtitle: 'Descrivi il mazzo che vuoi costruire e l\'AI lo creerà per te',
    descLabel: 'Descrivi il tuo mazzo',
    descPlaceholder: 'Es: "Voglio un mazzo aggro rosso con molte creature a basso costo e burn spells per finire l\'avversario velocemente in Modern" oppure "Un mazzo Commander con Atraxa come comandante, focalizzato sui counter +1/+1 e proliferate"...',
    format: 'Formato',
    formatAny: 'Lascia decidere all\'AI',
    colors: 'Colori (opzionale)',
    budget: 'Budget',
    deckSize: 'Dimensione mazzo',
    buildBtn: 'Costruisci Mazzo (10 🪙)',
    building: 'L\'AI sta costruendo il mazzo...',
    buildingSub: 'Questo può richiedere 15-30 secondi',
    back: 'Indietro',
    saveBtn: '💾 Salva Mazzo',
    saving: 'Salvataggio...',
    saved: '✅ Mazzo Salvato!',
    saveError: 'Errore nel salvataggio',
    strategy: 'Strategia',
    keyCards: 'Carte Chiave',
    upgradePath: 'Come Migliorare',
    mainDeck: 'Mazzo Principale',
    sideboard: 'Sideboard',
    totalCards: 'carte totali',
    copyList: '📋 Copia Lista',
    copied: '✅ Copiato!',
    errorTokens: 'Token insufficienti. Acquista token per continuare.',
    errorShort: 'Descrizione troppo corta (minimo 10 caratteri)',
    errorGeneric: 'Errore durante la generazione. Riprova.',
    noResult: 'Inserisci una descrizione e clicca "Costruisci Mazzo"',
    exampleTitle: 'Esempi di descrizione:',
    budget_label: 'Budget stimato',
    archetype_label: 'Archetipo',
    format_label: 'Formato',
    colors_label: 'Colori',
    filterAll: 'Tutti',
    sortByCategory: 'Per categoria',
    sortByQuantity: 'Per quantità',
  },
  en: {
    title: '🏗️ AI Deck Builder',
    subtitle: 'Describe the deck you want to build and the AI will create it for you',
    descLabel: 'Describe your deck',
    descPlaceholder: 'E.g. "I want a red aggro deck with lots of low-cost creatures and burn spells to finish the opponent quickly in Modern" or "A Commander deck with Atraxa as commander, focused on +1/+1 counters and proliferate"...',
    format: 'Format',
    formatAny: 'Let AI decide',
    colors: 'Colors (optional)',
    budget: 'Budget',
    deckSize: 'Deck size',
    buildBtn: 'Build Deck (10 🪙)',
    building: 'AI is building your deck...',
    buildingSub: 'This may take 15-30 seconds',
    back: 'Back',
    saveBtn: '💾 Save Deck',
    saving: 'Saving...',
    saved: '✅ Deck Saved!',
    saveError: 'Error saving deck',
    strategy: 'Strategy',
    keyCards: 'Key Cards',
    upgradePath: 'How to Improve',
    mainDeck: 'Main Deck',
    sideboard: 'Sideboard',
    totalCards: 'total cards',
    copyList: '📋 Copy List',
    copied: '✅ Copied!',
    errorTokens: 'Insufficient tokens. Purchase tokens to continue.',
    errorShort: 'Description too short (minimum 10 characters)',
    errorGeneric: 'Error during generation. Please try again.',
    noResult: 'Enter a description and click "Build Deck"',
    exampleTitle: 'Description examples:',
    budget_label: 'Estimated budget',
    archetype_label: 'Archetype',
    format_label: 'Format',
    colors_label: 'Colors',
    filterAll: 'All',
    sortByCategory: 'By category',
    sortByQuantity: 'By quantity',
  }
}

const EXAMPLES = {
  it: [
    'Mazzo aggro rosso in Modern con creature a basso costo e burn spells',
    'Commander con Atraxa focalizzato su counter +1/+1 e proliferate',
    'Mazzo control blu-bianco in Standard con counterspell e board wipe',
    'Tribal Elfi verde in Legacy, molto veloce e aggressivo',
    'Mazzo combo Storm in Modern per vincere al turno 3-4',
  ],
  en: [
    'Red aggro deck in Modern with low-cost creatures and burn spells',
    'Atraxa Commander focused on +1/+1 counters and proliferate',
    'Blue-white control in Standard with counterspells and board wipes',
    'Green Elf tribal in Legacy, very fast and aggressive',
    'Storm combo deck in Modern to win on turn 3-4',
  ]
}

function CardRow({ card, onPreview }) {
  const color = CATEGORY_COLORS[card.category] || CATEGORY_COLORS.Other
  return (
    <div className="adb-card-row">
      <span className="adb-qty-badge">{card.quantity}x</span>
      <span className="adb-cat-dot" style={{ background: color }} title={card.category}></span>
      {onPreview ? (
        <button className="adb-card-name-btn" onClick={() => onPreview(card.card_name)}>
          {card.card_name}
        </button>
      ) : (
        <span className="adb-card-name">{card.card_name}</span>
      )}
      {card.role && <span className="adb-role-tag">{card.role}</span>}
    </div>
  )
}

function AIDeckBuilder({ user, onBack, language, onSaved }) {
  const tr = t[language] || t.en

  const [description, setDescription] = useState('')
  const [format, setFormat] = useState('')
  const [selectedColors, setSelectedColors] = useState([])
  const [budget, setBudget] = useState('any')
  const [deckSize, setDeckSize] = useState(60)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [tokens, setTokens] = useState(user?.tokens || 0)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saved' | 'error'
  const [copied, setCopied] = useState(false)
  const [previewCard, setPreviewCard] = useState(null)
  const [activeTab, setActiveTab] = useState('main') // 'main' | 'sideboard'
  const [filterCat, setFilterCat] = useState('all')
  const [sortMode, setSortMode] = useState('category')
  const [useCollection, setUseCollection] = useState(false)
  const [collections, setCollections] = useState([])
  const [selectedCollectionId, setSelectedCollectionId] = useState(null)

  useEffect(() => {
    if (!user?.userId) return
    fetch(`${API_URL}/api/collections/user/${user.userId}`)
      .then(r => r.json())
      .then(data => {
        const cols = data.collections || []
        setCollections(cols)
        if (cols.length > 0) setSelectedCollectionId(cols[0].id)
      })
      .catch(() => {})
  }, [user])

  const toggleColor = (code) => {
    setSelectedColors(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const handleBuild = async () => {
    if (description.trim().length < 10) { setError(tr.errorShort); return }
    setLoading(true); setError(null); setResult(null); setSaveStatus(null)
    try {
      const res = await fetch(`${API_URL}/api/ai/build-deck?language=${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          description: description.trim(),
          format: format || null,
          colors: selectedColors.length > 0 ? selectedColors.join('') : null,
          budget: budget || null,
          deck_size: deckSize,
          collection_id: useCollection && selectedCollectionId ? selectedCollectionId : null,
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(res.status === 403 ? tr.errorTokens : (data.detail || tr.errorGeneric))
        setLoading(false); return
      }
      setResult(data)
      setTokens(data.tokens_remaining)
      if (user) user.tokens = data.tokens_remaining
    } catch { setError(tr.errorGeneric) }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!result?.deck) return
    const deck = result.deck
    setSaving(true); setSaveStatus(null)
    try {
      const cards = (deck.cards || []).map(c => ({
        card_name: c.card_name,
        quantity: c.quantity,
        card_type: c.category || null,
      }))
      const res = await fetch(`${API_URL}/api/decks/create?user_id=${user.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deck.deck_name || 'AI Generated Deck',
          description: deck.deck_description || description,
          format: deck.format || format || null,
          colors: deck.colors || (selectedColors.join('') || null),
          archetype: deck.archetype || null,
          source: 'ai_builder',
          is_public: false,
          collection_ids: [],
          cards,
        })
      })
      if (res.ok) {
        setSaveStatus('saved')
        setTimeout(() => { if (onSaved) onSaved() }, 800)
      } else {
        const err = await res.json()
        console.error('Save error:', err)
        setSaveStatus('error')
      }
    } catch { setSaveStatus('error') }
    setSaving(false)
  }

  const copyList = () => {
    if (!result?.deck?.cards) return
    const main = result.deck.cards.map(c => `${c.quantity}x ${c.card_name}`).join('\n')
    const side = result.deck.sideboard?.length
      ? '\n\nSideboard:\n' + result.deck.sideboard.map(c => `${c.quantity}x ${c.card_name}`).join('\n')
      : ''
    navigator.clipboard.writeText(main + side).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const getFilteredCards = (cards) => {
    if (!cards) return []
    let list = filterCat === 'all' ? cards : cards.filter(c => c.category === filterCat)
    if (sortMode === 'category') {
      list = [...list].sort((a, b) => (CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)) || a.card_name.localeCompare(b.card_name))
    } else {
      list = [...list].sort((a, b) => b.quantity - a.quantity)
    }
    return list
  }

  const deck = result?.deck
  const mainCards = deck?.cards || []
  const sideCards = deck?.sideboard || []
  const totalMain = mainCards.reduce((s, c) => s + (c.quantity || 0), 0)
  const totalSide = sideCards.reduce((s, c) => s + (c.quantity || 0), 0)

  const categoryCounts = mainCards.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + c.quantity
    return acc
  }, {})

  return (
    <div className="ai-deck-builder">
      <div className="adb-header">
        <button onClick={onBack} className="adb-back-btn">← {tr.back}</button>
        <div className="adb-header-content">
          <h1>{tr.title}</h1>
          <p className="adb-subtitle">{tr.subtitle}</p>
        </div>
        <div className="adb-token-badge">🪙 {tokens}</div>
      </div>

      {error && <div className="adb-error">⚠️ {error}</div>}

      <div className="adb-layout">
        {/* LEFT — Input */}
        <div className="adb-input-panel">
          <div className="adb-section">
            <label className="adb-section-title">✍️ {tr.descLabel}</label>
            <textarea
              className="adb-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={tr.descPlaceholder}
              rows={6}
            />
            <div className="adb-char-count">{description.length} / 1000</div>
          </div>

          <div className="adb-section">
            <h2 className="adb-section-title">⚙️ {language === 'it' ? 'Opzioni' : 'Options'}</h2>
            <div className="adb-options-grid">
              <div className="adb-option-group">
                <label className="adb-label">{tr.format}</label>
                <select className="adb-select" value={format} onChange={e => {
                  setFormat(e.target.value)
                  if (e.target.value === 'commander' || e.target.value === 'brawl') setDeckSize(100)
                  else setDeckSize(60)
                }}>
                  <option value="">{tr.formatAny}</option>
                  {FORMATS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                </select>
              </div>
              <div className="adb-option-group">
                <label className="adb-label">{tr.budget}</label>
                <select className="adb-select" value={budget} onChange={e => setBudget(e.target.value)}>
                  {BUDGETS.map(b => <option key={b.value} value={b.value}>{b.label[language] || b.label.en}</option>)}
                </select>
              </div>
              <div className="adb-option-group">
                <label className="adb-label">{tr.deckSize}</label>
                <select className="adb-select" value={deckSize} onChange={e => setDeckSize(Number(e.target.value))}>
                  <option value={60}>60 {language === 'it' ? 'carte (Standard)' : 'cards (Standard)'}</option>
                  <option value={100}>100 {language === 'it' ? 'carte (Commander)' : 'cards (Commander)'}</option>
                </select>
              </div>
            </div>
            <div className="adb-option-group adb-colors-group">
              <label className="adb-label">{tr.colors}</label>
              <div className="adb-color-pills">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.code}
                    className={`adb-color-pill ${selectedColors.includes(c.code) ? 'active' : ''}`}
                    onClick={() => toggleColor(c.code)}
                    title={c.name[language] || c.name.en}
                  >
                    {c.symbol} {c.code}
                  </button>
                ))}
                {selectedColors.length > 0 && (
                  <button className="adb-color-clear" onClick={() => setSelectedColors([])}>✕</button>
                )}
              </div>
            </div>
          </div>

          {/* Collection filter */}
          {collections.length > 0 && (
            <div className="adb-collection-filter">
              <label className="adb-collection-check">
                <input
                  type="checkbox"
                  checked={useCollection}
                  onChange={e => setUseCollection(e.target.checked)}
                />
                <span>📚 {language === 'it' ? 'Usa solo carte dalla collezione' : 'Use only cards from collection'}</span>
              </label>
              {useCollection && (
                <select
                  className="adb-select adb-collection-select"
                  value={selectedCollectionId || ''}
                  onChange={e => setSelectedCollectionId(Number(e.target.value))}
                >
                  {collections.map(col => (
                    <option key={col.id} value={col.id}>
                      {col.name} ({col.total_cards} {language === 'it' ? 'carte' : 'cards'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            className="adb-build-btn"
            onClick={handleBuild}
            disabled={loading || description.trim().length < 10}
          >
            {loading
              ? <span className="adb-btn-loading"><span className="adb-spinner"></span>{tr.building}</span>
              : tr.buildBtn
            }
          </button>

          {/* Examples */}
          {!result && !loading && (
            <div className="adb-examples">
              <p className="adb-examples-title">{tr.exampleTitle}</p>
              {(EXAMPLES[language] || EXAMPLES.en).map((ex, i) => (
                <button key={i} className="adb-example-btn" onClick={() => setDescription(ex)}>
                  💡 {ex}
                </button>
              ))}
            </div>
          )}

          {/* Category breakdown */}
          {deck && (
            <div className="adb-breakdown">
              {CATEGORY_ORDER.filter(cat => categoryCounts[cat]).map(cat => (
                <div key={cat} className="adb-breakdown-row">
                  <span className="adb-breakdown-dot" style={{ background: CATEGORY_COLORS[cat] }}></span>
                  <span className="adb-breakdown-cat">{cat}</span>
                  <span className="adb-breakdown-count">{categoryCounts[cat]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Results */}
        <div className="adb-results-panel">
          {loading && (
            <div className="adb-loading-state">
              <div className="adb-loading-spinner"></div>
              <p>🏗️ {tr.building}</p>
              <p className="adb-loading-sub">{tr.buildingSub}</p>
            </div>
          )}

          {!loading && !result && (
            <div className="adb-empty-state">
              <div className="adb-empty-icon">🏗️</div>
              <p>{tr.noResult}</p>
            </div>
          )}

          {!loading && deck && (
            <div className="adb-result-content">
              {/* Deck header */}
              <div className="adb-deck-header">
                <div className="adb-deck-title-row">
                  <h2 className="adb-deck-name">{deck.deck_name}</h2>
                  <div className="adb-deck-actions">
                    <button className="adb-copy-btn" onClick={copyList}>{copied ? tr.copied : tr.copyList}</button>
                    <button
                      className={`adb-save-btn ${saveStatus === 'saved' ? 'saved' : saveStatus === 'error' ? 'error' : ''}`}
                      onClick={handleSave}
                      disabled={saving || saveStatus === 'saved'}
                    >
                      {saving ? tr.saving : saveStatus === 'saved' ? tr.saved : saveStatus === 'error' ? tr.saveError : tr.saveBtn}
                    </button>
                  </div>
                </div>
                <p className="adb-deck-desc">{deck.deck_description}</p>
                <div className="adb-deck-meta">
                  {deck.format && <span className="adb-meta-tag">📋 {deck.format}</span>}
                  {deck.archetype && <span className="adb-meta-tag">⚔️ {deck.archetype}</span>}
                  {deck.colors && <span className="adb-meta-tag">🎨 {deck.colors}</span>}
                  {deck.estimated_budget && <span className="adb-meta-tag">💰 {deck.estimated_budget}</span>}
                </div>
              </div>

              {/* Strategy */}
              {deck.strategy_notes && (
                <div className="adb-strategy-card">
                  <h3>🧠 {tr.strategy}</h3>
                  <p>{deck.strategy_notes}</p>
                </div>
              )}

              {/* Key cards */}
              {deck.key_cards?.length > 0 && (
                <div className="adb-key-cards">
                  <h3>⭐ {tr.keyCards}</h3>
                  <div className="adb-key-tags">
                    {deck.key_cards.map((name, i) => (
                      <button key={i} className="adb-key-tag adb-key-tag-btn" onClick={() => setPreviewCard(name)}>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs: main / sideboard */}
              <div className="adb-tabs">
                <button
                  className={`adb-tab ${activeTab === 'main' ? 'active' : ''}`}
                  onClick={() => setActiveTab('main')}
                >
                  {tr.mainDeck} ({totalMain} {tr.totalCards})
                </button>
                {sideCards.length > 0 && (
                  <button
                    className={`adb-tab ${activeTab === 'sideboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sideboard')}
                  >
                    {tr.sideboard} ({totalSide})
                  </button>
                )}
              </div>

              {/* Controls */}
              {activeTab === 'main' && (
                <div className="adb-controls-bar">
                  <div className="adb-filter-group">
                    <button className={`adb-filter-btn ${filterCat === 'all' ? 'active' : ''}`} onClick={() => setFilterCat('all')}>{tr.filterAll}</button>
                    {CATEGORY_ORDER.filter(cat => categoryCounts[cat]).map(cat => (
                      <button
                        key={cat}
                        className={`adb-filter-btn ${filterCat === cat ? 'active' : ''}`}
                        style={filterCat === cat ? { borderColor: CATEGORY_COLORS[cat], color: CATEGORY_COLORS[cat] } : {}}
                        onClick={() => setFilterCat(cat)}
                      >
                        <span className="adb-filter-dot" style={{ background: CATEGORY_COLORS[cat] }}></span>
                        {cat} ({categoryCounts[cat]})
                      </button>
                    ))}
                  </div>
                  <select className="adb-mini-select" value={sortMode} onChange={e => setSortMode(e.target.value)}>
                    <option value="category">{tr.sortByCategory}</option>
                    <option value="quantity">{tr.sortByQuantity}</option>
                  </select>
                </div>
              )}

              {/* Card list */}
              <div className="adb-card-list">
                {activeTab === 'main'
                  ? getFilteredCards(mainCards).map((card, i) => (
                      <CardRow key={i} card={card} onPreview={setPreviewCard} />
                    ))
                  : sideCards.map((card, i) => (
                      <CardRow key={i} card={card} onPreview={setPreviewCard} />
                    ))
                }
              </div>

              {/* Upgrade path */}
              {deck.upgrade_path && (
                <div className="adb-upgrade-card">
                  <h3>📈 {tr.upgradePath}</h3>
                  <p>{deck.upgrade_path}</p>
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

export default AIDeckBuilder
