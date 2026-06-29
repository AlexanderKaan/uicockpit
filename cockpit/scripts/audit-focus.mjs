#!/usr/bin/env node
/**
 * audit-focus.mjs — Invariant I3 (focus-visible) gate.
 *
 * WHY: keyboard focus is the one state a sighted-but-mouseless user lives in. The
 * kit handles it CENTRALLY (a universal `:focus-visible` ring + an inset variant for
 * container-bound children, in globalLayer.ts), so coverage is complete by default.
 * The only way to LOSE it is for a recipe to suppress the ring (`outline: none/0`)
 * without putting a replacement somewhere. That's legitimate in two patterns —
 * the focus moves to a WRAPPER (`:focus-within` ring on the field) or to a CHILD
 * (the slider knob) — but a bare suppression with nowhere for the ring to go is a
 * silent accessibility regression. This gate flags exactly that.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const SRC = 'src/kit/recipes/index.ts'

// Roots whose focus legitimately lands elsewhere (container `:focus-within` or a
// child element), so the root/child suppressing its own outline is correct.
const ALLOWLIST = {
  slider: 'the track has role=slider tabindex; the focus halo sits on .slider__knob',
  numinput: 'per-step buttons suppress; the .numinput container shows a :focus-within ring',
}

const css = readFileSync(resolve(ROOT, SRC), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))

const fails = []
for (const m of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
  const selector = m[1].trim()
  const body = m[2]
  if (!/:focus(-visible)?/.test(selector)) continue
  if (!/outline\s*:\s*(none|0)\b/.test(body)) continue
  // Replacement present in the same rule → fine.
  if (/box-shadow\s*:/.test(body)) continue
  // The wrapped-field pattern: the suppression is on the inner editable element (a
  // nested `input`, or the `__field` part), and the WRAPPER carries the focus ring
  // via :focus-within — legitimate.
  if (/\binput(?:[:.[]|\s|$)/.test(selector) || /__field(?:[:.[]|\s|$)/.test(selector)) continue
  // Allowlisted if ANY class (root or root__part) in the selector is a known
  // wrapper/child-focus root.
  if (Object.keys(ALLOWLIST).some((r) => new RegExp(`\\.${r}(?=__|[:.\\[\\s]|$)`).test(selector))) continue
  const line = css.slice(0, m.index + m[1].length).split('\n').length
  fails.push({ line, selector: selector.slice(0, 80) })
}

if (fails.length) {
  console.error('=== audit:focus — Invariant I3 (focus-visible) ===')
  for (const f of fails) {
    console.error(`  ✗ ${SRC}:${f.line} — '${f.selector}' kills the focus ring with no replacement.`)
    console.error('      Put the ring on a wrapper (:focus-within) or a child, or keep the outline — never drop it bare.')
  }
  console.error(`\n${fails.length} focus suppression(s) leave a keyboard user with no signal.`)
  process.exit(1)
}
console.log('audit:focus — clean (no recipe drops the focus ring without a replacement; I3 holds)')
