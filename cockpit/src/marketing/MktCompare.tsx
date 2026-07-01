import { ShieldCheck, Palette } from 'lucide-react'

/**
 * "Two ways to use it" — the two comparison tables, which ARE the two
 * positionings:
 *   1. Make your own UI kit for your app        → vs the stack (Table B)
 *   2. Keep your AI's design from drifting       → AI alone vs AI + UIcockpit (Table A)
 *
 * Table A is grounded in a real experiment (fresh-context models building the
 * same screen with and without the kit); the numbers in it are what that drift
 * actually looked like. Table B is a capability matrix — marks are deliberately
 * conservative so the differentiators stand on their own.
 */

/* ── Table A — the drift test (AI alone vs AI + UIcockpit) ──────────────────── */
const DRIFT_ROWS: { axis: string; alone: string; withKit: string }[] = [
  {
    axis: 'Brand colour',
    alone: 'The model’s median indigo — not yours',
    withKit: 'Your exact brand, every screen',
  },
  {
    axis: 'A second screen, same session',
    alone: 'Quietly drifts — h1 at 26px here, 30px there; padding 32 vs 40',
    withKit: 'Pixel-identical — zero raw values',
  },
  {
    axis: 'A fresh chat next week',
    alone: 'Starts over, re-guesses, drifts again',
    withKit: 'Reads the same contract, lands the same',
  },
  {
    axis: 'Catches drift before you ship',
    alone: 'Nothing does',
    withKit: '`check` fails the build',
  },
  {
    axis: 'After twenty screens',
    alone: 'Recognisably similar, subtly inconsistent',
    withKit: 'Still one product',
  },
]

/* ── Table B — the capability matrix (vs the stack) ─────────────────────────── */
type Mark = 'full' | 'part' | 'none'
const TOOLS = ['UIcockpit', 'Tailwind', 'shadcn / Radix', 'MUI', 'Figma tokens'] as const
const CAP_ROWS: { cap: string; marks: Mark[] }[] = [
  { cap: 'Opinionated look out of the box', marks: ['full', 'none', 'part', 'full', 'none'] },
  { cap: 'One brand → a whole system, auto-derived', marks: ['full', 'none', 'none', 'part', 'none'] },
  { cap: 'Framework-neutral (React, Vue, Svelte, HTML)', marks: ['full', 'full', 'none', 'none', 'full'] },
  { cap: 'Component recipes with state + a11y contracts', marks: ['full', 'none', 'full', 'full', 'none'] },
  { cap: 'Machine-readable conformance contract', marks: ['full', 'none', 'none', 'none', 'part'] },
  { cap: 'A checker that fails the build on drift', marks: ['full', 'none', 'none', 'none', 'none'] },
  { cap: 'Agent-native (MCP + rules file)', marks: ['full', 'none', 'none', 'none', 'none'] },
  { cap: 'Re-theme everything from one config', marks: ['full', 'part', 'part', 'part', 'full'] },
]

/** A cell string may contain one `code`-fenced span (backtick pair). */
function withCode(s: string) {
  const parts = s.split('`')
  return parts.map((p, i) => (i % 2 ? <code key={i}>{p}</code> : p))
}

function Dot({ mark }: { mark: Mark }) {
  const label = mark === 'full' ? 'Yes' : mark === 'part' ? 'Partial' : 'No'
  return <span className={`mkt__cmp-dot mkt__cmp-dot--${mark}`} role="img" aria-label={label} />
}

export function MktCompare() {
  return (
    <section className="mkt__section mkt__section--alt" id="compare">
      <div className="mkt__container">
        <div className="mkt__section-head">
          <div className="mkt__eyebrow">
            <span className="mkt__eyebrow-dot" />
            Two ways to use it
          </div>
          <h2>Two doors. One loop.</h2>
          <p className="mkt__section-sub">
            Use it to make your own kit for your app — or to keep what your AI builds
            from drifting back to generic. Same design language, two jobs.
          </p>
        </div>

        {/* Use case 1 — make your own UI kit */}
        <div className="mkt__cmp-block">
          <div className="mkt__cmp-lead">
            <span className="mkt__cmp-num"><Palette size={16} strokeWidth={2} /></span>
            <div>
              <h3>Make your own UI kit</h3>
              <p>Where UIcockpit sits next to the tools you already reach for.</p>
            </div>
          </div>
          <div className="mkt__cmp-scroll">
            <table className="mkt__cmp mkt__cmp--matrix">
              <thead>
                <tr>
                  <th scope="col" className="mkt__cmp-rowhead" />
                  {TOOLS.map((t, i) => (
                    <th scope="col" key={t} className={i === 0 ? 'mkt__cmp-col--us' : undefined}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAP_ROWS.map((r) => (
                  <tr key={r.cap}>
                    <th scope="row" className="mkt__cmp-rowhead">{r.cap}</th>
                    {r.marks.map((m, i) => (
                      <td key={i} className={i === 0 ? 'mkt__cmp-col--us' : undefined}>
                        <Dot mark={m} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mkt__cmp-legend">
            <span><span className="mkt__cmp-dot mkt__cmp-dot--full" /> Yes</span>
            <span><span className="mkt__cmp-dot mkt__cmp-dot--part" /> Partial</span>
            <span><span className="mkt__cmp-dot mkt__cmp-dot--none" /> No</span>
          </p>
        </div>

        {/* Use case 2 — keep the AI's design from drifting */}
        <div className="mkt__cmp-block">
          <div className="mkt__cmp-lead">
            <span className="mkt__cmp-num"><ShieldCheck size={16} strokeWidth={2} /></span>
            <div>
              <h3>Keep your AI on-brand</h3>
              <p>The same screen, built by a fresh-context model — with the kit, and without it.</p>
            </div>
          </div>
          <div className="mkt__cmp-scroll">
            <table className="mkt__cmp mkt__cmp--drift">
              <thead>
                <tr>
                  <th scope="col" className="mkt__cmp-rowhead" />
                  <th scope="col">AI, on its own</th>
                  <th scope="col" className="mkt__cmp-col--us">AI + UIcockpit</th>
                </tr>
              </thead>
              <tbody>
                {DRIFT_ROWS.map((r) => (
                  <tr key={r.axis}>
                    <th scope="row" className="mkt__cmp-rowhead">{r.axis}</th>
                    <td className="mkt__cmp-alone">{withCode(r.alone)}</td>
                    <td className="mkt__cmp-col--us mkt__cmp-with">{withCode(r.withKit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mkt__cmp-foot">
            Models have taste — what they don’t keep is <em>your</em> taste, across screens
            and sessions. That’s the part a contract and a checker hold.
          </p>
        </div>
      </div>
    </section>
  )
}
