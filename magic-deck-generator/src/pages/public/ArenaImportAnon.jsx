import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const TR = {
  it: {
    title: '📋 Arena Import',
    desc: 'Incolla una lista da MTG Arena o MTGO per visualizzarla',
    back: '← Indietro',
    register: '🚀 Registrati per salvare i mazzi',
    label: 'Incolla la lista del mazzo',
    placeholder: 'Deck\n4 Lightning Bolt\n4 Goblin Guide\n...\n\nSideboard\n2 Smash to Smithereens',
    parse: 'Visualizza Mazzo',
    clear: 'Pulisci',
    mainboard: 'Mainboard',
    sideboard: 'Sideboard',
    cards: 'carte',
    noCards: 'Nessuna carta trovata. Controlla il formato della lista.',
    registerCta: 'Registrati per salvare questo mazzo nella tua collezione',
  },
  en: {
    title: '📋 Arena Import',
    desc: 'Paste an MTG Arena or MTGO list to preview it',
    back: '← Back',
    register: '🚀 Sign up to save decks',
    label: 'Paste your deck list',
    placeholder: 'Deck\n4 Lightning Bolt\n4 Goblin Guide\n...\n\nSideboard\n2 Smash to Smithereens',
    parse: 'Preview Deck',
    clear: 'Clear',
    mainboard: 'Mainboard',
    sideboard: 'Sideboard',
    cards: 'cards',
    noCards: 'No cards found. Check the list format.',
    registerCta: 'Sign up to save this deck to your collection',
  },
}

function parseDeckList(text) {
  const main = [], side = []
  let inSide = false
  text.split('\n').forEach(line => {
    const l = line.trim()
    if (!l) return
    if (/^(sideboard|side)/i.test(l)) { inSide = true; return }
    if (/^(deck|mainboard|main)/i.test(l)) { inSide = false; return }
    const m = l.match(/^(\d+)x?\s+(.+)$/)
    if (m) {
      const entry = { qty: parseInt(m[1]), name: m[2].trim() }
      inSide ? side.push(entry) : main.push(entry)
    }
  })
  return { main, side }
}

export default function ArenaImportAnon({ language = 'it', onBack }) {
  const t = TR[language] || TR.it
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState(null)

  const handleParse = () => {
    const result = parseDeckList(text)
    setParsed(result)
  }

  const totalMain = parsed?.main.reduce((s, c) => s + c.qty, 0) || 0
  const totalSide = parsed?.side.reduce((s, c) => s + c.qty, 0) || 0

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: '0 0 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', background: '#1e293b', borderBottom: '1px solid #334155', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={btnStyle}>{t.back}</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{t.title}</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>{t.desc}</p>
        </div>
        <button onClick={() => navigate('/')} style={regBtnStyle}>{t.register}</button>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        {!parsed ? (
          <>
            <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: '0.9rem' }}>{t.label}</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t.placeholder}
              rows={14}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <button onClick={handleParse} disabled={!text.trim()} style={{ ...regBtnStyle, opacity: !text.trim() ? 0.6 : 1 }}>
              {t.parse}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setParsed(null)} style={{ ...btnStyle, marginBottom: 20 }}>{t.clear}</button>

            {parsed.main.length === 0 && parsed.side.length === 0 ? (
              <p style={{ color: '#f87171' }}>{t.noCards}</p>
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 12 }}>{t.mainboard} ({totalMain} {t.cards})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {parsed.main.map((c, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 12px', background: '#1e293b', borderRadius: 6 }}>
                        <span style={{ color: '#f59e0b', fontWeight: 700, minWidth: 24 }}>{c.qty}</span>
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {parsed.side.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 12 }}>{t.sideboard} ({totalSide} {t.cards})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {parsed.side.map((c, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 12px', background: '#1e293b', borderRadius: 6 }}>
                          <span style={{ color: '#64748b', fontWeight: 700, minWidth: 24 }}>{c.qty}</span>
                          <span style={{ color: '#94a3b8' }}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ background: '#312e81', border: '1px solid #6366f1', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <p style={{ margin: '0 0 12px', color: '#e2e8f0' }}>🎁 {t.registerCta}</p>
                  <button onClick={() => navigate('/')} style={regBtnStyle}>{t.register}</button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const btnStyle = { background: '#334155', color: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem' }
const regBtnStyle = { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }
