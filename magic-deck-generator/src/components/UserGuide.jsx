import { useState } from 'react'
import './UserGuide.css'

const GUIDE_VERSION = '1.0'

const sections = {
  it: [
    {
      id: 'welcome',
      icon: '🎉',
      title: 'Benvenuto! I tuoi 100 Token',
      content: [
        'Grazie per esserti registrato! Hai ricevuto 100 token gratuiti di benvenuto.',
        'I token sono la valuta del sito: ogni funzione AI o caricamento ne consuma alcuni.',
        'Con 100 token puoi fare moltissimo: caricare collezioni, cercare mazzi, usare tutti gli strumenti AI.',
        'Il saldo token è sempre visibile nella barra in alto 🪙.',
        'Puoi ricaricare i token in qualsiasi momento dal Token Shop (clicca sul saldo 🪙).',
        '💡 Inizia caricando la tua collezione dalla Home per scoprire subito quali mazzi puoi costruire!',
      ]
    },
    {
      id: 'background',
      icon: '🖼️',
      title: 'Sfondo Animato',
      content: [
        'Lo sfondo animato mostra arte di carte Magic in rotazione.',
        'Per attivarlo o disattivarlo clicca il pulsante 🖼️ / 🚫 nella barra di navigazione in alto a destra.',
        'La preferenza viene salvata automaticamente.',
        'Di default lo sfondo è disabilitato per migliori prestazioni.',
      ]
    },
    {
      id: 'privacy',
      icon: '🔒',
      title: 'Privacy e Cancellazione Account',
      content: [
        'Clicca il pulsante 🔒 nella navbar per accedere alle impostazioni privacy.',
        'Da lì puoi visualizzare la Privacy Policy, i Termini di Servizio e gestire i cookie.',
        'Per cancellare il tuo account vai in "Impostazioni Privacy" → "Cancella Account".',
        'La cancellazione ha un periodo di grazia di 7 giorni durante il quale puoi annullare.',
        'Puoi anche esportare tutti i tuoi dati prima di cancellare l\'account.',
      ]
    },
    {
      id: 'logout',
      icon: '🚪',
      title: 'Logout',
      content: [
        'Per uscire dall\'account clicca il pulsante 🚪 in alto a destra nella navbar.',
        'Su mobile, apri il menu hamburger ☰ e scorri in basso per trovare il pulsante "Esci".',
        'Dopo il logout verrai reindirizzato alla schermata di login.',
      ]
    },
    {
      id: 'tokens',
      icon: '🪙',
      title: 'Token e Coupon',
      content: [
        'I token sono la valuta del sito. Ogni azione premium consuma 1 token (upload, ricerca, salvataggio mazzo, ecc.).',
        'Il tuo saldo token è sempre visibile nella navbar in alto.',
        'Per acquistare token clicca sul saldo 🪙 nella navbar per aprire il Token Shop.',
        'Sono disponibili diversi pacchetti: Starter (10 token), Base (50), Pro (200), Mega (600), Ultra (1500).',
        'Hai un coupon? Nella pagina Token Shop trovi il campo "Inserisci Coupon" dove puoi riscattarlo.',
        'I coupon aggiungono token gratuiti al tuo saldo.',
      ]
    },
    {
      id: 'search',
      icon: '🔍',
      title: 'Ricerca Mazzi (Home)',
      content: [
        'La sezione principale ti permette di trovare mazzi competitivi compatibili con le tue carte.',
        '1. Clicca "Carica Collezione" per caricare un file Excel/CSV con le tue carte, oppure seleziona una collezione già salvata.',
        '2. Usa i filtri per restringere la ricerca: colori, formato, completamento minimo.',
        '3. Scegli la fonte: mazzi di sistema (competitivi), mazzi degli utenti, o entrambi.',
        '4. Clicca "Trova Mazzi Compatibili" per avviare la ricerca.',
        '5. I risultati mostrano la percentuale di completamento e le carte mancanti.',
        '⚠️ I nomi delle carte nel file devono essere in INGLESE.',
      ]
    },
    {
      id: 'collections',
      icon: '📚',
      title: 'Collezioni',
      content: [
        'Le collezioni sono archivi delle tue carte fisiche.',
        'Vai su "Collezioni" nella navbar per gestirle.',
        'Puoi creare più collezioni (es. una per ogni binder o set).',
        'Carica le carte tramite file Excel/CSV o aggiungile manualmente.',
        'Ogni collezione mostra il numero di carte uniche e totali.',
        'Puoi collegare una collezione a un mazzo salvato per tracciare le carte possedute.',
        'Dalla collezione puoi anche importare direttamente un mazzo template.',
      ]
    },
    {
      id: 'card-search',
      icon: '🃏',
      title: 'Ricerca Carte',
      content: [
        'La sezione "Carte" ti permette di cercare nel database completo di Magic: The Gathering.',
        'Puoi filtrare per nome, colori, tipo, sottotipo, rarità, CMC, formato, testo della carta e molto altro.',
        'Supporta la ricerca in italiano e inglese.',
        'Clicca su una carta per vedere tutti i dettagli e l\'immagine.',
        'Puoi ordinare i risultati per nome, CMC o rarità.',
        'Il database contiene oltre 33.000 carte uniche.',
      ]
    },
    {
      id: 'decks',
      icon: '🗂️',
      title: 'Mazzi Salvati',
      content: [
        'La sezione "Mazzi" contiene tutti i mazzi che hai salvato.',
        'Puoi salvare un mazzo dalla ricerca principale, importarlo da un file, o crearlo manualmente.',
        'Ogni mazzo mostra formato, colori, archetipo e percentuale di completamento.',
        'Apri un mazzo per vedere tutte le carte, aggiungerne/rimuoverne, e gestire le quantità.',
        'Puoi rendere un mazzo "pubblico" per condividerlo con altri utenti.',
        'I mazzi pubblici appaiono nei risultati di ricerca degli altri utenti.',
        'Dalla pagina del mazzo puoi avviare l\'analisi AI direttamente.',
      ]
    },
    {
      id: 'ai-synergy',
      icon: '✨',
      title: 'AI Synergy Finder',
      content: [
        'L\'AI Synergy Finder trova carte compatibili e sinergiche partendo da carte che già conosci.',
        'Inserisci da 1 a 5 carte "seme" nel campo di ricerca (con autocomplete).',
        'Opzionalmente specifica un formato (Standard, Modern, Commander...) e una strategia (Aggro, Combo...).',
        'L\'AI analizza le meccaniche delle carte seme e suggerisce 15-25 carte sinergiche.',
        'I risultati sono raggruppati per ruolo: Enabler, Payoff, Support, Removal, Ramp...',
        'Vengono mostrate anche catene di sinergia e combo potenti.',
        'Puoi filtrare per priorità e copiare la lista con un click.',
        'I nomi delle carte sono cliccabili per maggiori dettagli.',
        '⚠️ Consuma 1 token per ricerca.',
      ]
    },
    {
      id: 'ai-twins',
      icon: '🪞',
      title: 'AI Gemelli',
      content: [
        'AI Gemelli trova carte che fanno esattamente la stessa cosa con nomi diversi.',
        'Utile per trovare sostituti economici, upgrade, o semplicemente scoprire carte equivalenti che non conoscevi.',
        'Inserisci da 1 a 5 carte: l\'AI restituisce per ognuna i suoi "gemelli funzionali".',
        'Ogni gemello è classificato in 4 categorie:',
        '🪞 Copia Funzionale — effetto quasi identico, nome/flavor diverso.',
        '⬆️ Superiore — il gemello è oggettivamente migliore in quasi tutte le situazioni.',
        '⬇️ Inferiore — sostituto economico o con piccoli svantaggi.',
        '↔️ Laterale — livello simile, contesti o compromessi diversi.',
        'Ogni carta mostra una barra di somiglianza (%), le differenze chiave e il prezzo stimato.',
        'Puoi filtrare per tipo di relazione e copiare tutta la lista con un click.',
        '⚠️ Consuma 3 token per ricerca.',
      ]
    },
    {
      id: 'ai-deck-builder',
      icon: '🏗️',
      title: 'AI Deck Builder',
      content: [
        'AI Deck Builder costruisce un mazzo completo partendo da una tua descrizione testuale.',
        'Scrivi liberamente cosa vuoi: archetipo, formato, colori, strategia, budget...',
        'Esempi: "Mazzo aggro rosso in Modern" oppure "Commander con Atraxa e counter +1/+1".',
        'Puoi specificare formato (Standard, Modern, Commander...), colori e budget.',
        'L\'AI genera il mazzo completo con: lista carte, sideboard, strategia, carte chiave e suggerimenti di upgrade.',
        'Le carte nel risultato sono cliccabili per cercarle nel database interno.',
        'Clicca "Salva Mazzo" per salvare il mazzo generato nella tua sezione Mazzi.',
        'Puoi copiare la lista completa con un click per usarla su altri siti.',
        '⚠️ Consuma 5 token per generazione.',
      ]
    },
    {
      id: 'ai-analyzer',
      icon: '🤖',
      title: 'AI Deck Analyzer',
      content: [
        'AI Deck Analyzer analizza un tuo mazzo salvato e suggerisce miglioramenti mirati.',
        'Seleziona un mazzo dalla sezione Mazzi e avvia l\'analisi.',
        'Scegli un obiettivo di ottimizzazione: Aggro, Control, Combo, Midrange, Tribal...',
        'L\'AI analizza la curva di mana, identifica sinergie e combo presenti e potenziali.',
        'Ricevi suggerimenti specifici su quali carte aggiungere e quali rimuovere.',
        'Ogni suggerimento include una spiegazione del perché quella carta migliora il mazzo.',
        '⚠️ Consuma 3 token per analisi.',
      ]
    },
    {
      id: 'ai-boost',
      icon: '💬',
      title: 'AI Boost (Chat Mazzo)',
      content: [
        'AI Boost è una chat AI per modificare un mazzo esistente in modo conversazionale.',
        'Apri un mazzo salvato e avvia la chat Boost dalla pagina del mazzo.',
        'Scrivi richieste in linguaggio naturale: "aggiungi più removal", "rendi il mazzo più veloce", "sostituisci le terre costose".',
        'L\'AI risponde con modifiche concrete alla lista, spiegando ogni scelta.',
        'La chat mantiene la memoria della sessione: puoi fare più richieste in sequenza.',
        'Puoi vincolare l\'AI a usare solo le carte della tua collezione.',
        'Al termine puoi salvare il mazzo modificato con un click.',
        '⚠️ Consuma 5 token per messaggio.',
      ]
    },
  ],
  en: [
    {
      id: 'welcome',
      icon: '🎉',
      title: 'Welcome! Your 100 Free Tokens',
      content: [
        'Thanks for signing up! You received 100 free welcome tokens.',
        'Tokens are the site currency: each AI feature or upload consumes some.',
        'With 100 tokens you can do a lot: upload collections, search decks, use all AI tools.',
        'Your token balance is always visible in the top bar 🪙.',
        'You can top up tokens anytime from the Token Shop (click the 🪙 balance).',
        '💡 Start by uploading your collection from the Home to instantly discover which decks you can build!',
      ]
    },
    {
      id: 'background',
      icon: '🖼️',
      title: 'Animated Background',
      content: [
        'The animated background displays rotating Magic card art.',
        'Toggle it on/off with the 🖼️ / 🚫 button in the top-right navigation bar.',
        'Your preference is saved automatically.',
        'The background is disabled by default for better performance.',
      ]
    },
    {
      id: 'privacy',
      icon: '🔒',
      title: 'Privacy & Account Deletion',
      content: [
        'Click the 🔒 button in the navbar to access privacy settings.',
        'From there you can view the Privacy Policy, Terms of Service, and manage cookies.',
        'To delete your account go to "Privacy Settings" → "Delete Account".',
        'Deletion has a 7-day grace period during which you can cancel.',
        'You can also export all your data before deleting your account.',
      ]
    },
    {
      id: 'logout',
      icon: '🚪',
      title: 'Logout',
      content: [
        'To log out click the 🚪 button in the top-right navbar.',
        'On mobile, open the hamburger menu ☰ and scroll down to find the "Logout" button.',
        'After logout you will be redirected to the login screen.',
      ]
    },
    {
      id: 'tokens',
      icon: '🪙',
      title: 'Tokens & Coupons',
      content: [
        'Tokens are the site currency. Each premium action consumes 1 token (upload, search, save deck, etc.).',
        'Your token balance is always visible in the navbar.',
        'To buy tokens click the 🪙 balance in the navbar to open the Token Shop.',
        'Available packages: Starter (10 tokens), Base (50), Pro (200), Mega (600), Ultra (1500).',
        'Have a coupon? In the Token Shop page find the "Enter Coupon" field to redeem it.',
        'Coupons add free tokens to your balance.',
      ]
    },
    {
      id: 'search',
      icon: '🔍',
      title: 'Deck Search (Home)',
      content: [
        'The main section lets you find competitive decks compatible with your cards.',
        '1. Click "Upload Collection" to upload an Excel/CSV file, or select a saved collection.',
        '2. Use filters to narrow results: colors, format, minimum completion.',
        '3. Choose the source: system decks (competitive), user decks, or both.',
        '4. Click "Find Compatible Decks" to start the search.',
        '5. Results show completion percentage and missing cards.',
        '⚠️ Card names in the file must be in ENGLISH.',
      ]
    },
    {
      id: 'collections',
      icon: '📚',
      title: 'Collections',
      content: [
        'Collections are archives of your physical cards.',
        'Go to "Collections" in the navbar to manage them.',
        'You can create multiple collections (e.g. one per binder or set).',
        'Upload cards via Excel/CSV file or add them manually.',
        'Each collection shows unique and total card counts.',
        'You can link a collection to a saved deck to track owned cards.',
        'From a collection you can also directly import a deck template.',
      ]
    },
    {
      id: 'card-search',
      icon: '🃏',
      title: 'Card Search',
      content: [
        'The "Cards" section lets you search the complete Magic: The Gathering database.',
        'Filter by name, colors, type, subtype, rarity, CMC, format, card text and more.',
        'Supports search in both Italian and English.',
        'Click a card to see full details and artwork.',
        'Sort results by name, CMC or rarity.',
        'The database contains over 33,000 unique cards.',
      ]
    },
    {
      id: 'decks',
      icon: '🗂️',
      title: 'Saved Decks',
      content: [
        'The "Decks" section contains all your saved decks.',
        'Save a deck from the main search, import from a file, or build manually.',
        'Each deck shows format, colors, archetype and completion percentage.',
        'Open a deck to view all cards, add/remove them, and manage quantities.',
        'You can make a deck "public" to share it with other users.',
        'Public decks appear in other users\' search results.',
        'From the deck page you can launch AI analysis directly.',
      ]
    },
    {
      id: 'ai-synergy',
      icon: '✨',
      title: 'AI Synergy Finder',
      content: [
        'The AI Synergy Finder finds compatible and synergistic cards starting from cards you already know.',
        'Enter 1 to 5 "seed" cards in the search field (with autocomplete).',
        'Optionally specify a format (Standard, Modern, Commander...) and a strategy (Aggro, Combo...).',
        'The AI analyzes the seed cards\' mechanics and suggests 15-25 synergistic cards.',
        'Results are grouped by role: Enabler, Payoff, Support, Removal, Ramp...',
        'Powerful synergy chains and combos are also shown.',
        'Filter by priority and copy the list with one click.',
        'Card names are clickable for more details.',
        '⚠️ Costs 1 token per search.',
      ]
    },
    {
      id: 'ai-twins',
      icon: '🪞',
      title: 'AI Twins',
      content: [
        'AI Twins finds cards that do exactly the same thing with different names.',
        'Useful to find budget replacements, upgrades, or discover equivalent cards you didn\'t know about.',
        'Enter 1 to 5 cards: the AI returns "functional twins" for each one.',
        'Each twin is classified into 4 categories:',
        '🪞 Functional Copy — nearly identical effect, different name/flavor.',
        '⬆️ Strictly Better — the twin is objectively better in almost all situations.',
        '⬇️ Strictly Worse — budget replacement or with minor drawbacks.',
        '↔️ Lateral — similar power level, different contexts or minor tradeoffs.',
        'Each card shows a similarity bar (%), key differences, and estimated price.',
        'Filter by relationship type and copy the full list with one click.',
        '⚠️ Costs 3 tokens per search.',
      ]
    },
    {
      id: 'ai-deck-builder',
      icon: '🏗️',
      title: 'AI Deck Builder',
      content: [
        'AI Deck Builder builds a complete deck from your free-text description.',
        'Write freely what you want: archetype, format, colors, strategy, budget...',
        'Examples: "Red aggro deck in Modern" or "Atraxa Commander with +1/+1 counters".',
        'You can specify format (Standard, Modern, Commander...), colors and budget.',
        'The AI generates a full deck with: card list, sideboard, strategy, key cards and upgrade suggestions.',
        'Cards in the result are clickable to search them in the internal database.',
        'Click "Save Deck" to save the generated deck to your Decks section.',
        'Copy the full list with one click to use it on other sites.',
        '⚠️ Costs 5 tokens per generation.',
      ]
    },
    {
      id: 'ai-analyzer',
      icon: '🤖',
      title: 'AI Deck Analyzer',
      content: [
        'AI Deck Analyzer analyzes one of your saved decks and suggests targeted improvements.',
        'Select a deck from the Decks section and launch the analysis.',
        'Choose an optimization goal: Aggro, Control, Combo, Midrange, Tribal...',
        'The AI analyzes the mana curve, identifies existing and potential synergies and combos.',
        'Receive specific suggestions on which cards to add and which to cut.',
        'Each suggestion includes an explanation of why that card improves the deck.',
        '⚠️ Costs 3 tokens per analysis.',
      ]
    },
    {
      id: 'ai-boost',
      icon: '💬',
      title: 'AI Boost (Deck Chat)',
      content: [
        'AI Boost is an AI chat for modifying an existing deck conversationally.',
        'Open a saved deck and launch the Boost chat from the deck page.',
        'Write requests in natural language: "add more removal", "make the deck faster", "replace expensive lands".',
        'The AI responds with concrete changes to the list, explaining each choice.',
        'The chat keeps session memory: you can make multiple requests in sequence.',
        'You can constrain the AI to only use cards from your collection.',
        'When done, save the modified deck with one click.',
        '⚠️ Costs 5 tokens per message.',
      ]
    },
  ]
}

function UserGuide({ language, setLanguage, onClose, isWelcomePage = false }) {
  const t = language === 'en' ? {
    title: isWelcomePage ? '🎉 Welcome to Magic Deck Builder!' : '👋 Welcome to Magic Deck Builder!',
    subtitle: isWelcomePage ? 'You received 100 free tokens — here\'s everything you can do' : 'Here\'s a quick guide to get you started',
    dontShow: 'Don\'t show this again',
    close: isWelcomePage ? 'Start building! 🚀' : 'Got it, let\'s go!',
    step: 'of',
  } : {
    title: isWelcomePage ? '🎉 Benvenuto in Magic Deck Builder!' : '👋 Benvenuto in Magic Deck Builder!',
    subtitle: isWelcomePage ? 'Hai ricevuto 100 token gratuiti — ecco tutto quello che puoi fare' : 'Ecco una guida rapida per iniziare',
    dontShow: 'Non mostrare più',
    close: isWelcomePage ? 'Inizia a costruire! 🚀' : 'Capito, iniziamo!',
    step: 'di',
  }

  const guide = sections[language] || sections.it
  const [activeSection, setActiveSection] = useState(0)
  const [dontShow, setDontShow] = useState(false)

  const handleClose = () => {
    if (!isWelcomePage && dontShow) {
      localStorage.setItem(`userGuide_dismissed_v${GUIDE_VERSION}`, 'true')
    }
    onClose()
  }

  const current = guide[activeSection]

  return (
    <div className="ug-overlay" onClick={handleClose}>
      <div className="ug-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ug-header">
          <div className="ug-header-text">
            <h2>{t.title}</h2>
            <p>{t.subtitle}</p>
          </div>
          <div className="ug-header-actions">
            {setLanguage && (
              <div className="ug-lang-switch">
                <button
                  className={`ug-lang-btn ${language === 'it' ? 'active' : ''}`}
                  onClick={() => setLanguage('it')}
                >🇮🇹</button>
                <button
                  className={`ug-lang-btn ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                >🇬🇧</button>
              </div>
            )}
            <button className="ug-close-x" onClick={handleClose}>✕</button>
          </div>
        </div>

        <div className="ug-body">
          {/* Sidebar nav */}
          <nav className="ug-nav">
            {guide.map((s, i) => (
              <button
                key={s.id}
                className={`ug-nav-item ${activeSection === i ? 'active' : ''}`}
                onClick={() => setActiveSection(i)}
              >
                <span className="ug-nav-icon">{s.icon}</span>
                <span className="ug-nav-label">{s.title}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="ug-content">
            <div className="ug-section-header">
              <span className="ug-section-icon">{current.icon}</span>
              <h3>{current.title}</h3>
              <span className="ug-step-counter">{activeSection + 1} {t.step} {guide.length}</span>
            </div>

            <ul className="ug-list">
              {current.content.map((line, i) => (
                <li key={i} className={line.startsWith('⚠️') ? 'ug-warning' : ''}>
                  {line}
                </li>
              ))}
            </ul>

            {/* Navigation arrows */}
            <div className="ug-nav-arrows">
              <button
                className="ug-arrow-btn"
                onClick={() => setActiveSection(i => Math.max(0, i - 1))}
                disabled={activeSection === 0}
              >
                ← {language === 'it' ? 'Precedente' : 'Previous'}
              </button>
              {activeSection < guide.length - 1 ? (
                <button
                  className="ug-arrow-btn ug-arrow-next"
                  onClick={() => setActiveSection(i => i + 1)}
                >
                  {language === 'it' ? 'Successivo' : 'Next'} →
                </button>
              ) : (
                <button className="ug-arrow-btn ug-arrow-finish" onClick={handleClose}>
                  {t.close} 🚀
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ug-footer">
          {!isWelcomePage && (
            <label className="ug-dont-show">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={e => setDontShow(e.target.checked)}
              />
              <span>{t.dontShow}</span>
            </label>
          )}
          <button className="ug-close-btn" onClick={handleClose}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserGuide
export { GUIDE_VERSION }
