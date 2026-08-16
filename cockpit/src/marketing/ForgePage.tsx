import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'
import { IconProvider } from '../icons/Icon'
import { buildTokens } from '../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import { componentPageBySlug } from '../stage/views/ComponentGallery'
// @ts-expect-error — the forge core is the cli package's zero-dep module (one
// source: the CLI, the MCP tool and this page answer from the same file); it
// has no types on purpose, see cli/src/forge.mjs.
import { createForge } from '../../../cli/src/forge.mjs'
import FORGE_DATA from '../../../cli/data/forge.json'

/**
 * /forge — describe a component; the system says whether it may exist.
 *
 * The four-layer derivation (HTML → APG → Open UI as a check → GOV.UK/USWDS/NL)
 * decides which components the kit has. This page points the same derivation
 * at a sentence and shows the verdict with its citation — and, because the kit
 * is on the page, RENDERS the answer: the real component when we have it, the
 * bare element under the floor when the platform has it, the scaffold under
 * the Role Canvas floors when it may exist. There is no model behind the input;
 * the answer is a lookup over the same data the build gate reads, so what this
 * page says and what `npm run build` enforces cannot disagree.
 */

type Citation = { layer: number; source: string; url?: string; note?: string }
type Verdict = {
  verdict: 'exists' | 'platform' | 'core' | 'census' | 'decided' | 'token' | 'none' | 'compose'
  query: string
  say: string
  matched: string[]
  unknown: string[]
  refusedWords?: string[]
  citations: Citation[]
  recipe?: { id: string; section: string; page: { slug: string; name: string } | null; provenance: Citation[] }
  contract?: { pattern?: string; url?: string; keys?: [string, string][]; aria?: string[]; free?: string | null; none?: string }
  page?: string | null
  usage?: string
  floor?: { selector: string; body: string | null }[]
  extendedBy?: { id: string; name: string; page: string | null }[]
  reason?: string
  tokens?: string
  scaffold?: { id: string; css: string; html: string }
  composition?: string
  primary?: Verdict
  parts?: Verdict[]
  catalogues?: Citation[]
  alternatives?: { id: string; name: string }[]
  pattern?: Citation | null
}

const LABEL: Record<Verdict['verdict'], string> = {
  exists: 'Exists', platform: 'The platform has it', core: 'May exist', census: 'Local extension',
  decided: 'Decided not to', token: 'A token, not a component', none: 'No', compose: 'Composed',
}
const LAYER: Record<number, string> = { 1: 'L1 · HTML', 2: 'L2 · APG', 3: 'L3 · Open UI', 4: 'L4 · public service' }

const EXAMPLES = [
  'a link above the heading that goes back one step',
  'a toast that confirms the save',
  'a horizontal line between two sections',
  'a dialog with a form and two buttons',
  'an avatar with initials',
  'a tree table with expandable rows',
  'a kanban board',
  'show more',
]

export function ForgePage({ navigate }: { navigate: (to: string) => void }) {
  const forge = useMemo(() => createForge(FORGE_DATA), [])
  const [query, setQuery] = useState('')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const tokens = useMemo(() => buildTokens(DEFAULT_CONFIG).vars as CSSProperties, [])

  useEffect(() => {
    const prev = document.title
    document.title = 'The forge — describe a component; the derivation says whether it may exist — UIcockpit'
    return () => { document.title = prev }
  }, [])

  /* Deep link: /forge?q=… resolves on arrival, and every answer writes its
   * question back into the URL — so a verdict can be linked, shared, and
   * reached from the components index, the CLI and the MCP tool without
   * typing it again. replaceState, not push: the router listens to popstate
   * and the page is the same page. */
  const ask = (text: string, { fromUrl = false } = {}) => {
    const t = text.trim()
    if (!t) return
    setQuery(t)
    setVerdict(forge.resolve(t) as Verdict)
    if (!fromUrl && typeof history !== 'undefined') history.replaceState({}, '', `/forge?q=${encodeURIComponent(t)}`)
  }
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) ask(q, { fromUrl: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const onSubmit = (e: FormEvent) => { e.preventDefault(); ask(query) }

  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="forge" />
      {/* The kit's tokens on the page itself: the forge is sized through --k-s-*,
        * --k-type-* and --k-radius-* (see the .frg block in marketing.css), so the
        * site composes through the kit's scale rather than adding raw px. */}
      <main className="mkt__container frg" style={tokens}>
        <header className="frg__head">
          <p className="frg__eyebrow">A service on the components · Forge</p>
          <h1>Describe a component. The derivation says whether it may exist.</h1>
          <p className="frg__lede">
            The kit's component list is not chosen, it is <em>derived</em>: the platform has it (HTML), WAI-ARIA APG names it,
            or a public service ships it. Type what you need and the same four catalogues the build gate reads answer — with a
            citation, and with the thing itself rendered below. No model behind the box; every answer is a lookup.
          </p>
        </header>

        <form className="frg__ask" onSubmit={onSubmit} role="search" aria-label="Describe a component">
          <label className="frg__label" htmlFor="frg-q">What do you need?</label>
          <div className="frg__row">
            <input
              id="frg-q"
              className="frg__input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="a banner that warns the session is about to expire"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="frg__go">Resolve</button>
          </div>
          <div className="frg__examples" aria-label="Examples">
            {EXAMPLES.map((ex) => (
              <button type="button" key={ex} className="frg__chip" onClick={() => ask(ex)}>{ex}</button>
            ))}
          </div>
        </form>

        {verdict && (
          <section className="frg__result" aria-live="polite">
            <VerdictCard v={verdict} navigate={navigate} />
            <div className="frg__stagewrap">
              <div className="cockpit-preview frg__stage">
                <IconProvider set={DEFAULT_CONFIG.iconSet}>
                  <Rendered v={verdict} />
                </IconProvider>
              </div>
              <p className="frg__stage-note">{stageNote(verdict)}</p>
            </div>
          </section>
        )}

        <section className="frg__how">
          <h2>How it answers</h2>
          <dl className="frg__legend">
            <dt>Exists</dt><dd>We ship it. You get the recipe, its provenance line, its APG keyboard + ARIA contract and its page — and it renders here.</dd>
            <dt>The platform has it</dt><dd>An HTML element, already styled by the kit's floor. The forge refuses to build a component and quotes the rule that styles the element.</dd>
            <dt>May exist</dt><dd>Nothing in the kit, but layer 2 or 4 names it. You get what it owes and a scaffold composed from the kit's grammar — tokens only, the look from the Role Canvas floors.</dd>
            <dt>Local extension</dt><dd>Only Open UI's census names it. Allowed outside the core; the derivation gate will report it as sourceless.</dd>
            <dt>Decided not to</dt><dd>A catalogue entry we chose not to ship, with the reason written down.</dd>
            <dt>No</dt><dd>No layer names it — and the words that were not understood are listed, so the refusal is about the component, not the vocabulary.</dd>
          </dl>
          <p className="frg__foot">
            The same answer from the terminal: <code>npx uicockpit forge "…"</code>. From an agent: the <code>resolve_component</code> MCP tool.
            All three read one generated artefact, checked in the build.
          </p>
        </section>
      </main>
      <MktFooter navigate={navigate} />
    </div>
  )
}

function stageNote(v: Verdict): string {
  switch (v.verdict) {
    case 'exists': return v.recipe?.page ? 'The real component, from the kit, on the default configuration.' : 'A usage skeleton on the kit\'s own classes — this recipe has no public page yet.'
    case 'platform': return 'The bare element, styled by the floor alone — nothing added.'
    case 'core': case 'census': return 'The scaffold as it renders: the look is the Role Canvas floors\' (data-role), the recipe owns arrangement only.'
    case 'compose': return 'The composition on the kit\'s own classes — a shape to fill, not a specimen.'
    case 'token': return 'Sized by the token, coloured by the text it sits in.'
    default: return 'Nothing to render.'
  }
}

function VerdictCard({ v, navigate }: { v: Verdict; navigate: (to: string) => void }) {
  return (
    <article className={`frg__card frg__card--${v.verdict}`}>
      <div className="frg__verdict">
        <span className={`frg__badge frg__badge--${v.verdict}`}>{LABEL[v.verdict]}</span>
        <span className="frg__query">“{v.query}”</span>
      </div>
      <p className="frg__say">{v.say}</p>

      {(v.matched.length > 0 || v.unknown.length > 0) && (
        <p className="frg__words">
          {v.matched.length > 0 && <>Recognised: {v.matched.map((m) => <span key={m} className="frg__word">{m}</span>)}</>}
          {v.unknown.length > 0 && <> Not understood: {v.unknown.map((m) => <span key={m} className="frg__word frg__word--unknown">{m}</span>)}</>}
        </p>
      )}

      {v.verdict === 'exists' && v.page && (
        <p className="frg__link">
          <a href={v.page} onClick={(e) => { e.preventDefault(); navigate(v.page!) }}>Open the component page →</a>
          {v.alternatives && v.alternatives.length > 0 && <span className="frg__alt"> Also: {v.alternatives.map((a) => a.name).join(', ')}</span>}
        </p>
      )}
      {v.verdict === 'platform' && v.extendedBy && v.extendedBy.length > 0 && (
        <p className="frg__link">The kit builds on it: {v.extendedBy.map((x, i) => (
          <span key={x.id}>{i > 0 && ', '}{x.page ? <a href={x.page} onClick={(e) => { e.preventDefault(); navigate(x.page!) }}>{x.name}</a> : x.name}</span>
        ))}</p>
      )}

      {v.citations.length > 0 && (
        <div className="frg__cites">
          <h3>Citations</h3>
          <ul>
            {v.citations.map((c, i) => (
              <li key={i}>
                <span className={`frg__layer frg__layer--${c.layer}`}>{LAYER[c.layer] ?? `L${c.layer}`}</span>
                {c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.source}</a> : <span>{c.source}</span>}
                {c.note && <span className="frg__note"> — {c.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {v.verdict === 'none' && v.catalogues && (
        <div className="frg__cites">
          <h3>Describe it against</h3>
          <ul>{v.catalogues.map((c, i) => <li key={i}><span className={`frg__layer frg__layer--${c.layer}`}>{LAYER[c.layer]}</span><a href={c.url} target="_blank" rel="noreferrer">{c.source}</a></li>)}</ul>
        </div>
      )}

      {v.contract?.keys && v.contract.keys.length > 0 && (
        <div className="frg__contract">
          <h3>What it owes — APG {v.contract.pattern}</h3>
          <table className="frg__keys"><tbody>
            {v.contract.keys.map(([k, what]) => <tr key={k}><th scope="row">{k}</th><td>{what}</td></tr>)}
          </tbody></table>
          {v.contract.aria && v.contract.aria.length > 0 && <ul className="frg__aria">{v.contract.aria.map((a) => <li key={a}>{a}</li>)}</ul>}
        </div>
      )}
      {v.contract?.none && <p className="frg__contract-none"><strong>Behaviour:</strong> {v.contract.none}</p>}

      {v.floor && v.floor.length > 0 && (
        <div className="frg__code"><h3>The floor rule</h3><pre><code>{v.floor.slice(0, 2).map((f) => `${f.selector} {\n  ${(f.body ?? '…').replace(/;\s*/g, ';\n  ').trim()}\n}`).join('\n\n')}</code></pre></div>
      )}
      {v.reason && <p className="frg__reason"><strong>Reason:</strong> {v.reason}</p>}
      {v.usage && v.verdict !== 'compose' && (
        <div className="frg__code"><h3>{v.verdict === 'platform' ? 'Use the element' : 'Usage'}</h3><pre><code>{v.usage}</code></pre></div>
      )}
      {v.scaffold && (
        <div className="frg__code">
          <h3>Scaffold — CSS, tokens only</h3><pre><code>{v.scaffold.css}</code></pre>
          <h3>Markup — the look comes from data-role</h3><pre><code>{v.scaffold.html}</code></pre>
        </div>
      )}
      {v.composition && (
        <div className="frg__code"><h3>Composition</h3><pre><code>{v.composition}</code></pre></div>
      )}
    </article>
  )
}

/** What the verdict looks like, live, on the kit. */
function Rendered({ v }: { v: Verdict }) {
  if (v.verdict === 'exists' && v.recipe?.page) {
    const page = componentPageBySlug(v.recipe.page.slug)
    if (page) return <page.Preview />
  }
  if (v.verdict === 'exists' && v.usage) return <Html html={v.usage} />
  if (v.verdict === 'platform' && v.usage) return <Html html={v.usage} />
  if ((v.verdict === 'core' || v.verdict === 'census') && v.scaffold) {
    return (
      <>
        <style>{v.scaffold.css}</style>
        <Html html={v.scaffold.html} />
      </>
    )
  }
  if (v.verdict === 'compose' && v.composition) {
    const styles = (v.parts ?? []).map((p) => p.scaffold?.css).filter(Boolean).join('\n')
    return (
      <>
        {styles && <style>{styles}</style>}
        <Html html={v.composition} />
      </>
    )
  }
  if (v.verdict === 'token' && v.usage) return <Html html={v.usage} />
  return <p className="frg__empty">—</p>
}

/* The forge's own output, rendered as it is. The strings are generated by the
 * forge from catalogue names and the kit's class list — never from the visitor's
 * text, which is only ever MATCHED against the index and never interpolated —
 * so this is our markup, not theirs. `sanitize` documents that boundary and
 * holds it if the generator ever changes: no scripts, no handlers, no
 * javascript: URLs survive, and the generator never emits any. */
function sanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<\/?(iframe|object|embed|link|meta|base|style)\b[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"')
}
function Html({ html }: { html: string }) {
  return <div className="frg__html" dangerouslySetInnerHTML={{ __html: sanitize(html) }} />
}
