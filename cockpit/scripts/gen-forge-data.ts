/**
 * gen-forge-data — everything the forge needs to answer, in one artefact.
 *
 *   npx vite-node scripts/gen-forge-data.ts          # write cli/data/forge.json
 *   npx vite-node scripts/gen-forge-data.ts --check  # fail if stale (build gate)
 *
 * The forge (cli/src/forge.mjs) answers "should this component exist, and if
 * so, what does it owe" — and it answers from DATA, never from opinion: the
 * four catalogues the derivation reads, the kit's own component list with each
 * recipe's provenance line and behaviour contract, the platform floor, and a
 * translation table from the words people use to the names the catalogues use.
 * All of that lives in this repo in five places. The forge ships in the `cli`
 * package (zero-dep, publishable, also imported by the MCP server) and runs in
 * the browser on /forge, so it cannot read those five places itself. This
 * script reads them once and writes ONE JSON the three homes share — the same
 * shape as gen-openui-entry: generated from the sources, checked in the build,
 * so the CLI, the MCP tool and the page cannot answer differently.
 *
 * Runs under vite-node so it can import the kit's TypeScript directly (RECIPES,
 * the explainer, COMPONENT_PAGES, tierOf, buildTokens) instead of parsing it
 * with regexes — a third parser of apg.ts would be a third chance to be wrong.
 * Provenance comes from derive-provenance --json --static, the same call the
 * derivation gate makes, so the forge's idea of "where a component comes from"
 * IS the gate's.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { RECIPES } from '../src/kit/recipes'
import { explainerFor } from '../src/kit/explainer'
import { tierOf } from '../src/kit/segments'
import { COMPONENT_PAGES } from '../src/stage/views/ComponentGallery'
import { buildTokens } from '../src/tokens/buildTokens'
import { DEFAULT_CONFIG } from '../src/tokens/defaults'

const here = dirname(fileURLToPath(import.meta.url))
const CHECK = process.argv.includes('--check')
const OUT = join(here, '../../cli/data/forge.json')

const readJson = (rel: string) => JSON.parse(readFileSync(join(here, rel), 'utf8'))
const platform = readJson('data/platform-catalogues.json')
const services = readJson('data/service-systems.json')
const openui = readJson('data/openui-names.json')
const vocabulary = readJson('data/forge-vocabulary.json')
const decisions = readJson('data/derivation-decisions.json')
/* The SHAPE per recipe, read off the rendered wall by gen-manifest.ts: element,
 * container, parts with element/required/repeatable/parent, states seen,
 * composes, and a canonical skeleton. Structure only; the contract stays in
 * apg.ts. Optional here so the forge data still builds before a first run. */
type ManifestPart = { element: string | null; required?: boolean; repeatable: boolean; parent: string | null; rendered: boolean; cssDeclared: boolean; aria: Record<string, string[]>; in: number }
type ManifestEntry = { block: string; instances: number; element: string | null; container: string | null; parts: Record<string, ManifestPart>; states: { modifiers: string[]; partModifiers: string[]; aria: Record<string, string[]> }; composes: string[]; skeleton: string | null }
const manifestFile = existsSync(join(here, '../src/kit/manifest.json')) ? (readJson('../src/kit/manifest.json') as { components: Record<string, ManifestEntry> }) : null

/* ── the floor: every w('…') selector in globalLayer.ts, with the rule body
 * when it is a simple block, so a PLATFORM verdict can quote the rule that
 * already styles the element instead of just asserting one exists. ── */
const floorSrc = readFileSync(join(here, '../src/kit/globalLayer.ts'), 'utf8')
const floor: { selector: string; body: string | null }[] = []
for (const m of floorSrc.matchAll(/\$\{w\(\s*'([^']+)'\s*\)\}(\s*\{([^{}]*)\})?/g)) {
  floor.push({ selector: m[1].replace(/\s+/g, ' ').trim(), body: m[3] ? m[3].replace(/\s+/g, ' ').trim() : null })
}

/* ── provenance: the derivation's PUBLISHED answer, per recipe ──
 * data/provenance.json is what `npm run derive:provenance -- --write` records
 * with a browser: layers 2/3/4 from the sources, layer 1 MEASURED off the
 * rendered DOM (which tag carries the recipe's primary class). A static run
 * cannot know layer 1, and layer 1 is what tells the forge that .btn is the
 * styling of <button> — so the forge reads the measured file, and this script
 * refuses to build from a stale one: its recipe set must equal the kit's. That
 * makes the published derivation's freshness a build-checked property, which
 * it was not before. */
type Source = { layer: number; source: string; because: string; url?: string }
const provFile = readJson('data/provenance.json') as { assigned: Record<string, { sources: Source[]; covers: { openui: string[]; service: string[] } }>; unassigned: string[] }
const provIds = new Set([...Object.keys(provFile.assigned), ...provFile.unassigned])
const kitIds = new Set(RECIPES.map((r) => r.id))
const stale = [...kitIds].filter((id) => !provIds.has(id)).concat([...provIds].filter((id) => !kitIds.has(id)))
if (stale.length) {
  console.error(`✗ data/provenance.json is out of step with the kit (${stale.join(', ')}). Run \`npm run derive:provenance -- --write\` with the dev server up, then regenerate.`)
  process.exit(1)
}
const provenanceOf = new Map(Object.entries(provFile.assigned).map(([id, a]) => [id, a.sources]))
const coversOf = new Map(Object.entries(provFile.assigned).map(([id, a]) => [id, a.covers ?? { openui: [], service: [] }]))
const prov = { unassigned: provFile.unassigned.map((id) => ({ id })) }

/* ── the kit ── */
/* A recipe can carry more than one public page — pagination-breadcrumb is both
 * /components/breadcrumb and /components/pagination — so every page is kept;
 * `page` is the first, for the one-line answers. */
const pagesOf = new Map<string, typeof COMPONENT_PAGES>()
for (const p of COMPONENT_PAGES) pagesOf.set(p.recipeId, [...(pagesOf.get(p.recipeId) ?? []), p])
const recipes = RECIPES.map((r) => {
  const ex = explainerFor(r.id)
  const pages = pagesOf.get(r.id) ?? []
  const page = pages[0]
  const sources = provenanceOf.get(r.id) ?? []
  // The element the recipe's block is: layer 1 says "<button>" when the recipe
  // IS the styling of a platform element; otherwise a div is the honest default.
  const platformSource = sources.find((s) => s.layer === 1 && /^<[a-z]/.test(s.source))
  const element = platformSource ? platformSource.source.replace(/^<|>$/g, '').replace(/\s.*$/, '') : null
  return {
    id: r.id,
    section: r.section,
    tier: tierOf(r.id),
    block: ex?.block ?? null,
    parts: ex?.parts ?? [],
    states: ex?.states ?? [],
    element,
    page: page ? { slug: page.slug, name: page.name, group: page.group, blurb: page.blurb } : null,
    pages: pages.map((p) => ({ slug: p.slug, name: p.name, group: p.group, blurb: p.blurb })),
    provenance: sources,
    covers: coversOf.get(r.id) ?? { openui: [], service: [] },
    apg: ex?.apg ? { pattern: ex.apg.pattern, url: ex.apg.url, keys: ex.apg.keys, aria: ex.apg.aria, free: ex.apg.free ?? null } : null,
    apgNote: ex?.apgNote ?? null,
    manifest: manifestFile?.components[r.id] ?? null,
  }
})

const data = {
  _generated: 'cockpit/scripts/gen-forge-data.ts — do not edit; `npx vite-node scripts/gen-forge-data.ts` regenerates, `--check` is the build gate',
  _what: 'Everything the forge (cli/src/forge.mjs) answers from: the four catalogues, the platform floor, the translation table, and the kit with provenance + behaviour contracts.',
  catalogues: {
    html: { url: platform.html.url, controls: platform.html.controls, structure: platform.html.structure, content: platform.html.content, noRender: Object.fromEntries(Object.entries(platform.html._no_render).filter(([k]) => !k.startsWith('_'))) },
    apg: { url: platform.apg.url, patterns: platform.apg.patterns },
    openui: { url: openui._source, systems: openui._systems, names: openui.names },
    services: Object.fromEntries(Object.entries(services.systems as Record<string, { url: string; components?: Record<string, string>; patterns?: Record<string, string> }>).map(([name, sv]) => [name, { url: sv.url, components: sv.components ?? {}, patterns: sv.patterns ?? {} }])),
  },
  floor,
  overlap: decisions.overlap,
  decided: decisions.decided,
  tokenCovered: decisions.tokenCovered,
  vocabulary: vocabulary.synonyms,
  tokens: Object.keys(buildTokens(DEFAULT_CONFIG).vars),
  kit: { recipes, unassigned: prov.unassigned.map((u) => u.id) },
}

const next = JSON.stringify(data, null, 1) + '\n'
if (CHECK) {
  const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : ''
  if (prev !== next) {
    console.error('✗ cli/data/forge.json is stale — run `npm run gen:forge` and commit the result.')
    process.exit(1)
  }
  console.log(`✓ forge.json current (${recipes.length} recipes, ${floor.length} floor rules, ${Object.keys(vocabulary.synonyms).length} synonyms)`)
} else {
  writeFileSync(OUT, next)
  console.log(`wrote cli/data/forge.json — ${recipes.length} recipes, ${floor.length} floor rules, ${Object.keys(vocabulary.synonyms).length} synonyms, ${data.tokens.length} tokens`)
}
