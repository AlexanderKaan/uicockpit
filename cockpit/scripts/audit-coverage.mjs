#!/usr/bin/env node
/**
 * audit-coverage.mjs — "coverage-proof" gate for the SupaDash suite.
 *
 * WHY: the component gallery is the source of truth, but a gallery card only
 * proves a component EXISTS — not that it works in a real product context. The
 * suite rebuild (SUITE-PLAN.md) set a harder bar: every component must appear at
 * least once inside a live app screen. This gate encodes that — each component
 * maps to a marker (a class / JSX token) that must be found somewhere in the
 * live app sources. If a component slips back to gallery-only, the build fails.
 *
 * Inverse of audit-parity (which checks app ⊆ gallery); this checks the
 * gallery's in-context coverage (gallery → at least one app screen).
 *
 * A small, explicit ALLOWLIST holds components that are intentionally
 * gallery-only (no natural product home) — logged, never silently dropped.
 *
 * Exit 1 on any uncovered (non-allowlisted) component. Usage:
 *   node scripts/audit-coverage.mjs [--report]
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPORT = process.argv.includes('--report')

const VIEWS = resolve(ROOT, 'src/stage/views')
// H3c — SupaDash retired. The product surface is now the manifest-driven showcase
// layer ONLY: blocks.tsx (BlockSpec → kit recipes) + manifests.ts (the seeds) +
// PagesView.tsx (the theater's shell chrome) + ChartFrame (the chart presenter
// blocks compose). Coverage now tracks what the SHOWCASES demonstrate — a smaller,
// honest set than the old 58-deep SupaDash surface (a deliberate trade, recorded
// in ROADMAP H3c). Components only shown bare in the gallery are gallery-only.
const SHOWCASES = resolve(ROOT, 'src/showcases')
const FILES = [
  ...['ChartFrame.tsx', 'PagesView.tsx'].map((f) => resolve(VIEWS, f)),
  ...readdirSync(SHOWCASES).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx')).map((f) => resolve(SHOWCASES, f)),
]
const HAYSTACK = FILES.map((f) => readFileSync(f, 'utf8')).join('\n')

// component → a marker substring proving it renders in a manifest-driven showcase.
// This is the showcase BLOCK vocabulary + the shell tier the theater composes.
const MARKERS = {
  // Block tier — the 18 typed blocks (showcases/blocks.tsx)
  StatTile: 'stat-tile', Chart: 'ChartFrame', List: 'list__item', Card: 'card"',
  Thread: 'msg__', Composer: 'toolbar', Input: 'className="in"', Table: 'tbl',
  Form: 'className="lab"', Pricing: 'pricing__', Prose: 'prose__',
  DescriptionList: 'className="dl"', Chip: 'chip ', Kanban: 'kanban__',
  TreeView: 'tree__row', Timeline: 'timeline__', SettingsRow: 'list--settings',
  Switch: 'toggle', WizardStepper: 'wstepper', Stepper: 'stepper__',
  Dropzone: 'dropzone', Media: 'aspect--1x1', Badge: 'badge badge--',
  // Shell tier — the adaptive scaffold the showcase theater renders (PagesView)
  Scaffold: 'scaffold scaffold--', NavSuite: 'navsuite', Pane: 'PANE_CLASS',
  Avatar: 'avatar avatar--', Tab: 'tab ', Segmented: 'segctrl',
}

// Intentionally gallery-only — no believable product home. Logged, not failed.
const ALLOWLIST = {
  // No showcase manifest has a "segmented control" block — it's a CHROME control,
  // not a content block. It's demonstrated bare in the gallery (the Segmented
  // card) and dogfooded in the cockpit's own Components/Pages sub-toggles, so it's
  // legitimately gallery-only as far as the SHOWCASES go. (Fase J-7: this used to
  // pass only because a code comment in PagesView contained the word "segctrl" —
  // that false positive is now an honest allowlist entry.)
  Segmented: true,
}

const missing = []
for (const [name, marker] of Object.entries(MARKERS)) {
  if (!HAYSTACK.includes(marker) && !(name in ALLOWLIST)) missing.push({ name, marker })
}

const total = Object.keys(MARKERS).length
console.log('=== component coverage audit (gallery → live app screen) ===')
if (missing.length === 0) {
  console.log(`OK: all ${total} tracked components appear in a live app screen.`)
  if (Object.keys(ALLOWLIST).length) console.log(`(allowlisted gallery-only: ${Object.keys(ALLOWLIST).join(', ')})`)
  process.exit(0)
}
console.log(`\n${missing.length} / ${total} component(s) are gallery-only — no live app screen renders them:`)
for (const m of missing) console.log(`  ${m.name}  (looked for "${m.marker}")`)
console.log('\nAdd the component to a product screen (SUITE-PLAN.md), or — if it has no')
console.log('believable home — add it to the ALLOWLIST with a one-line reason.')
console.log('(Run with --report to print without failing the build.)')
process.exit(REPORT ? 0 : 1)
