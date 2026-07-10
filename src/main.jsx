import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppNew from './AppNew.jsx'
import AdminPanel from './AdminPanel.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'

const isAdminRoute = window.location.pathname.startsWith('/admin')
const isLeafletPreview = window.location.search.includes('leaflet=true')
// MapLibre (AppNew) is now the default app. Leaflet is available via ?leaflet=true
const RootComponent = isAdminRoute ? AdminPanel : (isLeafletPreview ? App : AppNew)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <RootComponent />
    </ErrorBoundary>
  </StrictMode>,
)
