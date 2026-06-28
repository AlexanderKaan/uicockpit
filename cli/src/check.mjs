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
 * @returns {{check:string, severity:string, file:string, line:number, message:string}[]}
 */
export function checkContract(contract, files) {
  const violations = []
  const tokenSet = new Set(Object.keys(contract.tokens || {}))
  const classes = contract.components?.classes || {}
  const ruleBy = {}
  for (const r of contract.rules || []) if (r.check) ruleBy[r.check] = r
  const sev = (check) => ruleBy[check]?.severity || 'warn'
  const add = (check, file, line, message) => {
    if (!ruleBy[check]) return // rule not in this contract → skip
    violations.push({ check, severity: sev(check), file, line, message })
  }

  for (const { path, content } of files) {
    const isCss = /\.(css|scss|less)$/.test(path)
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i]
      const ln = i + 1
      // A custom-property DEFINITION line (`--k-foo: …` / `--foo: …`) is the
      // token source, not a usage — exempt it from the colour/scale checks.
      const isDef = /^\s*--[\w-]+\s*:/.test(text)

      // tokens-exist (error) — every var(--k-*) must resolve to a contract token.
      for (const m of text.matchAll(/var\(\s*(--k-[\w-]+)/g)) {
        if (!tokenSet.has(m[1])) add('tokens-exist', path, ln, `var(${m[1]}) is not a token in this contract`)
      }

      // known-modifiers (error) — a kit class `root--modifier` must use a
      // modifier the contract defines for that root. Consumer-owned classes
      // (unknown root) are ignored — this only polices the kit's own vocabulary.
      for (const m of text.matchAll(/class(?:Name)?\s*=\s*["'`]([^"'`]+)["'`]/g)) {
        for (const cls of m[1].split(/\s+/)) {
          const dd = cls.indexOf('--')
          if (dd === -1) continue
          const base = cls.slice(0, dd)
          const mod = cls.slice(dd + 2)
          const uu = base.indexOf('__')
          const root = uu === -1 ? base : base.slice(0, uu)
          const def = classes[root]
          if (!def) continue // not a kit root → consumer's own class
          if (!def.modifiers.includes(mod)) {
            add('known-modifiers', path, ln, `.${cls}: '${mod}' is not a defined modifier of .${root}`)
          }
        }
      }

      if (!isCss || isDef) continue

      // no-raw-color (warn) — prefer --k-* colour tokens over raw literals.
      for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g)) {
        add('no-raw-color', path, ln, `raw colour ${m[0]} — use a --k-* colour token`)
      }
      // spacing-grid (warn) — margin/padding/gap px literals on the 4px grid.
      for (const m of text.matchAll(/\b(margin|padding|gap|row-gap|column-gap)\b[^;:]*:\s*([^;]+);/gi)) {
        for (const px of m[2].matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
          const n = Math.abs(parseFloat(px[1]))
          if (n > 0 && n % GRID !== 0) add('spacing-grid', path, ln, `${m[1]}: ${px[0]} is off the ${GRID}px grid — use a --k-s-* token`)
        }
      }
      // radius-scale (warn) — border-radius should use --k-radius-* tokens.
      for (const m of text.matchAll(/border-radius\s*:\s*([^;]+);/gi)) {
        if (/\d+px/.test(m[1]) && !/var\(/.test(m[1])) add('radius-scale', path, ln, `border-radius: ${m[1].trim()} — use a --k-radius-* token`)
      }
      // font-size-scale (warn) — font-size should use the --k-type-* scale.
      for (const m of text.matchAll(/font-size\s*:\s*([^;]+);/gi)) {
        if (/\d+px/.test(m[1]) && !/var\(/.test(m[1])) add('font-size-scale', path, ln, `font-size: ${m[1].trim()} — use a --k-type-* token`)
      }
    }
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

  const violations = checkContract(contract, files)
  return {
    ok: true,
    contractPath: resolved,
    kit: contract.name || 'kit',
    fileCount: files.length,
    violations,
    errors: violations.filter((v) => v.severity === 'error'),
    warns: violations.filter((v) => v.severity === 'warn'),
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
    const tag = v.severity === 'error' ? 'ERROR' : 'warn '
    console.log(`  ${tag}  ${v.file}:${v.line}  [${v.check}]  ${v.message}`)
  }
  console.log(`\nuicockpit check — ${res.kit}: scanned ${res.fileCount} files`)
  console.log(`${res.errors.length} error · ${res.warns.length} warn`)

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
