import { useState, useEffect } from 'react'
import './EmailPreferences.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function EmailPreferences({ user, language = 'en', onBack }) {
  const [marketingEnabled, setMarketingEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const translations = {
    it: {
      title: '📧 Preferenze Email',
      subtitle: 'Gestisci le tue preferenze di comunicazione via email',
      marketingEmails: 'Email Marketing',
      marketingDesc: 'Ricevi aggiornamenti su nuove funzionalità, offerte speciali e notizie sul prodotto',
      essentialEmails: 'Email Essenziali',
      essentialDesc: 'Email importanti come reset password, conferme di eliminazione account e notifiche di sicurezza',
      alwaysSent: 'Sempre inviate (non possono essere disabilitate)',
      enabled: 'Abilitato',
      disabled: 'Disabilitato',
      updated: 'Preferenze aggiornate con successo',
      error: 'Errore durante l\'aggiornamento',
      back: '← Indietro',
      unsubscribeNote: 'Puoi anche disiscriverti cliccando sul link "Annulla iscrizione" in fondo a qualsiasi email marketing.'
    },
    en: {
      title: '📧 Email Preferences',
      subtitle: 'Manage your email communication preferences',
      marketingEmails: 'Marketing Emails',
      marketingDesc: 'Receive updates about new features, special offers, and product news',
      essentialEmails: 'Essential Emails',
      essentialDesc: 'Important emails like password resets, account deletion confirmations, and security notifications',
      alwaysSent: 'Always sent (cannot be disabled)',
      enabled: 'Enabled',
      disabled: 'Disabled',
      updated: 'Preferences updated successfully',
      error: 'Error updating preferences',
      back: '← Back',
      unsubscribeNote: 'You can also unsubscribe by clicking the "Unsubscribe" link at the bottom of any marketing email.'
    }
  }

  const t = translations[language] || translations.en

  useEffect(() => {
    loadPreferences()
  }, [user])

  const loadPreferences = async () => {
    setLoading(true)
    try {
      // Load from user object or fetch from backend
      if (user && user.marketingEmailsEnabled !== undefined) {
        setMarketingEnabled(user.marketingEmailsEnabled)
      } else if (user && user.token) {
        // Fetch from backend
        const res = await fetch(`${API_URL}/api/users/${user.userId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          setMarketingEnabled(data.marketing_emails_enabled !== false)
        }
      }
    } catch (err) {
      console.error('Error loading email preferences:', err)
    }
    setLoading(false)
  }

  const updatePreference = async (enabled) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${user.userId}/email-preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          marketing_emails_enabled: enabled
        })
      })

      if (!res.ok) {
        throw new Error('Failed to update preferences')
      }

      setMarketingEnabled(enabled)
      setMessage(t.updated)
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error updating email preferences:', err)
      setMessage(t.error)
    }
  }

  if (loading) {
    return (
      <div className="email-preferences">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="email-preferences">
      <div className="email-preferences-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            {t.back}
          </button>
        )}
        <h1>{t.title}</h1>
        <p className="subtitle">{t.subtitle}</p>
      </div>

      {message && (
        <div className={`preferences-message ${message.includes('Error') || message.includes('Errore') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="email-categories-list">
        {/* Marketing Emails */}
        <div className="email-category-card">
          <div className="category-header">
            <div className="category-title-row">
              <h2>{t.marketingEmails}</h2>
              <div className="category-toggle">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={marketingEnabled}
                    onChange={(e) => updatePreference(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className={`toggle-label ${marketingEnabled ? 'enabled' : 'disabled'}`}>
                  {marketingEnabled ? t.enabled : t.disabled}
                </span>
              </div>
            </div>
          </div>
          <p className="category-description">{t.marketingDesc}</p>
          <div className="unsubscribe-note">
            <small>{t.unsubscribeNote}</small>
          </div>
        </div>

        {/* Essential Emails */}
        <div className="email-category-card essential">
          <div className="category-header">
            <div className="category-title-row">
              <h2>{t.essentialEmails}</h2>
              <div className="category-toggle">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                  />
                  <span className="toggle-slider disabled"></span>
                </label>
                <span className="toggle-label required">{t.alwaysSent}</span>
              </div>
            </div>
          </div>
          <p className="category-description">{t.essentialDesc}</p>
        </div>
      </div>
    </div>
  )
}

export default EmailPreferences
