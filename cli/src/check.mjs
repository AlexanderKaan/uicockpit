/**
 * `uicockpit check` — the contract verifier (the wedge).
 *
 * THE differentiator: nobody (incl. shadcn) ships this. It reads a kit's
 * `contract.json` and an arbitrary codebase, and reports where the code drifts
 * from the design contract — with a CI exit code. This makes "agent-enforceable"
 * literal: generate → apply → **check**.
 *
 * `checkContract(contract, files)` is a pure function (unit-tested in the cockpit
 * repo, which re-exports it from here). `runCheck(argv, cwd)` is the thin CLI
 * shell over it (file discovery + reporting + exit code).
 */

/* The 4px design grid — spacing literals must land on it (or use --k-s-*). */
const GRID = 4

/** Run the machine-checkable contract rules against a set of files.
 * @param {object} contract  parsed contract.json (from genContract)
 * @param {{path:string, content:string}[]} files
 * @param {object} [config]  parsed uicockpit.json (adoption config) — optional.
 *   Recognised here: `allowColors` (string[]) — literal colours sanctioned as a
 *   deliberate foreign-brand escape hatch, exempt from no-raw-color.
 * @returns {{check:string, severity:string, file:string, line:number, message:string}[]}
 */
export function checkContract(contract, files, config = {}) {
  const violations = []
  const tokenSet = new Set(Object.keys(contract.tokens || {}))
  const classes = contract.components?.classes || {}
  const compositions = contract.compositions || {}
  // Sanctioned foreign-brand colours (e.g. a partner logo) — normalised so the
  // declared list compares against the literal the regex catches.
  const normColor = (c) => c.replace(/\s+/g, '').toLowerCase()
  const allowColors = new Set((config.allowColors || []).map(normColor))
  // Class prefix (uicockpit.json) — kit classes are written `<prefix>btn` in this
  // codebase. Strip it before vocabulary lookups so the kit-class checks still fire.
  const prefix = typeof config.prefix === 'string' ? config.prefix : ''
  const rxPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const ruleBy = {}
  for (const r of contract.rules || []) if (r.check) ruleBy[r.check] = r
  const sev = (check) => ruleBy[check]?.severity || 'warn'
  const add = (check, file, line, message, allow = null) => {
    if (!ruleBy[check]) return // rule not in this contract → skip
    const v = { check, severity: sev(check), file, line, message }
    // Sanctioned escape hatch (LP7): the finding is ACCEPTED but stays visible —
    // reported under "allowed exceptions", never silently dropped.
    if (allow) { v.allowed = true; v.reason = allow.reason }
    violations.push(v)
  }

  // `/* uicockpit-allow: <reason> */` on a line sanctions that line's STYLE-drift
  // findings (the warn-level taste checks: raw colour, off-grid spacing, radius/
  // font-size scale). It deliberately does NOT cover the error-level reference
  // checks (tokens-exist, known-modifiers) — a broken reference is a bug, not a
  // taste decision. The legacy `uicockpit-allow-color` tag keeps its old
  // colour-only, silent behaviour. Negative lookahead keeps the two apart.
  const ALLOW_RX = /uicockpit-allow(?!-color)\b(?:\s*:\s*([^*\r\n]*?))?\s*(?:\*\/|$)/
  const allowTag = (text) => {
    const m = text.match(ALLOW_RX)
    return m ? { reason: (m[1] || '').trim() || '(no reason given)' } : null
  }

  // Cold-start guard — track whether the kit stylesheet is imported anywhere and
  // where the kit is first USED, so we can warn when usage exists but the import
  // is missing (the #1 cold-start failure: kit classes render as unstyled boxes).
  let importSeen = false
  let firstUsage = null

  for (const { path, content } of files) {
    const isCss = /\.(css|scss|less)$/.test(path)
    if (!importSeen && (content.includes('uicockpit.tokens.css') || content.includes('kit.uicockpit.com'))) importSeen = true
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i]
      const ln = i + 1
      // A custom-property DEFINITION line (`--k-foo: …` / `--foo: …`) is the
      // token source, not a usage — exempt it from the colour/scale checks.
      const isDef = /^\s*--[\w-]+\s*:/.test(text)

      // tokens-exist (error) — every var(--k-*) must resolve to a contract token.
      for (const m of text.matchAll(/var\(\s*(--k-[\w-]+)/g)) {
        if (!firstUsage && !isDef) firstUsage = { path, line: ln }
        if (!tokenSet.has(m[1])) add('tokens-exist', path, ln, `var(${m[1]}) is not a token in this contract`)
      }

      // known-modifiers (error) — a kit class `root--modifier` must use a
      // modifier the contract defines for that root. Consumer-owned classes
      // (unknown root) are ignored — this only polices the kit's own vocabulary.
      for (const m of text.matchAll(/class(?:Name)?\s*=\s*["'`]([^"'`]+)["'`]/g)) {
        for (const raw of m[1].split(/\s+/)) {
          if (!raw) continue
          // Strip the configured prefix before reading the kit vocabulary.
          const cls = prefix && raw.startsWith(prefix) ? raw.slice(prefix.length) : raw
          const root = cls.split('--')[0].split('__')[0]
          const def = classes[root]
          if (!def) continue // not a kit root → consumer's own class
          if (!firstUsage) firstUsage = { path, line: ln } // a kit class is in use
          const dd = cls.indexOf('--')
          if (dd === -1) continue // no modifier → nothing more to police
          const mod = cls.slice(dd + 2)
          if (!def.modifiers.includes(mod)) {
            add('known-modifiers', path, ln, `.${raw}: '${mod}' is not a defined modifier of .${prefix}${root}`)
          }
        }
      }

      if (!isCss || isDef) continue

      // The line-level escape hatches, resolved once per line.
      const allow = allowTag(text)
      const allowColorLine = text.includes('uicockpit-allow-color')

      // no-raw-color (warn) — prefer --k-* colour tokens over raw literals.
      // Escape hatches: a sanctioned colour (uicockpit.json `allowColors`) or the
      // legacy `uicockpit-allow-color` tag skip silently (deliberate foreign brand
      // value); the generic `uicockpit-allow: <reason>` records an allowed exception.
      for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g)) {
        if (allowColorLine || allowColors.has(normColor(m[0]))) continue
        add('no-raw-color', path, ln, `raw colour ${m[0]} — use a --k-* colour token`, allow)
      }
      // spacing-grid (warn) — margin/padding/gap px literals on the 4px grid.
      for (const m of text.matchAll(/\b(margin|padding|gap|row-gap|column-gap)\b[^;:]*:\s*([^;]+);/gi)) {
        for (const px of m[2].matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
          const n = Math.abs(parseFloat(px[1]))
          if (n > 0 && n % GRID !== 0) add('spacing-grid', path, ln, `${m[1]}: ${px[0]} is off the ${GRID}px grid — use a --k-s-* token`, allow)
        }
      }
      // radius-scale (warn) — border-radius should use --k-radius-* tokens.
      for (const m of text.matchAll(/border-radius\s*:\s*([^;]+);/gi)) {
        if (/\d+px/.test(m[1]) && !/var\(/.test(m[1])) add('radius-scale', path, ln, `border-radius: ${m[1].trim()} — use a --k-radius-* token`, allow)
      }
      // font-size-scale (warn) — font-size should use the --k-type-* scale.
      for (const m of text.matchAll(/font-size\s*:\s*([^;]+);/gi)) {
        if (/\d+px/.test(m[1]) && !/var\(/.test(m[1])) add('font-size-scale', path, ln, `font-size: ${m[1].trim()} — use a --k-type-* token`, allow)
      }
    }

    // composition-reroll (warn) — the moat hole: a CSS rule that REBUILDS a named
    // composition utility (.eyebrow, .metric, .icon-tile …) from the right tokens
    // passes every atom-level rule yet is a silent second version of the bundle.
    // Fingerprint each leaf rule against the contract's composition signatures.
    if (isCss && ruleBy['composition-reroll']) {
      // Blank out CSS comments (keeping newlines so line numbers stay true) — else
      // a `/* … */` block attaches to the next selector and skews the match.
      const scan = content.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
      for (const m of scan.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
        const selector = m[1].trim()
        if (!selector || selector.startsWith('@') || selector.startsWith('--')) continue
        // Normalise this rule's declarations the same way the signatures were built.
        const decls = new Set()
        for (const d of m[2].split(';')) {
          const c = d.indexOf(':')
          if (c === -1) continue
          const prop = d.slice(0, c).trim().toLowerCase()
          const val = d.slice(c + 1).trim()
          if (prop && val) decls.add(`${prop}:${val.replace(/\s+/g, '').toLowerCase()}`)
        }
        if (!decls.size) continue
        for (const [cls, spec] of Object.entries(compositions)) {
          // A rule that targets the bundle's OWN class is a legit override, not a
          // re-roll — skip it (e.g. `.eyebrow { … }`, `.card .eyebrow { … }`).
          // The prefix is optional so a prefixed override (`.uic-eyebrow`) is caught too.
          if (new RegExp(`\\.(?:${rxPrefix})?${cls}(?![\\w-])`).test(selector)) continue
          let hits = 0
          for (const s of spec.signature) if (decls.has(s)) hits++
          if (hits >= spec.minMatch) {
            // Anchor on the `{` (end of selector), not the match start — the
            // match swallows any blanked leading comment/whitespace.
            const line = scan.slice(0, m.index + m[1].length).split('\n').length
            add('composition-reroll', path, line,
              `'${selector}' re-implements the .${prefix}${cls} composition utility (${hits}/${spec.signature.length} of its declarations) — use the .${prefix}${cls} class instead of rebuilding the bundle`)
            break // one composition warning per rule is enough
          }
        }
      }
    }
  }

  // tokens-imported (warn) — kit is used but its stylesheet is imported nowhere.
  // One run-level warning, anchored at the first usage so it points somewhere real.
  if (firstUsage && !importSeen) {
    add('tokens-imported', firstUsage.path, firstUsage.line,
      'kit tokens/classes are used but the kit stylesheet is imported nowhere — import uicockpit.tokens.css once at your app root (or add the hosted kit.uicockpit.com <link>), or it all renders unstyled')
  }

  return violations
}

/* ─────────────────────────── CLI runner ─────────────────────────── */

const SCAN_EXT = /\.(css|scss|less|html|jsx|tsx|vue|svelte|astro)$/
const SKIP_DIR = /(^|[/\\])(node_modules|\.git|dist|build|\.next|out|coverage)([/\\]|$)/
// The kit's OWN emitted files are the source of truth, not consumer code: the
// tokens.css carries component override-hooks (var(--k-btn-h) …) that are
// deliberately undefined slots, so linting it would flood false positives. Skip
// the files `uicockpit init` writes (and any contract.json) — we check the code
// the user/agent wrote against the kit, never the kit itself.
const SKIP_FILE = /(^|[/\\])uicockpit\.tokens\.css$|\.contract\.json$/

/** Find the contract file: an explicit `*.contract.json` positional, else the
 *  conventional `uicockpit.contract.json` in the target dir or cwd. */
function findContract(explicit, dir, fs, pathMod) {
  if (explicit) return explicit
  const candidates = [pathMod.join(dir, 'uicockpit.contract.json'), 'uicockpit.contract.json']
  for (const c of candidates) if (fs.existsSync(c)) return c
  return null
}

/** Load the optional adoption config (`uicockpit.json`, the shadcn components.json
 *  model). Absent or malformed → {} (the verifier runs with its defaults). */
function loadConfig(dir, fs, pathMod) {
  for (const c of [pathMod.join(dir, 'uicockpit.json'), 'uicockpit.json']) {
    try {
      if (fs.existsSync(c)) return JSON.parse(fs.readFileSync(c, 'utf8'))
    } catch { /* malformed → ignore, fall through to defaults */ }
  }
  return {}
}

/**
 * Discover a contract + the scannable files under `dir`, run the contract, and
 * return a STRUCTURED result (no printing). Shared by the CLI runner and the MCP
 * server so the verifier behaves identically everywhere (incl. the kit-file skip).
 * @param {{dir?: string, contractPath?: string|null}} opts
 * @returns {Promise<{ok: boolean, error?: string, contractPath?: string, kit?: string,
 *   fileCount?: number, violations?: object[], errors?: object[], warns?: object[]}>}
 */
export async function scanAndCheck({ dir = '.', contractPath = null } = {}) {
  const fs = await import('node:fs')
  const pathMod = await import('node:path')
  const { readFileSync, readdirSync, statSync } = fs

  const resolved = findContract(contractPath, dir, fs, pathMod)
  if (!resolved) {
    return { ok: false, error: 'no-contract' }
  }

  let contract
  try {
    contract = JSON.parse(readFileSync(resolved, 'utf8'))
  } catch (err) {
    return { ok: false, error: `bad-contract: ${err.message}`, contractPath: resolved }
  }

  const files = []
  const walk = (d) => {
    let entries
    try { entries = readdirSync(d) } catch { return }
    for (const name of entries) {
      const p = pathMod.join(d, name)
      if (SKIP_DIR.test(p)) continue
      let st
      try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) walk(p)
      else if (SCAN_EXT.test(p) && !SKIP_FILE.test(p)) files.push({ path: p, content: readFileSync(p, 'utf8') })
    }
  }
  walk(dir)

  const config = loadConfig(dir, fs, pathMod)
  const violations = checkContract(contract, files, config)
  // Allowed exceptions (LP7, `uicockpit-allow: <reason>`) are accepted — they never
  // gate — but stay visible as their own bucket so the exceptions list reads as a
  // living feature-gap radar, not a silent hole in the contract.
  return {
    ok: true,
    contractPath: resolved,
    kit: contract.name || 'kit',
    fileCount: files.length,
    violations,
    errors: violations.filter((v) => v.severity === 'error' && !v.allowed),
    warns: violations.filter((v) => v.severity === 'warn' && !v.allowed),
    allowed: violations.filter((v) => v.allowed),
  }
}

/**
 * `uicockpit check [contract.json] [dir] [--strict]` — discover files, run the
 * contract, print violations, return the process exit code.
 * @returns {Promise<number>}  0 conforms · 1 violations · 2 usage/contract error
 */
export async function runCheck(argv) {
  const strict = argv.includes('--strict')
  const positional = argv.filter((a) => !a.startsWith('--'))
  // A `.json` positional is the contract; anything else is the target dir.
  const explicitContract = positional.find((a) => a.endsWith('.json')) || null
  const targetDir = positional.find((a) => !a.endsWith('.json')) || '.'

  const res = await scanAndCheck({ dir: targetDir, contractPath: explicitContract })
  if (!res.ok) {
    if (res.error === 'no-contract') {
      console.error('✗ no contract found.')
      console.error('  Expected uicockpit.contract.json at your repo root.')
      console.error('  Get one with:  npx uicockpit init <kit-hash>')
      console.error('  …or export it from the "Use this kit" panel at uicockpit.com.')
    } else {
      console.error(`✗ ${res.error}`)
    }
    return 2
  }

  for (const v of res.violations) {
    if (v.allowed) continue // reported in their own section below
    const tag = v.severity === 'error' ? 'ERROR' : 'warn '
    console.log(`  ${tag}  ${v.file}:${v.line}  [${v.check}]  ${v.message}`)
  }
  if (res.allowed.length) {
    console.log(`\n  Allowed exceptions (uicockpit-allow) — accepted, kept visible:`)
    for (const v of res.allowed) {
      console.log(`  allow  ${v.file}:${v.line}  [${v.check}]  ${v.message} — ${v.reason}`)
    }
  }
  console.log(`\nuicockpit check — ${res.kit}: scanned ${res.fileCount} files`)
  console.log(`${res.errors.length} error · ${res.warns.length} warn${res.allowed.length ? ` · ${res.allowed.length} allowed` : ''}`)

  if (res.errors.length || (strict && res.warns.length)) {
    console.log(`✗ ${res.errors.length + (strict ? res.warns.length : 0)} violation(s) of your design contract`)
    return 1
  }
  if (res.warns.length) {
    // Honest: no hard violations, but don't claim full conformance over warnings.
    console.log(`✓ no errors · ${res.warns.length} warning${res.warns.length === 1 ? '' : 's'} to review (--strict to enforce)`)
  } else {
    console.log('✓ conforms to the design contract')
  }
  return 0
}
