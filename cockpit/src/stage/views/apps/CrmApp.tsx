import { useState } from 'react'
import { Icon } from '../../../icons/Icon'
import { RowMenu, StatusBadge } from './AppHelpers'

/* CrmApp — a Sales CRM section of the super-app: Contacts / Pipeline / New
 * contact. Distinct from Projects on purpose: the pipeline is a FORECAST (charts
 * + progress bars), never a kanban, and a contact opens a Popover quick-view —
 * the 2-col record detail belongs ONLY to Projects' Issue. Canonical home for
 * Popover, Form, Validation and PhoneInput. */
export type CrmSub = 'contacts' | 'pipeline' | 'new'

export function CrmScreen({ sub = 'contacts' }: { sub?: CrmSub }) {
  return (
    <div className="dash__main">
      {sub === 'pipeline' ? <CrmPipeline /> : sub === 'new' ? <CrmNewContact /> : <CrmContacts />}
    </div>
  )
}

function CrmBreadcrumb({ here }: { here: string }) {
  return <nav className="breadcrumb" style={{ marginBottom: 12 }}><span>CRM</span><Icon name="chevR" /><span style={{ color: 'var(--k-fg)' }}>{here}</span></nav>
}

/* ---- Contacts — admin table with toolbar; a row name opens a Popover quick-view ---- */
type Contact = { name: string; initials: string; av: number; company: string; status: 'success' | 'warn' | 'neutral'; label: string; owner: string; ownerAv: number; value: string; last: string; role: string }
const CONTACTS: Contact[] = [
  { name: 'Lena Vos', initials: 'LV', av: 1, company: 'Northwind Co.', status: 'success', label: 'Customer', owner: 'JM', ownerAv: 2, value: '€24,000', last: '2h ago', role: 'Head of Ops' },
  { name: 'Tariq Hassan', initials: 'TH', av: 3, company: 'Acme Corp', status: 'warn', label: 'Lead', owner: 'AC', ownerAv: 4, value: '€8,500', last: 'Yesterday', role: 'VP Engineering' },
  { name: 'Mara Jensen', initials: 'MJ', av: 5, company: 'Globex', status: 'success', label: 'Customer', owner: 'JM', ownerAv: 2, value: '€41,200', last: '3 days ago', role: 'Procurement' },
  { name: 'Owen Park', initials: 'OP', av: 6, company: 'Initech', status: 'neutral', label: 'Cold', owner: 'MK', ownerAv: 1, value: '€2,100', last: '1 week ago', role: 'Founder' },
  { name: 'Sofia Marek', initials: 'SM', av: 2, company: 'Umbrella Ltd', status: 'warn', label: 'Lead', owner: 'AC', ownerAv: 4, value: '€15,750', last: '2h ago', role: 'Marketing Lead' },
  { name: 'Dev Anand', initials: 'DA', av: 4, company: 'Hooli', status: 'success', label: 'Customer', owner: 'MK', ownerAv: 1, value: '€33,400', last: 'Today', role: 'CTO' },
  { name: 'Ines Dubois', initials: 'ID', av: 3, company: 'Soylent Corp', status: 'warn', label: 'Lead', owner: 'JM', ownerAv: 2, value: '€11,300', last: '4h ago', role: 'CFO' },
  { name: 'Marco Bianchi', initials: 'MB', av: 5, company: 'Cyberdyne', status: 'success', label: 'Customer', owner: 'AC', ownerAv: 4, value: '€52,000', last: 'Yesterday', role: 'VP Sales' },
  { name: 'Priya Nair', initials: 'PN', av: 1, company: 'Tyrell Corp', status: 'neutral', label: 'Cold', owner: 'MK', ownerAv: 1, value: '€3,900', last: '2 days ago', role: 'Analyst' },
  { name: 'Tom Becker', initials: 'TB', av: 6, company: 'Aperture Labs', status: 'success', label: 'Customer', owner: 'JM', ownerAv: 2, value: '€28,700', last: 'Today', role: 'Director' },
  { name: 'Yara Haddad', initials: 'YH', av: 2, company: 'Stark Industries', status: 'warn', label: 'Lead', owner: 'AC', ownerAv: 4, value: '€19,500', last: '6h ago', role: 'Procurement' },
  { name: 'Niko Virtanen', initials: 'NV', av: 4, company: 'Wayne Ent.', status: 'success', label: 'Customer', owner: 'MK', ownerAv: 1, value: '€44,100', last: '1 week ago', role: 'CTO' },
]

function CrmContacts() {
  const [q, setQ] = useState('')
  const [openC, setOpenC] = useState<string | null>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const rows = CONTACTS.filter((c) => (c.name + c.company).toLowerCase().includes(q.toLowerCase()))
  const allOn = rows.length > 0 && rows.every((c) => sel.has(c.name))
  const toggleAll = () => setSel(allOn ? new Set() : new Set(rows.map((c) => c.name)))
  const toggleOne = (k: string) => setSel((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n })
  const customers = CONTACTS.filter((c) => c.label === 'Customer').length
  const openValue = CONTACTS.reduce((a, c) => a + parseInt(c.value.replace(/[^\d]/g, ''), 10), 0)
  return (
    <div className="dash__page">
      <CrmBreadcrumb here="Contacts" />
      <div className="dash__head"><h1>Contacts</h1><div className="card__row"><button className="btn btn--ghost btn--sm"><Icon name="upload" /> Export</button><button className="btn btn--primary btn--sm"><Icon name="plus" /> Add contact</button></div></div>

      {/* Summary metric row. */}
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 16 }}>
        <div><div style={{ fontSize: 20, fontWeight: 700 }}>{CONTACTS.length}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Total contacts</div></div>
        <div><div style={{ fontSize: 20, fontWeight: 700 }}>{customers}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Customers</div></div>
        <div><div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>€{openValue.toLocaleString('en-US')}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Open pipeline</div></div>
      </div>

      <div className="toolbar" style={{ marginBottom: 12 }}>
        <span className="in in--inline" style={{ maxWidth: 260 }}>
          <Icon name="search" size={14} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts" aria-label="Search contacts" />
        </span>
        <div className="toolbar__group">
          <select className="select" aria-label="Status filter" defaultValue="all">
            <option value="all">All statuses</option>
            <option value="customer">Customers</option>
            <option value="lead">Leads</option>
          </select>
        </div>
        <span className="toolbar__spacer" />
        <button className="btn btn--ghost btn--sm">Filters</button>
      </div>

      <div className="datatable datatable--page">
        <div className={`datatable__bar ${sel.size > 0 ? 'datatable__bar--active' : ''}`}>
          {sel.size > 0 ? (
            <><span className="datatable__count">{sel.size} selected</span><span className="datatable__spacer" /><button className="btn btn--ghost btn--sm"><Icon name="bell" /> Email</button><button className="btn btn--ghost btn--sm"><Icon name="check" /> Assign</button><button className="btn btn--danger btn--sm"><Icon name="trash" /> Delete</button></>
          ) : (
            <><span className="datatable__count">{rows.length} contacts</span><span className="datatable__spacer" /><button className="btn btn--secondary btn--sm"><Icon name="plus" /> Add contact</button></>
          )}
        </div>
        <div className="datatable__body">
          <table className="tbl">
            <thead><tr><th className="datatable__check"><label className="check"><input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all contacts" /></label></th><th>Name</th><th>Company</th><th>Status</th><th>Owner</th><th>Value</th><th>Last activity</th><th></th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.name}>
                  <td className="datatable__check"><label className="check"><input type="checkbox" checked={sel.has(c.name)} onChange={() => toggleOne(c.name)} aria-label={`Select ${c.name}`} /></label></td>
                  <td style={{ position: 'relative' }}>
                    {/* Popover quick-view — click the name to peek without leaving the list. */}
                    <button
                      type="button"
                      onClick={() => setOpenC(openC === c.name ? null : c.name)}
                      aria-expanded={openC === c.name}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}
                    >
                      <span className={`avatar avatar--sm avatar--a${c.av}`}>{c.initials}</span>{c.name}
                    </button>
                    {openC === c.name && (
                      <div className="popover" role="dialog" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 20, marginTop: 6, minWidth: 220 }} onMouseLeave={() => setOpenC(null)}>
                        <span className="popover__arrow" />
                        <div className="card__row" style={{ gap: 8, marginBottom: 8 }}>
                          <span className={`avatar avatar--sm avatar--a${c.av}`}>{c.initials}</span>
                          <div className="card__col" style={{ gap: 1, flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: 'var(--k-type-small)' }}>{c.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>{c.role} · {c.company}</span>
                          </div>
                        </div>
                        <dl className="dl" style={{ marginBottom: 8 }}>
                          <dt>Status</dt><dd><span className={`badge badge--${c.status}`}>{c.label}</span></dd>
                          <dt>Open value</dt><dd>{c.value}</dd>
                        </dl>
                        <div className="card__row" style={{ gap: 6 }}>
                          <button className="btn btn--primary btn--sm" style={{ flex: 1 }}>Open</button>
                          <button className="btn btn--ghost btn--sm" style={{ flex: 1 }}>Email</button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>{c.company}</td>
                  <td><span className={`badge badge--${c.status}`}>{c.label}</span></td>
                  <td><span className={`avatar avatar--sm avatar--a${c.ownerAv}`}>{c.owner}</span></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{c.value}</td>
                  <td style={{ color: 'var(--k-fg-muted)' }}>{c.last}</td>
                  <td><RowMenu items={[{ label: 'Open', icon: <Icon name="edit" /> }, { label: 'Log activity' }, { label: 'Delete', danger: true, icon: <Icon name="trash" /> }]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card__row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
        <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>Showing {rows.length} of {CONTACTS.length}</span>
        <div className="pagination">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous"><Icon name="chevL" /></button>
          {[1, 2].map((n) => <button key={n} aria-current={page === n} onClick={() => setPage(n)}>{n}</button>)}
          <button onClick={() => setPage((p) => Math.min(2, p + 1))} aria-label="Next"><Icon name="chevR" /></button>
        </div>
      </div>
    </div>
  )
}

/* ---- Pipeline — a FORECAST, not a kanban: stage progress bars + a monthly
 *      bar chart. Kanban is Projects' signature; the pipeline reads as numbers. ---- */
const STAGES: { label: string; value: number; deals: number; tone: 'info' | 'warn' | 'success' }[] = [
  { label: 'Lead', value: 84000, deals: 18, tone: 'info' },
  { label: 'Qualified', value: 162000, deals: 11, tone: 'info' },
  { label: 'Proposal', value: 96000, deals: 6, tone: 'warn' },
  { label: 'Closed won', value: 211000, deals: 9, tone: 'success' },
]
const FORECAST: [string, number][] = [['Jan', 48], ['Feb', 55], ['Mar', 61], ['Apr', 72], ['May', 80], ['Jun', 94]]

function CrmPipeline() {
  const max = Math.max(...STAGES.map((s) => s.value))
  const total = STAGES.reduce((a, s) => a + s.value, 0)
  return (
    <div className="dash__page">
      <CrmBreadcrumb here="Pipeline" />
      <div className="dash__head"><h1>Pipeline forecast</h1><button className="btn btn--primary btn--sm"><Icon name="plus" /> New deal</button></div>

      <div style={{ display: 'flex', gap: 28, marginBottom: 20, flexWrap: 'wrap' }}>
        <div><div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>€{(total / 1000).toFixed(0)}K</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Open pipeline</div></div>
        <div><div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>€164K</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Weighted forecast</div></div>
        <div><div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>28%</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Win rate</div></div>
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card__title" style={{ marginBottom: 12 }}>Value by stage</div>
        {STAGES.map((s) => (
          <div key={s.label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, fontSize: 'var(--k-type-small)' }}>
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>{s.label} <StatusBadge tone={s.tone} label={`${s.deals} deals`} /></span>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>€{(s.value / 1000).toFixed(0)}K</span>
            </div>
            <div className="progress"><div className="progress__fill" style={{ width: `${(s.value / max) * 100}%` }} /></div>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card__title" style={{ marginBottom: 12 }}>Closed revenue — last 6 months</div>
        <div className="barchart" style={{ height: 120 }}>
          {FORECAST.map(([m, v], i) => (
            <div key={i} className="barchart__bar" style={{ height: `${v}%`, background: 'var(--k-grad-1)' }} tabIndex={0} role="img" aria-label={`${m}: €${v}K`}>
              <span className="barchart__tip">{m} · €{v}K</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ---- New contact — a form: text fields, a Validation field and a PhoneInput ---- */
function CrmNewContact() {
  const [phone, setPhone] = useState('6 12 34 56 78')
  return (
    <div className="dash__page">
      <CrmBreadcrumb here="New contact" />
      <div className="dash__head"><h1>New contact</h1></div>
      <section className="card form-measure">
        <label className="lab">
          <span>Full name</span>
          <input className="in" placeholder="Jordan Maxwell" />
        </label>
        {/* Validation — inline error state with message. */}
        <label className="lab">
          <span>Email</span>
          <input className="in is-error" defaultValue="jordan@" aria-invalid="true" aria-describedby="crm-email-err" />
          <span id="crm-email-err" style={{ fontSize: 11, color: 'var(--k-danger)', marginTop: 2 }}>Enter a valid email address.</span>
        </label>
        <label className="lab">
          <span>Company</span>
          <input className="in" placeholder="Acme Corp" />
        </label>
        {/* PhoneInput — country selector + national number. */}
        <div className="lab">
          <span>Phone</span>
          <div className="phoneinput">
            <button className="phoneinput__country" aria-label="Country">
              <span className="phoneinput__flag" aria-hidden>🇳🇱</span>
              <span className="phoneinput__code">+31</span>
              <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden><path d="M1 1 L5 5 L9 1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
            <input className="phoneinput__field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6 12 34 56 78" />
          </div>
        </div>
        <label className="lab">
          <span>Owner</span>
          <select className="select"><option>Jordan M.</option><option>Ava C.</option><option>Mara K.</option></select>
        </label>
        <div className="card__foot">
          <div className="card__row" style={{ justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn--ghost btn--sm">Cancel</button>
            <button className="btn btn--primary btn--sm">Create contact</button>
          </div>
        </div>
      </section>
    </div>
  )
}
