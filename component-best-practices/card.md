# Card — best-practice library + compliance scan

> Component: `.card` (+ family `.entity-card` · `.action-panel` · `.info-card` · `.card__foot`) · recipe `cockpit/src/kit/recipes/index.ts:506–620` (card) · `679–698` (entity-card) · `701–719` (action-panel) · `4905–4936` (infocard) · scanned 2026-06-30

Scope note: the **card** is the container idiom — the most-composed-into block in the kit.
This audit covers the base `.card` and the closure rule `.card__foot`/`--bar`, plus the
three first-class card variants it spawned: `.entity-card` (identity + key facts),
`.action-panel` (state-one-thing-offer-one-action), and `.info-card` (sidebar definition
tile). Because a card is a *surface that holds other components*, MANY craft rules (table
truncation, list states, form validation) belong to its **contents**, not the card itself —
the audit flags only what the container shell is responsible for, and uses the **Delegated?**
column heavily, since card affordances are routinely supplied at the usage level (the gallery
makes the whole card a `<button>`, the showcase wires the kebab menu, etc.).

Grounding: Material Design 2/3 cards, shadcn/ui Card (CardHeader/Content/Footer + the p-6 /
space-y split), Apple HIG, Inclusive Components "Cards", Nomensa/Berkeley/Livefront/Kitty
Giraudel accessible-card patterns, Bootstrap stretched-link, plus the kit's own
`COMPONENT-CRAFT.md` (Part III "Card — Footer / closure"). Severities align to the 10 craft
laws in `COMPONENT-CRAFT.md`.

---

## A. Best-practice library (supply)

### Anatomy & composition
1. **A card is a slot system, not a styled `<div>`: named header / body / footer regions.** [LOAD-BEARING] — the shadcn CardHeader/CardContent/CardFooter contract; without named slots every author re-invents the title-stack and the gaps drift. `.card__head` (title+desc column) · the default flex body · `.card__foot`.
2. **The container is the only required part; every slot is optional.** [LOAD-BEARING] — Material's rule: a card may open straight into custom UI. `.card` alone is valid; head/foot/media are opt-in (the gallery `Card()` makes title/desc optional).
3. **A row/column cluster primitive for inline vs stacked control groups.** [polish] — adjacent controls (label↔value, avatar+name) need one canonical gap so authors stop hand-styling flex. `.card__row` (inline, `--k-stack-gap`) · `.card__col` (stacked) · `.card__row--spread` (push to the two edges).
4. **Full-bleed top media that clips to the card's top radius.** [LOAD-BEARING] — product/article cards need an edge-to-edge image without the `padding:0 + overflow-hidden + manual-radius` guess every author re-derives. `.card__media { margin: calc(-1*--k-card-pad) … 0; border-top-*-radius; overflow:hidden }`.

### Spacing & rhythm
5. **Padding follows one density token; the internal gap is a *separate* token so raising pad never balloons the gaps (the shadcn `p-6` / `space-y` split).** [LOAD-BEARING] — craft L1: one density dial moves padding coherently while inner rhythm stays independent. `padding: var(--k-card-pad, var(--k-pad))` + `gap: var(--k-space)`.
6. **Every gap/pad is a grid token, never a magic number.** [LOAD-BEARING] — craft L1. `--k-pad` / `--k-space` / `--k-s-*` throughout; no raw px in the recipe.
7. **A comp-tier override hook so a scope can restyle JUST cards without touching system tokens.** [polish] — H2 lazy hook: `--k-card-pad/-bg/-border-color/-radius`, undefined by default, override per scope. `padding: var(--k-card-pad, var(--k-pad, 24px))` etc.

### Surface & elevation
8. **Default surface = bordered + rounded + a soft resting shadow on the `--k-surface` plane.** [LOAD-BEARING] — Material's "elevated card" / outlined card: a card must read as a distinct plane above the page. `background: var(--k-surface)` + `1px border` + `--k-radius-lg` + `--k-shadow-sm`.
9. **A "well" / filled variant: sunken, no shadow, transparent edge — sits IN the page, not above it.** [polish] — Material filled card + Tailwind well; for nested summaries / recessed panels. `.card--well { background: var(--k-surface-sunken); box-shadow:none; border-color:transparent }`.
10. **A presentation variant: a saturated brand face with inverse ink + deeper lift (tickets, passes, credit cards).** [polish] — the "card meant to be SEEN"; surfaced by the build test (a credit card reached for `.card`, got a white box, hand-hacked colours). `.card--presentation { background: var(--k-primary); color: var(--k-primary-fg); box-shadow: var(--k-shadow-lg) }`.

### Hierarchy & focal point
11. **The card title reads as a real product heading: display font, h3 tier, tight tracking, full ink — shared by every container (card/dialog/sheet).** [LOAD-BEARING] — craft L5 (one focal point): ONE title treatment kit-wide or container titles drift. `.card__title,.dialog__title,.sheet__title { font-family:var(--k-font-display); font-size:var(--k-type-h3); letter-spacing:var(--k-track-tight) }`.
12. **The description recedes (small tier, muted) so the title wins.** [LOAD-BEARING] — craft L5. `.card__desc { font-size:var(--k-type-small); color:var(--k-fg-muted) }`.
13. **The title is a real heading element (`<h3>`), not a styled span, with `margin:0` so it's safe on the UA-margined element.** [LOAD-BEARING] — accessibility: screen-reader users navigate by heading; the title must carry heading semantics. `.card__title { margin:0 }` (authoring rule: render an `<h3>`).

### Interactivity & state (craft L6)
14. **A whole-card click target variant (link/button card): pointer, hover lift, `:active` press, focus ring.** [LOAD-BEARING] — Material's clickable-card affordance; a clickable card MUST signal it. `.card--interactive { cursor:pointer; transition:border/shadow/transform } :hover{lift} :active{translateY(1px)} :focus-visible{outline}`.
15. **Put the interactive card on a real `<button>`/`<a>` (font/text-align resets keep it card-shaped), not a `div` with onClick.** [LOAD-BEARING] — accessibility: keyboard-reachable + announced as a control. `.card--interactive { text-align:left; font:inherit; width:100% }` on a `<button>`.
16. **Avoid nested/redundant links — one primary target per card; expand its hitbox (stretched-link), bump other controls above it.** [LOAD-BEARING] — Inclusive-Components / Nomensa: wrapping the whole card in `<a>` and also nesting links creates duplicate focus stops + breaks cards-with-buttons. No `stretched-link` pseudo-overlay primitive in the kit today (authoring relies on the whole-element `.card--interactive` button).
17. **Hover/focus ring derives from kit state tokens, transitions are fast + restrained (craft L8).** [LOAD-BEARING] — `border-color:var(--k-state-border)` + `box-shadow:var(--k-shadow-md)` on hover; `transition … var(--k-dur-fast) var(--k-ease)`; focus `outline:2px solid var(--k-ring)` (the I3 ring).
18. **`:focus-within` highlights the whole card when an inner control is focused (keyboard wayfinding for cards that nest controls).** [polish] — accessible-card guidance: shows keyboard users which card they're inside. No `.card:focus-within` rule today (the interactive *button*-card handles its own focus; nested-control cards have none).

### Footer / closure (craft L10)
19. **The footer CLOSES the box: full-bleed top divider + bottom radius reaching the card edges — never an inset hairline floating mid-card.** [LOAD-BEARING] — craft L10; the formpanel-quality, now every card's default. `.card__foot { margin: … calc(-1*--k-card-pad); border-top:var(--k-divider); border-bottom-*-radius }`.
20. **ONE footer family kit-wide: plain `.card__foot` (divider) for simple action cards · `.card__foot--bar` (grey-sunken well) for commit/form footers — same frame, recognizable fill.** [LOAD-BEARING] — craft L10 unity; `.datatable__foot`/`.formpanel__foot` share the same closure treatment. `.card__foot--bar { background: var(--k-surface-sunken) }`.
21. **Footer holds one primary action + ghost/secondary, not a wall of equal buttons (craft L5).** [polish] — authoring rule; the foot is a flex column on `--k-stack-gap`. Composition, not a token.

### State completeness for the card-as-collection (delegated downward)
22. **Empty state designed (icon + line + CTA), not a blank card.** [LOAD-BEARING] — craft L6; a data card with no rows must be designed. Delegated to the `.empty` recipe placed inside the card (gallery + showcase both do this).
23. **Loading = skeleton that preserves the card's shape, not a spinner.** [polish] — craft L6; the `.skeleton` primitive is the kit's answer, composed into the card body. Card shell ships no `.card--loading` (deliberate — loading lives in the contents).
24. **Selected state for selectable cards (radio-card / plan picker) reads unambiguously and follows the Selection-accent (kit I2 selected-edge).** [LOAD-BEARING] — craft L6; a chosen card ≠ hover. Delegated to `.radio-card--on` (the selectable-card sibling), which carries the selected treatment; base `.card` is not itself selectable.

### Card-family variants (the spawned components)
25. **Identity card (`.entity-card`): logo/avatar + name + kebab in a compact header, FULL-BLEED divider, then label/value meta rows; padding on head/meta so the divider is full-bleed.** [LOAD-BEARING] — the clients/contacts/repos pattern; padding-on-container would inset the divider (the same L10 trap the foot solved). `.entity-card { padding:0; overflow:hidden }` + head/meta own the padding.
26. **Action panel (`.action-panel`): states ONE thing, offers ONE action (heading + desc + action zone), inline by default, wraps below on narrow.** [LOAD-BEARING] — the Tailwind settings-screen workhorse; built on `.card`. `.action-panel { flex-direction:row; flex-wrap:wrap; justify-content:space-between } __body{flex:1 1 22rem}`. `--danger` variant for destructive ("Delete account").
27. **Info card (`.info-card`): compact label↔value definition row with emphasis flip (value carries ink+weight), divider between, last row drops it.** [polish] — sidebar detail tiles. `.info-card { justify-content:space-between; border-bottom:var(--k-divider) } :last-of-type{border-bottom:0}` + value `--k-fg`/medium vs label muted.
28. **Content truth: the card survives long titles, zero values, overflow (craft L9).** [LOAD-BEARING] — `.entity-card__name` ellipsis-truncates (`overflow:hidden;text-overflow:ellipsis;white-space:nowrap`); the base `.card` body wraps naturally. A long unbreakable string in `.card__title` has no truncation utility (rare — titles are authored short).

---

## B. Compliance scan (check)

| # | Rule | Status | Evidence (recipe line/snippet, OR usage file, OR "absent") | Delegated? | Severity |
|---|------|--------|------------------------------------------------------------|-----------|----------|
| 1 | Named head/body/foot slots | ✅ PASS | `.card__head` (555) · flex body (516-518) · `.card__foot` (585) | — | — |
| 2 | Container-only is valid; slots optional | ✅ PASS | `.card{display:flex;…}` standalone (515); gallery `Card()` makes title/desc optional (407-408); showcase opens cards straight into UI (l.433, 483) | usage | — |
| 3 | Row/col cluster primitive | ✅ PASS | `.card__row` (565) · `.card__col` (569) · `.card__row--spread` (568) | — | — |
| 4 | Full-bleed top media + radius clip | ✅ PASS | `.card__media` neg-margin + top-radius + overflow (574-579); demoed in ProductCard (gallery 4681) | — | — |
| 5 | pad / inner-gap split (p-6 vs space-y) | ✅ PASS | `padding:var(--k-card-pad,var(--k-pad))` (523) vs `gap:var(--k-space)` (518); comment names the shadcn split (513-514) | — | — |
| 6 | Grid tokens, no magic px | ✅ PASS | all `--k-pad`/`--k-space`/`--k-s-*` (516-594); audit:craft ratchet guards | — | — |
| 7 | Comp-tier override hooks | ✅ PASS | `--k-card-pad/-bg/-border-color/-radius` fallback chains (523-527) | — | — |
| 8 | Bordered + rounded + soft shadow plane | ✅ PASS | `background:var(--k-surface)` + `1px border` + `--k-radius-lg` + `--k-shadow-sm` (524-528) | — | — |
| 9 | Well / sunken variant | ✅ PASS | `.card--well{background:var(--k-surface-sunken);box-shadow:none;border-color:transparent}` (552); demoed (gallery 4745) | — | — |
| 10 | Presentation (brand face) variant | ✅ PASS | `.card--presentation` (613-618) + inverse title/desc (619-620); demoed (gallery 4530) | — | — |
| 11 | Shared title treatment (display/h3/tight) | ✅ PASS | `.card__title,.dialog__title,.sheet__title{font-family:var(--k-font-display);font-size:var(--k-type-h3);letter-spacing:var(--k-track-tight)}` (561) | — | — |
| 12 | Description recedes | ✅ PASS | `.card__desc{font-size:var(--k-type-small);color:var(--k-fg-muted)}` (562) | — | — |
| 13 | Title is a real `<h3>` w/ margin:0 | ⚠️ PARTIAL | recipe has `margin:0` (561) so it's `<h3>`-safe; BUT gallery (407) + most showcase titles render `<div className="card__title">`/`<span>` — heading semantics NOT emitted | usage (authoring) | MED |
| 14 | Whole-card click variant (hover/press/focus) | ✅ PASS | `.card--interactive` cursor/transition (534-543) + `:hover` lift (544) + `:active` press (545) + `:focus-visible` ring (546) | — | — |
| 15 | Interactive card on real `<button>`/`<a>` | ✅ PASS | resets `text-align/font/width` (536-538); gallery uses `<button className="card card--interactive">` (2127, 3263) | usage | — |
| 16 | No nested links; one target + stretched hitbox | ⚠️ PARTIAL | `.card--interactive` is the whole-element-is-the-control answer (correct for simple cards); but NO stretched-link pseudo-overlay primitive for "card with a heading-link + other buttons" | — | LOW |
| 17 | State ring/hover from tokens, fast transition | ✅ PASS | `border-color:var(--k-state-border)` + `--k-shadow-md` (544); `transition … var(--k-dur-fast) var(--k-ease)` (539-542); `outline:2px solid var(--k-ring)` (546) | — | — |
| 18 | `:focus-within` whole-card highlight | ❌ GAP | absent — no `.card:focus-within` rule. Interactive *button*-cards self-focus (I3); cards nesting controls get no aggregate focus cue | — | LOW |
| 19 | Footer closes the box (full-bleed divider) | ✅ PASS | `.card__foot` neg-margin cancels pad + bottom-radius (585-590); the L10 fix (COMPONENT-CRAFT Part III) | — | — |
| 20 | ONE footer family (plain · `--bar` well) | ✅ PASS | `.card__foot--bar{background:var(--k-surface-sunken)}` (598) shared with `.datatable__foot,.formpanel__foot` (604-608); demoed (gallery 597,629,895; showcase 947) | — | — |
| 21 | One primary + ghost in foot, not a wall | ✅ PASS | foot is flex-col on `--k-stack-gap` (591-593); usage pairs note-left/primary-right (showcase 947) | usage | — |
| 22 | Designed empty state | ✅ PASS | `.empty` recipe composed inside `.card` (gallery 2211, showcase 880) | usage | — |
| 23 | Loading skeleton preserves shape | ✅ PASS | `.skeleton` primitive composes into the card body (kit ships it); card shell intentionally has no `--loading` (loading lives in contents) | delegated | — |
| 24 | Selectable-card selected state (I2 edge) | ✅ PASS | delegated to `.radio-card--on` sibling (gallery 1458, showcase 1011); base `.card` isn't selectable | delegated | — |
| 25 | Entity-card: compact head, full-bleed divider, meta rows | ✅ PASS | `.entity-card{padding:0;overflow:hidden}` + head/meta own padding (688-693); demoed (gallery 4700, showcase 604) | — | — |
| 26 | Action-panel: one-thing-one-action, inline-wrap, `--danger` | ✅ PASS | `.action-panel{flex-direction:row;flex-wrap:wrap;justify-content:space-between}` (710) + `--danger` (718); 5 variants demoed (gallery 4733-4751) | — | — |
| 27 | Info-card: label↔value, emphasis flip, divider | ✅ PASS | `.info-card` (910-918) + value ink/weight flip (925-929) + `:last-of-type{border-bottom:0}` (918); demoed (gallery 4182) | — | — |
| 28 | Content truth (long/zero/overflow) | ⚠️ PARTIAL | `.entity-card__name` truncates (690); base `.card` body wraps; but `.card__title` has NO truncation/`min-width:0` utility for a long unbreakable string | — | LOW |

---

## C. Gap worklist (ranked)

1. **[MED · #13] Title heading semantics not emitted at usage.** The recipe is `<h3>`-safe (`margin:0`), but the gallery `Card()` and most showcase titles render `.card__title` on a `<div>`/`<span>`, so screen-reader heading navigation gets nothing. Fix: this is an **authoring/usage** change, not a recipe one — render `.card__title` as an `<h3>` (or document the rule in the skill/`get_design_context` card: "card titles are headings"). No CSS change needed; consider an `audit:` lint that warns when `.card__title` is on a non-heading element.
2. **[LOW · #16] No stretched-link primitive for "card with a heading-link + secondary buttons."** Today the only whole-card target is `.card--interactive` (the whole element IS the control), which can't hold other links/buttons. Fix: add an optional `.card--linked` pattern — `position:relative` on the card + a `.card__link::after { position:absolute; inset:0; z-index:1 }` overlay, and a note that other controls need `position:relative; z-index:2`. Pair with a gallery demo (modifier audit).
3. **[LOW · #18] No `.card:focus-within` aggregate focus cue.** Cards that nest controls give keyboard users no "which card am I in" signal. Fix (one line): `.card:focus-within { border-color: var(--k-state-border) }` (or an outline) — cheap, harmless on non-interactive cards. Could fold into the `.card--linked` work above.
4. **[LOW · #28] `.card__title` lacks a truncation utility.** A pathologically long unbreakable title overflows. Fix: add `min-width:0` to the title's flex parent + an opt-in `.card__title--truncate { overflow:hidden; text-overflow:ellipsis; white-space:nowrap }`. Low priority — titles are authored short and this is a content-truth edge.

---

## D. Loop notes (meta)

- **Research half: cheap and convergent.** Card is one of the most-documented components on the web; shadcn (slots + p-6/space-y split), Material (elevation/filled/outlined + states), and the accessible-card canon (Inclusive Components, Nomensa, Kitty Giraudel) agreed tightly. Three searches were plenty; no contradictions to adjudicate.
- **Scan finding: the card is STRONG — the kit clearly invested here.** 22/28 PASS, 0 HIGH. The container, the slot system, the surface variants (well/presentation), the comp-tier hooks, and especially the **footer-closure unity (L10)** are all nailed — that was a deliberate craft pass (`COMPONENT-CRAFT.md` Part III) and it shows. The only real gaps are accessibility-flavoured polish (heading semantics, focus-within, stretched-link) and one content-truth edge (title truncation). No false-positive HIGHs avoided here, but several rules (empty/loading/selected) were correctly scored PASS-via-delegation rather than GAP — exactly the trap the skill warns about: a CSS-only scan would have flagged "no empty state," "no loading," "no selected state" on `.card`, when those are deliberately delegated to `.empty`/`.skeleton`/`.radio-card` composed *inside* the card.
- **FALSE-POSITIVE risk was real and material.** Six rows (22-24, 21, 15, 2) are PASS only because the usage handles them — making the `Card()` title optional, putting `.card--interactive` on a `<button>`, dropping `.empty` into the body. Reading `ComponentGallery.tsx` + `sections.tsx` was load-bearing; the gallery's 5 action-panel variants and the showcase's real entity-card grids are what turn "the CSS exists" into "the pattern ships."
- **Mechanizable into `audit:craft`:** #19/#20 (footer closure) are ALREADY enforced via the shared `.card__foot`/`.formpanel__foot` rule and the L10 craft note — keep them ratcheted. #13 (title-is-a-heading) is the one *new* mechanizable lint worth adding: warn when a `.card__title`/`.dialog__title`/`.sheet__title` class lands on a non-`<h1..h6>` element in the gallery/showcases. #6 (grid tokens) is covered by the existing magic-px ratchet.
- **Format verdict:** same split as the prior runs — **A is durable knowledge** (a clean `get_design_context`/skill card: "a card is a slot system; close the footer full-bleed; whole-card targets go on a `<button>`; titles are headings"), **B/C is a point-in-time scan** to re-run when the recipe changes.

---

### ~10-line summary

- **Component:** `.card` + family (`.entity-card` · `.action-panel` · `.info-card` · `.card__foot`).
- **Counts:** 28 rules — **22 ✅ PASS · 3 ⚠️ PARTIAL · 1 ❌ GAP** (0 HIGH severity).
- **Top 3 gaps:** (1) MED — card **titles aren't emitted as `<h3>` headings** at the usage level (recipe is heading-safe; gallery/showcase render `<div>`/`<span>`) → screen-reader heading-nav gets nothing. (2) LOW — **no stretched-link primitive** for a card that needs a heading-link *plus* other buttons (`.card--interactive` is whole-element-only). (3) LOW — **no `.card:focus-within`** aggregate focus cue for cards that nest controls.
- **Also LOW:** `.card__title` has no truncation utility for a long unbreakable string.
- **Verdict:** the card is one of the kit's strongest components — slot system, surface variants, comp-tier hooks, and the deliberate **footer-closure unity (L10)** are all nailed. Remaining gaps are accessibility polish, not structure. The **Delegated?** column mattered: empty/loading/selected/empty-title are PASS-via-composition (`.empty`/`.skeleton`/`.radio-card` inside the card), which a CSS-only scan would have false-flagged. The one new mechanizable lint: warn when a `.card__title`/`.dialog__title`/`.sheet__title` lands on a non-heading element.
