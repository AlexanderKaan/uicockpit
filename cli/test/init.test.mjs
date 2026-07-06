import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aliasBlock, prefixCss } from '../src/init.mjs'

/* prefixCss (Phase 3b prefix) — namespaces only the classes the kit defines. */
const ROOTS = new Set(['btn', 'card', 'in', 'num'])

test('empty prefix / no roots → no-op', () => {
  assert.equal(prefixCss('.btn { color: red }', '', ROOTS), '.btn { color: red }')
  assert.equal(prefixCss('.btn {}', 'uic-', new Set()), '.btn {}')
})

test('prefixes kit roots, parts and modifiers', () => {
  const out = prefixCss('.btn--primary {} .card__head {} .in:focus {}', 'uic-', ROOTS)
  assert.match(out, /\.uic-btn--primary/)
  assert.match(out, /\.uic-card__head/)
  assert.match(out, /\.uic-in:focus/)
})

test('leaves non-kit classes + the .dark hook untouched', () => {
  const out = prefixCss('.my-widget {} .dark .btn {} .container {}', 'uic-', ROOTS)
  assert.ok(out.includes('.my-widget'))
  assert.ok(out.includes('.dark .uic-btn')) // .dark stays, .btn prefixed
  assert.ok(out.includes('.container') && !out.includes('.uic-container'))
})

test('word boundary: .in does not match inside .inset / .input', () => {
  const out = prefixCss('.inset {} .input {} .in {}', 'uic-', ROOTS)
  assert.ok(out.includes('.inset') && !out.includes('.uic-inset'))
  assert.ok(out.includes('.input') && !out.includes('.uic-input'))
  assert.match(out, /\.uic-in\s*\{/)
})

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

/* agentDocsBlock + upsertMarkerBlock (LP3) — the marker-fenced pointer block
 * init maintains inside CLAUDE.md / .claude/CLAUDE.md / .cursorrules. */

import { agentDocsBlock, upsertMarkerBlock, AGENT_DOCS_START, AGENT_DOCS_END } from '../src/init.mjs'

test('agentDocsBlock carries the hash, the check gate and the pointers', () => {
  const b = agentDocsBlock('abc123')
  assert.ok(b.startsWith(AGENT_DOCS_START) && b.endsWith(AGENT_DOCS_END))
  assert.match(b, /kit `abc123`/)
  assert.match(b, /uicockpit check --strict/)
  assert.match(b, /AGENTS\.md/)
  assert.match(b, /design\.md/)
})

test('upsert into an empty file → just the block', () => {
  const out = upsertMarkerBlock('', agentDocsBlock('h1'))
  assert.ok(out.startsWith(AGENT_DOCS_START))
  assert.ok(out.endsWith(AGENT_DOCS_END + '\n'))
})

test('upsert appends to existing content without touching it', () => {
  const out = upsertMarkerBlock('# My project\n\nMy own rules.\n', agentDocsBlock('h1'))
  assert.ok(out.startsWith('# My project'))
  assert.ok(out.includes('My own rules.'))
  assert.ok(out.includes(AGENT_DOCS_START))
})

test('re-run replaces ONLY the fenced block (user content above/below survives)', () => {
  const v1 = upsertMarkerBlock('above\n', agentDocsBlock('old-hash')) + '\nbelow\n'
  const v2 = upsertMarkerBlock(v1, agentDocsBlock('new-hash'))
  assert.ok(v2.includes('above'))
  assert.ok(v2.includes('below'))
  assert.ok(v2.includes('kit `new-hash`'))
  assert.ok(!v2.includes('old-hash'))
  // exactly one block
  assert.equal(v2.split(AGENT_DOCS_START).length, 2)
})
