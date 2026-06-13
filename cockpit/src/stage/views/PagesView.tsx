import { useMemo, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { Icon } from '../../icons/Icon'
import { SHOWCASES, type BlockSpec, type ShowcaseManifest } from '../../showcases/manifests'
import { renderBlock } from '../../showcases/blocks'
import { buildTokens } from '../../tokens/buildTokens'
import type { Config } from '../../tokens/types'
import { setGalleryJump } from '../../state/galleryJump'
import { COMPONENTS, componentAt } from '../../showcases/components'
import type { ViewKind } from '../Stage'

/* Component → gallery tier guess for the specimen's "Open in gallery" jump
 * (Fase J-1). componentAt returns a kit-class id; the stat-tile/table/card
 * patterns live in the Block tier, the rest are Atoms. (J2 re-adds block-level
 * jumps once the breadcrumb gives block context.) */
const COMP_TIER: Record<string, 'atom' | 'block'> = { stat: 'block', table: 'block', card: 'block' }

/**
 * Pages view (H3b) — Showcases first, SupaDash one click away.
 *
 * The Showcases theater renders MANIFESTS: a page = archetype × nav × panes
 * of seeded blocks, as plain JSON (see src/showcases/manifests.ts). Each
 * showcase gets the width-scrubber theater (the H3a workbench pattern) and a
 * "view manifest" disclosure that prints the literal object — the proof that
 * the screen is round-trippable data, not bespoke TSX. SupaDash (the deep
 * hand-built super-app) stays as the second tab until its screens are
 * reframed into manifests (H3b later slices).
 */

const PANE_CLASS = {
  flex: 'pane pane--flex',
  fixed: 'pane pane--fixed',
  detail: 'pane pane--flex pane--detail',
  supporting: 'pane pane--fixed pane--supporting',
} as const

function ShowcaseStage({ m, onViewChange }: { m: ShowcaseManifest; onViewChange: (v: ViewKind) => void }) {
  const [width, setWidth] = useState(m.width)
  // The loupe (Fase J-1): the live page, with a COLLAPSIBLE specimen rail.
  // Rail closed = a clean preview (the old "Live"); Inspect opens it and makes
  // the page leaf-clickable — click any element → it's isolated on the left with
  // its recipe (the old "Split"). One toggle, not three modes.
  const [railOpen, setRailOpen] = useState(false)
  const [pickedComp, setPickedComp] = useState<string | null>(null)
  const comp = pickedComp ? COMPONENTS[pickedComp] : undefined
  const wc = width < 600 ? 'Compact' : width < 840 ? 'Medium' : width < 1200 ? 'Expanded' : width < 1600 ? 'Large' : 'Extra-large'

  // Clicking the page (only when the rail is open) isolates the deepest kit
  // component under the cursor into the specimen rail.
  const pick = (e: ReactMouseEvent) => {
    const id = componentAt(e.target as Element)
    if (id) { setPickedComp(id); setRailOpen(true) }
  }

  // Export-as-starter: the manifest IS the starter — download it as JSON.
  const downloadManifest = () => {
    const blob = new Blob([JSON.stringify(m, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${m.id}.manifest.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="lyt__controls">
        <label className="lyt__scrub">
          <span className="lyt__scrub-label">Shell width</span>
          <input
            type="range"
            min={360}
            max={1680}
            step={10}
            value={width}
            list="shc-win-detents"
            onChange={(e) => setWidth(+e.target.value)}
            aria-label="Shell width in pixels"
          />
          <datalist id="shc-win-detents">
            <option value={600} />
            <option value={840} />
            <option value={1200} />
            <option value={1600} />
          </datalist>
          <span className="lyt__scrub-val">{width}px · <strong>{wc}</strong></span>
        </label>
        <span className="shc__picker-spacer" />
        <button type="button" className="btn btn--ghost btn--sm btn--toggle" aria-pressed={railOpen} onClick={() => setRailOpen((o) => !o)}>
          <Icon name="search" />{railOpen ? 'Done inspecting' : 'Inspect'}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={downloadManifest}>
          <Icon name="upload" />Download manifest
        </button>
      </div>
      <p className="lyt__blurb">
        {m.blurb} {railOpen ? '— click any element in the page to isolate it beside its recipe.' : '— scrub the width to watch the shell re-arrange; Inspect to click into any component.'}
      </p>

      <details className="shc__manifestbox">
        <summary>Full manifest JSON — the screen IS this data</summary>
        <pre className="code shc__manifest" aria-label={`Manifest for ${m.title}`}>{JSON.stringify(m, null, 2)}</pre>
      </details>

      <div className={`lyt__stage ${railOpen ? 'shc__splitstage' : ''}`}>
        {railOpen && (
          <aside className="shc__specimen" aria-label="Selected component, isolated">
            <div className="shc__specimen-head">
              <span>Specimen</span>
              {comp && <span className="badge badge--info">{comp.label}</span>}
            </div>
            <div className="shc__specimen-body">
              {comp ? (
                comp.specimen()
              ) : (
                <div className="shc__specimen-empty">
                  <Icon name="search" />
                  <span>Click any component in the page — it appears here with its recipe.</span>
                </div>
              )}
            </div>
            {comp && (
              <div className="shc__specimen-recipe">
                <div className="shc__recipe-title">Recipe — how it derives</div>
                {comp.recipe.map(([k, v]) => (
                  <div className="shc__recipe-row" key={k}><span className="shc__recipe-k">{k}</span><code className="shc__recipe-v">{v}</code></div>
                ))}
                <div className="shc__recipe-blurb">{comp.blurb}</div>
                <button
                  type="button"
                  className="btn btn--outline btn--xs"
                  onClick={() => { setGalleryJump(comp.label.toLowerCase(), COMP_TIER[pickedComp!] ?? 'atom'); onViewChange('components') }}
                >
                  Open in gallery <Icon name="chevR" />
                </button>
              </div>
            )}
          </aside>
        )}
        <div
          className={railOpen ? 'shc__splitpage' : undefined}
          onClick={railOpen ? pick : undefined}
        >
          <ShowcaseShell m={m} width={railOpen ? Math.min(width, 1100) : width} />
        </div>
      </div>
    </>
  )
}

/** The pure shell render — one manifest → one live scaffold. Shared by the
 *  single-stage theater and the style-matrix cells; nav selection is local. */
function ShowcaseShell({
  m,
  width,
  renderBlockFn = renderBlock,
}: {
  m: ShowcaseManifest
  width: number
  renderBlockFn?: (b: BlockSpec, paneIdx: number, blockIdx: number) => ReactNode
}) {
  const [active, setActive] = useState(0)
  return (
    <div className={`scaffold scaffold--${m.archetype}`} style={{ width, maxWidth: '100%' }}>
      <div className="scaffold__frame shc__frame">
        <div className="scaffold__bar shc__bar">
          <span className="shc__bar-title">{m.barTitle}</span>
          {m.nav === 'topbar' && (
            <nav className="shc__bar-links" aria-label={`${m.title} navigation`}>
              {m.navItems.map((it, i) => (
                <button key={it.label} type="button" className={`tab ${i === active ? 'tab--on' : ''}`} onClick={() => setActive(i)}>{it.label}</button>
              ))}
            </nav>
          )}
          <span className="shc__bar-spacer" />
          <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Search"><Icon name="search" /></button>
          <span className="avatar avatar--sm">A</span>
        </div>
        {m.nav === 'suite' && (
          <nav className="scaffold__nav" aria-label={`${m.title} navigation`}>
            <div className="navsuite">
              {m.navItems.map((it, i) => (
                <button
                  key={it.label}
                  type="button"
                  className={`navsuite__item ${i === active ? 'navsuite__item--on' : ''}`}
                  aria-current={i === active ? 'page' : undefined}
                  onClick={() => setActive(i)}
                >
                  <span className="navsuite__icon"><Icon name={it.icon} size={18} /></span>
                  <span className="navsuite__label">{it.label}</span>
                </button>
              ))}
            </div>
          </nav>
        )}
        <div className="scaffold__body">
          {m.panes.map((pane, i) => (
            <section className={`${PANE_CLASS[pane.role]} shc__pane`} key={i} aria-label={`${m.title} ${pane.role} pane`}>
              {pane.blocks.map((b, j) => renderBlockFn(b, i, j))}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

/* The style-matrix (H3b slice 3) — the SAME manifest under contrasting kits.
 * Column 1 is the live cockpit config ("Your kit"); 2 + 3 are curated
 * contrasts built from the engine's own dials. One manifest × N styles =
 * the proof that pages are data and style is orthogonal. */
const MATRIX_STYLES: Array<{ id: string; label: string; patch: Partial<Config> }> = [
  { id: 'yours', label: 'Your kit', patch: {} },
  {
    id: 'complement-dark',
    label: 'Violet · complement · dark',
    patch: { cPrimary: '#7C3AED', mode: 'dark', harmony: 'complement', spread: 180, expression: 100 },
  },
  {
    id: 'expressive-warm',
    label: 'Ember · expressive',
    patch: { cPrimary: '#EA580C', harmony: 'expressive', spread: 120, expression: 140, shapePoints: 12, shapeDepth: 0.5, shapeSoft: 0.3 },
  },
]

function MatrixCell({ m, cfg, label, scale = 0.42 }: { m: ShowcaseManifest; cfg: Config; label: string; scale?: number }) {
  // Each cell is its own token universe: a nested var-scope div (CSS custom
  // props cascade, so the cell's full var set overrides the stage's). The
  // shell renders at its real manifest width and is scaled down as one unit —
  // container queries measure the LAYOUT width, so each mini gets the true
  // desktop arrangement.
  const vars = useMemo(() => buildTokens(cfg).vars as CSSProperties, [cfg])
  const W = Math.max(m.width, 900)
  const H = 640
  const S = scale
  return (
    <figure className="shc__matrix-cell">
      <figcaption className="shc__matrix-label">{label}</figcaption>
      <div className="shc__matrix-port" style={{ width: W * S, height: H * S }}>
        <div
          className="shc__matrix-world"
          style={{ ...vars, width: W, height: H, transform: `scale(${S})` }}
        >
          <ShowcaseShell m={m} width={W} />
        </div>
      </div>
    </figure>
  )
}

export function PagesView({ cfg, onViewChange }: { cfg: Config; onViewChange: (v: ViewKind) => void }) {
  const [showcaseId, setShowcaseId] = useState(SHOWCASES[0]!.id)
  // Fase J-1: Live/Inspect/Split collapsed into ONE loupe (ShowcaseStage, with
  // its own collapsible rail). The only peer view left is Matrix — a single
  // toggle, not a 4-button mode strip (J4 will pull it out into a Compare action).
  const [matrix, setMatrix] = useState(false)
  // ×6: the FULL grid — every showcase × every style (the 3×6 money-shot).
  const [matrixAll, setMatrixAll] = useState(false)
  const m = SHOWCASES.find((s) => s.id === showcaseId)!

  return (
    <div className="lyt shc">
      <header className="lyt__head">
        <div className="shc__headrow">
          <h2 className="lyt__title">Showcases — pages as manifests</h2>
        </div>
        <p className="lyt__intro">
          A page here is <em>data</em>: archetype × nav × panes of seeded blocks, rendered through
          the same kit recipes the export ships.{matrix ? ' Compare it under three kits — structure is orthogonal to style.' : ' Inspect to click into any component and read its recipe.'}
        </p>
      </header>

      {/* Showcase picker — dogfoods the kit's own filter chips */}
      <div className="shc__picker" role="radiogroup" aria-label="Showcase">
        {SHOWCASES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={s.id === showcaseId}
            className={`chip ${s.id === showcaseId ? 'chip--on' : ''}`}
            onClick={() => setShowcaseId(s.id)}
          >
            {s.title}
          </button>
        ))}
        <span className="shc__picker-spacer" />
        {/* Two ways to view one manifest: the live Page (the loupe) or the Matrix
         * comparison. J4 → Matrix becomes a "Compare kits" action. */}
        <div className="segctrl shc__viewmode" role="radiogroup" aria-label="View">
          <button type="button" role="radio" aria-checked={!matrix} className={`segctrl__btn ${!matrix ? 'segctrl__btn--on' : ''}`} onClick={() => setMatrix(false)}>
            <Icon name="card" />Page
          </button>
          <button type="button" role="radio" aria-checked={matrix} className={`segctrl__btn ${matrix ? 'segctrl__btn--on' : ''}`} onClick={() => setMatrix(true)}>
            <Icon name="grid" />Matrix
          </button>
        </div>
      </div>

      {matrix ? (
        <>
          <div className="lyt__controls">
            <p className="lyt__blurb" style={{ margin: 0, flex: 1 }}>
              One manifest, three kits — the left column is YOUR live config; the others are
              curated contrasts. Style is orthogonal to structure: the JSON never changes.
            </p>
            <button type="button" className="btn btn--outline btn--sm btn--toggle" aria-pressed={matrixAll} onClick={() => setMatrixAll((s) => !s)}>
              All 6 × 3
            </button>
          </div>
          {matrixAll ? (
            <div className="shc__matrixgrid">
              {SHOWCASES.map((s) => (
                <div key={s.id}>
                  <div className="shc__matrixrow-title">{s.title}</div>
                  <div className="shc__matrix">
                    {MATRIX_STYLES.map((st) => (
                      <MatrixCell key={st.id} m={s} cfg={{ ...cfg, ...st.patch }} label={st.label} scale={0.26} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="shc__matrix">
              {MATRIX_STYLES.map((s) => (
                <MatrixCell key={s.id} m={m} cfg={{ ...cfg, ...s.patch }} label={s.label} />
              ))}
            </div>
          )}
        </>
      ) : (
        /* key = remount per showcase so width resets to the manifest default */
        <ShowcaseStage m={m} key={m.id} onViewChange={onViewChange} />
      )}
    </div>
  )
}


