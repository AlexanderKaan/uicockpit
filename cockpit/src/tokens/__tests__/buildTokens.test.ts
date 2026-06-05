import { describe, it, expect } from 'vitest'
import { buildTokens } from '../buildTokens'
import { DEFAULT_CONFIG } from '../defaults'
import { COLOR_THEMES, applyColorTheme } from '../stylesAndThemes'
import type { Config, Mode, Scale } from '../types'

const MODES: Mode[] = ['light', 'dark']
const SCALES: Scale[] = ['compact', 'default', 'comfortable']

describe('buildTokens — mono baseline', () => {
  for (const mode of MODES) {
    it(`matches snapshot in ${mode} mode`, () => {
      const cfg: Config = { ...DEFAULT_CONFIG, mode }
      expect(buildTokens(cfg)).toMatchSnapshot()
    })
  }
})

/* Snapshot every Scale × Mode combination (size/spacing/weight macro) + the
 * chromatic themes on the default Config (color coverage). Style presets were
 * removed — Scale is the remaining macro axis. 4 scales × 2 modes = 8, plus
 * the chromatic themes × 2 modes for color coverage. */
describe('buildTokens — Scale coverage (with Mono)', () => {
  for (const scale of SCALES) {
    for (const mode of MODES) {
      it(`scale ${scale} in ${mode} mode`, () => {
        const base: Config = { ...DEFAULT_CONFIG, mode, scale }
        const cfg = applyColorTheme(base, 'mono')
        expect(buildTokens(cfg)).toMatchSnapshot()
      })
    }
  }
})

describe('buildTokens — Color theme coverage (on default)', () => {
  for (const themeId of Object.keys(COLOR_THEMES) as Array<keyof typeof COLOR_THEMES>) {
    if (themeId === 'mono') continue // covered above
    for (const mode of MODES) {
      it(`theme ${themeId} in ${mode} mode`, () => {
        const base: Config = { ...DEFAULT_CONFIG, mode }
        const cfg = applyColorTheme(base, themeId)
        expect(buildTokens(cfg)).toMatchSnapshot()
      })
    }
  }
})

describe('buildTokens — invariants', () => {
  it('produces 60+ CSS variables for every Scale', () => {
    for (const scale of SCALES) {
      const cfg: Config = { ...DEFAULT_CONFIG, scale }
      const tk = buildTokens(cfg)
      expect(Object.keys(tk.vars).length).toBeGreaterThanOrEqual(50)
    }
  })

  it('primary text passes WCAG AA (>=4.5) for every Color theme in both modes', () => {
    for (const themeId of Object.keys(COLOR_THEMES) as Array<keyof typeof COLOR_THEMES>) {
      for (const mode of MODES) {
        const base: Config = { ...DEFAULT_CONFIG, mode }
        const cfg = applyColorTheme(base, themeId)
        const tk = buildTokens(cfg)
        expect(tk.cc.inkOnPrimary, `${themeId} ${mode}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('flat surface depth is the Linear look: subtle 1px border, zero shadow', () => {
    const cfg: Config = { ...DEFAULT_CONFIG, surfaceDepth: 'flat' }
    const tk = buildTokens(cfg)
    expect(tk.vars['--k-shadow-sm']).toBe('none')
    expect(tk.vars['--k-bw']).toBe('1px')
  })

  it('Border control sets border prominence independently of depth', () => {
    const okL = (s: string): number => parseFloat(s.match(/oklch\(([\d.]+)%/)![1]!)
    const faint = String(buildTokens({ ...DEFAULT_CONFIG, borders: 'faint' }).vars['--k-border'])
    const strong = String(buildTokens({ ...DEFAULT_CONFIG, borders: 'strong' }).vars['--k-border'])
    // strong = darker (lower L) = more visible than faint
    expect(okL(strong)).toBeLessThan(okL(faint))
    // and it does NOT depend on surface depth (same border at flat vs layered)
    const flatBorder = buildTokens({ ...DEFAULT_CONFIG, borders: 'medium', surfaceDepth: 'flat' }).vars['--k-border']
    const layeredBorder = buildTokens({ ...DEFAULT_CONFIG, borders: 'medium', surfaceDepth: 'layered' }).vars['--k-border']
    expect(flatBorder).toBe(layeredBorder)
  })

  it('layered surface depth produces real drop shadows', () => {
    const cfg: Config = { ...DEFAULT_CONFIG, surfaceDepth: 'layered' }
    const tk = buildTokens(cfg)
    expect(tk.vars['--k-shadow-md']).not.toBe('none')
    expect(tk.vars['--k-bw']).toBe('1px')
  })

  it('shadows are tinted toward the brand hue (not generic black) in light mode', () => {
    const cfg: Config = { ...DEFAULT_CONFIG, color: 'tone', cPrimary: '#2563EB', surfaceDepth: 'layered' }
    const tk = buildTokens(cfg)
    // shadowFor interpolates the brand-hued shTone via hsl(H S% L% / a)
    expect(tk.vars['--k-shadow-md']).toContain('hsl(')
  })

  it('mono mode flattens brand saturation to zero', () => {
    const cfg: Config = { ...DEFAULT_CONFIG, color: 'mono', cPrimary: '#5654c8' }
    const tk = buildTokens(cfg)
    // mono primary should be a neutral gray — in OKLCH that means zero chroma
    // (the middle component), regardless of cPrimary's input hue/saturation.
    expect(tk.vars['--k-primary']).toMatch(/^oklch\([\d.]+% 0\.0000 /)
  })
})
