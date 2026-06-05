#!/usr/bin/env node
/* extract-kit.mjs — ONE-TIME migration: losslessly partition preview.css into
 *   (a) the kit's structured recipe array  → src/kit/recipes/index.ts
 *   (b) the non-exportable preview layer    → src/styles/preview-only.css
 *
 * "Lossless" is the safety property: every line of preview.css lands in exactly
 * one bucket, so the live preview (which loads BOTH the kit recipes AND
 * preview-only.css) renders byte-for-byte what it does today. The export
 * (genCss) takes ONLY the KIT bucket → it ships the full component kit, minus
 * the demo scaffolding.
 *
 * Split points = the `/​* === Banner === *​/` section markers. Each section is
 * classified KIT (a real, exportable component recipe) or PREVIEW_ONLY (gallery
 * masonry, dashboard/app chrome, panel chrome, the global-layer top, or
 * dead-vertical CSS left after the app-cull).
 *
 * Run:  node scripts/extract-kit.mjs --dry   (report only, writes nothing)
 *       node scripts/extract-kit.mjs         (writes the two outputs)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const DRY = process.argv.includes('--dry')

const SRC = resolve(ROOT, 'src/styles/preview.css')
const OUT_RECIPES = resolve(ROOT, 'src/kit/recipes/index.ts')
const OUT_PREVIEW = resolve(ROOT, 'src/styles/preview-only.css')

const css = readFileSync(SRC, 'utf8')
const lines = css.split('\n')

/* A section starts at a line that opens a banner comment: `/​* === `.
 * Section 0 (before the first banner) is the global-layer preamble. */
const isBanner = (l) => /^\/\*\s*===/.test(l)

/* PREVIEW_ONLY if the banner's first line contains any of these (lowercased).
 * Everything else defaults to KIT (never drop a real component). */
const PREVIEW_ONLY = [
  'inset focus rings',        // global focus system — owned by globalLayer.ts (kept here for preview until Phase 2b)
  'sub-tile scrollbars',      // overlay chrome polish (references app-only .row-menu__pop)
  'component gallery',        // masonry layout — pure scaffolding
  'dashboard',                // SupaDash app shell chrome (.dash*)
  'named animation keyframes', // the in-app keyframes "mirror" — owned by globalLayer.ts
  'reduced motion',           // global motion guard — owned by globalLayer.ts
  'music player',             // DEAD (MusicApp culled, 0 usage)
  'pdp ',                     // DEAD (EcommerceApp culled, 0 usage)
  'product-detail',           // DEAD
  'mobile preview page',      // phone-frame showcase scaffold
  'color picker',             // configurator panel chrome (.colorpick)
  'form measure',             // demo measuring glue
  'marketing demos',          // divider banner only (no CSS of its own)
]

/* Short, clean label: cut at the first descriptor break (em-dash, paren, a
 * second `===`, or a `*​/`). "Spinner === — uses…" → "Spinner";
 * "Avatar — sizes, group stack" → "Avatar". */
const cleanLabel = (name) => name.split(/—|\(|===|\*\//)[0].trim()
const slug = (name) =>
  cleanLabel(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section'

/* Build sections: [{ banner, label, body }] */
const sections = []
let cur = { banner: '(preamble)', label: '(preamble)', startLine: 1, lines: [] }
for (const l of lines) {
  if (isBanner(l)) {
    sections.push(cur)
    const label = l.replace(/^\/\*\s*=+\s*/, '').replace(/\s*=+\s*(\*\/)?\s*$/, '').trim()
    cur = { banner: l, label, lines: [l] }
  } else {
    cur.lines.push(l)
  }
}
sections.push(cur)

/* Classify + assign unique ids */
const seenIds = new Set()
const uniqueId = (base) => {
  let id = base || 'section'
  let n = 2
  while (seenIds.has(id)) id = `${base}-${n++}`
  seenIds.add(id)
  return id
}

const kit = []
const previewOnly = []
let kitLines = 0
let previewLines = 0
for (const s of sections) {
  const first = (s.lines[0] || '').toLowerCase()
  const isPreamble = s.label === '(preamble)'
  const isPreviewOnly = isPreamble || PREVIEW_ONLY.some((p) => first.includes(p))
  const text = s.lines.join('\n')
  if (isPreviewOnly) {
    previewOnly.push(s)
    previewLines += s.lines.length
  } else {
    s.id = uniqueId(slug(s.label))
    kit.push(s)
    kitLines += s.lines.length
  }
}

/* ---- report ---- */
const totalAccounted = kitLines + previewLines
console.log('=== extract-kit classification ===')
console.log(`preview.css lines: ${lines.length}  ·  accounted: ${totalAccounted}  ·  ${totalAccounted === lines.length ? 'LOSSLESS ✓' : 'MISMATCH ✗'}`)
console.log(`\nKIT recipes: ${kit.length} sections (${kitLines} lines)`)
for (const s of kit) console.log(`  · ${s.id.padEnd(22)} « ${s.label} »`)
console.log(`\nPREVIEW_ONLY: ${previewOnly.length} sections (${previewLines} lines)`)
for (const s of previewOnly) console.log(`  · ${s.label}`)

if (DRY) {
  console.log('\n--dry: no files written.')
  process.exit(0)
}

/* ---- emit src/kit/recipes/index.ts ---- */
const esc = (str) => str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
const recipeObjects = kit
  .map((s) => {
    // Keep the WHOLE section verbatim (its `=== banner ===` included), so the
    // emitted kit CSS is byte-identical to today's preview.css component CSS.
    const body = s.lines.join('\n').replace(/^\n+/, '').replace(/\s+$/, '')
    return `  {\n    id: '${s.id}',\n    section: ${JSON.stringify(cleanLabel(s.label))},\n    css: \`${esc(body)}\`,\n  },`
  })
  .join('\n')

const recipesFile = `/**
 * The kit's component recipes — the single authored source.
 *
 * MIGRATED ONCE from src/styles/preview.css (scripts/extract-kit.mjs) and now
 * hand-authored here. Both consumers read this array:
 *   - src/export/genCss.ts        → the export / CDN tokens.css
 *   - src/main.tsx (kit inject)   → the live preview
 * There is no second copy to mirror.
 *
 * Each entry is one component family; \`css\` is static, var(--k-*)-driven CSS
 * (UNSCOPED — a CDN consumer needs \`.btn\`, not \`.cockpit-preview .btn\`).
 * Order = emission order in both outputs.
 */
import type { Recipe } from '../types'

export const RECIPES: readonly Recipe[] = [
${recipeObjects}
]
`

/* ---- emit src/styles/preview-only.css ---- */
const previewHeader = `/* preview-only.css — the NON-exportable preview layer.
 *
 * Everything here is live-preview scaffolding that must NOT ship to a CDN
 * consumer: the global-layer top (kept here until Phase 2b folds it into
 * src/kit/globalLayer.ts), the component-gallery masonry, the SupaDash app
 * (dashboard) chrome, configurator panel chrome, and dead-vertical CSS left
 * after the app-cull. The exportable component recipes live in
 * src/kit/recipes/index.ts and are injected into the preview by src/main.tsx.
 *
 * Generated once by scripts/extract-kit.mjs from preview.css; hand-maintained
 * thereafter. */
`
const previewCss = previewHeader + '\n' + previewOnly.map((s) => s.lines.join('\n')).join('\n') + '\n'

writeFileSync(OUT_RECIPES, recipesFile)
writeFileSync(OUT_PREVIEW, previewCss)
console.log(`\nWROTE:\n  ${OUT_RECIPES}  (${kit.length} recipes)\n  ${OUT_PREVIEW}  (${previewOnly.length} sections)`)
