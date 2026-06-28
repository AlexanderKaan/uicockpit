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
| 10 | **Closure / footer unity** | a card's footer *closes the box* the same way kit-wide — full-bleed divider/fill to the edges, never an inset hairline floating mid-card | ✅ |

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

### Card — Footer / closure (`.card__foot`)
- **Gold-standard:** shadcn CardFooter · Vercel/Linear settings-card footer well.
- **Applicable laws:** 10 (closure), 1 (grid), 5 (one primary).
- **Acceptance:**
  - **[L10] full-bleed** — the footer's top border (and any fill) reaches the card's edges; the box reads *closed*, not an inset hairline mid-card.
  - ONE footer family kit-wide: plain `.card__foot` (full-bleed divider) for simple action cards · `.card__foot--bar` (grey-sunken well) for commit/form footers. Same frame, recognizable fill.
- **Was:** two unrelated footers — `.card__foot` had an **inset** divider (it lived inside the card's padding) → loose, unfinished; only `.formpanel__foot` closed the box (full-bleed grey bar). No unity.
- **Root cause:** `.card` puts padding on the *card*, so a `.card__foot` child's border-top is inset by that padding. `.formpanel` puts padding on its *sections* (container has none) → its foot is full-bleed.
- **Fix:** `.card__foot` now cancels the card padding (negative margins) so it's full-bleed + carries the card's bottom radius; added `.card__foot--bar` (grey well = the formpanel quality). Every card footer now closes the box; commit footers wear the well.

## Part IV — the recurring root-cause: preview-chrome out-specifies the kit

Twice now (`.t-display` defeated by `.cockpit-preview h1`; `.select` height by
`.cockpit-preview select.select`) a **preview-only chrome rule** out-specified a
kit recipe — so the EXPORT was correct but the LOUPE (what we grade from) showed
the flaw. **When grading from the preview, suspect `.cockpit-preview …` overrides
first.** A worthwhile audit: flag any `.cockpit-preview` selector that sets a
property the kit recipe also sets on the same element.

---

## Part V — the Invariant Engine (graded law → enforced guarantee)

> The deeper move behind the worklist (the user's two examples — button-height
> drift, illegible selected-state — surfaced it). Our guarantees split in two:
> **structural** (tokens · BEM · provenance · layout) are uniform *and* enforced
> (build gate + `uicockpit check`); **perceptual / state** (height harmony ·
> selected-edge · focus · hit-target) are ad-hoc per recipe, **15–70 % applied,
> and enforced nowhere**. The perceptual class *is* the "you never pixel-fuck"
> promise — and it leaks both in our own chrome (`.fmseg`, `.topbar__btn`) and in
> any component an agent hand-rolls. The fix is not N component patches; it's a
> repeatable lifecycle that turns each mechanizable craft law into a guarantee
> that **cannot silently regress** — at our build *and* in a consumer's codebase.

**The lifecycle — every mechanizable law rides these 5 rails:**

1. **NAME** — a one-line machine test (from the Part-I rubric).
2. **PRIMITIVE** — encode the hard-won fix as ONE token / utility / container-rule.
   Adoption becomes "compose X", never "remember to do X". (e.g. a
   `--k-selected-edge` inset-ring token; control height enforced by the *container*,
   not re-stated per control; a single focus primitive.)
3. **UNIFORM** — retrofit *every* recipe to the primitive; close the 15–70 % → 100 %.
4. **ENFORCE** — two gates. (a) A build-gate **ratchet audit** — the proven
   `audit:craft` magic-px pattern (count pinned to a baseline, can only go down;
   explicit allowlist for deliberate exceptions) so the kit can't regress. (b) A
   consumer **`check` rule** + promote the matching contract *info*-rule to
   `check`-backed, so a hand-roll is caught (the moat moves from "no hardcoded hex"
   to "selected stays legible / controls align"). Heuristic where exact is
   impossible: a rule that gives `[aria-selected]` / `--on` only a *background*
   (no border / inset / outline) → warn — it collapses on a flat palette.
5. **DOGFOOD** — the chrome adopts the same primitive; our own UI becomes the
   living proof + the forcing function (break an invariant → our UI shows it).

**Status — the perceptual invariants (the first wave).** Coverage + gaps are from
the 2026-06-29 invariant study; "enforced" tracks rail 4.

| Inv | Law | Primitive (rail 2) | Coverage | Gap families | Enforced |
|-----|-----|--------------------|----------|--------------|----------|
| **I1 Height harmony** | L3 | per-control `min-height: var(--k-control-h-*)` + the `.toolbar` container force | ~70 % | `.segctrl` · `.check` · `.radio` · `.toggle` · `.slider` (unbound standalone) | ❌ info-only (`control-height-invariant`) |
| **I2 Selected-edge** | L5 / L6 | `--k-selected-edge` = `inset 0 0 0 var(--k-bw) var(--k-border)` | **~15 %** | only `.segctrl` honors it; `.tbl` · `.tree` · `.navsub` · `.calendar` · `.cmdp` (+ chrome `.fmseg`) | ❌ not even named |
| **I3 Focus-visible** | L6 | one focus primitive (stop relying on the *fragile global* only) | ~60 % | `.segctrl` · `.toggle` · `.tab` · `.combobox` · `.badge` · `.avatar` | ❌ |
| **I4 Hit-target** | L4 | min interactive-size token + documented dense exceptions | ~50 % | `.navsub` · `.tree` · `.combobox` (28px) · `.calendar` · `.check` / `.radio` / `.toggle` | ❌ |

**Phased plan:**

- **Phase 0** — this section: the engine + the status tracker. *(done)*
- **Phase 1** — **I2 selected-edge** (highest leverage: 15 % coverage, one cheap
  token) → **I1 height harmony**. *These are the user's two examples, shipped as
  enforced invariants, not patches.*
- **Phase 2** — **I3 focus-visible** · **I4 hit-target**.
- **Phase 3** — **chrome dogfood**: `.fmseg` → the selected-edge token,
  `.topbar__btn` → the control-height token. Kills our two bugs + proves the engine.

Each phase ships: primitive → uniform retrofit → a ratchet audit → a `check` rule
where statically detectable.

---

## Worklist — residual / parallel (not on the Invariant-Engine track)

1. **L2 chart-furniture** sub-component (legend callout + range toggle).
2. Roll the **two tracks** (Part II) across the gallery family-by-family for the
   *visual-critic* laws (2, 5, 7, 9) that the engine can't mechanize.
3. Preview-chrome-vs-kit specificity audit (Part IV).
