import { useState } from 'react'
import { Icon } from '../../../icons/Icon'
import { RowMenu } from './AppHelpers'

/* HelpdeskApp — a support desk section of the super-app: Queue / Ticket / Help
 * centre. Distinct from Projects on purpose: the ticket is a CONVERSATION thread
 * (canned replies + internal note), NOT the 2-col DescriptionList+Timeline record
 * (that belongs to Projects' Issue). Canonical home for the FAQ help-centre. */
export type HelpdeskSub = 'tickets' | 'ticket' | 'help'

export function HelpdeskScreen({ sub = 'tickets' }: { sub?: HelpdeskSub }) {
  return (
    <div className="dash__main">
      {sub === 'ticket' ? <HelpdeskTicket /> : sub === 'help' ? <HelpdeskHelp /> : <HelpdeskTickets />}
    </div>
  )
}

function HelpdeskBreadcrumb({ here }: { here: string }) {
  return <nav className="breadcrumb" style={{ marginBottom: 12 }}><span>Support</span><Icon name="chevR" /><span style={{ color: 'var(--k-fg)' }}>{here}</span></nav>
}

type Ticket = { id: string; subject: string; who: string; av: number; prio: 'warn' | 'danger' | 'neutral'; prioLabel: string; status: 'success' | 'warn' | 'neutral'; statusLabel: string; agent: string; agentAv: number; updated: string; sla: string; slaBreach?: boolean }
const TICKETS: Ticket[] = [
  { id: '#4821', subject: 'Login fails after password reset', who: 'Tariq Hassan', av: 3, prio: 'danger', prioLabel: 'Urgent', status: 'warn', statusLabel: 'Open', agent: 'JM', agentAv: 2, updated: '2h ago', sla: '0h 38m', slaBreach: true },
  { id: '#4820', subject: 'Export to CSV missing columns', who: 'Mara Jensen', av: 5, prio: 'warn', prioLabel: 'High', status: 'warn', statusLabel: 'Pending', agent: 'AC', agentAv: 4, updated: '4h ago', sla: '3h 10m' },
  { id: '#4819', subject: 'Webhook deliveries failing intermittently', who: 'Ines Dubois', av: 3, prio: 'danger', prioLabel: 'Urgent', status: 'warn', statusLabel: 'Open', agent: 'MK', agentAv: 1, updated: '1h ago', sla: '1h 05m' },
  { id: '#4818', subject: 'Billing invoice shows wrong VAT', who: 'Owen Park', av: 6, prio: 'warn', prioLabel: 'High', status: 'success', statusLabel: 'Solved', agent: 'MK', agentAv: 1, updated: 'Yesterday', sla: '—' },
  { id: '#4817', subject: 'SSO login loops on Safari 17', who: 'Marco Bianchi', av: 5, prio: 'danger', prioLabel: 'Urgent', status: 'warn', statusLabel: 'Pending', agent: 'JM', agentAv: 2, updated: '3h ago', sla: '2h 22m' },
  { id: '#4815', subject: 'Feature request: dark mode for reports', who: 'Lena Vos', av: 1, prio: 'neutral', prioLabel: 'Low', status: 'neutral', statusLabel: 'On hold', agent: 'JM', agentAv: 2, updated: '2 days ago', sla: '—' },
  { id: '#4814', subject: 'CSV import drops the last column', who: 'Priya Nair', av: 1, prio: 'warn', prioLabel: 'High', status: 'warn', statusLabel: 'Open', agent: 'AC', agentAv: 4, updated: '5h ago', sla: '4h 40m' },
  { id: '#4812', subject: 'Two-factor codes arriving late', who: 'Yara Haddad', av: 2, prio: 'warn', prioLabel: 'High', status: 'success', statusLabel: 'Solved', agent: 'MK', agentAv: 1, updated: '2 days ago', sla: '—' },
  { id: '#4811', subject: 'API rate limit hit unexpectedly', who: 'Dev Anand', av: 4, prio: 'danger', prioLabel: 'Urgent', status: 'success', statusLabel: 'Solved', agent: 'AC', agentAv: 4, updated: '3 days ago', sla: '—' },
  { id: '#4809', subject: 'Dashboard charts not loading on mobile', who: 'Tom Becker', av: 6, prio: 'neutral', prioLabel: 'Low', status: 'warn', statusLabel: 'Pending', agent: 'JM', agentAv: 2, updated: '6h ago', sla: '7h 15m' },
]

/* ---- Queue — SaaS-grade SLA support table: queue metrics + filter toolbar +
 *      DataTablePro (bulk-assign/close) + an SLA-countdown column + Pagination. ---- */
function HelpdeskTickets() {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const rows = TICKETS.filter((t) => (t.subject + t.who).toLowerCase().includes(q.toLowerCase()))
  const allOn = rows.length > 0 && rows.every((t) => sel.has(t.id))
  const toggleAll = () => setSel(allOn ? new Set() : new Set(rows.map((t) => t.id)))
  const toggleOne = (k: string) => setSel((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n })
  const open = TICKETS.filter((t) => t.statusLabel === 'Open').length
  const pending = TICKETS.filter((t) => t.statusLabel === 'Pending').length
  const breaching = TICKETS.filter((t) => t.slaBreach).length
  return (
    <div className="dash__page">
      <HelpdeskBreadcrumb here="Queue" />
      <div className="dash__head"><h1>Queue</h1><div className="card__row"><button className="btn btn--ghost btn--sm"><Icon name="upload" /> Export</button><button className="btn btn--primary btn--sm"><Icon name="plus" /> New ticket</button></div></div>

      {/* Queue metrics — Open / Pending / SLA at risk. */}
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 16 }}>
        <div><div style={{ fontSize: 20, fontWeight: 700 }}>{open}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Open</div></div>
        <div><div style={{ fontSize: 20, fontWeight: 700 }}>{pending}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Pending</div></div>
        <div><div style={{ fontSize: 20, fontWeight: 700, color: breaching ? 'var(--k-danger)' : undefined }}>{breaching}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>SLA at risk</div></div>
        <div><div style={{ fontSize: 20, fontWeight: 700 }}>96%</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>SLA met (30d)</div></div>
      </div>

      <div className="toolbar" style={{ marginBottom: 12 }}>
        <span className="in in--inline" style={{ maxWidth: 260 }}>
          <Icon name="search" size={14} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets" aria-label="Search tickets" />
        </span>
        <div className="toolbar__group">
          <select className="select" aria-label="Status filter" defaultValue="all">
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="solved">Solved</option>
          </select>
        </div>
        <span className="toolbar__spacer" />
        <button className="btn btn--ghost btn--sm">Filters</button>
      </div>

      <div className="datatable datatable--page">
        <div className={`datatable__bar ${sel.size > 0 ? 'datatable__bar--active' : ''}`}>
          {sel.size > 0 ? (
            <><span className="datatable__count">{sel.size} selected</span><span className="datatable__spacer" /><button className="btn btn--ghost btn--sm"><Icon name="check" /> Assign to me</button><button className="btn btn--ghost btn--sm"><Icon name="check" /> Close</button></>
          ) : (
            <><span className="datatable__count">{rows.length} tickets</span><span className="datatable__spacer" /><button className="btn btn--secondary btn--sm"><Icon name="plus" /> New ticket</button></>
          )}
        </div>
        <div className="datatable__body">
          <table className="tbl">
            <thead><tr><th className="datatable__check"><label className="check"><input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all tickets" /></label></th><th>Subject</th><th>Requester</th><th>Priority</th><th>Status</th><th>SLA</th><th>Assignee</th><th></th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="datatable__check"><label className="check"><input type="checkbox" checked={sel.has(t.id)} onChange={() => toggleOne(t.id)} aria-label={`Select ${t.id}`} /></label></td>
                  <td><span style={{ color: 'var(--k-fg-faint)', fontVariantNumeric: 'tabular-nums', marginRight: 8 }}>{t.id}</span>{t.subject}</td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className={`avatar avatar--sm avatar--a${t.av}`}>{t.who.split(' ').map((s) => s[0]).join('')}</span>{t.who}</span></td>
                  <td><span className={`badge badge--${t.prio}`}>{t.prioLabel}</span></td>
                  <td><span className={`badge badge--${t.status}`}>{t.statusLabel}</span></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: t.slaBreach ? 600 : 400, color: t.slaBreach ? 'var(--k-danger)' : t.sla === '—' ? 'var(--k-fg-faint)' : 'var(--k-fg-muted)' }}>{t.sla}</td>
                  <td><span className={`avatar avatar--sm avatar--a${t.agentAv}`}>{t.agent}</span></td>
                  <td><RowMenu items={[{ label: 'Open', icon: <Icon name="edit" /> }, { label: 'Assign to me' }, { label: 'Close', danger: true, icon: <Icon name="check" /> }]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card__row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
        <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>Showing {rows.length} of {TICKETS.length}</span>
        <div className="pagination">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous"><Icon name="chevL" /></button>
          {[1, 2].map((n) => <button key={n} aria-current={page === n} onClick={() => setPage(n)}>{n}</button>)}
          <button onClick={() => setPage((p) => Math.min(2, p + 1))} aria-label="Next"><Icon name="chevR" /></button>
        </div>
      </div>
    </div>
  )
}

/* Generic conversation message — avatar + author + time + body. */
function Message({ name, av, time, body, agent, note }: { name: string; av: number; time: string; body: string; agent?: boolean; note?: boolean }) {
  return (
    <div className="card" style={note ? { borderColor: 'var(--k-warning-soft, var(--k-warning))', background: 'var(--k-warning-soft)' } : agent ? { borderColor: 'var(--k-primary-soft)', background: 'var(--k-primary-soft)' } : undefined}>
      <div style={{ display: 'flex', gap: 12 }}>
        <span className={`avatar avatar--sm avatar--a${av}`}>{name.split(' ').map((s) => s[0]).join('')}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
            <strong style={{ fontSize: 'var(--k-type-small)' }}>{name}</strong>
            {note ? <span className="badge badge--warn">Internal note</span> : agent ? <span className="badge badge--neutral">Agent</span> : null}
            <span style={{ fontSize: 'var(--k-type-caption)', color: 'var(--k-fg-muted)' }}>{time}</span>
          </div>
          <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: 0, lineHeight: 1.5 }}>{body}</p>
        </div>
      </div>
    </div>
  )
}

/* ---- Ticket — a single-column conversation thread with a support composer
 *      (canned replies + internal note). NOT a 2-col DL+timeline record. ---- */
const CANNED = ['Password reset steps', 'Refund policy', 'Escalate to engineering']
function HelpdeskTicket() {
  const [reply, setReply] = useState('')
  const [noteMode, setNoteMode] = useState(false)
  return (
    <div className="dash__page" style={{ maxWidth: 720 }}>
      <HelpdeskBreadcrumb here="#4821" />
      <div className="dash__head"><h1>Login fails after password reset</h1><span className="badge badge--warn">Open</span></div>
      {/* Compact ticket meta bar — inline, not a full DescriptionList record. */}
      <div className="card__row" style={{ gap: 16, flexWrap: 'wrap', marginBottom: 16, fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>
        <span>Priority <span className="badge badge--danger">Urgent</span></span>
        <span>Assignee <span className="avatar avatar--sm avatar--a2" style={{ fontSize: 10 }}>JM</span></span>
        <span>Channel · Email</span>
        <span>SLA · 2h left</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <Message name="Tariq Hassan" av={3} time="2h ago" body="After resetting my password I get 'invalid credentials' on every attempt, even with the new password. Tried two browsers and incognito." />
        <Message name="Jordan M." av={2} time="1h ago" agent body="Thanks for the details, Tariq. The reset token was consumed twice — likely a double-submit. I've cleared it; could you request a fresh reset link and try once more?" />
        <Message name="Jordan M." av={2} time="1h ago" note body="Token double-submit confirmed in logs — watch for a pattern across SSO users this week." />
        <Message name="Tariq Hassan" av={3} time="20m ago" body="That worked — I'm back in. Thank you for the quick turnaround!" />
      </div>
      <section className="card">
        {/* Canned replies — one-tap macros that prefill the composer. */}
        <div className="card__row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {CANNED.map((c) => (
            <button key={c} className="btn btn--ghost btn--sm" onClick={() => setReply(`Hi Tariq,\n\n[${c}]`)}>{c}</button>
          ))}
        </div>
        <label className="lab">
          <span>{noteMode ? 'Internal note' : 'Reply'}</span>
          <textarea className="in tx" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={noteMode ? 'Note visible to agents only…' : 'Write a reply…'} />
        </label>
        <div className="card__row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
          <label className="check"><input type="checkbox" checked={noteMode} onChange={() => setNoteMode((v) => !v)} /> Internal note</label>
          <button className="btn btn--primary btn--sm"><Icon name="chat" /> {noteMode ? 'Add note' : 'Send reply'}</button>
        </div>
      </section>
    </div>
  )
}

/* ---- Help centre — FAQ: segmented categories + accordion answers. ---- */
const FAQ: Record<string, [string, string][]> = {
  General: [
    ['How do I reset my password?', 'Open Settings → Security → Reset password. A fresh link is emailed and the old token is invalidated immediately.'],
    ['Where can I see ticket history?', 'Every requester has a profile with their full ticket history under the Contacts tab.'],
  ],
  Billing: [
    ['How do refunds work?', 'Refunds are issued to the original payment method and clear within 5–10 business days.'],
    ['Can I change plan mid-cycle?', 'Yes — upgrades apply immediately and are prorated; downgrades take effect next cycle.'],
  ],
  Account: [
    ['How do I add a teammate?', 'Settings → Members → Invite. They receive an email and join with the role you pick.'],
  ],
}
function HelpdeskHelp() {
  const cats = Object.keys(FAQ)
  const [cat, setCat] = useState<string>('General')
  return (
    <div className="dash__page" style={{ maxWidth: 680 }}>
      <HelpdeskBreadcrumb here="Help centre" />
      <div className="dash__head"><h1>Help centre</h1></div>
      <div className="segctrl" role="tablist" aria-label="FAQ category" style={{ marginBottom: 14, width: 'fit-content' }}>
        {cats.map((c) => (
          <button key={c} className={`segctrl__btn ${cat === c ? 'segctrl__btn--on' : ''}`} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div className="accordion">
        {(FAQ[cat] ?? []).map(([q, a], i) => (
          <details key={q} open={i === 0}>
            <summary>{q}<span className="accordion__chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></span></summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <button className="btn btn--ghost btn--block" style={{ marginTop: 14 }}>Contact support</button>
    </div>
  )
}
