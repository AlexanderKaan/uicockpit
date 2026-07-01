import { IconProvider } from '../icons/Icon'
import { ComponentGallery } from '../stage/views/ComponentGallery'
import { buildTokens } from '../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import { applyColorTheme } from '../tokens/stylesAndThemes'
import type { CSSProperties } from 'react'

/**
 * OgCard — the 1280×640 social-preview / open-graph card, rendered at `/og`.
 *
 * Left: the proposition (brand · eyebrow · headline · sub · url). Right: the REAL
 * <ComponentGallery/> (the exact wall the configurator shows), brand-tinted and
 * edge-masked so it dissolves like the homepage hero — so the OG image shows
 * actual kit components, never a mock, and can't drift from the product.
 *
 * Not linked anywhere; it exists so the OG PNG can be screenshotted at 1280×640.
 */
const OG_VARS = buildTokens(applyColorTheme(DEFAULT_CONFIG, 'cobalt')).vars as CSSProperties

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
          One design language your AI applies to every screen — and a checker keeps it
          coherent as you grow.
        </p>

        <div className="og-card__foot">
          <span className="og-card__url">uicockpit.com</span>
          <span className="og-card__meta">·&nbsp;&nbsp;MIT&nbsp;&nbsp;·&nbsp;&nbsp;no account&nbsp;&nbsp;·&nbsp;&nbsp;npx uicockpit</span>
        </div>
      </div>

      <div className="og-card__right">
        <div className="cockpit-preview og-card__gallery" style={OG_VARS}>
          <IconProvider set={DEFAULT_CONFIG.iconSet}>
            <ComponentGallery limit={48} />
          </IconProvider>
        </div>
      </div>

      <div className="og-card__accent" />
    </div>
  )
}
