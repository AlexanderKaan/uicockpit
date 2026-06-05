import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { injectKit } from './kit/injectKit'
import './styles/reset.css'
import './styles/chrome.css'
import './styles/panel.css'
import './styles/stage.css'
import './styles/preview-only.css'
import './styles/modal.css'

// Inject the kit's component recipes (the single export source) into the live
// preview — synchronously, before render, so the preview dogfoods the export.
injectKit()

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
