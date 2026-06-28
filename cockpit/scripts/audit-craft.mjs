#!/usr/bin/env node
/**
 * audit-craft.mjs — the magic-px ratchet (craft-sweep regression lock; clusters C2/C6).
 *
 * WHY: the craft sweep's recurring failure is "magic-px sub-dimensions" — a raw
 * `width: 14px` / `top: 12px` / `min-width: 80px` baked into a component rule
 * instead of derived from a `--k-*` token. They look fine on the curated demo but
 * desync the moment Scale/density re-scales the kit (an icon that should track the
 * control height stays 14px; a caret offset that should track padding jumps). This
 * gate counts those un-tokenized dimension literals and PINS the count, so the
 * sweep can only ratchet it DOWN, never silently regress up.
 *
 * RATCHET CONTRACT (exact-match, both directions):
 *   - count > BASELINE  → you added magic px. Tokenize them (--k-icon-sm / --k-s-* /
 *                         a derived calc) or, if genuinely a one-off, justify + bump.
 *   - count < BASELINE  → you removed some (good!). LOCK IT: set BASELINE = <count>
 *                         so the win can't be quietly given back later.
 *   - count === BASELINE → clean.
 *
 * WHAT COUNTS AS MAGIC (a literal Npx that should have been a token):
 *   excluded — comments, `var(--k-*, Npx)` fallbacks (the fallback IS the token
 *   default), `--k-*:` token-definition lines, hairlines (<=2px: borders/rings are
 *   legitimately device-pixel-tuned), the `999px` pill idiom, breakpoint thresholds
 *   (`@container`/`@media (... px)` are deliberate layout switches, not dimensions),
 *   and SVG-coordinate space (`viewBox`/`mask`/`data:image`/`url(...)`).
 *   counted — everything else: width/height/min-/max-/inset/top/left/gap/flex-basis…
 *
 * Usage: node scripts/audit-craft.mjs            (build gate; exit 1 on drift)
 *        node scripts/audit-craft.mjs --report   (list every offender; never exits 1)
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPORT_ONLY = process.argv.slice(2).includes('--report')

// The pinned count of magic-px literals in the kit. Lower this (never raise it)
// as the C2/C6 sweep tokenizes dimensions. See RATCHET CONTRACT above.
const BASELINE = 176

const SRC = 'src/kit/recipes/index.ts'
const HAIRLINE = new Set(['0.5', '1', '1.5', '2']) // borders + focus rings: device-tuned
const isBreakpoint = (l) => /@(container|media)\b/.test(l)
const isSvgCoord = (l) => /(mask|viewBox|data:image|url\()/i.test(l)

let raw = readFileSync(resolve(ROOT, SRC), 'utf8')
raw = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '') // strip comments

const offenders = []
raw.split('\n').forEach((line, i) => {
  if (isBreakpoint(line) || isSvgCoord(line)) return
  let s = line
  for (let k = 0; k < 4; k++) s = s.replace(/var\([^()]*\)/g, '') // peel var() fallbacks
  const isTokenDef = /--k-[a-z0-9-]+\s*:/.test(line)
  if (isTokenDef) return
  for (const m of s.matchAll(/(?<![\w.])([0-9]+(?:\.[0-9]+)?)px/g)) {
    const v = m[1]
    if (HAIRLINE.has(v) || v === '999') continue
    offenders.push({ line: i + 1, v, text: line.trim().slice(0, 100) })
  }
})

const count = offenders.length

if (REPORT_ONLY) {
  console.log(`=== audit:craft — magic-px report (${count} literals) ===`)
  const byVal = {}
  for (const o of offenders) byVal[o.v] = (byVal[o.v] || 0) + 1
  console.log('by value:', Object.entries(byVal).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}px:${n}`).join('  '))
  for (const o of offenders) console.log(`  ${SRC}:${o.line}\t${o.v}px\t${o.text}`)
  process.exit(0)
}

if (count === BASELINE) {
  console.log(`audit:craft — magic-px ratchet holds (${count} === baseline). Tokenize to ratchet down.`)
  process.exit(0)
}

if (count > BASELINE) {
  console.error(`audit:craft — REGRESSION: ${count} magic-px literals (baseline ${BASELINE}, +${count - BASELINE}).`)
  console.error('A raw Npx dimension desyncs when Scale/density re-scales the kit. Derive it from a')
  console.error('--k-* token (--k-icon-sm / --k-s-* / a calc), or run `npm run audit:craft -- --report`')
  console.error('to see the full list. Do NOT raise BASELINE to make this pass.')
  process.exit(1)
}

// count < BASELINE — improvement; force the win to be locked in.
console.error(`audit:craft — you removed ${BASELINE - count} magic-px literal(s) (now ${count}). Lock it in:`)
console.error(`set BASELINE = ${count} in scripts/audit-craft.mjs so the ratchet can't slip back.`)
process.exit(1)
