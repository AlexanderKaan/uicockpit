import { useMemo, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { Icon } from '../../icons/Icon'
import { SHOWCASES, type BlockSpec, type ShowcaseManifest } from '../../showcases/manifests'
import { renderBlock } from '../../showcases/blocks'
import { buildTokens } from '../../tokens/buildTokens'
import type { Config } from '../../tokens/types'
import { setGalleryJump } from '../../state/galleryJump'
import { COMPONENTS, componentAt } from '../../showcases/components'
import { usesOf } from '../../kit/segments'
import { FoundationsView } from './FoundationsView'
import type { ViewKind } from '../Stage'

/* Component → gallery tier guess for the specimen's "Open in gallery" jump
 * (Fase J-1). componentAt returns a kit-class id; the block-tier patterns jump to
 * the Blocks wall, the rest default to Atoms. */
const COMP_TIER: Record<string, 'atom' | 'block'> = {
  stat: 'block', table: 'block', card: 'block', chart: 'block', kanban: 'block',
  pricing: 'block', tree: 'block', timeline: 'block', dropzone: 'block',
}

/* Manifest block kind → graph wiring (Fase J-2). The manifest uses short names
 * ('stats', 'table'); the segment graph (segments.ts) + the gallery use canonical
 * ids ('stat-tile', 'data-table'). This bridge powers the breadcrumb label, the
 * "composes these atoms" rail (usesOf), and the block→gallery jump. */
const BLOCK_INFO: Record<string, { label: string; seg: string; jump: { q: string; tier: 'atom' | 'block' } }> = {
  stats: { label: 'Stats', seg: 'stat-tile', jump: { q: 'stat', tier: 'block' } },
  chart: { label: 'Chart', seg: 'chart', jump: { q: 'chart', tier: 'block' } },
  list: { label: 'List', seg: 'activity-feed', jump: { q: 'list', tier: 'atom' } },
  thread: { label: 'Thread', seg: 'thread', jump: { q: 'thread', tier: 'block' } },
  composer: { label: 'Composer', seg: 'composer', jump: { q: 'composer', tier: 'atom' } },
  table: { label: 'Table', seg: 'data-table', jump: { q: 'data table', tier: 'block' } },
  form: { label: 'Form', seg: 'form-panel', jump: { q: 'form panel', tier: 'block' } },
  pricing: { label: 'Pricing', seg: 'pricing', jump: { q: 'pricing', tier: 'block' } },
  prose: { label: 'Prose', seg: 'prose', jump: { q: 'two column', tier: 'block' } },
  dl: { label: 'Details', seg: 'description-list', jump: { q: 'description list', tier: 'atom' } },
  chips: { label: 'Chips', seg: 'chip', jump: { q: 'chip', tier: 'atom' } },
  kanban: { label: 'Kanban', seg: 'kanban', jump: { q: 'kanban', tier: 'block' } },
  tree: { label: 'Tree', seg: 'tree', jump: { q: 'tree', tier: 'block' } },
  timeline: { label: 'Timeline', seg: 'timeline', jump: { q: 'timeline', tier: 'block' } },
  settings: { label: 'Settings', seg: 'settings', jump: { q: 'settings', tier: 'atom' } },
  wizard: { label: 'Wizard', seg: 'wizardstepper', jump: { q: 'wizard', tier: 'block' } },
  dropzone: { label: 'Dropzone', seg: 'file-upload-dropzone', jump: { q: 'upload', tier: 'block' } },
  media: { label: 'Media', seg: 'file-grid', jump: { q: 'file grid', tier: 'block' } },
  calendar: { label: 'Calendar', seg: 'calendar', jump: { q: 'calendar', tier: 'block' } },
  invoice: { label: 'Invoice', seg: 'data-table', jump: { q: 'data table', tier: 'block' } },
  cashflow: { label: 'Cashflow', seg: 'stat-tile', jump: { q: 'stat', tier: 'block' } },
  invoices: { label: 'Invoices', seg: 'data-table', jump: { q: 'data table', tier: 'block' } },
  clients: { label: 'Clients', seg: 'data-table', jump: { q: 'data table', tier: 'block' } },
}
const blockInfo = (kind: string) =>
  BLOCK_INFO[kind] ?? { label: kind, seg: kind, jump: { q: kind, tier: 'block' as const } }

/* Archetype → a tiny human caption (the one quiet line that gives a showcase its
 * identity, in place of the old standing intro + per-page blurb — Fase J-7). */
const ARCH_LABEL: Record<string, string> = {
  feed: 'Feed',
  'list-detail': 'List · detail',
  supporting: 'Supporting pane',
  workspace: 'Workspace',
}

/* The loupe's altitude. page → block → atom is a continuous zoom; each level is
 * a breadcrumb crumb you can click to fly back out (Fase J-2). */
type Focus =
  | { level: 'page' }
  | { level: 'block'; pane: number; idx: number }
  | { level: 'atom'; pane: number; idx: number; comp: string }

/**
 * Pages — the loupe (H3b manifest model · Fase J).
 *
 * A page is DATA: archetype × nav × panes of seeded blocks (src/showcases/
 * manifests.ts), rendered through the same kit recipes the export ships. The view
 * is deliberately content-first (Fase J-7): chips → preview, with every control
 * pushed into a slim bottom dock or one click away. Inspect turns the preview into
 * a continuous zoom — Page › Block › Atom › All tokens — with a breadcrumb spine.
 */

const PANE_CLASS = {
  flex: 'pane pane--flex',
  fixed: 'pane pane--fixed',
  detail: 'pane pane--flex pane--detail',
  supporting: 'pane pane--fixed pane--supporting',
} as const

function ShowcaseStage({ m, cfg, onViewChange }: { m: ShowcaseManifest; cfg: Config; onViewChange: (v: ViewKind) => void }) {
  const [width, setWidth] = useState(m.width)
  // The loupe (Fase J-2): a continuous zoom Page › Block › Atom. `loupe` off is a
  // clean live page; turning it on reveals the breadcrumb and makes blocks
  // pickable. Click a block → it isolates and enlarges (atoms inside clickable);
  // click an atom → its specimen + recipe; All tokens → the foundation grid.
  const [loupe, setLoupe] = useState(false)
  const [focus, setFocus] = useState<Focus>({ level: 'page' })
  const [railOpen, setRailOpen] = useState(true)
  const [tokensOpen, setTokensOpen] = useState(false)
  const [showJson, setShowJson] = useState(false)
  const tokens = useMemo(() => buildTokens(cfg), [cfg])
  const wc = width < 600 ? 'Compact' : width < 840 ? 'Medium' : width < 1200 ? 'Expanded' : width < 1600 ? 'Large' : 'Extra-large'
  // Fase J-5 — Shells folded into the slider: a `suite`-nav showcase morphs its
  // navigation bar → rail → sidebar at the scaffold container's 600/1200px
  // breakpoints (see the `@container scaffold` queries in recipes).
  const navState = m.nav === 'suite' ? (width < 600 ? 'Bottom bar' : width < 1200 ? 'Rail' : 'Sidebar') : null

  const block = focus.level !== 'page' ? m.panes[focus.pane]?.blocks[focus.idx] : undefined
  const bInfo = block ? blockInfo(block.block) : undefined
  const comp = focus.level === 'atom' ? COMPONENTS[focus.comp] : undefined

  // Page → Block: walk up from the clicked node to the block wrapper (carries its
  // pane/idx as data-attrs), then isolate it.
  const pickBlock = (e: ReactMouseEvent) => {
    let el = e.target as HTMLElement | null
    while (el && el !== e.currentTarget) {
      if (el.dataset && el.dataset.idx != null) {
        setFocus({ level: 'block', pane: +el.dataset.pane!, idx: +el.dataset.idx })
        return
      }
      el = el.parentElement
    }
  }
  // Block → Atom: the existing leaf-pick, now scoped to the isolated block.
  const pickAtom = (e: ReactMouseEvent) => {
    if (focus.level !== 'block') return
    const id = componentAt(e.target as Element)
    if (id) setFocus({ level: 'atom', pane: focus.pane, idx: focus.idx, comp: id })
  }

  const enterLoupe = () => { setLoupe(true); setFocus({ level: 'page' }); setTokensOpen(false) }
  const exitLoupe = () => { setLoupe(false); setFocus({ level: 'page' }); setTokensOpen(false) }

  // The breadcrumb spine — one crumb per visited altitude, each a button that
  // flies back out to its level. The All-tokens inspector (J3) appends as the
  // deepest rung whenever it's open.
  const crumbs: Array<{ label: string; go: () => void; on: boolean }> = [
    { label: `Page · ${m.title}`, go: () => { setTokensOpen(false); setFocus({ level: 'page' }) }, on: !tokensOpen && focus.level === 'page' },
  ]
  if (bInfo && focus.level !== 'page') {
    const { pane, idx } = focus
    crumbs.push({ label: `Block · ${bInfo.label}`, go: () => { setTokensOpen(false); setFocus({ level: 'block', pane, idx }) }, on: !tokensOpen && focus.level === 'block' })
  }
  if (comp) crumbs.push({ label: `Atom · ${comp.label}`, go: () => setTokensOpen(false), on: !tokensOpen && focus.level === 'atom' })
  if (tokensOpen) crumbs.push({ label: 'All tokens', go: () => {}, on: true })

  const hint =
    tokensOpen ? 'Every resolved token — the foundation behind the kit'
      : focus.level === 'page' ? 'Click any block to zoom in'
        : focus.level === 'block' ? 'Click any element to drill to its atom'
          : 'Deepest atom level'

  const stageKey = `${tokensOpen ? 'tokens' : focus.level}-${focus.level !== 'page' ? `${focus.pane}.${focus.idx}` : ''}-${focus.level === 'atom' ? focus.comp : ''}`
  const blockCount = m.panes.reduce((n, p) => n + p.blocks.length, 0)
  const caption = `${ARCH_LABEL[m.archetype] ?? m.archetype} · ${m.nav === 'suite' ? 'adaptive nav' : 'top nav'}`
  const showWidth = !loupe || (focus.level === 'page' && !tokensOpen)

  // Export-as-starter: the manifest IS the starter — download it as JSON.
  const downloadManifest = () => {
    const blob = new Blob([JSON.stringify(m, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${m.id}.manifest.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Context line — the breadcrumb spine when inspecting, else a quiet caption. */}
      {loupe ? (
        <nav className="shc__loupebar" aria-label="Zoom level">
          <div className="shc__crumbs">
            {crumbs.map((c, i) => (
              <span key={i} className="shc__crumb-wrap">
                {i > 0 && <span className="shc__crumb-sep" aria-hidden>›</span>}
                <button type="button" className={`shc__crumb ${c.on ? 'shc__crumb--on' : ''}`} onClick={c.go} aria-current={c.on ? 'true' : undefined}>{c.label}</button>
              </span>
            ))}
          </div>
          <span className="shc__loupehint">{hint}</span>
        </nav>
      ) : (
        <p className="shc__caption">{caption}</p>
      )}

      {/* The stage — the preview floats, centred on the canvas; rail beside it when inspecting. */}
      <div className={`lyt__stage shc__loupebody ${loupe && railOpen && !tokensOpen ? 'shc__loupebody--rail' : ''}`}>
        <div className="shc__loupestage" key={stageKey}>
          {tokensOpen ? (
            <FoundationsView cfg={cfg} tokens={tokens} />
          ) : (
            <>
              {(!loupe || focus.level === 'page') && (
                <div className={`shc__previewwrap ${loupe ? 'shc__pickpage' : ''}`} onClick={loupe ? pickBlock : undefined}>
                  <ShowcaseShell m={m} width={loupe ? Math.min(width, 1100) : width} pickable={loupe} />
                </div>
              )}
              {loupe && focus.level === 'block' && block && (
                <div className="shc__focusblock" onClick={pickAtom}>
                  {renderBlock(block, focus.idx)}
                </div>
              )}
              {loupe && focus.level === 'atom' && comp && (
                <div className="shc__atomstage">{comp.specimen()}</div>
              )}
            </>
          )}
        </div>

        {loupe && railOpen && !tokensOpen && (
          <aside className="shc__loupe-rail" aria-label="Loupe inspector">
            {focus.level === 'page' && (
              <>
                <div className="shc__loupe-head">The page</div>
                <p className="shc__loupe-blurb">A showcase is data: {blockCount} blocks across {m.panes.length} {m.panes.length === 1 ? 'pane' : 'panes'}. Click any block to zoom in.</p>
                <button type="button" className="btn btn--outline btn--xs" onClick={() => setTokensOpen(true)}>
                  All tokens <Icon name="chevR" />
                </button>
              </>
            )}
            {focus.level === 'block' && bInfo && (
              <>
                <div className="shc__loupe-head">Block · {bInfo.label}</div>
                <p className="shc__loupe-blurb">Composes these atoms — click any element to drill into it:</p>
                <ul className="shc__uses">
                  {(usesOf(bInfo.seg).length ? usesOf(bInfo.seg) : ['(self-contained)']).map((u) => <li key={u}>{u}</li>)}
                </ul>
                <button
                  type="button"
                  className="btn btn--outline btn--xs"
                  onClick={() => { setGalleryJump(bInfo.jump.q, bInfo.jump.tier); onViewChange('components') }}
                >
                  Open in gallery <Icon name="chevR" />
                </button>
              </>
            )}
            {focus.level === 'atom' && comp && (
              <>
                <div className="shc__recipe-title">Recipe — how it derives</div>
                {comp.recipe.map(([k, v]) => (
                  <div className="shc__recipe-row" key={k}><span className="shc__recipe-k">{k}</span><code className="shc__recipe-v">{v}</code></div>
                ))}
                <div className="shc__recipe-blurb">{comp.blurb}</div>
                <div className="shc__loupe-actions">
                  <button type="button" className="btn btn--outline btn--xs" onClick={() => setTokensOpen(true)}>
                    All tokens <Icon name="chevR" />
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--xs"
                    onClick={() => { setGalleryJump(comp.label.toLowerCase(), COMP_TIER[focus.comp] ?? 'atom'); onViewChange('components') }}
                  >
                    Open in gallery
                  </button>
                </div>
              </>
            )}
          </aside>
        )}
      </div>

      {/* The dock — a slim bottom toolbar. Width on the left (the old header
       * scrubber, demoted); the actions on the right. Everything that used to
       * stack above the preview now lives here, out of the content's way. */}
      <div className="shc__dock">
        {showWidth && (
          <label className="lyt__scrub shc__dock-scrub">
            <span className="lyt__scrub-label">Width</span>
            <input
              type="range"
              min={360}
              max={1680}
              step={10}
              value={width}
              list="shc-win-detents"
              onChange={(e) => setWidth(+e.target.value)}
              aria-label="Shell width in pixels"
            />
            <datalist id="shc-win-detents">
              <option value={600} />
              <option value={840} />
              <option value={1200} />
              <option value={1600} />
            </datalist>
            <span className="lyt__scrub-val">{width}px · <strong>{wc}</strong>{navState && <> · {navState}</>}</span>
          </label>
        )}
        <span className="shc__dock-spacer" />
        {loupe && !tokensOpen && (
          <button type="button" className="btn btn--ghost btn--sm btn--toggle" aria-pressed={railOpen} onClick={() => setRailOpen((o) => !o)}>
            {railOpen ? 'Hide recipe' : 'Show recipe'}
          </button>
        )}
        {loupe && (
          <button type="button" className="btn btn--ghost btn--sm btn--toggle" aria-pressed={tokensOpen} onClick={() => setTokensOpen((o) => !o)}>
            <Icon name="grid" />All tokens
          </button>
        )}
        <button type="button" className="btn btn--ghost btn--sm btn--toggle" aria-pressed={loupe} onClick={() => (loupe ? exitLoupe() : enterLoupe())}>
          <Icon name="search" />{loupe ? 'Done' : 'Inspect'}
        </button>
        <button type="button" className="btn btn--ghost btn--sm btn--toggle" aria-pressed={showJson} onClick={() => setShowJson((o) => !o)}>
          <Icon name="file" />JSON
        </button>
        <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={downloadManifest} aria-label="Download manifest" title="Download manifest">
          <Icon name="upload" />
        </button>
      </div>

      {showJson && (
        <pre className="code shc__manifest" aria-label={`Manifest for ${m.title}`}>{JSON.stringify(m, null, 2)}</pre>
      )}
    </>
  )
}

/** The pure shell render — one manifest → one live scaffold. Nav selection is local. */
function ShowcaseShell({
  m,
  width,
  renderBlockFn = renderBlock,
  pickable = false,
}: {
  m: ShowcaseManifest
  width: number
  renderBlockFn?: (b: BlockSpec, key: number) => ReactNode
  /** Loupe page-level: wrap each block in a hover-pickable target carrying its
   *  pane/idx (Fase J-2). The stage delegates the click and walks up to read it. */
  pickable?: boolean
}) {
  const [active, setActive] = useState(0)
  return (
    <div className={`scaffold scaffold--${m.archetype}`} style={{ width, maxWidth: '100%' }}>
      <div className="scaffold__frame shc__frame">
        <div className="scaffold__bar shc__bar">
          <span className="shc__bar-title">{m.barTitle}</span>
          {m.nav === 'topbar' && (
            <nav className="shc__bar-links" aria-label={`${m.title} navigation`}>
              {m.navItems.map((it, i) => (
                <button key={it.label} type="button" className={`tab ${i === active ? 'tab--on' : ''}`} onClick={() => setActive(i)}>{it.label}</button>
              ))}
            </nav>
          )}
          <span className="shc__bar-spacer" />
          <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Search"><Icon name="search" /></button>
          <span className="avatar avatar--sm">A</span>
        </div>
        {m.nav === 'suite' && (
          <nav className="scaffold__nav" aria-label={`${m.title} navigation`}>
            <div className="navsuite">
              {m.navItems.map((it, i) => (
                <button
                  key={it.label}
                  type="button"
                  className={`navsuite__item ${i === active ? 'navsuite__item--on' : ''}`}
                  aria-current={i === active ? 'page' : undefined}
                  onClick={() => setActive(i)}
                >
                  <span className="navsuite__icon"><Icon name={it.icon} size={18} /></span>
                  <span className="navsuite__label">{it.label}</span>
                </button>
              ))}
            </div>
          </nav>
        )}
        <div className="scaffold__body">
          {m.panes.map((pane, i) => (
            <section className={`${PANE_CLASS[pane.role]} shc__pane`} key={i} aria-label={`${m.title} ${pane.role} pane`}>
              {pane.blocks.map((b, j) =>
                pickable ? (
                  <div className="shc__pick" key={j} data-pane={i} data-idx={j} data-label={blockInfo(b.block).label}>
                    {renderBlockFn(b, j)}
                  </div>
                ) : (
                  // key = the block's own index (unique among the pane's children);
                  // passing the PANE index here collided all blocks onto one key,
                  // leaving a stale duplicate when Inspect re-wrapped them (Fase J-8).
                  renderBlockFn(b, j)
                ),
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PagesView({ cfg, onViewChange }: { cfg: Config; onViewChange: (v: ViewKind) => void }) {
  const [showcaseId, setShowcaseId] = useState(SHOWCASES[0]!.id)
  const m = SHOWCASES.find((s) => s.id === showcaseId)!

  // Content-first (Fase J-7): the chips ARE the header. No standing intro, no
  // per-page blurb, no Compare-kits matrix — the live re-tint on every config
  // change already proves style is orthogonal to structure. Controls live in the
  // dock at the bottom of ShowcaseStage.
  return (
    <div className="lyt shc">
      <div className="shc__picker" role="radiogroup" aria-label="Showcase">
        {SHOWCASES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={s.id === showcaseId}
            className={`chip ${s.id === showcaseId ? 'chip--on' : ''}`}
            onClick={() => setShowcaseId(s.id)}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* key = remount per showcase so width resets to the manifest default */}
      <ShowcaseStage m={m} cfg={cfg} key={m.id} onViewChange={onViewChange} />
    </div>
  )
}
