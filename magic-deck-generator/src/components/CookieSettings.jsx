import { useState, useEffect } from 'react'
import './CookieSettings.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.mtgdecksbuilder.com' 
  : 'http://localhost:8000'

function CookieSettings({ user, language = 'en', onBack }) {
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const translations = {
    it: {
      title: '🍪 Impostazioni Cookie',
      subtitle: 'Gestisci le tue preferenze sui cookie',
      essential: 'Cookie Essenziali',
      essentialDesc: 'Questi cookie sono necessari per il funzionamento del sito web e non possono essere disabilitati. Includono cookie per l\'autenticazione, la sicurezza e le preferenze di base.',
      essentialCookies: 'Cookie utilizzati: session_token, auth_token, csrf_token',
      analytics: 'Cookie Analitici',
      analyticsDesc: 'Questi cookie ci aiutano a capire come i visitatori interagiscono con il sito web raccogliendo e segnalando informazioni in modo anonimo.',
      analyticsCookies: 'Cookie utilizzati: _ga, _gid, _gat (Google Analytics)',
      marketing: 'Cookie Marketing',
      marketingDesc: 'Questi cookie vengono utilizzati per tracciare i visitatori attraverso i siti web. L\'intento è quello di visualizzare annunci pertinenti e coinvolgenti per il singolo utente.',
      marketingCookies: 'Cookie utilizzati: _fbp (Facebook Pixel), ads_id',
      enabled: 'Abilitato',
      disabled: 'Disabilitato',
      cannotDisable: 'Non può essere disabilitato',
      updated: 'Preferenze aggiornate con successo',
      error: 'Errore durante l\'aggiornamento',
      back: '← Indietro'
    },
    en: {
      title: '🍪 Cookie Settings',
      subtitle: 'Manage your cookie preferences',
      essential: 'Essential Cookies',
      essentialDesc: 'These cookies are necessary for the website to function and cannot be disabled. They include cookies for authentication, security, and basic preferences.',
      essentialCookies: 'Cookies used: session_token, auth_token, csrf_token',
      analytics: 'Analytics Cookies',
      analyticsDesc: 'These cookies help us understand how visitors interact with the website by collecting and reporting information anonymously.',
      analyticsCookies: 'Cookies used: _ga, _gid, _gat (Google Analytics)',
      marketing: 'Marketing Cookies',
      marketingDesc: 'These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.',
      marketingCookies: 'Cookies used: _fbp (Facebook Pixel), ads_id',
      enabled: 'Enabled',
      disabled: 'Disabled',
      cannotDisable: 'Cannot be disabled',
      updated: 'Preferences updated successfully',
      error: 'Error updating preferences',
      back: '← Back'
    }
  }

  const t = translations[language] || translations.en

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = () => {
    setLoading(true)
    try {
      const stored = localStorage.getItem('cookieConsent')
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences(parsed.consent)
      }
    } catch (err) {
      console.error('Error loading preferences:', err)
    }
    setLoading(false)
  }

  const updatePreference = async (category, value) => {
    if (category === 'essential') return // Cannot change essential cookies

    const newPreferences = {
      ...preferences,
      [category]: value
    }

    try {
      // Update localStorage
      const consentData = {
        consent: newPreferences,
        timestamp: new Date().toISOString(),
        bannerVersion: '1.0'
      }
      localStorage.setItem('cookieConsent', JSON.stringify(consentData))

      // Send to backend
      await fetch(`${API_URL}/api/gdpr/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          essential: newPreferences.essential,
          analytics: newPreferences.analytics,
          marketing: newPreferences.marketing,
          banner_version: '1.0'
        })
      })

      setPreferences(newPreferences)
      setMessage(t.updated)
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error updating preferences:', err)
      setMessage(t.error)
    }
  }

  if (loading) {
    return (
      <div className="cookie-settings">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="cookie-settings">
      <div className="cookie-settings-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            {t.back}
          </button>
        )}
        <h1>{t.title}</h1>
        <p className="subtitle">{t.subtitle}</p>
      </div>

      {message && (
        <div className={`settings-message ${message.includes('Error') || message.includes('Errore') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="cookie-categories-list">
        {/* Essential Cookies */}
        <div className="cookie-category-card">
          <div className="category-header">
            <div className="category-title-row">
              <h2>{t.essential}</h2>
              <div className="category-toggle">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.essential}
                    disabled={true}
                  />
                  <span className="toggle-slider disabled"></span>
                </label>
                <span className="toggle-label required">{t.cannotDisable}</span>
              </div>
            </div>
          </div>
          <p className="category-description">{t.essentialDesc}</p>
          <div className="cookie-list">
            <strong>Cookies:</strong>
            <p className="cookie-names">{t.essentialCookies}</p>
          </div>
        </div>

        {/* Analytics Cookies */}
        <div className="cookie-category-card">
          <div className="category-header">
            <div className="category-title-row">
              <h2>{t.analytics}</h2>
              <div className="category-toggle">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => updatePreference('analytics', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className={`toggle-label ${preferences.analytics ? 'enabled' : 'disabled'}`}>
                  {preferences.analytics ? t.enabled : t.disabled}
                </span>
              </div>
            </div>
          </div>
          <p className="category-description">{t.analyticsDesc}</p>
          <div className="cookie-list">
            <strong>Cookies:</strong>
            <p className="cookie-names">{t.analyticsCookies}</p>
          </div>
        </div>

        {/* Marketing Cookies */}
        <div className="cookie-category-card">
          <div className="category-header">
            <div className="category-title-row">
              <h2>{t.marketing}</h2>
              <div className="category-toggle">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => updatePreference('marketing', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className={`toggle-label ${preferences.marketing ? 'enabled' : 'disabled'}`}>
                  {preferences.marketing ? t.enabled : t.disabled}
                </span>
              </div>
            </div>
          </div>
          <p className="category-description">{t.marketingDesc}</p>
          <div className="cookie-list">
            <strong>Cookies:</strong>
            <p className="cookie-names">{t.marketingCookies}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieSettings
