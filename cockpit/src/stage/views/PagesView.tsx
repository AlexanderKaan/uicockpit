import { Fragment, useState, useRef, useLayoutEffect, type MouseEvent as ReactMouseEvent, type ReactNode, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { Icon } from '../../icons/Icon'
import { SHOWCASES, LEDGER_SCREENS, LEDGER_DETAIL_PARENT, type SectionSpec, type ShowcaseManifest, type LedgerScreen } from '../../showcases/manifests'
import { renderSection } from '../../showcases/sections'

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

/**
 * Pages — the loupe (H3b manifest model · Fase J).
 *
 * A page is DATA: archetype × nav × panes of seeded sections (src/showcases/
 * manifests.ts), rendered through the same kit recipes the export ships. The view
 * is deliberately content-first (Fase J-7): chips → preview, with every control
 * pushed into a slim bottom dock or one click away. Inspect turns the preview into
 * a continuous zoom — Page › Section › Atom — with a breadcrumb spine.
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

function ShowcaseStage({ m, appNav, width, onWidth }: { m: ShowcaseManifest; appNav?: AppNav; width: number; onWidth: (w: number) => void }) {
  // Width is OWNED by the parent (the one app) so it PERSISTS across screen switches.
  const setWidth = onWidth
  // Fase J-9 — the showcase is a REAL, interactive app: the sidebar switches screens,
  // invoice rows open the detail, menus open. Inspecting a component's contract lives
  // in the Components tab now, so the two concerns never fight — no in-app drill or
  // selection overlay here, nothing masquerades as a component's selected state.
  const wc = width < 600 ? 'Compact' : width < 840 ? 'Medium' : width < 1200 ? 'Expanded' : width < 1600 ? 'Large' : 'Extra-large'
  // A `suite`-nav showcase morphs its navigation bar → rail → sidebar at the scaffold
  // container's 600/1200px breakpoints (the `@container scaffold` queries in recipes).
  const navState = m.nav === 'suite' ? (width < 600 ? 'Bottom bar' : width < 1200 ? 'Rail' : 'Sidebar') : null
  const caption = `${ARCH_LABEL[m.archetype] ?? m.archetype} · ${m.nav === 'suite' ? 'adaptive nav' : 'top nav'}`

  return (
    <>
      {/* A quiet caption — the showcase is a real, interactive app; inspect a
          component's contract over in the Components tab. */}
      <p className="shc__caption">{caption}</p>

      {/* The stage — the live, interactive app, centred on the canvas. */}
      <div className="lyt__stage shc__loupebody">
        <div className="shc__loupestage">
          <div className="shc__previewwrap">
            <ShowcaseShell m={m} width={width} appNav={appNav} />
          </div>
        </div>
      </div>

      {/* The dock — a slim bottom toolbar. Width on the left (the old header
       * scrubber, demoted); the actions on the right. Everything that used to
       * stack above the preview now lives here, out of the content's way. */}
      <div className="shc__dock">
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
      </div>
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

export function PagesView() {
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
      {/* key = remount per screen so per-screen state resets to the screen default */}
      <ShowcaseStage m={m} key={m.id} appNav={appNav} width={width} onWidth={setWidth} />
    </div>
  )
}
