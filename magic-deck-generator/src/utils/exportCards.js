/**
 * Export utility for collections and decks.
 * Supports: CSV, ManaBox CSV, XLSX, TXT (MTGA/MTGO), plain text list
 */
import * as XLSX from 'xlsx'

// ── helpers ──────────────────────────────────────────────────────────────────

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadText(text, filename, mime = 'text/plain') {
  downloadBlob(new Blob([text], { type: mime }), filename)
}

// ── CSV (generic) ─────────────────────────────────────────────────────────────
// columns: [{key, label}]
function toCSV(rows, columns) {
  const header = columns.map(c => `"${c.label}"`).join(',')
  const lines = rows.map(row =>
    columns.map(c => {
      const v = row[c.key] ?? ''
      return `"${String(v).replace(/"/g, '""')}"`
    }).join(',')
  )
  return [header, ...lines].join('\r\n')
}

// ── COLLECTION exports ────────────────────────────────────────────────────────

/**
 * cards: [{name, quantity_owned, card_type, mana_cost, colors, rarity, name_it}]
 */
export function exportCollectionCSV(cards, collectionName = 'collection') {
  const cols = [
    { key: 'name',     label: 'Name' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'type',     label: 'Type' },
    { key: 'mana_cost',label: 'Mana Cost' },
    { key: 'colors',   label: 'Colors' },
    { key: 'rarity',   label: 'Rarity' },
    { key: 'name_it',  label: 'Name (IT)' },
  ]
  downloadText(toCSV(cards, cols), `${collectionName}.csv`, 'text/csv')
}

export function exportCollectionManaBox(cards, collectionName = 'collection') {
  const header = 'Name,Set code,Quantity,Foil,Condition,Language'
  const lines = cards.map(c =>
    `"${(c.name || '').replace(/"/g, '""')}","${c.set_code || ''}",${c.quantity || 1},false,NM,en`
  )
  downloadText([header, ...lines].join('\r\n'), `${collectionName}_manabox.csv`, 'text/csv')
}

export function exportCollectionXLSX(cards, collectionName = 'collection') {
  const rows = cards.map(c => ({
    Name: c.name,
    Quantity: c.quantity,
    Type: c.type,
    'Mana Cost': c.mana_cost,
    Colors: c.colors,
    Rarity: c.rarity,
    'Set': c.set_code,
    'Name (IT)': c.name_it,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Collection')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${collectionName}.xlsx`)
}

export function exportCollectionTXT(cards, collectionName = 'collection') {
  const lines = cards.map(c => `${c.quantity} ${c.name}`)
  downloadText(lines.join('\n'), `${collectionName}.txt`)
}

// ── DECK exports ──────────────────────────────────────────────────────────────

/**
 * cards: [{card_name, quantity, card_type, mana_cost, colors, rarity}]
 */
export function exportDeckCSV(cards, deckName = 'deck') {
  const cols = [
    { key: 'card_name', label: 'Name' },
    { key: 'quantity',  label: 'Quantity' },
    { key: 'card_type', label: 'Type' },
    { key: 'mana_cost', label: 'Mana Cost' },
    { key: 'colors',    label: 'Colors' },
    { key: 'rarity',    label: 'Rarity' },
  ]
  downloadText(toCSV(cards, cols), `${deckName}.csv`, 'text/csv')
}

export function exportDeckManaBox(cards, deckName = 'deck') {
  const header = 'Name,Set code,Quantity,Foil,Condition,Language'
  const lines = cards.map(c =>
    `"${(c.card_name || '').replace(/"/g, '""')}","",${c.quantity || 1},false,NM,en`
  )
  downloadText([header, ...lines].join('\r\n'), `${deckName}_manabox.csv`, 'text/csv')
}

export function exportDeckXLSX(cards, deckName = 'deck') {
  const rows = cards.map(c => ({
    Name: c.card_name,
    Quantity: c.quantity,
    Type: c.card_type,
    'Mana Cost': c.mana_cost,
    Colors: c.colors,
    Rarity: c.rarity,
    Owned: c.quantity_owned,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Deck')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${deckName}.xlsx`)
}

/**
 * MTGA/MTGO format — groups by type section (Creature, Instant, etc.)
 * Lands go in a separate section like MTGA does.
 */
export function exportDeckTXT(cards, deckName = 'deck') {
  const TYPE_ORDER = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Land', 'Other']

  const grouped = {}
  TYPE_ORDER.forEach(t => { grouped[t] = [] })

  cards.forEach(c => {
    const t = TYPE_ORDER.find(type => (c.card_type || '').includes(type)) || 'Other'
    grouped[t].push(c)
  })

  const sections = []
  TYPE_ORDER.forEach(type => {
    if (grouped[type].length === 0) return
    sections.push(`// ${type}`)
    grouped[type].forEach(c => sections.push(`${c.quantity} ${c.card_name}`))
    sections.push('')
  })

  downloadText(sections.join('\n'), `${deckName}.txt`)
}
