import { useEffect, type CSSProperties } from 'react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'
import { IconProvider } from '../icons/Icon'
import { buildTokens } from '../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import { STYLE_KITS } from '../tokens/styleKits'
import { encode } from '../state/hash'
import type { Config } from '../tokens/types'

/**
 * /styles (IA-5) — the named style kits as a gallery, our answer to Astryx's
 * Themes page. But where Astryx ships 7 hand-written themes you pick from, each
 * card here is a LIVE specimen rendered in that kit's tokens, and "Use this kit"
 * opens the configurator ON it (a full starting point you then tune — generated,
 * not picked). One source: STYLE_KITS.
 */
function Specimen({ config }: { config: Partial<Config> }) {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const tokens = buildTokens(cfg).vars as CSSProperties
  // NB: no `.cockpit-preview` scope — that carries the app-stage min-height. The
  // kit recipes are injected UNSCOPED (`.card`/`.btn`/`.in`) and the `--k-*`
  // tokens ride on this div's inline style, so a plain themed div is exactly a
  // real consumer context — the specimen sizes to its content.
  return (
    <div className="mkt__style-specimen" style={tokens}>
      <IconProvider set={cfg.iconSet}>
        <div className="card">
          <div className="card__head">
            {/* Lead with a LARGE display line — the display font + weight is the
                loudest thing a style changes (serif / mono / ultralight), but it's
                invisible at title size. At h1 the difference is unmistakable. */}
            <div className="mkt__style-spec-display">Invoice</div>
            <div className="card__desc">#00042 · due in 14 days · $2,400.00</div>
          </div>
          <div className="card__row" style={{ gap: 'var(--k-s-8)', flexWrap: 'wrap' }}>
            <span className="badge badge--solid-primary">Paid</span>
            <span className="badge">Draft</span>
          </div>
          <input className="in" placeholder="client@acme.inc" aria-label="Email" />
          <div className="card__row" style={{ gap: 'var(--k-s-8)' }}>
            <button type="button" className="btn btn--primary btn--sm">Send</button>
            <button type="button" className="btn btn--ghost btn--sm">Preview</button>
          </div>
        </div>
      </IconProvider>
    </div>
  )
}

export function StylesPage({ navigate }: { navigate: (to: string) => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = 'Styles — named starting points you tune into your own — UIcockpit'
    return () => { document.title = prev }
  }, [])
  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="styles" />
      <section className="mkt__section">
        <div className="mkt__container">
          <div className="mkt__section-head">
            <div className="mkt__eyebrow">
              <span className="mkt__eyebrow-dot" />
              Styles
            </div>
            <h1>Start from a style. Make it yours.</h1>
            <p className="mkt__section-sub">
              Seven named starting points — Linear-crisp, Vercel-mono, Stripe-refined, and more.
              A design system would hand you these as fixed themes; here each one opens the
              configurator, so it&apos;s a <em>starting point you tune</em>, not a preset you settle for.
            </p>
          </div>
          <div className="mkt__style-grid">
            {STYLE_KITS.map((kit) => (
              <div className="mkt__style-card" key={kit.id}>
                <Specimen config={kit.config} />
                <div className="mkt__style-meta">
                  <div className="mkt__style-name">{kit.name}</div>
                  <div className="mkt__style-blurb">{kit.blurb}</div>
                  <a
                    href={`/app#${encode({ ...DEFAULT_CONFIG, ...kit.config })}`}
                    className="mkt-btn mkt-btn--ghost mkt__style-use"
                  >
                    Use this style →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <MktFooter navigate={navigate} />
    </div>
  )
}
