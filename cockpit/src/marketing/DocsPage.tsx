import { useEffect } from 'react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'
import { DocsBody } from './DocsBody'

/**
 * /docs — the guide, re-housed in the SITE shell (IA-1). It used to render
 * inside the app shell (CockpitApp route="docs", app topbar above it); the
 * hub-and-tool IA puts every reference destination under the one site nav and
 * keeps /app as the fullscreen instrument. DocsBody is chrome-less and its
 * `.docs` grid lives in marketing.css, so here it just sits in the .mkt shell.
 */
export function DocsPage({ navigate }: { navigate: (to: string) => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = 'Docs — how to use UIcockpit, the design system generator'
    return () => { document.title = prev }
  }, [])
  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="docs" />
      {/* .docs caps + pads itself (max-width 1100) — no container wrapper needed. */}
      <DocsBody onLaunch={() => navigate('/app')} />
      <MktFooter navigate={navigate} />
    </div>
  )
}
