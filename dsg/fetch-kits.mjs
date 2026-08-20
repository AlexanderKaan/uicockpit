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
import { readFileSync, writeFileSync, mkdtempSync, existsSync, rmSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHECK = process.argv.includes('--check')

/**
 * Unpack an npm tarball once and read as many files out of it as you like.
 * Radix ships one stylesheet per accent colour, so a helper that re-packs the
 * tarball per file would run `npm pack` twenty-five times to answer one
 * question.
 */
function openNpm(pkg) {
  const dir = mkdtempSync(join(tmpdir(), 'dsg-'))
  const tgz = execFileSync('npm', ['pack', pkg, '--silent', '--pack-destination', dir], { encoding: 'utf8' }).trim().split('\n').pop()
  execFileSync('tar', ['xzf', join(dir, tgz), '-C', dir])
  const meta = JSON.parse(readFileSync(join(dir, 'package', 'package.json'), 'utf8'))
  return {
    version: tgz.replace(/^(.+)-(\d.*)\.tgz$/, '$2'),
    license: typeof meta.license === 'string' ? meta.license : meta.license?.type ?? null,
    npm: meta.name, home: meta.homepage ?? null,
    read: (f) => readFileSync(join(dir, 'package', f), 'utf8'),
    list: (sub) => readdirSync(join(dir, 'package', sub)),
    close: () => rmSync(dir, { recursive: true, force: true }),
  }
}

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

/**
 * The declarations of one CSS block, found by its selector.
 * `cssVars` on a whole file would sweep up component-level overrides and make
 * the map look richer than it is; this takes exactly one block.
 */
function blockOf(text, selector, { first = false } = {}) {
  /* EVERY block with this selector, merged in source order.
   *
   * Two traps, both hit for real while reading Mantine. A literal string misses
   * `:root,\n:host {`, so the kit read zero variables and still reported
   * success. And taking only the FIRST match misses it again: Mantine's first
   * :root,:host carries one declaration and the 224 variables are in a later
   * one. Reading a kit wrong is worse than not reading it, because nothing
   * downstream can tell the difference. */
  const re = new RegExp(selector instanceof RegExp ? selector.source
    : selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/,\s+/g, ',\\s*'), 'g')
  const out = {}
  for (const at of text.matchAll(re)) {
    const open = text.indexOf('{', at.index)
    if (open < 0) continue
    Object.assign(out, cssVars(text.slice(open, text.indexOf('}', open))))
    if (first) break
  }
  return out
}

/* Merging is the right default and the wrong one exactly once: Radix repeats
 * every colour file's selector inside an @supports block to restate the same
 * scale in display-p3. Merge there and you get color(display-p3 …) where a hex
 * was asked for, which is how the accent list silently went from 31 to 0. */

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
  radix: {
    layer: 'components', standalone: true,
    name: 'Radix Themes',
    what: 'React components with a real theming API — but one that takes CHOICES, not values',
    async read() {
      const p = openNpm('@radix-ui/themes@latest')
      try {
        const base = p.read('tokens/base.css')
        /* Their semantic colours live on .radix-themes; the scales live on
           :root as calc() over --scaling and --radius-factor, which is exactly
           why radius and text size here are choices and not lengths. */
        const light = { ...blockOf(base, ':root {'), ...blockOf(base, ':where(.radix-themes)') }
        const dark = { ...light, ...blockOf(base, ':is(.dark, .dark-theme)') }

        /* Radix does not take a brand colour. It takes one of its own named
           accents, and every one of them is a hand-built twelve-step scale.
           Step 9 is the solid one a button wears, so that is what a brand
           colour is compared against. Read from their files, not typed. */
        const accents = p.list('tokens/colors')
          .filter((f) => f.endsWith('.css') && !f.includes('-alpha') && !f.includes('-p3'))
          .map((f) => f.replace('.css', ''))
          /* the LIGHT block only: each colour file repeats every step in
             display-p3 under @supports, and reading the whole file leaves you
             with color(display-p3 …) where a hex was wanted */
          .map((name) => [name, /^#[0-9a-f]{6}$/i.exec(blockOf(p.read(`tokens/colors/${name}.css`), ':root, .light, .light-theme', { first: true })[`--${name}-9`] ?? '')?.[0]])
          .filter(([, hex]) => hex)
        /* Each setting's OWN number, so a knob can be matched to the nearest
           one rather than to whichever name sorts first. --radius-2 is 4px at
           factor 1, and --font-size-3 is 16px at scaling 1. */
        /* the greys are a second published set, chosen the same way */
        const grayNames = [...new Set([...p.read('tokens.css').matchAll(/data-gray-color='([a-z]+)'/g)].map((m) => m[1]))]
        const grays = grayNames
          .map((name) => [name, /^#[0-9a-f]{6}$/i.exec(blockOf(p.read(`tokens/colors/${name}.css`), ':root, .light, .light-theme', { first: true })[`--${name}-12`] ?? '')?.[0]])
          .filter(([, hex]) => hex)

        const stepped = (text, re, read) => Object.fromEntries([...text.matchAll(re)]
          .map((m) => [m[1], read(blockOf(text, m[0]))]).filter(([, v]) => v != null))
        const layout = p.read('layout/tokens.css')

        return { version: p.version, license: p.license, npm: p.npm, home: p.home ?? 'https://radix-ui.com/themes',
          source: `npm @radix-ui/themes@${p.version} · tokens/base.css + tokens/colors/*.css`,
          choices: {
            brand: { attr: 'data-accent-color', unit: 'colour', of: Object.fromEntries(accents),
              why: 'Radix has no brand variable. Its accent is one of these hand-built twelve-step scales, chosen on the Theme root' },
            ink: { attr: 'data-gray-color', unit: 'colour', of: Object.fromEntries(grays),
              why: 'Radix\'s greys are a chosen twelve-step scale too, and step 12 is the text colour' },
            radius: { attr: 'data-radius', unit: 'px', base: 4,
              of: stepped(base, /\[data-radius='([a-z]+)'\]/g, (v) => {
                /* 'full' is a pill, not a factor: it is the one setting whose
                   --radius-full stops being 0px. */
                if (parseFloat(v['--radius-full']) > 0) return '9999px'
                const f = parseFloat(v['--radius-factor'])
                return Number.isFinite(f) ? `${f * 4}px` : null
              }),
              why: 'every --radius-N is calc(Npx * --scaling * --radius-factor); the factor comes from one of these five settings' },
            baseText: { attr: 'data-scaling', unit: 'px', base: 16,
              of: stepped(layout, /\[data-scaling='([0-9]+%)'\]/g, (v) => {
                const f = parseFloat(v['--scaling'])
                return Number.isFinite(f) ? `${f * 16}px` : null
              }),
              why: 'Radix scales the whole type and space ramp together, in five steps' },
          },
          modes: { light, dark } }
      } finally { p.close() }
    },
  },
  mantine: {
    layer: 'components', standalone: true,
    name: 'Mantine',
    what: 'React components — its variables are public, its class names are build hashes',
    async read() {
      const p = openNpm('@mantine/core@latest')
      try {
        const css = p.read('styles.css')
        const root = blockOf(css, ':root, :host')
        const light = { ...root, ...blockOf(css, "[data-mantine-color-scheme='light']") }
        const dark = { ...root, ...blockOf(css, "[data-mantine-color-scheme='dark']") }

        /* Mantine's component class names are content hashes — .m_77c9d27d is
           Button. They are not a documented vocabulary, but each component's
           own stylesheet names itself, so they are READ rather than typed and a
           release that rehashes them is caught the next time this runs. */
        const classes = {}
        for (const f of p.list('styles')) {
          if (!f.endsWith('.css') || f.includes('.layer.')) continue
          const first = /^\.(m_[a-z0-9]+)/m.exec(p.read(`styles/${f}`))
          if (first) classes[f.replace('.css', '')] = first[1]
        }
        return { version: p.version, license: p.license, npm: p.npm, home: p.home ?? 'https://mantine.dev',
          source: `npm @mantine/core@${p.version} · styles.css :root + colour-scheme blocks, class names from styles/*.css`,
          classes, modes: { light, dark } }
      } finally { p.close() }
    },
  },
  openprops: {
    layer: 'tokens', standalone: false,
    name: 'Open Props',
    what: 'CSS variables and nothing else — no components, so it sits under whatever renders',
    async read() {
      const p = openNpm('open-props@latest')
      try {
        /* Two files, two jobs: the scales everyone means by Open Props, and the
           small semantic layer its normalize ships (--brand, --surface-N,
           --text-N). Both are :where(html), so both are easy to sit under. */
        const scales = cssVars(p.read('open-props.min.css'))
        const light = { ...scales, ...cssVars(p.read('normalize.light.min.css')) }
        const dark = { ...scales, ...cssVars(p.read('normalize.dark.min.css')) }
        return { version: p.version, license: p.license, npm: p.npm, home: p.home ?? 'https://open-props.style',
          source: `npm open-props@${p.version} · open-props.min.css + normalize.{light,dark}.min.css`,
          modes: { light, dark } }
      } finally { p.close() }
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
  /* A reader that matched nothing returns an empty object, and an empty object
   * is a perfectly valid document — so Mantine "read successfully" with zero
   * variables twice before this line existed. Nothing downstream could tell the
   * difference between a kit with no theme and a selector we got wrong. */
  const empty = Object.entries(read.modes).filter(([, v]) => !Object.keys(v).length).map(([m]) => m)
  if (empty.length) {
    console.error(`✗ ${id} — read ${empty.join(' and ')} as ZERO variables. The source moved or the selector is wrong; nothing written.`)
    failed++; continue
  }

  const doc = { id, name: kit.name, what: kit.what, layer: kit.layer, standalone: kit.standalone ?? false,
    plain: read.plain ?? null, choices: read.choices ?? null, classes: read.classes ?? null,
    version: read.version, license: read.license ?? null,
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
