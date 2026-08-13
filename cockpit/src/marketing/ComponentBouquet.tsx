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
  // Which way the light is travelling, or null when it is not. The direction
  // mirrors the toggle: flipping right sweeps right, flipping back sweeps back,
  // so the light reads as following your hand rather than playing at it.
  const [sweepDir, setSweepDir] = useState<'ltr' | 'rtl' | null>(null)
  const wallRef = useRef<HTMLDivElement>(null)

  /**
   * Delays are measured, not guessed. The wall is a masonry, so DOM order is not
   * visual order — an nth-child stagger would wave diagonally and look like a
   * glitch. Reading each card's real x makes the light and the resolve travel
   * together, in whichever direction the switch just moved.
   */
  const setMode = (nextDrift: boolean) => {
    const dir: 'ltr' | 'rtl' = nextDrift ? 'rtl' : 'ltr'
    const root = wallRef.current
    if (root) {
      const box = root.getBoundingClientRect()
      root.querySelectorAll<HTMLElement>('.gallery > .card').forEach((card) => {
        const r = card.getBoundingClientRect()
        const rel = (r.left + r.width / 2 - box.left) / Math.max(1, box.width)
        const t = dir === 'ltr' ? rel : 1 - rel
        card.style.transitionDelay = `${Math.round(Math.min(1, Math.max(0, t)) * 380)}ms`
      })
    }
    setSweepDir(dir)
    setDrift(nextDrift)
    window.setTimeout(() => setSweepDir(null), 1050)
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
        {/* Chaos → order, in one line each. The mess is COUNTED, because mess is
            what counting feels like; the resolved state is NAMED, because that is
            what having a system feels like. Digits on both sides would invite the
            pedantry of explaining why one of them isn't 1 — and a hero has no
            room to defend a number.

            The nine and the seventeen are real: measured off these very cards, so
            the claim cannot drift from the demo standing under it.

            The sentence names drift as INEVITABLE rather than careless. "Nobody
            decided any of this" pointed at the visitor; drift happens to teams
            who own a design system too, and saying so is both kinder and more
            true — it is the reason a checker has to exist at all. And the answer
            line ANSWERS it: things drift OFF a system, so the fix is putting
            them back ON one. */}
        <div className="mkt__tally">
          <p className="mkt__tally-head">
            {drift ? (
              <><b>9</b> accents <i>·</i> <b>17</b> radii <i>·</i> <b>8</b> shadows</>
            ) : (
              <>One accent <i>·</i> one scale <i>·</i> one shadow</>
            )}
          </p>
          <p className="mkt__tally-body">
            {drift
              ? 'Even with a design system, every build adds drift.'
              : 'Every component back on the system.'}
          </p>
        </div>

        <div className="mkt__switch" role="radiogroup" aria-label="Preview the same components with and without a design system">
          <span className={`mkt__switch-knob${drift ? '' : ' is-right'}`} aria-hidden="true" />
          <button
            type="button"
            role="radio"
            aria-checked={drift}
            className={`mkt__switch-opt${drift ? ' is-on' : ''}`}
            onClick={() => setMode(true)}
          >
            Without UIcockpit
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!drift}
            className={`mkt__switch-opt${drift ? '' : ' is-on'}`}
            onClick={() => setMode(false)}
          >
            With UIcockpit
          </button>
        </div>

        <p className="mkt__resolve-sub">nothing was rewritten — only the system changed</p>
      </div>

      {sweepDir && <span className={`mkt__sweep mkt__sweep--${sweepDir}`} aria-hidden="true" />}
    </div>
  )
}
