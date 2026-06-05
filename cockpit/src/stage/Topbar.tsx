import { useMemo, useState } from 'react'
import { AppWindow, Check, ChevronDown, Code, Heart, LayoutGrid, Link2, Moon, PanelLeft, ShieldCheck, Sun } from 'lucide-react'
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
}

export function Topbar({ view, onViewChange, saved, mode, onToggleMode, onShare, onExport, tokens, cfg, onLoadKit, menuOpen, onToggleMenu, onHome }: TopbarProps) {
  const [kitsOpen, setKitsOpen] = useState(false)
  // Shared saved-kits instance — the heart's count badge and the dropdown grid
  // read the same state, so saving a kit lights the heart immediately.
  const kits = useSavedKits()
  const savedCount = kits.slots.filter((s) => s.cfg).length
  const audit = useMemo(() => auditContrast(tokens), [tokens])
  const pass = audit.filter((p) => p.passes).length
  const total = audit.length
  const allPass = pass === total

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
        <A11yBadge audit={audit} pass={pass} total={total} allPass={allPass} />
      </div>
      <div className="topbar__center">
        {/* View switcher — a labeled top toggle (icon + word) between the
         * Components gallery and the unified Application. Replaces the old
         * vertical AppRail so both views get the full stage width. */}
        <div className="view-toggle" role="tablist" aria-label="View">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'components'}
            className={`view-toggle__btn ${view === 'components' ? 'view-toggle__btn--on' : ''}`}
            onClick={() => onViewChange('components')}
          >
            <LayoutGrid size={14} strokeWidth={1.75} />
            Components
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'app'}
            className={`view-toggle__btn ${view === 'app' ? 'view-toggle__btn--on' : ''}`}
            onClick={() => onViewChange('app')}
          >
            <AppWindow size={14} strokeWidth={1.75} />
            Application
          </button>
        </div>
      </div>
      <div className="topbar__right">
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
