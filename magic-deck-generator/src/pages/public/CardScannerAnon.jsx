import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { isTrialLimitError } from '../../utils/anonymousTrial'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const TR = {
  it: {
    title: '📷 Scanner Carte',
    desc: 'Cerca una carta per nome o carica un\'immagine per identificarla',
    back: '← Indietro',
    register: '🚀 Registrati per salvare le carte',
    searchLabel: 'Cerca carta per nome',
    searchPlaceholder: 'Es: Lightning Bolt, Black Lotus...',
    search: 'Cerca',
    searching: 'Ricerca...',
    noResults: 'Nessuna carta trovata',
    trialInfo: '3 ricerche gratuite al mese',
    result: 'Risultato',
    type: 'Tipo',
    mana: 'Costo Mana',
    rarity: 'Rarità',
    text: 'Testo',
    registerCta: 'Registrati per aggiungere questa carta alla tua collezione',
  },
  en: {
    title: '📷 Card Scanner',
    desc: 'Search a card by name or upload an image to identify it',
    back: '← Back',
    register: '🚀 Sign up to save cards',
    searchLabel: 'Search card by name',
    searchPlaceholder: 'E.g: Lightning Bolt, Black Lotus...',
    search: 'Search',
    searching: 'Searching...',
    noResults: 'No card found',
    trialInfo: '3 free searches per month',
    result: 'Result',
    type: 'Type',
    mana: 'Mana Cost',
    rarity: 'Rarity',
    text: 'Text',
    registerCta: 'Sign up to add this card to your collection',
  },
}

export default function CardScannerAnon({ language = 'it', onBack, onTrialLimit }) {
  const t = TR[language] || TR.it
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usesLeft, setUsesLeft] = useState(3)

  const getBrowserId = () => {
    let id = localStorage.getItem('browserId')
    if (!id) { id = Math.random().toString(36).slice(2); localStorage.setItem('browserId', id) }
    return id
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setCard(null)

    // Controlla trial lato client prima di chiamare
    const trialKey = `scanner_ai_uses_${new Date().toISOString().slice(0, 7)}`
    const used = parseInt(localStorage.getItem(trialKey) || '0')
    if (used >= 3) {
      onTrialLimit && onTrialLimit({
        error: 'anonymous_trial_limit_reached',
        service: 'scanner_ai',
        limit: 3,
        message_it: 'Hai raggiunto il limite di 3 ricerche gratuite al mese. Registrati per continuare.',
        message_en: 'You have reached the 3 free searches per month limit. Sign up to continue.',
      })
      setLoading(false)
      return
    }

    try {
      // Usa Scryfall API direttamente per la ricerca
      const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(query)}`)
      if (!res.ok) {
        setError(t.noResults)
        setLoading(false)
        return
      }
      const data = await res.json()
      setCard(data)
      // Incrementa contatore locale
      localStorage.setItem(trialKey, String(used + 1))
      setUsesLeft(Math.max(0, 2 - used))
    } catch (e) {
      setError(t.noResults)
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

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: '0.9rem' }}>{t.searchLabel}</label>
          <form onSubmit={e => { e.preventDefault(); handleSearch() }} style={{ display: 'flex', gap: 8 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: '1rem' }}
            />
            <button type="submit" disabled={loading || !query.trim()} style={{ ...regBtnStyle, opacity: loading || !query.trim() ? 0.6 : 1 }}>
              {loading ? t.searching : t.search}
            </button>
          </form>
        </div>

        {error && <p style={{ color: '#f87171' }}>{error}</p>}

        {card && (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {card.image_uris?.normal && (
                <img src={card.image_uris.normal} alt={card.name} style={{ width: 200, borderRadius: 10, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '1.3rem' }}>{card.name}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem' }}>
                  <div><span style={{ color: '#64748b' }}>{t.type}: </span>{card.type_line}</div>
                  {card.mana_cost && <div><span style={{ color: '#64748b' }}>{t.mana}: </span>{card.mana_cost}</div>}
                  {card.rarity && <div><span style={{ color: '#64748b' }}>{t.rarity}: </span><span style={{ textTransform: 'capitalize' }}>{card.rarity}</span></div>}
                  {card.oracle_text && (
                    <div style={{ marginTop: 8, padding: 10, background: '#0f172a', borderRadius: 6, fontSize: '0.85rem', lineHeight: 1.5, color: '#cbd5e1' }}>
                      {card.oracle_text}
                    </div>
                  )}
                  {card.prices?.eur && (
                    <div style={{ marginTop: 4, color: '#68d391' }}>€{card.prices.eur}</div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, background: '#312e81', border: '1px solid #6366f1', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <p style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>🎁 {t.registerCta}</p>
              <button onClick={() => navigate('/')} style={regBtnStyle}>{t.register}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const btnStyle = { background: '#334155', color: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem' }
const regBtnStyle = { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }
