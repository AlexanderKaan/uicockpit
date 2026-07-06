import { describe, it, expect } from 'vitest'
import { genCss } from '../genCss'
import { genJson } from '../genJson'
import { genTailwind } from '../genTailwind'
import { genBrief } from '../genBrief'
import { genRegistry } from '../genRegistry'
import { genContract } from '../genContract'
import { genDesignMd } from '../genDesignMd'
import { genSkill } from '../genSkill'
import { genAstryx } from '../genAstryx'
import { DEFAULT_CONFIG } from '../../tokens/defaults'
import { applyColorTheme } from '../../tokens/stylesAndThemes'
import type { Config } from '../../tokens/types'

/* Sample non-default config to exercise the export paths: a comfortable +
 * round + cobalt variant that diverges from DEFAULT_CONFIG on the facet
 * controls (Style presets were removed — facets are individual now). */
const sampleCfg: Config = applyColorTheme(
  { ...DEFAULT_CONFIG, scale: 'comfortable', radius: 'round', surfaceDepth: 'deep' },
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

  // Pinned to Mono explicitly — DEFAULT_CONFIG is now chromatic (Cobalt, per C1);
  // the chromatic output is already covered by the cobalt sample snapshots above.
  it('matches snapshot for mono baseline', () => {
    expect(genJson(applyColorTheme(DEFAULT_CONFIG, 'mono'))).toMatchSnapshot()
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

describe('genAstryx (LP5b — Meta Astryx defineTheme export)', () => {
  it('emits a standalone defineTheme file with light/dark tuples', () => {
    const out = genAstryx(sampleCfg)
    expect(out).toContain("import {defineTheme} from '@astryxdesign/core/theme'")
    expect(out).toContain("'--color-background-body': [")
    // the brand never mode-flips, so accent may be a single literal
    expect(out).toContain("'--color-accent':")
    expect(out).toContain('typography')
    expect(out).toContain('motion: {fast:')
    // resolved literals only — a theme file must stand alone in an Astryx project
    expect(out).not.toContain('var(--k-')
  })

  it('matches snapshot for soft + cobalt sample', () => {
    expect(genAstryx(sampleCfg)).toMatchSnapshot()
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

describe('genContract (Fase D1 — the machine-readable contract)', () => {
  it('produces valid JSON with the contract shape + token vocabulary', () => {
    const c = JSON.parse(genContract(sampleCfg))
    expect(c.$schema).toContain('uicockpit.com/contract')
    expect(c.contractVersion).toBe(1)
    expect(c.config.colorTheme).toBe('cobalt')
    // the flat token vocabulary the checker resolves against
    expect(c.tokens['--k-primary']).toBeTruthy()
    expect(Object.keys(c.tokens).length).toBeGreaterThan(80)
    // dark deltas present (and a strict subset of the light tokens)
    expect(Object.keys(c.tokensDark).length).toBeGreaterThan(0)
  })

  it('serialises the component graph + extracted BEM class vocabulary', () => {
    const c = JSON.parse(genContract(sampleCfg))
    // the tier graph + uses edges, straight from segments. data-table was promoted
    // to the SECTION tier (Tailwind-style "a section is a full part of a page"); its
    // uses edges are unchanged (it still parents the table atom).
    expect(c.components.tiers.section).toContain('data-table')
    expect(c.components.recipes['data-table'].tier).toBe('section')
    expect(c.components.recipes['data-table'].uses).toContain('table')
    // BEM extraction from the static recipe CSS
    expect(c.components.classes.btn).toBeTruthy()
    expect(c.components.classes.btn.modifiers).toContain('primary')
    expect(c.components.classes.card.parts).toContain('head')
    // the coverage worklist — a valid kit leaves no orphan atoms
    expect(c.components.orphans).toEqual([])
  })

  it('ships the rules as data, with machine-checkable checks tagged', () => {
    const c = JSON.parse(genContract(sampleCfg))
    const checks = c.rules.filter((r: { check?: string }) => r.check).map((r: { check: string }) => r.check)
    expect(checks).toContain('tokens-exist')
    expect(checks).toContain('no-raw-color')
    expect(checks).toContain('known-modifiers')
    expect(c.rules.find((r: { id: string }) => r.id === 'tokens-exist').severity).toBe('error')
  })

  it('matches snapshot for soft + cobalt sample', () => {
    expect(genContract(sampleCfg)).toMatchSnapshot()
  })
})

describe('genDesignMd', () => {
  it('embeds the human spec (genBrief) and the agent appendix', () => {
    const out = genDesignMd(sampleCfg)
    expect(out).toContain('# UI Kit Brief') // genBrief body
    expect(out).toContain('## For your AI agent') // the delimited appendix
    expect(out).toContain('The component model') // componentModel composition contract
    expect(out).toContain('npx uicockpit check') // the verify step
  })

  it('embeds the tokens exactly once (no double dump)', () => {
    const out = genDesignMd(sampleCfg)
    expect(out.match(/--k-primary:/g)?.length).toBeGreaterThan(0)
    // genBrief embeds tokens.css once; the agent appendix must NOT re-dump them.
    expect(out.split('## Design tokens (light + dark)').length).toBe(2)
  })

  it('matches snapshot for soft + cobalt sample', () => {
    expect(genDesignMd(sampleCfg)).toMatchSnapshot()
  })
})

describe('genSkill', () => {
  it('reads as imperative always/never rules with a verify loop', () => {
    const out = genSkill(sampleCfg)
    expect(out).toContain('## Always')
    expect(out).toContain('## Never')
    expect(out).toContain('npx uicockpit check')
    expect(out).toContain('var(--k-primary)')
  })

  it('carries this kit\'s resolved facts (brand hex + scale)', () => {
    const out = genSkill(sampleCfg)
    expect(out).toContain('comfortable') // sampleCfg.scale
    expect(out).toContain('40px') // comfortable control height
  })

  it('matches snapshot for soft + cobalt sample', () => {
    expect(genSkill(sampleCfg)).toMatchSnapshot()
  })
})
