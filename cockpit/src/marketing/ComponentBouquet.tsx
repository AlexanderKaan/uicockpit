import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { IconProvider } from '../icons/Icon'
import { ComponentGallery } from '../stage/views/ComponentGallery'
import { buildTokens } from '../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import { applyColorTheme } from '../tokens/stylesAndThemes'

/**
 * Hero "bouquet" — the REAL <ComponentGallery/> (the exact wall the configurator
 * shows) rendered full-bleed behind the landing.
 *
 * ── The one interaction on this page ─────────────────────────────────────────
 * It STARTS broken. Every card wears a decision nobody made: nine accents that
 * fight, radii from square to pill, shadows that were never chosen together.
 * That is what an app looks like without a contract, and it is what most
 * visitors arrive with.
 *
 * One button sits over it. Click, and the whole wall resolves into a single
 * system in one motion. No configuring, no reading — the product demonstrated
 * in a second, which is the only pitch that survives a five-second visit.
 *
 * Why this instead of a hand-built showcase: it IS the live component library,
 * built by the real token engine — so it can never drift from the actual
 * components. No sync audit needed; it's the source.
 *
 * Interactive flourish: a tiny colour-switcher above the wall lets visitors
 * re-tint the whole system live. The cost is ~nil — the gallery is mounted ONCE
 * (useMemo) and a theme swap only changes the wrapper's --k-* vars, which cascade
 * to every card via CSS. No card re-renders, no masonry re-layout.
 *
 * Performance: the wall is capped to the first `limit` cards (the hero only shows
 * the top), so the ~47 cards below the fade never mount.
 */
const BASE = DEFAULT_CONFIG

/* One pre-baked --k-* set: the resolved system the button snaps to. Computed
 * once at module load, so the click is a style swap and nothing more. */
const SYSTEM_VARS = buildTokens(applyColorTheme(BASE, 'cobalt')).vars as CSSProperties

export function ComponentBouquet() {
  // Starts BROKEN on purpose — the drift is the before, not an easter egg.
  const [drift, setDrift] = useState(true)
  // A light sweeps across at the moment of the switch. It is not decoration: the
  // cards resolve in a staggered wave underneath it, so the light reads as the
  // thing DOING the change rather than a flourish played afterwards.
  const [sweep, setSweep] = useState(false)
  const wallRef = useRef<HTMLDivElement>(null)

  /**
   * Delays are measured, not guessed. The wall is a masonry, so DOM order is not
   * visual order — an nth-child stagger would wave diagonally and look like a
   * glitch. Reading each card's real vertical position makes the light and the
   * resolve travel together, at any column count.
   */
  const resolve = () => {
    const root = wallRef.current
    if (root) {
      const box = root.getBoundingClientRect()
      root.querySelectorAll<HTMLElement>('.gallery > .card').forEach((card) => {
        const rel = (card.getBoundingClientRect().top - box.top) / Math.max(1, box.height)
        card.style.transitionDelay = `${Math.round(Math.min(1, Math.max(0, rel)) * 460)}ms`
      })
    }
    setSweep(true)
    setDrift(false)
    window.setTimeout(() => setSweep(false), 1050)
  }

  // Mount the gallery ONCE. Memoised, so resolving the system re-tints via the
  // wrapper's CSS vars without re-rendering / re-laying-out the 34 cards.
  const gallery = useMemo(
    () => (
      <IconProvider set={BASE.iconSet}>
        <ComponentGallery limit={34} />
      </IconProvider>
    ),
    [],
  )

  return (
    <div className="mkt__bouquet-wrap">
      <div
        ref={wallRef}
        className={`cockpit-preview mkt__bouquet${drift ? ' mkt__bouquet--drift' : ''}`}
        style={SYSTEM_VARS}
        role="region"
        aria-label={drift
          ? 'The same components without a design system — inconsistent on purpose'
          : 'The same components on one design system'}
      >
        {gallery}
      </div>

      {/* The control names the product at the moment it proves itself. A plain
          button demonstrated the effect beautifully and left the visitor with no
          idea who did it; labelling the two states fixes the attribution, and it
          folds the awkward "show me again" link back into one control. */}
      <div className="mkt__resolve">
        <p className="mkt__resolve-lead">
          34 components. Nine accent colours. <b>One wall.</b>
        </p>

        <div className="mkt__switch" role="radiogroup" aria-label="Preview the same components with and without a design system">
          <span className={`mkt__switch-knob${drift ? '' : ' is-right'}`} aria-hidden="true" />
          <button
            type="button"
            role="radio"
            aria-checked={drift}
            className={`mkt__switch-opt${drift ? ' is-on' : ''}`}
            onClick={() => setDrift(true)}
          >
            Without UIcockpit
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!drift}
            className={`mkt__switch-opt${drift ? '' : ' is-on'}`}
            onClick={resolve}
          >
            With UIcockpit
          </button>
        </div>

        <p className="mkt__resolve-sub">the components never changed — only the system did</p>
      </div>

      {sweep && <span className="mkt__sweep" aria-hidden="true" />}
    </div>
  )
}
