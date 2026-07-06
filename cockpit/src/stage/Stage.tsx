import { type CSSProperties } from 'react'
import type { Config, Tokens } from '../tokens/types'
import { IconProvider } from '../icons/Icon'
import { PagesView } from './views/PagesView'
import { ComponentsView } from './views/ComponentsView'

/* The two modi:
 *   components → the vocabulary: one gallery, Atom/Component is a sub-toggle
 *   pages      → the loupe: Showcases you drill Page › Section › Atom › All tokens. */
export type ViewKind = 'components' | 'pages'

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
