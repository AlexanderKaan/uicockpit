#!/usr/bin/env node
/**
 * derive-provenance — where every component comes from, derived not decided.
 *
 *   npm run dev  &&  node scripts/derive-provenance.mjs [--write]
 *
 * THE RULE. Every component carries a provenance line or leaves. Four layers,
 * looked up in order, because the order IS the design rule:
 *
 *   1 · MDN / HTML   the platform has it → we STYLE it, we never rebuild it
 *   2 · WAI-ARIA APG a named pattern with a normative behaviour spec
 *   3 · Open UI      what the field converged on independently
 *   4 · GOV.UK · NL Design System · USWDS   what a public service needs
 *
 * A component that needs a fifth line — "because we liked it" — leaves. This
 * script's real output is not the assignments; it is THAT LIST, printed rather
 * than hidden, because it is the V1 cut list and nobody can argue with it.
 *
 * 🔑 THREE OF THE FOUR SOURCES ARE ALREADY IN THIS REPO, machine-readable, and
 * were being used for something narrower:
 *   - `src/kit/apg.ts` has 59 anchors and 51 written reasons for having none
 *   - `scripts/data/openui-names.json` has 51 concepts × 27 systems, captured
 *     for the naming gate
 *   - layer 1 is the HTML element list, and does not need capturing at all
 *
 * ⚠️ LAYER 1 IS MEASURED, NOT ASSERTED. "This is the styling of a platform
 * element" is a claim about the rendered DOM — which tag actually carries the
 * primary class — so it is read off the page, not out of a table. Writing it by
 * hand is how you end up with `.numinput` declaring the Spinbutton pattern over
 * an <input> with no type: an assertion nobody executed.
 *
 * ⚠️ AND IT REFUSES TO GUESS. A source is recorded only when it can be pointed
 * at: an element name, a pattern name, a system's own component name. "Web
 * convention" is not a source. The unassigned list is the honest answer and the
 * whole point; padding it would make the gate worthless, because a provenance
 * that can be back-fitted proves nothing.
 */
import { chromium } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const WRITE = process.argv.includes('--write')
const JSON_OUT = process.argv.includes('--json')

const recipeSrc = readFileSync(join(HERE, '../src/kit/recipes/index.ts'), 'utf8')
const apgSrc = readFileSync(join(HERE, '../src/kit/apg.ts'), 'utf8')
const openui = JSON.parse(readFileSync(join(HERE, 'data/openui-names.json'), 'utf8'))
const services = JSON.parse(readFileSync(join(HERE, 'data/service-systems.json'), 'utf8'))

/* ---- the tier, read from the segment graph -------------------------------- *
 * Not every recipe is a COMPONENT, and asking "which design system ships this
 * component" about the grid is a category error that inflates the cut list by a
 * third. The distinction already exists and is already maintained — segments.ts
 * declares the tier ladder — so it is read rather than re-decided here.
 *
 * FOUNDATION is the spacing/motion/layout substrate: `composition` is .num and
 * .eyebrow, `roll-down-item-stagger` is a keyframe schedule, `layout-primitives`
 * is the bento grid. SECTION is a page shell. Neither is the kind of thing GOV.UK
 * has a page for, and neither leaves for want of one. */
const segSrc = readFileSync(join(HERE, '../src/kit/segments.ts'), 'utf8')
const blockOfSeg = (name) => (segSrc.match(new RegExp(`export const ${name}[^=]*=\\s*[\\[{]([\\s\\S]*?)\\n[\\]}]`, 'm')) ?? ['', ''])[1]
const FOUNDATION_SRC = blockOfSeg('FOUNDATIONS')
const SECTION_SRC = blockOfSeg('SECTION_USES')
const tierOfId = (id) => {
  const esc = id.replace(/-/g, '\\-')
  if (new RegExp(`'${esc}'`).test(FOUNDATION_SRC)) return 'foundation'
  if (new RegExp(`(^|\\n)\\s*'?${esc}'?\\s*:`).test(SECTION_SRC)) return 'section'
  return 'component'
}

/* ---- the recipes, and the class each one stands for ----------------------- */
const RECIPES = []
/* ⚠️ TOLERANT OF FIELD ORDER. This required `section:` on the line directly after
 * `id:`, so adding a `root:` field between them silently dropped twelve recipes
 * and the report read 98 of 110 without saying anything was missing. A parser
 * that depends on two fields being adjacent is a parser that breaks the next
 * time somebody adds a third. */
for (const m of recipeSrc.matchAll(/^    id: '([\w-]+)',\n(?:    \w+: [^\n]*\n)*?    section: ['"`]([^'"`]+)['"`]/gm)) {
  const [, id, section] = m
  const at = recipeSrc.indexOf(`    id: '${id}',`)
  const end = recipeSrc.indexOf('\n  },', at)
  const block = recipeSrc.slice(at, end === -1 ? at + 8000 : end)
  /* ⚠️ THE FIRST SELECTOR IS NOT ALWAYS THE COMPONENT. `passwordinput`'s recipe
   * opens with `.pwinput__eye` — the reveal BUTTON — so the component was judged
   * on its own decoration and came back sourceless while it is literally
   * <input type="password">. Prefer the class that reads like the id, then a
   * root-looking one, and only then the first. */
  /* THE RECIPE'S OWN ANSWER WINS. Twelve name their class differently from their
   * id, and guessing at that is what put the Checkbox pattern on .pwinput. */
  const declaredRoot = block.match(/^    root: '([^']+)'/m)?.[1]
  const all = [...block.matchAll(/^\.([a-z][\w-]*)/gm)].map((m) => m[1])
  const key = id.replace(/[-_]/g, '')
  const roots = all.filter((c) => !c.includes('__') && !c.includes('--'))
  /* And if the recipe defines NO root class at all — `passwordinput` styles only
   * .pwinput__eye, .pwinput__field, .pwinput__bar — the BEM base of the first
   * one is the root by construction. That is a fact about the class name, not a
   * guess: `.pwinput__eye` belongs to `.pwinput` and nothing else. */
  const bemBase = all[0] ? all[0].split('__')[0].split('--')[0] : null
  const cls = declaredRoot
    ?? all.find((c) => c.replace(/[-_]/g, '') === key)
    ?? roots.find((c) => key.includes(c.replace(/[-_]/g, '')))
    ?? roots.sort((a, b) => a.length - b.length)[0]
    ?? bemBase ?? all[0] ?? null
  RECIPES.push({ id, section, cls })
}

/* ---- layer 2 · APG ------------------------------------------------------- */
const APG_ANCHOR = {}
for (const m of apgSrc.matchAll(/^  '?([\w-]+)'?: \{\n([\s\S]*?)\n  \},$/gm)) {
  const pattern = m[2].match(/pattern: '([^']*)'/)?.[1]
  const url = m[2].match(/url: `?\$?\{?APG\}?([^`',]*)/)?.[1]
  if (pattern) APG_ANCHOR[m[1]] = { pattern, url: url ? `https://www.w3.org/WAI/ARIA/apg${url}` : undefined }
}

/* ---- layer 3 · Open UI --------------------------------------------------- */
/* Matched on the CONCEPT WORD, normalised the same way the naming gate does, so
 * the two agree by construction rather than by coincidence. */
const norm = (s) => s.toLowerCase().replace(/[\s-_]/g, '').replace(/(\w+?)(e|er)?(s|ing)$/, '$1')
const OPENUI = {}
/* ⚠️ NO 30% BAR HERE. That threshold belongs to the NAMING gate, which asks "is
 * this the word the field uses" — below it the field genuinely disagrees and the
 * name is ours. Provenance asks something else: does the field ship this concept
 * at all. "7 of 27 systems" is weaker evidence than "25 of 27" and it is still
 * evidence, so every surveyed concept counts and the number is printed. */
/* ⚠️ INDEX EVERY FORM, ON BOTH SIDES. The comment two blocks down claims the
 * "Badges & pills" case was fixed; it was not, and the report went on printing
 * badges-pills as sourceless while `badge` sat in this very list. The stemmer is
 * asymmetric and over-eager: it turns "badges" into "badg", and "badge" itself
 * was never tried. So both the concept and the query are registered under three
 * forms — stemmed, bare, and bare-minus-a-plural-s — and the two finally meet.
 *
 * The lesson is not about plurals. A matcher that fails silently reports a
 * MISSING SOURCE, and the missing-source list is the cut list — the one thing
 * here anybody will act on. A matching bug in this script deletes components. */
const forms = (x) => {
  const bare = String(x).toLowerCase().replace(/[\s-_&]/g, '')
  return [norm(x), bare, bare.replace(/s$/, ''), bare + 's']
}
for (const [concept, v] of Object.entries(openui.names)) {
  for (const k of forms(concept)) {
    if (!k) continue
    if (!OPENUI[k] || OPENUI[k].pct < v.pct) OPENUI[k] = { ...v, concept }
  }
}

/* ---- layer 4 · the service systems --------------------------------------- *
 *
 * 🚨 THIS USED TO BE A HAND-WRITTEN TABLE OF ELEVEN, and it was the same mistake
 * this whole arc is about: a reference somebody typed measures what they typed.
 * Eleven recipes could carry a layer-4 source and no twelfth ever would, because
 * nobody would think to add it — so the NO-SOURCE list, which is the cut list and
 * the one output anyone acts on, was too long by however many components GOV.UK,
 * USWDS and the NL Design System ship that we had not happened to notice.
 *
 * The three catalogues are captured in data/service-systems.json now and matched
 * the same way layer 3 is. What stays hand-written is only the ALIAS map below:
 * the handful of places where their name for a thing is not derivable from ours
 * (`errorsummary` → "Error summary" derives fine; `file-upload-dropzone` →
 * "File input" does not). An alias is a translation, not a decision — it names
 * their component, and their page settles it in one click. */
const SERVICE_ALIAS = {
  'file-upload-dropzone': ['File upload', 'File input'],
  requirements: ['Passwords'],
  langnav: ['Language selector'],
  'memorable-date': ['Date input', 'Memorable date'],
  errorsummary: ['Error summary'],
  sitefooter: ['Footer', 'Page footer'],
  charcount: ['Character count'],
  processlist: ['Process list'],
  tasklist: ['Task list'],
  stepper: ['Step indicator', 'Step by step navigation'],
  wizardstepper: ['Step indicator', 'Step by step navigation'],
  'page-head': ['Page header'],
  codeblock: ['Code block'],
  prose: ['Prose'],
  infocard: ['Inset text', 'Summary box'],
  'action-panel': ['Spotlight section', 'Summary box'],
  auth: ['Sign in'],
  'description-list': ['Summary list', 'Data list'],
  banner: ['Banner', 'Phase banner'],
  identifier: ['Identifier'],
  skiplink: ['Skip link'],
  inpagenav: ['In-page navigation'],
  fieldset: ['Fieldset'],
  sidebar: ['Side navigation', 'Sidenav'],
}

/* One index over all three catalogues, keyed by every form of the component's
 * own name — so a recipe whose id or section already matches lands without an
 * alias, which is most of them. */
const SERVICE_INDEX = {}
for (const [system, sv] of Object.entries(services.systems)) {
  for (const kind of ['components', 'patterns']) {
    for (const [name, path] of Object.entries(sv[kind] ?? {})) {
      for (const k of forms(name)) {
        if (!k || SERVICE_INDEX[k]) continue
        SERVICE_INDEX[k] = { system, name, url: sv.url.replace(/\/[^/]*\/?$/, '') + path, kind }
      }
    }
  }
}
const serviceFor = (r) => {
  for (const alias of SERVICE_ALIAS[r.id] ?? []) {
    for (const k of forms(alias)) if (SERVICE_INDEX[k]) return SERVICE_INDEX[k]
  }
  const words = [...forms(r.id), ...forms(r.section)]
  for (const w of words) if (SERVICE_INDEX[w]) return SERVICE_INDEX[w]
  return null
}

/* ---- layer 1 · MEASURED off the rendered page ----------------------------- *
 * The platform elements worth styling rather than rebuilding. A component is
 * layer 1 when the element CARRYING its primary class is one of these — not when
 * one appears somewhere inside it, or every card in the kit would qualify by
 * containing a <button>. */
/* ⚠️ AND THE ELEMENT MUST BE THE COMPONENT, not merely what it is built from.
 * The first run put `processlist`, `skiplink`, `tasklist` and `requirements` in
 * layer 1 because they render <ol>, <a> and <ul> — which is true and is not a
 * provenance. <ol> does not provide a process list; <a> does not provide a skip
 * link. Those exist because USWDS and GOV.UK ship them, which is layer 4 and a
 * far stronger claim.
 *
 * So the map below carries, per element, THE CONCEPT THE ELEMENT ITSELF NAMES,
 * and layer 1 applies only when that concept matches the recipe's own. It is a
 * list, and a legitimate one: these are facts about HTML, not a list of our
 * subjects. Generic containers (<div>, <span>, <ul>, <ol>, <figure>) name no
 * component and are deliberately absent — they are building material. */
const PLATFORM = {
  DIALOG:   { el: '<dialog>',   concept: 'dialog' },
  DETAILS:  { el: '<details>',  concept: 'disclosure' },
  SELECT:   { el: '<select>',   concept: 'select' },
  TABLE:    { el: '<table>',    concept: 'table' },
  PROGRESS: { el: '<progress>', concept: 'progress' },
  METER:    { el: '<meter>',    concept: 'meter' },
  FIELDSET: { el: '<fieldset>', concept: 'fieldset' },
  OUTPUT:   { el: '<output>',   concept: 'output' },
  TEXTAREA: { el: '<textarea>', concept: 'textarea' },
  DL:       { el: '<dl>',       concept: 'descriptionlist' },
  BUTTON:   { el: '<button>',   concept: 'button' },
  INPUT:    { el: '<input>',    concept: 'input' },
  KBD:      { el: '<kbd>',      concept: 'kbd' },
  CODE:     { el: '<code>',     concept: 'code' },
  HR:       { el: '<hr>',       concept: 'separator' },
  TIME:     { el: '<time>',     concept: 'time' },
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })
await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.evaluate(() => {
  for (const el of document.querySelectorAll('[aria-expanded="false"], details:not([open])')) {
    try { el.tagName === 'DETAILS' ? (el.open = true) : el.click() } catch { /* a refusing trigger is not a finding */ }
  }
})
await page.waitForTimeout(400)

const measured = await page.evaluate((classes) => {
  const out = {}
  for (const cls of classes) {
    if (!cls) continue
    const el = document.querySelector('.' + cls)
    if (!el) { out[cls] = null; continue }
    /* A field component's primary class is its WRAPPER — .numinput, .pwinput —
     * and a wrapper being a <div> is correct. The type claim is about the input
     * INSIDE it, so both are recorded and the check below asks the right one. */
    const inner = el.matches('input') ? el : el.querySelector('input')
    out[cls] = { tag: el.tagName, type: el.getAttribute('type') ?? null,
                 innerTag: inner ? inner.tagName : null, innerType: inner ? inner.getAttribute('type') : null }
  }
  return out
}, RECIPES.map((r) => r.cls))
await browser.close()

/* ---- the assignment ------------------------------------------------------ *
 * ⚠️ EVERY LAYER THAT APPLIES, not the first one that hits. The first version
 * stopped at the earliest match and put `skiplink`, `tasklist` and `errorsummary`
 * in layer 2 on a GENERIC APG anchor (Landmarks) while GOV.UK ships components
 * with exactly those names — the weaker source won because it was looked up
 * first. Forcing a single answer also throws away the most useful fact of all:
 * a component backed by three independent sources is stronger evidence than one
 * backed by one, and that is precisely what a procurement officer is reading
 * for. So the component carries every source it has, and the cut list is the
 * components that have NONE. */
const assigned = []
const unassigned = []
const violations = []
for (const r of RECIPES) {
  const dom = r.cls ? measured[r.cls] : null
  const sources = []

  /* Two different statements, and the first version conflated them: NAMING a
   * platform element is the provenance (why this exists at all); RENDERING it is
   * conformance to the layer-1 rule. `kbd` has <kbd> as its source and does not
   * use it — it belongs in layer 1 AND in the violations, not in the cut list. */
  /* The TYPE is part of the element's identity: a phone field is
   * <input type="tel"> and nothing else, so a component named for one is checked
   * against the type as well as the tag. */
  const INPUT_TYPE = { passwordinput: 'password', phoneinput: 'tel', searchinput: 'search', numberinput: 'number' }
  const wantType = INPUT_TYPE[r.id]
  const namesPlatform = wantType
    ? ['INPUT', { el: `<input type="${wantType}">`, concept: 'input', type: wantType }]
    : Object.entries(PLATFORM).find(([tag, v]) =>
        norm(r.id) === v.concept || norm(r.section) === v.concept || norm(r.id) === norm(tag))
  const plat = dom && PLATFORM[dom.tag]
  const rendersItsOwn = plat && (norm(r.id).includes(plat.concept) || norm(r.section).includes(plat.concept)
      || plat.concept.includes(norm(r.id)) || plat.concept.includes(norm(r.section)))
  const p1 = rendersItsOwn ? plat : (namesPlatform ? namesPlatform[1] : null)
  if (p1) {
    const el = rendersItsOwn && dom.tag === 'INPUT' && dom.type ? `<input type="${dom.type}">` : p1.el
    sources.push({ layer: 1, source: el, because: `The platform provides ${el}; this recipe styles it rather than rebuilding it.`,
      url: `https://developer.mozilla.org/en-US/docs/Web/HTML/Element/${el.replace(/[<>]|\s.*$/g, '')}` })
  }
  if (APG_ANCHOR[r.id]) {
    const a = APG_ANCHOR[r.id]
    sources.push({ layer: 2, source: `APG · ${a.pattern}`, because: `WAI-ARIA APG names the ${a.pattern} pattern and specifies its behaviour.`, url: a.url })
  }
  /* ⚠️ MATCH ON THE WORDS, not on the whole label. "Badges & pills" normalises
   * to `badgespill` and matched nothing, so a concept 37% of the field ships
   * came back as having no source. A matching failure that reads as a missing
   * source is the worst possible output here: it inflates the cut list, and the
   * cut list is the thing people will act on. */
  /* ⚠️ AND TRY THE BARE WORD TOO. The shared normaliser turns "badges" into
   * "badg" while Open UI's own key is "badge" — the stemmer is asymmetric, so
   * the two never met and a concept 37% of the field ships read as sourceless. */
  const words = [...forms(r.id), ...forms(r.section),
    ...String(r.section).split(/[^A-Za-z]+/).filter(Boolean).flatMap(forms),
    ...String(r.id).split('-').flatMap(forms)]
  const hit = words.map((w) => OPENUI[w]).find(Boolean)
  if (hit) {
    sources.push({ layer: 3, source: `Open UI · ${hit.spelled}`, because: `${hit.systems} of 27 surveyed design systems ship this independently (${hit.pct}%).`, url: openui._source })
  }
  const sv = serviceFor(r)
  if (sv) {
    sources.push({ layer: 4, source: `${sv.system} · ${sv.name}`, because: `${sv.system} ships this as a ${sv.kind === 'patterns' ? 'pattern' : 'component'} because a public service needs it.`, url: sv.url })
  }

  if (sources.length) assigned.push({ ...r, sources })
  else unassigned.push({ ...r, renders: dom ? dom.tag : 'NOT ON THE WALL' })

  /* 🚨 THE LAYER-1 VIOLATION. The rule is "if the platform has it, we style it,
   * we do not rebuild it" — so a recipe whose NAME is a platform element while
   * its demo renders something else is not a provenance question, it is a
   * defect. This is the class `.numinput` belonged to: a spinbutton built on a
   * text field. Reported separately because it is the most actionable thing the
   * derivation produces. */
  if (namesPlatform && dom) {
    const want = namesPlatform[1]
    if (want.type) {
      // A typed field: judge the input, wherever it sits.
      if (dom.innerTag !== 'INPUT' || dom.innerType !== want.type) {
        violations.push({ ...r, wants: want.el,
          renders: dom.innerTag ? `<${dom.innerTag.toLowerCase()} type="${dom.innerType ?? '(none)'}">` : 'no input at all' })
      }
    } else if (dom.tag !== namesPlatform[0]) {
      violations.push({ ...r, wants: want.el, renders: `<${dom.tag.toLowerCase()}>` })
    }
  }
}

if (JSON_OUT) { console.log(JSON.stringify({ assigned, unassigned }, null, 2)); process.exit(0) }

const inLayer = (n) => assigned.filter((a) => a.sources.some((x) => x.layer === n))
console.log(`derive-provenance — ${RECIPES.length} recipes against four sources; every source that applies, not the first that hits\n`)
for (const n of [1, 2, 3, 4]) {
  const rows = inLayer(n)
  const label = { 1: 'MDN / HTML — the platform has it, we style it', 2: 'WAI-ARIA APG — a named pattern with a spec',
    3: 'Open UI — the field converged on it', 4: 'GOV.UK · NL · USWDS — a public service needs it' }[n]
  console.log(`  Layer ${n} · ${label} — ${rows.length}`)
  console.log('      ' + rows.map((r) => r.id).join(' · ') + '\n')
}
const multi = assigned.filter((a) => a.sources.length > 1)
console.log(`  ${multi.length} carry more than one source — the strongest evidence in the set:`)
for (const m of multi.slice(0, 12)) console.log(`      ${m.id.padEnd(24)} ${m.sources.map((x) => 'L' + x.layer).join(' + ')}  ${m.sources.map((x) => x.source).join('  ·  ')}`)
if (multi.length > 12) console.log(`      …${multi.length - 12} more`)

if (violations.length) {
  console.log(`\n  🚨 LAYER-1 VIOLATIONS — ${violations.length}. The platform names this component and the demo`)
  console.log('     renders something else. Not a provenance question — a defect.\n')
  for (const v of violations) console.log(`      ${v.id.padEnd(24)} wants ${v.wants.padEnd(12)} renders <${v.renders.toLowerCase()}>`)
}

/* ⚠️ THE CUT LIST IS THE COMPONENT-TIER HALF, and separating it is the difference
 * between a list somebody can act on and a list that gets argued about. The
 * substrate and the page shells are printed too — silently dropping them would be
 * the "quiet exclusion" this repo has been bitten by — but they are printed as
 * what they are, not as candidates for deletion. */
const notComponents = unassigned.filter((u) => tierOfId(u.id) !== 'component')
const cutList = unassigned.filter((u) => tierOfId(u.id) === 'component')

console.log(`\n  ⛔ NO SOURCE — ${unassigned.length} of ${RECIPES.length}.\n`)

if (notComponents.length) {
  console.log(`     ${notComponents.length} of them are NOT COMPONENTS — the substrate and the page shells,`)
  console.log('     read from the tier ladder in segments.ts. "Which design system ships this')
  console.log('     component" is the wrong question about a grid, and they do not leave for')
  console.log('     want of an answer:\n')
  for (const u of notComponents) console.log(`      ${tierOfId(u.id).padEnd(11)} ${u.id.padEnd(28)} .${u.cls ?? '—'}`)
  console.log()
}

console.log(`     ⛔ THE V1 CUT LIST IS THE REMAINING ${cutList.length}. These are component-tier and`)
console.log('     the only line left for them is "because we liked it", which is not a')
console.log('     provenance:\n')
for (const u of cutList) console.log(`      ${u.id.padEnd(28)} .${u.cls ?? '—'}  renders ${u.renders}`)

if (WRITE) {
  const path = join(HERE, 'data/provenance.json')
  writeFileSync(path, JSON.stringify({
    _derived: 'scripts/derive-provenance.mjs — layer 1 measured off the rendered DOM, 2/3 from apg.ts + openui-names.json, 4 hand-written and named',
    _layers: { 1: 'MDN / HTML', 2: 'WAI-ARIA APG', 3: 'Open UI', 4: 'GOV.UK · NL Design System · USWDS' },
    assigned: Object.fromEntries(assigned.map((a) => [a.id, a.sources])),
    unassigned: unassigned.map((u) => u.id),
  }, null, 2) + '\n')
  console.log(`\n  → written to scripts/data/provenance.json`)
}
