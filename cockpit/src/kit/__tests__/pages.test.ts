import { describe, it, expect } from 'vitest'
import { RECIPES } from '../recipes'
import { tierOf } from '../segments'
import { COMPONENT_PAGES } from '../../stage/views/ComponentGallery'

/**
 * Every component someone can ADOPT has a public page — the meter behind the
 * components reference (Sprint M·1). Derived: the subjects are the recipes of
 * the component and atom tiers, read off the kit; the exceptions are named
 * with a reason. A recipe added to the kit without a page fails here until it
 * gets one, or is written down as a grouping label.
 *
 * Section-tier recipes (page regions, shells) and foundations (grammar) are
 * not subjects: the shells are demonstrated by the showcase and the layout
 * primitives by FoundationsView. Six page regions that have a gallery card do
 * carry pages — chosen, not required.
 */
const NO_PAGE: Record<string, string> = {
  'form-primitives': 'a grouping label for the number / password / search field variants, each of which has its own page',
}

describe('the components reference covers the kit', () => {
  const pagesByRecipe = new Map<string, string[]>()
  for (const p of COMPONENT_PAGES) pagesByRecipe.set(p.recipeId, [...(pagesByRecipe.get(p.recipeId) ?? []), p.slug])

  it('every component- and atom-tier recipe has a page, or a written reason not to', () => {
    const missing = RECIPES
      .filter((r) => (tierOf(r.id) === 'component' || tierOf(r.id) === 'atom') && !NO_PAGE[r.id] && !pagesByRecipe.has(r.id))
      .map((r) => `${r.id} (${tierOf(r.id)})`)
    expect(missing, `adoptable recipes with no public page:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('every exception is still a real recipe and still without a page — a stale exception is a hole', () => {
    for (const id of Object.keys(NO_PAGE)) {
      expect(RECIPES.some((r) => r.id === id), `${id} is not a recipe`).toBe(true)
      expect(pagesByRecipe.has(id), `${id} has a page now — remove it from NO_PAGE`).toBe(false)
    }
  })

  it('every page points at a real recipe, slugs are unique, blurbs are sentences', () => {
    const ids = new Set(RECIPES.map((r) => r.id))
    const slugs = COMPONENT_PAGES.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const p of COMPONENT_PAGES) {
      expect(ids.has(p.recipeId), `${p.slug} → ${p.recipeId} is not a recipe`).toBe(true)
      expect(p.blurb.length, `${p.slug} blurb too short`).toBeGreaterThan(30)
      expect(/^[a-z0-9-]+$/.test(p.slug), `${p.slug} is not a slug`).toBe(true)
    }
  })
})
