/**
 * RENDER THE WALL, WITH EACH KIT'S REAL CSS.
 *
 * Not an approximation: Tailwind and daisyUI are compiled by Tailwind's own CLI
 * from the package we generate, Bootstrap uses its shipped stylesheet with our
 * variables over it, and Material is its tokens (its binding is inline styles,
 * so nothing else is needed to see it).
 *
 * Each kit gets its own IFRAME. Bootstrap's stylesheet is global and Tailwind's
 * preflight is global; put them on one page and they fight, and what you would
 * be looking at is the fight rather than the kits. One document each is the only
 * honest way to show five at once.
 *
 *   node preview.mjs [out.html]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { generate } from './generate.mjs'
import { route } from './roles.mjs'
import { materialElements } from './material-elements.mjs'
import { buildCss } from './build-css.mjs'
import { render } from './parts.mjs'
import { WALL, useIcons, useMantineClasses } from './wall-bindings.mjs'
import { SCENES, ICON_NAMES, wallMarkup } from './scenes.mjs'
import { icons } from './icons.mjs'

const OUT = process.argv[2] ?? 'wall.html'
/* EVERY role, not the nine this started with.
 *
 * A role left blank writes no variable, so the kit keeps its own default and
 * the preview quietly shows something the product would not: Mantine's headings
 * stayed at its published 700 while the weight knob said 600, and it looked
 * like a binding bug for twenty minutes. Third harness to be caught by this —
 * fidelity and orphans both had it — so it is written out in full here too. */
const VALUES = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#f7f9fa', surface: '#ffffff',
  ink: '#16181c', inkMuted: '#5c6b72', line: '#dfe2e7', radius: '10px', baseText: '16px',
  space: '1', elevation: '1', lineHeight: '1.5', letterSpacing: '0em', fontWeight: '600',
  borderWidth: '1px', success: '#2f9e44', warning: '#f08c00', danger: '#e03131', focus: '#0b6e8a',
  fontHeading: 'Fraunces, serif', fontBody: 'Inter, sans-serif' }
/* Seven walls on one page is seven stylesheets and two megabytes of CSS, which
 * is more than a browser will paint at once when you only wanted to look at
 * one. DSG_KITS narrows it, the same switch build-page.mjs takes. */
const IDS = (process.env.DSG_KITS ?? 'tailwind,daisyui,shadcn,bootstrap,material,radix,mantine').split(',')
const kits = Object.fromEntries(IDS.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))
useMantineClasses(JSON.parse(readFileSync('kits/mantine.json', 'utf8')).classes)
useIcons(icons(ICON_NAMES).icons)

const body = (id) => wallMarkup(WALL[id])

const css = await buildCss(VALUES, IDS, kits, body)

/* Material's components are code. Written beside the page rather than into the
 * srcdoc attribute, where every quote in 260 kB of their bundle would become
 * six characters. A srcdoc frame resolves relative URLs against this page. */
const mdw = materialElements()
writeFileSync('wall.elements.js', mdw.js)
const ELEMENTS = { material: './wall.elements.js' }
const files = generate(VALUES, IDS, kits)

/* ── one page, five documents ─────────────────────────────────────────────── */
const ROOT = { daisyui: ' data-theme="yourkit"', bootstrap: ' data-bs-theme="light"',
  radix: ' class="radix-themes light" data-is-root-theme="true" data-has-background="true" data-panel-background="translucent"',
  mantine: ' data-mantine-color-scheme="light"' }
/* The ampersand matters. srcdoc is an ATTRIBUTE, so its value is entity-decoded
 * before the document is parsed: Radix Themes' stylesheet contains &, and with
 * only the quotes escaped the whole 800 kB sheet arrived mangled — the frame
 * rendered as bare unstyled text with no error anywhere. */
/* Some kits take a named SETTING rather than a value — Radix's accent, radius
 * and scaling are attributes on the theme root, not custom properties. The tool
 * sets them on every repaint; a static page has to write them into the tag, or
 * --accent-9 and --scaling never resolve and the whole kit renders as bare
 * unstyled text with nothing in the console to say why. */
const attrs = (id) => Object.entries(route(VALUES, [id], kits)[0]?.attrs ?? {})
  .map(([a, v]) => ` ${a}="${v}"`).join('')

const frame = (id) => {
  /* No layout of ours around it: body(id) IS the wall, the same strip the tool
     shows, with its own chrome and its own pan. */
  const doc = `<!doctype html><html${ROOT[id] ?? ''}${attrs(id)}><meta charset="utf-8"><style>${css[id] ?? ''}</style><body>${body(id)}${
    ELEMENTS[id] ? `<script type="module" src="${ELEMENTS[id]}"></` + `script>` : ''}`
  return `<figure class="k"><figcaption>${kits[id].name} <span>${kits[id].version ?? 'live'} · ${kits[id].license ?? ''}</span></figcaption>
    <iframe loading="lazy" srcdoc="${doc.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></iframe></figure>`
}

writeFileSync(OUT, `<!doctype html><html lang="en"><meta charset="utf-8">
<title>Your kit, in ${IDS.length} systems</title>
<style>
  body{margin:0;background:#eef1f3;font:14px/1.5 ui-sans-serif,system-ui,sans-serif;color:#16181c}
  header{padding:24px 28px 8px}
  h1{margin:0 0 4px;font-size:20px;letter-spacing:-.02em}
  header p{margin:0;color:#5c6b72;font-size:13px}
  .k{margin:0;padding:14px 28px 0}
  figcaption{display:flex;align-items:baseline;gap:10px;font-weight:600;margin-bottom:8px}
  figcaption span{font-weight:400;font-size:12px;color:#5c6b72}
  iframe{width:100%;height:780px;border:1px solid #d7dde1;border-radius:12px;background:#fff;display:block}
</style>
<header><h1>Your kit, in ${IDS.length} systems</h1>
<p>Same scenes, same values — ${Object.entries(VALUES).map(([k, v]) => `${k} ${v}`).join(' · ')}. Each frame is that kit's own CSS.</p></header>
${IDS.map(frame).join('\n')}
<p style="padding:20px 28px 40px;color:#5c6b72;font-size:12px">Tailwind, daisyUI and shadcn compiled by Tailwind's own CLI from the generated package. Bootstrap is its shipped stylesheet with our variables after it. Material is its tokens.</p>
`)
console.log(`\n${OUT} — ${IDS.length} kits, ${SCENES.length} cards each`)
for (const id of IDS) console.log(`  ${kits[id].name.padEnd(14)} ${((css[id]?.length ?? 0) / 1024).toFixed(0).padStart(4)} kB CSS`)
