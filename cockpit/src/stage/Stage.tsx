import { type CSSProperties } from 'react'
import type { Config, Tokens } from '../tokens/types'
import { IconProvider } from '../icons/Icon'
import { ComponentsView } from './views/ComponentsView'
import { AuditView } from './views/AuditView'
import { AuditEmpty } from './views/AuditEmpty'
import type { AuditHandoff } from '../audit/handoff'

/* One stage, one job: the vocabulary — every component in the configured kit on
 * a single searchable wall. The Showcases loupe that used to sit beside it is
 * gone; with two front doors the app's whole job is "tune it and take it", and
 * a second browsing mode inside the tool competed with that instead of serving
 * it. (The showcase manifests survive as the build gate's conformance fixture —
 * see cockpit/CLAUDE.md — they are just no longer a screen.) */
export type StageMode = 'catalogue' | 'audit'

interface StageProps {
  cfg: Config
  tokens: Tokens
  /** Present only when the visitor arrived from an audit. */
  audit?: AuditHandoff | null
  mode?: StageMode
  onSeeEvidence?: () => void
  /** A scan started from inside the app, rather than from the marketing door. */
  onScanned?: (h: AuditHandoff, hash: string) => void
}

export function Stage({ cfg, tokens, audit, mode = 'catalogue', onSeeEvidence, onScanned }: StageProps) {
  const previewStyle = tokens.vars as CSSProperties

  return (
    <main className="stage" id="main" tabIndex={-1}>
      <div className="stage__row">
        <div className="stage__body">
          <div className="cockpit-preview" style={previewStyle}>
            <IconProvider set={cfg.iconSet}>
              <div className="view-transition-root" key={mode}>
                {mode !== 'audit'
                  ? <ComponentsView />
                  : audit
                    ? <AuditView audit={audit} onSeeEvidence={onSeeEvidence} />
                    : <AuditEmpty onScanned={onScanned ?? (() => {})} />}
              </div>
            </IconProvider>
          </div>
        </div>
      </div>
    </main>
  )
}
