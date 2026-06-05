#!/usr/bin/env node
/**
 * audit-components.mjs — per-component "label/role hygiene" gate.
 *
 * WHY: audit-cascade scans preview.css + recipes for hardcoded *CSS* literals, but
 * the drift the eye catches lives in the React component source: a label styled
 * three different ways in one card, the decorative palette borrowed as a badge
 * colour, a badge smuggled into a segmented control. Those bypass the token system
 * at the JSX level, where no other gate looks. This codifies the house rules so the
 * check runs on EVERY build, for every component we make or touch — not by memory.
 *
 * Rules (all near-zero false-positive; each maps to a documented house rule):
 *   A. Decorative palette is for avatars / tiles / cover art / charts — NEVER labels.
 *      → flag `var(--k-accent-*)` inline on a badge / pill / tag / chip / segctrl element.
 *   B. A segmented control holds plain text options, not chips.
 *      → flag a `.badge` nested in a `.segctrl__btn`.
 *   C. One badge system: colour + size come from the `.badge` recipe / a
 *      `badge--variant` CLASS, never inline. → flag an inline `background`/`color`/
 *      `font-size` on a `.badge` chip (sub-parts like `.badge__dot` — a status dot
 *      whose colour IS its meaning — are exempt). Inline font-size makes one badge a
 *      different size than the rest and bypasses the type token (audit:type is CSS-only).
 *   D. No parallel badge vocabulary: deprecated ad-hoc label families
 *      (`meta-new`, `meta-pill`) must not return — use the `.badge` variants.
 *   E. Soft is the default badge fill; SOLID (`badge--solid-*`) is reserved for the
 *      two high-salience cases: numeric counts and the CRITICAL status (solid-danger,
 *      e.g. a "Down" service — asymmetric salience so it pops out of a list).
 *      → flag a `badge--solid-*` that is neither a `badge--count` nor `badge--solid-danger`.
 *   F. The textarea modifier `.tx` is incomplete on its own — it only adds vertical
 *      padding + resize on top of the `.in` input base (border / h-padding / focus halo).
 *      Canonical is `<textarea class="in tx">`. → flag a `tx` element missing `in`.
 *
 * Scans the live React component sources (the things we hand-edit). The export
 * catalog (componentRecipes) is covered by snapshot tests + the parity gate.
 *
 * Exit 1 on any violation (unless --report). Usage: node scripts/audit-components.mjs [--report]
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPORT = process.argv.includes('--report')

const VIEWS = resolve(ROOT, 'src/stage/views')
const APPS = resolve(VIEWS, 'apps')
const FILES = [
  ...readdirSync(VIEWS).filter((f) => f.endsWith('.tsx')).map((f) => `src/stage/views/${f}`),
  ...readdirSync(APPS).filter((f) => f.endsWith('.tsx')).map((f) => `src/stage/views/apps/${f}`),
]

// Label / control roles where the decorative palette + inline colour are wrong.
const LABEL_ROLE = /\b(badge|pill|tag|chip|segctrl)\b/
// The badge CHIP itself (not a sub-part like badge__dot / badge__count).
const isBadgeChip = (cls) => cls.split(/\s+/).some((t) => t === 'badge' || t.startsWith('badge--'))
const lineOf = (src, idx) => src.slice(0, idx).split('\n').length

const violations = []
const add = (file, line, rule, msg, snip) => violations.push({ file, line, rule, msg, snip })

for (const rel of FILES) {
  const src = readFileSync(resolve(ROOT, rel), 'utf8')

  // --- Tag-level rules (A, C): split into JSX tags, read each tag's class + style. ---
  // Split on '<'; the attribute section is everything up to the first '>' (style
  // objects practically never contain a bare '>'), which lets a tag span lines.
  let cursor = 0
  for (const chunk of src.split('<')) {
    const tagStart = cursor // index of the '<' we split on (approx; cursor tracks offset)
    cursor += chunk.length + 1
    const gt = chunk.indexOf('>')
    if (gt < 0) continue
    const attrs = chunk.slice(0, gt)
    const clsM = attrs.match(/className=(?:"([^"]*)"|'([^']*)'|\{([\s\S]*?)\})/)
    if (!clsM) continue
    const cls = (clsM[1] || clsM[2] || clsM[3] || '')
    const styleM = attrs.match(/style=\{\{([\s\S]*?)\}\}/)
    const style = styleM ? styleM[1] : ''
    const line = lineOf(src, tagStart)

    // Rule A — decorative palette on a label/control element.
    if (LABEL_ROLE.test(cls) && /var\(--k-accent-/.test(style)) {
      add(rel, line, 'A', `decorative --k-accent-* used as colour on a label/control (class "${cls.trim().slice(0, 40)}")`, style.replace(/\s+/g, ' ').trim().slice(0, 80))
    }
    // Rule C — inline colour OR font-size on a badge chip (use the .badge recipe / variant class).
    if (isBadgeChip(cls) && style && /\b(background|color|font-?[Ss]ize)\s*:/.test(style)) {
      add(rel, line, 'C', `inline colour/size on a .badge chip — use the .badge recipe + a badge--variant class (class "${cls.trim().slice(0, 40)}")`, style.replace(/\s+/g, ' ').trim().slice(0, 80))
    }
    // Rule E — solid badge fill is reserved for counts + the critical (solid-danger) status; else soft.
    if (/badge--solid/.test(cls) && !/badge--count/.test(cls) && !/badge--solid-danger/.test(cls)) {
      add(rel, line, 'E', `solid badge fill outside a count or critical status — use the soft variant (class "${cls.trim().slice(0, 40)}")`, cls.trim().slice(0, 60))
    }
    // Rule F — the .tx textarea modifier must pair with the .in input base.
    const toks = cls.split(/\s+/)
    if (toks.includes('tx') && !toks.includes('in')) {
      add(rel, line, 'F', `".tx" textarea without ".in" — canonical is class="in tx" (border / padding / focus halo come from .in)`, cls.trim().slice(0, 60))
    }
  }

  // --- Rule B (line-level): a badge nested in a segmented-control button. ---
  src.split('\n').forEach((ln, i) => {
    if (/segctrl__btn/.test(ln) && /\bbadge\b/.test(ln)) {
      add(rel, i + 1, 'B', 'a .badge inside a .segctrl__btn — segmented options are plain text', ln.trim().slice(0, 90))
    }
    // --- Rule D: deprecated parallel badge families must not return. ---
    const dep = ln.match(/\b(meta-new|meta-pill)\b/)
    if (dep) add(rel, i + 1, 'D', `deprecated "${dep[1]}" label family — use a .badge variant`, ln.trim().slice(0, 90))
    // --- Rule G: deprecated parallel ROW families — settings/notifications are .list variants. ---
    const row = ln.match(/\b(set-rows?|notif-item|notif-center)\b/)
    if (row) add(rel, i + 1, 'G', `deprecated "${row[1]}" row family — use the .list system (.list--settings / .list--flush)`, ln.trim().slice(0, 90))
  })
}

console.log('=== component label/role-hygiene audit ===')
if (violations.length === 0) {
  console.log(`OK: ${FILES.length} component files clean (rules A/B/C/D/E/F/G).`)
  process.exit(0)
}

const byRule = { A: [], B: [], C: [], D: [], E: [], F: [], G: [] }
for (const v of violations) byRule[v.rule].push(v)
const RULE_NAME = {
  A: 'Decorative palette (--k-accent-*) used as a label colour',
  B: 'Badge nested in a segmented control',
  C: 'Inline colour/size on a .badge chip (should be a recipe/variant class)',
  D: 'Deprecated parallel badge family (meta-new / meta-pill)',
  E: 'Solid badge fill outside a numeric count (should be soft)',
  F: 'Textarea .tx without the .in input base',
  G: 'Deprecated row family (set-row / notif-item) — use the .list system',
}
for (const r of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
  if (!byRule[r].length) continue
  console.log(`\n[${r}] ${RULE_NAME[r]} — ${byRule[r].length}:`)
  for (const v of byRule[r]) console.log(`  ${v.file}:${v.line}  ${v.snip}`)
}
console.log(`\n${violations.length} violation(s). Fix the source: labels use the semantic .badge`)
console.log('variant classes (success/warn/danger/info/neutral) or the brand; the decorative')
console.log('--k-accent-* palette is ONLY for avatars / tiles / cover art / charts.')
console.log('(Run with --report to print without failing the build.)')
process.exit(REPORT ? 0 : 1)
