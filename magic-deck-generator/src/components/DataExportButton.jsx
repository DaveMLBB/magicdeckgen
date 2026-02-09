import { useState } from 'react'
import './DataExportButton.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function DataExportButton({ token, onExportComplete, language = 'en' }) {
  const [status, setStatus] = useState('idle') // 'idle', 'generating', 'ready', 'error'
  const [message, setMessage] = useState('')

  const translations = {
    it: {
      downloadData: 'Scarica i Miei Dati',
      generating: 'Generazione in corso...',
      downloadReady: 'Download pronto',
      error: 'Errore durante l\'esportazione'
    },
    en: {
      downloadData: 'Download My Data',
      generating: 'Generating...',
      downloadReady: 'Download ready',
      error: 'Error during export'
    }
  }

  const t = translations[language] || translations.en

  const initiateExport = async () => {
    setStatus('generating')
    setMessage('')
    
    try {
      const res = await fetch(`${API_URL}/api/gdpr/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        throw new Error('Export failed')
      }

      const data = await res.json()
      
      // Download the file
      await downloadFile(data.download_url)
      
      setStatus('ready')
      setMessage(t.downloadReady)
      
      if (onExportComplete) {
        onExportComplete()
      }
      
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 3000)
    } catch (err) {
      console.error('Error exporting data:', err)
      setStatus('error')
      setMessage(t.error)
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 3000)
    }
  }

  const downloadFile = async (url) => {
    try {
      // Ensure the URL is absolute
      const downloadUrl = url.startsWith('http') ? url : `${API_URL}${url}`
      
      const res = await fetch(downloadUrl)
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', await res.text())
        throw new Error('Invalid response format')
      }
      
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `user_data_${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading file:', err)
      throw err
    }
  }

  return (
    <div className="data-export-button">
      <button 
        className={`export-btn ${status}`}
        onClick={initiateExport}
        disabled={status === 'generating'}
      >
        {status === 'generating' ? (
          <>
            <span className="spinner small"></span>
            {t.generating}
          </>
        ) : status === 'ready' ? (
          <>✓ {t.downloadReady}</>
        ) : status === 'error' ? (
          <>✗ {t.error}</>
        ) : (
          <>📥 {t.downloadData}</>
        )}
      </button>
      {message && <div className="export-message">{message}</div>}
    </div>
  )
}

export default DataExportButton
