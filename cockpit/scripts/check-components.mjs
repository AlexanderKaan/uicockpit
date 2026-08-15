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
 * It is deliberately NOT a build gate yet. It needs a dev server, it is new, and
 * a gate that fails for reasons nobody has triaged is a gate people learn to
 * skip. It prints; the ratchet comes once the list has been worked through.
 */
import { runHarness, byComponent } from './lib/harness.mjs'

const { findings, variations } = await runHarness()

/* SEVERITY, or the loudest component is loud for the least serious reason.
 * Sorting by count put Footer on top with 71 size measurements while a Level A
 * keyboard trap sat 40 lines below it. A breach and a measurement are not the
 * same kind of thing and must not share a ranking. */
const SEVERITY = (f) => {
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
    console.log(`   ${BAND[f.sev].padEnd(12)} ${String(f.n).padStart(3)}x  ${f.el.padEnd(24)} ${detail}`)
    console.log(`                     ${f.rule}${wcag}   at: ${[...f.where].join(', ')}`)
  }
}

const tally = [0, 0, 0]
for (const f of findings) tally[f.sev]++
const comps = groups.length
console.log(`\n${'═'.repeat(70)}`)
console.log(`${tally[0]} breach · ${tally[1]} content-lost · ${tally[2]} measurement` +
  `   across ${comps} component(s), over ${variations.length} conditions`)
console.log('A measurement is not a verdict: WCAG 2.5.8 permits a small target with enough')
console.log('space around it, and axe owns that call. Not a gate yet — triage first.')
