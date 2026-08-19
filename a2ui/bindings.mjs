/**
 * A BINDING IS A TABLE, not a program.
 *
 * That is the whole reason a builder is possible: A2UI keeps the catalog
 * (schema) and the renderer (implementation) apart on purpose, so "support
 * another library" means adding a mapping — not writing a renderer. Each entry
 * says how one catalog component becomes markup in that stack, and `emit` turns
 * the same table into the code you copy into your repo and own.
 *
 * These four tables cover BOTH catalogs: Google's A2UI Basic Catalog (the 18
 * standard components) and our public-service extension. A component keyed by
 * the same name renders the same way in both — that is the point. Where the two
 * differ in SHAPE the table absorbs it: our Button carries a `label`, A2UI's
 * takes a child Text component, and one case handles either.
 *
 * `h(node, kidsHtml, resolve, kidsArray)` renders for the PREVIEW (always HTML,
 * so every stack can be seen side by side without a build). `emit(tree)`
 * produces the ARTEFACT — JSX for shadcn, HTML for the class-based stacks.
 */

const esc = (s) => String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))
const md = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
const list = (v) => (Array.isArray(v) ? v : [])

/* A2UI's Button has no label: its accessible name is whatever text sits in the
 * child component. So the binding has to go and find it — the same walk check()
 * does for `nameFromChild`, and the reason an icon-only button comes out unnamed
 * in BOTH (it renders, and it fails 4.1.2, which is the honest pair). */
const textIn = (n, r) => (n.kids ?? []).map((k) => (k.text != null ? r(k.text) : textIn(k, r))).filter(Boolean).join(' ').trim()
const labelOf = (n, r) => (n.label != null ? r(n.label) : textIn(n, r))

/* The Basic Catalog's icon enum, drawn as paths so the page needs no icon
 * dependency. An unlisted name gets a neutral mark rather than nothing — a
 * missing glyph must never be silence in a control. */
const ICONS = {
  locationOn: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>',
  add: '<path d="M12 5v14M5 12h14"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.6"/>',
  error: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.2v.6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.2 2.6c-.6.3-.8.8-.8 1.5M12 16.6v.4"/>',
  calendarToday: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  event: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17M11 14h2v2h-2z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m3.6 7 8.4 6 8.4-6"/>',
  call: '<path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6.5 9.7V20h11V9.7"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>', settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"/>',
  download: '<path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 19.5h14"/>', upload: '<path d="M12 20V9M7.5 13 12 8.5 16.5 13M5 4.5h14"/>',
  edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z"/>', delete: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5"/>',
  favorite: '<path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"/>',
  folder: '<path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h3.6l2 2.4h7.4a2 2 0 0 1 2 2v8.1a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/>',
  attachFile: '<path d="M17.5 9 10 16.5a3 3 0 0 1-4.3-4.3l8-8a4.6 4.6 0 0 1 6.5 6.5l-8 8"/>',
  arrowBack: '<path d="M19 12H5M11 6l-6 6 6 6"/>', arrowForward: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  moreVert: '<circle cx="12" cy="5.5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="18.5" r="1.4"/>',
  visibility: '<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  send: '<path d="m4 12 16-7-6 16-3-6.6L4 12Z"/>', share: '<circle cx="17.5" cy="6" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="18" r="2.5"/><path d="m8.8 10.8 6.4-3.5M8.8 13.2l6.4 3.5"/>',
  _: '<circle cx="12" cy="12" r="7.5"/>',
}
const icon = (name, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] ?? ICONS._}</svg>`
/* the same enum in lucide's vocabulary, for the shadcn artefact */
const LUCIDE = { locationOn: 'MapPin', check: 'Check', close: 'X', add: 'Plus', info: 'Info', error: 'CircleAlert',
  help: 'CircleHelp', calendarToday: 'Calendar', event: 'CalendarDays', mail: 'Mail', call: 'Phone', home: 'House',
  menu: 'Menu', search: 'Search', settings: 'Settings', download: 'Download', upload: 'Upload', edit: 'Pencil',
  delete: 'Trash2', lock: 'Lock', favorite: 'Heart', folder: 'Folder', attachFile: 'Paperclip', arrowBack: 'ArrowLeft',
  arrowForward: 'ArrowRight', moreVert: 'EllipsisVertical', visibility: 'Eye', send: 'Send', share: 'Share2' }

/* A2UI's TextField.variant and DateTimeInput's two booleans, as input types. */
const INPUT_TYPE = { longText: 'textarea', number: 'number', obscured: 'password', shortText: 'text' }
const dateType = (n) => (n.enableDate !== false && n.enableTime ? 'datetime-local' : n.enableTime ? 'time' : 'date')
const attr = (k, v) => (v == null || v === '' ? '' : ` ${k}="${esc(v)}"`)

/* Modal: A2UI names a TRIGGER component and a CONTENT component and nothing
 * else — no title, so no accessible name (check() reports that as a gap in the
 * catalog). What a binding CAN do is make it work without script: the invoker
 * commands API opens a real <dialog> declaratively, so the artefact you copy
 * has no JavaScript to maintain and keeps the platform's focus handling. */
const invoke = (triggerHtml, dialogId, fallbackClass) => (triggerHtml.includes('<button')
  ? triggerHtml.replace('<button', `<button command="show-modal" commandfor="${dialogId}"`)
  : `<button class="${fallbackClass}" type="button" command="show-modal" commandfor="${dialogId}">${triggerHtml}</button>`)

/* ── binding 1 · our kit ─────────────────────────────────────────────────── */
const KIT_TONE = { info: 'info', success: 'success', warn: 'warn', danger: 'danger', neutral: 'neutral' }
/* The kit's own two vocabularies: badges say `warn`, alerts say `warning`. A
 * Callout with tone "warn" emitted .alert--warn, which nothing defines, so it
 * rendered with no tone at all — invisibly, for as long as the binding existed.
 * The class-exists gate in test.mjs is what found it. */
const KIT_ALERT = { info: 'info', success: 'success', warn: 'warning', danger: 'danger', neutral: 'info' }
const KIT_BTN = { primary: 'btn--primary', borderless: 'btn--link', ghost: 'btn--ghost', secondary: 'btn--secondary' }
const kit = {
  id: 'kit', label: 'UIcockpit kit', note: 'plain CSS classes, no framework — works in any renderer',
  h(n, k, r, ka = []) {
    const id = n.id ?? 'n'
    switch (n.component) {
      /* ── shared by both catalogs ── */
      case 'Card':   return `<div class="card">${k}</div>`
      case 'Column': return `<div class="l-stack">${k}</div>`
      case 'Row':    return `<div class="l-cluster">${k}</div>`
      case 'Text':   return n.variant === 'caption'
        ? `<p class="figure__caption">${md(r(n.text))}</p>`
        : `<div class="prose"><p>${md(r(n.text))}</p></div>`
      case 'Button': return `<button class="btn ${KIT_BTN[n.variant] ?? 'btn--secondary'}" type="button">${
        n.label != null ? esc(r(n.label)) : (textIn(n, r) ? esc(textIn(n, r)) : k)}</button>`
      /* ── the A2UI Basic Catalog ── */
      case 'Image':  return `<figure class="figure"><div class="figure__media"><img src="${esc(r(n.url))}" alt="${esc(r(n.description) ?? '')}"></div></figure>`
      case 'Icon':   return icon(n.name)
      case 'Video':  return `<figure class="figure"><div class="figure__media"><video controls preload="none"${attr('poster', r(n.posterUrl))} src="${esc(r(n.url))}"></video></div></figure>`
      case 'AudioPlayer': return `<audio class="in" controls preload="none"${attr('aria-label', r(n.description))} src="${esc(r(n.url))}"></audio>`
      case 'List':   return `<div class="${n.direction === 'horizontal' ? 'l-cluster' : 'l-stack'}">${k}</div>`
      case 'Divider':return n.axis === 'vertical' ? `<div role="separator" aria-orientation="vertical" class="dl--band"></div>` : `<hr>`
      /* Tabs without script. A2UI's Tabs implies a JS tab widget; a table-only
         binding renders the honest no-JS equivalent — disclosures, each with its
         title as the summary — rather than painting tabs that do not switch.
         The shadcn artefact below uses the real Tabs component. */
      case 'Tabs':   return `<div class="l-stack">${list(n.tabs).map((t, i) =>
        `<details class="card card--well"${i === 0 ? ' open' : ''}><summary class="tab">${esc(r(t.title))}</summary>${ka[i] ?? ''}</details>`).join('')}</div>`
      case 'Modal':  return `<div class="l-stack">${invoke(ka[0] ?? '', id + '_d', 'btn btn--secondary')}<dialog class="dialog" id="${id}_d"><div class="dialog__body">${
        ka[1] ?? ''}</div><div class="dialog__foot"><button class="btn btn--secondary" type="button" command="close" commandfor="${id}_d">Close</button></div></dialog></div>`
      case 'TextField': {
        const t = INPUT_TYPE[n.variant] ?? 'text'
        return `<div class="field">${r(n.label) ? `<label class="field__label" for="${id}_i">${esc(r(n.label))}</label>` : ''}${t === 'textarea'
          ? `<textarea class="in" id="${id}_i" rows="3"${attr('placeholder', r(n.placeholder))}>${esc(r(n.value) ?? '')}</textarea>`
          : `<input class="in" id="${id}_i" type="${t}"${attr('value', r(n.value))}${attr('placeholder', r(n.placeholder))}>`}</div>`
      }
      case 'DateTimeInput': return `<div class="field">${r(n.label) ? `<label class="field__label" for="${id}_i">${esc(r(n.label))}</label>` : ''}<input class="in" id="${id}_i" type="${
        dateType(n)}"${attr('value', r(n.value))}${attr('min', n.min)}${attr('max', n.max)}></div>`
      case 'CheckBox': return `<label class="checkbox"><input type="checkbox"${r(n.value) ? ' checked' : ''}><span>${esc(r(n.label) ?? '')}</span></label>`
      case 'ChoicePicker': {
        const multi = n.variant === 'multipleSelection', sel = new Set(list(r(n.value)))
        return `<fieldset class="fieldset">${r(n.label) ? `<legend class="fieldset__legend">${esc(r(n.label))}</legend>` : ''}<div class="l-stack">${
          list(n.options).map((o) => `<label class="${multi ? 'checkbox' : 'radio'}"><input type="${multi ? 'checkbox' : 'radio'}" name="${id}"${
            sel.has(o.value) ? ' checked' : ''}><span>${esc(r(o.label))}</span></label>`).join('')}</div></fieldset>`
      }
      case 'Slider': return `<div class="field">${r(n.label) ? `<label class="field__label" for="${id}_i">${esc(r(n.label))}</label>` : ''}<input type="range" id="${id}_i"${
        attr('min', n.min ?? 0)}${attr('max', n.max)}${attr('step', n.steps ? (n.max - (n.min ?? 0)) / n.steps : null)}${attr('value', r(n.value))}></div>`
      /* ── the public-service extension ── */
      case 'Heading':return `<div class="page-head"><div class="page-head__titles">${n.level === 3
        ? `<h3 class="section__title">${esc(r(n.text))}</h3>` : `<h2 class="page-head__title">${esc(r(n.text))}</h2>`}${
        n.sub ? `<p class="page-head__sub">${esc(r(n.sub))}</p>` : ''}</div></div>`
      case 'Badge':  return `<span class="badge badge--${KIT_TONE[n.tone] ?? 'neutral'}"><span class="badge__dot"></span>${esc(r(n.text))}</span>`
      case 'Callout':return `<div class="alert alert--${KIT_ALERT[n.tone] ?? 'info'}" role="status"><div class="alert__body">${
        n.title ? `<div class="alert__title">${esc(r(n.title))}</div>` : ''}<div>${esc(r(n.text))}</div></div></div>`
      case 'SummaryList': return `<dl class="dl">${list(r(n.items)).map((it) => `<dt>${esc(it.label)}</dt><dd>${esc(it.value)}</dd>`).join('')}</dl>`
      case 'TaskList': return `<ol class="tasklist">${list(r(n.items)).map((it) => `<li class="tasklist__item"><span class="tasklist__name">${
        it.locked ? `<span class="tasklist__name--locked">${esc(it.name)}</span>` : `<a class="tasklist__link" href="#">${esc(it.name)}</a>`}${
        it.hint ? `<span class="tasklist__hint">${esc(it.hint)}</span>` : ''}</span><span class="badge tasklist__status badge--${KIT_TONE[it.tone] ?? 'neutral'}">${esc(it.status)}</span></li>`).join('')}</ol>`
      case 'Steps':  return `<ol class="processlist">${list(r(n.items)).map((it) => `<li class="processlist__step"><h3 class="processlist__title">${esc(it.title)}</h3>${it.body ? `<p class="processlist__body">${esc(it.body)}</p>` : ''}</li>`).join('')}</ol>`
      case 'Table':  return `<table class="table"><thead><tr>${list(n.columns).map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${
        list(r(n.rows)).map((row) => `<tr>${list(row).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    }
  },
}

/* ── binding 2 · Tailwind (utility classes, no library) ──────────────────── */
const TW_TONE = { info: 'bg-blue-50 text-blue-900 ring-blue-200', success: 'bg-green-50 text-green-900 ring-green-200',
  warn: 'bg-amber-50 text-amber-900 ring-amber-200', danger: 'bg-red-50 text-red-900 ring-red-200', neutral: 'bg-gray-100 text-gray-700 ring-gray-200' }
const TW_BTN = { primary: 'bg-gray-900 text-white hover:bg-gray-800', borderless: 'text-gray-900 underline underline-offset-4',
  ghost: 'text-gray-700 hover:bg-gray-100', secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200' }
const TW_LABEL = 'text-sm font-medium text-gray-900'
const TW_INPUT = 'h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-900'
const tw = {
  id: 'tailwind', label: 'Tailwind CSS', note: 'utility classes only — no component library, works with any renderer',
  h(n, k, r, ka = []) {
    const id = n.id ?? 'n'
    switch (n.component) {
      case 'Card':   return `<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">${k}</div>`
      case 'Column': return `<div class="flex flex-col gap-4">${k}</div>`
      case 'Row':    return `<div class="flex flex-wrap items-center gap-2">${k}</div>`
      case 'Text':   return n.variant === 'caption'
        ? `<p class="text-xs text-gray-500">${md(r(n.text))}</p>`
        : `<p class="text-sm leading-relaxed text-gray-700">${md(r(n.text))}</p>`
      case 'Button': return `<button type="button" class="${TW_BTN[n.variant] ?? TW_BTN.secondary} inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-medium">${
        n.label != null ? esc(r(n.label)) : (textIn(n, r) ? esc(textIn(n, r)) : k)}</button>`
      case 'Image':  return `<figure class="flex flex-col gap-2"><img class="aspect-video w-full rounded-lg border border-gray-200 object-cover" src="${esc(r(n.url))}" alt="${esc(r(n.description) ?? '')}"></figure>`
      case 'Icon':   return icon(n.name, 'text-gray-700')
      case 'Video':  return `<video class="aspect-video w-full rounded-lg border border-gray-200 object-cover" controls preload="none"${attr('poster', r(n.posterUrl))} src="${esc(r(n.url))}"></video>`
      case 'AudioPlayer': return `<audio class="w-full" controls preload="none"${attr('aria-label', r(n.description))} src="${esc(r(n.url))}"></audio>`
      case 'List':   return `<div class="${n.direction === 'horizontal' ? 'flex flex-wrap gap-4' : 'flex flex-col gap-2'}">${k}</div>`
      case 'Divider':return n.axis === 'vertical' ? `<div role="separator" aria-orientation="vertical" class="w-px self-stretch bg-gray-200"></div>` : `<hr class="border-t border-gray-200">`
      case 'Tabs':   return `<div class="flex flex-col gap-2">${list(n.tabs).map((t, i) =>
        `<details class="rounded-lg border border-gray-200 p-4"${i === 0 ? ' open' : ''}><summary class="flex min-h-6 cursor-pointer items-center text-sm font-medium text-gray-900">${esc(r(t.title))}</summary><div class="pt-2">${ka[i] ?? ''}</div></details>`).join('')}</div>`
      case 'Modal':  return `<div class="flex flex-col gap-2">${invoke(ka[0] ?? '', id + '_d', 'inline-flex h-9 items-center rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-900')}<dialog class="max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm" id="${id}_d"><div class="flex flex-col gap-4">${
        ka[1] ?? ''}<button type="button" class="inline-flex h-9 items-center rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-900" command="close" commandfor="${id}_d">Close</button></div></dialog></div>`
      case 'TextField': {
        const t = INPUT_TYPE[n.variant] ?? 'text'
        return `<div class="flex flex-col gap-1">${r(n.label) ? `<label class="${TW_LABEL}" for="${id}_i">${esc(r(n.label))}</label>` : ''}${t === 'textarea'
          ? `<textarea class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900" id="${id}_i" rows="3"${attr('placeholder', r(n.placeholder))}>${esc(r(n.value) ?? '')}</textarea>`
          : `<input class="${TW_INPUT}" id="${id}_i" type="${t}"${attr('value', r(n.value))}${attr('placeholder', r(n.placeholder))}>`}</div>`
      }
      case 'DateTimeInput': return `<div class="flex flex-col gap-1">${r(n.label) ? `<label class="${TW_LABEL}" for="${id}_i">${esc(r(n.label))}</label>` : ''}<input class="${TW_INPUT}" id="${id}_i" type="${
        dateType(n)}"${attr('value', r(n.value))}${attr('min', n.min)}${attr('max', n.max)}></div>`
      /* min-h-6 is the 24px WCAG 2.5.8 asks of a target; without it the row is 22 */
      case 'CheckBox': return `<label class="inline-flex min-h-6 items-center gap-2 text-sm text-gray-900"><input type="checkbox" class="size-4 accent-gray-900"${r(n.value) ? ' checked' : ''}><span>${esc(r(n.label) ?? '')}</span></label>`
      case 'ChoicePicker': {
        const multi = n.variant === 'multipleSelection', sel = new Set(list(r(n.value)))
        return `<fieldset class="flex flex-col gap-2">${r(n.label) ? `<legend class="mb-1 ${TW_LABEL}">${esc(r(n.label))}</legend>` : ''}${
          list(n.options).map((o) => `<label class="inline-flex min-h-6 items-center gap-2 text-sm text-gray-900"><input type="${multi ? 'checkbox' : 'radio'}" name="${id}" class="size-4 accent-gray-900"${
            sel.has(o.value) ? ' checked' : ''}><span>${esc(r(o.label))}</span></label>`).join('')}</fieldset>`
      }
      case 'Slider': return `<div class="flex flex-col gap-1">${r(n.label) ? `<label class="${TW_LABEL}" for="${id}_i">${esc(r(n.label))}</label>` : ''}<input type="range" class="min-h-6 w-full accent-gray-900" id="${id}_i"${
        attr('min', n.min ?? 0)}${attr('max', n.max)}${attr('step', n.steps ? (n.max - (n.min ?? 0)) / n.steps : null)}${attr('value', r(n.value))}></div>`
      case 'Heading':return `<div class="flex flex-col gap-1">${n.level === 3
        ? `<h3 class="text-base font-semibold text-gray-900">${esc(r(n.text))}</h3>`
        : `<h2 class="text-xl font-semibold tracking-tight text-gray-900">${esc(r(n.text))}</h2>`}${
        n.sub ? `<p class="text-sm text-gray-500">${esc(r(n.sub))}</p>` : ''}</div>`
      /* self-start, or a badge dropped straight into a Column stretches to the
         full width and reads as a bar — the kit hit the same thing. */
      case 'Badge':  return `<span class="inline-flex self-start items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TW_TONE[n.tone] ?? TW_TONE.neutral}">${esc(r(n.text))}</span>`
      case 'Callout':return `<div role="status" class="rounded-lg p-4 text-sm ring-1 ring-inset ${TW_TONE[n.tone] ?? TW_TONE.info}">${
        n.title ? `<strong class="mb-1 block font-semibold">${esc(r(n.title))}</strong>` : ''}${esc(r(n.text))}</div>`
      case 'SummaryList': return `<dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">${
        list(r(n.items)).map((it) => `<dt class="text-gray-500">${esc(it.label)}</dt><dd class="font-medium text-gray-900">${esc(it.value)}</dd>`).join('')}</dl>`
      case 'TaskList': return `<ol class="divide-y divide-gray-200 rounded-lg border border-gray-200">${
        list(r(n.items)).map((it) => `<li class="flex items-center justify-between gap-4 px-4 py-3"><span class="flex flex-col"><span class="${it.locked ? 'text-gray-400' : 'font-medium text-gray-900 underline underline-offset-4'}">${esc(it.name)}</span>${
        it.hint ? `<span class="text-xs text-gray-500">${esc(it.hint)}</span>` : ''}</span><span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TW_TONE[it.tone] ?? TW_TONE.neutral}">${esc(it.status)}</span></li>`).join('')}</ol>`
      case 'Steps':  return `<ol class="flex flex-col gap-4 border-l-2 border-gray-200 pl-5">${
        list(r(n.items)).map((it) => `<li><h3 class="text-sm font-semibold text-gray-900">${esc(it.title)}</h3>${it.body ? `<p class="text-sm text-gray-600">${esc(it.body)}</p>` : ''}</li>`).join('')}</ol>`
      case 'Table':  return `<table class="w-full text-left text-sm"><thead class="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500"><tr>${
        list(n.columns).map((c) => `<th scope="col" class="py-2 pr-4 font-medium">${esc(c)}</th>`).join('')}</tr></thead><tbody class="divide-y divide-gray-100">${
        list(r(n.rows)).map((row) => `<tr>${list(row).map((c) => `<td class="py-2 pr-4 text-gray-700">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    }
  },
}

/* ── binding 3 · daisyUI ─────────────────────────────────────────────────── */
/* Class names verified against daisyUI 5.7 docs, not from memory. Three things a
 * table has to encode and a generator gets wrong:
 *
 *  · the tone VOCABULARY differs — daisyUI says `warning`/`error` where we say
 *    `warn`/`danger`, so the mapping is the binding's job, not the agent's;
 *  · daisyUI HAS a `steps` component, and we deliberately do not use it for our
 *    Steps. Theirs is a progress indicator (where you are in a flow); ours is
 *    GOV.UK's "step by step" (what to do, in order). Rendering instructions as
 *    a progress bar would tell the reader something untrue, so Steps stays an
 *    <ol>. Reaching for the same-named component is exactly the mistake a
 *    machine makes on names alone;
 *  · daisyUI's `modal` and `collapse` ARE the right idioms here, so those we do
 *    take — the test is whether the meaning survives, not whether the name matches. */
const DAISY_TONE = { info: 'info', success: 'success', warn: 'warning', danger: 'error', neutral: 'neutral' }
const DAISY_BTN = { primary: 'btn-primary', borderless: 'btn-link', ghost: 'btn-ghost', secondary: 'btn-secondary' }
const daisy = {
  id: 'daisyui', label: 'daisyUI', note: 'semantic classes on Tailwind, zero JS — 35 built-in themes, any framework',
  h(n, k, r, ka = []) {
    const id = n.id ?? 'n'
    switch (n.component) {
      case 'Card':   return `<div class="card card-border bg-base-100"><div class="card-body">${k}</div></div>`
      case 'Column': return `<div class="flex flex-col gap-4">${k}</div>`
      case 'Row':    return `<div class="flex flex-wrap items-center gap-2">${k}</div>`
      case 'Text':   return n.variant === 'caption'
        ? `<p class="text-xs opacity-60">${md(r(n.text))}</p>`
        : `<p class="text-sm leading-relaxed">${md(r(n.text))}</p>`
      case 'Button': return `<button class="btn ${DAISY_BTN[n.variant] ?? ''}">${
        n.label != null ? esc(r(n.label)) : (textIn(n, r) ? esc(textIn(n, r)) : k)}</button>`
      case 'Image':  return `<figure><img class="rounded-box w-full" src="${esc(r(n.url))}" alt="${esc(r(n.description) ?? '')}"></figure>`
      case 'Icon':   return icon(n.name)
      case 'Video':  return `<video class="rounded-box w-full" controls preload="none"${attr('poster', r(n.posterUrl))} src="${esc(r(n.url))}"></video>`
      case 'AudioPlayer': return `<audio class="w-full" controls preload="none"${attr('aria-label', r(n.description))} src="${esc(r(n.url))}"></audio>`
      case 'List':   return `<div class="${n.direction === 'horizontal' ? 'flex flex-wrap gap-4' : 'flex flex-col gap-2'}">${k}</div>`
      case 'Divider':return n.axis === 'vertical' ? `<div class="divider divider-horizontal"></div>` : `<div class="divider"></div>`
      case 'Tabs':   return `<div class="flex flex-col gap-2">${list(n.tabs).map((t, i) =>
        `<details class="collapse collapse-arrow border bg-base-100"${i === 0 ? ' open' : ''}><summary class="collapse-title font-medium">${esc(r(t.title))}</summary><div class="collapse-content">${ka[i] ?? ''}</div></details>`).join('')}</div>`
      case 'Modal':  return `<div class="flex flex-col gap-2">${invoke(ka[0] ?? '', id + '_d', 'btn')}<dialog class="modal" id="${id}_d"><div class="modal-box flex flex-col gap-4">${
        ka[1] ?? ''}<div class="modal-action"><button class="btn" command="close" commandfor="${id}_d">Close</button></div></div></dialog></div>`
      case 'TextField': {
        const t = INPUT_TYPE[n.variant] ?? 'text'
        return `<fieldset class="fieldset">${r(n.label) ? `<legend class="fieldset-legend">${esc(r(n.label))}</legend>` : ''}${t === 'textarea'
          ? `<textarea class="textarea w-full" rows="3"${attr('placeholder', r(n.placeholder))}>${esc(r(n.value) ?? '')}</textarea>`
          : `<input class="input w-full" type="${t}"${attr('value', r(n.value))}${attr('placeholder', r(n.placeholder))}>`}</fieldset>`
      }
      case 'DateTimeInput': return `<fieldset class="fieldset">${r(n.label) ? `<legend class="fieldset-legend">${esc(r(n.label))}</legend>` : ''}<input class="input w-full" type="${
        dateType(n)}"${attr('value', r(n.value))}${attr('min', n.min)}${attr('max', n.max)}></fieldset>`
      case 'CheckBox': return `<label class="label"><input type="checkbox" class="checkbox"${r(n.value) ? ' checked' : ''}><span>${esc(r(n.label) ?? '')}</span></label>`
      case 'ChoicePicker': {
        const multi = n.variant === 'multipleSelection', sel = new Set(list(r(n.value)))
        return `<fieldset class="fieldset">${r(n.label) ? `<legend class="fieldset-legend">${esc(r(n.label))}</legend>` : ''}${
          list(n.options).map((o) => `<label class="label"><input type="${multi ? 'checkbox' : 'radio'}" name="${id}" class="${multi ? 'checkbox' : 'radio'}"${
            sel.has(o.value) ? ' checked' : ''}><span>${esc(r(o.label))}</span></label>`).join('')}</fieldset>`
      }
      case 'Slider': return `<fieldset class="fieldset">${r(n.label) ? `<legend class="fieldset-legend">${esc(r(n.label))}</legend>` : ''}<input type="range" class="range min-h-6"${
        attr('min', n.min ?? 0)}${attr('max', n.max)}${attr('step', n.steps ? (n.max - (n.min ?? 0)) / n.steps : null)}${attr('value', r(n.value))}></fieldset>`
      case 'Heading':return n.level === 3
        ? `<h3 class="card-title text-base">${esc(r(n.text))}</h3>`
        : `<div><h2 class="card-title">${esc(r(n.text))}</h2>${n.sub ? `<p class="text-sm opacity-60">${esc(r(n.sub))}</p>` : ''}</div>`
      case 'Badge':  return `<span class="badge badge-soft self-start badge-${DAISY_TONE[n.tone] ?? 'neutral'}">${esc(r(n.text))}</span>`
      case 'Callout':return `<div role="alert" class="alert alert-soft alert-${DAISY_TONE[n.tone] ?? 'info'}"><span>${
        n.title ? `<strong class="block">${esc(r(n.title))}</strong>` : ''}${esc(r(n.text))}</span></div>`
      /* A <dl> and not daisyUI's `list`: label/value pairs are a description
         list, and the library's idiom is only worth taking when it costs no
         semantics. The look comes from utilities either way. */
      case 'SummaryList': return `<dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">${
        list(r(n.items)).map((it) => `<dt class="opacity-60">${esc(it.label)}</dt><dd class="font-medium">${esc(it.value)}</dd>`).join('')}</dl>`
      case 'TaskList': return `<ul class="list bg-base-100 rounded-box">${
        list(r(n.items)).map((it) => `<li class="list-row"><div>${
        it.locked ? `<span class="opacity-50">${esc(it.name)}</span>` : `<a class="link link-hover font-medium">${esc(it.name)}</a>`}${
        it.hint ? `<div class="text-xs opacity-60">${esc(it.hint)}</div>` : ''}</div><span class="badge badge-soft badge-${DAISY_TONE[it.tone] ?? 'neutral'}">${esc(it.status)}</span></li>`).join('')}</ul>`
      case 'Steps':  return `<ol class="flex flex-col gap-4 list-decimal pl-5 marker:opacity-60 marker:font-semibold">${
        list(r(n.items)).map((it) => `<li><h3 class="font-semibold text-sm">${esc(it.title)}</h3>${it.body ? `<p class="text-sm opacity-70">${esc(it.body)}</p>` : ''}</li>`).join('')}</ol>`
      case 'Table':  return `<div class="overflow-x-auto"><table class="table table-zebra"><thead><tr>${
        list(n.columns).map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${
        list(r(n.rows)).map((row) => `<tr>${list(row).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    }
  },
}

/* ── binding 4 · shadcn/ui ───────────────────────────────────────────────── */
const SC_BADGE = { info: 'secondary', success: 'default', warn: 'outline', danger: 'destructive', neutral: 'secondary' }
const SC_BTN = { primary: '', borderless: ' variant="link"', ghost: ' variant="ghost"', secondary: ' variant="secondary"' }
const shadcn = {
  id: 'shadcn', label: 'shadcn/ui', note: 'your own components, copied into your repo — the generated file imports them',
  /* what each component needs, as module → names. Collected per NAME and not
     per line: three components want Label, and emitting the import three times
     is a file that does not compile. */
  imports: {
    Card: { card: ['Card', 'CardContent'] },
    Badge: { badge: ['Badge'] },
    Button: { button: ['Button'] },
    Table: { table: ['Table', 'TableBody', 'TableCell', 'TableHead', 'TableHeader', 'TableRow'] },
    Tabs: { tabs: ['Tabs', 'TabsContent', 'TabsList', 'TabsTrigger'] },
    Modal: { dialog: ['Dialog', 'DialogContent', 'DialogTitle', 'DialogTrigger'] },
    TextField: { input: ['Input'], label: ['Label'] },
    DateTimeInput: { input: ['Input'], label: ['Label'] },
    CheckBox: { checkbox: ['Checkbox'], label: ['Label'] },
    ChoicePicker: { checkbox: ['Checkbox'], label: ['Label'], 'radio-group': ['RadioGroup', 'RadioGroupItem'] },
    Slider: { slider: ['Slider'], label: ['Label'] },
    Divider: { separator: ['Separator'] },
    TaskList: { badge: ['Badge'] },
  },
  /* preview: shadcn IS Tailwind classes over Radix, so the preview borrows the
     class composition shadcn ships. The artefact below imports the real ones. */
  h(n, k, r, ka) { return tw.h(n, k, r, ka) },
  jsx: {
    Card:   (k) => `<Card><CardContent className="pt-6">${k}</CardContent></Card>`,
    Column: (k) => `<div className="flex flex-col gap-4">${k}</div>`,
    Row:    (k) => `<div className="flex flex-wrap items-center gap-2">${k}</div>`,
    Text:   (k, n) => n.variant === 'caption' ? `<p className="text-xs text-muted-foreground">{${v(n.text)}}</p>` : `<p className="text-sm leading-relaxed">{${v(n.text)}}</p>`,
    Button: (k, n) => `<Button${SC_BTN[n.variant] ?? SC_BTN.secondary}>${n.label != null ? `{${v(n.label)}}` : k}</Button>`,
    Image:  (k, n) => `<img className="aspect-video w-full rounded-lg object-cover" src={${v(n.url)}} alt={${v(n.description ?? '')}} />`,
    Icon:   (k, n) => `<${LUCIDE[n.name] ?? 'Circle'} className="size-5" aria-hidden />`,
    Video:  (k, n) => `<video className="aspect-video w-full rounded-lg" controls preload="none" poster={${v(n.posterUrl)}} src={${v(n.url)}} />`,
    AudioPlayer: (k, n) => `<audio className="w-full" controls preload="none" aria-label={${v(n.description)}} src={${v(n.url)}} />`,
    List:   (k, n) => `<div className="${n.direction === 'horizontal' ? 'flex flex-wrap gap-4' : 'flex flex-col gap-2'}">${k}</div>`,
    Divider:(k, n) => `<Separator${n.axis === 'vertical' ? ' orientation="vertical"' : ''} />`,
    Tabs:   (k, n, ka = []) => `<Tabs defaultValue="t0">\n      <TabsList>${list(n.tabs).map((t, i) => `<TabsTrigger value="t${i}">{${v(t.title)}}</TabsTrigger>`).join('')}</TabsList>\n${
      list(n.tabs).map((t, i) => `      <TabsContent value="t${i}">${ka[i] ?? ''}</TabsContent>`).join('\n')}\n    </Tabs>`,
    /* The one place a binding can repair a catalog gap: Radix REQUIRES a
       DialogTitle, so the artefact carries a visually-hidden one. A2UI gives no
       title to put there — you fill it in, and until you do it says so. */
    Modal:  (k, n, ka = []) => `<Dialog>\n      <DialogTrigger asChild>${ka[0] ?? ''}</DialogTrigger>\n      <DialogContent>\n        <DialogTitle className="sr-only">{/* A2UI's Modal carries no title — name this dialog */}</DialogTitle>\n        ${ka[1] ?? ''}\n      </DialogContent>\n    </Dialog>`,
    TextField: (k, n) => `<div className="flex flex-col gap-1">\n      <Label htmlFor="${n.id}">{${v(n.label)}}</Label>\n      <Input id="${n.id}" type="${INPUT_TYPE[n.variant] === 'textarea' ? 'text' : INPUT_TYPE[n.variant] ?? 'text'}" defaultValue={${v(n.value)}} placeholder={${v(n.placeholder)}} />\n    </div>`,
    DateTimeInput: (k, n) => `<div className="flex flex-col gap-1">\n      <Label htmlFor="${n.id}">{${v(n.label)}}</Label>\n      <Input id="${n.id}" type="${dateType(n)}" defaultValue={${v(n.value)}} />\n    </div>`,
    CheckBox: (k, n) => `<div className="flex min-h-6 items-center gap-2">\n      <Checkbox id="${n.id}" defaultChecked={${v(n.value)}} />\n      <Label htmlFor="${n.id}">{${v(n.label)}}</Label>\n    </div>`,
    ChoicePicker: (k, n) => n.variant === 'multipleSelection'
      ? `<fieldset className="flex flex-col gap-2">\n      <legend className="mb-1 text-sm font-medium">{${v(n.label)}}</legend>\n${list(n.options).map((o, i) => `      <div className="flex min-h-6 items-center gap-2"><Checkbox id="${n.id}_${i}" /><Label htmlFor="${n.id}_${i}">{${v(o.label)}}</Label></div>`).join('\n')}\n    </fieldset>`
      : `<fieldset className="flex flex-col gap-2">\n      <legend className="mb-1 text-sm font-medium">{${v(n.label)}}</legend>\n      <RadioGroup defaultValue={${v(n.value)}}>\n${list(n.options).map((o, i) => `        <div className="flex min-h-6 items-center gap-2"><RadioGroupItem value=${JSON.stringify(String(o.value))} id="${n.id}_${i}" /><Label htmlFor="${n.id}_${i}">{${v(o.label)}}</Label></div>`).join('\n')}\n      </RadioGroup>\n    </fieldset>`,
    Slider: (k, n) => `<div className="flex flex-col gap-1">\n      <Label htmlFor="${n.id}">{${v(n.label)}}</Label>\n      <Slider id="${n.id}" min={${n.min ?? 0}} max={${n.max ?? 100}} defaultValue={[${v(n.value)}]} />\n    </div>`,
    Heading:(k, n) => n.level === 3 ? `<h3 className="text-base font-semibold">{${v(n.text)}}</h3>` : `<div><h2 className="text-xl font-semibold tracking-tight">{${v(n.text)}}</h2>${n.sub ? `<p className="text-sm text-muted-foreground">{${v(n.sub)}}</p>` : ''}</div>`,
    Badge:  (k, n) => `<Badge className="self-start" variant="${SC_BADGE[n.tone] ?? 'secondary'}">{${v(n.text)}}</Badge>`,
    Callout:(k, n) => `<div role="status" className="rounded-lg border p-4 text-sm">${n.title ? `<strong className="block">{${v(n.title)}}</strong>` : ''}{${v(n.text)}}</div>`,
    SummaryList: (k, n) => `<dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">\n      {${v(n.items)}.map((it, i) => (\n        <div key={i} className="contents">\n          <dt className="text-muted-foreground">{it.label}</dt>\n          <dd className="font-medium">{it.value}</dd>\n        </div>\n      ))}\n    </dl>`,
    TaskList: (k, n) => `<ol className="divide-y rounded-lg border">\n      {${v(n.items)}.map((it, i) => (\n        <li key={i} className="flex items-center justify-between gap-4 px-4 py-3">\n          <span className="flex flex-col">\n            <span className={it.locked ? 'text-muted-foreground' : 'font-medium underline underline-offset-4'}>{it.name}</span>\n            {it.hint && <span className="text-xs text-muted-foreground">{it.hint}</span>}\n          </span>\n          <Badge variant="secondary">{it.status}</Badge>\n        </li>\n      ))}\n    </ol>`,
    Steps: (k, n) => `<ol className="flex flex-col gap-4 border-l-2 pl-5">\n      {${v(n.items)}.map((it, i) => (\n        <li key={i}><h3 className="text-sm font-semibold">{it.title}</h3>{it.body && <p className="text-sm text-muted-foreground">{it.body}</p>}</li>\n      ))}\n    </ol>`,
    Table: (k, n) => `<Table>\n      <TableHeader><TableRow>${list(n.columns).map((c) => `<TableHead>${esc(c)}</TableHead>`).join('')}</TableRow></TableHeader>\n      <TableBody>\n        {${v(n.rows)}.map((row, i) => (\n          <TableRow key={i}>{row.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}</TableRow>\n        ))}\n      </TableBody>\n    </Table>`,
  },
}
/**
 * A dynamic value becomes a data-model read in the generated component.
 *
 * Inside a collection template the pointers are RELATIVE (`name`, not
 * `/centres/0/name`), and the artefact is unrolled per item rather than looped —
 * so each copy has to carry the scope it was resolved in, or every one of them
 * reads the same wrong thing. Absolute pointers are rewritten here; a function
 * gets the scope as its third argument, because formatString interpolates
 * pointers out of its own string at runtime and only it can resolve them.
 *
 * SCOPE is module-level because emit() walks synchronously and v() is called
 * from inside the jsx tables — threading it through forty call sites would say
 * nothing extra and get out of step the first time one was missed.
 */
let SCOPE = null
const abs = (path) => (path.startsWith('/') || !SCOPE ? path : '/' + [...SCOPE.path, ...path.split('/')].join('/'))
function v(val) {
  if (val && typeof val === 'object' && 'path' in val) return `read(data, '${abs(val.path)}')`
  if (val && typeof val === 'object' && 'call' in val) {
    return `fn.${val.call}(${JSON.stringify(val.args)}, data, ${SCOPE ? JSON.stringify('/' + SCOPE.path.join('/')) : 'null'})`
  }
  return JSON.stringify(val)
}

export const BINDINGS = { kit, tailwind: tw, daisyui: daisy, shadcn }

/** The artefact you copy. For shadcn: a real component file. For the rest: markup. */
export function emit(binding, tree, walk) {
  if (binding.id !== 'shadcn') {
    return walk(tree, (n, k, r, ka) => binding.h(n, k, r, ka) ?? `<!-- ${n.component}: not in this binding -->`)
  }
  const mods = new Map(), icons = new Set()
  const body = walk(tree, (n, k, r, ka) => {
    const f = binding.jsx[n.component]
    if (!f) return `{/* ${n.component}: not in this binding */}`
    for (const [mod, names] of Object.entries(binding.imports[n.component] ?? {})) {
      if (!mods.has(mod)) mods.set(mod, new Set())
      for (const name of names) mods.get(mod).add(name)
    }
    if (n.component === 'Icon') icons.add(LUCIDE[n.name] ?? 'Circle')
    SCOPE = n.scope ?? null
    const out = f(k, n, ka)
    SCOPE = null
    return out
  })
  const used = [...mods].sort(([a], [b]) => a.localeCompare(b))
    .map(([mod, names]) => `import { ${[...names].sort().join(', ')} } from '@/components/ui/${mod}'`)
  if (icons.size) used.push(`import { ${[...icons].sort().join(', ')} } from 'lucide-react'`)
  return `/* GENERATED — the A2UI renderer binding for shadcn/ui.
 * The catalog is schema-only; this file is the other half, and you own it.
 * read(data, pointer) resolves a JSON Pointer against the surface data model. */
${used.join('\n')}
import { read } from '@/lib/a2ui'

export function Answer({ data }: { data: unknown }) {
  return (
${body.split('\n').map((l) => '    ' + l).join('\n')}
  )
}
`
}
