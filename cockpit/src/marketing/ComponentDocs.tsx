import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
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
// @ts-expect-error — the forge core is the cli package's zero-dep module (one
// source for the CLI, the MCP tool, /forge and this page); no types on purpose.
import { createForge } from '../../../cli/src/forge.mjs'
import FORGE_DATA from '../../../cli/data/forge.json'

/* The forge's data is the derivation's published answer per recipe — its
 * provenance line, what it covers, its APG contract — generated from the same
 * sources the build gate reads. The component page shows it as "where this
 * comes from", and uses the forge's skeleton as the copyable usage. One source. */
type ForgeRecipe = (typeof FORGE_DATA)['kit']['recipes'][number]
const FORGE = createForge(FORGE_DATA)
const forgeRecipe = (id: string): ForgeRecipe | undefined => FORGE_DATA.kit.recipes.find((r) => r.id === id)
const LAYER_LABEL: Record<number, string> = { 1: 'HTML', 2: 'APG', 3: 'Open UI', 4: 'Public service' }

/** One component's measured evidence, as `a11y-matrix --evidence` writes it. */
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

/** Is the viewport narrow (the rail folds)? Read once, kept live. A <details>
 *  cannot be told by CSS whether it is open, so the one place layout and state
 *  meet is here. */
function useNarrow(): boolean {
  const mq = () => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 860px)') : null)
  const [narrow, setNarrow] = useState<boolean>(() => mq()?.matches ?? false)
  useEffect(() => {
    const m = mq()
    if (!m) return
    const on = () => setNarrow(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return narrow
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

/** Left index rail, shared by the index + every detail page.
 *
 *  On a phone the rail used to wrap into a cloud of 78 links above the content
 *  — the overview that "is not handy on mobile". It is now a native <details>:
 *  the same list, folded behind "All components", open by default on the index
 *  (where the list IS the page) and closed on a detail page. No JS, no second
 *  navigation to keep in step; the CSS only decides which of the two summaries
 *  is visible. */
function Sidebar({ current, navigate }: { current?: string; navigate: (to: string) => void }) {
  const go = (e: React.MouseEvent, to: string) => { e.preventDefault(); navigate(to) }
  const list = (
    <>
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
    </>
  )
  const narrow = useNarrow()
  return (
    <nav className="cmpdoc__side" aria-label="Components">
      {/* Desktop: always open, summary hidden — the rail. Phone: closed until
        * tapped; on the index page the rail is not shown at all (the page IS the
        * list, with search). */}
      <details className="cmpdoc__side-fold" open={!narrow}>
        <summary className="cmpdoc__side-summary">All components <span className="cmpdoc__side-count">{COMPONENT_PAGES.length}</span></summary>
        <div className="cmpdoc__side-list">{list}</div>
      </details>
    </nav>
  )
}

/** Shell = site nav + the two-column [sidebar · content] docs body + footer. */
function DocsShell({ current, navigate, children }: { current?: string; navigate: (to: string) => void; children: ReactNode }) {
  const { tokens } = useDefaultKit()
  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="components" />
      {/* The kit's tokens on the docs container: the page's own chrome is sized
        * through --k-s-* / --k-type-* (no raw px on the marketing ratchet), and
        * the stage inherits them. Colours stay --mkt-*. */}
      <div className={`mkt__container cmpdoc${current ? '' : ' cmpdoc--index'}`} style={tokens}>
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
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const narrow = useNarrow()
  useEffect(() => {
    const prev = document.title
    document.title = `Components — ${COMPONENT_PAGES.length} accessible, framework-neutral components, each with a source — UIcockpit`
    return () => { document.title = prev }
  }, [])

  /* ONE box, two answers. Typing filters the list by name and blurb — a plain
   * search. The same words also go to the forge, whose answer sits under the
   * box: "you have this" with the page, or "the platform has this", or "no
   * layer names it" — so a search that finds nothing still says WHY, instead
   * of an empty grid. Nothing leaves the browser: the forge is a lookup over
   * data that is already on the page. */
  const matches = (c: ComponentPage) => !query || c.name.toLowerCase().includes(query) || c.blurb.toLowerCase().includes(query) || c.slug.includes(query)
  const verdict = useMemo(() => (query.length >= 3 ? (FORGE.resolve(q) as ForgeVerdict) : null), [q, query])
  const visibleGroups = GROUPS.map((g) => [g, byGroup(g).filter(matches)] as const).filter(([, cs]) => cs.length)
  const total = COMPONENT_PAGES.length
  const shown = visibleGroups.reduce((n, [, cs]) => n + cs.length, 0)

  return (
    <DocsShell navigate={navigate}>
      <div className="cmpdoc__head">
        <h1>Components</h1>
        <p className="cmpdoc__lead">
          {total} components, each with a source: the platform has it, WAI-ARIA APG names it, or a public service ships it.
          Pick one for its live example, provenance, contract, usage and recipe CSS — or describe what you need.
        </p>
      </div>

      <form className="cmpdoc__ask" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="cmpdoc__ask-label" htmlFor="cmpdoc-q">Search, or describe what you need</label>
        <div className="cmpdoc__ask-row">
          <input
            id="cmpdoc-q"
            className="cmpdoc__ask-input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="button · a toast that confirms the save · show more"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="cmpdoc__ask-count" aria-live="polite">{query ? `${shown} of ${total}` : total}</span>
        </div>
        {verdict && <ForgeAnswer v={verdict} q={q} navigate={navigate} />}
      </form>

      {/* The list matched nothing but the forge did: show what it found as a
        * section of its own, so a sentence lands on the same kind of result a
        * word does. */}
      {visibleGroups.length === 0 && verdict && forgePages(verdict).length > 0 && (
        <section className="cmpdoc__idx-section">
          <h2 className="cmpdoc__idx-head">By description</h2>
          <div className="cmpdoc__idx-grid">
            {forgePages(verdict).map((c) => (
              <a key={c.slug} className="cmpdoc__idx-link" href={`/components/${c.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/components/${c.slug}`) }}>{c.name}<span className="cmpdoc__idx-blurb">{c.blurb}</span></a>
            ))}
          </div>
        </section>
      )}
      {visibleGroups.length === 0 && !verdict && <p className="cmpdoc__idx-empty">Nothing in the list matches “{q}”.</p>}
      {/* Desktop: every group open, name + blurb, three columns. Phone: each
        * group is a fold (closed until tapped, open while you search) holding
        * NAMES ONLY in two columns — the blurb belongs to the detail page there.
        * One DOM for both; the <details> is always open on desktop and its
        * summary hidden, so the desktop reads exactly as before. */}
      {visibleGroups.map(([g, cs]) => (
        <details className="cmpdoc__idx-fold" key={g} open={!narrow || !!query}>
          <summary className="cmpdoc__idx-summary">
            <h2 className="cmpdoc__idx-head">{g}</h2>
            <span className="cmpdoc__idx-n">{cs.length}</span>
          </summary>
          <div className="cmpdoc__idx-grid">
            {cs.map((c) => (
              <a
                key={c.slug}
                className="cmpdoc__idx-link"
                href={`/components/${c.slug}`}
                onClick={(e) => { e.preventDefault(); navigate(`/components/${c.slug}`) }}
              >{c.name}<span className="cmpdoc__idx-blurb">{c.blurb}</span></a>
            ))}
          </div>
        </details>
      ))}

      <aside className="cmpdoc__forge">
        <p>
          <strong>Missing a component?</strong> Describe it and the derivation says whether it may exist, and where it comes
          from — or why not.{' '}
          <a href="/forge" onClick={(e) => { e.preventDefault(); navigate('/forge') }}>Forge a component →</a>
        </p>
      </aside>
    </DocsShell>
  )
}

/* The forge's answer, compact, under the search box. The full page (/forge)
 * renders the thing; here the answer is one line, the citation, and a link. */
type ForgeVerdict = {
  verdict: 'exists' | 'platform' | 'core' | 'census' | 'decided' | 'token' | 'none' | 'compose'
  say: string
  page?: string | null
  recipe?: { id: string; page: { slug: string; name: string } | null; pages?: { slug: string; name: string }[] }
  primary?: ForgeVerdict
  parts?: ForgeVerdict[]
  citations: { layer: number; source: string; url?: string }[]
  unknown: string[]
}
const VERDICT_LABEL: Record<ForgeVerdict['verdict'], string> = {
  exists: 'You have this', platform: 'The platform has this', core: 'May exist', census: 'Local extension',
  decided: 'Decided not to', token: 'A token, not a component', none: 'No layer names this', compose: 'Several things you have',
}
/** The component pages a verdict points at — the recipe's own, the primary's, the parts'. */
function forgePages(v: ForgeVerdict): ComponentPage[] {
  const slugs: string[] = []
  const add = (r?: ForgeVerdict['recipe']) => { for (const p of r?.pages ?? (r?.page ? [r.page] : [])) if (!slugs.includes(p.slug)) slugs.push(p.slug) }
  add(v.recipe); add(v.primary?.recipe); for (const p of v.parts ?? []) add(p.recipe)
  return slugs.map((s) => componentPageBySlug(s)).filter((p): p is ComponentPage => !!p)
}
function ForgeAnswer({ v, q, navigate }: { v: ForgeVerdict; q: string; navigate: (to: string) => void }) {
  const pages = forgePages(v)
  const deep = `/forge?q=${encodeURIComponent(q.trim())}`
  const cite = v.citations.find((c) => c.layer !== 3)
  return (
    <div className={`cmpdoc__answer cmpdoc__answer--${v.verdict}`} aria-live="polite">
      <span className={`cmpdoc__answer-badge cmpdoc__answer-badge--${v.verdict}`}>{VERDICT_LABEL[v.verdict]}</span>
      <span className="cmpdoc__answer-say">
        {v.say.split('. ')[0]}.
        {cite && cite.url && <> <a href={cite.url} target="_blank" rel="noreferrer">{cite.source}</a>.</>}
        {' '}
        {pages.map((p) => (
          <a key={p.slug} className="cmpdoc__answer-page" href={`/components/${p.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/components/${p.slug}`) }}>{p.name} →</a>
        ))}
        <a className="cmpdoc__answer-page" href={deep} onClick={(e) => { e.preventDefault(); navigate(deep) }}>{pages.length ? 'See it in the forge →' : 'Open in the forge →'}</a>
      </span>
    </div>
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
 * generated by scripts/a11y-matrix.mjs --evidence and regenerated by hand. Nothing here is
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

/* ── Where it comes from — the provenance line, from the derivation ────────────
 * Every component carries a line or leaves (Sprint I–J). The page shows the
 * line: which layer names it (HTML · APG · a public service), linked to the
 * source, and the sentence the derivation wrote for it. A recipe the derivation
 * lists as sourceless says so — that is a fact about the kit, not a decoration. */
function Provenance({ recipeId }: { recipeId: string }) {
  const fr = forgeRecipe(recipeId)
  type Src = { layer: number; source: string; because: string; url?: string }
  const all = (fr?.provenance ?? []) as Src[]
  const sources = all.filter((s) => s.layer !== 3)
  const census = all.find((s) => s.layer === 3)
  const alsoCovers = (fr?.covers?.service ?? []).filter((c) => !sources.some((s) => s.source === c))
  if (!fr) return null
  return (
    <section className="cmpdoc__prov" aria-label="Where this component comes from">
      <h2 className="cmpdoc__prov-h">Where it comes from</h2>
      {sources.length === 0 ? (
        <p className="cmpdoc__prov-none">
          <strong>No core line.</strong> No HTML element, WAI-ARIA APG pattern or public-service component names this
          one; the derivation lists it as sourceless. It is ours — kept because a page pattern needs it, and it leaves
          the day that stops being true.{census && <> Open UI’s census does count it: {census.because}</>}
        </p>
      ) : (
        <>
          <ul className="cmpdoc__prov-list">
            {sources.map((src) => (
              <li key={src.source}>
                <span className={`cmpdoc__layer cmpdoc__layer--${src.layer}`}>{LAYER_LABEL[src.layer] ?? `L${src.layer}`}</span>
                {src.url ? <a href={src.url} target="_blank" rel="noreferrer">{src.source}</a> : <span>{src.source}</span>}
                <span className="cmpdoc__prov-why"> — {src.because}</span>
              </li>
            ))}
          </ul>
          {alsoCovers.length > 0 && (
            <p className="cmpdoc__prov-also">Also covers: {alsoCovers.join(' · ')}.</p>
          )}
        </>
      )}
    </section>
  )
}

/** Copy to the clipboard, with a moment of confirmation. */
function useCopy(): [string | null, (key: string, text: string) => void] {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (key: string, text: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(key)
      window.setTimeout(() => setCopied((k) => (k === key ? null : k)), 1600)
    })
  }
  return [copied, copy]
}

/* The specimen as HTML — read from the LIVE stage, not re-rendered: what you
 * copy is exactly what you see, icons and all. The gallery card's own chrome
 * (the .card frame and its ⓘ panel) is not part of the component and is
 * stripped; the markup is then broken into lines by tag depth so it pastes
 * readably. React leaves no framework attributes in the DOM, so this is plain
 * HTML the kit's CSS styles as-is. */
function specimenHtml(stage: HTMLElement | null): string {
  if (!stage) return ''
  const card = stage.querySelector(':scope > .card') as HTMLElement | null
  const root = (card ?? stage).cloneNode(true) as HTMLElement
  root.querySelectorAll('.cardinfo').forEach((n) => n.remove())
  const raw = card ? root.innerHTML : root.innerHTML
  return prettyHtml(raw.trim())
}
const VOID = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'track', 'wbr', 'area', 'col', 'embed', 'param'])
function prettyHtml(html: string): string {
  const tokens = html.replace(/>\s+</g, '><').split(/(?=<)|(?<=>)/g).filter((t) => t.trim().length)
  let depth = 0
  const out: string[] = []
  for (const t of tokens) {
    const isClose = /^<\//.test(t)
    const isOpen = /^<[a-zA-Z]/.test(t)
    const tag = (t.match(/^<\/?([a-zA-Z0-9-]+)/) ?? [])[1]
    const selfClosing = /\/>$/.test(t) || (tag ? VOID.has(tag.toLowerCase()) : false)
    if (isClose) depth = Math.max(0, depth - 1)
    out.push('  '.repeat(depth) + t.trim())
    if (isOpen && !selfClosing && !isClose) depth++
  }
  return out.join('\n')
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
  const fr = forgeRecipe(page.recipeId)
  const usage: string = fr ? FORGE.skeleton(fr) : ''
  const stageRef = useRef<HTMLDivElement>(null)
  const [copied, copy] = useCopy()
  const CopyButton = ({ id, text, label }: { id: string; text: () => string; label: string }) => (
    <button type="button" className={`cmpdoc__copy${copied === id ? ' cmpdoc__copy--done' : ''}`} onClick={() => copy(id, text())} aria-live="polite">
      {copied === id ? 'Copied' : label}
    </button>
  )

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

      <Provenance recipeId={page.recipeId} />

      <div className="cockpit-preview cmpdoc__stage" style={tokens} ref={stageRef}>
        <IconProvider set={iconSet}>
          <page.Preview />
        </IconProvider>
      </div>
      {/* Copy what you see: the specimen's HTML (read from the stage), the recipe's
        * CSS, and the usage skeleton the forge derives from the recipe's own
        * classes and APG contract. Three things an agent or a person needs to use
        * this component somewhere else, without opening the configurator. */}
      <div className="cmpdoc__copybar" role="group" aria-label="Copy this component">
        <CopyButton id="html" label="Copy HTML" text={() => specimenHtml(stageRef.current)} />
        {recipe && <CopyButton id="css" label="Copy CSS" text={() => recipe.css} />}
        {usage && <CopyButton id="usage" label="Copy usage" text={() => usage} />}
        <span className="cmpdoc__copyhint">HTML is the specimen above, as rendered · CSS is the recipe below · usage is the block’s skeleton with its ARIA</span>
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
                      <tr key={k}><th scope="row"><kbd>{k}</kbd></th><td>{what}</td></tr>
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

      {usage && (
        <section className="cmpdoc__block">
          <div className="cmpdoc__block-head">
            <h2>Usage</h2>
            <CopyButton id="usage2" label="Copy" text={() => usage} />
          </div>
          <p className="cmpdoc__note">
            The block on its element, its parts, and the ARIA the contract names — a shape to fill, derived from the
            recipe’s own classes. Not a specimen; the stage above is.
          </p>
          <pre className="cmpdoc__css"><code>{usage}</code></pre>
        </section>
      )}

      {recipe && (
        <section className="cmpdoc__block">
          <div className="cmpdoc__block-head">
            <h2>Recipe CSS</h2>
            <CopyButton id="css2" label="Copy" text={() => recipe.css} />
          </div>
          <p className="cmpdoc__note">
            This is the exact CSS your kit ships for <code>{page.name}</code> — token-driven, so it
            re-themes with every knob. Get it (and the rest) from the configurator&apos;s{' '}
            <a href="/app" onClick={(e) => { e.preventDefault(); navigate('/app') }}>Use&nbsp;kit</a> panel.
          </p>
          <pre className="cmpdoc__css"><code>{recipe.css}</code></pre>
        </section>
      )}

      <aside className="cmpdoc__forge">
        <p>
          <strong>Not quite this?</strong> Describe what you need and the derivation says whether it may exist — and
          where it comes from.{' '}
          <a href="/forge" onClick={(e) => { e.preventDefault(); navigate('/forge') }}>Forge a component →</a>
        </p>
      </aside>
    </DocsShell>
  )
}
