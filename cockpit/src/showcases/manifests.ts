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

export type ShowcaseArchetype = 'feed' | 'list-detail' | 'supporting'
/** suite = the adaptive .navsuite (bar→rail→sidebar per width) · topbar = links in the app bar */
export type ShowcaseNav = 'suite' | 'topbar'

export type BlockSpec =
  | { block: 'stats'; seed: { items: Array<{ label: string; value: string; delta?: string; up?: boolean }> } }
  | { block: 'chart'; seed: { title: string; type: 'bar' | 'area' | 'line' | 'stacked'; labels: string[]; series: Array<{ name: string; values: number[] }> } }
  | { block: 'list'; seed: { title?: string; items: Array<{ icon?: IconName; title: string; sub?: string; trail?: string; badge?: 'success' | 'warning' | 'danger' | 'info' }> } }
  | { block: 'thread'; seed: { messages: Array<{ name: string; time: string; body: string; me?: boolean }> } }
  | { block: 'composer'; seed: { placeholder: string } }
  | { block: 'table'; seed: { title?: string; columns: string[]; rows: string[][] } }
  | { block: 'form'; seed: { title: string; intro?: string; fields: Array<{ label: string; value?: string; placeholder?: string }>; submit: string } }
  | { block: 'pricing'; seed: { tiers: Array<{ name: string; price: string; period: string; feats: string[]; featured?: boolean; cta: string }> } }
  | { block: 'prose'; seed: { title: string; kicker?: string; paragraphs: string[] } }
  | { block: 'dl'; seed: { title?: string; pairs: Array<[string, string]> } }
  | { block: 'chips'; seed: { label: string; options: string[]; active: number } }

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

export const SHOWCASES: ShowcaseManifest[] = [
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
    barTitle: 'Acme Analytics',
    panes: [
      {
        role: 'flex',
        blocks: [
          { block: 'stats', seed: { items: [
            { label: 'MRR', value: '$48.2k', delta: '+12%', up: true },
            { label: 'Active users', value: '8,431', delta: '+4.1%', up: true },
            { label: 'Churn', value: '1.9%', delta: '-0.3%', up: true },
            { label: 'NPS', value: '62', delta: '-2', up: false },
          ] } },
          { block: 'chart', seed: { title: 'Revenue — last 6 months', type: 'area', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], series: [
            { name: 'Subscriptions', values: [28, 31, 30, 36, 41, 48] },
            { name: 'Services', values: [9, 8, 11, 10, 12, 13] },
          ] } },
          { block: 'list', seed: { title: 'Recent activity', items: [
            { icon: 'check', title: 'Invoice #1208 paid', sub: 'Acme GmbH · $1,400', trail: '2m', badge: 'success' },
            { icon: 'bell', title: 'Quota at 81%', sub: 'API requests — Pro plan', trail: '1h', badge: 'warning' },
            { icon: 'plus', title: 'New workspace member', sub: 'lena@acme.io joined Design', trail: '3h' },
            { icon: 'upload', title: 'Export completed', sub: 'transactions-may.csv · 2.1 MB', trail: '5h' },
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
    barTitle: 'Copilot',
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
            { name: 'You', time: '14:02', body: 'Draft a rollout timeline for the Q3 launch — beta in July, GA in September.', me: true },
            { name: 'Copilot', time: '14:02', body: 'Here is a three-phase timeline: July 7 closed beta (50 design partners), August 11 open beta with pricing page live, September 9 GA with the launch post and lifecycle emails. Want me to expand any phase into tasks?' },
            { name: 'You', time: '14:05', body: 'Expand the closed beta phase into a checklist.', me: true },
          ] } },
          { block: 'composer', seed: { placeholder: 'Message Copilot — ⇧⏎ for a new line' } },
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
            { label: 'Pipeline', value: '$1.24M', delta: '+8%', up: true },
            { label: 'Won (Q2)', value: '$310k', delta: '+22%', up: true },
            { label: 'Avg. cycle', value: '34d', delta: '+3d', up: false },
          ] } },
          { block: 'table', seed: { title: 'Hot accounts', columns: ['Account', 'Owner', 'Stage', 'Value', 'Next step'], rows: [
            ['Northwind Traders', 'Lena', 'Negotiation', '$120k', 'Contract review · Fri'],
            ['Globex', 'Sam', 'Proposal', '$86k', 'Demo follow-up · Tue'],
            ['Initech', 'Ravi', 'Discovery', '$54k', 'Stakeholder call · Mon'],
            ['Umbrella Co', 'Mia', 'Negotiation', '$210k', 'Security review · Thu'],
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
          { block: 'form', seed: { title: 'Organization', intro: 'These details appear on your invoices.', fields: [
            { label: 'Company name', value: 'Acme GmbH' },
            { label: 'VAT number', placeholder: 'EU123456789' },
            { label: 'Billing email', value: 'finance@acme.io' },
          ], submit: 'Save changes' } },
          { block: 'pricing', seed: { tiers: [
            { name: 'Starter', price: '$0', period: '/mo', feats: ['3 projects', 'Community support'], cta: 'Current plan' },
            { name: 'Pro', price: '$24', period: '/mo', feats: ['Unlimited projects', 'Priority support', 'SSO'], featured: true, cta: 'Upgrade' },
            { name: 'Scale', price: '$96', period: '/mo', feats: ['Audit log', 'SLA 99.9%', 'Dedicated CSM'], cta: 'Talk to sales' },
          ] } },
        ],
      },
      {
        role: 'supporting',
        blocks: [
          { block: 'dl', seed: { title: 'Your plan', pairs: [
            ['Plan', 'Starter — free'],
            ['Seats', '4 of 5 used'],
            ['Renewal', 'July 1, 2026'],
            ['Invoices', '12 paid'],
          ] } },
          { block: 'list', seed: { title: 'Help', items: [
            { icon: 'file', title: 'Billing FAQ', sub: 'VAT, receipts, proration' },
            { icon: 'chat', title: 'Contact support', sub: 'Replies within a day' },
          ] } },
        ],
      },
    ],
  },
  {
    id: 'mobiel',
    title: 'Mobiel',
    blurb: 'Feed archetype at compact width — the SAME markup as every other showcase; the nav suite docks as a bottom bar below 600px.',
    width: 390,
    archetype: 'feed',
    nav: 'suite',
    navItems: [
      { icon: 'home', label: 'Today' },
      { icon: 'search', label: 'Search' },
      { icon: 'bell', label: 'Activity' },
      { icon: 'cog', label: 'Profile' },
    ],
    barTitle: 'Daily',
    panes: [
      {
        role: 'flex',
        blocks: [
          { block: 'chips', seed: { label: 'Filter feed', options: ['All', 'Mentions', 'Teams', 'Saved'], active: 0 } },
          { block: 'list', seed: { items: [
            { icon: 'chat', title: 'Mia mentioned you', sub: '"@you can you review the spec?"', trail: '5m' },
            { icon: 'check', title: 'Deploy succeeded', sub: 'web · production · 41s', trail: '22m', badge: 'success' },
            { icon: 'bell', title: 'Standup in 10 minutes', sub: 'Design weekly · Zoom', trail: '1h' },
            { icon: 'file', title: 'Spec updated', sub: 'Checkout flow v3 — 14 comments', trail: '2h' },
            { icon: 'plus', title: 'New teammate', sub: 'Ravi joined Platform', trail: '1d' },
          ] } },
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
]
