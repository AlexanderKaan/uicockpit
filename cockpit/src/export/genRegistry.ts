import { buildTokens } from '../tokens/buildTokens'
import type { Config } from '../tokens/types'
import { MAP } from './genShadcn'

/**
 * shadcn **registry-theme** JSON — the format `npx shadcn add <url>` consumes.
 *
 * This is the distribution beachhead the modern field standardised on: the user
 * hosts this file (or pastes it), runs the shadcn CLI, and the theme's CSS
 * variables are written straight into THEIR project — instantly re-skinning
 * every Radix/Base-UI-based shadcn component. It meets the primitives-first
 * crowd where they already live, instead of asking them to copy a CSS block.
 *
 * Schema: a `registry:theme` item (registry-item.json) whose `cssVars` carries
 * `light` + `dark` maps. Keys are WITHOUT the leading `--` (the CLI adds it);
 * values are our OKLCH token strings. Reuses the SAME `MAP` as the standalone
 * globals.css (genShadcn) so the two shadcn surfaces never diverge.
 *
 * Usage (emitted as a banner is impossible in pure JSON, so it lives in the
 * Export modal hint): host the file → `npx shadcn@latest add https://you/theme.json`,
 * or pass a local path with a recent CLI.
 */

const strip = (v: string | number | undefined): string | undefined =>
  v === undefined ? undefined : String(v)

function cssVarsFor(vars: Record<string, string | number>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const { shadcn, cockpit } of MAP) {
    const v = strip(vars[cockpit])
    if (v !== undefined) out[shadcn] = v
  }
  const radius = strip(vars['--k-radius-md'])
  if (radius) out['radius'] = radius
  return out
}

export function genRegistry(cfg: Config): string {
  const light = buildTokens({ ...cfg, mode: 'light' }).vars
  const dark = buildTokens({ ...cfg, mode: 'dark' }).vars
  // Stable, human-meaningful name derived from the chosen Color theme + Scale,
  // sanitised to the registry's lowercase-dash convention.
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const name = `uicockpit-${slug(cfg.colorTheme)}-${slug(cfg.scale)}`

  const item = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name,
    type: 'registry:theme',
    cssVars: {
      light: cssVarsFor(light),
      dark: cssVarsFor(dark),
    },
  }
  return JSON.stringify(item, null, 2) + '\n'
}
