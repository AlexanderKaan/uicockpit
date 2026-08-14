#!/usr/bin/env node
/**
 * Generate our entry for Open UI's Component Name Matrix.
 *
 *   node scripts/gen-openui-entry.mjs        # write it
 *   node scripts/gen-openui-entry.mjs --check # fail if stale (build gate)
 *
 * Open UI's matrix (open-ui.org/research/component-matrix) crosses component
 * names across 27 design systems and reports how many use each. Being in it is
 * free visibility beside Carbon and USWDS and a direct line to the people writing
 * the specs — but the reason to do it is narrower and better: it forces us to
 * publish an exhaustive component list, and an exhaustive list you have to stand
 * behind is its own discipline. `audit:naming` already measures us against the
 * matrix; this closes the loop by putting us IN it.
 *
 * Generated from the public component catalogue rather than hand-written, so what
 * we claim publicly and what we document cannot drift. Same reason the export
 * reads the kit instead of a mirror.
 *
 * Their schema (site/src/schemas/design-system.schema.json) wants
 * {name, description, url, by, components[]} where each component needs at least
 * {name, url}. `openUIName` is optional and is how a system says "you call this X,
 * we call it Y" — we fill it from the alias table wherever the field has a
 * converged name, which is precisely the information the matrix exists to
 * collect.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const CHECK = process.argv.includes('--check')
const SITE = 'https://uicockpit.com'

/* Read the PUBLIC catalogue, not the raw recipe list.
 *
 * COMPONENT_PAGES is what we document at /components/<slug> — 76 curated entries
 * with a name, a blurb and a live preview. The raw recipe array has 114 ids, and
 * a third of those are grouping labels (`form-primitives`, `layout-primitives`,
 * `inline-status-meta-micro-components`) that are not components anyone adopts.
 * Publishing those would pad the matrix with things that do not exist as such and
 * point at pages that do not resolve — the opposite of the discipline that makes
 * this submission worth doing. */
const PAGES_SRC = readFileSync(join(here, '../src/stage/views/ComponentGallery.tsx'), 'utf8')
const STANDARD = JSON.parse(readFileSync(join(here, '../src/kit/standardNames.json'), 'utf8'))

const components = []
const ROW = /\{ slug: '([a-z0-9-]+)', name: '([^']+)', group: '([^']+)', recipeId: '([a-z0-9-]+)', blurb: '((?:[^'\\]|\\.)*)'/g
for (const m of PAGES_SRC.matchAll(ROW)) {
  const [, slug, name, , recipeId, blurb] = m
  components.push({ slug, name, recipeId, definition: blurb.replace(/\\'/g, "'").replace(/\u2019/g, '\u2019') })
}

/* openUIName is how a system tells the matrix "you call this X, we call it Y" —
 * exactly the information it exists to collect. Filled from the alias table the
 * naming gate maintains, matched on the recipe id or the class it maps to, so it
 * cannot drift from what audit:naming enforces. */
const byClass = new Map(STANDARD.aliases.map((a) => [a.className, a.standard]))
const norm = (x) => x.replace(/-/g, '').toLowerCase()

/* The handful where our PUBLIC name differs from the converged one, written out
 * by hand and on purpose.
 *
 * The first version inferred this by looking for a standard word inside our name,
 * and it produced "Alert Dialog -> Alert", "Button Group -> Button" and "Hover
 * Card -> Card" — three different components that merely contain the word. A
 * guessed mapping in a public submission is worse than no mapping: it tells 27
 * other systems we are the same thing as something we are not, and the matrix's
 * whole value is that its rows mean something. */
const BY_NAME = {
  'Checkbox & Radio': 'Checkbox',   // one page, the two selection controls
  'Badge & Chip': 'Badge',
  'Data Table': 'Table',            // the sortable/selectable one; `Table` is the plain element
  'Form Panel': 'Form',
  'Dropdown Menu': 'Dropdown',
}

const out_components = components
  .map(({ slug, name, recipeId, definition }) => {
    const std = BY_NAME[name] ?? byClass.get(recipeId) ?? byClass.get(norm(recipeId)) ?? byClass.get(norm(slug))
    return {
      name,
      url: `${SITE}/components/${slug}`,
      definition,
      ...(std && norm(std) !== norm(name) ? { openUIName: std } : {}),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

const doc = {
  $schema: '../schemas/design-system.schema.json',
  // No lastUpdated: their files carry one, but stamping it from the clock would
  // make every run produce a diff and the --check gate would fail on time rather
  // than on content. Set it by hand when the PR goes out.
  name: 'UIcockpit',
  description:
    'A design system you configure once and can then prove: framework-neutral CSS tokens over semantic HTML, ' +
    'with a verifier that checks a codebase against the contract it was given. Built to WCAG 2.2 AA, with an ' +
    'AAA target-size mode for public-sector baselines.',
  url: SITE,
  by: 'Alexander Kaan',
  components: out_components,
}

const out = JSON.stringify(doc, null, 2) + '\n'

const target = join(here, '../../openui-entry.json')
let prev = ''
try { prev = readFileSync(target, 'utf8') } catch { /* first run */ }

if (CHECK) {
  if (prev !== out) {
    console.error('✗ openui-entry.json is stale — run `npm run gen:openui-entry`')
    process.exit(1)
  }
  console.log(`✓ openui-entry.json current (${out_components.length} components)`)
  process.exit(0)
}

writeFileSync(target, out)
const named = out_components.filter((c) => c.openUIName).length
console.log(`✓ openui-entry.json — ${out_components.length} components, ${named} mapped onto a converged Open UI name`)
console.log('  Submit: fork openui/open-ui, drop this at site/src/sources/uicockpit.json,')
console.log('  register it in site/src/sources/index.js, open a PR.')
