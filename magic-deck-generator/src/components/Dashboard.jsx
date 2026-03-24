import { useState, useEffect } from 'react'
import './Dashboard.css'
import FeedbackForm from './FeedbackForm'

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
    id: 'ai-deck-boost',
    icon: '⚡',
    labelIt: 'AI Deck Boost',
    labelEn: 'AI Deck Boost',
    descIt: 'Migliora i tuoi mazzi salvati tramite chat AI',
    descEn: 'Improve your saved decks via AI chat',
    color: '#f39c12',
    gradient: 'linear-gradient(135deg, #f39c12, #e67e22)',
  },
  {
    id: 'arena-import',
    icon: '🎮',
    labelIt: 'Arena Import',
    labelEn: 'Arena Import',
    descIt: 'Importa la tua collezione direttamente dal log di Magic Arena',
    descEn: 'Import your collection directly from the Magic Arena log',
    color: '#e84393',
    gradient: 'linear-gradient(135deg, #e84393, #a029b0)',
  },
  {
    id: 'card-scanner',
    icon: '📷',
    labelIt: 'Card Scanner',
    labelEn: 'Card Scanner',
    descIt: 'Scansiona le tue carte fisiche con la webcam e aggiungile alla collezione',
    descEn: 'Scan your physical cards with the webcam and add them to your collection',
    color: '#fd79a8',
    gradient: 'linear-gradient(135deg, #fd79a8, #e84393)',
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

const API_URL = import.meta.env.PROD
  ? 'https://api.mtgdecksbuilder.com'
  : 'http://localhost:8000'

// Feature IDs da mostrare nella sezione "Inizia da qui" per nuovi utenti
const GETTING_STARTED_IDS = ['ai-deck-builder', 'main', 'card-synergy', 'card-twins']

export default function Dashboard({ language, onNavigate, subscriptionStatus, user }) {
  const il = language === 'it'
  const [verifyBannerDismissed, setVerifyBannerDismissed] = useState(
    () => localStorage.getItem('verifyBannerDismissed') === 'true'
  )
  const [resendStatus, setResendStatus] = useState(null) // null | 'sending' | 'sent' | 'error'

  const showVerifyBanner = !user?.isVerified && !verifyBannerDismissed

  // Considera "nuovo utente" se ha ancora tutti o quasi tutti i token di benvenuto
  const isNewUser = subscriptionStatus && subscriptionStatus.tokens >= 90

  const t = {
    welcome: il ? 'Bentornato' : 'Welcome back',
    subtitle: il ? 'Cosa vuoi fare oggi?' : 'What do you want to do today?',
    tokens: il ? 'token disponibili' : 'tokens available',
    verifyBanner: il
      ? '⚠️ Verifica la tua email per sbloccare tutte le funzionalità. Controlla la casella di posta.'
      : '⚠️ Verify your email to unlock all features. Check your inbox.',
    resendEmail: il ? 'Reinvia email' : 'Resend email',
    resendSending: il ? 'Invio...' : 'Sending...',
    resendSent: il ? '✅ Email inviata!' : '✅ Email sent!',
    resendError: il ? '❌ Errore, riprova' : '❌ Error, try again',
    dismiss: il ? 'Ignora' : 'Dismiss',
    gettingStarted: il ? '🚀 Inizia da qui' : '🚀 Start here',
    gettingStartedDesc: il
      ? 'Queste sono le funzionalità più utili per cominciare. Hai 100 token gratuiti.'
      : 'These are the most useful features to start with. You have 100 free tokens.',
    allTools: il ? 'Tutti gli strumenti' : 'All tools',
  }

  const handleResendVerification = async () => {
    setResendStatus('sending')
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      })
      setResendStatus(res.ok ? 'sent' : 'error')
    } catch {
      setResendStatus('error')
    }
  }

  const handleDismissBanner = () => {
    localStorage.setItem('verifyBannerDismissed', 'true')
    setVerifyBannerDismissed(true)
  }

  const gettingStartedFeatures = features.filter(f => GETTING_STARTED_IDS.includes(f.id))

  return (
    <div className="dashboard">
      {/* Banner verifica email */}
      {showVerifyBanner && (
        <div className="dashboard-verify-banner">
          <span>{t.verifyBanner}</span>
          <div className="dashboard-verify-actions">
            <button
              className="dashboard-verify-btn"
              onClick={handleResendVerification}
              disabled={resendStatus === 'sending' || resendStatus === 'sent'}
            >
              {resendStatus === 'sending' ? t.resendSending
                : resendStatus === 'sent' ? t.resendSent
                : resendStatus === 'error' ? t.resendError
                : t.resendEmail}
            </button>
            <button className="dashboard-verify-dismiss" onClick={handleDismissBanner}>
              {t.dismiss}
            </button>
          </div>
        </div>
      )}

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
        {/* Sezione "Inizia da qui" per nuovi utenti */}
        {isNewUser && (
          <div className="dashboard-getting-started">
            <div className="dashboard-section-header">
              <h2 className="dashboard-section-title">{t.gettingStarted}</h2>
              <p className="dashboard-section-desc">{t.gettingStartedDesc}</p>
            </div>
            <div className="dashboard-grid dashboard-grid-highlight">
              {gettingStartedFeatures.map((feature) => (
                <button
                  key={feature.id}
                  className="dashboard-card dashboard-card-featured"
                  onClick={() => onNavigate(feature.id)}
                  style={{ '--card-gradient': feature.gradient, '--card-color': feature.color }}
                >
                  <div className="dashboard-card-glow" />
                  <div className="dashboard-card-icon">{feature.icon}</div>
                  <div className="dashboard-card-body">
                    <h3 className="dashboard-card-title">
                      {il ? feature.labelIt : feature.labelEn}
                    </h3>
                    <p className="dashboard-card-desc">
                      {il ? feature.descIt : feature.descEn}
                    </p>
                  </div>
                  <div className="dashboard-card-arrow">→</div>
                </button>
              ))}
            </div>
            <div className="dashboard-section-divider">
              <span>{t.allTools}</span>
            </div>
          </div>
        )}

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
                  {il ? feature.labelIt : feature.labelEn}
                </h3>
                <p className="dashboard-card-desc">
                  {il ? feature.descIt : feature.descEn}
                </p>
              </div>
              <div className="dashboard-card-arrow">→</div>
            </button>
          ))}
        </div>
      </div>
      <FeedbackForm user={user} language={language} />
    </div>
  )
}
