#!/usr/bin/env node
/**
 * audit-control-h.mjs — Invariant I1 (height harmony) gate.
 *
 * WHY: mixed controls in one horizontal row must share ONE height — the difference
 * between "a real control bar" and the pixel-drift the kit exists to kill. The kit
 * guarantees it with the `.toolbar` CONTAINER: it forces `height: var(--tb-h)` on
 * every control child. That guarantee is only as complete as that selector — a NEW
 * control type (a date trigger, a colour swatch) that isn't listed silently escapes
 * the row height and drifts. This gate asserts every member of the control family
 * appears in the toolbar height-invariant selector, so the container can't forget one.
 *
 * NB toggles / sliders / checkboxes / radios are NOT controls in this sense — they're
 * deliberately small (a switch is a 20px switch, not a 36px control) and align in a
 * row by CENTERING, not by sharing the control height. They are correctly absent.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const SRC = 'src/kit/recipes/index.ts'

// The control family — classes that line up at one row height in a control bar.
// (Source of truth: add a new row-height control here AND to the toolbar selector.)
const CONTROL_FAMILY = ['btn', 'in', 'select', 'select-trigger', 'searchinput', 'segctrl']

const css = readFileSync(resolve(ROOT, SRC), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))

// The toolbar height-invariant = the rule body that pins `height: var(--tb-h)`.
let selector = ''
for (const m of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
  if (/height\s*:\s*var\(--tb-h\)/.test(m[2]) && /\.toolbar/.test(m[1])) { selector += m[1] }
}

if (!selector) {
  console.error('audit:control-h — could not find the .toolbar height-invariant (height: var(--tb-h)). Did the toolbar recipe change?')
  process.exit(1)
}

const missing = CONTROL_FAMILY.filter((cls) => !new RegExp(`\\.${cls}(?![\\w-])`).test(selector))
if (missing.length) {
  console.error('=== audit:control-h — Invariant I1 (height harmony) ===')
  for (const cls of missing) {
    console.error(`  ✗ .${cls} is a control but is NOT in the .toolbar height-invariant selector — it will drift in a control bar.`)
    console.error(`      Add \`.toolbar > .${cls}, .toolbar__group > .${cls}\` to the rule that sets height: var(--tb-h).`)
  }
  console.error(`\n${missing.length} control(s) can escape the row height. The container must force every control.`)
  process.exit(1)
}
console.log(`audit:control-h — clean (all ${CONTROL_FAMILY.length} controls are held to the toolbar row height; I1 holds)`)
