import './Dashboard.css'

const features = [
  {
    id: 'main',
    icon: '🔍',
    labelIt: 'Confronta Mazzi',
    labelEn: 'Deck Compare',
    descIt: 'Carica la tua collezione e trova i mazzi competitivi che puoi costruire',
    descEn: 'Upload your collection and find competitive decks you can build',
    color: '#6c5ce7',
    gradient: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  },
  {
    id: 'collections',
    icon: '📚',
    labelIt: 'Collezioni',
    labelEn: 'Collections',
    descIt: 'Gestisci le tue collezioni di carte Magic',
    descEn: 'Manage your Magic card collections',
    color: '#00b894',
    gradient: 'linear-gradient(135deg, #00b894, #55efc4)',
  },
  {
    id: 'card-search',
    icon: '🃏',
    labelIt: 'Cerca Carte',
    labelEn: 'Card Search',
    descIt: 'Cerca nel database di oltre 39.000 carte Magic',
    descEn: 'Search through 39,000+ Magic cards database',
    color: '#0984e3',
    gradient: 'linear-gradient(135deg, #0984e3, #74b9ff)',
  },
  {
    id: 'saved-decks',
    icon: '🗂️',
    labelIt: 'I Miei Mazzi',
    labelEn: 'My Decks',
    descIt: 'Visualizza e gestisci i tuoi mazzi salvati',
    descEn: 'View and manage your saved decks',
    color: '#e17055',
    gradient: 'linear-gradient(135deg, #e17055, #fab1a0)',
  },
  {
    id: 'ai-builder',
    icon: '🤖',
    labelIt: 'AI Analyzer',
    labelEn: 'AI Analyzer',
    descIt: 'Analizza il tuo mazzo con intelligenza artificiale',
    descEn: 'Analyze your deck with artificial intelligence',
    color: '#fd79a8',
    gradient: 'linear-gradient(135deg, #fd79a8, #fdcb6e)',
  },
  {
    id: 'card-synergy',
    icon: '✨',
    labelIt: 'AI Synergy',
    labelEn: 'AI Synergy',
    descIt: 'Scopri le sinergie tra le carte del tuo mazzo',
    descEn: 'Discover synergies between your deck cards',
    color: '#fdcb6e',
    gradient: 'linear-gradient(135deg, #fdcb6e, #e17055)',
  },
  {
    id: 'card-twins',
    icon: '🪞',
    labelIt: 'AI Gemelli',
    labelEn: 'AI Twins',
    descIt: 'Trova carte simili a quelle che già possiedi',
    descEn: 'Find cards similar to ones you already own',
    color: '#a29bfe',
    gradient: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
  },
  {
    id: 'ai-deck-builder',
    icon: '🏗️',
    labelIt: 'AI Deck Builder',
    labelEn: 'AI Deck Builder',
    descIt: 'Costruisci mazzi personalizzati con l\'AI',
    descEn: 'Build custom decks with AI assistance',
    color: '#00cec9',
    gradient: 'linear-gradient(135deg, #00cec9, #81ecec)',
  },
  {
    id: 'community',
    icon: '💬',
    labelIt: 'Community',
    labelEn: 'Community',
    descIt: 'Chatta e condividi con la community di giocatori',
    descEn: 'Chat and share with the player community',
    color: '#55efc4',
    gradient: 'linear-gradient(135deg, #55efc4, #00b894)',
  },
  {
    id: 'subscriptions',
    icon: '🪙',
    labelIt: 'Token Shop',
    labelEn: 'Token Shop',
    descIt: 'Acquista token per usare le funzionalità premium',
    descEn: 'Purchase tokens to use premium features',
    color: '#f9ca24',
    gradient: 'linear-gradient(135deg, #f9ca24, #f0932b)',
  },
]

export default function Dashboard({ language, onNavigate, subscriptionStatus, user }) {
  const t = {
    welcome: language === 'it' ? 'Bentornato' : 'Welcome back',
    subtitle: language === 'it'
      ? 'Cosa vuoi fare oggi?'
      : 'What do you want to do today?',
    tokens: language === 'it' ? 'token disponibili' : 'tokens available',
  }

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <div className="dashboard-hero-inner">
          <div className="dashboard-title-row">
            <div>
              <h1 className="dashboard-welcome">
                <span className="dashboard-emoji">🃏</span>
                {t.welcome}{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
              </h1>
              <p className="dashboard-subtitle">{t.subtitle}</p>
            </div>
            {subscriptionStatus && (
              <button
                className="dashboard-token-badge"
                onClick={() => onNavigate('subscriptions')}
                title={t.tokens}
              >
                🪙 <span className="token-count">{subscriptionStatus.tokens ?? 0}</span>
                <span className="token-label">{t.tokens}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid-container">
        <div className="dashboard-grid">
          {features.map((feature) => (
            <button
              key={feature.id}
              className="dashboard-card"
              onClick={() => onNavigate(feature.id)}
              style={{ '--card-gradient': feature.gradient, '--card-color': feature.color }}
            >
              <div className="dashboard-card-glow" />
              <div className="dashboard-card-icon">{feature.icon}</div>
              <div className="dashboard-card-body">
                <h3 className="dashboard-card-title">
                  {language === 'it' ? feature.labelIt : feature.labelEn}
                </h3>
                <p className="dashboard-card-desc">
                  {language === 'it' ? feature.descIt : feature.descEn}
                </p>
              </div>
              <div className="dashboard-card-arrow">→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
