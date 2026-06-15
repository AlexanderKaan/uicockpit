import type { Config, ColorTheme, Harmony } from '../tokens/types'
import { applyColorTheme } from '../tokens/stylesAndThemes'
import { HARMONY_PRESETS } from '../tokens/harmony'
import { ALL_FONTS, SERIF_FONTS, SYSTEM_FONT } from '../tokens/fonts'

/* "Surprise me" (C4) — a guardrail-aware random kit. GUARDRAILS:
 *  - Colour comes from a vetted chromatic theme, and buildTokens clamps every
 *    derived colour to WCAG-AA regardless, so a random kit is ALWAYS legible.
 *  - Every other facet is picked from its enumerated, valid value set.
 *  - The user's light/dark mode is preserved (randomizing it is jarring).
 * Result: a fresh, usable, shareable kit on every roll — never a broken one. */

const pick = <T>(arr: readonly T[], rnd: () => number): T => arr[Math.floor(rnd() * arr.length)]!

const CHROMATIC_THEMES: readonly ColorTheme[] = ['cobalt', 'sky', 'teal', 'jade', 'ember', 'coral', 'indigo', 'violet', 'rose']
const SCALES = ['compact', 'default', 'comfortable'] as const
const RADII = ['none', 'subtle', 'soft', 'round'] as const
const BTN_SHAPES = ['match', 'none', 'subtle', 'soft', 'round', 'pill'] as const
const TYPE_SCALES = ['sm', 'md', 'lg', 'xl'] as const
const ICON_SETS = ['hairline', 'line', 'rounded', 'bold', 'solid'] as const
const SURFACE_DEPTHS = ['flat', 'soft', 'deep'] as const
const SURFACES = ['outlined', 'filled', 'plain'] as const
const BORDERS = ['faint', 'subtle', 'medium', 'strong'] as const
const MOTIONS = ['snappy', 'smooth', 'playful'] as const // skip 'none' — a roll should feel alive
const TEMPOS = ['snappy', 'normal', 'generous'] as const
const CURVES = ['standard', 'emphasized', 'spring'] as const
const PALETTES = ['pastel', 'vivid', 'bright'] as const
const MOTION_SCHEMES = ['standard', 'expressive'] as const
const NEUTRALS = ['auto', 'cool', 'neutral', 'warm'] as const
// Harmony rolls a vetted PRESET (never random raw slider values) — each preset
// is a curated (spread, expression) pair, so the family always reads deliberate.
const HARMONIES = ['mono', 'tonal', 'complement', 'expressive'] as const satisfies readonly Exclude<Harmony, 'custom'>[]
/* Shape Lab (H5) — mirror the panel's SIG_PRESETS (petal/burst/star/pebble). */
const SIGNATURES = [
  { shapePoints: 8, shapeDepth: 0.12, shapeSoft: 0.8, shapeJitter: 0 },
  { shapePoints: 12, shapeDepth: 0.5, shapeSoft: 0.3, shapeJitter: 0 },
  { shapePoints: 5, shapeDepth: 0.5, shapeSoft: 0.1, shapeJitter: 0 },
  { shapePoints: 7, shapeDepth: 0.05, shapeSoft: 1, shapeJitter: 0.45 },
] as const

export function randomKit(current: Config, rnd: () => number = Math.random): Config {
  const bodyFonts = ALL_FONTS.filter((f) => f !== SYSTEM_FONT && !SERIF_FONTS.includes(f)) // body = sans only
  const displayFonts = ALL_FONTS.filter((f) => f !== SYSTEM_FONT) // display may be serif
  const themed = applyColorTheme(current, pick(CHROMATIC_THEMES, rnd)) // sets cPrimary + colorTheme + color:'tone'
  const harmony = pick(HARMONIES, rnd)
  return {
    ...themed,
    harmony,
    ...HARMONY_PRESETS[harmony],
    scale: pick(SCALES, rnd),
    radius: pick(RADII, rnd),
    buttonShape: pick(BTN_SHAPES, rnd),
    typeScale: pick(TYPE_SCALES, rnd),
    fontDisplay: pick(displayFonts, rnd),
    fontBody: pick(bodyFonts, rnd),
    iconSet: pick(ICON_SETS, rnd),
    surfaceDepth: pick(SURFACE_DEPTHS, rnd),
    surface: pick(SURFACES, rnd),
    borders: pick(BORDERS, rnd),
    motion: pick(MOTIONS, rnd),
    motionTempo: pick(TEMPOS, rnd),
    motionCurve: pick(CURVES, rnd),
    motionScheme: pick(MOTION_SCHEMES, rnd),
    palette: pick(PALETTES, rnd),
    neutral: pick(NEUTRALS, rnd),
    // Shape Lab (H5) — roll one of the curated signature presets (the same
    // four the panel offers); free-dial chaos stays a deliberate user act.
    ...pick(SIGNATURES, rnd),
    mode: current.mode, // preserve light/dark — don't jar the user
  }
}
