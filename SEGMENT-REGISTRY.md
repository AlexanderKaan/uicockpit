# Segment Registry

The single vocabulary for UICockpit's component model. Every recipe is one
**segment** classified into the 4-layer ladder, with explicit `uses` edges (the
composition graph). This is the seed of "one source / one language": from this
graph the front-end (workbench / blocks catalog / pages), the exports, the
distribution dependency-closure, the cross-links and the audits are all *derived*
— no separate demo/app/recipe languages synced by greps.

> **Encoded (North Star step 1).** The graph below is no longer paper — it lives
> in **`cockpit/src/kit/segments.ts`** (`FOUNDATIONS`, `BLOCK_USES`, `tierOf`,
> `usesOf`, `orphanAtoms`), heads every exported kit via the manifest banner, and
> is guarded by **`src/kit/__tests__/segments.test.ts`** (every `uses` edge points
> at a real recipe; tiers partition cleanly; the orphan list is asserted). This
> doc holds the human rationale + per-segment notes; `segments.ts` is the machine
> truth. Edit the graph there; this doc follows.

## The 4-layer model

| Tier | Test | Front-end home | Surface? |
|---|---|---|---|
| **Foundation** | a token or a non-component spec/behaviour | the panel + a Foundations doc | n/a |
| **Atom** | only makes sense *inside* something else | the **workbench**, shown bare | no fake card |
| **Block** | smallest thing that stands on its own as a believable piece of app | the **blocks catalog** | the surface IS the component |
| **Page** | an assembly of blocks = a realistic screen | the **pages** (curated, never exhaustive) | composed |

`uses` = the segments a node composes from (Block → Atoms, Page → Blocks). It is
**declared**, so "used in" / "in het wild" / coverage are graph reads, not greps.

---

## Foundation (not catalog components)

The token layer itself — **colour · type · shape · space · motion** — lives in the
panel (`buildTokens`), upstream of every segment. Plus three current recipes that
were mis-filed as `helper` and are really foundations:

| id | was | note |
|---|---|---|
| `button-finish` | helper | a styling **modifier** (clean/tactile/soft) — a token axis on button, not a component. Fold into button's variant axis. |
| `roll-down-item-stagger` | helper | a **motion behaviour**, not a component. → motion foundation. |
| `twocolumnlayout` | helper | **page-scaffold** layout primitive, not a showcaseable component. → layout foundation. |
| `layout-primitives` | — | the **Every-Layout** set: `.l-stack` · `.l-cluster` · `.l-switcher` · `.l-grid` · `.l-sidebar` · `.l-center` (token-driven, framework-neutral). Plus the **measure tokens** (`--k-measure-narrow/prose/wide`, in ch) that `.l-center` caps to — the layout grammar (North Star step 4), killing magic px widths. |

---

## Atoms (workbench, bare) — ~48

| id | uses | note |
|---|---|---|
| `buttons` | — | the button |
| `card` | — | **the honest "jasje"** — a real surface primitive; blocks compose ON it |
| `button-group` | buttons | |
| `badges-pills` | — | |
| `alert` | — | inline messaging primitive |
| `banner` | — | full-width announcement primitive |
| `tabs` | — | |
| `table` | — | the bare table primitive (the **data-table BLOCK** = table+toolbar+pagination, see gaps) |
| `tooltip` | — | |
| `avatar` | — | incl. `.avatar__img` photo variant |
| `switch-toggle` | — | |
| `slider` | — | |
| `progress` | — | incl. `--indeterminate` |
| `skeleton` | — | loading primitive |
| `select-trigger` | — | |
| `spinner` | — | incl. `--sm/--lg` |
| `navigation-row` | — | nav item row (used in sidebar) |
| `kbd` | — | |
| `code` | — | inline code |
| `accordion` | — | disclosure primitive (native `<details>`) |
| `pagination-breadcrumb` | buttons | pagination + breadcrumb nav primitives |
| `sparkline` | — | **was pattern** → micro-viz atom |
| `combobox` | — | autocomplete input |
| `dropdown-menu` | — | the `.menu` primitive (Menubar/Context reuse it) |
| `stepper` | — | step indicator (wizardstepper composes it) |
| `tag-input` | badges-pills | input with tag chips |
| `popover` | — | overlay primitive |
| `hover-card` | — | overlay primitive |
| `segmented-control-toggle-group` | — | |
| `separator` | — | **was helper** → layout/divider utility |
| `description-list` | — | key/value data-display primitive |
| `input-otp` | — | |
| `attachment-chip-family` | — | **was pattern** → chip atom + variant family |
| `inline-status-meta-micro-components` | — | **was helper** → micro inline atoms |
| `navigation-menu` | dropdown-menu | nav primitive with flyout |
| `context-menu` | dropdown-menu | right-click menu |
| `form` | — | form field/label/help styling — **merge candidate** with form-primitives |
| `form-primitives` | — | label/field/help — **merge candidate** with form |
| `numberinput` | — | |
| `passwordinput` | — | |
| `searchinput` | — | |
| `phoneinput` | — | |
| `list` | — | list-row primitive — **absorb** interactive-list-row |
| `interactive-list-row` | — | **was helper** → merge into `list` |
| `radio-card` | — | selectable radio rendered as a card |
| `toolbar` | buttons, searchinput, separator | **was helper** → layout atom (container) |
| `aspect-ratio` | — | layout utility |
| `scroll-area` | — | layout utility |

---

## Blocks (catalog, surface = component) — 28

| id | uses | note |
|---|---|---|
| `data-table` | table, toolbar, pagination-breadcrumb, select-trigger | **the flagship** — matrix-complete: toolbar · selection/bulk bar · empty/loading/error state slot · footer (rows-per-page + pagination) · content-stress helpers. North Star step 2; first Gap closed. |
| `form-panel` | form, form-primitives, buttons, select-trigger, numberinput, phoneinput, switch-toggle, radio-card | the editing surface — header · labelled fields on a responsive grid · titled sections · inline validation summary · footer action bar. North Star step 3; the `form-panel` Gap closed. |
| `filter-bar` | searchinput, tag-input, select-trigger, segmented-control-toggle-group, slider, buttons | the query surface above a list/table — search · facet selects · scope toggle · range slider · active-filter chip row (count + Clear all). North Star step 4a. |
| `sidebar` | navigation-row, avatar, badges-pills | app-shell nav — *genuinely comes in the jacket* |
| `dialog` | card, buttons | overlay block |
| `alert-dialog` | card, buttons | confirm modal |
| `sheet-drawer` | card, buttons | side drawer |
| `command-palette` | searchinput, list, kbd | |
| `toast-stack` | — | overlay block |
| `lightbox` | buttons | **was pattern** fullscreen viewer |
| `empty-state` | buttons | complete "state" block |
| `auth` | form-primitives, passwordinput, buttons, card | **was pattern** login/signup — Signup composes the `.pwinput` (eye + strength) |
| `wizardstepper` | stepper, form-primitives, buttons | **was pattern** multi-step |
| `file-upload-dropzone` | buttons | |
| `file-grid` | card, badges-pills | **was pattern** |
| `calendar` | buttons | month grid |
| `pricing` | card, buttons, badges-pills | **was pattern** |
| `stat-tile` | card, sparkline, badges-pills | **was pattern** KPI tile |
| `usage-meter` | progress | **was pattern** labeled meter |
| `chart` | card | presentational viz in a surface |
| `infocard` | card, buttons | **was pattern** |
| `timeline` | avatar, badges-pills | **was pattern** |
| `activity-feed` | avatar, badges-pills, list | **was pattern** |
| `danger-zone` | card, buttons | **was pattern** |
| `carousel` | buttons | **was pattern** |
| `codeblock` | code, buttons | code block w/ header + copy |
| `menubar` | dropdown-menu, buttons | app menu bar |
| `resizable` | — | layout split-pane block |

---

## Pages (curated, never exhaustive) — external (SupaDash)

Not recipes — they live in `DemoDashboard.tsx` as the SupaDash screens. In the
registry they become the **Page tier**, each declaring the blocks it composes:

`Home · Projects · Docs · Inbox · Contacts · Support · Cloud · Billing · Media · Calendar · Settings`

e.g. `Docs` → uses: sidebar, menubar, toolbar, tabs, resizable, codeblock, list …

---

## Summary

| Tier | count |
|---|---|
| Foundation (recipe-level) | 4 (+ the token system) |
| Atom | 48 (26 composed by a block · 22 blessed standalone) |
| Block | 28 |
| Page | ~11 (external, SupaDash) |

**`helper` is dissolved (7 → resolved):** toolbar→Atom, separator→Atom,
interactive-list-row→merge `list`, inline-status-micro→Atom · twocolumnlayout→Foundation,
roll-down-stagger→Foundation, button-finish→Foundation.

**Reclassified pattern→Atom:** sparkline, attachment-chip-family.

**Merge candidates:** `form` + `form-primitives` (one form-field atom);
`interactive-list-row` into `list`.

## Orphan-atom worklist (the coverage contract, derived)

The coverage contract: **every atom is either composed by a block OR blessed as a
legitimately-standalone primitive.** `orphanAtoms()` = atoms that are neither — it
should stay **empty**, and `segments.test.ts` asserts it. The list *drove* which
blocks to build (34 → 30 → 25 → **0**).

**✅ Converged — 0 orphans.** History:
- `data-table` (step 2) adopted `table·toolbar·pagination-breadcrumb·select-trigger` (34→30)
- `form-panel` (step 3) adopted `form·switch-toggle·numberinput·phoneinput·radio-card` (30→25)
- `filter-bar` adopted `slider·tag-input`, `auth` adopted `passwordinput`, and the
  remaining overlay/utility/standalone-control primitives were **blessed**
  (`STANDALONE_ATOMS`) (25→**0**)

### Blessed standalone atoms (`STANDALONE_ATOMS`, 22)
Primitives that attach to *anything* and have no single host block, so they satisfy
coverage on their own (forcing a fake parent would be dishonest):
- **overlays** — tooltip · popover · hover-card · context-menu
- **standalone controls / nav** — tabs · accordion · segmented-control · navigation-menu · button-group
- **self-contained input controls** — input-otp · combobox · interactive-list-row (`.list__row`)
- **inline messaging / status** — alert · banner · inline-status-micro · attachment-chip-family
- **loading & layout utilities** — skeleton · spinner · separator · aspect-ratio · scroll-area
- **data-display** — description-list

> The registry's deliberate answer to "atoms only meaningful *inside* something but
> belonging to no single block": bless them, don't force a parent. The blessing is a
> tracked classification (in `segments.ts`, asserted in the test), not a loophole.
> Remaining Gaps below (app-shell, stat-row, detail-view) are *enrichments*, not
> coverage requirements.

## Gaps the graph reveals (blocks we *assemble in-app* but don't ship as a segment)

These are composed live in SupaDash but have **no first-class Block recipe** — the
highest-value things to promote into the catalog:

- ~~**data-table**~~ ✅ **SHIPPED (step 2)** — promoted to a first-class block, matrix-complete
- **app-shell** (sidebar + topbar/page-header)
- **page-header** (title + tabs + actions)
- **settings-section** (`.list--settings` rows + save bar)
- ~~**form-panel**~~ ✅ **SHIPPED (step 3)** — labelled fields on a grid + validation + footer action bar
- **stat-row** (a row of stat-tiles)
- **detail / record view** (a "show one entity" panel)

## Open calls to confirm (borderline)

- `card`, `alert`, `banner`, `accordion`, `navigation-menu`, `tag-input` → kept as
  **Atoms** (used inside blocks). Confirm none should be Blocks.
- `chart`, `usage-meter`, `stat-tile`, `empty-state` → kept as **small Blocks**
  (they have a head/body/surface). Confirm none should drop to Atoms.
- `resizable`, `toolbar` → layout things: resizable=Block, toolbar=Atom. Confirm.

## Semantic role coverage (vs Material 3) — North Star step 3

The token contract's **semantic colour roles**, audited against Material-3's role
set. Every role ships the full quartet `{base, -fg, -soft, -soft-fg}` (the M3
`role / on-role / role-container / on-role-container` shape) — so an agent can map
any M3 role to a `--k-*` token, and every role can do both a solid and a soft fill.

| Kit role | M3 equivalent | base · fg · soft · soft-fg |
|---|---|---|
| `--k-primary` | primary | ✅ (+ `-hover`) |
| `--k-secondary` | secondary | ✅ |
| `--k-accent` | tertiary | ✅ **(soft completed — step 3)** |
| `--k-danger` | error | ✅ |
| `--k-warning` | (M3: custom) | ✅ |
| `--k-success` | (M3: custom) | ✅ |
| `--k-info` | (M3: custom) | ✅ |
| `--k-surface` / `-raised` / `-sunken` / `-overlay` | surface / surface-container-* | ✅ |
| `--k-fg` / `-muted` / `-faint` | on-surface / on-surface-variant | ✅ |
| `--k-border` (+ `--k-input-border`, 3:1 floored) | outline / outline-variant | ✅ |
| `--k-ring` / `-soft` / `-halo` | (focus, beyond M3) | ✅ |

**Gap found & filled:** `accent` (tertiary) was the only role missing its soft
container — every other role had `{base, fg, soft, soft-fg}`. Added
`--k-accent-soft` + `--k-accent-soft-fg` (derived like the other softs) + a
`.badge--accent` consumer. The role matrix is now **uniform and M3-complete**;
the agent contract advertises the full set.
