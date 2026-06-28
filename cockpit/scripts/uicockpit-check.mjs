#!/usr/bin/env node
/**
 * Dogfood entry for `uicockpit check` (Fase D4 — the wedge).
 *
 * The verifier core now lives in the publishable `uicockpit` CLI package at the
 * repo root (`/cli`), so there is a SINGLE source. This file re-exports the pure
 * `checkContract` (the vitest suite in src/check imports it from here) and
 * delegates the runnable CLI to the package's `runCheck`.
 */
export { checkContract, runCheck, scanAndCheck } from '../../cli/src/check.mjs'

import { runCheck } from '../../cli/src/check.mjs'

const isMain = (() => {
  try { return import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('uicockpit-check.mjs') }
  catch { return false }
})()

if (isMain) {
  process.exit(await runCheck(process.argv.slice(2)))
}
