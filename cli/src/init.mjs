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

/* The mode hooks are conventions, not recipe classes — never prefix them even if
 * a recipe references them in a selector. */
const PREFIX_SKIP = new Set(['dark', 'light'])

/**
 * Namespace every kit class in the CSS (Phase 3b `prefix`, the shadcn model) to
 * dodge collisions with the host app's own class names. DRIVEN BY the contract's
 * class vocabulary: only a class whose ROOT the kit actually defines is rewritten,
 * so the host's classes, utility classes and the `.dark`/`.light` mode hooks are
 * left untouched. A word boundary stops `.in` matching inside `.inset`.
 * @param {string} css
 * @param {string} prefix       e.g. 'uic-' ('' → no-op)
 * @param {Set<string>} kitRoots  Object.keys(contract.components.classes)
 * @returns {string}
 */
export function prefixCss(css, prefix, kitRoots) {
  if (!prefix || !kitRoots || !kitRoots.size) return css
  return css.replace(/\.(-?[A-Za-z_][\w-]*)/g, (m, cls) => {
    const root = cls.split(/__|--/)[0]
    if (PREFIX_SKIP.has(root) || !kitRoots.has(root)) return m
    return `.${prefix}${cls}`
  })
}

/* ── Agent-docs injection (LP3) ──────────────────────────────────────────────
 * AGENTS.md carries the FULL rules (the file Codex/Cursor read natively). But
 * Claude Code reads CLAUDE.md, and users often already have one — so init also
 * maintains a compact, marker-fenced pointer block inside the agent-doc files
 * that exist (CLAUDE.md · .claude/CLAUDE.md · .cursorrules), creating CLAUDE.md
 * when none exist. Re-running init refreshes ONLY the fenced block; everything
 * the user wrote around it is untouched. */

export const AGENT_DOCS_START = '<!-- UICOCKPIT:START — managed by `npx uicockpit init`; edits inside this block are overwritten -->'
export const AGENT_DOCS_END = '<!-- UICOCKPIT:END -->'

/**
 * The compact agent-context block — a pointer card, not the rules themselves
 * (those live in AGENTS.md / design.md, which stay the single source).
 * @param {string} hash  the kit share-key
 * @returns {string}
 */
export function agentDocsBlock(hash) {
  return `${AGENT_DOCS_START}
## UICockpit design system (kit \`${hash}\`)

This project wears a generated UICockpit design system. Non-negotiables:

- Style ONLY with the kit: \`--k-*\` tokens + the component recipes in \`uicockpit.tokens.css\`.
- Never hardcode a colour, radius, shadow, font-size or spacing — there is a token for it.
- Compose existing recipes before inventing new UI — the catalog lives in \`design.md\`.
- Full rules: \`AGENTS.md\` · machine contract: \`uicockpit.contract.json\` · settings: \`uicockpit.json\`.
- After EVERY UI change run \`npx uicockpit check --strict\` and fix what it flags before you finish.
${AGENT_DOCS_END}`
}

/**
 * Insert or refresh the fenced block in an agent-doc file's text. Pure.
 * @param {string} existing  current file text ('' for a new file)
 * @param {string} block     agentDocsBlock(hash)
 * @returns {string}
 */
export function upsertMarkerBlock(existing, block) {
  const start = existing.indexOf(AGENT_DOCS_START)
  const end = existing.indexOf(AGENT_DOCS_END)
  if (start !== -1 && end !== -1 && end >= start) {
    return existing.slice(0, start) + block + existing.slice(end + AGENT_DOCS_END.length)
  }
  if (!existing.trim()) return block + '\n'
  return existing.replace(/\n*$/, '\n\n') + block + '\n'
}

/** A short banner prepended to AGENTS.md so the agent writes prefixed classes. */
function prefixNote(prefix) {
  return `> **Class prefix:** this kit is installed with the prefix \`${prefix}\`. Write\n> every kit class with it — \`${prefix}btn\`, \`${prefix}card__head\`, \`${prefix}btn--primary\`.\n> The contract and \`uicockpit check\` know the prefix (from uicockpit.json).\n\n`
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

  // An existing uicockpit.json is the apply-point for the brownfield transforms:
  // the FIRST init scaffolds it empty, you fill aliasMap / prefix, then `init
  // --force` re-applies. Malformed → ignore.
  let aliasMap = {}
  let prefix = ''
  if (existsSync('uicockpit.json')) {
    try {
      const cfg = JSON.parse(readFileSync('uicockpit.json', 'utf8'))
      aliasMap = cfg.aliasMap || {}
      prefix = typeof cfg.prefix === 'string' ? cfg.prefix : ''
    } catch { /* keep defaults */ }
  }
  const aliases = aliasBlock(aliasMap)

  const targets = [
    { file: 'uicockpit.tokens.css', url: `${base}/k/${hash}.css` },
    { file: 'uicockpit.contract.json', url: `${base}/k/${hash}.contract.json` },
    { file: 'AGENTS.md', url: `${base}/k/${hash}.rules.md` },
    { file: 'design.md', url: `${base}/k/${hash}.design.md` },
    // Kit-as-code (LP5a): the design DECISIONS as a readable, versionable file —
    // git-diff your design changes; the editor deep-link inside reopens the kit.
    { file: 'uicockpit.kit.json', url: `${base}/k/${hash}.kit.json`, optional: true },
  ]

  for (const t of targets) {
    if (existsSync(t.file) && !force) {
      console.error(`✗ ${t.file} already exists — pass --force to overwrite.`)
      return 2
    }
  }

  // Fetch everything first — the prefix rewrite of the CSS needs the contract's
  // class vocabulary, so we can't write file-by-file. `optional` artifacts (newer
  // CDN routes) degrade gracefully against an older worker instead of failing init.
  const fetched = {}
  for (const t of targets) {
    try {
      fetched[t.file] = await fetchText(t.url)
    } catch (err) {
      if (t.optional) {
        console.error(`  · skipped ${t.file} (${err.message})`)
        continue
      }
      console.error(`✗ ${err.message}`)
      console.error('  Check the kit hash, or your network connection.')
      return 2
    }
  }

  // Kit roots drive a SAFE prefix rewrite (only classes the kit defines).
  let kitRoots = new Set()
  try {
    kitRoots = new Set(Object.keys(JSON.parse(fetched['uicockpit.contract.json']).components?.classes || {}))
  } catch { /* no contract classes → prefix becomes a no-op */ }

  for (const t of targets) {
    if (fetched[t.file] === undefined) continue // optional artifact the CDN doesn't serve yet
    let text = fetched[t.file]
    let note = ''
    if (t.file === 'uicockpit.tokens.css') {
      text = prefixCss(text, prefix, kitRoots) + aliases
      const tags = []
      if (prefix) tags.push(`prefix '${prefix}'`)
      if (Object.keys(aliasMap).length) tags.push(`${Object.keys(aliasMap).length} aliasMap override${Object.keys(aliasMap).length === 1 ? '' : 's'}`)
      if (tags.length) note = ` (+ ${tags.join(', ')})`
    }
    if (t.file === 'AGENTS.md' && prefix) text = prefixNote(prefix) + text
    writeFileSync(t.file, text)
    console.log(`  ✓ wrote ${t.file}${note}`)
  }

  // Agent-docs injection (LP3): maintain the fenced pointer block in every
  // agent-doc file that exists; create CLAUDE.md when none do. Marker-fenced, so
  // a re-run refreshes the block and never touches the user's own content.
  {
    const { mkdirSync } = await import('node:fs')
    const block = agentDocsBlock(hash)
    const candidates = ['CLAUDE.md', '.claude/CLAUDE.md', '.cursorrules']
    let injected = candidates.filter((f) => existsSync(f))
    if (!injected.length) injected = ['CLAUDE.md']
    for (const f of injected) {
      if (f.includes('/')) mkdirSync(f.slice(0, f.lastIndexOf('/')), { recursive: true })
      const existing = existsSync(f) ? readFileSync(f, 'utf8') : ''
      const isUpdate = existing.includes(AGENT_DOCS_START)
      writeFileSync(f, upsertMarkerBlock(existing, block))
      console.log(`  ✓ ${isUpdate ? 'refreshed' : 'wrote'} UICockpit block in ${f}`)
    }
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
  console.log('  3. Run  npx uicockpit check  after every UI change to review drift from the contract.')
  console.log('\n  Make it automatic AND enforcing — as a gate, use --strict so style drift')
  console.log('  (raw hex, off-grid spacing, off-scale radii) fails too, not just broken references:')
  console.log('  • Git pre-commit hook:')
  console.log("      echo 'npx uicockpit check --strict' > .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit")
  console.log('  • Or a CI step (fails the build on drift):  - run: npx uicockpit check --strict')
  console.log('  • uicockpit.json holds adoption settings (allowColors for sanctioned brand')
  console.log('    colours; prefix / aliasMap / framework for brownfield) — check reads it.')
  console.log("  • A deliberate off-system line? Annotate it `/* uicockpit-allow: <reason> */` —")
  console.log('    accepted (never fails, even --strict) but reported as an allowed exception.')
  return 0
}
