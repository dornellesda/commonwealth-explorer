import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppNew from './AppNew.jsx'
import AdminPanel from './AdminPanel.jsx'
import CertificatePage from './components/certificate/CertificatePage.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'

const isAdminRoute = window.location.pathname.startsWith('/admin')
const isLeafletPreview = window.location.search.includes('leaflet=true')
// The certificate page is reached either by a direct "/certificate" path
// (works when served by a real router / dev server) or by "?certificate=1",
// which is how the static public/certificate.html redirect hands off to
// the SPA on static hosts like GitHub Pages that have no server routing.
const isCertificateRoute =
  window.location.pathname.startsWith('/certificate') ||
  new URLSearchParams(window.location.search).get('certificate') === '1'
// MapLibre (AppNew) is now the default app. Leaflet is available via ?leaflet=true
const RootComponent = isAdminRoute
  ? AdminPanel
  : isCertificateRoute
    ? CertificatePage
    : (isLeafletPreview ? App : AppNew)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <RootComponent />
    </ErrorBoundary>
  </StrictMode>,
)
