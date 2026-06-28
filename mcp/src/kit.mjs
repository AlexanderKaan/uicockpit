/**
 * Kit helpers for the MCP server — fetch a configured kit from the CDN (stateless
 * over the share-hash) and turn a contract into a compact agent briefing.
 *
 * The CDN serves both artifacts from one hash, so they always agree:
 *   GET /k/<hash>.css            → tokens.css (full kit + component recipes)
 *   GET /k/<hash>.contract.json  → the machine-checkable contract
 */

export const CDN = (process.env.UICOCKPIT_CDN || 'https://kit.uicockpit.com').replace(/\/$/, '')

export async function fetchText(url) {
  let res
  try {
    res = await fetch(url)
  } catch (err) {
    throw new Error(`network error fetching ${url}: ${err.message}`)
  }
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.text()
}

export const cssUrl = (hash) => `${CDN}/k/${hash}.css`
export const contractUrl = (hash) => `${CDN}/k/${hash}.contract.json`
export const linkSnippet = (hash) => `<link rel="stylesheet" href="${cssUrl(hash)}">`

/* Intent → kit phrase-book. The composition utilities + key patterns are easy to
 * MISS (the gradient/canvas idiom lived only in a token comment), so an agent
 * hand-rolls them off-grammar. Surfacing "to do X, reach for Y" closes that gap.
 * Each entry names the class root it `needs`, so we only show intents the kit
 * actually ships (null = token-only, always shown). */
const INTENTS = [
  { needs: 'canvas', line: 'Hero / section / app-shell background (brand atmosphere) → `class="canvas"`' },
  { needs: 'eyebrow', line: 'Uppercase micro-label / section kicker → `class="eyebrow"`' },
  { needs: 'metric', line: 'KPI / metric (label → value → sub) → `class="metric"` with `.metric__label` / `__value` / `__sub`' },
  { needs: 'num', line: 'Tabular figures (money, counts, timers, IDs) → add `class="num"`' },
  { needs: 'icon-tile', line: 'Soft-tinted icon square (stat mark, list lead) → `class="icon-tile"`' },
  { needs: 'scrubber', line: 'Media transport / player progress with a playhead → `class="scrubber"`' },
  { needs: 'card', line: 'Brand face (ticket, pass, membership card) → `class="card card--presentation"`' },
  { needs: 'toolbar', line: 'A row of mixed controls forced to one height → `class="toolbar"`' },
  { needs: 'btn', line: 'Primary action → `class="btn btn--primary"`; quiet → `btn btn--ghost`' },
  { needs: null, line: 'Muted / secondary text → `color: var(--k-fg-muted)`; faint → `var(--k-fg-faint)`' },
]

/** Group a flat token map (`--k-*: value`) into readable categories for the briefing. */
function groupTokens(tokens) {
  const groups = new Map()
  const bucket = (name) => {
    const m = name.match(/^--k-([a-z]+)/)
    return m ? m[1] : 'other'
  }
  for (const [name, value] of Object.entries(tokens || {})) {
    const g = bucket(name)
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g).push(`${name}: ${value}`)
  }
  return groups
}

/**
 * Build a compact, agent-readable design briefing from a parsed contract — the
 * "how to build on-system" context WITHOUT shipping the 295 KB tokens.css.
 * @param {object} contract  parsed contract.json
 * @param {string|null} hash  if known, include the hosted <link>
 */
export function designContext(contract, hash = null) {
  const lines = []
  lines.push(`# Design system: ${contract.name || 'kit'}`)
  lines.push('')
  lines.push('Build every screen with these tokens and rules. Theme through the')
  lines.push('`--k-*` CSS variables — never hardcode a colour, radius, spacing or font size.')
  lines.push('')

  if (hash) {
    lines.push('## Runtime')
    lines.push(`Hosted stylesheet (drop in <head>): \`${linkSnippet(hash)}\``)
    lines.push('Or install the files locally with the `install_kit` tool.')
    lines.push('')
  }

  const groups = groupTokens(contract.tokens)
  lines.push(`## Tokens (${Object.keys(contract.tokens || {}).length})`)
  // Lead with the categories an agent reaches for most.
  const order = ['primary', 'bg', 'fg', 'surface', 'border', 'accent', 's', 'radius', 'type', 'font', 'shadow', 'ring']
  const seen = new Set()
  const emit = (g) => {
    if (seen.has(g) || !groups.has(g)) return
    seen.add(g)
    lines.push(`\n### --k-${g}-*`)
    for (const t of groups.get(g)) lines.push(`- ${t}`)
  }
  for (const g of order) emit(g)
  for (const g of groups.keys()) emit(g)

  const rules = (contract.rules || []).filter(Boolean)
  if (rules.length) {
    lines.push('')
    lines.push('## Rules')
    for (const r of rules) {
      const sev = r.severity ? `(${r.severity}) ` : ''
      const text = r.description || r.text || r.message || r.rule || r.check || ''
      lines.push(`- ${sev}${text}${r.check ? `  [check: ${r.check}]` : ''}`)
    }
  }

  const classes = contract.components?.classes || {}
  const roots = Object.keys(classes)
  if (roots.length) {
    lines.push('')
    lines.push(`## Component classes (${roots.length}) — use these, with only their defined modifiers`)
    for (const root of roots) {
      const mods = classes[root]?.modifiers || []
      lines.push(`- .${root}${mods.length ? ` — modifiers: ${mods.map((m) => `${root}--${m}`).join(', ')}` : ''}`)
    }
  }

  // Intent → reach-for map, filtered to the classes this kit actually ships.
  const intents = INTENTS.filter((i) => i.needs == null || i.needs in classes)
  if (intents.length) {
    lines.push('')
    lines.push('## Intent → reach for the kit (don’t hand-roll these)')
    for (const i of intents) lines.push(`- ${i.line}`)
  }

  lines.push('')
  lines.push('After applying, run the `check_conformance` tool to catch any drift.')
  return lines.join('\n')
}
