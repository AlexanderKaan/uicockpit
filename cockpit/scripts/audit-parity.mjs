#!/usr/bin/env node
/**
 * audit-parity.mjs — component-parity gate (anti-drift).
 *
 * HOUSE RULE: the components page (the gallery) is the single source of truth.
 * The live SupaDash app must be BUILT FROM those components — so every real,
 * styled component class the app renders must ALSO appear on the gallery page.
 * The only exception is the app-FRAME: the demo shell + a few page-specific
 * showcase surfaces that are intentionally not catalogue components (see
 * FRAME_PREFIXES). Anything else the app uses but the gallery doesn't is DRIFT
 * (a component that quietly lives only in the app) and fails the build.
 *
 * HOW: we only consider classes actually DEFINED in preview.css /
 * componentRecipes.ts (real styled components, not arbitrary strings). We then
 * compare, by BEM root, the set the APP renders vs the set the GALLERY renders.
 *
 * Scans: gallery = src/stage/views/ComponentGallery.tsx
 *        app     = src/stage/views/DemoDashboard.tsx + src/stage/views/apps/*.tsx
 *        defs    = src/styles/preview.css + src/export/componentRecipes.ts
 *
 * Exit 1 on any app component root absent from the gallery (and not frame).
 * Usage: node scripts/audit-parity.mjs [--report]   (--report never exits 1)
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPORT_ONLY = process.argv.slice(2).includes('--report')

const DEF_FILES = ['src/kit/recipes/index.ts', 'src/styles/preview-only.css', 'src/kit/globalLayer.ts']
/* PAGE = the components gallery + the SHARED presentational helpers it renders
 * cards through (charts, skeletons, the interactive slider). A class rendered
 * via one of these is "on the page" even if the markup lives in the helper. */
const PAGE_FILES = [
  'src/stage/views/ComponentGallery.tsx',
  'src/stage/views/ChartFrame.tsx',
  'src/stage/views/apps/AppHelpers.tsx',
]
/* APP = the manifest-driven showcase renderer (H3c — SupaDash retired). blocks.tsx
 * maps every BlockSpec onto EXPORTED kit recipes, so it IS the honest app surface
 * (manifests.ts is pure data; PagesView is preview workbench chrome, like
 * LayoutsView, and is not treated as "app"). */
const APP_FILES = ['src/showcases/blocks.tsx']

/* App-FRAME prefixes — intentionally app-only (the live demo shell + a few
 * page-specific showcase surfaces). These are NOT catalogue components, so the
 * gallery is not expected to carry them. Keep this list tight + documented. */
const FRAME_PREFIXES = [
  'l-center',    // foundation layout primitive (centered measure) — the prose block
                 // composes it; it's demonstrated in FoundationsView, not a card.
  'bento',       // foundation layout primitive (the smart grid) — the media block
                 // composes it; demonstrated in FoundationsView's Layout section.
]

/* Primitives / composition wrappers / sub-parts that legitimately live only in
 * the app: the primitive's role (or its PARENT component) is already on the
 * page, so they don't warrant their own gallery card. Keep tight + documented. */
const OK_APP_ONLY = new Set([
  'row-menu',    // anchored-popover WRAPPER around a .menu (the menu is on the page)
  'sep',         // hairline divider primitive (cf. .divider-or on the page)
  'code',        // inline <code> primitive (cf. the .codeblock card on the page)
  'sparkline',   // area-fill micro-chart primitive (cf. .stat-tile__spark on page)
  'bottomsheet', // mobile sheet primitive (mobile-shell, cf. the .m-tabbar card)
])

const isFrame = (root) => FRAME_PREFIXES.some((p) => (p.endsWith('-') ? root.startsWith(p) : root === p || root.startsWith(p + '-') || root.startsWith(p + '__')))
const rootOf = (cls) => cls.split('__')[0].split('--')[0]

// --- collect defined classes (real styled components) ---
const defined = new Set()
for (const f of DEF_FILES) {
  const css = readFileSync(resolve(ROOT, f), 'utf8')
  for (const m of css.matchAll(/\.([a-z][a-z0-9_-]*)/g)) defined.add(m[1])
}

// --- collect class tokens used in a set of TSX files (∩ defined) ---
// className-targeted so prose apostrophes in comments can't misalign quotes.
function classesIn(files) {
  const used = new Set()
  const add = (s) => { for (const tok of s.split(/\s+/)) if (defined.has(tok)) used.add(tok) }
  for (const f of files) {
    const src = readFileSync(resolve(ROOT, f), 'utf8')
    for (const m of src.matchAll(/className=(?:"([^"]*)"|'([^']*)'|\{([\s\S]*?)\})/g)) {
      if (m[1] != null) add(m[1])
      else if (m[2] != null) add(m[2])
      else if (m[3] != null) {
        // expression form: pull every quoted/template substring out of it
        for (const q of m[3].matchAll(/["'`]([^"'`]*)["'`]/g)) add(q[1])
      }
    }
  }
  return used
}

const appClasses = classesIn(APP_FILES)
const pageClasses = classesIn(PAGE_FILES)
const pageRoots = new Set([...pageClasses].map(rootOf))

// --- violations: app component root absent from gallery AND not frame ---
const offenders = new Map() // root -> Set(classes)
for (const cls of appClasses) {
  const root = rootOf(cls)
  if (pageRoots.has(root)) continue
  if (isFrame(root)) continue
  if (OK_APP_ONLY.has(root)) continue
  if (!offenders.has(root)) offenders.set(root, new Set())
  offenders.get(root).add(cls)
}

console.log('=== component-parity audit (page = source of truth) ===')
console.log(`defined classes: ${defined.size} · app: ${appClasses.size} · page: ${pageClasses.size}`)
if (offenders.size === 0) {
  console.log('OK: every app component is represented on the components page.')
  process.exit(0)
}
console.log(`\nDRIFT — ${offenders.size} component root(s) the app renders but the gallery does NOT:`)
for (const [root, set] of [...offenders].sort()) {
  console.log(`  · ${root}   (${[...set].sort().join(', ')})`)
}
console.log('\nFix: add a gallery card for it, OR (if it is genuinely app-frame) add its')
console.log('prefix to FRAME_PREFIXES in scripts/audit-parity.mjs with a one-line why.')
process.exit(REPORT_ONLY ? 0 : 1)
