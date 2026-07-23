import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ActivitiesPage from './ActivitiesPage.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ActivitiesPage />
    </ErrorBoundary>
  </StrictMode>,
)