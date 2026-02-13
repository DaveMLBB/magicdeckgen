import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Firefox detection: add class to body for Firefox-specific CSS fixes
if (navigator.userAgent.includes('Firefox')) {
  document.body.classList.add('firefox')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
