import type { Config } from './types'

// The ONE curated default — our opinionated "house style" (no Style presets;
// every facet is an individual control). Tune these for the best out-of-box look.
// C1: new visitors land on a CHROMATIC kit (Cobalt), never greyscale — the first
// impression must read "designed", not "blank template". Mono is still one click
// away in the Brand flyout as the neutral reset/baseline.
export const DEFAULT_CONFIG: Config = {
  colorTheme: 'cobalt',        // friendly Apple system blue (#0A84FF) — the always-works brand
  color: 'tone',               // chromatic mode (brand hue drives primary/links/focus + auto-tints neutrals)
  radius: 'soft',
  buttonShape: 'match',        // follow the box radius by default (unified look)
  scale: 'default',            // size + presence macro (drives ui-weight too)
  typeScale: 'md',
  fontDisplay: 'Inter',
  fontBody: 'Inter',
  iconSet: 'line',
  // 'raised' resolves to the former default combo (balanced ramp · subtle
  // borders · layered chrome · soft shadow), so the default look is unchanged.
  surfaceDepth: 'raised',
  surface: 'outlined',         // box-with-border fields + flush hairline-seam sidebar (= the previous default look)
  borders: 'subtle',
  motion: 'smooth',
  motionTempo: 'normal',
  motionCurve: 'standard',
  // Interaction (H2): the state wash is now a fixed house formula — whisper
  // alpha (0.05) on a NEUTRAL source that follows the Neutrals ramp, 0.96 press
  // squish. The former States/State-tint dials were removed (every benchmark
  // bakes one subtle neutral wash; neither knob earns its place). Springs stay.
  motionScheme: 'standard',
  cPrimary: '#0A84FF',      // Cobalt — matches COLOR_THEMES.cobalt (keep in sync)
  // Harmony (H1): Tonal is the house default — the M3-TonalSpot recipe (accent
  // = brand + 60°, secondary drifts +15°, neutrals carry the brand tint at 1×).
  // Primary itself never rotates. Values mirror HARMONY_PRESETS.tonal.
  harmony: 'tonal',
  spread: 60,
  expression: 100,
  // Shape Lab (H5): the house signature — an 8-point softened "flower"
  // (squircle-petal read, the friendly M3-adjacent default). Jitter 0: the
  // organic wobble is an explicit opt-in, never the default voice.
  shapePoints: 8,
  shapeDepth: 0.12,
  shapeSoft: 0.8,
  shapeJitter: 0,
  palette: 'vivid',
  neutral: 'auto',          // greys auto-tint toward the brand hue (Linear/Vercel)
  canvas: 'neutral',        // muted near-white page bg (= the prior --k-bg = nStep(1))
  fill: 'brand',            // subtle brand wash on the summary band (KPI strip etc.)
  mode: 'light',
}

export const CONFIG_VERSION = 1
