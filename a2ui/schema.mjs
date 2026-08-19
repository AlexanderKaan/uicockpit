/**
 * THE CATALOG AS TYPES YOU CAN VALIDATE WITH.
 *
 * The pattern the industry has converged on — a controlled vocabulary, a
 * component registry, runtime validation — is normally hand-written: a
 * TypeScript union, a Zod schema, a `parse` that drops what it does not
 * recognise. Hand-writing it is where three things go wrong, and all three are
 * fixed by generating it from the catalog instead:
 *
 *  · A2UI values are NOT plain. Every property may be a literal, a JSON-Pointer
 *    binding, or a function call, and a hand-written `z.string()` rejects two of
 *    the three. The generated schema models all three, once.
 *  · A schema written by hand drifts from the catalog the agent was given. This
 *    one cannot: it IS the catalog.
 *  · The usual `parse` returns [] on failure and `null` for an unknown type, so
 *    the whole answer — or a piece of it — vanishes with nothing said. The
 *    generated one returns what it rejected AND why, so your renderer can show
 *    a refusal instead of a hole.
 *
 * What it will not do is pretend. A property whose shape the generator cannot
 * read is emitted as `z.unknown()` with a comment naming it, never quietly
 * dropped and never guessed at.
 */

import { propsOf, requiredOf, actionsOf } from './core.mjs'

const ref = (s) => (typeof s?.$ref === 'string' ? s.$ref.split('/').pop() : null)
const id = (s) => /^[A-Za-z_$][\w$]*$/.test(s)

/* The named types A2UI's common_types.json defines, as Zod. Written out rather
 * than fetched: the catalog $refs them by URL, and a generated file that needs
 * a network round-trip to be readable is not a file you own. */
const PRELUDE = `import { z } from 'zod'

/* Every A2UI property is one of three things, and a hand-written schema
 * usually remembers only the first. */
const Path = z.object({ path: z.string() })
const Call = z.object({ call: z.string(), args: z.record(z.string(), z.unknown()).optional() })
const dynamic = (v: z.ZodTypeAny) => z.union([v, Path, Call])

const DynamicString = dynamic(z.string())
const DynamicNumber = dynamic(z.number())
const DynamicBoolean = dynamic(z.boolean())
const DynamicStringList = dynamic(z.array(z.string()))

/* Children are ids, never inline components — either a fixed list, or a
 * template rendered once per item of a collection. */
const Child = z.string()
const ChildList = z.union([z.array(z.string()), z.object({ path: z.string(), componentId: z.string() })])
`

const BY_REF = { DynamicString: 'DynamicString', DynamicNumber: 'DynamicNumber', DynamicBoolean: 'DynamicBoolean',
  DynamicStringList: 'DynamicStringList', Child: 'Child', ChildList: 'ChildList' }

/** One property's schema, or null with the reason it could not be read. */
function zodFor(spec, actions) {
  const r = ref(spec)
  if (r && BY_REF[r]) return { z: BY_REF[r] }
  /* An Action names a side effect. The catalog may enumerate which ones exist —
   * and if it does not, that is worth saying out loud in the file. */
  if (r === 'Action' || spec['x-action']) {
    const values = Array.isArray(spec.enum) ? spec.enum : actions
    return values?.length
      ? { z: `z.enum([${values.map((a) => JSON.stringify(a)).join(', ')}])` }
      : { z: 'z.string()', open: 'the catalog does not enumerate its actions — authorise this on your side, against ids you own' }
  }
  if (Array.isArray(spec.enum)) return { z: `z.enum([${spec.enum.map((v) => JSON.stringify(v)).join(', ')}])` }
  if (Array.isArray(spec.oneOf)) {
    const values = spec.oneOf.flatMap((o) => o.enum ?? [])
    if (values.length) return { z: `z.enum([${values.map((v) => JSON.stringify(v)).join(', ')}])` }
  }
  if (spec.type === 'string') return { z: 'z.string()' }
  if (spec.type === 'number' || spec.type === 'integer') return { z: 'z.number()' }
  if (spec.type === 'boolean') return { z: 'z.boolean()' }
  if (spec.type === 'array') {
    const inner = spec.items ? zodFor(spec.items, actions) : null
    return inner?.z ? { z: `z.array(${inner.z})` } : { z: 'z.array(z.unknown())', note: 'the items of this array have no readable shape' }
  }
  if (spec.type === 'object' && spec.properties) {
    const fields = Object.entries(spec.properties).map(([k, v]) => {
      const inner = zodFor(v, actions)
      const opt = (spec.required ?? []).includes(k) ? '' : '.optional()'
      return `${id(k) ? k : JSON.stringify(k)}: ${inner.z}${opt}`
    })
    return { z: `z.object({ ${fields.join(', ')} })` }
  }
  if (ref(spec)) return { z: 'z.unknown()', note: `$ref ${ref(spec)} is defined outside this catalog` }
  return { z: 'z.unknown()', note: 'no type in the catalog' }
}

/**
 * @param catalog  the catalog JSON
 * @param actions  the action names the catalog declares, if any
 */
export function emitSchema(catalog) {
  const names = Object.keys(catalog.components ?? {})
  const actions = actionsOf(catalog).declared
  const notes = [], open = []
  const blocks = names.map((name) => {
    const def = catalog.components[name]
    const props = propsOf(def)
    const required = new Set(requiredOf(def))
    const lines = []
    for (const [prop, spec] of Object.entries(props)) {
      if (prop === 'component') continue
      const { z, note, open: unbounded } = zodFor(spec, actions)
      if (note) { notes.push(`${name}.${prop}`); lines.push(`  /* ${note} */`) }
      if (unbounded) { open.push(`${name}.${prop}`); lines.push(`  /* ${unbounded} */`) }
      lines.push(`  ${id(prop) ? prop : JSON.stringify(prop)}: ${z}${required.has(prop) ? '' : '.optional()'},`)
    }
    const doc = def.description ? `/** ${def.description.replace(/\*\//g, '*\\/').split('\n')[0]} */\n` : ''
    return `${doc}export const ${name} = z.object({
  id: z.string(),
  component: z.literal(${JSON.stringify(name)}),
${lines.join('\n')}
})`
  })

  return `/* GENERATED from ${catalog.catalogId ?? 'this catalog'}
 *
 * The vocabulary your agent may use, as types you can validate with — the union,
 * the schemas, and a parse that tells you what it REFUSED instead of quietly
 * returning an empty array. Generated from the catalog, so it cannot drift from
 * what the agent was actually given.
 *
 * You own this file. Regenerate it when the catalog changes.
 */
${PRELUDE}
${blocks.join('\n\n')}

/** Everything this catalog admits. A component outside it is not a component. */
export const A2UIComponent = z.discriminatedUnion('component', [
${names.map((n) => `  ${n},`).join('\n')}
])
export type A2UIComponent = z.infer<typeof A2UIComponent>
export const COMPONENT_NAMES = [${names.map((n) => JSON.stringify(n)).join(', ')}] as const
${actions.length ? `
/** The side effects this catalog declares. Anything else is not yours to run. */
export const ACTIONS = [${actions.map((a) => JSON.stringify(a)).join(', ')}] as const
export type Action = (typeof ACTIONS)[number]
` : `
/* This catalog does not enumerate its actions, so nothing here can check one.
 * Keep an action registry on the application side and authorise against ids you
 * own — a rendered button is not permission to run anything. */
`}
/**
 * Parse an updateComponents payload.
 *
 * Note what this does NOT do: it does not return [] when something is wrong,
 * and it does not drop an unrecognised component on the floor. Both of those
 * make a piece of the answer disappear with nothing said — the reader sees a
 * gap and cannot tell whether the agent said nothing or the app refused it.
 * Render \`refused\` in place, as a refusal.
 */
export function parseComponents(input: unknown): {
  admitted: A2UIComponent[]
  refused: Array<{ index: number; id?: string; component?: string; why: string }>
} {
  const admitted: A2UIComponent[] = []
  const refused: Array<{ index: number; id?: string; component?: string; why: string }> = []
  if (!Array.isArray(input)) return { admitted, refused: [{ index: -1, why: 'components is not an array' }] }
  input.forEach((raw, index) => {
    const result = A2UIComponent.safeParse(raw)
    if (result.success) { admitted.push(result.data); return }
    const name = (raw as { component?: string })?.component
    refused.push({
      index,
      id: (raw as { id?: string })?.id,
      component: name,
      why: COMPONENT_NAMES.includes(name as never)
        ? result.error.issues.map((i) => \`\${i.path.join('.')}: \${i.message}\`).join('; ')
        : \`"\${name ?? '(no component)'}" is not in this catalog\`,
    })
  })
  return { admitted, refused }
}
${notes.length ? `
/* Properties this generator could not read from the catalog, kept as unknown
 * rather than guessed: ${notes.join(', ')}. */
` : ''}${open.length ? `
/* Unbounded side effects: ${open.join(', ')} accept any string, because the
 * catalog names no set of actions. Nothing downstream can tell an allowed
 * action from an invented one — that check has to live in your application. */` : ''}
`
}
