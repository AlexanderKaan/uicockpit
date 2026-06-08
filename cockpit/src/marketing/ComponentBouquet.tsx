import { useMemo, useState, type CSSProperties } from 'react'
import { IconProvider } from '../icons/Icon'
import { ComponentGallery } from '../stage/views/ComponentGallery'
import { buildTokens } from '../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import { applyColorTheme, COLOR_THEMES } from '../tokens/stylesAndThemes'
import type { ColorTheme } from '../tokens/types'

/**
 * Hero "bouquet" — the REAL <ComponentGallery/> (the exact wall the configurator
 * shows) rendered full-bleed behind the landing, wearing a UIcockpit brand colour.
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
const SWITCH_THEMES: ColorTheme[] = ['cobalt', 'sky', 'jade', 'violet', 'ember', 'rose', 'mono']
const BASE = DEFAULT_CONFIG

/* Pre-bake the --k-* var set for every switchable theme — pure, computed once at
 * module load — so clicking a swatch is just a style swap (no token recompute). */
const THEME_VARS: Record<string, CSSProperties> = Object.fromEntries(
  SWITCH_THEMES.map((t) => [t, buildTokens(applyColorTheme(BASE, t)).vars as CSSProperties]),
)

export function ComponentBouquet() {
  const [theme, setTheme] = useState<ColorTheme>('cobalt')

  // Mount the gallery ONCE. Memoised, so switching themes re-tints via the
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
        className="cockpit-preview mkt__bouquet"
        style={THEME_VARS[theme]}
        data-chrome={BASE.chrome}
        role="region"
        aria-label="Interactive component preview — try the controls, then re-tint with the brand colours below"
      >
        {gallery}
      </div>

      {/* Colour switcher sits BELOW the wall — the wall dissolves into it, and
          it's out of the busy CTA zone up top. */}
      <div className="mkt__theme-switch" role="radiogroup" aria-label="Preview a brand colour">
        <span className="mkt__theme-switch-label">Brand colour</span>
        {SWITCH_THEMES.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={t === theme}
            aria-label={t}
            className={`mkt__theme-dot${t === theme ? ' is-on' : ''}`}
            style={{ background: COLOR_THEMES[t].cPrimary }}
            onClick={() => setTheme(t)}
          />
        ))}
      </div>
    </div>
  )
}
