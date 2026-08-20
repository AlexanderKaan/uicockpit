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
import { seedFrom, route } from './roles.mjs'
import { DARK } from './generate.mjs'
import { buildCss } from './build-css.mjs'
import { deriveMaterial } from './derive-material.mjs'
import { render, PARTS } from './parts.mjs'
import { WALL, useMantineClasses, useRadixTones } from './wall-bindings.mjs'
import { SCENES } from './scenes.mjs'
import { ownage, partOwnage } from './fidelity.mjs'
import { COMPONENT_GAPS } from './generate.mjs'
import { mark } from './mark.mjs'
import { materialElements } from './material-elements.mjs'
import { googleFonts, kitFonts } from './fonts.mjs'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const OUT = process.argv[2] ?? 'index.html'
const IDS = (process.env.DSG_KITS ?? 'tailwind,daisyui,shadcn,bootstrap,material,radix,mantine,openprops').split(',')
const SEED = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#f7f9fa', surface: '#ffffff',
  ink: '#16181c', inkMuted: '#5c6b72', line: '#dfe2e7', radius: '10px', baseText: '16px', space: '1' }
const kits = Object.fromEntries(IDS.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))
useMantineClasses(kits.mantine?.classes)

/* The semantic knobs open on a published value, not on a green we picked. The
 * order is the order kits are asked in, and the page says which kit answered. */
const SEEDS = {}
for (const role of ['success', 'warning', 'danger']) {
  const seed = seedFrom(role, kits, ['daisyui', 'bootstrap', 'mantine', 'material', 'shadcn', 'radix'])
  if (seed) { SEED[role] = seed.value; SEEDS[role] = seed }
}
/* the wall is built once, so Radix's per-element tones are baked from the seed;
 * the page re-tones them live through the data-tone hook */
useRadixTones(Object.fromEntries((route(SEED, ['radix'], kits)[0]?.chosen ?? [])
  .filter((c) => c.attr === 'tone').map((c) => [c.role, c.picked])))

console.log(`  ✓ semantic colours seeded from ${[...new Set(Object.values(SEEDS).map((s) => s.from))].join(', ') || 'nothing — no kit publishes one'}`)

/* The wrapper a kit needs to be itself. Without data-theme, daisyUI's dark
 * theme wins on a dark OS and the frame shows its factory purple — which is
 * exactly what happened, on a page whose whole claim is that your values won. */
const ROOT = { daisyui: ' data-theme="yourkit"', bootstrap: ' data-bs-theme="light"',
  radix: ' class="radix-themes light"', mantine: ' data-mantine-color-scheme="light"' }
const RENDERS = IDS.filter((id) => kits[id].layer !== 'tokens')
const wall = (id) => `<html${ROOT[id] ?? ''}><main>${SCENES.map((s) =>
  `<section data-rung="${s.rung}" style="grid-column:span ${s.span}"><p class="cap">${s.title}</p>${render(s.node, WALL[id])}</section>`).join('')}</main>
<style>/* NO font-family here. The wrapper setting one hard-coded our chrome over
   every kit's own typography, so the font knobs moved the card and nothing
   else — the kit's stylesheet decides what this page is set in. */
body{margin:0;padding:20px}
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
const parts = ['color.mjs', 'zip.mjs', 'parts.mjs', 'roles.mjs', 'generate.mjs', 'wall-bindings.mjs', 'scenes.mjs', 'stack.mjs']
/* The page's OWN inline script shares that scope too. Checking only the modules
 * missed `hsl` being declared in both color.mjs and the page — a SyntaxError
 * before anything ran, with a blank sheet and nothing in the UI to explain it. */
const tplScript = readFileSync('page.template.html', 'utf8').split('<script type="module">')[1] ?? ''
const seen = new Map()
for (const [f, src] of [...parts.map((f) => [f, strip(readFileSync(f, 'utf8'))]), ['page.template.html', tplScript]]) {
  for (const m of src.matchAll(/^(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    const prev = seen.get(m[1])
    /* twice in the SAME file counts too: two functions called drawPicker in the
     * page script threw SyntaxError before a line of it ran, and the check
     * waved it through because both were in one file. */
    if (prev) { console.error(`build: "${m[1]}" is declared twice — in ${prev} and ${f}. The bundle shares one scope, so rename one.`); process.exit(1) }
    seen.set(m[1], f)
  }
}
const mods = parts.map((f) => `/* ── ${f} ── */\n${strip(readFileSync(f, 'utf8'))}`).join('\n\n')

const gf = await googleFonts()
console.log(`  ✓ ${gf.read} families from ${gf.source} · ${kitFonts(kits).length} system stacks the kits publish`)

const mdw = materialElements()
console.log(`  ✓ @material/web ${mdw.version} · ${mdw.license} — ${mdw.bundled.length} real elements, ${(mdw.js.length / 1024).toFixed(0)} kB`)

console.log('reading the icons from lucide…')
const NAMES = ['sparkles', 'shuffle', 'download', 'circle-alert', 'x', 'check', 'search']
const lu = icons(NAMES)
console.log(`  ✓ lucide ${lu.version} · ${lu.license} — ${NAMES.length} icons`)

let page = readFileSync('page.template.html', 'utf8')
  .replace('<!--BODY-->', () => readFileSync('page.body.html', 'utf8'))
  .replace('/*MODULES*/', () => mods)
  .replace('/*KITS*/', () => JSON.stringify(kits))
  .replace('/*CSS*/', () => JSON.stringify(css))
  .replace('/*DERIVED*/', () => JSON.stringify(derived))
  /* Measured on the kit's own markup, NOT on wall() — that wrapper adds our
   * section caption, and counting our chrome against the kit reported 97 of 98
   * where the truth is 97 of 97. */
  .replace('/*DARK*/', () => JSON.stringify(DARK))
  .replace('/*RENDERS*/', () => JSON.stringify(RENDERS))
  .replace('/*SEEDS*/', () => JSON.stringify(SEEDS))
  .replace('/*FONTS*/', () => JSON.stringify({ google: gf.families, stacks: kitFonts(kits) }))
  .replace('/*OWN*/', () => JSON.stringify(Object.fromEntries(RENDERS.map((id) => {
    const html = SCENES.map((s) => render(s.node, WALL[id])).join('')
    const { used, theirs, els, elsTheirs } = ownage(html, css[id] ?? '', id === 'material' ? mdw.bundled : null)
    /* the legible half of the same question: how many PARTS are theirs, and
       which ones we had to draw from their tokens because they ship none */
    const part = partOwnage(WALL[id], css[id] ?? '', render, PARTS, id === 'material' ? mdw.bundled : null)
    return [id, { used, theirs, els, elsTheirs, unit: id === 'material' ? 'elements' : 'classes',
      parts: part.parts, partsTheirs: part.theirs, drawn: part.ours,
      gaps: COMPONENT_GAPS[id] ?? [] }]
  }))))
  /* Google's real elements, bundled.
   *
   * The replacer is a FUNCTION on purpose. With a string, `$&` and `$'` inside
   * the replacement are substitution patterns -- and their minified bundle
   * contains one, so `$'` spliced the entire rest of the page in after it and
   * shipped a generator with two of everything. It built, it loaded, and
   * nothing said a word. Every placeholder here takes a function now. */
  .replace('/*SCRIPTS*/', () => JSON.stringify({ material: mdw.js.split('</script').join('<\\/script') }))
  .replace('/*WALLS*/', () => JSON.stringify(Object.fromEntries(RENDERS.map((id) => [id, wall(id)]))))
  .replace('/*ICONS*/', () => JSON.stringify(lu.icons))
for (const n of NAMES) page = page.split(`<!--I:${n}-->`).join(svg(lu.icons, n, 14))
page = page.split('<!--MARK-->').join(mark(17))
/* A placeholder that survives into the output is how a lucide box quietly
 * became the logo for weeks. Nothing silently ships with a hole in it. */
const left = [...page.matchAll(/<!--(MARK|I:[a-z-]+)-->/g)].map((m) => m[0])
if (left.length) { console.error(`build: unreplaced ${[...new Set(left)].join(' ')}`); process.exit(1) }

/* And exactly one of each: a substitution pattern in a replacement value once
 * spliced the whole page in twice, and it still loaded. */
for (const decl of ['const CSS =', 'const KITS =', 'const SCRIPTS =', 'const WALLS =']) {
  const n = page.split(decl).length - 1
  if (n !== 1) { console.error(`build: "${decl}" appears ${n} times — the page is corrupt`); process.exit(1) }
}


writeFileSync(OUT, page)
console.log(`\n${OUT} — ${(page.length / 1024).toFixed(0)} kB, self-contained`)
