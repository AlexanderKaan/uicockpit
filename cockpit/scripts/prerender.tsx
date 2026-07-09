/**
 * prerender (IA-4) — bake the pure-content routes into static HTML snapshots so
 * bots and link-preview crawlers (which don't run JS) see the real content, not
 * just the SPA shell's default meta. Each page is rendered to static markup with
 * react-dom/server — no headless browser.
 *
 * We prerender the CONTENT routes only (landing · manifesto · the data-driven
 * SEO pages). The tool (/app) and the app-like reference surfaces (/components,
 * /showcases) stay client-rendered — Googlebot renders JS, and their value is
 * interaction, not indexable prose.
 *
 * On the client, main.tsx's createRoot renders fresh over the snapshot (not
 * hydrate), so the static HTML is a bot-and-first-paint layer; users get the
 * live SPA a tick later. Also regenerates sitemap.xml from seoData (one source).
 *
 * Runs after `vite build` (needs dist/index.html + the hashed asset links):
 *   npx vite-node scripts/prerender.tsx
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarketingPage } from '../src/marketing/MarketingPage'
import { MarketingManifesto } from '../src/marketing/MarketingManifesto'
import { SeoPage } from '../src/marketing/SeoPage'
import { StylesPage } from '../src/marketing/StylesPage'
import { ComponentsIndexPage, ComponentDetailPage } from '../src/marketing/ComponentDocs'
import { COMPONENT_PAGES } from '../src/stage/views/ComponentGallery'
import { SEO_ENTRIES, pathFor, type SeoEntry } from '../src/marketing/seo/seoData'

const SITE = 'https://uicockpit.com'
const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const noop = () => {}

const template = readFileSync(`${DIST}index.html`, 'utf8')

/** Escape for an HTML attribute value. */
const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

interface Route {
  path: string
  markup: string
  title: string
  description: string
  faq?: Array<{ q: string; a: string }>
}

/** Apply per-route head overrides + inject the body into the shared template. */
function renderPage(r: Route): string {
  let html = template
  const url = `${SITE}${r.path}`
  // Title (twice — <title> + og/twitter share the same base string family).
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${attr(r.title)}</title>`)
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${attr(r.title)}$2`)
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${attr(r.title)}$2`)
  // Description (name=description is multi-line content=…; og/twitter single-line).
  html = html.replace(/(name="description"\s*\n\s*content=")[^"]*(")/, `$1${attr(r.description)}$2`)
  html = html.replace(/(<meta property="og:description"\s*\n?\s*content=")[^"]*(")/, `$1${attr(r.description)}$2`)
  html = html.replace(/(name="twitter:description"\s*\n\s*content=")[^"]*(")/, `$1${attr(r.description)}$2`)
  // Canonical + og:url → the route.
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${attr(url)}$2`)
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${attr(url)}$2`)
  // FAQ structured data (rich-result eligible) for the SEO pages.
  if (r.faq?.length) {
    const faqLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: r.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    })
    html = html.replace('</head>', `    <script type="application/ld+json" data-seo="faq">${faqLd}</script>\n  </head>`)
  }
  // The body.
  html = html.replace('<div id="root"></div>', `<div id="root">${r.markup}</div>`)
  return html
}

/* Write FLAT .html files (dist/manifesto.html, dist/uses/x.html), not the
 * directory form (dist/manifesto/index.html). CF Pages' default html_handling
 * serves `/foo.html` at the clean URL `/foo` with NO redirect and NO trailing
 * slash — so the served URL matches our canonical exactly. The directory form
 * instead 308-redirects `/foo` → `/foo/`, splitting the URL from the canonical. */
function write(path: string, html: string): void {
  if (path === '/') { writeFileSync(`${DIST}index.html`, html); console.log('  ✓ prerendered /'); return }
  const rel = path.replace(/^\//, '')
  const slash = rel.lastIndexOf('/')
  if (slash !== -1) mkdirSync(`${DIST}${rel.slice(0, slash)}`, { recursive: true })
  writeFileSync(`${DIST}${rel}.html`, html)
  console.log(`  ✓ prerendered ${path}  →  ${rel}.html`)
}

// ── The content routes ──────────────────────────────────────────────────────
write('/', renderPage({
  path: '/',
  markup: renderToStaticMarkup(<MarketingPage onLaunch={noop} navigate={noop} />),
  title: 'UIcockpit — The design system generator for AI-built apps',
  description: 'Generate a design system — tokens + components — export it to Tailwind v4, shadcn/ui or any framework, and keep it consistent when AI builds. Free & open source.',
}))

write('/manifesto', renderPage({
  path: '/manifesto',
  markup: renderToStaticMarkup(<MarketingManifesto onLaunch={noop} onDocs={noop} navigate={noop} />),
  title: 'Manifesto — why UIcockpit, the design system generator — UIcockpit',
  description: "Why I'm building UIcockpit: a design system generator that makes taste decisions once and keeps AI-built UI coherent — a grammar plus a guarantee, built in the open.",
}))

// The component reference: the index + a detail page per slug (IA-2b).
write('/components', renderPage({
  path: '/components',
  markup: renderToStaticMarkup(<ComponentsIndexPage navigate={noop} />),
  title: 'Components — 60+ accessible components, themed by your kit — UIcockpit',
  description: 'Browse 60+ accessible, framework-neutral components — buttons, tables, dialogs, charts, an AI chat. Each with its markup, recipe CSS and best-practice rules, wearing your kit.',
}))
for (const c of COMPONENT_PAGES) {
  write(`/components/${c.slug}`, renderPage({
    path: `/components/${c.slug}`,
    markup: renderToStaticMarkup(<ComponentDetailPage slug={c.slug} navigate={noop} />),
    title: `${c.name} — a themeable ${c.name} component — UIcockpit`,
    description: c.blurb,
  }))
}

write('/styles', renderPage({
  path: '/styles',
  markup: renderToStaticMarkup(<StylesPage navigate={noop} />),
  title: 'Styles — named starting points you tune into your own — UIcockpit',
  description: 'Seven named style kits — Linear-crisp, Vercel-mono, Stripe-refined and more. Each opens the configurator as a starting point you tune, not a fixed theme you settle for.',
}))

const entries: SeoEntry[] = SEO_ENTRIES
for (const entry of entries) {
  write(pathFor(entry), renderPage({
    path: pathFor(entry),
    markup: renderToStaticMarkup(<SeoPage entry={entry} navigate={noop} />),
    title: entry.title,
    description: entry.metaDescription,
    faq: entry.faq,
  }))
}

// ── sitemap.xml, generated from the same source (no drift) ───────────────────
const staticRoutes: Array<{ loc: string; freq: string; pri: string }> = [
  { loc: '/', freq: 'weekly', pri: '1.0' },
  { loc: '/components', freq: 'weekly', pri: '0.9' },
  { loc: '/styles', freq: 'monthly', pri: '0.8' },
  { loc: '/showcases', freq: 'monthly', pri: '0.8' },
  { loc: '/docs', freq: 'monthly', pri: '0.8' },
  { loc: '/manifesto', freq: 'monthly', pri: '0.6' },
]
const seoRoutes = entries.map((e) => ({ loc: pathFor(e), freq: 'monthly', pri: e.kind === 'use' ? '0.7' : '0.6' }))
const componentRoutes = COMPONENT_PAGES.map((c) => ({ loc: `/components/${c.slug}`, freq: 'monthly', pri: '0.7' }))
const urls = [...staticRoutes, ...componentRoutes, ...seoRoutes]
  .map(({ loc, freq, pri }) => `  <url><loc>${SITE}${loc}</loc><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`)
  .join('\n')
writeFileSync(`${DIST}sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
console.log(`  ✓ sitemap.xml (${urls.split('\n').length} urls, from seoData)`)
