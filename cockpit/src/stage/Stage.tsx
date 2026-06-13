import { useState, type CSSProperties } from 'react'
import type { Config, Tokens } from '../tokens/types'
import { IconProvider } from '../icons/Icon'
import { ComponentGallery } from './views/ComponentGallery'
import { FoundationsView } from './views/FoundationsView'
import { PagesView } from './views/PagesView'
import { peekGalleryJumpTier } from '../state/galleryJump'

/* The altitude ladder (Fase I-C → J5 — the 5-rung graph collapsed to 3 visited
 * stages, capacity intact; the sub-toggles ARE the missing rungs):
 *   foundations → the resolved token scales (twins the panel)
 *   components  → the vocabulary: one gallery, Atom/Block is a sub-toggle
 *   pages       → the loupe: Showcases (manifest screens) you drill Page › Block
 *                 › Atom › All tokens. Shells folded into the width slider (J5):
 *                 the nav morphs bar → rail → sidebar as you scrub, so the
 *                 standalone Shells workbench is gone. */
export type ViewKind = 'foundations' | 'components' | 'pages'

/* Components — the merged Atom/Block altitude. One gallery; the tier is an
 * inline segctrl (dogfoods the kit) instead of two top-level tabs. Arriving via
 * a showcase Inspect jump pre-selects the tier so the searched part is visible
 * the instant the gallery pops the query. */
function ComponentsView() {
  const [tier, setTier] = useState<'atom' | 'block'>(() => peekGalleryJumpTier() ?? 'block')
  return (
    <div className="stagewrap">
      <div className="stagewrap__bar">
        <div className="segctrl" role="radiogroup" aria-label="Component altitude">
          {([
            ['block', 'Blocks', 'Ready-made sections — tables, forms, dialogs'],
            ['atom', 'Atoms', 'Bare building blocks — buttons, inputs, badges'],
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
  /** Cross-view jumps (H3b: showcase inspect tag → gallery card). */
  onViewChange: (v: ViewKind) => void
}

export function Stage({ cfg, tokens, view, onViewChange }: StageProps) {
  const previewStyle = tokens.vars as CSSProperties

  // Fase I-D — the gradient canvas. A subtle brand-derived mesh behind the
  // preview (cockpit chrome, NOT exported) so the framed kit floats on a premium
  // surface instead of flat form-grey. Driven by the live brand/secondary/accent
  // hexes, so it re-tints the moment the brand changes.
  const canvasStyle = {
    '--canvas-1': tokens.primaryHex,
    '--canvas-2': tokens.secHex,
    '--canvas-3': tokens.accentHex,
  } as CSSProperties

  return (
    <main className="stage">
      <div className="stage__row">
        <div className="stage__body" style={canvasStyle}>
          <div className="cockpit-preview" style={previewStyle}>
            <IconProvider set={cfg.iconSet}>
              <div className="view-transition-root" key={view}>
                {view === 'foundations' && <FoundationsView cfg={cfg} tokens={tokens} />}
                {view === 'components' && <ComponentsView />}
                {view === 'pages' && <PagesView cfg={cfg} onViewChange={onViewChange} />}
              </div>
            </IconProvider>
          </div>
        </div>
      </div>
    </main>
  )
}
