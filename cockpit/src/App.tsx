import { useEffect, useState } from 'react'
import { CockpitApp } from './CockpitApp'
import { MarketingPage } from './marketing/MarketingPage'
import { MarketingManifesto } from './marketing/MarketingManifesto'
import { OgCard } from './marketing/OgCard'
import { SeoPage } from './marketing/SeoPage'
import { DocsPage } from './marketing/DocsPage'
import { ShowcasesPage } from './marketing/ShowcasesPage'
import { ComponentsPage } from './marketing/ComponentsPage'
import { findEntry } from './marketing/seo/seoData'
import './styles/marketing.css'

/**
 * Lightweight pathname-based SPA router — no React Router dependency.
 * IA-1 "hub + tool": ONE site shell (MktNav) over every content destination;
 * /app stays the fullscreen instrument.
 *   /                    → Marketing landing
 *   /app                 → The configurator (also any /app/* future deep links)
 *   /docs                → The guide, in the SITE shell (was: inside the app shell)
 *   /showcases           → The Ledger showcase wall as a public destination
 *   /compare/<slug>      → SEO comparison page  ("UIcockpit vs X")
 *   /alternatives/<slug> → SEO alternative page ("X alternative")
 *   /uses/<slug>         → SEO use-case / keyword landing
 * (the SEO routes are data-driven — see marketing/seo/seoData.ts.)
 *
 * Navigation is client-side via history.pushState (instant, no reload)
 * and listens for popstate so the back button works.
 */
function useRoute() {
  const [path, setPath] = useState(() =>
    typeof window === 'undefined' ? '/' : window.location.pathname,
  )
  useEffect(() => {
    const handler = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])
  const navigate = (to: string) => {
    if (window.location.pathname === to) return
    history.pushState({}, '', to + window.location.hash)
    setPath(to)
  }
  return { path, navigate }
}

export function App() {
  const { path, navigate } = useRoute()

  // The configurator — the fullscreen instrument layer.
  if (path.startsWith('/app'))
    return <CockpitApp onHome={() => navigate('/')} navigate={navigate} />

  // The guide + the catalog + the showcase wall — content destinations in the
  // site shell (IA-1/IA-2).
  if (path.startsWith('/docs')) return <DocsPage navigate={navigate} />
  if (path.startsWith('/components')) return <ComponentsPage navigate={navigate} />
  if (path.startsWith('/showcases')) return <ShowcasesPage navigate={navigate} />

  // The social-preview / OG card (1280×640) — not linked; screenshotted to a PNG.
  if (path === '/og') return <OgCard />

  // The manifesto — human, first-person "why" page (marketing-voice, .mkt chrome).
  if (path === '/manifesto')
    return (
      <MarketingManifesto
        onLaunch={() => navigate('/app')}
        onDocs={() => navigate('/docs')}
        navigate={navigate}
      />
    )

  // Data-driven SEO routes (comparison / alternative / use-case).
  if (
    path.startsWith('/compare/') ||
    path.startsWith('/alternatives/') ||
    path.startsWith('/uses/')
  ) {
    const entry = findEntry(path)
    if (entry) return <SeoPage entry={entry} navigate={navigate} />
    // Unknown slug → fall through to the landing page.
  }

  return (
    <MarketingPage
      onLaunch={() => navigate('/app')}
      navigate={navigate}
    />
  )
}
