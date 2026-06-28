#!/usr/bin/env node
/**
 * `uicockpit` — the CLI for the UICockpit design-system wedge.
 *
 *   npx uicockpit init <hash>   pull a configured kit (tokens.css + contract.json)
 *   npx uicockpit check [dir]   verify a codebase against the kit's contract
 *
 * Zero dependencies — Node ≥18 built-ins only. The check core is pure and lives
 * in src/check.mjs (the cockpit repo re-exports it so there's a single source).
 */
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

function printHelp() {
  console.log(`uicockpit ${pkg.version} — apply and ENFORCE a design system in any codebase.

Usage:
  npx uicockpit init <hash> [--force] [--cdn=<url>]
      Pull a configured kit from uicockpit.com into the current project:
      writes uicockpit.tokens.css + uicockpit.contract.json.

  npx uicockpit check [contract.json] [dir] [--strict]
      Verify the codebase against the kit's contract (the wedge):
      flags unknown tokens, undefined modifiers, raw colours, off-grid spacing.
      Exit 0 = conforms · 1 = violations · 2 = setup error. --strict fails on warnings.

  npx uicockpit help | --version

Docs: https://uicockpit.com`)
}

const [, , cmd, ...rest] = process.argv

async function main() {
  switch (cmd) {
    case 'check': {
      const { runCheck } = await import(new URL('../src/check.mjs', import.meta.url))
      return runCheck(rest)
    }
    case 'init': {
      const { runInit } = await import(new URL('../src/init.mjs', import.meta.url))
      return runInit(rest)
    }
    case 'version':
    case '-v':
    case '--version':
      console.log(pkg.version)
      return 0
    case undefined:
    case 'help':
    case '-h':
    case '--help':
      printHelp()
      return 0
    default:
      console.error(`unknown command: ${cmd}\n`)
      printHelp()
      return 2
  }
}

main().then((code) => process.exit(code ?? 0)).catch((err) => {
  console.error(`✗ ${err?.stack || err}`)
  process.exit(2)
})
