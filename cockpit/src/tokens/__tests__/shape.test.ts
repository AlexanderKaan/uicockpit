import { describe, it, expect } from 'vitest'
import { signaturePath, signatureMask, signatureSeed } from '../shape'
import { buildTokens } from '../buildTokens'
import { DEFAULT_CONFIG } from '../defaults'

/* H5 — the Shape Lab engine. Contract:
 *  1. ONE function: (points, depth, softness, jitter) → a closed SVG path.
 *  2. Deterministic: same dials + seed → byte-identical path (URL round-trip).
 *  3. depth 0 → a regular polygon (all vertices on one radius);
 *     depth > 0 → a star (alternating outer/inner ring, 2× the points).
 *  4. softness 0 → only line segments; softness > 0 → quadratic Béziers.
 *  5. buildTokens emits the mask + raw path as --k-shape-signature(-path). */

const base = { points: 8, depth: 0.12, softness: 0.8, jitter: 0 }

describe('H5 — signature path geometry', () => {
  it('emits a closed path inside the 0–100 box', () => {
    const d = signaturePath(base)
    expect(d.startsWith('M ')).toBe(true)
    expect(d.trim().endsWith('Z')).toBe(true)
    const nums = d.match(/-?[\d.]+/g)!.map(Number)
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...nums)).toBeLessThanOrEqual(100)
  })

  it('depth 0 is a polygon, depth > 0 doubles the vertex ring (star)', () => {
    const poly = signaturePath({ ...base, depth: 0, softness: 0 })
    const star = signaturePath({ ...base, depth: 0.5, softness: 0 })
    // Hard polygon: M + (n-1) L segments. Star ring has 2n vertices.
    expect(poly.match(/L /g)!.length).toBe(base.points - 1)
    expect(star.match(/L /g)!.length).toBe(base.points * 2 - 1)
  })

  it('softness 0 → lines only; softness > 0 → one Q per vertex', () => {
    const hard = signaturePath({ ...base, softness: 0 })
    const soft = signaturePath({ ...base, softness: 0.8, depth: 0 })
    expect(hard).not.toContain('Q')
    expect(soft.match(/Q /g)!.length).toBe(base.points)
  })

  it('jitter is deterministic per seed and actually moves vertices', () => {
    const shape = { ...base, jitter: 0.6 }
    const a = signaturePath(shape, 42)
    const b = signaturePath(shape, 42)
    const c = signaturePath(shape, 43)
    expect(a).toBe(b) // same seed → byte-identical (round-trippable)
    expect(a).not.toBe(c) // different seed → different wobble
    expect(a).not.toBe(signaturePath({ ...shape, jitter: 0 }, 42))
  })

  it('point count clamps to 3–16', () => {
    const tri = signaturePath({ points: 1, depth: 0, softness: 0, jitter: 0 })
    expect(tri.match(/L /g)!.length).toBe(2) // clamped to a triangle
  })
})

describe('H5 — token emission', () => {
  it('buildTokens emits the mask + raw path, stable for the default kit', () => {
    const v = buildTokens(DEFAULT_CONFIG).vars
    const mask = String(v['--k-shape-signature'])
    expect(mask.startsWith('url("data:image/svg+xml,')).toBe(true)
    expect(String(v['--k-shape-signature-path'])).toMatch(/^'M .*Z'$/)
    // The seed derives from the dials — same config twice = same mask.
    expect(String(buildTokens(DEFAULT_CONFIG).vars['--k-shape-signature'])).toBe(mask)
  })

  it('the seed helper is a pure function of the dials', () => {
    expect(signatureSeed(base)).toBe(signatureSeed({ ...base }))
    expect(signatureSeed(base)).not.toBe(signatureSeed({ ...base, points: 9 }))
  })

  it('the mask data-URI is a valid SVG wrapper', () => {
    const m = signatureMask(base)
    expect(decodeURIComponent(m)).toContain("viewBox='0 0 100 100'")
    expect(m.endsWith('")')).toBe(true)
  })
})
