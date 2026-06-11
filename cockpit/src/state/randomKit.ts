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
const SURFACE_DEPTHS = ['flat', 'soft', 'raised', 'layered'] as const
const SURFACES = ['outlined', 'filled', 'plain'] as const
const BORDERS = ['faint', 'subtle', 'medium', 'strong'] as const
const MOTIONS = ['snappy', 'smooth', 'playful'] as const // skip 'none' — a roll should feel alive
const TEMPOS = ['snappy', 'normal', 'generous'] as const
const CURVES = ['standard', 'emphasized', 'spring'] as const
const PALETTES = ['pastel', 'vivid', 'bright'] as const
const NEUTRALS = ['auto', 'cool', 'neutral', 'warm'] as const
// Harmony rolls a vetted PRESET (never random raw slider values) — each preset
// is a curated (spread, expression) pair, so the family always reads deliberate.
const HARMONIES = ['mono', 'tonal', 'complement', 'expressive'] as const satisfies readonly Exclude<Harmony, 'custom'>[]

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
    palette: pick(PALETTES, rnd),
    neutral: pick(NEUTRALS, rnd),
    mode: current.mode, // preserve light/dark — don't jar the user
  }
}
