/**
 * KitToggle (IA-3) — the "Default kit ↔ Your kit" switch shown on the site's
 * reference surfaces when the visitor has a kit. Hidden when they don't (a
 * hint-to-configure link takes its place). Pure presentational; the state lives
 * in useVisitorKit.
 */
export function KitToggle({
  hasKit,
  showKit,
  onChange,
  onConfigure,
}: {
  hasKit: boolean
  showKit: boolean
  onChange: (next: boolean) => void
  onConfigure: () => void
}) {
  if (!hasKit) {
    return (
      <button type="button" className="mkt-btn mkt-btn--ghost mkt__kit-hint" onClick={onConfigure}>
        Configure a kit → preview every component in it
      </button>
    )
  }
  return (
    <div className="mkt__kittoggle" role="radiogroup" aria-label="Preview kit">
      <button
        type="button"
        role="radio"
        aria-checked={!showKit}
        className={`mkt__kittoggle-btn ${!showKit ? 'mkt__kittoggle-btn--on' : ''}`}
        onClick={() => onChange(false)}
      >
        Default kit
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={showKit}
        className={`mkt__kittoggle-btn ${showKit ? 'mkt__kittoggle-btn--on' : ''}`}
        onClick={() => onChange(true)}
      >
        Your kit
      </button>
    </div>
  )
}
