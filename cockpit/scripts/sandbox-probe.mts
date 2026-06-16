/* Sandbox probe — run the REAL extractors against REAL SaaS pages.
 *
 * The browser can't fetch third-party sites (CORS), so this stands in for the
 * server-side "paste a URL" path: fetch the page HTML + its linked stylesheets,
 * then run extractFoundation (on the CSS) and extractContent (on the HTML) — the
 * exact functions the app uses. Validates whether our system reads real apps.
 *
 *   npx tsx scripts/sandbox-probe.mts [url ...]
 *
 * Treats all fetched content as DATA (static regex scan) — never executes it. */

import { extractFoundation } from '../src/sandbox/extractFoundation'
import { extractContent } from '../src/sandbox/extractContent'

const DEFAULT_URLS = [
  'https://linear.app',
  'https://stripe.com',
  'https://vercel.com',
  'https://www.notion.com',
  'https://supabase.com',
  'https://tailwindcss.com',
]

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'

async function get(url: string, signalMs = 15000): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), signalMs)
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, signal: ctrl.signal })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.text()
  } finally { clearTimeout(t) }
}

/** Collect inline <style> + the first N linked stylesheets, concatenated. */
async function gatherCss(html: string, base: string, max = 6, cap = 4_000_000): Promise<string> {
  const parts: string[] = []
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) parts.push(m[1]!)
  const hrefs: string[] = []
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0]
    if (!/rel=["']?stylesheet/i.test(tag)) continue
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
    if (href) hrefs.push(href)
  }
  for (const href of hrefs.slice(0, max)) {
    try {
      const abs = new URL(href, base).href
      const css = await get(abs, 12000)
      parts.push(css)
      if (parts.join('').length > cap) break
    } catch { /* skip a stylesheet that won't load */ }
  }
  return parts.join('\n').slice(0, cap)
}

function fmtFoundation(url: string, css: string) {
  const { config, confidence } = extractFoundation(css)
  const c = config
  const dot = (k: keyof typeof confidence) => ({ high: '🟢', low: '🟡', none: '⚪' }[confidence[k]])
  return [
    `  foundation (${(css.length / 1000).toFixed(0)}kB css):`,
    `    brand    ${dot('brand')} ${c.color === 'mono' ? 'mono' : `${c.colorTheme} ${c.cPrimary ?? ''}`}`,
    `    neutrals ${dot('neutral')} ${c.neutral ?? '—'}`,
    `    corners  ${dot('radius')} ${c.radius ?? '—'}`,
    `    type     ${dot('font')} ${c.fontDisplay ?? '—'}${c.fontBody && c.fontBody !== c.fontDisplay ? ` / ${c.fontBody}` : ''}  ·  size ${dot('typeSize')} ${c.typeScale ?? '—'}`,
    `    density  ${dot('density')} ${c.scale ?? '—'}  ·  elevation ${dot('elevation')} ${c.surfaceDepth ?? '—'}`,
  ].join('\n')
}

function fmtContent(html: string) {
  const { content, found } = extractContent(html)
  return [
    `  content (${found.length} slots):`,
    `    app      ${content.appName ?? '—'}`,
    `    heading  ${content.heading ?? '—'}`,
    `    button   ${content.primaryBtn ?? '—'}`,
    `    nav      ${content.menu.length ? content.menu.join(' · ') : '—'}`,
  ].join('\n')
}

const urls = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_URLS

for (const url of urls) {
  process.stdout.write(`\n=== ${url} ===\n`)
  try {
    const html = await get(url)
    const css = await gatherCss(html, url)
    process.stdout.write(fmtFoundation(url, css) + '\n')
    process.stdout.write(fmtContent(html) + '\n')
  } catch (e) {
    process.stdout.write(`  ✗ ${String((e as Error).message || e)}\n`)
  }
}
