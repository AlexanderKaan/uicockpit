import type { IconName } from '../icons/concepts'
import { COMPANIES } from './fixtures'

/**
 * H3b — the MANIFEST model: a page stops being bespoke TSX and becomes DATA.
 *
 * A showcase = archetype × nav × panes-of-sections × content seeds. The whole
 * screen is this JSON-serializable object — round-trippable by design (the
 * "view manifest" disclosure in the theater proves it byte-for-byte). The
 * renderer (`sections.tsx`) maps every SectionSpec onto KIT recipes only, so a
 * manifest is also a build recipe an agent can follow against the export:
 * same classes, same composition rules, zero preview-only magic.
 *
 * Section seeds are a DISCRIMINATED UNION (not `any`): the manifest stays plain
 * JSON while TypeScript still checks every seed against its section's contract.
 */

export type ShowcaseArchetype = 'feed' | 'list-detail' | 'supporting' | 'workspace'
/** suite = the adaptive .navsuite (bar→rail→sidebar per width) · topbar = links in the app bar */
export type ShowcaseNav = 'suite' | 'topbar'

export type SectionSpec =
  | { kind: 'stats'; seed: { items: Array<{ label: string; value: string; delta?: string; up?: boolean; hero?: boolean }> } }
  | { kind: 'chart'; seed: { title: string; type: 'bar' | 'area' | 'line' | 'stacked'; labels: string[]; series: Array<{ name: string; values: number[] }> } }
  | { kind: 'list'; seed: { title?: string; items: Array<{ icon?: IconName; title: string; sub?: string; trail?: string; badge?: 'success' | 'warning' | 'danger' | 'info' }> } }
  | { kind: 'thread'; seed: { messages: Array<{ name: string; time: string; body: string; me?: boolean; avatar?: string }> } }
  | { kind: 'composer'; seed: { placeholder: string; hero?: boolean; suggestions?: string[]; greeting?: string } }
  | { kind: 'table'; seed: { title?: string; columns: string[]; rows: string[][]; numericCols?: number[]; badgeCols?: number[]; sortableCols?: number[]; badgeToneByValue?: Record<string, 'success' | 'warning' | 'danger' | 'info'>; avatarCols?: number[] } }
  | { kind: 'form'; seed: { title: string; intro?: string; fields: Array<{ label: string; value?: string; placeholder?: string }>; submit: string } }
  | { kind: 'pricing'; seed: { tiers: Array<{ name: string; price: string; period: string; feats: string[]; featured?: boolean; cta: string }> } }
  | { kind: 'prose'; seed: { title: string; kicker?: string; paragraphs: string[]; hero?: boolean; ctas?: string[] } }
  | { kind: 'dl'; seed: { title?: string; pairs: Array<[string, string]> } }
  | { kind: 'chips'; seed: { label: string; options: string[]; active: number } }
  // H3c harvest — rich patterns lifted out of SupaDash into the manifest model.
  | { kind: 'kanban'; seed: { columns: Array<{ name: string; cards: Array<{ title: string; tag?: string; key?: string; pts?: string; avatar?: string }> }> } }
  | { kind: 'tree'; seed: { label?: string; groups: Array<{ name: string; items: Array<{ title: string; on?: boolean }> }> } }
  | { kind: 'timeline'; seed: { events: Array<{ title: string; time: string; desc?: string; state?: 'done' | 'current' }> } }
  | { kind: 'settings'; seed: { title?: string; rows: Array<{ title: string; sub: string; on: boolean }> } }
  | { kind: 'wizard'; seed: { steps: string[]; active: number; title: string; sub?: string } }
  | { kind: 'dropzone'; seed: { title: string; hint: string } }
  | { kind: 'media'; seed: { title?: string; items: Array<{ name: string; kind: 'image' | 'video' | 'file'; badge?: string; tone?: 'info' | 'success' | 'warning'; hero?: boolean; img?: string; meta?: string }> } }
  | { kind: 'empty'; seed: { icon: IconName; title: string; sub: string; cta?: string } }
  // CP6 Phase 3 — the month grid as a section (wraps the kit's .calendar recipe +
  // its cell modifiers). firstDow = weekday index (0=Mon … 6=Sun) of day 1.
  | { kind: 'calendar'; seed: { title: string; firstDow: number; days: number; today?: number; selected?: number; events?: number[] } }
  // Flagship (Ledger billing) — the Invoice-detail screen as one bespoke section:
  // doc (From/To + line items + totals) + a side rail (amount · payment · activity).
  // avatar = a portrait URL (real-photo look) or a 1-letter initial fallback.
  | { kind: 'invoice'; seed: {
      number: string; status: string; client: string; clientLogo: string
      issued: string; due: string
      fromName: string; fromLines: string[]; toName: string; toLines: string[]
      items: Array<{ title: string; desc: string; hours: string; rate: string; price: string }>
      subtotal: string; tax: string; total: string; amount: string
      payer: string; payerAvatar: string; paidDate: string; method: string
      activity: Array<{ name: string; avatar: string; action: string; time: string; comment?: string; me?: boolean }>
      meAvatar: string
    } }
  // Flagship (Ledger billing) — the Cashflow / Home screen: a KPI strip, a grouped
  // transaction feed, and recent-client cards. Shares the fixtures cast.
  | { kind: 'cashflow'; seed: {
      kpis: Array<{ label: string; value: string; delta: string; up?: boolean }>
      groups: Array<{ when: string; rows: Array<{ dir: 'in' | 'out' | 'over'; amount: string; tax: string; status: string; tone: 'success' | 'danger' | 'info'; party: string; partyLogo?: string; desc: string; invoice: string }> }>
      clients: Array<{ name: string; logo: string; lastInvoice: string; amount: string; status: string; tone: 'success' | 'danger' }>
    } }
  // Flagship (Ledger billing) — the Invoices LIST screen: the third of "3 perfect
  // examples". A header + the one Fill summary band + a .datatable list (client
  // logo · amount · status · due) with a filter bar and pagination foot.
  | { kind: 'invoices'; seed: {
      subtitle: string
      summary: Array<{ label: string; value: string; delta?: string; up?: boolean }>
      filters: string[]; activeFilter: number
      rows: Array<{ number: string; client: string; clientLogo: string; project: string; issued: string; due: string; amount: string; status: string; tone: 'success' | 'warning' | 'danger' | 'info' }>
      footInfo: string
    } }
  // Flagship (Ledger billing) — the Clients directory (rebuilt from the CRM
  // archetype into the one Ledger app): the Fill summary band + a .datatable of
  // accounts (logo · contact photo · billed · outstanding · status).
  | { kind: 'clients'; seed: {
      subtitle: string
      summary: Array<{ label: string; value: string; delta?: string; up?: boolean }>
      filters: string[]; activeFilter: number
      rows: Array<{ company: string; logo: string; contact: string; contactAvatar: string; billed: string; outstanding: string; status: string; tone: 'success' | 'warning' | 'danger' | 'info' }>
      footInfo: string
    } }
  // Flagship (Ledger billing) — the Expenses ledger: the Fill summary band + a
  // .datatable of spend (vendor mark · category badge · date · amount · status).
  | { kind: 'expenses'; seed: {
      subtitle: string
      summary: Array<{ label: string; value: string; delta?: string; up?: boolean }>
      filters: string[]; activeFilter: number
      rows: Array<{ vendor: string; logo: string; category: string; date: string; amount: string; status: string; tone: 'success' | 'warning' | 'danger' | 'info' }>
      footInfo: string
    } }
  // KIT-COVERAGE-AUDIT — the page-assembly PROOF: each archetype is built purely
  // by STACKING section recipes (page-head/section/entity-card) + component fillers
  // (data-table/stat-strip/form/timeline/empty). Proves "you can build almost any
  // page from the kit"; whatever can't assemble cleanly is the next section to add.
  | { kind: 'proof'; seed: { archetype: 'list' | 'detail' | 'dashboard' | 'settings' | 'feed' | 'empty'; label: string } }

export interface PaneSpec {
  role: 'flex' | 'fixed' | 'detail' | 'supporting'
  sections: SectionSpec[]
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

/** The ONE Ledger sidebar — the single source of truth for the app's nav
 *  (Catalyst-style: one side menu, many screens). Each entry maps a nav item to a
 *  screen manifest by `id`; the app frame (PagesView → LedgerApp) renders this as a
 *  persistent sidebar and swaps the body to the matching manifest on click. Add a
 *  screen → add a row here; never re-declare nav per manifest. Order = sidebar order. */
export interface LedgerScreen { id: string; icon: IconName; label: string }
export const LEDGER_SCREENS: LedgerScreen[] = [
  { id: 'ledger-home', icon: 'home', label: 'Home' },
  { id: 'ledger-invoices', icon: 'file', label: 'Invoices' },
  { id: 'ledger-clients', icon: 'store', label: 'Clients' },
  { id: 'ledger-expenses', icon: 'card', label: 'Expenses' },
  { id: 'ledger-reports', icon: 'chart', label: 'Reports' },
  { id: 'ledger-documents', icon: 'grid', label: 'Documents' },
  { id: 'ledger-assistant', icon: 'spark', label: 'Assistant' },
  { id: 'ledger-plans', icon: 'cog', label: 'Plans & billing' },
]
/** Detail screens that aren't sidebar peers — they're reached FROM a list screen
 *  (e.g. click an invoice row) and highlight their parent's nav item. */
export const LEDGER_DETAIL_PARENT: Record<string, string> = {
  ledger: 'ledger-invoices', // the invoice-detail screen lives under Invoices
}
/** The nav items as the manifests carry them (icon+label) — keeps each manifest's
 *  JSON honest about the real menu without duplicating the id wiring. */
const LEDGER_NAV: Array<{ icon: IconName; label: string }> = LEDGER_SCREENS.map(({ icon, label }) => ({ icon, label }))

export const SHOWCASES: ShowcaseManifest[] = [
  // ── FLAGSHIP: Ledger (billing) — the Invoice-detail screen, built to the bar.
  //    One coherent product · a recurring cast w/ real portraits + designed logos ·
  //    restraint (white, hairlines, one accent, tabular money). See
  //    flagship-billing-pilot memory. Replaces the "9 mediocre archetypes" model.
  {
    id: 'ledger-home',
    title: 'Ledger · Home',
    blurb: 'Billing flagship — the cashflow home: a KPI strip, a grouped transaction feed, and recent clients. Same app, same cast as the invoice screen.',
    width: 1200,
    archetype: 'feed',
    nav: 'suite',
    navItems: LEDGER_NAV,
    barTitle: 'Ledger',
    panes: [
      {
        role: 'flex',
        sections: [
          { kind: 'cashflow', seed: {
            kpis: [
              { label: 'Revenue', value: '$405,091.00', delta: '+4.75%', up: true },
              { label: 'Overdue invoices', value: '$12,787.00', delta: '+54.02%', up: false },
              { label: 'Outstanding invoices', value: '$245,988.00', delta: '−1.39%', up: false },
              { label: 'Expenses', value: '$30,156.00', delta: '+10.18%', up: false },
            ],
            groups: [
              { when: 'Today', rows: [
                { dir: 'in', amount: '$7,600.00', tax: '$500.00', status: 'Paid', tone: 'success', party: COMPANIES.reform.name, partyLogo: COMPANIES.reform.logo, desc: 'Website redesign', invoice: '#00012' },
                { dir: 'out', amount: '$10,000.00', tax: '$0.00', status: 'Withdraw', tone: 'info', party: 'Salary', desc: 'Tom Cook', invoice: '#00011' },
                { dir: 'over', amount: '$2,000.00', tax: '$130.00', status: 'Overdue', tone: 'danger', party: COMPANIES.tuple.name, partyLogo: COMPANIES.tuple.logo, desc: 'Logo design', invoice: '#00009' },
              ] },
              { when: 'Yesterday', rows: [
                { dir: 'in', amount: '$14,000.00', tax: '$900.00', status: 'Paid', tone: 'success', party: COMPANIES.savvy.name, partyLogo: COMPANIES.savvy.logo, desc: 'Website redesign', invoice: '#00010' },
              ] },
            ],
            clients: [
              { name: COMPANIES.tuple.name, logo: COMPANIES.tuple.logo, lastInvoice: 'December 13, 2025', amount: '$2,000.00', status: 'Overdue', tone: 'danger' },
              { name: COMPANIES.savvy.name, logo: COMPANIES.savvy.logo, lastInvoice: 'January 22, 2026', amount: '$14,000.00', status: 'Paid', tone: 'success' },
              { name: COMPANIES.reform.name, logo: COMPANIES.reform.logo, lastInvoice: 'January 23, 2026', amount: '$7,600.00', status: 'Paid', tone: 'success' },
            ],
          } },
        ],
      },
    ],
  },
  {
    id: 'ledger',
    title: 'Ledger · Invoice',
    blurb: 'Billing flagship — an invoice detail: the document, the amount, and the live activity, in one restrained two-column screen.',
    width: 1200,
    archetype: 'feed',
    nav: 'suite',
    navItems: LEDGER_NAV,
    barTitle: 'Ledger',
    panes: [
      {
        role: 'flex',
        sections: [
          { kind: 'invoice', seed: {
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
    id: 'ledger-invoices',
    title: 'Ledger · Invoices',
    blurb: 'Billing flagship — the invoices list: a Fill summary band over a filterable .datatable of invoices (client logo · amount · status · due). The third of three perfect screens.',
    width: 1200,
    archetype: 'feed',
    nav: 'suite',
    navItems: LEDGER_NAV,
    barTitle: 'Ledger',
    panes: [
      {
        role: 'flex',
        sections: [
          { kind: 'invoices', seed: {
            subtitle: '24 invoices · 3 overdue',
            summary: [
              { label: 'Outstanding', value: '$245,988.00', delta: '18 open', up: true },
              { label: 'Overdue', value: '$12,787.00', delta: '+54.02%', up: false },
              { label: 'Paid this month', value: '$148,316.00', delta: '+8.10%', up: true },
            ],
            filters: ['All', 'Outstanding', 'Overdue', 'Paid'],
            activeFilter: 0,
            rows: [
              { number: '00012', client: COMPANIES.reform.name, clientLogo: COMPANIES.reform.logo, project: 'Website redesign', issued: 'Jan 23, 2026', due: 'Feb 6, 2026', amount: '$7,600.00', status: 'Paid', tone: 'success' },
              { number: '00011', client: COMPANIES.tuple.name, clientLogo: COMPANIES.tuple.logo, project: 'Brand & web package', issued: 'Jan 23, 2026', due: 'Jan 31, 2026', amount: '$10,560.00', status: 'Paid', tone: 'success' },
              { number: '00010', client: COMPANIES.savvy.name, clientLogo: COMPANIES.savvy.logo, project: 'Website redesign', issued: 'Jan 22, 2026', due: 'Feb 5, 2026', amount: '$14,000.00', status: 'Paid', tone: 'success' },
              { number: '00009', client: COMPANIES.tuple.name, clientLogo: COMPANIES.tuple.logo, project: 'Logo design', issued: 'Dec 13, 2025', due: 'Dec 27, 2025', amount: '$2,000.00', status: 'Overdue', tone: 'danger' },
              { number: '00008', client: COMPANIES.vantage.name, clientLogo: COMPANIES.vantage.logo, project: 'Retail dashboard', issued: 'Dec 9, 2025', due: 'Dec 23, 2025', amount: '$21,400.00', status: 'Overdue', tone: 'danger' },
              { number: '00007', client: COMPANIES.cedar.name, clientLogo: COMPANIES.cedar.logo, project: 'Care-app sprint', issued: 'Dec 2, 2025', due: 'Dec 16, 2025', amount: '$8,250.00', status: 'Due soon', tone: 'warning' },
              { number: '00006', client: COMPANIES.loomis.name, clientLogo: COMPANIES.loomis.logo, project: 'Photography set', issued: 'Nov 28, 2025', due: 'Dec 12, 2025', amount: '$3,900.00', status: 'Draft', tone: 'info' },
              { number: '00005', client: COMPANIES.savvy.name, clientLogo: COMPANIES.savvy.logo, project: 'Calendar widgets', issued: 'Nov 20, 2025', due: 'Dec 4, 2025', amount: '$5,200.00', status: 'Paid', tone: 'success' },
            ],
            footInfo: 'Showing 1–8 of 24 invoices',
          } },
        ],
      },
    ],
  },
  {
    id: 'ledger-clients',
    title: 'Ledger · Clients',
    blurb: 'Billing flagship — the clients directory (the CRM archetype, rebuilt into the one Ledger app): a Fill summary band over a filterable .datatable of accounts with contact photos.',
    width: 1200,
    archetype: 'feed',
    nav: 'suite',
    navItems: LEDGER_NAV,
    barTitle: 'Ledger',
    panes: [
      {
        role: 'flex',
        sections: [
          { kind: 'clients', seed: {
            subtitle: '18 active · 3 overdue',
            summary: [
              { label: 'Active clients', value: '18', delta: '+3 this qtr', up: true },
              { label: 'Billed (YTD)', value: '$1,240,500.00', delta: '+12.4%', up: true },
              { label: 'Outstanding', value: '$245,988.00', delta: '−1.39%', up: false },
            ],
            filters: ['All', 'Active', 'Overdue', 'Archived'],
            activeFilter: 0,
            rows: [
              { company: COMPANIES.tuple.name, logo: COMPANIES.tuple.logo, contact: 'Alex Curren', contactAvatar: P('men', 32), billed: '$312,000.00', outstanding: '$2,000.00', status: 'Overdue', tone: 'danger' },
              { company: COMPANIES.savvy.name, logo: COMPANIES.savvy.logo, contact: 'Chelsea Hagon', contactAvatar: P('women', 44), billed: '$268,400.00', outstanding: '$0.00', status: 'Active', tone: 'success' },
              { company: COMPANIES.reform.name, logo: COMPANIES.reform.logo, contact: 'Michael Foster', contactAvatar: P('men', 41), billed: '$184,200.00', outstanding: '$7,600.00', status: 'Active', tone: 'success' },
              { company: COMPANIES.vantage.name, logo: COMPANIES.vantage.logo, contact: 'Tom Cook', contactAvatar: P('men', 75), billed: '$156,900.00', outstanding: '$21,400.00', status: 'Overdue', tone: 'danger' },
              { company: COMPANIES.loomis.name, logo: COMPANIES.loomis.logo, contact: 'Priya Nair', contactAvatar: P('women', 68), billed: '$94,750.00', outstanding: '$3,900.00', status: 'Due soon', tone: 'warning' },
              { company: COMPANIES.cedar.name, logo: COMPANIES.cedar.logo, contact: 'Dana Reuel', contactAvatar: P('women', 65), billed: '$73,250.00', outstanding: '$8,250.00', status: 'Active', tone: 'success' },
            ],
            footInfo: 'Showing 1–6 of 18 clients',
          } },
        ],
      },
    ],
  },
  {
    id: 'ledger-expenses',
    title: 'Ledger · Expenses',
    blurb: 'Billing flagship — the expenses ledger: a Fill summary band over a filterable .datatable of spend (vendor mark · category · amount · status). Completes the Ledger menu.',
    width: 1200,
    archetype: 'feed',
    nav: 'suite',
    navItems: LEDGER_NAV,
    barTitle: 'Ledger',
    panes: [
      {
        role: 'flex',
        sections: [
          { kind: 'expenses', seed: {
            subtitle: 'March 2026 · 14 expenses',
            summary: [
              { label: 'Spent this month', value: '$30,156.00', delta: '+10.18%', up: false },
              { label: 'vs budget', value: '$34,000.00', delta: '88% used', up: true },
              { label: 'Pending approval', value: '$4,820.00', delta: '3 items', up: false },
            ],
            filters: ['All', 'Pending', 'Approved', 'Reimbursed'],
            activeFilter: 0,
            rows: [
              { vendor: 'Northwind Cloud', logo: 'cloudhost', category: 'Infrastructure', date: 'Mar 28, 2026', amount: '$8,240.00', status: 'Approved', tone: 'success' },
              { vendor: 'Loomis Studio', logo: 'loomis', category: 'Contractors', date: 'Mar 24, 2026', amount: '$3,900.00', status: 'Pending', tone: 'warning' },
              { vendor: 'Prism Design', logo: 'designtool', category: 'Software', date: 'Mar 22, 2026', amount: '$540.00', status: 'Approved', tone: 'success' },
              { vendor: 'Halcyon Works', logo: 'workspace', category: 'Office', date: 'Mar 18, 2026', amount: '$6,500.00', status: 'Approved', tone: 'success' },
              { vendor: 'Meridian Payroll', logo: 'payroll', category: 'Payroll', date: 'Mar 15, 2026', amount: '$9,800.00', status: 'Reimbursed', tone: 'info' },
              { vendor: 'Prism Design', logo: 'designtool', category: 'Software', date: 'Mar 11, 2026', amount: '$280.00', status: 'Pending', tone: 'warning' },
            ],
            footInfo: 'Showing 1–6 of 14 expenses',
          } },
        ],
      },
    ],
  },
  // ── Reports — folds the old Dashboard surface into the one Ledger app.
  {
    id: 'ledger-reports',
    title: 'Ledger · Reports',
    blurb: 'Billing flagship — Reports: a KPI strip, the invoiced-vs-collected revenue chart, and a live activity feed. Same cast, same restraint.',
    width: 1200,
    archetype: 'feed',
    nav: 'suite',
    navItems: LEDGER_NAV,
    barTitle: 'Ledger',
    panes: [
      {
        role: 'flex',
        sections: [
          { kind: 'stats', seed: { items: [
            { label: 'Net revenue', value: '$405,091.00', delta: '+4.75%', up: true, hero: true },
            { label: 'Collected (Mar)', value: '$148,316.00', delta: '+8.10%', up: true },
            { label: 'Avg. days to pay', value: '19 days', delta: '−2 days', up: true },
            { label: 'Active clients', value: '18', delta: '+3 qtr', up: true },
          ] } },
          { kind: 'chart', seed: { title: 'Invoiced vs collected — last 6 months', type: 'area', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], series: [
            { name: 'Invoiced', values: [186, 204, 198, 241, 273, 312] },
            { name: 'Collected', values: [142, 188, 176, 214, 248, 286] },
          ] } },
          { kind: 'list', seed: { title: 'Recent activity', items: [
            { icon: 'check', title: 'Payment received — SavvyCal', sub: 'Invoice #00010 · $14,000.00', trail: '2m', badge: 'success' },
            { icon: 'bell', title: 'Reminder sent — Tuple, Inc', sub: 'Invoice #00009 · 14 days overdue', trail: '1h', badge: 'warning' },
            { icon: 'plus', title: 'New invoice drafted — Reform', sub: 'Website redesign · $7,600.00', trail: '3h' },
            { icon: 'upload', title: 'March statement ready', sub: 'march-2026.pdf · 2.1 MB', trail: '5h' },
          ] } },
        ],
      },
    ],
  },
  // ── Documents — folds the old Studio surface into the one Ledger app.
  {
    id: 'ledger-documents',
    title: 'Ledger · Documents',
    blurb: 'Billing flagship — Documents: the receipts & contracts vault as a media grid with an upload dropzone. Folds the old Studio surface into the one app.',
    width: 1200,
    archetype: 'feed',
    nav: 'suite',
    navItems: LEDGER_NAV,
    barTitle: 'Ledger',
    panes: [
      {
        role: 'flex',
        sections: [
          { kind: 'media', seed: { title: 'Receipts & contracts · 6 files', items: [
            { name: 'Master services agreement — Tuple', kind: 'file', hero: true, badge: 'Signed', tone: 'success', meta: 'MSA-tuple-2026.pdf · 480 KB · added by Chelsea' },
            { name: 'Receipt — Northwind Cloud', kind: 'image', badge: '$8,240', tone: 'info' },
            { name: 'invoice-00011.pdf', kind: 'file' },
            { name: 'Receipt — Prism Design', kind: 'image' },
            { name: 'W-9 — Loomis Studio', kind: 'file', badge: 'On file', tone: 'warning' },
            { name: 'statement-mar-2026.pdf', kind: 'file' },
          ] } },
          { kind: 'dropzone', seed: { title: 'Drop receipts or click to browse', hint: 'PDF, PNG, JPG — up to 25 MB per file' } },
        ],
      },
    ],
  },
  // ── Assistant — folds the old AI-assistant surface into the one Ledger app.
  {
    id: 'ledger-assistant',
    title: 'Ledger · Assistant',
    blurb: 'Billing flagship — the finance copilot: ask about overdue invoices, draft reminders, forecast cashflow. Folds the AI-assistant surface into the one app.',
    width: 1200,
    archetype: 'feed',
    nav: 'suite',
    navItems: LEDGER_NAV,
    barTitle: 'Ledger',
    panes: [
      {
        role: 'flex',
        sections: [
          { kind: 'thread', seed: { messages: [
            { name: 'You', time: '09:14', avatar: 'AK', body: 'Which invoices are overdue, and how much is outstanding?', me: true },
            { name: 'Ledger AI', time: '09:14', avatar: 'L', body: 'Two invoices are overdue: #00009 (Tuple, Inc — $2,000.00, 14 days) and #00008 (Vantage Retail — $21,400.00, 8 days). Total outstanding across all open invoices is $245,988.00. Want me to draft reminders for the two overdue ones?' },
            { name: 'You', time: '09:15', avatar: 'AK', body: 'Yes — draft a friendly reminder for Tuple.', me: true },
          ] } },
          { kind: 'composer', seed: { greeting: 'Good morning, Alex', placeholder: 'Ask Ledger AI — ⏎ to send, ⇧⏎ for a new line', hero: true, suggestions: ['Draft a payment reminder', 'Which invoices are overdue?', 'Forecast next month', 'Summarize March expenses'] } },
        ],
      },
    ],
  },
  // ── Plans & billing — folds the old Portal + Site pricing into the one Ledger app.
  {
    id: 'ledger-plans',
    title: 'Ledger · Plans & billing',
    blurb: 'Billing flagship — Plans & billing: the org details, the current plan + upgrade, and notification preferences. Folds the Portal + Site pricing surfaces into the one app.',
    width: 1200,
    archetype: 'feed',
    nav: 'suite',
    navItems: LEDGER_NAV,
    barTitle: 'Ledger',
    panes: [
      {
        role: 'flex',
        sections: [
          { kind: 'stats', seed: { items: [
            { label: 'Current plan', value: 'Scale · annual', hero: true },
            { label: 'Seats', value: '4 of 5 used' },
            { label: 'Renews', value: 'Jul 1, 2026' },
          ] } },
          { kind: 'form', seed: { title: 'Billing details', intro: 'These appear on every invoice you send.', fields: [
            { label: 'Legal name', value: 'Acme, Inc.' },
            { label: 'VAT number', placeholder: 'EU123456789' },
            { label: 'Billing email', value: 'finance@acme.inc' },
          ], submit: 'Save changes' } },
          { kind: 'pricing', seed: { tiers: [
            { name: 'Scale', price: '$96', period: '/mo', feats: ['Unlimited invoices', 'Audit log & SSO', 'Dedicated CSM'], featured: true, cta: 'Current plan' },
          ] } },
          { kind: 'settings', seed: { title: 'Notifications', rows: [
            { title: 'Payment received', sub: 'Email me when a client pays an invoice.', on: true },
            { title: 'Overdue reminders', sub: 'Auto-remind clients 3 days after the due date.', on: true },
            { title: 'Weekly summary', sub: 'A Monday digest of cashflow and outstanding.', on: false },
          ] } },
        ],
      },
    ],
  },
]
