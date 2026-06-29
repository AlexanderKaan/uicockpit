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
  labelCase: 'sentence',       // UI labels as-authored; 'caps' = the industrial/terminal look
  displayWeight: 'semibold',   // headings 600 / hero 700 (the house default); 'light' = ultralight
  fontDisplay: 'Inter',
  fontBody: 'Inter',
  iconSet: 'line',
  // 'soft' = the shadcn/Stripe subtle two-layer shadow on a balanced ramp — the
  // former default combo, unchanged. (Elevation is now shadow-only; 'raised' was
  // a dead duplicate of 'soft' and is retired, old hashes fall back to it.)
  surfaceDepth: 'soft',
  surface: 'outlined',         // box-with-border fields + flush hairline-seam sidebar (= the previous default look)
  borders: 'subtle',
  motion: 'smooth',
  motionTempo: 'normal',
  motionCurve: 'standard',
  // Interaction (H2): the state wash is a fixed house formula — whisper alpha
  // (0.05) on a NEUTRAL source that follows the Neutrals ramp, 0.96 press squish.
  // The States/State-tint AND Springs(motionScheme) dials were removed (knob-cull):
  // the spring physics are fixed to the composed 'standard' sampling in buildTokens.
  cPrimary: '#0A84FF',      // Cobalt — matches COLOR_THEMES.cobalt (keep in sync)
  // Harmony (H1): Tonal is the house default — the M3-TonalSpot recipe (accent
  // = brand + 60°, secondary drifts +15°, neutrals carry the brand tint at 1×).
  // Primary itself never rotates. Values mirror HARMONY_PRESETS.tonal.
  harmony: 'tonal',
  spread: 60,
  expression: 100,
  palette: 'vivid',
  neutral: 'auto',          // greys auto-tint toward the brand hue (Linear/Vercel)
  canvas: 'neutral',        // muted near-white page bg (= the prior --k-bg = nStep(1))
  fill: 'brand',            // subtle brand wash on the summary band (KPI strip etc.)
  mode: 'light',
}

export const CONFIG_VERSION = 1
