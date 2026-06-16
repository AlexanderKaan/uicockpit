import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react'
import { ArrowRight, Check, FileCode, Sparkles, UploadCloud, X } from 'lucide-react'
import type { Config } from '../tokens/types'
import { extractFoundation, type Extraction } from './extractFoundation'
import { seedConfig, readSummary, type ReadRow } from './seedConfig'

/* Sandbox — "Start from your app." The third on-ramp into the cockpit: drop or
 * paste your app's CSS/Tailwind, we read its FOUNDATION (brand · corners · type ·
 * density · neutrals · elevation) and seed the whole configurator to it via the
 * same REPLACE mechanism as Shuffle. The board you land on IS the cockpit, now
 * wearing your style. 100% client-side — the code never leaves the browser.
 *
 * Honest by construction: we show your COMPONENTS in your STYLE, not your app
 * rebuilt; facets we couldn't measure are simply absent, never bluffed. */

interface SandboxModalProps {
  /** Current config — the base we fold the extracted facets over (unread facets
   *  keep the user's current choices). */
  cfg: Config
  /** Seed the cockpit with the extracted kit (parent dispatches REPLACE). */
  onApply: (cfg: Config, summary: ReadRow[]) => void
  onClose: () => void
}

/* A compact, realistic sample so "Try a sample" demonstrates a real read
 * (shadcn-style :root HSL triplets + a couple of component rules). */
const SAMPLE_CSS = `:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 262 83% 58%;       /* violet brand */
  --muted: 240 5% 96%;
  --border: 240 6% 90%;
  --radius: 0.75rem;
}
body { font-family: "Plus Jakarta Sans", sans-serif; font-size: 15px; }
.btn { height: 40px; border-radius: var(--radius); }
.input { height: 40px; }
.card { box-shadow: 0 8px 24px rgba(17,17,26,.06); border-radius: var(--radius); }
`

export function SandboxModal({ cfg, onApply, onClose }: SandboxModalProps) {
  const [source, setSource] = useState('')
  const [dragging, setDragging] = useState(false)
  const [extraction, setExtraction] = useState<Extraction | null>(null)
  const [traceOpen, setTraceOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const phase: 'input' | 'result' = extraction ? 'result' : 'input'
  const summary = useMemo(() => (extraction ? readSummary(extraction) : []), [extraction])

  /* Read dropped/picked files as text and append — concatenating multiple style
   * files is fine, the extractor scans the whole blob. We only read text; binary
   * (a screenshot) is a later slice, so non-text just yields nothing useful. */
  const ingestFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files.length) return
    const texts = await Promise.all(
      Array.from(files).map((f) => f.text().catch(() => '')),
    )
    const joined = texts.filter(Boolean).join('\n\n')
    if (joined) setSource((prev) => (prev ? `${prev}\n\n${joined}` : joined))
  }, [])

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void ingestFiles(e.dataTransfer.files)
  }, [ingestFiles])

  const read = useCallback(() => {
    if (!source.trim()) return
    setExtraction(extractFoundation(source))
    setTraceOpen(false)
  }, [source])

  const startOver = useCallback(() => setExtraction(null), [])

  const apply = useCallback(() => {
    if (!extraction) return
    onApply(seedConfig(extraction, cfg), summary)
  }, [extraction, cfg, summary, onApply])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sbx" role="dialog" aria-label="Start from your app" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <span className="modal__title sbx__title">
            <Sparkles size={15} strokeWidth={2} />
            Start from your app
          </span>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {phase === 'input' ? (
          <div className="sbx__body">
            <p className="sbx__lede">
              Drop your <strong>CSS</strong>, <strong>Tailwind config</strong>, or <code>globals.css</code> —
              or paste it below. We read your foundation (brand colour, corners, type, density) and dress the
              whole kit in it.
            </p>

            <label
              className={`sbx__drop ${dragging ? 'sbx__drop--over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".css,.scss,.sass,.less,.txt,.js,.ts,.html,text/*"
                className="sbx__file"
                onChange={(e) => { void ingestFiles(e.target.files); e.target.value = '' }}
              />
              <UploadCloud size={26} strokeWidth={1.5} />
              <span className="sbx__drop-main">Drop files here or <span className="sbx__link">browse</span></span>
              <span className="sbx__drop-sub">.css · globals.css · tailwind.config · a compiled stylesheet</span>
            </label>

            <div className="sbx__or"><span>or paste</span></div>

            <textarea
              className="sbx__paste"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder={":root { --primary: 221 83% 53%; --radius: 0.5rem; }\nbody { font-family: \"Inter\", sans-serif; }"}
              spellCheck={false}
            />

            <div className="sbx__foot">
              <span className="sbx__privacy">
                <Check size={13} strokeWidth={2.5} /> Runs in your browser — your code never leaves this page.
              </span>
              <div className="sbx__foot-actions">
                <button type="button" className="sbx__ghost" onClick={() => setSource(SAMPLE_CSS)}>
                  Try a sample
                </button>
                <button type="button" className="sbx__cta" onClick={read} disabled={!source.trim()}>
                  Read my app
                  <ArrowRight size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="sbx__body">
            <p className="sbx__lede sbx__lede--result">
              <span className="sbx__read-tag"><FileCode size={13} strokeWidth={2} /> We read your app</span>
              Here's the foundation we found. Apply it and the entire kit re-themes — tune any of it live in the panel.
            </p>

            {summary.length ? (
              <div className="sbx__chips">
                {summary.map((row) => (
                  <div key={row.facet} className={`sbx__chip ${row.confidence === 'low' ? 'sbx__chip--guess' : ''}`}>
                    {row.swatch && <span className="sbx__chip-swatch" style={{ background: row.swatch }} aria-hidden />}
                    <span className="sbx__chip-label">{row.label}</span>
                    <span className="sbx__chip-value">{row.value}</span>
                    {row.confidence === 'low' && <span className="sbx__chip-flag" title="Best guess — tune it">guess</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="sbx__empty">We couldn't read a clear foundation from that. Try a stylesheet with colours and a <code>--radius</code> / <code>border-radius</code>, or a Tailwind <code>@theme</code> block.</p>
            )}

            {extraction!.notes.length > 0 && (
              <div className="sbx__trace">
                <button type="button" className="sbx__trace-toggle" onClick={() => setTraceOpen((v) => !v)} aria-expanded={traceOpen}>
                  {traceOpen ? 'Hide' : 'Show'} how we read it
                </button>
                {traceOpen && (
                  <ul className="sbx__trace-list">
                    {extraction!.notes.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                )}
              </div>
            )}

            <p className="sbx__honest">Your components, in your style — not your app rebuilt. Motion &amp; icons keep the kit defaults.</p>

            <div className="sbx__foot">
              <button type="button" className="sbx__ghost" onClick={startOver}>Start over</button>
              <button type="button" className="sbx__cta" onClick={apply} disabled={!summary.length}>
                Apply to cockpit
                <ArrowRight size={15} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
