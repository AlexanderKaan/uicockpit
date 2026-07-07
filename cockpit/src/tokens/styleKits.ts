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
  // Each kit now owns a SIGNATURE lever no other kit touches, so the seven read
  // as genuinely different systems (not grey variants) at one glance — while the
  // brand colour rides through unchanged. Coupled pairs (dense↔small type,
  // airy↔large type) follow the foundation-coherence rules, so no combo clashes.
  {
    id: 'clean', name: 'Clean', blurb: 'Balanced and neutral — the safe default',
    // The anchor = DEFAULT_CONFIG. Everything else is a deliberate departure from this.
    config: { ...BASE, radius: 'soft', fontDisplay: 'Inter', fontBody: 'Inter', neutral: 'auto' },
  },
  {
    id: 'precision', name: 'Precision', blurb: 'Dense, sharp, cool — Linear',
    // Signature = DENSITY. Compact + small type + defined borders + snappy motion.
    config: { ...BASE, radius: 'subtle', fontDisplay: 'Inter', fontBody: 'Inter', neutral: 'cool', surfaceDepth: 'flat', scale: 'compact', typeScale: 'sm', borders: 'medium', motion: 'snappy', motionTempo: 'snappy' },
  },
  {
    id: 'minimal', name: 'Minimal', blurb: 'Square, mono, stark — Vercel',
    // Signature = SQUARE + CAPS. radius:none + mono display + uppercase labels.
    config: { ...BASE, radius: 'none', fontDisplay: 'Geist Mono', fontBody: 'Geist', neutral: 'neutral', surfaceDepth: 'flat', labelCase: 'caps' },
  },
  {
    id: 'refined', name: 'Refined', blurb: 'Airy, ultralight, pill buttons — Stripe',
    // Signature = PILL BUTTONS + AIR. Ultralight headings, comfortable density, pastel.
    config: { ...BASE, radius: 'soft', fontDisplay: 'Inter', fontBody: 'Inter', neutral: 'cool', displayWeight: 'light', palette: 'pastel', buttonShape: 'pill', scale: 'comfortable', typeScale: 'lg' },
  },
  {
    id: 'calm', name: 'Calm', blurb: 'Borderless, system font — Notion',
    // Signature = QUIET. Plain (seamless) surface, faint borders, hairline icons, system font.
    config: { ...BASE, radius: 'subtle', fontDisplay: 'System', fontBody: 'System', neutral: 'warm', surface: 'plain', palette: 'pastel', borders: 'faint', iconSet: 'hairline' },
  },
  {
    id: 'soft', name: 'Soft', blurb: 'Rounded, bold, playful — friendly',
    // Signature = CHUNKY. Round radius, filled surface, bold headings, rounded icons, playful motion.
    config: { ...BASE, radius: 'round', fontDisplay: 'Inter', fontBody: 'Inter', neutral: 'warm', surface: 'filled', displayWeight: 'bold', iconSet: 'rounded', motion: 'playful', motionCurve: 'spring' },
  },
  {
    id: 'editorial', name: 'Editorial', blurb: 'Serif, spacious, literary',
    // Signature = SERIF + SPACE. Serif at regular weight, large type, comfortable density.
    config: { ...BASE, radius: 'soft', fontDisplay: 'Newsreader', fontBody: 'Inter', neutral: 'warm', surface: 'plain', palette: 'pastel', displayWeight: 'regular', typeScale: 'lg', scale: 'comfortable' },
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
