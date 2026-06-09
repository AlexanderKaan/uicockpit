import { Fragment, useEffect, useState, type Dispatch, type ReactNode } from 'react'
import { Check, ChevronRight, PanelLeftClose } from 'lucide-react'
import { BODY_FONTS, DISPLAY_GROUPS, customFontFamily, isCustomFont, type FontGroup } from '../tokens/fonts'
import { nameColor } from '../tokens/color'
import { COLOR_THEMES } from '../tokens/stylesAndThemes'
import type { ColorTheme, Config, Tokens } from '../tokens/types'
import type { ConfigAction } from '../state/configReducer'
import { FontPicker } from './FontPicker'
import {
  VIZ_BUTTON_SHAPE,
  VIZ_COLOR_THEME,
  VIZ_ICONS,
  VIZ_MOTION,
  VIZ_RADIUS,
} from './vizFactories'

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
              {r.sec && <div className="fmsec">{r.sec}</div>}
              <div className={`fmrow ${openKey === r.key ? 'fmrow--open' : ''}`}>
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
