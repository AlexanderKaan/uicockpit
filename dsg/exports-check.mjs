/**
 * THE EXPORTS, CONSUMED.
 *
 * Two questions this answers, both Alexander's: do the exported files agree
 * with the kits and with each other, and does a project that actually USES an
 * export come out wearing the values?
 *
 * Part A is static: one generate() per stack, then cross-file agreement.
 * DESIGN.md, tokens.json and theme.css must carry the same values; AGENTS.md,
 * CLAUDE.md and .cursor/rules must be the same file under three names;
 * install.md and MANIFEST.md must name every kit at its fetched version.
 *
 * Part B is the consumer test: for each stack, a throwaway project is built
 * the way install.md says to build it. Bootstrap is compiled with its own
 * Sass from the exported _custom.scss. The Tailwind family is compiled by
 * Tailwind's own CLI over markup that uses the utilities the export claims to
 * generate. Radix and Mantine load the stylesheet their package ships plus
 * the exported block. Ant Design's exported token object is fed to Ant's own
 * renderer. Then a real Chrome measures computed styles: the button IS the
 * brand, the heading IS the face, the corner IS the radius, and every custom
 * property the export writes resolves in scope to the value it wrote.
 *
 *   npm run exports        exit 0 all good · 1 a finding · 2 environment
 */
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generate, SCOPE } from './generate.mjs'
import { openNpm } from './npm-read.mjs'
import { antdRender } from './antd-render.mjs'
import { antdNodes } from './antd-nodes.mjs'
import { SCENES } from './scenes.mjs'
import { SPECIMEN } from './parts.mjs'

const IDS = ['tailwind', 'daisyui', 'shadcn', 'bootstrap', 'material', 'radix', 'mantine', 'antd', 'openprops']
const kits = Object.fromEntries(IDS.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))
const V = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#fdfdfc', surface: '#f4f6f7',
  ink: '#16181c', inkMuted: '#5c6b72', line: '#dfe2e7', radius: '10px', baseText: '16px',
  space: '1', elevation: '1', lineHeight: '1.5', letterSpacing: '0em', fontWeight: '600',
  borderWidth: '1px', success: '#2f9e44', warning: '#f08c00', danger: '#e03131', focus: '#0b6e8a',
  fontHeading: 'Georgia, serif', fontBody: 'Verdana, sans-serif' }
const BRAND_RGB = 'rgb(11, 110, 138)'

const findings = []
const bad = (where, what) => findings.push(`${where}: ${what}`)

/* ── PART A — the files agree with the kits and with each other ─────────── */
const STACKS = [['bootstrap'], ['material'], ['radix'], ['mantine'], ['antd'], ['openprops'],
  ['tailwind'], ['tailwind', 'daisyui'], ['tailwind', 'shadcn'], IDS]

console.log('A · one export per stack, cross-checked…')
for (const ids of STACKS) {
  const label = ids.length === IDS.length ? 'all nine' : ids.join('+')
  let f
  try { f = generate(V, ids, kits) } catch (e) { bad(label, `generate threw: ${e.message}`); continue }

  /* one rules file under three names, or one of the tools reads a stale copy */
  if (f['AGENTS.md'] !== f['CLAUDE.md'] || f['AGENTS.md'] !== f['.cursor/rules']) {
    bad(label, 'AGENTS.md, CLAUDE.md and .cursor/rules are not the same file')
  }

  /* tokens.json speaks W3C tokens, and its values are OUR values */
  const tokens = JSON.parse(f['tokens.json'])
  if (tokens.color?.brand?.$value !== V.brand) bad(label, `tokens.json brand is ${tokens.color?.brand?.$value}, values say ${V.brand}`)
  if (tokens.color?.page?.$value !== V.page) bad(label, `tokens.json page is ${tokens.color?.page?.$value}`)

  /* DESIGN.md's front matter carries the same colour and faces */
  const front = f['DESIGN.md'].split('---')[1] ?? ''
  if (!front.includes(`primary: "${V.brand}"`)) bad(label, 'DESIGN.md front matter does not carry the brand')
  if (!front.includes(V.fontHeading)) bad(label, 'DESIGN.md front matter does not carry the heading face')

  /* the theme has a block per kit, and the papers name every kit at its version */
  for (const id of ids) {
    const kit = kits[id]
    if (!f._blocks[id]) { bad(label, `theme.css has no block for ${id}`); continue }
    if (!f['theme.css'].includes(f._blocks[id].slice(0, 60))) bad(label, `theme.css does not contain ${id}'s block`)
    if (kit.version && !f['MANIFEST.md'].includes(kit.version)) bad(label, `MANIFEST.md does not name ${kit.name} ${kit.version}`)
    if (!f['install.md'].includes(kit.name)) bad(label, `install.md does not name ${kit.name}`)
    /* the block carries the brand where the kit can take one as a variable;
       Radix routes the accent through data-accent-color by design, Material
       and Ant derive from a seed, and their files say so instead */
    if (['bootstrap', 'mantine', 'openprops', 'tailwind', 'daisyui', 'shadcn'].includes(id)
      && !f._blocks[id].includes(V.brand) && !f._blocks[id].toLowerCase().includes('11 110 138')) {
      bad(label, `${id}'s block never writes the brand ${V.brand}`)
    }
  }
}
console.log(`  ${findings.length === 0 ? '✓ every stack agrees across its files' : `✗ ${findings.length} findings so far`}`)

/* ── PART B — a consumer project per stack, measured in a real Chrome ────── */
const CHROME = process.env.CHROME
  ?? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync)
if (!CHROME) { console.error('exports: no Chrome found — set CHROME=/path/to/chrome'); process.exit(2) }

/* only the LIGHT half of a block: every kit's export also carries its dark
   section, and scraping that too made the checker demand dark literals of a
   light frame */
const lightHalf = (block) => {
  const m = /\.dark\b|prefers-color-scheme:\s*dark|data-(?:bs-theme|theme|mantine-color-scheme)=['"]?dark/.exec(block)
  return m ? block.slice(0, m.index) : block
}
const props = (block) => [...lightHalf(block).matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)]
  .map(([, name, value]) => ({ name, value: value.trim() }))
  .filter((p) => !p.value.includes('var('))

const frames = []
const frame = (id, css, body, opts = {}) => frames.push({ id, css, body,
  vars: opts.vars ?? [], varScope: opts.varScope ?? ':root', html: opts.html ?? '', expects: opts.expects ?? [] })

console.log('B · building consumer projects (their installers, their compilers)…')

/* Bootstrap, exactly as install.md says: its own Sass over the exported file */
{
  const f = generate(V, ['bootstrap'], kits)
  const dir = mkdtempSync(join(tmpdir(), 'dsg-export-bs-'))
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ private: true,
    devDependencies: { bootstrap: kits.bootstrap.version, sass: '^1.80.0' } }))
  execFileSync('npm', ['install', '--silent', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'pipe' })
  writeFileSync(join(dir, '_custom.scss'), f['_custom.scss'])
  execFileSync('npx', ['sass', '--quiet', '--load-path=node_modules', '_custom.scss', 'out.css'], { cwd: dir, stdio: 'pipe' })
  const css = readFileSync(join(dir, 'out.css'), 'utf8') + '\n' + f._blocks.bootstrap
  rmSync(dir, { recursive: true, force: true })
  frame('bootstrap', css,
    `<button type="button" class="btn btn-primary" data-probe="btn">Primary</button>
     <h2 data-probe="h">Heading</h2>`,
    { expects: [
      { probe: 'btn', prop: 'backgroundColor', value: BRAND_RGB },
      { probe: 'btn', prop: 'borderRadius', value: V.radius },
      { probe: 'h', prop: 'fontFamily', contains: 'Georgia' },
    ] })
  console.log('  ✓ bootstrap compiled by its own Sass')
}

/* The Tailwind family, compiled by Tailwind's own CLI over consumer markup */
{
  const f = generate(V, ['tailwind', 'daisyui', 'shadcn'], kits)
  const dir = mkdtempSync(join(tmpdir(), 'dsg-export-tw-'))
  mkdirSync(join(dir, 'src'))
  const dev = { '@tailwindcss/cli': `^${kits.tailwind.version}`, tailwindcss: `^${kits.tailwind.version}`,
    daisyui: `^${kits.daisyui.version}` }
  if (kits.shadcn.animates) dev[kits.shadcn.animates.npm] = `^${kits.shadcn.animates.version}`
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ private: true, type: 'module', devDependencies: dev }))
  execFileSync('npm', ['install', '--silent', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'pipe' })
  const RUNS = [
    ['tailwind', '', `<button class="bg-brand text-brand-foreground rounded-lg" data-probe="btn">Go</button>
      <p class="text-ink-muted" data-probe="muted">m</p>`,
    [{ probe: 'btn', prop: 'backgroundColor', value: BRAND_RGB },
      { probe: 'btn', prop: 'borderRadius', value: V.radius },
      { probe: 'muted', prop: 'color', value: 'rgb(92, 107, 114)' }]],
    ['daisyui', '@plugin "daisyui";', `<button class="btn btn-primary" data-probe="btn">Go</button>`,
      [{ probe: 'btn', prop: 'backgroundColor', value: BRAND_RGB }]],
    ['shadcn', kits.shadcn.animates ? '@import "tw-animate-css";' : '',
      `<button class="bg-primary text-primary-foreground rounded-md" data-probe="btn">Go</button>`,
      [{ probe: 'btn', prop: 'backgroundColor', value: BRAND_RGB }]],
  ]
  for (const [id, plugin, body, expects] of RUNS) {
    writeFileSync(join(dir, `src/${id}.html`), body)
    writeFileSync(join(dir, `src/${id}.css`), `@import "tailwindcss";\n${plugin}\n${f._blocks[id]}`)
    execFileSync('npx', ['@tailwindcss/cli', '-i', `src/${id}.css`, '-o', `${id}.css`, '--content', `src/${id}.html`], { cwd: dir, stdio: 'pipe' })
    frame(id, readFileSync(join(dir, `${id}.css`), 'utf8'), body, { expects })
    console.log(`  ✓ ${id} compiled by Tailwind's own CLI`)
  }
  rmSync(dir, { recursive: true, force: true })
}

/* Radix and Mantine: the stylesheet their package ships, plus the export */
{
  const f = generate(V, ['radix'], kits)
  const p = openNpm(`@radix-ui/themes@${kits.radix.version}`)
  frame('radix', p.read('styles.css') + '\n' + f._blocks.radix,
    `<div class="radix-themes" data-accent-color="indigo" data-gray-color="slate" data-radius="medium" data-scaling="100%">
       <h1 class="rt-Heading" data-probe="h">Heading</h1></div>`,
    { vars: props(f._blocks.radix), varScope: '.radix-themes',
      expects: [{ probe: 'h', prop: 'fontFamily', contains: 'Georgia' }] })
  console.log('  ✓ radix: their styles.css plus the exported block')
}
{
  const f = generate(V, ['mantine'], kits)
  const p = openNpm(`@mantine/core@${kits.mantine.version}`)
  frame('mantine', p.read('styles.css') + '\n' + f._blocks.mantine,
    `<div data-probe="fill" style="background:var(--mantine-primary-color-filled)">x</div>`,
    { html: ' data-mantine-color-scheme="light"',
      vars: props(f._blocks.mantine), varScope: 'body',
      expects: [{ probe: 'fill', prop: 'backgroundColor', value: BRAND_RGB }] })
  console.log('  ✓ mantine: their styles.css plus the exported block')
}

/* Material and Open Props: the variables the export writes, in scope */
{
  const f = generate(V, ['material'], kits)
  frame('material', f._blocks.material, '', { vars: props(f._blocks.material) })
  const g = generate(V, ['openprops'], kits)
  const op = openNpm(`open-props@${kits.openprops.version}`)
  frame('openprops', op.read('open-props.min.css') + '\n' + g._blocks.openprops, '',
    { vars: props(g._blocks.openprops), varScope: 'html' })
  console.log('  ✓ material and openprops staged as variables')
}

/* Ant Design: the exported token object through Ant's own renderer, node-side */
{
  const f = generate(V, ['antd'], kits)
  const m = /token:\s*\{([^}]*)\}/.exec(f['antd.theme.ts'])
  if (!m) bad('antd', 'antd.theme.ts carries no token object')
  else {
    const token = JSON.parse(`{${m[1]}}`)
    const got = antdRender({ token, nodes: antdNodes(SCENES, SPECIMEN), icons: {} })
    if (!got.css.includes(V.brand) && !got.css.toLowerCase().includes('11, 110, 138')) {
      bad('antd', `their renderer, fed the exported tokens, never writes ${V.brand}`)
    } else console.log("  ✓ antd: exported tokens through Ant's own renderer carry the brand")
    if (token.borderRadius !== parseInt(V.radius)) bad('antd', `exported borderRadius is ${token.borderRadius}, values say ${parseInt(V.radius)}`)
  }
}

/* ── the proof page: every frame measured by a real Chrome ──────────────── */
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
const page = `<!doctype html><meta charset="utf-8"><title>exports proof</title><body>
${frames.map((fr) => `<iframe id="f_${fr.id}" srcdoc="${esc(`<!doctype html><html${fr.html}><meta charset=utf-8><style>${fr.css}</style><body>${fr.body}`)}" style="width:900px;height:300px"></iframe>`).join('\n')}
<script>
const FRAMES = ${JSON.stringify(frames.map(({ id, vars, varScope, expects }) => ({ id, vars, varScope, expects })))};
addEventListener('load', () => setTimeout(() => {
  const out = {}
  for (const fr of FRAMES) {
    const doc = document.getElementById('f_' + fr.id).contentDocument
    const misses = []
    const scope = doc.querySelector(fr.varScope) ?? doc.documentElement
    for (const v of fr.vars) {
      const got = getComputedStyle(scope).getPropertyValue(v.name).trim()
      if (got.replace(/\\s+/g, ' ') !== v.value.replace(/\\s+/g, ' ')) misses.push(v.name + ' = "' + got + '" wanted "' + v.value + '"')
    }
    for (const e of fr.expects) {
      const el = doc.querySelector('[data-probe="' + e.probe + '"]')
      if (!el) { misses.push('no probe ' + e.probe); continue }
      const got = getComputedStyle(el)[e.prop]
      if (e.value != null && got !== e.value) misses.push(e.probe + '.' + e.prop + ' = "' + got + '" wanted "' + e.value + '"')
      if (e.contains != null && !String(got).includes(e.contains)) misses.push(e.probe + '.' + e.prop + ' = "' + got + '" wanted ~"' + e.contains + '"')
    }
    out[fr.id] = misses
  }
  const pre = document.createElement('pre'); pre.id = 'verdict'
  pre.textContent = JSON.stringify(out); document.body.appendChild(pre)
}, 400))
</script>`

const dir = mkdtempSync(join(tmpdir(), 'dsg-export-proof-'))
const proof = join(dir, 'proof.html')
writeFileSync(proof, page)

console.log('B · measuring in Chrome…')
const chrome = spawn(CHROME, ['--headless', '--disable-gpu', '--allow-file-access-from-files',
  '--remote-debugging-pipe', 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] })
try {
  const send = (() => {
    let id = 0; const pending = new Map(); let buf = Buffer.alloc(0)
    chrome.stdio[4].on('data', (d) => {
      buf = Buffer.concat([buf, d]); let i
      while ((i = buf.indexOf(0)) >= 0) {
        const msg = JSON.parse(buf.subarray(0, i).toString('utf8')); buf = buf.subarray(i + 1)
        if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
      }
    })
    return (method, params, sessionId) => new Promise((resolve) => {
      pending.set(++id, resolve)
      chrome.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0')
    })
  })()
  const target = (await send('Target.createTarget', { url: 'file://' + proof })).result.targetId
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId: target, flatten: true })
  /* the machine running this may be in dark mode, and headless inherits it:
     Material's and Open Props' dark media blocks then beat the light literals */
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] }, sessionId)
  let verdict = null
  for (let i = 0; i < 100 && !verdict; i++) {
    await new Promise((r) => setTimeout(r, 150))
    const r = await send('Runtime.evaluate', { expression: "document.getElementById('verdict')?.textContent ?? ''", returnByValue: true }, sessionId)
    const text = r.result?.result?.value
    if (text) verdict = JSON.parse(text)
  }
  if (!verdict) { console.error('exports: the proof page never produced a verdict'); process.exit(2) }
  for (const [id, misses] of Object.entries(verdict)) {
    if (misses.length) { for (const m of misses) bad(id, m) }
    const fr = frames.find((f) => f.id === id)
    console.log(`  ${misses.length ? '✗' : '✓'} ${id.padEnd(10)} ${fr.expects.length} probes · ${fr.vars.length} variables${misses.length ? ` · ${misses.length} misses` : ''}`)
  }
} finally { chrome.kill(); rmSync(dir, { recursive: true, force: true }) }

if (findings.length) {
  console.error(`\nexports: ${findings.length} findings`)
  for (const f of findings) console.error('  ' + f)
  process.exit(1)
}
console.log('\nEvery export agrees with its kit and with its siblings, and a consumer build wears the values.')
