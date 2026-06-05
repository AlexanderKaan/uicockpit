import { type CSSProperties } from 'react'
import type { Config, Tokens } from '../tokens/types'
import { IconProvider } from '../icons/Icon'
import { ComponentGallery } from './views/ComponentGallery'
import { DemoDashboard } from './views/DemoDashboard'

/* 2 views: the Components gallery (browse primitives in isolation) and
 * the unified super-app (SupaDash + absorbed Shop/Music/Chat/Billing/
 * Cloud screens — every key component in one real product context). */
export type ViewKind = 'components' | 'app'

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
          <div className="cockpit-preview" style={previewStyle} data-chrome={cfg.chrome}>
            <IconProvider set={cfg.iconSet}>
              <div className="view-transition-root" key={view}>
                {view === 'components' && <ComponentGallery />}
                {view === 'app' && <DemoDashboard />}
              </div>
            </IconProvider>
          </div>
        </div>
      </div>
    </main>
  )
}
