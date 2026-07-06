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
    { check: 'tokens-imported', severity: 'warn' },
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

test('cold-start: warns when the kit is used but its stylesheet is imported nowhere', () => {
  // Kit class used, no import anywhere → one tokens-imported warning.
  const v = checkContract(contract, [{ path: 'App.tsx', content: '<button className="btn btn--primary">Go</button>' }])
  const w = v.filter((x) => x.check === 'tokens-imported')
  assert.equal(w.length, 1)
  assert.ok(/imported nowhere|renders unstyled/.test(w[0].message))
})

test('cold-start: an import (local file or hosted link) clears the warning', () => {
  const local = checkContract(contract, [
    { path: 'main.tsx', content: "import './uicockpit.tokens.css'" },
    { path: 'App.tsx', content: '<button className="btn">Go</button>' },
  ])
  assert.deepEqual(local.filter((x) => x.check === 'tokens-imported'), [])
  const hosted = checkContract(contract, [{ path: 'index.html', content:
    '<link rel="stylesheet" href="https://kit.uicockpit.com/k/abc.css"><button class="btn">Go</button>' }])
  assert.deepEqual(hosted.filter((x) => x.check === 'tokens-imported'), [])
})

test('cold-start: no kit usage → no warning', () => {
  const v = checkContract(contract, [{ path: 'App.tsx', content: '<div className="my-own-thing">hi</div>' }])
  assert.deepEqual(v.filter((x) => x.check === 'tokens-imported'), [])
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

/* uicockpit-allow (LP7) — the sanctioned escape hatch: style-drift findings on an
 * annotated line are ACCEPTED (never gate) but stay visible as allowed exceptions. */

test('uicockpit-allow: marks the line\'s style findings allowed, with the reason', () => {
  const v = run([
    { path: 'a.css', content: '.x { color: #ff5500; padding: 13px; } /* uicockpit-allow: partner brand banner */' },
  ])
  const allowed = v.filter((x) => x.allowed)
  assert.equal(allowed.length, 2) // raw colour + off-grid padding, both sanctioned
  assert.ok(allowed.every((x) => x.reason === 'partner brand banner'))
})

test('uicockpit-allow without a reason still records the exception', () => {
  const v = run([
    { path: 'a.css', content: '.x { color: #ff5500; } /* uicockpit-allow */' },
  ])
  const allowed = v.filter((x) => x.allowed)
  assert.equal(allowed.length, 1)
  assert.equal(allowed[0].reason, '(no reason given)')
})

test('the hatch does NOT cover error-level reference checks', () => {
  const v = run([
    { path: 'a.css', content: '.x { color: var(--k-nope); } /* uicockpit-allow: nope */' },
  ])
  const err = v.find((x) => x.check === 'tokens-exist')
  assert.ok(err && !err.allowed) // broken reference is a bug, not taste
})

test('unannotated drift on other lines is still a plain warn', () => {
  const v = run([
    { path: 'a.css', content: '.x { color: #ff5500; } /* uicockpit-allow: ok */\n.y { color: #00ff55; }' },
  ])
  assert.equal(v.filter((x) => x.allowed).length, 1)
  assert.equal(v.filter((x) => x.check === 'no-raw-color' && !x.allowed).length, 1)
})

test('legacy uicockpit-allow-color keeps its silent colour-only behaviour', () => {
  const v = run([
    { path: 'a.css', content: '.x { color: #ff5500; padding: 13px; } /* uicockpit-allow-color */' },
  ])
  assert.equal(v.filter((x) => x.check === 'no-raw-color').length, 0) // silent skip
  const pad = v.find((x) => x.check === 'spacing-grid')
  assert.ok(pad && !pad.allowed) // -color tag does not sanction spacing
})
