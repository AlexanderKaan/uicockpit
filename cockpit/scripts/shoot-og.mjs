/**
 * Regenerate `public/og-image.png` from the `/og` route.
 *
 *   npm run dev            # in one terminal
 *   npm run shoot:og
 *
 * The card component is the source and the PNG is the artifact, so editing
 * OgCard.tsx alone changes nothing anyone sees: the committed PNG is what every
 * unfurl actually shows. Until now there was no way to regenerate it, which is
 * how the social card kept promising a product with one door.
 *
 * 1280x640 at 2x, matching the og:image:width/height declared in index.html.
 */
import { chromium } from '@playwright/test'
import { BASE } from './lib/base.mjs'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 2 })
await page.goto(`${BASE}/og`, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
const card = page.locator('.og-card').first()
await (await card.count() ? card : page.locator('body')).screenshot({ path: process.argv[2] })
await browser.close()
console.log('og →', process.argv[2])
