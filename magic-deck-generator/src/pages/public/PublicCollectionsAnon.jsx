import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const TR = {
  it: {
    title: '📚 Collezioni Pubbliche',
    loading: 'Caricamento...',
    noCollections: 'Nessuna collezione pubblica disponibile',
    back: '← Indietro',
    register: '🚀 Registrati per creare la tua collezione',
    cards: 'carte',
    unique: 'uniche',
  },
  en: {
    title: '📚 Public Collections',
    loading: 'Loading...',
    noCollections: 'No public collections available',
    back: '← Back',
    register: '🚀 Sign up to create your own collection',
    cards: 'cards',
    unique: 'unique',
  },
}

export default function PublicCollectionsAnon({ language = 'it', onBack }) {
  const t = TR[language] || TR.it
  const navigate = useNavigate()
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Usa l'endpoint dei mazzi pubblici per mostrare le collezioni associate
    fetch(`${API_URL}/api/saved-decks/public/search?page_size=50`)
      .then(r => r.json())
      .then(d => {
        // Estrai collezioni uniche dai mazzi pubblici
        const seen = new Set()
        const cols = []
        ;(d.decks || []).forEach(deck => {
          if (deck.collection_names) {
            deck.collection_names.forEach(name => {
              if (!seen.has(name)) {
                seen.add(name)
                cols.push({ id: name, name })
              }
            })
          }
        })
        setCollections(cols)
      })
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
        ) : collections.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>{t.noCollections}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {collections.map(col => (
              <div key={col.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>📚 {col.name}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.8rem' }}>
                  {col.total_cards != null && (
                    <span style={{ background: '#334155', padding: '2px 8px', borderRadius: 12, color: '#94a3b8' }}>
                      {col.total_cards} {t.cards}
                    </span>
                  )}
                  {col.unique_cards != null && (
                    <span style={{ background: '#334155', padding: '2px 8px', borderRadius: 12, color: '#94a3b8' }}>
                      {col.unique_cards} {t.unique}
                    </span>
                  )}
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
