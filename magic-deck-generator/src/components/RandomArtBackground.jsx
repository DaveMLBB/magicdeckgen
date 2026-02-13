import { useState, useEffect, useRef } from 'react'
import './RandomArtBackground.css'

async function fetchRandomArt() {
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

function RandomArtBackground() {
  const [currentUrl, setCurrentUrl] = useState(null)
  const [nextUrl, setNextUrl] = useState(null)
  const [showNext, setShowNext] = useState(false)
  const mounted = useRef(true)
  const intervalRef = useRef(null)

  useEffect(() => {
    mounted.current = true

    const loadFirst = async () => {
      const url = await fetchRandomArt()
      if (mounted.current && url) {
        setCurrentUrl(url)
      }
    }
    loadFirst()

    intervalRef.current = setInterval(async () => {
      if (!mounted.current) return
      const url = await fetchRandomArt()
      if (!mounted.current || !url) return
      setNextUrl(url)
      setShowNext(true)
      setTimeout(() => {
        if (!mounted.current) return
        setCurrentUrl(url)
        setNextUrl(null)
        setShowNext(false)
      }, 2500)
    }, 120000)

    return () => {
      mounted.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (!currentUrl) return null

  return (
    <div className="random-art-background">
      <div
        className="random-art-layer active"
        style={{ backgroundImage: `url(${currentUrl})` }}
      />
      {nextUrl && (
        <div
          className={`random-art-layer ${showNext ? 'active' : ''}`}
          style={{ backgroundImage: `url(${nextUrl})` }}
        />
      )}
    </div>
  )
}

export default RandomArtBackground
