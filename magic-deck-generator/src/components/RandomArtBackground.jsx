import { useState, useEffect, useRef } from 'react'
import './RandomArtBackground.css'

const ROTATE_INTERVAL = 30000

async function fetchRandomArt() {
  try {
    const res = await fetch('https://api.scryfall.com/cards/random?q=has%3Aart+-is%3Adigital')
    if (!res.ok) return null
    const data = await res.json()
    const uris = data.image_uris || (data.card_faces && data.card_faces[0]?.image_uris)
    if (uris) return uris.art_crop || uris.large || uris.normal
  } catch {}
  return null
}

function RandomArtBackground() {
  const [urls, setUrls] = useState([null, null])
  const [activeIndex, setActiveIndex] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    const load = async () => {
      const url = await fetchRandomArt()
      if (mounted.current && url) {
        setUrls([url, null])
        setActiveIndex(0)
      }
    }
    load()

    const interval = setInterval(async () => {
      if (!mounted.current) return
      const url = await fetchRandomArt()
      if (!mounted.current || !url) return
      const next = activeIndex === 0 ? 1 : 0
      setUrls(prev => {
        const copy = [...prev]
        copy[next] = url
        return copy
      })
      setActiveIndex(next)
    }, ROTATE_INTERVAL)

    return () => {
      mounted.current = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="random-art-background">
      {urls.map((url, i) => (
        <div
          key={i}
          className={`random-art-layer ${i === activeIndex && url ? 'active' : ''}`}
          style={url ? { backgroundImage: `url(${url})` } : undefined}
        />
      ))}
    </div>
  )
}

export default RandomArtBackground
