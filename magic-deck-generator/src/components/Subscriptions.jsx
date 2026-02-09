import { useState, useEffect } from 'react'
import './Subscriptions.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function Subscriptions({ user, onBack, language }) {
  const [plans, setPlans] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const [stripeEnabled, setStripeEnabled] = useState(false)

  const translations = {
    it: {
      title: 'Abbonamenti',
      backToMain: '← Torna Indietro',
      currentPlan: 'Piano Attuale',
      uploads: 'Caricamenti',
      remaining: 'Rimanenti',
      collections: 'Collezioni',
      deckSearches: 'Ricerche Mazzi',
      savedDecks: 'Mazzi Salvati',
      deckResults: 'Risultati Ricerca',
      expiresAt: 'Scade il',
      lifetime: 'A vita',
      selectPlan: 'Scegli Piano',
      purchase: 'Acquista',
      purchasing: 'Acquisto in corso...',
      month: 'mese',
      year: 'anno',
      forever: 'per sempre',
      best: 'Migliore',
      unlimited: 'Illimitati',
      uploads_count: 'caricamenti',
      valid_for: 'Valido per',
      days: 'giorni',
      purchaseSuccess: '✅ Abbonamento attivato con successo!',
      purchaseError: '❌ Errore: ',
      purchaseErrorGeneric: '❌ Errore durante l\'acquisto',
      redirectingToPayment: 'Reindirizzamento al pagamento...',
      stripeNotConfigured: 'Pagamenti non ancora configurati. Riprova più tardi.',
      paymentSuccess: '✅ Pagamento completato! Il tuo abbonamento è stato attivato.',
      paymentCancelled: 'Pagamento annullato.',
      processing: 'Elaborazione...',
      // Plan names
      planNames: {
        'Free': 'Gratuito',
        '10 Uploads': '10 Caricamenti',
        '30 Uploads': '30 Caricamenti',
        'Yearly Unlimited': 'Annuale Illimitato',
        'Lifetime Unlimited': 'A Vita Illimitato'
      },
      // Feature per piano
      planFeatures: {
        'free': [
          '10 caricamenti',
          '5 collezioni',
          '3 mazzi salvati',
          '20 carte uniche per collezione',
          '10 risultati ricerca mazzi'
        ],
        'monthly_10': [
          '30 caricamenti/mese',
          '10 collezioni',
          '10 mazzi salvati',
          'Carte illimitate',
          '20 risultati ricerca mazzi'
        ],
        'monthly_30': [
          '50 caricamenti/mese',
          '50 collezioni',
          '30 mazzi salvati',
          'Carte illimitate',
          '30 risultati ricerca mazzi'
        ],
        'yearly': [
          'Caricamenti illimitati',
          'Collezioni illimitate',
          '50 mazzi salvati',
          'Carte illimitate',
          'Risultati ricerca illimitati'
        ],
        'lifetime': [
          'Caricamenti illimitati',
          'Collezioni illimitate',
          'Mazzi salvati illimitati',
          'Carte illimitate',
          'Risultati ricerca illimitati',
          'Per sempre'
        ]
      }
    },
    en: {
      title: 'Subscriptions',
      backToMain: '← Back',
      currentPlan: 'Current Plan',
      uploads: 'Uploads',
      remaining: 'Remaining',
      collections: 'Collections',
      deckSearches: 'Deck Searches',
      savedDecks: 'Saved Decks',
      deckResults: 'Search Results',
      expiresAt: 'Expires on',
      lifetime: 'Lifetime',
      selectPlan: 'Choose Plan',
      purchase: 'Purchase',
      purchasing: 'Purchasing...',
      month: 'month',
      year: 'year',
      forever: 'forever',
      best: 'Best',
      unlimited: 'Unlimited',
      uploads_count: 'uploads',
      valid_for: 'Valid for',
      days: 'days',
      purchaseSuccess: '✅ Subscription activated successfully!',
      purchaseError: '❌ Error: ',
      purchaseErrorGeneric: '❌ Error during purchase',
      redirectingToPayment: 'Redirecting to payment...',
      stripeNotConfigured: 'Payments not yet configured. Please try again later.',
      paymentSuccess: '✅ Payment completed! Your subscription has been activated.',
      paymentCancelled: 'Payment cancelled.',
      processing: 'Processing...',
      // Plan names
      planNames: {
        'Free': 'Free',
        '10 Uploads': '10 Uploads',
        '30 Uploads': '30 Uploads',
        'Yearly Unlimited': 'Yearly Unlimited',
        'Lifetime Unlimited': 'Lifetime Unlimited'
      },
      // Features per plan
      planFeatures: {
        'free': [
          '10 uploads',
          '5 collections',
          '3 saved decks',
          '20 unique cards per collection',
          '10 deck search results'
        ],
        'monthly_10': [
          '30 uploads/month',
          '10 collections',
          '10 saved decks',
          'Unlimited cards',
          '20 deck search results'
        ],
        'monthly_30': [
          '50 uploads/month',
          '50 collections',
          '30 saved decks',
          'Unlimited cards',
          '30 deck search results'
        ],
        'yearly': [
          'Unlimited uploads',
          'Unlimited collections',
          '50 saved decks',
          'Unlimited cards',
          'Unlimited deck results'
        ],
        'lifetime': [
          'Unlimited uploads',
          'Unlimited collections',
          'Unlimited saved decks',
          'Unlimited cards',
          'Unlimited deck results',
          'Forever'
        ]
      }
    }
  }

  const t = translations[language]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Carica piani
      const plansRes = await fetch(`${API_URL}/api/subscriptions/plans`)
      const plansData = await plansRes.json()
      console.log('Plans from backend:', plansData.plans) // Debug
      setPlans(plansData.plans)

      // Carica stato abbonamento
      const statusRes = await fetch(`${API_URL}/api/subscriptions/status?token=${user.token}`)
      const statusData = await statusRes.json()
      setStatus(statusData)

      // Controlla se Stripe è configurato
      const stripeRes = await fetch(`${API_URL}/api/subscriptions/stripe-config`)
      const stripeData = await stripeRes.json()
      setStripeEnabled(stripeData.stripe_enabled)
    } catch (err) {
      console.error('Errore caricamento dati:', err)
    }
    setLoading(false)
  }

  // Gestisci ritorno da Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const stripeStatus = params.get('stripe_status')
    if (stripeStatus === 'success') {
      alert(t.paymentSuccess)
      // Pulisci URL
      window.history.replaceState({}, '', window.location.pathname)
      loadData()
    } else if (stripeStatus === 'cancel') {
      alert(t.paymentCancelled)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Ottieni le feature tradotte per un piano
  const getPlanFeatures = (planId) => {
    return t.planFeatures[planId] || t.planFeatures['free']
  }

  const handlePurchase = async (planId) => {
    setPurchasing(planId)

    try {
      if (planId === 'free') {
        // Downgrade a free - nessun pagamento
        const res = await fetch(`${API_URL}/api/subscriptions/purchase?token=${user.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: planId, payment_method: 'stripe' })
        })
        const data = await res.json()
        if (res.ok) {
          alert(t.purchaseSuccess)
          loadData()
        } else {
          alert(t.purchaseError + data.detail)
        }
      } else {
        // Piano a pagamento - usa Stripe Checkout
        if (!stripeEnabled) {
          alert(t.stripeNotConfigured)
          setPurchasing(null)
          return
        }

        const res = await fetch(`${API_URL}/api/subscriptions/create-checkout-session?token=${user.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: planId, payment_method: 'stripe' })
        })
        const data = await res.json()

        if (res.ok && data.checkout_url) {
          // Redirect a Stripe Checkout
          window.location.href = data.checkout_url
          return
        } else {
          alert(t.purchaseError + (data.detail || 'Unknown error'))
        }
      }
    } catch (err) {
      console.error('Errore acquisto:', err)
      alert(t.purchaseErrorGeneric)
    }

    setPurchasing(null)
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
        {status && (
          <div className="current-subscription">
            <h3>{t.currentPlan}: {status.plan_name}</h3>
            <div className="subscription-stats">
              {/* Uploads */}
              <div className="stat">
                <span className="stat-label">{t.uploads}</span>
                <span className="stat-value">{status.uploads_count} / {status.uploads_limit}</span>
              </div>
              
              {/* Collections */}
              {status.collections_limit ? (
                <div className="stat">
                  <span className="stat-label">{t.collections}</span>
                  <span className="stat-value">{status.collections_count} / {status.collections_limit}</span>
                </div>
              ) : (
                <div className="stat">
                  <span className="stat-label">{t.collections}</span>
                  <span className="stat-value highlight">{status.collections_count} / {t.unlimited}</span>
                </div>
              )}
              
              {/* Saved Decks */}
              <div className="stat">
                <span className="stat-label">{t.savedDecks}</span>
                <span className="stat-value highlight">
                  {(() => {
                    const type = status.subscription_type.toLowerCase()
                    if (type === 'free') return '3'
                    if (type === 'premium' || type === 'premium_monthly' || type === 'premium_10' || type === '10_uploads' || type === 'monthly_10') return '3'
                    if (type === 'premium_30' || type === '30_uploads' || type === 'premium_30_monthly' || type === 'monthly_30') return '5'
                    if (type === 'premium_annual' || type === 'yearly' || type === 'annual' || type === 'yearly_unlimited') return '50'
                    if (type === 'lifetime' || type === 'lifetime_unlimited') return t.unlimited
                    return '3' // default fallback
                  })()}
                </span>
              </div>
              
              {/* Deck Search Results */}
              {status.deck_results_limit ? (
                <div className="stat">
                  <span className="stat-label">{t.deckResults}</span>
                  <span className="stat-value">{status.searches_count} / {status.deck_results_limit}</span>
                </div>
              ) : (
                <div className="stat">
                  <span className="stat-label">{t.deckResults}</span>
                  <span className="stat-value highlight">{status.searches_count} / {t.unlimited}</span>
                </div>
              )}
              
              {status.expires_at && (
                <div className="stat">
                  <span className="stat-label">{t.expiresAt}</span>
                  <span className="stat-value">{new Date(status.expires_at).toLocaleDateString()}</span>
                </div>
              )}
              {!status.expires_at && status.subscription_type !== 'free' && (
                <div className="stat">
                  <span className="stat-value highlight">✨ {t.lifetime}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <h2 className="plans-title">{t.selectPlan}</h2>
        
        <div className="plans-grid">
          {plans
            .filter(plan => {
              if (status?.subscription_type === 'free') {
                return true
              }
              return plan.id !== 'free'
            })
            .map(plan => {
              const features = getPlanFeatures(plan.id)
              
              return (
                <div 
                  key={plan.id} 
                  className={`plan-card ${plan.id === status?.subscription_type ? 'current' : ''} ${plan.id === 'lifetime' ? 'featured' : ''}`}
                >
                  {plan.id === 'lifetime' && <div className="featured-badge">⭐ {t.best}</div>}
                  {plan.id === status?.subscription_type && <div className="current-badge">✓ {t.currentPlan}</div>}
                  
                  <div className="plan-header">
                    <h4>{t.planNames[plan.name] || plan.name}</h4>
                    <div className="plan-price">
                      {plan.price === 0 ? (
                        <span className="price-free">{language === 'it' ? 'Gratuito' : 'Free'}</span>
                      ) : (
                        <>
                          <span className="price-currency">€</span>
                          <span className="price-amount">{plan.price.toFixed(0)}</span>
                          {plan.duration_days && (
                            <span className="price-period">
                              /{plan.duration_days === 30 ? t.month : plan.duration_days === 365 ? t.year : `${plan.duration_days}${t.days}`}
                            </span>
                          )}
                          {!plan.duration_days && plan.id !== 'free' && (
                            <span className="price-period">/{t.forever}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="plan-features">
                    {features.map((feature, idx) => (
                      <div key={idx} className="feature">
                        <span className="feature-icon">✓</span>
                        <span className="feature-text">{feature.trim()}</span>
                      </div>
                    ))}
                  </div>

                  {plan.id !== status?.subscription_type && plan.id !== 'free' && (
                    <button 
                      className="purchase-btn"
                      onClick={() => handlePurchase(plan.id)}
                      disabled={purchasing !== null}
                    >
                      {purchasing === plan.id ? t.purchasing : t.purchase}
                    </button>
                  )}
                </div>
              )
            })}
        </div>
      </main>

      <footer className="subscriptions-footer">
        <p>Magic Deck Builder © 2026</p>
      </footer>
    </div>
  )
}

export default Subscriptions
