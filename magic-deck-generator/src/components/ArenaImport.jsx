import { useState, useRef } from 'react'
import './ArenaImport.css'

const API_URL = import.meta.env.PROD
  ? 'https://api.mtgdecksbuilder.com'
  : 'http://localhost:8000'

const LOG_PATHS = {
  windows: '%APPDATA%\\LocalLow\\Wizards Of The Coast\\MTGA\\Player.log',
  mac: '~/Library/Logs/Wizards Of The Coast/MTGA/Player.log',
}

const STEPS_IT = [
  {
    icon: '🗑️',
    title: 'Cancella il vecchio log',
    desc: 'Vai alla cartella del log (vedi sotto) e cancella il file Player.log esistente.',
  },
  {
    icon: '🚀',
    title: 'Apri Magic Arena',
    desc: 'Avvia Magic: The Gathering Arena e aspetta che carichi completamente.',
  },
  {
    icon: '⚙️',
    title: 'Abilita i registri dettagliati',
    desc: 'Clicca sull\'icona del profilo (in alto a destra) → Impostazioni → "Registri dettagliati (richiede riavvio)" → Attiva.',
  },
  {
    icon: '🔄',
    title: 'Riavvia Arena',
    desc: 'Chiudi completamente Magic Arena e riaprilo.',
  },
  {
    icon: '🃏',
    title: 'Apri i tuoi mazzi',
    desc: 'Nel menu principale, clicca su "Mazzi" e scorri la lista. Questo fa sì che Arena scriva le carte dei tuoi mazzi nel log.',
  },
  {
    icon: '📁',
    title: 'Carica il file qui',
    desc: 'Ora torna su questa pagina e carica il file Player.log usando il pulsante qui sotto.',
  },
]

const STEPS_EN = [
  {
    icon: '🗑️',
    title: 'Delete the old log',
    desc: 'Go to the log folder (see below) and delete the existing Player.log file.',
  },
  {
    icon: '🚀',
    title: 'Open Magic Arena',
    desc: 'Launch Magic: The Gathering Arena and wait for it to fully load.',
  },
  {
    icon: '⚙️',
    title: 'Enable detailed logs',
    desc: 'Click the profile icon (top right) → Settings → "Detailed Logs (requires restart)" → Enable.',
  },
  {
    icon: '🔄',
    title: 'Restart Arena',
    desc: 'Fully close Magic Arena and relaunch it.',
  },
  {
    icon: '🃏',
    title: 'Open your Decks',
    desc: 'From the main menu, click "Decks" and scroll through the list. This causes Arena to write your deck cards to the log.',
  },
  {
    icon: '📁',
    title: 'Upload the file here',
    desc: 'Come back to this page and upload the Player.log file using the button below.',
  },
]

export default function ArenaImport({ user, language, onNavigate }) {
  const [step, setStep] = useState('instructions') // instructions | upload | success | error
  const [collectionName, setCollectionName] = useState(`Arena ${new Date().toLocaleDateString('it-IT')}`)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmedSteps, setConfirmedSteps] = useState(false)
  const fileInputRef = useRef(null)

  const it = language === 'it'
  const steps = it ? STEPS_IT : STEPS_EN

  const t = {
    title: it ? '📥 Importa Mazzi da Magic Arena' : '📥 Import Decks from Magic Arena',
    subtitle: it
      ? 'Importa le carte presenti nei tuoi mazzi di Magic Arena. Nota: il log di Arena contiene solo le carte nei mazzi costruiti, non l\'intera collezione.'
      : 'Import cards from your Magic Arena decks. Note: the Arena log only contains cards in your built decks, not your full collection.',
    whereTitle: it ? '📂 Dove si trova il file di log?' : '📂 Where is the log file?',
    windows: 'Windows',
    mac: 'macOS',
    copyBtn: it ? 'Copia percorso' : 'Copy path',
    copied: it ? 'Copiato!' : 'Copied!',
    stepsTitle: it ? '📋 Segui questi passi PRIMA di caricare il file' : '📋 Follow these steps BEFORE uploading the file',
    warningTitle: it ? '⚠️ Limitazione importante' : '⚠️ Important limitation',
    warningText: it
      ? 'Il Player.log di Arena contiene solo le carte presenti nei tuoi mazzi costruiti, NON l\'intera collezione. Per importare tutte le carte che possiedi, usa un file CSV/Excel.'
      : 'The Arena Player.log only contains cards in your built decks, NOT your full collection. To import all cards you own, use a CSV/Excel file instead.',
    confirmCheck: it
      ? 'Ho seguito tutti i passi sopra e il mio file di log è pronto'
      : 'I have followed all the steps above and my log file is ready',
    uploadSection: it ? '📤 Carica il file Player.log' : '📤 Upload Player.log file',
    collectionNameLabel: it ? 'Nome della collezione' : 'Collection name',
    selectFile: it ? 'Seleziona Player.log' : 'Select Player.log',
    fileSelected: it ? 'File selezionato:' : 'File selected:',
    uploadBtn: it ? '🚀 Importa Collezione' : '🚀 Import Collection',
    uploading: it ? 'Importazione in corso...' : 'Importing...',
    successTitle: it ? '✅ Importazione completata!' : '✅ Import completed!',
    successCards: it ? 'carte importate' : 'cards imported',
    successEnriched: it ? 'carte arricchite dal database' : 'cards enriched from database',
    successTokens: it ? 'token rimanenti' : 'tokens remaining',
    goToCollection: it ? '📚 Vai alla Collezione' : '📚 Go to Collection',
    importAnother: it ? '🔄 Importa un altro file' : '🔄 Import another file',
    errorTitle: it ? '❌ Errore nell\'importazione' : '❌ Import error',
    retry: it ? '🔄 Riprova' : '🔄 Retry',
    noFile: it ? 'Seleziona prima il file Player.log' : 'Please select the Player.log file first',
    mustConfirm: it ? 'Conferma di aver seguito i passi prima di procedere' : 'Please confirm you followed the steps before proceeding',
  }

  const [copied, setCopied] = useState(null)

  const copyPath = (path, key) => {
    navigator.clipboard.writeText(path).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) setFile(f)
  }

  const handleUpload = async () => {
    if (!file) { setErrorMsg(t.noFile); return }
    if (!confirmedSteps) { setErrorMsg(t.mustConfirm); return }

    setUploading(true)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(
        `${API_URL}/api/arena/import-log?user_id=${user.userId}&collection_name=${encodeURIComponent(collectionName)}`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.detail || (it ? 'Errore sconosciuto' : 'Unknown error'))
        setStep('error')
      } else {
        setResult(data)
        setStep('success')
      }
    } catch (err) {
      setErrorMsg(it ? 'Errore di rete. Controlla la connessione.' : 'Network error. Check your connection.')
      setStep('error')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setStep('instructions')
    setFile(null)
    setResult(null)
    setErrorMsg('')
    setConfirmedSteps(false)
    setCollectionName(`Arena ${new Date().toLocaleDateString('it-IT')}`)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="arena-import-page">
      <div className="arena-import-hero">
        <div className="arena-import-hero-inner">
          <h1 className="arena-import-title">{t.title}</h1>
          <p className="arena-import-subtitle">{t.subtitle}</p>
        </div>
      </div>

      <div className="arena-import-content">

        {/* SUCCESS */}
        {step === 'success' && result && (
          <div className="arena-result-card arena-result-success">
            <div className="arena-result-icon">✅</div>
            <h2>{t.successTitle}</h2>
            <div className="arena-result-stats">
              <div className="arena-stat">
                <span className="arena-stat-value">{result.cards_added}</span>
                <span className="arena-stat-label">{t.successCards}</span>
              </div>
              <div className="arena-stat">
                <span className="arena-stat-value">{result.cards_enriched}</span>
                <span className="arena-stat-label">{t.successEnriched}</span>
              </div>
              <div className="arena-stat">
                <span className="arena-stat-value">🪙 {result.tokens_remaining}</span>
                <span className="arena-stat-label">{t.successTokens}</span>
              </div>
            </div>
            <p className="arena-result-collection-name">
              {it ? 'Collezione creata:' : 'Collection created:'} <strong>{result.collection_name}</strong>
            </p>
            <div className="arena-result-actions">
              <button className="arena-btn-primary" onClick={() => onNavigate('collections')}>
                {t.goToCollection}
              </button>
              <button className="arena-btn-secondary" onClick={resetForm}>
                {t.importAnother}
              </button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {step === 'error' && (
          <div className="arena-result-card arena-result-error">
            <div className="arena-result-icon">❌</div>
            <h2>{t.errorTitle}</h2>
            <p className="arena-error-msg">{errorMsg}</p>
            <button className="arena-btn-primary" onClick={resetForm}>{t.retry}</button>
          </div>
        )}

        {/* INSTRUCTIONS + UPLOAD */}
        {(step === 'instructions' || step === 'upload') && (
          <>
            {/* Percorso file */}
            <div className="arena-section">
              <h2 className="arena-section-title">{t.whereTitle}</h2>
              <div className="arena-paths">
                {[
                  { key: 'windows', label: t.windows, path: LOG_PATHS.windows, icon: '🪟' },
                  { key: 'mac', label: t.mac, path: LOG_PATHS.mac, icon: '🍎' },
                ].map(({ key, label, path, icon }) => (
                  <div className="arena-path-card" key={key}>
                    <div className="arena-path-header">
                      <span className="arena-path-os">{icon} {label}</span>
                    </div>
                    <div className="arena-path-row">
                      <code className="arena-path-code">{path}</code>
                      <button
                        className={`arena-copy-btn ${copied === key ? 'copied' : ''}`}
                        onClick={() => copyPath(path, key)}
                      >
                        {copied === key ? t.copied : t.copyBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="arena-warning-box">
              <span className="arena-warning-icon">⚠️</span>
              <div>
                <strong>{t.warningTitle}</strong>
                <p>{t.warningText}</p>
              </div>
            </div>

            {/* Steps */}
            <div className="arena-section">
              <h2 className="arena-section-title">{t.stepsTitle}</h2>
              <div className="arena-steps">
                {steps.map((s, i) => (
                  <div className="arena-step" key={i}>
                    <div className="arena-step-number">{i + 1}</div>
                    <div className="arena-step-icon">{s.icon}</div>
                    <div className="arena-step-body">
                      <h3 className="arena-step-title">{s.title}</h3>
                      <p className="arena-step-desc">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload section */}
            <div className="arena-section arena-upload-section">
              <h2 className="arena-section-title">{t.uploadSection}</h2>

              <div className="arena-confirm-check">
                <label className="arena-checkbox-label">
                  <input
                    type="checkbox"
                    checked={confirmedSteps}
                    onChange={e => setConfirmedSteps(e.target.checked)}
                  />
                  <span className="arena-checkbox-text">{t.confirmCheck}</span>
                </label>
              </div>

              <div className="arena-form-row">
                <label className="arena-label">{t.collectionNameLabel}</label>
                <input
                  type="text"
                  className="arena-input"
                  value={collectionName}
                  onChange={e => setCollectionName(e.target.value)}
                  maxLength={80}
                />
              </div>

              <div
                className={`arena-dropzone ${file ? 'has-file' : ''} ${!confirmedSteps ? 'disabled' : ''}`}
                onClick={() => confirmedSteps && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".log,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="arena-dropzone-file">
                    <span className="arena-dropzone-icon">📄</span>
                    <span className="arena-dropzone-filename">{file.name}</span>
                    <span className="arena-dropzone-size">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                ) : (
                  <div className="arena-dropzone-placeholder">
                    <span className="arena-dropzone-icon">📂</span>
                    <span>{t.selectFile}</span>
                  </div>
                )}
              </div>

              {errorMsg && step !== 'error' && (
                <p className="arena-inline-error">{errorMsg}</p>
              )}

              <button
                className="arena-btn-primary arena-upload-btn"
                onClick={handleUpload}
                disabled={uploading || !file || !confirmedSteps}
              >
                {uploading ? (
                  <><span className="arena-spinner" /> {t.uploading}</>
                ) : (
                  t.uploadBtn
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
