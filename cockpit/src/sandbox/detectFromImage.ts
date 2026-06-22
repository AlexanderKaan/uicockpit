/* Sandbox · Phase 2 — VISION detection for screenshots.
 *
 * One model call reads a screenshot and returns BOTH structure (the ordered block
 * list) AND foundation+content (mode, brand colour, app name, nav, heading) — the
 * reliable way to "identify your blocks" from pixels, where DOM/OCR heuristics are
 * flaky. The model call lives behind a tiny worker (worker/vision.ts) so the API
 * key never ships to the client; this module just POSTs the image to it.
 *
 * GRACEFUL: if no endpoint is configured (VITE_SANDBOX_VISION_URL unset) or the
 * call fails, returns null and the caller falls back to pixel-foundation + OCR +
 * the default board. So the app always works; vision is an upgrade, not a gate. */

import type { Config } from '../tokens/types'
import type { Extraction, Facet, Confidence } from './extractFoundation'
import { parseColor, nearestTheme, hslToHexLocal } from './extractFoundation'
import type { Content } from './extractContent'
import type { BlockKind } from './SandboxBoard'

/** The JSON contract the worker (and the vision model) return. */
export interface VisionResult {
  mode?: 'light' | 'dark'
  brandHex?: string
  neutral?: 'auto' | 'cool' | 'warm' | 'neutral'
  blocks?: BlockKind[]
  appName?: string
  nav?: string[]
  heading?: string
  primaryBtn?: string
  tableTitle?: string
  columns?: string[]
  rows?: string[][]
  stats?: Array<{ value?: string; label?: string }>
  filters?: string[]
  cards?: Array<{ title?: string; meta?: string }>
  notice?: string
  navGroups?: Array<{ label?: string; items?: string[] }>
  summary?: Array<{ title?: string; rows?: Array<{ label?: string; value?: string }> }>
  feed?: Array<{ title?: string; sub?: string; status?: string; amount?: string }>
}

/** Clamp a model-returned 2-D array to rows×cells, coercing every cell to a string. */
function toRows(v: unknown, maxRows: number, maxCells: number): string[][] | undefined {
  if (!Array.isArray(v)) return undefined
  const rows = v.filter(Array.isArray).slice(0, maxRows)
    .map((row) => (row as unknown[]).slice(0, maxCells).map((c) => String(c ?? '')))
  return rows.length ? rows : undefined
}
const toStrs = (v: unknown, n: number): string[] | undefined =>
  Array.isArray(v) ? v.map((s) => String(s ?? '')).filter(Boolean).slice(0, n) : undefined

export interface DetectedFromImage { extraction: Extraction; content: Content; blocks: BlockKind[] }

const ENDPOINT = (import.meta.env.VITE_SANDBOX_VISION_URL as string | undefined) || ''
export const visionConfigured = !!ENDPOINT

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(new Error('read failed'))
    r.readAsDataURL(file)
  })
}

function toExtraction(v: VisionResult): Extraction {
  const config: Partial<Config> = {}
  const confidence: Record<Facet, Confidence> = {
    brand: 'none', neutral: 'none', radius: 'none', font: 'none', density: 'none', elevation: 'none', typeSize: 'none',
  }
  const notes: string[] = ['read by vision model']
  const hsl = v.brandHex ? parseColor(v.brandHex) : null
  if (hsl && hsl.s >= 12) {
    config.color = 'tone'; config.colorTheme = nearestTheme(hsl.h); config.cPrimary = hslToHexLocal(hsl.h, hsl.s, hsl.l)
    confidence.brand = 'high'
  } else { config.color = 'mono'; config.colorTheme = 'mono'; confidence.brand = 'low' }
  if (v.mode) config.mode = v.mode
  if (v.neutral) { config.neutral = v.neutral; confidence.neutral = 'high' }
  return { config, confidence, notes }
}

/** POST the screenshot to the vision worker → structure + foundation + content.
 *  Returns null when unconfigured or on any failure (caller falls back). */
export async function detectFromImage(file: File): Promise<DetectedFromImage | null> {
  if (!ENDPOINT) return null
  try {
    const image = await fileToDataUrl(file)
    const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image }) })
    if (!r.ok) return null
    const v = (await r.json()) as VisionResult
    if (!v || typeof v !== 'object') return null
    const stats = Array.isArray(v.stats)
      ? v.stats.map((s) => ({ value: String(s?.value ?? ''), label: String(s?.label ?? '') }))
          .filter((s) => s.value || s.label).slice(0, 4)
      : undefined
    const cards = Array.isArray(v.cards)
      ? v.cards.map((c) => ({ title: String(c?.title ?? ''), meta: String(c?.meta ?? '') }))
          .filter((c) => c.title).slice(0, 6)
      : undefined
    const navGroups = Array.isArray(v.navGroups)
      ? v.navGroups.map((g) => ({ label: String(g?.label ?? ''), items: (toStrs(g?.items, 8) ?? []) }))
          .filter((g) => g.label && g.items.length).slice(0, 6)
      : undefined
    const summary = Array.isArray(v.summary)
      ? v.summary.map((c) => ({
          title: String(c?.title ?? ''),
          rows: (Array.isArray(c?.rows)
            ? c.rows.map((r) => ({ label: String(r?.label ?? ''), value: String(r?.value ?? '') })).filter((r) => r.label || r.value).slice(0, 4)
            : []),
        })).filter((c) => c.title && c.rows.length).slice(0, 4)
      : undefined
    const feed = Array.isArray(v.feed)
      ? v.feed.map((f) => ({ title: String(f?.title ?? ''), sub: String(f?.sub ?? ''), status: String(f?.status ?? ''), amount: String(f?.amount ?? '') }))
          .filter((f) => f.title).slice(0, 8)
      : undefined
    return {
      extraction: toExtraction(v),
      content: {
        appName: v.appName,
        menu: toStrs(v.nav, 6) ?? [],
        heading: v.heading,
        primaryBtn: v.primaryBtn,
        tableTitle: v.tableTitle,
        columns: toStrs(v.columns, 6),
        rows: toRows(v.rows, 6, 6),
        stats: stats && stats.length ? stats : undefined,
        filters: toStrs(v.filters, 5),
        cards: cards && cards.length ? cards : undefined,
        notice: typeof v.notice === 'string' && v.notice.trim() ? v.notice.trim() : undefined,
        navGroups: navGroups && navGroups.length ? navGroups : undefined,
        summary: summary && summary.length ? summary : undefined,
        feed: feed && feed.length ? feed : undefined,
      },
      blocks: Array.isArray(v.blocks) ? v.blocks : [],
    }
  } catch {
    return null
  }
}
