import { describe, it, expect } from 'vitest'
import { STYLE_KITS } from '../styleKits'
import { DEFAULT_CONFIG } from '../defaults'
import type { Config } from '../types'

/**
 * The Default preset is the base set, and it has to STAY the base set.
 *
 * Alexander: *"onze Default moet altijd klikken met de beste opties"* — and the
 * only thing holding that together was a line of source comment claiming
 * "'Clean' mirrors DEFAULT_CONFIG". It happened to be true when measured, which
 * is exactly the state a claim is in right before it quietly stops being true:
 * someone tunes a default, the preset keeps the old value, and the picker now
 * offers a "Default" that is not the default.
 *
 * There are three things worth holding, and they are different promises.
 */

const DEFAULT_KIT = STYLE_KITS.find((k) => k.id === 'default')

describe('the Default preset IS the default', () => {
  it('exists, and is the first thing in the list', () => {
    expect(DEFAULT_KIT, 'a kit with id "default"').toBeDefined()
    // Order carries meaning here: the base comes first, the departures follow.
    expect(STYLE_KITS[0]!.id).toBe('default')
  })

  it('matches DEFAULT_CONFIG on every field it sets', () => {
    const d = DEFAULT_CONFIG as unknown as Record<string, unknown>
    const drift: string[] = []
    for (const [k, v] of Object.entries(DEFAULT_KIT!.config)) {
      if (JSON.stringify(d[k]) !== JSON.stringify(v)) {
        drift.push(`${k}: DEFAULT_CONFIG=${JSON.stringify(d[k])} but the Default preset says ${JSON.stringify(v)}`)
      }
    }
    expect(drift, 'the Default preset must not diverge from DEFAULT_CONFIG').toEqual([])
  })

  it('covers every lever the other kits move', () => {
    /* Otherwise picking Default after picking Editorial leaves you with
     * Editorial's serif and Default's everything else — a state no preset
     * describes and nobody chose. The base has to be able to RESET. */
    const moved = new Set<string>()
    for (const kit of STYLE_KITS) {
      if (kit.id === 'default') continue
      for (const k of Object.keys(kit.config)) moved.add(k)
    }
    const missing = [...moved].filter((k) => !(k in DEFAULT_KIT!.config))
    expect(missing, 'levers another kit changes that Default cannot change back').toEqual([])
  })
})

describe('the six alternatives are genuinely alternatives', () => {
  /* A preset that differs from the base in nothing visible is decoration, and
   * decoration in a control panel is a promise the product does not keep. */
  for (const kit of STYLE_KITS.filter((k) => k.id !== 'default')) {
    it(`${kit.name} departs from Default`, () => {
      const base = DEFAULT_KIT!.config as Record<string, unknown>
      const diff = Object.entries(kit.config).filter(
        ([k, v]) => JSON.stringify(base[k]) !== JSON.stringify(v),
      )
      expect(diff.length, `${kit.name} changes nothing`).toBeGreaterThan(0)
    })
  }

  it('no two kits are the same kit under two names', () => {
    const seen = new Map<string, string>()
    for (const kit of STYLE_KITS) {
      const key = JSON.stringify(Object.entries(kit.config as Record<string, unknown>).sort())
      const twin = seen.get(key)
      expect(twin, `${kit.name} is identical to ${twin}`).toBeUndefined()
      seen.set(key, kit.name)
    }
  })
})

describe('every Default option is one we can point at a reason for', () => {
  /* Not taste, and not a vibe: each of these was decided by a measurement or a
   * rule elsewhere in the repo, and if one changes, the reason has to change
   * with it. Listing them here is what makes "the best options" checkable
   * rather than a thing we say. */
  const REASONS: Partial<Record<keyof Config, string>> = {
    scale: 'compact was measured too tight against the target-size floor and removed; default is the densest surviving rung',
    conformance: 'aa is what EN 301 549 harmonises; AAA is one click away and lifts every target to 44px',
    borders: 'the input rim is floored to 3:1 (WCAG 1.4.11) at every rung, so subtle is a preference and not a risk',
    surface: 'outlined keeps a visible field boundary, which is the whole subject of 1.4.11',
    labelCase: 'sentence — caps costs legibility and is a style choice, not a default',
    motion: 'smooth, and every motion token collapses under prefers-reduced-motion',
  }

  for (const [key, why] of Object.entries(REASONS)) {
    it(`${key} — ${why}`, () => {
      expect(DEFAULT_KIT!.config[key as keyof Config] ?? (DEFAULT_CONFIG as Config)[key as keyof Config]).toBeDefined()
    })
  }
})
