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

const stamp = (kit) => `${kit.name}${kit.version ? ' ' + kit.version : ''}`
const decl = (vars, indent = '  ') => Object.entries(vars).map(([k, v]) => `${indent}${k}: ${v};`).join('\n')

/* ── one block per kit, in the form that kit reads ────────────────────────── */
const EMIT = {
  tailwind: (r, kit) => `/* ${stamp(kit)} — semantic names Tailwind does not ship.
   These generate utilities: bg-brand, text-ink, border-line, rounded-lg. */
@theme {
${decl(r.vars)}
}`,

  shadcn: (r, kit) => `/* ${stamp(kit)} — the variables its components read.
   Dark mode is not generated yet: add a .dark block with your dark values. */
:root {
${decl(r.vars)}
}`,

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
   the theme, so anything left out would be missing rather than inherited. */
@plugin "daisyui/theme" {
  name: "yourkit";
  default: true;
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
}

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
  daisyui: (k) => [`npm install ${k.npm}@${k.version}`, `/* then in your CSS: */ @plugin "daisyui";`],
  bootstrap: (k) => [`npm install ${k.npm}@${k.version} sass`, `/* build _custom.scss instead of importing bootstrap.css */`],
  material: (k) => [`npm install ${k.npm}@${k.version} @material/material-color-utilities`],
  shadcn: () => [`npx shadcn@latest init`, `npx shadcn@latest add button card input dialog table  # whatever you picked`],
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
  return `## ${kit.name}\n\n\`\`\`bash\n${(INSTALL[r.kit]?.(kit) ?? []).join('\n')}\n\`\`\`\n`
}).join('\n')}
Then import \`theme.css\` after the kits, so your values win.
`

  files['MANIFEST.md'] = manifest(routed, kits, values)
  /* per-kit blocks too: anything showing ONE kit must load only that kit's
     block, or the collision above happens inside your own preview */
  files._blocks = Object.fromEntries(routed.map((r, i) => [r.kit, blocks[i]]))
  files._collisions = collisions(routed, kits)
  return files
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
