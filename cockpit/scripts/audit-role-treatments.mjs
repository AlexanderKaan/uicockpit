#!/usr/bin/env node
/**
 * audit-role-treatments.mjs — the Role Canvas ENFORCE rail (the treatment gates).
 *
 * audit:contract verifies the contract DATA is consistent + complete. This gate
 * verifies the kit actually DELIVERS each role's ROLE_GUARANTEE — so "the role
 * guarantees its treatment" is true, not aspirational. It closes the worklist
 * audit:contract prints (the declared-not-yet-enforced roles):
 *
 *   tone-bearer → every tinted *-soft token carries a paired AA-derived *-soft-fg
 *                 (so text on any tint is guaranteed legible — the badge/aaInk law)
 *   text-slot   → a global .truncate utility exists (single-line clamp)
 *   overlay     → the floating list surfaces cap their height + scroll (can't run
 *                 off-screen)
 *   surface     → enforced by the FOUNDATION coherence guard (surface ≠ bg +
 *                 elevation); see coherence.ts + its tests — not re-checked here.
 *
 * Exit 1 on any unmet guarantee. Usage: node scripts/audit-role-treatments.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const recipes = readFileSync(resolve(ROOT, 'src/kit/recipes/index.ts'), 'utf8')
const snap = readFileSync(resolve(ROOT, 'src/export/__tests__/__snapshots__/gen.test.ts.snap'), 'utf8')

const fails = []

// --- tone-bearer: every emitted *-soft tint has a paired AA-derived *-soft-fg ---
const SOFT_FG_EXEMPT = new Set(['ring']) // focus halo — never holds text
const softs = [...new Set([...snap.matchAll(/--k-([a-z0-9-]+)-soft:/g)].map((m) => m[1]))]
for (const x of softs) {
  if (SOFT_FG_EXEMPT.has(x)) continue
  if (!snap.includes(`--k-${x}-soft-fg:`)) {
    fails.push(`tone-bearer · --k-${x}-soft has no AA-derived --k-${x}-soft-fg — text on the tint isn't guaranteed legible`)
  }
}

// --- text-slot: a global .truncate clamp utility exists ---------------------
if (!/\.truncate\s*\{[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/.test(recipes)) {
  fails.push('text-slot · no global .truncate utility (overflow:hidden + text-overflow:ellipsis + white-space:nowrap)')
}

// --- overlay: floating list surfaces cap height + scroll -------------------
const ruleBody = (css, sel) => {
  const at = css.indexOf(`${sel} {`) >= 0 ? css.indexOf(`${sel} {`) : css.indexOf(`${sel}{`)
  return at < 0 ? null : css.slice(at, css.indexOf('}', at))
}
for (const sel of ['.menu', '.cmdp__list']) {
  const b = ruleBody(recipes, sel)
  if (!b || !/max-(?:height|block-size)/.test(b) || !/overflow/.test(b)) {
    fails.push(`overlay · ${sel} lacks max-height + overflow — a long list would run off-screen`)
  }
}

if (fails.length) {
  console.error('=== audit:role-treatments — role guarantees (Role Canvas ENFORCE) ===')
  for (const f of fails) console.error(`  ✗ ${f}`)
  console.error(`\n${fails.length} role guarantee(s) not delivered. Every role in contracts.ts must carry its ROLE_GUARANTEE treatment.`)
  process.exit(1)
}
console.log('audit:role-treatments — clean · tone-bearer (AA-ink paired) · text-slot (.truncate) · overlay (scroll-capped) all enforced')
