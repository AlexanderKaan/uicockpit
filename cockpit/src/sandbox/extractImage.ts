/* Sandbox · Slice 5 — foundation FROM PIXELS (the universal fallback).
 *
 * A screenshot is the one input nobody is locked out of — and for an SPA (whose
 * HTML is an empty shell) it's the ONLY way in. From pixels we can read the
 * reliable half of the foundation: the brand colour (dominant chromatic hue) and
 * the neutral temperature (the grey ramp's tint). Radius / font / density don't
 * survive rasterisation, so we don't pretend — they stay defaults.
 *
 * Two parts: `loadImageData` (browser-only: decode + downscale to a canvas) and
 * `extractFoundationFromPixels` (PURE: pixels → the same Extraction shape the CSS
 * path returns, so the rest of the sandbox is identical). Dependency-free. */

import type { Config } from '../tokens/types'
import type { Extraction, Facet, Confidence } from './extractFoundation'
import { nearestTheme, hslToHexLocal } from './extractFoundation'

type HSL = { h: number; s: number; l: number }
/** A structural subset of ImageData so tests can pass a plain literal. */
export interface Pixels { data: Uint8ClampedArray | number[]; width: number; height: number }

function rgbToHsl(r: number, g: number, b: number): HSL {
  const rr = r / 255, gg = g / 255, bb = b / 255
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  let h = 0, s = 0
  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rr: h = (gg - bb) / d + (gg < bb ? 6 : 0); break
      case gg: h = (bb - rr) / d + 2; break
      default: h = (rr - gg) / d + 4; break
    }
    h *= 60
  }
  return { h, s: s * 100, l: l * 100 }
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

/** Decode a File into a downscaled ImageData (browser-only). Cap the long edge
 *  so quantisation is fast and antialiasing averages noise away. */
export async function loadImageData(file: File, max = 160): Promise<Pixels> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image()
      im.onload = () => resolve(im)
      im.onerror = () => reject(new Error('image decode failed'))
      im.src = url
    })
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('no 2d context')
    ctx.drawImage(img, 0, 0, w, h)
    return ctx.getImageData(0, 0, w, h)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Pixels → a partial Config + per-facet confidence (the colour facets only). */
export function extractFoundationFromPixels(px: Pixels): Extraction {
  const config: Partial<Config> = {}
  const confidence: Record<Facet, Confidence> = {
    brand: 'none', neutral: 'none', radius: 'none', font: 'none', density: 'none', elevation: 'none', typeSize: 'none',
  }
  const notes: string[] = []
  const d = px.data

  // Coarse hue×sat histogram of CHROMATIC pixels + a bag of grey hues. We gate on
  // the raw RGB max−min DELTA, not HSL saturation: saturation is unstable at the
  // extremes (a near-white #f4f6fa reads as ~35% saturated and would masquerade as
  // a brand vote), whereas delta cleanly separates grey from colour everywhere.
  const freq = new Map<string, { hsl: HSL; n: number }>()
  const greys: number[] = []
  const lights: number[] = []
  let sampled = 0
  // Step a few pixels for speed; each pixel = 4 bytes (RGBA).
  for (let i = 0; i < d.length; i += 4 * 2) {
    const a = d[i + 3]!
    if (a < 200) continue // skip transparent
    const r = d[i]!, g = d[i + 1]!, b = d[i + 2]!
    const delta = Math.max(r, g, b) - Math.min(r, g, b)
    const hsl = rgbToHsl(r, g, b)
    sampled++
    lights.push(hsl.l) // every pixel counts toward the light-vs-dark verdict
    if (delta <= 18) { if (delta >= 3 && hsl.l > 8 && hsl.l < 96) greys.push(hsl.h); continue }
    if (delta < 40) continue // muted/ambiguous — neither a clean grey nor a clean brand
    if (hsl.l < 8 || hsl.l > 92) continue
    const key = `${Math.round(hsl.h / 12)}-${Math.round(hsl.s / 15)}`
    const e = freq.get(key)
    if (e) { e.n++ } else freq.set(key, { hsl, n: 1 })
  }

  // MODE — light vs dark, from the screenshot's overall lightness. The page
  // background dominates the pixel count, so the median lightness is a robust
  // read: a dark UI sits well below 50%. (This is THE thing that makes a dark
  // app's board look like the app instead of a stranger.)
  if (lights.length >= 50) {
    const medL = median(lights)
    config.mode = medL < 42 ? 'dark' : 'light'
    notes.push(`mode: median pixel lightness ${medL.toFixed(0)}% → '${config.mode}'`)
  }

  // BRAND — the most-voted chromatic bucket. Pixel-based ⇒ always 'low' conf.
  const top = [...freq.values()].sort((a, b) => b.n - a.n)[0]
  if (top && top.n >= 3) {
    const theme = nearestTheme(top.hsl.h)
    config.color = 'tone'
    config.colorTheme = theme
    config.cPrimary = hslToHexLocal(top.hsl.h, Math.min(top.hsl.s, 92), top.hsl.l)
    confidence.brand = 'low'
    notes.push(`brand: dominant pixel hue ~${top.hsl.h.toFixed(0)}° (×${top.n}) → '${theme}'`)
  } else {
    config.color = 'mono'
    config.colorTheme = 'mono'
    confidence.brand = 'low'
    notes.push('brand: no dominant chromatic colour in pixels → mono')
  }

  // NEUTRALS — temperature of the grey ramp.
  if (greys.length >= 8) {
    const avg = circularMean(greys)
    const temp: Config['neutral'] = (avg >= 20 && avg <= 80) ? 'warm' : (avg >= 190 && avg <= 270) ? 'cool' : 'neutral'
    config.neutral = temp
    confidence.neutral = 'low'
    notes.push(`neutral: ${greys.length} grey samples, avg hue ${avg.toFixed(0)}° → '${temp}'`)
  }

  notes.push(`(read from ${sampled} sampled pixels — colours only; radius/font/density stay defaults)`)
  return { config, confidence, notes }
}
