import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000'

function Auth({ onLogin, language, setLanguage }) {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [referralCode, setReferralCode] = useState('')

  const t = {
    it: {
      login: 'Accedi', register: 'Registrati', email: 'Email', password: 'Password',
      loginBtn: 'Accedi', registerBtn: 'Registrati',
      switchToRegister: 'Non hai un account? Registrati',
      switchToLogin: 'Hai già un account? Accedi',
      loginSuccess: 'Login effettuato con successo!',
      registerSuccess: 'Registrazione completata! Controlla la tua email per verificare l\'account.',
      loginError: 'Email o password non corretti',
      registerError: 'Errore durante la registrazione',
      emailRequired: 'Email richiesta', passwordRequired: 'Password richiesta',
      acceptTerms: 'Accetto i', termsOfService: 'Termini di Servizio', and: 'e la',
      privacyPolicy: 'Privacy Policy',
      mustAcceptTerms: 'Devi accettare i Termini di Servizio e la Privacy Policy per registrarti',
      loginAcceptance: 'Effettuando il login accetti automaticamente i nostri',
      desktopRecommended: 'Per un\'esperienza ottimale, consigliamo l\'utilizzo su PC desktop',
    },
    en: {
      login: 'Login', register: 'Register', email: 'Email', password: 'Password',
      loginBtn: 'Login', registerBtn: 'Register',
      switchToRegister: 'Don\'t have an account? Register',
      switchToLogin: 'Already have an account? Login',
      loginSuccess: 'Login successful!',
      registerSuccess: 'Registration complete! Check your email to verify your account.',
      loginError: 'Incorrect email or password',
      registerError: 'Registration error',
      emailRequired: 'Email required', passwordRequired: 'Password required',
      acceptTerms: 'I accept the', termsOfService: 'Terms of Service', and: 'and',
      privacyPolicy: 'Privacy Policy',
      mustAcceptTerms: 'You must accept the Terms of Service and Privacy Policy to register',
      loginAcceptance: 'By logging in, you automatically accept our',
      desktopRecommended: 'For the best experience, we recommend using a desktop PC',
    }
  }[language]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!email || !password) {
      setMessage(!email ? t.emailRequired : t.passwordRequired)
      setMessageType('error')
      return
    }
    if (!isLogin && (!acceptedTerms || !acceptedPrivacy)) {
      setMessage(t.mustAcceptTerms)
      setMessageType('error')
      return
    }
    setLoading(true)
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...(!isLogin && referralCode.trim() ? { referral_code: referralCode.trim().toUpperCase() } : {}) })
      })
      const data = await res.json()
      if (!res.ok) {
        const detail = data.detail
        const msg = Array.isArray(detail)
          ? detail.map(e => e.msg).join(', ')
          : (typeof detail === 'string' ? detail : (isLogin ? t.loginError : t.registerError))
        setMessage(msg)
        setMessageType('error')
        setLoading(false)
        return
      }
      if (isLogin) {
        setMessage(t.loginSuccess)
        setMessageType('success')
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('userId', data.user_id)
        localStorage.setItem('userEmail', data.email)
        localStorage.setItem('isVerified', data.is_verified)
        setTimeout(() => {
          onLogin({ userId: data.user_id, email: data.email, isVerified: data.is_verified, token: data.access_token })
        }, 500)
      } else {
        if (data.email_sent === false) {
          setMessage(language === 'it'
            ? 'Registrazione completata! Non siamo riusciti a inviarti l\'email di verifica. Contatta il supporto o riprova più tardi.'
            : 'Registration complete! We could not send the verification email. Please contact support or try again later.')
          setMessageType('warning')
        } else {
          setMessage(t.registerSuccess)
          setMessageType('success')
        }
        try {
          const loginRes = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          if (loginRes.ok) {
            const loginData = await loginRes.json()
            localStorage.setItem('token', loginData.access_token)
            localStorage.setItem('userId', loginData.user_id)
            localStorage.setItem('userEmail', loginData.email)
            localStorage.setItem('isVerified', loginData.is_verified)
            setLoading(false)
            onLogin({ userId: loginData.user_id, email: loginData.email, isVerified: loginData.is_verified, token: loginData.access_token })
            navigate('/welcome')
            return
          }
        } catch { /* login automatico fallito */ }
        setTimeout(() => { setIsLogin(true); setMessage('') }, 3000)
      }
    } catch (err) {
      setMessage(isLogin ? t.loginError : t.registerError)
      setMessageType('error')
    }
    setLoading(false)
  }

  const il = language === 'it'
  const tryUrl = il ? '/try' : '/en/try'

  const stats = [
    { value: '7200+', label: il ? 'Mazzi competitivi' : 'Competitive decks' },
    { value: '392k+', label: il ? 'Carte nel DB' : 'Cards in DB' },
    { value: '5', label: il ? 'Strumenti AI' : 'AI tools' },
    { value: '10+', label: il ? 'Formati' : 'Formats' },
  ]

  const aiTools = [
    { icon: '🏗️', name: il ? 'AI Deck Builder' : 'AI Deck Builder', tokens: '5', desc: il ? 'Descrivi il mazzo in testo libero — "aggro rosso Modern" o "Commander Atraxa" — e l\'AI costruisce un mazzo completo da 60 o 100 carte con sideboard, strategia e upgrade path.' : 'Describe the deck in plain text — "red aggro Modern" or "Atraxa Commander" — and AI builds a complete 60 or 100-card deck with sideboard, strategy and upgrade path.' },
    { icon: '✨', name: il ? 'AI Synergy Finder' : 'AI Synergy Finder', tokens: '3', desc: il ? 'Inserisci 1–5 carte di partenza e l\'AI trova le carte più sinergiche. Risultati raggruppati per ruolo: Enabler, Payoff, Removal, Ramp.' : 'Enter 1–5 seed cards and AI finds the most synergistic cards. Results grouped by role: Enabler, Payoff, Removal, Ramp.' },
    { icon: '🪞', name: il ? 'AI Gemelli' : 'AI Card Twins', tokens: '3', desc: il ? 'Trova equivalenti funzionali per qualsiasi carta. Scopri sostituti economici, upgrade o carte che fanno la stessa cosa con un nome diverso.' : 'Find functional equivalents for any card. Discover budget replacements, upgrades or cards that do the same thing with a different name.' },
    { icon: '🔬', name: il ? 'AI Deck Analyzer' : 'AI Deck Analyzer', tokens: '3', desc: il ? 'Seleziona un mazzo salvato e scegli un obiettivo (Aggro, Control, Combo…). L\'AI analizza la curva di mana, identifica sinergie e suggerisce carte da aggiungere o rimuovere.' : 'Select a saved deck and choose a goal (Aggro, Control, Combo…). AI analyzes mana curve, identifies synergies and suggests cards to add or remove.' },
    { icon: '⚡', name: il ? 'AI Deck Boost' : 'AI Deck Boost', tokens: '5', desc: il ? 'Potenzia un mazzo esistente con suggerimenti AI mirati. Ottimizza la curva, migliora le sinergie e porta il tuo mazzo al livello successivo.' : 'Boost an existing deck with targeted AI suggestions. Optimize the curve, improve synergies and take your deck to the next level.' },
  ]

  const otherTools = [
    { icon: '🏆', name: il ? 'Tournament Deck Builder' : 'Tournament Deck Builder', desc: il ? 'Costruisci mazzi da torneo ottimizzati per il meta competitivo attuale.' : 'Build tournament-optimized decks for the current competitive meta.' },
    { icon: '🔍', name: il ? 'Cerca Carte' : 'Card Search', desc: il ? 'Ricerca avanzata nel database completo di Magic con filtri per colore, tipo, costo e altro.' : 'Advanced search in the complete Magic database with filters for color, type, cost and more.' },
    { icon: '📚', name: il ? 'Collezioni Pubbliche' : 'Public Collections', desc: il ? 'Esplora le collezioni condivise dalla community e trova ispirazione per la tua.' : 'Explore community-shared collections and find inspiration for yours.' },
    { icon: '🃏', name: il ? 'Mazzi Pubblici' : 'Public Decks', desc: il ? 'Sfoglia migliaia di mazzi condivisi dagli utenti, filtra per formato e strategia.' : 'Browse thousands of user-shared decks, filter by format and strategy.' },
    { icon: '🎮', name: il ? 'Arena Import' : 'Arena Import', desc: il ? 'Importa mazzi direttamente dal formato Arena con un semplice copia-incolla.' : 'Import decks directly from Arena format with a simple copy-paste.' },
    { icon: '📷', name: il ? 'Scanner Carte' : 'Card Scanner', desc: il ? 'Scansiona le tue carte fisiche con la fotocamera e aggiungile automaticamente alla collezione.' : 'Scan your physical cards with the camera and add them automatically to your collection.' },
  ]

  const faqs = [
    {
      q: il ? 'Come carico la mia collezione?' : 'How do I upload my collection?',
      a: il ? 'Esporta da Delver Lens, TCGPlayer o Dragon Shield in formato Excel (.xlsx) o CSV (.csv). Il file deve contenere nome carta e quantità. I nomi devono essere in inglese.' : 'Export from Delver Lens, TCGPlayer or Dragon Shield in Excel (.xlsx) or CSV (.csv) format. The file must contain card name and quantity. Names must be in English.'
    },
    {
      q: il ? 'Quali formati sono supportati?' : 'Which formats are supported?',
      a: il ? 'Tutti i principali formati: Commander (EDH), Modern, Standard, Legacy, Vintage, Pioneer, Pauper, Historic, Brawl e Alchemy. Il database include oltre 7200 mazzi competitivi.' : 'All major formats: Commander (EDH), Modern, Standard, Legacy, Vintage, Pioneer, Pauper, Historic, Brawl and Alchemy. The database includes over 7200 competitive decks.'
    },
    {
      q: il ? 'È davvero gratuito?' : 'Is it really free?',
      a: il ? 'Sì! Il piano gratuito include 3 caricamenti di collezione. Per utenti più attivi sono disponibili piani Premium (10 caricamenti/mese) e Lifetime (tutto illimitato).' : 'Yes! The free plan includes 3 collection uploads. For more active users, Premium (10 uploads/month) and Lifetime (everything unlimited) plans are available.'
    },
    {
      q: il ? 'Posso provare senza registrarmi?' : 'Can I try without registering?',
      a: il ? 'Assolutamente! Vai su /try per accedere a tutti gli strumenti AI e non-AI senza creare un account. Hai un numero limitato di utilizzi gratuiti per ogni strumento.' : 'Absolutely! Go to /try to access all AI and non-AI tools without creating an account. You have a limited number of free uses for each tool.'
    },
    {
      q: il ? 'Come vengono aggiornati i mazzi?' : 'How are decks updated?',
      a: il ? 'Il database viene aggiornato regolarmente con mazzi vincenti da tornei ufficiali, Grand Prix e Pro Tour. Gli utenti possono anche condividere i propri mazzi pubblici.' : 'The database is regularly updated with winning decks from official tournaments, Grand Prix and Pro Tour. Users can also share their own public decks.'
    },
    {
      q: il ? 'Funziona su mobile?' : 'Does it work on mobile?',
      a: il ? 'Sì, l\'app è completamente responsive. Per un\'esperienza ottimale consigliamo comunque il PC desktop, specialmente per la gestione della collezione.' : 'Yes, the app is fully responsive. For the best experience we still recommend desktop PC, especially for collection management.'
    },
  ]

  return (
    <div className="auth-root">
      {!showAuthForm ? (
        <>
          {/* ── NAVBAR ── */}
          <nav className="lp-nav">
            <div className="lp-nav-inner">
              <span className="lp-nav-logo">🃏 Magic Deck Builder</span>
              <div className="lp-nav-actions">
                <div className="lp-lang-toggle">
                  <button className={`lp-lang-btn ${language === 'it' ? 'active' : ''}`} onClick={() => { setLanguage('it'); localStorage.setItem('language', 'it') }}>🇮🇹 IT</button>
                  <button className={`lp-lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => { setLanguage('en'); localStorage.setItem('language', 'en') }}>🇬🇧 EN</button>
                </div>
                <button className="lp-nav-login" onClick={() => { setIsLogin(true); setShowAuthForm(true) }}>
                  {il ? '🔑 Accedi' : '🔑 Login'}
                </button>
                <button className="lp-nav-register" onClick={() => { setIsLogin(false); setShowAuthForm(true) }}>
                  {il ? '🚀 Registrati' : '🚀 Sign Up'}
                </button>
              </div>
            </div>
          </nav>

          <div className="lp-page">

            {/* ── HERO ── */}
            <section className="lp-hero">
              <div className="lp-hero-bg" />
              <div className="lp-hero-content">
                <div className="lp-hero-badge">{il ? '✨ Strumento #1 per giocatori MTG italiani' : '✨ #1 tool for MTG players'}</div>
                <h1 className="lp-hero-title">
                  {il ? <>Costruisci il mazzo<br /><span className="lp-gradient-text">perfetto</span> con la tua<br />collezione</> : <>Build the <span className="lp-gradient-text">perfect deck</span><br />from your collection</>}
                </h1>
                <p className="lp-hero-sub">
                  {il ? 'Analisi AI avanzata, 7200+ mazzi competitivi, 5 strumenti AI esclusivi. Scopri cosa puoi costruire adesso.' : 'Advanced AI analysis, 7200+ competitive decks, 5 exclusive AI tools. Discover what you can build right now.'}
                </p>
                <div className="lp-hero-ctas">
                  <button className="lp-btn-primary" onClick={() => { setIsLogin(false); setShowAuthForm(true) }}>
                    🚀 {il ? 'Inizia Gratis' : 'Start Free'}
                  </button>
                  <button className="lp-btn-ghost" onClick={() => { setIsLogin(true); setShowAuthForm(true) }}>
                    🔑 {il ? 'Accedi' : 'Login'}
                  </button>
                </div>
                <a href={tryUrl} className="lp-hero-try">
                  <span className="lp-try-pulse" />
                  ⚡ {il ? 'Prova GRATIS senza account — AI Deck Builder, Synergy, Scanner e altro →' : 'Try FREE without account — AI Deck Builder, Synergy, Scanner and more →'}
                </a>
                <div className="lp-stats-bar">
                  {stats.map((s, i) => (
                    <div key={i} className="lp-stat">
                      <span className="lp-stat-value">{s.value}</span>
                      <span className="lp-stat-label">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── TRY BANNER ── */}
            <section className="lp-try-banner">
              <div className="lp-try-banner-inner">
                <div className="lp-try-banner-text">
                  <span className="lp-try-banner-emoji">🧪</span>
                  <div>
                    <strong>{il ? 'Nessun account? Nessun problema.' : 'No account? No problem.'}</strong>
                    <p>{il ? 'Prova tutti gli strumenti AI gratis — nessuna carta di credito, nessuna registrazione.' : 'Try all AI tools for free — no credit card, no registration.'}</p>
                  </div>
                </div>
                <a href={tryUrl} className="lp-try-banner-btn">
                  {il ? '⚡ Prova Gratis Ora' : '⚡ Try Free Now'}
                </a>
              </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="lp-section">
              <h2 className="lp-section-title">{il ? '🚀 Come Funziona' : '🚀 How It Works'}</h2>
              <div className="lp-steps">
                {[
                  { n: '1', icon: '📤', title: il ? 'Carica la Collezione' : 'Upload Collection', desc: il ? 'Esporta da Delver Lens, TCGPlayer o Dragon Shield in Excel/CSV e carica il file.' : 'Export from Delver Lens, TCGPlayer or Dragon Shield in Excel/CSV and upload the file.' },
                  { n: '2', icon: '🤖', title: il ? 'Analisi Automatica' : 'Automatic Analysis', desc: il ? 'Il sistema analizza 7200+ mazzi competitivi e calcola la compatibilità con le tue carte.' : 'The system analyzes 7200+ competitive decks and calculates compatibility with your cards.' },
                  { n: '3', icon: '🏆', title: il ? 'Scopri i Mazzi' : 'Discover Decks', desc: il ? 'Visualizza i mazzi che puoi costruire, ordina per completamento e scopri le carte mancanti.' : 'View decks you can build, sort by completion and discover missing cards.' },
                ].map((s, i) => (
                  <div key={i} className="lp-step">
                    <div className="lp-step-num">{s.n}</div>
                    <div className="lp-step-icon">{s.icon}</div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── AI TOOLS ── */}
            <section className="lp-section lp-section-dark">
              <div className="lp-section-header">
                <h2 className="lp-section-title">🤖 {il ? '5 Strumenti AI Esclusivi' : '5 Exclusive AI Tools'}</h2>
                <p className="lp-section-sub">{il ? 'Funzionalità AI all\'avanguardia che nessun altro strumento MTG offre' : 'State-of-the-art AI features no other MTG tool offers'}</p>
              </div>
              <div className="lp-ai-grid">
                {aiTools.map((tool, i) => (
                  <div key={i} className="lp-ai-card">
                    <div className="lp-ai-card-top">
                      <span className="lp-ai-icon">{tool.icon}</span>
                      <div>
                        <h3>{tool.name}</h3>
                        <span className="lp-token-badge">⚡ {tool.tokens} token</span>
                      </div>
                    </div>
                    <p>{tool.desc}</p>
                  </div>
                ))}
              </div>
              <div className="lp-ai-cta">
                <a href={tryUrl} className="lp-btn-amber">
                  🧪 {il ? 'Prova gli strumenti AI gratis →' : 'Try AI tools for free →'}
                </a>
              </div>
            </section>

            {/* ── OTHER TOOLS ── */}
            <section className="lp-section">
              <h2 className="lp-section-title">🛠️ {il ? 'Tutti gli Strumenti' : 'All Tools'}</h2>
              <p className="lp-section-sub">{il ? 'Oltre all\'AI, una suite completa per ogni aspetto del gioco' : 'Beyond AI, a complete suite for every aspect of the game'}</p>
              <div className="lp-tools-grid">
                {otherTools.map((tool, i) => (
                  <div key={i} className="lp-tool-card">
                    <span className="lp-tool-icon">{tool.icon}</span>
                    <div>
                      <h4>{tool.name}</h4>
                      <p>{tool.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── FORMATS ── */}
            <section className="lp-section lp-section-dark">
              <h2 className="lp-section-title">🎮 {il ? 'Formati Supportati' : 'Supported Formats'}</h2>
              <div className="lp-formats">
                {['Commander (EDH)', 'Modern', 'Standard', 'Legacy', 'Vintage', 'Pioneer', 'Pauper', 'Historic', 'Brawl', 'Alchemy'].map(f => (
                  <span key={f} className="lp-format-badge">{f}</span>
                ))}
              </div>
            </section>

            {/* ── BENEFITS ── */}
            <section className="lp-section">
              <h2 className="lp-section-title">💡 {il ? 'Perché Magic Deck Builder?' : 'Why Magic Deck Builder?'}</h2>
              <div className="lp-benefits">
                {[
                  { icon: '💰', title: il ? 'Risparmia Denaro' : 'Save Money', desc: il ? 'Scopri quali mazzi puoi costruire senza comprare nuove carte.' : 'Discover which decks you can build without buying new cards.' },
                  { icon: '⏱️', title: il ? 'Risparmia Tempo' : 'Save Time', desc: il ? 'Niente più ore a cercare deck list compatibili manualmente.' : 'No more hours manually searching for compatible deck lists.' },
                  { icon: '🏆', title: il ? 'Gioca Competitivo' : 'Play Competitive', desc: il ? 'Accedi a mazzi vincenti da tornei e campionati ufficiali.' : 'Access winning decks from official tournaments and championships.' },
                  { icon: '📈', title: il ? 'Ottimizza la Collezione' : 'Optimize Collection', desc: il ? 'Scopri quali carte acquistare per completare più mazzi.' : 'Discover which cards to buy to complete more decks.' },
                  { icon: '🤖', title: il ? 'AI Avanzata' : 'Advanced AI', desc: il ? '5 strumenti AI esclusivi per costruire, analizzare e ottimizzare i tuoi mazzi.' : '5 exclusive AI tools to build, analyze and optimize your decks.' },
                  { icon: '🌍', title: il ? 'Multilingua' : 'Multilingual', desc: il ? 'Interfaccia disponibile in italiano e inglese.' : 'Interface available in Italian and English.' },
                ].map((b, i) => (
                  <div key={i} className="lp-benefit">
                    <span className="lp-benefit-icon">{b.icon}</span>
                    <div>
                      <h4>{b.title}</h4>
                      <p>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section className="lp-section lp-section-dark">
              <h2 className="lp-section-title">⭐ {il ? 'Cosa Dicono i Giocatori' : 'What Players Say'}</h2>
              <div className="lp-testimonials">
                {[
                  { text: il ? '"Fantastico! Ho scoperto che posso costruire 3 mazzi Modern competitivi con le carte che già possiedo."' : '"Amazing! I discovered I can build 3 competitive Modern decks with cards I already own."', author: 'Marco R.' },
                  { text: il ? '"Strumento indispensabile per chi ha una grande collezione. Mi ha fatto risparmiare centinaia di euro!"' : '"Essential tool for anyone with a large collection. Saved me hundreds of euros!"', author: 'Sarah L.' },
                  { text: il ? '"L\'AI Deck Builder è incredibile. In 30 secondi ho un mazzo Commander completo con strategia e upgrade path."' : '"The AI Deck Builder is incredible. In 30 seconds I have a complete Commander deck with strategy and upgrade path."', author: 'Giovanni P.' },
                ].map((t, i) => (
                  <div key={i} className="lp-testimonial">
                    <div className="lp-stars">⭐⭐⭐⭐⭐</div>
                    <p className="lp-testimonial-text">{t.text}</p>
                    <span className="lp-testimonial-author">— {t.author}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── FAQ ── */}
            <section className="lp-section">
              <h2 className="lp-section-title">❓ {il ? 'Domande Frequenti' : 'FAQ'}</h2>
              <div className="lp-faq">
                {faqs.map((faq, i) => (
                  <div key={i} className={`lp-faq-item ${openFaq === i ? 'open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <div className="lp-faq-q">
                      <span>{faq.q}</span>
                      <span className="lp-faq-arrow">{openFaq === i ? '▲' : '▼'}</span>
                    </div>
                    {openFaq === i && <p className="lp-faq-a">{faq.a}</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* ── PRICING ── */}
            <section className="lp-section lp-section-dark">
              <h2 className="lp-section-title">🪙 {il ? 'Prezzi Semplici' : 'Simple Pricing'}</h2>
              <p className="lp-section-subtitle">{il ? 'Inizia gratis. Paga solo se vuoi fare di più.' : 'Start free. Pay only if you want to do more.'}</p>
              <div className="lp-pricing-grid">
                <div className="lp-pricing-card">
                  <div className="lp-pricing-name">{il ? 'Gratuito' : 'Free'}</div>
                  <div className="lp-pricing-price">€0</div>
                  <div className="lp-pricing-desc">{il ? '100 token di benvenuto' : '100 welcome tokens'}</div>
                  <ul className="lp-pricing-features">
                    <li>✅ {il ? 'AI Deck Builder' : 'AI Deck Builder'}</li>
                    <li>✅ {il ? 'Confronta mazzi' : 'Deck compare'}</li>
                    <li>✅ {il ? 'AI Synergy & Gemelli' : 'AI Synergy & Twins'}</li>
                    <li>✅ {il ? 'Cerca carte (39k+)' : 'Card search (39k+)'}</li>
                    <li>✅ {il ? 'Collezioni & mazzi salvati' : 'Collections & saved decks'}</li>
                  </ul>
                  <button className="lp-btn-primary" style={{width:'100%', marginTop:'1rem'}} onClick={() => { setIsLogin(false); setShowAuthForm(true) }}>
                    {il ? 'Inizia gratis' : 'Start free'}
                  </button>
                </div>
                <div className="lp-pricing-card lp-pricing-card-popular">
                  <div className="lp-pricing-badge">{il ? 'Più usato' : 'Most popular'}</div>
                  <div className="lp-pricing-name">{il ? 'Token Pack' : 'Token Pack'}</div>
                  <div className="lp-pricing-price">{il ? 'da €2' : 'from €2'}</div>
                  <div className="lp-pricing-desc">{il ? 'Ricarica quando vuoi' : 'Top up whenever you want'}</div>
                  <ul className="lp-pricing-features">
                    <li>✅ {il ? 'Tutto del piano gratuito' : 'Everything in free'}</li>
                    <li>✅ {il ? 'Token extra senza scadenza' : 'Extra tokens, no expiry'}</li>
                    <li>✅ {il ? 'Nessun abbonamento' : 'No subscription'}</li>
                    <li>✅ {il ? 'Coupon e codici referral' : 'Coupons & referral codes'}</li>
                  </ul>
                  <button className="lp-btn-primary" style={{width:'100%', marginTop:'1rem'}} onClick={() => { setIsLogin(false); setShowAuthForm(true) }}>
                    {il ? 'Registrati e acquista' : 'Sign up & buy'}
                  </button>
                </div>
              </div>
            </section>

            {/* ── FINAL CTA ── */}
            <section className="lp-final-cta">
              <div className="lp-final-cta-inner">
                <h2>{il ? 'Pronto a iniziare?' : 'Ready to start?'}</h2>
                <p>{il ? 'Registrati gratis e scopri subito quali mazzi puoi costruire con la tua collezione.' : 'Sign up free and instantly discover which decks you can build with your collection.'}</p>
                <div className="lp-final-cta-btns">
                  <button className="lp-btn-primary lp-btn-xl" onClick={() => { setIsLogin(false); setShowAuthForm(true) }}>
                    🎯 {il ? 'Crea Account Gratuito' : 'Create Free Account'}
                  </button>
                  <a href={tryUrl} className="lp-btn-amber lp-btn-xl">
                    🧪 {il ? 'Prova senza account' : 'Try without account'}
                  </a>
                </div>
              </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="lp-footer">
              <div className="lp-footer-inner">
                <span className="lp-footer-logo">🃏 Magic Deck Builder</span>
                <div className="lp-footer-links">
                  <a href="#" onClick={e => { e.preventDefault(); setShowPrivacyModal(true) }}>Privacy Policy</a>
                  <a href="#" onClick={e => { e.preventDefault(); setShowTermsModal(true) }}>Terms of Service</a>
                  <a href={tryUrl}>{il ? 'Prova Gratis' : 'Try Free'}</a>
                </div>
                <span className="lp-footer-copy">© 2025 Magic Deck Builder</span>
              </div>
            </footer>

          </div>
        </>
      ) : (
        /* ── AUTH FORM ── */
        <div className="auth-container">
          <div className="auth-box">
            <div className="auth-header">
              <button className="back-btn" onClick={() => setShowAuthForm(false)}>← {il ? 'Indietro' : 'Back'}</button>
            </div>
            <div className="desktop-recommendation">
              <span className="recommendation-icon">💻</span>
              <span className="recommendation-text">{t.desktopRecommended}</span>
            </div>
            <h1>🃏 Magic Deck Builder</h1>
            <h2>{isLogin ? t.login : t.register}</h2>
            {message && <div className={`auth-message ${messageType}`}>{message}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t.email}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" disabled={loading} required />
              </div>
              <div className="form-group">
                <label>{t.password}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" disabled={loading} required />
              </div>
              {isLogin && (
                <div className="login-policy-notice">
                  <p>{t.loginAcceptance}{' '}<a href="#" onClick={e => { e.preventDefault(); setShowTermsModal(true) }} className="policy-link-small">{t.termsOfService}</a>{' '}{t.and}{' '}<a href="#" onClick={e => { e.preventDefault(); setShowPrivacyModal(true) }} className="policy-link-small">{t.privacyPolicy}</a></p>
                </div>
              )}
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label>{il ? 'Codice referral (opzionale)' : 'Referral code (optional)'}</label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={e => setReferralCode(e.target.value)}
                      placeholder={il ? 'Es: YOUTUBE2024' : 'E.g: YOUTUBE2024'}
                      disabled={loading}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="form-group policy-acceptance">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={acceptedTerms && acceptedPrivacy} onChange={e => { setAcceptedTerms(e.target.checked); setAcceptedPrivacy(e.target.checked) }} disabled={loading} required />
                      <span>{t.acceptTerms}{' '}<a href="#" onClick={e => { e.preventDefault(); setShowTermsModal(true) }} className="policy-link">{t.termsOfService}</a>{' '}{t.and}{' '}<a href="#" onClick={e => { e.preventDefault(); setShowPrivacyModal(true) }} className="policy-link">{t.privacyPolicy}</a></span>
                    </label>
                  </div>
                </>
              )}              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <><span className="spinner" />{isLogin ? t.loginBtn : t.registerBtn}...</> : (isLogin ? t.loginBtn : t.registerBtn)}
              </button>
            </form>
            <button className="switch-btn" onClick={() => { setIsLogin(!isLogin); setMessage('') }} disabled={loading}>
              {isLogin ? t.switchToRegister : t.switchToLogin}
            </button>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="policy-modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="policy-modal" onClick={e => e.stopPropagation()}>
            <div className="policy-modal-header">
              <h2>🔒 Privacy Policy</h2>
              <button className="close-modal-btn" onClick={() => setShowPrivacyModal(false)}>✕</button>
            </div>
            <div className="policy-modal-content">
              <iframe src="/privacy.html" style={{ width: '100%', height: '100%', border: 'none' }} title="Privacy Policy" sandbox="allow-same-origin allow-scripts" />
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="policy-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="policy-modal" onClick={e => e.stopPropagation()}>
            <div className="policy-modal-header">
              <h2>📋 Terms of Service</h2>
              <button className="close-modal-btn" onClick={() => setShowTermsModal(false)}>✕</button>
            </div>
            <div className="policy-modal-content">
              <iframe src="/terms.html" style={{ width: '100%', height: '100%', border: 'none' }} title="Terms of Service" sandbox="allow-same-origin allow-scripts" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Auth
