import { useRef, useState } from 'react'
import { FolderOpen, ShieldCheck } from 'lucide-react'
import { readPickedFiles, loadVocabulary, filesFromDrop } from '../../audit/readFiles'
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
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
        sprawl?: { treatments: number; singletons: number }
        score: number | null
        refused?: boolean
        meta: { files: number; parsed: number }
      }
      ping('audit', result.refused ? 'refused' : 'scanned')
      const handoff: AuditHandoff = {
        rootName: scan.rootName,
        filesRead: result.meta.files,
        parsed: result.meta.parsed,
        kinds: Object.fromEntries(Object.entries(result.kinds || {}).map(([k, v]) => [k, v.files])),
        treatments: result.sprawl?.treatments ?? 0,
        singletons: result.sprawl?.singletons ?? 0,
        score: result.score,
        provenance: provenanceFromAudit(result.inferredConfig),
        derived: derivedFromAudit(result.inferredConfig),
      }
      saveHandoff(handoff)
      onScanned(handoff, encode(configFromAudit(result.inferredConfig)))
    } catch {
      setError('That folder could not be read. Try a smaller one — a single app, not a monorepo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="audv audv--empty">
      <div
        className={`audz${over ? ' audz--over' : ''}${busy ? ' audz--busy' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={async (e) => {
          e.preventDefault()
          setOver(false)
          const files = await filesFromDrop(e.dataTransfer.items)
          if (files.length) void run(files)
          else setError('That drop had no folder in it — drag the folder itself, not a shortcut.')
        }}
      >
        <FolderOpen size={26} strokeWidth={1.6} className="audz__icon" />
        <h2>{busy ? 'Reading your code…' : 'Point this at your app'}</h2>
        <p>
          {busy
            ? 'Everything stays on this machine.'
            : 'Drop a folder here, and the components you already build appear on this stage — themed by the kit your code implies.'}
        </p>
        {!busy && (
          <>
            <button type="button" className="btn btn--primary" onClick={() => inputRef.current?.click()}>
              Choose a folder
            </button>
            <span className="audz__hint">one app, not a monorepo root · node_modules is skipped</span>
          </>
        )}
        {error && <p className="audz__error">{error}</p>}
        <p className="audz__promise">
          <ShieldCheck size={13} strokeWidth={2} />
          Runs in this tab. Nothing is uploaded — open your network panel and watch it stay quiet.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        hidden
        // @ts-expect-error — non-standard, but the only directory picker that
        // works in Safari and Firefox too.
        webkitdirectory=""
        directory=""
        multiple
        onChange={(e) => e.target.files && void run(e.target.files)}
      />
    </div>
  )
}
