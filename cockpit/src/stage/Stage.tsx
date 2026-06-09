import { type CSSProperties } from 'react'
import type { Config, Tokens } from '../tokens/types'
import { IconProvider } from '../icons/Icon'
import { ComponentGallery } from './views/ComponentGallery'
import { DemoDashboard } from './views/DemoDashboard'
import { FoundationsView } from './views/FoundationsView'

/* The 4-layer ladder (mirrors src/kit/segments.ts):
 *   foundations → the resolved token scales (twins the panel)
 *   atoms       → the bare vocabulary (atom-tier gallery cards)
 *   blocks      → stand-alone pieces of app (block-tier gallery cards)
 *   pages       → the curated SupaDash super-app (every component in context) */
export type ViewKind = 'foundations' | 'atoms' | 'blocks' | 'pages'

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
                {view === 'foundations' && <FoundationsView cfg={cfg} tokens={tokens} />}
                {view === 'atoms' && <ComponentGallery tier="atom" />}
                {view === 'blocks' && <ComponentGallery tier="block" />}
                {view === 'pages' && <DemoDashboard />}
              </div>
            </IconProvider>
          </div>
        </div>
      </div>
    </main>
  )
}
