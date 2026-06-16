import { describe, it, expect } from 'vitest'
import { extractFoundation, parseColor } from '../extractFoundation'

/* Sandbox · Slice 0 dogfood harness.
 *
 *  1. SYNTHETIC fixtures with KNOWN answers — guard the extractor's logic across
 *     the three real input shapes (shadcn :root HSL triplets · Tailwind v4 @theme ·
 *     plain CSS). These are the regression net.
 *  2. A REAL-APP reporter — drop any `*.css` into `src/sandbox/fixtures/` and run
 *     `npx vitest run extractFoundation` to see the extracted config + confidence
 *     + the decision trace for YOUR own apps. (No assertions; prints only.) */

describe('parseColor', () => {
  it('reads hex / rgb / hsl into HSL', () => {
    expect(parseColor('#0A84FF')!.h).toBeGreaterThan(190)
    expect(parseColor('rgb(20, 184, 166)')!.s).toBeGreaterThan(50) // teal
    expect(parseColor('hsl(221 83% 53%)')).toEqual({ h: 221, s: 83, l: 53 })
  })
})

describe('extractFoundation — shadcn :root (HSL triplets, no hsl())', () => {
  const css = `
    :root {
      --background: 0 0% 100%;
      --foreground: 222 47% 11%;
      --primary: 221.2 83.2% 53.3%;
      --muted: 210 40% 96%;
      --radius: 0.5rem;
    }
    body { font-family: "Inter", sans-serif; font-size: 14px; }
  `
  const { config, confidence, notes } = extractFoundation(css)
  it('reads the semantic --primary with high confidence', () => {
    expect(confidence.brand).toBe('high')
    expect(config.color).toBe('tone')
    expect(config.colorTheme).toBe('cobalt') // hue 221 snaps to cobalt (211) over indigo (239)
  })
  it('buckets --radius 0.5rem → soft', () => {
    expect(config.radius).toBe('soft')
    expect(confidence.radius).toBe('high')
  })
  it('reads font + base size', () => {
    expect(config.fontDisplay).toBe('Inter')
    expect(config.typeScale).toBe('md')
    expect(notes.length).toBeGreaterThan(0)
  })
})

describe('extractFoundation — Tailwind v4 @theme', () => {
  const css = `
    @theme {
      --color-primary: #14B8A6;
      --color-bg: #f8fafc;
      --radius-md: 12px;
      --font-sans: "Lexend", ui-sans-serif, sans-serif;
    }
  `
  const { config, confidence } = extractFoundation(css)
  it('snaps the teal brand', () => {
    expect(confidence.brand).toBe('high')
    expect(config.colorTheme).toBe('teal')
  })
  it('radius 12px → soft, font Lexend', () => {
    expect(config.radius).toBe('soft')
    expect(config.fontDisplay).toBe('Lexend')
  })
})

describe('extractFoundation — plain CSS (frequency fallback)', () => {
  const css = `
    .btn { background: #6366F1; color: #fff; border-radius: 16px; height: 44px; }
    .btn:hover { background: #4f46e5; }
    .input { height: 40px; border: 1px solid #e5e7eb; border-radius: 16px; }
    .card { border: 1px solid #e5e7eb; box-shadow: 0 4px 16px rgba(0,0,0,.08); border-radius: 16px; }
    body { font-family: Figtree, sans-serif; font-size: 15px; color: #374151; }
  `
  const { config, confidence } = extractFoundation(css)
  it('picks indigo by frequency (low confidence)', () => {
    expect(confidence.brand).toBe('low')
    expect(config.colorTheme).toBe('indigo')
  })
  it('radius 16px → round, font Figtree, size md', () => {
    expect(config.radius).toBe('round')
    expect(config.fontDisplay).toBe('Figtree')
    expect(config.typeScale).toBe('md')
  })
  it('best-effort density + elevation are flagged low', () => {
    expect(config.scale).toBeDefined()
    expect(['soft', 'deep']).toContain(config.surfaceDepth)
    expect(confidence.density).toBe('low')
    expect(confidence.elevation).toBe('low')
  })
  it('reads blur past a unitless 0 offset → deep (0 4px 16px)', () => {
    // offsetX is unitless `0`; blur (16px, 3rd length) must still win → deep.
    expect(config.surfaceDepth).toBe('deep')
  })
})

describe('extractFoundation — elevation buckets', () => {
  it('a tiny shadow → soft, no shadow → flat', () => {
    expect(extractFoundation('.c{box-shadow:0 1px 2px rgba(0,0,0,.05)}').config.surfaceDepth).toBe('soft')
    expect(extractFoundation('.c{box-shadow:none}').config.surfaceDepth).toBe('flat')
  })
})

describe('extractFoundation — real-world traps (from the dogfood run)', () => {
  it('rejects a near-white token named --primary (Stripe #f5f5ff trap)', () => {
    // The light tint must NOT become the brand; the real indigo wins via frequency.
    const { config } = extractFoundation(':root{--primary:#f5f5ff}.btn{background:#635bff}.a{color:#635bff}.b{border-color:#635bff}')
    expect(config.colorTheme).not.toBe('mono')
    expect(['indigo', 'violet', 'cobalt']).toContain(config.colorTheme)
    expect(config.cPrimary && parseColor(config.cPrimary)!.l).toBeLessThan(80) // not near-white
  })
  it('picks the most-frequent font, not a stray code-block mono (Vercel trap)', () => {
    const css = `.code{font-family:"Roboto Mono",monospace} body{font-family:"Geist",sans-serif} h1{font-family:"Geist",sans-serif} p{font-family:"Geist",sans-serif}`
    expect(extractFoundation(css).config.fontDisplay).toBe('Geist')
  })
  it('ignores a <value> placeholder font (Tailwind trap)', () => {
    const { config } = extractFoundation('body{font-family:<value>} h1{font-family:"Sohne",sans-serif} p{font-family:"Sohne"}')
    expect(config.fontDisplay).toBe('Sohne')
  })
})

describe('extractFoundation — greyscale app → mono', () => {
  const { config } = extractFoundation('.a{color:#111}.b{background:#f5f5f5}.c{border-color:#999}')
  it('falls back to mono when no chromatic colour', () => {
    expect(config.colorTheme).toBe('mono')
    expect(config.color).toBe('mono')
  })
})

/* ── REAL-APP reporter — drop your own *.css into src/sandbox/fixtures/ and run
 *  `npx vitest run extractFoundation` to see what the extractor reads from YOUR
 *  apps. Uses Vite's import.meta.glob (?raw) so no node deps — fixtures stay local
 *  (gitignored). Prints config + confidence + decision trace; no assertions. */
const FIXTURES = import.meta.glob('../fixtures/*.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
describe('extractFoundation — real-app report', () => {
  const entries = Object.entries(FIXTURES)
  it(entries.length ? `reports on ${entries.length} fixture(s)` : 'no fixtures — drop *.css into src/sandbox/fixtures/', () => {
    for (const [path, css] of entries) {
      const { config, confidence, notes } = extractFoundation(css)
      // eslint-disable-next-line no-console
      console.log(`\n=== ${path} ===\nconfig: ${JSON.stringify(config)}\nconfidence: ${JSON.stringify(confidence)}\n${notes.join('\n')}`)
    }
    expect(true).toBe(true)
  })
})
