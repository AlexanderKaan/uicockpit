#!/usr/bin/env node
/**
 * audit-layout.mjs — the layout contract gate (the "stop guessing placement" tool).
 *
 * WHY: the app surface (sections.tsx) is built from KIT recipes only. Layout is no
 * exception — a block must COMPOSE the layout primitives (.bento / .l-grid /
 * .l-stack / .l-cluster / panes) instead of hand-rolling a grid inline. A
 * hand-rolled `gridTemplateColumns` in a block is an un-tokenized, un-themed,
 * un-reusable layout decision — exactly the "internal layout we have to guess"
 * problem. This flags any inline grid-track definition in the app surface so the
 * placement contract can't silently rot.
 *
 * Gate: fails if sections.tsx declares an inline gridTemplate* (rewire to .bento /
 * .l-grid). Simple flex/centering idioms (display:flex, place-items) are allowed
 * — the law is "don't author grid TRACKS by hand", not "never use display".
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const APP_FILES = ['src/showcases/sections.tsx']
// Inline grid-track authoring — the hand-rolled-layout smell.
const BANNED = /gridTemplate(Columns|Rows)?\s*:/g

let fails = 0
for (const rel of APP_FILES) {
  const src = readFileSync(resolve(ROOT, rel), 'utf8')
  const lines = src.split('\n')
  lines.forEach((line, i) => {
    if (BANNED.test(line)) {
      fails++
      console.error(`  ✗ ${rel}:${i + 1} — inline grid-track in the app surface. Compose .bento / .l-grid instead.`)
      console.error(`      ${line.trim().slice(0, 110)}`)
    }
    BANNED.lastIndex = 0
  })
}

if (fails) {
  console.error(`\naudit:layout — ${fails} hand-rolled grid${fails > 1 ? 's' : ''} in the app surface. Blocks compose layout primitives; they don't author grid tracks.`)
  process.exit(1)
}
console.log('audit:layout — clean (no hand-rolled grids in the app surface; blocks compose .bento / .l-* primitives)')
