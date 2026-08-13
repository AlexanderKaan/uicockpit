import { type CSSProperties } from 'react'
import type { Config, Tokens } from '../tokens/types'
import { IconProvider } from '../icons/Icon'
import { ComponentsView } from './views/ComponentsView'

/* One stage, one job: the vocabulary — every component in the configured kit on
 * a single searchable wall. The Showcases loupe that used to sit beside it is
 * gone; with two front doors the app's whole job is "tune it and take it", and
 * a second browsing mode inside the tool competed with that instead of serving
 * it. (The showcase manifests survive as the build gate's conformance fixture —
 * see cockpit/CLAUDE.md — they are just no longer a screen.) */
interface StageProps {
  cfg: Config
  tokens: Tokens
}

export function Stage({ cfg, tokens }: StageProps) {
  const previewStyle = tokens.vars as CSSProperties

  return (
    <main className="stage">
      <div className="stage__row">
        <div className="stage__body">
          <div className="cockpit-preview" style={previewStyle}>
            <IconProvider set={cfg.iconSet}>
              <div className="view-transition-root">
                <ComponentsView />
              </div>
            </IconProvider>
          </div>
        </div>
      </div>
    </main>
  )
}
