#!/usr/bin/env node
/**
 * audit:apg — is every component's BEHAVIOUR anchored to something normative?
 *
 * Our CSS decides how a component looks; WAI-ARIA APG decides how it must
 * behave. "Our tabs are keyboard accessible" is a promise. "Our tabs implement
 * the APG Tabs pattern, and here is the key map" is something an auditor can
 * check and a second implementer can match — which is the entire difference
 * between a library and a standard.
 *
 * A RATCHET, not a pass line. 23 of 114 recipes carry a pattern and 6 record why
 * they have none; 85 are undeclared, and pretending otherwise by only checking
 * the mapped ones would be a gate that cannot fail. The number below is the
 * current debt, it may only go down, and a NEW recipe must declare either a
 * pattern or a reason. That is the same shape as the structural-inline ratchet
 * and for the same reason: the honest way to carry a backlog is to make it
 * visible and monotonic.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const read = (p) => readFileSync(join(here, p), 'utf8')

/** The debt as it stood when the anchor was introduced. Lower it, never raise it. */
const BASELINE = 85

const recipeIds = [...read('../src/kit/recipes/index.ts').matchAll(/^ {4}id: '([a-z0-9-]+)',/gm)].map((m) => m[1])
const apgSrc = read('../src/kit/apg.ts')

/* Read the two tables out of the source rather than importing — this is a .mjs
 * gate and apg.ts is TypeScript. The shape is a flat object literal keyed by
 * recipe id, so the keys are unambiguous. */
const keysIn = (marker) => {
  const start = apgSrc.indexOf(marker)
  if (start < 0) return new Set()
  const body = apgSrc.slice(start, apgSrc.indexOf('\n}', start))
  return new Set([...body.matchAll(/^ {2}'?([a-z][a-z0-9-]*)'?:/gm)].map((m) => m[1]))
}

const mapped = keysIn('export const APG_PATTERNS')
const none = keysIn('export const APG_NOT_APPLICABLE')

const undeclared = recipeIds.filter((id) => !mapped.has(id) && !none.has(id))
const stale = [...mapped, ...none].filter((id) => !recipeIds.includes(id))

console.log(
  `audit:apg — ${mapped.size} recipes anchored to an APG pattern, ${none.size} record why they have none, ` +
  `${undeclared.length} undeclared (baseline ${BASELINE})`,
)

const problems = []

if (undeclared.length > BASELINE) {
  problems.push(
    `The undeclared count went UP: ${undeclared.length} vs a baseline of ${BASELINE}.\n` +
    `  New recipes must say which APG pattern they implement, or record in APG_NOT_APPLICABLE\n` +
    `  why they have none. Undeclared: ${undeclared.slice(-6).join(', ')}`,
  )
}

if (stale.length) {
  problems.push(
    `Declared for recipes that no longer exist: ${stale.join(', ')}.\n` +
    `  A behaviour contract pointing at nothing is worse than none — it reads as coverage.`,
  )
}

if (undeclared.length < BASELINE) {
  console.log(`  ✓ debt reduced by ${BASELINE - undeclared.length} — lower BASELINE in scripts/audit-apg.mjs to lock it in`)
}

if (problems.length) {
  console.error('\n✗ audit:apg\n')
  for (const p of problems) console.error(`  ${p}\n`)
  process.exit(1)
}
console.log('✓ audit:apg — the anchor holds')
