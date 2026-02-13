import { useState, useEffect, useRef, useCallback } from 'react'
import './RandomArtBackground.css'

const CARD_COUNT = 15
const ROTATE_INTERVAL = 120000

async function fetchRandomCard() {
  try {
    const res = await fetch('https://api.scryfall.com/cards/random?q=has%3Aart')
    if (res.ok) {
      const data = await res.json()
      const uris = data.image_uris || (data.card_faces && data.card_faces[0]?.image_uris)
      if (uris) return uris.large || uris.png || uris.normal
    }
  } catch {}
  return null
}

async function fetchMultipleCards(count) {
  const results = []
  const promises = []
  for (let i = 0; i < count; i++) {
    promises.push(
      new Promise(resolve => setTimeout(resolve, i * 100)).then(() => fetchRandomCard())
    )
  }
  const urls = await Promise.all(promises)
  for (const url of urls) {
    if (url) results.push(url)
  }
  return results
}

function RandomArtBackground() {
  const [currentCards, setCurrentCards] = useState([])
  const [nextCards, setNextCards] = useState([])
  const [showNext, setShowNext] = useState(false)
  const mounted = useRef(true)
  const intervalRef = useRef(null)

  const loadCards = useCallback(async () => {
    const urls = await fetchMultipleCards(CARD_COUNT)
    return urls
  }, [])

  useEffect(() => {
    mounted.current = true

    const init = async () => {
      const urls = await loadCards()
      if (mounted.current && urls.length > 0) {
        setCurrentCards(urls)
      }
    }
    init()

    intervalRef.current = setInterval(async () => {
      if (!mounted.current) return
      const urls = await loadCards()
      if (!mounted.current || urls.length === 0) return
      setNextCards(urls)
      setShowNext(true)
      setTimeout(() => {
        if (!mounted.current) return
        setCurrentCards(urls)
        setNextCards([])
        setShowNext(false)
      }, 2500)
    }, ROTATE_INTERVAL)

    return () => {
      mounted.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loadCards])

  if (currentCards.length === 0) return null

  return (
    <div className="random-art-background">
      <div className="random-art-layer active">
        <div className="card-mosaic">
          {currentCards.map((url, i) => (
            <img key={i} src={url} alt="" className="mosaic-card" loading="lazy" />
          ))}
        </div>
      </div>
      {nextCards.length > 0 && (
        <div className={`random-art-layer ${showNext ? 'active' : ''}`}>
          <div className="card-mosaic">
            {nextCards.map((url, i) => (
              <img key={i} src={url} alt="" className="mosaic-card" loading="lazy" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RandomArtBackground
