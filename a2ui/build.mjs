/* A ten-line bundler: concatenate the modules, strip their import/export lines,
 * inline the JSON, and write ONE self-contained page. No toolchain, and the
 * artefact is a file you can mail to someone. */
import { readFileSync, writeFileSync } from 'node:fs'
const strip = (s) => s
  .replace(/^import[^\n]*from '[^']+'\n/gm, '')
  .replace(/^export (const|function|class|let) /gm, '$1 ')
  .replace(/^export \{[^}]*\}[^\n]*\n/gm, '')
const files = ['core.mjs', 'check.mjs', 'bindings.mjs']
const parts = files.map((f) => [f, strip(readFileSync(f, 'utf8'))])
/* Concatenating modules means their top-level names share one scope, and a
 * collision makes the browser throw a SyntaxError before anything runs — a page
 * that renders nothing, with an empty console. check.mjs and bindings.mjs both
 * declared `list` once, and it cost twenty minutes. So: fail here, loudly. */
const seen = new Map()
for (const [f, src] of parts) for (const m of src.matchAll(/^(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)) {
  const prev = seen.get(m[1])
  if (prev && prev !== f) { console.error(`build: "${m[1]}" is declared in both ${prev} and ${f} — the bundle shares one scope, so rename one.`); process.exit(1) }
  seen.set(m[1], f)
}
/* Two catalogs travel with the page: Google's standard one is the palette you
 * land on, ours is the extension. Same shape, same bindings, one switch. */
const json = (f) => JSON.parse(readFileSync(f, 'utf8'))
const CATALOGS = {
  basic: { label: 'A2UI Basic Catalog', note: "Google's 18 standard components — the ones every A2UI renderer is expected to know",
    catalog: json('catalogs/a2ui-basic.catalog.json'), demos: json('catalogs/a2ui-basic.demos.json').demos,
    a11y: json('catalogs/a2ui-basic.a11y.json'),
    defaults: ['Text', 'Image', 'List', 'ChoicePicker', 'DateTimeInput', 'Button'] },
  service: { label: 'Public-service extension', note: 'components a form-and-status service needs that the Basic Catalog has no name for',
    catalog: json('catalog.json'), demos: json('demos.json'), a11y: null,
    defaults: ['Heading', 'SummaryList', 'TaskList', 'Callout', 'Button'] },
}

/**
 * The stylesheet, in three parts.
 *
 * The page chrome is built out of the kit it ships — same tokens, same recipes —
 * so a regression in the kit shows up in the tool before it shows up in anyone's
 * product. The risk that buys is that the chrome and the ANSWER start to look
 * alike, which is the one distinction this whole page is about. A scope LIMIT
 * closes it structurally instead of by being careful: chrome styles stop dead at
 * .preview, so nothing the page wears can reach what the agent sent.
 */
function kitCss() {
  const tokens = readFileSync('kit/tokens.css', 'utf8')
  const kit = readFileSync('kit/kit.css', 'utf8') + '\n' + readFileSync('kit/platform.css', 'utf8')
  /* global.css carries two :root rules (scrollbar colour and width). Inside an
     @scope block :root can never match — they have been dead since the day the
     kit was extracted. Hoisted out rather than left as decoration. */
  const hoisted = []
  const global = readFileSync('kit/global.css', 'utf8')
    .replace(/^:root[^{]*\{[^}]*\}[ \t]*\n?/gm, (m) => { hoisted.push(m.trim()); return '' })
  console.log(`           ${hoisted.length} :root rule(s) hoisted out of the scoped layer (they never matched inside it)`)
  return `${tokens}
${tokens.replace(':where(.b-kit)', ':root')}
${hoisted.join('\n')}
@scope (.chrome) to (.preview) {
${global}
${kit}
}
@scope (.b-kit) {
${global}
${kit}
}`
}

const mods = parts.map(([f, src]) => `/* ── ${f} ─────────────── */\n` + src).join('\n\n')
const page = readFileSync('builder.template.html', 'utf8')
  .replace('/*MODULES*/', mods)
  .replace('/*CATALOGS*/', JSON.stringify(CATALOGS))
  .replace('/*CERT*/', readFileSync('binding.json', 'utf8'))
  .replace('<!--BODY-->', readFileSync('builder.body.html', 'utf8'))
  .replace('/*KITCSS*/', kitCss())
  .replace('/*TWCSS*/', readFileSync('tw.css', 'utf8') + '\n' + readFileSync('daisy.css', 'utf8'))
writeFileSync('builder.html', page)
console.log(`builder.html — ${(page.length / 1024).toFixed(0)} kB, self-contained`)
