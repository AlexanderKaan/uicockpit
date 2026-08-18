/**
 * A BINDING IS A TABLE, not a program.
 *
 * That is the whole reason a builder is possible: A2UI keeps the catalog
 * (schema) and the renderer (implementation) apart on purpose, so "support
 * another library" means adding a mapping — not writing a renderer. Each entry
 * says how one catalog component becomes markup in that stack, and `emit` turns
 * the same table into the code you copy into your repo and own.
 *
 * `h(node, ctx)` renders for the PREVIEW (always HTML, so every stack can be
 * seen side by side without a build). `emit(tree)` produces the ARTEFACT —
 * JSX for shadcn, HTML for the class-based stacks.
 */

const esc = (s) => String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))
const md = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
const list = (v) => (Array.isArray(v) ? v : [])

/* ── binding 1 · our kit ─────────────────────────────────────────────────── */
const KIT_TONE = { info: 'info', success: 'success', warn: 'warn', danger: 'danger', neutral: 'neutral' }
const kit = {
  id: 'kit', label: 'UIcockpit kit', note: 'plain CSS classes, no framework — 3.4 kB, works in any renderer',
  h(n, k, r) {
    switch (n.component) {
      case 'Card':   return `<div class="card">${k}</div>`
      case 'Column': return `<div class="l-stack">${k}</div>`
      case 'Row':    return `<div class="l-cluster">${k}</div>`
      case 'Heading':return `<div class="page-head"><div class="page-head__titles">${n.level === 3
        ? `<h3 class="section__title">${esc(r(n.text))}</h3>` : `<h2 class="page-head__title">${esc(r(n.text))}</h2>`}${
        n.sub ? `<p class="page-head__sub">${esc(r(n.sub))}</p>` : ''}</div></div>`
      case 'Text':   return `<div class="prose"><p>${md(r(n.text))}</p></div>`
      case 'Badge':  return `<span class="badge badge--${KIT_TONE[n.tone] ?? 'neutral'}"><span class="badge__dot"></span>${esc(r(n.text))}</span>`
      case 'Button': return `<button class="btn btn--${n.variant ?? 'primary'}" type="button">${esc(r(n.label))}</button>`
      case 'Callout':return `<div class="alert alert--${n.tone ?? 'info'}" role="status"><div class="alert__body">${
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
const tw = {
  id: 'tailwind', label: 'Tailwind CSS', note: 'utility classes only — no component library, works with any renderer',
  h(n, k, r) {
    switch (n.component) {
      case 'Card':   return `<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">${k}</div>`
      case 'Column': return `<div class="flex flex-col gap-4">${k}</div>`
      case 'Row':    return `<div class="flex flex-wrap items-center gap-2">${k}</div>`
      case 'Heading':return `<div class="flex flex-col gap-1">${n.level === 3
        ? `<h3 class="text-base font-semibold text-gray-900">${esc(r(n.text))}</h3>`
        : `<h2 class="text-xl font-semibold tracking-tight text-gray-900">${esc(r(n.text))}</h2>`}${
        n.sub ? `<p class="text-sm text-gray-500">${esc(r(n.sub))}</p>` : ''}</div>`
      case 'Text':   return `<p class="text-sm leading-relaxed text-gray-700">${md(r(n.text))}</p>`
      case 'Badge':  return `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TW_TONE[n.tone] ?? TW_TONE.neutral}">${esc(r(n.text))}</span>`
      case 'Button': return `<button type="button" class="${n.variant === 'ghost' ? 'text-gray-700 hover:bg-gray-100' : n.variant === 'secondary' ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'} inline-flex h-9 items-center rounded-md px-4 text-sm font-medium">${esc(r(n.label))}</button>`
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

/* ── binding 3 · shadcn/ui ───────────────────────────────────────────────── */
const SC_BADGE = { info: 'secondary', success: 'default', warn: 'outline', danger: 'destructive', neutral: 'secondary' }
const shadcn = {
  id: 'shadcn', label: 'shadcn/ui', note: 'your own components, copied into your repo — the generated file imports them',
  imports: {
    Card: "import { Card, CardContent } from '@/components/ui/card'",
    Badge: "import { Badge } from '@/components/ui/badge'",
    Button: "import { Button } from '@/components/ui/button'",
    Table: "import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'",
  },
  /* preview: shadcn IS Tailwind classes over Radix, so the preview borrows the
     class composition shadcn ships. The artefact below imports the real ones. */
  h(n, k, r) { return tw.h(n, k, r) },
  jsx: {
    Card:   (k) => `<Card><CardContent className="pt-6">${k}</CardContent></Card>`,
    Column: (k) => `<div className="flex flex-col gap-4">${k}</div>`,
    Row:    (k) => `<div className="flex flex-wrap items-center gap-2">${k}</div>`,
    Heading:(k, n) => n.level === 3 ? `<h3 className="text-base font-semibold">{${v(n.text)}}</h3>` : `<div><h2 className="text-xl font-semibold tracking-tight">{${v(n.text)}}</h2>${n.sub ? `<p className="text-sm text-muted-foreground">{${v(n.sub)}}</p>` : ''}</div>`,
    Text:   (k, n) => `<p className="text-sm leading-relaxed">{${v(n.text)}}</p>`,
    Badge:  (k, n) => `<Badge variant="${SC_BADGE[n.tone] ?? 'secondary'}">{${v(n.text)}}</Badge>`,
    Button: (k, n) => `<Button${n.variant && n.variant !== 'primary' ? ` variant="${n.variant === 'ghost' ? 'ghost' : 'secondary'}"` : ''}>{${v(n.label)}}</Button>`,
    Callout:(k, n) => `<div role="status" className="rounded-lg border p-4 text-sm">${n.title ? `<strong className="block">{${v(n.title)}}</strong>` : ''}{${v(n.text)}}</div>`,
    SummaryList: (k, n) => `<dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">\n      {${v(n.items)}.map((it, i) => (\n        <div key={i} className="contents">\n          <dt className="text-muted-foreground">{it.label}</dt>\n          <dd className="font-medium">{it.value}</dd>\n        </div>\n      ))}\n    </dl>`,
    TaskList: (k, n) => `<ol className="divide-y rounded-lg border">\n      {${v(n.items)}.map((it, i) => (\n        <li key={i} className="flex items-center justify-between gap-4 px-4 py-3">\n          <span className="flex flex-col">\n            <span className={it.locked ? 'text-muted-foreground' : 'font-medium underline underline-offset-4'}>{it.name}</span>\n            {it.hint && <span className="text-xs text-muted-foreground">{it.hint}</span>}\n          </span>\n          <Badge variant="secondary">{it.status}</Badge>\n        </li>\n      ))}\n    </ol>`,
    Steps: (k, n) => `<ol className="flex flex-col gap-4 border-l-2 pl-5">\n      {${v(n.items)}.map((it, i) => (\n        <li key={i}><h3 className="text-sm font-semibold">{it.title}</h3>{it.body && <p className="text-sm text-muted-foreground">{it.body}</p>}</li>\n      ))}\n    </ol>`,
    Table: (k, n) => `<Table>\n      <TableHeader><TableRow>${list(n.columns).map((c) => `<TableHead>${esc(c)}</TableHead>`).join('')}</TableRow></TableHeader>\n      <TableBody>\n        {${v(n.rows)}.map((row, i) => (\n          <TableRow key={i}>{row.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}</TableRow>\n        ))}\n      </TableBody>\n    </Table>`,
  },
}
/** A dynamic value becomes a data-model read in the generated component. */
function v(val) {
  if (val && typeof val === 'object' && 'path' in val) return `read(data, '${val.path}')`
  if (val && typeof val === 'object' && 'call' in val) return `fn.${val.call}(${JSON.stringify(val.args)}, data)`
  return JSON.stringify(val)
}

export const BINDINGS = { kit, tailwind: tw, shadcn }

/** The artefact you copy. For shadcn: a real component file. For the rest: markup. */
export function emit(binding, tree, walk) {
  if (binding.id !== 'shadcn') {
    return walk(tree, (n, k, r) => binding.h(n, k, r) ?? `<!-- ${n.component}: not in this binding -->`)
  }
  const used = new Set()
  const body = walk(tree, (n, k) => {
    const f = binding.jsx[n.component]
    if (!f) return `{/* ${n.component}: not in this binding */}`
    if (binding.imports[n.component]) used.add(binding.imports[n.component])
    if (n.component === 'Badge' && binding.imports.Badge) used.add(binding.imports.Badge)
    return f(k, n)
  })
  return `/* GENERATED — the A2UI renderer binding for shadcn/ui.
 * The catalog is schema-only; this file is the other half, and you own it.
 * read(data, pointer) resolves a JSON Pointer against the surface data model. */
${[...used].sort().join('\n')}
import { read } from '@/lib/a2ui'

export function Answer({ data }: { data: unknown }) {
  return (
${body.split('\n').map((l) => '    ' + l).join('\n')}
  )
}
`
}
