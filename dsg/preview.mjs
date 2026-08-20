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
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generate } from './generate.mjs'
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

/* ── the CSS each kit really needs ────────────────────────────────────────── */
const dir = mkdtempSync(join(tmpdir(), 'dsg-preview-'))
const css = {}
try {
  const files = generate(VALUES, IDS, kits)

  /* Tailwind, daisyUI and shadcn all compile through Tailwind. Their markup is
     scanned so only the utilities actually used are emitted. */
  mkdirSync(join(dir, 'src'), { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'p', private: true, type: 'module',
    devDependencies: { '@tailwindcss/cli': `^${kits.tailwind.version}`, tailwindcss: `^${kits.tailwind.version}`, daisyui: `^${kits.daisyui.version}` } }))
  for (const [id, plugin] of [['tailwind', ''], ['daisyui', '@plugin "daisyui";'], ['shadcn', '']]) {
    writeFileSync(join(dir, `src/${id}.html`), body(id))
    /* ONLY this kit's block. Loading the whole theme.css put shadcn's --border
       (a colour) into daisyUI's --border (a width) and every checkbox lost its
       outline — the exact collision the manifest now reports. */
    writeFileSync(join(dir, `src/${id}.css`), `@import "tailwindcss";\n${plugin}\n${files._blocks[id]}`)
  }
  console.log('installing the kits the package names…')
  execFileSync('npm', ['install', '--silent', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'pipe' })
  for (const id of ['tailwind', 'daisyui', 'shadcn']) {
    execFileSync('npx', ['@tailwindcss/cli', '-i', `src/${id}.css`, '-o', `${id}.out.css`, '--content', `src/${id}.html`], { cwd: dir, stdio: 'pipe' })
    css[id] = readFileSync(join(dir, `${id}.out.css`), 'utf8')
  }

  /* Bootstrap's brand is compiled, so the preview COMPILES it. Showing the wall
     in Bootstrap's factory blue while the manifest promises your teal would read
     as a broken tool — the wall has to do what the package says it does. */
  console.log('compiling Bootstrap from the Sass entry point the package ships…')
  execFileSync('npm', ['install', '--silent', '--no-audit', '--no-fund', `bootstrap@${kits.bootstrap.version}`, 'sass'], { cwd: dir, stdio: 'pipe' })
  writeFileSync(join(dir, 'custom.scss'), files['_custom.scss'].replace('bootstrap/scss/bootstrap', 'node_modules/bootstrap/scss/bootstrap'))
  try {
    execFileSync('npx', ['sass', '--no-source-map', '--load-path=.', 'custom.scss', 'bootstrap.out.css'], { cwd: dir, stdio: 'pipe' })
    css.bootstrap = readFileSync(join(dir, 'bootstrap.out.css'), 'utf8') + '\n' + files._blocks.bootstrap
  } catch (e) {
    console.error('  ✗ the Sass build failed — falling back to their shipped CSS, so the brand will be Bootstrap\'s own')
    const bs = join(dir, 'node_modules/bootstrap/dist/css/bootstrap.min.css')
    css.bootstrap = (existsSync(bs) ? readFileSync(bs, 'utf8') : '') + '\n' + files._blocks.bootstrap
  }

  /* Material DERIVES its 47 colour roles from the seed. Setting only --primary
     and leaving the other 46 at Material's factory purple is exactly the
     half-applied theme the manifest warns about — so the preview runs their own
     generator, which is what `derives` was always supposed to mean. */
  console.log('deriving the Material scheme with its own generator…')
  let mt = Object.entries(kits.material.modes.light).map(([k, v]) => `${k}:${v}`).join(';')
  try {
    execFileSync('npm', ['install', '--silent', '--no-audit', '--no-fund', '@material/material-color-utilities'], { cwd: dir, stdio: 'pipe' })
    /* Their package ships extensionless ESM imports, which Node will not
       resolve on its own. A resolve hook is the whole fix — and it is their
       algorithm doing the work either way, which is the point. */
    writeFileSync(join(dir, 'ts-loader.mjs'), `import { register } from 'node:module'
register('data:text/javascript,' + encodeURIComponent(\`
export async function resolve(spec, ctx, next) {
  if (spec.startsWith('.') && !/\\\\.[a-z]+$/i.test(spec)) { try { return await next(spec + '.js', ctx) } catch {} }
  return next(spec, ctx)
}\`), import.meta.url)`)
    writeFileSync(join(dir, 'derive.mjs'), `import { themeFromSourceColor, argbFromHex, hexFromArgb } from '@material/material-color-utilities'
const t = themeFromSourceColor(argbFromHex(process.argv[2]))
const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
console.log(JSON.stringify(Object.fromEntries(Object.entries(t.schemes.light.toJSON())
  .map(([k, v]) => ['--md-sys-color-' + kebab(k), hexFromArgb(v)]))))`)
    const derived = JSON.parse(execFileSync('node', ['--import', './ts-loader.mjs', 'derive.mjs', VALUES.brand], { cwd: dir, encoding: 'utf8' }))
    mt = `${mt};${Object.entries(derived).map(([k, v]) => `${k}:${v}`).join(';')}`
    console.log(`  ✓ ${Object.keys(derived).length} roles derived from ${VALUES.brand} by Material's own generator`)
  } catch (e) {
    console.error(`  ✗ could not run Material's generator (${e.message.split('\n')[0]}) — showing its factory scheme instead`)
  }
  css.material = `:root{${mt}}\n` + files._blocks.material
} finally { rmSync(dir, { recursive: true, force: true }) }

/* ── one page, five documents ─────────────────────────────────────────────── */
const frame = (id) => {
  const doc = `<!doctype html><meta charset="utf-8"><style>${css[id] ?? ''}
    body{margin:0;padding:20px;background:${VALUES.page};font-family:ui-sans-serif,system-ui,sans-serif}
    main{display:grid;grid-template-columns:repeat(12,1fr);gap:16px;align-items:start}
    .cap{margin:0 0 8px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.5;font-weight:600}
  </style><body><main>${body(id)}</main>`
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
