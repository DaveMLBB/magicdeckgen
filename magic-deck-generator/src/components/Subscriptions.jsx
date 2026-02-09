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
      // Plan names
      planNames: {
        'Free': 'Gratuito',
        '10 Uploads': '10 Caricamenti',
        '30 Uploads': '30 Caricamenti',
        'Yearly Unlimited': 'Annuale Illimitato',
        'Lifetime Unlimited': 'A Vita Illimitato'
      },
      // Plan descriptions with deck limits
      planDescriptions: {
        '3 free uploads': '3 caricamenti gratuiti',
        '10 uploads for 1 month': '10 caricamenti per 1 mese',
        '30 uploads for 1 month': '30 caricamenti per 1 mese',
        'Unlimited uploads for 1 year': 'Caricamenti illimitati per 1 anno',
        'Unlimited uploads forever': 'Caricamenti illimitati per sempre',
        '3 uploads • 5 collections • 20 unique cards per collection': '3 caricamenti • 5 collezioni • 20 carte uniche • 3 mazzi salvabili',
        '10 uploads/month • 10 collections • Unlimited cards': '10 caricamenti/mese • 10 collezioni • Carte illimitate • 5 mazzi salvabili',
        '30 uploads/month • 50 collections • Unlimited cards': '30 caricamenti/mese • 50 collezioni • Carte illimitate • 10 mazzi salvabili',
        'Unlimited uploads • Unlimited collections • Unlimited cards': 'Caricamenti illimitati • Collezioni illimitate • Carte illimitate • Mazzi illimitati',
        'Unlimited uploads • Unlimited collections • Unlimited cards • Forever': 'Caricamenti illimitati • Collezioni illimitate • Carte illimitate • Mazzi illimitati'
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
      // Plan names
      planNames: {
        'Free': 'Free',
        '10 Uploads': '10 Uploads',
        '30 Uploads': '30 Uploads',
        'Yearly Unlimited': 'Yearly Unlimited',
        'Lifetime Unlimited': 'Lifetime Unlimited'
      },
      // Plan descriptions with deck limits
      planDescriptions: {
        '3 free uploads': '3 free uploads',
        '10 uploads for 1 month': '10 uploads for 1 month',
        '30 uploads for 1 month': '30 uploads for 1 month',
        'Unlimited uploads for 1 year': 'Unlimited uploads for 1 year',
        'Unlimited uploads forever': 'Unlimited uploads forever',
        '3 uploads • 5 collections • 20 unique cards per collection': '3 uploads • 5 collections • 20 unique cards • 3 saved decks',
        '10 uploads/month • 10 collections • Unlimited cards': '10 uploads/month • 10 collections • Unlimited cards • 5 saved decks',
        '30 uploads/month • 50 collections • Unlimited cards': '30 uploads/month • 50 collections • Unlimited cards • 10 saved decks',
        'Unlimited uploads • Unlimited collections • Unlimited cards': 'Unlimited uploads • Unlimited collections • Unlimited cards • Unlimited decks',
        'Unlimited uploads • Unlimited collections • Unlimited cards • Forever': 'Unlimited uploads • Unlimited collections • Unlimited cards • Unlimited decks'
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
    } catch (err) {
      console.error('Errore caricamento dati:', err)
    }
    setLoading(false)
  }

  // Funzione per tradurre e arricchire le descrizioni con i limiti mazzi
  const translateDescription = (description, planId) => {
    console.log('Plan ID:', planId, 'Description:', description) // Debug per vedere gli ID reali
    
    // Normalizza l'ID del piano (lowercase per matching)
    const normalizedId = planId.toLowerCase()
    
    // Mappa dei limiti mazzi per piano - CORRETTI
    const getDeckLimit = (id) => {
      // Free - 3 mazzi
      if (id === 'free') return language === 'it' ? '3 mazzi salvabili' : '3 saved decks'
      
      // Premium 10 caricamenti/mese - 5 mazzi
      if (id === 'premium' || id === 'premium_monthly' || id === 'premium_10' || 
          id === '10_uploads' || id.includes('10')) {
        return language === 'it' ? '5 mazzi salvabili' : '5 saved decks'
      }
      
      // Premium 30 caricamenti/mese - 10 mazzi
      if (id === 'premium_30' || id === '30_uploads' || id === 'premium_30_monthly' || 
          id.includes('30')) {
        return language === 'it' ? '10 mazzi salvabili' : '10 saved decks'
      }
      
      // Premium Annuale - 50 mazzi
      if (id === 'premium_annual' || id === 'yearly' || id === 'annual' || 
          id === 'yearly_unlimited' || id.includes('year') || id.includes('annual')) {
        return language === 'it' ? '50 mazzi salvabili' : '50 saved decks'
      }
      
      // Lifetime - illimitati
      if (id === 'lifetime' || id === 'lifetime_unlimited' || id.includes('lifetime')) {
        return language === 'it' ? 'Mazzi illimitati' : 'Unlimited decks'
      }
      
      // Default fallback
      return language === 'it' ? '3 mazzi salvabili' : '3 saved decks'
    }
    
    // Traduzioni base
    let translated = description
    
    if (language === 'it') {
      translated = translated
        .replace(/uploads/gi, 'caricamenti')
        .replace(/collections/gi, 'collezioni')
        .replace(/Unlimited/gi, 'Illimitate')
        .replace(/unlimited/gi, 'illimitate')
        .replace(/cards/gi, 'carte')
        .replace(/unique/gi, 'uniche')
        .replace(/per collection/gi, 'per collezione')
        .replace(/month/gi, 'mese')
        .replace(/year/gi, 'anno')
        .replace(/forever/gi, 'per sempre')
        .replace(/free/gi, 'gratuiti')
    }
    
    // Aggiungi limite mazzi
    const deckLimit = getDeckLimit(normalizedId)
    console.log('Deck limit for', planId, ':', deckLimit) // Debug
    translated = `${translated} • ${deckLimit}`
    
    return translated
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
                    if (type === 'premium' || type === 'premium_monthly' || type === 'premium_10' || type === '10_uploads') return '5'
                    if (type === 'premium_30' || type === '30_uploads' || type === 'premium_30_monthly') return '10'
                    if (type === 'premium_annual' || type === 'yearly' || type === 'annual' || type === 'yearly_unlimited') return '50'
                    if (type === 'lifetime' || type === 'lifetime_unlimited') return t.unlimited
                    return '3' // default fallback
                  })()}
                </span>
              </div>
              
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
              // Traduci e arricchisci la descrizione
              const descriptionText = translateDescription(plan.description, plan.id)
              const features = descriptionText.split(' • ').filter(f => f.trim())
              
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
