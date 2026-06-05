import { describe, it, expect } from 'vitest'
import { decode, encode } from '../hash'
import { DEFAULT_CONFIG } from '../../tokens/defaults'
import { COLOR_THEMES, applyColorTheme } from '../../tokens/stylesAndThemes'
import type { Config, Scale } from '../../tokens/types'

describe('hash encode/decode', () => {
  it('round-trips default config', () => {
    const encoded = encode(DEFAULT_CONFIG)
    const decoded = decode(encoded)
    expect(decoded).toEqual(DEFAULT_CONFIG)
  })

  it('round-trips every Scale', () => {
    const scales: Scale[] = ['compact', 'default', 'comfortable']
    for (const scale of scales) {
      const cfg: Config = { ...DEFAULT_CONFIG, scale }
      const decoded = decode(encode(cfg))
      expect(decoded).toEqual(cfg)
    }
  })

  it('round-trips every Color theme', () => {
    for (const themeId of Object.keys(COLOR_THEMES) as Array<keyof typeof COLOR_THEMES>) {
      const cfg: Config = applyColorTheme(DEFAULT_CONFIG, themeId)
      const decoded = decode(encode(cfg))
      expect(decoded).toEqual(cfg)
    }
  })

  it('encoded output is meaningfully shorter than base64 JSON', () => {
    const lzEncoded = encode(DEFAULT_CONFIG)
    const base64 = btoa(JSON.stringify(DEFAULT_CONFIG))
    expect(lzEncoded.length).toBeLessThan(base64.length)
  })

  it('decodes legacy base64-JSON (reference URL backwards-compat)', () => {
    const legacy = btoa(JSON.stringify(DEFAULT_CONFIG))
    const decoded = decode(legacy)
    expect(decoded).toEqual(DEFAULT_CONFIG)
  })

  it('returns null for malformed input', () => {
    expect(decode('')).toBeNull()
    expect(decode('#')).toBeNull()
    expect(decode('v2:!!!not-valid')).toBeNull()
  })

  it('strips leading hash mark', () => {
    const encoded = encode(DEFAULT_CONFIG)
    expect(decode('#' + encoded)).toEqual(DEFAULT_CONFIG)
  })
})
