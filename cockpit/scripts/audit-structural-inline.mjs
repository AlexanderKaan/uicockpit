#!/usr/bin/env node
/**
 * audit-structural-inline.mjs — the STRUCTURAL-INLINE ratchet (the "stop drift
 * once and for all" gate from KIT-COVERAGE-AUDIT).
 *
 * WHY: the app surface (`src/showcases/sections.tsx`) is supposed to COMPOSE kit
 * recipes, never re-roll component looks. The tell that a screen is re-rolling a
 * component is a STRUCTURAL inline style — `padding` / `background` / `border` /
 * `borderRadius` / `boxShadow` baked into a `style={{…}}` instead of coming from a
 * kit class. (Pure LAYOUT inline — gap/justify/align/flex/width/margin/`--l-*` — is
 * fine; that's arranging recipes, not restyling them.) Each structural-inline is a
 * latent "second version" of a recipe; this gate counts them and PINS the count so
 * the number can only ratchet DOWN. When you hit a structural-inline need, that's
 * the signal a kit pattern is missing → add the recipe (gallery-first) → adopt it →
 * the number drops. `audit:provenance` bans new CLASSES; this bans new PATTERNS
 * smuggled in as inline styles.
 *
 * RATCHET CONTRACT (exact-match, both directions; same shape as audit:craft):
 *   - count > BASELINE  → you added a structural inline. Compose a kit recipe
 *                         instead (build one gallery-first if it's missing).
 *   - count < BASELINE  → you removed some (good!). LOCK IT: set BASELINE = <count>.
 *   - count === BASELINE → clean.
 *
 * Usage: node scripts/audit-structural-inline.mjs            (build gate; exit 1 on drift)
 *        node scripts/audit-structural-inline.mjs --report   (list every offender)
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPORT_ONLY = process.argv.slice(2).includes('--report')

// The pinned count of structural-inline styles in the app surface. Lower this
// (never raise it) as headers/regions adopt kit recipes. See RATCHET CONTRACT.
const BASELINE = 32

const SRC = 'src/showcases/sections.tsx'

// Structural style props = the ones a kit class should own. Layout props
// (gap/justify/align/flex/width/height/margin/inset/order/--l-*/--bento-*) are NOT
// counted — arranging recipes is the app's job. Longest variants first so a
// `borderTop:` isn't mis-attributed to `border:`.
const STRUCTURAL = [
  'paddingBlock', 'paddingInline', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'padding',
  'backgroundColor', 'background',
  'borderRadius', 'borderTop', 'borderBottom', 'borderLeft', 'borderRight', 'border',
  'boxShadow',
]
const KEY_RE = new RegExp(`\\b(${STRUCTURAL.join('|')})\\s*:`, 'g')

let raw = readFileSync(resolve(ROOT, SRC), 'utf8')
// Strip comments so a prop name inside a /* … */ or // note doesn't count.
raw = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')

const offenders = []
raw.split('\n').forEach((line, i) => {
  // A line can carry more than one structural prop (dense inline objects).
  for (const m of line.matchAll(KEY_RE)) {
    offenders.push({ line: i + 1, key: m[1], text: line.trim().slice(0, 110) })
  }
})

const count = offenders.length

if (REPORT_ONLY) {
  console.log(`=== audit:structural-inline — report (${count} structural-inline styles) ===`)
  const byKey = {}
  for (const o of offenders) byKey[o.key] = (byKey[o.key] || 0) + 1
  console.log('by prop:', Object.entries(byKey).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}:${n}`).join('  '))
  for (const o of offenders) console.log(`  ${SRC}:${o.line}\t${o.key}\t${o.text}`)
  process.exit(0)
}

if (count === BASELINE) {
  console.log(`audit:structural-inline — ratchet holds (${count} === baseline). Compose a kit recipe to ratchet down.`)
  process.exit(0)
}

if (count < BASELINE) {
  console.error(`audit:structural-inline — DROPPED to ${count} (baseline ${BASELINE}). Nice — now LOCK it: set BASELINE = ${count} in scripts/audit-structural-inline.mjs.`)
  process.exit(1)
}

console.error(`audit:structural-inline — REGRESSION: ${count} structural-inline styles (baseline ${BASELINE}, +${count - BASELINE}).`)
console.error('A structural inline style (padding/background/border/radius/shadow) means the app is re-rolling a recipe look. Compose a kit class instead; if the pattern is missing, build it gallery-first, then adopt it. Run with --report to list offenders.')
process.exit(1)
