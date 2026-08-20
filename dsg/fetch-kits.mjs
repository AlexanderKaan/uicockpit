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
    return { text: readFileSync(join(dir, 'package', file), 'utf8'), version }
  } finally { rmSync(dir, { recursive: true, force: true }) }
}

/** `--name: value;` pairs of a CSS block, in source order. */
function cssVars(text) {
  const out = {}
  for (const m of text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/gi)) out[m[1]] = m[2].trim()
  return out
}

const SOURCES = {
  tailwind: {
    name: 'Tailwind CSS',
    what: 'utility classes — no components; the theme is CSS variables you can override',
    async read() {
      const { text, version } = fromNpm('tailwindcss@latest', 'theme.css')
      return { version, source: `npm tailwindcss@${version} · theme.css`, modes: { light: cssVars(text) } }
    },
  },
  daisyui: {
    name: 'daisyUI',
    what: 'component classes on top of Tailwind — no JavaScript, works in any framework',
    async read() {
      const light = fromNpm('daisyui@latest', 'theme/light.css')
      const dark = fromNpm('daisyui@latest', 'theme/dark.css')
      return { version: light.version, source: `npm daisyui@${light.version} · theme/light.css + theme/dark.css`,
        modes: { light: cssVars(light.text), dark: cssVars(dark.text) } }
    },
  },
  material: {
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
      return { version: colour.version, source: `npm @material/web@${colour.version} · labs/gb/styles/{color,shape} tokens`,
        modes: { light, dark } }
    },
  },
  shadcn: {
    name: 'shadcn/ui',
    what: 'React components copied into your repo — you own the source, it is not a dependency',
    async read() {
      const r = await fetch('https://ui.shadcn.com/r/colors/neutral.json')
      if (!r.ok) throw new Error(`registry answered ${r.status}`)
      const d = await r.json()
      const pre = (o) => Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => ['--' + k, v]))
      if (!d.cssVars?.light) throw new Error('no cssVars.light in the registry answer')
      return { version: null, source: 'ui.shadcn.com/r/colors/neutral.json · cssVars',
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
  const doc = { id, name: kit.name, what: kit.what, version: read.version, source: read.source, modes: read.modes }
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
