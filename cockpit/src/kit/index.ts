/**
 * The kit — single authored source for the exportable design-system CSS.
 *
 * Two pure consumers read from here, so there is no mirror to keep in sync:
 *   - `src/export/genCss.ts`         → the standalone / CDN `tokens.css`
 *   - `scripts/gen-kit-css.mjs`      → `src/styles/kit.generated.css` (live preview)
 *
 * Both call `globalLayer(...)` for the non-component layer and `assembleKitCss()`
 * for the component recipes. The only difference between them is `scope`
 * (the preview prefixes the global layer with `.cockpit-preview`) — the component
 * recipe text is byte-identical for both.
 */
import type { Recipe } from './types'
import { RECIPES } from './recipes'

export type { Recipe } from './types'
export { globalLayer } from './globalLayer'
export { RECIPES } from './recipes'

/**
 * Concatenate the ordered recipes into one CSS string. Each `css` is already a
 * verbatim section (its own `=== banner ===` included), so this is a pure join —
 * same input, same output, byte-for-byte what the live preview renders.
 */
export function assembleKitCss(recipes: readonly Recipe[] = RECIPES): string {
  return recipes.map((r) => r.css.trim()).join('\n\n')
}
