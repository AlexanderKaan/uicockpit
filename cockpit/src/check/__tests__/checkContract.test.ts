import { describe, it, expect } from 'vitest'
import { genContract } from '../../export/genContract'
// The verifier core lives in the runnable CLI (single source); vitest imports the
// pure function from it. The CLI block is guarded, so importing has no side effect.
import { checkContract } from '../../../scripts/uicockpit-check.mjs'
import { DEFAULT_CONFIG } from '../../tokens/defaults'

type Violation = { check: string; severity: string; file: string; line: number; message: string }

// A real contract from the live generator — the verifier reads exactly what the
// export tab ships, so the test exercises the genuine token + class vocabulary.
const contract = JSON.parse(genContract(DEFAULT_CONFIG))
const run = (files: { path: string; content: string }[]): Violation[] => checkContract(contract, files)

describe('uicockpit check — the contract verifier (Fase D4)', () => {
  it('passes clean code that uses real tokens + defined modifiers', () => {
    const v = run([
      { path: 'good.css', content: `.x { color: var(--k-primary); background: var(--k-surface); padding: var(--k-s-16); border-radius: var(--k-radius-md); }` },
      { path: 'good.tsx', content: `export const A = () => <button className="btn btn--primary">Go</button>` },
    ])
    expect(v.filter((x) => x.severity === 'error')).toEqual([])
  })

  it('flags an unknown token as an error', () => {
    const v = run([{ path: 'bad.css', content: `.x { color: var(--k-nope); }` }])
    const e = v.find((x) => x.check === 'tokens-exist')
    expect(e).toBeTruthy()
    expect(e!.severity).toBe('error')
    expect(e!.message).toContain('--k-nope')
  })

  it('flags an undefined modifier on a kit class as an error', () => {
    const v = run([{ path: 'bad.tsx', content: `<a className="btn btn--bogus" />` }])
    const e = v.find((x) => x.check === 'known-modifiers')
    expect(e).toBeTruthy()
    expect(e!.message).toContain('bogus')
  })

  it("ignores the consumer's own classes (unknown roots)", () => {
    const v = run([{ path: 'app.tsx', content: `<div className="my-widget--fancy acme-card__title--big" />` }])
    expect(v.filter((x) => x.check === 'known-modifiers')).toEqual([])
  })

  it('warns on a raw colour in CSS — the anti-generic wedge', () => {
    const v = run([{ path: 'bad.css', content: `.x { color: #6b7280; }` }])
    const w = v.find((x) => x.check === 'no-raw-color')
    expect(w).toBeTruthy()
    expect(w!.severity).toBe('warn')
  })

  it('warns on off-grid spacing but accepts on-grid px + --k-s-* tokens', () => {
    const v = run([{ path: 'x.css', content: `.a { padding: 13px; } .b { margin: 16px; } .c { gap: var(--k-s-8); }` }])
    const off = v.filter((x) => x.check === 'spacing-grid')
    expect(off.length).toBe(1)
    expect(off[0]!.message).toContain('13px')
  })

  it('does not flag custom-property definition lines (the token source) for raw colour', () => {
    // The exported tokens.css is one declaration per line — those are the token
    // SOURCE, not consumer usage, so the colour check exempts them.
    const v = run([{ path: 'tokens.css', content: ':root {\n  --k-bg: #ffffff;\n  --k-fg: #0a0a0a;\n}' }])
    expect(v.filter((x) => x.check === 'no-raw-color')).toEqual([])
  })

  // Phase 2 — the composition-reroll lint (the moat hole). A hand-rebuilt named
  // bundle using the RIGHT tokens passes every atom-level rule, yet is a silent
  // second version of the kit's `.eyebrow` / `.metric` / `.icon-tile`.
  describe('composition-reroll (the silent-second-version lint)', () => {
    it('warns when a non-kit rule rebuilds the .eyebrow bundle from its tokens', () => {
      const v = run([{ path: 'app.css', content:
        `.section-kicker {
           font-size: var(--k-type-eyebrow);
           font-weight: var(--k-weight-semibold);
           letter-spacing: var(--k-track-eyebrow);
           text-transform: uppercase;
           color: var(--k-fg-muted);
         }` }])
      const w = v.find((x) => x.check === 'composition-reroll')
      expect(w).toBeTruthy()
      expect(w!.severity).toBe('warn')
      expect(w!.message).toContain('eyebrow')
    })

    it('does NOT flag the consumer overriding the kit class itself', () => {
      const v = run([{ path: 'app.css', content:
        `.eyebrow { letter-spacing: var(--k-track-eyebrow); color: var(--k-fg-muted); font-size: var(--k-type-eyebrow); }` }])
      expect(v.filter((x) => x.check === 'composition-reroll')).toEqual([])
    })

    it('does NOT flag a rule that only partly overlaps a bundle (below threshold)', () => {
      const v = run([{ path: 'app.css', content:
        `.note { color: var(--k-fg-muted); font-size: var(--k-type-eyebrow); }` }])
      expect(v.filter((x) => x.check === 'composition-reroll')).toEqual([])
    })
  })

  // Phase 3 — uicockpit.json adoption config (the brownfield escape hatch).
  describe('allowColors / inline escape hatch (the sanctioned brand colour)', () => {
    it('exempts a colour declared in uicockpit.json allowColors', () => {
      const css = [{ path: 'brand.css', content: `.x { color: #1da1f2; } .y { color: #ff0000; }` }]
      expect(checkContract(contract, css).filter((x: Violation) => x.check === 'no-raw-color').length).toBe(2)
      const v = checkContract(contract, css, { allowColors: ['#1DA1F2'] }) as Violation[]
      const w = v.filter((x) => x.check === 'no-raw-color')
      expect(w.length).toBe(1)
      expect(w[0]!.message).toContain('#ff0000')
    })

    it('exempts a line tagged uicockpit-allow-color', () => {
      const v = run([{ path: 'brand.css', content: `.x { color: #1da1f2; } /* uicockpit-allow-color */` }])
      expect(v.filter((x) => x.check === 'no-raw-color')).toEqual([])
    })
  })

  // Phase 3b — the `prefix` adoption field (class-collision namespacing).
  describe('prefix (brownfield class namespacing)', () => {
    it('still polices modifiers on a prefixed kit class', () => {
      const cfg = { prefix: 'uic-' }
      const bad = checkContract(contract, [{ path: 'a.tsx', content: `<a className="uic-btn--bogus" />` }], cfg) as Violation[]
      expect(bad.find((x) => x.check === 'known-modifiers')).toBeTruthy()
      const ok = checkContract(contract, [{ path: 'b.tsx', content: `<a className="uic-btn--primary" />` }], cfg) as Violation[]
      expect(ok.filter((x) => x.check === 'known-modifiers')).toEqual([])
    })
  })
})
