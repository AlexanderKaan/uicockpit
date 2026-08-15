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
 * IT WAS A RATCHET; IT IS NOW A PASS LINE. It opened at 85 undeclared of 114 —
 * carried as a monotonic debt, because pretending otherwise by only checking the
 * mapped ones would have been a gate that could not fail. The debt is now zero:
 * 59 recipes carry a pattern, 55 record why they have none, and BASELINE 0 means
 * a new recipe cannot be added without answering the question.
 *
 * The answer that mattered most was often "no pattern, and here is what it owes
 * instead" — a read-only rating is an image of a score and needs its value in
 * text; a chart needs a text alternative; a scroll area needs tabindex="0" or it
 * is mouse-only. Those obligations are stricter than a key map, and they would
 * not exist in the file if the reason field accepted a stock phrase.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const read = (p) => readFileSync(join(here, p), 'utf8')

/** Zero, and it may never rise. Every recipe declares a pattern or a reason. */
const BASELINE = 0

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
    `${undeclared.length} recipe(s) declare neither a pattern nor a reason.\n` +
    `  Say which APG pattern it implements in APG_PATTERNS, or record in APG_NOT_APPLICABLE\n` +
    `  what it owes instead — a name, a live region, a text alternative. A stock phrase here\n` +
    `  turns the table into a way of clearing this gate rather than answering it.\n` +
    `  Undeclared: ${undeclared.join(', ')}`,
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
