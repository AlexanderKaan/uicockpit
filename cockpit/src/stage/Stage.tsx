import { lazy, Suspense, useState, type CSSProperties } from 'react'
import type { Config, Tokens } from '../tokens/types'
import type { SandboxResult } from '../sandbox/SandboxView'
import { IconProvider } from '../icons/Icon'
import { ComponentGallery } from './views/ComponentGallery'
import { PagesView } from './views/PagesView'
import { peekGalleryJumpTier } from '../state/galleryJump'

// Lazy — the sandbox view (extractors; tesseract stays dynamic inside it) only
// loads when the user opens the third mode.
const SandboxView = lazy(() => import('../sandbox/SandboxView').then((m) => ({ default: m.SandboxView })))

/* The three modi:
 *   components → the vocabulary: one gallery, Atom/Component is a sub-toggle
 *   pages      → the loupe: Showcases you drill Page › Section › Atom › All tokens.
 *   sandbox    → "Your app": upload → board built from our recipes in your style,
 *                tuned live by the same Foundation panel. */
export type ViewKind = 'components' | 'pages' | 'sandbox'

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
  /** Cross-view jumps (H3b: showcase inspect tag → gallery card). */
  onViewChange: (v: ViewKind) => void
  /** Sandbox (third mode) — extracted result (content + blocks) + callbacks. */
  sandboxResult: SandboxResult | null
  onSandboxRead: (seeded: Config, result: SandboxResult) => void
  onSandboxReset: () => void
}

export function Stage({ cfg, tokens, view, onViewChange, sandboxResult, onSandboxRead, onSandboxReset }: StageProps) {
  const previewStyle = tokens.vars as CSSProperties

  return (
    <main className="stage">
      <div className="stage__row">
        <div className="stage__body">
          <div className="cockpit-preview" style={previewStyle}>
            <IconProvider set={cfg.iconSet}>
              <div className="view-transition-root" key={view}>
                {view === 'components' && <ComponentsView />}
                {view === 'pages' && <PagesView cfg={cfg} onViewChange={onViewChange} />}
                {view === 'sandbox' && (
                  <Suspense fallback={null}>
                    <SandboxView cfg={cfg} result={sandboxResult} onRead={onSandboxRead} onReset={onSandboxReset} />
                  </Suspense>
                )}
              </div>
            </IconProvider>
          </div>
        </div>
      </div>
    </main>
  )
}
