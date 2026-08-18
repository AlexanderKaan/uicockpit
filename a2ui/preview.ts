import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { buildTokens } from '../cockpit/src/tokens/buildTokens'
import { DEFAULT_CONFIG } from '../cockpit/src/tokens/defaults'
import { assembleKitCss } from '../cockpit/src/kit'
import { globalLayer } from '../cockpit/src/kit/globalLayer'

const html = execFileSync('node', ['probe.mjs'], { cwd: '.', encoding: 'utf8' })
const vars = buildTokens(DEFAULT_CONFIG).vars as Record<string, string>
const page = `<!doctype html><meta charset="utf-8"><title>A2UI probe</title>
<style>
:root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')}}
body{margin:0;background:var(--k-bg);color:var(--k-fg);font-family:var(--k-font-body);
     padding:40px;display:grid;place-items:start center}
.wrap{width:min(680px,100%)}
h1{font:600 13px/1 var(--k-font-body);letter-spacing:.14em;text-transform:uppercase;
   color:var(--k-fg-muted);margin:0 0 20px}
${globalLayer({ scope: '' })}
${assembleKitCss()}
</style>
<div class="wrap"><h1>A2UI stream → public-service catalog → kit renderer</h1>
${html}</div>`
writeFileSync('./preview.html', page)
console.log('preview.html geschreven —', (page.length / 1024).toFixed(0), 'kB')
