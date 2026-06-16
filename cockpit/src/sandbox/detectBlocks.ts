import type { BlockKind } from './SandboxBoard'

/* Sandbox — BLOCK detection from MARKUP (the code/paste path). A real page is a
 * stack of archetype blocks; if we can name which ones are present + roughly in
 * what order, the board renders OUR recipe for each. This is the reliable-from-code
 * detector (markup is explicit); screenshots get the vision detector (Phase 2).
 *
 * Heuristic + fail-soft: returns a sensible block list, never throws. Order is
 * the likely top-to-bottom visual order, which the board honours. */

const count = (s: string, re: RegExp) => (s.match(re) ?? []).length

export function detectBlocks(markup: string): BlockKind[] {
  const h = markup.toLowerCase()
  const blocks: BlockKind[] = []
  const has = (re: RegExp) => re.test(h)

  // STRUCTURAL — a sidebar rail, else a top nav (tabs).
  const sidebar = has(/<aside[\s>]|class=["'][^"']*\b(sidebar|sidenav|side-nav|drawer|app-rail)\b/)
  if (sidebar) blocks.push('sidebar')

  // BODY blocks, pushed in likely visual order (top → bottom).
  if (has(/type=["']?search|placeholder=["'][^"']*search|class=["'][^"']*\bsearch(box|bar|field|input)?\b/)) blocks.push('searchbar')
  if (!sidebar && has(/<nav[\s>]|role=["']tablist|class=["'][^"']*\b(tabs?|tablist|topnav|navbar|menu)\b/)) blocks.push('tabnav')
  if (has(/\bfilters?\b|class=["'][^"']*\b(filter|chip|facet|segment)\b/)) blocks.push('filterbar')
  if (has(/class=["'][^"']*\b(stat|kpi|metric|tile)\b/)) blocks.push('statstrip')

  const rows = count(h, /<tr[\s>]/g)
  const tableish = has(/<table[\s>]|class=["'][^"']*\b(table|data-?table|datagrid|results?|listing|rows?)\b/) || rows >= 3
  if (tableish) blocks.push('datatable')

  if (!tableish && count(h, /class=["'][^"']*\bcard\b/g) >= 3) blocks.push('cardgrid')
  if (has(/<form[\s>]|class=["'][^"']*\bform(-panel)?\b/)) blocks.push('form')

  // TOOLBAR — a header dense with actions (adds buttons to the app bar).
  if (count(h, /<button[\s>]/g) >= 4 || has(/class=["'][^"']*\btoolbar\b/)) blocks.push('toolbar')

  // Fallback: if we found no BODY content, show something real.
  const BODY = new Set<BlockKind>(['tabnav', 'searchbar', 'filterbar', 'statstrip', 'datatable', 'cardgrid', 'form'])
  if (!blocks.some((b) => BODY.has(b))) blocks.push('statstrip', 'datatable')

  return [...new Set(blocks)]
}
