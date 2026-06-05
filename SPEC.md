# Cockpit — Functional Specification

This describes everything Cockpit does. The reference HTML (`cockpit-reference.html`)
is the source of truth for exact behaviour, sizing and copy; this document
explains the structure and the *why*. When in doubt, open the reference.

## 1. Layout

Two panes, full viewport height. Light/neutral chrome throughout.

- **Left — the panel (~396px, light, collapsible).** The decision controls,
  grouped in three layers: Essentials (always open), Refine (collapsible),
  Advanced (collapsible). The whole panel can collapse to a narrow strip so the
  preview gets the full width. The panel chrome (background, lines, text, accent)
  is driven by eight `--app-*` CSS variables — changing those eight is what makes
  the chrome light; keep that single point of control.
- **Right — the stage.** A topbar with a **centered** Components / Live dashboard
  toggle (the prominent preview switch). The topbar also holds, right-aligned: a
  save indicator, Share, Code, Export kit. Below the topbar, **one preview at a
  time** — never both at once.

Note: the panel chrome is deliberately neutral and separate from the design
system being built. The preview and demo dashboard render on the *user's* token
colors; the `--app-*` chrome never bleeds into them.

## 2. The token model — the heart of Cockpit

One canonical function, `buildTokens(config)`, takes the ~20 user decisions and
derives **60 design tokens** (CSS custom properties, all prefixed `--k-`). Every
preview component and every export is a transformation of this one output. There
is no second source of truth.

Token tiers, conceptually:

- **Surfaces** — `--k-bg`, `--k-surface`, `--k-surface-sunken`, `--k-surface-2`,
  `--k-surface-raised`, `--k-surface-overlay`. A stack from deepest to highest.
- **Foreground** — `--k-fg`, `--k-fg-muted`, `--k-fg-faint`.
- **Brand** — `--k-primary` (+ `-hover`, `-fg`, `-soft`), `--k-secondary`
  (+ `-fg`, `-soft`, `-soft-fg`), `--k-accent` (+ `-fg`).
- **System / status** — `--k-success`, `--k-warning`, `--k-danger`, `--k-info`,
  each with `-fg`, `-soft`, `-soft-fg`. Fixed hues, see §5.
- **Form & border** — `--k-border`, `--k-input-border`, `--k-ring`, `--k-ring-soft`,
  `--k-bw` (border width).
- **Shape** — `--k-radius-md`, `--k-radius-lg`, `--k-radius-pill`.
- **Spacing** — `--k-space`.
- **Elevation** — `--k-shadow-sm`, `--k-shadow-md`, `--k-shadow-lg`.
- **Motion** — `--k-dur`, `--k-ease`, `--k-state-hover`.
- **Type** — `--k-font-display`, `--k-font-body`, `--k-font-mono`,
  `--k-type-h1`, `--k-type-h2`, `--k-type-body`, `--k-type-small`,
  `--k-ui-weight`, `--k-ui-transform`, `--k-ui-tracking`.

The derivation logic (HSL math, contrast handling, the surface stack) is in the
reference's color engine — port it faithfully. Key rules that matter:

- **Primary lightness is clamped to stay legible.** Light mode keeps the chosen
  lightness but caps it at 52%; dark mode lands on a safe band (46%, or 72% for
  warm yellow/orange hues which sit awkwardly mid-range). This is why a deliberately
  near-black primary (Ink) stays dark instead of being flattened to gray.
- **Contrast is verified against text-on-button**, not color-as-text-on-background.
  A button's job is to be a surface; what matters is that its label is readable.
- **`mono` mode** flattens all saturation so the three brand colors read as one
  neutral gray. It is the default startup state.

## 3. The controls

Default config (the startup state):

```
preset:'', color:'mono',
radius:'soft', density:'normal', typeScale:'normal',
fontDisplay:'Inter', fontBody:'Inter', iconSet:'line',
uiWeight:'semibold', uiCase:'normal', uiTrack:'normal',
elevation:'soft', borders:'subtle', motion:'smooth',
stateLayer:'medium', contrast:'balanced', texture:'clean',
cPrimary:'#3b3b42', cSecondary:'#3b3b42', cAccent:'#3b3b42', neutral:'neutral',
mode:'light',
```

### Essentials (always visible)

- **Starter theme** — a custom dropdown. First item is "Mono" (the colorless
  reset state); then the eight presets (see §4). Picking "Mono" returns to plain
  black & white and clears the active preset. The dropdown shows color swatches
  per row — it is not a plain `<select>`.
- **Brand colors** — three color pickers: Primary, Secondary, Accent. Picking any
  color leaves mono mode. The system derives ~16 tokens from these three.
- **Neutrals** — the gray ramp temperature: cool / neutral / warm. A swatch picker.

### Refine (collapsible)

- **Radius** — none / subtle / soft / round / pill. Swatch picker showing a
  rounded square per option.
- **Mode** — light / dark.
- **Elevation style** — flat / soft / sharp / (default). Shadow character.
- **Motion** — none / snappy / smooth / playful. Drives `--k-dur` / `--k-ease`.
- **Density** — compact / normal / roomy. Drives `--k-space`.
- **Contrast** — soft / balanced / bold. Widens or tightens the surface/text spread.
- **Icons** — the five icon styles. **This is the control that changes — see ICONS.md.**
- **Typeface — display** — headings font. Dropdown grouped by character. Includes
  the three display-only serifs (Fraunces, Newsreader, Instrument Serif).
- **Typeface — body** — body font. Dropdown of all-round sans-serifs only — no
  serifs offered here.
- **UI text — weight** — medium / semibold / bold. Buttons & labels get character
  through weight, not a third typeface.
- **UI text — style** — case (normal / uppercase) and tracking (tight / normal /
  roomy).

### Advanced (collapsible)

- **State-layer** — subtle / medium / bold. Strength of the hover/press overlay.
- **Borders** — off / subtle / on.
- **Type rhythm** — tight / normal / expressive. The type-scale spread.
- **Surface texture** — clean / grainy. An optional noise overlay.
- **System colors** — display only, no picker. Shows the four derived status
  colors (success/warning/danger/info) with their soft variants. They are fixed
  because their meaning is universal; they shift with light/dark and neutrals.

## 4. The presets — eight clean-modern-SaaS starting points

Each preset is one accent color, one typeface, one radius character, on a neutral
gray world. They follow the real recipe big SaaS products use (Vercel, Linear,
Supabase, Stripe): a near-monochrome palette plus one accent; one typeface.
Primary carries the color (muted), secondary is near-neutral, accent is a quiet
companion. The three brand colors are not three equal loud colors.

| id      | label   | character |
|---------|---------|-----------|
| ink     | Ink     | Black, white & a quiet blue — the Apple-HIG default |
| indigo  | Indigo  | Cool grays, indigo accent — the product-app classic |
| azure   | Azure   | Bright blue, crisp and trustworthy |
| emerald | Emerald | Fresh green — the open-source dev tool |
| violet  | Violet  | Confident violet, soft edges |
| slate   | Slate   | Calm neutral blue-gray — the SaaS dashboard base |
| amber   | Amber   | Warm amber accent on a neutral canvas |
| rose    | Rose    | Soft rose-red, friendly and modern |

Exact hex values and per-preset patch (radius, fonts, neutral ramp) are in the
reference's `PRESETS` object — copy them verbatim. All eight pass the
text-on-button contrast check in both light and dark mode; this was verified and
must stay true.

"Mono" is **not** a preset. It is the colorless reset state, reachable as the
first item in the Starter-theme dropdown.

## 5. System colors

Four fixed status colors, derived (not user-pickable): success (green, hue 145),
warning (amber, hue 38), danger (red, hue 4), info (blue, hue 212). Each gets a
readable `-fg` and a soft `-soft` (+ `-soft-fg`) variant for banner fills.
Saturation and lightness shift with light/dark and the neutrals temperature so
they sit inside the system, but the hue is fixed because the meaning is fixed.

The destructive button colour comes from `--k-danger` — it is a derived token,
not a separate brand choice.

## 6. The live preview

Two views, one shown at a time, switched by the centered topbar toggle:

- **Components** — one continuous CSS-columns masonry of ~57 component cards
  covering the full shadcn component set (buttons, inputs, tabs, table, dialog,
  badges, charts, accordion, command palette, etc.). No section headings. Every
  card is built from the tokens. Some components (overlays, dialogs) are shown
  forced-open since the preview is a swatch sheet, not a running app.
- **Live dashboard** — an interactive fake SaaS console ("Northwind"), see §7.

## 7. The demo dashboard

A genuinely clickable SaaS console in the Vercel/Cloudflare genre. A sidebar with
four nav items, each routing to a real page:

- **Overview** — stat cards, a bar chart, an activity feed with status dots.
- **Projects** — a searchable data table (live filter), status badges in four
  tones, a per-row `⋯` menu that opens (View logs / Settings / Delete).
- **Analytics** — three metric tabs that switch the chart, a 7d/30d/90d range
  switch, an SVG line chart, extra stat cards.
- **Settings** — a text field, a radio group, two working toggles, a "danger
  zone" with the destructive button.

Everything is built on the token variables, so changing any decision in the
panel updates the whole dashboard live. This is the real integrity test — it
shows whether the tokens hold up as a whole product, not just as isolated cards.

All data is local and fake. Interactions (filter, tabs, toggles, row menu) are
real and local — no backend.

## 8. Exports

Four outputs. All are pure transformations of the one `buildTokens` result.

- **tokens.css** — every one of the 60 tokens, as CSS custom properties, for
  `:root` (light) and `.dark` (dark). Complete.
- **tokens.json** — the canonical token file, W3C-style. Nine token tiers
  (color, system, radius, shadow, spacing, border, typography, motion, icon),
  plus a `decisions` block (the raw config) and a `dark` block with the
  dark-mode overrides. This file doubles as the save format.
- **Tailwind** — a Tailwind v4 `@theme` block mapping the full token set to
  `--color-*`, `--radius-*`, `--shadow-*`, `--font-*`, `--text-*`, plus a `.dark`
  block. Not a token subset — the whole system, so utilities like `bg-surface`
  and `text-muted` work.
- **BRIEF.md** — a human- and AI-readable document describing the design system
  as a set of decisions, the token CSS, the component list, the usage rules, the
  icon library recommendation, and the accessibility check results. This is the
  file a user hands to an AI coding tool. It is an instruction, not a code dump.

The export modal also has a "Theme Code" style view with the raw files and a
copy button. Share writes the config to the URL hash.

## 9. State & persistence

- All config lives in the URL hash (base64-encoded JSON). This is both the share
  mechanism and the save mechanism.
- No backend, no localStorage. (The reference avoids localStorage entirely; keep
  it that way — the rebuild is a static site.)
- On load, the hash is decoded back into the config if present.

## 10. Language

Interface text is 100% US English — UI strings, preview content, demo dashboard,
exports. (The project went through a Dutch→English pass; do not reintroduce any
non-English copy.)
