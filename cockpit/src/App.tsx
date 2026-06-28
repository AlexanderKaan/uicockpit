import { useEffect, useState } from 'react'
import { CockpitApp } from './CockpitApp'
import { MarketingPage } from './marketing/MarketingPage'
import { SeoPage } from './marketing/SeoPage'
import { findEntry } from './marketing/seo/seoData'
import './styles/marketing.css'

/**
 * Lightweight pathname-based SPA router — no React Router dependency.
 *   /                    → Marketing landing
 *   /app                 → The configurator (also any /app/* future deep links)
 *   /docs                → Documentation, now rendered INSIDE the app shell
 *                          (CockpitApp route="docs") — public + indexable, but
 *                          no longer a marketing-styled page.
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

  // The configurator owns both /app and /docs (docs renders full-stage inside the
  // app shell). Same component at the tree root → state survives the toggle.
  if (path.startsWith('/app') || path.startsWith('/docs'))
    return (
      <CockpitApp
        onHome={() => navigate('/')}
        route={path.startsWith('/docs') ? 'docs' : 'app'}
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
      onDocs={() => navigate('/docs')}
      navigate={navigate}
    />
  )
}
