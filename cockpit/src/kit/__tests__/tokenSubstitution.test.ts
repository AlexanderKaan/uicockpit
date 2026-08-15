import { describe, it, expect } from 'vitest'
import { RECIPES } from '../recipes'
import { buildTokens } from '../../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../../tokens/defaults'

/**
 * A TOKEN IS SUBSTITUTED, NOT READ. This test exists because of a defect that
 * every other gate in this repo was structurally unable to see.
 *
 * `.popover`, `.toast`, `.lightbox` and `.navmenu__panel` each wrote
 *
 *     animation: var(--k-anim-scale-in, k-scale-in 200ms …) backwards;
 *
 * and every `--k-anim-*` token buildTokens emits ALREADY ends in a fill mode.
 * Substituted, that reads `… both backwards` — two fill modes, so the whole
 * shorthand is invalid at computed-value time and the browser drops it to
 * `animation: none`. Four components' entrance animation had therefore never run
 * for anyone: not in our preview, not in the app, and not for a single consumer
 * of the export — because the failure needs the token to be DEFINED, which it
 * always is. The one scope where the tokens are missing is the only scope where
 * those four animated, which is why nothing ever looked wrong on a spot check.
 *
 * WHY NO EXISTING GATE COULD CATCH IT. Every static auditor reads the recipe
 * text, where the declaration is well-formed. Every rendered auditor asks about
 * contrast, size, roles and layout — a dead animation breaks none of those. axe
 * has no opinion on it. The defect lived exactly in the gap between "what the
 * CSS says" and "what the browser computes", which is the gap a var() opens.
 *
 * So this test does the one thing neither side did: it takes the REAL token
 * values from buildTokens — not a mirrored table, which is how the original
 * mistake was possible — substitutes them into the recipes, and reads the result
 * the way a browser would.
 */

const vars = buildTokens(DEFAULT_CONFIG).vars as Record<string, string | number>

/* ⚠️ EVERYTHING BELOW COUNTS PARENTHESES INSTEAD OF MATCHING THEM WITH A REGEX,
 * and the first draft of this file did not — which is worth recording, because
 * writing the gate for a trap is not the same as being immune to it.
 *
 * `var\(.*\)` is greedy, so on
 *     var(--k-anim-menu, k-menu-roll 180ms cubic-bezier(.05,.7,.1,1))
 * it treats cubic-bezier's closing paren as the var's, and then reports the
 * perfectly correct `both)` as trailing junk. Three healthy recipes came back as
 * failures. And splitting a shorthand on `,` cuts cubic-bezier(.05,.7,.1,1) into
 * four pieces, which silently hid the one real defect the test was written for:
 * with the bug deliberately re-introduced, this check stayed GREEN.
 *
 * Wrong in both directions at once — false alarms on the healthy, silence on the
 * sick. A CSS value is a nested structure; only a scanner reads it. */

/** Index of the `)` closing the `(` at `open`, or -1. */
function closingParen(s: string, open: number): number {
  let depth = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')' && --depth === 0) return i
  }
  return -1
}

/** Split on top-level separators only — never inside parentheses. */
function splitTop(value: string, sep: (ch: string) => boolean): string[] {
  const parts: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of value) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (depth === 0 && sep(ch)) {
      if (cur.trim()) parts.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts
}

const topLevelParts = (v: string) => splitTop(v, (ch) => /\s/.test(ch))
const topLevelCommas = (v: string) => splitTop(v, (ch) => ch === ',')

/** Resolve `var(--x, fallback)` against the real token table, innermost first. */
function substitute(value: string, depth = 0): string {
  if (depth > 10) return value
  const at = value.indexOf('var(')
  if (at === -1) return value
  const open = at + 3
  const close = closingParen(value, open)
  if (close === -1) return value
  const inner = value.slice(open + 1, close)
  const comma = splitTop(inner, (ch) => ch === ',')
  const name = comma[0]?.trim() ?? ''
  const fallback = comma.slice(1).join(',').trim()
  const v = vars[name]
  const resolved = v !== undefined && v !== '' ? String(v) : fallback
  return substitute(value.slice(0, at) + resolved + value.slice(close + 1), depth + 1)
}

/** The var() call at the head of a value, and whatever follows its closing paren. */
function trailingAfterVar(value: string): { name: string; trailing: string } | null {
  const at = value.indexOf('var(')
  if (at === -1) return null
  const close = closingParen(value, at + 3)
  if (close === -1) return null
  const inner = value.slice(at + 4, close)
  return { name: splitTop(inner, (ch) => ch === ',')[0]?.trim() ?? '', trailing: value.slice(close + 1).trim() }
}

/** Every `prop: value` in the kit, with the recipe it came from. */
function declarations(prop: string): { recipe: string; raw: string }[] {
  const found: { recipe: string; raw: string }[] = []
  const pattern = new RegExp(`(?:^|[;{\\s])${prop}\\s*:\\s*([^;}]+)`, 'g')
  for (const r of RECIPES) {
    for (const m of r.css.matchAll(pattern)) found.push({ recipe: r.id, raw: (m[1] ?? '').trim() })
  }
  return found
}

/* The keyword groups that may appear AT MOST ONCE in an `animation` shorthand.
 * A second one does not override the first — it invalidates the declaration. */
const ANIMATION_SINGLETONS: Record<string, RegExp> = {
  'fill-mode': /^(none|forwards|backwards|both)$/i,
  direction: /^(normal|reverse|alternate|alternate-reverse)$/i,
  'play-state': /^(running|paused)$/i,
}

describe('token substitution produces valid CSS', () => {
  it('the kit actually has animation declarations to check', () => {
    // Guard against the check silently measuring nothing — the failure mode that
    // let `audit:hit-target` print "clean" over six real violations.
    expect(declarations('animation').length).toBeGreaterThan(5)
  })

  it('no `animation` shorthand repeats a keyword once its tokens are substituted', () => {
    const broken: string[] = []
    for (const { recipe, raw } of declarations('animation')) {
      if (!raw.includes('var(')) continue
      const resolved = substitute(raw)
      for (const one of topLevelCommas(resolved)) {
        const parts = topLevelParts(one)
        for (const [group, re] of Object.entries(ANIMATION_SINGLETONS)) {
          const hits = parts.filter((p) => re.test(p))
          if (hits.length > 1) {
            broken.push(
              `${recipe}: two ${group} keywords (${hits.join(' + ')})\n` +
                `    authored:  animation: ${raw}\n` +
                `    resolved:  animation: ${resolved}\n` +
                `    → the browser drops this to \`animation: none\`.\n` +
                `    Fix: move the keyword INSIDE the var() fallback, the way .menu writes it.`,
            )
          }
        }
      }
    }
    expect(broken.join('\n\n')).toBe('')
  })

  it('no recipe appends values after a var() that already resolves to a full animation', () => {
    /* The narrower, structural form of the same rule — it catches the mistake at
     * the moment it is typed, before anyone has to reason about fill modes.
     * Every `--k-anim-*` token is a COMPLETE shorthand by construction, so
     * nothing may follow it. The fallback is inside the parens and is exempt. */
    const offenders: string[] = []
    for (const { recipe, raw } of declarations('animation')) {
      const head = trailingAfterVar(raw)
      if (head?.name.startsWith('--k-anim-') && head.trailing) {
        offenders.push(`${recipe}: "${head.trailing}" follows the complete token ${head.name} in: ${raw}`)
      }
    }
    expect(offenders.join('\n')).toBe('')
  })

  it('every --k-anim-* token really is a complete shorthand (the premise above)', () => {
    const anim = Object.entries(vars).filter(([k]) => k.startsWith('--k-anim-'))
    expect(anim.length).toBeGreaterThan(5)
    for (const [k, v] of anim) {
      const parts = topLevelParts(String(v))
      // name + duration + timing at minimum; infinite spinners carry no fill mode.
      expect(parts.length, `${k} = "${v}" is not a full shorthand`).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('every token the kit reads is a token the engine emits', () => {
  /* THE SAME BLIND SPOT AS THE ANIMATION BUG, one level up. `.processlist__step`
   * asked for `padding: 0 0 var(--k-s-24) var(--k-s-40)` and --k-s-40 does not
   * exist. No fallback, so the WHOLE shorthand is invalid, so the step had no
   * left padding, so the numbered badge sat on top of the heading — "Send your
   * application" rendered as "end your application". Its sibling
   * `--k-radius-full` does not exist either, which is why the badge was a square
   * where the recipe asked for a circle.
   *
   * A ghost token is silent by design: CSS drops the declaration and says
   * nothing. Only substitution finds it, and only against the REAL table —
   * a regex over buildTokens.ts source reported --k-s-4 as undefined, because
   * the spacing and tone scales are emitted in loops rather than as literal
   * keys. That reading would have had the entire kit broken, which is the tell
   * that the meter, not the kit, was wrong. */
  const defined = new Set(Object.keys(vars))

  it('the token table is real and large (guard against measuring nothing)', () => {
    expect(defined.size).toBeGreaterThan(150)
    for (const t of ['--k-s-4', '--k-s-24', '--k-danger', '--k-radius-md']) {
      expect(defined.has(t), `${t} missing — the table is not what this test thinks it is`).toBe(true)
    }
  })

  it('no recipe reads a --k-* token that does not exist, without a fallback', () => {
    const ghosts: string[] = []
    for (const r of RECIPES) {
      for (const m of r.css.matchAll(/([a-z-]+)\s*:\s*([^;}]*var\([^;}]*)/g)) {
        const [, prop, value] = m
        for (const v of (value ?? '').matchAll(/var\(\s*(--k-[\w-]+)\s*([,)])/g)) {
          const name = v[1]!
          const hasFallback = v[2] === ','
          if (defined.has(name) || hasFallback) continue
          ghosts.push(`${r.id}: ${prop} reads ${name}, which the engine never emits and there is no fallback`)
        }
      }
    }
    expect([...new Set(ghosts)].join('\n')).toBe('')
  })
})
