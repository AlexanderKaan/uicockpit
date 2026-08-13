import { AUDIT_SCAN_EXT, AUDIT_SKIP_FILE } from './engine'

/**
 * Turn a chosen directory into the `{path, content}[]` the engine reads.
 *
 * Everything here happens in the tab. There is no upload, no worker on a server,
 * no request — that is not a nice-to-have, it is invariant 3: the buyer is
 * letting us look at their internal codebase, and one story about uploaded
 * source costs the whole channel. It is also PROVABLE, which a promise is not:
 * open the network tab and watch it stay quiet.
 *
 * `webkitdirectory` is used rather than the File System Access API because it
 * works in every browser, including Safari and Firefox. The nicer API is a
 * Chromium-only upgrade, not the floor.
 */

/** Directories that are never anyone's design decisions. */
const SKIP_DIR = /(^|\/)(node_modules|\.git|dist|build|\.next|out|coverage|\.uicockpit|vendor|__snapshots__)(\/|$)/

/** A single file big enough to be generated rather than written. */
const MAX_FILE_BYTES = 512 * 1024
/** A ceiling on the whole read, so a monorepo cannot hang the tab. */
const MAX_TOTAL_BYTES = 40 * 1024 * 1024
const MAX_FILES = 8000

export interface ScanFile { path: string; content: string }
export interface ScanResult {
  files: ScanFile[]
  pkg: unknown | null
  /** What we chose not to read, so the page can say so instead of going quiet. */
  skipped: { tooBig: number; overCap: number }
  rootName: string
}

/** The relative path a picked file reports, minus the chosen folder's own name. */
function relPath(file: File): string {
  const raw = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
  const cut = raw.indexOf('/')
  return cut === -1 ? raw : raw.slice(cut + 1)
}

export async function readPickedFiles(list: FileList | File[]): Promise<ScanResult> {
  const all = Array.from(list)
  const rootName =
    (all[0] as (File & { webkitRelativePath?: string }) | undefined)?.webkitRelativePath?.split('/')[0] ||
    'your project'

  const files: ScanFile[] = []
  const skipped = { tooBig: 0, overCap: 0 }
  let pkg: unknown | null = null
  let total = 0

  // package.json is read even though it is not a scannable file: it is what
  // tells the report which framework and styling libraries are installed.
  const pkgFile = all.find((f) => relPath(f) === 'package.json')
  if (pkgFile) {
    try { pkg = JSON.parse(await pkgFile.text()) } catch { /* malformed → skip */ }
  }

  for (const file of all) {
    const path = relPath(file)
    if (SKIP_DIR.test(path)) continue
    if (!AUDIT_SCAN_EXT.test(path) || AUDIT_SKIP_FILE.test(path)) continue
    if (file.size > MAX_FILE_BYTES) { skipped.tooBig++; continue }
    if (files.length >= MAX_FILES || total + file.size > MAX_TOTAL_BYTES) { skipped.overCap++; continue }
    total += file.size
    try {
      files.push({ path, content: await file.text() })
    } catch { /* unreadable → it carries no style either */ }
  }

  return { files, pkg, skipped, rootName }
}

/** The kit vocabulary that powers `expressible`, fetched from our own origin.
 *  Absent → the audit still runs, it just cannot say "this maps to a recipe". */
export async function loadVocabulary(): Promise<unknown | null> {
  try {
    const res = await fetch('/uicockpit.vocabulary.json')
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}
