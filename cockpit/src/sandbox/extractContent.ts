/* Sandbox · Slice 3 — the CONTENT extractor (the "that's mine" multiplier).
 *
 * Pure & static: (html/jsx/markup text) → a handful of named strings — app name,
 * nav labels, primary-button label, a page heading. We pour these into the kit
 * board so the specimens read like THEIR app, better designed. This is a SEPARATE,
 * lighter pull than layout reconstruction (dropped): a few strings, not a tree.
 *
 * Honesty: content lives in MARKUP, not CSS. Server-rendered HTML / a pasted
 * snippet / (later) a screenshot+OCR carry it; a pure SPA shell does not. We read
 * what's there and leave the rest to sensible board defaults. NEVER executes input. */

export interface Content {
  /** Brand / product name → wordmark + sidebar title. */
  appName?: string
  /** Nav labels (3–6) → sidebar rows. */
  menu: string[]
  /** Primary call-to-action label → the appbar's filled button. */
  primaryBtn?: string
  /** A page heading (h1) → the appbar title / page lead. */
  heading?: string
}

export interface ContentExtraction {
  content: Content
  /** Which slots were actually read from the input (for the UI + confidence). */
  found: Array<keyof Content>
  notes: string[]
}

/* ── tiny HTML helpers (static, no DOM) ──────────────────────────────────── */
const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
}
function decodeEntities(s: string): string {
  return s.replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m] ?? m)
}
/** Strip tags → collapsed text content of a markup fragment. */
function textOf(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}
/** First capture of a tag's inner text, e.g. firstTag('h1', html). */
function firstTagText(tag: string, html: string): string | undefined {
  const m = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  const t = m ? textOf(m[1]!) : ''
  return t || undefined
}

/* A nav label is short, word-like, not a sentence or a URL. */
function isNavLabel(s: string): boolean {
  if (!s) return false
  if (s.length < 2 || s.length > 22) return false
  if (/[.|/<>{}()@]|https?:|\b(www|©|\d{4})\b/.test(s)) return false
  if (s.split(/\s+/).length > 3) return false
  return /[a-z]/i.test(s)
}

/* Brand-ish: the segment of a <title> most likely to be the product name —
 * titles are usually "Page — Brand" or "Brand · Page". Prefer the shortest
 * single-to-two-word segment (brands are short; page names tend to be longer). */
function brandFromTitle(title: string): string | undefined {
  const parts = title.split(/\s*[|–—·\-:]\s*/).map((p) => p.trim()).filter(Boolean)
  if (!parts.length) return undefined
  if (parts.length === 1) return parts[0]!.length <= 32 ? parts[0] : undefined
  const ranked = [...parts].sort((a, b) => a.length - b.length)
  const pick = ranked.find((p) => p.length >= 2 && p.length <= 24 && p.split(/\s+/).length <= 3)
  return pick ?? parts[parts.length - 1]
}

export function extractContent(markup: string): ContentExtraction {
  const html = markup
  const content: Content = { menu: [] }
  const notes: string[] = []

  /* ---- APP NAME ---------------------------------------------------------- */
  // Priority: og:site_name / application-name meta → <title> brand segment →
  // an explicit brand element → the first <h1>.
  const meta = html.match(/<meta[^>]+(?:property|name)=["'](?:og:site_name|application-name)["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:site_name|application-name)["']/i)
  const titleRaw = firstTagText('title', html)
  const brandEl = html.match(/class=["'][^"']*\b(?:brand|logo|sidenav__name|appbar__title|navbar-brand)\b[^"']*["'][^>]*>([\s\S]*?)</i)
  if (meta) { content.appName = decodeEntities(meta[1]!.trim()); notes.push(`appName: <meta> → "${content.appName}"`) }
  else if (brandEl && textOf(brandEl[1]!)) { content.appName = textOf(brandEl[1]!); notes.push(`appName: brand element → "${content.appName}"`) }
  else if (titleRaw) { const b = brandFromTitle(titleRaw); if (b) { content.appName = b; notes.push(`appName: <title> → "${b}"`) } }

  /* ---- HEADING (h1) ------------------------------------------------------ */
  content.heading = firstTagText('h1', html) ?? firstTagText('h2', html)
  if (content.heading && content.heading.length > 64) content.heading = undefined // a paragraph, not a heading
  if (content.heading) notes.push(`heading: "${content.heading}"`)

  /* ---- MENU (nav labels) ------------------------------------------------- */
  // Prefer an explicit <nav>, then a sidebar <aside>, then <header> as a last
  // resort. Scan only <a>/<li> — a <button> in a header is an ACTION (the CTA,
  // a user menu), not a nav destination, so it must not leak into the menu.
  const navRegion =
    html.match(/<nav\b[\s\S]*?<\/nav>/i)?.[0] ??
    html.match(/<aside\b[\s\S]*?<\/aside>/i)?.[0] ??
    html.match(/<header\b[\s\S]*?<\/header>/i)?.[0] ??
    html
  const labels: string[] = []
  for (const m of navRegion.matchAll(/<(?:a|li)\b[^>]*>([\s\S]*?)<\/(?:a|li)>/gi)) {
    const t = textOf(m[1]!)
    if (isNavLabel(t) && !labels.includes(t)) labels.push(t)
  }
  content.menu = labels.slice(0, 6)
  if (content.menu.length) notes.push(`menu: ${content.menu.length} labels — ${content.menu.join(' · ')}`)

  /* ---- PRIMARY BUTTON ---------------------------------------------------- */
  // A button/link flagged primary/cta, else the first <button> with a verb-y label.
  const cta = html.match(/<(?:button|a)\b[^>]*class=["'][^"']*\b(?:primary|cta|btn-primary|btn--primary)\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:button|a)>/i)
  let btn = cta ? textOf(cta[1]!) : ''
  if (!btn) {
    for (const m of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)) {
      const t = textOf(m[1]!)
      if (t && t.length >= 2 && t.length <= 24 && /[a-z]/i.test(t)) { btn = t; break }
    }
  }
  if (btn) { content.primaryBtn = btn; notes.push(`primaryBtn: "${btn}"`) }

  const found = (['appName', 'heading', 'primaryBtn'] as Array<keyof Content>).filter((k) => content[k])
  if (content.menu.length) found.push('menu')
  return { content, found, notes }
}
