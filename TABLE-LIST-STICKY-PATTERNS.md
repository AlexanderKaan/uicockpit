# Sticky-header / frozen-pane / mobile-scroll patterns — implementation brief

Research (2026-06-30) into best-practice table/list/calendar scroll behaviour across Linear,
Stripe, Notion, Airtable, Apple HIG, Things 3, Vercel, shadcn, Google Sheets, Fantastical,
Notion Calendar. Feeds the kit. Already applied: `.calendar-week` (one scroll container + sticky
day-header), `.datatable` (sticky thead, pre-existing), `.list__section` (sticky section headers).

## The load-bearing rules (memorize)

1. **Baseline `border-collapse: separate; border-spacing: 0`** — never `collapse` anywhere sticky
   or rounded (collapsed borders belong to the grid, not the cell box → they **vanish on scroll**
   under sticky cells, confirmed FF/WebKit bugs).
2. **Dividers/separators = `inset box-shadow`, never `border`** on cells that are sticky or inside a
   rounded card. `box-shadow` paints on the cell box → it travels with the sticky cell and clips to
   the radius; `border` doesn't.
3. **Every sticky cell needs an opaque `background`** (matching its surface token) — else scrolled
   content shows through. #1 bug.
4. **Scope `overflow` to a wrapper div**, set `overscroll-behavior: contain`, **drop**
   `-webkit-overflow-scrolling: touch` (dead since iOS 13).
5. **Z-index stack (fixed): body cells 0 · frozen first-col 1 · header row 2 · corner cell 3.**
6. **Rounded data container** = wrapper with `overflow: hidden` + border on the WRAPPER (never also
   on the table = double-border) + **last row drops its divider** so the grid meets the curve clean.
7. **Scroll-reveal shadows** (frozen col / header lift) toggle via a `.is-scrolled` JS class today;
   `animation-timeline: scroll()` as progressive enhancement.

## Per-pattern CSS

**Sticky column header (vertical scroll):**
```css
.wrap { overflow: auto; max-block-size: 70vh; overscroll-behavior: contain; }
table { border-collapse: separate; border-spacing: 0; }
thead th { position: sticky; top: 0; z-index: 2; background: var(--surface);
           box-shadow: inset 0 -1px 0 var(--border); }   /* NOT border-bottom */
```

**Frozen first column (horizontal scroll):**
```css
tbody th, thead th:first-child { position: sticky; left: 0; background: var(--surface); }
tbody th { z-index: 1; }
.frozen::after { content:""; position:absolute; inset:0 -16px 0 auto; width:16px;
  box-shadow: inset 11px 0 8px -10px rgb(0 0 0 / .12); pointer-events:none; }  /* one-sided, scroll-revealed */
```

**Corner cell (both axes):** `thead th:first-child { position:sticky; top:0; left:0; z-index:3; }`

**Sticky SECTION headers (iOS grouped list):** each header is a child of its own section wrapper
that holds that section's rows → it pins at `top:0` until its section's bottom drags it up as the
next header arrives. Flat siblings = a single header that swaps (no "push"), still fine.
```css
.section__header { position: sticky; top: 0; z-index: 1; background: var(--surface); }
```
Use for grouped/indexed data (A–Z, by-date, settings groups — Things 3 / Notion). Flat list for
short/ungrouped feeds.

**Pricing comparison:** §1 sticky header, offset by the page navbar (`top: var(--app-header-h)`);
featured column = a full-height tinted column with its header at z-index 3. Collapses to stacked
per-plan cards on mobile.

**Calendar / time-grid (two-axis):** day-header `sticky top:0 z2`; hour-gutter `sticky left:0 z1`;
corner `sticky top:0 left:0 z3`. Hour lines via `repeating-linear-gradient`/box-shadow (not borders).
"Now" line = absolutely-positioned accent line INSIDE the grid (scrolls), `scrollIntoView` on load.
All-day row = a second sticky header at `top: var(--dayhead-h)`.

## Mobile — how wide tables degrade (in order of preference)

1. **Horizontal scroll + frozen first column** (the kit default; Airtable/Sheets).
2. **Responsive table → stacked cards** — `@media: table/tr/td { display:block }`, hide real thead,
   each `td::before { content: attr(data-label) }` (Stripe Dashboard, record data).
3. **Priority columns + disclosure** — show 2-3 key cols, rest behind an expand chevron.
Plus: `overscroll-behavior: contain` to stop scroll-chaining/pull-to-refresh; sticky stays glued
through iOS momentum only if the scroller is the wrapper, not `body`.

## The border-meets-rounded-container fix (the calendar bug)

`border-radius` + `border-collapse: collapse` **don't coexist** (radius silently fails). Fix:
wrapper with `overflow: hidden` (border on the wrapper) + `border-collapse: separate` + inset-shadow
dividers + last-row drops its bottom line → grid meets the curve, no gap, no double-border. shadcn /
Linear / Vercel all ship exactly this `.table-card` primitive.

**Kit gap noted:** `.tbl` still uses `border-collapse: collapse` (works because `.datatable` draws
its thead divider via inset box-shadow, and row borders are in the scrolling tbody). A future
`.table-card` primitive (separate + box-shadow dividers + last-row-no-border) would generalize §6/§7.
