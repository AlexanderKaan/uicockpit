import { memo } from 'react'
import { ComponentGallery } from './ComponentGallery'

/* Components — ONE flat, searchable overview (atoms + components + sections in a
 * single wall, the shadcn model). The old 4-way Atoms/Components/Sections/Pages
 * sub-toggle is retired: a second nav layer that muddled the IA (and worst of all
 * on mobile, where it fought the wall + the bottom-sheet for space). Findability is
 * carried by search; the tier LADDER still lives in segments.ts (export/MCP/manifest
 * banner) — only the browse filter is gone. "Pages" (generic archetype templates)
 * overlapped with the Showcases tab and is unlinked here pending a relocate/retire.
 *
 * A showcase Inspect jump still lands the right component: it sets the search query
 * (popGalleryJump), which filters this one wall to the jumped-to component.
 *
 * Extracted from Stage.tsx (IA-2) so the PUBLIC /components catalog renders the exact
 * same audited gallery the configurator does — one source, no drift. */
/* memo: the view takes no props and reads the kit only through CSS vars (on
 * `.cockpit-preview`), so a knob change must NOT re-render its ~116 cards — that
 * full-subtree re-render on every slider tick is what made mobile crawl. Icons
 * still update through IconProvider context; everything else restyles via CSS. */
export const ComponentsView = memo(function ComponentsView() {
  return (
    <div className="stagewrap">
      <ComponentGallery tier="all" />
    </div>
  )
})
