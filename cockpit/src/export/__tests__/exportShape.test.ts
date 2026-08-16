import { describe, it, expect } from 'vitest'
import { genCss } from '../genCss'
import { genContract } from '../genContract'
import { genDesignMd } from '../genDesignMd'
import { DEFAULT_CONFIG } from '../../tokens/defaults'
import { buildTokens } from '../../tokens/buildTokens'
import { RECIPES } from '../../kit/recipes'
import { globalLayer, platformFloor } from '../../kit/globalLayer'
// @ts-expect-error — the kit model is the single .mjs parser the gates read; it
// has no types, and giving it a .d.ts would mean a second declaration of the
// shape it already returns. Node module, node test env, one import.
import { parseCss, classesIn, stripComments } from '../../../scripts/lib/kit-model.mjs'

/**
 * THE EXPORT IS A FUNCTION OF THE KIT — assert that, not a transcript of it.
 *
 * This file replaces three snapshots totalling 19,803 lines: genCss (7,985),
 * genDesignMd (8,698) and genContract (3,120). They worked, and that is not the
 * complaint. The complaint is that they made a one-property recipe edit produce
 * a diff nobody reads, and an unread diff is an unheld assertion — the reviewer
 * types `-u` and moves on. A gate whose output is routinely skipped has the same
 * value as no gate, at a higher cost.
 *
 * What a full-text snapshot really asserts is "nothing changed", which for a
 * file that is SUPPOSED to change on every recipe edit is not a useful claim.
 * What we actually want to know is that the export still faithfully carries the
 * kit: nothing dropped on the way out, nothing invented on the way out, and the
 * three artefacts still agreeing with each other about what the kit contains.
 * Every assertion below is DERIVED — none of them names a component, so they
 * cover the next recipe without an edit here.
 *
 * The numbers are exact on purpose. `toBe(0)` on a difference set says what went
 * wrong by naming it; `toBeLessThan(5)` would let four regressions through and
 * would have to be re-tuned every time the kit grows.
 *
 * WHAT WAS KEPT. buildTokens.test.ts.snap (7,801 lines) stays: it pins computed
 * token VALUES across 26 theme × mode combinations, which is a matrix of numbers
 * no assertion can restate more clearly, and it does not churn on recipe edits.
 * The small export snapshots stay too — genJson, genTailwind, genSkill,
 * genRegistry and the conformance report are between 81 and 752 lines and are
 * read rather than skipped.
 */

const css = genCss(DEFAULT_CONFIG)
const contract = JSON.parse(genContract(DEFAULT_CONFIG))
const designMd = genDesignMd(DEFAULT_CONFIG)

/** Every class the kit DECLARES: the recipes plus both global layers. */
function declaredClasses(): Set<string> {
  const out = new Set<string>()
  for (const r of RECIPES) {
    for (const rule of parseCss(stripComments(r.css))) {
      for (const c of classesIn(rule.selector)) out.add(c)
    }
  }
  for (const src of [globalLayer({ scope: '' }), platformFloor({ scope: '' })]) {
    for (const rule of parseCss(stripComments(src))) {
      for (const c of classesIn(rule.selector)) out.add(c)
    }
  }
  return out
}

/** Every class the EXPORT emits, read with the same parser — never a regex.
 *  A regex over `^…{` sees only the last line of a multi-line selector list and
 *  reported five classes as dropped that were plainly present. */
function exportedClasses(): Set<string> {
  return new Set<string>(parseCss(stripComments(css)).flatMap((r: { selector: string }) => classesIn(r.selector)))
}

describe('the CSS export carries the kit, whole', () => {
  const declared = declaredClasses()
  const exported = exportedClasses()

  it('drops nothing: every declared class reaches the export', () => {
    const missing = [...declared].filter((c) => !exported.has(c))
    expect(missing, `declared but never exported: ${missing.join(', ')}`).toEqual([])
    // A floor, not a target — it only proves the set is real rather than empty,
    // so it sits well below the true count (794 after the four-layer cut).
    expect(declared.size).toBeGreaterThan(500)
  })

  it('invents nothing: the export adds only .dark, which no recipe declares', () => {
    const extra = [...exported].filter((c) => !declared.has(c))
    expect(extra.sort()).toEqual(['dark'])
  })

  it('embeds every recipe VERBATIM, in declaration order', () => {
    /* The strongest single assertion here, and the one that does most of what
     * the 7,985-line snapshot was really for: it covers dropped, mangled AND
     * reordered in one line each, because the export turns out to embed recipe
     * CSS byte-for-byte rather than reformatting it.
     *
     * Order is not cosmetic in a single stylesheet — two rules of equal
     * specificity are settled by source order, so a reordered bundle silently
     * changes which declaration wins.
     *
     * (The first attempt looked for each recipe's first SELECTOR and failed on
     * a true bundle: `.btn` occurs in the global layer long before the buttons
     * recipe, so indexOf found the wrong copy and called the order broken.) */
    const dropped = RECIPES.filter((r) => !css.includes(r.css.trim())).map((r) => r.id)
    expect(dropped, `not embedded verbatim: ${dropped.join(', ')}`).toEqual([])

    const positions = RECIPES.map((r) => css.indexOf(r.css.trim()))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('no recipe rule is scoped to the preview root — a scoped rule is dead on the way out', () => {
    /* The recipe contract at the top of recipes/index.ts says UNSCOPED, and for
     * a reason a consumer feels: `.cockpit-preview select.select {…}` embeds
     * fine and matches nothing on their page. Four rules carried the prefix
     * (found in Sprint K, fixed in N); this holds the contract for the next
     * one. Derived over every parsed rule — no list. */
    const scoped = RECIPES.flatMap((r) => parseCss(stripComments(r.css))
      .filter((rule: { selector: string }) => /\.cockpit-preview/.test(rule.selector))
      .map((rule: { selector: string }) => `${r.id}: ${rule.selector.trim().slice(0, 60)}`))
    expect(scoped, `recipe rules scoped to .cockpit-preview (dead in the export):\n  ${scoped.join('\n  ')}`).toEqual([])
  })

  it('puts :root before .dark, so dark mode overrides rather than is overridden', () => {
    expect(css.indexOf(':root {')).toBeGreaterThanOrEqual(0)
    expect(css.indexOf(':root {')).toBeLessThan(css.indexOf('.dark {'))
  })

  it('declares every token in the block it belongs to — light in :root, dark in .dark', () => {
    /* ⚠️ The first version read every `--k-*:` in the whole file, and dropping
     * --k-primary from the light set did not fail it: the .dark block still
     * declared the name, so the token counted as present while :root had lost
     * it. Half a check — the same shape as the target-size scan that measured
     * height and passed a 30px-wide field. A token belongs to a BLOCK. */
    const blockAfter = (marker: string) => {
      const open = css.indexOf(marker)
      if (open < 0) return ''
      return css.slice(open, css.indexOf('}', open))
    }
    const root = blockAfter(':root {')
    const dark = blockAfter('.dark {')
    const namesIn = (block: string) => new Set([...block.matchAll(/(--k-[\w-]+)\s*:/g)].map((m) => m[1]))

    const light = Object.keys(buildTokens({ ...DEFAULT_CONFIG, mode: 'light' }).vars)
    const darkVars = Object.keys(buildTokens({ ...DEFAULT_CONFIG, mode: 'dark' }).vars)
    const missingLight = light.filter((v) => !namesIn(root).has(v))
    const missingDark = darkVars.filter((v) => !namesIn(dark).has(v))
    expect(missingLight, `absent from :root: ${missingLight.join(', ')}`).toEqual([])
    expect(missingDark, `absent from .dark: ${missingDark.join(', ')}`).toEqual([])
    expect(light.length).toBeGreaterThan(200)
  })
})

describe('the contract describes the same kit the CSS ships', () => {
  it('names every recipe exactly once across the tier ladder', () => {
    /* The contract is what `uicockpit check` verifies a consumer against, so a
     * recipe missing here is a component the checker cannot enforce and a
     * recipe listed twice is one it enforces under two tiers. */
    const tiers: string[] = Object.values(contract.components.tiers).flat() as string[]
    const ids = RECIPES.map((r) => r.id)
    expect([...tiers].sort()).toEqual([...ids].sort())
    expect(tiers.length).toBe(new Set(tiers).size)
  })

  it('carries exactly the tokens buildTokens emits — no more, no fewer', () => {
    const vars = Object.keys(buildTokens(DEFAULT_CONFIG).vars)
    expect(Object.keys(contract.tokens).sort()).toEqual([...vars].sort())
  })

  it('keeps its top-level shape, which the CLI and the MCP server both read', () => {
    expect(Object.keys(contract)).toEqual([
      '$schema', 'contractVersion', 'name', 'config',
      'tokens', 'tokensDark', 'components', 'compositions', 'rules', 'accessibility',
    ])
    expect(contract.rules.length).toBeGreaterThan(0)
    for (const rule of contract.rules) {
      expect(rule).toHaveProperty('id')
      expect(rule).toHaveProperty('statement')
      expect(['error', 'warn', 'info']).toContain(rule.severity)
    }
  })
})

describe('design.md documents the kit it ships with', () => {
  /* design.md is genBrief (the human half) plus an agent appendix. The kit's
   * sections are documented in the FIRST half, so that is where they are asserted
   * — the appendix carries 101 of 110 and checking the whole document would pass
   * on the appendix's copy while the human half had lost a component. */
  const brief = designMd.split('## For your AI agent')[0] ?? ''

  it('documents every section the kit defines', () => {
    const sections = [...new Set(RECIPES.map((r) => r.section).filter(Boolean))] as string[]
    const missing = sections.filter((s) => !brief.includes(s))
    expect(missing, `kit sections absent from design.md: ${missing.join(', ')}`).toEqual([])
    // A floor, not a count: 97 recipes after the four-layer cut, and it only
    // proves the set is real rather than empty.
    expect(sections.length).toBeGreaterThan(80)
  })

  it('documents no component the kit does not ship', () => {
    /* The direction that rots silently: a deleted component whose documentation
     * stays behind tells the consumer's agent to use a class that no longer
     * exists. Two components survived their own deletion for an hour in a
     * sibling gate for exactly this reason.
     *
     * The subjects are DERIVED — every ### heading in the document. FURNITURE is
     * named because it has to be: these five headings are the document's own
     * structure, not components, and no property of the text distinguishes them
     * from a component heading. It is a list of five prose headings, not a list
     * of components — the denominator stays derived, which is the part that
     * matters. If a copy edit renames one, this fails loudly and somebody reads
     * the change, which is the correct outcome. */
    const FURNITURE = new Set([
      'Row context → component size',
      'Z-index stack',
      'Breakpoints (mobile-first, Tailwind-compatible)',
      'Container widths',
      'Charts — wire the palette into any chart library',
    ])
    const sections = new Set(RECIPES.map((r) => r.section).filter(Boolean) as string[])
    const headings = [...designMd.matchAll(/^### (.+)$/gm)].map((m) => (m[1] ?? '').trim())
    const orphans = headings.filter((h) => !FURNITURE.has(h) && !sections.has(h))
    expect(orphans, `documented but not in the kit: ${orphans.join(', ')}`).toEqual([])
    expect(headings.length).toBeGreaterThan(FURNITURE.size)
  })
})
