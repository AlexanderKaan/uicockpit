import { useState } from 'react'
import { Icon } from '../../../icons/Icon'
import { RowMenu, StatusBadge } from './AppHelpers'

/* BillingScreen — Stripe/Mercury-style finance: Invoices / New invoice / Plans.
 * No KPI dashboard (that pattern is Home's). Canonical home for the
 * WizardStepper (multi-step New-invoice flow) and PricingCard. */
export type BillingSub = 'invoices' | 'new' | 'plans'

export function BillingScreen({ sub = 'invoices' }: { sub?: BillingSub }) {
  return (
    <div className="dash__main">
      {sub === 'new' ? <AcctNewInvoice /> : sub === 'plans' ? <AcctPricing /> : <AcctInvoices />}
    </div>
  )
}

function BillingBreadcrumb({ here }: { here: string }) {
  return <nav className="breadcrumb" style={{ marginBottom: 12 }}><span>Billing</span><Icon name="chevR" /><span style={{ color: 'var(--k-fg)' }}>{here}</span></nav>
}

const INVOICES = [
  { id: 'INV-2041', customer: 'Acme Co.', amount: 12500, due: 'Jun 02', status: 'warn' as const, label: 'Due soon' },
  { id: 'INV-2040', customer: 'Northwind', amount: 4200, due: 'Jun 10', status: 'info' as const, label: 'Sent' },
  { id: 'INV-2039', customer: 'Globex', amount: 8712, due: 'May 28', status: 'success' as const, label: 'Paid' },
  { id: 'INV-2038', customer: 'Initech', amount: 3100, due: 'May 14', status: 'danger' as const, label: 'Overdue' },
  { id: 'INV-2037', customer: 'Umbrella', amount: 6400, due: 'May 09', status: 'success' as const, label: 'Paid' },
  { id: 'INV-2036', customer: 'Hooli', amount: 18150, due: 'May 06', status: 'success' as const, label: 'Paid' },
  { id: 'INV-2035', customer: 'Stark Industries', amount: 9800, due: 'May 02', status: 'success' as const, label: 'Paid' },
  { id: 'INV-2034', customer: 'Wayne Enterprises', amount: 23400, due: 'Apr 28', status: 'info' as const, label: 'Sent' },
  { id: 'INV-2033', customer: 'Soylent Corp', amount: 1450, due: 'Apr 24', status: 'danger' as const, label: 'Overdue' },
  { id: 'INV-2032', customer: 'Cyberdyne', amount: 7720, due: 'Apr 20', status: 'success' as const, label: 'Paid' },
  { id: 'INV-2031', customer: 'Tyrell Corp', amount: 5600, due: 'Apr 16', status: 'success' as const, label: 'Paid' },
  { id: 'INV-2030', customer: 'Aperture Labs', amount: 3340, due: 'Apr 12', status: 'success' as const, label: 'Paid' },
]

/* ---- Invoices — a SaaS-grade finance table: summary metrics + a filter toolbar
 *      + DataTablePro (bulk select + bulk-action bar) + Pagination. Mirrors the
 *      density of real billing apps (Moneybird / Stripe), built from our kit. ---- */
function AcctInvoices() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const rows = INVOICES
    .filter((iv) => (filter === 'all' ? true : filter === 'open' ? iv.label !== 'Paid' : filter === 'paid' ? iv.label === 'Paid' : iv.label === 'Overdue'))
    .filter((iv) => `${iv.id} ${iv.customer}`.toLowerCase().includes(q.toLowerCase()))
  const allOn = rows.length > 0 && rows.every((iv) => sel.has(iv.id))
  const toggleAll = () => setSel(allOn ? new Set() : new Set(rows.map((iv) => iv.id)))
  const toggleOne = (id: string) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  // Summary roll-ups for the metric row.
  const outstanding = INVOICES.filter((iv) => iv.label !== 'Paid').reduce((a, iv) => a + iv.amount, 0)
  const paid = INVOICES.filter((iv) => iv.label === 'Paid').reduce((a, iv) => a + iv.amount, 0)
  const overdue = INVOICES.filter((iv) => iv.label === 'Overdue').length
  const eur = (n: number) => '€' + n.toLocaleString('en-US')

  return (
    <div className="dash__page">
      <BillingBreadcrumb here="Invoices" />
      <div className="dash__head">
        <h1>Invoices</h1>
        <div className="card__row">
          <button className="btn btn--ghost btn--sm"><Icon name="upload" /> Export</button>
          <button className="btn btn--primary btn--sm"><Icon name="plus" /> New invoice</button>
        </div>
      </div>

      {/* Summary metric row — slim inline figures (not the Home KPI strip). */}
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 16 }}>
        <div><div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{eur(outstanding)}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Outstanding</div></div>
        <div><div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{eur(paid)}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Paid (30 days)</div></div>
        <div><div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--k-danger)' }}>{overdue}</div><div style={{ fontSize: 11, color: 'var(--k-fg-muted)' }}>Overdue</div></div>
      </div>

      <div className="banner banner--warn" style={{ marginBottom: 14 }}>
        <Icon name="bell" />
        <div className="banner__body"><b>1 invoice overdue</b> — Initech owes €3,100 since May 14. <a href="#">Send reminder</a></div>
        <button className="banner__close">×</button>
      </div>

      {/* Filter toolbar — search + status filter + date range. */}
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <label className="in in--inline" style={{ maxWidth: 240 }}>
          <Icon name="search" size={14} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoices…" aria-label="Search invoices" />
        </label>
        <span className="toolbar__group">
          <select className="select" style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Status filter">
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <button className="btn btn--ghost">This year <Icon name="chevD" size={13} /></button>
        </span>
      </div>

      {/* DataTablePro — sticky header, bulk select + bulk-action bar. */}
      <div className="datatable datatable--page">
        <div className={`datatable__bar ${sel.size > 0 ? 'datatable__bar--active' : ''}`}>
          {sel.size > 0 ? (
            <>
              <span className="datatable__count">{sel.size} selected</span>
              <span className="datatable__spacer" />
              <button className="btn btn--ghost btn--sm"><Icon name="check" /> Mark paid</button>
              <button className="btn btn--ghost btn--sm"><Icon name="bell" /> Send reminder</button>
              <button className="btn btn--danger btn--sm"><Icon name="trash" /> Void</button>
            </>
          ) : (
            <>
              <span className="datatable__count">{rows.length} invoices</span>
              <span className="datatable__spacer" />
              <button className="btn btn--secondary btn--sm"><Icon name="plus" /> New invoice</button>
            </>
          )}
        </div>
        <div className="datatable__body">
          <table className="tbl">
            <thead>
              <tr>
                <th className="datatable__check"><label className="check"><input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all invoices" /></label></th>
                <th>Invoice</th><th>Customer</th><th>Amount</th><th>Due</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((iv) => (
                <tr key={iv.id}>
                  <td className="datatable__check"><label className="check"><input type="checkbox" checked={sel.has(iv.id)} onChange={() => toggleOne(iv.id)} aria-label={`Select ${iv.id}`} /></label></td>
                  <td style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{iv.id}</td>
                  <td>{iv.customer}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(iv.amount)}</td>
                  <td style={{ color: 'var(--k-fg-muted)' }}>{iv.due}</td>
                  <td><StatusBadge tone={iv.status} label={iv.label} /></td>
                  <td><RowMenu items={[{ label: 'View', icon: <Icon name="file" /> }, { label: 'Send reminder' }, { label: 'Void', danger: true }]} /></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--k-fg-faint)' }}>No invoices match.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="card__row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
          <span style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)' }}>Showing {rows.length} of {INVOICES.length}</span>
          <div className="pagination">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous"><Icon name="chevL" /></button>
            {[1, 2, 3].map((n) => <button key={n} aria-current={page === n} onClick={() => setPage(n)}>{n}</button>)}
            <button onClick={() => setPage((p) => Math.min(3, p + 1))} aria-label="Next"><Icon name="chevR" /></button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- New invoice — the WizardStepper flow (Customer → Items → Totals → Send)
 *      showcasing CurrencyInput, NumberInput and PhoneInput in a real form. ---- */
function AcctNewInvoice() {
  const [step, setStep] = useState(0)
  const [amt, setAmt] = useState(2400)
  const [phone, setPhone] = useState('6 12 34 56 78')
  return (
    <div className="dash__page">
      <BillingBreadcrumb here="New invoice" />
      <div className="dash__head"><h1>New invoice</h1></div>
      <div className="card" style={{ maxWidth: 760 }}>
        <div className="wstepper">
          {/* Step bar reuses the canonical .stepper recipe (one stepper system). */}
          <div className="stepper">
            {['Customer', 'Items', 'Totals', 'Send'].map((label, i) => {
              const done = i < step
              const current = i === step
              return (
                <div key={label} className={'stepper__step' + (done ? ' stepper__step--done' : '') + (current ? ' stepper__step--current' : '')}>
                  <span className="stepper__dot">{done ? <Icon name="check" /> : i + 1}</span>
                  <span>{label}</span>
                </div>
              )
            })}
          </div>
          <div className="wstepper__content form-measure form-measure--center">
            {step === 0 && (
              <>
                <div className="wstepper__title">Customer</div>
                <div className="wstepper__sub">Who is this invoice for?</div>
                <input className="in" placeholder="Customer name" defaultValue="Acme Co." aria-label="Customer name" />
                <input className="in" type="email" autoComplete="email" placeholder="billing@acme.com" aria-label="Billing email" style={{ marginTop: 8 }} />
                <div className="phoneinput" style={{ marginTop: 8 }}>
                  <button className="phoneinput__country" aria-label="Country"><span className="phoneinput__flag" aria-hidden>🇳🇱</span><span className="phoneinput__code">+31</span><svg width="9" height="6" viewBox="0 0 10 6" aria-hidden><path d="M1 1 L5 5 L9 1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg></button>
                  <input className="phoneinput__field" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <div className="wstepper__title">Items</div>
                <div className="wstepper__sub">Add line items. Amounts in EUR.</div>
                <div className="curinp">
                  <span className="curinp__sym">€</span>
                  <input className="curinp__field" value={amt.toLocaleString('en-US')} onChange={(e) => { const n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10); if (!isNaN(n)) setAmt(n) }} aria-label="Unit price" />
                  <span className="curinp__sfx">/ item</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <span style={{ fontSize: 13, flex: 1 }}>Quantity</span>
                  <div className="numinput" style={{ width: 130 }}>
                    <button className="numinput__step">−</button>
                    <input className="numinput__field" value="3" readOnly aria-label="Quantity" />
                    <button className="numinput__step">+</button>
                  </div>
                </div>
              </>
            )}
            {step >= 2 && (
              <>
                <div className="wstepper__title">{step === 2 ? 'Totals' : 'Send'}</div>
                <dl className="dl">
                  <dt>Items</dt><dd>3 × €{amt.toLocaleString('en-US')}</dd>
                  <dt>Subtotal</dt><dd>€{(amt * 3).toLocaleString('en-US')}</dd>
                  <dt>VAT (21%)</dt><dd>€{Math.round(amt * 3 * 0.21).toLocaleString('en-US')}</dd>
                  <dt><b>Total</b></dt><dd><b>€{Math.round(amt * 3 * 1.21).toLocaleString('en-US')}</b></dd>
                </dl>
              </>
            )}
          </div>
          <div className="wstepper__foot form-measure form-measure--center">
            <button className="btn btn--ghost btn--sm" onClick={() => setStep(Math.max(0, step - 1))}>Back</button>
            <button className="btn btn--primary btn--sm" onClick={() => setStep(Math.min(3, step + 1))}>{step === 3 ? 'Send invoice' : 'Continue'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AcctPricing() {
  return (
    <div className="dash__page">
      <BillingBreadcrumb here="Plans" />
      <div className="dash__head"><h1>Plans</h1></div>
      <p style={{ color: 'var(--k-fg-muted)', fontSize: 13, marginTop: -4 }}>You're on Starter. Upgrade for unlimited invoices and reporting.</p>
      <div className="pricing" style={{ marginTop: 16, maxWidth: 720 }}>
        <div className="pricing__tier">
          <div className="pricing__name">Starter</div>
          <div className="pricing__price"><span className="pricing__amount">€0</span><span className="pricing__period">/mo</span></div>
          <ul className="pricing__feats"><li>5 invoices / mo</li><li>1 user</li><li>Email support</li></ul>
          <button className="btn btn--ghost btn--sm" style={{ width: '100%' }}>Current plan</button>
        </div>
        <div className="pricing__tier pricing__tier--featured">
          <span className="pricing__badge">POPULAR</span>
          <div className="pricing__name">Pro</div>
          <div className="pricing__price"><span className="pricing__amount">€29</span><span className="pricing__period">/mo</span></div>
          <ul className="pricing__feats"><li>Unlimited invoices</li><li>5 users</li><li>Custom branding</li><li>Reports + insights</li></ul>
          <button className="btn btn--primary btn--sm" style={{ width: '100%' }}>Upgrade to Pro</button>
        </div>
        <div className="pricing__tier">
          <div className="pricing__name">Business</div>
          <div className="pricing__price"><span className="pricing__amount">€89</span><span className="pricing__period">/mo</span></div>
          <ul className="pricing__feats"><li>Everything in Pro</li><li>Unlimited users</li><li>SSO</li><li>Dedicated CSM</li></ul>
          <button className="btn btn--ghost btn--sm" style={{ width: '100%' }}>Contact sales</button>
        </div>
      </div>

      {/* Feature comparison — a Table that scans across plans. */}
      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, margin: '28px 0 10px' }}>Compare plans</h2>
      <table className="tbl" style={{ maxWidth: 720 }}>
        <thead><tr><th>Feature</th><th style={{ textAlign: 'center' }}>Starter</th><th style={{ textAlign: 'center' }}>Pro</th><th style={{ textAlign: 'center' }}>Business</th></tr></thead>
        <tbody>
          {([['Invoices / month', '5', 'Unlimited', 'Unlimited'], ['Team members', '1', '5', 'Unlimited'], ['Custom branding', '—', '✓', '✓'], ['Reports & insights', '—', '✓', '✓'], ['SSO / SAML', '—', '—', '✓'], ['Dedicated CSM', '—', '—', '✓']] as [string, string, string, string][]).map(([f, s, p, b]) => (
            <tr key={f}><td style={{ fontWeight: 500 }}>{f}</td><td style={{ textAlign: 'center', color: s === '—' ? 'var(--k-fg-faint)' : undefined }}>{s}</td><td style={{ textAlign: 'center', color: p === '—' ? 'var(--k-fg-faint)' : undefined }}>{p}</td><td style={{ textAlign: 'center', color: b === '—' ? 'var(--k-fg-faint)' : undefined }}>{b}</td></tr>
          ))}
        </tbody>
      </table>

      {/* FAQ — accordion of common billing questions. */}
      <h2 style={{ fontSize: 'var(--k-type-h3)', fontWeight: 600, margin: '28px 0 10px' }}>Questions</h2>
      <div className="accordion" style={{ maxWidth: 720 }}>
        {([['Can I change plan anytime?', 'Yes — upgrades apply immediately and are prorated; downgrades take effect at the next billing cycle.'], ['Do you offer annual billing?', 'Annual plans save ~17% versus monthly. Switch under Billing → Plan.'], ['What payment methods are accepted?', 'All major cards and SEPA direct debit. Invoicing is available on Business.']] as [string, string][]).map(([q, a], i) => (
          <details key={q} open={i === 0}>
            <summary>{q}<span className="accordion__chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></span></summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
