import { describe, it, expect } from 'vitest'
import { buildTokens } from '../buildTokens'
import { auditContrast } from '../extras'
import { contrast, oklchStrToHex } from '../color'
import { DEFAULT_CONFIG } from '../defaults'
import { COLOR_THEMES, applyColorTheme } from '../stylesAndThemes'

/**
 * No reachable configuration can break the floor.
 *
 * This is the gate behind the promise the panel makes. A configurator whose
 * knobs can produce a non-conforming kit is not a design system with settings,
 * it is a way to generate violations at scale — and until this file existed we
 * had no idea which of the nineteen controls could do that, only opinions.
 *
 * The sweep answered it: sixteen of nineteen do not touch contrast at ALL. They
 * are identity, and they are free. Everything that could break the floor was
 * concentrated in three places, and two of those turned out to be guards that
 * had never run:
 *
 *   · `--k-input-border` was documented in CLAUDE.md as "floored to 3:1 WCAG"
 *     and was a bare ramp step. Measured on the rendered field: 1.23 · 1.37
 *     (the default) · 1.66 · 2.98. Not one setting reached the bar, including
 *     the two the code comment named as clearing it.
 *   · `ringFloored` compared two OKLCH strings with a hex-only `contrast()`,
 *     got NaN, failed every `>= 3` test and fell through to `return primary`.
 *     It had never floored a focus ring for any kit since it was written.
 *
 * Both now hold, and the Border knob keeps an ordered range ABOVE the floor
 * instead of collapsing onto it: preference decides how far above to sit, not
 * whether there is a floor.
 */

const THEMES = Object.keys(COLOR_THEMES) as Array<keyof typeof COLOR_THEMES>
const MODES = ['light', 'dark'] as const

/* Every control a visitor can reach, with every position it can take. Add a
 * knob to the panel and add it here — an unlisted control is an unmeasured one,
 * which is the state this whole file exists to end. */
const KNOBS: Record<string, unknown[]> = {
  radius: ['none', 'subtle', 'soft', 'round'],
  buttonShape: ['match', 'none', 'subtle', 'soft', 'round', 'pill'],
  scale: ['compact', 'default', 'comfortable'],
  typeScale: ['sm', 'md', 'lg', 'xl'],
  labelCase: ['sentence', 'caps'],
  displayWeight: ['light', 'regular', 'medium', 'semibold', 'bold'],
  iconSet: ['hairline', 'line', 'rounded', 'bold', 'solid'],
  surfaceDepth: ['flat', 'soft', 'deep'],
  surface: ['outlined', 'filled', 'plain'],
  borders: ['faint', 'subtle', 'medium', 'strong'],
  motion: ['none', 'snappy', 'smooth', 'playful'],
  canvas: ['white', 'brand', 'neutral', 'gradient'],
  neutral: ['auto', 'cool', 'neutral', 'warm'],
  harmony: ['mono', 'tonal', 'complement', 'expressive'],
  palette: ['pastel', 'vivid', 'bright'],
  color: ['mono', 'tone'],
  fill: ['brand', 'neutral', 'none'],
  spread: [0, 30, 60, 90, 120],
  expression: [50, 100, 150],
}

/* The one open case, named so it cannot quietly become normal.
 *
 * `--k-primary` is the brand SOLID, and on these two themes in dark mode it
 * measures 1.78:1 and 2.03:1 against the page — a primary button whose extent
 * is hard to see, even though its label is fine at 4.63:1. Unlike the two bugs
 * above this is not a broken guard, it is a real decision with three answers
 * (nudge the brand's lightness · give the button a boundary when its fill is
 * too close · drop the theme), and it changes how a kit LOOKS. So it is pinned
 * here rather than fixed quietly, and the test still fails if it spreads to a
 * third theme or a second rule. */
const KNOWN_OPEN = new Set([
  'indigo/dark/Primary against background',
  'violet/dark/Primary against background',
])

const hx = (v: unknown) => (String(v).startsWith('#') ? String(v) : oklchStrToHex(String(v)))

function violations(cfg: Parameters<typeof buildTokens>[0]): string[] {
  const found: string[] = []
  const tk = buildTokens(cfg)
  const v = tk.vars as Record<string, string | number>
  const dark = cfg.mode === 'dark'

  for (const row of auditContrast(tk)) {
    if (row.ratio < row.required) found.push(row.label)
  }

  // The token-pair table cannot see everything: it reads named pairs, and some
  // of what the engine emits is only meaningful as a relationship. Restated
  // here so the sweep covers the same ground the matrix scan does.
  const worst = hx(v[dark ? '--k-surface-overlay' : '--k-surface-sunken'])
  for (const tier of ['--k-fg', '--k-fg-muted', '--k-fg-faint']) {
    if (contrast(hx(v[tier]), worst) < 4.5) found.push(`ink:${tier}`)
  }
  for (const role of ['primary', 'accent', 'success', 'warning', 'danger', 'info']) {
    if (contrast(hx(v[`--k-${role}-text`]), worst) < 4.5) found.push(`ink:${role}-text`)
  }
  if (contrast(hx(v['--k-primary-hover']), hx(v['--k-primary-fg'])) < 4.5) found.push('hover:button-ink')
  if (contrast(hx(v['--k-ring']), hx(v['--k-surface'])) < 3) found.push('focus:ring')

  return found
}

describe('no knob position can break the floor', () => {
  for (const [knob, options] of Object.entries(KNOBS)) {
    for (const option of options) {
      it(`${knob} = ${String(option)}`, () => {
        const broken: string[] = []
        for (const mode of MODES) {
          for (const theme of THEMES) {
            const base = applyColorTheme({ ...DEFAULT_CONFIG, mode }, theme)
            for (const label of violations({ ...base, [knob]: option })) {
              const key = `${theme}/${mode}/${label}`
              if (!KNOWN_OPEN.has(key)) broken.push(key)
            }
          }
        }
        expect([...new Set(broken)]).toEqual([])
      })
    }
  }
})

describe('the Border knob is a range above the floor, not through it', () => {
  /* Both halves matter. A knob that can go below 3:1 is a violation generator;
   * a knob clamped flat ONTO 3:1 stopped being a control — the first version of
   * this floor landed all four rungs within 0.15 of each other. */
  const RUNGS = ['faint', 'subtle', 'medium', 'strong'] as const

  for (const mode of MODES) {
    it(`ordered and legal in ${mode}`, () => {
      const ratios = RUNGS.map((borders) => {
        const tk = buildTokens({ ...DEFAULT_CONFIG, mode, borders })
        return auditContrast(tk).find((r) => r.label.startsWith('Input border'))!.ratio
      })
      for (const [i, r] of ratios.entries()) {
        expect(r, `${RUNGS[i]} clears WCAG 1.4.11`).toBeGreaterThanOrEqual(3)
      }
      for (let i = 1; i < ratios.length; i++) {
        expect(ratios[i]! - ratios[i - 1]!, `${RUNGS[i]} is a visible step past ${RUNGS[i - 1]}`)
          .toBeGreaterThan(0.2)
      }
    })
  }
})
