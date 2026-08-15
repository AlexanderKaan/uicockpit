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


/* Elements that are SUPPOSED to clip.
 *
 * The first run reported .sr-only and .skiplink as text-spacing failures, which
 * is the visually-hidden mechanism working exactly as designed — a 1px box with
 * overflow:hidden is the whole trick. Reporting the solution as the bug is the
 * same shape of instrument error this project keeps producing, so the exclusion
 * is named rather than tuned away. */
const BY_DESIGN = (cls) => /\b(sr-only|visually-hidden|skiplink)\b/.test(cls)

const browser = await chromium.launch()
const fails = []

// ── 1.4.12 Text Spacing ────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' })
  await page.waitForSelector('.cockpit-preview', { timeout: 25000 })
  await page.waitForTimeout(1500)

  const before = await page.$$eval('.cockpit-preview .card', (els) => els.map((e) => e.scrollHeight))

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

  const clipped = await page.$$eval('.cockpit-preview *', (els) =>
    els
      .filter((e) => {
        const cs = getComputedStyle(e)
        if (cs.overflow === 'visible' || !e.textContent?.trim()) return false
        // Content taller than its box, in a box that hides the overflow: text lost.
        if (/\b(sr-only|visually-hidden|skiplink)\b/.test(String(e.className))) return false
        return e.scrollHeight > e.clientHeight + 2 && /hidden|clip/.test(cs.overflowY)
      })
      .slice(0, 8)
      .map((e) => `${e.className || e.tagName}`.slice(0, 46)),
  )
  console.log(`1.4.12 Text Spacing   ${clipped.length === 0 ? '✓' : '✗'} ${clipped.length} element(s) clip their text under the user overrides`)
  for (const c of clipped) console.log(`         ${c}`)
  if (clipped.length) fails.push(`1.4.12 (${clipped.length} clipped)`)
  await page.close()
}

// ── 1.4.10 Reflow ──────────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 320, height: 900 } })
  await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' })
  await page.waitForSelector('.cockpit-preview', { timeout: 25000 })
  await page.waitForTimeout(1500)
  const r = await page.evaluate(() => {
    const el = document.querySelector('.cockpit-preview')
    // Its own horizontal scroll, and anything inside that pushes wider than it.
    const overflowing = [...el.querySelectorAll('*')]
      .filter((e) => e.getBoundingClientRect().right > el.getBoundingClientRect().right + 2)
      .slice(0, 6)
      .map((e) => `${e.className || e.tagName}`.slice(0, 46))
    return { docScroll: document.documentElement.scrollWidth > window.innerWidth + 1, overflowing }
  })
  console.log(`1.4.10 Reflow @320px  ${!r.docScroll && r.overflowing.length === 0 ? '✓' : '✗'} document-scroll=${r.docScroll} · ${r.overflowing.length} element(s) wider than the frame`)
  for (const o of r.overflowing) console.log(`         ${o}`)
  if (r.docScroll || r.overflowing.length) fails.push('1.4.10')
  await page.close()
}

// ── 1.4.4 Resize Text ──────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' })
  await page.waitForSelector('.cockpit-preview', { timeout: 25000 })
  await page.waitForTimeout(1500)
  // 200% by doubling the root font size — the rem-based equivalent of browser zoom,
  // and the harsher test, since zoom scales the viewport too and this does not.
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' })
  await page.waitForTimeout(700)
  const r = await page.evaluate(() => {
    const el = document.querySelector('.cockpit-preview')
    const clipped = [...el.querySelectorAll('*')]
      .filter((e) => {
        const cs = getComputedStyle(e)
        if (/\b(sr-only|visually-hidden|skiplink)\b/.test(String(e.className))) return false
        return e.textContent?.trim() && e.scrollHeight > e.clientHeight + 2 && /hidden|clip/.test(cs.overflowY)
      })
      .slice(0, 8)
      .map((e) => `${e.className || e.tagName}`.slice(0, 46))
    return { clipped, docScroll: document.documentElement.scrollWidth > window.innerWidth + 1 }
  })
  console.log(`1.4.4  Resize 200%    ${r.clipped.length === 0 && !r.docScroll ? '✓' : '✗'} ${r.clipped.length} clipped · document-scroll=${r.docScroll}`)
  for (const c of r.clipped) console.log(`         ${c}`)
  if (r.clipped.length || r.docScroll) fails.push('1.4.4')
  await page.close()
}

await browser.close()
console.log(`\n${'═'.repeat(64)}`)
console.log(fails.length ? `${fails.length} criterion/criteria failing: ${fails.join(' · ')}` : 'all three hold')
process.exit(fails.length ? 1 : 0)
