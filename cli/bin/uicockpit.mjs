#!/usr/bin/env node
/**
 * `uicockpit` — the CLI for the UICockpit design-system wedge.
 *
 *   npx uicockpit init <hash>   pull a configured kit (tokens.css + contract.json)
 *   npx uicockpit check [dir]   verify a codebase against the kit's contract
 *   npx uicockpit forge "…"     may this component exist? — the four-layer derivation, pointed at a sentence
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

  npx uicockpit audit [dir] [--json] [--profile=internal|product] [--no-report]
      For a codebase that has NO kit yet: derive the design system your code
      already implies, and score how far it sits from its own system.
      Writes .uicockpit/audit.html — everything stays on your machine.

  npx uicockpit forge "<describe a component>" [--json]
      Ask whether a component may exist before building it. Resolves the
      sentence against the four catalogues the kit is derived from (HTML ·
      WAI-ARIA APG · Open UI · GOV.UK/USWDS/NL) and answers with a citation:
      EXISTS (here is ours, its contract and page) · PLATFORM (use the element,
      the floor styles it) · MAY EXIST (what it owes + a scaffold) · LOCAL
      EXTENSION · DECIDED NOT TO · NO. Exit 0 = have it / may build · 1 = refused.

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
    case 'audit': {
      const { runAudit } = await import(new URL('../src/audit.mjs', import.meta.url))
      return runAudit(rest)
    }
    case 'forge': {
      const { runForge } = await import(new URL('../src/forge.mjs', import.meta.url))
      return runForge(rest)
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

/* exitCode, never process.exit(): a `--json` report is larger than the 64KB a
 * pipe takes synchronously, and process.exit() after console.log truncated it
 * at exactly 65536 bytes for anyone reading us through execFile — the bench,
 * the MCP server. Let the loop drain; nothing keeps it alive. */
main().then((code) => { process.exitCode = code ?? 0 }).catch((err) => {
  console.error(`✗ ${err?.stack || err}`)
  process.exitCode = 2
})
