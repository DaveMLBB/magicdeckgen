/**
 * Utility per il sistema di free-trial anonimo.
 *
 * - Genera e persiste un browser_id pseudonimo in localStorage
 * - Espone il browser_id come header X-Browser-Id per ogni chiamata API
 * - Fornisce un helper per parsare la risposta 429 del trial esaurito
 *
 * Privacy: il browser_id è un UUID v4 generato localmente, non linkato
 * a dati personali. Non è un cookie di tracciamento.
 */

const BROWSER_ID_KEY = 'anon_browser_id'

/**
 * Genera un UUID v4 semplice senza dipendenze esterne.
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback per browser più vecchi
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Restituisce il browser_id persistente.
 * Se non esiste, ne genera uno nuovo e lo salva in localStorage.
 * Fallback a sessionStorage se localStorage non è disponibile.
 */
export function getBrowserId() {
  try {
    let id = localStorage.getItem(BROWSER_ID_KEY)
    if (!id) {
      id = generateUUID()
      localStorage.setItem(BROWSER_ID_KEY, id)
    }
    return id
  } catch {
    // localStorage non disponibile (es. Safari private mode)
    try {
      let id = sessionStorage.getItem(BROWSER_ID_KEY)
      if (!id) {
        id = generateUUID()
        sessionStorage.setItem(BROWSER_ID_KEY, id)
      }
      return id
    } catch {
      // Nessuno storage disponibile: genera un ID temporaneo per la sessione
      if (!window._anonBrowserId) {
        window._anonBrowserId = generateUUID()
      }
      return window._anonBrowserId
    }
  }
}

/**
 * Restituisce gli header da aggiungere a ogni chiamata API anonima.
 * Gli utenti autenticati possono comunque inviare questo header — il backend
 * lo ignora se user_id è presente nel body.
 */
export function getTrialHeaders() {
  return {
    'X-Browser-Id': getBrowserId(),
  }
}

/**
 * Controlla se una risposta HTTP è un errore di trial esaurito.
 * @param {Response} response - La risposta fetch
 * @param {object|null} data - Il body JSON già parsato (opzionale)
 * @returns {boolean}
 */
export function isTrialLimitError(response, data) {
  if (response.status !== 429) return false
  return data?.detail?.error === 'anonymous_trial_limit_reached'
}

/**
 * Estrae il messaggio di errore trial dalla risposta.
 * @param {object} data - Il body JSON della risposta 429
 * @param {string} language - 'it' o 'en'
 * @returns {string}
 */
export function getTrialLimitMessage(data, language = 'it') {
  const detail = data?.detail
  if (!detail) return language === 'it'
    ? 'Prova gratuita esaurita. Registrati per continuare.'
    : 'Free trial exhausted. Sign up to continue.'

  return language === 'it'
    ? (detail.message_it || detail.message_en || 'Prova gratuita esaurita.')
    : (detail.message_en || detail.message_it || 'Free trial exhausted.')
}
