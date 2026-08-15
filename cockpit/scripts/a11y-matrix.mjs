/**
 * The same scan, across every configuration a visitor can actually choose.
 *
 *   npm run dev  &&  node scripts/a11y-matrix.mjs
 *
 * `npm run a11y` measures ONE config: light, default density, 1440px. That is
 * the number we have been quoting, and it is not the number a claim can rest
 * on — P1 rebuilt the ink ramp and P4 moved the comfortable rung, so the other
 * five combinations have never been measured at all. Dark mode in particular
 * runs a completely different neutral scale.
 *
 * Driven through the real controls rather than a synthesised URL, so it also
 * proves the paths a person would take.
 */
import { chromium } from '@playwright/test'
import { deriveTargets, NOT_A_TARGET } from './lib/interactive-targets.mjs'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const SCALES = ['compact', 'default', 'comfortable']

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' })
await page.waitForSelector('.cockpit-preview', { timeout: 20000 })
await page.waitForTimeout(1200)
await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' })

const setScale = (i) => page.evaluate((idx) => {
  const row = [...document.querySelectorAll('.fmrow')].find((r) => r.textContent.includes('Scale'))
  const inp = row?.querySelector('input[type="range"]')
  if (!inp) return false
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(inp, String(idx))
  inp.dispatchEvent(new Event('input', { bubbles: true }))
  inp.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}, i)

const toggleMode = () => page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /Switch to (dark|light) mode/.test(x.getAttribute('aria-label') || ''))
  b?.click()
  return !!b
})

const scan = () => page.evaluate(async (tags) => {
  // eslint-disable-next-line no-undef
  const r = await axe.run({ include: [['.cockpit-preview']] },
    { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })
  const c = document.createElement('canvas'); c.width = c.height = 1
  const ctx = c.getContext('2d', { willReadFrequently: true })
  const px = (v) => { ctx.clearRect(0,0,1,1); ctx.fillStyle = v; ctx.fillRect(0,0,1,1)
    const d = ctx.getImageData(0,0,1,1).data; return [d[0],d[1],d[2]] }
  const lum = ([r2,g,b]) => { const f=(v)=>{const x=v/255;return x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4}
    return 0.2126*f(r2)+0.7152*f(g)+0.0722*f(b) }
  const rows = []
  for (const v of r.violations) for (const n of v.nodes) {
    let detail = ''
    if (v.id === 'color-contrast') {
      const el = document.querySelector(n.target[0])
      if (el) {
        const cs = getComputedStyle(el)
        let fg = px(cs.color)
        let bgEl = el, bgc = cs.backgroundColor
        while (bgEl && (bgc === 'rgba(0, 0, 0, 0)' || bgc === 'transparent')) {
          bgEl = bgEl.parentElement; if (!bgEl) break; bgc = getComputedStyle(bgEl).backgroundColor
        }
        const bg = px(bgc || '#ffffff')
        let a = 1
        for (let p = el; p; p = p.parentElement) a *= Number(getComputedStyle(p).opacity || 1)
        if (a < 1) fg = fg.map((x, i) => Math.round(x * a + bg[i] * (1 - a)))
        const [x, y] = [lum(fg), lum(bg)]
        detail = `${((Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)).toFixed(2)}:1`
      }
    }
    rows.push({ id: v.id, impact: v.impact, sel: n.target[0]?.toString().slice(0, 56), detail })
  }
  return rows
}, TAGS)

const results = []
for (const mode of ['light', 'dark']) {
  for (let i = 0; i < SCALES.length; i++) {
    await setScale(i)
    await page.waitForTimeout(500)
    await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js' })
    const rows = await scan()
    results.push({ mode, scale: SCALES[i], rows })
    console.log(`${mode.padEnd(6)} ${SCALES[i].padEnd(12)} ${rows.length === 0 ? '✓ 0' : `✗ ${rows.length}`}`)
    const g = new Map()
    for (const r of rows) {
      const k = `${r.id}|${r.detail}|${(r.sel.match(/[.#][\w-]+/g) || []).slice(-2).join('')}`
      g.set(k, (g.get(k) || 0) + 1)
    }
    for (const [k, n] of [...g].sort((a, b) => b[1] - a[1])) {
      const [id, detail, sel] = k.split('|')
      console.log(`         ${String(n).padStart(3)}x  ${id} ${detail.padEnd(8)} ${sel}`)
    }
  }
  if (mode === 'light') { await toggleMode(); await page.waitForTimeout(700) }
}
/* ── Target size, measured on the RENDERED page ────────────────────────────
 *
 * A unit test on the tokens is not enough and we proved it the hard way: the
 * first version of the AAA floor set `--k-btn-h-default` to 44 and passed its
 * own test while `.menu__item` still rendered at 28px, because menus read a
 * different ladder (`--k-row-h-*`) and tabs and segments had no height at all.
 * The token was right and the page was wrong. So the claim is checked where the
 * claim lives. */
console.log('\n── Target size (Conformance) ' + '─'.repeat(35))
/* The denominator is DERIVED, not listed — see scripts/lib/interactive-targets.mjs
 * for why, in short: this scan used to carry eleven selectors and printed a zero
 * over everything nobody had remembered to add to them. */
const targets = () => page.evaluate(deriveTargets, {
  rootSel: '.cockpit-preview', exclude: NOT_A_TARGET, floor: 44,
})

const setConformance = (want) => page.evaluate((w) => {
  const row = [...document.querySelectorAll('.fmrow')].find((r) => r.textContent.includes('Conformance'))
  const btn = [...(row?.querySelectorAll('button') || [])].find((b) => (w === 'aaa' ? /AAA/ : /AA$|WCAG AA/).test(b.textContent.trim()))
  btn?.click(); return !!btn
}, want)

await setConformance('aaa')
await page.waitForTimeout(900)
/* BOTH floors, because they are different promises. 2.5.8 (AA, 24px) is what the
 * kit claims in every configuration; 2.5.5 (AAA, 44px) only at the AAA setting.
 * Reporting the AAA number alone made a long list that is mostly not a breach of
 * anything we claim, which is its own way of being useless. */
const aa24 = await page.evaluate(deriveTargets, { rootSel: '.cockpit-preview', exclude: NOT_A_TARGET, floor: 24 })
console.log(`  2.5.8 AA  (24px) ${aa24.under === 0 ? '✓' : '✗'} ${aa24.under}/${aa24.total} derived targets under 24px on EITHER axis`)
for (const [name, g] of Object.entries(aa24.groups ?? {}).sort((a, b) => b[1].n - a[1].n).slice(0, 14)) {
  console.log(`       ${String(g.size).padStart(14)}  x${String(g.n).padStart(3)}  ${name}`)
}

const aaa = await targets()
console.log(`\n  2.5.5 AAA (44px) ${aaa.under === 0 ? '✓' : '✗'} ${aaa.under}/${aaa.total} derived targets under 44px on EITHER axis`)
for (const [name, g] of Object.entries(aaa.groups ?? {}).sort((a, b) => b[1].n - a[1].n).slice(0, 8)) {
  console.log(`       ${String(g.size).padStart(14)}  x${String(g.n).padStart(3)}  ${name}`)
}
// Exclusions are printed, never silent: a scan that quietly drops things is
// indistinguishable from one that missed them.
for (const [sel, n] of Object.entries(aaa.skipped ?? {})) {
  console.log(`       excluded x${String(n).padStart(3)}  ${sel}`)
}
if (aaa.under > 0) results.push({ mode: 'aaa', scale: 'targets', rows: Array(aaa.under).fill({ id: 'target-size' }) })

await browser.close()
const total = results.reduce((a, r) => a + r.rows.length, 0)
console.log(`\n${'═'.repeat(64)}\n${total} violation(s) across ${results.length} configurations`)
process.exit(total ? 1 : 0)
