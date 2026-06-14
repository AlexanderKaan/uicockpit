# Tailwind Application-UI — variant-level coverage audit + build plan

**Why this exists.** Alexander pushed back on a too-easy "we're complete" claim
made at the *category* level. Each Tailwind App-UI category has many distinct
*variants* (Calendars = 8 views, Tables = 19, …). We crawled **all 49
Application-UI category pages** via the Claude-in-Chrome MCP (the variant names
are public even un-subscribed) and diffed every variant against our kit.

**Verdict:** ~85% of variants are **cosmetic** (dark/light · pill/flat · sizes ·
with-icon · borders) → covered by our modifiers/themes/composition. But there is
a real set of **distinct missing patterns**. **Decision (Alexander): build ALL of
the gaps**, Tier-1 first, in committed batches. **None need a new atom** — all
composable from existing atoms/components.

---

## THE BUILD LIST (build all, in this order)

### Tier 1 — headline (build first) ✅ DONE (commits 4c2cd1f calendars · 001c39c tables)
- [x] **Calendar · Week view** — `.calendar-week` time-grid (rail + 7 day cols, events by --from/--span). (4c2cd1f)
- [x] **Calendar · Day view** — `.calendar-week--day` (single column). (4c2cd1f)
- [x] **Calendar · Year view** — `.calendar-year` (12 mini `.calendar` grids, current-month ring). (4c2cd1f)
- [x] **Calendar · Double / range** — `.calendar-range` (two months, container-query stack, range band across both). (4c2cd1f)
- [x] **Table · grouped rows** — `.tbl__group` subheader rows. (001c39c)
- [x] **Table · summary / footer row** — `<tfoot>` totals (heavier rule + semibold). (001c39c)
- [x] **Table · condensed density** — `.tbl--condensed`. (001c39c)
- [x] **Table · responsive** — `.tbl-responsive` + `.tbl--stack` + `.tbl__col--optional` (container-query: drop cols, then reflow to label/value cards). (001c39c)

### Tier 2 — distinct patterns
- [ ] **Empty state · with action grid** — empty-state + a `.bento` of "starting point" / template cards.
- [ ] **Labeled divider** — a centered label/title/"OR" on the hairline (`.divider--label` or a `.divider` recipe; today `.sep` is plain).
- [ ] **"Well" variant** — sunken/recessed surface for `card` + `action-panel` (`--well`, uses `--k-surface-sunken`). (Tailwind: Cards "Well", Action panels "Simple well / With well".)
- [ ] **Input add-ons** — leading/trailing add-on (prefix `https://`, suffix `.com`) + **inset label** + **overlapping label** input variants. Atom-level (`.in` variants).
- [ ] **Section/Page header · with tabs** — a sub-nav tab row in the header (`.section`/`.page-head` + `.tabs`). Tailwind: Section headings "With tabs / With actions and tabs / With inline tabs".
- [ ] **Page header · breadcrumb slot** + **banner-image** header variant.
- [ ] **Form · labels-on-left** — horizontal label layout (`.form-panel--horizontal` / `.lab--left`).
- [ ] **Stacked list · two-column** + **sticky group headings** (`.list` variants).

### Tier 3 — minor
- [ ] **Color picker** — radio swatches (`radio-group` "Color picker" variant).

### Per-item checklist (every recipe)
recipe (tokens only, match `.page-head`/`.section`/`.entity-card` quality) → tier
in `segments.ts` (`section` for page-parts, `atom` for input/divider variants) →
gallery card demonstrating it + modifiers → build green (verify:icons · audit:type ·
audit:modifiers · audit:craft ratchet · provenance) → `vitest run -u` (additive) →
verify live. Commit per batch.

---

## FULL VARIANT CATALOG (the crawl — source of truth)

Coverage key: ✓ covered (modifier/composition) · ⚠ partial · ❌ GAP (in build list).

- **application-shells/stacked** (8): ✓ all — nav-on-top shell cosmetic variants → `scaffold`/`navsuite` topbar. (two-row nav ⚠ minor)
- **application-shells/sidebar** (8): ✓ — sidebar shell, light/dark/header/brand → `scaffold`/`navsuite` sidebar.
- **application-shells/multi-column** (6): ✓ — 3-col / sticky / narrow-sidebar → `pane`/`l-sidebar`/workspace.
- **headings/page-headings** (8): ✓ mostly (`page-head`); ❌ breadcrumb slot, ❌ banner-image header.
- **headings/card-headings** (6): ✓ — `card__head`/`section`.
- **headings/section-headings** (10): ✓ mostly (`section`); ❌ with-tabs / with-inline-tabs.
- **data-display/description-lists** (5): ✓ (`dl`); striped/two-column ⚠ may need modifiers.
- **data-display/stats** (5): ✓ — `stat-tile` (trending/cards/brand-icon/shared-borders).
- **data-display/calendars** (8): Small-w-meetings ✓ · Month ✓ · **Week ❌ · Day ❌ · Year ❌ · Double ❌** · Borderless stacked/side-by-side ⚠ cosmetic.
- **lists/stacked-lists** (14): ✓ mostly (`list`); ❌ two-column, ❌ sticky group-headings.
- **lists/tables** (19): ✓ most (`data-table`: toolbar/checkboxes/sortable/sticky/avatars/states/pagination/border/uppercase/striped); **❌ grouped-rows · summary-rows · condensed · responsive (stacked/hidden cols on mobile)**.
- **lists/grid-lists** (7): ✓ — `file-grid`/`media`/`bento`/`entity-card`.
- **lists/feeds** (3): ✓ — `timeline`/`activity-feed`.
- **forms/form-layouts** (3): ✓ two-column (`form-panel`); ❌ labels-on-left.
- **forms/input-groups** (20): ✓ most (`in`/field variants); ❌ add-ons (leading/trailing/inline), ❌ inset/overlapping label. (pill/icon/error/disabled/hint/shortcut ✓)
- **forms/select-menus** (6): ✓ — `select`/`combobox`.
- **forms/sign-in-forms** (3): ✓ — `auth` (split-screen ⚠ variant).
- **forms/textareas** (5): ✓ — textarea + `composer` (with-actions).
- **forms/radio-groups** (12): ✓ most (`radio-card`); ❌ color-picker (Tier 3), radio-table ⚠.
- **forms/checkboxes** (4): ✓ — `check`.
- **forms/toggles** (5): ✓ — `switch`/`toggle`.
- **forms/action-panels** (8): ✓ — `action-panel` (simple/link/button/toggle/input/danger); ❌ "well" variant.
- **forms/comboboxes** (4): ✓ — `combobox`.
- **feedback/alerts** (6): ✓ — `alert`/`banner` (accent-border ⚠ modifier).
- **feedback/empty-states** (6): ✓ simple (`empty-state`); ❌ with action/templates grid.
- **navigation/navbars** (10): ✓ — `navsuite` (search-in-bar ⚠).
- **navigation/pagination** (2): ✓ — `pagination`.
- **navigation/tabs** (9): ✓ — `tabs`/`segctrl` (pills/underline/badges).
- **navigation/vertical-navigation** (6): ✓ — `navigation-row`/`sidebar`.
- **navigation/sidebar-navigation** (5): ✓ — `sidebar`/`tree` (expandable).
- **navigation/breadcrumbs** (4): ✓ — `pagination-breadcrumb`.
- **navigation/progress-bars** (8): ✓ — `progress` (linear) + `stepper`/`wizardstepper` (panels/bullets/circles = steps).
- **navigation/command-palettes** (8): ✓ — `command-palette`.
- **overlays/modal-dialogs** (5): ✓ — `dialog`/`alert-dialog`.
- **overlays/drawers** (11): ✓ — `sheet-drawer` (examples = content compositions).
- **overlays/notifications** (6): ✓ — `toast-stack`.
- **elements/avatars** (10): ✓ — `avatar`/avatar-group/story-ring.
- **elements/badges** (15): ✓ — `badges-pills` (+ `chip`/`tag-input` for removable).
- **elements/dropdowns** (3): ✓ — `dropdown-menu`.
- **elements/buttons** (8): ✓ — `buttons` (primary/secondary/soft/icon/rounded/circular).
- **elements/button-groups** (5): ✓ — `button-group`.
- **layout/containers** (5): ✓ — `l-*`/`pane`.
- **layout/cards** (10): ✓ — `card`/`card__head`/`card__foot`; ❌ "well" variant.
- **layout/list-containers** (7): ✓ — `card`/`list`.
- **layout/media-objects** (8): ✓ — `l-cluster` compositions.
- **layout/dividers** (8): ✓ plain (`separator`/`sep`); ❌ labeled/with-title/with-button divider.
- **page-examples/home|detail|settings** (2 each): ✓ — our showcases + "Page recipes" proof.

---

## RESUME POINT (post-compaction)
Tier-1 build not started. Begin with **Calendar week/day/year/range**, then
**Table grouped/summary/condensed/responsive**, then Tier-2, then Tier-3.
Chrome MCP "Browser 1" (deviceId `2a6c8428-9997-4932-a5fa-f156d5844a1f`) can
re-read any Tailwind page if a variant's exact anatomy is needed. The kit's
tier model: Atom · Component · Section · Page; new page-parts → `section` tier in
`src/kit/segments.ts` (`SECTION_USES`); recipes in `src/kit/recipes/index.ts`;
gallery cards in `ComponentGallery.tsx` tagged `'section'`/`'atom'`.
