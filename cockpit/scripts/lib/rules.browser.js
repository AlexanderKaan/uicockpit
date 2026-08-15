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
