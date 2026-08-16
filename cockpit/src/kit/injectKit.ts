import { assembleKitCss, globalLayer, platformFloor } from './index'
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

  /* ⚠️ THE KIT IS DELIBERATELY NOT IN A CASCADE LAYER, and the reason is worth
   * keeping because the opposite looks obviously right until you measure it.
   *
   * This <style> is appended AFTER the bundled stylesheets, so at equal
   * specificity the kit wins every tie against our own chrome. That reads like a
   * bug: it makes a local adjustment on a composed recipe — `.fmenu { gap: 0 }`
   * over `.card` — silently inert, so composing costs a specificity hack while
   * re-implementing the recipe costs nothing. A tempting story followed: the
   * cascade was charging a toll on composition and subsidising duplication, and
   * `@layer kit` would settle it, since an unlayered rule beats a layered one at
   * any specificity.
   *
   * It was tried, and measured by toggling the layer on the live page and
   * diffing computed styles: 1709 of 5390 elements moved. Reading them made the
   * mistake obvious. `.topbar__icon-btn` composes `btn btn--ghost btn--icon`, and
   * under the layer the chrome class's leftover background and border beat
   * `--ghost` — the element stopped being a ghost button. THE LAYER MAKES
   * COMPOSITION WORSE, not better: modifiers stop working wherever a chrome class
   * still declares what the recipe owns.
   *
   * Which is the actual lesson. The cascade is not the mechanism behind "we built
   * it twice" — the duplicate declarations are. Flipping the cascade removes no
   * duplication; it only hands the win to the UNREVIEWED copy over the reviewed
   * one, which for a design system is backwards. While a duplicate exists, the
   * kit winning the tie is the safer default, because it keeps the modifiers
   * honest.
   *
   * So the toll on composition is real, and the answer is to stop paying it at
   * the source: a chrome rule must not re-declare what the recipe owns. Where the
   * chrome genuinely needs a different value, it goes through a token the recipe
   * already reads (--k-card-pad, --k-overlay-min, …) rather than out-specifying
   * it. That is composition working as designed — see .fmenu, .kits-pop and
   * .mkt__ver-menu for the shape. */
  /* The platform floor goes FIRST: it is :where(), so it loses to everything
   after it by specificity rather than by source order — but putting it first
   states the layering for anyone reading the emitted sheet. */
  style.textContent = `${platformFloor({ scope: '.cockpit-preview' })}\n\n${globalLayer({ scope: '.cockpit-preview' })}\n\n${assembleKitCss()}\n\n${mktTokens}`
  document.head.appendChild(style)
}
