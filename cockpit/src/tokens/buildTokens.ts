import type {
  ButtonShape,
  Config,
  Scale,
  Elevation,
  Borders,
  Contrast,
  SurfaceDepth,
  Motion,
  MotionTempo,
  MotionCurve,
  Radius,
  SystemColor,
  Tokens,
  TypeScale,
} from './types'
import { paletteSet, clampToAA, contrast, hexToHsl, hsl, hslA, hslToHex, okAccentScale, okNeutralScale, readableInk, TEMP } from './color'
import { customFontFamily, isCustomFont, SERIF_FONTS, SYSTEM_FONT, SYSTEM_STACK, UI_MONO, UI_WEIGHTS } from './fonts'

// Tailwind/shadcn convention: dimensional tokens emit in REM on a 16px root, so
// typography + spacing + control sizing scale with the user's root font-size
// (browser zoom-by-text, accessibility — WCAG "resize text"). 1px borders,
// stroke weights, focus rings and shadows stay px (they must NOT scale with the
// font). The 4pt grid stays clean: 4px = 0.25rem, 16px = 1rem.
const REM_BASE = 16
// NB: zero MUST keep a unit ('0rem', not bare '0'). A bare unitless 0 fed into
// `calc(var(--k-radius-md) * 0.6)` becomes a unitless 0, and `max(12px, 0)` then
// mixes a length with a number → INVALID max() → the whole padding declaration is
// dropped (e.g. inputs/boxes lose their padding at Box radius = None). '0rem' is a
// length, so `max(12px, 0rem)` resolves to 12px. This bit us once; keep the unit.
const rem = (px: number): string => (px === 0 ? '0rem' : `${+(px / REM_BASE).toFixed(4)}rem`)

const RAD: Record<Radius, number> = { none: 0, subtle: 5, soft: 10, round: 16 }
// Button shape is independent of the global Radius. 'none' = square (0px),
// 'pill' = 999px which on a button means "fully capsule" — the iconic Airbnb /
// Spotify Continue / GitHub Save button shape.
// Absolute button radii — the explicit opt-OUTs. 'match' is NOT here; it
// resolves to the box radius at build time (see below).
const BTN: Record<Exclude<ButtonShape, 'match'>, number> = {
  none: 0,
  subtle: 5,
  soft: 10,
  round: 16,
  pill: 999,
}
/* === Scale cascade table ====================================
 * One row per Scale step — the SIZE + DENSITY macro. Columns are everything the
 * one knob drives: spacing, control heights, row/toggle/cell sizing. It does
 * NOT drive font-weight — UI text weight is a fixed system constant (semibold),
 * so Scale stays purely about size and never overlaps with the typography
 * controls. btnH == inH per step so action rows like `[stepper][CTA]` read as
 * one block. 4 steps, default at position 2. */
type ScaleRow = {
  space: number       // --k-space — the small rhythm unit (gaps, component padding)
  pad: number         // --k-pad — box/container padding (cards, dialogs). Floored at
                      //   16 (dense) / 24 (default = shadcn p-6); never sub-standard.
  stackGap: number    // --k-stack-gap — the canonical ADJACENT-CONTROLS gap, any
                      //   axis: stacked buttons (Save/Cancel), a horizontal
                      //   button pair (Google/GitHub), list rows. shadcn gap-2/3.
  btnH: number        // button default height
  inH: number         // input default height
  rowDefault: 'sm' | 'md' | 'lg' // default row tier
  calCell: number     // date picker cell size
  toggleW: number     // toggle default width
  toggleH: number     // toggle default height
}
// All spacing snaps to the 4pt grid — the discipline that makes Tailwind/shadcn/
// Material read clean. CRUCIAL: the two growth rates are DIFFERENT, on purpose.
//   • Control size + internal padding (btnH/inH, pad) scale GENEROUSLY with Scale
//     — bigger tap-targets + more breathing room are what "comfortable" means.
//   • Vertical RHYTHM between elements (space, stackGap) grows much more GENTLY
//     and plateaus — exactly how mature systems do it (Material density only
//     compacts; Carbon condensed; Radix bounded ±10%; shadcn fixed space-y-*).
//     Linearly inflating the rhythm makes elements drift apart and the layout
//     read loose/disconnected. So Comfortable keeps Default's 16px field rhythm
//     and only its controls/padding grow.
//   pad      = box padding (shadcn p-4/6/7/8)            — generous growth
//   space    = field/section rhythm (shadcn space-y-3/4) — gentle, plateaus
//   stackGap = adjacent buttons/rows (shadcn gap-2/3)    — gentle, plateaus
const SCALE: Record<Scale, ScaleRow> = {
  // 3 tiers on a clean 4px grid (= shadcn sm/default/lg = Material 3's three
  // density tiers). btnH 32/36/40, even +4 ramp, every value ÷4. (Spacious was
  // dropped: inflated controls past any premium-app precedent + held the only
  // off-grid values 50/46.)
  compact:     { space: 12, pad: 16, stackGap: 8, btnH: 32, inH: 32, rowDefault: 'sm', calCell: 28, toggleW: 28, toggleH: 14 },
  default:     { space: 16, pad: 24, stackGap: 8, btnH: 36, inH: 36, rowDefault: 'md', calCell: 32, toggleW: 32, toggleH: 18 },
  comfortable: { space: 16, pad: 28, stackGap: 8, btnH: 40, inH: 40, rowDefault: 'lg', calCell: 40, toggleW: 40, toggleH: 22 },
}
// Motion table — speed setting controls all three duration tiers.
// Easings are split into emphasized (standard state-change), decelerate
// (enter — Material 3 "emphasized decelerate"), and accelerate (exit).
// This mirrors how shadcn/Radix and Material 3 both reason about motion:
// incoming elements decelerate into place, outgoing accelerate away.
/* Base duration tiers per motion preset. Tempo (below) multiplies these
 * numerically — kept as numbers here so we can do that math without
 * parsing strings. */
const MOT_BASE: Record<Motion, { fast: number; normal: number; slow: number }> = {
  none:    { fast: 0,   normal: 0,   slow: 0   },
  snappy:  { fast: 70,  normal: 110, slow: 180 },
  smooth:  { fast: 120, normal: 200, slow: 320 },
  playful: { fast: 150, normal: 260, slow: 380 },
}
/* Tempo multipliers — pro-tool fast → consumer-app considered. Stack with
 * motion: a snappy base + generous tempo still feels quicker than a
 * smooth base + snappy tempo. */
const TEMPO: Record<MotionTempo, number> = {
  snappy:   0.72,
  normal:   1.0,
  generous: 1.42,
}
/* Curve family — populates --k-ease / -out / -in. Standard is current
 * default; emphasized is Material 3's "Material You" feel (slow-then-fast
 * accelerate, decisive decelerate); spring adds a mild overshoot on
 * decelerate for Apple-style playfulness. */
const CURVE: Record<MotionCurve, { ease: string; easeOut: string; easeIn: string }> = {
  standard:   { ease: 'cubic-bezier(.4,0,.2,1)',    easeOut: 'cubic-bezier(.05,.7,.1,1)', easeIn: 'cubic-bezier(.3,0,.8,.15)' },
  emphasized: { ease: 'cubic-bezier(.2,0,0,1)',     easeOut: 'cubic-bezier(.05,.7,.1,1)', easeIn: 'cubic-bezier(.3,0,.8,.15)' },
  spring:     { ease: 'cubic-bezier(.34,1.56,.64,1)', easeOut: 'cubic-bezier(.34,1.3,.64,1)', easeIn: 'cubic-bezier(.3,0,.8,.15)' },
}
/* MD3 emphasized easings — always exposed as tokens regardless of curve
 * choice, so component authors can reach for them directly when a primary
 * transition (e.g. dialog enter, FAB morph) needs the snap. */
const EMPHASIZED = {
  standard: 'cubic-bezier(.2,0,0,1)',
  accel:    'cubic-bezier(.3,0,.8,.15)',
  decel:    'cubic-bezier(.05,.7,.1,1)',
}
// Hover/selected overlay intensity — a FIXED system constant (the old "Emphasis"
// control's subtle value). The medium/bold steps read too dark for the premium
// default; locking to subtle keeps selection states tasteful everywhere. The
// --k-state-* tokens are still emitted + overridable in exports for the rare
// data-dense app that wants a heavier selection.
const STATE_LAYER_SUBTLE = 0.05
/* Type scale — [h1, h2, h3, body, small] in px, per S/M/L/XL step.
 * The floor is deliberate: body/nav never drop below the 13–14px that
 * shadcn + Material 3 treat as the UI minimum. h3 (card titles, section
 * heads) sits at ~16 so headings actually out-rank body. Eyebrow (uppercase
 * micro-label) is derived just under small. */
const TS: Record<TypeScale, [number, number, number, number, number]> = {
  sm: [26, 19, 15, 13, 11.5],
  md: [30, 22, 16, 14, 12],
  lg: [34, 24, 17, 15, 12.5],
  xl: [38, 27, 19, 16, 13],
}

function shadowFor(elevation: Elevation, shTone: string): { xs: string; sm: string; md: string; lg: string } {
  // xs = the shadcn hairline lift (≈ shadow-xs): a single near-flat 1px shadow
  // for outline buttons / quiet raised controls. Follows the elevation control
  // (flat → none) so a flat kit keeps everything truly flat.
  if (elevation === 'flat') return { xs: 'none', sm: 'none', md: 'none', lg: 'none' }
  if (elevation === 'soft')
    return {
      xs: `0 1px 2px hsl(${shTone}/.05)`,
      sm: `0 1px 2px hsl(${shTone}/.07)`,
      md: `0 4px 14px hsl(${shTone}/.10)`,
      lg: `0 14px 40px hsl(${shTone}/.16)`,
    }
  if (elevation === 'sharp')
    return {
      xs: `0 1px 0 hsl(${shTone}/.16)`,
      sm: `0 1px 0 hsl(${shTone}/.22)`,
      md: `0 2px 0 hsl(${shTone}/.20),0 3px 1px hsl(${shTone}/.14)`,
      lg: `0 4px 0 hsl(${shTone}/.20),0 8px 3px hsl(${shTone}/.16)`,
    }
  return {
    xs: `0 1px 2px hsl(${shTone}/.05)`,
    sm: `0 1px 2px hsl(${shTone}/.10)`,
    md: `0 2px 4px hsl(${shTone}/.10),0 6px 14px hsl(${shTone}/.12)`,
    lg: `0 4px 8px hsl(${shTone}/.10),0 12px 24px hsl(${shTone}/.14),0 24px 48px hsl(${shTone}/.14)`,
  }
}

/* Surface-depth macro → purely ELEVATION: the ramp contrast + drop shadow that
 * together say "how much do surfaces lift off the page". App-chrome separation
 * (flush vs panel) is its OWN axis now — not bundled here — so 'depth' honestly
 * means depth. 'raised' keeps the historical shadow default. */
const DEPTH: Record<
  SurfaceDepth,
  { contrast: Contrast; elevation: Elevation }
> = {
  flat: { contrast: 'soft', elevation: 'flat' },
  soft: { contrast: 'balanced', elevation: 'soft' },
  raised: { contrast: 'balanced', elevation: 'soft' },
  layered: { contrast: 'crisp', elevation: 'default' },
}

// Border prominence → neutral-ladder step (higher = darker = more visible). Its
// OWN control (not coupled to depth or crisp), so a Layered card can have a
// quiet edge. Centred on 'subtle' (the previous default). [light, dark] indices.
const BORDER_STEP: Record<Borders, [number, number]> = {
  faint: [4, 2],
  subtle: [5, 3],
  medium: [6, 4],
  strong: [7, 5],
}

/** Resolve the surface-depth macro into its four facets — for exports/handoff
 *  docs that need to name the underlying ramp/borders/chrome/shadow. */
export const resolveDepth = (d: SurfaceDepth) => DEPTH[d]

export function buildTokens(cfg: Config): Tokens {
  const mono = cfg.color === 'mono'
  const [ph, ps] = hexToHsl(cfg.cPrimary)
  // Neutral temperature. 'auto' (default) tints the grey ladder toward the BRAND
  // hue at a clamped low saturation — the Linear/Vercel "greys carry a whisper of
  // the brand" trick (pure OKLCH; okNeutralScale caps it to a true whisper). In
  // mono there's no brand chroma so it resolves to pure grey anyway. cool/neutral/
  // warm remain explicit overrides from the TEMP table.
  const t =
    cfg.neutral === 'auto'
      ? { h: ph, s: Math.min(Math.max(ps, 8), 14) }
      : TEMP[cfg.neutral]
  const dark = cfg.mode === 'dark'
  // Resolve the surface-depth macro into the four internal facets. (Named to
  // avoid colliding with the imported WCAG `contrast()`.)
  const depth = DEPTH[cfg.surfaceDepth]
  const rampContrast = depth.contrast
  const elevationMode = depth.elevation
  // Sidebar treatment — its own axis (seamless / recessed / floating), independent
  // Surface=Filled gives the nav a SUNKEN tint (--k-chrome-bg = surf.sunken) — the
  // recessed well. Outlined/Plain keep it flush (a hairline seam carries it). The
  // old "Floating" sidebar is now an Elevation expression (a .sidenav--floating
  // utility), so it's no longer a chrome-bg branch.
  const surfaceFilled = cfg.surface === 'filled'
  const surfacePlain = cfg.surface === 'plain'
  const chromeSunkenNav = surfaceFilled
  const spread = rampContrast === 'soft' ? 0.62 : rampContrast === 'crisp' ? 1.32 : 1

  // Neutral 12-step OKLCH ladder (Radix-contract; perceptually-even). Surfaces,
  // borders and text now map onto FIXED steps of ONE even scale instead of
  // per-token HSL lightness math — so the greys read as a coherent ramp (the
  // Linear/Radix "clean" feel). Emphasis (spread) nudges the chrome depth; crisp
  // deepens borders. See okNeutralScale.
  const N = okNeutralScale(t.h, t.s, dark, mono)
  const nStep = (i: number): string => N[Math.max(0, Math.min(11, Math.round(i)))]!
  const emph = rampContrast === 'soft' ? -1 : rampContrast === 'crisp' ? 1 : 0

  // Surface elevation — the CARD surface is FILLED a notch off the page so it
  // lifts off the canvas (the page tint no longer washes over everything). Light:
  // card = whitest step 1, page recessed to step 2. Dark: card a lighter grey
  // (step 3) above the darker page (step 2) above the deepest chrome (step 1).
  // pageBg is decoupled from surf.base below.
  const surf: { sunken: string; base: string; s2: string; raised: string; overlay: string } = dark
    ? {
        sunken: nStep(0),
        base: nStep(2),
        s2: nStep(3),
        raised: nStep(4),
        overlay: nStep(5),
      }
    : {
        base: nStep(0),
        raised: nStep(0),
        overlay: nStep(0),
        s2: nStep(1),
        sunken: nStep(3 + emph),
      }

  // Text tiers = the top of the ladder: step 12 (high-contrast), 11 (muted),
  // 9 (faint). Structural contrast — fg(12) on bg(1) is guaranteed by the anchors.
  const fg = {
    main: nStep(11),
    muted: nStep(10),
    faint: nStep(8),
  }

  // primary lightness — UI-safe clamp so button text stays readable.
  // In light mode the requested lightness gets capped at 52, but the clamp
  // also runs through clampToAA() which guarantees WCAG AA — this catches
  // mid-luminance hues (Spotify-green, Cloudflare-orange, Facebook-blue at
  // full saturation) that would otherwise fail.
  const pl0 = hexToHsl(cfg.cPrimary)[2]
  const warmHue = ph >= 18 && ph <= 70
  const psat = mono ? 0 : Math.min(ps, 82)
  /* Mono mode primary lightness — matches shadcn's near-black/near-white
   * defaults (oklch(0.205 0 0) light ≈ 12% L, oklch(0.922 0 0) dark ≈ 92% L).
   * Earlier 32%/74% gave medium-grey buttons that read as "muted" instead
   * of "default brand". A Mono theme should produce a confident
   * near-black (light) or near-white (dark) — the same restraint shadcn
   * uses for its zero-customisation baseline. */
  const requestedPl = mono ? (dark ? 92 : 12) : dark ? (warmHue ? 72 : 46) : Math.min(pl0, 52)
  const pl = mono ? requestedPl : clampToAA(ph, psat, requestedPl)
  const primaryHex = hslToHex(ph, psat, pl)
  // Primary family on the 12-step OKLCH ladder. Step 9 is PINNED to the
  // WCAG-safe solid (primaryHex) so --k-primary is byte-identical to before;
  // hover (step 10) and soft (step 3) are re-derived on the perceptually-even
  // ladder — the Radix "step = role" contract, now sharing the neutral ladder's
  // even cadence. (Mono: primaryHex is grey → the ladder is a grey ramp.)
  const P = okAccentScale(primaryHex, dark)
  const primary = P[8]!
  const primaryHover = P[9]!
  const primaryFg = readableInk(primaryHex)
  const primarySoft = P[2]!
  // Foreground on primary-soft fills (badges, chips, soft-tile icons).
  // Light mode: primary text on light primary-soft already passes AA, so
  // we keep the brand-tinted primary. Dark mode: primary is too dim against
  // dark primary-soft, so we boost saturation + lightness to a brighter
  // brand-tinted ink — preserves brand feel AND passes AA.
  const primarySoftFg = mono
    ? (dark ? hsl(ph, 12, 88) : hsl(ph, 14, 22))
    : (dark ? hsl(ph, Math.max(70, psat), 82) : primary)

  // Secondary + accent are DERIVED from the single brand hue (ph/psat) — one
  // color in, a harmonious family out. Secondary = muted sibling (quiet
  // buttons / soft fills); accent = brighter sibling (charts, highlights).
  // Same hue throughout → guaranteed harmony + a monochromatic chart series.
  const sh = ph
  const ss = Math.round(psat * 0.6)
  const sl = dark ? 56 : 48
  const ssat = mono ? 0 : Math.min(ss, 82)
  /* Mono locks lightness to a neutral midpoint (chroma opted out). Tone uses
   * the derived sibling lightness above. */
  const secL = mono ? (dark ? 60 : 54) : sl
  const secHex = hslToHex(sh, ssat, secL)
  const secMain = hsl(sh, ssat, secL)
  const secFg = readableInk(secHex)
  const secSoftHex = mono
    ? hslToHex(sh, dark ? 5 : 6, dark ? 20 : 93)
    : hslToHex(
        sh,
        dark ? Math.max(20, Math.min(ssat, 36)) : Math.max(24, Math.min(ssat, 44)),
        dark ? 23 : 91,
      )
  const secSoftFg = readableInk(secSoftHex)

  const ah = ph
  const as_ = Math.min(psat + 6, 88)
  const al = dark ? 62 : 54
  const accentSat = mono ? 0 : Math.min(as_, 88)
  const accentL = mono ? (dark ? 60 : 52) : al
  const accent = hsl(ah, accentSat, accentL)
  const accentHex = hslToHex(ah, accentSat, accentL)
  const accentFg = readableInk(accentHex)

  // Chart-series palette — 6 colors derived from the brand hue per the chosen
  // strategy (brand tints / analogous / spectrum). Mono → greyscale ramp.
  const pal = paletteSet(cfg.palette, ph, mono ? 0 : psat, mono, dark)
  const chartCols = pal.base

  // --k-fill: solid brand fill for decorative directional fills (progress,
  // slider, active toggle). Always solid — the gradient option was removed to
  // keep the system simple and read cleaner as a pro interface kit.
  const fill = primary

  // system / status — fixed hues, derived saturation/lightness.
  // Per-color soft-saturation multiplier: yellow loses identity faster than
  // red/green/blue when desaturated (hsl(38, 34%, 94%) reads as camel/beige
  // not yellow). Tailwind/Material/Apple all keep warning soft fills near
  // 80-100% saturation so the buttercream stays distinctly yellow.
  // The `softMul` per-color tunes how much we dim the base for the -soft
  // variant; warning gets a much higher multiplier than the others.
  const sysL = dark ? 58 : 48
  const sysSoftL = dark ? 20 : 94
  const SYS: Array<{ k: SystemColor['k']; h: number; s: number; softMul: number }> = [
    { k: 'success', h: 145, s: dark ? 52 : 58, softMul: 0.42 },
    // Hue shifted 38 → 45 (more yellow-centered, less orange-leaning) and
    // softMul bumped to 0.78 so the high-lightness fill reads as soft yellow,
    // not beige. Matches the Tailwind yellow-100 / Material warning container
    // family.
    { k: 'warning', h: 45, s: dark ? 75 : 88, softMul: 0.78 },
    { k: 'danger',  h: 4,   s: dark ? 62 : 68, softMul: 0.42 },
    { k: 'info',    h: 212, s: dark ? 60 : 70, softMul: 0.42 },
  ]
  const sysVars: Record<string, string> = {}
  const sysList: SystemColor[] = []
  SYS.forEach(({ k, h, s, softMul }) => {
    const main = hslToHex(h, s, sysL)
    const softS = dark ? Math.round(s * (softMul + 0.08)) : Math.round(s * softMul)
    const soft = hslToHex(h, softS, sysSoftL)
    sysVars['--k-' + k] = hsl(h, s, sysL)
    sysVars['--k-' + k + '-fg'] = readableInk(main)
    sysVars['--k-' + k + '-soft'] = hsl(h, softS, sysSoftL)
    sysVars['--k-' + k + '-soft-fg'] = readableInk(soft)
    sysList.push({ k, hex: main, soft })
  })

  // Border on the SAME neutral ladder — prominence set by the standalone Border
  // control (faint→strong) via BORDER_STEP, NOT by depth/crisp, so a Layered card
  // can still wear a quiet edge. (--k-input-border aliases this.)
  const border = nStep(BORDER_STEP[cfg.borders][dark ? 1 : 0])

  const r = RAD[cfg.radius]
  // Button radius. 'match' (the default) FOLLOWS the box radius so buttons and
  // inputs/cards line up — the shadcn/Linear norm. The absolute values are
  // explicit opt-OUTs for deliberate divergence (Airbnb's soft cards + pill
  // CTAs; square buttons on rounded cards). The `?? r` guards a stale
  // shared-hash value — degrades to "match the box" instead of NaNpx.
  const btnShape = cfg.buttonShape ?? 'match'
  const btnRadius = btnShape === 'match' ? r : (BTN[btnShape] ?? r)
  const radius = {
    // Inner/nested radius — for elements that sit INSIDE a box (kanban cards,
    // tree rows, tags, art thumbnails, tooltips). Scales off the box radius but
    // stays subordinate (~2/3) so a nested corner never competes with its
    // container's. Square box → square nested. Was an undefined token (silent
    // 6px fallback everywhere), so these never followed the Radius setting.
    sm: rem(Math.round(r * 0.66)),
    md: rem(r),
    lg: rem(Math.round(r * 1.45)),
    // Always pill — this token is for elements that are ALWAYS pill (badges,
    // status dots, slider tracks, progress, toggle tracks). Independent of
    // the user's Radius setting because those metaphors don't scale.
    pill: '999px',
    button: rem(btnRadius),
  }
  /* Scale is the size + presence macro — cascades to space, button/input/toggle
   * defaults, calendar cell size, row grammar default AND ui-weight. ONE knob,
   * whole kit follows. See SCALE table at the top. */
  const st = SCALE[cfg.scale]
  const space = rem(st.space)
  // Box padding is a SEPARATE token from --k-space (the gap/rhythm unit). Cards
  // and dialogs use it with a real floor (default 24px = shadcn `p-6`, the modern
  // "pretty" minimum; compact dips to 16 = Material/Tailwind `p-4` dense floor).
  // Keeping it apart means raising box padding never balloons the inter-element
  // gaps — exactly how shadcn separates `p-6` from `gap-2/4`.
  const pad = rem(st.pad)
  // Fine-grained spacing grid emitted as named tokens (--k-s-2 … --k-s-32, REM,
  // keyed by px-at-16-root). Components reference these for internal padding/gap
  // instead of hardcoding px — same scale in the preview AND every export.
  const sVars: Record<string, string> = { '--k-s-0': '0' }
  for (const px of [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32]) sVars[`--k-s-${px}`] = rem(px)

  // Shadows auto-tinted toward the brand hue (Stripe/Linear premium feel): a
  // low-sat dark version of the brand instead of a generic near-black-blue.
  // Mono stays near-neutral. Dark mode keeps pure black (tint reads as muddy on
  // dark surfaces). shTone is the raw `H S% L%` triple shadowFor interpolates.
  const shTone = dark ? '0 0 0' : `${ph.toFixed(0)} ${mono ? 8 : 16}% 18%`
  const shadow = shadowFor(elevationMode, shTone)
  // The "hairline" of the Flat depth is simply the subtle 1px border (already
  // present on every card) + ZERO shadow + flat chrome — the Linear/Vercel
  // look. (We don't fake a box-shadow ring: cards keep a real 1px border, so a
  // ring would double the edge. The no-layout-shift benefit only matters if
  // borders toggled, which the depth macro no longer does — bw is always 1px.)
  const bw = '1px'

  /* Motion resolution — base preset × tempo multiplier × curve family.
   * The three dimensions stack so a Smooth+Generous+Spring combo feels
   * deliberate and bouncy, while Snappy+Snappy+Standard reads as a
   * dense pro-tool. */
  const base = MOT_BASE[cfg.motion]
  const mul = TEMPO[cfg.motionTempo]
  const curveSet = CURVE[cfg.motionCurve]
  const ms = (n: number) => `${Math.round(n * mul)}ms`
  const motion = {
    fast: ms(base.fast),
    normal: ms(base.normal),
    slow: ms(base.slow),
    ease: cfg.motion === 'none' ? 'linear' : curveSet.ease,
    easeOut: cfg.motion === 'none' ? 'linear' : curveSet.easeOut,
    easeIn: cfg.motion === 'none' ? 'linear' : curveSet.easeIn,
  }
  const sla = STATE_LAYER_SUBTLE
  // Hover / selected wash — a NEUTRAL overlay scaling with Emphasis. NOT pure
  // black/white: at L 0%/100% the Neutrals hue/sat vanish, so the warm/cool
  // tint wouldn't carry into the grey. So we use a near-black (light) /
  // near-white (dark) at the neutral HUE — and the SAME saturation as the
  // surfaces (t.s). The overlay sits at L 14/86 where chroma already reads, so
  // matching t.s keeps the selection's TEMPERATURE in step with the surfaces:
  // same hue, proportional intensity (~1.35× the surface tint after compositing
  // — the unavoidable "darker = slightly more present"). A previous ×2.4 boost
  // over-saturated the overlay (→ selection ran ~1.9× warmer/cooler than the bg
  // at the warm/cool neutrals); dropping it makes the ratio consistent across
  // cool/neutral/warm so selection + background read as one temperature.
  const stS = t.s
  const stL = dark ? 86 : 14
  const stateHover = hslA(t.h, stS, stL, sla)
  // Selected fill — a notch stronger than hover so a selected item reads above
  // a merely-hovered one. Always neutral: Emphasis is a pure intensity dial.
  const selA = Math.min(sla + 0.05, 0.4)
  const stateSelected = hslA(t.h, stS, stL, selA)
  // Fallback to md for any unknown value — old URL hashes may carry the
  // retired 'normal'/'tight'/'expressive' keys, and a crash there is worse
  // than silently re-centering on the default scale.
  const [tsH1, tsH2, tsH3, tsBody, tsSmall] = TS[cfg.typeScale] ?? TS.md
  // Eyebrow = uppercase micro-label (table heads, stat labels, group labels).
  // Sits just under small; the .eyebrow role adds the caps + tracking.
  const tsEyebrow = Math.max(10, Math.round((tsSmall - 1) * 10) / 10)

  // UI text weight — a FIXED system constant (semibold), independent of Scale.
  // Scale drives size + density only; pinning weight here keeps it from drifting
  // with the size macro and overlapping the typography controls.
  const uiW: number = UI_WEIGHTS.semibold

  const displayIsSerif = SERIF_FONTS.includes(cfg.fontDisplay)

  // Resolve font name to a CSS font-family string. Three branches:
  //   System    → OS-native stack (no webfont request)
  //   Custom    → strip "Custom: " prefix, quote the family, fallback to sans
  //   Standard  → quoted Google Font name + appropriate generic fallback
  const fontFamily = (name: string, isSerif: boolean): string => {
    if (name === SYSTEM_FONT) return SYSTEM_STACK
    if (isCustomFont(name)) return `'${customFontFamily(name)}',${isSerif ? 'serif' : 'sans-serif'}`
    return `'${name}',${isSerif ? 'serif' : 'sans-serif'}`
  }

  // Page canvas (--k-bg). The page is NOT a system surface — it's the neutral
  // substrate the interface BLOCKS (cards, panels, chrome) tile onto. So it is
  // decoupled from the neutral temperature: a warm/cool ramp tints the blocks
  // (surfaces, borders, text), never the page. Light = PURE WHITE (no tint, no
  // recessed grey — a tinted page reads as a configurable "background" that
  // isn't part of the system, and makes every panel look like a floating card).
  // Dark = a near-black neutral floor recessed below the card surface so panels
  // still lift off the canvas (the dark-mode elevation the user asked for).
  const pageBg = dark ? nStep(1) : 'oklch(100% 0 0)'

  // Input border — TRACKS the Border control (Faint→Strong), one neutral step
  // firmer than the decorative --k-border so a field still reads as a field.
  // Intentionally NO hard 3:1 floor (the old behaviour clamped Faint/Subtle/
  // Medium all to the same passing step, so the control did nothing to inputs).
  // Like shadcn's opinionated input: Faint/Subtle give a soft light rim;
  // Medium/Strong clear WCAG 1.4.11 (3:1) for a11y-first kits — the user's
  // Border choice IS the accessibility lever. .in keeps bg = --k-surface.
  const inputBorder = nStep(Math.min(9, BORDER_STEP[cfg.borders][dark ? 1 : 0] + 1))

  return {
    mode: cfg.mode,
    primaryHex,
    secHex,
    accentHex,
    iconSet: cfg.iconSet,
    sysList,
    vars: {
      ...sVars,
      '--k-bg': pageBg,
      // App-chrome bg — sidebars, top bars, app rails. Driven by the Chrome
      // axis (NOT depth): Panel = sunken tint (a distinct room); Flush = same as
      // page bg, separated by a hairline (Linear/Vercel/Stripe). The shell CSS
      // adds the inset margin + box-radius + ring + shadow for Panel.
      '--k-chrome-bg': chromeSunkenNav ? surf.sunken : pageBg,
      '--k-surface': surf.base,
      '--k-surface-sunken': surf.sunken,
      '--k-surface-2': surf.s2,
      // Input fill — a recessed, BRAND-TINTED neutral (from the same ramp that
      // carries the whisper-of-brand, not a dead grey). Gives form fields a
      // perceivable filled-field surface (Material/shadcn-muted) so the border
      // can stay soft + Border-control-responsive while the field reads clearly.
      '--k-input-bg': surf.sunken,
      // === Surface treatment (field facet) — the four tokens a field recipe reads
      // so ONE .in rule renders all three Surface modes (no selector branching):
      //   Outlined → fill + full border (the box; default = previous look).
      //   Filled   → fill, border transparent (the tonal fill carries it).
      //   Plain    → transparent, no box border, bottom hairline only (underline),
      //              radius 0. The Linear/Vercel minimal look.
      // Border (faint→strong) keeps feeding --k-input-border, so it tunes the line
      // colour in every mode (box edge, the filled-field's soft border, or the
      // underline) — Surface = WHERE the line is, Border = HOW STRONG.
      '--k-field-bg': surfacePlain ? 'transparent' : 'var(--k-input-bg)',
      '--k-field-border-color': surfaceFilled || surfacePlain ? 'transparent' : 'var(--k-input-border)',
      '--k-field-underline-color': surfaceFilled ? 'transparent' : 'var(--k-input-border)',
      '--k-field-radius': surfacePlain ? '0' : 'var(--k-radius-md)',
      // The TOP/SIDES edge colour on hover/focus. In Plain it stays transparent
      // (so a borderless field never grows a box on interaction — the bottom
      // underline carries the affordance instead, Material-style); in Outlined/
      // Filled the whole box edge lights up. The bottom always colours, so a
      // plain field's underline darkens on hover + goes brand on focus.
      '--k-field-hover-edge': surfacePlain ? 'transparent' : 'var(--k-state-border, var(--k-fg-faint))',
      '--k-field-focus-edge': surfacePlain ? 'transparent' : 'var(--k-ring)',
      // --k-track: the recessed grey behind INTERACTIVE control rails — slider
      // track, toggle off-state, segmented-control track. Deliberately a real
      // tonal step (~9% fg over surface ≈ shadcn's 0.92 switch grey), NOT
      // surface-2 (which sits ~2% off white and collapses at Flat depth). Tied
      // to fg so it stays a reliable grey at any surface depth and inverts
      // correctly in dark mode. The point: a white knob / pill must read.
      '--k-track': `color-mix(in srgb, ${fg.main} 9%, ${surf.base})`,
      '--k-surface-raised': surf.raised,
      '--k-surface-overlay': surf.overlay,
      // Overlay scrims — ONE source for the dim behind modals/sheets/lightbox
      // (was 3× hardcoded rgba). A black scrim reads on both light + dark pages.
      // --k-scrim: modal/sheet backdrop · --k-scrim-strong: full-bleed media (lightbox).
      '--k-scrim': 'rgba(0, 0, 0, 0.4)',
      '--k-scrim-strong': 'rgba(0, 0, 0, 0.86)',
      '--k-fg': fg.main,
      '--k-fg-muted': fg.muted,
      '--k-fg-faint': fg.faint,
      '--k-primary': primary,
      '--k-primary-hover': primaryHover,
      '--k-primary-fg': primaryFg,
      '--k-primary-soft': primarySoft,
      '--k-primary-soft-fg': primarySoftFg,
      // Text-selection background — semi-transparent brand tint, NOT the
      // solid primary-soft. Reason: solid primary-soft competes visually
      // with the input's focus ring (also brand-colored) when text is
      // selected inside a focused input. macOS-native uses ~25% alpha;
      // we use 18% in light mode (16% over white reads as ~93% lightness,
      // matching the old primary-soft brightness without the harsh solid)
      // and 28% in dark mode (selection needs more lift against dark bg).
      // Mono themes get an extra-low-saturation variant so highlights
      // don't peacock when the rest of the kit is greyscale.
      '--k-selection': mono
        ? hslA(ph, dark ? 14 : 12, dark ? 70 : 50, dark ? 0.32 : 0.18)
        : hslA(ph, psat, dark ? 64 : 50, dark ? 0.28 : 0.18),
      '--k-accent': accent,
      '--k-accent-fg': accentFg,
      '--k-chart-1': chartCols[0] ?? primary,
      '--k-chart-2': chartCols[1] ?? primary,
      '--k-chart-3': chartCols[2] ?? primary,
      '--k-chart-4': chartCols[3] ?? primary,
      '--k-chart-5': chartCols[4] ?? primary,
      '--k-chart-6': chartCols[5] ?? primary,
      // Decorative palette — same 6 swatches, exposed under the semantic
      // "accent" name for avatars / tiles / labels, each with a readable ink
      // and a soft gradient pair for cover-art & preload placeholders.
      '--k-accent-1': pal.base[0] ?? primary,
      '--k-accent-2': pal.base[1] ?? primary,
      '--k-accent-3': pal.base[2] ?? primary,
      '--k-accent-4': pal.base[3] ?? primary,
      '--k-accent-5': pal.base[4] ?? primary,
      '--k-accent-6': pal.base[5] ?? primary,
      '--k-accent-1-ink': pal.ink[0] ?? '#ffffff',
      '--k-accent-2-ink': pal.ink[1] ?? '#ffffff',
      '--k-accent-3-ink': pal.ink[2] ?? '#ffffff',
      '--k-accent-4-ink': pal.ink[3] ?? '#ffffff',
      '--k-accent-5-ink': pal.ink[4] ?? '#ffffff',
      '--k-accent-6-ink': pal.ink[5] ?? '#ffffff',
      // Soft chip pair — light tint + contrast-safe deep hue (icons/text on it)
      '--k-accent-1-soft': pal.soft[0] ?? primary,
      '--k-accent-2-soft': pal.soft[1] ?? primary,
      '--k-accent-3-soft': pal.soft[2] ?? primary,
      '--k-accent-4-soft': pal.soft[3] ?? primary,
      '--k-accent-5-soft': pal.soft[4] ?? primary,
      '--k-accent-6-soft': pal.soft[5] ?? primary,
      '--k-accent-1-soft-fg': pal.softFg[0] ?? primary,
      '--k-accent-2-soft-fg': pal.softFg[1] ?? primary,
      '--k-accent-3-soft-fg': pal.softFg[2] ?? primary,
      '--k-accent-4-soft-fg': pal.softFg[3] ?? primary,
      '--k-accent-5-soft-fg': pal.softFg[4] ?? primary,
      '--k-accent-6-soft-fg': pal.softFg[5] ?? primary,
      '--k-grad-1': pal.grad[0] ?? primary,
      '--k-grad-2': pal.grad[1] ?? primary,
      '--k-grad-3': pal.grad[2] ?? primary,
      '--k-grad-4': pal.grad[3] ?? primary,
      '--k-grad-5': pal.grad[4] ?? primary,
      '--k-grad-6': pal.grad[5] ?? primary,
      '--k-fill': fill,
      '--k-secondary': secMain,
      '--k-secondary-fg': secFg,
      '--k-secondary-soft': secSoftHex,
      '--k-secondary-soft-fg': secSoftFg,
      ...sysVars,
      '--k-border': border,
      '--k-input-border': inputBorder,
      '--k-ring': primary,
      '--k-ring-soft': primarySoft,
      // --k-ring-halo: same hue as --k-ring at ~28% alpha. Used as the
      // focus box-shadow ring. Because it's the SAME color as the border
      // (just dimmed), border + halo read as a single coherent soft ring
      // rather than two distinct lines — matches shadcn's `ring/50%` trick.
      // (--k-ring-soft is a separately-computed soft tint, useful for fills
      // but visually distinct from the border, which created a "double ring"
      // optical effect on focus.)
      '--k-ring-halo': `color-mix(in srgb, ${primary} 28%, transparent)`,
      // Hover/selected state border for cards/tiles/rows/nav — a neutral grey
      // (shadcn-default). State emphasis is purely neutral intensity now.
      '--k-state-border': dark ? hsl(t.h, t.s, 60) : hsl(t.h, t.s, 50),
      '--k-state-selected-bg': stateSelected,
      // Selected text/icon color — always the plain foreground. Selected states
      // read via the neutral wash (above), not a brand color.
      '--k-state-selected-fg': 'var(--k-fg)',
      '--k-bw': bw,
      '--k-radius-sm': radius.sm,
      '--k-radius-md': radius.md,
      '--k-radius-lg': radius.lg,
      '--k-radius-pill': radius.pill,
      // Button-specific radius — independent of the box radius so users can
      // pair pill buttons with soft cards (Airbnb pattern). 'none' = square.
      '--k-radius-button': radius.button,
      '--k-space': space,
      // Box/container inner padding — cards, dialogs, panels. Floored well above
      // --k-space (default 24 = shadcn p-6, compact 16 = Material/Tailwind p-4) so
      // every box meets the modern minimum without inflating the gap rhythm.
      '--k-pad': pad,
      // Standard vertical gap between STACKED cards/rows (radio-cards, kanban
      // column, slot picker, attachment list, event lists). One token → every
      // stacked list shares the same rhythm, and it scales with density.
      '--k-stack-gap': rem(st.stackGap),
      // Single-column FORM measure — the max line-length a stacked form body
      // (label → input → button-row) should occupy. A 700px-wide email field
      // is the classic anti-pattern: width is an affordance hint, so an email
      // (~30ch) shouldn't span a paragraph. 30rem (≈480px) matches Stripe
      // Checkout / shadcn dialog-forms / Material's single-column guidance.
      // The progress-rail/header of a wizard stays full-width; only the form
      // BODY caps to this. Fixed layout constant (not density-scaled): the
      // measure is about reading ergonomics, not spacing rhythm.
      '--k-form-measure': '30rem',
      '--k-shadow-xs': shadow.xs,
      '--k-shadow-sm': shadow.sm,
      '--k-shadow-md': shadow.md,
      '--k-shadow-lg': shadow.lg,
      // === Crisp & Tactile signature tokens =====================
      // These four tokens encode UIcockpit's "own" character. They cascade
      // into every recipe so the base set feels native-premium regardless
      // of which preset/density is active.
      //
      // --k-hairline: a "subtle edge" for cards/inputs/panels that NOW tracks
      // the Border control — it's a softer (55%) tint of the live --k-border, so
      // Faint→Strong moves it too, while staying gentler than the crisp border.
      // (Was a fixed low-alpha, decoupled from the control; the soft character is
      // kept, the responsiveness is added. Width = --k-bw, the control being
      // colour-based.) color-mix is already used across the token layer.
      '--k-hairline': `var(--k-bw) solid color-mix(in srgb, var(--k-border), transparent 45%)`,
      // --k-divider: the canonical INTERNAL separator (between rows in a list,
      // sections in a menu, header/body in a sheet). Unlike --k-hairline (a
      // fixed edge for component BOXES), the divider is COUPLED to the Borders
      // control at every step: width follows --k-bw (Off → 0px → no divider),
      // color follows --k-border (Subtle → soft grey, Solid → a step darker).
      // Use as `border-top: var(--k-divider)` / `border-bottom: var(--k-divider)`,
      // or for background-based hairlines pair `height: var(--k-bw)` with
      // `background: var(--k-border)`. ONE token → every divider responds.
      '--k-divider': 'var(--k-bw) solid var(--k-border)',
      // --k-shadow-tactile: 1px white top-highlight + ambient base shadow.
      // This is THE signature — pressables look like they have a glass
      // top edge, cards subtly stack. Light mode: bright top edge + soft
      // ambient. Dark mode: faint top edge + denser base.
      '--k-shadow-tactile': dark
        ? `inset 0 1px 0 hsl(0 0% 100% / 0.06), 0 1px 2px hsl(0 0% 0% / 0.45)`
        : `inset 0 1px 0 hsl(0 0% 100% / 0.85), 0 1px 2px hsl(${shTone}/.08), 0 0 0 1px hsl(${shTone}/.04)`,
      // --k-shadow-pressed: replaces tactile when an element is :active.
      // The top highlight inverts to an inset shadow — gives the "push"
      // tactile feel without color change.
      '--k-shadow-pressed': dark
        ? `inset 0 1px 2px hsl(0 0% 0% / 0.35)`
        : `inset 0 1px 2px hsl(${shTone}/.12)`,
      // --k-ease-spring: always-available overshoot curve. Independent of
      // the user's Motion preset (which can set Snappy/Smooth/Playful) —
      // signature hover lifts use this so the tactile feel is consistent.
      // (110ms × spring) is the sweet spot: visible but not "bouncy".
      '--k-ease-spring': 'cubic-bezier(.34, 1.56, .64, 1)',
      // MD3 emphasized easings — always available, regardless of the
      // user's Curve choice. Component authors reach for these directly
      // when a primary moment (dialog enter, FAB morph, page transition)
      // needs the snap that the MD3 spec describes. The triplet matches
      // the Material 3 spec: standard / accelerate / decelerate.
      '--k-ease-emphasized': EMPHASIZED.standard,
      '--k-ease-emphasized-accel': EMPHASIZED.accel,
      '--k-ease-emphasized-decel': EMPHASIZED.decel,
      // === Row grammar tokens =================================
      // One vocabulary for every "list-style" interactive row in the kit:
      // menu items, dropdown options, command palette suggestions, sidebar
      // nav items, settings rows, table rows. Three heights map to three
      // information densities (dense list → default → touch/destination).
      // Padding-x, icon-label gap, leading icon size and inner radius are
      // shared across all three heights — only the row height itself
      // changes per density. Removes the drift we audited
      // (29/32/33/35/41px etc).
      //
      // Two-line rows (hover preview, attachment chip with meta) are NOT
      // part of this grammar — they're intrinsically taller.
      '--k-row-h-sm': rem(28), // dense menu rows, table rows, dropdown options
      '--k-row-h-md': rem(32), // default (search-result lists, command palette)
      '--k-row-h-lg': rem(40), // sidebar nav, settings list, touch-friendly
      '--k-row-px': rem(10),
      '--k-row-gap': rem(10),
      '--k-row-icon': rem(14),
      // Row inner-radius — keyed off radius-md so soft/round presets
      // cascade through, but capped at 0.5rem so we never get pill-shaped
      // rows that look weird in a list.
      '--k-row-radius': `min(0.5rem, var(--k-radius-md))`,
      // === Stroke tokens — named line-weight scale ============
      // Five values, each tied to an intent. Recipes use the semantic
      // name (--k-stroke-2) instead of a hardcoded "2px" so the scale
      // can be tuned globally and AI tools have a vocabulary to reason
      // about ("the focus ring is stroke-2 thick, same as the active
      // tab underline — that's why they read as 'siblings'").
      //
      //   hairline → 1px tinted (color-mix), for soft dividers
      //   1        → 1px solid, for borders and form input outlines
      //   2        → 2px solid, for focus rings + active tab underline
      //   3        → 3px solid, for slider track + decorative emphasis
      //   progress → 6px solid, for progress bar fill + heavy indicators
      '--k-stroke-1': '1px',
      '--k-stroke-2': '2px',
      '--k-stroke-3': '3px',
      '--k-stroke-progress': '6px',
      // === Stature-driven default sizes ====================
      // These tokens are what makes "pick Compact" cascade across the whole
      // kit. Each component reads its DEFAULT (un-modified) size from one of
      // these. .btn-sm / .btn-lg explicit modifiers still work — they just
      // become deltas off the stature default rather than absolute sizes.
      '--k-btn-h-default': rem(st.btnH),
      '--k-in-h-default': rem(st.inH),
      // Paired control-height scale — the ONE vocabulary that button, input and
      // select share so "two adjacent controls of the same size always line up"
      // is a token invariant, not a per-screen hope. `md` IS the stature
      // default (so plain .btn / .in / .select already match); `sm`/`lg` are
      // deltas off it. This is distinct from the row-grammar (--k-row-h-*,
      // which sizes LIST rows, not form controls) — mixing the two is exactly
      // what made the Board toolbar misalign. The .toolbar recipe forces its
      // children onto one of these so the bug class can't recur.
      '--k-control-h-md': `var(--k-in-h-default)`,
      '--k-control-h-sm': `calc(var(--k-in-h-default) - 0.25rem)`,
      '--k-control-h-lg': `calc(var(--k-in-h-default) + 0.5rem)`,
      // WCAG 2.5.5 / 2.5.8 touch-target floor (44px). Fixed px — it must NOT
      // shrink with Scale (a Compact kit still needs tappable controls). The
      // global layer applies it only under `@media (pointer: coarse)`, so dense
      // desktop layouts are untouched; touch devices floor small controls to it.
      '--k-touch-target': '44px',
      '--k-cal-cell': rem(st.calCell),
      '--k-toggle-w-default': rem(st.toggleW),
      '--k-toggle-h-default': rem(st.toggleH),
      // Slider/range thumb = the TOGGLE KNOB size (toggleH − 6px) so the two
      // controls' circles match across every Scale tier. Derived → never drifts.
      '--k-slider-knob': `calc(var(--k-toggle-h-default) - 6px)`,
      // Scale-aware circular / icon-chip / dot sizes — keyed off the control
      // height (--k-in-h-default = 32/36/40 across the 3 Scale tiers) so avatars,
      // icon boxes and status dots GROW with the Scale macro. Previously these
      // were pinned px (avatar 28, icon-chip 38, dot 7/8) and stayed fixed while
      // every control around them resized — the one axis Scale didn't reach.
      '--k-avatar': `calc(var(--k-in-h-default) - 0.5rem)`, // 24 / 28 / 32
      '--k-icon-chip': `calc(var(--k-in-h-default) + 0.125rem)`, // 34 / 38 / 42
      '--k-dot': `calc(var(--k-in-h-default) / 4.5)`, // ~7 / 8 / 9
      // --k-row-h-default points to whichever row tier the stature elects
      // as default. .navrow / .in / .btn etc all reference this when no
      // explicit size modifier is set.
      '--k-row-h-default': `var(--k-row-h-${st.rowDefault})`,
      // Button finish — fixed "clean" signature: ambient soft shadow + a 1px
      // spring lift on hover, no top-highlight or pressed-inset. The
      // Operator/ChatGPT/Shopify look. (Finish is no longer user-configurable.)
      '--k-btn-shadow': dark ? `0 1px 2px hsl(0 0% 0% / 0.35)` : `0 1px 2px hsl(${shTone}/.06)`,
      '--k-btn-shadow-press': 'none',
      '--k-btn-lift': '-1px',
      // Motion durations — Material 3-inspired 3-tier scale.
      // Use --k-dur-fast for microinteractions (hover, toggle, tooltip),
      // --k-dur for standard transitions (popover, menu, tabs),
      // --k-dur-slow for large surfaces (dialog, sheet, page transition).
      '--k-dur-fast': motion.fast,
      '--k-dur': motion.normal,
      '--k-dur-slow': motion.slow,
      // Easings — split by motion direction (Material 3 pattern):
      //   --k-ease     emphasized standard, default for state changes
      //   --k-ease-out emphasized decelerate, for INCOMING elements (enters)
      //   --k-ease-in  emphasized accelerate, for OUTGOING elements (exits)
      '--k-ease': motion.ease,
      '--k-ease-out': motion.easeOut,
      '--k-ease-in': motion.easeIn,
      '--k-state-hover': stateHover,
      '--k-font-display': fontFamily(cfg.fontDisplay, displayIsSerif),
      '--k-font-body': fontFamily(cfg.fontBody, false),
      '--k-font-mono': `'${UI_MONO}',ui-monospace,monospace`,
      '--k-type-h1': rem(tsH1),
      '--k-type-h2': rem(tsH2),
      '--k-type-h3': rem(tsH3),
      '--k-type-body': rem(tsBody),
      // (The former --k-type-read reading tier was removed: paragraphs, chat
      // and reviews now share --k-type-body for one consistent content size —
      // no special reading size, no per-component drift.)
      '--k-type-small': rem(tsSmall),
      // Caption — the micro tier BELOW small, for the smallest meta/label text
      // (badge labels, table-cell sub-meta, tiny captions). Stepped two under
      // small and floored at 9.5 so it stays legible: ~9.5 / 10 / 10.5 / 11
      // across S / M / L / XL. Gives those a tier that SCALES with text-size
      // instead of a hardcoded 9–10px that ignored the control.
      '--k-type-caption': rem(Math.max(9.5, tsSmall - 2)),
      '--k-type-eyebrow': rem(tsEyebrow),
      // Eyebrow tracking — ONE token for every uppercase micro-label (table
      // heads, nav-group, menu/cmdp section, stat-tile eyebrow, kanban-tag,
      // donut-cap, divider-or, pricing-name…). Was hand-set 0.04–0.08em across
      // ~15 sites with no token; unified to a single airy-caps value so caps
      // tracking reads consistently and is tunable in one place.
      '--k-track-eyebrow': '0.06em',
      '--k-ui-weight': uiW,
      // Named font-weight scale — the three UI weights as semantic tokens so
      // headings/titles reference a role, not a magic number. medium=labels,
      // semibold=titles/headings (the house default), bold=hero/auth display.
      '--k-weight-medium': String(UI_WEIGHTS.medium),
      '--k-weight-semibold': String(UI_WEIGHTS.semibold),
      '--k-weight-bold': String(UI_WEIGHTS.bold),
      // === State tokens — closes the shadcn-gap for cautious devs.
      // Disabled buttons/inputs: muted bg + faint fg + opacity convention.
      // Focus ring: 2px solid offset by 2px (shadcn/Radix convention). */
      '--k-disabled-bg': sysVars['--k-info-soft'] ? surf.s2 : surf.s2,
      '--k-disabled-fg': fg.faint,
      '--k-disabled-opacity': '0.55',
      '--k-focus-ring-offset': '2px',
      '--k-focus-ring-width': '2px',
      // Form validation borders — derived from system colors so they
      // adapt with mode/contrast. Use with `border: var(--k-bw) solid var(--k-input-error-border)`.
      '--k-input-error-border': sysList[2]!.hex, // danger
      '--k-input-success-border': sysList[0]!.hex, // success
      '--k-input-warning-border': sysList[1]!.hex, // warning
      // Named animation shorthands — pair the right easing with each direction.
      // Enters use ease-out (decelerate), exits use ease-in (accelerate).
      // Keyframes (k-fade-in, k-scale-in, …) are shipped in the CSS exports.
      '--k-anim-fade-in':   `k-fade-in ${motion.fast} ${motion.easeOut} both`,
      '--k-anim-fade-out':  `k-fade-out ${motion.fast} ${motion.easeIn} both`,
      '--k-anim-slide-up':  `k-slide-up ${motion.normal} ${motion.easeOut} both`,
      '--k-anim-slide-down': `k-slide-down ${motion.normal} ${motion.easeOut} both`,
      // Scale-in is the shadcn/Radix popover/menu enter — small zoom anchored
      // to the trigger. Origin is set per-component via transform-origin.
      '--k-anim-scale-in':  `k-scale-in ${motion.normal} ${motion.easeOut} both`,
      '--k-anim-scale-out': `k-scale-out ${motion.fast} ${motion.easeIn} both`,
      // MD3 "roll-down" menu signature — panel reveals from the top edge, items
      // roll out staggered underneath. Always-on for menus (not user-selectable).
      // Uses the emphasized-decel curve for the Material 3 feel.
      '--k-anim-menu':      `k-menu-roll ${motion.normal} ${EMPHASIZED.decel} both`,
      '--k-anim-menu-item': `k-menu-item ${motion.normal} ${EMPHASIZED.decel} both`,
      // Per-item stagger step — scales with Motion+Tempo, '0ms' when Motion=None
      // so the whole cascade collapses to an instant reveal.
      '--k-menu-stagger':   cfg.motion === 'none' ? '0ms' : `${Math.round((base.normal * mul) / 10)}ms`,
      '--k-anim-spin': `k-spin 800ms linear infinite`,
      // === System additions (#127) — premium 2026 motion + surface tokens
      // --k-anim-pulse: gentle scale + opacity, infinite. Use for "live" dots
      // (notification, recording, online status).
      '--k-anim-pulse': `k-pulse 1.8s cubic-bezier(.4, 0, .2, 1) infinite`,
      // --k-anim-shimmer: shifting gradient for skeletons. Pairs with a wide
      // linear-gradient background to read as a "shine" sweeping across.
      '--k-anim-shimmer': `k-shimmer 1.6s linear infinite`,
      // MD3 fade-through — cross-fade for content swaps (tab body change,
      // route transition). Outgoing decelerates, incoming accelerates,
      // both meet at peak opacity for a brief overlap. Pairs with the
      // .k-fade-through keyframe in preview.css / componentRecipes.
      '--k-anim-fade-through': `k-fade-through ${motion.normal} ${EMPHASIZED.standard} both`,
      // --k-glass-bg: layered semi-transparent surface — sits over content
      // with backdrop-filter. Light mode: white at 72% with white sheen on
      // top; dark mode: surface-2 at 70% with a faint white edge.
      '--k-glass-bg': dark
        ? `hsl(${t.h} ${t.s}% ${(7.5 + 5.4 * spread).toFixed(1)}% / 0.72)`
        : `hsl(0 0% 100% / 0.72)`,
      // --k-glass-blur: standard backdrop-filter value. Use as:
      //   backdrop-filter: var(--k-glass-blur); background: var(--k-glass-bg);
      '--k-glass-blur': `saturate(180%) blur(12px)`,
      // --k-glass-edge: 1px inner highlight that makes the glass surface
      // catch light. Applied as box-shadow inset.
      '--k-glass-edge': dark
        ? `inset 0 1px 0 hsl(0 0% 100% / 0.08)`
        : `inset 0 1px 0 hsl(0 0% 100% / 0.6)`,
    },
    cc: {
      primaryOnBg: contrast(primaryHex, dark ? '#131316' : '#ffffff'),
      inkOnPrimary: contrast(primaryHex, primaryFg),
    },
  }
}

export function applyPreset(base: Config, patch: Partial<Config>): Config {
  return { ...base, ...patch }
}
