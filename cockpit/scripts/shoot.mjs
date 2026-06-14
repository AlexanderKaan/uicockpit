// Internal dev screenshot helper (not part of the build/export).
// Usage: node scripts/shoot.mjs <view> <theme> <out.png> [collapse]
//   view:   foundations | atoms | components | pages
//   theme:  mono | cobalt | rose | jade | ...   (clicks the Brand flyout)
//   out:    output PNG path
//   collapse: "collapse" to hide the panel for clean full-stage shots
import { chromium } from '@playwright/test'

const [, , view = 'components', theme = 'cobalt', out = '/tmp/shot.png', collapse = ''] = process.argv

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' })
await page.waitForTimeout(400)

// Pick the brand theme (skip for mono — it's the default).
if (theme && theme !== 'mono') {
  try {
    // open the Brand control flyout, then click the theme by name
    const brandRow = page.locator('button', { hasText: /^Brand/ }).first()
    await brandRow.click()
    await page.waitForTimeout(250)
    const cap = theme.charAt(0).toUpperCase() + theme.slice(1)
    await page.getByRole('button', { name: new RegExp(`^${cap}$`, 'i') }).first().click()
    await page.waitForTimeout(250)
    // close the flyout
    await page.keyboard.press('Escape')
  } catch (e) {
    console.error('theme pick failed:', e.message)
  }
}

// Switch the stage view via the topbar segmented tabs.
try {
  const cap = view.charAt(0).toUpperCase() + view.slice(1)
  await page.getByRole('tab', { name: new RegExp(cap, 'i') }).first().click()
  await page.waitForTimeout(500)
} catch (e) {
  // fallback to a plain button match
  try { await page.locator('button', { hasText: new RegExp(view, 'i') }).first().click(); await page.waitForTimeout(500) } catch {}
}

// Optional 6th positional arg (after view, theme, out, collapse): screenshot just
// the .card whose title matches this text (element.screenshot auto-scrolls to it).
const scrollText = process.argv[6]
if (scrollText) {
  try {
    const handle = await page.evaluateHandle((t) => {
      const cards = [...document.querySelectorAll('.card')]
      return cards.find((c) => {
        const title = c.querySelector('.card__title')
        return title && new RegExp(t, 'i').test(title.textContent || '')
      }) || null
    }, scrollText)
    const el = handle.asElement()
    if (el) {
      // Center the card in its scroll container, then a normal viewport shot.
      await el.evaluate((node) => {
        const sc = node.closest('.stage__body') || document.scrollingElement
        const cr = node.getBoundingClientRect(), sr = sc.getBoundingClientRect()
        sc.scrollTop += cr.top - sr.top - sc.clientHeight / 2 + cr.height / 2
      })
      await page.waitForTimeout(500)
      await page.screenshot({ path: out })
      await browser.close()
      console.log('shot (centered) →', out)
      process.exit(0)
    }
    console.error('card not found for', scrollText)
  } catch (e) { console.error('scroll failed:', e.message) }
}

// Optional 7th arg: click a SupaDash sidebar nav item by text (Pages view).
const appNav = process.argv[8]
if (appNav) {
  try {
    await page.locator('.dash__nav, .sidenav, nav').getByText(new RegExp(`^${appNav}$`, 'i')).first().click()
    await page.waitForTimeout(600)
  } catch (e) { console.error('appNav failed:', e.message) }
}

if (collapse === 'collapse') {
  try {
    // the panel collapse target is the logo / chevron at the panel top
    await page.locator('.fm__collapse, [aria-label*="collapse" i], [aria-label*="menu" i]').first().click()
    await page.waitForTimeout(300)
  } catch {}
}

await page.waitForTimeout(300)
await page.screenshot({ path: out, fullPage: false })
await browser.close()
console.log('shot →', out)
