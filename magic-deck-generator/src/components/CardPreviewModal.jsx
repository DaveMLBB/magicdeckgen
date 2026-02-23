import { useState, useEffect } from 'react'
import React from 'react'
import ReactDOM from 'react-dom'
import { cardImageCache } from '../utils/cardImageCache'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

const CardDetailImage = React.memo(function CardDetailImage({ card, language }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let abortController = new AbortController()

    const loadImage = async () => {
      try {
        if (card.image_url && card.image_url.startsWith('/card-images/')) {
          const img = new Image()
          img.onload = () => { if (mounted) { setImageUrl(card.image_url); setLoading(false) } }
          img.onerror = async () => {
            if (mounted && !abortController.signal.aborted) {
              const url = await cardImageCache.getCardImage(card.name_en || card.name, card.scryfallId, language)
              if (mounted) { setImageUrl(url); setLoading(false) }
            }
          }
          img.src = card.image_url
        } else {
          if (!abortController.signal.aborted) {
            const url = await cardImageCache.getCardImage(card.name_en || card.name, card.scryfallId, language)
            if (mounted) { setImageUrl(url); setLoading(false) }
          }
        }
      } catch {
        if (mounted) setLoading(false)
      }
    }

    loadImage()
    return () => { mounted = false; abortController.abort() }
  }, [card.name, card.name_en, card.image_url, card.scryfallId, language])

  if (loading) return (
    <div className="card-detail-image-placeholder">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  )
  if (!imageUrl) return (
    <div className="card-detail-image-placeholder"><p>Image Not Found</p></div>
  )
  return <img src={imageUrl} alt={card.name} className="card-detail-image" />
})

function renderManaCost(manaCost) {
  if (!manaCost || manaCost.trim() === '') return null
  const symbols = manaCost.match(/\{([^}]+)\}/g)
  if (!symbols) return <span className="mana-text">{manaCost}</span>
  const colorMap = {
    'W': { bg: '#f9faf4', border: '#ccc', text: '#333' },
    'U': { bg: '#0e68ab', border: '#0e68ab', text: '#fff' },
    'B': { bg: '#150b00', border: '#555', text: '#fff' },
    'R': { bg: '#d3202a', border: '#d3202a', text: '#fff' },
    'G': { bg: '#00733e', border: '#00733e', text: '#fff' },
  }
  return symbols.map((sym, i) => {
    const val = sym.replace(/[{}]/g, '')
    const c = colorMap[val]
    if (c) return <span key={i} className="mana-symbol" style={{ background: c.bg, borderColor: c.border, color: c.text }}>{val}</span>
    return <span key={i} className="mana-symbol mana-generic">{val}</span>
  })
}

function CardPreviewModal({ cardName, language, onClose }) {
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!cardName) return
    setLoading(true); setError(null); setCard(null)

    const fetchCard = async () => {
      try {
        const res = await fetch(`${API_URL}/api/mtg-cards/search?query=${encodeURIComponent(cardName)}&page_size=1&language=${language}`)
        const data = await res.json()
        const found = data.cards?.[0]
        if (!found) { setError('Card not found'); setLoading(false); return }

        const detail = await fetch(`${API_URL}/api/mtg-cards/card/${found.uuid}?language=${language}`)
        const detailData = await detail.json()
        setCard(detailData)
      } catch {
        setError('Error loading card')
      }
      setLoading(false)
    }

    fetchCard()
  }, [cardName, language])

  const t = language === 'it'
    ? { rarity: 'Rarità', set: 'Set', artist: 'Artista', legalities: 'Legalità' }
    : { rarity: 'Rarity', set: 'Set', artist: 'Artist', legalities: 'Legalities' }

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}>✕</button>

        {loading && (
          <div className="card-detail-content" style={{ justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <div className="spinner"></div>
          </div>
        )}

        {error && (
          <div className="card-detail-content" style={{ justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <p style={{ color: '#fca5a5' }}>⚠️ {error}</p>
          </div>
        )}

        {!loading && card && (
          <div className="card-detail-content">
            <div className="card-detail-image-wrapper">
              <CardDetailImage card={card} language={language} />
            </div>
            <div className="card-detail-info">
              <h2>{card.name}</h2>
              {language === 'it' && card.name_en && card.name !== card.name_en && (
                <p className="detail-name-en">{card.name_en}</p>
              )}
              {card.mana_cost && <p className="detail-mana">{renderManaCost(card.mana_cost)}</p>}
              <p className="detail-type">{card.type}</p>
              {language === 'it' && card.type_en && card.type !== card.type_en && (
                <p className="detail-type-en">{card.type_en}</p>
              )}
              {card.text && (
                <div className="detail-text">
                  {card.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
              )}
              {(card.power || card.toughness) && (
                <p className="detail-pt"><strong>P/T:</strong> {card.power}/{card.toughness}</p>
              )}
              {card.loyalty && (
                <p className="detail-loyalty"><strong>Loyalty:</strong> {card.loyalty}</p>
              )}
              <div className="detail-meta">
                <p><strong>{t.rarity}:</strong> {card.rarity}</p>
                <p><strong>{t.set}:</strong> {card.set_code}</p>
                {card.artist && <p><strong>{t.artist}:</strong> {card.artist}</p>}
              </div>
              {card.legalities && Object.keys(card.legalities).length > 0 && (
                <div className="detail-legalities">
                  <strong>{t.legalities}:</strong>
                  <div className="legalities-grid">
                    {Object.entries(card.legalities).map(([fmt, status]) => (
                      <span key={fmt} className={`legality-badge ${status.toLowerCase()}`}>
                        {fmt}: {status}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default CardPreviewModal
