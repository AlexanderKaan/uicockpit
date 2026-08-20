/* node --test color.test.mjs — the maths, held to what it claims.
 * This is the only module here allowed to compute a value rather than read one,
 * so it is the only one that needs testing for what it INVENTS. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { okAccentScale, okNeutralScale, nameColor, contrast, hexToOklch, readableInk } from './color.mjs'

const L = (s) => Number(/oklch\(([\d.]+)%/.exec(s)[1])
const C = (s) => Number(/oklch\([\d.]+%\s+([\d.]+)/.exec(s)[1])

test('a ramp goes light to dark, without ever turning back', () => {
  const ramp = okAccentScale('#0b6e8a', false)
  assert.ok(ramp.length >= 10, 'a ramp shorter than the kits ask for is not a ramp')
  for (let i = 1; i < 8; i++) {
    assert.ok(L(ramp[i]) < L(ramp[i - 1]), `step ${i} is lighter than the one before it`)
  }
})

test('the colour you gave is IN the ramp, not near it', () => {
  /* If a generator quietly shifts the hex someone typed, every screenshot they
     ever match against is off by a little and they cannot tell why. */
  const given = hexToOklch('#0b6e8a')
  const step = /oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)/.exec(okAccentScale('#0b6e8a', false)[8])
  assert.ok(Math.abs(Number(step[1]) / 100 - given[0]) < 0.005, 'lightness moved')
  assert.ok(Math.abs(Number(step[3]) - given[2]) < 0.5, 'hue moved')
})

test('neutrals are grey until you tint them, and then only a little', () => {
  const [, , hue] = hexToOklch('#0b6e8a')
  const mono = okNeutralScale(hue, 0, false, true)
  const tinted = okNeutralScale(hue, 30, false, false, 1)
  const more = okNeutralScale(hue, 30, false, false, 2)

  assert.equal(C(mono[3]), 0, 'mono means no chroma at all')
  assert.ok(C(tinted[3]) > 0, 'a tint has to be visible')
  assert.ok(C(tinted[3]) < 0.02, 'and a neutral that reads as a colour is not a neutral')
  assert.ok(C(more[3]) > C(tinted[3]), 'the multiplier has to move something')
  /* lightness is the ramp's job; a tint must not touch it */
  assert.equal(L(mono[3]), L(tinted[3]))
})

test('a colour gets a name a person would recognise', () => {
  for (const [hex, want] of [['#0b6e8a', /cyan|blue|teal/i], ['#c0392b', /red/i], ['#2fa14a', /green/i]]) {
    assert.match(nameColor(hex), want, `${hex} was called "${nameColor(hex)}"`)
  }
  assert.equal(nameColor('#0b6e8a'), nameColor('#0b6e8a'), 'the same colour keeps its name')
})

test('contrast is the floor everything else is measured against', () => {
  assert.ok(contrast('#000000', '#ffffff') > 20)
  assert.ok(contrast('#16181c', '#f7f9fa') >= 4.5, 'our own ink on our own page')
  assert.equal(readableInk('#ffffff'), '#16160c')
  assert.equal(readableInk('#0b6e8a'), '#ffffff')
})
