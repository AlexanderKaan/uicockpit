/* The BINDING certificate — generated from real measurement, not typed.
 * Contrast floors across every theme × mode the binding can be themed to. */
import { writeFileSync } from 'node:fs'
import { buildTokens } from '../cockpit/src/tokens/buildTokens'
import { DEFAULT_CONFIG } from '../cockpit/src/tokens/defaults'
import { auditContrast } from '../cockpit/src/tokens/extras'
import { COLOR_THEMES } from '../cockpit/src/tokens/stylesAndThemes'
import type { Config, Mode, Scale } from '../cockpit/src/tokens/types'

const modes: Mode[] = ['light', 'dark']
const scales: Scale[] = ['compact', 'default', 'comfortable']
const themes = Object.keys(COLOR_THEMES) as (keyof typeof COLOR_THEMES)[]

let combos = 0, pairs = 0, failed: string[] = []
for (const theme of themes) for (const mode of modes) for (const scale of scales) {
  const cfg = { ...DEFAULT_CONFIG, colorTheme: theme, cPrimary: COLOR_THEMES[theme].cPrimary, mode, scale } as Config
  const tokens = buildTokens(cfg)
  const audit = auditContrast(tokens)
  combos++; pairs += audit.length
  for (const p of audit) if (!p.passes) failed.push(`${theme}/${mode}/${scale}: ${p.label} ${p.ratio.toFixed(2)}:1 < ${p.min}`)
}
const cert = {
  binding: 'kit@0.1',
  generated: '2026-08-17',
  method: 'buildTokens × auditContrast over every theme × mode × density; WCAG 1.4.3 / 1.4.11 floors',
  combinations: combos, pairsChecked: pairs,
  certified: failed.length === 0,
  failures: failed.slice(0, 10),
  alsoMeasuredInCI: ['2.5.8 target size (axe, rendered, 3 widths)', '2.4.7 focus visible (measured before/after focus)', '1.4.10 reflow @320px'],
}
writeFileSync('./binding.json', JSON.stringify(cert, null, 2))
console.log(`${combos} configuraties · ${pairs} contrastparen · ${failed.length ? '✗ ' + failed.length + ' fouten' : '✓ alles boven de vloer'}`)
