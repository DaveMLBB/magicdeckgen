import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.PROD
  ? 'https://api.mtgdecksbuilder.com'
  : 'http://localhost:8000'

const TR = {
  it: {
    title: '🃏 Mazzi Pubblici',
    loading: 'Caricamento...',
    noDecks: 'Nessun mazzo pubblico disponibile',
    back: '← Indietro',
    register: '🚀 Registrati per salvare i tuoi mazzi',
    cards: 'carte',
    format: 'Formato',
    colors: 'Colori',
  },
  en: {
    title: '🃏 Public Decks',
    loading: 'Loading...',
    noDecks: 'No public decks available',
    back: '← Back',
    register: '🚀 Sign up to save your own decks',
    cards: 'cards',
    format: 'Format',
    colors: 'Colors',
  },
}

export default function PublicDecksAnon({ language = 'it', onBack }) {
  const t = TR[language] || TR.it
  const navigate = useNavigate()
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/saved-decks/public/search?page_size=30`)
      .then(r => r.json())
      .then(d => setDecks(d.decks || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: '0 0 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', background: '#1e293b', borderBottom: '1px solid #334155', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={btnStyle}>{t.back}</button>
        <h1 style={{ margin: 0, fontSize: '1.4rem', flex: 1 }}>{t.title}</h1>
        <button onClick={() => navigate('/')} style={regBtnStyle}>{t.register}</button>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>{t.loading}</p>
        ) : decks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>{t.noDecks}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {decks.map(deck => (
              <div key={deck.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{deck.name}</div>
                {deck.description && <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 8 }}>{deck.description}</div>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.8rem' }}>
                  {deck.format && <span style={{ background: '#334155', padding: '2px 8px', borderRadius: 12, color: '#cbd5e1' }}>{deck.format.toUpperCase()}</span>}
                  {deck.colors && <span style={{ background: '#334155', padding: '2px 8px', borderRadius: 12, color: '#f59e0b' }}>{deck.colors}</span>}
                  <span style={{ background: '#334155', padding: '2px 8px', borderRadius: 12, color: '#94a3b8' }}>{deck.total_cards} {t.cards}</span>
                </div>
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
