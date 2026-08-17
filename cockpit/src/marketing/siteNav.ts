/**
 * THE SITE'S NAVIGATION, ONCE.
 *
 * Components are the ground; the four services stand on them and read as one
 * group; the guide last. Every surface that shows a way across the product —
 * the site nav, its phone sheet, the configurator's topbar — renders THIS list,
 * so a tool can never be reachable from one place and missing from another
 * (which happened: the audit door dropped out of the phone nav for two sprints,
 * and the configurator had no way back but its logo).
 *
 * The one primary button the nav used to carry ("Use the components" → /docs)
 * is gone: with four tools in the row it was a fifth call, and it pointed where
 * the Docs link beside it already went. The actions live in the tools — each
 * page has its own primary — and the homepage hero keeps the two doors
 * (browse · use in your project). Decided 2026-08-17.
 */
export type SiteNavId = 'components' | 'configure' | 'audit' | 'forge' | 'genui' | 'docs'
export type SiteNavGroup = 'ground' | 'service' | 'guide'

export const SITE_NAV: ReadonlyArray<{ id: SiteNavId; label: string; to: string; group: SiteNavGroup }> = [
  { id: 'components', label: 'Components', to: '/components', group: 'ground' },
  { id: 'configure', label: 'Configure', to: '/app', group: 'service' },
  { id: 'audit', label: 'Audit', to: '/audit', group: 'service' },
  { id: 'forge', label: 'Forge', to: '/forge', group: 'service' },
  { id: 'genui', label: 'Generative UI', to: '/genui', group: 'service' },
  { id: 'docs', label: 'Docs', to: '/docs', group: 'guide' },
]

/** The services alone, in nav order — the four tools. */
export const SITE_SERVICES = SITE_NAV.filter((n) => n.group === 'service')
