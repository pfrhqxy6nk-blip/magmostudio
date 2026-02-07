import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import { applyAccent, loadAccent } from './theme/accent.js'

// Dark-only for now (user requested to remove light theme).
document.documentElement.dataset.theme = 'dark';

applyAccent(loadAccent());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
