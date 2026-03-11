import { useState, useEffect, useRef, useCallback } from 'react'
import { createWorker } from 'tesseract.js'
import './CardScanner.css'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const CAPTURE_W = 700
const CAPTURE_H = 980  // 5:7 ratio — stessa proporzione della carta MTG

const t = {
  it: {
    title: '📷 Card Scanner',
    back: 'Indietro',
    scanned: 'aggiunte',
    selectCollection: 'Collezione',
    noCollections: 'Nessuna collezione',
    selectCamera: 'Fotocamera',
    capture: '📸 Scansiona',
    ocrReading: 'Lettura OCR...',
    searching: 'Ricerca nel DB...',
    history: 'Carte aggiunte',
    qty: 'x',
    eur: '€',
    usd: '$',
    set: 'Set',
    notRecognized: 'Nessuna carta trovata',
    errorNoCollection: 'Seleziona una collezione prima',
    errorCamera: 'Impossibile accedere alla fotocamera',
    costHint: '🪙 1 token ogni 25 carte aggiunte',
    confirmCard: 'Carta trovata — conferma e imposta quantità',
    quantity: 'Quantità',
    add: 'Aggiungi alla collezione',
    cancel: 'Annulla',
    otherEditions: 'Altre edizioni',
    addedOk: 'Aggiunta!',
    ocrHint: 'Inquadra il nome della carta in alto al centro',
    modeSingle: '🃏 Carta Singola',
    modeGrid: '📋 Raccoglitore',
    singleDesc: 'Inquadra una carta alla volta. Premi Scansiona per leggere il nome con OCR e cercarla nel database.',
    gridDesc: 'Inquadra una pagina del raccoglitore (3×3). Premi Scansiona per leggere tutte le carte visibili.',
  },
  en: {
    title: '📷 Card Scanner',
    back: 'Back',
    scanned: 'added',
    selectCollection: 'Collection',
    noCollections: 'No collections',
    selectCamera: 'Camera',
    capture: '📸 Scan',
    ocrReading: 'Reading OCR...',
    searching: 'Searching DB...',
    history: 'Added cards',
    qty: 'x',
    eur: '€',
    usd: '$',
    set: 'Set',
    notRecognized: 'No card found',
    errorNoCollection: 'Select a collection first',
    errorCamera: 'Cannot access camera',
    costHint: '🪙 1 token every 25 cards added',
    confirmCard: 'Card found — confirm and set quantity',
    quantity: 'Quantity',
    add: 'Add to collection',
    cancel: 'Cancel',
    otherEditions: 'Other editions',
    addedOk: 'Added!',
    ocrHint: 'Frame the card name at the top center',
    modeSingle: '🃏 Single Card',
    modeGrid: '📋 Binder Page',
    singleDesc: 'Frame one card at a time. Press Scan to read the name with OCR and search the database.',
    gridDesc: 'Frame a binder page (3×3). Press Scan to read all visible cards.',
  }
}

const rarityColor = r => ({ mythic:'#f97316', rare:'#f59e0b', uncommon:'#94a3b8', common:'#64748b' }[r] || '#64748b')

// ── OCR worker (singleton) ────────────────────────────────────────────────────
let ocrWorker = null
async function getOCRWorker() {
  if (!ocrWorker) {
    ocrWorker = await createWorker('eng+ita', 1, { logger: () => {} })
  }
  return ocrWorker
}

/**
 * Estrae il nome carta dal frame OCR.
 *
 * Layout carta MTG:
 *   - Nome: prima riga in cima (es. "Lightning Bolt")
 *   - Occupa circa il 10-13% dell'altezza della carta
 *
 * Strategia:
 *   1. Crop top 13% → preprocessing (grayscale + contrasto) → OCR
 *   2. Prima riga non vuota con almeno 2 caratteri = nome carta
 */
async function ocrCard(canvas) {
  const w = canvas.width
  const h = canvas.height
  const worker = await getOCRWorker()

  // Helper: preprocessing grayscale + contrasto su un canvas crop
  const preprocess = (src, sx, sy, sw, sh) => {
    const scale = 2
    const out = document.createElement('canvas')
    out.width = sw * scale
    out.height = sh * scale
    const ctx = out.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(src, sx, sy, sw, sh, 0, 0, out.width, out.height)
    const imgData = ctx.getImageData(0, 0, out.width, out.height)
    const d = imgData.data
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]
      const c = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128))
      d[i] = d[i+1] = d[i+2] = c
    }
    ctx.putImageData(imgData, 0, 0)
    return out
  }

  // ── Crop nome: top 13% ───────────────────────────────────────────────────
  const nameH = Math.floor(h * 0.13)
  const nameProc = preprocess(canvas, 0, 0, w, nameH)

  // ── Crop collector number: bottom 8%, metà sinistra ─────────────────────
  // Il collector number (es. "123/281") è in basso a sinistra della carta
  const collH = Math.floor(h * 0.08)
  const collW = Math.floor(w * 0.5)
  const collY = h - collH
  const collProc = preprocess(canvas, 0, collY, collW, collH)

  const [nameResult, collResult] = await Promise.all([
    worker.recognize(nameProc),
    worker.recognize(collProc),
  ])

  // Nome: prima riga non vuota ≥ 2 caratteri
  const cardName = (nameResult.data.text || '').split('\n')
    .map(l => l.trim().replace(/[^a-zA-ZÀ-ÿ0-9 ',.\-]/g, '').trim())
    .find(l => l.length >= 2) || ''

  // Collector number: cerca pattern NNN o NNN/NNN (es. "123" o "123/281")
  const collText = collResult.data.text || ''
  const collMatch = collText.match(/\b(\d{1,4})(?:\/\d{1,4})?\b/)
  const collectorNumber = collMatch ? collMatch[1] : null

  return { cardName, collectorNumber, nameText: nameResult.data.text || '' }
}

// ── Camera hook ───────────────────────────────────────────────────────────────
function useCamera(selectedCamera, tr) {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [error, setError]             = useState(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraReady(false)
  }, [])

  const startCamera = useCallback(async (deviceId) => {
    stopCamera()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId ? { exact: deviceId } : undefined,
                 width: { ideal: 1280 }, height: { ideal: 720 },
                 facingMode: deviceId ? undefined : 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setCameraReady(true)
      }
      setError(null)
    } catch { setError(tr.errorCamera); setCameraReady(false) }
  }, [tr, stopCamera])

  useEffect(() => {
    if (selectedCamera !== null) startCamera(selectedCamera)
    return stopCamera
  }, [selectedCamera])

  return { videoRef, cameraReady, error, stopCamera }
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ candidates, tr, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(candidates[0])
  const [qty, setQty] = useState(1)

  return (
    <div className="cs2-modal-overlay" onClick={onCancel}>
      <div className="cs2-modal" onClick={e => e.stopPropagation()}>
        <h3>{tr.confirmCard}</h3>

        {/* Card preview */}
        <div className="cs2-confirm-card">
          {selected.image_url
            ? <img src={selected.image_url} alt={selected.name} className="cs2-confirm-img" />
            : <div className="cs2-confirm-img-placeholder">🃏</div>}
          <div className="cs2-confirm-info">
            <div className="cs2-confirm-name">{selected.name}</div>
            {selected.name_it && <div className="cs2-confirm-name-it">{selected.name_it}</div>}
            <div className="cs2-confirm-meta">
              <span style={{ color: rarityColor(selected.rarity) }}>⬤</span>
              {selected.set_name || selected.set_code?.toUpperCase()}
              {selected.price_eur && <span className="cs2-price">{tr.eur}{selected.price_eur.toFixed(2)}</span>}
            </div>
          </div>
        </div>

        {/* Altre edizioni */}
        {candidates.length > 1 && (
          <div className="cs2-editions">
            <p className="cs2-editions-label">{tr.otherEditions}</p>
            <div className="cs2-editions-list">
              {candidates.map(c => (
                <button key={c.uuid}
                  className={`cs2-edition-btn ${c.uuid === selected.uuid ? 'active' : ''}`}
                  onClick={() => setSelected(c)}>
                  {c.set_code?.toUpperCase()} {c.collector_number && `#${c.collector_number}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantità */}
        <div className="cs2-qty-row">
          <label>{tr.quantity}</label>
          <div className="cs2-qty-controls">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button onClick={() => setQty(q => q + 1)}>+</button>
          </div>
        </div>

        <div className="cs2-modal-actions">
          <button className="cs2-btn-cancel" onClick={onCancel}>{tr.cancel}</button>
          <button className="cs2-btn-add" onClick={() => onConfirm(selected, qty)}>{tr.add}</button>
        </div>
      </div>
    </div>
  )
}

// ── Scanner panel (shared for single/grid) ────────────────────────────────────
function ScannerPanel({ user, language, collections, selectedCollectionId, setSelectedCollectionId,
                         cameras, selectedCamera, setSelectedCamera, tr, mode,
                         onAdded, onHistory }) {
  const canvasRef   = useRef(null)
  const [status, setStatus]         = useState(null)   // null | 'ocr' | 'searching' | 'found' | 'notfound'
  const [candidates, setCandidates] = useState([])
  const [error, setError]           = useState(null)
  const [lastAdded, setLastAdded]   = useState(null)

  const { videoRef, cameraReady, error: camError, stopCamera } = useCamera(selectedCamera, tr)
  useEffect(() => () => stopCamera(), [])

  // Cattura frame e avvia OCR
  const handleScan = useCallback(async () => {
    if (!selectedCollectionId) { setError(tr.errorNoCollection); return }
    if (!videoRef.current || !canvasRef.current) return
    setError(null); setCandidates([]); setLastAdded(null)

    const canvas = canvasRef.current
    canvas.width = CAPTURE_W; canvas.height = CAPTURE_H
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, CAPTURE_W, CAPTURE_H)

    setStatus('ocr')
    let cardName = '', collectorNumber = null
    try {
      const result = await ocrCard(canvas)
      cardName = result.cardName
      collectorNumber = result.collectorNumber
    } catch (e) { console.error('OCR error', e) }

    if (!cardName) { setStatus('notfound'); return }

    setStatus('searching')
    try {
      const res = await fetch(`${API_URL}/api/scan/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_name: cardName, collector_number: collectorNumber, language }),
      })
      const data = await res.json()
      if (data.found && data.candidates?.length) {
        setCandidates(data.candidates)
        // Se c'è un match esatto per collector number, auto-seleziona senza modale
        if (data.exact_match) {
          handleConfirmDirect(data.candidates[0])
        } else {
          setStatus('found')
        }
      } else {
        setStatus('notfound')
      }
    } catch { setStatus('notfound') }
  }, [selectedCollectionId, videoRef, language, tr])

  const handleConfirmDirect = async (card) => {
    setCandidates([])
    setStatus(null)
    await _addCard(card, 1)
  }

  const handleConfirm = async (card, qty) => {
    setCandidates([])
    setStatus(null)
    await _addCard(card, qty)
  }

  const _addCard = async (card, qty) => {
    try {
      const res = await fetch(`${API_URL}/api/scan/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          collection_id: selectedCollectionId,
          card_uuid: card.uuid,
          quantity: qty,
        }),
      })
      const data = await res.json()
      if (data.added) {
        setLastAdded({ ...card, qty: data.quantity_owned })
        onAdded()
        onHistory(prev => {
          const idx = prev.findIndex(c => c.uuid === card.uuid)
          if (idx >= 0) {
            const u = [...prev]; u[idx] = { ...u[idx], qty: data.quantity_owned }; return u
          }
          return [{ ...card, qty: data.quantity_owned }, ...prev]
        })
      }
    } catch (e) { console.error('Add error', e) }
  }

  const displayError = error || camError

  return (
    <div className="cs2-mode-body">
      <div className="cs2-mode-desc">
        {mode === 'single' ? tr.singleDesc : tr.gridDesc}
      </div>

      {displayError && <div className="cs2-error">⚠️ {displayError}</div>}

      <div className="cs2-controls-row">
        <div className="cs2-section">
          <label className="cs2-label">{tr.selectCollection}</label>
          <select className="cs2-select" value={selectedCollectionId || ''}
            onChange={e => setSelectedCollectionId(Number(e.target.value))}>
            {collections.length === 0
              ? <option value="">{tr.noCollections}</option>
              : collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {cameras.length > 1 && (
          <div className="cs2-section">
            <label className="cs2-label">{tr.selectCamera}</label>
            <select className="cs2-select" value={selectedCamera || ''}
              onChange={e => setSelectedCamera(e.target.value)}>
              {cameras.map((cam, i) => (
                <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Camera ${i+1}`}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Video */}
      <div className="cs2-video-wrapper">
        <video ref={videoRef} autoPlay playsInline muted className="cs2-video" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {mode === 'single' ? (
          <div className="cs2-overlay">
            <div className="cs2-crosshair">
              <div className="cs2-name-zone" />
              <div className="cs2-corner tl" /><div className="cs2-corner tr" />
              <div className="cs2-corner bl" /><div className="cs2-corner br" />
            </div>
            <div className="cs2-ocr-hint">{tr.ocrHint}</div>
          </div>
        ) : (
          <div className="cs2-overlay cs2-grid-overlay">
            <div className="cs2-grid-inner">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="cs2-grid-cell">
                  <div className="cs2-grid-corner tl" /><div className="cs2-grid-corner tr" />
                  <div className="cs2-grid-corner bl" /><div className="cs2-grid-corner br" />
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'ocr' && <div className="cs2-status-overlay">🔍 {tr.ocrReading}</div>}
        {status === 'searching' && <div className="cs2-status-overlay">⏳ {tr.searching}</div>}
        {status === 'notfound' && <div className="cs2-status-overlay notfound">❌ {tr.notRecognized}</div>}
      </div>

      <button className="cs2-scan-btn start"
        onClick={handleScan}
        disabled={!cameraReady || collections.length === 0 || status === 'ocr' || status === 'searching'}>
        {status === 'ocr' ? tr.ocrReading : status === 'searching' ? tr.searching : tr.capture}
      </button>

      {lastAdded && (
        <div className="cs2-last-result found">
          <div className="cs2-last-name">✅ {tr.addedOk} {lastAdded.name}</div>
          <div className="cs2-last-meta">
            <span>{lastAdded.set_code?.toUpperCase()}</span>
            {lastAdded.price_eur && <span>{tr.eur}{lastAdded.price_eur.toFixed(2)}</span>}
          </div>
        </div>
      )}

      {status === 'found' && candidates.length > 0 && (
        <ConfirmModal
          candidates={candidates}
          tr={tr}
          onConfirm={handleConfirm}
          onCancel={() => { setCandidates([]); setStatus(null) }}
        />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CardScanner({ user, language, onBack }) {
  const tr = t[language] || t.en

  const [mode, setMode]                       = useState('single')
  const [collections, setCollections]         = useState([])
  const [selectedCollectionId, setSelectedCollectionId] = useState(null)
  const [cameras, setCameras]                 = useState([])
  const [selectedCamera, setSelectedCamera]   = useState(null)
  const [totalAdded, setTotalAdded]           = useState(0)
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
    cameras, selectedCamera, setSelectedCamera, tr, mode,
    onAdded: () => setTotalAdded(n => n + 1),
    onHistory: setHistory,
  }

  return (
    <div className="card-scanner">
      <div className="cs2-header">
        <button className="cs2-back-btn" onClick={onBack}>← {tr.back}</button>
        <div className="cs2-header-content"><h1>{tr.title}</h1></div>
        <div className="cs2-stats-badge">🃏 {totalAdded} {tr.scanned}</div>
      </div>

      <div className="cs2-cost-hint">ℹ️ {tr.costHint}</div>

      <div className="cs2-beta-disclaimer">
        🧪 {language === 'it' ? 'Feature in test — il riconoscimento potrebbe non essere accurato' : 'Feature in testing — recognition may not be accurate'}
      </div>

      <div className="cs2-tabs">
        <button className={`cs2-tab ${mode === 'single' ? 'active' : ''}`}
          onClick={() => setMode('single')}>{tr.modeSingle}</button>
        <button className={`cs2-tab ${mode === 'grid' ? 'active' : ''}`}
          onClick={() => setMode('grid')}>{tr.modeGrid}</button>
      </div>

      <div className="cs2-layout">
        <div className="cs2-left">
          <ScannerPanel key={mode} {...sharedProps} />
        </div>

        <div className="cs2-right">
          <p className="cs2-section-title">{tr.history} ({history.length})</p>
          <div className="cs2-history">
            {history.length === 0 && (
              <div className="cs2-empty"><span>📷</span><p>—</p></div>
            )}
            {history.map((card, i) => (
              <div key={i} className="cs2-history-card">
                {card.image_url
                  ? <img src={card.image_url} alt={card.name} className="cs2-card-thumb" />
                  : <div className="cs2-card-thumb-placeholder">🃏</div>}
                <div className="cs2-card-info">
                  <div className="cs2-card-name">{card.name}</div>
                  <div className="cs2-card-meta">
                    <span className="cs2-rarity-dot" style={{ background: rarityColor(card.rarity) }} />
                    {card.set_code && <span className="cs2-set">{card.set_code.toUpperCase()}</span>}
                    {card.price_eur && <span className="cs2-price">{tr.eur}{Number(card.price_eur).toFixed(2)}</span>}
                    {!card.price_eur && card.price_usd && <span className="cs2-price">{tr.usd}{Number(card.price_usd).toFixed(2)}</span>}
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
