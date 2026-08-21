/**
 * THE PALETTES YOUR STACK ALREADY PUBLISHES.
 *
 * Ten colour pickers is a fine way to adjust a palette and a terrible way to
 * start one. What people want first is a family — "make it teal" — and the
 * temptation is to ship a handful of nice ones. That would be a palette opinion,
 * which is the one thing this tool may not have.
 *
 * It does not need one. Tailwind publishes seventeen colour families of eleven
 * steps. Radix publishes thirty-one hand-built twelve-step scales AND says what
 * each step is for. Open Props publishes sixteen, Mantine twelve. So a palette
 * here is one of theirs, and switching kits switches which are on offer.
 *
 * Nothing below is a list. Families are FOUND in what a kit publishes, split
 * into accents and neutrals by their own chroma, and the roles are read out of
 * the ramp — the extremes by position, the middle two by contrast against a
 * published standard.
 */
import { hexToOklch, oklchStrToHex, contrast, aaInk } from './color.mjs'

const hex = (v) => {
  const s = String(v ?? '').trim()
  if (/^#[0-9a-f]{6}$/i.test(s)) return s
  if (/^#[0-9a-f]{3}$/i.test(s)) return '#' + s.slice(1).split('').map((c) => c + c).join('')
  if (/^oklch\(/i.test(s)) return oklchStrToHex(s)
  return null
}

/* `--color-teal-600`, `--mantine-color-blue-6`, `--red-7`: one shape, three
 * prefixes, and the prefix is the only part that differs between kits. */
const STEP = /^--(?:color-|mantine-color-)?([a-z]+)-(\d{1,3})$/

/**
 * Every colour family a kit publishes, as ramps.
 * A family needs at least eight steps: fewer and it is a pair of shades, not a
 * scale, and reading roles out of it would be guessing.
 */
export function families(kit) {
  const found = {}
  for (const [name, value] of Object.entries(kit?.modes?.light ?? {})) {
    const m = STEP.exec(name)
    const h = m && hex(value)
    if (!h) continue
    ;(found[m[1]] ??= []).push([Number(m[2]), h])
  }
  /* Radix keeps its scales in one file per colour, so they arrive already
     separated rather than mixed into the theme block. */
  for (const [name, steps] of Object.entries(kit?.ramps ?? {})) {
    found[name] = Object.entries(steps).map(([s, v]) => [Number(s), v])
  }

  return Object.entries(found)
    .filter(([, steps]) => steps.length >= 8)
    .map(([name, steps]) => {
      const ramp = steps.sort((a, b) => a[0] - b[0]).map(([, v]) => v)
      const chroma = Math.max(...ramp.map((c) => hexToOklch(c)[1]))
      return { name, ramp, chroma, from: kit.name,
        /* their own chroma decides: a scale that never becomes colourful is the
           grey ramp, and every one of these kits ships several. */
        kind: chroma >= 0.05 ? 'accent' : 'neutral' }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** All of them, for the kits currently switched on, kit by kit. */
export const palettesFor = (ids, kits) =>
  ids.flatMap((id) => families(kits[id]).map((f) => ({ ...f, kit: id })))

/** The neutral whose hue sits closest to this accent — Radix's own "auto". */
export function matchNeutral(accent, neutrals, kit = null) {
  if (!neutrals.length) return null
  /* A light page needs a ramp that actually starts light. Mantine publishes a
     `dark` scale alongside its `gray` one — a dark-scheme ramp whose lightest
     step is #c9c9c9 — and hue-matching to it handed back a mid-grey page.
     Not a preference: a ground you cannot read black text on is not a ground. */
  const usable = neutrals.filter((n) => Math.max(...n.ramp.map((c) => hexToOklch(c)[0])) >= 0.93)
  const pool = usable.length ? usable : neutrals
  const [, , aH] = hexToOklch(solidOf(accent, kit))
  let best = null
  for (const n of pool) {
    const [, , nH] = hexToOklch(n.ramp[Math.floor(n.ramp.length / 2)])
    let d = Math.abs(aH - nH) % 360
    if (d > 180) d = 360 - d
    if (!best || d < best.d) best = { n, d }
  }
  return best.n
}

/**
 * Which step of a family is its SOLID — the one a button wears.
 *
 * There is no single derived rule that matches every kit, because their
 * conventions genuinely differ: Tailwind's oklch palette peaks at 400 and its
 * buttons use 600, Radix's peak IS its solid at step 9, Mantine's is 6. So the
 * kit is asked first. Radix publishes the answer — it is the same step its
 * data-accent-color selects, which we already read — and where a kit says
 * nothing, the purest step is taken, which is what these ramps are built around.
 */
const purest = (ramp) => ramp.reduce((a, b) => (hexToOklch(b)[1] > hexToOklch(a)[1] ? b : a))
const solidOf = (family, kit) => kit?.choices?.brand?.of?.[family.name] ?? purest(family.ramp)
const solid = (ramp) => purest(ramp)
const byLight = (ramp) => [...ramp].sort((a, b) => hexToOklch(b)[0] - hexToOklch(a)[0])

/**
 * A family, as our seven colour roles.
 *
 * The extremes come straight out of the ramp. The two in the middle are the
 * ones taste usually decides, so they are decided by a published standard
 * instead: muted ink is the quietest step that still clears WCAG 1.4.3 for body
 * text, and the line is the quietest that still clears 1.4.11 for a non-text
 * boundary. If no step clears the bar, the darkest available is used and the
 * caller is told — never a value invented to fill the gap.
 */
/**
 * The step of a ramp nearest in lightness to a value the kit already publishes.
 * Their convention, in your family's colours.
 */
const nearestLightness = (ramp, target) => {
  const t = hex(target) && hexToOklch(hex(target))[0]
  if (t == null) return null
  return ramp.reduce((a, b) => (Math.abs(hexToOklch(b)[0] - t) < Math.abs(hexToOklch(a)[0] - t) ? b : a))
}

export function paletteRoles(accent, neutral, kit = null, reference = {}) {
  const n = byLight(neutral?.ramp ?? accent.ramp)
  const surface = n[0]
  const page = n[1] ?? n[0]
  const ink = n.at(-1)
  const brand = solidOf(accent, kit)

  const quietestOver = (bar) => {
    const ok = n.filter((c) => contrast(c, page) >= bar)
    return ok.length ? ok[0] : null           // byLight is dark-last, so [0] is the quietest that clears
  }
  /* A published bar is the right decider only where the kit says nothing.
   *
   * Picking the line at the 1.4.11 floor made every border three times darker
   * than any kit in the set actually uses — shadcn's is 1.26:1 and ours came
   * out at 3:1, which reads as a black hairline and looks like no kit at all.
   * So where the kit publishes its own border or muted text, the step nearest
   * THEIR lightness is taken, and the contrast audit reports what that costs.
   * The tool reproduces their convention; the meter says where it falls short. */
  const muted = nearestLightness(n, reference.inkMuted) ?? quietestOver(4.5)
  const line = nearestLightness(n, reference.line) ?? quietestOver(3)
  /* Some solids take neither black nor white at 4.5:1 — a mid olive is the
     classic case. aaInk returns its best attempt; saying so is the difference
     between a palette and a promise we cannot keep. */
  const ink4 = aaInk(brand)
  const onBrandShort = contrast(ink4, brand) < 4.5

  return {
    /* aaInk, not readableInk: the quick one splits on luminance alone and hands
       back white for #228be6, where white is 3.6:1 and black is 5.9:1. The
       careful one checks the bar and swaps. */
    values: { brand, onBrand: ink4, page, surface, ink,
      inkMuted: muted ?? ink, line: line ?? n.at(-2) ?? ink },
    short: [muted ? null : 'inkMuted', line ? null : 'line', onBrandShort ? 'onBrand' : null].filter(Boolean),
    /* which of the two came from the kit rather than from the bar */
    fromKit: [reference.inkMuted ? 'inkMuted' : null, reference.line ? 'line' : null].filter(Boolean),
  }
}
