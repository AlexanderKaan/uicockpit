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
  { needs: 'btn', line: 'Primary/commit action → `btn btn--primary`; a secondary (non-cancel) action → `btn btn--secondary` (or `btn--outline`); a quiet / cancel action → `btn btn--ghost`. A row-action / kebab / overflow trigger → `btn btn--ghost btn--icon` (it opens a `.menu`).' },
  // Composite archetypes — surfaced by the dumb-builder test (the pack named the
  // root but the builder couldn't compose it). Route each to its root + parts.
  { needs: 'card', line: 'Any panel / dashboard / data card → `.card`, composed from its parts (`__head`/`__title`/`__row`/`__row--spread`/`__col`/`__media`/`__foot`) — don’t inline the layout' },
  { needs: 'stat-tile', line: 'A KPI tile (label · value · +/- delta) → `.stat-tile` (`__label` · `__value` · `__delta`; `--up`/`--down` colour the delta, `--hero` = the one focal tile); a row of them → `.stat-tile-grid`. A standalone BIG focal figure (a temperature, a balance) is `.stat-tile__value` / `.metric__value` — already a display-weight tier; the focal one adds `--hero`.' },
  { needs: 'pricing', line: 'A pricing comparison → `.pricing` (a self-responsive grid WRAPPER); each plan is a `.pricing__tier` (the recommended one is `pricing__tier pricing__tier--featured`). Inside a tier compose: `__name` · `__price` (which wraps `__amount` + `__period`) · `__tagline` · `__feats` (each feature a plain `<li>`, it gets the ✓) · `__cta` (holds the `.btn`, pinned to the bottom so CTAs align) · optional `__badge`.' },
  { needs: 'chart', line: 'A line / bar / donut chart → `.chart` (compose `__svg` · `__grid` · `__axis` · `__legend` · `__tip`; `__empty`/`__loading` for those states)' },
  { needs: 'list', line: 'A ranked / settings / nav list → `.list` (`--settings` for label+control rows, `--cols` for value columns); each row is `.list__row` (`__lead` · `__title`/`__sub` · `__trail`). For a RANKED list the `__lead` holds the ordinal (1·2·3) or a lead icon; the value goes in `__trail`.' },
  { needs: 'msg', line: 'A chat / comment bubble → `.msg` (`--me` = sent, right + brand fill); compose `__head` (an optional leading `.avatar` + `__name` + `__time`) then `__body` (the text); stack messages in a `.thread`. A composer = a `.toolbar` holding the `.in` + a `.btn--primary` send.' },
  { needs: 'field', line: 'A form field → `.field` (compose `__label` · the control `.in`/`.select` · optional `__hint`/`__error`/`__req`)' },
  { needs: 'toggle', line: 'An on/off setting → `.toggle` (`__knob` inside; `--on` = on state)' },
  { needs: 'select', line: 'A single choice → `.select` (a dropdown — for many or long options) or `.segctrl` (inline segmented — for 2–4 short options)' },
  { needs: 'buttons', line: 'A form / dialog action row → `.buttons`; commit = `.btn--primary`, cancel = `.btn--ghost`' },
  { needs: 'datatable', line: 'A data-table panel → `.datatable` (chrome: `__bar` = the toolbar row · `__body` holds a real `.tbl` table · `__foot` with `__count` + an OPTIONAL `__perpage` · `__check` = the row-select cell, holding a native `<input type=checkbox>` styled by `.check`). Pagination → `.pagination` with bare `<button>` children (auto-chipped); the current page is `<button aria-current="true">`; `.pagination__ellipsis` for the gap.' },
  { needs: 'calendar', line: 'A date / date-range picker → `.calendar` (compose `__head` with `__nav-title` + `__nav-btns`; the day grid is `.calendar__cell` items). State mods decorate the CELL: `.calendar__cell.calendar--today`/`--disabled`/`--out`/`--range`/`--range-start`/`--range-end`. A range view wraps months in `.calendar-range`.' },
  { needs: 'badge', line: 'A record / lifecycle status (Active · Pending · Archived · Failed) → a `.badge` tone (`--success` / `--warn` / `--neutral` / `--danger`). A LIVE presence dot (online / away / busy) is the different `.meta-status`.' },
  { needs: 'select', line: 'A filter control → `.select` (the DEFAULT — a dropdown filter); use `.chip--filter` only for a removable active-filter pill, or `.filterbar` for a full multi-facet bar. Leaf form controls (`.select`, `.check`, `.in`) are styled by the class on the native element — no inner parts.' },
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
    lines.push('## Composition — assemble from the anatomy, never hand-rolled layout')
    lines.push('A component is a ROOT class + its `__parts` (the internal elements you nest) +')
    lines.push('its `--modifiers` (variants). BUILD by composing the parts — do NOT invent your')
    lines.push('own structure or inline padding/gap/radius. The parts already carry the spacing,')
    lines.push('type and dividers; fighting them with inline styles is what makes UI drift.')
    lines.push('- A container carries its OWN rhythm. `.card` sets the gap + padding + radius;')
    lines.push('  compose `.card__head` (title+desc) · `.card__row` / `.card__row--spread`')
    lines.push('  (horizontal / label↔value) · `.card__col` (vertical) · `.card__media` (a top')
    lines.push('  image that bleeds to the edges + clips the radius) · `.card__foot` (a closed')
    lines.push('  footer). Never set inline padding/gap that fights the container.')
    lines.push('- Titles: a card/panel/dialog title is `.card__title`; a micro-label / kicker is')
    lines.push('  `.eyebrow`. A KPI is `.stat-tile` (label→value→delta, `--up`/`--down` colour the')
    lines.push('  +/- delta, `--hero` is the focal one) or the bare `.metric` (label→value→sub).')
    lines.push('- Lay N items out with a layout primitive, never a hand-rolled grid: equal')
    lines.push('  columns → `.l-grid`; responsive wrap → `.l-switcher`; a KPI strip →')
    lines.push('  `.stat-tile-grid`; a row of mixed controls at one height → `.toolbar`.')
    lines.push('- Semantic colour: positive/up → `--k-success`, negative/down → `--k-danger`,')
    lines.push('  warning → `--k-warning`, info → `--k-info`, a rating/score → `--k-rating` (gold).')
    lines.push('- Icons are YOURS, with NO slot class: a glyph is a DIRECT `<svg>` (or `<i>`)')
    lines.push('  child of the control — a `.btn`, a `.searchinput`, a `.pagination` button, a')
    lines.push('  kebab trigger — sized via `--k-icon-xs/sm/md` + `currentColor`. The control')
    lines.push('  styles its child glyph; don’t look for a `__icon` part. Wrap a standalone mark')
    lines.push('  in `.icon-tile` for a soft-tinted square.')
    lines.push('- A `--modifier` that names a per-item STATE decorates the relevant PART or')
    lines.push('  INSTANCE, not the root: a selected day is `.calendar__cell.calendar--range`, a')
    lines.push('  selected table row is a `<tr class="is-selected">`, the current page is')
    lines.push('  `<button aria-current="true">`, a danger menu item is a `.menu__item.menu--danger`.')
    lines.push('  When a modifier reads as a per-item state, apply it to the item.')
    lines.push('')
    lines.push(`## Component classes (${roots.length}) — the ROOT, its __parts (compose these), its --modifiers`)
    for (const root of roots) {
      const def = classes[root] || {}
      const parts = def.parts || []
      const mods = def.modifiers || []
      const partStr = parts.length ? ` · parts: ${parts.map((p) => `${root}__${p}`).join(' ')}` : ''
      const modStr = mods.length ? ` · mods: ${mods.map((m) => `${root}--${m}`).join(' ')}` : ''
      lines.push(`- .${root}${partStr}${modStr}`)
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
