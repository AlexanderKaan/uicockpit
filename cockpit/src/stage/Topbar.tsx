import { useMemo, useState } from 'react'
import { Check, ChevronDown, Code, Heart, Moon, PanelLeft, Redo2, ShieldCheck, Sun, Undo2 } from 'lucide-react'
import type { Config, Tokens } from '../tokens/types'
import { auditContrast } from '../tokens/extras'
import { SavedKits } from '../panel/SavedKits'
import { useSavedKits } from '../state/savedKits'
import { Wordmark } from '../Wordmark'
import { SITE_NAV } from '../marketing/siteNav'
import { ping } from '../analytics/beacon'

interface TopbarProps {
  mode: 'light' | 'dark'
  onToggleMode: () => void
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
  /** The site's nav, in the topbar's centre — the same SITE_NAV the marketing
   *  nav renders, so the four tools are in line and every one is a click away
   *  from inside the configurator. Absent (no router, e.g. tests) → no row. */
  onNavigate?: (to: string) => void
  /** Present only when an audit is loaded — drives the stage's two modes. */
  stageMode?: 'catalogue' | 'audit'
  onStageMode?: (m: 'catalogue' | 'audit') => void
  /** Undo/redo (C2) — config history. Buttons mirror ⌘Z / ⇧⌘Z. */
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export function Topbar({ stageMode, onStageMode, mode, onToggleMode, onExport, tokens, cfg, onLoadKit, menuOpen, onToggleMenu, onHome, onNavigate, onUndo, onRedo, canUndo, canRedo }: TopbarProps) {
  const [kitsOpen, setKitsOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
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
      {/* Left = brand · controls toggle · Docs · A11Y. The A11Y badge is a passive
       *  indicator (no action); Docs is a nav link into the in-app guide. Keeping
       *  them here leaves the right side pure-action (Share, Use kit). */}
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
            <Wordmark height={22} className="topbar__wordmark topbar__wordmark--full" />
            <Wordmark height={24} markOnly className="topbar__wordmark topbar__wordmark--mark" />
          </button>
        ) : (
          <span className="topbar__brand">
            <Wordmark height={22} className="topbar__wordmark topbar__wordmark--full" />
            <Wordmark height={24} markOnly className="topbar__wordmark topbar__wordmark--mark" />
          </span>
        )}
        {/* The site's nav, in line with the marketing bar: Components · the four
         *  services · Docs — SITE_NAV, right after the brand (site chrome first,
         *  the instrument's controls after it). "Configure" is this page. When
         *  the row cannot fit (narrow screens, or the audit's mode switch on a
         *  laptop) it folds into a menu with the same list; the wordmark leads
         *  home either way. */}
        {onNavigate && (
          <>
            <nav className="topbar__nav" aria-label="Site">
              {SITE_NAV.map((n) => (
                <a
                  key={n.id}
                  href={n.to}
                  className={`topbar__nav-link${n.group === 'ground' ? ' topbar__nav-link--first' : ''}`}
                  {...(n.id === 'configure' ? { 'aria-current': 'page' as const } : {})}
                  onClick={(e) => { e.preventDefault(); if (n.id !== 'configure') { if (n.group === 'service') ping('door', n.id); onNavigate(n.to) } }}
                >{n.label}</a>
              ))}
            </nav>
            <div className="topbar__navmenu">
              <button
                type="button"
                className="btn btn--ghost btn--sm topbar__navmenu-btn"
                onClick={() => setNavOpen((v) => !v)}
                aria-expanded={navOpen}
                aria-haspopup="menu"
                aria-label="Site navigation"
              >
                <span className="topbar__navmenu-label">Configure</span> <ChevronDown size={13} strokeWidth={2.25} aria-hidden="true" />
              </button>
              {navOpen && (
                <div className="menu topbar__navmenu-pop" role="menu" aria-label="Site" onMouseLeave={() => setNavOpen(false)}>
                  {SITE_NAV.map((n) => (
                    <a
                      key={n.id}
                      href={n.to}
                      role="menuitem"
                      className={`menu__item${n.id === 'configure' ? ' menu__item--current' : ''}`}
                      {...(n.id === 'configure' ? { 'aria-current': 'page' as const } : {})}
                      onClick={(e) => { e.preventDefault(); setNavOpen(false); if (n.id !== 'configure') { if (n.group === 'service') ping('door', n.id); onNavigate(n.to) } }}
                    >{n.label}</a>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {/* Toggle the floating control menu. */}
        <button
          type="button"
          className={`btn btn--ghost btn--icon topbar__icon-btn topbar__icon-btn--menu ${menuOpen ? 'topbar__icon-btn--on' : ''}`}
          onClick={onToggleMenu}
          aria-pressed={menuOpen}
          aria-label={menuOpen ? 'Hide controls' : 'Show controls'}
          title={menuOpen ? 'Hide controls' : 'Show controls'}
        >
          <PanelLeft size={15} strokeWidth={1.75} />
        </button>
        <A11yBadge audit={audit} pass={pass} total={total} allPass={allPass} />
        {/* Two modes, one shell. Only appears when there IS an audit to show —
         *  a switch with one meaningful position is furniture, not a control. */}
        {stageMode && onStageMode && (
          <div className="modesw" role="radiogroup" aria-label="What the stage shows">
            <button
              type="button" role="radio" aria-checked={stageMode === 'audit'}
              className="modesw__btn" onClick={() => onStageMode('audit')}
            >Your app</button>
            <button
              type="button" role="radio" aria-checked={stageMode === 'catalogue'}
              className="modesw__btn" onClick={() => onStageMode('catalogue')}
            >Full catalogue</button>
          </div>
        )}
      </div>
      <div className="topbar__center">
      </div>
      <div className="topbar__right">
        {/* Undo / redo (C2) — config history; mirrors ⌘Z / ⇧⌘Z. */}
        <button
          type="button"
          className="btn btn--ghost btn--icon topbar__icon-btn topbar__icon-btn--hist"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (⌘Z)"
        >
          <Undo2 size={15} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--icon topbar__icon-btn topbar__icon-btn--hist"
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
            className={`btn btn--ghost btn--icon topbar__icon-btn kit-heart ${savedCount > 0 ? 'kit-heart--saved' : ''}`}
            onClick={() => setKitsOpen((v) => !v)}
            aria-expanded={kitsOpen}
            aria-label={savedCount > 0 ? `Saved kits (${savedCount} of 3)` : 'Saved kits'}
            title={savedCount > 0 ? `${savedCount} saved kit${savedCount > 1 ? 's' : ''}` : 'Saved kits'}
          >
            <Heart size={15} strokeWidth={1.75} fill={savedCount > 0 ? 'currentColor' : 'none'} />
            {savedCount > 0 && <span className="kit-heart__count" aria-hidden="true">{savedCount}</span>}
          </button>
          {kitsOpen && (
            <div className="menu menu--panel kits-pop" role="dialog" aria-label="Saved kits" onMouseLeave={() => setKitsOpen(false)}>
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
          className="btn btn--ghost btn--icon topbar__icon-btn"
          onClick={onToggleMode}
          aria-pressed={mode === 'dark'}
          aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {mode === 'dark' ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
        </button>
        <button type="button" className="topbar__btn topbar__btn--code" onClick={onExport} aria-label="Use this kit">
          <Code size={14} strokeWidth={1.75} />
          <span>Use kit</span>
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
