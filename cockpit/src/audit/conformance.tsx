import { useEffect, useState } from 'react'
import { SPECIMENS, SHELL_SPECIMENS } from './specimens'
import type { AuditHandoff } from './handoff'
import { driftStyle } from './drift'
import { configFromAudit } from './handoff'
import { buildTokens } from '../tokens/buildTokens'

/**
 * Render-conformance harness — DEV ONLY, never routed in a build.
 *
 * Seven rendering defects turned up in one afternoon of looking at real repos:
 * a pill radius that blew a button to 12,000px, centred overflow that made a
 * table's first column unreachable, a tooltip at opacity 0, a class the kit
 * does not ship, white text on a white page. None of them came from the 310
 * unit tests, because none of them are visible without layout.
 *
 * Finding those by studying screenshots does not scale and is not how anything
 * reaches 99%. This mounts every specimen under every fixture's REAL measured
 * spread and checks the things a human eye was catching one at a time:
 *
 *   invisible    zero-size or transparent — it rendered nothing
 *   unreachable  content clipped with no way to scroll to it
 *   absurd       a dimension no interface has (the 12,000px button)
 *   unreadable   text under 4.5:1 against what is actually behind it
 *   foreign      a class the exported kit does not ship
 *
 * It reports rather than asserts. A violation is a question — some are real
 * bugs, some are a fixture with genuinely wild values — and turning them into
 * failures before we know which is which would just teach us to silence it.
 *
 * ⚠️ STATE, honestly: four of the five checks are calibrated and currently
 * report ZERO across 5 fixtures × 2 modes × 22 specimens — invisible, absurd,
 * unreachable and foreign. The CONTRAST check is not yet trustworthy: it still
 * reports 1.0:1 on elements that are plainly legible, and a checker that cries
 * wolf is worse than none, because the first thing anyone does with it is stop
 * reading it. Do not gate anything on `unreadable` until it earns it.
 *
 * Calibrating it has already cost four passes, and each pass was a bug in the
 * HARNESS rather than the product: measuring mid-animation (90 phantom
 * "invisible"), measuring an unstyled page with no --k-* applied (370 phantom
 * contrast failures against a kit that passes its own WCAG audit), reading a
 * translucent selected-row as opaque, and compositing from the parent so a
 * button's own fill was skipped. That ratio is the lesson: a measuring
 * instrument needs its own calibration before its numbers mean anything, and
 * publishing them earlier would have sent us chasing ghosts in the product.
 */

export interface Violation {
  fixture: string
  mode: 'before' | 'after'
  specimen: string
  kind: 'invisible' | 'unreachable' | 'absurd' | 'unreadable' | 'foreign'
  detail: string
}

/** Every class the kit ships, so a specimen cannot invent one. */
let KIT_CLASSES: Set<string> | null = null
async function kitClasses(): Promise<Set<string>> {
  if (KIT_CLASSES) return KIT_CLASSES
  const found = new Set<string>()
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try { rules = sheet.cssRules } catch { continue }
    for (const rule of Array.from(rules)) {
      const sel = (rule as CSSStyleRule).selectorText
      if (!sel) continue
      for (const m of sel.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) found.add(m[1]!)
    }
  }
  KIT_CLASSES = found
  return found
}

const rgba = (v: string): [number, number, number, number] | null => {
  const m = v.match(/[\d.]+/g)
  if (!m || m.length < 3) return null
  return [Number(m[0]), Number(m[1]), Number(m[2]), m[3] === undefined ? 1 : Number(m[3])]
}

const relLum = ([r, g, b]: [number, number, number]) => {
  const f = (c: number) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/**
 * What is actually painted behind an element.
 *
 * COMPOSITES alpha rather than reading the top layer as opaque. A selected row
 * is `accent / 13%` over a surface; measuring that colour as if it were solid
 * reported a 1.0:1 contrast on text that is perfectly readable — the harness
 * inventing 181 failures on its first run, which is precisely how a checker
 * teaches people to ignore it.
 */
function behind(el: Element): [number, number, number] | null {
  const stack: [number, number, number, number][] = []
  /* Start at the element ITSELF. A button carries its own fill and its own
   * label, so beginning at the parent measured white-on-white and reported
   * 1.0:1 on a perfectly legible primary button. */
  let node: Element | null = el
  while (node) {
    const c = rgba(getComputedStyle(node).backgroundColor)
    if (c && c[3] > 0) {
      stack.push(c)
      if (c[3] >= 0.999) break
    }
    node = node.parentElement
  }
  if (!stack.length) return [255, 255, 255]
  // Paint from the bottom of the stack upward.
  let base: [number, number, number] = stack[stack.length - 1]!.slice(0, 3) as [number, number, number]
  for (let i = stack.length - 2; i >= 0; i--) {
    const [r, g, b, a] = stack[i]!
    base = [r * a + base[0] * (1 - a), g * a + base[1] * (1 - a), b * a + base[2] * (1 - a)]
  }
  return base
}

export async function inspect(root: HTMLElement, fixture: string, mode: 'before' | 'after'): Promise<Violation[]> {
  const out: Violation[] = []
  const kit = await kitClasses()

  for (const cell of Array.from(root.querySelectorAll<HTMLElement>('[data-specimen]'))) {
    const specimen = cell.dataset.specimen!
    const add = (kind: Violation['kind'], detail: string) => out.push({ fixture, mode, specimen, kind, detail })
    const stage = cell.querySelector<HTMLElement>('[data-stage]')
    if (!stage) continue

    const first = stage.firstElementChild as HTMLElement | null
    if (!first) { add('invisible', 'nothing rendered'); continue }

    for (const el of [first, ...Array.from(first.querySelectorAll<HTMLElement>('*'))]) {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)

      if (r.width > 4000 || r.height > 4000) {
        add('absurd', `${el.className || el.tagName} is ${Math.round(r.width)}×${Math.round(r.height)}`)
        break
      }
      if (el === first && (r.width < 4 || r.height < 4)) {
        add('invisible', `root is ${Math.round(r.width)}×${Math.round(r.height)}`)
      }
      if (cs.opacity === '0' && el.textContent?.trim()) {
        add('invisible', `${el.className || el.tagName} is fully transparent`)
      }
      for (const c of String(el.className).split(/\s+/).filter(Boolean)) {
        if (!kit.has(c) && !/^(audv|audz|modesw)/.test(c)) add('foreign', `.${c} is not in the kit`)
      }
      const text = el.textContent?.trim()
      if (text && el.children.length === 0) {
        const fgc = rgba(getComputedStyle(el).color)
        const bgc = behind(el)
        if (fgc && bgc && fgc[3] > 0.5) {
          const l1 = relLum([fgc[0], fgc[1], fgc[2]])
          const l2 = relLum(bgc)
          const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
          // 3:1, not 4.5 — a specimen is a swatch, and much of its text is
          // deliberately secondary. Below 3 nothing is readable at any size.
          if (ratio < 3) add('unreadable', `"${text.slice(0, 18)}" at ${ratio.toFixed(1)}:1`)
        }
      }
    }

    // Clipped with no way to reach it — the centred-overflow trap.
    const sr = stage.getBoundingClientRect()
    const fr = first.getBoundingClientRect()
    if (sr.left - fr.left > 4) add('unreachable', `${Math.round(sr.left - fr.left)}px clipped off the left`)
  }
  return out
}

/** The page itself: mount every specimen for one fixture, in one mode. */
export function ConformanceSheet({ audit, mode, style }: { audit: AuditHandoff; mode: 'before' | 'after'; style?: React.CSSProperties }) {
  const all = { ...SHELL_SPECIMENS, ...SPECIMENS }
  /* The REAL derived kit. Without this the sheet carried no --k-* at all, so
   * every colour fell back to unset and the harness reported 370 contrast
   * failures against our own kit — which passes its own WCAG audit. A checker
   * measuring an unstyled page is worse than no checker: it produces a number
   * that looks like work and points at nothing. */
  const tokens = buildTokens(configFromAudit({ values: audit.derived as Record<string, unknown> })).vars as React.CSSProperties
  return (
    <div data-sheet={`${audit.rootName}:${mode}`} style={{ ...tokens, ...style }}>
      {Object.entries(all).map(([key, spec], i) => (
        <figure key={key} data-specimen={key} style={{ margin: 0, width: 260 }}>
          {/* The SHIPPING style function, not a copy — see drift.ts. */}
          <div
            data-stage
            style={{
              ...(mode === 'before' ? driftStyle(audit, i) : {}),
              padding: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'safe center', minHeight: 88,
              background: 'var(--k-bg)', overflow: 'auto',
            }}
          >
            {spec.render()}
          </div>
        </figure>
      ))}
    </div>
  )
}

/**
 * The harness page. Loads every fixture handoff, mounts both modes, inspects,
 * and hands the result to window so a driver can read it.
 *
 * Fixtures are fetched rather than bundled: they are produced by the CLI from
 * real repos, and one of them is deliberately a repo we have never looked at.
 * Testing only against the corpus you tuned on is how a harness reports 100%
 * while the product is broken — n8n was held out and its very first radius was
 * `50%`, a value none of the familiar four contained.
 */
export function ConformancePage() {
  const [fixtures, setFixtures] = useState<AuditHandoff[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    void (async () => {
      const list: AuditHandoff[] = []
      const res = await fetch('/fixtures/index.json')
      for (const name of (await res.json()) as string[]) {
        list.push((await (await fetch(`/fixtures/${name}.json`)).json()) as AuditHandoff)
      }
      setFixtures(list)
    })()
  }, [])

  useEffect(() => {
    if (!fixtures.length || done) return
    const t = window.setTimeout(async () => {
      const all: Violation[] = []
      for (const f of fixtures) {
        for (const mode of ['before', 'after'] as const) {
          const root = document.querySelector<HTMLElement>(`[data-sheet="${f.rootName}:${mode}"]`)
          if (root) all.push(...(await inspect(root, f.rootName, mode)))
        }
      }
      ;(window as unknown as { __conformance: Violation[] }).__conformance = all
      setDone(true)
    }, 900)
    return () => window.clearTimeout(t)
  }, [fixtures, done])

  return (
    <div className="cockpit-preview" style={{ padding: 20 }}>
      {/* Measurement must be deterministic. Several recipes animate in with
          `both` fill and a stagger, so a specimen sampled mid-entrance reads as
          a 2px-tall transparent box — the harness reporting 90 "invisible"
          components that are perfectly fine a heartbeat later. Freezing motion
          is what every visual-test runner does, and for the same reason. */}
      <style>{`[data-sheet] *, [data-sheet] *::before, [data-sheet] *::after {
        animation: none !important; transition: none !important;
      }`}</style>
      <h1 style={{ font: '600 15px system-ui' }}>
        Render conformance — {fixtures.length} fixtures {done ? '· done' : '· measuring…'}
      </h1>
      {fixtures.map((f) => (
        <div key={f.rootName}>
          {(['before', 'after'] as const).map((mode) => (
            <div key={mode} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <ConformanceSheet audit={f} mode={mode} style={{ display: 'contents' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
