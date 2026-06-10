#!/usr/bin/env node
/* scan-app-provenance.mjs — the `audit:provenance` build gate.
 *
 * INVARIANT: the SupaDash "Application" preview is a pure CONSUMER of the
 * exportable kit. Every class it renders must therefore be defined in the
 * EXPORTABLE KIT (`src/kit/**`, the same source the CDN serves) — so a real
 * consumer who copies the markup gets the styling too — EXCEPT a small, explicit
 * allow-list of preview-HARNESS classes (the demo super-app shell, the viewport
 * frame, the configurator's own demo-card chrome) that no real consumer needs.
 *
 * Why the allow-list is EXPLICIT (and `dash__*` is class-level, not a prefix):
 * being merely defined in `preview-only.css` is NOT enough. That file is the
 * preview's escape hatch; a kit-worthy component authored there (e.g. a richer
 * sidebar under `.dash__nav`) would ship NOTHING to a CDN consumer while quietly
 * diverging from its gallery twin. Freezing the harness surface here means any
 * NEW preview-only class the app reaches for fails the build until someone makes
 * the call: promote it to the kit (it ships), or bless it as harness (it doesn't).
 *
 * Also surfaces inline styles with hardcoded hex (one-offs bypassing tokens).
 * Run: node scripts/scan-app-provenance.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const read = (rel) => { try { return readFileSync(resolve(ROOT, rel), 'utf8') } catch { return '' } }
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/* The EXPORTABLE kit — the only "library" that ships via the CDN. Note: this
 * deliberately EXCLUDES `src/styles/preview-only.css`. Preview-only defs are no
 * longer trusted as provenance; they must be on the harness allow-list below. */
const KIT_DEF_FILES = ['src/kit/recipes/index.ts', 'src/kit/globalLayer.ts']
const PREVIEW_ONLY_FILE = 'src/styles/preview-only.css'
const APP_FILES = [
  'src/stage/views/DemoDashboard.tsx',
  ...readdirSync(resolve(ROOT, 'src/stage/views/apps')).filter((f) => f.endsWith('.tsx')).map((f) => join('src/stage/views/apps', f)),
]

/* PREVIEW-HARNESS allow-list — classes the app may use that are NOT shipped.
 * Keep tight + documented. Two forms:
 *   EXACT      — the exact class is allowed, nothing else under that root. Used
 *                for the `dash*` app-shell so a kit-worthy `.dash__nav`-style
 *                addition is NOT silently waved through.
 *   PREFIXES   — any sub-part is allowed. Only for unambiguous demo-viewport
 *                shells (mobile frame, view-transition) that aren't components. */
const HARNESS_EXACT = new Set([
  // SupaDash super-app shell — page layout, not a shippable component.
  'dash', 'dash--rail', 'dash__main', 'dash__head', 'dash__page', 'dash__stats',
  'dash__navquick', 'dash__navquick-kbd',
  // B★7 — the Home bento grid (page layout, not a shippable component).
  'dash__bento', 'dash__hero',
  // Form width constraint utility (caps a form to a readable measure).
  'form-measure', 'form-measure--center',
])
const HARNESS_PREFIXES = ['app-frame', 'viewtoggle', 'view-transition', 'm-statusbar', 'm-topbar', 'm-tabbar', 'm-shell', 'mp-frame']
/* Generic structural/utility classes (not components). */
const UTILITY_OK = new Set(['cockpit-preview', 'sr-only', 'visually-hidden'])
/* Single-word ROOTS the app may render whose base rule legitimately lives in
 * preview-only.css (the demo shell), not the kit. Keep this tiny — every entry
 * is a component that a CDN consumer does NOT receive. */
const SINGLE_HARNESS = new Set(['dash'])

// Full BEM class token (root[-…][__part][--mod]) at a className boundary.
const DEF_RE = /\.((?:[a-z][a-z0-9]*)(?:-[a-z0-9]+)*(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?)/g
// A class token is ONLY trusted if it's BEM-shaped (has a hyphen, __ or --) or a
// known single-word root — this excludes JS identifiers inside ${…} (active,
// page, view) and prose labels.
const BEM = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?$|^[a-z][a-z0-9]*__[a-z0-9-]+(?:--[a-z0-9-]+)?$|^[a-z][a-z0-9]*--[a-z0-9-]+$/

const collectDefs = (files) => {
  const set = new Set()
  for (const rel of files) for (const m of strip(read(rel)).matchAll(DEF_RE)) set.add(m[1])
  return set
}
const collectUse = (files) => {
  const set = new Set()
  for (const rel of files) {
    const text = strip(read(rel))
    for (const m of text.matchAll(/className\s*=\s*(?:"([^"]*)"|\{([\s\S]*?)\})/g)) {
      const region = m[1] != null ? `"${m[1]}"` : m[2] || ''
      const literals = [...region.matchAll(/"([^"]*)"|'([^']*)'|`([^`$]*)`/g)].map((q) => q[1] ?? q[2] ?? q[3] ?? '')
      for (const tpl of region.matchAll(/`([\s\S]*?)`/g)) literals.push(tpl[1].replace(/\$\{[\s\S]*?\}/g, ' '))
      for (const lit of literals) for (const tok of lit.split(/\s+/)) if (BEM.test(tok)) set.add(tok)
    }
  }
  return set
}
const isHarness = (c) =>
  HARNESS_EXACT.has(c) || UTILITY_OK.has(c) ||
  HARNESS_PREFIXES.some((p) => c === p || c.startsWith(p + '-') || c.startsWith(p + '__'))

const kitDefs = collectDefs(KIT_DEF_FILES)
const previewDefs = collectDefs([PREVIEW_ONLY_FILE])
const used = collectUse(APP_FILES)

/* --- Single-word base-class check (closes the blind spot that once hid Card) ---
 * collectUse above skips single-word class names (card, btn) to avoid JS
 * identifiers. But a single-word COMPONENT must still ship: its BASE rule has to
 * be in the kit. We gather single-word tokens from quoted className literals and
 * verify each has a base rule (`.root {` / `.root:hover {` / grouped `.root,`) in
 * the kit — NOT just a descendant ref like `.card > .x` (the trap that let the
 * Card surface live only in preview-only.css while `.card > .btn` sat in the kit). */
const SINGLE_RE = /^[a-z][a-z0-9]*$/
const baseRootsIn = (files) => {
  const set = new Set()
  // `.root` followed only by pseudo-classes/elements or [attr], then `,` or `{`.
  const RE = /\.([a-z][a-z0-9]*)(?:::?[a-z-]+|\[[^\]]*\])*\s*[,{]/g
  for (const rel of files) for (const m of strip(read(rel)).matchAll(RE)) set.add(m[1])
  return set
}
const kitBaseRoots = baseRootsIn(KIT_DEF_FILES)
const usedSingles = new Set()
for (const rel of APP_FILES) {
  const text = strip(read(rel))
  for (const m of text.matchAll(/className\s*=\s*(?:"([^"]*)"|\{([\s\S]*?)\})/g)) {
    const region = m[1] != null ? `"${m[1]}"` : m[2] || ''
    for (const q of region.matchAll(/"([^"]*)"|'([^']*)'|`([^`$]*)`/g)) {
      const lit = (q[1] ?? q[2] ?? q[3] ?? '').replace(/\$\{[\s\S]*?\}/g, ' ')
      for (const tok of lit.split(/\s+/)) if (SINGLE_RE.test(tok)) usedSingles.add(tok)
    }
  }
}
const singleOrphans = [...usedSingles]
  .filter((c) => !kitBaseRoots.has(c) && !SINGLE_HARNESS.has(c) && !UTILITY_OK.has(c) && previewDefs.has(c))
  .sort()

// Orphan = the app renders it, but it is NOT in the exportable kit AND not an
// allow-listed harness class → a CDN consumer copying this markup gets nothing.
const orphans = [...used].filter((c) => !kitDefs.has(c) && !isHarness(c)).sort()
// Split orphans by likely cause to make triage one glance.
const definedInPreviewOnly = orphans.filter((c) => previewDefs.has(c))
const undefinedAnywhere = orphans.filter((c) => !previewDefs.has(c))
// Visible record of what's being grandfathered as harness (so the escape hatch
// can't quietly grow unnoticed).
const harnessUsed = [...used].filter((c) => !kitDefs.has(c) && isHarness(c) && previewDefs.has(c)).sort()

// Inline-style scan: hardcoded hex colours in app inline styles.
let inlineCount = 0
const hardColors = []
for (const rel of APP_FILES) {
  for (const m of strip(read(rel)).matchAll(/style=\{\{([^}]*)\}\}/g)) {
    inlineCount++
    const hex = m[1].match(/#[0-9a-fA-F]{3,8}\b/g)
    if (hex) hardColors.push({ file: rel.split('/').pop(), hex: [...new Set(hex)].join(', '), snippet: m[1].trim().slice(0, 60) })
  }
}

console.log('=== App provenance scan (app = pure consumer of the exportable kit) ===')
console.log(`App files: ${APP_FILES.length} · kit defs: ${kitDefs.size} · harness allow-listed: ${HARNESS_EXACT.size} exact + ${HARNESS_PREFIXES.length} prefixes · distinct app classes: ${used.size}`)

console.log(`\n[A] App classes that DON'T ship (not in the kit, not allow-listed harness): ${orphans.length}`)
if (definedInPreviewOnly.length) {
  console.log(`  ↳ defined only in preview-only.css → a CDN consumer gets UNSTYLED markup:`)
  for (const c of definedInPreviewOnly) console.log(`      .${c}`)
  console.log(`    Fix: promote to src/kit/recipes (+ demo in the gallery) so it ships,`)
  console.log(`         OR if it's genuinely demo-only chrome, add it to HARNESS_EXACT/`)
  console.log(`         HARNESS_PREFIXES in this script with a one-line why.`)
}
if (undefinedAnywhere.length) {
  console.log(`  ↳ not defined anywhere (invented / typo / legacy):`)
  for (const c of undefinedAnywhere) console.log(`      .${c}`)
}

console.log(`\n[A2] Single-word components the app renders whose BASE rule isn't in the kit: ${singleOrphans.length}`)
if (singleOrphans.length) {
  for (const c of singleOrphans) console.log(`      .${c}   (base rule lives in preview-only.css → does NOT ship)`)
  console.log(`    Fix: move its base rule into a src/kit/recipes entry (it ships), OR add`)
  console.log(`         it to SINGLE_HARNESS if it's genuinely demo-shell layout.`)
}

console.log(`\n[B] Harness classes in use (allow-listed, do NOT ship — by design): ${harnessUsed.length}`)
console.log('  ' + (harnessUsed.map((c) => '.' + c).join('  ') || '(none)'))

console.log(`\n[C] Inline style={{…}} blocks in app: ${inlineCount}  (with hardcoded hex: ${hardColors.length})`)
for (const h of hardColors) console.log(`  ${h.file}: ${h.hex}   « ${h.snippet} »`)

const fail = orphans.length + singleOrphans.length
console.log(fail === 0
  ? '\nOK: every app class ships via the kit (or is an allow-listed preview-harness class).'
  : '\n✘ FAIL: app renders classes a CDN consumer would not receive (see [A] / [A2]).')
process.exit(fail === 0 ? 0 : 1)
