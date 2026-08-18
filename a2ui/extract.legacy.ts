/* Extract the kit the A2UI bindings actually use. No owner map (the first
 * recipe to MENTION a class is not the one that defines it — that mistake
 * dropped .card, .btn, .alert, .dl and .tasklist and the preview said so at a
 * glance). Two passes: a recipe qualifies if any rule of it touches a class we
 * render; inside it we keep the rules that touch one, plus its element rules. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { buildTokens } from './src/tokens/buildTokens'
import { DEFAULT_CONFIG } from './src/tokens/defaults'
import { globalLayer } from './src/kit/globalLayer'
// @ts-expect-error plain mjs
import { parseKit, classesIn } from './scripts/lib/kit-model.mjs'

const need = new Set(readFileSync('/tmp/kit-classes.txt', 'utf8').split('\n').filter(Boolean))
const base = (c: string) => c.split('--')[0]
const touches = (sel: string) => (classesIn(sel) as string[]).some((c) => need.has(c) || need.has(base(c)))
const kit = parseKit()

let css = '', kept = 0, dropped = 0
const used: string[] = []
for (const r of kit.recipes) {
  if (!r.rules.some((x: any) => touches(x.selector))) continue
  const rules = r.rules.filter((x: any) => touches(x.selector) || (classesIn(x.selector) as string[]).length === 0)
  if (!rules.length) continue
  used.push(r.id)
  css += `\n/* ── ${r.section} ${'─'.repeat(Math.max(0, 58 - r.section.length))} */\n`
  for (const x of rules) { css += `${x.at ? `@${x.at} { ` : ""}${x.selector} { ${x.decls.map(([p, v]) => `${p}: ${v}`).join("; ")} }${x.at ? " }" : ""}\n`; kept++ }
  dropped += r.rules.length - rules.length
}
mkdirSync('../a2ui/kit', { recursive: true })
writeFileSync('../a2ui/kit/kit.css', `/* The kit binding's stylesheet — extracted from the archived component library
 * (tag archive/cockpit-2026-08-17) down to what the A2UI bindings render:
 * ${kept} rules from ${used.length} recipes, ${dropped} rules dropped as unreachable.
 * Plain CSS, yours to edit, no build. Themed through the custom properties in
 * tokens.css — override those, never these. */
${css}`)
const vars = buildTokens(DEFAULT_CONFIG).vars as Record<string, string>
writeFileSync('../a2ui/kit/tokens.css', `/* Default theme. Derived, not chosen: OKLCH ramps, and the contrast floors hold
 * at every one of the 60 theme x mode x density combinations the certificate
 * sweeps (binding.json). Override to theme the kit binding; keep the floors. */
:where(.b-kit) {
${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}
}
`)
writeFileSync('../a2ui/kit/global.css', `/* The floor: focus rings, disabled, selection, visually-hidden text, keyframes.
 * Taken whole — trimming this needs a rendered measurement, not a guess. */
${globalLayer({ scope: '' })}
`)
console.log(`kit.css    ${kept} regels uit ${used.length} recepten (${dropped} onbereikbaar weggelaten)`)
console.log(`           ${used.sort().join(' ')}`)
