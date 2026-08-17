import type { ReactNode } from 'react'
import { Icon } from '../icons/Icon'
import type { Admitted, Badge as BadgeSpec, Cell, GenNode, IconName, Tone } from './spec'

/**
 * Generative UI — the renderer. One function per admitted type, and every
 * function writes KIT CLASSES ONLY: the same `.card`, `.badge`, `.dl--band`,
 * `.tasklist` the components reference documents and the manifest measured.
 * There is no genui stylesheet for the output — if a type needs a look the kit
 * does not have, the kit gets the recipe first (the house rule: promote to the
 * kit and the gallery, then use it), never a local override. `genui.test.ts`
 * holds this: every class an admitted preset emits must exist in the kit.
 *
 * A refused node renders as a refusal, in place, so the answer shows where the
 * assistant asked for something it may not have.
 */

const toneClass = (t: Tone | undefined, prefix: string) => (t && t !== 'primary' ? `${prefix}--${t}` : t === 'primary' ? `${prefix}--primary` : `${prefix}--neutral`)
/* The activity feed's dot colour is the consumer's to set (the recipe says so),
 * through a status TOKEN — never a literal. */
const TONE_TOKEN: Record<Tone, string> = { neutral: 'var(--k-fg-faint)', primary: 'var(--k-primary)', success: 'var(--k-success)', warn: 'var(--k-warning)', danger: 'var(--k-danger)', info: 'var(--k-info)' }

function BadgeEl({ b }: { b: BadgeSpec }) {
  return (
    <span className={`badge ${toneClass(b.tone, 'badge')}`}>
      {b.dot !== false && <span className="badge__dot" />}
      {b.text}
    </span>
  )
}

function CellEl({ c }: { c: Cell }) {
  if (typeof c === 'string') return <>{c}</>
  if ('badge' in c) return <BadgeEl b={c.badge} />
  return <span className="num">{c.num}</span>
}

/* A media SLOT, not a photograph: the kit's own `.figure` — the frame that
 * holds an image, a static map or an embed and keeps its shape while empty.
 * The sandbox paints no pictures (no external images, no invented façades);
 * the slot renders as the kit's specimen does — the map form with its grid
 * and pin, or the plain field — and the words travel in alt and caption. This
 * used to be an inline SVG drawn here; the house rule put the recipe in the
 * kit first (Sprint P·7), and this file lost the drawing. */
function Media({ alt, map, ratio }: { alt: string; map?: boolean; ratio?: string }) {
  return (
    <figure className={`figure${map ? ' figure--map' : ''}`} style={ratio ? ({ '--figure-ratio': ratio } as React.CSSProperties) : undefined}>
      <div className="figure__media" role="img" aria-label={alt} />
    </figure>
  )
}

function Refusal({ a }: { a: Extract<Admitted, { ok: false }> }) {
  return (
    <div className="alert alert--danger" role="status" data-genui-refused={a.type}>
      <Icon name="info" />
      <div className="alert__body">
        <div className="alert__title">Refused: {a.type}</div>
        <div>{a.issue.message}</div>
        {a.issue.forge && <div><span className="badge badge--danger">{a.issue.forge.verdict}</span></div>}
      </div>
    </div>
  )
}

export function GenTree({ tree }: { tree: Admitted[] }) {
  return <>{tree.map((a) => <GenNodeEl key={a.path} a={a} />)}</>
}

function Children({ list }: { list?: Admitted[] }) {
  if (!list?.length) return null
  return <>{list.map((a) => <GenNodeEl key={a.path} a={a} />)}</>
}

export function GenNodeEl({ a }: { a: Admitted }) {
  if (!a.ok) return <Refusal a={a} />
  const n = a.node
  switch (n.type) {
    case 'heading':
      /* Level 2 = the answer's own head (page-head: eyebrow · title · sub).
       * Level 3 = a heading INSIDE the answer, set in the prose's h3 — lighter,
       * the way a section heading sits inside flowing content. */
      if (n.level === 3) {
        return (
          <div className="prose">
            {n.eyebrow && <div className="prose__kicker">{n.eyebrow}</div>}
            <h3>{n.text}</h3>
            {n.sub && <p>{n.sub}</p>}
          </div>
        )
      }
      return (
        <div className="page-head">
          <div className="page-head__titles">
            {n.eyebrow && <span className="eyebrow">{n.eyebrow}</span>}
            <h2 className="page-head__title">{n.text}</h2>
            {n.sub && <p className="page-head__sub">{n.sub}</p>}
          </div>
        </div>
      )
    case 'text':
      // Flowing text takes the kit's prose typography — the same recipe the
      // "without" column is set in, so the two columns differ in STRUCTURE only.
      // A model writes a little markdown into text; the two marks that matter
      // (**strong**, *em*) render, and a blank line breaks a paragraph.
      return <div className="prose">{paragraphs(n.text).map((para, i) => <p key={i}>{inline(para)}</p>)}</div>
    case 'link':
      // A standalone link is prose too — the prose recipe owns link colour and
      // underline; an external one says so for a screen reader.
      return <div className="prose"><p><a href={n.href} {...(n.external ? { target: '_blank', rel: 'noreferrer' } : {})}>{n.text}{n.external ? ' ↗' : ' →'}</a></p></div>
    case 'stack':
      return <div className="l-stack"><Children list={a.children} /></div>
    case 'cluster':
      return <div className="l-cluster"><Children list={a.children} /></div>
    case 'grid':
      return <div className="l-grid" style={n.min ? ({ '--l-min': n.min } as React.CSSProperties) : undefined}><Children list={a.children} /></div>
    case 'strip':
      // the carousel's scroll-snap form: each child is a slide; the platform scrolls
      return (
        <div className="carousel carousel--strip" aria-label={n.label} style={n.slide ? ({ '--strip-slide': n.slide } as React.CSSProperties) : undefined}>
          <div className="carousel__viewport">
            <div className="carousel__track">
              {(a.children ?? []).map((c) => <div key={c.path} className="carousel__slide"><GenNodeEl a={c} /></div>)}
            </div>
          </div>
        </div>
      )
    case 'figure':
      return (
        <figure className={`figure${n.map ? ' figure--map' : ''}`} style={n.ratio ? ({ '--figure-ratio': n.ratio } as React.CSSProperties) : undefined}>
          <div className="figure__media" role="img" aria-label={n.alt} />
          {(n.caption || n.action) && (
            <figcaption className="figure__caption">
              {n.caption && <span>{n.caption}</span>}
              {n.action && <a href={n.action.href}>{n.action.text}</a>}
            </figcaption>
          )}
        </figure>
      )
    case 'card':
      return (
        <div className={`card${n.well ? ' card--well' : ''}`}>
          {n.media && <div className="card__media"><Media alt={n.media.alt} map={n.media.map} /></div>}
          {(n.badge || n.title || n.desc) && (
            <div className="card__head">
              {n.badge && <div><BadgeEl b={n.badge} /></div>}
              {n.title && <div className="card__title">{n.title}</div>}
              {n.desc && <p className="card__desc">{n.desc}</p>}
            </div>
          )}
          {a.children?.length ? <div className="card__col"><Children list={a.children} /></div> : null}
          {a.actions?.length ? <div className="card__foot"><div className="card__row card__row--spread"><Children list={a.actions} /></div></div> : null}
        </div>
      )
    case 'button': {
      const cls = `btn${n.variant ? ` btn--${n.variant}` : ' btn--primary'}${n.size === 'sm' ? ' btn--sm' : ''}`
      const inner = <>{n.icon && <Icon name={n.icon} />}{n.text}</>
      return n.href ? <a className={cls} href={n.href}>{inner}</a> : <button className={cls} type="button">{inner}</button>
    }
    case 'badge':
      return <BadgeEl b={n} />
    case 'metric':
      return (
        <div className="metric">
          <span className="metric__label">{n.label}</span>
          {n.icon && <span className="metric__icon"><Icon name={n.icon} /></span>}
          <span className="metric__value num">{n.value}</span>
          {n.sub && <span className="metric__sub">{n.sub}</span>}
        </div>
      )
    case 'metrics':
      // the band scrolls when it must — a scrollable region is reachable by keyboard (WCAG 2.1.1)
      return (
        <dl className="dl dl--band" tabIndex={0} aria-label={`${n.items.map((it) => it.label).join(', ')} — scrollable`}>
          {n.items.map((it, i) => (
            <div key={i}>
              <dt>{it.label}</dt>
              <dd>{it.value}{it.sub && <span className="metric__sub">{it.sub}</span>}</dd>
            </div>
          ))}
        </dl>
      )
    case 'facts':
      return (
        <dl className="dl">
          {n.items.map((it, i) => (
            <FactRow key={i} label={it.label} value={it.value} href={it.href} badge={it.badge} />
          ))}
        </dl>
      )
    case 'list':
      return (
        <div className="list">
          {n.section && <div className="list__section">{n.section}</div>}
          {n.items.map((it, i) => {
            const Row = it.href ? 'a' : 'div'
            return (
              <Row key={i} className="list__item" {...(it.href ? { href: it.href } : {})}>
                {(it.icon || it.initials) && (
                  <span className={`list__lead ${it.icon ? 'list__lead--icon' : 'list__lead--avatar'}`}>{it.icon ? <Icon name={it.icon} /> : it.initials}</span>
                )}
                <div className="list__body">
                  <div className="list__title">{it.title}</div>
                  {it.sub && <div className="list__sub">{it.sub}</div>}
                </div>
                {it.trail !== undefined && (
                  typeof it.trail === 'string'
                    ? <span className="list__trail list__trail--text">{it.trail}</span>
                    : <span className="list__trail"><BadgeEl b={it.trail.badge} /></span>
                )}
                {it.href && !it.trail && <span className="list__trail"><Icon name="chevR" /></span>}
              </Row>
            )
          })}
        </div>
      )
    case 'table':
      return (
        <table className="table">
          {n.caption && <caption>{n.caption}</caption>}
          <thead><tr>{n.columns.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr></thead>
          <tbody>
            {n.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}><CellEl c={c} /></td>)}</tr>)}
          </tbody>
        </table>
      )
    case 'alert':
      return (
        <div className={`alert alert--${n.tone}`} role="status">
          <Icon name={n.tone === 'success' ? 'check' : n.tone === 'danger' || n.tone === 'warning' ? 'bell' : 'info'} />
          <div className="alert__body">
            {n.title && <div className="alert__title">{n.title}</div>}
            <div>{n.text}</div>
          </div>
        </div>
      )
    case 'banner':
      return (
        <div className={`banner${n.warn ? ' banner--warn' : ''}`} role="status">
          <Icon name="info" />
          <div className="banner__body">
            {n.strong && <strong>{n.strong} </strong>}
            {n.text}
            {n.link && <> <a className="banner__link" href={n.link.href ?? '#'}>{n.link.text}</a></>}
          </div>
        </div>
      )
    case 'warning':
      return (
        <div className="warningtext">
          <span className="warningtext__icon" aria-hidden="true">!</span>
          <strong className="warningtext__text"><span className="sr-only">Warning: </span>{n.text}</strong>
        </div>
      )
    case 'steps':
      return (
        <ol className="processlist">
          {n.items.map((it, i) => (
            <li key={i} className="processlist__step">
              <h3 className="processlist__title">{it.title}</h3>
              {it.body && <p className="processlist__body">{it.body}</p>}
            </li>
          ))}
        </ol>
      )
    case 'tasks':
      return (
        <ol className="tasklist">
          {n.items.map((it, i) => (
            <li key={i} className="tasklist__item">
              <span className="tasklist__name">
                {it.locked ? <span className="tasklist__name--locked">{it.name}</span> : <a className="tasklist__link" href={it.href ?? '#'}>{it.name}</a>}
                {it.hint && <span className="tasklist__hint">{it.hint}</span>}
              </span>
              <span className={`badge tasklist__status ${toneClass(it.status.tone, 'badge')}`}>{it.status.text}</span>
            </li>
          ))}
        </ol>
      )
    case 'progress': {
      const max = n.max ?? 100
      const pct = Math.max(0, Math.min(100, Math.round((n.value / max) * 100)))
      return (
        <div className={`usage${n.warn ? ' usage--warn' : ''}`}>
          <div className="usage__head">
            <span className="usage__title">{n.label}</span>
            <span className="usage__pct">{pct}%</span>
          </div>
          <div className="usage__bar" role="meter" aria-valuenow={n.value} aria-valuemin={0} aria-valuemax={max} aria-label={n.label} aria-valuetext={`${n.value} of ${max}${n.unit ? ` ${n.unit}` : ''}`}>
            <div className="usage__fill" style={{ width: `${pct}%` }} />
          </div>
          {n.hint && <div className="usage__foot"><span className="usage__hint">{n.hint}</span></div>}
        </div>
      )
    }
    case 'stepper':
      return (
        <div className="stepper" role="list" aria-label={n.label ?? `Step ${n.current + 1} of ${n.steps.length}`}>
          {n.steps.map((s, i) => (
            <div key={i} className={`stepper__step${i < n.current ? ' stepper__step--done' : i === n.current ? ' stepper__step--current' : ''}`} role="listitem" {...(i === n.current ? { 'aria-current': 'step' as const } : {})}>
              <span className="stepper__dot">{i < n.current ? <Icon name="check" size={11} /> : i + 1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )
    case 'accordion':
      return (
        <div className="accordion">
          {n.items.map((it, i) => (
            <details key={i} open={n.open === i}>
              <summary>{it.summary}<span className="accordion__chevron"><Icon name="chevD" /></span></summary>
              <p>{it.body}</p>
            </details>
          ))}
        </div>
      )
    case 'tabs':
      return (
        <div className="tabs" role="tablist" aria-label={n.label ?? 'Sections'}>
          {n.items.map((t, i) => (
            <button key={i} className={`tab${i === (n.selected ?? 0) ? ' tab--on' : ''}`} type="button" role="tab" aria-selected={i === (n.selected ?? 0)}><span>{t}</span></button>
          ))}
        </div>
      )
    case 'activity':
      return (
        <ul className="activity">
          {n.items.map((it, i) => (
            <li key={i} className="activity__item">
              <span className="activity__dot" style={{ background: TONE_TOKEN[it.tone ?? 'neutral'] }} aria-hidden="true" />
              <span>{it.text}{it.meta && <> <span className="activity__meta">{it.meta}</span></>}</span>
              {it.time && <time className="activity__meta">{it.time}</time>}
            </li>
          ))}
        </ul>
      )
    case 'requirements':
      return (
        <ul className="requirements">
          {n.items.map((it, i) => (
            <li key={i} className="requirements__item">
              <span className="requirements__mark" aria-hidden="true">{it.met ? <Icon name="check" size={11} /> : null}</span>
              {it.text}
            </li>
          ))}
        </ul>
      )
    case 'choice':
      return (
        <div className="radio-cards" role="radiogroup" aria-label={n.label}>
          {n.options.map((o, i) => (
            <label key={i} className={`radio-card${i === n.selected ? ' radio-card--on' : ''}`}>
              {/* the control is the platform's radio, as the kit's own specimen writes it */}
              <span className="radio"><input type="radio" name={`genui-${a.path.replace(/[^a-z0-9]+/gi, '-')}`} checked={i === n.selected} readOnly /></span>
              <span className="radio-card__body">
                <span className="radio-card__title">{o.title}</span>
                {o.desc && <span className="radio-card__desc">{o.desc}</span>}
              </span>
              {o.meta && <span className="radio-card__meta">{o.meta}</span>}
            </label>
          ))}
        </div>
      )
    case 'input':
      return (
        <div className="field">
          <span className="field__label">{n.label}{n.required && <span className="field__req">(required)</span>}</span>
          {n.hint && <span className="field__hint">{n.hint}</span>}
          <input className="in" type={n.kind ?? 'text'} placeholder={n.placeholder} aria-label={n.label} readOnly />
        </div>
      )
    case 'divider':
      return <hr />
  }
  return null
}

/* The two inline marks a model reaches for — nothing else: no headings, no
 * lists, no links inside text (a link is a `link` node, a list a `list`). */
const paragraphs = (t: string) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
function inline(t: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|(?<![\w*])\*([^*\n]+)\*(?![\w*])|(?<![\w])_([^_\n]+)_(?![\w])/g
  let last = 0, m: RegExpExecArray | null, k = 0
  while ((m = re.exec(t))) {
    if (m.index > last) out.push(t.slice(last, m.index))
    if (m[1] !== undefined) out.push(<strong key={k++}>{m[1]}</strong>)
    else out.push(<em key={k++}>{m[2] ?? m[3]}</em>)
    last = m.index + m[0].length
  }
  if (last < t.length) out.push(t.slice(last))
  return out
}

function FactRow({ label, value, href, badge }: { label: string; value: string; href?: string; badge?: BadgeSpec }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{badge ? <BadgeEl b={badge} /> : href ? <a href={href}>{value}</a> : value}</dd>
    </>
  )
}

export type { GenNode, ReactNode, IconName }
