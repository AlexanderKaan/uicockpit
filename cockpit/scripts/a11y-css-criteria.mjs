/**
 * The three WCAG AA criteria a CSS kit owns and nothing else does.
 *
 *   npm run dev  &&  node scripts/a11y-css-criteria.mjs
 *
 * Our conformance report lists thirteen criteria and none of these three, which
 * is a gap the wider design-system sample made obvious: page titles and media
 * alternatives belong to the consumer, but whether a component survives a user's
 * own text spacing, a 320px viewport, or 200% zoom is decided entirely by the
 * stylesheet. If we own anything, we own these.
 *
 * 1.4.12 Text Spacing — the user forces line-height 1.5, letter-spacing 0.12em,
 *   word-spacing 0.16em, paragraph spacing 2em. Nothing may be clipped or lost.
 *   This is the one CSS kits fail, because fixed heights and overflow:hidden are
 *   everywhere and both look fine until someone's stylesheet arrives.
 * 1.4.10 Reflow — 320 CSS px with no two-dimensional scrolling.
 * 1.4.4 Resize Text — 200% with no loss of content or function.
 */
import { chromium } from '@playwright/test'


/* Two guards, and BOTH were added because the scan reported the solution as the
 * bug. This is the file's own recurring failure mode, so they are named.
 *
 * 1. Visually-hidden is DETECTED, not listed. The first run flagged .sr-only and
 *    .skiplink — a 1px box with overflow:hidden is the entire mechanism. Matching
 *    class names fixed those two and missed the next one: `.table--stack thead`
 *    is made visually-hidden by a selector, carries no class at all, and was
 *    duly reported as a text-spacing failure. Structure is the honest test.
 *
 * 2. A CONTROL run, at baseline, before any override is applied. Without it the
 *    scan cannot tell "the user's stylesheet broke this" from "this box has
 *    always clipped" — and SC 1.4.12 asks the first question only. It withdrew
 *    .filegrid__cover--doc, whose faux page-edge is a pseudo-element deliberately
 *    running past the bottom edge, at every text size, with or without overrides.
 *
 * What clips at baseline is still worth seeing, so it is printed — as a separate
 * list that needs an eye, not as a criterion failure it isn't. */
/** Runs IN THE PAGE: every element whose own box hides its text. 1.4.12 + 1.4.4. */
function clippingIn(sel) {
  const visuallyHidden = (e) => {
    const cs = getComputedStyle(e)
    const r = e.getBoundingClientRect()
    const clip = cs.clipPath !== 'none' || (cs.clip && cs.clip !== 'auto')
    return (r.width <= 1.5 || r.height <= 1.5) && (clip || cs.position === 'absolute')
  }
  return [...document.querySelector(sel).querySelectorAll('*')]
    .filter((e) => {
      const cs = getComputedStyle(e)
      if (!e.textContent?.trim()) return false
      if (!/hidden|clip/.test(cs.overflowY)) return false
      if (visuallyHidden(e)) return false
      return e.scrollHeight > e.clientHeight + 2
    })
    .map((e) => String(e.className || e.tagName).slice(0, 46))
}

/** Only what the override BROKE: present after, absent before. */
const brokeBy = (before, after) => {
  const seen = new Map()
  for (const b of before) seen.set(b, (seen.get(b) ?? 0) + 1)
  return after.filter((a) => {
    const n = seen.get(a) ?? 0
    if (n === 0) return true
    seen.set(a, n - 1)
    return false
  })
}

const browser = await chromium.launch()
const fails = []
const baseline = []

// ── 1.4.12 Text Spacing ────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' })
  await page.waitForSelector('.cockpit-preview', { timeout: 25000 })
  await page.waitForTimeout(1500)

  const control = await page.evaluate(clippingIn, '.cockpit-preview')

  /* Exactly the overrides SC 1.4.12 names. `!important` because the point is a
   * user stylesheet overriding ours — that is the scenario, not a suggestion. */
  await page.addStyleTag({
    content: `.cockpit-preview, .cockpit-preview * {
      line-height: 1.5 !important;
      letter-spacing: 0.12em !important;
      word-spacing: 0.16em !important;
    }
    .cockpit-preview p { margin-block-end: 2em !important; }`,
  })
  await page.waitForTimeout(600)

  const clipped = brokeBy(control, await page.evaluate(clippingIn, '.cockpit-preview'))

  console.log(`1.4.12 Text Spacing   ${clipped.length === 0 ? '✓' : '✗'} ${clipped.length} element(s) clip their text under the user overrides`)
  for (const c of clipped.slice(0, 8)) console.log(`         ${c}`)
  if (clipped.length) fails.push(`1.4.12 (${clipped.length} clipped)`)
  baseline.push(...control)
  await page.close()
}

// ── 1.4.10 Reflow ──────────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 320, height: 900 } })
  await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' })
  await page.waitForSelector('.cockpit-preview', { timeout: 25000 })
  await page.waitForTimeout(1500)
  /* Three corrections, all of which changed the answer.
   *
   * · MEASURED AGAINST ITS OWN CARD, not the preview frame. Against the frame,
   *   every nested child of one wide component counts again — the same defect
   *   read as 254 elements. Against the box the component was actually given, it
   *   is 31 recipes. Attribution, not inflation.
   * · SCROLL-REACHABLE CONTENT IS NOT LOST. 1.4.10 is about the PAGE scrolling in
   *   two directions; a data table inside its own horizontal scroller is both
   *   reachable and the SC's own named exception. Without this the kit's
   *   responsive-table wrapper reads as the failure it exists to prevent.
   * · OVERLAYS ARE NOT IN FLOW. An absolutely-positioned popover hangs outside a
   *   gallery card because the gallery is not where it is anchored; in use it
   *   flips against the viewport. Excluded — and PRINTED, because an exclusion
   *   nobody can see is indistinguishable from a scan that missed something.
   *
   * And no .slice(). The old cap at 6 was not a display limit, it was the count:
   * the calendar filled all six slots, and everything behind it was invisible
   * until the calendar was fixed. */
  const r = await page.evaluate(() => {
    const root = document.querySelector('.cockpit-preview')
    const boxOf = (e) => {
      for (let p = e.parentElement; p && p !== root; p = p.parentElement) {
        if (/\bcard\b/.test(String(p.className))) return p.getBoundingClientRect()
      }
      return root.getBoundingClientRect()
    }
    const reachableByScroll = (e) => {
      for (let p = e.parentElement; p && p !== root.parentElement; p = p.parentElement) {
        const cs = getComputedStyle(p)
        if (/auto|scroll/.test(cs.overflowX) && p.scrollWidth > p.clientWidth + 1) return true
      }
      return false
    }
    /* Both exclusions have to be ANCESTOR-aware, and the first version of each
     * was not — which showed up as the excluded overlay's own children being
     * reported at 162px, and a carousel's slides at 611px. An element inherits
     * its ancestor's frame of reference; the exclusion has to inherit with it. */
    const excludedBy = (e) => {
      for (let p = e; p && p !== root; p = p.parentElement) {
        const pos = getComputedStyle(p).position
        if (pos === 'absolute' || pos === 'fixed') return 'overlay'
        // Paged content: slides are reached with the carousel's own controls,
        // which is the pattern working, not content lost off the side.
        if (/\bcarousel\b/.test(String(p.className))) return 'paged'
      }
      return null
    }
    const groups = new Map()
    const skipped = { overlay: 0, paged: 0 }
    for (const e of root.querySelectorAll('*')) {
      const over = e.getBoundingClientRect().right - boxOf(e).right
      if (over <= 2) continue
      const why = excludedBy(e)
      if (why) { skipped[why]++; continue }
      if (reachableByScroll(e)) continue
      const key = String(e.className || e.tagName).trim().split(/\s+/)[0] || e.tagName
      const g = groups.get(key) || { n: 0, worst: 0 }
      g.n++
      g.worst = Math.max(g.worst, Math.round(over))
      groups.set(key, g)
    }
    return {
      docScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      skipped,
      total: [...groups.values()].reduce((n, g) => n + g.n, 0),
      offenders: [...groups.entries()].sort((a, b) => b[1].worst - a[1].worst)
        .map(([k, g]) => `${String(g.worst).padStart(4)}px over  x${String(g.n).padStart(2)}  ${k}`),
    }
  })
  const ok = !r.docScroll && r.offenders.length === 0
  console.log(`1.4.10 Reflow @320px  ${ok ? '✓' : '✗'} document-scroll=${r.docScroll} · ${r.offenders.length} recipe(s), ${r.total} element(s) wider than their own card`)
  for (const o of r.offenders) console.log(`         ${o}`)
  if (r.skipped.overlay) console.log(`         (excluded: ${r.skipped.overlay} in absolutely-positioned overlays — anchored to the viewport in use, not to a gallery card)`)
  if (r.skipped.paged) console.log(`         (excluded: ${r.skipped.paged} inside a carousel — paged content, reached with the component's own controls)`)
  if (r.docScroll || r.offenders.length) fails.push(`1.4.10 (${r.offenders.length} recipes)`)
  await page.close()
}

// ── 1.4.4 Resize Text ──────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' })
  await page.waitForSelector('.cockpit-preview', { timeout: 25000 })
  await page.waitForTimeout(1500)
  const control = await page.evaluate(clippingIn, '.cockpit-preview')
  // 200% by doubling the root font size — the rem-based equivalent of browser zoom,
  // and the harsher test, since zoom scales the viewport too and this does not.
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' })
  await page.waitForTimeout(700)
  const clipped = brokeBy(control, await page.evaluate(clippingIn, '.cockpit-preview'))
  const docScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)

  console.log(`1.4.4  Resize 200%    ${clipped.length === 0 && !docScroll ? '✓' : '✗'} ${clipped.length} clipped · document-scroll=${docScroll}`)
  for (const c of clipped.slice(0, 8)) console.log(`         ${c}`)
  if (clipped.length || docScroll) fails.push('1.4.4')
  baseline.push(...control)
  await page.close()
}

await browser.close()

/* The control's own findings. Not a 1.4.12 or 1.4.4 failure — these clip with no
 * override applied at all — but a box that hides text is worth a human look, and
 * hiding the list would be the tuning-away this script exists to avoid. */
const seen = [...new Set(baseline)]
if (seen.length) {
  console.log(`\ncontrol — clipping at baseline too, so not caused by either override:`)
  for (const s of seen) console.log(`         ${s}`)
}

console.log(`\n${'═'.repeat(64)}`)
console.log(fails.length ? `${fails.length} criterion/criteria failing: ${fails.join(' · ')}` : 'all three hold')
process.exit(fails.length ? 1 : 0)
