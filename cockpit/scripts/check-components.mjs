#!/usr/bin/env node
/**
 * check:components — the review, reported PER COMPONENT.
 *
 *   npm run dev  &&  npm run check:components
 *
 * Every gate we have ever written reports per script: "audit:craft found 170
 * magic px". That is a fact about a script. A review needs the other axis —
 * "Slider: four findings, two of them only below 480px" — and that inversion is
 * the entire point of this file.
 *
 * IT GATES ON THE BREACH BAND, since 2026-08-16 (Sprint K). It stayed a report
 * for as long as the list was untriaged — a gate that fails for reasons nobody
 * has looked at is a gate people learn to skip. The list has been worked
 * through: the tab walk is clean over 544 stops and the one recurring "breach"
 * turned out to be axe's oklch arithmetic, which is now verified against painted
 * pixels and discounted (printed, never dropped). So `--gate` exits 1 on any
 * BREACH — a keyboard trap, an unreachable control, a stop with no focus
 * indicator, an obscured focus, or a real axe violation under any condition —
 * and stays silent on CONTENT LOST and measurement, which remain a review.
 *
 * WHAT THIS RETIRED. audit:focus read the SOURCE for a focusable selector that
 * suppressed its outline without a replacement. That is a proxy for the thing
 * this walk measures directly: B4 focuses every stop and compares the painted
 * state before and after (see __uicProbeIndicator) — no assumption about how or
 * where a ring is drawn, so it also holds for a ring the source gate could not
 * see (a :focus-within wrapper, a knob). Proven by mutation before the switch:
 * `.btn:focus-visible { outline: none; box-shadow: none }` → this walk reports
 * B-no-focus-indicator on every button and exits 1.
 */
import { runHarness, driveTabWalk, byComponent } from './lib/harness.mjs'

const GATE = process.argv.includes('--gate')
const { findings, discounted, variations } = await runHarness()

/* Dimension B needs the page DRIVEN rather than rendered, so it is its own pass
 * with its own browser. One tab walk, four checks — reachable, no trap, focus
 * visible, focus not obscured. */
const drive = await driveTabWalk()
findings.push(...drive.findings.map((f) => ({ ...f, variation: 'tab-walk' })))
console.log(`tab walk: ${drive.stops} stops over ${drive.marked} interactive elements` +
  `${drive.leftTheRegion ? ', focus left the region cleanly' : ', FOCUS NEVER LEFT THE REGION'}\n`)

/* SEVERITY, or the loudest component is loud for the least serious reason.
 * Sorting by count put Footer on top with 71 size measurements while a Level A
 * keyboard trap sat 40 lines below it. A breach and a measurement are not the
 * same kind of thing and must not share a ranking. */
const SEVERITY = (f) => {
  if (f.sevHint !== undefined) return f.sevHint              // the drive rules rank themselves
  if (f.rule.startsWith('axe:')) return 0                    // a real WCAG violation, independently found
  if (f.rule === 'E-scroll-region-unreachable') return 0     // 2.1.1, Level A
  if (f.rule === 'E-clipped-text' || f.rule === 'E-overflows-its-box') return 1  // content actually lost
  return 2                                                    // a measurement: size, geometry, coherence
}
const BAND = ['BREACH', 'CONTENT LOST', 'measurement']
for (const f of findings) f.sev = SEVERITY(f)

console.log(`check:components — ${variations.length} conditions, findings grouped by component`)
console.log('Ranked by worst finding, not by count.\n')

const groups = byComponent(findings)
  .sort((a, b) => {
    const worst = (rows) => Math.min(...rows.map((r) => r.sev))
    return worst(a[1]) - worst(b[1]) || b[1].length - a[1].length
  })
if (discounted.length) {
  const ex = discounted[0]
  console.log(`(${discounted.length} axe contrast row(s) discounted — painted pixels pass: e.g. ${ex.el} axe ${ex.axe} painted ${ex.painted})\n`)
}
if (groups.length === 0) {
  console.log('✓ nothing found under any condition')
  process.exit(0)
}

for (const [component, rows] of groups) {
  // Which conditions this component fails under is the useful half: a component
  // that only breaks at 320px is a different problem from one that always does.
  const conds = [...new Set(rows.map((r) => r.variation))]
  console.log(`\n${component}  —  ${rows.length} finding(s)   [${conds.join(' · ')}]`)

  /* Collapse to the DEFECT, not the instance. Nine footer links at nine widths
   * are one finding — "footer__link, 15-18px tall, ×9" — and printing them as
   * nine lines is the difference between a scan and a review. The numbers are
   * kept as a range because the extremes are what someone acts on. */
  const seen = new Map()
  for (const r of rows) {
    const key = `${r.rule}|${r.el}`
    if (!seen.has(key)) seen.set(key, { ...r, n: 0, details: new Set(), where: new Set() })
    const g = seen.get(key)
    g.n++
    g.details.add(r.detail)
    g.where.add(r.variation)
  }
  for (const f of [...seen.values()].sort((a, b) => a.sev - b.sev || b.n - a.n)) {
    const wcag = f.wcag ? ` · ${f.wcag}` : ''
    const d = [...f.details]
    // One example plus a count reads better than a wall of near-identical strings.
    const detail = d.length === 1 ? d[0] : `${d[0]}  (+${d.length - 1} more, e.g. ${d[d.length - 1]})`
    // Kit or the gallery's own wrapper — printed, never dropped.
    const where = f.kit === false ? ' ·chrome' : ''
    console.log(`   ${(BAND[f.sev] + where).padEnd(20)} ${String(f.n).padStart(3)}x  ${f.el.padEnd(24)} ${detail}`)
    console.log(`                     ${f.rule}${wcag}   at: ${[...f.where].join(', ')}`)
  }
}

const tally = [0, 0, 0]
for (const f of findings) tally[f.sev]++
const chrome = findings.filter((f) => f.kit === false).length
const comps = groups.length
console.log(`\n${'═'.repeat(70)}`)
console.log(`${tally[0]} breach · ${tally[1]} content-lost · ${tally[2]} measurement` +
  `   across ${comps} component(s), over ${variations.length} conditions`)
console.log(`${chrome} of those are marked ·chrome — the gallery's own wrappers, not the kit.`)
console.log('A measurement is not a verdict: WCAG 2.5.8 permits a small target with enough')
console.log('space around it, and axe owns that call.')

/* The gate. Breaches only — see the header. Printed AFTER the review so the
 * failure is never a bare exit code. */
if (tally[0] > 0) {
  const breaches = findings.filter((f) => f.sev === 0)
  console.log(`\n${GATE ? 'FAIL' : 'would FAIL under --gate'}: ${breaches.length} breach(es) — ` +
    [...new Set(breaches.map((f) => f.rule))].join(', '))
  if (GATE) process.exit(1)
}
console.log(GATE ? '\nOK: no breach under any condition.' : '')
