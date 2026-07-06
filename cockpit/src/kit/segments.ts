/**
 * Segment graph — the tier ladder (Foundation · Atom · Component · Section · Page).
 *
 * This is the single machine source for UICockpit's component MODEL (distinct from
 * the component CSS, which lives in `recipes/`). Every recipe is one **segment**,
 * classified into a tier, with declared `uses` edges (the composition graph). From
 * this graph the manifest banner, the (future) front-end workbench/components-catalog,
 * the coverage reads and the orphan-atom worklist are all *derived* — no separate
 * demo/app/recipe vocabularies kept in sync by greps.
 *
 *   Foundation → a token, or token/motion/layout glue upstream of the catalog.
 *   Atom       → only meaningful INSIDE something else; shown bare on the workbench.
 *   Component  → smallest thing that stands on its own as a believable piece of app;
 *                the surface IS the component. `uses` = the atoms it composes.
 *   Section    → a page-region scaffold (the nav suite, the pane layer) that
 *                arranges components per container width; owns arrangement, not look.
 *   Page       → an assembly of components/sections = a realistic screen.
 *
 * Human-readable rationale + per-segment notes live in `SEGMENT-REGISTRY.md`.
 */
import { RECIPES } from './recipes'

// NB: the `section` tier ≠ a recipe's `section` field (that field is the gallery-group label).
export type Tier = 'foundation' | 'atom' | 'component' | 'section' | 'page'

/**
 * SECTIONS (H3a — the page-region rung, public name "Layouts"): the app-frame
 * grammar BETWEEN components and pages — adaptive scaffolds, the nav suite, the
 * pane layer. A section arranges components per container width; it owns
 * arrangement, never look. `SECTION_USES` declares what each section slots/composes.
 * (Future page-region recipes also live in this tier.)
 */
export const SECTION_USES: Readonly<Record<string, readonly string[]>> = {
  // Shell regions — the app frame.
  scaffold: ['navsuite', 'pane'],
  navsuite: [],
  pane: [],
  // The top app-shell header — sibling of the sidebar; composes the trailing
  // atoms (search · a notification button · the account avatar/menu).
  appbar: ['searchinput', 'avatar', 'dropdown-menu', 'badges-pills', 'buttons'],
  // Header / region wrappers — the grammar a page is built FROM. A page =
  // page-head + a stack of titled .section regions; each arranges component fillers.
  'page-head': ['buttons'],
  section: ['buttons'],
  // Full-width page SLABS — each is a self-contained region of a page with its
  // own job + (usually) a heading. The test: would you put an <h2> above it and
  // call it a region of the screen? Then it's a section. A widget you drop INSIDE
  // such a region is a COMPONENT (see COMPONENT_USES) — that's the line that the
  // 2026-06-15 re-audit corrected (we'd over-promoted ~11 widgets to section).
  // The flagship data surface: the table atom + toolbar header + rows-per-page
  // select + pagination, matrix-complete across empty / loading / error.
  'data-table': ['table', 'toolbar', 'pagination-breadcrumb', 'select-trigger'],
  // The editing surface: a titled panel of labelled fields on a responsive grid,
  // with validation + a footer action bar. Composes the field atoms it lays out.
  'form-panel': ['form', 'form-primitives', 'buttons', 'select-trigger', 'numberinput', 'phoneinput', 'switch-toggle', 'radio-card'],
  // Pricing table, file gallery, the empty-content region, the nav rail — each a
  // full-width slab you stack into a page.
  pricing: ['card', 'buttons', 'badges-pills'],
  'plan-compare': ['buttons'],
  sidebar: ['navigation-row', 'avatar', 'badges-pills'],
  'empty-state': ['buttons'],
  'file-grid': ['card', 'badges-pills'],
  // Calendar VIEWS — the main content region of a calendar app (a week scheduler,
  // a year-at-a-glance). DISTINCT from the date/range PICKERS (calendar /
  // calendar-range), which are widgets → components.
  'calendar-week': ['calendar', 'buttons'],
  'calendar-year': ['calendar'],
}

/**
 * FOUNDATIONS (recipe level): token/motion/layout glue that sits UPSTREAM of the
 * catalog — systemic, but not a showcaseable component. (The token system itself —
 * colour · type · shape · space · motion — is the rest of the Foundation tier,
 * authored in `buildTokens`, not as recipes.)
 */
export const FOUNDATIONS: readonly string[] = [
  'button-finish', // a styling modifier (clean/tactile/soft) = a token axis on button
  'roll-down-item-stagger', // a motion behaviour, not a component → motion foundation
  'twocolumnlayout', // a page-scaffold layout primitive → layout foundation
  'layout-primitives', // the Every-Layout set (stack/cluster/switcher/grid/sidebar/center) → layout foundation
  'composition', // the mid-tier "phrase book" (.eyebrow/.num) — named token bundles upstream of components
]

/**
 * COMPONENTS: the smallest things that stand on their own — the surface IS the
 * component. `uses` = the atoms (and atoms-of-atoms) each composes from. These
 * edges are DECLARED, so "used in" / coverage / the orphan-atom worklist become
 * graph reads, not greps. (Empty arrays = a self-contained component that composes
 * no other catalog segment, e.g. toast-stack, resizable.)
 */
export const COMPONENT_USES: Readonly<Record<string, readonly string[]>> = {
  dialog: ['card', 'buttons'],
  'alert-dialog': ['card', 'buttons'],
  'sheet-drawer': ['card', 'buttons'],
  'command-palette': ['searchinput', 'list', 'kbd'],
  'toast-stack': [],
  lightbox: ['buttons'],
  wizardstepper: ['stepper', 'form-primitives', 'buttons'],
  'file-upload-dropzone': ['buttons'],
  'usage-meter': ['progress'],
  infocard: ['card', 'buttons'],
  carousel: ['buttons'],
  codeblock: ['code', 'buttons'],
  menubar: ['dropdown-menu', 'buttons'],
  resizable: [],
  // Widgets you drop INSIDE a section (the 2026-06-15 re-audit demoted these from
  // section → component: each is a part of a page-part, not a full-width slab).
  'entity-card': ['avatar', 'badges-pills', 'buttons'], // a card for one entity
  'action-panel': ['card', 'buttons', 'switch-toggle'], // heading + one action (incl. danger-zone)
  'danger-zone': ['card', 'buttons'], // the destructive action panel
  'filter-bar': ['searchinput', 'tag-input', 'select-trigger', 'segmented-control-toggle-group', 'slider', 'buttons', 'chip'], // a query toolbar — part of a data section
  auth: ['form-primitives', 'passwordinput', 'buttons', 'card'], // the sign-in form card
  calendar: ['buttons'], // the month-grid date picker
  'calendar-range': ['calendar', 'buttons'], // the double-month range picker
  'stat-tile': ['card', 'sparkline', 'badges-pills'], // a single metric tile
  chart: ['card'], // a chart widget (lives in a card)
  breakdown: [], // a share-bar category list — the analytical companion beside a chart
  timeline: ['avatar', 'badges-pills'], // an event list
  'activity-feed': ['avatar', 'badges-pills', 'list'], // a feed list
}

/**
 * STANDALONE atoms — primitives that legitimately stand on their own and attach to
 * *anything*, so they have no single host component. Blessing them satisfies the
 * coverage contract WITHOUT a parent (forcing a fake parent would be dishonest).
 * These are the overlay / utility / standalone-control / inline-messaging /
 * loading / data-display primitives: an atom is an **orphan** only if it is
 * neither parented by a component NOR blessed here.
 */
export const STANDALONE_ATOMS: readonly string[] = [
  // overlays — attach to any trigger, no owner
  'tooltip', 'popover', 'hover-card', 'context-menu',
  // standalone controls / nav — organise any content
  'tabs', 'accordion', 'segmented-control-toggle-group', 'navigation-menu', 'button-group',
  // self-contained input controls usable in any flow
  'input-otp', 'interactive-list-row', 'combobox',
  // inline messaging / status — drop in anywhere
  'alert', 'banner', 'inline-status-meta-micro-components', 'attachment-chip-family',
  // a chat/comment bubble — self-contained, stacks into a .thread (Fase J-8)
  'message',
  // AI-thread furniture (LP6) — self-contained receipts/disclosures that drop
  // into any .msg or feed: the tool receipt, the thinking line, the source chip
  'tool-call', 'reasoning', 'citation',
  // a rich-text container — styles raw semantic tags; no single host (Fase J-8)
  'prose',
  // loading & layout utilities
  'skeleton', 'spinner', 'separator', 'aspect-ratio', 'scroll-area',
  // data-display primitives
  'description-list', 'rating',
]

const FOUNDATION_SET: ReadonlySet<string> = new Set(FOUNDATIONS)
const COMPONENT_SET: ReadonlySet<string> = new Set(Object.keys(COMPONENT_USES))
const SECTION_SET: ReadonlySet<string> = new Set(Object.keys(SECTION_USES))
const STANDALONE_SET: ReadonlySet<string> = new Set(STANDALONE_ATOMS)

/** The tier of a recipe id. Default = `atom` (the bare vocabulary is the majority);
 * only foundations and components are listed explicitly above. */
export function tierOf(id: string): Tier {
  if (FOUNDATION_SET.has(id)) return 'foundation'
  if (COMPONENT_SET.has(id)) return 'component'
  if (SECTION_SET.has(id)) return 'section'
  return 'atom'
}

/** The segments a node composes from (Component → Atoms). Atoms/foundations = []. */
export const usesOf = (id: string): readonly string[] => COMPONENT_USES[id] ?? SECTION_USES[id] ?? []

/** All recipe ids of a tier, in authored (cascade) order. */
export const idsByTier = (t: Tier, recipes: readonly { id: string }[] = RECIPES): string[] =>
  recipes.map((r) => r.id).filter((id) => tierOf(id) === t)

/** The set of atoms that at least one component OR section declares in its `uses`.
 * Sections carry rich `uses` edges too (e.g. data-table → table/toolbar/…), so the
 * coverage contract must read BOTH tiers — otherwise promoting a component to a
 * section would orphan the atoms it parents. */
export function parentedAtoms(): Set<string> {
  const parented = new Set<string>()
  for (const id of COMPONENT_SET) for (const u of usesOf(id)) parented.add(u)
  for (const id of SECTION_SET) for (const u of usesOf(id)) parented.add(u)
  return parented
}

/** Whether an atom satisfies the coverage contract — it's either composed by a
 * component, or blessed as a legitimately-standalone primitive. */
export const isCovered = (id: string, parented: Set<string> = parentedAtoms()): boolean =>
  parented.has(id) || STANDALONE_SET.has(id)

/**
 * Orphan atoms — atoms that are NEITHER composed by a component NOR blessed as a
 * standalone primitive. Per the coverage contract this should converge to empty:
 * an orphan is a worklist item → build its home component, bless it as standalone,
 * or cut/merge. The list DRIVES which components to build (it's how data-table and
 * form-panel were chosen).
 */
export function orphanAtoms(recipes: readonly { id: string }[] = RECIPES): string[] {
  const parented = parentedAtoms()
  return idsByTier('atom', recipes).filter((id) => !isCovered(id, parented))
}
