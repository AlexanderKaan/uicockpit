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
  }
  if (!res.length) console.log('  ✓ nothing')
  console.log()
  return { rules: res.length, elements: total }
}

const kit = await run('.cockpit-preview', 'THE KIT (.cockpit-preview)')
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
