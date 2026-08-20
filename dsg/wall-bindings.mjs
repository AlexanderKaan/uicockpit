/**
 * ONE TABLE PER KIT. Adding a kit is adding a table.
 *
 * Two of these render markup the kit does not literally ship, and it is worth
 * saying which and why:
 *
 *   · shadcn/ui is React source over Radix. Its LOOK is Tailwind classes, so
 *     the preview borrows the composition it ships and the package tells you to
 *     run `shadcn add`. Same call the A2UI bindings made, same reason.
 *   · Material Web is custom elements, not classes. The frame loads Google's
 *     real @material/web bundle, so <md-filled-button> below IS their button
 *     running their code — see material-elements.mjs. What Material has no
 *     component for at all is listed in COMPONENT_GAPS (generate.mjs).
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

/* ── shadcn/ui — its OWN class strings, read from its registry ───────────── */
/* Not an approximation of shadcn: the exact strings its components ship, taken
 * from ui.shadcn.com/r/styles/new-york-v4/*.json. The earlier version inherited
 * the Tailwind table and dragged our semantic names (bg-brand, text-ink) into a
 * kit that has none — 82% of the classes were theirs and the rest were mine.
 * A kit we half-write is a kit we cannot claim to ship. */
const SC_BTN_BASE = 'inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none h-9 px-4 py-2'
const SC_BTN = {
  brand: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  danger: 'bg-destructive text-white hover:bg-destructive/90',
}
const SC_BADGE = { neutral: 'bg-secondary text-secondary-foreground', brand: 'bg-primary text-primary-foreground',
  success: 'bg-primary text-primary-foreground', warning: 'bg-secondary text-secondary-foreground',
  danger: 'bg-destructive text-white' }
const shadcn = {
  _id: 'shadcn/ui',
  stack:   (n, k) => `<div class="flex flex-col gap-${n.gap ?? 3}">${k}</div>`,
  row:     (n, k) => `<div class="flex flex-wrap items-center gap-${n.gap ?? 2}${n.between ? ' justify-between' : ''}">${k}</div>`,
  grid:    (n, k) => `<div class="grid gap-3" style="grid-template-columns:repeat(${n.cols ?? 2},minmax(0,1fr))">${k}</div>`,
  panel:   (n, k) => `<div class="flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm"><div class="px-6">${k}</div></div>`,
  divider: () => `<div class="bg-border h-px w-full"></div>`,
  heading: (n, k) => A(n, k, `h${n.level ?? 3}`, n.level === 2 ? 'text-2xl leading-none font-semibold' : 'leading-none font-semibold'),
  text:    (n, k) => A(n, k, 'p', 'text-sm'),
  muted:   (n, k) => A(n, k, 'p', 'text-muted-foreground text-sm'),
  label:   (n, k) => A(n, k, 'label', 'flex items-center gap-2 text-sm leading-none font-medium select-none'),
  button:  (n, k) => A(n, k, 'button', cls(SC_BTN_BASE, SC_BTN[n.tone ?? 'brand'])),
  input:   (n) => `<input class="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none" value="${esc(n.value ?? '')}" placeholder="${esc(n.placeholder ?? '')}">`,
  select:  (n) => `<select class="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none">${list(n.options).map((o) => `<option>${esc(o)}</option>`).join('')}</select>`,
  checkbox: (n) => `<label class="flex items-center gap-2 text-sm leading-none font-medium"><input type="checkbox" class="border-input size-4 shrink-0 rounded-[4px] border shadow-xs accent-primary"${n.on ? ' checked' : ''}>${esc(n.text ?? '')}</label>`,
  switch:  (n) => `<label class="flex items-center gap-2 text-sm leading-none font-medium"><span class="${n.on ? 'bg-primary' : 'bg-input'} inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs"><span class="bg-background pointer-events-none block size-4 rounded-full ring-0${n.on ? ' translate-x-[calc(100%-2px)]' : ''}"></span></span>${esc(n.text ?? '')}</label>`,
  badge:   (n, k) => A(n, k, 'span', cls('inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap', SC_BADGE[n.tone ?? 'neutral'])),
  alert:   (n, k) => `<div class="relative grid w-full items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm ${n.tone === 'danger' ? 'text-destructive bg-card' : 'bg-card text-card-foreground'}">${n.text != null ? esc(n.text) : k}</div>`,
  stat:    (n) => `<div class="flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm"><div class="px-6"><div class="text-muted-foreground text-sm">${esc(n.label)}</div><div class="text-2xl font-semibold tabular-nums">${esc(n.value)}</div></div></div>`,
  table:   (n) => `<table class="w-full caption-bottom text-sm"><thead class="[&_tr]:border-b"><tr class="hover:bg-muted/50 border-b transition-colors">${list(n.cols).map((c) => `<th class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">${esc(c)}</th>`).join('')}</tr></thead><tbody class="[&_tr:last-child]:border-0">${list(n.rows).map((r) => `<tr class="hover:bg-muted/50 border-b transition-colors">${list(r).map((c) => `<td class="p-2 align-middle whitespace-nowrap">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
  avatar:  (n) => `<span class="relative flex size-8 shrink-0 overflow-hidden rounded-full"><span class="bg-muted flex size-full items-center justify-center rounded-full text-xs">${esc(n.text)}</span></span>`,
  tabs:    (n) => `<div class="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">${list(n.items).map((t, i) => `<span class="${i === 0 ? 'bg-background text-foreground shadow-sm ' : ''}inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap">${esc(t)}</span>`).join('')}</div>`,
}

/* ── Material 3 — Google's real custom elements ──────────────────────────── */
/* The parts Material ships no component for are listed once, in generate.mjs,
 * because that list has to travel with the download and not only appear under
 * the preview. */
/* Not M3-flavoured markup: <md-filled-button> and friends, running the code
 * from @material/web, with their own md-typescale classes for the text. The
 * frame loads their bundle; material-elements.mjs proves every tag below is
 * one their package declares AND one the bundle defines.
 *
 * Where a value is set inline it is one of THEIR tokens — a per-instance
 * component token, which is how Material documents theming. The exception is
 * spacing: Material publishes colour and shape tokens and no spacing scale, and
 * ships no layout components, so the gaps between things are ours. That is
 * declared rather than hidden; see gaps() below. */
const MD_BTN = { brand: 'md-filled-button', secondary: 'md-filled-tonal-button', ghost: 'md-text-button', danger: 'md-filled-button' }
const MD_CHIP = { neutral: 'md-assist-chip', brand: 'md-suggestion-chip', success: 'md-assist-chip', warning: 'md-assist-chip', danger: 'md-assist-chip' }
/* their component tokens, the documented way to re-tone one instance */
const MD_CHIP_TOK = {
  success: '--md-assist-chip-label-text-color:var(--md-sys-color-on-tertiary-container);--md-assist-chip-container-shape:var(--md-sys-shape-corner-sm)',
  warning: '--md-assist-chip-label-text-color:var(--md-sys-color-on-secondary-container)',
  danger: '--md-assist-chip-label-text-color:var(--md-sys-color-on-error-container);--md-assist-chip-outline-color:var(--md-sys-color-error)',
}
const MD_TYPE = { 2: 'md-typescale-headline-small', 3: 'md-typescale-title-medium' }
const material = {
  _id: 'Material 3',
  /* layout — Material ships none, so these three are ours and say so */
  stack:   (n, k) => `<div style="display:flex;flex-direction:column;gap:${(n.gap ?? 3) * 4}px">${k}</div>`,
  row:     (n, k) => `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:${(n.gap ?? 2) * 4}px${n.between ? ';justify-content:space-between' : ''}">${k}</div>`,
  grid:    (n, k) => `<div style="display:grid;gap:12px;grid-template-columns:repeat(${n.cols ?? 2},minmax(0,1fr))">${k}</div>`,

  panel:   (n, k) => `<md-outlined-card style="padding:16px">${k}</md-outlined-card>`,
  divider: () => `<md-divider></md-divider>`,
  heading: (n, k) => A(n, k, `h${n.level ?? 3}`, MD_TYPE[n.level ?? 3] ?? MD_TYPE[3], ' style="margin:0"'),
  text:    (n, k) => A(n, k, 'p', 'md-typescale-body-medium', ' style="margin:0"'),
  muted:   (n, k) => A(n, k, 'p', 'md-typescale-body-small', ' style="margin:0;color:var(--md-sys-color-on-surface-variant)"'),
  label:   (n, k) => A(n, k, 'label', 'md-typescale-label-large'),
  button:  (n, k) => {
    const tag = MD_BTN[n.tone ?? 'brand']
    const err = n.tone === 'danger'
      ? ' style="--md-filled-button-container-color:var(--md-sys-color-error);--md-filled-button-label-text-color:var(--md-sys-color-on-error)"' : ''
    return `<${tag}${err}>${n.text != null ? esc(n.text) : k}</${tag}>`
  },
  input:   (n) => `<md-outlined-text-field style="width:100%" label="${esc(n.placeholder ?? '')}" value="${esc(n.value ?? '')}"></md-outlined-text-field>`,
  select:  (n) => `<md-outlined-select style="width:100%">${list(n.options).map((o, i) =>
    `<md-select-option${i === 0 ? ' selected' : ''} value="${esc(o)}"><div slot="headline">${esc(o)}</div></md-select-option>`).join('')}</md-outlined-select>`,
  checkbox: (n) => `<label class="md-typescale-body-medium" style="display:inline-flex;align-items:center;gap:8px"><md-checkbox${n.on ? ' checked' : ''} touch-target="wrapper"></md-checkbox>${esc(n.text ?? '')}</label>`,
  switch:  (n) => `<label class="md-typescale-body-medium" style="display:inline-flex;align-items:center;gap:8px"><md-switch${n.on ? ' selected' : ''}></md-switch>${esc(n.text ?? '')}</label>`,
  badge:   (n, k) => {
    const tag = MD_CHIP[n.tone ?? 'neutral'], tok = MD_CHIP_TOK[n.tone]
    return `<md-chip-set><${tag}${tok ? ` style="${tok}"` : ''} label="${esc(n.text ?? '')}"></${tag}></md-chip-set>`
  },
  /* Material ships no inline alert or banner, so this is their card re-toned
     with their own container token — the closest thing their kit really has. */
  alert:   (n, k) => `<md-filled-card class="md-typescale-body-medium" style="padding:12px 16px;--md-filled-card-container-color:var(--md-sys-color-${
    { danger: 'error-container', warning: 'secondary-container', success: 'tertiary-container' }[n.tone] ?? 'surface-container-high'})">${n.text != null ? esc(n.text) : k}</md-filled-card>`,
  stat:    (n) => `<md-outlined-card style="padding:16px"><div class="md-typescale-label-medium" style="color:var(--md-sys-color-on-surface-variant)">${esc(n.label)}</div><div class="md-typescale-headline-medium">${esc(n.value)}</div></md-outlined-card>`,
  /* Material 3 specifies a data table; @material/web does not ship one. */
  table:   (n) => `<table class="md-typescale-body-medium" style="width:100%;border-collapse:collapse"><thead><tr>${list(n.cols).map((c) =>
    `<th class="md-typescale-label-medium" style="text-align:left;padding:12px 8px;color:var(--md-sys-color-on-surface-variant)">${esc(c)}</th>`).join('')}</tr></thead><tbody>${
    list(n.rows).map((r) => `<tr>${list(r).map((c) => `<td style="padding:12px 8px;border-top:1px solid var(--md-sys-color-outline-variant)">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
  /* nor an avatar */
  avatar:  (n) => `<span class="md-typescale-label-large" style="display:inline-grid;place-items:center;width:40px;height:40px;border-radius:var(--md-sys-shape-corner-full);background:var(--md-sys-color-primary-container);color:var(--md-sys-color-on-primary-container)">${esc(n.text)}</span>`,
  tabs:    (n) => `<md-tabs>${list(n.items).map((t, i) => `<md-primary-tab${i === 0 ? ' active' : ''}>${esc(t)}</md-primary-tab>`).join('')}</md-tabs>`,
}

export const WALL = { tailwind, daisyui, bootstrap, shadcn, material }
