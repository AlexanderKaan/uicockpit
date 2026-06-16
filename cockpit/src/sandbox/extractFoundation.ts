/* Sandbox · Slice 0 — the foundation extractor (the only net-new risk).
 *
 * Pure: (cssText) → a partial UICockpit Config + a per-facet confidence flag.
 * Reads a stylesheet / @theme / :root block STATICALLY by regex — it NEVER
 * executes user code (a tailwind.config.js is arbitrary JS; we only ever scan
 * its compiled CSS or the v4 @theme/:root text). Dependency-free on purpose.
 *
 * Honesty principle (the reason Model A works): reliability is concentrated where
 * it matters. Brand colour / radius / font / type-size extract cleanly; density /
 * neutrals / elevation are best-effort and flagged 'low'; anything we can't read
 * is simply omitted so the cockpit's own default fills it. Better a gap than a
 * confident wrong guess. */

import type { Config, ColorTheme } from '../tokens/types'
import { hexToHsl, oklchStrToHex } from '../tokens/color'
import { COLOR_THEMES } from '../tokens/stylesAndThemes'

export type Facet = 'brand' | 'neutral' | 'radius' | 'font' | 'density' | 'elevation' | 'typeSize'
export type Confidence = 'high' | 'low' | 'none'

export interface Extraction {
  config: Partial<Config>
  confidence: Record<Facet, Confidence>
  /** Human-readable trace — what the extractor saw & decided. For the dogfood
   *  harness (and later, the "we read your app" UI). */
  notes: string[]
}

/* ── colour parsing — any CSS colour token → {h,s,l} (or null) ───────────── */
type HSL = { h: number; s: number; l: number }

function clampByte(n: number): number { return Math.max(0, Math.min(255, Math.round(n))) }
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('')
}

/** Parse one colour literal (hex / rgb() / hsl() / oklch()) into HSL. */
export function parseColor(token: string): HSL | null {
  const t = token.trim().toLowerCase()
  try {
    if (t.startsWith('#')) {
      const [h, s, l] = hexToHsl(t)
      return { h, s, l }
    }
    if (t.startsWith('rgb')) {
      const nums = t.slice(t.indexOf('(') + 1, t.lastIndexOf(')')).split(/[\s,/]+/).filter(Boolean)
      const r = parseFloat(nums[0]!), g = parseFloat(nums[1]!), b = parseFloat(nums[2]!)
      if ([r, g, b].some(Number.isNaN)) return null
      const [hh, ss, ll] = hexToHsl(rgbToHex(r, g, b))
      return { h: hh, s: ss, l: ll }
    }
    if (t.startsWith('hsl')) {
      const nums = t.slice(t.indexOf('(') + 1, t.lastIndexOf(')')).split(/[\s,/]+/).filter(Boolean)
      const h = parseFloat(nums[0]!)
      const s = parseFloat(nums[1]!) // expects %
      const l = parseFloat(nums[2]!)
      if ([h, s, l].some(Number.isNaN)) return null
      return { h: ((h % 360) + 360) % 360, s, l }
    }
    if (t.startsWith('oklch')) {
      const hex = oklchStrToHex(t)
      const [h, s, l] = hexToHsl(hex)
      return { h, s, l }
    }
  } catch {
    return null
  }
  return null
}

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)/g
const DECL_RE = /--([\w-]+)\s*:\s*([^;}]+)[;}]/g

/** Circular hue distance (0..180). */
function hueDist(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360)
  return d > 180 ? 360 - d : d
}

/** Snap a brand HSL to the nearest chromatic ColorTheme by hue. */
const THEME_HUES: Array<{ id: ColorTheme; h: number }> = (Object.keys(COLOR_THEMES) as ColorTheme[])
  .filter((id) => id !== 'mono')
  .map((id) => { const [h] = hexToHsl(COLOR_THEMES[id].cPrimary); return { id, h } })

export function nearestTheme(h: number): ColorTheme {
  let best = THEME_HUES[0]!
  for (const t of THEME_HUES) if (hueDist(h, t.h) < hueDist(h, best.h)) best = t
  return best.id
}

/* ── the extractor ──────────────────────────────────────────────────────── */
export function extractFoundation(cssText: string): Extraction {
  const css = cssText
  const config: Partial<Config> = {}
  const confidence: Record<Facet, Confidence> = {
    brand: 'none', neutral: 'none', radius: 'none', font: 'none', density: 'none', elevation: 'none', typeSize: 'none',
  }
  const notes: string[] = []

  // All custom-prop declarations (name → raw value), for semantic lookups.
  const decls: Array<{ name: string; value: string }> = []
  for (const m of css.matchAll(DECL_RE)) decls.push({ name: m[1]!.toLowerCase(), value: m[2]!.trim() })

  /* ---- BRAND COLOUR ---------------------------------------------------- */
  // 1) Prefer an explicit semantic token. Priority: primary/brand > accent > ring.
  const BRAND_NAME = /(^|-)(primary|brand)($|-)/
  const ACCENT_NAME = /(^|-)(accent|ring|theme)($|-)/
  // A real brand colour is a saturated MID-TONE. A token literally named
  // `--color-primary` is often a near-WHITE tint (e.g. Stripe `#f5f5ff`, a
  // `primary-50` surface) — the dogfood run snapped those to a theme at HIGH
  // confidence, the worst kind of wrong. So a named candidate must clear this
  // gate; otherwise we keep scanning (then fall through to frequency).
  const isBrandable = (c: HSL): boolean => c.s >= 16 && c.l >= 16 && c.l <= 84
  const namedColor = (pred: RegExp): HSL | null => {
    for (const d of decls) {
      if (!pred.test(d.name)) continue
      const tok = d.value.match(COLOR_RE)?.[0]
      let hsl = tok ? parseColor(tok) : null
      // shadcn often stores raw "H S% L%" without hsl() — try that too.
      if (!hsl) {
        const triplet = d.value.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/)
        if (triplet) hsl = { h: +triplet[1]!, s: +triplet[2]!, l: +triplet[3]! }
      }
      if (hsl && isBrandable(hsl)) return hsl // skip near-white/black/grey tints
    }
    return null
  }

  let brand: HSL | null = namedColor(BRAND_NAME) ?? namedColor(ACCENT_NAME)
  if (brand && brand.s >= 12) {
    confidence.brand = 'high'
    notes.push(`brand: semantic token → hsl(${brand.h.toFixed(0)} ${brand.s.toFixed(0)}% ${brand.l.toFixed(0)}%)`)
  } else {
    // 2) Frequency fallback: the most-used CHROMATIC colour in the file.
    const freq = new Map<string, { hsl: HSL; n: number }>()
    for (const m of css.matchAll(COLOR_RE)) {
      const hsl = parseColor(m[0]!)
      if (!hsl) continue
      if (hsl.s < 22 || hsl.l < 12 || hsl.l > 92) continue // skip greys / near-black/white
      const key = `${Math.round(hsl.h / 8)}-${Math.round(hsl.s / 10)}` // coarse bucket
      const e = freq.get(key)
      if (e) e.n++; else freq.set(key, { hsl, n: 1 })
    }
    const top = [...freq.values()].sort((a, b) => b.n - a.n)[0]
    if (top) {
      brand = top.hsl
      confidence.brand = 'low'
      notes.push(`brand: most-frequent chromatic colour (×${top.n}) → hsl(${brand.h.toFixed(0)} ${brand.s.toFixed(0)}%)`)
    }
  }

  if (brand && brand.s >= 12) {
    const theme = nearestTheme(brand.h)
    config.color = 'tone'
    config.colorTheme = theme
    config.cPrimary = hslToHexLocal(brand.h, brand.s, brand.l)
    notes.push(`  ↳ snapped to ColorTheme '${theme}', cPrimary ${config.cPrimary}`)
  } else {
    config.color = 'mono'
    config.colorTheme = 'mono'
    if (confidence.brand === 'none') { confidence.brand = 'low'; notes.push('brand: no chromatic colour found → mono') }
  }

  /* ---- NEUTRALS TEMPERATURE -------------------------------------------- */
  // Average hue of the low-saturation (grey) colours.
  const greys: number[] = []
  for (const m of css.matchAll(COLOR_RE)) {
    const hsl = parseColor(m[0]!)
    if (hsl && hsl.s > 0 && hsl.s < 12 && hsl.l > 6 && hsl.l < 96) greys.push(hsl.h)
  }
  if (greys.length >= 3) {
    const avg = circularMean(greys)
    const temp: Config['neutral'] = (avg >= 20 && avg <= 80) ? 'warm' : (avg >= 190 && avg <= 270) ? 'cool' : 'neutral'
    config.neutral = temp
    confidence.neutral = 'low'
    notes.push(`neutral: ${greys.length} greys, avg hue ${avg.toFixed(0)} → '${temp}'`)
  }

  /* ---- RADIUS ---------------------------------------------------------- */
  const radii: number[] = []
  for (const m of css.matchAll(/border-radius\s*:\s*([^;}]+)[;}]/g)) radii.push(...pxValues(m[1]!))
  for (const d of decls) if (/(^|-)(radius|rounded)($|-)/.test(d.name)) radii.push(...pxValues(d.value))
  const nz = radii.filter((r) => r > 0 && r < 60)
  if (radii.length) {
    const r = nz.length ? median(nz) : 0
    const bucket: Config['radius'] = r === 0 ? 'none' : r <= 5 ? 'subtle' : r <= 12 ? 'soft' : 'round'
    config.radius = bucket
    confidence.radius = 'high'
    notes.push(`radius: ${radii.length} values, median nonzero ${r.toFixed(0)}px → '${bucket}'`)
  }

  /* ---- FONT ------------------------------------------------------------ */
  // Pick by FREQUENCY, not first-seen: a big site's first font-family is often a
  // code-block mono (Vercel grabbed 'Roboto Mono'); the body face is the one used
  // most. Count concrete families, the most common wins display+body.
  const famFreq = new Map<string, number>()
  const addFam = (f?: string) => { if (f) famFreq.set(f, (famFreq.get(f) ?? 0) + 1) }
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)[;}]/g)) addFam(firstConcreteFamily(m[1]!))
  for (const d of decls) if (/(^|-)font($|-)/.test(d.name)) addFam(firstConcreteFamily(d.value))
  const ranked = [...famFreq.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0])
  if (ranked.length) {
    config.fontDisplay = ranked[0]
    config.fontBody = ranked[0] // no reliable display↔body split from CSS; use the dominant face for both
    confidence.font = 'high'
    notes.push(`font: '${ranked[0]}' (×${famFreq.get(ranked[0]!)}${ranked[1] ? `, also '${ranked[1]}'` : ''})`)
  }

  /* ---- TYPE SIZE ------------------------------------------------------- */
  // Base body size: prefer html/body/:root font-size, else the modal text size.
  const baseSize = bodyFontSize(css)
  if (baseSize) {
    const ts: Config['typeScale'] = baseSize <= 13 ? 'sm' : baseSize <= 15 ? 'md' : baseSize <= 17 ? 'lg' : 'xl'
    config.typeScale = ts
    confidence.typeSize = 'high'
    notes.push(`typeSize: base ${baseSize}px → '${ts}'`)
  }

  /* ---- DENSITY (best-effort) ------------------------------------------ */
  const heights: number[] = []
  for (const m of css.matchAll(/(?:height|min-height)\s*:\s*([0-9.]+)(px|rem)\b/g)) {
    const v = m[2] === 'rem' ? parseFloat(m[1]!) * 16 : parseFloat(m[1]!)
    if (v >= 28 && v <= 52) heights.push(v) // plausible control heights
  }
  if (heights.length >= 2) {
    const h = median(heights)
    const sc: Config['scale'] = h < 34 ? 'compact' : h > 38 ? 'comfortable' : 'default'
    config.scale = sc
    confidence.density = 'low'
    notes.push(`density: ${heights.length} control-ish heights, median ${h.toFixed(0)}px → '${sc}'`)
  }

  /* ---- ELEVATION (best-effort) ---------------------------------------- */
  const shadows = [...css.matchAll(/box-shadow\s*:\s*([^;}]+)[;}]/g)].map((m) => m[1]!.trim().toLowerCase())
  const real = shadows.filter((s) => s && s !== 'none')
  if (shadows.length) {
    // strongest blur radius seen (3rd length in the shadow) → depth
    const blur = Math.max(0, ...real.map(maxBlur))
    const dep: Config['surfaceDepth'] = real.length === 0 ? 'flat' : blur >= 12 ? 'deep' : 'soft'
    config.surfaceDepth = dep
    confidence.elevation = 'low'
    notes.push(`elevation: ${real.length}/${shadows.length} real shadows, max blur ${blur}px → '${dep}'`)
  }

  return { config, confidence, notes }
}

/* ── small helpers ──────────────────────────────────────────────────────── */
export function hslToHexLocal(h: number, s: number, l: number): string {
  // local HSL→hex (avoid importing the token-emitting hsl()); standard formula.
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return clampByte(255 * c)
  }
  return rgbToHex(f(0), f(8), f(4))
}
function pxValues(s: string): number[] {
  const out: number[] = []
  for (const m of s.matchAll(/([0-9.]+)(px|rem)\b/g)) out.push(m[2] === 'rem' ? parseFloat(m[1]!) * 16 : parseFloat(m[1]!))
  if (/\b9999px|50%|999px\b/.test(s)) out.push(999) // pill
  return out
}
function median(a: number[]): number {
  const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}
function circularMean(degs: number[]): number {
  const x = degs.reduce((a, d) => a + Math.cos((d * Math.PI) / 180), 0)
  const y = degs.reduce((a, d) => a + Math.sin((d * Math.PI) / 180), 0)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}
function firstConcreteFamily(decl: string): string | undefined {
  const first = decl.split(',')[0]!.trim().replace(/^["']|["']$/g, '')
  const generic = /^(sans-serif|serif|monospace|system-ui|ui-sans-serif|ui-serif|ui-monospace|-apple-system|blinkmacsystemfont|inherit|initial|unset|var\()/i
  if (!first) return undefined
  if (/[<>(){}]/.test(first)) return undefined                       // placeholders / interpolation (Tailwind's "<value>")
  if (/^[\d.]/.test(first) || /(rem|px|em|%|vh|vw|pt|ex|ch)$/i.test(first)) return undefined // a font-SIZE leaked from --font-size-*
  if (/^(normal|bold|bolder|lighter|italic|oblique|\d{2,3})$/i.test(first)) return undefined // a font-WEIGHT/style leaked from --font-weight-*
  if (generic.test(first)) return undefined
  return first
}
function bodyFontSize(css: string): number | undefined {
  const m = css.match(/(?:^|[\s,])(?:html|body|:root)\b[^{]*\{[^}]*font-size\s*:\s*([0-9.]+)(px|rem)/i)
  if (m) return m[2] === 'rem' ? parseFloat(m[1]!) * 16 : parseFloat(m[1]!)
  // else: most common font-size in body-text range
  const sizes: number[] = []
  for (const mm of css.matchAll(/font-size\s*:\s*([0-9.]+)(px|rem)\b/g)) {
    const v = mm[2] === 'rem' ? parseFloat(mm[1]!) * 16 : parseFloat(mm[1]!)
    if (v >= 12 && v <= 20) sizes.push(v)
  }
  return sizes.length ? median(sizes) : undefined
}
function maxBlur(shadow: string): number {
  // shadow lengths: offsetX offsetY blur spread — grab the 3rd (blur).
  // Strip the colour function first (its rgba/hsl numbers aren't lengths), then
  // read positional length tokens. Crucially offsetX is almost always a UNITLESS
  // `0` (e.g. `0 8px 24px`), so we must accept bare numbers too — matching only
  // `<n>px` would drop it and shift blur out of position.
  const lengths = shadow.replace(/(rgba?|hsla?|oklch|color)\([^)]*\)/g, ' ')
  const nums = [...lengths.matchAll(/-?[0-9.]+/g)].map((m) => parseFloat(m[0]))
  return nums[2] ?? 0
}
