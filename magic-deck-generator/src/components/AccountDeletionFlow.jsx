import { useState } from 'react'
import './AccountDeletionFlow.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.mtgdecksbuilder.com' 
  : 'http://localhost:8000'

function AccountDeletionFlow({ user, token, onDeletionInitiated, language = 'en' }) {
  const [step, setStep] = useState('confirm') // 'confirm', 'password', 'pending', 'complete'
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const translations = {
    it: {
      deleteAccount: 'Elimina Account',
      confirmTitle: 'Sei sicuro?',
      confirmMessage: 'Questa azione eliminerà permanentemente il tuo account e tutti i dati associati dopo un periodo di grazia di 7 giorni.',
      confirmWarning: '⚠️ Questa azione non può essere annullata dopo il periodo di grazia.',
      continue: 'Continua',
      cancel: 'Annulla',
      enterPassword: 'Inserisci Password',
      passwordMessage: 'Per confermare l\'eliminazione, inserisci la tua password:',
      password: 'Password',
      confirmDeletion: 'Conferma Eliminazione',
      deletionPending: 'Eliminazione Programmata',
      pendingMessage: 'La tua richiesta di eliminazione è stata programmata. Riceverai un\'email con un link per annullare l\'eliminazione entro 7 giorni.',
      pendingInfo: 'Se non annulli entro 7 giorni, il tuo account e tutti i dati saranno eliminati permanentemente.',
      understood: 'Ho Capito',
      error: 'Si è verificato un errore',
      invalidPassword: 'Password non valida'
    },
    en: {
      deleteAccount: 'Delete Account',
      confirmTitle: 'Are you sure?',
      confirmMessage: 'This action will permanently delete your account and all associated data after a 7-day grace period.',
      confirmWarning: '⚠️ This action cannot be undone after the grace period.',
      continue: 'Continue',
      cancel: 'Cancel',
      enterPassword: 'Enter Password',
      passwordMessage: 'To confirm deletion, enter your password:',
      password: 'Password',
      confirmDeletion: 'Confirm Deletion',
      deletionPending: 'Deletion Scheduled',
      pendingMessage: 'Your deletion request has been scheduled. You will receive an email with a link to cancel the deletion within 7 days.',
      pendingInfo: 'If you do not cancel within 7 days, your account and all data will be permanently deleted.',
      understood: 'I Understand',
      error: 'An error occurred',
      invalidPassword: 'Invalid password'
    }
  }

  const t = translations[language] || translations.en

  const confirmDeletion = () => {
    setStep('password')
    setError(null)
  }

  const submitDeletion = async () => {
    if (!password) {
      setError(t.invalidPassword)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/gdpr/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: password,
          confirmation: 'DELETE MY ACCOUNT'
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || t.error)
      }

      const data = await res.json()
      setStep('pending')
      setPassword('')
      
      if (onDeletionInitiated) {
        onDeletionInitiated(data)
      }
    } catch (err) {
      console.error('Error deleting account:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelDeletion = () => {
    setStep('confirm')
    setPassword('')
    setError(null)
  }

  const handleComplete = () => {
    setStep('confirm')
    setPassword('')
    setError(null)
  }

  return (
    <div className="account-deletion-flow">
      {step === 'confirm' && (
        <div className="deletion-step">
          <h2>{t.confirmTitle}</h2>
          <div className="deletion-warning-box">
            <p>{t.confirmMessage}</p>
            <p className="warning-text">{t.confirmWarning}</p>
          </div>
          <div className="deletion-actions">
            <button className="cancel-btn" onClick={cancelDeletion}>
              {t.cancel}
            </button>
            <button className="danger-btn" onClick={confirmDeletion}>
              {t.continue}
            </button>
          </div>
        </div>
      )}

      {step === 'password' && (
        <div className="deletion-step">
          <h2>{t.enterPassword}</h2>
          <p>{t.passwordMessage}</p>
          {error && <div className="error-message">{error}</div>}
          <input
            type="password"
            className="password-input"
            placeholder={t.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && submitDeletion()}
            disabled={loading}
          />
          <div className="deletion-actions">
            <button className="cancel-btn" onClick={cancelDeletion} disabled={loading}>
              {t.cancel}
            </button>
            <button 
              className="danger-btn" 
              onClick={submitDeletion}
              disabled={loading || !password}
            >
              {loading ? (
                <>
                  <span className="spinner small"></span>
                  {t.confirmDeletion}
                </>
              ) : (
                t.confirmDeletion
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'pending' && (
        <div className="deletion-step">
          <div className="success-icon">✓</div>
          <h2>{t.deletionPending}</h2>
          <div className="pending-info-box">
            <p>{t.pendingMessage}</p>
            <p>{t.pendingInfo}</p>
          </div>
          <button className="primary-btn" onClick={handleComplete}>
            {t.understood}
          </button>
        </div>
      )}
    </div>
  )
}

export default AccountDeletionFlow
