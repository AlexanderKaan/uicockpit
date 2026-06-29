#!/usr/bin/env node
/**
 * audit-state-edge.mjs — Invariant I2 (selected-state legibility) gate.
 *
 * WHY: an active/selected state must survive a FLAT surface depth — where shadows
 * and neutral tonal steps (surface-on-bg) collapse. A selected-state that signals
 * itself with a NEUTRAL background wash alone (`--k-state-hover`, `--k-surface`)
 * and no chromatic fill or edge becomes invisible at Flat depth (the icon-picker
 * "which one is selected?" bug). The fix is a depth-independent cue: a chromatic
 * fill (`--k-primary*`) OR an edge (`--k-selected-edge` inset ring / a coloured
 * border). This gate flags any kit selected-state rule that ships the collapse.
 *
 * Scope: the EXPORTED kit (recipes/index.ts) — what a consumer actually gets.
 * Text-only cues (a chromatic `color:` change, e.g. nav items) are fine: colour is
 * itself depth-independent, so a rule that sets no background isn't a collapse.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const SRC = 'src/kit/recipes/index.ts'

// A selector that denotes a selected / active / checked state.
const STATE_SEL = /(?:--on|--active|--selected)(?![\w-])|\[aria-selected="true"\]|\[aria-checked="true"\]/
// A background that COLLAPSES at Flat surface depth — a NEUTRAL surface-elevation
// step (surface-on-bg). NB `--k-state-hover` / `--k-state-press` are alpha OVERLAYS,
// not tonal steps: they stay visible at any depth, so they are NOT a collapse (an
// active-vs-hover distinguishability concern is a different invariant, not I2).
const NEUTRAL_BG = /var\(--k-(?:surface(?:-2|-sunken|-container[\w-]*)?|bg)\b/
// A chromatic fill — depth-independent (brand tint / solid / selected tint).
const CHROMATIC = /var\(--k-(?:primary|secondary|accent|grad-\d|state-selected)/
// A depth-independent EDGE — the token, an inset shadow, or a coloured border.
const EDGE = /var\(--k-selected-edge\)|box-shadow\s*:[^;]*\binset\b|border(?:-color|-left|-right|-top|-bottom)?\s*:[^;]*var\(--k-(?:ring|primary|border|state-border)/

// Deliberate exceptions — a one-line reason each (an honest allowlist, not a hole).
// Empty for now: every kit selected-state that paints a surface step carries the
// edge; the state-hover-cursor rows (cmdp/combobox/searchinput) are overlays, not
// collapses, so they need no exception.
const ALLOWLIST = {}

const css = readFileSync(resolve(ROOT, SRC), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))

const fails = []
for (const m of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
  // Strip :not(...) so a `:not(.x--on):active` press rule on UNSELECTED elements
  // isn't read as a selected-state.
  const selector = m[1].trim()
  const sel = selector.replace(/:not\([^)]*\)/g, '')
  const body = m[2]
  if (!STATE_SEL.test(sel)) continue
  // Only a rule that paints a NEUTRAL background can collapse. No background
  // (text-only / an override like box-shadow:none) → not a collapse case.
  const bg = body.match(/background(?:-color)?\s*:\s*([^;]+)/)
  if (!bg || /transparent|none|inherit/.test(bg[1])) continue
  if (!NEUTRAL_BG.test(bg[1])) continue // chromatic / literal fill → fine
  if (CHROMATIC.test(body) || EDGE.test(body)) continue // has a depth-independent cue
  const key = (selector.match(/[\w-]+--(?:on|active|selected)/) || [])[0] || selector
  if (ALLOWLIST[key]) continue
  const line = css.slice(0, m.index + m[1].length).split('\n').length
  fails.push({ line, selector: selector.slice(0, 80) })
}

if (fails.length) {
  console.error('=== audit:state-edge — Invariant I2 (selected-state legibility) ===')
  for (const f of fails) {
    console.error(`  ✗ ${SRC}:${f.line} — '${f.selector}' signals "selected" with a neutral wash only.`)
    console.error('      Add a depth-independent cue: var(--k-selected-edge) in box-shadow, or a chromatic fill.')
  }
  console.error(`\n${fails.length} selected-state(s) collapse at Flat surface depth. Give each an edge or a chromatic fill (or allowlist with a reason).`)
  process.exit(1)
}
console.log('audit:state-edge — clean (every selected-state carries a depth-independent cue; I2 holds)')
