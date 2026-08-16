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
 * ⚠️ LAYER 3 IS A CHECK, NOT A SOURCE (decided 2026-08-16, Sprint I). Open UI's
 * matrix is a census of what 27 design systems ship — shadcn, Material, Radix and
 * their relatives. "The field ships it" therefore means "shadcn has it", laundered
 * through a survey; and the components this kit started with were copied from
 * shadcn and Tailwind UI. As a reason for a component to EXIST that is circular
 * with the exact problem being fixed. As a check — do we call it what the field
 * calls it, does the field ship it too — it stays useful, and it is still looked
 * up and still recorded. It just no longer counts toward CORE.
 *
 *   CORE  = layer 2 ∪ layer 4  (normative behaviour, or a public service needs it)
 *   FLOOR = layer 1            (the platform's own elements — the floor's job)
 *   CHECK = layer 3            (recorded, never a justification)
 *
 * A component with no line from 2 or 4 is reported by name — census-only, or
 * platform-only where the floor already styles the element — because that is
 * the list somebody will act on. Nothing here is a fifth line; "because we liked
 * it" is what layer 3 turns out to have been.
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
/* Open UI's names for things we ship under another word. Same rule as
 * SERVICE_ALIAS: a translation, checkable against their page, never a decision. */
const OPENUI_ALIAS = {
  dialog: ['Modal', 'Dialog'],
  'select-trigger': ['Select.Popup', 'Select'],
  'dropdown-menu': ['Dropdown', 'Menu'],
  'pagination-breadcrumb': ['Breadcrumb', 'Pagination'],
  form: ['Textfield', 'Input', 'Text', 'Label', 'Textarea', 'Checkbox', 'Radio', 'Radio Group'],
  'switch-toggle': ['Switch', 'Toggle'],
  'sheet-drawer': ['Drawer'],
  'badges-pills': ['Badge', 'Tag'],
  'file-upload-dropzone': ['File'],
}
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
  requirements: ['Passwords', 'Validation'],
  langnav: ['Language selector'],
  'memorable-date': ['Date input', 'Memorable date', 'Dates'],
  errorsummary: ['Error summary', 'Recover from validation errors'],
  sitefooter: ['Footer', 'Page footer'],
  charcount: ['Character count'],
  processlist: ['Process list'],
  tasklist: ['Task list', 'Task list pages'],
  stepper: ['Step indicator', 'Step by step navigation'],
  wizardstepper: ['Step indicator', 'Step by step navigation'],
  'page-head': ['Page header'],
  codeblock: ['Code block'],
  prose: ['Prose', 'Article'],
  infocard: ['Inset text', 'Summary box'],
  'action-panel': ['Spotlight section', 'Summary box'],
  auth: ['Sign in', 'Create accounts'],
  'description-list': ['Summary list', 'Data list'],
  /* .banner is "page-level alert, persistent until dismissed, at the top of the
   * content" — verified in the recipe, not assumed — which is what GOV.UK calls a
   * Notification banner and USWDS a Site alert. */
  banner: ['Banner', 'Phase banner', 'Notification banner', 'Site alert'],
  identifier: ['Identifier'],
  skiplink: ['Skip link'],
  inpagenav: ['In-page navigation'],
  fieldset: ['Fieldset'],
  sidebar: ['Side navigation', 'Sidenav'],
  dialog: ['Modal'],
  'pagination-breadcrumb': ['Breadcrumbs', 'Breadcrumb', 'Breadcrumb navigation', 'Pagination'],
  appbar: ['Navigation bar', 'Service navigation', 'Header'],
  /* ⚠️ THE ALIASES GO WHERE THE CLASSES ARE. The first version hung "Text input",
   * "Form field", "Textbox" on form-primitives — five rules, the number/password/
   * search/phone variants — while `form` (42 rules: .in .lab .field .checkbox
   * .radio .tx .field__error) sat on the census-only list as if the most core
   * recipe in the kit were a shadcn-ism. Verified against the class list, not the
   * recipe name. */
  form: ['Form field', 'Text input', 'Textbox', 'Textarea', 'Error message', 'Checkboxes', 'Checkbox', 'Radios', 'Radio buttons', 'Radio button', 'Validation'],
  'form-primitives': ['Password input', 'Search'],
  list: ['List', 'Collection', 'Link list', 'Icon list'],
  'calendar-range': ['Date range picker'],
  calendar: ['Date picker', 'Time picker'], // .timefield lives inside the calendar recipe
  'badges-pills': ['Badge', 'Status badge', 'Tag'],
  card: ['Card', 'Surface'],
  'select-trigger': ['Select'],
  combobox: ['Combo box'],
  slider: ['Range slider'],
  searchinput: ['Search'],
  'sheet-drawer': ['Drawer'],
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
/* ⚠️ AN ALIAS KEYED ON A NON-RECIPE IS A SILENT MISS. Two were: 'checkbox-radio'
 * (a gallery slug, not a recipe id) and 'headings' (no such recipe). They would
 * have sat in the map forever, matching nothing, while the entries they were
 * meant to resolve stayed on the gap list. So the maps are checked against the
 * recipe list on load and a stray key throws — the whole point of Sprint I is
 * that a miss here is a phantom worklist. */
{
  const ids = new Set(RECIPES.map((r) => r.id))
  for (const k of [...Object.keys(SERVICE_ALIAS), ...Object.keys(OPENUI_ALIAS)]) {
    if (!ids.has(k)) throw new Error(`alias map names "${k}", which is not a recipe id — the alias would never fire`)
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
  const covers = {}

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
    ...String(r.id).split('-').flatMap(forms),
    ...(OPENUI_ALIAS[r.id] ?? []).flatMap(forms)]
  /* ⚠️ ALL the matches, not just the first — and the difference only shows up
   * when the derivation is read BACKWARDS. Forward, one source is enough to
   * justify a recipe, so `find` was fine. Backwards, derive-coverage asks which
   * catalogue entries are covered, and a recipe that satisfies "Pagination" AND
   * "Breadcrumbs" claiming only the first makes the second look like a gap. The
   * REPORT still shows one source per layer; `covers` carries the rest. */
  covers.openui = [...new Set(words.map((w) => OPENUI[w]).filter(Boolean).map((h) => h.spelled ?? h.concept))]
  covers.service = []
  for (const [system, svs] of Object.entries(services.systems)) {
    for (const kind of ['components', 'patterns']) {
      for (const name of Object.keys(svs[kind] ?? {})) {
        const aliased = (SERVICE_ALIAS[r.id] ?? []).some((a) => forms(a).some((f) => forms(name).includes(f)))
        /* The SAME word list the Open UI matcher builds, compound ids split.
         * `checkbox-radio` normalises to "checkboxradio", which meets neither
         * "Checkbox" nor "Radios" — so a kit that plainly ships both reported
         * two gaps. A compound name is two names. */
        const direct = words.some((f) => forms(name).includes(f))
        if (aliased || direct) covers.service.push(`${system} · ${name}`)
      }
    }
  }
  const hit = words.map((w) => OPENUI[w]).find(Boolean)
  if (hit) {
    sources.push({ layer: 3, source: `Open UI · ${hit.spelled}`, because: `${hit.systems} of 27 surveyed design systems ship this independently (${hit.pct}%).`, url: openui._source })
  }
  const sv = serviceFor(r)
  if (sv) {
    sources.push({ layer: 4, source: `${sv.system} · ${sv.name}`, because: `${sv.system} ships this as a ${sv.kind === 'patterns' ? 'pattern' : 'component'} because a public service needs it.`, url: sv.url })
  }

  if (sources.length) assigned.push({ ...r, sources, covers })
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

if (JSON_OUT) {
  const isCoreJ = (a) => a.sources.some((x) => x.layer === 2 || x.layer === 4)
  const compJ = (id) => tierOfId(id) === 'component'
  const why = (a) => a.sources.some((x) => x.layer === 1)
    ? `platform-only — ${a.sources.find((x) => x.layer === 1).source}; the floor styles the element`
    : `census-only — ${a.sources.map((x) => x.source).join(', ')}`
  const payload = JSON.stringify({
    assigned, unassigned,
    stays: assigned.filter((a) => compJ(a.id) && isCoreJ(a)).map((a) => a.id),
    coreSections: assigned.filter((a) => !compJ(a.id) && isCoreJ(a)).map((a) => a.id),
    leaves: [
      ...assigned.filter((a) => compJ(a.id) && !isCoreJ(a)).map((a) => ({ id: a.id, why: why(a) })),
      ...unassigned.filter((u) => compJ(u.id)).map((u) => ({ id: u.id, why: 'no source at all' })),
    ],
    tiers: Object.fromEntries(RECIPES.map((r) => [r.id, tierOfId(r.id)])),
  }, null, 2)
  /* ⚠️ NOT process.exit() after a big console.log: on a pipe, exit does not wait
   * for stdout to drain and the JSON was cut at 64KB — derive-coverage then
   * failed to parse it at "position 65242". Write, and leave on the callback. */
  process.stdout.write(payload + '\n', () => process.exit(0))
  /* And STOP here — the write callback fires later, and without this the report
   * below prints after the JSON, which is what "unexpected character after JSON"
   * means. An await that never resolves is the plain way to say "we are done". */
  await new Promise(() => {})
}

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

/* ── THE THREE LISTS ──────────────────────────────────────────────────────────
 * STAYS · LEAVES · (and derive-coverage prints MISSING, the other direction).
 * Component-tier only — the substrate and the page shells are printed as what
 * they are, never as candidates. Silently dropping them would be the "quiet
 * exclusion" this repo has been bitten by. */
const isCore = (a) => a.sources.some((x) => x.layer === 2 || x.layer === 4)
const compTier = (id) => tierOfId(id) === 'component'
const stays = assigned.filter((a) => compTier(a.id) && isCore(a))
const censusOnly = assigned.filter((a) => compTier(a.id) && !isCore(a) && a.sources.some((x) => x.layer === 3) && !a.sources.some((x) => x.layer === 1))
const platformOnly = assigned.filter((a) => compTier(a.id) && !isCore(a) && a.sources.some((x) => x.layer === 1))
const noSource = unassigned.filter((u) => compTier(u.id))
const notComponents = [...unassigned.filter((u) => !compTier(u.id)), ...assigned.filter((a) => !compTier(a.id) && !isCore(a))]

const coreSections = assigned.filter((a) => !compTier(a.id) && isCore(a))
console.log(`\n  ══ STAYS — core, component tier: ${stays.length} ══`)
console.log('     A line from layer 2 (APG) or layer 4 (a public service). The set is these.')
console.log(`     (+ ${coreSections.length} core recipes on the section/foundation tier, which stay as shells:`)
console.log('      ' + coreSections.map((a) => a.id).join(' · ') + ')\n')

console.log(`  ══ LEAVES — component tier with no core line: ${censusOnly.length + platformOnly.length + noSource.length} ══`)
if (censusOnly.length) {
  console.log(`     ${censusOnly.length} census-only — the field ships it, nothing normative, no service needs it.`)
  console.log('     Layer 3 is a check, not a source; "shadcn has it" was the shortcut:\n')
  for (const a of censusOnly) console.log(`      ${a.id.padEnd(28)} ${a.sources.map((x) => x.source).join('  ·  ')}`)
  console.log()
}
if (platformOnly.length) {
  console.log(`     ${platformOnly.length} platform-only — the element is the component. By the layer-1 rule the`)
  console.log('     FLOOR styles the element and a recipe on top is a second version of it:\n')
  for (const a of platformOnly) console.log(`      ${a.id.padEnd(28)} ${a.sources.map((x) => x.source).join('  ·  ')}`)
  console.log()
}
if (noSource.length) {
  console.log(`     ${noSource.length} with NO source at all:\n`)
  for (const u of noSource) console.log(`      ${u.id.padEnd(28)} .${u.cls ?? '—'}  renders ${u.renders}`)
  console.log()
}
if (notComponents.length) {
  console.log(`  ── not components — ${notComponents.length}: the substrate and the page shells (tier read from`)
  console.log('     segments.ts). "Which design system ships this component" is the wrong question')
  console.log('     about a grid; they are listed, not judged:')
  console.log('      ' + notComponents.map((u) => `${u.id} (${tierOfId(u.id)})`).join(' · ') + '\n')
}

if (WRITE) {
  const path = join(HERE, 'data/provenance.json')
  writeFileSync(path, JSON.stringify({
    _derived: 'scripts/derive-provenance.mjs — layer 1 measured off the rendered DOM, 2 from apg.ts, 3 from openui-names.json (a CHECK, not a source since 2026-08-16), 4 matched against service-systems.json',
    _layers: { 1: 'MDN / HTML', 2: 'WAI-ARIA APG', 3: 'Open UI', 4: 'GOV.UK · NL Design System · USWDS' },
    assigned: Object.fromEntries(assigned.map((a) => [a.id, a.sources])),
    unassigned: unassigned.map((u) => u.id),
  }, null, 2) + '\n')
  console.log(`\n  → written to scripts/data/provenance.json`)
}
