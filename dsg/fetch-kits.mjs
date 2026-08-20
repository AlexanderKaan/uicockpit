/**
 * READ EACH KIT'S OWN DEFAULTS. Never type one.
 *
 * The whole product rests on this: we have no palette, no type scale and no
 * defaults of our own. When you switch a kit on you get ITS values, in ITS
 * vocabulary. So those values have to come out of what the kit publishes —
 * the npm package it ships, the registry it serves — and a rebuild has to pick
 * up their next release without anyone editing a file here.
 *
 * A hand-typed value is a value that is wrong the day they change it and right
 * only by luck until then. This project has been here before: the Tailwind
 * palette used to be typed, and the reader was wrong about three repos until it
 * was generated from Tailwind's own files instead.
 *
 *   node fetch-kits.mjs            → writes kits/<id>.json
 *   node fetch-kits.mjs --check    → fails if a checked-in file is stale
 *
 * If a source cannot be read, this writes NOTHING for that kit and says so.
 * A generator that falls back to yesterday's guess is a generator that lies.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHECK = process.argv.includes('--check')

/** Pull one file out of an npm tarball, without installing anything. */
function fromNpm(pkg, file) {
  const dir = mkdtempSync(join(tmpdir(), 'dsg-'))
  try {
    const tgz = execFileSync('npm', ['pack', pkg, '--silent', '--pack-destination', dir], { encoding: 'utf8' }).trim().split('\n').pop()
    execFileSync('tar', ['xzf', join(dir, tgz), '-C', dir])
    const version = tgz.replace(/^(.+)-(\d.*)\.tgz$/, '$2')
    /* the licence comes out of their package.json too — a licence anyone typed
       from memory is the one thing in a manifest that must never be wrong */
    const meta = JSON.parse(readFileSync(join(dir, 'package', 'package.json'), 'utf8'))
    return { text: readFileSync(join(dir, 'package', file), 'utf8'), version,
      license: typeof meta.license === 'string' ? meta.license : meta.license?.type ?? null,
      npm: meta.name, home: meta.homepage ?? null }
  } finally { rmSync(dir, { recursive: true, force: true }) }
}

/** `--name: value;` pairs of a CSS block, in source order. */
function cssVars(text) {
  const out = {}
  for (const m of text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/gi)) out[m[1]] = m[2].trim()
  return out
}

/* A theme is not only custom properties. daisyUI's light theme also declares
 * `color-scheme: light`, and a generated block that replaces theirs without it
 * hands the browser back to its own preference — which turned the hero shot
 * dark with daisyUI's factory purple on it. Third time this lesson has been
 * paid for: a block that REPLACES must carry everything. */
const PLAIN = ['color-scheme']
function cssPlain(text) {
  const out = {}
  for (const p of PLAIN) {
    const m = new RegExp(`(?:^|[;{])\\s*${p}\\s*:\\s*([^;}]+)`, 'i').exec(text)
    if (m) out[p] = m[1].trim()
  }
  return out
}

const SOURCES = {
  tailwind: {
    layer: 'utility',
    name: 'Tailwind CSS',
    what: 'utility classes — no components; the theme is CSS variables you can override',
    async read() {
      const t = fromNpm('tailwindcss@latest', 'theme.css')
      return { ...t, source: `npm tailwindcss@${t.version} · theme.css`, modes: { light: cssVars(t.text) } }
    },
  },
  daisyui: {
    layer: 'components',
    name: 'daisyUI',
    what: 'component classes on top of Tailwind — no JavaScript, works in any framework',
    async read() {
      const light = fromNpm('daisyui@latest', 'theme/light.css')
      const dark = fromNpm('daisyui@latest', 'theme/dark.css')
      return { ...light, source: `npm daisyui@${light.version} · theme/light.css + theme/dark.css`,
        modes: { light: cssVars(light.text), dark: cssVars(dark.text) },
        plain: { light: cssPlain(light.text), dark: cssPlain(dark.text) } }
    },
  },
  bootstrap: {
    layer: 'components', standalone: true,
    name: 'Bootstrap',
    what: 'component classes, no build step needed — the widest-installed CSS framework there is',
    async read() {
      const pkg = fromNpm('bootstrap@latest', 'dist/css/bootstrap.css')
      const text = pkg.text
      /* Only the ROOT blocks. Bootstrap also sets --bs-* inside components
         (--bs-btn-bg and friends); those are component overrides, not the
         theme, and hoovering them up would make the map look richer than it is. */
      const block = (selector) => {
        const at = text.indexOf(selector)
        if (at < 0) return {}
        return cssVars(text.slice(at, text.indexOf('}', at)))
      }
      return { ...pkg, source: `npm bootstrap@${pkg.version} · dist/css/bootstrap.css :root + [data-bs-theme=dark]`,
        modes: { light: block(':root,'), dark: block('[data-bs-theme=dark]') } }
    },
  },
  material: {
    layer: 'components', standalone: true,
    name: 'Material 3',
    what: 'Google\'s design system — 47 colour roles derived from ONE seed, plus web components',
    async read() {
      const colour = fromNpm('@material/web@latest', 'labs/gb/styles/color/md-color-tokens.css')
      const shape = fromNpm('@material/web@latest', 'labs/gb/styles/shape/md-shape-tokens.css')
      /* Material ships both modes in one declaration with CSS light-dark(), so
         the two are split back out here rather than fetched twice. */
      const light = {}, dark = {}
      for (const [name, raw] of Object.entries({ ...cssVars(colour.text), ...cssVars(shape.text) })) {
        const pair = /^light-dark\(\s*([^,]+?)\s*,\s*(.+?)\s*\)$/.exec(raw)
        light[name] = pair ? pair[1] : raw
        dark[name] = pair ? pair[2] : raw
      }
      return { ...colour, source: `npm @material/web@${colour.version} · labs/gb/styles/{color,shape} tokens`,
        modes: { light, dark } }
    },
  },
  shadcn: {
    layer: 'components',
    name: 'shadcn/ui',
    what: 'React components copied into your repo — you own the source, it is not a dependency',
    async read() {
      const r = await fetch('https://ui.shadcn.com/r/colors/neutral.json')
      if (!r.ok) throw new Error(`registry answered ${r.status}`)
      const d = await r.json()
      const pre = (o) => Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => ['--' + k, v]))
      if (!d.cssVars?.light) throw new Error('no cssVars.light in the registry answer')
      return { version: null, license: 'MIT', npm: null, home: 'https://ui.shadcn.com',
        source: 'ui.shadcn.com/r/colors/neutral.json · cssVars',
        modes: { light: pre(d.cssVars.light), dark: pre(d.cssVars.dark) } }
    },
  },
}

let failed = 0, stale = 0
for (const [id, kit] of Object.entries(SOURCES)) {
  let read
  try { read = await kit.read() } catch (e) {
    console.error(`✗ ${id} — could not read its source: ${e.message}`)
    console.error(`  nothing written. ${existsSync(`kits/${id}.json`) ? 'The checked-in file is left alone; it may be out of date.' : 'This kit has no values at all.'}`)
    failed++; continue
  }
  const doc = { id, name: kit.name, what: kit.what, layer: kit.layer, standalone: kit.standalone ?? false,
    plain: read.plain ?? null, version: read.version, license: read.license ?? null,
    npm: read.npm ?? null, home: read.home ?? null, source: read.source, modes: read.modes }
  const next = JSON.stringify(doc, null, 2) + '\n'
  const path = `kits/${id}.json`
  const prev = existsSync(path) ? readFileSync(path, 'utf8') : null
  const counts = Object.entries(read.modes).map(([m, v]) => `${m} ${Object.keys(v).length}`).join(' · ')
  if (CHECK) {
    if (prev !== next) { console.error(`✗ ${id} — checked-in values differ from the source (${counts})`); stale++ }
    else console.log(`✓ ${id.padEnd(9)} up to date — ${counts}`)
    continue
  }
  writeFileSync(path, next)
  console.log(`${prev === next ? '·' : '✓'} ${id.padEnd(9)} ${read.version ?? 'live'} — ${counts} vars — ${read.source}`)
}
if (failed) console.error(`\n${failed} kit(s) unread. Fix the source or drop the kit; do not ship yesterday's guess.`)
process.exit(failed || stale ? 1 : 0)
