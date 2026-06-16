import { describe, it, expect } from 'vitest'
import { extractFoundation } from '../extractFoundation'
import { seedConfig, readSummary } from '../seedConfig'
import { DEFAULT_CONFIG } from '../../tokens/defaults'

describe('seedConfig', () => {
  it('folds the extracted partial over the base, keeping unread facets', () => {
    const ex = extractFoundation(`
      :root { --primary: 221 83% 53%; --radius: 0.5rem; }
      body { font-family: "Inter", sans-serif; }
    `)
    const cfg = seedConfig(ex, DEFAULT_CONFIG)
    expect(cfg.colorTheme).toBe('cobalt')   // extracted
    expect(cfg.radius).toBe('soft')          // extracted
    expect(cfg.fontDisplay).toBe('Inter')    // extracted
    expect(cfg.motion).toBe(DEFAULT_CONFIG.motion) // untouched facet kept
    expect(cfg.iconSet).toBe(DEFAULT_CONFIG.iconSet)
  })

  it('carries the three coupled brand fields together', () => {
    const ex = extractFoundation('@theme { --color-primary: #14B8A6; }')
    const cfg = seedConfig(ex, DEFAULT_CONFIG)
    expect(cfg.color).toBe('tone')
    expect(cfg.colorTheme).toBe('teal')
    expect(cfg.cPrimary).toMatch(/^#/)
  })

  it('greyscale app seeds mono', () => {
    const ex = extractFoundation('.a{color:#111}.b{background:#f5f5f5}.c{border-color:#999}')
    const cfg = seedConfig(ex, DEFAULT_CONFIG)
    expect(cfg.color).toBe('mono')
    expect(cfg.colorTheme).toBe('mono')
  })
})

describe('readSummary', () => {
  it('returns labelled rows, brand first, only for read facets', () => {
    const ex = extractFoundation(`
      :root { --primary: 221 83% 53%; --radius: 0.5rem; font-size: 14px; }
      body { font-family: "Inter", sans-serif; }
    `)
    const rows = readSummary(ex)
    expect(rows[0]!.facet).toBe('brand')
    expect(rows[0]!.value).toBe('Cobalt')
    expect(rows[0]!.swatch).toMatch(/^#/)
    const facets = rows.map((r) => r.facet)
    expect(facets).toContain('font')
    expect(facets).toContain('radius')
    expect(facets).toContain('typeSize')
    // never-measured facets are absent (no confident default masquerading as read)
    expect(facets).not.toContain('density')
    // every row carries a confidence + a non-empty value
    for (const r of rows) {
      expect(['high', 'low']).toContain(r.confidence)
      expect(r.value.length).toBeGreaterThan(0)
    }
  })

  it('brand row reads Mono for a greyscale app, no swatch', () => {
    const rows = readSummary(extractFoundation('.a{color:#111}.b{background:#f5f5f5}.c{border:#999}'))
    const brand = rows.find((r) => r.facet === 'brand')!
    expect(brand.value).toMatch(/Mono/)
    expect(brand.swatch).toBeUndefined()
  })
})
