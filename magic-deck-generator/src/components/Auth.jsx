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
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

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
      acceptTerms: 'Accetto i',
      termsOfService: 'Termini di Servizio',
      and: 'e la',
      privacyPolicy: 'Privacy Policy',
      mustAcceptTerms: 'Devi accettare i Termini di Servizio e la Privacy Policy per registrarti',
      loginAcceptance: 'Effettuando il login accetti automaticamente i nostri',
      desktopRecommended: '💻 Per un\'esperienza ottimale, consigliamo l\'utilizzo su PC desktop',
      desktopRecommendedShort: 'Consigliato: PC Desktop'
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
      acceptTerms: 'I accept the',
      termsOfService: 'Terms of Service',
      and: 'and',
      privacyPolicy: 'Privacy Policy',
      mustAcceptTerms: 'You must accept the Terms of Service and Privacy Policy to register',
      loginAcceptance: 'By logging in, you automatically accept our',
      desktopRecommended: '💻 For the best experience, we recommend using a desktop PC',
      desktopRecommendedShort: 'Recommended: Desktop PC'
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

    // Verifica accettazione policy per registrazione
    if (!isLogin && (!acceptedTerms || !acceptedPrivacy)) {
      setMessage(t.mustAcceptTerms)
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

          {/* How It Works Section */}
          <div className="how-it-works-section">
            <h2 className="section-title">
              {language === 'it' ? '🚀 Come Funziona' : '🚀 How It Works'}
            </h2>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>{language === 'it' ? 'Carica la Collezione' : 'Upload Collection'}</h3>
                <p>
                  {language === 'it' 
                    ? 'Esporta la tua collezione da app come Delver Lens o TCGPlayer in formato Excel/CSV e caricala'
                    : 'Export your collection from apps like Delver Lens or TCGPlayer in Excel/CSV format and upload it'}
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>{language === 'it' ? 'Analisi Automatica' : 'Automatic Analysis'}</h3>
                <p>
                  {language === 'it' 
                    ? 'Il sistema analizza oltre 7200 mazzi competitivi e calcola la compatibilità con le tue carte'
                    : 'The system analyzes over 7200 competitive decks and calculates compatibility with your cards'}
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>{language === 'it' ? 'Scopri i Mazzi' : 'Discover Decks'}</h3>
                <p>
                  {language === 'it' 
                    ? 'Visualizza i mazzi che puoi costruire, ordina per completamento e scopri quali carte ti mancano'
                    : 'View decks you can build, sort by completion and discover which cards you\'re missing'}
                </p>
              </div>
            </div>
          </div>

          {/* Formats Section */}
          <div className="formats-section">
            <h2 className="section-title">
              {language === 'it' ? '🎮 Formati Supportati' : '🎮 Supported Formats'}
            </h2>
            <div className="formats-grid">
              <div className="format-badge">Commander (EDH)</div>
              <div className="format-badge">Modern</div>
              <div className="format-badge">Standard</div>
              <div className="format-badge">Legacy</div>
              <div className="format-badge">Vintage</div>
              <div className="format-badge">Pioneer</div>
              <div className="format-badge">Pauper</div>
              <div className="format-badge">Historic</div>
              <div className="format-badge">Brawl</div>
              <div className="format-badge">Alchemy</div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="benefits-section">
            <h2 className="section-title">
              {language === 'it' ? '💡 Perché Usare Magic Deck Builder?' : '💡 Why Use Magic Deck Builder?'}
            </h2>
            <div className="benefits-grid">
              <div className="benefit-item">
                <span className="benefit-icon">💰</span>
                <div className="benefit-content">
                  <h4>{language === 'it' ? 'Risparmia Denaro' : 'Save Money'}</h4>
                  <p>
                    {language === 'it' 
                      ? 'Scopri quali mazzi puoi costruire senza comprare nuove carte'
                      : 'Discover which decks you can build without buying new cards'}
                  </p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">⏱️</span>
                <div className="benefit-content">
                  <h4>{language === 'it' ? 'Risparmia Tempo' : 'Save Time'}</h4>
                  <p>
                    {language === 'it' 
                      ? 'Non perdere ore a cercare deck list compatibili manualmente'
                      : 'Don\'t waste hours manually searching for compatible deck lists'}
                  </p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🏆</span>
                <div className="benefit-content">
                  <h4>{language === 'it' ? 'Gioca Competitivo' : 'Play Competitive'}</h4>
                  <p>
                    {language === 'it' 
                      ? 'Accedi a mazzi vincenti da tornei e campionati ufficiali'
                      : 'Access winning decks from official tournaments and championships'}
                  </p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📈</span>
                <div className="benefit-content">
                  <h4>{language === 'it' ? 'Ottimizza la Collezione' : 'Optimize Collection'}</h4>
                  <p>
                    {language === 'it' 
                      ? 'Scopri quali carte acquistare per completare più mazzi'
                      : 'Discover which cards to buy to complete more decks'}
                  </p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📚</span>
                <div className="benefit-content">
                  <h4>{language === 'it' ? 'Gestione Collezioni' : 'Collection Management'}</h4>
                  <p>
                    {language === 'it' 
                      ? 'Organizza le tue carte in collezioni multiple e tieni traccia di tutto'
                      : 'Organize your cards in multiple collections and keep track of everything'}
                  </p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🃏</span>
                <div className="benefit-content">
                  <h4>{language === 'it' ? 'Gestione Deck' : 'Deck Management'}</h4>
                  <p>
                    {language === 'it' 
                      ? 'Salva i tuoi mazzi preferiti e condividili con la community'
                      : 'Save your favorite decks and share them with the community'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="testimonials-section">
            <h2 className="section-title">
              {language === 'it' ? '⭐ Cosa Dicono i Giocatori' : '⭐ What Players Say'}
            </h2>
            <div className="testimonials-grid">
              <div className="testimonial-card">
                <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
                <p className="testimonial-text">
                  {language === 'it' 
                    ? '"Fantastico! Ho scoperto che posso costruire 3 mazzi Modern competitivi con le carte che già possiedo."'
                    : '"Amazing! I discovered I can build 3 competitive Modern decks with cards I already own."'}
                </p>
                <p className="testimonial-author">- Marco R.</p>
              </div>
              <div className="testimonial-card">
                <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
                <p className="testimonial-text">
                  {language === 'it' 
                    ? '"Strumento indispensabile per chi ha una grande collezione. Mi ha fatto risparmiare centinaia di euro!"'
                    : '"Essential tool for anyone with a large collection. Saved me hundreds of euros!"'}
                </p>
                <p className="testimonial-author">- Sarah L.</p>
              </div>
              <div className="testimonial-card">
                <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
                <p className="testimonial-text">
                  {language === 'it' 
                    ? '"Interfaccia intuitiva e risultati precisi. Perfetto per preparare tornei!"'
                    : '"Intuitive interface and accurate results. Perfect for tournament preparation!"'}
                </p>
                <p className="testimonial-author">- Giovanni P.</p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="faq-section">
            <h2 className="section-title">
              {language === 'it' ? '❓ Domande Frequenti' : '❓ Frequently Asked Questions'}
            </h2>
            <div className="faq-grid">
              <div className="faq-item">
                <h4 className="faq-question">
                  {language === 'it' ? 'Come carico la mia collezione?' : 'How do I upload my collection?'}
                </h4>
                <p className="faq-answer">
                  {language === 'it' 
                    ? 'Esporta la tua collezione da app come Delver Lens, TCGPlayer o Dragon Shield in formato Excel (.xlsx) o CSV (.csv). Il file deve contenere almeno il nome della carta e la quantità. I nomi delle carte devono essere in inglese.'
                    : 'Export your collection from apps like Delver Lens, TCGPlayer or Dragon Shield in Excel (.xlsx) or CSV (.csv) format. The file must contain at least the card name and quantity. Card names must be in English.'}
                </p>
              </div>
              <div className="faq-item">
                <h4 className="faq-question">
                  {language === 'it' ? 'Quali formati sono supportati?' : 'Which formats are supported?'}
                </h4>
                <p className="faq-answer">
                  {language === 'it' 
                    ? 'Supportiamo tutti i principali formati Magic: Commander (EDH), Modern, Standard, Legacy, Vintage, Pioneer, Pauper, Historic, Brawl e Alchemy. Il database include oltre 7200 mazzi competitivi.'
                    : 'We support all major Magic formats: Commander (EDH), Modern, Standard, Legacy, Vintage, Pioneer, Pauper, Historic, Brawl and Alchemy. The database includes over 7200 competitive decks.'}
                </p>
              </div>
              <div className="faq-item">
                <h4 className="faq-question">
                  {language === 'it' ? 'È davvero gratuito?' : 'Is it really free?'}
                </h4>
                <p className="faq-answer">
                  {language === 'it' 
                    ? 'Sì! Offriamo un piano gratuito che include 3 caricamenti di collezione. Per utenti più attivi, sono disponibili piani Premium (10 caricamenti/mese) e Lifetime (tutto illimitato).'
                    : 'Yes! We offer a free plan that includes 3 collection uploads. For more active users, Premium (10 uploads/month) and Lifetime (everything unlimited) plans are available.'}
                </p>
              </div>
              <div className="faq-item">
                <h4 className="faq-question">
                  {language === 'it' ? 'Come vengono aggiornati i mazzi?' : 'How are decks updated?'}
                </h4>
                <p className="faq-answer">
                  {language === 'it' 
                    ? 'Il nostro database viene aggiornato regolarmente con mazzi vincenti da tornei ufficiali, Grand Prix, Pro Tour e campionati. Inoltre, gli utenti possono condividere i propri mazzi pubblici.'
                    : 'Our database is regularly updated with winning decks from official tournaments, Grand Prix, Pro Tour and championships. Additionally, users can share their own public decks.'}
                </p>
              </div>
              <div className="faq-item">
                <h4 className="faq-question">
                  {language === 'it' ? 'Posso gestire più collezioni?' : 'Can I manage multiple collections?'}
                </h4>
                <p className="faq-answer">
                  {language === 'it' 
                    ? 'Assolutamente sì! Puoi creare collezioni separate per diversi formati, mazzi o set. Ogni collezione può essere analizzata indipendentemente.'
                    : 'Absolutely! You can create separate collections for different formats, decks or sets. Each collection can be analyzed independently.'}
                </p>
              </div>
              <div className="faq-item">
                <h4 className="faq-question">
                  {language === 'it' ? 'Funziona su mobile?' : 'Does it work on mobile?'}
                </h4>
                <p className="faq-answer">
                  {language === 'it' 
                    ? 'Sì, l\'applicazione è completamente responsive e funziona su smartphone e tablet. Tuttavia, per un\'esperienza ottimale consigliamo l\'utilizzo su PC desktop.'
                    : 'Yes, the application is fully responsive and works on smartphones and tablets. However, for the best experience we recommend using a desktop PC.'}
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
          
          {/* Desktop Recommendation Banner */}
          <div className="desktop-recommendation">
            <span className="recommendation-icon">💻</span>
            <span className="recommendation-text">{t.desktopRecommended}</span>
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

            {isLogin && (
              <div className="login-policy-notice">
                <p>
                  {t.loginAcceptance}{' '}
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault()
                      setShowTermsModal(true)
                    }}
                    className="policy-link-small"
                  >
                    {t.termsOfService}
                  </a>
                  {' '}{t.and}{' '}
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault()
                      setShowPrivacyModal(true)
                    }}
                    className="policy-link-small"
                  >
                    {t.privacyPolicy}
                  </a>
                </p>
              </div>
            )}

            {!isLogin && (
              <div className="form-group policy-acceptance">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={acceptedTerms && acceptedPrivacy}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked)
                      setAcceptedPrivacy(e.target.checked)
                    }}
                    disabled={loading}
                    required
                  />
                  <span>
                    {t.acceptTerms}{' '}
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault()
                        setShowTermsModal(true)
                      }}
                      className="policy-link"
                    >
                      {t.termsOfService}
                    </a>
                    {' '}{t.and}{' '}
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault()
                        setShowPrivacyModal(true)
                      }}
                      className="policy-link"
                    >
                      {t.privacyPolicy}
                    </a>
                  </span>
                </label>
              </div>
            )}

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

        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="policy-modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="policy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="policy-modal-header">
              <h2>🔒 Privacy Policy</h2>
              <button className="close-modal-btn" onClick={() => setShowPrivacyModal(false)}>✕</button>
            </div>
            <div className="policy-modal-content">
              <iframe 
                src="/privacy.html" 
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Privacy Policy"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="policy-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="policy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="policy-modal-header">
              <h2>📋 Terms of Service</h2>
              <button className="close-modal-btn" onClick={() => setShowTermsModal(false)}>✕</button>
            </div>
            <div className="policy-modal-content">
              <iframe 
                src="/terms.html" 
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Terms of Service"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Auth
