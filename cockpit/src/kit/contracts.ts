// === The Role Canvas — declarative layer (the first brick) ==================
// A small CLOSED set of ROLES, each carrying a guaranteed perceptual TREATMENT.
// A component's CONTRACT lists which role each of its parts wears. This is the
// data the loupe's contract card reads — and the truth a future audit/ENFORCE
// rail will check. See ROLE-CANVAS.md for the thesis (role → treatment, on one
// canvas; bind to ARIA states + data-slot). Keyed by CLASS_MAP ids.

export type Role =
  | 'control' // interactive: a button, field, toggle, row-action
  | 'selectable' // picks a value: a selected row / option / chip / tab / day
  | 'surface' // a container that separates content from its ground
  | 'tone-bearer' // carries a status/brand tone (badge, banner, series)
  | 'text-slot' // holds text that must not break the layout
  | 'overlay' // a floating surface (menu, dialog, popover)

/** The guarantee each role makes — the perceptual treatment it inherits. */
export const ROLE_GUARANTEE: Record<Role, string> = {
  control: 'height · focus-ring · hit-target ≥24px',
  selectable: 'selected-edge + fill (survives flat depth)',
  surface: 'elevation + separation from the ground',
  'tone-bearer': 'tinted fill + AA-derived foreground',
  'text-slot': 'single-line clamp / truncation',
  overlay: 'max-height + scroll + focus-trap',
}

export type Part = { part: string; role: Role }

/** component-type → its parts and the role each part plays. The breadth mirrors
 *  what CLASS_MAP enumerates (the pickable types). */
export const CONTRACT: Record<string, Part[]> = {
  button: [{ part: 'Button', role: 'control' }, { part: 'Label', role: 'text-slot' }],
  input: [{ part: 'Field', role: 'control' }, { part: 'Label', role: 'text-slot' }],
  switch: [{ part: 'Toggle', role: 'control' }, { part: 'On-state', role: 'selectable' }],
  badge: [{ part: 'Badge', role: 'tone-bearer' }, { part: 'Label', role: 'text-slot' }],
  chip: [{ part: 'Chip', role: 'selectable' }, { part: 'Label', role: 'text-slot' }],
  table: [
    { part: 'Row', role: 'selectable' },
    { part: 'Cell', role: 'text-slot' },
    { part: 'Status', role: 'tone-bearer' },
    { part: 'Checkbox', role: 'control' },
  ],
  list: [{ part: 'Item', role: 'selectable' }, { part: 'Text', role: 'text-slot' }],
  card: [{ part: 'Card', role: 'surface' }, { part: 'Title', role: 'text-slot' }, { part: 'Action', role: 'control' }],
  stat: [{ part: 'Tile', role: 'surface' }, { part: 'Value', role: 'text-slot' }],
  avatar: [{ part: 'Avatar', role: 'surface' }],
  tabs: [{ part: 'Tab', role: 'selectable' }, { part: 'Label', role: 'text-slot' }],
  chart: [{ part: 'Plot', role: 'surface' }, { part: 'Series', role: 'tone-bearer' }],
  kanban: [{ part: 'Card', role: 'selectable' }, { part: 'Tag', role: 'tone-bearer' }],
  pricing: [{ part: 'Plan', role: 'surface' }, { part: 'CTA', role: 'control' }, { part: 'Badge', role: 'tone-bearer' }],
  tree: [{ part: 'Row', role: 'selectable' }, { part: 'Label', role: 'text-slot' }],
  timeline: [{ part: 'Event', role: 'surface' }, { part: 'State', role: 'tone-bearer' }],
  dropzone: [{ part: 'Zone', role: 'control' }, { part: 'Hint', role: 'text-slot' }],
  dl: [{ part: 'Term', role: 'text-slot' }, { part: 'Value', role: 'text-slot' }],
  stepper: [{ part: 'Step', role: 'selectable' }, { part: 'Label', role: 'text-slot' }],
  toolbar: [{ part: 'Bar', role: 'surface' }, { part: 'Control', role: 'control' }],
  message: [{ part: 'Bubble', role: 'surface' }, { part: 'Text', role: 'text-slot' }],
  prose: [{ part: 'Body', role: 'text-slot' }],
  aspect: [{ part: 'Media', role: 'surface' }],
  // chrome / navigation tier
  sidenav: [{ part: 'Active item', role: 'selectable' }, { part: 'Item', role: 'control' }, { part: 'Label', role: 'text-slot' }],
  navsuite: [{ part: 'Active item', role: 'selectable' }, { part: 'Item', role: 'control' }],
  appbar: [{ part: 'Bar', role: 'surface' }, { part: 'Action', role: 'control' }, { part: 'Search', role: 'control' }],
  banner: [{ part: 'Banner', role: 'tone-bearer' }, { part: 'Text', role: 'text-slot' }, { part: 'Action', role: 'control' }],
  alert: [{ part: 'Alert', role: 'tone-bearer' }, { part: 'Text', role: 'text-slot' }],
  select: [{ part: 'Trigger', role: 'control' }, { part: 'Menu', role: 'overlay' }, { part: 'Option', role: 'selectable' }],
  calendar: [{ part: 'Day', role: 'selectable' }, { part: 'Cell', role: 'control' }],
  segmented: [{ part: 'Segment', role: 'selectable' }, { part: 'Label', role: 'text-slot' }],
}
