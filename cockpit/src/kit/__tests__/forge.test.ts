import { describe, it, expect } from 'vitest'
// @ts-expect-error — the forge core and the value judge are the plain .mjs
// modules the CLI and the gates run; typed declarations would be a second copy.
import { createForge } from '../../../../cli/src/forge.mjs'
// @ts-expect-error — same: scripts/lib/values.mjs is audit:values' judgement.
import { judgeText, AXES } from '../../../scripts/lib/values.mjs'
import FORGE_DATA from '../../../../cli/data/forge.json'
import { RECIPES } from '../recipes'
import { COMPONENT_PAGES } from '../../stage/views/ComponentGallery'
import { buildTokens } from '../../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../../tokens/defaults'

/**
 * The forge, from the kit's side. cli/test/forge.test.mjs holds the resolver
 * to its own data; these tests hold the DATA to the kit and the generated CSS
 * to the kit's own gates — the two things the cli package cannot see.
 *
 * "A component described in a sentence comes out with CSS that passes the same
 * gates the kit is held to" (ROADMAP, Sprint L, done-when) is a claim about
 * audit:values, so it is tested WITH audit:values: the scaffold goes through
 * judgeText — the very function the gate runs over the recipes — and every hard
 * axis must come back empty. Not a regex that resembles the gate; the gate.
 */
const forge = createForge(FORGE_DATA)
const HARD = ['spacing', 'fontSize', 'fontFamily', 'motion']

describe('cli/data/forge.json is the kit, not a copy of it', () => {
  it('carries every recipe, once, with the tier ladder intact', () => {
    const ids = FORGE_DATA.kit.recipes.map((r) => r.id)
    expect([...ids].sort()).toEqual(RECIPES.map((r) => r.id).sort())
    expect(new Set(ids).size).toBe(ids.length)
    for (const r of FORGE_DATA.kit.recipes) expect(['foundation', 'atom', 'component', 'section']).toContain(r.tier)
  })

  it('carries every public component page, and the pages point at real recipes', () => {
    const slugs = FORGE_DATA.kit.recipes.flatMap((r) => r.pages.map((p) => p.slug)).sort()
    expect(slugs).toEqual(COMPONENT_PAGES.map((p) => p.slug).sort())
  })

  it('carries exactly the tokens buildTokens emits — the scaffold generator refuses any other', () => {
    expect([...FORGE_DATA.tokens].sort()).toEqual(Object.keys(buildTokens(DEFAULT_CONFIG).vars).sort())
  })
})

describe('what the forge generates passes the value gate the kit is held to', () => {
  /* Every concept the forge would SCAFFOLD for — the census-only names and the
   * layer-2/4 names nothing covers — run through the gate. Derived from the
   * data: a new Open UI concept is covered without an edit here. */
  const scaffoldable: string[] = []
  for (const v of Object.values(FORGE_DATA.catalogues.openui.names) as { spelled: string }[]) {
    const verdict = forge.resolve(v.spelled)
    if (verdict.scaffold) scaffoldable.push(v.spelled)
  }

  it('finds the census-only concept(s) to scaffold — today that is Avatar; everything else Open UI names is covered, platform, or decided', () => {
    expect(scaffoldable).toContain('Avatar')
  })

  /* The generator itself, over names of every role shape — a census hit, an
   * overlay, a status, a control, a list — so a change to the scaffold cannot
   * slip a literal past the gate on a shape the routing happens not to reach. */
  const shapes = [...scaffoldable, 'Toast', 'Status chip', 'Stepper control', 'Kanban board', 'Rating', 'Stat tile']
  it.each(shapes)('scaffold for "%s": zero findings on every hard axis of audit:values', (name) => {
    const v = scaffoldable.includes(name) ? forge.resolve(name) : { scaffold: forge.scaffold(name, 'test') }
    const F = judgeText(v.scaffold.css, `forge:${v.scaffold.id}`)
    for (const axis of AXES) expect(Array.isArray(F[axis])).toBe(true)
    for (const axis of HARD) expect(F[axis], `${axis} findings: ${JSON.stringify(F[axis])}`).toEqual([])
    // and no review-axis literal either — the scaffold is tokens through and through
    expect(F.color).toEqual([])
    expect(F.radius).toEqual([])
    expect(F.shadow).toEqual([])
    expect(F.border).toEqual([])
  })

  it('a composition uses only classes the kit ships', () => {
    const v = forge.resolve('a dialog with a form and two buttons')
    expect(v.verdict).toBe('compose')
    const kitClasses = new Set<string>()
    for (const r of FORGE_DATA.kit.recipes) { if (r.block) kitClasses.add(r.block); for (const p of r.parts) kitClasses.add(p) }
    for (const m of (v.composition as string).matchAll(/class="([^"]+)"/g)) {
      for (const c of (m[1] ?? '').split(/\s+/).filter(Boolean)) {
        // btn--sm and friends are modifiers of a shipped block
        expect(kitClasses.has(c) || kitClasses.has(c.split('--')[0] ?? c), `${c} is not a kit class`).toBe(true)
      }
    }
  })
})
