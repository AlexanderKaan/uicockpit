/**
 * Cross-view gallery jump (H3b) — a one-shot mailbox between views.
 *
 * The Showcases inspect panel wants "open this section in the gallery", but the
 * gallery's search query is local state in ComponentGallery and the views
 * remount on every switch. Instead of lifting the query through three layers
 * for one hand-off, the sender drops the query here and switches the view;
 * the gallery POPS it once in its useState initializer. Deliberately not
 * reactive — it's a baton pass, not shared state.
 */
let pending: { q: string; tier?: 'atom' | 'component' | 'section' } | null = null

export const setGalleryJump = (query: string, tier?: 'atom' | 'component' | 'section'): void => {
  pending = { q: query, tier }
}

/** Read the pending jump's tier WITHOUT consuming it — the Components view uses
 *  this to pre-select the right altitude so the searched component is visible
 *  before the gallery pops the query. */
export const peekGalleryJumpTier = (): 'atom' | 'component' | 'section' | undefined => pending?.tier

export const popGalleryJump = (): string | null => {
  const q = pending?.q ?? null
  pending = null
  return q
}
