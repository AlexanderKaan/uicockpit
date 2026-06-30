# List — best-practice library + compliance scan

> Component: `.list` (the `.list__item` row family) · recipe `cockpit/src/kit/recipes/index.ts:4939–5085` · scanned 2026-06-30

Scope note: this is the **`.list` data-list idiom** — a flat or sectioned stack of
`.list__item` rows, each with an optional leading slot (`.list__lead` icon/avatar), a
two-line body (`.list__title` + `.list__sub`), and a trailing slot (`.list__trail`
chevron / value / text-link). It has three container modifiers — default
(top-divider + hover), `.list--flush` (no dividers, feeds), `.list--settings`
(bottom-divider, static, title/desc + control) — plus layout modifiers `.list--cols`
(two-column directory) and `.list--sticky` (iOS grouped sticky headers). Sibling
recipes own adjacent jobs and are recorded where they cover a list rule the `.list`
recipe delegates: **`.list__row`** (interactive-list-row `:2271` — bordered,
self-contained clickable row with `:hover`/`:active` + focus-ring registration),
**`.navrow`** (navigation-row `:2058` — destinations, owns selected/`--on` state),
**`.activity`** (activity-feed `:2224`), **`.timeline`** (`:5088`), **`.dl`**
(description-list `:3935`), **`.twocol`** (`:5344`), **`.empty`** (`:1941`). Where a
rule is a sibling's job, the scan says so but still records it, because "the `.list`
row has no answer when used bare" is itself a finding.

Grounding: Apple HIG (Lists & tables — 44pt targets, grouped lists, two-line cells),
Material Design 3 (Lists — leading cue / trailing meta or action, selected applies to
the whole item, supporting text), iOS swipe-actions (trailing = destructive, leading =
contextual), Linear / Stripe / Notion / Things 3 / shadcn list idioms, plus the kit's
own proven `TABLE-LIST-STICKY-PATTERNS.md`. Severities align to the 10 craft laws in
`COMPONENT-CRAFT.md`.

---

## A. Best-practice library (supply)

### Row anatomy & slots
1. **A row is leading-slot · content · trailing-slot.** [LOAD-BEARING] — the canonical Material/HIG list cell: a leading visual cue to scan by, the content (title + optional sub), and a trailing meta/action. `.list__item` is `display:flex; align-items:center; gap:--k-row-gap` with `.list__lead`, `.list__body`, `.list__trail`.
2. **The leading slot carries a quick visual cue, not chrome.** [LOAD-BEARING] — M3: "a leading icon provides a quick visual cue that relates to the label, helping people scan." `.list__lead--icon` (primary-soft chip), `--avatar` (round secondary chip + initials), `--icon-muted` (neutral round).
3. **The trailing slot is for status / meta / one action.** [LOAD-BEARING] — M3: trailing icon = status or a "show more" action; trailing text = price/count/meta. `.list__trail` (muted), `.list__trail--text` (primary text-link), `.list__dot` (unread marker).
4. **Body owns the truncation; the row never wraps by default.** [LOAD-BEARING] — a list scans as a stack of single-line entries; long titles ellipsize, not reflow. `.list__body { min-width:0 }` + `.list__title { white-space:nowrap; overflow:hidden; text-overflow:ellipsis }`.
5. **The primary action takes the lead+content; supplementary actions go trailing.** [polish] — M3 layout rule: don't bury the main tap target behind a trailing control. Composition rule — make the row itself the `<button>`, trailing controls are siblings.

### Density & hit target
6. **Density is a token, not a magic number — row padding rides `--k-s-*` / `--k-space`.** [LOAD-BEARING] — one density dial must move the whole list coherently (craft L1). `.list__item { padding: --k-s-8 }`; `.list--settings` uses `--k-s-14 0`; `.list--cols` gutter `--k-s-24`.
7. **A row that carries a control must clear the WCAG-2.2 / HIG touch floor.** [LOAD-BEARING] — HIG: interactive list rows want a ≥44pt (min 24px WCAG-2.2) target; the kit floor is `--k-hit-min` (1.5rem). `.tbl` enforces this (`tbody tr:has(input,button,a) td { min-block-size: --k-hit-min }`); the `.list__item` has **no equivalent min-height guard** — it relies on padding math, and the recipe comment even claims "Rows volgen het row grammar (--k-row-h-lg)" which the CSS does not implement.
8. **At least two row rhythms (data rows vs. roomy settings rows).** [polish] — admin/settings rows breathe (`--k-s-14`), data/feed rows stay tight (`--k-s-8`); the container modifier sets it. Present via `.list` vs `.list--settings`.

### States (hover / press / selected / focus)
9. **Every interactive row needs a real `:hover`.** [LOAD-BEARING] — affordance that the whole row is a target (M3 hover state). `.list__item:hover { background: --k-state-hover }`; `.list__row:hover` likewise; static `.list--settings` correctly suppresses it.
10. **An interactive row needs a `:active` / press feedback.** [LOAD-BEARING] — tactile confirmation on tap; the kit has a press token. `.list__row:active { background:--k-state-press }` ✅ — but the **flat `.list__item` has no `:active`**, only hover.
11. **A selectable row needs a selected state on the WHOLE item.** [LOAD-BEARING] — M3: "selected state applies to the entire list item." `.navrow--on` implements this for nav (`--k-state-selected-bg/-fg`); the **flat `.list__item` has no `--selected`/`[aria-selected]` treatment** — only `--unread` (bold title + dot). Bare selectable data lists have no answer.
12. **Keyboard focus ring must sit INSIDE a tightly-packed row, not outset.** [LOAD-BEARING] — the kit's own system rule (globalLayer): rows inside a packed parent put the ring inset (`outline-offset:-2px`) so it doesn't bleed into the divider/neighbour. `.list__row` IS registered in that inset list; **`.list__item` is NOT** — so a `.list__item` rendered as a `<button>` (the gallery does exactly this) gets the default **+2px outset** ring that can bleed across the hairline.
13. **Unread / new rows get a weight + marker treatment.** [polish] — Mail/inbox idiom: bold the title, add a leading-or-trailing dot. `.list__item--unread .list__title { font-weight:bold }` + `.list__dot`.

### Dividers & closure
14. **Dividers are a flat line that never inherits the row's radius.** [LOAD-BEARING] — a `border-top` curves down at Soft corners and a collapsed border vanishes under hover; the kit draws the divider as a `::before` pseudo inset by the radius (the `TABLE-LIST-STICKY` rule #2, applied). `.list__item::before { height:--k-bw; left/right:--k-radius-sm; background:--k-border }`.
15. **The first row drops its top divider; the last settings row drops its bottom.** [LOAD-BEARING] — closure (craft L10): no dangling hairline at the list edges. `.list__item:first-of-type::before { content:none }`; `.list--settings .list__item:last-of-type { border-bottom:0 }`.
16. **The hover background breathes into the card padding but content stays edge-aligned.** [polish] — negative inline margin + radius so the hover fill rounds and bleeds to the card edge while text aligns with section labels. `padding:--k-s-8; margin-inline:calc(--k-s-8 * -1); border-radius:--k-radius-sm`.

### Sections & sticky headers
17. **Grouped lists get an uppercase caption section header.** [LOAD-BEARING] — HIG grouped-list / Things 3 / Notion idiom for indexed or categorised data. `.list__section` (caption size, semibold, uppercase, `--k-track-eyebrow`, `--k-fg-faint`).
18. **Section headers pin (sticky) when the list scrolls.** [LOAD-BEARING] — the iOS grouped-list pattern: the group label stays in view as its rows scroll under it (`TABLE-LIST-STICKY-PATTERNS.md` §sticky-section). `.list__section { position:sticky; top:0; z-index:1; background:--k-surface }` (baseline) + `.list--sticky` reasserts it. Opaque bg present (rule #3) ✅.
19. **Two-column stacked directory on wide containers, one when narrow.** [polish] — Tailwind "stacked list, two columns"; section headers span both. `.list--cols { grid; auto-fit minmax(15rem,1fr) }` + `.list__section { grid-column:1/-1 }`.

### Edge states (empty / loading)
20. **A list that can be empty needs a real empty state.** [LOAD-BEARING] — HIG/Material: never a bare blank; icon + title + one-line reason + one quiet CTA. The kit ships a dedicated `.empty` recipe (icon chip + title + sub + grid); composed by the consumer, not baked into `.list`.
21. **A list that loads needs a skeleton, not a spinner-on-blank.** [polish] — match the row shape (avatar circle + two text lines) so layout doesn't jump. Handled at usage via a skeleton card in the gallery, not in the `.list` recipe.
22. **Destructive row actions live on a trailing (right-to-left) swipe; contextual on leading.** [polish] — iOS HIG swipe-action convention. Not a CSS concern — a behaviour the consumer wires; no kit primitive (acceptable, out of CSS scope).

---

## B. Compliance scan (check)

| # | Rule | Status | Evidence (recipe line/snippet, OR usage file, OR "absent") | Delegated? | Severity |
|---|------|--------|------------------------------------------------------------|-----------|----------|
| 1 | Lead · content · trail anatomy | ✅ PASS | `.list__item{display:flex;align-items:center;gap:--k-row-gap}` + `.list__lead/__body/__trail` (`:4964–5043`); used in gallery `ListCard` (`:4232`) + sections.tsx `:295–303` | — | — |
| 2 | Leading cue variants | ✅ PASS | `.list__lead--icon/--avatar/--icon-muted` (`:5007–5069`); gallery `:4235`, `:3295`, inbox `:1729` | — | — |
| 3 | Trailing status / meta / action | ✅ PASS | `.list__trail`, `--text`, `.list__dot` (`:5033–5074`); gallery `:4240/4261`, sections `:301` | — | — |
| 4 | Title truncation, no wrap | ✅ PASS | `.list__body{min-width:0}` + `.list__title{white-space:nowrap;…ellipsis}` (`:5019–5027`) | — | — |
| 5 | Primary action = row, supplementary trailing | ✅ PASS | Row is the `<button>` in usage (gallery `:4234/3294`, sections `:295`); trailing controls are siblings | usage | — |
| 6 | Density = token | ✅ PASS | `padding:--k-s-8` / `--k-s-14` / cols gutter `--k-s-24` (`:4973/5053/5079`) | — | — |
| 7 | Hit-target floor on control rows | ⚠️ PARTIAL | `.list__item` has **no `min-height`/`min-block-size`**; recipe comment claims "row grammar (--k-row-h-lg)" but CSS only sets `padding:--k-s-8` (`:4944/4973`). `.tbl` has the `--k-hit-min` guard (`:1453`); `.list` does not | no | MED |
| 8 | Two row rhythms | ✅ PASS | `.list` (tight) vs `.list--settings` (`padding:--k-s-14 0`, `:5050–5053`) | — | — |
| 9 | `:hover` on interactive rows | ✅ PASS | `.list__item:hover{background:--k-state-hover}` (`:4998`); `.list--settings` suppresses (`:5060`) | — | — |
| 10 | `:active` / press feedback | ⚠️ PARTIAL | Sibling `.list__row:active{background:--k-state-press}` (`:2299`) ✅; **flat `.list__item` has no `:active`** — hover only | partial (sibling) | LOW |
| 11 | Selected state on whole item | ❌ GAP | `.navrow--on` covers nav (`:2095`); **`.list__item` has NO `--selected`/`[aria-selected]`** — only `--unread` (`:5073`). Bare selectable data list has no selected treatment | no | MED |
| 12 | Inset focus ring on packed row | ❌ GAP | globalLayer inset list includes `.list__row` but **NOT `.list__item`** (`globalLayer.ts:177–197`); gallery renders `.list__item` as `<button>` (`:4234/3294`) → gets default **+2px outset** ring that bleeds across the divider | no | MED |
| 13 | Unread weight + marker | ✅ PASS | `.list__item--unread .list__title{font-weight:bold}` + `.list__dot` (`:5073–5074`); inbox `:1728–1734` | — | — |
| 14 | Divider = flat pseudo, radius-safe | ✅ PASS | `.list__item::before{…height:--k-bw;left/right:--k-radius-sm}` (`:4988–4996`) — matches `TABLE-LIST-STICKY` rule #2 | — | — |
| 15 | First/last divider closure | ✅ PASS | `.list__item:first-of-type::before{content:none}` (`:4997`); `.list--settings …:last-of-type{border-bottom:0}` (`:5061`) | — | — |
| 16 | Hover breathes, content edge-aligned | ✅ PASS | `margin-inline:calc(--k-s-8 * -1); border-radius:--k-radius-sm` (`:4974–4976`); cols resets it (`:5080`) | — | — |
| 17 | Section header (grouped) | ✅ PASS | `.list__section` caption/uppercase/faint (`:4950–4962`); gallery `:3292/3309`, sections | — | — |
| 18 | Sticky section header | ✅ PASS | `.list__section{position:sticky;top:0;z-index:1;background:--k-surface}` baseline (`:4960`) + `.list--sticky` (`:5085`); gallery `:3306` in a scroll container | — | — |
| 19 | Two-column directory | ✅ PASS | `.list--cols{grid;auto-fit minmax(15rem,1fr)}` + section spans (`:5079–5081`); gallery `:3289` | — | — |
| 20 | Empty state | ✅ PASS | dedicated `.empty` recipe (`:1941–1964`); sections.tsx `:880/896`, inbox blank "Nothing here." (`:1249`) | usage (`.empty`) | — |
| 21 | Loading skeleton | ✅ PASS | Skeleton-list card in gallery (`:968` "Skeleton shown as a loading list — avatar circle + two text lines") | usage | — |
| 22 | Swipe actions (destructive trailing) | ✅ PASS | Behavioural, out of CSS scope; no kit primitive needed | n/a (out of scope) | — |

**Tally: 16 PASS · 4 PARTIAL/—via-sibling · 2 GAP** (counting #7,#10 PARTIAL; #11,#12 GAP).

---

## C. Gap worklist (ranked)

1. **[MED · #12] Register `.list__item` in the inset focus-ring list.** The gallery already renders `.list__item` as a focusable `<button>`, so today it gets the +2px outset ring that bleeds across the hairline divider — the exact failure the kit's own system rule names. One-line fix: add `${s}.list__item:focus-visible,` to the inset selector group in `globalLayer.ts:177–197` (joins `.list__row`, `.navrow`, `.menu__item`, …). Zero new token.
2. **[MED · #11] Give the flat row a selected state.** Bare selectable data lists (a picked file, an active conversation) have no answer below the nav/`.list__row` tier. Add `.list__item--selected, .list__item[aria-selected="true"] { background: var(--k-state-selected-bg, var(--k-primary-soft)); color: var(--k-state-selected-fg, var(--k-primary)); }` — reuse the existing `--k-state-selected-*` tokens `.navrow--on` already uses; demo the new modifier in a gallery card (modifier audit needs the variant axis shown).
3. **[MED · #7] Add a hit-target floor to control-bearing rows.** The recipe comment promises row-grammar height the CSS never delivers. Add `.list__item:has(input, button, a, [role="button"], .toggle, .check) { min-height: var(--k-hit-min); }` (mirrors the proven `.tbl` guard at `:1453`) so a tight settings/data row with a control always clears 24px. Either ship that guard or fix the lying comment.
4. **[LOW · #10] Give the flat `.list__item` an `:active` press.** Sibling `.list__row` has it; the flat clickable row does not. One line: `.list__item:active { background: var(--k-state-press); }` (gated to non-`.list--settings` so static rows stay inert).

> All four are recipe/globalLayer-only, reuse existing tokens, and add no raw px — so none trip `audit:craft`. Items 1–3 are LOAD-BEARING rows and are candidates for the `audit:craft` ENFORCE rail (e.g. "if `.list__item` is registered as a button-role row, it must appear in the inset focus group").

---

## D. Loop notes (meta)

- **Research half was cheap, and largely pre-answered by prior kit research.** `TABLE-LIST-STICKY-PATTERNS.md` already nailed the sticky-section + divider-radius rules, so this scan mostly verified compliance (rules #14, #18 = clean passes) rather than re-deriving. HIG/M3 added the slot-anatomy and selected-whole-item framing. Net: A is durable skill-doc material; B/C is the re-runnable scan.
- **The two real GAPs (#11 selected, #12 focus-ring) are a clean case of the `.list__item` flat row being a tier behind its own siblings.** `.navrow` and `.list__row` BOTH have selected/inset-focus handled; the flat data row — the most-used member — quietly missed both. This is exactly the kind of cross-row inconsistency the Invariant Engine is meant to catch.
- **FALSE-POSITIVE avoided by reading usage (per the skill's #1 trap):** a CSS-only scan would have flagged empty-state (#20), loading-skeleton (#21), and "primary action = the row" (#5) as absent from the `.list` recipe — all three are correctly delegated (`.empty` recipe + gallery skeleton card + the row-is-a-`<button>` composition). Carried in the Delegated? column, so they PASS.
- **Mechanizable into `audit:craft`:** #12 (button-role list rows must be in the inset focus group), #7 (control-bearing rows must carry the `--k-hit-min` floor — generalises the existing `.tbl` guard), and #14/#18 (sticky/divider invariants) are the structural rows worth ratcheting so a closed gap can't silently reopen.
