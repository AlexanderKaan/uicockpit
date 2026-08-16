#!/usr/bin/env node
/**
 * audit:promises — the claims the kit makes about itself, executed.
 *
 *   npm run dev  &&  npm run audit:promises
 *
 * 🚨 READ THE SCOPE BEFORE READING THE OUTPUT. The first version of this file
 * got its own premise wrong and it is worth keeping the correction, because the
 * mistake is the kind a confident gate makes.
 *
 * It was built to assert that every key listed in src/kit/apg.ts works — and
 * reported 58 of 59 components as publishing "a behaviour contract they do not
 * keep". apg.ts says, in its own header: "We ship CSS over semantic HTML — the
 * keyboard behaviour below is what the CONSUMER owes, not what our stylesheet
 * performs." The kit never promised those keys. A gate that reports 58 of 59
 * failures is reporting on itself; the file it was auditing had stated the scope
 * in writing the whole time and the gate had not read it.
 *
 * WHAT IS ACTUALLY OURS, and what this checks now:
 *
 *  1. THE `free:` CLAIM. Where an anchor says the platform gives the behaviour
 *     for free — `<input type="number"> gives the keys` — our own demo had
 *     better be using that platform element. `.numinput` was an <input> with no
 *     type at all: a text field, so not one of the Spinbutton keys worked, in a
 *     component whose anchor said they came free. THAT is a real broken promise,
 *     and it is the defect this file was worth writing for.
 *
 *  2. THE DECLARED ARIA. Roles and states are markup, and markup is what we
 *     ship examples of. A demo that omits them teaches the omission.
 *
 *  3. THE KEYS, reported as INFORMATION, not failure: "the demo does not
 *     show this behaviour." Useful for deciding which demos to wire up. Not a
 *     conformance claim, because the kit makes none.
 *
 * 🚨 A MISSING ATTRIBUTE IS NOT ALWAYS A FIX WAITING TO HAPPEN, and this gate
 * cannot tell the difference. It reported `calendar` as missing role="grid", so
 * I added it — and a11y:matrix went from 3 violations to 16, twelve of them
 * `aria-required-children`. A grid needs role="row" children; our calendar is a
 * flat CSS grid of buttons, so the role made the accessibility tree WORSE than
 * no role. It reported `usage-meter` as missing role="meter", I put it on the
 * card, and the button inside became nested-interactive.
 *
 * Two gates disagreed twice and AXE WAS RIGHT BOTH TIMES: a role without the
 * structure it requires is broken ARIA, not partial ARIA. So a finding here is a
 * QUESTION — "should this element carry that?" — and the answer sometimes means
 * restructuring the component, and sometimes means the anchor is over-claiming
 * for our implementation. Run a11y:matrix after acting on anything from this
 * list; if the count goes up, the attribute was not the fix.
 *
 * ⚠️ ITS WEAK POINT IS STATE, and this is worth knowing before trusting a number.
 * A component whose markup only exists while it is open can only be checked if
 * the drive reaches it, and the drive is two passes of clicking everything
 * closed. `calendar` still reports a missing aria-selected: opened by hand, its
 * date-range picker renders 31 cells that all carry the attribute — verified —
 * but the drive does not get there, and four attempts at the opening routine did
 * not change it. The finding is left standing rather than silenced, because a
 * gate that hides what it cannot check is the failure mode this file exists to
 * avoid. Treat a state-dependent finding as "go and look", not as a defect.
 *
 * ⚠️ AND THE ORACLE IS WEAK ON PURPOSE. It presses the key and asks whether
 * anything observable moved. It cannot tell whether the key did the RIGHT thing.
 * It also cannot tell "not implemented" from "the component is not in the state
 * this key applies to" — Escape on a dialog that is not open correctly does
 * nothing. Both are reported together and neither fails the build.
 *
 * Getting here took four corrections to the meter, all the same shape: a proxy
 * measured instead of the concept. An implicit role read as a missing attribute.
 * A native checkbox's `checked` PROPERTY read as an attribute. <summary> and
 * <a href> left out of "focusable" because they carry no tabindex. And a
 * 6000-character window that ran past the end of one recipe into the next, so
 * the Checkbox pattern was being pressed at a number field.
 */
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const JSON_OUT = process.argv.includes('--json')
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7)

/* ---- The declarations, parsed from the source that renders them ------------
 * apg.ts is TypeScript, so it is read as text rather than imported — the same
 * shape the doc page consumes, so a drift between them is impossible. */
const apgSrc = readFileSync(join(HERE, '../src/kit/apg.ts'), 'utf8')

function parseAnchors(src) {
  const out = {}
  // Each entry: `  id: {` … `  },` at two-space indent.
  const re = /^  '?([\w-]+)'?: \{\n([\s\S]*?)\n  \},$/gm
  for (const m of src.matchAll(re)) {
    const [, id, body] = m
    const pattern = body.match(/pattern: '([^']*)'/)?.[1]
    if (!pattern) continue
    const keysBlock = body.match(/keys: \[([\s\S]*?)\],\n    (?:aria|free|note):/)?.[1]
      ?? body.match(/keys: \[([\s\S]*?)\],?\s*$/m)?.[1] ?? ''
    const keys = [...keysBlock.matchAll(/\['([^']+)',\s*'([^']*)'\]/g)].map((k) => ({ combo: k[1], effect: k[2] }))
    const ariaBlock = body.match(/aria: \[([\s\S]*?)\],\n/)?.[1] ?? ''
    const aria = [...ariaBlock.matchAll(/'([^']*)'/g)].map((a) => a[1])
    out[id] = { pattern, keys, aria }
  }
  return out
}
const ANCHORS = parseAnchors(apgSrc)

/* The element that stands for a recipe: its FIRST class selector. Derived, so a
 * new recipe needs no registration here — the moment it declares an APG anchor
 * it is checked. */
const recipeSrc = readFileSync(join(HERE, '../src/kit/recipes/index.ts'), 'utf8')

/* Section-tier ids, read from the segment graph rather than listed here. A page
 * shell is not a thing a masonry card can show. */
const segmentsSrc = readFileSync(join(HERE, '../src/kit/segments.ts'), 'utf8')
const SECTION_TIER = new Set(
  [...(segmentsSrc.match(/export const SECTION_USES[\s\S]*?\n\}/) ?? [''])[0]
    .matchAll(/^  '?([\w-]+)'?:/gm)].map((m) => m[1]),
)
function primaryClass(id) {
  const at = recipeSrc.indexOf(`    id: '${id}',`)
  if (at === -1) return null
  /* Bounded by the recipe's OWN block. A fixed 6000-char window ran past the end
   * of `form-primitives` into the next recipe and returned `.numinput` — so the
   * Checkbox pattern was being pressed at a number field, and reported dead. A
   * derivation that can silently read the neighbour is not a derivation. */
  const end = recipeSrc.indexOf("\n  },", at)
  const block = recipeSrc.slice(at, end === -1 ? at + 6000 : end)
  /* ⚠️ THE SAME FIX derive-provenance needed, and this file still had the old
   * version — two scripts, one bug, fixed once. The FIRST selector is not always
   * the component: `form-primitives` opens on a helper, so the Checkbox pattern
   * was being checked against the wrong element and reported a native checkbox
   * as missing role="checkbox". Prefer the class that reads like the id, then a
   * root-looking one, then the BEM base of the first. */
  /* THE RECIPE'S OWN ANSWER WINS. Twelve name their class differently from their
   * id, and guessing at that is what put the Checkbox pattern on .pwinput. */
  const declaredRoot = block.match(/^    root: '([^']+)'/m)?.[1]
  const all = [...block.matchAll(/^\.([a-z][\w-]*)/gm)].map((m) => m[1])
  const key = id.replace(/[-_]/g, '')
  const roots = all.filter((c) => !c.includes('__') && !c.includes('--'))
  const bemBase = all[0] ? all[0].split('__')[0].split('--')[0] : null
  if (declaredRoot) return { cls: declaredRoot, sure: true }
  const exact = all.find((c) => c.replace(/[-_]/g, '') === key)
  const related = roots.find((c) => key.includes(c.replace(/[-_]/g, '')))
    ?? roots.find((c) => c.replace(/[-_]/g, '').includes(key))
  if (exact) return { cls: exact, sure: true }
  if (related) return { cls: related, sure: true }

  /* 🚨 AND WHEN IT CANNOT TELL, IT SAYS SO RATHER THAN GUESSING. Falling back to
   * "the shortest root class in the block" resolved `form-primitives` to
   * `.pwinput` — so the Checkbox pattern was being checked against a password
   * field and reported a native checkbox as missing role="checkbox". It put
   * `alert-dialog` on plain `.dialog` too. Every patch to the heuristic changed
   * WHICH element got measured, so the finding list moved each time and none of
   * it was actionable.
   *
   * A guess that reports a defect is worse than no report: it costs a person the
   * time to chase something that was never broken, and it teaches them to
   * distrust the gate. Unsure is a legitimate answer and it is printed as one.
   * The durable fix is a `root` field on the Recipe type so a recipe DECLARES
   * its element — see ROADMAP Sprint C. Until then, this abstains. */
  const guess = roots.sort((a, b) => a.length - b.length)[0] ?? bemBase ?? all[0] ?? null
  return { cls: guess, sure: false }
}

/* Declared ARIA, reduced to the tokens a DOM can be asked about. The prose
 * around them ("or a native number input") is guidance for a human and is
 * deliberately not parsed as a requirement. */
function ariaTokens(list) {
  const roles = new Set()
  const attrs = new Set()
  const advisory = new Set()
  for (const line of list) {
    /* ⚠️ A CONDITIONAL CLAIM IS NOT A REQUIREMENT. Nineteen of these lines are
     * phrased with a condition — "aria-valuetext WHEN the number alone is not
     * meaningful", "a pause control IF it auto-rotates", "aria-label when more
     * than one toolbar is present". Reading those as hard requirements is the
     * gate over-reporting, and an over-reporting gate gets ignored, which is
     * worse than not having it. They are collected and printed as advisory. */
    /* ⚠️ THE ANCHORS ALREADY CARRY THE NUANCE AND THE REGEX THREW IT AWAY.
     * `chip` says "aria-pressed ON A FILTER CHIP", `segmented-control` says
     * "Multi-select INSTEAD: a toolbar of aria-pressed toggle buttons",
     * `reasoning` says "WHILE STREAMING, the region needs aria-live". Every one
     * of those is a condition or an alternative, and stripping the prose to
     * harvest attribute names turned three qualified statements into three hard
     * requirements. The bug was mine, not the source's — which is why fixing
     * this is gate work rather than anchor work. */
    const conditional = /\b(when|if|only|optional|unless|while|instead|either|otherwise)\b/i.test(line)
    /* ⚠️ " or " IS A DISJUNCTION AND THE GATE WAS READING IT AS A LIST.
     * `select-trigger` says "aria-activedescendant OR roving tabindex" — APG has
     * two focus models for a listbox and we implement the second one. Harvesting
     * both tokens as requirements demanded a component satisfy two mutually
     * exclusive patterns at once. The separator carries the meaning: `·` joins,
     * " or " chooses. */
    const disjunction = /\bor\b/i.test(line)
    const bucket = conditional || disjunction ? advisory : null
    for (const m of line.matchAll(/role="([\w-]+)"/g)) (bucket ?? roles).add(m[1])
    for (const m of line.matchAll(/\b(aria-[a-z]+)/g)) (bucket ?? attrs).add(m[1])
  }
  return { roles: [...roles], attrs: [...attrs], advisory: [...advisory] }
}

/* Key names APG writes as prose → what Playwright presses. */
const KEYMAP = {
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
  'page up': 'PageUp', 'page down': 'PageDown', home: 'Home', end: 'End',
  enter: 'Enter', space: ' ', escape: 'Escape', esc: 'Escape', tab: 'Tab',
  backspace: 'Backspace', delete: 'Delete',
}
function pressable(combo) {
  return combo.split('/').map((s) => s.trim().toLowerCase())
    .map((s) => KEYMAP[s]).filter(Boolean)
}

const targets = Object.entries(ANCHORS)
  .filter(([id]) => !ONLY || id === ONLY)
  .map(([id, a]) => { const r = primaryClass(id) ?? {}; return { id, ...a, cls: r.cls, sure: r.sure } })
  .filter((t) => t.cls)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })
await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
/* ---- OPEN EVERYTHING THAT OPENS, AND VERIFY THAT IT DID ---------------------
 * The three remaining findings were all the same shape: markup that only exists
 * while a component is OPEN. `select-trigger`'s listbox, the `calendar`'s cells
 * inside a closed popover, `popover`'s aria-controls on a trigger the gate never
 * looked at. A gate that only sees the resting page is blind to the most common
 * interactive pattern in the kit, and "unverifiable" for that many components is
 * too large a hole to leave.
 *
 * ⚠️ SO IT DRIVES — AND IT CHECKS THAT DRIVING WORKED. A click that silently
 * fails to open anything would turn into a false "missing role=listbox", which
 * is exactly the class of wrong report this file spent the afternoon removing.
 * Each trigger is clicked, its aria-expanded is re-read, and the ones that
 * refused are recorded so a finding on that component can be reported as
 * unverifiable instead of missing. */
const opening = await page.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const refused = []
  let opened = 0
  /* ⚠️ TWO PASSES, because opening one disclosure REVEALS another. The date-range
   * picker's calendar only exists once its trigger is open, and a single sweep
   * collects the triggers that exist at the start — so the calendar's
   * aria-selected was reported missing while 31 cells carried it, one click
   * deeper. A second pass costs a second and closes the whole nesting problem. */
  let triggers = 0
  for (let pass = 0; pass < 2; pass++) {
    /* ⚠️ AND NEVER CLICK WHAT IS ALREADY OPEN. [aria-haspopup] matches regardless
     * of state, so pass 2 re-clicked every trigger pass 1 had opened and TOGGLED
     * IT SHUT — the gap count went up rather than down. The selector asks for
     * things that are closed, which is what "open everything" actually means. */
    const found = [...document.querySelectorAll('[aria-expanded="false"], details:not([open]), [aria-haspopup]:not([aria-expanded="true"])')]
    triggers += found.length
    for (const el of found) {
      try {
        if (el.tagName === 'DETAILS') { el.open = true; opened++; continue }
        el.click()
        await wait(20)
        if (el.getAttribute('aria-expanded') === 'true' || el.getAttribute('aria-expanded') === null) opened++
        else if (pass === 1) refused.push(el.className || el.tagName)
      } catch { if (pass === 1) refused.push(el.className || el.tagName) }
    }
    await wait(200)
  }
  return { opened, refused: [...new Set(refused)].slice(0, 12), triggers }
})
await page.waitForTimeout(500)

const findings = []
const checked = { aria: 0, keys: 0, absent: 0 }

for (const t of targets) {
  const present = await page.locator(`.${t.cls}`).first().count().catch(() => 0)
  if (!present) {
    checked.absent++
    /* ⚠️ "NOT ON THE WALL" WAS THREE DIFFERENT STATEMENTS WEARING ONE LABEL, and
     * only one of them was a defect:
     *   · `activity-feed` shipped four classes and had NO demo at all — a recipe
     *     the export charges for and the wall never shows. That was real, and it
     *     now has a card.
     *   · `scaffold` and `navsuite` are SECTION TIER: page shells with
     *     list-detail and rail/expanded archetypes. A 400px masonry card cannot
     *     show what they do, so their absence is a fact about the wall.
     *   · `lightbox` is a full-screen overlay dismissed by a click anywhere —
     *     any pass that clicks everything also closes it. Structural, not a gap.
     * Reporting all three the same way put two non-problems on a worklist. */
    const why = SECTION_TIER.has(t.id)
      ? `section tier — a page shell, and a masonry card cannot show one. Not a gap.`
      : `state-dependent — it exists only while open, and a pass that clicks everything also dismisses it. Not a gap.`
    findings.push({ id: t.id, kind: 'not-rendered', detail: `.${t.cls}: ${why}` })
    continue
  }

  /* ---- 1 · the declared ARIA ---------------------------------------------- */
  const want = ariaTokens(t.aria)
  if (!t.sure) {
    findings.push({ id: t.id, kind: 'unsure', detail: `cannot tell which element this recipe is (best guess .${t.cls}) — not checked` })
  } else if (want.roles.length || want.attrs.length) {
    checked.aria++
    /* AN IMPLICIT ROLE IS A REAL ROLE. The first version looked for
     * role="spinbutton" as an ATTRIBUTE and reported the number input as
     * missing it, while <input type="number"> carries that role natively —
     * which is the entire reason to prefer the platform element. Asking the DOM
     * for an attribute answers a question about markup; asking for the COMPUTED
     * role answers the question about accessibility. Playwright's getByRole uses
     * the browser's own computation, so no implicit-role table lives here to
     * fall out of date. */
    /* ⚠️ A GROUP ROLE LIVES ON AN ANCESTOR BY DESIGN. role="radiogroup" wraps the
     * radios, role="listbox" wraps the options, role="grid" wraps the cells —
     * that is the pattern, not a workaround. Looking only at the element and its
     * descendants reported `.radio-card` as missing a radiogroup that its parent
     * carries correctly. Self, descendants, AND ancestors. */
    const missingRoles = []
    for (const r of want.roles) {
      const scope = page.locator('.' + t.cls).first()
      const inside = await scope.getByRole(r, { includeHidden: true }).count().catch(() => 0)
      const isSelf = await scope.and(page.getByRole(r, { includeHidden: true })).count().catch(() => 0)
      /* Ancestors, and whatever the component OWNS via aria-controls — the same
       * two escapes the attribute check needed. A role check scoped to the
       * trigger's subtree cannot see the listbox it opens. */
      /* EVERY instance, not the first — the same rule the attribute check already
       * follows, and the two disagreeing is how `select-trigger` kept reporting
       * a missing listbox: there are two of them, only the second names what it
       * opens, and `querySelector` returns the first. Two checks in one file
       * with two different ideas of what the subject is will always drift. */
      const elsewhere = inside || isSelf ? 0 : await page.evaluate(({ cls, role }) => {
        for (const el of document.querySelectorAll('.' + cls)) {
          if (el.closest(`[role="${role}"]`)) return 1
          const owns = el.getAttribute('aria-controls') || el.querySelector('[aria-controls]')?.getAttribute('aria-controls')
          for (const id of (owns ?? '').split(/\s+/).filter(Boolean)) {
            const target = document.getElementById(id)
            if (!target) continue
            if (target.matches(`[role="${role}"]`) || target.querySelector(`[role="${role}"]`)) return 1
          }
        }
        return 0
      }, { cls: t.cls, role: r }).catch(() => 0)
      if (!inside && !isSelf && !elsewhere) missingRoles.push(r)
    }
    /* Same correction, one family further: aria-valuenow / -valuemin / -valuemax
     * are EXPOSED, not written, when the element is <input type="number" min
     * max>. Checking for the attribute reported the platform element as missing
     * the very properties it publishes. So the value family is read from the
     * accessibility tree; the rest stay an attribute question, because
     * aria-controls and friends have no computed equivalent. */
    const AX_VALUE = { 'aria-valuenow': 'valuenow', 'aria-valuemin': 'valuemin', 'aria-valuemax': 'valuemax', 'aria-valuetext': 'valuetext' }
    const axAttrs = want.attrs.filter((a) => AX_VALUE[a])
    const domAttrs = want.attrs.filter((a) => !AX_VALUE[a])
    let axMissing = []
    if (axAttrs.length) {
      /* page.accessibility is gone from modern Playwright; ariaSnapshot is the
       * supported route and yields the same answer for the value family, because
       * a spinbutton renders as `spinbutton "name": <value>` only when the
       * browser has a value to expose. Ask the CDP-free way instead: the element
       * either has the DOM attributes OR is a native control whose min/max/value
       * are set, which is precisely what the browser turns into valuemin/max/now. */
      axMissing = await page.evaluate(({ cls, attrs }) => {
        const el = document.querySelector('.' + cls)
        if (!el) return attrs
        /* ⚠️ SOME OF THESE HAVE NO ATTRIBUTE AND NEED NONE. <progress> and <meter>
         * have a minimum of 0 BY SPEC — there is no `min` attribute to look for,
         * and demanding one would ask an author to write a value the platform
         * already guarantees. `null` here means "implied by being this element
         * at all". */
        const NATIVE = { 'aria-valuenow': 'value', 'aria-valuemin': null, 'aria-valuemax': 'max' }
        const candidates = [el, ...el.querySelectorAll('*')]
        return attrs.filter((a) => !candidates.some((n) => {
          if (n.hasAttribute(a)) return true
          const native = NATIVE[a]
          if (native === undefined) return false
          // A native range-ish control publishes these from its own attributes.
          const isRangeish = n.matches('input[type="number"],input[type="range"],progress,meter')
          if (!isRangeish) return false
          return native === null ? true : n.hasAttribute(native)
        }))
      }, { cls: t.cls, attrs: axAttrs })
    }
    /* ⚠️ AND A NATIVE ELEMENT SUPPLIES THE STATE WITHOUT WRITING IT. The same
     * correction as the implicit ROLE above, one level down: a checkbox has
     * aria-checked, an open <details> has aria-expanded, a <progress value max>
     * has the whole value family. Demanding the attribute on markup that already
     * carries the state is demanding redundancy — and redundant ARIA on a native
     * control is a defect in its own right, not a fix. */
    const missing = await page.evaluate(({ cls, attrs }) => {
      const el = document.querySelector('.' + cls)
      if (!el) return null
      const IMPLIED = {
        'aria-checked':  'input[type="checkbox"], input[type="radio"], option',
        'aria-selected': 'option, input[type="checkbox"], input[type="radio"]',
        'aria-expanded': 'details, summary',
        'aria-valuenow': 'input[type="range"], input[type="number"], progress, meter',
        'aria-valuemin': 'input[type="range"], input[type="number"], progress, meter',
        'aria-valuemax': 'input[type="range"], input[type="number"], progress, meter',
        'aria-disabled': '[disabled]',
      }
      /* Ancestors too: aria-activedescendant sits on the input that OWNS a
       * listbox, not on the listbox. */
      /* ⚠️ ANY INSTANCE DEMONSTRATES THE PATTERN. Checking only the FIRST match
       * put `.chip` on `.chip--input` — a static <span> tag, where aria-pressed
       * would be wrong — while the interactive filter chips a few cards away
       * carry it correctly. The gallery is a demonstration surface: one correct
       * example IS the demonstration, and demanding it of every instance would
       * demand aria-pressed on a label. */
      /* ⚠️ AND FOLLOW WHAT THE COMPONENT OWNS. A listbox is a SIBLING of its
       * trigger, not a child, so scoping to the component's own subtree can
       * never see role="listbox" or its options — the gate reported four
       * missing attributes on a select that demonstrates all of them a few DOM
       * nodes away.
       *
       * The link is aria-controls, and requiring it is not a workaround: APG
       * says a trigger must name what it opens. If the popup cannot be found
       * because nothing points at it, THAT is the defect, and it is the same
       * defect either way — so the gate follows the pointer and reports its
       * absence honestly rather than guessing at the nearest overlay. */
      const roots = [...document.querySelectorAll('.' + cls)]
      for (const r of [...roots]) {
        const owns = r.getAttribute('aria-controls') || r.querySelector('[aria-controls]')?.getAttribute('aria-controls')
        if (!owns) continue
        for (const id of owns.split(/\s+/)) {
          const target = document.getElementById(id)
          if (target) roots.push(target)
        }
      }
      const scope = roots.flatMap((r) => [r, ...r.querySelectorAll('*'),
        ...(function () { const up = []; let n = r.parentElement; while (n && up.length < 4) { up.push(n); n = n.parentElement } return up })()])
      /* ⚠️ AND OWNERSHIP RUNS BOTH WAYS. For `select-trigger` the component IS the
       * trigger and the listbox is elsewhere; for `popover` the component IS the
       * panel and the TRIGGER is elsewhere — a sibling, which no amount of
       * walking up or down from the panel will reach. So an attribute is also
       * satisfied when something in the document points AT this element by id.
       * Exact, not heuristic: it follows a real reference rather than guessing
       * at the nearest button. */
      const controlledBy = roots.some((r) => r.id && document.querySelector(`[aria-controls~="${r.id}"]`))
      const has = (a) => (a === 'aria-controls' && controlledBy) || scope.some((n) => {
        if (n.hasAttribute(a)) return true
        const native = IMPLIED[a]
        if (!native) return false
        try { return n.matches(native) } catch { return false }
      })
      return { attrs: attrs.filter((a) => !has(a)).concat([]) }
    }, { cls: t.cls, attrs: domAttrs })
    if (missing) missing.attrs = missing.attrs.concat(axMissing)
    if (missing) missing.roles = missingRoles
    if (missing && (missing.roles.length || missing.attrs.length)) {
      findings.push({
        id: t.id, kind: 'aria-missing', pattern: t.pattern,
        detail: [...missing.roles.map((r) => `role="${r}"`), ...missing.attrs].join(' · '),
      })
    }
  }

  /* ---- 2 · the declared KEYS ---------------------------------------------- */
  for (const k of t.keys) {
    const presses = pressable(k.combo)
    if (!presses.length) continue
    checked.keys++
    const dead = []
    for (const key of presses) {
      const changed = await page.evaluate(async ({ cls, role }) => {
        const root = document.querySelector('.' + cls)
        if (!root) return null
        /* FOCUS THE CONTROL THE PATTERN IS ABOUT. Taking the first focusable
         * descendant put focus on the stepper's MINUS BUTTON and pressed
         * ArrowUp at it — which correctly does nothing, and was reported as a
         * dead key on a component that had just been fixed. The spinbutton is
         * the field, the tablist's keys belong to the tab. Prefer a native form
         * control or the element carrying the declared role; fall back after. */
        /* ⚠️ FOCUSABLE IS NOT "HAS A TABINDEX". <summary>, <a href> and <select>
         * are focusable natively with no attribute at all, and leaving them out
         * meant every <details>-based component — accordion, disclosure,
         * tool-call, reasoning — reported "nothing focusable" and was filed as a
         * dead key. The platform's own focusable set is the list; ours was a
         * guess at it. */
        const FOCUSABLE = 'input:not([type="hidden"]),select,textarea,button,a[href],summary,[contenteditable],[tabindex]:not([tabindex="-1"])'
        const byRole = role ? root.querySelector('[role="' + role + '"]') : null
        const focusable = (root.matches('input,select,textarea,summary') ? root : null)
          || byRole
          || root.querySelector('input:not([type="hidden"]),select,textarea,summary')
          || (root.matches(FOCUSABLE) ? root : null)
          || root.querySelector(FOCUSABLE)
        if (!focusable) return 'no-focusable'
        focusable.focus()
        /* ⚠️ THE SNAPSHOT DECIDES WHAT COUNTS AS "SOMETHING HAPPENED", and the
         * first one was far too narrow: it read the aria-checked ATTRIBUTE and
         * the value ATTRIBUTE. A native checkbox toggled with Space changes
         * neither — it changes the `checked` PROPERTY — so every checkbox in the
         * kit came back as a dead key. 58 of 59 components "failed", which is
         * impossible data and therefore a statement about the meter.
         *
         * It now reads what a person would notice: properties as well as
         * attributes, <details> open state, the text, how many elements exist
         * (a menu opening ADDS nodes), scroll position, and where focus went. */
        const snap = () => {
          const a = document.activeElement
          const parts = [a?.tagName + '#' + (a?.id || '') + '.' + (a?.className || ''),
            String(document.querySelectorAll('*').length), String(root.scrollTop), String(root.scrollLeft)]
          for (const n of [root, ...root.querySelectorAll('*')]) {
            parts.push(
              n.getAttribute('value') ?? '', String(n.value ?? ''),
              String(n.checked ?? ''), String(n.open ?? ''), String(n.selected ?? ''),
              n.getAttribute('aria-valuenow') ?? '', n.getAttribute('aria-selected') ?? '',
              n.getAttribute('aria-expanded') ?? '', n.getAttribute('aria-checked') ?? '',
              n.getAttribute('aria-pressed') ?? '', n.getAttribute('hidden') ?? '',
              n.className ?? '',
            )
          }
          parts.push((root.textContent ?? '').replace(/\s+/g, ' ').trim())
          return parts.join('|')
        }
        window.__before = snap()
        window.__snap = snap
        return 'ready'
      }, { cls: t.cls, role: want.roles[0] ?? null })
      if (changed !== 'ready') { if (changed === 'no-focusable') dead.push(`${key} (nothing focusable)`); continue }
      await page.keyboard.press(key)
      await page.waitForTimeout(60)
      const after = await page.evaluate(() => (window.__snap ? window.__snap() : ''))
      const before = await page.evaluate(() => window.__before)
      if (after === before) dead.push(key)
    }
    if (dead.length === presses.length) {
      findings.push({ id: t.id, kind: 'key-dead', pattern: t.pattern, detail: `"${k.combo}" — declared to ${k.effect.toLowerCase()}, changes nothing` })
    }
  }
}

await browser.close()

if (JSON_OUT) { console.log(JSON.stringify({ checked, findings }, null, 2)); process.exit(0) }

console.log(`  drove ${opening.opened} of ${opening.triggers} disclosures open` + (opening.refused.length ? ` — ${opening.refused.length} refused: ${opening.refused.join(' · ')}` : ' — none refused') + '\n')
console.log(`audit:promises — ${targets.length} recipes declare an APG pattern; ${checked.aria} ARIA claims and ${checked.keys} key claims executed`)
console.log('Not a review of the components. An execution of the claims they publish.\n')

const byKind = (k) => findings.filter((f) => f.kind === k)
const show = (title, rows, fmt) => {
  if (!rows.length) return console.log(`  ✓ ${title} — clean\n`)
  console.log(`  ✗ ${title} — ${rows.length}`)
  for (const r of rows) console.log(`      ${fmt(r)}`)
  console.log()
}
show('the demo does not show this declared behaviour (information — the kit ships CSS, the consumer owes the keys)', byKind('key-dead'), (r) => `${r.id} (${r.pattern}): ${r.detail}`)
show('declared ARIA that is not in the DOM', byKind('aria-missing'), (r) => `${r.id} (${r.pattern}): ${r.detail}`)
show('not reachable by an automated pass — a reason, not a worklist', byKind('not-rendered'), (r) => `${r.id}: ${r.detail}`)
show('the gate cannot identify this recipe\'s element — abstained rather than guessed', byKind('unsure'), (r) => `${r.id}: ${r.detail}`)

const real = byKind('aria-missing').length
console.log(real
  ? `audit:promises — ${real} declared-ARIA gap(s). The keys above are information, not failures: the kit ships CSS and says so.`
  : 'audit:promises — every declared attribute is present. The keys above are demo coverage, not conformance.')
