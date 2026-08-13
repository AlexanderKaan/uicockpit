import { useEffect, useRef, useState } from 'react'
import { FolderOpen, ShieldCheck, Download, RotateCcw, ArrowRight } from 'lucide-react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'
import { auditFiles, renderReport } from '../audit/engine'
import { readPickedFiles, loadVocabulary, type ScanResult } from '../audit/readFiles'
import { ping } from '../analytics/beacon'

/**
 * `/audit` — the retroactive door.
 *
 * Three beats, in this order and no other:
 *   1. the door        — point at your code, nothing is uploaded
 *   2. recognition     — "that is your codebase", with zero questions asked
 *   3. the findings    — the wall first, then the numbers
 *
 * The middle beat is the one that is easy to skip and the one that matters. A
 * verdict out of a black box is an assertion; the same verdict after the reader
 * has recognised their own stack is evidence. And it doubles as the honest
 * disclosure of what the scan could not see.
 *
 * The findings are rendered by `renderReport()` — the SAME function the CLI
 * writes to disk — shown in a sandboxed iframe. One renderer, two surfaces, so
 * the web report and the local file can never drift apart.
 */

type Phase = 'door' | 'reading' | 'recognise' | 'findings'

interface AuditState {
  result: ReturnType<typeof auditFiles>
  scan: ScanResult
}

export function AuditPage({ navigate }: { navigate: (to: string) => void }) {
  const [phase, setPhase] = useState<Phase>('door')
  const [state, setState] = useState<AuditState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Audit — find the design system your code already has — UIcockpit'
    return () => { document.title = prev }
  }, [])

  const run = async (list: FileList | File[]) => {
    setError(null)
    setPhase('reading')
    try {
      const scan = await readPickedFiles(list)
      if (!scan.files.length) {
        setError('No stylable files in that folder — pick the app itself, not the repo root.')
        setPhase('door')
        return
      }
      const vocabulary = await loadVocabulary()
      const result = auditFiles(scan.files, { pkg: scan.pkg, vocabulary })
      setState({ result, scan })
      // Counted as a milestone, not a click: a completed scan is the moment the
      // door stopped being a landing page. The value is a bucket, never the
      // score, the stack or anything else derived from their code.
      ping('audit', result.refused ? 'refused' : 'scanned')
      setPhase('recognise')
    } catch {
      setError('That folder could not be read. Try a smaller one — a single app rather than a monorepo.')
      setPhase('door')
    }
  }

  const reset = () => { setState(null); setPhase('door'); setError(null) }

  const download = () => {
    if (!state) return
    const blob = new Blob([renderReport(state.result)], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'uicockpit-audit.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="audit" />

      <main className="mkt__container aud">
        <p className="aud__local">
          <ShieldCheck size={14} strokeWidth={2} />
          Runs in this tab · no upload, no account, no server
        </p>

        {phase === 'door' && <Door onPick={() => inputRef.current?.click()} error={error} />}
        {phase === 'reading' && <Reading />}
        {phase === 'recognise' && state && (
          <Recognise
            result={state.result}
            scan={state.scan}
            onContinue={() => { ping('audit', 'findings'); setPhase('findings') }}
            onReset={reset}
          />
        )}
        {phase === 'findings' && state && (
          <Findings result={state.result} onDownload={download} onReset={reset} navigate={navigate} />
        )}

        {/* Universal: webkitdirectory works in Safari and Firefox too, where the
            File System Access API does not. The floor matters more than the frill. */}
        <input
          ref={inputRef}
          type="file"
          hidden
          // @ts-expect-error — non-standard but supported everywhere that matters
          webkitdirectory=""
          directory=""
          multiple
          onChange={(e) => e.target.files && run(e.target.files)}
        />
      </main>

      <MktFooter navigate={navigate} />
    </div>
  )
}

/* ─────────────────────────────── 1 · the door ─────────────────────────────── */

function Door({ onPick, error }: { onPick: () => void; error: string | null }) {
  return (
    <section className="aud__door">
      <h1>Find the design system your code already has.</h1>
      <p className="aud__lede">
        Point it at a folder. It reads the decisions your codebase already implies —
        and measures how far the code has drifted from them.
      </p>

      <button type="button" className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={onPick}>
        <FolderOpen size={18} strokeWidth={1.9} /> Choose a folder
      </button>
      <p className="aud__hint">Pick one app, not a monorepo root · node_modules is skipped</p>

      {error && <p className="aud__error">{error}</p>}

      <ul className="aud__promises">
        <li><b>Your code is never sent anywhere.</b> The scan runs in this tab. Open your network panel and
          check: the only request is us handing you the kit vocabulary — nothing travels the other way.</li>
        <li><b>No score it cannot justify.</b> Below 70% readable, it refuses to grade rather than publish a number over code it could not read.</li>
        <li><b>It measures coherence, not taste.</b> One ugly button reused everywhere scores perfectly. That is the honest limit.</li>
      </ul>
    </section>
  )
}

function Reading() {
  return (
    <section className="aud__door">
      <h1 className="aud__reading">Reading your code…</h1>
      <p className="aud__lede">Everything stays on this machine.</p>
    </section>
  )
}

/* ────────────────────────── 2 · recognition, no verdict ───────────────────── */

function Recognise({
  result, scan, onContinue, onReset,
}: {
  result: ReturnType<typeof auditFiles>
  scan: ScanResult
  onContinue: () => void
  onReset: () => void
}) {
  const meta = result.meta
  const stack = meta.stack
  const unread = Object.entries(meta.unreadable ?? {}) as [string, number][]
  const pct = (n: number) => `${Math.round(n * 100)}%`

  return (
    <section className="aud__panel">
      <h2>That looks like {scan.rootName}</h2>
      <p className="aud__lede">
        Before the findings — here is exactly what was read, and what wasn&rsquo;t.
        Check it against what you know is in there.
      </p>

      <div className="aud__chips">
        {stack.framework && <span className="aud__chip is-key">{stack.framework.name} {stack.framework.version}</span>}
        {stack.meta && <span className="aud__chip is-key">{stack.meta.name}</span>}
        {stack.typescript && <span className="aud__chip">TypeScript</span>}
        {stack.styling.map((s: { kind: string; version: string | null }) => (
          <span className="aud__chip" key={s.kind}>{s.kind}{s.version ? ` v${s.version}` : ''}</span>
        ))}
        {stack.componentLibraries.map((l: string) => <span className="aud__chip" key={l}>{l}</span>)}
      </div>

      <ul className="aud__rows">
        <Row ok label="Files read" sub={stack.styling.map((s: { detail: string }) => s.detail).join(' · ')} n={meta.files.toLocaleString('en-US')} />
        <Row ok label="Styled elements found" sub="every place a value is applied" n={meta.elements.toLocaleString('en-US')} />
        {unread.map(([reason, n]) => (
          <Row key={reason} label="Could not be read" sub={`${reason.replace(/-/g, ' ')} — excluded, never guessed`} n={n.toLocaleString('en-US')} />
        ))}
        {scan.skipped.tooBig > 0 && (
          <Row label="Skipped as generated" sub="single files over 512 KB" n={scan.skipped.tooBig.toLocaleString('en-US')} />
        )}
        <Row ok label="Your code that left this machine" sub="not read, not sent, not stored — the scan ran here" n="0 bytes" />
      </ul>

      <div className="aud__meter">
        <div className="aud__meter-bar"><span style={{ width: pct(meta.parsed) }} /></div>
        <div className="aud__meter-lbl">
          <span>scan coverage</span>
          <span>{pct(meta.parsed)}{result.refused ? ' — under the 70% floor' : ' — above the 70% floor'}</span>
        </div>
      </div>

      <div className="aud__foot">
        <p className="aud__hint">
          Not what you expected? Re-scan a narrower folder — one app, not the monorepo root.
        </p>
        <div className="aud__actions">
          <button type="button" className="mkt-btn mkt-btn--ghost" onClick={onReset}>
            <RotateCcw size={15} strokeWidth={1.9} /> Re-scan
          </button>
          <button type="button" className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={onContinue}>
            Show me what you found <ArrowRight size={17} strokeWidth={2} />
          </button>
        </div>
      </div>
    </section>
  )
}

function Row({ ok, label, sub, n }: { ok?: boolean; label: string; sub: string; n: string }) {
  return (
    <li className={`aud__row${ok ? ' is-ok' : ' is-flag'}`}>
      <span className="aud__row-i">{ok ? '✓' : '!'}</span>
      <span className="aud__row-t">{label}<span>{sub}</span></span>
      <span className="aud__row-n">{n}</span>
    </li>
  )
}

/* ───────────────────────────── 3 · the findings ───────────────────────────── */

function Findings({
  result, onDownload, onReset, navigate,
}: {
  result: ReturnType<typeof auditFiles>
  onDownload: () => void
  onReset: () => void
  navigate: (to: string) => void
}) {
  // The exact document the CLI writes, rendered here. Sandboxed: it is generated
  // from the visitor's own code, so it is treated as untrusted content.
  const html = renderReport(result)
  return (
    <section className="aud__findings">
      <div className="aud__findings-bar">
        <div className="aud__actions">
          <button type="button" className="mkt-btn mkt-btn--ghost" onClick={onReset}>
            <RotateCcw size={15} strokeWidth={1.9} /> Scan another
          </button>
          <button type="button" className="mkt-btn mkt-btn--ghost" onClick={onDownload}>
            <Download size={15} strokeWidth={1.9} /> Download the report
          </button>
        </div>
        {/* The bridge. If the audit is a wedge this is the number that says so;
            if it is a product in its own right, this stays near zero and that is
            an answer too. */}
        <button type="button" className="mkt-btn mkt-btn--primary" onClick={() => { ping('audit', 'bridge'); navigate('/app') }}>
          Build the kit that fixes this <ArrowRight size={16} strokeWidth={2} />
        </button>
      </div>
      <iframe
        className="aud__frame"
        title="Your audit report"
        sandbox=""
        srcDoc={html}
      />
    </section>
  )
}
