/**
 * UICockpit — Live Kit CDN Worker.
 *
 * Serves a configured design-system kit over HTTP, reusing the EXACT same pure
 * generators the app's download export uses (`decode` + gen*), so the hosted
 * artefacts are byte-identical to what you'd download. The hash IS the config.
 *
 *   GET /k/<hash>.css            → genCss      — tokens.css (the full kit)
 *   GET /k/<hash>.contract.json  → genContract — the machine-checkable contract (check)
 *   GET /k/<hash>.rules.md       → genSkill    — agent rules, written as AGENTS.md
 *   GET /k/<hash>.design.md      → genDesignMd — the full spec + recipe catalog
 *
 *   (Stateful lanes /kit/<id>.css live+pinned, KV-backed, land with the publish
 *    flow — see ~/.claude/plans/live-kit-cdn.md P2.)
 *
 * Local dev:  npx wrangler dev   →  curl 'http://localhost:8787/k/<hash>.css'
 */
import { decode } from '../src/state/hash'
import { genCss } from '../src/export/genCss'
import { genContract } from '../src/export/genContract'
import { genSkill } from '../src/export/genSkill'
import { genDesignMd } from '../src/export/genDesignMd'
import type { Config } from '../src/tokens/types'

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
} as const

// The hash IS the config, so a URL's output only changes when WE change a
// generator (a recipe fix, a token change). Cache moderately + serve
// stale-while-revalidating so our fixes reach already-distributed links within
// minutes. (NOT `immutable` — that froze the type-scale bug for every consumer
// for up to a year; correctness-of-fixes beats a few saved origin hits.)
const CACHE = 'public, max-age=600, stale-while-revalidate=86400'

interface Route {
  re: RegExp
  type: string
  gen: (cfg: Config) => string
  bad: string
}
const ROUTES: Route[] = [
  { re: /^\/k\/(.+)\.contract\.json$/, type: 'application/json; charset=utf-8', gen: genContract, bad: '{"error":"invalid or empty kit key"}' },
  { re: /^\/k\/(.+)\.rules\.md$/, type: 'text/markdown; charset=utf-8', gen: genSkill, bad: 'UICockpit: invalid or empty kit key' },
  { re: /^\/k\/(.+)\.design\.md$/, type: 'text/markdown; charset=utf-8', gen: genDesignMd, bad: 'UICockpit: invalid or empty kit key' },
  { re: /^\/k\/(.+)\.css$/, type: 'text/css; charset=utf-8', gen: genCss, bad: '/* UICockpit: invalid or empty kit key */' },
]

export default {
  fetch(request: Request): Response {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    const { pathname } = new URL(request.url)
    for (const r of ROUTES) {
      const m = pathname.match(r.re)
      if (!m) continue
      const headers: Record<string, string> = { 'content-type': r.type, ...CORS }
      const cfg = decode(safeDecodeURIComponent(m[1]))
      if (!cfg) return new Response(r.bad, { status: 400, headers })
      return new Response(r.gen(cfg), { headers: { ...headers, 'cache-control': CACHE } })
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
