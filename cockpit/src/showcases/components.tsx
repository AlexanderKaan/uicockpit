import type { ReactNode } from 'react'
import { Icon } from '../icons/Icon'
import { ChartFrame } from '../stage/views/ChartFrame'

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
    recipe: [['Height', '--btn-h'], ['Radius', '--btn-r'], ['Padding', 'u × 2.5'], ['Press', 'scale(0.96) on :active']],
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
  // Fase J-8 — the block-tier recipes the showcases render. Adding them here (+
  // CLASS_MAP below) means Inspect resolves them to their REAL recipe instead of
  // bottoming out at the wrapping Card, so a chart/kanban/tree/etc. no longer
  // *looks* fabricated. (The honest "made-up" detector: anything that still won't
  // resolve after this is genuinely bespoke.)
  chart: {
    label: 'Chart',
    blurb: 'A token-driven presenter — axes, grid and the series colour all derive.',
    recipe: [['Surface', '--k-surface'], ['Grid', '--k-border'], ['Series', '--k-primary'], ['Numerals', 'tabular']],
    specimen: () => (
      <div style={{ width: 260 }}>
        <ChartFrame type="area" labels={['M', 'T', 'W', 'T', 'F']} series={[{ name: 'Visits', values: [8, 12, 9, 15, 13] }]} />
      </div>
    ),
  },
  kanban: {
    label: 'Kanban',
    blurb: 'Columns of cards — count, tag and assignee all come from the seed.',
    recipe: [['Column', '--k-surface-sunken'], ['Card', '--k-surface + shadow-xs'], ['Tag', 'badge tone'], ['Gap', '--k-s-*']],
    specimen: () => (
      <div className="kanban" style={{ maxWidth: 200 }}>
        <div className="kanban__col">
          <div className="kanban__col-head">In progress<span className="kanban__count">2</span></div>
          <div className="kanban__card"><span className="kanban__card-title">Wire the API</span><span className="kanban__tag">api</span></div>
          <div className="kanban__card"><span className="kanban__card-title">Polish empty state</span></div>
        </div>
      </div>
    ),
  },
  tree: {
    label: 'Tree',
    blurb: 'Disclosure rows — chevron, icon, label; the active row wears the soft tone.',
    recipe: [['Row', '--k-row-h'], ['On', '--k-primary-soft'], ['Hover', '--k-state-hover'], ['Indent', '--k-s-*']],
    specimen: () => (
      <div className="card" style={{ maxWidth: 240 }}>
        <div className="tree" role="tree" aria-label="Files">
          <div className="tree__group">
            <div className="tree__row"><span className="tree__chev"><Icon name="chevR" size={13} /></span><span className="tree__icon"><Icon name="grid" size={13} /></span>Campaigns</div>
            <div className="tree__group">
              <div className="tree__row tree__row--on"><span className="tree__chev tree__chev--leaf"><Icon name="chevR" size={13} /></span><span className="tree__icon"><Icon name="file" size={13} /></span>Spring launch</div>
              <div className="tree__row"><span className="tree__chev tree__chev--leaf"><Icon name="chevR" size={13} /></span><span className="tree__icon"><Icon name="file" size={13} /></span>Brand refresh</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  timeline: {
    label: 'Timeline',
    blurb: 'A vertical rail of events; the current node pulses on the motion spring.',
    recipe: [['Rail', '--k-border'], ['Dot', '--k-primary'], ['Done', '--k-success'], ['Pulse', '--k-pulse']],
    specimen: () => (
      <div className="card" style={{ maxWidth: 260 }}>
        <ol className="timeline">
          <li className="timeline__item timeline__item--done"><span className="timeline__dot"><Icon name="check" /></span><div className="timeline__body"><div className="timeline__head"><span className="timeline__title">Deployed</span><span className="timeline__time">2h</span></div></div></li>
          <li className="timeline__item timeline__item--current"><span className="timeline__dot"><span className="timeline__pulse" /></span><div className="timeline__body"><div className="timeline__head"><span className="timeline__title">Running tests</span><span className="timeline__time">now</span></div></div></li>
        </ol>
      </div>
    ),
  },
  pricing: {
    label: 'Pricing tier',
    blurb: 'A plan card — the featured tier lifts with the brand fill and a badge.',
    recipe: [['Card', '--k-surface + radius-lg'], ['Featured', '--k-primary border'], ['Amount', 'fs-h2'], ['CTA', 'btn--block']],
    specimen: () => (
      <div className="pricing" style={{ maxWidth: 200 }}>
        <div className="pricing__tier pricing__tier--featured">
          <span className="pricing__badge">Popular</span>
          <div className="pricing__name">Pro</div>
          <div className="pricing__price"><span className="pricing__amount">$29</span><span className="pricing__period">/mo</span></div>
          <ul className="pricing__feats"><li>Everything in Free</li><li>Unlimited seats</li></ul>
          <button type="button" className="btn btn--primary btn--block">Choose Pro</button>
        </div>
      </div>
    ),
  },
  dl: {
    label: 'Description list',
    blurb: 'Key/value pairs on a two-column grid — terms muted, values in --k-fg.',
    recipe: [['Term', '--k-fg-muted'], ['Value', '--k-fg'], ['Layout', 'grid 2-col'], ['Gap', '--k-s-*']],
    specimen: () => (
      <div className="card" style={{ maxWidth: 240 }}>
        <dl className="dl">
          <dt>Plan</dt><dd>Pro</dd>
          <dt>Seats</dt><dd>12 of 20</dd>
          <dt>Renews</dt><dd>July 2025</dd>
        </dl>
      </div>
    ),
  },
  dropzone: {
    label: 'Dropzone',
    blurb: 'A dashed upload target — the whole tile is the file input’s label.',
    recipe: [['Border', '--k-border dashed'], ['Radius', '--k-radius-lg'], ['Hover', '--k-primary'], ['Hint', 'fs-caption muted']],
    specimen: () => (
      <label className="dropzone" style={{ maxWidth: 280 }}>
        <span className="dropzone__icon"><Icon name="upload" /></span>
        <span className="dropzone__title">Drop files or click to browse</span>
        <span className="dropzone__hint">Images, PDFs — up to 100 MB</span>
        <input type="file" hidden aria-label="Upload" />
      </label>
    ),
  },
  stepper: {
    label: 'Stepper',
    blurb: 'Progress dots — done steps carry a check, the current one the brand fill.',
    recipe: [['Dot', '--k-surface-sunken'], ['Done', '--k-success'], ['Current', '--k-primary'], ['Track', '--k-border']],
    specimen: () => (
      <div className="stepper" style={{ maxWidth: 280 }}>
        <div className="stepper__step stepper__step--done"><span className="stepper__dot"><Icon name="check" /></span><span>Account</span></div>
        <div className="stepper__step stepper__step--current"><span className="stepper__dot">2</span><span>Workspace</span></div>
        <div className="stepper__step"><span className="stepper__dot">3</span><span>Invite</span></div>
      </div>
    ),
  },
  aspect: {
    label: 'Aspect tile',
    blurb: 'A ratio-locked media frame — fills with a thumbnail or a placeholder.',
    recipe: [['Ratio', 'aspect-ratio 1/1'], ['Fill', '--k-grad / sunken'], ['Radius', '--k-radius-md']],
    specimen: () => (
      <div className="aspect aspect--1x1" style={{ maxWidth: 160 }}>
        <div className="aspect__fill" style={{ background: 'var(--k-grad-1)', display: 'grid', placeItems: 'center', color: 'var(--k-primary-fg, #fff)' }}><Icon name="grid" size={22} /></div>
      </div>
    ),
  },
  message: {
    label: 'Chat message',
    blurb: 'A conversation bubble; your own message flips right on the brand-soft fill.',
    recipe: [['Fill', '--k-surface / --k-primary-soft'], ['Radius', '--k-radius-lg'], ['Width', 'cap 85%'], ['Name', 'fs-small semibold']],
    specimen: () => (
      <div className="thread" style={{ maxWidth: 280 }}>
        <div className="msg">
          <div className="msg__head"><span className="msg__name">Mira</span><span className="msg__time">09:24</span></div>
          <p className="msg__body">Draft contract is ready for review.</p>
        </div>
        <div className="msg msg--me">
          <div className="msg__head"><span className="msg__name">You</span><span className="msg__time">09:26</span></div>
          <p className="msg__body">Looks good — sending the redline now.</p>
        </div>
      </div>
    ),
  },
  prose: {
    label: 'Prose',
    blurb: 'A rich-text container — semantic tags take the kit type, rhythm and links.',
    recipe: [['Heading', '--k-font-display'], ['Body', 'fs-body / 1.65'], ['Link', '--k-primary'], ['Measure', '--k-measure-prose']],
    specimen: () => (
      <article className="prose" style={{ maxWidth: 280 }}>
        <div className="prose__kicker">Changelog</div>
        <h2>What’s new in v2.4</h2>
        <p>A tighter type scale and a faster export — everything derives from one set of tokens.</p>
      </article>
    ),
  },
  toolbar: {
    label: 'Toolbar',
    blurb: 'A control-height row — inputs and buttons share one baseline.',
    recipe: [['Height', '--k-control-h'], ['Align', 'baseline'], ['Gap', '--k-s-*'], ['Surface', 'transparent']],
    specimen: () => (
      <div className="toolbar" style={{ maxWidth: 280 }}>
        <input className="in" placeholder="Message…" aria-label="Message" style={{ flex: 1 }} />
        <button type="button" className="btn btn--ghost btn--icon" aria-label="Attach"><Icon name="plus" /></button>
        <button type="button" className="btn btn--primary btn--icon" aria-label="Send"><Icon name="chevR" /></button>
      </div>
    ),
  },
}

/** Leaf → component id. Walk UP from the clicked node; the deepest kit class
 *  that matches wins (a .btn inside a .card resolves to button, not card). */
const CLASS_MAP: Array<[string, string]> = [
  // Leaf atoms first — a .btn inside a .pricing tier resolves to button, not the
  // tier (componentAt walks UP and returns the deepest match).
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
  ['msg', 'message'],
  ['prose', 'prose'],
  // Block-tier containers (Fase J-8) — resolve the distinctive chrome to its real
  // recipe before the walk-up reaches the generic .card wrapper.
  ['chart', 'chart'],
  ['kanban', 'kanban'],
  ['pricing', 'pricing'],
  ['tree', 'tree'],
  ['timeline', 'timeline'],
  ['dropzone', 'dropzone'],
  ['dl', 'dl'],
  ['stepper', 'stepper'],
  ['aspect', 'aspect'],
  ['toolbar', 'toolbar'],
  // Chrome / navigation tier — resolve the structural surfaces too, so the WHOLE
  // screen is pickable (nav, topbar, banners), not just the leaf atoms. These sit
  // after the leaf atoms so a .btn inside the sidebar still resolves to button.
  ['banner', 'banner'],
  ['alert', 'alert'],
  ['select-trigger', 'select'],
  ['calendar', 'calendar'],
  ['segctrl', 'segmented'],
  ['navsuite', 'navsuite'],
  ['sidenav', 'sidenav'],
  ['appbar', 'appbar'],
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

/** Like componentAt but returns the matching ELEMENT (the component's root), so a
 *  hover can outline the exact component the cursor is over — per-component picking. */
export function elementAt(start: Element | null): HTMLElement | null {
  let el: Element | null = start
  while (el && el !== document.body) {
    for (const [cls] of CLASS_MAP) {
      if (el.classList && el.classList.contains(cls)) return el as HTMLElement
    }
    el = el.parentElement
  }
  return null
}
