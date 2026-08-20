/**
 * THE PAGE — A+ assembled: the generator band, the wall, the receipt.
 *
 * Two things run at BUILD time because they cannot run in a browser: each kit's
 * CSS (Tailwind's CLI, Bootstrap's Sass, Material's generator) and the scenes'
 * markup. Everything else — the knobs, the kit toggles, the shuffle, the
 * download — is the same pure modules the CLI uses, inlined. One source, no
 * second implementation of routing that could drift from the first.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { icons, svg } from './icons.mjs'
import { buildCss } from './build-css.mjs'
import { deriveMaterial } from './derive-material.mjs'
import { render } from './parts.mjs'
import { WALL } from './wall-bindings.mjs'
import { SCENES } from './scenes.mjs'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const OUT = process.argv[2] ?? 'index.html'
const IDS = (process.env.DSG_KITS ?? 'tailwind,daisyui,shadcn,bootstrap,material').split(',')
const SEED = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#f7f9fa', surface: '#ffffff',
  ink: '#16181c', inkMuted: '#5c6b72', line: '#dfe2e7', radius: '10px', baseText: '16px' }
const kits = Object.fromEntries(IDS.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))

/* The wrapper a kit needs to be itself. Without data-theme, daisyUI's dark
 * theme wins on a dark OS and the frame shows its factory purple — which is
 * exactly what happened, on a page whose whole claim is that your values won. */
const ROOT = { daisyui: ' data-theme="yourkit"', bootstrap: ' data-bs-theme="light"' }
const wall = (id) => `<html${ROOT[id] ?? ''}><main>${SCENES.map((s) =>
  `<section style="grid-column:span ${s.span}"><p class="cap">${s.title}</p>${render(s.node, WALL[id])}</section>`).join('')}</main>
<style>body{margin:0;padding:20px;font-family:ui-sans-serif,system-ui,sans-serif}
main{display:grid;grid-template-columns:repeat(12,1fr);gap:16px;align-items:start}
.cap{margin:0 0 8px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.45;font-weight:600}</style>`

console.log('building each kit\'s real CSS…')
const css = await buildCss(SEED, IDS, kits, (id) => wall(id))

/* Material's scheme is derived once here, for the seed the page opens on. */
console.log('deriving Material\'s scheme…')
const tmp = mkdtempSync(join(tmpdir(), 'dsg-md-'))
let derived = {}
try {
  execFileSync('npm', ['install', '--silent', '--no-audit', '--no-fund', '@material/material-color-utilities'], { cwd: tmp, stdio: 'pipe' })
  const d = deriveMaterial(SEED.brand, tmp)
  if (d.error) console.error(`  ✗ ${d.error}`); else { derived = d; console.log(`  ✓ ${Object.keys(d.light).length} roles`) }
} finally { rmSync(tmp, { recursive: true, force: true }) }

/* the pure modules, inlined — the same code the CLI runs */
const strip = (s) => s.replace(/^import[^\n]*from '[^']+'\n/gm, '').replace(/^export (const|function|class|let) /gm, '$1 ').replace(/^export \{[^}]*\}[^\n]*\n/gm, '')
const parts = ['parts.mjs', 'roles.mjs', 'generate.mjs', 'wall-bindings.mjs', 'scenes.mjs']
const seen = new Map()
for (const f of parts) for (const m of strip(readFileSync(f, 'utf8')).matchAll(/^(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)) {
  const prev = seen.get(m[1])
  if (prev && prev !== f) { console.error(`build: "${m[1]}" declared in both ${prev} and ${f} — the bundle shares one scope`); process.exit(1) }
  seen.set(m[1], f)
}
const mods = parts.map((f) => `/* ── ${f} ── */\n${strip(readFileSync(f, 'utf8'))}`).join('\n\n')

console.log('reading the icons from lucide…')
const NAMES = ['box', 'sparkles', 'shuffle', 'download', 'circle-alert', 'x', 'check']
const lu = icons(NAMES)
console.log(`  ✓ lucide ${lu.version} · ${lu.license} — ${NAMES.length} icons`)

let page = readFileSync('page.template.html', 'utf8')
  .replace('<!--BODY-->', readFileSync('page.body.html', 'utf8'))
  .replace('/*MODULES*/', mods)
  .replace('/*KITS*/', JSON.stringify(kits))
  .replace('/*CSS*/', JSON.stringify(css))
  .replace('/*DERIVED*/', JSON.stringify(derived))
  .replace('/*WALLS*/', JSON.stringify(Object.fromEntries(IDS.map((id) => [id, wall(id)]))))
  .replace('/*ICONS*/', JSON.stringify(lu.icons))
for (const n of NAMES) page = page.split(`<!--I:${n}-->`).join(svg(lu.icons, n, n === 'box' ? 16 : 14))

writeFileSync(OUT, page)
console.log(`\n${OUT} — ${(page.length / 1024).toFixed(0)} kB, self-contained`)
