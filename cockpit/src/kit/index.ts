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
import { idsByTier } from './segments'

export type { Recipe } from './types'
export { globalLayer } from './globalLayer'
export { RECIPES } from './recipes'

/**
 * Component MODEL — the 4-layer ladder. The full graph (tiers + `uses` edges +
 * the orphan-atom worklist) lives in `./segments`; re-exported here so consumers
 * import the kit's model from one place.
 *   - FOUNDATION → tokens + token/motion/layout glue, upstream of the catalog.
 *   - ATOM       → the bare vocabulary; only meaningful inside something larger.
 *   - BLOCK      → stands on its own as a piece of app; the surface IS the
 *                  component, composed FROM atoms (its declared `uses`).
 *   - PAGE       → an assembly of blocks = a realistic screen (external SupaDash).
 */
export type { Tier } from './segments'
export { tierOf, usesOf, idsByTier, orphanAtoms, FOUNDATIONS, BLOCK_USES } from './segments'

/** A human-readable manifest banner that heads the assembled CSS, so anyone
 * reading the shipped kit sees the ladder — Foundation / Atom / Block — at a
 * glance, without reordering the cascade. Derived from the segment graph. */
function manifest(recipes: readonly Recipe[]): string {
  const sectionsFor = (t: 'foundation' | 'atom' | 'block') =>
    idsByTier(t, recipes)
      .map((id) => recipes.find((r) => r.id === id)?.section)
      .filter(Boolean)
      .join(', ')
  const found = sectionsFor('foundation'), atoms = sectionsFor('atom'), blocks = sectionsFor('block')
  const n = (s: string) => (s ? s.split(', ').length : 0)
  return `/* ========================================================================
 * UIcockpit kit — the design contract (one config → this whole system)
 *
 * The 4-layer ladder. Style the FOUNDATION once; every layer above inherits it,
 * so your UI looks like the configurator preview — not a default.
 *
 * FOUNDATION — the token layer (colour · type · shape · space · motion, in the
 *   :root / .dark blocks above) + ${n(found)} structural/motion glue upstream of
 *   the catalog:
 *     ${found}
 *
 * ATOMS — the bare vocabulary (${n(atoms)}): the reusable elements with real
 *   state contracts. Only meaningful inside something larger; these + the tokens
 *   are what guarantee a consumer's UI looks like the preview.
 *     ${atoms}
 *
 * BLOCKS — stand-alone pieces of app (${n(blocks)}), composed FROM the atoms — the
 *   surface IS the component (dialog, sidebar, data tiles, auth, …). Blocks
 *   assemble into PAGES (your screens).
 *     ${blocks}
 * ======================================================================== */`
}

/**
 * Concatenate the ordered recipes into one CSS string, headed by the manifest.
 * Each `css` is already a verbatim section (its own `=== banner ===` included),
 * so the body is a pure join — byte-for-byte what the live preview renders.
 */
export function assembleKitCss(recipes: readonly Recipe[] = RECIPES): string {
  return `${manifest(recipes)}\n\n${recipes.map((r) => r.css.trim()).join('\n\n')}`
}
