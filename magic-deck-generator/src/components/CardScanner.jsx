import { useState, useEffect, useRef, useCallback } from 'react'
import './CardScanner.css'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const t = {
  it: {
    title: '📷 Card Scanner',
    back: 'Indietro',
    scanned: 'aggiunte',
    selectCollection: 'Collezione',
    noCollections: 'Nessuna collezione',
    selectCamera: 'Fotocamera',
    captureStart: '▶ Avvia Scansione',
    captureStop: '⏹ Ferma',
    ocrReading: 'Analisi...',
    waitingHint: 'Posiziona la prossima carta...',
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
    ocrHint: 'Inquadra la carta intera',
    manualSearch: 'Cerca manualmente',
    manualPlaceholder: 'Scrivi il nome della carta...',
    manualBtn: '🔍 Cerca',
    removeCard: 'Rimuovi',
    nextCard: '📷 Prossima carta',
    sameCard: 'Stessa carta — cambiala per continuare',
    filterSet: 'Filtra per set',
    allSets: 'Tutti i set',
    scanSpeed: 'Velocità scansione',
    scanSpeedFast: 'Veloce',
    scanSpeedSlow: 'Lento',
  },
  en: {
    title: '📷 Card Scanner',
    back: 'Back',
    scanned: 'added',
    selectCollection: 'Collection',
    noCollections: 'No collections',
    selectCamera: 'Camera',
    captureStart: '▶ Start Scanning',
    captureStop: '⏹ Stop',
    ocrReading: 'Analyzing...',
    waitingHint: 'Place the next card...',
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
    ocrHint: 'Frame the full card',
    manualSearch: 'Search manually',
    manualPlaceholder: 'Type the card name...',
    manualBtn: '🔍 Search',
    removeCard: 'Remove',
    nextCard: '📷 Next card',
    sameCard: 'Same card — change it to continue',
    filterSet: 'Filter by set',
    allSets: 'All sets',
    scanSpeed: 'Scan speed',
    scanSpeedFast: 'Fast',
    scanSpeedSlow: 'Slow',
  }
}

const rarityColor = r => ({ mythic:'#f97316', rare:'#f59e0b', uncommon:'#94a3b8', common:'#64748b' }[r] || '#64748b')

function captureFrame(videoEl, canvas) {
  const vw = videoEl.videoWidth  || 1280
  const vh = videoEl.videoHeight || 720
  const maxSide = 1000
  const scale = Math.min(1, maxSide / Math.max(vw, vh))
  canvas.width  = Math.round(vw * scale)
  canvas.height = Math.round(vh * scale)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.90)
}

// ── Camera hook ───────────────────────────────────────────────────────────────
function useCamera(selectedCamera, enabled, tr) {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [error, setError]             = useState(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraReady(false)
  }, [])

  const startCamera = useCallback(async (deviceId, signal) => {
    stopCamera()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280 }, height: { ideal: 720 },
          facingMode: deviceId ? undefined : 'environment',
        }
      })
      // Se il componente è stato smontato mentre aspettavamo il permesso, ferma subito lo stream
      if (signal?.aborted) {
        stream.getTracks().forEach(t => t.stop())
        return
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          if (!signal?.aborted) setCameraReady(true)
        }
      }
      setError(null)
    } catch { setError(tr.errorCamera); setCameraReady(false) }
  }, [tr, stopCamera])

  useEffect(() => {
    if (!enabled || selectedCamera === null) {
      stopCamera()
      return
    }
    const controller = new AbortController()
    startCamera(selectedCamera, controller.signal)
    return () => {
      controller.abort()
      stopCamera()
    }
  }, [selectedCamera, enabled])

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

// ── Scanner panel ─────────────────────────────────────────────────────────────
function ScannerPanel({ user, language, collections, selectedCollectionId, setSelectedCollectionId,
                         cameras, selectedCamera, setSelectedCamera, tr, onAdded, onHistory }) {
  const canvasRef      = useRef(null)
  const scanningRef    = useRef(false)
  const loopRunningRef = useRef(false)
  const addingRef      = useRef(false)
  const lastAddedName  = useRef(null)

  const [isScanning, setIsScanning]       = useState(false)
  const [scanPhase, setScanPhase]         = useState(null)
  const [lastAdded, setLastAdded]         = useState(null)
  const [duplicateName, setDuplicateName] = useState(null)
  const [candidates, setCandidates]       = useState([])
  const [error, setError]                 = useState(null)
  const [manualName, setManualName]       = useState('')
  const [manualStatus, setManualStatus]   = useState(null)
  const [forcedSet, setForcedSet]         = useState('')
  const [availableSets, setAvailableSets] = useState([])
  const [setQuery, setSetQuery]           = useState('')
  const [setDropOpen, setSetDropOpen]     = useState(false)
  const [scanDelay, setScanDelay]         = useState(2500)
  const scanDelayRef = useRef(2500)
  const forcedSetRef = useRef('')
  const setInputRef  = useRef(null)

  useEffect(() => { scanDelayRef.current = scanDelay }, [scanDelay])
  useEffect(() => { forcedSetRef.current = forcedSet }, [forcedSet])

  const { videoRef, cameraReady, error: camError, stopCamera } = useCamera(selectedCamera, isScanning, tr)
  useEffect(() => () => { scanningRef.current = false; stopCamera() }, [stopCamera])

  useEffect(() => {
    fetch(`${API_URL}/api/scan/sets`)
      .then(r => r.json())
      .then(d => setAvailableSets(d.sets || []))
      .catch(() => {})
  }, [])

  // ── Add card ──────────────────────────────────────────────────────────────
  const _addCard = useCallback(async (card, qty) => {
    if (addingRef.current) return false
    addingRef.current = true
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
        setLastAdded({ ...card, qty: 1 })
        onAdded()
        onHistory(prev => {
          const idx = prev.findIndex(c => c.uuid === card.uuid)
          if (idx >= 0) {
            const u = [...prev]; u[idx] = { ...u[idx], qty: data.quantity_owned, card_id: data.card_id }; return u
          }
          return [{ ...card, qty: 1, card_id: data.card_id }, ...prev]
        })
        return true
      }
    } catch (e) { console.error('Add error', e) }
    finally { addingRef.current = false }
    return false
  }, [user, selectedCollectionId, onAdded, onHistory])

  // ── Scan cycle ────────────────────────────────────────────────────────────
  const runOneCycle = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    // Aspetta che il video sia pronto (camera appena avviata)
    if (!videoRef.current.videoWidth) {
      await new Promise(r => setTimeout(r, 500))
      if (!scanningRef.current) return
    }
    setScanPhase('capturing')
    const imageB64 = captureFrame(videoRef.current, canvasRef.current)
    setScanPhase('waiting')
    try {
      const res = await fetch(`${API_URL}/api/scan/recognize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: imageB64, language, forced_set_code: forcedSetRef.current || null }),
      })
      const data = await res.json()
      if (!scanningRef.current) return
      if (data.found && data.candidates?.length) {
        if (data.exact_match) {
          const card = data.candidates[0]
          if (lastAddedName.current && lastAddedName.current === card.name) {
            setDuplicateName(card.name)
            setScanPhase('duplicate')
            await new Promise(r => setTimeout(r, scanDelayRef.current))
            if (scanningRef.current) setScanPhase(null)
          } else {
            scanningRef.current = false
            setIsScanning(false)
            const ok = await _addCard(card, 1)
            if (ok) { lastAddedName.current = card.name; setScanPhase('added') }
            else setScanPhase(null)
          }
        } else {
          scanningRef.current = false
          setIsScanning(false)
          setCandidates(data.candidates)
          setScanPhase('found')
        }
      } else {
        setScanPhase('notfound')
        await new Promise(r => setTimeout(r, scanDelayRef.current))
        if (scanningRef.current) setScanPhase(null)
      }
    } catch (e) {
      console.error('Scan error', e)
      setScanPhase('notfound')
      await new Promise(r => setTimeout(r, scanDelayRef.current))
      if (scanningRef.current) setScanPhase(null)
    }
  }, [videoRef, language, _addCard])

  // ── Loop ──────────────────────────────────────────────────────────────────
  const startScanning = useCallback(() => {
    if (!selectedCollectionId) { setError(tr.errorNoCollection); return }
    if (loopRunningRef.current) return
    setError(null); setLastAdded(null)
    lastAddedName.current = null
    scanningRef.current = true
    setIsScanning(true)
    const loop = async () => {
      loopRunningRef.current = true
      while (scanningRef.current) { await runOneCycle() }
      loopRunningRef.current = false
    }
    loop()
  }, [selectedCollectionId, tr, runOneCycle])

  const stopScanning = useCallback(() => {
    scanningRef.current = false
    setIsScanning(false)
    setScanPhase(null)
  }, [])

  const handleNextCard = useCallback(() => {
    if (loopRunningRef.current) return
    setScanPhase(null)
    lastAddedName.current = null
    scanningRef.current = true
    setIsScanning(true)
    const loop = async () => {
      loopRunningRef.current = true
      while (scanningRef.current) { await runOneCycle() }
      loopRunningRef.current = false
    }
    loop()
  }, [runOneCycle])

  // ── Manual search ─────────────────────────────────────────────────────────
  const handleManualSearch = useCallback(async () => {
    if (!selectedCollectionId) { setError(tr.errorNoCollection); return }
    const name = manualName.trim()
    if (!name) return
    setError(null); setManualStatus('searching')
    try {
      const res = await fetch(`${API_URL}/api/scan/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_name: name, collector_number: null, language }),
      })
      const data = await res.json()
      if (data.found && data.candidates?.length) {
        setCandidates(data.candidates); setScanPhase('found'); setManualStatus(null)
      } else { setManualStatus('notfound') }
    } catch { setManualStatus('notfound') }
  }, [manualName, selectedCollectionId, language, tr])

  const handleConfirm = async (card, qty) => {
    setCandidates([]); setScanPhase(null); setManualStatus(null); setManualName('')
    await _addCard(card, qty)
    lastAddedName.current = card.name
  }

  const displayError = error || camError
  const overlayText = () => {
    if (scanPhase === 'capturing' || scanPhase === 'waiting')
      return { spinner: true, text: scanPhase === 'capturing' ? tr.ocrReading : tr.waitingHint, cls: '' }
    if (scanPhase === 'notfound') return { icon: '❌', text: tr.notRecognized, cls: ' notfound' }
    return null
  }
  const overlay = overlayText()

  return (
    <div className="cs2-mode-body">
      {displayError && <div className="cs2-error">⚠️ {displayError}</div>}

      <div className="cs2-controls-row">
        <div className="cs2-section">
          <label className="cs2-label">{tr.selectCollection}</label>
          <select className="cs2-select" value={selectedCollectionId || ''}
            onChange={e => setSelectedCollectionId(Number(e.target.value))}
            disabled={isScanning}>
            {collections.length === 0
              ? <option value="">{tr.noCollections}</option>
              : collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="cs2-section cs2-set-picker">
          <label className="cs2-label">{tr.filterSet}</label>
          <div className="cs2-set-input-wrap" ref={setInputRef}>
            <input
              className="cs2-select cs2-set-input"
              type="text"
              placeholder={tr.allSets}
              value={setQuery}
              disabled={isScanning}
              onChange={e => { setSetQuery(e.target.value); setSetDropOpen(true) }}
              onFocus={() => setSetDropOpen(true)}
              onBlur={() => setTimeout(() => setSetDropOpen(false), 150)}
              autoComplete="off"
            />
            {forcedSet && (
              <button className="cs2-set-clear" onClick={() => { setForcedSet(''); setSetQuery('') }}>✕</button>
            )}
            {setDropOpen && (
              <div className="cs2-set-dropdown">
                <div className="cs2-set-option cs2-set-option-all"
                  onMouseDown={() => { setForcedSet(''); setSetQuery(''); setSetDropOpen(false) }}>
                  — {tr.allSets}
                </div>
                {availableSets
                  .filter(s => {
                    const q = setQuery.toLowerCase()
                    return !q || s.code.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q)
                  })
                  .slice(0, 80)
                  .map(s => (
                    <div key={s.code} className={`cs2-set-option${forcedSet === s.code ? ' active' : ''}`}
                      onMouseDown={() => { setForcedSet(s.code); setSetQuery(`${s.code.toUpperCase()} — ${s.name}`); setSetDropOpen(false) }}>
                      <span className="cs2-set-code">{s.code.toUpperCase()}</span>
                      <span className="cs2-set-name">{s.name}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        {cameras.length > 1 && (
          <div className="cs2-section">
            <label className="cs2-label">{tr.selectCamera}</label>
            <select className="cs2-select" value={selectedCamera || ''}
              onChange={e => setSelectedCamera(e.target.value)}
              disabled={isScanning}>
              {cameras.map((cam, i) => (
                <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Camera ${i+1}`}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="cs2-speed-row">
        <label className="cs2-label">{tr.scanSpeed}</label>
        <div className="cs2-speed-control">
          <span className="cs2-speed-label">{tr.scanSpeedFast}</span>
          <input type="range" min={1000} max={5000} step={500} value={scanDelay}
            onChange={e => setScanDelay(Number(e.target.value))}
            disabled={isScanning} className="cs2-speed-slider" />
          <span className="cs2-speed-label">{tr.scanSpeedSlow}</span>
          <span className="cs2-speed-value">{(scanDelay / 1000).toFixed(1)}s</span>
        </div>
      </div>

      <div className="cs2-video-wrapper">
        <video ref={videoRef} autoPlay playsInline muted className="cs2-video" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {!isScanning && !overlay && (
          <div className="cs2-ocr-hint">{tr.ocrHint}</div>
        )}
        {overlay && (
          <div className={`cs2-status-overlay${overlay.cls}`}>
            {overlay.spinner ? <div className="cs2-spinner" /> : <span style={{ fontSize: '1.6rem' }}>{overlay.icon}</span>}
            <span>{overlay.text}</span>
          </div>
        )}
        {scanPhase === 'added' && lastAdded && (
          <div className="cs2-status-overlay added">
            <span style={{ fontSize: '1.6rem' }}>✅</span>
            <span>{lastAdded.name}</span>
            <button className="cs2-next-btn" onClick={handleNextCard}>{tr.nextCard}</button>
          </div>
        )}
        {scanPhase === 'duplicate' && (
          <div className="cs2-status-overlay duplicate">
            <span style={{ fontSize: '1.6rem' }}>🔁</span>
            <span>{duplicateName || lastAdded?.name}</span>
            <span className="cs2-added-sub">{tr.sameCard}</span>
          </div>
        )}
      </div>

      {!isScanning ? (
        <button className="cs2-scan-btn start" onClick={startScanning}
          disabled={collections.length === 0}>
          {tr.captureStart}
        </button>
      ) : (
        <button className="cs2-scan-btn stop" onClick={stopScanning}>{tr.captureStop}</button>
      )}

      {lastAdded && (
        <div className="cs2-last-result found">
          <div className="cs2-last-name">✅ {tr.addedOk} {lastAdded.name}</div>
          <div className="cs2-last-meta">
            <span>{lastAdded.set_code?.toUpperCase()}</span>
            {lastAdded.price_eur && <span>{tr.eur}{Number(lastAdded.price_eur).toFixed(2)}</span>}
          </div>
        </div>
      )}

      <div className="cs2-manual-search">
        <label className="cs2-label">{tr.manualSearch}</label>
        <div className="cs2-manual-row">
          <input className="cs2-manual-input" type="text" placeholder={tr.manualPlaceholder}
            value={manualName} onChange={e => setManualName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()} />
          <button className="cs2-manual-btn" onClick={handleManualSearch}
            disabled={!manualName.trim() || manualStatus === 'searching'}>
            {manualStatus === 'searching' ? '...' : tr.manualBtn}
          </button>
        </div>
        {manualStatus === 'notfound' && (
          <div style={{ fontSize: '0.82rem', color: '#f87171', marginTop: 6 }}>❌ {tr.notRecognized}</div>
        )}
      </div>

      {scanPhase === 'found' && candidates.length > 0 && (
        <ConfirmModal candidates={candidates} tr={tr}
          onConfirm={handleConfirm}
          onCancel={() => { setCandidates([]); setScanPhase(null) }} />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CardScanner({ user, language, onBack }) {
  const tr = t[language] || t.en

  const [collections, setCollections]                   = useState([])
  const [selectedCollectionId, setSelectedCollectionId] = useState(null)
  const [cameras, setCameras]                           = useState([])
  const [selectedCamera, setSelectedCamera]             = useState(null)
  const [totalAdded, setTotalAdded]                     = useState(0)
  const [history, setHistory]                           = useState([])

  const handleUpdateQty = useCallback(async (cardId, newQty) => {
    try {
      const res = await fetch(`${API_URL}/api/cards/card/${cardId}/quantity?quantity=${newQty}`, { method: 'PUT' })
      const data = await res.json()
      if (data.deleted) setHistory(prev => prev.filter(c => c.card_id !== cardId))
      else setHistory(prev => prev.map(c => c.card_id === cardId ? { ...c, qty: data.new_quantity } : c))
    } catch (e) { console.error('Update qty error', e) }
  }, [])

  const handleRemove = useCallback(async (cardId) => {
    try {
      await fetch(`${API_URL}/api/cards/card/${cardId}/quantity?quantity=0`, { method: 'PUT' })
      setHistory(prev => prev.filter(c => c.card_id !== cardId))
    } catch (e) { console.error('Remove error', e) }
  }, [])

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

      <div className="cs2-layout">
        <div className="cs2-left">
          <ScannerPanel {...sharedProps} />
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
                {card.card_id ? (
                  <div className="cs2-card-actions">
                    <div className="cs2-qty-inline">
                      <button onClick={() => handleUpdateQty(card.card_id, Math.max(1, card.qty - 1))}>−</button>
                      <span>{card.qty}</span>
                      <button onClick={() => handleUpdateQty(card.card_id, card.qty + 1)}>+</button>
                    </div>
                    <button className="cs2-remove-btn" onClick={() => handleRemove(card.card_id)} title={tr.removeCard}>🗑</button>
                  </div>
                ) : (
                  <div className="cs2-card-qty">{tr.qty}{card.qty}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
