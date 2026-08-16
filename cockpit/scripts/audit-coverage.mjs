#!/usr/bin/env node
/**
 * audit-coverage.mjs — does anything COMPOSE this recipe into a page?
 *
 *   node scripts/audit-coverage.mjs [--report]
 *
 * 🚨 WHAT THIS GATE USED TO BE, and why it was rewritten. It carried a
 * hand-written MARKERS map of 27 component → marker substrings and reported
 * "OK: all 27 tracked components appear in a live app screen" — a true sentence
 * about a list, and a meaningless one about the kit, which ships 110 recipes.
 * The real number was 51. Two components (Thread, Pricing) also survived their
 * own deletion for an hour, because removing a component meant remembering to
 * edit this file.
 *
 * That is the rule this whole arc produced, and we were breaking it in our own
 * instrument: A METER DERIVES ITS SUBJECTS, IT NEVER CARRIES A LIST OF THEM. The
 * moment it carries the list, it measures the list.
 *
 * WHAT IT IS NOW. Subjects = every recipe in src/kit/recipes/index.ts, parsed by
 * the same kit model every other static gate reads. Covered = at least one of the
 * recipe's OWN classes is rendered by the composition fixture. Nothing to
 * maintain here when a component is added or deleted.
 *
 * ⚠️ AND THE QUESTION IS NARROWER THAN THE OLD NAME SUGGESTED. The old docstring
 * claimed "every component must appear inside a live app screen" — written for
 * the SupaDash suite, which is retired. src/showcases/** is now a CONFORMANCE
 * FIXTURE we control, so "is it in the fixture" is a question we can always
 * answer yes to by editing the fixture. What it still proves, and nothing else
 * does, is that a recipe COMPOSES: that it survives being put on a page next to
 * other components rather than alone in a 400px card. That is worth a gate; it
 * is just not the same claim as "it works in production".
 *
 * ⚠️ MOST OF THE REMAINDER LEGITIMATELY HAS NO PLACE IN A STATIC SECTION FIXTURE — a
 * command palette, a toast stack, an alert dialog and a carousel are overlays and
 * interactions, not page furniture. So the bar is a RATCHET, not zero: the
 * uncovered count may fall and may never rise. A new recipe must earn a place in
 * a composed page or be a conscious exception, which is exactly the bar that
 * would have caught activity-feed shipping with no home at all.
 *
 * HOW A CLASS IS COUNTED AS RENDERED, and the control that settled it. Reading
 * every string literal in the fixture reported 61 covered; reading only
 * className= values reported 51. The 10-recipe difference was all coincidence —
 * `alert`, `tooltip`, `dialog`, `toggle`, `sheet` and `radio` are SectionSpec
 * KIND names in the manifests, not classes. A looser reader would have scored a
 * recipe as composed because a piece of DATA happened to share its name. So:
 * className= only, plus SCREAMING_CASE class constants resolved (PANE_CLASS is a
 * real class applied through a variable), and nothing else.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parseKit, classesIn } from './lib/kit-model.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPORT = process.argv.includes('--report')

/* The composition fixture. sections.tsx maps SectionSpec → kit recipes,
 * shell.tsx carries the section tier (scaffold + panes) that the deleted loupe
 * used to be the only consumer of, and extras.ts defines the pane/window class
 * constants those apply through. (ChartFrame was the fourth file here until the
 * four-layer cut took the chart recipe and the presenter with it.) See the note
 * in cockpit/CLAUDE.md: this directory is not dead code, it is what six auditors
 * read from disk. */
const SHOWCASES = resolve(ROOT, 'src/showcases')
const FILES = [
  resolve(ROOT, 'src/tokens/extras.ts'),
  ...readdirSync(SHOWCASES).filter((f) => /\.tsx?$/.test(f)).map((f) => resolve(SHOWCASES, f)),
]
const HAY = FILES.map((f) => readFileSync(f, 'utf8')).join('\n')

/** Every class token the fixture actually puts on an element. */
function renderedClasses(src) {
  const out = new Set()
  const add = (text) => { for (const t of String(text).matchAll(/[A-Za-z][\w-]*/g)) out.add(t[0]) }

  /* A class applied through a constant is still applied. PANE_CLASS is the one
   * that matters and the old MARKERS map special-cased it by name; resolving the
   * declaration instead means the next one works without an edit here. */
  const consts = new Map()
  for (const m of src.matchAll(/\b([A-Z][A-Z0-9_]{2,})\s*=\s*['"`]([a-z][a-z0-9 _-]*)['"`]/g)) consts.set(m[1], m[2])

  for (const m of src.matchAll(/className=("[^"]*"|\{[^}]*\}|`[^`]*`)/g)) {
    const raw = m[1]
    add(raw)
    for (const [name, value] of consts) if (raw.includes(name)) add(value)
  }
  return out
}

const rendered = renderedClasses(HAY)
const kit = parseKit()

const covered = []
const uncovered = []
for (const r of kit.recipes) {
  const own = [...new Set(r.rules.flatMap((rule) => classesIn(rule.selector)))]
  const hits = own.filter((c) => rendered.has(c))
  ;(hits.length ? covered : uncovered).push({ id: r.id, section: r.section, own: own.length, hits })
}

/* The ratchet. It may fall; it may not rise. Do NOT raise it to make a build
 * pass — if the number went DOWN the gate fails on purpose until the win is
 * locked in, same contract as audit:apg and audit:structural-inline. */
const CEILING = 52

const line = (s = '') => console.log(s)
line('=== audit:coverage — does anything COMPOSE this recipe into a page? ===')
line(`  subjects   ${kit.recipes.length} recipes, derived from the kit — no list in this file`)
line(`  composed   ${covered.length}`)
line(`  alone      ${uncovered.length}   (ceiling ${CEILING})`)
line()

if (uncovered.length) {
  /* Flat and wrapped, not grouped by section: nearly every section holds one
   * recipe, so grouping produced 59 headings over 59 single-item lists — a
   * report shaped like a database dump rather than something a person reads. */
  line('  Only ever shown alone in a gallery card, never next to anything else:')
  const ids = uncovered.map((u) => u.id).sort()
  let row = '   '
  for (const id of ids) {
    if (row.length + id.length + 3 > 78) { line(row); row = '   ' }
    row += ` ${id} ·`
  }
  line(row.replace(/ ·$/, ''))
  line()
}

if (uncovered.length > CEILING) {
  line(`FAIL: ${uncovered.length} recipes compose into nothing, ceiling is ${CEILING}.`)
  line('Put it in a section in src/showcases/sections.tsx, or lower the ceiling in a')
  line('commit that says why this one cannot be composed.')
  process.exit(REPORT ? 0 : 1)
}
if (uncovered.length < CEILING) {
  line(`FAIL (good news): down to ${uncovered.length} from ${CEILING}. Lower CEILING to ${uncovered.length}`)
  line('in this commit, or the win is not held.')
  process.exit(REPORT ? 0 : 1)
}
line('OK: at the ratchet.')
process.exit(0)
