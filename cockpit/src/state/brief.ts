import type { Config, ColorTheme, Radius, Scale, IconSet, ButtonShape } from '../tokens/types'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import { applyColorTheme, COLOR_THEMES } from '../tokens/stylesAndThemes'
import { encode } from './hash'

/**
 * Brief → Config → kit hash. The agent-native on-ramp: an LLM (or a plain URL)
 * describes a kit in readable params instead of driving the GUI, and the CDN
 * renders the resulting hash exactly like a human-configured one (the hash IS the
 * config). Every param is validated against the real enums; anything unknown or
 * malformed is IGNORED and falls back to the default, so a rough brief still
 * yields a working, coherent kit — never a broken one.
 */
export interface Brief {
  /** A theme id (cobalt · sky · teal · jade · indigo · violet · coral · rose · ember · mono) OR a #hex. */
  brand?: string
  /** none · subtle · soft · round */
  radius?: string
  /** compact · default · comfortable (interface size + density) */
  density?: string
  /** match · none · subtle · soft · round · pill */
  buttonShape?: string
  /** hairline · line · rounded · bold · solid */
  icons?: string
}

const THEMES = new Set<string>(Object.keys(COLOR_THEMES))
const RADII = new Set<Radius>(['none', 'subtle', 'soft', 'round'])
const SCALES = new Set<Scale>(['compact', 'default', 'comfortable'])
const ICONS = new Set<IconSet>(['hairline', 'line', 'rounded', 'bold', 'solid'])
const SHAPES = new Set<ButtonShape>(['match', 'none', 'subtle', 'soft', 'round', 'pill'])
const HEX = /^#?[0-9a-fA-F]{6}$/

/** Map a readable brief onto the default Config, validating every field. */
export function configFromBrief(b: Brief): Config {
  let cfg: Config = { ...DEFAULT_CONFIG }

  if (b.brand) {
    const t = b.brand.trim().toLowerCase()
    if (THEMES.has(t)) {
      cfg = applyColorTheme(cfg, t as ColorTheme)
    } else if (HEX.test(b.brand.trim())) {
      const hex = b.brand.trim()
      cfg = { ...cfg, cPrimary: hex.startsWith('#') ? hex : `#${hex}`, color: 'tone' }
    }
  }
  if (b.radius && RADII.has(b.radius as Radius)) cfg.radius = b.radius as Radius
  if (b.density && SCALES.has(b.density as Scale)) cfg.scale = b.density as Scale
  if (b.buttonShape && SHAPES.has(b.buttonShape as ButtonShape)) cfg.buttonShape = b.buttonShape as ButtonShape
  if (b.icons && ICONS.has(b.icons as IconSet)) cfg.iconSet = b.icons as IconSet

  return cfg
}

/** The brief → the kit hash (the encoded config; the CDN renders any hash). */
export function briefToHash(b: Brief): string {
  return encode(configFromBrief(b))
}
