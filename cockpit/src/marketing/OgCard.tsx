/**
 * OgCard — the 1280×640 social-preview / open-graph card, rendered at `/og`.
 *
 * Left: the proposition (brand · eyebrow · headline · sub · url). Right: a curated,
 * edge-feathered collage of real kit components (`public/og-collage.png`) that
 * dissolves into the copy — so the OG image shows actual components, hand-cropped
 * for the best arrangement. Not linked; it exists so the OG PNG can be
 * screenshotted at 1280×640.
 */
export function OgCard() {
  return (
    <div className="mkt og-card">
      <div className="og-card__left">
        <a href="/" className="mkt__brand og-card__brand">
          <img src="/logo.svg" alt="" width={44} height={44} className="mkt__brand-logo" />
          UIcockpit
        </a>

        <div className="mkt__eyebrow og-card__eyebrow">
          <span className="mkt__eyebrow-dot" />
          Free &amp; open source
        </div>

        <h1 className="og-card__h1">Ship AI apps that look designed, not generated.</h1>

        <p className="og-card__sub">
          The design system generator — dial yours in, export it anywhere, and keep
          it coherent as you and your AI build on it.
        </p>

        <div className="og-card__foot">
          <span className="og-card__url">uicockpit.com</span>
          <span className="og-card__meta">·&nbsp;&nbsp;MIT&nbsp;&nbsp;·&nbsp;&nbsp;no account&nbsp;&nbsp;·&nbsp;&nbsp;npx uicockpit</span>
        </div>
      </div>

      <div className="og-card__right">
        <img src="/og-collage.png" alt="" className="og-card__collage" />
      </div>

      <div className="og-card__accent" />
    </div>
  )
}
