#!/usr/bin/env node
/**
 * gen-agent-pack.mjs — emit the agent-facing pack that MCP `get_design_context`
 * serves (the GRAMMAR pack: tokens + the BEM parts + the Composition rules + the
 * intent routing). This is the INPUT to the `uikit-dumb-build` test: hand ONLY this
 * file to a taste-free, pack-only builder and measure how much it determines.
 *
 * Single source: it runs the real `genContract` (cockpit) → the real `designContext`
 * (mcp), so the pack is byte-identical to what a consumer-agent actually receives.
 *
 * Usage (from cockpit/):  npx vite-node scripts/gen-agent-pack.mjs <out-file>
 */
import { writeFileSync } from 'node:fs'
import { genContract } from '../src/export/genContract.ts'
import { DEFAULT_CONFIG } from '../src/tokens/defaults.ts'
import { designContext } from '../../mcp/src/kit.mjs'

const out = process.argv[2]
if (!out) {
  console.error('usage: npx vite-node scripts/gen-agent-pack.mjs <out-file>')
  process.exit(2)
}
const contract = JSON.parse(genContract(DEFAULT_CONFIG))
const pack = designContext(contract, 'demo')
writeFileSync(out, pack)
console.log(`wrote ${out} (${pack.length} chars · ${Object.keys(contract.tokens).length} tokens · ${Object.keys(contract.components.classes).length} component roots)`)
