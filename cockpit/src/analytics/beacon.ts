/**
 * Product beacon — a cookieless, PII-free "an export happened" ping so export
 * counts show up in **Cloudflare Worker analytics** (no Google Analytics, no
 * cookies, no consent banner). Fires a request to the kit CDN worker's `/e`
 * route (which 204s and stores nothing); you then read the count in the
 * Cloudflare dashboard (Workers & Pages → the worker → Metrics) or the GraphQL
 * Analytics API, filtered on path `/e` and split by the `?kind` / `?fmt` params.
 *
 * `sendBeacon` is used first so the ping survives the download / navigation that
 * follows; a `keepalive` fetch is the fallback. It never throws and never blocks
 * the export — analytics must not be able to break the product.
 *
 * Counts only unambiguous, decision-shaped moments — never every click. Today:
 * exports (a download, the .zip, copying the hosted link) and the two front
 * doors plus the audit funnel. Copy-to-clipboard of raw code is not counted;
 * people copy repeatedly and it would drown the signal.
 *
 * The door counters exist to settle a question we could not reason our way
 * through: is the checker the product, or the wedge? Heavy audit and light
 * configure says one thing; audit followed by the bridge into the kit says
 * another. Both are cheap to measure and impossible to argue about.
 */
const CDN = 'https://kit.uicockpit.com'

export function ping(kind: string, detail?: string): void {
  try {
    // Only from the live site — never count dev / localhost / preview exports.
    if (!/(^|\.)uicockpit\.com$/.test(location.hostname)) return
    const qs = new URLSearchParams({ kind })
    if (detail) qs.set('fmt', detail)
    const url = `${CDN}/e?${qs.toString()}`
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url)) return
    void fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true }).catch(() => {})
  } catch {
    /* analytics must never break the product */
  }
}
