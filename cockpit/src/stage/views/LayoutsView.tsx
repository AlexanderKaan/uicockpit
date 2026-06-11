import { useState } from 'react'
import { Icon } from '../../icons/Icon'

/**
 * Layouts view (H3a) — the 5th rung of the ladder, the wireframe workbench.
 *
 * Shows the SHELL tier live: pick one of the three canonical archetypes
 * (M3's complete official layout menu), then scrub the shell's WIDTH across
 * the window classes and watch the scaffold + nav suite + panes re-arrange —
 * container-query-driven, so it's the shell's own width that matters, never
 * the viewport. Content is deliberately BARE (wireframe ghosts, like the
 * atoms workbench): shells own ARRANGEMENT, never look.
 */

type Archetype = 'feed' | 'list-detail' | 'supporting'

const ARCHETYPES: Array<{ id: Archetype; label: string; blurb: string }> = [
  { id: 'feed', label: 'Feed', blurb: 'One flexible pane; tiles pack per the pane’s own width (auto-fill, min 180px).' },
  { id: 'list-detail', label: 'List-detail', blurb: 'Fixed 360px list beside a flexible detail. Below 840px the detail drops out and the list owns the width — selection then navigates.' },
  { id: 'supporting', label: 'Supporting pane', blurb: 'Flexible content with a fixed 360px supporting pane. Below 840px the supporting content moves into the flow (or a bottom sheet).' },
]

/** The M3 window class for a given shell width — mirrors the recipe thresholds. */
const windowClass = (w: number): string =>
  w < 600 ? 'Compact' : w < 840 ? 'Medium' : w < 1200 ? 'Expanded' : w < 1600 ? 'Large' : 'Extra-large'

const NAV_ITEMS = [
  { icon: 'home', label: 'Home' },
  { icon: 'search', label: 'Search' },
  { icon: 'bell', label: 'Activity' },
  { icon: 'cog', label: 'Settings' },
] as const

function GhostTile() {
  return (
    <div className="lyt__ghost">
      <div className="lyt__ghost-media" />
      <div className="lyt__ghost-line" />
      <div className="lyt__ghost-line lyt__ghost-line--short" />
    </div>
  )
}

function GhostRow({ on }: { on?: boolean }) {
  return (
    <div className={`lyt__ghostrow ${on ? 'lyt__ghostrow--on' : ''}`}>
      <div className="lyt__ghost-dot" />
      <div className="lyt__ghost-lines">
        <div className="lyt__ghost-line" />
        <div className="lyt__ghost-line lyt__ghost-line--short" />
      </div>
    </div>
  )
}

function GhostProse() {
  return (
    <div className="lyt__ghostprose">
      <div className="lyt__ghost-line lyt__ghost-line--title" />
      {[92, 100, 96, 88, 100, 72].map((w, i) => (
        <div key={i} className="lyt__ghost-line" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

export function LayoutsView() {
  const [archetype, setArchetype] = useState<Archetype>('list-detail')
  const [width, setWidth] = useState(1000)
  const [active, setActive] = useState(0)
  const arch = ARCHETYPES.find((a) => a.id === archetype)!
  const wc = windowClass(width)

  return (
    <div className="lyt">
      <header className="lyt__head">
        <h2 className="lyt__title">Layouts — the adaptive shell tier</h2>
        <p className="lyt__intro">
          Shells arrange blocks per <em>container</em> width (never the viewport): the scaffold
          re-docks the nav, the nav suite morphs bar → rail → expanded, and panes show, hide and
          reflow at the window classes. Drag the width and watch one markup do all of it.
        </p>
      </header>

      <div className="lyt__controls">
        {/* Archetype — the three canonical layouts (dogfoods the kit's segctrl) */}
        <div className="segctrl" role="radiogroup" aria-label="Layout archetype">
          {ARCHETYPES.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={archetype === a.id}
              className={`segctrl__btn ${archetype === a.id ? 'segctrl__btn--on' : ''}`}
              onClick={() => setArchetype(a.id)}
            >
              {a.label}
            </button>
          ))}
        </div>
        {/* Width scrubber over the window classes */}
        <label className="lyt__scrub">
          <span className="lyt__scrub-label">Shell width</span>
          <input
            type="range"
            min={360}
            max={1680}
            step={10}
            value={width}
            list="lyt-win-detents"
            onChange={(e) => setWidth(+e.target.value)}
            aria-label="Shell width in pixels"
          />
          <datalist id="lyt-win-detents">
            <option value={600} />
            <option value={840} />
            <option value={1200} />
            <option value={1600} />
          </datalist>
          <span className="lyt__scrub-val">
            {width}px · <strong>{wc}</strong>
          </span>
        </label>
      </div>
      <p className="lyt__blurb">{arch.blurb}</p>

      {/* The live shell — real kit recipes, wireframe content */}
      <div className="lyt__stage">
        <div className={`scaffold scaffold--${archetype}`} style={{ width, maxWidth: '100%' }}>
          <div className="scaffold__frame lyt__frame">
            <div className="scaffold__bar lyt__bar">
              <div className="lyt__ghost-dot" />
              <div className="lyt__ghost-line lyt__ghost-line--bar" />
            </div>
            <nav className="scaffold__nav" aria-label="Demo navigation">
              <div className="navsuite">
                {NAV_ITEMS.map((it, i) => (
                  <button
                    key={it.label}
                    type="button"
                    className={`navsuite__item ${i === active ? 'navsuite__item--on' : ''}`}
                    aria-current={i === active ? 'page' : undefined}
                    onClick={() => setActive(i)}
                  >
                    <span className="navsuite__icon">
                      <Icon name={it.icon} size={18} />
                    </span>
                    <span className="navsuite__label">{it.label}</span>
                  </button>
                ))}
              </div>
            </nav>
            <div className="scaffold__body">
              {archetype === 'feed' && (
                <section className="pane pane--flex" aria-label="Feed pane">
                  <div className="pane__grid">
                    {Array.from({ length: 10 }, (_, i) => (
                      <GhostTile key={i} />
                    ))}
                  </div>
                </section>
              )}
              {archetype === 'list-detail' && (
                <>
                  <section className="pane pane--fixed lyt__pane" aria-label="List pane">
                    {Array.from({ length: 7 }, (_, i) => (
                      <GhostRow key={i} on={i === 1} />
                    ))}
                  </section>
                  <section className="pane pane--flex pane--detail lyt__pane" aria-label="Detail pane">
                    <GhostProse />
                  </section>
                </>
              )}
              {archetype === 'supporting' && (
                <>
                  <section className="pane pane--flex lyt__pane" aria-label="Content pane">
                    <GhostProse />
                  </section>
                  <section className="pane pane--fixed pane--supporting lyt__pane" aria-label="Supporting pane">
                    {Array.from({ length: 4 }, (_, i) => (
                      <GhostRow key={i} />
                    ))}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="lyt__legend">
        <span>
          Window classes: <code>compact</code> &lt;600 · <code>medium</code> 600–839 ·{' '}
          <code>expanded</code> 840–1199 · <code>large</code> 1200–1599 · <code>extra-large</code> ≥1600
        </span>
        <span>
          Recipes: <code>.scaffold</code> · <code>.navsuite</code> · <code>.pane</code> — exported like
          every other segment; archetype = a modifier, nav = whatever sits in the nav slot (orthogonal).
        </span>
      </footer>
    </div>
  )
}
