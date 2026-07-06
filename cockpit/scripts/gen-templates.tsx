/**
 * gen-templates (LP4) — prerender the Ledger screens to static HTML templates.
 *
 * KEY INSIGHT: template markup is IDENTICAL for every kit — the design lives
 * entirely in the kit CSS the <link> pulls in. So templates are built ONCE at
 * authoring time (this script → public/templates/*.html, committed) and the CLI
 * (`npx uicockpit template <name>`) only rewrites the <link> href to the user's
 * kit hash. No React on the worker, no per-request rendering.
 *
 * Rendered WITHOUT appNav: ShowcaseShell then emits pure exported-kit classes
 * (scaffold · appbar · navsuite · the sections — provenance-audited), never the
 * preview-only chrome.
 *
 * Run manually after showcase/manifest changes:
 *   npx vite-node scripts/gen-templates.tsx
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { LEDGER_SCREENS, SHOWCASES } from '../src/showcases/manifests'
import { ShowcaseShell } from '../src/stage/views/PagesView'
import { IconProvider } from '../src/icons/Icon'
import { DEFAULT_CONFIG } from '../src/tokens/defaults'
import { encode } from '../src/state/hash'

// fileURLToPath, NOT .pathname — the project path contains spaces and
// .pathname keeps them percent-encoded (mkdirSync then creates a literal %20 tree).
const OUT = fileURLToPath(new URL('../public/templates/', import.meta.url))
mkdirSync(OUT, { recursive: true })

// Templates ship wearing the DEFAULT kit so the raw file renders standalone;
// the CLI swaps this href for the user's hash (the data attribute is the anchor).
const defaultHash = encode(DEFAULT_CONFIG)

const index: Array<{ name: string; title: string; blurb: string; file: string }> = []

for (const screen of LEDGER_SCREENS) {
  const m = SHOWCASES.find((s) => s.id === screen.id)!
  const name = m.id.replace(/^ledger-?/, '') || 'home'
  const body = renderToStaticMarkup(
    <IconProvider set={DEFAULT_CONFIG.iconSet}>
      <ShowcaseShell m={m} width={1200} />
    </IconProvider>,
  )
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${m.title} — UIcockpit template</title>
<!-- Your design system: one link, generated at uicockpit.com.
     \`npx uicockpit template ${name}\` rewrites this href to YOUR kit hash. -->
<link rel="stylesheet" data-uicockpit-kit href="https://kit.uicockpit.com/k/${encodeURIComponent(defaultHash)}.css">
<style>
  /* Page shell only — everything visual comes from the kit. */
  body { margin: 0; background: var(--k-bg); color: var(--k-fg); font-family: var(--k-font-body); }
  .scaffold { margin: 0 auto; min-height: 100vh; }
</style>
</head>
<body>
${body}
</body>
</html>
`
  writeFileSync(`${OUT}${name}.html`, html)
  index.push({ name, title: m.title, blurb: m.blurb, file: `${name}.html` })
  console.log(`  ✓ templates/${name}.html (${(html.length / 1024).toFixed(0)} kB)`)
}

writeFileSync(`${OUT}index.json`, JSON.stringify({ generator: 'uicockpit', templates: index }, null, 2) + '\n')
console.log(`  ✓ templates/index.json (${index.length} templates)`)
