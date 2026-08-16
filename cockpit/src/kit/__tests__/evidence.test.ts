import { describe, it, expect } from 'vitest'
import EVIDENCE from '../evidence.json'
import { RECIPES } from '../recipes'

/**
 * The evidence file is GENERATED and COMMITTED, which is the only arrangement
 * that lets a static page publish a measurement — and it is also the arrangement
 * that rots. `scripts/gen-evidence.mjs` needs a dev server, so it cannot run in
 * the build; nothing forces anyone to re-run it; and a stale file looks exactly
 * like a fresh one.
 *
 * So the build holds the one property that catches staleness cheaply: the file
 * must have an entry for every recipe the kit ships, and no entry for anything
 * else. Add a component and the suite goes red until the evidence is regenerated,
 * which is the moment the page would otherwise start showing nothing for it.
 *
 * ⚠️ This does NOT prove the numbers are current — a recipe whose CSS changed
 * still carries yesterday's contrast reading, and no test in a build without a
 * browser can know that. The page states the commit it was measured at, so a
 * reader can see for themselves how old it is. That is the honest arrangement:
 * date the claim rather than pretend it is continuous.
 */
type Entry = {
  measured: boolean
  reason?: string
  under?: string
  instances?: number
  axeFindings?: number
  contrast?: { min: number; nodes: number } | null
  target?: { smallest: number | null; pass: number; fail: number } | null
}
const components = EVIDENCE.components as Record<string, Entry>

describe('the evidence file describes the kit that ships', () => {
  it('has an entry for every recipe, and only for recipes', () => {
    const ids = RECIPES.map((r) => r.id).sort()
    expect(Object.keys(components).sort()).toEqual(ids)
  })

  it('records WHY a component was not measured, never a bare false', () => {
    /* Two different facts wear the same `false`: "its classes are part of another
     * recipe's block, so it was measured under that name" and "nothing renders
     * it at all". The page says different things for each, so the data has to
     * distinguish them or the page invents the distinction. */
    const unmeasured = Object.entries(components).filter(([, e]) => !e.measured)
    for (const [id, e] of unmeasured) {
      expect(['measured-as', 'not-rendered'], `${id} has no reason`).toContain(e.reason)
      if (e.reason === 'measured-as') {
        expect(components[e.under!], `${id} is measured-as "${e.under}", which is not a recipe`).toBeDefined()
        expect(components[e.under!]!.measured, `${id} defers to ${e.under}, which is itself unmeasured`).toBe(true)
      }
    }
    expect(unmeasured.length).toBeLessThan(RECIPES.length / 2)
  })

  it('never carries a number it did not measure', () => {
    /* The failure this page exists to avoid: a zero that means "we did not look"
     * sitting where a zero that means "we looked and found nothing" belongs. An
     * unmeasured entry must carry NO numbers at all, so the component cannot
     * accidentally render one. */
    for (const [id, e] of Object.entries(components)) {
      if (e.measured) continue
      expect(e.instances, `${id} is unmeasured but carries an instance count`).toBeUndefined()
      expect(e.axeFindings, `${id} is unmeasured but carries a finding count`).toBeUndefined()
      expect(e.contrast, `${id} is unmeasured but carries a contrast reading`).toBeUndefined()
    }
  })

  it('keeps every measured entry internally consistent', () => {
    for (const [id, e] of Object.entries(components)) {
      if (!e.measured) continue
      expect(e.instances, `${id} is measured with no instances`).toBeGreaterThan(0)
      expect(typeof e.axeFindings, id).toBe('number')
      if (e.contrast) {
        // A ratio is between 1:1 and 21:1 by definition; anything else is a
        // broken colour path, which this repo has shipped more than once.
        expect(e.contrast.min, `${id} contrast out of range`).toBeGreaterThanOrEqual(1)
        expect(e.contrast.min, `${id} contrast out of range`).toBeLessThanOrEqual(21)
        expect(e.contrast.nodes, `${id} has a contrast reading over 0 nodes`).toBeGreaterThan(0)
      }
      if (e.target) expect(e.target.pass + e.target.fail, `${id} has a target verdict over 0 nodes`).toBeGreaterThan(0)
    }
  })

  it('states when and where it was measured', () => {
    expect(EVIDENCE.commit).toMatch(/^[0-9a-f]{7,}$/)
    expect(EVIDENCE.measuredOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(EVIDENCE.configurations.length).toBeGreaterThanOrEqual(6)
    expect(EVIDENCE.widths.length).toBeGreaterThanOrEqual(3)
  })

  it('proves the run actually looked at something, per configuration', () => {
    /* The control that made this whole sprint worth doing. `a11y:matrix` printed
     * three density rows for months while measuring one density three times,
     * because its density setter had silently stopped working. The give-away was
     * available the whole time and nobody looked: identical numbers where three
     * different ones belong.
     *
     * So the evidence carries its own denominators, and this asserts that they
     * are (a) large enough for a verdict to mean anything and (b) NOT all
     * identical, which is what a dead control looks like. */
    const control = EVIDENCE.control as Array<{ config: string; contrastNodes: number; targetNodes: number }>
    expect(control.length).toBe(EVIDENCE.configurations.length)
    for (const c of control) {
      expect(c.contrastNodes, `${c.config} evaluated almost no text`).toBeGreaterThan(200)
      expect(c.targetNodes, `${c.config} evaluated almost no targets`).toBeGreaterThan(50)
    }
    expect(new Set(control.map((c) => c.contrastNodes)).size,
      'every configuration evaluated the identical number of text nodes — the densities are not actually changing')
      .toBeGreaterThan(1)
  })
})
