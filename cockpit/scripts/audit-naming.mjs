#!/usr/bin/env node
/**
 * audit:naming — do we call things what the field calls them?
 *
 * A design system that teams from different suppliers must collaborate on pays
 * for every invented name in adoption. Open UI's Component Name Matrix already
 * settled this argument empirically: it crosses component names across 27
 * systems (Ant, Carbon, Spectrum, USWDS, WAI-ARIA, the browsers, …) and reports
 * how many use each one. `scripts/data/openui-names.json` is that data, captured
 * with their own normaliser — see the `_` keys in the file for provenance.
 *
 * The rule this gate enforces: for every concept a MAJORITY-ish of the field has
 * converged on, we either use that word as our class, or we have written down
 * why we don't. Divergence is allowed — unexamined divergence is not.
 *
 * It is deliberately a ratchet and not a style rule. The existing exceptions are
 * baselined below with reasons; what fails the build is a NEW one. That is the
 * only version of this checkbox worth having: telling us today that `.btn` is not
 * `button` is not news, and silently letting the next twenty diverge is how a
 * vocabulary rots.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const MATRIX = JSON.parse(readFileSync(join(here, 'data/openui-names.json'), 'utf8'))
const RECIPES = readFileSync(join(here, '../src/kit/recipes/index.ts'), 'utf8')

/** The bar. At 30% a name is what a plurality of the field reaches for
 *  independently; below that the field genuinely disagrees and the name is ours
 *  to choose. */
const THRESHOLD = 30

/**
 * What we call each converged concept, and why when it differs.
 *
 * This table is not just documentation — it ships. `standardVocabulary()` feeds
 * it into the agent pack, so a model that knows the word "button" can find
 * `.btn` instead of inventing `.button` and drifting. The audit finding becomes
 * the product feature: the gap is stated rather than hidden.
 *
 *   class: the root class we actually ship, or null if we deliberately don't
 *   why:   required whenever `class` is not literally the standard name
 */
const OURS = {
  /* The one abbreviation we keep, and the reasoning is worth stating because the
   * other three did not survive it. `.btn` is not shorthand we invented — it is
   * Bootstrap's, and fifteen years of it made `.btn` the thing a developer types
   * without thinking. Breaking that costs more than it buys. `.tt`, `.check` and
   * `.tbl` had no such history: they were our abbreviations of the 67%, 74% and
   * 37% names, unguessable to anyone reading our CSS cold, and they were renamed.
   * The agent pack maps button -> .btn either way, so the standard word resolves. */
  button: { class: 'btn', why: 'Bootstrap made `.btn` near-universal in CSS (Bulma is the dissenter). Kept for muscle memory; the agent pack maps the standard word onto it.' },
  checkbox: { class: 'checkbox' },
  tooltip: { class: 'tooltip' },
  select: { class: 'select' },
  breadcrumb: { class: 'breadcrumb' },
  accordion: { class: 'accordion' },
  tab: { class: 'tabs', why: 'Plural; the normaliser treats tabs/tab as the same name, and the plural is what the container is.' },
  dialog: { class: 'dialog' },
  card: { class: 'card' },
  menu: { class: 'menu' },
  progres: { class: 'progress', why: 'Their normaliser mangles the trailing -ss; the concept is `progress` and we spell it correctly.' },
  alert: { class: 'alert' },
  dropdown: { class: 'menu', why: 'We ship one menu primitive rather than a separate dropdown; `dropdown` is a trigger pattern, not a second surface.' },
  modal: { class: 'dialog', why: 'The platform word is <dialog>, and WAI-ARIA APG names the pattern Modal Dialog. 44% say dialog and 37% say modal — we follow the platform.' },
  icon: { class: null, why: 'We ship icon SETS as a token/asset choice, not a styled component; there is no icon recipe to name.' },
  form: { class: 'field', why: 'Our unit is the FIELD (label+control+hint+error) because that is the accessible unit; `.form` as a class would style nothing.' },
  badge: { class: 'badge' },
  radio: { class: 'radio' },
  switch: { class: 'switch' },
  table: { class: 'table' },
  combobox: { class: 'combobox' },
  pagination: { class: 'pagination' },
  label: { class: 'lab', why: 'Abbreviated; `.label` collides with the form-label role in most consumers’ own CSS, which is why it was shortened.' },
  nav: { class: 'navsuite', why: 'Ours is a suite (rail/sidebar/bar) rather than a single nav element; `.navrow` and `.navsub__item` are its parts.' },
  slider: { class: 'slider' },
  avatar: { class: 'avatar' },
  carousel: { class: 'carousel' },
  text: { class: null, why: 'Typography is tokens (--k-type-*), not a component.' },
  tag: { class: 'chip', why: '`chip` and `tag` split the field roughly evenly; chip is the Material/Spectrum lineage and matches our `.chip` + `.tag-input` pair.' },
  link: { class: 'btn', why: 'A link is an <a>; the styled variant is `.btn--link`. No separate class.' },
  list: { class: 'list' },
  toast: { class: 'toast', why: 'Shipped as `.toast` inside the `toast-stack` recipe.' },
  tree: { class: null, why: 'Not shipped. Tree view is on the build list, not in the kit.' },
  spinner: { class: 'spinner' },
  skeleton: { class: 'skeleton' },
  banner: { class: 'banner' },
  divider: { class: 'separator', why: 'ARIA calls the role `separator`; we follow the role name over the visual one.' },
  tooltiparrow: { class: null, why: 'A part of tooltip, not a component.' },
}

// ── read what we actually ship ─────────────────────────────────────────────
const rootClasses = new Set()
for (const m of RECIPES.matchAll(/(^|[\s,])\.([a-z][a-z0-9-]*)(?=[\s,{:.[])/gm)) {
  const b = m[2]
  if (!b.includes('__') && !b.includes('--')) rootClasses.add(b)
}

const norm = (n) => n.replace(/[\s-]/g, '').toLowerCase().replace(/(\w+?)(e|er)?(s|ing)$/, '$1')

const problems = []
const renameWatch = []
let covered = 0

for (const [name, meta] of Object.entries(MATRIX.names)) {
  if (meta.pct < THRESHOLD) continue
  covered++
  const entry = OURS[name]

  if (!entry) {
    problems.push(
      `UNDECLARED  "${meta.spelled}" — ${meta.pct}% of ${MATRIX._systems} systems use this name and we have not said what we call it.\n` +
      `            Add it to OURS in scripts/audit-naming.mjs: the class we ship, or null plus a reason.`,
    )
    continue
  }
  if (entry.class === null) continue
  if (!rootClasses.has(entry.class)) {
    problems.push(
      `MISSING     "${meta.spelled}" (${meta.pct}%) is declared as .${entry.class}, but no such root class exists in the kit.\n` +
      `            Either the class was renamed and this table is stale, or the recipe went away.`,
    )
    continue
  }
  if (norm(entry.class) !== name && !entry.why) {
    problems.push(
      `UNEXPLAINED "${meta.spelled}" (${meta.pct}%) ships as .${entry.class} with no reason recorded.\n` +
      `            Divergence is allowed; unexamined divergence is not. Add a \`why\`.`,
    )
  }
  if (/Flagged for rename/.test(entry.why ?? '')) renameWatch.push(`.${entry.class} → ${meta.spelled} (${meta.pct}%)`)
}

// ── report ─────────────────────────────────────────────────────────────────
const aligned = Object.entries(MATRIX.names)
  .filter(([n, m]) => m.pct >= THRESHOLD && OURS[n]?.class && norm(OURS[n].class) === n).length

console.log(
  `audit:naming — ${aligned}/${covered} converged names (>=${THRESHOLD}% of ${MATRIX._systems} systems) ` +
  `use the field's own word`,
)
if (renameWatch.length) {
  console.log(`  rename backlog (declared, not yet done): ${renameWatch.join(' · ')}`)
}

if (problems.length) {
  console.error(`\n✗ audit:naming — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  ${p}\n`)
  process.exit(1)
}
console.log('✓ audit:naming — every converged name is either matched or explained')

/* And the table SHIPS, which is the point of having written it down.
 *
 * An agent that knows the word "button" should find `.btn` rather than invent
 * `.button` and drift — the same failure the whole check-and-contract thesis
 * exists to stop, one level up in the vocabulary instead of the values. So the
 * gate emits its own table and the agent pack reads it: one source, and the
 * build fails if the emitted file is stale, exactly like gen:vocabulary. */
const emitted = Object.entries(OURS)
  .filter(([n, m]) => m.class && MATRIX.names[n] && MATRIX.names[n].pct >= THRESHOLD)
  .map(([n, m]) => ({
    standard: MATRIX.names[n].spelled,
    className: m.class,
    pct: MATRIX.names[n].pct,
    ...(norm(m.class) === n ? {} : { note: m.why }),
  }))
  .sort((a, b) => b.pct - a.pct)

const target = join(here, '../src/kit/standardNames.json')
const next = JSON.stringify(
  { _generated: 'scripts/audit-naming.mjs — do not edit', _systems: MATRIX._systems, aliases: emitted },
  null, 1,
) + '\n'
let prev = ''
try { prev = readFileSync(target, 'utf8') } catch { /* first run */ }
if (prev !== next) {
  writeFileSync(target, next)
  console.log(`  wrote src/kit/standardNames.json (${emitted.length} names)`)
}
