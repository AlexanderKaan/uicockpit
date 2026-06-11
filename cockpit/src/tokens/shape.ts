/**
 * H5 — the Shape Lab engine: ONE parametric signature shape.
 *
 * Google's 35 expressive shapes are a single function in source
 * (RoundedPolygon(vertices, innerRadius, rounding)); we ship the FUNCTION,
 * not the library. Four dials:
 *   points   (3–16)  — outer vertices
 *   depth    (0–1)   — star depth: 0 = regular polygon, 1 = needle star
 *                      (inner vertices pulled toward the centre)
 *   softness (0–1)   — corner rounding: 0 = hard vertices, 1 = fully smoothed
 *                      (quadratic Béziers eat the whole edge → blobby)
 *   jitter   (0–1)   — seeded organic irregularity. DETERMINISTIC: the same
 *                      (dials, seed) always emits the same path, so the shape
 *                      round-trips through the URL hash like every token.
 *
 * Output: an SVG path in a 0–100 viewBox. buildTokens wraps it as a
 * data-URI mask (--k-shape-signature) — masks scale with the element, where
 * CSS clip-path: path() would not (px-based). Raw path also emitted for
 * inline-SVG consumers (loaders that MORPH between two dial states get
 * vertex-matched interpolation for free — same point count, same order).
 */

export interface SignatureShape {
  points: number
  depth: number
  softness: number
  jitter: number
}

/** mulberry32 — tiny deterministic PRNG; jitter must be stable per kit hash. */
const prng = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const r2 = (n: number) => Math.round(n * 100) / 100

/** The signature path: 0–100 viewBox, closed, clockwise from 12 o'clock. */
export function signaturePath(shape: SignatureShape, seed = 1): string {
  const points = Math.round(Math.min(16, Math.max(3, shape.points)))
  const depth = Math.min(1, Math.max(0, shape.depth))
  const softness = Math.min(1, Math.max(0, shape.softness))
  const jitter = Math.min(1, Math.max(0, shape.jitter))
  const rand = prng(Math.floor(seed) || 1)

  // Vertex ring: outer-only for a polygon; outer+inner alternating for a star.
  const C = 50
  const R = 48
  const innerR = R * (1 - depth * 0.75) // depth 1 keeps a 25% core (never degenerate)
  const star = depth > 0.001
  const n = star ? points * 2 : points
  const verts: Array<[number, number]> = []
  for (let i = 0; i < n; i++) {
    const baseAngle = (i / n) * Math.PI * 2 - Math.PI / 2
    // Jitter perturbs angle (±40% of a step) and radius (±18%) — seeded.
    const ja = (rand() - 0.5) * jitter * ((Math.PI * 2) / n) * 0.8
    const jr = 1 + (rand() - 0.5) * jitter * 0.36
    const radius = (star ? (i % 2 === 0 ? R : innerR) : R) * jr
    const a = baseAngle + ja
    verts.push([C + Math.cos(a) * radius, C + Math.sin(a) * radius])
  }

  if (softness < 0.001) {
    // Hard vertices — a plain polygon path.
    return `M ${verts.map(([x, y]) => `${r2(x)} ${r2(y)}`).join(' L ')} Z`
  }

  // Corner rounding: walk each vertex, cut the corner at `t` along both
  // incident edges and bridge with a quadratic Bézier whose control IS the
  // vertex. t = softness/2 — at 1 the cut points meet mid-edge (max smooth).
  const t = softness / 2
  const lerp = (a: [number, number], b: [number, number], f: number): [number, number] =>
    [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
  let d = ''
  for (let i = 0; i < n; i++) {
    const prev = verts[(i - 1 + n) % n]!
    const v = verts[i]!
    const next = verts[(i + 1) % n]!
    const into = lerp(v, prev, t) // entry point on the incoming edge
    const outof = lerp(v, next, t) // exit point on the outgoing edge
    d += i === 0 ? `M ${r2(into[0])} ${r2(into[1])} ` : `L ${r2(into[0])} ${r2(into[1])} `
    d += `Q ${r2(v[0])} ${r2(v[1])} ${r2(outof[0])} ${r2(outof[1])} `
  }
  return d + 'Z'
}

/** The path wrapped as a CSS mask value (data-URI SVG, scales with element). */
export function signatureMask(shape: SignatureShape, seed = 1): string {
  const path = signaturePath(shape, seed)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='${path}' fill='black'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/%20/g, ' ')}")`
}

/** Stable numeric seed from the dials — jitter is deterministic per kit. */
export function signatureSeed(shape: SignatureShape): number {
  return (
    1 +
    Math.round(shape.points) * 7919 +
    Math.round(shape.depth * 100) * 131 +
    Math.round(shape.softness * 100) * 17 +
    Math.round(shape.jitter * 100)
  )
}
