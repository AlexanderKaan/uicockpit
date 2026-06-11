import { Fragment, useEffect, useState, type Dispatch, type ReactNode } from 'react'
import { Check, ChevronRight, PanelLeftClose } from 'lucide-react'
import { BODY_FONTS, DISPLAY_GROUPS, customFontFamily, isCustomFont, type FontGroup } from '../tokens/fonts'
import { nameColor } from '../tokens/color'
import { COLOR_THEMES } from '../tokens/stylesAndThemes'
import { HARMONY_PRESETS, applyHarmonyPreset } from '../tokens/harmony'
import type { ColorTheme, Config, Harmony, Tokens } from '../tokens/types'
import type { ConfigAction } from '../state/configReducer'
import { FontPicker } from './FontPicker'
import {
  VIZ_BUTTON_SHAPE,
  VIZ_COLOR_THEME,
  VIZ_ICONS,
  VIZ_MOTION,
  VIZ_RADIUS,
} from './vizFactories'

/* Panel↔Foundations twin: a panel section header maps to its resolved-scale section
 * in the Foundations stage view. Clicking it scrolls that section into view + flashes
 * it — the "author the foundation, see it resolved" loop. A graceful no-op on any
 * other view (the target element only exists when Foundations is active). */
const FND_LINK: Record<string, string> = {
  Color: 'color', Typography: 'typography', Shape: 'shape',
  Surface: 'surface', 'Motion & icons': 'motion-icons',
}
function jumpToFoundation(sec: string) {
  const slug = FND_LINK[sec]
  if (!slug) return
  const el = document.getElementById(`fnd-${slug}`)
  if (!el) return // not on the Foundations view
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el.classList.add('fnd__card--flash')
  window.setTimeout(() => el.classList.remove('fnd__card--flash'), 1000)
}

interface PanelProps {
  cfg: Config
  tokens: Tokens
  dispatch: Dispatch<ConfigAction>
  /** Collapse the floating menu — drops back to the full-width preview. */
  onCollapse: () => void
}

/* Option arrays — the single source for each control's choices + captions. */
/* Ordered as an Apple-style colour FAN: Mono (neutral, set apart by a divider in
 * the UI), then the 9 chromatic themes in spectrum order — red → orange → green →
 * teal → sky → blue → indigo → violet → pink. Yellow is intentionally absent (it
 * can't be a legible primary; it lives in the decorative palette instead). Each
 * is the most-loved, always-works version of its segment. */
const COLOR_THEME_OPTS = [
  { id: 'mono'   as ColorTheme, cap: 'Mono',   viz: VIZ_COLOR_THEME.mono },
  { id: 'rose'   as ColorTheme, cap: 'Rose',   viz: VIZ_COLOR_THEME.rose },
  { id: 'ember'  as ColorTheme, cap: 'Ember',  viz: VIZ_COLOR_THEME.ember },
  { id: 'jade'   as ColorTheme, cap: 'Jade',   viz: VIZ_COLOR_THEME.jade },
  { id: 'teal'   as ColorTheme, cap: 'Teal',   viz: VIZ_COLOR_THEME.teal },
  { id: 'sky'    as ColorTheme, cap: 'Sky',    viz: VIZ_COLOR_THEME.sky },
  { id: 'cobalt' as ColorTheme, cap: 'Cobalt', viz: VIZ_COLOR_THEME.cobalt },
  { id: 'indigo' as ColorTheme, cap: 'Indigo', viz: VIZ_COLOR_THEME.indigo },
  { id: 'violet' as ColorTheme, cap: 'Violet', viz: VIZ_COLOR_THEME.violet },
  { id: 'coral'  as ColorTheme, cap: 'Coral',  viz: VIZ_COLOR_THEME.coral },
]
const RADIUS_OPTS = [
  { id: 'none' as const, cap: 'None' },
  { id: 'subtle' as const, cap: 'Subtle' },
  { id: 'soft' as const, cap: 'Soft' },
  { id: 'round' as const, cap: 'Round' },
]
const BUTTON_SHAPE_OPTS = [
  { id: 'match' as const, cap: 'Match' },
  { id: 'none' as const, cap: 'None' },
  { id: 'subtle' as const, cap: 'Subtle' },
  { id: 'soft' as const, cap: 'Soft' },
  { id: 'round' as const, cap: 'Round' },
  { id: 'pill' as const, cap: 'Pill' },
]
const NEUTRAL_OPTS = [
  // 'Auto (brand)' spells out what Auto derives from — it tints the grey ramp
  // toward the brand hue. Without the qualifier "Auto" reads as a mystery default.
  { id: 'auto' as const, cap: 'Auto (brand)' },
  { id: 'cool' as const, cap: 'Cool' },
  { id: 'neutral' as const, cap: 'Neutral' },
  { id: 'warm' as const, cap: 'Warm' },
]
const MOTION_OPTS = [
  { id: 'none' as const, cap: 'None' },
  { id: 'snappy' as const, cap: 'Snappy' },
  { id: 'smooth' as const, cap: 'Smooth' },
  { id: 'playful' as const, cap: 'Playful' },
]
// Scale — interface size + density (one tighter, default, one roomier).
const SCALE_OPTS = [
  { id: 'compact' as const, cap: 'Compact' },
  { id: 'default' as const, cap: 'Default' },
  { id: 'comfortable' as const, cap: 'Comfortable' },
]
// Elevation (internal key: surfaceDepth) — how far cards/surfaces lift off the
// canvas (contrast ramp + shadow). Flat = Linear/Vercel hairline; Deep = Notion.
// Outcome-named caps so a user can predict the look before clicking.
const SURFACE_DEPTH_OPTS = [
  { id: 'flat' as const, cap: 'Flat' },
  { id: 'soft' as const, cap: 'Subtle' },
  { id: 'raised' as const, cap: 'Raised' },
  { id: 'layered' as const, cap: 'Deep' },
]
// Surface — the structural separation axis (replaces the over-specific Sidebar).
// One choice that drives every contained surface (fields, menus, sidebar seam):
// Outlined = box-with-border · Filled = tonal fill, no border · Plain = underline.
const SURFACE_OPTS = [
  { id: 'outlined' as const, cap: 'Outlined' },
  { id: 'filled' as const, cap: 'Filled' },
  { id: 'plain' as const, cap: 'Plain' },
]
// Border prominence — its own control (tint of the box edge), 4 steps.
const BORDER_OPTS = [
  { id: 'faint' as const, cap: 'Faint' },
  { id: 'subtle' as const, cap: 'Subtle' },
  { id: 'medium' as const, cap: 'Medium' },
  { id: 'strong' as const, cap: 'Strong' },
]
/* Interaction (H2) — the state-layer algebra + press feedback as dials. */
const STATE_INTENSITY_OPTS = [
  { id: 'whisper' as const, cap: 'Whisper' },
  { id: 'standard' as const, cap: 'Standard' },
  { id: 'vivid' as const, cap: 'Vivid' },
]
const STATE_TINT_OPTS = [
  { id: 'neutral' as const, cap: 'Neutral' },
  { id: 'brand' as const, cap: 'Brand' },
  { id: 'accent' as const, cap: 'Accent' },
]
const PRESS_OPTS = [
  { id: 'none' as const, cap: 'None' },
  { id: 'opacity' as const, cap: 'Fade' },
  { id: 'scale' as const, cap: 'Scale' },
  { id: 'morph' as const, cap: 'Morph' },
]
const MOTION_SCHEME_OPTS = [
  { id: 'standard' as const, cap: 'Standard' },
  { id: 'expressive' as const, cap: 'Expressive' },
]
const ICON_OPTS = [
  { id: 'hairline' as const, cap: 'Iconoir' },
  { id: 'line' as const, cap: 'Lucide' },
  { id: 'rounded' as const, cap: 'Phosphor' },
  { id: 'bold' as const, cap: 'Phosphor Bold' },
  { id: 'solid' as const, cap: 'Heroicons' },
]
const TYPESCALE_OPTS = [
  { id: 'sm' as const, cap: 'S' },
  { id: 'md' as const, cap: 'M' },
  { id: 'lg' as const, cap: 'L' },
  { id: 'xl' as const, cap: 'XL' },
]
const PALETTE_OPTS = [
  { id: 'pastel' as const, cap: 'Pastel' },
  { id: 'bright' as const, cap: 'Bright' },
  { id: 'vivid' as const, cap: 'Vivid' },
]
/* Harmony (H1) — presets of the two dials underneath (Spread °, Expression %).
 * Picking a preset snaps both sliders; moving a slider flips the row to Custom.
 * The primary never rotates — harmony governs the derived family only. */
const HARMONY_OPTS = [
  { id: 'mono' as const, cap: 'Mono' },
  { id: 'tonal' as const, cap: 'Tonal' },
  { id: 'complement' as const, cap: 'Complement' },
  { id: 'expressive' as const, cap: 'Expressive' },
]
/* Shape Lab (H5) — presets of the four signature dials (points/depth/
 * softness/jitter). Same model as Harmony: pick a preset = snap the dials;
 * move a dial = the row reads Custom. The signature shape lives ONLY on the
 * whitelist territory (avatars, media crops, loaders, empty-states, hero
 * decoration) via the .sig recipe — never structural containers. */
const SIG_PRESETS: Record<string, { shapePoints: number; shapeDepth: number; shapeSoft: number; shapeJitter: number }> = {
  petal: { shapePoints: 8, shapeDepth: 0.12, shapeSoft: 0.8, shapeJitter: 0 },
  burst: { shapePoints: 12, shapeDepth: 0.5, shapeSoft: 0.3, shapeJitter: 0 },
  star: { shapePoints: 5, shapeDepth: 0.5, shapeSoft: 0.1, shapeJitter: 0 },
  pebble: { shapePoints: 7, shapeDepth: 0.05, shapeSoft: 1, shapeJitter: 0.45 },
}
const SIGNATURE_OPTS = [
  { id: 'petal' as const, cap: 'Petal' },
  { id: 'burst' as const, cap: 'Burst' },
  { id: 'star' as const, cap: 'Star' },
  { id: 'pebble' as const, cap: 'Pebble' },
]
const sigPresetOf = (cfg: Config): string | null => {
  for (const [id, p] of Object.entries(SIG_PRESETS)) {
    if (
      p.shapePoints === cfg.shapePoints &&
      Math.abs(p.shapeDepth - cfg.shapeDepth) < 0.005 &&
      Math.abs(p.shapeSoft - cfg.shapeSoft) < 0.005 &&
      Math.abs(p.shapeJitter - cfg.shapeJitter) < 0.005
    )
      return id
  }
  return null
}

function cap<T extends string>(opts: ReadonlyArray<{ id: T; cap: string }>, id: T): string {
  return opts.find((o) => o.id === id)?.cap ?? String(id)
}
function fontLabel(f: string): string {
  return isCustomFont(f) ? customFontFamily(f) : f
}

type Opt = { id: string; label: string; viz?: ReactNode }
/** Build a popover option-list from an option array, optionally attaching a
 *  per-option viz (kept only for radius/border-radius/motion/icons/themes —
 *  everything else is text-only; the canvas shows the effect). */
function optsFrom<T extends string>(
  arr: ReadonlyArray<{ id: T; cap: string }>,
  vizMap?: Record<string, ReactNode>,
): Opt[] {
  return arr.map((o) => ({ id: o.id, label: o.cap, viz: vizMap ? vizMap[o.id] : undefined }))
}

interface RowDef {
  sec?: string
  key: string
  label: string
  value?: string
  dot?: ReactNode
  kind: 'opts' | 'font'
  opts?: Opt[]
  selected?: string
  grid?: boolean
  onPick?: (id: string) => void
  fontGroups?: FontGroup[]
  fontValue?: string
  onFont?: (f: string) => void
  /** Extra content appended to the flyout (e.g. the Brand-colour row at the
   *  foot of the Color-theme grid). */
  footer?: ReactNode
}

/* The four controls that decide ~80% of a kit's look (C9). They keep their domain
 * homes in the flat list, but read as PRIMARY (heavier label + a quiet neutral tick)
 * so a first-timer knows where to start — without re-introducing the removed
 * Essentials/Advanced tiering. */
const ESSENTIAL_KEYS = new Set(['colorTheme', 'scale', 'fontDisplay', 'radius'])

export function Panel({ cfg, tokens, dispatch, onCollapse }: PanelProps) {
  const set = <K extends keyof Config>(field: K, value: Config[K]) =>
    dispatch({ type: 'SET', patch: { [field]: value } as Partial<Config> })

  // One open flyout at a time (keyed by control). Click a row → its options
  // float over the canvas; pick → applies + closes.
  const [openKey, setOpenKey] = useState<string | null>(null)
  const close = () => setOpenKey(null)

  // Dismiss the open flyout on outside-click / Escape.
  useEffect(() => {
    if (!openKey) return
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.fmrow')) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openKey])

  const pick = (field: keyof Config) => (id: string) => {
    dispatch({ type: 'SET', patch: { [field]: id } as Partial<Config> })
    close()
  }

  // Has the brand colour diverged from the named theme's hex? Then the theme
  // is the user's OWN — show its colour name (e.g. "Burnt Orange") instead of
  // the stale preset name, and clear the grid checkmark. Pick a preset exactly
  // again and it snaps back.
  const themeHex = COLOR_THEMES[cfg.colorTheme]?.cPrimary
  const themeIsCustom = !!themeHex && cfg.cPrimary.toLowerCase() !== themeHex.toLowerCase()

  const rows: RowDef[] = [
    {
      // Brand — the HERO decision and the highest-leverage knob: one hex feeds
      // the whole OKLCH system (primary + derived secondary/accent + the auto
      // neutral tint + chart palette). Sits FIRST, under DESIGN SYSTEM. The 10
      // theme dots are quick-picks; the brand-hex field is in the flyout footer
      // (same decision — "what carries the UI").
      key: 'colorTheme',
      label: 'Brand',
      // Custom brand colour → name + live dot of YOUR colour; else the preset.
      value: themeIsCustom ? nameColor(tokens.primaryHex) : cap(COLOR_THEME_OPTS, cfg.colorTheme),
      dot: themeIsCustom ? (
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            borderRadius: 999,
            background: tokens.primaryHex,
            boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.12)',
          }}
        />
      ) : (
        COLOR_THEME_OPTS.find((o) => o.id === cfg.colorTheme)?.viz
      ),
      kind: 'opts',
      grid: true,
      opts: COLOR_THEME_OPTS.map((o) => ({ id: o.id, label: o.cap, viz: o.viz })),
      // No grid checkmark when the colour is custom — you're off the presets.
      selected: themeIsCustom ? undefined : cfg.colorTheme,
      onPick: (id) => { dispatch({ type: 'APPLY_COLOR_THEME', id: id as ColorTheme }); close() },
      // Brand colour lives at the foot of the theme flyout (emphasised row) —
      // it's the same decision ("what carries the UI"), no separate menu row.
      footer: (
        <label className="fmbrand">
          <span className="fmbrand__label">Brand color</span>
          <span className="fmbrand__val">
            <span className="fmrow__dot" style={{ background: tokens.primaryHex }} />
            {nameColor(tokens.primaryHex)}
          </span>
          <input
            type="color"
            className="fmrow__colorinput"
            value={cfg.cPrimary}
            onChange={(e) => set('cPrimary', e.target.value)}
            aria-label="Brand color"
          />
        </label>
      ),
    },
    {
      // Scale — the one size + density macro (control sizing, spacing, row/
      // toggle/cell dimensions). Does NOT touch font-weight (a fixed system
      // constant) so it never overlaps the typography controls. The curated
      // DEFAULT_CONFIG is the house style.
      key: 'scale',
      label: 'Scale',
      value: cap(SCALE_OPTS, cfg.scale),
      kind: 'opts',
      opts: optsFrom(SCALE_OPTS),
      selected: cfg.scale,
      onPick: pick('scale'),
    },
    {
      // Neutral tint — 'Auto' (default) tints the greys toward the brand hue;
      // cool/neutral/warm are explicit overrides. Sits right under Brand since
      // Auto literally derives from it.
      sec: 'Color',
      key: 'neutral',
      label: 'Neutrals',
      value: cap(NEUTRAL_OPTS, cfg.neutral),
      kind: 'opts',
      opts: optsFrom(NEUTRAL_OPTS),
      selected: cfg.neutral,
      onPick: pick('neutral'),
    },
    {
      // Harmony (H1) — how the derived family (secondary/accent/decoratives/
      // neutral tint) relates to the brand. 4 presets + the two live dials
      // (Spread/Expression) in the flyout foot; a moved dial = Custom.
      key: 'harmony',
      label: 'Harmony',
      value: cfg.harmony === 'custom' ? `Custom · ${cfg.spread}°` : cap(HARMONY_OPTS, cfg.harmony),
      kind: 'opts',
      opts: optsFrom(HARMONY_OPTS),
      selected: cfg.harmony,
      onPick: (id) => {
        dispatch({ type: 'SET', patch: applyHarmonyPreset(id as Exclude<Harmony, 'custom'>) })
        close()
      },
      footer: (
        <div className="fmharmony">
          <label className="fmslider">
            <span className="fmslider__label">Spread</span>
            <input
              type="range"
              min={0}
              max={180}
              step={5}
              list="harmony-spread-detents"
              value={cfg.spread}
              onChange={(e) => {
                const v = +e.target.value
                dispatch({ type: 'SET', patch: cfg.harmony === 'custom' ? { spread: v } : { harmony: 'custom', spread: v } })
              }}
              aria-label="Hue spread of the derived color family (degrees)"
            />
            <span className="fmslider__val">{cfg.spread}°</span>
          </label>
          {/* Detents at the named anchor points: mono / tonal (+60) / complement */}
          <datalist id="harmony-spread-detents">
            <option value={HARMONY_PRESETS.mono.spread} />
            <option value={HARMONY_PRESETS.tonal.spread} />
            <option value={HARMONY_PRESETS.expressive.spread} />
            <option value={HARMONY_PRESETS.complement.spread} />
          </datalist>
          <label className="fmslider">
            <span className="fmslider__label">Expression</span>
            <input
              type="range"
              min={0}
              max={200}
              step={5}
              value={cfg.expression}
              onChange={(e) => {
                const v = +e.target.value
                dispatch({ type: 'SET', patch: cfg.harmony === 'custom' ? { expression: v } : { harmony: 'custom', expression: v } })
              }}
              aria-label="Chroma expression of the derived color family (percent)"
            />
            <span className="fmslider__val">{cfg.expression}%</span>
          </label>
        </div>
      ),
    },
    {
      key: 'palette',
      label: 'Palette',
      value: cap(PALETTE_OPTS, cfg.palette),
      kind: 'opts',
      opts: optsFrom(PALETTE_OPTS),
      selected: cfg.palette,
      onPick: pick('palette'),
    },
    {
      sec: 'Typography',
      key: 'fontDisplay',
      label: 'Display font',
      value: fontLabel(cfg.fontDisplay),
      kind: 'font',
      fontGroups: DISPLAY_GROUPS,
      fontValue: cfg.fontDisplay,
      onFont: (f) => set('fontDisplay', f),
    },
    {
      key: 'fontBody',
      label: 'Body font',
      value: fontLabel(cfg.fontBody),
      kind: 'font',
      fontGroups: BODY_FONTS,
      fontValue: cfg.fontBody,
      onFont: (f) => set('fontBody', f),
    },
    {
      key: 'typeScale',
      label: 'Text size',
      value: cap(TYPESCALE_OPTS, cfg.typeScale),
      kind: 'opts',
      opts: optsFrom(TYPESCALE_OPTS),
      selected: cfg.typeScale,
      onPick: pick('typeScale'),
    },
    {
      sec: 'Shape',
      key: 'radius',
      label: 'Box radius',
      value: cap(RADIUS_OPTS, cfg.radius),
      kind: 'opts',
      opts: optsFrom(RADIUS_OPTS, VIZ_RADIUS),
      selected: cfg.radius,
      onPick: pick('radius'),
    },
    {
      key: 'buttonShape',
      label: 'Button radius',
      value: cap(BUTTON_SHAPE_OPTS, cfg.buttonShape),
      kind: 'opts',
      opts: optsFrom(BUTTON_SHAPE_OPTS, VIZ_BUTTON_SHAPE),
      selected: cfg.buttonShape,
      onPick: pick('buttonShape'),
    },
    {
      // Shape Lab (H5) — the parametric SIGNATURE shape. Presets + four live
      // dials in the flyout foot; a moved dial = Custom. Shapes avatars/media/
      // empty-states via .sig — structural radii stay on the rows above.
      key: 'signature',
      label: 'Signature',
      value: (() => {
        const p = sigPresetOf(cfg)
        return p ? cap(SIGNATURE_OPTS, p as (typeof SIGNATURE_OPTS)[number]['id']) : `Custom · ${cfg.shapePoints}pt`
      })(),
      kind: 'opts',
      opts: optsFrom(SIGNATURE_OPTS),
      selected: sigPresetOf(cfg) ?? undefined,
      onPick: (id) => {
        const preset = SIG_PRESETS[id]
        if (preset) dispatch({ type: 'SET', patch: preset })
        close()
      },
      footer: (
        <div className="fmharmony">
          <label className="fmslider">
            <span className="fmslider__label">Points</span>
            <input
              type="range"
              min={3}
              max={16}
              step={1}
              value={cfg.shapePoints}
              onChange={(e) => set('shapePoints', +e.target.value)}
              aria-label="Signature shape — number of points"
            />
            <span className="fmslider__val">{cfg.shapePoints}</span>
          </label>
          <label className="fmslider">
            <span className="fmslider__label">Depth</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(cfg.shapeDepth * 100)}
              onChange={(e) => set('shapeDepth', +e.target.value / 100)}
              aria-label="Signature shape — star depth (percent)"
            />
            <span className="fmslider__val">{Math.round(cfg.shapeDepth * 100)}%</span>
          </label>
          <label className="fmslider">
            <span className="fmslider__label">Softness</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(cfg.shapeSoft * 100)}
              onChange={(e) => set('shapeSoft', +e.target.value / 100)}
              aria-label="Signature shape — corner softness (percent)"
            />
            <span className="fmslider__val">{Math.round(cfg.shapeSoft * 100)}%</span>
          </label>
          <label className="fmslider">
            <span className="fmslider__label">Jitter</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(cfg.shapeJitter * 100)}
              onChange={(e) => set('shapeJitter', +e.target.value / 100)}
              aria-label="Signature shape — organic jitter (percent, seeded)"
            />
            <span className="fmslider__val">{Math.round(cfg.shapeJitter * 100)}%</span>
          </label>
        </div>
      ),
    },
    {
      sec: 'Surface',
      key: 'surfaceDepth',
      label: 'Elevation',
      value: cap(SURFACE_DEPTH_OPTS, cfg.surfaceDepth),
      kind: 'opts',
      opts: optsFrom(SURFACE_DEPTH_OPTS),
      selected: cfg.surfaceDepth,
      onPick: pick('surfaceDepth'),
    },
    {
      // Surface — how contained surfaces separate from their background. ONE axis
      // for fields + menus + the sidebar seam: Outlined (box border) · Filled
      // (tonal fill, no border) · Plain (underline / seamless). Border tunes the
      // line strength; Elevation the lift — both stay separate.
      key: 'surface',
      label: 'Surface',
      value: cap(SURFACE_OPTS, cfg.surface),
      kind: 'opts',
      opts: optsFrom(SURFACE_OPTS),
      selected: cfg.surface,
      onPick: pick('surface'),
    },
    {
      key: 'borders',
      label: 'Border',
      value: cap(BORDER_OPTS, cfg.borders),
      kind: 'opts',
      opts: optsFrom(BORDER_OPTS),
      selected: cfg.borders,
      onPick: pick('borders'),
    },
    {
      // Interaction (H2) — hover/selected/press as ONE formula with two dials,
      // plus the press-feedback character. Defaults = the calibrated house look.
      sec: 'Interaction',
      key: 'stateIntensity',
      label: 'States',
      value: cap(STATE_INTENSITY_OPTS, cfg.stateIntensity),
      kind: 'opts',
      opts: optsFrom(STATE_INTENSITY_OPTS),
      selected: cfg.stateIntensity,
      onPick: pick('stateIntensity'),
    },
    {
      key: 'stateTint',
      label: 'State tint',
      value: cap(STATE_TINT_OPTS, cfg.stateTint),
      kind: 'opts',
      opts: optsFrom(STATE_TINT_OPTS),
      selected: cfg.stateTint,
      onPick: pick('stateTint'),
    },
    {
      key: 'press',
      label: 'Press',
      value: cap(PRESS_OPTS, cfg.press),
      kind: 'opts',
      opts: optsFrom(PRESS_OPTS),
      selected: cfg.press,
      onPick: pick('press'),
    },
    {
      sec: 'Motion & icons',
      key: 'motion',
      label: 'Motion',
      value: cap(MOTION_OPTS, cfg.motion),
      kind: 'opts',
      opts: optsFrom(MOTION_OPTS, VIZ_MOTION),
      selected: cfg.motion,
      onPick: pick('motion'),
    },
    {
      // Spring scheme (H2) — pre-sampled M3 spring physics as linear() tokens.
      key: 'motionScheme',
      label: 'Springs',
      value: cap(MOTION_SCHEME_OPTS, cfg.motionScheme),
      kind: 'opts',
      opts: optsFrom(MOTION_SCHEME_OPTS),
      selected: cfg.motionScheme,
      onPick: pick('motionScheme'),
    },
    {
      key: 'iconSet',
      label: 'Icons',
      value: cap(ICON_OPTS, cfg.iconSet),
      kind: 'opts',
      opts: optsFrom(ICON_OPTS, VIZ_ICONS),
      selected: cfg.iconSet,
      onPick: pick('iconSet'),
    },
  ]

  return (
    <aside className="panel">
      <div className="fmenu">
        <div className="fmenu__bar">
          <span className="fmenu__bar-title">Foundation</span>
          <button
            type="button"
            className="fmenu__collapse"
            onClick={onCollapse}
            aria-label="Collapse menu"
            title="Collapse — full-width preview"
          >
            <PanelLeftClose size={15} strokeWidth={1.75} />
          </button>
        </div>
        <div className="fmenu__rows">
          {rows.map((r) => (
            <Fragment key={r.key}>
              {r.sec && (
                FND_LINK[r.sec]
                  ? <button type="button" className="fmsec fmsec--link" onClick={() => jumpToFoundation(r.sec!)} title={`Jump to ${r.sec} in Foundations`}>{r.sec}</button>
                  : <div className="fmsec">{r.sec}</div>
              )}
              <div className={`fmrow ${openKey === r.key ? 'fmrow--open' : ''} ${ESSENTIAL_KEYS.has(r.key) ? 'fmrow--key' : ''}`}>
                <button
                  type="button"
                  className="fmrow__head"
                  onClick={() => setOpenKey((k) => (k === r.key ? null : r.key))}
                  aria-expanded={openKey === r.key}
                >
                  <span className="fmrow__label">{r.label}</span>
                  <span className="fmrow__val" title={r.value}>
                    {r.dot && <span className="fmrow__dot fmrow__dot--viz">{r.dot}</span>}
                    <span className="fmrow__val-text">{r.value}</span>
                  </span>
                  <ChevronRight size={14} strokeWidth={2} className="fmrow__chev" />
                </button>
                {openKey === r.key && (
                  <div className={`fmrow__pop ${r.kind === 'font' ? 'fmrow__pop--font' : ''}`} role="menu">
                    {r.kind === 'opts' ? (
                      <OptionList
                        opts={r.opts ?? []}
                        selected={r.selected}
                        grid={r.grid}
                        onPick={r.onPick ?? (() => {})}
                      />
                    ) : (
                      <FontPicker
                        inline
                        value={r.fontValue ?? ''}
                        groups={r.fontGroups ?? []}
                        onChange={(f) => { r.onFont?.(f); close() }}
                      />
                    )}
                    {r.footer}
                  </div>
                )}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </aside>
  )
}

/** The flyout option list — vertical (or a grid for the 10 colour themes).
 *  Each option: optional viz (radius/motion hint or theme dot) + label +
 *  check on the selected one. */
function OptionList({
  opts,
  selected,
  grid,
  onPick,
}: {
  opts: Opt[]
  selected?: string
  grid?: boolean
  onPick: (id: string) => void
}) {
  return (
    <div className={grid ? 'fmpop__grid' : 'fmpop__list'}>
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`fmopt ${o.id === selected ? 'fmopt--on' : ''}`}
          aria-pressed={o.id === selected}
          onClick={() => onPick(o.id)}
        >
          {o.viz && <span className="fmopt__viz">{o.viz}</span>}
          <span className="fmopt__label">{o.label}</span>
          {o.id === selected && <Check size={14} strokeWidth={2.5} className="fmopt__check" />}
        </button>
      ))}
    </div>
  )
}
