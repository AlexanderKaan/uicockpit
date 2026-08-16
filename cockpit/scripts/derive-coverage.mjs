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
const l1 = { covered: [], missing: [] }
for (const group of ['controls', 'structure', 'content']) {
  for (const [el, path] of Object.entries(platform.html[group])) {
    const tag = el.replace(/\[.*/, '')
    const ok = FLOORED.has(el) || FLOORED.has(tag) || claims(1, `<${tag}>`) || claims(1, tag)
    ;(ok ? l1.covered : l1.missing).push({ name: el, group, url: platform.html.url + path })
  }
}

/* ── layer 2 · APG ─────────────────────────────────────────────────────────── */
const l2 = { covered: [], missing: [] }
for (const [name, path] of Object.entries(platform.apg.patterns)) {
  // "Grid (date grid)" claims "Grid"; match on the head of the name too.
  const head = name.replace(/\s*\(.*/, '')
  const ok = claims(2, name) || claims(2, head) ||
    [...CLAIMED[2]].some((c) => forms(String(c).replace(/\s*\(.*/, '')).includes(forms(head)[0]))
  ;(ok ? l2.covered : l2.missing).push({ name, url: platform.apg.url + path.replace(/^\//, '') })
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
  search: 'input[type=search]', meter: 'meter', progressindicator: 'progress', progres: 'progress' }
const onTheFloor = (name) => {
  for (const f of forms(name)) {
    const el = PLATFORM_NAMES[f]
    if (el && (FLOORED.has(el) || FLOORED.has(el.replace(/\[.*/, '')))) return el
  }
  return null
}

/* ── layer 3 · Open UI ─────────────────────────────────────────────────────── */
const l3 = { covered: [], missing: [] }
for (const [concept, v] of Object.entries(openui.names)) {
  const label = v.spelled ?? concept
  const floor = (!claims(3, label) && !claims(3, concept)) ? onTheFloor(label) : null
  const row = { name: label, pct: v.pct, floor }
  ;(claims(3, label) || claims(3, concept) || floor ? l3.covered : l3.missing).push(row)
}

/* ── layer 4 · the service systems ─────────────────────────────────────────── */
const l4 = { covered: [], missing: [] }
for (const [system, sv] of Object.entries(services.systems)) {
  for (const kind of ['components', 'patterns']) {
    for (const [name, path] of Object.entries(sv[kind] ?? {})) {
      const floor = claims(4, name) ? null : onTheFloor(name)
      const row = { name, system, kind, floor, url: sv.url.replace(/\/[^/]*\/?$/, '') + path }
      ;(claims(4, name) || floor ? l4.covered : l4.missing).push(row)
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

line()
line('  derive-coverage — the four layers as DENOMINATORS')
line('  ' + '─'.repeat(70))
line('  derive-provenance asks whether every recipe has a source, and the answer is')
line('  yes. That proves nothing was invented. THIS asks whether every source has a')
line('  recipe — the only direction that can prove nothing was missed, which is what')
line('  turns a justified set into a derived one.')
line()

const layers = [
  ['1 · MDN / HTML — the platform has it, we style it', l1, (r) => r.name],
  ['2 · WAI-ARIA APG — a named pattern with a spec', l2, (r) => r.name],
  ['3 · Open UI — the field converged on it', l3, (r) => `${r.name} (${r.pct}%)`],
  ['4 · GOV.UK · NL · USWDS — a public service needs it', l4, (r) => `${r.name} [${r.system}]`],
]
for (const [title, layer, fmt] of layers) {
  const total = layer.covered.length + layer.missing.length
  line(`  Layer ${title}`)
  line(`    ${layer.covered.length} of ${total} covered — ${pct(layer.covered.length, total)}`)
  if (layer.missing.length) {
    line(`    ⛔ ${layer.missing.length} in the catalogue with nothing in the kit:`)
    line(wrap(layer.missing.map(fmt)))
  }
  line()
}

const totalCov = layers.reduce((a, [, l]) => a + l.covered.length, 0)
const totalAll = layers.reduce((a, [, l]) => a + l.covered.length + l.missing.length, 0)
line('  ' + '─'.repeat(70))
line(`  ${totalCov} of ${totalAll} catalogue entries covered — ${pct(totalCov, totalAll)}`)
line()
line('  ⚠️ Read the layers separately, never averaged. A missing layer-1 element is')
line('     a rule for the platform floor; a missing layer-2 pattern is a component')
line('     with a behaviour spec attached; a missing layer-3 concept is only')
line('     evidence that other design systems ship it, and design systems copy each')
line('     other. They are not the same kind of debt and one number hides that.')
process.exit(0)
