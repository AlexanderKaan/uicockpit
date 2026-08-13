import { useMemo, useState, type CSSProperties } from 'react'
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
        className={`cockpit-preview mkt__bouquet${drift ? ' mkt__bouquet--drift' : ''}`}
        style={SYSTEM_VARS}
        role="region"
        aria-label={drift
          ? 'The same components without a design system — inconsistent on purpose'
          : 'The same components on one design system'}
      >
        {gallery}
      </div>

      {/* The conversion. Sits over the wall because the wall IS the argument —
          you should not have to scroll to find the thing that fixes it. */}
      <div className={`mkt__resolve${drift ? '' : ' is-done'}`}>
        {drift ? (
          <>
            <p className="mkt__resolve-lead">
              34 components. No system. <b>Sound familiar?</b>
            </p>
            <button
              type="button"
              className="mkt__resolve-btn"
              onClick={() => setDrift(false)}
            >
              Put it on one system
            </button>
            <p className="mkt__resolve-sub">one click · nothing else changes</p>
          </>
        ) : (
          <button
            type="button"
            className="mkt__resolve-again"
            onClick={() => setDrift(true)}
          >
            ↺ Show me the drift again
          </button>
        )}
      </div>
    </div>
  )
}
