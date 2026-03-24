import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isTrialLimitError } from '../../utils/anonymousTrial'

const API_URL = import.meta.env.PROD
  ? 'https://api.mtgdecksbuilder.com'
  : 'http://localhost:8000'

const TR = {
  it: {
    title: '🏆 Tournament Deck Builder',
    desc: 'Trova i mazzi torneo che puoi costruire con le carte che possiedi',
    back: '← Indietro',
    register: '🚀 Registrati per salvare la tua collezione',
    deckListLabel: 'Incolla la tua lista carte (formato: "4 Lightning Bolt")',
    deckListPlaceholder: '4 Lightning Bolt\n4 Goblin Guide\n20 Mountain\n...',
    format: 'Formato (opzionale)',
    search: 'Cerca Mazzi Compatibili',
    searching: 'Ricerca in corso...',
    noResults: 'Nessun mazzo trovato. Prova con più carte o un formato diverso.',
    match: 'compatibilità',
    missing: 'mancanti',
    cards: 'carte',
    trialInfo: '5 utilizzi gratuiti al mese',
    limitReached: 'Hai raggiunto il limite di 5 utilizzi mensili. Registrati per continuare.',
  },
  en: {
    title: '🏆 Tournament Deck Builder',
    desc: 'Find tournament decks you can build with the cards you own',
    back: '← Back',
    register: '🚀 Sign up to save your collection',
    deckListLabel: 'Paste your card list (format: "4 Lightning Bolt")',
    deckListPlaceholder: '4 Lightning Bolt\n4 Goblin Guide\n20 Mountain\n...',
    format: 'Format (optional)',
    search: 'Find Compatible Decks',
    searching: 'Searching...',
    noResults: 'No decks found. Try with more cards or a different format.',
    match: 'match',
    missing: 'missing',
    cards: 'cards',
    trialInfo: '5 free uses per month',
    limitReached: 'You have reached the 5 monthly uses limit. Sign up to continue.',
  },
}

const FORMATS = ['standard', 'modern', 'legacy', 'vintage', 'commander', 'pioneer', 'pauper']

export default function TournamentDeckBuilderAnon({ language = 'it', onBack, onTrialLimit }) {
  const t = TR[language] || TR.it
  const navigate = useNavigate()
  const [deckText, setDeckText] = useState('')
  const [format, setFormat] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const parseCards = (text) => {
    const cards = {}
    text.split('\n').forEach(line => {
      const m = line.trim().match(/^(\d+)x?\s+(.+)$/)
      if (m) {
        const name = m[2].trim()
        cards[name] = (cards[name] || 0) + parseInt(m[1])
      }
    })
    return cards
  }

  const handleSearch = async () => {
    if (!deckText.trim()) return
    setLoading(true)
    setError('')
    setResults(null)

    const browserId = localStorage.getItem('browserId') || (() => {
      const id = Math.random().toString(36).slice(2)
      localStorage.setItem('browserId', id)
      return id
    })()

    try {
      // Usa user_id=0 per anonimi, passa le carte come query param
      const params = new URLSearchParams({ format: format || '' })
      const res = await fetch(`${API_URL}/api/decks/match/0?${params}`, {
        headers: { 'X-Browser-ID': browserId }
      })

      if (res.status === 429) {
        const data = await res.json()
        if (isTrialLimitError(data)) {
          onTrialLimit && onTrialLimit(data.detail)
          setLoading(false)
          return
        }
      }

      if (!res.ok) {
        setError(language === 'it' ? 'Errore nella ricerca' : 'Search error')
        setLoading(false)
        return
      }

      const data = await res.json()
      // Filtra lato client in base alle carte incollate
      const ownedCards = parseCards(deckText)
      const filtered = (data.decks || []).filter(d => {
        // Calcola match con le carte incollate
        let owned = 0, total = 0
        ;(d.deck_list || []).forEach(c => {
          total += c.quantity_needed
          const have = ownedCards[c.name] || 0
          owned += Math.min(have, c.quantity_needed)
        })
        d._local_match = total > 0 ? Math.round(owned / total * 100) : 0
        return d._local_match > 0
      }).sort((a, b) => b._local_match - a._local_match)

      setResults(filtered.slice(0, 20))
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: '0 0 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', background: '#1e293b', borderBottom: '1px solid #334155', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={btnStyle}>{t.back}</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{t.title}</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>{t.desc}</p>
        </div>
        <button onClick={() => navigate('/')} style={regBtnStyle}>{t.register}</button>
      </div>

      <div style={{ background: '#f59e0b18', borderBottom: '1px solid #f59e0b33', color: '#f59e0b', textAlign: 'center', padding: '8px 16px', fontSize: '0.85rem' }}>
        ⏱ {t.trialInfo}
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: '0.9rem' }}>{t.deckListLabel}</label>
          <textarea
            value={deckText}
            onChange={e => setDeckText(e.target.value)}
            placeholder={t.deckListPlaceholder}
            rows={10}
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select
            value={format}
            onChange={e => setFormat(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: '0.9rem' }}
          >
            <option value="">{t.format}</option>
            {FORMATS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
          </select>
          <button onClick={handleSearch} disabled={loading || !deckText.trim()} style={{ ...regBtnStyle, opacity: loading || !deckText.trim() ? 0.6 : 1 }}>
            {loading ? t.searching : t.search}
          </button>
        </div>

        {error && <p style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>}

        {results !== null && results.length === 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>{t.noResults}</p>
        )}

        {results && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map(deck => (
              <div key={deck.deck_template_id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{deck.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 4 }}>
                      {deck.format && <span style={{ marginRight: 8 }}>{deck.format.toUpperCase()}</span>}
                      {deck.colors && <span>{deck.colors}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: deck._local_match >= 80 ? '#68d391' : deck._local_match >= 50 ? '#f59e0b' : '#f87171' }}>
                      {deck._local_match}%
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{t.match}</div>
                  </div>
                </div>
                {deck.missing_cards_count > 0 && (
                  <div style={{ marginTop: 8, color: '#94a3b8', fontSize: '0.8rem' }}>
                    {deck.missing_cards_count} {t.missing} · {deck.total_cards} {t.cards}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const btnStyle = { background: '#334155', color: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem' }
const regBtnStyle = { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }
