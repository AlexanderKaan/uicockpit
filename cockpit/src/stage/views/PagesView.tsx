import { Fragment, useMemo, useState, useRef, useLayoutEffect, type MouseEvent as ReactMouseEvent, type ReactNode, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { Icon } from '../../icons/Icon'
import { SHOWCASES, LEDGER_SCREENS, LEDGER_DETAIL_PARENT, type SectionSpec, type ShowcaseManifest, type LedgerScreen } from '../../showcases/manifests'
import { renderSection } from '../../showcases/sections'
import { buildTokens } from '../../tokens/buildTokens'
import type { Config } from '../../tokens/types'
import { setGalleryJump } from '../../state/galleryJump'
import { COMPONENTS, componentAt, elementAt } from '../../showcases/components'
import { usesOf } from '../../kit/segments'
import { CONTRACT, ROLE_GUARANTEE } from '../../kit/contracts'
import { FoundationsView } from './FoundationsView'
import { RoleCanvasDemo } from './RoleCanvasDemo'
import type { ViewKind } from '../Stage'

/* Component → gallery tier guess for the specimen's "Open in gallery" jump
 * (Fase J-1). componentAt returns a kit-class id; the component-tier patterns jump
 * to the Components wall, the rest default to Atoms. */
const COMP_TIER: Record<string, 'atom' | 'component'> = {
  stat: 'component', table: 'component', card: 'component', chart: 'component', kanban: 'component',
  pricing: 'component', tree: 'component', timeline: 'component', dropzone: 'component',
}

/* Manifest section kind → graph wiring (Fase J-2). The manifest uses short names
 * ('stats', 'table'); the segment graph (segments.ts) + the gallery use canonical
 * ids ('stat-tile', 'data-table'). This bridge powers the breadcrumb label, the
 * "composes these atoms" rail (usesOf), and the section→gallery jump. */
const SECTION_INFO: Record<string, { label: string; seg: string; jump: { q: string; tier: 'atom' | 'component' | 'section' } }> = {
  stats: { label: 'Stats', seg: 'stat-tile', jump: { q: 'stat', tier: 'component' } },
  chart: { label: 'Chart', seg: 'chart', jump: { q: 'chart', tier: 'component' } },
  list: { label: 'List', seg: 'activity-feed', jump: { q: 'list', tier: 'atom' } },
  thread: { label: 'Thread', seg: 'thread', jump: { q: 'thread', tier: 'component' } },
  composer: { label: 'Composer', seg: 'composer', jump: { q: 'composer', tier: 'atom' } },
  table: { label: 'Table', seg: 'data-table', jump: { q: 'data table', tier: 'component' } },
  form: { label: 'Form', seg: 'form-panel', jump: { q: 'form panel', tier: 'component' } },
  pricing: { label: 'Pricing', seg: 'pricing', jump: { q: 'pricing', tier: 'component' } },
  prose: { label: 'Prose', seg: 'prose', jump: { q: 'two column', tier: 'component' } },
  dl: { label: 'Details', seg: 'description-list', jump: { q: 'description list', tier: 'atom' } },
  chips: { label: 'Chips', seg: 'chip', jump: { q: 'chip', tier: 'atom' } },
  kanban: { label: 'Kanban', seg: 'kanban', jump: { q: 'kanban', tier: 'component' } },
  tree: { label: 'Tree', seg: 'tree', jump: { q: 'tree', tier: 'component' } },
  timeline: { label: 'Timeline', seg: 'timeline', jump: { q: 'timeline', tier: 'component' } },
  settings: { label: 'Settings', seg: 'settings', jump: { q: 'settings', tier: 'atom' } },
  wizard: { label: 'Wizard', seg: 'wizardstepper', jump: { q: 'wizard', tier: 'component' } },
  dropzone: { label: 'Dropzone', seg: 'file-upload-dropzone', jump: { q: 'upload', tier: 'component' } },
  media: { label: 'Media', seg: 'file-grid', jump: { q: 'file grid', tier: 'component' } },
  calendar: { label: 'Calendar', seg: 'calendar', jump: { q: 'calendar', tier: 'component' } },
  invoice: { label: 'Invoice', seg: 'data-table', jump: { q: 'data table', tier: 'component' } },
  cashflow: { label: 'Cashflow', seg: 'stat-tile', jump: { q: 'stat', tier: 'component' } },
  invoices: { label: 'Invoices', seg: 'data-table', jump: { q: 'data table', tier: 'component' } },
  clients: { label: 'Clients', seg: 'data-table', jump: { q: 'data table', tier: 'component' } },
  expenses: { label: 'Expenses', seg: 'data-table', jump: { q: 'data table', tier: 'component' } },
}
const sectionInfo = (kind: string) =>
  SECTION_INFO[kind] ?? { label: kind, seg: kind, jump: { q: kind, tier: 'component' as const } }

/* Archetype → a tiny human caption (the one quiet line that gives a showcase its
 * identity, in place of the old standing intro + per-page blurb — Fase J-7). */
const ARCH_LABEL: Record<string, string> = {
  feed: 'Feed',
  'list-detail': 'List · detail',
  supporting: 'Supporting pane',
  workspace: 'Workspace',
}

/* The loupe's altitude. page → section → atom is a continuous zoom; each level is
 * a breadcrumb crumb you can click to fly back out (Fase J-2). */
type Focus =
  | { level: 'page' }
  | { level: 'section'; pane: number; idx: number }
  // `node` = a CLONE of the LIVE element you clicked (mounted isolated, so anything
  // is zoomable without a curated specimen — and a cloned node, not an HTML string,
  // so there's no innerHTML/XSS surface). `comp` is its resolved type (for the
  // recipe/contract); `label` its display name (may not be in COMPONENTS).
  | { level: 'atom'; pane: number; idx: number; comp: string; node?: HTMLElement; label?: string }

/** Display names for the chrome/structural types that have no curated COMPONENTS
 *  spec — so the breadcrumb + rail still read nicely when you zoom into the nav. */
const TYPE_LABELS: Record<string, string> = {
  sidenav: 'Sidebar', navsuite: 'Navigation', appbar: 'Topbar', banner: 'Banner',
  alert: 'Alert', select: 'Select', calendar: 'Calendar', segmented: 'Segmented control',
  component: 'Component',
}

/**
 * Pages — the loupe (H3b manifest model · Fase J).
 *
 * A page is DATA: archetype × nav × panes of seeded sections (src/showcases/
 * manifests.ts), rendered through the same kit recipes the export ships. The view
 * is deliberately content-first (Fase J-7): chips → preview, with every control
 * pushed into a slim bottom dock or one click away. Inspect turns the preview into
 * a continuous zoom — Page › Section › Atom › All tokens — with a breadcrumb spine.
 */

const PANE_CLASS = {
  flex: 'pane pane--flex',
  fixed: 'pane pane--fixed',
  detail: 'pane pane--flex pane--detail',
  supporting: 'pane pane--fixed pane--supporting',
} as const

/** The app's side menu, lifted to the theater so it DRIVES which screen renders
 *  (Catalyst-style: one sidebar, many pages). `current` = the rendered manifest
 *  id (may be a detail like 'ledger'); `highlight` = the nav item to light up
 *  (a detail highlights its parent). */
export interface AppNav {
  screens: LedgerScreen[]
  current: string
  highlight: string
  onNavigate: (id: string) => void
}

function ShowcaseStage({ m, cfg, onViewChange, appNav, width, onWidth }: { m: ShowcaseManifest; cfg: Config; onViewChange: (v: ViewKind) => void; appNav?: AppNav; width: number; onWidth: (w: number) => void }) {
  // Width is OWNED by the parent (the one app) so it PERSISTS across screen
  // switches — the manifests share width 1200, but the slider value shouldn't snap
  // back on every nav click. Loupe/focus stay local (they SHOULD reset per screen).
  const setWidth = onWidth
  // The loupe (Fase J-2): a continuous zoom Page › Section › Atom. `loupe` off is a
  // clean live page; turning it on reveals the breadcrumb and makes sections
  // pickable. Click a section → it isolates and enlarges (atoms inside clickable);
  // click an atom → its specimen + recipe; All tokens → the foundation grid.
  // In a screen you are ALWAYS inspecting — no Inspect toggle. You reached this
  // screen by zooming in from the wall; selecting a component is the primary act.
  // (Hover reveals component bounds; click zooms in a level.)
  const loupe = true
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

  const section = focus.level !== 'page' ? m.panes[focus.pane]?.sections[focus.idx] : undefined
  const sInfo = section ? sectionInfo(section.kind) : undefined
  const comp = focus.level === 'atom' ? COMPONENTS[focus.comp] : undefined
  const atomNode = focus.level === 'atom' ? focus.node : undefined
  const atomLabel = focus.level === 'atom' ? (focus.label ?? comp?.label ?? focus.comp) : ''

  // Page → Section: walk up from the clicked node to the section wrapper (carries
  // its pane/idx as data-attrs), then isolate it.
  // Each level change animates as a continuous zoom (View Transitions) instead of
  // an instant swap — so wall→screen→component→atom all FEEL like zooming further
  // in. .shc--app drops its `shc-zoom` name outside the wall morph (the `zooming`
  // flag in PagesView), so these inner transitions are clean root crossfades.
  const vt = (mutate: () => void) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (!doc.startViewTransition) { mutate(); return }
    doc.startViewTransition(() => flushSync(mutate))
  }
  // Per-component picking: hovering outlines the EXACT component under the cursor
  // (table / chart / card / badge…); clicking zooms straight into it. The
  // containing manifest section is recorded so the breadcrumb keeps its context
  // (and the Section crumb zooms out to the whole block).
  const hotRef = useRef<HTMLElement | null>(null)
  const setHot = (el: HTMLElement | null) => {
    if (hotRef.current === el) return
    if (hotRef.current) hotRef.current.classList.remove('shc__comp-hot')
    hotRef.current = el
    if (el) el.classList.add('shc__comp-hot')
  }
  const hoverComp = (e: ReactMouseEvent) => setHot(elementAt(e.target as Element))
  // Zoom into the LIVE element you clicked — captured + rendered isolated, so
  // ANYTHING is zoomable (nav, topbar, banner…) without a curated specimen.
  // componentAt resolves the TYPE (for the recipe/contract); the outerHTML is the
  // specimen; TYPE_LABELS / COMPONENTS give the display name.
  const zoomToComponent = (target: Element, pane: number, idx: number) => {
    const el = elementAt(target)
    if (!el) return
    const id = componentAt(target) ?? 'component'
    const node = el.cloneNode(true) as HTMLElement
    node.classList.remove('shc__comp-hot')
    const label = COMPONENTS[id]?.label ?? TYPE_LABELS[id] ?? id
    setHot(null)
    vt(() => setFocus({ level: 'atom', pane, idx, comp: id, node, label }))
  }
  const pickComp = (e: ReactMouseEvent) => {
    let el = e.target as HTMLElement | null, pane = 0, idx = 0
    while (el && el !== e.currentTarget) {
      if (el.dataset && el.dataset.idx != null) { pane = +el.dataset.pane!; idx = +el.dataset.idx; break }
      el = el.parentElement
    }
    zoomToComponent(e.target as Element, pane, idx)
  }
  // Section → Atom: the existing leaf-pick, now scoped to the isolated section.
  const pickAtom = (e: ReactMouseEvent) => {
    if (focus.level !== 'section') return
    zoomToComponent(e.target as Element, focus.pane, focus.idx)
  }

  // The breadcrumb spine — one crumb per visited altitude, each a button that
  // flies back out to its level. The All-tokens inspector (J3) appends as the
  // deepest rung whenever it's open.
  const crumbs: Array<{ label: string; go: () => void; on: boolean }> = [
    { label: `Page · ${m.title}`, go: () => { setTokensOpen(false); setFocus({ level: 'page' }) }, on: !tokensOpen && focus.level === 'page' },
  ]
  if (sInfo && focus.level !== 'page') {
    const { pane, idx } = focus
    crumbs.push({ label: `Section · ${sInfo.label}`, go: () => { setTokensOpen(false); setFocus({ level: 'section', pane, idx }) }, on: !tokensOpen && focus.level === 'section' })
  }
  if (focus.level === 'atom') crumbs.push({ label: `Atom · ${focus.label ?? comp?.label ?? focus.comp}`, go: () => setTokensOpen(false), on: !tokensOpen && focus.level === 'atom' })
  if (tokensOpen) crumbs.push({ label: 'All tokens', go: () => {}, on: true })

  const hint =
    tokensOpen ? 'Every resolved token — the foundation behind the kit'
      : focus.level === 'page' ? 'Click any section to zoom in'
        : focus.level === 'section' ? 'Click any element to drill to its atom'
          : 'Deepest atom level'

  const stageKey = `${tokensOpen ? 'tokens' : focus.level}-${focus.level !== 'page' ? `${focus.pane}.${focus.idx}` : ''}-${focus.level === 'atom' ? focus.comp : ''}`
  const sectionCount = m.panes.reduce((n, p) => n + p.sections.length, 0)
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
                <button type="button" className={`shc__crumb ${c.on ? 'shc__crumb--on' : ''}`} onClick={() => vt(c.go)} aria-current={c.on ? 'true' : undefined}>{c.label}</button>
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
                <div className={`shc__previewwrap ${loupe ? 'shc__pickpage' : ''}`} onClick={loupe ? pickComp : undefined} onMouseOver={loupe ? hoverComp : undefined} onMouseLeave={loupe ? () => setHot(null) : undefined}>
                  <ShowcaseShell m={m} width={loupe ? Math.min(width, 1100) : width} pickable={loupe} appNav={appNav} />
                </div>
              )}
              {loupe && focus.level === 'section' && section && (
                <div className="shc__focusblock" onClick={pickAtom}>
                  {renderSection(section, focus.idx)}
                </div>
              )}
              {loupe && focus.level === 'atom' && (
                atomNode
                  ? <div className="shc__atomstage" ref={(r) => { if (r && atomNode) r.replaceChildren(atomNode) }} />
                  : comp ? <div className="shc__atomstage">{comp.specimen()}</div> : null
              )}
            </>
          )}
        </div>

        {loupe && railOpen && !tokensOpen && (
          <aside className="shc__loupe-rail" aria-label="Loupe inspector">
            {focus.level === 'page' && (
              <>
                <RoleCanvasDemo />
                <div className="rcx-divider" />
                <p className="shc__loupe-blurb">Or drill the page itself: {sectionCount} sections across {m.panes.length} {m.panes.length === 1 ? 'pane' : 'panes'}. Click any element to zoom into its contract.</p>
                <button type="button" className="btn btn--outline btn--xs" onClick={() => setTokensOpen(true)}>
                  All tokens <Icon name="chevR" />
                </button>
              </>
            )}
            {focus.level === 'section' && sInfo && (
              <>
                <div className="shc__loupe-head">Section · {sInfo.label}</div>
                <p className="shc__loupe-blurb">Composes these atoms — click any element to drill into it:</p>
                <ul className="shc__uses">
                  {(usesOf(sInfo.seg).length ? usesOf(sInfo.seg) : ['(self-contained)']).map((u) => <li key={u}>{u}</li>)}
                </ul>
                <button
                  type="button"
                  className="btn btn--outline btn--xs"
                  onClick={() => { setGalleryJump(sInfo.jump.q, sInfo.jump.tier); onViewChange('components') }}
                >
                  Open in gallery <Icon name="chevR" />
                </button>
              </>
            )}
            {focus.level === 'atom' && (
              <>
                <div className="shc__loupe-head">Contract · {atomLabel}</div>
                {CONTRACT[focus.comp] ? (
                  <>
                    <p className="shc__contract-intro">Each part wears a <strong>role</strong>; the role guarantees its treatment — so this composes coherently anywhere.</p>
                    <ul className="shc__contract">
                      {CONTRACT[focus.comp]!.map((p, i) => (
                        <li className="shc__contract-row" key={i}>
                          <span className="shc__contract-n">{i + 1}</span>
                          <span className="shc__contract-body">
                            <span className="shc__contract-head"><strong>{p.part}</strong> <span className={`shc__role shc__role--${p.role}`}>{p.role}</span></span>
                            <span className="shc__contract-gtee">{ROLE_GUARANTEE[p.role]}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="shc__loupe-blurb">A live component, captured from the screen — its roles aren’t contracted yet.</p>
                )}
                {comp && (
                  <details className="shc__recipe-more">
                    <summary className="shc__recipe-summary">Recipe — how it derives</summary>
                    {comp.recipe.map(([k, v]) => (
                      <div className="shc__recipe-row" key={k}><span className="shc__recipe-k">{k}</span><code className="shc__recipe-v">{v}</code></div>
                    ))}
                    <div className="shc__recipe-blurb">{comp.blurb}</div>
                  </details>
                )}
                <div className="shc__loupe-actions">
                  <button type="button" className="btn btn--outline btn--xs" onClick={() => setTokensOpen(true)}>
                    All tokens <Icon name="chevR" />
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--xs"
                    onClick={() => { setGalleryJump((comp?.label ?? atomLabel).toLowerCase(), COMP_TIER[focus.comp] ?? 'atom'); onViewChange('components') }}
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
  renderSectionFn = renderSection,
  pickable = false,
  appNav,
}: {
  m: ShowcaseManifest
  width: number
  renderSectionFn?: (b: SectionSpec, key: number) => ReactNode
  /** Loupe page-level: wrap each section in a hover-pickable target carrying its
   *  pane/idx (Fase J-2). The stage delegates the click and walks up to read it. */
  pickable?: boolean
  /** When part of the single Ledger app: the side menu DRIVES the rendered screen
   *  (Catalyst-style). Replaces the cosmetic per-manifest nav. */
  appNav?: AppNav
}) {
  // Cosmetic nav state — only used for legacy standalone manifests (no appNav).
  const [active, setActive] = useState(0)
  // The topbar account menu — a real `.menu` dropdown under the avatar.
  const [acctOpen, setAcctOpen] = useState(false)
  const onDetail = appNav ? appNav.current !== appNav.highlight : false
  // List → detail: clicking an invoice row on the Invoices screen opens the
  // invoice-detail screen (the believable list→detail verb). Delegated so it
  // doesn't touch renderSection. Suppressed in loupe pick mode.
  const onBodyClick = (e: ReactMouseEvent) => {
    if (!appNav || pickable) return
    if (appNav.current !== 'ledger-invoices') return
    if ((e.target as HTMLElement).closest('tbody tr')) appNav.onNavigate('ledger')
  }
  return (
    <div className={`scaffold scaffold--${m.archetype} ${appNav ? 'shc__app' : ''}`} data-screen={appNav?.current} style={{ width, maxWidth: '100%', minWidth: appNav ? 680 : undefined }}>
      <div className="scaffold__frame shc__frame">
        <div className="scaffold__bar appbar">
          {onDetail && (
            <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Back to Invoices" onClick={() => appNav!.onNavigate(appNav!.highlight)}><Icon name="chevL" /></button>
          )}
          <span className="appbar__title">{m.barTitle}</span>
          {!appNav && m.nav === 'topbar' && (
            <nav className="shc__bar-links" aria-label={`${m.title} navigation`}>
              {m.navItems.map((it, i) => (
                <button key={it.label} type="button" className={`tab ${i === active ? 'tab--on' : ''}`} onClick={() => setActive(i)}>{it.label}</button>
              ))}
            </nav>
          )}
          <span className="appbar__spacer" />
          {appNav ? (
            // Topbar built from REAL atoms — the searchinput, a notification button
            // with a count badge, and a photo avatar that opens a real .menu.
            <>
              <div className="searchinput shc__topsearch" role="search">
                <Icon name="search" />
                <input className="searchinput__field" type="search" placeholder="Search invoices, clients…" aria-label="Search Ledger" />
              </div>
              <button type="button" className="btn btn--ghost btn--icon btn--sm shc__bellbtn" aria-label="Notifications, 2 unread">
                <Icon name="bell" />
                <span className="badge badge--solid-primary badge--count">2</span>
              </button>
              <div className="shc__acct">
                <button type="button" className="shc__acctbtn" aria-haspopup="menu" aria-expanded={acctOpen} aria-label="Account menu" onClick={() => setAcctOpen((o) => !o)}>
                  <span className="avatar avatar--sm" aria-hidden="true">
                    <img className="avatar__img" src="https://randomuser.me/api/portraits/women/68.jpg" alt="" loading="lazy" />
                  </span>
                </button>
                {acctOpen && (
                  <div className="menu shc__acctmenu" role="menu">
                    <div className="menu__label">Priya Nair · Acme, Inc.</div>
                    <button type="button" className="menu__item" role="menuitem"><Icon name="home" /> Profile</button>
                    <button type="button" className="menu__item" role="menuitem"><Icon name="cog" /> Settings <span className="menu__shortcut">⌘,</span></button>
                    <div className="menu__sep" />
                    <button type="button" className="menu__item" role="menuitem"><Icon name="upload" /> Sign out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Search"><Icon name="search" /></button>
              <span className="avatar avatar--sm">A</span>
            </>
          )}
        </div>
        {appNav ? (
          // The ONE Ledger side menu — the REAL `.sidenav` component (brand header,
          // `.nav-group` labels, `.navrow` rows, a `.badge--count`, a pinned
          // `.sidenav__foot`, and the `--rail` collapse), driving the screen.
          <div className="scaffold__nav">
            <LedgerSidebar appNav={appNav} pickable={pickable} />
          </div>
        ) : m.nav === 'suite' && (
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
        <div className="scaffold__body" onClick={onBodyClick}>
          {m.panes.map((pane, i) => (
            <section className={`${PANE_CLASS[pane.role]} shc__pane`} key={i} aria-label={`${m.title} ${pane.role} pane`}>
              {pane.sections.map((b, j) =>
                pickable ? (
                  <div className="shc__pick" key={j} data-pane={i} data-idx={j} data-label={sectionInfo(b.kind).label}>
                    {renderSectionFn(b, j)}
                  </div>
                ) : (
                  // key = the section's own index (unique among the pane's children);
                  // passing the PANE index here collided all sections onto one key,
                  // leaving a stale duplicate when Inspect re-wrapped them (Fase J-8).
                  renderSectionFn(b, j)
                ),
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

/** The Ledger app's side menu = the REAL exported `.sidenav` recipe (the same one
 *  the gallery's "Side navigation" card demos), driven by `appNav`. Screens bucket
 *  into `.nav-group` labels; `group:'footer'` pins to `.sidenav__foot`; a `badge`
 *  renders a `.badge--count`. The brand header carries the `--rail` collapse toggle. */
function LedgerSidebar({ appNav, pickable }: { appNav: AppNav; pickable: boolean }) {
  const [rail, setRail] = useState(false)
  const go = (id: string) => (pickable ? undefined : () => appNav.onNavigate(id))
  const groups: string[] = []
  for (const s of appNav.screens) if (s.group !== 'footer' && !groups.includes(s.group)) groups.push(s.group)
  const foot = appNav.screens.filter((s) => s.group === 'footer')
  const Row = (s: LedgerScreen) => (
    <button
      key={s.id}
      type="button"
      className={`navrow ${s.id === appNav.highlight ? 'navrow--on' : ''}`}
      data-tip={s.label}
      aria-label={s.label}
      aria-current={s.id === appNav.highlight ? 'page' : undefined}
      onClick={go(s.id)}
    >
      <Icon name={s.icon} />
      <span className="navrow__label">{s.label}</span>
      {s.badge && <span className="badge badge--solid-primary badge--count">{s.badge}</span>}
    </button>
  )
  return (
    <nav className={`sidenav ${rail ? 'sidenav--rail' : ''}`} aria-label="Ledger">
      <div className="sidenav__brand">
        <span className="sidenav__icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="6" height="6" rx="1.8" />
            <rect x="9" y="1" width="6" height="6" rx="1.8" />
            <rect x="1" y="9" width="6" height="6" rx="1.8" />
            <rect x="9" y="9" width="6" height="6" rx="1.8" />
          </svg>
        </span>
        <span className="sidenav__name">Ledger</span>
        <button
          type="button"
          className="sidenav__toggle"
          aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={rail}
          data-tip="Expand"
          onClick={() => setRail((r) => !r)}
        >
          <Icon name={rail ? 'chevR' : 'chevL'} />
        </button>
      </div>
      {groups.map((g) => (
        <Fragment key={g}>
          <div className="nav-group">{g}</div>
          {appNav.screens.filter((s) => s.group === g).map(Row)}
        </Fragment>
      ))}
      <div className="sidenav__foot">
        {foot.map(Row)}
        <button type="button" className="navrow" data-tip="Quick actions" aria-label="Quick actions">
          <span className="kbd">⌘K</span>
          <span className="navrow__label">Quick actions</span>
        </button>
      </div>
    </nav>
  )
}

/* The WALL — the loupe entry: every Ledger screen as a live, scaled miniature,
 * themed by the user's kit (re-theme-everywhere, visible). Click a tile and it
 * macOS-Mission-Control-zooms up to fill (View Transitions). The first of the
 * nested zoom levels: wall → screen → section/atom (the existing loupe drill). */
function ShowcaseWall({ onPick }: { onPick: (id: string, el: HTMLElement) => void }) {
  // 3-up grid that FILLS the stage width. The miniatures scale fixed-1200px
  // design content into a fluid column, so the scale must track the live column
  // width — measure it (ResizeObserver) and feed --tw (the column px). 8 screens
  // + a "more soon" placeholder = a clean 3×3.
  const gridRef = useRef<HTMLDivElement>(null)
  const [tw, setTw] = useState(384)
  useLayoutEffect(() => {
    const el = gridRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => { const w = el.clientWidth; if (w > 0) setTw(Math.floor((w - 24 * 2) / 3)) }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className="shc-wall">
      <div className="shc-wall__head">
        <div>
          <div className="shc-wall__eyebrow">Showcase · live</div>
          <h2 className="shc-wall__title">Ledger</h2>
        </div>
        <p className="shc-wall__sub">{LEDGER_SCREENS.length} screens, one product — all themed by your kit. Click a screen to zoom in.</p>
      </div>
      <div className="shc-wall__grid" ref={gridRef} style={{ ['--tw' as string]: tw } as CSSProperties}>
        {LEDGER_SCREENS.map((s) => {
          const sm = SHOWCASES.find((x) => x.id === s.id)
          if (!sm) return null
          const tileNav: AppNav = { screens: LEDGER_SCREENS, current: s.id, highlight: s.id, onNavigate: () => {} }
          return (
            <button type="button" className="shc-wall__tile" key={s.id} onClick={(e) => onPick(s.id, e.currentTarget)} aria-label={`Open ${s.label}`}>
              <div className="shc-wall__frame">
                <div className="shc-wall__mini" aria-hidden="true">
                  <ShowcaseShell m={sm} width={1200} appNav={tileNav} />
                </div>
              </div>
              <span className="shc-wall__cap"><Icon name={s.icon} /> {s.label}</span>
            </button>
          )
        })}
        {/* 9th cell — the empty slot, filled later (another app archetype). */}
        <div className="shc-wall__tile shc-wall__tile--empty" aria-hidden="true">
          <div className="shc-wall__frame shc-wall__frame--empty"><span>More soon</span></div>
        </div>
      </div>
    </div>
  )
}

export function PagesView({ cfg, onViewChange }: { cfg: Config; onViewChange: (v: ViewKind) => void }) {
  // Showcases = ONE believable product (Ledger). The WALL is the entry (every
  // screen as a live miniature); clicking a tile zooms IN to the single screen +
  // its sidebar (Catalyst-style). `screenId` is the rendered manifest (may be a
  // detail like the invoice, reached by clicking an invoice row); `entered`
  // toggles wall ↔ screen. The sidebar still drives screen switches once inside.
  const [screenId, setScreenId] = useState(LEDGER_SCREENS[0]!.id)
  const [entered, setEntered] = useState(false)
  // `zooming` names .shc--app ONLY during the wall↔screen morph, so the inner
  // section/atom zooms (which reuse the `shc-zoom` name) never collide with it.
  const [zooming, setZooming] = useState(false)
  // Width lives here (the app level) so it survives screen switches — ShowcaseStage
  // still remounts per screen (key) to reset the loupe, but reads width from here.
  const [width, setWidth] = useState(1200)
  const m = SHOWCASES.find((s) => s.id === screenId)!
  const appNav: AppNav = {
    screens: LEDGER_SCREENS,
    current: screenId,
    highlight: LEDGER_DETAIL_PARENT[screenId] ?? screenId,
    onNavigate: setScreenId,
  }

  // View Transitions = the macOS-style shared-element zoom. The clicked tile and
  // the entered stage share one `view-transition-name`, so the browser morphs the
  // tile up to fill. Graceful no-op on browsers without the API.
  type VTDoc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<unknown> } }
  const enterScreen = (id: string, el: HTMLElement) => {
    const mutate = () => { setScreenId(id); setEntered(true) }
    const doc = document as VTDoc
    if (!doc.startViewTransition) { mutate(); return }
    el.style.viewTransitionName = 'shc-zoom'; setZooming(true)
    doc.startViewTransition(() => flushSync(mutate)).finished.finally(() => { el.style.viewTransitionName = ''; setZooming(false) })
  }
  const exitToWall = () => {
    const doc = document as VTDoc
    if (!doc.startViewTransition) { setEntered(false); return }
    setZooming(true)
    doc.startViewTransition(() => flushSync(() => setEntered(false))).finished.finally(() => setZooming(false))
  }

  if (!entered) return <div className="lyt shc shc--wall"><ShowcaseWall onPick={enterScreen} /></div>

  return (
    <div className="lyt shc shc--app" style={{ viewTransitionName: zooming ? 'shc-zoom' : undefined } as CSSProperties}>
      <button type="button" className="btn btn--ghost btn--sm shc__back" onClick={exitToWall}>
        <Icon name="chevL" /> All screens
      </button>
      {/* key = remount per screen so the loupe + width reset to the screen default */}
      <ShowcaseStage m={m} cfg={cfg} key={m.id} onViewChange={onViewChange} appNav={appNav} width={width} onWidth={setWidth} />
    </div>
  )
}
