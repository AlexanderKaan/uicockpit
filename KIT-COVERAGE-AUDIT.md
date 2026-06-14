# Kit coverage audit — closing the drift, once and for all

**Question (Alexander, 2026-06-14):** every time we build a real screen we end up
inventing blocks → drift. That means the kit doesn't yet cover what a user needs to
build real apps. UIcockpit's purpose is a *starter kit for virtually any app* — a
**small but smart** selection (not every component ever), like Tailwind/shadcn/M3.
What's actually missing, and how do we stop the drift permanently?

---

## Verdict

**The atom + most-block tiers are strong** — 85 exported recipes, shadcn-complete
and then some. **The drift is concentrated in ONE tier: the *section / header*
grammar.** The fix is small: **2 new recipes + 1 enhancement + 1 enforcement
ratchet.** Not a component sprawl — a precise patch to the layer that screens
actually hand-roll.

---

## What we have (85 recipes)

Mapped against the canon, coverage is near-total:

- **shadcn/ui (~46 components):** all present (Accordion, Alert/Dialog, Avatar,
  Badge, Breadcrumb, Button, Calendar, Card, Carousel, Chart, Combobox, Command,
  ContextMenu, DataTable, Dialog, Drawer/Sheet, DropdownMenu, Form, HoverCard,
  Input(+OTP/Number/Phone/Password), Menubar, NavigationMenu, Pagination, Popover,
  Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sidebar, Skeleton,
  Slider, Switch, Table, Tabs, Toast, ToggleGroup/Segmented, Tooltip). **+ extras**
  shadcn lacks: attachment-chips, usage-meter, sparkline, stepper, tag-input,
  lightbox, file-grid, command-palette, KBD, banner, empty-state.
- **Tailwind UI "Application UI" (sections):** Tables ✓ · Feeds ✓ (timeline) ·
  Stats ✓ (stat-tile/strip) · Description lists ✓ · Calendars ✓ · Form layouts ✓
  (form-panel) · Sign-in ✓ (auth) · Dropdowns ✓ · Modals ✓ · Empty states ✓ ·
  Shells ✓ (scaffold/navsuite). **Gaps:** *Page headings* · *Section headings*.
- **M3:** nothing material missing at the section level.

So at the component level we are **not** under-covered. The hole is one tier up.

---

## The evidence: where drift actually happens

In `src/showcases/blocks.tsx` the app builds a "section header" **three
incompatible ways**:

| Treatment | Uses | What it is |
|---|---|---|
| hand-rolled `l-cluster justify-between` | **16×** | title (+subtitle) on the left, actions/link on the right |
| `.card__head` | 8× | a STACKED title+desc (no trailing actions, no divider) |
| `.datatable__bar` | 3× | a table-specific toolbar header |

The 16 hand-rolls are the drift. They exist because **`.card__head` is a stacked
title+desc — it has no "actions on the right" and no header divider**, and because
**there is no screen-level *page header* at all** (the Invoices / Clients / Expenses
titles aren't inside a card, so they're built from scratch every time). The pattern
recurs identically across screens; the kit just doesn't name it.

---

## The definitive missing set (small + smart)

Each earns its slot by **absorbing an existing hand-roll** (proven-needed, not
speculative). Prefer **extending** existing recipes over adding new ones.

### A. `.page-head` — the screen-level header *(NEW, small)*
Title (h2/display) + optional eyebrow/breadcrumb + subtitle + a trailing **actions
cluster** (Export ghost + one primary). The thing every list screen opens with.
- **Absorbs:** the Invoices / Clients / Expenses / Invoice / Cashflow headers
  (currently 5 near-identical hand-rolls).
- **Why small:** one recipe, ~3 elements, pure layout + type tokens.

### B. Section header with actions + divider — *ENHANCE `.card__head`*
Add a **`.card__head--bar` variant**: title left, optional eyebrow, **trailing
actions** (a link or icon-button on the right), and an optional **full-bleed
hairline** under the header (cancel card padding like `.card__foot` already does).
Optionally a compact / `--fill`-tinted header (Alexander's "less tall, slightly
colored, full-bleed divider").
- **Absorbs:** "Recent clients", "Activity", grouped-feed headers — the remaining
  hand-rolled region headers.
- **Why not new:** `.card__head` already exists and ships; we extend its grammar
  rather than add a parallel `.section`. Keeps the kit from growing a near-duplicate.

### C. `.entity-card` — the identity card *(NEW, small)*
Logo/avatar + name + kebab menu, a full-bleed `.sep`, then `.dl`-style meta rows.
The "a thing with an identity + a few key facts" card.
- **Absorbs:** the Recent-clients cards (hand-rolled today).
- **Reusable for:** contacts, team members, repos, projects, integrations,
  connected accounts — a very common modern pattern, hence worth naming.

### D. Rich list-row — *EVALUATE (don't add speculatively)*
The cashflow transaction feed is hand-rolled (leading tinted icon · amount+badge ·
party+logo · trailing meta). Check whether the existing `.list` / "Interactive list
row" already covers it with a leading-media + trailing-meta variant. If it needs one
small modifier, add it; if `.list` covers it, just adopt it. **Decide at build time,
not now.**

### Hygiene, while we're here
`.card__head` is exported **and** has a gallery-workbench override in
`preview-only.css` — fine, but confirm the export is the single source and the
preview block is purely cosmetic (no behavioural fork).

---

## What we deliberately do NOT add (staying small)

- **No per-domain blocks** (no `invoice-card`, no `client-row`). Domain screens are
  *assembled from* A–C + atoms, never given their own CSS.
- **No second wrapper** when an existing recipe can be extended (B over a new
  `.section`).
- A pattern earns a recipe only if it **recurs (≥2 real uses)** or is a known modern
  staple. One-offs stay as composition of existing recipes.

---

## The enforcement: make drift impossible to hide

Adding the recipes fixes *today's* drift. To stop it returning, add a build audit —
same mechanism as the existing `audit:craft` magic-px ratchet:

> **Structural-inline-style ratchet.** Flag inline `style={{…}}` in the app surface
> (`blocks.tsx`) that sets **structural** props — `padding · background · border ·
> borderRadius · boxShadow`. Allow pure **layout** inline (gap, justify, align,
> flex-basis, width/maxWidth, `--l-*`). Baseline = today's count; **it can only go
> down.**

The loop this creates:

> hit a structural-inline need → build pressure → that's the signal a kit pattern is
> missing → add the recipe (gallery-first) → the number drops.

`audit:provenance` already guarantees "no new *classes* off-kit." This adds "no new
*patterns* smuggled in as inline styles." Together they close the hole: **the build
gate forces every composition through the kit, and "what's missing" becomes a list
the gate hands you** — the kit grows only on a real hit, so it stays small and gets
provably more complete with every screen.

---

## Recommended build order

1. **A `.page-head`** + retire the 5 screen headers → first drop in the ratchet.
2. **B `.card__head--bar`** (actions + divider + compact/fill) + retire the region
   headers.
3. **C `.entity-card`** + rebuild "Recent clients" (the canonical proof).
4. **D** evaluate `.list` for the feed; adopt or add one modifier.
5. **Turn on the structural-inline ratchet** at whatever count remains; ratchet down
   over subsequent screens.

Each step: recipe + gallery card first (so it ships to CDN users), then adopt in the
app, then the ratchet records the drop. Build + tests green per step.
