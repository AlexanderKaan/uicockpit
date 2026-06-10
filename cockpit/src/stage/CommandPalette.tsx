import { useEffect, useMemo, useRef, useState, type CSSProperties, type ComponentType, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import {
  AppWindow, Boxes, Box, Code, Link2, Moon, Palette, RotateCcw, Search, Sliders, Square, Sun, Redo2, Undo2, Layers,
} from 'lucide-react'
import type { Config, Tokens } from '../tokens/types'
import type { ConfigAction } from '../state/configReducer'
import { COLOR_THEMES } from '../tokens/stylesAndThemes'
import type { ColorTheme } from '../tokens/types'
import type { ViewKind } from './Stage'

/* ⌘K command palette (C3) — DOGFOODS the kit's own `.cmdp` recipe. The surface
 * is rendered inside a themed `.cockpit-preview` wrapper (tokens.vars applied),
 * so the palette literally IS the command-palette component the product ships,
 * live-themed to whatever kit you're configuring. Icons are lucide svgs rendered
 * as direct children of `.cmdp__item` so the recipe's `> svg` rule sizes them. */

interface Cmd {
  group: string
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  hint?: string
  run: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  tokens: Tokens
  dispatch: (a: ConfigAction) => void
  onViewChange: (v: ViewKind) => void
  onShare: () => void
  onExport: () => void
  undo: () => void
  redo: () => void
}

const THEME_LABELS: Record<ColorTheme, string> = {
  mono: 'Mono (greyscale)', cobalt: 'Cobalt', sky: 'Sky', teal: 'Teal', jade: 'Jade',
  ember: 'Ember', coral: 'Coral', indigo: 'Indigo', violet: 'Violet', rose: 'Rose',
}
const SCALES: { id: Config['scale']; label: string }[] = [
  { id: 'compact', label: 'Compact' }, { id: 'default', label: 'Default' }, { id: 'comfortable', label: 'Comfortable' },
]
const RADII: { id: Config['radius']; label: string }[] = [
  { id: 'none', label: 'None' }, { id: 'subtle', label: 'Subtle' }, { id: 'soft', label: 'Soft' }, { id: 'round', label: 'Round' },
]

export function CommandPalette({ open, onClose, tokens, dispatch, onViewChange, onShare, onExport, undo, redo }: CommandPaletteProps) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset query + focus the input every time the palette opens.
  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [open])

  const close = () => onClose()
  const runAndClose = (fn: () => void) => { fn(); onClose() }

  const commands = useMemo<Cmd[]>(() => {
    const cmds: Cmd[] = []
    // Navigate
    const views: { v: ViewKind; label: string; icon: Cmd['icon'] }[] = [
      { v: 'foundations', label: 'Foundations', icon: Sliders },
      { v: 'atoms', label: 'Atoms', icon: Box },
      { v: 'blocks', label: 'Blocks', icon: Boxes },
      { v: 'pages', label: 'Pages', icon: AppWindow },
    ]
    for (const { v, label, icon } of views) cmds.push({ group: 'Go to', label: `Go to ${label}`, icon, run: () => onViewChange(v) })
    // Brand color theme
    for (const id of Object.keys(COLOR_THEMES) as ColorTheme[]) {
      cmds.push({ group: 'Brand color', label: `Brand: ${THEME_LABELS[id]}`, icon: Palette, run: () => dispatch({ type: 'APPLY_COLOR_THEME', id }) })
    }
    // Scale
    for (const s of SCALES) cmds.push({ group: 'Scale', label: `Scale: ${s.label}`, icon: Layers, run: () => dispatch({ type: 'SET', patch: { scale: s.id } }) })
    // Box radius
    for (const r of RADII) cmds.push({ group: 'Box radius', label: `Box radius: ${r.label}`, icon: Square, run: () => dispatch({ type: 'SET', patch: { radius: r.id } }) })
    // Appearance
    cmds.push({ group: 'Appearance', label: 'Light mode', icon: Sun, run: () => dispatch({ type: 'SET', patch: { mode: 'light' } }) })
    cmds.push({ group: 'Appearance', label: 'Dark mode', icon: Moon, run: () => dispatch({ type: 'SET', patch: { mode: 'dark' } }) })
    // Actions
    cmds.push({ group: 'Actions', label: 'Copy share link', icon: Link2, hint: 'URL', run: onShare })
    cmds.push({ group: 'Actions', label: 'Use this kit — export', icon: Code, run: onExport })
    cmds.push({ group: 'Actions', label: 'Undo', icon: Undo2, hint: '⌘Z', run: undo })
    cmds.push({ group: 'Actions', label: 'Redo', icon: Redo2, hint: '⇧⌘Z', run: redo })
    cmds.push({ group: 'Actions', label: 'Reset to Mono (greyscale)', icon: RotateCcw, run: () => dispatch({ type: 'APPLY_COLOR_THEME', id: 'mono' }) })
    return cmds
  }, [dispatch, onViewChange, onShare, onExport, undo, redo])

  // Token-AND filter over (label + group) so "radius round" surfaces "Box radius: Round".
  const matches = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (!terms.length) return commands
    return commands.filter((c) => {
      const hay = `${c.group} ${c.label}`.toLowerCase()
      return terms.every((t) => hay.includes(t))
    })
  }, [q, commands])

  const clamped = matches.length ? Math.min(active, matches.length - 1) : 0
  const groups = useMemo(() => [...new Set(matches.map((m) => m.group))], [matches])

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(matches.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (matches[clamped]) runAndClose(matches[clamped]!.run) }
    else if (e.key === 'Escape') { e.preventDefault(); close() }
  }

  if (!open) return null

  return (
    <div className="cmdk-scrim" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="cockpit-preview cmdk-host" style={tokens.vars as CSSProperties}>
        <div className="cmdp" role="dialog" aria-modal="true" aria-label="Command palette">
          <div className="cmdp__in">
            <Search size={16} strokeWidth={1.75} />
            <input
              ref={inputRef}
              placeholder="Type a command or search…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setActive(0) }}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded
              aria-controls="cmdk-list"
              aria-activedescendant={matches.length ? `cmdk-opt-${clamped}` : undefined}
            />
            <span className="kbd">ESC</span>
          </div>
          {matches.length === 0 ? (
            <div className="cmdp__empty">No commands match “{q}”.</div>
          ) : (
            <div id="cmdk-list" className="cmdk-scroll" role="listbox" aria-label="Commands">
              {groups.map((g) => (
                <div key={g}>
                  <div className="cmdp__section">{g}</div>
                  <ul className="cmdp__list">
                    {matches.map((c, i) =>
                      c.group === g ? (
                        <li key={c.label}>
                          <button
                            id={`cmdk-opt-${i}`}
                            type="button"
                            role="option"
                            aria-selected={i === clamped}
                            className={`cmdp__item ${i === clamped ? 'cmdp__item--on' : ''}`}
                            onMouseMove={() => setActive(i)}
                            onClick={() => runAndClose(c.run)}
                          >
                            <c.icon size={15} strokeWidth={1.75} />
                            <span style={{ flex: 1 }}>{c.label}</span>
                            {c.hint && <span className="cmdp__shortcut"><span className="kbd">{c.hint}</span></span>}
                          </button>
                        </li>
                      ) : null,
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
