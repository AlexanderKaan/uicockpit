import { useMemo, useState } from 'react'
import { AppWindow, Boxes, Check, ChevronDown, Code, Heart, Link2, Moon, Palette, PanelLeft, Redo2, ShieldCheck, Sun, Undo2 } from 'lucide-react'
import type { ViewKind } from './Stage'
import type { Config, Tokens } from '../tokens/types'
import { auditContrast } from '../tokens/extras'
import { SavedKits } from '../panel/SavedKits'
import { useSavedKits } from '../state/savedKits'

interface TopbarProps {
  view: ViewKind
  onViewChange: (v: ViewKind) => void
  saved: boolean
  mode: 'light' | 'dark'
  onToggleMode: () => void
  onShare: () => void
  onExport: () => void
  tokens: Tokens
  cfg: Config
  onLoadKit: (cfg: Config) => void
  /** Floating control-menu open/closed + its toggle (lives in the topbar now
   *  that the menu floats over the stage instead of sitting in a column). */
  menuOpen: boolean
  onToggleMenu: () => void
  /** Brand click → back to the marketing home. */
  onHome?: () => void
  /** Undo/redo (C2) — config history. Buttons mirror ⌘Z / ⇧⌘Z. */
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export function Topbar({ view, onViewChange, saved, mode, onToggleMode, onShare, onExport, tokens, cfg, onLoadKit, menuOpen, onToggleMenu, onHome, onUndo, onRedo, canUndo, canRedo }: TopbarProps) {
  const [kitsOpen, setKitsOpen] = useState(false)
  // Shared saved-kits instance — the heart's count badge and the dropdown grid
  // read the same state, so saving a kit lights the heart immediately.
  const kits = useSavedKits()
  const savedCount = kits.slots.filter((s) => s.cfg).length
  const audit = useMemo(() => auditContrast(tokens), [tokens])
  const pass = audit.filter((p) => p.passes).length
  const total = audit.length
  const allPass = pass === total

  // One-time URL-as-save-file hint (C8) — the app's most elegant concept (your
  // whole kit lives in the URL) is otherwise invisible. Shown once, then remembered.
  const [urlHint, setUrlHint] = useState(() => {
    try { return localStorage.getItem('uic.hint.url') !== '1' } catch { return false }
  })
  const dismissUrlHint = () => {
    try { localStorage.setItem('uic.hint.url', '1') } catch { /* private mode */ }
    setUrlHint(false)
  }

  return (
    <header className="topbar">
      {/* Left = ambient status zone. "Saved to URL" tells you your work is
       *  safe; A11Y tells you the kit is accessible. Both are passive
       *  indicators — no actions. Grouping them here keeps the right side
       *  pure-action (Share, Export) and removes the visual competition
       *  the A11Y badge used to wage against the real CTAs. */}
      <div className="topbar__left">
        {/* Brand — runs across the top continuously above the floating menu.
         *  Click returns to the marketing home (Linear/Notion convention). */}
        {onHome ? (
          <button
            type="button"
            className="topbar__brand topbar__brand--link"
            onClick={onHome}
            aria-label="Back to UIcockpit home"
            title="Back to home"
          >
            <img src="/logo.svg" alt="" width={26} height={26} className="topbar__logo" />
            <span className="topbar__brand-name">UIcockpit</span>
          </button>
        ) : (
          <span className="topbar__brand">
            <img src="/logo.svg" alt="" width={26} height={26} className="topbar__logo" />
            <span className="topbar__brand-name">UIcockpit</span>
          </span>
        )}
        {/* Toggle the floating control menu. */}
        <button
          type="button"
          className={`topbar__icon-btn ${menuOpen ? 'topbar__icon-btn--on' : ''}`}
          onClick={onToggleMenu}
          aria-pressed={menuOpen}
          aria-label={menuOpen ? 'Hide controls' : 'Show controls'}
          title={menuOpen ? 'Hide controls' : 'Show controls'}
        >
          <PanelLeft size={15} strokeWidth={1.75} />
        </button>
        <span className="topbar__save" aria-live="polite">
          {saved ? 'Saved to URL' : 'Saving…'}
        </span>
        {urlHint && (
          <div className="urlhint" role="status">
            <span className="urlhint__text">Your whole kit lives in this URL — copy it any time to save or share. No account needed.</span>
            <button type="button" className="urlhint__btn" onClick={dismissUrlHint}>Got it</button>
          </div>
        )}
        <A11yBadge audit={audit} pass={pass} total={total} allPass={allPass} />
      </div>
      <div className="topbar__center">
        {/* The two modi (Fase J-6) — the loupe IA settled to TWO tabs. The old
         * Foundations + Sections rungs live INSIDE the Pages loupe now (Foundations
         * = the deepest "All tokens" zoom; Sections = the width slider's nav morph),
         * so the topbar is just the vocabulary and the screens that use it. */}
        <div className="view-toggle" role="tablist" aria-label="View">
          {/* Tooltips bridge the taxonomy to plain language for the vibe-coder
           * audience (C7) — the meaning is one hover away. */}
          {([
            ['components', 'Components', Boxes, 'The catalog — Atoms · Components · Sections · Pages'],
            ['pages', 'Showcases', AppWindow, 'Real screens — drill a showcase Screen › Section › Atom › All tokens'],
          ] as [ViewKind, string, typeof Palette, string][]).map(([k, label, Ico, sub]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={view === k}
              title={`${label} — ${sub}`}
              className={`view-toggle__btn ${view === k ? 'view-toggle__btn--on' : ''}`}
              onClick={() => onViewChange(k)}
            >
              <Ico size={14} strokeWidth={1.75} />
              <span className="view-toggle__lbl">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="topbar__right">
        {/* Undo / redo (C2) — config history; mirrors ⌘Z / ⇧⌘Z. */}
        <button
          type="button"
          className="topbar__icon-btn topbar__icon-btn--hist"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (⌘Z)"
        >
          <Undo2 size={15} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="topbar__icon-btn topbar__icon-btn--hist"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo (⇧⌘Z)"
        >
          <Redo2 size={15} strokeWidth={1.75} />
        </button>
        {/* Saved kits — heart opens a dropdown with the 3 local slots. */}
        <div className="kits-pop-wrap">
          <button
            type="button"
            className={`topbar__icon-btn kit-heart ${savedCount > 0 ? 'kit-heart--saved' : ''}`}
            onClick={() => setKitsOpen((v) => !v)}
            aria-expanded={kitsOpen}
            aria-label={savedCount > 0 ? `Saved kits (${savedCount} of 3)` : 'Saved kits'}
            title={savedCount > 0 ? `${savedCount} saved kit${savedCount > 1 ? 's' : ''}` : 'Saved kits'}
          >
            <Heart size={15} strokeWidth={1.75} fill={savedCount > 0 ? 'currentColor' : 'none'} />
            {savedCount > 0 && <span className="kit-heart__count" aria-hidden="true">{savedCount}</span>}
          </button>
          {kitsOpen && (
            <div className="kits-pop" role="dialog" aria-label="Saved kits" onMouseLeave={() => setKitsOpen(false)}>
              <div className="kits-pop__head">
                <span className="kits-pop__title">My kits</span>
                <span className="kits-pop__sub">{savedCount} of 3 slots saved in this browser</span>
              </div>
              <SavedKits cfg={cfg} api={kits} onLoad={(c) => { onLoadKit(c); setKitsOpen(false) }} />
            </div>
          )}
        </div>
        <button
          type="button"
          className="topbar__icon-btn"
          onClick={onToggleMode}
          aria-pressed={mode === 'dark'}
          aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {mode === 'dark' ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
        </button>
        <button type="button" className="topbar__btn topbar__btn--with-icon" onClick={onShare}>
          <Link2 size={13} strokeWidth={1.75} />
          Share
        </button>
        <button type="button" className="topbar__btn topbar__btn--code" onClick={onExport} aria-label="Use this kit">
          <span>Use kit</span>
          <Code size={14} strokeWidth={1.75} />
          <ChevronDown size={13} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}

/** Compact A11Y status — "X/Y WCAG pairs pass" with a colored shield.
 *  Click to expand a popover listing each contrast pair + its ratio.
 *  Failing rows surface a short remedy hint ("Try Background: Crisp, ...") —
 *  diagnosis + prescription in one place. Rows aren't clickable: the fix
 *  always happens in the panel, not via the audit popover. */
function A11yBadge({
  audit,
  pass,
  total,
  allPass,
}: {
  audit: ReturnType<typeof auditContrast>
  pass: number
  total: number
  allPass: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="a11y-badge-wrap">
      <button
        type="button"
        className={`a11y-badge ${allPass ? 'a11y-badge--ok' : 'a11y-badge--partial'}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="WCAG contrast audit"
      >
        {allPass ? (
          <Check size={11} strokeWidth={2.5} />
        ) : (
          <ShieldCheck size={11} strokeWidth={2.5} />
        )}
        <span className="a11y-badge__count">{pass}/{total}</span>
        <span className="a11y-badge__label">A11Y</span>
      </button>
      {open && (
        <>
          <button
            type="button"
            className="a11y-popover__scrim"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="a11y-popover" role="dialog" aria-label="WCAG contrast audit">
            <div className="a11y-popover__head">
              <span className="a11y-popover__title">WCAG contrast audit</span>
              <span className="a11y-popover__summary">
                {pass} of {total} pairs pass
              </span>
            </div>
            <div className="a11y-popover__list">
              {audit.map((p) => (
                <div
                  key={p.label}
                  className={`a11y-popover__row ${p.passes ? '' : 'a11y-popover__row--fail'}`}
                >
                  <div className="a11y-popover__row-top">
                    <span
                      className={`a11y-popover__dot a11y-popover__dot--${p.passes ? 'ok' : 'fail'}`}
                      aria-hidden
                    />
                    <span className="a11y-popover__label">{p.label}</span>
                    <span className="a11y-popover__ratio">{p.ratio.toFixed(2)}:1</span>
                    <span className="a11y-popover__req">needs {p.required}:1</span>
                  </div>
                  {p.remedy && (
                    <div className="a11y-popover__remedy">{p.remedy}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
