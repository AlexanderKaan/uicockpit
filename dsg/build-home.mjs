/* The homepage. One kit compiled for the hero shot; everything else is read
 * from the same kit documents and the same generator the tool uses, so the
 * claims on this page cannot drift from what the tool actually does. */
import { readFileSync, writeFileSync } from 'node:fs'
import { buildCss } from './build-css.mjs'
import { icons, svg } from './icons.mjs'
import { render } from './parts.mjs'
import { WALL } from './wall-bindings.mjs'
import { SCENES } from './scenes.mjs'
import { generate, section } from './generate.mjs'
import { mark } from './mark.mjs'

const OUT = process.argv[2] ?? 'home.html'
const ALL = ['tailwind', 'daisyui', 'shadcn', 'bootstrap', 'material']
const SHOT_IDS = ['tailwind', 'daisyui']
const VALUES = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#ffffff', surface: '#f7f9fa',
  ink: '#16181c', inkMuted: '#5c6b72', line: '#dfe2e7', radius: '10px', baseText: '16px' }
const kits = Object.fromEntries(ALL.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))

/* The wrapper a kit needs to be itself. Without data-theme, daisyUI's dark
 * theme wins on a dark OS and the frame shows its factory purple — which is
 * exactly what happened, on a page whose whole claim is that your values won. */
const ROOT = { daisyui: ' data-theme="yourkit"', bootstrap: ' data-bs-theme="light"' }
const wall = (id) => `<html${ROOT[id] ?? ''}><main>${SCENES.slice(0, 3).map((s) =>
  `<section style="grid-column:span ${s.span}"><p class="cap">${s.title}</p>${render(s.node, WALL[id])}</section>`).join('')}</main>
<style>body{margin:0;padding:18px;font-family:ui-sans-serif,system-ui,sans-serif;background:#fff}
main{display:grid;grid-template-columns:repeat(12,1fr);gap:14px;align-items:start}
.cap{margin:0 0 7px;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;opacity:.4;font-weight:600}</style>`

console.log('compiling the hero shot…')
const css = await buildCss(VALUES, SHOT_IDS, kits, wall)
const shot = `<!doctype html><meta charset=utf-8><style>${css.daisyui}</style><body>${wall('daisyui')}`

/* the caveats on the page are the REAL ones, pulled out of a real manifest */
const md = generate(VALUES, ALL, kits)['MANIFEST.md']
const caveats = section(md, '## What could not be done').slice(0, 5)
  .map((l) => l.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>'))

const NAMES = ['box', 'sparkles', 'download']
const lu = icons(NAMES)
let page = readFileSync('home.template.html', 'utf8')
  .replace('<!--BODY-->', readFileSync('home.body.html', 'utf8'))
  .replace('/*KITS*/', JSON.stringify(kits))
  .replace('/*SHOT*/', JSON.stringify(shot))
  .replace('/*CAVEATS*/', JSON.stringify(caveats))
for (const n of NAMES) page = page.split(`<!--I:${n}-->`).join(svg(lu.icons, n, 14))
page = page.split('<!--MARK-->').join(mark(18))
/* A placeholder that survives into the output is how a lucide box quietly
 * became the logo for weeks. Nothing silently ships with a hole in it. */
const left = [...page.matchAll(/<!--(MARK|I:[a-z-]+)-->/g)].map((m) => m[0])
if (left.length) { console.error(`build: unreplaced ${[...new Set(left)].join(' ')}`); process.exit(1) }


writeFileSync(OUT, page)
console.log(`\n${OUT} — ${(page.length / 1024).toFixed(0)} kB · ${caveats.length} real caveats · lucide ${lu.version}`)
