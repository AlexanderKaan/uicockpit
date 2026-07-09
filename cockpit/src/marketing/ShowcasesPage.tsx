import { useEffect } from 'react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'
import { KitToggle } from './KitToggle'
import { PagesView } from '../stage/views/PagesView'
import { IconProvider } from '../icons/Icon'
import { useVisitorKit } from '../state/useVisitorKit'
import { LEDGER_SCREENS } from '../showcases/manifests'

/* The CLI names for `npx uicockpit template <name>` — the SAME screens shown in the
 * wall above, derived from the SAME manifest gen-templates.tsx builds, so the chips
 * can't drift from what actually ships. */
const TEMPLATE_NAMES = LEDGER_SCREENS.map((s) => s.id.replace(/^ledger-?/, '') || 'home')

/**
 * /showcases — the Ledger showcase wall as a PUBLIC destination (IA-1). The wall
 * always existed inside the app (Showcases tab); this gives it a linkable,
 * indexable URL under the site nav. It renders the REAL PagesView — the same
 * interactive app (enter a screen, drive the sidebar, drag the width) — inside a
 * `.cockpit-preview` token scope. IA-3: the scope carries the DEFAULT kit or,
 * when the visitor has tuned one, THEIR kit ("reference pages, themed by yours").
 */
export function ShowcasesPage({ navigate }: { navigate: (to: string) => void }) {
  const { tokens, iconSet, hasKit, showKit, setShowKit } = useVisitorKit()
  useEffect(() => {
    const prev = document.title
    document.title = 'Showcases — real screens on one generated design system — UIcockpit'
    return () => { document.title = prev }
  }, [])
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
              every screen below is live, navigable and wearing {hasKit && showKit ? 'your kit' : 'the default kit'}.
              Open the configurator and the same screens re-render in <em>yours</em>.
            </p>
            <div className="mkt__catalog-tools">
              <KitToggle hasKit={hasKit} showKit={showKit} onChange={setShowKit} onConfigure={() => navigate('/app')} />
            </div>
          </div>
        </div>
        <div className="mkt__showcase-stage">
          <div className="cockpit-preview" style={tokens}>
            <IconProvider set={iconSet}>
              <PagesView />
            </IconProvider>
          </div>
        </div>
        <div className="mkt__container mkt__showcase-cta">
          <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={() => navigate('/app')}>
            {hasKit ? 'Keep tuning these screens →' : 'Re-theme these screens — build my kit →'}
          </button>
        </div>

        {/* Seed a starting screen — the CLI templates, reframed. Not "ship a
            finished page" (turnkey, off-thesis) but "seed a starting point your
            agent extends under check". The screens above ARE the previews; here's
            how to drop one in as a file. Chips = the CLI names (same manifest). */}
        <div className="mkt__container mkt__seed">
          <h2 className="mkt__seed-title">Seed a starting screen</h2>
          <p className="mkt__seed-sub">
            Want one as a file to build on? One command drops a screen into your project — already
            wearing your kit. It&apos;s a <em>starting point your agent extends under <code>check</code></em>,
            not a finished page to copy.
          </p>
          <div className="mkt__seed-install">
            <code>npx uicockpit template &lt;name&gt;</code>
          </div>
          <div className="mkt__seed-chips" aria-label="Available starting screens">
            {TEMPLATE_NAMES.map((name) => (
              <code className="mkt__seed-chip" key={name}>{name}</code>
            ))}
          </div>
        </div>
      </section>
      <MktFooter navigate={navigate} />
    </div>
  )
}
