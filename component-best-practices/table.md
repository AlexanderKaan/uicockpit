# Table — best-practice library + compliance scan

> Component: `.tbl` atom · recipe `cockpit/src/kit/recipes/index.ts:1322–1447` · scanned 2026-06-30

Scope note: this is the **`.tbl` atom** — the restrained, shadcn-style per-row-border
table. The bordered-frame **`.datatable` BLOCK** (toolbar · selection bar · scroll well ·
sticky thead · pagination · empty/loading/error slot) is a sibling component and owns the
states the atom legitimately delegates. Where a rule is the block's job, the scan says so
rather than failing the atom for it — but it still records the rule, because "the atom has
no answer when used bare" is itself a finding.

Grounding: Linear / Stripe / Notion / Airtable tables, shadcn/ui table + data-table,
Apple HIG, Material data tables, Carbon, Adobe Spectrum, plus the kit's own already-proven
`TABLE-LIST-STICKY-PATTERNS.md`. Severities align to the 10 craft laws in `COMPONENT-CRAFT.md`.

---

## A. Best-practice library (supply)

### Alignment & numerics
1. **Text left, numbers right.** [LOAD-BEARING] — left-to-right reading scans text fastest; right-alignment lets the eye compare magnitudes straight down the column. `.tbl th, .tbl td { text-align: left }` baseline + `.tbl th.num, .tbl td.num { text-align: right }`.
2. **Tabular figures on every numeric column.** [LOAD-BEARING] — proportional digits jitter column edges; tabular figures lock each digit to one width so money/% line up like a spreadsheet. `.tbl td.num { font-variant-numeric: tabular-nums }`.
3. **The `.num` class goes on BOTH the `th` and every `td`** so header label and values share the same edge. [LOAD-BEARING] — a right-aligned column under a left-aligned header reads broken. Selector lists both: `.tbl th.num, .tbl td.num`.
4. **Totals/summary figures stay tabular + right-aligned too.** [LOAD-BEARING] — a totals row that drops tabular-nums no longer lines its sum under the column it sums. Requires `.num` on the `tfoot` cells (composition rule, not a separate token).
5. **Status/icon/action columns get their own alignment (centre for a lone control, left for a status chip).** [polish] — a checkbox or sole icon optically centres; a status pill reads as text, stays left. No dedicated utility today.

### Density
6. **Density is a token, not a magic number — cell padding is a fraction of `--k-space`.** [LOAD-BEARING] — one density dial (Compact/Default/Comfortable) must move the whole table coherently (craft L1). `padding: calc(var(--k-space,10px)*0.55) calc(var(--k-space,10px)*0.65)`.
7. **At least two density tiers (default + condensed) for data-dense grids.** [LOAD-BEARING] — admin/financial tables need a tighter rhythm without losing the density dial. `.tbl--condensed` drops type to small tier and padding to `*0.32/*0.5`.
8. **A horizontal-group height invariant is irrelevant to rows but the row's min-height must clear the WCAG-2.2 24px hit floor when the row carries a control.** [LOAD-BEARING] — a compact row with a checkbox/menu still needs a 24px target (craft L4 / `--k-hit-min`). No row min-height guard today; relies on padding math.

### Affordance & state
9. **Hover background on every row, even non-interactive ones.** [LOAD-BEARING] — hover is a free scan-aid: it confirms which row the cursor (and any action) is on. `.tbl tbody tr:hover { background: var(--k-state-hover) }`.
10. **Press/active wash on clickable rows.** [polish] — a tactile confirm on `:active`, harmless on static tables (fires only while held). `.tbl tbody tr:active { background: var(--k-state-press) }`.
11. **Selected-row state that follows the Selection-accent toggle.** [LOAD-BEARING] — bulk-select must read unambiguously; selected ≠ hover (craft L6 state-completeness). `.tbl tbody tr.is-selected, tr[aria-selected="true"] { background: var(--k-state-selected-bg, var(--k-primary-soft)) }` + a hover-on-selected darken via `filter: brightness(.98)`.
12. **Sortable header is a real affordance: cursor, no text-select, hover darken, focus-visible ring, active-state chevron tint.** [LOAD-BEARING] — "an arrow with no state" is the #1 sort bug; the active column must announce direction and be keyboard-reachable. `.tbl th.is-sortable { cursor:pointer; user-select:none }` + `:focus-visible` ring + `.is-active .tbl__sort-chevron { color: var(--k-primary) }`.
13. **Selected-edge / state-edge consistency with the kit invariant (I2).** [polish] — a selected row should carry the kit's `--k-selected-edge` inset so selection reads the same across table/list/menu. Not applied on `.tbl` rows today (fill only).

### Structure & dividers
14. **Divider-only by default (per-row border-top), no zebra.** [LOAD-BEARING] — the restrained shadcn/Linear signature; zebra adds noise at this density. `.tbl tbody tr { border-top: var(--k-divider) }`, zebra modifier deliberately dropped.
15. **Header is quiet: muted colour, eyebrow type, uppercase, tracked, semibold.** [LOAD-BEARING] — the header must recede so data wins the focal point (craft L5). `.tbl thead { color: var(--k-fg-muted); font-size: var(--k-type-eyebrow); text-transform: uppercase; letter-spacing: var(--k-track-eyebrow) }`.
16. **The "meta pair" cell: primary name (`--k-fg`, medium) + secondary sub (the FAINT tier).** [LOAD-BEARING] — the canonical name+detail stack; the sub must recede a full step below muted or it competes with the name. `.tbl__name { font-weight: var(--k-weight-medium) }` + `.tbl__sub { font-size: var(--k-type-small); color: var(--k-fg-faint) }`.
17. **Grouped/subheader rows read as a quiet sunken band, no hover lift.** [polish] — segmenting by team/date/status without competing with data. `.tbl tr.tbl__group > * { background: var(--k-surface-sunken); ... }` + hover override back to sunken.
18. **Summary/total row set off by a heavier top rule + semibold figures.** [LOAD-BEARING] — the totals line must read as a closure, not another body row (craft L10). `.tbl tfoot td { border-top: 2px solid var(--k-border); font-weight: var(--k-weight-semibold) }`.
19. **Column min-width + single-line truncation with ellipsis (tooltip on hover/focus reveals full).** [LOAD-BEARING] — multi-line cells destroy vertical rhythm; the safe default is one line + ellipsis, wrapping reserved for one "description" column. No `text-overflow: ellipsis` / `max-width` / `white-space:nowrap` utility on `.tbl` today.

### Sticky & rounded (from the proven brief — treat as already-known)
20. **`border-collapse: separate; border-spacing: 0` anywhere sticky or rounded.** [LOAD-BEARING] — collapsed borders belong to the grid, not the cell box, so they vanish under sticky cells on scroll (confirmed FF/WebKit). `.tbl` uses `border-collapse: collapse` (see scan).
21. **Sticky cells use INSET box-shadow dividers + an opaque background.** [LOAD-BEARING] — box-shadow travels with the sticky cell and clips to a radius; a border doesn't, and a transparent sticky header shows scrolled content through it. The `.datatable` block draws its thead divider this way; `.tbl` itself still uses `border`.
22. **Scope `overflow` to a wrapper with `overscroll-behavior: contain`; last row in a rounded container drops its divider.** [LOAD-BEARING] — keeps sticky glued through iOS momentum and stops the grid colliding with the curve / double-border. `.tbl-responsive { overflow-x:auto }` exists but lacks `overscroll-behavior` and there's no `.table-card` rounded primitive.

### Responsive
23. **Container-query responsiveness (adapt to the table's own width, not the viewport).** [LOAD-BEARING] — a table in a narrow panel should degrade even on a wide screen. `.tbl-responsive { container-type: inline-size }` + `@container` rules.
24. **Optional-column drop under a narrow host.** [LOAD-BEARING] — shed non-essential columns before resorting to scroll/stack. `.tbl__col--optional { display:none }` at `@container (max-width:34rem)`.
25. **Stack-to-card fallback with `data-label` row labels at the narrowest tier.** [LOAD-BEARING] — record data reads better as label/value cards than a hairline-thin scroll; header is visually hidden, each cell shows its column name. `.tbl--stack` + `td::before { content: attr(data-label) }` at `@container (max-width:26rem)`.
26. **Horizontal-scroll + frozen first column as the default wide-table degradation.** [polish] — Airtable/Sheets default; preferable to a stack for spreadsheet-shaped data. `.tbl-responsive` scrolls but has NO frozen-first-column primitive.

### Empty / loading / error
27. **Designed empty state (icon + line + optional CTA), not a blank grid.** [LOAD-BEARING] — craft L6 demands the zero-data path be designed. Delegated to `.datatable__state`; the bare `.tbl` atom has none.
28. **Loading = skeleton rows / dim, preserving column structure.** [LOAD-BEARING] — a spinner loses the layout; skeleton cells keep the grid stable. Delegated to `.datatable--loading`; the bare `.tbl` atom has none.
29. **Error state distinct from empty (retry affordance).** [polish] — "failed" must not look like "nothing here." Delegated to `.datatable__state`.
30. **Content truth: survives long text, zero values, overflow (craft L9).** [LOAD-BEARING] — partly an authoring rule, but the atom must not break on a 0 (tabular-nums handles) or a long unbreakable string (needs the truncation utility from #19).

---

## B. Compliance scan (check)

| # | Rule | Status | Evidence (our recipe line/snippet OR "absent") | Severity |
|---|------|--------|-------------------------------------------------|----------|
| 1 | Text left / numbers right | ✅ PASS | base `text-align:left` (1329) + `.tbl th.num,.tbl td.num{text-align:right}` (1385) | — |
| 2 | tabular-nums on numeric cols | ✅ PASS | `.tbl ... .num { ... font-variant-numeric: tabular-nums }` (1385) | — |
| 3 | `.num` on both th + td | ✅ PASS | selector lists `.tbl th.num, .tbl td.num` (1385); comment 1384 spells out "apply to BOTH" | — |
| 4 | Totals stay tabular + right | ⚠️ PARTIAL | tfoot styled bold (1412–1415) but tabular/right relies on AUTHOR adding `.num` to tfoot cells; no guarantee | LOW |
| 5 | Status/icon/action column alignment | ❌ GAP | absent — only `.num` (right) exists; no centre/control-column utility | LOW |
| 6 | Density via `--k-space` fraction | ✅ PASS | `padding: calc(var(--k-space,10px)*0.55) calc(...*0.65)` (1328) | — |
| 7 | Condensed density tier | ✅ PASS | `.tbl--condensed` smaller type + `*0.32/*0.5` padding (1421–1422) | — |
| 8 | Row hit-target floor (24px) when row has a control | ❌ GAP | absent — no `min-height`/`--k-hit-min` guard; at Compact `--k-space` the row can fall below 24px around a bare checkbox | MED |
| 9 | Hover on every row | ✅ PASS | `.tbl tbody tr:hover { background: var(--k-state-hover) }` (1333) | — |
| 10 | Press/active wash | ✅ PASS | `.tbl tbody tr:active { background: var(--k-state-press) }` (1337) | — |
| 11 | Selected-row state (accent-aware) | ✅ PASS | `.is-selected, [aria-selected]` → `--k-state-selected-bg` + hover darken `filter:brightness(.98)` (1340–1348) | — |
| 12 | Sortable header affordance (cursor/no-select/hover/focus/active-chevron) | ✅ PASS | 1351–1370: `cursor:pointer; user-select:none`, `:hover`, `:focus-visible` ring, `.is-active .tbl__sort-chevron{color:var(--k-primary)}` | — |
| 13 | Selected-EDGE (I2 `--k-selected-edge`) on rows | ❌ GAP | absent — selected rows use fill only; the kit's `--k-selected-edge` inset invariant is not carried onto `.tbl` rows | LOW |
| 14 | Divider-only, no zebra | ✅ PASS | `.tbl tbody tr { border-top: var(--k-divider) }` (1332); zebra deliberately dropped (comment 1386–1388) | — |
| 15 | Quiet header (muted/eyebrow/caps/tracked) | ✅ PASS | `.tbl thead { color:var(--k-fg-muted); font-size:var(--k-type-eyebrow); text-transform:uppercase; letter-spacing:var(--k-track-eyebrow) }` (1331) | — |
| 16 | Meta-pair cell (name + faint sub) | ✅ PASS | `.tbl__name { weight-medium; --k-fg }` + `.tbl__sub { type-small; --k-fg-faint }` (1377–1378) | — |
| 17 | Grouped subheader band, no hover lift | ✅ PASS | `.tbl tr.tbl__group > *` sunken + hover override (1399–1406) | — |
| 18 | Summary row heavier rule + semibold | ✅ PASS | `.tbl tfoot td { border-top:2px solid var(--k-border); font-weight:semibold }` (1412–1415) | — |
| 19 | Min-width + truncate/ellipsis (one line + tooltip) | ❌ GAP | absent — no `max-width`/`white-space:nowrap`/`text-overflow:ellipsis` utility; a long unbreakable cell wraps or blows the column | MED |
| 20 | `border-collapse: separate` for sticky/rounded | ⚠️ PARTIAL | `.tbl { border-collapse: collapse }` (1325). Works only because `.datatable` block draws thead divider via inset-shadow + row borders live in scrolling tbody; bare `.tbl` made sticky/rounded WILL drop borders | MED |
| 21 | Inset-shadow dividers + opaque bg on sticky cells | ⚠️ PARTIAL | `.tbl` uses `border` dividers; inset-shadow sticky treatment lives in `.datatable`, not the atom (brief §82 "kit gap noted") | MED |
| 22 | Wrapper overflow + overscroll-contain + last-row-no-divider | ⚠️ PARTIAL | `.tbl-responsive { overflow-x:auto }` (1432) but NO `overscroll-behavior:contain`; no rounded `.table-card`/last-row-drop primitive | LOW |
| 23 | Container-query responsiveness | ✅ PASS | `.tbl-responsive { container-type: inline-size }` + `@container` (1432–1444) | — |
| 24 | Optional-column drop | ✅ PASS | `.tbl__col--optional { display:none }` @container 34rem (1433–1435) | — |
| 25 | Stack-to-card with data-label | ✅ PASS | `.tbl--stack` thead hidden + `td::before{content:attr(data-label)}` @container 26rem (1436–1444) | — |
| 26 | Frozen first column (horizontal scroll) | ❌ GAP | absent — `.tbl-responsive` scrolls but no `position:sticky;left:0` frozen-col primitive (brief §36–41 has the recipe; not in `.tbl`) | LOW |
| 27 | Empty state | ⚠️ PARTIAL | bare `.tbl` has none; delegated to `.datatable__state` (block). Atom used alone shows a blank grid | MED |
| 28 | Loading / skeleton | ⚠️ PARTIAL | bare `.tbl` has none; delegated to `.datatable--loading` (block) | LOW |
| 29 | Error state | ⚠️ PARTIAL | none on atom; delegated to `.datatable__state` | LOW |
| 30 | Content-truth (0, long text, overflow) | ⚠️ PARTIAL | tabular-nums handles 0/alignment; long-text overflow NOT handled (same root as #19) | MED |

**Tally: 18 PASS · 8 PARTIAL · 4 GAP** (30 rules).

---

## C. Gap worklist (ranked)

Ranked by severity, then by how cheaply one edit closes it.

**MED**
1. **#19 / #30 — no truncation utility (the biggest real gap).** A long unbreakable cell value wraps and wrecks the vertical rhythm. Add a one-line opt-in:
   `.tbl td.truncate { max-width: var(--k-col-max, 16rem); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }` (pair with a `title`/tooltip in authoring guidance). Closes both #19 and the overflow half of #30.
2. **#8 — row hit-target floor.** A Compact row around a bare checkbox can fall under WCAG-2.2's 24px. Add a guard that doesn't fight density:
   `.tbl tbody tr { } .tbl td { min-height: 0 }` → better, floor the interactive case: `.tbl tbody tr:has(input,button,a,[role="button"]) td { min-block-size: var(--k-hit-min, 24px) }` (or document that control rows must not use `--condensed` at Compact).
3. **#20 / #21 — `border-collapse: collapse` on the atom.** Per the brief's own "kit gap noted" (§82), a future `.table-card` primitive should ship `border-collapse: separate; border-spacing: 0` + inset-shadow dividers + last-row-drops-its-line, so a *bare* `.tbl` can be made sticky/rounded without losing borders. Smallest first step: a `.tbl--card` modifier flipping to `separate` + box-shadow dividers.
4. **#27 — empty state on the bare atom.** Either document that `.tbl` must be wrapped in `.datatable` for the state slot, OR add a lightweight `.tbl__empty` full-span row treatment so the atom is honest used alone.

**LOW**
5. **#4 — totals tabular guarantee.** Cheapest: in the tfoot rule, also set `font-variant-numeric: tabular-nums` so totals align even if the author forgets `.num`: append to `.tbl tfoot td, .tbl tfoot th`.
6. **#13 — selected-edge invariant on rows.** Carry the kit I2 token: add `box-shadow: var(--k-selected-edge)` (inset) to `.is-selected`/`[aria-selected]` so table selection matches list/menu.
7. **#26 — frozen-first-column primitive.** Lift the brief's §36–41 recipe into `.tbl__col--frozen` (`position:sticky; left:0; background:var(--k-surface); z-index:1`) for spreadsheet-shaped wide tables.
8. **#5 — control/centre column utility.** Add `.tbl th.ctl, .tbl td.ctl { text-align:center }` (or width-clamped) for checkbox/sole-icon columns.
9. **#22 — `overscroll-behavior: contain` on `.tbl-responsive`** (one declaration) to stop scroll-chaining/pull-to-refresh on touch.

---

## D. Loop notes (meta)

- **Research half: EASY for tables.** Tables are the single most-written-about component in design-systems literature; the canonical rules (numbers-right + tabular-nums, divider-vs-zebra, density tiers, sortable affordance, stack-on-mobile, empty/loading/error) converge hard across Carbon/Spectrum/shadcn/HIG. Almost no contested calls — the only real "opinion" is borderless-vs-zebra, and the kit's restrained divider-only choice is defensible and well-aligned with Linear/Stripe.
- **Scan found REAL gaps, but the recipe is already strong.** 18/30 PASS is a genuinely mature atom — alignment, density, hover/press/selected, sortable, meta-pair, grouped/total rows, and container-query responsiveness are all properly tokenized. The honest gaps cluster in TWO root causes, not thirty: (a) **no truncation/overflow utility** (hits #19 + #30) and (b) **`border-collapse: collapse`** on the atom blocking clean sticky/rounded (#20/#21, already self-flagged in the brief). Everything else is either delegated-to-the-block (empty/loading/error — arguably correct) or genuine LOW polish.
- **Delegation is the scan's subtlety.** Five PARTIALs (#20–#21, #27–#29) are "the BLOCK handles it." Whether that's a PASS or a GAP depends on a policy call: *can `.tbl` be used bare?* If yes, the atom owes at least a minimal answer; if the contract is "always wrap in `.datatable`," they're PASS-by-design. The instrument should force that policy choice explicitly rather than guess — a good signal that the template needs a "delegated?" column or a per-component contract line.
- **FORMAT verdict: SKILL doc, not `get_design_context`.** Section A (the rule library with the *why*) is durable teaching content an agent should read once and internalize — perfect for a skill. Sections B/C are a point-in-time scan that goes stale the moment the recipe changes, so they should be REGENERATED on demand (a `check`-style pass), not frozen into the context the MCP serves on every call. Recommendation: bake **A** into the skill / `get_design_context` per-component card; make **B/C** the output of a runnable per-component conformance scan (the "scan our own library" half of the strategic idea). The two halves want different homes.
