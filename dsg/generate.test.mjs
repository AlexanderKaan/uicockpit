/* node --test generate.test.mjs — the fast checks on the package's SHAPE.
 * Whether it actually builds is build-proof.mjs; that one needs the network. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { generate, collisions } from './generate.mjs'
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

test('a theme block that REPLACES carries the kit\'s own defaults underneath', () => {
  const css = generate(VALUES, ['daisyui'], KITS)['theme.css']
  /* --border is daisyUI's border WIDTH, and their checkbox is
     `border: var(--border) solid …`. Emitting only our routed values dropped it,
     the width fell to zero, and every checkbox on the wall vanished. */
  assert.match(css, /--border:/, 'a replacing theme must carry what it does not override')
  assert.match(css, /--depth:/)
  assert.match(css, /--color-primary: #0B6E8A/, 'and our value still wins')
  const theirs = Object.keys(KITS.daisyui.modes.light)
  for (const v of theirs) assert.ok(css.includes(v + ':'), `${v} went missing from a theme that replaces the theme`)
  /* And not only custom properties. Without color-scheme the browser falls back
     to its own preference: the hero shot came out dark, wearing daisyUI's
     factory purple, on a page whose whole claim is that your values won. */
  assert.match(css, /color-scheme: light;/)
})

test('a name two kits both use is reported, not left to load order', () => {
  const f = generate(VALUES, ['shadcn', 'daisyui'], KITS)
  const clash = f._collisions.find((c) => c.variable === '--border')
  assert.ok(clash, 'shadcn writes --border as a colour; daisyUI reads it as a width')
  assert.equal(clash.written, 'shadcn')
  assert.equal(clash.read, 'daisyui')
  assert.match(clash.theirValue, /px|rem/, "daisyUI's --border is a length")
  assert.match(f['MANIFEST.md'], /Names two kits both use/)
  assert.match(f['MANIFEST.md'], /Load their stylesheets in separate scopes/)
})

test('one kit alone has nothing to collide with', () => {
  assert.deepEqual(generate(VALUES, ['daisyui'], KITS)._collisions, [])
  assert.doesNotMatch(generate(VALUES, ['daisyui'], KITS)['MANIFEST.md'], /Names two kits/)
})

test('each kit can be taken on its own, without the others leaking in', () => {
  const f = generate(VALUES, ['shadcn', 'daisyui'], KITS)
  assert.doesNotMatch(f._blocks.daisyui, /--primary:/, "shadcn's variables must not be in daisyUI's block")
  assert.doesNotMatch(f._blocks.shadcn, /@plugin/, "daisyUI's plugin block must not be in shadcn's")
})

test('install.md says the one thing that makes daisyUI apply at all', () => {
  const md = generate(VALUES, ['daisyui'], KITS)['install.md']
  assert.match(md, /data-theme="yourkit"/, 'without it daisyUI\'s dark theme wins on a dark OS')
  assert.match(md, /prefersdark/, 'and the reason has to be in the file, not in our heads')
  assert.match(generate(VALUES, ['daisyui'], KITS)['theme.css'], /SET data-theme/)
})
