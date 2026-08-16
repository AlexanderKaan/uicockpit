import type { ReactNode } from 'react'
import { Icon } from '../icons/Icon'

/**
 * One specimen per detectable UI kind — the visitor's own component set,
 * rendered from the kit.
 *
 * WHY SPECIMENS AND NOT THEIR ACTUAL MARKUP
 * We measured this. Reconstructing what a given button LOOKS like in someone's
 * repo reaches about half their treatments, and a third of those need an
 * "assumed" disclaimer because a missing background silently becomes a text
 * button — our measurement gap presented as their design decision. Detecting
 * that an app HAS dialogs, dropdowns and tables answers on 13–15 of 16 kinds
 * everywhere we tested. So recognition rides on the reliable signal: these are
 * the parts YOU build, in YOUR colour — not a claim to have copied your CSS.
 *
 * Every specimen composes EXPORTED kit recipes only. That is the house rule and
 * it is load-bearing here: if a specimen needed a class the kit does not ship,
 * this screen would be quietly showing something the visitor cannot have.
 *
 * The copy stays domain-neutral on purpose. An earlier draft used survey
 * wording throughout and, shown against a document-signing codebase, it broke
 * the recognition exactly where it had to hold.
 */

/** Which flavours of a kind this codebase shows — `table.sortable` and friends,
 *  measured by the engine. A specimen reads only the ones it can show. */
export type Variants = Record<string, number>

export interface Specimen {
  /** What the visitor calls it, not what we call it internally. */
  label: string
  render: (v?: Variants) => ReactNode
  /** Wide specimens take the full row — a nav bar in a 240px cell is a lie. */
  wide?: boolean
}

export const SPECIMENS: Record<string, Specimen> = {
  nav: {
    label: 'Navigation',
    wide: true,
    render: () => (
      <div className="navsuite" style={{ width: '100%' }}>
        {['Home', 'Records', 'People', 'Settings'].map((l, i) => (
          <span key={l} className={`navsuite__item${i === 1 ? ' navsuite__item--on' : ''}`}>
            <span className="navsuite__label">{l}</span>
          </span>
        ))}
      </div>
    ),
  },

  menu: {
    label: 'Dropdown menu',
    render: () => (
      <div className="menu" role="menu" style={{ minWidth: 178, position: 'static' }}>
        <div className="menu__label">Actions</div>
        <button type="button" className="menu__item" role="menuitem">
          Duplicate<span className="menu__shortcut">⌘D</span>
        </button>
        <button type="button" className="menu__item" role="menuitem">Share</button>
        <div className="menu__sep" />
        <button type="button" className="menu__item menu__item--danger" role="menuitem">Delete</button>
      </div>
    ),
  },

  dialog: {
    label: 'Dialog',
    render: () => (
      <div className="dialog" style={{ position: 'static', maxWidth: 258 }}>
        <div className="dialog__body">
          <h3 style={{ margin: '0 0 6px', fontSize: 'var(--k-type-h3)' }}>Delete record?</h3>
          <p style={{ margin: 0, color: 'var(--k-fg-muted)', fontSize: 'var(--k-type-small)' }}>
            This cannot be undone.
          </p>
        </div>
        <div className="dialog__foot">
          <button type="button" className="btn btn--ghost">Cancel</button>
          <button type="button" className="btn btn--danger">Delete</button>
        </div>
      </div>
    ),
  },

  form: {
    label: 'Form field',
    /* An app that validates gets shown the state it actually ships. */
    render: (v) => {
      const validates = (v?.['form.validation'] ?? 0) > 0
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 190 }}>
          <label className="lab" style={{ fontSize: 'var(--k-type-small)' }}>Work email</label>
          <input className="in" defaultValue={validates ? 'ada@' : 'ada@example.com'} aria-invalid={validates || undefined} />
          {validates
            ? <span className="field__error">Enter a complete email address.</span>
            : <span className="field__hint">We never share this.</span>}
        </div>
      )
    },
  },

  table: {
    label: 'Table',
    /* Sorting and selection appear only if they were measured. cal.com sorts
       and documenso does not, and showing sort chevrons to a team that has none
       is the same kind of invention as guessing their brand colour. */
    render: (v) => {
      const sorts = (v?.['table.sortable'] ?? 0) > 0
      const selects = (v?.['table.selectable'] ?? 0) > 0
      return (
        <table className="table" style={{ minWidth: selects ? 268 : 248 }}>
          <thead>
            <tr>
              {selects && (
                <th className="datatable__check">
                  <label className="checkbox"><input type="checkbox" aria-label="Select all" /></label>
                </th>
              )}
              <th className={sorts ? 'is-sortable is-active' : undefined} aria-sort={sorts ? 'ascending' : undefined}>
                {sorts ? <span className="table__sort">Name<span className="table__sort-chevron"><Icon name="chevD" size={11} /></span></span> : 'Name'}
              </th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {selects && (
                <td><label className="checkbox"><input type="checkbox" defaultChecked aria-label="Select row" /></label></td>
              )}
              <td><div className="table__name">Northwind</div><div className="table__sub">12 items</div></td>
              <td><span className="badge badge--success">Live</span></td>
            </tr>
            <tr>
              {selects && (
                <td><label className="checkbox"><input type="checkbox" aria-label="Select row" /></label></td>
              )}
              <td><div className="table__name">Renewal</div><div className="table__sub">4 items</div></td>
              <td><span className="badge badge--warn">Draft</span></td>
            </tr>
          </tbody>
        </table>
      )
    },
  },

  toast: {
    label: 'Toast',
    render: () => (
      <div className="toast toast--success" role="status" style={{ position: 'static' }}>
        <div className="toast__body">
          <div className="toast__title">Changes saved</div>
          <div className="toast__sub">Everyone on the team can see them</div>
        </div>
        <button type="button" className="toast__action">Undo</button>
      </div>
    ),
  },

  badge: {
    label: 'Badges',
    render: () => (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className="badge badge--success">Live</span>
        <span className="badge badge--warn">Draft</span>
        <span className="badge badge--danger">Failed</span>
        <span className="badge">Archived</span>
      </div>
    ),
  },

  tabs: {
    label: 'Tabs',
    render: () => (
      <div className="tabs">
        <span className="tab tab--on">Overview</span>
        <span className="tab">Activity</span>
        <span className="tab">Settings</span>
      </div>
    ),
  },

  toggle: {
    label: 'Switch',
    render: () => (
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span className="toggle is-on" role="switch" aria-checked="true" />
        <span className="toggle" role="switch" aria-checked="false" />
      </div>
    ),
  },

  card: {
    label: 'Card',
    render: () => (
      <div className="card" style={{ minWidth: 178 }}>
        <div className="card__head"><strong>Completion</strong></div>
        <div className="card__col">
          <span style={{ fontSize: 'var(--k-type-h1)', fontWeight: 600 }}>68%</span>
        </div>
      </div>
    ),
  },

  avatar: {
    label: 'Avatars',
    render: () => (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span className="avatar">MK</span>
        <span className="avatar">JD</span>
        <span className="avatar avatar--sm">RL</span>
      </div>
    ),
  },

  breadcrumb: {
    label: 'Breadcrumb',
    render: () => (
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li><a href="#top">Workspace</a></li>
          <li><Icon name="chevR" size={12} /><a href="#top">Records</a></li>
          <li><Icon name="chevR" size={12} /><span aria-current="page">Northwind</span></li>
        </ol>
      </nav>
    ),
  },

  pagination: {
    label: 'Pagination',
    render: () => (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" className="btn btn--ghost btn--sm">Previous</button>
        <span className="badge">1 / 8</span>
        <button type="button" className="btn btn--ghost btn--sm">Next</button>
      </div>
    ),
  },



  calendar: {
    label: 'Calendar',
    render: () => (
      <div className="calendar" style={{ minWidth: 186 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="calendar__head">{d}</span>
        ))}
        {Array.from({ length: 28 }, (_, i) => {
          const d = i + 1
          const cls = ['calendar__cell']
          if (d === 12) cls.push('calendar__cell--today')
          if (d === 19) cls.push('calendar__cell--disabled')
          return (
            <span key={d} className={cls.join(' ')} aria-current={d === 12 ? 'date' : undefined}>{d}</span>
          )
        })}
      </div>
    ),
  },

  tooltip: {
    label: 'Tooltip',
    render: () => (
      // `.tooltip--always` is the recipe's own way to pin the popup open — a bare
      // .tooltip__pop sits at opacity 0 until its parent is hovered, which in a
      // specimen grid means an empty cell.
      <span className="tooltip tooltip--always" style={{ display: 'inline-block' }}>
        <button type="button" className="btn btn--ghost btn--sm">Rename</button>
        <span className="tooltip__pop tooltip__pop--bottom">Rename this record</span>
      </span>
    ),
  },
}

/** Kinds the engine detects but this screen has no specimen for yet. Empty now
 *  that chart and calendar are drawn — kept because the next kind added to the
 *  engine will land here before it lands on screen, and a gap named in code is
 *  a gap somebody fixes. */
export const NO_SPECIMEN: string[] = []

/**
 * The SHELL — the skeleton an app holds to, cut into kit pieces.
 *
 * You recognise your own app by its silhouette before you read a word, so this
 * is the strongest recognition available to a static scan. What we can honestly
 * say is WHICH regions an app has; what we cannot say is how they are arranged,
 * because a modern shell is assembled across nested layouts through components
 * named for their job. Anything composing these has to admit that.
 *
 * These finally give the section tier a consumer with a face. `.scaffold`,
 * `.pane` and `.navsuite` nearly went out with the loupe, kept alive by a build
 * fixture; this is what they were for.
 */
export const SHELL_SPECIMENS: Record<string, Specimen> = {
  'side-nav': {
    label: 'Side navigation',
    render: () => (
      <div className="sidenav" style={{ minWidth: 190, position: 'static' }}>
        <div className="sidenav__brand"><span className="avatar avatar--sm">A</span><b>Acme</b></div>
        <div className="nav-group">Workspace</div>
        {([['home', 'Overview', false], ['feed', 'Records', true], ['chat', 'People', false]] as const).map(
          ([icon, label, on]) => (
            <span key={label} className={`navrow${on ? ' navrow--on' : ''}`}>
              <Icon name={icon} />
              <span className="navrow__label">{label}</span>
            </span>
          ),
        )}
        <div className="sidenav__foot">
          <span className="navrow"><Icon name="cog" /><span className="navrow__label">Settings</span></span>
        </div>
      </div>
    ),
  },

  'top-bar': {
    label: 'Top bar',
    wide: true,
    render: () => (
      <div className="appbar" style={{ width: '100%' }}>
        <span className="appbar__title">Records</span>
        <span className="appbar__spacer" />
        <span className="badge badge--count">4</span>
        <span className="avatar avatar--sm">MK</span>
      </div>
    ),
  },

  rail: {
    label: 'Collapsing rail',
    render: () => (
      <div className="sidenav sidenav--rail" style={{ position: 'static' }}>
        {/* A rail row is a bare icon inside .navrow — `.sidenav__icon` is the
            BRAND tile and the rail hides it, which rendered this cell empty. */}
        {(['home', 'feed', 'cog'] as const).map((n, i) => (
          <span key={n} className={`navrow${i === 1 ? ' navrow--on' : ''}`}>
            <Icon name={n} />
          </span>
        ))}
      </div>
    ),
  },

  'page-header': {
    label: 'Page header',
    wide: true,
    render: () => (
      <div className="page-head" style={{ width: '100%' }}>
        <div className="page-head__titles">
          <div className="page-head__eyebrow">Workspace</div>
          <h2 className="page-head__title">Records</h2>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--ghost btn--sm">Export</button>
          <button type="button" className="btn btn--primary btn--sm">New record</button>
        </div>
      </div>
    ),
  },

  breadcrumbs: {
    label: 'Breadcrumb bar',
    render: () => (
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li><a href="#top">Workspace</a></li>
          <li><Icon name="chevR" size={12} /><a href="#top">Records</a></li>
          <li><Icon name="chevR" size={12} /><span aria-current="page">Northwind</span></li>
        </ol>
      </nav>
    ),
  },

  'command-menu': {
    label: 'Command menu',
    render: () => (
      <div className="cmdp" style={{ position: 'static', minWidth: 210 }}>
        <div className="cmdp__in">
          <Icon name="search" size={14} />
          <input defaultValue="rec" aria-label="Command" />
        </div>
        <div className="cmdp__list">
          <div className="cmdp__section">Go to</div>
          <div className="cmdp__item cmdp__item--on">Records<span className="cmdp__shortcut">⌘R</span></div>
          <div className="cmdp__item">Recent activity</div>
        </div>
      </div>
    ),
  },

  toolbar: {
    label: 'Toolbar',
    wide: true,
    render: () => (
      <div className="toolbar" style={{ width: '100%' }}>
        <button type="button" className="btn btn--ghost btn--sm">Filter</button>
        <button type="button" className="btn btn--ghost btn--sm">Sort</button>
        <span className="appbar__spacer" />
        <span className="badge">12 selected</span>
      </div>
    ),
  },

  'right-panel': {
    label: 'Detail panel',
    render: () => (
      /* Plain .pane: `--fixed` carries a 360px width from the scaffold's
         list-detail archetype, which overflowed a specimen cell. */
      <section className="pane" style={{ width: '100%', padding: 'var(--k-s-12)' }}>
        <div className="page-head__eyebrow">Selected</div>
        <div style={{ fontWeight: 600, margin: '2px 0 8px' }}>Northwind</div>
        <dl className="dl" style={{ margin: 0 }}>
          <dt>Status</dt><dd><span className="badge badge--success">Live</span></dd>
          <dt>Owner</dt><dd>MK</dd>
        </dl>
      </section>
    ),
  },
}
