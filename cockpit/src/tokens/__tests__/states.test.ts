import { describe, it, expect } from 'vitest'
import { buildTokens } from '../buildTokens'
import { DEFAULT_CONFIG } from '../defaults'
import type { Config } from '../types'

/* H2 — the interaction-state algebra + motion schemes. Contract:
 *  1. ONE formula: hover = base alpha (per intensity), selected +.05, press +.10.
 *  2. The default (whisper · neutral · scale · standard) is the calibrated
 *     house look — hover alpha 0.05, press scale 0.96.
 *  3. State tint switches the wash's hue source without touching intensity.
 *  4. Press dial drives the --k-press-* trio (morph = radius squish).
 *  5. Motion schemes emit true spring linear() easings + settle durations;
 *     expressive ≠ standard. */

const at = (patch: Partial<Config>): Config => ({ ...DEFAULT_CONFIG, ...patch })
const alphaOf = (s: string): number => parseFloat(s.match(/\/ ([\d.]+)\)/)?.[1] ?? 'NaN')
const hueOf = (s: string): number => parseFloat(s.match(/oklch\([\d.]+% [\d.]+ ([\d.]+)/)?.[1] ?? 'NaN')

describe('H2 — state-layer algebra', () => {
  it('intensity steps the whole ladder from one base alpha', () => {
    for (const [intensity, base] of [['whisper', 0.05], ['standard', 0.08], ['vivid', 0.12]] as const) {
      const v = buildTokens(at({ stateIntensity: intensity })).vars
      expect(alphaOf(String(v['--k-state-hover'])), `${intensity} hover`).toBeCloseTo(base, 5)
      expect(alphaOf(String(v['--k-state-selected-bg'])), `${intensity} selected`).toBeCloseTo(base + 0.05, 5)
      expect(alphaOf(String(v['--k-state-press'])), `${intensity} press`).toBeCloseTo(base + 0.1, 5)
    }
  })

  it('state tint switches the wash hue source (neutral → brand) at the same alpha', () => {
    const neutral = buildTokens(at({ stateTint: 'neutral' })).vars
    const brand = buildTokens(at({ stateTint: 'brand' })).vars
    expect(alphaOf(String(brand['--k-state-hover']))).toBeCloseTo(alphaOf(String(neutral['--k-state-hover'])), 5)
    // The brand wash carries far more chroma than the neutral whisper.
    const chromaOf = (s: string): number => parseFloat(s.match(/oklch\([\d.]+% ([\d.]+)/)![1]!)
    expect(chromaOf(String(brand['--k-state-hover']))).toBeGreaterThan(chromaOf(String(neutral['--k-state-hover'])) * 3)
    expect(Number.isFinite(hueOf(String(brand['--k-state-hover'])))).toBe(true)
  })
})

describe('H2 — press feedback', () => {
  it('default (scale) keeps the house 0.96 squish; none/opacity/morph re-route it', () => {
    const scale = buildTokens(DEFAULT_CONFIG).vars
    expect(scale['--k-press-scale']).toBe('0.96')
    expect(scale['--k-press-opacity']).toBe('1')
    const none = buildTokens(at({ press: 'none' })).vars
    expect(none['--k-press-scale']).toBe('1')
    const fade = buildTokens(at({ press: 'opacity' })).vars
    expect(fade['--k-press-opacity']).toBe('0.85')
    const morph = buildTokens(at({ press: 'morph' })).vars
    expect(String(morph['--k-press-radius'])).toContain('min(')
    expect(morph['--k-press-scale']).toBe('1')
  })
})

describe('H2 — motion schemes (pre-sampled springs)', () => {
  it('emits linear() easings with settle durations; expressive bounces, standard does not', () => {
    const std = buildTokens(at({ motionScheme: 'standard' })).vars
    const exp = buildTokens(at({ motionScheme: 'expressive' })).vars
    for (const v of [std, exp]) {
      expect(String(v['--k-spring'])).toMatch(/^linear\(0, /)
      expect(String(v['--k-spring'])).toMatch(/1\)$/)
      expect(String(v['--k-spring-dur'])).toMatch(/^\d+ms$/)
    }
    expect(std['--k-spring']).not.toBe(exp['--k-spring'])
    // Expressive fast spring (damping 0.6) overshoots past 1; standard (0.9) ~not.
    const overshoots = (s: string): boolean => s.match(/[\d.]+/g)!.some((n) => parseFloat(n) > 1.01)
    expect(overshoots(String(exp['--k-spring-fast']))).toBe(true)
    expect(overshoots(String(std['--k-spring-fast']))).toBe(false)
  })
})
