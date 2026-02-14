import { useState, useEffect, useRef } from 'react'

const ROTATE_INTERVAL = 20000

function isMobile() {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

function RandomArtBackground() {
  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [bgFolder, setBgFolder] = useState('backgrounds')
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const folder = isMobile() ? 'backgrounds_mobile' : 'backgrounds'
    setBgFolder(folder)

    fetch(`/${folder}/manifest.json`)
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
    }, ROTATE_INTERVAL)

    return () => clearInterval(interval)
  }, [images])

  // Apply background directly on .app element — no separate DOM layer
  useEffect(() => {
    const appEl = document.querySelector('.app')
    if (!appEl || images.length === 0) return

    const img = images[currentIndex]
    appEl.style.backgroundImage = `url(/${bgFolder}/${img})`
    appEl.style.backgroundSize = 'cover'
    appEl.style.backgroundPosition = 'center'
    appEl.style.backgroundAttachment = 'fixed'
  }, [currentIndex, images, bgFolder])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const appEl = document.querySelector('.app')
      if (appEl) {
        appEl.style.backgroundImage = ''
        appEl.style.backgroundSize = ''
        appEl.style.backgroundPosition = ''
        appEl.style.backgroundAttachment = ''
      }
    }
  }, [])

  return null
}

export default RandomArtBackground
