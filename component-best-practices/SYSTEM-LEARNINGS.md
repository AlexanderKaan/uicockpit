# System learnings — what an 11-component best-practice sweep taught us

> Synthesised 2026-06-30 from the per-component audits in this folder (table ·
> data-table · calendar · button · card · badge-chip · select-menu · list ·
> dialog-overlay · navigation · form-input). These are the **cross-cutting** findings
> — patterns that recur across ≥2 unrelated idioms. They matter more than any single
> gap, because the goal isn't "fix this component," it's **"make the system such that
> a user's unknown component is beautiful by default."** A gap that shows up once is a
> chore; a gap that shows up in five idioms is a hole in the grammar.

## The scoreboard (where the kit already stands)

| Component | PASS | PARTIAL | GAP | Verdict |
|---|---|---|---|---|
| form-input | 40 | 2 | 2 | exceptional |
| select-menu | 27 | 4 | 2 | strong |
| button | 23 | 2 | 0 | near-saturated |
| card | 22 | 3 | 1 | strong |
| navigation | 18 | 4 | 1 | strong |
| dialog-overlay | 18 | 6 | 2 | look-layer strong, behaviour delegated |
| badge-chip | 17 | 2 | 1 | strong |
| list | 16 | 2 | 2 | strong, but a tier behind its siblings |
| (table/data-table/calendar — batch 1/2 cashed) | — | — | — | event-layer + frozen-col landed |

The atoms are mature. **Almost every remaining gap is one of six systemic patterns**,
not a component-specific miss. That is the good news: six fixes, applied as grammar,
close most of the long tail — and inoculate components we haven't built yet.

---

## L1 — The four perceptual/state invariants are applied ad-hoc, 15–70%. (THE finding.)

This is the Invariant-Engine thesis, now confirmed empirically across the sweep. Four
guarantees that should be *universal* are re-implemented (or forgotten) per recipe:

- **Selected-edge (I2)** — the single most-repeated gap. Fill-only / absent on:
  `.chip--on`, `.list__item` selected, and **all three** nav active-states
  (`.navsuite__item--on`, `.navrow--on`, `.navmenu__item--on`), plus table rows
  (deferred in batch 2). The `--k-selected-edge` token EXISTS and cards/menu use it —
  it just isn't carried to the row/chip/nav family. Five idioms, one missing line each.
- **Focus-ring (I3)** — `.list__item` is a focusable `<button>` but is **not** in the
  globalLayer inset-ring group (its sibling `.list__row` is), so it gets the +2px
  *outset* ring that bleeds across the hairline divider. Group membership is hand-maintained.
- **Hit-target (I4)** — list rows and the number-stepper chevron lack the 24px floor
  that `.tbl` got in batch 2. It's a per-component afterthought, not a shared row guarantee.
- **Height (I1)** — the STRONG one: button · input · select-trigger all resolve to the
  shared `--k-control-h-*` ladder. **This is the model.** It's uniform because it was
  centralised into tokens early; the other three lag precisely because they never were.

**Learning:** the state/perceptual layer must be *uniform primitives applied by one
mechanism and enforced by a ratchet*, not copied per recipe. Height proves the model
works. **Action:** (a) define a shared interactive-row base (`is-selected`/`[aria-selected]`
→ `--k-selected-edge`; focusable → inset ring; interactive → `min-block-size:--k-hit-min`)
that chip/list/nav/table opt into; (b) extend `audit:state-edge` + `audit:focus` to flag
*every* `*--on`/`[aria-selected]`/focusable atom that lacks the edge/ring, so a new
component can't regress. **An unknown component that uses `--on` or `[aria-selected]`
should get the selected-edge for free, by inheritance — not by the author remembering.**

## L2 — Truncation is a universal need with no universal primitive.

Surfaced as a gap on table cells, card titles, and badges; list already hand-rolls it.
Each audit independently proposed a bespoke `.x--truncate` + `--k-x-max`. **Learning:**
ship ONE truncation utility (we lifted `.truncate` to the `.tbl` atom in batch 1 — pull
it up further to a global utility) + one `--k-*-max` convention, so any text-bearing
slot in any component (including unknown ones) can clamp consistently instead of
re-rolling `overflow/ellipsis/nowrap` five times.

## L3 — Overlay surfaces must constrain-to-viewport + scroll — applied inconsistently.

`.combobox__pop` correctly caps at 200px + `overflow-y:auto`; `.menu` and `.cmdp` cap
nothing (a 20+ item list runs off-screen — APG/Radix table-stakes); `.dialog` has no
`__body{overflow:auto;min-height:0}` so a tall dialog pushes its CTA off-screen, while
`.sheet` already has the anatomy. **Learning:** a shared overlay-scroll primitive + a
derived `--k-overlay-max` token that *every* floating surface (menu, command palette,
dialog body, popover) inherits. **An unknown overlay should be scroll-safe by default.**

## L4 — The kit ships the right primitives; the *reference usage* is the weak link.

The **Delegated?** column (the instrument fix from earlier) earned its keep in every
single audit — both rescuing real PASSes (keyboard nav, focus-trap, aria wiring live in
`AppHelpers.tsx`/markup) and exposing that the *exemplars* are inconsistent:
- card titles render on `<div>`, not `<h3>` → screen-reader heading-nav gets nothing;
- DialogCard/AlertDialogCard/SheetCard use plain `useState`, no `useModal` (no
  focus-trap/ESC/return) — while the lightbox does it right;
- the canonical Buttons demo's loading toggle omits `aria-busy`.

This matters disproportionately because **`get_design_context` teaches the agent from
the pack derived from these recipes + exemplars.** If the exemplar is sloppy, the agent
copies sloppy. **Learning, two parts:** (a) add *usage-lints* (title-is-heading,
`role=dialog`-has-`useModal`, icon-button-has-accessible-name); (b) make the SUPPLY
(`get_design_context`) emit the **behavioural contract** explicitly — "a dialog MUST
trap focus + return it", "a card title SHOULD be a heading" — so an agent building an
*unknown* component wires the behaviour instead of inferring it from a thin CSS dump.
This is the bridge to the `hypertoken`/A2UI thesis: the grammar must carry behaviour,
not just paint.

## L5 — Contrast-derived foreground (`aaInk`) is the strength to generalise.

The badge family's tone ladder derives its text colour (`aaInk(soft)`/`aaInk(main)` in
`buildTokens`) so **every** soft+solid pair holds AA in light *and* dark. This is the
single best answer to "any colour the user picks stays legible" — the core promise for
unknown components. **Learning:** make it a law, not a local habit — enforce "every
`*-soft` token must emit a paired contrast-derived `-soft-fg`" (ratchet), and route all
tint+ink pairs through the same derivation. **Then an unknown component that uses any
soft tint gets a legible foreground for free.**

## L6 — The demonstrated-axis (gallery) has holes — and the agent can't use what it can't see.

`badge--accent`/`badge--info`/solid siblings are defined but never demonstrated;
`.navsuite`/`.scaffold` have **no gallery card at all** (the morph shows only via the
PagesView workbench slider, which isn't scanned). The gallery is both the agent's source
of truth and the `audit:modifiers` demo surface — an undemonstrated variant is invisible
to the pack and to the audit. **Learning:** tighten demonstrated-axis coverage; a
variant that ships must be shown. (Minor sibling: recipe **comments drift** — form's
`.in` says 32/40/48 vs the real 32/36/40; list claims a `--k-row-h-lg` min-height the CSS
doesn't set. Comments may feed the pack, so stale comments mis-teach.)

---

## What this means for "the ultimate kit"

The sweep's real message: **the kit's atoms are done; the remaining quality lives in
three cross-cutting layers, and that's exactly where an unknown component succeeds or
fails.**

1. **A uniform interactive-state base (L1)** — selected-edge, focus-ring, hit-target,
   height as inherited guarantees, ratchet-enforced. *Highest leverage.*
2. **A behaviour-carrying SUPPLY (L4 + L3)** — `get_design_context` emits the
   behavioural + scroll/overflow contracts, not just classes; usage-lints keep the
   exemplars honest.
3. **Derivation-by-default for the variable axes (L5 + L2)** — contrast-derived ink for
   any tint, one truncation primitive for any text slot.

Each new LLM/run rediscovers the *same* handful of holes (selected-edge, overlay-scroll,
heading-emission) because they're grammar gaps, not knowledge gaps. Closing them as
**invariants + enforcement** is how the system stops re-learning the same lesson — and
how the next unknown component inherits the craft instead of gambling on the author.

## Ratchet candidates the audits surfaced (the ENFORCE rail)

- selected-edge present on every `*--on` / `[aria-selected]` (extend `audit:state-edge`)
- focusable atom ∈ the inset focus-ring group (extend `audit:focus`)
- interactive row carries `min-block-size:--k-hit-min`
- every floating surface has `max-height` + scrollable body
- every `*-soft` emits a paired contrast-derived `-soft-fg`
- every `role=dialog/alertdialog` exemplar carries a `useModal` ref; every `.btn--icon`
  an accessible name; every `.card__title`/`.dialog__title` is a heading element
- validation width guard `max(1px,--k-bw)` persists on `.is-error/.is-success/[aria-invalid]`
