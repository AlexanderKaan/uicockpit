/**
 * Generative UI — the spec (v0, ours), and its admission control.
 *
 * An agent answers with a small JSON tree instead of prose; the tree names
 * COMPONENTS, and the components are the kit's — every type below maps onto
 * exactly one recipe, so a generative answer can only be made of things that
 * have a source (the four-layer derivation) and a measured shape (the
 * manifest). Anything else is REFUSED, visibly, with the forge's verdict:
 * "kanban — no layer names it", "carousel — exists in the kit but is not
 * admitted to generative output". A refusal renders as a refusal, never as a
 * silent drop and never as an improvised div — the whole point of putting
 * these components under a public-service assistant (GovChat-NL, DefGPT,
 * GPT-NL) is that the assistant cannot invent UI.
 *
 * Step 2, not built: an A2UI adapter (Google's agent→UI message shape) mapping
 * `Card`, `Text`, `Row`, `Column`, `List`, `Button`, `Tabs`, `Divider`… onto
 * this catalogue. This spec is deliberately smaller and nested (a hand can
 * write it in a sandbox); the adapter flattens.
 *
 * Nothing here renders — see render.tsx. This module is pure so it can be
 * tested and reused by the CLI/MCP later.
 */

export type Tone = 'neutral' | 'primary' | 'success' | 'warn' | 'danger' | 'info'
export type IconName = 'check' | 'chevR' | 'info' | 'cal' | 'store' | 'home' | 'chart' | 'card' | 'feed' | 'chat' | 'spark' | 'bell' | 'cog' | 'search' | 'file' | 'grid' | 'plus' | 'edit' | 'upload' | 'refresh'

export type Badge = { text: string; tone?: Tone; dot?: boolean }
export type Cell = string | { badge: Badge } | { num: string }

export type GenNode =
  | { type: 'heading'; text: string; sub?: string; eyebrow?: string; level?: 2 | 3 }
  | { type: 'text'; text: string }
  | { type: 'stack' | 'cluster' | 'grid'; children: GenNode[]; min?: string }
  | { type: 'card'; title?: string; desc?: string; media?: { alt: string; label?: string }; badge?: Badge; children?: GenNode[]; actions?: GenNode[]; well?: boolean }
  | { type: 'button'; text: string; variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'link' | 'danger'; size?: 'sm'; href?: string; icon?: IconName }
  | { type: 'badge' } & Badge
  | { type: 'metric'; label: string; value: string; sub?: string; icon?: IconName }
  | { type: 'metrics'; items: { label: string; value: string; sub?: string }[] }
  | { type: 'facts'; items: { label: string; value: string; href?: string; badge?: Badge }[] }
  | { type: 'list'; items: { title: string; sub?: string; icon?: IconName; initials?: string; trail?: string | { badge: Badge }; href?: string }[]; section?: string }
  | { type: 'table'; columns: string[]; rows: Cell[][]; caption?: string }
  | { type: 'alert'; tone: 'info' | 'success' | 'warning' | 'danger'; title?: string; text: string }
  | { type: 'banner'; text: string; strong?: string; link?: { text: string; href?: string }; warn?: boolean }
  | { type: 'warning'; text: string }
  | { type: 'steps'; items: { title: string; body?: string }[] }
  | { type: 'tasks'; items: { name: string; status: Badge; hint?: string; locked?: boolean; href?: string }[] }
  | { type: 'progress'; label: string; value: number; max?: number; hint?: string; warn?: boolean; unit?: string }
  | { type: 'stepper'; steps: string[]; current: number; label?: string }
  | { type: 'accordion'; items: { summary: string; body: string }[]; open?: number }
  | { type: 'tabs'; items: string[]; selected?: number; label?: string }
  | { type: 'activity'; items: { text: string; meta?: string; time?: string; tone?: Tone }[] }
  | { type: 'requirements'; items: { text: string; met: boolean }[] }
  | { type: 'choice'; label: string; options: { title: string; desc?: string; meta?: string }[]; selected?: number }
  | { type: 'input'; label: string; kind?: 'text' | 'email' | 'date' | 'number' | 'tel' | 'search'; hint?: string; placeholder?: string; required?: boolean }
  | { type: 'divider' }

export type GenSpec = { title?: string; blocks: GenNode[] }
export type GenType = GenNode['type']

/** THE CATALOGUE — every admitted type, the ONE recipe it renders with, and
 *  what the manifest says the consumer owes for it (behaviour). Anything not
 *  in this table is refused. `recipe` is a recipe id from src/kit/recipes —
 *  the test holds every id to the kit and to a provenance line in forge.json,
 *  so a generative type without a source cannot be added here. */
/* Not admitted, and why — so the absence is a decision, not an oversight:
 *   empty-state   the derivation lists it as sourceless (no core line) — the
 *                 rule "a provenance line or leaves" applies to generative output
 *                 first of all; when it earns a line it can be admitted;
 *   carousel · dialog · sheet · command palette · combobox · calendar
 *                 behaviour = script or a surface an assistant should not open on
 *                 its own; the behaviour module comes first;
 *   images        no image component in the kit; a card carries a media slot. */
export const GEN_CATALOG: Record<GenType, { recipe: string; label: string; note?: string }> = {
  heading:      { recipe: 'page-head',            label: 'Page head' },
  text:         { recipe: 'prose',                label: 'Prose' },
  stack:        { recipe: 'layout-primitives',    label: 'Stack (l-stack)' },
  cluster:      { recipe: 'layout-primitives',    label: 'Cluster (l-cluster)' },
  grid:         { recipe: 'layout-primitives',    label: 'Grid (l-grid)' },
  card:         { recipe: 'card',                 label: 'Card' },
  button:       { recipe: 'buttons',              label: 'Button', note: 'a plain button is the platform\'s; the manifest\'s "script" comes from the wall\'s toggle / menu / loading specimens (aria-pressed · aria-expanded · aria-busy)' },
  badge:        { recipe: 'badges-pills',         label: 'Badge' },
  metric:       { recipe: 'composition',          label: 'Metric' },
  metrics:      { recipe: 'description-list',     label: 'Metric band (dl--band)' },
  facts:        { recipe: 'description-list',     label: 'Description list' },
  list:         { recipe: 'list',                 label: 'List' },
  table:        { recipe: 'table',                label: 'Table' },
  alert:        { recipe: 'alert',                label: 'Alert' },
  banner:       { recipe: 'banner',               label: 'Banner' },
  warning:      { recipe: 'warningtext',          label: 'Warning text (GOV.UK)' },
  steps:        { recipe: 'processlist',          label: 'Process list (GOV.UK step by step)' },
  tasks:        { recipe: 'tasklist',             label: 'Task list (GOV.UK)' },
  progress:     { recipe: 'usage-meter',          label: 'Meter' },
  stepper:      { recipe: 'stepper',              label: 'Stepper' },
  accordion:    { recipe: 'accordion',            label: 'Accordion (details/summary — the platform owns open/close)' },
  tabs:         { recipe: 'tabs',                 label: 'Tabs', note: 'renders the tablist; switching is script the consumer owns (manifest: behaviour = script)' },
  activity:     { recipe: 'activity-feed',        label: 'Activity feed' },
  requirements: { recipe: 'requirements',         label: 'Requirements checklist' },
  choice:       { recipe: 'radio-card',           label: 'Radio cards (one of)' },
  input:        { recipe: 'form-primitives',      label: 'Field', note: 'a text field is the platform\'s; the manifest\'s "script" comes from the wall\'s validation / date-picker specimens' },
  divider:      { recipe: 'layout-primitives',    label: 'Divider (<hr>, styled by the floor)' },
}

export const GEN_TYPES = Object.keys(GEN_CATALOG) as GenType[]
export const isGenType = (t: unknown): t is GenType => typeof t === 'string' && Object.prototype.hasOwnProperty.call(GEN_CATALOG, t)

/* ── admission ──────────────────────────────────────────────────────────── */

export type Issue = {
  level: 'refused' | 'warning'
  path: string
  message: string
  /** what the forge said about the word, when the type is unknown */
  forge?: { verdict: string; say: string; page?: string | null }
}

/** A node as it will render: either an admitted node with its issues, or a
 *  refusal that renders AS a refusal, in place. */
export type Admitted =
  | { ok: true; node: GenNode; path: string; children?: Admitted[]; actions?: Admitted[] }
  | { ok: false; path: string; type: string; issue: Issue }

export type Verdict = { verdict: string; say: string; page?: string | null }
export type Resolver = { resolve: (text: string) => Verdict }

/** Budgets: generative output for a chat surface, not a dashboard. Past these
 *  the answer is a page, and a page is not what an assistant should paint. */
export const LIMITS = { depth: 6, items: 12, blocks: 24, text: 600 }

const REQUIRED: Partial<Record<GenType, string[]>> = {
  heading: ['text'], text: ['text'], stack: ['children'], cluster: ['children'], grid: ['children'],
  button: ['text'], badge: ['text'], metric: ['label', 'value'], metrics: ['items'], facts: ['items'], list: ['items'],
  table: ['columns', 'rows'], alert: ['tone', 'text'], banner: ['text'], warning: ['text'], steps: ['items'], tasks: ['items'],
  progress: ['label', 'value'], stepper: ['steps', 'current'], accordion: ['items'], tabs: ['items'],
  activity: ['items'], requirements: ['items'], choice: ['label', 'options'], input: ['label'],
}
const CONTAINERS = new Set<GenType>(['stack', 'cluster', 'grid', 'card'])

/**
 * Admit a spec: every node is checked against the catalogue (unknown → the
 * forge answers why), its required fields, the budgets, and the kit's own
 * composition rules (a card does not nest a card — the card recipe's doc says
 * so). Returns the tree to render plus a flat list of issues for the panel.
 * Pure; the resolver is injected so this runs without forge.json in tests.
 */
export function admit(spec: unknown, forge?: Resolver): { title: string | null; tree: Admitted[]; issues: Issue[]; count: number } {
  const issues: Issue[] = []
  let count = 0
  const refuse = (path: string, type: string, message: string, extra?: Partial<Issue>): Admitted => {
    const issue: Issue = { level: 'refused', path, message, ...extra }
    issues.push(issue)
    return { ok: false, path, type, issue }
  }
  const warn = (path: string, message: string) => issues.push({ level: 'warning', path, message })

  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    return { title: null, tree: [refuse('$', '?', 'The spec must be an object with a `blocks` array.')], issues, count }
  }
  const s = spec as Record<string, unknown>
  const blocks = Array.isArray(s.blocks) ? s.blocks : null
  if (!blocks) return { title: null, tree: [refuse('$.blocks', '?', '`blocks` must be an array of nodes.')], issues, count }
  const title = typeof s.title === 'string' ? s.title : null

  const walk = (raw: unknown, path: string, depth: number, inCard: boolean): Admitted => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return refuse(path, typeof raw, 'A node must be an object with a `type`.')
    const n = raw as Record<string, unknown>
    const type = n.type
    if (typeof type !== 'string') return refuse(path, '?', 'A node needs a string `type`.')
    if (!isGenType(type)) {
      const v = forge ? forge.resolve(type) : null
      const why = v
        ? v.verdict === 'exists'
          ? `"${type}" exists in the kit but is not admitted to generative output yet.`
          : v.verdict === 'platform'
            ? `"${type}" is a platform element — the assistant does not paint raw elements; ask for a component that carries it.`
            : v.say.startsWith(`"${type}"`) ? v.say : `"${type}" — ${v.say}`
        : `"${type}" is not in the generative catalogue.`
      return refuse(path, type, why, v ? { forge: { verdict: v.verdict, say: v.say, page: v.page ?? null } } : undefined)
    }
    if (depth > LIMITS.depth) return refuse(path, type, `Nested deeper than ${LIMITS.depth} — an answer this deep is a page, not a reply.`)
    if (type === 'card' && inCard) return refuse(path, type, 'A card inside a card — the card recipe says: use rows or a plain group instead.')
    for (const key of REQUIRED[type] ?? []) {
      const v = n[key]
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return refuse(path, type, `\`${type}\` needs \`${key}\`.`)
    }
    count++
    if (count > LIMITS.blocks) return refuse(path, type, `More than ${LIMITS.blocks} components in one answer — over the budget for a reply.`)
    // budgets on lists of items
    for (const key of ['items', 'options', 'rows', 'steps'] as const) {
      const arr = n[key]
      if (Array.isArray(arr) && arr.length > LIMITS.items) { warn(path, `\`${key}\` has ${arr.length} entries; the first ${LIMITS.items} render.`); n[key] = arr.slice(0, LIMITS.items) }
    }
    if (typeof n.text === 'string' && n.text.length > LIMITS.text) { warn(path, `\`text\` is ${n.text.length} characters; a reply component carries ${LIMITS.text} at most — the rest is cut.`); n.text = n.text.slice(0, LIMITS.text) + '…' }

    const out: Admitted = { ok: true, node: n as unknown as GenNode, path }
    if (CONTAINERS.has(type)) {
      const kids = Array.isArray(n.children) ? n.children : []
      if (kids.length) out.children = kids.map((k, i) => walk(k, `${path}.children[${i}]`, depth + 1, inCard || type === 'card'))
    }
    if (type === 'card' && Array.isArray(n.actions)) {
      out.actions = n.actions.map((a, i) => {
        const r = walk(a, `${path}.actions[${i}]`, depth + 1, true)
        if (r.ok && r.node.type !== 'button') return refuse(r.path, r.node.type, 'A card\'s `actions` hold buttons only — the foot is the action zone, one primary at most.')
        return r
      })
    }
    return out
  }

  const tree = blocks.map((b, i) => walk(b, `$.blocks[${i}]`, 1, false))
  return { title, tree, issues, count }
}

/** Distinct admitted types in a tree, in order of first use — for the
 *  provenance panel ("what this answer is made of"). */
export function typesUsed(tree: Admitted[]): GenType[] {
  const seen: GenType[] = []
  const visit = (a: Admitted) => {
    if (!a.ok) return
    if (!seen.includes(a.node.type)) seen.push(a.node.type)
    a.children?.forEach(visit)
    a.actions?.forEach(visit)
  }
  tree.forEach(visit)
  return seen
}
