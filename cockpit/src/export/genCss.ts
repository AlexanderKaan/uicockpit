import { buildTokens } from '../tokens/buildTokens'
import { customFontFaceBlock, googleFontsImport, isCustomFont } from '../tokens/fonts'
import type { Config } from '../tokens/types'
import {
  Z_INDEX,
  BREAKPOINTS,
  CONTAINER_WIDTHS,
  buildTypeScale,
} from '../tokens/extras'
import { assembleKitCss } from '../kit'
import { globalLayer } from '../kit/globalLayer'

/**
 * Standalone tokens.css. Drop into any project, link in <head> before
 * your own stylesheet (so component CSS resolves the vars), and the
 * fonts load via Google Fonts @import. Switch to dark mode by toggling
 * the `.dark` class on a parent.
 */
export function genCss(cfg: Config): string {
  const light = buildTokens({ ...cfg, mode: 'light' }).vars
  const dark = buildTokens({ ...cfg, mode: 'dark' }).vars
  const block = (v: Record<string, string | number>) =>
    Object.entries(v)
      .map(([k, val]) => `  ${k}: ${val};`)
      .join('\n')

  // Auto-derived token categories — not user-configurable but essential for
  // a complete design system. See src/tokens/extras.ts for the rationale.
  const typeScale = buildTypeScale(cfg)
  // NB: the spacing grid (--k-s-0 … --k-s-32) is already emitted in the :root
  // block via buildTokens().vars, so it is NOT repeated here (would duplicate).
  const extrasBlock = [
    '\n  /* --- Z-index stack --- */',
    ...Object.entries(Z_INDEX).map(([k, v]) => `  --k-z-${k}: ${v};`),
    '\n  /* --- Breakpoints --- */',
    ...Object.entries(BREAKPOINTS).map(([k, v]) => `  --k-bp-${k}: ${v};`),
    '\n  /* --- Container widths --- */',
    ...Object.entries(CONTAINER_WIDTHS).map(([k, v]) => `  --k-container-${k}: ${v};`),
    '\n  /* --- Extended type scale (derived from --k-type-h1 / --k-type-body) --- */',
    ...Object.entries(typeScale).map(([k, v]) => `  --k-type-${k}: ${v};`),
  ].join('\n')

  return `/* tokens.css — UIcockpit design system
 *
 * Drop-in usage:
 *   <link rel="stylesheet" href="tokens.css">  (or @import in your CSS)
 *
 * Dark mode:
 *   <html class="dark"> or any ancestor element — the .dark block
 *   re-resolves every --k-* token.
 *
 * Fonts are pulled from Google Fonts. To self-host, remove the @import
 * and add your own @font-face declarations.
 */

${googleFontsImport(cfg.fontDisplay, cfg.fontBody)}
${[cfg.fontDisplay, cfg.fontBody]
  .filter((f, i, a) => isCustomFont(f) && a.indexOf(f) === i)
  .map(customFontFaceBlock)
  .join('\n\n')}

:root {
${block(light)}
${extrasBlock}
}

.dark {
${block(dark)}
}

${globalLayer({ exportExtras: true })}

${assembleKitCss()}
`
}
