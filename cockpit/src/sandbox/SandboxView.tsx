import { useCallback, useRef, useState, type DragEvent } from 'react'
import { ArrowRight, Check, Loader2, RotateCcw, Sparkles, UploadCloud } from 'lucide-react'
import type { Config } from '../tokens/types'
import { extractFoundation, type Extraction } from './extractFoundation'
import { extractContent, type Content } from './extractContent'
import { extractFoundationFromPixels, loadImageData } from './extractImage'
import { ocrContent } from './ocr'
import { seedConfig } from './seedConfig'
import { SandboxBoard, type BlockKind } from './SandboxBoard'
import { detectBlocks } from './detectBlocks'

export interface SandboxResult { content: Content; blocks: BlockKind[] }

/* Sandbox — the THIRD mode (peer of Components / Showcases). Upload your app's
 * CSS / Tailwind / HTML / screenshot; we read its foundation + words, SEED the
 * live cockpit config (so the Foundation panel is immediately yours to tweak),
 * and render a board built from our real recipes wearing your style + content.
 * No popup, no Apply, no toggle — it's just the cockpit, started from your app. */

interface SandboxViewProps {
  /** Live config — drives the board; the Foundation panel edits it in place. */
  cfg: Config
  /** Extracted content + detected blocks. null until a read happens. */
  result: SandboxResult | null
  /** Seed the live config + stash the extraction (parent dispatches REPLACE). */
  onRead: (seeded: Config, result: SandboxResult) => void
  /** Clear back to the upload step. */
  onReset: () => void
}

const SAMPLE_CSS = `:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 262 83% 58%;       /* violet brand */
  --radius: 0.75rem;
}
body { font-family: "Plus Jakarta Sans", sans-serif; font-size: 15px; }
.btn { height: 40px; border-radius: var(--radius); }
.card { box-shadow: 0 8px 24px rgba(17,17,26,.06); }
`

export function SandboxView({ cfg, result, onRead, onReset }: SandboxViewProps) {
  const [source, setSource] = useState('')
  const [image, setImage] = useState<{ file: File; url: string } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const ingestFiles = useCallback((files: FileList | null) => {
    if (!files || !files.length) return
    const list = Array.from(files)
    const img = list.find((f) => f.type.startsWith('image/'))
    if (img) { setImage((p) => { if (p) URL.revokeObjectURL(p.url); return { file: img, url: URL.createObjectURL(img) } }); return }
    void Promise.all(list.map((f) => f.text().catch(() => ''))).then((texts) => {
      const joined = texts.filter(Boolean).join('\n\n')
      if (joined) setSource((prev) => (prev ? `${prev}\n\n${joined}` : joined))
    })
  }, [])

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(false); ingestFiles(e.dataTransfer.files) }, [ingestFiles])

  const read = useCallback(async () => {
    if (image) {
      // SCREENSHOT — foundation from pixels + words from OCR. Block detection for
      // images needs the vision model (Phase 2); until then images use the default
      // board layout (blocks: []).
      setBusy(true); setProgress('Reading colours…')
      let ex: Extraction
      try { ex = extractFoundationFromPixels(await loadImageData(image.file)) }
      catch { setBusy(false); setProgress(''); return }
      setProgress('Reading text…')
      const c = await ocrContent(image.file, (p) => setProgress(`Reading text… ${Math.round(p * 100)}%`))
      setBusy(false); setProgress('')
      onRead(seedConfig(ex, cfg), { content: c, blocks: [] })
      return
    }
    // CODE / MARKUP — foundation + content + BLOCKS, all read from the text.
    if (!source.trim()) return
    onRead(seedConfig(extractFoundation(source), cfg), { content: extractContent(source).content, blocks: detectBlocks(source) })
  }, [image, source, cfg, onRead])

  const startOver = useCallback(() => {
    setSource(''); setBusy(false); setProgress('')
    setImage((p) => { if (p) URL.revokeObjectURL(p.url); return null })
    onReset()
  }, [onReset])

  // ── RESULT: the board, themed by the LIVE cfg (tune it in the panel). ──────
  if (result) {
    return (
      <div className="sbxview sbxview--board">
        <div className="sbxview__bar">
          <span className="sbxview__tag"><Sparkles size={13} strokeWidth={2} /> Your app, our components</span>
          <span className="sbxview__hint">Tune the foundation in the panel →</span>
          <button type="button" className="sbxview__restart" onClick={startOver}><RotateCcw size={13} strokeWidth={2} /> Start over</button>
        </div>
        <div className="sbxview__board">
          <SandboxBoard cfg={cfg} content={result.content} blocks={result.blocks} />
        </div>
      </div>
    )
  }

  // ── UPLOAD: drop / paste / screenshot. ────────────────────────────────────
  return (
    <div className="sbxview sbxview--upload">
      <div className="sbxview__card">
        <h2 className="sbxview__title"><Sparkles size={18} strokeWidth={2} /> Start from your app</h2>
        <p className="sbxview__lede">
          Drop your <strong>CSS</strong>, <strong>Tailwind config</strong>, <code>globals.css</code> — or a
          <strong> screenshot</strong>. We read your foundation (brand colour, corners, type, light/dark) and your
          words, seed the kit to them, and you tune it live in the panel. A screenshot is the way in for an SPA.
        </p>

        <label
          className={`sbx__drop ${dragging ? 'sbx__drop--over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input ref={fileRef} type="file" multiple
            accept=".css,.scss,.sass,.less,.txt,.js,.ts,.html,text/*,image/png,image/jpeg,image/webp"
            className="sbx__file" onChange={(e) => { ingestFiles(e.target.files); e.target.value = '' }} />
          <UploadCloud size={26} strokeWidth={1.5} />
          <span className="sbx__drop-main">Drop files here or <span className="sbx__link">browse</span></span>
          <span className="sbx__drop-sub">.css · globals.css · tailwind.config · or a screenshot (PNG/JPG)</span>
        </label>

        {image && (
          <div className="sbx__thumb">
            <img src={image.url} alt="Your screenshot" className="sbx__thumb-img" />
            <span className="sbx__thumb-name">{image.file.name} — colours + text will be read from this screenshot</span>
            <button type="button" className="sbx__thumb-x" aria-label="Remove screenshot" onClick={() => setImage((p) => { if (p) URL.revokeObjectURL(p.url); return null })}>×</button>
          </div>
        )}

        {!image && (
          <>
            <div className="sbx__or"><span>or paste</span></div>
            <textarea className="sbx__paste" value={source} onChange={(e) => setSource(e.target.value)} spellCheck={false}
              placeholder={":root { --primary: 221 83% 53%; --radius: 0.5rem; }\nbody { font-family: \"Inter\", sans-serif; }"} />
          </>
        )}

        <div className="sbx__foot">
          <span className="sbx__privacy"><Check size={13} strokeWidth={2.5} /> Runs in your browser — your code never leaves this page.</span>
          <div className="sbx__foot-actions">
            {!image && <button type="button" className="sbx__ghost" onClick={() => setSource(SAMPLE_CSS)}>Try a sample</button>}
            <button type="button" className="sbx__cta" onClick={read} disabled={busy || !(source.trim() || image)}>
              {busy ? <><Loader2 size={15} strokeWidth={2} className="sbx__spin" /> {progress || 'Reading…'}</> : <>Read my app <ArrowRight size={15} strokeWidth={2} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
