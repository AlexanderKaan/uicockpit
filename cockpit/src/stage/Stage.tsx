import { useState, type CSSProperties } from 'react'
import type { Config, Tokens } from '../tokens/types'
import { IconProvider } from '../icons/Icon'
import { ComponentGallery } from './views/ComponentGallery'
import { PagesView } from './views/PagesView'
import { peekGalleryJumpTier } from '../state/galleryJump'

/* The two modi:
 *   components → the vocabulary: one gallery, Atom/Component is a sub-toggle
 *   pages      → the loupe: Showcases you drill Page › Section › Atom › All tokens. */
export type ViewKind = 'components' | 'pages'

/* Components — the merged Atom/Component altitude. One gallery; the tier is an
 * inline segctrl (dogfoods the kit) instead of two top-level tabs. Arriving via
 * a showcase Inspect jump pre-selects the tier so the searched part is visible
 * the instant the gallery pops the query. */
function ComponentsView() {
  const [tier, setTier] = useState<'atom' | 'component' | 'section' | 'page'>(() => peekGalleryJumpTier() ?? 'component')
  return (
    <div className="stagewrap">
      <div className="stagewrap__bar">
        <div className="segctrl" role="radiogroup" aria-label="Component altitude">
          {([
            ['atom', 'Atoms', 'Bare primitives — buttons, inputs, badges'],
            ['component', 'Components', 'Reusable units — tables, forms, dialogs'],
            ['section', 'Sections', 'Page regions — headers, entity cards, the app frame'],
            ['page', 'Pages', 'Full-bleed page templates — whole screens from section slabs'],
          ] as const).map(([t, label, sub]) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tier === t}
              title={`${label} — ${sub}`}
              className={`segctrl__btn ${tier === t ? 'segctrl__btn--on' : ''}`}
              onClick={() => setTier(t)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ComponentGallery tier={tier} key={tier} />
    </div>
  )
}

interface StageProps {
  cfg: Config
  tokens: Tokens
  /** Active view — owned by CockpitApp now that the topbar (the view switcher)
   *  lives above the stage as a full-width bar. */
  view: ViewKind
}

export function Stage({ cfg, tokens, view }: StageProps) {
  const previewStyle = tokens.vars as CSSProperties

  return (
    <main className="stage">
      <div className="stage__row">
        <div className="stage__body">
          <div className="cockpit-preview" style={previewStyle}>
            <IconProvider set={cfg.iconSet}>
              <div className="view-transition-root" key={view}>
                {view === 'components' && <ComponentsView />}
                {view === 'pages' && <PagesView />}
              </div>
            </IconProvider>
          </div>
        </div>
      </div>
    </main>
  )
}
