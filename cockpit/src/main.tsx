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

// Close the "a fresh deploy only shows after a manual refresh" gap. The service
// worker (VitePWA `registerType: 'autoUpdate'`) skip-waits and claims clients when
// a new build ships, which fires `controllerchange`; reload once there so the new
// assets take over immediately instead of on the visitor's NEXT reload. Guards:
// only when a controller already existed at load (a genuine UPDATE — never the
// first-ever install) and only once (no reload loop). Kit state lives in the URL
// hash, so the reload is lossless. No-op in dev (SW off via devOptions.enabled).
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded || !hadController) return
    reloaded = true
    window.location.reload()
  })
}
