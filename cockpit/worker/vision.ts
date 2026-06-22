/* UICockpit — Sandbox VISION endpoint (Phase 2).
 *
 *   POST /vision   body: { image: "data:image/png;base64,..." }
 *   → { mode, brandHex, neutral, blocks[], appName, nav[], heading, primaryBtn }
 *
 * One model call reads a screenshot's STRUCTURE (the ordered block list) + its
 * FOUNDATION (light/dark, brand colour, neutral temp) + CONTENT (app name, nav,
 * heading, primary action). The key stays server-side (never shipped to the
 * client). The cockpit's `detectFromImage` posts here; if this isn't deployed /
 * configured, the app falls back to the offline pixel+OCR pipeline.
 *
 * Activate: set the Worker secret `ANTHROPIC_API_KEY` (and optionally
 * `VISION_MODEL`), deploy, then point the app at it with
 * `VITE_SANDBOX_VISION_URL=https://<worker>/vision` at build time. */

export interface VisionEnv {
  ANTHROPIC_API_KEY?: string
  /** Override the vision-capable model id (defaults below). */
  VISION_MODEL?: string
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
} as const

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...CORS } })

const BLOCKS = 'sidebar, appbar, toolbar, tabnav, searchbar, filterbar, statstrip, datatable, list, banner, cardgrid, form'

const PROMPT = `You are analysing a SCREENSHOT of a web-app UI. Identify the layout BLOCKS it is built from, read its design foundation, and transcribe its key TEXT. Reply with ONLY a JSON object (no prose, no markdown fence). Keys:
- "mode": "light" or "dark" (the page background).
- "brandHex": the primary/accent colour as #rrggbb (the brand button or logo colour). Omit if greyscale.
- "neutral": "cool", "warm", or "neutral" (the grey tint).
- "blocks": ordered top-to-bottom array, ONLY from this vocabulary: [${BLOCKS}]. Include ONLY blocks that are actually visible — do NOT add "statstrip" unless you can see metric/KPI tiles. Use "list" for a feed / activity / transaction STREAM (rows of icon+title with a status or amount, NOT a columnar grid) and "datatable" ONLY for a real table with column headers. Use "banner" for an info/notice strip above the content. Use "sidebar" for a left nav rail (else "tabnav" for top tabs). Order matters.
- "appName": the product/brand name as readable TEXT only. If the logo is a glyph/icon with no readable wordmark, OMIT this key. NEVER transcribe decorative symbols (e.g. ©, =, the hamburger, a coloured dot).
- "nav": the sidebar or top-nav item labels, in order, max 6. Each entry is ONE COMPLETE label exactly as shown — a label may be several words (e.g. "Onderweg naar mij"); never split one label into multiple entries, and never include table column headers or bare icons.
- "heading": the main page title — the bold H1 above the main content or in the top bar. OMIT if there is no clear single title.
- "primaryBtn": the most prominent call-to-action button label.
- "tableTitle": the title of the main data table or list, if one is present.
- "columns": the data table's column header labels, in order, max 6.
- "rows": up to 6 data rows; each row is an array of the cell texts in column order (max 6 cells). Transcribe the real cell text; skip icon-only cells.
- "stats": up to 4 KPI tiles as {"value":"...","label":"..."} — ONLY if metric tiles are actually visible.
- "filters": the filter/segment chip labels in a filter bar (the pill row above a list, e.g. "All", "Active", "Archived"), in order, max 5 — the chip TEXT only. NEVER invent counts. Omit if there is no filter bar.
- "cards": if a CARD GRID is visible (a grid of project/file/entity tiles, not a table), up to 6 as {"title":"...","meta":"..."} — title = the card's heading text, meta = a short status/subtitle if shown (else omit meta). Real text only. Omit the key entirely if there is no card grid.
- "rows": if the main content is a "list" feed (not a table), STILL fill rows — each row = [title, sub/desc, status-or-amount] — so the list renders the real items.
- "notice": the text of an info/notice banner if one is shown (e.g. "4 new documents ready to add"), ONE short line, real text only. Omit if there is no banner.
Omit any key you cannot read confidently — a missing key is better than a guessed one. Output JSON only.`

/** Pull the first JSON object out of a model reply (tolerates stray prose/fences). */
function parseJson(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return {}
  try { return JSON.parse(m[0]) } catch { return {} }
}

export async function handleVision(request: Request, env: VisionEnv): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (request.method !== 'POST') return json({ error: 'POST an image' }, 405)
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'vision not configured' }, 501)

  let image = ''
  try { image = (await request.json<{ image?: string }>()).image ?? '' } catch { return json({ error: 'bad body' }, 400) }
  const m = image.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/)
  if (!m) return json({ error: 'expected a base64 image data URL' }, 400)
  // The Messages API only accepts image/jpeg (not image/jpg).
  const mediaType = m[1] === 'image/jpg' ? 'image/jpeg' : m[1]

  const body = {
    model: env.VISION_MODEL || 'claude-opus-4-8',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: m[2] } },
        { type: 'text', text: PROMPT },
      ],
    }],
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '')
      return json({ error: `model ${resp.status}`, detail: detail.slice(0, 400) }, 502)
    }
    const data = await resp.json<{ content?: Array<{ text?: string }> }>()
    const text = data.content?.[0]?.text ?? ''
    return json(parseJson(text))
  } catch {
    return json({ error: 'model call failed' }, 502)
  }
}
