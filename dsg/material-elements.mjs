/**
 * MATERIAL 3, FOR REAL.
 *
 * Every other kit in here is CSS: you load their stylesheet and write their
 * class names. Material is not. Its components are custom elements, and until
 * now we drew Material-ish rectangles with ninety inline styles of our own —
 * which is the one thing this whole tool exists not to do.
 *
 * So this bundles Google's actual `@material/web` package. The elements on the
 * page are theirs, running their code, styled by their tokens.
 *
 * Three things are read from the package rather than assumed:
 *   · custom-elements.json — THEIR declaration of which tags exist. An element
 *     we emit that is not in it is one we made up.
 *   · esbuild's metafile — which of those tags this bundle actually defines.
 *     A tag that is theirs by name but absent from the bundle renders as an
 *     unknown element: it would look like a gap in their kit and be ours.
 *   · md-typescale-styles.css — they ship real typography classes, so the text
 *     on the page can be theirs too instead of our font sizes.
 *
 * The bundle is cached in kits/material.elements.json because it costs an npm
 * install; delete that file or pass --refresh to read the package again.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CACHE = 'kits/material.elements.json'

/* What the wall needs. Each line is a module Google publishes; nothing here is
 * a component of ours, and anything the wall wants that is not on this list is
 * something Material does not ship. */
const IMPORTS = [
  'button/filled-button.js', 'button/outlined-button.js', 'button/text-button.js',
  'button/filled-tonal-button.js', 'checkbox/checkbox.js', 'switch/switch.js',
  'textfield/outlined-text-field.js', 'select/outlined-select.js', 'select/select-option.js',
  'tabs/tabs.js', 'tabs/primary-tab.js', 'divider/divider.js',
  'chips/chip-set.js', 'chips/assist-chip.js', 'chips/suggestion-chip.js',
  'list/list.js', 'list/list-item.js', 'labs/card/outlined-card.js', 'labs/card/filled-card.js',
]

export function materialElements({ refresh = false } = {}) {
  if (!refresh && existsSync(CACHE)) return JSON.parse(readFileSync(CACHE, 'utf8'))

  const dir = mkdtempSync(join(tmpdir(), 'dsg-mdw-'))
  try {
    const run = (cmd, args) => execFileSync(cmd, args, { cwd: dir, stdio: 'pipe', encoding: 'utf8' })
    writeFileSync(join(dir, 'package.json'), '{"type":"module","private":true}')
    run('npm', ['install', '--silent', '--no-audit', '--no-fund', '@material/web@latest'])

    const pkgDir = join(dir, 'node_modules/@material/web')
    const meta = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
    writeFileSync(join(dir, 'entry.js'), IMPORTS.map((m) => `import '@material/web/${m}'`).join('\n'))
    run('npx', ['--yes', 'esbuild', 'entry.js', '--bundle', '--format=esm', '--minify',
      '--outfile=bundle.js', '--metafile=meta.json', '--log-level=error'])

    /* Which modules ended up in the bundle — used below to keep the tag list
     * honest about what will actually be defined in the browser. */
    const inputs = new Set(Object.keys(JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8')).inputs)
      .filter((p) => p.includes('@material/web/'))
      .map((p) => p.split('@material/web/')[1]))

    const manifest = JSON.parse(readFileSync(join(pkgDir, 'custom-elements.json'), 'utf8'))
    const declares = [], bundled = []
    for (const mod of manifest.modules ?? []) {
      for (const d of mod.declarations ?? []) {
        if (!d.tagName) continue
        declares.push(d.tagName)
        if (inputs.has(mod.path)) bundled.push(d.tagName)
      }
    }

    const out = {
      version: meta.version,
      license: typeof meta.license === 'string' ? meta.license : meta.license?.type ?? null,
      source: `npm @material/web@${meta.version} · ${IMPORTS.length} element modules, bundled with esbuild`,
      js: readFileSync(join(dir, 'bundle.js'), 'utf8'),
      typescale: readFileSync(join(pkgDir, 'typography/md-typescale-styles.css'), 'utf8'),
      declares: [...new Set(declares)].sort(),
      bundled: [...new Set(bundled)].sort(),
    }
    writeFileSync(CACHE, JSON.stringify(out))
    return out
  } finally { rmSync(dir, { recursive: true, force: true }) }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const m = materialElements({ refresh: process.argv.includes('--refresh') })
  console.log(`\n  @material/web ${m.version} · ${m.license}`)
  console.log(`  ${(m.js.length / 1024).toFixed(0)} kB of their code · ${(m.typescale.length / 1024).toFixed(1)} kB of their typography`)
  console.log(`  ${m.declares.length} elements declared, ${m.bundled.length} in this bundle:\n`)
  console.log('  ' + m.bundled.join(' ') + '\n')
}
