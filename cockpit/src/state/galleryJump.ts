/**
 * Cross-view gallery jump (H3b) — a one-shot mailbox between views.
 *
 * The Showcases inspect panel wants "open this block in the gallery", but the
 * gallery's search query is local state in ComponentGallery and the views
 * remount on every switch. Instead of lifting the query through three layers
 * for one hand-off, the sender drops the query here and switches the view;
 * the gallery POPS it once in its useState initializer. Deliberately not
 * reactive — it's a baton pass, not shared state.
 */
let pending: string | null = null

export const setGalleryJump = (query: string): void => {
  pending = query
}

export const popGalleryJump = (): string | null => {
  const q = pending
  pending = null
  return q
}
