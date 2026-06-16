import { useMemo, type CSSProperties } from 'react'
import type { Config } from '../tokens/types'
import { buildTokens } from '../tokens/buildTokens'
import { IconProvider, Icon } from '../icons/Icon'
import type { IconName } from '../icons/concepts'
import { StatusBadge } from '../stage/views/apps/AppHelpers'
import type { Content } from './extractContent'

/* Sandbox — the result BOARD, now COMPOSABLE. Instead of one fixed dashboard it
 * renders an ordered list of BLOCKS (the archetypes a real page is made of), each
 * as OUR exported recipe, themed by the live Config and filled with the user's
 * words. So "identify your blocks → show our version of each" — a domain-search
 * tool gets a search bar + tabs + filter chips + a data table; a dashboard gets a
 * sidebar + KPIs. Self-contained themed island (its own `.cockpit-preview`). */

/** The block vocabulary — each maps 1:1 to a kit recipe the detector can name. */
export type BlockKind =
  | 'sidebar'    // vertical nav rail (.sidenav)            — STRUCTURAL (left)
  | 'appbar'     // top app bar (.appbar)                    — STRUCTURAL (top, implicit)
  | 'toolbar'    // action cluster in the bar (.btn group)   — enhances the appbar
  | 'tabnav'     // horizontal tabs (.tab)                    — body
  | 'searchbar'  // prominent search field (.searchinput)    — body
  | 'filterbar'  // filter chips with counts (.chip+.badge)  — body
  | 'statstrip'  // KPI tiles (.stat-tile-strip)             — body
  | 'datatable'  // rows table (.tbl)                        — body
  | 'cardgrid'   // entity card grid (.card)                 — body
  | 'form'       // a small form (.field/.in)                — body

interface SandboxBoardProps {
  cfg: Config
  content: Content
  /** Ordered blocks to render. Omitted → a sensible dashboard default. */
  blocks?: BlockKind[]
}

const DEFAULT_BLOCKS: BlockKind[] = ['sidebar', 'appbar', 'statstrip', 'datatable']
/** Blocks that stack in the page body (everything but the structural sidebar/
 *  appbar/toolbar). Rendered in the DETECTED order so the layout follows the app. */
const BODY_KINDS = new Set<BlockKind>(['tabnav', 'searchbar', 'filterbar', 'statstrip', 'datatable', 'cardgrid', 'form'])
const NAV_ICONS: IconName[] = ['home', 'grid', 'chart', 'file', 'cal', 'cog']

const STATS = [
  { v: '12.4K', l: 'Active' }, { v: '$48.2K', l: 'Revenue' }, { v: '96%', l: 'Uptime' }, { v: '2.4s', l: 'Median' },
]
const ROWS: Array<{ name: string; status: string; tone: 'success' | 'warn' | 'info' }> = [
  { name: 'Acme Corp', status: 'Active', tone: 'success' },
  { name: 'Globex', status: 'Pending', tone: 'warn' },
  { name: 'Initech', status: 'Active', tone: 'success' },
  { name: 'Umbrella', status: 'Review', tone: 'info' },
]
const FILTERS = ['All', 'Active', 'Pending', 'Archived']
const COUNTS = [128, 64, 12, 41]

function BrandMark() {
  return (
    <span className="sidenav__icon" aria-hidden="true">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="6" height="6" rx="1.8" /><rect x="9" y="1" width="6" height="6" rx="1.8" />
        <rect x="1" y="9" width="6" height="6" rx="1.8" /><rect x="9" y="9" width="6" height="6" rx="1.8" />
      </svg>
    </span>
  )
}

export function SandboxBoard({ cfg, content, blocks }: SandboxBoardProps) {
  const tokens = useMemo(() => buildTokens(cfg), [cfg])
  const list = blocks?.length ? blocks : DEFAULT_BLOCKS
  const appName = content.appName || 'Your App'
  const menu = content.menu.length ? content.menu : ['Overview', 'Customers', 'Reports', 'Settings']
  const heading = content.heading || menu[0] || 'Dashboard'
  const primaryBtn = content.primaryBtn || 'New'

  const hasSidebar = list.includes('sidebar')
  const hasToolbar = list.includes('toolbar')
  const bodyBlocks = [...new Set(list)].filter((k) => BODY_KINDS.has(k))

  const renderBody = (k: BlockKind) => {
    switch (k) {
      case 'tabnav':
        return (
          <div className="sbx-tabrow" role="tablist" key={k} style={{ display: 'flex', gap: 'var(--k-s-4, 4px)', flexWrap: 'wrap' }}>
            {menu.map((t, i) => (
              <button key={t} type="button" role="tab" className={`tab ${i === 0 ? 'tab--on' : ''}`} aria-selected={i === 0}>
                <Icon name={NAV_ICONS[i % NAV_ICONS.length]!} /> {t}
              </button>
            ))}
          </div>
        )
      case 'searchbar':
        return (
          <div className="searchinput" role="search" key={k} style={{ maxWidth: 'none' }}>
            <Icon name="search" />
            <input className="searchinput__field" type="search" placeholder={`Search ${appName}…`} aria-label={`Search ${appName}`} />
          </div>
        )
      case 'filterbar':
        return (
          <div className="toolbar" key={k}>
            {FILTERS.map((f, i) => (
              <button key={f} type="button" className={`chip ${i === 0 ? 'chip--on' : ''}`}>
                {f} <span className="badge badge--count">{COUNTS[i]}</span>
              </button>
            ))}
          </div>
        )
      case 'statstrip':
        return (
          <div className="stat-tile-strip" key={k}>
            {STATS.map((s) => (
              <div className="stat-tile-strip__cell" key={s.l}>
                <div className="stat-tile__value">{s.v}</div>
                <div className="stat-tile__label">{s.l}</div>
              </div>
            ))}
          </div>
        )
      case 'datatable':
        return (
          <div className="card" key={k}>
            <div className="card__head"><h3 className="card__title">{heading}</h3></div>
            <table className="tbl">
              <thead><tr><th>Name</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.name}><td>{r.name}</td><td><StatusBadge tone={r.tone} label={r.status} /></td><td><Icon name="dots" /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'cardgrid':
        return (
          <div className="sbx-cardgrid" key={k} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--k-gap, 16px)' }}>
            {ROWS.map((r) => (
              <div className="card" key={r.name}>
                <div className="card__head"><h3 className="card__title">{r.name}</h3></div>
                <div className="card__row" style={{ justifyContent: 'space-between' }}>
                  <StatusBadge tone={r.tone} label={r.status} />
                  <button className="btn btn--ghost btn--sm">Open</button>
                </div>
              </div>
            ))}
          </div>
        )
      case 'form':
        return (
          <div className="card" key={k} style={{ maxWidth: 460 }}>
            <div className="card__head"><h3 className="card__title">{heading}</h3></div>
            <div className="field"><label className="field__label">Name</label><input className="in" placeholder="Acme Corp" /></div>
            <div className="field"><label className="field__label">Email</label><input className="in" placeholder="hi@acme.com" /></div>
            <div className="card__foot"><button className="btn btn--ghost btn--sm">Cancel</button><button className="btn btn--primary btn--sm">{primaryBtn}</button></div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="cockpit-preview sbx-board" style={tokens.vars as CSSProperties}>
      <IconProvider set={cfg.iconSet}>
        <div className="scaffold scaffold--workspace">
          <div className="scaffold__frame">
            {/* TOP BAR — sidebar layout shows the page heading; topnav shows the
                brand wordmark. Toolbar block adds actions; primary = their CTA. */}
            <div className="scaffold__bar appbar">
              {hasSidebar ? (
                <span className="appbar__title">{heading}</span>
              ) : (
                <span className="appbar__title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <BrandMark /> {appName}
                </span>
              )}
              <span className="appbar__spacer" />
              {hasToolbar && <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Notifications"><Icon name="bell" /></button>}
              <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Search"><Icon name="search" /></button>
              <button type="button" className="btn btn--primary btn--sm"><Icon name="plus" /> {primaryBtn}</button>
            </div>

            {/* SIDEBAR — the real `.sidenav`, wearing the brand + their nav. */}
            {hasSidebar && (
              <div className="scaffold__nav">
                <nav className="sidenav" aria-label={`${appName} navigation`}>
                  <div className="sidenav__brand"><BrandMark /><span className="sidenav__name">{appName}</span></div>
                  <div className="nav-group">Workspace</div>
                  {menu.map((label, i) => (
                    <button key={label} type="button" className={`navrow ${i === 0 ? 'navrow--on' : ''}`} data-tip={label} aria-current={i === 0 ? 'page' : undefined}>
                      <Icon name={NAV_ICONS[i % NAV_ICONS.length]!} /><span className="navrow__label">{label}</span>
                    </button>
                  ))}
                  <div className="sidenav__foot">
                    <button type="button" className="navrow" data-tip="Settings"><Icon name="cog" /><span className="navrow__label">Settings</span></button>
                  </div>
                </nav>
              </div>
            )}

            {/* BODY — the detected blocks, our recipes, in order. */}
            <div className="scaffold__body">
              <section className="pane" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--k-s-16)' }}>
                {bodyBlocks.length ? bodyBlocks.map(renderBody) : renderBody('datatable')}
              </section>
            </div>
          </div>
        </div>
      </IconProvider>
    </div>
  )
}
