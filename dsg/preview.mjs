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
import { materialElements } from './material-elements.mjs'
import { buildCss } from './build-css.mjs'
import { render } from './parts.mjs'
import { WALL } from './wall-bindings.mjs'
import { SCENES } from './scenes.mjs'

const OUT = process.argv[2] ?? 'wall.html'
const VALUES = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#f7f9fa', surface: '#ffffff',
  ink: '#16181c', inkMuted: '#5c6b72', line: '#dfe2e7', radius: '10px', baseText: '1rem' }
const IDS = ['tailwind', 'daisyui', 'shadcn', 'bootstrap', 'material']
const kits = Object.fromEntries(IDS.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))

const body = (id) => SCENES.map((s) =>
  `<section style="grid-column:span ${s.span}"><p class="cap">${s.title}</p>${render(s.node, WALL[id])}</section>`).join('')

const css = await buildCss(VALUES, IDS, kits, body)

/* Material's components are code. Written beside the page rather than into the
 * srcdoc attribute, where every quote in 260 kB of their bundle would become
 * six characters. A srcdoc frame resolves relative URLs against this page. */
const mdw = materialElements()
writeFileSync('wall.elements.js', mdw.js)
const ELEMENTS = { material: './wall.elements.js' }
const files = generate(VALUES, IDS, kits)

/* ── one page, five documents ─────────────────────────────────────────────── */
const frame = (id) => {
  const doc = `<!doctype html><meta charset="utf-8"><style>${css[id] ?? ''}
    body{margin:0;padding:20px;background:${VALUES.page};font-family:ui-sans-serif,system-ui,sans-serif}
    main{display:grid;grid-template-columns:repeat(12,1fr);gap:16px;align-items:start}
    .cap{margin:0 0 8px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.5;font-weight:600}
  </style><body><main>${body(id)}</main>${ELEMENTS[id] ? `<script type="module" src="${ELEMENTS[id]}"></` + `script>` : ''}`
  return `<figure class="k"><figcaption>${kits[id].name} <span>${kits[id].version ?? 'live'} · ${kits[id].license ?? ''}</span></figcaption>
    <iframe loading="lazy" srcdoc="${doc.replace(/"/g, '&quot;')}"></iframe></figure>`
}

writeFileSync(OUT, `<!doctype html><html lang="en"><meta charset="utf-8">
<title>Your kit, in five systems</title>
<style>
  body{margin:0;background:#eef1f3;font:14px/1.5 ui-sans-serif,system-ui,sans-serif;color:#16181c}
  header{padding:24px 28px 8px}
  h1{margin:0 0 4px;font-size:20px;letter-spacing:-.02em}
  header p{margin:0;color:#5c6b72;font-size:13px}
  .k{margin:0;padding:14px 28px 0}
  figcaption{display:flex;align-items:baseline;gap:10px;font-weight:600;margin-bottom:8px}
  figcaption span{font-weight:400;font-size:12px;color:#5c6b72}
  iframe{width:100%;height:760px;border:1px solid #d7dde1;border-radius:12px;background:#fff;display:block}
</style>
<header><h1>Your kit, in five systems</h1>
<p>Same scenes, same values — ${Object.entries(VALUES).map(([k, v]) => `${k} ${v}`).join(' · ')}. Each frame is that kit's own CSS.</p></header>
${IDS.map(frame).join('\n')}
<p style="padding:20px 28px 40px;color:#5c6b72;font-size:12px">Tailwind, daisyUI and shadcn compiled by Tailwind's own CLI from the generated package. Bootstrap is its shipped stylesheet with our variables after it. Material is its tokens.</p>
`)
console.log(`\n${OUT} — five kits, ${SCENES.length} scenes each`)
for (const id of IDS) console.log(`  ${kits[id].name.padEnd(14)} ${((css[id]?.length ?? 0) / 1024).toFixed(0).padStart(4)} kB CSS`)
