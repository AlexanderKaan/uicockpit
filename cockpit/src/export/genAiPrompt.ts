import { buildTokens, resolveDepth } from '../tokens/buildTokens'
import { nameColor } from '../tokens/color'
import { UI_MONO } from '../tokens/fonts'
import type { Config } from '../tokens/types'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
import { ICON_LIBS } from './iconLibs'
import { genCss } from './genCss'
import { Z_INDEX, BREAKPOINTS } from '../tokens/extras'
import { RECIPES } from '../kit'
import { FOUNDATIONS, BLOCK_USES, STANDALONE_ATOMS, idsByTier } from '../kit/segments'

/** The composition contract, derived from the segment graph — the structural part
 * an agent must enforce: the 4-layer ladder, which blocks exist and what each
 * composes, and which atoms stand alone. Built from `src/kit/segments.ts`, so it
 * never drifts from the kit. */
function componentModel(): string {
  const label = (id: string) => RECIPES.find((r) => r.id === id)?.section ?? id
  const blocks = Object.entries(BLOCK_USES)
    .map(([id, uses]) => `- **${label(id)}** — composes: ${uses.map(label).join(' · ') || '(self-contained)'}`)
    .join('\n')
  const atoms = idsByTier('atom').map(label).join(', ')
  const foundations = FOUNDATIONS.map(label).join(', ')
  const standalone = STANDALONE_ATOMS.map(label).join(', ')
  return `## The component model — the composition contract

This kit is a **4-layer ladder** (Foundation → Atom → Block → Page). Build UP it;
never invent a parallel structure or re-implement what a block already guarantees.

**FOUNDATION** — the tokens (above) + layout grammar (${foundations}). Use the
layout utilities INSTEAD of ad-hoc flex/grid and magic px widths:
\`.l-stack\` (vertical rhythm) · \`.l-cluster\` (wrapping row) · \`.l-switcher\`
(row→column when tight) · \`.l-grid\` (responsive auto-fit) · \`.l-sidebar\` ·
\`.l-center\` (caps width at \`--k-measure-narrow/prose/wide\` — never a hardcoded
\`max-width\`).

**ATOMS** — the bare vocabulary; only meaningful inside something larger:
${atoms}.

**BLOCKS** — stand-alone pieces of app. Each IS its surface; build it by COMPOSING
the atoms listed, not by hand-rolling them inside a bare card:
${blocks}

**STANDALONE atoms** — attach to anything; use directly, no host block needed:
${standalone}.

**The rule of reach:** need a data surface? → the **Data table** block (it owns
toolbar + selection + pagination + empty/loading/error). Need a form? → **Form
panel**. Need to filter a list? → **Filter bar**. Compose from the ladder; don't
re-implement what a block already guarantees.

**Blocks adapt to their CONTAINER, not the viewport.** The flagship blocks
(data-table, form-panel, filter-bar) carry CSS container queries keyed to their
own width, so they reflow correctly wherever you drop them — full-bleed, in a
narrow sidebar, or on mobile — with no per-page media queries. Drop the block and
trust it; don't wrap it in your own breakpoints.`
}

/**
 * Ready-to-paste prompt for Cursor / v0 / Claude Code / Lovable / Bolt.
 *
 * The hidden moat of UIcockpit: while tokens.css and BRIEF.md are
 * machine-readable, this format is *behavior-shaping* — it tells the AI
 * how to use the system, not just what it contains. Paste once into the
 * AI tool's system message / project rules / .cursorrules file and every
 * subsequent generation respects the system.
 */
export function genAiPrompt(cfg: Config): string {
  const tk = buildTokens(cfg)
  const cc = tk.cc
  const scaleName = cap(cfg.scale)
  const themeName = cap(cfg.colorTheme)
  const lib = ICON_LIBS[cfg.iconSet]
  const css = genCss(cfg)

  return `# Design system rules — paste into Cursor (\`.cursorrules\` or project
# instructions), v0 system message, Claude Code's CLAUDE.md, or Lovable
# project notes. Every UI component you generate must follow this.

You are building inside a design system. **Use these tokens for every
component you create. Never hardcode colors, radii, spacing, fonts,
shadows or transitions.**

## The system

- Color theme: ${themeName} (a single brand hue — secondary & accent are derived from it)
- Scale: ${scaleName} (size + spacing + density macro — the overall size of the system; does NOT change font-weight)
- The axes are **orthogonal**: Color theme controls the hue, Scale controls
  size/spacing/density, and the form facets (radius, button shape, surface depth,
  border, motion) are each their own control. Typography (fonts, text size) is
  independent too. Mix any combination freely.
- Brand color: ${nameColor(tk.primaryHex)} (\`${tk.primaryHex}\`) — main CTAs, focus ring
- Secondary color: ${nameColor(tk.secHex)} (\`${tk.secHex}\`) — derived muted sibling, for secondary buttons
- Accent color: ${nameColor(tk.accentHex)} (\`${tk.accentHex}\`) — derived brighter sibling, for chart fills, links, highlights
- System colors (fixed, never customize): success/warning/danger/info
- Neutrals: ${cfg.neutral} gray ramp${cfg.neutral === 'auto' ? ' (greys carry a faint whisper of the brand hue — the cohesive "tinted neutral" look; never a flat #808080)' : ''}
- Harmony: ${cfg.harmony} (spread ${cfg.spread}°, expression ${cfg.expression}%). The DERIVED family (secondary = quarter-rotation sibling, accent/tertiary = full rotation, decorative palette, neutral tint) is computed from the single brand hue via these dials. NEVER invent extra brand hues: use --k-secondary / --k-accent / --k-accent-1..6 for variety — they are already harmonized. Inverse-emphasis surfaces (dark tooltip on light UI) use --k-inverse-surface / --k-inverse-fg. The surface-container ladder (--k-surface-container-lowest → -highest) is the resting-hierarchy vocabulary: deeper nesting = higher container.
- Component override hooks (lazy comp tier): a curated set of per-component custom properties exists in the recipes as fallback chains but is NEVER defined by default — define one in a scope to restyle just that component family there, without touching the system tokens. Hooks: --k-btn-bg / --k-btn-fg / --k-btn-radius / --k-btn-h (buttons) · --k-card-bg / --k-card-radius / --k-card-pad / --k-card-border-color (cards) · --k-in-bg / --k-in-radius (fields) · --k-badge-radius (badges). Example: \`.sidebar { --k-btn-radius: 0; }\` squares only the sidebar's buttons. Never invent new hook names — these are the contract.
- Radius: ${cfg.radius} (cards/inputs/dialogs) · Button radius: ${cfg.buttonShape}${cfg.buttonShape === 'match' ? ' (MATCHES the box radius — buttons share corners with inputs/cards; the default)' : ''}${cfg.buttonShape === 'pill' ? ' (PILL — buttons are fully capsule regardless of card radius)' : ''}${cfg.buttonShape === 'none' ? ' (square — no button corner radius)' : ''}
- **Scale: ${cfg.scale}** — one macro driving size + spacing + density (NOT font-weight; UI text weight is a fixed system constant). Pick component defaults to match. ${
  cfg.scale === 'compact'
    ? 'Button + input both 32px (matched), date cells 28px, toggle 28×14. Linear/Cursor pro-tool density.'
    : cfg.scale === 'comfortable'
      ? 'Button + input both 40px (matched), date cells 40px, toggle 40×22. Notion calm-roomy generosity.'
      : 'Button + input both 36px (matched, shadcn h-9), date cells 32px, toggle 32×18. shadcn-default.'
} If you build new components, follow these defaults — don't introduce a different scale.
- **Adjacent-element rule**: button and input share the SAME height per
  scale, so action rows like \`[quantity stepper] [Add to cart]\` or
  \`[input] [Submit]\` always sit on one visual baseline. Matches shadcn /
  Linear / Vercel Geist / Stripe convention. Never mix \`.btn--sm\` with
  \`.in\` default — they'll mismatch by design.
- Type rhythm: ${cfg.typeScale}
- Elevation: ${({ flat: 'Flat', soft: 'Subtle', raised: 'Raised', layered: 'Deep' } as const)[cfg.surfaceDepth]} — how far cards/surfaces lift off the canvas: ramp contrast (${resolveDepth(cfg.surfaceDepth).contrast}) + shadow (${resolveDepth(cfg.surfaceDepth).elevation}). Flat = zero shadow (Linear/Vercel); Deep = strong shadow (Notion). Shadows auto-tint toward the brand hue. (Sidebar treatment is a SEPARATE axis — see below.)
- Surface: ${({ outlined: 'Outlined', filled: 'Filled', plain: 'Plain' } as const)[cfg.surface]} — the STRUCTURE of how contained surfaces (fields, menus, the sidebar seam) separate. ${cfg.surface === 'outlined' ? 'Outlined = a box drawn by a border (+ a light fill); the sidebar is flush with a hairline seam.' : cfg.surface === 'filled' ? 'Filled = a box drawn by the tonal fill, border transparent; the sidebar is a sunken recessed well (--k-chrome-bg = --k-surface-sunken).' : 'Plain = no box: fields get a bottom hairline (underline, radius 0), menus/sidebar go seamless and lean on the shadow.'} Fields read \`--k-field-bg / --k-field-border-color / --k-field-underline-color / --k-field-radius\`. (Border tunes the line strength; Elevation the lift — both separate.)
- Border: ${cfg.borders} — a separate control for the 1px box-edge prominence (faint→strong), a tint on the neutral ladder. Independent of depth.
- Motion: ${cfg.motion} base · Tempo ${cfg.motionTempo} · Curve ${cfg.motionCurve}
- Typeface: ${cfg.fontDisplay} (display) / ${cfg.fontBody} (body) / ${UI_MONO} (mono for code & Kbd)
- UI text — applies to buttons, badges, tabs, nav rows, form labels: a fixed semibold weight (\`--k-ui-weight\`, constant — NOT changed by Scale or Text size), sentence case. Nav/tables/menus use the 14px body floor; uppercase only for the eyebrow role (--k-type-eyebrow: table heads, stat labels, group labels)
- Icons: ${lib.label}

## Icon library — install this

Run once in the project root:
\`\`\`bash
${lib.install}
\`\`\`

Then in any component:
\`\`\`tsx
${lib.importExample}
\`\`\`

Don't mix libraries. If a non-React framework is in use, find the
equivalent package (most of these ship for Vue / Svelte / Solid as well).

## Hard rules

1. Buttons always use solid \`var(--k-primary)\` background with
   \`var(--k-primary-fg)\` text — never gradients, contrast varies along
   the fade.
2. Decorative directional fills (progress bars, sliders, active toggles)
   use \`var(--k-fill)\` — the solid brand fill token.
3. Status communication (banners, badges, alerts) uses the system colors
   (\`--k-success\`, \`--k-warning\`, \`--k-danger\`, \`--k-info\`) — each has
   a \`-fg\` and a \`-soft\` (+ \`-soft-fg\`) variant for fill vs banner.
   **Status badges in tables/lists — asymmetric salience:** every row has a
   status, so routine states (Healthy/Active) stay SOFT (\`.badge--success\` etc.)
   to keep the list calm + scannable; the ONE critical state (Down/Outage/Overdue)
   goes SOLID (\`.badge--solid-danger\`) so the problem row pops. Add a leading
   \`.badge__dot\` (a non-colour channel) and ALWAYS keep the text label — never
   colour-only (WCAG 1.4.1). Do NOT make every danger-toned badge solid: a common
   value like "High priority" stays soft, else the list becomes a christmas tree.
4. Surfaces stack: \`--k-bg\` < \`--k-surface-sunken\` < \`--k-surface\` <
   \`--k-surface-2\` < \`--k-surface-raised\` < \`--k-surface-overlay\`.
   Dialogs and popovers always use \`--k-surface-overlay\`.
   App-shell chrome (sidebar, top bar, app rail) uses \`--k-chrome-bg\` — driven by
   the **Surface** axis (${cfg.surface}): ${cfg.surface === 'filled' ? '`--k-surface-sunken` (Filled — the sidebar is a recessed sunken well; content lifts above the seam)' : '`--k-bg` (Outlined/Plain — sidebar flush with the page, a hairline seam carries the separation, Linear/Vercel/Stripe)'}. Surface also drives the field treatment via \`--k-field-bg / --k-field-border-color / --k-field-underline-color / --k-field-radius\`: Outlined = box+border, Filled = fill-no-border, Plain = transparent + bottom hairline (underline, radius 0).
   Control rails (slider track, toggle-off, segmented track) use \`--k-track\` — a
   fixed muted grey (≈ shadcn \`--input\`), NOT \`--k-surface-2\` — so a white knob/
   pill stays legible at any Elevation. Slider/range thumb = a SOLID \`--k-primary\`
   circle (no border), sized = the toggle knob; focus/drag adds the field focus-halo
   (\`0 0 0 3px var(--k-ring-halo)\`, identical to \`.in:focus\`). SHAPE LOCK: round-by-
   metaphor (never follows Box radius) = toggle track+knob, radio, slider thumb,
   spinner, avatar; box-radius-following (square at None) = cards, buttons, inputs,
   checkbox (capped), badges.
   ONE RECIPE PER PATTERN: every UI pattern has exactly one class family — stat tiles
   = \`.stat-tile\` (+ \`.stat-tile-strip\` for a bare metric strip), sidebar nav rows =
   \`.navrow\`/\`.nav-group\`/\`.navsub\` (place them inside your OWN app-shell; the shell
   is yours, the rows are the recipe), description lists = \`.dl\`, segmented control =
   \`.segctrl\`, dropdowns = \`.menu\`. Compose these — never fork a bespoke per-screen
   variant or hand-roll inline styles for a pattern that already has a class.
5. Spacing snaps to the 4pt grid. Three roles: \`--k-pad\` = box/container padding
   (cards, dialogs); \`--k-space\` = field/section rhythm (gap between fields,
   groups); \`--k-stack-gap\` = the gap between ADJACENT controls/buttons — in ANY
   axis (a vertical Save/Cancel stack OR a horizontal Google/GitHub pair both use
   \`--k-stack-gap\`). Never hand-pick a px gap; pick the role. All dimensional
   tokens (type, spacing, radii, control sizes) emit in REM (16px root) so the UI
   scales with the user's font-size; only 1px borders + shadows stay px.
6. Motion — pair the right duration with the right easing.
   Durations: \`--k-dur-fast\` (hover/toggle/tooltip), \`--k-dur\`
   (popover/menu/tabs), \`--k-dur-slow\` (dialog/sheet/page).
   Easings: \`--k-ease-out\` for ENTERS (decelerate), \`--k-ease-in\` for
   EXITS (accelerate), \`--k-ease\` for state changes (color/opacity).
   MD3 emphasized — always available regardless of the user's Curve choice:
   \`--k-ease-emphasized\` (standard), \`--k-ease-emphasized-decel\` (enter),
   \`--k-ease-emphasized-accel\` (exit). Reach for these when a primary
   transition (dialog enter, FAB morph, page change) needs the snap.
   Shorthand animations: \`--k-anim-fade-in\`, \`--k-anim-slide-up\`,
   \`--k-anim-scale-in\` (popover/menu enter), \`--k-anim-scale-out\`,
   \`--k-anim-fade-through\` (MD3 content cross-swap), \`--k-anim-spin\`.
   Always respect \`prefers-reduced-motion: reduce\`.
7. Hover/press uses \`var(--k-state-hover)\` as an overlay.
8. Dark mode: add the class \`.dark\` to a parent element — the tokens
   re-resolve automatically.
9. Chart-bar / data-viz elements do NOT scale with theme radius —
   hard-code a small \`3-4px\` corner radius so a pill-radius theme
   doesn't make bars dome-shaped.
   Same exception for **always-round** elements (avatars, status dots,
   story rings, FAB / wishlist / save / heart buttons, spinners,
   **numeric count-chips**, **pagination indicators**): use
   \`border-radius: 999px\` or \`50%\` explicitly, NEVER theme radius.
   Icon-only buttons (\`.btn--icon\`) use \`aspect-ratio: 1\` + fixed
   width/height so the glyph never drives the geometry — combine with
   \`.btn--circle\` when you need always-round (e.g. wishlist heart next
   to Add to cart). Numeric count-chips use \`.badge--count\` (perfect
   circle, single digit; auto-pills for "99+"). A TEXT badge/tag
   (\`.badge\`: status "Healthy", "POPULAR") is a chip and FOLLOWS the box
   radius (\`--k-radius-md\`) — NOT always-pill — so it matches cards &
   inputs (square theme → square chip, round theme → pill chip).
10. Radius — corners follow control TYPE, three families:
    (a) **Solid buttons** (primary/secondary/danger) → \`var(--k-radius-button)\`.
    By DEFAULT it equals the box radius (\`--k-radius-md\`), so buttons/inputs/cards
    share corners (shadcn/Linear norm); it CAN diverge for intent (pill on soft
    cards = Airbnb; square on rounded cards). (b) **Fields & quiet controls** —
    inputs, selects, segmented controls and **ghost buttons** (toolbar filters,
    dropdown triggers) → \`var(--k-radius-md)\` (box). The Button-radius dial does
    NOT reshape these; for a real button pair (Cancel/Save) use a secondary
    button, not ghost. (c) **Always-round** (numeric count-chips, status dots,
    toggles, sliders, avatars) → 999px, fixed. Text badges/tags are NOT here —
    they follow the box radius. Always read the token — never hardcode.
11. \`--k-ui-weight\` applies to chrome text: buttons, badges, tabs, nav rows,
    form labels. It is a FIXED system constant (semibold) — Scale and Text size
    never change it. Body paragraphs and headings have their own weights. Nav/tables/
    menus sit at the 14px body floor (sentence case). Uppercase is ONLY for the
    eyebrow role (\`--k-type-eyebrow\`): table heads, stat labels, group labels.
12. Z-index — use the token stack, never hardcode raw values.
    Stack: ${Object.entries(Z_INDEX).map(([k, v]) => `${k}=${v}`).join(', ')}.
    Tokens: \`var(--k-z-dropdown)\`, \`var(--k-z-modal)\`, \`var(--k-z-toast)\` etc.
13. Responsive — use the breakpoint tokens.
    Stack: ${Object.entries(BREAKPOINTS).map(([k, v]) => `${k}=${v}`).join(', ')}.
    Mobile-first: \`@media (min-width: var(--k-bp-md)) { ... }\`. Tailwind-compatible.
14. Decorative palette — ONE six-swatch set drives avatars, category tiles,
    cover art, preload placeholders AND charts, so decoration + dataviz stay
    on-brand. Character: \`${cfg.palette}\` — all three MULTI-HUE, derived from
    the brand hue (pastel = soft & light, bright = Material-style clear/modern,
    vivid = saturated & punchy). Every swatch is a distinct colour (avatars /
    chart series / categories — never six tints of one hue). Use:
    \`--k-accent-1..6\` (flat — avatar/label backgrounds) with \`--k-accent-N-ink\`
    for text on top; \`--k-grad-1..6\` (soft gradient pair — tiles, cover art,
    image placeholders); \`--k-chart-1..6\` (same colours, chart series; -1 lead,
    -6 de-emphasized). NEVER hardcode decorative hex/gradients — pull from
    these so the whole decorative layer rotates with the brand colour.
    APPLICATION (Material categorical model): (a) assign swatches IN ORDER
    1,2,3… — the set is pre-ordered so consecutive swatches sit far apart in
    hue, keeping a 2-3 series chart distinct; (b) the lead/most-important
    series uses accent-1 (brand-anchored); (c) area/line = full-colour line +
    the same colour at ~12-16% alpha for the fill; (d) semantic data (errors,
    success, up/down deltas) uses the SYSTEM colours (--k-success / -warning /
    -danger), NEVER the decorative palette. (e) For a soft colour chip (a
    coloured icon/label on a tint) use \`--k-accent-N-soft\` (bg) +
    \`--k-accent-N-soft-fg\` (icon/text) — contrast-safe for ALL hues; never put
    a raw \`--k-accent-N\` as foreground on a light surface (light hues like
    yellow/green fail contrast). Text ON a solid accent uses \`--k-accent-N-ink\`.
    (f) CHART CHROME — this kit ships tokens, not a chart component, so wire any
    library (Recharts / Chart.js / visx / Nivo / raw SVG) to the tokens: series
    = \`--k-chart-1..6\`; area fill = same colour at ~14% alpha; gridlines =
    \`--k-border\` (~50% alpha), axis baseline = full \`--k-border\`; tick/label
    text = \`--k-fg-faint\`; tooltip = \`--k-surface-overlay\` bg + \`--k-border\` +
    \`--k-shadow-md\`, label \`--k-fg\` / muted name \`--k-fg-muted\`. For Recharts,
    alias \`:root{--chart-1:var(--k-chart-1)}\` (…-6) and pass as fill/stroke.
15. Components — see the **Component recipes** block at the bottom of the
    tokens.css export. It opens with a MANIFEST splitting the kit into three
    tiers: **PRIMITIVES** (the design system — button, card, input, table,
    dialog… with full hover/focus/disabled/active state recipes), **HELPERS**
    (structural glue), and **PATTERNS** (copy-paste compositions built FROM the
    primitives — auth screen, pricing table, stat tile…). RULE: build screens by
    composing the PRIMITIVES; reach for a PATTERN only as a ready-made block.
    Reuse the documented class names + states exactly — never invent a new
    component or hand-roll inline styles for something a primitive already covers.
    Form rows: wrap a labelled field in \`.field\` (\`.field__label\` + \`.field__req\`
    asterisk + \`.field__hint\` + \`.field__error\`, control wired with \`aria-invalid\`
    + \`aria-describedby\`) — the full FormField contract; \`.lab\` is the lightweight
    label-over-control. State recipes you should USE (don't re-roll): \`.btn--loading\`
    (width-locked spinner, wrap the label in a span + \`aria-busy\`), checkbox
    \`:indeterminate\` (the select-all dash, set via the DOM property),
    \`.toggle--disabled\`, and read-only inputs via the \`readonly\` attribute (flat
    fill + muted, distinct from \`:disabled\`). Touch: on a coarse pointer the global
    layer floors buttons/inputs/selects to \`--k-touch-target\` (44px) automatically.
16. Row grammar — every list-style interactive row uses ONE of three height
    tokens. \`--k-row-h-sm\` (28px) for dense menus / dropdown items / table
    rows. \`--k-row-h-md\` (32px) for command palettes / search results.
    \`--k-row-h-lg\` (40px) for sidebar nav / settings / form inputs.
    Padding-x (\`--k-row-px\`), gap (\`--k-row-gap\`), icon size (\`--k-row-icon\`)
    and inner radius (\`--k-row-radius\`) are shared across all three.
17. Line weights — use the named stroke scale, never raw px values.
    \`--k-stroke-1\` (1px) for borders/dividers/input outlines.
    \`--k-stroke-2\` (2px) for focus rings + active tab underlines.
    \`--k-stroke-3\` (3px) for slider tracks + decorative emphasis.
    \`--k-stroke-progress\` (6px) for progress bars. If you reach for 4/5/8,
    you're fighting the system — pick the closest named token.
18. One role = one token. \`--k-type-body\` is the SINGLE content size — UI text
    AND anything a user reads in a block (chat messages, reviews/comments,
    paragraphs) all use \`--k-type-body\` (pair prose with \`line-height: 1.5–1.6\`).
    There is no separate "reading" size: paragraphs and chat must match. Never
    drop sentence content to \`--k-type-small\` (12px) — small is for labels,
    captions, meta, never sentences.
    **EVERY font-size is a \`--k-type-*\` token — NEVER a hardcoded px.** The full
    scale, smallest→largest: \`--k-type-caption\` (micro: timestamps, counts, tiny
    meta) · \`--k-type-eyebrow\` (UPPERCASE micro-labels only) · \`--k-type-small\`
    (secondary: descriptions, subtitles, names, prices) · \`--k-type-body\` (all
    body + UI: nav, lists, chat, paragraphs, compact-row titles at weight 600) ·
    \`--k-type-h3\` (card/section title) · \`--k-type-h2\` (dialog title, big stat
    value) · \`--k-type-h1\` / \`--k-type-display\` (hero). All scale together with
    the Text-size control; a hardcoded px would freeze that text out of the system.
19. Hover states (pick by shape, stay consistent) — TWO treatments, never mix
    them on the same kind of element: (a) discrete CARDS / TILES (bordered
    blocks with gaps between them — stat tiles, quick-action tiles, product
    cards) hover with a BORDER accent + subtle shadow + 1px lift:
    \`border-color: var(--k-state-border); box-shadow: var(--k-shadow-sm);
    transform: translateY(-1px)\` — no grey fill. (b) LIST / MENU / TABLE ROWS
    (tightly stacked, no gaps) hover with a grey background overlay
    (\`var(--k-state-hover)\`) — a border per row reads as noise; the fill is the
    standard list affordance. \`--k-state-border\` follows the user's selection-
    accent (neutral or brand), so the card-hover border matches their choice.
20. Layout composition — what sits next to what. Tokens make VALUES consistent;
    they can't stop you COMBINING them badly. Enforce the composition layer:
    (a) **A toolbar is one control height.** Any horizontal row of controls
    (search + filters + select + actions) uses the \`.toolbar\` recipe, which
    forces every direct \`.btn\` / \`.in\` / \`.select\` child onto a single height
    (\`--k-control-h-md\`, or \`--k-control-h-sm\` via \`.toolbar--sm\`). Never mix a
    \`.btn--sm\` with a default \`.in\` in the same bar — they mismatch by design.
    Push trailing actions right with \`.toolbar__spacer\`. (b) Same-size controls
    pair by token: \`--k-control-h-md\` IS the default button AND input height, so
    a plain \`.btn\` next to a plain \`.in\` already lines up. Never set an ad-hoc
    \`height:\` on a control — use the scale. Text badges/tags (\`.badge\`) also
    follow the box radius (they're chips, not pills). (c) **One primary per action group**
    — a button cluster has at most one \`--k-primary\` fill (the affirmative /
    destination action); the rest are \`--ghost\`/secondary. Two primaries = the
    hierarchy is undecided. (d) Two gap levels: the toolbar's own gap
    (\`--k-space\`) separates UNRELATED items; RELATED controls (a filter pair, a
    label+select) go in a \`.toolbar__group\` (tight 8px) so they read as one
    unit; name a control with \`.toolbar__label\` ("Group by") inside that same
    flat group — never nest groups. Left = context/filters, right = primary
    actions (split with \`.toolbar__spacer\`). (e) Round-element rule: the ONLY round controls are
    avatars and icon-only square buttons (\`.btn--icon\`/\`.btn--circle\`) plus the
    always-pill set (rule 9). \`Borders: none\` removes borders, not rounding.
21. Semantic HTML & a11y — use the REAL element, always. A button is a
    \`<button>\` (free keyboard + screen-reader), a link is an \`<a>\`, never a
    clickable \`<div>\`/\`<span>\` (those need \`role\` + \`tabindex\` + key handlers you'll
    forget). Inputs carry their semantic type: \`type="search"\` (searchbox role,
    Enter-to-search), \`type="email"\` / \`type="tel"\` / \`type="password"\`,
    \`inputmode="numeric"\` for card/OTP fields. Every control has an accessible
    name — a wrapping \`<label>\` or \`aria-label\` — and icon-only buttons MUST have
    \`aria-label\`. Native \`<select>\` over a custom div whenever a plain dropdown
    will do. When you DO build a custom widget, wire the full ARIA pattern +
    keyboard: a custom select = \`role="combobox"\` trigger → \`role="listbox"\` with
    \`role="option" aria-selected\` items; a tree = \`role="tree"\` → \`role="treeitem"
    tabindex aria-expanded\` (Enter/Space/arrows); a toggle = \`role="switch"
    aria-checked\`; a modal = \`role="dialog" aria-modal="true" aria-labelledby\`
    (its title). Dynamic status (toasts, saved, counts, errors) lives in a
    \`role="status"\`/\`aria-live\` region so it's announced. Decorative icons get
    \`aria-hidden="true"\`; every interactive element shows a \`:focus-visible\` ring.
    Don't convey meaning by colour alone — pair status colour with text or an icon.

## Choosing the right size — decision tree

Components ship in three sizes (\`--sm\` / default / \`--lg\`). Pick by context:

| Component | \`--sm\` | default | \`--lg\` |
|---|---|---|---|
| Button | inside cards, table actions, dense toolbars | forms, modals, page-level CTAs | marketing CTAs, mobile primary |
| Toggle | table cells, dropdown items, multi-column forms | settings row, form row | settings hero, mobile-first |
| Input | dense filter row, inline edit | forms (default everywhere) | settings page, mobile signup |
| Avatar | list rows, activity log | profile menu, message preview | profile header, team grid |
| Badge | counter chips, inline tags | status pills next to titles | hero-level NEW/BETA |

**Quick rule:** match the size to the parent row height.
- Row 28px → \`--sm\` variants. Row 32px → default. Row 40px → \`--lg\`.

When in doubt, **pick default**. \`--sm\` and \`--lg\` are explicit opt-ins.

${componentModel()}

## Components I expect you to build

When asked for any of these, use the tokens above.

**Atoms & Basics:**
Accordion, Alert, Avatar, Badge, Banner, Breadcrumb, Button, Card,
Checkbox, Combobox, Command palette, Date picker, Dialog, Drawer,
Dropdown menu, Form field, Input, Input group, Kbd, Menubar,
Navigation menu, Pagination, Popover, Progress, Radio, Scroll area,
Select, Separator, Sheet, Sidebar, Skeleton, Slider, Switch, Table,
Tabs, Textarea, Toast, Toggle, Toggle group, Tooltip, Typography.

**Modern form primitives:**
Number input (with steppers), Password input (show/hide + strength),
Search input (leading icon + clear + suggestions),
Phone input (country code + flag).

**Auth screens (.auth):**
Sign-in / sign-up / forgot-password — centered card with heading, SSO buttons
(.auth__social), a labelled "or" divider (.divider-or), the form (reuse .in /
.btn / .check), a remember+forgot meta row (.auth__meta) and a footer link
(.auth__foot). Lightbox (.lightbox) — fullscreen image viewer with prev/next.

**Mobile shell:**
Mobile top bar (back + title + actions), Mobile tab bar (3-5 tabs),
Bottom sheet (snaps peek/half/full), Action sheet (iOS-style).

**Selection & options:**
Color picker (round swatch ring, sm/default/lg sizes),
Radio card (\`.radio-card\` — a selectable option card for delivery/plan/payment;
wraps the system \`.radio\`, selected = soft brand fill + brand border).

**Media library:**
File grid (.filegrid) — 4-col thumbnail tiles met cover + name + type badge + meta.
Modifiers --2/--3/--5 voor verschillende kolom-counts. Generic voor media,
album collections, cloud storage, AI artifacts, document libraries.

**Settings & admin:**
Settings row (label + description + control), Two-column layout
(main + sidebar), Info card (compact label + value/badge tile).

**Data display:**
List (generic with sections + leading/trailing slots),
Timeline (vertical events with dots + line),
Code block (multi-line with line numbers + filename header),
Stat tile (\`.stat-tile\` — KPI + delta pill + optional sparkline),
Description list (\`.dl\` — key/value pairs), Kanban board, Tree view, Status page.

**Marketing & content:**
Pricing card (3-tier featured), Stat group (multi-metric strip),
Feature trio (icon + heading + body),
Carousel (\`.carousel\` — sliding track + prev/next arrows + \`.cdots\` dots).

**Navigation:**
Wizard stepper (multi-page form flow with numbered horizontal steps),
Navigation menu (\`.navmenu\` — horizontal top nav with a \`.menu\` dropdown flyout),
Context menu (\`.ctxmenu\` — right-click drop area; popup reuses \`.menu\`).

**Scheduling:**
Slot picker (\`.slotpicker\` of \`.slot\` — bookable time/option pills; available /
selected / disabled states).

## Building a screen we don't list — map it, don't invent

You'll be asked for screens with no named recipe (a music player, a CRM, a
booking flow). The kit still applies: **map each surface to the nearest recipe,
and build anything genuinely new out of the atoms + \`--k-*\` tokens.** Never
hardcode a colour, radius, spacing or shadow — read a token and it inherits the
brand, density and dark-mode automatically. If you must invent a class, invent
*one*, style it only with tokens, and reuse it everywhere — never one-off inline
values, or the user's UI drifts back out of alignment.

**Worked example — "build me a CRM":**

| Surface | Reach for |
|---|---|
| Contact list | \`.tbl\` (table) or \`.list\` rows |
| Pipeline / stages | \`.kanban\` board |
| Deal detail (fields) | \`.dl\` (description list) |
| Activity history | \`.timeline\` |
| KPIs (deals, revenue) | \`.stat-tile\` (+ \`.stat-tile-strip\`) |
| Owner / member avatars | \`.avatar\` (+ \`.avatar-group\`) |
| Status (won / lost / open) | \`.badge\` |
| Per-row actions | \`.menu\` (anchored) |
| Path to the current record | \`.breadcrumb\` |

**Lookup by shape (any domain):**
- Labelled, selectable option (delivery, plan, payment) → \`.radio-card\`
- Bookable time / option pills → \`.slotpicker\` of \`.slot\`
- KPI with delta / trend → \`.stat-tile\`
- Key/value field pairs → \`.dl\`
- Vertical event history → \`.timeline\`
- Right-click actions → \`.ctxmenu\` (popup reuses \`.menu\`)
- Horizontal top nav with a flyout → \`.navmenu\`
- Sliding promo / onboarding panels → \`.carousel\` (+ \`.cdots\`)
- Anything not above → the closest atom + \`--k-*\` tokens.

**Row collections = exactly TWO systems (lists are the #1 place UIs drift).**
There is no third row vocabulary — settings rows and notification feeds are LIST
variants, not their own components.
1. **TABLE** (\`.tbl\`) — columns to scan / sort / compare / multi-select / paginate
   many homogeneous records. Rows use a hairline \`border-b\` + hover (not zebra);
   sortable headers, and the \`.datatable\` chrome (bordered frame + toolbar/bulk-bar
   + sticky header + scroll).
   E.g. projects, orders, logs, domains, an inbox you select/sort.
2. **LIST** (\`.list\`) — stacked rows, each a self-contained unit. Slots:
   \`.list__lead\` (\`--icon\` / \`--icon-muted\` / \`--avatar\`) · \`.list__body\`
   (\`.list__title\` [+\`--lg\`] + \`.list__sub\`) · \`.list__trail\` (badge / \`.list__dot\`
   unread / control / time / menu). Container variants:
   • \`.list\` default — top-divider rows, hover (entity / feed lists)
   • \`.list--flush\` — no dividers (notifications, inbox feed)
   • \`.list--settings\` — bottom-divider, static, title 600 + a trailing control.
   E.g. settings, notifications, messages, activity, a few managed entities.
Decision: columns to compare/sort/bulk-select → **TABLE**; self-contained rows
(icon/avatar + title + meta + trailing) → **LIST** (+ the right variant). Key/value
of one record → \`.dl\`; board → \`.kanban\`; events → \`.timeline\`.

The **Component recipes** block at the bottom of the \`tokens.css\` export documents
the exact class structure + states for every class named here — copy from it
rather than guessing.

## Behavior boundary — what this kit does and does NOT do

This is the **look + layout + composition** layer. The recipes ship every VISUAL
state baked in — hover, focus-visible, active/press, disabled, invalid/error,
loading, checked, selected, expanded — so you never hand-style those. But the kit
ships **no JavaScript behavior runtime**: open/close, focus-trapping, filtering,
positioning, dismiss timers and keyboard nav are YOURS to wire. This is a feature,
not a gap — it keeps the kit framework-neutral and lets it sit over any stack.

**The contract:** when you apply this design system, touch only look / layout /
composition — the classes, the markup structure, the tokens. **Do not rewrite the
app's logic** to fit the kit; wire the kit's classes onto the behavior that's
already there (or pair a headless lib below). A re-skin should never change what
the app *does*.

**Pair the behavior — recommended per interactive component:**
- **Dialog / sheet / alert-dialog** → the native \`<dialog>\` element (\`.showModal()\`
  + \`::backdrop\`) or Radix/Base UI Dialog. The recipe styles the panel; you own
  open/close + focus trap + Esc. Add \`role="dialog"\`/\`"alertdialog"\` + \`aria-modal\`.
- **Dropdown menu / context menu / menubar** → Radix/Base UI Menu (or your own
  roving-tabindex). Wire \`aria-expanded\` on the trigger; the \`.menu\` panel + the
  roll-down stagger are styled for you.
- **Combobox / command palette** → you own the filter + active-option state; the
  recipe styles the field + the option list. Add \`role="combobox"\` + \`aria-controls\`
  + \`aria-activedescendant\`.
- **Tooltip / popover / hover-card** → Floating UI (or Radix) for positioning +
  open delay. Add \`role="tooltip"\` / \`aria-describedby\`. The recipe is the visual.
- **Tabs / accordion** → wire \`aria-selected\`/\`aria-expanded\` + arrow-key nav (or
  Radix). \`<details>\`/\`<summary>\` gives accordion behavior for free.
- **Toast / sonner** → you own the queue + auto-dismiss timing; \`.toast-stack\` is
  the container, the enter/exit keyframes ship in the CSS.
- **Date picker / calendar** → you own month math + disabled/range logic; the
  \`.calendar\` grid + day states are styled.
- **Combobox/select filtering, slider drag, tag add/remove, OTP auto-advance** →
  your handlers; every visual state they toggle is already in the recipe.

**Honest one-liner:** the kit guarantees it *looks* right in every state; you
guarantee it *behaves* right. Pair it with a headless lib (Radix / Base UI /
Floating UI / native elements) and you get both with almost no styling work.

### ARIA contract — the roles/attributes each interactive component needs

The CSS is markup-agnostic, so YOU own the semantics. Wire exactly these (a
headless lib sets them for you; if you hand-roll, this is the checklist):

| Component | Required roles / ARIA |
|---|---|
| Dialog / sheet (.dialog/.sheet) | \`role="dialog"\` + \`aria-modal="true"\` + \`aria-labelledby\`; trap focus, Esc closes |
| Alert-dialog (.dialog--alert) | \`role="alertdialog"\` + \`aria-modal\` + \`aria-labelledby\` + \`aria-describedby\` |
| Tabs (.tabs/.tab) | container \`role="tablist"\`; triggers \`role="tab"\` + \`aria-selected\` + \`aria-controls\`; panel \`role="tabpanel"\` + \`aria-labelledby\`; arrow-key roving |
| Accordion (.accordion) | \`<details>/<summary>\` (free) OR header \`<button aria-expanded aria-controls>\` + region |
| Menu / dropdown / context (.menu) | trigger \`aria-haspopup="menu"\` + \`aria-expanded\`; \`role="menu"\` + items \`role="menuitem"\`; roving tabindex |
| Combobox / command (.combobox/.cmdp) | input \`role="combobox"\` + \`aria-expanded\` + \`aria-controls\` + \`aria-activedescendant\`; list \`role="listbox"\`, options \`role="option"\` + \`aria-selected\` |
| Select trigger (.select-trigger) | \`aria-haspopup="listbox"\` + \`aria-expanded\`; the panel is a listbox |
| Tooltip (.tt) | trigger \`aria-describedby="\<tipId\>"\`; tip \`role="tooltip"\` |
| Popover / hover-card (.popover) | trigger \`aria-expanded\` + \`aria-controls\`; panel \`role="dialog"\` if interactive |
| Switch / toggle (.toggle) | \`role="switch"\` + \`aria-checked\` |
| Slider (.slider) | \`role="slider"\` + \`aria-valuemin/max/now\` + \`aria-label\` |
| Progress (.progress/.usage) | \`role="progressbar"\` + \`aria-valuenow/min/max\` |
| OTP (.otp) | group \`role="group"\` + \`aria-label\`; each slot \`aria-label="Digit N of M"\` |
| Sortable table header (.tbl th) | \`aria-sort="ascending"\|"descending"\|"none"\` |
| Toast / status (.toast-stack) | \`role="status"\` (polite) or \`role="alert"\` (assertive) + \`aria-live\` |

Disabled = native \`disabled\` (or \`aria-disabled="true"\` on non-form elements);
invalid fields = \`aria-invalid="true"\` (pairs with \`.in.is-error\` / \`.select-trigger.is-error\`).

## Accessibility check (already verified)

- Button text on primary: ${cc.inkOnPrimary.toFixed(2)}:1 ${cc.inkOnPrimary >= 4.5 ? '— passes WCAG AA' : '— BELOW WCAG AA, flag this'}
- Primary as text on background: ${cc.primaryOnBg.toFixed(2)}:1 — use as a
  surface, not as text. For colored text, use \`--k-primary-soft\` tints.

## The tokens (drop into your globals.css or app.css)

\`\`\`css
${css}
\`\`\`

---

That's the entire system. Now I'll describe what I want built.`
}
