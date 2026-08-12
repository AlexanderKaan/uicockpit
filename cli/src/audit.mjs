/**
 * `uicockpit audit` — the retroactive layer.
 *
 * ── The reframe ──────────────────────────────────────────────────────────────
 * `audit` is `check` with an INVERTED reference.
 *
 *   check:  code ⟷ YOUR contract                → violations
 *   audit:  code ⟷ the contract your code IMPLIES → incoherence
 *
 * It derives the implicit design system out of a codebase and measures how far
 * that codebase sits from its own implicit system. So it works before anyone has
 * chosen a kit — which is the whole point: today the product starts at a default
 * kit and exports outward, and has no answer to "I'm not at the start."
 *
 * ── What it actually returns ─────────────────────────────────────────────────
 * Not a score — a **Config**. `genContract.ts` already says "The Config IS the
 * kit's identity", so finding the dominant value per dimension fills the knobs
 * in. The score then means something better than "how bad are you": it is *how
 * many of your design decisions your codebase can answer by itself*.
 *
 * ── Two rules that keep it credible ──────────────────────────────────────────
 * 1. **100% static.** No model anywhere in the score path. A score that returns
 *    36 on the second run is worthless as a shareable artefact and can never be
 *    a CI gate. Naming clusters is a v1.5 `--explain` job; counting never is.
 * 2. **Report coverage, never go quiet.** Under 70% parsed we refuse to score
 *    rather than publish a number over code we could not read. An audit that
 *    shouts 34/100 while skipping half the source dies the first time someone
 *    notices.
 *
 * `auditFiles()` is PURE over `{path, content}[]` — no Node imports — so the
 * browser shell (PR 3) can bundle it untouched. `runAudit()` is the Node shell.
 */
import {
  GRID, AUDIT_SCAN_EXT, AUDIT_SKIP_FILE,
  extractCss, extractClasses, extractInline, classAttrs,
  extractClassStyles, extractCssVars, resolveVar,
  cssModuleBindings, moduleClassAttrs, qualify, deepResolveVar, styledClassNames, walkElements,
  countUnreadable, countReadable, norm, TW_GRAY_RAMPS, UTILITY_RX, cssInJsBlocks,
} from './patterns.mjs'
import {
  METRIC, NEAR_DUPE_THRESHOLD, colorDistance, pxDistance, clusterNear, parseColor, toLab, deltaE00,
  resolvePalette, stripAlpha,
} from './colorspace.mjs'

/* ────────────────────────────── the constants ──────────────────────────────
 * REASONED, NOT YET MEASURED. The contract gives the ceiling and the order of
 * magnitude (a real shipped kit: 5 radii · 6 shadows · 9 type tiers · 13 spacing
 * steps · 62 distinct colour values); the budgets below are a deliberate
 * tightening for the internal-tool archetype — an admin panel does not need 62
 * colours. Calibrate against the with/without pairs under bench/runs before the
 * number goes anywhere public.
 * (NB: never write that glob with a star-slash inside a block comment — it ends
 * the comment early and the next word parses as code. It cost a run here.) */
export const BUDGETS = {
  internal: { color: 16, type: 8, spacing: 10, radius: 5, shadow: 5 },
  product: { color: 30, type: 12, spacing: 13, radius: 5, shadow: 6 },
}

/** Weights follow observed incoherence, not report readability: colour and type
 *  carry the most visual weight. Radius/shadow are the classic AI-slop tells and
 *  earn their keep in the smoking guns instead. */
export const WEIGHTS = { color: 0.25, type: 0.25, spacing: 0.20, radius: 0.15, shadow: 0.15 }

export const DIMENSIONS = ['color', 'type', 'spacing', 'radius', 'shadow']

/** 8× over budget scores 0 — past that, 20× and 40× are equally broken. */
const LOG_CEILING = Math.log2(8)

/** Coherence multiplies from 0.3 (none) to 1.0 (total). The floor is 0.3 and not
 *  0.6 deliberately: 31 greys that fall into 4 clusters get a fine cardinality
 *  and should still be punished hard. */
const COH_FLOOR = 0.3

/** Below this share of readable styled elements we refuse to score. */
export const MIN_PARSED = 0.70

/**
 * A dimension needs at least this many usage events before its score means
 * anything. Without it an ABSENCE of evidence scores as perfect coherence: a
 * repo on MUI/Ant (or any file that simply doesn't set shadows) has almost no
 * loose values, nEff lands at 0, and the curve happily returns 100 — the exact
 * "a design system the audit doesn't recognise scores clean" failure mode.
 * Under-supplied dimensions are reported as `insufficient` and DROPPED from the
 * weighted score, with the remaining weights renormalised.
 */
export const MIN_EVENTS = 12

/* ─────────────────────────────── the maths ─────────────────────────────────── */

/**
 * Effective variant count = perplexity of the usage distribution.
 *
 * Deliberately NOT a unique count: 8 radii where one is used 200× is nEff ≈ 1.3
 * (one system with noise); 8 radii used equally is nEff = 8 (eight systems).
 * And it is SCALE-FREE — multiply every count by 10 and nEff does not move,
 * which is the robustness-against-repo-size the whole design needs, delivered
 * mathematically instead of averaged away.
 */
export function effectiveCount(counts) {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  let H = 0
  for (const c of counts) {
    if (c <= 0) continue
    const p = c / total
    H -= p * Math.log(p)
  }
  return Math.exp(H)
}

/** Cardinality score: how far over budget, on a log curve. */
export function cardinalityScore(nEff, budget) {
  if (nEff === 0) return 100
  const r = Math.max(1, nEff / budget)
  return 100 * Math.max(0, 1 - Math.log2(r) / LOG_CEILING)
}

export function grade(score) {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

/* ─────────────────────────── layer A + B per dimension ─────────────────────── */

function tally(events) {
  const byValue = new Map()
  for (const e of events) {
    let entry = byValue.get(e.value)
    if (!entry) { entry = { value: e.value, count: 0, at: [] }; byValue.set(e.value, entry) }
    entry.count++
    if (entry.at.length < 25) entry.at.push(e.at) // cap: a codemod needs addresses, not all 4000
  }
  return [...byValue.values()].sort((a, b) => b.count - a.count)
}

/** Near-duplicates: values nobody MEANT to be different. Colour uses ΔE00 < 2;
 *  lengths < 1px; shadow blur < 2px. This is evidence, not opinion. */
function findNearDupes(dim, values, palette) {
  const names = values.map((v) => v.value)
  if (dim === 'color') return clusterNear(names, colorPairDistance(palette), NEAR_DUPE_THRESHOLD)
  if (dim === 'radius' || dim === 'spacing') return clusterNear(names, pxDistance, 1)
  if (dim === 'shadow') return clusterNear(names, blurDistance, 2)
  return []
}

/**
 * Colour distance for near-duplicate clustering — with one refusal built in.
 *
 * A translucent colour is NOT comparable: `emerald-500/10` renders as whatever
 * it sits on, and we do not know the backdrop. Resolving it to its base (which
 * is right for counting) makes it look identical to `emerald-500`, so a naive
 * comparison reports `emerald-500 · /10 · /20 · /30` as four near-duplicates.
 * They are one deliberate colour used at four opacities — the kind of false
 * positive that loses the first argument with a good engineer. So: if either
 * side carries an alpha modifier, we decline to judge.
 */
const hasAlpha = (v) => /\/[\d.]+%?$/.test(String(v))
const colorPairDistance = (palette) => (a, b) => {
  if (hasAlpha(a) || hasAlpha(b)) return null
  return colorDistance(a, b, palette)
}

/** Compare shadows on their blur radius — the perceptually dominant term. */
function blurDistance(a, b) {
  const blur = (s) => {
    const nums = String(s).match(/-?[\d.]+px/g)
    return nums && nums.length >= 3 ? parseFloat(nums[2]) : nums ? parseFloat(nums[nums.length - 1]) : null
  }
  const ba = blur(a), bb = blur(b)
  return ba !== null && bb !== null ? Math.abs(ba - bb) : null
}

function analyseDimension(dim, events, budget, palette) {
  const values = tally(events)
  const counts = values.map((v) => v.count)
  const total = counts.reduce((a, b) => a + b, 0)
  const nEff = effectiveCount(counts)
  const C = cardinalityScore(nEff, budget)

  // ── coherence: only these three signals may touch the score.
  const tokenised = total ? events.filter((e) => e.tokenized).length / total : 1

  const nearDupes = findNearDupes(dim, values, palette)
  const dupeValues = new Set(nearDupes.flat())
  const dupeMass = total ? events.filter((e) => dupeValues.has(e.value)).length / total : 0

  // Off-grid only means anything for spacing; elsewhere it is not part of the mix.
  let offGrid = null
  if (dim === 'spacing') {
    const px = events.filter((e) => /^-?[\d.]+px$/.test(e.value))
    const off = px.filter((e) => {
      const n = Math.abs(parseFloat(e.value))
      return n > 0 && n % GRID !== 0
    })
    offGrid = px.length ? off.length / px.length : 0
  }

  const parts = [tokenised, 1 - dupeMass]
  if (offGrid !== null) parts.push(1 - offGrid)
  const coherence = parts.reduce((a, b) => a + b, 0) / parts.length

  const score = C * (COH_FLOOR + (1 - COH_FLOOR) * coherence)
  const insufficient = total < MIN_EVENTS

  return {
    insufficient,
    events: total,
    distinct: values.length,
    nEff: round(nEff, 1),
    budget,
    cardinalityScore: round(C, 1),
    coherence: round(coherence, 3),
    tokenisedRate: round(tokenised, 3),
    offGridRate: offGrid === null ? null : round(offGrid, 3),
    nearDupeMass: round(dupeMass, 3),
    score: insufficient ? null : round(score, 1),
    grade: insufficient ? null : grade(score),
    values: values.slice(0, 200),
    // Reported, never scored — too sensitive to repo quirks to carry a number,
    // and it works better as a flat unarguable line in the report.
    singletons: values.filter((v) => v.count === 1).map((v) => v.value),
    nearDupes,
  }
}

const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d

/* ─────────────────────── layer C — component signatures ─────────────────────
 * "47 button variants" has a fatal comeback — "we NEED more than one" — and it
 * is correct: our own contract defines 16. So the measure is not the variant
 * count, it is whether the variants fall on AXES.
 *
 *   A design system is a PRODUCT of small axes.
 *   Drift is a SUM of one-off cases.
 *
 * 16 buttons = {primary, secondary, ghost, outline, danger, link} × {xs…xl}:
 * two axes, fully enumerable. 47 buttons that are each their own class soup is
 * 47 axes of length 1. Hence the line that actually converts:
 *   "47 button treatments — 31 occur exactly once."
 * Layer C NEVER enters the score. It is the conversion sentence, reported apart. */

/** Layout and positioning carry no style identity — drop them from signatures. */
const LAYOUT_RX = /^(flex|inline-flex|grid|inline-grid|block|inline|inline-block|hidden|table|contents|flow-root|list-item|absolute|relative|fixed|sticky|static|isolate|float-\w+|clear-\w+|items-|justify-|content-|self-|place-|order-|col-|row-|basis-|grow|shrink|w-|h-|min-w-|min-h-|max-w-|max-h-|top-|right-|bottom-|left-|inset-|z-|overflow-|object-|aspect-|container|mx-auto|space-[xy]-|divide-)/

const BUTTONISH = /<(button|a)\b([^>]*)>/gi
const INPUTISH = /<(input|select|textarea)\b([^>]*)>/gi

/**
 * Buttons that go through a COMPONENT rather than being hand-rolled.
 *
 * Measured on real code: shadcn-ui/ui has 80 raw `<button>` against 3,070
 * `<Button/>`; cal.com 98 against 536. Counting only raw elements meant the
 * headline artefact was reading a small minority of the buttons in any modern
 * React codebase — and then describing that minority as "134 button
 * treatments", a number the reader cannot reconcile with their own app.
 *
 * The fix is NOT to add component usages to the treatment count: 3,070 usages
 * of one component is not 3,070 treatments, it is the ABSENCE of sprawl. What
 * matters is the ratio between the two, because they describe opposite worlds —
 * a repo that routes every button through one component has already solved this,
 * and a repo where 112 of 134 treatments occur once has not.
 */
const COMPONENTISH = {
  button: /^(?:\w*Button|Btn|\w*Btn|IconButton|ToggleButton|SubmitButton|LinkButton|Cta)$/,
  input: /^(?:\w*Input|TextField|\w*Field|Textarea|TextArea|Select|Combobox|Checkbox|Radio|Switch|Toggle)$/,
  card: /^(?:\w*Card|Panel|Tile|Surface)$/,
}
/** Names that LOOK like the component but are containers or plurals. */
const NOT_A_CONTROL = /^(?:ButtonGroup|Buttons|InputGroup|Inputs|CardGroup|CardHeader|CardTitle|CardContent|CardFooter|CardDescription|FieldGroup|Fieldset|SelectGroup|SelectLabel|SelectContent|SelectItem|SelectTrigger|SelectValue|RadioGroup|CheckboxGroup|ToggleGroup)$/

/** Count `<Xxx …>` usages of control-like components, per kind. */
function countComponentUsages(content) {
  const found = { button: 0, input: 0, card: 0 }
  const names = { button: new Set(), input: new Set(), card: new Set() }
  for (const m of content.matchAll(/<([A-Z][\w.]*)[\s/>]/g)) {
    const name = m[1].split('.').pop()
    if (NOT_A_CONTROL.test(name)) continue
    for (const kind of Object.keys(COMPONENTISH)) {
      if (COMPONENTISH[kind].test(name)) { found[kind]++; names[kind].add(name); break }
    }
  }
  return { found, names }
}

function attrClasses(attrs, bindings = {}, path = '') {
  const m = attrs.match(/class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/)
  if (m) return (m[1] ?? m[2] ?? m[3] ?? '').split(/\s+/).filter(Boolean)
  // CSS-module binding: `<button className={styles.primary}>`. Without this the
  // wall silently under-reports — a 312-file app showed 4 button treatments.
  const expr = attrs.match(/class(?:Name)?\s*=\s*\{([^}]*)\}/)
  if (!expr) return null
  const found = moduleClassAttrs(path, `className={${expr[1]}}`, bindings)
  return found.length ? found[0].classes : null
}

/** Normalised style signature: style-bearing classes only, sorted, deduped.
 *  Case is folded for plain classes but PRESERVED for module-qualified ones —
 *  those carry a file path, and lower-casing it breaks the lookup that lets the
 *  report paint the swatch. */
function signature(classes) {
  const style = classes
    .map((c) => c.trim())
    .filter((c) => c && !LAYOUT_RX.test(c))
    .map((c) => (c.includes('#') ? c : c.toLowerCase()))
  return [...new Set(style)].sort().join(' ')
}

function collectComponents(files) {
  const kinds = {
    button: new Map(),
    input: new Map(),
    card: new Map(),
  }

  const record = (kind, sig, at) => {
    if (!sig) return
    let e = kinds[kind].get(sig)
    if (!e) { e = { sig, count: 0, at: [] }; kinds[kind].set(sig, e) }
    e.count++
    if (e.at.length < 25) e.at.push(at)
  }

  const lineAt = (content, idx) => content.slice(0, idx).split('\n').length
  const viaComponent = { button: 0, input: 0, card: 0 }
  const componentNames = { button: new Set(), input: new Set(), card: new Set() }

  for (const { path, content } of files) {
    if (/\.(css|scss|less)$/.test(path)) continue
    const bindings = cssModuleBindings(path, content)

    const usages = countComponentUsages(content)
    for (const kind of Object.keys(viaComponent)) {
      viaComponent[kind] += usages.found[kind]
      for (const n of usages.names[kind]) componentNames[kind].add(n)
    }

    for (const m of content.matchAll(BUTTONISH)) {
      const tag = m[1].toLowerCase()
      const attrs = m[2] || ''
      const cls = attrClasses(attrs, bindings, path)
      const isRoleButton = /role\s*=\s*["']button["']/.test(attrs)
      // An <a> only counts when it is styled LIKE a button (background + padding),
      // otherwise every link in the app pollutes the count.
      const looksButton = cls && cls.some((c) => /^bg-/.test(c)) && cls.some((c) => /^p[xytrbl]?-/.test(c))
      if (tag === 'button' || isRoleButton || (tag === 'a' && looksButton)) {
        record('button', signature(cls || []), { file: path, line: lineAt(content, m.index), col: 1 })
      }
    }

    for (const m of content.matchAll(INPUTISH)) {
      const cls = attrClasses(m[2] || '', bindings, path)
      record('input', signature(cls || []), { file: path, line: lineAt(content, m.index), col: 1 })
    }

    // Card-ish container: background + padding + (radius or border/shadow).
    for (const { classes, at } of classAttrs(path, content)) {
      const has = (rx) => classes.some((c) => rx.test(c))
      if (has(/^bg-/) && has(/^p[xytrbl]?-/) && (has(/^rounded/) || has(/^(border|shadow)/))) {
        record('card', signature(classes), at)
      }
    }
  }

  const out = {}
  for (const [kind, map] of Object.entries(kinds)) {
    const sigs = [...map.values()].sort((a, b) => b.count - a.count)
    const handRolled = sigs.reduce((a, s) => a + s.count, 0)
    const throughComponent = viaComponent[kind]
    const total = handRolled + throughComponent
    out[kind] = {
      // `treatments` counts DISTINCT hand-rolled signatures — the sprawl.
      treatments: sigs.length,
      singletons: sigs.filter((s) => s.count === 1).length,
      // …and these say how much of the codebase never hand-rolls at all.
      handRolled,
      throughComponent,
      componentNames: [...componentNames[kind]].sort().slice(0, 12),
      // The ratio IS the finding: high means this repo already solved it.
      componentShare: total ? round(throughComponent / total, 3) : null,
      signatures: sigs.slice(0, 100),
    }
  }
  return out
}

/* ────────────────────── relational coherence (sibling rows) ──────────────────
 * The failure this catches, in Alexander's words: a row of buttons at the top —
 * account on the left, sign-in on the right — where the two are not the same
 * height, because nothing in the codebase says they belong together.
 *
 * It is the first RELATIONAL check we have. Every other rule judges one value
 * against the contract; this one judges two siblings against each other, which
 * is the class of mistake a generator makes constantly and a per-value rule can
 * never see.
 *
 * Two deliberate restraints:
 *  · **Reported, never scored.** It rides on an approximate tag scanner and on
 *    a height model that cannot see every source of height. A number that can
 *    be wrong does not belong in a score that has to survive a CI gate.
 *  · **Declines to judge when it cannot read both sides.** Same rule as the
 *    translucent colours: if either sibling's height is unreadable, say nothing
 *    rather than guess. A false "your buttons don't line up" is far more
 *    expensive than a missed one.                                             */

/** Class utilities that decide how tall a control ends up. */
const HEIGHT_RX = /^(?:[\w-]+:)*(h|min-h|size|py|pt|pb|p|text|leading)-/
/** …and the CSS declarations that do the same job in a stylesheet. */
const HEIGHT_PROPS = ['padding', 'font-size', 'line-height']

/**
 * Only the VERTICAL half of a padding shorthand changes a control's height.
 * Comparing the whole string flagged `9px 16px` against `9px 18px` — identical
 * height, different width — which is exactly the false positive that would lose
 * the first argument about this feature.
 */
function verticalPadding(value) {
  const parts = String(value).trim().split(/\s+/)
  if (!parts.length) return null
  if (parts.length === 1) return parts[0]              // all sides
  if (parts.length === 2) return parts[0]              // vertical horizontal
  return `${parts[0]}/${parts[2] ?? parts[0]}`         // top / bottom
}

/** Is this element a control whose height a reader would expect to match? */
function controlKind(tag) {
  const t = tag.toLowerCase()
  if (t === 'button') return 'button'
  if (t === 'input' || t === 'select' || t === 'textarea') return 'input'
  if (/^[A-Z]/.test(tag) && !NOT_A_CONTROL.test(tag)) {
    for (const kind of ['button', 'input']) if (COMPONENTISH[kind].test(tag)) return kind
  }
  return null
}

/**
 * The height-determining facts we can read off this control, as a map.
 *
 * A MAP rather than a string, because two siblings may declare different
 * PROPERTIES rather than different values: if one sets `font-size: 14px` and
 * the other sets none, the second inherits something we cannot see, and calling
 * that a mismatch would be a guess. Comparison happens only on facets both
 * siblings actually declare.
 */
function heightFacets(el, classStyles, bindings, path) {
  const facets = {}

  const cls = attrClasses(el.attrs, bindings, path)
  if (cls) {
    for (const c of cls) {
      const bare = c.replace(/^(?:[\w-]+:)*/, '')
      const m = bare.match(HEIGHT_RX)
      if (m) facets[`class:${bare.split('-')[0]}`] = bare
    }
    for (const c of cls) {
      const decls = classStyles[c]
      if (!decls) continue
      for (const p of HEIGHT_PROPS) {
        if (!decls[p]) continue
        facets[p] = p === 'padding' ? verticalPadding(decls[p]) : decls[p]
      }
    }
  }

  // `<Button size="sm">` — a component's size prop IS its declared height.
  const size = el.attrs.match(/\bsize\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["']([^"']*)["']\s*\})/)
  if (size) facets.size = size[1] ?? size[2] ?? size[3]
  else if (/^[A-Z]/.test(el.tag)) facets.size = 'default'

  return Object.keys(facets).length ? facets : null
}

/** Compare siblings only where they all declare the same facet. */
function facetMismatch(all) {
  const common = Object.keys(all[0]).filter((k) => all.every((f) => k in f))
  if (!common.length) return null
  const differing = common.filter((k) => new Set(all.map((f) => f[k])).size > 1)
  return differing.length ? differing : null
}

/**
 * Find rows of sibling controls whose heights disagree.
 * @returns {{rows:number, mismatched:number, findings:object[]}}
 */
function findControlClusters(files, classStyles) {
  let rows = 0
  const findings = []

  for (const { path, content } of files) {
    if (/\.(css|scss|less)$/.test(path)) continue
    const bindings = cssModuleBindings(path, content)

    // Group controls by the element that contains them.
    const byParent = new Map()
    walkElements(content, (el) => {
      const kind = controlKind(el.tag)
      if (!kind || !el.parent) return
      if (!byParent.has(el.parent)) byParent.set(el.parent, [])
      byParent.get(el.parent).push({ el, kind })
    })

    for (const [parent, kids] of byParent) {
      for (const kind of ['button', 'input']) {
        const group = kids.filter((k) => k.kind === kind)
        if (group.length < 2) continue
        rows++

        const read = group.map((k) => ({
          tag: k.el.tag,
          line: k.el.line,
          facets: heightFacets(k.el, classStyles, bindings, path),
        }))
        // Decline unless every sibling's height is readable at all.
        if (read.some((r) => r.facets === null)) continue
        const differing = facetMismatch(read.map((r) => r.facets))
        if (!differing) continue

        findings.push({
          kind,
          file: path,
          line: parent.line,
          container: parent.tag,
          // Name WHICH facet disagrees — "these two buttons differ on padding"
          // is actionable; "these two buttons differ" is an accusation.
          differsOn: differing,
          controls: read.map((r) => ({
            tag: r.tag,
            line: r.line,
            height: differing.map((k) => `${k}:${r.facets[k]}`).join(' '),
          })),
        })
      }
    }
  }

  return { rows, mismatched: findings.length, findings: findings.slice(0, 50) }
}

/* ───────────────────────────── the smoking guns ─────────────────────────────
 * Binary findings, their own section, NEVER in the score. They convert better
 * than any number because they cannot be relativised. */

/* ──────────────────────────── what we detected ──────────────────────────────
 * Shown BEFORE the verdict, on purpose. A score arriving out of a black box is
 * just an assertion; a score arriving after "React · Tailwind v4 · 1,284
 * utilities across 15 files · 97% read" arrives once the reader has already
 * thought *that is exactly my codebase*. Recognition first, judgement second —
 * and it doubles as an honest disclosure of what the scan could and could not
 * see. Every number here is COUNTED, never inferred from a dependency alone: a
 * package.json entry proves an install, not a usage. */

const FRAMEWORKS = [
  [/^react$/, 'React'], [/^vue$/, 'Vue'], [/^svelte$/, 'Svelte'],
  [/^@angular\/core$/, 'Angular'], [/^solid-js$/, 'Solid'], [/^preact$/, 'Preact'],
]
const META_FRAMEWORKS = [
  [/^next$/, 'Next.js'], [/^nuxt$/, 'Nuxt'], [/^astro$/, 'Astro'],
  [/^@remix-run\/react$/, 'Remix'], [/^@sveltejs\/kit$/, 'SvelteKit'], [/^vite$/, 'Vite'],
]
const CSS_IN_JS = [
  ['styled-components', 'styled-components'], ['@emotion/styled', 'Emotion'],
  ['@stitches/react', 'Stitches'], ['@vanilla-extract/css', 'vanilla-extract'],
]
const COMPONENT_LIBS = ['@mui/material', 'antd', '@chakra-ui/react', '@mantine/core', 'react-bootstrap', '@radix-ui/themes']

const major = (range) => (String(range).match(/(\d+)/) || [])[1] || null

export function detectStack(files, pkg, counts) {
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) }
  const hit = (table) => {
    for (const [rx, name] of table) {
      const key = Object.keys(deps).find((d) => rx.test(d))
      if (key) return { name, version: major(deps[key]) }
    }
    return null
  }

  const byExt = {}
  for (const f of files) {
    const ext = (f.path.match(/\.(\w+)$/) || [, '?'])[1]
    byExt[ext] = (byExt[ext] || 0) + 1
  }

  const plural = (n, one, many = `${one}s`) => `${nf(n)} ${n === 1 ? one : many}`

  const styling = []
  const add = (kind, version, weight, detail) => styling.push({ kind, version, weight, detail })

  if (counts.utilities) add('Tailwind CSS', deps.tailwindcss ? major(deps.tailwindcss) : null, counts.utilities, plural(counts.utilities, 'utility class', 'utility classes'))
  if (counts.moduleFiles) add('CSS Modules', null, counts.moduleBindings, `${plural(counts.moduleFiles, 'module')}, ${plural(counts.moduleRules, 'rule')}, ${plural(counts.moduleBindings, 'binding')}`)
  if (counts.plainCssFiles) add('Plain CSS', null, counts.cssRules, `${plural(counts.plainCssFiles, 'file')}, ${plural(counts.cssRules, 'rule')}`)
  if (counts.inlineStyles) add('Inline styles', null, counts.inlineStyles, plural(counts.inlineStyles, 'declaration'))
  for (const [dep, label] of CSS_IN_JS) {
    if (!deps[dep]) continue
    add(label, null, counts.cssInJsBlocks || 1,
      counts.cssInJsBlocks ? plural(counts.cssInJsBlocks, 'styled block') : 'installed, none found')
  }

  // Sort by how much of the codebase actually uses it, and drop the trace
  // amounts. A dependency that is installed but barely used would otherwise be
  // announced as "your stack" — the fastest way to lose the reader's trust in
  // the very block that exists to earn it.
  styling.sort((a, b) => b.weight - a.weight)
  const dominant = styling.length ? styling[0].weight : 0
  const kept = styling.filter((s, i) => i === 0 || s.weight >= 10 || s.weight >= dominant * 0.02)

  return {
    framework: hit(FRAMEWORKS),
    meta: hit(META_FRAMEWORKS),
    typescript: Boolean(deps.typescript || byExt.tsx || byExt.ts),
    styling: kept,
    // A component library changes what "few loose values" MEANS. Say it out loud
    // rather than quietly scoring a themed repo as clean (AUDIT-HEURISTIC §7.1).
    componentLibraries: COMPONENT_LIBS.filter((d) => deps[d]),
    files: files.length,
    byExt,
  }
}

function smokingGuns(files, pkg, events) {
  const flags = []
  const paths = files.map((f) => f.path)

  if (pkg) {
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
    const iconLibs = Object.keys(deps).filter((d) =>
      /^(lucide-react|react-icons|@heroicons\/|@tabler\/icons|react-feather|@phosphor-icons\/|@radix-ui\/react-icons|iconoir-react|@fortawesome\/)/.test(d))
    if (iconLibs.length >= 2) flags.push({ id: 'multiple-icon-libs', severity: 'high', detail: iconLibs })

    const styleSystems = Object.keys(deps).filter((d) =>
      /^(tailwindcss|styled-components|@emotion\/styled|@stitches\/|sass|less|@vanilla-extract\/)/.test(d))
    if (styleSystems.length >= 2) flags.push({ id: 'multiple-styling-systems', severity: 'high', detail: styleSystems })

    const fontPkgs = Object.keys(deps).filter((d) => /^(@fontsource|next\/font)/.test(d))
    if (fontPkgs.length >= 2) flags.push({ id: 'multiple-font-packages', severity: 'low', detail: fontPkgs })
  }

  // Duplicate components: several Button.tsx / Card.tsx on different paths.
  const byBase = new Map()
  for (const p of paths) {
    const base = p.split(/[/\\]/).pop().replace(/\.\w+$/, '').toLowerCase()
    if (!/^(button|card|input|modal|dialog|badge|avatar|select)$/.test(base)) continue
    if (!byBase.has(base)) byBase.set(base, [])
    byBase.get(base).push(p)
  }
  const dupes = [...byBase.entries()].filter(([, v]) => v.length > 1)
  if (dupes.length) {
    flags.push({ id: 'duplicate-components', severity: 'high', detail: dupes.map(([k, v]) => `${k}: ${v.join(' · ')}`) })
  }

  // ≥3 Tailwind grey ramps side by side — extremely common in AI output and
  // immediately lethal in a report.
  const ramps = new Set()
  for (const e of events) {
    if (e.dim !== 'color') continue
    const m = String(e.value).match(/^(gray|slate|zinc|neutral|stone)-\d{2,3}$/)
    if (m) ramps.add(m[1])
  }
  if (ramps.size >= 3) flags.push({ id: 'mixed-gray-ramps', severity: 'high', detail: [...ramps] })

  // ≥2 non-mono font families.
  const fams = new Set()
  for (const { path, content } of files) {
    if (!/\.(css|scss|less)$/.test(path)) continue
    for (const m of content.matchAll(/font-family\s*:\s*([^;]+);/gi)) {
      const first = m[1].split(',')[0].trim().replace(/["']/g, '').toLowerCase()
      if (first && !/mono|courier|consolas|menlo|var\(/.test(first)) fams.add(first)
    }
  }
  if (fams.size >= 2) flags.push({ id: 'multiple-font-families', severity: 'medium', detail: [...fams] })

  return flags
}

/* ─────────────────────────── the hinge: inferredConfig ──────────────────────
 * The audit does not hand over a score, it hands over a Config — so the
 * configurator opens on the design system the app was already unconsciously
 * trying to be. `confidence: null` means no dominant value, i.e. nobody ever
 * decided this, so the questionnaire (PR 4) must ask. */

const THEME_ANCHORS = {
  mono: '#3b3b42', cobalt: '#0A84FF', sky: '#0EA5E9', teal: '#14B8A6', jade: '#10B981',
  ember: '#F97316', coral: '#EC4899', indigo: '#6366F1', violet: '#8B5CF6', rose: '#F43F5E',
}

/** The share the most-used value holds — our confidence that it was a decision. */
function dominance(values) {
  const total = values.reduce((a, v) => a + v.count, 0)
  if (!total || !values.length) return { value: null, share: null }
  return { value: values[0].value, share: values[0].count / total }
}

const px = (v) => {
  const m = String(v).match(/^(-?[\d.]+)(px|rem)?$/)
  if (!m) return null
  return m[2] === 'rem' ? parseFloat(m[1]) * 16 : parseFloat(m[1])
}

function inferConfig(dims, palette) {
  const values = {}
  const confidence = {}
  const MIN_DOMINANCE = 0.4 // below this, nobody decided anything

  // radius → Radius = 'none' | 'subtle' | 'soft' | 'round'
  const r = dominance(dims.radius.values)
  if (r.value && r.share >= MIN_DOMINANCE) {
    const n = px(r.value)
    values.radius = n === null ? 'soft' : n === 0 ? 'none' : n <= 5 ? 'subtle' : n <= 10 ? 'soft' : 'round'
    confidence.radius = round(r.share, 2)
  } else confidence.radius = null

  // shadow presence/softness → Elevation = 'flat' | 'soft' | 'sharp' | 'default'
  const shadowDistinct = dims.shadow.distinct
  if (dims.shadow.events === 0) { values.elevation = 'flat'; confidence.elevation = 1 }
  else {
    const s = dominance(dims.shadow.values)
    values.elevation = shadowDistinct <= 3 ? 'soft' : 'default'
    confidence.elevation = s.share ? round(s.share, 2) : null
  }

  // body font-size → TypeScale = 'sm' | 'md' | 'lg' | 'xl'
  const t = dominance(dims.type.values)
  if (t.value && t.share >= MIN_DOMINANCE) {
    const size = px(String(t.value).split('/')[0])
    values.typeScale = size === null ? 'md' : size <= 13 ? 'sm' : size <= 15 ? 'md' : size <= 17 ? 'lg' : 'xl'
    confidence.typeScale = round(t.share, 2)
  } else confidence.typeScale = null

  // spacing rhythm → Scale = 'compact' | 'default' | 'comfortable'
  const spacings = dims.spacing.values.map((v) => ({ n: px(v.value), c: v.count })).filter((x) => x.n)
  if (spacings.length) {
    const weighted = spacings.reduce((a, x) => a + x.n * x.c, 0) / spacings.reduce((a, x) => a + x.c, 0)
    values.scale = weighted <= 10 ? 'compact' : weighted <= 18 ? 'default' : 'comfortable'
    confidence.scale = round(Math.min(1, spacings.length / dims.spacing.distinct), 2)
  } else confidence.scale = null

  // dominant brand colour → nearest ColorTheme anchor by ΔE00
  const brand = pickBrandColor(dims.color.values, palette)
  if (brand) {
    let best = null
    for (const [name, hex] of Object.entries(THEME_ANCHORS)) {
      const d = colorDistance(brand.value, hex, palette)
      if (d !== null && (!best || d < best.d)) best = { name, d }
    }
    if (best) { values.colorTheme = best.name; confidence.colorTheme = round(brand.share, 2) }
  }
  if (!values.colorTheme) confidence.colorTheme = null

  return { values, confidence }
}

/** The brand colour is the most-used SATURATED colour — greys and near-whites
 *  are surface, not identity. */
function pickBrandColor(values, palette) {
  const total = values.reduce((a, v) => a + v.count, 0)
  for (const v of values) {
    const lab = toLab(v.value, palette)
    if (!lab) continue
    const chroma = Math.hypot(lab[1], lab[2])
    if (chroma > 25 && lab[0] > 15 && lab[0] < 92) return { value: v.value, share: v.count / total }
  }
  return null
}

/* ──────────────────────────────── the engine ───────────────────────────────── */

/**
 * Audit a set of files. PURE — no Node imports, no I/O, no clock.
 *
 * @param {{path:string, content:string}[]} files
 * @param {{profile?: 'internal'|'product', vocabulary?: object, pkg?: object}} [opts]
 */
export function auditFiles(files, opts = {}) {
  const profile = opts.profile === 'product' ? 'product' : 'internal'
  const budgets = BUDGETS[profile]
  const vocab = opts.vocabulary?.classes || {}
  const vocabVersion = opts.vocabulary?.vocabVersion || null

  const events = []
  let readable = 0
  const unreadable = {}
  const expressible = { recipe: 0, tokensOnly: 0, layout: 0, none: 0 }
  const elements = []
  const styledClasses = new Set()
  // Collected so the report can PAINT plain-CSS components instead of printing
  // their class names — the wall only converts if you can see the buttons.
  const classStyles = {}
  const cssVars = {}
  // Counted evidence for the detected-stack summary (never inferred from deps).
  const tally = { utilities: 0, moduleFiles: 0, moduleBindings: 0, moduleRules: 0, plainCssFiles: 0, cssRules: 0, inlineStyles: 0, cssInJsBlocks: 0 }

  const absorbCss = (path, css) => {
    events.push(...extractCss(path, css))
    Object.assign(cssVars, extractCssVars(css))
    // CSS Modules are file-scoped, so their classes are stored qualified —
    // `Card.module.css#title` — and never merged with an identically named
    // class from another module.
    const isModule = /\.module\.(css|scss|less)$/.test(path)
    for (const [cls, decls] of Object.entries(extractClassStyles(css))) {
      const key = isModule ? qualify(path, cls) : cls
      classStyles[key] = { ...(classStyles[key] || {}), ...decls }
    }
    for (const cls of styledClassNames(css)) styledClasses.add(isModule ? qualify(path, cls) : cls)
  }

  // ── Pass 1: stylesheets first. A component file can be walked before the
  // module it imports, so every class must be known before any element asks
  // whether the class it points at actually paints anything.
  for (const { path, content } of files) {
    if (!/\.(css|scss|less)$/.test(path)) continue
    const rules = countReadable(path, content)
    readable += rules
    // Attribute rules to the idiom that owns them, or "9 plain CSS files" ends
    // up reporting a rule count that includes every CSS module.
    if (/\.module\.(css|scss|less)$/.test(path)) { tally.moduleFiles++; tally.moduleRules += rules }
    else { tally.plainCssFiles++; tally.cssRules += rules }
    for (const [k, n] of Object.entries(countUnreadable(path, content))) {
      unreadable[k] = (unreadable[k] || 0) + n
    }
    absorbCss(path, content)
  }

  // ── Pass 2: everything that carries markup.
  for (const { path, content } of files) {
    if (/\.(css|scss|less)$/.test(path)) continue

    // Elements styled through a CSS-module binding are READABLE: their values
    // live in the .module.css we scanned. Counting them as a blind spot is what
    // pushed a real repo to 72% coverage and nearly triggered a false refusal.
    const bindings = cssModuleBindings(path, content)
    const moduleEls = moduleClassAttrs(path, content, bindings)

    readable += countReadable(path, content, moduleEls.length)
    for (const [k, n] of Object.entries(countUnreadable(path, content, moduleEls.length))) {
      unreadable[k] = (unreadable[k] || 0) + n
    }

    tally.moduleBindings += moduleEls.length

    // Every styled element is collected now and BUCKETED LATER — an element's
    // styling may live in a stylesheet the walker has not reached yet, and for
    // a CSS/SCSS codebase that stylesheet is where all of it lives.
    for (const { classes, at } of classAttrs(path, content)) {
      const evs = extractClasses(classes, at)
      events.push(...evs)
      for (const c of classes) if (UTILITY_RX.test(c)) tally.utilities++
      elements.push({ classes, valueCarrying: evs.length > 0 })
    }
    for (const { classes } of moduleEls) elements.push({ classes, valueCarrying: false })

    // CSS-in-JS: the template body IS css once interpolations are rewritten, so
    // it goes through the same extractor as a stylesheet. A theme path becomes a
    // var()-shaped token reference, which is what it actually is.
    const cssInJs = cssInJsBlocks(content)
    for (const css of cssInJs) absorbCss(path, css)
    if (cssInJs.length) {
      tally.cssInJsBlocks += cssInJs.length
      readable += cssInJs.length
    }

    const inline = extractInline(path, content)
    tally.inlineStyles += inline.length
    events.push(...inline)
    // HTML files also carry CSS-ish styling in <style> blocks.
    for (const m of content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) absorbCss(path, m[1])
  }

  /* ── expressibility, decided once every stylesheet has been read ────────────
   * The question §9 needs answered is "can this vocabulary say what this element
   * is doing" — NOT "does this element's class attribute happen to carry values".
   * The first version asked the second question, so any CSS or SCSS codebase came
   * back at ~100% `none` regardless of what it actually rendered: Excalidraw
   * scored 99% and it looked like beautiful evidence for the chrome-vs-canvas
   * thesis, when it was only measuring that the values live in a stylesheet.
   * An instrument that returns the desired answer for the wrong reason is worse
   * than no instrument.
   *
   * So an element is judged on the styling that REACHES it, wherever authored:
   *   recipe     — a class root the kit already has a component for
   *   tokensOnly — bespoke, but it paints (colour · type · spacing · radius ·
   *                shadow · border) and every one of those is token-expressible
   *   none       — styled, yet nothing our vocabulary can express: pure layout,
   *                transforms, cursors, canvas positioning
   * That last bucket is now a real reading of the chrome/canvas line rather than
   * a restatement of which file the CSS sits in. */
  const rootOf = (c) => c.split('#').pop().split('--')[0].split('__')[0].replace(/^.*:/, '')
  for (const el of elements) {
    const hasRecipe = el.classes.some((c) => Object.prototype.hasOwnProperty.call(vocab, rootOf(c)))
    const painted = el.valueCarrying
      || el.classes.some((c) => classStyles[c] && Object.keys(classStyles[c]).length)
    if (hasRecipe) { expressible.recipe++; continue }
    if (painted) { expressible.tokensOnly++; continue }
    // Styled somewhere, but in ways no token can say — transforms, cursors,
    // clip-paths, canvas positioning. THIS is the §9 signal.
    if (el.classes.some((c) => styledClasses.has(c))) { expressible.none++; continue }
    // Never styled at all: a flex wrapper is structure, not a failure of our
    // vocabulary, and lumping it in with the canvas case inflates `none` by
    // 20-40% on any normal React app.
    expressible.layout++
  }

  // Collapse token chains now that every definition has been seen. Done as a
  // post-pass on purpose: a custom property is regularly defined in a file the
  // walker reaches after the one that uses it.
  for (const e of events) {
    if (typeof e.value === 'string' && e.value.startsWith('--')) {
      const literal = deepResolveVar(e.value, cssVars)
      if (literal !== e.value) e.value = norm(literal)
    }
  }

  // The palette the repo actually uses: its own @theme / :root overrides beat the
  // Tailwind build installed alongside it, which beats our grey ramps. Derived,
  // never shipped as a table — so it is always this repo's real palette and it
  // cannot rot when Tailwind changes its defaults.
  const palette = resolvePalette(cssVars, opts.palette || {})

  // Flatten var() once, so the report never has to know about the cascade.
  const resolvedStyles = {}
  for (const [cls, decls] of Object.entries(classStyles)) {
    const flat = {}
    for (const [p, v] of Object.entries(decls)) flat[p] = resolveVar(v, cssVars)
    resolvedStyles[cls] = flat
  }

  const unreadableTotal = Object.values(unreadable).reduce((a, b) => a + b, 0)
  const styledElements = readable + unreadableTotal
  const parsed = styledElements ? readable / styledElements : 1

  const dimensions = {}
  for (const dim of DIMENSIONS) {
    dimensions[dim] = analyseDimension(dim, events.filter((e) => e.dim === dim), budgets[dim], palette)
  }

  // Only dimensions with enough evidence may move the number; the rest are
  // reported as insufficient and their weight is redistributed, so "we found
  // nothing here" can never be mistaken for "this is perfect".
  const scored = DIMENSIONS.filter((d) => !dimensions[d].insufficient)
  const weightSum = scored.reduce((a, d) => a + WEIGHTS[d], 0)
  const score = weightSum
    ? scored.reduce((a, d) => a + WEIGHTS[d] * dimensions[d].score, 0) / weightSum
    : null

  const expressibleTotal = expressible.recipe + expressible.tokensOnly + expressible.layout + expressible.none
  const share = (n) => (expressibleTotal ? round(n / expressibleTotal, 3) : null)

  const result = {
    meta: {
      files: files.length,
      elements: styledElements,
      profile,
      // Recognition before judgement — see detectStack().
      stack: detectStack(files, opts.pkg, tally),
      parsed: round(parsed, 3),
      unreadable,
      // parsed = "could I read it" (a scanner problem).
      // expressible = "can my vocabulary even say this" (a product question —
      // the biggest open one in the plan; this field is how it gets answered
      // with data instead of opinion). Low expressible is a FINDING, not a fault.
      expressible: {
        recipe: share(expressible.recipe),
        tokensOnly: share(expressible.tokensOnly),
        layout: share(expressible.layout),
        none: share(expressible.none),
        counts: { ...expressible },
      },
      vocabVersion,
      nearDupeMetric: { color: METRIC, threshold: NEAR_DUPE_THRESHOLD, length: 'px', lengthThreshold: 1, shadow: 'blur-px', shadowThreshold: 2 },
    },
    score: score === null ? null : round(score, 0),
    grade: score === null ? null : grade(score),
    scoredDimensions: scored,
    insufficientDimensions: DIMENSIONS.filter((d) => dimensions[d].insufficient),
    refused: parsed < MIN_PARSED || score === null,
    dimensions,
    components: collectComponents(files),
    // Not part of the measurement — purely so the report can render a real
    // swatch for a class-based component instead of quoting its class list.
    classStyles: resolvedStyles,
    // The first RELATIONAL finding: sibling controls whose heights disagree.
    // Reported, never scored — see findControlClusters().
    clusters: findControlClusters(files, resolvedStyles),
    // Only the entries this codebase actually uses, so `--json` stays readable
    // instead of carrying a few hundred palette rows nobody referenced.
    palette: Object.fromEntries(
      dimensions.color.values
        .map((v) => [stripAlpha(v.value), palette[stripAlpha(v.value)]])
        .filter(([, hex]) => hex),
    ),
    flags: smokingGuns(files, opts.pkg, events),
    // Emitted but unused in PR 1 — it is the hinge to the configurator (PR 4),
    // and computing it now is cheaper than a second pass later.
    inferredConfig: inferConfig(dimensions, palette),
  }

  if (result.refused) {
    result.score = null
    result.grade = null
    result.refusal = parsed < MIN_PARSED
      ? `Only ${Math.round(parsed * 100)}% of styled elements could be read (minimum ${Math.round(MIN_PARSED * 100)}%). Scoring code we could not read would be contestable, so no score is given.`
      : `Too little styling to measure — every dimension is under ${MIN_EVENTS} usage events. This is not a clean bill of health; it means the values live somewhere this scan cannot see (a component library, a theme file, or another stack).`
  }

  return result
}

/* ─────────────────────── arbitrary + ramp signals (reported) ───────────────── */

/** Share of Tailwind utilities written as arbitrary values. Every one is a
 *  DELIBERATE step outside the system — the cheapest strong signal we have. */
export function arbitraryRate(files) {
  let total = 0, arbitrary = 0
  for (const { path, content } of files) {
    if (/\.(css|scss|less)$/.test(path)) continue
    for (const { classes } of classAttrs(path, content)) {
      for (const c of classes) {
        total++
        if (/-\[[^\]]+\]$/.test(c)) arbitrary++
      }
    }
  }
  return { total, arbitrary, rate: total ? round(arbitrary / total, 3) : 0 }
}

export { GRID, AUDIT_SCAN_EXT, AUDIT_SKIP_FILE, TW_GRAY_RAMPS, norm, parseColor, deltaE00 }

/* ────────────────────────────── terminal output ─────────────────────────────
 * MAX 15 LINES. The viral unit is a screenshot, not a scroll buffer — anything
 * that does not fit does not belong. No tips, no call to action, no sell: every
 * sales line makes it less shareable. The number does the work. */

const LABEL = { color: 'Colour', type: 'Type', spacing: 'Spacing', radius: 'Radius', shadow: 'Shadow' }

const pct = (n) => `${Math.round(n * 100)}%`
const nf = (n) => n.toLocaleString('en-US')

/** Soft-wrap a sentence so the refusal stays inside the 15-line frame. */
function wrap(text, width) {
  const out = []
  let line = ''
  for (const word of String(text).split(/\s+/)) {
    if (line && (line + ' ' + word).length > width) { out.push(line); line = word }
    else line = line ? `${line} ${word}` : word
  }
  if (line) out.push(line)
  return out
}

/**
 * The button sentence, told honestly for both worlds.
 *
 * A repo where 3,070 of 3,150 buttons go through one component has SOLVED
 * sprawl — the handful of hand-rolled leftovers are a footnote, not a verdict.
 * A repo where 112 of 134 treatments occur exactly once has not. Reporting only
 * the hand-rolled count describes those two with the same sentence.
 */
export function buttonLine(b) {
  if (!b || (!b.treatments && !b.throughComponent)) return ''
  const share = b.componentShare
  const sprawl = b.treatments
    ? `${nf(b.treatments)} hand-rolled button treatment${b.treatments === 1 ? '' : 's'}${b.singletons ? `, ${nf(b.singletons)} used once` : ''}`
    : 'no hand-rolled buttons'
  if (share !== null && b.throughComponent) {
    return `  ${sprawl} · ${pct(share)} of buttons go through a component`
  }
  return `  ${sprawl}`
}

/** One line of "this is your codebase" — the recognition beat before the verdict. */
export function stackLine(stack) {
  const bits = []
  if (stack.framework) bits.push(stack.framework.name + (stack.framework.version ? ` ${stack.framework.version}` : ''))
  if (stack.meta) bits.push(stack.meta.name)
  if (stack.typescript) bits.push('TypeScript')
  for (const s of stack.styling.slice(0, 3)) {
    bits.push(s.version ? `${s.kind} v${s.version}` : s.kind)
  }
  for (const lib of stack.componentLibraries) bits.push(lib)
  return bits.join(' · ')
}

export function renderTerminal(r, { reportPath = null } = {}) {
  const L = []
  const s = r.meta.stack
  L.push(`  uicockpit audit — ${nf(r.meta.files)} files · ${nf(r.meta.elements)} styled elements · ${pct(r.meta.parsed)} read`)
  const line = stackLine(s)
  if (line) L.push(`  ${line}`)
  const detail = s.styling.map((x) => x.detail).filter(Boolean).slice(0, 2).join(' · ')
  if (detail) L.push(`  ${detail}`)
  L.push('')

  if (r.refused) {
    L.push('  No score')
    L.push('')
    for (const line of wrap(r.refusal, 76)) L.push(`  ${line}`)
    const un = Object.entries(r.meta.unreadable)
    if (un.length) {
      L.push('')
      L.push(`  Unreadable: ${un.map(([k, n]) => `${n} ${k}`).join(' · ')}`)
    }
    return L.join('\n')
  }

  const filled = Math.round(r.score / 10)
  L.push(`  Consistency score   ${r.score}/100          ${'█'.repeat(filled)}${'░'.repeat(10 - filled)}`)
  L.push('')

  for (const dim of DIMENSIONS) {
    const d = r.dimensions[dim]
    if (d.insufficient) {
      L.push(`  ${LABEL[dim].padEnd(9)} –  ${String(d.events).padStart(5)} uses — too few to score`)
      continue
    }
    // The column is N_eff, and the label must carry that. Raw count and
    // effective count under one heading is exactly the confusion the whole
    // measurement principle exists to remove: 23 shadows with 18 singletons
    // means the mass sits on a handful of values, so nEff ≈ 10, not 23.
    const head = `  ${LABEL[dim].padEnd(9)} ${d.grade}  ${String(d.nEff).padStart(5)} eff. (budget ${d.budget})`
    const notes = []
    if (d.nearDupes.length) notes.push(`${d.distinct} values, ${d.nearDupes.flat().length} near-dupes`)
    else if (d.distinct) notes.push(`${d.distinct} values`)
    if (d.tokenisedRate < 0.9) notes.push(`${pct(1 - d.tokenisedRate)} hardcoded`)
    if (d.offGridRate) notes.push(`${pct(d.offGridRate)} off-grid`)
    const singles = d.singletons.length
    if (singles > 2) notes.push(`${singles} occur once`)
    L.push(notes.length ? `${head.padEnd(46)}·  ${notes.slice(0, 2).join(', ')}` : head)
  }
  L.push('')

  // The number that converts is not the score — it is the singleton rate. But
  // say WHICH buttons: "134 button treatments" over a codebase that routes
  // everything through <Button/> is a number the reader cannot reconcile with
  // their own app, and that is how a report loses its credibility.
  L.push(buttonLine(r.components.button))

  // The first relational finding — the one a per-value rule can never see.
  const cl = r.clusters
  if (cl && cl.mismatched) {
    L.push(`  ${nf(cl.mismatched)} of ${nf(cl.rows)} control rows have siblings at different heights`)
  }

  const guns = []
  for (const f of r.flags) {
    if (f.id === 'multiple-icon-libs') guns.push(`${f.detail.length} icon libraries`)
    if (f.id === 'mixed-gray-ramps') guns.push(`${f.detail.length} grey ramps`)
    if (f.id === 'duplicate-components') guns.push(`${f.detail.length} duplicated components`)
    if (f.id === 'multiple-styling-systems') guns.push(`${f.detail.length} styling systems`)
    if (f.id === 'multiple-font-families') guns.push(`${f.detail.length} font families`)
  }
  if (guns.length) L.push(`  ${guns.join(' · ')}`)

  if (r.meta.parsed < 1) {
    L.push(`  Unread: ${Object.entries(r.meta.unreadable).map(([k, n]) => `${n} ${k}`).join(' · ')}`)
  }
  if (reportPath) {
    L.push('')
    L.push(`  Report → ${reportPath}`)
  }
  return L.join('\n')
}

/* ─────────────────────────────── the CLI shell ─────────────────────────────── */

/**
 * Read the colour palette from the Tailwind build installed in the repo under
 * audit. Node-only, best-effort: a repo with no dependencies installed simply
 * gets fewer resolved colours, and the report says so rather than pretending.
 *
 * We read the INSTALLED copy rather than shipping our own table, so the numbers
 * are that repo's real palette — including its version — and so a hand-typed
 * table can never silently drift from what the project actually renders.
 */
async function loadInstalledPalette(fs, pathMod, dir) {
  const roots = [dir, '.']
  const out = {}

  for (const root of roots) {
    // Tailwind v4 — the whole palette lives in theme.css as `--color-*`.
    const themeCss = pathMod.join(root, 'node_modules', 'tailwindcss', 'theme.css')
    try {
      if (fs.existsSync(themeCss)) {
        const css = fs.readFileSync(themeCss, 'utf8')
        for (const m of css.matchAll(/--color-([\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim()
        if (Object.keys(out).length) return out
      }
    } catch { /* unreadable → fall through */ }

    // Tailwind v3 — colors.js exports nested { hue: { shade: hex } }.
    for (const rel of [['node_modules', 'tailwindcss', 'colors.js'], ['node_modules', 'tailwindcss', 'lib', 'public', 'colors.js']]) {
      const p = pathMod.join(root, ...rel)
      try {
        if (!fs.existsSync(p)) continue
        const mod = await import(`file://${pathMod.resolve(p)}`)
        const colors = mod.default ?? mod
        for (const [hue, val] of Object.entries(colors)) {
          if (typeof val === 'string') out[hue] = val
          else if (val && typeof val === 'object') {
            for (const [shade, hex] of Object.entries(val)) {
              if (typeof hex === 'string') out[`${hue}-${shade}`] = hex
            }
          }
        }
        if (Object.keys(out).length) return out
      } catch { /* not importable → fall through */ }
    }
  }
  return out
}

/**
 * Discover files under `dir`, audit them, print (or emit JSON).
 * Node-only; the pure engine above stays importable in a browser bundle.
 *
 * Exit codes: 0 = audited · 2 = setup error / refused for coverage.
 */
export async function runAudit(argv = []) {
  const fs = await import('node:fs')
  const pathMod = await import('node:path')

  const args = argv.filter((a) => !a.startsWith('-'))
  const flag = (name) => argv.some((a) => a === `--${name}` || a.startsWith(`--${name}=`))
  const flagVal = (name, dflt) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`))
    return hit ? hit.slice(name.length + 3) : dflt
  }

  const dir = args[0] || '.'
  const profile = flagVal('profile', 'internal')
  const asJson = flag('json')
  const wantReport = !flag('no-report')

  if (!fs.existsSync(dir)) {
    console.error(`uicockpit audit: no such directory: ${dir}`)
    return 2
  }

  const SKIP_DIR = /(^|[/\\])(node_modules|\.git|dist|build|\.next|out|coverage|\.uicockpit)([/\\]|$)/
  const files = []
  const walk = (d) => {
    let entries
    try { entries = fs.readdirSync(d, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      const p = pathMod.join(d, e.name)
      if (e.isDirectory()) { if (!SKIP_DIR.test(p)) walk(p); continue }
      if (!AUDIT_SCAN_EXT.test(e.name) || AUDIT_SKIP_FILE.test(p)) continue
      try {
        const content = fs.readFileSync(p, 'utf8')
        files.push({ path: pathMod.relative(dir, p) || e.name, content })
      } catch { /* unreadable file — skip, it can't carry style either */ }
    }
  }
  walk(dir)

  if (!files.length) {
    console.error(`uicockpit audit: no scannable files under ${dir}`)
    return 2
  }

  // The kit vocabulary that powers `expressible` — shipped with the package, so
  // the audit works on a codebase that has no kit yet (which is the whole point).
  let vocabulary = null
  try {
    vocabulary = JSON.parse(fs.readFileSync(new URL('./vocabulary.json', import.meta.url), 'utf8'))
  } catch { /* absent → expressible.recipe simply stays 0 */ }

  let pkg = null
  for (const c of [pathMod.join(dir, 'package.json'), 'package.json']) {
    try { if (fs.existsSync(c)) { pkg = JSON.parse(fs.readFileSync(c, 'utf8')); break } } catch { /* malformed */ }
  }

  const palette = await loadInstalledPalette(fs, pathMod, dir)

  const result = auditFiles(files, { profile, vocabulary, pkg, palette })
  result.meta.arbitrary = arbitraryRate(files)

  let reportPath = null
  if (wantReport && !result.refused) {
    const { renderReport } = await import('./report.mjs')
    const outDir = pathMod.join(dir, '.uicockpit')
    try {
      fs.mkdirSync(outDir, { recursive: true })
      reportPath = pathMod.join(outDir, 'audit.html')
      fs.writeFileSync(reportPath, renderReport(result))
    } catch { reportPath = null }
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2))
    return result.refused ? 2 : 0
  }

  console.log(renderTerminal(result, { reportPath }))
  return result.refused ? 2 : 0
}
