# Form & input — best-practice library + compliance scan

> Component: `.in` / `.field` / `.lab` (+ wrapper fields `.numinput` · `.pwinput` · `.searchinput` · `.phoneinput` · `.otp__slot` · `.select-trigger`, block `.formpanel`) · recipe `cockpit/src/kit/recipes/index.ts:777–1107` (form), `1967–2035` (select-trigger), `4022–4063` (input-otp), `4548–4641` (form-primitives), `4644–4720` (numberinput), `4723–4778` (passwordinput), `4781–4876` (searchinput), `4879–4902` (phoneinput), `5535–5612` (form-panel); validation in `cockpit/src/kit/globalLayer.ts:201–316` · scanned 2026-06-30

Scope note: this audits the **interaction-field core** as a family — the bare `.in`/`.tx`
text field, the `.field` full-row contract (label · required · hint · error), the
`.lab` lightweight label-over-control, the five **wrapper fields** (number / password /
search / phone, plus the OTP slot and custom select-trigger), and the `.formpanel` BLOCK
that composes them. The **height invariant** (`--k-in-h-default`, with `btnH == inH` per
Scale tier) is the spine that keeps every field type the same height; the **focus ring**
(`--k-ring` border + `--k-ring-halo` halo at `--k-ring-w`) and the **validation layer**
(`globalLayer.ts`) are cross-cutting and shared by all field shapes, so they're audited
once here rather than per-shape. Where a rule is the `.formpanel` block's job or is
delegated to authoring/JS (caps-lock detection, debounced validation), the scan says so.

Grounding: Linear / Stripe / Notion fields, shadcn/ui (Input · Form · FormMessage),
Apple HIG text fields, Material 3 text fields, Carbon, Adobe Spectrum, plus NN/g
(placeholders-are-harmful, error-message guidelines, required-field marking), Baymard
input-field recommendations, and W3C/WAI accessible-forms checks. Severities align to the
10 craft laws in `COMPONENT-CRAFT.md` and the Invariant Engine (I1 height · I3 focus · I4
hit-target).

---

## A. Best-practice library (supply)

### Height, density & alignment
1. **One field height, token-driven, equal to the button height per density tier.** [LOAD-BEARING] — a select beside a search field beside a button must share one baseline or the row reads broken (craft L3, Invariant I1). `min-height: var(--k-in-h-default, 40px)` on `.in` / wrapper fields / `.select-trigger` / OTP, with `inH == btnH` in the Scale table.
2. **Horizontal padding has a floor AND is radius-aware** so a pill-radius field still clears the curve. [LOAD-BEARING] — text glued to a rounded edge reads cramped. `padding-inline: max(var(--k-s-12), calc(var(--k-radius-md) * 0.6))`.
3. **Wrapper-field inner `<input>` stretches to the wrapper height (no double padding-block).** [LOAD-BEARING] — a line-height-tight inner box + `overflow:clip` shaves the caret (the "short caret" bug). `align-self: stretch` on `.numinput__field` etc.
4. **Textarea aligns its first line to where a single-line input's baseline sits** + explicit line-height. [LOAD-BEARING] — a textarea whose text is glued to the top breaks the form column's rhythm. `.tx { padding-block: var(--k-s-12); line-height: 1.5 }`.
5. **Numeric fields use tabular figures** so digits don't jitter the caret/column. [polish] — `.numinput__field { font-variant-numeric: tabular-nums }`, ditto `.phoneinput__code`.

### Surface, border & the three field looks
6. **One surface signature across every field type** (the brand-tinted recessed fill) so plain input, select, tag-input and OTP read as one family. [LOAD-BEARING] — mismatched fills make a form look assembled from parts. `background: var(--k-field-bg)` (= `--k-input-bg`) on `.in` / wrappers / `.select-trigger` / OTP.
7. **Outlined / Filled / Plain are ONE rule, three tokens** — border on all sides via `--k-field-border-color`, bottom overridden to `--k-field-underline-color`, radius `0` in Plain. [LOAD-BEARING] — three field looks from one recipe, no duplicated CSS. Driven by `--k-field-*` in `buildTokens.ts`.
8. **Input border is floored to ≥3:1 WCAG contrast** (distinct from the decorative `--k-border`). [LOAD-BEARING] — a field edge must be perceivable to pass 1.4.11 non-text contrast. `--k-input-border` floored in `buildTokens.ts`; `--k-bw` tokenizes width.
9. **Flat by default; emphasis lives in the focus halo, not a resting inner shadow.** [polish] — a default inset shadow competes with body text (shadcn pattern). `box-shadow: none` on `.in`.

### Affordance & state completeness (craft L6)
10. **Hover darkens the edge (box modes) or just the underline (Plain), suppressed under focus.** [LOAD-BEARING] — hover confirms the field is interactive without fighting focus. `.in:hover:not(:focus):not(:disabled) { border-color: var(--k-field-hover-edge) }`.
11. **Focus = border + halo SAME hue, different alphas → one coherent ring** (not "neutral border + stray brand halo"). [LOAD-BEARING] — the shadcn unified-ring signature; mismatched hues read as two rings (craft L6, Invariant I3). `.in:focus,.in:focus-within { border-color: var(--k-ring); box-shadow: 0 0 0 var(--k-ring-w) var(--k-ring-halo) }`.
12. **The field's own border+halo is the SINGLE focus source — the global solid `:focus-visible` outline is suppressed** on every field shape. [LOAD-BEARING] — otherwise keyboard focus paints a second ring on top (the "binnenring" / double-ring bug). Higher-specificity `.cockpit-preview .in:focus-visible{outline:transparent}` + per-wrapper-child suppression.
13. **`:focus-within` so wrapper fields (icon + inner input) get the same ring as a bare input.** [LOAD-BEARING] — focus must look identical across all field shapes. Selector lists both `:focus` and `:focus-within`.
14. **Placeholder is a DESIGNED state (faint tier, `opacity:1`), not the browser default**, and is supplementary — never a substitute for a label. [LOAD-BEARING] — NN/g: placeholder-as-label is harmful (disappears on type, fails low-vision). `::placeholder { color: var(--k-fg-muted); opacity: 1 }` for every field incl. wrapper inputs.
15. **Disabled = opacity + not-allowed + no pointer-events + sunken bg + muted ink**, applied to bare `.in` AND wrapper fields (`:has(:disabled)` / `[aria-disabled]`). [LOAD-BEARING] — disabled must read unmistakably and be non-interactive (craft L6). `.in:disabled` rule + the `globalLayer` composed-field disabled rule.
16. **Read-only is DISTINCT from disabled** — still focusable + selectable, drops the input well, mutes ink, default cursor. [LOAD-BEARING] — a display value must not look like a dead input; conflating them is a real defect. `input.in[readonly] { background: var(--k-surface); color: var(--k-fg-muted); cursor: default }`.
17. **Loading state for async fields** (search): a spinner replaces the leading icon. [polish] — async search must show it's working. `.searchinput > .spinner` documented.

### Validation (the form-validation contract)
18. **Three validation states (error / success / warning) each own ONE coherent ring** — border + halo share the state hue. [LOAD-BEARING] — NN/g: errors must be visible and unambiguous; matched hue keeps the shadcn ring language per state. `globalLayer` `.in.is-error/.is-success/.is-warning` + `[aria-invalid]` + `--invalid` wrapper modifiers.
19. **Validation borders stay ≥1px even when Borders is Off** (`--k-bw: 0`). [LOAD-BEARING] — semantic feedback must never vanish to a foundation knob. `border-width: max(1px, var(--k-bw)); border-style: solid` on all state selectors.
20. **Validation reaches every field shape**, not just bare `.in` — `--invalid` modifiers for phone/number/password/search, `[aria-invalid]` for OTP and select. [LOAD-BEARING] — a form mixes field types; error language must be uniform. State selectors enumerate all wrappers; `.select-trigger.is-error`, `.otp__slot[aria-invalid]`.
21. **The error MESSAGE is an inline element below the field, danger-toned, wired to the control** via `aria-describedby` + `aria-invalid` (NN/g: explicit, near the field; W3C: programmatic). [LOAD-BEARING] — colour alone fails colour-blind users; the message must be associated. `.field__error` (icon + caption, `--k-danger`); a11y wiring is the `.field` contract + authoring.
22. **Hint / help text is a quieter tier, separate from the error.** [LOAD-BEARING] — guidance ("3–20 characters") must not look like an error. `.field__hint { font-size: var(--k-type-caption); color: var(--k-fg-muted) }`.
23. **Form-level validation summary** (block): an alert band at the top of the panel when submit fails, in the danger-soft tone matching `.alert`. [polish] — a long form needs a submit-time summary, not just per-field marks. `.formpanel__error` (role="alert").

### Labels, required/optional & the field contract
24. **Label is always visible, sits above the control, inherits UI weight + label-case tokens.** [LOAD-BEARING] — NN/g/Baymard: a persistent visible label beats placeholder-as-label. `.lab > span:first-child` (eyebrow, `--k-ui-weight`, `--k-label-transform`, `--k-label-tracking`); `.field__label` (medium weight, inline-flex for the marker).
25. **Required marker is a danger-toned asterisk after the label**, with an accessible-contrast colour (not pale grey). [LOAD-BEARING] — NN/g + W3C: mark required visibly AND programmatically (`required`/`aria-required`); avoid low-contrast asterisks. `.field__req { color: var(--k-danger) }`; the `*` sits in `.field__label`.
26. **One canonical full-row contract** (`.field`) collapsing label + required + control + hint + error, a11y-wired — shadcn's FormItem/FormLabel/FormDescription/FormMessage in one primitive. [LOAD-BEARING] — without it, every screen hand-rolls a11y wiring and drifts. `.field` + `.field__label/__req/__hint/__error`.
27. **Optional-field marking** ("(optional)") for predominantly-required forms. [polish] — Baymard: marking optional removes ambiguity when most fields are required. No dedicated `(optional)`/`.field__opt` utility today (author appends text).

### Checkbox / radio / OTP / steppers (custom controls)
28. **Custom checkbox/radio draw their own box** (`appearance:none`) matching the field border + primary checked state. [LOAD-BEARING] — native controls don't theme; consistency demands a drawn box (craft L6). `.check input[type=checkbox]` / `.radio input[type=radio]` 16px, `--k-input-border`, `--k-primary` checked.
29. **Checkbox is a slightly-rounded square (capped 4px), radio is a circle** — never confusable. [LOAD-BEARING] — shape carries the single-vs-multi affordance; a near-circular checkbox reads as a radio. `border-radius: min(var(--k-radius-sm), 4px)` vs `50%`.
30. **Indeterminate ("some selected") state** — filled with a dash, the select-all glyph. [LOAD-BEARING] — table select-all needs the third tri-state (craft L6). `.check input:indeterminate::after` dash.
31. **The checkmark is OUT of flow (absolute)** so checking doesn't shift the box baseline (no jump). [polish] — an in-flow tick nudges the box ~1.5px on check. `position:absolute` + translate.
32. **Checkbox/radio focus = soft ring, not the field halo;** disabled keeps the checked glyph ("locked on"). [LOAD-BEARING] — focus visibility on the small box (craft L6 / WCAG 2.4.7). `:focus-visible { outline: 2px solid var(--k-ring-soft) }`; `input:disabled { opacity; cursor }`.
33. **OTP slots are real per-slot inputs, monospace, generous height, with their own focus ring + error state.** [LOAD-BEARING] — 2FA code entry is its own pattern (paste, advance-on-type); digits must read clearly. `.otp__slot` (mono, `--k-control-h-lg`, `:focus` halo, `[aria-invalid]` border).
34. **Number stepper buttons are real, hit-targeted, with hover/active feedback** and suppressed inner focus (the wrapper owns the ring). [polish] — steppers must feel tactile and not double-ring. `.numinput__step/__chev` hover/active, focus suppressed.

### Add-ons, affixes & inset labels (input groups)
35. **Fused add-on segment** (`https://` prefix, `.com` suffix) — shared edges, the focused input lifts above neighbours. [polish] — the Tailwind/Stripe segmented-field idiom. `.in-group` (negative-margin fused borders, `z-index:1` on focus).
36. **Inline affix unit inside the field** (`$ … USD`) as a muted, non-selectable span. [polish] — units belong inside the well, quietly. `.in__affix { color: var(--k-fg-muted); user-select: none }`.
37. **Inset label and overlapping-label variants** for compact/floating-label looks. [polish] — space-saving label patterns. `.in--inset` (label-over-input in one box) · `.in-field`/`.in__overlap` (label straddling the top border).

### Touch / mobile a11y
38. **Coarse-pointer touch-target floor (44px)** on fields/controls, without inflating dense desktop. [LOAD-BEARING] — WCAG 2.5.5/2.5.8; fine-pointer layouts keep density. `@media (pointer: coarse) { .in, .select-trigger, … { min-height: var(--k-touch-target) } }`.
39. **iOS-zoom guard — floor focused field text to 16px on coarse pointers.** [LOAD-BEARING] — Mobile Safari zooms (and won't zoom back) when a focused field's text is < 16px; the kit's `--k-type-small` is ~12–13px. `font-size: max(var(--k-type-small), var(--k-type-input-min))` for every field incl. wrapper/select/OTP.

### Block layout (formpanel)
40. **Responsive 2-up field grid that collapses to one column** via `auto-fit minmax`, with a `--full` span opt-out. [LOAD-BEARING] — real forms need a field grid, not a loose stack. `.formpanel__grid` + `.formpanel__full`.
41. **Container-query footer stack** so the primary action stays thumb-reachable on a narrow panel. [polish] — responds to the panel's own width, not the viewport. `@container formpanel (max-width:380px) { __foot stacks }`.
42. **Titled sub-sections + labels-on-left variant** so a long form reads as groups, with a dense settings layout option. [polish] — sectioning + the Tailwind labels-left layout. `.formpanel__section`/`__section-title`; `.formpanel--horizontal` (label column, `--k-form-label-w`).

### Field hardening (autofill, content-truth)
43. **Browser-autofill restyle** so a Chrome-autofilled field keeps the kit surface/ink instead of the yellow native fill. [polish] — autofill yellow breaks the field family + can fail contrast in dark mode. No `:-webkit-autofill` / `:autofill` restyle in the kit today (see C). (NB: a focused field that looks rounder than siblings + a suggestion popup is autofill, not the recipe — see `trap-focus-radius-is-browser-autofill`.)
44. **Content truth: survives long values, zero, RTL/overflow (craft L9).** [polish] — `text-rendering: geometricPrecision` stabilises text across focus; tabular-nums handles 0; long single-line overflow in a bare `.in` is browser-default (scrolls) — acceptable for a single-line field.

---

## B. Compliance scan (check)

| # | Rule | Status | Evidence (recipe line/snippet, OR usage file, OR "absent") | Delegated? | Severity |
|---|------|--------|------------------------------------------------------------|-----------|----------|
| 1 | One field height = button height per tier | ✅ PASS | `min-height: var(--k-in-h-default,40px)` on `.in` (786), wrappers (4562), `.select-trigger` (1977), OTP via `--k-control-h-lg`; `inH==btnH` in SCALE (buildTokens 90–92) | — | — |
| 2 | Radius-aware padding floor | ✅ PASS | `padding-inline: max(var(--k-s-12), calc(var(--k-radius-md)*0.6))` (790, 4620, 1979) | — | — |
| 3 | Inner input stretches (no caret clip) | ✅ PASS | `align-self: stretch` on `.numinput__field` etc (4610) + `.in--inline input` (922) | — | — |
| 4 | Textarea baseline + line-height | ✅ PASS | `.tx { padding-block: var(--k-s-12); line-height: 1.5 }` (939–944) | — | — |
| 5 | Tabular numeric fields | ✅ PASS | `.numinput__field { font-variant-numeric: tabular-nums }` (4648); `.phoneinput__code` (4899) | — | — |
| 6 | One surface signature across field types | ✅ PASS | `background: var(--k-field-bg)` on `.in` (820), wrappers (4566), select (1983), OTP (4043) — all = `--k-input-bg` | — | — |
| 7 | Outlined/Filled/Plain = one rule, three tokens | ✅ PASS | `--k-field-border-color` + `border-bottom-color:--k-field-underline-color` + `--k-field-radius` (798–801); driven in buildTokens (815–825) | — | — |
| 8 | Input border ≥3:1 WCAG + tokenized width | ✅ PASS | `--k-input-border` floored (buildTokens 745, 936); `--k-bw` width (800) | — | — |
| 9 | Flat default, emphasis in halo | ✅ PASS | `box-shadow: none` (824) | — | — |
| 10 | Hover edge / underline, suppressed under focus | ✅ PASS | `.in:hover:not(:focus):not(:disabled)` → `--k-field-hover-edge` (832); wrappers `:hover:not(:focus-within)` (4580) | — | — |
| 11 | Focus = same-hue border + halo (one ring) | ✅ PASS | `border-color:--k-ring; box-shadow:0 0 0 --k-ring-w --k-ring-halo` (883–885, 4597–4598); halo = primary @28% (buildTokens 946) | — | — |
| 12 | Field ring is the SINGLE focus source (no double ring) | ✅ PASS | `.cockpit-preview .in:focus-visible{outline:transparent}` (899–907) + wrapper-child suppression (4628–4640) | — | — |
| 13 | `:focus-within` so wrappers match bare input | ✅ PASS | `.in:focus, .in:focus-within` (871–872); wrappers `:focus-within` (4586) | — | — |
| 14 | Placeholder designed (faint, opacity:1), not a label | ✅ PASS | `globalLayer` `::placeholder { color:--k-fg-muted; opacity:1 }` for `.in/.tx/.searchinput/.numinput/.pwinput __field` (204–211); usage uses real labels (gallery 582–595, 1430) | — | — |
| 15 | Disabled (bare + wrapper) | ✅ PASS | `.in:disabled,[aria-disabled]` (836–843); `globalLayer` composed-field disabled `:has(:disabled)`/`[aria-disabled]` (276–285) | — | — |
| 16 | Read-only distinct from disabled | ✅ PASS | `input.in[readonly],textarea.in[readonly]` → surface bg, muted, default cursor (850–856); demoed gallery 1758 | — | — |
| 17 | Async loading (search spinner) | ✅ PASS | `.searchinput > .spinner { flex:none }` (4804) + comment; gallery search loading slot | Delegated to usage | — |
| 18 | Three validation states, coherent ring each | ✅ PASS | `globalLayer` 217–260: error/success/warning border + matched halo at `--k-ring-w` | — | — |
| 19 | Validation border survives Borders Off | ✅ PASS | `border-width: max(1px, var(--k-bw)); border-style: solid` (229–239) | — | — |
| 20 | Validation across ALL field shapes | ✅ PASS | `--invalid` for phone/number/password/search (217–223); `.select-trigger.is-error/[aria-invalid]` (1997–2001); `.otp__slot[aria-invalid]` (4057) | — | — |
| 21 | Error message inline + a11y-wired | ✅ PASS | `.field__error` (974); wiring `aria-invalid`+`aria-describedby` in gallery (1434–1435, 1748–1749) | Delegated (a11y attrs in usage) | — |
| 22 | Hint tier separate from error | ✅ PASS | `.field__hint` caption + muted (971); demoed gallery 1753–1754 | — | — |
| 23 | Form-level validation summary | ✅ PASS | `.formpanel__error` danger-soft `role="alert"` (5584); gallery 1424 | — | — |
| 24 | Label always-visible, above, tokenized case/weight | ✅ PASS | `.lab>span:first-child` (952–959); `.field__label` (968) | — | — |
| 25 | Required marker = danger asterisk, accessible colour | ✅ PASS | `.field__req { color: var(--k-danger) }` (970); usage `*` in `.field__label` (gallery 1433, 1747) | — | — |
| 26 | One full-row `.field` contract | ✅ PASS | `.field`/`__label`/`__req`/`__hint`/`__error` (960–974); used gallery 1432, 1746 | — | — |
| 27 | Optional-field marking utility | ❌ GAP | absent — no `.field__opt` / "(optional)" treatment; required is covered (#25) but the "mark optional when mostly-required" Baymard pattern has no kit affordance | Author can append text | LOW |
| 28 | Custom checkbox/radio matching field border + checked | ✅ PASS | `appearance:none`, 16px, `--k-input-border`, `--k-primary` (986–1017, 1057–1069) | — | — |
| 29 | Checkbox rounded-square ≠ radio circle | ✅ PASS | `min(var(--k-radius-sm),4px)` vs `50%` (1005–1006) | — | — |
| 30 | Indeterminate tri-state | ✅ PASS | `.check input:indeterminate::after` dash (1036–1049); driven in gallery via `el.indeterminate` (1338) | — | — |
| 31 | Checkmark out-of-flow (no jump) | ✅ PASS | `position:absolute` + translate (1018–1032) | — | — |
| 32 | Checkbox/radio focus ring + disabled-keeps-glyph | ✅ PASS | `:focus-visible { outline: 2px solid var(--k-ring-soft) }` (1009–1013); `input:disabled` (1052–1056) | — | — |
| 33 | OTP slots: mono, tall, focus + error | ✅ PASS | `.otp__slot` mono `--k-control-h-lg`, `:focus` halo (4049), `[aria-invalid]` (4057); gallery 3821 | — | — |
| 34 | Number steppers tactile, hit-targeted | ⚠️ PARTIAL | `.numinput__step`/`__chev` hover/active + focus-suppressed (4672–4719); but step width `--k-in-h-default` is a comfortable target, while `__chev { width:24px }` (4689) can fall under 24px hit-min at Compact; no `--k-hit-min` guard | — | LOW |
| 35 | Fused add-on segment | ✅ PASS | `.in-group` negative-margin fused, focus `z-index:1` (1081–1094); gallery 3331 | — | — |
| 36 | Inline affix unit | ✅ PASS | `.in__affix` muted + `user-select:none` (1095); gallery 3340 | — | — |
| 37 | Inset / overlapping label | ✅ PASS | `.in--inset` (1096–1101) · `.in-field`/`.in__overlap` (1102–1107); gallery 3345–3350 | — | — |
| 38 | Coarse-pointer 44px touch floor | ✅ PASS | `@media (pointer:coarse)` `.in/.select-trigger/.phoneinput__country { min-height: --k-touch-target }` (297–305) | — | — |
| 39 | iOS-zoom guard (16px field text) | ✅ PASS | `font-size: max(--k-type-small, --k-type-input-min)` for every field incl. wrappers/select/OTP (311–315) | — | — |
| 40 | Responsive field grid + full-span opt-out | ✅ PASS | `.formpanel__grid` auto-fit minmax + `.formpanel__full` (5574–5575) | — | — |
| 41 | Container-query footer stack | ✅ PASS | `@container formpanel (max-width:380px)` foot stacks (5561–5565) | — | — |
| 42 | Sub-sections + labels-on-left | ✅ PASS | `.formpanel__section`/`__section-title` (5579–5580); `.formpanel--horizontal` label column (5598–5611) | — | — |
| 43 | Browser-autofill restyle | ❌ GAP | absent — no `:-webkit-autofill`/`:autofill` rule; a Chrome-autofilled field shows the native yellow fill (or wrong ink in dark mode), breaking the field family + risking contrast | — | MED |
| 44 | Content truth (long/zero/overflow stable text) | ⚠️ PARTIAL | `text-rendering: geometricPrecision` stabilises focus re-render (809); tabular-nums handles 0; long single-line value uses browser-default scroll (acceptable); no explicit guard | — | LOW |

**Tally: 40 PASS · 2 PARTIAL · 2 GAP** (44 rules).

---

## C. Gap worklist (ranked)

Ranked by severity, then by how cheaply one edit closes it.

**MED**
1. **#43 — no browser-autofill restyle (the one real visual gap).** A Chrome-autofilled email/password field shows the native yellow `-webkit-autofill` fill — it overrides `--k-field-bg`, breaks the one-family surface, and in dark mode can drop the text to near-invisible (contrast fail). Add to `globalLayer` (so it covers every field shape) an autofill rule keyed to the kit tokens:
   ```css
   ${s}.in:-webkit-autofill, ${s}.in:-webkit-autofill:focus,
   ${s}.numinput__field:-webkit-autofill, ${s}.pwinput__field:-webkit-autofill,
   ${s}.searchinput__field:-webkit-autofill, ${s}.phoneinput__field:-webkit-autofill {
     -webkit-text-fill-color: var(--k-fg);
     -webkit-box-shadow: 0 0 0 100px var(--k-field-bg) inset;  /* repaint the well */
     caret-color: var(--k-fg);
     transition: background-color 9999s;  /* defeat the yellow-fade */
   }
   ```
   (Cross-check the focus-radius trap before shipping — autofill also rounds the field; this rule + the existing focus rule should keep it square.)

**LOW**
2. **#27 — optional-field marker utility.** For predominantly-required forms (Baymard), add the inverse of `.field__req`: a muted `(optional)` chip. One line: `.field__opt { color: var(--k-fg-muted); font-weight: var(--k-weight-regular); font-size: var(--k-type-caption) }` + a gallery demo, so screens stop hand-rolling "(optional)" inline text inconsistently.
3. **#34 — stepper chevron hit-target at Compact.** `.numinput__chev { width: 24px }` plus a thin flex height can fall under the 24px AA floor at the Compact tier (Invariant I4). Floor it: `min-width: var(--k-hit-min); min-height: var(--k-hit-min)` (or rely on the coarse-pointer 44px floor, which currently does NOT list `.numinput__chev`/`__step` — adding them to the `pointer:coarse` roster closes the touch case too).
4. **#44 — long-value overflow on a bare `.in`.** Single-line inputs scroll by browser default (fine), but document/guard that authored field VALUES (e.g. a read-only token) don't wrap; this is mostly an authoring rule — no recipe change needed unless a `text-overflow:ellipsis` read-only variant is wanted.

---

## D. Loop notes (meta)

- **Research half: EASY, and the kit is already exceptionally strong here (40/44 PASS).** Form/input is the second-most-documented component after tables, and the canonical laws converge hard across NN/g (placeholders-harmful, visible labels, inline error messages), Baymard (required+optional marking), shadcn (unified focus ring), and W3C/WAI (programmatic required/invalid). The kit nails the load-bearing ones: the **height invariant** (`inH==btnH` per tier), the **one-family surface**, the **unified same-hue focus ring with the double-ring bug explicitly killed**, the **full validation contract reaching every field shape and surviving Borders-Off**, the **read-only ≠ disabled** distinction, and — notably — two mobile a11y rules most kits miss: the **44px coarse-pointer floor** and the **iOS-zoom 16px guard**. This is a mature, opinionated family.
- **The scan found only TWO honest gaps, and they're small.** (a) **No `:-webkit-autofill` restyle** (#43, MED) — the single thing that visibly breaks the field family in the real world (yellow Chrome fill / dark-mode contrast); a ~6-line `globalLayer` rule closes it and it belongs there so all shapes inherit it. (b) **No optional-field marker** (#27, LOW) — required (`*`) is covered, optional isn't. Everything else is PASS or genuine LOW polish.
- **FALSE-POSITIVE risk was real and the usage read paid off.** A CSS-only scan would have flagged "no error-message a11y wiring," "no indeterminate driver," and "no async-loading state" as gaps — but the gallery + formpanel handle all three (`aria-invalid`+`aria-describedby` on real fields at gallery 1434/1748, `el.indeterminate` JS at 1338, the search spinner slot). Caps-lock detection (`.pwinput__capslock`) is correctly recipe-styled but JS-driven, and that's the right split. Carrying the **Delegated?** column kept these as PASS.
- **Minor doc-drift worth a note (not a craft gap):** the `.in` recipe header comment says "Compact = 32px, Balanced = 40px, Bold = 48px," but the actual SCALE table is **32 / 36 / 40** (compact/default/comfortable). The token behaviour is correct; the comment is stale — a one-line fix if anyone touches that block.
- **LOAD-BEARING rows mechanizable into `audit:craft`:** #1 (every field's `min-height` resolves to `--k-in-h-default`, not a literal) — partly covered by `audit:inline`/`audit:craft` magic-px ratchet; #11/#12 (focus ring = `--k-ring`/`--k-ring-halo`, and a single focus source — already guarded by `audit:focus`/`audit:state-edge`); #19 (validation `border-width: max(1px, --k-bw)` must persist) is a good new probe: "if a field carries `.is-error/.is-success/.is-warning/[aria-invalid]`, a `max(1px,...)` width guard must exist." #43 once shipped is a candidate ENFORCE row: "if `--k-field-bg` exists, a `:-webkit-autofill` repaint must too."
- **FORMAT verdict: SKILL doc, same split as table/calendar.** Section A (the rule library + the *why* — especially the field-family invariants and the validation contract) is durable teaching content for the skill / `get_design_context` per-component card. Sections B/C are a point-in-time scan that goes stale the moment the recipe or `globalLayer` changes — regenerate on demand.
