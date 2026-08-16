#!/usr/bin/env node
/**
 * gen-evidence.mjs — what THIS component measured, not which gates exist.
 *
 *   npm run dev  &&  npm run gen:evidence
 *
 * WHY IT EXISTS. The component page has a Specification section, and its "Tests"
 * heading lists the gates that would touch a component like this one: "audit:tokens
 * — no raw values", "a11y:matrix — axe over 3 densities x 2 modes". True, and
 * useless to the person the page is for. An accessibility officer at a bank does
 * not need to know that we own a contrast gate. They need the number it produced
 * for the component in front of them.
 *
 * That difference is the whole product. Naming your instruments is what every
 * design system does. Publishing what they measured, per component, is what none
 * of them do — because they do not have the instruments.
 *
 * ⚠️ EVERY NUMBER HERE COMES FROM A RUN. Nothing in this file is typed by hand,
 * and the page renders nothing that is not in the output. The alternative is the
 * "19/19 WCAG pairs pass" claim we shipped for months: arithmetic over tokens,
 * from the same instrument that once reported black on black.
 *
 * 🔑 ATTRIBUTION IS BY CLASS, NOT BY CARD. The wall tags cards with data-recipe
 * where they have one and data-card — a human heading — otherwise, so card-level
 * attribution would cover 16 of 110 recipes and mis-assign the rest. An element
 * belongs to the recipe that DECLARES one of its classes, read from the same kit
 * model every other gate reads. Derived, and it covers a new recipe on the day it
 * ships.
 *
 * ⚠️ AND A COMPONENT THE WALL DOES NOT RENDER GETS `measured: false`, never a
 * quiet zero. Unverified is not the same as verified-clean, and a page that
 * prints "0 findings" for something nobody looked at is worse than a page that
 * says nothing at all.
 */
import { writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { chromium } from '@playwright/test'
import { parseKit, classesIn } from './lib/kit-model.mjs'
import { setDensity } from './lib/drive-panel.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
/* It lands in src/, not scripts/data/, because it is SHIPPED DATA — the component
 * page imports it and renders it. Everything else in scripts/data/ is a baseline
 * a gate reads; this is the only artefact here that a visitor sees. */
const OUT = join(HERE, '../src/kit/evidence.json')
const URL = process.argv.find((a) => a.startsWith('--url='))?.slice(6) ?? 'http://localhost:5173/app'
const AXE = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js'
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const SCALES = ['compact', 'default', 'comfortable']

const kit = parseKit()

/**
 * class → the recipe it belongs to, by BEM BLOCK.
 *
 * ⚠️ The first version used the kit model's own class map, which resolves a
 * shared class to its FIRST declarer. That is fine for the gates that use it and
 * wrong here: `.btn` is first mentioned by the TOOLBAR recipe, in one rule, so
 * every button on the wall was attributed to the toolbar and the `buttons`
 * recipe came back `measured: false`. A component that is on screen 200 times
 * reporting "not measured" is the impossible-number tell.
 *
 * A class belongs to the recipe whose BLOCK it is — the same frequency rule
 * explainer.ts already uses to decide what a recipe owns, so the page's Parts
 * list and its Evidence agree about the same component. Five blocks are claimed
 * by two recipes; the tie goes to whoever declares the BARE class (`.btn {`),
 * then to whoever has more rules. That resolves all five the way a person would:
 * .btn to buttons over button-finish, .dialog to dialog over alert-dialog,
 * .list to list, .menu to dropdown-menu, .numinput to numberinput.
 */
function ownership() {
  const blockOf = (r) => {
    const c = {}
    for (const rule of r.rules) for (const cl of classesIn(rule.selector)) {
      const b = cl.split('__')[0].split('--')[0]
      c[b] = (c[b] ?? 0) + 1
    }
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  }
  const bare = (r, b) => r.rules.filter((x) => x.selectors.some((s) => s.trim() === '.' + b)).length

  const winner = {}
  for (const r of kit.recipes) {
    const b = blockOf(r)
    if (!b) continue
    const score = [bare(r, b), r.rules.length]
    const held = winner[b]
    if (!held || score[0] > held.score[0] || (score[0] === held.score[0] && score[1] > held.score[1])) {
      winner[b] = { id: r.id, score }
    }
  }
  const map = {}
  for (const name of kit.classes.keys()) {
    const b = name.split('__')[0].split('--')[0]
    map[name] = winner[b]?.id ?? kit.classes.get(name).recipeId
  }
  // Which recipe absorbed which — so `measured: false` can say WHY.
  const absorbedBy = {}
  for (const r of kit.recipes) {
    const b = blockOf(r)
    if (b && winner[b] && winner[b].id !== r.id) absorbedBy[r.id] = winner[b].id
  }
  return { map, absorbedBy }
}
const { map: classOwner, absorbedBy } = ownership()

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForSelector('.cockpit-preview', { timeout: 25000 })
await page.waitForTimeout(1500)
await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' })
await page.evaluate((map) => { window.__owner = map }, classOwner)

/* The density driver lives in lib/drive-panel.mjs and THROWS when it cannot
 * drive — see the note there for why that matters more than it sounds: the
 * previous setter had been a silent no-op for months, so this matrix measured
 * one density three times and called it three. */
const setScale = (name) => setDensity(page, name)

const toggleMode = () => page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /Switch to (dark|light) mode/.test(x.getAttribute('aria-label') || ''))
  b?.click()
  return !!b
})

/**
 * One configuration, measured.
 *
 * 🚨 EVERY JUDGED NUMBER COMES FROM AXE, and the first version did not — it
 * walked the DOM resolving colours through a canvas and computing ratios itself.
 * That version reported fourteen components below 4.5:1, including four at
 * exactly 1.00:1, while axe found ZERO contrast violations on the same page. Two
 * numbers, one page, and only one of them had the exemptions in it: axe knows
 * that large text passes at 3:1, that a disabled control is exempt, and that an
 * element hidden by an ancestor's opacity is not text anybody reads. The 1.00:1
 * readings were exactly that last case — my alpha compositing folding fg into bg
 * for elements nobody can see.
 *
 * This is the rule the harness already states and this script had to relearn:
 * DELEGATE TO AXE FOR EVERYTHING AXE COVERS. Reimplementing a well-tested checker
 * is not thorough, it is a second thing to be wrong — and here it would have been
 * wrong on the page we publish as evidence.
 *
 * So axe computes; we only ATTRIBUTE its per-node results to a component, which
 * is the one thing it cannot do.
 */
const measure = () => page.evaluate(async (tags) => {
  const owner = window.__owner
  const root = document.querySelector('.cockpit-preview')

  /** The recipe an element belongs to: its own classes, nearest first. */
  const recipeOf = (el) => {
    if (!el) return null
    for (let e = el; e && e.nodeType === 1 && e !== root.parentElement; e = e.parentElement) {
      /* 🚨 getAttribute, NEVER className. On an SVG element className is an
       * SVGAnimatedString, so String()-ing it yields "[object SVGAnimatedString]"
       * and every one of the 740 SVG nodes on the wall read as unclassed. The
       * sparkline reported measured:false while plainly on screen — an impossible
       * number, which is always the tell. Six kit classes were invisible to this
       * and to every rule in rules.browser.js: .chart__svg, .sparkline,
       * .sparkline__path, .sparkline--good, .stat-tile__spark, .rating__star--empty. */
      const cls = String(e.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean)
      for (const c of cls) if (owner[c]) return owner[c]
    }
    return null
  }
  const at = (sel) => { try { return document.querySelector(sel) } catch { return null } }

  const per = {}
  const bump = (id) => (per[id] ??= {
    instances: 0, axe: [], contrast: { min: null, nodes: 0 }, target: { min: null, pass: 0, fail: 0 },
  })

  // Instances: a COUNT, not a judgement, so it is ours to take.
  for (const el of root.querySelectorAll('*')) {
    const id = recipeOf(el)
    if (id) bump(id).instances++
  }

  // eslint-disable-next-line no-undef
  const viol = await axe.run({ include: [['.cockpit-preview']] },
    { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })
  let unattributed = 0
  for (const v of viol.violations) for (const n of v.nodes) {
    const id = recipeOf(at(n.target[0]))
    if (!id) { unattributed++; continue }
    bump(id).axe.push({ rule: v.id, impact: v.impact })
  }

  /* The two rules whose PASS data carries the measurement we want to publish:
   * color-contrast reports the ratio it computed per node, target-size reports
   * the rendered box. Run without resultTypes so passes come through in full —
   * with it, axe truncates each pass to a single node and the numbers would be
   * a sample of one. */
  // eslint-disable-next-line no-undef
  const detail = await axe.run({ include: [['.cockpit-preview']] },
    { runOnly: { type: 'rule', values: ['color-contrast', 'target-size'] } })

  const walk = (list, fn) => { for (const v of list) for (const n of v.nodes) fn(v.id, n) }
  const readAll = (id, n, ok) => {
    const rid = recipeOf(at(n.target[0]))
    if (!rid) return
    const rec = bump(rid)
    const d = n.any?.[0]?.data ?? {}
    if (id === 'color-contrast' && typeof d.contrastRatio === 'number') {
      rec.contrast.nodes++
      if (rec.contrast.min === null || d.contrastRatio < rec.contrast.min) rec.contrast.min = d.contrastRatio
    }
    if (id === 'target-size') {
      ok ? rec.target.pass++ : rec.target.fail++
      const small = typeof d.minSize === 'number' && typeof d.width === 'number'
        ? Math.round(Math.min(d.width, d.height)) : null
      if (small !== null && (rec.target.min === null || small < rec.target.min)) rec.target.min = small
    }
  }
  walk(detail.passes, (id, n) => readAll(id, n, true))
  walk(detail.violations, (id, n) => readAll(id, n, false))

  /* ⚠️ THE CONTROL. Not a colour of ours any more — the question is whether axe
   * actually LOOKED. A run that evaluates three text nodes and reports no
   * violations is a clean sheet about nothing, and it looks identical in the
   * output to a run that evaluated two thousand. So the denominators travel with
   * the verdict, and `incomplete` is carried rather than dropped: axe saying "I
   * could not decide" is information, and rounding it to a pass is how a scan
   * starts lying. */
  const count = (list, rule) => list.filter((v) => v.id === rule).reduce((a, v) => a + v.nodes.length, 0)
  const control = {
    contrastNodes: count(detail.passes, 'color-contrast') + count(detail.violations, 'color-contrast'),
    targetNodes: count(detail.passes, 'target-size') + count(detail.violations, 'target-size'),
    contrastIncomplete: count(detail.incomplete, 'color-contrast'),
  }

  return { per, control, unattributed }
}, TAGS)

// ── run the matrix ─────────────────────────────────────────────────────────
const configurations = []
const merged = {}
const controls = []

for (const mode of ['light', 'dark']) {
  for (let i = 0; i < SCALES.length; i++) {
    await setScale(SCALES[i])
    await page.waitForTimeout(400)
    await page.addScriptTag({ url: AXE }).catch(() => {})
    const { per, control, unattributed } = await measure()

    controls.push({ config: `${mode} · ${SCALES[i]}`, ...control, unattributed })
    configurations.push(`${mode} · ${SCALES[i]}`)
    console.log(`  ${mode.padEnd(6)} ${SCALES[i].padEnd(12)} ${String(Object.keys(per).length).padStart(3)} recipes` +
      `  axe evaluated ${String(control.contrastNodes).padStart(4)} text / ${String(control.targetNodes).padStart(3)} targets` +
      `${control.contrastIncomplete ? `  (${control.contrastIncomplete} undecided)` : ''}` +
      `${unattributed ? `  ${unattributed} unattributed` : ''}`)

    for (const [id, r] of Object.entries(per)) {
      const m = (merged[id] ??= {
        instances: 0, axe: [], contrastMin: null, contrastNodes: 0,
        targetMin: null, targetPass: 0, targetFail: 0,
      })
      m.instances = Math.max(m.instances, r.instances)
      m.axe.push(...r.axe)
      m.contrastNodes = Math.max(m.contrastNodes, r.contrast.nodes)
      if (r.contrast.min !== null && (m.contrastMin === null || r.contrast.min < m.contrastMin)) m.contrastMin = r.contrast.min
      if (r.target.min !== null && (m.targetMin === null || r.target.min < m.targetMin)) m.targetMin = r.target.min
      m.targetPass = Math.max(m.targetPass, r.target.pass)
      m.targetFail += r.target.fail
    }
  }
  if (mode === 'light') { await toggleMode(); await page.waitForTimeout(700) }
}

/* Target size ACROSS WIDTHS, because 2.5.8 is a function of width and the matrix
 * only ever ran at 1440. The two real breaches this repo has seen were
 * .calendar-week__event at 14px — two overlapping appointments splitting a 34px
 * column, which does not happen at 1440 and does at 1200. */
await toggleMode() // back to light
await page.waitForTimeout(600)
const widthsRun = []
for (const w of [1280, 1024]) {
  await page.setViewportSize({ width: w, height: 1000 })
  await page.waitForTimeout(500)
  await page.addScriptTag({ url: AXE }).catch(() => {})
  const { per } = await measure()
  widthsRun.push(w)
  let fails = 0
  for (const [id, r] of Object.entries(per)) {
    const m = (merged[id] ??= { instances: 0, axe: [], contrastMin: null, contrastNodes: 0, targetMin: null, targetPass: 0, targetFail: 0 })
    if (r.target.min !== null && (m.targetMin === null || r.target.min < m.targetMin)) m.targetMin = r.target.min
    m.targetFail += r.target.fail
    fails += r.target.fail
  }
  console.log(`  @${w}px      target-size ${fails} breach(es)`)
}

await browser.close()

/* ⚠️ THE CONTROL IS CHECKED BEFORE ANYTHING IS WRITTEN. If axe evaluated almost
 * no text or almost no targets, "0 findings" is a clean sheet about nothing, and
 * publishing it would be the exact shape of the "19/19 pairs pass" claim this
 * work exists to replace. */
const thinnest = controls.reduce((a, c) => Math.min(a, c.contrastNodes), Infinity)
if (thinnest < 200) {
  console.error(`\n✗ CONTROL FAILED — one configuration had axe evaluate only ${thinnest} text nodes.`)
  console.error('  A verdict over that little is not evidence. Nothing written.')
  process.exit(1)
}

// ── assemble, including the recipes NOTHING rendered ───────────────────────
const git = (...args) => execFileSync('git', args, { cwd: HERE }).toString().trim()
const commit = git('rev-parse', '--short', 'HEAD')
const measuredOn = git('log', '-1', '--format=%cs')

const components = {}
let measuredCount = 0
for (const r of kit.recipes) {
  const m = merged[r.id]
  if (!m || m.instances === 0) {
    /* ⚠️ TWO DIFFERENT FACTS WEAR THE SAME `false`, and collapsing them would be
     * the page lying quietly. `button-finish` IS measured — every button variant
     * it owns was on screen 299 times — it just reports under `buttons`, because
     * both recipes write to the .btn block and a rendered element can only belong
     * to one of them. `separator` is a different thing entirely: it owns .sep, it
     * won its block outright, and .sep appears on the wall zero times. The first
     * is bookkeeping. The second is CSS the export charges a consumer for that
     * nobody can look at — the same finding as activity-feed in Sprint C. */
    components[r.id] = absorbedBy[r.id]
      ? { measured: false, reason: 'measured-as', under: absorbedBy[r.id] }
      : { measured: false, reason: 'not-rendered' }
    continue
  }
  measuredCount++
  components[r.id] = {
    measured: true,
    instances: m.instances,
    axeFindings: m.axe.length,
    // null, not 0, when axe found no TEXT in this component to judge — a
    // component made of icons has no contrast number and must not be given one.
    contrast: m.contrastNodes > 0 ? { min: +m.contrastMin.toFixed(2), nodes: m.contrastNodes } : null,
    target: m.targetPass + m.targetFail > 0
      ? { smallest: m.targetMin, pass: m.targetPass, fail: m.targetFail }
      : null,
  }
}

writeFileSync(OUT, JSON.stringify({
  note: 'Generated by scripts/gen-evidence.mjs from a real run. Every number was measured by axe-core on the rendered component; nothing is typed by hand. Regenerate with `npm run dev && npm run gen:evidence`.',
  commit,
  measuredOn,
  configurations,
  widths: [1440, ...widthsRun],
  axeRuleset: 'axe-core 4.10.2 — tags ' + TAGS.join(', ') + '; contrast and target size read from axe\'s own per-node results, exemptions included',
  control: controls,
  components,
}, null, 1) + '\n')

console.log(`\n  ${measuredCount} of ${kit.recipes.length} recipes measured; ${kit.recipes.length - measuredCount} carry measured:false`)
console.log(`  written → scripts/data/evidence.json (commit ${commit})`)
