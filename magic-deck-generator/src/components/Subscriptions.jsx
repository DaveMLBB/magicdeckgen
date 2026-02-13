import { useState, useEffect } from 'react'
import './Subscriptions.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function Subscriptions({ user, onBack, language }) {
  const [packages, setPackages] = useState([])
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const [stripeEnabled, setStripeEnabled] = useState(false)

  const translations = {
    it: {
      title: 'Token Shop',
      backToMain: '← Torna Indietro',
      currentBalance: 'Saldo Token',
      tokens: 'token',
      buyTokens: 'Acquista Token',
      purchase: 'Acquista',
      purchasing: 'Acquisto in corso...',
      bestValue: 'Miglior Valore',
      popular: 'Popolare',
      purchaseError: '❌ Errore: ',
      purchaseErrorGeneric: '❌ Errore durante l\'acquisto',
      stripeNotConfigured: 'Pagamenti non ancora configurati. Riprova più tardi.',
      paymentSuccess: '✅ Pagamento completato! I token sono stati accreditati.',
      paymentCancelled: 'Pagamento annullato.',
      recentActivity: 'Attività Recente',
      noActivity: 'Nessuna attività recente',
      tokenInfo: 'Ogni azione consuma 1 token:',
      actions: [
        'Caricamento file carte',
        'Ricerca mazzi compatibili',
        'Creazione collezione',
        'Salvataggio mazzo',
        'Ricerca mazzi pubblici'
      ],
      actionLabels: {
        'purchase': 'Acquisto',
        'upload': 'Caricamento',
        'search': 'Ricerca mazzi',
        'collection': 'Collezione',
        'save_deck': 'Salva mazzo',
        'public_search': 'Ricerca pubblica'
      },
      perToken: '/token',
      noTokens: 'Nessun token disponibile. Acquista un pacchetto per continuare!',
      testModeTitle: '🚧 Software in Fase di Test',
      testModeMessage: 'Il software è attualmente in fase di test. I pagamenti saranno disponibili quando le funzionalità non saranno più soltanto a scopo di test.'
    },
    en: {
      title: 'Token Shop',
      backToMain: '← Back',
      currentBalance: 'Token Balance',
      tokens: 'tokens',
      buyTokens: 'Buy Tokens',
      purchase: 'Purchase',
      purchasing: 'Purchasing...',
      bestValue: 'Best Value',
      popular: 'Popular',
      purchaseError: '❌ Error: ',
      purchaseErrorGeneric: '❌ Error during purchase',
      stripeNotConfigured: 'Payments not yet configured. Please try again later.',
      paymentSuccess: '✅ Payment completed! Tokens have been credited.',
      paymentCancelled: 'Payment cancelled.',
      recentActivity: 'Recent Activity',
      noActivity: 'No recent activity',
      tokenInfo: 'Each action consumes 1 token:',
      actions: [
        'Upload card file',
        'Search compatible decks',
        'Create collection',
        'Save deck',
        'Search public decks'
      ],
      actionLabels: {
        'purchase': 'Purchase',
        'upload': 'Upload',
        'search': 'Deck search',
        'collection': 'Collection',
        'save_deck': 'Save deck',
        'public_search': 'Public search'
      },
      perToken: '/token',
      noTokens: 'No tokens available. Purchase a package to continue!',
      testModeTitle: '🚧 Software in Testing Phase',
      testModeMessage: 'The software is currently in a testing phase. Payments will be available once the features are no longer for testing purposes only.'
    }
  }

  const t = translations[language]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load packages
      const pkgRes = await fetch(`${API_URL}/api/tokens/packages`)
      const pkgData = await pkgRes.json()
      setPackages(pkgData.packages)

      // Load balance and transactions
      const balRes = await fetch(`${API_URL}/api/tokens/balance?token=${user.token}`)
      const balData = await balRes.json()
      setBalance(balData.tokens)
      setTransactions(balData.transactions || [])

      // Check if Stripe is configured
      const stripeRes = await fetch(`${API_URL}/api/tokens/stripe-config`)
      const stripeData = await stripeRes.json()
      setStripeEnabled(stripeData.stripe_enabled)
    } catch (err) {
      console.error('Error loading data:', err)
    }
    setLoading(false)
  }

  // Handle Stripe Checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const stripeStatus = params.get('stripe_status')
    const pkg = params.get('package')
    if (stripeStatus === 'success') {
      const verifySession = async () => {
        try {
          const verifyRes = await fetch(`${API_URL}/api/tokens/verify-session?token=${user.token}&package=${pkg || ''}`, {
            method: 'POST'
          })
          const verifyData = await verifyRes.json()
          console.log('Token verify result:', verifyData)
        } catch (err) {
          console.error('Error verifying token session:', err)
        }
        alert(t.paymentSuccess)
        window.history.replaceState({}, '', window.location.pathname)
        loadData()
      }
      verifySession()
    } else if (stripeStatus === 'cancel') {
      alert(t.paymentCancelled)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handlePurchase = async (packageId) => {
    setPurchasing(packageId)

    try {
      if (!stripeEnabled) {
        alert(t.stripeNotConfigured)
        setPurchasing(null)
        return
      }

      const res = await fetch(`${API_URL}/api/tokens/purchase?token=${user.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: packageId })
      })
      const data = await res.json()

      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url
        return
      } else {
        alert(t.purchaseError + (data.detail || 'Unknown error'))
      }
    } catch (err) {
      console.error('Purchase error:', err)
      alert(t.purchaseErrorGeneric)
    }

    setPurchasing(null)
  }

  const getPricePerToken = (pkg) => {
    return (pkg.price / pkg.tokens).toFixed(2)
  }

  if (loading) {
    return (
      <div className="subscriptions-page">
        <div className="loading-container">
          <div className="spinner" style={{ width: '50px', height: '50px' }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="subscriptions-page">
      <header className="subscriptions-header">
        <div className="header-top">
          <button className="back-btn" onClick={onBack}>
            {t.backToMain}
          </button>
          <div className="header-actions">
            <span className="user-email">{user.email}</span>
          </div>
        </div>
        <h1>{t.title}</h1>
      </header>

      <main className="subscriptions-main">
        {/* Token Balance */}
        <div className="current-subscription">
          <h3>{t.currentBalance}</h3>
          <div className="token-balance-display">
            <span className="token-balance-amount">{balance ?? 0}</span>
            <span className="token-balance-label">{t.tokens}</span>
          </div>
          {balance === 0 && (
            <p className="no-tokens-warning">{t.noTokens}</p>
          )}
        </div>

        {/* Token Info */}
        <div className="token-info-section">
          <h4>{t.tokenInfo}</h4>
          <ul className="token-actions-list">
            {t.actions.map((action, i) => (
              <li key={i}><span className="token-action-icon">1</span> {action}</li>
            ))}
          </ul>
        </div>

        {/* Packages Grid */}
        <h2 className="plans-title">{t.buyTokens}</h2>
        <div className="plans-grid">
          {packages.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`plan-card ${pkg.featured ? 'featured' : ''} ${pkg.best_value ? 'featured' : ''}`}
            >
              {pkg.featured && <span className="featured-badge">{t.popular}</span>}
              {pkg.best_value && <span className="featured-badge">{t.bestValue}</span>}
              
              <div className="plan-header">
                <h4>{pkg.name}</h4>
                <div className="plan-price">
                  <span className="price-currency">€</span>
                  <span className="price-amount">{pkg.price}</span>
                </div>
                <div className="token-count">{pkg.tokens} {t.tokens}</div>
                <div className="price-per-token">€{getPricePerToken(pkg)}{t.perToken}</div>
              </div>

              <div className="plan-features">
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">{pkg.tokens} token</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">{language === 'it' ? 'Non scadono mai' : 'Never expire'}</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">{language === 'it' ? 'Nessun limite' : 'No limits'}</span>
                </div>
              </div>

              <button
                className="purchase-btn"
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing !== null}
              >
                {purchasing === pkg.id ? t.purchasing : `${t.purchase} - €${pkg.price}`}
              </button>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        {transactions.length > 0 && (
          <div className="recent-activity">
            <h3>{t.recentActivity}</h3>
            <div className="transactions-list">
              {transactions.map((tx) => (
                <div key={tx.id} className={`transaction-item ${tx.amount > 0 ? 'credit' : 'debit'}`}>
                  <div className="transaction-info">
                    <span className="transaction-action">
                      {t.actionLabels[tx.action] || tx.action}
                    </span>
                    {tx.description && (
                      <span className="transaction-desc">{tx.description}</span>
                    )}
                  </div>
                  <div className="transaction-amount">
                    <span className={tx.amount > 0 ? 'amount-positive' : 'amount-negative'}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                    <span className="transaction-date">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="subscriptions-footer">
        <p>Magic Deck Builder © 2026</p>
      </footer>
    </div>
  )
}

export default Subscriptions
