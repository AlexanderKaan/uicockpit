#!/usr/bin/env node
/**
 * Fase D4 — `uicockpit check`, the verifier (the wedge).
 *
 * THE differentiator: nobody (incl. shadcn) ships this. It reads a kit's
 * `contract.json` (Fase D1) and an arbitrary codebase, and reports where the code
 * drifts from the design contract — with a CI exit code. This makes
 * "agent-enforceable" literal: generate → apply → **check**.
 *
 * The core `checkContract(contract, files)` is a pure function (unit-tested);
 * the CLI below is a thin shell over it (file discovery + reporting + exit code).
 *
 *   node scripts/uicockpit-check.mjs [contract.json] [dir]
 *   node scripts/uicockpit-check.mjs --strict   # warnings also fail CI
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

/* ─────────────────────────── CLI ─────────────────────────── */

const isMain = (() => {
  try { return import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('uicockpit-check.mjs') }
  catch { return false }
})()

if (isMain) {
  const { readFileSync, readdirSync, statSync, existsSync } = await import('node:fs')
  const { join } = await import('node:path')

  const argv = process.argv.slice(2)
  const strict = argv.includes('--strict')
  const positional = argv.filter((a) => !a.startsWith('--'))
  const contractPath = positional[0] || 'uicockpit.contract.json'
  const targetDir = positional[1] || '.'

  if (!existsSync(contractPath)) {
    console.error(`✗ contract not found: ${contractPath}\n  Export one from uicockpit.com (the contract.json tab) and place it at your repo root.`)
    process.exit(2)
  }

  const contract = JSON.parse(readFileSync(contractPath, 'utf8'))

  const SCAN_EXT = /\.(css|scss|less|html|jsx|tsx|vue|svelte|astro)$/
  const SKIP_DIR = /(^|\/)(node_modules|\.git|dist|build|\.next|out|coverage)(\/|$)/
  const files = []
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (SKIP_DIR.test(p)) continue
      const st = statSync(p)
      if (st.isDirectory()) walk(p)
      else if (SCAN_EXT.test(p)) files.push({ path: p, content: readFileSync(p, 'utf8') })
    }
  }
  walk(targetDir)

  const violations = checkContract(contract, files)
  const errors = violations.filter((v) => v.severity === 'error')
  const warns = violations.filter((v) => v.severity === 'warn')

  for (const v of violations) {
    const tag = v.severity === 'error' ? 'ERROR' : 'warn '
    console.log(`  ${tag}  ${v.file}:${v.line}  [${v.check}]  ${v.message}`)
  }
  const kit = contract.name || 'kit'
  console.log(`\nuicockpit check — ${kit}: scanned ${files.length} files`)
  console.log(`${errors.length} error · ${warns.length} warn`)

  if (errors.length || (strict && warns.length)) {
    console.log(`✗ ${errors.length + (strict ? warns.length : 0)} violation(s) of your design contract`)
    process.exit(1)
  }
  console.log('✓ conforms to the design contract')
  process.exit(0)
}
