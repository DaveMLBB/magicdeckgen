import { useState, useEffect, useRef } from 'react'
import './RandomArtBackground.css'

const ROTATE_INTERVAL = 20000

function RandomArtBackground() {
  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeLayer, setActiveLayer] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    fetch('/backgrounds/manifest.json')
      .then(res => res.ok ? res.json() : [])
      .then(files => {
        if (!mounted.current || files.length === 0) return
        const shuffled = [...files].sort(() => Math.random() - 0.5)
        setImages(shuffled)
      })
      .catch(() => {})

    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (images.length < 2) return

    const interval = setInterval(() => {
      if (!mounted.current) return
      setCurrentIndex(prev => (prev + 1) % images.length)
      setActiveLayer(prev => prev === 0 ? 1 : 0)
    }, ROTATE_INTERVAL)

    return () => clearInterval(interval)
  }, [images])

  if (images.length === 0) return null

  const layer0Img = activeLayer === 0
    ? images[currentIndex]
    : images[(currentIndex - 1 + images.length) % images.length]
  const layer1Img = activeLayer === 1
    ? images[currentIndex]
    : images[(currentIndex - 1 + images.length) % images.length]

  return (
    <div className="random-art-background">
      <div
        className={`random-art-layer ${activeLayer === 0 ? 'active' : ''}`}
        style={{ backgroundImage: `url(/backgrounds/${layer0Img})` }}
      />
      <div
        className={`random-art-layer ${activeLayer === 1 ? 'active' : ''}`}
        style={{ backgroundImage: `url(/backgrounds/${layer1Img})` }}
      />
    </div>
  )
}

export default RandomArtBackground
