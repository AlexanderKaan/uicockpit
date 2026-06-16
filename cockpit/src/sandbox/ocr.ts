/* Sandbox · Slice 5 — CONTENT from a screenshot via OCR (tesseract.js).
 *
 * A screenshot is the IDEAL content source: OCR reads the real rendered strings,
 * sidestepping the dynamic-JSX problem (raw React gives you `{label}` / i18n keys,
 * never the words). tesseract.js is heavy (~wasm + a worker + a lang file), so it's
 * dynamically imported here — it only loads when someone actually drops an image.
 *
 * Strictly ADDITIVE and FAIL-SOFT: any failure (decode, worker, empty result)
 * resolves to empty content and the board falls back to its sensible defaults.
 * Foundation-from-pixels still themes the board; OCR just brings the words in. */

import type { Content } from './extractContent'

interface Word { text: string; x0: number; y0: number; x1: number; y1: number; h: number }

/* Defensive flatten — tesseract.js has shuffled its result shape across majors
 * (words at top level vs nested under blocks→paragraphs→lines). Walk whatever
 * exists and collect bbox'd words; never assume one layout. */
function collectWords(data: any): Word[] {
  const out: Word[] = []
  const push = (arr: any[]) => {
    for (const w of arr || []) {
      const t = (w?.text ?? '').trim()
      const bb = w?.bbox
      if (t && bb) out.push({ text: t, x0: bb.x0, y0: bb.y0, x1: bb.x1, y1: bb.y1, h: bb.y1 - bb.y0 })
    }
  }
  if (data?.words?.length) push(data.words)
  else for (const b of data?.blocks ?? []) for (const p of b?.paragraphs ?? []) for (const l of p?.lines ?? []) push(l?.words ?? [])
  return out
}

/* Group words into reading-order LINES (same row, left→right) → joined text.
 * Two words share a line only if they vertically overlap AND are horizontally
 * adjacent — a big x-gap means different columns (a sidebar label vs a main
 * heading on the same row must NOT merge into one phrase). */
interface Line { text: string; x0: number; y0: number; h: number; words: Word[] }
function groupLines(words: Word[], imgW: number): Line[] {
  const sorted = [...words].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)
  const bands: Word[][] = []
  for (const w of sorted) {
    const last = bands[bands.length - 1]
    if (last && Math.abs(w.y0 - last[0]!.y0) < last[0]!.h * 0.6) last.push(w)
    else bands.push([w])
  }
  const lines: Line[] = []
  const gapMax = imgW * 0.06 // a gap wider than ~6% of the image = a column break
  for (const band of bands) {
    const ws = band.sort((a, b) => a.x0 - b.x0)
    let run: Word[] = [ws[0]!]
    const flush = () => {
      lines.push({
        text: run.map((w) => w.text).join(' ').replace(/\s+/g, ' ').trim(),
        x0: Math.min(...run.map((w) => w.x0)),
        y0: Math.min(...run.map((w) => w.y0)),
        h: Math.max(...run.map((w) => w.h)),
        words: run,
      })
    }
    for (let i = 1; i < ws.length; i++) {
      const gap = ws[i]!.x0 - ws[i - 1]!.x1
      if (gap > Math.max(gapMax, ws[i]!.h * 2)) { flush(); run = [ws[i]!] }
      else run.push(ws[i]!)
    }
    flush()
  }
  return lines
}

const wordy = (s: string) => /[a-z]/i.test(s) && !/^[\d.,:%$€£\-/]+$/.test(s)

/** OCR an image File → best-effort Content. Always resolves (never throws). */
export async function ocrContent(file: File, onProgress?: (p: number) => void): Promise<Content> {
  try {
    // tesseract.js v5+: `recognize`'s output defaults to { text: true } only — word
    // & block BBOXES (which our positional heuristics need) must be requested via
    // the 3rd `output` arg. Use the worker form to pass { blocks: true }.
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng', undefined, {
      logger: (m: { status?: string; progress?: number }) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') onProgress?.(m.progress)
      },
    } as any)
    let data: any
    try { ({ data } = await worker.recognize(file, {}, { blocks: true } as any)) }
    finally { await worker.terminate() }

    const words = collectWords(data)
    if (!words.length) return { menu: [] }
    const W = Math.max(1, ...words.map((w) => w.x1))
    const H = Math.max(1, ...words.map((w) => w.y1))
    const lines = groupLines(words, W)

    // APP NAME — the top-left line (logo wordmark sits there), short + wordy.
    const appName = lines.find((l) => l.y0 < H * 0.16 && l.x0 < W * 0.4 && wordy(l.text) && l.text.length <= 24)?.text

    // HEADING — the largest-type line in the upper 65%, excluding the app name.
    const heading = [...lines]
      .filter((l) => l.y0 < H * 0.65 && wordy(l.text) && l.text.length >= 2 && l.text.length <= 48 && l.text !== appName)
      .sort((a, b) => b.h - a.h)[0]?.text

    // MENU — short wordy tokens hugging the LEFT column (a sidebar) or, failing
    // that, the top band (a top nav). Dedup, keep reading order, cap at 6.
    const isLabel = (t: string) => wordy(t) && t.length >= 2 && t.length <= 18 && t.split(/\s+/).length <= 2
    const leftCol = words.filter((w) => w.x0 < W * 0.22 && w.y0 > H * 0.14 && isLabel(w.text))
    const topBand = words.filter((w) => w.y0 < H * 0.12 && w.x0 > W * 0.2 && isLabel(w.text))
    const pool = leftCol.length >= 3 ? leftCol : topBand
    const seen = new Set<string>()
    const menu: string[] = []
    for (const w of pool.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)) {
      const key = w.text.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key); menu.push(w.text)
      if (menu.length >= 6) break
    }

    return { appName, heading, menu }
  } catch {
    return { menu: [] } // fail-soft: foundation-from-pixels still themes the board
  }
}
