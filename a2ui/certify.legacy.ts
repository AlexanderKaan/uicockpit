/* The BINDING certificate — generated from real measurement, not typed.
 * Contrast floors across every theme × mode × density the binding can be
 * themed to. Run it from a checkout of the archived library; see certify.ts.
 *
 * The pair list has two halves. auditContrast() is the library's own sweep —
 * text on every surface, buttons, semantic tones, input borders, focus ring.
 * The second half is added HERE, because binding to the A2UI Basic Catalog made
 * the kit render things the library never had a recipe for: a selected tab
 * indicator, a checked control, a slider track. Those are non-text contrast
 * (WCAG 1.4.11, 3:1), and a certificate that did not name them would be
 * claiming to have measured what it never looked at. */
import { writeFileSync } from 'node:fs'
import { buildTokens } from './src/tokens/buildTokens'
import { DEFAULT_CONFIG } from './src/tokens/defaults'
import { auditContrast } from './src/tokens/extras'
import { COLOR_THEMES } from './src/tokens/stylesAndThemes'
import { contrast, oklchStrToHex } from './src/tokens/color'
import type { Config, Mode, Scale } from './src/tokens/types'

const modes: Mode[] = ['light', 'dark']
const scales: Scale[] = ['compact', 'default', 'comfortable']
const themes = Object.keys(COLOR_THEMES) as (keyof typeof COLOR_THEMES)[]

/* label, foreground token, background token, floor.
 *
 * A floor of 0 means MEASURED BUT NOT REQUIRED. The first version of this list
 * put dividers at 3:1 and they failed 60 out of 60 — not because the kit is
 * broken but because the rule was wrong: 1.4.11 covers the boundaries of UI
 * components and graphics you need to understand the content, and explicitly
 * not decoration. A separator whose meaning is already carried by role and
 * spacing is decoration. The number is kept because knowing it is useful; the
 * assertion is dropped because it was not ours to make. */
const A2UI_PAIRS: Array<[string, string, string, number]> = [
  ['Selected tab indicator on surface', '--k-primary',       '--k-surface', 3],
  ['Checked checkbox/radio on surface', '--k-primary',       '--k-surface', 3],
  ['Slider track against surface',      '--k-input-border',  '--k-surface', 3],
  ['Divider against surface',           '--k-border',        '--k-surface', 0],
  ['Divider against background',        '--k-border',        '--k-bg',      0],
]

/* Tokens are emitted in OKLCH; comparing a raw hex against an oklch string
 * silently yields NaN and NaN >= 3 is false, which reads as a pass. Parse. */
const hex = (v: string) => (v?.trim().startsWith('oklch') ? oklchStrToHex(v) : v)

let combos = 0, clean = 0, pairs = 0
const failed: string[] = []
const informational: Record<string, number[]> = {}
let defaultPasses = true
for (const theme of themes) for (const mode of modes) for (const scale of scales) {
  const cfg = { ...DEFAULT_CONFIG, colorTheme: theme, cPrimary: COLOR_THEMES[theme].cPrimary, mode, scale } as Config
  const where = `${theme}/${mode}/${scale}`
  const tokens = buildTokens(cfg)
  const v = tokens.vars as Record<string, string>
  const audit = auditContrast(tokens)
  const before = failed.length
  combos++; pairs += audit.length + A2UI_PAIRS.length
  for (const p of audit) if (!p.passes) failed.push(`${where}: ${p.label} ${p.ratio.toFixed(2)}:1 < ${p.min}`)
  for (const [label, fg, bg, min] of A2UI_PAIRS) {
    const a = hex(v[fg]), b = hex(v[bg])
    if (!a || !b) { failed.push(`${where}: ${label} — ${!a ? fg : bg} is not emitted`); continue }
    const ratio = contrast(a, b)
    if (min === 0) { (informational[label] ??= []).push(Number(ratio.toFixed(2))); continue }
    if (!(ratio >= min)) failed.push(`${where}: ${label} ${ratio.toFixed(2)}:1 < ${min}`)
  }
  const ok = failed.length === before
  if (ok) clean++
  if (theme === DEFAULT_CONFIG.colorTheme && mode === DEFAULT_CONFIG.mode && !ok) defaultPasses = false
}
const cert = {
  binding: 'kit@0.1',
  generated: new Date().toISOString().slice(0, 10),
  method: 'buildTokens × auditContrast + the A2UI non-text pairs, over every theme × mode × density; WCAG 1.4.3 / 1.4.11 floors',
  combinations: combos, certifiedCombinations: clean, pairsChecked: pairs,
  /* certified means EVERY configuration held. It does not here, and the ones
   * that did not are named — a certificate that rounded 48/60 up to true would
   * be the exact thing this file exists to prevent. */
  certified: failed.length === 0,
  defaultConfiguration: `${DEFAULT_CONFIG.colorTheme}/${DEFAULT_CONFIG.mode}`,
  defaultPasses,
  failures: failed,
  measuredNotRequired: Object.fromEntries(Object.entries(informational)
    .map(([k, v]) => [k, `${Math.min(...v).toFixed(2)}:1 – ${Math.max(...v).toFixed(2)}:1 (1.4.11 exempts decoration)`])),
  /* NOT measured here. The archived library's rendered harness measured these on
   * ITS markup; this project emits different markup, and when that was finally
   * measured it was failing. Naming the difference is the whole point of a
   * certificate. */
  alsoMeasuredElsewhere: ["2.5.8 target size · 2.4.7 focus visible · 1.4.10 reflow — measured by the ARCHIVED library's rendered harness on its own markup, not on what these bindings emit. Measuring what they emit (2026-08-18) found four rows under 24px; those are fixed, but nothing here re-measures on every change."],
}
writeFileSync('../a2ui/binding.json', JSON.stringify(cert, null, 2) + '\n')
console.log(`${combos} configurations (${clean} clean) · ${pairs} contrast pairs · ${failed.length ? '✗ ' + failed.length + ' failures\n  ' + failed.join('\n  ') : '✓ all above the floor'}`)
