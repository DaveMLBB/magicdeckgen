import { useState } from 'react'
import './Auth.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function Auth({ onLogin, language, setLanguage }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'

  const translations = {
    it: {
      login: 'Accedi',
      register: 'Registrati',
      email: 'Email',
      password: 'Password',
      loginBtn: 'Accedi',
      registerBtn: 'Registrati',
      switchToRegister: 'Non hai un account? Registrati',
      switchToLogin: 'Hai già un account? Accedi',
      loginSuccess: 'Login effettuato con successo!',
      registerSuccess: 'Registrazione completata! Controlla la tua email per verificare l\'account.',
      loginError: 'Email o password non corretti',
      registerError: 'Errore durante la registrazione',
      emailRequired: 'Email richiesta',
      passwordRequired: 'Password richiesta',
      testAccounts: 'Account di Test',
      freeAccount: 'Account Free',
      premiumAccount: 'Account Premium',
      lifetimeAccount: 'Account Lifetime',
      freeDesc: '3 caricamenti',
      premiumDesc: '10 caricamenti/mese',
      lifetimeDesc: 'Tutto illimitato'
    },
    en: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      loginBtn: 'Login',
      registerBtn: 'Register',
      switchToRegister: 'Don\'t have an account? Register',
      switchToLogin: 'Already have an account? Login',
      loginSuccess: 'Login successful!',
      registerSuccess: 'Registration complete! Check your email to verify your account.',
      loginError: 'Incorrect email or password',
      registerError: 'Registration error',
      emailRequired: 'Email required',
      passwordRequired: 'Password required',
      testAccounts: 'Test Accounts',
      freeAccount: 'Free Account',
      premiumAccount: 'Premium Account',
      lifetimeAccount: 'Lifetime Account',
      freeDesc: '3 uploads',
      premiumDesc: '10 uploads/month',
      lifetimeDesc: 'Everything unlimited'
    }
  }

  const t = translations[language]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    
    if (!email || !password) {
      setMessage(!email ? t.emailRequired : t.passwordRequired)
      setMessageType('error')
      return
    }

    setLoading(true)
    console.log('🔐 Tentativo login/registrazione:', { email, isLogin })

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      console.log('📡 Chiamata API:', `${API_URL}${endpoint}`)
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      console.log('📥 Risposta status:', res.status)
      const data = await res.json()
      console.log('📥 Risposta data:', data)

      if (!res.ok) {
        setMessage(data.detail || (isLogin ? t.loginError : t.registerError))
        setMessageType('error')
        setLoading(false)
        return
      }

      if (isLogin) {
        // Login riuscito
        console.log('✅ Login riuscito:', data)
        setMessage(t.loginSuccess)
        setMessageType('success')
        
        // Salva token e user info
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('userId', data.user_id)
        localStorage.setItem('userEmail', data.email)
        localStorage.setItem('isVerified', data.is_verified)
        
        console.log('💾 Dati salvati in localStorage')
        
        // Chiama callback
        setTimeout(() => {
          console.log('🚀 Chiamata onLogin callback')
          onLogin({
            userId: data.user_id,
            email: data.email,
            isVerified: data.is_verified,
            token: data.access_token
          })
        }, 500)
      } else {
        // Registrazione riuscita
        setMessage(t.registerSuccess)
        setMessageType('success')
        
        // Passa a login dopo 3 secondi
        setTimeout(() => {
          setIsLogin(true)
          setMessage('')
        }, 3000)
      }
    } catch (err) {
      console.error('❌ Errore auth:', err)
      setMessage(isLogin ? t.loginError : t.registerError)
      setMessageType('error')
    }

    setLoading(false)
  }

  const useTestAccount = (accountType) => {
    if (accountType === 'free') {
      setEmail('test@example.com')
      setPassword('test123')
    } else if (accountType === 'premium') {
      setEmail('premium@example.com')
      setPassword('premium123')
    } else if (accountType === 'lifetime') {
      setEmail('lifetime@example.com')
      setPassword('lifetime123')
    }
    setIsLogin(true)
  }

  const [showAuthForm, setShowAuthForm] = useState(false)

  return (
    <div className="auth-container">
      {!showAuthForm ? (
        <div className="landing-page">
          {/* Language Selector */}
          <div className="landing-language-selector">
            <button 
              className={`lang-btn ${language === 'it' ? 'active' : ''}`}
              onClick={() => {
                setLanguage('it')
                localStorage.setItem('language', 'it')
              }}
            >
              🇮🇹 IT
            </button>
            <button 
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => {
                setLanguage('en')
                localStorage.setItem('language', 'en')
              }}
            >
              🇬🇧 EN
            </button>
          </div>

          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-content">
              <h1 className="hero-title">
                <span className="hero-icon">🃏</span>
                Magic Deck Builder
              </h1>
              <p className="hero-subtitle">
                {language === 'it' 
                  ? 'Scopri quali mazzi competitivi puoi costruire con la tua collezione'
                  : 'Discover which competitive decks you can build with your collection'}
              </p>
              <div className="hero-cta">
                <button className="cta-primary" onClick={() => setShowAuthForm(true)}>
                  {language === 'it' ? '🚀 Inizia Gratis' : '🚀 Start Free'}
                </button>
                <button className="cta-secondary" onClick={() => { setIsLogin(true); setShowAuthForm(true); }}>
                  {language === 'it' ? '🔑 Accedi' : '🔑 Login'}
                </button>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="features-section">
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>{language === 'it' ? 'Analisi Intelligente' : 'Smart Analysis'}</h3>
                <p>
                  {language === 'it' 
                    ? 'Carica la tua collezione e scopri istantaneamente quali mazzi competitivi puoi costruire'
                    : 'Upload your collection and instantly discover which competitive decks you can build'}
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>{language === 'it' ? '7200+ Mazzi' : '7200+ Decks'}</h3>
                <p>
                  {language === 'it' 
                    ? 'Database aggiornato con mazzi competitivi da tutti i formati: Modern, Legacy, Vintage, Pioneer e altro'
                    : 'Updated database with competitive decks from all formats: Modern, Legacy, Vintage, Pioneer and more'}
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">💎</div>
                <h3>{language === 'it' ? 'Gestione Collezione' : 'Collection Management'}</h3>
                <p>
                  {language === 'it' 
                    ? 'Organizza le tue carte, crea collezioni multiple e tieni traccia dei tuoi mazzi'
                    : 'Organize your cards, create multiple collections and track your decks'}
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h3>{language === 'it' ? 'Filtri Avanzati' : 'Advanced Filters'}</h3>
                <p>
                  {language === 'it' 
                    ? 'Cerca per colori, formato, percentuale di completamento e molto altro'
                    : 'Search by colors, format, completion percentage and much more'}
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>{language === 'it' ? 'Veloce e Facile' : 'Fast and Easy'}</h3>
                <p>
                  {language === 'it' 
                    ? 'Carica un file Excel o CSV e ottieni risultati in pochi secondi'
                    : 'Upload an Excel or CSV file and get results in seconds'}
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🌍</div>
                <h3>{language === 'it' ? 'Multilingua' : 'Multilingual'}</h3>
                <p>
                  {language === 'it' 
                    ? 'Interfaccia disponibile in italiano e inglese'
                    : 'Interface available in Italian and English'}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="cta-section">
            <h2>{language === 'it' ? 'Pronto a iniziare?' : 'Ready to start?'}</h2>
            <p>
              {language === 'it' 
                ? 'Registrati gratuitamente e inizia a scoprire quali mazzi puoi costruire'
                : 'Sign up for free and start discovering which decks you can build'}
            </p>
            <button className="cta-large" onClick={() => setShowAuthForm(true)}>
              {language === 'it' ? '🎯 Crea Account Gratuito' : '🎯 Create Free Account'}
            </button>
          </div>
        </div>
      ) : (
        <div className="auth-box">
          <div className="auth-header">
            <button className="back-btn" onClick={() => setShowAuthForm(false)}>
              ← {language === 'it' ? 'Indietro' : 'Back'}
            </button>
          </div>
          
          <h1>🃏 Magic Deck Builder</h1>
          <h2>{isLogin ? t.login : t.register}</h2>

          {message && (
            <div className={`auth-message ${messageType}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {isLogin ? t.loginBtn : t.registerBtn}...
                </>
              ) : (
                isLogin ? t.loginBtn : t.registerBtn
              )}
            </button>
          </form>

          <button 
            className="switch-btn" 
            onClick={() => {
              setIsLogin(!isLogin)
              setMessage('')
            }}
            disabled={loading}
          >
            {isLogin ? t.switchToRegister : t.switchToLogin}
          </button>

          <div className="test-accounts-section">
            <p className="test-label">{t.testAccounts}</p>
            <div className="test-accounts-grid">
              <button 
                className="test-account-btn free" 
                onClick={() => useTestAccount('free')}
                disabled={loading}
              >
                <div className="test-account-icon">🆓</div>
                <div className="test-account-title">{t.freeAccount}</div>
                <div className="test-account-desc">{t.freeDesc}</div>
                <div className="test-account-email">test@example.com</div>
              </button>
              
              <button 
                className="test-account-btn premium" 
                onClick={() => useTestAccount('premium')}
                disabled={loading}
              >
                <div className="test-account-icon">💎</div>
                <div className="test-account-title">{t.premiumAccount}</div>
                <div className="test-account-desc">{t.premiumDesc}</div>
                <div className="test-account-email">premium@example.com</div>
              </button>

              <button 
                className="test-account-btn lifetime" 
                onClick={() => useTestAccount('lifetime')}
                disabled={loading}
              >
                <div className="test-account-icon">⭐</div>
                <div className="test-account-title">{t.lifetimeAccount}</div>
                <div className="test-account-desc">{t.lifetimeDesc}</div>
                <div className="test-account-email">lifetime@example.com</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Auth
