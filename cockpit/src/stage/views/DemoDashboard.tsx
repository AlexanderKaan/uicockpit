import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/concepts'
/* Showcase screens — the primary screen of each former standalone app,
 * extracted sidebar-less so they render inside this one unified shell.
 * This is what makes SupaDash the single "super-app": its own pages
 * (Overview…Settings) plus these domain screens so every key component
 * is visible in one place. */
import { ChartFrame } from './ChartFrame'
import type { ChartType } from './ChartFrame'
import { CrmScreen } from './apps/CrmApp'
import type { CrmSub } from './apps/CrmApp'
import { HelpdeskScreen } from './apps/HelpdeskApp'
import type { HelpdeskSub } from './apps/HelpdeskApp'
import { BillingScreen } from './apps/AccountingApp'
import type { BillingSub } from './apps/AccountingApp'
import { CloudScreen } from './apps/CloudApp'
import { useDropdown, StatusBadge, InteractiveSlider, DatePicker } from './apps/AppHelpers'
import { PageSkeleton } from './Skeletons'

type Page =
  | 'overview' | 'projects' | 'board' | 'docs' | 'inbox' | 'media' | 'analytics' | 'settings'
  | 'crm' | 'helpdesk' | 'billing' | 'cloud'
  | 'profile' | 'signin'
  | 'calendar'

interface NavEntry {
  id: Page
  label: string
  icon: IconName
  badge?: number
}

/* SupaDash is one super-app spanning multiple product verticals. The sidebar
 * groups tabs by use-case (Workspace / Commerce / Content / Hosting / Finance);
 * each nested app (CRM, Helpdesk, Billing, Cloud) is a vertical with its own
 * sub-pages. Settings is pinned to the bottom, separate from the verticals. */
/* The rail is the suite's product switcher (Atlassian-style): each group is a
 * domain, each item a product. Renames + nested rebuilds land per phase
 * (SUITE-PLAN.md) — IDs stay stable here so the screen dispatch doesn't churn
 * before the product it belongs to is rebuilt. */
const NAV_GROUPS: { label: string; items: NavEntry[] }[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'overview', label: 'Home', icon: 'home' },
      { id: 'projects', label: 'Projects', icon: 'grid' },
      { id: 'board', label: 'Board', icon: 'chart' },
      { id: 'docs', label: 'Docs', icon: 'edit' },
      { id: 'calendar', label: 'Calendar', icon: 'cal' },
      { id: 'analytics', label: 'Analytics', icon: 'spark' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { id: 'inbox', label: 'Inbox', icon: 'bell', badge: 4 },
      { id: 'helpdesk', label: 'Support', icon: 'feed' },
    ],
  },
  {
    label: 'Business',
    items: [
      { id: 'crm', label: 'CRM', icon: 'store' },
      { id: 'billing', label: 'Billing', icon: 'card' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { id: 'cloud', label: 'Cloud', icon: 'upload' },
      { id: 'media', label: 'Media', icon: 'file' },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: 'info' },
      { id: 'signin', label: 'Sign in', icon: 'check' },
    ],
  },
]
const SETTINGS_ENTRY: NavEntry = { id: 'settings', label: 'Settings', icon: 'cog' }

export function DemoDashboard() {
  const [page, setPage] = useState<Page>('overview')
  const [cmdpOpen, setCmdpOpen] = useState(false)
  // Sidebar collapse — rail mode shows icon-only nav with hover tooltips
  // (VS Code / Linear pattern). The whole .dash grid narrows to a 64px rail.
  const [rail, setRail] = useState(false)
  // Nested Settings group — which sub-section is shown, and whether the
  // sidebar group is expanded. Auto-expands whenever you land on Settings.
  // Nested Helpdesk section — Tickets / Ticket / Inbox.
  const [helpdeskSub, setHelpdeskSub] = useState<HelpdeskSub>('tickets')
  const [helpdeskOpen, setHelpdeskOpen] = useState(false)
  useEffect(() => { if (page === 'helpdesk') setHelpdeskOpen(true) }, [page])
  // Nested CRM section — Contacts / Pipeline / Deal / Activity.
  const [crmSub, setCrmSub] = useState<CrmSub>('contacts')
  const [crmOpen, setCrmOpen] = useState(false)
  useEffect(() => { if (page === 'crm') setCrmOpen(true) }, [page])
  // Nested Billing section — Overview / Invoices / Plans.
  const [billingSub, setBillingSub] = useState<BillingSub>('invoices')
  const [billingOpen, setBillingOpen] = useState(false)
  useEffect(() => { if (page === 'billing') setBillingOpen(true) }, [page])
  // Nested Cloud section — Deployments / Domains / Logs.
  /* Skeleton-on-load: brief grey shimmer placeholder on first mount and on
   * every page switch, so the Skeleton component is previewed in a real
   * loading context (not just isolated in the gallery). Shimmer respects
   * prefers-reduced-motion via the .sk recipe. */
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [page])

  /* A nav item is either a flat row or a nested parent (guide-lined sub-list).
   * nestedFor() returns the open-state + sub-state wiring for the deep apps;
   * renderNavItem() picks the right shape. Used for both the vertical groups
   * and the pinned Settings entry, so the nesting behaviour is identical. */
  type Nested = { open: boolean; setOpen: (f: (o: boolean) => boolean) => void; sub: string; setSub: (s: string) => void; items: [string, string][] }
  const nestedFor = (id: Page): Nested | null => {
    switch (id) {
      case 'crm': return { open: crmOpen, setOpen: setCrmOpen, sub: crmSub, setSub: setCrmSub as (s: string) => void, items: [['contacts', 'Contacts'], ['pipeline', 'Pipeline'], ['new', 'New contact']] }
      case 'helpdesk': return { open: helpdeskOpen, setOpen: setHelpdeskOpen, sub: helpdeskSub, setSub: setHelpdeskSub as (s: string) => void, items: [['tickets', 'Queue'], ['ticket', 'Ticket'], ['help', 'Help centre']] }
      case 'billing': return { open: billingOpen, setOpen: setBillingOpen, sub: billingSub, setSub: setBillingSub as (s: string) => void, items: [['invoices', 'Invoices'], ['new', 'New invoice'], ['plans', 'Plans']] }
      default: return null
    }
  }
  const renderNavItem = (n: NavEntry) => {
    const nested = nestedFor(n.id)
    if (!nested) {
      return (
        <button
          key={n.id}
          type="button"
          className={`navrow ${page === n.id ? 'navrow--on' : ''}`}
          data-tip={n.label}
          onClick={() => setPage(n.id)}
        >
          <Icon name={n.icon} />
          <span className="navrow__label">{n.label}</span>
          {n.badge != null && <span className="badge badge--solid-primary badge--count">{n.badge}</span>}
        </button>
      )
    }
    return (
      <div key={n.id}>
        <button
          type="button"
          className={`navrow navrow--parent ${rail && page === n.id ? 'navrow--on' : ''}`}
          aria-expanded={nested.open}
          data-tip={n.label}
          onClick={() => (rail ? setPage(n.id) : nested.setOpen((o) => !o))}
        >
          <Icon name={n.icon} />
          <span className="navrow__label">{n.label}</span>
          <span className="navrow__chev"><Icon name="chevR" /></span>
        </button>
        {nested.open && (
          <div className="navsub">
            {nested.items.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`navsub__item ${page === n.id && nested.sub === id ? 'navsub__item--on' : ''}`}
                onClick={() => { setPage(n.id); nested.setSub(id) }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`dash ${rail ? 'dash--rail' : ''}`}>
      <nav className="dash__nav">
        <div className="dash__brand">
          {/* SupaDash — app-icon: a rounded-square launcher tile in the brand
           * colour with a 2×2 grid mark (reads "the app that does everything"). */}
          <span className="dash__appicon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1.8" />
              <rect x="9" y="1" width="6" height="6" rx="1.8" />
              <rect x="1" y="9" width="6" height="6" rx="1.8" />
              <rect x="9" y="9" width="6" height="6" rx="1.8" />
            </svg>
          </span>
          <span className="dash__brandname" style={{ flex: 1 }}>SupaDash</span>
          <button
            type="button"
            className="dash__railtoggle"
            aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={rail}
            data-tip="Expand"
            onClick={() => setRail((r) => !r)}
          >
            <Icon name={rail ? 'chevR' : 'chevL'} />
          </button>
        </div>
        {/* Verticals — each group is a use-case; nested apps own sub-pages. */}
        {NAV_GROUPS.map((g) => (
          <Fragment key={g.label}>
            <div className="nav-group">{g.label}</div>
            {g.items.map(renderNavItem)}
          </Fragment>
        ))}
        {/* Pinned bottom — Settings (nested) + the ⌘K launcher. */}
        <div className="dash__navfoot">
          {renderNavItem(SETTINGS_ENTRY)}
          <button
            type="button"
            className="dash__navquick"
            data-tip="Quick actions"
            onClick={() => setCmdpOpen(true)}
          >
            <span className="kbd dash__navquick-kbd">⌘K</span>
            <span className="navrow__label">Quick actions</span>
          </button>
        </div>
      </nav>
      {/* Skeleton-on-load — a layout-accurate wireframe of the page that's
       * loading (mirrors its real components, so no layout shift + the wait
       * pre-teaches the screen). See Skeletons.tsx. */}
      {loading ? <PageSkeleton page={page} sub={page === 'crm' ? crmSub : page === 'helpdesk' ? helpdeskSub : page === 'billing' ? billingSub : ''} />
      /* Showcase screens bring their OWN .dash__main wrapper, so render
       * them as direct siblings of the nav (not nested) to avoid double
       * padding/scroll. SupaDash's own pages share one .dash__main. */
      : page === 'crm' ? <CrmScreen sub={crmSub} />
        : page === 'helpdesk' ? <HelpdeskScreen sub={helpdeskSub} />
        : page === 'billing' ? <BillingScreen sub={billingSub} />
        : page === 'cloud' ? <CloudScreen />
        : (
          <div className="dash__main">
            {page === 'overview' && <Overview onDrill={setPage} />}
            {page === 'projects' && <Projects />}
            {page === 'board' && <Board />}
            {page === 'docs' && <DocsScreen />}
            {page === 'inbox' && <Inbox onOpenCmdp={() => setCmdpOpen(true)} />}
            {page === 'media' && <Media />}
            {page === 'analytics' && <Analytics />}
            {page === 'calendar' && <CalendarPage />}
            {page === 'profile' && <Profile />}
            {page === 'signin' && <SignIn />}
            {page === 'settings' && <Settings />}
          </div>
        )}
      {/* Global command palette — opens from the sidebar ⌘K or Inbox toolbar */}
      {cmdpOpen && <CmdPaletteOverlay onClose={() => setCmdpOpen(false)} onGoto={(p) => { setPage(p); setCmdpOpen(false) }} />}
    </div>
  )
}

/** Global command palette overlay — opens via ⌘K button. Navigates between pages. */
function CmdPaletteOverlay({ onClose, onGoto }: { onClose: () => void; onGoto: (p: Page) => void }) {
  const [q, setQ] = useState('')
  const items: Array<{ section: string; label: string; icon: IconName; shortcut?: string; action: () => void }> = [
    { section: 'Navigate', label: 'Go to Overview', icon: 'home', shortcut: 'G O', action: () => onGoto('overview') },
    { section: 'Navigate', label: 'Go to Projects', icon: 'grid', shortcut: 'G P', action: () => onGoto('projects') },
    { section: 'Navigate', label: 'Go to Board', icon: 'chart', shortcut: 'G B', action: () => onGoto('board') },
    { section: 'Navigate', label: 'Go to Inbox', icon: 'bell', shortcut: 'G I', action: () => onGoto('inbox') },
    { section: 'Navigate', label: 'Go to Media', icon: 'file', shortcut: 'G M', action: () => onGoto('media') },
    { section: 'Navigate', label: 'Go to Analytics', icon: 'chart', shortcut: 'G A', action: () => onGoto('analytics') },
    { section: 'Navigate', label: 'Go to Settings', icon: 'cog', shortcut: 'G S', action: () => onGoto('settings') },
    { section: 'Showcase', label: 'Go to CRM', icon: 'store', action: () => onGoto('crm') },
    { section: 'Showcase', label: 'Go to Helpdesk', icon: 'chat', action: () => onGoto('helpdesk') },
    { section: 'Showcase', label: 'Go to Billing', icon: 'cal', action: () => onGoto('billing') },
    { section: 'Showcase', label: 'Go to Cloud', icon: 'upload', action: () => onGoto('cloud') },
    { section: 'Actions', label: 'New project', icon: 'plus', shortcut: '⌘ N', action: onClose },
    { section: 'Actions', label: 'Invite teammate', icon: 'bell', shortcut: '⌘ I', action: onClose },
    { section: 'Actions', label: 'Upload media', icon: 'upload', shortcut: '⌘ U', action: onClose },
  ]
  const matches = items.filter((it) => it.label.toLowerCase().includes(q.toLowerCase()))
  const sections = Array.from(new Set(matches.map((m) => m.section)))
  return (
    <div
      onClick={onClose}
      style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'start center', paddingTop: 80, zIndex: 50 }}
    >
      <div className="cmdp" style={{ width: 460, maxWidth: '90%' }} onClick={(e) => e.stopPropagation()}>
        <div className="cmdp__in">
          <Icon name="search" />
          <input autoFocus type="search" aria-label="Search commands or pages" placeholder="Type a command or search…" value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="kbd">esc</span>
        </div>
        {sections.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--k-fg-faint)', fontSize: 'var(--k-type-small)' }}>
            No matches.
          </div>
        ) : (
          sections.map((sec) => (
            <div key={sec}>
              <div className="cmdp__section">{sec}</div>
              <ul className="cmdp__list">
                {matches.filter((m) => m.section === sec).map((it) => (
                  <li key={it.label}>
                    <button type="button" className="cmdp__item" onClick={it.action}>
                      <span className="cmdp__item-icon"><Icon name={it.icon} /></span>
                      {it.label}
                      {it.shortcut && (
                        <span className="cmdp__shortcut">
                          {it.shortcut.split(' ').map((k, i) => <span key={i} className="kbd">{k}</span>)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function Breadcrumb({ here, parent }: { here: string; parent?: string }) {
  return (
    <nav className="breadcrumb" style={{ marginBottom: 12 }}>
      <span>SupaDash</span>
      <Icon name="chevR" />
      {parent && (
        <>
          <span>{parent}</span>
          <Icon name="chevR" />
        </>
      )}
      <span style={{ color: 'var(--k-fg)' }}>{here}</span>
    </nav>
  )
}

function Overview({ onDrill }: { onDrill: (p: Page) => void }) {
  const [bannerOpen, setBannerOpen] = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(true)
  return (
    <>
      <Breadcrumb here="Home" />
      {bannerOpen && (
        <div className="upgrade-banner">
          <span className="upgrade-banner__icon"><Icon name="spark" size={14} /></span>
          <div className="upgrade-banner__body">
            <div className="upgrade-banner__title">Pro plan unlocks unlimited projects</div>
            <div className="upgrade-banner__sub">Currently on Team plan — 7 of 10 projects used.</div>
          </div>
          <button className="btn btn--primary btn--sm">Upgrade</button>
          <button className="alert__close" aria-label="Dismiss" onClick={() => setBannerOpen(false)}>
            <Icon name="x" />
          </button>
        </div>
      )}
      <div className="dash__head">
        <h1>Good afternoon</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Notifications bell → roll-down popover (#213 — more places to test menus). */}
          <div style={{ position: 'relative' }}>
            <button className="btn btn--ghost btn--icon btn--sm" aria-label="Notifications" aria-expanded={notifOpen} onClick={() => { setNotifOpen((v) => !v); setNewOpen(false) }}>
              <span className="meta-notif"><Icon name="bell" /><span className="meta-notif__dot">3</span></span>
            </button>
            {notifOpen && (
              <div className="menu" role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', minWidth: 250, zIndex: 20 }} onMouseLeave={() => setNotifOpen(false)}>
                <div className="menu__label">Notifications</div>
                <button className="menu__item" role="menuitem"><Icon name="spark" /> Deploy finished · 2m</button>
                <button className="menu__item" role="menuitem"><Icon name="info" /> 3 PRs awaiting review · 1h</button>
                <button className="menu__item" role="menuitem"><Icon name="check" /> Nightly backup done · 4h</button>
                <div className="menu__sep" />
                <button className="menu__item" role="menuitem">Mark all as read</button>
              </div>
            )}
          </div>
          {/* New project → dropdown of starting points. */}
          <div style={{ position: 'relative' }}>
            <button className="btn btn--primary btn--sm" aria-haspopup="menu" aria-expanded={newOpen} onClick={() => { setNewOpen((v) => !v); setNotifOpen(false) }}>
              <Icon name="plus" /> New project <Icon name="chevD" />
            </button>
            {newOpen && (
              <div className="menu" role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', minWidth: 200, zIndex: 20 }} onMouseLeave={() => setNewOpen(false)}>
                <button className="menu__item" role="menuitem"><Icon name="plus" /> Blank project</button>
                <button className="menu__item" role="menuitem"><Icon name="grid" /> From template</button>
                <button className="menu__item" role="menuitem"><Icon name="upload" /> Import repository</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Needs-attention alert — the semantic .alert recipe (tinted bg + leading
          icon). The home dashboard is the canonical home for the alert stack. */}
      {alertOpen && (
        <div className="alert alert--warning" style={{ marginBottom: 16 }}>
          <Icon name="bell" />
          <div className="alert__body">
            <div className="alert__title">Action needed</div>
            <div>Your payment method expires this month — update it to avoid interruption.</div>
          </div>
          <button className="alert__close" aria-label="Dismiss" onClick={() => setAlertOpen(false)}><Icon name="x" /></button>
        </div>
      )}
      {/* KPI tiles drill into Analytics — clickable cards with hover lift. */}
      <div className="dash__stats">
        <StatCard label="Requests" value="12.4k" delta="+8.2%" accent={1} trend={[42, 51, 49, 58, 65, 60, 72]} onClick={() => onDrill('analytics')} />
        <StatCard label="Active users" value="3,128" delta="+2.1%" accent={2} trend={[20, 22, 28, 31, 34, 38, 41]} onClick={() => onDrill('analytics')} />
        <StatCard
          label="Errors"
          value="0.42%"
          delta="-0.08%"
          accent={3}
          tooltip="Server-side errors as % of total requests"
          trend={[80, 72, 65, 60, 52, 48, 42]}
          onClick={() => onDrill('analytics')}
        />
        <StatCard label="Revenue" value="$4,820" delta="+12%" accent={4} trend={[30, 38, 35, 50, 55, 62, 78]} onClick={() => onDrill('analytics')} />
      </div>

      {/* Quick actions + team-online side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginBottom: 10 }}>Quick actions</h2>
          <div className="quickact">
            <QuickTile icon="plus"   title="New project"   sub="From scratch"   accent={1} />
            <QuickTile icon="upload" title="Import file"   sub="JSON or CSV"    accent={2} />
            <QuickTile icon="bell"   title="Invite"        sub="Add a teammate" accent={3} />
            <QuickTile icon="file"   title="Docs"          sub="Read the guide" accent={4} />
          </div>
        </div>
        <div>
          <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginBottom: 10 }}>Team online</h2>
          <div className="team-online">
            <div className="team-online__label">
              <span className="team-online__count">5 online</span>
              <span className="team-online__sub">of 12 members</span>
            </div>
            <span className="avatar-group">
              <span className="avatar avatar--sm avatar--a1">JM<span className="avatar__status avatar__status--online" role="img" aria-label="Online" /></span>
              <span className="avatar avatar--sm avatar--a2">AC<span className="avatar__status avatar__status--online" role="img" aria-label="Online" /></span>
              <span className="avatar avatar--sm avatar--a3">MK<span className="avatar__status avatar__status--away" role="img" aria-label="Away" /></span>
              <span className="avatar-group__more">+2</span>
            </span>
          </div>
        </div>
      </div>

      {/* Usage row — the UsageMeter (API quota) paired with a Progress bar
          (storage). Two distinct meter components, side by side. */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24, alignItems: 'start' }}>
        <div className="usage usage--warn">
          <div className="usage__head">
            <span className="usage__title">API calls — monthly quota</span>
            <span className="usage__pct">782,140 of 1,000,000 (78%)</span>
          </div>
          <div className="usage__bar"><div className="usage__fill" style={{ width: '78%' }} /></div>
          <div className="usage__foot">
            <span className="usage__hint">Resets in 9 days</span>
            <button className="btn btn--ghost btn--sm">Upgrade plan</button>
          </div>
        </div>
        {/* Progress (Storage) — thin determinate bar + used-of-total readout. */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 'var(--k-type-small)', fontWeight: 500 }}>Storage</span>
            <span style={{ fontSize: 11, color: 'var(--k-fg-muted)', fontVariantNumeric: 'tabular-nums' }}>7.4 of 10 GB</span>
          </div>
          <div className="progress"><div className="progress__fill" style={{ width: '74%' }} /></div>
          <span style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>74% used — upgrade for more space.</span>
        </div>
      </div>

      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginBottom: 10 }}>Last 7 days</h2>
      <div className="barchart" style={{ height: 120, marginBottom: 24 }}>
        {([['Mon', 55], ['Tue', 68], ['Wed', 42], ['Thu', 80], ['Fri', 51], ['Sat', 73], ['Sun', 90]] as [string, number][]).map(([d, v], i) => (
          <div key={i} className="barchart__bar" style={{ height: `${v}%`, background: 'var(--k-grad-1)' }} tabIndex={0} role="img" aria-label={`${d}: ${v} builds`}>
            <span className="barchart__tip">{d} · {v}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, margin: 0 }}>Activity</h2>
        {/* Spinner — live "syncing" indicator next to the feed title. */}
        <span className="spinner" aria-label="Syncing" />
        <span style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Syncing…</span>
      </div>
      <div className="activity" role="list">
        <ActivityItem dot="success" text="Build #2412 passed" meta="2m" author="ava_chen" />
        <ActivityItem dot="warn" text="Quota nearing limit" meta="14m" />
        <ActivityItem dot="info" text="New member joined: Casey" meta="1h" author="casey_w" />
        <ActivityItem dot="danger" text="Webhook failed for payments-prod" meta="3h" author="jordan_m" />
      </div>

      {/* What's new — the FeatureTrio component (three icon-led feature cells)
          as an onboarding/changelog row at the foot of the home dashboard. */}
      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, margin: '24px 0 10px' }}>What's new</h2>
      <div className="ftrio">
        <div className="ftrio__cell">
          <span className="ftrio__icon"><Icon name="spark" /></span>
          <div className="ftrio__title">Faster deploys <span className="badge badge--primary">New</span></div>
          <div className="ftrio__body">Builds now run on the upgraded edge fleet — 40% quicker.</div>
        </div>
        <div className="ftrio__cell">
          <span className="ftrio__icon"><Icon name="chart" /></span>
          <div className="ftrio__title">Usage insights <span className="badge badge--warn">Beta</span></div>
          <div className="ftrio__body">Break requests down by tier and source in Analytics.</div>
        </div>
        <div className="ftrio__cell">
          <span className="ftrio__icon"><Icon name="upload" /></span>
          <div className="ftrio__title">Bulk import <span className="badge badge--neutral">Pro</span></div>
          <div className="ftrio__body">Bring projects in from CSV or another workspace.</div>
        </div>
      </div>
    </>
  )
}

// Quick-action tile — icon-stack-label, clickable, hover lift. Each tile's
// icon chip pulls a distinct decorative-palette accent (soft tint + colour).
function QuickTile({ icon, title, sub, accent }: { icon: IconName; title: string; sub: string; accent?: number }) {
  const tint = accent
    ? { color: `var(--k-accent-${accent}-soft-fg)`, background: `var(--k-accent-${accent}-soft)` }
    : undefined
  return (
    <button type="button" className="quickact__tile">
      <span className="quickact__icon" style={tint}><Icon name={icon} /></span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="quickact__label">{title}</span>
        <span className="quickact__sub">{sub}</span>
      </span>
    </button>
  )
}

interface StatCardProps {
  label: string
  value: string
  delta: string
  tooltip?: string
  trend?: number[]
  accent?: number
  onClick?: () => void
}

function StatCard({ label, value, delta, tooltip, trend, accent, onClick }: StatCardProps) {
  const down = delta.startsWith('-')
  const clickable = !!onClick
  return (
    <div
      className={`stat-tile ${clickable ? 'stat-tile--clickable' : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() } } : undefined}
    >
      <div className="stat-tile__head">
        <span className="stat-tile__label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          {tooltip && (
            <span className="tt">
              <span className="tt__pop">{tooltip}</span>
              <span style={{ display: 'inline-flex', color: 'var(--k-fg-faint)', cursor: 'help' }}>
                <Icon name="info" size={11} />
              </span>
            </span>
          )}
        </span>
        {clickable && <span className="stat-tile__drill" aria-hidden="true"><Icon name="chevR" size={13} /></span>}
      </div>
      <span className="stat-tile__value">{value}</span>
      <span className={`stat-tile__delta ${down ? 'stat-tile__delta--down' : 'stat-tile__delta--up'}`}>{delta}</span>
      {trend && <Sparkline values={trend} accent={accent} />}
    </div>
  )
}

// Inline micro-chart for stat-tiles. Normalizes to 0-100, draws polyline + area.
// Optional accent (1-6) colours line + ~14% fill from the decorative palette,
// so each KPI is distinguishable (Material-style fill alpha).
function Sparkline({ values, accent }: { values: number[]; accent?: number }) {
  const col = accent ? `var(--k-accent-${accent})` : undefined
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const step = 100 / (values.length - 1)
  const points = values.map((v, i) => {
    const x = i * step
    const y = 100 - ((v - min) / range) * 100
    return [x, y] as const
  })
  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L 100,100 L 0,100 Z`
  return (
    <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path className="sparkline__area" d={areaD} style={col ? { fill: col, opacity: 0.14 } : undefined} />
      <path className="sparkline__path" d={pathD} style={col ? { stroke: col } : undefined} />
    </svg>
  )
}

// Sortable column header — shows chevron, tints when active. Used by Projects table.
function SortHeader<K extends string>({ label, k, sortKey, sortDir, onToggle }: {
  label: string
  k: K
  sortKey: K
  sortDir: 'asc' | 'desc'
  onToggle: (k: K) => void
}) {
  const active = sortKey === k
  return (
    <th
      className={`is-sortable ${active ? 'is-active' : ''}`}
      tabIndex={0}
      role="columnheader"
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      onClick={() => onToggle(k)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle(k)
        }
      }}
    >
      <span className="tbl__sort">
        {label}
        <span className="tbl__sort-chevron" style={{ transform: active && sortDir === 'desc' ? 'rotate(180deg)' : 'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </span>
    </th>
  )
}

function ActivityItem({ dot, text, meta, author }: { dot: 'success' | 'warn' | 'info' | 'danger'; text: string; meta: string; author?: string }) {
  const tone =
    dot === 'success'
      ? 'var(--k-success)'
      : dot === 'warn'
        ? 'var(--k-warning)'
        : dot === 'danger'
          ? 'var(--k-danger)'
          : 'var(--k-info)'
  return (
    <div className="activity__item" role="listitem">
      <span className="activity__dot" style={{ background: tone }} role="img" aria-label={`Status: ${dot}`} />
      <span style={{ flex: 1 }}>
        {text}
        {author && (
          <>
            {' · '}
            <span className="hover-card">
              @{author}
              <span className="hover-card__pop">
                <div className="card__row" style={{ gap: 8, marginBottom: 4 }}>
                  <span className="avatar avatar--sm avatar--a2">
                    {author.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="card__col" style={{ gap: 1, flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--k-type-small)', color: 'var(--k-fg)' }}>{author}</span>
                    <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>SupaDash member</span>
                  </div>
                </div>
              </span>
            </span>
          </>
        )}
      </span>
      <span className="activity__meta">{meta}</span>
    </div>
  )
}

const PROJECTS = [
  { name: 'ai-router',       env: 'prod',    status: 'success' as const, key: 'NUC-201', prio: 'high' as const, type: 'Feature', assignee: 'AB', points: 5, created: 'May 28, 2026' },
  { name: 'pricing-engine',  env: 'prod',    status: 'success' as const, key: 'NUC-198', prio: 'med'  as const, type: 'Chore',   assignee: 'CD', points: 3, created: 'May 24, 2026' },
  { name: 'edge-cache',      env: 'staging', status: 'warn'    as const, key: 'NUC-212', prio: 'high' as const, type: 'Bug',     assignee: 'EF', points: 2, created: 'Jun 1, 2026' },
  { name: 'mailer',          env: 'prod',    status: 'success' as const, key: 'NUC-187', prio: 'low'  as const, type: 'Chore',   assignee: 'GH', points: 1, created: 'May 19, 2026' },
  { name: 'payments-prod',   env: 'prod',    status: 'danger'  as const, key: 'NUC-220', prio: 'high' as const, type: 'Bug',     assignee: 'IJ', points: 8, created: 'Jun 2, 2026' },
  { name: 'dashboards',      env: 'dev',     status: 'info'    as const, key: 'NUC-205', prio: 'med'  as const, type: 'Feature', assignee: 'AB', points: 5, created: 'May 30, 2026' },
  { name: 'background-jobs', env: 'prod',    status: 'success' as const, key: 'NUC-176', prio: 'low'  as const, type: 'Chore',   assignee: 'CD', points: 2, created: 'May 12, 2026' },
  { name: 'analytics-etl',   env: 'staging', status: 'warn'    as const, key: 'NUC-214', prio: 'med'  as const, type: 'Feature', assignee: 'EF', points: 3, created: 'Jun 1, 2026' },
]
type Issue = (typeof PROJECTS)[number]
const STATUS_LABEL = (s: Issue['status']) => (s === 'success' ? 'Healthy' : s === 'warn' ? 'Degraded' : s === 'danger' ? 'Down' : 'Idle')

type ProjectSortKey = 'name' | 'env' | 'status'

function Projects() {
  const [q, setQ] = useState('')
  const [pageNum, setPageNum] = useState(1)
  const [loading, setLoading] = useState(false)
  const [sortKey, setSortKey] = useState<ProjectSortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  // Tag-input pattern — env filter chips, can be removed individually
  const [envFilters, setEnvFilters] = useState<string[]>(['prod', 'staging'])
  const [envDraft, setEnvDraft] = useState('')
  // DataTablePro selection + right-click ContextMenu + New-issue Sheet + Issue detail.
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [ctx, setCtx] = useState<{ x: number; y: number; key: string } | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [openIssue, setOpenIssue] = useState<Issue | null>(null)
  const [niType, setNiType] = useState('Feature')
  const [niPrio, setNiPrio] = useState('med')

  const toggleSort = (k: ProjectSortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir('asc') }
  }

  const filtered = useMemo(
    () => {
      const f = PROJECTS
        .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
        .filter((p) => envFilters.length === 0 || envFilters.includes(p.env))
      const sorted = [...f].sort((a, b) => a[sortKey].localeCompare(b[sortKey]))
      return sortDir === 'asc' ? sorted : sorted.reverse()
    },
    [q, sortKey, sortDir, envFilters],
  )

  // Simulate brief loading on filter change to showcase skeleton
  useEffect(() => {
    if (q === '') return
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 350)
    return () => clearTimeout(t)
  }, [q])

  const allOn = filtered.length > 0 && filtered.every((p) => sel.has(p.key))
  const toggleAll = () => setSel(allOn ? new Set() : new Set(filtered.map((p) => p.key)))
  const toggleOne = (k: string) => setSel((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })

  // Clicking a row (or its context-menu "Open") drills into the Issue detail —
  // the suite's ONE canonical 2-col record view (DescriptionList + Timeline).
  if (openIssue) return <IssueDetail issue={openIssue} onBack={() => setOpenIssue(null)} />

  return (
    <>
      <Breadcrumb here="Projects" />
      <div className="dash__head">
        <h1>Projects</h1>
        <div className="card__row">
          <div className="in in--inline" style={{ maxWidth: 240 }}>
            <Icon name="search" />
            <input type="search" aria-label="Filter issues" placeholder="Filter issues…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn btn--primary btn--sm" onClick={() => setSheetOpen(true)}>
            <Icon name="plus" /> New issue
          </button>
        </div>
      </div>

      {/* Tag-input pattern — filter chips for environment */}
      <div className="card__row" style={{ marginBottom: 14, alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--k-type-eyebrow)', color: 'var(--k-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
          Env
        </span>
        <div className="taginput" style={{ flex: 1, maxWidth: 380 }}>
          {envFilters.map((t) => (
            <span key={t} className="taginput__chip">
              {t}
              <button
                type="button"
                className="taginput__remove"
                onClick={() => setEnvFilters(envFilters.filter((x) => x !== t))}
                aria-label={`Remove ${t}`}
              >
                <Icon name="x" size={11} />
              </button>
            </span>
          ))}
          <input
            aria-label="Add environment tag"
            value={envDraft}
            onChange={(e) => setEnvDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && envDraft.trim() && !envFilters.includes(envDraft.trim())) {
                setEnvFilters([...envFilters, envDraft.trim()])
                setEnvDraft('')
              }
            }}
            placeholder={envFilters.length === 0 ? 'Add env tag…' : ''}
          />
        </div>
      </div>

      {/* DataTablePro — sticky header, row selection + bulk-action bar; a row
          drills into the Issue detail, right-click opens a ContextMenu. */}
      <div className="datatable datatable--page" style={{ position: 'relative' }}>
        <div className={`datatable__bar ${sel.size > 0 ? 'datatable__bar--active' : ''}`}>
          {sel.size > 0 ? (
            <>
              <span className="datatable__count">{sel.size} selected</span>
              <span className="datatable__spacer" />
              <button className="btn btn--ghost btn--sm"><Icon name="check" /> Assign</button>
              <button className="btn btn--danger btn--sm"><Icon name="trash" /> Delete</button>
            </>
          ) : (
            <>
              <span className="datatable__count">{filtered.length} issues</span>
              <span className="datatable__spacer" />
              <button className="btn btn--secondary btn--sm" onClick={() => setSheetOpen(true)}><Icon name="plus" /> New issue</button>
            </>
          )}
        </div>
        <div className="datatable__body">
          <table className="tbl">
            <thead>
              <tr>
                <th className="datatable__check"><label className="check"><input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all issues" /></label></th>
                <SortHeader label="Issue" k="name" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                <SortHeader label="Env" k="env" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                <SortHeader label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                <th>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    <td className="datatable__check"><span className="sk" style={{ height: 12, width: 16, display: 'block' }} /></td>
                    <td><span className="sk" style={{ height: 12, width: '60%', display: 'block' }} /></td>
                    <td><span className="sk" style={{ height: 12, width: 50, display: 'block' }} /></td>
                    <td><span className="sk" style={{ height: 12, width: 70, display: 'block' }} /></td>
                    <td><span className="sk" style={{ height: 12, width: 24, display: 'block' }} /></td>
                  </tr>
                ))
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.key}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setOpenIssue(p)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      const host = e.currentTarget.closest('.datatable')
                      if (!host) return
                      const r = host.getBoundingClientRect()
                      setCtx({ x: e.clientX - r.left, y: e.clientY - r.top, key: p.key })
                    }}
                  >
                    <td className="datatable__check" onClick={(e) => e.stopPropagation()}>
                      <label className="check"><input type="checkbox" checked={sel.has(p.key)} onChange={() => toggleOne(p.key)} aria-label={`Select ${p.name}`} /></label>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>{p.key} · {p.type} · {p.points} pts</div>
                    </td>
                    <td><span className="badge badge--neutral">{p.env}</span></td>
                    <td><StatusBadge tone={p.status} label={STATUS_LABEL(p.status)} /></td>
                    <td><span className="avatar avatar--sm" style={{ fontSize: 10 }}>{p.assignee}</span></td>
                  </tr>
                ))
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--k-fg-faint)' }}>No matches.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {ctx && (
          <div className="menu ctxmenu__pop" style={{ position: 'absolute', left: ctx.x, top: ctx.y, zIndex: 30 }} role="menu" onMouseLeave={() => setCtx(null)}>
            <button className="menu__item" role="menuitem" onClick={() => { const is = PROJECTS.find((p) => p.key === ctx.key); if (is) setOpenIssue(is); setCtx(null) }}><Icon name="info" /> Open issue</button>
            <button className="menu__item" role="menuitem"><Icon name="edit" /> Rename <span className="menu__shortcut">⌘R</span></button>
            <div className="menu__sep" />
            <button className="menu__item menu__item--danger" role="menuitem" onClick={() => setCtx(null)}><Icon name="trash" /> Delete</button>
          </div>
        )}
      </div>
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>
          <span>Showing {filtered.length} of {PROJECTS.length}</span>
          <div className="pagination">
            <button onClick={() => setPageNum((v) => Math.max(1, v - 1))} aria-label="Previous">
              <Icon name="chevL" />
            </button>
            {[1, 2, 3].map((n) => (
              <button key={n} aria-current={pageNum === n} onClick={() => setPageNum(n)}>{n}</button>
            ))}
            <button onClick={() => setPageNum((v) => Math.min(3, v + 1))} aria-label="Next">
              <Icon name="chevR" />
            </button>
          </div>
        </div>
      )}

      {/* New issue — a Sheet drawer sliding over the content. Hosts the
          RadioCard (issue type), a Select (priority) and a Date input. */}
      {sheetOpen && (
        <div className="sheet-frame" style={{ position: 'fixed', inset: 0, height: 'auto', border: 'none', borderRadius: 0, background: 'none', overflow: 'visible', zIndex: 50 }}>
          <div className="sheet-frame__backdrop" role="button" tabIndex={0} aria-label="Close" onClick={() => setSheetOpen(false)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSheetOpen(false) } }} />
          <aside className="sheet" role="dialog" aria-modal="true" aria-labelledby="ni-title">
            <div className="sheet__head">
              <span className="sheet__title" id="ni-title">New issue</span>
              <button className="btn btn--ghost btn--icon btn--sm" aria-label="Close" onClick={() => setSheetOpen(false)}><Icon name="x" /></button>
            </div>
            <div className="sheet__body">
              <label className="lab"><span>Title</span><input className="in" placeholder="Short summary…" /></label>
              <div className="lab">
                <span>Type</span>
                <div className="radio-cards">
                  {([['Feature', 'New capability'], ['Bug', 'Something is broken'], ['Chore', 'Maintenance work']] as [string, string][]).map(([t, d]) => (
                    <label key={t} className={'radio-card' + (niType === t ? ' radio-card--on' : '')}>
                      <span className="radio"><input type="radio" name="ni-type" checked={niType === t} onChange={() => setNiType(t)} /></span>
                      <span className="radio-card__body"><span className="radio-card__title">{t}</span><span className="radio-card__desc">{d}</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="lab">
                <span>Priority</span>
                <select className="select" value={niPrio} onChange={(e) => setNiPrio(e.target.value)}>
                  <option value="high">High</option>
                  <option value="med">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <label className="lab"><span>Due date</span><DatePicker defaultValue="2026-06-12" ariaLabel="Due date" /></label>
            </div>
            <div className="sheet__foot">
              <button className="btn btn--ghost btn--sm" onClick={() => setSheetOpen(false)}>Cancel</button>
              <button className="btn btn--primary btn--sm" onClick={() => setSheetOpen(false)}>Create issue</button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

/* Issue detail — the suite's single canonical record-detail view: a two-column
 * layout (TwoColumnLayout) with a DescriptionList of the issue's fields + a
 * Timeline of its history on the left, and linked-resource tiles on the right.
 * CRM/Support deliberately do NOT repeat this; they use other disclosures. */
function IssueDetail({ issue, onBack }: { issue: Issue; onBack: () => void }) {
  return (
    <>
      <nav className="breadcrumb" style={{ marginBottom: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}>Projects</button>
        <Icon name="chevR" size={13} />
        <span>{issue.key}</span>
      </nav>
      <div className="dash__head">
        <h1>{issue.name}</h1>
        <div className="card__row">
          <button className="btn btn--ghost btn--sm" onClick={onBack}><Icon name="chevL" /> Back</button>
          <button className="btn btn--primary btn--sm"><Icon name="edit" /> Edit</button>
        </div>
      </div>
      <div className="twocol">
        <div className="twocol__main">
          <dl className="dl">
            <dt>Key</dt><dd>{issue.key}</dd>
            <dt>Type</dt><dd><span className="badge badge--neutral">{issue.type}</span></dd>
            <dt>Status</dt><dd><StatusBadge tone={issue.status} label={STATUS_LABEL(issue.status)} /></dd>
            <dt>Environment</dt><dd>{issue.env}</dd>
            <dt>Story points</dt><dd>{issue.points}</dd>
            <dt>Created</dt><dd>{issue.created}</dd>
          </dl>
          <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, margin: '20px 0 10px' }}>History</h2>
          <ol className="timeline">
            <li className="timeline__item timeline__item--done">
              <span className="timeline__dot"><Icon name="check" /></span>
              <div className="timeline__body"><div className="timeline__head"><span className="timeline__title">Created</span><span className="timeline__time">{issue.created}</span></div><div className="timeline__desc">Filed by @ava_chen</div></div>
            </li>
            <li className="timeline__item timeline__item--done">
              <span className="timeline__dot"><Icon name="check" /></span>
              <div className="timeline__body"><div className="timeline__head"><span className="timeline__title">Assigned to {issue.assignee}</span><span className="timeline__time">2d ago</span></div></div>
            </li>
            <li className="timeline__item timeline__item--current">
              <span className="timeline__dot"><span className="timeline__pulse" /></span>
              <div className="timeline__body"><div className="timeline__head"><span className="timeline__title">In progress</span><span className="timeline__time">now</span></div><div className="timeline__desc">Branch {issue.key.toLowerCase()} · 3 commits</div></div>
            </li>
          </ol>
        </div>
        <div className="twocol__side">
          <div className="twocol__tile">
            <div style={{ fontSize: 11, fontWeight: 600 }}>Assignee</div>
            <div className="card__row" style={{ gap: 6, marginTop: 4 }}><span className="avatar avatar--sm" style={{ fontSize: 10 }}>{issue.assignee}</span><span style={{ fontSize: 11.5 }}>Team member</span></div>
          </div>
          <div className="twocol__tile">
            <div style={{ fontSize: 11, fontWeight: 600 }}>Priority</div>
            <span className={`badge badge--${issue.prio === 'high' ? 'danger' : issue.prio === 'med' ? 'warn' : 'info'}`}>{issue.prio === 'high' ? 'High' : issue.prio === 'med' ? 'Medium' : 'Low'}</span>
          </div>
          <div className="twocol__tile">
            <div style={{ fontSize: 11, fontWeight: 600 }}>Linked PR</div>
            <div style={{ fontSize: 10.5, color: 'var(--k-primary)' }}>{issue.key} · feat/{issue.name} ↗</div>
          </div>
        </div>
      </div>
    </>
  )
}

/* === Board — its own Workspace page: a real issue-tracker board (Jira/Linear
 * style). A board toolbar (assignee avatars + Epic/Type filters + Group by +
 * Insights, composed from existing primitives) above the system .kanban with
 * rich issue cards (epic tag, key + type glyph, points, priority, assignee). */
type BoardIssue = { t: string; k: string; epic: string; epicColor: string; pts: number; prio: 'high' | 'med' | 'low'; av: string }
const BOARD_PRIO: Record<BoardIssue['prio'], string> = {
  high: 'var(--k-danger-soft-fg)', med: 'var(--k-warning-soft-fg)', low: 'var(--k-info-soft-fg)',
}
/* Docs — the Confluence-style document product (suite P3). A page-tree
 * (TreeView) sidebar + a document pane: editor Toolbar, Tabs, and the article
 * itself (Typography + inline CodeBlock + Carousel + Accordion). Canonical home
 * for TreeView / Toolbar / Tabs / Typography / CodeBlock / Carousel / Accordion. */
function DocTreeRow({ label, expanded, onClick, leaf, selected }: { label: string; expanded?: boolean; onClick?: () => void; leaf?: boolean; selected?: boolean }) {
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

function DocCarousel() {
  const slides: [number, string][] = [[1, 'Dashboard'], [2, 'Editor'], [3, 'Insights'], [4, 'Settings']]
  const [i, setI] = useState(0)
  const go = (d: number) => setI((p) => (p + d + slides.length) % slides.length)
  return (
    <div className="carousel" style={{ margin: '0 0 0.4em' }}>
      <div className="carousel__viewport">
        <div className="carousel__track" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides.map(([s, cap]) => (
            <div key={s} className="carousel__slide" style={{ background: `var(--k-grad-${s})` }}>
              <span className="carousel__caption">{cap}</span>
            </div>
          ))}
        </div>
        <button className="carousel__arrow carousel__arrow--prev" aria-label="Previous slide" onClick={() => go(-1)}><Icon name="chevL" /></button>
        <button className="carousel__arrow carousel__arrow--next" aria-label="Next slide" onClick={() => go(1)}><Icon name="chevR" /></button>
      </div>
      <div className="cdots" role="tablist" aria-label="Screenshot">
        {slides.map(([s], j) => (
          <button key={s} className={'cdots__dot' + (i === j ? ' is-on' : '')} role="tab" aria-selected={i === j} aria-label={`Go to screenshot ${s}`} onClick={() => setI(j)} />
        ))}
      </div>
    </div>
  )
}

function DocsScreen() {
  const [tab, setTab] = useState(0)
  const [navOpen, setNavOpen] = useState(false)
  const [treeOpen, setTreeOpen] = useState<Set<string>>(new Set(['guides', 'api']))
  const [page, setPage] = useState('Getting started')
  const toggleTree = (k: string) => setTreeOpen((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  return (
    <>
      <Breadcrumb here="Handbook" />
      <div className="dash__head">
        <h1>Docs</h1>
        <div className="card__row">
          <button className="btn btn--ghost btn--sm"><Icon name="upload" /> Share</button>
          <button className="btn btn--primary btn--sm"><Icon name="plus" /> New page</button>
        </div>
      </div>
      {/* NavMenu — horizontal space switcher with a dropdown flyout. */}
      <nav className="navmenu" style={{ marginBottom: 16 }}>
        <button className="navmenu__item navmenu__item--on">Handbook</button>
        <div className="navmenu__group">
          <button className="navmenu__item" aria-expanded={navOpen} onClick={() => setNavOpen((v) => !v)}>Spaces <Icon name="chevD" size={12} /></button>
          {navOpen && (
            <div className="navmenu__panel menu" role="menu" onMouseLeave={() => setNavOpen(false)}>
              <button className="menu__item" role="menuitem"><Icon name="grid" /> Engineering</button>
              <button className="menu__item" role="menuitem"><Icon name="chart" /> Product</button>
              <button className="menu__item" role="menuitem"><Icon name="cog" /> Operations</button>
            </div>
          )}
        </div>
        <button className="navmenu__item">API reference</button>
        <button className="navmenu__item">Changelog</button>
      </nav>
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 20, alignItems: 'start' }}>
        {/* TreeView — the page tree. */}
        <div className="tree" role="tree" aria-label="Pages">
          <DocTreeRow label="Guides" expanded={treeOpen.has('guides')} onClick={() => toggleTree('guides')} />
          {treeOpen.has('guides') && (
            <div className="tree__group">
              {['Getting started', 'Architecture', 'Deployment'].map((p) => (
                <DocTreeRow key={p} label={p} leaf selected={page === p} onClick={() => setPage(p)} />
              ))}
            </div>
          )}
          <DocTreeRow label="API reference" expanded={treeOpen.has('api')} onClick={() => toggleTree('api')} />
          {treeOpen.has('api') && (
            <div className="tree__group">
              {['Authentication', 'Endpoints', 'Webhooks'].map((p) => (
                <DocTreeRow key={p} label={p} leaf selected={page === p} onClick={() => setPage(p)} />
              ))}
            </div>
          )}
          <DocTreeRow label="Changelog" leaf selected={page === 'Changelog'} onClick={() => setPage('Changelog')} />
        </div>

        {/* Document pane — editor Toolbar + Tabs + article. */}
        <div>
          <div className="toolbar" style={{ marginBottom: 14 }}>
            <span className="toolbar__group">
              <button className="btn btn--ghost" aria-label="Bold"><strong>B</strong></button>
              <button className="btn btn--ghost" aria-label="Italic"><em>I</em></button>
              <button className="btn btn--ghost" aria-label="Inline code"><Icon name="chevR" size={13} /></button>
            </span>
            <span className="toolbar__group">
              <button className="btn btn--ghost">Heading <Icon name="chevD" size={13} /></button>
            </span>
            <span className="toolbar__spacer" />
            <select className="select" style={{ width: 'auto' }} aria-label="Document status">
              <option>Draft</option><option>Published</option>
            </select>
            <button className="btn btn--primary"><Icon name="check" /> Publish</button>
          </div>

          <div className="tabs" role="tablist" aria-label="Document views">
            {(['Document', 'Comments', 'History'] as const).map((t, i) => (
              <button key={t} className={`tab ${tab === i ? 'tab--on' : ''}`} onClick={() => setTab(i)} role="tab" aria-selected={tab === i}>
                <Icon name={i === 0 ? 'file' : i === 1 ? 'chat' : 'feed'} /><span>{t}</span>{i === 1 ? <span className="tab__badge">3</span> : null}
              </button>
            ))}
          </div>

          <div className="tabpanel" role="tabpanel" style={{ paddingTop: 10 }}>
            {tab === 0 && (
              <article style={{ maxWidth: 680 }}>
                <h1 style={{ fontSize: 'var(--k-type-h1)', fontFamily: 'var(--k-font-display)', fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 0.35em' }}>{page}</h1>
                <p style={{ fontSize: 'var(--k-type-body)', lineHeight: 1.55, color: 'var(--k-fg-muted)', margin: '0 0 1.4em' }}>
                  A practical walkthrough of how SupaDash fits together — from the first deploy
                  to wiring up your own services.
                </p>
                <h2 style={{ fontSize: 'var(--k-type-h2)', fontWeight: 600, margin: '0 0 0.5em' }}>Install the SDK</h2>
                <p style={{ fontSize: 'var(--k-type-body)', lineHeight: 1.65, margin: '0 0 1em' }}>
                  Pull the package from your registry, then connect with a single call:
                </p>
                <div className="codeblock" style={{ margin: '0 0 1.6em' }}>
                  <div className="codeblock__head">
                    <span className="codeblock__file">install.sh</span>
                    <button className="codeblock__copy" aria-label="Copy">
                      <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden><path d="M3 1 H 9 V 8 M 1 3 H 7 V 11 H 1 Z" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                      Copy
                    </button>
                  </div>
                  <pre className="codeblock__pre">
                    {['npm i @supadash/sdk', '', 'import { connect } from "@supadash/sdk"', 'const db = connect(process.env.SUPADASH_URL)'].map((line, i) => (
                      <code key={i} className="codeblock__line"><span className="codeblock__gutter">{i + 1}</span><span className="codeblock__text">{line || ' '}</span></code>
                    ))}
                  </pre>
                </div>
                <h2 style={{ fontSize: 'var(--k-type-h2)', fontWeight: 600, margin: '0 0 0.6em' }}>Screenshots</h2>
                <DocCarousel />
                <h2 style={{ fontSize: 'var(--k-type-h2)', fontWeight: 600, margin: '1.4em 0 0.5em' }}>Common questions</h2>
                <div className="accordion">
                  {([['Where do I find my API key?', 'Project settings → API. Keys are scoped per environment.'], ['Can I self-host?', 'Yes — the runtime ships as a single container with a Postgres backend.'], ['How are tokens versioned?', 'Each publish snapshots the config; older builds keep their pinned set.']] as [string, string][]).map(([q, a], i) => (
                    <details key={q} open={i === 0}>
                      <summary>{q}<span className="accordion__chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></span></summary>
                      <p>{a}</p>
                    </details>
                  ))}
                </div>
              </article>
            )}
            {tab === 1 && (
              <div className="list list--flush" style={{ maxWidth: 620 }}>
                <div className="list__item"><span className="list__lead list__lead--icon-muted"><span className="avatar avatar--sm" style={{ fontSize: 10 }}>AC</span></span><span className="list__body"><span className="list__title">Ava Chen</span><span className="list__sub">Should we document the staging URL here too?</span></span><span className="list__trail list__trail--text">2h</span></div>
                <div className="list__item"><span className="list__lead list__lead--icon-muted"><span className="avatar avatar--sm" style={{ fontSize: 10 }}>JM</span></span><span className="list__body"><span className="list__title">Jordan Maxwell</span><span className="list__sub">Good call — added under Deployment.</span></span><span className="list__trail list__trail--text">1h</span></div>
              </div>
            )}
            {tab === 2 && (
              <div className="list" style={{ maxWidth: 620 }}>
                <div className="list__item"><span className="list__body"><span className="list__title">v12 · Published</span><span className="list__sub">Jordan Maxwell</span></span><span className="list__trail list__trail--text">Today</span></div>
                <div className="list__item"><span className="list__body"><span className="list__title">v11 · Edited install steps</span><span className="list__sub">Ava Chen</span></span><span className="list__trail list__trail--text">Yesterday</span></div>
                <div className="list__item"><span className="list__body"><span className="list__title">v10 · Created page</span><span className="list__sub">Ava Chen</span></span><span className="list__trail list__trail--text">Jun 1</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function Board() {
  const [group, setGroup] = useState('None')
  const cols: { name: string; cards: BoardIssue[] }[] = [
    { name: 'To Do', cards: [
      { t: 'Optimize experience for mobile web', k: 'NUC-344', epic: 'Billing', epicColor: 'var(--k-chart-1)', pts: 2, prio: 'med', av: 'AB' },
      { t: 'Rate-limit the public API gateway', k: 'NUC-351', epic: 'Platform', epicColor: 'var(--k-chart-5)', pts: 5, prio: 'high', av: 'EF' },
    ] },
    { name: 'In Progress', cards: [
      { t: 'Fast trip search', k: 'NUC-342', epic: 'Accounts', epicColor: 'var(--k-chart-2)', pts: 4, prio: 'high', av: 'CD' },
      { t: 'Affiliate links integration — frontend', k: 'NUC-335', epic: 'Billing', epicColor: 'var(--k-chart-1)', pts: 2, prio: 'med', av: 'GH' },
    ] },
    { name: 'In Review', cards: [
      { t: 'Webhook retry queue with backoff', k: 'NUC-329', epic: 'Platform', epicColor: 'var(--k-chart-5)', pts: 3, prio: 'low', av: 'AB' },
    ] },
    { name: 'Done', cards: [
      { t: 'Customers reporting shopping cart purchasing issues with the BG web store', k: 'NUC-344', epic: 'Accounts', epicColor: 'var(--k-chart-2)', pts: 2, prio: 'med', av: 'IJ' },
      { t: 'BugFix BG Web-store app crashing', k: 'NUC-337', epic: 'Forms', epicColor: 'var(--k-chart-3)', pts: 5, prio: 'low', av: 'CD' },
    ] },
  ]
  const team = ['AB', 'CD', 'EF', 'GH']
  return (
    <>
      <Breadcrumb here="Board" />
      <div className="dash__head">
        <h1>Board</h1>
        <button className="btn btn--primary btn--sm"><Icon name="plus" /> Create</button>
      </div>

      {/* Board toolbar — the .toolbar recipe forces every control to one
          height, so the search input, ghost filters, select and Insights
          button all line up regardless of their individual sizing. */}
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <label className="in in--inline" style={{ maxWidth: 200 }}>
          <Icon name="search" />
          <input type="search" placeholder="Search board…" aria-label="Search board" />
        </label>
        <span className="avatar-group">
          {team.map((a) => <span key={a} className="avatar avatar--sm" style={{ fontSize: 10 }}>{a}</span>)}
          <span className="avatar-group__more">+3</span>
        </span>
        {/* Filter pair — one cluster, tight 8px between them. */}
        <span className="toolbar__group">
          <button className="btn btn--ghost">Epic <Icon name="chevD" size={13} /></button>
          <button className="btn btn--ghost">Type <Icon name="chevD" size={13} /></button>
        </span>
        <span className="toolbar__spacer" />
        {/* Right zone = board-view tools, ONE flat cluster (uniform 8px, matching
            the left filter pair). The __spacer carries the only major boundary.
            The .toolbar__label primitive keeps "Group by" visually distinct from
            the controls without a nested group — flat vocabulary = 1:1 rebuildable
            from the export, no preview-only inline styling. */}
        <span className="toolbar__group">
          <span className="toolbar__label">Group by</span>
          <select className="select" style={{ width: 'auto' }} value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Group issues by">
            <option>None</option><option>Assignee</option><option>Epic</option><option>Priority</option>
          </select>
          <button className="btn btn--ghost"><Icon name="chart" size={14} /> Insights</button>
        </span>
      </div>

      <div className="kanban">
        {cols.map((c) => (
          <div key={c.name} className="kanban__col">
            <div className="kanban__col-head">{c.name}<span className="kanban__count">{c.cards.length}</span></div>
            {c.cards.map((card) => (
              <div key={card.k + card.t} className="kanban__card">
                <span className="kanban__card-title">{card.t}</span>
                <span className="kanban__tag" style={{ background: card.epicColor, color: '#fff' }}>{card.epic}</span>
                <div className="kanban__card-foot">
                  <span className="kanban__stats">
                    <span className="kanban__key"><Icon name="file" size={14} /> {card.k}</span>
                    <span className="kanban__pts">{card.pts}</span>
                    <span className="kanban__prio" style={{ color: BOARD_PRIO[card.prio] }} aria-label={`${card.prio} priority`}>
                      <i /><i /><i />
                    </span>
                  </span>
                  <span className="avatar avatar--sm" style={{ width: 22, height: 22, fontSize: 9 }}>{card.av}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

const METRICS = ['Latency', 'Throughput', 'Error rate']
const RANGES = ['7d', '30d', '90d', 'Custom'] as const

const SERIES: Record<Exclude<(typeof RANGES)[number], 'Custom'>, number[]> = {
  '7d':  [42, 38, 51, 47, 60, 55, 64],
  '30d': [38, 45, 42, 50, 47, 56, 52, 60, 58, 65, 62, 70],
  '90d': [50, 48, 55, 52, 60, 57, 64, 61, 68, 65, 72, 69, 75, 73, 80],
}

// ============================================================
// INBOX — messages with bulk actions, combobox filter, pagination
// ============================================================

const INBOX_MESSAGES = [
  { id: 1, from: 'Stripe',         initials: 'ST', subject: 'Payment succeeded',         preview: 'Invoice #2024-001 for $4,820 paid by',   time: '2m',  unread: true,  tag: 'Billing' },
  { id: 2, from: 'GitHub',         initials: 'GH', subject: '[PR] Refactor token engine', preview: 'pagemaestro opened pull request #248',    time: '14m', unread: true,  tag: 'Code' },
  { id: 3, from: 'Cloudflare',     initials: 'CF', subject: 'Domain magicpage.app ready', preview: 'DNS propagated successfully — site is l', time: '1h',  unread: true,  tag: 'Infra' },
  { id: 4, from: 'Linear',         initials: 'LN', subject: 'You were assigned NW-412',    preview: '"Add OTP input to Settings page" by Ava',  time: '2h',  unread: true,  tag: 'Tickets' },
  { id: 5, from: 'Vercel',         initials: 'VC', subject: 'Deployment succeeded',        preview: 'main → production deployed in 38s',       time: '5h',  unread: false, tag: 'Code' },
  { id: 6, from: 'Notion',         initials: 'NT', subject: 'Casey shared a doc',          preview: 'Q2 roadmap — please review by Friday',     time: '1d',  unread: false, tag: 'Docs' },
  { id: 7, from: 'Plausible',      initials: 'PL', subject: 'Weekly traffic report',       preview: 'Visitors +14% vs previous week — top page',time: '2d',  unread: false, tag: 'Analytics' },
  { id: 8, from: 'Resend',         initials: 'RS', subject: 'Email API quota at 80%',      preview: 'Reset on 1 June — upgrade or wait',        time: '3d',  unread: false, tag: 'Infra' },
]

const FILTERS = ['All', 'Unread', 'Starred', 'Billing', 'Code', 'Infra'] as const

function Inbox({ onOpenCmdp }: { onOpenCmdp: () => void }) {
  // Messages (mail list) vs Notifications (system events) — surfaces the
  // notifications as a flush list (.list list--flush) inside a real screen.
  const [tab, setTab] = useState<'messages' | 'notifications'>('messages')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  // Opening a mail row drills into the conversation Thread (Composer + AttachmentChip).
  const [openMsg, setOpenMsg] = useState<(typeof INBOX_MESSAGES)[number] | null>(null)

  const filtered = INBOX_MESSAGES.filter((m) => {
    if (filter === 'Unread') return m.unread
    if (filter === 'Starred') return false // empty-state demo
    if (filter !== 'All') return m.tag === filter
    return true
  }).filter((m) => `${m.from} ${m.subject} ${m.preview}`.toLowerCase().includes(q.toLowerCase()))

  const toggle = (id: number) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((m) => m.id)))
  }
  const allSelected = filtered.length > 0 && selected.size === filtered.length

  if (openMsg) return <MailThread msg={openMsg} onBack={() => setOpenMsg(null)} />

  return (
    <>
      <Breadcrumb here="Inbox" />
      <div className="dash__head">
        <h1>Inbox</h1>
        <div className="card__row">
          <button className="btn btn--ghost btn--sm" onClick={onOpenCmdp}>
            <Icon name="search" /> Search <span className="kbd" style={{ marginLeft: 4 }}>⌘K</span>
          </button>
          <button className="btn btn--primary btn--sm">
            <Icon name="plus" /> Compose
          </button>
        </div>
      </div>

      {/* Messages vs Notifications — two inbox modes. */}
      <div className="segctrl" style={{ marginBottom: 14, width: 'fit-content' }}>
        <button className={`segctrl__btn ${tab === 'messages' ? 'segctrl__btn--on' : ''}`} onClick={() => setTab('messages')}>Messages</button>
        <button className={`segctrl__btn ${tab === 'notifications' ? 'segctrl__btn--on' : ''}`} onClick={() => setTab('notifications')}>Notifications</button>
      </div>

      {tab === 'notifications' ? <InboxNotifications /> : <>
      {/* Toolbar: search + combobox filter */}
      <div className="card__row" style={{ marginBottom: 14, gap: 8 }}>
        <div className="in in--inline" style={{ flex: 1, maxWidth: 320 }}>
          <Icon name="search" />
          <input type="search" aria-label="Search messages" placeholder="Search messages…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {/* Combobox filter */}
        <div className="combobox">
          <button
            type="button"
            className="select-trigger"
            style={{ minWidth: 140 }}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((v) => !v)}
          >
            <span>{filter}</span>
            <Icon name="chevD" />
          </button>
          {filterOpen && (
            <div className="combobox__pop">
              <ul className="combobox__list" role="listbox">
                {FILTERS.map((f) => (
                  <li
                    key={f}
                    role="option"
                    tabIndex={0}
                    aria-selected={filter === f}
                    className={`combobox__item ${filter === f ? 'combobox__item--selected' : ''}`}
                    onClick={() => { setFilter(f); setFilterOpen(false) }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setFilter(f)
                        setFilterOpen(false)
                      }
                    }}
                  >
                    <span className="combobox__check">{filter === f ? '✓' : ''}</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Message list — or empty state */}
      {filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 8px', textAlign: 'center', border: '1px dashed var(--k-border)', borderRadius: 'var(--k-radius-md)' }}>
          <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--k-surface-2)', display: 'grid', placeItems: 'center', color: 'var(--k-fg-muted)' }}>
            <Icon name="bell" size={20} />
          </span>
          <div className="card__col" style={{ gap: 2, alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>No {filter.toLowerCase()} messages</span>
            <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>Try a different filter or compose a new message.</span>
          </div>
          <button className="btn btn--primary btn--sm">
            <Icon name="plus" /> Compose
          </button>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--k-border)', borderRadius: 'var(--k-radius-md)', overflow: 'hidden', background: 'var(--k-surface)' }}>
          {/* Header row: select all */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderBottom: 'var(--k-divider)', background: 'var(--k-surface-sunken)', fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>
            <label className="check">
              <input type="checkbox" aria-label="Select all messages" checked={allSelected} onChange={toggleAll} />
            </label>
            <span>{filtered.length} message{filtered.length !== 1 ? 's' : ''}</span>
            <span style={{ marginLeft: 'auto' }}>{filtered.filter(m => m.unread).length} unread</span>
          </div>
          {/* Rows. Two orthogonal states stack visually:
              - unread  → soft tint (follows Selection-accent: brand-soft or neutral)
              - checked → same tint + 3px primary indicator bar (user action) */}
          {filtered.map((m, i) => {
            const isChecked = selected.has(m.id)
            const showTint = m.unread || isChecked
            return (
            <div
              key={m.id}
              onClick={() => setOpenMsg(m)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderTop: 'var(--k-divider)',
                background: showTint ? 'var(--k-state-selected-bg, var(--k-primary-soft))' : 'transparent',
                boxShadow: isChecked ? 'inset 3px 0 0 0 var(--k-primary)' : undefined,
                cursor: 'pointer',
              }}
            >
              <label className="check" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" aria-label={`Select message from ${m.from}`} checked={selected.has(m.id)} onChange={() => toggle(m.id)} />
              </label>
              <span className={`avatar avatar--sm avatar--a${(i % 6) + 1}`} style={{ flex: 'none' }}>
                {m.initials}
              </span>
              <span style={{ fontWeight: m.unread ? 600 : 500, fontSize: 'var(--k-type-body)', width: 110, flex: 'none' }}>
                {m.from}
              </span>
              {/* Subject is the row's PRIMARY content → body tier (not small).
                  The preview continuation stays muted but rides the same size. */}
              <span style={{ fontSize: 'var(--k-type-body)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: m.unread ? 600 : 400 }}>{m.subject}</span>
                <span style={{ color: 'var(--k-fg-muted)' }}> — {m.preview}</span>
              </span>
              <span className="badge badge--neutral" style={{ flex: 'none' }}>{m.tag}</span>
              <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', width: 36, textAlign: 'right', flex: 'none' }}>
                {m.time}
              </span>
            </div>
            )
          })}
        </div>
      )}

      {/* Pagination — always visible when there are results */}
      {filtered.length > 0 && (
        <div className="card__row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
          <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>
            Showing {filtered.length} of {INBOX_MESSAGES.length}
          </span>
          <div className="pagination">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="prev"><Icon name="chevL" /></button>
            <button aria-current={page === 1} onClick={() => setPage(1)}>1</button>
            <button aria-current={page === 2} onClick={() => setPage(2)}>2</button>
            <button aria-current={page === 3} onClick={() => setPage(3)}>3</button>
            <span className="pagination__ellipsis">…</span>
            <button aria-current={page === 12} onClick={() => setPage(12)}>12</button>
            <button onClick={() => setPage((p) => Math.min(12, p + 1))} aria-label="next"><Icon name="chevR" /></button>
          </div>
        </div>
      )}

      {/* Bulk action bar — snackbar-style floating toolbar. Centered with a
          max-width so it reads as a proper "command center" instead of a
          full-width strip, with generous breathing room from the pagination. */}
      {selected.size > 0 && (
        <div
          style={{
            position: 'sticky',
            bottom: 20,
            marginTop: 40,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              padding: '8px 8px 8px 16px',
              background: 'var(--k-fg)',
              color: 'var(--k-bg)',
              borderRadius: 'var(--k-radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'var(--k-shadow-lg)',
              animation: 'var(--k-anim-slide-up, k-slide-up 200ms ease) backwards',
              maxWidth: '100%',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 'var(--k-type-small)', whiteSpace: 'nowrap' }}>
              {selected.size} selected
            </span>
            <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.18)', margin: '0 4px' }} />
            <button className="btn btn--ghost btn--sm" style={{ color: 'var(--k-bg)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Icon name="check" /> Mark read
            </button>
            <button className="btn btn--ghost btn--sm" style={{ color: 'var(--k-bg)', border: '1px solid rgba(255,255,255,0.2)' }}>
              Archive
            </button>
            <button className="btn btn--danger btn--sm">
              <Icon name="trash" /> Delete
            </button>
            <button className="btn btn--ghost btn--icon btn--sm" onClick={() => setSelected(new Set())} aria-label="Clear selection" style={{ color: 'var(--k-bg)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Icon name="x" />
            </button>
          </div>
        </div>
      )}
      </>}
    </>
  )
}

/* Inbox › Notifications — system events grouped by recency. Surfaces the
 * notifications as a flush list (.list list--flush) — was gallery-only. */
/* A single attachment chip — the .att-chip recipe (thumb + label + meta).
 * Minimal file/audio subset; the gallery card carries the full kind family. */
function MailAttachment({ kind, label, meta }: { kind: 'file' | 'audio'; label: string; meta: string }) {
  return (
    <span className={'att-chip att-chip--' + kind}>
      <span className="att-chip__thumb"><Icon name={kind === 'audio' ? 'bell' : 'file'} /></span>
      <span className="att-chip__body">
        <span className="att-chip__label">{label}</span>
        <span className="att-chip__meta">{meta}</span>
      </span>
    </span>
  )
}

/* Mail thread — the canonical conversation view: message bubbles + an
 * AttachmentChip stack + a Composer reply bar. The suite's ONE thread pattern
 * (Support reuses the same shape with support chrome). */
function MailThread({ msg, onBack }: { msg: (typeof INBOX_MESSAGES)[number]; onBack: () => void }) {
  const [reply, setReply] = useState('')
  const canSend = reply.trim().length > 0
  return (
    <>
      <nav className="breadcrumb" style={{ marginBottom: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}>Inbox</button>
        <Icon name="chevR" size={13} />
        <span>{msg.from}</span>
      </nav>
      <div className="dash__head">
        <h1>{msg.subject}</h1>
        <div className="card__row">
          <button className="btn btn--ghost btn--sm" onClick={onBack}><Icon name="chevL" /> Back</button>
          <span className="badge badge--neutral">{msg.tag}</span>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 680, marginBottom: 16 }}>
        <InboxMessage name={msg.from} av={msg.initials} time={msg.time} body={`${msg.preview} Could you take a look when you get a chance?`} />
        <InboxMessage name="You" av="JM" time="just now" body="On it — pulling the numbers together now and I'll send them over shortly." me />
      </div>
      <div style={{ maxWidth: 680, marginBottom: 16 }}>
        <div className="att-chip-stack">
          <MailAttachment kind="file" label="Q3-forecast.pdf" meta="2.4 MB · PDF" />
          <MailAttachment kind="audio" label="call-notes.m4a" meta="0:42" />
        </div>
      </div>
      <div className={'composer' + (canSend ? ' composer--ready' : '')} style={{ maxWidth: 680 }}>
        <textarea className="composer__input" rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…" />
        <div className="composer__bar">
          <div className="composer__tools">
            <button className="composer__attach" aria-label="Attach"><Icon name="plus" /></button>
            <button className="composer__chip"><Icon name="file" /> Files</button>
            <button className="composer__chip composer__chip--more" aria-label="More tools"><Icon name="grid" /></button>
          </div>
          <div className="composer__send">
            <button className="composer__submit" disabled={!canSend} aria-label="Send">
              <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden><path d="M7 2 L7 12 M3 6 L7 2 L11 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function InboxNotifications() {
  const [read, setRead] = useState(false)
  const items: Array<{ group: string; icon: IconName; title: string; meta: string; unread: boolean }> = [
    { group: 'Today', icon: 'spark', title: 'Deploy finished', meta: 'production · 2m', unread: true },
    { group: 'Today', icon: 'bell', title: '3 PRs awaiting review', meta: 'northwind/api · 1h', unread: true },
    { group: 'Today', icon: 'upload', title: 'Domain magicpage.app is live', meta: 'DNS propagated · 3h', unread: true },
    { group: 'Earlier', icon: 'check', title: 'Nightly backup done', meta: 'yesterday · 04:00', unread: false },
    { group: 'Earlier', icon: 'info', title: 'Casey joined the team', meta: 'yesterday', unread: false },
    { group: 'Earlier', icon: 'cal', title: 'Invoice INV-2041 due soon', meta: '2 days ago', unread: false },
  ]
  const unread = read ? 0 : items.filter((i) => i.unread).length
  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--k-s-8)', borderBottom: 'var(--k-divider)' }}>
        <span style={{ fontWeight: 600, fontSize: 'var(--k-type-small)' }}>{unread} unread</span>
        <button className="btn btn--ghost btn--sm" onClick={() => setRead(true)}>Mark all read</button>
      </div>
      {['Today', 'Earlier'].map((g) => (
        <div key={g} className="list list--flush">
          <div className="list__section">{g}</div>
          {items.filter((i) => i.group === g).map((i) => (
            <div key={i.title} className={`list__item ${i.unread && !read ? 'list__item--unread' : ''}`}>
              <span className="list__lead list__lead--icon-muted"><Icon name={i.icon} size={15} /></span>
              <div className="list__body">
                <div className="list__title list__title--lg">{i.title}</div>
                <div className="list__sub">{i.meta}</div>
              </div>
              {i.unread && !read && <span className="list__dot" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// MEDIA — file uploads (dropzone) + grid + sheet drawer for details
// ============================================================

const MEDIA_FILES = [
  { id: 1, name: 'hero-banner.png',       size: '2.4 MB',  type: 'image', tone: 'success' as const, badge: 'PNG' },
  { id: 2, name: 'brand-deck-q2.pdf',     size: '8.1 MB',  type: 'doc',   tone: 'danger'  as const, badge: 'PDF' },
  { id: 3, name: 'onboarding.mp4',        size: '24.7 MB', type: 'video', tone: 'warn'    as const, badge: 'MP4' },
  { id: 4, name: 'product-shot-01.jpg',   size: '1.2 MB',  type: 'image', tone: 'success' as const, badge: 'JPG' },
  { id: 5, name: 'design-system.fig',     size: '12.3 MB', type: 'doc',   tone: 'info'    as const, badge: 'FIG' },
  { id: 6, name: 'logo-mark.svg',         size: '8 KB',    type: 'image', tone: 'success' as const, badge: 'SVG' },
  { id: 7, name: 'sales-deck.key',        size: '18.4 MB', type: 'doc',   tone: 'warn'    as const, badge: 'KEY' },
  { id: 8, name: 'roadmap-q2-2026.png',   size: '1.9 MB',  type: 'image', tone: 'success' as const, badge: 'PNG' },
]

function Media() {
  const [over, setOver] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // Image files open in a fullscreen Lightbox; other types open the detail sheet.
  const [lbOpen, setLbOpen] = useState<number | null>(null)
  const IMAGES = MEDIA_FILES.filter((f) => f.type === 'image')
  // Folder tree — selecting a folder filters the grid. "Archive" is empty on
  // purpose so the empty-state pattern shows in a real screen (was gallery-only).
  const [folder, setFolder] = useState('all')
  const [treeOpen, setTreeOpen] = useState(true)
  const selected = MEDIA_FILES.find((f) => f.id === selectedId)
  const shown = MEDIA_FILES.filter((f) =>
    folder === 'all' ? true
      : folder === 'images' ? f.type === 'image'
      : folder === 'videos' ? f.type === 'video'
      : folder === 'docs' ? f.type === 'doc'
      : false)
  const FOLDER_LABEL: Record<string, string> = { all: 'All files', images: 'Images', videos: 'Videos', docs: 'Documents', archive: 'Archive' }
  const FOLDERS: [string, string][] = [['all', 'All files'], ['images', 'Images'], ['videos', 'Videos'], ['docs', 'Documents']]

  return (
    <>
      <Breadcrumb here="Media" />
      <div className="dash__head">
        <h1>Media</h1>
        <div className="card__row">
          {/* Segmented control — grid vs list view. Uses inline list-lines
              SVG because our 20-concept icon system doesn't include one;
              same pattern as ChevronSvg/CopySvg in ComponentGallery. */}
          <div className="segctrl">
            <button className={`segctrl__btn ${view === 'grid' ? 'segctrl__btn--on' : ''}`} onClick={() => setView('grid')}>
              <Icon name="grid" /> Grid
            </button>
            <button className={`segctrl__btn ${view === 'list' ? 'segctrl__btn--on' : ''}`} onClick={() => setView('list')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              List
            </button>
          </div>
          <button className="btn btn--primary btn--sm">
            <Icon name="upload" /> Upload
          </button>
        </div>
      </div>

      {/* Two-pane file browser — folder tree (.tree) + content pane. */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <aside className="tree" style={{ width: 184, flex: 'none' }} role="tree">
          <div
            className="tree__row"
            role="treeitem"
            tabIndex={0}
            aria-expanded={treeOpen}
            onClick={() => setTreeOpen((o) => !o)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setTreeOpen((o) => !o)
              }
            }}
          >
            <span className="tree__chev"><Icon name="chevR" size={13} /></span>
            <span className="tree__icon"><Icon name="grid" size={13} /></span>
            Media
          </div>
          {treeOpen && (
            <div className="tree__group">
              {FOLDERS.map(([id, label]) => (
                <div
                  key={id}
                  className={`tree__row ${folder === id ? 'tree__row--on' : ''}`}
                  role="treeitem"
                  tabIndex={0}
                  aria-selected={folder === id}
                  onClick={() => setFolder(id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setFolder(id)
                    }
                  }}
                >
                  <span className="tree__chev tree__chev--leaf"><Icon name="chevR" size={13} /></span>
                  <span className="tree__icon"><Icon name="file" size={13} /></span>
                  {label}
                </div>
              ))}
            </div>
          )}
          <div
            className={`tree__row ${folder === 'archive' ? 'tree__row--on' : ''}`}
            role="treeitem"
            tabIndex={0}
            aria-selected={folder === 'archive'}
            onClick={() => setFolder('archive')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setFolder('archive')
              }
            }}
          >
            <span className="tree__chev tree__chev--leaf"><Icon name="chevR" size={13} /></span>
            <span className="tree__icon"><Icon name="trash" size={13} /></span>
            Archive
          </div>
        </aside>
        <div style={{ flex: 1, minWidth: 0 }}>

      {/* Dropzone for uploads */}
      <label
        className={`dropzone ${over ? 'dropzone--over' : ''}`}
        style={{ marginBottom: 18 }}
        onDragEnter={(e) => { e.preventDefault(); setOver(true) }}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false) }}
      >
        <span className="dropzone__icon"><Icon name="upload" /></span>
        <span className="dropzone__title">{over ? 'Drop to upload' : 'Drop files or click to browse'}</span>
        <span className="dropzone__hint">Images, PDFs, video — up to 100 MB per file</span>
        <input type="file" hidden multiple aria-label="Upload media files" />
      </label>

      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginBottom: 10 }}>{FOLDER_LABEL[folder]} · {shown.length}</h2>

      {shown.length === 0 ? (
        // Empty-state pattern — shown for the (intentionally empty) Archive folder.
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 8px', textAlign: 'center', border: '1px dashed var(--k-border)', borderRadius: 'var(--k-radius-md)' }}>
          <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--k-surface-2)', display: 'grid', placeItems: 'center', color: 'var(--k-fg-muted)' }}>
            <Icon name="trash" size={22} />
          </span>
          <div className="card__col" style={{ gap: 3, alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Archive is empty</span>
            <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>Files you archive will show up here. Nothing's been archived yet.</span>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => setFolder('all')}>Back to all files</button>
        </div>
      ) : view === 'grid' ? (
        // Grid: 4-column thumbnail tiles
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {shown.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => (f.type === 'image' ? setLbOpen(IMAGES.findIndex((im) => im.id === f.id)) : setSelectedId(f.id))}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 12,
                border: '1px solid var(--k-border)',
                borderRadius: 'var(--k-radius-md)',
                background: 'var(--k-surface)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {/* Image tiles show a colour thumbnail (opens the Lightbox); others a file glyph. */}
              <div style={{ aspectRatio: '4/3', background: f.type === 'image' ? `var(--k-grad-${(f.id % 4) + 1})` : 'var(--k-surface-sunken)', borderRadius: 'calc(var(--k-radius-md) * 0.6)', display: 'grid', placeItems: 'center', color: f.type === 'image' ? '#fff' : 'var(--k-fg-muted)' }}>
                <Icon name={f.type === 'image' ? 'grid' : f.type === 'video' ? 'chart' : 'file'} size={22} />
              </div>
              <div className="card__row" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <span style={{ fontSize: 'var(--k-type-small)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                  {f.name}
                </span>
                <span className={`badge badge--${f.tone}`} style={{ flex: 'none' }}>{f.badge}</span>
              </div>
              <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>{f.size}</span>
            </button>
          ))}
        </div>
      ) : (
        // List: stacked rows with icon, name, type, size, action
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Name</th>
              <th style={{ width: 80 }}>Type</th>
              <th style={{ width: 100 }}>Size</th>
              <th style={{ width: 120 }}>Modified</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((f) => (
              <tr key={f.id} onClick={() => setSelectedId(f.id)} style={{ cursor: 'pointer' }}>
                <td>
                  <span style={{ width: 28, height: 28, borderRadius: 'var(--k-radius-md)', background: 'var(--k-surface-sunken)', color: 'var(--k-fg-muted)', display: 'inline-grid', placeItems: 'center' }}>
                    <Icon name={f.type === 'image' ? 'file' : f.type === 'video' ? 'chart' : 'file'} size={14} />
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{f.name}</td>
                <td><span className={`badge badge--${f.tone}`}>{f.badge}</span></td>
                <td style={{ color: 'var(--k-fg-muted)' }}>{f.size}</td>
                <td style={{ color: 'var(--k-fg-muted)', fontSize: 'var(--k-type-small)' }}>2 days ago</td>
                <td><button className="btn btn--ghost btn--icon btn--sm" aria-label="Actions" onClick={(e) => e.stopPropagation()}><Icon name="dots" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
        </div>
      </div>

      {/* Sheet drawer — opens on file click. Backdrop click closes. */}
      {selected && (
        <>
          <div
            onClick={() => setSelectedId(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
          />
          <aside className="sheet" style={{ position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 41, width: 340 }}>
            <div className="sheet__head">
              <span className="sheet__title">File details</span>
              <button className="btn btn--ghost btn--icon btn--sm" onClick={() => setSelectedId(null)} aria-label="Close">
                <Icon name="x" />
              </button>
            </div>
            <div className="sheet__body">
              <div style={{ aspectRatio: '4/3', background: 'var(--k-surface-sunken)', borderRadius: 'var(--k-radius-md)', display: 'grid', placeItems: 'center', color: 'var(--k-fg-muted)', marginBottom: 14 }}>
                <Icon name="file" size={32} />
              </div>
              <dl className="dl">
                <dt>Name</dt><dd>{selected.name}</dd>
                <dt>Size</dt><dd>{selected.size}</dd>
                <dt>Type</dt><dd><span className={`badge badge--${selected.tone}`}>{selected.badge}</span></dd>
                <dt>Uploaded</dt><dd>2 days ago</dd>
                <dt>By</dt><dd>ava_chen</dd>
              </dl>
            </div>
            <div className="sheet__foot">
              <button className="btn btn--ghost btn--sm">Download</button>
              <button className="btn btn--danger btn--sm">
                <Icon name="trash" /> Delete
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Lightbox — fullscreen image viewer (Media is its canonical home). */}
      {lbOpen !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" onClick={() => setLbOpen(null)}>
          <div className="lightbox__stage" style={{ width: '58%', aspectRatio: '3 / 2', background: `var(--k-grad-${(IMAGES[lbOpen]!.id % 4) + 1})` }} onClick={(e) => e.stopPropagation()} />
          <button className="lightbox__btn lightbox__btn--close" onClick={() => setLbOpen(null)} aria-label="Close"><Icon name="x" /></button>
          <button className="lightbox__btn lightbox__btn--prev" onClick={(e) => { e.stopPropagation(); setLbOpen((lbOpen + IMAGES.length - 1) % IMAGES.length) }} aria-label="Previous"><Icon name="chevL" /></button>
          <button className="lightbox__btn lightbox__btn--next" onClick={(e) => { e.stopPropagation(); setLbOpen((lbOpen + 1) % IMAGES.length) }} aria-label="Next"><Icon name="chevR" /></button>
          <div className="lightbox__count">{lbOpen + 1} / {IMAGES.length}</div>
        </div>
      )}
    </>
  )
}

/* Account › Profile — profile-header pattern (cover + overlapping avatar +
 * bio + dual CTA + counter chips) composed from existing primitives, plus a
 * tabbed body. Demonstrates a consumer profile screen, no new components. */
function Profile() {
  const [tab, setTab] = useState<'overview' | 'activity' | 'team'>('overview')
  const stats: [string, string][] = [['128', 'Posts'], ['4.2k', 'Followers'], ['312', 'Following']]
  const activity = [
    { icon: 'spark' as IconName, text: 'Shipped the motion-token playground', meta: '2h ago' },
    { icon: 'check' as IconName, text: 'Merged PR #248 · token engine refactor', meta: 'Yesterday' },
    { icon: 'upload' as IconName, text: 'Published design-system v2.4', meta: '3 days ago' },
    { icon: 'edit' as IconName, text: 'Updated the brand color guidelines', meta: 'Last week' },
  ]
  return (
    <>
      <Breadcrumb here="Profile" />
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ height: 120, background: 'var(--k-grad-1)' }} />
        <div style={{ padding: '0 20px', display: 'flex', gap: 16, alignItems: 'flex-end', marginTop: -38 }}>
          <span className="avatar" style={{ width: 86, height: 86, fontSize: 30, border: '3px solid var(--k-surface)', flex: 'none' }}>AC</span>
          <div style={{ flex: 1, paddingBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 'var(--k-type-h2)' }}>Ava Chen</h1>
              <span className="badge badge--neutral">Pro</span>
            </div>
            <div style={{ color: 'var(--k-fg-muted)', fontSize: 'var(--k-type-small)' }}>@ava_chen · Design engineer</div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 6 }}>
            <button className="btn btn--ghost btn--sm"><Icon name="bell" /> Message</button>
            <button className="btn btn--primary btn--sm"><Icon name="plus" /> Follow</button>
          </div>
        </div>
        <p style={{ padding: '12px 20px 0', color: 'var(--k-fg-muted)', fontSize: 'var(--k-type-small)', maxWidth: 580, lineHeight: 1.5 }}>
          Building design systems at SupaDash — tokens, motion, and the occasional plant photo. Previously at Northwind.
        </p>
        <div style={{ display: 'flex', gap: 28, padding: '14px 20px 18px' }}>
          {stats.map(([n, l]) => (
            <div key={l}>
              <div style={{ fontWeight: 700, fontSize: 'var(--k-type-body)' }}>{n}</div>
              <div style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="segctrl" style={{ marginBottom: 14, width: 'fit-content' }}>
        <button className={`segctrl__btn ${tab === 'overview' ? 'segctrl__btn--on' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`segctrl__btn ${tab === 'activity' ? 'segctrl__btn--on' : ''}`} onClick={() => setTab('activity')}>Activity</button>
        <button className={`segctrl__btn ${tab === 'team' ? 'segctrl__btn--on' : ''}`} onClick={() => setTab('team')}>Team</button>
      </div>

      {tab === 'team' ? (
        <Team />
      ) : tab === 'overview' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[['Projects', '12', 'Active across 3 teams'], ['Contributions', '1,284', 'This year'], ['Streak', '46 days', 'Current']].map(([t, n, d]) => (
            <div key={t} className="card">
              <div style={{ fontSize: 'var(--k-type-eyebrow)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--k-fg-muted)', fontWeight: 500 }}>{t}</div>
              <div style={{ fontSize: 'var(--k-type-h2)', fontWeight: 700, margin: '4px 0 2px' }}>{n}</div>
              <div style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>{d}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 620 }}>
          <div className="list list--flush">
            {activity.map((a, i) => (
              <div key={i} className="list__item">
                <span className="list__lead list__lead--icon-muted"><Icon name={a.icon} size={15} /></span>
                <div className="list__body">
                  <div className="list__title list__title--lg">{a.text}</div>
                  <div className="list__sub">{a.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

/* Account › Sign in — the auth screen everyone judges a kit by. Reuses the
 * .auth system component; a segmented control flips login ↔ create account. */
function SignIn() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [agree, setAgree] = useState(false)
  return (
    <>
      <Breadcrumb here="Sign in" />
      <div style={{ display: 'grid', placeItems: 'center', padding: '20px 0' }}>
        <div className="card" style={{ width: 384, maxWidth: '100%' }}>
          <div className="segctrl" style={{ marginBottom: 18 }}>
            <button className={`segctrl__btn ${mode === 'login' ? 'segctrl__btn--on' : ''}`} onClick={() => setMode('login')}>Sign in</button>
            <button className={`segctrl__btn ${mode === 'register' ? 'segctrl__btn--on' : ''}`} onClick={() => setMode('register')}>Create account</button>
          </div>
          {mode === 'login' ? (
            <div className="auth">
              <div className="auth__head">
                <div className="auth__title">Welcome back</div>
                <div className="auth__sub">Sign in to your SupaDash account</div>
              </div>
              <div className="auth__social auth__social--row">
                <button className="btn btn--outline">Google</button>
                <button className="btn btn--outline">GitHub</button>
              </div>
              <div className="divider-or">or</div>
              <label className="lab" htmlFor="signin-email"><span>Email</span><input id="signin-email" className="in" type="email" defaultValue="ava@supadash.io" /></label>
              <label className="lab" htmlFor="signin-password"><span>Password</span><input id="signin-password" className="in" type="password" defaultValue="supersecret" /></label>
              <div className="auth__meta">
                <label className="check" style={{ gap: 6 }}><input type="checkbox" defaultChecked /> Remember me</label>
                <a className="auth__link">Forgot password?</a>
              </div>
              <button className="btn btn--primary btn--block">Sign in</button>
              <div className="auth__foot">Don't have an account? <a className="auth__link" onClick={() => setMode('register')}>Sign up</a></div>
            </div>
          ) : (
            <div className="auth">
              <div className="auth__head">
                <div className="auth__title">Create your account</div>
                <div className="auth__sub">Start your 14-day free trial — no card needed</div>
              </div>
              <div className="auth__social"><button className="btn btn--outline btn--block">Continue with Google</button></div>
              <div className="divider-or">or</div>
              <label className="lab"><span>Full name</span><input className="in" placeholder="Ava Chen" /></label>
              <label className="lab"><span>Work email</span><input className="in" type="email" placeholder="you@company.com" /></label>
              <label className="lab"><span>Password</span><input className="in" type="password" placeholder="8+ characters" /></label>
              <label className="check" style={{ gap: 6, alignItems: 'flex-start' }}>
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span>I agree to the <a className="auth__link">Terms</a> &amp; <a className="auth__link">Privacy Policy</a></span>
              </label>
              <button className="btn btn--primary btn--block" disabled={!agree} style={!agree ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}>Create account</button>
              <div className="auth__foot">Already have an account? <a className="auth__link" onClick={() => setMode('login')}>Sign in</a></div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* Workspace › Calendar — booking/scheduling screen: month grid (.calendar) +
 * the .slotpicker component for the selected day. Composes existing primitives. */
function CalendarPage() {
  const [day, setDay] = useState(4)
  const [slot, setSlot] = useState('10:30')
  const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30']
  const off = new Set(['11:00', '13:00'])
  return (
    <>
      <Breadcrumb here="Calendar" />
      <div className="dash__head"><h1 style={{ flex: 1 }}>Book a session</h1><button className="btn btn--ghost btn--sm"><Icon name="plus" /> New event</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 24, alignItems: 'flex-start' }}>
        <div className="card">
          <div className="card__row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>June 2026</span>
            <div className="card__row" style={{ gap: 2 }}>
              <button className="btn btn--ghost btn--icon" aria-label="Previous month"><Icon name="chevL" /></button>
              <button className="btn btn--ghost btn--icon" aria-label="Next month"><Icon name="chevR" /></button>
            </div>
          </div>
          <div className="calendar">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="calendar__head">{d}</span>)}
            {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
              const parts = ['calendar__cell']
              if (d === day) parts.push('calendar__cell--today')
              return <button key={d} type="button" className={parts.join(' ')} onClick={() => setDay(d)}>{d}</button>
            })}
          </div>
        </div>
        <div className="card">
          <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginBottom: 4 }}>June {day}, 2026</h2>
          <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: '0 0 12px' }}>Select an available time</p>
          {/* Date input — type a date instead of clicking the grid. */}
          <label className="lab" style={{ marginBottom: 12 }}>
            <span>Or jump to a date</span>
            <DatePicker defaultValue="2026-06-04" ariaLabel="Pick a date" />
          </label>
          <div className="slotpicker">
            {slots.map((t) => (
              <button key={t} type="button" className={'slot' + (off.has(t) ? ' slot--off' : slot === t ? ' slot--on' : '')} onClick={() => !off.has(t) && setSlot(t)}>{t}</button>
            ))}
          </div>
          <div className="card__foot">
            <button className="btn btn--primary btn--block"><Icon name="check" /> Book {slot}</button>
          </div>
        </div>
      </div>
    </>
  )
}

/* InboxMessage — a single conversation bubble (avatar + author + time + body),
 * shared by the Inbox mail thread (MailThread). */
function InboxMessage({ name, av, time, body, me }: { name: string; av: string; time: string; body: string; me?: boolean }) {
  return (
    <div className="card" style={me ? { borderColor: 'var(--k-primary-soft)', background: 'var(--k-primary-soft)' } : undefined}>
      <div style={{ display: 'flex', gap: 12 }}>
        <span className={`avatar avatar--sm avatar--${av}`}>{name[0]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <strong style={{ fontSize: 'var(--k-type-small)' }}>{name}</strong>
            <span style={{ fontSize: 'var(--k-type-caption)', color: 'var(--k-fg-muted)' }}>{time}</span>
          </div>
          <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: 0, lineHeight: 1.5 }}>{body}</p>
        </div>
      </div>
    </div>
  )
}
function Analytics() {
  const [metric, setMetric] = useState(0)
  const [range, setRange] = useState<(typeof RANGES)[number]>('30d')
  const [chartType, setChartType] = useState<ChartType>('area')

  // Custom range = a real POPOVER. useDropdown gives outside-click + Escape
  // dismissal; it closes on the SECOND pick (range complete); focus returns to
  // the trigger on close. Calendar cells are real <button>s. Mirrors the
  // gallery DateCard — the dashboard instance was previously a static stub.
  const { open: calOpen, setOpen: setCalOpen, ref: calRef } = useDropdown()
  const calTrigger = useRef<HTMLButtonElement>(null)
  const calToday = 14
  const [start, setStart] = useState<number | null>(10)
  const [end, setEnd] = useState<number | null>(17)
  const [hover, setHover] = useState<number | null>(null)

  const calWasOpen = useRef(calOpen)
  useEffect(() => {
    if (calWasOpen.current && !calOpen) calTrigger.current?.focus()
    calWasOpen.current = calOpen
  }, [calOpen])

  const pickDate = (d: number) => {
    if (d < 1 || d > 31) return
    if (start === null || (start !== null && end !== null)) {
      setStart(d); setEnd(null)
    } else {
      if (d < start) { setEnd(start); setStart(d) } else { setEnd(d) }
      setTimeout(() => setCalOpen(false), 160)
    }
  }

  const effEnd = end ?? (start !== null && hover !== null && hover >= start ? hover : null)
  const effStart = end === null && start !== null && hover !== null && hover < start ? hover : start
  const calDays = Array.from({ length: 35 }, (_, i) => i - 2)
  const cellClass = (d: number): string => {
    const parts = ['calendar__cell']
    if (d < 1 || d > 31) parts.push('calendar__cell--out')
    if (d === calToday) parts.push('calendar__cell--today')
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
  const calSummary =
    start !== null && end !== null ? `May ${Math.min(start, end)} – ${Math.max(start, end)}`
      : start !== null ? 'Now pick an end date'
        : 'Pick a start date'

  const data = SERIES[range === 'Custom' ? '30d' : range]

  return (
    <>
      <Breadcrumb here="Analytics" />
      <div className="dash__head">
        <h1>Analytics</h1>
        <div className="card__row">
          {/* Segmented control — range selector (preset ranges only) */}
          <div className="segctrl">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                className={`segctrl__btn ${range === r ? 'segctrl__btn--on' : ''}`}
                onClick={() => { setRange(r); setCalOpen(false) }}
              >
                {r}
              </button>
            ))}
          </div>
          {/* Custom range → real popover (outside-click + Escape dismiss). */}
          <span className="popover-wrap" ref={calRef}>
            <button
              ref={calTrigger}
              type="button"
              className={`btn btn--ghost btn--sm ${range === 'Custom' ? 'btn--primary' : ''}`}
              aria-haspopup="dialog"
              aria-expanded={calOpen}
              onClick={() => { setRange('Custom'); setCalOpen((o) => !o) }}
            >
              <Icon name="cal" /> Custom
            </button>
            {calOpen && (
              <div className="popover" role="dialog" aria-label="Choose a date range" style={{ left: 'auto', right: 0, width: 268 }}>
                <div className="card__row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--k-type-small)' }}>May 2026</span>
                  <span className="toolbar__group">
                    <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Previous month"><Icon name="chevL" /></button>
                    <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Next month"><Icon name="chevR" /></button>
                  </span>
                </div>
                <div className="calendar" onMouseLeave={() => setHover(null)}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <span key={i} className="calendar__head">{d}</span>
                  ))}
                  {calDays.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      className={cellClass(d)}
                      disabled={d < 1 || d > 31}
                      aria-label={d >= 1 && d <= 31 ? `May ${d}` : undefined}
                      aria-current={d === calToday ? 'date' : undefined}
                      onClick={() => pickDate(d)}
                      onMouseEnter={() => d >= 1 && d <= 31 && setHover(d)}
                    >
                      {d >= 1 && d <= 31 ? d : ''}
                    </button>
                  ))}
                </div>
                <div className="card__row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 'var(--k-type-caption)', color: 'var(--k-fg-muted)' }}>{calSummary}</span>
                  {(start !== null || end !== null) && (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setStart(null); setEnd(null) }}>Clear</button>
                  )}
                </div>
              </div>
            )}
          </span>
        </div>
      </div>
      <div className="card__row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="tabs">
          {METRICS.map((m, i) => (
            <button key={m} className={`tab ${metric === i ? 'tab--on' : ''}`} onClick={() => setMetric(i)}>
              {m}
            </button>
          ))}
        </div>
        {/* Chart-type switcher — same data, five presentational render modes,
            all driven by the --k-chart palette. Proves the palette reads. */}
        <div className="segctrl">
          {(['line', 'area', 'bar'] as const).map((t) => (
            <button key={t} className={`segctrl__btn ${chartType === t ? 'segctrl__btn--on' : ''}`} onClick={() => setChartType(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <ChartFrame
          type={chartType}
          height={190}
          labels={data.map((_, i) => `${i + 1}`)}
          series={[
            { name: METRICS[metric] ?? 'Series', values: data },
            { name: 'Baseline', values: data.map((v) => Math.round(v * 0.62)) },
          ]}
        />
      </div>
      {/* Categorical companions — stacked composition + donut share, the two
          shapes a line chart can't express. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <h2 style={{ fontSize: 'var(--k-type-body)', fontWeight: 600, marginBottom: 12 }}>Requests by tier</h2>
          <ChartFrame
            type="stacked"
            height={150}
            labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
            series={[
              { name: 'Free', values: [22, 30, 26, 34, 40, 28] },
              { name: 'Pro', values: [18, 20, 24, 22, 28, 30] },
              { name: 'Enterprise', values: [10, 14, 12, 18, 16, 20] },
            ]}
          />
        </div>
        <div className="card">
          <h2 style={{ fontSize: 'var(--k-type-body)', fontWeight: 600, marginBottom: 12 }}>Traffic by source</h2>
          <ChartFrame
            type="donut"
            height={150}
            labels={['Direct', 'Search', 'Social', 'Referral']}
            series={[{ name: 'Sources', values: [48, 30, 14, 8] }]}
          />
        </div>
      </div>
      <div className="dash__stats" style={{ marginTop: 20 }}>
        <StatCard label="P50" value="124ms" delta="-3.2%" />
        <StatCard label="P95" value="412ms" delta="+1.1%" tooltip="95th percentile response time" />
        <StatCard label="Errors" value="0.42%" delta="-0.08%" />
        <StatCard label="Uptime" value="99.98%" delta="+0.01%" />
      </div>
    </>
  )
}

// === TEAM PAGE ===

// Avatar colour = decorative ACCENT (identity), NOT a semantic token — a
// person is not "danger red". `dot` stays semantic (presence: online/away).
const MEMBERS = [
  { initials: 'AB', name: 'Aiyana Bowers', role: 'Owner', email: 'aiyana@northwind.dev', dot: 'success' as const, accent: 1 },
  { initials: 'CD', name: 'Casey Diaz', role: 'Engineer', email: 'casey@northwind.dev', dot: 'success' as const, accent: 2 },
  { initials: 'EF', name: 'Eliot Friedman', role: 'Engineer', email: 'eliot@northwind.dev', dot: 'warn' as const, accent: 3 },
  { initials: 'GH', name: 'Greta Holm', role: 'Design', email: 'greta@northwind.dev', dot: 'success' as const, accent: 4 },
  { initials: 'IJ', name: 'Idris Johar', role: 'Support', email: 'idris@northwind.dev', dot: 'success' as const, accent: 5 },
  { initials: 'KL', name: 'Kira Lindqvist', role: 'Engineer', email: 'kira@northwind.dev', dot: 'info' as const, accent: 6 },
]

function Team() {
  const [openCard, setOpenCard] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close popover on outside click
  useEffect(() => {
    if (openCard === null) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpenCard(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openCard])

  return (
    <>
      <div className="dash__head">
        <h1>Team members</h1>
        <button className="btn btn--primary btn--sm">
          <Icon name="plus" /> Invite member
        </button>
      </div>
      {/* Stepper — the team-setup progress indicator (currently on "Invite"). */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card__title" style={{ marginBottom: 10 }}>Set up your team</div>
        <div className="stepper">
          {['Account', 'Workspace', 'Invite', 'Done'].map((label, i) => (
            <div key={label} className={`stepper__step ${i < 2 ? 'stepper__step--done' : ''} ${i === 2 ? 'stepper__step--current' : ''}`}>
              <span className="stepper__dot">{i < 2 ? <Icon name="check" /> : i + 1}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div ref={ref} className="card__col" style={{ gap: 6 }}>
        {MEMBERS.map((m, i) => (
          <div
            key={m.email}
            className="list__row"
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            aria-expanded={openCard === i}
            onClick={() => setOpenCard(openCard === i ? null : i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenCard(openCard === i ? null : i) }
            }}
          >
            <span
              className="avatar"
              style={{
                background: `var(--k-accent-${m.accent}-soft)`,
                color: `var(--k-accent-${m.accent}-soft-fg)`,
                width: 32, height: 32, fontSize: 12,
              }}
            >
              {m.initials}
            </span>
            <div className="card__col" style={{ gap: 2, flex: 1 }}>
              <span style={{ fontWeight: 500 }}>{m.name}</span>
              <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>{m.email}</span>
            </div>
            <span className={`badge badge--neutral`}>{m.role}</span>
            <span className="activity__dot" style={{ background: `var(--k-${m.dot === 'warn' ? 'warning' : m.dot})` }} role="img" aria-label={`Status: ${m.dot}`} />
            {openCard === i && (
              <div
                className="dialog"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  zIndex: 10,
                  padding: 'calc(var(--k-space) * 0.8)',
                  minWidth: 220,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card__row" style={{ gap: 10 }}>
                  <span
                    className="avatar"
                    style={{
                      background: `var(--k-accent-${m.accent}-soft)`,
                      color: `var(--k-accent-${m.accent}-soft-fg)`,
                      width: 36, height: 36, fontSize: 13,
                    }}
                  >
                    {m.initials}
                  </span>
                  <div className="card__col" style={{ gap: 1, flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--k-type-small)' }}>{m.name}</span>
                    <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>{m.role}</span>
                  </div>
                </div>
                <div className="card__row" style={{ marginTop: 10, gap: 6 }}>
                  <button className="btn btn--ghost btn--sm" style={{ flex: 1 }}>Profile</button>
                  <button className="btn btn--secondary btn--sm" style={{ flex: 1 }}>Message</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>
        <span>6 members · 1 owner</span>
        <div className="pagination">
          <button aria-label="Prev"><Icon name="chevL" /></button>
          {[1, 2].map((n) => (
            <button key={n} aria-current={n === 1}>{n}</button>
          ))}
          <button aria-label="Next"><Icon name="chevR" /></button>
        </div>
      </div>
    </>
  )
}

/* Settings extras — the SettingsRow (.list--settings toggles), a Slider and a
 * Selection (radio + checkbox) group. Own state so it slots into Settings
 * without threading more hooks through the parent. */
function SettingsExtras() {
  const [https, setHttps] = useState(true)
  const [maint, setMaint] = useState(false)
  const [bright, setBright] = useState(62)
  const [vol, setVol] = useState(40)
  const Row = ({ title, sub, on, set }: { title: string; sub: string; on: boolean; set: () => void }) => (
    <div className="list__item">
      <div className="list__body"><div className="list__title">{title}</div><div className="list__sub">{sub}</div></div>
      <div className={'toggle ' + (on ? 'toggle--on' : '')} onClick={set} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set() } }} role="switch" aria-checked={on} aria-label={title} tabIndex={0}><div className="toggle__knob" /></div>
    </div>
  )
  return (
    <>
      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginTop: 20, marginBottom: 8 }}>Site</h2>
      <div className="list list--settings">
        <Row title="Force HTTPS" sub="Redirect all requests over HTTPS." on={https} set={() => setHttps((v) => !v)} />
        <Row title="Maintenance mode" sub="Hide your content from discovery." on={maint} set={() => setMaint((v) => !v)} />
      </div>

      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginTop: 20, marginBottom: 8 }}>Display</h2>
      <div style={{ maxWidth: 360 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}><span style={{ fontSize: 'var(--k-type-small)', fontWeight: 500 }}>Brightness</span><span style={{ fontSize: 11, color: 'var(--k-fg-muted)', fontVariantNumeric: 'tabular-nums' }}>{bright}%</span></div>
        <InteractiveSlider value={bright} ariaLabel="Brightness" onChange={setBright} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '12px 0 6px' }}><span style={{ fontSize: 'var(--k-type-small)', fontWeight: 500 }}>Volume</span><span style={{ fontSize: 11, color: 'var(--k-fg-muted)', fontVariantNumeric: 'tabular-nums' }}>{vol}%</span></div>
        <InteractiveSlider value={vol} ariaLabel="Volume" onChange={setVol} />
      </div>

      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginTop: 20, marginBottom: 6 }}>New repository access</h2>
      <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: '0 0 4px' }}>Who can access repositories you create?</p>
      <label className="radio"><input type="radio" name="repo-vis" defaultChecked /> Public — anyone can see it</label>
      <label className="radio"><input type="radio" name="repo-vis" /> Private — you choose who</label>
      <div style={{ borderTop: 'var(--k-divider)', margin: '4px 0 2px' }} />
      <label className="check"><input type="checkbox" defaultChecked /> Add a README</label>
      <label className="check"><input type="checkbox" /> Include .gitignore</label>
    </>
  )
}

function Settings() {
  const [name, setName] = useState('SupaDash Inc.')
  const [region, setRegion] = useState<'eu-west' | 'us-east' | 'ap-south'>('eu-west')
  const [notify, setNotify] = useState(true)
  const [analytics, setAnalytics] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const setOtpAt = (i: number, v: string) => {
    const next = [...otp]
    next[i] = v.slice(-1).toUpperCase()
    setOtp(next)
    if (v && i < 5) otpRefs[i + 1]?.current?.focus()
  }

  const onSave = () => {
    setToast('Settings saved')
    setTimeout(() => setToast(null), 1800)
  }

  return (
    <>
      <Breadcrumb here="Settings" />
      <div className="dash__head">
        <h1>Settings</h1>
        <button className="btn btn--primary btn--sm" onClick={onSave}>
          <Icon name="check" /> Save changes
        </button>
      </div>

      {/* Account section — uses Description List for read-only key/value data */}
      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginBottom: 12 }}>Account</h2>
      <dl className="dl" style={{ marginBottom: 20 }}>
        <dt>Plan</dt>
        <dd>Team — $48/mo · <a href="#" style={{ color: 'var(--k-primary)' }}>Upgrade</a></dd>
        <dt>Member since</dt>
        <dd>March 2024</dd>
        <dt>Storage</dt>
        <dd>14.2 GB of 25 GB used</dd>
        <dt>Status</dt>
        <dd><span className="badge badge--success">Active</span></dd>
      </dl>

      <hr className="sep" />

      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginBottom: 12 }}>Workspace</h2>
      <label className="lab" style={{ marginBottom: 16, maxWidth: 360 }}>
        <span>Name</span>
        <input className="in" value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      {/* Region — Segmented Control replaces stack of radios */}
      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginBottom: 12 }}>Region</h2>
      <div className="segctrl" style={{ marginBottom: 20 }} role="tablist">
        {(['eu-west', 'us-east', 'ap-south'] as const).map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={region === r}
            className={`segctrl__btn ${region === r ? 'segctrl__btn--on' : ''}`}
            onClick={() => setRegion(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginBottom: 12 }}>Notifications</h2>
      <div className="card__col">
        <ToggleRow label="Email me about deploys" value={notify} onChange={setNotify} />
        <ToggleRow label="Share usage analytics" value={analytics} onChange={setAnalytics} />
      </div>

      <hr className="sep" />

      {/* 2FA — OTP input demo */}
      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginBottom: 6 }}>Two-factor auth</h2>
      <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', marginBottom: 10 }}>
        Enter the 6-digit code from your authenticator app.
      </p>
      <div className="otp">
        {otp.slice(0, 3).map((c, i) => (
          <input key={i} ref={otpRefs[i]} className="otp__slot" value={c} maxLength={1} onChange={(e) => setOtpAt(i, e.target.value)} />
        ))}
        <span className="otp__sep">–</span>
        {otp.slice(3).map((c, i) => (
          <input key={i + 3} ref={otpRefs[i + 3]} className="otp__slot" value={c} maxLength={1} onChange={(e) => setOtpAt(i + 3, e.target.value)} />
        ))}
      </div>

      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginTop: 20, marginBottom: 8 }}>API key</h2>
      <pre className="code">{`POST https://api.northwind.dev/v1
Authorization: Bearer nw_live_3f8a92...e0d1`}</pre>

      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginTop: 20, marginBottom: 6 }}>Advanced</h2>
      <div className="accordion">
        <details>
          <summary>Webhooks</summary>
          <p>Configure HTTP callbacks for deploy / error / quota events.</p>
        </details>
        <details>
          <summary>Custom domains</summary>
          <p>Bring your own domain — verification via DNS TXT record.</p>
        </details>
        <details>
          <summary>SSO / SAML</summary>
          <p>Available on Team and Enterprise plans only.</p>
        </details>
      </div>

      <SettingsExtras />

      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, marginTop: 20, marginBottom: 8 }}>Mobile app</h2>
      <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: '0 0 10px' }}>How the bottom tab bar looks on a phone.</p>
      <div className="m-shell m-shell--tabs" style={{ maxWidth: 300 }}>
        <div className="m-tabbar">
          <button className="m-tabbar__tab m-tabbar__tab--on" aria-current="page"><Icon name="home" /><span>Home</span></button>
          <button className="m-tabbar__tab"><Icon name="search" /><span>Search</span></button>
          <button className="m-tabbar__tab"><Icon name="chart" /><span>Stats</span></button>
          <button className="m-tabbar__tab"><Icon name="bell" /><span>Inbox</span></button>
          <button className="m-tabbar__tab"><Icon name="cog" /><span>You</span></button>
        </div>
      </div>

      <div className="dangerzone" style={{ marginTop: 24 }}>
        <div className="dangerzone__head">Danger zone</div>
        <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', marginBottom: 12 }}>
          This deletes the workspace and all its data permanently.
        </p>
        <button className="btn btn--danger btn--sm" onClick={() => setConfirmDelete(true)}>
          <Icon name="trash" /> Delete workspace
        </button>
        {confirmDelete && (
          <div className="dialog-frame" style={{ marginTop: 14 }}>
            <div className="dialog-frame__backdrop" aria-hidden="true" onClick={() => setConfirmDelete(false)} />
            <div className="dialog dialog--alert" role="alertdialog" aria-modal="true">
              <span className="dialog__icon"><Icon name="trash" /></span>
              <h3 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, margin: 0 }}>Delete SupaDash Inc.?</h3>
              <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: 0 }}>
                This will remove all projects, deployments, and team members. This action cannot be undone.
              </p>
              <div className="card__row" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button className="btn btn--danger btn--sm" onClick={() => setConfirmDelete(false)}>
                  <Icon name="trash" /> Yes, delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--k-fg)',
            color: 'var(--k-bg)',
            padding: '10px 16px',
            borderRadius: 'var(--k-radius-md)',
            fontSize: 'var(--k-type-small)',
            fontWeight: 500,
            boxShadow: 'var(--k-shadow-lg)',
            zIndex: 50,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="check" />
          {toast}
        </div>
      )}
    </>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="check" style={{ justifyContent: 'flex-start' }}>
      <button
        type="button"
        aria-pressed={value}
        className={`toggle ${value ? 'toggle--on' : ''}`}
        onClick={() => onChange(!value)}
      >
        <span className="toggle__knob" />
      </button>
      {label}
    </label>
  )
}

