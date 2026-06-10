import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement } from 'react'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/concepts'
import { useDropdown, InteractiveSlider, StatusBadge, DatePicker, MenuButton, useModal, ImgAvatar, Menubar, Resizable } from './apps/AppHelpers'
import { ChartFrame } from './ChartFrame'
import type { ChartType } from './ChartFrame'

export function ComponentGallery({ limit, tier }: { limit?: number; tier?: 'atom' | 'block' } = {}) {
  // Order strategy: highest brand-impact first, token-neutral utilities last.
  // Users should SEE the result of every token change without scrolling.
  const galleryRef = useRef<HTMLDivElement>(null)

  // Grid masonry — each card spans as many `grid-auto-rows` units as its
  // measured height needs, so portrait cards pack tightly while .card--wide
  // cards lie across two columns. Re-measures on resize + late content
  // (async icon loads, chart growth) via ResizeObserver. Also assigns
  // --card-i in row-major visual order for the entrance cascade.
  useLayoutEffect(() => {
    const root = galleryRef.current
    if (!root) return
    const cards = Array.from(root.querySelectorAll(':scope > .card')) as HTMLElement[]
    const layout = () => {
      // Read ROW (grid-auto-rows) + GAP (row gap) from the LIVE computed style so
      // the span math can never drift when the spacing tokens change (this bit us
      // once: the gallery gap moved to a token but the hardcoded GAP=18 stayed).
      const gs = getComputedStyle(root)
      const ROW = parseFloat(gs.gridAutoRows) || 1
      // Vertical gap is BAKED into the span (row-gap is 0): each card reserves
      // its height + VGAP trailing rows, so every vertical gap is EXACTLY VGAP
      // with no quantisation drift. VGAP = the column gutter, so H and V match.
      const VGAP = parseFloat(gs.columnGap) || 40
      for (const el of cards) {
        el.style.gridRowEnd = 'auto'
        const h = el.getBoundingClientRect().height
        el.style.gridRowEnd = `span ${Math.max(1, Math.ceil((h + VGAP) / ROW))}`
      }
      const positions = cards.map((el) => ({ el, top: el.offsetTop, left: el.offsetLeft }))
      positions.sort((a, b) => (Math.abs(a.top - b.top) > 8 ? a.top - b.top : a.left - b.left))
      positions.forEach((p, i) => p.el.style.setProperty('--card-i', String(i)))
    }
    layout()
    const ro = new ResizeObserver(layout)
    cards.forEach((c) => ro.observe(c))
    window.addEventListener('resize', layout)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', layout)
    }
  }, [])

  // The full wall as an array so callers can render just the first `limit`
  // cards. The marketing bouquet (hero) shows only the top of the wall, so it
  // passes a small limit and never mounts the ~80 cards below the fold; the app
  // passes no limit → the whole gallery renders. (Function components are
  // hoisted, so referencing them here before their declarations is fine.)
  // Each card carries its segment TIER (atom | block), mirroring the graph in
  // src/kit/segments.ts — so the 4-layer-ladder front-end can split the wall into
  // the Atoms view and the Blocks view. Cards that map 1:1 to a recipe take that
  // recipe's tier; composed / showcase / foundation-demo cards (StatGroup, Kanban,
  // Typography, LayoutPrimitives, …) are 'block'. Order is preserved so the no-tier
  // path (the marketing bouquet, `limit`-sliced) renders exactly as before.
  const CARDS: Array<readonly [() => ReactElement, 'atom' | 'block']> = [
    [FormCard, 'atom'], [ValidationCard, 'atom'], [StatCard, 'block'], [SwitchCard, 'atom'], [SelectionCard, 'atom'], [TableCard, 'atom'],
    [SliderCard, 'atom'], [SearchInputCard, 'atom'], [RadioCardCard, 'atom'], [ChartCard, 'block'], [DateCard, 'block'],
    [PasswordInputCard, 'atom'], [BannerCard, 'atom'], [PopoverCard, 'atom'], [NumberInputCard, 'atom'], [DataTableProCard, 'block'], [FormPanelCard, 'block'], [FilterBarCard, 'block'],
    [ComboboxCard, 'atom'], [DialogCard, 'block'], [KanbanCard, 'block'], [PhoneInputCard, 'atom'], [SelectCard, 'atom'], [SlotPickerCard, 'block'],
    [PricingCardCard, 'block'], [TagInputCard, 'atom'], [AvatarCard, 'atom'], [TabsCard, 'atom'], [DropzoneCard, 'block'], [TooltipCard, 'atom'],
    [CodeBlockCard, 'block'], [SheetCard, 'block'], [InputOtpCard, 'atom'], [DescriptionListCard, 'atom'], [HoverCardCard, 'atom'],
    [DateFieldCard, 'atom'], [ToolbarCard, 'atom'], [AlertDialogCard, 'block'], [TrendCard, 'block'],
    [CmdPaletteCard, 'block'], [DropdownMenuCard, 'atom'], [CarouselCard, 'block'], [ListCard, 'atom'],
    [LoginCard, 'block'], [StatGroupCard, 'block'], [ContextMenuCard, 'atom'], [SignupCard, 'block'], [TimelineCard, 'block'], [NavMenuCard, 'atom'],
    [PaginationCard, 'atom'], [TreeViewCard, 'block'], [NotificationCenterCard, 'block'], [NavCard, 'block'],
    [FileGridCard, 'block'], [AccordionCard, 'atom'], [SettingsRowCard, 'atom'], [AlertsCard, 'atom'],
    [BreadcrumbCard, 'atom'], [ProgressCard, 'atom'], [UsageMeterCard, 'block'], [InteractiveCardCard, 'atom'], [MenubarCard, 'block'], [ResizableCard, 'block'],
    [StatusPageCard, 'block'], [InboxFilterCard, 'block'], [SpinnerCard, 'atom'], [ToolbarRecipeCard, 'atom'], [SkeletonCard, 'atom'],
    [EmptyStateCard, 'block'], [InfoCardCard, 'block'], [ToastStackCard, 'block'], [LightboxCard, 'block'],
    [WizardStepperCard, 'block'], [DangerZoneCard, 'block'], [FaqCard, 'block'], [TwoColumnLayoutCard, 'block'],
    [AttachmentChipCard, 'atom'], [StepperCard, 'atom'], [ButtonGroupCard, 'atom'], [AspectRatioCard, 'atom'], [ScrollAreaCard, 'atom'],
  ]
  const filtered = tier ? CARDS.filter(([, t]) => t === tier) : CARDS
  const shown = limit ? filtered.slice(0, limit) : filtered

  // The Atoms view groups the bare atoms into bordered CATEGORY cards (like the
  // Foundations sections): the frame lives on the GROUP, so atoms get structure
  // without each looking like a standalone block. Covers all atom-tier cards.
  if (tier === 'atom') {
    return (
      <div className="gallery atomgroups" ref={galleryRef}>
        {ATOM_GROUPS.map(([name, comps]) => (
          <section className="card atomgroup" key={name}>
            <div className="atomgroup__head">
              <h3 className="atomgroup__title">{name}</h3>
              <span className="atomgroup__count">{comps.length}</span>
            </div>
            {/* Bare atoms inside (flattened via .gallery--workbench), quiet labels. */}
            <div className="atomgroup__items gallery--workbench">
              {comps.map((C, i) => <C key={i} />)}
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="gallery" ref={galleryRef}>
      {/* INTERLEAVED WALL — cards woven so a landscape (.card--wide) lands
          roughly every ~3rd slot for an even masonry rhythm (shadcn /create
          feel). `tier='block'` filters to the Blocks ladder view; no `tier`
          (the marketing bouquet) shows the full interleaved wall, `limit`-sliced. */}
      {shown.map(([C], i) => <C key={i} />)}
    </div>
  )
}

// Atom category taxonomy — every atom-tier card bucketed into a matching group.
// Order = how the groups read top-to-bottom; the masonry packs them by height.
const ATOM_GROUPS: ReadonlyArray<readonly [string, ReadonlyArray<() => ReactElement>]> = [
  ['Text inputs', [FormCard, SearchInputCard, PasswordInputCard, NumberInputCard, PhoneInputCard, InputOtpCard]],
  ['Pickers & selects', [DateFieldCard, ComboboxCard, SelectCard, TagInputCard]],
  ['Choice & toggles', [SwitchCard, SelectionCard, RadioCardCard, SliderCard]],
  ['Actions & menus', [ButtonsCard, ButtonGroupCard, ToolbarCard, ToolbarRecipeCard, DropdownMenuCard, ContextMenuCard]],
  ['Navigation', [TabsCard, NavMenuCard, BreadcrumbCard, PaginationCard, StepperCard]],
  ['Overlays & disclosure', [PopoverCard, TooltipCard, HoverCardCard, AccordionCard]],
  ['Feedback & status', [ValidationCard, BannerCard, AlertsCard, ProgressCard, SpinnerCard, SkeletonCard]],
  ['Data & content', [TableCard, ListCard, DescriptionListCard, SettingsRowCard, AttachmentChipCard, InteractiveCardCard, AvatarCard]],
  ['Layout utilities', [AspectRatioCard, ScrollAreaCard]],
]

/* ── Promoted dashboard widgets — formerly app-only (SupaDash), now first-class
 * gallery cards so the components page stays the single source of truth. They
 * reuse the same preview.css recipes the live app does. */
function UsageMeterCard() {
  return (
    <Card title="Monthly quota" desc="Usage meter — banded fill shifts to warning past 75%.">
      <div className="usage usage--warn">
        <div className="usage__head">
          <span className="usage__title">API calls — monthly quota</span>
          <span className="usage__pct">782,140 of 1,000,000 (78%)</span>
        </div>
        <div className="usage__bar" role="progressbar" aria-valuenow={78} aria-valuemin={0} aria-valuemax={100} aria-label="API calls — monthly quota"><div className="usage__fill" style={{ width: '78%' }} /></div>
        <div className="usage__foot">
          <span className="usage__hint">Resets in 9 days</span>
          <button className="btn btn--ghost btn--sm">Upgrade plan</button>
        </div>
      </div>
    </Card>
  )
}

function DangerZoneCard() {
  return (
    <Card title="Danger zone" desc="Destructive-action section — clearly fenced off.">
      <div className="dangerzone">
        <div className="dangerzone__head">Danger zone</div>
        <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', marginBottom: 12 }}>
          This deletes the workspace and all its data permanently.
        </p>
        <button className="btn btn--danger btn--sm">
          <Icon name="trash" /> Delete workspace
        </button>
      </div>
    </Card>
  )
}

/* Card = one slice of real interface (shadcn-style). `title` is a natural,
 * in-context heading (e.g. "Payout threshold", "Invite team") — NOT a
 * component-type label. `desc` is an optional muted subtitle, like shadcn's
 * CardDescription. Both are optional: a card may open straight into its UI
 * when a heading would feel bolted-on. (#202 volledig-shadcn sweep.) */
function Card({ title, desc, children, wide, xwide }: { title?: string; desc?: string; children: React.ReactNode; wide?: boolean; xwide?: boolean }) {
  return (
    <div className={`card${wide ? ' card--wide' : ''}${xwide ? ' card--xwide' : ''}`}>
      {(title || desc) && (
        <div className="card__head">
          {title && <div className="card__title">{title}</div>}
          {desc && <div className="card__desc">{desc}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

// Inline chevron used by Accordion + Sortable table headers. Stays in this file
// to avoid a new icon-system concept just for one rotation pattern.
function ChevronSvg({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

/* ===== shadcn/Radix gap fillers ===== *
 * Breadcrumb · Avatar · Accordion (standalone) · Carousel · Navigation menu ·
 * Context menu. The last three add new recipes (.carousel/.navmenu/.ctxmenu);
 * the first three compose existing primitives (.breadcrumb/.avatar/.accordion). */

function BreadcrumbCard() {
  return (
    <Card title="Breadcrumb" desc="Hierarchical path to the current page.">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="#">Home</a><Icon name="chevR" />
        <a href="#">Projects</a><Icon name="chevR" />
        <a href="#">Northwind</a><Icon name="chevR" />
        <span style={{ color: 'var(--k-fg)' }} aria-current="page">Settings</span>
      </nav>
    </Card>
  )
}

function AvatarCard() {
  return (
    <Card title="Avatar" desc="Sizes, status dot and an overlapping group.">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <span className="avatar avatar--sm avatar--a1">JM</span>
        <span className="avatar avatar--a2">AC</span>
        <span className="avatar avatar--lg avatar--a3">MK</span>
        <span className="avatar avatar--a4">LN<span className="avatar__status avatar__status--online" role="img" aria-label="Online" /></span>
        <span className="avatar avatar--a5">EF<span className="avatar__status avatar__status--away" role="img" aria-label="Away" /></span>
      </div>
      <div className="avatar-group" style={{ marginBottom: 16 }}>
        <span className="avatar avatar--sm avatar--a1">JM</span>
        <span className="avatar avatar--sm avatar--a2">AC</span>
        <span className="avatar avatar--sm avatar--a3">MK</span>
        <span className="avatar avatar--sm avatar--a6">RP</span>
        <span className="avatar-group__more">+3</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ImgAvatar src={PHOTO_SVG} initials="DV" label="Dana Vance" />
        <ImgAvatar src={PHOTO_SVG} initials="KW" size="lg" label="Kai Wong" />
        <ImgAvatar src="/__broken-on-purpose.jpg" initials="BR" tint={4} label="Broken photo — initials fallback" />
        <span style={{ fontSize: 11, color: 'var(--k-fg-faint)' }}>photo · photo · broken→initials</span>
      </div>
    </Card>
  )
}

/* Inline SVG stand-in for a profile photo (always loads, no network) — a soft
   two-stop gradient so the demo reads as "image", not a flat swatch. */
const PHOTO_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23a5b4fc'/%3E%3Cstop offset='1' stop-color='%23f0abfc'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='48' height='48' fill='url(%23g)'/%3E%3Ccircle cx='24' cy='19' r='8' fill='%23ffffff' opacity='.85'/%3E%3Cellipse cx='24' cy='40' rx='14' ry='10' fill='%23ffffff' opacity='.85'/%3E%3C/svg%3E"

function AccordionCard() {
  const items: [string, string][] = [
    ['What is a design token?', 'A named value (color, space, radius) the whole kit reads from — change it once, everything follows.'],
    ['Can I theme it?', 'Yes. Every component reads tokens, so a new palette or shape recalculates the entire UI.'],
    ['Is it framework-neutral?', 'Tokens are plain CSS custom properties — drop them into React, Vue, Svelte or vanilla HTML.'],
  ]
  return (
    <Card title="Accordion" desc="Stacked disclosure panels; first open by default.">
      <div className="accordion">
        {items.map(([q, a], i) => (
          <details key={q} open={i === 0}>
            <summary>{q}<span className="accordion__chevron"><ChevronSvg /></span></summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </Card>
  )
}

function CarouselCard() {
  const slides = [1, 2, 3, 4]
  const [i, setI] = useState(0)
  const go = (d: number) => setI((p) => (p + d + slides.length) % slides.length)
  return (
    <Card title="Carousel" desc="Sliding panels with prev/next and dot pagination." wide>
      <div className="carousel">
        <div className="carousel__viewport">
          <div className="carousel__track" style={{ transform: `translateX(-${i * 100}%)` }}>
            {slides.map((s) => (
              <div key={s} className="carousel__slide" style={{ background: `var(--k-grad-${s})` }}>
                <span className="carousel__caption">Slide {s}</span>
              </div>
            ))}
          </div>
          <button className="carousel__arrow carousel__arrow--prev" aria-label="Previous slide" onClick={() => go(-1)}><Icon name="chevL" /></button>
          <button className="carousel__arrow carousel__arrow--next" aria-label="Next slide" onClick={() => go(1)}><Icon name="chevR" /></button>
        </div>
        <div className="cdots" role="tablist" aria-label="Slide">
          {slides.map((s, j) => (
            <button key={s} className={'cdots__dot' + (i === j ? ' is-on' : '')} role="tab" aria-selected={i === j} aria-label={`Go to slide ${s}`} onClick={() => setI(j)} />
          ))}
        </div>
      </div>
    </Card>
  )
}

function NavMenuCard() {
  const [open, setOpen] = useState(false)
  return (
    <Card title="Navigation menu" desc="Horizontal top nav with a dropdown flyout." wide>
      <nav className="navmenu">
        <button className="navmenu__item navmenu__item--on">Home</button>
        <div className="navmenu__group">
          <button className="navmenu__item" aria-expanded={open} onClick={() => setOpen((v) => !v)}>Products <ChevronSvg size={12} /></button>
          {open && (
            <div className="navmenu__panel menu" role="menu">
              <button className="menu__item" role="menuitem"><Icon name="grid" /> Overview</button>
              <button className="menu__item" role="menuitem"><Icon name="chart" /> Analytics</button>
              <button className="menu__item" role="menuitem"><Icon name="cog" /> Settings</button>
            </div>
          )}
        </div>
        <button className="navmenu__item">Pricing</button>
        <button className="navmenu__item">Docs</button>
      </nav>
    </Card>
  )
}

function ContextMenuCard() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const onCtx = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
  }
  return (
    <Card title="Context menu" desc="Right-click the area for a positioned menu.">
      <div className="ctxmenu" onContextMenu={onCtx} onClick={() => setPos(null)}>
        <span className="ctxmenu__hint">Right-click anywhere here</span>
        {pos && (
          <div className="menu ctxmenu__pop" style={{ left: pos.x, top: pos.y }} role="menu">
            <button className="menu__item" role="menuitem"><Icon name="edit" /> Rename <span className="menu__shortcut">⌘R</span></button>
            <button className="menu__item" role="menuitem"><Icon name="upload" /> Share</button>
            <div className="menu__sep" />
            <button className="menu__item menu__item--danger" role="menuitem"><Icon name="trash" /> Delete</button>
          </div>
        )}
      </div>
    </Card>
  )
}


function FormCard() {
  return (
    <Card title="New contact" desc="Add someone to your address book.">
      <label className="lab">
        <span>Email</span>
        <input className="in" placeholder="you@company.com" />
      </label>
      <label className="lab">
        <span>Search</span>
        <div className="in in--inline">
          <Icon name="search" />
          <input placeholder="Filter results" />
        </div>
      </label>
      <label className="lab">
        <span>Notes</span>
        <textarea className="in tx" placeholder="Anything else…" />
      </label>
      <div className="card__foot">
        <button className="btn btn--primary btn--block">
          <Icon name="check" /> Save contact
        </button>
        <button className="btn btn--ghost btn--block">Cancel</button>
      </div>
    </Card>
  )
}

/* Checkbox + radio shown as a real "Create repository" form — the controls
 * sit inside a task with a heading, helper copy and grouped choices, the way
 * they actually appear in product. (Mini-interface recompose — #200.) */
function SelectionCard() {
  return (
    <Card title="Create repository">
      <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: '0 0 4px' }}>
        Who can access this repository?
      </p>
      <label className="radio">
        <input type="radio" name="repo-vis" defaultChecked /> Public — anyone can see it
      </label>
      <label className="radio">
        <input type="radio" name="repo-vis" /> Private — you choose who
      </label>
      <div style={{ borderTop: 'var(--k-divider)', margin: '4px 0 2px' }} />
      <label className="check">
        <input type="checkbox" defaultChecked /> Add a README
      </label>
      <label className="check">
        <input type="checkbox" /> Include .gitignore
      </label>
      <div className="card__foot">
        <button className="btn btn--primary btn--block">
          <Icon name="plus" /> Create repository
        </button>
      </div>
    </Card>
  )
}

function AlertsCard() {
  return (
    <Card title="Activity" desc="Recent events on your workspace.">
      <div className="alert alert--info" role="status">
        <Icon name="info" />
        <div className="alert__body">
          <div className="alert__title">Heads up</div>
          <div>Two new pull requests are awaiting review.</div>
        </div>
        <button className="alert__close" aria-label="Dismiss"><Icon name="x" /></button>
      </div>
      <div className="alert alert--success" role="status">
        <Icon name="check" />
        <div className="alert__body">
          <div className="alert__title">Deployed</div>
          <div>v2.4.0 is live in production.</div>
        </div>
      </div>
      <div className="alert alert--warning" role="alert">
        <Icon name="bell" />
        <div className="alert__body">
          <div className="alert__title">Quota nearing limit</div>
          <div>You've used 92% of monthly API calls.</div>
        </div>
      </div>
      <div className="alert alert--danger" role="alert">
        <Icon name="x" />
        <div className="alert__body">
          <div className="alert__title">Build failed</div>
          <div>Check the latest commit on main.</div>
        </div>
      </div>
      <div className="card__row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn--link btn--sm">View all activity</button>
        <button className="btn btn--ghost btn--sm">Mark all as read</button>
      </div>
    </Card>
  )
}

function TabsCard() {
  const [tab, setTab] = useState(0)
  const items = [
    { label: 'Overview', icon: 'home', badge: null },
    { label: 'Issues', icon: 'spark', badge: 12 },
    { label: 'Activity', icon: 'chart', badge: null },
  ] as const
  return (
    <Card wide title="Northwind" desc="A project workspace.">
      <div className="tabs" role="tablist" aria-label="Northwind tabs">
        {items.map((it, i) => (
          <button key={it.label} id={`tab-${i}`} className={`tab ${tab === i ? 'tab--on' : ''}`} onClick={() => setTab(i)} aria-selected={tab === i} role="tab">
            <Icon name={it.icon} />
            <span>{it.label}</span>
            {it.badge != null ? <span className="tab__badge">{it.badge}</span> : null}
          </button>
        ))}
      </div>
      {/* Each tab renders real content — tabs applied in context, not a label. */}
      <div className="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} style={{ paddingTop: 4 }}>
        {tab === 0 && (
          <div className="card__row" style={{ gap: 18 }}>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>12</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Open issues</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>4</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Members</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>2d</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Last deploy</div></div>
          </div>
        )}
        {tab === 1 && (
          <div className="list">
            <div className="list__item"><span className="list__body"><span className="list__title">Login fails on Safari 17</span></span><span className="badge badge--danger">Open</span></div>
            <div className="list__item"><span className="list__body"><span className="list__title">Slow query on dashboard</span></span><span className="badge badge--warn">Triage</span></div>
            <div className="list__item"><span className="list__body"><span className="list__title">Dark-mode contrast</span></span><span className="badge badge--success">Fixed</span></div>
          </div>
        )}
        {tab === 2 && (
          <div className="card__col" style={{ gap: 8, fontSize: 'var(--k-type-small)' }}>
            <div className="card__row" style={{ gap: 8 }}><span className="avatar avatar--sm">MK</span><span><strong>Mira</strong> merged #482 · 2h</span></div>
            <div className="card__row" style={{ gap: 8 }}><span className="avatar avatar--sm">JD</span><span><strong>Jordan</strong> opened #485 · 5h</span></div>
            <div className="card__row" style={{ gap: 8 }}><span className="avatar avatar--sm">LN</span><span><strong>Lena</strong> deployed v2.4 · 1d</span></div>
          </div>
        )}
      </div>
    </Card>
  )
}

function TableCard() {
  const [sortKey, setSortKey] = useState<'name' | 'status'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const rows = [
    { name: 'API Gateway', status: 'Healthy', tone: 'success' as const },
    { name: 'Auth service', status: 'Degraded', tone: 'warn' as const },
    { name: 'CDN', status: 'Maintenance', tone: 'info' as const },
    { name: 'Database', status: 'Healthy', tone: 'success' as const },
    { name: 'Queue worker', status: 'Healthy', tone: 'success' as const },
  ]
  const sorted = [...rows].sort((a, b) => {
    const cmp = a[sortKey].localeCompare(b[sortKey])
    return sortDir === 'asc' ? cmp : -cmp
  })
  const toggle = (k: 'name' | 'status') => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir('asc') }
  }
  return (
    <Card wide title="System health" desc="Status of your core services.">
      <table className="tbl">
        <thead>
          <tr>
            <th className={`is-sortable ${sortKey === 'name' ? 'is-active' : ''}`} onClick={() => toggle('name')}>
              <span className="tbl__sort">
                Name
                <span className="tbl__sort-chevron" style={{ transform: sortKey === 'name' && sortDir === 'desc' ? 'rotate(180deg)' : 'none' }}>
                  <ChevronSvg size={12} />
                </span>
              </span>
            </th>
            <th className={`is-sortable ${sortKey === 'status' ? 'is-active' : ''}`} onClick={() => toggle('status')}>
              <span className="tbl__sort">
                Status
                <span className="tbl__sort-chevron" style={{ transform: sortKey === 'status' && sortDir === 'desc' ? 'rotate(180deg)' : 'none' }}>
                  <ChevronSvg size={12} />
                </span>
              </span>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td><StatusBadge tone={r.tone} label={r.status} /></td>
              <td><Icon name="dots" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="card__row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn--link btn--sm">View incident log</button>
        <button className="btn btn--secondary btn--sm">
          <Icon name="spark" /> Refresh
        </button>
      </div>
    </Card>
  )
}

function TooltipCard() {
  return (
    <Card title="Last sync" desc="Hover the status for details.">
      <div className="card__row" style={{ paddingTop: 20 }}>
        <span className="tt">
          <span className="tt__pop" role="tooltip" id="tt-lastsync">Saved 2 min ago</span>
          <button className="btn btn--ghost btn--sm" aria-describedby="tt-lastsync">
            <Icon name="info" /> Status
          </button>
        </span>
      </div>
    </Card>
  )
}

/* Toggle as a "Notifications" settings scene — a labelled row + description
 * + the switch on the right, the way it actually appears in product. Reads
 * as a mini settings panel, not three loose toggles. (Mini-interface
 * recompose pattern — #200.) */
function SwitchCard() {
  const [push, setPush] = useState(true)
  const [email, setEmail] = useState(true)
  const [sms, setSms] = useState(false)
  const ROWS = [
    { label: 'Push notifications', desc: 'Deals, order updates, replies', on: push, set: setPush, disabled: false },
    { label: 'Email digest', desc: 'A weekly summary every Monday', on: email, set: setEmail, disabled: false },
    { label: 'SMS alerts', desc: 'Only security & login events', on: sms, set: setSms, disabled: false },
    { label: 'Security alerts', desc: "Always on — can't be disabled", on: true, set: (_: (v: boolean) => boolean) => {}, disabled: true },
  ]
  return (
    <Card title="Notification settings">
      <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: '0 0 4px' }}>
        Choose what we can reach you about.
      </p>
      <div className="list list--settings">
        {ROWS.map((r) => (
          <div key={r.label} className="list__item">
            <div className="list__body">
              <div className="list__title">{r.label}</div>
              <div className="list__sub">{r.desc}</div>
            </div>
            <button
              type="button"
              aria-pressed={r.on}
              aria-label={r.label}
              aria-disabled={r.disabled || undefined}
              disabled={r.disabled}
              className={`toggle ${r.on ? 'toggle--on' : ''}${r.disabled ? ' toggle--disabled' : ''}`}
              onClick={() => { if (!r.disabled) r.set((v) => !v) }}
            >
              <span className="toggle__knob" />
            </button>
          </div>
        ))}
      </div>
      <div className="card__foot">
        <button className="btn btn--primary btn--block">Save preferences</button>
      </div>
    </Card>
  )
}

/* Slider as a "Display" settings panel — each track gets a label and a live
 * tabular-nums readout, so it reads as a real preferences screen rather than
 * a bare track. (Mini-interface recompose — #200.) */
function SliderCard() {
  const DEFAULTS = { Brightness: 62, Volume: 40 }
  const [vals, setVals] = useState<typeof DEFAULTS>(DEFAULTS)
  return (
    <Card title="Display">
      {(Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]).map((label) => (
        <div key={label} style={{ padding: '2px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 'var(--k-type-small)', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 11, color: 'var(--k-fg-muted)', fontVariantNumeric: 'tabular-nums' }}>{vals[label]}%</span>
          </div>
          <InteractiveSlider value={vals[label]} ariaLabel={label} onChange={(v) => setVals((s) => ({ ...s, [label]: v }))} />
        </div>
      ))}
      <div style={{ padding: '2px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 'var(--k-type-small)', fontWeight: 500, color: 'var(--k-fg-muted)' }}>
            Bass <span style={{ fontSize: 'var(--k-type-caption)', color: 'var(--k-fg-faint)' }}>· locked</span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--k-fg-faint)', fontVariantNumeric: 'tabular-nums' }}>30%</span>
        </div>
        <InteractiveSlider value={30} ariaLabel="Bass (locked)" disabled onChange={() => {}} />
      </div>
      <div className="card__foot">
        <button className="btn btn--primary btn--block">Apply</button>
        <button className="btn btn--ghost btn--block" onClick={() => setVals(DEFAULTS)}>Reset to defaults</button>
      </div>
    </Card>
  )
}

/* Progress shown as a "Storage" usage panel — title, used-of-total readout
 * and an upgrade hint frame the bar in a real account-settings context.
 * (Mini-interface recompose — #200.) */
function ProgressCard() {
  return (
    <Card title="Storage">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span style={{ fontSize: 'var(--k-type-small)', fontWeight: 500 }}>Media library</span>
        <span style={{ fontSize: 11, color: 'var(--k-fg-muted)', fontVariantNumeric: 'tabular-nums' }}>7.4 of 10 GB</span>
      </div>
      <div className="progress" role="progressbar" aria-valuenow={74} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
        <div className="progress__fill" style={{ width: '74%' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>74% used — upgrade for more space.</span>
      <div className="progress progress--indeterminate" role="progressbar" aria-label="Syncing media" style={{ marginTop: 10 }}>
        <div className="progress__fill" />
      </div>
      <span style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Syncing… (indeterminate — no ETA)</span>
      <button className="btn btn--primary btn--block">
        <Icon name="spark" /> Upgrade storage
      </button>
      <button className="btn btn--ghost btn--block">Manage files</button>
    </Card>
  )
}

/* Skeleton shown as a loading list — avatar circle + two text lines per row,
 * the exact shape it stands in for while a feed loads. Previews the component
 * in its real placeholder context. (Mini-interface recompose — #200.) */
function SkeletonCard() {
  return (
    <Card title="Activity feed" desc="Loading the latest updates…">
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="sk" style={{ width: 32, height: 32, borderRadius: '50%', flex: '0 0 auto' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="sk" style={{ height: 10, width: '55%' }} />
            <div className="sk" style={{ height: 9, width: '85%' }} />
          </div>
        </div>
      ))}
    </Card>
  )
}

function DialogCard() {
  const [open, setOpen] = useState(true)
  return (
    <Card title="Delete project" desc="Open the confirmation dialog.">
      <div className="card__row">
        <button className="btn btn--ghost btn--sm" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close dialog' : 'Open dialog'}
        </button>
      </div>
      <div className="dialog-frame">
        {open ? (
          <>
            <div className="dialog-frame__backdrop" onClick={() => setOpen(false)} aria-label="Close dialog" />
            <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
              <h3 id="dialog-title" className="dialog__title">Delete project?</h3>
              <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>
                This permanently removes all associated data.
              </p>
              <div className="card__row" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>Cancel</button>
                <button className="btn btn--danger btn--sm" onClick={() => setOpen(false)}>
                  <Icon name="trash" /> Delete
                </button>
              </div>
            </div>
          </>
        ) : (
          <span style={{ color: 'var(--k-fg-faint)', fontSize: 'var(--k-type-small)' }}>Dialog is closed</span>
        )}
      </div>
    </Card>
  )
}

// Command palette — a real cmdk-style surface: type to filter, hover or
// arrow-keys highlight the active row, Enter would run it, and a proper
// empty-state shows when nothing matches. Listbox/option roles +
// aria-activedescendant give assistive tech the full cmdk contract.
const CMDP_COMMANDS: { group: string; label: string; icon: IconName; keys: string[] }[] = [
  { group: 'Suggestions', label: 'New project', icon: 'plus', keys: ['⌘', 'N'] },
  { group: 'Suggestions', label: 'Import file…', icon: 'upload', keys: ['⌘', 'I'] },
  { group: 'Navigate', label: 'Settings', icon: 'cog', keys: ['⌘', ','] },
  { group: 'Navigate', label: 'Dashboard', icon: 'home', keys: ['G', 'H'] },
]
function CmdPaletteCard() {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const matches = CMDP_COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()))
  const clamped = matches.length ? Math.min(active, matches.length - 1) : 0
  const groups = [...new Set(matches.map((m) => m.group))]
  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(matches.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
  }
  return (
    <Card title="Quick search">
      <div className="cmdp">
        <div className="cmdp__in">
          <Icon name="search" />
          <input
            placeholder="Type a command…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0) }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded
            aria-controls="cmdp-list"
            aria-activedescendant={matches.length ? `cmdp-opt-${clamped}` : undefined}
          />
          <span className="kbd">⌘K</span>
        </div>
        {matches.length === 0 ? (
          <div className="cmdp__empty">No commands match “{q}”.</div>
        ) : (
          <div id="cmdp-list" role="listbox" aria-label="Commands">
            {groups.map((g) => (
              <Fragment key={g}>
                <div className="cmdp__section">{g}</div>
                <ul className="cmdp__list">
                  {matches.map((c, i) =>
                    c.group === g ? (
                      <li
                        key={c.label}
                        id={`cmdp-opt-${i}`}
                        role="option"
                        aria-selected={i === clamped}
                        className={`cmdp__item ${i === clamped ? 'cmdp__item--on' : ''}`}
                        onMouseMove={() => setActive(i)}
                      >
                        <span className="cmdp__item-icon"><Icon name={c.icon} /></span>
                        {c.label}
                        <span className="cmdp__shortcut">{c.keys.map((k, ki) => <span key={ki} className="kbd">{k}</span>)}</span>
                      </li>
                    ) : null,
                  )}
                </ul>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function PaginationCard() {
  const [p, setP] = useState(3)
  return (
    <Card title="Search results" desc="248 repositories match your query.">
      <div className="pagination">
        <button onClick={() => setP((v) => Math.max(1, v - 1))} disabled={p === 1} aria-label="Previous page">
          <Icon name="chevL" />
        </button>
        <button aria-current={p === 1} onClick={() => setP(1)}>1</button>
        <button aria-current={p === 2} onClick={() => setP(2)}>2</button>
        <button aria-current={p === 3} onClick={() => setP(3)}>3</button>
        <span className="pagination__ellipsis">…</span>
        <button aria-current={p === 12} onClick={() => setP(12)}>12</button>
        <button onClick={() => setP((v) => Math.min(12, v + 1))} disabled={p === 12} aria-label="Next page">
          <Icon name="chevR" />
        </button>
      </div>
    </Card>
  )
}


function ChartCard() {
  // ChartFrame — one presentational component, five render modes, all on the
  // derived chart palette (--k-chart-1..6). The switcher proves the palette
  // reads across every shape a real dashboard ships.
  const [type, setType] = useState<ChartType>('area')
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const series =
    type === 'donut'
      ? [{ name: 'Sources', values: [48, 30, 14, 8] }]
      : [
          { name: 'Sessions', values: [42, 55, 48, 64, 58, 72] },
          { name: 'Signups', values: [20, 28, 24, 33, 30, 38] },
        ]
  const donutLabels = ['Direct', 'Search', 'Social', 'Referral']
  return (
    <Card wide title="Traffic by source" desc="One ChartFrame, six render modes — gridlines, axes, hover tooltips.">
      <div className="segctrl" style={{ marginBottom: 10 }}>
        {([['line', 'Line'], ['area', 'Area'], ['bar', 'Bar'], ['stacked', 'Stacked'], ['stackedArea', 'Stacked area'], ['donut', 'Donut']] as const).map(([t, lbl]) => (
          <button key={t} className={`segctrl__btn ${type === t ? 'segctrl__btn--on' : ''}`} onClick={() => setType(t)}>
            {lbl}
          </button>
        ))}
      </div>
      <ChartFrame type={type} height={140} labels={type === 'donut' ? donutLabels : labels} series={series} />
    </Card>
  )
}

// FAQ / Help centre — a SEGMENTED CONTROL (General/Billing/Goals) filtering an
// accordion below, + a Contact Support CTA. The canonical "segmented control on
// top of a card that swaps the content below" pattern, and the kit's prime test
// bed for .segctrl. Also the only place the .accordion recipe lives in the gallery.
const FAQ_DATA: Record<'General' | 'Billing' | 'Goals', [string, string][]> = {
  General: [
    ['How secure is my financial data?', 'We use bank-level AES-256 encryption, SOC 2 Type II certified infrastructure, and never store your credentials. All connections use read-only access tokens.'],
    ['How do I connect my bank or investment accounts?', 'Link accounts in seconds through our verified aggregation partner — search your institution, sign in, and choose which accounts to share.'],
    ['Can I export my data for tax purposes?', 'Yes — export a full CSV or PDF of transactions and realised gains anytime from Settings → Export.'],
  ],
  Billing: [
    ['How does billing work?', 'Plans are billed monthly or yearly. Switch or cancel anytime; changes prorate automatically on your next cycle.'],
    ['Can I change plans later?', 'Upgrade or downgrade whenever you like — the new rate applies from the next billing period.'],
    ['Do you offer refunds?', 'Annual plans are refundable within 14 days, no questions asked.'],
  ],
  Goals: [
    ['How do I set a savings goal?', 'Create a goal, set a target amount and date, and we recommend a weekly contribution to keep you on track.'],
    ['Can I track multiple goals at once?', 'Yes — run as many goals in parallel as you like, each with its own progress bar and projection.'],
  ],
}
function FaqCard() {
  const cats = ['General', 'Billing', 'Goals'] as const
  const [cat, setCat] = useState<(typeof cats)[number]>('General')
  return (
    <Card title="Help centre" desc="Answers, grouped by topic.">
      <div className="segctrl" role="radiogroup" aria-label="FAQ category" style={{ marginBottom: 14 }}>
        {cats.map((c) => (
          <button key={c} className={`segctrl__btn ${cat === c ? 'segctrl__btn--on' : ''}`} role="radio" aria-checked={cat === c} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="accordion">
        {FAQ_DATA[cat].map(([q, a], i) => (
          <details key={q} open={i === 0}>
            <summary>
              {q}
              <span className="accordion__chevron"><ChevronSvg /></span>
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <button className="btn btn--ghost btn--block" style={{ marginTop: 14 }}>Contact Support</button>
    </Card>
  )
}

// Revenue trend — a SEGMENTED CONTROL (Day/Week/Month) swapping the headline
// figure + bar chart below. Doubles as a showcase for the bar-hover tooltips.
function TrendCard() {
  const [range, setRange] = useState<'Day' | 'Week' | 'Month'>('Week')
  const data = {
    Day: { total: '$1.2K', delta: '+4.1%', bars: [['9a', 40], ['12p', 62], ['3p', 55], ['6p', 78], ['9p', 66]] as [string, number][] },
    Week: { total: '$8.4K', delta: '+12.6%', bars: [['Mon', 55], ['Tue', 68], ['Wed', 42], ['Thu', 80], ['Fri', 51], ['Sat', 73], ['Sun', 90]] as [string, number][] },
    Month: { total: '$34.2K', delta: '+8.3%', bars: [['W1', 60], ['W2', 72], ['W3', 54], ['W4', 88]] as [string, number][] },
  }[range]
  return (
    <Card title="Revenue" desc="Net volume over time.">
      <div className="segctrl" role="radiogroup" aria-label="Time range" style={{ marginBottom: 14 }}>
        {(['Day', 'Week', 'Month'] as const).map((r) => (
          <button key={r} className={`segctrl__btn ${range === r ? 'segctrl__btn--on' : ''}`} role="radio" aria-checked={range === r} onClick={() => setRange(r)}>
            {r}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 'var(--k-type-h2)', fontWeight: 700 }}>{data.total}</span>
        <span className="badge badge--success">{data.delta}</span>
      </div>
      <div className="barchart" style={{ height: 90 }}>
        {data.bars.map(([d, v], i) => (
          <div key={i} className="barchart__bar" style={{ height: `${v}%` }} tabIndex={0} role="img" aria-label={`${d}: ${v}`}>
            <span className="barchart__tip">{d} · {v}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// Inbox — a SEGMENTED CONTROL (All/Unread/Archived) filtering the list below.
// Reuses the .list__row interactive-row recipe + an empty state when a filter is dry.
const INBOX_MSGS = [
  { id: 1, from: 'Ava Chen', subject: 'Re: Q3 forecast — numbers look strong', time: '2m', unread: true, archived: false, initials: 'AC', accent: 1 },
  { id: 2, from: 'Billing', subject: 'Your June invoice is ready', time: '1h', unread: true, archived: false, initials: 'B', accent: 3 },
  { id: 3, from: 'Jordan Diaz', subject: 'Deploy #2412 passed', time: '3h', unread: false, archived: false, initials: 'JD', accent: 2 },
  { id: 4, from: 'Kira Lindqvist', subject: 'Thanks for the review 🙏', time: '1d', unread: false, archived: true, initials: 'KL', accent: 5 },
  { id: 5, from: 'Eliot Friedman', subject: 'Old onboarding thread', time: '4d', unread: false, archived: true, initials: 'EF', accent: 4 },
]
function InboxFilterCard() {
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Archived'>('All')
  const rows = INBOX_MSGS.filter((m) => (filter === 'All' ? !m.archived : filter === 'Unread' ? m.unread && !m.archived : m.archived))
  return (
    <Card title="Inbox" desc="Filter by status.">
      <div className="segctrl" role="radiogroup" aria-label="Inbox filter" style={{ marginBottom: 14 }}>
        {(['All', 'Unread', 'Archived'] as const).map((f) => (
          <button key={f} className={`segctrl__btn ${filter === f ? 'segctrl__btn--on' : ''}`} role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      <div className="card__col" style={{ gap: 6 }}>
        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--k-fg-muted)', fontSize: 'var(--k-type-small)', padding: '20px 0' }}>Nothing here.</div>
        ) : (
          rows.map((m) => (
            <div key={m.id} className="list__row" role="button" tabIndex={0} aria-label={`${m.from}: ${m.subject}`}>
              <span className="avatar" style={{ background: `var(--k-accent-${m.accent}-soft)`, color: `var(--k-accent-${m.accent}-soft-fg)`, width: 32, height: 32, fontSize: 12 }}>
                {m.initials}
              </span>
              <div className="card__col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: m.unread ? 600 : 500 }}>{m.from}</span>
                <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</span>
              </div>
              {m.unread && <span className="activity__dot" style={{ background: 'var(--k-primary)' }} role="img" aria-label="Unread" />}
              <span style={{ fontSize: 'var(--k-type-caption)', color: 'var(--k-fg-faint)', flex: 'none' }}>{m.time}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

const DT_ROWS = [
  { id: 1, name: 'ai-router', owner: 'Ava', status: 'success' as const, label: 'Healthy', req: 1820 },
  { id: 2, name: 'pricing-engine-internal-v2', owner: 'Jordan', status: 'success' as const, label: 'Healthy', req: 942 },
  { id: 3, name: 'edge-cache', owner: 'Casey', status: 'warn' as const, label: 'Degraded', req: 12840 },
  { id: 4, name: 'payments-prod', owner: 'Eliot', status: 'danger' as const, label: 'Down', req: 0 },
  { id: 5, name: 'background-jobs', owner: 'Kira', status: 'success' as const, label: 'Healthy', req: 388 },
  { id: 6, name: 'analytics-etl', owner: 'Greta', status: 'warn' as const, label: 'Degraded', req: 5102 },
]
type DTState = 'data' | 'loading' | 'empty' | 'error'
const DT_STATES: { k: DTState; label: string }[] = [
  { k: 'data', label: 'Data' }, { k: 'loading', label: 'Loading' },
  { k: 'empty', label: 'Empty' }, { k: 'error', label: 'Error' },
]

// Data table — the flagship BLOCK, matrix-complete: a .toolbar header that flips
// to a bulk bar on selection, a sticky-header scroll body, a numeric column +
// truncation under content stress, the empty / loading / error state slot, and a
// footer with a rows-per-page .select + .pagination. Composes table · toolbar ·
// select-trigger · pagination atoms. The state switcher is a demo control, not
// part of the block.
function DataTableProCard() {
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [state, setState] = useState<DTState>('data')
  const [page, setPage] = useState(1)
  const rows = state === 'empty' ? [] : DT_ROWS
  const hasRows = state === 'data' && rows.length > 0
  const allOn = hasRows && sel.size === rows.length
  const toggle = (id: number) => {
    const next = new Set(sel)
    next.has(id) ? next.delete(id) : next.add(id)
    setSel(next)
  }
  const toggleAll = () => setSel(allOn ? new Set() : new Set(DT_ROWS.map((r) => r.id)))
  const setMode = (k: DTState) => { setState(k); setSel(new Set()) }
  return (
    <Card wide title="Data table" desc="Toolbar, selection, every state & pagination — the flagship block.">
      <div className="segctrl" role="tablist" aria-label="Table state" style={{ marginBottom: 12 }}>
        {DT_STATES.map((s) => (
          <button key={s.k} role="tab" aria-selected={state === s.k} className={`segctrl__btn ${state === s.k ? 'segctrl__btn--on' : ''}`} onClick={() => setMode(s.k)}>{s.label}</button>
        ))}
      </div>
      <div className={`datatable ${state === 'loading' ? 'datatable--loading' : ''}`}>
        <div className={`datatable__bar ${sel.size > 0 ? 'datatable__bar--active' : ''}`}>
          {sel.size > 0 ? (
            <>
              <span className="datatable__count">{sel.size} selected</span>
              <span className="datatable__spacer" />
              <button className="btn btn--ghost btn--sm"><Icon name="check" /> Restart</button>
              <button className="btn btn--danger btn--sm"><Icon name="trash" /> Delete</button>
            </>
          ) : (
            <div className="toolbar toolbar--sm" style={{ flex: 1 }}>
              <div className="in in--inline" style={{ maxWidth: 200 }}>
                <Icon name="search" />
                <input type="search" aria-label="Search services" placeholder="Search…" />
              </div>
              <select className="select" aria-label="Status filter" style={{ width: 'auto' }}>
                <option>All status</option><option>Healthy</option><option>Degraded</option><option>Down</option>
              </select>
              <span className="toolbar__spacer" />
              <button className="btn btn--secondary btn--sm"><Icon name="plus" /> Add</button>
            </div>
          )}
        </div>
        <div className="datatable__body">
          <table className="tbl">
            <thead>
              <tr>
                <th className="datatable__check"><label className="check"><input type="checkbox" checked={allOn} ref={(el) => { if (el) el.indeterminate = sel.size > 0 && !allOn }} onChange={toggleAll} aria-label="Select all services" disabled={!hasRows} /></label></th>
                <th>Service</th>
                <th>Owner</th>
                <th className="num">Requests</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state === 'loading' ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    <td className="datatable__check"><span className="sk" style={{ height: 12, width: 16, display: 'block' }} /></td>
                    <td><span className="sk" style={{ height: 12, width: '70%', display: 'block' }} /></td>
                    <td><span className="sk" style={{ height: 12, width: 48, display: 'block' }} /></td>
                    <td className="num"><span className="sk" style={{ height: 12, width: 40, display: 'inline-block' }} /></td>
                    <td><span className="sk" style={{ height: 12, width: 64, display: 'block' }} /></td>
                  </tr>
                ))
              ) : state === 'error' ? (
                <tr><td colSpan={5}>
                  <div className="datatable__state datatable__state--error">
                    <span className="datatable__state-icon"><Icon name="info" /></span>
                    <span className="datatable__state-title">Couldn’t load services</span>
                    <span className="datatable__state-msg">The request timed out. Check your connection and try again.</span>
                    <button className="btn btn--secondary btn--sm"><Icon name="upload" /> Retry</button>
                  </div>
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className="datatable__state">
                    <span className="datatable__state-icon"><Icon name="search" /></span>
                    <span className="datatable__state-title">No services yet</span>
                    <span className="datatable__state-msg">Add your first service to start monitoring uptime and traffic.</span>
                    <button className="btn btn--primary btn--sm"><Icon name="plus" /> Add service</button>
                  </div>
                </td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} aria-selected={sel.has(r.id)}>
                    <td className="datatable__check"><label className="check"><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.name}`} /></label></td>
                    <td><span className="truncate" style={{ fontWeight: 500 }}>{r.name}</span></td>
                    <td style={{ color: 'var(--k-fg-muted)' }}>{r.owner}</td>
                    <td className="num">{r.req.toLocaleString()}</td>
                    <td><StatusBadge tone={r.status} label={r.label} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="datatable__foot">
          <span className="datatable__foot-info">{hasRows ? `1–${rows.length} of ${rows.length}` : '0 results'}</span>
          <span className="datatable__perpage">
            <span>Rows</span>
            <select className="select" aria-label="Rows per page" defaultValue="10"><option>10</option><option>25</option><option>50</option></select>
          </span>
          <div className="pagination">
            <button onClick={() => setPage((v) => Math.max(1, v - 1))} disabled={page === 1} aria-label="Previous"><Icon name="chevL" /></button>
            {[1, 2, 3].map((n) => (<button key={n} aria-current={page === n} onClick={() => setPage(n)}>{n}</button>))}
            <button onClick={() => setPage((v) => Math.min(3, v + 1))} disabled={page === 3} aria-label="Next"><Icon name="chevR" /></button>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Form panel — the editing-surface block: a titled header, labelled fields on a
// responsive 2-up grid, a titled section, an inline validation summary (toggled by
// the primary action to demo the error state), and a footer action bar. Composes
// the field atoms (.in/.field/.lab · .select · .numinput · .phoneinput · .toggle ·
// .radio-card) + buttons.
function FormPanelCard() {
  const [showError, setShowError] = useState(false)
  const [notify, setNotify] = useState(true)
  const [plan, setPlan] = useState('team')
  const [qty, setQty] = useState(3)
  return (
    <Card wide title="Form panel" desc="Sectioned fields, validation & an action bar — the form block.">
      <div className="formpanel">
        <div className="formpanel__head">
          <div className="formpanel__title">New workspace</div>
          <div className="formpanel__desc">Set up a workspace for your team.</div>
        </div>
        <div className="formpanel__body">
          {showError && (
            <div className="formpanel__error" role="alert">
              <Icon name="info" />
              <span>Fix the highlighted field before continuing.</span>
            </div>
          )}
          <div className="formpanel__grid">
            <label className="lab"><span>Workspace name</span><input className="in" defaultValue="Acme Inc." /></label>
            <label className="lab"><span>Subdomain</span><input className="in" defaultValue="acme" /></label>
            <div className="field formpanel__full">
              <label className="field__label" htmlFor="fp-owner">Owner email <span className="field__req">*</span></label>
              <input id="fp-owner" className="in" type="email" placeholder="you@company.com" aria-invalid={showError || undefined} aria-describedby={showError ? 'fp-owner-err' : undefined} />
              {showError && <span id="fp-owner-err" className="field__error"><Icon name="info" /> Enter a valid email address.</span>}
            </div>
            <label className="lab"><span>Region</span>
              <select className="select" aria-label="Region"><option>EU (Frankfurt)</option><option>US (Virginia)</option></select>
            </label>
            <div className="lab"><span>Seats</span>
              <div className="numinput">
                <button className="numinput__step" onClick={() => setQty((n) => Math.max(1, n - 1))} aria-label="Decrement">−</button>
                <input className="numinput__field" value={qty} onChange={(e) => { const n = parseInt(e.target.value, 10); if (!isNaN(n)) setQty(n) }} aria-label="Seats" />
                <button className="numinput__step" onClick={() => setQty((n) => n + 1)} aria-label="Increment">+</button>
              </div>
            </div>
            <div className="lab formpanel__full"><span>Phone (billing alerts)</span>
              <div className="phoneinput">
                <button className="phoneinput__country" aria-label="Country"><span className="phoneinput__flag" aria-hidden>🇳🇱</span><span className="phoneinput__code">+31</span></button>
                <input className="phoneinput__field" defaultValue="6 1234 5678" aria-label="Phone number" />
              </div>
            </div>
          </div>
          <div className="formpanel__section">
            <div className="formpanel__section-title">Plan</div>
            <div className="radio-cards">
              {([['team', 'Team', '$8 / seat · unlimited projects'], ['biz', 'Business', '$16 / seat · SSO + audit log']] as [string, string, string][]).map(([k, t, d]) => (
                <label key={k} className={'radio-card' + (plan === k ? ' radio-card--on' : '')}>
                  <span className="radio"><input type="radio" name="fp-plan" checked={plan === k} onChange={() => setPlan(k)} /></span>
                  <span className="radio-card__body"><span className="radio-card__title">{t}</span><span className="radio-card__desc">{d}</span></span>
                </label>
              ))}
            </div>
            <div className="list list--settings">
              <div className="list__item">
                <div className="list__body"><div className="list__title">Email notifications</div><div className="list__sub">Send a weekly digest to the owner.</div></div>
                <button type="button" role="switch" aria-checked={notify} aria-label="Email notifications" className={`toggle ${notify ? 'toggle--on' : ''}`} onClick={() => setNotify((v) => !v)}><span className="toggle__knob" /></button>
              </div>
            </div>
          </div>
        </div>
        <div className="formpanel__foot">
          <span className="formpanel__foot-note">You can change these later in Settings.</span>
          <button className="btn btn--ghost" onClick={() => setShowError(false)}>Cancel</button>
          <button className="btn btn--primary" onClick={() => setShowError((v) => !v)}><Icon name="check" /> Create workspace</button>
        </div>
      </div>
    </Card>
  )
}

// Filter bar — the query block above a list/table: a search field, a faceted
// select, a scope segmented control, a range slider, and an active-filter chip row
// (removable taginput chips + result count + Clear all). Composes searchinput ·
// select-trigger · segctrl · slider · taginput + buttons on the .toolbar.
function FilterBarCard() {
  const [q, setQ] = useState('')
  const [view, setView] = useState('all')
  const [score, setScore] = useState(60)
  const [chips, setChips] = useState(['status: open', 'env: prod'])
  return (
    <Card wide title="Filter bar" desc="Search, facets, range & active-filter chips — the query block.">
      <div className="filterbar">
        <div className="toolbar toolbar--sm">
          <div className="searchinput" style={{ maxWidth: 200 }}>
            <Icon name="search" />
            <input className="searchinput__field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search" />
            {q && <button className="searchinput__clear" onClick={() => setQ('')} aria-label="Clear">×</button>}
          </div>
          <select className="select" aria-label="Status" style={{ width: 'auto' }}><option>Any status</option><option>Open</option><option>Closed</option></select>
          <div className="segctrl" role="tablist" aria-label="Scope">
            {(['all', 'mine'] as const).map((s) => (
              <button key={s} role="tab" aria-selected={view === s} className={`segctrl__btn ${view === s ? 'segctrl__btn--on' : ''}`} onClick={() => setView(s)}>{s === 'all' ? 'All' : 'Mine'}</button>
            ))}
          </div>
          <div className="filterbar__group">
            <span className="filterbar__group-label">Min score</span>
            <div style={{ width: 116 }}><InteractiveSlider value={score} ariaLabel="Minimum score" onChange={setScore} /></div>
          </div>
          <span className="toolbar__spacer" />
          <button className="btn btn--secondary btn--sm"><Icon name="plus" /> Save view</button>
        </div>
        {chips.length > 0 && (
          <div className="filterbar__active">
            <span className="filterbar__active-label">Active</span>
            {chips.map((c) => (
              <span key={c} className="taginput__chip">{c}<button type="button" className="taginput__remove" onClick={() => setChips(chips.filter((x) => x !== c))} aria-label={`Remove ${c}`}><Icon name="x" size={11} /></button></span>
            ))}
            <button className="filterbar__clear" onClick={() => setChips([])}>Clear all</button>
            <span className="filterbar__count">128 results</span>
          </div>
        )}
      </div>
    </Card>
  )
}

// NOTE: the layout primitives (.l-*) are a FOUNDATION (segments.ts FOUNDATIONS),
// not a block — they now live in the Foundations stage view (FoundationsView.tsx),
// which is a registered demo surface for the modifier audit. No gallery card here.

// ---- TreeView ----
function TreeRow({ label, expanded, onClick, leaf, selected }: { label: string; expanded?: boolean; onClick?: () => void; leaf?: boolean; selected?: boolean }) {
  return (
    <div
      className={`tree__row ${selected ? 'tree__row--on' : ''}`}
      role="treeitem"
      tabIndex={0}
      aria-expanded={leaf ? undefined : !!expanded}
      aria-selected={selected || undefined}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() } }}
    >
      <span className={`tree__chev ${leaf ? 'tree__chev--leaf' : ''}`}><Icon name="chevR" size={13} /></span>
      <span className="tree__icon"><Icon name={leaf ? 'file' : 'grid'} size={13} /></span>
      {label}
    </div>
  )
}
function TreeViewCard() {
  const [open, setOpen] = useState<Set<string>>(new Set(['src', 'components']))
  const [sel, setSel] = useState('Button.tsx')
  const toggle = (k: string) => { const n = new Set(open); n.has(k) ? n.delete(k) : n.add(k); setOpen(n) }
  return (
    <Card title="Explorer" desc="Expandable file tree.">
      <div className="tree" role="tree" aria-label="File explorer">
        <TreeRow label="src" expanded={open.has('src')} onClick={() => toggle('src')} />
        {open.has('src') && (
          <div className="tree__group">
            <TreeRow label="components" expanded={open.has('components')} onClick={() => toggle('components')} />
            {open.has('components') && (
              <div className="tree__group">
                {['Button.tsx', 'Card.tsx', 'Input.tsx'].map((f) => (
                  <TreeRow key={f} label={f} leaf selected={sel === f} onClick={() => setSel(f)} />
                ))}
              </div>
            )}
            <TreeRow label="tokens.css" leaf selected={sel === 'tokens.css'} onClick={() => setSel('tokens.css')} />
          </div>
        )}
        <TreeRow label="package.json" leaf selected={sel === 'package.json'} onClick={() => setSel('package.json')} />
      </div>
    </Card>
  )
}

// ---- Kanban ----
type BoardCard = { t: string; b: string; tag: string; tagColor: string; pts: number; prio: string }
const PRIO: Record<string, string> = { high: 'var(--k-danger-soft-fg)', med: 'var(--k-warning-soft-fg)', low: 'var(--k-info-soft-fg)' }
function ToolbarRecipeCard() {
  // Composition primitive: every control sits at ONE height because .toolbar
  // forces it — even though the row mixes a search input, a ghost filter, a
  // select and a primary button (each with its own default sizing).
  return (
    <Card wide title="Toolbar" desc="Mixed controls forced to one height — search, filter, select & action all line up.">
      <div className="toolbar">
        <label className="in in--inline" style={{ maxWidth: 200 }}>
          <Icon name="search" />
          <input type="search" placeholder="Search…" aria-label="Search" />
        </label>
        <span className="toolbar__group">
          {/* Working dropdowns — same MenuButton the app's Projects toolbar uses,
              so the gallery demo and the live app stay in sync (no dead chevrons). */}
          <MenuButton label="Epic" items={[
            { label: 'All epics' },
            { label: 'Onboarding' },
            { label: 'Billing' },
            { label: 'Platform' },
          ]} />
          <MenuButton label="Type" items={[
            { label: 'All types' },
            { label: 'Bug' },
            { label: 'Feature' },
            { label: 'Task' },
          ]} />
        </span>
        <span className="toolbar__spacer" />
        <select className="select" style={{ width: 'auto' }} aria-label="Filter issues">
          <option>All issues</option><option>Active</option><option>Backlog</option>
        </select>
        <button className="btn btn--primary"><Icon name="plus" /> New</button>
      </div>
    </Card>
  )
}

function KanbanCard() {
  const cols: { name: string; cards: BoardCard[] }[] = [
    { name: 'Todo', cards: [
      { t: 'Spec OTP login flow', b: 'NW-412', tag: 'Auth', tagColor: 'var(--k-chart-1)', pts: 3, prio: 'high' },
      { t: 'Audit color tokens', b: 'NW-418', tag: 'Design', tagColor: 'var(--k-chart-2)', pts: 2, prio: 'low' },
    ] },
    { name: 'In progress', cards: [
      { t: 'Sidebar rail collapse', b: 'NW-420', tag: 'Web', tagColor: 'var(--k-chart-3)', pts: 5, prio: 'med' },
    ] },
    { name: 'Done', cards: [
      { t: 'Chart palette refresh', b: 'NW-401', tag: 'Design', tagColor: 'var(--k-chart-2)', pts: 2, prio: 'med' },
      { t: 'Bulk archive action', b: 'NW-399', tag: 'Data', tagColor: 'var(--k-chart-4)', pts: 8, prio: 'high' },
    ] },
  ]
  const avatars = ['AB', 'CD', 'EF']
  return (
    <Card wide title="Sprint board" desc="Issue cards with epic tag, key, points, priority & assignee.">
      <div className="kanban">
        {cols.map((c) => (
          <div key={c.name} className="kanban__col">
            <div className="kanban__col-head">{c.name}<span className="kanban__count">{c.cards.length}</span></div>
            {c.cards.map((card, i) => (
              <button type="button" key={card.b} className="kanban__card" aria-label={`${card.t} · ${card.b}`}>
                <span className="kanban__card-title">{card.t}</span>
                <span className="kanban__tag" style={{ background: card.tagColor, color: '#fff' }}>{card.tag}</span>
                <div className="kanban__card-foot">
                  <span className="kanban__stats">
                    <span className="kanban__key"><Icon name="file" size={14} /> {card.b}</span>
                    <span className="kanban__pts">{card.pts}</span>
                    <span className="kanban__prio" style={{ color: PRIO[card.prio] }} aria-label={`${card.prio} priority`}>
                      <i /><i /><i />
                    </span>
                  </span>
                  <span className="avatar avatar--sm" style={{ width: 22, height: 22, fontSize: 9 }}>{avatars[i % 3]}</span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ---- StatusPage ----
function StatusBars({ pattern }: { pattern: string }) {
  const total = pattern.length
  return (
    <div className="statuspage__bars">
      {pattern.split('').map((c, i) => {
        const status = c === 'w' ? 'Degraded' : c === 'd' ? 'Outage' : 'Operational'
        return (
          <span
            key={i}
            className={`statuspage__tick ${c === 'w' ? 'statuspage__tick--warn' : c === 'd' ? 'statuspage__tick--down' : ''}`}
            title={`${total - i} day${total - i === 1 ? '' : 's'} ago — ${status}`}
          />
        )
      })}
    </div>
  )
}
function StatusPageCard() {
  const rows = [
    { name: 'API', pct: '99.98%', p: 'oooooooooooooooooooooo' },
    { name: 'Dashboard', pct: '99.91%', p: 'ooooooooowoooooooooooo' },
    { name: 'Webhooks', pct: '98.40%', p: 'ooooooddoooowwooooooooo' },
    { name: 'CDN', pct: '100%', p: 'oooooooooooooooooooooo' },
  ]
  return (
    <Card wide title="System status" desc="90-day uptime by service.">
      <div className="statuspage">
        <div className="statuspage__banner"><Icon name="check" /> All systems operational</div>
        {rows.map((r) => (
          <div key={r.name} className="statuspage__row">
            <span className="statuspage__name">{r.name}</span>
            <StatusBars pattern={r.p} />
            <span className="statuspage__pct">{r.pct}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ---- NotificationCenter ----
function NotificationCenterCard() {
  const [read, setRead] = useState(false)
  const items: Array<{ group: string; icon: IconName; title: string; meta: string; unread: boolean }> = [
    { group: 'Today', icon: 'spark', title: 'Deploy finished', meta: 'production · 2m', unread: true },
    { group: 'Today', icon: 'bell', title: '3 PRs awaiting review', meta: 'northwind/api · 1h', unread: true },
    { group: 'Earlier', icon: 'check', title: 'Nightly backup done', meta: 'yesterday · 04:00', unread: false },
    { group: 'Earlier', icon: 'info', title: 'Casey joined the team', meta: 'yesterday', unread: false },
  ]
  const unread = read ? 0 : items.filter((i) => i.unread).length
  return (
    <Card title="Notification center">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--k-s-8)', borderBottom: 'var(--k-divider)' }}>
        {/* Header bell — the .meta-notif recipe: an icon with an unread count
         * dot, the classic app-bar notification trigger (also in the live app). */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--k-s-8)', fontWeight: 600, fontSize: 'var(--k-type-small)' }}>
          <span className="meta-notif"><Icon name="bell" />{unread > 0 && <span className="meta-notif__dot">{unread}</span>}</span>
          {unread} unread
        </span>
        <button className="btn btn--ghost btn--sm" onClick={() => setRead(true)}>Mark all read</button>
      </div>
      {['Today', 'Earlier'].map((g) => (
        <ul key={g} className="list list--flush" role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li className="list__section">{g}</li>
          {items.filter((i) => i.group === g).map((i) => (
            <li key={i.title} className={`list__item ${i.unread && !read ? 'list__item--unread' : ''}`}>
              <span className="list__lead list__lead--icon-muted"><Icon name={i.icon} size={15} /></span>
              <div className="list__body">
                <div className="list__title list__title--lg">{i.title}</div>
                <div className="list__sub">{i.meta}</div>
              </div>
              {i.unread && !read && <span className="list__dot" />}
            </li>
          ))}
        </ul>
      ))}
    </Card>
  )
}

function ValidationCard() {
  return (
    <Card title="Account details" desc="We'll check these as you type.">
      <div className="field">
        <label className="field__label" htmlFor="acc-email">Email <span className="field__req" aria-hidden="true">*</span></label>
        <input className="in is-error" id="acc-email" defaultValue="not-an-email" aria-invalid="true" aria-describedby="acc-email-error" />
        <span className="field__error" id="acc-email-error"><Icon name="info" /> Enter a valid email address.</span>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="acc-user">Username</label>
        <input className="in is-success" id="acc-user" defaultValue="ava_chen" aria-describedby="acc-user-hint" />
        <span className="field__hint" id="acc-user-hint">3–20 characters · available ✓</span>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="acc-plan">Plan</label>
        <input className="in" id="acc-plan" defaultValue="Pro (locked)" readOnly aria-readonly="true" />
      </div>
      <button className="btn btn--primary btn--block btn--loading" disabled aria-busy="true"><span>Saving…</span></button>
    </Card>
  )
}

function SelectCard() {
  const REGIONS = ['eu-west-1', 'us-east-1', 'ap-south-1', 'sa-east-1']
  const [open, setOpen] = useState(false)
  const [region, setRegion] = useState('eu-west-1')
  return (
    <Card title="Deploy region" desc="Where your app runs.">
      <label className="lab">
        <span>Region</span>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="select-trigger"
            style={{ width: '100%' }}
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span>{region}</span>
            <Icon name="chevD" />
          </button>
          {open && (
            <div className="menu" role="listbox" style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 6px)' }} onMouseLeave={() => setOpen(false)}>
              {REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="option"
                  aria-selected={r === region}
                  className={`menu__item ${r === region ? 'menu__item--check' : ''}`}
                  onClick={() => { setRegion(r); setOpen(false) }}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </label>
      <div className="card__foot">
        <button className="btn btn--primary btn--block">
          <Icon name="upload" /> Save and deploy
        </button>
      </div>
    </Card>
  )
}

/* Toolbar scene — two roll-down menus in one place (a Sort dropdown + a "..."
 * overflow menu) over a short file list. A natural surface to feel the menu
 * signature + button press. (#213) */
function ToolbarCard() {
  const SORTS = ['Newest', 'Oldest', 'Name A–Z', 'Largest']
  const [sort, setSort] = useState('Newest')
  const [sortOpen, setSortOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  return (
    <Card title="Documents" desc="Sort and manage your files.">
      <div className="card__row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <button className="btn btn--secondary btn--sm" onClick={() => { setSortOpen((v) => !v); setMoreOpen(false) }} aria-expanded={sortOpen}>
            Sort: {sort} <Icon name="chevD" />
          </button>
          {sortOpen && (
            <div className="menu" role="menu" style={{ position: 'absolute', left: 0, top: 'calc(100% + 6px)', minWidth: 160 }} onMouseLeave={() => setSortOpen(false)}>
              {SORTS.map((s) => (
                <button key={s} className={`menu__item ${s === sort ? 'menu__item--check' : ''}`} onClick={() => { setSort(s); setSortOpen(false) }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button className="btn btn--ghost btn--icon btn--sm" aria-label="More actions" onClick={() => { setMoreOpen((v) => !v); setSortOpen(false) }} aria-expanded={moreOpen}>
            <Icon name="dots" />
          </button>
          {moreOpen && (
            <div className="menu" role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', minWidth: 160 }} onMouseLeave={() => setMoreOpen(false)}>
              <button className="menu__item"><Icon name="edit" /> Rename</button>
              <button className="menu__item"><Icon name="upload" /> Export all</button>
              <div className="menu__sep" />
              <button className="menu__item menu__item--danger"><Icon name="trash" /> Delete</button>
            </div>
          )}
        </div>
      </div>
      <div className="list">
        <div className="list__item"><div className="list__body"><div className="list__title">Q2 report.pdf</div><div className="list__sub">Updated 2 days ago</div></div><span className="badge badge--neutral">PDF</span></div>
        <div className="list__item"><div className="list__body"><div className="list__title">brand-assets.zip</div><div className="list__sub">Updated last week</div></div><span className="badge badge--neutral">ZIP</span></div>
      </div>
    </Card>
  )
}

/* === Stat tile (#111) ===
 * The premium "metric card" pattern observed across 2026 finance/social/ops
 * dashboards. Three signals at a glance:
 *   1. Eyebrow label (UPPERCASE, tight tracking, muted)
 *   2. Big tabular number (display font, semibold, tabular-nums so columns align)
 *   3. Sparkline + delta indicator (▲/▼ with sign-colored bg pill)
 *
 * Sparkline uses SVG <path> with stroke-dasharray animation on mount —
 * draws in over 600ms with ease-out so it reads as "freshly loaded data".
 *
 * Two tiles in one card to demo the success + danger delta variants. */
function StatTile({
  label, value, delta, sparkPath, positive, good = positive, accent, clickable,
}: {
  label: string
  value: string
  delta: string
  sparkPath: string
  /** Arrow DIRECTION — did the number go up or down? */
  positive: boolean
  /** SENTIMENT — is that movement good for the business? Drives the colour.
   *  Decoupled from direction so e.g. a DROP in churn reads green, not red.
   *  Defaults to `positive` (up = good), the common case. */
  good?: boolean
  accent: 'primary' | 'accent'
  /** Clickable KPI — adds the drill affordance (hover-lift + trailing chevron),
   *  the same `.stat-tile--clickable` variant the app's drill-down tiles use. */
  clickable?: boolean
}) {
  const tone = good ? 'var(--k-success)' : 'var(--k-danger)'
  return (
    <div
      className={'stat-tile' + (clickable ? ' stat-tile--clickable' : '')}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <div className="stat-tile__head">
        <span className="stat-tile__label">{label}</span>
        {clickable ? (
          <span className="stat-tile__drill" aria-hidden="true"><Icon name="chevR" size={13} /></span>
        ) : (
          <span className={'stat-tile__icon stat-tile__icon--' + accent}>
            <Icon name={good ? 'chart' : 'bell'} />
          </span>
        )}
      </div>
      <div className="stat-tile__value">{value}</div>
      <div className="stat-tile__foot">
        <svg className="stat-tile__spark" viewBox="0 0 80 24" preserveAspectRatio="none" aria-hidden>
          <path d={sparkPath} fill="none" stroke={tone} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {/* colour follows SENTIMENT (good/bad); arrow follows DIRECTION (up/down) */}
        <span className={'stat-tile__delta stat-tile__delta--' + (good ? 'up' : 'down')}>
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
            <path d={positive ? 'M5 1 L9 7 L1 7 Z' : 'M5 9 L9 3 L1 3 Z'} fill={tone} />
          </svg>
          {delta}
        </span>
      </div>
    </div>
  )
}
function StatCard() {
  return (
    <Card wide title="Recurring revenue" desc="This month at a glance.">
      <div className="stat-tile-grid">
        <StatTile
          label="Monthly recurring"
          value="$48,210"
          delta="12.4%"
          positive
          accent="primary"
          clickable
          sparkPath="M0 18 L10 16 L20 14 L30 15 L40 11 L50 9 L60 6 L70 7 L80 3"
        />
        <StatTile
          label="Churn rate"
          value="2.8%"
          delta="0.6%"
          positive={false}
          good
          accent="accent"
          sparkPath="M0 6 L10 7 L20 9 L30 8 L40 11 L50 13 L60 14 L70 17 L80 20"
        />
      </div>
      <button className="btn btn--outline btn--block">
        <Icon name="chart" /> View full report
      </button>
    </Card>
  )
}

function PopoverCard() {
  const [open, setOpen] = useState(true)
  // In real apps the popover is position: absolute and anchors to its trigger.
  // In this masonry-card demo we render it in-flow so the card grows naturally
  // (absolute would float out of the card and overlap the next one in the column).
  // The .popover class still applies — only `position` is overridden inline.
  return (
    <Card title="Profile" desc="A quick profile peek.">
      <div>
        <button
          className={`btn ${open ? 'btn--primary' : 'btn--ghost'} btn--sm`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <Icon name="info" /> {open ? 'Hide popover' : 'Show popover'}
        </button>
        {open && (
          <div
            className="popover"
            role="dialog"
            style={{ position: 'relative', top: 'auto', left: 'auto', marginTop: 12 }}
          >
            <span className="popover__arrow" />
            <div className="card__row" style={{ gap: 8, marginBottom: 8 }}>
              <span className="avatar avatar--sm">JM</span>
              <div className="card__col" style={{ gap: 1, flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--k-type-small)' }}>Jordan Maxwell</span>
                <span style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>jordan@northwind.dev</span>
              </div>
            </div>
            <button className="btn btn--primary btn--sm" style={{ width: '100%', justifyContent: 'center' }}>View profile</button>
          </div>
        )}
      </div>
    </Card>
  )
}

function HoverCardCard() {
  // NB: uses <div> not <p> as the wrapper because .hover-card__pop contains
  // nested <div>s (avatar + columns) — putting <div> inside <p> is invalid
  // HTML and React 19 strict mode throws a hydration error.
  return (
    <Card title="Mentions" desc="Hover a name to preview their profile.">
      <div style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>
        Hover over{' '}
        <span className="hover-card">
          @ava_chen
          <span className="hover-card__pop">
            <span className="card__row" style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span className="avatar avatar--sm avatar--a3">AC</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--k-type-small)', color: 'var(--k-fg)' }}>Ava Chen</span>
                <span style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Design engineer · since 2024</span>
              </span>
            </span>
            <span style={{ display: 'block', fontSize: 11.5, color: 'var(--k-fg-muted)' }}>
              Builds the Cockpit panel + design tokens.
            </span>
          </span>
        </span>{' '}
        to see a profile preview.
      </div>
    </Card>
  )
}

function SheetCard() {
  const [open, setOpen] = useState(true)
  return (
    <Card title="Filters" desc="Slide out to refine the list.">
      <div className="card__row" style={{ justifyContent: 'space-between' }}>
        <button className="btn btn--ghost btn--sm" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close sheet' : 'Open sheet'}
        </button>
        <span style={{ fontSize: 11, color: 'var(--k-fg-faint)' }}>
          {open ? 'Backdrop is click-to-dismiss' : ''}
        </span>
      </div>
      <div className="sheet-frame">
        {open && (
          <>
            <div className="sheet-frame__backdrop" onClick={() => setOpen(false)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(false) } }} role="button" tabIndex={0} aria-label="Close sheet" />
            <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
              <div className="sheet__head">
                <span className="sheet__title" id="sheet-title">Filters</span>
                <button className="btn btn--ghost btn--icon btn--sm" aria-label="Close" onClick={() => setOpen(false)}>
                  <Icon name="x" />
                </button>
              </div>
              <div className="sheet__body">
                <label className="check"><input type="checkbox" defaultChecked /> Open</label>
                <label className="check"><input type="checkbox" /> In review</label>
                <label className="check"><input type="checkbox" /> Closed</label>
              </div>
              <div className="sheet__foot">
                <button className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>Cancel</button>
                <button className="btn btn--primary btn--sm" onClick={() => setOpen(false)}>Apply</button>
              </div>
            </aside>
          </>
        )}
        {!open && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--k-fg-faint)', fontSize: 'var(--k-type-small)' }}>
            Sheet is closed
          </div>
        )}
      </div>
    </Card>
  )
}

function SpinnerCard() {
  return (
    <Card title="Workspace">
      <div className="card__row" style={{ alignItems: 'center', gap: 12 }}>
        <span className="spinner" aria-label="Loading" />
        <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>Loading workspace…</span>
      </div>
      <div className="card__row" style={{ alignItems: 'center', gap: 14, marginTop: 8 }}>
        <span className="spinner spinner--sm" aria-label="Loading" />
        <span className="spinner" aria-label="Loading" />
        <span className="spinner spinner--lg" aria-label="Loading" />
        <span style={{ fontSize: 11, color: 'var(--k-fg-faint)' }}>sm · md · lg</span>
      </div>
    </Card>
  )
}

function InteractiveCardCard() {
  return (
    <Card title="Workspaces" desc="Whole-card click targets — a button styled as a card (hover lift · press · focus ring).">
      <button type="button" className="card card--interactive" style={{ gap: 4, padding: 'var(--k-s-14)' }}>
        <strong style={{ fontSize: 'var(--k-type-small)' }}>Acme Inc</strong>
        <span style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>12 projects · 4 members</span>
      </button>
      <button type="button" className="card card--interactive" style={{ gap: 4, padding: 'var(--k-s-14)' }}>
        <strong style={{ fontSize: 'var(--k-type-small)' }}>Personal</strong>
        <span style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>3 projects · just you</span>
      </button>
    </Card>
  )
}

function ResizableCard() {
  return (
    <Card title="Resizable" desc="Drag the divider — or focus it and use ←/→ (Home/End to clamp). Pane sizes stay within bounds.">
      <Resizable
        ariaLabel="Resize file list and editor"
        start={38}
        min={22}
        max={68}
        minHeight={150}
        left={
          <div style={{ padding: 'var(--k-s-12)', fontSize: 'var(--k-type-small)' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Files</div>
            {['index.ts', 'App.tsx', 'styles.css', 'utils.ts'].map((f) => (
              <div key={f} style={{ padding: '4px 0', color: 'var(--k-fg-muted)', fontFamily: 'var(--k-font-mono)', fontSize: 11.5 }}>{f}</div>
            ))}
          </div>
        }
        right={
          <div style={{ padding: 'var(--k-s-12)', fontSize: 11.5, fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-muted)', lineHeight: 1.7 }}>
            <div><span style={{ color: 'var(--k-primary)' }}>export</span> function App() {'{'}</div>
            <div style={{ paddingLeft: 16 }}><span style={{ color: 'var(--k-primary)' }}>return</span> &lt;Hello /&gt;</div>
            <div>{'}'}</div>
          </div>
        }
      />
    </Card>
  )
}

function MenubarCard() {
  const noop = () => {}
  return (
    <Card title="Menubar" desc="Desktop app menu bar — ←/→ between menus, ↓ to open, Esc to close (reuses the menu keyboard model).">
      <Menubar
        ariaLabel="Document"
        menus={[
          { label: 'File', items: [
            { label: 'New file', shortcut: '⌘N', onSelect: noop },
            { label: 'Open…', shortcut: '⌘O', onSelect: noop },
            { label: 'Save', shortcut: '⌘S', onSelect: noop },
          ] },
          { label: 'Edit', items: [
            { label: 'Undo', shortcut: '⌘Z', onSelect: noop },
            { label: 'Redo', shortcut: '⇧⌘Z', onSelect: noop },
            { label: 'Cut', shortcut: '⌘X', onSelect: noop },
            { label: 'Copy', shortcut: '⌘C', onSelect: noop },
          ] },
          { label: 'View', items: [
            { label: 'Zoom in', shortcut: '⌘+', onSelect: noop },
            { label: 'Zoom out', shortcut: '⌘−', onSelect: noop },
            { label: 'Toggle sidebar', shortcut: '⌘\\', onSelect: noop },
          ] },
          { label: 'Help', items: [
            { label: 'Documentation', onSelect: noop },
            { label: 'Keyboard shortcuts', shortcut: '⌘/', onSelect: noop },
          ] },
        ]}
      />
    </Card>
  )
}

function EmptyStateCard() {
  return (
    <Card title="Projects">
      <div className="empty">
        <span className="empty__icon"><Icon name="file" /></span>
        <div className="empty__title">No projects yet</div>
        <div className="empty__sub">Create your first project to get started.</div>
        <button className="btn btn--primary btn--sm">
          <Icon name="plus" /> New project
        </button>
      </div>
    </Card>
  )
}

// Side navigation — the exportable `.sidenav` shell: a brand header with an
// in-header collapse toggle, grouped rows (.nav-group + .navrow), a count badge,
// a nested section (.navrow + .navsub) and a pinned footer. Sits on the Chrome
// plane (--k-chrome-bg) so it responds to the Sidebar treatment; collapses to a
// 64px icon-rail (.sidenav--rail) with hover tooltips. The live SupaDash app
// dogfoods this exact recipe (see DemoDashboard).
function NavCard() {
  const [rail, setRail] = useState(false)
  const [open, setOpen] = useState(true)
  return (
    <Card title="Side navigation" desc="Brand header, grouped rows, a count badge, a nested section, a pinned footer, and a collapsible icon-rail — themed by the Sidebar control.">
      <nav className={`sidenav ${rail ? 'sidenav--rail' : ''}`}>
        <div className="sidenav__brand">
          {/* App-icon launcher tile — 2×2 grid mark in the brand colour. */}
          <span className="sidenav__icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1.8" />
              <rect x="9" y="1" width="6" height="6" rx="1.8" />
              <rect x="1" y="9" width="6" height="6" rx="1.8" />
              <rect x="9" y="9" width="6" height="6" rx="1.8" />
            </svg>
          </span>
          <span className="sidenav__name">Acme</span>
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
        <div className="nav-group">Workspace</div>
        <NavRow icon="home" label="Overview" active />
        <NavRow icon="grid" label="Projects" />
        <button type="button" className="navrow" data-tip="Inbox" aria-label="Inbox, 4 unread">
          <Icon name="bell" />
          <span className="navrow__label">Inbox</span>
          <span className="badge badge--solid-primary badge--count">4</span>
        </button>
        <div className="nav-group">Commerce</div>
        <div>
          <button type="button" className="navrow navrow--parent" aria-expanded={open} data-tip="Shop" aria-label="Shop" onClick={() => setOpen((o) => !o)}>
            <Icon name="store" />
            <span className="navrow__label" style={{ flex: 1 }}>Shop</span>
            <span className="navrow__chev"><Icon name="chevR" /></span>
          </button>
          {open && (
            <div className="navsub">
              <button type="button" className="navsub__item navsub__item--on" aria-current="page">Storefront</button>
              <button type="button" className="navsub__item">Orders</button>
            </div>
          )}
        </div>
        {/* Pinned footer — Settings + a ⌘K launcher, mirroring the live app
         * shell's bottom block (built from the SAME .navrow recipe). */}
        <div className="sidenav__foot">
          <NavRow icon="cog" label="Settings" />
          <button type="button" className="navrow" data-tip="Quick actions" aria-label="Quick actions">
            <span className="kbd">⌘K</span>
            <span className="navrow__label">Quick actions</span>
          </button>
        </div>
      </nav>
    </Card>
  )
}

function NavRow({ icon, label, active }: { icon: IconName; label: string; active?: boolean }) {
  return (
    <button type="button" className={`navrow ${active ? 'navrow--on' : ''}`} data-tip={label} aria-label={label} aria-current={active ? 'page' : undefined}>
      <Icon name={icon} />
      <span className="navrow__label">{label}</span>
    </button>
  )
}

// Button group — equal-weight buttons fused into one control (a view switcher)
// plus a split action. Outer corners follow the button radius.
// Canonical buttons showcase — the most fundamental atom, shown the shadcn way:
// every variant at INTRINSIC width in a row (not stretched), then sizes, then
// states (icon, loading, disabled). The hierarchy reads at a glance — one loud
// primary, quiet secondary/outline/ghost siblings, a destructive, a link.
function ButtonsCard() {
  const [loading, setLoading] = useState(false)
  return (
    <Card title="Buttons" desc="One loud primary, quiet siblings. Variant · size · state — all at intrinsic width.">
      <div className="card__row">
        <button type="button" className="btn btn--primary">Get started</button>
        <button type="button" className="btn btn--secondary">Secondary</button>
        <button type="button" className="btn btn--outline">Outline</button>
        <button type="button" className="btn btn--ghost">Ghost</button>
        <button type="button" className="btn btn--danger">Delete</button>
        <button type="button" className="btn btn--link">Learn more</button>
      </div>
      <div className="card__row" style={{ alignItems: 'center' }}>
        <button type="button" className="btn btn--primary btn--sm">Small</button>
        <button type="button" className="btn btn--primary">Default</button>
        <button type="button" className="btn btn--primary btn--lg">Large</button>
        <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--k-border)', margin: '0 var(--k-s-2)' }} aria-hidden="true" />
        <button type="button" className="btn btn--outline"><Icon name="check" /> With icon</button>
        <button type="button" className="btn btn--primary btn--icon" aria-label="Search"><Icon name="search" /></button>
      </div>
      <div className="card__row" style={{ alignItems: 'center' }}>
        <button type="button" className={`btn btn--primary${loading ? ' btn--loading' : ''}`} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1400) }}><span>{loading ? 'Saving' : 'Click to load'}</span></button>
        <button type="button" className="btn btn--primary" disabled>Disabled</button>
        <button type="button" className="btn btn--outline" disabled>Disabled</button>
      </div>
    </Card>
  )
}

function ButtonGroupCard() {
  const [view, setView] = useState('board')
  // The split action's chevron opens a real menu (same useDropdown + .menu the
  // app uses) — no dead chevron in the canonical demo.
  const save = useDropdown()
  return (
    <Card title="Button group" desc="Buttons fused into one control — a view switcher and a split action.">
      <div className="btn-group" role="group" aria-label="View">
        {(['Board', 'List', 'Timeline'] as const).map((v) => (
          <button key={v} type="button" className={`btn btn--sm ${view === v.toLowerCase() ? 'btn--primary' : 'btn--outline'}`} aria-pressed={view === v.toLowerCase()} onClick={() => setView(v.toLowerCase())}>{v}</button>
        ))}
      </div>
      <div ref={save.ref} style={{ position: 'relative', display: 'inline-flex' }}>
        <div className="btn-group" role="group" aria-label="Save options">
          <button type="button" className="btn btn--outline btn--sm"><Icon name="check" /> Save</button>
          <button type="button" className="btn btn--outline btn--sm btn--icon" aria-label="More save options" aria-haspopup="menu" aria-expanded={save.open} onClick={() => save.setOpen(!save.open)}><Icon name="chevD" /></button>
        </div>
        {save.open && (
          <div className="menu" role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + var(--k-s-4))', minWidth: 180, zIndex: 'var(--k-z-dropdown)' }}>
            <button role="menuitem" className="menu__item" onClick={() => save.setOpen(false)}>Save and close</button>
            <button role="menuitem" className="menu__item" onClick={() => save.setOpen(false)}>Save as draft</button>
            <button role="menuitem" className="menu__item" onClick={() => save.setOpen(false)}>Save as template</button>
          </div>
        )}
      </div>
    </Card>
  )
}

// Aspect ratio — ratio-locked media boxes (16:9 + 1:1) whose children cover.
function AspectRatioCard() {
  return (
    <Card title="Aspect ratio" desc="Ratio-locked media boxes — children cover, the shape holds across the grid.">
      <div className="aspect aspect--16x9">
        <div className="aspect__fill" style={{ display: 'grid', placeItems: 'center', background: 'var(--k-primary-soft)', color: 'var(--k-primary)' }}><Icon name="grid" size={22} /></div>
      </div>
      <div className="card__row">
        <div className="aspect aspect--1x1" style={{ width: 64, flex: 'none' }}>
          <div className="aspect__fill" style={{ display: 'grid', placeItems: 'center', background: 'var(--k-surface-sunken)', color: 'var(--k-fg-faint)' }}><Icon name="file" size={18} /></div>
        </div>
        <div style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>A 16:9 cover and a 1:1 thumbnail. Pick a ratio modifier — the box owns none.</div>
      </div>
    </Card>
  )
}

// Scroll area — overflow container with a slim, token-tinted scrollbar.
function ScrollAreaCard() {
  const items = ['Overview', 'Analytics', 'Audiences', 'Conversions', 'Funnels', 'Retention', 'Revenue', 'Cohorts', 'Attribution', 'Exports']
  return (
    <Card title="Scroll area" desc="Overflow container with a slim, token-tinted scrollbar.">
      <div className="scroll-area" style={{ maxHeight: 136, border: 'var(--k-divider)', borderRadius: 'var(--k-radius-md)', padding: 'var(--k-s-4)' }}>
        {items.map((t) => (
          <button key={t} type="button" className="navrow"><Icon name="chart" /><span className="navrow__label">{t}</span></button>
        ))}
      </div>
    </Card>
  )
}

// SSO brand glyphs — small inline marks so the social buttons are instantly
// recognisable regardless of the chosen icon library (these aren't concepts).
function GoogleGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden style={{ flex: 'none' }}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.8 36.6 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  )
}
function GitHubGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden style={{ flex: 'none' }}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

// Sign in — the screen everyone judges a kit by. SSO row, labelled divider,
// email/password, remember + forgot, primary CTA, footer link.
function LoginCard() {
  return (
    <Card>
      <div className="auth">
        <div className="auth__head">
          <div className="auth__title">Welcome back</div>
          <div className="auth__sub">Sign in to your SupaDash account</div>
        </div>
        <div className="auth__social auth__social--row">
          <button className="btn btn--outline"><GoogleGlyph /> Google</button>
          <button className="btn btn--outline"><GitHubGlyph /> GitHub</button>
        </div>
        <div className="divider-or">or</div>
        <label className="lab" htmlFor="form-email"><span>Email</span><input id="form-email" className="in" type="email" defaultValue="ava@supadash.io" /></label>
        <label className="lab" htmlFor="form-password"><span>Password</span><input id="form-password" className="in" type="password" defaultValue="supersecret" /></label>
        <div className="auth__meta">
          <label className="check" style={{ gap: 6 }}><input type="checkbox" defaultChecked /> Remember me</label>
          <button type="button" className="auth__link">Forgot password?</button>
        </div>
        <button className="btn btn--primary btn--block">Sign in</button>
        <div className="auth__foot">Don't have an account? <button type="button" className="auth__link">Sign up</button></div>
      </div>
    </Card>
  )
}

// Create account — SSO, name/email/password, terms gate on the CTA.
function SignupCard() {
  const [agree, setAgree] = useState(false)
  const [show, setShow] = useState(false)
  const [pwd, setPwd] = useState('')
  const strength = Math.min(3, Math.floor(pwd.length / 4))
  return (
    <Card>
      <div className="auth">
        <div className="auth__head">
          <div className="auth__title">Create your account</div>
          <div className="auth__sub">Start your 14-day free trial — no card needed</div>
        </div>
        <div className="auth__social"><button className="btn btn--outline btn--block"><GoogleGlyph /> Continue with Google</button></div>
        <div className="divider-or">or</div>
        <label className="lab" htmlFor="signup-name"><span>Full name</span><input id="signup-name" className="in" placeholder="Ava Chen" /></label>
        <label className="lab" htmlFor="signup-email"><span>Work email</span><input id="signup-email" className="in" type="email" placeholder="you@company.com" /></label>
        <div className="lab">
          <span>Password</span>
          <div className="pwinput">
            <input id="signup-password" type={show ? 'text' : 'password'} className="pwinput__field" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="At least 8 characters" />
            <button type="button" className="pwinput__eye" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide' : 'Show'}>
              {show ? (
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden><path d="M1 8 C 3 4 5 3 8 3 C 11 3 13 4 15 8 C 13 12 11 13 8 13 C 5 13 3 12 1 8 Z M 1 1 L 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden><path d="M1 8 C 3 4 5 3 8 3 C 11 3 13 4 15 8 C 13 12 11 13 8 13 C 5 13 3 12 1 8 Z" fill="none" stroke="currentColor" strokeWidth="1.4" /><circle cx="8" cy="8" r="2" fill="currentColor" /></svg>
              )}
            </button>
          </div>
          <div className="pwinput__strength">
            {[0, 1, 2].map((i) => (
              <span key={i} className={'pwinput__bar' + (i <= strength ? ' pwinput__bar--on' : '')} data-level={strength} />
            ))}
            <span className="pwinput__label">{strength <= 0 ? 'Too short' : strength === 1 ? 'Weak' : strength === 2 ? 'Fair' : 'Strong'}</span>
          </div>
        </div>
        <label className="check" style={{ gap: 6, alignItems: 'flex-start' }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>I agree to the <button type="button" className="auth__link">Terms</button> &amp; <button type="button" className="auth__link">Privacy Policy</button></span>
        </label>
        <button className="btn btn--primary btn--block" disabled={!agree}>Create account</button>
        <div className="auth__foot">Already have an account? <button type="button" className="auth__link">Sign in</button></div>
      </div>
    </Card>
  )
}

// Lightbox — fullscreen image viewer with prev/next + counter.
const LB_IMAGES = [
  'var(--k-grad-1)',
  'var(--k-grad-2)',
  'var(--k-grad-3)',
  'var(--k-grad-4)',
]
function LightboxCard() {
  const [open, setOpen] = useState<number | null>(null)
  // Real full-screen overlay → owes the modal contract (trap/Escape/scroll-lock/
  // focus-return). Arrow-nav for prev/next is wired on the dialog below.
  const lbRef = useModal<HTMLDivElement>(open !== null, () => setOpen(null))
  return (
    <Card title="Gallery" desc="Click a thumbnail to open the lightbox.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {LB_IMAGES.map((g, i) => (
          <button key={i} onClick={() => setOpen(i)} aria-label={`Open image ${i + 1}`} style={{ aspectRatio: '1', borderRadius: 'var(--k-radius-md)', border: 0, background: g, cursor: 'pointer' }} />
        ))}
      </div>
      {open !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          ref={lbRef}
          tabIndex={-1}
          onClick={() => setOpen(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); setOpen((open + LB_IMAGES.length - 1) % LB_IMAGES.length) }
            else if (e.key === 'ArrowRight') { e.preventDefault(); setOpen((open + 1) % LB_IMAGES.length) }
          }}
        >
          <div className="lightbox__stage" style={{ width: '58%', aspectRatio: '3 / 2', background: LB_IMAGES[open] }} onClick={(e) => e.stopPropagation()} />
          <button className="lightbox__btn lightbox__btn--close" onClick={() => setOpen(null)} aria-label="Close"><Icon name="x" /></button>
          <button className="lightbox__btn lightbox__btn--prev" onClick={(e) => { e.stopPropagation(); setOpen((open + LB_IMAGES.length - 1) % LB_IMAGES.length) }} aria-label="Previous"><Icon name="chevL" /></button>
          <button className="lightbox__btn lightbox__btn--next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % LB_IMAGES.length) }} aria-label="Next"><Icon name="chevR" /></button>
          <div className="lightbox__count">{open + 1} / {LB_IMAGES.length}</div>
        </div>
      )}
    </Card>
  )
}

function DateFieldCard() {
  // Single-date picker — the SAME catalogued popover pattern as DateCard
  // (.popover-wrap + .in--inline trigger + .popover + month-nav + .calendar),
  // in single-select mode. This renders the SHARED <DatePicker> component that
  // the SupaDash app also uses (Projects "Due date", Calendar "jump to date"),
  // so the gallery is the source of truth and the app is built FROM it.
  return (
    <Card title="Due date" desc="Single-date picker — pick a day, popover closes.">
      <label className="lab">
        <span>Due date</span>
        <DatePicker defaultValue="2026-06-12" ariaLabel="Due date" />
      </label>
    </Card>
  )
}

function DateCard() {
  // Date-range picker as a real POPOVER (not a modal): a trigger field opens an
  // anchored panel. Dismissal — useDropdown gives outside-click + Escape; the
  // range auto-closes on the SECOND pick (range complete); focus returns to the
  // trigger every time it closes. Calendar cells are real <button>s (keyboard).
  const { open, setOpen, ref } = useDropdown()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const today = 14
  const [start, setStart] = useState<number | null>(12)
  const [end, setEnd] = useState<number | null>(17)
  const [hover, setHover] = useState<number | null>(null)

  // Focus return: when the popover closes, send focus back to its trigger.
  const wasOpen = useRef(open)
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus()
    wasOpen.current = open
  }, [open])

  const handleClick = (d: number) => {
    if (d < 1 || d > 31 || isBlocked(d)) return
    if (start === null || (start !== null && end !== null)) {
      // 1st pick (or restart after a complete range) → set start, clear end.
      setStart(d); setEnd(null)
    } else {
      // 2nd pick → completes the range → close after a short beat so the user
      // sees it fill in. (A single-date picker would close instantly here.)
      if (d < start) { setEnd(start); setStart(d) } else { setEnd(d) }
      setTimeout(() => setOpen(false), 160)
    }
  }

  const effEnd = end ?? (start !== null && hover !== null && hover >= start ? hover : null)
  const effStart = end === null && start !== null && hover !== null && hover < start ? hover : start
  const days = Array.from({ length: 35 }, (_, i) => i - 2)
  // Blackout dates — a couple of "sold-out" days, so the canonical picker demos
  // the disabled-date state (.calendar__cell--disabled) next to range + today.
  const BLOCKED = new Set([8, 9])
  const isBlocked = (d: number) => BLOCKED.has(d)
  const cellClass = (d: number): string => {
    const parts = ['calendar__cell']
    if (d < 1 || d > 31) parts.push('calendar__cell--out')
    else if (isBlocked(d)) parts.push('calendar__cell--disabled')
    if (d === today) parts.push('calendar__cell--today')
    if (effStart !== null && effEnd !== null) {
      if (d === effStart && d === effEnd) parts.push('calendar__cell--on')
      else if (d === effStart) parts.push('calendar__cell--range-start')
      else if (d === effEnd) parts.push('calendar__cell--range-end')
      else if (d > effStart && d < effEnd) parts.push('calendar__cell--range')
    } else if (start !== null && d === start) {
      parts.push('calendar__cell--on')
    }
    return parts.join(' ')
  }

  const triggerLabel =
    start !== null && end !== null ? `May ${Math.min(start, end)} – ${Math.max(start, end)}`
      : start !== null ? `May ${start} – …`
        : 'Pick dates'
  const summary =
    start !== null && end !== null ? `${Math.abs(end - start) + 1} nights selected`
      : start !== null ? 'Now pick an end date'
        : 'Pick a start date'

  return (
    <Card title="Schedule" desc="Pick the dates for your trip.">
      <div className="popover-wrap" ref={ref} style={{ width: '100%' }}>
        <button
          ref={triggerRef}
          type="button"
          className="in in--inline"
          style={{ width: '100%', cursor: 'pointer' }}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name="cal" />
          <span style={{ flex: 1, textAlign: 'left' }}>{triggerLabel}</span>
          <Icon name="chevD" size={13} />
        </button>
        {open && (
          <div className="popover" role="dialog" aria-label="Choose a date range" style={{ width: 268 }}>
            <div className="calendar__nav">
              <span className="calendar__nav-title">May 2026</span>
              <span className="calendar__nav-btns">
                <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Previous month"><Icon name="chevL" /></button>
                <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Next month"><Icon name="chevR" /></button>
              </span>
            </div>
            <div className="calendar" onMouseLeave={() => setHover(null)}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} className="calendar__head">{d}</span>
              ))}
              {days.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  className={cellClass(d)}
                  disabled={d < 1 || d > 31 || isBlocked(d)}
                  aria-label={d >= 1 && d <= 31 ? `May ${d}${isBlocked(d) ? ' (unavailable)' : ''}` : undefined}
                  aria-current={d === today ? 'date' : undefined}
                  onClick={() => handleClick(d)}
                  onMouseEnter={() => d >= 1 && d <= 31 && setHover(d)}
                >
                  {d >= 1 && d <= 31 ? d : ''}
                </button>
              ))}
            </div>
            <div className="card__row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 'var(--k-type-caption)', color: 'var(--k-fg-muted)' }}>{summary}</span>
              {(start !== null || end !== null) && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setStart(null); setEnd(null) }}>Clear</button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// === Round 2: extended shadcn parity ===

function ComboboxCard() {
  const FRAMEWORKS = ['Next.js', 'Remix', 'Astro', 'SvelteKit', 'Nuxt', 'Vite', 'Solid Start']
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<string | null>('Next.js')
  // Custom Select dismiss — outside-click + Escape via the shared controller.
  const { open, setOpen, ref } = useDropdown()
  const matches = FRAMEWORKS.filter((f) => f.toLowerCase().includes(q.toLowerCase()))
  return (
    <Card title="Framework" desc="Choose a starter for your app.">
      <div className="combobox" ref={ref}>
        <button type="button" className="select-trigger" onClick={() => setOpen((v) => !v)} role="combobox" aria-haspopup="listbox" aria-expanded={open}>
          <span>{picked ?? 'Select a framework…'}</span>
          <Icon name="chevD" />
        </button>
        {open && (
          <div className="combobox__pop">
            <div className="cmdp__in" style={{ borderBottom: 'var(--k-divider)' }}>
              <Icon name="search" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" />
            </div>
            {matches.length === 0 ? (
              <div className="combobox__empty">No results.</div>
            ) : (
              <ul className="combobox__list" role="listbox" aria-label="Frameworks">
                {matches.map((f) => (
                  <li
                    key={f}
                    role="option"
                    aria-selected={picked === f}
                    className={`combobox__item ${picked === f ? 'combobox__item--selected' : ''}`}
                    onClick={() => { setPicked(f); setOpen(false); setQ('') }}
                  >
                    <span className="combobox__check">{picked === f ? '✓' : ''}</span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <button className="btn btn--primary btn--block" disabled={!picked}>Continue</button>
    </Card>
  )
}

function DropdownMenuCard() {
  const [open, setOpen] = useState(true)
  const [notify, setNotify] = useState(true)
  const [sync, setSync] = useState(false)
  return (
    <Card title="Account" desc="Open the menu for more options.">
      <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
        <button className="btn btn--ghost btn--icon btn--sm" onClick={() => setOpen((v) => !v)} aria-label="Open menu">
          <Icon name="dots" />
        </button>
      </div>
      {open && (
        <div className="menu" role="menu" style={{ alignSelf: 'flex-end' }}>
          <div className="menu__label">Account</div>
          <button className="menu__item" role="menuitem">
            <Icon name="edit" /> Edit profile
            <span className="menu__shortcut">⌘E</span>
          </button>
          <button className="menu__item" role="menuitem">
            <Icon name="cog" /> Preferences
            <span className="menu__shortcut">⌘,</span>
          </button>
          <div className="menu__sep" />
          <div className="menu__label">Preferences</div>
          <button
            className={`menu__item ${notify ? 'menu__item--check' : 'menu__item--uncheck'}`}
            onClick={() => setNotify((v) => !v)}
            role="menuitemcheckbox"
            aria-checked={notify}
          >
            Email notifications
          </button>
          <button
            className={`menu__item ${sync ? 'menu__item--check' : 'menu__item--uncheck'}`}
            onClick={() => setSync((v) => !v)}
            role="menuitemcheckbox"
            aria-checked={sync}
          >
            Auto-sync enabled
          </button>
          <div className="menu__sep" />
          <button className="menu__item menu__item--danger" role="menuitem">
            <Icon name="trash" /> Delete account
          </button>
        </div>
      )}
    </Card>
  )
}

function StepperCard() {
  const [step, setStep] = useState(2)
  const labels = ['Account', 'Workspace', 'Invite', 'Done']
  return (
    <Card wide title="Get started" desc="Set up your account in a few steps.">
      <div className="stepper" role="list" aria-label={`Setup progress: step ${step + 1} of ${labels.length}`}>
        {labels.map((label, i) => (
          <div
            key={label}
            role="listitem"
            aria-current={i === step ? 'step' : undefined}
            className={`stepper__step ${i < step ? 'stepper__step--done' : ''} ${i === step ? 'stepper__step--current' : ''}`}
          >
            <span className="stepper__dot">{i < step ? <Icon name="check" /> : i + 1}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="card__row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <button className="btn btn--ghost btn--sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </button>
        <button className="btn btn--primary btn--sm" onClick={() => setStep((s) => Math.min(labels.length - 1, s + 1))} disabled={step === labels.length - 1}>
          Next step
        </button>
      </div>
      <button className="btn btn--primary btn--block" disabled={step !== labels.length - 1}>
        <Icon name="check" /> Finish setup
      </button>
    </Card>
  )
}

function DropzoneCard() {
  const [over, setOver] = useState(false)
  return (
    <Card title="Upload files" desc="Attach documents to this record.">
      <label
        className={`dropzone ${over ? 'dropzone--over' : ''}`}
        onDragEnter={(e) => { e.preventDefault(); setOver(true) }}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false) }}
      >
        <span className="dropzone__icon"><Icon name="upload" /></span>
        <span className="dropzone__title">Drop files or click to browse</span>
        <span className="dropzone__hint">PNG, JPG, PDF — up to 10 MB</span>
        <input type="file" hidden aria-label="Upload images or documents" />
      </label>
      <div className="card__row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="avatar-group">
            <span className="avatar avatar--sm avatar--a1">AB</span>
            <span className="avatar avatar--sm avatar--a2">CD</span>
            <span className="avatar avatar--sm avatar--a4">EF</span>
            <span className="avatar-group__more">+2</span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Shared with team</span>
        </span>
        <button className="btn btn--primary btn--sm">
          <span className="spinner" style={{ borderTopColor: 'currentColor' }} />
          Uploading…
        </button>
      </div>
    </Card>
  )
}

type ToastTone = 'success' | 'info' | 'warn' | 'error'
interface ToastEntry { id: number; tone: ToastTone; title: string; sub: string }

const TOAST_PRESETS: Record<ToastTone, Omit<ToastEntry, 'id' | 'tone'>> = {
  success: { title: 'Saved', sub: 'Changes synced just now.' },
  info:    { title: 'New version', sub: 'v2.4.0 is available.' },
  warn:    { title: 'Heads up', sub: 'API quota at 78%.' },
  error:   { title: 'Upload failed', sub: 'Network error — please retry.' },
}
const TOAST_ICON: Record<ToastTone, IconName> = { success: 'check', info: 'info', warn: 'info', error: 'x' }

function ToastStackCard() {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))
  const fire = (tone: ToastTone) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, tone, ...TOAST_PRESETS[tone] }])
    // Auto-dismiss after 4s — feels like a real toast without manual cleanup
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }
  return (
    <Card title="Toast" desc="Trigger a sample notification.">
      <div className="card__row" style={{ flexWrap: 'wrap', gap: 6 }}>
        <button className="btn btn--ghost btn--sm" onClick={() => fire('success')}>
          <Icon name="check" /> Success
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => fire('info')}>
          <Icon name="info" /> Info
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => fire('warn')}>
          <Icon name="info" /> Warn
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => fire('error')}>
          <Icon name="x" /> Error
        </button>
      </div>
      <div className="toast-demo-frame">
        {toasts.length === 0 && (
          <span className="toast-demo-frame__empty">Trigger a toast above ↑</span>
        )}
        <div className="toast-stack">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast--${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
              <Icon name={TOAST_ICON[t.tone]} />
              <div className="toast__body">
                <div className="toast__title">{t.title}</div>
                <div className="toast__sub">{t.sub}</div>
              </div>
              <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <Icon name="x" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function TagInputCard() {
  const [tags, setTags] = useState(['design', 'frontend', 'open-source'])
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setDraft('')
  }
  return (
    <Card title="Topics" desc="Tag this post so people can find it.">
      <div className="taginput">
        {tags.map((t) => (
          <span key={t} className="taginput__chip">
            {t}
            <button type="button" className="taginput__remove" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
              <Icon name="x" size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
          onBlur={add}
          placeholder={tags.length === 0 ? 'Add tags…' : ''}
        />
      </div>
      <span style={{ fontSize: 11, color: 'var(--k-fg-faint)' }}>Enter or , to add</span>
      <div className="card__foot">
        <button className="btn btn--primary btn--block">Save topics</button>
      </div>
    </Card>
  )
}

/* Radio card — selectable option cards (radio + body + trailing meta).
 * System component, reuses the .radio dot. Delivery, plans, payment methods. */
function RadioCardCard() {
  const [val, setVal] = useState('std')
  const opts = [
    { id: 'std', title: 'Standard', desc: '2–3 business days', meta: 'Free' },
    { id: 'exp', title: 'Express', desc: 'Next business day', meta: '€9.95' },
    { id: 'pick', title: 'Pickup point', desc: 'Ready in 1 hour nearby', meta: 'Free' },
  ]
  return (
    <Card title="Radio card" desc="Selectable option cards — delivery, plans, payment.">
      <div className="radio-cards">
        {opts.map((o) => (
          <label key={o.id} className={'radio-card' + (val === o.id ? ' radio-card--on' : '')}>
            <span className="radio"><input type="radio" name="rc-demo" checked={val === o.id} onChange={() => setVal(o.id)} /></span>
            <span className="radio-card__body"><span className="radio-card__title">{o.title}</span><span className="radio-card__desc">{o.desc}</span></span>
            <span className="radio-card__meta">{o.meta}</span>
          </label>
        ))}
      </div>
    </Card>
  )
}

/* Slot picker — time-slot grid for booking / scheduling. Generic primitive:
 * available / selected / disabled states. Pairs with the date picker. */
function SlotPickerCard() {
  const [slot, setSlot] = useState('10:30')
  const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00']
  const off = new Set(['11:00', '13:00'])
  return (
    <Card title="Slot picker" desc="Time-slot grid for booking — available, selected, disabled.">
      <div className="slotpicker">
        {slots.map((t) => (
          <button key={t} type="button" className={'slot' + (off.has(t) ? ' slot--off' : slot === t ? ' slot--on' : '')} onClick={() => !off.has(t) && setSlot(t)}>{t}</button>
        ))}
      </div>
    </Card>
  )
}

function DescriptionListCard() {
  return (
    <Card title="Subscription" desc="Your current plan and usage.">
      <dl className="dl">
        <dt>Plan</dt>
        <dd>Team — $48/mo</dd>
        <dt>Member since</dt>
        <dd>March 2024</dd>
        <dt>Storage</dt>
        <dd>14.2 GB of 25 GB</dd>
        <dt>Plan status</dt>
        <dd>
          <StatusBadge tone="warn" label="Trial" />{' '}
          <StatusBadge tone="danger" label="Past due" />
        </dd>
        <dt>Status</dt>
        <dd>
          <span className="badge badge--neutral">
            <span className="badge__dot" style={{ background: 'var(--k-success)' }} /> Active
          </span>
        </dd>
      </dl>
      <div className="card__foot">
        <button className="btn btn--primary btn--block">
          <Icon name="spark" /> Upgrade plan
        </button>
        <button className="btn btn--ghost btn--block">Manage subscription</button>
        <button className="btn btn--ghost btn--block">Cancel plan</button>
      </div>
    </Card>
  )
}

function BannerCard() {
  const [open, setOpen] = useState(true)
  if (!open) {
    return (
      <Card wide title="Maintenance">
        <button className="btn btn--ghost btn--sm" onClick={() => setOpen(true)}>
          Restore banner
        </button>
      </Card>
    )
  }
  return (
    <Card wide title="Maintenance">
      <div className="banner banner--warn" role="status" style={{ borderRadius: 'var(--k-radius-md)' }}>
        <Icon name="info" />
        <div className="banner__body">
          <strong>Scheduled maintenance</strong> — site will be read-only Friday 02:00–04:00 UTC.{' '}
          <a className="banner__link" href="#">Learn more</a>
        </div>
        <button className="banner__close" aria-label="Dismiss" onClick={() => setOpen(false)}>
          <Icon name="x" />
        </button>
      </div>
    </Card>
  )
}

function AlertDialogCard() {
  const [open, setOpen] = useState(true)
  return (
    <Card title="Confirm delete" desc="A confirm step before destructive actions.">
      <div className="card__row">
        <button className="btn btn--ghost btn--sm" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : 'Open destructive confirm'}
        </button>
      </div>
      <div className="dialog-frame">
        {open ? (
          <>
            <div className="dialog-frame__backdrop" onClick={() => setOpen(false)} />
            <div className="dialog dialog--alert" role="alertdialog" aria-modal="true" aria-labelledby="alert-title">
              <span className="dialog__icon"><Icon name="trash" /></span>
              <h3 id="alert-title" className="dialog__title">Delete project?</h3>
              <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: 0 }}>
                This will permanently delete <strong>ai-router</strong>, its history, and 12 deployed environments. Cannot be undone.
              </p>
              <div className="card__row" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>Cancel</button>
                <button className="btn btn--danger btn--sm" onClick={() => setOpen(false)}>
                  <Icon name="trash" /> Yes, delete
                </button>
              </div>
            </div>
          </>
        ) : (
          <span style={{ color: 'var(--k-fg-faint)', fontSize: 'var(--k-type-small)' }}>Confirmation closed</span>
        )}
      </div>
    </Card>
  )
}

/* === Input OTP — paste-aware 6-digit code entry ============================
 * UX patterns supported (all standard for OTP UI in 2025):
 *  1. Single-digit auto-advance — type a digit, focus jumps to next slot.
 *  2. Backspace-back — empty slot + Backspace returns focus to previous slot.
 *  3. Paste distribution — Cmd+V a code like "459382" anywhere in the row
 *     spreads each digit into the correct slot. Works for codes pasted from
 *     email, password managers, or 1Password.
 *  4. iOS SMS autofill — autoComplete="one-time-code" on slot 0 lets iOS
 *     surface the SMS code suggestion above the keyboard (gratis OS feature).
 *  5. Numeric keyboard on mobile — inputMode="numeric" + pattern="\d*".
 *
 * The HTML attributes (autoComplete, inputMode, pattern) are the "design
 * system" half — they're our shipped markup. The onPaste handler is the
 * behavior half — a small JS helper. Both together = the modern OTP UX
 * everyone copies from shadcn-otp / react-otp-input / etc. */
function InputOtpCard() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const set = (i: number, v: string) => {
    // Strip non-digits so accidental letters don't pollute the row.
    const digit = v.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[i] = digit
    setCode(next)
    if (digit && i < 5) refs[i + 1]?.current?.focus()
  }
  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      refs[i - 1]?.current?.focus()
    }
  }
  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    e.preventDefault()
    const next = ['', '', '', '', '', '']
    text.split('').forEach((d, idx) => { next[idx] = d })
    setCode(next)
    refs[Math.min(text.length, 5)]?.current?.focus()
  }
  return (
    <Card title="Verify your email" desc="Paste the 6-digit code we sent you.">
      <div className="otp" onPaste={onPaste}>
        {code.slice(0, 3).map((c, i) => (
          <input
            key={i}
            ref={refs[i]}
            className="otp__slot"
            value={c}
            maxLength={1}
            inputMode="numeric"
            pattern="\d*"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
          />
        ))}
        <span className="otp__sep">–</span>
        {code.slice(3).map((c, i) => {
          const idx = i + 3
          return (
            <input
              key={idx}
              ref={refs[idx]}
              className="otp__slot"
              value={c}
              maxLength={1}
              inputMode="numeric"
              pattern="\d*"
              autoComplete="off"
              onChange={(e) => set(idx, e.target.value)}
              onKeyDown={(e) => onKeyDown(idx, e)}
            />
          )
        })}
      </div>
      <button className="btn btn--primary btn--block" disabled={code.some((c) => !c)}>
        <Icon name="check" /> Verify
      </button>
      <div className="card__row" style={{ justifyContent: 'center' }}>
        <button className="btn btn--link btn--sm">Resend code</button>
      </div>
    </Card>
  )
}

/* === Composer (#112) =================================================
 * AI/chat input bar — the pattern from ChatGPT, Claude, Cursor, Lovable.
 * Multi-line textarea on top, two-zone toolbar below:
 *   Left: [+] attach + tool chips (Files, Search, Tools)
 *   Right: [mic] voice + [↑] send (primary, animates from disabled→active)
 * Container has the crisp/tactile signature: 2-tone sunken bg + hairline. */
function AttachmentChip({
  kind, label, meta,
}: {
  kind: 'file' | 'link' | 'audio' | 'image'
  label: string
  meta: string
}) {
  return (
    <span className={'att-chip att-chip--' + kind}>
      <span className="att-chip__thumb">
        {kind === 'file' && <Icon name="file" />}
        {kind === 'link' && (
          <svg width="11" height="11" viewBox="0 0 14 14" aria-hidden>
            <path d="M5 9 L9 5 M5 4 H4 a3 3 0 0 0 0 6 H6 M9 10 H10 a3 3 0 0 0 0-6 H8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        )}
        {kind === 'audio' && <Icon name="bell" />}
        {kind === 'image' && (
          <svg width="11" height="11" viewBox="0 0 14 14" aria-hidden>
            <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="5" cy="6" r="1" fill="currentColor" />
            <path d="M2 10 L5 7.5 L8 9.5 L12 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="att-chip__body">
        <span className="att-chip__label">{label}</span>
        <span className="att-chip__meta">{meta}</span>
      </span>
      <button className="att-chip__x" aria-label="Remove">×</button>
    </span>
  )
}
function AttachmentChipCard() {
  return (
    <Card title="Attachments" desc="Files shared in this thread.">
      <div className="att-chip-stack">
        <AttachmentChip kind="file" label="Q3-forecast.pdf" meta="2.4 MB · PDF" />
        <AttachmentChip kind="link" label="figma.com/file/…" meta="Pricing v3" />
        <AttachmentChip kind="audio" label="standup.m4a" meta="0:42" />
        <AttachmentChip kind="image" label="hero-mockup.png" meta="1.2 MB" />
      </div>
      <div className="card__row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn--ghost btn--sm">
          <Icon name="plus" /> Add files
        </button>
        <button className="btn btn--secondary btn--sm">Download all</button>
      </div>
    </Card>
  )
}

function FileGridCard() {
  const files = [
    { name: 'hero-banner.png', size: '2.4 MB', badge: 'PNG', tone: 'success' as const },
    { name: 'brand-deck-q2.pdf', size: '8.1 MB', badge: 'PDF', tone: 'danger' as const },
    { name: 'onboarding.mp4', size: '24.7 MB', badge: 'MP4', tone: 'warn' as const },
    { name: 'design-system.fig', size: '12.3 MB', badge: 'FIG', tone: 'info' as const },
  ]
  return (
    <Card wide title="Files" desc="Recently uploaded assets.">
      <nav className="breadcrumb">
        <a href="#">Workspace</a>
        <Icon name="chevR" />
        <a href="#">Northwind</a>
        <Icon name="chevR" />
        <span>Files</span>
      </nav>
      <div className="filegrid filegrid--2">
        {files.map((f) => (
          <button key={f.name} className="filegrid__tile">
            <div className="filegrid__cover"><Icon name="file" /></div>
            <div className="filegrid__row">
              <span className="filegrid__name">{f.name}</span>
              <span className={`badge badge--${f.tone}`}>{f.badge}</span>
            </div>
            <span className="filegrid__meta">{f.size}</span>
          </button>
        ))}
      </div>
      <button className="btn btn--primary btn--block">
        <Icon name="upload" /> Upload files
      </button>
    </Card>
  )
}


/* === MobileTabBar (Tier 4 #2) ========================================
 * 3-5 tabs onderaan met icon+label, active tab krijgt primary color.
 * Anders dan onze sidebar nav: mobiel-formaat, equal-width grid, label
 * onder icon (Netflix/IMDb pattern). */
function NumberInputCard() {
  const [v, setV] = useState(12)
  const [px, setPx] = useState(16)
  return (
    <Card title="Quantity" desc="Adjust amounts with steppers.">
      <div className="numinput">
        <button className="numinput__step" onClick={() => setV((n) => Math.max(0, n - 1))} aria-label="Decrement">−</button>
        <input className="numinput__field" value={v} onChange={(e) => { const n = parseInt(e.target.value, 10); if (!isNaN(n)) setV(n) }} />
        <button className="numinput__step" onClick={() => setV((n) => n + 1)} aria-label="Increment">+</button>
      </div>
      <div className="numinput numinput--with-suffix">
        <input className="numinput__field" value={px} onChange={(e) => { const n = parseInt(e.target.value, 10); if (!isNaN(n)) setPx(n) }} />
        <span className="numinput__suffix">px</span>
        <div className="numinput__steps">
          <button className="numinput__chev" onClick={() => setPx((n) => n + 1)} aria-label="Increment">
            <svg width="9" height="6" viewBox="0 0 10 6"><path d="M1 5 L5 1.5 L9 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button className="numinput__chev" onClick={() => setPx((n) => Math.max(0, n - 1))} aria-label="Decrement">
            <svg width="9" height="6" viewBox="0 0 10 6"><path d="M1 1.5 L5 5 L9 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
      <div className="card__foot">
        <button className="btn btn--primary btn--block">
          <Icon name="check" /> Add to cart
        </button>
      </div>
    </Card>
  )
}

/* === PasswordInput (Tier 4 #6) =======================================
 * Eye toggle to show/hide. Strength indicator (3-bar) optional via
 * .pwinput__strength. We render with a moderate-strength password to
 * showcase the bar — real apps swap colors based on zxcvbn score. */
function PasswordInputCard() {
  const [show, setShow] = useState(false)
  const [pwd, setPwd] = useState('Sunset-42!')
  const strength = Math.min(3, Math.floor(pwd.length / 4))
  return (
    <Card title="Set a password" desc="Use at least 8 characters.">
      <div className="pwinput">
        <input
          type={show ? 'text' : 'password'}
          className="pwinput__field"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="At least 8 characters"
        />
        <button className="pwinput__eye" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide' : 'Show'}>
          {show ? (
            <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden><path d="M1 8 C 3 4 5 3 8 3 C 11 3 13 4 15 8 C 13 12 11 13 8 13 C 5 13 3 12 1 8 Z M 1 1 L 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden><path d="M1 8 C 3 4 5 3 8 3 C 11 3 13 4 15 8 C 13 12 11 13 8 13 C 5 13 3 12 1 8 Z" fill="none" stroke="currentColor" strokeWidth="1.4" /><circle cx="8" cy="8" r="2" fill="currentColor" /></svg>
          )}
        </button>
      </div>
      <div className="pwinput__strength">
        {[0, 1, 2].map((i) => (
          <span key={i} className={'pwinput__bar' + (i <= strength ? ' pwinput__bar--on' : '')} data-level={strength} />
        ))}
        <span className="pwinput__label">
          {strength <= 0 ? 'Too short' : strength === 1 ? 'Weak' : strength === 2 ? 'Fair' : 'Strong'}
        </span>
      </div>
      <div className="card__foot">
        <button className="btn btn--primary btn--block" disabled={strength < 2}>Update password</button>
      </div>
    </Card>
  )
}

/* === SearchInput (Tier 4 #7) =========================================
 * Leading magnifier + clear button (× appears when text). Optional
 * suggestions dropdown — we render it inline as the focused state for
 * gallery showcasing. */
function SearchInputCard() {
  const [q, setQ] = useState('astro')
  const matches = ['Astro', 'Astro 5.0 release notes', 'Astro vs Next.js', 'Astro DB beta']
  return (
    <Card title="Search docs">
      <div className="searchinput">
        <Icon name="search" />
        <input
          className="searchinput__field"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search docs…"
        />
        {q && (
          <button className="searchinput__clear" onClick={() => setQ('')} aria-label="Clear">
            ×
          </button>
        )}
        <kbd className="searchinput__kbd">⌘K</kbd>
      </div>
      {q && (
        <div className="searchinput__sugg">
          <div className="searchinput__group">Suggestions</div>
          {matches.map((m, i) => (
            <button key={m} className={'searchinput__item' + (i === 0 ? ' searchinput__item--on' : '')}>
              <Icon name="search" />
              <span>{m}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

/* === PhoneInput (Tier 4 #8) ==========================================
 * Country code picker (flag + +XX) + national number formatter. The
 * picker is a button that opens a list of countries; for the gallery
 * card we render NL selected. */
function PhoneInputCard() {
  const [num, setNum] = useState('6 12 34 56 78')
  return (
    <Card title="Phone number" desc="We'll text a code to confirm it.">
      <div className="phoneinput">
        <button className="phoneinput__country" aria-label="Country">
          <span className="phoneinput__flag" aria-hidden>🇳🇱</span>
          <span className="phoneinput__code">+31</span>
          <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden><path d="M1 1 L5 5 L9 1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        </button>
        <input
          className="phoneinput__field"
          value={num}
          onChange={(e) => setNum(e.target.value)}
          placeholder="6 12 34 56 78"
        />
      </div>
      <div className="phoneinput phoneinput--invalid">
        <button className="phoneinput__country" aria-label="Country">
          <span className="phoneinput__flag" aria-hidden>🇺🇸</span>
          <span className="phoneinput__code">+1</span>
          <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden><path d="M1 1 L5 5 L9 1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        </button>
        <input
          className="phoneinput__field"
          value="555-013"
          readOnly
          aria-invalid="true"
        />
      </div>
      <div style={{ fontSize: 11, color: 'var(--k-danger)' }}>Enter a valid 10-digit number.</div>
      <button className="btn btn--primary btn--block">
        <Icon name="bell" /> Send code
      </button>
    </Card>
  )
}
/* === SettingsRow (Tier 4 #9) =========================================
 * Hostinger admin pattern: label + description left, control right.
 * Three variants: toggle, button, inline badge. Stacks via repeat
 * with hairline dividers. */
function SettingsRowCard() {
  const [https, setHttps] = useState(true)
  const [maint, setMaint] = useState(false)
  return (
    <Card wide title="Website settings" desc="Performance and security options.">
      <div className="list list--settings">
        <div className="list__item">
          <div className="list__body">
            <div className="list__title">Force HTTPS</div>
            <div className="list__sub">Redirect all website requests over HTTPS.</div>
          </div>
          <div className={'toggle ' + (https ? 'toggle--on' : '')} onClick={() => setHttps((v) => !v)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHttps((v) => !v) } }} role="switch" aria-checked={https} tabIndex={0}>
            <div className="toggle__knob" />
          </div>
        </div>
        <div className="list__item">
          <div className="list__body">
            <div className="list__title">Maintenance mode</div>
            <div className="list__sub">Other users will not be able to discover your content.</div>
          </div>
          <div className={'toggle ' + (maint ? 'toggle--on' : '')} onClick={() => setMaint((v) => !v)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMaint((v) => !v) } }} role="switch" aria-checked={maint} tabIndex={0}>
            <div className="toggle__knob" />
          </div>
        </div>
        <div className="list__item">
          <div className="list__body">
            <div className="list__title">
              LiteSpeed <span className="badge badge--primary" style={{ marginLeft: 'var(--k-s-6)' }}>Recommended</span>
            </div>
            <div className="list__sub">Increase performance with cache-engine.</div>
          </div>
          <button className="btn btn--ghost btn--sm">Install</button>
        </div>
      </div>
      <div className="card__foot">
        <button className="btn btn--primary btn--block">Save changes</button>
      </div>
    </Card>
  )
}

/* === InfoCard (Tier 4 #10) ===========================================
 * Compact label + value tile, often stacked in a right sidebar. Three
 * variants: with badge, with link, with raw value. */
function InfoCardCard() {
  return (
    <Card title="Hosting details" desc="Your server at a glance.">
      <div className="info-card">
        <div className="info-card__label">Database</div>
        <a className="info-card__value info-card__value--link" href="#">u609103235_ZZV9m ↗</a>
      </div>
      <div className="info-card">
        <div className="info-card__label">Daily Backup</div>
        <StatusBadge tone="success" label="Enabled" />
      </div>
      <div className="info-card">
        <div className="info-card__label">SSL certificate</div>
        <StatusBadge tone="warn" label="Expiring soon" />
      </div>
      <div className="info-card">
        <div className="info-card__label">Firewall</div>
        <StatusBadge tone="danger" label="Action needed" />
      </div>
      <div className="info-card">
        <div className="info-card__label">CDN</div>
        <StatusBadge tone="info" label="Maintenance" />
      </div>
      <div className="info-card">
        <div className="info-card__label">PHP Version</div>
        <span className="badge badge--neutral">7.4</span>
      </div>
      <div className="info-card">
        <div className="info-card__label">WordPress Version</div>
        <div>
          <span className="badge badge--neutral">5.9</span>
          <div style={{ fontSize: 11, color: 'var(--k-fg-muted)', marginTop: 4 }}>You're running the latest.</div>
        </div>
      </div>
      <div className="card__foot">
        <button className="btn btn--primary btn--block">
          <Icon name="cog" /> Manage hosting
        </button>
        <button className="btn btn--ghost btn--block">
          <Icon name="trash" /> Delete site
        </button>
      </div>
    </Card>
  )
}

/* === List (Tier 4 #16) ===============================================
 * Generic list primitive with sections, leading slot (icon/avatar),
 * trailing slot (chevron/count/value), and divider between items.
 * The pattern that powers settings lists, contact lists, file rows. */
function ListCard() {
  return (
    <Card title="Library" desc="Your files and account.">
      <div className="list">
        <div className="list__section">Storage</div>
        <button className="list__item">
          <span className="list__lead list__lead--icon"><Icon name="file" /></span>
          <div className="list__body">
            <div className="list__title">Documents</div>
            <div className="list__sub">42 files · 1.4 GB</div>
          </div>
          <span className="list__trail">
            <svg width="7" height="11" viewBox="0 0 7 11" aria-hidden><path d="M1 1 L6 5.5 L1 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </button>
        <button className="list__item">
          <span className="list__lead list__lead--icon"><Icon name="file" /></span>
          <div className="list__body">
            <div className="list__title">Photos</div>
            <div className="list__sub">218 files · 4.2 GB</div>
          </div>
          <span className="list__trail">
            <svg width="7" height="11" viewBox="0 0 7 11" aria-hidden><path d="M1 1 L6 5.5 L1 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </button>
        <div className="list__section">Account</div>
        <button className="list__item">
          <span className="list__lead list__lead--avatar">MK</span>
          <div className="list__body">
            <div className="list__title">Mira Kuiper</div>
            <div className="list__sub">mira@example.com</div>
          </div>
          <span className="list__trail list__trail--text">Edit</span>
        </button>
      </div>
      <div className="card__foot">
        <button className="btn btn--ghost btn--block">Manage storage</button>
        <button className="btn btn--ghost btn--block">Sign out</button>
      </div>
    </Card>
  )
}

/* === Timeline (Tier 4 #17) ===========================================
 * Vertical events with dots + connecting line. Dots are filled when
 * complete, ringed when current, hollow when future. Each event has
 * a time, title, optional description. Activity feeds, build history,
 * version logs. */
function TimelineCard() {
  return (
    <Card title="Release progress" desc="Where v2.4.0 is in the pipeline.">
      <ol className="timeline">
        <li className="timeline__item timeline__item--done">
          <span className="timeline__dot"><Icon name="check" /></span>
          <div className="timeline__body">
            <div className="timeline__head"><span className="timeline__title">v2.4.0 deployed</span><span className="timeline__time">2 min ago</span></div>
            <div className="timeline__desc">Production · 12 services updated</div>
          </div>
        </li>
        <li className="timeline__item timeline__item--current">
          <span className="timeline__dot"><span className="timeline__pulse" /></span>
          <div className="timeline__body">
            <div className="timeline__head"><span className="timeline__title">Running tests</span><span className="timeline__time">in progress</span></div>
            <div className="timeline__desc">348 / 412 passed</div>
          </div>
        </li>
        <li className="timeline__item">
          <span className="timeline__dot" />
          <div className="timeline__body">
            <div className="timeline__head"><span className="timeline__title">Build artifacts</span></div>
            <div className="timeline__desc">Pending — waits on test pass</div>
          </div>
        </li>
        <li className="timeline__item">
          <span className="timeline__dot" />
          <div className="timeline__body">
            <div className="timeline__head"><span className="timeline__title">Notify subscribers</span></div>
          </div>
        </li>
      </ol>
      <button className="btn btn--outline btn--block">View full pipeline</button>
    </Card>
  )
}

/* === CodeBlock (Tier 4 #18) ==========================================
 * Multi-line code with line numbers + horizontal scroll. Header has
 * filename + copy button. No syntax highlighting in MVP — use the
 * --k-fg color and let monospace + tabular-nums do the work. */
function CodeBlockCard() {
  const [copied, setCopied] = useState(false)
  const lines = [
    'import { buildTokens } from "@uicockpit/tokens"',
    '',
    'const tokens = buildTokens({',
    '  density: "default",',
    '  radius:  "soft",',
    '  motion:  "smooth",',
    '})',
    '',
    'document.documentElement.style.cssText = ',
    '  Object.entries(tokens.vars)',
    '    .map(([k, v]) => `${k}:${v}`).join(";")',
  ]
  return (
    <Card wide title="Quick start" desc="Drop this into your project.">
      <div className="codeblock">
        <div className="codeblock__head">
          <span className="codeblock__file">tokens.ts</span>
          <button
            className="codeblock__copy"
            aria-label={copied ? 'Copied to clipboard' : 'Copy code'}
            onClick={() => {
              navigator.clipboard?.writeText(lines.join('\n'))
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
          >
            {copied ? (
              <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden><path d="M2 6.5 L 5 9.5 L 10 2.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden><path d="M3 1 H 9 V 8 M 1 3 H 7 V 11 H 1 Z" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
            )}
            <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre className="codeblock__pre">
          {lines.map((line, i) => (
            <code key={i} className="codeblock__line">
              <span className="codeblock__gutter">{i + 1}</span>
              <span className="codeblock__text">{line || ' '}</span>
            </code>
          ))}
        </pre>
      </div>
      <div className="card__row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn--link btn--sm">Read the docs</button>
        <button className="btn btn--secondary btn--sm">
          <Icon name="file" /> Copy snippet
        </button>
      </div>
    </Card>
  )
}
/* === Pricing (Tier 4 #12) — composed demo, no new CSS ===
 * 3 tiers met featured middle highlighted. Bouwt op .card + .btn + .badge.
 * Layout via flex column; no inline plan-specific CSS. */
function PricingCardCard() {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const yearly = cycle === 'yearly'
  // Annual = ~2 months free (20% off) — the conventional SaaS discount.
  const amt = (mo: number) => (mo === 0 ? '$0' : yearly ? `$${Math.round(mo * 12 * 0.8)}` : `$${mo}`)
  const per = yearly ? '/yr' : '/mo'
  return (
    <Card xwide title="Plans" desc="Pick what fits your team.">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <div className="segctrl" role="radiogroup" aria-label="Billing cycle" style={{ width: 'fit-content' }}>
          <button className={`segctrl__btn ${!yearly ? 'segctrl__btn--on' : ''}`} role="radio" aria-checked={!yearly} onClick={() => setCycle('monthly')}>Monthly</button>
          <button className={`segctrl__btn ${yearly ? 'segctrl__btn--on' : ''}`} role="radio" aria-checked={yearly} onClick={() => setCycle('yearly')}>Yearly</button>
        </div>
        <span style={{ fontSize: 'var(--k-type-caption)', color: 'var(--k-fg-muted)' }}>Save 20% with annual billing</span>
      </div>
      <div className="pricing">
        <div className="pricing__tier">
          <div className="pricing__name">Starter</div>
          <div className="pricing__price"><span className="pricing__amount">{amt(0)}</span><span className="pricing__period">{per}</span></div>
          <ul className="pricing__feats">
            <li>3 projects</li>
            <li>10K monthly tokens</li>
            <li>Community support</li>
          </ul>
          <button className="btn btn--ghost" style={{ width: '100%' }}>Get started</button>
        </div>
        <div className="pricing__tier pricing__tier--featured">
          <span className="pricing__badge">Popular</span>
          <div className="pricing__name">Pro</div>
          <div className="pricing__price"><span className="pricing__amount">{amt(19)}</span><span className="pricing__period">{per}</span></div>
          <ul className="pricing__feats">
            <li>Unlimited projects</li>
            <li>500K monthly tokens</li>
            <li>Priority support</li>
            <li>Advanced exports</li>
          </ul>
          <button className="btn btn--primary" style={{ width: '100%' }}>Start free trial</button>
        </div>
        <div className="pricing__tier">
          <div className="pricing__name">Team</div>
          <div className="pricing__price"><span className="pricing__amount">{amt(49)}</span><span className="pricing__period">{per}</span></div>
          <ul className="pricing__feats">
            <li>Everything in Pro</li>
            <li>Collaboration</li>
            <li>SSO</li>
            <li>SLA</li>
          </ul>
          <button className="btn btn--ghost" style={{ width: '100%' }}>Contact sales</button>
        </div>
      </div>
    </Card>
  )
}

/* === StatGroup (Tier 4 #14) — composed demo ===
 * Multi-metric horizontale strip — 4 metrics naast elkaar met dividers.
 * Pakt grote nummers + kleine labels. Vaak een hero stat-strip. */
function StatGroupCard() {
  return (
    <Card wide title="Overview" desc="Key numbers for this month.">
      <div className="stat-tile-strip">
        <div className="stat-tile-strip__cell">
          <div className="stat-tile__value">12.4K</div>
          <div className="stat-tile__label">Active users</div>
        </div>
        <div className="stat-tile-strip__cell">
          <div className="stat-tile__value">$48.2K</div>
          <div className="stat-tile__label">MRR</div>
        </div>
        <div className="stat-tile-strip__cell">
          <div className="stat-tile__value">96%</div>
          <div className="stat-tile__label">Uptime</div>
        </div>
        <div className="stat-tile-strip__cell">
          <div className="stat-tile__value">2.4s</div>
          <div className="stat-tile__label">Median TTFB</div>
        </div>
      </div>
      <div className="card__row" style={{ alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span className="avatar-group">
          <span className="avatar avatar--sm">AB</span>
          <span className="avatar avatar--sm">CD</span>
          <span className="avatar avatar--sm">EF</span>
          <span className="avatar-group__more">+3</span>
        </span>
        <span style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>6 collaborators</span>
      </div>
      <button className="btn btn--primary btn--block">
        <Icon name="grid" /> Open dashboard
      </button>
    </Card>
  )
}

/* === FeatureTrio (Tier 4 #15) — composed demo ===
 * 3-column feature blocks: icon (in soft tile) + heading + body. The
 * marketing-page mid-section pattern. Stacks to 1-column op smal. */
function TwoColumnLayoutCard() {
  return (
    <Card wide title="Site overview" desc="Settings with a details sidebar.">
      <div className="twocol">
        <div className="twocol__main">
          <div className="twocol__block">
            <div style={{ fontSize: 'var(--k-type-small)', fontWeight: 600 }}>Force HTTPS</div>
            <div style={{ fontSize: 'var(--k-type-caption)', color: 'var(--k-fg-muted)' }}>Redirect all requests over HTTPS</div>
          </div>
          <div className="twocol__block">
            <div style={{ fontSize: 'var(--k-type-small)', fontWeight: 600 }}>WordPress updates</div>
            <div style={{ fontSize: 'var(--k-type-caption)', color: 'var(--k-fg-muted)' }}>Automatic updates enabled</div>
          </div>
        </div>
        <div className="twocol__side">
          <div className="twocol__tile">
            <div style={{ fontSize: 'var(--k-type-eyebrow)', fontWeight: 600 }}>Database</div>
            <div style={{ fontSize: 'var(--k-type-caption)', color: 'var(--k-primary)' }}>u609103235 ↗</div>
          </div>
          <div className="twocol__tile">
            <div style={{ fontSize: 'var(--k-type-eyebrow)', fontWeight: 600 }}>Backup</div>
            <StatusBadge tone="success" label="Enabled" />
          </div>
          <div className="twocol__tile">
            <div style={{ fontSize: 'var(--k-type-eyebrow)', fontWeight: 600 }}>PHP</div>
            <span className="badge badge--neutral">7.4</span>
          </div>
        </div>
      </div>
      <div className="card__foot">
        <button className="btn btn--primary btn--block">Save settings</button>
      </div>
    </Card>
  )
}
/* === WizardStepper (Tier 4 #20) ======================================
 * Multi-page form flow: numbered horizontal steps boven, content slot
 * onder. Verschilt van bestaande Stepper door focus op page-level wizard
 * (Account → Workspace → Invite → Done). Connecting line vol/leeg. */
function WizardStepperCard() {
  return (
    <Card wide title="Set up workspace" desc="Almost there — invite your team.">
      <div className="wstepper">
        {/* Shares the canonical .stepper recipe — one stepper system across
         * the kit. The wizard only adds a content slot + footer below. */}
        <div className="stepper" role="list" aria-label="Setup progress: step 3 of 4">
          {['Account', 'Workspace', 'Invite', 'Done'].map((label, i) => {
            const done = i < 2
            const current = i === 2
            return (
              <div key={label} role="listitem" aria-current={current ? 'step' : undefined} className={'stepper__step' + (done ? ' stepper__step--done' : '') + (current ? ' stepper__step--current' : '')}>
                <span className="stepper__dot">
                  {done ? <Icon name="check" /> : i + 1}
                </span>
                <span>{label}</span>
              </div>
            )
          })}
        </div>
        {/* Rail above stays full-width; the form BODY caps to --k-form-measure,
         * centered (the wizard feel). One input no longer stretches the card. */}
        <div className="wstepper__content form-measure form-measure--center">
          <div className="wstepper__title">Invite your team</div>
          <div className="wstepper__sub">Add up to 5 collaborators. You can change roles later.</div>
          <div className="in"><input style={{ background: 'transparent', border: 0, outline: 0, width: '100%' }} placeholder="name@company.com" /></div>
        </div>
        <div className="wstepper__foot form-measure form-measure--center">
          <button className="btn btn--ghost btn--sm">Back</button>
          <button className="btn btn--primary btn--sm" disabled>Continue</button>
        </div>
      </div>
    </Card>
  )
}
