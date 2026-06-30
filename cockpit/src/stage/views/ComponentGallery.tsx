import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement } from 'react'
import { Icon } from '../../icons/Icon'
import type { IconName } from '../../icons/concepts'
import { useDropdown, InteractiveSlider, StatusBadge, DatePicker, MenuButton, useModal, ImgAvatar, Menubar, Resizable, Toggle } from './apps/AppHelpers'
import { ChartFrame } from './ChartFrame'
import type { ChartType } from './ChartFrame'
import { popGalleryJump } from '../../state/galleryJump'
import { renderSection } from '../../showcases/sections'

// PAGE tier — the full-bleed page TEMPLATES (the former "Page recipes" showcase,
// rehoused here as the catalog's 4th wall). Each is a whole screen composed from
// section slabs; renderSection's 'proof' case assembles one per archetype. The
// label doubles as the recipe ("List page — page-head · filter-bar · data-table"),
// so the wall is self-documenting and needs no per-card search.
const PAGE_ARCHETYPES = [
  { archetype: 'list', label: 'List page — page-head · filter-bar · data-table' },
  { archetype: 'detail', label: 'Detail page — page-head · two-column (entity-card · section · timeline)' },
  { archetype: 'dashboard', label: 'Dashboard — page-head · stat-strip · section › entity-grid' },
  { archetype: 'settings', label: 'Settings — page-head · section › form + toggles' },
  { archetype: 'feed', label: 'Feed — page-head · section › timeline' },
  { archetype: 'empty', label: 'Empty — page-head · empty-state' },
] as const

// Human label from a card component's function name (the component TYPE):
// FormCard → "Form", DataTableProCard → "Data Table Pro". (C5)
const labelOf = (fn: () => ReactElement): string =>
  fn.name.replace(/Card$/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim()

// Per-card search index: the VISIBLE title (what the user reads on the card)
// plus type synonyms, so search matches the heading and common alternate names —
// not only the function label. The in-context heading often diverges from the
// type (StatGroupCard reads "Overview", CodeBlockCard reads "Quick start"), which
// is why title search was failing. Keyed by fn.name; titles mirror each card's
// <Card title>. Keep an entry in sync when you rename a heading; a missing entry
// degrades gracefully to the label alone.
const CARD_KEYWORDS: Record<string, string> = {
  // — Text inputs —
  FormCard: 'New contact form fields name email',
  SearchInputCard: 'Search docs search field query',
  PasswordInputCard: 'Set a password strength reveal',
  NumberInputCard: 'Quantity number stepper spinner',
  PhoneInputCard: 'Phone number country code',
  InputOtpCard: 'Verify your email OTP one-time code PIN 2FA',
  InputAddonsCard: 'Input add-ons prefix suffix inline unit inset overlapping label group https',
  // — Pickers & selects —
  DateFieldCard: 'Due date field date picker',
  ComboboxCard: 'Framework combobox autocomplete typeahead',
  SelectCard: 'Deploy region select dropdown',
  TagInputCard: 'Topics tags chips tokens',
  ChipsCard: 'Chips assist filter input suggestion facet token chip',
  DateCard: 'Schedule date picker calendar range',
  CalendarWeekCard: 'Calendar week day view schedule time grid agenda events now line lanes overlap',
  CalendarMonthCard: 'Calendar month scheduler event chips all day overflow more colour coded',
  CalendarYearCard: 'Calendar year view twelve months overview jump',
  CalendarRangeCard: 'Calendar range double two months date range booking',
  SlotPickerCard: 'Slot picker time booking availability',
  // — Choice & toggles —
  SwitchCard: 'Notification settings switch toggle on off',
  SelectionCard: 'Create repository radio checkbox option',
  RadioCardCard: 'Radio card option choice',
  SliderCard: 'Display slider range',
  // — Actions & menus —
  ButtonsCard: 'Buttons primary secondary ghost variants CTA',
  ButtonGroupCard: 'Button group segmented',
  ToolbarCard: 'Documents toolbar actions',
  ToolbarRecipeCard: 'Toolbar actions controls',
  DropdownMenuCard: 'Account dropdown menu',
  ContextMenuCard: 'Context menu right click',
  MenubarCard: 'Menubar menu app menu',
  CmdPaletteCard: 'Quick search command palette cmdk spotlight',
  // — Navigation —
  TabsCard: 'Northwind tabs segmented',
  NavMenuCard: 'Navigation menu navbar megamenu',
  BreadcrumbCard: 'Breadcrumb path trail',
  PaginationCard: 'Search results pagination pages',
  StepperCard: 'Get started stepper steps progress',
  NavCard: 'Side navigation sidebar nav rail',
  // — Overlays & disclosure —
  PopoverCard: 'Profile popover',
  TooltipCard: 'Last sync tooltip hint',
  HoverCardCard: 'Mentions hover card preview',
  AccordionCard: 'Accordion collapse expand disclosure',
  DialogCard: 'Delete project dialog modal',
  AlertDialogCard: 'Confirm delete alert dialog confirmation',
  SheetCard: 'Filters sheet drawer side panel',
  // — Feedback & status —
  ValidationCard: 'Account details validation error invalid',
  BannerCard: 'Maintenance banner alert notice',
  AlertsCard: 'Activity alerts inline messages',
  ProgressCard: 'Storage progress bar',
  SpinnerCard: 'Workspace spinner loader loading',
  SkeletonCard: 'Activity feed skeleton loading placeholder',
  ToastStackCard: 'Toast notification snackbar',
  EmptyStateCard: 'Projects empty state zero blank',
  StatusPageCard: 'System status uptime incidents health',
  NotificationCenterCard: 'Notification center inbox bell',
  // — Data & content —
  TableCard: 'System health table rows',
  GroupedTableCard: 'Grouped table rows summary total row condensed density section headers',
  ResponsiveTableCard: 'Responsive table stacked mobile hidden columns label value cards',
  CardTableCard: 'Card framed table rounded frame sticky header scroll truncate files',
  FrozenColumnTableCard: 'Frozen first column sticky pinned spreadsheet wide table horizontal scroll metrics',
  HorizontalFormCard: 'Profile form labels on left horizontal layout settings dense',
  ColorPickerCard: 'Color colour picker radio swatches label accent choice',
  HeaderVariantsCard: 'Page header breadcrumb tabs banner image cover profile section heading',
  EmptyTemplatesCard: 'Empty state templates starting points action grid blank project create',
  TwoColumnListCard: 'Two column stacked list directory sticky group headings members',
  DataTableProCard: 'Data table pro grid sort filter select',
  ListCard: 'Library list rows items',
  DescriptionListCard: 'Subscription description list key value',
  SettingsRowCard: 'Website settings row toggle preference',
  AttachmentChipCard: 'Attachments file chip',
  InteractiveCardCard: 'Workspaces interactive card selectable',
  AvatarCard: 'Avatar profile picture user',
  StatCard: 'Recurring revenue MRR stat metric KPI sparkline',
  StatGroupCard: 'Overview metrics KPIs summary numbers',
  TrendCard: 'Revenue trend chart sparkline delta',
  ChartCard: 'Traffic by source chart graph analytics',
  UsageMeterCard: 'Monthly quota usage meter limit',
  FileGridCard: 'Files file grid thumbnails',
  TreeViewCard: 'Explorer tree view folders files',
  KanbanCard: 'Sprint board kanban columns cards',
  TimelineCard: 'Release progress timeline activity history',
  InfoCardCard: 'Hosting details info card definition',
  // — Blocks / composed —
  FormPanelCard: 'Form panel labeled fields validation action bar',
  ThreadCard: 'Conversation chat message thread bubble comments',
  ProseCard: 'Article prose rich text body copy changelog docs',
  FilterBarCard: 'Filter bar toolbar facets',
  InboxFilterCard: 'Inbox filter mail messages',
  PricingCardCard: 'Plans pricing tiers subscription',
  CodeBlockCard: 'Quick start code block snippet syntax',
  LoginCard: 'Log in sign in auth credentials',
  SignupCard: 'Sign up register create account auth',
  WizardStepperCard: 'Set up workspace wizard onboarding steps',
  CarouselCard: 'Carousel slider swipe dots',
  LightboxCard: 'Gallery lightbox images photos viewer',
  DropzoneCard: 'Upload files dropzone drag drop',
  DangerZoneCard: 'Danger zone destructive delete',
  FaqCard: 'Help centre FAQ questions accordion',
  TwoColumnLayoutCard: 'Site overview two column layout',
  ResizableCard: 'Resizable panels split handle',
  AspectRatioCard: 'Aspect ratio media frame',
  ScrollAreaCard: 'Scroll area scrollbar overflow',
}
const searchText = (C: () => ReactElement) =>
  (labelOf(C) + ' ' + (CARD_KEYWORDS[C.name] ?? '')).toLowerCase()

export function ComponentGallery({ limit, tier }: { limit?: number; tier?: 'atom' | 'component' | 'section' | 'page' } = {}) {
  // Order strategy: highest brand-impact first, token-neutral utilities last.
  // Users should SEE the result of every token change without scrolling.
  const galleryRef = useRef<HTMLDivElement>(null)
  // One-shot jump from the Showcases inspect panel: a pending query (set via
  // setGalleryJump) pre-fills the search exactly once on mount.
  const [q, setQ] = useState(() => (tier ? popGalleryJump() ?? '' : ''))
  const query = q.trim().toLowerCase()
  const matchesQ = (C: () => ReactElement) => !query || searchText(C).includes(query)

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
  }, [q, tier]) // re-measure when the search filter changes the visible card set

  // The full wall as an array so callers can render just the first `limit`
  // cards. The marketing bouquet (hero) shows only the top of the wall, so it
  // passes a small limit and never mounts the ~80 cards below the fold; the app
  // passes no limit → the whole gallery renders. (Function components are
  // hoisted, so referencing them here before their declarations is fine.)
  // Each card carries its segment TIER (atom | component), mirroring the graph in
  // src/kit/segments.ts — so the tier-ladder front-end can split the wall into
  // the Atoms view and the Components view. Cards that map 1:1 to a recipe take that
  // recipe's tier; composed / showcase / foundation-demo cards (StatGroup, Kanban,
  // Typography, LayoutPrimitives, …) are 'component'. Order is preserved so the no-tier
  // path (the marketing bouquet, `limit`-sliced) renders exactly as before.
  const CARDS: Array<readonly [() => ReactElement, 'atom' | 'component' | 'section']> = [
    // SECTION tier — full-width page SLABS only (post the 2026-06-15 slab-vs-widget
    // re-audit): headers/region wrappers + data-table/form-panel/pricing/sidebar/
    // empty-state/file-grid + the stats band + calendar VIEWS. Widgets (date picker,
    // chart, timeline, danger-zone, auth card, stat tile…) are 'component'.
    [PageHeadCard, 'section'], [SectionCard, 'section'], [EntityCardCard, 'component'], [PresentationCardCard, 'component'], [CanvasCard, 'component'], [ScrubberCard, 'component'], [ActionPanelCard, 'component'],
    [RatingCard, 'atom'], [MusicPlayerCard, 'component'], [WeatherCard, 'component'], [CheckoutCard, 'component'], [ProductCardCard, 'component'],
    [FormCard, 'atom'], [ValidationCard, 'atom'], [StatCard, 'component'], [SwitchCard, 'atom'], [SelectionCard, 'atom'], [TableCard, 'atom'],
    [SliderCard, 'atom'], [SearchInputCard, 'atom'], [RadioCardCard, 'atom'], [ChartCard, 'component'], [DateCard, 'component'],
    [CalendarWeekCard, 'section'], [CalendarMonthCard, 'section'], [CalendarYearCard, 'section'], [CalendarRangeCard, 'component'],
    [GroupedTableCard, 'atom'], [ResponsiveTableCard, 'atom'], [CardTableCard, 'atom'], [FrozenColumnTableCard, 'atom'], [HorizontalFormCard, 'section'], [InputAddonsCard, 'atom'], [HeaderVariantsCard, 'section'], [EmptyTemplatesCard, 'section'], [TwoColumnListCard, 'atom'], [ColorPickerCard, 'atom'],
    [PasswordInputCard, 'atom'], [BannerCard, 'atom'], [PopoverCard, 'atom'], [NumberInputCard, 'atom'], [DataTableProCard, 'section'], [FormPanelCard, 'section'], [FilterBarCard, 'component'],
    [ComboboxCard, 'atom'], [DialogCard, 'component'], [KanbanCard, 'component'], [PhoneInputCard, 'atom'], [SelectCard, 'atom'], [SlotPickerCard, 'component'],
    [PricingCardCard, 'section'], [TagInputCard, 'atom'], [ChipsCard, 'atom'], [AvatarCard, 'atom'], [TabsCard, 'atom'], [DropzoneCard, 'component'], [TooltipCard, 'atom'],
    [CodeBlockCard, 'component'], [SheetCard, 'component'], [InputOtpCard, 'atom'], [DescriptionListCard, 'atom'], [HoverCardCard, 'atom'],
    [DateFieldCard, 'atom'], [ToolbarCard, 'atom'], [AlertDialogCard, 'component'], [TrendCard, 'component'],
    [CmdPaletteCard, 'component'], [DropdownMenuCard, 'atom'], [CarouselCard, 'component'], [ListCard, 'atom'], [ThreadCard, 'component'], [ProseCard, 'component'],
    [LoginCard, 'component'], [StatGroupCard, 'section'], [ContextMenuCard, 'atom'], [SignupCard, 'component'], [TimelineCard, 'component'], [NavMenuCard, 'atom'],
    [PaginationCard, 'atom'], [TreeViewCard, 'component'], [NotificationCenterCard, 'component'], [NavCard, 'section'], [AppBarCard, 'section'],
    [FileGridCard, 'section'], [AccordionCard, 'atom'], [SettingsRowCard, 'atom'], [AlertsCard, 'atom'],
    [BreadcrumbCard, 'atom'], [ProgressCard, 'atom'], [UsageMeterCard, 'component'], [InteractiveCardCard, 'atom'], [MenubarCard, 'component'], [ResizableCard, 'component'],
    [StatusPageCard, 'component'], [InboxFilterCard, 'component'], [SpinnerCard, 'atom'], [ToolbarRecipeCard, 'atom'], [SkeletonCard, 'atom'],
    [EmptyStateCard, 'section'], [InfoCardCard, 'component'], [ToastStackCard, 'component'], [LightboxCard, 'component'],
    [WizardStepperCard, 'component'], [DangerZoneCard, 'component'], [FaqCard, 'component'], [TwoColumnLayoutCard, 'component'],
    [AttachmentChipCard, 'atom'], [StepperCard, 'atom'], [ButtonGroupCard, 'atom'], [AspectRatioCard, 'atom'], [ScrollAreaCard, 'atom'],
  ]
  const filtered = tier ? CARDS.filter(([, t]) => t === tier) : CARDS
  const shown = limit ? filtered.slice(0, limit) : filtered

  // The Atoms view groups the bare atoms into bordered CATEGORY cards (like the
  // Foundations sections): the frame lives on the GROUP, so atoms get structure
  // without each looking like a standalone component. Covers all atom-tier cards.
  // Search/filter bar (C5) — only in the cockpit Atoms/Components views (tier set),
  // never in the marketing bouquet. Themed by the kit (lives in .cockpit-preview).
  // Dogfoods the kit's own .searchinput component (house-style focus halo +
  // ghost clear button); .gallery-search adds only layout (width + centring).
  const searchBar = (count: number, total: number) => (
    <div className="searchinput gallery-search" role="search">
      <Icon name="search" />
      <input
        className="searchinput__field"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${tier === 'atom' ? 'atoms' : tier === 'section' ? 'sections' : 'components'}…`}
        aria-label={`Search ${tier === 'atom' ? 'atoms' : tier === 'section' ? 'sections' : 'components'}`}
      />
      {q && (
        <button className="searchinput__clear" onClick={() => setQ('')} aria-label="Clear search">×</button>
      )}
      <span className="gallery-search__count">{query ? `${count} of ${total}` : `${total}`}</span>
    </div>
  )

  if (tier === 'page') {
    // PAGE wall — the full-bleed page templates, stacked one per row (not the
    // masonry; these are whole screens, not cards). Each renders via the proof
    // case in sections.tsx, which carries its own eyebrow label, so the wall is
    // self-documenting and needs no search bar.
    return (
      <div className="gallerywrap">
        {/* .pagestack (preview chrome) spaces via real container `gap` = the
            gallery gutter (40px), so page-block spacing matches the cards on the
            other sub-walls. NOT .l-stack here: its child-margin rule reads the
            CHILD's --l-gap, and each proof block is itself an .l-stack (0.625rem)
            — which shadowed the override. Container gap resolves on .pagestack. */}
        <div className="pagestack">
          {PAGE_ARCHETYPES.map((a, i) =>
            renderSection({ kind: 'proof', seed: { archetype: a.archetype, label: a.label } }, i),
          )}
        </div>
      </div>
    )
  }

  if (tier === 'atom') {
    // A group whose NAME matches (e.g. "navigation", "overlays") shows all its
    // atoms; otherwise filter the atoms individually.
    const groups = ATOM_GROUPS
      .map(([name, comps]) => [name, query && name.toLowerCase().includes(query) ? comps : comps.filter(matchesQ)] as const)
      .filter(([, c]) => c.length)
    const total = ATOM_GROUPS.reduce((n, [, c]) => n + c.length, 0)
    const count = groups.reduce((n, [, c]) => n + c.length, 0)
    return (
      <div className="gallerywrap">
        {searchBar(count, total)}
        {groups.length === 0 ? (
          <div className="gallery-empty">No atoms match “{q}”.</div>
        ) : (
          <div className="gallery atomgroups" ref={galleryRef}>
            {groups.map(([name, comps]) => (
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
        )}
      </div>
    )
  }

  // COMPONENTS view (tier='component') — filterable. The no-tier marketing bouquet
  // path never reaches the search wrap (it renders the bare interleaved wall below).
  if (tier === 'component' || tier === 'section') {
    const components = shown.filter(([C]) => matchesQ(C))
    return (
      <div className="gallerywrap">
        {searchBar(components.length, shown.length)}
        {components.length === 0 ? (
          <div className="gallery-empty">No components match “{q}”.</div>
        ) : (
          <div className="gallery" ref={galleryRef}>
            {components.map(([C], i) => <C key={i} />)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="gallery" ref={galleryRef}>
      {/* INTERLEAVED WALL — cards woven so a landscape (.card--wide) lands
          roughly every ~3rd slot for an even masonry rhythm (shadcn /create
          feel). No `tier` (the marketing bouquet) shows the full interleaved
          wall, `limit`-sliced — unchanged. */}
      {shown.map(([C], i) => <C key={i} />)}
    </div>
  )
}

// Atom category taxonomy — every atom-tier card bucketed into a matching group.
// Order = how the groups read top-to-bottom; the masonry packs them by height.
const ATOM_GROUPS: ReadonlyArray<readonly [string, ReadonlyArray<() => ReactElement>]> = [
  ['Text inputs', [FormCard, SearchInputCard, InputAddonsCard, PasswordInputCard, NumberInputCard, PhoneInputCard, InputOtpCard]],
  ['Pickers & selects', [DateFieldCard, ComboboxCard, SelectCard, TagInputCard]],
  ['Choice & toggles', [ChipsCard, SwitchCard, SelectionCard, RadioCardCard, ColorPickerCard, SliderCard]],
  ['Actions & menus', [ButtonsCard, ButtonGroupCard, ToolbarCard, ToolbarRecipeCard, DropdownMenuCard, ContextMenuCard]],
  ['Navigation', [TabsCard, NavMenuCard, BreadcrumbCard, PaginationCard, StepperCard]],
  ['Overlays & disclosure', [PopoverCard, TooltipCard, HoverCardCard, AccordionCard]],
  ['Feedback & status', [ValidationCard, BannerCard, AlertsCard, ProgressCard, SpinnerCard, SkeletonCard]],
  ['Data & content', [TableCard, GroupedTableCard, ResponsiveTableCard, CardTableCard, FrozenColumnTableCard, ListCard, TwoColumnListCard, DescriptionListCard, SettingsRowCard, AttachmentChipCard, InteractiveCardCard, AvatarCard]],
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
      <nav aria-label="Breadcrumb">
        <ol className="breadcrumb">
          <li><a href="#">Home</a></li>
          <li aria-hidden="true"><Icon name="chevR" /></li>
          <li><a href="#">Projects</a></li>
          <li aria-hidden="true"><Icon name="chevR" /></li>
          <li><a href="#">Northwind</a></li>
          <li aria-hidden="true"><Icon name="chevR" /></li>
          <li><span aria-current="page">Settings</span></li>
        </ol>
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
            <button className="menu__item" role="menuitem" aria-disabled="true"><Icon name="file" /> Duplicate <span className="menu__shortcut">Pro</span></button>
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
    <Card title="Last sync" desc="Hover the status — four static placements.">
      <div className="card__row" style={{ paddingTop: 20 }}>
        <span className="tt">
          <span className="tt__pop" role="tooltip" id="tt-lastsync">Saved 2 min ago</span>
          <button className="btn btn--ghost btn--sm" aria-describedby="tt-lastsync">
            <Icon name="info" /> Status
          </button>
        </span>
      </div>
      {/* Placement variants — top (default) · bottom · left · right. No JS flip;
          pick the side that clears the edge. */}
      <div className="card__row" style={{ justifyContent: 'center', gap: 'var(--k-s-16)', padding: 'var(--k-s-16) 0' }}>
        {([['', 'Top'], ['tt__pop--bottom', 'Bottom'], ['tt__pop--left', 'Left'], ['tt__pop--right', 'Right']] as const).map(([mod, lbl]) => (
          <span className="tt" key={lbl}>
            <span className={`tt__pop ${mod}`} role="tooltip">On the {lbl.toLowerCase()}</span>
            <button className="btn btn--ghost btn--sm" tabIndex={-1}>{lbl}</button>
          </span>
        ))}
      </div>
    </Card>
  )
}

/* Toggle as a "Notifications" settings scene — a labelled row + description
 * + the switch on the right, the way it actually appears in product. Reads
 * as a mini settings panel, not three loose toggles. (Mini-interface
 * recompose pattern — #200.) */
function ChipsCard() {
  const [facets, setFacets] = useState<string[]>(['Design'])
  const [tokens, setTokens] = useState(['Q3 report', 'roadmap.fig'])
  const toggleFacet = (f: string) =>
    setFacets((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))
  const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 'var(--k-gap)', alignItems: 'center' }
  const lbl: CSSProperties = { fontSize: 'var(--k-type-eyebrow)', fontWeight: 'var(--k-weight-medium)' as never, textTransform: 'uppercase', letterSpacing: 'var(--k-track-eyebrow)', color: 'var(--k-fg-muted)', width: 76, flex: 'none' }
  return (
    <Card title="Chips">
      <div style={row}>
        <span style={lbl}>Assist</span>
        <button type="button" className="chip"><Icon name="spark" size={14} />Summarize</button>
        <button type="button" className="chip"><Icon name="cal" size={14} />Add to calendar</button>
      </div>
      <div style={row}>
        <span style={lbl}>Filter</span>
        {['Design', 'Engineering', 'Marketing'].map((f) => (
          <button key={f} type="button" className={`chip ${facets.includes(f) ? 'chip--on' : ''}`} aria-pressed={facets.includes(f)} onClick={() => toggleFacet(f)}>
            {facets.includes(f) && <Icon name="check" size={13} />}
            {f}
          </button>
        ))}
      </div>
      <div style={row}>
        <span style={lbl}>Input</span>
        {tokens.map((t) => (
          <span key={t} className="chip chip--input">
            {t}
            <button type="button" className="chip__remove" aria-label={`Remove ${t}`} onClick={() => setTokens(tokens.filter((x) => x !== t))}>
              <Icon name="x" size={11} />
            </button>
          </span>
        ))}
        {tokens.length === 0 && <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-faint)' }}>All cleared</span>}
      </div>
      <div style={row}>
        <span style={lbl}>Suggestion</span>
        <button type="button" className="chip chip--suggestion">Tell me more</button>
        <button type="button" className="chip chip--suggestion">Give examples</button>
      </div>
    </Card>
  )
}

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
      {/* Wavy (H4 flourish) — value rides on --progress so the root can paint
          the remaining track; reserve it for the one hero progress moment. */}
      <div className="progress progress--wavy" role="progressbar" aria-valuenow={62} aria-valuemin={0} aria-valuemax={100} aria-label="Generating preview" style={{ '--progress': '62%', marginTop: 10 } as CSSProperties}>
        <div className="progress__fill" />
      </div>
      <span style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Generating… (wavy — the expressive hero moment)</span>
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
            <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" style={{ maxBlockSize: 188 }}>
              <h3 id="dialog-title" className="dialog__title">Delete project?</h3>
              <div className="dialog__body">
                <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: 0 }}>
                  This permanently removes:
                </p>
                <ul style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: 'var(--k-s-8) 0 0', paddingLeft: 'var(--k-s-16)', display: 'grid', gap: 'var(--k-s-6)' }}>
                  {['14 source files', '3 environments', 'all deploy history', '2 connected domains', 'the staging database', 'every API token', '8 team invitations'].map((x) => (<li key={x}>{x}</li>))}
                </ul>
              </div>
              <div className="dialog__foot">
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
  const [view, setView] = useState<'chart' | 'empty' | 'loading'>('chart')
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
      <div className="segctrl" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
        {([['line', 'Line'], ['area', 'Area'], ['bar', 'Bar'], ['stacked', 'Stacked'], ['stackedArea', 'Stacked area'], ['donut', 'Donut']] as const).map(([t, lbl]) => (
          <button key={t} className={`segctrl__btn ${view === 'chart' && type === t ? 'segctrl__btn--on' : ''}`} onClick={() => { setType(t); setView('chart') }}>
            {lbl}
          </button>
        ))}
        <button className={`segctrl__btn ${view === 'loading' ? 'segctrl__btn--on' : ''}`} onClick={() => setView('loading')}>Loading</button>
        <button className={`segctrl__btn ${view === 'empty' ? 'segctrl__btn--on' : ''}`} onClick={() => setView('empty')}>Empty</button>
      </div>
      <ChartFrame type={type} height={140} labels={type === 'donut' ? donutLabels : labels} series={series} empty={view === 'empty'} loading={view === 'loading'} />
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
        <div className="toolbar">
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
          <button className="btn btn--secondary"><Icon name="plus" /> Save view</button>
        </div>
        {chips.length > 0 && (
          <div className="filterbar__active">
            <span className="filterbar__active-label">Active</span>
            {chips.map((c) => (
              <span key={c} className="chip chip--input">{c}<button type="button" className="chip__remove" onClick={() => setChips(chips.filter((x) => x !== c))} aria-label={`Remove ${c}`}><Icon name="x" size={11} /></button></span>
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
                {/* H4 usage pass: the tag wears the recipe's accent container — no per-card hex. */}
                <span className="kanban__tag">{card.tag}</span>
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
  label, value, delta, sparkPath, positive, good = positive, accent, clickable, hero,
}: {
  label: string
  value: string
  delta: string
  sparkPath: string
  /** Hero KPI — the one focal metric on the surface: renders its value at the
   *  display tier and spans the full grid (the confident-pro bento move). */
  hero?: boolean
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
      className={'stat-tile' + (hero ? ' stat-tile--hero' : '') + (clickable ? ' stat-tile--clickable' : '')}
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
          hero
          sparkPath="M0 18 L10 16 L20 14 L30 15 L40 11 L50 9 L60 6 L70 7 L80 3"
        />
        <StatTile
          label="Active users"
          value="8,431"
          delta="4.1%"
          positive
          accent="primary"
          clickable
          sparkPath="M0 19 L10 17 L20 16 L30 13 L40 12 L50 10 L60 8 L70 6 L80 4"
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
      {/* Placement variants — .popover--top (opens above) · .popover--end (right-aligned).
          Static, with the arrow repositioned to match. No JS collision-flip. */}
      <div className="card__row" style={{ gap: 'var(--k-s-16)', paddingTop: 56, justifyContent: 'center' }}>
        <span className="popover-wrap">
          <button className="btn btn--ghost btn--sm" tabIndex={-1}>Above</button>
          <span className="popover popover--top" role="note" style={{ minWidth: 0, padding: 'var(--k-s-8) var(--k-s-12)', fontSize: 11 }}>
            <span className="popover__arrow" />Opens above
          </span>
        </span>
        <span className="popover-wrap">
          <button className="btn btn--ghost btn--sm" tabIndex={-1}>End</button>
          <span className="popover popover--end" role="note" style={{ minWidth: 0, padding: 'var(--k-s-8) var(--k-s-12)', fontSize: 11 }}>
            <span className="popover__arrow" />Right-aligned
          </span>
        </span>
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
      {/* Placement — .hover-card__pop--top (opens above) · --end (right-aligned). */}
      <div style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', marginTop: 'var(--k-s-16)' }}>
        Placement:{' '}
        <span className="hover-card">
          @liam
          <span className="hover-card__pop hover-card__pop--top" style={{ minWidth: 0, padding: 'var(--k-s-8) var(--k-s-12)' }}>
            <span style={{ fontWeight: 600, color: 'var(--k-fg)' }}>Liam Ortega</span> — opens above
          </span>
        </span>{' · '}
        <span className="hover-card">
          @noor
          <span className="hover-card__pop hover-card__pop--end" style={{ minWidth: 0, padding: 'var(--k-s-8) var(--k-s-12)' }}>
            <span style={{ fontWeight: 600, color: 'var(--k-fg)' }}>Noor Haddad</span> — right-aligned
          </span>
        </span>
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
      {/* Vertical (row) split — .resizable--vertical stacks the panes + turns the
          grip horizontal. Visual orientation; wire the row-drag like the column one. */}
      <div className="resizable resizable--vertical" style={{ height: 132, marginTop: 'var(--k-s-12)' }}>
        <div className="resizable__pane" style={{ padding: 'var(--k-s-12)', fontSize: 'var(--k-type-small)', fontWeight: 600 }}>Preview</div>
        <div className="resizable__handle" role="separator" aria-orientation="horizontal" aria-label="Resize rows" tabIndex={0} />
        <div className="resizable__pane" style={{ padding: 'var(--k-s-12)', fontSize: 11.5, fontFamily: 'var(--k-font-mono)', color: 'var(--k-fg-muted)' }}>$ build — done in 4.1s</div>
      </div>
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

// App bar — the top app-shell header recipe (.appbar): the SIBLING of the sidebar.
// A title on the lead, a flexible spacer, then a trailing cluster of REAL atoms —
// .searchinput · a .btn with a .badge--count · an .avatar that opens a real .menu.
// The live Ledger app (Showcases) dogfoods this exact recipe as its top bar.
function AppBarCard() {
  const [open, setOpen] = useState(false)
  return (
    <Card wide title="App bar" desc="The top app-shell header — a title, a flexible spacer, and a trailing cluster of real atoms (search · notifications · account menu). Pairs with the Sidebar.">
      <div className="appbar" style={{ borderRadius: 'var(--k-radius-md)', border: '1px solid var(--k-border)' }}>
        <span className="appbar__title">Ledger</span>
        <span className="appbar__spacer" />
        <div className="searchinput" role="search" style={{ maxWidth: 200 }}>
          <Icon name="search" />
          <input className="searchinput__field" type="search" placeholder="Search…" aria-label="Search" />
        </div>
        <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Notifications, 2 unread" style={{ position: 'relative' }}>
          <Icon name="bell" />
          <span className="badge badge--solid-primary badge--count" style={{ position: 'absolute', top: 0, right: 0, transform: 'translate(35%,-35%)' }}>2</span>
        </button>
        <div style={{ position: 'relative' }}>
          <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Account" onClick={() => setOpen((o) => !o)} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer' }}>
            <span className="avatar avatar--sm avatar--a3">PN</span>
          </button>
          {open && (
            <div className="menu" role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50, minWidth: 180 }}>
              <div className="menu__label">Priya Nair</div>
              <button type="button" className="menu__item" role="menuitem"><Icon name="cog" /> Settings</button>
              <div className="menu__sep" />
              <button type="button" className="menu__item" role="menuitem"><Icon name="upload" /> Sign out</button>
            </div>
          )}
        </div>
      </div>
    </Card>
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
  // Toggle button (H4) — press-and-stay; on = secondary container + the
  // round⇄square corner morph (visible on pill themes, springs via --k-spring).
  const [starred, setStarred] = useState(false)
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
        <button type="button" className="btn btn--primary btn--xs">XS</button>
        <button type="button" className="btn btn--primary btn--sm">Small</button>
        <button type="button" className="btn btn--primary">Default</button>
        <button type="button" className="btn btn--primary btn--lg">Large</button>
        <button type="button" className="btn btn--primary btn--xl">XL — hero action</button>
      </div>
      <div className="card__row" style={{ alignItems: 'center' }}>
        <button type="button" className="btn btn--outline"><Icon name="check" /> With icon</button>
        <button type="button" className="btn btn--primary btn--icon" aria-label="Search"><Icon name="search" /></button>
        {/* Anchored badge — count + dot pinned on a host control (H4) */}
        <span className="anchor">
          <button type="button" className="btn btn--outline btn--icon" aria-label="Notifications — 3 unread"><Icon name="bell" /></button>
          <span className="anchor__badge badge badge--solid-danger">3</span>
        </span>
        <span className="anchor">
          <button type="button" className="btn btn--ghost btn--icon" aria-label="Inbox — new activity"><Icon name="chat" /></button>
          <span className="anchor__badge anchor__badge--dot" aria-hidden="true" />
        </span>
        <button type="button" className="btn btn--outline btn--toggle" aria-pressed={starred} onClick={() => setStarred((s) => !s)}>
          <Icon name="spark" /> {starred ? 'Starred' : 'Star'}
        </button>
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
  // Connected group (H4) — independent toggles in the relaxed pebble group.
  const [fmt, setFmt] = useState<Set<string>>(() => new Set(['bold']))
  const flipFmt = (k: string) =>
    setFmt((s) => {
      const next = new Set(s)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  return (
    <Card title="Button group" desc="Buttons fused into one control — a view switcher, a split action and a connected toggle cluster.">
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
      <div className="btn-group btn-group--connected" role="group" aria-label="Formatting">
        {(['Bold', 'Italic', 'Underline'] as const).map((v) => {
          const k = v.toLowerCase()
          return (
            <button key={k} type="button" className="btn btn--outline btn--sm btn--toggle" aria-pressed={fmt.has(k)} onClick={() => flipFmt(k)}>{v}</button>
          )
        })}
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
  const [loading, setLoading] = useState(false)
  // Open/navigate → show the loading spinner briefly (simulating the full-size
  // image fetch a real lightbox awaits via <img> onLoad).
  const go = (i: number) => { setOpen(i); setLoading(true); window.setTimeout(() => setLoading(false), 500) }
  // Real full-screen overlay → owes the modal contract (trap/Escape/scroll-lock/
  // focus-return). Arrow-nav for prev/next is wired on the dialog below.
  const lbRef = useModal<HTMLDivElement>(open !== null, () => setOpen(null))
  return (
    <Card title="Gallery" desc="Click a thumbnail to open the lightbox.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {LB_IMAGES.map((g, i) => (
          <button key={i} onClick={() => go(i)} aria-label={`Open image ${i + 1}`} style={{ aspectRatio: '1', borderRadius: 'var(--k-radius-md)', border: 0, background: g, cursor: 'pointer' }} />
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
            if (e.key === 'ArrowLeft') { e.preventDefault(); go((open + LB_IMAGES.length - 1) % LB_IMAGES.length) }
            else if (e.key === 'ArrowRight') { e.preventDefault(); go((open + 1) % LB_IMAGES.length) }
          }}
        >
          {loading
            ? <div className="lightbox__loading" aria-label="Loading image" role="status" />
            : <div className="lightbox__stage" style={{ width: '58%', aspectRatio: '3 / 2', background: LB_IMAGES[open] }} onClick={(e) => e.stopPropagation()} />}
          <button className="lightbox__btn lightbox__btn--close" onClick={() => setOpen(null)} aria-label="Close"><Icon name="x" /></button>
          <button className="lightbox__btn lightbox__btn--prev" onClick={(e) => { e.stopPropagation(); go((open + LB_IMAGES.length - 1) % LB_IMAGES.length) }} aria-label="Previous"><Icon name="chevL" /></button>
          <button className="lightbox__btn lightbox__btn--next" onClick={(e) => { e.stopPropagation(); go((open + 1) % LB_IMAGES.length) }} aria-label="Next"><Icon name="chevR" /></button>
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
  // Below it: the time INPUT (H4) — the third arm of the date/time trichotomy
  // (docked calendar · popover picker · typed input). Two .in digit cells
  // around a colon + a meridiem segctrl; no clock-face dial.
  const [hh, setHh] = useState('09')
  const [mm, setMm] = useState('30')
  const [mer, setMer] = useState<'AM' | 'PM'>('AM')
  const clamp2 = (v: string) => v.replace(/\D/g, '').slice(0, 2)
  return (
    <Card title="Due date" desc="Single-date picker + time input — popover for the day, typed cells for the time.">
      <label className="lab">
        <span>Due date</span>
        <DatePicker defaultValue="2026-06-12" ariaLabel="Due date" />
      </label>
      <div className="lab">
        <span>Remind me at</span>
        <div className="timefield">
          <input className="in" value={hh} onChange={(e) => setHh(clamp2(e.target.value))} inputMode="numeric" maxLength={2} aria-label="Hour" />
          <span className="timefield__sep" aria-hidden="true">:</span>
          <input className="in" value={mm} onChange={(e) => setMm(clamp2(e.target.value))} inputMode="numeric" maxLength={2} aria-label="Minute" />
          <div className="segctrl" role="radiogroup" aria-label="AM or PM">
            {(['AM', 'PM'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mer === m} className={`segctrl__btn ${mer === m ? 'segctrl__btn--on' : ''}`} onClick={() => setMer(m)}>{m}</button>
            ))}
          </div>
        </div>
      </div>
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
  // Previewing = start is set, end isn't, and the user is hovering a later day →
  // the forming band wears the LOWER-emphasis --range-preview so it's clearly not
  // committed yet; the anchor stays solid. The second click swaps to --range.
  const previewing = end === null && start !== null && hover !== null && hover !== start
  const cellClass = (d: number): string => {
    const parts = ['calendar__cell']
    if (d < 1 || d > 31) parts.push('calendar__cell--out')
    else if (isBlocked(d)) parts.push('calendar__cell--disabled')
    if (d === today) parts.push('calendar__cell--today')
    if (effStart !== null && effEnd !== null && effStart !== effEnd) {
      const lo = Math.min(effStart, effEnd), hi = Math.max(effStart, effEnd)
      if (d === lo) parts.push('calendar__cell--range-start')
      else if (d === hi) parts.push(previewing ? 'calendar__cell--range-preview' : 'calendar__cell--range-end')
      else if (d > lo && d < hi) parts.push(previewing ? 'calendar__cell--range-preview' : 'calendar__cell--range')
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
      <div className="popover-wrap" ref={ref} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
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
          // Docked in-flow (not the absolute .popover) so the gallery masonry measures
          // the card's real height — an open absolute popover overflowed into the card below.
          <div className="popover" role="dialog" aria-label="Choose a date range" style={{ width: '100%', maxWidth: 300, position: 'static', marginTop: 'var(--k-s-6)' }}>
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

// === Calendar variants (Tailwind App-UI: week/day · year · range) ===

function CalendarWeekCard() {
  // Week & day scheduler on the .calendar-week time-grid. The segctrl flips the
  // --day modifier (week → single column), demonstrating both views from one
  // recipe. Events position declaratively via --from (start hour) + --span.
  const [view, setView] = useState<'week' | 'day'>('week')
  const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
  const fmtHour = (h: number) => (h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`)
  const DAYS = [
    { name: 'Mon', num: 9 }, { name: 'Tue', num: 10 }, { name: 'Wed', num: 11, today: true },
    { name: 'Thu', num: 12 }, { name: 'Fri', num: 13 }, { name: 'Sat', num: 14 }, { name: 'Sun', num: 15 },
  ]
  // events keyed by day index; from = hours after 8 AM, span = hours. lane/lanes
  // split a column when events overlap (lane = 0-based slot, lanes = how many).
  type Ev = { from: number; span: number; title: string; time: string; v?: string; lane?: number; lanes?: number }
  const EVENTS: Record<number, Array<Ev>> = {
    0: [{ from: 1, span: 1.5, title: 'Standup', time: '9:00', v: '' }],
    2: [
      { from: 0.5, span: 1.5, title: 'Design sync', time: '8:30', v: ' calendar-week__event--alt' },
      // two concurrent 1 PM meetings → side-by-side lanes
      { from: 5, span: 2, title: 'Roadmap review', time: '1:00', v: '', lane: 0, lanes: 2 },
      { from: 5, span: 1.5, title: 'Vendor call', time: '1:00', v: ' calendar-week__event--accent', lane: 1, lanes: 2 },
    ],
    3: [{ from: 2, span: 1, title: '1:1 · Priya', time: '10:00', v: ' calendar-week__event--accent' }],
    4: [{ from: 3.5, span: 2, title: 'Ship review', time: '11:30', v: '' }],
  }
  // "now" line at 10:18 AM → 2.3 hours after the 8 AM grid start, shown in today's column
  const NOW = 2.3
  const cols = view === 'day' ? [DAYS[2]!] : DAYS
  const colIndex = (i: number) => (view === 'day' ? 2 : i)
  return (
    <Card wide title="Schedule" desc="Week & day views — a time-grid with placed events.">
      <div className="segctrl" role="radiogroup" aria-label="Calendar view" style={{ alignSelf: 'flex-start', marginBottom: 'var(--k-s-10)' }}>
        {(['week', 'day'] as const).map((v) => (
          <button key={v} type="button" role="radio" aria-checked={view === v} className={`segctrl__btn ${view === v ? 'segctrl__btn--on' : ''}`} onClick={() => setView(v)} style={{ textTransform: 'capitalize' }}>{v}</button>
        ))}
      </div>
      <div className={`calendar-week ${view === 'day' ? 'calendar-week--day' : ''}`}>
        <div className="calendar-week__head">
          <div className="calendar-week__corner" />
          {cols.map((d, i) => (
            <div key={i} className={`calendar-week__col-head ${d.today ? 'calendar-week__col-head--today' : ''}`}>
              <span className="calendar-week__dayname">{d.name}</span>
              <span className="calendar-week__daynum">{d.num}</span>
            </div>
          ))}
        </div>
        <div className="calendar-week__body">
          <div className="calendar-week__rail">
            {HOURS.map((h) => (
              <div key={h} className="calendar-week__hour"><span>{fmtHour(h)}</span></div>
            ))}
          </div>
          {cols.map((d, i) => (
            <div key={i} className="calendar-week__col">
              {d.today && <div className="calendar-week__now" style={{ ['--now' as string]: NOW } as CSSProperties} />}
              {(EVENTS[colIndex(i)] ?? []).map((ev, j) => (
                <button
                  key={j}
                  type="button"
                  className={`calendar-week__event${ev.v ?? ''}`}
                  style={{ ['--from' as string]: ev.from, ['--span' as string]: ev.span, ...(ev.lanes ? { ['--lane' as string]: ev.lane, ['--lanes' as string]: ev.lanes } : {}) } as CSSProperties}
                >
                  <span className="calendar-week__event-title">{ev.title}</span>
                  <span className="calendar-week__event-time">{ev.time}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function CalendarMonthCard() {
  // Month as a SCHEDULER (.calendar--events): taller top-left cells stacking the
  // day number over event chips, an all-day bar, the colour-coded --alt/--accent
  // variants, and a "+N more" overflow. The base .calendar is a date PICKER; this
  // is the same grid carrying events (Google/Notion month view).
  const OFFSET = 3 // May 2026 starts on Thursday → 3 leading blanks (Mon-first)
  const today = 13
  type Ev = { title: string; time?: string; v?: string; allday?: boolean }
  const EVENTS: Record<number, Ev[]> = {
    11: [{ title: 'Design review', time: '10:00' }],
    13: [
      { title: 'Launch', allday: true, v: ' calendar__event--accent' },
      { title: 'Standup', time: '9:00' },
      { title: '1:1 · Priya', time: '11:00', v: ' calendar__event--alt' },
      { title: 'Roadmap', time: '14:00' },
    ],
    14: [{ title: 'Offsite', allday: true, v: ' calendar__event--alt' }],
    20: [{ title: 'Ship', time: '16:00' }],
  }
  const CAP = 3
  return (
    <Card wide title="May 2026" desc="Month scheduler — day cells carry event chips + overflow.">
      <div className="calendar calendar--events">
        {DOW.map((d, i) => (<div key={`h${i}`} className="calendar__head">{d}</div>))}
        {Array.from({ length: 35 }, (_, idx) => {
          const day = idx - OFFSET + 1
          const out = day < 1 || day > 31
          const evs = EVENTS[day] ?? []
          const shown = evs.slice(0, CAP)
          const extra = evs.length - shown.length
          return (
            <div key={idx} className={`calendar__cell ${out ? 'calendar__cell--out' : ''} ${day === today ? 'calendar__cell--today' : ''}`}>
              <span className="calendar__daynum">{out ? '' : day}</span>
              {shown.map((ev, j) => (
                <span key={j} className={`calendar__event${ev.allday ? ' calendar__event--allday' : ''}${ev.v ?? ''}`}>
                  {ev.time && <span className="calendar__event-time">{ev.time}</span>}
                  <span className="calendar__event-title">{ev.title}</span>
                </span>
              ))}
              {extra > 0 && <button type="button" className="calendar__more">+{extra} more</button>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// Days-of-month → a 35-cell grid (leading blanks via offset). Display-only cells
// for the year overview (no interaction at this zoom).
function miniMonthDays(offset: number) {
  return Array.from({ length: 35 }, (_, i) => i - offset + 1)
}
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function CalendarYearCard() {
  // Year-at-a-glance: 12 compact .calendar grids via .calendar-year. June is the
  // current month (lifted ring); today = the 15th.
  const MONTHS = [
    { n: 'Jan', dim: 31 }, { n: 'Feb', dim: 28 }, { n: 'Mar', dim: 31 }, { n: 'Apr', dim: 30 },
    { n: 'May', dim: 31 }, { n: 'Jun', dim: 30 }, { n: 'Jul', dim: 31 }, { n: 'Aug', dim: 31 },
    { n: 'Sep', dim: 30 }, { n: 'Oct', dim: 31 }, { n: 'Nov', dim: 30 }, { n: 'Dec', dim: 31 },
  ]
  return (
    <Card wide title="2026" desc="Year view — twelve months at a glance.">
      <div className="calendar-year">
        {MONTHS.map((m, mi) => {
          const now = m.n === 'Jun'
          const days = miniMonthDays((mi * 2 + 3) % 7)
          return (
            <div key={m.n} className={`calendar-year__month ${now ? 'calendar-year__month--now' : ''}`}>
              <span className="calendar-year__title">{m.n}</span>
              <div className="calendar">
                {DOW.map((d, i) => <span key={i} className="calendar__head">{d}</span>)}
                {days.map((d, i) => {
                  const out = d < 1 || d > m.dim
                  const isToday = now && d === 15
                  return (
                    <span key={i} className={`calendar__cell ${out ? 'calendar__cell--out' : ''} ${isToday ? 'calendar__cell--on' : ''}`} aria-hidden={out}>
                      {out ? '' : d}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function CalendarRangeCard() {
  // Double-month range picker on .calendar-range. A selection spans June 22 →
  // July 3; the range fill reads as one band across both grids.
  const rangeCell = (d: number, dim: number, side: 'start' | 'end', bound: number): string => {
    const parts = ['calendar__cell']
    if (d < 1 || d > dim) { parts.push('calendar__cell--out'); return parts.join(' ') }
    if (side === 'start') {
      if (d === bound) parts.push('calendar__cell--range-start')
      else if (d > bound) parts.push('calendar__cell--range')
    } else {
      if (d === bound) parts.push('calendar__cell--range-end')
      else if (d < bound) parts.push('calendar__cell--range')
    }
    return parts.join(' ')
  }
  const Month = ({ title, dim, offset, side, bound, nav }: { title: string; dim: number; offset: number; side: 'start' | 'end'; bound: number; nav: 'prev' | 'next' }) => (
    <div className="calendar-range__month">
      <div className="calendar__nav">
        {nav === 'prev'
          ? <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Previous month"><Icon name="chevL" /></button>
          : <span style={{ width: 'var(--k-btn-h-sm, 1.75rem)' }} />}
        <span className="calendar__nav-title">{title}</span>
        {nav === 'next'
          ? <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Next month"><Icon name="chevR" /></button>
          : <span style={{ width: 'var(--k-btn-h-sm, 1.75rem)' }} />}
      </div>
      <div className="calendar">
        {DOW.map((d, i) => <span key={i} className="calendar__head">{d}</span>)}
        {miniMonthDays(offset).map((d, i) => (
          <button key={i} type="button" className={rangeCell(d, dim, side, bound)} disabled={d < 1 || d > dim} aria-label={d >= 1 && d <= dim ? `${title.split(' ')[0]} ${d}` : undefined}>
            {d >= 1 && d <= dim ? d : ''}
          </button>
        ))}
      </div>
    </div>
  )
  return (
    <Card wide title="Reporting period" desc="Range picker — two months, one continuous selection.">
      <div className="calendar-range">
        <Month title="June 2026" dim={30} offset={0} side="start" bound={22} nav="prev" />
        <Month title="July 2026" dim={31} offset={2} side="end" bound={3} nav="next" />
      </div>
    </Card>
  )
}

// === Table variants (Tailwind App-UI: grouped · summary · condensed · responsive) ===

function GroupedTableCard() {
  // Grouped rows + a summary footer + condensed density — three .tbl features at
  // once. .tbl__group rows segment the body by team; <tfoot> totals the seats;
  // .tbl--condensed tightens the rhythm.
  const GROUPS = [
    { team: 'Design', rows: [['Mara Vidic', 'Lead', 3], ['Tom Healy', 'Product', 2]] },
    { team: 'Engineering', rows: [['Priya Rao', 'Staff', 5], ['Jonas Ek', 'Senior', 4], ['Lin Yu', 'Mid', 2]] },
  ]
  const total = GROUPS.flatMap((g) => g.rows).reduce((s, r) => s + (r[2] as number), 0)
  return (
    <Card title="Team roster" desc="Grouped rows, a summary total, condensed density.">
      <table className="tbl tbl--condensed">
        <thead>
          <tr><th>Member</th><th>Role</th><th className="num">Seats</th></tr>
        </thead>
        <tbody>
          {GROUPS.map((g) => (
            <Fragment key={g.team}>
              <tr className="tbl__group"><td colSpan={3}>{g.team}</td></tr>
              {g.rows.map((r) => (
                <tr key={r[0] as string}>
                  <td className="tbl__name">{r[0]}</td>
                  <td>{r[1]}</td>
                  <td className="num">{r[2]}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={2}>Total seats</td><td className="num">{total}</td></tr>
        </tfoot>
      </table>
    </Card>
  )
}

function ResponsiveTableCard() {
  // Responsive table: .tbl-responsive (a size container) + .tbl--stack. Below the
  // stack breakpoint each row reflows to a label/value card (cells read their
  // header from data-label); the "Method" column is .tbl__col--optional and drops
  // a step earlier. In the narrow gallery tile this shows the stacked form.
  const ROWS = [
    { id: 'INV-2043', amount: '$1,200.00', method: 'Card', status: 'Paid' },
    { id: 'INV-2044', amount: '$640.00', method: 'Transfer', status: 'Due' },
    { id: 'INV-2045', amount: '$2,980.00', method: 'Card', status: 'Paid' },
  ]
  return (
    <Card title="Invoices" desc="Responsive — rows reflow to label/value cards when narrow.">
      <div className="tbl-responsive">
        <table className="tbl tbl--stack">
          <thead>
            <tr>
              <th>Invoice</th>
              <th className="num">Amount</th>
              <th className="tbl__col--optional">Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.id}>
                <td data-label="Invoice" className="tbl__name">{r.id}</td>
                <td data-label="Amount" className="num">{r.amount}</td>
                <td data-label="Method" className="tbl__col--optional">{r.method}</td>
                <td data-label="Status">
                  <span className={`badge ${r.status === 'Paid' ? 'badge--success' : 'badge--warn'}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function CardTableCard() {
  // Card-framed table: .tbl--card flips the atom to separate borders with
  // inset-shadow dividers + a rounded bordered frame + a sticky opaque header,
  // so a STANDALONE table can be sticky/rounded without the borders vanishing on
  // scroll. Wrapped in a max-height scroll well to engage the sticky thead. The
  // .truncate utility (now on the atom) clamps the long "File" cell.
  const ROWS = [
    { file: 'q4-financials-final-board-review.xlsx', size: '2.4 MB', by: 'Mara' },
    { file: 'brand-guidelines-2026.pdf', size: '8.1 MB', by: 'Tom' },
    { file: 'roadmap-export.csv', size: '142 KB', by: 'Priya' },
    { file: 'customer-interviews-transcript.docx', size: '512 KB', by: 'Sven' },
    { file: 'logo-pack-svg-and-png-assets.zip', size: '19 MB', by: 'Mara' },
    { file: 'release-notes-draft.md', size: '6 KB', by: 'Tom' },
  ]
  return (
    <Card title="Files" desc="Card-framed — rounded frame, sticky header, scrolls.">
      <div style={{ maxHeight: '12rem', overflow: 'auto' }}>
        <table className="tbl tbl--card">
          <thead>
            <tr>
              <th>File</th>
              <th>Owner</th>
              <th className="num">Size</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.file}>
                <td><span className="truncate" style={{ maxWidth: '14ch' }} title={r.file}>{r.file}</span></td>
                <td style={{ color: 'var(--k-fg-muted)' }}>{r.by}</td>
                <td className="num">{r.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function FrozenColumnTableCard() {
  // Frozen first column (.tbl__col--frozen) on a spreadsheet-shaped wide table:
  // the Metric column pins while the month columns scroll horizontally, so row
  // identity never gets lost. Built on .tbl--card (separate borders) so the
  // sticky cell keeps its background + divider; the reveal shadow shows there's
  // more to the right. Interactive rows clear the I4 hit-target floor.
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
  const ROWS = [
    { metric: 'Revenue', vals: ['$42k', '$48k', '$51k', '$55k', '$53k', '$61k', '$64k', '$68k'] },
    { metric: 'New users', vals: ['1,204', '1,388', '1,510', '1,622', '1,580', '1,790', '1,844', '1,920'] },
    { metric: 'Churn', vals: ['2.1%', '1.9%', '2.4%', '2.0%', '2.2%', '1.7%', '1.8%', '1.6%'] },
    { metric: 'NPS', vals: ['41', '44', '43', '47', '46', '52', '54', '55'] },
  ]
  return (
    <Card title="Metrics" desc="Frozen first column — the Metric pins while months scroll.">
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl tbl--card" style={{ minWidth: '32rem' }}>
          <thead>
            <tr>
              <th className="tbl__col--frozen">Metric</th>
              {MONTHS.map((m) => (<th key={m} className="num">{m}</th>))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.metric}>
                <th className="tbl__col--frozen tbl__name" style={{ textAlign: 'left' }}>{r.metric}</th>
                {r.vals.map((v, i) => (<td key={i} className="num">{v}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function ColorPickerCard() {
  // Radio group rendered as colour swatches (.swatch-picker) — the Tailwind
  // "color picker" radio variant. Each swatch sets --sw; selected gets a ring.
  const COLORS = [
    { name: 'Primary', v: 'var(--k-primary)' }, { name: 'Secondary', v: 'var(--k-secondary)' },
    { name: 'Accent', v: 'var(--k-accent)' }, { name: 'Success', v: 'var(--k-success)' },
    { name: 'Warning', v: 'var(--k-warning)' }, { name: 'Danger', v: 'var(--k-danger)' },
    { name: 'Info', v: 'var(--k-info)' },
  ]
  const [pick, setPick] = useState('Primary')
  return (
    <Card title="Label colour" desc="Radio group as colour swatches.">
      <div className="swatch-picker" role="radiogroup" aria-label="Label colour">
        {COLORS.map((c) => (
          <label key={c.name} className="swatch-picker__opt" style={{ ['--sw' as string]: c.v } as CSSProperties}>
            <input type="radio" name="label-colour" checked={pick === c.name} onChange={() => setPick(c.name)} aria-label={c.name} />
          </label>
        ))}
      </div>
    </Card>
  )
}

function HorizontalFormCard() {
  // Labels-on-left form layout (.formpanel--horizontal) — each .lab row reflows to
  // [label | control] with a hairline between rows. The dense settings form.
  return (
    <Card wide title="Profile" desc="Labels-on-left form layout — the dense settings form.">
      <div className="formpanel formpanel--horizontal">
        <div className="formpanel__head">
          <div className="formpanel__title">Profile</div>
          <div className="formpanel__desc">This information is shown on your public profile.</div>
        </div>
        <div className="formpanel__body">
          <div className="formpanel__grid">
            <label className="lab"><span>Full name</span><input className="in" defaultValue="Mara Vidic" /></label>
            <label className="lab"><span>Email</span><input className="in" type="email" defaultValue="mara@acme.com" /></label>
            <label className="lab"><span>Workspace</span><input className="in" defaultValue="Acme Inc." /></label>
            <label className="lab">
              <span>Weekly digest</span>
              <Toggle defaultOn label="Weekly digest" />
            </label>
          </div>
        </div>
        <div className="formpanel__foot">
          <span className="formpanel__foot-note">Changes apply to your account only.</span>
          <button type="button" className="btn btn--ghost btn--sm">Cancel</button>
          <button type="button" className="btn btn--primary btn--sm">Save</button>
        </div>
      </div>
    </Card>
  )
}

function HeaderVariantsCard() {
  // Page-header slots: a breadcrumb above the title, a sub-nav tab row below, and
  // the --banner cover-image variant with title/actions overlapping the strip.
  return (
    <Card wide title="Page headers" desc="Breadcrumb + tabs, and the banner-image header variant.">
      <div className="l-stack" style={{ '--l-gap': 'var(--k-s-20)' } as CSSProperties}>
        <div className="page-head">
          <div className="page-head__titles">
            <nav className="breadcrumb page-head__crumb" aria-label="Breadcrumb">
              <a href="#">Projects</a><Icon name="chevR" />
              <span aria-current="page" style={{ color: 'var(--k-fg)' }}>Northwind</span>
            </nav>
            <h2 className="page-head__title">Northwind</h2>
            <p className="page-head__sub">12 members · 4 active sprints</p>
          </div>
          <div className="page-head__actions">
            <button type="button" className="btn btn--ghost btn--sm">Share</button>
            <button type="button" className="btn btn--primary btn--sm">New issue</button>
          </div>
          <div className="page-head__tabs">
            <div className="tabs" role="tablist" aria-label="Sections">
              <button type="button" className="tab tab--on" role="tab" aria-selected="true"><span>Overview</span></button>
              <button type="button" className="tab" role="tab" aria-selected="false"><span>Issues</span></button>
              <button type="button" className="tab" role="tab" aria-selected="false"><span>Board</span></button>
              <button type="button" className="tab" role="tab" aria-selected="false"><span>Settings</span></button>
            </div>
          </div>
        </div>
        <div className="page-head page-head--banner">
          <div className="page-head__banner" style={{ backgroundImage: 'linear-gradient(135deg, var(--k-primary-soft), var(--k-accent-soft))' }} />
          <div className="page-head__overlap">
            <div className="page-head__titles">
              <h2 className="page-head__title">Mara Vidic</h2>
              <p className="page-head__sub">Product designer · Amsterdam</p>
            </div>
            <div className="page-head__actions">
              <button type="button" className="btn btn--secondary btn--sm">Message</button>
              <button type="button" className="btn btn--primary btn--sm">Follow</button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyTemplatesCard() {
  // Empty state with a starting-point template grid (.empty__grid) — pick a
  // template instead of a blank canvas. Tiles are real .card--interactive.
  const TEMPLATES = [
    { icon: 'file' as const, name: 'Blank', desc: 'Start from scratch' },
    { icon: 'cal' as const, name: 'Roadmap', desc: 'Timeline + milestones' },
    { icon: 'cog' as const, name: 'Ops board', desc: 'Triage + on-call' },
  ]
  return (
    <Card title="Create a project" desc="Empty state with starting-point templates.">
      <div className="empty">
        <span className="empty__icon"><Icon name="file" /></span>
        <div className="empty__title">No projects yet</div>
        <div className="empty__sub">Start from a template, or create a blank project.</div>
        <div className="empty__grid">
          {TEMPLATES.map((t) => (
            <button key={t.name} type="button" className="card card--interactive" style={{ padding: 'var(--k-s-12)', gap: 'var(--k-s-6)', alignItems: 'flex-start' }}>
              <span className="empty__icon"><Icon name={t.icon} /></span>
              <span style={{ fontWeight: 'var(--k-weight-semibold)', fontSize: 'var(--k-type-small)' }}>{t.name}</span>
              <span style={{ fontSize: 'var(--k-type-eyebrow)', color: 'var(--k-fg-muted)' }}>{t.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}

function TwoColumnListCard() {
  // Stacked-list variants: a two-column directory (.list--cols) and sticky group
  // headings (.list--sticky) inside a scroll container.
  const MEMBERS = [
    ['Engineering', 'Priya Rao', 'Staff engineer'], ['Engineering', 'Jonas Ek', 'Senior engineer'],
    ['Design', 'Mara Vidic', 'Lead designer'], ['Design', 'Tom Healy', 'Product designer'],
  ] as const
  const DIRECTORY = [
    ['A', 'Ana Cole'], ['A', 'Aaron Diaz'], ['B', 'Bea Lund'], ['B', 'Ben Ortiz'],
    ['C', 'Cara Voss'], ['C', 'Cole Park'], ['D', 'Dana Ito'], ['D', 'Drew Han'],
  ] as const
  const initials = (n: string) => n.split(' ').map((w) => w[0]).join('')
  return (
    <Card wide title="Members" desc="Two-column directory (wide), and sticky group headings.">
      <div className="list list--cols">
        {['Engineering', 'Design'].map((team) => (
          <Fragment key={team}>
            <div className="list__section">{team}</div>
            {MEMBERS.filter((m) => m[0] === team).map((m) => (
              <button key={m[1]} type="button" className="list__item">
                <span className="list__lead list__lead--avatar">{initials(m[1])}</span>
                <div className="list__body">
                  <div className="list__title">{m[1]}</div>
                  <div className="list__sub">{m[2]}</div>
                </div>
              </button>
            ))}
          </Fragment>
        ))}
      </div>
      <div className="scroll-area" style={{ maxHeight: 160, overflow: 'auto', marginTop: 'var(--k-s-12)' }}>
        <div className="list list--sticky">
          {['A', 'B', 'C', 'D'].map((letter) => (
            <Fragment key={letter}>
              <div className="list__section">{letter}</div>
              {DIRECTORY.filter((d) => d[0] === letter).map((d) => (
                <button key={d[1]} type="button" className="list__item">
                  <span className="list__lead list__lead--avatar">{initials(d[1])}</span>
                  <div className="list__body"><div className="list__title">{d[1]}</div></div>
                </button>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </Card>
  )
}

function InputAddonsCard() {
  // Input groups: a fused add-on segment (.in-group), an inline unit (.in__affix),
  // an inset label (.in--inset), and an overlapping label (.in-field/.in__overlap).
  return (
    <Card title="Input add-ons" desc="Add-ons, inline units, and inset / overlapping labels.">
      <label className="lab">
        <span>Website</span>
        <span className="in-group">
          <span className="in-group__addon">https://</span>
          <input className="in" defaultValue="acme" aria-label="Website" />
          <span className="in-group__addon">.com</span>
        </span>
      </label>
      <label className="lab">
        <span>Price</span>
        <span className="in in--inline">
          <span className="in__affix">$</span>
          <input inputMode="decimal" defaultValue="24.00" aria-label="Price" />
          <span className="in__affix">USD</span>
        </span>
      </label>
      <label className="in in--inset">
        <span className="in__label">Quantity</span>
        <input inputMode="numeric" defaultValue="12" aria-label="Quantity" />
      </label>
      <div className="in-field" style={{ marginTop: 'var(--k-s-4)' }}>
        <span className="in__overlap">Email</span>
        <input className="in" type="email" defaultValue="mara@acme.com" aria-label="Email" />
      </div>
    </Card>
  )
}

// === Round 2: extended shadcn parity ===

function ComboboxCard() {
  const FRAMEWORKS = ['Next.js', 'Remix', 'Astro', 'SvelteKit', 'Nuxt', 'Vite', 'Solid Start']
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<string | null>('Next.js')
  const [loading, setLoading] = useState(false)
  // Custom Select dismiss — outside-click + Escape via the shared controller.
  const { open, setOpen, ref } = useDropdown()
  const matches = FRAMEWORKS.filter((f) => f.toLowerCase().includes(q.toLowerCase()))
  // Simulate a debounced async fetch so the loading row is demonstrable.
  const onQ = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value)
    setLoading(true)
    window.setTimeout(() => setLoading(false), 450)
  }
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
              <input autoFocus value={q} onChange={onQ} placeholder="Filter…" />
            </div>
            {loading ? (
              <div className="combobox__loading"><span className="spinner spinner--sm" aria-hidden="true" />Searching…</div>
            ) : matches.length === 0 ? (
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

// 'snackbar' (H4) is the fifth shape: inverse surface, no tone border, one
// text action — the M3 snackbar contract on the same .toast primitive.
type ToastTone = 'success' | 'info' | 'warn' | 'error' | 'snackbar'
interface ToastEntry { id: number; tone: ToastTone; title: string; sub: string }

const TOAST_PRESETS: Record<ToastTone, Omit<ToastEntry, 'id' | 'tone'>> = {
  success: { title: 'Saved', sub: 'Changes synced just now.' },
  info:    { title: 'New version', sub: 'v2.4.0 is available.' },
  warn:    { title: 'Heads up', sub: 'API quota at 78%.' },
  error:   { title: 'Upload failed', sub: 'Network error — please retry.' },
  snackbar: { title: 'Message archived', sub: '' },
}
const TOAST_ICON: Record<ToastTone, IconName> = { success: 'check', info: 'info', warn: 'info', error: 'x', snackbar: 'check' }

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
        <button className="btn btn--ghost btn--sm" onClick={() => fire('snackbar')}>
          <Icon name="chat" /> Snackbar
        </button>
      </div>
      <div className="toast-demo-frame">
        {toasts.length === 0 && (
          <span className="toast-demo-frame__empty">Trigger a toast above ↑</span>
        )}
        <div className="toast-stack">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast--${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
              {/* Snackbar contract: no tone icon, no sub — one line + ONE text action. */}
              {t.tone !== 'snackbar' && <Icon name={TOAST_ICON[t.tone]} />}
              <div className="toast__body">
                <div className="toast__title">{t.title}</div>
                {t.sub && <div className="toast__sub">{t.sub}</div>}
              </div>
              {t.tone === 'snackbar' && (
                <button className="toast__action" onClick={() => dismiss(t.id)}>Undo</button>
              )}
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
              <div className="dialog__foot">
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
  const [caps, setCaps] = useState(false)
  const strength = Math.min(3, Math.floor(pwd.length / 4))
  const onCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState('CapsLock'))
  return (
    <Card title="Set a password" desc="Use at least 8 characters.">
      <div className="pwinput">
        <input
          type={show ? 'text' : 'password'}
          className="pwinput__field"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          onKeyDown={onCaps}
          onKeyUp={onCaps}
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
      {caps && (
        <div className="pwinput__capslock" role="status">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 11h4v5h8v-5h4z" /><path d="M8 20h8" /></svg>
          Caps Lock is on
        </div>
      )}
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
      {/* Loading state — a spinner replaces the magnifier while results fetch. */}
      <span className="eyebrow" style={{ marginTop: 'var(--k-s-12)' }}>Loading</span>
      <div className="searchinput" aria-busy="true">
        <span className="spinner spinner--sm" aria-hidden="true" />
        <input className="searchinput__field" defaultValue="invoices" placeholder="Search…" readOnly aria-label="Search (loading)" />
      </div>
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
      <div className="card__foot card__foot--bar">
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

/* === Chat message (Fase J-8) =========================================
 * A conversation thread — incoming bubbles on the surface, the sender's
 * own (.msg--me) on the right in the brand-soft fill. Comment feeds,
 * support chats, AI assistants. */
function ThreadCard() {
  return (
    <Card title="Conversation" desc="A chat thread — incoming vs your own message.">
      <div className="thread">
        <div className="msg">
          <div className="msg__head"><span className="msg__name">Mira</span><span className="msg__time">09:24</span></div>
          <p className="msg__body">Draft contract is ready for review — can we sign off today?</p>
        </div>
        <div className="msg msg--me">
          <div className="msg__head"><span className="msg__name">You</span><span className="msg__time">09:26</span></div>
          <p className="msg__body">Looks good. Sending the redline now.</p>
        </div>
      </div>
    </Card>
  )
}

/* === Prose (Fase J-8) ================================================
 * A rich-text container — semantic headings/paragraphs/lists take the kit's
 * type, rhythm and link colour with no per-tag styling. Articles, docs,
 * marketing copy, CMS body fields. */
function ProseCard() {
  return (
    <Card title="Article" desc="A rich-text container — drop in semantic tags. The .t-display role lands the hero headline at the display tier.">
      <h2 className="t-display" style={{ marginBottom: 'var(--k-s-8)' }}>Ship with conviction.</h2>
      <article className="prose">
        <div className="prose__kicker">Changelog</div>
        <h2>What’s new in v2.4</h2>
        <p>A tighter type scale, calmer surfaces and a faster export — everything you ship now derives from one set of tokens.</p>
        <h3>Highlights</h3>
        <ul>
          <li>Block recipes for charts, kanban and timelines.</li>
          <li>One-click <a href="#changelog">contract.json</a> export.</li>
        </ul>
      </article>
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
        <li className="timeline__item timeline__item--upcoming">
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

/* === SECTION tier — page-region wrappers (KIT-COVERAGE-AUDIT) =============
 * The header/wrapper grammar you stack to lay out a screen: page-head (screen
 * header), section (titled region), entity-card (identity + key facts). These
 * retire the hand-rolled headers the showcases kept re-inventing. */
function PageHeadCard() {
  return (
    <Card wide title="Page header" desc="The screen-level header that opens a page — title, sub, actions. A section, not a card.">
      <div className="page-head page-head--bordered">
        <div className="page-head__titles">
          <span className="page-head__eyebrow">Billing</span>
          <h2 className="page-head__title">Invoices</h2>
          <span className="page-head__sub">24 invoices · 3 overdue</span>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--ghost btn--sm" type="button"><Icon name="upload" /> Export</button>
          <button className="btn btn--primary btn--sm" type="button"><Icon name="plus" /> New invoice</button>
        </div>
      </div>
    </Card>
  )
}

function SectionCard() {
  return (
    <Card wide title="Section" desc="A titled page region — header (title + actions + divider) then a body. Borderless; --fill tints the head.">
      <div className="section section--fill">
        <div className="section__head">
          <div className="section__titles"><h3 className="section__title">Recent clients</h3></div>
          <div className="section__actions"><button className="btn btn--link btn--sm" type="button">View all</button></div>
        </div>
        <div className="section__body">
          <span style={{ color: 'var(--k-fg-muted)', fontSize: 'var(--k-type-small)' }}>The region's components go here — a table, a grid of cards, a feed.</span>
        </div>
      </div>
    </Card>
  )
}

function ScrubberCard() {
  const time: CSSProperties = { fontSize: 'var(--k-type-eyebrow)', color: 'var(--k-fg-muted)' }
  return (
    <Card title="Scrubber" desc="Media transport progress with a playhead — wire the seek yourself.">
      <div className="card__row" style={{ gap: 'var(--k-s-12)', alignItems: 'center', paddingTop: 8 }}>
        <span className="num" style={time}>1:48</span>
        <div className="scrubber" style={{ flex: 1 }}>
          <div className="scrubber__fill" style={{ width: '45%' }} />
          <div className="scrubber__knob" style={{ left: '45%' }} />
        </div>
        <span className="num" style={time}>4:22</span>
      </div>
    </Card>
  )
}

function PresentationCardCard() {
  return (
    <Card title="Presentation card" desc="A card meant to be SEEN — a brand face for tickets, passes, credit cards.">
      <div className="card card--presentation" style={{ padding: 'var(--k-s-20)', minHeight: 124, justifyContent: 'space-between' }}>
        <div className="card__head">
          <div className="card__title">Season Pass</div>
          <div className="card__desc">Unlimited access · 2026</div>
        </div>
        <span className="num" style={{ fontSize: 'var(--k-type-h3)', fontWeight: 700, letterSpacing: '0.08em' }}>•••• •••• •••• 4242</span>
      </div>
    </Card>
  )
}

function CanvasCard() {
  return (
    <Card title="Canvas" desc="The brand-atmosphere background — sit a hero, landing section or app shell on var(--k-canvas).">
      <div
        className="canvas"
        style={{
          minHeight: 132,
          borderRadius: 'var(--k-radius-lg)',
          border: 'max(1px, var(--k-bw)) solid var(--k-border)',
          padding: 'var(--k-s-20)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 'var(--k-s-4)',
        }}
      >
        <span className="eyebrow">Premium</span>
        <div style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, lineHeight: 'var(--k-leading-tight)' }}>Brand atmosphere</div>
      </div>
    </Card>
  )
}

/* ── a2ui-gallery test build: domain widgets composed from the kit grammar ──
   Built as a UIcockpit *consumer* (kit classes + token-valued inline layout +
   own SVGs), to prove the grammar styles real composed UIs. Gaps logged in the
   session report. */
const Star = ({ empty }: { empty?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={empty ? 'rating__star--empty' : undefined} aria-hidden="true">
    <path d="M12 2.6l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.5l-5.6 3.2 1.4-6.3L3 9.1l6.4-.6z" />
  </svg>
)
function RatingCard() {
  return (
    <Card title="Rating" desc="A star scale for reviews / products — filled + empty stars + a count. New kit primitive.">
      <div style={{ display: 'grid', gap: 'var(--k-s-10)', paddingTop: 'var(--k-s-4)' }}>
        <span className="rating"><Star /><Star /><Star /><Star /><Star /><span className="rating__count">5.0</span></span>
        <span className="rating"><Star /><Star /><Star /><Star /><Star empty /><span className="rating__count">4.2 (128)</span></span>
        <span className="rating"><Star /><Star /><Star empty /><Star empty /><Star empty /><span className="rating__count">2.0</span></span>
      </div>
    </Card>
  )
}

function MusicPlayerCard() {
  const time: CSSProperties = { fontSize: 'var(--k-type-caption)', color: 'var(--k-fg-muted)' }
  return (
    <Card title="Music player" desc="Album art · track meta · transport + scrubber — .aspect, .scrubber, .btn--icon.">
      <div className="card" style={{ padding: 'var(--k-s-16)', display: 'grid', gap: 'var(--k-s-14)' }}>
        <div style={{ display: 'flex', gap: 'var(--k-s-12)', alignItems: 'center', minWidth: 0 }}>
          <div className="aspect aspect--1x1" style={{ width: 56, flex: 'none', borderRadius: 'var(--k-radius-md)' }}>
            <div className="aspect__fill" style={{ background: 'var(--k-canvas)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="card__title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Midnight City</div>
            <div className="card__desc">M83 — Hurry Up, We're Dreaming</div>
          </div>
        </div>
        <div className="scrubber"><div className="scrubber__fill" style={{ width: '38%' }} /><div className="scrubber__knob" style={{ left: '38%' }} /></div>
        <div className="num" style={{ display: 'flex', justifyContent: 'space-between', ...time }}><span>1:32</span><span>4:03</span></div>
        <div style={{ display: 'flex', gap: 'var(--k-s-8)', justifyContent: 'center', alignItems: 'center' }}>
          <button className="btn btn--ghost btn--icon" aria-label="Previous"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm12 0v12l-9-6z" /></svg></button>
          <button className="btn btn--primary btn--icon" aria-label="Play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></button>
          <button className="btn btn--ghost btn--icon" aria-label="Next"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 6v12l9-6z" /></svg></button>
        </div>
      </div>
    </Card>
  )
}

function WeatherCard() {
  const Sun = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ color: 'var(--k-rating)' }}>
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5" />
    </svg>
  )
  const days = [['Mon', 19], ['Tue', 21], ['Wed', 18], ['Thu', 16]]
  return (
    <Card title="Weather" desc="Hero figure · forecast row — .eyebrow, .num (display), .metric, .divider.">
      <div className="card" style={{ padding: 'var(--k-s-16)', display: 'grid', gap: 'var(--k-s-12)' }}>
        <span className="eyebrow">Amsterdam</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--k-s-12)' }}>
          <Sun size={36} />
          <span className="num" style={{ fontSize: 'var(--k-type-display)', fontWeight: 600, lineHeight: 1 }}>18°</span>
        </div>
        <div className="card__desc">Partly cloudy · feels like 16°</div>
        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {days.map(([d, t]) => (
            <div key={d as string} className="metric" style={{ alignItems: 'center', gap: 'var(--k-s-4)' }}>
              <span className="metric__label">{d}</span>
              <Sun />
              <span className="num" style={{ fontSize: 'var(--k-type-small)' }}>{t}°</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function CheckoutCard() {
  const Row = ({ name, price }: { name: string; price: string }) => (
    <div className="card__row card__row--spread">
      <span style={{ color: 'var(--k-fg-muted)', fontSize: 'var(--k-type-small)' }}>{name}</span>
      <span className="num" style={{ fontSize: 'var(--k-type-small)' }}>{price}</span>
    </div>
  )
  // Rebuilt from the card ANATOMY (.card rhythm · __head · __row--spread · divider
  // · __foot) — the structural inline layout (padding/grid/gap/justify) is gone;
  // only TYPE choices + the full-width CTA remain.
  return (
    <Card title="Checkout" desc="Built from the card ANATOMY — .card rhythm · __head · __row--spread · __foot. No inline layout.">
      <div className="card">
        <div className="card__head"><div className="card__title">Order summary</div></div>
        <div className="card__col">
          <Row name="Pro plan · annual" price="$192.00" />
          <Row name="Seats × 3" price="$108.00" />
          <Row name="Tax" price="$30.00" />
        </div>
        <div className="divider" />
        <div className="card__row card__row--spread">
          <span style={{ fontWeight: 'var(--k-weight-semibold)' } as CSSProperties}>Total</span>
          <span className="num" style={{ fontSize: 'var(--k-type-h3)', fontWeight: 700 }}>$330.00</span>
        </div>
        <div className="card__foot">
          <button className="btn btn--primary" style={{ width: '100%' }}>Pay $330.00</button>
        </div>
      </div>
    </Card>
  )
}

function ProductCardCard() {
  // Rebuilt with .card__media — the image bleeds to the card edges + clips to the
  // top radius with NO padding:0 / overflow / manual-radius guess. The card rhythm
  // spaces the body; __row--spread handles the title↔badge and price↔CTA edges.
  return (
    <Card title="Product card" desc="Built from anatomy — .card__media (image bleed + radius) · __row--spread · .rating.">
      <div className="card" style={{ maxWidth: 280 }}>
        <div className="card__media"><div className="aspect aspect--16x9"><div className="aspect__fill" style={{ background: 'var(--k-canvas)' }} /></div></div>
        <div className="card__row card__row--spread" style={{ alignItems: 'flex-start' }}>
          <div className="card__title">Aeron Chair</div>
          <span className="badge badge--success">In stock</span>
        </div>
        <span className="rating"><Star /><Star /><Star /><Star /><Star empty /><span className="rating__count">4.2</span></span>
        <div className="card__row card__row--spread">
          <span className="num" style={{ fontSize: 'var(--k-type-h3)', fontWeight: 700 }}>$1,395</span>
          <button className="btn btn--primary">Add to cart</button>
        </div>
      </div>
    </Card>
  )
}

function EntityCardCard() {
  return (
    <Card wide title="Entity card" desc="An identity + a few key facts: mark · name · kebab, full-bleed divider, meta rows. --fill tints the head. Stacks in a .bento.">
      <div className="bento">
        <div className="entity-card entity-card--fill">
          <div className="entity-card__head">
            <span className="avatar avatar--sm" aria-hidden="true">T</span>
            <span className="entity-card__name">Tuple, Inc</span>
            <MenuButton icon={<Icon name="dots" />} ariaLabel="Actions for Tuple, Inc" triggerClass="btn btn--ghost btn--icon btn--sm" wrapClass="entity-card__menu" align="right" items={[{ label: 'View', icon: <Icon name="file" /> }, { label: 'Send reminder', icon: <Icon name="bell" /> }, { label: 'Duplicate', icon: <Icon name="plus" /> }, { label: 'Delete', icon: <Icon name="trash" />, danger: true }]} />
          </div>
          <div className="entity-card__meta">
            <div className="entity-card__row"><span className="entity-card__label">Last invoice</span><span className="entity-card__value">Dec 13, 2025</span></div>
            <div className="entity-card__row"><span className="entity-card__label">Amount</span><span className="entity-card__value">$2,000.00 <span className="badge badge--danger">Overdue</span></span></div>
          </div>
        </div>
        <div className="entity-card">
          <div className="entity-card__head">
            <span className="avatar avatar--sm" aria-hidden="true">S</span>
            <span className="entity-card__name">SavvyCal</span>
            <MenuButton icon={<Icon name="dots" />} ariaLabel="Actions for SavvyCal" triggerClass="btn btn--ghost btn--icon btn--sm" wrapClass="entity-card__menu" align="right" items={[{ label: 'View', icon: <Icon name="file" /> }, { label: 'Send reminder', icon: <Icon name="bell" /> }, { label: 'Duplicate', icon: <Icon name="plus" /> }, { label: 'Delete', icon: <Icon name="trash" />, danger: true }]} />
          </div>
          <div className="entity-card__meta">
            <div className="entity-card__row"><span className="entity-card__label">Last invoice</span><span className="entity-card__value">Jan 22, 2026</span></div>
            <div className="entity-card__row"><span className="entity-card__label">Amount</span><span className="entity-card__value">$14,000.00 <span className="badge badge--success">Paid</span></span></div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* Action panel (Tailwind App-UI "Action panels") — a card stating one thing +
 * one action: a button, a toggle, or an inline input. The settings workhorse. */
function ActionPanelCard() {
  return (
    <Card wide title="Action panel" desc="A heading + description + one action — a button, a toggle, or an inline input. The settings-screen workhorse; --danger for destructive.">
      <div className="l-stack" style={{ '--l-gap': 'var(--k-s-12)' } as CSSProperties}>
        <div className="card action-panel">
          <div className="action-panel__body"><h3 className="action-panel__title">Renew subscription</h3><p className="action-panel__desc">Your plan renews Jul 1. Update payment to avoid interruption.</p></div>
          <div className="action-panel__action"><button type="button" className="btn btn--primary btn--sm">Update payment</button></div>
        </div>
        <div className="card action-panel">
          <div className="action-panel__body"><h3 className="action-panel__title">Email receipts</h3><p className="action-panel__desc">Send a receipt after every payment.</p></div>
          <div className="action-panel__action"><Toggle defaultOn label="Email receipts" /></div>
        </div>
        <div className="card action-panel">
          <div className="action-panel__body"><h3 className="action-panel__title">Custom domain</h3><p className="action-panel__desc">Point your domain at our servers.</p></div>
          <div className="action-panel__action"><div className="in in--inline" style={{ maxWidth: 180 }}><input placeholder="app.acme.com" aria-label="Domain" /></div><button type="button" className="btn btn--secondary btn--sm">Add</button></div>
        </div>
        <div className="card action-panel card--well">
          <div className="action-panel__body"><h3 className="action-panel__title">Export data</h3><p className="action-panel__desc">Download a copy of everything in your workspace. <code>--well</code>: a sunken, recessed panel.</p></div>
          <div className="action-panel__action"><button type="button" className="btn btn--secondary btn--sm">Request export</button></div>
        </div>
        <div className="card action-panel action-panel--danger">
          <div className="action-panel__body"><h3 className="action-panel__title">Delete account</h3><p className="action-panel__desc">Permanently remove your account and all data.</p></div>
          <div className="action-panel__action"><button type="button" className="btn btn--danger btn--sm">Delete</button></div>
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
      {/* --fill: the summary-band variant — cells wear the tactical --k-surface-fill
          wash (label + delta on a row, value below). The "state at a glance" strip. */}
      <div className="stat-tile-strip stat-tile-strip--fill" style={{ marginTop: 12 }}>
        <div className="stat-tile-strip__cell">
          <div className="card__row" style={{ justifyContent: 'space-between', gap: 8 }}>
            <span className="stat-tile__label">Revenue</span>
            <span className="stat-tile__delta stat-tile__delta--up">+4.8%</span>
          </div>
          <div className="stat-tile__value">$405K</div>
        </div>
        <div className="stat-tile-strip__cell">
          <div className="card__row" style={{ justifyContent: 'space-between', gap: 8 }}>
            <span className="stat-tile__label">Overdue</span>
            <span className="stat-tile__delta stat-tile__delta--down">+54%</span>
          </div>
          <div className="stat-tile__value">$12.7K</div>
        </div>
        <div className="stat-tile-strip__cell">
          <div className="card__row" style={{ justifyContent: 'space-between', gap: 8 }}>
            <span className="stat-tile__label">Paid this month</span>
            <span className="stat-tile__delta stat-tile__delta--up">+8.1%</span>
          </div>
          <div className="stat-tile__value">$148K</div>
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
