import type { ReactNode } from 'react'
import { Icon } from '../icons/Icon'

/**
 * Fase I-A3 — the per-component specimen + Recipe registry (the v2 "SPECS"
 * idea, scoped to OUR kit classes). Powers Split mode's leaf-level inspect:
 * click a component INSIDE a showcase → it's isolated here with the 3-4 token
 * derivations that build it. Preview-only (like gallery cards) — it never
 * ships; the kit recipes in src/kit/recipes stay the single source.
 */

export interface ComponentSpec {
  label: string
  blurb: string
  /** The token derivations — [what, from] — mirrors the v2 inspector's Recipe. */
  recipe: Array<[string, string]>
  /** A small isolated specimen built from exported kit classes only. */
  specimen: () => ReactNode
}

export const COMPONENTS: Record<string, ComponentSpec> = {
  button: {
    label: 'Button',
    blurb: 'One shape, the brand fill; press squashes on the spring.',
    recipe: [['Height', '--btn-h'], ['Radius', '--btn-r'], ['Padding', 'u × 2.5'], ['Press', 'scale --k-press-scale']],
    specimen: () => (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn--primary">Primary</button>
        <button type="button" className="btn btn--outline">Outline</button>
        <button type="button" className="btn btn--ghost">Ghost</button>
      </div>
    ),
  },
  badge: {
    label: 'Badge',
    blurb: 'Soft-tinted status pill; the dot carries the semantic hue.',
    recipe: [['Tint', 'color-mix 14%'], ['Radius', 'pill'], ['Text', '--k-{tone}-soft-fg'], ['Dot', 'currentColor']],
    specimen: () => (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="badge badge--success">Healthy</span>
        <span className="badge badge--warning">Degraded</span>
        <span className="badge badge--danger">Down</span>
        <span className="badge badge--info">Scale</span>
      </div>
    ),
  },
  switch: {
    label: 'Switch',
    blurb: 'The knob derives from the track; travel rides the motion spring.',
    recipe: [['Track', 'u × 11'], ['Knob', 'calc(track − 4px)'], ['Travel', '--k-spring'], ['On', '--k-primary']],
    specimen: () => (
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span className="toggle toggle--on" role="switch" aria-checked="true"><span className="toggle__knob" /></span>
        <span className="toggle" role="switch" aria-checked="false"><span className="toggle__knob" /></span>
      </div>
    ),
  },
  input: {
    label: 'Text field',
    blurb: 'Border floored to 3:1; a single soft focus halo, inset.',
    recipe: [['Height', '--in-h'], ['Border', '--k-input-border (≥3:1)'], ['Radius', '--in-radius'], ['Focus', 'inset ring']],
    specimen: () => (
      <label className="lab" style={{ maxWidth: 240 }}>
        <span>Billing email</span>
        <input className="in" defaultValue="finance@acme.io" />
      </label>
    ),
  },
  table: {
    label: 'Table',
    blurb: 'Caps-tracked headers, tabular numerals, hover wash on rows.',
    recipe: [['Row pad', 'u × 2.75'], ['Header', 'fs-eyebrow caps'], ['Row', 'border-b + hover'], ['Numerals', 'tabular']],
    specimen: () => (
      <table className="tbl">
        <thead><tr><th>Service</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>ai-router</td><td><span className="badge badge--success">Healthy</span></td></tr>
          <tr><td>edge-cache</td><td><span className="badge badge--warning">Degraded</span></td></tr>
        </tbody>
      </table>
    ),
  },
  card: {
    label: 'Card',
    blurb: 'The surface atom — radius, border and shadow all from tokens.',
    recipe: [['Surface', '--k-surface'], ['Radius', '--k-radius-lg'], ['Border', '--k-border'], ['Shadow', '--k-shadow-1']],
    specimen: () => (
      <div className="card" style={{ maxWidth: 240 }}>
        <div className="card__head"><span className="card__title">Recurring revenue</span></div>
        <div className="stat-tile__value">$48.2k</div>
        <div style={{ marginTop: 6 }}><span className="badge badge--success">+12%</span></div>
      </div>
    ),
  },
  chip: {
    label: 'Chip',
    blurb: 'Filter/assist pill; the active one wears the secondary tone.',
    recipe: [['Height', 'u × 7'], ['Radius', 'pill'], ['On', '--k-secondary-soft'], ['Border', '--k-border']],
    specimen: () => (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="chip chip--on">All</span>
        <span className="chip">Active</span>
        <span className="chip">Churn risk</span>
      </div>
    ),
  },
  avatar: {
    label: 'Avatar',
    blurb: 'Initials on the soft accent tone — identity tracks the brand hue.',
    recipe: [['Size', 'u × 8'], ['Fill', '--k-accent-soft'], ['Type', '600 / track .03em']],
    specimen: () => (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className="avatar">MO</span>
        <span className="avatar avatar--sm">JL</span>
      </div>
    ),
  },
  tabs: {
    label: 'Tabs',
    blurb: 'The indicator scales in from zero on the motion spring.',
    recipe: [['Indicator', '2px --k-primary'], ['Gap', 'u × 6'], ['Active', '--k-fg']],
    specimen: () => (
      <div className="tabs" style={{ display: 'flex', gap: 4 }}>
        <button type="button" className="tab tab--on">All customers</button>
        <button type="button" className="tab">Active</button>
        <button type="button" className="tab">Churn risk</button>
      </div>
    ),
  },
  list: {
    label: 'List',
    blurb: 'Row grammar — lead slot, body, trail; hover wash from the state layer.',
    recipe: [['Row pad', 'u × 2.5'], ['Hover', '--k-state-hover'], ['Lead', 'icon / avatar slot']],
    specimen: () => (
      <div className="card" style={{ maxWidth: 260 }}>
        <div className="list list--flush">
          <button type="button" className="list__item"><span className="list__lead list__lead--icon"><Icon name="check" /></span><span className="list__body"><span className="list__title">Invoice paid</span><span className="list__sub">Acme · $1,400</span></span></button>
          <button type="button" className="list__item"><span className="list__lead list__lead--icon"><Icon name="bell" /></span><span className="list__body"><span className="list__title">Quota at 81%</span></span></button>
        </div>
      </div>
    ),
  },
  stat: {
    label: 'Stat tile',
    blurb: 'KPI atom — muted label, display-scale value, signed delta.',
    recipe: [['Label', 'fs-caption muted'], ['Value', 'fs-h2'], ['Delta', '--k-success / --k-danger']],
    specimen: () => (
      <div className="stat-tile" style={{ maxWidth: 200 }}>
        <div className="stat-tile__label">Monthly recurring</div>
        <div className="stat-tile__value">$48,210</div>
        <div className="stat-tile__foot"><span className="stat-tile__delta stat-tile__delta--up">+12.4%</span></div>
      </div>
    ),
  },
}

/** Leaf → component id. Walk UP from the clicked node; the deepest kit class
 *  that matches wins (a .btn inside a .card resolves to button, not card). */
const CLASS_MAP: Array<[string, string]> = [
  ['stat-tile', 'stat'],
  ['toggle', 'switch'],
  ['tbl', 'table'],
  ['chip', 'chip'],
  ['badge', 'badge'],
  ['avatar', 'avatar'],
  ['tab', 'tabs'],
  ['in', 'input'],
  ['btn', 'button'],
  ['list__item', 'list'],
  ['card', 'card'],
]

export function componentAt(start: Element | null): string | null {
  let el: Element | null = start
  while (el && el !== document.body) {
    for (const [cls, id] of CLASS_MAP) {
      if (el.classList && el.classList.contains(cls)) return id
    }
    el = el.parentElement
  }
  return null
}
