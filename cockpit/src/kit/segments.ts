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
  scaffold: ['navsuite', 'pane'],
  navsuite: [],
  pane: [],
  // Page-region sections — the wrappers that organize components under a header
  // (the drift-killers from KIT-COVERAGE-AUDIT). A page = page-head + a stack of
  // sections; each section arranges component fillers.
  'page-head': ['buttons'],
  section: ['buttons'],
  'entity-card': ['avatar', 'badges-pills', 'buttons'],
  // The Tailwind "action panels" family — a card that states one thing + offers
  // one action (a button, a toggle, or an inline input). The settings workhorse.
  'action-panel': ['card', 'buttons', 'switch-toggle'],
  // Promoted to the section tier (Tailwind-style "a section is a full part of a
  // page"): each is a complete page-region surface, not a bare component. Their
  // `uses` edges are unchanged — they still parent the same atoms (see the
  // parentedAtoms() union below, which keeps coverage green after the move).
  // The flagship: a complete data surface. Composes the table atom with a toolbar
  // header, a rows-per-page select and pagination — matrix-complete across
  // empty / loading / error. Adopting these four was the orphan worklist's lead.
  'data-table': ['table', 'toolbar', 'pagination-breadcrumb', 'select-trigger'],
  // The editing surface: a titled panel of labelled fields on a responsive grid,
  // with validation + a footer action bar. Composes the field atoms it lays out.
  'form-panel': ['form', 'form-primitives', 'buttons', 'select-trigger', 'numberinput', 'phoneinput', 'switch-toggle', 'radio-card'],
  // The query surface: a filter/search toolbar above a list or table. Composes the
  // querying atoms — search + autocomplete + tag chips + faceted selects + a range.
  'filter-bar': ['searchinput', 'tag-input', 'select-trigger', 'segmented-control-toggle-group', 'slider', 'buttons', 'chip'],
  sidebar: ['navigation-row', 'avatar', 'badges-pills'],
  'empty-state': ['buttons'],
  auth: ['form-primitives', 'passwordinput', 'buttons', 'card'],
  'file-grid': ['card', 'badges-pills'],
  calendar: ['buttons'],
  pricing: ['card', 'buttons', 'badges-pills'],
  'stat-tile': ['card', 'sparkline', 'badges-pills'],
  chart: ['card'],
  timeline: ['avatar', 'badges-pills'],
  'activity-feed': ['avatar', 'badges-pills', 'list'],
  'danger-zone': ['card', 'buttons'],
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
  // a rich-text container — styles raw semantic tags; no single host (Fase J-8)
  'prose',
  // loading & layout utilities
  'skeleton', 'spinner', 'separator', 'aspect-ratio', 'scroll-area',
  // the Shape Lab mask utility (H5) — attaches to any whitelisted identity
  // surface (avatar / media / loader / empty-state); no single host block
  'signature',
  // data-display primitive
  'description-list',
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
