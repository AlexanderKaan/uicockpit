import { useEffect } from 'react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'
import { KitToggle } from './KitToggle'
import { ComponentsView } from '../stage/views/ComponentsView'
import { IconProvider } from '../icons/Icon'
import { useVisitorKit } from '../state/useVisitorKit'

/**
 * /components — the component catalog as a PUBLIC destination (IA-2). Renders the
 * REAL, audited gallery (the exact ComponentsView the configurator uses — one
 * source, no drift), including the LP1 Do/Don't best-practice disclosures on the
 * flagship cards. Wrapped in a `.cockpit-preview` token scope so the kit styles
 * apply; the scope carries the DEFAULT kit or, via IA-3, the visitor's own.
 */
export function ComponentsPage({ navigate }: { navigate: (to: string) => void }) {
  const { tokens, iconSet, hasKit, showKit, setShowKit } = useVisitorKit()
  useEffect(() => {
    const prev = document.title
    document.title = 'Components — 100+ accessible components, themed by your kit — UIcockpit'
    return () => { document.title = prev }
  }, [])
  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="components" />
      <section className="mkt__section mkt__section--catalog">
        <div className="mkt__container">
          <div className="mkt__section-head">
            <div className="mkt__eyebrow">
              <span className="mkt__eyebrow-dot" />
              Components
            </div>
            <h1>Every component, in your kit.</h1>
            <p className="mkt__section-sub">
              100+ accessible components — atoms, components, sections and whole page templates.
              A design system hands you theirs; here they wear <em>yours</em>: tune a kit and the
              whole catalog re-renders in it.
            </p>
            <div className="mkt__catalog-tools">
              <KitToggle hasKit={hasKit} showKit={showKit} onChange={setShowKit} onConfigure={() => navigate('/app')} />
            </div>
          </div>
        </div>
        <div className="mkt__catalog-stage">
          <div className="cockpit-preview" style={tokens}>
            <IconProvider set={iconSet}>
              <ComponentsView />
            </IconProvider>
          </div>
        </div>
        <div className="mkt__container mkt__catalog-cta">
          <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={() => navigate('/app')}>
            {hasKit ? 'Keep tuning in the configurator →' : 'Make these components yours →'}
          </button>
        </div>
      </section>
      <MktFooter navigate={navigate} />
    </div>
  )
}
