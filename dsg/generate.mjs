/**
 * ROLE VALUES → THE PACKAGE YOU DOWNLOAD.
 *
 * This is the deliverable, and the only thing that has to be true: unzip it,
 * follow install.md, and the kits you picked are wearing your values. A theme
 * editor that produces a pretty screen and a broken zip has produced nothing.
 *
 * Each kit gets its theme in ITS OWN form — Tailwind's @theme, daisyUI's
 * @plugin block, shadcn's :root, Bootstrap's variables plus a Sass line,
 * Material's tokens plus its generator. We do not normalise those into a shape
 * of ours; the whole point is that what you copy is what that kit expects.
 *
 * And the manifest carries what could NOT be done, by name. A package that
 * quietly leaves out a third of a theme is worse than one that says so.
 */
import { ROLES, MAP, route, coverage } from './roles.mjs'
import { contrast } from './color.mjs'

const stamp = (kit) => `${kit.name}${kit.version ? ' ' + kit.version : ''}`
const decl = (vars, indent = '  ') => Object.entries(vars).map(([k, v]) => `${indent}${k}: ${v};`).join('\n')

/* ── one block per kit, in the form that kit reads ────────────────────────── */
const EMIT = {
  tailwind: (r, kit) => `/* ${stamp(kit)} — semantic names Tailwind does not ship.
   These generate utilities: bg-brand, text-ink, border-line, rounded-lg. */
@theme {
${decl(r.vars)}
}`,

  /* Two blocks, and the second one is not optional.
   *
   * shadcn's variables are SEMANTIC and unprefixed — --primary, --background,
   * --border. Tailwind generates utilities from its own --color-* namespace, so
   * `bg-primary` does not exist unless something bridges the two. shadcn's own
   * globals.css does it with @theme inline; we did not, and every shadcn
   * component in the preview rendered completely unstyled. The package had the
   * same hole, so anyone installing it would have seen the same nothing. */
  shadcn: (r, kit) => {
    /* THEIR defaults, ours over them — the same rule daisyUI needed. Our knobs
     * reach seven of shadcn's variables; its components read seventeen. Writing
     * only ours left --secondary, --accent and --destructive undefined, so
     * bg-secondary and hover:bg-accent were never generated and half its
     * variants rendered as bare text. */
    const all = { ...kit.modes.light, ...r.vars }
    const bridge = Object.fromEntries(Object.keys(all)
      .filter((n) => n !== '--radius')
      .map((n) => [n.replace(/^--/, '--color-'), `var(${n})`]))
    const radius = all['--radius']
    return `/* ${stamp(kit)} — the variables its components read: its published
   defaults with your values over them.
   Dark mode is not generated yet: add a .dark block with your dark values. */
:root {
${decl(all)}
}

/* The bridge into Tailwind's namespace, so bg-primary and border-input exist.
   Without it the variables above are set and nothing reads them. */
@theme inline {
${decl(bridge)}${radius ? `
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);` : ''}
}`
  },

  /* REPLACES the theme, so it must carry everything the kit needs.
   *
   * A daisyUI theme block with default:true is the whole theme — write only the
   * seven values we route and the rest are simply gone. That took a checkbox's
   * `border: var(--border) solid …` down to a zero-width border and made every
   * checkbox and switch on the wall invisible. Found by looking at the render,
   * not by reading the code.
   *
   * So the rule the whole product already claims applies to us too: their
   * defaults are the base, our values go on top. */
  daisyui: (r, kit) => `/* ${stamp(kit)} — a named theme, registered as the default.
   Their published defaults with your values over them: a theme block replaces
   the theme, so anything left out would be missing rather than inherited.
   SET data-theme="yourkit" ON YOUR <html>. daisyUI registers its own dark theme
   with prefersdark, which beats default:true the moment a visitor's OS is dark —
   and then none of the values below apply. Only a light theme is generated so
   far; a dark one is yours to add as a second block. */
@plugin "daisyui/theme" {
  name: "yourkit";
  default: true;
${decl(kit.plain?.light ?? {})}
${decl({ ...kit.modes.light, ...r.vars })}
}`,

  bootstrap: (r, kit) => `/* ${stamp(kit)} — what a running page can change.
   The brand is NOT here: see _custom.scss. \`var(--bs-primary)\` appears zero
   times in Bootstrap's own stylesheet, so setting it would change nothing. */
:root {
${decl(r.vars)}
}`,

  material: (r, kit) => `/* ${stamp(kit)} — the seed and the corner ramp.
   M3 computes its other 46 colour roles from the seed; generate them with
   @material/material-color-utilities rather than setting them by hand. */
:root {
${decl(r.vars)}
}`,

  /* Half of Radix is not CSS at all.
   *
   * Its accent, its corner radius and its type scale are not variables you set
   * -- they are attributes on the Theme root, chosen from sets Radix publishes.
   * Writing a hex into --accent-9 would leave the other eleven steps belonging
   * to the previous accent, so the choices are made where Radix makes them and
   * the block below carries only what really is a variable. */
  radix: (r, kit) => `/* ${stamp(kit)} — the half that IS a variable.
   The other half is on your <Theme>:
     ${attrLine(r) || '(no choices — nothing matched)'}
   Set those there, not here: Radix's accent is a twelve-step scale it ships,
   and one step written by hand is eleven steps out of step. */
.radix-themes {
${decl(r.vars)}
}`,

  mantine: (r, kit) => `/* ${stamp(kit)} — its variables, all settable at runtime.
   Its COMPONENT class names are content hashes (.m_77c9d27d is Button), so use
   its React components; these variables are what they read. */
:root {
${decl(r.vars)}
}`,

  /* Open Props renders nothing, so this block exists to make YOUR css agree
   * with the kit above it: write var(--brand) or var(--size-3) by hand and it
   * lands on the same values the components use. */
  openprops: (r, kit) => `/* ${stamp(kit)} — variables only; Open Props ships no components.
   Loaded UNDER whatever renders, so your own CSS agrees with it. */
:where(html) {
${decl(r.vars)}
}`,
}

/** The attributes a choice-taking kit needs on its root, as markup. */
export const attrLine = (r) =>
  Object.entries(r.attrs ?? {}).map(([a, v]) => `${a}="${v}"`).join(' ')

/* ── the extra files some kits need ───────────────────────────────────────── */
const EXTRA = {
  bootstrap: (r, kit, values) => ({
    '_custom.scss': `// ${stamp(kit)} — the half a running page cannot change.
// Bootstrap compiles component colours, so the brand is a build-time variable.
// Import this INSTEAD of plain bootstrap.css:
//
//   @import "custom";
//
${r.needsBuild.map((b) => `${b.sass}: ${values[b.role] ?? '/* set me */'};   // ${b.why}`).join('\n')}

@import "bootstrap/scss/bootstrap";
`,
  }),
  shadcn: () => ({
    'components.json': JSON.stringify({
      $schema: 'https://ui.shadcn.com/schema.json',
      style: 'new-york', rsc: true, tsx: true,
      tailwind: { config: '', css: 'app/globals.css', baseColor: 'neutral', cssVariables: true },
      aliases: { components: '@/components', ui: '@/components/ui', utils: '@/lib/utils' },
    }, null, 2) + '\n',
  }),
}

const INSTALL = {
  tailwind: (k) => [`npm install ${k.npm}@${k.version}`, `/* then in your CSS: */ @import "tailwindcss";`],
  daisyui: (k) => [`npm install ${k.npm}@${k.version}`, `/* in your CSS: */ @plugin "daisyui";`,
    `<!-- and on your <html>, or daisyUI's own dark theme wins whenever the -->`,
    `<!-- visitor's OS is dark: it registers with prefersdark, which beats  -->`,
    `<!-- our default:true. This is not optional.                          -->`,
    `<html data-theme="yourkit">`],
  bootstrap: (k) => [`npm install ${k.npm}@${k.version} sass`, `/* build _custom.scss instead of importing bootstrap.css */`],
  material: (k) => [`npm install ${k.npm}@${k.version} @material/material-color-utilities`,
    `<!-- Material's components are custom elements, not classes: import the -->`,
    `<!-- ones you use, or <md-filled-button> renders as an unknown tag.     -->`,
    `import '@material/web/button/filled-button.js'`,
    `import '@material/web/textfield/outlined-text-field.js'  // and so on`,
    `/* their typography classes ship in the package too: */`,
    `import { styles } from '@material/web/typography/md-typescale-styles.js'`],
  shadcn: () => [`npx shadcn@latest init`, `npx shadcn@latest add button card input dialog table  # whatever you picked`],
  radix: (k, r) => [`npm install ${k.npm}@${k.version}`, `import '@radix-ui/themes/styles.css'`,
    `<!-- the choices go on the Theme root, not in CSS: -->`,
    `<Theme ${attrLine(r) || 'accentColor="indigo"'}>`],
  mantine: (k) => [`npm install ${k.npm}@${k.version}`, `import '@mantine/core/styles.css'`,
    `<!-- use its React components; the class names in its stylesheet are -->`,
    `<!-- content hashes and are not an API you write by hand.           -->`,
    `<MantineProvider>`],
  openprops: (k) => [`npm install ${k.npm}@${k.version}`,
    `/* the scales, then your theme.css after them */`,
    `@import "open-props/style";`,
    `@import "open-props/normalize";`],
}

/**
 * @param values  role id → value, e.g. { brand: '#0B6E8A', radius: '12px' }
 * @param kitIds  which kits are switched on
 * @param kits    the fetched kit documents, keyed by id
 * @returns       path → file contents
 */
/**
 * Two kits can claim the same variable NAME with different meanings, and the
 * loser is whichever stylesheet is read second.
 *
 * shadcn's `--border` is a colour. daisyUI's `--border` is a width, and its
 * checkbox is `border: var(--border) solid …`. Enable both and shadcn's #dfe2e7
 * lands in a width slot: every checkbox and switch silently loses its outline.
 *
 * We hit this ourselves in the preview before any user could — which is the
 * only reason it is checked here rather than shipped. Nothing else compares
 * kits closely enough to notice.
 */
/**
 * The entries of generate() that are actual FILES. Keys beginning with `_` are
 * working data for the page (the per-kit blocks, the detected name clashes) and
 * are not written anywhere. This rule lived only in the page, so the build
 * proof wrote an object into a file and the whole end-to-end check died on it.
 */
export const plain = (files) => Object.fromEntries(
  Object.entries(files).filter(([k, v]) => !k.startsWith('_') && typeof v === 'string'))

/**
 * Parts of a screen a kit ships no component for. Filled in for Material
 * because it is the one kit here whose components are code: its package is the
 * authority on what exists, and what is absent from it is absent, full stop.
 */
export const COMPONENT_GAPS = {
  material: [
    ['layout', 'Material publishes colour and shape tokens but no spacing scale, and ships no layout components — spacing between elements is yours to decide'],
    ['table', '@material/web ships no data table, though the M3 spec describes one'],
    ['avatar', '@material/web ships no avatar; compose one from its shape and colour tokens'],
    ['alert', '@material/web ships no inline alert or banner; the closest is md-filled-card re-toned with its own container token'],
  ],
}

export function collisions(routed, kits) {
  const out = []
  for (const r of routed) {
    for (const name of Object.keys(r.vars)) {
      for (const other of routed) {
        if (other.kit === r.kit) continue
        const theirs = Object.assign({}, ...Object.values(kits[other.kit]?.modes ?? {}))
        if (!(name in theirs)) continue
        if (name in other.vars) continue          // both write it; same intent, no surprise
        out.push({ variable: name, written: r.kit, read: other.kit, theirValue: theirs[name] })
      }
    }
  }
  return out
}

export function generate(values, kitIds, kits) {
  const routed = route(values, kitIds, kits)
  const files = {}

  const blocks = routed.map((r) => {
    const kit = kits[r.kit]
    if (!kit) throw new Error(`no fetched values for "${r.kit}" — run fetch-kits.mjs`)
    const emit = EMIT[r.kit]
    if (!emit) throw new Error(`no emitter for "${r.kit}" — a kit without one would ship an empty theme`)
    Object.assign(files, EXTRA[r.kit]?.(r, kit, values) ?? {})
    return emit(r, kit)
  })

  files['theme.css'] = `/* YOUR DESIGN SYSTEM
 *
 * Generated from ${routed.length} kit${routed.length > 1 ? 's' : ''} and ${Object.keys(values).length} values.
 * Every variable below belongs to the kit that publishes it — nothing here is
 * ours. Read MANIFEST.md for what could not be set and why.
 */

${blocks.join('\n\n')}
`

  files['install.md'] = `# Install

${routed.map((r) => {
  const kit = kits[r.kit]
  return `## ${kit.name}\n\n\`\`\`bash\n${(INSTALL[r.kit]?.(kit, r) ?? []).join('\n')}\n\`\`\`\n`
}).join('\n')}
Then import \`theme.css\` after the kits, so your values win.
`

  files['MANIFEST.md'] = manifest(routed, kits, values)
  files['DESIGN-SYSTEM.md'] = brief(routed, kits, values)
  /* per-kit blocks too: anything showing ONE kit must load only that kit's
     block, or the collision above happens inside your own preview */
  files._blocks = Object.fromEntries(routed.map((r, i) => [r.kit, blocks[i]]))
  files._collisions = collisions(routed, kits)
  return files
}

/**
 * THE CONTRAST AUDIT, on the values someone actually set.
 *
 * Every editor in this space lets you build an unreadable theme and says
 * nothing. We already carry the maths, so the export can show each pair with
 * its ratio before anyone downloads it — and a pair that fails is named rather
 * than rounded away.
 *
 * Only pairs that REALLY MEET on screen. Auditing ink against a colour nothing
 * puts it on produces phantom failures, which this project has paid for once
 * already (a mid-grey on white that no component ever rendered).
 */
const PAIRS = [
  ['Body text on the page', 'ink', 'page', 4.5],
  ['Body text on a surface', 'ink', 'surface', 4.5],
  ['Muted text on the page', 'inkMuted', 'page', 4.5],
  ['Muted text on a surface', 'inkMuted', 'surface', 4.5],
  ['Button text on the brand', 'onBrand', 'brand', 4.5],
  ['The brand against the page', 'brand', 'page', 3],
  ['A line against a surface', 'line', 'surface', 3],
]
export function auditContrast(values) {
  const out = []
  for (const [label, fg, bg, min] of PAIRS) {
    const a = values[fg], b = values[bg]
    if (!a || !b) continue
    const ratio = contrast(a, b)
    out.push({ label, fg, bg, ratio: Math.round(ratio * 100) / 100, min, passes: ratio >= min })
  }
  return out
}

/* Between that heading and the NEXT one. Slicing to the end of the file swept
   the contrast section in with it, so every pair appeared twice — once as a
   ratio and once as a thing that "could not be done". */
export const section = (md, heading) => {
  const from = md.indexOf(heading)
  if (from < 0) return []
  const rest = md.slice(from + heading.length)
  const to = rest.indexOf('\n## ')
  return (to < 0 ? rest : rest.slice(0, to)).split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2))
}

/** What you have, where it came from, and — the part nobody else prints — what could not be done. */
function manifest(routed, kits, values) {
  const rows = routed.map((r) => {
    const k = kits[r.kit]
    return `| ${k.name} | ${k.version ?? 'live'} | ${k.license ?? 'see project'} | ${Object.keys(r.vars).length} | ${k.source} |`
  })

  const caveats = routed.flatMap((r) => {
    const k = kits[r.kit]
    const out = []
    for (const b of r.needsBuild ?? []) out.push(`- **${k.name} · ${b.role}** — not settable at runtime. \`${b.sass}\` is in \`_custom.scss\`; ${b.why}.`)
    if (r.derived?.length) out.push(`- **${k.name} · ${r.derived.join(', ')}** — computed by the kit from your brand colour. Generate the full scheme with its own tool rather than setting these by hand.`)
    if (r.unroutable?.length) out.push(`- **${k.name} · ${r.unroutable.join(', ')}** — this kit has no variable for that job, so the value was not written anywhere.`)
    if (r.unscaled?.length) out.push(`- **${k.name}** — ${r.unscaled.join(', ')} were left at their published values: no ratio could be read from a unitless input.`)
    if (r.added?.length) out.push(`- **${k.name} · ${r.added.join(', ')}** — this kit ships no semantic name for these, so they were ADDED. Reference them yourself (\`bg-brand\`, \`text-ink\`).`)
    /* Not every gap is a token that would not take a value. Some are parts of a
     * screen the kit ships no component for at all, and a theme that stays
     * silent about those is the reason people find out at build time. */
    for (const c of r.chosen ?? []) {
      out.push(`- **${k.name} · ${c.role}** — not a value this kit takes. You asked for \`${c.asked}\`; the nearest of its ${c.of} published ${c.attr.replace('data-', '')} settings is **${c.picked}** (\`${c.got}\`). ${c.why}.`)
    }
    for (const [part, why] of COMPONENT_GAPS[r.kit] ?? []) out.push(`- **${k.name} · ${part}** — ${why}.`)
    return out
  })

  const clash = collisions(routed, kits)
  return `# Your design system

| Kit | Version | Licence | Variables set | Read from |
|---|---|---|---|---|
${rows.join('\n')}

## What you set

${ROLES.filter((r) => values[r.id] != null).map((r) => `- \`${r.id}\` — ${values[r.id]}  *(${r.what})*`).join('\n')}

## What could not be done

${caveats.length ? caveats.join('\n') : 'Nothing — every value reached every kit you enabled.'}

## Contrast

${(() => { const a = auditContrast(values); const bad = a.filter((p) => !p.passes)
  return `${a.length - bad.length} of ${a.length} pairs clear their floor.\n\n` +
    a.map((p) => `- ${p.passes ? '✓' : '✗'} ${p.label} — **${p.ratio}:1**, needs ${p.min}`).join('\n') })()}

${clash.length ? `## Names two kits both use

These variables mean different things to different kits you enabled. Whichever
stylesheet loads second wins, and nothing warns.

${clash.map((c) => `- \`${c.variable}\` — written for **${kits[c.written].name}**, but **${kits[c.read].name}** also reads it (its own value: \`${c.theirValue}\`). Load their stylesheets in separate scopes, or drop one of the two.`).join('\n')}

` : ''}## The rule this was generated under

No value here was invented. Each kit's defaults were read from what it
publishes, and every variable written belongs to the kit that publishes it. Where
a kit could not take a value, this file says so rather than the package pretending.
`
}

/**
 * The file you hand a coding agent.
 *
 * The consumer of a design system is increasingly not a person clicking a
 * dashboard but an agent that was asked to build something and has nothing to
 * reach for. So the package carries a file written FOR that reader: what the
 * system is, in its own vocabulary, and the two or three things it must not do.
 */
function brief(routed, kits, values) {
  const set = ROLES.filter((r) => values[r.id] != null)
  return `# The design system for this project

Read this before writing any UI. Everything below is decided; none of it is
yours to choose again.

## Install

${routed.map((r) => `- **${kits[r.kit].name}** ${kits[r.kit].version ?? ''} — see \`install.md\``).join('\n')}

Import \`theme.css\` AFTER the kits, so these values win.

## The values

${set.map((r) => `- \`${r.id}\` — ${values[r.id]} · ${r.what}`).join('\n')}

## Rules

- Use the components of the kits above. Do not write a new button, card or
  input; one already exists in every kit here.
- Never hard-code a colour, a radius or a font size. Every one of them is a
  variable in \`theme.css\`, in the vocabulary of the kit you are rendering with.
- ${routed.some((r) => r.needsBuild?.length) ? 'Some values are build-time, not runtime — see MANIFEST.md before changing the brand.' : 'All values above are settable at runtime.'}
- MANIFEST.md lists what this system CANNOT express. If you need something that
  is not in it, say so rather than inventing it.
`
}
