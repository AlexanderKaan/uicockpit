#!/usr/bin/env node
/**
 * audit-modifiers.mjs — BEM-modifier drift gate.
 *
 * WHY: audit-parity guarantees app ⊆ gallery at the BEM-ROOT level (`badge`,
 * `stat-tile`, `banner`). But a whole class of silent drift lives one level
 * DOWN, at the modifier (`badge--solid-primary`, `stat-tile--clickable`,
 * `banner--info`): the root is on the gallery so parity is happy, yet the
 * specific VARIANT the app renders is either undefined (a no-op that styles
 * nothing) or never demonstrated in the catalogue. We hit both in review:
 *   • `banner--info` — used by Cloud, but only success/warn/danger were
 *     defined; it rendered by accident (the base happened to be info-toned).
 *   • `stat-tile--clickable` — the app's drill tiles used it; the gallery
 *     never showed the variant.
 *
 * This gate encodes two checks over every modifier class (`root--mod` or
 * `root__part--mod`) found in real className usage:
 *   A. DEFINED — every modifier used in the app OR the gallery must have a CSS
 *      definition (preview.css / componentRecipes.ts). Catches no-ops + typos.
 *   B. DEMONSTRATED — every modifier the APP renders must also appear in the
 *      gallery (the source of truth), unless it's app-frame chrome or an
 *      explicitly allowlisted app-only layout modifier.
 *
 * Exit 1 on any violation. Usage: node scripts/audit-modifiers.mjs [--report]
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPORT = process.argv.includes('--report')

const DEF_FILES = ['src/kit/recipes/index.ts', 'src/styles/preview-only.css', 'src/kit/globalLayer.ts']
// Gallery = the components page + the shared presentational helpers it renders
// through (same set parity treats as "on the page").
const GALLERY_FILES = [
  'src/stage/views/ComponentGallery.tsx',
  'src/stage/views/ChartFrame.tsx',
  'src/stage/views/Skeletons.tsx',
  'src/stage/views/apps/AppHelpers.tsx',
]
// App = the live SupaDash screens (NOT the shared AppHelpers helper).
const APP_FILES = [
  'src/stage/views/DemoDashboard.tsx',
  ...readdirSync(resolve(ROOT, 'src/stage/views/apps'))
    .filter((f) => f.endsWith('.tsx') && f !== 'AppHelpers.tsx')
    .map((f) => join('src/stage/views/apps', f)),
]

/* App-FRAME modifier prefixes — the demo shell / viewport chrome is intentionally
 * app-only and not a catalogue component (mirrors audit-parity's FRAME_PREFIXES). */
const FRAME_PREFIXES = ['dash', 'app-frame', 'viewtoggle', 'm-statusbar', 'm-topbar', 'm-tabbar']

/* App-only modifiers that ARE defined + intentional but have no gallery demo
 * (a layout/behaviour modifier, not a visual variant worth a card). Keep tight
 * + documented — every entry is a deliberate exception to check B. */
const APP_ONLY = {
  'datatable--page': 'page-level tables grow to natural height; the gallery card keeps the compact capped-scroll demo',
}

/* Structural / JS-hook markers — a modifier class used for semantics or
 * targeting, deliberately WITHOUT its own CSS (the visual comes from a sibling
 * element). Exempt from check A. Keep tight + documented. */
const MARKER_OK = {
  'navrow--parent': 'marks an expandable nav row for JS + a11y; the chevron (.navrow__chev) carries the visual, no own style',
}

// Strip comments so prose mentioning a class can't register as usage.
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '') // /* … */ (CSS + JS block + {/* … */})
    .replace(/^\s*\/\/.*$/gm, '')    // full-line // comments

// Modifier in className usage: preceded by a token boundary that is NOT a
// hyphen or word char, so `stat-tile--clickable` is ONE token (never a stray
// `tile--clickable`). Root may be hyphenated; optional __part; then --mod.
const USE_RE = /(?:^|[\s"'`{(,>])((?:[a-z][a-z0-9]*)(?:-[a-z0-9]+)*(?:__[a-z0-9-]+)?--[a-z0-9-]+)/g
// A DYNAMIC PREFIX: `root[__part]--` whose suffix is computed (followed by a
// non-class char like ` ${ `, a closing quote, etc.). Means the component
// renders some `prefix--<computed>` variant — the whole axis is "present".
const PREFIX_RE = /(?:^|[\s"'`{(,>])((?:[a-z][a-z0-9]*)(?:-[a-z0-9]+)*(?:__[a-z0-9-]+)?--)(?![a-z0-9])/g
// Modifier DEFINITION in CSS: appears as a `.root--mod` selector.
const DEF_RE = /\.((?:[a-z][a-z0-9]*)(?:-[a-z0-9]+)*(?:__[a-z0-9-]+)?--[a-z0-9-]+)/g

const read = (rel) => { try { return readFileSync(resolve(ROOT, rel), 'utf8') } catch { return '' } }
// Collect STATIC literal modifiers — skip dynamic fragments like the `a` in
// `avatar--a${i}` (a match immediately followed by an interpolation `$`).
const collectMods = (files) => {
  const set = new Set()
  for (const rel of files) {
    const text = stripComments(read(rel))
    for (const m of text.matchAll(USE_RE)) {
      if (text[m.index + m[0].length] === '$') continue // `prefix--LITERAL${…}` → fragment
      set.add(m[1])
    }
  }
  return set
}
const collectPrefixes = (files) => {
  const set = new Set()
  for (const rel of files) for (const m of stripComments(read(rel)).matchAll(PREFIX_RE)) set.add(m[1])
  return set
}
const collectDefs = (files) => {
  const set = new Set()
  for (const rel of files) for (const m of stripComments(read(rel)).matchAll(DEF_RE)) set.add(m[1])
  return set
}

const defined = collectDefs(DEF_FILES)
const appMods = collectMods(APP_FILES)
const galleryMods = collectMods(GALLERY_FILES)
// Axes the gallery demonstrates — the `root[__part]--` prefix of every static
// modifier it shows, PLUS any dynamic prefix it composes. An app modifier whose
// axis is in this set is "demonstrated by family" (don't nag per colour sibling).
const axisOf = (mod) => mod.slice(0, mod.lastIndexOf('--') + 2)
const galleryAxes = new Set([...galleryMods].map(axisOf))
for (const p of collectPrefixes(GALLERY_FILES)) galleryAxes.add(p)

const isFrame = (mod) => FRAME_PREFIXES.some((p) => mod === p || mod.startsWith(p + '-') || mod.startsWith(p + '_'))

// --- Check A: every used modifier must be DEFINED (or a documented marker) ---
const undefinedMods = []
for (const mod of new Set([...appMods, ...galleryMods])) {
  if (defined.has(mod) || isFrame(mod) || mod in MARKER_OK) continue
  undefinedMods.push(mod)
}

// --- Check B: every app modifier's variant AXIS must be demonstrated ---
const undemonstrated = []
for (const mod of appMods) {
  if (galleryMods.has(mod) || galleryAxes.has(axisOf(mod))) continue
  if (isFrame(mod) || mod in APP_ONLY || mod in MARKER_OK) continue
  if (!defined.has(mod)) continue // already reported by check A — don't double-count
  undemonstrated.push(mod)
}

const total = new Set([...appMods, ...galleryMods]).size
console.log('=== BEM-modifier drift audit (defined + demonstrated) ===')
let fail = false

if (undefinedMods.length) {
  fail = true
  console.log(`\n[A] ${undefinedMods.length} modifier(s) USED but never DEFINED in preview.css / componentRecipes (silent no-op):`)
  for (const m of undefinedMods.sort()) console.log(`  .${m}`)
  console.log('  → define the modifier (complete its family), or remove it from the markup.')
}
if (undemonstrated.length) {
  fail = true
  console.log(`\n[B] ${undemonstrated.length} modifier(s) the APP renders but the GALLERY never shows (catalogue gap):`)
  for (const m of undemonstrated.sort()) console.log(`  .${m}`)
  console.log('  → add the variant to its gallery card, or (if a deliberate app-only')
  console.log('    layout modifier) add it to APP_ONLY with a one-line reason.')
}

if (!fail) {
  console.log(`OK: ${total} modifier classes — all defined; all app modifiers demonstrated in the gallery.`)
  if (Object.keys(APP_ONLY).length) console.log(`(app-only allowlisted: ${Object.keys(APP_ONLY).join(', ')})`)
  process.exit(0)
}
console.log('\n(Run with --report to print without failing the build.)')
process.exit(REPORT ? 0 : 1)
