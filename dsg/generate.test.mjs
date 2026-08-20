/* node --test generate.test.mjs — the fast checks on the package's SHAPE.
 * Whether it actually builds is build-proof.mjs; that one needs the network. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { generate } from './generate.mjs'
import { MAP } from './roles.mjs'

const ALL = Object.keys(MAP)
const KITS = Object.fromEntries(ALL.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))
const VALUES = { brand: '#0B6E8A', onBrand: '#ffffff', page: '#F7F9FA', surface: '#FFFFFF',
  ink: '#16181C', inkMuted: '#5C6B72', line: '#DFE2E7', radius: '12px', baseText: '1rem' }

test('every kit gets a block, in the form that kit reads', () => {
  const f = generate(VALUES, ALL, KITS)
  const css = f['theme.css']
  assert.match(css, /@theme \{/, 'Tailwind takes @theme')
  assert.match(css, /@plugin "daisyui\/theme" \{/, 'daisyUI takes a named @plugin theme')
  assert.match(css, /--bs-body-bg: #F7F9FA/, 'Bootstrap takes its own --bs-* names')
  assert.match(css, /--md-sys-color-primary: #0B6E8A/, 'Material takes the seed')
  assert.match(css, /--primary: #0B6E8A/, 'shadcn takes its unprefixed semantics')
})

test('a kit with no emitter is refused, never shipped as an empty theme', () => {
  const fake = { ...KITS, ghost: { id: 'ghost', name: 'Ghost', modes: { light: {} } } }
  const withMap = { ...MAP }
  assert.throws(() => generate(VALUES, ['tailwind', 'ghost'], fake), /no role map for kit "ghost"/)
})

test('the kits that need more than CSS get their extra file', () => {
  const f = generate(VALUES, ['bootstrap', 'shadcn'], KITS)
  assert.ok(f['_custom.scss'], 'Bootstrap needs a Sass entry point for its brand')
  assert.match(f['_custom.scss'], /\$primary: #0B6E8A;/)
  assert.match(f['_custom.scss'], /@import "bootstrap\/scss\/bootstrap"/)
  assert.ok(f['components.json'], 'shadcn is driven by components.json')
  assert.equal(JSON.parse(f['components.json']).tailwind.cssVariables, true)
})

test('the manifest states every kind of thing that could not be done', () => {
  const m = generate(VALUES, ALL, KITS)['MANIFEST.md']
  assert.match(m, /Bootstrap · brand\*\* — not settable at runtime/, 'needsBuild is named')
  assert.match(m, /Material 3 · .*— computed by the kit/, 'derived is named')
  assert.match(m, /daisyUI · inkMuted, line/, 'unroutable is named')
  assert.match(m, /Tailwind CSS · .*were ADDED/, 'added is named')
  /* and the licences come from the packages, not from anyone's memory */
  assert.match(m, /\| Material 3 \| 2\.5\.0 \| Apache-2\.0 \|/)
  assert.match(m, /\| Tailwind CSS \| [\d.]+ \| MIT \|/)
})

test('a clean run says so rather than printing an empty section', () => {
  const m = generate({ radius: '12px' }, ['shadcn'], KITS)['MANIFEST.md']
  assert.match(m, /Nothing — every value reached every kit you enabled\./)
})

test('nothing in the package is a value we invented', () => {
  const f = generate(VALUES, ALL, KITS)
  const set = new Set(Object.values(VALUES).map((v) => v.toLowerCase()))
  /* every colour literal in theme.css is either one the user set, or a scaled
     length derived from a published ratio — never a hex of ours */
  for (const m of f['theme.css'].matchAll(/#[0-9a-f]{3,8}\b/gi)) {
    assert.ok(set.has(m[0].toLowerCase()), `${m[0]} is in the package but nobody set it`)
  }
})
