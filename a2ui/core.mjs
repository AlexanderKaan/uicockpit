/**
 * The A2UI core — library-agnostic. This is the part that is the same whatever
 * you render with, and the part a one-shot generation gets wrong: the stream is
 * a flat adjacency list with a SEPARATE data model, and every property may be a
 * literal, a JSON-Pointer binding, or a function call — resolved against a scope
 * that changes inside a collection.
 */

/** RFC 6901 JSON Pointer, plus relative paths that resolve inside an item scope. */
export function readPath(model, path, scope) {
  const parts = path.startsWith('/')
    ? path.slice(1).split('/')
    : [...(scope?.path ?? []), ...path.split('/')]
  let cur = model
  for (const raw of parts) {
    if (cur == null) return undefined
    const key = raw.replace(/~1/g, '/').replace(/~0/g, '~')   // pointer escaping
    cur = Array.isArray(cur) ? cur[Number(key)] : cur[key]
  }
  return cur
}

/** A property is a literal, {path}, or {call,args}. */
export function resolve(value, model, scope, functions) {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return value
  if ('path' in value) return readPath(model, value.path, scope)
  if ('call' in value) {
    const fn = functions[value.call]
    if (!fn) throw new Error(`A2UI: unknown function "${value.call}"`)
    const args = Object.fromEntries(Object.entries(value.args ?? {}).map(([k, v]) => [k, resolve(v, model, scope, functions)]))
    return fn(args, { model, scope })
  }
  return value
}

export const FUNCTIONS = {
  // ${/pointer} interpolation — the one function the basic catalog leans on
  formatString: ({ value }, { model, scope }) =>
    String(value).replace(/\$\{([^}]+)\}/g, (_, p) => String(readPath(model, p, scope) ?? '')),
}

/**
 * Read a pasted stream liberally, then say precisely what is wrong.
 *
 * A2UI is JSONL — one message per line — but people paste what they have: a
 * pretty-printed object out of a log, an array of messages, a single message.
 * All three are accepted; anything else gets the line number, because "invalid
 * JSON" on a 60-line paste is not a message that helps anyone.
 */
export function parseStream(text) {
  const t = text.trim()
  if (!t) return []
  try { const v = JSON.parse(t); return Array.isArray(v) ? v : [v] } catch { /* not one document — try JSONL */ }
  return t.split('\n').filter((l) => l.trim()).map((l, i) => {
    try { return JSON.parse(l) } catch (e) {
      throw new Error(`Line ${i + 1} is not valid JSON.\n\nA2UI is JSONL: one complete message per line. Paste the whole thing as a JSON array if your messages span several lines.\n\n${e.message}`)
    }
  })
}

/** Apply a JSONL stream to surface state. Six message types; we implement four. */
export function applyStream(lines) {
  const surfaces = new Map()
  for (const line of lines) {
    const msg = typeof line === 'string' ? JSON.parse(line) : line
    if (msg.createSurface) {
      const { surfaceId, catalogId, dataModel = {} } = msg.createSurface
      surfaces.set(surfaceId, { catalogId, components: new Map(), model: structuredClone(dataModel) })
    } else if (msg.updateComponents) {
      const s = surfaces.get(msg.updateComponents.surfaceId)
      for (const c of msg.updateComponents.components) s.components.set(c.id, c)
    } else if (msg.updateDataModel) {
      const { surfaceId, path, value } = msg.updateDataModel
      const s = surfaces.get(surfaceId)
      writePath(s.model, path, value)
    } else if (msg.deleteSurface) {
      surfaces.delete(msg.deleteSurface.surfaceId)
    }
  }
  return surfaces
}

function writePath(model, path, value) {
  const parts = path.slice(1).split('/').filter(Boolean)
  if (!parts.length) return Object.assign(model, value)
  let cur = model
  for (const key of parts.slice(0, -1)) cur = (cur[key] ??= {})
  cur[parts.at(-1)] = value
}

/* Which properties carry component ids — READ FROM THE CATALOG, never hardcoded.
 * The Basic Catalog scatters them: `child` (Card, Button), `children` (Row,
 * Column, List), `trigger` and `content` (Modal), and one nested inside an
 * array at `tabs[].child`. Guessing those names is how a renderer silently
 * loses half a tree. A JSON Schema marks every one of them with $defs/Child or
 * $defs/ChildList, so a catalog nobody has seen before still gives up its tree. */
const CHILD = /\/\$defs\/Child$/
const CHILDLIST = /\/\$defs\/ChildList$/
export const propsOf = (def) => Object.assign({}, ...(def.allOf ?? []).map((p) => p.properties ?? {}), def.properties ?? {})
/** Everything a component MUST carry, wherever the schema chose to say it. */
export const requiredOf = (def) => [...new Set([...(def?.required ?? []), ...(def?.allOf ?? []).flatMap((p) => p.required ?? [])])]

/* Which properties name a SIDE EFFECT, and which values the catalog admits for
 * them. A2UI marks them with $defs/Action and our own catalog with x-action —
 * and in both cases the catalog may or may not go on to say WHICH actions
 * exist. That difference is the whole point: a button that names an action the
 * catalog never enumerated is a button no renderer can judge. */
export function actionsOf(catalog) {
  const props = [], declared = new Set()
  for (const [name, def] of Object.entries(catalog?.components ?? {})) {
    for (const [prop, spec] of Object.entries(propsOf(def))) {
      const isAction = spec['x-action'] === true || (typeof spec.$ref === 'string' && spec.$ref.endsWith('/Action'))
      if (!isAction) continue
      const values = Array.isArray(spec.enum) ? spec.enum : null
      props.push({ component: name, prop, values })
      for (const v of values ?? []) declared.add(v)
    }
  }
  return { props, declared: [...declared] }
}

export function childRefs(catalog) {
  const map = new Map()
  for (const [name, def] of Object.entries(catalog?.components ?? {})) {
    const refs = []
    for (const [prop, s] of Object.entries(propsOf(def))) {
      if (CHILD.test(s.$ref ?? '')) refs.push({ prop })
      else if (CHILDLIST.test(s.$ref ?? '')) refs.push({ prop, many: true })
      else for (const [k, sub] of Object.entries(s.items?.properties ?? {})) if (CHILD.test(sub.$ref ?? '')) refs.push({ prop, item: k })
    }
    if (refs.length) map.set(name, refs)
  }
  return map
}

/** What our own catalog uses, so a tree still builds with no schema in hand. */
const DEFAULT_REFS = [{ prop: 'children', many: true }, { prop: 'child' }]

/**
 * Flat map + root → a tree the binding can walk. Cycles and gaps are errors,
 * not silence.
 *
 * A ChildList is either an array of ids or a TEMPLATE — `{path, componentId}` —
 * which renders one copy per item in the collection, with relative paths
 * resolving inside that item. That scope travels down the whole subtree, so it
 * is carried on the node rather than recomputed.
 */
export function buildTree(components, id = 'root', opts = {}) {
  const { refs, model = {}, scope = null, seen = new Set() } = opts
  const node = components.get(id)
  if (!node) throw new Error(`A2UI: component "${id}" referenced but never sent`)
  if (seen.has(id)) throw new Error(`A2UI: cycle at "${id}"`)
  const next = new Set(seen).add(id)
  const sub = (kidId, kidScope = scope) => buildTree(components, kidId, { refs, model, scope: kidScope, seen: next })

  const kids = []
  for (const ref of refs?.get(node.component) ?? DEFAULT_REFS) {
    const val = node[ref.prop]
    if (val == null) continue
    if (ref.item) { for (const entry of val) if (entry?.[ref.item]) kids.push(sub(entry[ref.item])) ; continue }
    if (typeof val === 'string') { kids.push(sub(val)); continue }
    if (Array.isArray(val)) { for (const kidId of val) kids.push(sub(kidId)); continue }
    if (val.componentId) {                                   // a template over a collection
      const items = readPath(model, val.path, scope) ?? []
      const base = val.path.startsWith('/') ? val.path.slice(1).split('/') : [...(scope?.path ?? []), ...val.path.split('/')]
      items.forEach((_, i) => kids.push(sub(val.componentId, { path: [...base, String(i)] })))
    }
  }
  return { ...node, scope, kids }
}

/** Render a tree with a per-node function: fn(node, renderedKids, resolveValue). */
export function walk(tree, fn, model = {}, functions = FUNCTIONS) {
  const one = (n) => {
    /* the kids ARRAY as well as the joined string: Tabs pairs each child with a
       title, Modal keeps trigger and content apart, and neither can be done
       from one concatenated blob */
    const kids = (n.kids ?? []).map(one)
    return fn(n, kids.join('\n'), (val) => resolve(val, model, n.scope ?? null, functions), kids)
  }
  return one(tree)
}
