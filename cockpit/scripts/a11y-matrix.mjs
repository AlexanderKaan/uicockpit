/**
 * The same scan, across every configuration a visitor can actually choose.
 *
 *   npm run dev  &&  node scripts/a11y-matrix.mjs
 *
 * The predecessor (`a11y-scan`, folded in here on 2026-08-16) measured ONE
 * config: light, default density, 1440px. That was the number being quoted, and
 * it is not a number a claim can rest on — dark mode runs a completely different
 * neutral scale and the densities move every control. Its two features this
 * file did not have came with it: contrast verified against painted pixels, and
 * a separate, ungated pass over our own chrome.
 *
 * Driven through the real controls rather than a synthesised URL, so it also
 * proves the paths a person would take.
 *
 * ── TWO OUTPUTS, ONE MEASUREMENT ──────────────────────────────────────────────
 *
 *   node scripts/a11y-matrix.mjs              the gate — exit 1 on any violation
 *   node scripts/a11y-matrix.mjs --evidence   the same run, and it also writes
 *                                              src/kit/evidence.json, which the
 *                                              public component page renders
 *
 * gen-evidence used to be its own script with its own browser, its own six
 * configurations and its own density driver — a second copy of this loop, and
 * the two copies HAD ALREADY DISAGREED once: the matrix's density setter had been
 * a silent no-op for months while evidence measured densities that actually
 * moved. Two scripts measuring "the same thing" is two chances to be wrong about
 * what was measured. One loop now; the gate and the page cannot drift apart
 * because there is nothing between them.
 *
 * What --evidence adds per configuration is one further axe run — the two rules
 * whose PASS data carries the numbers the page publishes (colour-contrast's
 * computed ratio, target-size's rendered box) — attributed to a recipe by BEM
 * block, plus an instance count. Nothing it publishes is computed here; axe
 * computes, this file only ATTRIBUTES, which is the one thing axe cannot do.
 */
import { chromium } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { deriveTargets, NOT_A_TARGET } from './lib/interactive-targets.mjs'
import { setDensity, setRow, DENSITY_WITNESS } from './lib/drive-panel.mjs'
import { parseKit, classesIn } from './lib/kit-model.mjs'
import { APP } from './lib/base.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const EVIDENCE = process.argv.includes('--evidence')
const EVIDENCE_OUT = join(HERE, '../src/kit/evidence.json')
const AXE = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js'
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const SCALES = ['compact', 'default', 'comfortable']

/* ── which recipe an element belongs to, by BEM BLOCK ────────────────────────
 * (Moved from gen-evidence, which this file absorbed on 2026-08-16.) The kit model's own class map resolves a shared
 * class to its FIRST declarer, which is fine for the static gates and wrong for
 * attribution: .btn is first mentioned by the TOOLBAR recipe in one rule, so
 * every button on the wall was credited to the toolbar and `buttons` — on screen
 * 299 times — reported "not measured". An impossible number, the usual tell.
 * A class belongs to the recipe whose BLOCK it is; five blocks are claimed by two
 * recipes and the tie goes to whoever declares the BARE class, then to whoever
 * has more rules. That resolves all five the way a person would. */
const kit = parseKit()
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
    if (!held || score[0] > held.score[0] || (score[0] === held.score[0] && score[1] > held.score[1])) winner[b] = { id: r.id, score }
  }
  const map = {}
  for (const name of kit.classes.keys()) {
    const b = name.split('__')[0].split('--')[0]
    map[name] = winner[b]?.id ?? kit.classes.get(name).recipeId
  }
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
await page.goto(APP, { waitUntil: 'networkidle' })
await page.waitForSelector('.cockpit-preview', { timeout: 20000 })
await page.waitForTimeout(1200)
await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' })
await page.evaluate((map) => { window.__owner = map }, classOwner)
// The painted-contrast verifier lives in rules.browser.js so that this file and
// the component harness measure contrast the SAME way — one definition.
await page.addScriptTag({ path: join(HERE, 'lib', 'rules.browser.js') })

/* 🚨 THIS USED TO WRITE TO `.fmrow input[type="range"]`, and that input stopped
 * existing when the panel was refactored to one row shape. The setter returned
 * false, nothing read it, and this script printed three density lines while
 * measuring ONE density three times — so "0 violations across 6 configurations",
 * the headline of the conformance report, was 0 across two. The driver now lives
 * in lib/drive-panel.mjs, throws when it cannot drive, and verifies that the
 * density token actually moved before it lets the scan continue. */
const setScale = (name) => setDensity(page, name)

const toggleMode = () => page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /Switch to (dark|light) mode/.test(x.getAttribute('aria-label') || ''))
  b?.click()
  return !!b
})

/* ── axe's CONTRAST verdicts are VERIFIED against painted pixels, never trusted.
 * The verifier itself is window.__uicPaintedContrast in lib/rules.browser.js —
 * the WHY (axe's oklch arithmetic reads #016ccb as #2e87d5) is documented there,
 * once. What this scan owns is the consequence: a flagged pair whose pixels pass
 * is DISCOUNTED and printed as such — acting on it would mean changing a design
 * to satisfy a bug. */
const scan = (include = '.cockpit-preview', exclude = null) => page.evaluate(async ({ tags, include, exclude }) => {
  const ctx0 = { include: [[include]] }
  if (exclude) ctx0.exclude = [[exclude]]
  // eslint-disable-next-line no-undef
  const r = await axe.run(ctx0, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })
  /* The recipe a node belongs to — its OWN classes, nearest first, read with
   * getAttribute (on an SVG element className is an SVGAnimatedString and
   * String()-ing it yields "[object SVGAnimatedString]"; 740 SVG nodes on the
   * wall read as unclassed until that was fixed). */
  const owner = window.__owner || {}
  const recipeOf = (el) => {
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      for (const c of String(e.getAttribute('class') || '').trim().split(/\s+/)) if (owner[c]) return owner[c]
    }
    return null
  }
  const rows = []
  const artifacts = []
  for (const v of r.violations) for (const n of v.nodes) {
    let detail = ''
    if (v.id === 'color-contrast') {
      const el = document.querySelector(n.target[0])
      const need = n.any?.[0]?.data?.expectedContrastRatio
      const verdict = window.__uicPaintedContrast(el, need)
      if (verdict) {
        detail = `${verdict.painted.toFixed(2)}:1`
        if (verdict.pass) {
          // The pixels pass; axe's oklch arithmetic did not. Discount, and say so.
          artifacts.push({ sel: n.target[0]?.toString().slice(0, 56), axe: n.any?.[0]?.data?.contrastRatio, painted: verdict.painted.toFixed(2), need: verdict.need })
          continue
        }
      }
    }
    let recipe = null
    try { recipe = recipeOf(document.querySelector(n.target[0])) } catch { recipe = null }
    rows.push({ id: v.id, impact: v.impact, sel: n.target[0]?.toString().slice(0, 56), detail, recipe })
  }
  return { rows, artifacts }
}, { tags: TAGS, include, exclude })

/* ── the EVIDENCE read: what axe measured, per recipe ─────────────────────────
 * (Moved from gen-evidence.) The two rules whose PASS data carries the numbers
 * the page publishes. Run without resultTypes so passes come through in full —
 * with it, axe truncates each pass to a single node and the numbers would be a
 * sample of one. And the CONTROL travels with the verdict: a run that evaluated
 * three text nodes and reports no violations is a clean sheet about nothing, and
 * it looks identical in the output to one that evaluated two thousand — so the
 * denominators are recorded, and `incomplete` is carried rather than dropped. */
const detail = () => page.evaluate(async () => {
  const owner = window.__owner || {}
  const root = document.querySelector('.cockpit-preview')
  const recipeOf = (el) => {
    if (!el) return null
    for (let e = el; e && e.nodeType === 1 && e !== root.parentElement; e = e.parentElement) {
      for (const c of String(e.getAttribute('class') || '').trim().split(/\s+/)) if (owner[c]) return owner[c]
    }
    return null
  }
  const at = (sel) => { try { return document.querySelector(sel) } catch { return null } }
  const per = {}
  const bump = (id) => (per[id] ??= { instances: 0, contrast: { min: null, nodes: 0 }, target: { min: null, pass: 0, fail: 0 } })
  for (const el of root.querySelectorAll('*')) { const id = recipeOf(el); if (id) bump(id).instances++ }
  // eslint-disable-next-line no-undef
  const res = await axe.run({ include: [['.cockpit-preview']] }, { runOnly: { type: 'rule', values: ['color-contrast', 'target-size'] } })
  const read = (id, n, ok) => {
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
      const small = typeof d.minSize === 'number' && typeof d.width === 'number' ? Math.round(Math.min(d.width, d.height)) : null
      if (small !== null && (rec.target.min === null || small < rec.target.min)) rec.target.min = small
    }
  }
  for (const v of res.passes) for (const n of v.nodes) read(v.id, n, true)
  for (const v of res.violations) for (const n of v.nodes) read(v.id, n, false)
  const count = (list, rule) => list.filter((v) => v.id === rule).reduce((a, v) => a + v.nodes.length, 0)
  return {
    per,
    control: {
      contrastNodes: count(res.passes, 'color-contrast') + count(res.violations, 'color-contrast'),
      targetNodes: count(res.passes, 'target-size') + count(res.violations, 'target-size'),
      contrastIncomplete: count(res.incomplete, 'color-contrast'),
    },
  }
})
const evidence = { merged: {}, controls: [], configurations: [], widths: [1440] }
const mergeEvidence = (per, { widthsOnly = false } = {}) => {
  for (const [id, r] of Object.entries(per)) {
    const m = (evidence.merged[id] ??= { instances: 0, axe: 0, contrastMin: null, contrastNodes: 0, targetMin: null, targetPass: 0, targetFail: 0 })
    if (!widthsOnly) {
      m.instances = Math.max(m.instances, r.instances)
      m.contrastNodes = Math.max(m.contrastNodes, r.contrast.nodes)
      if (r.contrast.min !== null && (m.contrastMin === null || r.contrast.min < m.contrastMin)) m.contrastMin = r.contrast.min
      m.targetPass = Math.max(m.targetPass, r.target.pass)
    }
    if (r.target.min !== null && (m.targetMin === null || r.target.min < m.targetMin)) m.targetMin = r.target.min
    m.targetFail += r.target.fail
  }
}

const results = []
for (const mode of ['light', 'dark']) {
  for (let i = 0; i < SCALES.length; i++) {
    await setScale(SCALES[i])
    await page.waitForTimeout(400)
    await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js' })
    const { rows, artifacts } = await scan()
    results.push({ mode, scale: SCALES[i], rows })
    if (EVIDENCE) {
      const { per, control } = await detail()
      for (const row of rows) if (row.recipe) (evidence.merged[row.recipe] ??= { instances: 0, axe: 0, contrastMin: null, contrastNodes: 0, targetMin: null, targetPass: 0, targetFail: 0 }).axe++
      mergeEvidence(per)
      evidence.controls.push({ config: `${mode} · ${SCALES[i]}`, ...control, unattributed: rows.filter((r) => !r.recipe).length })
      evidence.configurations.push(`${mode} · ${SCALES[i]}`)
    }
    console.log(`${mode.padEnd(6)} ${SCALES[i].padEnd(12)} ${rows.length === 0 ? '✓ 0' : `✗ ${rows.length}`}` +
      (artifacts.length ? `   (${artifacts.length} axe contrast artifact(s) discounted — pixels pass: ${artifacts.slice(0, 2).map((a) => `${a.sel} axe ${a.axe} painted ${a.painted}`).join('; ')})` : ''))
    const g = new Map()
    for (const r of rows) {
      const k = `${r.id}|${r.detail}|${(r.sel.match(/[.#][\w-]+/g) || []).slice(-2).join('')}`
      g.set(k, (g.get(k) || 0) + 1)
    }
    for (const [k, n] of [...g].sort((a, b) => b[1] - a[1])) {
      const [id, detail, sel] = k.split('|')
      console.log(`         ${String(n).padStart(3)}x  ${id} ${detail.padEnd(8)} ${sel}`)
    }
  }
  if (mode === 'light') { await toggleMode(); await page.waitForTimeout(700) }
}
/* ── OUR CHROME — the configurator AROUND the preview ─────────────────────────
 * Ported from a11y-scan when it folded into this file. Two scopes, reported
 * separately and never merged: THE KIT is the number that may be published;
 * the chrome is ours to fix but not the product. It is measured here on every
 * run because it used to be measured nowhere the build looked — the enforcement
 * gap in one sentence. Since Sprint N (2026-08-16) it is GATED as well: a chrome
 * violation fails this run like a kit violation does. The two numbers stay
 * separate in the report (the kit's is the one that may be published), but a
 * tool that measures accessibility cannot ship an inaccessible frame around
 * it. Light, default density, 1440: one configuration, because the chrome does
 * not re-theme with the kit's controls the way the preview does. */
let chromeViolations = 0
{
  await toggleMode() // back to light for the chrome pass
  await page.waitForTimeout(600)
  await setScale('default')
  await page.waitForTimeout(400)
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js' }).catch(() => {})
  const chrome = await scan('body', '.cockpit-preview')
  chromeViolations = chrome.rows.length
  console.log(`\n── Our chrome (the configurator around the preview) — gated, reported apart from the kit`)
  console.log(`  ${chrome.rows.length === 0 ? '✓ 0 violation(s)' : `✗ ${chrome.rows.length} violation(s)`}` +
    (chrome.artifacts.length ? `  (${chrome.artifacts.length} contrast artifact(s) discounted)` : ''))
  const g = new Map()
  for (const r of chrome.rows) { const k = `${r.id}|${(r.sel.match(/[.#][\w-]+/g) || []).slice(-2).join('')}`; g.set(k, (g.get(k) || 0) + 1) }
  for (const [k, n] of [...g].sort((a, b) => b[1] - a[1]).slice(0, 12)) { const [id, sel] = k.split('|'); console.log(`    ${String(n).padStart(3)}×  ${id}  ${sel}`) }
}

/* ── EVIDENCE: target size across widths, at the DEFAULT conformance ─────────
 * Before the AAA pass below flips the setting. 2.5.8 is a function of width and
 * the two real breaches this repo has seen (.calendar-week__event at 14px) do
 * not happen at 1440 and do at 1200. */
if (EVIDENCE) {
  for (const w of [1280, 1024]) {
    await page.setViewportSize({ width: w, height: 1000 })
    await page.waitForTimeout(500)
    await page.addScriptTag({ url: AXE }).catch(() => {})
    const { per } = await detail()
    mergeEvidence(per, { widthsOnly: true })
    evidence.widths.push(w)
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForTimeout(400)
}

/* ── Target size, measured on the RENDERED page ────────────────────────────
 *
 * A unit test on the tokens is not enough and we proved it the hard way: the
 * first version of the AAA floor set `--k-btn-h-default` to 44 and passed its
 * own test while `.menu__item` still rendered at 28px, because menus read a
 * different ladder (`--k-row-h-*`) and tabs and segments had no height at all.
 * The token was right and the page was wrong. So the claim is checked where the
 * claim lives. */
console.log('\n── Target size (Conformance) ' + '─'.repeat(35))
/* The denominator is DERIVED, not listed — see scripts/lib/interactive-targets.mjs
 * for why, in short: this scan used to carry eleven selectors and printed a zero
 * over everything nobody had remembered to add to them. */
const targets = () => page.evaluate(deriveTargets, {
  rootSel: '.cockpit-preview', exclude: NOT_A_TARGET, floor: 44,
})

// Same treatment: a row driver that throws rather than a click nobody checks.
const setConformance = (want) => setRow(page, 'Conformance', want === 'aaa' ? 'AAA' : 'AA$', {
  witness: () => getComputedStyle(document.querySelector('.cockpit-preview')).getPropertyValue('--k-hit-min').trim(),
})

await setConformance('aaa')
await page.waitForTimeout(900)
/* 2.5.8 IS AXE'S CALL, NOT OURS, and getting that wrong cost a wrong number in
 * the conformance report. The SC permits an undersized target when there is
 * enough clear space around it, axe-core computes that exception and we do not:
 * our size scan said "94 under 24px" where axe finds TWO breaches and 519
 * passes. So the verdict comes from axe and the size scan supplies the
 * denominator — the thing axe cannot give us and the reason it was built.
 *
 * ACROSS WIDTHS, because target size is a function of width and this matrix has
 * only ever run at 1440. The two real breaches are .calendar-week__event at
 * 14px: two overlapping appointments splitting a 34px column, which simply does
 * not happen at 1440 and does at 1200. Mode and density were the axes; width was
 * missing, and it is the one that governs this SC. */
const WIDTHS = [1440, 1280, 1024]
console.log('  2.5.8 AA — axe target-size (spacing exception applied), across widths')
let targetBreaches = 0
for (const w of WIDTHS) {
  await page.setViewportSize({ width: w, height: 1000 })
  await page.waitForTimeout(500)
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js' }).catch(() => {})
  const r = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const res = await axe.run({ include: [['.cockpit-preview']] }, { runOnly: { type: 'rule', values: ['target-size'] } })
    return {
      fails: res.violations.flatMap((v) => v.nodes.map((n) => ({
        sel: String(n.target[0]).slice(0, 52),
        msg: (n.any[0]?.message || '').replace(/^Target has insufficient size /, '').slice(0, 40),
      }))),
      passes: res.passes.reduce((n, v) => n + v.nodes.length, 0),
    }
  })
  targetBreaches += r.fails.length
  console.log(`    ${String(w).padStart(5)}px  ${r.fails.length === 0 ? '✓' : '✗'} ${r.fails.length} breach(es), ${r.passes} passing`)
  for (const f of r.fails.slice(0, 4)) console.log(`             ${f.msg}  ${f.sel}`)
}
await page.setViewportSize({ width: 1440, height: 1000 })
await page.waitForTimeout(400)

/* And the size distribution, which is a MEASUREMENT and not a verdict — it says
 * how much of the kit sits below each floor, which is what a review needs. */
const aaa = await targets()
console.log(`\n  2.5.5 AAA (44px) — ${aaa.under}/${aaa.total} derived targets measure under 44px on an axis`)
for (const [name, g] of Object.entries(aaa.groups ?? {}).sort((a, b) => b[1].n - a[1].n).slice(0, 8)) {
  console.log(`       ${String(g.size).padStart(14)}  x${String(g.n).padStart(3)}  ${name}`)
}
// Exclusions are printed, never silent: a scan that quietly drops things is
// indistinguishable from one that missed them.
for (const [sel, n] of Object.entries(aaa.skipped ?? {})) {
  console.log(`       excluded x${String(n).padStart(3)}  ${sel}`)
}
if (targetBreaches > 0) results.push({ mode: 'aaa', scale: 'targets', rows: Array(targetBreaches).fill({ id: 'target-size' }) })

await browser.close()

if (EVIDENCE) {
  /* ⚠️ THE CONTROL IS CHECKED BEFORE ANYTHING IS WRITTEN. If axe evaluated almost
   * no text, "0 findings" is a clean sheet about nothing — the exact shape of the
   * "19/19 pairs pass" claim the page exists to replace. */
  const thinnest = evidence.controls.reduce((a, c) => Math.min(a, c.contrastNodes), Infinity)
  if (thinnest < 200) {
    console.error(`\n✗ EVIDENCE CONTROL FAILED — one configuration had axe evaluate only ${thinnest} text nodes. Nothing written.`)
    process.exit(1)
  }
  const git = (...args) => execFileSync('git', args, { cwd: HERE }).toString().trim()
  const components = {}
  let measuredCount = 0
  for (const r of kit.recipes) {
    const m = evidence.merged[r.id]
    if (!m || m.instances === 0) {
      /* Two different facts wear the same `false`, and collapsing them would be
       * the page lying quietly: `button-finish` IS measured, under `buttons`,
       * because both write to the .btn block; `lightbox` is not rendered at all.
       * The first is bookkeeping, the second is a coverage gap — and the page
       * says which. */
      components[r.id] = absorbedBy[r.id] ? { measured: false, reason: 'measured-as', under: absorbedBy[r.id] } : { measured: false, reason: 'not-rendered' }
      continue
    }
    measuredCount++
    components[r.id] = {
      measured: true,
      instances: m.instances,
      axeFindings: m.axe,
      // null, not 0, when axe found no TEXT to judge — a component made of icons
      // has no contrast number and must not be given one.
      contrast: m.contrastNodes > 0 ? { min: +m.contrastMin.toFixed(2), nodes: m.contrastNodes } : null,
      target: m.targetPass + m.targetFail > 0 ? { smallest: m.targetMin, pass: m.targetPass, fail: m.targetFail } : null,
    }
  }
  writeFileSync(EVIDENCE_OUT, JSON.stringify({
    note: 'Generated by scripts/a11y-matrix.mjs --evidence from the same run that gates the build. Every number was measured by axe-core on the rendered component; nothing is typed by hand. Regenerate with `npm run dev && npm run gen:evidence`.',
    commit: git('rev-parse', '--short', 'HEAD'),
    measuredOn: git('log', '-1', '--format=%cs'),
    configurations: evidence.configurations,
    widths: evidence.widths,
    axeRuleset: 'axe-core 4.10.2 — tags ' + TAGS.join(', ') + "; contrast and target size read from axe's own per-node results, exemptions included",
    control: evidence.controls,
    components,
  }, null, 1) + '\n')
  console.log(`\n  evidence: ${measuredCount} of ${kit.recipes.length} recipes measured → src/kit/evidence.json`)
}

const total = results.reduce((a, r) => a + r.rows.length, 0)
console.log(`\n${'═'.repeat(64)}\n${total} violation(s) across ${results.length} configurations · chrome ${chromeViolations}`)
process.exit(total || chromeViolations ? 1 : 0)
