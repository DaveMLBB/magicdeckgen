import { useState, useEffect } from 'react'
import './PrivacySettings.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.mtgdecksbuilder.com' 
  : 'http://localhost:8000'

function PrivacySettings({ user, language = 'en', onBack }) {
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false
  })
  const [loading, setLoading] = useState(true)
  const [exportStatus, setExportStatus] = useState('idle') // 'idle', 'generating', 'ready', 'error'
  const [deletionStatus, setDeletionStatus] = useState('idle') // 'idle', 'confirming', 'pending', 'error'
  const [message, setMessage] = useState('')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [consentHistory, setConsentHistory] = useState([])

  const translations = {
    it: {
      title: '🔒 Impostazioni Privacy',
      cookiePreferences: 'Preferenze Cookie',
      currentSettings: 'Impostazioni Attuali',
      essential: 'Cookie Essenziali',
      analytics: 'Cookie Analitici',
      marketing: 'Cookie Marketing',
      enabled: 'Abilitati',
      disabled: 'Disabilitati',
      updatePreferences: 'Aggiorna Preferenze',
      dataManagement: 'Gestione Dati',
      downloadData: 'Scarica i Miei Dati',
      downloadDataDesc: 'Scarica tutti i tuoi dati personali in formato JSON',
      deleteAccount: 'Elimina Account',
      deleteAccountDesc: 'Elimina permanentemente il tuo account e tutti i dati associati',
      consentHistory: 'Cronologia Consensi',
      lastUpdated: 'Ultimo aggiornamento',
      noHistory: 'Nessuna cronologia disponibile',
      generating: 'Generazione in corso...',
      downloadReady: 'Download pronto',
      confirmDeletion: 'Conferma Eliminazione',
      enterPassword: 'Inserisci la tua password per confermare',
      password: 'Password',
      cancel: 'Annulla',
      confirm: 'Conferma',
      deletionWarning: '⚠️ Questa azione è irreversibile. Tutti i tuoi dati saranno eliminati permanentemente dopo 7 giorni.',
      deletionScheduled: 'Eliminazione programmata. Controlla la tua email per il link di cancellazione.',
      preferencesUpdated: 'Preferenze aggiornate con successo',
      error: 'Si è verificato un errore',
      back: '← Indietro'
    },
    en: {
      title: '🔒 Privacy Settings',
      cookiePreferences: 'Cookie Preferences',
      currentSettings: 'Current Settings',
      essential: 'Essential Cookies',
      analytics: 'Analytics Cookies',
      marketing: 'Marketing Cookies',
      enabled: 'Enabled',
      disabled: 'Disabled',
      updatePreferences: 'Update Preferences',
      dataManagement: 'Data Management',
      downloadData: 'Download My Data',
      downloadDataDesc: 'Download all your personal data in JSON format',
      deleteAccount: 'Delete Account',
      deleteAccountDesc: 'Permanently delete your account and all associated data',
      consentHistory: 'Consent History',
      lastUpdated: 'Last updated',
      noHistory: 'No history available',
      generating: 'Generating...',
      downloadReady: 'Download ready',
      confirmDeletion: 'Confirm Deletion',
      enterPassword: 'Enter your password to confirm',
      password: 'Password',
      cancel: 'Cancel',
      confirm: 'Confirm',
      deletionWarning: '⚠️ This action is irreversible. All your data will be permanently deleted after 7 days.',
      deletionScheduled: 'Deletion scheduled. Check your email for the cancellation link.',
      preferencesUpdated: 'Preferences updated successfully',
      error: 'An error occurred',
      back: '← Back'
    }
  }

  const t = translations[language] || translations.en

  useEffect(() => {
    loadCurrentConsent()
  }, [user])

  const loadCurrentConsent = async () => {
    setLoading(true)
    try {
      // Load from localStorage first
      const stored = localStorage.getItem('cookieConsent')
      if (stored) {
        const parsed = JSON.parse(stored)
        setCookiePreferences(parsed.consent)
      }

      // Also fetch from backend if user is authenticated
      if (user && user.token) {
        const res = await fetch(`${API_URL}/api/gdpr/consent`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        })
        
        if (res.ok) {
          const data = await res.json()
          if (data.current_consent) {
            setCookiePreferences({
              essential: data.current_consent.essential,
              analytics: data.current_consent.analytics,
              marketing: data.current_consent.marketing
            })
          }
          if (data.history) {
            setConsentHistory(data.history)
          }
        }
      }
    } catch (err) {
      console.error('Error loading consent:', err)
    }
    setLoading(false)
  }

  const updateCookiePreferences = async (newPreferences) => {
    try {
      // Update localStorage
      const consentData = {
        consent: newPreferences,
        timestamp: new Date().toISOString(),
        bannerVersion: '1.0'
      }
      localStorage.setItem('cookieConsent', JSON.stringify(consentData))

      // Send to backend
      const headers = {
        'Content-Type': 'application/json'
      }
      if (user && user.token) {
        headers['Authorization'] = `Bearer ${user.token}`
      }

      const res = await fetch(`${API_URL}/api/gdpr/consent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          essential: newPreferences.essential,
          analytics: newPreferences.analytics,
          marketing: newPreferences.marketing,
          banner_version: '1.0'
        })
      })

      if (res.ok) {
        setCookiePreferences(newPreferences)
        setMessage(t.preferencesUpdated)
        setTimeout(() => setMessage(''), 3000)
        
        // Reload consent history
        loadCurrentConsent()
      } else {
        throw new Error('Failed to update preferences')
      }
    } catch (err) {
      console.error('Error updating preferences:', err)
      setMessage(t.error)
    }
  }

  const togglePreference = (category) => {
    if (category === 'essential') return // Cannot disable essential cookies
    
    const newPreferences = {
      ...cookiePreferences,
      [category]: !cookiePreferences[category]
    }
    updateCookiePreferences(newPreferences)
  }

  const requestDataExport = async () => {
    setExportStatus('generating')
    setMessage('')
    
    try {
      const res = await fetch(`${API_URL}/api/gdpr/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      if (!res.ok) {
        throw new Error('Export failed')
      }

      const data = await res.json()
      
      // Ensure the download URL is absolute
      const downloadUrl = data.download_url.startsWith('http') 
        ? data.download_url 
        : `${API_URL}${data.download_url}`
      
      // Download the file
      const downloadRes = await fetch(downloadUrl)
      
      // Check if response is valid
      if (!downloadRes.ok) {
        throw new Error(`Download failed: ${downloadRes.status}`)
      }
      
      const blob = await downloadRes.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user_data_${user.userId}_${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setExportStatus('ready')
      setMessage('✅ ' + t.downloadReady)
      setTimeout(() => {
        setExportStatus('idle')
        setMessage('')
      }, 3000)
    } catch (err) {
      console.error('Error exporting data:', err)
      setExportStatus('error')
      setMessage('❌ ' + t.error + ': ' + err.message)
    }
  }

  const requestAccountDeletion = () => {
    setShowPasswordDialog(true)
    setDeletionStatus('confirming')
  }

  const submitDeletion = async () => {
    if (!password) {
      setMessage('❌ ' + t.enterPassword)
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/gdpr/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: password,
          confirmation: 'DELETE MY ACCOUNT'
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'Deletion failed')
      }

      const data = await res.json()
      setDeletionStatus('pending')
      setShowPasswordDialog(false)
      setPassword('')
      setMessage('✅ ' + t.deletionScheduled)
    } catch (err) {
      console.error('Error deleting account:', err)
      setDeletionStatus('error')
      setMessage('❌ ' + err.message)
    }
  }

  const cancelDeletion = () => {
    setShowPasswordDialog(false)
    setDeletionStatus('idle')
    setPassword('')
  }

  if (loading) {
    return (
      <div className="privacy-settings">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="privacy-settings">
      <div className="privacy-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            {t.back}
          </button>
        )}
        <h1>{t.title}</h1>
      </div>

      {message && (
        <div className={`privacy-message ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <section className="privacy-section">
        <h2>{t.cookiePreferences}</h2>
        <p className="section-subtitle">{t.currentSettings}</p>
        
        <div className="cookie-preferences-list">
          <div className="preference-item">
            <div className="preference-info">
              <h3>{t.essential}</h3>
              <span className={`preference-status ${cookiePreferences.essential ? 'enabled' : 'disabled'}`}>
                {cookiePreferences.essential ? t.enabled : t.disabled}
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={cookiePreferences.essential}
                disabled={true}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <h3>{t.analytics}</h3>
              <span className={`preference-status ${cookiePreferences.analytics ? 'enabled' : 'disabled'}`}>
                {cookiePreferences.analytics ? t.enabled : t.disabled}
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={cookiePreferences.analytics}
                onChange={() => togglePreference('analytics')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <h3>{t.marketing}</h3>
              <span className={`preference-status ${cookiePreferences.marketing ? 'enabled' : 'disabled'}`}>
                {cookiePreferences.marketing ? t.enabled : t.disabled}
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={cookiePreferences.marketing}
                onChange={() => togglePreference('marketing')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </section>

      <section className="privacy-section">
        <h2>{t.dataManagement}</h2>
        
        <div className="data-actions">
          <div className="data-action-card">
            <div className="data-action-icon">📥</div>
            <h3>{t.downloadData}</h3>
            <p>{t.downloadDataDesc}</p>
            <button 
              className="data-action-btn"
              onClick={requestDataExport}
              disabled={exportStatus === 'generating'}
            >
              {exportStatus === 'generating' ? (
                <>
                  <span className="spinner small"></span>
                  {t.generating}
                </>
              ) : (
                t.downloadData
              )}
            </button>
          </div>

          <div className="data-action-card danger">
            <div className="data-action-icon">🗑️</div>
            <h3>{t.deleteAccount}</h3>
            <p>{t.deleteAccountDesc}</p>
            <button 
              className="data-action-btn danger"
              onClick={requestAccountDeletion}
              disabled={deletionStatus === 'pending'}
            >
              {t.deleteAccount}
            </button>
          </div>
        </div>
      </section>

      {consentHistory.length > 0 && (
        <section className="privacy-section">
          <h2>{t.consentHistory}</h2>
          <div className="consent-history-list">
            {consentHistory.map((entry, index) => (
              <div key={index} className="consent-history-item">
                <div className="consent-date">
                  {new Date(entry.timestamp).toLocaleString(language === 'it' ? 'it-IT' : 'en-US')}
                </div>
                <div className="consent-details">
                  <span className={entry.analytics ? 'enabled' : 'disabled'}>
                    {t.analytics}: {entry.analytics ? '✓' : '✗'}
                  </span>
                  <span className={entry.marketing ? 'enabled' : 'disabled'}>
                    {t.marketing}: {entry.marketing ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showPasswordDialog && (
        <div className="modal-overlay" onClick={cancelDeletion}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t.confirmDeletion}</h2>
            <p className="deletion-warning">{t.deletionWarning}</p>
            <p>{t.enterPassword}</p>
            <input
              type="password"
              className="password-input"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitDeletion()}
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={cancelDeletion}>
                {t.cancel}
              </button>
              <button className="confirm-btn danger" onClick={submitDeletion}>
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PrivacySettings
