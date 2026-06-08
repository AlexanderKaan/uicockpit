import { SEO_ENTRIES, footerGroups, pathFor } from './seo/seoData'

interface MktFooterProps {
  /** Client-side navigate (App's pushState router). */
  navigate: (to: string) => void
}

/**
 * Shared mega-footer — the SEO hub. Reused across the landing, docs and every
 * SEO landing page so the comparison / alternative / use-case pages are linked
 * from one crawlable place (and cross-linked to each other). Link lists are
 * derived from `seoData`, so adding a target page adds a footer link for free.
 */
export function MktFooter({ navigate }: MktFooterProps) {
  const go = (e: React.MouseEvent, to: string) => {
    e.preventDefault()
    navigate(to)
  }

  return (
    <footer className="mkt__footer mkt__footer--mega">
      <div className="mkt__container">
        <div className="mkt__footcols">
          {/* Product column */}
          <nav className="mkt__footcol" aria-label="Product">
            <div className="mkt__footcol-head">Product</div>
            <a href="/" className="mkt__footlink" onClick={(e) => go(e, '/')}>Home</a>
            <a href="/app" className="mkt__footlink" onClick={(e) => go(e, '/app')}>Configurator</a>
            <a href="/docs" className="mkt__footlink" onClick={(e) => go(e, '/docs')}>Docs</a>
            <a href="/#livekit" className="mkt__footlink" onClick={(e) => go(e, '/#livekit')}>Live kit</a>
          </nav>

          {/* SEO hub columns — derived from seoData */}
          {footerGroups().map((g) => (
            <nav className="mkt__footcol" aria-label={g.heading} key={g.kind}>
              <div className="mkt__footcol-head">{g.heading}</div>
              {SEO_ENTRIES.filter((e) => e.kind === g.kind).map((e) => {
                const to = pathFor(e)
                return (
                  <a key={to} href={to} className="mkt__footlink" onClick={(ev) => go(ev, to)}>
                    {e.navLabel}
                  </a>
                )
              })}
            </nav>
          ))}
        </div>

        <div className="mkt__footer-inner mkt__footer-bottom">
          <div>© {new Date().getFullYear()} UIcockpit · Made for vibe-coders</div>
          <div className="mkt__footer-credit">
            Made with care by{' '}
            <a href="https://github.com/AlexanderKaan" target="_blank" rel="noopener noreferrer">Alexander Kaan</a>{' '}
            at{' '}
            <a href="https://pageminds.com" target="_blank" rel="noopener noreferrer">Pageminds</a>
            {' · '}
            <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">MIT</a>, free forever
          </div>
        </div>
      </div>
    </footer>
  )
}
