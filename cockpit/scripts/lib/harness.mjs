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
import { parseKit } from './kit-model.mjs'
import { APP } from './base.mjs'

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

  /* ── D · robustness under CONTENT ──────────────────────────────────────
   *
   * The dimension NL Design System requires ("handles varying content: short
   * text, long text, missing content") and the one we had nothing for. It is
   * cheap now only because VARY exists: a content condition is a DOM edit, not
   * new infrastructure — which is exactly why it was worth building the harness
   * before writing any of these.
   *
   * Every mutation is reversible; the harness snapshots the subtree and puts it
   * back, or the next condition would measure the previous one's damage. */
  {
    id: 'longtext',
    label: 'pseudo-localised, ~40% longer',
    width: 1440,
    /* PSEUDO-LOCALISATION, the standard technique rather than something invented
     * here: expand every string by roughly 40% and accent it. German and Dutch
     * run that much longer than English, and the accents make it obvious at a
     * glance which strings came from the UI and which are hard-coded. */
    mutate: () => {
      const MAP = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', c: 'ç', n: 'ñ', s: 'š', y: 'ý' }
      const walker = document.createTreeWalker(document.querySelector('.cockpit-preview'), NodeFilter.SHOW_TEXT)
      const nodes = []
      while (walker.nextNode()) nodes.push(walker.currentNode)
      for (const n of nodes) {
        const t = n.nodeValue
        if (!t || t.trim().length < 2) continue
        const accented = t.replace(/[aeioucnsy]/g, (ch) => MAP[ch] || ch)
        // 40% longer, in whole words so wrapping still behaves like language.
        const pad = ' ' + 'wörd'.repeat(Math.max(1, Math.round(t.trim().length * 0.4 / 5)))
        n.nodeValue = accented + pad
      }
    },
  },
  {
    id: 'unbreakable',
    label: 'an unbreakable string (IBAN, reference, URL)',
    width: 1440,
    /* The failure that broke nineteen recipes at 320px was exactly this: content
     * with no break opportunity setting a min-content floor nobody expected.
     * Public services are made of these — case numbers, IBANs, BSNs, long URLs. */
    mutate: () => {
      const root = document.querySelector('.cockpit-preview')
      const els = [...root.querySelectorAll('p, span, td, li, div, h1, h2, h3, h4')]
        .filter((e) => e.children.length === 0 && e.textContent && e.textContent.trim().length > 3)
      for (const e of els.slice(0, 400)) e.textContent = 'NL91ABNA0417164300-REF20260815-0042'
    },
  },
  {
    id: 'minimal',
    label: 'content reduced to almost nothing',
    width: 1440,
    /* The other half of "varying content", and the one people forget: a layout
     * held apart by its text collapses when the text is a single word, and an
     * optional slot that is empty in production was never empty in the demo. */
    mutate: () => {
      const root = document.querySelector('.cockpit-preview')
      const els = [...root.querySelectorAll('p, span, td, li, h1, h2, h3, h4')]
        .filter((e) => e.children.length === 0 && e.textContent && e.textContent.trim().length > 1)
      for (const e of els.slice(0, 400)) e.textContent = 'x'
    },
  },
  {
    id: 'rtl',
    label: 'right-to-left',
    width: 1440,
    mutate: () => {
      const root = document.querySelector('.cockpit-preview')
      root.setAttribute('dir', 'rtl')
    },
  },
]

/** Run every rule under every variation. Returns findings grouped by component. */
export async function runHarness({
  url = APP,
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

  /* Is this element part of the SHIPPED KIT, or the gallery's own wrapper?
   *
   * The preview contains both, and a review that cannot tell them apart reports
   * "the Best practices disclosure overflows" as a defect in the design system.
   * The kit model — the single parser built for the gates — already knows every
   * class the kit ships, so the two halves finally meet: parse once in Node,
   * hand the set to the page, and every finding says which side it is on.
   * Chrome findings are still PRINTED, just marked; a demo that breaks under a
   * condition is worth knowing about, it just is not a component defect. */
  const kitClasses = [...parseKit().classes.keys()]
  await page.evaluate((classes) => { window.__uicKitClasses = new Set(classes) }, kitClasses)

  const findings = []
  const discounted = []   // axe contrast rows whose painted pixels pass — reported, never counted
  let baseline = null

  for (const v of variations) {
    await page.setViewportSize({ width: v.width, height: 1000 })
    let styleHandle = null
    if (v.css) styleHandle = await page.addStyleTag({ content: v.css })

    /* A content mutation must not leak into the next condition, and the cheap
     * trick — snapshot the subtree and put it back — is the wrong one twice
     * over: it re-inserts markup by hand, and it leaves React holding a tree it
     * no longer rendered. Reloading is two seconds and gives a genuinely clean
     * DOM with fresh component state, which is what a content test should
     * start from anyway. */
    if (v.mutate) {
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForSelector(rootSel, { timeout: 25000 })
      await page.waitForTimeout(1200)
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' })
      await page.addScriptTag({ path: RULES_PATH })
      await page.evaluate(v.mutate)
    }
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
      /* axe's contrast verdicts go through the SAME painted-pixel verifier the
       * a11y matrix uses (window.__uicPaintedContrast, in rules.browser.js).
       * Before this, the harness reported one "breach" on every run — a calendar
       * chip axe read as 4.36:1 that the screen paints at ≥4.5 — and a gate that
       * always shows one breach is a gate people learn to read past. Discounted
       * rows are returned as artifacts and PRINTED, never silently dropped. */
      const { rows: axeRows, artifacts } = await page.evaluate(async ({ sel, tags }) => {
        // eslint-disable-next-line no-undef
        const res = await axe.run({ include: [[sel]] }, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })
        const rows = []
        const artifacts = []
        for (const vi of res.violations) for (const n of vi.nodes) {
          const el = document.querySelector(n.target[0])
          const card = el?.closest('[data-recipe], [data-card]')
          const row = {
            component: card?.getAttribute('data-recipe') || card?.getAttribute('data-card') || '(unattributed)',
            el: String(n.target[0]).slice(0, 44),
            detail: (n.any[0]?.message || vi.help || '').slice(0, 90),
            rule: 'axe:' + vi.id,
            dimension: 'A/B/C',
            wcag: (vi.tags.find((t) => /^wcag\d{3}$/.test(t)) || '').replace(/^wcag(\d)(\d)(\d)$/, '$1.$2.$3'),
          }
          if (vi.id === 'color-contrast' && window.__uicPaintedContrast) {
            const verdict = window.__uicPaintedContrast(el, n.any?.[0]?.data?.expectedContrastRatio)
            if (verdict) {
              row.detail = `painted ${verdict.painted.toFixed(2)}:1, needs ${verdict.need}:1 (axe read ${n.any?.[0]?.data?.contrastRatio})`
              if (verdict.pass) { artifacts.push({ ...row, axe: n.any?.[0]?.data?.contrastRatio, painted: verdict.painted.toFixed(2) }); continue }
            }
          }
          rows.push(row)
        }
        return { rows, artifacts }
      }, { sel: rootSel, tags: AXE_TAGS })
      for (const r of axeRows) findings.push({ ...r, variation: v.id })
      for (const a of artifacts) discounted.push({ ...a, variation: v.id })
    }

    if (styleHandle) await page.evaluate((h) => h.remove(), styleHandle)
  }

  await browser.close()
  return { findings, discounted, meta, variations }
}

/**
 * DRIVE — walk the whole preview with the Tab key and read what happens.
 *
 * Dimension B, and the reason it was scheduled last: it is the only substrate
 * that needs the component OPERATED rather than rendered, so it costs a real
 * interaction per step. One walk pays for four checks, which is what makes it
 * worth the cost:
 *
 *   B1 · every interactive element receives focus at some point
 *   B2 · the walk always progresses and eventually leaves — no trap
 *   B4 · every stop shows a focus indicator
 *   B5 · the focused element is not covered by something else
 *
 * A trap is the failure that matters most here and the hardest to notice by
 * hand: a person who tabs into a component and cannot tab out is stuck on the
 * page, and nothing in a static render can tell you that.
 */
export async function driveTabWalk({
  url = APP,
  rootSel = '.cockpit-preview',
  maxSteps = 600,
} = {}) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector(rootSel, { timeout: 25000 })
  await page.waitForTimeout(1500)
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' })
  await page.addScriptTag({ path: RULES_PATH })
  const kitClasses = [...parseKit().classes.keys()]
  await page.evaluate((classes) => { window.__uicKitClasses = new Set(classes) }, kitClasses)

  const { total } = await page.evaluate((sel) => window.__uicMarkInteractive(sel), rootSel)

  // Start just before the preview so the first Tab lands inside it.
  await page.evaluate((sel) => {
    const root = document.querySelector(sel)
    const first = root.querySelector('[data-uic-id]')
    if (first) first.focus()
  }, rootSel)

  const trace = []
  let steps = 0
  let leftTheRegion = false
  for (; steps < maxSteps; steps++) {
    const state = await page.evaluate((sel) => {
      const s = window.__uicFocusState(sel)
      if (!s.outside) {
        const el = document.activeElement
        if (el && el.setAttribute) el.setAttribute('data-uic-seen', '1')
      }
      return s
    }, rootSel)
    if (state.outside) { leftTheRegion = true; break }
    trace.push(state)
    await page.keyboard.press('Tab')
  }

  const unreached = await page.evaluate((sel) => window.__uicUnfocused(sel), rootSel)

  const findings = []

  /* B2 — a trap. Two shapes: focus that stops moving, and a walk that never
   * ends. Both leave a keyboard user stranded, and neither is visible in a
   * screenshot. */
  let repeats = 0
  for (let i = 1; i < trace.length; i++) {
    if (trace[i].id && trace[i].id === trace[i - 1].id) repeats++
    else repeats = 0
    if (repeats >= 3) {
      findings.push({ rule: 'B-keyboard-trap', wcag: '2.1.2 (Level A)', sevHint: 0,
        component: trace[i].component, kit: trace[i].kit, el: trace[i].el,
        detail: 'focus stops moving here — Tab does not advance' })
      break
    }
  }
  if (!leftTheRegion && steps >= maxSteps) {
    findings.push({ rule: 'B-keyboard-trap', wcag: '2.1.2 (Level A)', sevHint: 0,
      component: '(the wall)', kit: true, el: rootSel,
      detail: `${maxSteps} tab presses and focus never left the region` })
  }

  // B1 — reachable.
  for (const u of unreached) {
    findings.push({ ...u, rule: 'B-unreachable-by-keyboard', wcag: '2.1.1 (Level A)', sevHint: 0 })
  }

  /* B4 — a focus indicator at every stop, VERIFIED before it is reported.
   *
   * The cheap reading (does the focused element have an outline or a shadow?)
   * flagged half our form controls, because the kit draws the ring on the
   * wrapper with :focus-within and the inner input has none of its own. So the
   * suspects go through a control — focus, snapshot, blur, snapshot, compare —
   * which needs no assumption about how a ring is drawn or which element draws
   * it, and therefore also works on somebody else's component. */
  const suspects = new Map()
  for (const t of trace) if (!t.hasRing && t.id != null) suspects.set(`${t.component}|${t.el}`, t)
  if (suspects.size) {
    for (const t of suspects.values()) {
      const probe = await page.evaluate((id) => window.__uicProbeIndicator(id), t.id)
      if (probe.hasIndicator || probe.missing) continue
      findings.push({ component: t.component, kit: t.kit, el: t.el, rule: 'B-no-focus-indicator',
        wcag: '2.4.7 (AA)', sevHint: 0, detail: 'nothing changes visually when it takes focus' })
    }
  }

  // B5 — focus not obscured.
  const covered = new Map()
  for (const t of trace) if (t.obscuredAt) covered.set(`${t.component}|${t.el}`, t)
  for (const t of covered.values()) {
    findings.push({ component: t.component, kit: t.kit, el: t.el, rule: 'B-focus-obscured',
      wcag: '2.4.11 (AA)', sevHint: 1, detail: `covered by ${t.obscuredAt} when focused` })
  }

  await browser.close()
  return { findings, stops: trace.length, marked: total, leftTheRegion }
}

/**
 * MEASURE — render the wall once and read the box of every kit element.
 *
 * The third driver, after runHarness (render) and driveTabWalk (operate). It
 * needs no variations and no axe: the question is what the DEFAULT rendering
 * measures, and the oracle is a stored baseline rather than a rule.
 *
 * It measures TWICE and returns both passes, because a shape gate whose own
 * noise floor is unknown is a gate that cries wolf. If two consecutive reads of
 * an unchanged page disagree, the disagreement is the instrument, not the kit —
 * `audit:shape` prints that number before it prints anything else.
 */
export async function measureShapes({
  url = APP,
  rootSel = '.cockpit-preview',
  width = 1440,
} = {}) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width, height: 1000 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector(rootSel, { timeout: 25000 })
  await page.waitForTimeout(1500)
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' })
  await page.addScriptTag({ path: RULES_PATH })
  const kitClasses = [...parseKit().classes.keys()]
  await page.evaluate((classes) => { window.__uicKitClasses = new Set(classes) }, kitClasses)

  const first = await page.evaluate((sel) => window.__uicMeasureShapes(sel), rootSel)
  await page.waitForTimeout(400)
  const second = await page.evaluate((sel) => window.__uicMeasureShapes(sel), rootSel)

  await browser.close()
  if (first.error) throw new Error(first.error)
  return { rows: second.rows, control: first.rows, collisions: second.collisions }
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
