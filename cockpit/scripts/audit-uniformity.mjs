#!/usr/bin/env node
/**
 * audit:uniformity — the answer to "how do we keep the components tidy for good".
 *
 *   npm run dev  &&  npm run audit:uniformity
 *
 * WHY THIS IS A DIFFERENT KIND OF GATE. Every other gate here reviews SUBJECTS:
 * this recipe, that criterion, this component. That is why the list of gates
 * keeps growing and the work never ends — a new component is a new subject, and
 * somebody has to remember to review it.
 *
 * This one asserts AGREEMENT BETWEEN INSTANCES of a concept. It never asks "is
 * .menu__item right?" It asks "every element in the product that expresses
 * selection — do they all express it the same way?" Adding a component adds
 * INSTANCES, not rules, so the gate covers new work automatically. That is the
 * only shape that stops the whack-a-mole.
 *
 * 🔑 AND IT DERIVES ITS SUBJECTS. It carries no list of components, no list of
 * selectors. The moment a meter carries a list of what to check, it measures the
 * list instead of the product — we published "0/250 under 44px" off eleven
 * hand-written selectors when the real denominator was 459.
 *
 * The three concepts below are not a design; they are the three defects found by
 * eye in a single afternoon, each generalised to the class it belongs to:
 *
 *   C1 selected-state   a font row whose "selected" was the HOVER colour, so the
 *                       chosen font looked identical to whatever the mouse was
 *                       over. Generalised: every selected thing must be
 *                       distinguishable from rest AND from hover.
 *   C2 scroll rail      one black OS scrollbar down a calendar. Generalised:
 *                       every element that actually scrolls carries the kit's
 *                       rail treatment. 8 of 11 did not.
 *   C3 orphan class     `.fmopt` deleted as dead code while ten live options
 *                       used it, rendering them unstyled. Generalised WITHOUT an
 *                       allow-list: a class is an orphan only when its own BEM
 *                       family IS styled — `.fmopt__viz` has rules, `.fmopt` has
 *                       none. Derived suspicion beats a list of exceptions.
 *
 * It runs over the WHOLE app — chrome included — because the chrome is 6177
 * lines and 1047 classes and not one existing gate reads it, which is where
 * every one of today's defects lived.
 */
import { chromium } from '@playwright/test'

const URL = process.argv.find((a) => a.startsWith('--url='))?.slice(6) ?? 'http://localhost:5173/app'
const JSON_OUT = process.argv.includes('--json')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)

/* Open every disclosure we can reach, so menus and flyouts are in the DOM. A
 * gate that only sees the resting page cannot see a dropdown, and a dropdown is
 * exactly where selection lives. */
const opened = await page.evaluate(() => {
  let n = 0
  for (const el of document.querySelectorAll('[aria-expanded="false"], details:not([open])')) {
    try {
      if (el.tagName === 'DETAILS') el.open = true
      else el.click()
      n++
    } catch { /* a trigger that refuses is not a finding here */ }
  }
  return n
})
await page.waitForTimeout(400)

const report = await page.evaluate(() => {
  const cs = (el) => getComputedStyle(el)
  const vis = (el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && cs(el).visibility !== 'hidden' && cs(el).display !== 'none'
  }
  const name = (el) => {
    const c = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean)
    return c.length ? '.' + c.slice(0, 3).join('.') : el.tagName.toLowerCase()
  }

  /* ---- C1 · SELECTION ------------------------------------------------------
   * Subjects derived from what MARKS selection, in ARIA or in a BEM modifier —
   * never from a list of components. */
  const SELECTED = '[aria-checked="true"],[aria-selected="true"],[aria-pressed="true"],[class*="--on"],[class*="is-selected"],[class*="is-active"],[class*="--active"],[class*="--selected"]'
  const selectedEls = [...document.querySelectorAll(SELECTED)].filter(vis)

  /* The hover treatment is not guessed: it is read off the page by hovering a
   * SIBLING of each selected element and taking its computed background. A
   * selected state that lands on the hover colour is ambiguous by construction —
   * move the mouse and two rows become indistinguishable. */
  /* ⚠️ "DISTINGUISHABLE" IS NOT "A DIFFERENT BACKGROUND". The first draft of this
   * rule compared backgroundColor alone and reported `.tab--on` and
   * `.navsub__item--on` as indistinguishable — both of which are perfectly clear,
   * because a tab marks itself with an EDGE. Measuring one property and calling
   * it the concept is the house trap; the delta has to span every channel the
   * kit is allowed to use for a state. */
  const CHANNELS = ['backgroundColor', 'color', 'borderColor', 'borderWidth', 'boxShadow', 'fontWeight', 'outlineColor', 'textDecorationLine']

  /* AND THE CUE IS ALLOWED TO LIVE IN A CHILD. A sorted table header marks
   * itself by colouring its chevron, not the <th> — comparing only the element
   * reported it as indistinguishable while it is perfectly clear on screen. So
   * the signature spans the rendered SUBTREE, plus the element's own transform
   * (a rotated chevron is a cue too) and content of ::before/::after (that is
   * how .menu__item--check draws its tick). */
  const sig = (el) => {
    const parts = []
    const one = (n) => {
      const c = cs(n)
      parts.push(CHANNELS.map((p) => c[p]).join('|') + '|' + c.transform + '|' + c.opacity)
      for (const pseudo of ['::before', '::after']) {
        const pc = getComputedStyle(n, pseudo)
        parts.push(pseudo + pc.content + pc.backgroundColor + pc.color + pc.width + pc.height)
      }
    }
    one(el)
    for (const d of el.querySelectorAll('*')) one(d)
    return parts.join('#')
  }
  const look = sig

  const c1 = []
  for (const el of selectedEls) {
    /* The control has to be an UNSELECTED sibling, which is not the same as "any
     * sibling". Taking the first one compared two lit segments of a strength
     * meter against each other and reported them as indistinguishable — they are
     * identical, and correctly so. A comparison is only evidence when the thing
     * compared against is actually the other state. */
    const sib = [...(el.parentElement?.children ?? [])].find(
      (s) => s !== el && s.tagName === el.tagName && vis(s) && !selectedEls.includes(s),
    )
    if (!sib) continue
    const rest = look(sib)
    const mine = look(el)
    const problems = []
    if (mine === rest) problems.push('renders exactly like its unselected sibling on every channel')

    /* The hover comparison, which is the defect that started this: a selected
     * state painted in the HOVER colour is ambiguous by construction — move the
     * mouse one row and two rows look the same. Read the authored :hover value
     * off the stylesheet, resolve it in context, and compare. */
    let hoverBg = null
    for (const sh of document.styleSheets) {
      try {
        for (const rule of sh.cssRules) {
          if (!rule.selectorText || !/:hover/.test(rule.selectorText)) continue
          const base = rule.selectorText.replace(/:hover/g, '')
          let m = false
          try { m = base.split(',').some((s) => sib.matches(s.trim())) } catch {}
          if (m && rule.style.backgroundColor) hoverBg = rule.style.backgroundColor
        }
      } catch {}
    }
    if (hoverBg && mine !== rest) {
      const probe = document.createElement('div')
      probe.style.backgroundColor = hoverBg
      el.appendChild(probe)
      const resolved = cs(probe).backgroundColor
      probe.remove()
      // Only a finding when the FILL is the whole difference — a row that also
      // carries an edge, a weight change or a marked-up child stays readable
      // under the cursor. Compared on the ELEMENT's own channels (the subtree
      // signature above answers a different question and cannot be indexed).
      const own = (n) => CHANNELS.map((p) => cs(n)[p])
      const a = own(el), b = own(sib)
      const onlyFillDiffers = a.every((v, i) => i === 0 || v === b[i]) && sig(el).replace(a[0], '') === sig(sib).replace(b[0], '')
      if (resolved === cs(el).backgroundColor && onlyFillDiffers) {
        problems.push(`its only cue is a fill that equals :hover (${resolved}) — indistinguishable under the cursor`)
      }
    }
    if (problems.length) c1.push({ concept: 'selected', el: name(el), problems })
  }

  /* Do all the surviving selected states AGREE with each other? That is the
   * uniformity question proper — not "is this one wrong" but "are these two
   * different". Grouped by the treatment they render. */
  /* ⚠️ AND THE SUBJECT SET HAS TO BE THE CONCEPT, NOT A STRING MATCH. Grouping
   * everything with an `--on` class put a toggle's filled track, a status dot and
   * a password-strength segment beside a chosen menu row and called the spread
   * "20 disagreeing treatments". Those three are not selection; they are state,
   * status and measurement, and they are SUPPOSED to look different.
   *
   * The kit already owns the right definition — the Role Canvas role
   * `selectable`, bound to the ARIA that NAMES selection. Use that as the
   * canonical set, and report the visual-only ones as their own finding: an
   * element that looks chosen but says nothing in ARIA is a screen-reader bug
   * wearing a styling bug's clothes. */
  /* aria-current is in here because it is the CORRECT answer for navigation:
   * "this is the page you are on" is not aria-selected, and a nav row that says
   * it properly must not be reported as saying nothing. */
  const ARIA_SELECTABLE = '[aria-selected="true"],[aria-checked="true"],[aria-pressed="true"],[aria-current]:not([aria-current="false"]),[aria-sort]:not([aria-sort="none"]),[data-role="selectable"].is-selected,[role="option"],[role="tab"],[role="radio"],[role="menuitemradio"],[role="menuitemcheckbox"]'
  /* Self OR DESCENDANT. `.radio-card--on` is a <label> wrapping a real
   * <input type="radio" checked> — the semantics are already right, they just do
   * not live on the element carrying the paint. Requiring the attribute on the
   * styled element would have pushed a redundant role onto correct markup. */
  const saysIt = (el) => { try { return el.matches(ARIA_SELECTABLE) || !!el.querySelector(ARIA_SELECTABLE) || !!el.querySelector(':checked') } catch { return false } }
  const canonical = selectedEls.filter(saysIt)

  /* ⚠️ A MODIFIER IS A WHOLE TOKEN, NOT A SUBSTRING. `--on` written as a plain
   * substring matched `avatar__status--online`, so a presence dot was filed as an
   * element that "looks chosen but says nothing in ARIA". It is a status, it is
   * not chosen, and no amount of ARIA would have fixed it. Anchored to the end of
   * the class token now. */
  const MOD = /(?:--on|--selected|--active|\bis-selected|\bis-active)(?![\w-])/
  const visualOnly = selectedEls.filter((el) => !canonical.includes(el) && MOD.test(el.getAttribute('class') || ''))

  const treatments = new Map()
  for (const el of canonical) {
    const c = cs(el)
    const key = `${c.backgroundColor} | edge:${c.boxShadow === 'none' ? 'none' : 'yes'} | weight:${c.fontWeight}`
    if (!treatments.has(key)) treatments.set(key, [])
    treatments.get(key).push(name(el))
  }
  const c4 = [...new Set(visualOnly.map(name))].map((n) => ({ concept: 'selection-without-aria', el: n }))

  /* ---- C2 · SCROLL RAILS ---------------------------------------------------
   * Subjects derived from what ACTUALLY scrolls, not from what declares
   * overflow — a container that never overflows shows no rail and is not a
   * finding. */
  const c2 = []
  for (const el of document.querySelectorAll('*')) {
    const c = cs(el)
    const scrolls =
      (/auto|scroll/.test(c.overflowY) && el.scrollHeight > el.clientHeight + 1) ||
      (/auto|scroll/.test(c.overflowX) && el.scrollWidth > el.clientWidth + 1)
    if (!scrolls) continue
    const reserved = el.offsetWidth - el.clientWidth || el.offsetHeight - el.clientHeight
    if (reserved === 0) continue                        // an overlay rail paints nothing to style
    const treated = c.scrollbarWidth === 'thin' || (c.scrollbarColor && c.scrollbarColor !== 'auto')
    if (!treated) c2.push({ concept: 'scroll-rail', el: name(el), reserved: `${reserved}px`, note: 'OS default rail — dark bar on a light surface' })
  }

  /* ---- C3 · ORPHAN CLASSES -------------------------------------------------
   * A rendered class with no CSS rule ANYWHERE, whose own BEM family IS styled.
   * The family test is what makes this list-free: `data-testid`-style hooks and
   * JS-only classes have no styled family, so they never register. */
  const styled = new Set()
  for (const sh of document.styleSheets) {
    try {
      const walk = (rules) => {
        for (const r of rules) {
          if (r.cssRules) walk(r.cssRules)
          if (!r.selectorText) continue
          for (const m of r.selectorText.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) styled.add(m[1])
        }
      }
      walk(sh.cssRules)
    } catch {}
  }
  const rendered = new Map()
  for (const el of document.querySelectorAll('*')) {
    const raw = el.getAttribute('class')
    if (!raw) continue
    for (const c of raw.trim().split(/\s+/)) {
      if (!c) continue
      if (!rendered.has(c)) rendered.set(c, 0)
      rendered.set(c, rendered.get(c) + 1)
    }
  }
  const c3 = []
  for (const [cls, count] of rendered) {
    if (styled.has(cls)) continue

    /* AN ANCHOR IS NOT AN ORPHAN. `.inpagenav__item` has no rule of its own and
     * does not need one: it exists so `.inpagenav__item--nested` has something to
     * hang on, and that modifier IS styled. A class carrying a styled modifier is
     * doing its job. Derived from the class name, so still no allow-list. */
    if ([...styled].some((s) => s.startsWith(cls + '--'))) continue

    const base = cls.split('--')[0].split('__')[0]
    const familyStyled = [...styled].some((s) => s !== cls && (s.startsWith(base + '__') || s.startsWith(base + '--') || s === base))
    if (familyStyled) c3.push({ concept: 'orphan-class', el: '.' + cls, count, note: `its BEM family (${base}) is styled — this member is not` })
  }

  return {
    counts: { selectedEls: selectedEls.length, canonical: canonical.length, scrollers: c2.length, rendered: rendered.size },
    c1, c2, c3, c4,
    treatments: [...treatments.entries()].map(([k, v]) => ({ treatment: k, count: v.length, examples: [...new Set(v)].slice(0, 6) })),
  }
})

await browser.close()

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2))
  process.exit(0)
}

const line = (s = '') => console.log(s)
line(`audit:uniformity — ${opened} disclosures opened, ${report.counts.selectedEls} selected elements, ${report.counts.rendered} distinct classes rendered`)
line('Concepts, not components: every instance derived from the DOM.\n')

const section = (title, rows, fmt) => {
  if (!rows.length) return line(`  ✓ ${title} — clean\n`)
  line(`  ✗ ${title} — ${rows.length}`)
  for (const r of rows.slice(0, 20)) line(`      ${fmt(r)}`)
  if (rows.length > 20) line(`      …${rows.length - 20} more`)
  line()
}

section('C1 · a selected state must be distinguishable', report.c1, (r) => `${r.el}  →  ${r.problems.join(' + ')}`)
section('C2 · every scroll rail carries the kit treatment', report.c2, (r) => `${r.el}  →  ${r.reserved} of OS rail (${r.note})`)
section('C3 · no rendered class without CSS while its family has it', report.c3, (r) => `${r.el} ×${r.count}  →  ${r.note}`)
section('C4 · looks chosen but says nothing in ARIA', report.c4, (r) => `${r.el}  →  visual --on with no aria-selected/checked`)

line(`  Selected-state treatments across the ${report.counts.canonical} ARIA-declared selectables: ${report.treatments.length}` +
  (report.treatments.length > 1 ? '  ← they should agree' : '  ← uniform'))
for (const t of report.treatments) line(`      ${String(t.count).padStart(3)} × ${t.treatment}\n            ${t.examples.join(' · ')}`)

const failures = report.c1.length + report.c2.length + report.c3.length + report.c4.length
line()
line(failures
  ? `audit:uniformity — ${failures} disagreement(s). These are not component bugs; they are the same bug in N places.`
  : 'audit:uniformity — every instance agrees.')
process.exit(0)
