import { useState } from 'react'
import './Auth.css'

const API_URL = import.meta.env.PROD 
  ? 'https://api.magicdeckbuilder.app.cloudsw.site' 
  : 'http://localhost:8000'

function Auth({ onLogin, language }) {
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
      testAccount: 'Account di test',
      useTestAccount: 'Usa account di test'
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
      testAccount: 'Test account',
      useTestAccount: 'Use test account'
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

  const useTestAccount = () => {
    setEmail('test@example.com')
    setPassword('test123')
    setIsLogin(true)
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
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

        <div className="test-account-section">
          <p className="test-label">{t.testAccount}</p>
          <button 
            className="test-btn" 
            onClick={useTestAccount}
            disabled={loading}
          >
            {t.useTestAccount}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Auth
