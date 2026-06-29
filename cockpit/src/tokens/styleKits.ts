import type { Config } from './types'
import { applyHarmonyPreset } from './harmony'

/**
 * Named style kits — the FRONT-DOOR anchors (the "Style" picker, top of the panel).
 * Each kit is a curated, coherent STARTING POINT: it sets the structure + type +
 * colour-character, but NEVER the brand hue (colorTheme / cPrimary / color). You pick
 * a kit, your brand colour rides through unchanged ("Clean + your purple"), and the
 * individual knobs perturb on top — the coherence guards (Scale×Text, surface
 * separation) keep every perturbation whole.
 *
 * The strategic edge over shadcn's radius+colour themes: ours vary radius + button
 * shape + density + type character + label case + surface language + motion → genuinely
 * distinct signatures, not recolours. "Clean" mirrors DEFAULT_CONFIG exactly, so the
 * out-of-box kit reads as a named style, not "Custom".
 */
export interface StyleKit {
  id: string
  name: string
  blurb: string
  config: Partial<Config>
}

// All kits share Tonal harmony (keeps the brand hue front-and-centre; never Mono,
// which would grey out the user's colour).
const TONAL = applyHarmonyPreset('tonal')

export const STYLE_KITS: StyleKit[] = [
  {
    id: 'clean',
    name: 'Clean',
    blurb: 'Trustworthy SaaS default — Linear / shadcn',
    config: {
      radius: 'soft', buttonShape: 'match', scale: 'default', typeScale: 'md', labelCase: 'sentence',
      fontDisplay: 'Inter', fontBody: 'Inter', iconSet: 'line',
      surfaceDepth: 'soft', surface: 'outlined', borders: 'subtle',
      motion: 'smooth', motionTempo: 'normal', motionCurve: 'standard',
      palette: 'vivid', neutral: 'auto', canvas: 'neutral', fill: 'brand', ...TONAL,
    },
  },
  {
    id: 'soft',
    name: 'Soft',
    blurb: 'Friendly & rounded — Airbnb warmth',
    config: {
      radius: 'round', buttonShape: 'pill', scale: 'comfortable', typeScale: 'md', labelCase: 'sentence',
      fontDisplay: 'Figtree', fontBody: 'Figtree', iconSet: 'rounded',
      surfaceDepth: 'deep', surface: 'filled', borders: 'faint',
      motion: 'playful', motionTempo: 'generous', motionCurve: 'spring',
      palette: 'vivid', neutral: 'warm', canvas: 'neutral', fill: 'brand', ...TONAL,
    },
  },
  {
    id: 'sharp',
    name: 'Sharp',
    blurb: 'Technical precision — Vercel / dev-tool',
    config: {
      radius: 'none', buttonShape: 'match', scale: 'compact', typeScale: 'sm', labelCase: 'sentence',
      fontDisplay: 'Geist', fontBody: 'Geist', iconSet: 'line',
      surfaceDepth: 'flat', surface: 'outlined', borders: 'medium',
      motion: 'snappy', motionTempo: 'snappy', motionCurve: 'standard',
      palette: 'bright', neutral: 'cool', canvas: 'white', fill: 'neutral', ...TONAL,
    },
  },
  {
    id: 'editorial',
    name: 'Editorial',
    blurb: 'Serif headings, generous — Stripe-press',
    config: {
      radius: 'subtle', buttonShape: 'match', scale: 'comfortable', typeScale: 'lg', labelCase: 'sentence',
      fontDisplay: 'Fraunces', fontBody: 'Inter', iconSet: 'line',
      surfaceDepth: 'flat', surface: 'plain', borders: 'subtle',
      motion: 'smooth', motionTempo: 'normal', motionCurve: 'standard',
      palette: 'pastel', neutral: 'warm', canvas: 'neutral', fill: 'brand', ...TONAL,
    },
  },
  {
    id: 'industrial',
    name: 'Industrial',
    blurb: 'Uppercase labels, hard edges — terminal',
    config: {
      radius: 'none', buttonShape: 'match', scale: 'default', typeScale: 'md', labelCase: 'caps',
      fontDisplay: 'IBM Plex Sans', fontBody: 'IBM Plex Sans', iconSet: 'bold',
      surfaceDepth: 'flat', surface: 'outlined', borders: 'strong',
      motion: 'snappy', motionTempo: 'snappy', motionCurve: 'standard',
      palette: 'bright', neutral: 'neutral', canvas: 'white', fill: 'neutral', ...TONAL,
    },
  },
]

/** The id of the kit the current config matches exactly (on the fields the kit sets),
 *  or null = "Custom" (the user has perturbed a knob off the anchor). */
export function activeKitId(cfg: Config): string | null {
  for (const kit of STYLE_KITS) {
    const matches = Object.entries(kit.config).every(([k, v]) => (cfg as unknown as Record<string, unknown>)[k] === v)
    if (matches) return kit.id
  }
  return null
}
