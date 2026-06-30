# Button — best-practice library + compliance scan

> Component: `.btn` (+ `.btn--*`, `.btn-group`, `.segctrl`) · recipe `cockpit/src/kit/recipes/index.ts:205–504` (`'buttons'` 205–287, `'button-finish'` 288–504), `'button-group'` 722–750, `'segmented-control-toggle-group'` 3829–3895 · global layer `cockpit/src/kit/globalLayer.ts` (focus/disabled/touch) · tokens `cockpit/src/tokens/buildTokens.ts` (STATE_ALPHA/press, `--k-btn-h-default`, finish) · scanned 2026-06-30

---

## A. Best-practice library (supply)

Research-grounded from Apple HIG (Buttons), Material 3 (Common/FAB/Segmented), shadcn/ui
`button`, Radix Primitives, Carbon, Adobe Spectrum, Linear/Stripe/Vercel product UIs, and
WCAG 2.1/2.2 (1.4.3 contrast, 2.4.7 focus visible, 2.4.11/2.4.13 focus appearance,
2.5.5/2.5.8 target size, 4.1.2 name/role/value).

### Geometry & sizing
1. **One control-height vocabulary shared with inputs/selects.** *A button beside a field of the same tier must line up — height is a system invariant, not a per-screen hope.* `min-height: var(--k-btn-h, var(--k-btn-h-default, 36px))`; `--k-btn-h-default` + `--k-in-h-default` derive from one Scale (`st.btnH`/`st.inH`) in `buildTokens.ts`; `--k-control-h-sm/md/lg` is the shared ramp. **[LOAD-BEARING]**
2. **Height stays exact via min-height + flex centering, padding-block:0.** *Vertical padding + line-height drift make "36px" buttons render 34–40; collapsing the line-box (`line-height:1`) and zeroing padding-block pins it.* `padding-block: 0; line-height: 1`. **[LOAD-BEARING]**
3. **Horizontal padding scales with height AND radius (pill-aware).** *Apple/Material set side-padding ≈0.4×height; a pill (999px) radius eats horizontal room, so the label must clear the curve.* `padding-inline: max(14px, calc(--k-radius-md*0.75), calc(h*0.4), min(--btn-r*0.5, h*0.55))`. **[LOAD-BEARING]**
4. **Icon-only buttons are a perfect square, content-independent.** *A heart vs a chevron must not yield different aspect ratios; the box must not morph with glyph width.* `.btn--icon { width/height/min-width: var(--k-in-h-default); aspect-ratio: 1; padding: 0 }` + size re-assertions. **[LOAD-BEARING]**
5. **A full-width block variant for card/dialog footer CTAs.** *The dominant commit pattern (Save / Review order) fills its container, label centred.* `.btn--block { width: 100% }`. **[polish]**

### Variant ladder & emphasis
6. **One loud aimed accent per surface; everything else is quiet.** *"One primary per view" — exactly one control wears brand colour + elevation so the eye lands on THE action.* Only `.btn--primary`/`.btn--danger` carry `--k-primary` fill + resting `box-shadow` + hover lift; secondary/outline/ghost/link stay flat. **[LOAD-BEARING]**
7. **Secondary = flat neutral, not a second brand fill.** *shadcn's neutral secondary sits beside the primary without competing.* `.btn--secondary { background: --k-neutral; color: --k-neutral-fg }`, no shadow/lift. **[LOAD-BEARING]**
8. **Ghost = borderless text + hover wash (quietest); outline = bordered-quiet.** *Two distinct quiet tiers — ghost for toolbar/icon triggers, outline for "Cancel beside Save".* `.btn--ghost { background:transparent; border-color:transparent } :hover{--k-state-hover}`; `.btn--outline { --k-surface + --k-border + --k-shadow-xs }`. **[polish]**
9. **Ghost follows the field/box radius, not button-radius.** *A quiet toolbar control reads as a field, so "Button radius" shouldn't reshape it.* `--btn-r` override scoping (solid buttons use `--k-radius-button`). **[polish]**
10. **Link button = inline text affordance (underline, no padding/box).** *A "Learn more" should read as a link, not a chromeless button.* `.btn--link { text-decoration: underline; padding:0; border-radius:0; color: --k-primary }`. **[polish]**
11. **Destructive variant exists and reads as danger.** *Delete/Remove must look different from a neutral action.* `.btn--danger { background: --k-danger; color: --k-danger-fg }` (shares the loud tier with primary). **[LOAD-BEARING]**

### States (the four every button owes)
12. **Hover is a discrete, mode-correct step.** *Light: darken toward fg; dark: lighten — a flat brightness shift breaks in dark mode.* `--secondary:hover` color-mix toward `--k-fg`; `--primary:hover` → `--k-primary-hover`; ghost/outline → `--k-state-hover`. **[LOAD-BEARING]**
13. **Press/active gives tactile confirm (scale + state-layer darken).** *Material ~10-12% state layer + a squish makes the tap feel pressed, not just released.* `.btn:active{transform:scale(0.96)}`; loud tier adds `filter:brightness(0.94)` + shadow collapses to `--k-btn-shadow-press`; press tokens from `pressVars`/`statePress` (`STATE_ALPHA + 0.1`). **[LOAD-BEARING]**
14. **Keyboard focus shows a visible ring, keyboard-only.** *WCAG 2.4.7/2.4.11; mouse clicks shouldn't flash the ring.* `:focus-visible { outline: --k-focus-ring-width solid --k-ring; outline-offset: --k-focus-ring-offset(+2px) }`; container-bound buttons (btn-group segment) get inset `-2px`. **[LOAD-BEARING]**
15. **Disabled is unmistakable, non-interactive, and outranks the fill.** *A disabled primary must grey out — its own fill must not out-specify the disabled treatment.* global `:disabled:not(.toggle){ background/color !important; opacity; cursor:not-allowed; pointer-events:none }`. **[LOAD-BEARING]**
16. **Loading is width-locked with a spinner + a11y hooks.** *The button must not collapse when its label hides; SR users need `aria-busy`+`disabled`.* `.btn--loading { pointer-events:none } > *{opacity:0} ::after{ spinner in currentColor }`; usage pairs `aria-busy="true"`+`disabled`. **[LOAD-BEARING]**
17. **Toggle/selected state is driven by `aria-pressed`, with a container look.** *Selection wears a container; the a11y attribute is the source of truth (no class/aria desync).* `.btn--toggle[aria-pressed="true"]{ --k-secondary-soft + radius morph }`; segctrl uses `aria-checked`/`aria-selected` + `--k-selected-edge`. **[LOAD-BEARING]**

### Icon + label, content
18. **Icon↔label gap is a token; icons never shrink, render as flex item.** *Baseline-aligned inline SVG drifts a pixel; a fixed gap + `display:block` icon keeps optical centring.* `gap: var(--k-s-6)`; `.btn > svg { flex-shrink:0; display:block }`. **[LOAD-BEARING]**
19. **Default width = intrinsic (hugs content), not stretched.** *A button row should read as discrete actions, not full-width bars unless `--block`.* `display:inline-flex` (block is opt-in). **[polish]**

### Accessibility & touch
20. **Icon-only buttons carry an accessible name.** *No visible label → `aria-label` is mandatory (WCAG 4.1.2).* enforced in usage, not CSS (`aria-label` on every `.btn--icon`). **[LOAD-BEARING, delegated]**
21. **Touch targets reach 44px on coarse pointers without inflating desktop.** *WCAG 2.5.5/2.5.8; only fire on touch so dense desktop stays compact.* `@media (pointer:coarse){ .btn{min-height:--k-touch-target} .btn--icon{min-w/h:--k-touch-target} }`. **[LOAD-BEARING]**
22. **Motion respects `prefers-reduced-motion`.** *Spinner + spring must not assault motion-sensitive users.* global `@media (prefers-reduced-motion:reduce)` near-zeroes animation/transition; spinner via `--k-anim-spin` token. **[LOAD-BEARING]**
23. **`type="button"` on non-submit buttons.** *Prevents accidental form submission — a classic foot-gun.* delegated to usage (every gallery/app `<button type="button">`). **[polish, delegated]**

### Composition
24. **Button group fuses equal-weight actions with shared edges + per-segment focus.** *Split actions / segmented sets read as one control; hovered/focused segment lifts so its ring shows.* `.btn-group{inline-flex; align-items:stretch}`, `-1px` margin, outer corners `--btn-r`, `:hover/:focus-visible{z-index:1}`; `--connected` pebble variant. **[polish]**
25. **Stacked footer action buttons use the tight stack-gap, not field rhythm.** *shadcn: fields `space-y-4/6`, action buttons `gap-2` — actions cluster tighter than fields.* `.card > .btn--block + .btn--block { margin-top: calc(--k-stack-gap - --k-space) }`. **[polish]**

---

## B. Compliance scan (check)

| # | Rule | Status | Evidence (recipe line / usage / "absent") | Delegated? | Severity |
|---|---|---|---|---|---|
| 1 | Shared control-height vocab | ✅ PASS | recipe 221 `min-height: var(--k-btn-h, var(--k-btn-h-default,36px))`; tokens 1119–1131 `--k-btn-h-default`/`--k-control-h-*` | No | — |
| 2 | Exact height (padding-block:0, lh:1) | ✅ PASS | recipe 222 `padding-block:0`, 258 `line-height:1` | No | — |
| 3 | Pill-aware horizontal padding | ✅ PASS | recipe 241–249 `max(14px, …, min(--btn-r*0.5, h*0.55))`; sm/lg/xs/xl mirror it | No | — |
| 4 | Icon-only square | ✅ PASS | recipe 375–387 `.btn--icon { width/height/min-width:--k-in-h-default; aspect-ratio:1; padding:0 }` + sm/lg re-assert | No | — |
| 5 | Block variant | ✅ PASS | recipe 473 `.btn--block{width:100%}`; usage everywhere (e.g. gallery 4039, sections) | No | — |
| 6 | One aimed accent (loud primary/danger only) | ✅ PASS | recipe 305–324 shadow+lift+press scoped to `--primary,--danger`; quiet tiers flat | No | — |
| 7 | Secondary = flat neutral | ✅ PASS | recipe 332–340 `--k-neutral` fill, no shadow/lift | No | — |
| 8 | Ghost borderless / outline bordered | ✅ PASS | recipe 348–349 ghost; 356–357 outline `--k-shadow-xs` | No | — |
| 9 | Ghost follows box radius | ✅ PASS | recipe 240/341–348 `--btn-r` scoping comment + ghost transparent border | No | — |
| 10 | Link variant | ✅ PASS | recipe 358–366, 469 `border-radius:0` | No | — |
| 11 | Destructive variant | ✅ PASS | recipe 350 `.btn--danger`; gallery 2357, 389; sections `btn--danger` | No | — |
| 12 | Mode-correct hover step | ✅ PASS | recipe 326/339/349/357 hovers via color-mix / `--k-primary-hover` / `--k-state-hover` | No | — |
| 13 | Tactile press (scale + state layer) | ✅ PASS | recipe 276–278 `:active scale(0.96)`; 320–324 loud-tier `brightness(0.94)`+shadow-press; tokens 632–633 `statePress` | No | — |
| 14 | Visible keyboard-only focus ring | ✅ PASS | globalLayer 167–170 `:focus-visible outline`; 177–199 inset `-2px` for btn-group segment etc.; tokens 947–951/1264–1265 `--k-ring-w`/offset/width | No | — |
| 15 | Disabled outranks fill, non-interactive | ✅ PASS | globalLayer 141–147 `:disabled !important + pointer-events:none`; usage gallery 2385–2386, 1760 | No | — |
| 16 | Loading width-locked + spinner | ✅ PASS | recipe 480–494; usage gallery 2384 (`<span>` wrap), 1760/4082 add `aria-busy` | Partial (a11y) | — |
| 17 | Toggle/selected via aria-pressed | ✅ PASS | recipe 402–412 `[aria-pressed="true"]`; gallery 2379/2430 + sections `btn--on` | No | — |
| 18 | Icon↔label gap token; icon no-shrink | ✅ PASS | recipe 216 `gap:--k-s-6`; 283–286 `.btn > svg{flex-shrink:0;display:block}` | No | — |
| 19 | Intrinsic default width | ✅ PASS | recipe 213 `display:inline-flex`; block is opt-in | No | — |
| 20 | Icon-only accessible name | ✅ PASS | gallery 2369/2372/2376 etc. + sections (`aria-label` on every `.btn--icon`, 31× in sections) | **Yes (usage)** | — |
| 21 | 44px touch target on coarse pointer | ✅ PASS | globalLayer 297–305 `@media(pointer:coarse)` `.btn`/`.btn--icon`→`--k-touch-target`; token 1144 `44px` | No | — |
| 22 | Reduced-motion respected | ✅ PASS | globalLayer 125–132; spinner via `--k-anim-spin` token (1298) | No | — |
| 23 | `type="button"` on non-submit | ✅ PASS | gallery + sections use `<button type="button">` throughout | **Yes (usage)** | — |
| 24 | Button group fuse + per-segment focus | ✅ PASS | recipe 728–749 + `--connected`; gallery 2408–2433 (view switch, split, connected toggles) | No | — |
| 25 | Stacked-footer tight gap | ✅ PASS | recipe 499–503 `margin-top: calc(--k-stack-gap - --k-space)` | No | — |
| — | **Loading demo sets `aria-busy`+`disabled` while busy** | ⚠️ PARTIAL | canonical Buttons demo gallery 2384 toggles only `btn--loading`, no `aria-busy`/`disabled` during the busy window (other demos at 1760/4082 do it correctly) | No | LOW |
| — | **Icon-only `--k-icon-md` sizing on `.btn > svg`** | ⚠️ PARTIAL | recipe 283–286 guards shrink/display but does not pin icon size to `--k-icon-md`; relies on Lucide's intrinsic 1em/size prop | Partial | LOW |

---

## C. Gap worklist (ranked)

The button recipe is in very strong shape — **0 ❌ GAPs, 2 ⚠️ PARTIAL (both LOW)**. The two
nits are demo/polish, not recipe holes:

1. **(LOW) Canonical loading demo a11y.** The headline Buttons card's loading toggle (`ComponentGallery.tsx:2384`) only adds `btn--loading`; it should also set `aria-busy={loading}` and `disabled={loading}` so the *exemplar* models the full a11y contract the recipe comment prescribes (lines 478–479). Fix: `className={...} aria-busy={loading} disabled={loading}`. Pure usage edit; the other two loading usages already do this.
2. **(LOW, optional) Pin in-button icon size to the icon scale.** `.btn > svg` guards `flex-shrink`/`display` but not size — a consumer passing a raw SVG without a `width` could render an off-scale glyph. Optional hardening: `.btn > svg { width: var(--k-icon-md); height: var(--k-icon-md) }` (token already exists per craft-sweep C2). Today it's effectively delegated to Lucide's size prop, so not a real defect — flag only if the kit wants to stop depending on the icon lib's defaults.

No recipe CSS changes are *required* to ship.

---

## D. Loop notes (meta)

- **Research half: easy.** Button is the most-documented atom in the field (HIG/M3/shadcn/Radix/WCAG all converge), so the 25-rule library compiled fast and with high agreement. The kit's own `--k-*` vocabulary maps cleanly onto every rule.
- **Scan verdict: already strong — near-saturation.** 23/25 PASS, 2 LOW partials. The recipe already encodes the hardest invariants (shared height vocab, pill-aware padding, aimed-accent emphasis, icon-square geometry, the four states, reduced-motion, coarse-pointer 44px). This is a mature recipe, not a draft.
- **FALSE-POSITIVE risk avoided by the mandatory usage read (×2).** A CSS-only scan would have flagged **icon-only accessible name** and **`type="button"`** as GAPs — both are *delegated to usage* and present (31 `aria-label`s in sections.tsx, `aria-label` on every `.btn--icon` in the gallery; `<button type="button">` throughout). Carrying the **Delegated?** column turned two phantom HIGH gaps into PASS. Loading-state a11y is the inverse: the *primitive* and two usages are correct, only the headline *demo* under-models it.
- **Format verdict: split (matches table/calendar/data-table).** Section A (the 25-rule library) is durable knowledge → belongs in `get_design_context` / the skill doc. Section B/C is a point-in-time scan → re-run on recipe change (this one will stay green for a while).
- **Mechanizable into `audit:craft` (ENFORCE rail):** the LOAD-BEARING structural rows are good ratchet candidates — (R2) every `.btn*` size variant must keep `padding-block:0` + `line-height:1`; (R4) `.btn--icon` must keep `aspect-ratio:1` + equal width/height/min-width; (R13) if a loud variant exists it must define `:active`; (R16) `.btn--loading` must keep the width-lock (`> *{opacity:0}` not `display:none`). A usage-level lint "every `.btn--icon` carries `aria-label`/`aria-labelledby`" would promote R20 from delegated-hope to enforced.
