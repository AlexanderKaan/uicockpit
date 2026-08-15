/**
 * The harness — one loop: VARIATIONS × RULES.
 *
 * This exists because of a count. We had 26 gate scripts and ~3200 lines, and
 * what made them big was not the logic: sixteen brought their own parser of
 * src/kit/recipes/index.ts and five brought their own browser. The checks
 * themselves are small. So the harness owns the expensive things — one browser,
 * one page, one set of conditions — and a rule is a small function over a
 * rendered element.
 *
 * A VARIATION is a condition applied to the page: a width, a zoom level, dark
 * mode, a user stylesheet, later a content mutation. It runs in Node because it
 * needs the page. A RULE runs in the page because it needs the DOM and the
 * computed style. That is the whole architecture.
 *
 * TWO RULES ABOUT RULES, both learned expensively today.
 *
 * 1. DELEGATE TO AXE for everything axe covers. Its target-size rule computes
 *    WCAG 2.5.8's spacing allowance; ours did not, and reported 94 breaches
 *    where axe finds two. Reimplementing a well-tested checker is not thorough,
 *    it is a second thing to be wrong.
 * 2. EVERY CONDITION-DEPENDENT RULE IS A DELTA. What was already clipped before
 *    the condition was applied is not something the condition broke. Without the
 *    baseline, a scan reports the visually-hidden mechanism as the bug — which
 *    ours did, twice.
 *
 * And the reporting axis is inverted on purpose: findings are grouped BY
 * COMPONENT, not by rule. "audit:craft found 170 magic px" is a fact about a
 * script. "Slider: four findings" is a review.
 */
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const RULES_PATH = join(HERE, 'rules.browser.js')
const AXE = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js'
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/**
 * The conditions a component has to survive. Widths are not a sample — they are
 * the ones where the gallery actually reflows, found by sweeping 1440→320 and
 * noticing failures at 1200, 768, 480, 390 and 320 while 1024, 900 and 600 were
 * clean. A tidy three-width sample would have missed most of them.
 */
export const VARIATIONS = [
  { id: 'base', label: 'baseline 1440px', width: 1440 },
  { id: 'w1200', label: '1200px', width: 1200 },
  { id: 'w768', label: '768px', width: 768 },
  { id: 'w480', label: '480px', width: 480 },
  { id: 'w320', label: '320px', width: 320 },
  {
    id: 'zoom200',
    label: '200% text',
    width: 1280,
    css: 'html { font-size: 32px !important }',
  },
  {
    id: 'textspacing',
    label: 'user text-spacing (1.4.12)',
    width: 1440,
    // Exactly the four overrides the SC names — the scenario, not a suggestion.
    css: `.cockpit-preview, .cockpit-preview * {
      line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important;
    } .cockpit-preview p { margin-block-end: 2em !important }`,
  },
]

/** Run every rule under every variation. Returns findings grouped by component. */
export async function runHarness({
  url = 'http://localhost:5173/app',
  rootSel = '.cockpit-preview',
  variations = VARIATIONS,
  withAxe = true,
} = {}) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector(rootSel, { timeout: 25000 })
  await page.waitForTimeout(1500)
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' })

  await page.addScriptTag({ path: RULES_PATH })
  const meta = await page.evaluate(() => window.__uicMeta())

  const findings = []
  let baseline = null

  for (const v of variations) {
    await page.setViewportSize({ width: v.width, height: 1000 })
    let styleHandle = null
    if (v.css) styleHandle = await page.addStyleTag({ content: v.css })
    await page.waitForTimeout(550)

    const raw = await page.evaluate((sel) => window.__uicRun(sel, {}), rootSel)

    if (v.id === 'base') baseline = raw
    for (const [ruleId, list] of Object.entries(raw)) {
      let effective = list
      if (meta[ruleId]?.delta && baseline && v.id !== 'base') {
        /* Subtract what was already true at baseline, matched on the exact
         * element+detail pair so a genuinely worsened box still reports. */
        const before = new Set((baseline[ruleId] ?? []).map((f) => `${f.component}|${f.el}`))
        effective = list.filter((f) => !before.has(`${f.component}|${f.el}`))
      }
      for (const f of effective) findings.push({ ...f, rule: ruleId, variation: v.id, ...meta[ruleId] })
    }

    if (withAxe) {
      await page.addScriptTag({ url: AXE }).catch(() => {})
      const axeRows = await page.evaluate(async ({ sel, tags }) => {
        // eslint-disable-next-line no-undef
        const res = await axe.run({ include: [[sel]] }, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })
        return res.violations.flatMap((vi) => vi.nodes.map((n) => {
          const el = document.querySelector(n.target[0])
          const card = el?.closest('[data-recipe], [data-card]')
          return {
            component: card?.getAttribute('data-recipe') || card?.getAttribute('data-card') || '(unattributed)',
            el: String(n.target[0]).slice(0, 44),
            detail: (n.any[0]?.message || vi.help || '').slice(0, 90),
            rule: 'axe:' + vi.id,
            dimension: 'A/B/C',
            wcag: (vi.tags.find((t) => /^wcag\d{3}$/.test(t)) || '').replace(/^wcag(\d)(\d)(\d)$/, '$1.$2.$3'),
          }
        }))
      }, { sel: rootSel, tags: AXE_TAGS })
      for (const r of axeRows) findings.push({ ...r, variation: v.id })
    }

    if (styleHandle) await page.evaluate((h) => h.remove(), styleHandle)
  }

  await browser.close()
  return { findings, meta, variations }
}

/** Group findings by component — the axis a review needs, not the one a gate uses. */
export function byComponent(findings) {
  const map = new Map()
  for (const f of findings) {
    const key = f.component || '(unattributed)'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(f)
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
}
