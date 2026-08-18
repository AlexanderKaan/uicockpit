/**
 * check() — the conformance verdict on ONE answer, for ANY catalog.
 *
 * THE ARCHITECTURE, and the two things that took a while to see.
 *
 * 1. Accessibility of a generated answer splits in two, and only one half is
 *    per-answer. The BINDING is certified once, in CI: contrast, target size,
 *    a visible focus ring at every theme and density are properties of the
 *    implementation and its tokens, not of what the agent asked for. Measuring
 *    that per answer is waste; claiming it without measuring is a lie. The
 *    ANSWER is checked every time — here — for the things no binding can fix:
 *    a table with no column headers, a control with no name, headings that skip
 *    a level, two primary buttons, a link that says "read more".
 *
 * 2. The rules must not know component NAMES. A rule that looks for "Button"
 *    works on our catalog and nothing else, and A2UI exists precisely so that
 *    everyone defines their own. But you cannot derive meaning from a JSON
 *    Schema either — a schema describes SHAPE. So the catalog declares meaning
 *    in a small vocabulary (`x-a11y`), and where you do not own the catalog you
 *    supply a sidecar that states your reading of it (see catalogs/).
 *
 *    A component with no annotation is never assumed fine. It is returned by
 *    name as `unannotated`, exactly like the criteria we refuse to claim.
 *
 * The check runs on the TREE, not the markup, so one verdict holds for every
 * binding — shadcn, Tailwind, daisyUI, Flutter, SwiftUI.
 */

/* ── the vocabulary ────────────────────────────────────────────────────────
 * role      control · heading · image · link · table · list · status · text · layout
 * name      which property carries the accessible name
 * level     heading level property            columns  table header property
 * items     collection property               input    true for a form field
 * emphasis  { prop, primary }                 tone     property carrying a colour-only signal
 * itemName · itemStatus · itemTone            fields INSIDE a collection item
 * decorativeWhen  property that marks an image decorative
 */
export const VOCABULARY = ['role', 'name', 'level', 'columns', 'items', 'input', 'emphasis', 'tone', 'itemName', 'itemStatus', 'itemTone', 'decorativeWhen']

/** Annotation for a component: from the catalog's own `x-a11y`, or a sidecar. */
function annotate(catalog, sidecar) {
  const map = new Map()
  for (const [name, def] of Object.entries(catalog?.components ?? {})) if (def['x-a11y']) map.set(name, def['x-a11y'])
  for (const [name, a] of Object.entries(sidecar?.components ?? {})) map.set(name, a)   // a sidecar is explicit; it wins
  return map
}

const get = (n, prop) => (prop ? n[prop] : undefined)
const literal = (v) => (v && typeof v === 'object' ? (typeof v.path === 'string' ? `«${v.path}»` : null) : v)
const hasText = (v) => v != null && (typeof v === 'object' || String(v).trim() !== '')
const arr = (v) => (Array.isArray(v) ? v : [])

/** Every rule reads the ANNOTATION. None of them may mention a component name. */
export const RULES = [
  {
    id: 'heading-order', sc: '1.3.1', level: 'A', severity: 'fail',
    describe: 'Headings go down one level at a time.',
    run(nodes) {
      const out = []; let prev = 0
      for (const { n, a } of nodes) {
        if (a?.role !== 'heading') continue
        const lvl = Number(get(n, a.level)) || 0
        if (!lvl) continue
        if (prev && lvl > prev + 1) out.push({ id: n.id, message: `heading jumps from h${prev} to h${lvl}` })
        prev = lvl
      }
      return out
    },
  },
  {
    id: 'control-has-name', sc: '4.1.2', level: 'A', severity: 'fail',
    describe: 'Every control has an accessible name.',
    run(nodes) {
      return nodes.filter(({ a }) => a?.role === 'control')
        .filter(({ n, a }) => !hasText(get(n, a.name)) && !n.kids?.some((k) => hasText(k.text)))
        .map(({ n }) => ({ id: n.id, message: `${n.component} has no accessible name (property "${nodeAnn(nodes, n).name ?? '—'}" is empty)` }))
    },
  },
  {
    id: 'field-has-label', sc: '3.3.2', level: 'A', severity: 'fail',
    describe: 'Every input carries a label, not only a placeholder.',
    run(nodes) {
      return nodes.filter(({ a }) => a?.role === 'control' && a.input)
        .filter(({ n, a }) => !hasText(get(n, a.name)))
        .map(({ n }) => ({ id: n.id, message: `${n.component} is an input with no label` }))
    },
  },
  {
    id: 'table-has-headers', sc: '1.3.1', level: 'A', severity: 'fail',
    describe: 'A table declares its column headers.',
    run(nodes) {
      return nodes.filter(({ a }) => a?.role === 'table')
        .filter(({ n, a }) => arr(get(n, a.columns)).length === 0)
        .map(({ n, a }) => ({ id: n.id, message: `${n.component} has no "${a.columns}" — a screen reader gets an unlabelled grid` }))
    },
  },
  {
    id: 'image-has-alt', sc: '1.1.1', level: 'A', severity: 'fail',
    describe: 'Every image carries a text alternative, or is marked decorative.',
    run(nodes) {
      return nodes.filter(({ a }) => a?.role === 'image')
        .filter(({ n, a }) => !hasText(get(n, a.name)) && get(n, a.decorativeWhen) !== true)
        .map(({ n, a }) => ({ id: n.id, message: `${n.component} has no "${a.name}" and is not marked decorative` }))
    },
  },
  {
    id: 'link-purpose', sc: '2.4.4', level: 'A', severity: 'review',
    describe: 'Link text says where it goes.',
    run(nodes) {
      const vague = /^(read more|more|click here|here|learn more|details|link|open)\.?$/i
      return nodes.filter(({ n, a }) => a?.role === 'link' || (a?.role === 'control' && n.href))
        .filter(({ n, a }) => vague.test(String(literal(get(n, a.name)) ?? '').trim()))
        .map(({ n, a }) => ({ id: n.id, message: `link text "${literal(get(n, a.name))}" does not say where it goes` }))
    },
  },
  {
    id: 'one-primary', sc: null, level: 'craft', severity: 'review',
    describe: 'One primary action per answer — a composition rule, not a WCAG criterion.',
    run(nodes) {
      const primary = nodes.filter(({ n, a }) => a?.role === 'control' && a.emphasis &&
        (n[a.emphasis.prop] ?? a.emphasis.primary) === a.emphasis.primary)
      return primary.length > 1
        ? [{ id: primary.map(({ n }) => n.id).join(', '), message: `${primary.length} primary actions — the reader cannot tell which is THE action` }]
        : []
    },
  },
  {
    id: 'status-not-colour-only', sc: '1.4.1', level: 'A', severity: 'review',
    describe: 'A status is carried by words, not only by a colour.',
    run(nodes) {
      const out = []
      for (const { n, a } of nodes) {
        if (a?.tone && get(n, a.tone) && !hasText(get(n, a.name)))
          out.push({ id: n.id, message: `${n.component} has tone "${get(n, a.tone)}" and no text` })
        if (a?.itemTone) for (const it of arr(n.resolvedItems)) {
          if (it[a.itemTone] && !hasText(it[a.itemStatus])) out.push({ id: n.id, message: `an item has tone "${it[a.itemTone]}" but no status word` })
        }
      }
      return out
    },
  },
]

const nodeAnn = (nodes, node) => nodes.find(({ n }) => n === node)?.a ?? {}

/** What no machine can judge — returned by name, never counted as passing. */
export const UNCHECKED = [
  { sc: '1.1.1', what: 'whether the alt text describes the image (only that it exists)' },
  { sc: '2.4.6', what: 'whether a heading describes the section under it' },
  { sc: '3.3.3', what: 'whether an error message says how to fix the error' },
  { sc: '3.1.1', what: 'whether the language of the answer matches the page' },
  { sc: '1.4.3', what: 'painted contrast — certified per BINDING in CI, not per answer' },
  { sc: '2.5.8', what: 'target size — certified per BINDING in CI, not per answer' },
]

function flatten(node, acc = []) { acc.push(node); for (const k of node.kids ?? []) flatten(k, acc); return acc }

/**
 * @param tree            the resolved component tree (buildTree + hydrated items)
 * @param opts.catalog    the catalog — its components may carry `x-a11y`
 * @param opts.a11y       a sidecar for a catalog you do not own (see catalogs/)
 * @param opts.binding    { id, certified } — what CI proved about the renderer
 */
export function check(tree, opts = {}) {
  const ann = annotate(opts.catalog, opts.a11y)
  const nodes = flatten(tree).map((n) => ({ n, a: ann.get(n.component) }))
  const findings = []
  for (const rule of RULES) for (const hit of rule.run(nodes)) {
    findings.push({ rule: rule.id, sc: rule.sc, level: rule.level, severity: rule.severity, ...hit })
  }
  /* Two different silences, and conflating them would be dishonest in both
   * directions. A component the catalog does not HAVE was refused — the
   * renderer showed a refusal, nothing was painted, and that is not an
   * accessibility gap. A component the catalog HAS but never gave semantics to
   * WAS painted, and we could not check it. Only the second is a hole. */
  const known = new Set(Object.keys(opts.catalog?.components ?? {}))
  const silent = nodes.filter(({ a }) => !a).map(({ n }) => n.component)
  const refused = [...new Set(silent.filter((c) => !known.has(c)))]
  const unannotated = [...new Set(silent.filter((c) => known.has(c)))]
  const fails = findings.filter((f) => f.severity === 'fail')
  const reviews = findings.filter((f) => f.severity === 'review')
  const binding = opts.binding ?? { id: 'unknown', certified: false }

  return {
    verdict: fails.length ? 'fail'
      : !binding.certified ? 'unverified'
      : unannotated.length ? 'partial'
      : reviews.length ? 'needs-review' : 'AA',
    why: fails.length ? `${fails.length} answer-level failure(s)`
      : !binding.certified ? `the answer is clean, but binding "${binding.id}" has no CI certification — contrast and target size are unproven`
      : unannotated.length ? `${unannotated.length} rendered component(s) carry no accessibility semantics, so nothing was checked about them: ${unannotated.join(', ')}`
      : reviews.length ? `${reviews.length} thing(s) a person must judge`
      : 'answer clean, binding certified',
    findings,
    binding,
    unannotated,
    refused,
    unchecked: UNCHECKED,
    counted: { nodes: nodes.length, rules: RULES.length, annotated: nodes.length - nodes.filter(({ a }) => !a).length },
  }
}
