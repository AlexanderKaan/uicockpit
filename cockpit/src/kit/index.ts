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
 * Component TAXONOMY — the system's three tiers (a recipe is a `primitive`
 * unless listed here). This is the single source for "what IS the design system"
 * vs "what's a composition you can copy":
 *   - PRIMITIVE → the reusable vocabulary with state contracts (button, card,
 *     input, table, dialog…). These + the tokens + the binding rules ARE the
 *     system; they're what guarantees a consumer's UI looks like the preview.
 *   - HELPER    → structural / layout / motion glue (toolbar, separator, the
 *     menu roll-down stagger). Systemic, but not a "component".
 *   - PATTERN   → a composition assembled FROM primitives (auth screen, pricing
 *     table, stat tile…). Useful as a copy-paste block; NOT part of the spine.
 */
export type Tier = 'primitive' | 'helper' | 'pattern'
export const TIER: Readonly<Record<string, Exclude<Tier, 'primitive'>>> = {
  // Structural / layout / motion helpers
  toolbar: 'helper', separator: 'helper', twocolumnlayout: 'helper',
  'roll-down-item-stagger': 'helper', 'button-finish': 'helper',
  'interactive-list-row': 'helper', 'inline-status-meta-micro-components': 'helper',
  // Compositions (blocks)
  'activity-feed': 'pattern', 'danger-zone': 'pattern', auth: 'pattern',
  lightbox: 'pattern', sparkline: 'pattern',
  'usage-meter': 'pattern',
  'attachment-chip-family': 'pattern',
  carousel: 'pattern',
  infocard: 'pattern', timeline: 'pattern',
  'stat-tile': 'pattern', pricing: 'pattern',
  wizardstepper: 'pattern', 'file-grid': 'pattern',
}
export const tierOf = (id: string): Tier => TIER[id] ?? 'primitive'

/** A human-readable manifest banner that heads the assembled CSS, so anyone
 * reading the shipped kit sees the spine (primitives) separated from the
 * compositions (patterns) at a glance — without reordering the cascade. */
function manifest(recipes: readonly Recipe[]): string {
  const by = (t: Tier) => recipes.filter((r) => tierOf(r.id) === t).map((r) => r.section).join(', ')
  const prim = by('primitive'), help = by('helper'), patt = by('pattern')
  const n = (s: string) => (s ? s.split(', ').length : 0)
  return `/* ========================================================================
 * UIcockpit kit — component manifest (one config → this whole system)
 *
 * PRIMITIVES — the design system (${n(prim)}): the reusable vocabulary + state
 *   contracts. These + the tokens + the binding rules guarantee your UI looks
 *   like the configurator preview.
 *     ${prim}
 *
 * HELPERS — structural glue (${n(help)}): ${help}
 *
 * PATTERNS — copy-paste compositions (${n(patt)}), built FROM the primitives:
 *     ${patt}
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
