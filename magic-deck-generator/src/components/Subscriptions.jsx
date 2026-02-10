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
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

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
      cancelSubscription: 'Annulla Abbonamento',
      cancelConfirmTitle: 'Annulla Abbonamento',
      cancelConfirmMessage: 'Sei sicuro di voler annullare il tuo abbonamento? Manterrai l\'accesso fino alla fine del periodo di fatturazione corrente, poi tornerai al piano gratuito.',
      cancelConfirm: 'Sì, Annulla',
      cancelBack: 'No, Torna Indietro',
      cancelSuccess: '✅ Abbonamento annullato. Rimarrà attivo fino alla scadenza del periodo corrente.',
      cancelError: '❌ Errore nell\'annullamento: ',
      cancelling: 'Annullamento in corso...',
      testModeTitle: '🚧 Software in Fase di Test',
      testModeMessage: 'Il software è attualmente in fase di test. Gli abbonamenti a pagamento saranno disponibili quando le funzionalità non saranno più soltanto a scopo di test. Al momento è disponibile solo il piano gratuito.',
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
      cancelSubscription: 'Cancel Subscription',
      cancelConfirmTitle: 'Cancel Subscription',
      cancelConfirmMessage: 'Are you sure you want to cancel your subscription? You will keep access until the end of the current billing period, then revert to the free plan.',
      cancelConfirm: 'Yes, Cancel',
      cancelBack: 'No, Go Back',
      cancelSuccess: '✅ Subscription cancelled. It will remain active until the end of the current billing period.',
      cancelError: '❌ Cancellation error: ',
      cancelling: 'Cancelling...',
      testModeTitle: '🚧 Software in Testing Phase',
      testModeMessage: 'The software is currently in a testing phase. Paid subscriptions will be available once the features are no longer for testing purposes only. Currently, only the free plan is available.',
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
    const plan = params.get('plan')
    if (stripeStatus === 'success') {
      // Verifica la sessione Stripe e attiva l'abbonamento
      const verifySession = async () => {
        try {
          const verifyRes = await fetch(`${API_URL}/api/subscriptions/verify-session?token=${user.token}&plan=${plan || ''}`, {
            method: 'POST'
          })
          const verifyData = await verifyRes.json()
          console.log('Stripe verify result:', verifyData)
        } catch (err) {
          console.error('Error verifying Stripe session:', err)
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

  const handleCancelSubscription = async () => {
    setCancelling(true)
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/cancel-subscription?token=${user.token}`, {
        method: 'POST'
      })
      const data = await res.json()
      if (res.ok) {
        alert(t.cancelSuccess)
        setShowCancelModal(false)
        loadData()
      } else {
        alert(t.cancelError + (data.detail || ''))
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err)
      alert(t.cancelError + 'Unknown error')
    }
    setCancelling(false)
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
            {status.subscription_type !== 'free' && status.subscription_type !== 'lifetime' && (
              <button 
                className="cancel-subscription-btn"
                onClick={() => setShowCancelModal(true)}
              >
                {t.cancelSubscription}
              </button>
            )}
          </div>
        )}

        <div className="test-mode-banner">
          <h3>{t.testModeTitle}</h3>
          <p>{t.testModeMessage}</p>
        </div>
      </main>

      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ {t.cancelConfirmTitle}</h2>
            <p className="cancel-message">{t.cancelConfirmMessage}</p>
            {status?.expires_at && (
              <p className="cancel-expiry">
                {t.expiresAt}: <strong>{new Date(status.expires_at).toLocaleDateString()}</strong>
              </p>
            )}
            <div className="modal-actions">
              <button 
                className="cancel-back-btn"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                {t.cancelBack}
              </button>
              <button 
                className="cancel-confirm-btn"
                onClick={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? t.cancelling : t.cancelConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="subscriptions-footer">
        <p>Magic Deck Builder © 2026</p>
      </footer>
    </div>
  )
}

export default Subscriptions
