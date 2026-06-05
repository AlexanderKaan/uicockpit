#!/usr/bin/env node
/**
 * audit-tokens.mjs — token-hygiene detector (the periodic spacing/grid gate).
 *
 * WHY: after two manual "remove hardcoded values" sweeps, a kanban card still
 * shipped `gap: 7px` (off-grid, hardcoded, non-rem). Manual eyeballing keeps
 * missing the long tail of inline `gap`/padding px. This script makes the check
 * automatic + repeatable so drift can't silently return.
 *
 * WHAT IT ENFORCES (the token contract):
 *  - Spacing (padding/margin/gap) uses a token, never a raw px.
 *  - Spacing px must be on the token grid {2,4,6,8,10,12,14,16,20,24,28,32}.
 *    Off-grid (3/5/7/9/11/13/18/22/26/30…) = HARD violation.
 *  - border-radius -> --k-radius-* ; font-size -> --k-type-*  (tokenization debt).
 *
 * PROPERTY-AWARE: px is fine on border/shadow/transform/filter/svg/structural
 * width-height/positioning — those are allow-listed by PROPERTY, not by value
 * (so a 1px border or a 200px sidebar is never flagged).
 *
 * Scans the two canonical design-system CSS sources (the exported surfaces):
 *   src/styles/preview.css           (live preview)
 *   src/export/componentRecipes.ts   (export; genCss bundles this)
 * The configurator's own chrome (panel/chrome/stage css) is out of scope — it's
 * not part of the emitted design system.
 *
 * Exit 1 if any HARD violation (off-grid spacing). Soft categories are reported
 * but don't fail (yet) — they're the tokenization tail we convert in the sweep.
 *
 * Usage:  node scripts/audit-tokens.mjs [--all-hard] [--json]
 *   --all-hard : also fail on tokenization-debt (on-grid hardcoded, radius, font)
 *   --json     : machine-readable output
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')

const FILES = ['src/kit/recipes/index.ts', 'src/styles/preview-only.css', 'src/kit/globalLayer.ts']

// The spacing token grid (= --k-s-N scale). A spacing px must land on one of these.
const GRID = new Set([0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32])

// Properties whose px value is SPACING -> must be a token; off-grid = hard.
const SPACING_PROPS = new Set([
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-inline', 'padding-block',
  'padding-inline-start', 'padding-inline-end',
  'padding-block-start', 'padding-block-end',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-inline', 'margin-block',
  'gap', 'row-gap', 'column-gap', 'grid-gap', 'grid-row-gap', 'grid-column-gap',
])
const RADIUS_PROPS = new Set([
  'border-radius', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius',
  'border-start-start-radius', 'border-start-end-radius',
  'border-end-start-radius', 'border-end-end-radius',
])
const FONT_PROPS = new Set(['font-size'])

// Properties where raw px is ALWAYS legitimate (allow-list by property).
//   borders/outlines/rings · shadows · transforms · filters/blur · svg strokes ·
//   structural widths/heights · positioning offsets · track sizing · tracking.
const ALLOW_PROPS = new Set([
  'border', 'border-width', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-inline', 'border-block', 'border-inline-width', 'border-block-width',
  'outline', 'outline-width', 'outline-offset',
  'box-shadow', '-webkit-box-shadow', 'text-shadow', 'filter', 'backdrop-filter',
  '-webkit-backdrop-filter',
  'transform', 'translate', 'perspective',
  'background-position', 'background-size', 'object-position', 'mask-position',
  'stroke-width', 'stroke-dasharray', 'stroke-dashoffset',
  'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'size',
  'flex-basis', 'block-size', 'inline-size', 'min-block-size', 'max-inline-size',
  'top', 'right', 'bottom', 'left', 'inset',
  'inset-inline', 'inset-block', 'inset-inline-start', 'inset-inline-end',
  'grid-template-columns', 'grid-template-rows', 'grid-auto-rows', 'grid-auto-columns',
  'background', 'letter-spacing', 'word-spacing', 'text-underline-offset',
  'scroll-margin', 'scroll-padding', 'clip-path', 'background-image',
])

// Strip `var(--x, 12px)` fallbacks: the px there only applies if the token is
// missing, so it's an acceptable safety net — don't count it as a literal.
const stripVarFallbacks = (v) => v.replace(/var\(\s*--[\w-]+\s*,\s*[^()]*?\)/g, 'var()')

const PX_RE = /(-?\d+(?:\.\d+)?)px/g
// Match `property: value` up to the next ; } or end-of-line. Captures one decl.
const DECL_RE = /([a-z-]+)\s*:\s*([^;{}]+)/gi

const args = new Set(process.argv.slice(2))
const ALL_HARD = args.has('--all-hard')
const JSON_OUT = args.has('--json')
const FIX = args.has('--fix')

// ── Auto-fixer ──────────────────────────────────────────────────────────────
// Snap off-grid spacing px → nearest grid value (tie → DOWN, preserving the
// designer's tighter intent) and tokenize EVERY spacing px → var(--k-s-N).
// Leaves: hairlines (<2px), negatives (manual — layout-sensitive), and
// radius/font (semantic mapping to --k-radius-* / --k-type-*, done by hand).
const GRID_ARR = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32]
const snapToGrid = (px) => {
  let best = GRID_ARR[0], bd = Infinity
  for (const g of GRID_ARR) { const d = Math.abs(g - px); if (d < bd) { bd = d; best = g } }
  return best // ascending iteration + strict `<` ⇒ ties keep the smaller (down)
}
// Protect `var(--x, …)` fallbacks (non-nested) so their px isn't rewritten.
const VAR_RE = /var\(--[\w-]+(?:\s*,\s*[^()]*)?\)/g
const tokenizeSpacingValue = (value) => {
  const stash = []
  let v = value.replace(VAR_RE, (m) => { stash.push(m); return `\x00${stash.length - 1}\x00` })
  v = v.replace(/(-?\d+(?:\.\d+)?)px/g, (m, num) => {
    const px = parseFloat(num)
    if (Math.abs(px) < 2) return m   // hairline — leave
    const snapped = snapToGrid(Math.abs(px))
    // Negative margins (overlap/bleed idiom) → calc(token * -1), magnitude snapped.
    return px < 0 ? `calc(var(--k-s-${snapped}) * -1)` : `var(--k-s-${snapped})`
  })
  return v.replace(/\x00(\d+)\x00/g, (_, i) => stash[+i])
}
if (FIX) {
  let total = 0
  for (const rel of FILES) {
    const abs = resolve(ROOT, rel)
    let text
    try { text = readFileSync(abs, 'utf8') } catch { continue }
    let count = 0
    const fixed = text.split('\n').map((line) =>
      line.replace(/([a-z-]+)(\s*:\s*)([^;{}]+)/gi, (full, prop, sep, value) => {
        if (!SPACING_PROPS.has(prop.toLowerCase())) return full
        const out = prop + sep + tokenizeSpacingValue(value)
        if (out !== full) count++
        return out
      })
    ).join('\n')
    if (count) { writeFileSync(abs, fixed); total += count }
    console.log(`fixed ${rel}: ${count} spacing declarations tokenized`)
  }
  console.log(`\n--fix done: ${total} declarations rewritten. Re-scanning for what remains…\n`)
}

const findings = [] // { file, line, prop, raw, px, category, severity }

for (const rel of FILES) {
  const abs = resolve(ROOT, rel)
  let text
  try { text = readFileSync(abs, 'utf8') } catch { continue }
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const m of line.matchAll(DECL_RE)) {
      const prop = m[1].toLowerCase()
      const rawVal = m[2]
      const isSpacing = SPACING_PROPS.has(prop)
      const isRadius = RADIUS_PROPS.has(prop)
      const isFont = FONT_PROPS.has(prop)
      if (!isSpacing && !isRadius && !isFont) continue // allow-listed / irrelevant
      const val = stripVarFallbacks(rawVal)
      for (const pm of val.matchAll(PX_RE)) {
        const px = parseFloat(pm[1])
        if (px === 0) continue
        if (isSpacing) {
          // Sub-grid (<2px): hairline optical nudges (border overlaps, 1px
          // divider gaps, -1px alignment). The token scale starts at 2px, so
          // these are legitimately below the grid — not spacing-rhythm. Skip.
          if (Math.abs(px) < 2) continue
          // The spacing contract is strict: NO raw spacing px at all. Off-grid
          // and on-grid-hardcoded are both HARD — every spacing value must be a
          // token (var(--k-s-N)). (off-grid is additionally a grid violation.)
          const onGrid = GRID.has(Math.abs(px))
          findings.push({
            file: rel, line: i + 1, prop, raw: rawVal.trim(), px,
            category: onGrid ? 'hardcoded-on-grid' : 'off-grid',
            severity: 'hard',
          })
        } else if (isRadius) {
          if (Math.abs(px) >= 999) continue // pill idiom, not a token candidate
          // Concentric-radius math is intentional: `calc(var(--k-radius-md) - 2px)`
          // (inner = outer − border) and `min(4px, var(--k-radius-sm))` (clamp a
          // small element's corner). The px there is a structural offset, not a
          // hardcoded radius — suppress when the value references a radius token.
          if (/var\(--k-radius/.test(rawVal)) continue
          // INFO only: radius has legit fixed uses that spacing doesn't — device
          // frames (.mp-frame phone corner/notch), micro-radii on decorative
          // bars/dots (must NOT track the radius control), small thumbnails.
          // Reviewed + intentional; surfaced for transparency, never a gate fail.
          findings.push({
            file: rel, line: i + 1, prop, raw: rawVal.trim(), px,
            category: 'hardcoded-radius', severity: 'info',
          })
        } else if (isFont) {
          // INFO only: e.g. hand-fit SVG text inside charts (donut centre number).
          findings.push({
            file: rel, line: i + 1, prop, raw: rawVal.trim(), px,
            category: 'hardcoded-font-size', severity: 'info',
          })
        }
      }
    }
  }
}

// Promote info findings to hard if --all-hard (strict: enforce radius/font too).
for (const f of findings) if (ALL_HARD && f.severity === 'info') f.severity = 'hard'

const hard = findings.filter((f) => f.severity === 'hard')
const warn = findings.filter((f) => f.severity === 'warn')
const info = findings.filter((f) => f.severity === 'info')

if (JSON_OUT) {
  console.log(JSON.stringify({ hard, warn, info, total: findings.length }, null, 2))
  process.exit(hard.length ? 1 : 0)
}

const byCat = (list) => {
  const g = {}
  for (const f of list) (g[f.category] ??= []).push(f)
  return g
}
const printGroup = (label, list) => {
  const g = byCat(list)
  for (const [cat, items] of Object.entries(g)) {
    console.log(`\n  ${label} · ${cat} (${items.length})`)
    for (const f of items.slice(0, 60)) {
      console.log(`    ${f.file}:${f.line}  ${f.prop}: ...${f.px}px...   ->  ${f.raw.slice(0, 70)}`)
    }
    if (items.length > 60) console.log(`    ... +${items.length - 60} more`)
  }
}

console.log('=== token-hygiene audit ===')
console.log(`scanned: ${FILES.join(', ')}`)
console.log(`grid: {${[...GRID].filter((n) => n).join(',')}}`)

if (!findings.length) {
  console.log('\nclean — no hardcoded spacing/radius/font px found.')
  process.exit(0)
}

if (hard.length) { console.log(`\nHARD violations (spacing must be tokenized + on-grid): ${hard.length}`); printGroup('HARD', hard) }
if (warn.length) { console.log(`\nwarn: ${warn.length}`); printGroup('warn', warn) }
if (info.length && !ALL_HARD) { console.log(`\ninfo — radius/font, reviewed + intentional (device frames, micro-radii, chart-fit): ${info.length}`); printGroup('info', info) }

// Distinct off-grid px histogram (helps plan snapping).
const offGridVals = {}
for (const f of findings) if (f.category === 'off-grid') offGridVals[Math.abs(f.px)] = (offGridVals[Math.abs(f.px)] || 0) + 1
if (Object.keys(offGridVals).length) {
  console.log('\noff-grid px histogram:', Object.entries(offGridVals).sort((a, b) => b[1] - a[1]).map(([v, c]) => `${v}px x${c}`).join('  '))
}

console.log(`\n${hard.length ? 'FAIL' : 'OK'}: ${hard.length} hard · ${warn.length} warn · ${info.length} info`)
process.exit(hard.length ? 1 : 0)
