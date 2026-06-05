import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from '../../../icons/Icon'

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

/* useDropdown — hook voor any "click trigger → open menu → click outside
 * to close" patroon. Sluit op outside-click én Escape. */
export function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    // Delay 0 zodat de openende click niet meteen close triggert
    setTimeout(() => document.addEventListener('mousedown', handleClick), 0)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])
  return { open, setOpen, ref }
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
        <div className="menu" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, minWidth: 180, zIndex: 50 }}>
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
