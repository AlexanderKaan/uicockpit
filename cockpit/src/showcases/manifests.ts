import type { IconName } from '../icons/concepts'

/**
 * H3b — the MANIFEST model: a page stops being bespoke TSX and becomes DATA.
 *
 * A showcase = archetype × nav × panes-of-blocks × content seeds. The whole
 * screen is this JSON-serializable object — round-trippable by design (the
 * "view manifest" disclosure in the theater proves it byte-for-byte). The
 * renderer (`blocks.tsx`) maps every BlockSpec onto KIT recipes only, so a
 * manifest is also a build recipe an agent can follow against the export:
 * same classes, same composition rules, zero preview-only magic.
 *
 * Block seeds are a DISCRIMINATED UNION (not `any`): the manifest stays plain
 * JSON while TypeScript still checks every seed against its block's contract.
 */

export type ShowcaseArchetype = 'feed' | 'list-detail' | 'supporting' | 'workspace'
/** suite = the adaptive .navsuite (bar→rail→sidebar per width) · topbar = links in the app bar */
export type ShowcaseNav = 'suite' | 'topbar'

export type BlockSpec =
  | { block: 'stats'; seed: { items: Array<{ label: string; value: string; delta?: string; up?: boolean; hero?: boolean }> } }
  | { block: 'chart'; seed: { title: string; type: 'bar' | 'area' | 'line' | 'stacked'; labels: string[]; series: Array<{ name: string; values: number[] }> } }
  | { block: 'list'; seed: { title?: string; items: Array<{ icon?: IconName; title: string; sub?: string; trail?: string; badge?: 'success' | 'warning' | 'danger' | 'info' }> } }
  | { block: 'thread'; seed: { messages: Array<{ name: string; time: string; body: string; me?: boolean; avatar?: string }> } }
  | { block: 'composer'; seed: { placeholder: string; hero?: boolean; suggestions?: string[]; greeting?: string } }
  | { block: 'table'; seed: { title?: string; columns: string[]; rows: string[][]; numericCols?: number[]; badgeCols?: number[]; sortableCols?: number[]; badgeToneByValue?: Record<string, 'success' | 'warning' | 'danger' | 'info'>; avatarCols?: number[] } }
  | { block: 'form'; seed: { title: string; intro?: string; fields: Array<{ label: string; value?: string; placeholder?: string }>; submit: string } }
  | { block: 'pricing'; seed: { tiers: Array<{ name: string; price: string; period: string; feats: string[]; featured?: boolean; cta: string }> } }
  | { block: 'prose'; seed: { title: string; kicker?: string; paragraphs: string[]; hero?: boolean; ctas?: string[] } }
  | { block: 'dl'; seed: { title?: string; pairs: Array<[string, string]> } }
  | { block: 'chips'; seed: { label: string; options: string[]; active: number } }
  // H3c harvest — rich patterns lifted out of SupaDash into the manifest model.
  | { block: 'kanban'; seed: { columns: Array<{ name: string; cards: Array<{ title: string; tag?: string; key?: string; pts?: string; avatar?: string }> }> } }
  | { block: 'tree'; seed: { label?: string; groups: Array<{ name: string; items: Array<{ title: string; on?: boolean }> }> } }
  | { block: 'timeline'; seed: { events: Array<{ title: string; time: string; desc?: string; state?: 'done' | 'current' }> } }
  | { block: 'settings'; seed: { title?: string; rows: Array<{ title: string; sub: string; on: boolean }> } }
  | { block: 'wizard'; seed: { steps: string[]; active: number; title: string; sub?: string } }
  | { block: 'dropzone'; seed: { title: string; hint: string } }
  | { block: 'media'; seed: { title?: string; items: Array<{ name: string; kind: 'image' | 'video' | 'file'; badge?: string; tone?: 'info' | 'success' | 'warning'; hero?: boolean; img?: string; meta?: string }> } }
  | { block: 'empty'; seed: { icon: IconName; title: string; sub: string; cta?: string } }
  // CP6 Phase 3 — the month grid as a block (wraps the kit's .calendar recipe +
  // its cell modifiers). firstDow = weekday index (0=Mon … 6=Sun) of day 1.
  | { block: 'calendar'; seed: { title: string; firstDow: number; days: number; today?: number; selected?: number; events?: number[] } }
  // Flagship (Ledger billing) — the Invoice-detail screen as one bespoke block:
  // doc (From/To + line items + totals) + a side rail (amount · payment · activity).
  // avatar = a portrait URL (real-photo look) or a 1-letter initial fallback.
  | { block: 'invoice'; seed: {
      number: string; status: string; client: string; clientLogo: string
      issued: string; due: string
      fromName: string; fromLines: string[]; toName: string; toLines: string[]
      items: Array<{ title: string; desc: string; hours: string; rate: string; price: string }>
      subtotal: string; tax: string; total: string; amount: string
      payer: string; payerAvatar: string; paidDate: string; method: string
      activity: Array<{ name: string; avatar: string; action: string; time: string; comment?: string; me?: boolean }>
      meAvatar: string
    } }

export interface PaneSpec {
  role: 'flex' | 'fixed' | 'detail' | 'supporting'
  blocks: BlockSpec[]
}

export interface ShowcaseManifest {
  id: string
  title: string
  blurb: string
  /** The default theater width — mobiel opens at 390, site at 1280, etc. */
  width: number
  archetype: ShowcaseArchetype
  nav: ShowcaseNav
  navItems: Array<{ icon: IconName; label: string }>
  barTitle: string
  panes: PaneSpec[]
}

const P = (g: 'men' | 'women', n: number) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`

export const SHOWCASES: ShowcaseManifest[] = [
  // ── FLAGSHIP: Ledger (billing) — the Invoice-detail screen, built to the bar.
  //    One coherent product · a recurring cast w/ real portraits + designed logos ·
  //    restraint (white, hairlines, one accent, tabular money). See
  //    flagship-billing-pilot memory. Replaces the "9 mediocre archetypes" model.
  {
    id: 'ledger',
    title: 'Ledger · Invoice',
    blurb: 'Billing flagship — an invoice detail: the document, the amount, and the live activity, in one restrained two-column screen.',
    width: 1200,
    archetype: 'feed',
    nav: 'topbar',
    navItems: [
      { icon: 'home', label: 'Home' },
      { icon: 'file', label: 'Invoices' },
      { icon: 'store', label: 'Clients' },
      { icon: 'card', label: 'Expenses' },
    ],
    barTitle: 'Ledger',
    panes: [
      {
        role: 'flex',
        blocks: [
          { block: 'invoice', seed: {
            number: '00011', status: 'Paid', client: 'Tuple, Inc', clientLogo: 'tuple',
            issued: 'January 23, 2026', due: 'January 31, 2026',
            fromName: 'Acme, Inc.', fromLines: ['7363 Cynthia Pass', 'Toronto, ON N3Y 4H8'],
            toName: 'Tuple, Inc', toLines: ['886 Walter Street', 'New York, NY 12345'],
            items: [
              { title: 'Logo redesign', desc: 'New logo and digital asset playbook.', hours: '20.0', rate: '$100.00', price: '$2,000.00' },
              { title: 'Website redesign', desc: 'Design and program the new company website.', hours: '52.0', rate: '$100.00', price: '$5,200.00' },
              { title: 'Business cards', desc: 'Design and production of 3.5" × 2.0" cards.', hours: '12.0', rate: '$100.00', price: '$1,200.00' },
              { title: 'T-shirt design', desc: 'Three t-shirt design concepts.', hours: '4.0', rate: '$100.00', price: '$400.00' },
            ],
            subtotal: '$8,800.00', tax: '$1,760.00', total: '$10,560.00', amount: '$10,560.00',
            payer: 'Alex Curren', payerAvatar: P('men', 32), paidDate: 'January 31, 2026', method: 'Paid with MasterCard',
            activity: [
              { name: 'Chelsea Hagon', avatar: P('women', 44), action: 'created the invoice.', time: '7d ago' },
              { name: 'Chelsea Hagon', avatar: P('women', 44), action: 'sent the invoice.', time: '6d ago' },
              { name: 'Chelsea Hagon', avatar: P('women', 44), action: 'commented', time: '3d ago', comment: 'Called the client — they reassured me the invoice would be paid by the 25th.' },
              { name: 'Alex Curren', avatar: P('men', 32), action: 'viewed the invoice.', time: '2d ago' },
              { name: 'Alex Curren', avatar: P('men', 32), action: 'paid the invoice.', time: '1d ago', me: true },
            ],
            meAvatar: P('women', 68),
          } },
        ],
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    blurb: 'Feed archetype × nav rail — KPI strip, a revenue chart and an activity feed in one flexible pane.',
    width: 1100,
    archetype: 'feed',
    nav: 'suite',
    navItems: [
      { icon: 'home', label: 'Overview' },
      { icon: 'chart', label: 'Reports' },
      { icon: 'bell', label: 'Alerts' },
      { icon: 'cog', label: 'Settings' },
    ],
    barTitle: 'Meridian',
    panes: [
      {
        role: 'flex',
        blocks: [
          { block: 'stats', seed: { items: [
            { label: 'Net revenue', value: '$312,480', delta: '+9.2%', up: true, hero: true },
            { label: 'Active accounts', value: '1,284', delta: '+3.4%', up: true },
            { label: 'Runway', value: '18 mo', delta: '+2 mo', up: true },
          ] } },
          { block: 'chart', seed: { title: 'Net revenue — last 6 months', type: 'area', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], series: [
            { name: 'Subscriptions', values: [186, 204, 198, 241, 273, 312] },
            { name: 'Services', values: [42, 38, 51, 47, 58, 64] },
          ] } },
          { block: 'list', seed: { title: 'Recent activity', items: [
            { icon: 'check', title: 'Payout to Loomis Studio', sub: 'ACH · $4,200', trail: '2m', badge: 'success' },
            { icon: 'bell', title: 'Card spend at 81%', sub: 'September limit — $40k', trail: '1h', badge: 'warning' },
            { icon: 'plus', title: 'New treasury account', sub: 'Opened by Priya N. · USD', trail: '3h' },
            { icon: 'upload', title: 'Statement ready', sub: 'august-2026.pdf · 2.1 MB', trail: '5h' },
          ] } },
        ],
      },
    ],
  },
  {
    id: 'ai-assist',
    title: 'AI-assistent',
    blurb: 'List-detail archetype × nav rail — thread list beside the conversation + composer. Below 840px the list owns the width (selection navigates).',
    width: 1200,
    archetype: 'list-detail',
    nav: 'suite',
    navItems: [
      { icon: 'chat', label: 'Chats' },
      { icon: 'spark', label: 'Agents' },
      { icon: 'file', label: 'Files' },
      { icon: 'cog', label: 'Settings' },
    ],
    barTitle: 'Aria',
    panes: [
      {
        role: 'fixed',
        blocks: [
          { block: 'list', seed: { items: [
            { icon: 'spark', title: 'Q3 launch plan', sub: 'Draft the rollout timeline…', trail: 'now' },
            { icon: 'chat', title: 'SQL query help', sub: 'Window functions for cohort…', trail: '2h' },
            { icon: 'chat', title: 'Press release tone', sub: 'Make it warmer, less corporate', trail: '1d' },
            { icon: 'chat', title: 'Bug triage notes', sub: 'Summarize the flaky-test thread', trail: '3d' },
          ] } },
        ],
      },
      {
        role: 'detail',
        blocks: [
          { block: 'thread', seed: { messages: [
            { name: 'You', time: '14:02', avatar: 'AK', body: 'Draft a rollout timeline for the Q3 launch — beta in July, GA in September.', me: true },
            { name: 'Aria', time: '14:02', avatar: 'A', body: 'Here is a three-phase timeline: July 7 closed beta (50 design partners), August 11 open beta with pricing page live, September 9 GA with the launch post and lifecycle emails. Want me to expand any phase into tasks?' },
            { name: 'You', time: '14:05', avatar: 'AK', body: 'Expand the closed beta phase into a checklist.', me: true },
          ] } },
          { block: 'composer', seed: { greeting: 'Good afternoon, Alex', placeholder: 'Ask Aria anything — ⏎ to send, ⇧⏎ for a new line', hero: true, suggestions: ['Summarize a PR', 'Explain this error', 'Draft a SQL query', 'Write a test'] } },
        ],
      },
    ],
  },
  {
    id: 'crm',
    title: 'CRM / Data',
    blurb: 'List-detail archetype × expanded rail — saved views beside a data table with pipeline stats.',
    width: 1300,
    archetype: 'list-detail',
    nav: 'suite',
    navItems: [
      { icon: 'grid', label: 'Accounts' },
      { icon: 'chart', label: 'Forecast' },
      { icon: 'cal', label: 'Tasks' },
      { icon: 'cog', label: 'Settings' },
    ],
    barTitle: 'PipelineHQ',
    panes: [
      {
        role: 'fixed',
        blocks: [
          { block: 'list', seed: { title: 'Saved views', items: [
            { icon: 'grid', title: 'All accounts', trail: '248' },
            { icon: 'spark', title: 'Hot — closing this month', trail: '12' },
            { icon: 'bell', title: 'At risk', trail: '7' },
            { icon: 'check', title: 'Closed won · Q2', trail: '31' },
          ] } },
        ],
      },
      {
        role: 'detail',
        blocks: [
          { block: 'stats', seed: { items: [
            { label: 'Pipeline', value: '$1.24M', delta: '+8%', up: true, hero: true },
            { label: 'Won (Q2)', value: '$310k', delta: '+22%', up: true },
            { label: 'Avg. cycle', value: '34d', delta: '+3d', up: false },
          ] } },
          { block: 'table', seed: { title: 'Hot accounts', numericCols: [3], badgeCols: [2], avatarCols: [1], sortableCols: [0, 3], badgeToneByValue: { Discovery: 'info', Proposal: 'warning', Negotiation: 'success' }, columns: ['Account', 'Owner', 'Stage', 'Value', 'Next step'], rows: [
            ['Brightwave', 'Lena', 'Negotiation', '$120k', 'Contract review · Fri'],
            ['Cedar Health', 'Sam', 'Proposal', '$86k', 'Demo follow-up · Tue'],
            ['Halcyon Labs', 'Ravi', 'Discovery', '$54k', 'Stakeholder call · Mon'],
            ['Vantage Retail', 'Mia', 'Negotiation', '$210k', 'Security review · Thu'],
          ] } },
          // CP6 — the CRM signal a deal-board can't give: where the quarter lands.
          // Committed vs best-case forecast (Attio/Salesforce's focal chart).
          { block: 'chart', seed: { title: 'Forecast — next 4 quarters', type: 'area', labels: ['Q1', 'Q2', 'Q3', 'Q4'], series: [
            { name: 'Committed', values: [310, 420, 480, 560] },
            { name: 'Best case', values: [380, 520, 610, 720] },
          ] } },
        ],
      },
    ],
  },
  {
    id: 'portal',
    title: 'Portal',
    blurb: 'Supporting-pane archetype × topbar — a settings form and plan picker with help content alongside. Below 840px the supporting pane folds into the flow.',
    width: 1100,
    archetype: 'supporting',
    nav: 'topbar',
    navItems: [
      { icon: 'home', label: 'Home' },
      { icon: 'card', label: 'Billing' },
      { icon: 'cog', label: 'Account' },
    ],
    barTitle: 'Customer portal',
    panes: [
      {
        role: 'flex',
        blocks: [
          // CP6 — a customer portal opens on the number that matters: amount due.
          // The hero stat deploys the display tier; one focused upgrade card, not a
          // 3-tier marketing wall (you're already a customer).
          { block: 'stats', seed: { items: [
            { label: 'Amount due', value: '€288.00', hero: true },
            { label: 'Due date', value: 'Jul 1' },
            { label: 'Current plan', value: 'Pro · annual' },
          ] } },
          { block: 'form', seed: { title: 'Organization', intro: 'These details appear on your invoices.', fields: [
            { label: 'Company name', value: 'Lumen Studio' },
            { label: 'VAT number', placeholder: 'EU123456789' },
            { label: 'Billing email', value: 'finance@lumenstudio.io' },
          ], submit: 'Save changes' } },
          { block: 'pricing', seed: { tiers: [
            { name: 'Scale', price: '€96', period: '/mo', feats: ['Audit log & SSO', 'SLA 99.9%', 'Dedicated CSM'], featured: true, cta: 'Upgrade plan' },
          ] } },
          // H3c: Settings' toggle rows, harvested into Portal (account preferences).
          { block: 'settings', seed: { title: 'Notifications', rows: [
            { title: 'Product updates', sub: 'New features and changelog highlights.', on: true },
            { title: 'Billing receipts', sub: 'Email a receipt after every payment.', on: true },
            { title: 'Usage alerts', sub: 'Warn me before I hit a plan limit.', on: false },
          ] } },
        ],
      },
      {
        role: 'supporting',
        blocks: [
          { block: 'dl', seed: { title: 'Your plan', pairs: [
            ['Plan', 'Pro · annual'],
            ['Seats', '4 of 5 used'],
            ['Renewal', 'July 1, 2026'],
            ['Invoices', '12 paid'],
          ] } },
          // H3c: Docs' tree-nav, harvested into Portal (knowledge & account).
          { block: 'tree', seed: { label: 'Help center', groups: [
            { name: 'Getting started', items: [
              { title: 'Set up your workspace' },
              { title: 'Invite your team', on: true },
            ] },
            { name: 'Billing', items: [
              { title: 'VAT & receipts' },
              { title: 'Change your plan' },
            ] },
          ] } },
          // H3c: Settings' activity timeline, harvested into Portal.
          { block: 'timeline', seed: { events: [
            { title: 'Plan upgraded to Pro', time: 'Jun 1', desc: 'by finance@lumenstudio.io', state: 'done' },
            { title: 'Seat added — ravi@lumenstudio.io', time: 'Jun 6', state: 'done' },
            { title: 'Renewal upcoming', time: 'Jul 1', desc: '€24/mo · auto-renew', state: 'current' },
          ] } },
        ],
      },
    ],
  },
  {
    id: 'consumer',
    title: 'Consumer',
    blurb: 'Expressive consumer app at compact width — a music/events feed that leans into the kit’s harmony + signature shape. The non-SaaS surface; the nav suite docks as a bottom bar below 600px.',
    width: 390,
    archetype: 'feed',
    nav: 'suite',
    navItems: [
      { icon: 'home', label: 'For you' },
      { icon: 'search', label: 'Discover' },
      { icon: 'spark', label: 'Live' },
      { icon: 'home', label: 'Profile' },
    ],
    barTitle: 'Tonight',
    panes: [
      {
        role: 'flex',
        blocks: [
          { block: 'chips', seed: { label: 'Browse', options: ['For you', 'Nearby', 'This week', 'Free'], active: 0 } },
          { block: 'media', seed: { title: 'Featured tonight', items: [
            { name: 'Serafina — live set', kind: 'image', hero: true, badge: 'LIVE 9:30', tone: 'info', meta: 'Paradiso, Amsterdam · doors 21:00 · 312 going' },
            { name: 'Echo Bridge rooftop', kind: 'image', badge: 'Going', tone: 'success' },
            { name: 'Vinyl night · De School', kind: 'image', badge: '€8', tone: 'warning' },
            { name: 'Sunrise set · NDSM', kind: 'image' },
          ] } },
          { block: 'list', seed: { title: 'Your week', items: [
            { icon: 'spark', title: 'Serafina', sub: 'Paradiso · doors 21:00', trail: 'Fri', badge: 'info' },
            { icon: 'home', title: 'Echo Bridge', sub: 'Hosted by Odette · 78 going', trail: 'Sat' },
            { icon: 'chat', title: 'Group chat', sub: 'Mia: making a shared album…', trail: '2m' },
          ] } },
          { block: 'empty', seed: { icon: 'search', title: 'That’s everything near you tonight', sub: 'Try Nearby to catch shows in Rotterdam & Utrecht.', cta: 'Widen search' } },
        ],
      },
    ],
  },
  {
    id: 'site',
    title: 'Site',
    blurb: 'Prose/feed archetype × topbar — an article column and a pricing band; content-site composition from the same kit.',
    width: 1280,
    archetype: 'feed',
    nav: 'topbar',
    navItems: [
      { icon: 'home', label: 'Product' },
      { icon: 'card', label: 'Pricing' },
      { icon: 'file', label: 'Docs' },
      { icon: 'chat', label: 'Blog' },
    ],
    barTitle: 'Fieldnotes',
    panes: [
      {
        role: 'flex',
        blocks: [
          { block: 'prose', seed: {
            hero: true,
            kicker: 'The design-system configurator',
            title: 'Ship a design system with conviction.',
            paragraphs: [
              'Compose a coherent, opinionated kit in minutes — brand, type, shape, motion — then export framework-neutral tokens and a machine-readable contract your agent actually follows. No lock-in, no component zoo, no accounts.',
            ],
            ctas: ['Start free', 'Read the docs'],
          } },
          { block: 'prose', seed: {
            kicker: 'Changelog · June 2026',
            title: 'Design tokens, now with a contract',
            paragraphs: [
              'Your design system is only as real as the things that enforce it. This release ships the contract artefact alongside the tokens: the tiers, the uses-graph and the composition rules as machine-readable data.',
              'Point your agent at the contract and it stops inventing one-off components — every surface it builds maps onto a recipe the kit already exports, in your brand, at your scale.',
            ],
          } },
          { block: 'pricing', seed: { tiers: [
            { name: 'Hobby', price: '$0', period: 'forever', feats: ['1 kit', 'CDN link'], cta: 'Start free' },
            { name: 'Team', price: '$12', period: '/mo', feats: ['Unlimited kits', 'Versioned lanes', 'Checks in CI'], featured: true, cta: 'Start trial' },
          ] } },
        ],
      },
    ],
  },
  {
    id: 'studio',
    title: 'Studio',
    blurb: 'Content / DAM archetype × list-detail — a folder tree beside a media grid with an upload dropzone and a publish wizard. The non-SaaS, content-product surface.',
    width: 1280,
    archetype: 'list-detail',
    nav: 'suite',
    navItems: [
      { icon: 'grid', label: 'Library' },
      { icon: 'upload', label: 'Uploads' },
      { icon: 'spark', label: 'Collections' },
      { icon: 'cog', label: 'Settings' },
    ],
    barTitle: 'Studio',
    panes: [
      {
        role: 'fixed',
        blocks: [
          { block: 'tree', seed: { label: 'Folders', groups: [
            { name: 'Campaigns', items: [
              { title: 'Spring launch', on: true },
              { title: 'Brand refresh' },
            ] },
            { name: 'Stock', items: [
              { title: 'Photography' },
              { title: 'Illustration' },
            ] },
          ] } },
        ],
      },
      {
        role: 'detail',
        blocks: [
          // CP6 — the asset IS the UI: a hero cover leads, the contact sheet
          // follows, metadata sits beside it. Dropzone + publish wizard are the
          // working chrome below the focal asset.
          { block: 'media', seed: { title: 'Spring launch · 6 assets', items: [
            { name: 'Spring launch — hero', kind: 'image', hero: true, badge: 'New', tone: 'success', meta: 'hero-wide.jpg · 4000×2250 · 3.4 MB · added by Noa' },
            { name: 'teaser.mp4', kind: 'video', badge: '0:28', tone: 'info' },
            { name: 'lookbook.pdf', kind: 'file' },
            { name: 'badge-set.png', kind: 'image' },
            { name: 'palette.png', kind: 'image' },
            { name: 'brief.pdf', kind: 'file', badge: 'Final', tone: 'warning' },
          ] } },
          { block: 'dl', seed: { title: 'Asset details', pairs: [
            ['Dimensions', '4000 × 2250'],
            ['Format', 'JPEG · sRGB'],
            ['Uploaded', 'Jun 11 · by Noa'],
            ['Collection', 'Spring launch'],
          ] } },
          { block: 'dropzone', seed: { title: 'Drop files or click to browse', hint: 'Images, PDFs, video — up to 100 MB per file' } },
          { block: 'wizard', seed: { steps: ['Select', 'Crop', 'Caption', 'Publish'], active: 2, title: 'Caption', sub: 'Add alt text and a caption before publishing.' } },
        ],
      },
    ],
  },
  {
    id: 'workspace',
    title: 'Workspace',
    blurb: 'The 3-pane workspace archetype — spaces, a live thread and an agenda/files rail, all visible at once on wide screens. Below 1200 the rail drops out; below 840 the spaces list yields and the thread owns the width. One markup, three breakpoints — the densest composition the shell tier holds.',
    width: 1440,
    archetype: 'workspace',
    nav: 'suite',
    navItems: [
      { icon: 'chat', label: 'Chat' },
      { icon: 'bell', label: 'Activity' },
      { icon: 'cal', label: 'Meet' },
      { icon: 'grid', label: 'Spaces' },
    ],
    barTitle: 'Teamspace',
    panes: [
      {
        role: 'fixed',
        blocks: [
          { block: 'list', seed: { title: 'Spaces', items: [
            { icon: 'chat', title: 'Adoption volunteering', sub: '22 members', trail: '3', badge: 'info' },
            { icon: 'grid', title: 'Museum field trip', sub: 'Casey, +6' },
            { icon: 'spark', title: 'Annual spring hike', sub: 'Planning' },
            { icon: 'home', title: 'Lunch break', sub: 'Renée, +4' },
            { icon: 'file', title: 'Project Sunrise', sub: 'Files & tasks' },
          ] } },
        ],
      },
      {
        role: 'detail',
        blocks: [
          { block: 'thread', seed: { messages: [
            { name: 'Elle Petersen', time: '14:02', avatar: 'EP', body: 'The shelter on Maple needs dog-walkers Sat AM — want to sign up together?' },
            { name: 'Dagmar Bachmann', time: '14:05', avatar: 'DB', body: 'I’m adopting the scruffy one — his name is Otto 🐶' },
            { name: 'Priya Nadar', time: '14:05', avatar: 'PN', body: 'I can drive — fits 4 + crates.' },
            { name: 'You', time: '14:06', body: 'Amazing. I’ll book the 9:00 slot for six of us.', me: true },
            { name: 'Marco Bauer', time: '14:11', avatar: 'MB', body: 'Bringing leashes + treats.' },
          ] } },
          { block: 'composer', seed: { placeholder: 'Message the space — ⇧⏎ for a new line' } },
        ],
      },
      {
        role: 'supporting',
        blocks: [
          { block: 'timeline', seed: { events: [
            { title: 'Teaching workshop', time: '9:00', desc: '9:00 – 12:00', state: 'done' },
            { title: 'Lunch', time: '13:00', desc: '13:00 – 14:00', state: 'current' },
            { title: 'Curriculum review', time: '16:00', desc: '16:00 – 17:00' },
          ] } },
          { block: 'list', seed: { title: 'Files', items: [
            { icon: 'file', title: 'Adoption application', sub: 'PDF · 240 KB' },
            { icon: 'grid', title: 'Shelter map', sub: 'PNG · 1.2 MB' },
          ] } },
        ],
      },
    ],
  },
  {
    id: 'calendar',
    title: 'Calendar',
    blurb: 'Workspace archetype × nav rail — calendars beside the month grid + the day’s agenda, with an event inspector rail. Time-as-canvas (Cron/Fantastical): the grid is the hero, one aimed accent marks the day. Below 1200 the rail drops; below 840 the calendars list yields.',
    width: 1280,
    archetype: 'workspace',
    nav: 'suite',
    navItems: [
      { icon: 'cal', label: 'Calendar' },
      { icon: 'chat', label: 'Inbox' },
      { icon: 'check', label: 'Tasks' },
      { icon: 'cog', label: 'Settings' },
    ],
    barTitle: 'Horizon',
    panes: [
      {
        role: 'fixed',
        blocks: [
          { block: 'list', seed: { title: 'Calendars', items: [
            { icon: 'check', title: 'Personal', sub: '3 events', badge: 'info' },
            { icon: 'grid', title: 'Work', sub: '8 events' },
            { icon: 'spark', title: 'Team', sub: 'Standups & 1:1s' },
            { icon: 'cal', title: 'Holidays', sub: 'NL' },
          ] } },
        ],
      },
      {
        role: 'detail',
        blocks: [
          // The grid is the hero. today = the 14th (ring), selected = the 18th
          // (filled accent — the day being viewed), event-dotted days alongside.
          { block: 'calendar', seed: { title: 'June 2026', firstDow: 0, days: 30, today: 14, selected: 18, events: [3, 5, 9, 12, 22, 24, 26] } },
          { block: 'list', seed: { title: 'Thursday, June 18', items: [
            { icon: 'spark', title: 'Design review', sub: '10:00 – 11:00 · Studio', trail: 'now', badge: 'info' },
            { icon: 'chat', title: '1:1 with Priya', sub: '13:30 – 14:00 · Zoom', trail: '1:30' },
            { icon: 'check', title: 'Ship CP6', sub: 'All day', trail: '' },
          ] } },
        ],
      },
      {
        role: 'supporting',
        blocks: [
          { block: 'dl', seed: { title: 'Design review', pairs: [
            ['When', 'Thu 10:00 – 11:00'],
            ['Where', 'Studio · Floor 3'],
            ['With', 'Noa, Priya, +3'],
            ['Calendar', 'Work'],
          ] } },
          { block: 'list', seed: { title: 'Up next', items: [
            { icon: 'cal', title: 'Sprint planning', sub: 'Mon, Jun 22 · 09:30', trail: 'Mon' },
            { icon: 'spark', title: 'Team offsite', sub: 'Wed, Jun 24 · all day', trail: 'Wed' },
          ] } },
        ],
      },
    ],
  },
]
