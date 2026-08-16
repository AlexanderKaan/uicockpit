#!/usr/bin/env node
/**
 * audit:bench — how much of a REAL codebase can `uicockpit audit` read?
 *
 *   node scripts/audit-bench.mjs            # run over the corpus, print the table
 *   node scripts/audit-bench.mjs --fetch    # clone what is missing first (shallow)
 *   node scripts/audit-bench.mjs --gate     # exit 1 when any repo reads below the floor
 *
 * THE NUMBER THIS HOLDS. The audit refuses to score below 70% coverage — the
 * honesty guard — and reports `parsed`, the share of styled elements it could
 * actually read. On the eight real repos captured in cockpit/public/fixtures the
 * share was 70–92%: twentyhq/twenty sat on the refusal line at 0.699 and
 * openstatus at 0.818, not because their styling was unreadable but because it
 * was written in notations the reader did not know — cn("p-4", open && "bg-x"),
 * theme.spacing(5), RECORD_TABLE_ROW_HEIGHT, inks.userMessageBackground. Every
 * one of those is a NAMED value; none is a guess. Sprint Q (2026-08-17) taught
 * the reader those notations and this bench is the meter: every corpus repo
 * must read at or above FLOOR, and the unreadable kinds are printed so the next
 * notation is visible before it becomes a refusal.
 *
 * The corpus is bench/audit-corpus/ (gitignored): shallow clones of public
 * repositories, fetched on demand. It is what the fixtures were made from and
 * the same set the landing page's audit section quotes. Sizes are honest — the
 * eight take ~2 GB — which is why the clones are not in the repo.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '../..')
const CORPUS = join(ROOT, 'bench/audit-corpus')
const CLI = join(ROOT, 'cli/bin/uicockpit.mjs')
const FETCH = process.argv.includes('--fetch')
const GATE = process.argv.includes('--gate')

/** The floor the reader must clear on every repo. 0.95 = "the audit reads 95%". */
export const FLOOR = 0.95

/* The corpus — the eight repos behind cockpit/public/fixtures/*.json, by GitHub
 * path. Adding a repo here adds a subject; the floor applies to it at once. */
const REPOS = [
  ['twentyhq/twenty', 'twenty'],
  ['openstatusHQ/openstatus', 'openstatus'],
  ['documenso/documenso', 'documenso'],
  ['formbricks/formbricks', 'formbricks'],
  ['calcom/cal.com', 'cal.com'],
  ['Mail-0/Zero', 'Zero'],
  ['n8n-io/n8n', 'n8n'],
  ['makeplane/plane', 'plane'],
]

mkdirSync(CORPUS, { recursive: true })
const rows = []
for (const [gh, dir] of REPOS) {
  const path = join(CORPUS, dir)
  if (!existsSync(path)) {
    if (!FETCH) { rows.push({ dir, missing: true }); continue }
    console.log(`  fetching ${gh} (shallow)…`)
    execFileSync('git', ['clone', '-q', '--depth', '1', '--single-branch', `https://github.com/${gh}.git`, path], { stdio: 'inherit' })
  }
  let out
  try {
    out = JSON.parse(execFileSync('node', [CLI, 'audit', path, '--json', '--no-report'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }))
  } catch (err) {
    rows.push({ dir, error: String(err.message).slice(0, 120) })
    continue
  }
  const m = out.meta
  rows.push({ dir, parsed: m.parsed, files: m.files, elements: m.elements, unreadable: m.unreadable, refused: out.refused, score: out.score, grade: out.grade })
}

console.log('=== audit:bench — how much of a real codebase the audit reads ===')
console.log(`  floor ${FLOOR} · corpus bench/audit-corpus (${rows.filter((r) => !r.missing).length} of ${REPOS.length} present${rows.some((r) => r.missing) ? ' — run with --fetch' : ''})\n`)
let below = 0
for (const r of rows) {
  if (r.missing) { console.log(`  ·  ${r.dir.padEnd(12)} not fetched`); continue }
  if (r.error) { console.log(`  ✗  ${r.dir.padEnd(12)} error: ${r.error}`); below++; continue }
  const ok = r.parsed >= FLOOR
  if (!ok) below++
  const blind = Object.entries(r.unreadable ?? {}).map(([k, n]) => `${k} ${n}`).join(' · ') || '—'
  console.log(`  ${ok ? '✓' : '✗'}  ${r.dir.padEnd(12)} parsed ${r.parsed.toFixed(3)}   ${String(r.elements).padStart(6)} elements   ${r.refused ? 'REFUSED' : `score ${String(r.score).padStart(3)} ${r.grade}`}   blind: ${blind}`)
}
console.log()
if (below) {
  console.log(`${GATE ? 'FAIL' : 'would FAIL under --gate'}: ${below} repo(s) below the ${FLOOR} floor. Teach the reader the notation, or say why it cannot be read.`)
  if (GATE) process.exit(1)
} else {
  console.log(`OK: every corpus repo reads at or above ${FLOOR}.`)
}
