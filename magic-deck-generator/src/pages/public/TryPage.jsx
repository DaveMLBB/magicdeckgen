import { useState, useEffect } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import AIDeckBuilderAnon from './AIDeckBuilderAnon'
import CardSynergyAnon from './CardSynergyAnon'
import CardTwinsAnon from './CardTwinsAnon'
import AIDeckBoostAnon from './AIDeckBoostAnon'
import TournamentDeckBuilderAnon from './TournamentDeckBuilderAnon'
import CardSearchAnon from './CardSearchAnon'
import PublicDecksAnon from './PublicDecksAnon'
import PublicCollectionsAnon from './PublicCollectionsAnon'
import ArenaImportAnon from './ArenaImportAnon'
import CardScannerAnon from './CardScannerAnon'
import FeedbackForm from '../../components/FeedbackForm'
import TrialLimitModal from '../../components/TrialLimitModal'
import ToolPageWrapper from './seo/ToolPageWrapper'
import PublicNav from '../../components/public/PublicNav'
import { isTrialLimitError, getTrialLimitMessage } from '../../utils/anonymousTrial'
import './TryPage.css'

const TOOLS = {
  it: [
    { id: 'deck-builder',   icon: '🏗️', title: 'AI Deck Builder',          desc: 'Costruisci un mazzo completo descrivendo la tua strategia',       badge: '2 prove/mese',  tokens: '5 🪙' },
    { id: 'synergy',        icon: '✨', title: 'AI Synergy Finder',          desc: 'Trova le carte più sinergiche per il tuo mazzo',                  badge: '2 prove/mese',  tokens: '3 🪙' },
    { id: 'twins',          icon: '🪞', title: 'AI Gemelli',                 desc: 'Trova alternative funzionali a qualsiasi carta',                  badge: '2 prove/mese',  tokens: '3 🪙' },
    { id: 'boost',          icon: '⚡', title: 'AI Deck Boost',              desc: 'Migliora il tuo mazzo con suggerimenti AI personalizzati',         badge: '1 prova/mese',  tokens: '5 🪙' },
    { id: 'tournament',     icon: '🏆', title: 'Tournament Deck Builder',    desc: 'Trova i mazzi torneo compatibili con le carte che possiedi',       badge: '5 prove/mese',  tokens: '1 🪙' },
    { id: 'card-search',    icon: '🔍', title: 'Cerca Carte',                desc: 'Esplora il database completo di carte Magic',                     badge: 'Gratuito',      tokens: null },
    { id: 'decks',          icon: '🃏', title: 'Mazzi Pubblici',             desc: 'Sfoglia i mazzi condivisi dalla community',                       badge: 'Gratuito',      tokens: null },
    { id: 'collections',    icon: '📚', title: 'Collezioni Pubbliche',       desc: 'Esplora le collezioni condivise dagli utenti',                    badge: 'Gratuito',      tokens: null },
    { id: 'arena-import',   icon: '📋', title: 'Arena Import',               desc: 'Importa e visualizza liste da MTG Arena o MTGO',                  badge: 'Gratuito',      tokens: null },
    { id: 'scanner',        icon: '📷', title: 'Scanner Carte',              desc: 'Identifica qualsiasi carta Magic per nome',                       badge: '3 prove/mese',  tokens: null },
    { id: 'feedback',       icon: '💬', title: 'Lascia un Feedback',         desc: 'Aiutaci a migliorare con la tua opinione',                        badge: 'Gratuito',      tokens: null },
  ],
  en: [
    { id: 'deck-builder',   icon: '🏗️', title: 'AI Deck Builder',          desc: 'Build a complete deck by describing your strategy',               badge: '2 tries/month', tokens: '5 🪙' },
    { id: 'synergy',        icon: '✨', title: 'AI Synergy Finder',          desc: 'Find the most synergistic cards for your deck',                   badge: '2 tries/month', tokens: '3 🪙' },
    { id: 'twins',          icon: '🪞', title: 'AI Twins',                   desc: 'Find functional alternatives to any card',                        badge: '2 tries/month', tokens: '3 🪙' },
    { id: 'boost',          icon: '⚡', title: 'AI Deck Boost',              desc: 'Improve your deck with personalized AI suggestions',              badge: '1 try/month',   tokens: '5 🪙' },
    { id: 'tournament',     icon: '🏆', title: 'Tournament Deck Builder',    desc: 'Find tournament decks compatible with your cards',                badge: '5 tries/month', tokens: '1 🪙' },
    { id: 'card-search',    icon: '🔍', title: 'Card Search',                desc: 'Explore the complete Magic card database',                        badge: 'Free',          tokens: null },
    { id: 'decks',          icon: '🃏', title: 'Public Decks',               desc: 'Browse community-shared decks',                                   badge: 'Free',          tokens: null },
    { id: 'collections',    icon: '📚', title: 'Public Collections',         desc: 'Explore collections shared by users',                             badge: 'Free',          tokens: null },
    { id: 'arena-import',   icon: '📋', title: 'Arena Import',               desc: 'Import and preview lists from MTG Arena or MTGO',                 badge: 'Free',          tokens: null },
    { id: 'scanner',        icon: '📷', title: 'Card Scanner',               desc: 'Identify any Magic card by name',                                 badge: '3 tries/month', tokens: null },
    { id: 'feedback',       icon: '💬', title: 'Leave Feedback',             desc: 'Help us improve with your opinion',                               badge: 'Free',          tokens: null },
  ],
}

export default function TryPage({ lang = 'it' }) {
  const navigate = useNavigate()
  const { toolId } = useParams()
  const [activeTool, setActiveTool] = useState(toolId || null)
  const [trialLimitInfo, setTrialLimitInfo] = useState(null)
  const language = lang

  // Sincronizza activeTool con il parametro URL
  useEffect(() => {
    setActiveTool(toolId || null)
  }, [toolId])

  const handleTrialLimit = (data) => {
    const msg = getTrialLimitMessage(data, language)
    setTrialLimitInfo({ message: msg })
  }

  const handleSelectTool = (id) => {
    const base = language === 'en' ? '/en/try' : '/try'
    navigate(`${base}/${id}`)
  }

  const handleBack = () => {
    const base = language === 'en' ? '/en/try' : '/try'
    navigate(base)
  }

  const tools = TOOLS[language] || TOOLS.it

  const trialModal = trialLimitInfo && (
    <TrialLimitModal
      message={trialLimitInfo.message}
      language={language}
      onClose={() => setTrialLimitInfo(null)}
      onRegister={() => navigate('/')}
    />
  )

  const commonProps = { language, onBack: handleBack, onTrialLimit: handleTrialLimit }

  if (activeTool === 'deck-builder') return (
    <ToolPageWrapper toolId="deck-builder" lang={language}>
      <AIDeckBuilderAnon {...commonProps} />{trialModal}
    </ToolPageWrapper>
  )
  if (activeTool === 'synergy') return (
    <ToolPageWrapper toolId="synergy" lang={language}>
      <CardSynergyAnon {...commonProps} />{trialModal}
    </ToolPageWrapper>
  )
  if (activeTool === 'twins') return (
    <ToolPageWrapper toolId="twins" lang={language}>
      <CardTwinsAnon {...commonProps} />{trialModal}
    </ToolPageWrapper>
  )
  if (activeTool === 'boost')        return <><AIDeckBoostAnon {...commonProps} />{trialModal}</>
  if (activeTool === 'tournament')   return (
    <ToolPageWrapper toolId="tournament" lang={language}>
      <TournamentDeckBuilderAnon {...commonProps} />{trialModal}
    </ToolPageWrapper>
  )
  if (activeTool === 'card-search')  return <CardSearchAnon language={language} onBack={handleBack} />
  if (activeTool === 'decks')        return <Navigate to="/decks" replace />
  if (activeTool === 'collections')  return <PublicCollectionsAnon language={language} onBack={handleBack} />
  if (activeTool === 'arena-import') return <ArenaImportAnon language={language} onBack={handleBack} />
  if (activeTool === 'scanner')      return <><CardScannerAnon {...commonProps} />{trialModal}</>

  if (activeTool === 'feedback') {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: '0 0 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
          <button onClick={handleBack} style={{ background: '#334155', color: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
            {language === 'it' ? '← Indietro' : '← Back'}
          </button>
        </div>
        <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
          <FeedbackForm user={null} language={language} />
        </div>
      </div>
    )
  }

  return (
    <div className="try-page">
      <div className="try-header">
        <button className="try-back-btn" onClick={() => navigate('/')}>← Home</button>
        <div className="try-header-content">
          <h1>{language === 'it' ? '🧪 Prova Gratis' : '🧪 Try for Free'}</h1>
          <p>{language === 'it'
            ? 'Tutti gli strumenti disponibili senza registrazione. Alcuni hanno un limite mensile.'
            : 'All tools available without registration. Some have a monthly limit.'}</p>
        </div>
        <button className="try-register-btn" onClick={() => navigate('/')}>
          {language === 'it' ? '🚀 Registrati Gratis' : '🚀 Sign Up Free'}
        </button>
      </div>

      <div className="try-tools-grid">
        {tools.map(tool => (
          <div key={tool.id} className="try-tool-card" onClick={() => handleSelectTool(tool.id)}>
            <div className="try-tool-icon">{tool.icon}</div>
            <h2 className="try-tool-title">{tool.title}</h2>
            <p className="try-tool-desc">{tool.desc}</p>
            <div className="try-tool-footer">
              <span className={`try-trial-badge ${tool.badge === 'Gratuito' || tool.badge === 'Free' ? 'free' : ''}`}>
                {tool.badge}
              </span>
              {tool.tokens && (
                <span className="try-token-cost">{tool.tokens} {language === 'it' ? 'dopo registrazione' : 'after signup'}</span>
              )}
            </div>
            <button className="try-tool-btn">
              {language === 'it' ? 'Prova ora →' : 'Try now →'}
            </button>
          </div>
        ))}
      </div>

      <div className="try-cta-banner">
        <p>{language === 'it'
          ? '🎁 Registrati gratis e ricevi 100 token — accesso illimitato a tutti gli strumenti AI'
          : '🎁 Sign up free and get 100 tokens — unlimited access to all AI tools'}</p>
        <button className="try-cta-btn" onClick={() => navigate('/')}>
          {language === 'it' ? 'Registrati Gratis' : 'Sign Up Free'}
        </button>
      </div>

      {/* SEO text block — real content for indexing */}
      <div className="try-seo-block">
        <div className="try-seo-inner">
          {language === 'en' ? (
            <>
              <h2>Free MTG Tools — No Registration Required</h2>
              <p>
                Magic Deck Builder offers a complete suite of AI-powered tools for Magic: The Gathering players.
                Try every tool for free without creating an account. Build decks, find synergies, discover card
                alternatives, and match your collection against 7,200+ tournament decklists — all in your browser.
              </p>
              <h3>What Each Tool Does</h3>
              <ul>
                <li><strong>AI Deck Builder</strong> — Describe any deck in plain text and get a complete, tournament-ready list with sideboard, strategy notes, and upgrade path. Works for all formats: Standard, Modern, Pioneer, Legacy, Commander, Pauper, and more.</li>
                <li><strong>AI Synergy Finder</strong> — Enter 1–5 seed cards and discover the most synergistic cards to build around them. Results are grouped by role: Enabler, Payoff, Removal, Ramp, and Support.</li>
                <li><strong>AI Card Twins</strong> — Find functional equivalents for any card. Budget replacements, upgrades, or cards that fill the same role. Each result rated: Functional Copy, Superior, Inferior, or Lateral.</li>
                <li><strong>Tournament Deck Builder</strong> — Upload your collection and instantly see which of 7,200+ competitive tournament decks you can build. See your completion % and exactly which cards you're missing.</li>
                <li><strong>Card Search</strong> — Search 392,000+ Magic cards by name, type, color, CMC, format, rarity, and card text. Full Italian and English support.</li>
                <li><strong>Arena Import</strong> — Paste any deck list from MTG Arena or MTGO and instantly visualize it with card images, mana curve, and type breakdown.</li>
              </ul>
              <h3>How the Free Trial Works</h3>
              <p>
                AI tools (Deck Builder, Synergy Finder, Card Twins) have a monthly free trial limit — 2 uses per month
                without registration. Card Search, Arena Import, and Public Decks are completely free with no limits.
                Sign up free to get 100 welcome tokens and unlock unlimited access to all AI tools.
              </p>
            </>
          ) : (
            <>
              <h2>Strumenti MTG Gratuiti — Senza Registrazione</h2>
              <p>
                Magic Deck Builder offre una suite completa di strumenti AI per i giocatori di Magic: The Gathering.
                Prova ogni strumento gratuitamente senza creare un account. Costruisci mazzi, trova sinergie, scopri
                alternative alle carte e confronta la tua collezione con 7.200+ decklist da torneo — tutto nel browser.
              </p>
              <h3>Cosa Fa Ogni Strumento</h3>
              <ul>
                <li><strong>AI Deck Builder</strong> — Descrivi qualsiasi mazzo in testo libero e ottieni una lista completa e pronta per tornei con sideboard, note strategiche e percorso di upgrade. Funziona per tutti i formati: Standard, Modern, Pioneer, Legacy, Commander, Pauper e altri.</li>
                <li><strong>AI Synergy Finder</strong> — Inserisci 1–5 carte di partenza e scopri le carte più sinergiche per costruire attorno ad esse. I risultati sono raggruppati per ruolo: Enabler, Payoff, Removal, Ramp e Support.</li>
                <li><strong>AI Card Twins</strong> — Trova equivalenti funzionali per qualsiasi carta. Sostituti budget, upgrade o carte che ricoprono lo stesso ruolo. Ogni risultato valutato: Copia Funzionale, Superiore, Inferiore o Laterale.</li>
                <li><strong>Tournament Deck Builder</strong> — Carica la tua collezione e vedi istantaneamente quali dei 7.200+ mazzi da torneo competitivi puoi costruire. Vedi la tua % di completamento e esattamente quali carte ti mancano.</li>
                <li><strong>Cerca Carte</strong> — Cerca 392.000+ carte Magic per nome, tipo, colore, CMC, formato, rarità e testo. Supporto completo italiano e inglese.</li>
                <li><strong>Arena Import</strong> — Incolla qualsiasi lista di mazzi da MTG Arena o MTGO e visualizzala istantaneamente con immagini delle carte, curva di mana e suddivisione per tipo.</li>
              </ul>
              <h3>Come Funziona la Prova Gratuita</h3>
              <p>
                Gli strumenti AI (Deck Builder, Synergy Finder, Card Twins) hanno un limite di prova mensile gratuita —
                2 utilizzi al mese senza registrazione. Cerca Carte, Arena Import e Mazzi Pubblici sono completamente
                gratuiti senza limiti. Registrati gratis per ottenere 100 token di benvenuto e sbloccare l'accesso
                illimitato a tutti gli strumenti AI.
              </p>
            </>
          )}
        </div>
      </div>

      {trialModal}
    </div>
  )
}
