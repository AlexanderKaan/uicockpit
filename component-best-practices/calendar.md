# Calendar — best-practice library + compliance scan

> Component: `.calendar` / `.calendar-week` / `.calendar-year` / `.calendar-range` · recipe `cockpit/src/kit/recipes/index.ts:2301–2537` · scanned 2026-06-30

Researched against Apple Calendar / Fantastical, Notion Calendar (Cron), Google Calendar, Things 3, Cal.com, react-day-picker (daypicker.dev), shadcn/ui Calendar, FullCalendar (timegrid / nowIndicator / slotEventOverlap), MUI X DateCalendar, and the W3C WAI-ARIA APG Date Picker Dialog pattern. Sticky/scroll rules carried over from `TABLE-LIST-STICKY-PATTERNS.md` (already proven on `.calendar-week`).

## A. Best-practice library (supply)

### Grid & week-start
1. **7-column grid, full weeks always shown** — *the eye scans columns by weekday; a ragged first/last week breaks the column read and the row count.* Leading/trailing days from the adjacent month fill the grid so every row has 7 cells. `grid-template-columns: repeat(7, 1fr)`. [LOAD-BEARING]
2. **Square-ish, tabular cells** — *dates are numbers in a matrix; equal square cells + `tabular-nums` keep the digit columns optically aligned and the today/selected pill centred.* `aspect-ratio:1; font-variant-numeric: tabular-nums`. [LOAD-BEARING]
3. **Week-start is locale-driven, not hardcoded** — *Sun-first (US/JP) vs Mon-first (most of EU/ISO-8601) is a real correctness bug, not a preference; the wrong start shifts every date one column.* The recipe is CSS-only (grid), so the *consumer* owns weekday-header order + cell offset — but the kit must DOCUMENT that the header row and the first cell index move together, and ideally expose it as a documented data attr. [LOAD-BEARING]
4. **Weekday header row, muted + abbreviated** — *column labels orient the scan without competing with the date numbers.* `.calendar__head` faint, caption-size, centered. [polish]

### Day states: today / selected / range / muted
5. **Today = ring or tint, NEVER the same treatment as selected** — *the single worst calendar bug is today and selected looking alike; they must be distinguishable when today IS selected and when it isn't.* Best-in-class: today = subtle ring/outline (Apple, shadcn, react-day-picker `today`), selected = filled accent. When today is also selected, the fill wins and the ring is suppressed (no double-decoration). `box-shadow: inset 0 0 0 1px var(--ring)` for today; `background: var(--k-primary)` for selected; suppress ring on `today.on`. [LOAD-BEARING]
6. **Selected = filled accent with AA-contrast fg** — *the picked day is the loudest thing in the grid; it carries the primary container + its paired foreground so the number stays legible.* `background: var(--k-primary); color: var(--k-primary-fg)`. [LOAD-BEARING]
7. **In-range fill is SECONDARY/soft, endpoints are PRIMARY** — *a range has three roles: start, end (loud), and the days between (quiet container). If in-range were also primary the band would be a wall of accent with no readable endpoints.* `--range` = soft container; `--range-start/-end` = primary. [LOAD-BEARING]
8. **Range reads as ONE continuous band** — *flatten the inner corners so start→middle→end connect with no gaps/notches; only the outer corners of the endpoints stay rounded.* `--range{border-radius:0}`, start drops right-side radius, end drops left-side radius. [LOAD-BEARING]
9. **Hover-preview while picking a range** — *after the start is set, hovering a candidate end must paint the provisional band so the user sees what they'll get before committing.* A `--range-preview` / `--hover-end` modifier mirroring `--range`/`--range-end` at lower emphasis (dashed/lighter), driven by consumer JS on `mouseover`. [LOAD-BEARING]
10. **Out-of-month days muted but still present** — *adjacent-month days give the week its 7 cells; mute them so they recede but (for pickers) keep them selectable.* `--out{opacity:.4; color:var(--k-fg-faint)}`. [polish]
11. **Disabled dates are visually distinct from out-of-month** — *"past / blackout / sold-out" (can't pick) ≠ "belongs to neighbouring month" (can pick). Booking-grade pickers need both, looking different.* `--disabled{cursor:not-allowed; line-through}` separate from `--out`. [LOAD-BEARING]
12. **Hover/active feedback on pickable cells only** — *muted and disabled cells must NOT light up on hover or they read as actionable.* `--out:hover{background:transparent}`, same for disabled. [polish]

### Events & overflow (month cells)
13. **Events render as chips inside the day cell** — *month view shows WHAT'S on a day, not just that something is; a tonal chip with a title (and a time for timed events) is the unit.* A `.calendar__event` chip primitive: soft fill, leading color edge, single-line ellipsis title. [LOAD-BEARING]
14. **All-day vs timed are visually different** — *all-day events are full-width bars; timed events show a leading time and/or a color dot. Conflating them loses the at-a-glance schedule read.* all-day = filled bar spanning the cell width; timed = dot/time + label. [LOAD-BEARING]
15. **Color-code events by calendar/category** — *multi-calendar users rely on color as the primary grouping; provide ≥3 tonal event variants mapped to calendars.* `--event--alt`, `--event--accent` (soft tints), never raw saturated fills. [polish]
16. **"+N more" overflow when events exceed the cell's row budget** — *a month cell can hold ~2–4 chips; beyond that, truncate to a "+N more" affordance that opens a day popover. Without it the cell grows unboundedly and breaks the grid's row rhythm.* A `.calendar__more` link/button row; consumer caps visible chips. [LOAD-BEARING]
17. **Event title truncation, never wrap-to-multi-line in month** — *chips must stay one line so the day's chip count is predictable; ellipsis the title.* `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`. [polish]
18. **A day cell with events is tall + top-aligned (number top-left)** — *month-with-events is NOT the centered-number picker grid; the number sits top-left and chips stack below.* Distinct cell layout from the picker `.calendar__cell` (which centers its number). [LOAD-BEARING]

### Time-grid & current-time (week / day)
19. **One scroll container; head + body share a scrollbar** — *separate scrollers drift out of register (the column dividers misalign on scroll). One container keeps day-header columns locked to body columns.* `overflow-y:auto` on `.calendar-week`. [LOAD-BEARING]
20. **Sticky day-header, divider via inset box-shadow** — *the day labels must stay visible while scrolling hours; a `border-bottom` bleeds under the scrolling grid, an inset shadow travels with the sticky head.* `position:sticky; top:0; z-index:2; box-shadow: inset 0 -1px 0 var(--k-border)`. [LOAD-BEARING]
21. **Hour rail sticky-left; corner cell wins the z-stack** — *the hour gutter must stay pinned on any horizontal scroll, and the top-left corner sits above both axes.* rail `sticky left:0 z1`; corner `top:0 left:0 z3`. [LOAD-BEARING]
22. **Hour lines via repeating-gradient, not per-cell borders** — *drawing H×cols cell borders is markup-heavy and the lines vanish under sticky cells / rounded clips; a `repeating-linear-gradient` on the column paints clean lines that scroll with content.* `repeating-linear-gradient(...var(--k-cal-hour))`. [LOAD-BEARING]
23. **Events positioned declaratively by start + duration** — *no pixel math in the consumer: an event sets its start hour and span as custom props and the recipe computes top/height from the one hour-height token.* `top: calc(var(--from)*var(--k-cal-hour)); height: calc(var(--span)*var(--k-cal-hour) - gap)`. [LOAD-BEARING]
24. **Current-time ("now") line** — *the single most-used time-grid cue: a thin accent line at the current minute, absolutely positioned INSIDE the scrolling grid (so it scrolls with the hours), often with a leading dot in the gutter; scroll it into view on mount.* `.calendar-week__now{position:absolute; top:calc(var(--now)*…); height:0; border-top:2px solid var(--k-accent)}`. [LOAD-BEARING]
25. **Overlapping-event side-by-side layout** — *concurrent events must split the column width (n columns / offset), not stack opaquely hiding each other.* A width/left offset driven by an overlap-lane custom prop (`--lane`, `--lanes`). [LOAD-BEARING]
26. **All-day row above the hour grid** — *all-day / multi-day events don't belong on the timeline; they get a second sticky band between the day-header and the first hour.* a sticky all-day row at `top: var(--dayhead-h)`. [polish]
27. **Hour height is one token (density-scalable)** — *the whole grid should rescale with density; one `--k-cal-hour` knob does it.* present. [polish]

### View parity: month / week / year
28. **Year view = 12 mini-months reusing the month grid** — *don't fork a second grid engine; the year overview is the same `.calendar` at a smaller cell scale, with the current month lifted.* `--k-cal-cell` override + current-month ring. [polish]
29. **Consistent today/selected treatment across all views** — *today must look like "today" whether in month, week, year, or range; divergent treatments break the mental model.* today-ring + primary-fill tokens shared. [LOAD-BEARING]
30. **Cell stature ladders with density** — *Linear/Notion slim (28) · shadcn default (32) · iOS tap-target (40); one token drives it.* `--k-cal-cell`. [polish]

### Range picker (double-month)
31. **Two months side-by-side, range band spans both** — *a range picker shows enough context to pick across a month boundary; the `--range` band must read continuous across the gap between the two grids.* flex row of two `.calendar` panels. [LOAD-BEARING]
32. **Collapses to one column on narrow hosts** — *two months don't fit a phone; container-query down to a single stacked month.* `@container (max-width:…)`. [polish]
33. **Guard end ≥ start** — *picking an end before the start should reorder, not error; a documented consumer rule the kit should call out.* (consumer logic; documented). [polish]

### Sticky & scroll
34. **`overscroll-behavior: contain`** — *stop scroll-chaining / pull-to-refresh leaking out of the time-grid.* present on `.calendar-week`. [LOAD-BEARING]
35. **Every sticky cell has an opaque background** — *the #1 sticky bug: transparent sticky head shows scrolled content through it.* head + corner carry `--k-surface`. [LOAD-BEARING]

### A11y & keyboard
36. **Grid is real `role=grid` with arrow-key roving tabindex** — *APG: dates are gridcells; ArrowUp/Down move ±7 days, Left/Right ±1, Home/End/PageUp/Down jump week/month; only one cell is tabbable at a time.* Cells are real `<button>`s (kit does this) — consumer wires roving tabindex + arrow handlers. [LOAD-BEARING]
37. **Month/year title is a live region** — *month-nav changes must be announced; the heading is `aria-live=polite` so SR users hear the new month.* (consumer; document). [LOAD-BEARING]
38. **Never rely on color alone for state** — *today/selected/disabled need a non-color cue (ring, fill+weight, strike-through) for color-blind users.* today-ring + selected weight bump + disabled strike. [LOAD-BEARING]
39. **Hit target ≥ 24px (AA)** — *cells must clear the AA tap floor even at compact stature.* `min-height: var(--k-cal-cell,32px)`. [LOAD-BEARING]

### Responsive
40. **Month → agenda/list on mobile** — *a 7×6 month grid with event chips is unusable on a phone; the canonical degrade is to a scrollable agenda/day list (Apple, Fantastical, Google).* a `.calendar--agenda` / list fallback at narrow widths. [LOAD-BEARING]
41. **Week-grid → single-day on mobile** — *7 day-columns don't fit a phone; `--calendar-week--day` (1 col) is the mobile form.* present (`--cal-cols:1`). [polish]

## B. Compliance scan (check)

| # | Rule | Status | Evidence (sub-recipe + line/snippet OR "absent") | Severity |
|---|------|--------|--------------------------------------------------|----------|
| 1 | 7-col full weeks | ✅ PASS | month `:2308 grid-template-columns: repeat(7, 1fr)`; `--out` exists for fill days | — |
| 2 | Square tabular cells | ✅ PASS | month `:2325 aspect-ratio:1`, `:2337 font-variant-numeric: tabular-nums` | — |
| 3 | Week-start locale-driven | ⚠️ PARTIAL | CSS grid is order-agnostic (correct), but NOTHING in the recipe comments documents that header order + first-cell offset are the consumer's to set per locale | MED |
| 4 | Muted weekday header | ✅ PASS | month `:2313 .calendar__head` faint, caption, centered | — |
| 5 | Today ≠ selected; suppress ring when both | ✅ PASS | month `:2351 --today{box-shadow: inset 0 0 0 1px}`, `:2352 --today.--on{box-shadow:none}` — exemplary | — |
| 6 | Selected filled, AA fg | ✅ PASS | month `:2346 --on{background:var(--k-primary); color:var(--k-primary-fg)}` | — |
| 7 | In-range soft, endpoints primary | ✅ PASS | month `:2358 --range{background:var(--k-secondary-soft)}`; `:2363/:2370` start/end primary | — |
| 8 | Range = continuous band | ✅ PASS | month `:2361 --range{border-radius:0}`; start drops right radii, end drops left radii | — |
| 9 | Range HOVER-PREVIEW | ❌ GAP | absent — no `--range-preview`/`--hover-end` modifier anywhere; only committed range states exist | HIGH |
| 10 | Out-of-month muted | ✅ PASS | month `:2347 --out{color:var(--k-fg-faint); opacity:.4}` | — |
| 11 | Disabled ≠ out-of-month | ✅ PASS | month `:2388 --disabled{... line-through; cursor:not-allowed}` distinct from `--out` | — |
| 12 | Hover only on pickable | ✅ PASS | month `:2348 --out:hover{background:transparent}`, `:2389 --disabled:hover{transparent}` | — |
| 13 | Event chips in month cells | ❌ GAP | absent — month recipe has NO `.calendar__event` chip; `.calendar__cell` is a centered picker cell only. Event chips exist ONLY in the week time-grid (`:2481`), not month | HIGH |
| 14 | All-day vs timed differ | ❌ GAP | absent in month entirely; week `.calendar-week__event` is a single timed-block treatment with no all-day variant | HIGH |
| 15 | Color-code by calendar | ⚠️ PARTIAL | week-only: `:2498 --alt`, `:2499 --accent` tonal variants exist for time-grid events; month has none | MED |
| 16 | "+N more" overflow | ❌ GAP | absent — no `.calendar__more` / overflow affordance in any sub-recipe | HIGH |
| 17 | Title truncation | ⚠️ PARTIAL | week event title `:2496 white-space:nowrap; text-overflow:ellipsis` ✅; month has no event title to truncate | LOW |
| 18 | Event-cell top-aligned layout | ❌ GAP | absent — month `.calendar__cell` is `place-items:center` (picker), no event-bearing cell layout | MED |
| 19 | One scroll container | ✅ PASS | week `:2436 overflow-y:auto` on `.calendar-week` (whole grid) | — |
| 20 | Sticky head, inset-shadow divider | ✅ PASS | week `:2445-2447 position:sticky; top:0; z-index:2; box-shadow: inset 0 -1px 0` | — |
| 21 | Sticky hour-rail + corner z-stack | ⚠️ PARTIAL | head is sticky z2; corner has `border-right` `:2449` but is NOT declared `sticky left:0 z3`, and `.calendar-week__rail` `:2466` is NOT `sticky left:0`. Brief mandates rail `left:0 z1` + corner `left:0 z3`. Works today only because `overflow-x:hidden` `:2436` disables horizontal scroll — so the freeze is latent, not implemented | MED |
| 22 | Hour lines via gradient | ✅ PASS | week `:2476 background: repeating-linear-gradient(...var(--k-cal-hour))` | — |
| 23 | Declarative event positioning | ✅ PASS | week `:2483-2484 top:calc(var(--from)*--k-cal-hour); height:calc(var(--span)*…)` | — |
| 24 | Current-time "now" line | ❌ GAP | absent — no `.calendar-week__now` line / now-indicator anywhere; brief explicitly specifies it ("now line = absolutely-positioned accent line INSIDE the grid, scrollIntoView on load") | HIGH |
| 25 | Overlapping-event lanes | ❌ GAP | absent — event is `left:var(--k-s-2); right:var(--k-s-2)` `:2482` (always full width); two concurrent events overlap opaquely. No `--lane/--lanes` width split | HIGH |
| 26 | All-day row | ❌ GAP | absent — no second sticky all-day band at `top:var(--dayhead-h)` | MED |
| 27 | Hour-height token | ✅ PASS | week `--k-cal-hour` used `:2468/:2476/:2483/:2484` | — |
| 28 | Year = mini-month reuse | ✅ PASS | year `:2511-2517` reuses `.calendar` with `--k-cal-cell:1.5rem` override + `--now` ring | — |
| 29 | Consistent today across views | ⚠️ PARTIAL | month uses today-RING `:2351`; week uses today-FILL on `.calendar-week__daynum` `:2461` (primary background). Two different today treatments → mental-model break per rule 29. (Defensible — week has no ring room — but inconsistent) | LOW |
| 30 | Cell stature ladders w/ density | ✅ PASS | month `:2326 min-height: var(--k-cal-cell,32px)` (28/32/40 documented `:2320-2321`) | — |
| 31 | Two-month range, band spans | ✅ PASS | range `:2529-2532` flex row + shared `--range` band; divider unifies | — |
| 32 | Collapse to 1 col narrow | ✅ PASS | range `:2533 @container (max-width:32rem)` drops divider/stacks | — |
| 33 | Guard end ≥ start | ⚠️ PARTIAL | consumer logic (acceptable), but NOT documented in the range recipe comment | LOW |
| 34 | overscroll contain | ✅ PASS | week `:2436 overscroll-behavior: contain` | — |
| 35 | Opaque sticky bg | ✅ PASS | week head `:2446 background: var(--k-surface)` | — |
| 36 | role=grid + roving tabindex | ⚠️ PARTIAL | cells ARE real `<button>`s (month `:2334-2340` button-reset), keyboard-operable — but recipe does NOT mention `role=grid`/arrow-key/roving-tabindex contract for the consumer | MED |
| 37 | Live-region month title | ❌ GAP | absent — `.calendar__nav-title` `:2382` is a plain heading; no note to wire `aria-live` | MED |
| 38 | No color-alone | ✅ PASS | today=ring(non-color), selected=fill+`weight-semibold` `:2346`, disabled=line-through `:2388` | — |
| 39 | Hit target ≥24px | ✅ PASS | month `:2326 min-height:var(--k-cal-cell,32px)` ≥ 24 even at compact | — |
| 40 | Month → agenda on mobile | ❌ GAP | absent — no agenda/list fallback recipe for narrow viewports | MED |
| 41 | Week → single-day mobile | ⚠️ PARTIAL | `.calendar-week--day` (`:2439 --cal-cols:1`) exists but is a manual variant, not auto-applied at a mobile breakpoint/container query | LOW |

**Counts:** ✅ PASS 23 · ⚠️ PARTIAL 10 · ❌ GAP 8 (of 41 rules).

## C. Gap worklist (ranked)

**HIGH**
1. **Current-time "now" line** (`calendar-week`) — add `.calendar-week__now{position:absolute; left:0; right:0; top:calc(var(--now,0)*var(--k-cal-hour,3rem)); height:0; border-top:2px solid var(--k-accent); z-index:1}` + a gutter dot pseudo; document `scrollIntoView` on mount. The brief already prescribes this exact pattern — it's a known, specced gap.
2. **Overlapping-event lanes** (`calendar-week`) — replace fixed `left/right` with lane math: `.calendar-week__event{ left: calc(var(--lane,0)/var(--lanes,1)*100%); width: calc(100%/var(--lanes,1)); }` (keep a small inset gap), consumer supplies `--lane/--lanes`. Today two concurrent events hide each other.
3. **Month event chips + all-day variant** (`calendar`) — add a `.calendar__event` chip primitive (soft fill, leading color edge, one-line ellipsis title) and `.calendar__event--allday` (full-width bar) vs timed (leading time/dot). This is the biggest single gap: month view can't show events at all today.
4. **"+N more" overflow** (`calendar`) — add `.calendar__more{font-size:var(--k-type-eyebrow); color:var(--k-fg-muted); cursor:pointer}` row; pairs with rule 3 so month cells cap chip count and stay on the row grid.
5. **Range hover-preview** (`calendar`/`calendar-range`) — add `.calendar__cell--range-preview` (mirror `--range` at lower emphasis, e.g. dashed inset or `--secondary-soft` at reduced alpha) + `--preview-end` mirroring `--range-end`; consumer paints on `mouseover` after start is set.

**MED**
6. **Event-bearing month cell layout** (`calendar`) — a `.calendar__cell--events` (or a sibling `.calendar__day`) that is top-left-aligned (number top-left, chips stacked) rather than `place-items:center`; rule 3 needs a home.
7. **Latent frozen rail/corner** (`calendar-week`) — make the freeze real: `.calendar-week__rail{position:sticky; left:0; z-index:1; background:var(--k-surface)}` + `.calendar-week__corner{position:sticky; top:0; left:0; z-index:3; background:var(--k-surface)}`; only needed once horizontal scroll is enabled, but ship it now so the z-stack is correct by construction.
8. **All-day row** (`calendar-week`) — a sticky band `.calendar-week__allday{position:sticky; top:var(--k-cal-dayhead-h); z-index:2; background:var(--k-surface); box-shadow: inset 0 -1px 0 var(--k-border)}`.
9. **Month → agenda fallback** (`calendar`) — a `.calendar--agenda` list form (day-grouped rows) for narrow viewports; the canonical mobile degrade.
10. **Color-code in month** (`calendar`) — once chips land (rule 3), add `--alt/--accent` tonal event variants mirroring the week-grid set for multi-calendar coding.
11. **A11y contract docs** (all) — add recipe comments: cells expect `role=gridcell`/roving-tabindex + arrow-key handlers; `.calendar__nav-title` should be wired `aria-live=polite`.
12. **Week-start locale doc** (`calendar`) — comment that weekday-header order and the first-cell offset are consumer-set per locale (Sun- vs Mon-first), and they move together.

**LOW**
13. **Consistent today treatment** (`calendar-week`) — consider a ring option on `.calendar-week__daynum--today` to match the month's ring language (or document the deliberate divergence).
14. **Auto single-day week on mobile** (`calendar-week`) — container-query `.calendar-week` to `--cal-cols:1` below a threshold instead of manual `--day`.
15. **Document end≥start guard** (`calendar-range`) — one-line consumer note in the range comment.

## D. Loop notes (meta)

- **Research half:** medium-hard — calendar is genuinely the most complex of the 3 pilots (it's really 4 components: picker grid, event-month, time-grid, range). The web surfaced clean consensus on the load-bearing laws (today≠selected, range band, now-line, +N-more, lane layout, agenda-degrade); FullCalendar (`nowIndicator`/`slotEventOverlap`) and the W3C APG Date Picker were the most implementation-grade sources. No surprises contradicting our prior sticky brief.
- **Scan found REAL gaps, not nitpicks.** Post-sticky-fix the *time-grid scroll mechanics* and the *picker state machine* are genuinely strong (rules 1–8, 10–12, 19–23, 30–35, 38–39 all PASS — the today-ring-suppression at `:2352` is textbook). But the **event layer is hollow**: no now-line, no overlap lanes, no month event chips, no "+N more", no all-day row, no range hover-preview. These are the 6 highest-value gaps and all 6 are things best-in-class calendars treat as table stakes. The kit currently exports a beautiful *date picker* + a *scaffold* of a scheduler, not a complete scheduler.
- **Format verdict:** this doc is the right shape for a **skill / knowledge-base entry**, NOT `get_design_context`. The B-table (rule → status → our line) is exactly a per-component conformance scan that could be MECHANIZED into an `audit:` probe for the structural rules (e.g. "if `.calendar-week__event` then a `--now` line and a `--lane` mechanism must exist"). The supply half (A) reads as durable reference; the check half (B/C) is the per-component "best practices applied here, or not?" scan the MEMORY idea proposes — and it clearly earns its keep on this component.
- **Productize signal:** strong. The supply→check loop converted vague "calendars are hard" into 8 named, severity-ranked, one-line-fixable gaps with exact insert points. Worth prototyping the same template on the remaining 2 pilots, then deciding collect-vs-scan-vs-both (this run says: BOTH — the library is reusable, the scan is mechanizable).
