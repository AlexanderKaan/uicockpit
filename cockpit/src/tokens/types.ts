
/* Color theme preset — pure brand colors (3 hex values: primary, secondary,
 * accent). Decoupled from Style so every Style works with every Color theme.
 *   mono   → greyscale, no chroma (special — shown above divider in picker)
 *   cobalt → mineral blue
 *   jade   → mineral green
 *   ember  → glowing coal, warm orange/red
 *   coral  → reef pigment, pink/magenta
 *   indigo → deep purple-blue pigment */
export type ColorTheme =
  | 'mono'
  | 'cobalt'
  | 'sky'
  | 'teal'
  | 'jade'
  | 'indigo'
  | 'violet'
  | 'coral'
  | 'rose'
  | 'ember'

export type ColorMode = 'mono' | 'tone'
export type Mode = 'light' | 'dark'
// Removed 'pill' as a global radius — applying 999px to every surface (cards,
// dialogs, inputs) always produces an off-balance UI. Always-round elements
// (badges, status dots, slider tracks, progress bars) hardcode their own
// 999px regardless of this setting.
export type Radius = 'none' | 'subtle' | 'soft' | 'round'

// Button corner radius. 'match' (the default) FOLLOWS the global Radius so
// buttons and inputs/cards line up — the shadcn/Linear norm. The absolute
// values are explicit opt-OUTs for deliberate divergence: a pill button on a
// soft-corner card is a valid combo (think Airbnb: round cards, pill CTAs),
// or square buttons on rounded cards. 'none' = square.
export type ButtonShape = 'match' | 'none' | 'subtle' | 'soft' | 'round' | 'pill'
/** Density (user-facing label; internal name kept as `Stature`/`stature`) —
 * the macro decision before all others. Cascades to --k-space, button/input/
 * toggle defaults, date picker cell size, row grammar default. ONE knob,
 * whole UI follows.
 *
 * Scale — ONE axis for the interface's SIZE + DENSITY. Replaces the former
 * Style + Density/Stature controls: drives control heights, --k-space and
 * row/toggle/cell sizing. Does NOT touch font-weight (UI weight is a fixed
 * system constant — keeping weight out of Scale avoids overlap with the
 * typography controls), nor Text size, radius, borders, depth or motion —
 * those are their own controls. 3 steps, default in the middle (one tighter,
 * one roomier) — the industry-standard density set (= Material 3's three named
 * tiers, = shadcn sm/default/lg control heights 32/36/40). Each tier maps onto a
 * real premium product so every step is independently polished:
 *    compact     → Linear / Cursor — dense pro-tool, small (32px controls)
 *    default     → shadcn / Stripe — clear and normalised, DEFAULT (36px)
 *    comfortable → Notion — calm, roomy, reading-friendly (40px)
 * (A 4th "spacious" tier was dropped: no premium-app ships controls beyond ~40px;
 * it inflated buttons/spacing and was the only tier with off-grid values.) */
export type Scale = 'compact' | 'default' | 'comfortable'
/* Text size — S/M/L/XL scales the whole 6-tier type scale (h1/h2/h3/body/
 * small/eyebrow) proportionally. md is the sensible default (body 14, nav 14,
 * h3 16 — aligned with shadcn/Material's 14px UI floor). */
export type TypeScale = 'sm' | 'md' | 'lg' | 'xl'
export type IconSet = 'hairline' | 'line' | 'rounded' | 'bold' | 'solid'
/* UI text weight is a fixed system constant (semibold) — no control, not driven
 * by Scale or Text size. UI_WEIGHTS (fonts.ts) is the lookup; this stays as the
 * vocabulary for that table. */
export type UiWeight = 'medium' | 'semibold' | 'bold'
export type Elevation = 'flat' | 'soft' | 'sharp' | 'default'
/* Border prominence — its OWN control (pulled out of Surface depth): how visible
 * the 1px box edge is, as a tint on the neutral ladder. 4 steps centred on the
 * default 'subtle'. Independent of depth so a Layered card can still have a
 * quiet edge (or a Flat card a clearer one). */
export type Borders = 'faint' | 'subtle' | 'medium' | 'strong'
export type Motion = 'none' | 'snappy' | 'smooth' | 'playful'
/* Tempo — multiplier on the durations chosen by `motion`. Snappy reads
 * pro-tool fast, Generous reads consumer-app considered. Together with
 * motion this lets the user dial speed without giving up the curve. */
export type MotionTempo = 'snappy' | 'normal' | 'generous'
/* Curve character — which easing family populates --k-ease / -out / -in.
 *  standard   = current shadcn/Tailwind default (cubic-bezier(.4,0,.2,1))
 *  emphasized = Material 3 emphasized — slow-then-fast accelerate, decisive
 *               decelerate. Used for primary state changes, dialog enters.
 *  spring     = mild overshoot on decelerate — playful, Apple-style. */
export type MotionCurve = 'standard' | 'emphasized' | 'spring'
/* (The former StateLayer / "Emphasis" control was removed — hover/selected
 * overlay intensity is now a fixed subtle constant in buildTokens. The
 * --k-state-* tokens are still emitted + overridable in exports.) */
/* Background — contrast of the surface grey ramp (soft = flat canvas, crisp =
 * separated layers). Exposed in the panel as "Background". */
export type Contrast = 'soft' | 'balanced' | 'crisp'
/* Neutral temperature. 'auto' (default) tints the grey ladder toward the BRAND
 * hue — the Linear/Vercel "the greys carry a whisper of the brand" trick, pure
 * OKLCH. cool/neutral/warm are explicit overrides; mono falls back to pure grey. */
export type Neutral = 'auto' | 'cool' | 'neutral' | 'warm'
/* Decorative palette character — the 6-swatch set used for charts AND the
 * decorative layer (avatars, category tiles, cover art, preload placeholders).
 * Exposed as --k-accent-1..6 (flat) + --k-accent-N-ink + --k-grad-1..6
 * (gradient pairs); --k-chart-1..6 share the same colours.
 * All three are MULTI-HUE and derived from (not copies of) the brand hue, so
 * avatars / chart series get distinct colours:
 *   pastel = soft & light · bright = Material-style clear/legible/modern ·
 *   vivid = saturated & punchy. All three rotate with the brand colour. */
export type Palette = 'pastel' | 'vivid' | 'bright'
/* Sidebar treatment — how the app shell (sidebar, top bar, rails) reads against
 * the main content. Its OWN axis, NOT "depth/elevation". User label: "Sidebar".
 *  flush    → "Seamless": sidebar flows with the page; a hairline carries the
 *             separation (Linear / Vercel / Stripe / Mercury). The clean default.
 *  recessed → "Recessed": sidebar sits in a SUNKEN well (--k-chrome-bg =
 *             surf.sunken), flush to the edges + one seam; content reads as the
 *             brighter plane lifted above it (macOS / Windows-settings depth).
 *  panel    → "Floating": a distinct tinted room — own surface, inset margin,
 *             soft shadow, border-radius that follows Box radius (Raycast).
 * Exposes `--k-chrome-bg` + (for panel) the inset/radius/ring via CSS. */
export type Chrome = 'flush' | 'recessed' | 'panel'

/* Surface depth — purely about ELEVATION: how much surfaces lift off the page
 * via shadow, plus the neutral ramp contrast that supports that read. It does
 * NOT touch the app-chrome (that's the separate Chrome axis — flush vs panel)
 * nor the border prominence (the separate Border control). Resolved via the
 * DEPTH table → contrast + elevation only. Shadows auto-tint toward the brand.
 *   flat    → Linear/Vercel: minimal ramp, ZERO shadow (the border carries it)
 *   soft    → shadcn-default: subtle ramp, gentle shadow
 *   raised  → moderate ramp, balanced drop shadow
 *   layered → Notion/Material: crisp ramp, deep shadow.
 *   (Contrast/Elevation are INTERNAL resolution types, not user-facing.) */
export type SurfaceDepth = 'flat' | 'soft' | 'raised' | 'layered'

export type Hex = string

export interface Config {
  /* Orthogonal preset axes (#184 May 2026): Style = form/shape language
   * only, ColorTheme = 3 brand hex values only. The two are picked
   * independently in the panel; helpers in stylesAndThemes.ts apply the
   * underlying tokens. Typography (fonts + scale + UI text micro-decisions)
   * is a third independent axis exposed via individual controls. */
  colorTheme: ColorTheme
  color: ColorMode
  radius: Radius
  buttonShape: ButtonShape
  /* Scale — interface size + presence macro (drives sizing, spacing AND UI
   * weight; replaces Style + Density + the separate UI-weight control). */
  scale: Scale
  typeScale: TypeScale
  fontDisplay: string
  fontBody: string
  iconSet: IconSet
  /* Surface depth macro — purely elevation (shadow + ramp contrast); see
   * SurfaceDepth. */
  surfaceDepth: SurfaceDepth
  /* App-chrome separation — flush vs panel; its own axis (see Chrome). */
  chrome: Chrome
  /* Border prominence — standalone (see Borders). */
  borders: Borders
  motion: Motion
  motionTempo: MotionTempo
  motionCurve: MotionCurve
  /* Single brand hue. Secondary + accent are DERIVED from this in buildTokens
   * — one color in, a harmonious family out (shadcn/Linear model). */
  cPrimary: Hex
  palette: Palette
  neutral: Neutral
  mode: Mode
}

export interface SystemColor {
  k: 'success' | 'warning' | 'danger' | 'info'
  hex: Hex
  soft: Hex
}

export interface Tokens {
  mode: Mode
  primaryHex: Hex
  secHex: Hex
  accentHex: Hex
  iconSet: IconSet
  sysList: SystemColor[]
  vars: Record<string, string | number>
  cc: { primaryOnBg: number; inkOnPrimary: number }
}

