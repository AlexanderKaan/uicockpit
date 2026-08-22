/**
 * EVERY VARIABLE WE WRITE, LOOKED UP IN THE THING THAT SHOULD READ IT.
 *
 * The fidelity meter asks whether the classes on the wall are really the kit's.
 * This asks the other half, and it is the half nobody else can ask: we write
 * two hundred and thirty variables across eight kits — does anything read them?
 *
 * A variable nobody reads is a knob that does nothing. It is written, it is in
 * the download, it is in DESIGN.md, and turning it changes not one pixel. That
 * failure is silent by construction: the CSS is valid, the build passes, the
 * value is right there in the file.
 *
 * Three places can read one:
 *
 *   its stylesheet   the CSS the browser loads — the ordinary case
 *   its code         a kit whose components are code, not classes, keeps its
 *                    reads in there: Material's shadow roots are in its bundle
 *   the composition  the markup this kit renders. A kit with a React layer sets
 *                    its own per-component variables from JS we cannot run, so
 *                    the wall does what that layer does — and if the wall reads
 *                    it, the value provably reaches the screen
 *
 * The gate is per ROLE, not per variable, because a role is what a knob turns:
 * a scale can have unread steps and still work, but a role none of whose
 * variables anything reads is a knob that does nothing.
 *
 *   node orphans.mjs           report
 *   node orphans.mjs --gate    and exit 1 on a knob that does nothing
 */
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { buildCss } from './build-css.mjs'
import { generate } from './generate.mjs'
import { MAP, ROLES, route, darken } from './roles.mjs'
import { WALL, useMantineClasses, useIcons, useShadcnParts, useAntdParts } from './wall-bindings.mjs'
import { SCENES, ICON_NAMES, wallMarkup } from './scenes.mjs'
import { render } from './parts.mjs'
import { SPECIMENS } from './generate.mjs'
import { icons } from './icons.mjs'
import { materialElements } from './material-elements.mjs'

const IDS = ['tailwind', 'daisyui', 'shadcn', 'bootstrap', 'material', 'radix', 'mantine', 'antd', 'openprops']
const VALUES = { brand: '#0b6e8a', onBrand: '#ffffff', page: '#f7f9fa', surface: '#ffffff', ink: '#16181c',
  inkMuted: '#5c6b72', line: '#dfe2e7', radius: '10px', baseText: '16px', space: '1', elevation: '1',
  lineHeight: '1.5', letterSpacing: '0em', fontWeight: '600', borderWidth: '1px',
  success: '#2f9e44', warning: '#f08c00', danger: '#e03131', focus: '#0b6e8a',
  /* every role gets a value, or a role left blank looks like a role nobody reads */
  fontHeading: 'Fraunces, serif', fontBody: 'Inter, sans-serif' }

/* Kits whose stylesheet is compiled from the markup we hand it. A rule that
 * would read the variable only exists if something on the wall asked for it, so
 * a zero there is a statement about this wall and not about the kit. */
const SCANNED = new Set(['tailwind', 'daisyui', 'shadcn'])

/* A kit whose components are CODE keeps its reads in the bundle, not in a
 * stylesheet — so for this one the bundle is the witness that decides. */
const IN_CODE = new Set(['material'])

/**
 * The composition, MINUS the four foundation specimens.
 *
 * A colour card exists to display tokens: of course it reads them. Counting it
 * as a reader let the wall vouch for a variable nothing else touched — which is
 * exactly how Material's corner radius looked fine while its own components
 * ignored every name we wrote. The witness is the product, not the swatch.
 */
const usesSpecimen = (n) => {
  if (!n || typeof n !== 'object') return false
  if (SPECIMENS.includes(n.p)) return true
  return (n.kids ?? []).some(usesSpecimen)
}
export const product = (bind) => SCENES.filter((c) => !usesSpecimen(c.node))
  .map((c) => render(c.node, bind)).join('')

const reads = (text, name) =>
  (text.match(new RegExp(`var\\(\\s*${name.replace(/-/g, '\\-')}\\s*[,)]`, 'g')) ?? []).length

/**
 * Which variables each ROLE writes into this kit, and what the routing table
 * says about each — read out of the table rather than typed, so a role that
 * grows a sibling grows a row here too.
 */
export function written(kit) {
  const out = []
  for (const role of ROLES) {
    const e = MAP[kit]?.[role.id]
    if (!e) continue
    const names = [
      ...(e.var ? [[e.var, 'the variable this role routes to']] : []),
      ...(e.also ?? []).map((n) => [n, 'a step of the same scale']),
      ...(e.rgb ?? []).map((n) => [n, 'the same colour as channels']),
      ...(e.tint ?? []).map((n) => [n, 'a tint the kit derives from it']),
      ...(e.shadows ?? []).map((n) => [n, 'a step of the shadow scale']),
      ...(e.alphaFrom ? [[e.alphaFrom, 'the alpha this colour is drawn at']] : []),
    ]
    if (!names.length) continue
    out.push({ role: role.id, label: role.label, names, added: !!e.new, needsBuild: !!e.needsBuild,
      /* A role handed to a generator is not read from a stylesheet, and asking
         whether anything reads it answers no for a knob that works. */
      seed: e.seed ?? null })
  }
  return out
}

/** What reads this variable, and where. */
export function lookup(name, { sheet, code, wall }) {
  return { sheet: reads(sheet, name), code: reads(code, name), wall: reads(wall, name) }
}

/**
 * The analysis, over inputs somebody else already built.
 *
 * Pure on purpose: the page build compiles every kit's CSS once and would
 * otherwise have to compile it a second time just to know this — and a meter
 * that doubles the build is a meter that gets switched off.
 */
const esc = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function analyse({ kits, css, files, routed, code = '' }) {
  return routed.map((r) => {
    const whole = css[r.kit] ?? ''
    /* our own block writes the declarations; a read inside it is not the kit
       reading anything. Removed where it can be told apart — for the three that
       compile through Tailwind it cannot, and that is said out loud below. */
    const block = files._blocks[r.kit] ?? ''
    const sheet = block && whole.includes(block) ? whole.split(block).join('') : whole
    const where = { sheet, code: IN_CODE.has(r.kit) ? code : '', wall: WALL[r.kit] ? product(WALL[r.kit]) : '' }
    const tokensOnly = kits[r.kit].layer === 'tokens'

    const roles = written(r.kit).map((w) => {
      const names = w.names.map(([name, why]) => ({ name, why, ...lookup(name, where) }))
      /* what has to read it depends on where this kit keeps its rules */
      /* AND ON WHETHER IT IS READ AT ALL.
         Ant Design's page colour is not a variable its stylesheet reads, it is
         an argument its algorithm takes — and what proves the knob works is
         that the stylesheet their generator produced carries OUR value under
         THAT name. Asking the read question instead reported two working knobs
         as doing nothing, which is a false alarm and the worst kind. */
      const seen = w.seed
        ? names.some((n) => new RegExp(`${n.name}\\s*:\\s*${esc(String(r.vars[n.name] ?? '\0'))}`, 'i').test(sheet))
        : IN_CODE.has(r.kit)
          ? names.some((n) => n.code > 0)
          : names.some((n) => n.sheet + n.wall > 0)
      return { ...w, names, seen, generated: !!w.seed }
    })
    return { kit: r.kit, name: kits[r.kit].name, scanned: SCANNED.has(r.kit),
      tokensOnly, inCode: IN_CODE.has(r.kit), separable: !!block && whole.includes(block), roles }
  })
}

/**
 * The lines the download should carry: a variable in your theme that nothing
 * reads. Scanned kits are left out on purpose — their stylesheet is compiled
 * from this wall, so a zero there is a fact about the wall and would read as an
 * accusation against the kit.
 */
export function unread(report) {
  return report.filter((k) => !k.scanned).flatMap((k) => k.roles.filter((r) => !r.generated).flatMap((r) => {
    const nowhere = r.names.filter((n) => n.sheet + n.code + n.wall === 0)
    if (!nowhere.length) return []
    const instead = r.names.filter((n) => n.sheet + n.code + n.wall > 0).map((n) => n.name)
    return [{ kit: k.kit, name: k.name, role: r.label, names: nowhere.map((n) => n.name), instead,
      tokensOnly: k.tokensOnly }]
  }))
}

export async function orphans(log = () => {}) {
  const kits = Object.fromEntries(IDS.map((id) => [id, JSON.parse(readFileSync(`kits/${id}.json`, 'utf8'))]))
  useMantineClasses(kits.mantine.classes)
useShadcnParts(kits.shadcn?.parts)
useAntdParts(kits.antd?.parts)
  useIcons(icons(ICON_NAMES).icons)
  const css = await buildCss(VALUES, IDS, kits, (id) => wallMarkup(WALL[id] ?? WALL.tailwind), log)
  return analyse({ kits, css, files: generate(VALUES, IDS, kits),
    routed: darken(route(VALUES, IDS, kits), kits), code: materialElements().js })
}

/* Guarded: this file is also imported for `written` and `lookup`, and without it
 * importing one of them ran three npm installs and a Tailwind build. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await orphans(console.log)
  const gate = process.argv.includes('--gate')
  console.log('\n  Every variable we write, looked up in the thing that should read it.\n')

  let dead = 0
  for (const k of report) {
    const all = k.roles.flatMap((r) => r.names)
    const read = all.filter((n) => n.sheet > 0).length
    console.log(`  ${k.name.padEnd(14)} ${String(read).padStart(3)} of ${String(all.length).padEnd(3)} read by its own stylesheet` +
      `${k.inCode ? '   (its components are code — the bundle is what decides)' : ''}` +
      `${k.tokensOnly ? '   (a token layer — it publishes for your code, nothing here reads it)' : ''}` +
      `${k.scanned ? '   (compiled from this wall — a zero here is about the wall)' : ''}`)

    for (const r of k.roles) {
      const quiet = r.names.filter((n) => n.sheet === 0)
      if (!quiet.length) continue
      const elsewhere = quiet.filter((n) => n.code + n.wall > 0)
      const nowhere = quiet.filter((n) => n.code + n.wall === 0)

      if (elsewhere.length) {
        const how = elsewhere[0].code ? 'its components read it, its stylesheet does not'
          : 'the composition reads it, its stylesheet does not'
        console.log(`      ${r.label.padEnd(14)} ${how}: ${elsewhere.map((n) => n.name).join(' ')}`)
      }
      if (!nowhere.length) continue

      if (r.seen) {
        console.log(`      ${r.label.padEnd(14)} ${r.added ? 'a name we add, unused so far' : 'published and unread'}: ${nowhere.map((n) => n.name).join(' ')}`)
      } else if (r.needsBuild) {
        console.log(`      ${r.label.padEnd(14)} compiled, as we say — nothing reads it live: ${nowhere.map((n) => n.name).join(' ')}`)
      } else if (k.tokensOnly) {
        console.log(`      ${r.label.padEnd(14)} for your code, not for its own: ${nowhere.map((n) => n.name).join(' ')}`)
      } else {
        dead++
        console.log(`   ✗  ${r.label.padEnd(14)} ${k.inCode ? 'its own components read NONE of these — the knob does not reach them'
          : 'NOTHING reads any of these — the knob does nothing'}`)
        for (const n of r.names) console.log(`                     ${n.name}  (${n.why})`)
      }
    }
  }

  console.log(dead
    ? `\n  ${dead} knob${dead > 1 ? 's do' : ' does'} nothing. A variable nobody reads is a promise we cannot keep.\n`
    : '\n  Every knob reaches something. Where a variable is unread the line above says which and why.\n')
  if (gate && dead) process.exit(1)
}
