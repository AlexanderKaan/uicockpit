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
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { openNpm, fromNpm, blockOf, cssVars } from './npm-read.mjs'
import { readParts, STYLE } from './registry-read.mjs'

const CHECK = process.argv.includes('--check')


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

/* Every shadcn component the wall renders. Named here rather than discovered,
 * because a registry of two hundred entries is not a reason to fetch two
 * hundred files — and a part the wall does not draw is a part we cannot claim
 * to ship. */
const SHADCN_PARTS = ['button', 'badge', 'alert', 'card', 'input', 'textarea', 'select', 'checkbox',
  'radio-group', 'switch', 'slider', 'progress', 'table', 'tabs', 'avatar', 'separator', 'label',
  'breadcrumb', 'sidebar', 'navigation-menu', 'empty', 'item', 'dropdown-menu']

/* ── THE FOUR BANDS A STACK IS MADE OF ──────────────────────────────────────
 *
 * "Base plus layers" was too few words for what people really build. shadcn is
 * the case that shows it: it is not a layer ON Tailwind, it is a set of files
 * that BRING the Radix behaviour package, sit on the Tailwind engine, carry
 * their own tokens, and give you components. Four different things, and our
 * picker called it one.
 *
 *   behaviour   focus, keyboard, ARIA — the part with no look at all
 *   engine      how the styles are written and compiled
 *   tokens      the named values
 *   components  the styled parts you see
 *
 * A kit fills one or more and needs the rest. Most of it is READ: what brings
 * behaviour is what the package itself declares it depends on, and shadcn's
 * registry declares it per component. The rest is what kind of thing the kit is,
 * which is stated here next to `layer` and `standalone` for the same reason.
 */
const BEHAVIOUR = [
  [/^(@radix-ui\/|radix-ui$)/, 'radix-ui', 'the Radix behaviour packages — unstyled focus, keyboard and ARIA'],
  [/^lit$/, 'lit', 'custom elements, so the behaviour ships inside the element'],
  [/^@floating-ui\//, 'its own React layer', 'React components that carry their own behaviour'],
  [/^@popperjs\//, 'its own JavaScript', 'the scripts it ships in dist/js'],
]
/** What a package's own dependency list says it leans on for behaviour. */
function behaviourOf(names) {
  for (const [re, by, what] of BEHAVIOUR) {
    const found = names.filter((n) => re.test(n))
    if (found.length) return { by, what, from: found }
  }
  return null
}

const SOURCES = {
  tailwind: {
    layer: 'utility', engine: 'own',
    name: 'Tailwind CSS',
    what: 'utility classes — no components; the theme is CSS variables you can override',
    async read() {
      const t = fromNpm('tailwindcss@latest', 'theme.css')
      return { ...t, source: `npm tailwindcss@${t.version} · theme.css`, behaviour: behaviourOf(t.deps ?? []), modes: { light: cssVars(t.text) } }
    },
  },
  daisyui: {
    layer: 'components', engine: 'tailwind',
    name: 'daisyUI',
    what: 'component classes on top of Tailwind — no JavaScript, works in any framework',
    async read() {
      const light = fromNpm('daisyui@latest', 'theme/light.css')
      const dark = fromNpm('daisyui@latest', 'theme/dark.css')
      return { ...light, source: `npm daisyui@${light.version} · theme/light.css + theme/dark.css`, behaviour: behaviourOf(light.deps ?? []),
        modes: { light: cssVars(light.text), dark: cssVars(dark.text) },
        plain: { light: cssPlain(light.text), dark: cssPlain(dark.text) } }
    },
  },
  bootstrap: {
    layer: 'components', standalone: true, engine: 'own',
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
        behaviour: behaviourOf(pkg.deps ?? []),
        modes: { light: block(':root,'), dark: block('[data-bs-theme=dark]') } }
    },
  },
  material: {
    layer: 'components', standalone: true, engine: 'own',
    name: 'Material 3',
    what: 'Google\'s design system — 47 colour roles derived from ONE seed, plus web components',
    async read() {
      const colour = fromNpm('@material/web@latest', 'labs/gb/styles/color/md-color-tokens.css')
      const shape = fromNpm('@material/web@latest', 'labs/gb/styles/shape/md-shape-tokens.css')
      /* @material/web ships TWO shape vocabularies and its components read the
       * older one. labs/gb publishes corner-xs … corner-xxl; every component in
       * the package reads corner-extra-small … corner-extra-large. Reading only
       * the labs file gave us six names Google publishes and nothing in Google's
       * own kit reads — the corner-radius knob moved nothing at all. So both are
       * read, and the routing points at the pair the components use.
       *
       * The version directory is not typed: tokens/_md-sys-shape.scss says which
       * one it uses, so the file names itself. */
      const shipped = (() => {
        const p = openNpm('@material/web@latest')
        try {
          const index = p.read('tokens/_md-sys-shape.scss')
          const version = /@use\s+'versions\/([^/]+)\/md-sys-shape'/.exec(index)?.[1]
          const supported = [...index.slice(index.indexOf('$supported-tokens'), index.indexOf('$unsupported-tokens'))
            .matchAll(/'([a-z-]+)'/g)].map((m) => m[1])
          if (!version || !supported.length) return {}
          const values = p.read(`tokens/versions/${version}/_md-sys-shape.scss`)
          const out = {}
          for (const m of values.matchAll(/'([a-z-]+)':\s*if\([^,]+,\s*null,\s*([0-9.]+px)\)/g)) {
            if (supported.includes(m[1])) out[`--md-sys-shape-${m[1]}`] = m[2]
          }
          return out
        } finally { p.close() }
      })()
      if (!Object.keys(shipped).length) throw new Error('could not read the shape tokens @material/web\'s own components use')
      /* Material splits its typefaces in two — plain for body, brand for
         headings — which is the same split Radix and Mantine make. */
      const type = fromNpm('@material/web@latest', 'labs/gb/styles/m3.css')
      /* Material ships both modes in one declaration with CSS light-dark(), so
         the two are split back out here rather than fetched twice. */
      const light = {}, dark = {}
      const typeface = Object.fromEntries(Object.entries(cssVars(type.text))
        .filter(([n]) => n.startsWith('--md-ref-typeface-')))
      for (const [name, raw] of Object.entries({ ...cssVars(colour.text), ...cssVars(shape.text), ...shipped, ...typeface })) {
        const pair = /^light-dark\(\s*([^,]+?)\s*,\s*(.+?)\s*\)$/.exec(raw)
        light[name] = pair ? pair[1] : raw
        dark[name] = pair ? pair[2] : raw
      }
      return { ...colour, behaviour: behaviourOf(colour.deps ?? []), source: `npm @material/web@${colour.version} · labs/gb/styles/{color,shape} tokens + tokens/_md-sys-shape (what its components read) + m3.css typefaces`,
        modes: { light, dark } }
    },
  },
  radix: {
    layer: 'components', standalone: true, engine: 'own',
    name: 'Radix Themes',
    what: 'React components with a real theming API — but one that takes CHOICES, not values',
    async read() {
      const p = openNpm('@radix-ui/themes@latest')
      try {
        const base = p.read('tokens/base.css')
        /* Their semantic colours live on .radix-themes; the scales live on
           :root as calc() over --scaling and --radius-factor, which is exactly
           why radius and text size here are choices and not lengths. */
        /* `.radix-themes` is a THIRD block in the same file and it is where the
           font families live; reading only :root and :where(.radix-themes) left
           Radix looking like a kit with no typography at all. */
        /* the BRACE is part of the selector here. `.radix-themes` as a bare
           string also matches `::selection`, `:where([data-has-background])`
           AND the dark block's own `:where(.radix-themes:not(.light))` — so the
           light set quietly ended up holding Radix's dark values, and light and
           dark came out identical in all 191 variables. */
        const light = { ...blockOf(base, ':root {'), ...blockOf(base, ':where(.radix-themes) {'), ...blockOf(base, '.radix-themes {') }
        const dark = { ...light, ...blockOf(base, ':is(.dark, .dark-theme) :where(.radix-themes:not(.light, .light-theme)) {') }

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

        /* the full twelve steps of every scale, not only step 9. Radix
           publishes what each step is FOR — 1 is the app background, 6 a
           subtle border, 9 the solid colour, 12 high-contrast text — which
           makes its files the richest palette source in the whole set. */
        const ramps = {}
        for (const name of [...new Set([...accents.map(([n]) => n), ...grayNames])]) {
          const b = blockOf(p.read(`tokens/colors/${name}.css`), ':root, .light, .light-theme', { first: true })
          const steps = Object.entries(b)
            .map(([k, v]) => [/^--[a-z]+-(\d{1,2})$/.exec(k)?.[1], v])
            .filter(([n, v]) => n && /^#[0-9a-f]{6}$/i.test(v))
            .map(([n, v]) => [Number(n), v])
            .sort((x, y) => x[0] - y[0])
          if (steps.length >= 10) ramps[name] = Object.fromEntries(steps)
        }

        const stepped = (text, re, read) => Object.fromEntries([...text.matchAll(re)]
          .map((m) => [m[1], read(blockOf(text, m[0]))]).filter(([, v]) => v != null))
        const layout = p.read('layout/tokens.css')

        return { version: p.version, license: p.license, npm: p.npm, home: p.home ?? 'https://radix-ui.com/themes', behaviour: behaviourOf(p.deps ?? []),
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
          ramps,
          modes: { light, dark } }
      } finally { p.close() }
    },
  },
  mantine: {
    layer: 'components', standalone: true, engine: 'own',
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
           Button's root. Nothing in the stylesheet says which hash is a table
           header and which is a cell, and guessing produced nine class names
           that do not exist. But Mantine PUBLISHES the map: every component
           ships esm/components/<Name>/<Name>.module.mjs holding exactly
           { th: 'm_4e7aa4f3', td: 'm_4e7aa4ef', … }. So it is read, and a
           release that rehashes them changes this map rather than our code. */
        /* esm/utils as well as esm/components. A checkbox and a switch share
           their body, their label wrapper and one of their two root classes,
           and those live in utils/InlineInput — so reading only the component
           folders left us naming four parts of every checkbox we could not
           name, and composing our own layout around the two we could. */
        const classes = {}
        for (const where of ['esm/components', 'esm/utils']) {
          for (const name of p.list(where)) {
            let src
            try { src = p.read(`${where}/${name}/${name}.module.mjs`) } catch { continue }
            const map = Object.fromEntries([...src.matchAll(/"([A-Za-z0-9_]+)":\s*"(m_[a-z0-9]+)"/g)].map((m) => [m[1], m[2]]))
            if (Object.keys(map).length) classes[name] ??= map
          }
        }
        return { version: p.version, license: p.license, npm: p.npm, home: p.home ?? 'https://mantine.dev', behaviour: behaviourOf(p.deps ?? []),
          source: `npm @mantine/core@${p.version} · styles.css :root + colour-scheme blocks, class names from esm/{components,utils}/*/*.module.mjs`,
          classes, modes: { light, dark } }
      } finally { p.close() }
    },
  },
  openprops: {
    layer: 'tokens', standalone: false, engine: null,
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
        return { version: p.version, license: p.license, npm: p.npm, home: p.home ?? 'https://open-props.style', behaviour: behaviourOf(p.deps ?? []),
          source: `npm open-props@${p.version} · open-props.min.css + normalize.{light,dark}.min.css`,
          modes: { light, dark } }
      } finally { p.close() }
    },
  },
  shadcn: {
    layer: 'components', engine: 'tailwind',
    name: 'shadcn/ui',
    what: 'React components copied into your repo — you own the source, it is not a dependency',
    async read() {
      const r = await fetch('https://ui.shadcn.com/r/colors/neutral.json')
      if (!r.ok) throw new Error(`registry answered ${r.status}`)
      const d = await r.json()
      const pre = (o) => Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => ['--' + k, v]))
      if (!d.cssVars?.light) throw new Error('no cssVars.light in the registry answer')
      /* AND THE COMPONENTS. Their variables were read from here all along; their
       * class strings were typed into wall-bindings.mjs from a snapshot, which
       * made this the one kit in the tool that could go stale — and it had. We
       * carried about half of each component and always dropped the same half:
       * the states. Read now, the same as every other kit, so a shadcn release
       * changes this file rather than our code. */
      const parts = await readParts(SHADCN_PARTS)
      /* their own registry names it, component by component */
      const declared = [...new Set(Object.values(parts).flatMap((p) => p.needs))]
      /* AND THE PACKAGE THAT DEFINES THEIR ANIMATIONS.
       *
       * Ten of the class names their registry hands us — animate-in, fade-in-0,
       * zoom-in-95, slide-in-from-top-2 and the rest — are not Tailwind's. They
       * come from tw-animate-css, which shadcn's own globals.css imports and
       * which nothing else in this tool would install. Without it those ten are
       * classes with no rule: their menu, dialog, popover and tooltip appear
       * with no entrance at all, and the meter cannot tell that apart from ten
       * class names we made up. Read for its version and licence, so the
       * manifest can name it the same way it names every other dependency. */
      const anim = fromNpm('tw-animate-css@latest', 'package.json')
      return { version: null, license: 'MIT', npm: null, home: 'https://ui.shadcn.com',
        style: STYLE, parts, behaviour: behaviourOf(declared),
        animates: { npm: anim.npm, version: anim.version, license: anim.license },
        source: `ui.shadcn.com/r/colors/neutral.json · cssVars, and r/styles/${STYLE}/*.json for the components, with tw-animate-css@${anim.version} for the entrance utilities they name`,
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
    ramps: read.ramps ?? null,
    /* the components, where a kit publishes them as source rather than as CSS */
    style: read.style ?? null, parts: read.parts ?? null,
    /* a second package the kit's own classes need. shadcn names ten utilities
       that live in tw-animate-css and nowhere else; the build has to install it
       and the manifest has to name it, so it is carried here rather than typed
       into either. */
    animates: read.animates ?? null,
    /* the four bands: what this kit fills, and what it needs under it */
    bands: {
      behaviour: read.behaviour ?? null,
      engine: kit.engine ?? null,
      tokens: Object.keys(read.modes.light ?? {}).length,
      components: kit.layer === 'components',
    },
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
