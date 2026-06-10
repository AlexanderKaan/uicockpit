import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Panel } from './panel/Panel'
import { Stage, type ViewKind } from './stage/Stage'
import { Topbar } from './stage/Topbar'
import { useConfig } from './state/useConfig'
import { Toast } from './export/Toast'

// Lazy-load — export generators + modal only ship when user opens it
const ExportModal = lazy(() =>
  import('./export/ExportModal').then((m) => ({ default: m.ExportModal })),
)

interface CockpitAppProps {
  /** Called when user clicks the brand — sends them back to /. */
  onHome?: () => void
}

// View Transitions API — Chrome/Edge/Safari 18+, falls back to instant switch elsewhere.
type DocWithVT = Document & { startViewTransition?: (cb: () => void) => unknown }
function startViewTransition(cb: () => void): void {
  const d = document as DocWithVT
  if (typeof d.startViewTransition === 'function') d.startViewTransition(cb)
  else cb()
}

/** The configurator itself — what was previously the App root. Now lives at
 *  /app so /  can be the marketing landing page.
 *
 *  Layout: a full-width top bar (brand · view switcher · actions) runs across
 *  the whole app; below it the stage fills the width and the control menu
 *  *floats* over the top-left (absolute), never reserving a column. */
export function CockpitApp({ onHome }: CockpitAppProps = {}) {
  const { cfg, tokens, dispatch, undo, redo, canUndo, canRedo } = useConfig()
  const [menuOpen, setMenuOpen] = useState(true)
  const [view, setView] = useState<ViewKind>('foundations')
  const [saved, setSaved] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Visual save indicator — flips to "Saving…" briefly after each cfg change
  useEffect(() => {
    setSaved(false)
    const t = setTimeout(() => setSaved(true), 220)
    return () => clearTimeout(t)
  }, [cfg])

  const handleViewChange = (next: ViewKind) => {
    if (next === view) return
    startViewTransition(() => setView(next))
  }

  // Undo/redo keyboard shortcuts (C2): ⌘Z / Ctrl+Z = undo, ⇧⌘Z / Ctrl+Y = redo.
  // Skip when a text field is focused so the browser's native field-undo wins
  // (e.g. editing the hex input) — the panel's other controls aren't text inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return
      const k = e.key.toLowerCase()
      if (k !== 'z' && k !== 'y') return
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  const onShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setToast('Share link copied')
    } catch {
      setToast('Copy failed — select & copy URL manually')
    }
  }, [])

  return (
    <div className={`app ${menuOpen ? '' : 'app--menu-closed'} ${cfg.mode === 'dark' ? 'app--theme-dark' : ''}`}>
      <Topbar
        view={view}
        onViewChange={handleViewChange}
        saved={saved}
        mode={cfg.mode}
        onToggleMode={() =>
          dispatch({ type: 'SET', patch: { mode: cfg.mode === 'light' ? 'dark' : 'light' } })
        }
        onShare={onShare}
        onExport={() => setExportOpen(true)}
        tokens={tokens}
        cfg={cfg}
        onLoadKit={(loaded) => dispatch({ type: 'REPLACE', cfg: loaded })}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((v) => !v)}
        onHome={onHome}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <div className="app__body">
        {menuOpen && (
          <Panel
            cfg={cfg}
            tokens={tokens}
            dispatch={dispatch}
            onCollapse={() => setMenuOpen(false)}
          />
        )}
        <Stage cfg={cfg} tokens={tokens} view={view} />
      </div>
      {exportOpen && (
        <Suspense fallback={null}>
          <ExportModal
            cfg={cfg}
            onClose={() => setExportOpen(false)}
            onToast={(m) => setToast(m)}
          />
        </Suspense>
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
