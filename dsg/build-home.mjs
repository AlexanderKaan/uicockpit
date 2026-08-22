/* The homepage. One kit compiled for the hero shot; everything else is read
 * from the same kit documents and the same generator the tool uses, so the
 * claims on this page cannot drift from what the tool actually does. */
import { readFileSync, writeFileSync } from 'node:fs'
import { buildCss } from './build-css.mjs'
import { icons, svg } from './icons.mjs'
import { render, PARTS } from './parts.mjs'
import { WALL, useIcons, useMantineClasses, useShadcnParts, useAntdParts } from './wall-bindings.mjs'
import { SCENES, BOARDS, ICON_NAMES, wallMarkup, safeJson } from './scenes.mjs'
import { generate, section } from './generate.mjs'
import { mark } from './mark.mjs'

const OUT = process.argv[2] ?? 'home.html'
const ALL = ['tailwind', 'daisyui', 'shadcn', 'bootstrap', 'material']
const SHOT_IDS = ['tailwind', 'daisyui']
const VALUES = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#ffffff', surface: '#f7f9fa',
  ink: '#16181c', inkMuted: '#5c6b72', line: '#dfe2e7', radius: '10px', baseText: '16px' }
const kits = Object.fromEntries(ALL.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))
/* COUNTED, not typed. "Five of the nine ask nothing of your app" is the whole
   positioning in one line, and a number typed into a page is a number that
   goes wrong the first time a kit is added. Every kit document, not the five
   this page happens to render. */
const EVERY = ['tailwind', 'daisyui', 'bootstrap', 'shadcn', 'material', 'radix', 'mantine', 'antd', 'openprops']
const runsIn = EVERY.map((id) => JSON.parse(readFileSync(`kits/${id}.json`, 'utf8')).runsIn)
const FREE = runsIn.filter((r) => !r?.framework).length
const WORD_OF = (n) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n)
const WORD = WORD_OF(FREE)
useMantineClasses(kits.mantine?.classes)
useShadcnParts(kits.shadcn?.parts)
useAntdParts(kits.antd?.parts)
useIcons(icons(ICON_NAMES).icons)

/* The wrapper a kit needs to be itself. Without data-theme, daisyUI's dark
 * theme wins on a dark OS and the frame shows its factory purple — which is
 * exactly what happened, on a page whose whole claim is that your values won. */
const ROOT = { daisyui: ' data-theme="yourkit"', bootstrap: ' data-bs-theme="light"' }
/* One board is the hero shot: the whole wall in a page-wide frame would be a
 * thumbnail of a thumbnail. Same implementation as the real wall, so the shot
 * cannot show an arrangement the product does not have. */
const SHOT = BOARDS.filter((b) => b.id === 'data')
const wall = (id) => `<!doctype html><html${ROOT[id] ?? ''}><meta charset="utf-8"><style>${css[id] ?? ''}</style><body>${wallMarkup(WALL[id], SHOT)}`

console.log('compiling the hero shot…')
/* buildCss scans the markup, so it is handed the wall WITHOUT the stylesheet it
   is about to compile — the same body, one round earlier. */
const css = {}
Object.assign(css, await buildCss(VALUES, SHOT_IDS, kits, (id) => wallMarkup(WALL[id], SHOT)))
const shot = wall('daisyui')

/* the caveats on the page are the REAL ones, pulled out of a real manifest */
const md = generate(VALUES, ALL, kits)['MANIFEST.md']
const caveats = section(md, '## What could not be done').slice(0, 5)
  .map((l) => l.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>'))

const NAMES = ['box', 'sparkles', 'download']
const lu = icons(NAMES)
let page = readFileSync('home.template.html', 'utf8')
  .replace('<!--BODY-->', () => readFileSync('home.body.html', 'utf8'))
  .replace('/*KITS*/', () => JSON.stringify(kits))
  .replace('/*SHOT*/', () => safeJson(shot))
  .replace('/*CARDS*/', () => String(SCENES.length))
  .replace('/*FRAMEWORKFREE*/', () => WORD)
  .replace('/*KITCOUNT*/', () => WORD_OF(EVERY.length))
  .replace('/*PARTS*/', () => String(PARTS.length))
  .replace('/*CAVEATS*/', () => JSON.stringify(caveats))
for (const n of NAMES) page = page.split(`<!--I:${n}-->`).join(svg(lu.icons, n, 14))
page = page.split('<!--MARK-->').join(mark(18))
/* A placeholder that survives into the output is how a lucide box quietly
 * became the logo for weeks. Nothing silently ships with a hole in it. */
const left = [...page.matchAll(/<!--(MARK|I:[a-z-]+)-->/g)].map((m) => m[0])
if (left.length) { console.error(`build: unreplaced ${[...new Set(left)].join(' ')}`); process.exit(1) }


/* The same balance check the generator has: a closing script tag that came out
 * of a value ends the page's own script where it stands, and the only symptom
 * is a page that does nothing. */
{
  const real = (readFileSync('home.template.html', 'utf8').match(/<\/script\b/g) ?? []).length
  const closes = (page.match(/<\/script\b/g) ?? []).length
  if (closes !== real) {
    console.error(`build: the template has ${real} closing script tag${real === 1 ? '' : 's'} and the page has ${closes} — a value wrote one. See safeJson in scenes.mjs.`)
    process.exit(1)
  }
}

writeFileSync(OUT, page)
console.log(`\n${OUT} — ${(page.length / 1024).toFixed(0)} kB · ${caveats.length} real caveats · lucide ${lu.version}`)
