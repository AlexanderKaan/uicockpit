import { useState, type CSSProperties, type ReactNode } from 'react'
import { Icon } from '../icons/Icon'
import { ChartFrame } from '../stage/views/ChartFrame'
import { useModal, useDropdown, Toggle, MenuButton } from '../stage/views/apps/AppHelpers'
import type { SectionSpec } from './manifests'
import { BrandLogo } from './logos'

/** Map a file's ext/image flag to a `.filegrid__cover` type variant so the
 *  cover paints the right faux preview (document page / image / spreadsheet). */
function coverKind(ext: string, image?: boolean): 'doc' | 'img' | 'sheet' | null {
  if (image) return 'img'
  const e = ext.toUpperCase()
  if (e === 'XLS' || e === 'XLSX' || e === 'CSV') return 'sheet'
  if (e === 'PDF' || e === 'DOC' || e === 'DOCX' || e === 'TXT') return 'doc'
  return null
}

/** The Documents vault — the real `.filegrid` tiles; clicking a tile opens the real
 *  `.lightbox` preview (modal contract via useModal; arrow keys cycle files). */
function FileGridSection({ title, files }: { title: string; files: Array<{ name: string; ext: string; size: string; date?: string; tone: 'success' | 'danger' | 'warn' | 'info'; image?: boolean }> }) {
  const [open, setOpen] = useState<number | null>(null)
  const lbRef = useModal<HTMLDivElement>(open !== null, () => setOpen(null))
  const n = files.length
  const f = open !== null ? files[open]! : null
  const fKind = f ? coverKind(f.ext, f.image) : null
  return (
    <div className="section">
      <div className="section__head"><div className="section__titles"><span className="section__title">{title}</span></div></div>
      <div className="section__body">
        <div className="filegrid filegrid--3">
          {files.map((file, i) => {
            const kind = coverKind(file.ext, file.image)
            return (
              <button key={file.name} type="button" className="filegrid__tile" onClick={() => setOpen(i)}>
                <div className={`filegrid__cover${kind ? ` filegrid__cover--${kind}` : ''}`}>
                  <span className={`filegrid__tag badge badge--${file.tone}`}>{file.ext}</span>
                  {!kind && <Icon name="file" />}
                </div>
                <div className="filegrid__body">
                  <span className="filegrid__name">{file.name}</span>
                  <span className="filegrid__meta">{file.size}{file.date ? ` · ${file.date}` : ''}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
      {f && open !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="File preview"
          ref={lbRef}
          tabIndex={-1}
          onClick={() => setOpen(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); setOpen((open + n - 1) % n) }
            else if (e.key === 'ArrowRight') { e.preventDefault(); setOpen((open + 1) % n) }
          }}
        >
          <div className="lightbox__stage card" onClick={(e) => e.stopPropagation()} style={{ width: '46%', maxWidth: 520, display: 'grid', gap: 'var(--k-s-12)' }}>
            <div className={`filegrid__cover${fKind ? ` filegrid__cover--${fKind}` : ''}`} style={{ width: '100%' }}>
              {!fKind && <Icon name="file" />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--k-s-10)' }}>
              <span style={{ fontWeight: 'var(--k-weight-medium)' as CSSProperties['fontWeight'], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <span className={`badge badge--${f.tone}`}>{f.ext} · {f.size}</span>
            </div>
          </div>
          <button type="button" className="lightbox__btn lightbox__btn--close" onClick={() => setOpen(null)} aria-label="Close"><Icon name="x" /></button>
          <button type="button" className="lightbox__btn lightbox__btn--prev" onClick={(e) => { e.stopPropagation(); setOpen((open + n - 1) % n) }} aria-label="Previous"><Icon name="chevL" /></button>
          <button type="button" className="lightbox__btn lightbox__btn--next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % n) }} aria-label="Next"><Icon name="chevR" /></button>
          <div className="lightbox__count">{open + 1} / {n}</div>
        </div>
      )}
    </div>
  )
}

/** Per-row actions — the real `.menu` dropdown (kebab → View · Send reminder ·
 *  Duplicate · Delete). useDropdown gives the menu-button contract: outside-click
 *  + Escape close + focus-return. Crucially its outside-click listener also means
 *  opening one row's menu CLOSES any other that's open (the second kebab's
 *  mousedown lands outside the first menu) — so only one is ever open at a time.
 *  Only kit classes (.btn / .menu); positioning is inline LAYOUT (never structural). */
function RowMenu() {
  const { open, setOpen, ref } = useDropdown()
  // stopPropagation so a menu click doesn't trip the invoice row→detail handler.
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-haspopup="menu" aria-expanded={open} aria-label="Row actions" onClick={() => setOpen((o) => !o)}>
        <Icon name="dots" />
      </button>
      {open && (
        <div className="menu" role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 'var(--k-z-popover, 50)', minWidth: '11rem' }}>
          <button type="button" className="menu__item" role="menuitem" onClick={() => setOpen(false)}><Icon name="file" /> View</button>
          <button type="button" className="menu__item" role="menuitem" onClick={() => setOpen(false)}><Icon name="bell" /> Send reminder</button>
          <button type="button" className="menu__item" role="menuitem" onClick={() => setOpen(false)}><Icon name="plus" /> Duplicate</button>
          <div className="menu__sep" />
          <button type="button" className="menu__item menu__item--danger" role="menuitem" onClick={() => setOpen(false)}><Icon name="trash" /> Delete</button>
        </div>
      )}
    </div>
  )
}

/** Entity-card kebab — the real `.menu` dropdown on an `.entity-card__menu`
 *  trigger (keeps the card-head styling, gains a working menu via MenuButton). */
function CardMenu({ name }: { name: string }) {
  return (
    <MenuButton
      icon={<Icon name="dots" />}
      ariaLabel={`Actions for ${name}`}
      triggerClass="btn btn--ghost btn--icon btn--sm"
      wrapClass="entity-card__menu"
      align="right"
      items={[
        { label: 'View', icon: <Icon name="file" /> },
        { label: 'Send reminder', icon: <Icon name="bell" /> },
        { label: 'Duplicate', icon: <Icon name="plus" /> },
        { label: 'Delete', icon: <Icon name="trash" />, danger: true },
      ]}
    />
  )
}

/** A filterable `.datatable` BLOCK — the segctrl chips now DRIVE state: clicking
 *  a chip moves the active highlight AND filters rows whose status matches the
 *  label (case-insensitive). Broad/semantic labels with no exact row match
 *  ("Outstanding", "Active", "All") gracefully keep every row rather than
 *  emptying the table. head/row/foot are passed so each archetype keeps its own
 *  columns + pagination. */
function FilterTable<T extends { status: string }>({
  filters, activeInit, rows, ariaLabel, searchLabel, head, row, foot,
}: {
  filters: string[]
  activeInit: number
  rows: readonly T[]
  ariaLabel: string
  searchLabel: string
  head: ReactNode
  row: (r: T) => ReactNode
  foot: ReactNode
}) {
  const [active, setActive] = useState(activeInit)
  const label = (filters[active] ?? 'All').toLowerCase()
  const matched = active === 0 ? rows : rows.filter((r) => r.status.toLowerCase() === label)
  const visible = matched.length ? matched : rows
  return (
    <div className="datatable datatable--page">
      <div className="datatable__bar">
        <div className="toolbar toolbar--sm" style={{ flex: 1 }}>
          <div className="segctrl" role="tablist" aria-label={ariaLabel}>
            {filters.map((f, i) => (
              <button key={f} type="button" role="tab" aria-selected={i === active} className={`segctrl__btn ${i === active ? 'segctrl__btn--on' : ''}`} onClick={() => setActive(i)}>{f}</button>
            ))}
          </div>
          <span className="toolbar__spacer" />
          <div className="in in--inline" style={{ maxWidth: 200 }}>
            <Icon name="search" />
            <input type="search" aria-label={searchLabel} placeholder="Search…" />
          </div>
        </div>
      </div>
      <div className="datatable__body">
        <table className="tbl">
          <thead>{head}</thead>
          <tbody>{visible.map(row)}</tbody>
        </table>
      </div>
      {foot}
    </div>
  )
}

/** Inline trend hint — the real `.sparkline` recipe. A normalized polyline (the
 *  line) + a closed polygon (the tinted area), stretched to the tile width. */
function Sparkline({ data }: { data: number[] }) {
  const n = data.length
  const min = Math.min(...data)
  const span = Math.max(...data) - min || 1
  const pts = data.map((v, i) => `${(i / (n - 1)) * 100},${29 - ((v - min) / span) * 27}`).join(' ')
  return (
    <svg className="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <polygon className="sparkline__area" points={`${pts} 100,30 0,30`} />
      <polyline className="sparkline__path" points={pts} />
    </svg>
  )
}

/** Tabbed chart — a real `.tabs` strip switching between named ChartFrame views.
 *  The ChartFrame is keyed by the active tab so its draw-in animation replays. */
function ChartTabs({ tabs }: { tabs: Array<{ label: string; type: 'bar' | 'area' | 'line' | 'stacked'; labels: string[]; series: Array<{ name: string; values: number[] }> }> }) {
  const [active, setActive] = useState(0)
  const t = tabs[active]!
  return (
    <div className="card">
      <div className="card__head">
        <div className="tabs" role="tablist" aria-label="Report view">
          {tabs.map((tab, i) => (
            <button key={tab.label} type="button" role="tab" aria-selected={i === active} className={`tab ${i === active ? 'tab--on' : ''}`} onClick={() => setActive(i)}>{tab.label}</button>
          ))}
        </div>
      </div>
      <ChartFrame key={active} type={t.type} labels={t.labels} series={t.series} />
    </div>
  )
}

/** Breakdown — the real `.breakdown` share-bar list. Rows are sorted biggest-
 *  first and each bar's colour comes from the derived --k-chart-1..6 palette,
 *  so a breakdown beside a chart shares its legend ("made of what?"). */
function BreakdownSection({ title, unit, rows }: { title: string; unit?: string; rows: Array<{ name: string; value: number }> }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  const total = sorted.reduce((s, r) => s + r.value, 0) || 1
  return (
    <div className="card">
      <div className="card__head"><span className="card__title">{title}</span></div>
      <div className="breakdown">
        {sorted.map((r, i) => {
          const pct = Math.round((r.value / total) * 100)
          return (
            <div key={r.name} className="breakdown__row" style={{ '--bd-color': `var(--k-chart-${(i % 6) + 1})`, '--bd-pct': `${pct}%` } as CSSProperties}>
              <span className="breakdown__name"><span className="breakdown__label">{r.name}</span></span>
              <span className="breakdown__val">{unit ?? ''}{r.value.toLocaleString('en-US')}<span className="breakdown__pct">{pct}%</span></span>
              <div className="breakdown__track"><div className="breakdown__bar" /></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Photo avatar with a graceful initial fallback — the flagship's "real app"
 *  tell. Real portrait via .avatar__img; on load error, swap to the initial. */
function PhotoAvatar({ url, name, sm }: { url: string; name: string; sm?: boolean }) {
  return (
    <span className={`avatar ${sm ? 'avatar--sm' : ''}`} aria-hidden="true">
      <img
        className="avatar__img"
        src={url}
        alt=""
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget
          img.style.display = 'none'
          const host = img.parentElement
          if (host && !host.textContent) host.textContent = name.charAt(0)
        }}
      />
    </span>
  )
}

/** The summary band — the kit's .stat-tile-strip with the --fill modifier (cells
 *  take var(--k-surface-fill)). The ONE focal "state at a glance" zone per Ledger
 *  screen (flagship doctrine). Shared by every list screen so the band is ONE
 *  thing, never re-rolled. Label + delta on a row, value below — canonical
 *  .stat-tile sub-parts. */
function SummaryBand({ items }: { items: Array<{ label: string; value: string; delta?: string; up?: boolean }> }) {
  return (
    <div className="stat-tile-strip stat-tile-strip--fill">
      {items.map((k) => (
        <div className="stat-tile-strip__cell" key={k.label}>
          <div className="l-cluster" style={{ justifyContent: 'space-between', '--l-gap': 'var(--k-s-8)' } as CSSProperties}>
            <span className="stat-tile__label">{k.label}</span>
            {k.delta && <span className={`stat-tile__delta ${k.up ? 'stat-tile__delta--up' : 'stat-tile__delta--down'}`}>{k.delta}</span>}
          </div>
          <span className="stat-tile__value">{k.value}</span>
        </div>
      ))}
    </div>
  )
}

/** The screen-level header — the kit's `.page-head` SECTION recipe (eyebrow/title/
 *  sub + a trailing actions cluster). ONE helper so every Ledger screen opens the
 *  same way and the title type comes from `.page-head__title`, never a hand-rolled
 *  inline `font-size/weight/family` (the drift the section tier was built to kill). */
function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div className="page-head__titles">
        <h2 className="page-head__title">{title}</h2>
        {sub && <span className="page-head__sub">{sub}</span>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </div>
  )
}

/**
 * H3b — the section renderer: SectionSpec (data) → KIT recipes (markup).
 *
 * The deal that makes manifests honest: every renderer below composes
 * EXPORTED kit classes (plus the catalogued ChartFrame presenter) — no
 * showcase-only component CSS. If a section can't be built from the kit, the
 * kit is missing a recipe, and THAT is the bug to fix (gallery first), not
 * something to patch here. Seeds are typed by the SectionSpec union, so a
 * manifest typo fails tsc instead of rendering garbage.
 */
export function renderSection(spec: SectionSpec, key: number) {
  switch (spec.kind) {
    case 'stats':
      return (
        <div className="stat-tile-grid" key={key}>
          {spec.seed.items.map((s) => (
            <div className={'stat-tile' + (s.hero ? ' stat-tile--hero' : '')} key={s.label}>
              <div className="stat-tile__label">{s.label}</div>
              <div className="stat-tile__value">{s.value}</div>
              {s.delta && (
                <div className="stat-tile__foot">
                  <span className={`stat-tile__delta ${s.up ? 'stat-tile__delta--up' : 'stat-tile__delta--down'}`}>{s.delta}</span>
                </div>
              )}
              {s.spark && <Sparkline data={s.spark} />}
            </div>
          ))}
        </div>
      )
    case 'chart':
      return (
        <div className="card" key={key}>
          <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>
          <ChartFrame type={spec.seed.type} labels={spec.seed.labels} series={spec.seed.series} />
        </div>
      )
    case 'chartTabs':
      return <ChartTabs key={key} tabs={spec.seed.tabs} />
    case 'breakdown':
      return <BreakdownSection key={key} title={spec.seed.title} unit={spec.seed.unit} rows={spec.seed.rows} />
    case 'filegrid':
      return <FileGridSection key={key} title={spec.seed.title} files={spec.seed.files} />
    case 'list':
      return (
        <div className="card" key={key}>
          {spec.seed.title && <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>}
          <div className="list list--flush">
            {spec.seed.items.map((it) => (
              <button type="button" className="list__item" key={it.title}>
                {it.icon && <span className="list__lead list__lead--icon"><Icon name={it.icon} /></span>}
                <span className="list__body">
                  <span className="list__title">{it.title}</span>
                  {it.sub && <span className="list__sub">{it.sub}</span>}
                </span>
                <span className="list__trail">
                  {it.badge && <span className={`badge badge--${it.badge}`}>{it.badge === 'success' ? 'OK' : '!'}</span>}
                  {it.trail && <span className="list__trail--text">{it.trail}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )
    case 'thread':
      return (
        <div className="thread" key={key}>
          {spec.seed.messages.map((m, i) => (
            <div className={`msg ${m.me ? 'msg--me' : ''}`} key={i}>
              <div className="msg__head">
                {m.avatar && <span className={`avatar avatar--sm avatar--a${(i % 6) + 1}`} aria-hidden="true">{m.avatar}</span>}
                <span className="msg__name">{m.name}</span>
                <span className="msg__time">{m.time}</span>
              </div>
              {/* LP6 — the AI-furniture tier: the thinking line above the reply… */}
              {m.reasoning && (
                <details className="reasoning" style={{ marginBottom: 'var(--k-s-6)' }}>
                  <summary>
                    {m.reasoning.label} {m.reasoning.time && <span className="reasoning__time">{m.reasoning.time}</span>}
                    <span className="reasoning__chevron"><Icon name="chevD" /></span>
                  </summary>
                  {m.reasoning.body && <p className="reasoning__body">{m.reasoning.body}</p>}
                </details>
              )}
              {/* …the tool receipts between question and answer… */}
              {m.tools && m.tools.length > 0 && (
                <div style={{ display: 'grid', gap: 'var(--k-s-4)', marginBottom: 'var(--k-s-6)' }}>
                  {m.tools.map((t) => (
                    <details className={`tool-call tool-call--${t.status}`} key={t.name}>
                      <summary>
                        <span className="tool-call__name">{t.name}</span>
                        <span className="tool-call__meta">{t.meta}</span>
                        <span className="tool-call__status">{t.status === 'running' ? 'Running' : t.status === 'done' ? 'Done' : 'Failed'}</span>
                        <span className="tool-call__chevron"><Icon name="chevD" /></span>
                      </summary>
                      {t.result && <pre className="tool-call__body">{t.result}</pre>}
                    </details>
                  ))}
                </div>
              )}
              <p className="msg__body">{m.body}</p>
              {/* …and the source chips the answer is grounded on. */}
              {m.sources && m.sources.length > 0 && (
                <div className="cite-row">
                  {m.sources.map((s) => (
                    <a className="cite" href="#sources" key={s.n} onClick={(e) => e.preventDefault()}>
                      <span className="cite__n">{s.n}</span> {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )
    case 'composer':
      // CP6 — hero composer: the composer IS the hero (Raycast/Claude). A tall
      // multi-line field + a starter-prompt chip row + the one aimed Send action,
      // built from existing atoms (.tx / .chip / .btn). The thin toolbar stays the
      // default for inline message bars.
      if (spec.seed.hero) {
        return (
          <div className="card" key={key} style={{ gap: 'var(--k-s-10)' }}>
            {/* Greeting reads as a strong hero line, not a full-page display title —
                --k-type-h1 (≈30px) balances it against the composer below. */}
            {spec.seed.greeting && <h2 className="t-display" style={{ margin: 0, fontSize: 'var(--k-type-h1)' }}>{spec.seed.greeting}</h2>}
            {spec.seed.suggestions && spec.seed.suggestions.length > 0 && (
              <div className="card__row" style={{ flexWrap: 'wrap' }}>
                {spec.seed.suggestions.map((s) => <span className="chip" key={s}>{s}</span>)}
              </div>
            )}
            <textarea className="in tx" placeholder={spec.seed.placeholder} aria-label="Message" rows={3} />
            <div className="card__row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <button type="button" className="btn btn--ghost btn--sm"><Icon name="plus" /> Attach</button>
              <button type="button" className="btn btn--primary"><Icon name="chevR" /> Send</button>
            </div>
          </div>
        )
      }
      return (
        <div className="toolbar" key={key} style={{ marginTop: 'auto' }}>
          <input className="in" placeholder={spec.seed.placeholder} aria-label="Message" style={{ flex: 1 }} />
          <button type="button" className="btn btn--ghost btn--icon" aria-label="Attach"><Icon name="plus" /></button>
          <button type="button" className="btn btn--primary btn--icon" aria-label="Send"><Icon name="chevR" /></button>
        </div>
      )
    case 'calendar': {
      // CP6 Phase 3 — the month grid as the page hero (Cron/Fantastical). Wraps
      // the kit .calendar recipe + its cell modifiers; leading/trailing out-cells
      // pad the 6-week grid. Event days carry a single inline accent dot (the cell
      // is position:relative) — composition, no new class. today = ring, selected
      // = filled accent (the ONE aimed accent per the confident-pro brief).
      const { title, firstDow, days, today, selected, events = [] } = spec.seed
      const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
      const cells: Array<number | null> = []
      for (let i = 0; i < firstDow; i++) cells.push(null)
      for (let d = 1; d <= days; d++) cells.push(d)
      while (cells.length % 7 !== 0) cells.push(null)
      return (
        <div className="card" key={key}>
          <div className="calendar__nav">
            <span className="calendar__nav-title">{title}</span>
            <span className="calendar__nav-btns">
              <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Previous month"><Icon name="chevL" /></button>
              <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Next month"><Icon name="chevR" /></button>
            </span>
          </div>
          <div className="calendar">
            {DOW.map((d, i) => <span key={'h' + i} className="calendar__head">{d}</span>)}
            {cells.map((d, i) => {
              if (d === null) return <span key={i} className="calendar__cell calendar__cell--out" aria-hidden="true" />
              const cls = ['calendar__cell']
              if (d === selected) cls.push('calendar__cell--on')
              if (d === today) cls.push('calendar__cell--today')
              const dot = events.includes(d) && d !== selected
              return (
                <button type="button" key={i} className={cls.join(' ')} aria-current={d === today ? 'date' : undefined}>
                  {d}
                  {dot && <span aria-hidden="true" style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--k-primary)' }} />}
                </button>
              )
            })}
          </div>
        </div>
      )
    }
    case 'invoice': {
      const s = spec.seed
      const money: CSSProperties = { fontVariantNumeric: 'tabular-nums' }
      const muted: CSSProperties = { color: 'var(--k-fg-muted)', fontSize: 'var(--k-type-small)' }
      return (
        <div className="l-stack" key={key} style={{ '--l-gap': 'var(--k-s-16)' } as CSSProperties}>
          {/* Trail back to the list — the real .breadcrumb recipe. */}
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumb">
              <li><a href="#">Ledger</a></li>
              <li aria-hidden="true"><Icon name="chevR" /></li>
              <li><a href="#">Invoices</a></li>
              <li aria-hidden="true"><Icon name="chevR" /></li>
              <li><span aria-current="page">#{s.number}</span></li>
            </ol>
          </nav>

          {/* Header: client mark + invoice no. + the ONE aimed action (Send) */}
          <div className="l-cluster" style={{ justifyContent: 'space-between', '--l-gap': 'var(--k-s-12)' } as CSSProperties}>
            <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-12)' } as CSSProperties}>
              <BrandLogo id={s.clientLogo} size={44} />
              <div className="l-stack" style={{ '--l-gap': 'var(--k-s-2)' } as CSSProperties}>
                <span style={muted}>Invoice #{s.number}</span>
                <span style={{ fontSize: 'var(--k-type-h3)', fontWeight: 'var(--k-weight-semibold)' as CSSProperties['fontWeight'], fontFamily: 'var(--k-font-display)' }}>{s.client}</span>
              </div>
            </div>
            <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-8)' } as CSSProperties}>
              <button type="button" className="btn btn--ghost btn--sm">Copy URL</button>
              <button type="button" className="btn btn--ghost btn--sm">Edit</button>
              <button type="button" className="btn btn--primary btn--sm"><Icon name="chevR" /> Send</button>
            </div>
          </div>

          {/* Document (wide) + rail (narrow) */}
          <div className="l-sidebar" style={{ '--l-side': '19rem', '--l-gap': 'var(--k-s-16)' } as CSSProperties}>
            {/* ── The invoice document */}
            <div className="l-sidebar__main">
              <div className="card" style={{ padding: 'var(--k-s-32)' }}>
                <div className="l-stack" style={{ '--l-gap': 'var(--k-s-24)' } as CSSProperties}>
                  <div className="l-cluster" style={{ justifyContent: 'space-between', alignItems: 'flex-start' } as CSSProperties}>
                    <span style={{ fontSize: 'var(--k-type-h3)', fontWeight: 'var(--k-weight-semibold)' as CSSProperties['fontWeight'], fontFamily: 'var(--k-font-display)' }}>Invoice</span>
                    <span className="badge badge--success"><span className="badge__dot" />{s.status}</span>
                  </div>
                  <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-32)' } as CSSProperties}>
                    <div><div style={muted}>Issued on</div><div style={{ fontWeight: 'var(--k-weight-medium)' as CSSProperties['fontWeight'] }}>{s.issued}</div></div>
                    <div><div style={muted}>Due on</div><div style={{ fontWeight: 'var(--k-weight-medium)' as CSSProperties['fontWeight'] }}>{s.due}</div></div>
                  </div>
                  <hr className="sep" style={{ margin: 0 }} />
                  <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-48)', alignItems: 'flex-start' } as CSSProperties}>
                    <div className="l-stack" style={{ '--l-gap': 'var(--k-s-2)' } as CSSProperties}>
                      <span className="eyebrow">From</span>
                      <span style={{ fontWeight: 'var(--k-weight-semibold)' as CSSProperties['fontWeight'] }}>{s.fromName}</span>
                      {s.fromLines.map((l) => <span key={l} style={muted}>{l}</span>)}
                    </div>
                    <div className="l-stack" style={{ '--l-gap': 'var(--k-s-2)' } as CSSProperties}>
                      <span className="eyebrow">To</span>
                      <span style={{ fontWeight: 'var(--k-weight-semibold)' as CSSProperties['fontWeight'] }}>{s.toName}</span>
                      {s.toLines.map((l) => <span key={l} style={muted}>{l}</span>)}
                    </div>
                  </div>
                  <table className="tbl">
                    <thead><tr><th>Project</th><th className="num">Hours</th><th className="num">Rate</th><th className="num">Price</th></tr></thead>
                    <tbody>
                      {s.items.map((it) => (
                        <tr key={it.title}>
                          <td><div style={{ fontWeight: 'var(--k-weight-medium)' as CSSProperties['fontWeight'] }}>{it.title}</div><div style={muted}>{it.desc}</div></td>
                          <td className="num" style={money}>{it.hours}</td>
                          <td className="num" style={money}>{it.rate}</td>
                          <td className="num" style={money}>{it.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="l-cluster" style={{ justifyContent: 'flex-end' } as CSSProperties}>
                    <div className="l-stack" style={{ '--l-gap': 'var(--k-s-8)', minWidth: '15rem' } as CSSProperties}>
                      <div className="l-cluster" style={{ justifyContent: 'space-between' } as CSSProperties}><span style={muted}>Subtotal</span><span style={money}>{s.subtotal}</span></div>
                      <div className="l-cluster" style={{ justifyContent: 'space-between' } as CSSProperties}><span style={muted}>Tax</span><span style={money}>{s.tax}</span></div>
                      <hr className="sep" style={{ margin: 0 }} />
                      <div className="l-cluster" style={{ justifyContent: 'space-between' } as CSSProperties}><span style={{ fontWeight: 'var(--k-weight-semibold)' as CSSProperties['fontWeight'] }}>Total</span><span style={{ ...money, fontWeight: 'var(--k-weight-semibold)' as CSSProperties['fontWeight'] }}>{s.total}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── The rail: amount + live activity */}
            <div className="l-sidebar__side l-stack" style={{ '--l-gap': 'var(--k-s-16)' } as CSSProperties}>
              <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--k-surface-sunken)' }}>
                <div className="l-stack" style={{ '--l-gap': 'var(--k-s-4)', padding: 'var(--k-s-20)' } as CSSProperties}>
                  <span style={muted}>Amount</span>
                  <div className="l-cluster" style={{ justifyContent: 'space-between', alignItems: 'baseline' } as CSSProperties}>
                    <span style={{ ...money, fontSize: 'var(--k-type-display)', fontWeight: 'var(--k-weight-bold)' as CSSProperties['fontWeight'], lineHeight: 1 }}>{s.amount}</span>
                    <span className="badge badge--success"><span className="badge__dot" />{s.status}</span>
                  </div>
                </div>
                <hr className="sep" style={{ margin: 0 }} />
                <div className="l-stack" style={{ '--l-gap': 'var(--k-s-12)', padding: 'var(--k-s-20)' } as CSSProperties}>
                  <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-10)' } as CSSProperties}><PhotoAvatar url={s.payerAvatar} name={s.payer} sm /><span style={{ fontWeight: 'var(--k-weight-medium)' as CSSProperties['fontWeight'] }}>{s.payer}</span></div>
                  <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-10)' } as CSSProperties}><Icon name="cal" /><span>{s.paidDate}</span></div>
                  <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-10)' } as CSSProperties}><Icon name="card" /><span>{s.method}</span></div>
                </div>
                <hr className="sep" style={{ margin: 0 }} />
                <button type="button" className="btn btn--link" style={{ margin: 'var(--k-s-16) var(--k-s-20)' }}>Download receipt <Icon name="chevR" /></button>
              </div>

              <div className="card">
                <div className="card__head"><span className="card__title">Activity</span></div>
                <ol className="timeline">
                  {s.activity.map((a, i) => (
                    <li className="timeline__item" key={i}>
                      <span className="timeline__dot" style={{ padding: 0, overflow: 'hidden' }}><PhotoAvatar url={a.avatar} name={a.name} sm /></span>
                      <div className="timeline__body">
                        <div className="timeline__head">
                          <span className="timeline__title"><strong>{a.name}</strong> <span style={muted}>{a.action}</span></span>
                          <span className="timeline__time">{a.time}</span>
                        </div>
                        {a.comment && <div className="timeline__desc" style={{ marginTop: 'var(--k-s-6)', background: 'var(--k-surface-sunken)', padding: 'var(--k-s-10) var(--k-s-12)', borderRadius: 'var(--k-radius-md)' }}>{a.comment}</div>}
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="toolbar" style={{ marginTop: 'var(--k-s-8)' }}>
                  <PhotoAvatar url={s.meAvatar} name="You" sm />
                  <input className="in" placeholder="Add your comment…" aria-label="Add a comment" style={{ flex: 1 }} />
                  <button type="button" className="btn btn--primary btn--sm">Comment</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
    case 'cashflow': {
      const s = spec.seed
      const money: CSSProperties = { fontVariantNumeric: 'tabular-nums' }
      const muted: CSSProperties = { color: 'var(--k-fg-muted)', fontSize: 'var(--k-type-small)' }
      const semib = 'var(--k-weight-semibold)' as CSSProperties['fontWeight']
      const med = 'var(--k-weight-medium)' as CSSProperties['fontWeight']
      const hairline = 'var(--k-hairline, 1px solid var(--k-border))'
      const dirIcon = { in: 'check', out: 'upload', over: 'bell' } as const
      const dirTone = { in: 'var(--k-success)', out: 'var(--k-fg-muted)', over: 'var(--k-warning)' } as const
      return (
        <div className="l-stack" key={key} style={{ '--l-gap': 'var(--k-s-20)' } as CSSProperties}>
          {/* Overdue alert — the real .banner recipe carrying the one status that
              wants the screen's attention (numbers match the Overdue KPI below). */}
          <div className="banner banner--warn" role="status">
            <Icon name="bell" />
            <div className="banner__body">
              <strong>3 invoices are overdue</strong> — $12,787.00 past due. <a className="banner__link" href="#">Send reminders</a>
            </div>
          </div>

          {/* Header: title · period segmented · the one aimed action */}
          <div className="l-cluster" style={{ justifyContent: 'space-between' } as CSSProperties}>
            <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-16)' } as CSSProperties}>
              <span style={{ fontSize: 'var(--k-type-h3)', fontWeight: semib, fontFamily: 'var(--k-font-display)' }}>Cashflow</span>
              <div className="segctrl">
                <button type="button" className="segctrl__btn segctrl__btn--on">Last 7 days</button>
                <button type="button" className="segctrl__btn">Last 30 days</button>
                <button type="button" className="segctrl__btn">All-time</button>
              </div>
            </div>
            <button type="button" className="btn btn--primary"><Icon name="plus" /> New invoice</button>
          </div>

          {/* KPI strip = the SUMMARY BAND (shared SummaryBand → .stat-tile-strip--fill).
              The one focal "state at a glance" zone; working surfaces below stay white. */}
          <SummaryBand items={s.kpis} />

          {/* Recent activity — grouped transaction feed */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 'var(--k-s-16) var(--k-s-20)' }}><span className="card__title">Recent activity</span></div>
            {s.groups.map((g) => (
              <div key={g.when}>
                <div style={{ padding: 'var(--k-s-6) var(--k-s-20)', background: 'var(--k-surface-sunken)', fontSize: 'var(--k-type-eyebrow)', fontWeight: semib, letterSpacing: 'var(--k-track-eyebrow)', textTransform: 'uppercase', color: 'var(--k-fg-muted)', borderTop: hairline }}>{g.when}</div>
                {g.rows.map((r, i) => (
                  <div key={i} className="l-cluster" style={{ justifyContent: 'space-between', padding: 'var(--k-s-12) var(--k-s-20)', borderTop: hairline, '--l-gap': 'var(--k-s-16)' } as CSSProperties}>
                    <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-12)', flex: '1 1 16rem' } as CSSProperties}>
                      <span style={{ display: 'inline-grid', placeItems: 'center', width: '2rem', height: '2rem', borderRadius: '50%', flex: 'none', color: dirTone[r.dir], background: `color-mix(in srgb, ${dirTone[r.dir]} 14%, transparent)` }}><Icon name={dirIcon[r.dir]} /></span>
                      <div>
                        <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-8)' } as CSSProperties}><span style={{ ...money, fontWeight: med }}>{r.amount}</span><span className={`badge badge--${r.tone}`}>{r.status}</span></div>
                        <div style={muted}>{r.tax} tax</div>
                      </div>
                    </div>
                    <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-10)', flex: '1 1 12rem' } as CSSProperties}>
                      {r.partyLogo && <BrandLogo id={r.partyLogo} size={28} />}
                      <div><div style={{ fontWeight: med }}>{r.party}</div><div style={muted}>{r.desc}</div></div>
                    </div>
                    <div style={{ textAlign: 'right', flex: 'none' }}>
                      <button type="button" className="btn btn--link btn--sm" style={{ padding: 0 }}>View transaction</button>
                      <div style={muted}>Invoice {r.invoice}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Recent clients — a .section region of .entity-card tiles (the kit
              recipes finally consumed; was a hand-rolled card header + .sep + rows) */}
          <div className="section">
            <div className="section__head">
              <div className="section__titles"><span className="section__title">Recent clients</span></div>
              <div className="section__actions"><button type="button" className="btn btn--link btn--sm" style={{ padding: 0 }}>View all</button></div>
            </div>
            <div className="section__body">
              <div className="bento" style={{ '--bento-min': '15rem' } as CSSProperties}>
                {s.clients.map((c) => (
                  <div key={c.name} className="entity-card">
                    <div className="entity-card__head">
                      <BrandLogo id={c.logo} size={36} />
                      <span className="entity-card__name">{c.name}</span>
                      <CardMenu name={c.name} />
                    </div>
                    <div className="entity-card__meta">
                      <div className="entity-card__row"><span className="entity-card__label">Last invoice</span><span className="entity-card__value">{c.lastInvoice}</span></div>
                      <div className="entity-card__row"><span className="entity-card__label">Amount</span><span className="l-cluster" style={{ '--l-gap': 'var(--k-s-8)' } as CSSProperties}><span style={{ ...money, fontWeight: med }}>{c.amount}</span><span className={`badge badge--${c.tone}`}>{c.status}</span></span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }
    case 'invoices': {
      const s = spec.seed
      const money: CSSProperties = { fontVariantNumeric: 'tabular-nums' }
      const muted: CSSProperties = { color: 'var(--k-fg-muted)', fontSize: 'var(--k-type-small)' }
      const med = 'var(--k-weight-medium)' as CSSProperties['fontWeight']
      return (
        <div className="l-stack" key={key} style={{ '--l-gap': 'var(--k-s-20)' } as CSSProperties}>
          <PageHead title="Invoices" sub={s.subtitle} actions={<>
            <button type="button" className="btn btn--ghost btn--sm"><Icon name="upload" /> Export</button>
            <button type="button" className="btn btn--primary btn--sm"><Icon name="plus" /> New invoice</button>
          </>} />

          {/* Summary band = the ONE Fill zone (shared SummaryBand). Working
              surfaces below stay --k-surface. */}
          <SummaryBand items={s.summary} />

          {/* The list — the .datatable BLOCK (page tier: rows grow to natural
              height). Filter bar in the __bar, pagination in the __foot. */}
          <FilterTable
            filters={s.filters} activeInit={s.activeFilter} rows={s.rows}
            ariaLabel="Filter invoices" searchLabel="Search invoices"
            head={<tr><th className="tbl__col--frozen">Invoice</th><th>Client</th><th>Issued</th><th>Due</th><th className="num">Amount</th><th>Status</th><th aria-label="Actions" /></tr>}
            row={(r) => (
              <tr key={r.number}>
                <td className="tbl__col--frozen"><div style={{ fontWeight: med }}>#{r.number}</div><div style={muted}>{r.project}</div></td>
                <td>
                  <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-10)' } as CSSProperties}>
                    <BrandLogo id={r.clientLogo} size={28} />
                    <span style={{ fontWeight: med }}>{r.client}</span>
                  </div>
                </td>
                <td style={muted}>{r.issued}</td>
                <td style={muted}>{r.due}</td>
                <td className="num" style={{ ...money, fontWeight: med }}>{r.amount}</td>
                <td><span className={`badge badge--${r.tone}`}><span className="badge__dot" />{r.status}</span></td>
                <td style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap' }}><RowMenu /></td>
              </tr>
            )}
            foot={<div className="datatable__foot">
              <span className="datatable__foot-info">{s.footInfo}</span>
              <div className="pagination">
                <button type="button" disabled aria-label="Previous"><Icon name="chevL" /></button>
                <button type="button" aria-current="true">1</button>
                <button type="button">2</button>
                <button type="button">3</button>
                <button type="button" aria-label="Next"><Icon name="chevR" /></button>
              </div>
            </div>}
          />
        </div>
      )
    }
    case 'clients': {
      const s = spec.seed
      const money: CSSProperties = { fontVariantNumeric: 'tabular-nums' }
      const med = 'var(--k-weight-medium)' as CSSProperties['fontWeight']
      return (
        <div className="l-stack" key={key} style={{ '--l-gap': 'var(--k-s-20)' } as CSSProperties}>
          <PageHead title="Clients" sub={s.subtitle} actions={<>
            <button type="button" className="btn btn--ghost btn--sm"><Icon name="upload" /> Export</button>
            <button type="button" className="btn btn--primary btn--sm"><Icon name="plus" /> Add client</button>
          </>} />

          <SummaryBand items={s.summary} />

          <FilterTable
            filters={s.filters} activeInit={s.activeFilter} rows={s.rows}
            ariaLabel="Filter clients" searchLabel="Search clients"
            head={<tr><th className="tbl__col--frozen">Client</th><th>Contact</th><th className="num">Billed</th><th className="num">Outstanding</th><th>Status</th><th aria-label="Actions" /></tr>}
            row={(r) => (
              <tr key={r.company}>
                <td className="tbl__col--frozen">
                  <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-10)' } as CSSProperties}>
                    <BrandLogo id={r.logo} size={28} />
                    <span style={{ fontWeight: med }}>{r.company}</span>
                  </div>
                </td>
                <td>
                  <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-8)' } as CSSProperties}>
                    <PhotoAvatar url={r.contactAvatar} name={r.contact} sm />
                    <span>{r.contact}</span>
                  </div>
                </td>
                <td className="num" style={money}>{r.billed}</td>
                <td className="num" style={{ ...money, fontWeight: med }}>{r.outstanding}</td>
                <td><span className={`badge badge--${r.tone}`}><span className="badge__dot" />{r.status}</span></td>
                <td style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap' }}><RowMenu /></td>
              </tr>
            )}
            foot={<div className="datatable__foot">
              <span className="datatable__foot-info">{s.footInfo}</span>
              <div className="pagination">
                <button type="button" disabled aria-label="Previous"><Icon name="chevL" /></button>
                <button type="button" aria-current="true">1</button>
                <button type="button">2</button>
                <button type="button" aria-label="Next"><Icon name="chevR" /></button>
              </div>
            </div>}
          />
        </div>
      )
    }
    case 'expenses': {
      const s = spec.seed
      const money: CSSProperties = { fontVariantNumeric: 'tabular-nums' }
      const muted: CSSProperties = { color: 'var(--k-fg-muted)', fontSize: 'var(--k-type-small)' }
      const med = 'var(--k-weight-medium)' as CSSProperties['fontWeight']
      return (
        <div className="l-stack" key={key} style={{ '--l-gap': 'var(--k-s-20)' } as CSSProperties}>
          <PageHead title="Expenses" sub={s.subtitle} actions={<>
            <button type="button" className="btn btn--ghost btn--sm"><Icon name="upload" /> Export</button>
            <button type="button" className="btn btn--primary btn--sm"><Icon name="plus" /> Add expense</button>
          </>} />

          <SummaryBand items={s.summary} />

          {/* Budget burn — the real .usage meter (numbers match the "vs budget" KPI). */}
          <div className="usage usage--warn">
            <div className="usage__head">
              <span className="usage__title">March budget</span>
              <span className="usage__pct">$30,156.00 of $34,000.00 (88%)</span>
            </div>
            <div className="usage__bar" role="progressbar" aria-valuenow={88} aria-valuemin={0} aria-valuemax={100} aria-label="March budget">
              <div className="usage__fill" style={{ width: '88%' }} />
            </div>
            <div className="usage__foot">
              <span className="usage__hint">12 days left in the period</span>
              <button type="button" className="btn btn--ghost btn--sm">Adjust budget</button>
            </div>
          </div>

          <FilterTable
            filters={s.filters} activeInit={s.activeFilter} rows={s.rows}
            ariaLabel="Filter expenses" searchLabel="Search expenses"
            head={<tr><th className="tbl__col--frozen">Vendor</th><th>Category</th><th>Date</th><th className="num">Amount</th><th>Status</th><th aria-label="Actions" /></tr>}
            row={(r) => (
              <tr key={r.vendor + r.date}>
                <td className="tbl__col--frozen">
                  <div className="l-cluster" style={{ '--l-gap': 'var(--k-s-10)' } as CSSProperties}>
                    <BrandLogo id={r.logo} size={28} />
                    <span style={{ fontWeight: med }}>{r.vendor}</span>
                  </div>
                </td>
                <td><span className="badge badge--info">{r.category}</span></td>
                <td style={muted}>{r.date}</td>
                <td className="num" style={{ ...money, fontWeight: med }}>{r.amount}</td>
                <td><span className={`badge badge--${r.tone}`}><span className="badge__dot" />{r.status}</span></td>
                <td style={{ textAlign: 'right', width: '1%', whiteSpace: 'nowrap' }}><RowMenu /></td>
              </tr>
            )}
            foot={<div className="datatable__foot">
              <span className="datatable__foot-info">{s.footInfo}</span>
              <div className="pagination">
                <button type="button" disabled aria-label="Previous"><Icon name="chevL" /></button>
                <button type="button" aria-current="true">1</button>
                <button type="button">2</button>
                <button type="button" aria-label="Next"><Icon name="chevR" /></button>
              </div>
            </div>}
          />
        </div>
      )
    }
    case 'proof': {
      // KIT-COVERAGE-AUDIT — the page-assembly proof. Each archetype is built
      // PURELY by stacking section recipes (page-head/section/entity-card) +
      // component fillers. Composes kit recipes only (provenance-clean); proves
      // "you can build almost any page from the kit".
      const a = spec.seed.archetype
      const money: CSSProperties = { fontVariantNumeric: 'tabular-nums' }
      const med = 'var(--k-weight-medium)' as CSSProperties['fontWeight']
      const head = (eyebrow: string, title: string, sub: string) => (
        <div className="page-head page-head--bordered">
          <div className="page-head__titles">
            <span className="page-head__eyebrow">{eyebrow}</span>
            <h2 className="page-head__title">{title}</h2>
            <span className="page-head__sub">{sub}</span>
          </div>
          <div className="page-head__actions">
            <button type="button" className="btn btn--ghost btn--sm"><Icon name="upload" /> Export</button>
            <button type="button" className="btn btn--primary btn--sm"><Icon name="plus" /> New</button>
          </div>
        </div>
      )
      const entity = (name: string, amount: string, status: string, tone: string, fill?: boolean) => (
        <div className={`entity-card ${fill ? 'entity-card--fill' : ''}`}>
          <div className="entity-card__head"><span className="avatar avatar--sm" aria-hidden="true">{name.charAt(0)}</span><span className="entity-card__name">{name}</span><CardMenu name={name} /></div>
          <div className="entity-card__meta">
            <div className="entity-card__row"><span className="entity-card__label">Amount</span><span className="entity-card__value" style={money}>{amount}</span></div>
            <div className="entity-card__row"><span className="entity-card__label">Status</span><span className={`badge badge--${tone}`}><span className="badge__dot" />{status}</span></div>
          </div>
        </div>
      )
      let body: ReactNode = null
      if (a === 'list') body = (<>
        {head('Billing', 'Invoices', '24 invoices · 3 overdue')}
        <div className="datatable datatable--page">
          <div className="datatable__bar"><div className="toolbar toolbar--sm" style={{ flex: 1 }}>
            <div className="segctrl"><button type="button" className="segctrl__btn segctrl__btn--on">All</button><button type="button" className="segctrl__btn">Overdue</button><button type="button" className="segctrl__btn">Paid</button></div>
            <span className="toolbar__spacer" /><div className="in in--inline" style={{ maxWidth: 200 }}><Icon name="search" /><input type="search" aria-label="Search" placeholder="Search…" /></div>
          </div></div>
          <div className="datatable__body"><table className="tbl">
            <thead><tr><th>Invoice</th><th>Client</th><th className="num">Amount</th><th>Status</th></tr></thead>
            <tbody>{([['#00012', 'Reform', '$7,600.00', 'Paid', 'success'], ['#00009', 'Tuple, Inc', '$2,000.00', 'Overdue', 'danger'], ['#00010', 'SavvyCal', '$14,000.00', 'Paid', 'success']]).map((r, i) => (
              <tr key={i}><td style={{ fontWeight: med }}>{r[0]}</td><td>{r[1]}</td><td className="num" style={money}>{r[2]}</td><td><span className={`badge badge--${r[4]}`}><span className="badge__dot" />{r[3]}</span></td></tr>
            ))}</tbody>
          </table></div>
        </div>
      </>)
      else if (a === 'detail') body = (<>
        {head('Invoice #00011', 'Tuple, Inc', 'Issued Jan 23 · due Jan 31')}
        <div className="l-sidebar" style={{ '--l-side': '17rem', '--l-gap': 'var(--k-s-16)' } as CSSProperties}>
          <div className="l-sidebar__main"><div className="section">
            <div className="section__head"><div className="section__titles"><h3 className="section__title">Line items</h3></div></div>
            <div className="section__body"><table className="tbl"><thead><tr><th>Project</th><th className="num">Price</th></tr></thead><tbody>
              <tr><td>Logo redesign</td><td className="num" style={money}>$2,000.00</td></tr><tr><td>Website redesign</td><td className="num" style={money}>$5,200.00</td></tr>
            </tbody></table></div>
          </div></div>
          <div className="l-sidebar__side l-stack" style={{ '--l-gap': 'var(--k-s-16)' } as CSSProperties}>
            {entity('Alex Curren', '$10,560.00', 'Paid', 'success', true)}
            <div className="section"><div className="section__head"><div className="section__titles"><h3 className="section__title">Activity</h3></div></div><div className="section__body">
              <ol className="timeline"><li className="timeline__item"><span className="timeline__dot"><Icon name="check" /></span><div className="timeline__body"><div className="timeline__head"><span className="timeline__title">Invoice sent</span><span className="timeline__time">6d</span></div></div></li><li className="timeline__item timeline__item--current"><span className="timeline__dot"><span className="timeline__pulse" /></span><div className="timeline__body"><div className="timeline__head"><span className="timeline__title">Paid</span><span className="timeline__time">1d</span></div></div></li></ol>
            </div></div>
          </div>
        </div>
      </>)
      else if (a === 'dashboard') body = (<>
        {head('Ledger', 'Home', 'March 2026')}
        <SummaryBand items={[{ label: 'Revenue', value: '$405,091', delta: '+4.75%', up: true }, { label: 'Overdue', value: '$12,787', delta: '+54%', up: false }, { label: 'Outstanding', value: '$245,988', delta: '−1.4%', up: false }]} />
        <div className="section">
          <div className="section__head"><div className="section__titles"><h3 className="section__title">Recent clients</h3></div><div className="section__actions"><button type="button" className="btn btn--link btn--sm">View all</button></div></div>
          <div className="section__body"><div className="bento">{entity('Tuple, Inc', '$2,000.00', 'Overdue', 'danger')}{entity('SavvyCal', '$14,000.00', 'Paid', 'success')}{entity('Reform', '$7,600.00', 'Paid', 'success')}</div></div>
        </div>
      </>)
      else if (a === 'settings') body = (<>
        {head('Account', 'Settings', 'Manage your organization')}
        <div className="section"><div className="section__head"><div className="section__titles"><h3 className="section__title">Organization</h3></div></div><div className="section__body">
          <label className="lab"><span>Company name</span><input className="in" defaultValue="Acme, Inc." /></label>
          <label className="lab"><span>Billing email</span><input className="in" defaultValue="finance@acme.io" /></label>
        </div></div>
        <div className="section"><div className="section__head"><div className="section__titles"><h3 className="section__title">Notifications</h3></div></div><div className="section__body">
          <div className="list list--settings">
            <div className="list__item"><div className="list__body"><div className="list__title">Billing receipts</div><div className="list__sub">Email a receipt after every payment.</div></div><Toggle defaultOn label="Billing receipts" /></div>
            <div className="list__item"><div className="list__body"><div className="list__title">Usage alerts</div><div className="list__sub">Warn me before I hit a plan limit.</div></div><Toggle label="Usage alerts" /></div>
          </div>
        </div></div>
      </>)
      else if (a === 'feed') body = (<>
        {head('Workspace', 'Activity', 'Latest events')}
        <div className="section"><div className="section__head"><div className="section__titles"><h3 className="section__title">This week</h3></div></div><div className="section__body">
          <ol className="timeline">
            <li className="timeline__item"><span className="timeline__dot"><Icon name="check" /></span><div className="timeline__body"><div className="timeline__head"><span className="timeline__title">Chelsea sent invoice #00011</span><span className="timeline__time">6d</span></div></div></li>
            <li className="timeline__item"><span className="timeline__dot"><Icon name="check" /></span><div className="timeline__body"><div className="timeline__head"><span className="timeline__title">Alex paid invoice #00011</span><span className="timeline__time">1d</span></div></div></li>
          </ol>
        </div></div>
      </>)
      else body = (<>
        {head('Billing', 'Invoices', 'Nothing here yet')}
        <div className="card"><div className="empty"><div className="empty__icon"><Icon name="file" /></div><div className="empty__title">No invoices yet</div><div className="empty__sub">Create your first invoice to get started.</div><button type="button" className="btn btn--primary btn--sm"><Icon name="plus" /> New invoice</button></div></div>
      </>)
      return (
        <div className="l-stack" key={key} style={{ '--l-gap': 'var(--k-s-10)' } as CSSProperties}>
          <span style={{ fontSize: 'var(--k-type-eyebrow)', fontWeight: 'var(--k-weight-semibold)' as CSSProperties['fontWeight'], letterSpacing: 'var(--k-track-eyebrow)', textTransform: 'uppercase', color: 'var(--k-fg-faint)' }}>{spec.seed.label}</span>
          <div className="card" style={{ padding: 'var(--k-s-24)', background: 'var(--k-bg)' }}>
            <div className="l-stack" style={{ '--l-gap': 'var(--k-s-20)' } as CSSProperties}>{body}</div>
          </div>
        </div>
      )
    }
    case 'empty':
      // CP6 — end-of-feed / no-results state (the memorable Things 3 / Spotify
      // close). Wraps the existing .empty recipe; one quiet CTA, never a brand fill.
      return (
        <div className="card" key={key}>
          <div className="empty">
            <div className="empty__icon"><Icon name={spec.seed.icon} /></div>
            <div className="empty__title">{spec.seed.title}</div>
            <div className="empty__sub">{spec.seed.sub}</div>
            {spec.seed.cta && <button type="button" className="btn btn--secondary btn--sm">{spec.seed.cta}</button>}
          </div>
        </div>
      )
    case 'table':
      return (
        <div className="card" key={key}>
          {spec.seed.title && <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>}
          <table className="tbl">
            <thead>
              <tr>{spec.seed.columns.map((c, j) => {
                const cls = [spec.seed.numericCols?.includes(j) && 'num', spec.seed.sortableCols?.includes(j) && 'is-sortable'].filter(Boolean).join(' ')
                return <th key={c} className={cls || undefined}>{c}</th>
              })}</tr>
            </thead>
            <tbody>
              {spec.seed.rows.map((r, i) => (
                <tr key={i}>{r.map((cell, j) => {
                  // CP6 P5 — stage pills inherit a per-value tone (the Attio/Salesforce
                  // legibility tell); owner cells lead with an initialed avatar atom.
                  const tone = spec.seed.badgeCols?.includes(j) ? spec.seed.badgeToneByValue?.[cell] : undefined
                  return (
                    <td key={j} className={spec.seed.numericCols?.includes(j) ? 'num' : undefined}>
                      {spec.seed.badgeCols?.includes(j)
                        ? <span className={'badge' + (tone ? ' badge--' + tone : '')}>{cell}</span>
                        : spec.seed.avatarCols?.includes(j)
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--k-s-6)' }}><span className={`avatar avatar--sm avatar--a${(i % 6) + 1}`} aria-hidden="true">{cell.slice(0, 1)}</span>{cell}</span>
                          : cell}
                    </td>
                  )
                })}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'form':
      return (
        <div className="card" key={key}>
          <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>
          {spec.seed.intro && <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: 0 }}>{spec.seed.intro}</p>}
          {spec.seed.fields.map((f) => (
            <label className="lab" key={f.label}>
              <span>{f.label}</span>
              <input className="in" defaultValue={f.value} placeholder={f.placeholder} />
            </label>
          ))}
          <div className="card__foot card__foot--bar" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn--ghost">Cancel</button>
            <button type="button" className="btn btn--primary">{spec.seed.submit}</button>
          </div>
        </div>
      )
    case 'pricing':
      return (
        <div className="pricing" key={key}>
          {spec.seed.tiers.map((t) => (
            <div className={`pricing__tier ${t.featured ? 'pricing__tier--featured' : ''}`} key={t.name}>
              {t.featured && <span className="pricing__badge">Popular</span>}
              <div className="pricing__name">{t.name}</div>
              <div className="pricing__price"><span className="pricing__amount">{t.price}</span><span className="pricing__period">{t.period}</span></div>
              <ul className="pricing__feats">
                {t.feats.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <button type="button" className={`btn ${t.featured ? 'btn--primary' : 'btn--outline'} btn--block`}>{t.cta}</button>
            </div>
          ))}
        </div>
      )
    case 'prose': {
      // CP6 — prose has two registers. Default = an article column (changelog,
      // docs). hero = the landing headline: the display tier on a --k-canvas band
      // (Site's gradient-identity signature) with one aimed CTA pair. Both are
      // pure atoms — .t-display + --k-canvas token + .btn — so zero new classes.
      const article = (
        <article className="prose l-center">
          {spec.seed.kicker && <div className="prose__kicker">{spec.seed.kicker}</div>}
          {spec.seed.hero ? <h1 className="t-display">{spec.seed.title}</h1> : <h2>{spec.seed.title}</h2>}
          {spec.seed.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          {spec.seed.ctas && spec.seed.ctas.length > 0 && (
            <div className="card__row" style={{ justifyContent: 'center', marginTop: 'var(--k-s-8)', flexWrap: 'wrap' }}>
              {spec.seed.ctas.map((c, i) => (
                <button type="button" className={'btn ' + (i === 0 ? 'btn--primary' : 'btn--secondary')} key={c}>{c}</button>
              ))}
            </div>
          )}
        </article>
      )
      if (!spec.seed.hero) return <div key={key}>{article}</div>
      return (
        <div key={key} style={{ background: 'var(--k-canvas)', border: '1px solid var(--k-border)', borderRadius: 'var(--k-radius-lg)', padding: 'clamp(var(--k-s-24), 6vw, var(--k-s-32))', textAlign: 'center', animation: 'var(--k-anim-rise)' }}>
          {article}
        </div>
      )
    }
    case 'dl':
      return (
        <div className="card" key={key}>
          {spec.seed.title && <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>}
          <dl className="dl">
            {spec.seed.pairs.map(([dt, dd]) => (
              <span key={dt} style={{ display: 'contents' }}>
                <dt>{dt}</dt>
                <dd>{dd}</dd>
              </span>
            ))}
          </dl>
        </div>
      )
    case 'chips':
      return (
        <div className="card__row" key={key} role="radiogroup" aria-label={spec.seed.label} style={{ flexWrap: 'wrap' }}>
          {spec.seed.options.map((o, i) => (
            <button type="button" role="radio" aria-checked={i === spec.seed.active} className={`chip ${i === spec.seed.active ? 'chip--on' : ''}`} key={o}>{o}</button>
          ))}
        </div>
      )
    case 'kanban':
      return (
        <div className="kanban" key={key}>
          {spec.seed.columns.map((col) => (
            <div className="kanban__col" key={col.name}>
              <div className="kanban__col-head">{col.name}<span className="kanban__count">{col.cards.length}</span></div>
              {col.cards.map((c) => (
                <div className="kanban__card" key={c.title}>
                  <span className="kanban__card-title">{c.title}</span>
                  {c.tag && <span className="kanban__tag">{c.tag}</span>}
                  <div className="kanban__card-foot">
                    <span className="kanban__stats">
                      {c.key && <span className="kanban__key"><Icon name="file" size={14} /> {c.key}</span>}
                      {c.pts && <span className="kanban__pts">{c.pts}</span>}
                    </span>
                    {c.avatar && <span className="avatar avatar--sm" style={{ width: 22, height: 22, fontSize: 9 }}>{c.avatar}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )
    case 'tree':
      return (
        <div className="card" key={key}>
          <div className="tree" role="tree" aria-label={spec.seed.label ?? 'Navigation'}>
            {spec.seed.groups.map((g) => (
              <div className="tree__group" key={g.name}>
                <div className="tree__row">
                  <span className="tree__chev"><Icon name="chevR" size={13} /></span>
                  <span className="tree__icon"><Icon name="grid" size={13} /></span>
                  {g.name}
                </div>
                <div className="tree__group">
                  {g.items.map((it) => (
                    <div className={`tree__row ${it.on ? 'tree__row--on' : ''}`} key={it.title}>
                      <span className="tree__chev tree__chev--leaf"><Icon name="chevR" size={13} /></span>
                      <span className="tree__icon"><Icon name="file" size={13} /></span>
                      {it.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    case 'timeline':
      return (
        <div className="card" key={key}>
          <ol className="timeline">
            {spec.seed.events.map((e) => (
              <li className={`timeline__item ${e.state ? `timeline__item--${e.state}` : ''}`} key={e.title}>
                <span className="timeline__dot">{e.state === 'current' ? <span className="timeline__pulse" /> : <Icon name="check" />}</span>
                <div className="timeline__body">
                  <div className="timeline__head"><span className="timeline__title">{e.title}</span><span className="timeline__time">{e.time}</span></div>
                  {e.desc && <div className="timeline__desc">{e.desc}</div>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )
    case 'settings':
      return (
        <div className="card" key={key}>
          {spec.seed.title && <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>}
          <div className="list list--settings">
            {spec.seed.rows.map((r) => (
              <div className="list__item" key={r.title}>
                <div className="list__body"><div className="list__title">{r.title}</div><div className="list__sub">{r.sub}</div></div>
                <Toggle defaultOn={r.on} label={r.title} />
              </div>
            ))}
          </div>
        </div>
      )
    case 'wizard':
      return (
        <div className="card" key={key}>
          <div className="stepper">
            {spec.seed.steps.map((label, i) => (
              <div className={`stepper__step ${i < spec.seed.active ? 'stepper__step--done' : ''} ${i === spec.seed.active ? 'stepper__step--current' : ''}`} key={label}>
                <span className="stepper__dot">{i < spec.seed.active ? <Icon name="check" /> : i + 1}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="wstepper__content">
            <div className="wstepper__title">{spec.seed.title}</div>
            {spec.seed.sub && <div className="wstepper__sub">{spec.seed.sub}</div>}
            <input className="in" placeholder="…" aria-label={spec.seed.title} />
          </div>
          <div className="card__foot">
            <button type="button" className="btn btn--ghost">Back</button>
            <button type="button" className="btn btn--primary">Continue</button>
          </div>
        </div>
      )
    case 'dropzone':
      return (
        <label className="dropzone" key={key}>
          <span className="dropzone__icon"><Icon name="upload" /></span>
          <span className="dropzone__title">{spec.seed.title}</span>
          <span className="dropzone__hint">{spec.seed.hint}</span>
          <input type="file" hidden multiple aria-label={spec.seed.title} />
        </label>
      )
    case 'media':
      return (
        <div className="card" key={key}>
          {spec.seed.title && <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>}
          {/* CP6 — hero cover(s): full-bleed 16:9 with a display-tier title overlay (the
              "asset/cover IS the UI" move). Real img when given, else the brand gradient. */}
          {spec.seed.items.filter((m) => m.hero).map((f, i) => (
            <div className="aspect aspect--16x9" key={'hero-' + f.name}>
              {f.img ? <img src={f.img} alt={f.name} /> : <div className="aspect__fill" style={{ background: `var(--k-grad-${(i % 6) + 1})` }} />}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 'var(--k-s-6)', padding: 'var(--k-space)', background: 'linear-gradient(to top, rgba(0,0,0,.62), transparent 62%)' }}>
                {f.badge && <span className={`badge badge--${f.tone ?? 'info'}`} style={{ alignSelf: 'flex-start' }}>{f.badge}</span>}
                <span className="t-display" style={{ color: '#fff' }}>{f.name}</span>
                {f.meta && <span style={{ color: 'rgba(255,255,255,.82)', fontSize: 'var(--k-type-small)' }}>{f.meta}</span>}
              </div>
            </div>
          ))}
          <div className="bento" style={{ '--bento-min': '7.5rem', '--k-gutter': 'var(--k-s-12)' } as CSSProperties}>
            {spec.seed.items.filter((m) => !m.hero).map((f, i) => (
              <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--k-s-8)' }}>
                <div className="aspect aspect--1x1">
                  {f.img ? <img src={f.img} alt={f.name} /> : (
                  <div className="aspect__fill" style={{ background: f.kind === 'image' ? `var(--k-grad-${(i % 4) + 1})` : 'var(--k-surface-sunken)', display: 'grid', placeItems: 'center', color: f.kind === 'image' ? 'var(--k-primary-fg, #fff)' : 'var(--k-fg-muted)' }}>
                    <Icon name={f.kind === 'image' ? 'grid' : f.kind === 'video' ? 'chart' : 'file'} size={22} />
                  </div>
                  )}
                </div>
                <div className="card__row" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <span style={{ fontSize: 'var(--k-type-small)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{f.name}</span>
                  {f.badge && <span className={`badge badge--${f.tone ?? 'info'}`} style={{ flex: 'none' }}>{f.badge}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
  }
}
