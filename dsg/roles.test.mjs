/* node --test roles.test.mjs
 *
 * The meter for the thing that will actually break this product: a kit renames
 * a variable in a minor release and every export we generate points at a name
 * that no longer exists. Nothing would warn — the CSS just does nothing. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { ROLES, MAP, route, coverage } from './roles.mjs'

const kit = (id) => JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))
const KITS = Object.fromEntries(Object.keys(MAP).map((id) => [id, kit(id)]))

test('every kit we map has values checked in', () => {
  for (const id of Object.keys(MAP)) {
    assert.ok(existsSync(`kits/${id}.json`), `${id} is mapped but has no fetched values — run fetch-kits.mjs`)
  }
})

test('every variable we write into exists in the kit that publishes it', () => {
  for (const [id, m] of Object.entries(MAP)) {
    const known = new Set(Object.values(kit(id).modes).flatMap((vars) => Object.keys(vars)))
    for (const role of ROLES) {
      const t = m[role.id]
      if (!t || t.new) continue           // `new` is one we add on purpose
      for (const name of [t.var, ...(t.also ?? [])]) {
        assert.ok(known.has(name), `${id}.${role.id} writes ${name}, which ${id} no longer publishes — the map is stale`)
      }
    }
  }
})

test('a role a kit cannot take is named, never silently dropped', () => {
  const daisy = coverage('daisyui')
  assert.deepEqual(daisy.missing.sort(), ['baseText', 'inkMuted', 'line'],
    'daisyUI has no muted ink and no border COLOUR — --border there is a width')
  assert.deepEqual(coverage('shadcn').missing, ['baseText'])
  assert.ok(coverage('tailwind').added.includes('brand'), 'Tailwind has no semantic brand; we add one')

  const [tw, sh, da] = route({ brand: '#0B6E8A', line: '#DFE2E7' }, ['tailwind', 'shadcn', 'daisyui'], KITS)
  assert.equal(tw.vars['--color-brand'], '#0B6E8A')
  assert.equal(sh.vars['--primary'], '#0B6E8A')
  assert.equal(da.vars['--color-primary'], '#0B6E8A')
  assert.ok(da.unroutable.includes('line'), 'daisyUI cannot take a line colour and the caller is told')
  assert.equal(sh.vars['--input'], '#DFE2E7', 'one knob keeps the kit\'s own siblings in step')
})

test('the width/colour trap stays caught', () => {
  /* Both kits publish `--border`. If the map ever pointed daisyUI's line role at
     it, this is the test that would notice — a colour written into a width. */
  assert.equal(MAP.daisyui.line, null)
  assert.equal(MAP.shadcn.line.var, '--border')
  const daisyBorder = Object.values(kit('daisyui').modes)[0]['--border']
  assert.match(daisyBorder ?? '', /rem|px|^\d/, 'daisyUI --border is a length; if this ever reads as a colour, re-check the map')
})

test('a kit nobody mapped is refused rather than half-written', () => {
  assert.throws(() => route({ brand: '#000' }, ['flowbite']), /no role map for kit "flowbite"/)
})

test('a length knob scales the kit\'s own ramp instead of flattening it', () => {
  const [tw, , da] = route({ radius: '1rem' }, ['tailwind', 'shadcn', 'daisyui'], KITS)

  /* Tailwind ships sm .25 / md .375 / lg .5 — a ramp. Setting lg to 1rem must
     keep the other two proportional, not make all three the same. */
  assert.equal(tw.vars['--radius-lg'], '1rem')
  assert.equal(tw.vars['--radius-md'], '0.75rem')
  assert.equal(tw.vars['--radius-sm'], '0.5rem')
  assert.notEqual(tw.vars['--radius-sm'], tw.vars['--radius-lg'], 'a ramp is not one value three times')

  /* daisyUI's own three differ deliberately too — and the ratio is asserted
     from what they PUBLISH, not from what we remember. The first version of
     this test hard-coded box=1rem; daisyUI ships 0.5rem, so the test was wrong
     and the code was right. Reading the source is the whole point. */
  const own = Object.assign({}, ...Object.values(KITS.daisyui.modes))
  const num = (v) => Number(/^(-?[\d.]+)/.exec(v)[1])
  for (const sib of ['--radius-field', '--radius-selector']) {
    const published = num(own[sib]) / num(own['--radius-box'])
    const routed = num(da.vars[sib]) / num(da.vars['--radius-box'])
    assert.ok(Math.abs(published - routed) < 1e-6, `${sib}: their ratio ${published} became ${routed}`)
  }
})

test('a ratio we cannot read is left alone and reported', () => {
  const [tw] = route({ radius: '12' }, ['tailwind'], KITS)   // no unit
  assert.deepEqual(tw.unscaled, ['--radius-md', '--radius-sm'])
  assert.equal(tw.vars['--radius-md'], undefined, 'better their value than our guess')
})
