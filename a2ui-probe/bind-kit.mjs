/** Binding A: our kit (plain HTML + kit classes). Runnable without a framework. */
import { resolve, readPath, FUNCTIONS } from './core.mjs'

const esc = (s) => String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))
const TONE = { done: 'success', started: 'warn', blocked: 'neutral', new: 'info' }

export function render(node, ctx) {
  const r = (v) => resolve(v, ctx.model, ctx.scope, FUNCTIONS)
  const kids = () => node.kids.map((k) => render(k, ctx)).join('\n')

  switch (node.component) {
    /* ── our catalogue ─────────────────────────────────────────────────── */
    case 'TaskList': {
      const items = r(node.items) ?? []
      const rows = items.map((it, i) => {
        const s = { ...ctx, scope: { path: [...(node.items?.path ?? '').replace(/^\//, '').split('/'), String(i)] } }
        const name = resolve(it.name, s.model, s.scope, FUNCTIONS) ?? it.name
        const status = it.status ?? ''
        return `  <li class="tasklist__item">
    <span class="tasklist__name">${it.locked
        ? `<span class="tasklist__name--locked">${esc(name)}</span>`
        : `<a class="tasklist__link" href="${esc(it.href ?? '#')}">${esc(name)}</a>`}${
        it.hint ? `<span class="tasklist__hint">${esc(it.hint)}</span>` : ''}</span>
    <span class="badge tasklist__status badge--${TONE[it.tone] ?? 'neutral'}">${esc(status)}</span>
  </li>`
      })
      return `<ol class="tasklist"${node.label ? ` aria-label="${esc(r(node.label))}"` : ''}>\n${rows.join('\n')}\n</ol>`
    }
    case 'SummaryList': {
      const items = r(node.items) ?? []
      return `<dl class="dl">\n${items.map((it) => `  <dt>${esc(it.label)}</dt>\n  <dd>${esc(it.value)}</dd>`).join('\n')}\n</dl>`
    }
    /* ── the basic catalog, the parts we map ───────────────────────────── */
    case 'Card':   return `<div class="card">\n${kids()}\n</div>`
    case 'Column': return `<div class="l-stack">\n${kids()}\n</div>`
    case 'Row':    return `<div class="l-cluster">\n${kids()}\n</div>`
    case 'Text':   return `<div class="prose"><p>${esc(r(node.text))}</p></div>`
    case 'Button': return `<button class="btn btn--primary" type="button">${esc(r(node.label) ?? node.kids.map((k) => resolve(k.text, ctx.model, ctx.scope, FUNCTIONS)).join(''))}</button>`
    case 'Divider':return `<hr>`
    default:
      // The refusal — visible, in place, with the reason. Never a silent gap.
      return `<div class="alert alert--danger" role="status" data-a2ui-refused="${esc(node.component)}">
  <div class="alert__body"><div class="alert__title">Refused: ${esc(node.component)}</div>
  <div>Not in catalog “public-service”. Nothing was rendered for component id “${esc(node.id)}”.</div></div>
</div>`
  }
}
