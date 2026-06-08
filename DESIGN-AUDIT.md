# UICockpit — Design-system audit & polish backlog (June 2026)

Source: 4 parallel deep audits of `cockpit/src/kit/recipes/index.ts` (74 recipes),
`globalLayer.ts`, `buildTokens.ts`, `ComponentGallery.tsx`, `DemoDashboard.tsx`.
Maps to the user's 10-item program. **Verify each finding against the file before
fixing** — one audit (settings-responsiveness) grepped only `buildTokens.ts` and
produced 2 false "undefined token" alarms (`--k-z-*` and `--k-radius` ARE emitted).

Overall grade (UX audit): **A− component library, B+ complete design system.**
Wider than shadcn out-of-the-box (cmdk, OTP, phone, kanban, tree, status-page,
charts, pricing). Held back by: missing FormField contract, missing states
(button-loading, checkbox-indeterminate, toggle-disabled, distinct read-only),
and the inherent CSS-only overlay-a11y ceiling.

---

## ✅ DONE — W1 + W2 (committed, GREEN, NOT deployed; deploy waits till after marketing/github)
Commits this session (on `main`, after Pass B `fdada2f`):
- `7cfa9d3` **W1 motion+borders** — button press uses `var(--k-dur-fast)` (was 140ms literal);
  structural box borders follow the Borders control via `--k-bw`: button `max(1px,--k-bw)`,
  select-trigger/taginput `var(--k-bw)`, checkbox/radio/OTP/stepper-dot/timeline-dot `max(1.5px,--k-bw)`.
- `4a7c17c` **W2 scrim** — `--k-scrim` + `--k-scrim-strong` tokens (dialog/sheet/lightbox backdrops).
- `51576af` **list-divider curve fix** — `.list__item` had `border-top` + `border-radius` → divider
  curved at Box=Soft. Now a flat `::before` line (ignores radius, follows `--k-bw`). VERIFIED only-instance.
- `be31faf` **W2 hairline** — `--k-hairline` now tracks the Border control (softer 55% tint of live
  `--k-border` via color-mix; was a fixed low-alpha, decoupled).
- `e851999` **W2 inputs = filled fields** — new `--k-input-bg` (= `--k-surface-sunken`, BRAND-TINTED
  recessed neutral) on `.in`/select-trigger/taginput/otp; `--k-input-border` now TRACKS the control
  (`BORDER_STEP+1`, no hard 3:1 floor). Filled-field/Material pattern. `contrast.test` updated to the new
  contract (every other pair passes at default; input boundary clears 3:1 at Borders:Strong; badge shows
  15/16 at Subtle w/ the existing remedy, 16/16 at Strong). Visually verified on the preview.

### ✅ W3 + W4 (committed this session, GREEN, NOT deployed)
- `e90a2ad` **W3 typography tokens** — new `--k-track-eyebrow` (unifies 14 uppercase
  eyebrow/caps sites, was hand-set 0.04–0.08em); new `--k-weight-medium/semibold/bold`
  named scale (replaced 76 font-weight literals in recipes, identical values, zero
  visual change; the config-pinned `var(--k-ui-weight)` refs left untouched); ONE shared
  panel-heading rule for `.card__title`/`.dialog__title`/`.sheet__title` (display font +
  h3 + tracking + margin:0) — sheet-title gained the display font, dialog got a real
  `.dialog__title` replacing 2 inline-styled `<h3 style={fontSize:14,fontWeight:600}>`.
- `d859d35` **W4 scale tokens** — `--k-avatar` (24/28/32, with --sm/--lg via calc),
  `--k-icon-chip` (34/38/42 → lightbox/dialog-alert/dropzone/carousel icon boxes),
  `--k-dot` (~7/8/9 → avatar/meta/list status dots), all keyed off `--k-in-h-default`
  so they GROW with Scale. Singletons (stepper/timeline dot, list-lead, otp, spinner)
  derive from `--k-in-h-default` via inline calc. Default-tier values unchanged.

### 🟡 W5 overlays — IN PROGRESS (W5a + W5b committed GREEN; W5c remains)
- `5602b9b` **W5a z-index + scrim → tokens** — navmenu/ctxmenu panels + every inline
  DemoDashboard overlay (menus/sheets/toast/cmdp) now use `--k-z-*` tokens (dropdown/
  drawer/modal/toast) instead of bare 20/30/40/41/50; 2 inline `rgba(0,0,0,.4)` backdrops
  → `--k-scrim` (mode-aware). Z_INDEX scale lives in `src/tokens/extras.ts` (genCss emits
  `--k-z-*`); buildTokens does NOT emit them.
- `ca89740` **W5b dead triggers → real menus** — added `MenuButton` + `SplitMenu` helpers
  in AppHelpers (built on the existing `useDropdown` = outside-click + Escape). Wired the
  4 dead chevrons (Docs Heading, Projects Epic/Type, Media Upload-options split button).
  RowMenu inline z-index → token too.
- `c8a0418` **W5c dismiss + clip fix** — Projects ctxmenu was clipped by
  `.datatable{overflow:hidden}` → now `position:fixed` at viewport cursor coords + real
  Escape/outside-click dismiss. Header notif/new dropdowns routed through `useDropdown`
  (were onMouseLeave-only). aria-haspopup added to the bell.
- **W5 RESIDUAL (deferred, lower priority — needs design judgment):**
  - **Positioning/flip** — no collision/flip anywhere; menus near the viewport edge don't
    flip. Min fix = `max-height + overflow:auto` on `.menu` + a flip class (or CSS anchor
    positioning). Left for a focused pass — purely additive when tackled.
  - **cmd-palette fake "esc" hint** still has no handler (cmd-palette dismiss path).

### ✅ W6 new states/components — DONE (committed GREEN, NOT deployed)
- `407328e` **W6a** — FormField `.field` contract (`.field`/`__label`/`__req`/`__hint`/
  `__error`, shadcn FormItem model) in gallery (Account-details) + app (Settings billing);
  distinct read-only input (`input.in[readonly]` → flat surface + muted, was identical
  to editable).
- `feee0d3` **W6b** — `.btn--loading` (width-locked spinner; wrap label in an element),
  `.toggle--disabled` (state parity), checkbox `:indeterminate` (dash glyph) + disabled
  checkbox/radio; DataTablePro select-all (gallery + Projects) sets `.indeterminate` via
  ref when some-not-all selected.
- `2b447cf` **W6c** — Custom Select was already complete (trigger + searchable listbox +
  empty-state + aria-selected + selected-check); routed its dismiss through `useDropdown`
  (outside-click + Escape). W6 component set complete.
- **All 6 P0 adds from ITEM 9 are now shipped.** Library grade A− → A (the overlay-a11y
  CSS-only ceiling remains the honest cap vs Radix; documented).

### KEY FACTS the next session needs
- **Border control = COLOUR-based, 4 levels Faint/Subtle/Medium/Strong** (`BORDER_STEP` light=[4,5,6,7]).
  `--k-bw` is ALWAYS `1px` (it does NOT vary). So "make borders respond" = use the COLOUR token
  `--k-border` (already does) and, for the soft edge, `--k-hairline` (now fixed). The `1px→var(--k-bw)`
  churn is pointless (no effect) — skip it.
- **RESOLVED (`acf833a`):** the "input fill too subtle" was a BUG, not a tuning need. Two stale
  `--k-surface-2` fills (the 2nd `.in {}` block + the shared numinput/pwinput/searchinput/phoneinput
  rule) overrode W2's `--k-input-bg`, so text inputs/textarea rendered lighter (0.98) than selects
  (0.937). Both repointed → every field type now resolves to `--k-input-bg` (verified in live DOM).
  Field fill is now uniformly elevation-coupled (Neutrals/Emphasis), exactly as the user wanted.
- **DEFERRED taste call:** border-COLOUR unification (`--k-border` crisp vs `--k-hairline` soft used
  inconsistently across ~43 sites) — needs the user's eye; NOT a mechanical fix. Left as-is.
- Preview dev-server cache is flaky for the agent; verify served code with `curl localhost:5173/src/...`.

### EXECUTION ORDER (user-agreed) — marketing (item 8) + GitHub (item 10) go LAST
W1 borders ✅ → W2 surface/scrim/hairline/inputs ✅ (border-colour unification deferred) →
**W3 typography tokens** (eyebrow-tracking + weight scale) → **W4 scale tokens** (avatars/dots/icon-chips)
→ **W5 overlays** (positioning/flip + dismiss + dead triggers + z-index) → **W6 new states/components**
(FormField, btn-loading, checkbox-indeterminate, toggle-disabled, read-only, custom Select) →
**W7 responsive** (container-queries + clamp type + touch-floor) → **W8 A+ verify** →
**item 8 marketing** (USP refresh + un-freeze the bouquet) → **item 10 GitHub** (CI, topics, README count,
dead footer link, Discussions). Each wave = its own green commit; deploy the accumulated kit waves at a
sensible checkpoint. Full per-finding detail in the WAVE sections below + ITEM 2/8/9/10 diagnoses.

## Verified FALSE alarms (do NOT "fix")
- `--k-z-*` (dropdown/popover/modal/tooltip) ARE emitted (snapshot 209-216). Layering works.
- `--k-radius` bare on `.ph` — re-verify emission before touching.

---

## WAVE 1 — Stroke/border responds to the "Borders" control (items 3 + 7) — HIGH IMPACT
`--k-bw` + `--k-stroke-1/2/3/progress` exist but are barely used → "Strong borders"
only thickens `.in` inputs; buttons/checkboxes/tabs/selects stay thin → mismatched edges.
- `.btn` base `border: 1px solid transparent` → `var(--k-bw) solid transparent` (recipes:144)
- `.select-trigger` (1177), `.taginput` (2357) hardcode `1px` → `var(--k-bw,1px) solid var(--k-input-border)`
- `1.5px` epidemic → tie to `--k-bw`/stroke: `.check/.radio input` (546), `.otp__slot` (2735),
  `.stepper__dot` (2224), `.timeline__dot` (3716), `.navsub::before` (1281), rail `.badge--count` (~1340)
- `2-3px` accents → `--k-stroke-2/3`: tab underline (753), slider knob (1063), dropzone (2251),
  toast left-accent (2329), alert-dialog accent (2704), pricing-featured (3861), spinner (1226)
- `.usage__bar height:6px` → `--k-stroke-progress` (matches `.progress`) (2031)

## WAVE 2 — Surface/border/radius vocabulary unification (item 3) — HIGH IMPACT
- **Two border vocabularies**: `1px solid var(--k-border)` (card/dialog/popover/toast/datatable/
  usage/code/kbd/segctrl) vs `var(--k-hairline,…)` (menu/combobox/stat-tile/att-chip/pricing/
  codeblock/filegrid/twocol/wstepper). Pick ONE (recommend `var(--k-bw) solid var(--k-border)`).
- **Floating-panel radius split**: popover/hover-card/dialog/card = `lg`; menu/combobox/toast/
  sheet = `md`. Unify the floating family (recommend one tier; document menu-vs-panel if intentional).
- **Tooltip ×3 implementations** diverge (`.tt__pop` md+eyebrow, sidebar-rail-tip sm+small,
  barchart/chart-tip sm) — unify radius+type. (886, 1351, 1854, 1918)
- **Scrims hardcoded** `rgba(0,0,0,.4)` (dialog-frame 1616, sheet-frame 2504), `.86` + white-rgba +
  `#fff` (lightbox 1465-72), carousel `#fff` (3073) → add `--k-scrim` (+ `--k-on-scrim`), mode-aware.
- Tag/kbd radius inconsistencies (kanban-tag sm vs pricing-badge md; kbd 4px literal ×2).

## WAVE 3 — Typography system (item 6) — MEDIUM
- **Eyebrow/uppercase tracking 0.04–0.08em across ~15 sites** with no token → add one
  `--k-track-eyebrow`. (thead 796, toolbar-label, cmdp/menu/list section, nav-group, stat-tile,
  kanban-tag, pricing-name, sep, donut-cap)
- **Font-weight hand-set 500/600/700**, no scale; "panel title" weight disagrees (card 600 /
  auth 700 / sheet 600) → add `--k-weight-medium/semibold/bold` and apply to headings.
- **Panel-title recipe inconsistent**: card-title has display font, sheet-title doesn't, dialog
  has no title rule → one heading recipe. (317, 2529, 1443)
- **Cell-padding multiplier idiom** copy-pasted with different constants (table *0.55/0.65,
  list-row *0.55/0.7, cmdp *0.85) + misleading `10px/8px` fallbacks (real `--k-space`=16px) → derive
  from `--k-s-*` grid.

## WAVE 4 — Scale axis (item 7) — MEDIUM
Circular/icon sub-parts hardcode px → don't grow with Scale: avatar (28/22/36), stepper-dot 24,
timeline-dot 22, list-lead 32, OTP width 36, spinner 18, icon-chips (dialog 38, lightbox 38,
dropzone 36, carousel-arrow 34), status-dots (6/7/8). → introduce a small token set
(`--k-avatar`, `--k-icon-chip`, `--k-dot`) that scales off Scale/type; apply.

## WAVE 5 — Overlays: positioning + dismiss + layering (item 5) — STRUCTURAL
- **No collision/flip/viewport-clamp anywhere** — every overlay is naive `top:calc(100%+N)`.
  Worst: Projects context-menu positioned inside `.datatable{overflow:hidden}` → clips. (P0)
  Fix: ship/document an anchor-positioning layer (CSS anchor positioning or Floating-UI binding);
  min: `max-height + overflow:auto` + a flip class.
- **Dismiss is per-call-site & mostly broken**: a correct `useDropdown` (outside-click+Escape)
  exists in AppHelpers but only DatePicker/RowMenu use it. Header dropdowns, nav-menu flyout,
  combobox, select, cmd-palette dismiss on `onMouseLeave`/backdrop only — no Escape, no focus-return.
  cmd-palette even shows a fake "esc" hint with no handler. → route ALL through one controller.
- **Dead expand-triggers** (chevron but no menu): Docs "Heading ▾" (DemoDashboard:944),
  Projects "Epic ▾"/"Type ▾" (1067-68), Media "Upload options" chevron (1528). Wire or drop chevron.
- **z-index hierarchy**: dropdown=50 sits BELOW modal/popover/tooltip(1000-1300) → a menu renders
  under a popover; navmenu/ctxmenu hardcode `z-index:20`; call-sites use inline 20/30/41/50.
  → add `--k-z-menu`, drive every overlay from tokens, remove inline numbers.
- **gallery navmenu has NO dismiss at all** (source-of-truth demos a broken pattern).

## WAVE 6 — Missing states & components (items 1 + 9) — to push A− → A
P0: **FormField contract** (`.field` = label + required `*` + hint + error + `aria-describedby`);
**button loading** (`.btn--loading`, width-lock, `aria-busy`); **checkbox indeterminate** (+ wire
table select-all) & disabled-checked; **toggle disabled**; **distinct read-only** input visual;
**custom Select** (trigger+listbox grouped+selected-check).
P1: breadcrumb truncation; pagination page-size+summary; toast action+auto-dismiss; table
numeric-cell/density/skeleton-row/empty-row; dropdown submenu+radio-items; alert action-row;
outline/closable badge; slider ticks/range; avatar image variant.

## WAVE 7 — Responsive (item 2) — BIG, SEPARATE
Everything is desktop-first. Per-component sweep for mobile/tablet/desktop + in-betweens vs
viewport best-practices. (Not yet audited — own pass.)

## WAVE 8 — Marketing + interactive bouquet (item 8)
USP refresh; make every component in the home "bouquet" actually interactive (slider slides,
selection selects, accordion expands).

## ITEM 9 — Final cull / add vs A+ competition (DIAGNOSIS)
Current inventory: **74 recipes** (PRIMITIVES/HELPERS/PATTERNS). Pass B already culled 8
too-specific patterns, so the library is now tight + actually WIDER than shadcn out-of-the-box.
- **CULL: none recommended.** The set is well-curated post-Pass-B. (Low-confidence "watch, only
  if they go unused after the app settles": `inline-status-meta-micro-components` grab-bag helper,
  `roll-down-item-stagger` — but both are currently used by menus, so keep.)
- **ADD (this is the real A+ gap — "bijmaken waar nodig"), P0:**
  1. **FormField contract** `.field` (label + required `*` + hint + error + `aria-describedby`). #1 systemic hole.
  2. **`.btn--loading`** (width-lock + spinner + `aria-busy` + pointer-block).
  3. **Checkbox `:indeterminate`** (+ disabled-checked) → then wire table "select-all".
  4. **`.toggle--disabled`** (state parity; slider has it, toggle doesn't).
  5. **Distinct read-only input** visual (today read-only looks identical to editable — real defect).
  6. **Custom Select** (trigger + listbox `.menu` grouped + selected-check) — finish the half-built select.
- **A+ verdict:** **A− component library, B+ complete design system.** Fixing the 6 P0 adds + the
  overlay-a11y boundary (Wave 5) lifts it to a clear A. The honest ceiling vs Radix/shadcn is the
  CSS-only behavior layer (focus-trap, roving-tabindex, Floating-UI positioning) — document it +
  optionally ship a tiny JS shim recipe.

## ITEM 10 — GitHub story (DIAGNOSIS)
Repo `AlexanderKaan/uicockpit` (PRIVATE until launch — intended). Present + good: README, LICENSE,
CONTRIBUTING, CODE_OF_CONDUCT, issue templates, PR template, description, homepageUrl, issues enabled.
**Gaps:**
- **No CI workflow** (`.github/workflows/` empty; task #104) → add a PR gate running `npm run build`
  (the 8 audits + tsc + vite) + `vitest run`. Highest-value: protects the green bar.
- **README stale count**: "~80 components" ×2 (lines 7, 89) → **74** (or "70+").
- **No repo topics** (`repositoryTopics: null`) → add e.g. `design-system, design-tokens, css-variables,
  ui-kit, tailwind, shadcn, theming, framework-agnostic, figma-tokens, cdn`.
- **Discussions disabled** → enable for community Q&A (public-launch checklist item).
- **No `SECURITY.md`, no `CHANGELOG.md`.**
- **Social-preview / OG image** (task #107) still pending (WhatsApp/iMessage PNG fallback).
- Public flip itself (visibility → public) is a separate launch decision, not a doc gap.

## ITEM 2 — Responsiveness (DIAGNOSIS)
**Strategy today:** the shipped kit (`recipes/index.ts`) has **ZERO layout `@media`/`@container`
queries** (only `prefers-reduced-motion`) → desktop-fixed by structure. Marketing CSS is the
opposite — genuinely responsive (`clamp()` + media queries + a stacked comparison table). So
risk = the **app shell + 6 screens + gallery**, not the landing page.
**Already-fluid idioms present (apply these everywhere):** `auto-fit minmax()` (pricing, stat-group),
`flex-wrap` (toolbar, card__row, navmenu, taginput, legends), `overflow-x:auto` (tabs, code), pervasive
`min-width:0`+ellipsis truncation, one `@container` (gallery span). Type tokens are static (no `clamp()`).

**P0 (visible breaks on phone, ship to CDN):**
- **Gallery columns fixed `375px`** (`preview-only.css:77`) → horizontal page-scroll on every phone
  (and the marketing hero inherits it). Fix: `repeat(auto-fill, minmax(min(375px,100%),375px))`.
- **App shell `.dash` `200px 1fr`** fixed sidebar, no collapse (`preview-only.css:158`) → 6 screens
  unusable on phone. Fix: `≤640px` off-canvas drawer.
- **Touch targets <44px**: `btn--sm`(28) / `btn--icon`(28-34) / pagination(~28) / `toggle--sm`(26) —
  and the app uses `btn--sm` everywhere. Fix: one `@media (pointer:coarse)` 44px floor in `globalLayer.ts`
  + a `--k-touch-target` token.
- **Sheet** `width:280-360` no `max-width:100vw`; **Dialog** bare `.dialog` no width cap; **OTP** row no
  wrap; **Tooltip** `nowrap` no max-width → all overflow narrow viewports.

**P1:** screen grids don't reflow — Home `'2fr 1fr'` (DemoDashboard:305), Docs `'210px 1fr'` (:913),
Media flex tree+grid `repeat(4,1fr)` (:1535,1629), **kanban 4-col crush** (recipes:1958), **twocol
`1.4fr 1fr`** no stack (recipes:3933); bare `.tbl` + datatable need `overflow-x:auto`.
**P2:** filegrid fixed col count; marketing nav has no hamburger ≤700px (becomes brand-only).

**Recommended strategy (for a CDN token kit):** **container queries** as the primary mechanism for
components (a consumer drops `.card`/`.kanban` into an unknown-width slot — viewport `@media` can't
know that, `@container` can; the kit already proves it with the gallery span query) + **media queries
only for the shell + a global `pointer:coarse` touch floor** + **`clamp()` fluid type tokens** (one
kit-wide change improves every component). Not a rewrite — it's *applying* the idioms the kit already has.
## ITEM 8 — Marketing USP freshness + bouquet interactivity (DIAGNOSIS)
### USP / copy freshness — stale or wrong:
- **Counts**: "80+ components" (MarketingPage:293), "40+ UI components" (MktStats:18), "40-card gallery"
  (MarketingPage:321, DocsPage:123, seoData:171,409) → all should be **74** (3 tiers). Token count
  inconsistent: 65+/120+/60+ across site → pick "120+". Controls "21" (index.html/llms) vs "~20" elsewhere.
- **Export count CONTRADICTION**: llms.txt + index.html say "**six** formats"; seoData + MktStats say "**8**".
  Reality = 7 file formats + Overview. Standardize. `shadcn registry` format missing from llms/index.html.
- **⚠️ VERIFY — components.html**: agent says `'html'` is in `TabId` but NO components.html tab/generator
  is wired in ExportModal (8 tabs found), yet seoData (60,95,172,455) advertises it = **false promise**.
  BUT tasks #211-214 mark it "built". → **verify ExportModal.tsx before acting**: either re-wire the tab
  or strike the marketing claims. (Highest-priority copy item if confirmed.)
- **Missing USPs** (shipped, never told): "**what you see = what ships**" single-source; the **6-archetype
  app**; the **PRIMITIVES/HELPERS/PATTERNS manifest**.
- **CDN undersell**: "Shipping with launch" (MarketingPage:358, DocsPage:215) → it's **LIVE now** at
  kit.uicockpit.com. llms.txt has NO CDN section at all.
- **⚠️ OSS/repo mismatch**: MktFooter:57 + llms.txt:2 advertise "Open-source / MIT" + link to
  github.com/AlexanderKaan/uicockpit — which is **PRIVATE → dead 404 link** for visitors. Soften until public.
- Old brand-name presets in llms.txt/index.html (Facebook/Instagram/Spotify…) — trademark risk +
  inconsistent with the Styles+Themes model → use real COLOR_THEMES (cobalt/sky/jade/violet/ember/rose/mono).
- Icon "5 libraries" but lists 4 names (Phosphor regular+bold = 2).

### Bouquet interactivity — THE key insight:
The home bouquet renders the **real `<ComponentGallery limit={34}>`** and **almost every card is already
fully interactive in code** (real `useState`+handlers: Switch, Table, Slider, RadioCard, Chart, Date,
Banner, Popover, DataTablePro, Combobox, Dialog, Select, SlotPicker, TagInput, Tabs, InputOtp, Sheet…).
They're **frozen by the wrapper**, not dead renders:
- `pointer-events: none` (marketing.css:361) + `aria-hidden="true"` (ComponentBouquet.tsx:54) + the
  ±220px over-width clip/bottom-mask (marketing.css:369).
→ **To make it interactive = 3 wrapper changes, NOT per-component wiring:** (1) drop/scope `pointer-events:none`,
(2) drop `aria-hidden` + add a real region label, (3) rework the clip + lower `limit` to the few fully-visible
top cards so controls aren't half-clipped. Keep genuinely decorative cards static (Avatar, DescriptionList,
Validation-state-demo, Stat, Kanban). The brand-colour switcher stays the headline interaction.

---

# ✅ DIAGNOSIS COMPLETE — all 10 items reviewed. Execution backlog = Waves 1-6 (kit) + the item-2/8/9/10 actions above.
