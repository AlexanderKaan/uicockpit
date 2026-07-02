import { SlidersHorizontal, Shuffle, Code2 } from 'lucide-react'

interface MobileControlBarProps {
  /** Open the configurator drawer (the thumb-zone entry to the controls). */
  onCustomize: () => void
  /** Roll a fresh kit (undoable). */
  onShuffle: () => void
  /** Open the "Use this kit" export modal. */
  onExport: () => void
}

/**
 * Fixed bottom control bar for phones — the thumb-zone entry to the configurator,
 * a Shuffle for discovery, and the export CTA. Mirrors the bottom-sheet pattern
 * (shadcn's /create). Purely CSS-gated: `display:none` on desktop, and shown only
 * while the drawer is closed (`.app--menu-closed`) — the open drawer carries its
 * own controls, so the bar would be redundant there.
 */
export function MobileControlBar({ onCustomize, onShuffle, onExport }: MobileControlBarProps) {
  return (
    <div className="app__mobilebar" role="toolbar" aria-label="Configurator quick actions">
      <button type="button" className="app__mobilebar-btn" onClick={onCustomize}>
        <SlidersHorizontal size={18} strokeWidth={1.9} />
        Customize
      </button>
      <button
        type="button"
        className="app__mobilebar-btn"
        onClick={onShuffle}
        aria-label="Shuffle — roll a fresh kit"
      >
        <Shuffle size={18} strokeWidth={1.9} />
        Shuffle
      </button>
      <button
        type="button"
        className="app__mobilebar-btn app__mobilebar-btn--primary"
        onClick={onExport}
      >
        <Code2 size={18} strokeWidth={1.9} />
        Use kit
      </button>
    </div>
  )
}
