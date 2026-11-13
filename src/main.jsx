import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import { AuthProvider } from './lib/AuthContext'
import { rememberAdsClickFromLocation } from './lib/adsClick'
import { adsConsentCookieLines, effectiveAdsConsent, readAdsConsent } from './lib/adsConsent'
import { apexRedirectUrl } from './lib/siteUrl'
import './index.css'

const adsGpc = navigator.globalPrivacyControl
const adsConsent = effectiveAdsConsent(readAdsConsent(document.cookie), adsGpc)
if (adsConsent.gpc) {
  for (const line of adsConsentCookieLines('denied', {
    hostname: window.location.hostname,
    secure: window.location.protocol === 'https:',
  })) {
    document.cookie = line
  }
}
rememberAdsClickFromLocation(window.location, {
  cookieHeader: document.cookie,
  consent: adsConsent,
  gpc: adsGpc,
})
const apexToWww = apexRedirectUrl()
if (apexToWww) {
  window.location.replace(apexToWww)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Analytics />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
