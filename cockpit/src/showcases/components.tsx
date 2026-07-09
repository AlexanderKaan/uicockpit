/**
 * components.tsx — the CLASS_MAP resolution table (leaf className → component id).
 *
 * This file once also held the per-component specimens (COMPONENTS) and the
 * runtime resolvers componentAt() / elementAt() that powered the loupe's leaf
 * Inspect. Those are gone: Inspect now resolves a clicked node via its
 * data-label / sectionInfo() in PagesView.tsx, so the runtime here had zero
 * importers. What remains is the CLASS_MAP DATA, still read AS TEXT by
 * scripts/audit-contract.mjs (the audit:contract gate) to enumerate the pickable
 * component types for its CONTRACT-coverage check. Keep the `export const
 * CLASS_MAP` name and the trailing `// end CLASS_MAP` marker stable — the audit
 * slices the id table between them.
 */

/** Leaf → component id. The deepest kit class that matches wins (a .btn inside
 *  a .card resolves to button, not card — a walk UP the tree returns the
 *  deepest match). This is the id list the audit:contract gate reads. */
export const CLASS_MAP: Array<[string, string]> = [
  // Leaf atoms first — a .btn inside a .pricing tier resolves to button, not the
  // tier (the walk UP returns the deepest match).
  ['stat-tile', 'stat'],
  ['toggle', 'switch'],
  ['tbl', 'table'],
  ['chip', 'chip'],
  ['badge', 'badge'],
  ['avatar', 'avatar'],
  ['tab', 'tabs'],
  ['in', 'input'],
  ['btn', 'button'],
  ['list__item', 'list'],
  ['msg', 'message'],
  ['prose', 'prose'],
  // Block-tier containers (Fase J-8) — resolve the distinctive chrome to its real
  // recipe before the walk-up reaches the generic .card wrapper.
  ['chart', 'chart'],
  ['kanban', 'kanban'],
  ['pricing', 'pricing'],
  ['tree', 'tree'],
  ['timeline', 'timeline'],
  ['dropzone', 'dropzone'],
  ['dl', 'dl'],
  ['stepper', 'stepper'],
  ['aspect', 'aspect'],
  ['toolbar', 'toolbar'],
  // Chrome / navigation tier — resolve the structural surfaces too, so the WHOLE
  // screen is pickable (nav, topbar, banners), not just the leaf atoms. These sit
  // after the leaf atoms so a .btn inside the sidebar still resolves to button.
  ['banner', 'banner'],
  ['alert', 'alert'],
  ['select-trigger', 'select'],
  ['calendar', 'calendar'],
  ['segctrl', 'segmented'],
  ['navsuite', 'navsuite'],
  ['sidenav', 'sidenav'],
  ['appbar', 'appbar'],
  ['card', 'card'],
]
// end CLASS_MAP — scripts/audit-contract.mjs slices the id table above to here.
