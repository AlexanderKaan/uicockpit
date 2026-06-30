# Select & Menu — best-practice library + compliance scan

> Component: the overlay-picker idiom — `.select-trigger` · native `select.select` · `.menu`/`.menu__item` (dropdown) · `.combobox`/`.combobox__pop` · `.cmdp` (command palette) · `.menubar` · `.ctxmenu` · `.popover` · recipe `cockpit/src/kit/recipes/index.ts:1967` (select-trigger), `:2741` (cmdp), `:3195` (combobox), `:3248` (menu), `:3272` (roll-down stagger + `.menu__item`), `:3349` (menubar), `:3681` (popover), `:4532` (ctxmenu); shared focus halo `:4593` · scanned 2026-06-30

This is a recipe FAMILY, not one class. The shared substrate is `.menu` (the overlay
surface) + the SM row grammar (`.menu__item`/`.combobox__item`/`.cmdp__item`, all locked
to `--k-row-h-sm`). Behaviour (keyboard nav, open/close, type-ahead, placement) is
delegated by design — the kit ships CSS + a11y *structure*; the consumer wires JS (see
`export/genSkill.ts` "Listboxes & custom triggers: you own keyboard nav"). The gallery +
`AppHelpers.tsx` ship reference behaviour (`useDropdown`, `handleMenuArrows`, `MenuButton`,
`Menubar`), so most behavioural rules are **Delegated? = yes** and PASS via usage.

## A. Best-practice library (supply)

### Trigger (the closed state)
1. **Trigger height parity with inputs** [LOAD-BEARING] — a select beside a search field must align at every density. — `.select-trigger { min-height: var(--k-in-h-default) }` + native `select.select` same; matches `.in`/`.numinput`.
2. **Trigger is a real field, not a button** [LOAD-BEARING] — same fill/border/radius family so it reads as a form control. — `background: var(--k-field-bg)`, `border-color: var(--k-field-border-color)`, `border-radius: var(--k-field-radius)`.
3. **Trigger has a chevron affordance** [polish] — the down-caret signals "opens a list". — native `.select` has inline SVG chevron; custom `.select-trigger` relies on the consumer adding `<Icon name="chevD">` (gallery does).
4. **Hover + focus + invalid states on the trigger** [LOAD-BEARING] — interactive feedback + form-validation language identical to `.in`. — `.select-trigger:hover`, `.select-trigger:focus { box-shadow: 0 0 0 var(--k-ring-w) var(--k-ring-halo) }`, `.select-trigger.is-error / [aria-invalid]`.
5. **Disabled trigger** [polish] — a locked field must look locked. — global `[disabled]` layer (globalLayer.ts) + native `select:disabled`; no select-specific dim.
6. **Prefer the native `<select>` when it fits** [LOAD-BEARING] — zero-JS, fully accessible, mobile-OS picker. — `select.select` is a first-class scoped recipe; genSkill explicitly steers consumers to it.

### The option list / menu surface
7. **Overlay surface signature** [LOAD-BEARING] — raised/overlay bg + soft large shadow + hairline border = "floating above content". — `.menu`/`.combobox__pop`/`.cmdp`/`.popover`: `background: var(--k-surface-overlay)`, `box-shadow: var(--k-shadow-lg)`, `border: var(--k-hairline)`.
8. **Concentric nested radius for first/last item** [polish] — item hover corners must nest inside the container corner, not look boxy. — `--k-nest-radius: max(2px, calc(var(--k-radius-md) - 4px))` set on `.menu`/`.combobox__pop`, consumed by items.
9. **Min-width floor on the overlay** [polish] — a menu shouldn't collapse to label width. — `min-width: var(--k-overlay-min, 12rem)` on `.menu`/`.popover`; `200px` on `.combobox__pop`.
10. **Max-height + internal scroll for long lists** [LOAD-BEARING] — a 50-region select must scroll inside a capped overlay, not run off-screen (APG/Radix: constrain to viewport, scroll the viewport). — `.combobox__pop { max-height: 200px; overflow-y: auto }` ✅; **`.menu` has only `overflow: hidden`, NO max-height** ❌.
11. **Open/enter animation anchored to the trigger** [polish] — the panel rolls/scales out from its origin edge. — `animation: var(--k-anim-menu, k-menu-roll …)` + `transform-origin: top`; `.popover` uses `k-scale-in` from `transform-origin: top left`. Collapses to instant when Motion=None.
12. **Item roll-down stagger** [polish] — Material-3 cascade reveal; step = 0ms at Motion=None. — `.menu__item:nth-of-type(n)` → `--stagger-i` × `--k-menu-stagger` (recipe `roll-down-item-stagger`).

### Option-row states
13. **Hover === keyboard-active highlight (one "current" row)** [LOAD-BEARING] — mouse hover and arrow-key focus must share ONE highlight so only one row reads as current. — `.menu__item:hover`, `.cmdp__item:hover`/`--on`, `.combobox__item:hover`/`--on` all use `var(--k-state-hover)`.
14. **Selected indicator (checkmark / selected-edge)** [LOAD-BEARING] — the chosen option carries a persistent check, distinct from transient hover. — `.menu__item--check::before { content:'✓'; color: var(--k-primary) }` with `--uncheck` reserving the same box; `.combobox__item--selected .combobox__check { color: var(--k-primary) }`.
15. **Reserved indicator gutter** [LOAD-BEARING] — checked + unchecked labels share one left edge (no text shift on select). — `.menu__item--uncheck::before { width:12px }` mirrors `--check`; combobox `.combobox__check { width:14px; color:transparent }`.
16. **Disabled / non-actionable option** [LOAD-BEARING] — a greyed, unfocusable, un-hoverable option. — `[aria-disabled]` light treatment (craft-sweep C4, global) + `handleMenuArrows` skips `[aria-disabled="true"]`; gallery ctxmenu shows a disabled "Duplicate · Pro" row.
17. **Destructive option treatment** [polish] — red text, danger-soft hover (Radix parity). — `.menu__item--danger { color: var(--k-danger) }` + `:hover { background: var(--k-danger-soft) }`.
18. **Trailing shortcut / keyboard hint** [polish] — `⌘K`-style hints right-aligned in mono. — `.menu__shortcut`, `.cmdp__shortcut` (`margin-left:auto`, `font-family: var(--k-font-mono)`).
19. **Leading icon slot, size-locked** [polish] — an optional per-row glyph that doesn't bloat row height. — `.menu__item > svg { width: var(--k-row-icon,14px) }`, `.cmdp__item-icon`.

### Grouping & structure
20. **Section labels / group headings** [LOAD-BEARING] — long lists chunk into labelled groups (eyebrow caps). — `.menu__label`, `.cmdp__section` (uppercase, `--k-type-caption`, `--k-track-eyebrow`).
21. **Separators between groups** [polish] — a hairline divides logical blocks. — `.menu__sep { height: var(--k-bw); background: var(--k-border) }`.
22. **Row rhythm matches table/list rows** [LOAD-BEARING] — menu/option rows lock to the same SM grammar so the system reads as one rhythm. — all items `min-height: var(--k-row-h-sm, 28px)`; cmdp uses MD (32px) deliberately (search surface).

### Behaviour (delegated — wired in usage)
23. **Keyboard nav + roving focus** [LOAD-BEARING] — ↑/↓/Home/End move focus among options; menubar adds ←/→ + roving `tabindex`. — `handleMenuArrows` (AppHelpers) + `Menubar` roving `tabindex={active===i?0:-1}`.
24. **Open/activate keys** [LOAD-BEARING] — ArrowDown/Enter/Space open the trigger's list. — `MenuButton`/`Menubar` `onKeyDown` open on those keys.
25. **Escape closes + returns focus to trigger** [LOAD-BEARING] — keyboard/SR users don't fall to `<body>`. — `useDropdown` Escape handler + `restoreFocus()`.
26. **Outside-click dismiss** [LOAD-BEARING] — click-away closes (but does NOT yank focus back). — `useDropdown` `mousedown` outside listener.
27. **Type-ahead (first-letter jump)** [LOAD-BEARING for 7+ options] — APG: typing a character jumps to the next matching option; essential for long selects. — **NOT implemented anywhere** (only the combobox offers *filtered* typeahead via a text input).
28. **ARIA wiring: haspopup / expanded / listbox / activedescendant** [LOAD-BEARING] — the role truth drives SR announcement. — gallery/sections set `aria-haspopup`, `aria-expanded`, `role="listbox"/"menu"`, `role="option"/"menuitem"`, `aria-selected`, `aria-activedescendant` (cmdp + combobox).
29. **Scroll active option into view** [LOAD-BEARING when activedescendant + scroll] — JS must scroll the aria-activedescendant option into the visible viewport (browsers don't auto-scroll it). — **NOT handled**; moot today because `.menu` doesn't scroll (rule 10), but a gap the moment a long scrollable listbox ships.

### Placement / anatomy
30. **Static placement modifiers (no JS collision-flip)** [LOAD-BEARING] — pick a side that clears the edge; the kit ships directional variants, not auto-flip. — `.popover--top`/`--end`, `.hover-card__pop--top`/`--end`; genSkill documents "portal if a parent clips". Plain `.menu` has none (consumer inlines `left/right/top`).
31. **Popover anatomy: arrow pointing at the trigger** [polish] — a directional caret ties the panel to its anchor. — `.popover__arrow` (rotated bordered square), flips per placement variant.
32. **z-index above page chrome** [LOAD-BEARING] — overlays sit above content. — `z-index: var(--k-z-dropdown)` / `var(--k-z-popover)`.
33. **Context menu at cursor** [polish] — right-click opens at the pointer. — `.ctxmenu__pop` `position:absolute` + inline `left/top`; reuses `.menu`.

## B. Compliance scan (check)

| # | Rule | Status | Evidence (recipe line / usage file / "absent") | Delegated? | Severity |
|---|------|--------|------------------------------------------------|------------|----------|
| 1 | Trigger height parity | ✅ PASS | `:1977` `min-height: var(--k-in-h-default)`; native `:2011` | no | — |
| 2 | Trigger is a field | ✅ PASS | `:1982-1984` field-bg/border/radius | no | — |
| 3 | Chevron affordance | ⚠️ PARTIAL | native `:2021` inline SVG; `.select-trigger` has none — gallery adds `<Icon name="chevD">` (`ComponentGallery:1783`) | yes (gallery) | LOW |
| 4 | Hover/focus/invalid trigger | ✅ PASS | `:1992` hover, `:4593-4598` focus halo, `:1997-2001` `.is-error`/`[aria-invalid]` | no | — |
| 5 | Disabled trigger | ⚠️ PARTIAL | global `[disabled]` layer + native `select:disabled`; no select-specific style or demo | partial | LOW |
| 6 | Prefer native select | ✅ PASS | `select.select` recipe `:2010-2034`; used `ComponentGallery:1326,1392,1438,1500,1608`; genSkill steers to it | no | — |
| 7 | Overlay surface signature | ✅ PASS | `.menu :3256-3259`, `.combobox__pop :3212-3215`, `.cmdp :2749-2752`, `.popover :3693-3696` | no | — |
| 8 | Concentric nested radius | ✅ PASS | `:3268` `--k-nest-radius` on `.menu`; `:3226` on `.combobox__pop` | no | — |
| 9 | Min-width floor | ✅ PASS | `:3254` `var(--k-overlay-min,12rem)`; combobox `:3211` 200px | no | — |
| 10 | **Max-height + scroll** | ❌ GAP | `.combobox__pop :3216-3217` has `max-height:200px; overflow-y:auto` ✅, **`.cmdp` has NEITHER, `.menu :3263` has only `overflow:hidden`** — a select/menu with 30+ options runs off-screen | no | **HIGH** |
| 11 | Open animation anchored | ✅ PASS | `:3261` `k-menu-roll` + `transform-origin:top`; `.popover :3702` `k-scale-in` | no | — |
| 12 | Item roll-down stagger | ✅ PASS | `roll-down-item-stagger :3283-3298` | no | — |
| 13 | Hover === active highlight | ✅ PASS | `:3325` `.menu__item:hover`; `:2808-2809` cmdp hover/`--on`; `:3239` combobox | no | — |
| 14 | Selected check / edge | ✅ PASS | `.menu__item--check::before :3333`; combobox `:3240`; gallery select uses `--check` (`:1793`) | no | — |
| 15 | Reserved indicator gutter | ✅ PASS | `.menu__item--uncheck :3343` width:12px mirrors `--check`; combobox check width:14px transparent `:3241` | no | — |
| 16 | Disabled option | ✅ PASS | global `[aria-disabled]` (C4) + `handleMenuArrows` skips disabled (`AppHelpers:10`); ctxmenu demo `ComponentGallery:568` | yes (usage) | — |
| 17 | Destructive option | ✅ PASS | `:3331-3332` `.menu__item--danger`; used in ctxmenu/toolbar/row-actions | no | — |
| 18 | Trailing shortcut | ✅ PASS | `:3344` `.menu__shortcut`; `:2830` `.cmdp__shortcut` | no | — |
| 19 | Leading icon slot | ✅ PASS | `:3324` `.menu__item>svg`; `:2804` cmdp; `:2829` `.cmdp__item-icon` | no | — |
| 20 | Section labels | ✅ PASS | `:3346` `.menu__label`; `:2819` `.cmdp__section` | no | — |
| 21 | Separators | ✅ PASS | `:3345` `.menu__sep` | no | — |
| 22 | Row rhythm SM-locked | ✅ PASS | all items `min-height: var(--k-row-h-sm,28px)` (`:3310`,`:3235`); cmdp MD by design `:2793` | no | — |
| 23 | Keyboard nav + roving | ✅ PASS | `handleMenuArrows` ↑/↓/Home/End (`AppHelpers:14-17`); `Menubar` ←/→ + roving tabindex (`:519`) | yes (AppHelpers) | — |
| 24 | Open/activate keys | ✅ PASS | `MenuButton:425`, `Menubar:494` ArrowDown/Enter/Space | yes | — |
| 25 | Esc closes + focus return | ✅ PASS | `useDropdown:75` Escape + `restoreFocus` | yes | — |
| 26 | Outside-click dismiss | ✅ PASS | `useDropdown:72` mousedown outside | yes | — |
| 27 | **Type-ahead (first-letter)** | ❌ GAP | absent — no `handleMenuArrows` printable-char branch; only combobox does *filtered* typeahead via its text input | no (would be AppHelpers) | **MED** |
| 28 | ARIA wiring | ✅ PASS | `aria-haspopup`/`expanded`/`role=listbox\|menu`/`option\|menuitem`/`aria-selected` across gallery+sections; cmdp+combobox set `aria-activedescendant` (`ComponentGallery:1054,1073`) | yes (usage) | — |
| 29 | Scroll active option into view | ⚠️ PARTIAL | not handled; moot until a `.menu`/`.cmdp` listbox actually scrolls (blocked by #10) | no | LOW |
| 30 | Static placement modifiers | ✅ PASS | `.popover--top/--end :3718-3720`; `.hover-card__pop--top/--end :3765` | no | — |
| 31 | Popover arrow | ✅ PASS | `.popover__arrow :3705-3715` + per-placement flip | no | — |
| 32 | z-index above chrome | ✅ PASS | `var(--k-z-dropdown/popover)` on every overlay | no | — |
| 33 | Context menu at cursor | ✅ PASS | `.ctxmenu__pop :4545` + inline left/top (`ComponentGallery:565`) | no | — |

**Counts:** 27 PASS · 4 PARTIAL (#3, #5, #29, plus #10's partial-credit combobox) · 2 GAP (#10, #27). Of 33 rules, ~16 are LOAD-BEARING; the two real GAPs (#10, #27) are both LOAD-BEARING.

## C. Gap worklist (ranked)

1. **HIGH — `.menu` (and `.cmdp`) need max-height + internal scroll (#10).** A select built on `.menu` (the gallery's own SelectCard, region list) or any 20+ item dropdown overflows the viewport with no scroll. The combobox already proves the pattern. **Fix:** add to `.menu` (recipe `:3253`): `max-height: var(--k-overlay-max, min(20rem, calc(100vh - 4rem))); overflow-y: auto;` and change `.cmdp__list`/`.cmdp` to cap + scroll similarly (`.cmdp` currently caps nothing). Introduce a `--k-overlay-max` token (derive, don't hardcode px — `calc`/`rem`) so density/scale can modulate it. Keep `overflow:hidden`→`overflow-y:auto; overflow-x:hidden` so the nested-radius corners survive. NB Radix/shadcn pattern is scroll-buttons OR a scroll-area; a plain `overflow-y:auto` is the minimum table-stakes.
2. **MED — type-ahead first-letter jump in `handleMenuArrows` (#27).** APG marks this LOAD-BEARING for 7+ option listboxes; our region/status selects qualify. **Fix:** extend `handleMenuArrows` (AppHelpers, the reference behaviour) with a printable-char branch: buffer keystrokes (~500ms), `find` the next `[role="option"/"menuitem"]` whose text starts with the buffer, `.focus()` it. Behaviour-tier, so it lands in AppHelpers + the genSkill behaviour note (advertise it), not the recipe CSS.
3. **LOW — chevron in the `.select-trigger` recipe itself (#3).** The custom trigger leans on the consumer to add a caret; the native select bakes one in. Optional: a `.select-trigger__caret` convention or a documented "always add a trailing chevron" line so a pack-only builder doesn't ship a caret-less custom trigger.
4. **LOW — scroll-active-option-into-view (#29)** becomes real the moment #10 ships a scrollable listbox driven by `aria-activedescendant`. Bundle the `scrollIntoView({block:'nearest'})` call into the same AppHelpers keyboard handler when closing #10/#27.
5. **LOW — disabled-trigger demo (#5):** add an `aria-disabled`/`disabled` `.select-trigger` variant to a gallery card so the locked state is demonstrated (modifier/coverage hygiene), not just inherited from the global layer.

## D. Loop notes (meta)

- **Research half was cheap and convergent.** APG (listbox/combobox/menu-button) + Radix/shadcn Select agree on the exact two things we miss: constrain-to-viewport + scroll the option list, and type-ahead for 7+ options. The rest of the field (checkmark indicator, reserved gutter, section labels, separators, hover===active, Esc+focus-return) the kit already nails — this family is genuinely strong (27/33 PASS).
- **The Delegated? column carried real weight here** — this is a behaviour-heavy family and a CSS-only scan would have false-flagged keyboard nav, roving focus, Esc-return, outside-click, and ARIA wiring as GAPs. All are PRESENT in `AppHelpers.tsx` (`useDropdown`, `handleMenuArrows`, `MenuButton`, `Menubar`) and the gallery/sections, and the kit's design contract (genSkill) explicitly delegates them. Marked PASS.
- **The one GAP a CSS scan *correctly* finds is #10 (max-height).** It's a genuine recipe-CSS shortfall, not a usage thing — `.combobox__pop` scrolls but `.menu`/`.cmdp` don't, an inconsistency within the family. #27 (type-ahead) is honestly absent everywhere (CSS *and* usage) — APG-mandated, so MED not LOW.
- **Format verdict:** split, as before. Section A (the 33-rule library, esp. the trigger-parity / reserved-gutter / hover===active / delegated-behaviour contract) is durable `get_design_context`/skill knowledge. Section B/C is a point-in-time scan that goes stale the instant `.menu` gains a max-height.
- **Mechanizable into `audit:craft`:** (a) #1 trigger height — assert `.select-trigger`/`select.select` use `--k-in-h-*`, never a literal; (b) #10 — if an overlay surface (`.menu`/`.combobox__pop`/`.cmdp`) exists, it must declare a `max-height` + `overflow-y` (the combobox would pass, flagging `.menu`/`.cmdp` — exactly the gap found); (c) #15 — `.menu__item--check` and `--uncheck` must reserve the same gutter width (regression guard on the no-text-shift invariant).
