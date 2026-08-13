import { useState } from 'react'
import { SPECIMENS, SHELL_SPECIMENS, NO_SPECIMEN } from '../../audit/specimens'
import type { AuditHandoff } from '../../audit/handoff'
import { driftStyle } from '../../audit/drift'

/**
 * The stage, pointed at the visitor's app instead of our catalogue.
 *
 * This is the second of the app's two modes, and the reason the audit and the
 * configurator are one product rather than two: same shell, same panel, same
 * export — only what is on the stage differs. Move any control and this
 * re-themes exactly as the catalogue does, because it is the same live preview.
 *
 * Deliberately NOT a split screen. The panel already owns the left third;
 * halving what remains leaves neither side big enough to judge. And before/after
 * is EVIDENCE, not a working surface — you need to see the mess once, and your
 * system continuously. So the wall of their own treatments stays one click away
 * in the report, not permanently alongside.
 */

interface AuditViewProps {
  audit: AuditHandoff
  onSeeEvidence?: () => void
}

/**
 * Their own values, dealt out one per cell.
 *
 * This is the honest form of "before". We measured what reconstructing any
 * SINGLE component of theirs costs — about half a codebase, with a guess on top
 * — and threw it away. But their values we know exactly, and drift is not a
 * property of one button: it is having nineteen radii with nothing deciding
 * between them. So each cell wears a different real value, and the claim is
 * about the spread, never about that particular element.
 *
 * Overriding the --k-* vars per cell also shadows the panel, which is exactly
 * right: "before" means the Foundation is not applied yet.
 */
export function AuditView({ audit, onSeeEvidence }: AuditViewProps) {
  /* Starts on BEFORE. The point of the switch is the moment it resolves, and
   * that moment only exists if they saw the mess first. */
  const [drift, setDrift] = useState(true)
  const entries = Object.entries(audit.kinds)
  const found = entries.filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
  // Kinds they build that we cannot draw yet, kept separate from kinds they
  // simply do not build — conflating the two would blame them for our gap.
  const undrawable = found.filter(([k]) => !SPECIMENS[k]).map(([k]) => k)
  const drawable = found.flatMap(([k, n]) => {
    const spec = SPECIMENS[k]
    return spec ? [{ kind: k, n, spec }] : []
  })
  const allAbsent = entries.flatMap(([k, n]) => {
    const spec = SPECIMENS[k]
    return n === 0 && spec ? [{ kind: k, spec }] : []
  })
  /* Absent kinds belong on the wall — a grid of only what we found reads as a
   * complete inventory. But past a handful they stop being a finding and start
   * being the whole picture: a small app then looks like a broken tool rather
   * than a small app. Show a few, count the rest in words. */
  const ABSENT_SHOWN = 5
  const absent = allAbsent.slice(0, ABSENT_SHOWN)
  const absentRest = allAbsent.slice(ABSENT_SHOWN).map((a) => a.spec.label)

  const nf = (n: number) => n.toLocaleString('en-US')

  /* The skeleton, first. You recognise your own app by its silhouette before
   * you read a word, so the shell earns the top of the page — cut into kit
   * pieces, which is the honest form: we know WHICH regions you hold to, and a
   * static read genuinely cannot recover how they are arranged. */
  const shell = Object.entries(audit.shell || {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .flatMap(([k, n]) => {
      const spec = SHELL_SPECIMENS[k]
      return spec ? [{ kind: k, n, spec }] : []
    })
  /* Did the scan actually find a brand? When it did not, everything below is
   * wearing OUR colour, and the lede's "the kit your code implies" quietly
   * becomes false. cal.com is the real case: a black product that declares no
   * brand token and has no dominant literal — painting it cobalt and saying
   * nothing would be us putting words in their app's mouth. */
  const brandKnown = audit.provenance?.Brand?.confidence != null

  return (
    <div className="audv">
      <div className="audv__strip">
        <div className="audv__lead">
          <span className="audv__tag">Audited</span>
          <strong>{audit.rootName}</strong>
          <span className="audv__meta">
            {nf(audit.filesRead)} files · {Math.round(audit.parsed * 100)}% read · {found.length} of{' '}
            {entries.length} component kinds
          </span>
        </div>
        <div className="audv__facts">
          {audit.score !== null && (
            <><span><b>{audit.score}</b>/100 consistency</span><span className="audv__dot" /></>
          )}
          <span><b>{nf(audit.singletons)}</b> of {nf(audit.treatments)} treatments used once</span>
          {onSeeEvidence && (
            <>
              <span className="audv__dot" />
              <button type="button" className="audv__link" onClick={onSeeEvidence}>See the evidence →</button>
            </>
          )}
        </div>
      </div>

      <div className="audv__toggle">
        {/* The app's own segmented idiom, not the hero's. Reusing .mkt__switch
            here put a sliding knob with hard-coded 5px insets — calibrated for
            a 26px-padded marketing button — into a stage that sizes nothing the
            same, and its --mkt-* colours are not even defined in this chrome.
            The result was a dark blob beside the label. This toggle and the
            mode switch above it are siblings and should look like it. */}
        <div className="modesw" role="radiogroup" aria-label="Your values, or your kit">
          <button type="button" role="radio" aria-checked={drift}
            className="modesw__btn" onClick={() => setDrift(true)}>
            Your code today
          </button>
          <button type="button" role="radio" aria-checked={!drift}
            className="modesw__btn" onClick={() => setDrift(false)}>
            On your kit
          </button>
        </div>
        <p className="audv__tally">
          {drift ? (
            <>
              <b>{audit.distinct.color}</b> colours <i>·</i> <b>{audit.distinct.radius}</b> radii{' '}
              <i>·</i> <b>{audit.distinct.shadow}</b> shadows <i>·</i> <b>{audit.distinct.spacing}</b> spacings
            </>
          ) : (
            <>One accent <i>·</i> one scale <i>·</i> one shadow <i>·</i> one rhythm</>
          )}
        </p>
      </div>

      <p className="audv__lede">
        {drift ? (
          <>Every value below is one your own code uses — dealt out one per component, which is what
          having <b>{audit.distinct.radius} radii</b> looks like when nothing decides between them.
          The Foundation on the left is not applied yet.</>
        ) : brandKnown ? (
          <>These are the components your codebase actually builds, on the kit your code implies. Change
          anything on the left and this updates — it is the same live preview, pointed at your app.</>
        ) : (
          <>These are the components your codebase actually builds. The <b>colour is ours, not yours</b> —
          nothing in your code declared a brand and no single colour dominated enough to infer one. Set
          Brand on the left and this becomes your app rather than our guess.</>
        )}
      </p>

      {shell.length > 0 && (
        <>
          <h3 className="audv__h">Your app shell</h3>
          <p className="audv__sub">
            The regions your codebase holds to, as kit pieces. <b>Which</b> regions is measured;
            how you arrange them is not — a shell is assembled across nested layouts, so we show
            the parts rather than guess the floor plan.
          </p>
          <div className="audv__grid audv__grid--shell">
            {shell.map(({ kind, n, spec }, i) => (
              <figure key={kind} className={`audv__spec${spec.wide ? ' audv__spec--wide' : ''}`}>
                <figcaption>
                  <span>{spec.label}</span>
                  <span className="audv__n">in {nf(n)} file{n === 1 ? '' : 's'}</span>
                </figcaption>
                <div className="audv__stage" style={drift ? driftStyle(audit, i) : undefined}>
                  {spec.render()}
                </div>
              </figure>
            ))}
          </div>
          <h3 className="audv__h">The parts you build with</h3>
        </>
      )}

      <div className="audv__grid">
        {drawable.map(({ kind, n, spec }, i) => {
          return (
            <figure key={kind} className={`audv__spec${spec.wide ? ' audv__spec--wide' : ''}`}>
              <figcaption>
                <span>{spec.label}</span>
                <span className="audv__n">in {nf(n)} file{n === 1 ? '' : 's'}</span>
              </figcaption>
              <div className="audv__stage" style={drift ? driftStyle(audit, i + 3) : undefined}>
                {spec.render()}
              </div>
            </figure>
          )
        })}

        {absent.map(({ kind, spec }) => (
          <figure key={kind} className="audv__spec audv__spec--absent">
            <figcaption>
              <span>{spec.label}</span>
              <span className="audv__n">not found</span>
            </figcaption>
            <div className="audv__stage">
              <span className="audv__none">your codebase doesn&rsquo;t build this</span>
            </div>
          </figure>
        ))}
      </div>

      {(undrawable.length > 0 || absentRest.length > 0 || NO_SPECIMEN.length > 0) && (
        <p className="audv__foot">
          {absentRest.length > 0 && (
            <>Also not found in your code: <b>{absentRest.join(', ')}</b>. </>
          )}
          {undrawable.length > 0 && (
            <>Your code also builds <b>{undrawable.join(', ')}</b> — the kit ships those, this view
            cannot draw them yet. </>
          )}
          Everything above is our component, in your colour. We did not copy your CSS; we detected
          what you build and rendered it on one system.
        </p>
      )}
    </div>
  )
}
