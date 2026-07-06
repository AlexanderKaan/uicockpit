import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rewriteKitLink } from '../src/template.mjs'

/* rewriteKitLink (LP4) — the one transform the template command performs:
 * swap the default-kit stylesheet for the user's kit, anchored on the
 * data-uicockpit-kit attribute the generator emits before the href. */

const TPL = '<link rel="stylesheet" data-uicockpit-kit href="https://kit.uicockpit.com/k/DEFAULT.css">\n<link rel="stylesheet" href="https://example.com/other.css">'

test('rewrites ONLY the kit link, URL-encoding the hash', () => {
  const out = rewriteKitLink(TPL, 'v2:abc+def')
  assert.ok(out.includes('data-uicockpit-kit href="https://kit.uicockpit.com/k/v2%3Aabc%2Bdef.css"'))
  assert.ok(out.includes('https://example.com/other.css')) // untouched
  assert.ok(!out.includes('DEFAULT.css'))
})

test('honours a custom CDN base', () => {
  const out = rewriteKitLink(TPL, 'h1', 'http://localhost:8787')
  assert.ok(out.includes('data-uicockpit-kit href="http://localhost:8787/k/h1.css"'))
})

test('no kit link present → no-op', () => {
  const plain = '<link rel="stylesheet" href="a.css">'
  assert.equal(rewriteKitLink(plain, 'h1'), plain)
})
