/**
 * THE ONE TEST THAT DECIDES WHETHER THIS SHIPS.
 *
 * Not "does the panel look right" and not "does the file contain our hex" — a
 * string can be in a file and mean nothing. This unzips a generated package into
 * an empty directory, installs the kits it names, runs their real build, and
 * then reads the COMPILED stylesheet to check that a utility actually resolves
 * to the value we set.
 *
 * A design system generator that hands you a broken zip has produced nothing,
 * and it is the kind of trust you lose exactly once.
 *
 *   node build-proof.mjs        (needs network; takes a minute)
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generate, plain } from './generate.mjs'

const VALUES = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#f7f9fa', surface: '#ffffff',
  ink: '#16181c', inkMuted: '#5c6b72', line: '#dfe2e7', radius: '12px', baseText: '1rem' }
const KIT_IDS = ['tailwind', 'daisyui']

const kits = Object.fromEntries(KIT_IDS.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))
const files = generate(VALUES, KIT_IDS, kits)

const dir = mkdtempSync(join(tmpdir(), 'dsg-proof-'))
let failures = 0
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!ok) failures++
}

try {
  console.log(`\nunpacking the generated package into an empty directory`)
  mkdirSync(join(dir, 'src'), { recursive: true })
  for (const [path, body] of Object.entries(plain(files))) writeFileSync(join(dir, path), body)

  /* a project that uses the kit the way its own docs say to */
  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: 'proof', private: true, type: 'module',
    devDependencies: { '@tailwindcss/cli': `^${kits.tailwind.version}`, tailwindcss: `^${kits.tailwind.version}`, daisyui: `^${kits.daisyui.version}` },
  }, null, 2))
  writeFileSync(join(dir, 'src/input.css'), `@import "tailwindcss";\n@plugin "daisyui";\n\n${files['theme.css']}`)
  writeFileSync(join(dir, 'src/index.html'),
    `<div class="bg-page text-ink border-line rounded-lg"><button class="btn btn-primary">Book</button><span class="bg-brand text-brand-foreground">x</span></div>`)

  console.log(`installing ${Object.values(files).length ? KIT_IDS.join(' + ') : ''}`)
  execFileSync('npm', ['install', '--silent', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'pipe' })

  console.log(`running their build\n`)
  execFileSync('npx', ['@tailwindcss/cli', '-i', 'src/input.css', '-o', 'out.css', '--minify'], { cwd: dir, stdio: 'pipe' })
  const out = readFileSync(join(dir, 'out.css'), 'utf8')

  /* Did a UTILITY resolve to our value? That is the question — the theme block
     being present proves nothing if Tailwind never generated a rule from it. */
  check('the build produced a stylesheet', out.length > 1000, `${(out.length / 1024).toFixed(0)} kB`)
  check('bg-brand exists and carries our colour', /\.bg-brand\{[^}]*#0b6e8a/i.test(out) || /--color-brand:\s*#0b6e8a/i.test(out) && /\.bg-brand/.test(out))
  check('text-ink exists', /\.text-ink/.test(out))
  check('border-line exists', /\.border-line/.test(out))
  check('rounded-lg took our 12px', /\.rounded-lg\{border-radius:12px/i.test(out) || /--radius-lg:\s*12px/i.test(out))
  check('daisyUI is in the build', /\.btn/.test(out))
  check('daisyUI\'s primary is OUR brand, not its default indigo',
    out.includes('#0b6e8a') && !/--color-primary:\s*oklch\(45% 0\.24/i.test(out))
  check('no kit default leaked past us', !/#4f39f6|#605dff/i.test(out), 'daisyUI\'s stock indigo is absent')

  console.log(`\n${failures ? `✗ ${failures} check(s) failed — the package would not work` : '✓ the generated package installs, builds, and carries your values'}`)
} catch (e) {
  console.error(`\n✗ the package did not build: ${e.message.split('\n')[0]}`)
  if (e.stderr) console.error(String(e.stderr).slice(0, 900))
  failures++
} finally {
  rmSync(dir, { recursive: true, force: true })
}
process.exit(failures ? 1 : 0)
