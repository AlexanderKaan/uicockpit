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

### Tier 2 — distinct patterns ✅ DONE (commits 71fea24 · 47757fe · 2c94bd0 · e26228c)
- [x] **Empty state · with action grid** — `.empty__grid` of `.card--interactive` template tiles. (e26228c)
- [x] **Labeled divider** — ALREADY COVERED (`.sep--labeled` + `.divider-or`); NOT rebuilt (would be a 2nd version).
- [x] **"Well" variant** — `.card--well` (covers card + action-panel-with-well). (71fea24)
- [x] **Input add-ons** — `.in-group`/`.in-group__addon` (prefix/suffix) + `.in__affix` + `.in--inset` + `.in-field`/`.in__overlap`. (47757fe)
- [x] **Page header · with tabs** — `.page-head__tabs` slot. (2c94bd0)
- [x] **Page header · breadcrumb slot** + **banner-image** — `.page-head__crumb` + `.page-head--banner`/`__banner`/`__overlap`. (2c94bd0)
- [x] **Form · labels-on-left** — `.formpanel--horizontal`. (71fea24)
- [x] **Stacked list · two-column** + **sticky group headings** — `.list--cols` + `.list--sticky`. (e26228c)

### Tier 3 — minor ✅ DONE (commit f6e3b04)
- [x] **Color picker** — `.swatch-picker`/`.swatch-picker__opt` radio swatches (`:has(input:checked)` ring). (f6e3b04)

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

## ✅ BUILD COMPLETE (Tier 1 + 2 + 3 all shipped — 2026-06-15)
Every gap in this audit is built, verified live, and committed (10 batches,
`4c2cd1f`…`f6e3b04`). The kit now covers the Tailwind Application-UI variant set
at the variant level. New recipes added: calendar-week/year/range, table
grouped/summary/condensed/responsive, card--well, formpanel--horizontal,
page-head crumb/tabs/banner, in-group/affix/inset/overlap, empty__grid,
list--cols/--sticky, swatch-picker. Sections wall 21→24; ~10 new gallery cards.

**NEXT (the deferred consumer phase, per [[kit-coverage-audit]]):** wire the section
set into the REAL Ledger screens — replace the 16 hand-rolled headers with
page-head/section/entity-card/action-panel — then turn on the **structural-inline
ratchet** (ban inline padding/bg/border/radius/shadow in `sections.tsx`; baseline
only goes down). That's the "stop drift once and for all" enforcement.

Method notes: Chrome MCP "Browser 1" (deviceId `2a6c8428-9997-4932-a5fa-f156d5844a1f`)
re-reads any gated Tailwind page. Tier model: Atom · Component · Section · Page;
page-parts → `section` in `src/kit/segments.ts` (`SECTION_USES`); recipes in
`src/kit/recipes/index.ts`; section gallery cards tagged `'section'` in CARDS; atom
cards must ALSO be added to `ATOM_GROUPS` (the Atoms wall renders from there, not
the CARDS atom-filter).
