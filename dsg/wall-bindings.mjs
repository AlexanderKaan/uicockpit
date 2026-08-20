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
import { esc, list, PHOTO } from './parts.mjs'

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
  /* the semantic names our package ADDS — the same ones the manifest tells you
     to reference, shown doing their job */
  navbar:  (n, k) => `<header class="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-surface px-4 py-3">
    <span class="font-semibold text-ink">${esc(n.brand)}</span>
    <nav class="flex flex-wrap gap-4 text-sm text-ink-muted">${list(n.items).map((t) => `<a href="#" class="hover:text-ink">${esc(t)}</a>`).join('')}</nav>
    <div class="ml-auto flex items-center gap-2">${k}</div></header>`,
  mediacard: (n) => `<article class="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
    <div class="flex aspect-video items-center justify-center bg-page text-ink-muted">${PHOTO}</div>
    <div class="flex flex-col gap-2 p-4"><h3 class="text-base font-semibold text-ink">${esc(n.title)}</h3>
    <p class="text-sm text-ink-muted">${esc(n.text)}</p>
    <a href="#" class="text-sm font-medium text-brand">${esc(n.action ?? 'Read on')}</a></div></article>`,
  footer:  (n) => `<footer class="border-t border-line bg-surface px-4 py-6">
    <div class="grid gap-6" style="grid-template-columns:repeat(${list(n.groups).length || 1},minmax(0,1fr))">${
      list(n.groups).map((g) => `<div class="flex flex-col gap-2"><p class="text-xs font-semibold text-ink">${esc(g.title)}</p>${
        list(g.items).map((t) => `<a href="#" class="text-sm text-ink-muted hover:text-ink">${esc(t)}</a>`).join('')}</div>`).join('')}</div>
    <p class="mt-6 text-sm text-ink-muted">${esc(n.note)}</p></footer>`,
  elevation: (n) => `<div class="flex flex-wrap items-center gap-4">${list(n.levels).map((lv) =>
    `<div class="flex h-16 w-24 items-center justify-center rounded-lg bg-surface text-xs text-ink-muted shadow-${lv}">${esc(lv)}</div>`).join('')}</div>`,
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
  /* daisyUI ships BOTH of these as real components: .navbar with its three
     regions, and .footer with .footer-title. Nothing here is composed by hand. */
  navbar:  (n, k) => `<div class="navbar bg-base-200 border-b border-base-300">
    <div class="navbar-start"><span class="btn btn-ghost text-lg">${esc(n.brand)}</span>
    <ul class="menu menu-horizontal px-1">${list(n.items).map((t) => `<li><a>${esc(t)}</a></li>`).join('')}</ul></div>
    <div class="navbar-end gap-2">${k}</div></div>`,
  mediacard: (n) => `<div class="card bg-base-100 border border-base-300">
    <figure class="bg-base-200 text-base-content" style="aspect-ratio:16/9">${PHOTO}</figure>
    <div class="card-body"><h3 class="card-title text-base">${esc(n.title)}</h3><p>${esc(n.text)}</p>
    <div class="card-actions"><a class="link link-primary">${esc(n.action ?? 'Read on')}</a></div></div></div>`,
  footer:  (n) => `<footer class="footer bg-base-200 text-base-content p-8">${
    list(n.groups).map((g) => `<nav><h6 class="footer-title">${esc(g.title)}</h6>${
      list(g.items).map((t) => `<a class="link link-hover">${esc(t)}</a>`).join('')}</nav>`).join('')}
    </footer><footer class="footer footer-center bg-base-200 text-base-content px-8 pb-6"><aside><p>${esc(n.note)}</p></aside></footer>`,
  elevation: (n) => `<div class="flex flex-wrap items-center gap-4">${list(n.levels).map((lv) =>
    `<div class="card bg-base-100 shadow-${lv} h-16 w-24"><div class="card-body items-center justify-center p-0 text-xs opacity-60">${esc(lv)}</div></div>`).join('')}</div>`,
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
  /* Bootstrap ships .navbar and the whole .card-img-top anatomy. It ships no
     footer component at all, so that one is its own utilities on plain markup —
     and the manifest says so rather than implying a component exists. */
  navbar:  (n, k) => `<nav class="navbar navbar-expand bg-body-tertiary border-bottom px-3">
    <span class="navbar-brand">${esc(n.brand)}</span>
    <ul class="navbar-nav me-auto">${list(n.items).map((t) => `<li class="nav-item"><a class="nav-link" href="#">${esc(t)}</a></li>`).join('')}</ul>
    <div class="d-flex gap-2">${k}</div></nav>`,
  mediacard: (n) => `<div class="card h-100"><div class="card-img-top d-flex align-items-center justify-content-center bg-body-secondary" style="aspect-ratio:16/9">${PHOTO}</div>
    <div class="card-body"><h3 class="card-title h6">${esc(n.title)}</h3><p class="card-text">${esc(n.text)}</p>
    <a href="#" class="card-link">${esc(n.action ?? 'Read on')}</a></div></div>`,
  footer:  (n) => `<footer class="border-top bg-body-tertiary p-4">
    <div class="row">${list(n.groups).map((g) => `<div class="col"><h6 class="text-body-emphasis">${esc(g.title)}</h6>
      <ul class="nav flex-column">${list(g.items).map((t) => `<li class="nav-item"><a href="#" class="nav-link px-0">${esc(t)}</a></li>`).join('')}</ul></div>`).join('')}</div>
    <p class="text-body-secondary mb-0 mt-3">${esc(n.note)}</p></footer>`,
  elevation: (n) => `<div class="d-flex flex-wrap align-items-center gap-3">${list(n.levels).map((lv, i) =>
    `<div class="card ${['shadow-sm', 'shadow', 'shadow-lg'][i] ?? 'shadow'} d-flex align-items-center justify-content-center small text-body-secondary" style="width:6rem;height:4rem">${esc(lv)}</div>`).join('')}</div>`,
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
  /* shadcn ships a navigation-menu and the full card anatomy — header, title,
     description, content, footer — so the card is built from those rather than
     from a div with a border. It ships no footer, which is its own utilities. */
  /* shadcn's navigation-menu string carries `group/navigation-menu` and
     `group`, which are Tailwind MARKERS: they emit no rule of their own and
     exist only for group-hover: variants this specimen does not use. Keeping
     them would be two class names no stylesheet defines. */
  navbar:  (n, k) => `<header class="bg-background flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-4 py-3">
    <span class="text-sm font-semibold">${esc(n.brand)}</span>
    <nav class="relative flex max-w-max flex-1 items-center justify-center">
    <ul class="flex flex-1 list-none items-center justify-center gap-1">${
      list(n.items).map((t) => `<li class="relative"><a href="#" class="hover:bg-accent hover:text-accent-foreground flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none">${esc(t)}</a></li>`).join('')}</ul></nav>
    <div class="ml-auto flex items-center gap-2">${k}</div></header>`,
  mediacard: (n) => `<div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
    <div class="text-muted-foreground bg-muted mx-6 flex items-center justify-center rounded-lg" style="aspect-ratio:16/9">${PHOTO}</div>
    <div class="grid auto-rows-min items-start gap-2 px-6"><div class="leading-none font-semibold">${esc(n.title)}</div>
    <div class="text-muted-foreground text-sm">${esc(n.text)}</div></div>
    <div class="flex items-center px-6"><a href="#" class="text-primary text-sm font-medium">${esc(n.action ?? 'Read on')}</a></div></div>`,
  footer:  (n) => `<footer class="bg-background border-t px-4 py-6">
    <div class="grid gap-6" style="grid-template-columns:repeat(${list(n.groups).length || 1},minmax(0,1fr))">${
      list(n.groups).map((g) => `<div class="flex flex-col gap-2"><div class="text-xs font-semibold">${esc(g.title)}</div>${
        list(g.items).map((t) => `<a href="#" class="text-muted-foreground text-sm">${esc(t)}</a>`).join('')}</div>`).join('')}</div>
    <p class="text-muted-foreground mt-6 text-sm">${esc(n.note)}</p></footer>`,
  elevation: (n) => `<div class="flex flex-wrap items-center gap-4">${list(n.levels).map((lv, i) =>
    `<div class="bg-card text-muted-foreground flex h-16 w-24 items-center justify-center rounded-xl border text-xs ${['shadow-xs', 'shadow-sm', 'shadow-lg'][i] ?? 'shadow-sm'}">${esc(lv)}</div>`).join('')}</div>`,
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
  /* Material ships a navigation bar as a custom element. It ships no footer
     and no media card at all — M3 specifies neither — so those two are its own
     tokens on plain markup, and the manifest names both. */
  navbar:  (n, k) => `<header class="md-typescale-title-medium" style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 24px;padding:12px 16px;background:var(--md-sys-color-surface-container);color:var(--md-sys-color-on-surface)">
    <span>${esc(n.brand)}</span>
    <nav class="md-typescale-label-large" style="display:flex;flex-wrap:wrap;gap:16px;color:var(--md-sys-color-on-surface-variant)">${
      list(n.items).map((t) => `<a href="#" style="color:inherit;text-decoration:none">${esc(t)}</a>`).join('')}</nav>
    <span style="margin-left:auto;display:flex;gap:8px">${k}</span></header>`,
  mediacard: (n) => `<md-outlined-card style="display:flex;flex-direction:column;overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:center;aspect-ratio:16/9;background:var(--md-sys-color-surface-container-high);color:var(--md-sys-color-on-surface-variant)">${PHOTO}</div>
    <div style="display:flex;flex-direction:column;gap:8px;padding:16px">
      <h3 class="md-typescale-title-medium" style="margin:0">${esc(n.title)}</h3>
      <p class="md-typescale-body-medium" style="margin:0;color:var(--md-sys-color-on-surface-variant)">${esc(n.text)}</p>
      <md-text-button>${esc(n.action ?? 'Read on')}</md-text-button></div></md-outlined-card>`,
  footer:  (n) => `<footer style="padding:24px 16px;background:var(--md-sys-color-surface-container);color:var(--md-sys-color-on-surface)">
    <div style="display:grid;gap:24px;grid-template-columns:repeat(${list(n.groups).length || 1},minmax(0,1fr))">${
      list(n.groups).map((g) => `<div style="display:flex;flex-direction:column;gap:8px">
        <p class="md-typescale-label-large" style="margin:0">${esc(g.title)}</p>${
        list(g.items).map((t) => `<a href="#" class="md-typescale-body-medium" style="color:var(--md-sys-color-on-surface-variant);text-decoration:none">${esc(t)}</a>`).join('')}</div>`).join('')}</div>
    <p class="md-typescale-body-small" style="margin:24px 0 0;color:var(--md-sys-color-on-surface-variant)">${esc(n.note)}</p></footer>`,
  /* M3 has an elevation model; @material/web ships md-elevation as an element
     and no level tokens, so the specimen is their element at its own levels. */
  elevation: (n) => `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:16px">${list(n.levels).map((lv, i) =>
    `<div style="position:relative;width:96px;height:64px;display:flex;align-items:center;justify-content:center;border-radius:var(--md-sys-shape-corner-md);background:var(--md-sys-color-surface-container-low);color:var(--md-sys-color-on-surface-variant);font-size:12px"><md-elevation style="--md-elevation-level:${i + 1}"></md-elevation>${esc(lv)}</div>`).join('')}</div>`,
  tabs:    (n) => `<md-tabs>${list(n.items).map((t, i) => `<md-primary-tab${i === 0 ? ' active' : ''}>${esc(t)}</md-primary-tab>`).join('')}</md-tabs>`,
}

/* ── Radix Themes — its own .rt-* classes ────────────────────────────────── */
/* Radix ships its components as React, but their LOOK is plain classes in
 * components.css: .rt-Button, .rt-TextFieldRoot, .rt-TableRoot. A real Radix
 * button is a stack of them — the reset, the base, the size, the variant, the
 * component — so that is what is written here, in that order.
 *
 * Tone is `data-accent-color`, which is how Radix re-tones one element: it
 * remaps the whole twelve-step accent scale for that subtree. Not a colour of
 * ours anywhere. */
/* Which accent a tone wears is NOT ours to decide. It used to be grass, amber
 * and red because I typed those; now each is matched from the colour you chose
 * to the nearest accent Radix publishes, and the element carries a data-tone
 * hook so a running page can re-tone it without re-rendering the markup. */
let RX_TONE = { neutral: 'gray' }
export const useRadixTones = (map) => { RX_TONE = { neutral: 'gray', ...map } }
const rxAccent = (tone) => {
  const t = tone ?? 'neutral'
  const accent = RX_TONE[t]
  return `${accent ? ` data-accent-color="${accent}"` : ''}${t === 'neutral' || t === 'brand' ? '' : ` data-tone="${t}"`}`
}
const RX_BTN = { brand: 'solid', secondary: 'soft', ghost: 'ghost', danger: 'solid' }
const radix = {
  _id: 'Radix Themes',
  stack:   (n, k) => `<div class="rt-Flex" style="display:flex;flex-direction:column;gap:var(--space-${Math.min(9, n.gap ?? 3)})">${k}</div>`,
  row:     (n, k) => `<div class="rt-Flex" style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--space-${Math.min(9, n.gap ?? 2)})${n.between ? ';justify-content:space-between' : ''}">${k}</div>`,
  grid:    (n, k) => `<div class="rt-Grid" style="display:grid;gap:var(--space-3);grid-template-columns:repeat(${n.cols ?? 2},minmax(0,1fr))">${k}</div>`,
  panel:   (n, k) => `<div class="rt-reset rt-BaseCard rt-Card rt-r-size-2 rt-variant-surface">${k}</div>`,
  divider: () => `<hr class="rt-reset rt-Separator rt-r-size-4">`,
  heading: (n, k) => A(n, k, `h${n.level ?? 3}`, `rt-Heading rt-r-size-${n.level === 2 ? 6 : 4}`),
  text:    (n, k) => A(n, k, 'p', 'rt-Text rt-r-size-2'),
  muted:   (n, k) => A(n, k, 'p', 'rt-Text rt-r-size-2', ' data-accent-color="gray"'),
  label:   (n, k) => A(n, k, 'label', 'rt-Text rt-r-size-2 rt-Strong'),
  button:  (n, k) => A(n, k, 'button', `rt-reset rt-BaseButton rt-r-size-2 rt-variant-${RX_BTN[n.tone ?? 'brand']} rt-Button`, rxAccent(n.tone === 'danger' ? 'danger' : 'brand')),
  input:   (n) => `<div class="rt-TextFieldRoot rt-r-size-2 rt-variant-surface"><input class="rt-reset rt-TextFieldInput" value="${esc(n.value ?? '')}" placeholder="${esc(n.placeholder ?? '')}"></div>`,
  select:  (n) => `<select class="rt-reset rt-SelectTrigger rt-r-size-2 rt-variant-surface" style="width:100%">${list(n.options).map((o) => `<option>${esc(o)}</option>`).join('')}</select>`,
  /* Radix's checkbox is a button with an indicator inside, not an <input>:
     rt-reset strips the native appearance, so an input renders as an empty box
     that never fills in. Their markup, their states. */
  checkbox: (n) => `<label class="rt-Text rt-r-size-2" style="display:inline-flex;align-items:center;gap:var(--space-2)"><button class="rt-reset rt-BaseCheckboxRoot rt-CheckboxRoot rt-r-size-2 rt-variant-${n.on ? 'solid' : 'surface'}" role="checkbox" aria-checked="${!!n.on}"${n.on ? ' data-state="checked"' : ''}>${n.on ? '<svg class="rt-BaseCheckboxIndicator" viewBox="0 0 9 9" fill="currentColor"><path d="M0,4 L3,7 L9,1 L8,0 L3,5 L1,3 Z"/></svg>' : ''}</button>${esc(n.text ?? '')}</label>`,
  switch:  (n) => `<label class="rt-Text rt-r-size-2" style="display:inline-flex;align-items:center;gap:var(--space-2)"><button class="rt-reset rt-SwitchRoot rt-r-size-2 rt-variant-surface"${n.on ? ' data-state="checked"' : ''}><span class="rt-SwitchThumb"></span></button>${esc(n.text ?? '')}</label>`,
  badge:   (n, k) => A(n, k, 'span', 'rt-reset rt-Badge rt-r-size-1 rt-variant-soft', rxAccent(n.tone)),
  alert:   (n, k) => `<div class="rt-reset rt-BaseCard rt-CalloutRoot rt-r-size-2 rt-variant-soft"${rxAccent(n.tone)}><p class="rt-Text rt-r-size-2">${n.text != null ? esc(n.text) : k}</p></div>`,
  stat:    (n) => `<div class="rt-reset rt-BaseCard rt-Card rt-r-size-2 rt-variant-surface"><p class="rt-Text rt-r-size-1" data-accent-color="gray">${esc(n.label)}</p><p class="rt-Heading rt-r-size-6">${esc(n.value)}</p></div>`,
  table:   (n) => `<div class="rt-TableRoot rt-r-size-2 rt-variant-surface"><table class="rt-TableRootTable"><thead class="rt-TableHeader"><tr class="rt-TableRow">${
    list(n.cols).map((c) => `<th class="rt-TableCell rt-TableColumnHeaderCell">${esc(c)}</th>`).join('')}</tr></thead><tbody class="rt-TableBody">${
    list(n.rows).map((r) => `<tr class="rt-TableRow">${list(r).map((c) => `<td class="rt-TableCell">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
  avatar:  (n) => `<span class="rt-reset rt-AvatarRoot rt-r-size-2 rt-variant-soft"><span class="rt-AvatarFallback">${esc(n.text)}</span></span>`,
  /* Radix writes each tab label TWICE: the visible copy is absolutely
     positioned and a hidden bold copy holds the width open so the row does not
     shift when a tab is selected. Render only the visible one and every label
     collapses onto the same point, which is exactly what happened. */
  /* Radix ships neither a navigation bar nor a footer; what it does ship is
     rt-Link, rt-Inset for a card's edge-to-edge media, and the card itself. */
  navbar:  (n, k) => `<header class="rt-Flex" style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--space-2) var(--space-5);padding:var(--space-3) var(--space-4);background:var(--color-panel-solid);border-bottom:1px solid var(--gray-a5)">
    <span class="rt-Heading rt-r-size-3">${esc(n.brand)}</span>
    <nav style="display:flex;flex-wrap:wrap;gap:var(--space-4)">${
      list(n.items).map((t) => `<a class="rt-Text rt-r-size-2 rt-Link rt-underline-auto" href="#" data-accent-color="gray">${esc(t)}</a>`).join('')}</nav>
    <span style="margin-left:auto;display:flex;gap:var(--space-2)">${k}</span></header>`,
  mediacard: (n) => `<div class="rt-reset rt-BaseCard rt-Card rt-r-size-2 rt-variant-surface" style="display:flex;flex-direction:column;gap:var(--space-2)">
    <div class="rt-Inset" data-side="top" style="display:flex;align-items:center;justify-content:center;aspect-ratio:16/9;background:var(--gray-a3);color:var(--gray-a9)">${PHOTO}</div>
    <p class="rt-Heading rt-r-size-3">${esc(n.title)}</p>
    <p class="rt-Text rt-r-size-2" data-accent-color="gray">${esc(n.text)}</p>
    <a class="rt-Text rt-r-size-2 rt-Link rt-underline-auto" href="#">${esc(n.action ?? 'Read on')}</a></div>`,
  footer:  (n) => `<footer style="padding:var(--space-5) var(--space-4);background:var(--color-panel-solid);border-top:1px solid var(--gray-a5)">
    <div class="rt-Grid" style="display:grid;gap:var(--space-5);grid-template-columns:repeat(${list(n.groups).length || 1},minmax(0,1fr))">${
      list(n.groups).map((g) => `<div style="display:flex;flex-direction:column;gap:var(--space-2)">
        <p class="rt-Text rt-r-size-1 rt-Strong">${esc(g.title)}</p>${
        list(g.items).map((t) => `<a class="rt-Text rt-r-size-2 rt-Link rt-underline-auto" href="#" data-accent-color="gray">${esc(t)}</a>`).join('')}</div>`).join('')}</div>
    <p class="rt-Text rt-r-size-1" data-accent-color="gray" style="margin-top:var(--space-5)">${esc(n.note)}</p></footer>`,
  elevation: (n) => `<div class="rt-Flex" style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--space-4)">${list(n.levels).map((lv, i) =>
    `<div class="rt-reset rt-BaseCard rt-Card rt-r-size-1 rt-variant-surface" style="width:96px;height:64px;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-${i + 2})"><span class="rt-Text rt-r-size-1" data-accent-color="gray">${esc(lv)}</span></div>`).join('')}</div>`,
  tabs:    (n) => `<nav class="rt-reset rt-BaseTabList rt-r-size-2">${list(n.items).map((t, i) =>
    `<div class="rt-TabNavItem"><a class="rt-reset rt-BaseTabListTrigger rt-TabNavLink"${i === 0 ? ' data-state="active"' : ''}><span class="rt-BaseTabListTriggerInner">${esc(t)}</span><span class="rt-BaseTabListTriggerInnerHidden">${esc(t)}</span></a></div>`).join('')}</nav>`,
}

/* ── Mantine — the class names read out of its own stylesheets ───────────── */
/* Mantine's component classes are content hashes: .m_77c9d27d is Button. They
 * are not a vocabulary anyone can write, so they are not written here — the kit
 * document carries a name→hash map read from its own styles/<Name>.css, and a
 * release that rehashes them changes the map, not this file.
 *
 * Handed in rather than imported, because this module is also inlined into the
 * page where there is no filesystem. */
let MC = {}
export const useMantineClasses = (map) => { MC = map ?? {} }
/* component + the part within it, both named by Mantine's own module map. The
 * first version took the first class in each stylesheet and invented nine names
 * for parts that have no file of their own. */
const mc = (name, part = 'root') => MC[name]?.[part] ?? `mantine-missing-${name}-${part}`
const MN_BTN = {
  brand: '', secondary: '--button-bg:var(--mantine-color-default);--button-color:var(--mantine-color-text);--button-bd:1px solid var(--mantine-color-default-border)',
  ghost: '--button-bg:transparent;--button-color:var(--mantine-primary-color-filled)',
  /* their semantic name, not a red I picked */
  danger: '--button-bg:var(--mantine-color-error);--button-color:var(--mantine-color-white)',
}
const MN_BADGE = { neutral: '--badge-bg:var(--mantine-color-default);--badge-color:var(--mantine-color-text)',
  brand: '', success: '--badge-bg:var(--mantine-color-green-light);--badge-color:var(--mantine-color-green-light-color)',
  warning: '--badge-bg:var(--mantine-color-yellow-light);--badge-color:var(--mantine-color-yellow-light-color)',
  danger: '--badge-bg:var(--mantine-color-error);--badge-color:var(--mantine-color-white)' }
const mantine = {
  _id: 'Mantine',
  stack:   (n, k) => `<div class="${mc('Stack')}" style="--stack-gap:calc(${(n.gap ?? 3) * 0.25}rem * var(--mantine-scale))">${k}</div>`,
  row:     (n, k) => `<div class="${mc('Group')}" style="--group-gap:calc(${(n.gap ?? 2) * 0.25}rem * var(--mantine-scale))${n.between ? ';--group-justify:space-between' : ''}">${k}</div>`,
  grid:    (n, k) => `<div style="display:grid;gap:var(--mantine-spacing-md);grid-template-columns:repeat(${n.cols ?? 2},minmax(0,1fr))">${k}</div>`,
  panel:   (n, k) => `<div class="${cls(mc('Paper'), mc('Card'))}" data-with-border="true" data-orientation="vertical" style="--paper-shadow:var(--mantine-shadow-xs);--card-padding:var(--mantine-spacing-lg)">${k}</div>`,
  divider: () => `<div class="${mc('Divider')}"></div>`,
  /* Mantine's Title reads --title-fz/fw/lh, which its React layer fills from
     the theme's own --mantine-h<n>-* variables. Same variables, set here. */
  heading: (n, k) => A(n, k, `h${n.level ?? 3}`, mc('Title'), ` data-order="${n.level ?? 3}" style="${
    ['font-size', 'font-weight', 'line-height'].map((prop, i) =>
      `--title-${['fz', 'fw', 'lh'][i]}:var(--mantine-h${n.level ?? 3}-${prop})`).join(';')}"`),
  text:    (n, k) => A(n, k, 'p', mc('Text')),
  muted:   (n, k) => A(n, k, 'p', mc('Text'), ' style="--text-color:var(--mantine-color-dimmed)"'),
  label:   (n, k) => A(n, k, 'label', mc('Input', 'label')),
  button:  (n, k) => A(n, k, 'button', mc('Button'), MN_BTN[n.tone ?? 'brand'] ? ` style="${MN_BTN[n.tone ?? 'brand']}"` : ''),
  /* wrapper OUTSIDE, input inside: data-variant on the wrapper is what sets
     --input-bd and --input-bg, and an input without it has `border: 1px solid`
     with no colour — an invisible field, which is what the first pass shipped. */
  input:   (n) => `<div class="${mc('Input', 'wrapper')}" data-variant="default"><input class="${mc('Input', 'input')}" value="${esc(n.value ?? '')}" placeholder="${esc(n.placeholder ?? '')}"></div>`,
  select:  (n) => `<div class="${mc('Input', 'wrapper')}" data-variant="default"><select class="${mc('Input', 'input')}">${list(n.options).map((o) => `<option>${esc(o)}</option>`).join('')}</select></div>`,
  /* --checkbox-size lives on the ROOT and the input reads it, so an input on
     its own is a zero-sized box. Their nesting, not ours. */
  checkbox: (n) => `<label class="${mc('Group')}" style="--group-gap:var(--mantine-spacing-xs)"><span class="${mc('Checkbox')}"><span class="${mc('Checkbox', 'inner')}"><input type="checkbox" class="${mc('Checkbox', 'input')}"${n.on ? ' checked' : ''}></span></span><span class="${mc('Text')}">${esc(n.text ?? '')}</span></label>`,
  /* the track is a SIBLING of the input, not the same element: Mantine styles
     it through `input:checked + track`. */
  switch:  (n) => `<label class="${mc('Group')}" style="--group-gap:var(--mantine-spacing-xs)"><span class="${mc('Switch')}"><input type="checkbox" role="switch" class="${mc('Switch', 'input')}"${n.on ? ' checked' : ''}><span class="${mc('Switch', 'track')}"><span class="${mc('Switch', 'thumb')}"></span></span></span><span class="${mc('Text')}">${esc(n.text ?? '')}</span></label>`,
  badge:   (n, k) => A(n, k, 'span', mc('Badge'), MN_BADGE[n.tone ?? 'neutral'] ? ` style="${MN_BADGE[n.tone ?? 'neutral']}"` : ''),
  alert:   (n, k) => `<div class="${mc('Alert')}" style="--alert-bg:var(--mantine-color-${{ danger: 'error', warning: 'yellow-light', success: 'success' }[n.tone] ?? 'blue-light'})"><div class="${mc('Text')}">${n.text != null ? esc(n.text) : k}</div></div>`,
  stat:    (n) => `<div class="${cls(mc('Paper'), mc('Card'))}" data-with-border="true" data-orientation="vertical" style="--card-padding:var(--mantine-spacing-lg)"><p class="${mc('Text')}" style="--text-color:var(--mantine-color-dimmed);--text-fz:var(--mantine-font-size-sm)">${esc(n.label)}</p><p class="${mc('Title')}" data-order="2" style="--title-fz:var(--mantine-h2-font-size);--title-fw:var(--mantine-h2-font-weight);--title-lh:var(--mantine-h2-line-height)">${esc(n.value)}</p></div>`,
  table:   (n) => `<table class="${mc('Table', 'table')}" data-with-table-border="true" data-with-row-border="true"><thead class="${mc('Table', 'thead')}"><tr class="${mc('Table', 'tr')}">${
    list(n.cols).map((c) => `<th class="${mc('Table', 'th')}">${esc(c)}</th>`).join('')}</tr></thead><tbody class="${mc('Table', 'tbody')}">${
    list(n.rows).map((r) => `<tr class="${mc('Table', 'tr')}" data-with-row-border="true">${list(r).map((c) => `<td class="${mc('Table', 'td')}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
  avatar:  (n) => `<div class="${mc('Avatar')}"><span class="${mc('Avatar', 'placeholder')}">${esc(n.text)}</span></div>`,
  /* Mantine's AppShell publishes a header AND a footer class — the only kit
     here that ships both — and Card.section is its edge-to-edge media slot. */
  navbar:  (n, k) => `<header class="${mc('AppShell', 'header')}" style="position:static;display:flex;flex-wrap:wrap;align-items:center;gap:var(--mantine-spacing-xs) var(--mantine-spacing-lg);padding:var(--mantine-spacing-sm) var(--mantine-spacing-md)">
    <span class="${mc('Title')}" data-order="4" style="--title-fz:var(--mantine-h4-font-size);--title-fw:var(--mantine-h4-font-weight);--title-lh:var(--mantine-h4-line-height)">${esc(n.brand)}</span>
    <nav style="display:flex;flex-wrap:wrap;gap:var(--mantine-spacing-md)">${
      list(n.items).map((t) => `<a class="${mc('Anchor')}" href="#">${esc(t)}</a>`).join('')}</nav>
    <span style="margin-left:auto;display:flex;gap:var(--mantine-spacing-xs)">${k}</span></header>`,
  mediacard: (n) => `<div class="${cls(mc('Paper'), mc('Card'))}" data-with-border="true" data-orientation="vertical" style="--card-padding:var(--mantine-spacing-md)">
    <div class="${mc('Card', 'section')}" style="display:flex;align-items:center;justify-content:center;aspect-ratio:16/9;background:var(--mantine-color-default);color:var(--mantine-color-dimmed)">${PHOTO}</div>
    <p class="${mc('Title')}" data-order="4" style="--title-fz:var(--mantine-h4-font-size);--title-fw:var(--mantine-h4-font-weight);--title-lh:var(--mantine-h4-line-height);margin-top:var(--mantine-spacing-sm)">${esc(n.title)}</p>
    <p class="${mc('Text')}" style="--text-fz:var(--mantine-font-size-sm);--text-color:var(--mantine-color-dimmed)">${esc(n.text)}</p>
    <a class="${mc('Anchor')}" href="#">${esc(n.action ?? 'Read on')}</a></div>`,
  footer:  (n) => `<footer class="${mc('AppShell', 'footer')}" style="position:static;padding:var(--mantine-spacing-lg) var(--mantine-spacing-md)">
    <div style="display:grid;gap:var(--mantine-spacing-lg);grid-template-columns:repeat(${list(n.groups).length || 1},minmax(0,1fr))">${
      list(n.groups).map((g) => `<div style="display:flex;flex-direction:column;gap:var(--mantine-spacing-xs)">
        <p class="${mc('Text')}" style="--text-fz:var(--mantine-font-size-xs);font-weight:600">${esc(g.title)}</p>${
        list(g.items).map((t) => `<a class="${mc('Anchor')}" href="#" style="--anchor-color:var(--mantine-color-dimmed)">${esc(t)}</a>`).join('')}</div>`).join('')}</div>
    <p class="${mc('Text')}" style="--text-fz:var(--mantine-font-size-sm);--text-color:var(--mantine-color-dimmed);margin-top:var(--mantine-spacing-lg)">${esc(n.note)}</p></footer>`,
  elevation: (n) => `<div class="${mc('Group')}">${list(n.levels).map((lv) =>
    `<div class="${cls(mc('Paper'), mc('Card'))}" data-orientation="vertical" style="--paper-shadow:var(--mantine-shadow-${lv});width:96px;height:64px;display:flex;align-items:center;justify-content:center"><span class="${mc('Text')}" style="--text-fz:var(--mantine-font-size-xs);--text-color:var(--mantine-color-dimmed)">${esc(lv)}</span></div>`).join('')}</div>`,
  tabs:    (n) => `<div class="${mc('Tabs')}" data-orientation="horizontal"><div class="${mc('Tabs', 'list')}" role="tablist">${
    list(n.items).map((t, i) => `<button class="${mc('Tabs', 'tab')}" role="tab"${i === 0 ? ' data-active="true"' : ''}>${esc(t)}</button>`).join('')}</div></div>`,
}

export const WALL = { tailwind, daisyui, bootstrap, shadcn, material, radix, mantine }
