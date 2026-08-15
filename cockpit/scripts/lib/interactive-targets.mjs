/**
 * The derived denominator.
 *
 * WHY THIS FILE EXISTS, and it is worth being blunt about it. Our target-size
 * claim — "0/250 interactive controls under 44px", printed in the conformance
 * report we hand to a buyer — was measured over a HAND-WRITTEN list of eleven
 * selectors:
 *
 *   .btn .in .list__row .menu__item .navsub__item .tab
 *   .segctrl__btn .calendar__cell .select-trigger .navrow .opt
 *
 * Every control nobody remembered to add was invisible. The slider, the switch,
 * the resize splitter, chip removes, stepper buttons, carousel controls: none of
 * them on the list, none of them measured, and the scan still printed a zero.
 * "0 of 250" meant "0 of the 250 that matched my list" — which is not a
 * measurement of the kit, it is a measurement of the list.
 *
 * That is the failure mode a design system cannot afford twice, so the rule is
 * now general: A METER DERIVES ITS SUBJECTS; IT NEVER CARRIES A LIST OF THEM.
 * A new component appears in the denominator the moment it renders, without
 * anyone updating a scan — and a claim that covers everything is the only kind
 * worth publishing.
 *
 * The second rule is about the other end. Some things genuinely are not targets,
 * and excluding them is legitimate — but a silent exclusion is indistinguishable
 * from a scan that missed something. So every exclusion is NAMED, carries its
 * reason, and the count is PRINTED next to the result.
 *
 * ⚠️ AND THE THIRD RULE, WHICH THIS FILE LEARNED BY BREAKING IT. What comes out
 * of here is a SIZE, not a VERDICT. WCAG 2.5.8 permits an undersized target when
 * there is enough clear space around it — a 24px circle centred on each target
 * must not touch another's — and computing that is a different, harder job than
 * measuring a box.
 *
 * The first version of this file did not know that and reported "94 targets
 * under 24px" as if it were 94 breaches. axe-core, which does implement the
 * spacing exception, finds TWO on the same page, with 519 passing. The 94 was
 * true and meant almost nothing; it went into the conformance report as a
 * failure and had to be taken back out.
 *
 * So: this scan owns the DENOMINATOR, which is the thing it was built to fix and
 * which axe cannot give us per component. axe owns the VERDICT. Anything printed
 * from here says "under Npx", never "fails".
 */

/**
 * Runs IN THE PAGE. Derives every interactive target under `rootSel`.
 *
 * Self-contained by necessity: Playwright serialises this function's source, so
 * it may not close over anything. Both tables arrive as arguments.
 *
 * @param {{rootSel: string, exclude: Array<[string, string]>, floor: number}} arg
 */
export function deriveTargets({ rootSel, exclude, floor }) {
  const root = document.querySelector(rootSel)
  if (!root) return { error: `no ${rootSel} on the page` }

  /* What makes something a target: it accepts a pointer action. Derived from
   * the platform's own answer (native controls, focusability, ARIA roles that
   * mean "operable") rather than from what our CSS happens to be called — that
   * is the whole point, and it is why role and tabindex lead the list. */
  const NATIVE = 'a[href], button, input, select, textarea, summary, [contenteditable="true"]'
  const FOCUSABLE = '[tabindex]:not([tabindex="-1"])'
  const ROLES = [
    'button', 'link', 'checkbox', 'radio', 'switch', 'slider', 'spinbutton',
    'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option',
    'treeitem', 'combobox', 'searchbox', 'textbox', 'separator',
  ].map((r) => `[role="${r}"]`).join(', ')

  const candidates = [...root.querySelectorAll(`${NATIVE}, ${FOCUSABLE}, ${ROLES}`)]

  /* The activation target is not always the element itself. A checkbox inside a
   * <label> — or one a <label for> points at — is clicked by hitting the label,
   * and measuring the 16px box reports a failure no user experiences. */
  const targetBoxOf = (e) => {
    if (e.tagName !== 'INPUT' && e.tagName !== 'SELECT') return e.getBoundingClientRect()
    const label = e.closest('label') || (e.id && root.querySelector(`label[for="${CSS.escape(e.id)}"]`))
    if (!label) return e.getBoundingClientRect()
    // Union: the input and its label are one target even when they are siblings.
    const a = e.getBoundingClientRect(), b = label.getBoundingClientRect()
    return {
      x: Math.min(a.left, b.left), y: Math.min(a.top, b.top),
      width: Math.max(a.right, b.right) - Math.min(a.left, b.left),
      height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top),
    }
  }

  /* WCAG 2.5.8/2.5.5 carry their own exceptions, and honouring them is not
   * softening the gate — leaving them out swaps one dishonest number for
   * another, and a scan that cries about every inline link gets ignored, which
   * is how a real 6px carousel dot survives.
   *
   * INLINE — "the target is in a sentence, or its size is otherwise constrained
   * by the line-height of non-target text". A link inside running prose cannot
   * be 44px tall without wrecking the paragraph, and the SC says so.
   *
   * NOT A POINTER TARGET — an element that is focusable only because it carries
   * tabindex="0", with no interactive role and no pointer cursor, is a keyboard
   * waypoint (a scrollable region, a focusable group). Target size is about
   * where a finger lands; these accept no pointer action at all. */
  const wcagExceptionFor = (e) => {
    const cs = getComputedStyle(e)

    if (/^inline/.test(cs.display) && e.tagName === 'A') {
      const p = e.parentElement
      const ownText = p ? p.textContent.replace(e.textContent || '', '').trim() : ''
      if (ownText.length > 0) return 'inline (WCAG 2.5.8 exception: in a sentence)'
    }

    const role = e.getAttribute('role')
    const OPERABLE = /^(button|link|checkbox|radio|switch|slider|spinbutton|tab|menuitem|menuitemcheckbox|menuitemradio|option|treeitem|combobox|searchbox|textbox|separator)$/
    const nativelyOperable = e.matches('a[href], button, input, select, textarea, summary, [contenteditable="true"]')
    if (!nativelyOperable && !(role && OPERABLE.test(role)) && cs.cursor !== 'pointer') {
      return 'not a pointer target (focusable waypoint, accepts no pointer action)'
    }
    return null
  }

  const seen = new Set()
  const measured = []
  const skipped = []

  for (const e of candidates) {
    if (e.offsetParent === null && getComputedStyle(e).position !== 'fixed') continue

    const hit = exclude.find(([sel]) => { try { return e.matches(sel) || !!e.closest(sel) } catch { return false } })
    if (hit) { skipped.push({ sel: hit[0], why: hit[1] }) ; continue }

    const wcag = wcagExceptionFor(e)
    if (wcag) { skipped.push({ sel: wcag, why: wcag }) ; continue }

    /* Two controls can share one box — an <input> and the <label> around it are
     * one target, not two, and counting both inflates the denominator with a
     * duplicate that always passes. Key on the box. */
    const r = targetBoxOf(e)
    const key = `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)},${Math.round(r.height)}`
    if (seen.has(key)) continue
    seen.add(key)

    /* Name it well or the output cannot drive any work. Grouping on the first
     * class alone put every unclassed control in one bucket called "input" —
     * text fields, checkboxes and colour swatches together — and then printed
     * the smallest of them, which described none of them. */
    const cls = String(e.className || '').trim().split(/\s+/)[0]
    const name = cls || (e.tagName.toLowerCase() + (e.getAttribute('type') ? `[type=${e.getAttribute('type')}]` : ''))
    measured.push({ name, w: r.width, h: r.height, role: e.getAttribute('role') || null })
  }

  // BOTH axes. A target is an area; half a check is a pass line that feels
  // verified and is not — measuring height alone once reported "0 under 44"
  // over a 30px-wide date field.
  const under = measured.filter((t) => t.h < floor - 0.5 || t.w < floor - 0.5)

  const groups = {}
  for (const t of under) {
    const k = `${t.name}${t.role ? ` [role=${t.role}]` : ''}`
    const g = (groups[k] ??= { n: 0, minW: Infinity, minH: Infinity, maxW: 0, maxH: 0 })
    g.n++
    g.minW = Math.min(g.minW, t.w); g.minH = Math.min(g.minH, t.h)
    g.maxW = Math.max(g.maxW, t.w); g.maxH = Math.max(g.maxH, t.h)
  }
  for (const g of Object.values(groups)) {
    const r = (w, h) => `${Math.round(w)}x${Math.round(h)}`
    // A range, not a single figure: one number for a group that spans 16x16 to
    // 310x17 describes none of its members.
    g.size = r(g.minW, g.minH) === r(g.maxW, g.maxH) ? r(g.minW, g.minH) : `${r(g.minW, g.minH)}…${r(g.maxW, g.maxH)}`
  }

  const skipCounts = {}
  for (const s of skipped) skipCounts[s.sel] = (skipCounts[s.sel] ?? 0) + 1

  return { total: measured.length, under: under.length, groups, skipped: skipCounts }
}

/**
 * Things that are genuinely not targets, each with the reason it is not one.
 *
 * Read this list as the honest part of the claim. Anything here is content the
 * measurement deliberately does not cover, and if one of these reasons stops
 * being true the entry has to go, not the finding.
 */
export const NOT_A_TARGET = [
  ['.calendar-year__month', 'A twelve-month overview shrinks its cells to fit a year on one screen. It is a navigation aid, not the picking surface — the month grid is, and that one is measured.'],
  ['.btn--xs, .btn--sm, .btn--icon', 'Explicit size opt-outs. WCAG 2.5.8 lets an undersized target pass on SPACING instead, which is the contract these variants ship under — see audit:hit-target for the spacing side.'],
  ['[aria-hidden="true"]', 'Hidden from the accessibility tree, so not a target for anybody it would be measured on behalf of.'],
  ['[disabled], [aria-disabled="true"]', 'WCAG 2.5.8 exempts disabled controls by name.'],
]
