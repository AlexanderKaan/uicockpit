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
import { WALL } from './wall-bindings.mjs'
import { SCENES } from './scenes.mjs'

const IDS = ['tailwind', 'daisyui', 'shadcn', 'bootstrap', 'material']
const VALUES = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#ffffff', surface: '#f7f9fa',
  ink: '#16181c', inkMuted: '#5c6b72', line: '#dfe2e7', radius: '10px', baseText: '16px' }
const kits = Object.fromEntries(IDS.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))

const markup = (id) => SCENES.map((s) => render(s.node, WALL[id])).join('')
export const classesOf = (html) => [...new Set([...html.matchAll(/class="([^"]+)"/g)]
  .flatMap((m) => m[1].split(/\s+/)).filter(Boolean))]

/**
 * Which of the classes in this markup the kit's own stylesheet defines.
 * Exported because the page states the number under the frame: a claim of
 * "these are really their components" is worth nothing unless it is counted
 * where the reader can see it.
 */
export function ownage(html, sheet) {
  const used = classesOf(html)
  const sel = (c) => [...c].map((ch) => (/[A-Za-z0-9_-]/.test(ch) ? ch
    : `\\\\?${ch.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}`)).join('')
  const missing = used.filter((c) => !new RegExp(`\\.${sel(c)}(?=[\\s,{:.>~+\\[)])`).test(sheet))
  return { used: used.length, theirs: used.length - missing.length, missing,
    inline: (html.match(/style="/g) ?? []).length }
}

const css = await buildCss(VALUES, IDS, kits, markup, () => {})

console.log('\n  Every class we emit, looked up in the kit that should define it.\n')
let worst = 0
for (const id of IDS) {
  const sheet = css[id] ?? ''
  const { used: n, theirs, missing, inline } = ownage(markup(id), sheet)
  const pct = n ? Math.round((theirs / n) * 100) : 100
  worst = Math.max(worst, missing.length)

  /* A kit that emits NO classes scores 100% of nothing, and a meter that
   * reports that as a pass is worse than one that fails. Material renders
   * entirely on inline styles of ours — which is the furthest thing from being
   * its kit, and the number has to say so rather than flatter it. */
  if (!n) {
    console.log(`  ${kits[id].name.padEnd(14)}   ——   NO classes of theirs at all — ${inline} inline styles, every one ours`)
    worst = Math.max(worst, 1)
    continue
  }
  const note = id === 'tailwind' ? '  (utilities, not components — nothing here to be 100% of)' : ''
  console.log(`  ${kits[id].name.padEnd(14)} ${String(pct).padStart(3)}%   ${theirs}/${n} classes are theirs${note}`)
  if (missing.length && id !== 'tailwind') {
    console.log(`                 invented: ${missing.slice(0, 12).join(' ')}${missing.length > 12 ? ` …and ${missing.length - 12} more` : ''}`)
  }
}
console.log(`\n  ${worst ? 'Not 100%. Every class above that is not theirs is one we made up,\n  and a kit rendered on our inline styles is not that kit at all.' : 'Every class comes from the kit that defines it.'}\n`)
