/**
 * Cache per le immagini delle carte da Scryfall
 * Evita chiamate ripetute all'API per le stesse carte
 */

class CardImageCache {
  constructor() {
    this.cache = new Map()
    this.pendingRequests = new Map()
    this.maxCacheSize = 500 // Massimo 500 carte in cache
    this.cacheHits = 0
    this.cacheMisses = 0
  }

  /**
   * Ottiene l'URL dell'immagine dalla cache o da Scryfall
   */
  async getCardImage(cardName, scryfallId = null, lang = 'en') {
    // Normalizza il nome della carta per la cache (include lingua)
    const cacheKey = `${lang}:${cardName.toLowerCase().trim()}`

    // Controlla se è già in cache
    if (this.cache.has(cacheKey)) {
      this.cacheHits++
      return this.cache.get(cacheKey)
    }

    // Controlla se c'è già una richiesta in corso per questa carta
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)
    }

    // Crea una nuova richiesta
    this.cacheMisses++
    const requestPromise = this.fetchCardImage(cardName, scryfallId, lang)
    this.pendingRequests.set(cacheKey, requestPromise)

    try {
      const imageUrl = await requestPromise
      
      // Salva in cache
      if (imageUrl) {
        this.addToCache(cacheKey, imageUrl)
      } else {
        // Salva anche i fallimenti per evitare richieste ripetute
        this.addToCache(cacheKey, null)
      }

      return imageUrl
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  /**
   * Recupera l'immagine da Scryfall
   */
  async fetchCardImage(cardName, scryfallId = null, lang = 'en') {
    try {
      // Normalizza il nome della carta
      let normalizedName = cardName
        .replace(/Æ/g, 'Ae')
        .replace(/æ/g, 'ae')
        .trim()

      let imageUrl = null

      // Se la lingua non è inglese, cerca prima la versione localizzata
      if (lang && lang !== 'en') {
        imageUrl = await this._searchScryfall(normalizedName, lang)
        if (imageUrl) return imageUrl
      }

      // Fallback: cerca in inglese
      imageUrl = await this._searchScryfall(normalizedName, null)
      if (imageUrl) return imageUrl

      // Ultimo tentativo con scryfallId
      if (scryfallId) {
        const response = await fetch(`https://api.scryfall.com/cards/${scryfallId}`)
        if (response.ok) {
          const data = await response.json()
          return this._extractImageUrl(data)
        }
      }

      console.warn(`⚠️ Image not found for: "${cardName}"`)
      return null
    } catch (err) {
      console.error(`❌ Error loading image for "${cardName}":`, err.message)
      return null
    }
  }

  /**
   * Cerca una carta su Scryfall con lingua opzionale
   */
  async _searchScryfall(normalizedName, lang) {
    // Per lingue non-inglesi, usa /cards/search con filtro lang
    if (lang) {
      const searchQuery = `!"${normalizedName}" lang:${lang}`
      const response = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}&unique=prints&order=released&dir=desc`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          return this._extractImageUrl(data.data[0])
        }
      }
      return null
    }

    // Per inglese: usa /cards/named (più veloce e preciso)
    let response = await fetch(
      `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(normalizedName)}`
    )

    // Se non funziona, prova senza virgolette
    if (!response.ok && (normalizedName.includes('"') || normalizedName.includes('!'))) {
      const withoutQuotes = normalizedName.replace(/"/g, '')
      response = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(withoutQuotes)}`
      )
    }

    // Se non funziona, prova con virgolette aggiunte
    if (!response.ok && !normalizedName.startsWith('"')) {
      const withQuotes = `"${normalizedName}"`
      response = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(withQuotes)}`
      )
    }

    // Prova fuzzy search
    if (!response.ok) {
      const fuzzyName = normalizedName
        .replace(/[!"]/g, '')
        .replace(/,/g, '')
        .trim()
      response = await fetch(
        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(fuzzyName)}`
      )
    }

    if (response.ok) {
      const data = await response.json()
      return this._extractImageUrl(data)
    }

    return null
  }

  /**
   * Estrae l'URL dell'immagine dai dati Scryfall
   */
  _extractImageUrl(data, variant = 'normal') {
    const uris = data.image_uris || (data.card_faces && data.card_faces[0]?.image_uris)
    if (!uris) return null
    if (variant === 'art_crop') return uris.art_crop || uris.normal || uris.large || uris.small
    if (variant === 'large') return uris.large || uris.png || uris.normal || uris.small
    return uris.normal || uris.large || uris.small
  }

  async getCardArt(cardName, lang = 'en') {
    const cacheKey = `art:${lang}:${cardName.toLowerCase().trim()}`
    if (this.cache.has(cacheKey)) {
      this.cacheHits++
      return this.cache.get(cacheKey)
    }
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)
    }
    this.cacheMisses++
    const requestPromise = this._fetchArt(cardName, lang)
    this.pendingRequests.set(cacheKey, requestPromise)
    try {
      const url = await requestPromise
      this.addToCache(cacheKey, url)
      return url
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  async _fetchArt(cardName, lang, variant = 'art_crop') {
    try {
      const normalizedName = cardName.replace(/Æ/g, 'Ae').replace(/æ/g, 'ae').trim()
      const response = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(normalizedName)}`
      )
      if (response.ok) {
        const data = await response.json()
        return this._extractImageUrl(data, variant)
      }
      return null
    } catch {
      return null
    }
  }

  async getCardArtLarge(cardName, lang = 'en') {
    const cacheKey = `art_large:${lang}:${cardName.toLowerCase().trim()}`
    if (this.cache.has(cacheKey)) {
      this.cacheHits++
      return this.cache.get(cacheKey)
    }
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)
    }
    this.cacheMisses++
    const requestPromise = this._fetchArt(cardName, lang, 'large')
    this.pendingRequests.set(cacheKey, requestPromise)
    try {
      const url = await requestPromise
      this.addToCache(cacheKey, url)
      return url
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  /**
   * Aggiunge un'immagine alla cache
   */
  addToCache(key, imageUrl) {
    // Se la cache è piena, rimuovi l'elemento più vecchio (FIFO)
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, imageUrl)
  }

  /**
   * Pulisce la cache
   */
  clear() {
    this.cache.clear()
    this.pendingRequests.clear()
    this.cacheHits = 0
    this.cacheMisses = 0
  }

  /**
   * Ottiene statistiche sulla cache
   */
  getStats() {
    const total = this.cacheHits + this.cacheMisses
    const hitRate = total > 0 ? ((this.cacheHits / total) * 100).toFixed(2) : 0

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: `${hitRate}%`,
      pendingRequests: this.pendingRequests.size
    }
  }

  /**
   * Stampa le statistiche in console
   */
  logStats() {
    const stats = this.getStats()
    console.log('📊 Card Image Cache Stats:', stats)
  }
}

// Esporta un'istanza singleton
export const cardImageCache = new CardImageCache()

// Esponi la cache globalmente per debug (solo in development)
if (import.meta.env.DEV) {
  window.cardImageCache = cardImageCache
}
