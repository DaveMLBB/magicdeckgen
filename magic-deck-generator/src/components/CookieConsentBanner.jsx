import { useState, useEffect } from 'react'
import './CookieConsentBanner.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.mtgdecksbuilder.com' 
  : 'http://localhost:8000'

const BANNER_VERSION = '1.0'
const CONSENT_EXPIRY_MONTHS = 12

function CookieConsentBanner({ onConsentChange, onPrivacyClick, language = 'en' }) {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consent, setConsent] = useState({
    essential: true,
    analytics: false,
    marketing: false
  })

  const translations = {
    it: {
      title: '🍪 Gestione Cookie',
      description: 'Utilizziamo i cookie per migliorare la tua esperienza. Puoi scegliere quali categorie di cookie accettare.',
      essential: 'Cookie Essenziali',
      essentialDesc: 'Necessari per il funzionamento del sito (autenticazione, sicurezza)',
      analytics: 'Cookie Analitici',
      analyticsDesc: 'Ci aiutano a capire come utilizzi il sito per migliorarlo',
      marketing: 'Cookie Marketing',
      marketingDesc: 'Utilizzati per mostrarti contenuti pubblicitari pertinenti',
      acceptAll: 'Accetta Tutti',
      rejectNonEssential: 'Solo Essenziali',
      customize: 'Personalizza',
      savePreferences: 'Salva Preferenze',
      privacyPolicy: 'Informativa Privacy',
      required: '(Obbligatori)',
      showDetails: 'Mostra Dettagli',
      hideDetails: 'Nascondi Dettagli'
    },
    en: {
      title: '🍪 Cookie Management',
      description: 'We use cookies to improve your experience. You can choose which cookie categories to accept.',
      essential: 'Essential Cookies',
      essentialDesc: 'Required for the site to function (authentication, security)',
      analytics: 'Analytics Cookies',
      analyticsDesc: 'Help us understand how you use the site to improve it',
      marketing: 'Marketing Cookies',
      marketingDesc: 'Used to show you relevant advertising content',
      acceptAll: 'Accept All',
      rejectNonEssential: 'Essential Only',
      customize: 'Customize',
      savePreferences: 'Save Preferences',
      privacyPolicy: 'Privacy Policy',
      required: '(Required)',
      showDetails: 'Show Details',
      hideDetails: 'Hide Details'
    }
  }

  const t = translations[language] || translations.en

  useEffect(() => {
    loadStoredConsent()
  }, [])

  const loadStoredConsent = () => {
    try {
      const stored = localStorage.getItem('cookieConsent')
      if (stored) {
        const parsed = JSON.parse(stored)
        const expiryDate = new Date(parsed.timestamp)
        expiryDate.setMonth(expiryDate.getMonth() + CONSENT_EXPIRY_MONTHS)
        
        // Check if consent has expired
        if (new Date() < expiryDate) {
          setConsent(parsed.consent)
          setShowBanner(false)
          return
        }
      }
    } catch (err) {
      console.error('Error loading stored consent:', err)
    }
    
    // No valid consent found, show banner
    setShowBanner(true)
  }

  const saveConsent = async (consentDecision) => {
    const timestamp = new Date().toISOString()
    
    // Store in localStorage
    const consentData = {
      consent: consentDecision,
      timestamp,
      bannerVersion: BANNER_VERSION
    }
    localStorage.setItem('cookieConsent', JSON.stringify(consentData))
    
    // Send to backend for audit logging
    try {
      // Get user token if logged in
      const userData = localStorage.getItem('user')
      const headers = {
        'Content-Type': 'application/json'
      }
      if (userData) {
        try {
          const user = JSON.parse(userData)
          if (user.token) {
            headers['Authorization'] = `Bearer ${user.token}`
          }
        } catch (e) {
          // Invalid user data, continue without token
        }
      }

      await fetch(`${API_URL}/api/gdpr/consent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          essential: consentDecision.essential,
          analytics: consentDecision.analytics,
          marketing: consentDecision.marketing,
          banner_version: BANNER_VERSION
        })
      })
    } catch (err) {
      console.error('Error logging consent:', err)
      // Continue even if backend logging fails
    }
    
    // Hide banner
    setShowBanner(false)
    
    // Notify parent component
    if (onConsentChange) {
      onConsentChange(consentDecision)
    }
    
    // Enable/disable cookie categories based on consent
    applyCookieSettings(consentDecision)
  }

  const applyCookieSettings = (consentDecision) => {
    // Essential cookies are always enabled
    // Analytics cookies
    if (consentDecision.analytics) {
      // Enable analytics (e.g., Google Analytics)
      console.log('Analytics cookies enabled')
    } else {
      // Disable analytics
      console.log('Analytics cookies disabled')
    }
    
    // Marketing cookies
    if (consentDecision.marketing) {
      // Enable marketing cookies
      console.log('Marketing cookies enabled')
    } else {
      // Disable marketing cookies
      console.log('Marketing cookies disabled')
    }
  }

  const acceptAll = () => {
    const allConsent = {
      essential: true,
      analytics: true,
      marketing: true
    }
    saveConsent(allConsent)
  }

  const rejectNonEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false
    }
    saveConsent(essentialOnly)
  }

  const saveCustomPreferences = () => {
    saveConsent(consent)
  }

  const toggleConsent = (category) => {
    if (category === 'essential') return // Cannot disable essential cookies
    
    setConsent(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="cookie-consent-overlay">
      <div className="cookie-consent-banner">
        <div className="cookie-consent-header">
          <h3>{t.title}</h3>
          <p>{t.description}</p>
        </div>

        {!showDetails ? (
          <div className="cookie-consent-actions">
            <button 
              className="cookie-btn cookie-btn-secondary"
              onClick={() => setShowDetails(true)}
            >
              {t.customize}
            </button>
            <button 
              className="cookie-btn cookie-btn-secondary"
              onClick={rejectNonEssential}
            >
              {t.rejectNonEssential}
            </button>
            <button 
              className="cookie-btn cookie-btn-primary"
              onClick={acceptAll}
            >
              {t.acceptAll}
            </button>
          </div>
        ) : (
          <>
            <div className="cookie-categories">
              <div className="cookie-category">
                <div className="cookie-category-header">
                  <label className="cookie-checkbox-label">
                    <input
                      type="checkbox"
                      checked={consent.essential}
                      disabled={true}
                    />
                    <span className="cookie-category-name">
                      {t.essential} <span className="required-badge">{t.required}</span>
                    </span>
                  </label>
                </div>
                <p className="cookie-category-desc">{t.essentialDesc}</p>
              </div>

              <div className="cookie-category">
                <div className="cookie-category-header">
                  <label className="cookie-checkbox-label">
                    <input
                      type="checkbox"
                      checked={consent.analytics}
                      onChange={() => toggleConsent('analytics')}
                    />
                    <span className="cookie-category-name">{t.analytics}</span>
                  </label>
                </div>
                <p className="cookie-category-desc">{t.analyticsDesc}</p>
              </div>

              <div className="cookie-category">
                <div className="cookie-category-header">
                  <label className="cookie-checkbox-label">
                    <input
                      type="checkbox"
                      checked={consent.marketing}
                      onChange={() => toggleConsent('marketing')}
                    />
                    <span className="cookie-category-name">{t.marketing}</span>
                  </label>
                </div>
                <p className="cookie-category-desc">{t.marketingDesc}</p>
              </div>
            </div>

            <div className="cookie-consent-actions">
              <button 
                className="cookie-btn cookie-btn-secondary"
                onClick={() => setShowDetails(false)}
              >
                {t.hideDetails}
              </button>
              <button 
                className="cookie-btn cookie-btn-primary"
                onClick={saveCustomPreferences}
              >
                {t.savePreferences}
              </button>
            </div>
          </>
        )}

        <div className="cookie-consent-footer">
          <button 
            onClick={() => {
              if (onPrivacyClick) {
                onPrivacyClick()
              }
            }}
            className="privacy-link"
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: 0,
              color: '#667eea',
              textDecoration: 'none',
              fontSize: '0.95rem'
            }}
          >
            {t.privacyPolicy}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsentBanner
