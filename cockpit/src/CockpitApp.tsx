import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
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

  // --- Mobile bottom-sheet controls ------------------------------------------
  // On phones the panel is NOT a left drawer that hides the canvas — it's a
  // non-modal bottom SHEET with two detents (half / full) that floats over the
  // LIVE component wall, so tuning a knob restyles what you can see above it
  // (the see-while-adjust loop the whole product is about). Drag the grabber to
  // resize; drag down past half to dismiss. Desktop keeps the inline column and
  // this all no-ops. See the field study (bottom-sheet is the token-editor norm).
  const panelRef = useRef<HTMLElement>(null)
  const gripRef = useRef<HTMLDivElement>(null)
  const isPhone = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  // Track the phone breakpoint as STATE so the sheet effect re-runs when the
  // viewport crosses 768 (e.g. a tablet rotating) — otherwise, crossing in with the
  // menu open leaves --sheet-ty unset and the sheet parks off-screen (translateY 100%).
  const [phone, setPhone] = useState(isPhone)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const on = () => setPhone(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // Animated dismiss so drag-down and the collapse button feel identical.
  const closeMenu = useCallback(() => {
    const p = panelRef.current
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!p || !isPhone() || reduce) { setMenuOpen(false); return }
    p.classList.add('panel--anim')
    p.style.setProperty('--sheet-ty', p.offsetHeight + 'px')
    window.setTimeout(() => setMenuOpen(false), 300)
  }, [])

  useEffect(() => {
    if (!menuOpen || !phone) return
    const p = panelRef.current
    const grip = gripRef.current
    if (!p || !grip || !isPhone()) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // The sheet is `height: 90dvh` (chrome.css) and the half detent shows ~48dvh of
    // it. Derive BOTH from the panel's own height, not window.innerHeight: on iOS
    // `innerHeight` = the LARGE viewport while the toolbar is visible, so mixing it
    // with a dvh-sized sheet made the half-snap land a few px off and jump when the
    // toolbar hid mid-session. `offsetHeight` always matches the sheet's dvh sizing.
    const SHEET_DVH = 0.9, HALF_VISIBLE_DVH = 0.48
    let halfTy = 0, closeTy = 0
    const measure = () => {
      const ph = p.offsetHeight
      halfTy = Math.max(0, Math.round(ph * (1 - HALF_VISIBLE_DVH / SHEET_DVH)))
      closeTy = ph
    }
    measure()

    // Enter: start fully down (off-screen), then animate up to the half detent.
    p.classList.remove('panel--anim')
    p.style.setProperty('--sheet-ty', closeTy + 'px')
    void p.offsetHeight // reflow so the next change transitions
    requestAnimationFrame(() => {
      p.classList.toggle('panel--anim', !reduce)
      p.style.setProperty('--sheet-ty', halfTy + 'px')
    })

    const cur = () => parseFloat(getComputedStyle(p).getPropertyValue('--sheet-ty')) || 0
    let dragging = false, startY = 0, startTy = 0, moved = 0
    const down = (e: PointerEvent) => {
      dragging = true; moved = 0; startY = e.clientY; startTy = cur()
      p.classList.remove('panel--anim')
      grip.setPointerCapture?.(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const dy = e.clientY - startY; moved = Math.max(moved, Math.abs(dy))
      p.style.setProperty('--sheet-ty', Math.min(closeTy, Math.max(0, startTy + dy)) + 'px')
      if (e.cancelable) e.preventDefault()
    }
    const up = () => {
      if (!dragging) return
      dragging = false
      p.classList.toggle('panel--anim', !reduce)
      const y = cur()
      if (moved < 6) { // a tap on the grabber toggles full <-> half
        p.style.setProperty('--sheet-ty', (y > halfTy / 2 ? 0 : halfTy) + 'px'); return
      }
      const dismissBelow = halfTy + Math.min(140, (closeTy - halfTy) * 0.5)
      if (y > dismissBelow) { closeMenu(); return }
      p.style.setProperty('--sheet-ty', (y < halfTy / 2 ? 0 : halfTy) + 'px') // snap full/half
    }
    grip.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
    const onResize = () => { measure(); if (!dragging) p.style.setProperty('--sheet-ty', halfTy + 'px') }
    window.addEventListener('resize', onResize)
    return () => {
      grip.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('resize', onResize)
    }
  }, [menuOpen, phone, closeMenu])

  // Dogfood: the configurator chrome runs on UIcockpit's OWN default kit. We emit
  // the DEFAULT_CONFIG tokens (in the current light/dark mode) onto .app, and the
  // chrome's --app-* vars alias these --k-* (see chrome.css). The live preview
  // overrides --k-* on .cockpit-preview, so it still shows the user's kit.
  const chromeTokens = useMemo(
    () => buildTokens({ ...DEFAULT_CONFIG, mode: cfg.mode }).vars as CSSProperties,
    [cfg.mode],
  )

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
            onCollapse={closeMenu}
            onRandomize={onRandomize}
            onReset={onReset}
            lockedKeys={lockedKeys}
            onToggleLock={onToggleLock}
            rootRef={panelRef}
            gripRef={gripRef}
          />
        )}
        <Stage
          cfg={cfg}
          tokens={tokens}
          view={view}
        />
      </div>
      <MobileControlBar
        onCustomize={() => setMenuOpen(true)}
        onShuffle={onRandomize}
        onExport={() => setExportOpen(true)}
      />
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
