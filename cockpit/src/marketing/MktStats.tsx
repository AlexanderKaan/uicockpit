import { COMPONENT_PAGES } from '../stage/views/ComponentGallery'
import EVIDENCE from '../kit/evidence.json'

/**
 * Shared trust/stats strip — the $0 lead tile + three hard numbers. Used on the
 * landing page and every SEO landing page so "free" + the proof points read
 * the same everywhere (one source, no drift). Render inside a `.mkt__container`.
 *
 * The numbers are DERIVED, not typed: the component count is the registry the
 * /components index renders (it read "100+" here while the reference had 57
 * pages — a number nobody could click through to), and the WCAG number is the
 * sum of axe findings in src/kit/evidence.json, which `npm run gen:evidence`
 * writes from a real run — the same file every component page shows.
 */
type Ev = { measured: boolean; axeFindings?: number }
const measured = Object.values(EVIDENCE.components as Record<string, Ev>).filter((e) => e.measured)
const findings = measured.reduce((n, e) => n + (e.axeFindings ?? 0), 0)

export function MktStats() {
  return (
    <div className="mkt__stats">
      <div className="mkt__stat mkt__stat--free">
        <div className="mkt__stat-num">$0</div>
        <div className="mkt__stat-label">Forever free</div>
      </div>
      <div className="mkt__stat">
        <div className="mkt__stat-num">{COMPONENT_PAGES.length}</div>
        <div className="mkt__stat-label">Components, each with a source</div>
      </div>
      <div className="mkt__stat">
        <div className="mkt__stat-num">{findings}</div>
        <div className="mkt__stat-label">WCAG 2.2 AA findings across {EVIDENCE.configurations.length} configurations</div>
      </div>
      <div className="mkt__stat">
        <div className="mkt__stat-num">7</div>
        <div className="mkt__stat-label">Export formats</div>
      </div>
    </div>
  )
}
