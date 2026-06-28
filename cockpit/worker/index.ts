/**
 * UICockpit — Live Kit CDN Worker.
 *
 * Serves a configured design-system kit as CSS over HTTP, reusing the EXACT same
 * pure pipeline the app's download export uses (`decode` + `genCss`), so the
 * hosted `<link>` is byte-identical to the file you'd download. No engine rewrite.
 *
 *   GET /k/<hash>.css   → stateless: genCss(decode(hash)). The hash IS the content
 *                         (the app's share-URL payload), so the response is immutable
 *                         and cached hard. "Free" lane — no backend, no storage.
 *
 *   (Stateful lanes /kit/<id>.css live+pinned, KV-backed, land with the publish
 *    flow — see ~/.claude/plans/live-kit-cdn.md P2.)
 *
 * Local dev:  npx wrangler dev   →  curl 'http://localhost:8787/k/<hash>.css'
 * Deploy lands with #106 (Cloudflare Pages + DNS).
 */
import { decode } from '../src/state/hash'
import { genCss } from '../src/export/genCss'

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
} as const

const cssResponse = (css: string, init: ResponseInit = {}): Response =>
  new Response(css, {
    ...init,
    headers: {
      'content-type': 'text/css; charset=utf-8',
      ...CORS,
      ...(init.headers ?? {}),
    },
  })

export default {
  fetch(request: Request): Response | Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    const { pathname } = new URL(request.url)

    // Stateless kit: /k/<hash>.css  →  genCss(decode(hash))
    const stateless = pathname.match(/^\/k\/(.+)\.css$/)
    if (stateless) {
      const hash = safeDecodeURIComponent(stateless[1])
      const cfg = decode(hash)
      if (!cfg) {
        return cssResponse('/* UICockpit: invalid or empty kit key */', { status: 400 })
      }
      return cssResponse(genCss(cfg), {
        headers: {
          // hash = content → never changes for this URL → cache forever.
          'cache-control': 'public, max-age=31536000, immutable',
        },
      })
    }

    return new Response('UICockpit Kit CDN — try /k/<hash>.css', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8', ...CORS },
    })
  },
}

/** decodeURIComponent that never throws (a malformed key returns the raw input). */
function safeDecodeURIComponent(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}
