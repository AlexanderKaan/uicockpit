import { Icon } from '../icons/Icon'
import { ChartFrame } from '../stage/views/ChartFrame'
import type { BlockSpec } from './manifests'

/**
 * H3b — the block renderer: BlockSpec (data) → KIT recipes (markup).
 *
 * The deal that makes manifests honest: every renderer below composes
 * EXPORTED kit classes (plus the catalogued ChartFrame presenter) — no
 * showcase-only component CSS. If a block can't be built from the kit, the
 * kit is missing a recipe, and THAT is the bug to fix (gallery first), not
 * something to patch here. Seeds are typed by the BlockSpec union, so a
 * manifest typo fails tsc instead of rendering garbage.
 */
export function renderBlock(spec: BlockSpec, key: number) {
  switch (spec.block) {
    case 'stats':
      return (
        <div className="stat-tile-grid" key={key}>
          {spec.seed.items.map((s) => (
            <div className="stat-tile" key={s.label}>
              <div className="stat-tile__label">{s.label}</div>
              <div className="stat-tile__value">{s.value}</div>
              {s.delta && (
                <div className="stat-tile__foot">
                  <span className={`stat-tile__delta ${s.up ? 'stat-tile__delta--up' : 'stat-tile__delta--down'}`}>{s.delta}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )
    case 'chart':
      return (
        <div className="card" key={key}>
          <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>
          <ChartFrame type={spec.seed.type} labels={spec.seed.labels} series={spec.seed.series} />
        </div>
      )
    case 'list':
      return (
        <div className="card" key={key}>
          {spec.seed.title && <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>}
          <div className="list list--flush">
            {spec.seed.items.map((it) => (
              <button type="button" className="list__item" key={it.title}>
                {it.icon && <span className="list__lead list__lead--icon"><Icon name={it.icon} /></span>}
                <span className="list__body">
                  <span className="list__title">{it.title}</span>
                  {it.sub && <span className="list__sub">{it.sub}</span>}
                </span>
                <span className="list__trail">
                  {it.badge && <span className={`badge badge--${it.badge}`}>{it.badge === 'success' ? 'OK' : '!'}</span>}
                  {it.trail && <span className="list__trail--text">{it.trail}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )
    case 'thread':
      return (
        <div className="thread" key={key}>
          {spec.seed.messages.map((m, i) => (
            <div className={`msg ${m.me ? 'msg--me' : ''}`} key={i}>
              <div className="msg__head">
                <span className="msg__name">{m.name}</span>
                <span className="msg__time">{m.time}</span>
              </div>
              <p className="msg__body">{m.body}</p>
            </div>
          ))}
        </div>
      )
    case 'composer':
      return (
        <div className="toolbar" key={key} style={{ marginTop: 'auto' }}>
          <input className="in" placeholder={spec.seed.placeholder} aria-label="Message" style={{ flex: 1 }} />
          <button type="button" className="btn btn--ghost btn--icon" aria-label="Attach"><Icon name="plus" /></button>
          <button type="button" className="btn btn--primary btn--icon" aria-label="Send"><Icon name="chevR" /></button>
        </div>
      )
    case 'table':
      return (
        <div className="card" key={key}>
          {spec.seed.title && <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>}
          <table className="tbl">
            <thead>
              <tr>{spec.seed.columns.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {spec.seed.rows.map((r, i) => (
                <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'form':
      return (
        <div className="card" key={key}>
          <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>
          {spec.seed.intro && <p style={{ fontSize: 'var(--k-type-small)', color: 'var(--k-fg-muted)', margin: 0 }}>{spec.seed.intro}</p>}
          {spec.seed.fields.map((f) => (
            <label className="lab" key={f.label}>
              <span>{f.label}</span>
              <input className="in" defaultValue={f.value} placeholder={f.placeholder} />
            </label>
          ))}
          <div className="card__foot">
            <button type="button" className="btn btn--ghost">Cancel</button>
            <button type="button" className="btn btn--primary">{spec.seed.submit}</button>
          </div>
        </div>
      )
    case 'pricing':
      return (
        <div className="pricing" key={key}>
          {spec.seed.tiers.map((t) => (
            <div className={`pricing__tier ${t.featured ? 'pricing__tier--featured' : ''}`} key={t.name}>
              {t.featured && <span className="pricing__badge">Popular</span>}
              <div className="pricing__name">{t.name}</div>
              <div className="pricing__price"><span className="pricing__amount">{t.price}</span><span className="pricing__period">{t.period}</span></div>
              <ul className="pricing__feats">
                {t.feats.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <button type="button" className={`btn ${t.featured ? 'btn--primary' : 'btn--outline'} btn--block`}>{t.cta}</button>
            </div>
          ))}
        </div>
      )
    case 'prose':
      return (
        <article className="l-center" key={key}>
          {spec.seed.kicker && <div style={{ fontSize: 'var(--k-type-eyebrow)', fontWeight: 'var(--k-weight-semibold)', color: 'var(--k-primary)', marginBottom: 'var(--k-s-6)' }}>{spec.seed.kicker}</div>}
          <h2 style={{ fontFamily: 'var(--k-font-display)', fontSize: 'var(--k-type-h2)', margin: '0 0 var(--k-s-12)' }}>{spec.seed.title}</h2>
          {spec.seed.paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: 'var(--k-type-body)', lineHeight: 1.65, color: 'var(--k-fg-muted)', margin: '0 0 var(--k-s-12)' }}>{p}</p>
          ))}
        </article>
      )
    case 'dl':
      return (
        <div className="card" key={key}>
          {spec.seed.title && <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>}
          <dl className="dl">
            {spec.seed.pairs.map(([dt, dd]) => (
              <span key={dt} style={{ display: 'contents' }}>
                <dt>{dt}</dt>
                <dd>{dd}</dd>
              </span>
            ))}
          </dl>
        </div>
      )
    case 'chips':
      return (
        <div className="card__row" key={key} role="radiogroup" aria-label={spec.seed.label} style={{ flexWrap: 'wrap' }}>
          {spec.seed.options.map((o, i) => (
            <button type="button" role="radio" aria-checked={i === spec.seed.active} className={`chip ${i === spec.seed.active ? 'chip--on' : ''}`} key={o}>{o}</button>
          ))}
        </div>
      )
    case 'kanban':
      return (
        <div className="kanban" key={key}>
          {spec.seed.columns.map((col) => (
            <div className="kanban__col" key={col.name}>
              <div className="kanban__col-head">{col.name}<span className="kanban__count">{col.cards.length}</span></div>
              {col.cards.map((c) => (
                <div className="kanban__card" key={c.title}>
                  <span className="kanban__card-title">{c.title}</span>
                  {c.tag && <span className="kanban__tag">{c.tag}</span>}
                  <div className="kanban__card-foot">
                    <span className="kanban__stats">
                      {c.key && <span className="kanban__key"><Icon name="file" size={14} /> {c.key}</span>}
                      {c.pts && <span className="kanban__pts">{c.pts}</span>}
                    </span>
                    {c.avatar && <span className="avatar avatar--sm" style={{ width: 22, height: 22, fontSize: 9 }}>{c.avatar}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )
    case 'tree':
      return (
        <div className="card" key={key}>
          <div className="tree" role="tree" aria-label={spec.seed.label ?? 'Navigation'}>
            {spec.seed.groups.map((g) => (
              <div className="tree__group" key={g.name}>
                <div className="tree__row">
                  <span className="tree__chev"><Icon name="chevR" size={13} /></span>
                  <span className="tree__icon"><Icon name="grid" size={13} /></span>
                  {g.name}
                </div>
                <div className="tree__group">
                  {g.items.map((it) => (
                    <div className={`tree__row ${it.on ? 'tree__row--on' : ''}`} key={it.title}>
                      <span className="tree__chev tree__chev--leaf"><Icon name="chevR" size={13} /></span>
                      <span className="tree__icon"><Icon name="file" size={13} /></span>
                      {it.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    case 'timeline':
      return (
        <div className="card" key={key}>
          <ol className="timeline">
            {spec.seed.events.map((e) => (
              <li className={`timeline__item ${e.state ? `timeline__item--${e.state}` : ''}`} key={e.title}>
                <span className="timeline__dot">{e.state === 'current' ? <span className="timeline__pulse" /> : <Icon name="check" />}</span>
                <div className="timeline__body">
                  <div className="timeline__head"><span className="timeline__title">{e.title}</span><span className="timeline__time">{e.time}</span></div>
                  {e.desc && <div className="timeline__desc">{e.desc}</div>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )
    case 'settings':
      return (
        <div className="card" key={key}>
          {spec.seed.title && <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>}
          <div className="list list--settings">
            {spec.seed.rows.map((r) => (
              <div className="list__item" key={r.title}>
                <div className="list__body"><div className="list__title">{r.title}</div><div className="list__sub">{r.sub}</div></div>
                <div className={`toggle ${r.on ? 'toggle--on' : ''}`} role="switch" aria-checked={r.on} aria-label={r.title}><div className="toggle__knob" /></div>
              </div>
            ))}
          </div>
        </div>
      )
    case 'wizard':
      return (
        <div className="card" key={key}>
          <div className="stepper">
            {spec.seed.steps.map((label, i) => (
              <div className={`stepper__step ${i < spec.seed.active ? 'stepper__step--done' : ''} ${i === spec.seed.active ? 'stepper__step--current' : ''}`} key={label}>
                <span className="stepper__dot">{i < spec.seed.active ? <Icon name="check" /> : i + 1}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="wstepper__content">
            <div className="wstepper__title">{spec.seed.title}</div>
            {spec.seed.sub && <div className="wstepper__sub">{spec.seed.sub}</div>}
            <input className="in" placeholder="…" aria-label={spec.seed.title} />
          </div>
          <div className="card__foot">
            <button type="button" className="btn btn--ghost">Back</button>
            <button type="button" className="btn btn--primary">Continue</button>
          </div>
        </div>
      )
    case 'dropzone':
      return (
        <label className="dropzone" key={key}>
          <span className="dropzone__icon"><Icon name="upload" /></span>
          <span className="dropzone__title">{spec.seed.title}</span>
          <span className="dropzone__hint">{spec.seed.hint}</span>
          <input type="file" hidden multiple aria-label={spec.seed.title} />
        </label>
      )
    case 'media':
      return (
        <div className="card" key={key}>
          {spec.seed.title && <div className="card__head"><span className="card__title">{spec.seed.title}</span></div>}
          <div className="card__row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 'var(--k-s-12)' }}>
            {spec.seed.items.map((f, i) => (
              <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--k-s-8)' }}>
                <div className="aspect aspect--1x1">
                  <div className="aspect__fill" style={{ background: f.kind === 'image' ? `var(--k-grad-${(i % 4) + 1})` : 'var(--k-surface-sunken)', display: 'grid', placeItems: 'center', color: f.kind === 'image' ? 'var(--k-primary-fg, #fff)' : 'var(--k-fg-muted)' }}>
                    <Icon name={f.kind === 'image' ? 'grid' : f.kind === 'video' ? 'chart' : 'file'} size={22} />
                  </div>
                </div>
                <div className="card__row" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <span style={{ fontSize: 'var(--k-type-small)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{f.name}</span>
                  {f.badge && <span className={`badge badge--${f.tone ?? 'info'}`} style={{ flex: 'none' }}>{f.badge}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
  }
}
