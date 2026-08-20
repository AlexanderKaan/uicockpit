/**
 * BUILD EACH KIT'S REAL CSS, ONCE.
 *
 * Shared by the quick preview and by the page, so what you look at while
 * turning a knob is compiled the same way as what you download. Two things here
 * cannot happen in a browser and that is the honest constraint the page is
 * built around: Bootstrap's brand is compiled by Sass, and Material derives its
 * scheme with its own generator. Everything else is custom properties, which a
 * running page CAN change — so the page changes those live and marks the two
 * that need a rebuild.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generate } from './generate.mjs'
import { deriveMaterial } from './derive-material.mjs'

export async function buildCss(VALUES, IDS, kits, body, log = console.log) {
  const dir = mkdtempSync(join(tmpdir(), 'dsg-css-'))
  const css = {}
  try {
/* ── the CSS each kit really needs ────────────────────────────────────────── */
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
  log('installing the kits the package names…')
  execFileSync('npm', ['install', '--silent', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'pipe' })
  for (const id of ['tailwind', 'daisyui', 'shadcn']) {
    execFileSync('npx', ['@tailwindcss/cli', '-i', `src/${id}.css`, '-o', `${id}.out.css`, '--content', `src/${id}.html`, '--minify'], { cwd: dir, stdio: 'pipe' })
    css[id] = readFileSync(join(dir, `${id}.out.css`), 'utf8')
  }

  /* Bootstrap's brand is compiled, so the preview COMPILES it. Showing the wall
     in Bootstrap's factory blue while the manifest promises your teal would read
     as a broken tool — the wall has to do what the package says it does. */
  log('compiling Bootstrap from the Sass entry point the package ships…')
  if (!IDS.includes('bootstrap')) return css
  execFileSync('npm', ['install', '--silent', '--no-audit', '--no-fund', `bootstrap@${kits.bootstrap.version}`, 'sass'], { cwd: dir, stdio: 'pipe' })
  writeFileSync(join(dir, 'custom.scss'), files['_custom.scss'].replace('bootstrap/scss/bootstrap', 'node_modules/bootstrap/scss/bootstrap'))
  try {
    execFileSync('npx', ['sass', '--no-source-map', '--style=compressed', '--load-path=.', 'custom.scss', 'bootstrap.out.css'], { cwd: dir, stdio: 'pipe' })
    css.bootstrap = readFileSync(join(dir, 'bootstrap.out.css'), 'utf8') + '\n' + files._blocks.bootstrap
  } catch (e) {
    log('  ✗ the Sass build failed — falling back to their shipped CSS, so the brand will be Bootstrap\'s own')
    const bs = join(dir, 'node_modules/bootstrap/dist/css/bootstrap.min.css')
    css.bootstrap = (existsSync(bs) ? readFileSync(bs, 'utf8') : '') + '\n' + files._blocks.bootstrap
  }

  /* Material DERIVES its 47 colour roles from the seed. Setting only --primary
     and leaving the other 46 at Material's factory purple is exactly the
     half-applied theme the manifest warns about — so the preview runs their own
     generator, which is what `derives` was always supposed to mean. */
  log('deriving the Material scheme with its own generator…')
  let mt = Object.entries(kits.material.modes.light).map(([k, v]) => `${k}:${v}`).join(';')
  try {
    execFileSync('npm', ['install', '--silent', '--no-audit', '--no-fund', '@material/material-color-utilities'], { cwd: dir, stdio: 'pipe' })
    const derived = deriveMaterial(VALUES.brand, dir)
    if (derived.error) throw new Error(derived.error)
    mt = `${mt};${Object.entries(derived.light).map(([k, v]) => `${k}:${v}`).join(';')}`
    log(`  ✓ ${Object.keys(derived.light).length} roles derived from ${VALUES.brand} by Material's own generator`)
  } catch (e) {
    log(`  ✗ could not run Material's generator (${e.message.split('\n')[0]}) — showing its factory scheme instead`)
  }
  css.material = `:root{${mt}}\n` + files._blocks.material



    return css
  } finally { rmSync(dir, { recursive: true, force: true }) }
}
