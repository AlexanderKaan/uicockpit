import { type CSSProperties } from 'react'
import type { Config, Tokens } from '../tokens/types'
import { IconProvider } from '../icons/Icon'
import { ComponentGallery } from './views/ComponentGallery'
import { FoundationsView } from './views/FoundationsView'
import { LayoutsView } from './views/LayoutsView'
import { PagesView } from './views/PagesView'

/* The 5-rung ladder (mirrors src/kit/segments.ts — H3a added the shell rung):
 *   foundations → the resolved token scales (twins the panel)
 *   atoms       → the bare vocabulary (atom-tier gallery cards)
 *   blocks      → stand-alone pieces of app (block-tier gallery cards)
 *   layouts     → the SHELL tier: the adaptive scaffold/nav/pane workbench
 *   pages       → Showcases (manifest-driven screens, H3b) + SupaDash */
export type ViewKind = 'foundations' | 'atoms' | 'blocks' | 'layouts' | 'pages'

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
                {view === 'layouts' && <LayoutsView />}
                {view === 'pages' && <PagesView cfg={cfg} />}
              </div>
            </IconProvider>
          </div>
        </div>
      </div>
    </main>
  )
}
