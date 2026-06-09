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

## Blocks (catalog, surface = component) — ~25

| id | uses | note |
|---|---|---|
| `sidebar` | navigation-row, avatar, badges-pills | app-shell nav — *genuinely comes in the jacket* |
| `dialog` | card, buttons | overlay block |
| `alert-dialog` | card, buttons | confirm modal |
| `sheet-drawer` | card, buttons | side drawer |
| `command-palette` | searchinput, list, kbd | |
| `toast-stack` | — | overlay block |
| `lightbox` | buttons | **was pattern** fullscreen viewer |
| `empty-state` | buttons | complete "state" block |
| `auth` | form-primitives, buttons, card | **was pattern** login/signup |
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
| Foundation (recipe-level) | 3 (+ the token system) |
| Atom | ~48 |
| Block | ~25 |
| Page | ~11 (external, SupaDash) |

**`helper` is dissolved (7 → resolved):** toolbar→Atom, separator→Atom,
interactive-list-row→merge `list`, inline-status-micro→Atom · twocolumnlayout→Foundation,
roll-down-stagger→Foundation, button-finish→Foundation.

**Reclassified pattern→Atom:** sparkline, attachment-chip-family.

**Merge candidates:** `form` + `form-primitives` (one form-field atom);
`interactive-list-row` into `list`.

## Orphan-atom worklist (the coverage contract, derived)

`orphanAtoms()` = atoms that **no block declares in its `uses`**. Per the locked
coverage rule, every atom must have ≥1 parent block; an orphan is a worklist item
→ **build its home block, or cut/merge.** This list *drives* which blocks to build
next (the Gaps below). It **shrinks** as blocks land; `segments.test.ts` asserts it,
so each shrink is a conscious, tracked event.

**34 orphans today** (of 48 atoms — only 14 are parented at v0, because the block
layer is still sparse). Most are not "unused" — they render directly in SupaDash
*pages*; they simply have no **block** wrapping them yet. Grouped by the block that
will adopt them:

| Future block (the Gap) | Adopts these orphan atoms |
|---|---|
| **data-table** (flagship, step 2) | `table`, `toolbar`, `pagination-breadcrumb`, `select-trigger` |
| **form-panel** | `form`, `numberinput`, `passwordinput`, `phoneinput`, `combobox`, `tag-input`, `input-otp`, `radio-card`, `switch-toggle`, `slider` |
| **app-shell / page-header** | `navigation-menu`, `tabs`, `separator`, `banner` |
| **detail / record view** | `description-list`, `accordion`, `alert` |
| overlay/utility (likely stay atoms, or small blocks) | `popover`, `hover-card`, `context-menu`, `tooltip`, `segmented-control-toggle-group`, `button-group`, `aspect-ratio`, `scroll-area`, `skeleton`, `spinner`, `attachment-chip-family`, `inline-status-meta-micro-components` |
| **cut / merge** | `interactive-list-row` → merge into `list` |

> Borderline atoms (`popover`, `tooltip`, `context-menu`, `hover-card`,
> `segmented-control-toggle-group`…) are genuinely "only meaningful inside
> something" yet have no single home block — these are the candidates to either
> bless as **always-atoms** (relax the contract for true overlay/utility
> primitives) or seat inside a host block when one is built. Decide per-atom as the
> blocks land; don't force a fake parent.

## Gaps the graph reveals (blocks we *assemble in-app* but don't ship as a segment)

These are composed live in SupaDash but have **no first-class Block recipe** — the
highest-value things to promote into the catalog:

- **data-table** (table + toolbar + selection + pagination + empty + loading) — the flagship
- **app-shell** (sidebar + topbar/page-header)
- **page-header** (title + tabs + actions)
- **settings-section** (`.list--settings` rows + save bar)
- **form-panel** (labeled fields + validation + footer actions)
- **stat-row** (a row of stat-tiles)
- **detail / record view** (a "show one entity" panel)

## Open calls to confirm (borderline)

- `card`, `alert`, `banner`, `accordion`, `navigation-menu`, `tag-input` → kept as
  **Atoms** (used inside blocks). Confirm none should be Blocks.
- `chart`, `usage-meter`, `stat-tile`, `empty-state` → kept as **small Blocks**
  (they have a head/body/surface). Confirm none should drop to Atoms.
- `resizable`, `toolbar` → layout things: resizable=Block, toolbar=Atom. Confirm.
