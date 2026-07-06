import { buildTokens } from '../tokens/buildTokens'
import type { Config } from '../tokens/types'

/* genAstryx — emit a Meta Astryx `defineTheme` file from the kit (LP5b, golf 3).
 *
 * Astryx (astryx.atmeta.com, facebook/astryx) themes are TS files: token
 * overrides as [light, dark] tuples + typography/motion config, compiled by
 * `astryx theme build`. Their customization story is "pick 1 of 7 curated
 * themes or hand-write this file" — UIcockpit generates it from the visitor's
 * kit instead: the shadcn-globals.css distribution move, applied to Meta's
 * launch. We map the ~30 core semantic tokens (backgrounds, text, icons,
 * border, accent, status, overlay states, radius, shadows) and leave Astryx's
 * categorical hue ramps (teal/pink/…) to their defaults — a theme file only
 * needs to override what differs.
 *
 * Values are RESOLVED literals (OKLCH strings from buildTokens, light + dark
 * built separately), never var() references — the file must stand alone in an
 * Astryx project with no UIcockpit CSS present. */

/** First quoted family in a kit font stack → ['Family', 'rest, of, stack']. */
function splitStack(stack: string): { family: string; fallbacks: string } {
  const m = stack.match(/^'([^']+)'\s*,?\s*(.*)$/)
  if (!m) return { family: stack, fallbacks: '' }
  return { family: m[1]!, fallbacks: m[2] ?? '' }
}

const ms = (v: string | undefined, fallback: number): number => {
  const n = parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function genAstryx(cfg: Config): string {
  const light = buildTokens({ ...cfg, mode: 'light' }).vars as Record<string, string>
  const dark = buildTokens({ ...cfg, mode: 'dark' }).vars as Record<string, string>

  // One kit token → one Astryx token, as a [light, dark] tuple.
  const MAP: ReadonlyArray<readonly [string, string]> = [
    // Backgrounds — body is the canvas, surface lifts interactive components.
    ['--color-background-body', '--k-bg'],
    ['--color-background-surface', '--k-surface'],
    ['--color-background-card', '--k-surface'],
    ['--color-background-popover', '--k-surface'],
    ['--color-background-muted', '--k-surface-2'],
    // Accent — the brand pair.
    ['--color-accent', '--k-primary'],
    ['--color-accent-muted', '--k-primary-soft'],
    ['--color-on-accent', '--k-primary-fg'],
    // Text + icons.
    ['--color-text-primary', '--k-fg'],
    ['--color-text-secondary', '--k-fg-muted'],
    ['--color-text-disabled', '--k-fg-faint'],
    ['--color-text-accent', '--k-primary'],
    ['--color-icon-primary', '--k-fg'],
    ['--color-icon-secondary', '--k-fg-muted'],
    ['--color-icon-accent', '--k-primary'],
    ['--color-icon-disabled', '--k-fg-faint'],
    // Borders — emphasized maps to the WCAG-floored input border (≥3:1).
    ['--color-border', '--k-border'],
    ['--color-border-emphasized', '--k-input-border'],
    // Status.
    ['--color-success', '--k-success'],
    ['--color-success-muted', '--k-success-soft'],
    ['--color-on-success', '--k-success-fg'],
    ['--color-warning', '--k-warning'],
    ['--color-warning-muted', '--k-warning-soft'],
    ['--color-on-warning', '--k-warning-fg'],
    ['--color-error', '--k-danger'],
    ['--color-error-muted', '--k-danger-soft'],
    ['--color-on-error', '--k-danger-fg'],
    // Interaction tints + misc surfaces.
    ['--color-overlay-hover', '--k-state-hover'],
    ['--color-overlay-pressed', '--k-state-press'],
    ['--color-track', '--k-surface-2'],
    ['--color-skeleton', '--k-surface-2'],
    // Radius — element/container from the kit's scale.
    ['--radius-inner', '--k-radius-sm'],
    ['--radius-element', '--k-radius-md'],
    ['--radius-container', '--k-radius-lg'],
    // Shadows.
    ['--shadow-low', '--k-shadow-sm'],
    ['--shadow-med', '--k-shadow-md'],
    ['--shadow-high', '--k-shadow-lg'],
  ]

  const tuples = MAP
    .filter(([, k]) => light[k] && dark[k])
    .map(([astryx, k]) => {
      const l = light[k]!
      const d = dark[k]!
      const value = l === d ? `'${l}'` : `['${l}', '${d}']`
      return `    '${astryx}': ${value},`
    })
    .join('\n')

  const body = splitStack(light['--k-font-body'] ?? "'Inter'")
  const display = splitStack(light['--k-font-display'] ?? "'Inter'")
  const fast = ms(light['--k-dur-fast'], 125)
  const medium = ms(light['--k-dur'], 300)
  const slow = ms(light['--k-dur-slow'], 700)

  const themeName = String(cfg.colorTheme || 'uicockpit').toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return `// ${themeName}.astryx.ts — an Astryx theme generated from a UIcockpit kit.
//
// UIcockpit (https://uicockpit.com) is a design system generator; Astryx
// (https://astryx.atmeta.com) is one of its export targets. Re-tune the kit
// in the configurator and regenerate — this file only overrides the tokens
// that differ from Astryx's defaults, exactly as Astryx recommends.
//
// Usage: save under themes/, then compile with the Astryx CLI:
//   npx astryx theme build ./themes/${themeName}.astryx.ts

import {defineTheme} from '@astryxdesign/core/theme';

export const ${themeName.replace(/-([a-z0-9])/g, (_m: string, c: string) => c.toUpperCase())}Theme = defineTheme({
  name: '${themeName}',

  typography: {
    body: {family: '${body.family}'${body.fallbacks ? `, fallbacks: ${JSON.stringify(body.fallbacks)}` : ''}},
    heading: {family: '${display.family}'${display.fallbacks ? `, fallbacks: ${JSON.stringify(display.fallbacks)}` : ''}},
  },

  motion: {fast: ${fast}, medium: ${medium}, slow: ${slow}},

  tokens: {
${tuples}
  },
});
`
}
