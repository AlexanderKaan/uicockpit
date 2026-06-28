import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkContract } from '../src/check.mjs'

/* A minimal hand-built contract — the cockpit repo exercises the real generator;
 * here we just prove the core's rules fire against a known vocabulary. */
const contract = {
  name: 'test-kit',
  tokens: { '--k-primary': 'oklch(…)', '--k-s-16': '1rem', '--k-radius-md': '0.5rem' },
  components: { classes: { btn: { modifiers: ['primary', 'ghost'], parts: [] } } },
  compositions: {
    eyebrow: {
      selector: '.eyebrow',
      signature: [
        'color:var(--k-fg-muted)',
        'font-size:var(--k-type-eyebrow)',
        'letter-spacing:var(--k-track-eyebrow)',
        'text-transform:uppercase',
      ],
      minMatch: 3,
    },
  },
  rules: [
    { check: 'tokens-exist', severity: 'error' },
    { check: 'known-modifiers', severity: 'error' },
    { check: 'no-raw-color', severity: 'warn' },
    { check: 'spacing-grid', severity: 'warn' },
    { check: 'composition-reroll', severity: 'warn' },
  ],
}
const run = (files) => checkContract(contract, files)

test('passes clean code (real tokens + defined modifiers)', () => {
  const v = run([
    { path: 'a.css', content: '.x { color: var(--k-primary); padding: var(--k-s-16); }' },
    { path: 'a.tsx', content: '<button className="btn btn--primary" />' },
  ])
  assert.deepEqual(v.filter((x) => x.severity === 'error'), [])
})

test('errors on an unknown token', () => {
  const v = run([{ path: 'b.css', content: '.x { color: var(--k-nope); }' }])
  const e = v.find((x) => x.check === 'tokens-exist')
  assert.ok(e && e.severity === 'error')
})

test('errors on an undefined modifier of a kit class', () => {
  const v = run([{ path: 'b.tsx', content: '<a className="btn btn--bogus" />' }])
  assert.ok(v.find((x) => x.check === 'known-modifiers'))
})

test("ignores the consumer's own classes", () => {
  const v = run([{ path: 'c.tsx', content: '<div className="my-card__title--big" />' }])
  assert.deepEqual(v.filter((x) => x.check === 'known-modifiers'), [])
})

test('warns on raw colour but exempts token-definition lines', () => {
  const bad = run([{ path: 'd.css', content: '.x { color: #6b7280; }' }])
  assert.ok(bad.find((x) => x.check === 'no-raw-color'))
  const def = run([{ path: 'tokens.css', content: ':root {\n  --k-bg: #ffffff;\n}' }])
  assert.deepEqual(def.filter((x) => x.check === 'no-raw-color'), [])
})

test('warns on off-grid spacing only', () => {
  const v = run([{ path: 'e.css', content: '.a { padding: 13px; } .b { margin: 16px; }' }])
  const off = v.filter((x) => x.check === 'spacing-grid')
  assert.equal(off.length, 1)
  assert.ok(off[0].message.includes('13px'))
})

test('warns when a non-kit rule re-rolls a composition utility', () => {
  // The right tokens, but rebuilt under the consumer's own class = silent 2nd version.
  const v = run([{ path: 'f.css', content:
    '.kicker { text-transform: uppercase; letter-spacing: var(--k-track-eyebrow); font-size: var(--k-type-eyebrow); color: var(--k-fg-muted); }' }])
  const w = v.find((x) => x.check === 'composition-reroll')
  assert.ok(w && w.severity === 'warn')
  assert.ok(w.message.includes('eyebrow'))
})

test('does not flag the consumer overriding the kit class itself', () => {
  const v = run([{ path: 'g.css', content:
    '.eyebrow { letter-spacing: var(--k-track-eyebrow); text-transform: uppercase; color: var(--k-fg-muted); }' }])
  assert.deepEqual(v.filter((x) => x.check === 'composition-reroll'), [])
})

test('prefix: a prefixed kit class is still policed for modifiers', () => {
  const cfg = { prefix: 'uic-' }
  // bogus modifier on the prefixed btn → still flagged
  const bad = checkContract(contract, [{ path: 'a.tsx', content: '<a className="uic-btn--bogus" />' }], cfg)
  assert.ok(bad.find((x) => x.check === 'known-modifiers'))
  // a defined modifier → clean
  const ok = checkContract(contract, [{ path: 'b.tsx', content: '<a className="uic-btn--primary" />' }], cfg)
  assert.deepEqual(ok.filter((x) => x.check === 'known-modifiers'), [])
})

test('prefix: overriding the prefixed bundle class is not a re-roll', () => {
  const cfg = { prefix: 'uic-' }
  const v = checkContract(contract, [{ path: 'g.css', content:
    '.uic-eyebrow { letter-spacing: var(--k-track-eyebrow); text-transform: uppercase; color: var(--k-fg-muted); font-size: var(--k-type-eyebrow); }' }], cfg)
  assert.deepEqual(v.filter((x) => x.check === 'composition-reroll'), [])
})

test('allowColors (uicockpit.json) exempts a sanctioned foreign brand colour', () => {
  const css = [{ path: 'h.css', content: '.brand { color: #1da1f2; } .oops { color: #ff0000; }' }]
  // No config → both flagged.
  assert.equal(checkContract(contract, css).filter((x) => x.check === 'no-raw-color').length, 2)
  // Sanction one → only the un-sanctioned literal remains.
  const v = checkContract(contract, css, { allowColors: ['#1DA1F2'] })
  const w = v.filter((x) => x.check === 'no-raw-color')
  assert.equal(w.length, 1)
  assert.ok(w[0].message.includes('#ff0000'))
})

test('an inline uicockpit-allow-color tag exempts that line', () => {
  const v = checkContract(contract, [{ path: 'i.css', content:
    '.brand { color: #1da1f2; } /* uicockpit-allow-color */' }])
  assert.deepEqual(v.filter((x) => x.check === 'no-raw-color'), [])
})
