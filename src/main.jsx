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
const isCertificateRoute =
  window.location.pathname.startsWith('/certificate') ||
  new URLSearchParams(window.location.search).get('certificate') === '1'

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