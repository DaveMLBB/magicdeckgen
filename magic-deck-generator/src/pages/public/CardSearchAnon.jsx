import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const TR = {
  it: {
    title: '🔍 Cerca Carte',
    placeholder: 'Cerca per nome...',
    search: 'Cerca',
    loading: 'Caricamento...',
    noResults: 'Nessuna carta trovata',
    back: '← Indietro',
    register: '🚀 Registrati per aggiungere alle collezioni',
    page: 'Pagina',
    of: 'di',
    prev: 'Precedente',
    next: 'Successivo',
  },
  en: {
    title: '🔍 Card Search',
    placeholder: 'Search by name...',
    search: 'Search',
    loading: 'Loading...',
    noResults: 'No cards found',
    back: '← Back',
    register: '🚀 Sign up to add cards to collections',
    page: 'Page',
    of: 'of',
    prev: 'Previous',
    next: 'Next',
  },
}

export default function CardSearchAnon({ language = 'it', onBack }) {
  const t = TR[language] || TR.it
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const search = async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ language, page: p, page_size: 20 })
      if (query) params.append('query', query)
      const res = await fetch(`${API_URL}/api/mtg-cards/search?${params}`)
      const data = await res.json()
      setCards(data.cards || [])
      setTotalPages(data.pagination?.total_pages || 1)
      setPage(p)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { search(1) }, [])

  const handleSubmit = (e) => { e.preventDefault(); search(1) }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: '0 0 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', background: '#1e293b', borderBottom: '1px solid #334155', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={btnStyle}>{t.back}</button>
        <h1 style={{ margin: 0, fontSize: '1.4rem', flex: 1 }}>{t.title}</h1>
        <button onClick={() => navigate('/')} style={regBtnStyle}>{t.register}</button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.placeholder}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: '1rem' }}
          />
          <button type="submit" style={regBtnStyle}>{t.search}</button>
        </form>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>{t.loading}</p>
        ) : cards.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>{t.noResults}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {cards.map(card => (
              <div key={card.uuid} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{card.name}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{card.type}</div>
                {card.mana_cost && <div style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: 4 }}>{card.mana_cost}</div>}
                {card.rarity && <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2, textTransform: 'capitalize' }}>{card.rarity}</div>}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <button onClick={() => search(page - 1)} disabled={page <= 1} style={btnStyle}>{t.prev}</button>
            <span style={{ color: '#94a3b8' }}>{t.page} {page} {t.of} {totalPages}</span>
            <button onClick={() => search(page + 1)} disabled={page >= totalPages} style={btnStyle}>{t.next}</button>
          </div>
        )}
      </div>
    </div>
  )
}

const btnStyle = { background: '#334155', color: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem' }
const regBtnStyle = { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }
