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

const BLOCKS = 'sidebar, appbar, toolbar, tabnav, searchbar, filterbar, statstrip, datatable, cardgrid, form'

const PROMPT = `You are analysing a SCREENSHOT of a web app UI. Identify which layout BLOCKS it is built from and read its design foundation + key text. Reply with ONLY a JSON object (no prose, no markdown fence), with these keys:
- "mode": "light" or "dark" (the page background).
- "brandHex": the primary/accent colour as #rrggbb (the brand button / logo colour). Omit if greyscale.
- "neutral": "cool", "warm", or "neutral" (the grey tint).
- "blocks": an ordered top-to-bottom array drawn ONLY from this vocabulary: [${BLOCKS}]. Use "sidebar" for a left nav rail (else "tabnav" for top tabs). Include every block you see; order matters.
- "appName": the product/brand name (short).
- "nav": up to 6 navigation labels, in order.
- "heading": the main page heading.
- "primaryBtn": the most prominent call-to-action button label.
Omit any key you cannot read. Output JSON only.`

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
    model: env.VISION_MODEL || 'claude-sonnet-4-6',
    max_tokens: 700,
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
