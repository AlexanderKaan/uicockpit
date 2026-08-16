#!/usr/bin/env node
/**
 * audit:shape — a component keeps its own dimensions.
 *
 *   npm run dev  &&  npm run audit:shape            # compare to the baseline
 *   npm run dev  &&  npm run audit:shape -- --update # accept the current state
 *
 * WHY THIS EXISTS, in three incidents from one afternoon. The platform floor —
 * a classless `:where()` layer over bare HTML — was an ADDITION on paper and a
 * MIGRATION in fact, and nothing we own could tell the difference:
 *
 *   · `.toggle` is a <button role="switch"> with no declared height. A
 *     `min-block-size: 40px` turned a 36×20 switch into 32×36, and with its own
 *     border-radius: 999px on a near-square it rendered as a circle with a bite
 *     out of it.
 *   · `.processlist__title` is an <h3> with no declared size. A heading rule
 *     took three step titles to 22px and the card stopped reading as a list.
 *   · <th> took `overflow-wrap: anywhere` and a data table rendered its SERVICE
 *     column as S/E/R/V/I/C/E stacked vertically.
 *
 * ALL THREE PASSED EVERY GATE WE OWN. audit:uniformity clean, a11y:matrix
 * unchanged, build green, 333 tests green — while four families of control were
 * visibly broken. Alexander found each one by eye, from a screenshot. Nothing we
 * ran rendered a switch and asked whether it was still switch-shaped.
 *
 * WHAT IT IS NOT. It does not ask whether a size is RIGHT — that is taste, and
 * taste does not belong in a gate. It asks whether a size CHANGED WHEN NOBODY
 * ASKED IT TO, which is a regression, and which is precisely what a global layer
 * causes. The oracle is therefore a delta against a stored baseline, exactly
 * like E-clipped-text: an absolute box is meaningless, a moved box is not.
 *
 * 🔑 THE SUBJECTS ARE DERIVED. Every element on the wall whose own class is in
 * the kit — no list here, so a new component arrives already measured. The
 * moment a meter carries a list of what to check it measures the list instead of
 * the product.
 *
 * ⚠️ AND IT CARRIES ITS OWN CONTROL, because a shape gate with an unknown noise
 * floor is a gate that cries wolf. The page is measured TWICE in one run and the
 * two passes are diffed first. Anything that disagrees with itself is the
 * instrument, not the kit, and is printed as such before any finding.
 *
 * RATIO IS REPORTED SEPARATELY AND FIRST. The toggle failed as a ratio (1.8:1 →
 * 0.9:1) before it failed as a size, and a ratio is what makes "it stopped
 * looking like a switch" measurable rather than a matter of opinion.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { measureShapes } from './lib/harness.mjs'
import { APP } from './lib/base.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const BASELINE = join(HERE, 'data/shape-baseline.json')
const URL = process.argv.find((a) => a.startsWith('--url='))?.slice(6) ?? APP
const UPDATE = process.argv.includes('--update')

/* The tolerance, and where the number comes from: it is the measured noise
 * floor plus a margin, not a round number someone liked. Sub-pixel layout and
 * text metrics move a box by fractions; a real regression moved the toggle by
 * 16px, the heading by 6px and the table column by its entire width. There is
 * two orders of magnitude between the two, so the threshold is not delicate. */
const TOL_PX = 1.0
const TOL_RATIO = 0.08

const line = (s = '') => process.stdout.write(s + '\n')
const ratio = (r) => r.w / r.h

const { rows, control, collisions } = await measureShapes({ url: URL })

/* ── THE CONTROL, before anything else ─────────────────────────────────────
 * Two reads of the same unchanged page. Whatever they disagree about is the
 * meter's own noise, and every one of those keys is excluded from the verdict —
 * reporting a box that cannot even agree with itself as a regression is how a
 * gate starts lying. */
const byKey = (list) => new Map(list.map((r) => [r.key, r]))
const now = byKey(rows)
const ctrl = byKey(control)
const unstable = new Set()
for (const [k, a] of ctrl) {
  const b = now.get(k)
  if (!b) { unstable.add(k); continue }
  if (Math.abs(a.w - b.w) > TOL_PX || Math.abs(a.h - b.h) > TOL_PX) unstable.add(k)
}

line()
line('  audit:shape — did a box move when nobody asked it to?')
line('  ' + '─'.repeat(66))
line(`  measured   ${rows.length} kit elements across ${new Set(rows.map((r) => r.component)).size} components`)
line(`  control    two reads of the same page disagree on ${unstable.size}` +
  (unstable.size ? '  ← excluded from the verdict' : '  ← the meter is stable'))
line(`  keys       ${collisions.length ? collisions.length + ' NAME(S) SHARED BY TWO CARDS ← their rows interleave by DOM order' : 'every card has a name of its own'}`)
for (const c of collisions) line(`               "${c.name}" is on ${c.cards} cards — give one its recipe id (docId)`)

if (UPDATE) {
  /* ONE LINE PER SUBJECT, deliberately, and this is the whole reason the file is
   * hand-formatted rather than JSON.stringify'd with an indent.
   *
   * The two .snap files in this repo are 28,899 lines and turn a one-property
   * recipe edit into a thousand-line diff, which is a good way to stop reading
   * diffs — it is an open item on the roadmap for exactly that reason. A shape
   * baseline could easily be the same mistake a second time. Keyed, one line
   * each, a moved box is ONE changed line that reads
   *   "Profile ∥ toggle #1": ["button", 32, 18]
   * so the git diff says the same thing the gate says, and nobody has to run
   * the gate to review the commit. */
  const keep = rows.filter((r) => !unstable.has(r.key)).sort((a, b) => a.key.localeCompare(b.key))
  const body = keep.map((r) => `  ${JSON.stringify(r.key)}: ${JSON.stringify([r.tag, r.w, r.h])}`).join(',\n')
  writeFileSync(BASELINE,
    '{\n' +
    `  "note": "audit:shape baseline — the rendered box of every kit element at the DEFAULT config, ${1440}px wide. One line per subject on purpose: a box that moved is one changed line. Regenerate with \`npm run audit:shape -- --update\`, in the same commit that explains why it moved.",\n` +
    '  "width": 1440,\n' +
    '  "rows": {\n' + body + '\n  }\n}\n')
  line(`  written    ${keep.length} rows → scripts/data/shape-baseline.json`)
  line()
  line('audit:shape — baseline accepted. The next run measures against it.')
  process.exit(0)
}

if (!existsSync(BASELINE)) {
  line()
  line('  No baseline yet. Run `npm run audit:shape -- --update` to record one.')
  process.exit(0)
}

const base = JSON.parse(readFileSync(BASELINE, 'utf8'))
const before = new Map(Object.entries(base.rows).map(([key, [tag, w, h]]) => [key, { key, tag, w, h }]))

const reshaped = []   // the ratio changed — it stopped looking like itself
const moved = []      // the box changed size but kept its proportions
const gone = []
const added = []

for (const [k, b] of before) {
  if (unstable.has(k)) continue
  const a = now.get(k)
  if (!a) { gone.push({ ...b, key: k }); continue }
  const dw = a.w - b.w
  const dh = a.h - b.h
  if (Math.abs(dw) <= TOL_PX && Math.abs(dh) <= TOL_PX) continue
  const rb = b.w / b.h
  const ra = a.w / a.h
  const drift = Math.abs(ra - rb) / Math.max(rb, ra)
  const row = { key: k, tag: a.tag, was: `${b.w}×${b.h}`, is: `${a.w}×${a.h}`, dw, dh,
    ratioWas: rb.toFixed(2), ratioIs: ra.toFixed(2) }
  if (drift > TOL_RATIO) reshaped.push(row)
  else moved.push(row)
}
for (const [k, a] of now) if (!before.has(k) && !unstable.has(k)) added.push({ ...a, key: k })

const fmt = (r) => `${r.key}\n        ${r.tag}  ${r.was} → ${r.is}   (${r.dw >= 0 ? '+' : ''}${r.dw.toFixed(0)}w ${r.dh >= 0 ? '+' : ''}${r.dh.toFixed(0)}h)`

line()
if (reshaped.length) {
  line(`  ✗ RESHAPED — ${reshaped.length}. The proportions changed, so it no longer reads as the`)
  line('    same control. This is the toggle-became-a-circle failure.')
  for (const r of reshaped.slice(0, 25)) line(`      ${fmt(r)}   ratio ${r.ratioWas} → ${r.ratioIs}`)
  if (reshaped.length > 25) line(`      …${reshaped.length - 25} more`)
  line()
} else line('  ✓ RESHAPED — none. Every box kept its proportions.\n')

if (moved.length) {
  line(`  ✗ RESIZED — ${moved.length}. Same proportions, different size.`)
  for (const r of moved.slice(0, 25)) line(`      ${fmt(r)}`)
  if (moved.length > 25) line(`      …${moved.length - 25} more`)
  line()
} else line('  ✓ RESIZED — none.\n')

/* Appearing and disappearing are NOT failures — adding a card is the job. They
 * are printed because a silent drop is how a component leaves the wall without
 * anyone noticing, which has now happened twice. */
if (gone.length || added.length) {
  line(`  · membership — ${added.length} new, ${gone.length} no longer rendered (not failures)`)
  for (const r of gone.slice(0, 8)) line(`      gone   ${r.key}  (${r.w}×${r.h})`)
  if (gone.length > 8) line(`      …${gone.length - 8} more gone`)
  for (const r of added.slice(0, 8)) line(`      new    ${r.key}  (${r.w}×${r.h})`)
  if (added.length > 8) line(`      …${added.length - 8} more new`)
  line()
}

const failures = reshaped.length + moved.length
line(failures
  ? `audit:shape — ${failures} box(es) moved. Either the change was meant and the baseline\n` +
    '              should be updated in the same commit that explains it, or it was not.'
  : 'audit:shape — every component kept its own dimensions.')
process.exit(0)
