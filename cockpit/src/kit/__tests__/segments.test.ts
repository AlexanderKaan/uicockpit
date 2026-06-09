import { describe, it, expect } from 'vitest'
import { RECIPES } from '../recipes'
import {
  FOUNDATIONS,
  BLOCK_USES,
  tierOf,
  usesOf,
  idsByTier,
  orphanAtoms,
} from '../segments'

const IDS = new Set(RECIPES.map((r) => r.id))

describe('segment graph integrity', () => {
  it('every foundation id is a real recipe', () => {
    for (const id of FOUNDATIONS) expect(IDS.has(id), `unknown foundation: ${id}`).toBe(true)
  })

  it('every block id is a real recipe', () => {
    for (const id of Object.keys(BLOCK_USES)) expect(IDS.has(id), `unknown block: ${id}`).toBe(true)
  })

  it('every `uses` edge points at a real recipe', () => {
    for (const [block, uses] of Object.entries(BLOCK_USES))
      for (const u of uses) expect(IDS.has(u), `${block} uses unknown segment: ${u}`).toBe(true)
  })

  it('a block never composes a foundation (foundations are upstream of the catalog)', () => {
    for (const [block, uses] of Object.entries(BLOCK_USES))
      for (const u of uses) expect(tierOf(u), `${block} uses foundation: ${u}`).not.toBe('foundation')
  })

  it('every recipe resolves to exactly one tier; partitions cleanly', () => {
    const tiers = RECIPES.map((r) => tierOf(r.id))
    expect(tiers.every((t) => t === 'foundation' || t === 'atom' || t === 'block')).toBe(true)
    const f = idsByTier('foundation').length
    const a = idsByTier('atom').length
    const b = idsByTier('block').length
    expect(f + a + b).toBe(RECIPES.length)
  })

  it('tier counts match the registry (Foundation 3 · Block 25 · Atom = rest)', () => {
    expect(idsByTier('foundation')).toHaveLength(FOUNDATIONS.length)
    expect(idsByTier('block')).toHaveLength(Object.keys(BLOCK_USES).length)
    expect(idsByTier('foundation')).toHaveLength(3)
    expect(idsByTier('block')).toHaveLength(25)
  })

  it('usesOf returns [] for atoms and foundations', () => {
    expect(usesOf('buttons')).toEqual([])
    expect(usesOf('button-finish')).toEqual([])
    expect(usesOf('sidebar')).toEqual(['navigation-row', 'avatar', 'badges-pills'])
  })
})

describe('orphan-atom worklist', () => {
  // The coverage contract: every atom must have ≥1 parent block. The list below
  // is the current worklist — atoms with NO parent block yet → build their home
  // block, or cut/merge. It SHRINKS as blocks are built (e.g. the data-table block
  // will adopt table·toolbar·pagination-breadcrumb·select-trigger). When that
  // happens this assertion goes red — update it consciously; the shrink is the
  // signal that the contract got thicker.
  it('matches the tracked orphan list', () => {
    expect(orphanAtoms()).toEqual([
      'toolbar',
      'button-group',
      'aspect-ratio',
      'scroll-area',
      'form',
      'alert',
      'tabs',
      'table',
      'tooltip',
      'switch-toggle',
      'slider',
      'skeleton',
      'select-trigger',
      'spinner',
      'interactive-list-row',
      'accordion',
      'pagination-breadcrumb',
      'combobox',
      'tag-input',
      'popover',
      'hover-card',
      'segmented-control-toggle-group',
      'separator',
      'description-list',
      'banner',
      'input-otp',
      'attachment-chip-family',
      'inline-status-meta-micro-components',
      'navigation-menu',
      'context-menu',
      'numberinput',
      'passwordinput',
      'phoneinput',
      'radio-card',
    ])
  })
})
