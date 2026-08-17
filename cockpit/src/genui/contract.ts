import { GEN_CATALOG, GEN_TYPES, ICONS, LIMITS, REQUIRED, TONES, type GenType } from './spec'
import { SAMPLES } from './samples'

/**
 * THE CONTRACT A MODEL WRITES AGAINST — as text, for pasting into any
 * assistant. There is no model behind the sandbox; this is how one is put
 * beside it: copy the contract, ask the assistant a question, paste its JSON
 * back into the editor, and see what renders and what is refused.
 *
 * Derived, not written: the types and their labels from GEN_CATALOG, the
 * fields and an example from the MAXIMAL samples, the required fields from
 * REQUIRED, the enums from TONES/ICONS, the budgets from LIMITS — the same
 * data `admit()` enforces, so the contract cannot promise what admission
 * refuses. The test round-trips every example block back through admission.
 *
 * Later this is what `uicockpit genui contract` and an MCP tool return.
 */

const fmt = (o: unknown) => JSON.stringify(o, null, 2)

/** Fields of a type, from its sample: name → JSON type ("string", "number", "boolean", "array", "object"). */
function fieldsOf(t: GenType): { name: string; kind: string; required: boolean }[] {
  const sample = SAMPLES[t] as unknown as Record<string, unknown>
  const req = new Set(REQUIRED[t] ?? [])
  return Object.entries(sample)
    .filter(([k]) => k !== 'type')
    .map(([k, v]) => ({ name: k, kind: Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v, required: req.has(k) }))
}

export function renderContract(): string {
  const L: string[] = []
  L.push('# UI spec v0 — the contract for a generative answer')
  L.push('')
  L.push('Answer with ONE JSON object, nothing else — no prose before or after, no code fence needed (a fence is tolerated). Shape:')
  L.push('')
  L.push('```json')
  L.push(fmt({ title: 'A short title for the answer', blocks: [{ type: 'heading', text: '…' }, { type: 'text', text: '…' }] }))
  L.push('```')
  L.push('')
  L.push('Every entry in `blocks` is a NODE with a `type` from the catalogue below. A node is a component that has a source (the platform, WAI-ARIA APG, or a public-service design system) and a measured shape — the assistant does not paint anything else. Whatever is not in the catalogue is REFUSED and rendered as a refusal, in place; a wrong field is warned about and ignored.')
  L.push('')
  L.push('## Rules')
  L.push('')
  L.push(`- At most ${LIMITS.blocks} components in one answer, ${LIMITS.items} entries in any list, nesting ${LIMITS.depth} deep, ${LIMITS.text} characters in one text — an answer is a reply, not a page.`)
  L.push('- Layout: `stack` (vertical), `cluster` (a wrapping row), `grid` (auto-fit columns, `min` = column minimum), `strip` (a horizontal scroll-snap row of cards). Put components INSIDE these via `children`.')
  L.push('- A `card` holds content in `children` and buttons — ONLY buttons — in `actions`. Never a card inside a card.')
  L.push('- Prefer a component to prose: a list of facts is `facts`, steps are `steps`, a status is `stepper` or `tasks`, a warning is `warning`, numbers are `metrics`. Use `text` for what remains, briefly.')
  L.push('- Public-service tone: say what is known and what is not; put the source of a rule in `sub` or `caption`; one primary button per answer.')
  L.push(`- Tones: ${TONES.map((t) => `\`${t}\``).join(' · ')}. Icons: ${ICONS.map((i) => `\`${i}\``).join(' · ')}.`)
  L.push('- Links and buttons: use `href` for a destination; the sandbox renders `#` links harmlessly.')
  L.push('')
  L.push(`## The catalogue — ${GEN_TYPES.length} types`)
  L.push('')
  L.push('Each type: what it is, its fields (★ = required), and a complete example.')
  L.push('')
  for (const t of GEN_TYPES) {
    const entry = GEN_CATALOG[t]
    const fields = fieldsOf(t)
    L.push(`### \`${t}\` — ${entry.label}`)
    if (entry.note) L.push(`_${entry.note}_`)
    L.push('')
    L.push(`Fields: ${fields.map((f) => `\`${f.name}\`${f.required ? '★' : ''} (${f.kind})`).join(' · ') || '— (none)'}`)
    L.push('')
    L.push('```json')
    L.push(fmt(SAMPLES[t]))
    L.push('```')
    L.push('')
  }
  L.push('## Refused, and why')
  L.push('')
  L.push('- A `type` not in the catalogue — a kanban board, a modal, a chart, a carousel with arrows: no source, or a surface an assistant does not open on its own. Do not invent a type; compose from the catalogue.')
  L.push('- A card in a card; a card foot with anything but buttons; more than the budgets above.')
  L.push('- Images: there is no image type. A `figure` is the media slot (an image, a static map, an embed) with a caption; a `card` may carry `media` (`alt`, `map: true` for a map).')
  L.push('')
  L.push('Now answer the question that follows, as ONE JSON object of this shape.')
  return L.join('\n')
}

/**
 * Read a spec from what a model actually returns: a bare object, or the
 * object wrapped in a ```json fence, or prose around it. Takes the outermost
 * `{ … }`. Returns the parsed object or throws the JSON error.
 */
export function parseLoose(text: string): unknown {
  const t = text.trim()
  try { return JSON.parse(t) } catch { /* fall through */ }
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) { try { return JSON.parse(fenced[1]!.trim()) } catch { /* fall through */ } }
  const a = t.indexOf('{'), b = t.lastIndexOf('}')
  if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1))
  return JSON.parse(t) // throws with the original message
}
