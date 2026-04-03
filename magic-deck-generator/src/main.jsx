import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import AppRouter from './AppRouter.jsx'

// Firefox detection: add class to body for Firefox-specific CSS fixes
if (navigator.userAgent.includes('Firefox')) {
  document.body.classList.add('firefox')
}

createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </HelmetProvider>,
)
