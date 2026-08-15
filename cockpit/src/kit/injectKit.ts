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

  /* 🚨 THE KIT GOES IN A CASCADE LAYER, and this is the fix for a whole class of
   * bug rather than a nicety.
   *
   * This <style> is appended to <head> AFTER the bundled stylesheets, so at equal
   * specificity the kit won every tie against our own chrome. That made
   * `.fmenu { gap: 0 }` on a composed `.card` silently INERT — and it is the same
   * cascade that made an earlier fix to the panel's lock button do nothing at all
   * while looking, in the source, exactly like a fix.
   *
   * The consequence was worse than the individual bugs: composing a kit recipe in
   * the chrome meant hand-tuning a specificity hack for every local adjustment, so
   * the cheaper move was always to re-implement the recipe instead. That is a
   * mechanical explanation for "we built it twice" — the cascade was charging a
   * toll on composition and paying a subsidy to duplication.
   *
   * An UNLAYERED rule beats a LAYERED one at any specificity. Putting the kit in
   * `@layer kit` states the relationship we actually mean: the kit is the base,
   * the chrome adjusts it. Compose the recipe, override locally, no arms race.
   *
   * Scope of the change, measured before making it rather than assumed:
   *  - EXPORT UNTOUCHED. genCss calls assembleKitCss() itself; this wrapper is
   *    preview-only, so no CDN consumer inherits a layer they did not ask for.
   *  - Exactly two chrome selectors collide with a kit selector at all
   *    (`.sheet`, `.sheet--left` in preview-only.css) and both carry !important,
   *    which outranks layers in either direction.
   *  - The chrome focus ring already re-asserts --k-ring inside the preview at
   *    higher specificity (chrome.css `.app .cockpit-preview :focus-visible`),
   *    so the a11y floor does not move.
   *  - No other @layer exists in the codebase, so there is no layer-order
   *    question to get wrong.
   *
   * The token block stays OUTSIDE the layer: it declares custom properties, not
   * styles, and variables should resolve regardless of who is winning a cascade. */
  style.textContent = `@layer kit {\n${globalLayer({ scope: '.cockpit-preview' })}\n\n${assembleKitCss()}\n}\n\n${mktTokens}`
  document.head.appendChild(style)
}
