import { assembleKitCss, globalLayer } from './index'
import { buildTokens } from '../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../tokens/defaults'

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

  /* THE MARKETING SURFACES GET THE DEFAULT KIT'S TOKENS, once, here.
   *
   * The recipes were already loaded on every route — `.btn` has been one class
   * name away the whole time — but `--k-*` lived only on `.app` and
   * `.cockpit-preview`, so a kit recipe used on a marketing page fell back to
   * its hard-coded defaults and themed with nothing.
   *
   * That absence had already been paid for twice. `.mkt-btn` exists because of
   * it, and hard-codes 0.625rem "to match the kit's button radius" — copying a
   * token's value instead of reading it. And FolderDrop carried a branch whose
   * comment says it outright: "the kit's .btn recipe is scoped to the app's
   * preview root, so on the marketing page it resolved to nothing at all — the
   * audit's primary call to action has been rendering as bare text since the
   * door shipped."
   *
   * Seven components render a `.mkt` root, so this belongs in one place rather
   * than as a style prop on each of them. */
  const vars = buildTokens(DEFAULT_CONFIG).vars as Record<string, string | number>
  const mktTokens = `.mkt {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`

  style.textContent = `${globalLayer({ scope: '.cockpit-preview' })}\n\n${assembleKitCss()}\n\n${mktTokens}`
  document.head.appendChild(style)
}
