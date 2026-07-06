/**
 * MktDriftBench — the homepage evidence for the Verify claim (Golf 4 / LP2).
 * Point-in-time results from the repo's drift-bench (bench/): the same six build
 * tasks, each built by an AI agent WITH the kit and WITHOUT it, scored by the
 * real verifier (`uicockpit check --strict`). Numbers are a measured run, cited
 * as such — the harness + results.json live in the repo so it's reproducible.
 */
const ROWS = [
  { id: 'Settings form', withKit: 0, withoutKit: 30 },
  { id: 'Invoice table', withKit: 1, withoutKit: 21 },
  { id: 'Pricing cards', withKit: 2, withoutKit: 14 },
  { id: 'Stat header', withKit: 1, withoutKit: 25 },
  { id: 'Alert stack', withKit: 0, withoutKit: 12 },
  { id: 'Login card', withKit: 1, withoutKit: 25 },
]
const MAX = 30 // scale the bars to the worst single-task drift

const RULES = [
  { label: 'raw hex colours', n: 35 },
  { label: 'off-grid spacing', n: 45 },
  { label: 'off-scale type', n: 26 },
  { label: 'off-scale radii', n: 9 },
]

export function MktDriftBench() {
  return (
    <section className="mkt__section" id="proof">
      <div className="mkt__container">
        <div className="mkt__section-head">
          <div className="mkt__eyebrow">
            <span className="mkt__eyebrow-dot" />
            Measured, not claimed
          </div>
          <h2>Does the contract actually keep AI on-system?</h2>
          <p className="mkt__section-sub">
            We had an AI agent build six UIs twice — once handed the kit, once on its own — and let{' '}
            <code>uicockpit&nbsp;check&nbsp;--strict</code> score the drift. No human grading; the verifier counts it.
          </p>
        </div>

        <div className="mkt__bench">
          <div className="mkt__bench-totals">
            <div className="mkt__bench-total mkt__bench-total--good">
              <span className="mkt__bench-num">5</span>
              <span className="mkt__bench-lbl">drift issues<br />with the kit</span>
            </div>
            <div className="mkt__bench-vs">vs</div>
            <div className="mkt__bench-total mkt__bench-total--bad">
              <span className="mkt__bench-num">127</span>
              <span className="mkt__bench-lbl">without it</span>
            </div>
            <div className="mkt__bench-delta">25× less drift</div>
          </div>

          <div className="mkt__bench-rows">
            {ROWS.map((r) => (
              <div className="mkt__bench-row" key={r.id}>
                <span className="mkt__bench-name">{r.id}</span>
                <span className="mkt__bench-track">
                  <span className="mkt__bench-bar mkt__bench-bar--good" style={{ width: `${(r.withKit / MAX) * 100}%` }} />
                  <span className="mkt__bench-count mkt__bench-count--good">{r.withKit}</span>
                </span>
                <span className="mkt__bench-track">
                  <span className="mkt__bench-bar mkt__bench-bar--bad" style={{ width: `${(r.withoutKit / MAX) * 100}%` }} />
                  <span className="mkt__bench-count mkt__bench-count--bad">{r.withoutKit}</span>
                </span>
              </div>
            ))}
            <div className="mkt__bench-legend">
              <span><span className="mkt__bench-dot mkt__bench-dot--good" /> with kit</span>
              <span><span className="mkt__bench-dot mkt__bench-dot--bad" /> without kit</span>
            </div>
          </div>

          <p className="mkt__bench-foot">
            Without the kit the agent drifts where the eye can’t catch it —{' '}
            {RULES.map((r, i) => (
              <span key={r.label}>{i > 0 ? ' · ' : ''}<strong>{r.n}</strong> {r.label}</span>
            ))}.
            {' '}With the kit, the few slips are all invented token names — which <code>check</code> flags on the spot, a one-line fix.
          </p>
          <p className="mkt__bench-cite">
            6 tasks · 12 agent builds · the harness + results are in the repo (<code>bench/</code>) — reproducible.
          </p>
        </div>
      </div>
    </section>
  )
}
