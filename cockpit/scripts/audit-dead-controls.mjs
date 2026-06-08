// Dead-control audit — catches the gallery↔app *behavioural* drift the
// class-level provenance gate can't see: a <button> that renders a DOWN-chevron
// (the universal "I open a dropdown" affordance) but has no handler, so it looks
// interactive and does nothing. This is exactly the bug where a gallery demo
// lagged its working app twin (Toolbar Epic/Type, the Save split-action).
//
// Heuristic, deliberately narrow to stay false-positive-free:
//   - Only the DOWN chevron (name="chevD"). chevL/chevR are prev/next/carousel
//     navigation and are legitimately static in some demos — not flagged.
//   - A raw <button> whose opening tag has no onClick / onPointerDown /
//     onMouseDown and is not type="submit". Custom triggers (combobox,
//     select-trigger, DatePicker, Sort, MenuButton/SplitMenu) all carry onClick,
//     so they pass. A bare dead chevron does not.
// Buttons cannot nest, so the non-greedy <button>…</button> match is safe.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOTS = ['src/stage/views', 'src/marketing']
const CHEV_DOWN = /name=["']chevD["']/
const BTN = /<button\b([^>]*)>([\s\S]*?)<\/button>/g
const HAS_HANDLER = /onClick|onPointerDown|onMouseDown|type=["']submit["']/

function walk(dir) {
  const out = []
  let entries
  try { entries = readdirSync(dir) } catch { return out }
  for (const e of entries) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (p.endsWith('.tsx')) out.push(p)
  }
  return out
}

// Blank out comments (keeping newlines so line numbers stay accurate) — the
// literal text `<button>` shows up in prose comments and must not be scanned.
function stripComments(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length))
}

const flagged = []
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = stripComments(readFileSync(file, 'utf8'))
    for (const m of src.matchAll(BTN)) {
      const [full, attrs, inner] = m
      if (!CHEV_DOWN.test(inner)) continue
      if (HAS_HANDLER.test(attrs)) continue
      const line = src.slice(0, m.index).split('\n').length
      flagged.push({ file, line, snippet: full.replace(/\s+/g, ' ').trim().slice(0, 88) })
    }
  }
}

if (flagged.length) {
  console.error('=== Dead-control audit: down-chevron <button> with no handler ===')
  for (const f of flagged) console.error(`  ${f.file}:${f.line}  ${f.snippet}`)
  console.error(`\n${flagged.length} dead chevron button(s) — a dropdown affordance that does nothing.`)
  console.error('Fix: add an onClick that opens a menu (useDropdown + .menu), or use MenuButton / SplitMenu.')
  process.exit(1)
}
console.log('OK: no dead chevron buttons — every down-chevron trigger has a handler.')
