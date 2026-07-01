import { describe, it, expect } from 'vitest'
import { configFromBrief, briefToHash } from '../brief'
import { decode } from '../hash'
import { DEFAULT_CONFIG } from '../../tokens/defaults'

describe('configFromBrief', () => {
  it('applies a theme id + overrides, validated against the enums', () => {
    const cfg = configFromBrief({ brand: 'jade', radius: 'round', density: 'comfortable', buttonShape: 'pill', icons: 'bold' })
    expect(cfg.colorTheme).toBe('jade')
    expect(cfg.color).toBe('tone')
    expect(cfg.radius).toBe('round')
    expect(cfg.scale).toBe('comfortable')
    expect(cfg.buttonShape).toBe('pill')
    expect(cfg.iconSet).toBe('bold')
  })

  it('accepts a #hex brand as a custom primary', () => {
    const cfg = configFromBrief({ brand: '#ff5500' })
    expect(cfg.cPrimary).toBe('#ff5500')
    expect(cfg.color).toBe('tone')
    const bare = configFromBrief({ brand: 'ff5500' }) // no leading #
    expect(bare.cPrimary).toBe('#ff5500')
  })

  it('ignores unknown / malformed params (never a broken kit)', () => {
    const cfg = configFromBrief({ brand: 'not-a-theme', radius: 'huge', density: 'cozy', icons: 'squiggle' })
    expect(cfg.colorTheme).toBe(DEFAULT_CONFIG.colorTheme)
    expect(cfg.radius).toBe(DEFAULT_CONFIG.radius)
    expect(cfg.scale).toBe(DEFAULT_CONFIG.scale)
    expect(cfg.iconSet).toBe(DEFAULT_CONFIG.iconSet)
  })

  it('an empty brief yields the default kit', () => {
    expect(configFromBrief({})).toEqual(DEFAULT_CONFIG)
  })

  it('round-trips through the hash the CDN renders', () => {
    const hash = briefToHash({ brand: 'violet', radius: 'subtle' })
    const back = decode(hash)
    expect(back).not.toBeNull()
    expect(back!.colorTheme).toBe('violet')
    expect(back!.radius).toBe('subtle')
  })
})
