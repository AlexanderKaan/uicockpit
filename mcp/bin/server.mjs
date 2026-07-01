#!/usr/bin/env node
/**
 * uicockpit-mcp — the Model Context Protocol server for UICockpit.
 *
 * Gives an AI agent (Claude, Cursor, Windsurf, …) the design-system wedge natively:
 *   • create_kit         — generate a kit from a brief (brand/radius/density) — no GUI
 *   • install_kit        — pull a configured kit (tokens.css + contract.json)
 *   • get_design_context — read the kit's tokens + rules to build on-system
 *   • check_conformance  — verify the code conforms to the contract (the moat)
 *
 * The verifier core is the published `uicockpit` package (single source); kit
 * content comes from the CDN (stateless over the share-hash). stdio transport.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { scanAndCheck } from 'uicockpit/check'
import { CDN, contractUrl, cssUrl, fetchText, linkSnippet, designContext } from '../src/kit.mjs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

const text = (t) => ({ content: [{ type: 'text', text: t }] })
const errText = (t) => ({ content: [{ type: 'text', text: t }], isError: true })

const server = new McpServer({ name: 'uicockpit', version: pkg.version })

/* ── create_kit ────────────────────────────────────────────────────────────── */
server.registerTool(
  'create_kit',
  {
    title: 'Create a UICockpit kit from a brief',
    description:
      'Generate a coherent design-system kit from a short brief (brand colour, radius, density) — ' +
      'no GUI, no hash to hunt for. Returns the kit hash + hosted token/contract/rules URLs. Reach ' +
      'for this when the user wants their UI to look designed / on-brand / consistent, or asks for a ' +
      'design system, theme, or tokens, and there is no uicockpit kit in the project yet. Then call ' +
      'install_kit with the returned hash to write it in.',
    inputSchema: {
      brand: z
        .string()
        .optional()
        .describe('A theme id (cobalt · sky · teal · jade · indigo · violet · coral · rose · ember · mono) OR a #hex brand colour. Default: cobalt.'),
      radius: z.enum(['none', 'subtle', 'soft', 'round']).optional().describe('Corner radius. Default: soft.'),
      density: z.enum(['compact', 'default', 'comfortable']).optional().describe('Interface size + density. Default: default.'),
      buttonShape: z.enum(['match', 'none', 'subtle', 'soft', 'round', 'pill']).optional().describe('Button corner shape. Default: match (follows radius).'),
      icons: z.enum(['hairline', 'line', 'rounded', 'bold', 'solid']).optional().describe('Icon style. Default: line.'),
    },
  },
  async (params) => {
    const q = new URLSearchParams()
    for (const key of ['brand', 'radius', 'density', 'buttonShape', 'icons']) {
      if (params[key]) q.set(key, params[key])
    }
    const qs = q.toString()
    let kit
    try {
      kit = JSON.parse(await fetchText(`${CDN}/new${qs ? `?${qs}` : ''}`))
    } catch (err) {
      return errText(`Could not create the kit: ${err.message}. Check the params and network.`)
    }
    return text(
      `Created a kit (hash ${kit.hash}):\n` +
        `  • tokens.css:  ${kit.css}\n` +
        `  • contract:    ${kit.contract}\n` +
        `  • rules:       ${kit.rules}\n` +
        `  • open / tweak in the configurator:  ${kit.editor}\n\n` +
        `Next: call install_kit with hash "${kit.hash}" to write it into the project, then ` +
        `get_design_context to build on it, and check_conformance after every UI edit.`,
    )
  },
)

/* ── install_kit ───────────────────────────────────────────────────────────── */
server.registerTool(
  'install_kit',
  {
    title: 'Install a UICockpit kit',
    description:
      'Pull a configured design-system kit into the project: writes uicockpit.tokens.css ' +
      '(the full kit) and uicockpit.contract.json (for check_conformance). The hash is the ' +
      'share-key from the "Use this kit" panel at uicockpit.com.',
    inputSchema: {
      hash: z.string().describe('The kit share-hash from uicockpit.com.'),
      path: z.string().optional().describe('Project directory to write into (default: cwd).'),
      force: z.boolean().optional().describe('Overwrite existing files (default: false).'),
    },
  },
  async ({ hash, path, force }) => {
    const dir = path || process.cwd()
    const targets = [
      { file: 'uicockpit.tokens.css', url: cssUrl(hash) },
      { file: 'uicockpit.contract.json', url: contractUrl(hash) },
    ]
    for (const t of targets) {
      if (existsSync(join(dir, t.file)) && !force) {
        return errText(`${t.file} already exists in ${dir}. Pass force: true to overwrite.`)
      }
    }
    try {
      for (const t of targets) writeFileSync(join(dir, t.file), await fetchText(t.url))
    } catch (err) {
      return errText(`Could not install kit: ${err.message}. Check the hash and network.`)
    }
    return text(
      `Installed kit ${hash} into ${dir}:\n` +
        `  • uicockpit.tokens.css — import once at your app root, or use ${linkSnippet(hash)}\n` +
        `  • uicockpit.contract.json — read by check_conformance\n\n` +
        `Next: call get_design_context to see the tokens + rules, build with the --k-* tokens, ` +
        `then call check_conformance to verify.`,
    )
  },
)

/* ── get_design_context ───────────────────────────────────────────────────── */
server.registerTool(
  'get_design_context',
  {
    title: 'Read the design system',
    description:
      "Return a compact briefing of the kit's tokens, rules and component classes so you can " +
      'build on-system without loading the full CSS. Uses the local uicockpit.contract.json by ' +
      'default, or a kit hash if given.',
    inputSchema: {
      hash: z.string().optional().describe('Kit hash; if omitted, reads the local uicockpit.contract.json.'),
      path: z.string().optional().describe('Project directory holding the local contract (default: cwd).'),
    },
  },
  async ({ hash, path }) => {
    let contract
    if (hash) {
      try {
        contract = JSON.parse(await fetchText(contractUrl(hash)))
      } catch (err) {
        return errText(`Could not fetch the kit contract: ${err.message}.`)
      }
    } else {
      const file = join(path || process.cwd(), 'uicockpit.contract.json')
      if (!existsSync(file)) {
        return errText(
          'No uicockpit.contract.json found. Pass a kit `hash`, or run install_kit first.',
        )
      }
      try {
        contract = JSON.parse(readFileSync(file, 'utf8'))
      } catch (err) {
        return errText(`Could not read ${file}: ${err.message}.`)
      }
    }
    return text(designContext(contract, hash || null))
  },
)

/* ── check_conformance ────────────────────────────────────────────────────── */
server.registerTool(
  'check_conformance',
  {
    title: 'Check design-system conformance',
    description:
      'Verify the codebase against the kit contract (the wedge): flags unknown tokens, undefined ' +
      'component modifiers, raw colours, off-grid spacing, and non-token radii/font-sizes. Run this ' +
      'after writing or editing UI to catch drift from the design system.',
    inputSchema: {
      path: z.string().optional().describe('Directory to scan (default: cwd).'),
      strict: z.boolean().optional().describe('Treat warnings as failures too (default: false).'),
    },
  },
  async ({ path, strict }) => {
    const res = await scanAndCheck({ dir: path || process.cwd() })
    if (!res.ok) {
      if (res.error === 'no-contract') {
        return errText(
          'No uicockpit.contract.json found to check against. Run install_kit first (or pass a path to one).',
        )
      }
      return errText(`Could not run check: ${res.error}`)
    }
    const lines = res.violations.map(
      (v) => `  ${v.severity === 'error' ? 'ERROR' : 'warn '}  ${v.file}:${v.line}  [${v.check}]  ${v.message}`,
    )
    const failed = res.errors.length || (strict && res.warns.length)
    const head = `uicockpit check — ${res.kit}: scanned ${res.fileCount} files\n${res.errors.length} error · ${res.warns.length} warn`
    const verdict = failed
      ? `\n\n✗ ${res.errors.length + (strict ? res.warns.length : 0)} violation(s) — fix these so the UI stays on-system.`
      : res.warns.length
        ? `\n\n✓ no errors · ${res.warns.length} warning${res.warns.length === 1 ? '' : 's'} to review (set strict to enforce).`
        : '\n\n✓ conforms to the design contract.'
    return text((lines.length ? lines.join('\n') + '\n\n' : '') + head + verdict)
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
