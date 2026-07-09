/**
 * `uicockpit template [name]` — seed a starting screen into the project: a whole
 * screen already wearing your kit, for your agent to extend under `check`. Not a
 * finished page to ship as-is — a starting point you build on.
 *
 * Screens are PREBUILT static HTML on uicockpit.com (/templates/<name>.html):
 * the markup is identical for every kit — the whole design lives in the kit CSS
 * the file's <link> pulls in. So this command is a fetch + one rewrite: it
 * swaps the default-kit href for YOUR kit (the hash in uicockpit.json, or
 * --kit=<hash>), keyed on the `data-uicockpit-kit` attribute.
 *
 *   npx uicockpit template                  list the starting screens
 *   npx uicockpit template invoices         write invoices.html wearing your kit
 *   npx uicockpit template home --kit=<h>   explicit kit hash
 */

const DEFAULT_SITE = 'https://uicockpit.com'
const DEFAULT_CDN = 'https://kit.uicockpit.com'

/**
 * Rewrite the template's kit stylesheet to a specific kit hash. Pure.
 * The anchor is the `data-uicockpit-kit` attribute the generator emits BEFORE
 * the href, so attribute order is stable.
 * @param {string} html
 * @param {string} hash   the kit share-key
 * @param {string} cdn    CDN base (no trailing slash)
 * @returns {string}
 */
export function rewriteKitLink(html, hash, cdn = DEFAULT_CDN) {
  return html.replace(
    /(data-uicockpit-kit href=")[^"]*(")/,
    `$1${cdn}/k/${encodeURIComponent(hash)}.css$2`,
  )
}

async function fetchOk(url, as = 'text') {
  let res
  try {
    res = await fetch(url)
  } catch (err) {
    throw new Error(`network error fetching ${url}: ${err.message}`)
  }
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return as === 'json' ? res.json() : res.text()
}

/** @returns {Promise<number>} 0 ok · 2 usage/fetch error */
export async function runTemplate(argv) {
  const { writeFileSync, existsSync, readFileSync } = await import('node:fs')

  const positional = argv.filter((a) => !a.startsWith('--'))
  const name = positional[0]
  const force = argv.includes('--force')
  const kitFlag = argv.find((a) => a.startsWith('--kit='))
  const siteFlag = argv.find((a) => a.startsWith('--site='))
  const cdnFlag = argv.find((a) => a.startsWith('--cdn='))
  const site = (siteFlag ? siteFlag.slice(7) : process.env.UICOCKPIT_SITE || DEFAULT_SITE).replace(/\/$/, '')
  const cdn = (cdnFlag ? cdnFlag.slice(6) : process.env.UICOCKPIT_CDN || DEFAULT_CDN).replace(/\/$/, '')

  // No name → list what's available.
  if (!name) {
    let idx
    try {
      idx = await fetchOk(`${site}/templates/index.json`, 'json')
    } catch (err) {
      console.error(`✗ ${err.message}`)
      return 2
    }
    console.log('Starting screens (built purely from your kit — a seed your agent extends under check):\n')
    for (const t of idx.templates) console.log(`  ${t.name.padEnd(12)} ${t.title} — ${t.blurb.split('—')[1]?.trim() ?? t.blurb}`)
    console.log('\nUsage:  npx uicockpit template <name>   (add --force to overwrite)')
    return 0
  }

  // The kit hash: --kit= wins, else uicockpit.json (written by init).
  let hash = kitFlag ? kitFlag.slice(6) : ''
  if (!hash && existsSync('uicockpit.json')) {
    try {
      hash = JSON.parse(readFileSync('uicockpit.json', 'utf8')).kit || ''
    } catch { /* fall through */ }
  }

  const out = `${name}.html`
  if (existsSync(out) && !force) {
    console.error(`✗ ${out} already exists — pass --force to overwrite.`)
    return 2
  }

  let html
  try {
    html = await fetchOk(`${site}/templates/${name}.html`)
  } catch (err) {
    console.error(`✗ ${err.message}`)
    console.error('  Run  npx uicockpit template  to list the available names.')
    return 2
  }

  if (hash) html = rewriteKitLink(html, hash, cdn)
  writeFileSync(out, html)
  console.log(`  ✓ wrote ${out}${hash ? ' (wearing your kit)' : ' (default kit — run inside an initialized project, or pass --kit=<hash>)'}`)
  console.log('\nOpen it in a browser as-is, or use it as the starting markup for a screen —')
  console.log('every class is a kit recipe; `npx uicockpit check` keeps edits on-system.')
  return 0
}
