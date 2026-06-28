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
