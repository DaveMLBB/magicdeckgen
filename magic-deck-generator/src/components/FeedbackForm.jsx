import { useState } from 'react'
import './FeedbackForm.css'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const FEATURES = {
  it: ['Generale', 'AI Deck Builder', 'AI Synergy', 'AI Gemelli', 'AI Analyzer', 'Confronto Mazzi', 'Collezioni', 'Database Carte', 'Mazzi Salvati'],
  en: ['General', 'AI Deck Builder', 'AI Synergy', 'AI Twins', 'AI Analyzer', 'Deck Matching', 'Collections', 'Card Database', 'Saved Decks'],
}

const TR = {
  it: {
    title: '💬 Lascia un Feedback',
    subtitle: 'Aiutaci a migliorare — la tua opinione conta!',
    ratingLabel: 'Valutazione (opzionale)',
    featureLabel: 'Funzionalità (opzionale)',
    featurePlaceholder: 'Seleziona una funzionalità...',
    messageLabel: 'Il tuo messaggio',
    messagePlaceholder: 'Scrivi qui la tua esperienza, suggerimento o segnalazione...',
    submit: 'Invia Feedback',
    submitting: 'Invio in corso...',
    success: '✅ Grazie per il tuo feedback!',
    errorShort: 'Il messaggio è troppo corto (minimo 5 caratteri).',
    errorGeneric: 'Errore durante l\'invio. Riprova.',
  },
  en: {
    title: '💬 Leave Feedback',
    subtitle: 'Help us improve — your opinion matters!',
    ratingLabel: 'Rating (optional)',
    featureLabel: 'Feature (optional)',
    featurePlaceholder: 'Select a feature...',
    messageLabel: 'Your message',
    messagePlaceholder: 'Write your experience, suggestion, or report here...',
    submit: 'Send Feedback',
    submitting: 'Sending...',
    success: '✅ Thank you for your feedback!',
    errorShort: 'Message is too short (minimum 5 characters).',
    errorGeneric: 'Error sending feedback. Please try again.',
  },
}

export default function FeedbackForm({ user, language = 'it' }) {
  const t = TR[language] || TR.it
  const features = FEATURES[language] || FEATURES.it

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feature, setFeature] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // null | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (message.trim().length < 5) { setStatus('error'); setErrorMsg(t.errorShort); return }
    setLoading(true); setStatus(null); setErrorMsg('')
    try {
      const res = await fetch(`${API_URL}/api/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.userId || null,
          rating: rating || null,
          message: message.trim(),
          feature: feature || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.detail || t.errorGeneric)
        setStatus('error')
      } else {
        setStatus('success')
        setRating(0); setFeature(''); setMessage('')
      }
    } catch {
      setErrorMsg(t.errorGeneric)
      setStatus('error')
    }
    setLoading(false)
  }

  return (
    <div className="feedback-form-wrap">
      <div className="feedback-form-header">
        <h3>{t.title}</h3>
        <p>{t.subtitle}</p>
      </div>

      {status === 'success' ? (
        <div className="feedback-success">{t.success}</div>
      ) : (
        <form className="feedback-form" onSubmit={handleSubmit}>
          {/* Stars */}
          <div className="feedback-row">
            <label className="feedback-label">{t.ratingLabel}</label>
            <div className="feedback-stars">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  className={`feedback-star ${n <= (hoverRating || rating) ? 'active' : ''}`}
                  onClick={() => setRating(n === rating ? 0 : n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                >★</button>
              ))}
            </div>
          </div>

          {/* Feature selector */}
          <div className="feedback-row">
            <label className="feedback-label">{t.featureLabel}</label>
            <select
              className="feedback-select"
              value={feature}
              onChange={e => setFeature(e.target.value)}
            >
              <option value="">{t.featurePlaceholder}</option>
              {features.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Message */}
          <div className="feedback-row">
            <label className="feedback-label">{t.messageLabel}</label>
            <textarea
              className="feedback-textarea"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t.messagePlaceholder}
              rows={3}
              maxLength={2000}
            />
            <span className="feedback-char-count">{message.length}/2000</span>
          </div>

          {status === 'error' && <p className="feedback-error">{errorMsg}</p>}

          <button
            type="submit"
            className="feedback-submit"
            disabled={loading || message.trim().length < 5}
          >
            {loading ? t.submitting : t.submit}
          </button>
        </form>
      )}
    </div>
  )
}
