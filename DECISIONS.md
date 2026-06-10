# Cockpit — Design Decisions & Deliberate Trade-offs

Things that look like they could be "improved" but were chosen on purpose.
Read this so the rebuild doesn't quietly undo a deliberate decision.

## Positioning

- Cockpit generates a **framework-neutral** design system. It is **not** a
  shadcn theme editor — that space is taken (TweakCN). The three differentiators:
  character controls, neutral framework-agnostic output, and the BRIEF.md
  AI-handoff document. Do not couple the output to any one framework.
- The audience is "vibe coders" — people building an app who want a coherent
  starting point without being designers.

## The token model

- **One canonical token model.** `buildTokens(config)` is the single source of
  truth; all four exports are transformations of it. Never let an export compute
  a value independently — it must come from `buildTokens`.
- Three conceptual token tiers: primitive → semantic → component. The 60 tokens
  are the semantic/component layer.

## Component workflow — build in the system first (binding)

When a new app page needs a component the kit doesn't have yet, **do not build
it inline in the app view.** App views and the component set must never diverge:
a kit someone imports has to apply across their *whole* UI, not just our
showcase. The order is fixed:

1. **Discuss** which component is missing — name it, and find the closest
   existing primitive it composes from.
2. **Build it in the system first**, token-driven and on existing primitives:
   - a gallery card in `src/stage/views/ComponentGallery.tsx` (the live showcase),
   - a recipe in `src/export/componentRecipes.ts` (lands in the downloaded `tokens.css`).
3. **Only then** compose the app page out of those system components.

- **Generic names, never domain names.** System components get reusable names
  (`.radio-card`, `.grade`, `.albumcard`) — not `.delivopt`, `.energy`. If a
  reference is too domain-specific (e.g. Coolblue's EU energy *arrow*),
  generalize it (→ an A–G `.grade` chip) before adopting it.
- **Why binding:** robustness is the kit's core promise. A component that lives
  only in an app view is invisible to an importing user — their "slightly off"
  interface never snaps straight. A component is "done" only when it exists in
  both export surfaces (preview CSS + `componentRecipes`) and the gallery.

## List treatments — table vs card-list vs panel rows (binding)

Lists are the #1 place a UI silently drifts: the same "list of things" gets
three different looks across pages. We use **exactly three** treatments, chosen
by the *task and the nature of the row* — never by taste, never a fourth.

| Treatment | Recipe | Choose when | In SupaDash |
|---|---|---|---|
| **Data table** | `.tbl` (zebra rows, column heads, checkbox bulk-select, sortable, paginated) | Users **scan / sort / compare / multi-select / paginate** many *homogeneous records* whose metadata aligns in columns. The set is large. | Inbox · Messages, Orders, Products, Projects (List), Domains, Logs |
| **Entity card-list** | bordered rows, each a self-contained card, separated by `--k-stack-gap` | Each row is a **distinct entity you manage individually** (avatar + identity + role/status + per-row action), and there are *few* of them. Emphasis on the thing, not the dataset. | Settings · Members (roster), saved kits |
| **Panel list rows** | `.convo` / `.notif-item` / `.list` (borderless, hover-bg, inside a card) | A **continuous feed/stream** read top-to-bottom inside a container; chronological; tap-to-open; not columnar. | Messages thread, Notifications, Activity |

Decision order (first match wins):
1. Need select / sort / compare / pagination over many rows? → **data table**.
2. Is each row a distinct entity managed on its own, few in number? → **entity card-list**.
3. Is it a stream read top-to-bottom inside a panel? → **panel rows**.

Worked example (the two that look different on purpose):
- **Inbox › Messages = table** — 8+ items, **checkboxes for bulk archive/delete**,
  a tag column, **pagination to page 12**, triage scanning → a *dataset*.
- **Settings › Members = card-list** — 6 people, each managed individually
  (role, presence dot, row menu), no bulk-select, no deep pagination → *entities*.
Both are correct *because the rule justifies them* — that's the consistency test.

How consistency holds: this rule ships in the AI handoff (`genAiPrompt`,
`genBrief`) under "which list treatment", so an importing tool applies the same
choice. Same data shape → same treatment on every screen.

## Card colouring — when a surface tints (binding)

**Default: a card surface is NEUTRAL.** It uses `--k-surface` / `--k-surface-2`,
never a brand or decorative hue. Colour enters a card only through small,
role-bearing elements *inside* it — never by tinting the card body for
decoration. (Quick-action cards = neutral card + a coloured icon chip; KPI
cards, chart cards = fully neutral.)

A card **surface itself** changes colour in exactly three cases:

1. **State** — selected / active / current → `--k-state-selected-bg`
   (+ `--k-state-selected-fg` + ring). Whether this reads neutral or brand is
   the user's **Selection-accent** control; never invent a per-card tint.
2. **Semantic role** — the card *is* a success / warning / danger / info
   message (an alert, a callout, an "action needed" banner) → that role's
   `--k-{role}-soft` fill + `--k-{role}-soft-fg`. The colour carries the
   meaning; a card that's merely *about* money/health/etc does NOT qualify.
3. **Hover** (interactive cards) — a neutral wash (`--k-state-hover`) or a lift
   (shadow + `translateY`), **never a hue**.

Colour that's allowed *inside* a neutral card, because it carries
identity/meaning, not decoration:
- **Icon chip** — decorative `--k-accent-N-soft` + `-soft-fg` (category/identity).
- **Status dot / badge** — semantic (state).
- **Delta pill** — semantic success/danger (direction).
- **Chart series** — `--k-chart-1..6` (data).
- **The one primary CTA** — `--k-primary` fill (action). One per card, max.

Litmus test: *"Does this colour encode state, role, identity, or data?"* If yes,
it lives on a small element. If it's just "make the card pop", it's wrong —
the card stays neutral and hierarchy comes from elevation, weight, and spacing.

## Colors

- **The three-brand-color model is not sacred.** It exists, but presets
  deliberately use it the way real SaaS products do: one carrying color, a
  near-neutral secondary, a quiet accent. "What works for a clean interface"
  beats "three equal colors". A user *can* push secondary/accent louder; the
  presets just don't.
- **System colors are fixed, not user-pickable.** Green=success, red=danger etc.
  is universal meaning, not taste. They derive (shift with light/dark + neutrals)
  but their hue is locked. This was a deliberate call — do not add pickers.
- **Contrast is checked against text-on-button**, not color-as-text-on-white. A
  primary's job is to be a button surface. All eight presets pass this check in
  light and dark; keep it true if you touch the color engine.
- The color engine clamps primary lightness to keep button text legible — see
  SPEC §2. This is why Ink stays near-black instead of being flattened to gray.
  An earlier version had this bug; don't reintroduce it.
- **Brand-colour picker is the native `<input type="color">` on purpose.** Its
  popup (eyedropper, spectrum, HEX/RGB/HSL fields) is a browser shadow widget we
  can't style — the field layout differs per OS/browser and that's fine. We keep
  it native for zero maintenance, a free eyedropper, and OS-native feel. Don't
  "fix" the field widths by building a custom picker unless full layout control
  becomes a real requirement — that's a deliberate trade-off, not an oversight.

## Surfaces & text crispness (B★2 beauty recalibration — June 2026)

- **Light-mode canvas is a muted ~98% grey, NOT pure white** (`pageBg = nStep(1)`,
  both modes). This **reverses** the earlier "Light = PURE WHITE" decision. The old
  rationale ("a tinted page makes panels look like floating cards") was about a
  *strong / brand-configurable* tint; a whisper-tinted near-white neutral canvas is
  what makes crisp **pure-white cards** (`--k-surface = oklch(100% 0 0)`) pop — the
  Stripe / Linear-light / Notion recipe. Cards floating on the canvas is the
  intended modern look. Don't "restore" the white page — that flattens the surface
  ladder back to white-on-white where cards rely 100% on their border to exist.
- **Surface ladder (light):** canvas 98% < card/raised/overlay pure-white (lift by
  SHADOW, not fill — shadcn popover recipe) < filled-field well 95.8%
  (`--k-input-bg = nStep(2)`, decoupled from `surf.sunken` which stays the deeper
  chrome-nav well). Dark mode already had a proper ladder and is **untouched**.
- **Primary text is near-black** (`SCALE_L_LIGHT` step 12 = 0.16, was 0.244) so
  titles/values/numbers read crisp like shadcn/Linear. Muted (0.503) + faint (0.64)
  stay put → three text tiers with real separation. Only `--k-fg` (+ a hair of
  `--k-track`) reads step 12, so this crisps text without moving any surface/border.
- The full rationale + target values live in `BEAUTY-SPEC.md` (gitignored). Borders
  were deliberately **left as-is** — once the canvas/card contrast carries the
  separation, the existing subtle border is a gentle frame, and lightening it would
  risk the `--k-input-border` 3:1 WCAG floor. Raised-surface shadow tuning is
  deferred to the B★4 overlays pass (with popovers/dialogs actually in view).

## Fonts

- Three-tier font model: all-round sans-serifs usable for body AND display; a
  small display-only serif set (Fraunces, Newsreader, Instrument Serif) offered
  *only* in the display slot; one fixed mono (JetBrains Mono) for Kbd/code.
- A serif is never an all-round interface font — that is why the body-font
  picker offers no serifs. Keep that restriction.
- Reference uses Google Fonts. The rebuild can self-host or use Google Fonts;
  either way keep the same curated list. No paid fonts, no affiliate links —
  that whole avenue was explored and deliberately dropped.

## Mono

- Mono is the **colorless startup state and reset**, not a preset. It is the
  first item in the Starter-theme dropdown; selecting it returns to plain
  black & white. Do not turn it into "theme nine" in the preset list.

## Layout — chosen after exploring alternatives

- **Light chrome, not dark.** An earlier version had a dark panel. It was
  switched to light/neutral because a neutral chrome doesn't skew the perception
  of the preview's own colors — and this tool is all about color. The chrome is
  eight `--app-*` variables; flipping those eight is the whole switch.
- **Panel left, not a top bar.** A top-bar-of-controls layout was considered and
  rejected: Cockpit has ~20 controls in three layers, far too many for a
  horizontal strip. Every comparable tool (theme editors, token playgrounds)
  uses a side panel. The panel is collapsible so the preview can go full-width.
- **One preview at a time, not two side by side.** A dual-preview layout
  (gallery + dashboard simultaneously) was prototyped and dropped: on a 13"
  screen two previews are each too cramped. One-at-a-time with a centered toggle
  won. Cockpit is a configurator, not an A/B comparison tool — two previews of
  the *same* theme added width pressure without enough payoff.

Don't quietly revert any of these three — they were each the end of a real
exploration.

## Things removed on purpose

- **Import** (loading a tokens.json back in) — removed; planned as a Pro feature.
- **Example-screen toggle** (an older, static demo) — replaced by the current
  interactive demo dashboard.
- **Motion replay button** — a toy; removed. The Motion *control* stays (it
  drives real tokens).
- These were removed deliberately. Don't re-add them as "missing features".

## Icons — see ICONS.md

The reference's stroke-width-faked icon styles are the **one thing that should
change** in the rebuild: five real libraries instead. Everything else should
match the reference.

## Known open items (not blockers, but worth knowing)

- **The name "Cockpit" collides** with an existing well-known open-source
  project (the Linux server dashboard). Fine for a prototype; a real product
  with Pro accounts should re-check this — SEO and brand confusion are real
  risks. Flagged, not resolved.
- **No real browser/device testing has been done.** Every reference version was
  validated by "does the JSX compile" — that proves it parses, not that it
  works. The rebuild should include actual testing: the dropdown on touch, the
  masonry on narrow screens, the URL-hash share flow end to end.
- The reference is one 119KB HTML file with CDN React + Babel. That was a
  prototype choice; the rebuild (Vite + TS) fixes it. Mentioned so you know the
  single-file shape is not a constraint to preserve.

## Build philosophy

The reference was built in many small iterations, each validated that the JSX
compiles and braces balance. For the rebuild: keep that discipline but go
further — real component tests, and a manual pass through every control and both
preview views before calling it done.
