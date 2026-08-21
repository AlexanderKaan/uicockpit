/**
 * THE PARTS A SCENE IS MADE OF — and nothing more.
 *
 * A scene is written once, as data, and rendered by whichever kit is switched
 * on. That only works if there is a fixed vocabulary both sides agree on: the
 * scene says "a primary button", the kit's table says what a primary button is
 * in ITS classes. Adding a kit is then a table, not a rewrite of every scene —
 * the same reason the A2UI work could reach four stacks from one catalog.
 *
 * The list is deliberately short. Every part here has to be answered by EVERY
 * kit, and a vocabulary that grows faster than the tables can follow is how a
 * wall ends up with holes in it.
 */
export const PARTS = [
  'stack', 'row', 'grid', 'panel', 'divider',                        // layout
  'heading', 'text', 'muted', 'label',                               // content
  'button', 'iconrow', 'input', 'textarea', 'select',                // controls
  'checkbox', 'radio', 'switch', 'slider',                           //   and the rest of them
  'badge', 'alert', 'stat', 'progress', 'table', 'list', 'kv',       // display
  'chart', 'avatar', 'empty', 'tabs',                                //   and the rest of them
  'navbar', 'sidenav', 'breadcrumb', 'mediacard', 'footer',          // organisms
  'elevation', 'swatches', 'typespec', 'shapes',                     // foundation specimens
]

/**
 * The stand-in for a photograph.
 *
 * A card grid without pictures is not a card grid, and a card grid with stock
 * photographs is a lie about what you are getting. So it is a mark, drawn in
 * currentColor at low opacity, and obviously a placeholder — the same choice
 * every wireframe tool makes and for the same reason.
 */
export const PHOTO = '<svg viewBox="0 0 48 32" width="44" height="30" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" style="opacity:.35">'
  + '<rect x="1" y="1" width="46" height="30" rx="3"/><circle cx="13" cy="11" r="3.5"/><path d="M4 27l11-11 8 8 6-5 15 12"/></svg>'

export const TONES = ['neutral', 'brand', 'success', 'warning', 'danger']

export const esc = (s) => String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))
export const list = (v) => (Array.isArray(v) ? v : [])

/**
 * Render one scene tree with one kit's table.
 * A part the table does not answer is a VISIBLE hole, never a silent gap —
 * the same rule the catalog work landed on: a refusal renders as a refusal.
 */
export function render(node, bind) {
  if (node == null) return ''
  if (typeof node === 'string') return esc(node)
  const kids = list(node.kids).map((k) => render(k, bind)).join('')
  const fn = bind[node.p]
  if (!fn) return `<span data-missing="${esc(node.p)}" style="display:inline-block;padding:4px 8px;border:1px dashed currentColor;opacity:.6;font-size:12px">${esc(node.p)} — not in ${esc(bind._id)}</span>`
  return fn(node, kids)
}

/** Which parts a kit has no answer for. Run over PARTS, not over the table. */
export function gaps(bind) {
  return PARTS.filter((p) => typeof bind[p] !== 'function')
}
