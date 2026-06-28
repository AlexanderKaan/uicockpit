import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aliasBlock } from '../src/init.mjs'

/* aliasBlock is the pure core of the Phase 3b brownfield adoption: it turns the
 * uicockpit.json `aliasMap` into a trailing :root override that makes the kit
 * tokens adopt the host app's existing values. (The fetch/write shell is e2e.) */

test('empty / missing aliasMap → no block', () => {
  assert.equal(aliasBlock({}), '')
  assert.equal(aliasBlock(undefined), '')
})

test('a `--` value is wrapped in var(); a literal is used verbatim', () => {
  const css = aliasBlock({ '--k-primary': '--brand-500', '--k-bg': '#fafafa' })
  assert.match(css, /:root\s*\{/)
  assert.match(css, /--k-primary:\s*var\(--brand-500\);/)
  assert.match(css, /--k-bg:\s*#fafafa;/)
})

test('an existing var(...) value passes through untouched', () => {
  const css = aliasBlock({ '--k-fg': 'var(--ink, #111)' })
  assert.match(css, /--k-fg:\s*var\(--ink, #111\);/)
})

test('non-token keys are ignored (only --* custom properties)', () => {
  const css = aliasBlock({ 'primary': '--brand', '--k-accent': '--brand' })
  assert.ok(!css.includes('primary:'))
  assert.match(css, /--k-accent:\s*var\(--brand\);/)
})
