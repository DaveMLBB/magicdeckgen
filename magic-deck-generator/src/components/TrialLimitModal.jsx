import './TrialLimitModal.css'

/**
 * Modal mostrato quando un utente anonimo ha esaurito il trial per un servizio.
 *
 * Props:
 *   message: string — messaggio localizzato dal backend
 *   language: 'it' | 'en'
 *   onClose: () => void
 *   onRegister: () => void — callback per aprire la pagina di registrazione
 */
function TrialLimitModal({ message, language = 'it', onClose, onRegister }) {
  const t = language === 'it' ? {
    title: '🔒 Prova Gratuita Esaurita',
    cta: '🚀 Registrati Gratis',
    dismiss: 'Chiudi',
    benefits: [
      '✅ Accesso illimitato a tutti gli strumenti AI',
      '✅ 100 token gratuiti al signup',
      '✅ Salva mazzi e collezioni',
      '✅ Nessuna carta di credito richiesta',
    ],
  } : {
    title: '🔒 Free Trial Exhausted',
    cta: '🚀 Sign Up Free',
    dismiss: 'Close',
    benefits: [
      '✅ Unlimited access to all AI tools',
      '✅ 100 free tokens on signup',
      '✅ Save decks and collections',
      '✅ No credit card required',
    ],
  }

  return (
    <div className="trial-modal-overlay" onClick={onClose}>
      <div className="trial-modal" onClick={(e) => e.stopPropagation()}>
        <button className="trial-modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="trial-modal-icon">🃏</div>
        <h2 className="trial-modal-title">{t.title}</h2>
        <p className="trial-modal-message">{message}</p>

        <ul className="trial-modal-benefits">
          {t.benefits.map((b, i) => <li key={i}>{b}</li>)}
        </ul>

        <button className="trial-modal-cta" onClick={onRegister}>
          {t.cta}
        </button>
        <button className="trial-modal-dismiss" onClick={onClose}>
          {t.dismiss}
        </button>
      </div>
    </div>
  )
}

export default TrialLimitModal
