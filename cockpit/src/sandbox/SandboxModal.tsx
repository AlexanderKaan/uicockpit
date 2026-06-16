import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react'
import { ArrowRight, Check, FileCode, Loader2, Sparkles, UploadCloud, X } from 'lucide-react'
import type { Config } from '../tokens/types'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import { extractFoundation, type Extraction } from './extractFoundation'
import { extractContent, type Content } from './extractContent'
import { extractFoundationFromPixels, loadImageData } from './extractImage'
import { ocrContent } from './ocr'
import { seedConfig, readSummary, type ReadRow } from './seedConfig'
import { SandboxBoard } from './SandboxBoard'

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
  const [image, setImage] = useState<{ file: File; url: string } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [extraction, setExtraction] = useState<Extraction | null>(null)
  const [content, setContent] = useState<Content>({ menu: [] })
  const [useColors, setUseColors] = useState(true) // default = show their app faithfully (their colours + mode)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const phase: 'input' | 'result' = extraction ? 'result' : 'input'
  const summary = useMemo(() => (extraction ? readSummary(extraction) : []), [extraction])
  // The board's foundation. "Your colours" = their full extraction. "UICockpit
  // look" = our house palette/shape, but still in THEIR light/dark mode — a dark
  // app must stay dark under both, or the comparison is jarring (not their app).
  const boardCfg = useMemo(() => {
    if (!extraction) return DEFAULT_CONFIG
    if (useColors) return seedConfig(extraction, cfg)
    return { ...DEFAULT_CONFIG, mode: extraction.config.mode ?? DEFAULT_CONFIG.mode }
  }, [useColors, extraction, cfg])

  /* Route dropped files: an IMAGE goes to the pixel/OCR pipeline; everything else
   * is read as text and appended (concatenating style files is fine — the
   * extractor scans the whole blob). First image wins. */
  const ingestFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files.length) return
    const list = Array.from(files)
    const img = list.find((f) => f.type.startsWith('image/'))
    if (img) {
      setImage((prev) => { if (prev) URL.revokeObjectURL(prev.url); return { file: img, url: URL.createObjectURL(img) } })
      return
    }
    const texts = await Promise.all(list.map((f) => f.text().catch(() => '')))
    const joined = texts.filter(Boolean).join('\n\n')
    if (joined) setSource((prev) => (prev ? `${prev}\n\n${joined}` : joined))
  }, [])

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void ingestFiles(e.dataTransfer.files)
  }, [ingestFiles])

  const read = useCallback(async () => {
    // IMAGE path — colours from pixels (instant), words from OCR (a few seconds).
    // Show the themed board immediately, then pop the words in when OCR resolves.
    if (image) {
      setBusy(true); setProgress('Reading colours…')
      let ex: Extraction
      try { ex = extractFoundationFromPixels(await loadImageData(image.file)) }
      catch { setBusy(false); setProgress(''); return }
      setExtraction(ex); setContent({ menu: [] })
      setProgress('Reading text…')
      const c = await ocrContent(image.file, (p) => setProgress(`Reading text… ${Math.round(p * 100)}%`))
      setContent(c); setBusy(false); setProgress('')
      return
    }
    // TEXT path — synchronous.
    if (!source.trim()) return
    setExtraction(extractFoundation(source))
    setContent(extractContent(source).content)
  }, [image, source])

  const startOver = useCallback(() => {
    setExtraction(null); setContent({ menu: [] })
    setImage((prev) => { if (prev) URL.revokeObjectURL(prev.url); return null })
    setBusy(false); setProgress('')
  }, [])

  const apply = useCallback(() => {
    if (!extraction) return
    onApply(seedConfig(extraction, cfg), summary)
  }, [extraction, cfg, summary, onApply])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal sbx ${phase === 'result' ? 'sbx--result' : ''}`} role="dialog" aria-label="Start from your app" onClick={(e) => e.stopPropagation()}>
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
              Drop your <strong>CSS</strong>, <strong>Tailwind config</strong>, <code>globals.css</code> — or a
              <strong> screenshot</strong>. We read your foundation (brand colour, corners, type) and your words,
              and dress the whole kit in them. A screenshot is the way in for an SPA (its HTML is empty).
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
                accept=".css,.scss,.sass,.less,.txt,.js,.ts,.html,text/*,image/png,image/jpeg,image/webp"
                className="sbx__file"
                onChange={(e) => { void ingestFiles(e.target.files); e.target.value = '' }}
              />
              <UploadCloud size={26} strokeWidth={1.5} />
              <span className="sbx__drop-main">Drop files here or <span className="sbx__link">browse</span></span>
              <span className="sbx__drop-sub">.css · globals.css · tailwind.config · or a screenshot (PNG/JPG)</span>
            </label>

            {image && (
              <div className="sbx__thumb">
                <img src={image.url} alt="Your screenshot" className="sbx__thumb-img" />
                <span className="sbx__thumb-name">{image.file.name} — colours + text will be read from this screenshot</span>
                <button type="button" className="sbx__thumb-x" aria-label="Remove screenshot" onClick={() => setImage((p) => { if (p) URL.revokeObjectURL(p.url); return null })}>
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            )}

            {!image && (
              <>
                <div className="sbx__or"><span>or paste</span></div>
                <textarea
                  className="sbx__paste"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder={":root { --primary: 221 83% 53%; --radius: 0.5rem; }\nbody { font-family: \"Inter\", sans-serif; }"}
                  spellCheck={false}
                />
              </>
            )}

            <div className="sbx__foot">
              <span className="sbx__privacy">
                <Check size={13} strokeWidth={2.5} /> Runs in your browser — your code never leaves this page.
              </span>
              <div className="sbx__foot-actions">
                {!image && (
                  <button type="button" className="sbx__ghost" onClick={() => setSource(SAMPLE_CSS)}>
                    Try a sample
                  </button>
                )}
                <button type="button" className="sbx__cta" onClick={read} disabled={busy || !(source.trim() || image)}>
                  {busy ? <><Loader2 size={15} strokeWidth={2} className="sbx__spin" /> {progress || 'Reading…'}</> : <>Read my app <ArrowRight size={15} strokeWidth={2} /></>}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="sbx__body">
            <div className="sbx__result-head">
              <span className="sbx__read-tag"><FileCode size={13} strokeWidth={2} /> Your app, our craft</span>
              {/* The before/after: same content + components, their foundation
                  vs ours. Default = the UICockpit look (the literal "what would
                  it look like in your design language"). */}
              <div className="sbx__result-tools">
                {busy && <span className="sbx__reading"><Loader2 size={13} strokeWidth={2} className="sbx__spin" /> {progress || 'Reading your text…'}</span>}
                <div className="sbx__seg" role="radiogroup" aria-label="Foundation">
                  <button type="button" role="radio" aria-checked={!useColors} className={`sbx__seg-btn ${!useColors ? 'sbx__seg-btn--on' : ''}`} onClick={() => setUseColors(false)}>UICockpit look</button>
                  <button type="button" role="radio" aria-checked={useColors} className={`sbx__seg-btn ${useColors ? 'sbx__seg-btn--on' : ''}`} onClick={() => setUseColors(true)}>Your colours</button>
                </div>
              </div>
            </div>

            <div className="sbx__stage">
              <SandboxBoard cfg={boardCfg} content={content} />
            </div>

            {/* The foundation reading — condensed chips beneath the board. */}
            {summary.length > 0 && (
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
            )}

            <p className="sbx__honest">
              {busy
                ? <>Reading the text from your screenshot… </>
                : content.appName || content.menu.length
                  ? <>We pulled your brand &amp; words from your app. </>
                  : <>No app text found — for an SPA, drop a <strong>screenshot</strong> (or server-rendered HTML) to bring your words in. </>}
              Your components in your style, not your app rebuilt — motion &amp; icons keep the kit defaults.
            </p>

            <div className="sbx__foot">
              <button type="button" className="sbx__ghost" onClick={startOver}>Start over</button>
              <button type="button" className="sbx__cta" onClick={apply} disabled={!summary.length}>
                Apply your colours
                <ArrowRight size={15} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
