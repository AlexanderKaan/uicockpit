import { Fragment, useEffect, useState, type Dispatch, type ReactNode } from 'react'
import { Check, ChevronRight, Lock, PanelLeftClose, RotateCcw, Shuffle } from 'lucide-react'
import { wouldZeroSeparation } from '../tokens/coherence'
import { STYLE_KITS, activeKitId } from '../tokens/styleKits'
import { DEFAULT_CONFIG } from '../tokens/defaults'
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
  /** Roll a fresh guardrail-aware kit (the "Shuffle" footer button). */
  onRandomize: () => void
  /** Restore every knob to the curated default kit (the "Reset" footer button). */
  onReset: () => void
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
  // 'Auto' tints the grey ramp toward the brand hue; it sits first as the default,
  // so the bare word reads clearly beside Cool/Neutral/Warm in the segmented strip.
  { id: 'auto' as const, cap: 'Auto' },
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
// Elevation (internal key: surfaceDepth) — the SHADOW ladder: how far cards/
// surfaces lift off the canvas. Decoupled from ramp contrast (June 2026), so
// it's purely shadow now. Flat = Linear/Vercel (no shadow); Soft = shadcn/Stripe
// (default); Deep = Notion. Outcome-named caps so the look is predictable.
const SURFACE_DEPTH_OPTS = [
  { id: 'flat' as const, cap: 'Flat' },
  { id: 'soft' as const, cap: 'Soft' },
  { id: 'deep' as const, cap: 'Deep' },
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
// Canvas — the page background (--k-bg), exported + usable behind key blocks.
// White (flat) · Neutral (the muted near-white default) · Brand (a whisper tint)
// · Gradient (the brand mesh). Outcome-named so the look is predictable.
const CANVAS_OPTS = [
  { id: 'white' as const, cap: 'White' },
  { id: 'neutral' as const, cap: 'Neutral' },
  { id: 'brand' as const, cap: 'Brand' },
  { id: 'gradient' as const, cap: 'Gradient' },
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
// Label case — the UI-chrome label tier (buttons, labels, badges, tabs, nav).
// Default keeps them as authored; Caps = uppercase + tracking (the industrial look).
const LABEL_CASE_OPTS = [
  { id: 'sentence' as const, cap: 'Default' },
  { id: 'caps' as const, cap: 'Caps' },
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
function cap<T extends string>(opts: ReadonlyArray<{ id: T; cap: string }>, id: T): string {
  return opts.find((o) => o.id === id)?.cap ?? String(id)
}
function fontLabel(f: string): string {
  return isCustomFont(f) ? customFontFamily(f) : f
}

type Opt = { id: string; label: string; viz?: ReactNode; sub?: ReactNode }
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
  /** 'seg'/'slider' render INLINE (no flyout) — the configurator-pass default.
   *  'opts'/'font' keep the flyout (lists, dot-grids, dial-bearing knobs). */
  kind: 'opts' | 'font' | 'seg' | 'slider'
  opts?: Opt[]
  selected?: string
  grid?: boolean
  /** Inline seg rows whose options are too wide for one line — render the label
   *  above a full-width strip (Neutrals · Surface · Press). */
  stack?: boolean
  onPick?: (id: string) => void
  /** Foundation-coherence lock (surface-separation guard): option-ids that would
   *  dissolve the block, shown with a padlock instead of silently floored. */
  locked?: Set<string>
  lockTitle?: string
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
const ESSENTIAL_KEYS = new Set(['style', 'colorTheme', 'scale', 'fontDisplay', 'radius'])

export function Panel({ cfg, tokens, dispatch, onCollapse, onRandomize, onReset }: PanelProps) {
  // Already on the curated default? → dim the Reset button (nothing to undo to).
  const atDefault = (Object.keys(DEFAULT_CONFIG) as (keyof Config)[]).every((k) => cfg[k] === DEFAULT_CONFIG[k])
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

  // Surface-separation guard, made VISIBLE (FOUNDATION-COHERENCE.md, clash-pair #2).
  // A block must stand out from the page by ≥1 channel — shadow (Elevation), fill
  // (Surface), or a real border. The engine floors the edge if all three go off; HERE
  // we surface that honestly: when two channels are already off, the option of the
  // third knob that would dissolve the block LOCKS (padlock + disabled) instead of
  // silently correcting. Same rule as the engine (coherence.ts) → they agree.
  const sepLockTitle =
    'Locked to keep blocks visible — a card needs at least one way to stand out from the page (a shadow, a fill, or a border). Turn one of the other two back on to free this up.'
  const sepLocked = {
    surfaceDepth: new Set(SURFACE_DEPTH_OPTS.filter((o) => wouldZeroSeparation(cfg, { surfaceDepth: o.id })).map((o) => o.id)),
    surface: new Set(SURFACE_OPTS.filter((o) => wouldZeroSeparation(cfg, { surface: o.id })).map((o) => o.id)),
    borders: new Set(BORDER_OPTS.filter((o) => wouldZeroSeparation(cfg, { borders: o.id })).map((o) => o.id)),
  }

  // Which named kit (if any) the current config matches — the front-door anchor.
  const activeKit = activeKitId(cfg)

  const rows: RowDef[] = [
    {
      // Style — the FRONT-DOOR anchor (top of FOUNDATION, above Brand). Pick a curated
      // named kit; it sets structure + type + colour-character but preserves the brand
      // hue, then the knobs below perturb on top. 'Custom' once a knob diverges.
      key: 'style',
      label: 'Style',
      value: STYLE_KITS.find((k) => k.id === activeKit)?.name ?? 'Custom',
      kind: 'opts',
      opts: STYLE_KITS.map((k) => ({ id: k.id, label: k.name, sub: k.blurb })),
      selected: activeKit ?? undefined,
      onPick: (id) => {
        const kit = STYLE_KITS.find((k) => k.id === id)
        if (kit) dispatch({ type: 'SET', patch: kit.config })
        close()
      },
    },
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
      kind: 'slider',
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
      kind: 'seg',
      stack: true,
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
              max={150}
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
      kind: 'seg',
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
      kind: 'seg',
      opts: optsFrom(TYPESCALE_OPTS),
      selected: cfg.typeScale,
      onPick: pick('typeScale'),
    },
    {
      key: 'labelCase',
      label: 'Label case',
      value: cap(LABEL_CASE_OPTS, cfg.labelCase),
      kind: 'seg',
      opts: optsFrom(LABEL_CASE_OPTS),
      selected: cfg.labelCase,
      onPick: pick('labelCase'),
    },
    {
      sec: 'Shape',
      key: 'radius',
      label: 'Box radius',
      value: cap(RADIUS_OPTS, cfg.radius),
      kind: 'slider',
      opts: optsFrom(RADIUS_OPTS, VIZ_RADIUS),
      selected: cfg.radius,
      onPick: pick('radius'),
    },
    {
      key: 'buttonShape',
      label: 'Button radius',
      value: cap(BUTTON_SHAPE_OPTS, cfg.buttonShape),
      kind: 'slider',
      opts: optsFrom(BUTTON_SHAPE_OPTS, VIZ_BUTTON_SHAPE),
      selected: cfg.buttonShape,
      onPick: pick('buttonShape'),
    },
    {
      sec: 'Surface',
      key: 'surfaceDepth',
      label: 'Elevation',
      value: cap(SURFACE_DEPTH_OPTS, cfg.surfaceDepth),
      kind: 'slider',
      opts: optsFrom(SURFACE_DEPTH_OPTS),
      selected: cfg.surfaceDepth,
      onPick: pick('surfaceDepth'),
      locked: sepLocked.surfaceDepth,
      lockTitle: sepLockTitle,
    },
    {
      // Surface — how contained surfaces separate from their background. ONE axis
      // for fields + menus + the sidebar seam: Outlined (box border) · Filled
      // (tonal fill, no border) · Plain (underline / seamless). Border tunes the
      // line strength; Elevation the lift — both stay separate.
      key: 'surface',
      label: 'Surface',
      value: cap(SURFACE_OPTS, cfg.surface),
      kind: 'seg',
      stack: true,
      opts: optsFrom(SURFACE_OPTS),
      selected: cfg.surface,
      onPick: pick('surface'),
      locked: sepLocked.surface,
      lockTitle: sepLockTitle,
    },
    {
      // Canvas — the page background (--k-bg). White · Neutral (default muted
      // near-white) · Brand (whisper tint) · Gradient (brand mesh). Exported, and
      // applied tactically behind key blocks (e.g. the KPI strip).
      key: 'canvas',
      label: 'Background',
      value: cap(CANVAS_OPTS, cfg.canvas),
      kind: 'seg',
      stack: true,
      opts: optsFrom(CANVAS_OPTS),
      selected: cfg.canvas,
      onPick: pick('canvas'),
    },
    {
      // Fill — the tactical tint for the summary band (KPI strip / hero / amount).
      // Same palette as Background; White = no wash. Applied to the focal block
      // only (background: var(--k-fill)); working surfaces stay white.
      key: 'fill',
      label: 'Block fill',
      value: cap(CANVAS_OPTS, cfg.fill),
      kind: 'seg',
      stack: true,
      opts: optsFrom(CANVAS_OPTS),
      selected: cfg.fill,
      onPick: pick('fill'),
    },
    {
      key: 'borders',
      label: 'Border',
      value: cap(BORDER_OPTS, cfg.borders),
      kind: 'slider',
      opts: optsFrom(BORDER_OPTS),
      selected: cfg.borders,
      onPick: pick('borders'),
      locked: sepLocked.borders,
      lockTitle: sepLockTitle,
    },
    {
      // Interaction state wash (H2) is now a fixed house formula (whisper alpha
      // on a neutral source that follows the Neutrals ramp) — the former States
      // + State-tint dials were removed, so this section folds away. Springs
      // moved under Motion & icons.
      sec: 'Motion & icons',
      key: 'motion',
      label: 'Motion',
      value: cap(MOTION_OPTS, cfg.motion),
      kind: 'slider',
      opts: optsFrom(MOTION_OPTS, VIZ_MOTION),
      selected: cfg.motion,
      onPick: pick('motion'),
    },
    {
      key: 'iconSet',
      label: 'Icons',
      value: cap(ICON_OPTS, cfg.iconSet),
      kind: 'seg',
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
          {rows.map((r) => {
            // 'seg'/'slider' render the control INLINE in the row (no flyout) —
            // the configurator-pass "everything visible" surface. 'opts'/'font'
            // keep the click-to-open flyout (dot-grids, font lists, dial knobs).
            const inline = r.kind === 'seg' || r.kind === 'slider'
            return (
            <Fragment key={r.key}>
              {r.sec && (
                FND_LINK[r.sec]
                  ? <button type="button" className="fmsec fmsec--link" onClick={() => jumpToFoundation(r.sec!)} title={`Jump to ${r.sec} in Foundations`}>{r.sec}</button>
                  : <div className="fmsec">{r.sec}</div>
              )}
              <div className={`fmrow ${inline ? 'fmrow--inline' : ''} ${openKey === r.key ? 'fmrow--open' : ''} ${ESSENTIAL_KEYS.has(r.key) ? 'fmrow--key' : ''}`}>
                {inline ? (
                  <div className={`fmrow__inline ${r.stack ? 'fmrow__inline--stack' : ''}`}>
                    <span className="fmrow__label">{r.label}</span>
                    {r.kind === 'slider' ? (
                      <Slider opts={r.opts ?? []} selected={r.selected} onPick={r.onPick ?? (() => {})} ariaLabel={r.label} locked={r.locked} lockTitle={r.lockTitle} />
                    ) : (
                      <Segmented opts={r.opts ?? []} selected={r.selected} onPick={r.onPick ?? (() => {})} ariaLabel={r.label} locked={r.locked} lockTitle={r.lockTitle} />
                    )}
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </Fragment>
            )
          })}
        </div>
      </div>
      {/* Footer actions — Shuffle (roll a fresh guardrail-aware kit) + Reset (back
          to the curated default). Live here with the controls they act on, not in
          the top bar. ⌘K mirrors both; both flow through history so ⌘Z undoes them. */}
      <div className="panel__foot">
        <button type="button" className="panel__shuffle" onClick={onRandomize} title="Shuffle — roll a fresh random kit">
          <Shuffle size={15} strokeWidth={1.75} />
          <span>Shuffle</span>
        </button>
        <button
          type="button"
          className="panel__reset"
          onClick={onReset}
          disabled={atDefault}
          title={atDefault ? 'Already on the default kit' : 'Reset every knob to the default kit'}
        >
          <RotateCcw size={15} strokeWidth={1.75} />
          <span>Reset</span>
        </button>
      </div>
    </aside>
  )
}

/** Inline SEGMENTED control — a strip of equal pills, the active one lifted.
 *  Replaces a flyout for nominal settings (≤4 short options, or icon glyphs):
 *  the choice is always visible, one click to change — the shadcn "all-open"
 *  feel the configurator-pass is after. */
function Segmented({
  opts,
  selected,
  onPick,
  ariaLabel,
  locked,
  lockTitle,
}: {
  opts: Opt[]
  selected?: string
  onPick: (id: string) => void
  ariaLabel: string
  locked?: Set<string>
  lockTitle?: string
}) {
  return (
    <div className="fmseg" role="radiogroup" aria-label={ariaLabel}>
      {opts.map((o) => {
        const lk = locked?.has(o.id) ?? false
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === selected}
            disabled={lk}
            className={`fmseg__opt ${o.id === selected ? 'fmseg__opt--on' : ''} ${o.viz ? 'fmseg__opt--viz' : ''} ${lk ? 'fmseg__opt--locked' : ''}`}
            onClick={() => { if (!lk) onPick(o.id) }}
            title={lk ? lockTitle : o.label}
          >
            {lk && <Lock size={10} strokeWidth={2.25} className="fmseg__lock" aria-hidden />}
            {o.viz ? <span className="fmseg__viz">{o.viz}</span> : o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Inline discrete SLIDER — an ordered axis (Scale, Box radius, Elevation…)
 *  as a track the user drags between named steps, with the current step read
 *  out at the right. The options array IS the scale, in order; the slider maps
 *  index↔option so the named steps and the export stay identical. */
function Slider({
  opts,
  selected,
  onPick,
  ariaLabel,
  locked,
  lockTitle,
}: {
  opts: Opt[]
  selected?: string
  onPick: (id: string) => void
  ariaLabel: string
  locked?: Set<string>
  lockTitle?: string
}) {
  // Locked options sit at the LOW end of these axes (flat / faint = the dissolving
  // value), so the lock raises the slider's MIN — you can't drag past the floor.
  const minIdx = locked && locked.size ? Math.max(0, opts.findIndex((o) => !locked.has(o.id))) : 0
  const rawIdx = Math.max(0, opts.findIndex((o) => o.id === selected))
  const idx = Math.max(minIdx, rawIdx)
  const cur = opts[idx]
  const isLocked = minIdx > 0
  return (
    <div className={`fmsld ${isLocked ? 'fmsld--locked' : ''}`} title={isLocked ? lockTitle : undefined}>
      {isLocked && <Lock size={11} strokeWidth={2.25} className="fmsld__lock" aria-hidden />}
      <input
        type="range"
        min={minIdx}
        max={Math.max(0, opts.length - 1)}
        step={1}
        value={idx}
        onChange={(e) => { const o = opts[+e.target.value]; if (o) onPick(o.id) }}
        aria-label={ariaLabel}
        aria-valuetext={cur?.label}
      />
      <span className="fmsld__val">{cur?.label}</span>
    </div>
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
          {o.sub ? (
            <span className="fmopt__text">
              <span className="fmopt__label">{o.label}</span>
              <span className="fmopt__sub">{o.sub}</span>
            </span>
          ) : (
            <span className="fmopt__label">{o.label}</span>
          )}
          {o.id === selected && <Check size={14} strokeWidth={2.5} className="fmopt__check" />}
        </button>
      ))}
    </div>
  )
}
