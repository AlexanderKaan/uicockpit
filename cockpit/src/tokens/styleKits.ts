import type { Config } from './types'
import { applyHarmonyPreset } from './harmony'

/**
 * Named style kits — the FRONT-DOOR anchors (the "Style" picker, top of the panel).
 * Each kit is a curated STARTING POINT; pick one, your brand colour rides through
 * unchanged ("Clean + your purple"), then the knobs perturb on top.
 *
 * SUBTLE BY DESIGN (the shadcn lesson). Every kit shares ONE coherent base — same
 * density (Scale default), same button shape (match), same surface language
 * (outlined), same soft elevation, same accent treatment. A kit only nudges a few
 * gentle levers: RADIUS, FONT, the odd flat/border shift, and the grey TINT. No kit
 * changes density, goes pill, deepens shadows, or shouts in caps — those dramatic
 * swings made every kit a different product instead of the same one, restyled.
 * "Clean" mirrors DEFAULT_CONFIG exactly, so the out-of-box kit reads as a style.
 */
export interface StyleKit {
  id: string
  name: string
  blurb: string
  config: Partial<Config>
}

// The shared base every kit starts from — the constants that keep the family
// coherent. A kit overrides only the few levers that give it character.
const TONAL = applyHarmonyPreset('tonal')
const BASE: Partial<Config> = {
  scale: 'default', typeScale: 'md', buttonShape: 'match', labelCase: 'sentence',
  surface: 'outlined', motion: 'smooth', motionTempo: 'normal', motionCurve: 'standard',
  palette: 'vivid', canvas: 'neutral', fill: 'brand', iconSet: 'line',
  surfaceDepth: 'soft', borders: 'subtle', ...TONAL,
}

export const STYLE_KITS: StyleKit[] = [
  {
    id: 'clean',
    name: 'Clean',
    blurb: 'Balanced and neutral — the safe default',
    config: { ...BASE, radius: 'soft', fontDisplay: 'Inter', fontBody: 'Inter', neutral: 'auto' },
  },
  {
    id: 'soft',
    name: 'Soft',
    blurb: 'Rounder corners, warmer greys',
    config: { ...BASE, radius: 'round', fontDisplay: 'Inter', fontBody: 'Inter', neutral: 'warm' },
  },
  {
    id: 'sharp',
    name: 'Sharp',
    blurb: 'Crisp edges, technical grotesk',
    config: { ...BASE, radius: 'none', fontDisplay: 'Geist', fontBody: 'Geist', neutral: 'cool', surfaceDepth: 'flat' },
  },
  {
    id: 'editorial',
    name: 'Editorial',
    blurb: 'Serif headings, calm and warm',
    config: { ...BASE, radius: 'soft', fontDisplay: 'Newsreader', fontBody: 'Inter', neutral: 'warm' },
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
