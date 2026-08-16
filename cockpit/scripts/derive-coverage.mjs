#!/usr/bin/env node
/**
 * derive-coverage — the four layers, read in the OTHER direction.
 *
 *   node scripts/derive-coverage.mjs
 *
 * THE QUESTION THIS ANSWERS, and it is not the one derive-provenance answers.
 * That script asks, of each recipe we ship, "can you name a source?" — and the
 * answer is now yes for every component-tier recipe, which proves we invented
 * nothing. It does NOT prove we missed nothing. A set can be entirely justified
 * and still be arbitrary: 97 defensible components chosen from a field of 200
 * is still a choice, and "why these?" is answered with "because someone added
 * them", which is the honest description of how this kit was assembled.
 *
 * So: take the four catalogues as DENOMINATORS and ask what we cover.
 *
 *   1 · MDN / HTML   every element that renders a control or a structure
 *   2 · WAI-ARIA APG all 30 named patterns
 *   3 · Open UI      all 51 surveyed concepts
 *   4 · GOV.UK · NL · USWDS   every component and pattern those three publish
 *
 * The union of the four IS the derived component set. Everything in it we lack
 * is a GAP with a citation. Everything we ship outside it would be unjustified —
 * and derive-provenance already reports that half at zero.
 *
 * ⚠️ WHAT THIS IS NOT. It is not a worklist of 200 components to build. Layer 1
 * coverage is mostly the PLATFORM FLOOR's job — `<abbr>` needs a style rule, not
 * a component — and the report separates those, because conflating "we do not
 * style <cite>" with "we have no combobox" would produce a number that flatters
 * nobody and informs no one.
 *
 * ⚠️ AND FREQUENCY IS NOT NECESSITY. Open UI's 51 are a census of what 27 design
 * systems ship, and design systems copy each other. That layer is the weakest
 * evidence here for exactly that reason, and it is reported separately rather
 * than averaged in.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const read = (f) => JSON.parse(readFileSync(join(HERE, 'data', f), 'utf8'))
const openui = read('openui-names.json')
const services = read('service-systems.json')
const platform = read('platform-catalogues.json')

/* The same normaliser derive-provenance uses, and for the same reason: the two
 * must agree about when two names are the same name, or one reports a gap the
 * other has already filled. */
const norm = (x) => String(x).toLowerCase().replace(/[\s\-_&()[\].<>]/g, '').replace(/(\w+?)(e|er)?(s|ing)$/, '$1')
/* ⚠️ -es AS WELL AS -s. GOV.UK ships "Checkboxes" and "Radios" where USWDS ships
 * "Checkbox" and "Radio buttons", and a stemmer that only strips a trailing s
 * turns "checkboxes" into "checkboxe" and reports a gap over a recipe we have.
 * The reverse direction is a strictly harder matching problem than the forward
 * one — forward needs ANY source to match, reverse needs EVERY entry resolved —
 * so the plural rules that never mattered before all matter now. */
const forms = (x) => {
  const bare = String(x).toLowerCase().replace(/[\s\-_&()[\].<>]/g, '')
  return [...new Set([norm(x), bare, bare.replace(/e?s$/, ''), bare.replace(/s$/, ''), bare + 's', bare + 'es'])].filter(Boolean)
}

/* 🚨 THE ANSWER COMES FROM derive-provenance, NOT FROM A SECOND MATCHER.
 *
 * The first version of this script re-implemented the name matching and produced
 * numbers that were impossible on their face: 18% layer-1 coverage for a kit
 * whose entire thesis is styling the platform, and "File upload [GOV.UK] —
 * missing" over a recipe called file-upload-dropzone that carries exactly that
 * alias. Two bugs, one cause. It read globalLayer.ts as if it were CSS (the
 * selectors are arguments to a template function, not text a CSS parser sees),
 * and it did not know about the SERVICE_ALIAS map that translates their names to
 * ours.
 *
 * Both were avoidable by not writing the second matcher at all. derive-provenance
 * already resolves every recipe to its sources; a source it CLAIMED is a
 * catalogue entry we cover, by definition. So this script runs it, reads what was
 * claimed, and only supplies the denominators. Two directions, one resolution —
 * they cannot disagree, because there is nothing left to disagree about. */
const prov = JSON.parse(execFileSync('node', [join(HERE, 'derive-provenance.mjs'), '--json'], {
  encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
}))
const CLAIMED = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() }
for (const rec of prov.assigned) {
  for (const src of rec.sources) {
    // "APG · Toolbar" → "Toolbar"; "USWDS · Process list" → "Process list";
    // "<button>" stays as it is.
    const bare = src.source.includes(' · ') ? src.source.split(' · ').slice(1).join(' · ') : src.source
    CLAIMED[src.layer].add(bare)
    for (const f of forms(bare)) CLAIMED[src.layer].add(f)
  }
  /* Everything else the recipe covers but did not need to CLAIM. A recipe is
   * justified by one source; a catalogue entry is covered by any recipe that
   * satisfies it, and those are different sets. */
  for (const c of rec.covers?.openui ?? []) for (const f of forms(c)) CLAIMED[3].add(f)
  for (const c of rec.covers?.service ?? []) {
    const bare = c.split(' · ').slice(1).join(' · ')
    for (const f of forms(bare)) CLAIMED[4].add(f)
  }
}
const claims = (layer, name) => forms(name).some((f) => CLAIMED[layer].has(f)) || CLAIMED[layer].has(name)

/* ── layer 1 · the platform ────────────────────────────────────────────────
 *
 * 🚨 THE NUMERATOR IS THE PLATFORM FLOOR, NOT THE RECIPES, and getting that
 * wrong reported 9% coverage for a kit whose thesis is styling the platform.
 * derive-provenance assigns layer 1 only when the element CARRIES the recipe's
 * primary class in the rendered DOM — its own strict rule, and the right one for
 * asking "is this recipe the styling of a platform element". But the floor styles
 * sixty elements that no recipe claims, because the floor is not a recipe. Two
 * different questions; I used one answer for both.
 *
 * The floor's selectors are the literal arguments to its w() wrapper, so they
 * read exactly. No CSS parser, no guessing: w('code, samp, var, kbd') means
 * those four elements are styled. */
const floorSrc = readFileSync(join(HERE, '../src/kit/globalLayer.ts'), 'utf8')
const FLOORED = new Set()
for (const m of floorSrc.matchAll(/\bw\(\s*'([^']+)'/g)) {
  for (const sel of m[1].split(',')) {
    const t = sel.trim().match(/^([a-z][a-z0-9]*)(\[[^\]]*\])?/)
    if (!t) continue
    FLOORED.add(t[1])
    if (t[2]) FLOORED.add(t[1] + t[2])
  }
}
const NO_RENDER = new Set(Object.keys(platform.html._no_render ?? {}).filter((k) => !k.startsWith('_')))
const l1 = { covered: [], missing: [], notApplicable: [] }
for (const group of ['controls', 'structure', 'content']) {
  for (const [el, path] of Object.entries(platform.html[group])) {
    const tag = el.replace(/\[.*/, '')
    if (NO_RENDER.has(tag)) { l1.notApplicable.push({ name: el, why: platform.html._no_render[tag] }); continue }
    const ok = FLOORED.has(el) || FLOORED.has(tag) || claims(1, `<${tag}>`) || claims(1, tag)
    ;(ok ? l1.covered : l1.missing).push({ name: el, group, url: platform.html.url + path })
  }
}

/* ⚠️ THE LAYERS OVERLAP, and not accounting for it invents gaps that are our
 * thesis working. Open UI lists "Textarea" and GOV.UK lists "Text input" as
 * COMPONENTS, because most design systems wrap the element in one. We do not
 * wrap it — the platform floor styles <textarea> and <input> directly, which is
 * the layer-1 rule and the whole argument for the floor. Reported as a gap that
 * reads "you are missing a textarea component", which is exactly backwards.
 *
 * So an entry the other layers list is checked against the floor first, and when
 * the floor covers it the row says so: it is a DEMOTION to the platform, made on
 * purpose, not an absence. */
const PLATFORM_NAMES = { textarea: 'textarea', textfield: 'input', textinput: 'input', text: 'input',
  checkbox: 'input[type=checkbox]', checkboxe: 'input[type=checkbox]', radio: 'input[type=radio]',
  radiogroup: 'input[type=radio]', radiobutton: 'input[type=radio]', select: 'select', label: 'label',
  detail: 'details', image: 'img', img: 'img', video: 'video', link: 'a', divider: 'hr',
  rangeslider: 'input[type=range]', range: 'input[type=range]', datepicker: 'input[type=date]',
  search: 'input[type=search]', meter: 'meter', progressindicator: 'progress', progres: 'progress',
  // GOV.UK's field-level patterns prescribe the PLAIN element — a single text
  // input for names, emails, phone numbers, bank details, NI numbers. That is
  // the floor. (Telephone numbers explicitly says: no country-code picker.)
  telephonenumber: 'input[type=tel]', emailaddresse: 'input[type=email]', emailaddress: 'input[type=email]',
  name: 'input', bankdetail: 'input', nationalinsurancenumber: 'input', heading: 'h1',
  ordered: 'ol', orderedlist: 'ol', unorderedlist: 'ul', paragraph: 'p', blockquote: 'blockquote',
  figure: 'figure', separator: 'hr', article: 'article', logo: 'img' }
const onTheFloor = (name) => {
  for (const f of forms(name)) {
    const el = PLATFORM_NAMES[f]
    if (el && (FLOORED.has(el) || FLOORED.has(el.replace(/\[.*/, '')))) return el
  }
  return null
}

/* ── layer 2 · APG ─────────────────────────────────────────────────────────── */
/* APG's page titles vs our anchor names, and the patterns the platform gives
 * outright. "Menu" is APG's "Menu and Menubar" page; our menus anchor to Menu
 * Button and Menubar, which are that page. Link is <a>. */
const APG_ALIAS = { Menu: ['Menubar', 'Menu Button', 'Menu and Menubar'] }
/* Decided, with the reason written down rather than left as a hole. */
const DECIDED = {
  Treegrid: 'a tree crossed with a grid — rows that expand AND cells that navigate. No service system publishes one; a tax form needs a table or a tree, not both at once. Not shipped, on purpose.',
  Logo: 'a brand asset, not a component. The header has a slot for it; there is nothing to style.',
}
const l2 = { covered: [], missing: [], decided: [] }
for (const [name, path] of Object.entries(platform.apg.patterns)) {
  const head = name.replace(/\s*\(.*/, '')
  const url = platform.apg.url + path.replace(/^\//, '')
  const ok = claims(2, name) || claims(2, head) ||
    (APG_ALIAS[head] ?? []).some((a) => claims(2, a)) ||
    [...CLAIMED[2]].some((c) => forms(String(c).replace(/\s*\(.*/, '')).includes(forms(head)[0]))
  if (ok) { l2.covered.push({ name, url }); continue }
  const floor = onTheFloor(head)
  if (floor) { l2.covered.push({ name, url, floor }); continue }
  if (DECIDED[head]) { l2.decided.push({ name, url, why: DECIDED[head] }); continue }
  l2.missing.push({ name, url })
}

/* ── layer 3 · Open UI ─────────────────────────────────────────────────────── */
/* Covered by TOKENS rather than a recipe. An icon "component" in a CSS kit is a
 * size ladder — --k-icon-xs/sm/md/chip — plus whatever glyph set the consumer
 * wires in; there is no .icon class to ship and no reason to invent one. */
const TOKEN_COVERED = { Icon: '--k-icon-xs · --k-icon-sm · --k-icon-md · --k-icon-chip' }
const l3 = { covered: [], missing: [] }
for (const [concept, v] of Object.entries(openui.names)) {
  const label = v.spelled ?? concept
  const hit = claims(3, label) || claims(3, concept)
  const floor = hit ? null : onTheFloor(label)
  const tokens = hit || floor ? null : (TOKEN_COVERED[label] ?? null)
  const row = { name: label, pct: v.pct, floor, tokens }
  ;(hit || floor || tokens ? l3.covered : l3.missing).push(row)
}

/* ── layer 4 · the service systems ─────────────────────────────────────────── */
const l4 = { covered: [], missing: [], pagePatterns: [], decided: [] }
for (const [system, sv] of Object.entries(services.systems)) {
  for (const kind of ['components', 'patterns']) {
    for (const [name, path] of Object.entries(sv[kind] ?? {})) {
      const url = sv.url.replace(/\/[^/]*\/?$/, '') + path
      const hit = claims(4, name)
      const floor = hit ? null : onTheFloor(name)
      const tokens = hit || floor ? null : (TOKEN_COVERED[name] ?? null)
      const row = { name, system, kind, floor, tokens, url }
      if (hit || floor || tokens) { l4.covered.push(row); continue }
      if (DECIDED[name]) { l4.decided.push({ ...row, why: DECIDED[name] }); continue }
      /* A PATTERN that no component resolves is a page composition — check
       * answers, confirmation page, question page. If it belongs anywhere it is
       * the section tier; it is not a missing component and is not listed as one. */
      if (kind === 'patterns') { l4.pagePatterns.push(row); continue }
      l4.missing.push(row)
    }
  }
}

// ── report ──────────────────────────────────────────────────────────────────
const line = (s = '') => console.log(s)
const pct = (a, b) => b === 0 ? '—' : Math.round((a / b) * 100) + '%'
const wrap = (items, indent = '      ') => {
  let row = indent
  const out = []
  for (const it of items) {
    if (row.length + it.length + 3 > 82) { out.push(row); row = indent }
    row += `${it} · `
  }
  out.push(row.replace(/ · $/, ''))
  return out.join('\n')
}
const tierOfIdRaw = (id) => (prov.tiers ?? {})[id] ?? 'component'

line()
line('  derive-coverage — THE MEASURE. Both directions of the four-layer derivation,')
line('  read together, so the set can be exact on paper before anything is built or cut.')
line('  ' + '─'.repeat(74))
line('  CORE = layer 2 ∪ layer 4 (normative behaviour, or a public service needs it).')
line('  FLOOR = layer 1 (the platform\'s elements). CHECK = layer 3 (recorded, never a')
line('  justification — Open UI is a census of what shadcn and its relatives ship, and')
line('  copying that census is the shortcut this derivation exists to undo).')
line()

/* ── forward: STAYS / LEAVES ────────────────────────────────────────────────── */
const stays = prov.stays ?? []
const leaves = prov.leaves ?? []
line(`  ══ STAYS — ${stays.length} component-tier recipes with a core line ══`)
line(wrap(stays))
line()
/* ⚠️ THE WEAK EDGE OF "L2 ∪ L4", made visible rather than averaged in. An APG
 * anchor can name the pattern of the PART rather than of the component: a card
 * with an expand button is not a Disclosure, it CONTAINS one; a chip is a Button
 * the way everything clickable is. Where the only core line is one of the
 * primitive patterns and no service system ships the component, "core" is doing
 * a lot of work. Listed so the criterion can be tightened by decision — "L2
 * counts when the pattern IS the component; when the pattern is a part, the
 * component needs L4 too" — not by me. */
const PRIMITIVE = new Set(['Disclosure', 'Button', 'Landmarks', 'Grid (for interactive rows)', 'Tooltip', 'Alert', 'Link'])
const byId = Object.fromEntries(prov.assigned.map((a) => [a.id, a]))
const primitiveOnly = stays.filter((id) => {
  const core = byId[id].sources.filter((x) => x.layer === 2 || x.layer === 4)
  return core.length > 0 && core.every((x) => x.layer === 2 && PRIMITIVE.has(x.source.replace(/^APG · /, '')))
})
if (primitiveOnly.length) {
  line(`     ⚠️ ${primitiveOnly.length} of them are core ONLY through a primitive APG pattern — the part, not the`)
  line('     component — and no service system ships them. Core under the current criterion;')
  line('     the criterion is the decision:')
  for (const id of primitiveOnly) line(`      ${id.padEnd(24)} ${byId[id].sources.filter((x) => x.layer === 2).map((x) => x.source).join(' · ')}`)
  line()
}
line(`  ══ LEAVES — ${leaves.length} component-tier recipes with NO core line ══`)
for (const l of leaves) line(`      ${l.id.padEnd(24)} ${l.why}`)
line()

/* ── reverse: MISSING ───────────────────────────────────────────────────────── */
line(`  ══ MISSING — core catalogue entries with nothing in the kit ══`)
const l2m = l2.missing, l4m = l4.missing
line(`     layer 2 · APG          ${l2.covered.length} of ${l2.covered.length + l2m.length + l2.decided.length} covered · ${l2m.length} missing · ${l2.decided.length} decided`)
if (l2m.length) line(wrap(l2m.map((r) => r.name)))
for (const d of l2.decided) line(`      decided  ${d.name} — ${d.why}`)
line(`     layer 4 · services     ${l4.covered.length} of ${l4.covered.length + l4m.length} components covered · ${l4m.length} missing`)
if (l4m.length) line(wrap(l4m.map((r) => `${r.name} [${r.system}]`)))
for (const d of l4.decided) line(`      decided  ${d.name} — ${d.why}`)
line()
line(`  ── page patterns — ${l4.pagePatterns.length}: compositions, not components. If they belong`)
line('     anywhere it is the section tier; they are listed, not counted as gaps:')
line(wrap(l4.pagePatterns.map((r) => `${r.name} [${r.system}]`)))
line()

/* ── the floor and the check ────────────────────────────────────────────────── */
line(`  ── FLOOR · layer 1        ${l1.covered.length} of ${l1.covered.length + l1.missing.length} rendering elements styled` +
  ` · ${l1.notApplicable.length} wrappers not applicable`)
if (l1.missing.length) {
  line('     the platform has an opinion the floor does not override yet (one rule each):')
  line(wrap(l1.missing.map((r) => `<${r.name}>`)))
}
line(`  ── CHECK · layer 3        ${l3.covered.length} of ${l3.covered.length + l3.missing.length} Open UI concepts present` +
  ` (${l3.covered.filter((r) => r.floor).length} on the floor, ${l3.covered.filter((r) => r.tokens).length} as tokens)`)
if (l3.missing.length) line(wrap(l3.missing.map((r) => `${r.name} (${r.pct}%)`)))
line()

/* ── granularity ────────────────────────────────────────────────────────────── */
line('  ── GRANULARITY — one concept split across recipes (a decision, not a default):')
const FAMILIES = { calendar: /^calendar(-|$)/, 'input variants': /^(number|password|search|phone)input$|^form-primitives$/, form: /^form(-|$)/ }
const everyone = [...stays, ...(prov.coreSections ?? []), ...leaves.map((l) => l.id)]
for (const [stem, re] of Object.entries(FAMILIES)) {
  const ids = everyone.filter((id) => re.test(id))
  if (ids.length > 1) line(`      ${stem.padEnd(16)} ${ids.length} recipes  ${ids.join(' · ')}`)
}
line()

const coreTotal = l2.covered.length + l2m.length + l2.decided.length + l4.covered.length + l4m.length
const coreCov = l2.covered.length + l4.covered.length + l2.decided.length
line('  ' + '─'.repeat(74))
line(`  core coverage: ${coreCov} of ${coreTotal} — ${pct(coreCov, coreTotal)}  (decided gaps count as answered)`)
line(`  the set on paper: ${stays.length} stay · ${leaves.length} leave · ${l2m.length + l4m.length} to add · ${l4.pagePatterns.length} page patterns for the section tier`)
process.exit(0)
