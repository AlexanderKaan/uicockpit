#!/usr/bin/env node
/* scan-app-provenance.mjs — one-off provenance scan (precondition for the
 * "app = pure consumer of the export" refactor).
 *
 * Verifies that EVERY class the live app (SupaDash) renders traces back to the
 * component library (preview.css / componentRecipes.ts) — i.e. no invented or
 * legacy element that only exists in app markup. Also surfaces inline styles
 * with hardcoded hex/px (one-offs that bypass the token system).
 *
 * Not a build gate (yet) — a reporting tool. Run: node scripts/scan-app-provenance.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const read = (rel) => { try { return readFileSync(resolve(ROOT, rel), 'utf8') } catch { return '' } }
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const DEF_FILES = ['src/kit/recipes/index.ts', 'src/styles/preview-only.css', 'src/kit/globalLayer.ts']
const APP_FILES = [
  'src/stage/views/DemoDashboard.tsx',
  ...readdirSync(resolve(ROOT, 'src/stage/views/apps')).filter((f) => f.endsWith('.tsx')).map((f) => join('src/stage/views/apps', f)),
]

/* Legit app-only chrome: the demo shell / viewport frame (not catalogue
 * components). Anything starting with these is allowed without a library def. */
const FRAME_PREFIXES = ['dash', 'app-frame', 'viewtoggle', 'm-statusbar', 'm-topbar', 'm-tabbar', 'm-shell', 'mp-frame', 'view-transition']
/* Generic utility/structural classes the app may use that aren't "components". */
const UTILITY_OK = new Set(['cockpit-preview', 'sr-only', 'visually-hidden'])

// Full BEM class token (root[-…][__part][--mod]) at a className boundary.
const USE_RE = /(?:^|[\s"'`{(,>])((?:[a-z][a-z0-9]*)(?:-[a-z0-9]+)*(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?)/g
const DEF_RE = /\.((?:[a-z][a-z0-9]*)(?:-[a-z0-9]+)*(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?)/g

// A class token is ONLY trusted if it sits inside a quoted string AND is
// BEM-shaped (has a hyphen, __ or -- ) OR is a known single-word root. This
// excludes JS identifiers inside ${…} (active, page, view) and prose labels.
const BEM = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?$|^[a-z][a-z0-9]*__[a-z0-9-]+(?:--[a-z0-9-]+)?$|^[a-z][a-z0-9]*--[a-z0-9-]+$/
const collectUse = (files) => {
  const set = new Set()
  for (const rel of files) {
    const text = strip(read(rel))
    for (const m of text.matchAll(/className\s*=\s*(?:"([^"]*)"|\{([\s\S]*?)\})/g)) {
      // Gather only QUOTED strings (the literal class parts), drop ${…} identifiers.
      const region = m[1] != null ? `"${m[1]}"` : m[2] || ''
      const literals = [...region.matchAll(/"([^"]*)"|'([^']*)'|`([^`$]*)`/g)].map((q) => q[1] ?? q[2] ?? q[3] ?? '')
      // template static segments (text outside ${…}) inside backticks
      for (const tpl of region.matchAll(/`([\s\S]*?)`/g)) literals.push(tpl[1].replace(/\$\{[\s\S]*?\}/g, ' '))
      for (const lit of literals) for (const tok of lit.split(/\s+/)) {
        if (BEM.test(tok)) set.add(tok)
      }
    }
  }
  return set
}
const collectDefs = (files) => {
  const set = new Set()
  for (const rel of files) for (const m of strip(read(rel)).matchAll(DEF_RE)) set.add(m[1])
  return set
}
const isFrame = (c) => FRAME_PREFIXES.some((p) => c === p || c.startsWith(p + '-') || c.startsWith(p + '_'))

const defs = collectDefs(DEF_FILES)
const used = collectUse(APP_FILES)

const orphans = [...used].filter((c) => !defs.has(c) && !isFrame(c) && !UTILITY_OK.has(c)).sort()

// Inline-style scan: hardcoded hex colours + raw px in app inline styles.
let inlineCount = 0
const hardColors = []
for (const rel of APP_FILES) {
  const text = strip(read(rel))
  for (const m of text.matchAll(/style=\{\{([^}]*)\}\}/g)) {
    inlineCount++
    const body = m[1]
    const hex = body.match(/#[0-9a-fA-F]{3,8}\b/g)
    if (hex) hardColors.push({ file: rel.split('/').pop(), hex: [...new Set(hex)].join(', '), snippet: body.trim().slice(0, 60) })
  }
}

console.log('=== App provenance scan ===')
console.log(`App files: ${APP_FILES.length} · library defs: ${defs.size} · distinct app classes: ${used.size}`)
console.log(`\n[A] App classes NOT in the component library (invented / legacy / orphan): ${orphans.length}`)
for (const c of orphans) console.log(`  .${c}`)
console.log(`\n[B] Inline style={{…}} blocks in app: ${inlineCount}  (of which with hardcoded hex: ${hardColors.length})`)
for (const h of hardColors) console.log(`  ${h.file}: ${h.hex}   « ${h.snippet} »`)
console.log(orphans.length === 0 ? '\nOK: every app component class traces to the library.' : '\n→ Triage [A]: promote to the library + gallery, or remove if legacy.')

// Build gate: the app must render purely from the kit (single-source dogfood).
// Any orphan = an app class with no library definition → fail the build.
process.exit(orphans.length === 0 ? 0 : 1)
