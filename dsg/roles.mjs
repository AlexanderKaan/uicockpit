/**
 * THE ROLES — the one opinion this product is allowed to have.
 *
 * We own no palette, no type scale and no defaults. What we do own is the
 * question: which handful of things is worth a knob? That IS a judgement, and
 * pretending otherwise would leave a tool with a thousand fields and no answer.
 *
 * Everything else here is routing. A role names a job — "the brand colour",
 * "the line between things" — and each kit says which of ITS variables does
 * that job. Turn one knob and every enabled kit is written in its own
 * vocabulary. We never invent a token; we address theirs.
 *
 * Two traps live in this table, and both are why it is a table and not a guess:
 *
 *   · daisyUI's `--border` is a WIDTH. shadcn's `--border` is a COLOUR. Same
 *     name, different quantity — read one as the other and the export is broken
 *     in a way nothing warns about.
 *   · Tailwind has no semantic roles at all. Its palette is `--color-sky-600`,
 *     not `--color-primary`, so "brand" there means writing a NEW variable the
 *     user's own utilities reference. That is a different kind of routing and
 *     it is marked as such.
 */

import { hexToOklch } from './color.mjs'

export const ROLES = [
  { id: 'brand',    label: 'Brand',        kind: 'colour', what: 'the colour a primary action wears' },
  { id: 'onBrand',  label: 'On brand',     kind: 'colour', what: 'text and icons on top of the brand colour', derived: true },
  { id: 'page',     label: 'Page',         kind: 'colour', what: 'the ground everything sits on' },
  { id: 'surface',  label: 'Surface',      kind: 'colour', what: 'a card or panel lifted off the page' },
  { id: 'ink',      label: 'Ink',          kind: 'colour', what: 'body text' },
  { id: 'inkMuted', label: 'Muted ink',    kind: 'colour', what: 'secondary text' },
  { id: 'line',     label: 'Line',         kind: 'colour', what: 'the border between things' },
  { id: 'fontHeading', label: 'Headings', kind: 'font', what: 'the family headings are set in' },
  { id: 'fontBody',    label: 'Body',     kind: 'font', what: 'the family everything else is set in' },
  { id: 'radius',   label: 'Corner radius', kind: 'length', what: 'how round a box is' },
  { id: 'baseText', label: 'Base text',    kind: 'length', what: 'the size body text is set at' },
]

/* kit → role → the variable that does that job.
 *   `new: true`  the kit has no variable for this role; we add one, and the
 *                export tells you to reference it.
 *   `also`       further variables the same knob has to keep in step. */
export const MAP = {
  tailwind: {
    _note: 'Tailwind ships a palette, not roles. Semantic names are added under @theme and its utilities pick them up.',
    brand:    { var: '--color-brand', new: true },
    onBrand:  { var: '--color-brand-foreground', new: true },
    page:     { var: '--color-page', new: true },
    surface:  { var: '--color-surface', new: true },
    ink:      { var: '--color-ink', new: true },
    inkMuted: { var: '--color-ink-muted', new: true },
    line:     { var: '--color-line', new: true },
    radius:   { var: '--radius-lg', also: ['--radius-md', '--radius-sm'] },
    baseText: { var: '--text-base' },
    fontBody: { var: '--font-sans' },
    fontHeading: { var: '--font-heading', new: true },
  },
  radix: {
    _note: 'Radix does not take values, it takes CHOICES from sets it publishes: named accent scales, named grey scales, five radius settings and five scaling steps. Only the page and panel colours are really variables. Every scale is twelve hand-built steps, so a single step written by hand is eleven steps out of step — the knobs are matched to the nearest published set instead, and the manifest names it.',
    brand:    { choice: 'brand' },
    onBrand:  { derives: 'brand' },
    page:     { var: '--color-background' },
    surface:  { var: '--color-panel-solid', also: ['--color-surface'] },
    ink:      { choice: 'ink' },
    inkMuted: { derives: 'ink' },
    line:     { derives: 'ink' },
    radius:   { choice: 'radius' },
    baseText: { choice: 'baseText' },
    fontBody: { var: '--default-font-family' },
    fontHeading: { var: '--heading-font-family' },
  },
  mantine: {
    _note: 'Semantic variables throughout, and all settable at runtime. Its COMPONENT class names are content hashes, which is a separate problem and not this table\'s.',
    brand:    { var: '--mantine-primary-color-filled', also: ['--mantine-primary-color-filled-hover'] },
    onBrand:  { var: '--mantine-primary-color-contrast' },
    page:     { var: '--mantine-color-body' },
    surface:  { var: '--mantine-color-default' },
    ink:      { var: '--mantine-color-text' },
    inkMuted: { var: '--mantine-color-dimmed' },
    line:     { var: '--mantine-color-default-border' },
    radius:   { var: '--mantine-radius-default', also: ['--mantine-radius-xs', '--mantine-radius-sm', '--mantine-radius-md', '--mantine-radius-lg', '--mantine-radius-xl'] },
    baseText: { var: '--mantine-font-size-md', also: ['--mantine-font-size-xs', '--mantine-font-size-sm', '--mantine-font-size-lg', '--mantine-font-size-xl'] },
    fontBody: { var: '--mantine-font-family' },
    fontHeading: { var: '--mantine-font-family-headings' },
  },
  openprops: {
    _note: 'Scales, plus the small semantic layer its normalize ships. Open Props renders nothing itself — it sits under whatever does, so your own CSS agrees with the kit above it.',
    brand:    { var: '--brand', new: true, also: ['--link'] },
    onBrand:  { var: '--surface-1', new: true },
    page:     { var: '--surface-1' },
    surface:  { var: '--surface-2', also: ['--surface-3'] },
    ink:      { var: '--text-1' },
    inkMuted: { var: '--text-2' },
    line:     { var: '--surface-4' },
    radius:   { var: '--radius-2', also: ['--radius-1', '--radius-3'] },
    baseText: { var: '--font-size-1', also: ['--font-size-0', '--font-size-2', '--font-size-3'] },
    fontBody: { var: '--font-sans' },
    fontHeading: { var: '--font-heading', new: true },
  },
  shadcn: {
    _note: 'Semantic variables by design, unprefixed. --border here is a COLOUR.',
    brand:    { var: '--primary' },
    onBrand:  { var: '--primary-foreground' },
    page:     { var: '--background' },
    surface:  { var: '--card', also: ['--popover'] },
    ink:      { var: '--foreground', also: ['--card-foreground', '--popover-foreground'] },
    inkMuted: { var: '--muted-foreground' },
    line:     { var: '--border', also: ['--input'] },
    radius:   { var: '--radius' },
    baseText: null,     // shadcn inherits type from your Tailwind setup
    /* rides on Tailwind, so the family is the base's --font-sans; a variable of
       its own would be a second place for the same answer to live */
    fontBody: { inherits: 'the base' },
    fontHeading: { inherits: 'the base' },
  },
  bootstrap: {
    _note: 'Runtime-themeable for surface, ink, line, radius and type — --bs-border-radius alone is read 105 times. But the BRAND is compiled: .btn-primary hard-codes #0d6efd and `var(--bs-primary)` appears zero times in Bootstrap\'s own stylesheet, so --bs-primary is informational. Changing it for real is a Sass rebuild.',
    brand:    { var: '--bs-link-color', also: ['--bs-primary'],
                needsBuild: { sass: '$primary', why: 'component colours are compiled; setting --bs-primary alone changes links and nothing else' } },
    onBrand:  { needsBuild: { sass: '$primary-text-emphasis', why: 'same — compiled into each component' } },
    page:     { var: '--bs-body-bg', also: ['--bs-secondary-bg'] },
    surface:  { var: '--bs-tertiary-bg' },
    ink:      { var: '--bs-body-color', also: ['--bs-emphasis-color'] },
    inkMuted: { var: '--bs-secondary-color', also: ['--bs-tertiary-color'] },
    line:     { var: '--bs-border-color' },
    radius:   { var: '--bs-border-radius',
                also: ['--bs-border-radius-sm', '--bs-border-radius-lg', '--bs-border-radius-xl', '--bs-border-radius-xxl'] },
    baseText: { var: '--bs-body-font-size' },
    fontBody: { var: '--bs-body-font-family', also: ['--bs-font-sans-serif'] },
    fontHeading: { needsBuild: { sass: '$headings-font-family',
      why: 'Bootstrap has no --bs variable for a heading family; it is compiled from Sass like the brand colour' } },
  },
  material: {
    _note: 'M3 takes ONE input. Its 47 colour roles — containers, on-colours, inverses, fixed variants — are computed from a seed by material-color-utilities, and the tonal surface ramp is an elevation model, not a set of siblings. So the other colour knobs do not reach this kit, and we say so instead of writing four of forty-seven and calling it themed.',
    brand:    { var: '--md-sys-color-primary', seeds: '@material/material-color-utilities' },
    onBrand:  { derives: 'brand' },
    page:     { derives: 'brand' },
    surface:  { derives: 'brand' },
    ink:      { derives: 'brand' },
    inkMuted: { derives: 'brand' },
    line:     { derives: 'brand' },
    radius:   { var: '--md-sys-shape-corner-md',
                also: ['--md-sys-shape-corner-xs', '--md-sys-shape-corner-sm', '--md-sys-shape-corner-lg',
                       '--md-sys-shape-corner-xl', '--md-sys-shape-corner-xxl'] },
    baseText: null,
    /* Material is the one kit that names both halves outright: plain for body,
       brand for headings. Its typescale reads them, so setting these two moves
       every one of its fifteen text styles. */
    fontBody: { var: '--md-ref-typeface-plain' },
    fontHeading: { var: '--md-ref-typeface-brand' },
  },
  daisyui: {
    _note: 'Registers into Tailwind\'s --color-* namespace on purpose. --border here is a WIDTH, not a colour.',
    brand:    { var: '--color-primary' },
    onBrand:  { var: '--color-primary-content' },
    page:     { var: '--color-base-100' },
    surface:  { var: '--color-base-200', also: ['--color-base-300'] },
    ink:      { var: '--color-base-content' },
    inkMuted: null,     // daisyUI has no muted ink; it dims base-content with opacity
    line:     null,     // no border COLOUR variable — --border is a width
    radius:   { var: '--radius-box', also: ['--radius-field', '--radius-selector'] },
    baseText: null,
    /* rides on Tailwind, so the family is the base's --font-sans; a variable of
       its own would be a second place for the same answer to live */
    fontBody: { inherits: 'the base' },
    fontHeading: { inherits: 'the base' },
  },
}

/**
 * What each kit can and cannot take, said out loud rather than quietly dropped.
 *
 *   missing  the kit has no variable for this job at all
 *   added    the kit has no semantic name; we add one and the export says so
 *   derived  the kit COMPUTES this from another role, with its own generator —
 *            writing it ourselves would be overwritten, or would half-theme it
 */
export function coverage(kitId) {
  const m = MAP[kitId] ?? {}
  const missing = ROLES.filter((r) => m[r.id] === null).map((r) => r.id)
  const added = ROLES.filter((r) => m[r.id]?.new).map((r) => r.id)
  const derived = ROLES.filter((r) => m[r.id]?.derives).map((r) => r.id)
  /* A fourth answer, and the one people most need before they choose a kit:
     the kit CAN take this, but not while the page is running. The export
     carries a build-time line instead of a variable. */
  const needsBuild = ROLES.filter((r) => m[r.id]?.needsBuild)
    .map((r) => ({ role: r.id, ...m[r.id].needsBuild }))
  const seeds = Object.entries(m).filter(([, t]) => t?.seeds).map(([id, t]) => ({ role: id, by: t.seeds }))
  return { missing, added, derived, needsBuild, seeds, note: m._note }
}

const LEN = /^(-?[\d.]+)(rem|em|px)$/
const KIND = Object.fromEntries(ROLES.map((r) => [r.id, r.kind]))

/**
 * A colour and a length do not travel the same way.
 *
 * `also` for a COLOUR means "these must match" — a card and a popover are the
 * same surface, and writing one without the other is how a theme comes out
 * half-applied. `also` for a LENGTH means the opposite: those siblings are a
 * SCALE. daisyUI ships box 1rem, field 0.25rem, selector 0.5rem on purpose, and
 * Tailwind's sm/md/lg are a ramp. Writing one value into all three flattens a
 * decision the kit made — so the knob scales their ratio instead, and the ratio
 * is read from what they published rather than chosen by us.
 *
 * @param kits  the fetched kit documents, keyed by id — needed for those ratios
 */
/**
 * A kit that takes CHOICES, not values.
 *
 * Radix Themes has no brand variable: it has twenty-five hand-built accent
 * scales and you pick one. Writing our hex into --accent-9 would leave the
 * other eleven steps belonging to the previous accent — a half-applied theme,
 * the exact failure this project keeps finding. So the knob is matched to the
 * nearest thing the kit really offers, and the manifest names it.
 *
 * Colours are compared in OKLCH because that is where "nearest" means what a
 * person means by it; lengths are compared as numbers. Hue is weighted hardest:
 * a teal asked for and a teal given is the answer, a grey of the same lightness
 * is not.
 */
export function nearestChoice(want, choice) {
  const entries = Object.entries(choice?.of ?? {})
  if (!entries.length || want == null) return null
  if (choice.unit === 'colour') {
    /* hexToOklch returns a triple, not an object — reading .l/.c/.h off it gave
       NaN for every accent and the nearest colour to everything was amber. */
    const hex6 = /^#[0-9a-f]{6}$/i.test(String(want)) ? String(want) : null
    if (!hex6) return null
    const [aL, aC, aH] = hexToOklch(hex6)
    let best = null
    for (const [name, hex] of entries) {
      if (!/^#[0-9a-f]{6}$/i.test(hex)) continue
      const [bL, bC, bH] = hexToOklch(hex)
      let dh = Math.abs(aH - bH) % 360
      if (dh > 180) dh = 360 - dh
      /* Hue counts in proportion to how colourful BOTH are: a hard cut-off sent
         a grey brand to Radix's gold, because with hue switched off the two
         happened to sit at a similar lightness. Chroma outweighs lightness --
         asking for grey and being handed a mustard is the worse answer. */
      const hueWeight = Math.min(1, Math.min(aC, bC) / 0.06)
      const d = Math.hypot((aL - bL) * 1.5, (aC - bC) * 6, (dh / 180) * 4 * hueWeight)
      if (!best || d < best.d) best = { name, value: hex, d }
    }
    return best && { ...best, distance: Number(best.d.toFixed(3)) }
  }
  const w = parseFloat(want)
  if (!Number.isFinite(w)) return null
  let best = null
  for (const [name, v] of entries) {
    const n = parseFloat(v)
    if (!Number.isFinite(n)) continue
    const d = Math.abs(n - w)
    if (!best || d < best.d) best = { name, value: v, d }
  }
  return best && { ...best, distance: Number(best.d.toFixed(3)) }
}

export function route(values, kitIds, kits = {}) {
  return kitIds.map((id) => {
    const m = MAP[id]
    if (!m) throw new Error(`no role map for kit "${id}" — add one before listing it`)
    const defaults = Object.assign({}, ...Object.values(kits[id]?.modes ?? {}))
    const vars = {}, unroutable = [], unscaled = [], chosen = [], attrs = {}

    for (const role of ROLES) {
      const v = values[role.id]
      if (v == null) continue
      const target = m[role.id]
      if (!target) { unroutable.push(role.id); continue }
      /* A role this kit computes for itself is not ours to write. Setting four
         of Material's forty-seven colour roles and calling it themed is exactly
         the half-applied theme this whole file exists to prevent. */
      if (target.derives) continue
      /* the layer under this one already answers it — not a gap, and not ours
         to write twice */
      if (target.inherits) continue
      /* the kit publishes a set for this job; take the nearest of what it has */
      if (target.choice) {
        const set = kits[id]?.choices?.[target.choice]
        const pick = nearestChoice(v, set)
        if (!pick) { unroutable.push(role.id); continue }
        attrs[set.attr] = pick.name
        chosen.push({ role: role.id, attr: set.attr, picked: pick.name, of: Object.keys(set.of).length,
          asked: v, got: pick.value, distance: pick.distance, why: set.why })
        continue
      }
      if (!target.var) continue            // build-time only; carried in the package, not as a variable
      vars[target.var] = v
      const siblings = target.also ?? []
      if (KIND[role.id] !== 'length') { for (const extra of siblings) vars[extra] = v; continue }

      const want = LEN.exec(String(v))
      const base = LEN.exec(defaults[target.var] ?? '')
      for (const extra of siblings) {
        const own = LEN.exec(defaults[extra] ?? '')
        /* no published pair to take a ratio from → leave their value alone and
           say so, rather than overwrite a scale with a guess */
        if (!want || !base || !own || Number(base[1]) === 0) { unscaled.push(extra); continue }
        const scaled = (Number(own[1]) / Number(base[1])) * Number(want[1])
        vars[extra] = `${Number(scaled.toFixed(4))}${want[2]}`
      }
    }
    return { kit: id, vars, attrs, chosen, unroutable, unscaled, ...coverage(id) }
  })
}
