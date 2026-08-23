/**
 * THE RECURRING SWEEP — `npm run sweep`.
 *
 * Loads the built generator headless with ?audit= and reads back the verdict
 * the page writes about itself: every brand-family colour follows the brand,
 * nothing thin and painted is invisible against its backdrop, and a checked
 * control never renders like its unchecked sibling. Each invariant is one of
 * the 2026-08-23 hand-sweep findings, generalised; what they cannot see (a
 * missing icon that still differs, a wrong variant that still renders) stays a
 * hand sweep against the kits' own pages.
 *
 * Runs the real page over HTTP because Material's element bundle is a module
 * script, and Chrome refuses module scripts from file://.
 */
import { spawn, execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const PORT = 5199
const BRAND_B = 'c2410c'          // far from the default violet, far from the semantic tones
const CHROME = process.env.CHROME
  ?? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync)
if (!CHROME) {
  console.error('sweep: no Chrome found — set CHROME=/path/to/chrome. The rendered sweep cannot run without a real engine, and skipping it silently would be a gate that lies.')
  process.exit(2)
}
if (!existsSync('generator.html')) {
  console.error('sweep: generator.html is not built — run `npm run page` first.')
  process.exit(2)
}

const server = spawn('node', ['serve.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' })
try {
  for (let i = 0; ; i++) {
    try { await fetch(`http://localhost:${PORT}/generator`); break }
    catch { if (i > 40) throw new Error('server never came up'); await new Promise((r) => setTimeout(r, 100)) }
  }
  console.log('sweeping every kit at two brands — this renders eight real kits and takes a minute…')
  /* REAL TIME OVER THE DEBUG PIPE. Two dead ends taught the shape of this:
     --virtual-time-budget races the clock without producing frames, and Chrome
     then serves stale computed styles for rule-mediated custom properties —
     the sheet holds the new brand, a probe has moved, half the wall answers
     with the old colour. And without the budget, --dump-dom dumps the moment
     load finishes, before the audit has run at all. So the page runs on real
     frames and the runner asks over CDP, no dependencies, until the verdict
     element exists. */
  const chrome = spawn(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1560,1000', '--remote-debugging-pipe', 'about:blank'],
  { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] })
  const send = (() => {
    let id = 0; const pending = new Map()
    let buf = Buffer.alloc(0)
    chrome.stdio[4].on('data', (d) => {
      buf = Buffer.concat([buf, d])
      let i
      while ((i = buf.indexOf(0)) >= 0) {
        const msg = JSON.parse(buf.subarray(0, i).toString('utf8')); buf = buf.subarray(i + 1)
        if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
      }
    })
    return (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const m = { id: ++id, method, params, ...(sessionId ? { sessionId } : {}) }
      pending.set(m.id, (r) => r.error ? reject(new Error(`${method}: ${r.error.message}`)) : resolve(r.result))
      chrome.stdio[3].write(JSON.stringify(m) + '\0')
    })
  })()

  let verdictText = null
  try {
    const { targetId } = await send('Target.createTarget', { url: `http://localhost:${PORT}/generator?stage=wall&audit=${BRAND_B}` })
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
    for (let i = 0; i < 150; i++) {
      const r = await send('Runtime.evaluate', {
        expression: "document.querySelector('#sweepverdict')?.textContent ?? ''", returnByValue: true }, sessionId)
      if (r.result?.value) { verdictText = r.result.value; break }
      await new Promise((res) => setTimeout(res, 1000))
    }
  } finally { chrome.kill() }
  if (!verdictText) { console.error('sweep: the page never wrote a verdict in 150s — it may have thrown before the audit ran. Load /generator?audit=c2410c in a browser and look at the console.'); process.exit(2) }
  const { fail, brandA, brandB, verdict } = JSON.parse(verdictText)

  console.log(`\n  brand ${brandA} → ${brandB}\n`)
  for (const [kit, v] of Object.entries(verdict)) {
    if (v.error) { console.log(`  ✗ ${kit.padEnd(10)} ${v.error}`); continue }
    const bad = (v.stale?.length ?? 0) + (v.invisible?.length ?? 0) + (v.samestate?.length ?? 0)
    console.log(`  ${bad ? '✗' : '✓'} ${kit.padEnd(10)} ${String(v.checked).padStart(4)} colours · ${
      v.live ? `${v.followed}/${v.family} brand-family followed` : `${v.family} brand-family baked (declared built-not-live)`}${
      v.invisible?.length ? ` · ${v.invisible.length} invisible` : ''}${v.samestate?.length ? ` · ${v.samestate.length} same-state` : ''}`)
    for (const s of [...(v.stale ?? []), ...(v.invisible ?? []), ...(v.samestate ?? [])]) console.log(`      ${s}`)
  }
  if (fail) { console.error('\nsweep: the wall is not the real kit somewhere — the lines above say where.'); process.exit(1) }
  console.log('\nEvery brand-family colour follows the knob, nothing painted is invisible, every checked control shows it.')
} finally { server.kill() }
