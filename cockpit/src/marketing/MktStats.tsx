/**
 * Shared trust/stats strip — the $0 lead tile + 4 hard numbers. Used on the
 * landing page and every SEO landing page so "free" + the proof points read
 * the same everywhere (one source, no drift). Render inside a `.mkt__container`.
 */
export function MktStats() {
  return (
    <div className="mkt__stats">
      <div className="mkt__stat mkt__stat--free">
        <div className="mkt__stat-num">$0</div>
        <div className="mkt__stat-label">Forever free</div>
      </div>
      <div className="mkt__stat">
        <div className="mkt__stat-num">250+</div>
        <div className="mkt__stat-label">Design tokens</div>
      </div>
      <div className="mkt__stat">
        <div className="mkt__stat-num">100+</div>
        <div className="mkt__stat-label">UI components</div>
      </div>
      <div className="mkt__stat">
        <div className="mkt__stat-num">16</div>
        <div className="mkt__stat-label">WCAG checks</div>
      </div>
      <div className="mkt__stat">
        <div className="mkt__stat-num">7</div>
        <div className="mkt__stat-label">Export formats</div>
      </div>
    </div>
  )
}
