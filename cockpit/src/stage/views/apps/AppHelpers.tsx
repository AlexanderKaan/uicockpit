import { useEffect, useRef, useState, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Icon } from '../../../icons/Icon'

/* Roving arrow-key navigation for a [role="menu"] container (WAI-ARIA menu
 * pattern). Attach to the menu's onKeyDown; it moves focus between the
 * [role="menuitem"] children. Enter/Space activate via the native <button>;
 * Escape + focus-return live in useDropdown. */
function handleMenuArrows(e: ReactKeyboardEvent<HTMLElement>) {
  const items = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'),
  )
  if (!items.length) return
  const idx = items.indexOf(document.activeElement as HTMLElement)
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus() }
  else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus() }
  else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus() }
}

/* ============================================================================
 * Shared helpers voor de 6 vertical apps. Houden de apps DRY zonder
 * componenten te complicaten met te veel state management. */

/* StatusBadge — ONE consistent treatment per status column (shadcn-style): every
 * tone is a soft dot+text badge, differing only by colour. The critical 'danger'
 * state still pops via its red dot + red text; it no longer switches to a heavier
 * SOLID pill, which read inconsistent sitting next to the soft dot rows. The
 * leading dot (currentColor) is the non-colour a11y channel; the label is primary. */
export function StatusBadge({ tone, label }: { tone: 'success' | 'warn' | 'danger' | 'info' | 'neutral'; label: string }) {
  return (
    <span className={`badge badge--${tone}`}><span className="badge__dot" /> {label}</span>
  )
}

/* Photo avatar with graceful fallback. The <img> (.avatar__img) covers the
 * initials once it loads; a broken/slow src triggers onError → the img unmounts
 * → the coloured initials underneath show through. Initials stay the accessible
 * name (img is decorative), so it reads correctly whether the photo loads or not. */
export function ImgAvatar({
  src, initials, size, tint, className = '', label,
}: {
  src: string; initials: string; size?: 'sm' | 'lg'; tint?: 1 | 2 | 3 | 4 | 5 | 6; className?: string; label?: string
}) {
  const [failed, setFailed] = useState(false)
  const cls = ['avatar', size && `avatar--${size}`, tint && `avatar--a${tint}`, className].filter(Boolean).join(' ')
  return (
    <span className={cls} role="img" aria-label={label ?? initials}>
      <span aria-hidden="true">{initials}</span>
      {!failed && <img className="avatar__img" src={src} alt="" onError={() => setFailed(true)} />}
    </span>
  )
}

/* useDropdown — hook voor any "click trigger → open menu → click outside
 * to close" patroon. Sluit op outside-click én Escape, en geeft de focus terug
 * aan de trigger bij keyboard-close (WAI-ARIA menu-button pattern), zodat
 * keyboard/SR-gebruikers niet naar <body> vallen na elke dismissal. */
export function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // The element focused when the menu opened IS the trigger; remember it so a
  // keyboard/SR user returns there on close. restoreFocus is also exposed so a
  // selection handler (item click) can return focus explicitly.
  const triggerRef = useRef<HTMLElement | null>(null)
  const restoreFocus = () => { triggerRef.current?.focus() }
  useEffect(() => {
    if (!open) return
    triggerRef.current = (document.activeElement as HTMLElement) ?? null
    const handleClick = (e: MouseEvent) => {
      // Outside-click: focus already moved to where the user clicked — do NOT
      // yank it back to the trigger (only keyboard-close restores).
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); restoreFocus() }
    }
    // Delay 0 zodat de openende click niet meteen close triggert
    setTimeout(() => document.addEventListener('mousedown', handleClick), 0)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])
  return { open, setOpen, ref, restoreFocus }
}

/* useModal — the modal contract a `role="dialog" aria-modal="true"` surface owes:
 * focus-trap (Tab/Shift+Tab wrap inside), Escape-to-close, body scroll-lock, and
 * focus-RETURN to the opener on close. Attach the returned ref to the dialog
 * element. Pass the same `open` the component renders on + an onClose. */
export function useModal<T extends HTMLElement = HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null)
  const prevFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!open) return
    prevFocus.current = document.activeElement as HTMLElement | null
    const el = ref.current
    const focusables = () =>
      el
        ? Array.from(
            el.querySelectorAll<HTMLElement>(
              'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
            ),
          )
        : []
    ;(focusables()[0] ?? el)?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const f = focusables()
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prevFocus.current?.focus()
    }
  }, [open])
  return ref
}

/* InteractiveSlider — drag-to-change value slider die de bestaande
 * .slider styling reuse't. Supports mouse + touch + click-to-seek + keyboard. */
export function InteractiveSlider({
  value,
  min = 0,
  max = 100,
  onChange,
  width,
  ariaLabel = 'Slider',
  disabled = false,
}: {
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
  width?: number | string
  ariaLabel?: string
  disabled?: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  // Real state (not a ref): the drag listeners must (de)attach on change, and
  // the knob's "grabbing" glow class needs a re-render. A ref wouldn't re-run
  // the effect, so listeners attached only incidentally and lagged on release.
  const [dragging, setDragging] = useState(false)
  const pct = ((value - min) / (max - min)) * 100

  const handlePointer = (clientX: number) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const next = min + ratio * (max - min)
    onChange(Math.round(next))
  }

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      const x = 'touches' in e ? e.touches[0]!.clientX : e.clientX
      handlePointer(x)
    }
    const up = () => setDragging(false)
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
    document.addEventListener('touchmove', move, { passive: false })
    document.addEventListener('touchend', up)
    return () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
      document.removeEventListener('touchmove', move)
      document.removeEventListener('touchend', up)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging])

  return (
    <div
      ref={trackRef}
      className={`slider${dragging ? ' slider--grabbing' : ''}${disabled ? ' slider--disabled' : ''}`}
      style={{ width, cursor: disabled ? 'not-allowed' : 'pointer', touchAction: 'none' }}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onMouseDown={disabled ? undefined : (e) => { setDragging(true); handlePointer(e.clientX) }}
      onTouchStart={disabled ? undefined : (e) => { setDragging(true); handlePointer(e.touches[0]!.clientX) }}
      onKeyDown={disabled ? undefined : (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(min, value - 1))
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(max, value + 1))
      }}
    >
      <span className="slider__fill" style={{ width: `${pct}%` }} />
      <span className="slider__knob" style={{ left: `${pct}%` }} />
    </div>
  )
}

/* DatePicker — themed date field. Replaces the native <input type="date">,
 * whose calendar popup is browser/OS chrome that CSS can't reach (it ignores
 * the theme tokens + component design entirely). This one is built purely from
 * existing design-system recipes — `.in` trigger + `.menu` overlay + the
 * `.calendar` grid — so it follows Color theme, Shape, Scale and Motion like
 * everything else. Month grid is Monday-first, fixed 6 rows so the popover
 * height never jumps; selecting a day closes it. */
const DP_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DP_DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
function dpPad(n: number) { return n < 10 ? '0' + n : '' + n }
function dpSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }

export function DatePicker({
  defaultValue,
  ariaLabel = 'Pick a date',
}: {
  defaultValue?: string // ISO yyyy-mm-dd
  ariaLabel?: string
}) {
  const { open, setOpen, ref } = useDropdown()
  const init = defaultValue ? new Date(defaultValue + 'T00:00:00') : new Date()
  const [selected, setSelected] = useState<Date>(init)
  const [view, setView] = useState<{ y: number; m: number }>({ y: init.getFullYear(), m: init.getMonth() })
  const today = new Date()

  // Build a Monday-first 6-row grid: leading days from the previous month,
  // this month's days, trailing days to fill 42 cells (stable height).
  const first = new Date(view.y, view.m, 1)
  const startDow = (first.getDay() + 6) % 7 // 0 = Monday
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const cells: Array<{ day: number; date: Date; out: boolean }> = []
  for (let i = 0; i < startDow; i++) {
    const d = new Date(view.y, view.m, i - startDow + 1)
    cells.push({ day: d.getDate(), date: d, out: true })
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, date: new Date(view.y, view.m, d), out: false })
  while (cells.length < 42) {
    const last = cells[cells.length - 1]!.date
    const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)
    cells.push({ day: d.getDate(), date: d, out: true })
  }

  const shift = (delta: number) => {
    const m = view.m + delta
    setView({ y: view.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 })
  }
  const label = `${dpPad(selected.getDate())} ${DP_MONTHS[selected.getMonth()]!.slice(0, 3)} ${selected.getFullYear()}`

  return (
    // Canonical date-picker pattern — the same .popover-wrap + .in--inline
    // trigger + .popover surface the gallery's DateCard catalogues (single-date
    // mode here; DateCard is the range variant). NOT a parallel .menu one-off.
    <div className="popover-wrap" ref={ref} style={{ width: '100%' }}>
      <button
        type="button"
        className="in in--inline"
        onClick={() => setOpen(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        style={{ width: '100%', cursor: 'pointer' }}
      >
        <Icon name="cal" size={15} />
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        <Icon name="chevD" size={13} />
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label={ariaLabel} style={{ width: 264 }}>
          <div className="card__row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--k-s-6)' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--k-type-small)' }}>{DP_MONTHS[view.m]} {view.y}</span>
            <span className="toolbar__group">
              <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => shift(-1)} aria-label="Previous month"><Icon name="chevL" /></button>
              <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => shift(1)} aria-label="Next month"><Icon name="chevR" /></button>
            </span>
          </div>
          <div className="calendar">
            {DP_DOW.map((d, i) => <span key={i} className="calendar__head">{d}</span>)}
            {cells.map((c, i) => {
              const on = !c.out && dpSameDay(c.date, selected)
              const isToday = !c.out && dpSameDay(c.date, today)
              const cls = ['calendar__cell']
              if (on) cls.push('calendar__cell--on')
              if (c.out) cls.push('calendar__cell--out')
              if (isToday) cls.push('calendar__cell--today')
              return (
                <button
                  key={i}
                  type="button"
                  className={cls.join(' ')}
                  disabled={c.out}
                  aria-current={on ? 'date' : undefined}
                  onClick={() => { setSelected(c.date); setView({ y: c.date.getFullYear(), m: c.date.getMonth() }); setOpen(false) }}
                >{c.day}</button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* RowMenu — een kleine "..." button die een dropdown menu opent.
 * Used voor track-row context, table-row actions, etc. */
export function RowMenu({ items }: { items: Array<{ label: string; icon?: ReactNode; danger?: boolean; onClick?: () => void }> }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn btn--ghost btn--sm btn--icon"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        aria-label="More actions"
        style={{ width: 28, height: 28, padding: 0 }}
      >
        <svg width="12" height="3" viewBox="0 0 12 3" aria-hidden>
          <circle cx="1.5" cy="1.5" r="1" fill="currentColor" />
          <circle cx="6" cy="1.5" r="1" fill="currentColor" />
          <circle cx="10.5" cy="1.5" r="1" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="menu" role="menu" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, minWidth: 180, zIndex: 'var(--k-z-dropdown)' }}>
          {items.map((item, i) => (
            <button
              key={i}
              className={'menu__item' + (item.danger ? ' menu__item--danger' : '')}
              onClick={() => { item.onClick?.(); setOpen(false) }}
            >
              {item.icon}
              <span style={{ marginLeft: item.icon ? 0 : 0 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* MenuButton — a labelled (or icon-only) trigger with a REAL dropdown menu,
 * dismissing on outside-click + Escape via useDropdown. The single answer to
 * "is a menu attached to every expand trigger?" — any toolbar chevron that used
 * to be a dead affordance (a caret promising a menu that never opened) becomes
 * a working menu by swapping the bare <button> for this. role/aria-haspopup/
 * aria-expanded are wired so it's announced as a menu button. */
export function MenuButton({
  label,
  icon,
  items,
  triggerClass = 'btn btn--ghost',
  align = 'left',
  ariaLabel,
}: {
  label?: string
  icon?: ReactNode
  items: Array<{ label: string; icon?: ReactNode; danger?: boolean; onClick?: () => void }>
  triggerClass?: string
  align?: 'left' | 'right'
  ariaLabel?: string
}) {
  const { open, setOpen, ref, restoreFocus } = useDropdown()
  const menuRef = useRef<HTMLDivElement>(null)
  // Focus the first item when the menu opens (WAI-ARIA menu-button pattern).
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        className={triggerClass}
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        onKeyDown={(e) => { if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(true) } }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {label}
        {label ? <Icon name="chevD" size={13} /> : icon}
      </button>
      {open && (
        <div
          ref={menuRef}
          className="menu"
          role="menu"
          onKeyDown={handleMenuArrows}
          style={{ position: 'absolute', [align]: 0, top: 'calc(100% + var(--k-s-4))', minWidth: 180, zIndex: 'var(--k-z-dropdown)' }}
        >
          {items.map((it, i) => (
            <button
              key={i}
              role="menuitem"
              className={'menu__item' + (it.danger ? ' menu__item--danger' : '')}
              onClick={() => { it.onClick?.(); setOpen(false); restoreFocus() }}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* Menubar — the desktop app menu bar (File / Edit / View …), WAI-ARIA menubar
 * pattern. Reuses the Golf-2 menu substrate: the popup is the same .menu recipe
 * and handleMenuArrows drives Up/Down/Home/End inside it. The menubar layer adds
 * the horizontal model: roving tabindex across the top-level triggers, Arrow
 * Left/Right to move (and, while a menu is open, to switch to the adjacent menu),
 * Down/Enter/Space to open, Escape to close + return focus to the trigger. Once a
 * menu is open, hovering another trigger switches to it (native menubar feel). */
type MenubarItem = { label: string; shortcut?: string; danger?: boolean; onSelect?: () => void }
export function Menubar({ menus, ariaLabel = 'Application' }: { menus: Array<{ label: string; items: MenubarItem[] }>; ariaLabel?: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const [active, setActive] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const triggers = useRef<Array<HTMLButtonElement | null>>([])
  const n = menus.length

  // Outside-click closes the open menu.
  useEffect(() => {
    if (open === null) return
    const onDoc = (e: MouseEvent) => { if (!barRef.current?.contains(e.target as Node)) setOpen(null) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // Focus the first item whenever the open menu changes (open or switch).
  useEffect(() => {
    if (open !== null) popRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [open])

  const moveTo = (i: number) => { setActive(i); triggers.current[i]?.focus() }

  const onTriggerKey = (e: ReactKeyboardEvent, i: number) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); moveTo((i + 1) % n) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); moveTo((i - 1 + n) % n) }
    else if (e.key === 'Home') { e.preventDefault(); moveTo(0) }
    else if (e.key === 'End') { e.preventDefault(); moveTo(n - 1) }
    else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(i); setOpen(i) }
  }

  const onPopKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault(); e.stopPropagation()
      const next = e.key === 'ArrowRight' ? (active + 1) % n : (active - 1 + n) % n
      setActive(next); setOpen(next)
    } else if (e.key === 'Escape') {
      e.preventDefault(); const t = active; setOpen(null); triggers.current[t]?.focus()
    } else {
      handleMenuArrows(e)
    }
  }

  return (
    <div ref={barRef} className="menubar" role="menubar" aria-orientation="horizontal" aria-label={ariaLabel} style={{ position: 'relative' }}>
      {menus.map((m, i) => (
        <div key={i} style={{ position: 'relative', display: 'inline-flex' }}>
          <button
            ref={(el) => { triggers.current[i] = el }}
            className="menubar__item"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={open === i}
            tabIndex={active === i ? 0 : -1}
            onClick={() => { setActive(i); setOpen(open === i ? null : i) }}
            onMouseEnter={() => { if (open !== null) { setActive(i); setOpen(i) } }}
            onKeyDown={(e) => onTriggerKey(e, i)}
          >
            {m.label}
          </button>
          {open === i && (
            <div
              ref={popRef}
              className="menu"
              role="menu"
              aria-label={m.label}
              onKeyDown={onPopKey}
              style={{ position: 'absolute', left: 0, top: 'calc(100% + var(--k-s-4))', minWidth: 184, zIndex: 'var(--k-z-dropdown)' }}
            >
              {m.items.map((it, j) => (
                <button
                  key={j}
                  role="menuitem"
                  className={'menu__item' + (it.danger ? ' menu__item--danger' : '')}
                  onClick={() => { it.onSelect?.(); const t = active; setOpen(null); triggers.current[t]?.focus() }}
                >
                  {it.label}
                  {it.shortcut && <span className="menu__shortcut">{it.shortcut}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* SplitMenu — a split button: a primary action fused (via .btn-group) to a
 * chevron that opens a REAL menu (outside-click + Escape via useDropdown). Keeps
 * the fused .btn-group visual intact — the two buttons stay direct children of
 * .btn-group — while the previously-dead options chevron becomes a working menu. */
export function SplitMenu({
  primaryLabel,
  primaryIcon,
  onPrimary,
  items,
  ariaLabel,
}: {
  primaryLabel: string
  primaryIcon?: ReactNode
  onPrimary?: () => void
  items: Array<{ label: string; icon?: ReactNode; danger?: boolean; onClick?: () => void }>
  ariaLabel: string
}) {
  const { open, setOpen, ref, restoreFocus } = useDropdown()
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [open])
  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <span className="btn-group" role="group" aria-label={ariaLabel}>
        <button className="btn btn--primary btn--sm" onClick={onPrimary}>{primaryIcon} {primaryLabel}</button>
        <button
          className="btn btn--primary btn--sm btn--icon"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`${ariaLabel} options`}
          onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
          onKeyDown={(e) => { if (!open && e.key === 'ArrowDown') { e.preventDefault(); setOpen(true) } }}
        >
          <Icon name="chevD" />
        </button>
      </span>
      {open && (
        <div
          ref={menuRef}
          className="menu"
          role="menu"
          onKeyDown={handleMenuArrows}
          style={{ position: 'absolute', right: 0, top: 'calc(100% + var(--k-s-4))', minWidth: 180, zIndex: 'var(--k-z-dropdown)' }}
        >
          {items.map((it, i) => (
            <button
              key={i}
              role="menuitem"
              className={'menu__item' + (it.danger ? ' menu__item--danger' : '')}
              onClick={() => { it.onClick?.(); setOpen(false); restoreFocus() }}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </span>
  )
}
