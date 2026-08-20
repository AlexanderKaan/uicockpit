/**
 * WHAT SITS ON WHAT.
 *
 * Five kits in a row is a lie about how they are used. Nobody picks Tailwind
 * AND shadcn as two things — shadcn IS Tailwind, with components on top. And
 * nobody puts Bootstrap next to either: it brings its own everything.
 *
 * So there is a base and there are layers, and the rule is not typed here —
 * it is read from what each kit says about itself in kits/<id>.json:
 *
 *   layer: 'utility'      no components, just the theme  → can carry others
 *   standalone: true      brings its own base            → IS the whole stack
 *   standalone: false     needs the utility base under it → a layer
 *
 * Add a kit tomorrow and it sorts itself, because the fields come from the
 * kit's own package, not from an opinion of ours.
 */

const isFoundation = (k) => k.layer === 'utility'
const isWholeStack = (k) => k.standalone === true
const isLayer = (k) => !k.standalone && k.layer === 'components'

/** The one kit everything else can sit on, if there is one. */
export const foundationOf = (kits) => Object.keys(kits).find((id) => isFoundation(kits[id]))

/**
 * Turn a loose set of chosen ids into a real stack: one base, layers over it,
 * bottom-first. A standalone kit wins the base and pushes the layers off,
 * because there is nothing left for them to attach to.
 */
export function stack(chosen, kits) {
  const sel = [...chosen].filter((id) => kits[id])
  const whole = sel.find((id) => isWholeStack(kits[id]))
  if (whole) return { base: whole, layers: [], order: [whole], dropped: sel.filter((id) => id !== whole) }
  const base = foundationOf(kits)
  const layers = sel.filter((id) => isLayer(kits[id]))
  if (!base) return { base: layers[0] ?? sel[0] ?? null, layers: [], order: sel.slice(0, 1), dropped: sel.slice(1) }
  return { base, layers, order: [base, ...layers], dropped: [] }
}

/** The layer whose components you actually SEE — the last one added. */
export const showing = (st) => st.layers.at(-1) ?? st.base

/**
 * Every kit, and what clicking it would do to the stack you have. The `why`
 * is the sentence shown to the reader, so it says what happens, not what is
 * forbidden — the choice is never taken away, it is explained.
 */
export function options(chosen, kits) {
  const st = stack(chosen, kits)
  const carrier = foundationOf(kits)
  return Object.keys(kits).map((id) => {
    const k = kits[id]
    const on = st.order.includes(id)
    if (isFoundation(k)) {
      return { id, role: 'base', on, locked: st.layers.length > 0,
        why: st.layers.length ? `${st.layers.map((l) => kits[l].name).join(' and ')} sits on it` : 'the base — theme only, no components' }
    }
    if (isWholeStack(k)) return { id, role: 'whole', on, locked: false,
      why: on ? 'the whole stack — nothing else is loaded' : `replaces the stack; ${k.name} brings its own base` }
    return { id, role: 'layer', on, locked: false,
      why: on ? `components, over ${kits[carrier]?.name ?? 'the base'}` : `adds its components over ${kits[carrier]?.name ?? 'the base'}` }
  })
}

/** Clicking a kit: what the new selection becomes. */
export function toggle(chosen, id, kits) {
  const k = kits[id]; if (!k) return new Set(chosen)
  const st = stack(chosen, kits)
  if (isWholeStack(k)) return new Set(st.base === id ? [foundationOf(kits) ?? id] : [id])
  if (isFoundation(k)) {
    if (st.base !== id) return new Set([id])          /* coming back from a standalone kit */
    return new Set(st.order)                           /* the base cannot be removed from under its layers */
  }
  const next = new Set(st.base === foundationOf(kits) ? st.order : [foundationOf(kits)])
  next.has(id) ? next.delete(id) : next.add(id)
  return next
}

/** One sentence naming the stack, for the receipt and the wall note. */
export const describe = (st, kits) => st.order.map((id) => kits[id].name).join(' + ')
