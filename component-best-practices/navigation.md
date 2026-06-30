# Navigation — best-practice library + compliance scan

> Component: the navigation idiom — `.navsuite` (adaptive nav suite) + siblings `.sidenav` · `.appbar` · `.navmenu` · `.navrow`/`.nav-group`/`.navsub` · `.tabs` · `.breadcrumb`/`.pagination` · `.scaffold` (shell) · recipe `cockpit/src/kit/recipes/index.ts`: navsuite `5863–5973` · scaffold `5778–5860` · sidebar `2111–2186` · appbar `2189–2221` · navigation-row `2058–2108` · navigation-menu `4511–4529` · tabs `1264–1319` · pagination-breadcrumb `2867–2925` · scanned 2026-06-30

This audit treats **navigation as one idiom** with the `.navsuite` adaptive primitive at the centre, and the siblings as the surfaces it composes into / coexists with. Usage read covers `ComponentGallery.tsx` (gallery demos), `showcases/sections.tsx` (app surface), and `PagesView.tsx` (the loupe shell — the navsuite/scaffold/sidenav that drive the showcase app are rendered HERE, not in sections.tsx, so PagesView is load-bearing usage for this idiom).

---

## A. Best-practice library (supply)

Numbered rules grouped by theme. Each: **Rule** — *why* — `implementing CSS/token`. `[LOAD-BEARING]` = table-stakes the best-in-class treat as mandatory; `[polish]` = refinement.

### Active / current state (the #1 nav job)
1. **Exactly-one current item, marked semantically with `aria-current`** — *a sighted user reads the styled item; a screen-reader user needs `aria-current="page"` to hear "current page" (W3C ARIA APG; aria-current is more specific than aria-selected for destinations).* — consumer adds `aria-current="page"`; recipe styles `--on`. `[LOAD-BEARING]`
2. **Active reads CHROMATIC, distinct from neutral hover** — *if "selected" and "hovered" use the same wash at the same intensity, the current location is ambiguous; the active item should carry a brand whisper, hover stays neutral grey (Linear, Stripe, Notion convention).* — `.navmenu__item--on` (brand `--k-state-selected-bg`) vs `:hover` (neutral `--k-state-hover`). `[LOAD-BEARING]`
3. **A persistent "rail" tell beyond fill — an accent edge/bar** — *fill alone is low-contrast on tinted chrome; the canonical sidebar current-item tell adds a left accent bar or `--k-selected-edge` so the active row reads at a glance and survives theme changes (this is the kit's own I2 invariant).* — `--k-selected-edge` token (Invariant Engine I2). `[LOAD-BEARING]`
4. **Active weight bump for non-colour redundancy** — *colour is not a sole channel (WCAG 1.4.1); a semibold active label gives a second, colour-blind-safe cue.* — `.navrow--on { font-weight: var(--k-weight-semibold) }`. `[polish]`

### Adaptive morph (bar → rail → sidebar)
5. **One nav reshapes per container width, not three components** — *M3 deprecated the standalone drawer for exactly this morph; bottom bar <600 → collapsed icon rail 600–1199 → expanded rail ≥1200 keeps quick-access in the shape each width can hold.* — `@container scaffold` queries in `.navsuite`. `[LOAD-BEARING]`
6. **Measure the CONTAINER, not the viewport** — *an embedded shell (a pane, a preview) must adapt to its own width; viewport media-queries lie inside split layouts.* — `container-type: inline-size; container-name: scaffold`. `[LOAD-BEARING]`
7. **Consumer-forceable shape (collapse toggle)** — *the rail⇄sidebar collapse is a first-class user control, not only an automatic breakpoint; pin one shape regardless of width.* — `.navsuite--bar/--rail/--expanded`; `.sidenav--rail`. `[LOAD-BEARING]`
8. **3–7 destinations in a rail/bar** — *M3: a rail holds 3–7 items; more belongs in an expanded sidebar with groups.* — usage discipline (no token). `[polish]`

### Collapsed-rail labels & tooltips
9. **Collapsed icon-only nav needs an accessible name + a hover tooltip** — *M3: omit visible labels only if icons are unambiguous, and always keep a semantic label; sighted users need a tooltip to recover the hidden label.* — `.sidenav--rail .navrow[data-tip]::after` + `aria-label`. `[LOAD-BEARING]`
10. **Collapsed rail keeps a meaning cue (micro-label or tooltip), never bare icons** — *bare icon rails fail recognition; M3's collapsed rail keeps micro-labels under icons.* — navsuite 600–1199 keeps `.navsuite__label`. `[polish]`
11. **A count badge collapses to a corner dot on the icon** — *an unread count must survive collapse without a label to anchor it.* — `.sidenav--rail .navrow .badge--count` → 8px dot. `[polish]`

### Section grouping & labels
12. **Group labels (eyebrow caps) chunk long nav lists** — *Miller's law: a flat 12-item list is unscannable; titled groups (Workspace / Commerce) create scannable chunks.* — `.nav-group` (eyebrow caps); navsuite has NO group primitive. `[LOAD-BEARING]`
13. **Group labels collapse to slim dividers in the rail** — *the chunk boundary must survive collapse as a hairline, not vanish or show truncated caps text.* — `.sidenav--rail .nav-group` → 22px centred divider. `[polish]`
14. **Nested/expandable parent rows with a rotating chevron + connector** — *sub-destinations need a disclosure affordance and a visual tie to the parent (the indent guide).* — `.navrow[aria-expanded] .navrow__chev` + `.navsub::before` guide. `[polish]`

### Icon + label alignment
15. **Icon and label share one baseline; fixed icon box; label truncates** — *misaligned icon/label is the most common nav-row craft tell (COMPONENT-CRAFT L1/L3); a long label must ellipsis, not wrap or push the row.* — `.navrow { gap; align-items:center }`, `--k-row-icon` fixed box, `__label { text-overflow: ellipsis }`. `[LOAD-BEARING]`
16. **One row height across the nav (height harmony)** — *mixed row heights read as broken (COMPONENT-CRAFT L3 / Invariant I1).* — `min-height: var(--k-row-h-lg)`. `[LOAD-BEARING]`

### Keyboard & ARIA contract
17. **Nav landmark + accessible name** — *`<nav aria-label="…">` lets SR users jump to and disambiguate multiple navs.* — consumer markup. `[LOAD-BEARING]`
18. **Real focusable controls (`<button>`/`<a>`), visible focus ring** — *nav items must be Tab-reachable with a visible `:focus-visible` ring; don't style `<span>`s as fake links.* — recipe resets `<button>`/`<a>` to row look; global `.navrow:focus-visible` ring (I3). `[LOAD-BEARING]`
19. **Tabs: `role="tablist"`/`role="tab"` + `aria-selected`, roving focus + arrow keys, `aria-controls`→`tabpanel`** — *the APG tabs pattern: one tab stop, arrows move between tabs, each tab controls a labelled panel.* — markup contract (no recipe-side roving). `[LOAD-BEARING]`
20. **Breadcrumb is an ordered list with `aria-current="page"` on the leaf** — *SR announces "list, N items"; the leaf is the anchor, not a link.* — `.breadcrumb` (`<ol>`, `li{display:contents}`, `[aria-current="page"]`). `[LOAD-BEARING]`
21. **Pagination disables prev/next at the ends; current page marked `aria-current`** — *a real pager never pages past first/last and announces the current page.* — `.pagination button:disabled`, `[aria-current='true']`. `[LOAD-BEARING]`
22. **Bottom-bar tap targets meet the hit-target floor** — *thumb-reach bottom bars need ≥24px (kit I4) / ideally 48px touch targets.* — `.navsuite__item` padding; global `--k-hit-min` (I4). `[polish]`

### Motion / restraint
23. **Collapse animates width/margin; tooltip fade honours reduced-motion** — *the rail⇄sidebar transition should be smooth but respect `prefers-reduced-motion`.* — `.sidenav { transition: width… }`; `@media (prefers-reduced-motion) { …transition:none }`. `[polish]`

---

## B. Compliance scan (check)

Status = ✅ PASS / ⚠️ PARTIAL / ❌ GAP. Delegated? = handled in gallery/app usage rather than recipe CSS (then PASS). Severity for non-PASS.

| # | Rule | Status | Evidence (recipe / usage / "absent") | Delegated? | Severity |
|---|---|---|---|---|---|
| 1 | one current, `aria-current` | ✅ PASS | navsuite item `aria-current={…'page'}` (PagesView:428); navrow `aria-current` (PagesView:478, Gallery:2295); breadcrumb leaf (Gallery:442, sections:409) | Yes (markup) | — |
| 2 | active chromatic vs neutral hover | ✅ PASS | `.navmenu__item--on` brand `--k-state-selected-bg` vs neutral `:hover` (4527/4524); `.navrow--on` `--k-state-selected-bg` (2096); `.navsuite__item--on` `--k-primary-soft` vs `--k-state-hover` (5904/5902) | No | — |
| 3 | accent-edge tell beyond fill (`--k-selected-edge`) | ❌ GAP | `--k-selected-edge` (Invariant I2) applied NOWHERE in nav — `.navsuite__item--on`/`.navrow--on`/`.navmenu__item--on` are fill+colour only (5904, 2095-2099, 4527). No left accent bar either. | No | **MED** |
| 4 | active weight bump | ⚠️ PARTIAL | `.navrow--on` + `.navmenu__item--on` bump to semibold (2098, 4527); `.navsuite__item--on` does NOT (5904 sets colour+bg only) | No | LOW |
| 5 | one nav, bar→rail→sidebar morph | ✅ PASS | `.navsuite` `@container scaffold (min-width:600/1200px)` (5908-5931) | No | — |
| 6 | measure container not viewport | ✅ PASS | `.scaffold { container-type: inline-size; container-name: scaffold }` (5791-5792) | No | — |
| 7 | consumer-forceable shape | ✅ PASS | `.navsuite--bar/--rail/--expanded` (5939-5972); `.sidenav--rail` (2163) wired in LedgerSidebar toggle (PagesView:466,504) | No | — |
| 8 | 3–7 rail destinations | ✅ PASS | LedgerSidebar groups; navsuite demos ≤6 items | Yes (usage) | — |
| 9 | collapsed icon nav: name + tooltip | ⚠️ PARTIAL | `.sidenav--rail` has `data-tip` tooltip + `aria-label` (2178-2182; PagesView:476-477). **`.navsuite` collapsed rail has NO tooltip mechanism** — but at 600–1199 it keeps micro-labels (rule 10), so a tooltip is only needed if a consumer forces `--rail` to drop labels. navsuite items lack an explicit `aria-label` (rely on visible `.navsuite__label` text) | Partly | LOW |
| 10 | collapsed rail keeps meaning cue | ✅ PASS | navsuite 600–1199 keeps `.navsuite__label` micro-labels (no rule hides it); only the bottom-bar + forced-rail keep column layout w/ label | No | — |
| 11 | count badge → corner dot in rail | ✅ PASS | `.sidenav--rail .navrow .badge--count` → 8px dot (2177). navsuite has no count-badge demo (no obligation) | No | — |
| 12 | group labels chunk the list | ⚠️ PARTIAL | `.nav-group` eyebrow caps exist + used (sidenav: 2108, 2257; LedgerSidebar:511). **`.navsuite` has NO group/section primitive** — it's a flat 3–7 bar by design, but an expanded sidebar-mode navsuite (≥1200, 224px) can't title-group like `.sidenav` does | No | **MED** |
| 13 | group labels collapse to dividers | ✅ PASS | `.sidenav--rail .nav-group` → 22px divider, first dropped (2172-2173) | No | — |
| 14 | nested parent + chevron + connector | ✅ PASS | `.navrow__chev` rotate on `[aria-expanded]` (2101-2102); `.navsub::before` indent guide (2104). Used Gallery:2267-2275 | Yes (demo) | — |
| 15 | icon/label aligned, fixed box, truncate | ✅ PASS | `.navrow` `align-items:center` + `--k-row-icon` box + `__label` ellipsis (2067,2093,2100); navsuite `__icon` fixed `--k-row-icon`, `__label` ellipsis (5905-5907) | No | — |
| 16 | one row height | ✅ PASS | `.navrow min-height: --k-row-h-lg` (2074); navsuite expanded `min-height: --k-row-h-lg` (5926) | No | — |
| 17 | nav landmark + name | ✅ PASS | `<nav aria-label="Ledger">` (PagesView:487), `<nav aria-label="Breadcrumb">` (Gallery:434, sections:403), `<nav className="navsuite"…aria-label>` wrapper (PagesView:421) | Yes (markup) | — |
| 18 | focusable controls + focus ring | ✅ PASS | recipes reset `<button>/<a>` to row look (2079-2087); all rows are `<button type="button">` (Gallery:2260, PagesView:472); global `.navrow:focus-visible` ring (globalLayer:182). navsuite items are `<button>` (PagesView:425) | Yes (markup+global) | — |
| 19 | tabs: tablist/tab + roving + aria-controls→panel | ⚠️ PARTIAL | `role="tablist"`/`role="tab"`/`aria-selected` present (Gallery:687, sections:180-182). Gallery tabpanel wired `role="tabpanel" aria-labelledby` (697). **No roving tabindex / ArrowLeft-Right key handler on the tab strip; ChartTabs (sections:180) has NO `aria-controls`/panel id wiring** | Partly | **MED** |
| 20 | breadcrumb `<ol>` + leaf aria-current | ✅ PASS | `.breadcrumb` `<ol>`, `li{display:contents}`, `[aria-current="page"]` (2914-2925); used Gallery:435-442, sections:404-409 | No | — |
| 21 | pagination ends disabled + current marked | ✅ PASS | `.pagination button:disabled` (2899), `[aria-current='true']` (2896); used Gallery:1097-1105 (disabled at 1/12), sections:662-664 | No | — |
| 22 | bottom-bar hit target | ✅ PASS | `.navsuite__item` padding `--k-s-6 --k-s-10` + col layout; global `--k-hit-min` AA floor (I4) | No | — |
| 23 | collapse animates + reduced-motion | ✅ PASS | `.sidenav { transition: width/margin/radius/shadow }` (2132-2136); `@media (prefers-reduced-motion){ …transition:none }` for tooltips (2183-2185) | No | — |

**Tally: 18 PASS · 4 PARTIAL (#4, #9, #12, #19) · 1 GAP (#3).** Severity: 0 HIGH · 3 MED (#3, #12, #19) · 2 LOW (#4, #9).

---

## C. Gap worklist (ranked)

1. **#3 — apply `--k-selected-edge` to the active nav item (MED).** The kit promises (Invariant I2) that "selected" carries an inset edge token, but the three nav active-states (`.navsuite__item--on`, `.navrow--on`, `.navmenu__item--on`) are fill+colour only. Add `box-shadow: var(--k-selected-edge);` (or a left accent bar `box-shadow: inset 2px 0 0 var(--k-primary)` for the sidebar idiom) to each `--on` rule so the current location reads at a glance on tinted chrome and can't regress. One line per recipe; candidate for the `audit:state-edge` ratchet to cover nav.

2. **#12 — add a `navsuite` group primitive for the expanded (sidebar) mode (MED).** At ≥1200 the navsuite becomes a 224px sidebar but has no `.navsuite__group` label, so a >7-item expanded navsuite can't chunk like `.sidenav`. Add `.navsuite__group` mirroring `.nav-group` (eyebrow caps, hidden in the bar/collapsed-rail states). Pairs with a gallery demo card (none exists today — see D).

3. **#19 — finish the tabs keyboard contract (MED).** `role="tablist"` is present but there is no roving-tabindex / ArrowLeft-Right handler and `ChartTabs` (sections.tsx) omits `aria-controls`→`tabpanel id`. Add a roving-focus arrow-key handler at the usage layer (a shared `useTablist` helper) and wire `aria-controls`/`id` between each `.tab` and its panel. Recipe CSS is fine; this is a usage/markup fix.

4. **#4 — bump `.navsuite__item--on` to semibold (LOW).** Add `font-weight: var(--k-weight-semibold)` to `.navsuite__item--on` (5904) for colour-independent active redundancy, matching `.navrow--on`.

5. **#9 — give `.navsuite` a forced-rail tooltip + explicit item `aria-label` (LOW).** If a consumer forces `.navsuite--rail` (icon-over-micro-label still shows, so low risk), there's no `data-tip` fly-out like `.sidenav--rail` has. Optional: port the `.sidenav--rail [data-tip]::after` tooltip to `.navsuite--rail` and add `aria-label` to navsuite items so the name survives any label-hiding.

---

## D. Loop notes (meta)

- **Research half was cheap and convergent.** M3 (rail 3–7 items, collapse, icon+tooltip), W3C ARIA APG (aria-current for destinations, tabs roving-focus pattern), and the kit's own COMPONENT-CRAFT/Invariant Engine all pointed at the same load-bearing rows. The nav idiom is broad (8 recipes) but the rules cluster tightly into active-state · adaptive-morph · grouping · a11y-contract.
- **The scan found REAL gaps, not noise.** The standout is #3: the kit *names* a selected-edge invariant (I2) and enforces it elsewhere via `audit:state-edge`, yet the nav active-states never adopted it — a genuine inconsistency, not a false positive. #12 (no navsuite grouping) and #19 (tabs roving focus) are also real.
- **Delegated? column saved two false positives.** `aria-current`, the nav landmark+name, and focusable `<button>` rows look "absent" in recipe CSS but are fully handled in PagesView/Gallery/sections markup + the central global focus layer — all PASS. **PagesView.tsx was essential to read**: the navsuite/scaffold/sidenav that drive the real showcase app live there, NOT in sections.tsx; a sections-only usage read would have wrongly flagged the whole navsuite/sidenav idiom as demo-less.
- **One coverage hole worth noting:** there is **no gallery card for `.navsuite`/`.scaffold`** (the adaptive morph is demonstrated only via the PagesView width slider, which annotates bar/rail/sidebar at 600/1200 but is workbench chrome, not the scanned gallery). The `.sidenav`/`.appbar`/`.tabs`/`.navmenu`/`.breadcrumb`/`.pagination` siblings all have gallery cards; navsuite does not. If #4/#12 add a navsuite `--modifier`, `audit:modifiers` will require a navsuite gallery demo — so the grouping fix (#2 in worklist) should ship with a navsuite gallery card.
- **Format verdict:** split, same as table/calendar. Section A (the 23 rules) is durable `get_design_context`/skill knowledge; Section B/C is a point-in-time scan that goes stale the moment the recipes change. **Mechanizable into `audit:craft`/`audit:state-edge`:** #3 (extend `audit:state-edge` to require `--k-selected-edge` on any `*--on` nav-active rule), #15/#16 (icon-box + row-height harmony already covered by `audit:control-h`-style checks), #21 (pagination ends-disabled is structural).
