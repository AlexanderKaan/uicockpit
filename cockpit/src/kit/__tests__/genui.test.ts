import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RECIPES } from '../recipes'
import { globalLayer } from '../globalLayer'
import { IconProvider } from '../../icons/Icon'
import { DEFAULT_CONFIG } from '../../tokens/defaults'
import { admit, typesUsed, GEN_CATALOG, GEN_TYPES, LIMITS } from '../../genui/spec'
import { GenTree } from '../../genui/render'
import { PRESETS } from '../../genui/presets'
import { SAMPLES } from '../../genui/samples'
import MANIFEST from '../manifest.json'
// @ts-expect-error — the kit model is the single .mjs parser the gates read
import { parseKit } from '../../../scripts/lib/kit-model.mjs'
// @ts-expect-error — the forge core, zero-dep, no types on purpose
import { createForge } from '../../../../cli/src/forge.mjs'
import FORGE_DATA from '../../../../cli/data/forge.json'

/**
 * Generative UI rests on one promise: an assistant that paints with these
 * components cannot paint anything else. Four guards hold it, all derived from
 * the kit rather than from a list kept here:
 *
 *   · every catalogue type renders with a recipe the kit ships, and that recipe
 *     carries a provenance line — "every component has a source" applies to
 *     generative output too, or the fourth service undoes the first three;
 *   · every class the renderer emits for the presets is a class the kit ships —
 *     no genui stylesheet, no improvised div; a look the kit lacks goes into
 *     the kit first;
 *   · a type the catalogue does not know is refused with the forge's verdict,
 *     and the kit's own composition rules (a card in a card) refuse too;
 *   · the sandbox's presets are themselves clean, so what the page shows as
 *     "with the components" is what the guards allow — and the refusals preset
 *     refuses exactly what it says it does.
 */
const kit = parseKit()
const kitClasses = new Set<string>([...kit.classes.keys()])
/* The global layer ships too (.sr-only, focus rings, validation) — the export
 * carries it ahead of the recipes; the kit model parses recipes only. */
for (const m of globalLayer({ scope: '' }).matchAll(/\.([a-z][a-z0-9-]*)/g)) kitClasses.add(m[1]!)
const recipeIds = new Set(RECIPES.map((r) => r.id))
const forge = createForge(FORGE_DATA)
type ForgeRecipe = { id: string; provenance?: { layer: number; source: string }[] }
const forgeRecipes = new Map<string, ForgeRecipe>((FORGE_DATA as { kit: { recipes: ForgeRecipe[] } }).kit.recipes.map((r) => [r.id, r]))
const manifest = (MANIFEST as { components: Record<string, unknown> }).components

const html = (spec: unknown) => renderToStaticMarkup(
  createElement(IconProvider, { set: DEFAULT_CONFIG.iconSet, children: createElement(GenTree, { tree: admit(JSON.parse(JSON.stringify(spec)), forge).tree }) }),
)
const classesIn = (markup: string) => {
  const out = new Set<string>()
  for (const m of markup.matchAll(/class="([^"]*)"/g)) for (const c of m[1]!.split(/\s+/).filter(Boolean)) out.add(c)
  return out
}
/* A modifier the kit ships as `.x--y` counts; a part it ships as `.block__part`
 * counts; `.block__part--mod` counts when the part does. Same reading as
 * manifest.test.ts. */
const shipped = (c: string) => kitClasses.has(c) || kitClasses.has(c.split('--')[0]!)

describe('generative UI — the catalogue has a source', () => {
  it('every type renders with a recipe the kit ships, and the recipe has a provenance line', () => {
    const bad: string[] = []
    for (const t of GEN_TYPES) {
      const { recipe } = GEN_CATALOG[t]
      if (!recipeIds.has(recipe)) { bad.push(`${t} → ${recipe}: not a recipe`); continue }
      const fr = forgeRecipes.get(recipe)
      const core = (fr?.provenance ?? []).filter((s) => s.layer !== 3)
      if (!fr) bad.push(`${t} → ${recipe}: not in forge.json`)
      /* Two recipes are the kit's GRAMMAR, not components: the layout
       * primitives (l-stack, l-grid — Every Layout, foundation tier) and the
       * composition utilities (metric, eyebrow, num — the phrase book). They
       * carry no catalogue line because no catalogue names a stack; the
       * derivation lists them as "not components". Everything else must. */
      else if (!core.length && recipe !== 'layout-primitives' && recipe !== 'composition') bad.push(`${t} → ${recipe}: no core provenance line`)
      if (!(recipe in manifest) && recipe !== 'layout-primitives') bad.push(`${t} → ${recipe}: not in the manifest`)
    }
    expect(bad, bad.join('\n')).toEqual([])
  })
})

describe('generative UI — the renderer writes kit classes only', () => {
  for (const p of PRESETS.filter((x) => x.id !== 'refusals')) {
    it(`preset "${p.name}" admits clean and renders in the kit's classes`, () => {
      const a = admit(JSON.parse(JSON.stringify(p.spec)), forge)
      expect(a.issues.filter((i) => i.level === 'refused'), `refusals in a clean preset:\n${a.issues.map((i) => `${i.path} ${i.message}`).join('\n')}`).toEqual([])
      expect(a.count).toBeGreaterThan(2)
      const markup = html(p.spec)
      const foreign = [...classesIn(markup)].filter((c) => !shipped(c))
      expect(foreign, `classes the kit does not ship, in "${p.name}":\n  ${foreign.join('\n  ')}`).toEqual([])
      expect(markup).not.toContain('data-genui-refused')
    })
  }

  it('every catalogue type has a SAMPLE that admits and renders in kit classes — the reference the sandbox offers', () => {
    /* samples.ts is what the page's "What you can ask for" inserts. Every type
     * must have one, every one must admit clean, every one must render in the
     * kit's classes — so what the reference offers is what the renderer paints. */
    const missing = GEN_TYPES.filter((t) => !SAMPLES[t])
    expect(missing, `catalogue types without a sample: ${missing.join(', ')}`).toEqual([])
    for (const t of GEN_TYPES) {
      const spec = { blocks: [SAMPLES[t]] }
      const a = admit(JSON.parse(JSON.stringify(spec)), forge)
      expect(a.issues.filter((i) => i.level === 'refused').map((i) => i.message), `sample ${t} must admit`).toEqual([])
      const foreign = [...classesIn(html(spec))].filter((c) => !shipped(c))
      expect(foreign, `classes the kit does not ship, rendering the ${t} sample:\n  ${foreign.join('\n  ')}`).toEqual([])
    }
    // and the presets between them exercise most of the catalogue — the page shows the vocabulary, not a corner of it
    const seen = new Set<string>()
    for (const p of PRESETS) for (const t of typesUsed(admit(JSON.parse(JSON.stringify(p.spec)), forge).tree)) seen.add(t)
    expect(seen.size, 'presets should exercise at least half of the catalogue').toBeGreaterThanOrEqual(Math.ceil(GEN_TYPES.length / 2))
  })
})

describe('generative UI — admission refuses what the components do not admit', () => {
  it('an unknown type is refused with the forge\'s verdict, in place', () => {
    const a = admit({ blocks: [{ type: 'kanban' }, { type: 'carousel', items: [] }, { type: 'text', text: 'ok' }] }, forge)
    const refused = a.issues.filter((i) => i.level === 'refused')
    expect(refused.map((i) => i.path)).toEqual(['$.blocks[0]', '$.blocks[1]'])
    expect(refused[0]!.forge?.verdict).toBe('none')                       // no layer names a kanban board
    expect(refused[1]!.forge?.verdict).toBe('exists')                     // the kit has a carousel — not admitted to generative output
    expect(refused[1]!.message).toMatch(/not admitted to generative output/)
    const markup = html({ blocks: [{ type: 'kanban' }] })
    expect(markup).toContain('data-genui-refused="kanban"')
    expect(a.tree[2]).toMatchObject({ ok: true })                         // the clean node still renders
  })

  it('a card inside a card is refused (the card recipe says so), a foot holds buttons only', () => {
    const a = admit({ blocks: [{ type: 'card', title: 't', children: [{ type: 'card', title: 'inner' }], actions: [{ type: 'badge', text: 'x' }] }] }, forge)
    const msgs = a.issues.filter((i) => i.level === 'refused').map((i) => i.message)
    expect(msgs.some((m) => /card inside a card/.test(m))).toBe(true)
    expect(msgs.some((m) => /buttons only/.test(m))).toBe(true)
  })

  it('a name that is not ours but IS our component is read through the forge — and says so', () => {
    /* "Card" (case), "row" (an alias), "summary list" / "task list" / "buttons"
     * (the forge: the phrase resolves to a recipe the catalogue renders). A
     * model that writes those gets the component, with a warning that names the
     * reading; a word that resolves to nothing the catalogue has stays refused. */
    const a = admit({ blocks: [
      { type: 'Card', title: 'c' },
      { type: 'row', children: [{ type: 'badge', text: 'x' }] },
      { type: 'summary list', items: [{ label: 'l', value: 'v' }] },
      { type: 'task list', items: [{ name: 'n', status: { text: 's' } }] },
      { type: 'buttons', text: 'b' },
      { type: 'kanban' },
    ] }, forge)
    expect(a.tree.map((t) => (t.ok ? t.node.type : `refused:${t.type}`))).toEqual(['card', 'cluster', 'facts', 'tasks', 'button', 'refused:kanban'])
    const w = a.issues.filter((i) => i.level === 'warning').map((i) => i.message)
    expect(w.some((m) => /`Card` read as `card`/.test(m))).toBe(true)
    expect(w.some((m) => /`summary list` read as `facts` \(Description list\) — via the forge/.test(m))).toBe(true)
    expect(a.issues.filter((i) => i.level === 'refused').map((i) => i.path)).toEqual(['$.blocks[5]'])
  })

  it('an unknown field is warned about, never silently dropped', () => {
    const a = admit({ blocks: [{ type: 'card', titel: 'typo', title: 'ok' }] }, forge)
    const w = a.issues.filter((i) => i.level === 'warning').map((i) => i.message)
    expect(w).toHaveLength(1)
    expect(w[0]).toMatch(/unknown field `titel` on `card` — ignored \(its fields: title, desc/)
    expect(a.tree[0]).toMatchObject({ ok: true })
  })

  it('missing required fields refuse; budgets trim and say so', () => {
    const a = admit({ blocks: [{ type: 'alert', tone: 'info' }, { type: 'facts', items: Array.from({ length: LIMITS.items + 5 }, (_, i) => ({ label: `l${i}`, value: 'v' })) }] }, forge)
    expect(a.issues.find((i) => i.level === 'refused')?.message).toMatch(/`alert` needs `text`/)
    expect(a.issues.find((i) => i.level === 'warning')?.message).toMatch(new RegExp(`the first ${LIMITS.items} render`))
  })

  it('the refusals preset refuses exactly what it says: kanban, carousel, a card in a card — reads "summary list" as facts — and renders the rest', () => {
    const p = PRESETS.find((x) => x.id === 'refusals')!
    const a = admit(JSON.parse(JSON.stringify(p.spec)), forge)
    const refused = a.issues.filter((i) => i.level === 'refused')
    expect(refused.map((i) => i.path)).toEqual(['$.blocks[2]', '$.blocks[3]', '$.blocks[4].children[0]'])
    expect(a.tree.filter((t) => t.ok).length).toBe(4)                    // heading · summary list→facts · card · table
    expect(a.tree[1]).toMatchObject({ ok: true, node: { type: 'facts' } })
    expect(a.issues.some((i) => i.level === 'warning' && /`summary list` read as `facts`/.test(i.message))).toBe(true)
    const foreign = [...classesIn(html(p.spec))].filter((c) => !shipped(c))
    expect(foreign).toEqual([])                                            // even the refusal renders in kit classes (.alert)
  })
})
