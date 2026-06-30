# Data table — best-practice library + compliance scan

> Component: `.datatable` block · recipe `cockpit/src/kit/recipes/index.ts:1448–1538` · scanned 2026-06-30

Sources behind the supply half: shadcn/ui DataTable (TanStack) · Linear · Stripe Dashboard ·
Airtable · Notion DB · Carbon · Material · Adobe Spectrum · plus the kit-proven prior brief
`TABLE-LIST-STICKY-PATTERNS.md` (treated as already-known) and the craft rubric
`COMPONENT-CRAFT.md` (laws L1–L10).

## A. Best-practice library (supply)

Numbered rules. Each: **Rule** — *why* — `CSS/token`.

### Toolbar & filters
1. **Single header band that holds a row of controls** (search · filters · column-visibility · primary action). — *One predictable strip is where users look for every "do something to the whole table" affordance; scattering them costs scanning.* — `.datatable__bar` wrapping a `.toolbar`. [LOAD-BEARING]
2. **Search is the leftmost, widest control; primary action sits far-right.** — *Reading order = scope-then-act; the F-pattern puts the filter where the eye lands first.* — `.toolbar__spacer`/`margin-left:auto` push trailing actions right. [LOAD-BEARING]
3. **Faceted / column-level filters as multi-select chips, not free-text only.** — *Categorical columns (status, owner, type) are filtered by picking values; faceted counts let users see "12 Paid" before clicking (shadcn/Linear).* — composed `.select`/menu + `.badge` count. [polish]
4. **Column-visibility ("Columns" / "View") control.** — *Wide tables overflow; letting users hide columns is the cheapest density fix and the shadcn/Notion baseline.* — a `.select-trigger`/menu in the bar. [polish]
5. **Active-filter state is visible and clearable.** — *A filter you can't see you applied is a bug-report generator; show applied filters as removable chips + a "Clear".* — `.badge` row under/in the bar. [polish]
6. **All bar controls share one height (height-harmony, L3).** — *Mixed control heights make the toolbar read as "arranged," not designed.* — `.toolbar` forces `--tb-h` on every direct `.btn/.in/.select` child. [LOAD-BEARING]

### Selection & bulk actions
7. **Header checkbox with a true indeterminate state** (some-but-not-all selected). — *The select-all glyph must distinguish all / some / none; the dash is the universal "partial" signal.* — `.check input:indeterminate::after` dash (`index.ts:1036–1040`). [LOAD-BEARING]
8. **On selection the toolbar SWAPS to a contextual bulk-action bar** (count + bulk actions), not a second stacked bar. — *The swap keeps one band, signals "you're now in selection mode," and surfaces only the actions that apply to many rows (Linear/Stripe/Airtable).* — `.datatable__bar--active` recolors the same band; `.datatable__count`. [LOAD-BEARING]
9. **Selected rows get a distinct, legible fill** (not just the checkbox). — *The row is the selection; the fill must survive hover and stay readable (the kit's selected-edge invariant I2).* — `.tbl tr.is-selected` / `[aria-selected]` → `--k-state-selected-bg` (`index.ts:1340–1348`). [LOAD-BEARING]
10. **Destructive bulk actions are guarded / de-emphasised** (not the same weight as benign ones). — *One mis-click deletes N rows; danger styling + confirm is the floor.* — `.btn--danger`/ghost in the active bar. [polish]
11. **Selection persists across pages / explicit select-all scope** ("Select all 248" vs "all on this page"). — *Bulk-editing a paginated set silently dropping off-page rows is a data-integrity trap.* — app-state concern; bar should expose the "select all N" affordance. [polish]

### Sorting & pagination
12. **Sort affordance lives on the column header; quiet until hover, then shows direction.** — *Headers should not shout chevrons at rest; reveal on hover, lock the active direction (Linear/shadcn).* — `.tbl th.is-sortable` + `.tbl__sort-chevron`, active → `--k-primary` (`index.ts:1351–1370`). [LOAD-BEARING]
13. **Multi-sort affordance** (shift-click / numbered priority badges). — *Power data tables sort by 2+ keys; show the order so it's not a hidden mode.* — small index badge next to the chevron. [polish]
14. **A total count is always present** — "1–25 of 248", never "page 3 of ?". — *Users need to know the set size to trust pagination and plan bulk ops.* — `.datatable__foot-info` row range. [LOAD-BEARING]
15. **Rows-per-page control with sane defaults (10/25/50/100, default 25–50).** — *Lets users trade density for paging; 25 is the researched sweet spot.* — `.datatable__perpage .select` (`index.ts:1535`). [polish]
16. **Pagination controls disable at the ends + mark the current page.** — *Prev on page 1 must be inert; current page must be unambiguous.* — `.pagination button:disabled` + `[aria-current='true']` (`index.ts:2781–2784`). [LOAD-BEARING]
17. **Feed-like data may use "load more" / infinite scroll instead of pages.** — *Logs/messages read as a stream; pagination fights that. Offer the alternative.* — a `.btn` "Load more" in the foot. [polish]

### Sticky & frozen
18. **Sticky thead pinned while rows scroll.** — *Wide/long tables lose their headers on scroll; pinning is the single highest-return fix.* — `.datatable .tbl thead th { position:sticky; top:0; z-index:1 }` (`index.ts:1502–1506`). [LOAD-BEARING]
19. **Every sticky cell carries an opaque background.** — *Else scrolled rows bleed through — the #1 sticky bug (prior brief §3).* — `background: var(--k-surface)` on the sticky th (`index.ts:1504`). [LOAD-BEARING]
20. **Sticky dividers use inset box-shadow, never border.** — *A border on a sticky/collapsed cell vanishes on scroll (FF/WebKit); box-shadow paints on the cell box and travels (prior brief §1–§2).* — `box-shadow: inset 0 -1px 0 0 var(--k-border)` (`index.ts:1505`). [LOAD-BEARING]
21. **Frozen first column on horizontal scroll** (the row's identity stays put). — *Wide tables scrolled sideways lose the row label; freeze col 1 with a one-sided scroll-reveal shadow (prior brief frozen-col CSS).* — `position:sticky; left:0` + `::after` shadow. [polish]
22. **Defined z-index stack** (body 0 · frozen col 1 · header 2 · corner 3). — *Without it the corner cell or header flickers under the frozen column.* — prior brief §5. [polish]

### Frame & dividers
23. **Single bordered, radius-clipped frame on the WRAPPER** (not double-bordered on table too). — *The block must read as one closed surface; border on both wrapper and table = a visible double line.* — `.datatable { border; border-radius; overflow:hidden }` (`index.ts:1472`). [LOAD-BEARING]
24. **Last row drops its divider so the grid meets the curve clean.** — *A trailing hairline under the last row collides with the rounded corner (prior brief §6).* — `.tbl tbody tr:last-child` should drop `border`/use radius clip. [LOAD-BEARING]
25. **Row hover wash + active press, restrained (no zebra).** — *Hover orients the eye to the row; zebra adds noise to dense data (shadcn/Linear restraint).* — `.tbl tbody tr:hover { --k-state-hover }` / `:active` (`index.ts:1333–1337`). [LOAD-BEARING]
26. **Footer closes the box the same way kit-wide (L10 closure).** — *Every committing panel (table, form) must share ONE footer treatment: top divider + sunken fill, full-bleed to the edges.* — shared `.datatable__foot, .formpanel__foot` (`index.ts:604–608`). [LOAD-BEARING]
27. **Numeric columns right-align with tabular figures.** — *Money/counts must line up so magnitudes scan down the column.* — `.tbl th.num/td.num` (`index.ts:1385`). [polish]

### States: empty / loading / error
28. **Empty state replaces the rows with a centered, deliberate slot** (icon + title + message + optional action). — *A row-less table must read as a state, not a broken layout; offer the next action ("Add the first row").* — `.datatable__state` (`index.ts:1521`). [LOAD-BEARING]
29. **Loading = skeleton rows that mirror the table shape, not a spinner; first 3–5 rows only.** — *Skeletons cut perceived wait ~67% and keep layout stable; skeleton the visible rows, not all 100 (Carbon).* — `.datatable--loading` dims body + `.sk` bars per cell (`index.ts:1527–1529`). [LOAD-BEARING]
30. **Error state is distinct from empty and offers retry.** — *"Failed to load — Retry" must not look like "no data"; tint the icon danger + give the action.* — `.datatable__state--error` tints icon `--k-danger`; needs a Retry `.btn` (`index.ts:1525`). [LOAD-BEARING]
31. **State slot keeps the toolbar; empty hides the column headers.** — *Toolbar (filters) stays so users can clear a filter that caused the empty; but headers over no rows read as broken (Carbon).* — header `<thead>` suppressed in the empty case. [polish]

### Density
32. **Row-density control (compact / default / comfortable).** — *Power users want more rows per screen; the same data surface should re-rhythm without a rebuild (Carbon's 5 row sizes).* — `.tbl--condensed` exists (`index.ts:1421–1422`); density also rides `--k-space`. [polish]

### Responsive
33. **Block adapts to its OWN width, not the viewport** (container query). — *Dropped in a narrow sidebar vs full-bleed it must reflow identically.* — `container: datatable / inline-size` + `@container` (`index.ts:1472–1481`). [LOAD-BEARING]
34. **Narrow: toolbar stacks; body keeps horizontal scroll with a sane min-width.** — *Crushing columns clips the last one; horizontal scroll is the universal mobile-table affordance.* — `@container ... { .toolbar{flex-direction:column} }` + `.datatable--page .tbl{min-width:34rem}` (`index.ts:1478–1501`). [LOAD-BEARING]
35. **Optional: table→stacked cards on very narrow** (each cell labelled from `data-label`). — *Record-style data (Stripe Dashboard) reads better stacked than scrolled.* — `.tbl--stack` on the atom (`index.ts:1437–1444`). [polish]

## B. Compliance scan (check)

| # | Rule | Status | Evidence (our recipe line/snippet OR "absent") | Severity |
|---|------|--------|------------------------------------------------|----------|
| 1 | Header band holds a toolbar row | ✅ PASS | `.datatable__bar` holds a `.toolbar` (`1485`); anatomy doc `1458–1460` | — |
| 2 | Search left / actions far-right | ✅ PASS | `.datatable__spacer { margin-left:auto }` (`1488`); toolbar spacer | — |
| 3 | Faceted / column-level filters | ⚠️ PARTIAL | bar composes `.toolbar` (can host filters) but no faceted-count chip pattern shown | MED |
| 4 | Column-visibility control | ❌ GAP | absent — no "Columns"/view-options affordance in the recipe or anatomy | MED |
| 5 | Active-filter chips + clear | ❌ GAP | absent — no applied-filter row/chip treatment | LOW |
| 6 | One height across bar controls (L3) | ✅ PASS | `.toolbar` height-invariant forces `--tb-h` on direct controls (`137–149`, `173–182`) | — |
| 7 | Header checkbox indeterminate | ✅ PASS | `.check input:indeterminate::after` dash glyph (`1036–1040`) | — |
| 8 | Toolbar swaps to bulk-action bar | ✅ PASS | `.datatable__bar--active` recolors band + `.datatable__count` (`1486–1487`) | — |
| 9 | Selected-row fill, hover-safe | ✅ PASS | `.tbl tr.is-selected` → `--k-state-selected-bg`, hover keeps fill (`1340–1348`) | — |
| 10 | Destructive bulk actions guarded | ⚠️ PARTIAL | bar can hold `.btn--danger` but recipe doesn't specify/demonstrate the danger treatment in `--active` | LOW |
| 11 | Selection scope across pages | ❌ GAP | absent — no "select all N" affordance; app-state, but the bar gives no slot/hint | LOW |
| 12 | Sort affordance on header, quiet→active | ✅ PASS | `.tbl th.is-sortable` + `.tbl__sort-chevron` active `--k-primary` (`1351–1370`) | — |
| 13 | Multi-sort priority affordance | ❌ GAP | absent — single-sort chevron only, no order badge | LOW |
| 14 | Total count always present | ✅ PASS | `.datatable__foot-info` row-range slot (`1534`) | — |
| 15 | Rows-per-page control | ✅ PASS | `.datatable__perpage .select` (`1535–1536`) | — |
| 16 | Pagination disables ends + marks current | ✅ PASS | `.pagination button:disabled` + `[aria-current='true']` (`2781–2784`) | — |
| 17 | Load-more / infinite alternative | ❌ GAP | absent — only paginated footer modeled; no feed/load-more variant | LOW |
| 18 | Sticky thead | ✅ PASS | `position:sticky; top:0; z-index:1` (`1502–1506`) | — |
| 19 | Opaque sticky background | ✅ PASS | `background: var(--k-surface)` on sticky th (`1504`) | — |
| 20 | Inset-shadow divider on sticky | ✅ PASS | `box-shadow: inset 0 -1px 0 0 var(--k-border)` (`1505`) | — |
| 21 | Frozen first column | ❌ GAP | absent — `.datatable__check{width:36px}` (`1511`) sizes the col but nothing freezes it; prior brief frozen-col CSS not applied to `.datatable` | MED |
| 22 | Defined z-index stack | ⚠️ PARTIAL | only `z-index:1` on thead (`1503`); no frozen-col/corner layering since frozen col is absent | LOW |
| 23 | Single bordered radius-clipped frame | ✅ PASS | `.datatable { border; border-radius; overflow:hidden }` (`1472`); `.tbl` has no own border | — |
| 24 | Last row drops divider into curve | ⚠️ PARTIAL | frame clips via `overflow:hidden`, but `.tbl` uses `border-collapse:collapse` + per-row `border-top` (`1325`,`1332`) with no last-row drop; works only because frame clips — prior brief §6/§82 flags this as the gap | MED |
| 25 | Restrained hover/press, no zebra | ✅ PASS | `.tbl tr:hover`/`:active` washes, zebra explicitly dropped (`1333–1337`,`1386–1388`) | — |
| 26 | Footer closure unity (L10) | ✅ PASS | shared `.datatable__foot, .formpanel__foot` top divider + sunken fill (`604–608`) | — |
| 27 | Numeric columns right-align tabular | ✅ PASS | `.tbl th.num/td.num` tabular-nums (`1385`) | — |
| 28 | Empty state slot | ✅ PASS | `.datatable__state` centered icon/title/msg (`1521–1524`) | — |
| 29 | Skeleton loading rows | ⚠️ PARTIAL | `.datatable--loading` only dims the body `opacity:0.85` (`1529`); no skeleton-row recipe — comment says "pair each cell with a `.sk` bar" but the `.sk` bar primitive + the 3–5-row guidance are not in this block | MED |
| 30 | Error state distinct + retry | ⚠️ PARTIAL | `.datatable__state--error` tints icon danger (`1525`) but no Retry action baked/demonstrated; relies on caller dropping a `.btn` | MED |
| 31 | Empty keeps toolbar, hides headers | ⚠️ PARTIAL | state slot exists; recipe says drop it "in place of `<tbody>` rows" (`1520`) — thead stays visible over the empty slot, against the Carbon guidance | LOW |
| 32 | Density control | ⚠️ PARTIAL | `.tbl--condensed` exists on the atom (`1421`) + `--k-space` rhythm; but the `.datatable` block exposes no density toggle/affordance to switch it | LOW |
| 33 | Container-query self-adaptation | ✅ PASS | `container: datatable / inline-size` + `@container` rules (`1472–1481`) | — |
| 34 | Narrow: toolbar stacks, body scrolls | ✅ PASS | `@container` stacks toolbar (`1478–1481`) + page-table min-width/scroll (`1498–1501`) | — |
| 35 | Table→stacked cards (optional) | ✅ PASS | `.tbl--stack` on the atom (`1437–1444`) | — |

**Counts:** 35 rules · **✅ PASS 19** · **⚠️ PARTIAL 9** · **❌ GAP 7**.

## C. Gap worklist (ranked)

**MED (close these first — they're the block's real holes)**
1. **Skeleton loading rows (#29).** Today loading is only a dim. Add a skeleton-row recipe: a `.datatable--loading tbody .sk` bar primitive (shimmer keyframe in `globalLayer.ts`), and document the 3–5-row cap. → `.sk { background: linear-gradient(...); border-radius: var(--k-radius-sm); height: 1em; }` + drive width per-cell.
2. **Error-state retry (#30).** The danger tint exists but the state has no action. Bake a Retry slot into `.datatable__state--error` so a failed load always offers recovery. → add a `.btn--ghost` "Retry" inside the error `.datatable__state` (demonstrate in gallery).
3. **Frozen first column (#21) + z-stack (#22).** Apply the prior brief's frozen-col CSS to `.datatable` so the row identity survives horizontal scroll. → `.datatable .tbl td:first-child, th:first-child { position:sticky; left:0; background:var(--k-surface); z-index:1 }` + corner `z-index:3` + one-sided `::after` reveal shadow.
4. **Column-visibility control (#4).** Add a "Columns" menu affordance pattern to `.datatable__bar` (composes `.select-trigger` + checkbox menu); wire to `.tbl__col--optional` which already exists. → no new token; a documented bar pattern + gallery demo.
5. **Last-row divider into curve (#24).** Promote the prior brief's `.table-card` direction: drop the last `tbody tr` border so the grid meets the radius cleanly without relying on `overflow:hidden` to mask it. → `.datatable .tbl tbody tr:last-child { box-shadow:none; border-bottom:0 }` (and migrate to `border-collapse:separate` if the divider model is revisited).
6. **Faceted filter chips (#3).** Document a faceted-filter pattern (multi-select + count badge) as the canonical bar filter, not just "a toolbar can hold filters." → compose `.select`/menu + `.badge` count; gallery demo.

**LOW (polish / variant coverage)**
7. **Empty hides thead (#31).** When the state slot shows "no data," suppress `<thead>` per Carbon — keep the toolbar (so a filter can be cleared) but drop the column headers over an empty body.
8. **Density toggle on the block (#32).** Expose a segmented control in the bar that flips `.tbl--condensed`; the atom already supports it.
9. **Destructive bulk action treatment (#10)** — specify/demonstrate `.btn--danger` inside `.datatable__bar--active`.
10. **Multi-sort priority badge (#13)**, **load-more variant (#17)**, **select-all-N scope hint (#11)** — each a small documented affordance; lowest priority.

## D. Loop notes (meta)

- **Research half = easy and fast.** Data tables are one of the most-written-about components; two broad WebSearches + two targeted (states, design-system density) plus the kit's own prior brief (`TABLE-LIST-STICKY-PATTERNS.md`, which is best-in-class and already proven) covered the full surface. The prior brief did most of the sticky/frozen/frame heavy lifting — that pre-existing artifact made this the easiest of the three pilots' research halves.
- **The scan found REAL gaps, concentrated exactly where predicted (the states) — but the recipe is genuinely strong (19/35 clean PASS).** The structural craft (sticky thead, inset-shadow dividers, single-frame clip, height-harmony, footer-closure L10, selected-row, container-query reflow) is fully nailed and matches best practice line-for-line. The honest weak spots are **loading skeleton** (only a dim — biggest real gap), **error retry** (tint without an action), and **frozen first column** (prior-brief CSS proven but never applied to `.datatable`). These map cleanly to craft-law **L6 state-completeness**, which the rubric marks Auto — so #29/#30/#31 are the kind of gap a probe could ratchet.
- **Format verdict: a skill doc beats `get_design_context` for this.** The value is the *paired* supply+scan with WHY and severity — that's a teaching/audit artifact, not the flat token+class dump `get_design_context` serves. The right productization is a per-component skill where section A is reusable knowledge and section B is re-runnable as a scan (ideally the LOAD-BEARING rows become assertions in `audit:craft`).
- **Productize signal:** the B-table format is mechanical to apply and the LOAD-BEARING vs polish split gives a natural severity prior. Recommend BOTH collect-and-scan: collect A as the skill knowledge base, and promote the Auto-measurable LOAD-BEARING rules (sticky bg, inset-shadow divider, frozen-col, skeleton presence, footer-closure) into the craft ratchet so regressions can't slip.
