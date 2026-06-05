#!/usr/bin/env node
/**
 * audit-type.mjs — typography role-consistency map (the "find type drift" tool).
 *
 * WHY: at XL the same "list/body content" role showed up at 12px (pricing feats,
 * misusing the `eyebrow` micro-label tier), 16px (nav, `body`) and 18px (chat,
 * `read`). Eyeballing every component for this is exactly what the user wants to
 * stop doing. This maps every `font-size` declaration to its --k-type token +
 * the owning selector, so role-misuse and hardcoded sizes surface mechanically.
 *
 * Output:
 *  - resolved px per token at S/M/L/XL (so the spread is visible)
 *  - each token → the selectors that use it (review for role consistency)
 *  - HARDCODED font-sizes (raw px, not a token) — gate-worthy
 *
 * Scans preview.css + componentRecipes.ts. Exit 1 on any hardcoded font-size.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const FILES = ['src/kit/recipes/index.ts', 'src/styles/preview-only.css', 'src/kit/globalLayer.ts']

// Resolved px per --k-type token at each Text-size step (mirror of buildTokens
// TS table + derived tokens). For the at-a-glance spread; keep in sync if TS changes.
const TYPE_PX = {
  //            S      M      L      XL
  h1:      [26, 30, 34, 38],
  h2:      [19, 22, 24, 27],
  h3:      [15, 16, 17, 19],
  body:    [13, 14, 15, 16],
  small:   [11.5, 12, 12.5, 13],
  eyebrow: [10.5, 11, 11.5, 12], // round(small-1)
  caption: [9.5, 10, 10.5, 11], // max(9.5, small-2)
}

const SEL_RE = /([^{}]+?)\s*\{/        // capture selector text before a {
const FS_RE = /font-size\s*:\s*([^;}]+)/gi
const TOKEN_RE = /var\(\s*(--k-type-[a-z0-9]+)/i
const PX_RE = /(-?\d+(?:\.\d+)?)px/

const byToken = {}   // token -> [{file,line,sel}]
const hardcoded = [] // {file,line,sel,value}

for (const rel of FILES) {
  let text
  try { text = readFileSync(resolve(ROOT, rel), 'utf8') } catch { continue }
  const lines = text.split('\n')
  let currentSel = '?'
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Update current selector when a rule opens on this line (handles inline too).
    const selM = line.match(SEL_RE)
    if (selM && !/^\s*(\/\/|\*|\/\*)/.test(line)) {
      const cand = selM[1].split(',')[0].trim()
      if (/^[.#:\[a-zA-Z]/.test(cand) && cand.length < 80) currentSel = cand
    }
    for (const m of line.matchAll(FS_RE)) {
      const val = m[1].trim()
      const tok = val.match(TOKEN_RE)
      if (tok) {
        const key = tok[1].replace('--k-type-', '')
        ;(byToken[key] ??= []).push({ file: rel, line: i + 1, sel: currentSel })
      } else if (PX_RE.test(val) && !/^0(px)?$/.test(val)) {
        hardcoded.push({ file: rel, line: i + 1, sel: currentSel, value: val.slice(0, 40) })
      }
    }
  }
}

console.log('=== typography role map ===')
console.log('resolved px per token @ S / M / L / XL:')
for (const [t, px] of Object.entries(TYPE_PX)) {
  console.log(`  ${t.padEnd(8)} ${px.map((n) => String(n).padStart(4)).join(' /')}`)
}

const order = ['h1', 'h2', 'h3', 'body', 'small', 'eyebrow', 'caption']
const keys = Object.keys(byToken).sort((a, b) => order.indexOf(a) - order.indexOf(b))
console.log('\ntoken usage (selectors per tier — APPROXIMATE map, verify a specific')
console.log('selector with `grep`; the hardcoded-font gate below is exact):')
for (const k of keys) {
  const uses = byToken[k]
  console.log(`\n  --k-type-${k}  (${uses.length} uses, XL=${TYPE_PX[k] ? TYPE_PX[k][3] + 'px' : '?'})`)
  const sels = [...new Set(uses.map((u) => u.sel))].slice(0, 40)
  console.log('    ' + sels.join('  ·  '))
}

if (hardcoded.length) {
  console.log(`\nHARDCODED font-size (not a --k-type token): ${hardcoded.length}`)
  for (const h of hardcoded) console.log(`  ${h.file.split('/').pop()}:${h.line}  ${h.sel}  ->  ${h.value}`)
}

console.log(`\n${hardcoded.length ? 'FAIL' : 'OK'}: ${hardcoded.length} hardcoded font-size`)
process.exit(hardcoded.length ? 1 : 0)
