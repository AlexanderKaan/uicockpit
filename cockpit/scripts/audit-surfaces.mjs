#!/usr/bin/env node
/**
 * audit:surfaces — the fixture against the kit, in one read.
 *
 *   node scripts/audit-surfaces.mjs [--report]
 *
 * SIX GATES BECAME ONE (Sprint K, 2026-08-16). audit:parity, audit:provenance,
 * audit:modifiers, audit:coverage, audit:layout and audit:controls each opened
 * the same two things — the composition fixture's source (src/showcases/**) and
 * the kit's class definitions — and each asked one question of them with its own
 * regex for what a class is, its own allow-list, its own idea of which files are
 * "the app". Six readers of one substrate is six chances to disagree about it,
 * and they did: parity read className= only, provenance also read template
 * literals, coverage resolved SCREAMING constants, modifiers stripped comments
 * differently. This file reads the substrate ONCE, with the kit model every other
 * gate uses, and asks the six questions as AXES of one report:
 *
 *   SHIPS         every class the fixture renders is defined in the EXPORTABLE
 *                 kit — a consumer who copies the markup gets the styling. The
 *                 fixture is a pure consumer of what the CDN serves.
 *   DEFINED       every BEM modifier rendered anywhere (fixture or gallery) has
 *                 a rule — an undefined modifier is a silent no-op that once made
 *                 `banner--info` render "by accident" because the base was info-
 *                 toned.
 *   DEMONSTRATED  the gallery shows what the fixture uses: every class ROOT the
 *                 fixture renders is on the components page, and every modifier
 *                 AXIS it renders is demonstrated there. The gallery is the source
 *                 of truth; a component that lives only in the fixture is drift.
 *   COMPOSED      the other direction — every recipe is put on a page next to
 *                 other components at least once. A ratchet, exact in both
 *                 directions: overlays legitimately compose into nothing, so the
 *                 bar is "no worse than 41", and a win must be locked in.
 *   LAYOUT        the fixture composes the layout primitives (.bento / .l-*)
 *                 and never authors grid tracks inline.
 *   LIVE          a <button> that renders the down-chevron opens something — a
 *                 dropdown affordance with no handler is a control that lies.
 *
 * WHAT DID NOT SURVIVE THE MERGE, on purpose. Every allow-list below is carried
 * over WITH its reason, and every entry that matches nothing in this run is
 * PRINTED as unused — an exception nobody needs is a hole waiting for a class to
 * fall through it. Three files that no longer exist (DemoDashboard, the SupaDash
 * apps/, preview.css) were still named in headers; they are gone here.
 *
 * ⚠️ The subjects are DERIVED wherever they can be. COMPOSED reads every recipe
 * off the kit model — the old coverage gate carried 27 hand-written markers and
 * reported "all 27 covered" of a 110-recipe kit. SHIPS/DEFINED/DEMONSTRATED
 * derive their classes from the fixture's className= values. Only the
 * exceptions are lists, and each is read back to you.
 *
 * ⚠️ HOW A CLASS IS COUNTED AS RENDERED, and the control that settled it.
 * Reading every string literal in the fixture reported 61 recipes composed;
 * reading only className= values reported 51. The ten were coincidence —
 * `alert`, `tooltip`, `dialog` are SectionSpec KIND names in the manifests, not
 * classes. So: className= only, plus SCREAMING_CASE class constants resolved
 * (PANE_CLASS is a real class applied through a variable), and nothing else.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { parseKit, parseCss, stripComments, classesIn } from './lib/kit-model.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const REPORT = process.argv.includes('--report')
const rel = (p) => p.replace(ROOT + '/', '')

/* ── the substrate ────────────────────────────────────────────────────────── */

/* The composition FIXTURE. sections.tsx maps SectionSpec → kit recipes,
 * shell.tsx carries the section tier (scaffold + panes), extras.ts defines the
 * pane/window class constants those apply through. See cockpit/CLAUDE.md: this
 * directory is not dead code, it is what the auditors read from disk. */
const SHOWCASES = resolve(ROOT, 'src/showcases')
const FIXTURE_FILES = [
  resolve(ROOT, 'src/tokens/extras.ts'),
  ...readdirSync(SHOWCASES).filter((f) => /\.tsx?$/.test(f)).map((f) => resolve(SHOWCASES, f)),
]
/* The GALLERY = the components page + the shared presentational helpers it
 * renders cards through. A class rendered via a helper is "on the page". */
const GALLERY_FILES = [
  resolve(ROOT, 'src/stage/views/ComponentGallery.tsx'),
  resolve(ROOT, 'src/stage/views/apps/AppHelpers.tsx'),
]
/* Where a dead chevron could hide: every view and the marketing site. */
const LIVE_ROOTS = ['src/stage/views', 'src/marketing'].map((d) => resolve(ROOT, d))

const readAll = (files) => files.map((f) => readFileSync(f, 'utf8'))
/* Comments blanked, newlines kept, so a class named in prose is not "used" and
 * line numbers stay honest. */
const blankComments = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length))

/** Every class token a set of TSX files puts on an element, className= only.
 *
 * Two shapes, because JS identifiers and class names look alike:
 *   bem     — tokens with a hyphen, `__` or `--`, taken from every string in a
 *             className= value: plain literals, the static parts of templates,
 *             AND quoted strings inside `${…}` (`${on ? 'tab--on' : ''}` renders
 *             tab--on, and blanking the interpolation lost three modifiers).
 *   single  — one-word tokens (card, btn), taken ONLY from literals and the
 *             static parts of templates — never from inside `${…}`, where `open`
 *             and `active` are variables, not classes.
 * SCREAMING_CASE constants are resolved to their string (PANE_CLASS is a real
 * class applied through a variable). */
function renderedClasses(files) {
  const bem = new Set(), single = new Set()
  const src = readAll(files).map(blankComments).join('\n')
  /* A constant is a string OR an object of strings — `PANE_CLASS = { flex:
   * 'pane pane--flex', … }` applies four real classes through one identifier.
   * The old coverage gate did not resolve the object form and still counted
   * `pane` as composed, because `PANE_CLASS[pane.role]` happens to contain the
   * word "pane" as a VARIABLE NAME — the coincidence its own header warned
   * about, live in the gate that warned. Resolved for real here. */
  const consts = new Map()
  for (const m of src.matchAll(/\b([A-Z][A-Z0-9_]{2,})\s*=\s*['"`]([a-z][a-z0-9 _-]*)['"`]/g)) consts.set(m[1], m[2])
  for (const m of src.matchAll(/\b([A-Z][A-Z0-9_]{2,})\s*=\s*\{([^}]*)\}/g)) {
    const values = [...m[2].matchAll(/['"`]([a-z][a-z0-9 _-]*)['"`]/g)].map((q) => q[1])
    if (values.length) consts.set(m[1], values.join(' '))
  }
  const take = (text, { singles }) => {
    for (const t of String(text).matchAll(/[A-Za-z][\w-]*/g)) {
      if (/[-_]/.test(t[0])) { if (BEM_SHAPED.test(t[0])) bem.add(t[0]) }
      else if (singles) single.add(t[0])
    }
  }
  const fromString = (lit) => {
    take(lit.replace(/\$\{[\s\S]*?\}/g, ' '), { singles: true })          // static parts
    for (const i of lit.matchAll(/\$\{([\s\S]*?)\}/g))                     // quoted strings inside ${…}
      for (const q of i[1].matchAll(/["'`]([^"'`]*)["'`]/g)) take(q[1], { singles: false })
  }
  for (const m of src.matchAll(/className=("[^"]*"|`[^`]*`|\{[\s\S]*?\}(?=\s*(?:[\w-]+=|\/?>)))/g)) {
    const raw = m[1]
    if (raw.startsWith('{')) {
      for (const q of raw.matchAll(/"([^"]*)"|'([^']*)'|`([^`]*)`/g)) fromString(q[1] ?? q[2] ?? q[3] ?? '')
      for (const [name, value] of consts) if (raw.includes(name)) fromString(value)
    } else fromString(raw.slice(1, -1))
  }
  return { bem, single, all: new Set([...bem, ...single]) }
}
const BEM_SHAPED = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?$|^[a-z][a-z0-9]*__[a-z0-9-]+(?:--[a-z0-9-]+)?$|^[a-z][a-z0-9]*--[a-z0-9-]+$/

/* KIT definitions = the recipes (through the model) + the global layer. The
 * global layer is a TS function of template literals with `${s}` scope
 * prefixes, so it is read as text through the same class regex; the recipes
 * come from the parsed model so a base rule can be told from a mention. */
const kit = parseKit()
const globalSrc = readFileSync(resolve(ROOT, 'src/kit/globalLayer.ts'), 'utf8')
const globalRules = parseCss(stripComments(globalSrc.replace(/\$\{[^}]*\}/g, '')))
const kitRules = [...kit.rules, ...globalRules]
const kitClasses = new Set(kitRules.flatMap((r) => classesIn(r.selector)))
/* A BASE rule for a class: the class is the SUBJECT of some selector part —
 * `.card`, `.card:hover`, `.card[aria-selected]`, `x > .card` — not merely
 * mentioned as an ancestor in `.card > .btn`. This is what closed the hole that
 * once let .card's surface live only in preview-only.css while `.card > .btn`
 * sat in the kit and made "card" look defined. */
const hasBaseRule = (cls) => {
  const re = new RegExp(`(^|[\\s>+~])\\.${cls}(?![\\w-])(?:::?[\\w-]+(?:\\([^)]*\\))?|\\[[^\\]]*\\])*$`)
  return kitRules.some((r) => r.selector.split(',').some((part) => re.test(part.trim())))
}
const previewOnlySrc = readFileSync(resolve(ROOT, 'src/styles/preview-only.css'), 'utf8')
const previewOnlyClasses = new Set(classesIn(stripComments(previewOnlySrc)))
const definedAnywhere = (c) => kitClasses.has(c) || previewOnlyClasses.has(c)

const fixtureSets = renderedClasses(FIXTURE_FILES)
const gallerySets = renderedClasses(GALLERY_FILES)
const fixture = fixtureSets.all
const gallery = gallerySets.all
const rootOf = (cls) => cls.split('__')[0].split('--')[0]
const isModifier = (cls) => /--[a-z0-9-]+$/.test(cls) && /^[a-z]/.test(cls)
const axisOf = (mod) => mod.slice(0, mod.lastIndexOf('--') + 2)

/* ── the exceptions, each with its reason, each read back ─────────────────── */
const used = new Set()
const exception = (list, name) => {
  const hit = (pred) => { for (const [k, why] of Object.entries(list)) if (pred(k, why)) { used.add(`${name}:${k}`); return true } return false }
  return { hit, keys: Object.keys(list).map((k) => `${name}:${k}`) }
}

/* SHIPS · classes the fixture may render that are NOT shipped. Exact, never a
 * prefix — a kit-worthy sibling under the same root must not be waved through.
 * (The merge found six harness entries — form-measure, app-frame,
 * view-transition, cockpit-preview, visually-hidden — that matched nothing;
 * they are gone. This list is read back on every run, so it cannot rot again.) */
const HARNESS = exception({
  'sr-only': 'structural utility — hides visually, keeps the accessible name',
}, 'harness')
const isHarness = (c) => HARNESS.hit((k) => c === k)

/* DEMONSTRATED · roots the fixture renders that the gallery is not expected to
 * carry: the layout primitives are demonstrated in FoundationsView, not as
 * catalogue cards. (l-stack was here too and is now on the gallery — pruned.) */
const FRAME_ROOTS = exception({
  'l-center': 'foundation layout primitive (centred measure) — the prose block composes it; demonstrated in FoundationsView',
  'bento': 'foundation layout primitive (the smart grid) — the media block composes it; demonstrated in FoundationsView',
  'l-cluster': 'every-layout primitive — the invoice block composes it; demonstrated in FoundationsView',
  'l-sidebar': 'every-layout primitive — as above',
}, 'frame-root')
const isFrameRoot = (root) => FRAME_ROOTS.hit((k) => root === k || root.startsWith(k + '-'))
/* Sub-parts / wrappers whose PARENT is on the page (was: row-menu — gone). */
const OK_ROOT = exception({}, 'ok-root')
/* App-only MODIFIERS that are defined and intentional but have no gallery demo
 * (was: datatable--page — its axis is demonstrated now). */
const OK_MODIFIER = exception({}, 'ok-modifier')
/* DEFINED · JS/a11y markers deliberately without CSS (was: navrow--parent — gone). */
const MARKER = exception({}, 'marker')

/* ── the axes ─────────────────────────────────────────────────────────────── */
const axes = []
const axis = (name, rows, { ok, fix, ratchet = null }) => axes.push({ name, rows, ok, fix, ratchet })

/* SHIPS */
{
  const rows = []
  for (const c of fixtureSets.bem) {
    if (isHarness(c) || kitClasses.has(c)) continue
    rows.push({ cls: c, why: previewOnlyClasses.has(c) ? 'defined only in preview-only.css — a consumer gets unstyled markup' : 'not defined anywhere (invented / typo / legacy)' })
  }
  for (const c of fixtureSets.single) {
    if (isHarness(c) || !definedAnywhere(c) || hasBaseRule(c)) continue
    rows.push({ cls: c, why: 'its BASE rule is not in the kit (only mentioned as an ancestor, or defined in preview-only.css)' })
  }
  axis('SHIPS', rows, {
    ok: `every class the fixture renders is in the exportable kit (${fixture.size} rendered, ${HARNESS.keys.length} harness exceptions)`,
    fix: 'promote it to src/kit/recipes so it ships, or bless it as harness in this file with a reason.',
  })
}

/* DEFINED */
{
  const rows = []
  for (const m of new Set([...fixture, ...gallery].filter(isModifier))) {
    if (definedAnywhere(m)) continue
    if (MARKER.hit((k) => k === m)) continue
    rows.push({ cls: m, why: `used by ${fixture.has(m) ? 'the fixture' : 'the gallery'}, defined nowhere — a silent no-op` })
  }
  axis('DEFINED', rows, {
    ok: 'every modifier rendered anywhere has a rule',
    fix: 'define the modifier (complete its family) or remove it from the markup.',
  })
}

/* DEMONSTRATED */
{
  /* The SECTION tier is demonstrated by the showcase shell, not by a gallery
   * card: a scaffold, a nav suite and a pane layer are page regions, and the
   * components page is a catalogue of components. Which recipes are section
   * tier is DATA in src/kit/segments.ts (SECTION_USES) — read from there, so
   * promoting a recipe to that tier moves it out of this axis without an edit
   * here. Their roots come off the kit model. */
  const segments = readFileSync(resolve(ROOT, 'src/kit/segments.ts'), 'utf8')
  const sectionBlock = segments.slice(segments.indexOf('export const SECTION_USES'), segments.indexOf('export const SECTION_USES') + 4000).split('\n}')[0]
  const sectionIds = new Set([...blankComments(sectionBlock).matchAll(/^\s*'?([a-z][a-z0-9-]*)'?\s*:/gm)].map((m) => m[1]))
  const sectionRoots = new Set(kit.recipes.filter((r) => sectionIds.has(r.id)).flatMap((r) => r.rules.flatMap((rule) => classesIn(rule.selector).map(rootOf))))
  const galleryRoots = new Set([...gallery].map(rootOf))
  const galleryAxes = new Set([...gallery].filter(isModifier).map(axisOf))
  // a dynamic prefix the gallery composes (`badge--${tone}`) demonstrates the whole axis
  for (const src of readAll(GALLERY_FILES).map(blankComments)) {
    for (const m of src.matchAll(/(?:^|[\s"'`{(,>])((?:[a-z][a-z0-9]*)(?:-[a-z0-9]+)*(?:__[a-z0-9-]+)?--)(?![a-z0-9])/g)) galleryAxes.add(m[1])
  }
  const rows = []
  const seenRoot = new Set()
  for (const c of fixture) {
    if (!kitClasses.has(c)) continue                       // SHIPS owns that
    const root = rootOf(c)
    if (!galleryRoots.has(root) && !sectionRoots.has(root) && !isFrameRoot(root) && !OK_ROOT.hit((k) => k === root) && !isHarness(c)) {
      if (!seenRoot.has(root)) { seenRoot.add(root); rows.push({ cls: root, why: `the fixture renders it (${c}), the gallery never shows the root` }) }
      continue
    }
    if (sectionRoots.has(root)) continue                  // the shell demonstrates the section tier, variants included
    if (isModifier(c) && !gallery.has(c) && !galleryAxes.has(axisOf(c)) && !OK_MODIFIER.hit((k) => k === c) && !MARKER.hit((k) => k === c)) {
      rows.push({ cls: c, why: 'the fixture renders this variant, the gallery never demonstrates its axis' })
    }
  }
  axis('DEMONSTRATED', rows, {
    ok: `the gallery shows every root and every modifier axis the fixture uses (${galleryRoots.size} roots, ${galleryAxes.size} axes; ${sectionIds.size} section-tier recipes are demonstrated by the shell)`,
    fix: 'add the variant to its gallery card, or add a documented exception here.',
  })
}

/* COMPOSED — the ratchet */
const CEILING = 41
{
  const alone = []
  for (const r of kit.recipes) {
    const own = [...new Set(r.rules.flatMap((rule) => classesIn(rule.selector)))]
    if (!own.some((c) => fixture.has(c))) alone.push(r.id)
  }
  const rows = alone.length > CEILING ? alone.map((id) => ({ cls: id, why: 'composes into no page' })) : []
  axis('COMPOSED', rows, {
    ok: `${kit.recipes.length - alone.length} of ${kit.recipes.length} recipes compose into a page; ${alone.length} only ever shown alone (ceiling ${CEILING})`,
    fix: 'put it in a section in src/showcases/sections.tsx, or lower the ceiling in a commit that says why this one cannot be composed.',
    ratchet: { value: alone.length, ceiling: CEILING, alone },
  })
}

/* LAYOUT */
{
  const rows = []
  const f = resolve(SHOWCASES, 'sections.tsx')
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/gridTemplate(Columns|Rows)?\s*:/.test(line)) rows.push({ cls: `${rel(f)}:${i + 1}`, why: line.trim().slice(0, 90) })
  })
  axis('LAYOUT', rows, {
    ok: 'no hand-rolled grid tracks in the fixture — blocks compose .bento / .l-* primitives',
    fix: 'rewire the block onto .bento / .l-grid instead of authoring gridTemplate* inline.',
  })
}

/* LIVE */
{
  const walk = (dir) => { let out = []; for (const e of readdirSync(dir)) { const p = join(dir, e); if (statSync(p).isDirectory()) out = out.concat(walk(p)); else if (p.endsWith('.tsx')) out.push(p) } return out }
  const rows = []
  for (const file of LIVE_ROOTS.flatMap(walk)) {
    const src = blankComments(readFileSync(file, 'utf8'))
    for (const m of src.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
      const [full, attrs, inner] = m
      if (!/name=["']chevD["']/.test(inner)) continue
      if (/onClick|onPointerDown|onMouseDown|type=["']submit["']/.test(attrs)) continue
      rows.push({ cls: `${rel(file)}:${src.slice(0, m.index).split('\n').length}`, why: full.replace(/\s+/g, ' ').trim().slice(0, 80) })
    }
  }
  axis('LIVE', rows, {
    ok: 'every down-chevron button has a handler',
    fix: 'add an onClick that opens a menu (useDropdown + .menu), or use MenuButton / SplitMenu.',
  })
}

/* ── the report ───────────────────────────────────────────────────────────── */
const line = (s = '') => console.log(s)
line('=== audit:surfaces — the fixture against the kit, one read, six axes ===')
line(`  fixture ${FIXTURE_FILES.length} files · gallery ${GALLERY_FILES.length} · kit ${kitClasses.size} classes in ${kit.recipes.length} recipes + global layer`)
line()

let failed = 0
for (const a of axes) {
  if (a.rows.length === 0) { line(`  ✓ ${a.name.padEnd(13)} ${a.ok}`); continue }
  failed++
  line(`  ✗ ${a.name.padEnd(13)} ${a.rows.length} finding(s)`)
  for (const r of a.rows.slice(0, 25)) line(`        ${r.cls.padEnd(34)} ${r.why}`)
  if (a.rows.length > 25) line(`        …${a.rows.length - 25} more`)
  line(`        → ${a.fix}`)
}

/* The ratchet's other direction: a WIN that is not locked in is a gate that
 * will let the loss back in unnoticed. */
const composed = axes.find((a) => a.name === 'COMPOSED').ratchet
if (composed.value < CEILING) {
  failed++
  line(`  ✗ COMPOSED      down to ${composed.value} from ${CEILING} — lower CEILING to ${composed.value} in this commit, or the win is not held.`)
}
if (composed.alone.length) {
  line()
  line('  Only ever shown alone in a gallery card, never next to anything else:')
  let row = '   '
  for (const id of [...composed.alone].sort()) { if (row.length + id.length + 3 > 78) { line(row); row = '   ' } row += ` ${id} ·` }
  line(row.replace(/ ·$/, ''))
}

/* Exceptions read back — used and, more importantly, UNUSED. */
const all = [...HARNESS.keys, ...FRAME_ROOTS.keys, ...OK_ROOT.keys, ...OK_MODIFIER.keys, ...MARKER.keys]
const unused = all.filter((k) => !used.has(k))
line()
line(`  exceptions: ${all.length} carried, ${all.length - unused.length} matched something this run` + (unused.length ? `, ${unused.length} matched NOTHING — remove or keep with a reason:` : '.'))
for (const u of unused) line(`        ${u}`)

line()
if (failed) {
  line(`FAIL: audit:surfaces — ${failed} axis/axes disagree.`)
  process.exit(REPORT ? 0 : 1)
}
line('OK: audit:surfaces — the fixture ships, is defined, is demonstrated, composes, lays out through primitives, and every trigger is live.')
