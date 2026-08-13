import { describe, it, expect, vi, afterEach } from 'vitest'
import { ping } from '../beacon'

/**
 * The beacon carries two promises that cannot be checked by using the app:
 *
 *   1. it never counts anything but the live site — every dev reload, preview
 *      deploy and localhost click would otherwise land in the same metric and
 *      quietly make the door numbers useless, exactly when we start trusting
 *      them to answer product-vs-wedge;
 *   2. it never throws — it sits inside a navigation handler, so a failure here
 *      would take the click with it.
 *
 * Both are invisible in dev (where it correctly does nothing), so they get a
 * test rather than a manual check.
 */

function atHost(hostname: string) {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, hostname },
    writable: true,
    configurable: true,
  })
}

afterEach(() => { vi.unstubAllGlobals(); atHost('localhost') })

describe('the live-host guard', () => {
  const sent: string[] = []
  const spy = () => {
    sent.length = 0
    vi.stubGlobal('navigator', { sendBeacon: (u: string) => { sent.push(u); return true } })
    return sent
  }

  it('counts the live site and its subdomains', () => {
    const s = spy()
    atHost('uicockpit.com'); ping('door', 'audit')
    atHost('www.uicockpit.com'); ping('door', 'configure')
    expect(s).toHaveLength(2)
    expect(s[0]).toContain('kind=door')
    expect(s[0]).toContain('fmt=audit')
  })

  it('stays silent everywhere else', () => {
    const s = spy()
    for (const h of ['localhost', '127.0.0.1', 'uicockpit.pages.dev', 'uicockpit.com.evil.co']) {
      atHost(h); ping('door', 'audit')
    }
    expect(s).toHaveLength(0)
  })

  it('encodes the value rather than breaking the query', () => {
    const s = spy()
    atHost('uicockpit.com'); ping('audit', 'a b&c')
    expect(s[0]).toContain('fmt=a+b%26c')
  })
})

describe('failure containment', () => {
  it('swallows a throwing transport instead of taking the click with it', () => {
    atHost('uicockpit.com')
    vi.stubGlobal('navigator', { sendBeacon: () => { throw new Error('blocked by an extension') } })
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')))
    expect(() => ping('door', 'audit')).not.toThrow()
  })

  it('falls back to fetch when sendBeacon declines', () => {
    atHost('uicockpit.com')
    const calls: string[] = []
    vi.stubGlobal('navigator', { sendBeacon: () => false })
    vi.stubGlobal('fetch', (u: string) => { calls.push(u); return Promise.resolve(new Response()) })
    ping('audit', 'scanned')
    expect(calls[0]).toContain('kind=audit')
  })
})
