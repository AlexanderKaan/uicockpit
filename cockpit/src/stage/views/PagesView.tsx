import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Icon } from '../../icons/Icon'
import { SHOWCASES, type BlockSpec, type ShowcaseManifest } from '../../showcases/manifests'
import { renderBlock } from '../../showcases/blocks'
import { DemoDashboard } from './DemoDashboard'
import { buildTokens } from '../../tokens/buildTokens'
import type { Config } from '../../tokens/types'

/* Inspectable composition (H3b slice 2): block id → the KIT recipes it maps
 * onto. Clicking a block tag in Inspect mode shows its manifest spec + this
 * mapping — the "what would I grab from the gallery to build this" answer. */
const BLOCK_RECIPES: Record<BlockSpec['block'], string> = {
  stats: '.stat-tile (+ __label/__value/__delta)',
  chart: '.card + ChartFrame (the catalogued chart presenter)',
  list: '.card + .list .list__item (+ .badge trail)',
  thread: '.card (message variant — primary-soft for own messages)',
  composer: '.toolbar + .in + .btn--icon',
  table: '.card + .tbl',
  form: '.card + .lab/.in + .card__foot actions',
  pricing: '.pricing > .pricing__tier (+ --featured) + .btn--block',
  prose: '.l-center (foundation) + type tokens',
  dl: '.card + .dl',
  chips: '.chip (+ .chip--on for the active filter)',
}

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

function ShowcaseStage({ m }: { m: ShowcaseManifest }) {
  const [width, setWidth] = useState(m.width)
  const [showManifest, setShowManifest] = useState(false)
  // Inspect mode (H3b slice 2): overlay every block with its id tag; clicking
  // a tag pins that block's manifest spec + kit-recipe mapping above the stage.
  const [inspect, setInspect] = useState(false)
  const [picked, setPicked] = useState<{ pane: number; block: number } | null>(null)
  const pickedSpec = picked ? m.panes[picked.pane]?.blocks[picked.block] : undefined
  const wc = width < 600 ? 'Compact' : width < 840 ? 'Medium' : width < 1200 ? 'Expanded' : width < 1600 ? 'Large' : 'Extra-large'

  // Inspect-aware block renderer — wraps each block with its clickable id tag.
  const renderInspectable = (b: BlockSpec, i: number, j: number): ReactNode =>
    inspect ? (
      <div className={`shc__inspect ${picked?.pane === i && picked?.block === j ? 'shc__inspect--on' : ''}`} key={j}>
        <button
          type="button"
          className="shc__inspect-tag"
          onClick={() => setPicked({ pane: i, block: j })}
          aria-label={`Inspect block: ${b.block}`}
        >
          {b.block}
        </button>
        {renderBlock(b, j)}
      </div>
    ) : (
      renderBlock(b, j)
    )

  // Export-as-starter: the manifest IS the starter — download it as JSON.
  // (Pair with tokens.css from the Use-kit modal; `uicockpit init --template`
  // consumes the same file later, D3.)
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
        <button type="button" className="btn btn--outline btn--sm btn--toggle" aria-pressed={showManifest} onClick={() => setShowManifest((s) => !s)}>
          <Icon name="file" />Manifest
        </button>
        <button type="button" className="btn btn--outline btn--sm btn--toggle" aria-pressed={inspect} onClick={() => { setInspect((s) => !s); setPicked(null) }}>
          <Icon name="search" />Inspect
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={downloadManifest}>
          <Icon name="upload" />Download manifest
        </button>
      </div>
      <p className="lyt__blurb">{m.blurb}</p>

      {showManifest && (
        <pre className="code shc__manifest" aria-label={`Manifest for ${m.title}`}>{JSON.stringify(m, null, 2)}</pre>
      )}
      {inspect && pickedSpec && (
        <div className="shc__spec" role="note" aria-label={`Block spec — ${pickedSpec.block}`}>
          <div className="shc__spec-head">
            <span className="badge badge--info">{pickedSpec.block}</span>
            <span className="shc__spec-map">builds from: <code>{BLOCK_RECIPES[pickedSpec.block]}</code></span>
            <button type="button" className="btn btn--ghost btn--icon btn--xs" aria-label="Close block spec" onClick={() => setPicked(null)}><Icon name="x" /></button>
          </div>
          <pre className="code shc__spec-json">{JSON.stringify(pickedSpec, null, 2)}</pre>
        </div>
      )}

      <div className="lyt__stage">
        <ShowcaseShell m={m} width={width} renderBlockFn={renderInspectable} />
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

function MatrixCell({ m, cfg, label }: { m: ShowcaseManifest; cfg: Config; label: string }) {
  // Each cell is its own token universe: a nested var-scope div (CSS custom
  // props cascade, so the cell's full var set overrides the stage's). The
  // shell renders at its real manifest width and is scaled down as one unit —
  // container queries measure the LAYOUT width, so each mini gets the true
  // desktop arrangement.
  const vars = useMemo(() => buildTokens(cfg).vars as CSSProperties, [cfg])
  const W = Math.max(m.width, 900)
  const H = 640
  const S = 0.42
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

export function PagesView({ cfg }: { cfg: Config }) {
  const [mode, setMode] = useState<'showcases' | 'supadash'>('showcases')
  const [showcaseId, setShowcaseId] = useState(SHOWCASES[0]!.id)
  const [matrix, setMatrix] = useState(false)
  const m = SHOWCASES.find((s) => s.id === showcaseId)!

  if (mode === 'supadash') {
    return (
      <div className="shc">
        <div className="shc__modebar">
          <ModeToggle mode={mode} onMode={setMode} />
        </div>
        <DemoDashboard />
      </div>
    )
  }

  return (
    <div className="lyt shc">
      <header className="lyt__head">
        <div className="shc__headrow">
          <h2 className="lyt__title">Showcases — pages as manifests</h2>
          <ModeToggle mode={mode} onMode={setMode} />
        </div>
        <p className="lyt__intro">
          A page here is <em>data</em>: archetype × nav × panes of seeded blocks, rendered through
          the same kit recipes the export ships. Scrub the width — every showcase adapts via the
          shell tier, and the manifest button shows the JSON that IS the screen.
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
        <button type="button" className="btn btn--outline btn--sm btn--toggle" aria-pressed={matrix} onClick={() => setMatrix((s) => !s)}>
          <Icon name="grid" />Style matrix
        </button>
      </div>

      {matrix ? (
        <>
          <p className="lyt__blurb">
            One manifest, three kits — the left column is YOUR live config; the others are curated
            contrasts. Style is orthogonal to structure: the JSON never changes.
          </p>
          <div className="shc__matrix">
            {MATRIX_STYLES.map((s) => (
              <MatrixCell key={s.id} m={m} cfg={{ ...cfg, ...s.patch }} label={s.id === 'yours' ? s.label : s.label} />
            ))}
          </div>
        </>
      ) : (
        /* key = remount per showcase so width resets to the manifest default */
        <ShowcaseStage m={m} key={m.id} />
      )}
    </div>
  )
}

function ModeToggle({ mode, onMode }: { mode: 'showcases' | 'supadash'; onMode: (m: 'showcases' | 'supadash') => void }) {
  return (
    <div className="segctrl" role="radiogroup" aria-label="Pages mode">
      {([['showcases', 'Showcases'], ['supadash', 'SupaDash']] as const).map(([id, label]) => (
        <button key={id} type="button" role="radio" aria-checked={mode === id} className={`segctrl__btn ${mode === id ? 'segctrl__btn--on' : ''}`} onClick={() => onMode(id)}>
          {label}
        </button>
      ))}
    </div>
  )
}
