#!/usr/bin/env node
/**
 * audit-hit-target.mjs — Invariant I4 (touch target floor) gate.
 *
 * WHY: the floor is WCAG-AA (24×24px), NOT AAA (44px) — dense data UI (table rows,
 * dropdown options, tree rows) legitimately runs ~28px and forcing 44 would bloat
 * it. The real failure is a SMALL standalone control — the tiny × / clear / close
 * button on a chip — sized below 24px as its own sole target. The fix keeps the
 * visual glyph small but extends the CLICK area with a transparent `::before` to 24.
 * This gate flags a remove/close/clear control sized < 24px that has no such
 * hit-area extension, so a 16px touch target can't ship unnoticed.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const SRC = 'src/kit/recipes/index.ts'
const AA = 24

// Class parts that denote a small STANDALONE control (its own tap target).
const SMALL_CONTROL = /__(remove|x|close|clear|dismiss)\b/

const css = readFileSync(resolve(ROOT, SRC), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))

const fails = []
for (const m of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
  const selector = m[1].trim()
  const body = m[2]
  // Only the base rule of a small-control class (skip :hover / ::before / etc).
  if (!SMALL_CONTROL.test(selector) || /::|:hover|:focus|:active/.test(selector)) continue
  const w = (body.match(/\bwidth\s*:\s*(\d+)px/) || [])[1]
  const h = (body.match(/\bheight\s*:\s*(\d+)px/) || [])[1]
  const min = Math.min(...[w, h].filter(Boolean).map(Number))
  if (!Number.isFinite(min) || min >= AA) continue
  // A hit-area extension (::before/::after on the same class) lifts the tap target.
  const cls = (selector.match(/\.([\w-]+__(?:remove|x|close|clear|dismiss))/) || [])[1]
  if (cls && new RegExp(`\\.${cls}::(before|after)`).test(css)) continue
  const line = css.slice(0, m.index + m[1].length).split('\n').length
  fails.push({ line, selector: selector.slice(0, 60), min })
}

if (fails.length) {
  console.error('=== audit:hit-target — Invariant I4 (touch target floor) ===')
  for (const f of fails) {
    console.error(`  ✗ ${SRC}:${f.line} — '${f.selector}' is a ${f.min}px control, below the ${AA}px WCAG-AA floor, with no hit-area extension.`)
    console.error(`      Keep the glyph; add \`.${'<class>'}::before { content:''; position:absolute; inset:-Npx }\` to reach ${AA}px.`)
  }
  console.error(`\n${fails.length} sub-${AA}px tap target(s). Extend the click area; don't ship a 16px button.`)
  process.exit(1)
}
console.log(`audit:hit-target — clean (every small control reaches the ${AA}px WCAG-AA tap floor; I4 holds)`)
