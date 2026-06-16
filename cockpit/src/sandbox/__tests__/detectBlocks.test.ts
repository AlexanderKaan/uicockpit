import { describe, it, expect } from 'vitest'
import { detectBlocks } from '../detectBlocks'

describe('detectBlocks', () => {
  it('reads a search/results tool as searchbar + tabnav + filterbar + datatable', () => {
    const html = `
      <header>
        <input type="search" placeholder="Search domains" />
        <nav><a>Search</a><a>Extensions</a><a>Generator</a><a>Aftermarket</a></nav>
        <button>Broker</button><button>Lookup</button><button>Save</button><button>Copy</button>
      </header>
      <div class="filters">Filters Available Premium Taken</div>
      <table><tr><td>a.com</td></tr><tr><td>b.io</td></tr><tr><td>c.net</td></tr></table>`
    const blocks = detectBlocks(html)
    expect(blocks).toContain('searchbar')
    expect(blocks).toContain('tabnav')
    expect(blocks).toContain('filterbar')
    expect(blocks).toContain('datatable')
    expect(blocks).toContain('toolbar')
    expect(blocks).not.toContain('sidebar')
    // searchbar should come before the table (visual order honoured by the board)
    expect(blocks.indexOf('searchbar')).toBeLessThan(blocks.indexOf('datatable'))
  })

  it('reads a dashboard as sidebar + stats + table (no tabnav)', () => {
    const html = `
      <aside class="sidenav"><a>Home</a><a>Reports</a></aside>
      <main>
        <div class="stat-tile">12K</div>
        <table><tr><td>Acme</td></tr><tr><td>Globex</td></tr><tr><td>Initech</td></tr></table>
      </main>`
    const blocks = detectBlocks(html)
    expect(blocks).toContain('sidebar')
    expect(blocks).toContain('statstrip')
    expect(blocks).toContain('datatable')
    expect(blocks).not.toContain('tabnav') // sidebar present → no top tabs
  })

  it('reads a form page as form', () => {
    expect(detectBlocks('<form><label>Name</label><input/></form>')).toContain('form')
  })

  it('never returns empty — falls back to stats + table', () => {
    const blocks = detectBlocks('<div>just some text</div>')
    expect(blocks).toContain('statstrip')
    expect(blocks).toContain('datatable')
  })
})
