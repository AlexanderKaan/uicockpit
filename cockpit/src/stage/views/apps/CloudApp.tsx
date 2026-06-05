import { useState } from 'react'
import { Icon } from '../../../icons/Icon'
import { RowMenu, useDropdown, StatusBadge } from './AppHelpers'

/* CloudScreen — embeddable inner content for the Cloud infra dashboard.
 * Renders the richest desktop coverage (stat-tile-strip + timeline + info cards via
 * CloudDash, the live log timeline via CloudLogs, settings rows + switches +
 * number input + code block, and the 2FA/OTP block) WITHOUT the app's own
 * sidebar, AppFrame, or mobile branch. Designed to sit inside another app's
 * `.dash__main`, so it renders only the inner `.dash__main` content. */
export type CloudSub = 'deployments' | 'domains' | 'logs' | 'status'

/* CloudScreen — Vercel/Cloudflare-style infra on ONE page: Deployments / Domains
 * / Status / Logs switched by an in-page Tabs strip (consolidated from four
 * separate rail pages — no component lost, fewer nav stops). */
export function CloudScreen({ sub = 'deployments' }: { sub?: CloudSub }) {
  const [tab, setTab] = useState<CloudSub>(sub)
  const TABS: [CloudSub, string][] = [['deployments', 'Deployments'], ['domains', 'Domains'], ['status', 'Status'], ['logs', 'Logs']]
  return (
    <div className="dash__main">
      <div className="tabs" role="tablist" aria-label="Cloud sections" style={{ marginBottom: 16 }}>
        {TABS.map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'tab--on' : ''}`} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === 'deployments' ? <CloudDash /> : tab === 'domains' ? <CloudDomains /> : tab === 'status' ? <CloudStatus /> : <CloudLogs />}
    </div>
  )
}


/* Cloud › Status — public status page. Surfaces the .statuspage component
 * (90-day uptime ticks) inside a real screen (was gallery-only). */
function StatusBars({ pattern }: { pattern: string }) {
  return (
    <div className="statuspage__bars">
      {pattern.split('').map((c, i) => (
        <span key={i} className={`statuspage__tick ${c === 'w' ? 'statuspage__tick--warn' : c === 'd' ? 'statuspage__tick--down' : ''}`} />
      ))}
    </div>
  )
}
function CloudStatus() {
  const rows = [
    { name: 'Edge API', pct: '99.98%', p: 'oooooooooooooooooooooo' },
    { name: 'Dashboard', pct: '99.91%', p: 'ooooooooowoooooooooooo' },
    { name: 'Webhooks', pct: '98.40%', p: 'ooooooddoooowwoooooooo' },
    { name: 'CDN', pct: '100%', p: 'oooooooooooooooooooooo' },
    { name: 'Build pipeline', pct: '99.72%', p: 'oooowoooooooooooodoooo' },
  ]
  return (
    <div className="dash__page">      <div className="dash__head"><h1 style={{ flex: 1 }}>System status</h1><span className="badge badge--success">All operational</span></div>
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="statuspage">
          <div className="statuspage__banner"><Icon name="check" /> All systems operational · last 90 days</div>
          {rows.map((r) => (
            <div key={r.name} className="statuspage__row">
              <span className="statuspage__name">{r.name}</span>
              <StatusBars pattern={r.p} />
              <span className="statuspage__pct">{r.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CloudDash() {
  const userDd = useDropdown()
  const projDd = useDropdown()
  return (
    <div className="dash__page">      <div className="dash__head" style={{ alignItems: 'center', gap: 8 }}>
        <h1 style={{ flex: 1 }}>edgework-api</h1>
        <span className="badge badge--success">Production</span>
        {/* Project switcher dropdown */}
        <div ref={projDd.ref} style={{ position: 'relative' }}>
          <button onClick={() => projDd.setOpen(!projDd.open)} className="btn btn--ghost btn--sm" style={{ gap: 6 }}>
            Switch project
            <svg width="9" height="6" viewBox="0 0 10 6"><path d="M1 1 L5 5 L9 1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          </button>
          {projDd.open && (
            <div className="menu" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, minWidth: 220, zIndex: 50 }}>
              <div className="menu__label">Your projects</div>
              <button className="menu__item"><Icon name="check" /> edgework-api</button>
              <button className="menu__item"><span style={{ marginLeft: 22 }}>edgework-www</span></button>
              <button className="menu__item"><span style={{ marginLeft: 22 }}>edgework-staging</span></button>
              <div className="menu__sep" />
              <button className="menu__item"><Icon name="plus" /> New project</button>
            </div>
          )}
        </div>
        {/* User menu */}
        <div ref={userDd.ref} style={{ position: 'relative' }}>
          <button onClick={() => userDd.setOpen(!userDd.open)} style={{ width: 32, height: 32, borderRadius: 999, border: 0, background: 'var(--k-primary-soft)', color: 'var(--k-primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>M</button>
          {userDd.open && (
            <div className="menu" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, minWidth: 220, zIndex: 50 }}>
              <div style={{ padding: '10px 12px', borderBottom: 'var(--k-hairline, 1px solid var(--k-border))' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Mira van Dijk</div>
                <div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>mira@edgework.io</div>
              </div>
              <button className="menu__item"><Icon name="cog" /> Settings <span className="menu__shortcut">⌘,</span></button>
              <button className="menu__item"><Icon name="bell" /> Notifications</button>
              <button className="menu__item"><Icon name="upload" /> API tokens</button>
              <div className="menu__sep" />
              <button className="menu__item menu__item--danger"><Icon name="trash" /> Sign out</button>
            </div>
          )}
        </div>
      </div>
      <div className="banner banner--info" style={{ margin: '12px 0' }}>
        <Icon name="info" />
        <div className="banner__body"><b>Scheduled maintenance</b> — Friday 02:00–04:00 UTC. <a href="#">Learn more</a></div>
        <button className="banner__close">×</button>
      </div>
      {/* Inline infra metrics — a slim summary row, NOT the .stat-tile-strip
          KPI block (that pattern is Home's signature). */}
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        {([['2.4M', 'Requests / day'], ['847 GB', 'Bandwidth'], ['0.08%', 'Errors'], ['142 ms', 'P95 latency']] as [string, string][]).map(([v, l]) => (
          <div key={l}><div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{v}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>{l}</div></div>
        ))}
      </div>
      <div className="twocol" style={{ marginTop: 16, gridTemplateColumns: '2fr 1fr' }}>
        <div>
          <h2 style={{ fontSize: 14, marginBottom: 10 }}>Latest deployments</h2>
          <ol className="timeline">
            <li className="timeline__item timeline__item--done">
              <span className="timeline__dot"><Icon name="check" /></span>
              <div className="timeline__body"><div className="timeline__head"><span className="timeline__title">v2.4.0 deployed</span><span className="timeline__time">2 min ago</span></div><div className="timeline__desc">Production · 12 services updated</div></div>
            </li>
            <li className="timeline__item timeline__item--current">
              <span className="timeline__dot"><span className="timeline__pulse" /></span>
              <div className="timeline__body"><div className="timeline__head"><span className="timeline__title">Running tests</span><span className="timeline__time">in progress</span></div><div className="timeline__desc">348 / 412 passed</div></div>
            </li>
            <li className="timeline__item"><span className="timeline__dot" /><div className="timeline__body"><div className="timeline__head"><span className="timeline__title">Notify subscribers</span></div></div></li>
          </ol>
        </div>
        <aside>
          <h2 style={{ fontSize: 14, marginBottom: 10 }}>Project</h2>
          <div className="info-card"><div className="info-card__label">Database</div><a className="info-card__value info-card__value--link" href="#">edge-prod ↗</a></div>
          <div className="info-card"><div className="info-card__label">Region</div><span className="info-card__value">eu-west-1</span></div>
          <div className="info-card"><div className="info-card__label">Daily Backup</div><span className="badge badge--success">Enabled</span></div>
          <div className="info-card"><div className="info-card__label">Plan</div><span className="badge badge--neutral">Pro</span></div>
          <div className="info-card"><div className="info-card__label">SSL</div><span className="badge badge--success">Active</span></div>
        </aside>
      </div>
    </div>
  )
}

const DOMAINS = [
  { host: 'edgework.io', kind: 'Production', ssl: 'success' as const, sslLabel: 'Valid', status: 'success' as const, label: 'Active', primary: true, expiry: 'in 312 days', expSoon: false },
  { host: 'www.edgework.io', kind: 'Redirect', ssl: 'success' as const, sslLabel: 'Valid', status: 'success' as const, label: 'Active', primary: false, expiry: 'in 312 days', expSoon: false },
  { host: 'api.edgework.io', kind: 'Production', ssl: 'success' as const, sslLabel: 'Valid', status: 'success' as const, label: 'Active', primary: false, expiry: 'in 90 days', expSoon: false },
  { host: 'cdn.edgework.io', kind: 'Production', ssl: 'success' as const, sslLabel: 'Valid', status: 'success' as const, label: 'Active', primary: false, expiry: 'in 204 days', expSoon: false },
  { host: 'docs.edgework.io', kind: 'Redirect', ssl: 'success' as const, sslLabel: 'Valid', status: 'success' as const, label: 'Active', primary: false, expiry: 'in 158 days', expSoon: false },
  { host: 'staging.edgework.io', kind: 'Preview', ssl: 'warn' as const, sslLabel: 'Expiring', status: 'warn' as const, label: 'Pending DNS', primary: false, expiry: 'in 11 days', expSoon: true },
  { host: 'beta.edgework.io', kind: 'Preview', ssl: 'warn' as const, sslLabel: 'Expiring', status: 'success' as const, label: 'Active', primary: false, expiry: 'in 6 days', expSoon: true },
  { host: 'shop.edgework.io', kind: 'Production', ssl: 'success' as const, sslLabel: 'Valid', status: 'success' as const, label: 'Active', primary: false, expiry: 'in 271 days', expSoon: false },
  { host: 'old.edgework.io', kind: 'Redirect', ssl: 'danger' as const, sslLabel: 'Failed', status: 'danger' as const, label: 'Error', primary: false, expiry: 'expired', expSoon: true },
]
function CloudDomains() {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const rows = DOMAINS.filter((d) => d.host.toLowerCase().includes(q.toLowerCase()))
  const allOn = rows.length > 0 && rows.every((d) => sel.has(d.host))
  const toggleAll = () => setSel(allOn ? new Set() : new Set(rows.map((d) => d.host)))
  const toggleOne = (k: string) => setSel((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n })
  const active = DOMAINS.filter((d) => d.label === 'Active').length
  const expiring = DOMAINS.filter((d) => d.expSoon).length
  return (
    <div className="dash__page">      <div className="dash__head">
        <h1>Domains</h1>
        <div className="card__row"><button className="btn btn--ghost btn--sm"><Icon name="upload" /> Export</button><button className="btn btn--primary btn--sm"><Icon name="plus" /> Add domain</button></div>
      </div>

      {/* Summary — active vs SSL renewals due. */}
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 16 }}>
        <div><div style={{ fontSize: 20, fontWeight: 700 }}>{DOMAINS.length}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Domains</div></div>
        <div><div style={{ fontSize: 20, fontWeight: 700 }}>{active}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Active</div></div>
        <div><div style={{ fontSize: 20, fontWeight: 700, color: expiring ? 'var(--k-warning)' : undefined }}>{expiring}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>SSL renewals due</div></div>
      </div>

      <div className="toolbar" style={{ marginBottom: 12 }}>
        <label className="in in--inline" style={{ maxWidth: 280 }}>
          <Icon name="search" />
          <input type="search" aria-label="Filter domains" placeholder="Filter domains…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <span className="toolbar__group">
          <select className="select" style={{ width: 'auto' }} defaultValue="all" aria-label="Type filter"><option value="all">All types</option><option>Production</option><option>Redirect</option><option>Preview</option></select>
        </span>
      </div>

      <div className="datatable datatable--page">
        <div className={`datatable__bar ${sel.size > 0 ? 'datatable__bar--active' : ''}`}>
          {sel.size > 0 ? (
            <><span className="datatable__count">{sel.size} selected</span><span className="datatable__spacer" /><button className="btn btn--ghost btn--sm"><Icon name="check" /> Renew SSL</button><button className="btn btn--danger btn--sm"><Icon name="trash" /> Remove</button></>
          ) : (
            <><span className="datatable__count">{rows.length} domains</span><span className="datatable__spacer" /><button className="btn btn--secondary btn--sm"><Icon name="plus" /> Add domain</button></>
          )}
        </div>
        <div className="datatable__body">
          <table className="tbl">
            <thead><tr><th className="datatable__check"><label className="check"><input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all domains" /></label></th><th>Domain</th><th>Type</th><th>SSL</th><th>Expires</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.host}>
                  <td className="datatable__check"><label className="check"><input type="checkbox" checked={sel.has(d.host)} onChange={() => toggleOne(d.host)} aria-label={`Select ${d.host}`} /></label></td>
                  <td style={{ fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {d.host}
                      {d.primary && <span className="badge badge--neutral">Primary</span>}
                    </div>
                  </td>
                  <td style={{ color: 'var(--k-fg-muted)' }}>{d.kind}</td>
                  <td><StatusBadge tone={d.ssl} label={d.sslLabel} /></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: d.expSoon ? 600 : 400, color: d.expSoon ? 'var(--k-warning)' : 'var(--k-fg-muted)' }}>{d.expiry}</td>
                  <td><StatusBadge tone={d.status} label={d.label} /></td>
                  <td><RowMenu items={[{ label: 'DNS records', icon: <Icon name="file" /> }, { label: 'Renew SSL' }, { label: 'Remove', danger: true, icon: <Icon name="trash" /> }]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card__row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
        <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>Showing {rows.length} of {DOMAINS.length}</span>
        <div className="pagination">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous"><Icon name="chevL" /></button>
          {[1, 2].map((n) => <button key={n} aria-current={page === n} onClick={() => setPage(n)}>{n}</button>)}
          <button onClick={() => setPage((p) => Math.min(2, p + 1))} aria-label="Next"><Icon name="chevR" /></button>
        </div>
      </div>
    </div>
  )
}

const LOG_LINES = [
  '[2026-05-29 14:23:01] INFO  Worker 4823 started',
  '[2026-05-29 14:23:02] INFO  Connected to db at 10.0.0.4',
  '[2026-05-29 14:23:08] DEBUG /api/v1/deploy {sha:"a1b2c3"}',
  '[2026-05-29 14:23:08] INFO  Build queued · estimated 42s',
  '[2026-05-29 14:23:14] WARN  Slow query 412ms on contacts.index',
  '[2026-05-29 14:23:42] INFO  Build complete · uploaded 2.4MB',
  '[2026-05-29 14:23:43] INFO  Cache invalidated · 0.08s',
  '[2026-05-29 14:23:44] WARN  Rate limit approached: 920/1000',
  '[2026-05-29 14:23:47] ERROR Upstream timeout on payments-prod (5000ms)',
  '[2026-05-29 14:23:48] DEBUG Retrying upstream · attempt 2/3',
  '[2026-05-29 14:23:51] INFO  Deploy succeeded · 49.2s total',
]
function CloudLogs() {
  const [q, setQ] = useState('')
  const [level, setLevel] = useState<'all' | 'info' | 'debug' | 'warn' | 'error'>('all')
  const lines = LOG_LINES
    .filter((l) => (level === 'all' ? true : new RegExp(`\\]\\s+${level.toUpperCase()}\\b`).test(l)))
    .filter((l) => l.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="dash__page">      <div className="dash__head"><h1>Logs</h1><button className="btn btn--ghost btn--sm"><Icon name="upload" /> Download</button></div>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <label className="in in--inline" style={{ maxWidth: 280 }}>
          <Icon name="search" size={14} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter logs…" aria-label="Filter logs" />
        </label>
        <span className="toolbar__spacer" />
        <div className="segctrl" role="tablist" aria-label="Log level">
          {(['all', 'info', 'debug', 'warn', 'error'] as const).map((lv) => (
            <button key={lv} role="tab" aria-selected={level === lv} className={`segctrl__btn ${level === lv ? 'segctrl__btn--on' : ''}`} onClick={() => setLevel(lv)}>{lv === 'all' ? 'All' : lv.charAt(0).toUpperCase() + lv.slice(1)}</button>
          ))}
        </div>
      </div>
      <div className="codeblock">
        <div className="codeblock__head"><span className="codeblock__file">/var/log/edge-api.log · live</span><button className="codeblock__copy">Pause</button></div>
        <pre className="codeblock__pre">
          {lines.map((line, i) => (
            <code key={i} className="codeblock__line"><span className="codeblock__gutter">{i + 1}</span><span className="codeblock__text">{line}</span></code>
          ))}
          {lines.length === 0 && <code className="codeblock__line"><span className="codeblock__gutter">—</span><span className="codeblock__text">No matching log lines.</span></code>}
        </pre>
      </div>
    </div>
  )
}
