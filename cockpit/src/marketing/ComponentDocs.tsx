import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'
import { IconProvider } from '../icons/Icon'
import { buildTokens } from '../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import { COMPONENT_PAGES, componentPageBySlug, type ComponentPage } from '../stage/views/ComponentGallery'
import { RECIPES } from '../kit'
import { explainerFor } from '../kit/explainer'
import { tierOf, usesOf } from '../kit/segments'
import EVIDENCE from '../kit/evidence.json'

/** One component's measured evidence, as gen-evidence.mjs writes it. */
type EvidenceEntry = {
  measured: boolean
  reason?: 'measured-as' | 'not-rendered'
  under?: string
  instances?: number
  axeFindings?: number
  contrast?: { min: number; nodes: number } | null
  // `smallest` is null when axe evaluated the target but reported no size for it.
  target?: { smallest: number | null; pass: number; fail: number } | null
}

/** The component reference always shows the DEFAULT kit — one canonical look for
 *  the docs, no per-visitor toggle (the /app configurator is where you re-theme). */
function useDefaultKit() {
  const tokens = useMemo(() => buildTokens(DEFAULT_CONFIG).vars as CSSProperties, [])
  return { tokens, iconSet: DEFAULT_CONFIG.iconSet }
}

/* IA-2b — the public component reference: a persistent sidebar index + per-slug
 * detail pages, the "normal" components docs shadcn/Astryx have. Everything is
 * derived from COMPONENT_PAGES (the slug→recipe→preview registry) + the recipe
 * and segment sources, so it can't drift from the kit. */

/** Groups in first-seen order — the sidebar + index section order. */
const GROUPS = COMPONENT_PAGES.reduce<string[]>((acc, c) => (acc.includes(c.group) ? acc : [...acc, c.group]), [])
const byGroup = (g: string) => COMPONENT_PAGES.filter((c) => c.group === g)
const recipeOf = (id: string) => RECIPES.find((r) => r.id === id)
const label = (id: string) => COMPONENT_PAGES.find((c) => c.recipeId === id)?.name ?? recipeOf(id)?.section ?? id

/** Left index rail, shared by the index + every detail page. */
function Sidebar({ current, navigate }: { current?: string; navigate: (to: string) => void }) {
  const go = (e: React.MouseEvent, to: string) => { e.preventDefault(); navigate(to) }
  return (
    <nav className="cmpdoc__side" aria-label="Components">
      <a href="/components" className={`cmpdoc__side-link cmpdoc__side-over ${!current ? 'cmpdoc__side-link--on' : ''}`} onClick={(e) => go(e, '/components')}>Overview</a>
      {GROUPS.map((g) => (
        <div className="cmpdoc__side-group" key={g}>
          <div className="cmpdoc__side-head">{g}</div>
          {byGroup(g).map((c) => (
            <a
              key={c.slug}
              href={`/components/${c.slug}`}
              className={`cmpdoc__side-link ${current === c.slug ? 'cmpdoc__side-link--on' : ''}`}
              aria-current={current === c.slug ? 'page' : undefined}
              onClick={(e) => go(e, `/components/${c.slug}`)}
            >{c.name}</a>
          ))}
        </div>
      ))}
    </nav>
  )
}

/** Shell = site nav + the two-column [sidebar · content] docs body + footer. */
function DocsShell({ current, navigate, children }: { current?: string; navigate: (to: string) => void; children: ReactNode }) {
  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="components" />
      <div className="mkt__container cmpdoc">
        <Sidebar current={current} navigate={navigate} />
        <main className="cmpdoc__main">{children}</main>
      </div>
      <MktFooter navigate={navigate} />
    </div>
  )
}

/* ── The index — a clean, grouped text list of the components (shadcn-style).
 *    The live preview lives on each detail page, not here (a reference index,
 *    not a showcase). ──────────────────────────────────────────────────────── */
export function ComponentsIndexPage({ navigate }: { navigate: (to: string) => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = 'Components — 60+ accessible, framework-neutral components — UIcockpit'
    return () => { document.title = prev }
  }, [])
  return (
    <DocsShell navigate={navigate}>
      <div className="cmpdoc__head">
        <h1>Components</h1>
        <p className="cmpdoc__lead">
          Every component in the kit — accessible, framework-neutral, and endlessly themeable.
          Pick one for its live example, recipe CSS and best-practice rules.
        </p>
      </div>
      {GROUPS.map((g) => (
        <section className="cmpdoc__idx-section" key={g}>
          <h2 className="cmpdoc__idx-head">{g}</h2>
          <div className="cmpdoc__idx-grid">
            {byGroup(g).map((c) => (
              <a
                key={c.slug}
                className="cmpdoc__idx-link"
                href={`/components/${c.slug}`}
                onClick={(e) => { e.preventDefault(); navigate(`/components/${c.slug}`) }}
              >{c.name}</a>
            ))}
          </div>
        </section>
      ))}
    </DocsShell>
  )
}

/**
 * ── Evidence — what THIS component measured ───────────────────────────────────
 *
 * The section that used to be called "Tests", and the change is the whole point
 * of the page. "Tests" listed the gates that would touch a component like this
 * one — "audit:tokens: no raw values", "a11y:matrix: axe over 3 densities × 2
 * modes". Naming your instruments is what every design system does. An
 * accessibility officer does not need to know we own a contrast gate; they need
 * the number it produced for the component in front of them.
 *
 * ⚠️ EVERY NUMBER BELOW COMES FROM A RUN, via src/kit/evidence.json, which is
 * generated by scripts/gen-evidence.mjs and regenerated by hand. Nothing here is
 * typed, computed in this file, or rounded up. If the data has no number for a
 * component, this renders the absence — never a zero.
 *
 * The gate list is KEPT, demoted to a footnote: how it was measured is still
 * worth stating, it is just not the headline. The headline is what it measured.
 */
function Evidence({ recipeId, tests }: { recipeId: string; tests: string[] }) {
  const ev = (EVIDENCE.components as Record<string, EvidenceEntry>)[recipeId]
  const met = EVIDENCE

  return (
    <div className="cmpdoc__spec-group">
      <h3>Evidence</h3>

      {!ev || !ev.measured ? (
        /* ⚠️ UNVERIFIED IS NOT VERIFIED-CLEAN. A page that prints "0 findings"
         * over a component nobody looked at is worse than one that says nothing,
         * because the reader cannot tell the two apart. So the absence is stated,
         * with the reason, and no number is shown at all. */
        <p className="cmpdoc__spec-note cmpdoc__ev-none">
          <strong>Not measured.</strong>{' '}
          {ev?.reason === 'measured-as' ? (
            <>Its CSS is part of the <code>{ev.under}</code> block, so every element it
            styles was measured and reported under that component rather than this one.</>
          ) : (
            <>Nothing on the component wall renders this recipe&rsquo;s classes, so the
            instruments have never had an instance of it to look at. That is a gap in our
            coverage, not a claim about the component &mdash; and it is stated here rather
            than left to look like a pass.</>
          )}
        </p>
      ) : (
        <>
          <p className="cmpdoc__spec-note">
            Measured on <strong>{met.measuredOn}</strong> at commit <code>{met.commit}</code>,
            over <strong>{ev.instances}</strong> rendered element{ev.instances === 1 ? '' : 's'} of
            this component, in {met.configurations.length} configurations
            ({met.configurations.join(', ')}) and at {met.widths.join(', ')}px.
          </p>
          <dl className="cmpdoc__ev">
            <div>
              <dt>WCAG 2.2 AA, automated</dt>
              <dd>
                <strong>{ev.axeFindings}</strong> finding{ev.axeFindings === 1 ? '' : 's'}
                {' '}&mdash; {met.axeRuleset}
              </dd>
            </div>
            {ev.contrast && (
              <div>
                <dt>Lowest text contrast</dt>
                <dd>
                  <strong>{ev.contrast.min}:1</strong> across {ev.contrast.nodes} text
                  node{ev.contrast.nodes === 1 ? '' : 's'} &mdash; 1.4.3 asks 4.5:1 for body text
                </dd>
              </div>
            )}
            {ev.target && ev.target.smallest !== null && (
              <div>
                <dt>Smallest pointer target</dt>
                <dd>
                  <strong>{ev.target.smallest}px</strong> on its short axis.
                  {' '}2.5.8 &mdash; {ev.target.pass} passing, {ev.target.fail} failing,
                  {' '}axe&rsquo;s verdict with the spacing exception applied
                </dd>
              </div>
            )}
          </dl>
        </>
      )}

      <details className="cmpdoc__ev-how">
        <summary>How it was measured</summary>
        <ul className="cmpdoc__spec-list">
          {tests.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <p className="cmpdoc__spec-note">
          Contrast and target size are read from axe-core&rsquo;s own per-node results rather
          than recomputed here, so the exemptions the success criteria allow &mdash; large
          text at 3:1, disabled controls, the 2.5.8 spacing allowance &mdash; are the ones
          the standard actually grants. Regenerate with <code>npm run gen:evidence</code>.
        </p>
      </details>
    </div>
  )
}

/* ── The detail — one component: preview · composition · recipe CSS · Do/Don't ── */
export function ComponentDetailPage({ slug, navigate }: { slug: string; navigate: (to: string) => void }) {
  const page = componentPageBySlug(slug) as ComponentPage
  const { tokens, iconSet } = useDefaultKit()
  const recipe = recipeOf(page.recipeId)
  const tier = tierOf(page.recipeId)
  const composes = usesOf(page.recipeId)
  const doc = recipe?.doc
  const ex = explainerFor(page.recipeId)

  useEffect(() => {
    const prev = document.title
    document.title = `${page.name} — a themeable ${page.name} component — UIcockpit`
    return () => { document.title = prev }
  }, [page.name])

  return (
    <DocsShell current={slug} navigate={navigate}>
      <div className="cmpdoc__crumbs">
        <a href="/components" onClick={(e) => { e.preventDefault(); navigate('/components') }}>Components</a>
        <span aria-hidden="true"> / </span>
        <span>{page.name}</span>
      </div>
      <div className="cmpdoc__head">
        <div className="cmpdoc__title-row">
          <h1>{page.name}</h1>
          <span className={`cmpdoc__tier cmpdoc__tier--${tier}`}>{tier}</span>
        </div>
        <p className="cmpdoc__lead">{page.blurb}</p>
      </div>

      <div className="cockpit-preview cmpdoc__stage" style={tokens}>
        <IconProvider set={iconSet}>
          <page.Preview />
        </IconProvider>
      </div>

      {/* The explainer: parts · states · behaviour · accessibility · tests.
        *
        * Open UI specifies every control under those five headings, and the
        * fifth is the one nobody ships — a claim about behaviour with the tests
        * that hold it up. Parts and states are DERIVED from the recipe's own CSS
        * on every build, so they cannot drift into a comfortable fiction; the
        * behaviour half is normative and cites WAI-ARIA APG, because "keyboard
        * accessible" is a promise and a key map is something an auditor can
        * check. */}
      {ex && (ex.apg || ex.apgNote || ex.parts.length > 0 || ex.states.length > 0) && (
        <section className="cmpdoc__block cmpdoc__spec">
          <h2>Specification</h2>

          {ex.apg ? (
            <div className="cmpdoc__spec-group">
              <h3>Behaviour</h3>
              <p className="cmpdoc__spec-note">
                Implements the WAI-ARIA APG{' '}
                <a href={ex.apg.url} target="_blank" rel="noreferrer">{ex.apg.pattern}</a> pattern.
                {ex.apg.free && <> <strong>The platform already gives you most of this:</strong> {ex.apg.free}</>}
              </p>
              {ex.apg.keys.length > 0 && (
                <table className="cmpdoc__spec-keys">
                  <tbody>
                    {ex.apg.keys.map(([k, what]: [string, string]) => (
                      <tr key={k}><th scope="row"><kbd className="kbd">{k}</kbd></th><td>{what}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
              <h3>Accessibility requirements</h3>
              <ul className="cmpdoc__spec-list">
                {ex.apg.aria.map((a: string) => <li key={a}>{a}</li>)}
              </ul>
            </div>
          ) : ex.apgNote ? (
            <div className="cmpdoc__spec-group">
              <h3>Behaviour</h3>
              <p className="cmpdoc__spec-note">{ex.apgNote}</p>
            </div>
          ) : null}

          {ex.parts.length > 0 && (
            <div className="cmpdoc__spec-group">
              <h3>Parts</h3>
              <p className="cmpdoc__spec-classes">
                {ex.parts.map((c: string, i: number) => <span key={c}>{i > 0 ? ' ' : ''}<code>.{c}</code></span>)}
              </p>
            </div>
          )}

          {ex.states.length > 0 && (
            <div className="cmpdoc__spec-group">
              <h3>States and variants</h3>
              <p className="cmpdoc__spec-classes">
                {ex.states.map((c: string, i: number) => <span key={c}>{i > 0 ? ' ' : ''}<code>{c}</code></span>)}
              </p>
            </div>
          )}

          <Evidence recipeId={page.recipeId} tests={ex.tests} />
        </section>
      )}

      {composes.length > 0 && (
        <p className="cmpdoc__composes">
          <strong>Composes:</strong>{' '}
          {composes.map((id, i) => (
            <span key={id}>{i > 0 ? ' · ' : ''}{label(id)}</span>
          ))}
        </p>
      )}

      {doc && (
        <section className="cmpdoc__block">
          <h2>Best practices</h2>
          <div className="cmpdoc__dodont">
            <div>
              <div className="cmpdoc__dh cmpdoc__dh--do">Do</div>
              <ul>{doc.dos.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div>
              <div className="cmpdoc__dh cmpdoc__dh--dont">Don&apos;t</div>
              <ul>{doc.donts.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </div>
        </section>
      )}

      {recipe && (
        <section className="cmpdoc__block">
          <h2>Recipe CSS</h2>
          <p className="cmpdoc__note">
            This is the exact CSS your kit ships for <code>{page.name}</code> — token-driven, so it
            re-themes with every knob. Get it (and the rest) from the configurator&apos;s{' '}
            <a href="/app" onClick={(e) => { e.preventDefault(); navigate('/app') }}>Use&nbsp;kit</a> panel.
          </p>
          <pre className="cmpdoc__css"><code>{recipe.css}</code></pre>
        </section>
      )}
    </DocsShell>
  )
}
