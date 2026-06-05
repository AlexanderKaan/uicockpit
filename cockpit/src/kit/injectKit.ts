import { assembleKitCss, globalLayer } from './index'

/**
 * Inject the kit into the live preview — the SAME single source the export ships
 * (`globalLayer` + `assembleKitCss`), so the preview dogfoods the export: a broken
 * recipe breaks the app on screen. The global layer is scoped to `.cockpit-preview`
 * (so the kit's focus/disabled/selection rules don't bleed onto the configurator
 * chrome); the component recipes are unscoped `.btn`-style selectors. The remaining
 * non-exportable scaffolding (gallery masonry, dashboard chrome, overlay scrollbars)
 * comes from `preview-only.css`.
 *
 * Injected synchronously from `main.tsx` BEFORE React renders, so there is no flash.
 * Global layer first, then component recipes — matching the old cascade order.
 */
export function injectKit(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById('cockpit-kit')) return
  const style = document.createElement('style')
  style.id = 'cockpit-kit'
  style.textContent = `${globalLayer({ scope: '.cockpit-preview' })}\n\n${assembleKitCss()}`
  document.head.appendChild(style)
}
