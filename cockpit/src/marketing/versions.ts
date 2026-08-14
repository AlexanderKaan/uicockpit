/**
 * The published package versions, injected from their own package.json at build
 * time (see vite.config.ts). Two numbers, never one: `uicockpit` and
 * `uicockpit-mcp` ship independently, the site ships continuously, and a kit is
 * addressed by its hash. There is no single product version to show.
 */
export const CLI_VERSION = __UICOCKPIT_VERSION__
export const MCP_VERSION = __MCP_VERSION__
