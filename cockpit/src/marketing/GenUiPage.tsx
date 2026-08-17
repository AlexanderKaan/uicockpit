import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'
import { IconProvider } from '../icons/Icon'
import { buildTokens } from '../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import type { Mode, Scale } from '../tokens/types'
import { admit, typesUsed, GEN_CATALOG, GEN_TYPES, LIMITS, type Admitted, type Issue } from '../genui/spec'
import { GenTree } from '../genui/render'
import { PRESETS } from '../genui/presets'
import MANIFEST from '../kit/manifest.json'
// @ts-expect-error — the forge core is the cli package's zero-dep module (one source, no types on purpose)
import { createForge } from '../../../cli/src/forge.mjs'
import FORGE_DATA from '../../../cli/data/forge.json'

/**
 * /genui — the fourth service, as a SANDBOX: the answer, as interface.
 *
 * One prompt, answered twice. Left, what an assistant does today: prose.
 * Right, the same answer as a small spec on the components — every node a
 * kit recipe with a source, refusals rendered in place, nothing invented. The
 * spec is editable underneath so the two columns can be pushed on by hand,
 * which is what a sandbox is for: to see, before anything is promised to a
 * public-service assistant, whether generative output on these components
 * holds up.
 *
 * Nothing here calls a model. The prose is written; the spec is admitted by
 * `admit()` (src/genui/spec.ts) with the forge as the refuser, and rendered by
 * `render.tsx` in kit classes only. Step 2 — an A2UI adapter onto this
 * catalogue — is described at the foot and not built.
 */

type Provenance = { layer: number; source: string; url?: string }
type ForgeRecipe = { id: string; provenance?: Provenance[]; page?: { slug: string; name: string } | null }
const RECIPE_BY_ID = new Map<string, ForgeRecipe>((FORGE_DATA as { kit: { recipes: ForgeRecipe[] } }).kit.recipes.map((r) => [r.id, r]))
const MANIFEST_BY_ID = (MANIFEST as { components: Record<string, { behaviour: string | null }> }).components

const LAYER: Record<number, string> = { 1: 'L1 · HTML', 2: 'L2 · APG', 3: 'L3 · Open UI', 4: 'L4 · public service' }
/* The two recipes that are the kit's grammar rather than components — see genui.test.ts. */
const GRAMMAR = new Set(['layout-primitives', 'composition'])

/* A shared spec travels in the URL: ?spec=<base64url of the JSON>. Presets
 * travel as ?p=<id>. Unicode-safe both ways. */
const encodeSpec = (json: string) => btoa(String.fromCharCode(...new TextEncoder().encode(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const decodeSpec = (b64: string) => {
  const s = b64.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}
const SCALES: { id: Scale; label: string }[] = [{ id: 'compact', label: 'Compact' }, { id: 'default', label: 'Default' }, { id: 'comfortable', label: 'Comfortable' }]

export function GenUiPage({ navigate }: { navigate: (to: string) => void }) {
  const forge = useMemo(() => createForge(FORGE_DATA), [])
  const tokens = useMemo(() => buildTokens(DEFAULT_CONFIG).vars as CSSProperties, [])
  const [presetId, setPresetId] = useState(PRESETS[0]!.id)
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]!
  const [text, setText] = useState(() => JSON.stringify(PRESETS[0]!.spec, null, 2))
  const [parseError, setParseError] = useState<string | null>(null)
  const [spec, setSpec] = useState<unknown>(PRESETS[0]!.spec)
  /* The kit the answer renders on. A generative answer has to hold up on every
   * configuration a consumer may run — the sandbox lets you flip mode and
   * density on the RIGHT pane and see whether it does. Same buildTokens the
   * a11y matrix drives; the left pane stays on the default so the comparison
   * is against what an assistant does today. */
  const [kitMode, setKitMode] = useState<Mode>('light')
  const [kitScale, setKitScale] = useState<Scale>('default')
  const answerTokens = useMemo(() => buildTokens({ ...DEFAULT_CONFIG, mode: kitMode, scale: kitScale }).vars as CSSProperties, [kitMode, kitScale])
  const answerRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState<'link' | 'html' | null>(null)
  const copy = async (what: 'link' | 'html') => {
    try {
      const payload = what === 'link'
        ? `${location.origin}/genui?spec=${encodeSpec(JSON.stringify(spec))}`
        : (answerRef.current?.innerHTML ?? '')
      await navigator.clipboard.writeText(payload)
      setCopied(what)
      setTimeout(() => setCopied(null), 1600)
    } catch { /* clipboard refused — nothing to say */ }
  }

  useEffect(() => {
    const prev = document.title
    document.title = 'Generative UI — the answer, as interface — a sandbox on the components — UIcockpit'
    return () => { document.title = prev }
  }, [])

  const choose = (id: string) => {
    const p = PRESETS.find((x) => x.id === id)
    if (!p) return
    setPresetId(id)
    setText(JSON.stringify(p.spec, null, 2))
    setSpec(p.spec)
    setParseError(null)
    if (typeof history !== 'undefined') history.replaceState({}, '', `/genui?p=${id}`)
  }
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const shared = q.get('spec')
    if (shared) {
      try {
        const json = decodeSpec(shared)
        const parsed = JSON.parse(json)
        setText(JSON.stringify(parsed, null, 2))
        setSpec(parsed)
        setParseError(null)
        return
      } catch { /* a bad share falls through to the preset */ }
    }
    const p = q.get('p')
    if (p && PRESETS.some((x) => x.id === p)) choose(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onEdit = (v: string) => {
    setText(v)
    try {
      const parsed = JSON.parse(v)
      setSpec(parsed)
      setParseError(null)
    } catch (e) {
      setParseError((e as Error).message)
    }
  }

  // Admission runs on every keystroke that parses; the spec object is cloned so
  // the admitter's budget trims never write back into the editor's text.
  const admitted = useMemo(() => admit(JSON.parse(JSON.stringify(spec)), forge), [spec, forge])
  const used = typesUsed(admitted.tree)
  const refused = admitted.issues.filter((i) => i.level === 'refused')
  const warnings = admitted.issues.filter((i) => i.level === 'warning')

  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="genui" />
      <main className="mkt__container gen" style={tokens}>
        <header className="gen__head">
          <p className="gen__eyebrow">A service on the components · Generative UI · <span className="gen__tag">sandbox</span></p>
          <h1>The answer, as interface.</h1>
          <p className="gen__lede">
            An assistant answers a question. Today the answer is prose. Here the same answer comes back as a small spec that names
            <em> components</em> — and the components are these: each one a recipe with a source, a measured shape, and a
            conformance record. What the spec asks for and the derivation does not admit is <em>refused</em>, in place. No model
            behind this page; the point is to see whether generative output on the components holds up before a public-service
            assistant is asked to trust it.
          </p>
        </header>

        <div className="gen__presets" aria-label="Examples">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" aria-pressed={p.id === presetId} className={`gen__chip${p.id === presetId ? ' gen__chip--on' : ''}`} onClick={() => choose(p.id)}>{p.name}</button>
          ))}
        </div>

        <section className="gen__split" aria-label="Before and after">
          <div className="gen__pane">
            <span className="gen__pane-tag">Without</span>
            <div className="gen__chat">
              <div className="gen__prompt">{preset.prompt}</div>
              <div className="gen__answer cockpit-preview">
                <article className="prose">
                  <h2>{preset.spec.title ?? preset.name}</h2>
                  <Prose paragraphs={preset.prose} />
                </article>
              </div>
            </div>
          </div>
          <div className="gen__pane">
            <span className="gen__pane-tag gen__pane-tag--with">With the components</span>
            {/* The kit under the answer: mode × density. What holds up here holds
              * up on a consumer's configuration; what breaks is a finding. */}
            <div className="gen__chat">
              <div className="gen__kit" aria-label="The kit the answer renders on">
                <div className="gen__seg" role="group" aria-label="Mode">
                  {(['light', 'dark'] as Mode[]).map((m) => (
                    <button key={m} type="button" className="gen__seg-btn" aria-pressed={kitMode === m} onClick={() => setKitMode(m)}>{m === 'light' ? 'Light' : 'Dark'}</button>
                  ))}
                </div>
                <div className="gen__seg" role="group" aria-label="Density">
                  {SCALES.map((sc) => (
                    <button key={sc.id} type="button" className="gen__seg-btn" aria-pressed={kitScale === sc.id} onClick={() => setKitScale(sc.id)}>{sc.label}</button>
                  ))}
                </div>
              </div>
              <div className="gen__prompt">{preset.prompt}</div>
              <div className={`gen__answer cockpit-preview${kitMode === 'dark' ? ' gen__answer--dark' : ''}`} style={answerTokens} ref={answerRef}>
                <IconProvider set={DEFAULT_CONFIG.iconSet}>
                  <div className="l-stack">
                    <GenTree tree={admitted.tree} />
                  </div>
                </IconProvider>
              </div>
            </div>
          </div>
        </section>

        <section className="gen__work">
          <div className="gen__editorwrap">
            <h2>The spec <span className="gen__muted">— edit it; the right column follows</span></h2>
            <textarea
              className="gen__editor"
              value={text}
              onChange={(e) => onEdit(e.target.value)}
              spellCheck={false}
              aria-label="The UI spec, as JSON"
              aria-invalid={parseError ? true : undefined}
            />
            <p className={`gen__status${parseError ? ' gen__status--bad' : ''}`} role="status">
              {parseError ? `Not valid JSON — the last good spec is shown. ${parseError}` : `${admitted.count} component${admitted.count === 1 ? '' : 's'} admitted · ${refused.length} refused · ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`}
              {' '}<button type="button" className="gen__reset" onClick={() => choose(presetId)}>Reset to the preset</button>
              {' '}<button type="button" className="gen__reset" onClick={() => copy('link')}>{copied === 'link' ? 'Link copied' : 'Copy a link to this spec'}</button>
              {' '}<button type="button" className="gen__reset" onClick={() => copy('html')}>{copied === 'html' ? 'HTML copied' : 'Copy the rendered HTML'}</button>
            </p>
          </div>

          <div className="gen__made">
            <h2>What it is made of</h2>
            {used.length === 0 && <p className="gen__muted">Nothing admitted yet.</p>}
            <ul className="gen__sources">
              {used.map((t) => {
                const entry = GEN_CATALOG[t]
                const r = RECIPE_BY_ID.get(entry.recipe)
                const beh = MANIFEST_BY_ID[entry.recipe]?.behaviour ?? null
                const sources = (r?.provenance ?? []).filter((s) => s.layer !== 3)
                return (
                  <li key={t}>
                    <div className="gen__source-head">
                      <code>{t}</code>
                      <span className="gen__arrow">→</span>
                      {r?.page ? <a href={`/components/${r.page.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/components/${r.page!.slug}`) }}>{entry.label}</a> : <span>{entry.label}</span>}
                      {beh && <span className={`gen__beh gen__beh--${beh}`} title="what the manifest says the specimen relies on">{beh}</span>}
                    </div>
                    <div className="gen__source-line">
                      {sources.length ? sources.slice(0, 3).map((s, i) => (
                        <span key={i}><span className={`gen__layer gen__layer--${s.layer}`}>{LAYER[s.layer] ?? `L${s.layer}`}</span>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.source}</a> : s.source}</span>
                      )) : GRAMMAR.has(entry.recipe)
                        ? <span className="gen__muted">the kit's grammar — foundation tier, no catalogue names a {t}; it arranges components and is not one</span>
                        : <span className="gen__muted">no core line — the derivation lists it as sourceless</span>}
                    </div>
                    {entry.note && <div className="gen__source-note">{entry.note}</div>}
                  </li>
                )
              })}
            </ul>

            {(refused.length > 0 || warnings.length > 0) && (
              <>
                <h2>Admission</h2>
                <ul className="gen__issues">
                  {refused.map((i, k) => <IssueRow key={`r${k}`} i={i} navigate={navigate} />)}
                  {warnings.map((i, k) => <IssueRow key={`w${k}`} i={i} navigate={navigate} />)}
                </ul>
              </>
            )}
          </div>
        </section>

        <section className="gen__how">
          <h2>How it works — and what is not built</h2>
          <dl className="gen__legend">
            <dt>The spec</dt>
            <dd>Ours, v0: a nested JSON tree of {GEN_TYPES.length} node types (<code>{GEN_TYPES.slice(0, 9).join(', ')}, …</code>). Small on purpose — a hand can write it in this box.</dd>
            <dt>The catalogue</dt>
            <dd>Every type renders with exactly ONE kit recipe, in the kit's own classes; the recipe carries the provenance line, the manifest the measured shape and the behaviour class. A type without a source cannot be added — the test holds the table to the kit and to forge.json.</dd>
            <dt>Refusals</dt>
            <dd>An unknown type is put to the forge; its verdict is the reason. A card inside a card, a card foot with anything but buttons, more than {LIMITS.blocks} components or {LIMITS.items} items, nesting past {LIMITS.depth}: refused or trimmed, and said so. Try the <button type="button" className="gen__inline" onClick={() => choose('refusals')}>refusals preset</button>.</dd>
            <dt>Behaviour</dt>
            <dd>The manifest classes each block: <em>platform</em> (details, dialog — the browser owns it), <em>css</em> (a state is a class), <em>script</em> (tabs, combobox — the consumer's, until the behaviour module exists). The panel says which; a script block renders and does not switch.</dd>
            <dt>Step 2 · A2UI</dt>
            <dd>Not built. An adapter from Google's A2UI messages (<code>Card · Text · Row · Column · List · Button · Tabs · Divider…</code>, flat by id, with a data model) onto this catalogue — so an agent framework that already speaks A2UI can render on these components without knowing them. Own spec first, adapter second: decided 2026-08-17.</dd>
            <dt>Not a model</dt>
            <dd>The prose on the left is written; the specs are written. When a model writes the spec, this admission is the contract it writes against — the same table, the same refusals — and the CLI/MCP will carry it, as they carry the forge.</dd>
          </dl>
        </section>
      </main>
      <MktFooter navigate={navigate} />
    </div>
  )
}

/** Paragraphs as the kit's prose; a run of "• " lines becomes a list. */
function Prose({ paragraphs }: { paragraphs: string[] }) {
  const out: React.ReactNode[] = []
  let bullets: string[] = []
  const flush = (k: number) => { if (bullets.length) { out.push(<ul key={`ul${k}`}>{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>); bullets = [] } }
  paragraphs.forEach((p, i) => {
    if (p.startsWith('• ')) { bullets.push(p.slice(2)); return }
    flush(i)
    out.push(<p key={i}>{p}</p>)
  })
  flush(paragraphs.length)
  return <>{out}</>
}

function IssueRow({ i, navigate }: { i: Issue; navigate: (to: string) => void }) {
  return (
    <li className={`gen__issue gen__issue--${i.level}`}>
      <span className={`gen__badge gen__badge--${i.level}`}>{i.level}</span>
      <code className="gen__path">{i.path}</code>
      <span>{i.message}</span>
      {i.forge?.page && <a href={i.forge.page} onClick={(e) => { e.preventDefault(); navigate(i.forge!.page!) }}>the component page →</a>}
    </li>
  )
}

export type { Admitted }
