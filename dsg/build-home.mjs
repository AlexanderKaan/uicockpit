/* The homepage. One kit compiled for the hero shot; everything else is read
 * from the same kit documents and the same generator the tool uses, so the
 * claims on this page cannot drift from what the tool actually does. */
import { readFileSync, writeFileSync } from 'node:fs'
import { buildCss } from './build-css.mjs'
import { icons, svg } from './icons.mjs'
import { render, PARTS } from './parts.mjs'
import { WALL, useIcons, useMantineClasses, useShadcnParts, useAntdParts } from './wall-bindings.mjs'
import { SCENES, BOARDS, ICON_NAMES, wallMarkup, safeJson } from './scenes.mjs'
import { generate, section, plain } from './generate.mjs'
import { route } from './roles.mjs'
import { materialElements } from './material-elements.mjs'
import { mark } from './mark.mjs'

const OUT = process.argv[2] ?? 'home.html'
/* EVERY kit, not the five this page happened to be built with. The page's whole
   claim is that it is generated from the same documents the tool reads, and a
   page that says five while the tool offers nine is the first place the claim
   goes false. */
const ALL = ['tailwind', 'daisyui', 'bootstrap', 'shadcn', 'material', 'radix', 'mantine', 'antd', 'openprops']
/* The ones that RENDER. Open Props ships no components at all, so there is no
   bouquet to show for it — that is a fact about the kit and the page says it
   in the grid rather than showing an empty frame. */
const SHOT_IDS = ALL.filter((id) => id !== 'openprops')
const VALUES = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#ffffff', surface: '#f7f9fa',
  ink: '#16181c', inkMuted: '#5c6b72', line: '#dfe2e7', radius: '10px', baseText: '16px' }
const kits = Object.fromEntries(ALL.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))
/* COUNTED, not typed. "Five of the nine ask nothing of your app" is the whole
   positioning in one line, and a number typed into a page is a number that goes
   wrong the first time a kit is added. */
const EVERY = ALL
const FREE = EVERY.filter((id) => !kits[id].runsIn?.framework).length
const WORD_OF = (n) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n)
const WORD = WORD_OF(FREE)
useMantineClasses(kits.mantine?.classes)
useShadcnParts(kits.shadcn?.parts)
useAntdParts(kits.antd?.parts)
useIcons(icons(ICON_NAMES).icons)

/* The wrapper a kit needs to be itself. Without data-theme, daisyUI's dark
 * theme wins on a dark OS and the frame shows its factory purple — which is
 * exactly what happened, on a page whose whole claim is that your values won. */
const ROOT = { daisyui: ' data-theme="yourkit"', bootstrap: ' data-bs-theme="light"',
  radix: ' class="radix-themes light" data-is-root-theme="true" data-has-background="true" data-panel-background="translucent"',
  mantine: ' data-mantine-color-scheme="light"' }
/* Some kits take a named SETTING rather than a value — Radix's accent, radius
   and scaling are attributes on the theme root. Without them --accent-9 never
   resolves and the whole kit renders as bare unstyled text. */
const attrs = (id) => Object.entries(route(VALUES, [id], kits)[0]?.attrs ?? {})
  .map(([a, v]) => ` ${a}="${v}"`).join('')
/* One board is the hero shot: the whole wall in a page-wide frame would be a
 * thumbnail of a thumbnail. Same implementation as the real wall, so the shot
 * cannot show an arrangement the product does not have. */
/* The boards this page shows. `data` is the bouquet you switch through; the
   other two are the bento tiles, which are the product's own output rather than
   a photograph of something else. */
const SHOWN = ['data', 'controls', 'forms']
const boardsOf = (ids) => BOARDS.filter((b) => ids.includes(b.id))

console.log('compiling the bouquet, once per kit…')
/* buildCss scans the markup, so it is handed the wall WITHOUT the stylesheet it
   is about to compile — the same body, one round earlier. Every board at once,
   so a class used only on the bento tiles is compiled too. */
const css = {}
Object.assign(css, await buildCss(VALUES, SHOT_IDS, kits, (id) => wallMarkup(WALL[id], boardsOf(SHOWN))))

/* Material's components are code. Written BESIDE the page, not into the srcdoc
   attribute, where every quote in 320 kB of their bundle would become six
   characters — and only fetched when somebody switches to Material. */
const mdw = materialElements()
writeFileSync(OUT.replace(/\.html$/, '') + '.elements.js', mdw.js)
const ELEMENTS = { material: './' + OUT.replace(/\.html$/, '') + '.elements.js' }

/* ── CSS ONCE PER KIT, BODIES SEPARATELY ──────────────────────────────────
 * The first version stored a whole document per frame, which meant Radix's
 * 795 kB stylesheet was in the page once for every board it appeared on. The
 * page composes the document instead: one stylesheet per kit, one body per
 * board, and a tile costs its markup and nothing else. */
/* data-quiet: this is a picture, so the strip keeps its panning and loses its
   scrollbars. Two bars around the one visual the page is built on read as a
   component that overflowed rather than as a wall you can push. */
const HEAD = Object.fromEntries(SHOT_IDS.map((id) => [id,
  `<html data-quiet${ROOT[id] ?? ''}${attrs(id)}><meta charset="utf-8"><style>${css[id] ?? ''}</style>`]))
const BODY = Object.fromEntries(SHOT_IDS.map((id) => [id,
  Object.fromEntries(SHOWN.map((b) => [b, wallMarkup(WALL[id], boardsOf([b]))]))]))
const TAIL = Object.fromEntries(SHOT_IDS.map((id) => [id,
  ELEMENTS[id] ? `<script type="module" src="${ELEMENTS[id]}"></` + 'script>' : '']))

/* the caveats on the page are the REAL ones, pulled out of a real manifest */
const md = generate(VALUES, ALL, kits)['MANIFEST.md']
const caveats = section(md, '## What could not be done').slice(0, 5)
  .map((l) => l.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>'))

const NAMES = ['box', 'sparkles', 'download']
const lu = icons(NAMES)
let page = readFileSync('home.template.html', 'utf8')
  .replace('<!--BODY-->', () => readFileSync('home.body.html', 'utf8'))
  .replace('/*KITS*/', () => JSON.stringify(kits))
  .replace('/*HEAD*/', () => safeJson(HEAD))
  .replace('/*BODY*/', () => safeJson(BODY))
  .replace('/*TAIL*/', () => safeJson(TAIL))
  .replace('/*SHOTFIRST*/', () => JSON.stringify(SHOT_IDS[1] ?? SHOT_IDS[0]))
  .replace('/*CARDS*/', () => String(SCENES.length))
  /* the cards by name, so the footer can offer "this element, in every kit"
     without typing a title that the wall might have renamed */
  .replace('/*CARDLIST*/', () => JSON.stringify(SCENES.map((c) => ({ id: c.id, title: c.title }))))
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
