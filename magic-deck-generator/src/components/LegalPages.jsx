import { useState, useEffect } from 'react'
import './LegalPages.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function LegalPages({ pageType, user, language = 'en', onBack }) {
  const [content, setContent] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [version, setVersion] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [userAcceptedVersion, setUserAcceptedVersion] = useState(null)

  const translations = {
    it: {
      privacyPolicy: 'Informativa Privacy',
      termsOfService: 'Termini di Servizio',
      lastUpdated: 'Ultimo aggiornamento',
      version: 'Versione',
      back: '← Indietro',
      updateAvailable: 'È disponibile una nuova versione',
      pleaseAccept: 'Si prega di accettare la versione aggiornata per continuare',
      accept: 'Accetto',
      cancel: 'Annulla',
      accepted: 'Accettato con successo',
      error: 'Si è verificato un errore'
    },
    en: {
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      lastUpdated: 'Last updated',
      version: 'Version',
      back: '← Back',
      updateAvailable: 'A new version is available',
      pleaseAccept: 'Please accept the updated version to continue',
      accept: 'I Accept',
      cancel: 'Cancel',
      accepted: 'Accepted successfully',
      error: 'An error occurred'
    }
  }

  const t = translations[language] || translations.en

  useEffect(() => {
    loadContent()
  }, [pageType])

  useEffect(() => {
    if (user && version && userAcceptedVersion !== version) {
      checkForUpdates()
    }
  }, [user, version, userAcceptedVersion])

  const loadContent = async () => {
    setLoading(true)
    try {
      const endpoint = pageType === 'privacy' 
        ? '/api/gdpr/privacy-policy' 
        : '/api/gdpr/terms-of-service'
      
      const res = await fetch(`${API_URL}${endpoint}`)
      
      if (!res.ok) {
        throw new Error('Failed to load content')
      }

      const data = await res.json()
      setContent(data.content)
      setLastUpdated(data.last_updated)
      setVersion(data.version)
      
      // Check if user has accepted this version
      if (user) {
        const acceptedVersion = pageType === 'privacy' 
          ? localStorage.getItem('privacyPolicyVersion')
          : localStorage.getItem('termsVersion')
        setUserAcceptedVersion(acceptedVersion)
      }
    } catch (err) {
      console.error('Error loading legal content:', err)
      setContent('Error loading content. Please try again later.')
    }
    setLoading(false)
  }

  const checkForUpdates = () => {
    if (userAcceptedVersion && userAcceptedVersion !== version) {
      setShowAcceptDialog(true)
    }
  }

  const acceptPolicy = async () => {
    if (!user || !user.token) {
      // For non-authenticated users, just store in localStorage
      if (pageType === 'privacy') {
        localStorage.setItem('privacyPolicyVersion', version)
      } else {
        localStorage.setItem('termsVersion', version)
      }
      setUserAcceptedVersion(version)
      setShowAcceptDialog(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/gdpr/accept-policy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          policy_type: pageType,
          version: version
        })
      })

      if (!res.ok) {
        throw new Error('Failed to accept policy')
      }

      // Store in localStorage as well
      if (pageType === 'privacy') {
        localStorage.setItem('privacyPolicyVersion', version)
      } else {
        localStorage.setItem('termsVersion', version)
      }
      
      setUserAcceptedVersion(version)
      setShowAcceptDialog(false)
    } catch (err) {
      console.error('Error accepting policy:', err)
      alert(t.error)
    }
  }

  const renderMarkdown = (markdown) => {
    // Simple markdown rendering (for production, consider using a library like react-markdown)
    return markdown
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index}>{line.substring(2)}</h1>
        }
        if (line.startsWith('## ')) {
          return <h2 key={index}>{line.substring(3)}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={index}>{line.substring(4)}</h3>
        }
        
        // Lists
        if (line.startsWith('- ')) {
          return <li key={index}>{line.substring(2)}</li>
        }
        
        // Bold
        const boldRegex = /\*\*(.*?)\*\*/g
        if (boldRegex.test(line)) {
          const parts = line.split(boldRegex)
          return (
            <p key={index}>
              {parts.map((part, i) => 
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
              )}
            </p>
          )
        }
        
        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />
        }
        
        // Regular paragraphs
        return <p key={index}>{line}</p>
      })
  }

  if (loading) {
    return (
      <div className="legal-pages">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  const title = pageType === 'privacy' ? t.privacyPolicy : t.termsOfService

  return (
    <div className="legal-pages">
      <div className="legal-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            {t.back}
          </button>
        )}
        <h1>{title}</h1>
        <div className="legal-meta">
          <span className="legal-version">{t.version}: {version}</span>
          <span className="legal-date">
            {t.lastUpdated}: {new Date(lastUpdated).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US')}
          </span>
        </div>
      </div>

      <div className="legal-content">
        {renderMarkdown(content)}
      </div>

      {showAcceptDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{t.updateAvailable}</h2>
            <p>{t.pleaseAccept}</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAcceptDialog(false)}>
                {t.cancel}
              </button>
              <button className="confirm-btn" onClick={acceptPolicy}>
                {t.accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LegalPages
