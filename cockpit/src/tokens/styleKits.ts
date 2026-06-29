import type { Config } from './types'
import { applyHarmonyPreset } from './harmony'

/**
 * Named style kits — the FRONT-DOOR anchors (the "Style" picker, top of the panel).
 * Pick one; your brand colour rides through unchanged ("Clean + your purple"), then
 * the knobs perturb on top. SUBTLE BY DESIGN (the shadcn lesson): every kit shares
 * ONE coherent base and nudges only a few gentle levers — radius · font · the odd
 * flat · grey tint · heading weight. No kit changes density, goes pill, deepens
 * shadows, or shouts in caps.
 *
 * GROUNDED in the best-in-class coverage test (BEST-IN-CLASS-ANALYSIS.md). The two
 * type-depth knobs added after that test — mono fonts + display weight — are what let
 * the kits separate cleanly (Minimal's mono headings = Vercel; Refined's ultralight =
 * Stripe) instead of collapsing into grey variants. "Clean" mirrors DEFAULT_CONFIG.
 */
export interface StyleKit {
  id: string
  name: string
  blurb: string
  config: Partial<Config>
}

const TONAL = applyHarmonyPreset('tonal')

// The shared base — the constants that keep the family coherent. A kit overrides
// only the few levers that give it character.
const BASE: Partial<Config> = {
  scale: 'default', typeScale: 'md', buttonShape: 'match', labelCase: 'sentence',
  displayWeight: 'semibold', surface: 'outlined', surfaceDepth: 'soft', borders: 'subtle',
  motion: 'smooth', motionTempo: 'normal', motionCurve: 'standard',
  palette: 'vivid', canvas: 'neutral', fill: 'brand', iconSet: 'line', ...TONAL,
}

export const STYLE_KITS: StyleKit[] = [
  {
    id: 'clean', name: 'Clean', blurb: 'Balanced and neutral — the safe default',
    config: { ...BASE, radius: 'soft', fontDisplay: 'Inter', fontBody: 'Inter', neutral: 'auto' },
  },
  {
    id: 'precision', name: 'Precision', blurb: 'Crisp, flat, cool — Linear / Figma',
    config: { ...BASE, radius: 'subtle', fontDisplay: 'Inter', fontBody: 'Inter', neutral: 'cool', surfaceDepth: 'flat' },
  },
  {
    id: 'minimal', name: 'Minimal', blurb: 'Mono headings, stark — Vercel',
    config: { ...BASE, radius: 'subtle', fontDisplay: 'Geist Mono', fontBody: 'Geist', neutral: 'neutral', surfaceDepth: 'flat' },
  },
  {
    id: 'refined', name: 'Refined', blurb: 'Ultralight headlines — Stripe',
    config: { ...BASE, radius: 'soft', fontDisplay: 'Inter', fontBody: 'Inter', neutral: 'cool', displayWeight: 'light', palette: 'pastel' },
  },
  {
    id: 'calm', name: 'Calm', blurb: 'System font, seamless — Notion',
    config: { ...BASE, radius: 'subtle', fontDisplay: 'System', fontBody: 'System', neutral: 'warm', surface: 'plain', palette: 'pastel' },
  },
  {
    id: 'soft', name: 'Soft', blurb: 'Rounded and warm — friendly',
    config: { ...BASE, radius: 'round', fontDisplay: 'Inter', fontBody: 'Inter', neutral: 'warm', surface: 'filled', borders: 'faint' },
  },
  {
    id: 'editorial', name: 'Editorial', blurb: 'Serif headings, calm and warm',
    config: { ...BASE, radius: 'soft', fontDisplay: 'Newsreader', fontBody: 'Inter', neutral: 'warm', surface: 'plain', palette: 'pastel' },
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
