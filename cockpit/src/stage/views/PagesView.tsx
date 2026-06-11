import { useState } from 'react'
import { Icon } from '../../icons/Icon'
import { SHOWCASES, type BlockSpec, type ShowcaseManifest } from '../../showcases/manifests'
import { renderBlock } from '../../showcases/blocks'
import { DemoDashboard } from './DemoDashboard'

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
  const [active, setActive] = useState(0)
  const [showManifest, setShowManifest] = useState(false)
  // Inspect mode (H3b slice 2): overlay every block with its id tag; clicking
  // a tag pins that block's manifest spec + kit-recipe mapping above the stage.
  const [inspect, setInspect] = useState(false)
  const [picked, setPicked] = useState<{ pane: number; block: number } | null>(null)
  const pickedSpec = picked ? m.panes[picked.pane]?.blocks[picked.block] : undefined
  const wc = width < 600 ? 'Compact' : width < 840 ? 'Medium' : width < 1200 ? 'Expanded' : width < 1600 ? 'Large' : 'Extra-large'

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
                  {pane.blocks.map((b, j) =>
                    inspect ? (
                      <div
                        className={`shc__inspect ${picked?.pane === i && picked?.block === j ? 'shc__inspect--on' : ''}`}
                        key={j}
                      >
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
                    ),
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function PagesView() {
  const [mode, setMode] = useState<'showcases' | 'supadash'>('showcases')
  const [showcaseId, setShowcaseId] = useState(SHOWCASES[0]!.id)
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
      </div>

      {/* key = remount per showcase so width resets to the manifest default */}
      <ShowcaseStage m={m} key={m.id} />
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
