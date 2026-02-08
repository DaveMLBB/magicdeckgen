import { useState, useEffect } from 'react'
import './Subscriptions.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function Subscriptions({ user, onClose, language }) {
  const [plans, setPlans] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)

  const translations = {
    it: {
      title: 'Abbonamenti',
      currentPlan: 'Piano Attuale',
      uploads: 'Caricamenti',
      remaining: 'Rimanenti',
      collections: 'Collezioni',
      deckSearches: 'Ricerche Mazzi',
      expiresAt: 'Scade il',
      lifetime: 'A vita',
      selectPlan: 'Scegli Piano',
      purchase: 'Acquista',
      purchasing: 'Acquisto in corso...',
      close: 'Chiudi',
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
      // Plan names
      planNames: {
        'Free': 'Gratuito',
        '10 Uploads': '10 Caricamenti',
        '30 Uploads': '30 Caricamenti',
        'Yearly Unlimited': 'Annuale Illimitato',
        'Lifetime Unlimited': 'A Vita Illimitato'
      },
      // Plan descriptions
      planDescriptions: {
        '3 free uploads': '3 caricamenti gratuiti',
        '10 uploads for 1 month': '10 caricamenti per 1 mese',
        '30 uploads for 1 month': '30 caricamenti per 1 mese',
        'Unlimited uploads for 1 year': 'Caricamenti illimitati per 1 anno',
        'Unlimited uploads forever': 'Caricamenti illimitati per sempre',
        '3 uploads • 5 collections • 20 unique cards per collection': '3 caricamenti • 5 collezioni • 20 carte uniche per collezione',
        '10 uploads/month • 10 collections • Unlimited cards': '10 caricamenti/mese • 10 collezioni • Carte illimitate',
        '30 uploads/month • 50 collections • Unlimited cards': '30 caricamenti/mese • 50 collezioni • Carte illimitate',
        'Unlimited uploads • Unlimited collections • Unlimited cards': 'Caricamenti illimitati • Collezioni illimitate • Carte illimitate',
        'Unlimited uploads • Unlimited collections • Unlimited cards • Forever': 'Caricamenti illimitati • Collezioni illimitate • Carte illimitate • Per sempre',
        '3 uploads • 5 collections • 20 unique cards per collection • 10 deck results': '3 caricamenti • 5 collezioni • 20 carte uniche per collezione • 10 risultati mazzi',
        '10 uploads/month • 10 collections • Unlimited cards • 20 deck results': '10 caricamenti/mese • 10 collezioni • Carte illimitate • 20 risultati mazzi',
        '30 uploads/month • 50 collections • Unlimited cards • 30 deck results': '30 caricamenti/mese • 50 collezioni • Carte illimitate • 30 risultati mazzi',
        'Unlimited uploads • Unlimited collections • Unlimited cards • Unlimited deck results': 'Caricamenti illimitati • Collezioni illimitate • Carte illimitate • Risultati mazzi illimitati',
        'Unlimited uploads • Unlimited collections • Unlimited cards • Unlimited deck results • Forever': 'Caricamenti illimitati • Collezioni illimitate • Carte illimitate • Risultati mazzi illimitati • Per sempre'
      }
    },
    en: {
      title: 'Subscriptions',
      currentPlan: 'Current Plan',
      uploads: 'Uploads',
      remaining: 'Remaining',
      collections: 'Collections',
      deckSearches: 'Deck Searches',
      expiresAt: 'Expires on',
      lifetime: 'Lifetime',
      selectPlan: 'Choose Plan',
      purchase: 'Purchase',
      purchasing: 'Purchasing...',
      close: 'Close',
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
      // Plan names (no translation needed for English)
      planNames: {
        'Free': 'Free',
        '10 Uploads': '10 Uploads',
        '30 Uploads': '30 Uploads',
        'Yearly Unlimited': 'Yearly Unlimited',
        'Lifetime Unlimited': 'Lifetime Unlimited'
      },
      // Plan descriptions (no translation needed for English)
      planDescriptions: {
        '3 free uploads': '3 free uploads',
        '10 uploads for 1 month': '10 uploads for 1 month',
        '30 uploads for 1 month': '30 uploads for 1 month',
        'Unlimited uploads for 1 year': 'Unlimited uploads for 1 year',
        'Unlimited uploads forever': 'Unlimited uploads forever',
        '3 uploads • 5 collections • 20 unique cards per collection': '3 uploads • 5 collections • 20 unique cards per collection',
        '10 uploads/month • 10 collections • Unlimited cards': '10 uploads/month • 10 collections • Unlimited cards',
        '30 uploads/month • 50 collections • Unlimited cards': '30 uploads/month • 50 collections • Unlimited cards',
        'Unlimited uploads • Unlimited collections • Unlimited cards': 'Unlimited uploads • Unlimited collections • Unlimited cards',
        'Unlimited uploads • Unlimited collections • Unlimited cards • Forever': 'Unlimited uploads • Unlimited collections • Unlimited cards • Forever',
        '3 uploads • 5 collections • 20 unique cards per collection • 10 deck results': '3 uploads • 5 collections • 20 unique cards per collection • 10 deck results',
        '10 uploads/month • 10 collections • Unlimited cards • 20 deck results': '10 uploads/month • 10 collections • Unlimited cards • 20 deck results',
        '30 uploads/month • 50 collections • Unlimited cards • 30 deck results': '30 uploads/month • 50 collections • Unlimited cards • 30 deck results',
        'Unlimited uploads • Unlimited collections • Unlimited cards • Unlimited deck results': 'Unlimited uploads • Unlimited collections • Unlimited cards • Unlimited deck results',
        'Unlimited uploads • Unlimited collections • Unlimited cards • Unlimited deck results • Forever': 'Unlimited uploads • Unlimited collections • Unlimited cards • Unlimited deck results • Forever'
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
      setPlans(plansData.plans)

      // Carica stato abbonamento
      const statusRes = await fetch(`${API_URL}/api/subscriptions/status?token=${user.token}`)
      const statusData = await statusRes.json()
      setStatus(statusData)
    } catch (err) {
      console.error('Errore caricamento dati:', err)
    }
    setLoading(false)
  }

  const handlePurchase = async (planId) => {
    setPurchasing(planId)

    try {
      const res = await fetch(`${API_URL}/api/subscriptions/purchase?token=${user.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          payment_method: 'stripe'
        })
      })

      const data = await res.json()

      if (res.ok) {
        alert(t.purchaseSuccess)
        loadData()
      } else {
        alert(t.purchaseError + data.detail)
      }
    } catch (err) {
      console.error('Errore acquisto:', err)
      alert(t.purchaseErrorGeneric)
    }

    setPurchasing(null)
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content subscriptions-modal">
          <div className="spinner" style={{ width: '50px', height: '50px', margin: '2rem auto' }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content subscriptions-modal">
        <button className="close-modal-btn" onClick={onClose}>✕</button>
        
        <h2>{t.title}</h2>

        {status && (
          <div className="current-subscription">
            <h3>{t.currentPlan}: {status.plan_name}</h3>
            <div className="subscription-stats">
              {/* Uploads */}
              <div className="stat">
                <span className="stat-label">{t.uploads}:</span>
                <span className="stat-value">{status.uploads_count} / {status.uploads_limit}</span>
              </div>
              
              {/* Collections */}
              {status.collections_limit && (
                <div className="stat">
                  <span className="stat-label">{t.collections}:</span>
                  <span className="stat-value">{status.collections_count} / {status.collections_limit}</span>
                </div>
              )}
              
              {!status.collections_limit && (
                <div className="stat">
                  <span className="stat-label">{t.collections}:</span>
                  <span className="stat-value highlight">{status.collections_count} / {t.unlimited}</span>
                </div>
              )}
              
              {/* Deck Searches */}
              {status.searches_limit && (
                <div className="stat">
                  <span className="stat-label">{t.deckSearches}:</span>
                  <span className="stat-value">{status.searches_count} / {status.searches_limit}</span>
                </div>
              )}
              
              {!status.searches_limit && (
                <div className="stat">
                  <span className="stat-label">{t.deckSearches}:</span>
                  <span className="stat-value highlight">{status.searches_count} / {t.unlimited}</span>
                </div>
              )}
              
              {status.expires_at && (
                <div className="stat">
                  <span className="stat-label">{t.expiresAt}:</span>
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

        <h3 className="plans-title">{t.selectPlan}</h3>
        
        <div className="plans-grid">
          {plans
            .filter(plan => {
              // Se l'utente è free, mostra tutti i piani (incluso free per confronto)
              if (status?.subscription_type === 'free') {
                return true
              }
              // Se l'utente ha un abbonamento attivo, nascondi il piano free
              return plan.id !== 'free'
            })
            .map(plan => {
              // Parse description to extract features
              const descriptionText = t.planDescriptions[plan.description] || plan.description
              const features = descriptionText.split(' • ')
              
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

        <button className="close-btn" onClick={onClose}>{t.close}</button>
      </div>
    </div>
  )
}

export default Subscriptions
