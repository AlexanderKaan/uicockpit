import { describe, it, expect } from 'vitest'
import { buildTokens } from '../buildTokens'
import { DEFAULT_CONFIG } from '../defaults'
import type { Config } from '../types'

/* H2 — the interaction-state algebra + motion schemes. Contract:
 *  1. ONE fixed formula (no dials): hover = 0.05, selected +.05, press +.10.
 *  2. The wash source is BAKED NEUTRAL — it follows the Neutrals ramp, so its
 *     temperature tracks the Neutral control (auto/cool/warm). Press is a fixed
 *     0.96 :active scale (baked in the recipe). The former States + State-tint
 *     dials were removed (every benchmark bakes one subtle neutral wash).
 *  3. Motion schemes emit true spring linear() easings + settle durations;
 *     expressive ≠ standard. */

const at = (patch: Partial<Config>): Config => ({ ...DEFAULT_CONFIG, ...patch })
const alphaOf = (s: string): number => parseFloat(s.match(/\/ ([\d.]+)\)/)?.[1] ?? 'NaN')
const chromaOf = (s: string): number => parseFloat(s.match(/oklch\([\d.]+% ([\d.]+)/)?.[1] ?? 'NaN')

describe('H2 — state-layer algebra (fixed house formula)', () => {
  it('the ladder steps from a baked 0.05 base: hover .05, selected .10, press .15', () => {
    const v = buildTokens(DEFAULT_CONFIG).vars
    expect(alphaOf(String(v['--k-state-hover'])), 'hover').toBeCloseTo(0.05, 5)
    expect(alphaOf(String(v['--k-state-selected-bg'])), 'selected').toBeCloseTo(0.1, 5)
    expect(alphaOf(String(v['--k-state-press'])), 'press').toBeCloseTo(0.15, 5)
  })

  it('the wash source is neutral and tracks the Neutrals ramp (cool ≠ warm hue)', () => {
    const cool = buildTokens(at({ neutral: 'cool' })).vars
    const warm = buildTokens(at({ neutral: 'warm' })).vars
    // A neutral wash carries only a whisper of chroma — never a brand-strength fill.
    expect(chromaOf(String(cool['--k-state-hover']))).toBeLessThan(0.03)
    // But its hue follows the Neutral temperature control: cool and warm differ.
    expect(String(cool['--k-state-hover'])).not.toBe(String(warm['--k-state-hover']))
  })
})

describe('H2 — springs (pre-sampled, fixed to the composed standard scheme)', () => {
  it('emits valid linear() easings with settle durations; the composed scheme does not overshoot', () => {
    const v = buildTokens(at({})).vars
    expect(String(v['--k-spring'])).toMatch(/^linear\(0, /)
    expect(String(v['--k-spring'])).toMatch(/1\)$/)
    expect(String(v['--k-spring-dur'])).toMatch(/^\d+ms$/)
    // The 'standard' fast spring (damping 0.9) settles without bouncing past 1.
    const overshoots = (s: string): boolean => s.match(/[\d.]+/g)!.some((n) => parseFloat(n) > 1.01)
    expect(overshoots(String(v['--k-spring-fast']))).toBe(false)
  })
})
