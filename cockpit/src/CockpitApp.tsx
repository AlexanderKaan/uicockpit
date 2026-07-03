import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { buildTokens } from './tokens/buildTokens'
import { Panel } from './panel/Panel'
import { Stage, type ViewKind } from './stage/Stage'
import { Topbar } from './stage/Topbar'
import { MobileControlBar } from './stage/MobileControlBar'
import { CommandPalette } from './stage/CommandPalette'
import { useConfig } from './state/useConfig'
import { randomKit } from './state/randomKit'
import { DEFAULT_CONFIG } from './tokens/defaults'
import { Toast } from './export/Toast'
import { DocsBody } from './marketing/DocsBody'

// Lazy-load — export generators + modal only ship when user opens it
const ExportModal = lazy(() =>
  import('./export/ExportModal').then((m) => ({ default: m.ExportModal })),
)

interface CockpitAppProps {
  /** Called when user clicks the brand — sends them back to /. */
  onHome?: () => void
  /** Which surface the route asks for. 'docs' replaces the stage with the in-app
   *  guide (the /docs route); 'app' is the configurator. */
  route?: 'app' | 'docs'
  /** Push a new path (the app's SPA router) — drives the Docs link + deep-links. */
  navigate?: (to: string) => void
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
export function CockpitApp({ onHome, route = 'app', navigate }: CockpitAppProps = {}) {
  const { cfg, tokens, dispatch, undo, redo, canUndo, canRedo } = useConfig()
  const docsActive = route === 'docs'
  // Default closed on phones — there the panel becomes an overlay drawer, so the
  // stage gets the full width; open inline as a column on desktop.
  const [menuOpen, setMenuOpen] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth > 768,
  )
  // Land on Blocks (C7): the ladder runs abstract→concrete, but visitor curiosity
  // runs concrete→abstract — real, instantly-themeable surfaces are the hook;
  // Foundations stays the inspect layer one tab away.
  const [view, setView] = useState<ViewKind>('components')
  const [exportOpen, setExportOpen] = useState(false)
  const [cmdkOpen, setCmdkOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Dogfood: the configurator chrome runs on UIcockpit's OWN default kit. We emit
  // the DEFAULT_CONFIG tokens (in the current light/dark mode) onto .app, and the
  // chrome's --app-* vars alias these --k-* (see chrome.css). The live preview
  // overrides --k-* on .cockpit-preview, so it still shows the user's kit.
  const chromeTokens = useMemo(
    () => buildTokens({ ...DEFAULT_CONFIG, mode: cfg.mode }).vars as CSSProperties,
    [cfg.mode],
  )

  const handleViewChange = (next: ViewKind) => {
    // From the docs view, picking a catalog tab returns to the configurator on
    // that view (the URL leaves /docs).
    if (docsActive) navigate?.('/app')
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
      // ⌘K toggles the command palette — works from anywhere, even a focused field.
      if (k === 'k') { e.preventDefault(); setCmdkOpen((v) => !v); return }
      if (k !== 'z' && k !== 'y') return
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  // Per-knob locks (session-only UI state, not part of the kit): a pinned knob
  // keeps its value through a Shuffle. Keyed by the panel row key (= config field).
  const [lockedKeys, setLockedKeys] = useState<Set<string>>(() => new Set())
  const onToggleLock = useCallback((key: string) => {
    setLockedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const onRandomize = useCallback(() => {
    // REPLACE flows through the history reducer, so a roll is undoable (⌘Z).
    // Pinned knobs ride through unchanged.
    dispatch({ type: 'REPLACE', cfg: randomKit(cfg, Math.random, lockedKeys) })
    setToast('🎲 Rolled a fresh kit — ⌘Z to undo')
  }, [cfg, dispatch, lockedKeys])

  const onReset = useCallback(() => {
    // Back to the curated default house style. REPLACE → undoable (⌘Z).
    dispatch({ type: 'REPLACE', cfg: DEFAULT_CONFIG })
    setToast('↺ Reset to the default kit — ⌘Z to undo')
  }, [dispatch])

  const onShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setToast('Share link copied')
    } catch {
      setToast('Copy failed — select & copy URL manually')
    }
  }, [])

  return (
    <div className={`app ${menuOpen ? '' : 'app--menu-closed'} ${cfg.mode === 'dark' ? 'app--theme-dark' : ''}`} style={chromeTokens}>
      <Topbar
        view={view}
        onViewChange={handleViewChange}
        mode={cfg.mode}
        onToggleMode={() =>
          dispatch({ type: 'SET', patch: { mode: cfg.mode === 'light' ? 'dark' : 'light' } })
        }
        onExport={() => setExportOpen(true)}
        tokens={tokens}
        cfg={cfg}
        onLoadKit={(loaded) => dispatch({ type: 'REPLACE', cfg: loaded })}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((v) => !v)}
        onHome={onHome}
        onDocs={() => navigate?.(docsActive ? '/app' : '/docs')}
        docsActive={docsActive}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <div className="app__body">
        {docsActive ? (
          /* The in-app guide — full-stage, the topbar persists above. */
          <div className="app__docs">
            <DocsBody onLaunch={() => navigate?.('/app')} />
          </div>
        ) : (
          <>
            {/* Mobile-only backdrop behind the drawer (display:none on desktop). */}
            {menuOpen && (
              <div className="app__scrim" aria-hidden="true" onClick={() => setMenuOpen(false)} />
            )}
            {menuOpen && (
              <Panel
                cfg={cfg}
                tokens={tokens}
                dispatch={dispatch}
                onCollapse={() => setMenuOpen(false)}
                onRandomize={onRandomize}
                onReset={onReset}
                lockedKeys={lockedKeys}
                onToggleLock={onToggleLock}
              />
            )}
            <Stage
              cfg={cfg}
              tokens={tokens}
              view={view}
            />
          </>
        )}
      </div>
      {!docsActive && (
        <MobileControlBar
          onCustomize={() => setMenuOpen(true)}
          onShuffle={onRandomize}
          onExport={() => setExportOpen(true)}
        />
      )}
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
      <CommandPalette
        open={cmdkOpen}
        onClose={() => setCmdkOpen(false)}
        tokens={tokens}
        dispatch={dispatch}
        onViewChange={handleViewChange}
        onShare={onShare}
        onExport={() => setExportOpen(true)}
        onRandomize={onRandomize}
        onReset={onReset}
        undo={undo}
        redo={redo}
      />
    </div>
  )
}
