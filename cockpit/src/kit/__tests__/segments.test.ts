import { describe, it, expect } from 'vitest'
import { RECIPES } from '../recipes'
import {
  FOUNDATIONS,
  COMPONENT_USES,
  SECTION_USES,
  STANDALONE_ATOMS,
  tierOf,
  usesOf,
  idsByTier,
  orphanAtoms,
  isCovered,
} from '../segments'

const IDS = new Set(RECIPES.map((r) => r.id))

describe('segment graph integrity', () => {
  it('every foundation id is a real recipe', () => {
    for (const id of FOUNDATIONS) expect(IDS.has(id), `unknown foundation: ${id}`).toBe(true)
  })

  it('every component id is a real recipe', () => {
    for (const id of Object.keys(COMPONENT_USES)) expect(IDS.has(id), `unknown component: ${id}`).toBe(true)
  })

  it('every `uses` edge points at a real recipe', () => {
    for (const [component, uses] of Object.entries(COMPONENT_USES))
      for (const u of uses) expect(IDS.has(u), `${component} uses unknown segment: ${u}`).toBe(true)
  })

  it('every section id is a real recipe and its edges resolve', () => {
    for (const [section, uses] of Object.entries(SECTION_USES)) {
      expect(IDS.has(section), `unknown section: ${section}`).toBe(true)
      for (const u of uses) expect(IDS.has(u), `${section} uses unknown segment: ${u}`).toBe(true)
    }
  })

  it('a component never composes a foundation (foundations are upstream of the catalog)', () => {
    for (const [component, uses] of Object.entries(COMPONENT_USES))
      for (const u of uses) expect(tierOf(u), `${component} uses foundation: ${u}`).not.toBe('foundation')
  })

  it('every recipe resolves to exactly one tier; partitions cleanly', () => {
    const tiers = RECIPES.map((r) => tierOf(r.id))
    expect(tiers.every((t) => t === 'foundation' || t === 'atom' || t === 'component' || t === 'section')).toBe(true)
    const f = idsByTier('foundation').length
    const a = idsByTier('atom').length
    const b = idsByTier('component').length
    const sh = idsByTier('section').length
    expect(f + a + b + sh).toBe(RECIPES.length)
  })

  it('tier counts match the registry (Foundation 4 · Component 28 · Section 3 · Atom = rest)', () => {
    expect(idsByTier('foundation')).toHaveLength(FOUNDATIONS.length)
    expect(idsByTier('component')).toHaveLength(Object.keys(COMPONENT_USES).length)
    expect(idsByTier('section')).toHaveLength(Object.keys(SECTION_USES).length)
    expect(idsByTier('foundation')).toHaveLength(4)
    expect(idsByTier('component')).toHaveLength(28)
    expect(idsByTier('section')).toHaveLength(3)
  })

  it('every standalone-blessed id is a real ATOM (not a component/foundation)', () => {
    for (const id of STANDALONE_ATOMS) {
      expect(IDS.has(id), `unknown standalone: ${id}`).toBe(true)
      expect(tierOf(id), `${id} is blessed standalone but isn't an atom`).toBe('atom')
    }
  })

  it('every atom is covered — composed by a component OR blessed standalone', () => {
    for (const id of idsByTier('atom')) expect(isCovered(id), `uncovered atom: ${id}`).toBe(true)
  })

  it('usesOf returns [] for atoms and foundations', () => {
    expect(usesOf('buttons')).toEqual([])
    expect(usesOf('button-finish')).toEqual([])
    expect(usesOf('sidebar')).toEqual(['navigation-row', 'avatar', 'badges-pills'])
  })
})

describe('orphan-atom worklist', () => {
  // The coverage contract: every atom must have ≥1 parent component. The list below
  // is the current worklist — atoms with NO parent component yet → build their home
  // component, or cut/merge. It SHRINKS as components are built. When that happens this
  // assertion goes red — update it consciously; the shrink is the signal that the
  // contract got thicker.
  //
  // History: 34 → 30 (data-table, step 2) → 25 (form-panel, step 3) → 0 (step 4a):
  // filter-bar adopted slider·tag-input, auth adopted passwordinput, and the
  // remaining overlay/utility/standalone-control primitives were blessed as
  // STANDALONE_ATOMS. The coverage contract is now fully satisfied — keep it there.
  it('has converged: zero orphan atoms', () => {
    expect(orphanAtoms()).toEqual([])
  })
})
