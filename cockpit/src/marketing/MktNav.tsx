import { useState, useEffect } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { Wordmark } from '../Wordmark'
import { ping } from '../analytics/beacon'
import { MCP_VERSION } from './versions'

/** The published npm package version (`uicockpit` CLI) — the public number. */
// Derived from cli/package.json at build time (see vite.config.ts) — auto-syncs
// with every deploy after a `npm version` bump, so it can never drift again.
export const UICOCKPIT_VERSION = __UICOCKPIT_VERSION__
export const REPO_URL = 'https://github.com/AlexanderKaan/uicockpit'

/** GitHub brand mark (lucide dropped brand icons — inline the official glyph). */
function GithubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  )
}

interface MktNavProps {
  /** Client-side navigate (App's pushState router). */
  navigate: (to: string) => void
  /** Which page we're on — drives aria-current on the matching destination. */
  current?: 'manifesto' | 'docs' | 'audit' | 'components' | 'changelog'
}

/**
 * Shared marketing top-nav — the "part of your dev stack" bar. One source for the
 * landing, manifesto and SEO pages so the brand, the version dropdown and the
 * GitHub link never drift between them.
 *
 * IA rule: the global nav holds DESTINATIONS ONLY (routes), identical on every
 * page — never a page's in-page scroll anchors. The landing's own sections are
 * found by scrolling (the hero's "See how it works" covers the jump), so they
 * live nowhere in this row. The brand mark is the "home" affordance.
 *
 * The version dropdown is a zero-JS native `<details>` (robust, closes on blur);
 * its items point at the real repo (release/repo meta only).
 */
export function MktNav({ navigate, current }: MktNavProps) {
  /* The sheet is React state rather than a native <details> like the version
   * menu, for one reason: navigation here is client-side, so a <details> would
   * stay open behind the page it just moved you to. */
  const [menu, setMenu] = useState(false)
  useEffect(() => {
    if (!menu) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [menu])

  const go = (e: React.MouseEvent, to: string) => {
    e.preventDefault()
    setMenu(false)
    navigate(to)
  }
  const door = (to: string, kind: 'audit' | 'configure') => () => {
    setMenu(false)
    // From inside the audit, "Build my UI kit" IS the bridge, not a door —
    // counting it as a door would undercount the crossing we want to measure.
    if (kind === 'configure' && current === 'audit') ping('audit', 'bridge')
    else ping('door', kind)
    navigate(to)
  }
  const ariaCurrent = (page: MktNavProps['current']) =>
    current === page ? ({ 'aria-current': 'page' as const }) : {}

  return (
    <header className="mkt__nav">
      <div className="mkt__container mkt__nav-inner">
        <a href="/" className="mkt__brand" onClick={(e) => go(e, '/')} aria-label="UIcockpit home">
          <Wordmark height={24} className="mkt__brand-mark" />
        </a>

        <nav className="mkt__nav-links">
          <a href="/components" className="mkt__nav-link" {...ariaCurrent('components')} onClick={(e) => go(e, '/components')}>Components</a>
          <a href="/docs" className="mkt__nav-link" {...ariaCurrent('docs')} onClick={(e) => go(e, '/docs')}>Docs</a>
        </nav>

        <div className="mkt__nav-tools">
          {/* Version + resources — the dev-tool signature. Native <details>. */}
          <details className="mkt__ver">
            <summary className="mkt__ver-trigger" aria-label={`Version ${UICOCKPIT_VERSION} and resources`}>
              <span className="mkt__ver-num">{UICOCKPIT_VERSION}</span>
              <ChevronDown size={13} strokeWidth={2.5} className="mkt__ver-caret" aria-hidden="true" />
            </summary>
            <div className="mkt__ver-menu" role="menu">
              {/* Names the ARTIFACT. It used to read "UIcockpit {version}",
                  which claimed a product version that does not exist — and did
                  it with the CLI's number, which lacked the feature the site
                  led with. */}
              <div className="mkt__ver-head">CLI {UICOCKPIT_VERSION} · MCP {MCP_VERSION}</div>
              <a href="/changelog" className="mkt__ver-item" onClick={(e) => go(e, '/changelog')} role="menuitem">What&rsquo;s new</a>
              <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`} className="mkt__ver-item" target="_blank" rel="noopener noreferrer" role="menuitem">Contributing</a>
              <a href={`${REPO_URL}/blob/main/LICENSE`} className="mkt__ver-item" target="_blank" rel="noopener noreferrer" role="menuitem">License · MIT</a>
            </div>
          </details>

          {/* GitHub */}
          <a
            href={REPO_URL}
            className="mkt__gh"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="UIcockpit on GitHub"
            title="GitHub"
          >
            <GithubMark />
          </a>

          {/* Both entrances, on every page — the nav is where someone who
              arrived on the wrong side of the fork changes their mind. */}
          <button className="mkt-btn mkt-btn--ghost mkt-btn--lg mkt__nav-door" onClick={door('/audit', 'audit')}>
            Audit my UI
          </button>
          <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={door('/app', 'configure')}>
            Build my UI kit
          </button>

          {/* Below 700px the row cannot hold two equal doors plus the links, and
              the old answer was to hide whichever fitted worst — which happened
              to be Audit. The audit door was then reachable on a phone only by
              typing the URL, right after two sprints spent making it work there. */}
          <button
            className="mkt__burger"
            aria-label={menu ? 'Close menu' : 'Menu'}
            aria-expanded={menu}
            aria-controls="mkt-menu"
            onClick={() => setMenu((v) => !v)}
          >
            {menu ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {menu && (
        <div className="mkt__sheet" id="mkt-menu">
          <div className="mkt__container mkt__sheet-inner">
            {/* The two doors first and EQUAL — the whole proposition is that
                there are two ways in, and a menu that leads with one of them
                is the one-door product wearing a hamburger. */}
            <button className="mkt-btn mkt-btn--ghost mkt-btn--lg mkt__sheet-door" onClick={door('/audit', 'audit')}>
              Audit my UI
            </button>
            <button className="mkt-btn mkt-btn--primary mkt-btn--lg mkt__sheet-door" onClick={door('/app', 'configure')}>
              Build my UI kit
            </button>

            <nav className="mkt__sheet-links">
              <a href="/components" {...ariaCurrent('components')} onClick={(e) => go(e, '/components')}>Components</a>
              <a href="/docs" {...ariaCurrent('docs')} onClick={(e) => go(e, '/docs')}>Docs</a>
              <a href="/manifesto" {...ariaCurrent('manifesto')} onClick={(e) => go(e, '/manifesto')}>Manifesto</a>
              <a href="/changelog" {...ariaCurrent('changelog')} onClick={(e) => go(e, '/changelog')}>What&rsquo;s new</a>
            </nav>

            <div className="mkt__sheet-meta">
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                <GithubMark /> GitHub
              </a>
              <span className="mkt__sheet-ver">{UICOCKPIT_VERSION}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
