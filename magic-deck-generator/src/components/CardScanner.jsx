import { useState, useEffect, useRef, useCallback } from 'react'
import './CardScanner.css'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const SINGLE_INTERVAL_MS = 1200
const JPEG_QUALITY        = 0.7
const CAPTURE_W           = 640
const CAPTURE_H           = 480
const GRID_CAPTURE_W      = 1280   // più risoluzione per la griglia
const GRID_CAPTURE_H      = 960
const GRID_INTERVAL_MS    = 4000   // la griglia è più lenta (9 carte per frame)
const GRID_ROWS           = 3
const GRID_COLS           = 3

const t = {
  it: {
    title: '📷 Card Scanner',
    back: 'Indietro',
    scanned: 'scansionate',
    selectCollection: 'Collezione',
    noCollections: 'Nessuna collezione',
    selectCamera: 'Fotocamera',
    startScan: '▶ Avvia',
    stopScan: '⏹ Ferma',
    history: 'Carte aggiunte',
    qty: 'x',
    eur: '€',
    usd: '$',
    set: 'Set',
    confidence: 'Confidenza',
    notRecognized: 'Non riconosciuta',
    errorNoCollection: 'Seleziona una collezione prima',
    errorCamera: 'Impossibile accedere alla fotocamera',
    costHint: '🪙 1 token ogni 100 scansioni riconosciute',

    // Modalità
    modeSingle: '🃏 Carta Singola',
    modeGrid: '📋 Raccoglitore',
    singleTitle: 'Scansione carta singola',
    singleDesc: 'Tieni una carta davanti alla fotocamera. Lo scanner la riconosce automaticamente ogni 1,2 secondi e la aggiunge alla collezione. Ideale per scansionare carte una alla volta velocemente.',
    gridTitle: 'Scansione raccoglitore (3×3)',
    gridDesc: 'Inquadra una pagina del raccoglitore con 9 carte visibili. Lo scanner analizza l\'intera pagina in un colpo solo e aggiunge tutte le carte riconosciute. Ideale per catalogare grandi collezioni.',
    gridRecognized: 'riconosciute',
    gridSlots: 'slot',
    scanning: 'Scansione...',
    paused: 'In pausa',
  },
  en: {
    title: '📷 Card Scanner',
    back: 'Back',
    scanned: 'scanned',
    selectCollection: 'Collection',
    noCollections: 'No collections',
    selectCamera: 'Camera',
    startScan: '▶ Start',
    stopScan: '⏹ Stop',
    history: 'Added cards',
    qty: 'x',
    eur: '€',
    usd: '$',
    set: 'Set',
    confidence: 'Confidence',
    notRecognized: 'Not recognized',
    errorNoCollection: 'Select a collection first',
    errorCamera: 'Cannot access camera',
    costHint: '🪙 1 token per every 100 recognized scans',

    modeSingle: '🃏 Single Card',
    modeGrid: '📋 Binder Page',
    singleTitle: 'Single card scan',
    singleDesc: 'Hold one card in front of the camera. The scanner automatically recognizes it every 1.2 seconds and adds it to your collection. Best for quickly scanning cards one at a time.',
    gridTitle: 'Binder page scan (3×3)',
    gridDesc: 'Frame a binder page with 9 visible cards. The scanner analyzes the entire page at once and adds all recognized cards. Best for cataloguing large collections quickly.',
    gridRecognized: 'recognized',
    gridSlots: 'slots',
    scanning: 'Scanning...',
    paused: 'Paused',
  }
}

const rarityColor = (r) => ({
  mythic: '#f97316', rare: '#f59e0b', uncommon: '#94a3b8', common: '#64748b'
}[r] || '#64748b')

// ─── Shared camera hook ───────────────────────────────────────────────────────
function useCamera(selectedCamera, tr) {
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [error, setError]             = useState(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  const startCamera = useCallback(async (deviceId) => {
    stopCamera()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280 }, height: { ideal: 720 },
          facingMode: deviceId ? undefined : 'environment',
        }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setCameraReady(true)
      }
      setError(null)
    } catch {
      setError(tr.errorCamera)
      setCameraReady(false)
    }
  }, [tr, stopCamera])

  useEffect(() => {
    if (selectedCamera !== null) startCamera(selectedCamera)
    return stopCamera
  }, [selectedCamera])

  return { videoRef, cameraReady, error, stopCamera }
}

// ─── Single card mode ─────────────────────────────────────────────────────────
function SingleScanner({ user, language, collections, selectedCollectionId, setSelectedCollectionId,
                          cameras, selectedCamera, setSelectedCamera, tr, onTotalScanned, onHistory }) {
  const canvasRef    = useRef(null)
  const timerRef     = useRef(null)
  const scanningRef  = useRef(false)
  const processingRef = useRef(false)

  const [isScanning, setIsScanning]   = useState(false)
  const [lastResult, setLastResult]   = useState(null)
  const [error, setError]             = useState(null)

  const { videoRef, cameraReady, error: camError, stopCamera } = useCamera(selectedCamera, tr)

  const captureAndScan = useCallback(async () => {
    if (!scanningRef.current || processingRef.current) return
    if (!videoRef.current || !canvasRef.current || !selectedCollectionId) return

    const canvas = canvasRef.current
    canvas.width = CAPTURE_W; canvas.height = CAPTURE_H
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, CAPTURE_W, CAPTURE_H)
    const b64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1]

    processingRef.current = true
    try {
      const res  = await fetch(`${API_URL}/api/scan/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.userId, image_base64: b64,
                               collection_id: selectedCollectionId, language }),
      })
      const data = await res.json()
      if (data.identified) {
        onTotalScanned(n => n + 1)
        setLastResult(data)
        onHistory(prev => {
          const idx = prev.findIndex(c => c.name === data.card_name && c.set_code === data.set_code)
          if (idx >= 0) {
            const u = [...prev]; u[idx] = { ...u[idx], qty: data.quantity_owned }; return u
          }
          return [{ name: data.card_name, set_code: data.set_code, image_url: data.image_url,
                    rarity: data.rarity, price_eur: data.price_eur, price_usd: data.price_usd,
                    qty: data.quantity_owned }, ...prev]
        })
      } else {
        setLastResult({ identified: false })
      }
    } catch { /* silenzioso */ }
    processingRef.current = false
  }, [selectedCollectionId, user, language, onTotalScanned, onHistory])

  const startScanning = () => {
    if (!selectedCollectionId) { setError(tr.errorNoCollection); return }
    setError(null); setIsScanning(true); scanningRef.current = true
    timerRef.current = setInterval(captureAndScan, SINGLE_INTERVAL_MS)
  }
  const stopScanning = () => {
    setIsScanning(false); scanningRef.current = false; clearInterval(timerRef.current)
  }
  useEffect(() => () => { stopScanning(); stopCamera() }, [])

  const displayError = error || camError

  return (
    <div className="cs2-mode-body">
      {/* Descrizione modalità */}
      <div className="cs2-mode-desc">
        <strong>{tr.singleTitle}</strong> — {tr.singleDesc}
      </div>

      {displayError && <div className="cs2-error">⚠️ {displayError}</div>}

      <div className="cs2-controls-row">
        <div className="cs2-section">
          <label className="cs2-label">{tr.selectCollection}</label>
          <select className="cs2-select" value={selectedCollectionId || ''}
            onChange={e => setSelectedCollectionId(Number(e.target.value))} disabled={isScanning}>
            {collections.length === 0
              ? <option value="">{tr.noCollections}</option>
              : collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {cameras.length > 1 && (
          <div className="cs2-section">
            <label className="cs2-label">{tr.selectCamera}</label>
            <select className="cs2-select" value={selectedCamera || ''}
              onChange={e => { stopScanning(); setSelectedCamera(e.target.value) }} disabled={isScanning}>
              {cameras.map((cam, i) => (
                <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Camera ${i+1}`}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="cs2-video-wrapper">
        <video ref={videoRef} autoPlay playsInline muted className="cs2-video" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className={`cs2-overlay ${isScanning ? 'scanning' : ''}`}>
          <div className="cs2-crosshair">
            <div className="cs2-corner tl" /><div className="cs2-corner tr" />
            <div className="cs2-corner bl" /><div className="cs2-corner br" />
          </div>
          {isScanning && processingRef.current && <div className="cs2-processing-dot" />}
        </div>
      </div>

      <button className={`cs2-scan-btn ${isScanning ? 'stop' : 'start'}`}
        onClick={isScanning ? stopScanning : startScanning}
        disabled={!cameraReady || collections.length === 0}>
        {isScanning ? tr.stopScan : tr.startScan}
      </button>

      {lastResult && (
        <div className={`cs2-last-result ${lastResult.identified ? 'found' : 'notfound'}`}>
          {lastResult.identified ? (
            <>
              <div className="cs2-last-name">{lastResult.card_name}</div>
              <div className="cs2-last-meta">
                {lastResult.set_code && <span>{tr.set}: {lastResult.set_code.toUpperCase()}</span>}
                <span>{tr.confidence}: {Math.round(lastResult.confidence * 100)}%</span>
                {lastResult.price_eur && <span>{tr.eur}{lastResult.price_eur.toFixed(2)}</span>}
              </div>
            </>
          ) : <span className="cs2-not-recognized">🔍 {tr.notRecognized}</span>}
        </div>
      )}
    </div>
  )
}

// ─── Grid (binder) mode ───────────────────────────────────────────────────────
function GridScanner({ user, language, collections, selectedCollectionId, setSelectedCollectionId,
                        cameras, selectedCamera, setSelectedCamera, tr, onTotalScanned, onHistory }) {
  const canvasRef    = useRef(null)
  const timerRef     = useRef(null)
  const scanningRef  = useRef(false)
  const processingRef = useRef(false)

  const [isScanning, setIsScanning]   = useState(false)
  const [lastGrid, setLastGrid]       = useState(null)   // array 9 risultati
  const [error, setError]             = useState(null)

  const { videoRef, cameraReady, error: camError, stopCamera } = useCamera(selectedCamera, tr)

  const captureAndScanGrid = useCallback(async () => {
    if (!scanningRef.current || processingRef.current) return
    if (!videoRef.current || !canvasRef.current || !selectedCollectionId) return

    const canvas = canvasRef.current
    canvas.width = GRID_CAPTURE_W; canvas.height = GRID_CAPTURE_H
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, GRID_CAPTURE_W, GRID_CAPTURE_H)
    const b64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1]

    processingRef.current = true
    try {
      const res  = await fetch(`${API_URL}/api/scan/identify-grid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.userId, image_base64: b64,
                               collection_id: selectedCollectionId, language, rows: GRID_ROWS, cols: GRID_COLS }),
      })
      const data = await res.json()
      if (data.cards) {
        setLastGrid(data)
        const recognized = data.cards.filter(c => c.identified)
        onTotalScanned(n => n + recognized.length)
        recognized.forEach(card => {
          onHistory(prev => {
            const idx = prev.findIndex(c => c.name === card.card_name && c.set_code === card.set_code)
            if (idx >= 0) {
              const u = [...prev]; u[idx] = { ...u[idx], qty: card.quantity_owned }; return u
            }
            return [{ name: card.card_name, set_code: card.set_code, image_url: card.image_url,
                      rarity: card.rarity, price_eur: card.price_eur, price_usd: card.price_usd,
                      qty: card.quantity_owned }, ...prev]
          })
        })
      }
    } catch { /* silenzioso */ }
    processingRef.current = false
  }, [selectedCollectionId, user, language, onTotalScanned, onHistory])

  const startScanning = () => {
    if (!selectedCollectionId) { setError(tr.errorNoCollection); return }
    setError(null); setIsScanning(true); scanningRef.current = true
    timerRef.current = setInterval(captureAndScanGrid, GRID_INTERVAL_MS)
  }
  const stopScanning = () => {
    setIsScanning(false); scanningRef.current = false; clearInterval(timerRef.current)
  }
  useEffect(() => () => { stopScanning(); stopCamera() }, [])

  const displayError = error || camError

  // Costruisce griglia 3x3 dai risultati
  const gridCells = Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
    const row = Math.floor(i / GRID_COLS), col = i % GRID_COLS
    const pos = `r${row}c${col}`
    return lastGrid?.cards?.find(c => c.position === pos) || null
  })

  return (
    <div className="cs2-mode-body">
      <div className="cs2-mode-desc">
        <strong>{tr.gridTitle}</strong> — {tr.gridDesc}
      </div>

      {displayError && <div className="cs2-error">⚠️ {displayError}</div>}

      <div className="cs2-controls-row">
        <div className="cs2-section">
          <label className="cs2-label">{tr.selectCollection}</label>
          <select className="cs2-select" value={selectedCollectionId || ''}
            onChange={e => setSelectedCollectionId(Number(e.target.value))} disabled={isScanning}>
            {collections.length === 0
              ? <option value="">{tr.noCollections}</option>
              : collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {cameras.length > 1 && (
          <div className="cs2-section">
            <label className="cs2-label">{tr.selectCamera}</label>
            <select className="cs2-select" value={selectedCamera || ''}
              onChange={e => { stopScanning(); setSelectedCamera(e.target.value) }} disabled={isScanning}>
              {cameras.map((cam, i) => (
                <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Camera ${i+1}`}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Video con overlay griglia 3x3 */}
      <div className="cs2-video-wrapper">
        <video ref={videoRef} autoPlay playsInline muted className="cs2-video" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className={`cs2-overlay cs2-grid-overlay ${isScanning ? 'scanning' : ''}`}>
          <div className="cs2-grid-inner">
            {Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => (
              <div key={i} className="cs2-grid-cell">
                <div className="cs2-grid-corner tl" /><div className="cs2-grid-corner tr" />
                <div className="cs2-grid-corner bl" /><div className="cs2-grid-corner br" />
              </div>
            ))}
          </div>
          {isScanning && processingRef.current && <div className="cs2-processing-dot" />}
        </div>
      </div>

      <button className={`cs2-scan-btn ${isScanning ? 'stop' : 'start'}`}
        onClick={isScanning ? stopScanning : startScanning}
        disabled={!cameraReady || collections.length === 0}>
        {isScanning ? tr.stopScan : tr.startScan}
      </button>

      {/* Risultato ultima scansione griglia */}
      {lastGrid && (
        <div className="cs2-grid-result">
          <div className="cs2-grid-result-header">
            ✅ {lastGrid.recognized} / {lastGrid.total_slots} {tr.gridRecognized}
          </div>
          <div className="cs2-grid-preview">
            {gridCells.map((cell, i) => (
              <div key={i} className={`cs2-grid-preview-cell ${cell?.identified ? 'found' : 'empty'}`}>
                {cell?.identified ? (
                  <>
                    {cell.image_url
                      ? <img src={cell.image_url} alt={cell.card_name} />
                      : <span className="cs2-grid-cell-name">{cell.card_name}</span>}
                    <div className="cs2-grid-cell-badge"
                      style={{ background: rarityColor(cell.rarity) }} />
                  </>
                ) : <span className="cs2-grid-empty-slot">—</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CardScanner({ user, language, onBack }) {
  const tr = t[language] || t.en

  const [mode, setMode]                       = useState('single')  // 'single' | 'grid'
  const [collections, setCollections]         = useState([])
  const [selectedCollectionId, setSelectedCollectionId] = useState(null)
  const [cameras, setCameras]                 = useState([])
  const [selectedCamera, setSelectedCamera]   = useState(null)
  const [totalScanned, setTotalScanned]       = useState(0)
  const [history, setHistory]                 = useState([])

  useEffect(() => {
    if (!user?.userId) return
    fetch(`${API_URL}/api/collections/user/${user.userId}`)
      .then(r => r.json())
      .then(data => {
        const list = data.collections || []
        setCollections(list)
        if (list.length > 0) setSelectedCollectionId(list[0].id)
      }).catch(() => {})
  }, [user])

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const cams = devices.filter(d => d.kind === 'videoinput')
      setCameras(cams)
      if (cams.length > 0) setSelectedCamera(cams[0].deviceId)
    }).catch(() => {})
  }, [])

  const sharedProps = {
    user, language, collections, selectedCollectionId, setSelectedCollectionId,
    cameras, selectedCamera, setSelectedCamera, tr,
    onTotalScanned: setTotalScanned, onHistory: setHistory,
  }

  return (
    <div className="card-scanner">
      {/* Header */}
      <div className="cs2-header">
        <button className="cs2-back-btn" onClick={onBack}>← {tr.back}</button>
        <div className="cs2-header-content">
          <h1>{tr.title}</h1>
        </div>
        <div className="cs2-stats-badge">🃏 {totalScanned} {tr.scanned}</div>
      </div>

      <div className="cs2-cost-hint">ℹ️ {tr.costHint}</div>

      {/* Tab switcher */}
      <div className="cs2-tabs">
        <button className={`cs2-tab ${mode === 'single' ? 'active' : ''}`}
          onClick={() => setMode('single')}>{tr.modeSingle}</button>
        <button className={`cs2-tab ${mode === 'grid' ? 'active' : ''}`}
          onClick={() => setMode('grid')}>{tr.modeGrid}</button>
      </div>

      <div className="cs2-layout">
        {/* Pannello principale (video + controlli) */}
        <div className="cs2-left">
          {mode === 'single'
            ? <SingleScanner key="single" {...sharedProps} />
            : <GridScanner   key="grid"   {...sharedProps} />}
        </div>

        {/* History comune */}
        <div className="cs2-right">
          <p className="cs2-section-title">{tr.history} ({history.length})</p>
          <div className="cs2-history">
            {history.length === 0 && (
              <div className="cs2-empty"><span>📷</span><p>{tr.paused}</p></div>
            )}
            {history.map((card, i) => (
              <div key={i} className="cs2-history-card">
                {card.image_url
                  ? <img src={card.image_url} alt={card.name} className="cs2-card-thumb" />
                  : <div className="cs2-card-thumb-placeholder">🃏</div>}
                <div className="cs2-card-info">
                  <div className="cs2-card-name">{card.name}</div>
                  <div className="cs2-card-meta">
                    {card.set_code && (
                      <span className="cs2-rarity-dot"
                        style={{ background: rarityColor(card.rarity) }} title={card.rarity} />
                    )}
                    {card.set_code && <span className="cs2-set">{card.set_code.toUpperCase()}</span>}
                    {card.price_eur && <span className="cs2-price">{tr.eur}{card.price_eur.toFixed(2)}</span>}
                    {!card.price_eur && card.price_usd && <span className="cs2-price">{tr.usd}{card.price_usd.toFixed(2)}</span>}
                  </div>
                </div>
                <div className="cs2-card-qty">{tr.qty}{card.qty}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
