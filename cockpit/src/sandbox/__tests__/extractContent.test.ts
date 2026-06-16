import { describe, it, expect } from 'vitest'
import { extractContent } from '../extractContent'

const PAGE = `
<!doctype html>
<html>
<head><title>Orders — Catalyst</title></head>
<body>
  <header>
    <a class="brand" href="/">Catalyst</a>
    <nav>
      <a href="/home">Home</a>
      <a href="/events">Events</a>
      <a href="/orders">Orders</a>
      <a href="/settings">Settings</a>
      <a href="https://help.example.com/very-long-support-link">Visit our long help center now</a>
    </nav>
    <button class="btn btn--primary">New order</button>
  </header>
  <main>
    <h1>Orders</h1>
    <p>A long paragraph that is not a heading and should never be mistaken for one.</p>
  </main>
</body>
</html>`

describe('extractContent', () => {
  const { content, found } = extractContent(PAGE)

  it('reads the brand element as app name', () => {
    expect(content.appName).toBe('Catalyst')
    expect(found).toContain('appName')
  })
  it('reads nav labels, dropping the long/URL-ish one', () => {
    expect(content.menu).toEqual(['Home', 'Events', 'Orders', 'Settings'])
  })
  it('reads the primary button + heading', () => {
    expect(content.primaryBtn).toBe('New order')
    expect(content.heading).toBe('Orders')
  })

  it('falls back to a title brand segment when no brand element', () => {
    const { content: c } = extractContent('<title>Dashboard | Linear</title><nav><a>Issues</a></nav>')
    expect(c.appName).toBe('Linear')
  })

  it('uses og:site_name meta first', () => {
    const { content: c } = extractContent('<meta property="og:site_name" content="Acme Inc"><title>Page</title>')
    expect(c.appName).toBe('Acme Inc')
  })

  it('returns empty content (no crash) for CSS-only input', () => {
    const { content: c, found } = extractContent(':root{--primary:#333} .btn{height:40px}')
    expect(c.menu).toEqual([])
    expect(found).toEqual([])
  })

  it('decodes entities in labels', () => {
    const { content: c } = extractContent('<nav><a>Help &amp; support</a></nav>')
    expect(c.menu).toContain('Help & support')
  })
})
