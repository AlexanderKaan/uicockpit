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
})
