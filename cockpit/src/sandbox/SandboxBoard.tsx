import { useMemo, type CSSProperties } from 'react'
import type { Config } from '../tokens/types'
import { buildTokens } from '../tokens/buildTokens'
import { IconProvider, Icon } from '../icons/Icon'
import type { IconName } from '../icons/concepts'
import { StatusBadge } from '../stage/views/apps/AppHelpers'
import type { Content } from './extractContent'

/* Sandbox · Slice 3 — the result BOARD. One real app screen, composed ENTIRELY
 * from exported kit recipes (.scaffold · .sidenav · .appbar · .stat-tile-strip ·
 * .tbl · .btn · .badge), themed by a Config and POPULATED with the user's own
 * extracted content (brand, nav, primary action, heading). The honest pitch:
 * "your words, our craft." Not their app rebuilt — their app, our design language.
 *
 * It's a self-contained themed island: its own `.cockpit-preview` root carries the
 * resolved tokens, so the SAME board renders in their foundation or in ours just
 * by swapping the `cfg` prop (the foundation toggle). Preview chrome, never
 * exported — it lives beside the gallery, which is also workbench-only. */

interface SandboxBoardProps {
  cfg: Config
  content: Content
}

const NAV_ICONS: IconName[] = ['home', 'grid', 'chart', 'file', 'cal', 'cog']

/* Generic-but-plausible body content — the "craft" half. Held constant across
 * the foundation toggle so only the design language changes, never the data. */
const STATS = [
  { v: '12.4K', l: 'Active' },
  { v: '$48.2K', l: 'Revenue' },
  { v: '96%', l: 'Uptime' },
  { v: '2.4s', l: 'Median' },
]
const ROWS: Array<{ name: string; status: string; tone: 'success' | 'warn' | 'info' }> = [
  { name: 'Acme Corp', status: 'Active', tone: 'success' },
  { name: 'Globex', status: 'Pending', tone: 'warn' },
  { name: 'Initech', status: 'Active', tone: 'success' },
  { name: 'Umbrella', status: 'Review', tone: 'info' },
]

export function SandboxBoard({ cfg, content }: SandboxBoardProps) {
  const tokens = useMemo(() => buildTokens(cfg), [cfg])
  const appName = content.appName || 'Your App'
  const menu = content.menu.length ? content.menu : ['Overview', 'Customers', 'Reports', 'Settings']
  const heading = content.heading || menu[0] || 'Dashboard'
  const primaryBtn = content.primaryBtn || 'New'

  return (
    <div className="cockpit-preview sbx-board" style={tokens.vars as CSSProperties}>
      <IconProvider set={cfg.iconSet}>
        <div className="scaffold scaffold--workspace">
          <div className="scaffold__frame">
            {/* Top app bar — their heading + their primary action, real atoms. */}
            <div className="scaffold__bar appbar">
              <span className="appbar__title">{heading}</span>
              <span className="appbar__spacer" />
              <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Search"><Icon name="search" /></button>
              <button type="button" className="btn btn--primary btn--sm">
                <Icon name="plus" /> {primaryBtn}
              </button>
            </div>

            {/* The ONE side nav — the real `.sidenav` recipe, wearing their brand
                wordmark + their nav labels. */}
            <div className="scaffold__nav">
              <nav className="sidenav" aria-label={`${appName} navigation`}>
                <div className="sidenav__brand">
                  <span className="sidenav__icon" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="1" y="1" width="6" height="6" rx="1.8" />
                      <rect x="9" y="1" width="6" height="6" rx="1.8" />
                      <rect x="1" y="9" width="6" height="6" rx="1.8" />
                      <rect x="9" y="9" width="6" height="6" rx="1.8" />
                    </svg>
                  </span>
                  <span className="sidenav__name">{appName}</span>
                </div>
                <div className="nav-group">Workspace</div>
                {menu.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    className={`navrow ${i === 0 ? 'navrow--on' : ''}`}
                    data-tip={label}
                    aria-label={label}
                    aria-current={i === 0 ? 'page' : undefined}
                  >
                    <Icon name={NAV_ICONS[i % NAV_ICONS.length]!} />
                    <span className="navrow__label">{label}</span>
                  </button>
                ))}
                <div className="sidenav__foot">
                  <button type="button" className="navrow" data-tip="Settings" aria-label="Settings">
                    <Icon name="cog" />
                    <span className="navrow__label">Settings</span>
                  </button>
                </div>
              </nav>
            </div>

            {/* Body — the craft: a KPI strip + a data card, both real recipes. */}
            <div className="scaffold__body">
              <section className="pane" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--k-s-16)' }}>
                <div className="stat-tile-strip">
                  {STATS.map((s) => (
                    <div className="stat-tile-strip__cell" key={s.l}>
                      <div className="stat-tile__value">{s.v}</div>
                      <div className="stat-tile__label">{s.l}</div>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div className="card__head">
                    <h3 className="card__title">{heading}</h3>
                  </div>
                  <table className="tbl">
                    <thead>
                      <tr><th>Name</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {ROWS.map((r) => (
                        <tr key={r.name}>
                          <td>{r.name}</td>
                          <td><StatusBadge tone={r.tone} label={r.status} /></td>
                          <td><Icon name="dots" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="card__foot">
                    <button className="btn btn--ghost btn--sm">View all</button>
                    <button className="btn btn--primary btn--sm">{primaryBtn}</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </IconProvider>
    </div>
  )
}
