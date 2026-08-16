// @ts-nocheck — the in-page half is browser JavaScript passed to page.evaluate; typing it would be theatre.
/**
 * gen:manifest — the SHAPE of every component, read off the rendered wall.
 *
 *   npm run dev  &&  npm run gen:manifest        # writes src/kit/manifest.json
 *
 * WHY. The kit's components exist as CSS (the recipe), as React specimens (the
 * gallery cards) and as compositions (the showcase fixture). What none of those
 * is, is a MACHINE-READABLE SHAPE: which element the block is, which parts it
 * has and on which elements, which of those parts every instance carries and
 * which are optional or repeated, what ARIA is on them, how they nest, and one
 * canonical piece of markup. The forge needed it (its skeleton guessed parts as
 * divs in a head/body/foot order), the component page needed it (Copy usage),
 * and the runtime branch — a model asking for components by name — cannot
 * exist without it: a renderer needs a template, not a stylesheet.
 *
 * WHY DERIVED, NOT WRITTEN. Seventy-eight hand-written manifests would be a
 * second description of every component next to its CSS and its card, and the
 * whole record of this repo says the second copy drifts. So the manifest is
 * READ off the specimens the wall already renders — the same instances the
 * accessibility evidence, the shape baseline and the uniformity gate measure —
 * and regenerated the same way (by hand, after a change to how a component
 * renders; a test refuses a manifest whose recipe set no longer matches the
 * kit). Across all instances of a block on the wall:
 *
 *   element     the tag the block is (all tags seen, the commonest first)
 *   parts       every `block__part` seen, with its tags, in how many of the
 *               block's instances it appears (required = in all of them),
 *               whether it repeats under one parent, the ARIA it carried, and
 *               which part (or the block) it nests in
 *   states      modifiers and ARIA state attributes actually rendered
 *   composes    other kit blocks found inside (a .btn in a .card__actions)
 *   skeleton    the most complete instance, cleaned: kit classes, roles, ARIA,
 *               element types; text replaced by placeholders; repeated siblings
 *               collapsed to one with a count. Not a specimen — a shape.
 *
 * What stays declared, because it cannot be measured: the behaviour contract
 * (apg.ts) and the Role Canvas roles. The manifest carries structure only.
 *
 * ⚠️ IT OPENS WHAT IT CAN. A menu rendered on open, a details closed by
 * default — the disclosures are opened first (the same move audit:uniformity
 * makes), or the manifest of a dropdown would have no menu in it.
 */
import { writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { chromium } from '@playwright/test'
import { RECIPES } from '../src/kit/recipes'
import { explainerFor } from '../src/kit/explainer'
import { parseKit } from './lib/kit-model.mjs'
import { APP } from './lib/base.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '../src/kit/manifest.json')
const git = (...a: string[]) => { try { return execFileSync('git', a, { encoding: 'utf8' }).trim() } catch { return '?' } }

/* The block and the CSS-declared parts per recipe come from the EXPLAINER — the
 * one reading of "what is this recipe's block" the component page, the forge
 * data and this script share (vite-node, so the TypeScript is imported, not
 * parsed a second time). */
const kit = parseKit()
const kitClasses: string[] = [...kit.classes.keys()]
const blocks = RECIPES.map((r) => ({ id: r.id, ex: explainerFor(r.id) }))
  .filter((x) => x.ex?.block)
  .map((x) => ({ id: x.id, block: x.ex!.block as string, cssParts: (x.ex!.parts ?? []).filter((p: string) => !p.includes('--')) }))
/* Which kit class is the ROOT of which recipe — so a .btn inside a .card reads
 * as "composes buttons", not as an unknown class. And every class each recipe
 * owns, so a block that lives inside a container of its own recipe (.tab in
 * .tabs, .menu__item in .menu) can be rooted at the container. */
const rootOf: Record<string, string> = Object.fromEntries(blocks.map((b) => [b.block, b.id]))
const recipeClasses: Record<string, string[]> = {}
for (const [name, c] of kit.classes as Map<string, { recipeId: string }>) (recipeClasses[c.recipeId] = recipeClasses[c.recipeId] || []).push(name)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto(APP, { waitUntil: 'networkidle' })
await page.waitForSelector('.cockpit-preview', { timeout: 25000 })
await page.waitForTimeout(1500)
await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' })
// Open every disclosure so menus and panels are in the DOM.
await page.evaluate(() => {
  for (const el of document.querySelectorAll('.cockpit-preview [aria-expanded="false"], .cockpit-preview details:not([open])')) {
    try { if (el.tagName === 'DETAILS') el.open = true; else el.click() } catch { /* a trigger that refuses is not a finding here */ }
  }
})
await page.waitForTimeout(500)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const result: Record<string, any> = await page.evaluate(({ blocks, kitClasses, rootOf, recipeClasses }: { blocks: { id: string; block: string }[]; kitClasses: string[]; rootOf: Record<string, string>; recipeClasses: Record<string, string[]> }) => {
  const root = document.querySelector('.cockpit-preview')
  const KIT = new Set(kitClasses)
  const own = (el) => String(el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean)
  const KEEP_ATTR = /^(role|aria-[a-z-]+|type|popover|open|disabled|tabindex|data-role|hidden|inert|inputmode|autocomplete|readonly|required|multiple|checked|selected|for|id|href|name|value|placeholder|dir|lang|datetime|colspan|rowspan|scope|headers)$/
  const STATE_ATTR = /^aria-(selected|checked|pressed|expanded|current|disabled|invalid|busy|hidden|sort|haspopup|modal|live)$/
  const title = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())

  const out = {}
  for (const { id, block } of blocks) {
    const partRe = new RegExp(`^${block}__([a-z0-9-]+?)(--[a-z0-9-]+)?$`)
    const modRe = new RegExp(`^${block}--([a-z0-9-]+)$`)
    let instances
    try { instances = [...root.querySelectorAll('.' + CSS.escape(block))] } catch { instances = [] }
    /* The gallery frames its cards with the kit's own .card (dogfood), and puts
     * a title/description in an ⓘ panel inside it. Those are the wall's chrome,
     * not specimens: a manifest of `card` read from them would say "composes
     * everything". Frames carry data-recipe / data-card; the panel is .cardinfo. */
    instances = instances.filter((el) => !el.hasAttribute('data-recipe') && !el.hasAttribute('data-card') && !el.closest('.cardinfo'))
    const mine = new Set(recipeClasses[id] || [])
    const containersSeen = {}
    // A block nested in the same block belongs to itself, not to the outer one.
    const ownerOf = (el) => { for (let e = el.parentElement; e && e !== root; e = e.parentElement) if (own(e).includes(block)) return e; return null }
    const entry = {
      block, instances: instances.length, elements: {}, root: { attrs: {} }, rootRoles: new Set(),
      parts: {}, states: { modifiers: new Set(), partModifiers: new Set(), aria: {} }, composes: new Set(), skeleton: null,
    }
    /* The canonical instance: parts first, then the BASE variant (no modifier)
     * with real text — a ghost-small icon button is not what "a button" means. */
    let best = null, bestScore = -1
    // (Children do not score: a leaf block's plainest instance with text is the
    // canonical one, and ties go to DOM order — the first thing on the wall.)
    const score = (inst, nParts) => nParts * 10 + (own(inst).some((t) => t.startsWith(block + '--')) ? 0 : 5) + (inst.textContent.trim() ? 3 : 0)
    for (const inst of instances) {
      const tag = inst.tagName.toLowerCase()
      // A container of the same recipe above the block (.tabs over .tab)?
      for (let e = inst.parentElement; e && e !== root; e = e.parentElement) {
        const c = own(e).find((t) => mine.has(t) && t !== block && !t.startsWith(block + '__') && !t.startsWith(block + '--'))
        if (c) { containersSeen[c] = (containersSeen[c] || 0) + 1; break }
      }
      entry.elements[tag] = (entry.elements[tag] || 0) + 1
      for (const a of inst.attributes) {
        if (a.name === 'role' || STATE_ATTR.test(a.name) || a.name === 'popover' || a.name === 'type') {
          const k = a.name === 'type' ? `type=${a.value}` : a.name === 'role' ? `role=${a.value}` : a.name
          entry.root.attrs[k] = (entry.root.attrs[k] || 0) + 1
          if (a.name === 'role') entry.rootRoles.add(a.value)
          if (STATE_ATTR.test(a.name)) { (entry.states.aria[a.name] = entry.states.aria[a.name] || new Set()).add(a.value) }
        }
      }
      for (const t of own(inst)) { const m = t.match(modRe); if (m) entry.states.modifiers.add('--' + m[1]) }
      const seenParts = new Set()
      const partCountUnderParent = new Map()
      for (const d of inst.querySelectorAll('*')) {
        if (ownerOf(d) !== inst) continue
        const toks = own(d)
        // another recipe's block inside this one → composition
        for (const t of toks) if (rootOf[t] && rootOf[t] !== id) entry.composes.add(rootOf[t])
        let partName = null
        for (const t of toks) {
          const m = t.match(partRe)
          if (m) { partName = m[1]; if (m[2]) entry.states.partModifiers.add(`__${m[1]}${m[2]}`) }
        }
        if (!partName) continue
        seenParts.add(partName)
        const p = (entry.parts[partName] = entry.parts[partName] || { elements: {}, in: 0, parents: {}, repeatable: false, aria: {}, cssDeclared: false })
        const dtag = d.tagName.toLowerCase()
        p.elements[dtag] = (p.elements[dtag] || 0) + 1
        for (const a of d.attributes) if (a.name === 'role' || a.name.startsWith('aria-')) (p.aria[a.name] = p.aria[a.name] || new Set()).add(a.value.slice(0, 40))
        // parent part: the nearest ancestor (below the instance) that is a part
        let parent = 'block'
        for (let e = d.parentElement; e && e !== inst; e = e.parentElement) {
          const pm = own(e).map((t) => t.match(partRe)).find(Boolean)
          if (pm) { parent = pm[1]; break }
        }
        p.parents[parent] = (p.parents[parent] || 0) + 1
        // repeated under one parent element?
        const key = partName + '@' + (d.parentElement ? [...d.parentElement.children].indexOf(d.parentElement) : 0)
        const k2 = partName + '|' + (d.parentElement === inst ? 'root' : 'p')
        const siblings = d.parentElement ? [...d.parentElement.children].filter((s) => own(s).some((t) => (t.match(partRe) || [])[1] === partName)).length : 1
        if (siblings > 1) p.repeatable = true
        void key; void k2; partCountUnderParent.set(partName, siblings)
      }
      for (const name of seenParts) entry.parts[name].in++
      const sc = score(inst, seenParts.size)
      if (sc > bestScore) { bestScore = sc; best = inst }
    }
    entry.container = Object.entries(containersSeen).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    // Serialize the most complete instance as a shape.
    const ser = (el, depth) => {
      const pad = '  '.repeat(depth)
      const tag = el.tagName.toLowerCase()
      const classes = own(el).filter((t) => KIT.has(t) || KIT.has(t.split('--')[0]))
      const attrs = []
      if (classes.length) attrs.push(`class="${classes.join(' ')}"`)
      for (const a of el.attributes) {
        if (a.name === 'class' || a.name === 'style' || a.name.startsWith('data-uic') || a.name === 'data-recipe' || a.name === 'data-card') continue
        if (!KEEP_ATTR.test(a.name)) continue
        if (a.name === 'href') { attrs.push('href="#"'); continue }
        if (a.name === 'id' || a.name === 'for' || a.name === 'name' || a.name === 'value' || a.name === 'placeholder') continue
        attrs.push(a.value === '' ? a.name : `${a.name}="${a.value.replace(/"/g, '&quot;').slice(0, 60)}"`)
      }
      const open = `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`
      const VOID = /^(img|input|br|hr|source|track|wbr|area|col|embed)$/
      if (VOID.test(tag)) return `${pad}${open}`
      if (tag === 'svg') return `${pad}<svg${classes.length ? ` class="${classes.join(' ')}"` : ''} aria-hidden="true"><!-- icon --></svg>`
      const partName = own(el).map((t) => (t.match(/__([a-z0-9-]+)/) || [])[1]).find(Boolean)
      const placeholder = title(partName || (tag === 'button' ? 'action' : tag === 'a' ? 'link' : 'text'))
      /* Children in DOCUMENT ORDER, text nodes included — a button is
       * `<svg/> Export`, and reading only .children dropped the word. */
      const keep = (c) => {
        if (c.closest('.cardinfo')) return false
        return own(c).some((t) => KIT.has(t) || KIT.has(t.split('--')[0])) || c.querySelector('[class]') !== null || (c.children.length === 0 && c.textContent.trim()) || c.tagName.toLowerCase() === 'svg'
      }
      const lines = []
      let prev = null, run = 0
      const flush = () => { if (prev !== null) { lines.push(prev); if (run > 1) lines.push(`${pad}  <!-- ×${run} -->`) } }
      let sawText = false
      for (const n of el.childNodes) {
        let s = null
        if (n.nodeType === 1) { if (!keep(n)) continue; s = ser(n, depth + 1) }
        else if (n.nodeType === 3 && n.textContent.trim()) { if (sawText) continue; sawText = true; s = `${pad}  ${placeholder}` }
        else continue
        if (s === prev) { run++; continue }
        flush(); prev = s; run = 1
      }
      flush()
      if (!lines.length) return `${pad}${open}</${tag}>`
      // a lone text placeholder stays inline: <span class="x">Text</span>
      if (lines.length === 1 && sawText && el.children.length === 0) return `${pad}${open}${placeholder}</${tag}>`
      return `${pad}${open}\n${lines.join('\n')}\n${pad}</${tag}>`
    }
    /* Rooted at the container when the block has one on the wall: a tab strip
     * is the shape people copy, not one tab. The container instance that holds
     * the best block instance is used. */
    if (best) {
      let rootEl = best
      if (entry.container) { for (let e = best.parentElement; e && e !== root; e = e.parentElement) if (own(e).includes(entry.container)) { rootEl = e; break } }
      entry.skeleton = ser(rootEl, 0)
    }
    // Sets → arrays for JSON
    entry.states.modifiers = [...entry.states.modifiers].sort()
    entry.states.partModifiers = [...entry.states.partModifiers].sort()
    for (const k of Object.keys(entry.states.aria)) entry.states.aria[k] = [...entry.states.aria[k]].sort()
    for (const p of Object.values(entry.parts)) for (const k of Object.keys(p.aria)) p.aria[k] = [...p.aria[k]].sort()
    entry.composes = [...entry.composes].sort()
    entry.rootRoles = [...entry.rootRoles].sort()
    out[id] = entry
  }
  return out
}, { blocks, kitClasses, rootOf, recipeClasses })
await browser.close()

/* Finish in Node: which CSS-declared parts the wall never rendered, the
 * element choice, and the BEHAVIOUR the specimen relies on. Kept as data —
 * the test decides what to do with it.
 *
 * Behaviour, read off the specimen (a classification, not a promise):
 *   platform  the block IS a native interactive element (details, dialog,
 *             select, input, button, a …) and carries no ARIA state a script
 *             would have to manage — the browser does the behaviour;
 *   script    the specimen renders a widget role (tab, menu, listbox, tree,
 *             combobox, slider, switch …) or ARIA states (selected, expanded,
 *             checked, pressed, busy) that only a script can keep true — the
 *             kit ships the CSS and the contract, the behaviour is the
 *             consumer's (or, later, a framework-neutral module's);
 *   css       everything else — structure and look, no interaction to own. */
const NATIVE = new Set(['details', 'dialog', 'select', 'input', 'textarea', 'button', 'a', 'progress', 'meter', 'table', 'form', 'fieldset', 'output', 'summary'])
const SCRIPT_ROLE = /^(tab|tablist|tabpanel|menu|menubar|menuitem|menuitemcheckbox|menuitemradio|listbox|option|tree|treeitem|treegrid|grid|gridcell|combobox|slider|spinbutton|switch|radiogroup|radio|checkbox|toolbar|feed|application)$/
const SCRIPT_STATE = /^aria-(selected|expanded|checked|pressed|busy|activedescendant|sort)$/
for (const b of blocks) {
  const e = result[b.id]
  if (!e) continue
  e.element = Object.entries(e.elements).sort((a, c) => c[1] - a[1])[0]?.[0] ?? null
  {
    const scriptRole = (e.rootRoles as string[]).some((r) => SCRIPT_ROLE.test(r))
    const scriptState = Object.keys(e.states.aria).some((k) => SCRIPT_STATE.test(k))
    const partScriptRole = Object.values(e.parts).some((p: any) => Object.entries(p.aria ?? {}).some(([k, v]) => k === 'role' && (v as string[]).some((r) => SCRIPT_ROLE.test(r))))
    e.behaviour = e.instances === 0 ? null : (scriptRole || scriptState || partScriptRole) ? 'script' : (e.element && NATIVE.has(e.element)) ? 'platform' : 'css'
  }
  for (const p of b.cssParts) {
    const name = p.replace(`${b.block}__`, '')
    if (e.parts[name]) e.parts[name].cssDeclared = true
    else e.parts[name] = { elements: {}, in: 0, parents: {}, repeatable: false, aria: {}, cssDeclared: true }
  }
  for (const [name, p] of Object.entries(e.parts)) {
    p.required = e.instances > 0 && p.in === e.instances
    p.rendered = p.in > 0
    p.element = Object.entries(p.elements).sort((a, c) => c[1] - a[1])[0]?.[0] ?? null
    p.parent = Object.entries(p.parents).sort((a, c) => c[1] - a[1])[0]?.[0] ?? null
    if (!p.rendered) delete p.required
    delete p.elements; delete p.parents
    e.parts[name] = p
  }
}

const rendered = Object.values(result).filter((e) => e.instances > 0).length
const partsTotal = Object.values(result).reduce((n, e) => n + Object.keys(e.parts).length, 0)
const partsUnrendered = Object.values(result).reduce((n, e) => n + Object.values(e.parts).filter((p) => !p.rendered).length, 0)

writeFileSync(OUT, JSON.stringify({
  _generated: 'scripts/gen-manifest.mjs — read off the rendered wall; regenerate with `npm run dev && npm run gen:manifest` after anything that changes how a component renders. Not typed by hand.',
  commit: git('rev-parse', '--short', 'HEAD'),
  measuredOn: git('log', '-1', '--format=%cs'),
  blocks: rendered,
  recipes: Object.keys(result).length,
  components: Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b))),
}, null, 1) + '\n')

const census = { platform: [], css: [], script: [] }
for (const [id, e] of Object.entries(result)) if (e.behaviour) census[e.behaviour].push(id)
console.log(`gen:manifest — ${rendered} of ${Object.keys(result).length} blocks rendered on the wall · ${partsTotal} parts (${partsUnrendered} declared in CSS but never rendered) → src/kit/manifest.json`)
console.log(`  behaviour the specimens rely on: platform ${census.platform.length} · css ${census.css.length} · script ${census.script.length}`)
console.log(`  script (the behaviour backlog — CSS + contract ship, the behaviour does not): ${census.script.join(' · ')}`)
for (const [id, e] of Object.entries(result)) {
  const un = Object.entries(e.parts).filter(([, p]) => !p.rendered).map(([n]) => `__${n}`)
  if (!e.instances) console.log(`  ✗ ${id} (.${e.block}) — no instance on the wall`)
  else if (un.length) console.log(`  · ${id} (.${e.block}) — ${e.instances} instance(s), parts never rendered: ${un.join(' ')}`)
}
