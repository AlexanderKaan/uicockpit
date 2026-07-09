# uicockpit-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives an
AI agent (Claude, Cursor, Windsurf, Claude Code, …) the [UIcockpit](https://uicockpit.com)
design-system wedge natively: **create or install a kit, read its design context, and
verify the agent's output conforms** — generate → apply → **check**, without copy-paste.

## Tools

| Tool | What it does |
|---|---|
| `create_kit` | Generates a coherent kit from a short brief (brand colour, radius, density, button shape, icon style) — no GUI, no hash to hunt for. Returns the kit `hash` + hosted token/contract/rules URLs. Reach for it when the user wants their UI to look designed / on-brand and there's no kit in the project yet. |
| `install_kit` | Pulls a configured kit into the project — writes `uicockpit.tokens.css` (the full kit) and `uicockpit.contract.json`. Takes the kit `hash` from `create_kit` or from uicockpit.com. |
| `get_design_context` | Returns the kit's *grammar* — tokens (grouped) + each component's anatomy (BEM parts) + composition rules + intent routing ("a status pill → a `.badge` tone"; "compose the card anatomy, don't inline layout") — so the agent builds on-system, even components the kit never drew, without loading the full CSS. |
| `check_conformance` | Verifies the code against the contract: flags unknown tokens, undefined component modifiers, raw colours, off-grid spacing, non-token radii/font-sizes. The moat. |

## Setup

Add it to your agent's MCP config. The server is zero-config — it runs over stdio
via `npx`, no install needed.

**Claude Code** (`.mcp.json` in your project, or `claude mcp add`):

```json
{
  "mcpServers": {
    "uicockpit": { "command": "npx", "args": ["-y", "uicockpit-mcp"] }
  }
}
```

**Cursor** (`.cursor/mcp.json`) / **Windsurf** / **Claude Desktop**
(`claude_desktop_config.json`) use the same shape:

```json
{
  "mcpServers": {
    "uicockpit": { "command": "npx", "args": ["-y", "uicockpit-mcp"] }
  }
}
```

## Typical flow

1. Get a kit hash — either ask your agent to `create_kit` from a brief (brand/radius/density), or configure one at [uicockpit.com](https://uicockpit.com) and copy its hash (from the share URL / the "Use this kit" panel).
2. Ask your agent to `install_kit` with that hash.
3. The agent calls `get_design_context` to learn the tokens + rules, builds the UI with the `--k-*` tokens, then calls `check_conformance` and fixes whatever it flags.

The verifier core is the published [`uicockpit`](https://www.npmjs.com/package/uicockpit)
CLI (single source); kit content is served statelessly from the CDN over the kit
hash, so the tokens and the contract always agree. MIT licensed.
