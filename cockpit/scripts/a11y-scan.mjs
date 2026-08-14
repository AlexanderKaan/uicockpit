/**
 * Measure our OWN accessibility, rather than assert it.
 *
 *   npm run dev     # in one terminal
 *   npm run a11y
 *
 * Round 1 of the design-system study found gaps by searching for things that
 * were ABSENT — no skip link, no error summary, no fieldset. That method cannot
 * find a bug in something that is present. This runs the industry-standard
 * engine over the live gallery and reports what is actually broken.
 *
 * axe-core is loaded into the page from a CDN rather than installed. A study
 * should not leave a dependency behind in a repo that hand-writes its own zip
 * parser; if this ever graduates into the build gate, install it properly then.
 *
 * TWO SCOPES, reported separately and never merged:
 *   · THE KIT   — inside `.cockpit-preview`. This is what we would claim a gold
 *                 standard for, and the only number that may ever be published.
 *   · OUR CHROME— the configurator around it. Ours to fix, but not the product.
 *
 * Also measures REAL geometry for small controls, because the CSS says a switch
 * is 32×18 and only the browser knows whether a label or a pseudo-element makes
 * the actual target bigger.
 */
import { chromium } from '@playwright/test'

const AXE = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js'
const BASE = process.env.BASE || 'http://localhost:5173'
/* WCAG 2.2 A + AA is the bar the study settled on: 2.1 AA is today's legal
 * floor under EN 301 549, 2.2 AA is where NL DS already is. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

page.on('pageerror', (e) => console.error('  page error:', e.message.slice(0, 120)))

console.log(`\nScanning ${BASE}/app — WCAG 2.2 A + AA\n`)
await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' })
await page.waitForSelector('.cockpit-preview', { timeout: 20000 })
// The gallery animates in with a stagger; a mid-entrance element measures wrong.
await page.waitForTimeout(1500)
await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' })
await page.addScriptTag({ url: AXE })

const run = async (selector, label) => {
  const res = await page.evaluate(
    async ({ sel, tags }) => {
      // eslint-disable-next-line no-undef
      const r = await axe.run(sel ? { include: [[sel]] } : document, {
        runOnly: { type: 'tag', values: tags },
        resultTypes: ['violations'],
      })
      return r.violations.map((v) => ({
        id: v.id, impact: v.impact, help: v.help, n: v.nodes.length,
        sample: v.nodes.slice(0, 2).map((n) => n.html.slice(0, 110)),
        /* Contrast failures group by COLOUR PAIR, and that is the difference
         * between a hundred bugs and three. The first run reported 106
         * violations; they were 16 pairs, and one token accounted for 63. */
        pairs: v.id !== 'color-contrast' ? [] : Object.entries(
          v.nodes.reduce((acc, n) => {
            const d = (n.any && n.any[0] && n.any[0].data) || {}
            const k = `${d.fgColor} on ${d.bgColor} — ${d.contrastRatio}:1 (need ${d.expectedContrastRatio})`
            acc[k] = (acc[k] || 0) + 1
            return acc
          }, {}),
        ).sort((a, b) => b[1] - a[1]),
      }))
    },
    { sel: selector, tags: TAGS },
  )
  const total = res.reduce((a, v) => a + v.n, 0)
  console.log(`── ${label} — ${res.length} rule(s) violated, ${total} element(s)\n`)
  for (const v of res.sort((a, b) => b.n - a.n)) {
    console.log(`  [${(v.impact || '?').padEnd(8)}] ${String(v.n).padStart(4)}×  ${v.id}`)
    console.log(`             ${v.help}`)
    for (const s of v.sample) console.log(`             · ${s}`)
    for (const [pair, n] of v.pairs || []) console.log(`             ${String(n).padStart(4)}×  ${pair}`)
  }
  if (!res.length) console.log('  ✓ nothing')
  console.log()
  return { rules: res.length, elements: total }
}

/* ── axe's contrast numbers have to be VERIFIED, not trusted ────────────────
 * axe parses the computed `oklch()` string with its own colour code, and for a
 * saturated colour that lands somewhere the browser never paints: it read our
 * calendar chip as #2e87d5 / 3.32:1 where the screen actually shows #016ccb /
 * 4.60:1 — a PASS reported as a failure. The error is small for greys and grows
 * with chroma, so a token system that emits OKLCH gets systematically wrong
 * answers on exactly its most saturated pairs.
 *
 * Ground truth is what the compositor paints, so we rasterise both colours
 * through a canvas and recompute. Anything axe flags that survives this is
 * real; anything that does not is the tool's arithmetic, and acting on it would
 * mean changing a design to satisfy a bug. */
const verifyContrast = async () => {
  return page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run({ include: [['.cockpit-preview']] },
      { runOnly: { type: 'rule', values: ['color-contrast'] }, resultTypes: ['violations'] })
    const c = document.createElement('canvas')
    c.width = c.height = 1
    const ctx = c.getContext('2d', { willReadFrequently: true })
    const px = (v) => {
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = v; ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2]]
    }
    const lum = ([r2, g, b]) => {
      const f = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
      return 0.2126 * f(r2) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const hex = (a) => '#' + a.map((x) => x.toString(16).padStart(2, '0')).join('')
    const real = []
    const bogus = []
    for (const v of r.violations) for (const n of v.nodes) {
      const el = document.querySelector(n.target[0])
      if (!el) continue
      const cs = getComputedStyle(el)
      let fg = px(cs.color)
      // Walk up for the first non-transparent background, as axe does.
      let bgEl = el
      let bgc = cs.backgroundColor
      while (bgEl && (bgc === 'rgba(0, 0, 0, 0)' || bgc === 'transparent')) {
        bgEl = bgEl.parentElement
        if (!bgEl) break
        bgc = getComputedStyle(bgEl).backgroundColor
      }
      const bg = px(bgc || '#ffffff')
      /* COMPOSITE the opacity chain, or this verifier produces false negatives —
       * which is the worse error, because it hides real failures behind a
       * confident "artifact". `.slot--off` is near-black text at opacity 0.4:
       * axe read the composited grey correctly and the first version of this
       * check called axe wrong. Multiply every ancestor's alpha, then blend. */
      let alpha = 1
      for (let a = el; a; a = a.parentElement) alpha *= Number(getComputedStyle(a).opacity || 1)
      if (alpha < 1) fg = fg.map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha)))
      const [x, y] = [lum(fg), lum(bg)]
      const ratio = (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
      const need = Number(((n.any && n.any[0] && n.any[0].data) || {}).expectedContrastRatio?.replace(':1', '') || 4.5)
      const row = { sel: n.target[0], fg: hex(fg), bg: hex(bg), ratio: ratio.toFixed(2), need }
      if (ratio < need) real.push(row); else bogus.push(row)
    }
    return { real, bogus }
  })
}

const kit = await run('.cockpit-preview', 'THE KIT (.cockpit-preview)')
const verified = await verifyContrast()
console.log(`── CONTRAST, VERIFIED AGAINST PAINTED PIXELS\n`)
console.log(`  ${verified.real.length} real · ${verified.bogus.length} axe artifacts (oklch mis-parsed)\n`)
for (const r of verified.real) {
  console.log(`  REAL   ${r.ratio}:1 (need ${r.need})  ${r.fg} on ${r.bg}`)
  console.log(`         ${r.sel.slice(0, 84)}`)
}
if (verified.bogus.length) {
  console.log(`\n  ${verified.bogus.length} flagged by axe but PASSING on screen — e.g.`)
  for (const r of verified.bogus.slice(0, 3)) console.log(`         ${r.ratio}:1  ${r.fg} on ${r.bg}  ${r.sel.slice(0, 60)}`)
}
console.log()
const all = await run(null, 'WHOLE PAGE (kit + our chrome)')

/* ── real hit-target geometry ────────────────────────────────────────────────
 * WCAG 2.5.8 AA wants 24×24 CSS px; NL DS holds itself to 2.5.5 AAA at 44×44.
 * Our own gate only inspects close/clear buttons, so a switch declared 32×18
 * has never actually been measured. */
const targets = await page.evaluate(() => {
  const sel = 'button,a[href],input,select,textarea,[role="switch"],[role="checkbox"],[role="radio"],[role="tab"],[role="menuitem"],summary'
  const out = []
  for (const el of document.querySelectorAll(`.cockpit-preview ${sel}`)) {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    const cls = (el.className?.toString?.() || el.tagName).trim().split(/\s+/)[0] || el.tagName
    out.push({ cls, w: Math.round(r.width), h: Math.round(r.height) })
  }
  return out
})

const byClass = new Map()
for (const t of targets) {
  const cur = byClass.get(t.cls) || { n: 0, minW: 1e9, minH: 1e9 }
  cur.n++; cur.minW = Math.min(cur.minW, t.w); cur.minH = Math.min(cur.minH, t.h)
  byClass.set(t.cls, cur)
}
const under24 = [...byClass.entries()].filter(([, v]) => v.minW < 24 || v.minH < 24)
const under44 = [...byClass.entries()].filter(([, v]) => (v.minW < 44 || v.minH < 44) && !(v.minW < 24 || v.minH < 24))

console.log(`── HIT TARGETS — ${targets.length} interactive elements measured\n`)
console.log(`  under 24×24 (WCAG 2.5.8 AA — ${under24.length} classes):`)
for (const [cls, v] of under24.sort((a, b) => a[1].minH - b[1].minH)) {
  console.log(`    ${String(v.minW).padStart(3)}×${String(v.minH).padStart(3)}  ${cls}  (${v.n}×)`)
}
if (!under24.length) console.log('    ✓ none')
console.log(`\n  under 44×44 but ≥24 (WCAG 2.5.5 AAA, the NL DS bar — ${under44.length} classes)`)

await browser.close()

console.log(`\n${'═'.repeat(70)}`)
console.log(`KIT: ${kit.rules} rules / ${kit.elements} elements   ·   ` +
  `PAGE: ${all.rules} rules / ${all.elements} elements   ·   ` +
  `under-24 targets: ${under24.length} classes`)
process.exit(kit.elements > 0 || under24.length > 0 ? 1 : 0)
