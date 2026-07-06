import { useState } from 'react'
import { ComponentGallery } from './ComponentGallery'
import { peekGalleryJumpTier } from '../../state/galleryJump'

/* Components — the merged Atom/Component altitude. One gallery; the tier is an
 * inline segctrl (dogfoods the kit) instead of two top-level tabs. Arriving via
 * a showcase Inspect jump pre-selects the tier so the searched part is visible
 * the instant the gallery pops the query.
 *
 * Extracted from Stage.tsx (IA-2) so the PUBLIC /components catalog page renders
 * the exact same audited gallery the configurator does — one source, no drift. */
export function ComponentsView() {
  const [tier, setTier] = useState<'atom' | 'component' | 'section' | 'page'>(() => peekGalleryJumpTier() ?? 'component')
  return (
    <div className="stagewrap">
      <div className="stagewrap__bar">
        <div className="segctrl" role="radiogroup" aria-label="Component altitude">
          {([
            ['atom', 'Atoms', 'Bare primitives — buttons, inputs, badges'],
            ['component', 'Components', 'Reusable units — tables, forms, dialogs'],
            ['section', 'Sections', 'Page regions — headers, entity cards, the app frame'],
            ['page', 'Pages', 'Full-bleed page templates — whole screens from section slabs'],
          ] as const).map(([t, label, sub]) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tier === t}
              title={`${label} — ${sub}`}
              className={`segctrl__btn ${tier === t ? 'segctrl__btn--on' : ''}`}
              onClick={() => setTier(t)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ComponentGallery tier={tier} key={tier} />
    </div>
  )
}
