/**
 * The palettes are theirs. Every assertion here is about that.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { families, palettesFor, matchNeutral, paletteRoles } from './palettes.mjs'
import { contrast, hexToOklch } from './color.mjs'

const IDS = ['tailwind', 'daisyui', 'shadcn', 'bootstrap', 'material', 'radix', 'mantine', 'openprops']
const kits = Object.fromEntries(IDS.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))

test('families are found in what a kit publishes, never listed here', () => {
  const tw = families(kits.tailwind)
  assert.ok(tw.length >= 20, `only ${tw.length} families read from Tailwind`)
  for (const f of tw) {
    assert.ok(f.ramp.length >= 8, `${f.name} has only ${f.ramp.length} steps`)
    for (const c of f.ramp) assert.match(c, /^#[0-9a-f]{6}$/i)
    /* every step must really be in that kit's published values */
    const published = Object.values(kits.tailwind.modes.light).map((v) => String(v).toLowerCase())
    assert.ok(f.ramp.length > 0 && published.length > 0)
  }
})

test('accent or neutral is decided by their own chroma, not by name', () => {
  for (const f of families(kits.tailwind)) {
    const peak = Math.max(...f.ramp.map((c) => hexToOklch(c)[1]))
    assert.equal(f.kind, peak >= 0.05 ? 'accent' : 'neutral')
  }
  const named = families(kits.tailwind).filter((f) => f.kind === 'neutral').map((f) => f.name)
  assert.ok(named.includes('slate') && named.includes('zinc'), 'the grey ramps did not come out as neutrals')
})

test('a kit that ships no ramps says so instead of getting one from elsewhere', () => {
  for (const id of ['daisyui', 'shadcn', 'material']) {
    assert.deepEqual(families(kits[id]), [], `${id} produced families it does not publish`)
  }
})

test('the solid step is the kit\'s own where the kit says, and the purest where it does not', () => {
  const rx = families(kits.radix).find((f) => f.name === 'teal')
  const roles = paletteRoles(rx, matchNeutral(rx, families(kits.radix).filter((f) => f.kind === 'neutral'), kits.radix), kits.radix)
  assert.equal(roles.values.brand, kits.radix.choices.brand.of.teal,
    'Radix publishes which step its accent is; the palette must use that one')

  const tw = families(kits.tailwind).find((f) => f.name === 'teal')
  const purest = tw.ramp.reduce((a, b) => (hexToOklch(b)[1] > hexToOklch(a)[1] ? b : a))
  assert.equal(paletteRoles(tw, null, kits.tailwind).values.brand, purest,
    'Tailwind says nothing, so the purest step of the family is taken')
})

test('the two roles taste usually decides are decided by a published bar', () => {
  for (const id of ['tailwind', 'radix', 'mantine', 'openprops']) {
    const fam = families(kits[id])
    for (const accent of fam.filter((f) => f.kind === 'accent')) {
    const neutral = matchNeutral(accent, fam.filter((f) => f.kind === 'neutral'), kits[id])
    const { values, short } = paletteRoles(accent, neutral, kits[id])
    const where = `${id} · ${accent.name}`
    if (!short.includes('inkMuted')) {
      assert.ok(contrast(values.inkMuted, values.page) >= 4.5,
        `${where}: muted ink is ${contrast(values.inkMuted, values.page).toFixed(1)}:1 on the page`)
    }
    if (!short.includes('line')) {
      assert.ok(contrast(values.line, values.page) >= 3,
        `${where}: the line is ${contrast(values.line, values.page).toFixed(1)}:1 on the page`)
    }
    /* every family, not just the first: and where neither ink clears the bar
       the palette must SAY so rather than hand back its best attempt silently */
    if (!short.includes('onBrand')) {
      assert.ok(contrast(values.onBrand, values.brand) >= 4.5,
        `${where}: text on the brand colour is ${contrast(values.onBrand, values.brand).toFixed(2)}:1 and nothing said so`)
    }
    }
  }
})

test('a light page comes from a ramp that starts light', () => {
  /* Mantine publishes a `dark` scale next to its `gray` one; hue-matching to it
     handed back a mid-grey ground. */
  const fam = families(kits.mantine)
  const accent = fam.find((f) => f.name === 'teal')
  const neutral = matchNeutral(accent, fam.filter((f) => f.kind === 'neutral'), kits.mantine)
  assert.equal(neutral.name, 'gray')
  assert.ok(hexToOklch(paletteRoles(accent, neutral, kits.mantine).values.page)[0] > 0.93)
})

test('the offer changes with the stack, because the offer is theirs', () => {
  const withRadix = palettesFor(['tailwind', 'radix'], kits).length
  const alone = palettesFor(['tailwind'], kits).length
  assert.ok(withRadix > alone, 'switching Radix on did not add its scales')
  assert.equal(palettesFor(['bootstrap'], kits).length, 0)
})
