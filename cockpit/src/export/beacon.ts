/**
 * Export beacon — a cookieless, PII-free "an export happened" ping so export
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
 * We deliberately count only the unambiguous "the kit left the app" moments —
 * a file download, the .zip, and copying the hosted `<link>` URL. Copy-to-
 * clipboard of raw code isn't counted (users copy repeatedly → noisy).
 */
const CDN = 'https://kit.uicockpit.com'

export function pingExport(kind: string, fmt?: string): void {
  try {
    // Only from the live site — never count dev / localhost / preview exports.
    if (!/(^|\.)uicockpit\.com$/.test(location.hostname)) return
    const qs = new URLSearchParams({ kind })
    if (fmt) qs.set('fmt', fmt)
    const url = `${CDN}/e?${qs.toString()}`
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url)) return
    void fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true }).catch(() => {})
  } catch {
    /* analytics must never break an export */
  }
}
