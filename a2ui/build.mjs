/* A ten-line bundler: concatenate the modules, strip their import/export lines,
 * inline the JSON, and write ONE self-contained page. No toolchain, and the
 * artefact is a file you can mail to someone. */
import { readFileSync, writeFileSync } from 'node:fs'
const strip = (s) => s
  .replace(/^import[^\n]*from '[^']+'\n/gm, '')
  .replace(/^export (const|function|class|let) /gm, '$1 ')
  .replace(/^export \{[^}]*\}[^\n]*\n/gm, '')
const mods = ['core.mjs', 'check.mjs', 'bindings.mjs'].map((f) => `/* ── ${f} ─────────────── */\n` + strip(readFileSync(f, 'utf8'))).join('\n\n')
const page = readFileSync('builder.template.html', 'utf8')
  .replace('/*MODULES*/', mods)
  .replace('/*CATALOG*/', readFileSync('catalog.json', 'utf8'))
  .replace('/*DEMOS*/', readFileSync('demos.json', 'utf8'))
  .replace('<!--BODY-->', readFileSync('builder.body.html', 'utf8'))
  .replace('/*KITCSS*/', `${readFileSync('kit/tokens.css', 'utf8')}
@scope (.b-kit) {
${readFileSync('kit/global.css', 'utf8')}
${readFileSync('kit/kit.css', 'utf8')}
}`)
  .replace('/*TWCSS*/', readFileSync('tw.css', 'utf8') + '\n' + readFileSync('daisy.css', 'utf8'))
writeFileSync('builder.html', page)
console.log(`builder.html — ${(page.length / 1024).toFixed(0)} kB, self-contained`)
