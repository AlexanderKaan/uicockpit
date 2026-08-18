/* Scope the kit to .b-kit with @scope — a real CSS feature, so no regex surgery
 * on selectors (the first attempt prefixed comment text and left real selectors
 * bare, which leaked a global `h2 { text-transform: uppercase }` into the page). */
import { writeFileSync } from 'node:fs'
import { buildTokens } from './src/tokens/buildTokens'
import { DEFAULT_CONFIG } from './src/tokens/defaults'
import { assembleKitCss } from './src/kit'
import { globalLayer } from './src/kit/globalLayer'
const vars = buildTokens(DEFAULT_CONFIG).vars as Record<string, string>
writeFileSync('../a2ui/kit.css',
  `.b-kit{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')};font-family:var(--k-font-body);color:var(--k-fg)}\n`
  + `@scope (.b-kit) {\n${globalLayer({ scope: '' })}\n${assembleKitCss()}\n}\n`)
console.log('kit.css met @scope geschreven')
