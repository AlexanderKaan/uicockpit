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
  | 'summary'    // overview cards w/ label+value rows (.card+.dl) — body
  | 'datatable'  // rows table (.tbl)                        — body
  | 'list'       // feed / activity / transaction list (.list) — body
  | 'banner'     // info / notice strip (.banner)            — body
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
const BODY_KINDS = new Set<BlockKind>(['tabnav', 'searchbar', 'filterbar', 'statstrip', 'summary', 'datatable', 'list', 'banner', 'cardgrid', 'form'])
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

/** Guess a badge tone from a status cell's text (EN + a little NL), so a detected
 *  "Status" column reads like a real app table. Falls back to a neutral info tone. */
function statusTone(label: string): 'success' | 'warn' | 'info' {
  const s = label.toLowerCase()
  if (/(active|online|paid|done|live|approved|success|complete|delivered|actief|geleverd|voltooid|betaald)/.test(s)) return 'success'
  if (/(pending|review|processing|waiting|queued|onderweg|open|in behandeling|wacht|aangemeld)/.test(s)) return 'warn'
  return 'info'
}

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
  // Vision can now read the real table + KPIs; fall back to demo data when absent.
  const realStats = content.stats?.length ? content.stats : null
  const realCols = content.columns?.length ? content.columns : null
  const realRows = content.rows?.length ? content.rows : null
  const realFilters = content.filters?.length ? content.filters : null
  const realCards = content.cards?.length ? content.cards : null
  const realSummary = content.summary?.length ? content.summary : null
  const realFeed = content.feed?.length ? content.feed : null
  const navGroups = content.navGroups?.length ? content.navGroups : null
  const tableTitle = content.tableTitle || heading

  const hasSidebar = list.includes('sidebar')
  // The top bar always carries a search field; if the app ALSO has a prominent
  // body searchbar, drop the top one so there's only ONE search (no duplicate).
  const hasBodySearch = list.includes('searchbar')
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
      case 'filterbar': {
        // Real chips from vision when present; otherwise generic structural
        // placeholders — never fabricated counts (the old "All 128" was a lie).
        const chips = realFilters ?? FILTERS
        return (
          <div className="toolbar" key={k}>
            {chips.map((f, i) => (
              <button key={f} type="button" className={`chip ${i === 0 ? 'chip--on' : ''}`}>
                {f}
              </button>
            ))}
          </div>
        )
      }
      case 'statstrip': {
        const tiles = realStats ?? STATS.map((s) => ({ value: s.v, label: s.l }))
        return (
          <div className="stat-tile-strip" key={k}>
            {tiles.map((s, i) => (
              <div className="stat-tile-strip__cell" key={i}>
                <div className="stat-tile__value">{s.value}</div>
                <div className="stat-tile__label">{s.label}</div>
              </div>
            ))}
          </div>
        )
      }
      case 'summary': {
        // Overview cards (Bank / Invoices / Income) — each a .card with a head +
        // a .dl of label/value rows. Real cards from vision; else a default trio.
        const cards = realSummary ?? [
          { title: 'Balance', rows: [{ label: 'Available', value: '$24,500' }, { label: 'Pending', value: '$1,280' }] },
          { title: 'Invoices', rows: [{ label: 'Outstanding', value: '$7,233' }, { label: 'Overdue', value: '$2,787' }] },
          { title: 'Expenses', rows: [{ label: 'This month', value: '$4,120' }, { label: 'Budget left', value: '$3,844' }] },
        ]
        return (
          <div className="sbx-summary" key={k} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--k-gap, 16px)' }}>
            {cards.map((c, i) => (
              <div className="card" key={i}>
                <div className="card__head"><h3 className="card__title">{c.title}</h3></div>
                <dl className="dl">
                  {c.rows.map((r, ri) => (
                    <span key={ri} style={{ display: 'contents' }}>
                      <dt>{r.label}</dt><dd>{r.value}</dd>
                    </span>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )
      }
      case 'datatable': {
        // Real columns + rows from vision → render THEIR table; else demo data.
        if (realCols && realRows) {
          const statusIdx = realCols.findIndex((c) => /status|state|fase|stage|stadium/i.test(c))
          return (
            <div className="card" key={k}>
              <div className="card__head"><h3 className="card__title">{tableTitle}</h3></div>
              <table className="tbl">
                <thead><tr>{realCols.map((c, i) => <th key={i}>{c}</th>)}<th></th></tr></thead>
                <tbody>
                  {realRows.map((row, ri) => (
                    <tr key={ri}>
                      {realCols.map((_, ci) => {
                        const cell = row[ci] ?? ''
                        return <td key={ci}>{ci === statusIdx && cell ? <StatusBadge tone={statusTone(cell)} label={cell} /> : cell}</td>
                      })}
                      <td><Icon name="dots" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        return (
          <div className="card" key={k}>
            <div className="card__head"><h3 className="card__title">{tableTitle}</h3></div>
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
      }
      case 'list': {
        // A feed / activity / transaction list — the right answer for screens
        // that are a stream of rows (icon + title + sub + a trailing status or
        // amount), NOT a columnar grid. Prefer the dedicated `feed` entries; then
        // table rows; else demo.
        if (realFeed) {
          return (
            <div className="card" key={k}>
              {content.tableTitle && <div className="card__head"><h3 className="card__title">{content.tableTitle}</h3></div>}
              <div className="list">
                {realFeed.map((f, i) => (
                  <div className="list__item" key={i}>
                    <span className="avatar avatar--sm" aria-hidden="true">{(f.title.charAt(0) || '·').toUpperCase()}</span>
                    <div className="list__body">
                      <div className="list__title">{f.title}</div>
                      {f.sub && <div className="list__sub">{f.sub}</div>}
                    </div>
                    {f.status && <StatusBadge tone={statusTone(f.status)} label={f.status} />}
                    {f.amount && <span className="list__trail list__trail--text">{f.amount}</span>}
                  </div>
                ))}
              </div>
            </div>
          )
        }
        if (realCols && realRows) {
          const statusIdx = realCols.findIndex((c) => /status|state|fase|stage|stadium/i.test(c))
          const amountIdx = realCols.findIndex((c) => /amount|total|bedrag|price|sum|saldo|value|paid|due/i.test(c))
          const subIdx = realCols.findIndex((_, i) => i > 0 && i !== statusIdx && i !== amountIdx)
          return (
            <div className="card" key={k}>
              {tableTitle && <div className="card__head"><h3 className="card__title">{tableTitle}</h3></div>}
              <div className="list">
                {realRows.map((row, ri) => {
                  const title = row[0] || '—'
                  const sub = subIdx >= 0 ? (row[subIdx] ?? '') : ''
                  const status = statusIdx >= 0 ? (row[statusIdx] ?? '') : ''
                  const amount = amountIdx >= 0 ? (row[amountIdx] ?? '') : ''
                  return (
                    <div className="list__item" key={ri}>
                      <span className="avatar avatar--sm" aria-hidden="true">{title.charAt(0).toUpperCase()}</span>
                      <div className="list__body">
                        <div className="list__title">{title}</div>
                        {sub && <div className="list__sub">{sub}</div>}
                      </div>
                      {status && <StatusBadge tone={statusTone(status)} label={status} />}
                      {amount && <span className="list__trail list__trail--text">{amount}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }
        return (
          <div className="card" key={k}>
            <div className="list">
              {ROWS.map((r) => (
                <div className="list__item" key={r.name}>
                  <span className="avatar avatar--sm" aria-hidden="true">{r.name.charAt(0)}</span>
                  <div className="list__body"><div className="list__title">{r.name}</div><div className="list__sub">Updated recently</div></div>
                  <StatusBadge tone={r.tone} label={r.status} />
                </div>
              ))}
            </div>
          </div>
        )
      }
      case 'banner':
        return (
          <div className="banner banner--info" role="status" key={k}>
            <Icon name="bell" />
            <div className="banner__body">{content.notice || `New activity in ${appName}`}</div>
          </div>
        )
      case 'cardgrid': {
        // Real card titles from vision when present (meta = a plain subtitle, no
        // fabricated status tone); otherwise the demo tiles with status badges.
        const cards = realCards
          ? realCards.map((c) => ({ title: c.title, meta: c.meta, tone: null as null }))
          : ROWS.map((r) => ({ title: r.name, meta: r.status, tone: r.tone as typeof r.tone | null }))
        return (
          <div className="sbx-cardgrid" key={k} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--k-gap, 16px)' }}>
            {cards.map((c, i) => (
              <div className="card" key={i}>
                <div className="card__head"><h3 className="card__title">{c.title}</h3></div>
                <div className="card__row" style={{ justifyContent: 'space-between' }}>
                  {c.tone ? <StatusBadge tone={c.tone} label={c.meta} />
                    : <span style={{ color: 'var(--k-fg-muted)', fontSize: 'var(--k-type-small)' }}>{c.meta}</span>}
                  <button className="btn btn--ghost btn--sm">Open</button>
                </div>
              </div>
            ))}
          </div>
        )
      }
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
              {/* A real search field + account chip — the full app-shell top bar,
                  not just an icon. Composed from .searchinput + .avatar recipes.
                  Skipped when a body searchbar block exists (no double search). */}
              {hasBodySearch ? (
                <span className="appbar__spacer" />
              ) : (
                <div className="searchinput" role="search" style={{ flex: '1 1 auto', maxWidth: 380, marginInline: 'auto' }}>
                  <Icon name="search" />
                  <input className="searchinput__field" type="search" placeholder={`Search ${appName}…`} aria-label={`Search ${appName}`} />
                </div>
              )}
              <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Notifications"><Icon name="bell" /></button>
              <button type="button" className="btn btn--primary btn--sm"><Icon name="plus" /> {primaryBtn}</button>
              <span className="avatar avatar--sm" aria-hidden="true">{appName.charAt(0).toUpperCase()}</span>
            </div>

            {/* SIDEBAR — the real `.sidenav`, wearing the brand + their nav. */}
            {hasSidebar && (
              <div className="scaffold__nav">
                <nav className="sidenav" aria-label={`${appName} navigation`}>
                  <div className="sidenav__brand"><BrandMark /><span className="sidenav__name">{appName}</span></div>
                  {navGroups ? (
                    // Grouped nav — section header + its items (Overzicht › Feed…).
                    navGroups.map((g, gi) => (
                      <div key={g.label}>
                        <div className="nav-group">{g.label}</div>
                        {g.items.map((label, i) => {
                          const on = gi === 0 && i === 0
                          return (
                            <button key={label} type="button" className={`navrow ${on ? 'navrow--on' : ''}`} data-tip={label} aria-current={on ? 'page' : undefined}>
                              <Icon name={NAV_ICONS[(gi + i) % NAV_ICONS.length]!} /><span className="navrow__label">{label}</span>
                            </button>
                          )
                        })}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="nav-group">Workspace</div>
                      {menu.map((label, i) => (
                        <button key={label} type="button" className={`navrow ${i === 0 ? 'navrow--on' : ''}`} data-tip={label} aria-current={i === 0 ? 'page' : undefined}>
                          <Icon name={NAV_ICONS[i % NAV_ICONS.length]!} /><span className="navrow__label">{label}</span>
                        </button>
                      ))}
                    </>
                  )}
                  <div className="sidenav__foot">
                    <button type="button" className="navrow" data-tip="Settings"><Icon name="cog" /><span className="navrow__label">Settings</span></button>
                    <button type="button" className="navrow" data-tip="Collapse"><Icon name="chevL" /><span className="navrow__label">Collapse</span></button>
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
