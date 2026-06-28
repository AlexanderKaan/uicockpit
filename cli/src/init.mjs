/**
 * `uicockpit init <hash>` — pull a configured kit into the current project.
 *
 * The hash is the share-key from uicockpit.com (the payload in the app URL and in
 * the hosted `<link>`). The CDN serves the artifacts statelessly from it:
 *   GET /k/<hash>.css            → tokens.css (the full kit)
 *   GET /k/<hash>.contract.json  → the machine-checkable contract for `check`
 *   GET /k/<hash>.rules.md       → the agent rules, written as AGENTS.md
 *   GET /k/<hash>.design.md      → the full spec + recipe catalog, written as design.md
 * So init is a thin fetch-and-write: no engine bundled, the CDN is the source.
 */

const DEFAULT_CDN = 'https://kit.uicockpit.com'

/**
 * Build the brownfield `aliasMap` override block (Phase 3b). Each entry maps a kit
 * token onto a value from the host app, so the kit adopts the existing palette
 * without editing the kit CSS. Append-only: a trailing `:root` wins over the kit's
 * `:root` on equal specificity. A value beginning `--` is wrapped in `var(…)`;
 * anything else (a literal colour, a `var(…)` already, a number) is used verbatim.
 * @param {Record<string,string>} aliasMap
 * @returns {string}  the CSS block, or '' when there is nothing to alias.
 */
export function aliasBlock(aliasMap) {
  const entries = Object.entries(aliasMap || {}).filter(([k]) => /^--[\w-]+$/.test(k))
  if (!entries.length) return ''
  const lines = entries.map(([k, v]) => {
    const val = typeof v === 'string' && v.startsWith('--') ? `var(${v})` : String(v)
    return `  ${k}: ${val};`
  })
  return `\n/* uicockpit.json aliasMap — kit tokens adopt your existing values (brownfield).\n   The referenced custom properties must be defined in your own CSS. */\n:root {\n${lines.join('\n')}\n}\n`
}

async function fetchText(url) {
  let res
  try {
    res = await fetch(url)
  } catch (err) {
    throw new Error(`network error fetching ${url}: ${err.message}`)
  }
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.text()
}

/**
 * @returns {Promise<number>}  0 ok · 2 usage/fetch error
 */
export async function runInit(argv) {
  const { writeFileSync, existsSync, readFileSync } = await import('node:fs')

  const positional = argv.filter((a) => !a.startsWith('--'))
  const hash = positional[0]
  const force = argv.includes('--force')
  // CDN override for local testing: --cdn=… or UICOCKPIT_CDN.
  const cdnFlag = argv.find((a) => a.startsWith('--cdn='))
  const base = (cdnFlag ? cdnFlag.slice('--cdn='.length) : process.env.UICOCKPIT_CDN || DEFAULT_CDN).replace(/\/$/, '')

  if (!hash) {
    console.error('✗ usage: npx uicockpit init <kit-hash> [--force] [--cdn=<url>]')
    console.error('  The hash is the share-key from the "Use this kit" panel at uicockpit.com.')
    return 2
  }

  // An existing uicockpit.json is the apply-point for the brownfield aliasMap: the
  // FIRST init scaffolds it empty, you fill aliasMap, then `init --force` re-applies
  // (appends the overrides to the fetched tokens.css). Malformed → ignore.
  let aliasMap = {}
  if (existsSync('uicockpit.json')) {
    try { aliasMap = JSON.parse(readFileSync('uicockpit.json', 'utf8')).aliasMap || {} }
    catch { /* keep {} */ }
  }
  const aliases = aliasBlock(aliasMap)

  const targets = [
    { file: 'uicockpit.tokens.css', url: `${base}/k/${hash}.css`, append: aliases },
    { file: 'uicockpit.contract.json', url: `${base}/k/${hash}.contract.json` },
    { file: 'AGENTS.md', url: `${base}/k/${hash}.rules.md` },
    { file: 'design.md', url: `${base}/k/${hash}.design.md` },
  ]

  for (const t of targets) {
    if (existsSync(t.file) && !force) {
      console.error(`✗ ${t.file} already exists — pass --force to overwrite.`)
      return 2
    }
  }

  for (const t of targets) {
    let text
    try {
      text = await fetchText(t.url)
    } catch (err) {
      console.error(`✗ ${err.message}`)
      console.error('  Check the kit hash, or your network connection.')
      return 2
    }
    if (t.append) text += t.append
    writeFileSync(t.file, text)
    console.log(`  ✓ wrote ${t.file}${t.append ? ` (+ ${Object.keys(aliasMap).length} aliasMap override${Object.keys(aliasMap).length === 1 ? '' : 's'})` : ''}`)
  }

  // Scaffold the adoption config (the shadcn components.json model). It is local +
  // hand-editable — `check` reads it — so we don't clobber an existing one even on
  // --force (the fetched artifacts above are the kit; this is the user's settings).
  if (!existsSync('uicockpit.json')) {
    const cfg = {
      $schema: 'https://uicockpit.com/uicockpit.schema.json',
      kit: hash,
      prefix: '',
      tokenStrategy: 'css-vars',
      darkStrategy: 'class',
      framework: 'react',
      aliasMap: {},
      allowColors: [],
    }
    writeFileSync('uicockpit.json', JSON.stringify(cfg, null, 2) + '\n')
    console.log('  ✓ wrote uicockpit.json')
  }

  console.log('\nKit installed. Next:')
  console.log('  1. Import uicockpit.tokens.css once at your app root (or use the hosted <link>).')
  console.log('  2. AGENTS.md holds the rules; design.md is the full spec + recipe catalog —')
  console.log('     your coding agent picks them up automatically.')
  console.log('  3. Run  npx uicockpit check  to catch any drift from the contract.')
  console.log('  • uicockpit.json holds adoption settings (allowColors for sanctioned brand')
  console.log('    colours; prefix / aliasMap / framework for brownfield) — check reads it.')
  return 0
}
