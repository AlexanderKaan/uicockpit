import { useEffect, useMemo, type CSSProperties } from 'react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'
import { PagesView } from '../stage/views/PagesView'
import { IconProvider } from '../icons/Icon'
import { buildTokens } from '../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../tokens/defaults'

/**
 * /showcases — the Ledger showcase wall as a PUBLIC destination (IA-1). The wall
 * always existed inside the app (Showcases tab); this gives it a linkable,
 * indexable URL under the site nav. It renders the REAL PagesView — the same
 * interactive app (enter a screen, drive the sidebar, drag the width) — inside
 * a `.cockpit-preview` token scope on the DEFAULT kit. (IA-3 later swaps this
 * for the visitor's own kit — "reference pages, themed by your kit".)
 */
export function ShowcasesPage({ navigate }: { navigate: (to: string) => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = 'Showcases — real screens on one generated design system — UIcockpit'
    return () => { document.title = prev }
  }, [])
  const tokens = useMemo(() => buildTokens(DEFAULT_CONFIG).vars as CSSProperties, [])
  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="showcases" />
      <section className="mkt__section mkt__section--showcases">
        <div className="mkt__container">
          <div className="mkt__section-head">
            <div className="mkt__eyebrow">
              <span className="mkt__eyebrow-dot" />
              Showcases
            </div>
            <h1>One kit. Real screens.</h1>
            <p className="mkt__section-sub">
              Ledger — a complete billing product built purely from the kit&apos;s components:
              every screen below is live, navigable and wearing the default kit. Open the
              configurator and the same screens re-render in <em>yours</em>.
            </p>
          </div>
        </div>
        <div className="mkt__showcase-stage">
          <div className="cockpit-preview" style={tokens}>
            <IconProvider set={DEFAULT_CONFIG.iconSet}>
              <PagesView />
            </IconProvider>
          </div>
        </div>
        <div className="mkt__container mkt__showcase-cta">
          <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={() => navigate('/app')}>
            Re-theme these screens — build my kit →
          </button>
        </div>
      </section>
      <MktFooter navigate={navigate} />
    </div>
  )
}
