import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isTrialLimitError, getTrialLimitMessage } from '../../utils/anonymousTrial'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const TR = {
  it: {
    title: '⚡ AI Deck Boost',
    desc: 'Migliora il tuo mazzo con l\'AI. Incolla la lista e chiedi modifiche.',
    back: '← Indietro',
    register: '🚀 Registrati per usare senza limiti',
    deckLabel: 'Incolla il tuo mazzo (formato: "4 Lightning Bolt")',
    deckPlaceholder: '4 Lightning Bolt\n4 Goblin Guide\n20 Mountain\n...',
    messageLabel: 'Cosa vuoi migliorare?',
    messagePlaceholder: 'Es: Rendi il mazzo più veloce, aggiungi più rimozioni...',
    send: 'Migliora con AI',
    sending: 'Analisi in corso...',
    trialInfo: '1 utilizzo gratuito al mese',
    result: 'Suggerimenti AI',
    errorShort: 'Scrivi almeno 10 caratteri',
    errorDeck: 'Incolla prima il tuo mazzo',
  },
  en: {
    title: '⚡ AI Deck Boost',
    desc: 'Improve your deck with AI. Paste your list and ask for changes.',
    back: '← Back',
    register: '🚀 Sign up for unlimited use',
    deckLabel: 'Paste your deck (format: "4 Lightning Bolt")',
    deckPlaceholder: '4 Lightning Bolt\n4 Goblin Guide\n20 Mountain\n...',
    messageLabel: 'What do you want to improve?',
    messagePlaceholder: 'E.g: Make the deck faster, add more removal...',
    send: 'Boost with AI',
    sending: 'Analyzing...',
    trialInfo: '1 free use per month',
    result: 'AI Suggestions',
    errorShort: 'Write at least 10 characters',
    errorDeck: 'Paste your deck first',
  },
}

function parseDeckToCards(text) {
  const cards = []
  text.split('\n').forEach(line => {
    const m = line.trim().match(/^(\d+)x?\s+(.+)$/)
    if (m) cards.push({ card_name: m[2].trim(), quantity: parseInt(m[1]), category: 'Other', role: '' })
  })
  return cards
}

export default function AIDeckBoostAnon({ language = 'it', onBack, onTrialLimit }) {
  const t = TR[language] || TR.it
  const navigate = useNavigate()
  const [deckText, setDeckText] = useState('')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!deckText.trim()) { setError(t.errorDeck); return }
    if (message.trim().length < 10) { setError(t.errorShort); return }
    setError('')
    setLoading(true)

    const browserId = localStorage.getItem('browserId') || (() => {
      const id = Math.random().toString(36).slice(2)
      localStorage.setItem('browserId', id)
      return id
    })()

    const cards = parseDeckToCards(deckText)

    try {
      const res = await fetch(`${API_URL}/api/ai-boost/boost-deck?language=${language}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Browser-ID': browserId },
        body: JSON.stringify({
          user_id: 0,
          deck_id: 0,
          message: message.trim(),
          history: [],
          current_deck: { cards },
        }),
      })

      if (res.status === 429) {
        const data = await res.json()
        if (isTrialLimitError(data)) {
          onTrialLimit && onTrialLimit(data.detail)
          setLoading(false)
          return
        }
      }

      if (res.status === 400) {
        // Boost richiede mazzo salvato — mostra messaggio registrazione
        setResult({ message: language === 'it'
          ? 'Per usare AI Deck Boost devi avere un mazzo salvato. Registrati gratuitamente per salvare i tuoi mazzi e usare questa funzione senza limiti!'
          : 'To use AI Deck Boost you need a saved deck. Sign up for free to save your decks and use this feature without limits!' })
        setLoading(false)
        return
      }

      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Error')
        setLoading(false)
        return
      }

      const data = await res.json()
      setResult(data)
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
        {!result ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: '0.9rem' }}>{t.deckLabel}</label>
              <textarea
                value={deckText}
                onChange={e => setDeckText(e.target.value)}
                placeholder={t.deckPlaceholder}
                rows={8}
                style={textareaStyle}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: '0.9rem' }}>{t.messageLabel}</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t.messagePlaceholder}
                rows={3}
                style={textareaStyle}
              />
            </div>
            {error && <p style={{ color: '#f87171', marginBottom: 12 }}>{error}</p>}
            <button onClick={handleSend} disabled={loading} style={{ ...regBtnStyle, opacity: loading ? 0.6 : 1 }}>
              {loading ? t.sending : t.send}
            </button>
          </>
        ) : (
          <>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '0.9rem' }}>{t.result}</h3>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{result.assistant_message || result.message}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => { setResult(null); setMessage('') }} style={btnStyle}>
                {language === 'it' ? '← Torna indietro' : '← Go back'}
              </button>
              <button onClick={() => navigate('/')} style={regBtnStyle}>{t.register}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const btnStyle = { background: '#334155', color: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem' }
const regBtnStyle = { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }
const textareaStyle = { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }
