/**
 * `uicockpit init <hash>` — pull a configured kit into the current project.
 *
 * The hash is the share-key from uicockpit.com (the payload in the app URL and in
 * the hosted `<link>`). The CDN serves the artifacts statelessly from it:
 *   GET /k/<hash>.css            → tokens.css (the full kit)
 *   GET /k/<hash>.contract.json  → the machine-checkable contract for `check`
 *   GET /k/<hash>.rules.md       → the agent rules, written as AGENTS.md
 * So init is a thin fetch-and-write: no engine bundled, the CDN is the source.
 */

const DEFAULT_CDN = 'https://kit.uicockpit.com'

async function fetchText(url) {
  let res
  try {
    res = await fetch(url)
  } catch (err) {
    throw new Error(`network error fetching ${url}: ${err.message}`)
  }
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.text()
}

/**
 * @returns {Promise<number>}  0 ok · 2 usage/fetch error
 */
export async function runInit(argv) {
  const { writeFileSync, existsSync } = await import('node:fs')

  const positional = argv.filter((a) => !a.startsWith('--'))
  const hash = positional[0]
  const force = argv.includes('--force')
  // CDN override for local testing: --cdn=… or UICOCKPIT_CDN.
  const cdnFlag = argv.find((a) => a.startsWith('--cdn='))
  const base = (cdnFlag ? cdnFlag.slice('--cdn='.length) : process.env.UICOCKPIT_CDN || DEFAULT_CDN).replace(/\/$/, '')

  if (!hash) {
    console.error('✗ usage: npx uicockpit init <kit-hash> [--force] [--cdn=<url>]')
    console.error('  The hash is the share-key from the "Use this kit" panel at uicockpit.com.')
    return 2
  }

  const targets = [
    { file: 'uicockpit.tokens.css', url: `${base}/k/${hash}.css` },
    { file: 'uicockpit.contract.json', url: `${base}/k/${hash}.contract.json` },
    { file: 'AGENTS.md', url: `${base}/k/${hash}.rules.md` },
  ]

  for (const t of targets) {
    if (existsSync(t.file) && !force) {
      console.error(`✗ ${t.file} already exists — pass --force to overwrite.`)
      return 2
    }
  }

  for (const t of targets) {
    let text
    try {
      text = await fetchText(t.url)
    } catch (err) {
      console.error(`✗ ${err.message}`)
      console.error('  Check the kit hash, or your network connection.')
      return 2
    }
    writeFileSync(t.file, text)
    console.log(`  ✓ wrote ${t.file}`)
  }

  console.log('\nKit installed. Next:')
  console.log('  1. Import uicockpit.tokens.css once at your app root (or use the hosted <link>).')
  console.log('  2. AGENTS.md holds the rules — your coding agent picks it up automatically.')
  console.log('  3. Run  npx uicockpit check  to catch any drift from the contract.')
  return 0
}
