#!/usr/bin/env node
/**
 * audit-contract.mjs — the Role Canvas ENFORCE rail (first gate).
 *
 * WHY: the contract card (loupe) reads src/kit/contracts.ts — a CONTRACT mapping
 * component-type → parts → role, over a CLOSED Role set, each role carrying a
 * guaranteed treatment (ROLE_GUARANTEE). A standard needs a CONFORMANCE check, not
 * just a display. This gate keeps the declarative layer honest as it grows:
 *
 *  HARD (fail the build):
 *   1. Every role used in CONTRACT exists in ROLE_GUARANTEE (no orphan/typo roles).
 *   2. Every role in ROLE_GUARANTEE is in the Role union type (and vice-versa).
 *   3. Every CONTRACT component-type resolves via componentAt() (∈ CLASS_MAP ids) —
 *      a contract for a type the loupe can't reach is dead.
 *   4. Every PICKABLE type (CLASS_MAP id) has a CONTRACT entry — coverage: if the
 *      loupe can zoom into it, it must declare its roles.
 *
 *  INFO (the worklist, never fails): which role-guarantees are actually ENFORCED by
 *  an existing audit vs only DECLARED. Surfaces what still needs an enforcing pass
 *  so "the role guarantees its treatment" is true, not aspirational.
 *
 * Usage: node scripts/audit-contract.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const contracts = readFileSync(resolve(ROOT, 'src/kit/contracts.ts'), 'utf8')
const components = readFileSync(resolve(ROOT, 'src/showcases/components.tsx'), 'utf8')

// --- parse contracts.ts ----------------------------------------------------
const block = (name) => {
  const i = contracts.indexOf(name)
  if (i < 0) return ''
  const open = contracts.indexOf('{', i)
  let depth = 0
  for (let j = open; j < contracts.length; j++) {
    if (contracts[j] === '{') depth++
    else if (contracts[j] === '}' && --depth === 0) return contracts.slice(open, j + 1)
  }
  return ''
}
// Role union members: `export type Role = | 'control' ...`
const roleType = contracts.slice(contracts.indexOf('export type Role'), contracts.indexOf('export const ROLE_GUARANTEE'))
const ROLE_TYPE = [...roleType.matchAll(/'([a-z-]+)'/g)].map((m) => m[1])
// ROLE_GUARANTEE keys
const guarBlock = block('const ROLE_GUARANTEE')
const ROLE_GUAR = [...guarBlock.matchAll(/(?:^|\n)\s+'?([a-z-]+)'?\s*:/g)].map((m) => m[1])
// CONTRACT top-level keys + every role referenced
const contractBlock = block('const CONTRACT')
const CONTRACT_KEYS = [...contractBlock.matchAll(/(?:^|\n)\s{2}([a-z][\w-]*)\s*:\s*\[/g)].map((m) => m[1])
const ROLES_USED = [...new Set([...contractBlock.matchAll(/role:\s*'([a-z-]+)'/g)].map((m) => m[1]))]

// --- parse CLASS_MAP ids (the pickable types) ------------------------------
const cmStart = components.indexOf('const CLASS_MAP')
const cmBlock = components.slice(cmStart, components.indexOf('export function componentAt', cmStart))
const PICKABLE = [...new Set([...cmBlock.matchAll(/\[\s*'[a-z][\w-]*'\s*,\s*'([a-z][a-z-]*)'\s*\]/g)].map((m) => m[1]))]

// --- which role guarantees are actually enforced by an existing audit -------
const ENFORCED_BY = {
  control: ['audit:control-h', 'audit:focus', 'audit:hit-target'],
  selectable: ['audit:state-edge'],
  'tone-bearer': ['audit:role-treatments'], // every *-soft has a paired aaInk -soft-fg
  'text-slot': ['audit:role-treatments'], // global .truncate clamp exists
  overlay: ['audit:role-treatments'], // .menu/.cmdp__list cap height + scroll
  surface: ['coherence-guard'], // foundation: surface ≠ bg + elevation (coherence.ts + tests)
}

// --- checks ----------------------------------------------------------------
const hard = []
for (const r of ROLES_USED) if (!ROLE_GUAR.includes(r)) hard.push(`CONTRACT uses role '${r}' with no ROLE_GUARANTEE entry`)
for (const r of ROLE_GUAR) if (!ROLE_TYPE.includes(r)) hard.push(`ROLE_GUARANTEE has '${r}' which is not in the Role union type`)
for (const r of ROLE_TYPE) if (!ROLE_GUAR.includes(r)) hard.push(`Role type '${r}' has no ROLE_GUARANTEE entry`)
for (const k of CONTRACT_KEYS) if (!PICKABLE.includes(k)) hard.push(`CONTRACT['${k}'] is not a pickable type (not a CLASS_MAP id) — the loupe can't reach it`)
const uncontracted = PICKABLE.filter((id) => !CONTRACT_KEYS.includes(id) && id !== 'component')
for (const id of uncontracted) hard.push(`pickable type '${id}' has no CONTRACT entry — every zoomable component must declare its roles`)

if (hard.length) {
  console.error('=== audit:contract — Role Canvas integrity ===')
  for (const h of hard) console.error(`  ✗ ${h}`)
  console.error(`\n${hard.length} contract integrity violation(s). Keep src/kit/contracts.ts in sync with the Role set + CLASS_MAP.`)
  process.exit(1)
}

// --- INFO: enforcement worklist (never fails) ------------------------------
const enforced = ROLE_TYPE.filter((r) => (ENFORCED_BY[r] || []).length)
const declaredOnly = ROLE_TYPE.filter((r) => !(ENFORCED_BY[r] || []).length)
console.log(`audit:contract — clean · ${CONTRACT_KEYS.length} types contracted over ${ROLE_TYPE.length} roles · all pickable types covered`)
console.log(`  enforced roles: ${enforced.map((r) => `${r} (${ENFORCED_BY[r].join(', ')})`).join(' · ')}`)
if (declaredOnly.length) console.log(`  ▸ declared-not-yet-enforced (ENFORCE worklist): ${declaredOnly.join(' · ')}`)
