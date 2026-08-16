import { describe, it, expect } from 'vitest'
import { RECIPES } from '../recipes'
import { explainerFor } from '../explainer'
import { COMPONENT_PAGES } from '../../stage/views/ComponentGallery'
import MANIFEST from '../manifest.json'
// @ts-expect-error — the kit model is the single .mjs parser the gates read
import { parseKit } from '../../../scripts/lib/kit-model.mjs'

/**
 * The manifest (src/kit/manifest.json) is the SHAPE of every component, read
 * off the rendered wall by scripts/gen-manifest.ts. It is data the forge, the
 * component page and — later — a runtime renderer consume, so it has to be
 * true about the kit it describes. Three guards, all derived:
 *
 *   · it is not stale: its recipe set is the kit's (regenerate with
 *     `npm run gen:manifest` after anything that changes how a component
 *     renders — the same discipline as evidence.json);
 *   · every published page's block is on the wall — a page whose specimen does
 *     not render its own recipe's block would be documenting a shape nobody
 *     measured;
 *   · every skeleton is written in kit classes only, and every part the CSS
 *     declares is either on the wall or counted: the count is a RATCHET, exact
 *     in both directions, because a part nobody has ever seen rendered is a
 *     part nobody has demonstrated — and 45 of them is the honest number today.
 */
type Part = { rendered: boolean; cssDeclared: boolean }
type Entry = { block: string; instances: number; parts: Record<string, Part>; skeleton: string | null }
const components = MANIFEST.components as Record<string, Entry>
const kit = parseKit()
const kitClasses = new Set<string>([...kit.classes.keys()])

describe('the manifest describes the kit that ships', () => {
  it('covers exactly the recipes that have a block, and no others', () => {
    const withBlock = RECIPES.filter((r) => explainerFor(r.id)?.block).map((r) => r.id).sort()
    expect(Object.keys(components).sort(), 'run `npm run gen:manifest` (dev server up) — the manifest is out of step with the kit').toEqual(withBlock)
  })

  it('every published page renders its own recipe’s block on the wall', () => {
    const missing = COMPONENT_PAGES
      .filter((p) => components[p.recipeId] && components[p.recipeId]!.instances === 0)
      .map((p) => `${p.slug} → .${components[p.recipeId]!.block}`)
    expect(missing, `pages whose recipe block never renders on the wall:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('every skeleton is written in kit classes only', () => {
    const bad: string[] = []
    for (const [id, e] of Object.entries(components)) {
      if (!e.skeleton) continue
      for (const m of e.skeleton.matchAll(/class="([^"]*)"/g)) {
        for (const c of m[1]!.split(/\s+/).filter(Boolean)) {
          if (!kitClasses.has(c) && !kitClasses.has(c.split('--')[0]!)) bad.push(`${id}: .${c}`)
        }
      }
    }
    expect(bad, `classes in a skeleton that the kit does not ship:\n  ${bad.join('\n  ')}`).toEqual([])
  })

  it('parts declared in CSS but never rendered on the wall — a ratchet, exact both ways', () => {
    /* Every one of these is a part the recipe styles and no specimen shows: a
     * state part (`combobox__empty`), a part rendered outside its block
     * (`tasklist__count` sits above the <ol>), or a plain gap. The number may go
     * DOWN when a card demonstrates a part — then lower it here, in the same
     * commit — and may not go up: a new recipe arrives with its parts shown. */
    const CEILING = 45
    const unrendered: string[] = []
    for (const [id, e] of Object.entries(components)) {
      for (const [name, p] of Object.entries(e.parts)) if (p.cssDeclared && !p.rendered) unrendered.push(`${id} .${e.block}__${name}`)
    }
    if (unrendered.length > CEILING) {
      expect.fail(`${unrendered.length} parts are declared in CSS and never rendered (ceiling ${CEILING}) — demonstrate them or explain:\n  ${unrendered.join('\n  ')}`)
    }
    if (unrendered.length < CEILING) {
      expect.fail(`down to ${unrendered.length} unrendered parts from ${CEILING} — lower CEILING to ${unrendered.length} in this commit, or the win is not held`)
    }
    expect(unrendered.length).toBe(CEILING)
  })
})
