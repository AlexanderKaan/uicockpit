import { ChevronDown } from 'lucide-react'

/** The published npm package version (`uicockpit` CLI) — the public number. */
export const UICOCKPIT_VERSION = 'v0.3.0'
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
  current?: 'manifesto' | 'docs'
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
  const go = (e: React.MouseEvent, to: string) => {
    e.preventDefault()
    navigate(to)
  }
  const ariaCurrent = (page: MktNavProps['current']) =>
    current === page ? ({ 'aria-current': 'page' as const }) : {}

  return (
    <header className="mkt__nav">
      <div className="mkt__container mkt__nav-inner">
        <a href="/" className="mkt__brand" onClick={(e) => go(e, '/')}>
          <img src="/logo.svg" alt="" width={28} height={28} className="mkt__brand-logo" />
          UIcockpit
        </a>

        <nav className="mkt__nav-links">
          <a href="/manifesto" className="mkt__nav-link" {...ariaCurrent('manifesto')} onClick={(e) => go(e, '/manifesto')}>Manifesto</a>
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
              <div className="mkt__ver-head">UIcockpit {UICOCKPIT_VERSION}</div>
              <a href={`${REPO_URL}/releases`} className="mkt__ver-item" target="_blank" rel="noopener noreferrer" role="menuitem">Release notes</a>
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

          <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={() => navigate('/app')}>
            Build my UI kit
          </button>
        </div>
      </div>
    </header>
  )
}
