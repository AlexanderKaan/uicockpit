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
const SpecStar = ({ empty }: { empty?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={empty ? 'rating__star--empty' : undefined} aria-hidden="true">
    <path d="M12 2.6l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.5l-5.6 3.2 1.4-6.3L3 9.1l6.4-.6z" />
  </svg>
)

function Specimen({ config }: { config: Partial<Config> }) {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const tokens = buildTokens(cfg).vars as CSSProperties
  // NB: no `.cockpit-preview` scope — that carries the app-stage min-height. The
  // kit recipes are injected UNSCOPED (`.card`/`.btn`/`.in`) and the `--k-*`
  // tokens ride on this div's inline style, so a plain themed div is exactly a
  // real consumer context — the specimen sizes to its content. A small CLUSTER
  // of different component TYPES (not one solo card) so a style's radius, accent,
  // font, weight and surface all show at once — the OG-collage idea, compact.
  const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 'var(--k-s-8)' }
  const between: CSSProperties = { ...row, justifyContent: 'space-between' }
  // A small BOUQUET of real, self-contained components floating on the kit's
  // canvas — a metric card, a control strip, a segmented control, a rating row —
  // so a style's radius, borders, surface, font, weight and accent all read at
  // once, without pretending to be one made-up screen.
  return (
    <div className="mkt__style-specimen" style={tokens}>
      <IconProvider set={cfg.iconSet}>
        <div className="mkt__style-bouquet">
          {/* Anchor: a real metric card — surface, radius, border, the display
              font on the title word + the big number, and the accent delta. */}
          <div className="card mkt__style-metric">
            <div style={between}>
              <span className="card__title">Revenue</span>
              <span className="badge badge--solid-primary">Live</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--k-s-8)' }}>
              <span className="mkt__style-spec-display">$24,300</span>
              <span className="stat-tile__delta stat-tile__delta--up">+12%</span>
            </div>
          </div>

          {/* Control strip — button shape/radius + the aimed accent + a switch. */}
          <div style={{ ...row, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn--primary btn--sm">Send</button>
            <button type="button" className="btn btn--ghost btn--sm">Details</button>
            <span className="toggle toggle--on" role="switch" aria-checked="true" style={{ marginLeft: 'auto' }}><span className="toggle__knob" /></span>
          </div>

          {/* Segmented control — radius + accent + label case (caps vs sentence). */}
          <div className="segctrl">
            <button type="button" className="segctrl__btn segctrl__btn--on">Overview</button>
            <button type="button" className="segctrl__btn">Activity</button>
          </div>

          {/* Rating + chips — accent + radius on small pills. */}
          <div style={between}>
            <span className="rating"><SpecStar /><SpecStar /><SpecStar /><SpecStar /><SpecStar empty /></span>
            <div style={row}>
              <span className="badge">New</span>
              <span className="badge">Draft</span>
            </div>
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
