import { RECIPES } from './recipes'
import { APG_PATTERNS, APG_NOT_APPLICABLE, type ApgPattern } from './apg'

/**
 * The component explainer — parts · states · behaviours · accessibility · tests.
 *
 * Open UI specifies every control under those five headings, and it is a
 * stricter shape than most design systems document to. The fifth is the one
 * almost nobody ships: a claim about behaviour with the tests that hold it up.
 * We already have the tests, so the heading costs us nothing but honesty.
 *
 * The design constraint is maintenance. Five hand-written sections across 76
 * components is a documentation project, and documentation projects rot — the
 * text drifts from the CSS and then quietly lies. So parts and states are
 * DERIVED from the recipe's own CSS and re-derived on every build: they cannot
 * disagree with what ships, because they are read out of it.
 *
 * What cannot be derived is behaviour. No amount of reading a stylesheet tells
 * you that Left/Right must move between tabs while Tab leaves the tablist —
 * that is normative, it comes from WAI-ARIA APG, and it lives in `apg.ts` as
 * data with a citation.
 */

export interface Explainer {
  id: string
  /** The BEM block this recipe owns, read from its own CSS. */
  block: string | null
  /** `block__part` classes, in authored order. */
  parts: string[]
  /** Variants and states: modifiers, ARIA attribute selectors, relevant pseudo-classes. */
  states: string[]
  /** The normative behaviour contract, or null when the pattern genuinely has none. */
  apg: ApgPattern | null
  /** Why there is no pattern, when that is a decision rather than an omission. */
  apgNote: string | null
  /** Which of our gates actually exercise this component. */
  tests: string[]
}

/** Pseudo-classes that describe a STATE rather than a layout detail. */
const STATEFUL = [
  'hover', 'focus-visible', 'focus-within', 'active', 'disabled', 'checked',
  'indeterminate', 'open', 'popover-open', 'user-invalid', 'placeholder-shown',
] as const

/**
 * The block a recipe owns.
 *
 * Read as the most frequently declared root class, because recipes legitimately
 * reference OTHER blocks (the dialog recipe touches `.card__foot`) and a naive
 * "first class wins" would hand `dialog` the parts of `card`. Frequency is a
 * blunt instrument but it is right for the case that matters: the block a recipe
 * defines is the one it mentions most.
 */
function blockOf(css: string): string | null {
  const counts = new Map<string, number>()
  for (const m of css.matchAll(/(?:^|[\s,>+~(])\.([a-z][a-z0-9-]*)(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?(?=[\s,{:.[)])/gm)) {
    counts.set(m[1]!, (counts.get(m[1]!) ?? 0) + 1)
  }
  let best: string | null = null
  let bestN = 0
  for (const [name, n] of counts) if (n > bestN) { best = name; bestN = n }
  return best
}

/** Which gates touch this component, named so the claim is checkable. */
function testsFor(css: string, hasApg: boolean): string[] {
  const t = [
    'audit:values — no raw spacing, font-size, font-family or transition literal; magic px and structural inline held by ratchets',
    'audit:modifiers — every variant is defined in CSS and demonstrated in the gallery',
    'npm run a11y:matrix — axe over the rendered component, 3 densities x 2 modes',
  ]
  if (/:focus-visible|--k-ring/.test(css)) t.push('audit:focus — the focus treatment is present and not overridden')
  if (/--k-hit-min|--k-touch-target|--k-row-h|--k-btn-h|--k-in-h/.test(css)) {
    t.push('a11y:matrix target-size pass — rendered geometry on both axes at the AAA setting')
  }
  if (/--k-fg|--k-primary-text|--k-danger-text|color:/.test(css)) {
    t.push('knobSweep — no knob position drops this below a contrast floor')
  }
  if (hasApg) t.push('npm run a11y:tree — roles, names and reading order as the platform reports them')
  return t
}

export function explainerFor(id: string): Explainer | null {
  const recipe = RECIPES.find((r) => r.id === id)
  if (!recipe) return null

  const css = recipe.css
  const block = blockOf(css)

  const parts = block
    ? [...new Set([...css.matchAll(new RegExp(`\\.${block}__([a-z0-9-]+)`, 'g'))].map((m) => `${block}__${m[1]}`))]
    : []

  const modifiers = block
    ? [...new Set([...css.matchAll(new RegExp(`\\.${block}(?:__[a-z0-9-]+)?--([a-z0-9-]+)`, 'g'))].map((m) => `--${m[1]}`))]
    : []
  // ARIA attribute selectors carry state the class list does not — `[aria-current]`
  // on a nav link is a state, and the hyphen is why an earlier version of this
  // regex found none of them.
  const ariaStates = [...new Set([...css.matchAll(/\[(aria-[a-z-]+)/g)].map((m) => m[1]!))]
  const pseudo = STATEFUL.filter((p) => new RegExp(`:${p}\\b`).test(css)).map((p) => `:${p}`)

  const apg = APG_PATTERNS[id] ?? null
  return {
    id,
    block,
    parts,
    states: [...modifiers, ...ariaStates, ...pseudo],
    apg,
    apgNote: apg ? null : (APG_NOT_APPLICABLE[id] ?? null),
    tests: testsFor(css, !!apg),
  }
}

/** Every recipe that claims an APG pattern, for the gate and the docs index. */
export function apgCoverage(): { mapped: string[]; declaredNone: string[]; undeclared: string[] } {
  const ids = RECIPES.map((r) => r.id)
  const mapped = ids.filter((id) => id in APG_PATTERNS)
  const declaredNone = ids.filter((id) => id in APG_NOT_APPLICABLE)
  return {
    mapped,
    declaredNone,
    undeclared: ids.filter((id) => !(id in APG_PATTERNS) && !(id in APG_NOT_APPLICABLE)),
  }
}
