/**
 * check() — the conformance verdict on ONE answer.
 *
 * The architecture that makes this honest, and that took a while to see:
 * accessibility of a generated answer splits in two, and only one half is
 * per-answer.
 *
 *   · THE BINDING is certified ONCE, in CI: does this renderer paint enough
 *     contrast, big enough targets, a visible focus ring, at every theme and
 *     density? That is a property of the implementation and the tokens, not of
 *     what the agent asked for — so measuring it per answer is waste, and
 *     claiming it per answer without measuring is a lie.
 *
 *   · THE ANSWER is checked EVERY time, here: did the agent ask for something
 *     that cannot be accessible whatever the binding does — a table with no
 *     column headers, a control with no name, headings that skip a level, two
 *     primary buttons, a link that says "read more" and nothing else.
 *
 * This half runs on the TREE, not the markup, so it holds for every binding —
 * shadcn, our kit, Flutter, SwiftUI. Zero dependencies, microseconds, safe to
 * run on every answer in production.
 *
 * And the guard we carry over from the audit: NEVER score an unmeasured thing
 * as passing. What a machine cannot judge is returned as `unchecked`, by name.
 */

/** WCAG criteria this file actually tests. Anything not here is not claimed. */
export const RULES = [
  {
    id: 'heading-order', sc: '1.3.1', level: 'A', severity: 'fail',
    describe: 'Headings go down one level at a time.',
    run(nodes) {
      const out = []
      let prev = 0
      for (const n of nodes) {
        if (n.component !== 'Heading' && n.component !== 'Text') continue
        const lvl = n.level ?? (n.component === 'Heading' ? 2 : 0)
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
      return nodes.filter((n) => ['Button', 'TextField', 'CheckBox', 'Slider', 'ChoicePicker'].includes(n.component))
        .filter((n) => !hasText(n.label) && !hasText(n.text) && !n.kids?.some((k) => hasText(k.text)))
        .map((n) => ({ id: n.id, message: `${n.component} has no label, text or child text` }))
    },
  },
  {
    id: 'table-has-headers', sc: '1.3.1', level: 'A', severity: 'fail',
    describe: 'A table declares its column headers.',
    run(nodes) {
      return nodes.filter((n) => n.component === 'Table')
        .filter((n) => !Array.isArray(n.columns) || n.columns.length === 0)
        .map((n) => ({ id: n.id, message: 'Table has no columns — a screen reader gets an unlabelled grid' }))
    },
  },
  {
    id: 'field-has-label', sc: '3.3.2', level: 'A', severity: 'fail',
    describe: 'Every input carries a label, not only a placeholder.',
    run(nodes) {
      return nodes.filter((n) => n.component === 'TextField' || n.component === 'DateTimeInput')
        .filter((n) => !hasText(n.label))
        .map((n) => ({ id: n.id, message: `${n.component} has a placeholder but no label` }))
    },
  },
  {
    id: 'image-has-alt', sc: '1.1.1', level: 'A', severity: 'fail',
    describe: 'Every image carries a text alternative (or is marked decorative).',
    run(nodes) {
      return nodes.filter((n) => ['Image', 'Figure', 'Video'].includes(n.component))
        .filter((n) => !hasText(n.alt) && n.decorative !== true)
        .map((n) => ({ id: n.id, message: `${n.component} has no alt and is not marked decorative` }))
    },
  },
  {
    id: 'link-purpose', sc: '2.4.4', level: 'A', severity: 'review',
    describe: 'Link text says where it goes.',
    run(nodes) {
      const vague = /^(read more|more|click here|here|learn more|details|link)\.?$/i
      return nodes.filter((n) => n.component === 'Link' || (n.component === 'Button' && n.href))
        .filter((n) => vague.test(String(literal(n.text) ?? literal(n.label) ?? '').trim()))
        .map((n) => ({ id: n.id, message: `link text "${literal(n.text) ?? literal(n.label)}" does not say where it goes` }))
    },
  },
  {
    id: 'one-primary', sc: null, level: 'craft', severity: 'review',
    describe: 'One primary action per answer — the composition rule, not a WCAG criterion.',
    run(nodes) {
      const primary = nodes.filter((n) => n.component === 'Button' && (n.variant ?? 'primary') === 'primary')
      return primary.length > 1
        ? [{ id: primary.map((n) => n.id).join(', '), message: `${primary.length} primary buttons — the reader cannot tell which is the action` }]
        : []
    },
  },
  {
    id: 'status-not-colour-only', sc: '1.4.1', level: 'A', severity: 'review',
    describe: 'A status is carried by words, not only by a colour.',
    run(nodes) {
      return nodes.filter((n) => n.component === 'TaskList')
        .flatMap((n) => (Array.isArray(n.resolvedItems) ? n.resolvedItems : [])
          .filter((it) => it.tone && !hasText(it.status))
          .map((it) => ({ id: n.id, message: `an item has tone "${it.tone}" but no status word` })))
    },
  },
]

/** What no machine can judge — returned by name, never counted as passing. */
export const UNCHECKED = [
  { sc: '1.1.1', what: 'whether the alt text describes the image (only that it exists)' },
  { sc: '2.4.6', what: 'whether a heading describes the section under it' },
  { sc: '3.3.3', what: 'whether an error message says how to fix the error' },
  { sc: '3.1.1', what: 'whether the language of the answer matches the page' },
  { sc: '1.4.3', what: 'painted contrast — certified per BINDING in CI, not per answer' },
  { sc: '2.5.8', what: 'target size — certified per BINDING in CI, not per answer' },
]

const literal = (v) => (v && typeof v === 'object' ? (typeof v.path === 'string' ? `«${v.path}»` : null) : v)
const hasText = (v) => v != null && (typeof v === 'object' || String(v).trim() !== '')

function flatten(node, acc = []) {
  acc.push(node)
  for (const k of node.kids ?? []) flatten(k, acc)
  return acc
}

/**
 * @param tree      the resolved component tree (from buildTree)
 * @param opts.binding  { id, certified: boolean, report?: string } — what CI proved
 */
export function check(tree, opts = {}) {
  const nodes = flatten(tree)
  const findings = []
  for (const rule of RULES) {
    for (const hit of rule.run(nodes)) {
      findings.push({ rule: rule.id, sc: rule.sc, level: rule.level, severity: rule.severity, ...hit })
    }
  }
  const fails = findings.filter((f) => f.severity === 'fail')
  const reviews = findings.filter((f) => f.severity === 'review')
  const binding = opts.binding ?? { id: 'unknown', certified: false }

  return {
    verdict: fails.length ? 'fail' : !binding.certified ? 'unverified' : reviews.length ? 'needs-review' : 'AA',
    why: fails.length
      ? `${fails.length} answer-level failure(s)`
      : !binding.certified
        ? `the answer is clean, but binding "${binding.id}" has no CI certification — contrast and target size are unproven`
        : reviews.length
          ? `${reviews.length} thing(s) a person must judge`
          : 'answer clean, binding certified',
    findings,
    binding,
    unchecked: UNCHECKED,
    counted: { nodes: nodes.length, rules: RULES.length },
  }
}
