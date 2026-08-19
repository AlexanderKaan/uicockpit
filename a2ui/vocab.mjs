/**
 * READ A VOCABULARY — whatever form it arrived in — AND SAY WHAT IT CANNOT SAY.
 *
 * The catalog you hand an agent is the ceiling on every screen it will ever
 * draw, and almost nobody reads theirs back. This is the reader: an A2UI
 * catalog, a Zod schema, or a TypeScript union — the three shapes this pattern
 * actually ships in — reduced to the same thing: components, their properties,
 * and which of those can carry TEXT, name a SIDE EFFECT, or say nothing at all.
 *
 * Then four questions that need NO semantic annotation, and are therefore
 * answerable about a vocabulary nobody has ever described to us:
 *
 *   1. can anything in it be a heading?
 *   2. which components cannot carry text at all?
 *   3. which text properties are OPTIONAL — i.e. a valid answer may omit them?
 *   4. which properties name a side effect nobody enumerated?
 *
 * Everything past those four needs a reading of what the components MEAN, and
 * this file will not guess at it. What it cannot parse it says it cannot parse.
 */
import { propsOf, requiredOf } from './core.mjs'

const ACTIONISH = /^(action|actionid|action_id|actionname|actiontype|onclick|onpress|ontap|onselect|onsubmit|handler|event|command|intent|dispatch)$/i
const HEADINGISH = /^(level|headinglevel|as|hlevel)$/i
/* A string is not automatically TEXT. A url is a string; so is an id. What
 * matters is whether a human is meant to read it — and that is a reading of
 * property NAMES, which this file says out loud rather than dressing up as
 * analysis. Where a catalog states its own semantics, that wins over the guess. */
const URLISH = /^(url|src|href|uri|link|poster|posterurl|imageurl|videourl|audiourl|id|componentid|path|icon)$/i
const TEXTISH = /(label|text|title|name|alt|description|caption|placeholder|heading|message|content|hint|help|legend|summary)/i
const NAMEISH = /^(label|alt|alttext|description|title|name|heading|legend|caption|text)$/i

/* ── A2UI / JSON Schema ──────────────────────────────────────────────────── */
function fromCatalog(catalog) {
  const components = Object.entries(catalog.components ?? {}).map(([name, def]) => {
    const required = new Set(requiredOf(def))
    const props = Object.entries(propsOf(def)).filter(([p]) => p !== 'component').map(([prop, spec]) => {
      const ref = typeof spec.$ref === 'string' ? spec.$ref.split('/').pop() : null
      const values = Array.isArray(spec.enum) ? spec.enum : Array.isArray(spec.oneOf) ? spec.oneOf.flatMap((o) => o.enum ?? []) : null
      const action = spec['x-action'] === true || ref === 'Action' || ACTIONISH.test(prop)
      const str = !action && !values?.length && (ref === 'DynamicString' || spec.type === 'string')
      /* Tabs hides its children one level down, in `tabs[].child` — a container
         that looks childless is a container we would wrongly call mute. */
      const nested = Object.values(spec.items?.properties ?? {}).some((x) => /\/Child$/.test(x.$ref ?? ''))
      const child = ref === 'Child' || ref === 'ChildList' || nested || /^(child|children)$/.test(prop)
      return { name: prop, optional: !required.has(prop), text: str && !URLISH.test(prop) && TEXTISH.test(prop),
        string: str, action, child, values: values?.length ? values : null }
    })
    return { name, props, declaredName: def['x-a11y']?.name ?? null,
      /* a list's text lives in its items, not in a property of its own */
      collection: !!def['x-a11y']?.items }
  })
  return { kind: 'A2UI catalog', components, note: null }
}

/* ── source text: Zod and TypeScript ─────────────────────────────────────
 * A brace-matching scan, not a pattern. A regex for "a block" cannot tell the
 * closing brace of a nested z.object from the closing brace of its parent, and
 * gets the properties of the wrong component — the same mistake that made this
 * project write a tokenizer for its own stylesheets. */
function blockAt(src, open) {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') { depth--; if (!depth) return { body: src.slice(open + 1, i), end: i } }
  }
  return null
}

/** Top-level `key: value` pairs of one block, values kept whole. */
function pairs(body) {
  const out = []
  let depth = 0, key = null, start = 0
  for (let i = 0; i < body.length; i++) {
    const c = body[i]
    if (c === '{' || c === '(' || c === '[') depth++
    else if (c === '}' || c === ')' || c === ']') depth--
    else if (depth === 0 && c === ':' && key === null) {
      const before = body.slice(start, i)
      const m = before.match(/([A-Za-z_$][\w$]*|'[^']+'|"[^"]+")\s*(\??)$/)
      if (m) { key = { name: m[1].replace(/['"]/g, ''), optional: m[2] === '?' }; start = i + 1 }
    } else if (depth === 0 && (c === ',' || c === ';') && key) {
      out.push({ ...key, value: body.slice(start, i).trim() }); key = null; start = i + 1
    }
  }
  if (key) out.push({ ...key, value: body.slice(start).trim() })
  return out
}

const nameFrom = (ps) => ps.find((p) => p.name === 'component' || p.name === 'type')?.value
  ?.match(/['"]([^'"]+)['"]/)?.[1] ?? null

function propsFrom(ps, { zod }) {
  return ps.filter((p) => !['component', 'type'].includes(p.name)).flatMap((p) => {
    /* a `props: { … }` nesting is the TypeScript shape; flatten one level */
    if (p.name === 'props' && p.value.startsWith('{')) return propsFrom(pairs(p.value.slice(1, -1)), { zod })
    if (p.name === 'props' && /z\.object\(\{/.test(p.value)) {
      const at = p.value.indexOf('{', p.value.indexOf('z.object('))
      return propsFrom(pairs(blockAt(p.value, at)?.body ?? ''), { zod })
    }
    const v = p.value
    const optional = zod ? /\.optional\(\)|\.nullish\(\)/.test(v) : p.optional
    const enumMatch = zod ? v.match(/z\.enum\(\[([^\]]*)\]/) : v.match(/^\s*(?:'[^']*'\s*\|\s*)+'[^']*'/)
    const values = enumMatch ? [...enumMatch[0].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]) : null
    const action = ACTIONISH.test(p.name)
    const str = !action && !values?.length && (zod ? /z\.string\(\)|DynamicString/.test(v) : /\bstring\b/.test(v))
    return [{ name: p.name, optional, text: str && !URLISH.test(p.name) && TEXTISH.test(p.name), string: str,
      action, child: /Child|ComponentId|children/i.test(p.name + v), values }]
  })
}

function fromSource(src) {
  const zod = /z\.object\s*\(/.test(src)
  const components = []
  const marker = zod ? /z\.object\s*\(\s*\{/g : /\{/g
  for (const m of [...src.matchAll(marker)]) {
    const open = src.indexOf('{', m.index + (zod ? m[0].length - 1 : 0))
    const block = blockAt(src, open)
    if (!block) continue
    const ps = pairs(block.body)
    const name = nameFrom(ps)
    if (!name || components.some((c) => c.name === name)) continue
    components.push({ name, props: propsFrom(ps, { zod }) })
  }
  return { kind: zod ? 'Zod schema' : 'TypeScript union', components, note: null }
}

/** Whatever they pasted. Refuses to pretend when it cannot read it. */
export function readVocabulary(text) {
  const t = (text ?? '').trim()
  if (!t) return { kind: null, components: [], note: 'nothing pasted' }
  if (t.startsWith('{') || t.startsWith('[')) {
    let json
    try { json = JSON.parse(t) } catch (e) { return { kind: null, components: [], note: `this looks like JSON but does not parse: ${e.message}` } }
    if (json.components && typeof json.components === 'object') return fromCatalog(json)
    return { kind: null, components: [], note: 'JSON, but no `components` object — an A2UI catalog keys its components by name' }
  }
  const read = fromSource(t)
  if (!read.components.length) {
    return { kind: null, components: [], note: 'could not find any component in this. A Zod schema needs a `component:` or `type:` literal per object; a union needs one per member.' }
  }
  return read
}

/* ── the four questions ──────────────────────────────────────────────────── */
export function audit(vocab, sidecar = null) {
  const comps = vocab.components
  const all = comps.flatMap((c) => c.props.map((p) => ({ ...p, component: c.name })))
  const declared = new Map(comps.filter((c) => c.declaredName).map((c) => [c.name, c.declaredName]))
  const speaks = new Set(comps.filter((c) => c.collection).map((c) => c.name))
  for (const [name, a] of Object.entries(sidecar?.components ?? {})) {
    if (a.name) declared.set(name, a.name)
    if (a.items) speaks.add(name)
  }
  /* If the vocabulary states its own semantics, believe it — including its
     silences. Guessing from property names is the fallback for a vocabulary
     that says nothing, not a second opinion on one that does. */
  const stated = declared.size > 0
  const findings = []

  const heading = all.filter((p) => HEADINGISH.test(p.name)) .concat(comps.filter((c) => /^h[1-6]$|heading/i.test(c.name)))
  if (!heading.length) findings.push({
    id: 'no-heading', sc: '1.3.1', severity: 'gap',
    title: 'Nothing here can be a heading',
    detail: 'No component carries a heading level, so the model cannot give a screen a title or say where one section ends and the next begins. Whatever structure a reader gets is whatever the components happen to carry.',
    evidence: [],
  })

  /* A container holds other components; having no text of its own is what it is
   * FOR. Only the ones that hold nothing and still cannot speak are worth a
   * person's time — and whether such a component is decorative is a judgement,
   * so this is raised for review rather than asserted as a gap. */
  const mute = comps.filter((c) => c.props.length && !speaks.has(c.name)
    && !c.props.some((p) => p.text) && !c.props.some((p) => p.child) && !declared.has(c.name))
  if (mute.length) findings.push({
    id: 'no-text', sc: '1.1.1 / 4.1.2', severity: 'review',
    title: `${mute.length} component${mute.length > 1 ? 's have' : ' has'} no property that can carry text`,
    detail: 'Nothing can give these a name or a text alternative — not the agent, not the renderer, not a design system. Some are meant to be decorative; the ones that are not are where a screen reader finds nothing.',
    evidence: mute.map((c) => c.name),
  })

  /* Which property IS the accessible name is a matter of meaning, not shape.
   * Where the vocabulary states it we use that; where it does not we fall back
   * to the properties whose names read like a name — and say which we did. */
  const named = (p) => (stated ? declared.get(p.component) === p.name : NAMEISH.test(p.name))
  const candidates = all.filter((p) => p.text || (p.string && !URLISH.test(p.name)))
  const loose = candidates.filter((p) => p.optional && named(p))
  if (loose.length) findings.push({
    id: 'optional-name', sc: '3.3.2 / 4.1.2', severity: 'gap',
    title: `${loose.length} accessible name${loose.length > 1 ? 's are' : ' is'} optional`,
    detail: `A schema-valid answer may leave ${loose.length > 1 ? 'every one of these' : 'this'} empty. Validation returns success and the control still has no name — this is the gap a type checker cannot see.${stated ? '' : ' Read from property names, because this vocabulary does not state its own semantics.'}`,
    evidence: loose.map((p) => `${p.component}.${p.name}`),
  })

  const open = all.filter((p) => p.action && !p.values?.length)
  if (open.length) findings.push({
    id: 'open-actions', sc: 'safety', severity: 'gap',
    title: `${open.length} side effect${open.length > 1 ? 's are' : ' is'} unenumerated`,
    detail: 'These name something the application will do, and the vocabulary never says which values are allowed. Nothing between the agent and the click can tell an allowed action from an invented one.',
    evidence: open.map((p) => `${p.component}.${p.name}`),
  })

  return { kind: vocab.kind, components: comps.length, properties: all.length,
    semantics: declared.size ? 'stated by the vocabulary' : 'read from property names',
    findings, note: vocab.note }
}
