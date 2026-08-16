#!/usr/bin/env node
/**
 * audit:fonts — do the typefaces we offer survive the legibility test?
 *
 *   npm run dev  &&  node scripts/audit-fonts.mjs
 *
 * A design system for public services offers a font picker, and every entry in
 * it is a recommendation. The recipe comments already show the project accepts
 * this kind of judgement — Instrument Serif was dropped as "only legible as huge
 * hero type" — but the judgement was made by eye. This measures it.
 *
 * The test is character DISAMBIGUATION, the failure mode that matters for names,
 * addresses, reference numbers and postcodes — exactly the content a government
 * form is made of. If capital-I and lowercase-l rasterise identically, a person
 * reading a case number cannot tell them apart, and no amount of contrast fixes
 * that. The pairs are the standard set: I/l/1, 0/O, rn vs m.
 *
 * ⚠️ The instrument's own failure mode, and it took two tries. If a webfont has
 * not loaded we measure the FALLBACK and score every face identically.
 * `document.fonts.check()` is not enough — it returned true for ten faces that
 * were plainly not applied, and the tell was impossible data: a serif, a mono and
 * four sans faces scoring 59/18/48/5 to the digit. Typefaces that different
 * cannot agree that precisely.
 *
 * So loading is verified the way font detection has always been done: render a
 * string in the target family and in a deliberately absent sentinel family, and
 * compare the ink. Same ink = same font = the target never arrived, and it is
 * reported as unscored rather than scored on a lie.
 *
 * ⚠️ AND A LIMIT OF THE METRIC ITSELF, found by looking at the output rather than
 * trusting it. Pixel overlap UNDER-READS a small distinguishing mark: IBM Plex
 * Mono scored 91% on 0/O and JetBrains Mono 83%, and rendered side by side both
 * zeros carry an unmistakable centre dot. A slash or a dot is a few percent of
 * the ink and all of the meaning. Monospace faces are designed around exactly
 * that, so the score misjudges them systematically — they are reported but not
 * flagged, and a sans face near the bar is worth rendering before acting on it.
 */
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { APP } from './lib/base.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(here, '../src/tokens/fonts.ts'), 'utf8')

/** Read the offered families out of the source, so the audit cannot go stale. */
const listOf = (name) => {
  const m = src.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`))
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : []
}
const FAMILIES = [...listOf('GOOGLE_SANS'), ...listOf('GOOGLE_SERIF'), ...listOf('GOOGLE_MONO')]

/* Pairs a reader must be able to tell apart, and what each one costs when they
 * cannot. Ordered by how often the confusion actually bites. */
const PAIRS = [
  ['I', 'l', 'capital i vs lowercase L — reference numbers, names, postcodes'],
  ['0', 'O', 'zero vs capital O — account and case numbers'],
  ['rn', 'm', 'rn vs m — the classic word-level misread'],
  ['1', 'l', 'one vs lowercase L'],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 900, height: 600 } })
await page.goto(APP, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

/* Load every family with a real <link>, not addStyleTag.
 *
 * An @import injected after the fact is ignored — it is only valid at the top of
 * a stylesheet — which is why the first run scored two faces and reported
 * sixteen as absent. The absence was real; the cause was the loader, not the
 * fonts. Then force a paint of each family, because a webfont is only fetched
 * once something actually asks for it. */
await page.evaluate(async (families) => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${families
    .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;700`)
    .join('&')}&display=block`
  document.head.appendChild(link)
  await new Promise((r) => { link.onload = r; link.onerror = r; setTimeout(r, 8000) })

  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:40px'
  probe.innerHTML = families.map((f) => `<span style="font-family:'${f}'">Hxl0O1rnm</span>`).join('')
  document.body.appendChild(probe)
  await Promise.all(families.map((f) => document.fonts.load(`40px "${f}"`).catch(() => {})))
  await document.fonts.ready
}, FAMILIES)
await page.waitForTimeout(2500)

const results = await page.evaluate(
  ({ families, pairs }) => {
    const c = document.createElement('canvas')
    c.width = 220
    c.height = 160
    const ctx = c.getContext('2d', { willReadFrequently: true })

    /** Rasterise one string and return its ink as a flat array. */
    const ink = (text, family, px = 120) => {
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.fillStyle = '#000'
      ctx.font = `${px}px "${family}"`
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(text, 10, 130)
      const d = ctx.getImageData(0, 0, c.width, c.height).data
      const out = []
      for (let i = 3; i < d.length; i += 4) out.push(d[i] > 40 ? 1 : 0)
      return out
    }

    /** Share of pixels that agree, over the union of both marks. */
    const similarity = (a, b) => {
      let same = 0
      let union = 0
      for (let i = 0; i < a.length; i++) {
        if (a[i] || b[i]) { union++; if (a[i] === b[i]) same++ }
      }
      return union === 0 ? 1 : same / union
    }

    /* The sentinel: a family that certainly does not exist, so it renders in the
     * generic fallback. Anything matching it pixel-for-pixel is the fallback too. */
    const sentinel = ink('Hxl0O1rnm', '__no_such_family__')
    const isFallback = (family) => similarity(ink('Hxl0O1rnm', family), sentinel) > 0.995

    return families.map((family) => {
      if (isFallback(family)) return { family, loaded: false, worst: null, pairs: [] }

      const scored = pairs.map(([a, b, why]) => ({
        pair: `${a}/${b}`,
        why,
        similarity: Math.round(similarity(ink(a, family), ink(b, family)) * 100),
      }))

      // x-height as a share of cap-height: low x-height reads small at any size.
      const capH = ink('H', family).reduce((n, v) => n + v, 0)
      const xH = ink('x', family).reduce((n, v) => n + v, 0)

      return {
        family,
        loaded: true,
        pairs: scored,
        worst: scored.reduce((m, s) => (s.similarity > m.similarity ? s : m)),
        inkRatio: capH ? Math.round((xH / capH) * 100) : null,
      }
    })
  },
  { families: FAMILIES, pairs: PAIRS },
)

const notLoaded = results.filter((r) => !r.loaded)
if (notLoaded.length) {
  console.error(`\n⚠️  ${notLoaded.length} face(s) did not load and were NOT scored: ${notLoaded.map((r) => r.family).join(', ')}`)
  console.error('   Scoring them would have measured the fallback and rated every font identically.\n')
}

const scored = results.filter((r) => r.loaded).sort((a, b) => b.worst.similarity - a.worst.similarity)

console.log(`audit:fonts — ${scored.length} faces, worst-case glyph confusion\n`)
const MONO = new Set(['Geist Mono', 'IBM Plex Mono', 'JetBrains Mono'])
for (const r of scored) {
  // Monos distinguish with a dot or a slash, which the pixel metric cannot see.
  const flag = MONO.has(r.family) ? 'm' : r.worst.similarity >= 90 ? '✗' : r.worst.similarity >= 78 ? '·' : '✓'
  console.log(
    `  ${flag} ${r.family.padEnd(20)} worst ${String(r.worst.similarity).padStart(3)}% (${r.worst.pair})` +
    `   ${r.pairs.map((p) => `${p.pair}:${p.similarity}`).join(' ')}`,
  )
}
console.log(
  '\n  ✗ = the two marks are effectively the same shape · · = close · ✓ = distinct' +
  '\n  m = monospace; the metric under-reads their dotted/slashed zeros — verify by eye, not by score',
)
await browser.close()
