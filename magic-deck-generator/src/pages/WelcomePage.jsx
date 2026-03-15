import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UserGuide from '../components/UserGuide'

function WelcomePage() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'it')

  useEffect(() => {
    // Google Ads conversion tracking — scatta solo qui, sulla pagina di benvenuto post-signup
    if (typeof window.gtag_report_conversion === 'function') {
      window.gtag_report_conversion()
    }
  }, [])

  const handleSetLanguage = (lang) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const handleClose = () => {
    navigate('/')
  }

  return (
    <UserGuide
      language={language}
      setLanguage={handleSetLanguage}
      onClose={handleClose}
      isWelcomePage={true}
    />
  )
}

export default WelcomePage
