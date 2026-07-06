#!/usr/bin/env node
/**
 * drift-bench scorer. For each prompt, run `uicockpit check --strict` over the
 * WITH-kit and WITHOUT-kit builder outputs and count violations (errors + warns,
 * all of which fail under --strict). The delta is the evidence: a kit+contract
 * holds an agent on-system; without it, the agent drifts (raw hex, off-grid
 * spacing, off-scale radii/type).
 *
 *   node score.mjs            # score every runs/<id>/{with,without}
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLI = join(HERE, '..', 'cli', 'bin', 'uicockpit.mjs')
const CONTRACT = join(HERE, 'kit', 'uicockpit.contract.json')
const RUNS = join(HERE, 'runs')

/** Run the real CLI check and parse its "N error · M warn" summary. */
function score(dir) {
  let out = ''
  try {
    out = execFileSync('node', [CLI, 'check', CONTRACT, dir, '--strict'], { encoding: 'utf8' })
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '') // check exits 1 on violations — that's expected
  }
  const m = out.match(/(\d+) error · (\d+) warn/)
  const errors = m ? +m[1] : 0
  const warns = m ? +m[2] : 0
  // Tally by rule for the breakdown.
  const rules = {}
  for (const line of out.split('\n')) {
    const r = line.match(/\[([a-z-]+)\]/)
    if (r) rules[r[1]] = (rules[r[1]] || 0) + 1
  }
  return { violations: errors + warns, errors, warns, rules }
}

const prompts = JSON.parse(readFileSync(join(HERE, 'prompts.json'), 'utf8')).prompts
const rows = []
for (const p of prompts) {
  const withDir = join(RUNS, p.id, 'with')
  const withoutDir = join(RUNS, p.id, 'without')
  if (!existsSync(withDir) || !existsSync(withoutDir)) { console.log(`· skip ${p.id} (no outputs yet)`); continue }
  const w = score(withDir)
  const wo = score(withoutDir)
  rows.push({ id: p.id, category: p.category, withKit: w, withoutKit: wo })
}

// Aggregate + report.
const totW = rows.reduce((n, r) => n + r.withKit.violations, 0)
const totWo = rows.reduce((n, r) => n + r.withoutKit.violations, 0)
const allRules = {}
for (const r of rows) for (const [k, v] of Object.entries(r.withoutKit.rules)) allRules[k] = (allRules[k] || 0) + v

console.log('\n  drift-bench — violations under `uicockpit check --strict`\n')
console.log('  ' + 'prompt'.padEnd(16) + 'with kit'.padEnd(12) + 'without kit')
console.log('  ' + '─'.repeat(40))
for (const r of rows) console.log('  ' + r.id.padEnd(16) + String(r.withKit.violations).padEnd(12) + r.withoutKit.violations)
console.log('  ' + '─'.repeat(40))
console.log('  ' + 'TOTAL'.padEnd(16) + String(totW).padEnd(12) + totWo)
console.log('\n  without-kit drift by rule:', Object.entries(allRules).map(([k, v]) => `${k}:${v}`).join('  '))

writeFileSync(join(HERE, 'results.json'), JSON.stringify({ generatedFrom: 'uicockpit check --strict', totals: { withKit: totW, withoutKit: totWo }, byRuleWithout: allRules, rows }, null, 2) + '\n')
console.log('\n  ✓ wrote results.json')
