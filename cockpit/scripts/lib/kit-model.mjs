/**
 * ONE model of the kit. Every gate reads this; none of them parses again.
 *
 * WHY. Sixteen scripts independently parsed `src/kit/recipes/index.ts`, each
 * with its own regex for what a rule, a selector or a comment is — and two of
 * them had literally the same `/([^{}]+?)\s*\{/` written out twice. That is not
 * only duplication, it is sixteen chances to be subtly wrong in sixteen
 * different ways, and this repo has already paid for that: `audit:backticks`
 * needed three wrong models of a comment before it worked, and `audit:apg` first
 * keyed on class names where the recipes are keyed on ids.
 *
 * The naive regex is also just WRONG about nesting. `@container (max-width:
 * 22rem) {` looks exactly like a selector to it, and the first `}` inside then
 * reads as the end of the block — so every rule inside a container query is
 * either invisible or attributed to the wrong selector. The kit has container
 * queries in the calendar, the data table, the form panel, the filter bar and
 * the scaffold, which is a lot of CSS for a gate to be quietly blind to.
 *
 * So this is a brace-matching tokenizer rather than a pattern, it understands
 * nesting, and it is the single place where "what is a rule" is decided.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
export const RECIPES_PATH = join(HERE, '../../src/kit/recipes/index.ts')

/**
 * Strip CSS comments, preserving offsets so line numbers stay honest.
 * Character-stream, not regex: a `/*` inside a url() or a data: URI is not a
 * comment, and a regex cannot tell the difference.
 */
export function stripComments(css) {
  let out = ''
  let i = 0
  while (i < css.length) {
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      const skipped = css.slice(i, end < 0 ? css.length : end + 2)
      // keep the newlines so every later line number still matches the source
      out += skipped.replace(/[^\n]/g, '')
      i = end < 0 ? css.length : end + 2
      continue
    }
    out += css[i]
    i++
  }
  return out
}

/**
 * Parse one recipe's CSS into rules, descending into at-rules.
 *
 * @returns {Array<{selector: string, selectors: string[], at: string|null, decls: Array<[string,string]>, line: number}>}
 */
export function parseCss(css, { at = null, lineOffset = 0 } = {}) {
  const rules = []
  let i = 0
  let lineAt = (pos) => lineOffset + (css.slice(0, pos).match(/\n/g)?.length ?? 0) + 1

  while (i < css.length) {
    const open = css.indexOf('{', i)
    if (open < 0) break

    // Everything since the last block is the prelude: a selector or an at-rule.
    const prelude = css.slice(i, open).trim()

    // Brace-match to find this block's real end, so nested blocks do not fool us.
    let depth = 1
    let j = open + 1
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++
      else if (css[j] === '}') depth--
      j++
    }
    const body = css.slice(open + 1, j - 1)

    if (prelude.startsWith('@')) {
      // Conditional groups contain rules; @keyframes/@font-face contain frames
      // and descriptors, which are not component rules and would pollute every
      // declaration query if we let them in.
      if (/^@(media|container|supports|layer|scope)\b/.test(prelude)) {
        rules.push(...parseCss(body, { at: at ? `${at} and ${prelude}` : prelude, lineOffset: lineAt(open) - 1 }))
      }
    } else if (prelude) {
      const decls = []
      // Declarations only at this level — a nested block's text is not ours.
      const flat = body.replace(/\{[^{}]*\}/g, '')
      for (const d of flat.split(';')) {
        const c = d.indexOf(':')
        if (c < 0) continue
        const prop = d.slice(0, c).trim()
        const value = d.slice(c + 1).trim()
        if (prop && value && !prop.includes('{')) decls.push([prop, value])
      }
      rules.push({
        selector: prelude.replace(/\s+/g, ' '),
        selectors: prelude.split(',').map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean),
        at,
        decls,
        line: lineAt(open),
      })
    }
    i = j
  }
  return rules
}

/** Every class name a selector mentions. The ONE definition of "a kit class". */
export const CLASS_RE = /\.(-?[A-Za-z_][\w-]*)/g
export const classesIn = (selector) => [...selector.matchAll(CLASS_RE)].map((m) => m[1])

/**
 * The whole kit, parsed once.
 *
 * @returns {{recipes: Array, rules: Array, classes: Map, source: string}}
 */
export function parseKit(source = readFileSync(RECIPES_PATH, 'utf8')) {
  /* Recipe boundaries come from the id lines, which is what the recipes are
   * actually keyed on — not from the section labels, which are prose and change. */
  const ids = [...source.matchAll(/^ {4}id: '([a-z0-9-]+)',/gm)]
  const recipes = []

  for (const [n, m] of ids.entries()) {
    const start = m.index
    const end = n + 1 < ids.length ? ids[n + 1].index : source.length
    const block = source.slice(start, end)
    const section = block.match(/^ {4}section: ["'](.+?)["'],/m)?.[1] ?? null

    /* The css: template literal, ending at the first UNESCAPED backtick.
     *
     * "Backticks inside are a build error the gate prevents" was almost true and
     * cost an hour: audit:backticks bans BARE backticks, and an ESCAPED one is
     * legal JS. The calendar recipe has exactly one, in a comment reading "the
     * native \`disabled\` + this class" — and a plain indexOf stopped there,
     * truncating that recipe's CSS at 4433 characters and silently dropping
     * everything after it, .calendar__more included.
     *
     * The tell was the same one as always: an impossible number. The classifier
     * built on this model called .calendar__more "not part of the kit", which is
     * not a surprising answer, it is a wrong one. */
    const cssStart = block.indexOf('css: `')
    let css = ''
    if (cssStart >= 0) {
      let i = cssStart + 6
      for (; i < block.length; i++) {
        if (block[i] === '\\') { i++; continue }
        if (block[i] === '`') break
      }
      css = block.slice(cssStart + 6, i)
    }

    recipes.push({
      id: m[1],
      section,
      css,
      line: source.slice(0, start).split('\n').length,
      rules: parseCss(stripComments(css)),
    })
  }

  const rules = []
  const classes = new Map()
  for (const r of recipes) {
    for (const rule of r.rules) {
      const withOwner = { ...rule, recipeId: r.id }
      rules.push(withOwner)
      for (const cls of classesIn(rule.selector)) {
        const base = cls.split('--')[0]
        if (!classes.has(cls)) classes.set(cls, { name: cls, base, recipeId: r.id, rules: [] })
        classes.get(cls).rules.push(withOwner)
      }
    }
  }

  return { recipes, rules, classes, source }
}

/** Declarations of one property across the kit: [{recipeId, selector, value}]. */
export function valuesOf(model, prop) {
  const out = []
  for (const rule of model.rules) {
    for (const [p, v] of rule.decls) {
      if (p === prop || (prop instanceof RegExp && prop.test(p))) {
        out.push({ recipeId: rule.recipeId, selector: rule.selector, prop: p, value: v, at: rule.at, line: rule.line })
      }
    }
  }
  return out
}
