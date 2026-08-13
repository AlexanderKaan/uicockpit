import type { CSSProperties } from 'react'
import type { AuditHandoff } from './handoff'

/**
 * How a fixture's measured values become CSS custom properties.
 *
 * Extracted from the view so the conformance harness exercises the SHIPPING
 * function rather than a copy of it. A harness that tests its own duplicate of
 * the logic reports green while the product renders a 12,000px button — which
 * is exactly the defect this whole exercise exists to catch.
 */
/** Blend two hexes — used only to derive the muted/faint steps a kit needs
 *  from the two ends we actually measured, rather than inventing a third. */
function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return '#' + x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, '0')).join('')
}

/**
 * Their palette, shared across every cell.
 *
 * An app has ONE grey ramp — its surfaces, borders and text are the same
 * everywhere — so painting these per cell would invent a chaos they do not
 * have. Sorted by luminance and mapped by role, because the engine reports the
 * greys by frequency and frequency says nothing about which one is a page and
 * which one is a word.
 *
 * Leaving them out entirely was the bug: the "before" kept OUR neutrals and our
 * type, so a foreign app rendered in our skin, and the switch looked like it
 * barely did anything.
 */
export function paletteStyle(audit: AuditHandoff): Record<string, string> {
  const out: Record<string, string> = {}
  const { bg, fg, border } = audit.spread
  if (bg && fg && border) {
    // Straight from the engine, where role was MEASURED and legibility checked.
    out['--k-surface'] = bg
    out['--k-bg'] = bg
    out['--k-surface-2'] = bg
    out['--k-border'] = border
    out['--k-input-border'] = border
    out['--k-fg'] = fg
    out['--k-fg-muted'] = mix(fg, bg, 0.28)
    out['--k-fg-faint'] = mix(fg, bg, 0.5)
  }
  const t = [...(audit.spread.type || [])]
  if (t.length) {
    const px = (v: string) => parseFloat(v)
    const sorted = [...new Set(t)].sort((a, b) => px(a) - px(b))
    out['--k-type-small'] = sorted[0]!
    out['--k-type-body'] = sorted[Math.min(1, sorted.length - 1)]!
    out['--k-type-h3'] = sorted[sorted.length - 1]!
  }
  return out
}

/** And the part that genuinely varies per component: shape, depth, accent. */
export function driftStyle(audit: AuditHandoff, i: number): CSSProperties {
  const s = audit.spread
  const pick = (list: string[], n: number) => (list.length ? list[n % list.length] : undefined)
  const out: Record<string, string> = { ...paletteStyle(audit) }
  const r = pick(s.radius, i)
  const sh = pick(s.shadow, i)
  const c = pick(s.color, i)
  const sp = pick(s.spacing, i)
  if (r) {
    /* A pill value is a BUTTON radius, never a box one. Dealing 9999px into
     * --k-radius-md blew a button to 12,000px wide: the recipe clamps its
     * pill-aware padding with a min(), but `--k-radius-md * 0.75` sits
     * unclamped inside the same max() — reasonably, since no card is a pill.
     * The value is genuinely theirs; putting it on a token it cannot belong to
     * was mine. Box radii take the largest measured value that is actually a
     * box radius; the pill still reaches the button. */
    const px = parseFloat(r)
    const isPill = /px$/.test(r) && px >= 100
    const box = isPill ? (s.radius.find((v) => parseFloat(v) < 100) ?? '8px') : r
    out['--k-radius-sm'] = box
    out['--k-radius-md'] = box
    out['--k-radius-lg'] = box
    out['--k-radius-button'] = r
  }
  if (sh) { out['--k-shadow-sm'] = sh; out['--k-shadow-md'] = sh }
  if (c) {
    out['--k-primary'] = c; out['--k-accent'] = c; out['--k-fill'] = c; out['--k-ring'] = c
    out['--k-primary-soft'] = c + '22'
    out['--k-state-selected-bg'] = c + '22'
  }
  if (sp) { out['--k-s-8'] = sp; out['--k-s-12'] = sp }
  return out as CSSProperties
}

