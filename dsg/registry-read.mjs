/**
 * SHADCN, READ FROM SHADCN.
 *
 * Every other kit here has its class names read out of the package it ships.
 * shadcn was the exception: its strings were typed into wall-bindings.mjs from
 * a registry snapshot, which made it the one kit in the tool that could go
 * stale — and it had. We were carrying about half of each component's classes,
 * and the half we dropped was always the same one: the STATES. Their button
 * says `focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50
 * aria-invalid:border-destructive`; ours said none of it, so a shadcn button on
 * our wall had no focus ring, no disabled state and no invalid state.
 *
 * shadcn is not an npm package — it is a registry of source files you copy in,
 * which is why `npx shadcn add button` is what the export tells you to run. So
 * the registry is what gets read, and the same thing that lands in your project
 * is the thing on the wall.
 *
 * Their source has exactly two shapes and both are string literals:
 *
 *   cva("base", { variants: { variant: {…}, size: {…} } })   button, badge, alert
 *   data-slot="card-title" className={cn("…", className)}    everything else
 *
 * Nothing here interprets TSX. It finds those two shapes and takes the strings.
 */

/** The style the registry serves. Their site runs one it does not publish; this
 *  is what `shadcn add` really installs, which is what we may claim to ship. */
export const STYLE = 'new-york-v4'
export const registryUrl = (name, style = STYLE) => `https://ui.shadcn.com/r/styles/${style}/${name}.json`

/** The text between a bracket and its match, brackets excluded. */
function balanced(src, at, open = '(', close = ')') {
  if (src[at] !== open) return ''
  let depth = 0, quote = null
  for (let i = at; i < src.length; i++) {
    const c = src[i]
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue }
    if (c === open) depth++
    else if (c === close && --depth === 0) return src.slice(at + 1, i)
  }
  return ''
}

/* A string that is the whole value, not one arm of a condition. `cn("a", cond &&
 * "b")` means "b" is a state we cannot be in, and copying it would paint a
 * disabled button as always disabled. */
const plainLiterals = (src) => {
  const out = []
  for (const m of src.matchAll(/(?:^|[^&?:])\s*"((?:[^"\\]|\\.)*)"/g)) {
    const t = m[1].trim()
    if (t && !/^[A-Za-z0-9_-]*$/.test(t) || t.includes(' ') || t.includes('-')) out.push(t)
  }
  return out
}

/** `name: "value"` pairs at the top level of an object body. */
const pairs = (body) => {
  const out = {}
  for (const m of body.matchAll(/(?:^|[,{\s])["']?([A-Za-z][A-Za-z0-9_-]*)["']?:\s*\n?\s*"((?:[^"\\]|\\.)*)"/g)) out[m[1]] = m[2].replace(/\s+/g, ' ').trim()
  return out
}

/** One component, as the three things we can use from it. */
export function readSource(src) {
  const out = { base: null, variants: {}, cva: {}, slots: {} }

  /* EVERY cva in the file, by the name it is declared under. One file often has
     two — sidebar.tsx declares both the sidebar and its menu button — and taking
     only the first lost the one the wall actually needs. */
  for (const m of src.matchAll(/(?:const|let)\s+([A-Za-z][A-Za-z0-9_]*)\s*=\s*cva\(/g)) {
    const body = balanced(src, src.indexOf('(', m.index + m[0].length - 1))
    const first = /"((?:[^"\\]|\\.)*)"/.exec(body)
    const entry = { base: first ? first[1].replace(/\s+/g, ' ').trim() : null, variants: {} }
    const vAt = body.indexOf('variants:')
    if (vAt > -1) {
      const vBody = balanced(body, body.indexOf('{', vAt), '{', '}')
      for (const g of vBody.matchAll(/([A-Za-z][A-Za-z0-9_]*):\s*\{/g)) {
        const group = balanced(vBody, vBody.indexOf('{', g.index + g[0].length - 1), '{', '}')
        const got = pairs(group)
        if (Object.keys(got).length) entry.variants[g[1]] = got
      }
    }
    if (entry.base) out.cva[m[1]] = entry
  }
  const firstCva = Object.values(out.cva)[0]
  if (firstCva) { out.base = firstCva.base; out.variants = firstCva.variants }

  for (const m of src.matchAll(/data-slot="([a-z0-9-]+)"/g)) {
    const from = m.index + m[0].length
    const cn = src.indexOf('className=', from)
    if (cn < 0) continue
    const nextSlot = src.indexOf('data-slot="', from)
    if (nextSlot > -1 && nextSlot < cn) continue          // this element has none
    const after = src.slice(cn + 'className='.length)
    let classes = null
    if (after[0] === '"') {
      classes = /^"((?:[^"\\]|\\.)*)"/.exec(after)?.[1]
    } else if (after[0] === '{') {
      const inner = balanced(after, 0, '{', '}')
      const cnAt = inner.indexOf('cn(')
      if (cnAt > -1) classes = plainLiterals(balanced(inner, inner.indexOf('(', cnAt))).join(' ')
    }
    classes = (classes ?? '').replace(/\s+/g, ' ').trim()
    if (classes) out.slots[m[1]] = classes
  }
  return out
}

/** The whole set, from their registry. Nothing is cached: a build reads today's. */
export async function readParts(names, style = STYLE) {
  const parts = {}
  for (const name of names) {
    const r = await fetch(registryUrl(name, style))
    if (!r.ok) throw new Error(`shadcn's registry has no ${name} in ${style} (${r.status})`)
    const j = await r.json()
    const src = (j.files ?? []).map((f) => f.content ?? '').join('\n')
    const got = readSource(src)
    if (!got.base && !Object.keys(got.slots).length) throw new Error(`read nothing usable out of ${name}`)
    /* their own registry says what a component is built on — every one of these
       declares radix-ui, which is the evidence for where it sits in a stack */
    parts[name] = { ...got, needs: j.dependencies ?? [] }
  }
  return parts
}
