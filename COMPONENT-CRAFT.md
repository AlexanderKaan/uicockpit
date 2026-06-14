# COMPONENT-CRAFT.md — the per-component meetlat

> The benchmark for grading any component A/B/C. Sibling to `BEAUTY-SPEC.md`
> (which is the *foundation* meetlat); this one drops a level to **component
> craft** — the "million small things" that separate A+ from B.
>
> **Method (same as the B★ teardown, one altitude down):** tear down the
> best-in-class for a component → distil its craft *laws* and *threshold values*
> → write a spec card → grade the live render against the card. The exemplar is
> the *source* of the rule; the rule is what you grade against.

---

## Part I — the universal craft rubric (the laws)

Every spec card draws from these. Grade each component on the ones that apply.
"Auto" = a mechanical probe can measure it (catch it in the build gate / live DOM);
the rest need a visual critic.

| # | Law | One-line test | Auto |
|---|-----|---------------|------|
| 1 | **Spacing on the grid** | every gap/pad is a `--k-s-*` token, not a magic number | ✅ |
| 2 | **Proximity = meaning** | related items tight; a *group* of furniture sits a group-gap (≥`--k-s-12`) off the content | ◑ |
| 3 | **Height harmony** | all controls in one horizontal group share one computed height | ✅ |
| 4 | **Alignment** | edges/baselines/optical centres line up; no 1px drift | ◑ |
| 5 | **One focal point** | exactly one element wins (size/weight/colour); not a flat wall | ◑ |
| 6 | **State completeness** | hover · focus-visible · active · disabled · loading · empty · error all designed | ✅ |
| 7 | **Optical balance** | padding *looks* even; icons optically centred; not just mathematically equal | ✕ |
| 8 | **Motion & feedback** | entrance / press / transition present and restrained | ◑ |
| 9 | **Content truth** | real data, no lorem; survives long text, zero, overflow | ◑ |

**Grade bands.** A = clears the gold-standard on every applicable law. B = correct
but loses on 1–2 craft laws (the usual: proximity, height harmony, focal point).
C = reads as "components arranged," multiple laws failing.

---

## Part II — how to grade + sweep

**Two tracks.**
1. **Mechanical probes** (laws 1,3,6 + parts of 4,8) — measure in the live DOM /
   assert in the recipe source; wire into the build gate so regressions can't
   return. *The filter-bar bug below would have been a one-line probe failure.*
2. **Visual-critic panel** (laws 2,5,7,9) — one agent per component vs its spec
   card + a preview screenshot → grade + concrete micro-fixes.

**Sweep strategy — root-cause first, NOT component-by-component.** Most of the
"million small things" trace to a *handful* of systemic laws. Cluster findings,
fix at the **recipe/token** level (one edit lifts N components), then re-grade.
Per-component polish is the last mile, not the first.

---

## Part III — spec cards (worked examples)

The two below were the pilot (the user's own two examples). Each card =
`gold-standard · the laws as they apply · measurable acceptance · the fix`.

### Card — Chart (`.chart` / ChartFrame)
- **Gold-standard:** Tremor · Linear analytics · Stripe dashboards.
- **Applicable laws:** 2 (proximity), 1 (grid), 5 (focal series), 9 (real data).
- **Acceptance:**
  - **[L2] legend clears the plot+axis** — gap(x-labels → legend) ≥ `--k-s-12`. *Not* overlapping.
  - axis labels sit `--k-s-4` under the plot (they belong to it); the legend sits a *group-gap* below them.
- **Was (measured):** legend top was **−7px** above the x-labels — it *overlapped* the axis labels ("no padding").
- **Root cause:** `.chart__xlabels` lived inside the fixed-height `.chart__canvas`; the SVG sized the box, so the labels overflowed it and the legend (placed after the box) collided with them.
- **Fix (`ChartFrame.tsx`):** lift the x-labels OUT of the canvas to a flow sibling in the `.chart` column → they extend the column instead of overflowing. Legend separation now an intentional group-gap. **Now: +12px, clean.**
- **Residual (B→A):** chart "furniture" — inline legend value/delta callout, range toggle (6M/1Y). *Recurs on every data chart → a shared sub-component.*

### Card — Toolbar / Filter bar (`.toolbar` / `.filterbar`)
- **Gold-standard:** Linear filter bar · Attio view bar.
- **Applicable laws:** 3 (height harmony), 2 (grouping), 1 (grid).
- **Acceptance:**
  - **[L3] one height** — every control child of `.toolbar`/`.toolbar__group` shares one computed height (`--tb-h`). 0 distinct heights beyond 1.
  - **[L2] two gap levels** — members of a `.toolbar__group` sit `--k-gap` apart; unrelated groups sit `--k-space` apart.
- **Was (measured):** five controls, **four** heights — searchinput 36 · select 36 · segctrl **26** · slider-group **17** · btn **32**. The row couldn't read as one group.
- **Root cause:** the height-invariant only covered `.btn/.in/.select/.select-trigger`. `.segctrl` and the slider wrapper were never bound; `btn--sm` and the select's own min-height escaped it.
- **Fix:** added `.searchinput` + `.segctrl` to the `.toolbar` invariant; gave `.filterbar__group` `min-height: var(--tb-h)` so the thin slider centres on the row; aligned the bar to the controls' natural height (dropped a stray `--sm`). **Now: all 5 = 36px, uniform.**
- **Sub-law surfaced:** *in a toolbar, the bar dictates height — children's size-modifiers yield.* (Worth a probe: every control class must be in the invariant selector.)

---

## Part IV — the recurring root-cause: preview-chrome out-specifies the kit

Twice now (`.t-display` defeated by `.cockpit-preview h1`; `.select` height by
`.cockpit-preview select.select`) a **preview-only chrome rule** out-specified a
kit recipe — so the EXPORT was correct but the LOUPE (what we grade from) showed
the flaw. **When grading from the preview, suspect `.cockpit-preview …` overrides
first.** A worthwhile audit: flag any `.cockpit-preview` selector that sets a
property the kit recipe also sets on the same element.

---

## Worklist (the laws to codify next, highest-leverage)

1. `audit:craft` — encode **L3** as a source check: every class in the control
   family must appear in the `.toolbar` height-invariant selector. (Would have
   caught the filter bar.)
2. **L2 chart-furniture** sub-component (legend callout + range toggle).
3. Roll the **two tracks** across the gallery family-by-family (forms → overlays →
   data → nav → marketing), fixing root-cause laws at the recipe level.
4. Preview-chrome-vs-kit specificity audit (Part IV).
