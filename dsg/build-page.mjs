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
import { seedFrom, route, darken } from './roles.mjs'
import { hexToOklch } from './color.mjs'
import { DARK, generate } from './generate.mjs'
import { buildCss } from './build-css.mjs'
import { deriveMaterial } from './derive-material.mjs'
import { render, PARTS } from './parts.mjs'
import { WALL, useMantineClasses, useRadixTones, useIcons, useShadcnParts, useAntdParts } from './wall-bindings.mjs'
import { SCENES, ICON_NAMES, BOARDS, wallMarkup, safeJson } from './scenes.mjs'
import { ownage, partOwnage } from './fidelity.mjs'
import { analyse, unread } from './orphans.mjs'
import { COMPONENT_GAPS } from './generate.mjs'
import { mark } from './mark.mjs'
import { materialElements } from './material-elements.mjs'
import { googleFonts, kitFonts } from './fonts.mjs'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const OUT = process.argv[2] ?? 'index.html'
const IDS = (process.env.DSG_KITS ?? 'tailwind,daisyui,shadcn,bootstrap,material,radix,mantine,antd,openprops').split(',')
const SEED = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#f7f9fa', surface: '#ffffff',
  ink: '#16181c', inkMuted: '#5c6b72', line: '#dfe2e7', radius: '10px', baseText: '16px', space: '1', elevation: '1',
  lineHeight: '1.5', letterSpacing: '0em', fontWeight: '600', borderWidth: '1px' }
const kits = Object.fromEntries(IDS.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))
useMantineClasses(kits.mantine?.classes)
useShadcnParts(kits.shadcn?.parts)
useAntdParts(kits.antd?.parts)

/* The semantic knobs open on a published value, not on a green we picked. The
 * order is the order kits are asked in, and the page says which kit answered.
 *
 * The two font roles are in here for a different reason: Tailwind compiles a
 * utility only for a theme entry that EXISTS, so a build with no --font-heading
 * ships no .font-heading rule and the heading-family knob can never take effect,
 * whatever the browser sets the variable to afterwards. The value seeded here is
 * replaced the moment the page opens; what matters is that the name is there. */
const SEEDS = {}
for (const role of ['success', 'warning', 'danger', 'focus']) {
  const seed = seedFrom(role, kits, ['daisyui', 'bootstrap', 'mantine', 'material', 'shadcn', 'radix', 'antd'])
  if (seed) { SEED[role] = seed.value; SEEDS[role] = seed }
}
/* the wall is built once, so Radix's per-element tones are baked from the seed;
 * the page re-tones them live through the data-tone hook */
useRadixTones(Object.fromEntries((route(SEED, ['radix'], kits)[0]?.chosen ?? [])
  .filter((c) => c.attr === 'tone').map((c) => [c.role, c.picked])))

console.log(`  ✓ semantic colours seeded from ${[...new Set(Object.values(SEEDS).map((s) => s.from))].join(', ') || 'nothing — no kit publishes one'}`)

/* And the two font roles, for a different reason and with no note attached: the
 * page replaces both the moment it opens. What the build needs is only that the
 * NAME exists, or Tailwind emits no rule that could ever read it. */
for (const role of ['fontHeading', 'fontBody']) {
  const seed = seedFrom(role, kits, IDS)
  if (seed) SEED[role] = seed.value
}

/* The wrapper a kit needs to be itself. Without data-theme, daisyUI's dark
 * theme wins on a dark OS and the frame shows its factory purple — which is
 * exactly what happened, on a page whose whole claim is that your values won. */
const ROOT = { daisyui: ' data-theme="yourkit"', bootstrap: ' data-bs-theme="light"',
  /* Radix's own <Theme> sets five attributes, and two of them are load-bearing.
   * Without data-has-background its rule
   *   .radix-themes:where([data-has-background='true']) { background: var(--color-background) }
   * never fires, so the page colour was written into the variable and never
   * painted — the page knob did nothing at all for this kit. And without
   * data-panel-background, --color-panel resolves to nothing. Measured against
   * their own playground, which sets all of these. */
  radix: ' class="radix-themes light" data-is-root-theme="true" data-has-background="true" data-panel-background="translucent"',
  mantine: ' data-mantine-color-scheme="light"' }
const RENDERS = IDS.filter((id) => kits[id].layer !== 'tokens')

/* The wall for one kit: the same boards, columns and cards the preview and the
 * hero shot render, from the one implementation in scenes.mjs. */
const wall = (id) => `<html${ROOT[id] ?? ''}>${wallMarkup(WALL[id])}`

/* The icons the wall names are read BEFORE the CSS is built, because the wall
 * is what Tailwind scans: an icon read afterwards would be markup no stylesheet
 * ever saw. Two sets, one read — the chrome's and the cards' — and lucide
 * throws on a name it does not have, so a blank square cannot ship. */
console.log('reading the icons from lucide…')
const CHROME_ICONS = ['sparkles', 'shuffle', 'download', 'x', 'check', 'search', 'maximize', 'minimize']
const NAMES = [...new Set([...CHROME_ICONS, ...ICON_NAMES])]
const lu = icons(NAMES)
useIcons(lu.icons)
console.log(`  ✓ lucide ${lu.version} · ${lu.license} — ${CHROME_ICONS.length} for the chrome, ${ICON_NAMES.length} the cards name`)

console.log('building each kit\'s real CSS…')
const css = await buildCss(SEED, IDS, kits, (id) => wall(id))

/**
 * BOOTSTRAP, LIVE AFTER ALL.
 *
 * Its brand is compiled, so the page has always said "built, not live" over
 * that frame and left it at whatever it was built with. That was true about
 * SASS and false about the result: reading the compiled stylesheet back shows
 * every one of the twenty-seven places the brand lands is a --bs- CUSTOM
 * PROPERTY, and a custom property can be written again later.
 *
 * So this reads them out — the selector, the property, and the value Bootstrap
 * derived — and the page rewrites them from your brand through Bootstrap's own
 * relationship. Their arithmetic, your colour, which is the rule this whole
 * project keeps arriving back at.
 *
 * What is NOT taken: anything achromatic. --bs-btn-color is white because
 * Sass ran color-contrast() against the brand it was built with, and a
 * relationship is not what that is — it is a decision, taken once, that a
 * running page cannot retake. That one stays compiled and the caveat says so.
 */
function bootstrapLive(sheet, seedHex) {
  const seed = String(seedHex).toLowerCase()
  const [, seedC, seedH] = hexToOklch(seed)
  const near = (v) => {
    const hex = /^#[0-9a-f]{6}$/i.test(v) ? v : null
    if (!hex && !/^rgb\(/i.test(v)) return false
    try {
      const [, c, h] = hexToOklch(hex ?? rgbToHex(v))
      if (c < 0.02 || seedC < 0.02) return false
      const d = Math.min(Math.abs(h - seedH), 360 - Math.abs(h - seedH))
      return d < 25
    } catch { return false }
  }
  const rgbToHex = (v) => {
    const m = /^rgb\(\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*\)$/i.exec(v)
    if (!m) return '#000000'
    return '#' + m.slice(1, 4).map((x) => {
      const n = parseFloat(x)
      return Math.max(0, Math.min(255, Math.round(x.endsWith('%') ? (n / 100) * 255 : n))).toString(16).padStart(2, '0')
    }).join('')
  }
  const out = []
  for (const [, head, body] of sheet.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    if (!body.toLowerCase().includes(seed) && !new RegExp(seed.replace('#', ''), 'i').test(body)) continue
    const sel = head.split('}').pop().split('{').pop().trim()
    if (!sel || sel.startsWith('@')) continue
    const props = []
    for (const [, prop, raw] of body.matchAll(/(--bs-[a-z0-9-]+)\s*:\s*([^;]+)/gi)) {
      const v = raw.trim()
      if (v.toLowerCase() === seed) props.push([prop, 'brand'])
      else if (near(v)) props.push([prop, v])
    }
    if (props.length) out.push([sel, props])
  }
  return out
}
const BSLIVE = css.bootstrap ? bootstrapLive(css.bootstrap, SEED.brand) : []
console.log(`  ✓ Bootstrap: ${BSLIVE.reduce((n, [, p]) => n + p.length, 0)} of its compiled brand declarations can be rewritten live, across ${BSLIVE.length} rules`)

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
/* wall-bindings is NOT in here. Every kit's markup is rendered at build time
 * and shipped as WALLS, so the browser never renders a card — inlining the
 * tables put eighty kilobytes of every kit's class strings in a page that
 * cannot use them. */
const parts = ['color.mjs', 'zip.mjs', 'parts.mjs', 'roles.mjs', 'generate.mjs', 'scenes.mjs', 'stack.mjs', 'palettes.mjs']
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
  .replace('/*BSLIVE*/', () => JSON.stringify(BSLIVE))
  .replace('/*BSSEED*/', () => JSON.stringify(SEED.brand))
  .replace('/*SEEDS*/', () => JSON.stringify(SEEDS))
  .replace('/*FONTS*/', () => JSON.stringify({ google: gf.families, stacks: kitFonts(kits) }))
  /* Which of the variables this theme writes anything actually reads —
   * measured over the stylesheets already compiled above, so the page knows it
   * without a second build. */
  .replace('/*UNREAD*/', () => JSON.stringify(unread(analyse({
    kits, css, files: generate(SEED, IDS, kits), routed: darken(route(SEED, IDS, kits), kits), code: mdw.js }))))
  .replace('/*OWN*/', () => JSON.stringify(Object.fromEntries(RENDERS.map((id) => {
    const html = SCENES.map((s) => render(s.node, WALL[id])).join('')
    /* Ant Design's classes come out of its own render, so what it emitted IS
       what is theirs — the same question the meter asks, asked the same way. */
    const { used, theirs, els, elsTheirs } = ownage(html, css[id] ?? '',
      id === 'material' ? mdw.bundled : null, id === 'antd' ? kits.antd?.classes : null)
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
  .replace('/*SCRIPTS*/', () => safeJson({ material: mdw.js }))
  .replace('/*WALLS*/', () => safeJson(Object.fromEntries(RENDERS.map((id) => [id, wall(id)]))))
  .replace('/*ICONS*/', () => JSON.stringify(lu.icons))
for (const n of CHROME_ICONS) page = page.split(`<!--I:${n}-->`).join(svg(lu.icons, n, 14))
page = page.split('<!--MARK-->').join(mark(17))
/* A class in OUR markup with no rule anywhere.
 *
 * Three edits to the stylesheet took the whole font picker and the segmented
 * control with them, and the page shipped: the specimen rows lost their layout,
 * the tabs turned back into browser buttons, and every check we have still
 * passed, because a missing rule breaks nothing that can be asserted in node.
 *
 * Read from the SOURCE, never the built page — the built page carries every
 * kit's markup too, and those classes are styled by their own stylesheets
 * inside the frames. A check that cannot tell our chrome from their components
 * reports four hundred false alarms and gets switched off. */
{
  const tpl = readFileSync('page.template.html', 'utf8')
  const sheet = tpl.slice(tpl.indexOf('<style>'), tpl.indexOf('</style>'))
  const styled = new Set([...sheet.matchAll(/\.([a-z][a-z0-9_-]*)/gi)].map((m) => m[1]))
  const chrome = readFileSync('page.body.html', 'utf8') + tpl.slice(tpl.indexOf('<script'))
  const written = new Set()
  for (const m of chrome.matchAll(/class="([a-z][a-z0-9_ -]*)"/gi)) {
    for (const c of m[1].split(/\s+/)) if (c) written.add(c)
  }
  const bare = [...written].filter((c) => !styled.has(c))
  if (bare.length) {
    console.error(`build: no rule anywhere for ${bare.join(' ')} — our markup uses ${bare.length > 1 ? 'them' : 'it'} and our stylesheet does not.`)
    process.exit(1)
  }
}

/* A closing script tag that ends the page's own script early.
 *
 * This shipped once: scenes.mjs carries the wall's pan script, it is inlined
 * into the page's module, and the closing tag in its source ended that module
 * where it stood. The rest of the page parsed as HTML, nothing in the tool
 * drew, and the only clue was a run of SVG attribute errors from markup that
 * was never meant to be markup. Opens and closes have to balance. */
{
  /* Counted against the TEMPLATE, which is where every real script tag comes
   * from. An OPENING tag inside a value is harmless — it is the closing tag
   * that ends the block, so one more of those than the template has is a value
   * that got out. */
  const real = (readFileSync('page.template.html', 'utf8').match(/<\/script\b/g) ?? []).length
  const closes = (page.match(/<\/script\b/g) ?? []).length
  if (closes !== real) {
    console.error(`build: the template has ${real} closing script tag${real === 1 ? '' : 's'} and the page has ${closes} — a value wrote one. See safeJson in scenes.mjs.`)
    process.exit(1)
  }
}

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
