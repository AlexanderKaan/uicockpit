/*
 * Layer A rules — the half that runs IN THE PAGE.
 *
 * Injected with addScriptTag, so it is a plain script assigning one global. It
 * is deliberately not a module and deliberately not passed through evaluate():
 * a rule set that has to be serialised into a single function argument is a rule
 * set that stops being editable at about rule four.
 *
 * WHAT BELONGS HERE, and what does not. axe-core already implements most of
 * WCAG's automatable checks, and implements them better than we would — its
 * target-size rule computes the 2.5.8 spacing allowance, which we got wrong by
 * hand and published. So the harness DELEGATES to axe for everything axe covers,
 * and this file holds only what axe does not:
 *
 *   · geometry that is a design property rather than a violation (sizes, slots)
 *   · robustness under a changed CONDITION, which axe has no notion of — it
 *     judges one render and cannot know the box was fine one breakpoint ago
 *   · anything measured against OUR floors rather than the law's
 *
 * Every rule returns findings shaped the same way, and every finding carries the
 * component it belongs to, because a review reports per component and every gate
 * we have ever written reported per script.
 */
;(function () {
  /** The recipe/card a node belongs to. The wall is tagged; fall back to a class. */
  function componentOf(el) {
    const card = el.closest('[data-recipe], [data-card]')
    if (card) return card.getAttribute('data-recipe') || card.getAttribute('data-card')
    const cls = String(el.className || '').trim().split(/\s+/)[0]
    return cls ? cls.split('__')[0].split('--')[0] : el.tagName.toLowerCase()
  }

  function label(el) {
    const cls = String(el.className || '').trim().split(/\s+/)[0]
    return (cls || el.tagName.toLowerCase()).slice(0, 44)
  }

  /* Kit, or the gallery's own wrapper? A review that cannot tell them apart
   * reports the demo's disclosure widget as a defect in the design system. The
   * class set is handed in from the kit model — the same single parser the
   * static gates read, so the two halves of the checker finally agree on what
   * "a kit class" is. Chrome findings are kept and marked, never dropped: a demo
   * that breaks under a condition is worth knowing, it is just not a component
   * defect, and silently discarding it is how a scan starts lying. */
  function inKit(el) {
    const set = window.__uicKitClasses
    if (!set) return true
    /* ⚠️ The first version walked UP the tree and returned true if any ancestor
     * carried a kit class. Everything in the gallery sits inside .card, which is
     * a kit class, so it reported 0 chrome findings — over a list that visibly
     * contained the demo's own disclosure widget. An impossible number, which is
     * the tell that the meter is broken rather than the subject.
     * The element's OWN classes decide; an unclassed node inherits from the
     * nearest classed ancestor, because a bare <li> belongs to whatever wraps it. */
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const classes = String(e.className || '').trim().split(/\s+/).filter(Boolean)
      if (classes.length === 0) continue // unclassed: ask the parent
      for (let i = 0; i < classes.length; i++) if (set.has(classes[i])) return true
      return false // it has classes, none of them ours: chrome
    }
    return false
  }

  /**
   * Is this region operated by a control somewhere else on the page?
   *
   * The combobox contract: focus stays in the input, arrow keys move a visual
   * pointer through the options, and the wiring is aria-controls plus
   * aria-activedescendant. The region genuinely is reachable, just not by
   * tabbing to it — which is the one thing a DOM scan naturally checks.
   */
  function controlledElsewhere(el) {
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      if (!e.id) continue
      const controller = document.querySelector(`[aria-controls="${CSS.escape(e.id)}"]`)
      if (controller && (controller.hasAttribute('aria-activedescendant') || controller.getAttribute('role') === 'combobox')) return true
    }
    return false
  }

  /** Visually-hidden is a MECHANISM, detected by shape — never by class name. */
  function isVisuallyHidden(el) {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const clipped = cs.clipPath !== 'none' || (cs.clip && cs.clip !== 'auto')
    return (r.width <= 1.5 || r.height <= 1.5) && (clipped || cs.position === 'absolute')
  }

  const rules = {
    /* ── E · robustness under a changed environment ─────────────────────── */

    'E-clipped-text': {
      dimension: 'E',
      title: 'text clipped by its own box',
      wcag: '1.4.4 · 1.4.12',
      /* Reported as a DELTA against the baseline variation, never absolute: a
       * box that clipped before the condition was applied is a decorative
       * overflow or a hidden-text mechanism, not something the condition broke.
       * Two findings were withdrawn by exactly this control. */
      delta: true,
      run: function (root) {
        var out = []
        var els = root.querySelectorAll('*')
        for (var i = 0; i < els.length; i++) {
          var e = els[i]
          var cs = getComputedStyle(e)
          if (!e.textContent || !e.textContent.trim()) continue
          if (!/hidden|clip/.test(cs.overflowY)) continue
          if (isVisuallyHidden(e)) continue
          if (e.scrollHeight <= e.clientHeight + 2) continue
          out.push({ component: componentOf(e), kit: inKit(e), el: label(e), detail: e.scrollHeight - e.clientHeight + 'px of text hidden' })
        }
        return out
      },
    },

    'E-overflows-its-box': {
      dimension: 'E',
      title: 'wider than the box it was given',
      wcag: '1.4.10',
      delta: true,
      run: function (root) {
        var out = []
        function boxOf(e) {
          for (var p = e.parentElement; p && p !== root; p = p.parentElement) {
            if (/\bcard\b/.test(String(p.className))) return p.getBoundingClientRect()
          }
          return root.getBoundingClientRect()
        }
        function excluded(e) {
          for (var p = e; p && p !== root; p = p.parentElement) {
            var pos = getComputedStyle(p).position
            if (pos === 'absolute' || pos === 'fixed') return true
            if (/\bcarousel\b/.test(String(p.className))) return true
          }
          return false
        }
        function reachableByScroll(e) {
          for (var p = e.parentElement; p && p !== root.parentElement; p = p.parentElement) {
            var cs = getComputedStyle(p)
            if (/auto|scroll/.test(cs.overflowX) && p.scrollWidth > p.clientWidth + 1) return true
          }
          return false
        }
        var els = root.querySelectorAll('*')
        for (var i = 0; i < els.length; i++) {
          var e = els[i]
          var over = e.getBoundingClientRect().right - boxOf(e).right
          if (over <= 2 || excluded(e) || reachableByScroll(e)) continue
          out.push({ component: componentOf(e), kit: inKit(e), el: label(e), detail: Math.round(over) + 'px outside its card' })
        }
        return out
      },
    },

    'E-scroll-region-unreachable': {
      dimension: 'E',
      title: 'scrolls, but a keyboard cannot reach it',
      wcag: '2.1.1 (Level A)',
      /* axe has this rule, but axe only sees the render in front of it. Kept
       * here as well because it is CONDITION-dependent: a box scrolls only at
       * the widths where its content overflows, and that is the whole reason
       * one violation of it survived four years of scans pinned at 1440px. */
      run: function (root) {
        var out = []
        var els = root.querySelectorAll('*')
        for (var i = 0; i < els.length; i++) {
          var e = els[i]
          var cs = getComputedStyle(e)
          var scrolls = (/auto|scroll/.test(cs.overflowX) && e.scrollWidth > e.clientWidth + 1) ||
                        (/auto|scroll/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 1)
          if (!scrolls) continue
          var FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
          if (e.matches(FOCUSABLE) || e.querySelector(FOCUSABLE)) continue
          /* CONTROLLED FROM ELSEWHERE is reachable, and axe cannot see it.
           * A combobox listbox is the standard case: DOM focus stays in the
           * input on purpose, arrow keys move a visual pointer, and the
           * relationship lives in aria-controls + aria-activedescendant. Our
           * own APG entry for the command palette specifies exactly that, so
           * flagging it would be the checker contradicting the contract it
           * publishes. Verified before excluding: the palette really does wire
           * role="combobox", aria-controls and aria-activedescendant. */
          if (controlledElsewhere(e)) continue
          out.push({ component: componentOf(e), kit: inKit(e), el: label(e), detail: 'no tabindex and nothing focusable inside' })
        }
        return out
      },
    },

    /* ── F · coherence — the only dimension with no external yardstick ─────
     *
     * A, B, C and E all measure against something somebody else defends: WCAG,
     * APG, axe. Nothing in any law says the buttons in a row must be the same
     * height, so F needs a different kind of rule — and the trick that makes it
     * work is that you do not have to know what a value SHOULD be. You only have
     * to notice that things which are peers disagree, and that a distance came
     * from somewhere other than the scale.
     *
     * The scale already exists. So F is a check, not a design decision, and what
     * it produces is a short worklist rather than a rewrite. */

    'F-peers-disagree': {
      dimension: 'F',
      title: 'same kind, same row, different size',
      wcag: '—',
      /* NOT ALL SIBLINGS ARE PEERS, and the first version forgot it: an icon
       * beside a paragraph beside a button is a composition, not a row of
       * equals, and requiring them to match called three legitimate banners
       * broken. Peer-hood is same KIND — .btn and .btn--primary are one kind —
       * which is also what makes the rule answer the real question: six buttons
       * split into two clusters are still six buttons, and they must agree. */
      run: function (root) {
        const out = []
        const kindOf = (e) => {
          const c = String(e.className || '').trim().split(/\s+/)[0]
          return c ? c.split('--')[0] : e.tagName.toLowerCase()
        }
        for (const el of root.querySelectorAll('*')) {
          const cs = getComputedStyle(el)
          if (!/flex|grid/.test(cs.display)) continue
          const kids = [...el.children].filter((k) => k.getBoundingClientRect().width > 0 && k.getBoundingClientRect().height > 0)
          if (kids.length < 2) continue
          if (new Set(kids.map((k) => Math.round(k.getBoundingClientRect().top))).size !== 1) continue
          const byKind = {}
          for (const k of kids) (byKind[kindOf(k)] ??= []).push(k)
          for (const [kind, group] of Object.entries(byKind)) {
            if (group.length < 2) continue
            const hs = [...new Set(group.map((g) => Math.round(g.getBoundingClientRect().height)))]
            const cy = [...new Set(group.map((g) => Math.round(g.getBoundingClientRect().top + g.getBoundingClientRect().height / 2)))]
            if (hs.length === 1 && cy.length === 1) continue
            out.push({ component: componentOf(group[0]), kit: inKit(group[0]), el: kind,
              detail: group.length + ' side by side, heights ' + hs.join('/') + (cy.length > 1 ? ', not on one centre line' : '') })
          }
        }
        return out
      },
    },

    'F-off-scale-gap': {
      dimension: 'F',
      title: 'a distance that did not come from the scale',
      wcag: '—',
      /* Three things are NOT off-scale spacing and the rule has to know all of
       * them, or its output is noise nobody reads:
       *   · a HAIRLINE (<=1px) — the seam where joined buttons share a border;
       *   · a DISTRIBUTION — space-between/around/evenly leaves whatever is
       *     left over, so 121px is not a spacing decision, it is arithmetic;
       *   · sub-pixel drift from a tokenised gap, hence the 1px tolerance. */
      run: function (root) {
        const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
        const cs0 = getComputedStyle(root)
        const scale = [0]
        const NAMES = ['--k-s-1', '--k-s-2', '--k-s-4', '--k-s-6', '--k-s-8', '--k-s-10', '--k-s-12',
          '--k-s-16', '--k-s-20', '--k-s-24', '--k-s-32', '--k-s-40', '--k-s-48', '--k-s-56', '--k-s-64',
          '--k-space', '--k-gap', '--k-pad', '--k-stack-gap', '--k-row-gap', '--k-card-pad']
        for (const n of NAMES) {
          const raw = cs0.getPropertyValue(n).trim()
          const v = parseFloat(raw)
          if (!isNaN(v)) scale.push(Math.round(/rem/.test(raw) ? v * rootPx : v))
        }
        // ⚠️ rem. Reading these with a bare parseFloat gave 0.25 for --k-s-4 and
        // called the entire kit off-scale — an impossible answer that changed the
        // whole conclusion until it was converted.
        const onScale = (px) => scale.some((s) => Math.abs(s - px) <= 1)
        /* Anything bigger than the LARGEST step was not taken from the scale —
         * it is left-over room. A menu item puts its shortcut on the right with
         * margin-left:auto and a toolbar pushes a group to the far end; the
         * computed style reports those as plain pixels, so the auto cannot be
         * seen, but the size gives it away. 136px and 142px are not spacing
         * decisions, they are whatever was left. */
        const biggest = Math.max.apply(null, scale)

        const out = []
        for (const el of root.querySelectorAll('*')) {
          const cs = getComputedStyle(el)
          if (!/flex|grid/.test(cs.display)) continue
          if (/space-between|space-around|space-evenly/.test(cs.justifyContent)) continue
          const kids = [...el.children].filter((k) => k.getBoundingClientRect().width > 0 && k.getBoundingClientRect().height > 0)
          if (kids.length < 2) continue
          /* HORIZONTAL ONLY, and that limit is the finding rather than a
           * shortcut. A vertical distance between stacked children COMPOSES —
           * the container's gap, plus each child's margins, plus the leading —
           * so 26px is very often 16 + 10, both of them on the scale, and
           * flagging it produced 439 findings that were mostly arithmetic.
           * Almost any number is a sum of scale steps, so per-instance
           * verification of a composed distance cannot be made honest.
           * The vertical axis is reported as a VOCABULARY instead (how many
           * distinct rhythms the kit uses), which is a coherence metric and not
           * a defect list. Sideways, distances do not compose, and the rule
           * holds. */
          const oneLine = new Set(kids.map((k) => Math.round(k.getBoundingClientRect().top))).size === 1
          if (!oneLine) continue
          const seen = new Set()
          for (let i = 1; i < kids.length; i++) {
            const a = kids[i - 1].getBoundingClientRect()
            const b = kids[i].getBoundingClientRect()
            const d = Math.round(b.left - a.right)
            if (d <= 1 || d > biggest) continue     // hairline seam, or left-over room
            if (onScale(d)) continue
            if (seen.has(d)) continue
            seen.add(d)
            out.push({ component: componentOf(el), kit: inKit(el), el: label(el),
              detail: d + 'px between its children — not on the scale' })
          }
        }
        return out
      },
    },

    /* ── C · perception, where it is OUR floor rather than the law's ──────── */

    'C-target-under-floor': {
      dimension: 'C',
      title: 'pointer target below the size floor',
      wcag: '2.5.8 / 2.5.5 — SIZE ONLY',
      /* ⚠️ A SIZE, NOT A VERDICT. WCAG permits an undersized target with enough
       * clear space around it; axe computes that and owns the verdict. This
       * number tells a review how much of a component sits under the floor,
       * which axe cannot report per component — that is the only reason it is
       * here, and its wording must never say "fails". */
      run: function (root, ctx) {
        var floor = (ctx && ctx.floor) || 24
        var out = []
        var NATIVE = 'a[href], button, input, select, textarea, summary, [contenteditable="true"]'
        var els = root.querySelectorAll(NATIVE + ', [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="slider"], [role="tab"], [role="menuitem"], [role="option"]')
        var seen = {}
        for (var i = 0; i < els.length; i++) {
          var e = els[i]
          if (e.offsetParent === null && getComputedStyle(e).position !== 'fixed') continue
          if (e.matches('[disabled], [aria-disabled="true"], .btn--xs, .btn--sm, .btn--icon')) continue
          var lab = e.closest('label')
          var box = (lab && (e.tagName === 'INPUT' || e.tagName === 'SELECT')) ? lab : e
          var r = box.getBoundingClientRect()
          var key = Math.round(r.x) + ',' + Math.round(r.y) + ',' + Math.round(r.width) + ',' + Math.round(r.height)
          if (seen[key]) continue
          seen[key] = 1
          if (r.width >= floor - 0.5 && r.height >= floor - 0.5) continue
          out.push({ component: componentOf(e), kit: inKit(e), el: label(e), detail: Math.round(r.width) + 'x' + Math.round(r.height) + ' (floor ' + floor + ')' })
        }
        return out
      },
    },
  }

  /* ── DRIVE · the substrate the other rules cannot reach ─────────────────
   *
   * Everything above judges a render. Keyboard behaviour only exists while the
   * component is being OPERATED, so it needs the page driven from Node — and
   * one walk answers four questions at once, which is why it is worth the cost:
   *
   *   B1 reachable      · every interactive element receives focus at some point
   *   B2 no trap        · the walk always progresses and eventually leaves
   *   B4 focus visible  · every stop shows an indicator
   *   B5 not obscured   · the focused element is actually on top at its centre
   *
   * Elements are tagged before the walk so a stop can be matched back to a
   * specific control; a selector built after the fact drifts the moment the DOM
   * re-renders, which it does at every stop.
   */
  const INTERACTIVE = 'a[href], button, input, select, textarea, summary, [contenteditable="true"], ' +
    '[tabindex]:not([tabindex="-1"]), [role="button"], [role="link"], [role="checkbox"], [role="radio"], ' +
    '[role="switch"], [role="slider"], [role="spinbutton"], [role="tab"], [role="menuitem"], [role="option"], [role="separator"]'

  window.__uicMarkInteractive = function (rootSel) {
    const root = document.querySelector(rootSel)
    if (!root) return { total: 0 }
    let n = 0
    const els = root.querySelectorAll(INTERACTIVE)
    for (const e of els) {
      if (e.offsetParent === null && getComputedStyle(e).position !== 'fixed') continue
      if (e.matches('[disabled], [aria-disabled="true"], [aria-hidden="true"]')) continue
      /* The platform has its own ways of putting things out of tab order, and
       * they are all CORRECT: a closed <details>, a dialog that is not open, a
       * popover that is not showing, [hidden], [inert]. Marking those and then
       * reporting them as unreachable would be the checker complaining that
       * hidden things are hidden. */
      if (e.closest('details:not([open]) > *:not(summary), dialog:not([open]), [popover]:not(:popover-open), [hidden], [inert]')) continue
      /* tabindex="-1" is ROVING TABINDEX, and it is the pattern working. A
       * toolbar is one tab stop: one control is tabbable and the rest are
       * reached with arrow keys. Our "Last sync" toolbar has exactly that —
       * Status tabbable, Top/Bottom/Left/Right at -1 — and reporting those four
       * as Level A failures would have had us "fix" a correct toolbar into five
       * separate tab stops, which is what APG's toolbar pattern exists to
       * prevent. The bare `button` in the selector above matched them; this
       * puts them back. */
      if (e.getAttribute('tabindex') === '-1') continue
      const det = e.closest('details')
      if (det && !det.open && !e.closest('summary')) continue
      e.setAttribute('data-uic-id', String(n++))
    }
    return { total: n }
  }

  /** Read everything worth knowing about wherever focus currently sits. */
  window.__uicFocusState = function (rootSel) {
    const root = document.querySelector(rootSel)
    const el = document.activeElement
    if (!el || el === document.body) return { outside: true }
    if (!root || !root.contains(el)) return { outside: true }

    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()

    /* An indicator is an outline, a ring drawn with box-shadow, or a border the
     * focus state changed. Checking only outline-width would call our own kit
     * broken, since the ring is a box-shadow. */
    const hasRing = (parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none') ||
      (cs.boxShadow && cs.boxShadow !== 'none')

    /* Obscured: something else is painted over the point a person would click.
     * Sample the centre, and the corners too, because a sticky header usually
     * covers an edge rather than the middle. */
    let obscuredAt = null
    if (r.width > 0 && r.height > 0) {
      /* ENTIRELY hidden, which is what the SC actually says: 2.4.11 Focus Not
       * Obscured (Minimum) asks that the focused component is "not entirely
       * hidden due to author-created content". Reporting a partially covered
       * element flagged .sheet-frame__backdrop — a full-area click-to-close
       * target whose centre is covered by the sheet BY DESIGN, while its whole
       * border, and therefore its focus ring, is plainly visible. Sample the
       * centre and the corners; only a point that is covered EVERYWHERE counts. */
      const pts = [
        [r.left + r.width / 2, r.top + r.height / 2],
        [r.left + 3, r.top + 3], [r.right - 3, r.top + 3],
        [r.left + 3, r.bottom - 3], [r.right - 3, r.bottom - 3],
      ]
      let covered = 0
      let sampled = 0
      let coveredBy = null
      for (const [x, y] of pts) {
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue
        sampled++
        const top = document.elementFromPoint(x, y)
        if (top && top !== el && !el.contains(top) && !top.contains(el)) {
          covered++
          coveredBy = String(top.className || top.tagName).slice(0, 30)
        }
      }
      if (sampled > 0 && covered === sampled) obscuredAt = coveredBy
    }

    return {
      outside: false,
      id: el.getAttribute('data-uic-id'),
      el: label(el),
      component: componentOf(el),
      kit: inKit(el),
      hasRing,
      obscuredAt,
      x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
    }
  }

  window.__uicUnfocused = function (rootSel) {
    const root = document.querySelector(rootSel)
    const out = []
    /* COMPOSITE WIDGETS ARE ONE TAB STOP, and that is the pattern working, not a
     * defect. A radio group, a tablist, a listbox and a menu each take a single
     * stop and move internally with arrow keys — so every unchecked radio and
     * every unselected tab is *correctly* unreachable by Tab. The first version
     * of this rule did not know that and reported them as Level A failures,
     * which would have had us "fix" a group into the keyboard trap of eleven
     * separate tab stops that APG exists to prevent. */
    const COMPOSITE = '[role="radiogroup"], [role="tablist"], [role="listbox"], [role="menu"], [role="menubar"], [role="tree"], [role="grid"], fieldset'
    for (const e of root.querySelectorAll('[data-uic-id]')) {
      if (e.hasAttribute('data-uic-seen')) continue
      const group = e.closest(COMPOSITE)
      const radioLike = e.matches('input[type="radio"]') || /^(radio|tab|option|menuitem|menuitemradio|menuitemcheckbox|treeitem)$/.test(e.getAttribute('role') || '')
      if (group && radioLike) continue
      if (radioLike && !group) {
        /* An unchecked radio is never in the tab order — that is the platform
         * working. But radios with no fieldset or radiogroup around them are a
         * REAL defect wearing that pattern's clothes: nothing names the question
         * the options answer, so a screen reader announces three choices and no
         * question. Reported as what it is, not as "unreachable", which would
         * have been an accurate observation of the wrong thing. */
        out.push({ component: componentOf(e), kit: inKit(e), el: label(e),
          detail: 'radio with no <fieldset> or role="radiogroup" around it — the options have no question' })
        continue
      }
      out.push({ component: componentOf(e), kit: inKit(e), el: label(e),
        detail: 'never received focus while tabbing' + (group ? ' (inside a composite widget, but not one of its item roles)' : '') })
    }
    return out
  }

  /**
   * The CONTROL for the focus-indicator check, and it needs one.
   *
   * Reading the focused element's own outline and box-shadow called half our
   * form controls unringed — because the kit draws the ring on the WRAPPER with
   * :focus-within (.in, .taginput), so the inner input genuinely has none of its
   * own while a ring is plainly visible on screen. Measuring the wrong element.
   *
   * So: focus it, record the element and its ancestors, blur, record again, and
   * compare. Anything that changes is an indicator, wherever it is drawn and
   * however it is drawn — no assumption about outline versus shadow versus
   * border, which is what makes it work on somebody else's component too.
   */
  window.__uicProbeIndicator = function (id) {
    const el = document.querySelector('[data-uic-id="' + id + '"]')
    if (!el) return { missing: true }
    /* Up AND down. The ring is not always on the focused element: our own
     * .in draws it on the wrapper (:focus-within, an ancestor) and .slider
     * draws it on the knob (:focus, a descendant). Looking only upward called
     * the slider unringed, which is the third time this one rule has been wrong
     * about which element to measure. */
    const chain = []
    for (let e = el, n = 0; e && n < 4; e = e.parentElement, n++) chain.push(e)
    for (const d of el.querySelectorAll('*')) { if (chain.length > 12) break; chain.push(d) }
    const snap = () => chain.map((e) => {
      const cs = getComputedStyle(e)
      return cs.outline + '|' + cs.boxShadow + '|' + cs.borderColor + '|' + cs.backgroundColor
    })
    el.focus()
    const focused = snap()
    el.blur()
    const blurred = snap()
    el.focus()
    for (let i = 0; i < focused.length; i++) if (focused[i] !== blurred[i]) return { hasIndicator: true, at: i }
    return { hasIndicator: false }
  }

  window.__uicRules = rules
  window.__uicRun = function (rootSel, ctx) {
    var root = document.querySelector(rootSel)
    if (!root) return { error: 'no ' + rootSel }
    var res = {}
    for (var id in rules) {
      try { res[id] = rules[id].run(root, ctx || {}) } catch (err) { res[id] = [{ component: '?', el: 'RULE ERROR', detail: String(err).slice(0, 120) }] }
    }
    return res
  }
  window.__uicMeta = function () {
    var m = {}
    for (var id in rules) m[id] = { dimension: rules[id].dimension, title: rules[id].title, wcag: rules[id].wcag, delta: !!rules[id].delta }
    return m
  }
})()
