/**
 * HOW MUCH OF EACH KIT IS REALLY THEIRS.
 *
 * The claim is not "it looks like daisyUI". The claim is that it IS daisyUI —
 * their classes, their stylesheet, their component. Ninety-nine percent is not
 * a weaker version of that claim, it is a different claim, and one we would not
 * be allowed to make.
 *
 * So this counts. Every class our binding emits for a kit is looked up in that
 * kit's OWN compiled stylesheet. A class their CSS does not define is a class we
 * invented, and every one of them is printed by name.
 *
 * Tailwind is exempt from the component half by construction: it ships
 * utilities, not components, so there is nothing there to be 100% of. That is
 * said out loud rather than scored as a pass.
 *
 *   node fidelity.mjs
 */
import { readFileSync } from 'node:fs'
import { buildCss } from './build-css.mjs'
import { render } from './parts.mjs'
import { WALL, useMantineClasses } from './wall-bindings.mjs'
import { SCENES } from './scenes.mjs'
import { materialElements } from './material-elements.mjs'
import { COMPONENT_GAPS } from './generate.mjs'

const IDS = ['tailwind', 'daisyui', 'shadcn', 'bootstrap', 'material', 'radix', 'mantine']
const VALUES = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#ffffff', surface: '#f7f9fa',
  ink: '#16181c', inkMuted: '#5c6b72', line: '#dfe2e7', radius: '10px', baseText: '16px' }
const kits = Object.fromEntries(IDS.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))
useMantineClasses(kits.mantine?.classes)

const markup = (id) => SCENES.map((s) => render(s.node, WALL[id])).join('')
export const classesOf = (html) => [...new Set([...html.matchAll(/class="([^"]+)"/g)]
  .flatMap((m) => m[1].split(/\s+/)).filter(Boolean))]

/**
 * Which of the classes in this markup the kit's own stylesheet defines.
 * Exported because the page states the number under the frame: a claim of
 * "these are really their components" is worth nothing unless it is counted
 * where the reader can see it.
 */
export const elementsOf = (html) => [...new Set([...html.matchAll(/<([a-z]+-[a-z0-9-]*)/g)].map((m) => m[1]))]

export function ownage(html, sheet, tags = null) {
  const used = classesOf(html)
  const sel = (c) => [...c].map((ch) => (/[A-Za-z0-9_-]/.test(ch) ? ch
    : `\\\\?${ch.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}`)).join('')
  const missing = used.filter((c) => !new RegExp(`\\.${sel(c)}(?=[\\s,{:.>~+\\[)])`).test(sheet))
  /* A kit whose unit is not a class. Material ships custom elements, so the
   * question there is not which classes its stylesheet defines but which
   * elements its package declares AND its bundle really registers — a tag that
   * is theirs by name but absent from the bundle would render as an unknown
   * element and look like a hole in their kit. */
  const els = tags ? elementsOf(html) : []
  const strangers = els.filter((t) => !tags.includes(t))
  return { used: used.length, theirs: used.length - missing.length, missing,
    els: els.length, elsTheirs: els.length - strangers.length, strangers,
    inline: (html.match(/style="/g) ?? []).length }
}

const css = await buildCss(VALUES, IDS, kits, markup, () => {})
const mdw = materialElements()
const TAGS = { material: mdw.bundled }

console.log('\n  Every class we emit, looked up in the kit that should define it.\n')
let worst = 0
for (const id of IDS) {
  const sheet = css[id] ?? ''
  const { used: n, theirs, missing, els, elsTheirs, strangers } = ownage(markup(id), sheet, TAGS[id] ?? null)
  const pct = n ? Math.round((theirs / n) * 100) : 100
  worst = Math.max(worst, missing.length)

  /* A kit that emits NO classes scores 100% of nothing, and a meter that
   * reports that as a pass is worse than one that fails. Material renders
   * entirely on inline styles of ours — which is the furthest thing from being
   * its kit, and the number has to say so rather than flatter it. */
  if (TAGS[id]) {
    /* two units, both reported: their elements and their typography classes */
    const pct = els ? Math.round((elsTheirs / els) * 100) : 0
    console.log(`  ${kits[id].name.padEnd(14)} ${String(pct).padStart(3)}%   ${elsTheirs}/${els} elements are theirs, running their code` +
      `\n                        ${theirs}/${n} classes are theirs (their md-typescale stylesheet)`)
    if (strangers.length) { console.log(`                 invented: ${strangers.join(' ')}`); worst = Math.max(worst, strangers.length) }
    if (!els) worst = Math.max(worst, 1)
    for (const [part, why] of COMPONENT_GAPS[id] ?? []) console.log(`                 no component: ${part} — ${why}`)
    continue
  }
  if (!n) {
    console.log(`  ${kits[id].name.padEnd(14)}   ——   nothing of theirs on the page at all`)
    worst = Math.max(worst, 1)
    continue
  }
  const note = id === 'tailwind' ? '  (utilities, not components — nothing here to be 100% of)' : ''
  console.log(`  ${kits[id].name.padEnd(14)} ${String(pct).padStart(3)}%   ${theirs}/${n} classes are theirs${note}`)
  if (missing.length && id !== 'tailwind') {
    console.log(`                 invented: ${missing.slice(0, 12).join(' ')}${missing.length > 12 ? ` …and ${missing.length - 12} more` : ''}`)
  }
}
console.log(`\n  ${worst ? 'Not 100%. Everything named above is something we made up.' : 'Every class and every element comes from the kit that defines it.\n  What a kit has no component for is named, not substituted.'}\n`)
