/**
 * The changelog, parsed from the file at the repo root rather than kept twice.
 *
 * One source: GitHub and npm both expect a `CHANGELOG.md` where it is, and a
 * second copy inside the app is a copy that will disagree with the first one
 * within a month. The root is outside Vite's root, so `?raw` is refused — it is
 * inlined by the config instead (see vite.config.ts), which also means the page
 * costs no request.
 *
 * PARSED, not rendered as markdown. The format is a strict subset — a date, a
 * section, a list — and parsing it means the page renders real markup instead
 * of injected HTML, and that a malformed entry is caught by the build rather
 * than by a reader. There is no markdown library here for the same reason there
 * is no zip library: the subset is small enough to own.
 */
const raw = __CHANGELOG_MD__

export interface ChangeSection {
  /** Added · Changed · Removed · Fixed */
  kind: string
  items: string[]
}
export interface ChangeEntry {
  /** ISO date — the product clock's version number. */
  date: string
  sections: ChangeSection[]
}

/** Everything above the first `## <date>` — the two-clock explanation. */
export const CHANGELOG_INTRO = raw
  .slice(raw.indexOf('\n', raw.indexOf('# Changelog')) + 1, raw.search(/^## \d{4}-\d{2}-\d{2}/m))
  .replace(/^---$/gm, '')
  .trim()

export const CHANGELOG: ChangeEntry[] = (() => {
  const out: ChangeEntry[] = []
  let entry: ChangeEntry | null = null
  let section: ChangeSection | null = null
  let item: string[] = []

  const flushItem = () => {
    if (item.length && section) section.items.push(item.join(' ').replace(/\s+/g, ' ').trim())
    item = []
  }

  for (const line of raw.split('\n')) {
    const date = line.match(/^## (\d{4}-\d{2}-\d{2})\s*$/)
    if (date) {
      flushItem()
      entry = { date: date[1]!, sections: [] }
      section = null
      out.push(entry)
      continue
    }
    if (!entry) continue
    const head = line.match(/^### (.+?)\s*$/)
    if (head) {
      flushItem()
      section = { kind: head[1]!, items: [] }
      entry.sections.push(section)
      continue
    }
    const bullet = line.match(/^- (.+)$/)
    if (bullet) { flushItem(); item = [bullet[1]!]; continue }
    // A wrapped continuation of the bullet above; a blank line ends it.
    if (item.length && /^\s+\S/.test(line)) { item.push(line.trim()); continue }
    flushItem()
  }
  flushItem()
  return out
})()

/* A malformed entry should fail loudly while it is being written, not render as
 * a silently empty section. Dev only — never ship an assertion to a visitor. */
if (import.meta.env.DEV) {
  for (const e of CHANGELOG) {
    if (!e.sections.length) console.error(`CHANGELOG.md: ${e.date} has no ### section`)
    for (const s of e.sections) {
      if (!s.items.length) console.error(`CHANGELOG.md: ${e.date} › ${s.kind} has no items`)
    }
  }
}

/** The most recent dated release — what "What's new" points at. */
export const LATEST = CHANGELOG[0]?.date ?? null
