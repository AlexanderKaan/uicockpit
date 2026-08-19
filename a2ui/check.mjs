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
 * action    property naming a SIDE EFFECT the application must authorise
 */
import { actionsOf } from './core.mjs'

export const VOCABULARY = ['role', 'name', 'nameFromChild', 'action', 'level', 'columns', 'items', 'input', 'emphasis', 'tone', 'itemName', 'itemStatus', 'itemTone', 'decorativeWhen']

/* Roles that CANNOT be accessible without a name. If a catalog gives such a
 * component no property to carry one, that is a gap in the CATALOG, not a fault
 * in the answer — no renderer and no agent can fix it. Reported separately, and
 * found for real: the A2UI Basic Catalog's Video (url + posterUrl only, so WCAG
 * 1.1.1 cannot be met) and Modal (trigger + content, so the dialog has no
 * accessible name for 4.1.2). */
const NEEDS_NAME = new Set(['control', 'image', 'link'])
export function catalogGaps(ann, catalog) {
  const out = []
  for (const [component, a] of ann) {
    if (!NEEDS_NAME.has(a.role)) continue
    if (a.name || a.nameFromChild || a.itemName) continue
    out.push({ component, kind: 'name', role: a.role, sc: a.role === 'image' ? '1.1.1' : '4.1.2',
      message: `${component} is a ${a.role} and the catalog gives it no property that can carry a name — no renderer can fix that` })
  }
  /* The third kind of gap, and the one an accessibility check would never look
   * for: a control that asks for a SIDE EFFECT the catalog never enumerates.
   * Rendering is not permission — but a button that names an action nobody can
   * validate puts the whole question on the application, silently. A2UI's Basic
   * Catalog REQUIRES every Button to carry one and names not a single action. */
  for (const { component, prop, values } of actionsOf(catalog).props) {
    if (values?.length) continue
    out.push({ component, kind: 'action', sc: 'safety',
      message: `${component} names a side effect in "${prop}" and the catalog enumerates no actions, so nothing downstream can tell an allowed one from an invented one` })
  }
  /* A catalog with no heading anywhere cannot express document structure: every
   * title is then just text that happens to look bigger, which is 1.3.1 exactly
   * (presentation carrying meaning the machine cannot read) and leaves a screen
   * reader with nothing to navigate by. Found in the A2UI Basic Catalog, whose
   * Text component offers `caption` and `body` and no level. */
  if (ann.size && ![...ann.values()].some((a) => a.role === 'heading')) {
    out.push({ component: '—', kind: 'structure', sc: '1.3.1',
      message: 'no component in this catalog is a heading, so nothing rendered from it has structure to navigate by' })
  }
  return out
}

/**
 * Read a binding certificate into the two things a verdict needs: whether the
 * painted properties are proven FOR THE CONFIGURATION IN USE, and one line
 * saying exactly how far the proof reaches.
 *
 * `certified: true` in the certificate means every configuration held. Ours
 * does not: extending the sweep to the controls the A2UI Basic Catalog made us
 * render found a checked checkbox at 1.61:1 in two dark themes. The default the
 * page renders is clean, so the verdict may stand — but the sentence under it
 * has to say 54 of 60, every time, or the certificate is decoration.
 */
export function describeBinding(cert) {
  if (!cert) return { certified: false, partial: false, line: 'no certificate — contrast and target size are unproven' }
  const total = cert.combinations ?? 0
  const clean = cert.certifiedCombinations ?? (cert.certified ? total : 0)
  if (cert.certified) return { certified: true, partial: false, line: `${cert.pairsChecked} contrast pairs over ${total} configurations, all above the floor` }
  const themes = [...new Set((cert.failures ?? []).map((f) => f.split('/')[0]))]
  return {
    certified: !!cert.defaultPasses,
    partial: true,
    line: `${cert.pairsChecked} contrast pairs over ${total} configurations — ${clean} clean. ${cert.failures.length} fail, all in ${themes.join(' and ')} dark mode; ${cert.defaultConfiguration} (what you see) is clean.`,
  }
}

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
      const named = ({ n, a }) => {
        if (a.nameFromChild) return descendantText(n)          // A2UI's Button: the name is its child
        if (a.name) return hasText(get(n, a.name))
        return true                                            // no property can carry one — a CATALOG gap, reported apart
      }
      return nodes.filter(({ a }) => a?.role === 'control').filter((x) => !named(x))
        .map(({ n, a }) => ({ id: n.id, message: a.nameFromChild
          ? `${n.component} has no child carrying text — its accessible name comes from what is inside it`
          : `${n.component} has no accessible name (property "${a.name}" is empty)` }))
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
      /* A component the catalog gave no alt property at all is NOT the answer's
         fault — catalogGaps() already says so, by name. Blaming the answer here
         too would report one problem twice and point at the wrong culprit. */
      return nodes.filter(({ a }) => a?.role === 'image' && a.name)
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
    /* Not WCAG — the article that names this pattern calls it separating
       rendering from execution, and it is the one rule here about trust rather
       than perception: the answer may only ask for what the catalog declared. */
    id: 'action-is-declared', sc: 'safety', level: '—', severity: 'fail',
    describe: 'Every action a control asks for is one the catalog declares.',
    run(nodes, catalog) {
      const allowed = new Map(actionsOf(catalog).props.filter((p) => p.values?.length).map((p) => [p.component + '.' + p.prop, new Set(p.values)]))
      return nodes.filter(({ a }) => a?.action)
        .map(({ n, a }) => ({ n, a, want: get(n, a.action), set: allowed.get(n.component + '.' + a.action) }))
        .filter(({ want, set }) => set && typeof want === 'string' && !set.has(want))
        .map(({ n, want, set }) => ({ id: n.id,
          message: `asks for "${want}", which this catalog does not declare (it declares ${[...set].join(', ')}) — a rendered control is not permission to run anything` }))
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

/** Any text anywhere below this node — how a wrapper component gets its name. */
function descendantText(n) {
  if (hasText(n.text) || hasText(n.label)) return true
  return (n.kids ?? []).some(descendantText)
}

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
  for (const rule of RULES) for (const hit of rule.run(nodes, opts.catalog)) {
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
  /* A gap the answer actually RUNS INTO is not the same as a gap sitting unused
   * in the catalog. If this answer contains a Video, the reader really does get
   * an unlabelled video — so the verdict cannot be AA. But the agent did nothing
   * wrong and no renderer can fix it, so it is not a failure of the answer
   * either: it caps at `partial`, and the message blames the catalog by name. */
  const gaps = catalogGaps(ann, opts.catalog)
  const present = new Set(nodes.map(({ n }) => n.component))
  const gapsUsed = gaps.filter((g) => g.kind === 'name' && present.has(g.component))
  const fails = findings.filter((f) => f.severity === 'fail')
  const reviews = findings.filter((f) => f.severity === 'review')
  const binding = opts.binding ?? { id: 'unknown', certified: false }

  return {
    verdict: fails.length ? 'fail'
      : !binding.certified ? 'unverified'
      : gapsUsed.length ? 'partial'
      : unannotated.length ? 'partial'
      : reviews.length ? 'needs-review' : 'AA',
    why: fails.length ? `${fails.length} answer-level failure(s)`
      : !binding.certified ? `the answer is clean, but binding "${binding.id}" has no CI certification — contrast and target size are unproven`
      : gapsUsed.length ? `${gapsUsed.map((g) => g.component).join(' and ')} cannot be given a name in this catalog, and the answer uses ${gapsUsed.length > 1 ? 'them' : 'it'}`
      : unannotated.length ? `${unannotated.length} rendered component(s) carry no accessibility semantics, so nothing was checked about them: ${unannotated.join(', ')}`
      : reviews.length ? `${reviews.length} thing(s) a person must judge`
      : binding.partial ? 'answer clean; binding proven for this configuration, not for every one'
      : 'answer clean, binding certified',
    findings,
    binding,
    unannotated,
    refused,
    catalogGaps: gaps,
    gapsUsed,
    unchecked: UNCHECKED,
    counted: { nodes: nodes.length, rules: RULES.length, annotated: nodes.length - nodes.filter(({ a }) => !a).length },
  }
}
