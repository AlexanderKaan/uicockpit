import type { Config } from './types'

// The ONE curated default — our opinionated "house style" (no Style presets;
// every facet is an individual control). Tune these for the best out-of-box look.
export const DEFAULT_CONFIG: Config = {
  colorTheme: 'mono',          // greyscale default (no chroma)
  color: 'mono',
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
  chrome: 'flush',             // sidebar flows with the page + hairline (Linear/Vercel)
  borders: 'subtle',
  motion: 'smooth',
  motionTempo: 'normal',
  motionCurve: 'standard',
  cPrimary: '#3b3b42',
  palette: 'vivid',
  neutral: 'auto',          // greys auto-tint toward the brand hue (Linear/Vercel)
  mode: 'light',
}

export const CONFIG_VERSION = 1
