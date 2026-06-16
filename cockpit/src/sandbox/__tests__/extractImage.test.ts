import { describe, it, expect } from 'vitest'
import { extractFoundationFromPixels, type Pixels } from '../extractImage'

/** Build a w×h RGBA buffer; `paint(x,y)` returns the [r,g,b] for each pixel. */
function makePixels(w: number, h: number, paint: (x: number, y: number) => [number, number, number]): Pixels {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const [r, g, b] = paint(x, y)
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255
    }
  }
  return { data, width: w, height: h }
}

describe('extractFoundationFromPixels', () => {
  it('reads a dominant chromatic colour as the brand (low confidence)', () => {
    // A violet brand band on a light tinted-grey background.
    const px = makePixels(24, 24, (x) => (x < 9 ? [124, 58, 237] : [240, 240, 243]))
    const { config, confidence } = extractFoundationFromPixels(px)
    expect(config.color).toBe('tone')
    expect(['violet', 'indigo', 'coral']).toContain(config.colorTheme) // hue 262 region
    expect(config.cPrimary).toMatch(/^#/)
    expect(confidence.brand).toBe('low') // pixel-based is never 'high'
  })

  it('falls back to mono for a greyscale screenshot', () => {
    const px = makePixels(20, 20, () => [205, 205, 205])
    const { config } = extractFoundationFromPixels(px)
    expect(config.color).toBe('mono')
    expect(config.colorTheme).toBe('mono')
  })

  it('reads a cool grey ramp as cool neutrals', () => {
    // A mid grey with a slight blue tint (delta small, hue ~220).
    const px = makePixels(20, 20, () => [110, 114, 122])
    const { config, confidence } = extractFoundationFromPixels(px)
    expect(confidence.neutral).toBe('low')
    expect(config.neutral).toBe('cool')
  })

  it('never claims radius/font/density from pixels', () => {
    const px = makePixels(16, 16, () => [124, 58, 237])
    const { confidence } = extractFoundationFromPixels(px)
    expect(confidence.radius).toBe('none')
    expect(confidence.font).toBe('none')
    expect(confidence.density).toBe('none')
  })
})
