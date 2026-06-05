import { buildTokens, resolveDepth } from '../tokens/buildTokens'
import { nameColor } from '../tokens/color'
import { UI_MONO } from '../tokens/fonts'
import type { Config } from '../tokens/types'

/* Capitalize the first letter of style/colorTheme IDs for display.
 * Our preset IDs are intentionally lowercase ('default', 'cobalt') so they
 * read clean in URL hashes and CLI flags — but in human-facing docs we
 * present them title-cased ("Default", "Cobalt"). */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
import { ICON_LIBS } from './iconLibs'
import { genCss } from './genCss'
import {
  Z_INDEX,
  BREAKPOINTS,
  CONTAINER_WIDTHS,
  buildPalette,
  buildTypeScale,
  auditContrast,
} from '../tokens/extras'

export function genBrief(cfg: Config): string {
  const tk = buildTokens(cfg)
  const themeName = cap(cfg.colorTheme)
  const lib = ICON_LIBS[cfg.iconSet]

  return `# UI Kit Brief — Cockpit

> Hand this file to your AI coding tool (Cursor, v0, Lovable, Claude Code).
> It describes one coherent design system. Do not deviate from it.

## How to use
Apply the tokens to every component you build. Never use hardcoded
colors, radii or spacing — always reference a token.

## The decisions behind this system
- Color theme: ${themeName} (a single brand hue — secondary & accent derived)
- Brand color: ${nameColor(tk.primaryHex)} (${tk.primaryHex})
- Secondary color: ${nameColor(tk.secHex)} (${tk.secHex}) — derived muted sibling
- Accent color: ${nameColor(tk.accentHex)} (${tk.accentHex}) — derived brighter sibling
- System colors (fixed): ${tk.sysList.map((s) => s.k + ' ' + s.hex).join(', ')}
- Neutrals: ${cfg.neutral} gray ramp${cfg.neutral === 'auto' ? ' (auto-tinted toward the brand hue — cohesive "tinted neutral", not flat grey)' : ''}
- Radius: ${cfg.radius} (cards/dialogs/inputs) · Button radius: ${cfg.buttonShape}${cfg.buttonShape === 'match' ? ' (matches the box radius — buttons share corners with cards & inputs, the default)' : ''}${cfg.buttonShape === 'pill' ? ' (pill — fully capsule buttons regardless of card radius)' : ''}${cfg.buttonShape === 'none' ? ' (square — no button corner radius)' : ''}
- **Scale: ${cfg.scale}** — the size + density macro (does NOT change font-weight). ${
  cfg.scale === 'compact'
    ? 'Dense pro-tool feel (Linear/Cursor). Button + input 32px, date cells 28px.'
    : cfg.scale === 'comfortable'
      ? 'Calm, roomy feel (Notion). Button + input 40px, date cells 40px.'
      : 'Clear normalised feel (shadcn-equivalent). Button + input 36px, date cells 32px.'
} Scale cascades to button/input/toggle/date-cell sizing and spacing — don\'t fight it by overriding individual sizes. UI text weight is fixed (semibold), separate from Scale.
- Type rhythm: ${cfg.typeScale}
- Elevation: ${({ flat: 'Flat', soft: 'Subtle', raised: 'Raised', layered: 'Deep' } as const)[cfg.surfaceDepth]} (ramp ${resolveDepth(cfg.surfaceDepth).contrast} · shadow ${resolveDepth(cfg.surfaceDepth).elevation}) · Sidebar: ${({ flush: 'Seamless', recessed: 'Recessed', panel: 'Floating' } as const)[cfg.chrome]} · Border: ${cfg.borders} · Motion: ${cfg.motion}
- Typeface: ${cfg.fontDisplay} (display) / ${cfg.fontBody} (body) / ${UI_MONO} (mono — Kbd & code)${cfg.fontDisplay === 'System' || cfg.fontBody === 'System' ? '\n  — "System" = OS-native stack (SF on Apple, Roboto on Android, Segoe UI on Windows), zero load' : ''}${cfg.fontDisplay.startsWith('Custom: ') || cfg.fontBody.startsWith('Custom: ') ? '\n  — Custom font: drop the .woff2 file in your project and update the @font-face path in tokens.css. To use Adobe Fonts or another foundry instead, replace the @font-face block with the foundry\'s standard <link> snippet.' : ''}
- UI text (buttons, badges, tabs, nav rows, form labels): fixed semibold weight via --k-ui-weight (a system constant — not changed by Scale or Text size), sentence case
  — nav rows, tables and menus sit at the 14px (body) UI floor; uppercase is reserved for the eyebrow role (table heads, stat labels, group labels) via --k-type-eyebrow
- Icons: ${cfg.iconSet} style

## Icons
This kit uses ${lib.label}.
${lib.fill ? 'Icons are filled, not outlined.' : 'Icons are outlined with stroke-width ' + lib.sw + '.'}

Install:
\`\`\`bash
${lib.install}
\`\`\`

Use:
\`\`\`tsx
${lib.importExample}
\`\`\`

Don't mix libraries — pick one and use it consistently across the kit.

## Components this kit covers
The tokens below apply to all of the following components — even those not
shown separately in a preview (e.g. Carousel and Dialog share the surface token):
Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Banner,
Breadcrumb, Button, Button Group, Calendar, Card, Carousel, Chart, Checkbox,
Collapsible, Combobox, Command, Context Menu, Data Table, Date Picker, Dialog,
Drawer, Dropdown Menu, Empty, Field, Hover Card, Input, Input Group, Input OTP,
Kbd, Label, Menubar, Money Field, Navigation Menu, Pagination, Popover,
Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet,
Sidebar, Skeleton, Slider, Spinner, Switch, Table, Tabs, Textarea, Toast,
Toggle, Toggle Group, Tooltip, Typography.

Plus app-level patterns: Radio card (selectable option), Slot picker (bookable
time/option pills), Stat tile (KPI + delta + sparkline), Kanban board, Tree view,
Status page, Notification centre, Toolbar, Timeline, Description list.

**Building a screen we don't list?** Map each surface to the nearest pattern
and build anything new from the atoms + tokens — never hardcode a value.
E.g. a CRM: contacts → table, pipeline → kanban, deal → description list +
timeline, KPIs → stat tiles. The **Component recipes** block at the bottom of
the \`tokens.css\` export documents the exact class structure + states.

## Design tokens (light + dark)
\`\`\`css
${genCss(cfg)}
\`\`\`

## Rules
- **Three radius families — corners follow control TYPE, not one global dial:**
  1. *Solid buttons* (primary/secondary/danger) → var(--k-radius-button). By
     DEFAULT it equals the box radius (--k-radius-md) so buttons line up with
     cards & inputs (shadcn/Linear norm); set pill/square only for a deliberate
     divergence (Airbnb pill CTAs). Never hardcode, never assume it differs.
  2. *Fields & quiet controls* — inputs, selects, segmented controls and **ghost
     buttons** (toolbar filters, dropdown triggers) → var(--k-radius-md) (box).
     The "Button radius" never reshapes these. For a real button pair (Cancel
     next to Save) use the secondary button, not a ghost button.
  3. *Always-round* (numeric count-chips \`.badge--count\`, status dots, slider
     tracks, progress, toggles, avatars) → hardcode 999px; never scales.
     NOTE: a TEXT badge/tag (\`.badge\`: status "Healthy", "POPULAR") is a chip,
     NOT always-pill — it follows the box radius (family 2) so it matches cards.
- Primary action: var(--k-primary) background, var(--k-primary-fg) text.
- Decorative directional fills (progress bars, sliders, toggles): use var(--k-fill).
  Buttons always stay solid for reliable text contrast.
- Status: use var(--k-success / -warning / -danger / -info) for feedback
  only — never for decoration. Each has a -fg and a -soft (banner fill) variant.
- Surfaces stack: sunken < base < surface-2 < raised < overlay.
  Dialogs/popovers always use --k-surface-overlay.
- App-shell chrome (sidebar, top bar, app rail) → --k-chrome-bg. Sidebar = ${({ flush: 'Seamless', recessed: 'Recessed', panel: 'Floating' } as const)[cfg.chrome]} (${cfg.chrome === 'flush' ? 'Seamless — same as page bg, a hairline carries the separation (Linear/Vercel/Stripe)' : cfg.chrome === 'recessed' ? 'Recessed — a sunken well (--k-chrome-bg = surface-sunken), flush + one seam, content lifts above it (macOS / Windows-settings)' : 'Floating — a distinct tinted room: inset margin + box-radius + soft shadow (Raycast/Vercel-new)'}).
- Control rails (slider track, toggle-off, segmented track) use --k-track — a fixed muted grey (≈ shadcn --input), NOT --k-surface-2 — so a white knob/pill stays legible at any Elevation. Slider/range thumb = a SOLID --k-primary circle (no border), sized = the toggle knob; focus/drag adds the field focus-halo (0 0 0 3px var(--k-ring-halo), same as .in:focus).
- Shape lock: round-by-metaphor (NEVER follows Box radius) = toggle track+knob, radio, slider/range thumb, spinner, avatar. Box-radius-following (square at None) = cards, buttons, inputs, checkbox (capped 4px), badges.
- One recipe per pattern: every UI pattern has exactly ONE class family — stat tiles = .stat-tile (+ .stat-tile-strip for a bare metric strip), sidebar nav rows = .navrow/.nav-group/.navsub (placed inside your own app-shell — the shell is yours, the rows are the recipe), description lists = .dl, segmented control = .segctrl, dropdowns = .menu. Compose these; don't fork bespoke per-screen variants or hand-roll inline styles for a pattern that already has a class.
- Spacing snaps to the 4pt grid, by role: --k-pad (box/container padding) ·
  --k-space (field/section rhythm) · --k-stack-gap (gap between ADJACENT
  controls/buttons in ANY axis — Save/Cancel stack OR Google/GitHub pair).
- Units: type, spacing, radii and control sizes emit in REM (16px root) so the
  whole UI scales with the user's font-size / zoom (accessible, Tailwind/shadcn
  convention). 1px borders, stroke weights, focus rings and shadows stay px.
- Interaction (hover/pressed) uses var(--k-state-hover) as an overlay.
- Dark mode: add the class .dark to a parent element.

## Component decision tree — when to pick which variant

Most components ship in three sizes (\`--sm\` / default / \`--lg\`). Use this
table to pick. The rule is: **size follows row context**, not personal taste.

| Component | \`--sm\` (dense) | default | \`--lg\` (destination) |
|---|---|---|---|
| **Button** | inside cards, table cells, dense toolbars | forms, modals, page-level CTAs | marketing CTAs, mobile primary actions |
| **Toggle** | table cells, dropdown items, multi-column forms | standalone settings rows, form rows | settings hero, mobile-first apps |
| **Input** | dense filter row, inline edit | forms, search bars (default everywhere) | settings page rows, mobile signup |
| **Avatar** | list rows, activity log | profile menu, message preview | profile header, team grid |
| **Badge** | counter chips, inline tags | status pills next to titles | hero-level "NEW"/"BETA" badges |

### Row context → component size

If you're placing the component inside a row container, match its grammar:

- **Row height 28px (\`--k-row-h-sm\`)** → \`--sm\` variants. Used in dropdown menus, table rows, dense list rows.
- **Row height 32px (\`--k-row-h-md\`)** → default variants. Used in command palette, search results, mid-density forms.
- **Row height 40px (\`--k-row-h-lg\`)** → \`--lg\` variants. Used in sidebar nav, settings list, form fields.

When in doubt, **pick default**. \`--sm\` and \`--lg\` are explicit opt-ins for specific contexts.

## Layout composition — what sits next to what

Tokens guarantee that **values** are consistent (one red, one radius scale).
They do NOT guarantee that you **combined** them well — a small button next to
a default input is a valid token usage that still looks broken. These rules
cover the composition layer that tokens can't:

- **A toolbar is one control height.** Any horizontal row of controls (search,
  filters, selects, action buttons) must share a single height. Use the
  \`.toolbar\` recipe — it *forces* every direct \`.btn\` / \`.in\` / \`.select\`
  child onto one height (\`--k-control-h-md\` by default, \`--k-control-h-sm\` via
  \`.toolbar--sm\`), so you can't accidentally mix a \`--sm\` button with a
  default input. Push trailing controls right with \`.toolbar__spacer\`.
- **Two gap levels — group, then separate.** A toolbar's own gap (\`--k-space\`)
  separates UNRELATED items. RELATED controls (a filter pair, a label+select) go
  in a \`.toolbar__group\` (tight 8px) so they read as one unit. One flat gap
  can't express "these belong together, those don't" — grouping can. Name a
  control with \`.toolbar__label\` ("Group by", "Sort") inside the same flat group
  — no nesting needed; the label tier keeps it distinct from the controls.
- **Use the real element.** A button is a \`<button>\` (free keyboard + a11y), a
  link is an \`<a>\`, never a clickable \`<div>\`. Inputs carry their semantic type
  — \`type="search"\`, \`type="email"\`, \`inputmode="numeric"\` — and every control
  has an accessible name (\`<label>\` or \`aria-label\`; icon-only buttons always).
- **Same-size controls pair by token.** \`--k-control-h-md\` IS the default
  button height AND the default input height. So a plain \`.btn\` next to a
  plain \`.in\` already aligns. The \`--sm\`/\`--lg\` deltas keep that pairing.
  Don't size a control with an ad-hoc \`height:\` — use the scale.
- **One primary per action group.** A cluster of buttons has at most ONE
  \`--k-primary\` fill — the affirmative / destination action. Everything else
  is \`--ghost\` or secondary. Two primaries next to each other means the
  hierarchy is undecided; pick one.
- **Group, then separate.** Related controls sit adjacent (small gap);
  unrelated groups are split by a spacer, not scattered evenly. Left =
  context/filters, right = primary actions is the default reading order.
- **The round-element rule.** The ONLY round things are avatars and icon-only
  square buttons (\`.btn--icon\` / \`.btn--circle\`) plus the always-pill set
  (numeric count-chips, status dots, toggles, sliders, progress). Every other control
  follows the radius scale. \`Borders: none\` removes *borders*, not *rounding* —
  if a control still looks round in a square theme, it's one of these by-design
  exceptions, not a bug.

## Line weight grammar — when to use which stroke

Five named stroke widths form the line-weight vocabulary. Pick the intent,
not a px value.

| Token | Width | Use for |
|---|---|---|
| \`var(--k-stroke-1)\` | 1px | All borders, dividers, input outlines, separators |
| \`var(--k-stroke-2)\` | 2px | Focus rings, active tab underline, selection borders |
| \`var(--k-stroke-3)\` | 3px | Slider track, decorative emphasis, secondary progress |
| \`var(--k-stroke-progress)\` | 6px | Primary progress bar fill, heavy linear indicators |

Two examples of how this maps:
- The **slider** track is \`stroke-3\` (3px) — visible enough to grab, light enough to read as a control, not a divider.
- The **progress bar** fill is \`stroke-progress\` (6px) — heavier because it signals continuous work, not a fixed scale.

If you find yourself reaching for a different value (4px, 5px, 8px), it's a sign the design is fighting the system. Stick to the named tokens or document a new one.

## Motion

Cockpit ships a three-tier motion system inspired by Material 3 and shadcn/Radix.
Pair the right duration with the right easing — incoming elements decelerate,
outgoing elements accelerate.

| Token | Use for |
|---|---|
| \`var(--k-dur-fast)\` | hover, toggle knob, tooltip in/out, icon flips |
| \`var(--k-dur)\` | popover, dropdown menu, tabs, accordion |
| \`var(--k-dur-slow)\` | dialog, sheet/drawer, page transitions |
| \`var(--k-ease)\` | default for state changes (color, opacity) |
| \`var(--k-ease-out)\` | enters — element moves INTO place (decelerate) |
| \`var(--k-ease-in)\` | exits — element moves AWAY (accelerate) |

Shortcuts (drop-in CSS \`animation\` values, durations + easings pre-paired):
\`--k-anim-fade-in\`, \`--k-anim-fade-out\`, \`--k-anim-slide-up\`,
\`--k-anim-slide-down\`, \`--k-anim-scale-in\` (popover/menu enter),
\`--k-anim-scale-out\`, \`--k-anim-spin\`.

Always respect \`prefers-reduced-motion: reduce\` — \`tokens.css\` includes a
global reduce-fallback that cuts all animations/transitions to ~instant.

## Accessibility — full WCAG audit

Every meaningful text-on-background pair in the kit, tested against WCAG
2.1 contrast minimums (4.5:1 for normal text, 3:1 for UI components and
large text). Failures are flagged below — they're edge cases (often
status-soft pairs at extreme contrast settings) that may need manual
adjustment in code.

| Pair | Ratio | Required | Pass |
|---|---|---|---|
${auditContrast(tk)
  .map((p) => `| ${p.label} | ${p.ratio.toFixed(2)}:1 | ${p.required}:1 | ${p.passes ? '✓' : '✗'} |`)
  .join('\n')}

**Summary**: ${auditContrast(tk).filter((p) => p.passes).length}/${auditContrast(tk).length} pairs pass WCAG AA.

## Layout — z-index, breakpoints, containers

### Z-index stack
Use these tokens for layered overlays — never hard-code z-index values.
\`\`\`
${Object.entries(Z_INDEX).map(([k, v]) => `--k-z-${k}: ${v};`).join('\n')}
\`\`\`

### Breakpoints (mobile-first, Tailwind-compatible)
\`\`\`
${Object.entries(BREAKPOINTS).map(([k, v]) => `--k-bp-${k}: ${v};`).join('\n')}
\`\`\`

### Container widths
\`\`\`
${Object.entries(CONTAINER_WIDTHS).map(([k, v]) => `--k-container-${k}: ${v};`).join('\n')}
\`\`\`

## Decorative palette — avatars, tiles, cover art + charts

One six-swatch set, auto-derived from the brand hue (character: \`${cfg.palette}\`
— pastel / bright / vivid, all multi-hue). It drives the decorative layer (avatar
backgrounds, category tiles, cover-art & preload placeholders) AND the chart
series, so dataviz and decoration stay on-brand together. Each \`accent-N\` has
a readable \`-ink\` for text on top; \`grad-N\` is a soft 2-stop gradient for
tiles/covers. \`accent-1\`/\`chart-1\` is the highlight, \`-6\` the de-emphasized.
\`\`\`
${Object.entries(buildPalette(cfg))
  .filter(([k]) => !k.startsWith('grad-') && !k.includes('-ink') && !k.includes('-soft'))
  .map(([k, v]) => `--k-${k}: ${v};`)
  .join('\n')}
\`\`\`

### Charts — wire the palette into any chart library

This kit ships **tokens, not a chart component** (stay framework-neutral). To
render data-viz, feed \`--k-chart-1..6\` to whatever library you use as the series
colours, and reuse the existing tokens for the chrome:

| Chart element | Token |
|---|---|
| Series 1…6 (lines, bars, slices, areas) | \`--k-chart-1\` … \`--k-chart-6\` (1 = lead, 6 = de-emphasized) |
| Area fill | the matching \`--k-chart-N\` at ~14% opacity |
| Gridlines | \`--k-border\` (≈50% opacity); axis/baseline at full |
| Axis tick + label text | \`--k-fg-faint\` (caption size) |
| Tooltip surface / border / shadow | \`--k-surface-overlay\` · \`--k-border\` · \`--k-shadow-md\` |
| Tooltip label / value text | \`--k-fg\`; muted series name \`--k-fg-muted\` |
| Hover cursor (crosshair) | \`--k-fg-faint\`, dashed |

**Recharts** — the shadcn pattern maps 1:1; alias the tokens onto its
\`--chart-N\` convention and pass them as \`fill\`/\`stroke\`:
\`\`\`css
:root { --chart-1: var(--k-chart-1); /* …through --chart-6 */ }
\`\`\`
\`\`\`tsx
<Bar dataKey="sessions" fill="var(--chart-1)" radius={2} />
<CartesianGrid stroke="var(--k-border)" />
<Tooltip contentStyle={{ background:'var(--k-surface-overlay)', border:'1px solid var(--k-border)', borderRadius:'var(--k-radius-sm)' }} />
\`\`\`
The same token list drops into **Chart.js** (\`backgroundColor\`/\`borderColor\`),
**visx**, **Nivo** (\`colors\`) or hand-rolled SVG — the kit's own live charts are
plain themed SVG, proving the palette reads across line / area / bar / stacked /
stacked-area / donut without any library at all.

## Typography — full scale

The configurator surfaces h1, h2, body, small directly; the rest derive
via a modular ratio so the rhythm stays coherent.
\`\`\`
${Object.entries(buildTypeScale(cfg))
  .map(([k, v]) => `--k-type-${k}: ${v};`)
  .join('\n')}
\`\`\`

**Type roles — one role, one token** (don't invent per-component sizes; pick the
role and reuse its token everywhere, so the same thing is never two sizes):
| Token | Use it for — the ONLY thing |
|---|---|
| \`--k-type-h1\` | hero / page display number (rare) |
| \`--k-type-h2\` | dialog title · big stat value |
| \`--k-type-h3\` | **card / section title** |
| \`--k-type-body\` | **all body + UI**: nav, list/menu items, chat, paragraphs, control labels, and compact-row titles (emphasise with **weight 600**, not a bigger size) |
| \`--k-type-small\` | secondary: descriptions, subtitles, names, prices, item-meta |
| \`--k-type-caption\` | micro: timestamps, counts, hints, tiny meta |
| \`--k-type-eyebrow\` | **UPPERCASE micro-labels ONLY** (stat/table/group labels, badges, kbd) |
Paragraphs and chat use the SAME token (\`--k-type-body\`) — there is no separate
"reading" size. Never drop sentence content to \`--k-type-small\`.

## House rules — keep the system propagating

Every control in the configurator only works if components consume its **token**.
A hardcoded literal silently opts that element out of theming.
- **Every value is a \`--k-*\` token, never a raw literal.** Spacing → \`--k-pad\` /
  \`--k-space\` / \`--k-stack-gap\` / \`--k-s-N\`; type → \`--k-type-*\`; colour →
  \`--k-*\`; radius → \`--k-radius-*\`; shadow → \`--k-shadow-*\`; motion → \`--k-dur-*\`
  / \`--k-ease-*\`. If you hardcode \`gap: 7px\` or \`#3b82f6\`, the Scale / brand /
  mode controls can't reach it.
- **Spacing lands on the grid** {2,4,6,8,10,12,14,16,20,24,28,32}px — no off-grid
  5/7/9/13/22/30. (1px hairlines excepted.)
- **One role → one token** (see the type table above; same idea for colour + radius).
- Legitimately-fixed exceptions: media chrome that's always-dark (phone frame,
  cover art overlays), semantic scales (status colours), focus rings, and
  black/white overlays — these intentionally don't follow the theme.

## Do's and don'ts

✓ **Do** use \`var(--k-primary)\` for primary CTAs — never hardcode the hex.
✓ **Do** stack overlays via the z-index tokens (e.g. \`z-index: var(--k-z-modal)\`).
✓ **Do** use \`--k-radius-button\` on buttons, even if it equals \`--k-radius-md\`.
✓ **Do** respect \`prefers-reduced-motion\` — tokens.css already cuts animation duration to ~0.
✓ **Do** use system colors (\`--k-success/-warning/-danger/-info\`) ONLY for status — never decoration.

✗ **Don't** use gradients on buttons — text contrast varies along the fade.
✗ **Don't** mix icon libraries — pick one of the 5 supported and stick to it.
✗ **Don't** apply \`--k-ui-weight\` to body paragraphs — it's for chrome text (buttons, badges, tabs, labels). Uppercase belongs only to the eyebrow role (\`--k-type-eyebrow\`: table heads, stat labels, group labels), never to nav rows or headings.
✗ **Don't** scale chart bars / sliders / toggle knobs with the global radius — they hard-code 3-4px or 999px so a pill-radius theme doesn't dome them.
✗ **Don't** rely on the primary color for body text — primary-on-background is fine as a surface but often falls under 4.5:1 (see audit above). Use \`--k-primary-soft\` tints for colored text instead.

## For designers (Figma)

The exported \`tokens.json\` follows the W3C Design Tokens Community Group
format. Import it directly into Figma via the **Tokens Studio for Figma**
plugin (\`tokenstudio.io\`) — every token becomes a Figma variable with
the same name and the same light/dark resolution.
`
}
