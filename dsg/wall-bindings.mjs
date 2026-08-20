/**
 * ONE TABLE PER KIT. Adding a kit is adding a table.
 *
 * Two of these render markup the kit does not literally ship, and it is worth
 * saying which and why:
 *
 *   · shadcn/ui is React source over Radix. Its LOOK is Tailwind classes, so
 *     the preview borrows the composition it ships and the package tells you to
 *     run `shadcn add`. Same call the A2UI bindings made, same reason.
 *   · Material Web is custom elements — <md-filled-button> renders nothing
 *     without its JavaScript, and this page loads none. So the preview is
 *     M3-token-styled markup, and the package installs the real components.
 *
 * Everything else here is the kit's own classes, verbatim.
 */
import { esc, list } from './parts.mjs'

const cls = (...c) => c.filter(Boolean).join(' ')
const A = (n, k, tag, c, extra = '') => `<${tag} class="${c}"${extra}>${n.text != null ? esc(n.text) : k}</${tag}>`

/* ── Tailwind, using the semantic names our package adds ─────────────────── */
const TW_BTN = { brand: 'bg-brand text-brand-foreground hover:opacity-90', secondary: 'bg-surface text-ink border border-line',
  ghost: 'text-ink hover:bg-surface', danger: 'bg-red-600 text-white' }
const TW_TONE = { neutral: 'bg-surface text-ink border-line', brand: 'bg-brand/10 text-brand border-brand/25',
  success: 'bg-green-50 text-green-800 border-green-200', warning: 'bg-amber-50 text-amber-900 border-amber-200',
  danger: 'bg-red-50 text-red-800 border-red-200' }
const tailwind = {
  _id: 'Tailwind',
  stack:   (n, k) => `<div class="flex flex-col gap-${n.gap ?? 3}">${k}</div>`,
  row:     (n, k) => `<div class="flex flex-wrap items-center gap-${n.gap ?? 2}${n.between ? ' justify-between' : ''}">${k}</div>`,
  grid:    (n, k) => `<div class="grid gap-3" style="grid-template-columns:repeat(${n.cols ?? 2},minmax(0,1fr))">${k}</div>`,
  panel:   (n, k) => `<div class="rounded-lg border border-line bg-surface p-4">${k}</div>`,
  divider: () => `<hr class="border-line">`,
  heading: (n, k) => A(n, k, `h${n.level ?? 3}`, n.level === 2 ? 'text-xl font-semibold text-ink' : 'text-base font-semibold text-ink'),
  text:    (n, k) => A(n, k, 'p', 'text-sm text-ink'),
  muted:   (n, k) => A(n, k, 'p', 'text-sm text-ink-muted'),
  label:   (n, k) => A(n, k, 'label', 'text-sm font-medium text-ink'),
  button:  (n, k) => A(n, k, 'button', cls('inline-flex min-h-9 items-center rounded-lg px-4 text-sm font-medium', TW_BTN[n.tone ?? 'brand'])),
  input:   (n) => `<input class="min-h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" value="${esc(n.value ?? '')}" placeholder="${esc(n.placeholder ?? '')}">`,
  select:  (n) => `<select class="min-h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">${list(n.options).map((o) => `<option>${esc(o)}</option>`).join('')}</select>`,
  checkbox: (n) => `<label class="inline-flex min-h-6 items-center gap-2 text-sm text-ink"><input type="checkbox" class="size-4 accent-brand"${n.on ? ' checked' : ''}>${esc(n.text ?? '')}</label>`,
  switch:  (n) => `<label class="inline-flex min-h-6 items-center gap-2 text-sm text-ink"><input type="checkbox" role="switch" class="h-5 w-9 appearance-none rounded-full ${n.on ? 'bg-brand' : 'bg-line'}"${n.on ? ' checked' : ''}>${esc(n.text ?? '')}</label>`,
  badge:   (n, k) => A(n, k, 'span', cls('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', TW_TONE[n.tone ?? 'neutral'])),
  alert:   (n, k) => `<div class="${cls('rounded-lg border p-3 text-sm', TW_TONE[n.tone ?? 'neutral'])}">${n.text != null ? esc(n.text) : k}</div>`,
  stat:    (n) => `<div class="rounded-lg border border-line bg-surface p-4"><div class="text-sm text-ink-muted">${esc(n.label)}</div><div class="text-2xl font-semibold text-ink">${esc(n.value)}</div></div>`,
  table:   (n) => `<table class="w-full text-left text-sm"><thead class="border-b border-line text-xs uppercase text-ink-muted"><tr>${list(n.cols).map((c) => `<th class="py-2 pr-3 font-medium">${esc(c)}</th>`).join('')}</tr></thead><tbody>${list(n.rows).map((r) => `<tr class="border-b border-line">${list(r).map((c) => `<td class="py-2 pr-3 text-ink">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
  avatar:  (n) => `<span class="inline-grid size-8 place-items-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">${esc(n.text)}</span>`,
  tabs:    (n) => `<div class="flex gap-4 border-b border-line text-sm">${list(n.items).map((t, i) => `<span class="${i === 0 ? 'border-b-2 border-brand pb-2 font-medium text-ink' : 'pb-2 text-ink-muted'}">${esc(t)}</span>`).join('')}</div>`,
}

/* ── daisyUI ─────────────────────────────────────────────────────────────── */
const DA_BTN = { brand: 'btn-primary', secondary: '', ghost: 'btn-ghost', danger: 'btn-error' }
const DA_TONE = { neutral: 'badge-neutral', brand: 'badge-primary', success: 'badge-success', warning: 'badge-warning', danger: 'badge-error' }
const DA_ALERT = { neutral: '', brand: 'alert-info', success: 'alert-success', warning: 'alert-warning', danger: 'alert-error' }
const daisyui = {
  _id: 'daisyUI',
  stack:   (n, k) => `<div class="flex flex-col gap-${n.gap ?? 3}">${k}</div>`,
  row:     (n, k) => `<div class="flex flex-wrap items-center gap-${n.gap ?? 2}${n.between ? ' justify-between' : ''}">${k}</div>`,
  grid:    (n, k) => `<div class="grid gap-3" style="grid-template-columns:repeat(${n.cols ?? 2},minmax(0,1fr))">${k}</div>`,
  panel:   (n, k) => `<div class="card card-border bg-base-100"><div class="card-body">${k}</div></div>`,
  divider: () => `<div class="divider"></div>`,
  heading: (n, k) => A(n, k, `h${n.level ?? 3}`, n.level === 2 ? 'card-title text-xl' : 'card-title text-base'),
  text:    (n, k) => A(n, k, 'p', 'text-sm'),
  muted:   (n, k) => A(n, k, 'p', 'text-sm opacity-60'),
  label:   (n, k) => A(n, k, 'label', 'label'),
  button:  (n, k) => A(n, k, 'button', cls('btn', DA_BTN[n.tone ?? 'brand'])),
  input:   (n) => `<input class="input w-full" value="${esc(n.value ?? '')}" placeholder="${esc(n.placeholder ?? '')}">`,
  select:  (n) => `<select class="select w-full">${list(n.options).map((o) => `<option>${esc(o)}</option>`).join('')}</select>`,
  checkbox: (n) => `<label class="label"><input type="checkbox" class="checkbox"${n.on ? ' checked' : ''}><span>${esc(n.text ?? '')}</span></label>`,
  switch:  (n) => `<label class="label"><input type="checkbox" class="toggle"${n.on ? ' checked' : ''}><span>${esc(n.text ?? '')}</span></label>`,
  badge:   (n, k) => A(n, k, 'span', cls('badge badge-soft', DA_TONE[n.tone ?? 'neutral'])),
  alert:   (n, k) => `<div role="alert" class="${cls('alert alert-soft', DA_ALERT[n.tone ?? 'neutral'])}"><span>${n.text != null ? esc(n.text) : k}</span></div>`,
  stat:    (n) => `<div class="stats bg-base-100"><div class="stat"><div class="stat-title">${esc(n.label)}</div><div class="stat-value text-2xl">${esc(n.value)}</div></div></div>`,
  table:   (n) => `<div class="overflow-x-auto"><table class="table table-zebra"><thead><tr>${list(n.cols).map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${list(n.rows).map((r) => `<tr>${list(r).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
  avatar:  (n) => `<div class="avatar avatar-placeholder"><div class="bg-primary text-primary-content w-8 rounded-full"><span class="text-xs">${esc(n.text)}</span></div></div>`,
  tabs:    (n) => `<div class="tabs tabs-border">${list(n.items).map((t, i) => `<a class="tab${i === 0 ? ' tab-active' : ''}">${esc(t)}</a>`).join('')}</div>`,
}

/* ── Bootstrap ───────────────────────────────────────────────────────────── */
const BS_BTN = { brand: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-link', danger: 'btn-danger' }
const BS_TONE = { neutral: 'text-bg-secondary', brand: 'text-bg-primary', success: 'text-bg-success', warning: 'text-bg-warning', danger: 'text-bg-danger' }
const BS_ALERT = { neutral: 'alert-secondary', brand: 'alert-primary', success: 'alert-success', warning: 'alert-warning', danger: 'alert-danger' }
const bootstrap = {
  _id: 'Bootstrap',
  stack:   (n, k) => `<div class="d-flex flex-column gap-${Math.min(n.gap ?? 3, 5)}">${k}</div>`,
  row:     (n, k) => `<div class="d-flex flex-wrap align-items-center gap-${Math.min(n.gap ?? 2, 5)}${n.between ? ' justify-content-between' : ''}">${k}</div>`,
  grid:    (n, k) => `<div class="d-grid gap-3" style="grid-template-columns:repeat(${n.cols ?? 2},minmax(0,1fr))">${k}</div>`,
  panel:   (n, k) => `<div class="card"><div class="card-body">${k}</div></div>`,
  divider: () => `<hr>`,
  heading: (n, k) => A(n, k, `h${n.level ?? 3}`, n.level === 2 ? 'h4 mb-0' : 'h6 mb-0'),
  text:    (n, k) => A(n, k, 'p', 'mb-0'),
  muted:   (n, k) => A(n, k, 'p', 'mb-0 text-body-secondary small'),
  label:   (n, k) => A(n, k, 'label', 'form-label mb-1'),
  button:  (n, k) => A(n, k, 'button', cls('btn', BS_BTN[n.tone ?? 'brand'])),
  input:   (n) => `<input class="form-control" value="${esc(n.value ?? '')}" placeholder="${esc(n.placeholder ?? '')}">`,
  select:  (n) => `<select class="form-select">${list(n.options).map((o) => `<option>${esc(o)}</option>`).join('')}</select>`,
  checkbox: (n) => `<div class="form-check"><input class="form-check-input" type="checkbox"${n.on ? ' checked' : ''}><label class="form-check-label">${esc(n.text ?? '')}</label></div>`,
  switch:  (n) => `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch"${n.on ? ' checked' : ''}><label class="form-check-label">${esc(n.text ?? '')}</label></div>`,
  badge:   (n, k) => A(n, k, 'span', cls('badge rounded-pill', BS_TONE[n.tone ?? 'neutral'])),
  alert:   (n, k) => `<div class="${cls('alert mb-0', BS_ALERT[n.tone ?? 'neutral'])}" role="alert">${n.text != null ? esc(n.text) : k}</div>`,
  stat:    (n) => `<div class="card"><div class="card-body"><div class="text-body-secondary small">${esc(n.label)}</div><div class="fs-3 fw-semibold">${esc(n.value)}</div></div></div>`,
  table:   (n) => `<table class="table"><thead><tr>${list(n.cols).map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${list(n.rows).map((r) => `<tr>${list(r).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
  avatar:  (n) => `<span class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white" style="width:2rem;height:2rem;font-size:.75rem;font-weight:600">${esc(n.text)}</span>`,
  tabs:    (n) => `<ul class="nav nav-tabs">${list(n.items).map((t, i) => `<li class="nav-item"><a class="nav-link${i === 0 ? ' active' : ''}">${esc(t)}</a></li>`).join('')}</ul>`,
}

/* ── shadcn/ui — the composition it ships, previewed ─────────────────────── */
const SC_BTN = { brand: 'bg-primary text-primary-foreground hover:bg-primary/90', secondary: 'bg-secondary text-secondary-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground', danger: 'bg-destructive text-white' }
const shadcn = {
  ...tailwind, _id: 'shadcn/ui',
  panel:   (n, k) => `<div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6">${k}</div>`,
  heading: (n, k) => A(n, k, `h${n.level ?? 3}`, n.level === 2 ? 'text-2xl font-semibold tracking-tight' : 'text-base font-semibold'),
  text:    (n, k) => A(n, k, 'p', 'text-sm text-foreground'),
  muted:   (n, k) => A(n, k, 'p', 'text-sm text-muted-foreground'),
  label:   (n, k) => A(n, k, 'label', 'text-sm font-medium leading-none'),
  button:  (n, k) => A(n, k, 'button', cls('inline-flex min-h-9 items-center justify-center rounded-md px-4 text-sm font-medium', SC_BTN[n.tone ?? 'brand'])),
  input:   (n) => `<input class="flex min-h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs" value="${esc(n.value ?? '')}" placeholder="${esc(n.placeholder ?? '')}">`,
  badge:   (n, k) => A(n, k, 'span', cls('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
    n.tone === 'brand' ? 'bg-primary text-primary-foreground border-transparent' : n.tone === 'danger' ? 'bg-destructive text-white border-transparent' : 'bg-secondary text-secondary-foreground border-transparent')),
  stat:    (n) => `<div class="rounded-xl border bg-card p-6"><div class="text-sm text-muted-foreground">${esc(n.label)}</div><div class="text-2xl font-semibold">${esc(n.value)}</div></div>`,
  divider: () => `<hr class="border-border">`,
}

/* ── Material 3 — its tokens, previewed; the package installs the elements ── */
const MD_TONE = { neutral: 'surface-container-highest;color:var(--md-sys-color-on-surface)', brand: 'primary-container;color:var(--md-sys-color-on-primary-container)',
  success: 'tertiary-container;color:var(--md-sys-color-on-tertiary-container)', warning: 'secondary-container;color:var(--md-sys-color-on-secondary-container)',
  danger: 'error-container;color:var(--md-sys-color-on-error-container)' }
const md = (t) => `background:var(--md-sys-color-${MD_TONE[t ?? 'neutral']})`
const material = {
  _id: 'Material 3',
  stack:   (n, k) => `<div style="display:flex;flex-direction:column;gap:${(n.gap ?? 3) * 4}px">${k}</div>`,
  row:     (n, k) => `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:${(n.gap ?? 2) * 4}px${n.between ? ';justify-content:space-between' : ''}">${k}</div>`,
  grid:    (n, k) => `<div style="display:grid;gap:12px;grid-template-columns:repeat(${n.cols ?? 2},minmax(0,1fr))">${k}</div>`,
  panel:   (n, k) => `<div style="background:var(--md-sys-color-surface-container-low);border-radius:var(--md-sys-shape-corner-md);padding:16px">${k}</div>`,
  divider: () => `<hr style="border:0;border-top:1px solid var(--md-sys-color-outline-variant)">`,
  heading: (n, k) => A(n, k, `h${n.level ?? 3}`, '', ` style="margin:0;font-size:${n.level === 2 ? '22px' : '16px'};font-weight:500;color:var(--md-sys-color-on-surface)"`),
  text:    (n, k) => A(n, k, 'p', '', ' style="margin:0;font-size:14px;color:var(--md-sys-color-on-surface)"'),
  muted:   (n, k) => A(n, k, 'p', '', ' style="margin:0;font-size:14px;color:var(--md-sys-color-on-surface-variant)"'),
  label:   (n, k) => A(n, k, 'label', '', ' style="font-size:12px;color:var(--md-sys-color-on-surface-variant)"'),
  button:  (n, k) => A(n, k, 'button', '', ` style="border:0;min-height:40px;padding:0 24px;border-radius:var(--md-sys-shape-corner-full);font-size:14px;font-weight:500;${
    n.tone === 'ghost' ? 'background:transparent;color:var(--md-sys-color-primary)' : n.tone === 'danger' ? 'background:var(--md-sys-color-error);color:var(--md-sys-color-on-error)'
    : n.tone === 'secondary' ? 'background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container)'
    : 'background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary)'}"`),
  input:   (n) => `<input value="${esc(n.value ?? '')}" placeholder="${esc(n.placeholder ?? '')}" style="width:100%;min-height:40px;padding:0 16px;border:1px solid var(--md-sys-color-outline);border-radius:var(--md-sys-shape-corner-xs);background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);font-size:14px">`,
  select:  (n) => `<select style="width:100%;min-height:40px;padding:0 12px;border:1px solid var(--md-sys-color-outline);border-radius:var(--md-sys-shape-corner-xs);background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface)">${list(n.options).map((o) => `<option>${esc(o)}</option>`).join('')}</select>`,
  checkbox: (n) => `<label style="display:inline-flex;min-height:24px;align-items:center;gap:8px;font-size:14px;color:var(--md-sys-color-on-surface)"><input type="checkbox" style="accent-color:var(--md-sys-color-primary);width:18px;height:18px"${n.on ? ' checked' : ''}>${esc(n.text ?? '')}</label>`,
  switch:  (n) => `<label style="display:inline-flex;min-height:24px;align-items:center;gap:8px;font-size:14px;color:var(--md-sys-color-on-surface)"><input type="checkbox" role="switch" style="appearance:none;width:52px;height:32px;border-radius:99px;background:var(--md-sys-color-${n.on ? 'primary' : 'surface-container-highest'})"${n.on ? ' checked' : ''}>${esc(n.text ?? '')}</label>`,
  badge:   (n, k) => A(n, k, 'span', '', ` style="display:inline-flex;align-items:center;padding:4px 12px;border-radius:var(--md-sys-shape-corner-sm);font-size:12px;font-weight:500;${md(n.tone)}"`),
  alert:   (n, k) => `<div style="padding:12px 16px;border-radius:var(--md-sys-shape-corner-md);font-size:14px;${md(n.tone)}">${n.text != null ? esc(n.text) : k}</div>`,
  stat:    (n) => `<div style="background:var(--md-sys-color-surface-container);border-radius:var(--md-sys-shape-corner-md);padding:16px"><div style="font-size:12px;color:var(--md-sys-color-on-surface-variant)">${esc(n.label)}</div><div style="font-size:28px;color:var(--md-sys-color-on-surface)">${esc(n.value)}</div></div>`,
  table:   (n) => `<table style="width:100%;border-collapse:collapse;font-size:14px;color:var(--md-sys-color-on-surface)"><thead><tr>${list(n.cols).map((c) => `<th style="text-align:left;padding:12px 8px;font-size:12px;color:var(--md-sys-color-on-surface-variant);font-weight:500">${esc(c)}</th>`).join('')}</tr></thead><tbody>${list(n.rows).map((r) => `<tr>${list(r).map((c) => `<td style="padding:12px 8px;border-top:1px solid var(--md-sys-color-outline-variant)">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
  avatar:  (n) => `<span style="display:inline-grid;place-items:center;width:40px;height:40px;border-radius:99px;background:var(--md-sys-color-primary-container);color:var(--md-sys-color-on-primary-container);font-size:14px;font-weight:500">${esc(n.text)}</span>`,
  tabs:    (n) => `<div style="display:flex;gap:0;border-bottom:1px solid var(--md-sys-color-outline-variant)">${list(n.items).map((t, i) => `<span style="padding:14px 16px;font-size:14px;font-weight:500;${i === 0 ? 'color:var(--md-sys-color-primary);box-shadow:inset 0 -3px 0 var(--md-sys-color-primary)' : 'color:var(--md-sys-color-on-surface-variant)'}">${esc(t)}</span>`).join('')}</div>`,
}

export const WALL = { tailwind, daisyui, bootstrap, shadcn, material }
