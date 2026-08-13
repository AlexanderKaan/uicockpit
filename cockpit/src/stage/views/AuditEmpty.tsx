import { useState } from 'react'
import { readPickedFiles, loadVocabulary } from '../../audit/readFiles'
import { FolderDrop } from '../../audit/FolderDrop'
import { auditFiles } from '../../audit/engine'
import {
  saveHandoff, configFromAudit, provenanceFromAudit, derivedFromAudit, type AuditHandoff,
} from '../../audit/handoff'
import { encode } from '../../state/hash'
import { ping } from '../../analytics/beacon'

/**
 * "Your app", before there is one.
 *
 * The audit used to be reachable only from the marketing door, which meant
 * anyone who walked straight into the configurator had no way to point at their
 * own code — the mode existed but had no entrance. A tab you cannot fill is
 * worse than no tab.
 *
 * Drop target first, file dialog second. Dragging a folder is what people reach
 * for, and the dialog stays because a drop target alone is invisible to anyone
 * navigating by keyboard.
 */

interface AuditEmptyProps {
  /** Hand the finished scan up so the app can switch into audit mode. */
  onScanned: (h: AuditHandoff, hash: string) => void
}

export function AuditEmpty({ onScanned }: AuditEmptyProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (files: FileList | File[]) => {
    setError(null)
    setBusy(true)
    try {
      const scan = await readPickedFiles(files)
      if (!scan.files.length) {
        setError('No stylable files in there — point at the app itself, not the repo root.')
        return
      }
      const vocabulary = await loadVocabulary()
      const result = auditFiles(scan.files, { pkg: scan.pkg, vocabulary }) as unknown as {
        inferredConfig: { values?: Record<string, unknown>; confidence?: Record<string, unknown> }
        kinds?: Record<string, { files: number }>
        shell?: Record<string, { files: number }>
        spread?: AuditHandoff['spread']
        dimensions?: Record<string, { distinct: number }>
        sprawl?: { treatments: number; singletons: number }
        score: number | null
        refused?: boolean
        meta: { files: number; parsed: number }
      }
      ping('audit', result.refused ? 'refused' : 'scanned')
      const hash = encode(configFromAudit(result.inferredConfig))
      const handoff: AuditHandoff = {
        hash,
        rootName: scan.rootName,
        filesRead: result.meta.files,
        parsed: result.meta.parsed,
        kinds: Object.fromEntries(Object.entries(result.kinds || {}).map(([k, v]) => [k, v.files])),
        shell: Object.fromEntries(Object.entries(result.shell || {}).map(([k, v]) => [k, v.files])),
        spread: result.spread || { radius: [], shadow: [], spacing: [], color: [], neutral: [], type: [], bg: null, fg: null, border: null, polarity: null },
        distinct: {
          radius: result.dimensions?.radius?.distinct ?? 0,
          shadow: result.dimensions?.shadow?.distinct ?? 0,
          color: result.dimensions?.color?.distinct ?? 0,
          spacing: result.dimensions?.spacing?.distinct ?? 0,
        },
        treatments: result.sprawl?.treatments ?? 0,
        singletons: result.sprawl?.singletons ?? 0,
        score: result.score,
        provenance: provenanceFromAudit(result.inferredConfig),
        derived: derivedFromAudit(result.inferredConfig),
      }
      saveHandoff(handoff)
      onScanned(handoff, hash)
    } catch {
      setError('That folder could not be read. Try a smaller one — a single app, not a monorepo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="audv audv--empty">
      <FolderDrop onFiles={(f) => void run(f)} busy={busy} error={error} />
    </div>
  )
}
