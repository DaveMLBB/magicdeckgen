import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

  if (activeTool === 'deck-builder') return <><AIDeckBuilderAnon {...commonProps} />{trialModal}</>
  if (activeTool === 'synergy')      return <><CardSynergyAnon {...commonProps} />{trialModal}</>
  if (activeTool === 'twins')        return <><CardTwinsAnon {...commonProps} />{trialModal}</>
  if (activeTool === 'boost')        return <><AIDeckBoostAnon {...commonProps} />{trialModal}</>
  if (activeTool === 'tournament')   return <><TournamentDeckBuilderAnon {...commonProps} />{trialModal}</>
  if (activeTool === 'card-search')  return <CardSearchAnon language={language} onBack={handleBack} />
  if (activeTool === 'decks')        return <PublicDecksAnon language={language} onBack={handleBack} />
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

      {trialModal}
    </div>
  )
}
