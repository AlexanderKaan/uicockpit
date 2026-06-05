import { describe, it, expect } from 'vitest'
import { genCss } from '../genCss'
import { genJson } from '../genJson'
import { genTailwind } from '../genTailwind'
import { genBrief } from '../genBrief'
import { genRegistry } from '../genRegistry'
import { DEFAULT_CONFIG } from '../../tokens/defaults'
import { applyColorTheme } from '../../tokens/stylesAndThemes'
import type { Config } from '../../tokens/types'

/* Sample non-default config to exercise the export paths: a comfortable +
 * round + cobalt variant that diverges from DEFAULT_CONFIG on the facet
 * controls (Style presets were removed — facets are individual now). */
const sampleCfg: Config = applyColorTheme(
  { ...DEFAULT_CONFIG, scale: 'comfortable', radius: 'round', surfaceDepth: 'layered' },
  'cobalt',
)

describe('genCss', () => {
  it('contains :root and .dark blocks', () => {
    const out = genCss(DEFAULT_CONFIG)
    expect(out).toContain(':root {')
    expect(out).toContain('.dark {')
  })

  it('includes core --k-* tokens', () => {
    const out = genCss(sampleCfg)
    expect(out).toContain('--k-bg')
    expect(out).toContain('--k-primary')
    expect(out).toContain('--k-success')
    expect(out).toContain('--k-radius-md')
    expect(out).toContain('--k-font-display')
  })

  it('matches snapshot for soft + cobalt sample', () => {
    expect(genCss(sampleCfg)).toMatchSnapshot()
  })
})

describe('genJson', () => {
  it('produces valid JSON', () => {
    const out = genJson(sampleCfg)
    expect(() => JSON.parse(out)).not.toThrow()
  })

  it('embeds the decisions and tokens.color tree', () => {
    const parsed = JSON.parse(genJson(sampleCfg))
    expect(parsed.decisions.scale).toBe('comfortable')
    expect(parsed.decisions.colorTheme).toBe('cobalt')
    expect(parsed.tokens.color.primary.name).toBeTruthy()
    expect(parsed.tokens.system.success).toBeTruthy()
    expect(parsed.tokens.icon.library.value).toContain('Lucide')
  })

  it('matches snapshot for default mono', () => {
    expect(genJson(DEFAULT_CONFIG)).toMatchSnapshot()
  })
})

describe('genRegistry (shadcn registry:theme JSON)', () => {
  it('produces a valid registry-item with light + dark cssVars', () => {
    const item = JSON.parse(genRegistry(sampleCfg))
    expect(item.type).toBe('registry:theme')
    expect(item.$schema).toContain('registry-item.json')
    expect(item.name).toBe('uicockpit-cobalt-comfortable')
    // shadcn semantic vars, no leading `--`, OKLCH values
    expect(item.cssVars.light.background).toBeTruthy()
    expect(item.cssVars.light.primary).toContain('oklch(')
    expect(item.cssVars.dark.primary).toContain('oklch(')
    expect(item.cssVars.light.radius).toBeTruthy()
    // light and dark must actually differ (real theme, not a stub)
    expect(item.cssVars.light.background).not.toBe(item.cssVars.dark.background)
  })

  it('matches snapshot for soft + cobalt sample', () => {
    expect(genRegistry(sampleCfg)).toMatchSnapshot()
  })
})

describe('genTailwind', () => {
  it('contains @theme block + color map', () => {
    const out = genTailwind(sampleCfg)
    expect(out).toContain('@theme {')
    expect(out).toContain('--color-primary')
    expect(out).toContain('--color-success')
    expect(out).toContain('--radius-md')
  })

  it('includes a .dark override block', () => {
    const out = genTailwind(sampleCfg)
    expect(out).toContain('.dark {')
  })

  it('matches snapshot for soft + cobalt sample', () => {
    expect(genTailwind(sampleCfg)).toMatchSnapshot()
  })
})

describe('genBrief', () => {
  it('mentions Scale + Color theme + resolved colors', () => {
    const out = genBrief(sampleCfg)
    expect(out).toContain('Scale: comfortable')
    expect(out).toContain('Color theme: Cobalt')
    expect(out).toContain('Brand color:')
    expect(out).toContain('Accent color:')
  })

  it('mentions correct icon library based on iconSet', () => {
    const out = genBrief({ ...sampleCfg, iconSet: 'hairline' })
    expect(out).toContain('Iconoir')
  })

  it('embeds the CSS tokens code-fenced', () => {
    const out = genBrief(sampleCfg)
    expect(out).toMatch(/```css[\s\S]+--k-primary[\s\S]+```/)
  })

  it('reports AA contrast result', () => {
    const out = genBrief(sampleCfg)
    // The BRIEF now ships a full WCAG audit table — verify the
    // "Button text on primary" row + a pass/fail symbol is rendered.
    expect(out).toMatch(/Button text on primary \| \d+\.\d+:1 \| 4\.5:1 \| [✓✗]/)
  })
})
