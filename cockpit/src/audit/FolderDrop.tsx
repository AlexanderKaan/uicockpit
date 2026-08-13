import { useRef, useState, type ReactNode } from 'react'
import { FolderOpen, ShieldCheck } from 'lucide-react'
import { filesFromDrop } from './readFiles'

/**
 * The intake, once — used by both doors.
 *
 * There are two ways into the audit (the marketing page and the configurator's
 * own "Your app" mode) and they were drifting apart within a day: one had a
 * real drop target, the other a lone button. Two implementations of the same
 * promise is how the two entrances stop being one product.
 *
 * Drop target AND file dialog, always. Dragging is what people reach for, and
 * the dialog stays because a drop zone is invisible to anyone on a keyboard —
 * and, on a phone, is not a thing at all.
 */

interface FolderDropProps {
  onFiles: (files: FileList | File[]) => void
  busy?: boolean
  error?: string | null
  /** The marketing door leads with its own headline, so it suppresses this one. */
  heading?: ReactNode
  lede?: ReactNode
  /** Marketing sits on white and states its promises separately; the app stage
   *  is a card on a canvas and carries the promise inline. */
  tone?: 'page' | 'stage'
}

export function FolderDrop({
  onFiles, busy = false, error = null, heading, lede, tone = 'stage',
}: FolderDropProps) {
  const [over, setOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className={`audz audz--${tone}${over ? ' audz--over' : ''}${busy ? ' audz--busy' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        e.preventDefault()
        setOver(false)
        const files = await filesFromDrop(e.dataTransfer.items)
        if (files.length) onFiles(files)
      }}
    >
      <FolderOpen size={26} strokeWidth={1.6} className="audz__icon" />
      <h2>{busy ? 'Reading your code…' : heading || 'Point this at your app'}</h2>
      <p>
        {busy
          ? 'Everything stays on this machine.'
          : lede || 'Drop a folder here, and the components you already build appear on this stage — themed by the kit your code implies.'}
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

      <input
        ref={inputRef}
        type="file"
        hidden
        // @ts-expect-error — non-standard, but the only directory picker that
        // works in Safari and Firefox too.
        webkitdirectory=""
        directory=""
        multiple
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
    </div>
  )
}
