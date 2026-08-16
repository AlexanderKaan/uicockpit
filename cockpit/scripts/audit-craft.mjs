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

/* TARGETS, each with its own ratchet.
 *
 * This gate read ONE file for its whole life — the kit — which is why the kit
 * holds and the chrome does not. All 26 gates in this repo did the same, so the
 * 6177 lines and 1047 classes that dress the product had never been looked at by
 * anything. Every re-implementation found in the dogfood pass — a second motion
 * system, a hand-rolled menu, a copied scrollbar, a 24px lock fighting the
 * control ladder — survived on that blind spot rather than on anyone's decision.
 *
 * Separate baselines on purpose: mixing them would let the chrome's debt hide
 * behind the kit's progress, and the two are worked by different passes. */
/* The chrome's baselines are the TRUE measured counts, pinned on the day the
   gate first looked at these files. 1356 against the kit's 170 — eight times the
   debt in the code that dresses the product, which is what happens when nothing
   has ever counted. My own quick estimate beforehand said ~550, because I only
   counted values that sit on the spacing scale; the gate counts every literal.
   Estimating and measuring disagreed by a factor of two, again. */
const TARGETS = [
  { src: 'src/kit/recipes/index.ts', baseline: 147, what: 'the kit' },
  { src: 'src/styles/panel.css',      baseline: 169,  what: 'the panel' },
  { src: 'src/styles/stage.css',      baseline: 189,  what: 'the stage + topbar' },
  { src: 'src/styles/chrome.css',     baseline: 53,  what: 'the app shell' },
  { src: 'src/styles/modal.css',      baseline: 164,  what: 'modals + toasts' },
  { src: 'src/styles/preview-only.css', baseline: 30, what: 'the gallery harness' },
  { src: 'src/styles/marketing.css',  baseline: 696, what: 'the marketing site' },
]
const HAIRLINE = new Set(['0.5', '1', '1.5', '2']) // borders + focus rings: device-tuned
const isBreakpoint = (l) => /@(container|media)\b/.test(l)
const isSvgCoord = (l) => /(mask|viewBox|data:image|url\()/i.test(l)

function scan(SRC) {
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
return offenders
}

/* One pass per target, and the verdict is the WORST of them: a chrome regression
 * must not pass because the kit improved on the same day. */
const results = TARGETS.map((t) => ({ ...t, offenders: scan(t.src) }))
let failed = false

if (REPORT_ONLY) {
  for (const r of results) {
    console.log(`\n=== ${r.src} — ${r.offenders.length} magic-px literals (baseline ${r.baseline}) ===`)
    const byVal = {}
    for (const o of r.offenders) byVal[o.v] = (byVal[o.v] || 0) + 1
    console.log('by value:', Object.entries(byVal).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}px:${n}`).join('  '))
    for (const o of r.offenders.slice(0, 40)) console.log(`  ${r.src}:${o.line}\t${o.v}px\t${o.text}`)
  }
  process.exit(0)
}

for (const r of results) {
  const count = r.offenders.length
  if (count === r.baseline) {
    console.log(`  ✓ ${r.what.padEnd(22)} ${String(count).padStart(4)} === baseline`)
    continue
  }
  failed = true
  if (count > r.baseline) {
    console.error(`  ✗ ${r.what.padEnd(22)} ${String(count).padStart(4)} magic-px literals — baseline ${r.baseline}, +${count - r.baseline}  (${r.src})`)
    console.error('      A raw Npx desyncs the moment Scale re-scales the kit. Use a --k-* token or a calc.')
  } else {
    console.error(`  ↓ ${r.what.padEnd(22)} ${String(count).padStart(4)} — you removed ${r.baseline - count}. Lock it in: set baseline ${count} in scripts/audit-craft.mjs`)
  }
}

if (!failed) {
  console.log('audit:craft — every ratchet holds. Tokenize to ratchet down.')
  process.exit(0)
}
console.error('\nDo NOT raise a baseline to make this pass. `npm run audit:craft -- --report` lists them.')
process.exit(1)
