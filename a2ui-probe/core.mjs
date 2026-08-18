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

/** Flat map + root → a tree the binding can walk. Cycles and gaps are errors, not silence. */
export function buildTree(components, id = 'root', seen = new Set()) {
  const node = components.get(id)
  if (!node) throw new Error(`A2UI: component "${id}" referenced but never sent`)
  if (seen.has(id)) throw new Error(`A2UI: cycle at "${id}"`)
  seen.add(id)
  const kids = node.children ?? (node.child ? [node.child] : [])
  return { ...node, kids: kids.map((k) => buildTree(components, k, new Set(seen))) }
}
