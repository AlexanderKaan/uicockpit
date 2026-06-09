/**
 * Segment graph — the 4-layer ladder (Foundation · Atom · Block · Page).
 *
 * This is the single machine source for UICockpit's component MODEL (distinct from
 * the component CSS, which lives in `recipes/`). Every recipe is one **segment**,
 * classified into a tier, with declared `uses` edges (the composition graph). From
 * this graph the manifest banner, the (future) front-end workbench/blocks-catalog,
 * the coverage reads and the orphan-atom worklist are all *derived* — no separate
 * demo/app/recipe vocabularies kept in sync by greps.
 *
 *   Foundation → a token, or token/motion/layout glue upstream of the catalog.
 *   Atom       → only meaningful INSIDE something else; shown bare on the workbench.
 *   Block      → smallest thing that stands on its own as a believable piece of app;
 *                the surface IS the component. `uses` = the atoms it composes.
 *   Page       → an assembly of blocks = a realistic screen (the SupaDash screens —
 *                external, in DemoDashboard.tsx, not recipes).
 *
 * Human-readable rationale + per-segment notes live in `SEGMENT-REGISTRY.md`.
 */
import { RECIPES } from './recipes'

export type Tier = 'foundation' | 'atom' | 'block' | 'page'

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
]

/**
 * BLOCKS: the smallest things that stand on their own — the surface IS the
 * component. `uses` = the atoms (and atoms-of-atoms) each composes from. These
 * edges are DECLARED, so "used in" / coverage / the orphan-atom worklist become
 * graph reads, not greps. (Empty arrays = a self-contained block that composes no
 * other catalog segment, e.g. toast-stack, resizable.)
 */
export const BLOCK_USES: Readonly<Record<string, readonly string[]>> = {
  // The flagship: a complete data surface. Composes the table atom with a toolbar
  // header, a rows-per-page select and pagination — matrix-complete across
  // empty / loading / error. Adopting these four was the orphan worklist's lead.
  'data-table': ['table', 'toolbar', 'pagination-breadcrumb', 'select-trigger'],
  // The editing surface: a titled panel of labelled fields on a responsive grid,
  // with validation + a footer action bar. Composes the field atoms it lays out.
  'form-panel': ['form', 'form-primitives', 'buttons', 'select-trigger', 'numberinput', 'phoneinput', 'switch-toggle', 'radio-card'],
  sidebar: ['navigation-row', 'avatar', 'badges-pills'],
  dialog: ['card', 'buttons'],
  'alert-dialog': ['card', 'buttons'],
  'sheet-drawer': ['card', 'buttons'],
  'command-palette': ['searchinput', 'list', 'kbd'],
  'toast-stack': [],
  lightbox: ['buttons'],
  'empty-state': ['buttons'],
  auth: ['form-primitives', 'buttons', 'card'],
  wizardstepper: ['stepper', 'form-primitives', 'buttons'],
  'file-upload-dropzone': ['buttons'],
  'file-grid': ['card', 'badges-pills'],
  calendar: ['buttons'],
  pricing: ['card', 'buttons', 'badges-pills'],
  'stat-tile': ['card', 'sparkline', 'badges-pills'],
  'usage-meter': ['progress'],
  chart: ['card'],
  infocard: ['card', 'buttons'],
  timeline: ['avatar', 'badges-pills'],
  'activity-feed': ['avatar', 'badges-pills', 'list'],
  'danger-zone': ['card', 'buttons'],
  carousel: ['buttons'],
  codeblock: ['code', 'buttons'],
  menubar: ['dropdown-menu', 'buttons'],
  resizable: [],
}

const FOUNDATION_SET: ReadonlySet<string> = new Set(FOUNDATIONS)
const BLOCK_SET: ReadonlySet<string> = new Set(Object.keys(BLOCK_USES))

/** The tier of a recipe id. Default = `atom` (the bare vocabulary is the majority);
 * only foundations and blocks are listed explicitly above. */
export function tierOf(id: string): Tier {
  if (FOUNDATION_SET.has(id)) return 'foundation'
  if (BLOCK_SET.has(id)) return 'block'
  return 'atom'
}

/** The segments a node composes from (Block → Atoms). Atoms/foundations = []. */
export const usesOf = (id: string): readonly string[] => BLOCK_USES[id] ?? []

/** All recipe ids of a tier, in authored (cascade) order. */
export const idsByTier = (t: Tier, recipes: readonly { id: string }[] = RECIPES): string[] =>
  recipes.map((r) => r.id).filter((id) => tierOf(id) === t)

/** The set of atoms that at least one block declares in its `uses`. */
export function parentedAtoms(): Set<string> {
  const parented = new Set<string>()
  for (const id of BLOCK_SET) for (const u of usesOf(id)) parented.add(u)
  return parented
}

/**
 * Orphan atoms — atoms that NO block declares in its `uses`. Per the coverage
 * contract: an atom must have ≥1 parent block; an orphan is a worklist item →
 * build its home block, or cut/merge. The list DRIVES which blocks to build
 * (e.g. table + toolbar + pagination-breadcrumb + select-trigger → the data-table
 * block; form + form-primitives → the form-panel block).
 */
export function orphanAtoms(recipes: readonly { id: string }[] = RECIPES): string[] {
  const parented = parentedAtoms()
  return idsByTier('atom', recipes).filter((id) => !parented.has(id))
}
