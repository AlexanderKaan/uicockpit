/**
 * THE SCENES — written once, rendered by whichever kit is on.
 *
 * These are what the wall shows, and their job is confidence: someone has to be
 * able to picture their own app in them well enough to press export. So they are
 * whole things a product actually has — a queue, a form, the moments where
 * something went right or wrong — with real copy rather than "Label / Value".
 *
 * A scene is data. It contains no classes, no colours and no kit names: the
 * moment a scene knows which kit it is in, adding a kit stops being a table.
 *
 * Each one names its RUNG, because five scenes at once is a wall you scroll
 * rather than a wall you read: `parts` is the specimen sheet, `screens` are
 * pieces of a product, `page` is the whole thing with its own chrome.
 */
export const RUNGS = [
  { id: 'all', label: 'Everything' },
  { id: 'parts', label: 'Parts' },
  { id: 'screens', label: 'Screens' },
  { id: 'page', label: 'A whole page' },
]
export const SCENES = [
  {
    id: 'dashboard', rung: 'screens', title: 'A product screen', span: 8,
    node: { p: 'stack', gap: 4, kids: [
      { p: 'row', between: true, kids: [
        { p: 'heading', level: 2, text: 'Requests' },
        { p: 'row', kids: [{ p: 'button', tone: 'secondary', text: 'Filter' }, { p: 'button', tone: 'brand', text: 'New request' }] },
      ] },
      { p: 'tabs', items: ['Open', 'Decided', 'Withdrawn'] },
      { p: 'grid', cols: 4, kids: [
        { p: 'stat', label: 'Open requests', value: '128' },
        { p: 'stat', label: 'Median decision', value: '19 days' },
        { p: 'stat', label: 'Overdue', value: '7' },
        { p: 'stat', label: 'Satisfaction', value: '4.4' },
      ] },
      { p: 'panel', kids: [
        { p: 'table', cols: ['Reference', 'Owner', 'Status', 'Due'], rows: [
          ['2026-04471', 'M. Visser', 'Under review', '28 Sep'],
          ['2026-03918', 'K. Boone', 'Granted', '—'],
          ['2026-03744', 'A. Yildiz', 'Refused', '—'],
        ] },
      ] },
    ] },
  },
  {
    id: 'form', rung: 'screens', title: 'A form', span: 4,
    node: { p: 'panel', kids: [{ p: 'stack', gap: 3, kids: [
      { p: 'heading', text: 'New request' },
      { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'Reference' }, { p: 'input', value: '2026-04471' }] },
      { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'Category' }, { p: 'select', options: ['Building work', 'Felling', 'Signage'] }] },
      { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'Postcode' }, { p: 'input', placeholder: '3011 AA' }] },
      { p: 'checkbox', on: true, text: 'This is my own household' },
      { p: 'switch', on: true, text: 'Notify me by email' },
      { p: 'row', between: true, kids: [
        { p: 'button', tone: 'ghost', text: 'Cancel' },
        { p: 'button', tone: 'brand', text: 'Submit' },
      ] },
    ] }] },
  },
  {
    id: 'feedback', rung: 'screens', title: 'When something happens', span: 6,
    node: { p: 'stack', gap: 3, kids: [
      { p: 'alert', tone: 'success', text: 'Saved. Your changes are live.' },
      { p: 'alert', tone: 'warning', text: 'Check this. The due date is in the past.' },
      { p: 'alert', tone: 'danger', text: 'Not sent. Two fields are missing.' },
      { p: 'divider' },
      { p: 'row', kids: [
        { p: 'badge', tone: 'brand', text: 'Under review' },
        { p: 'badge', tone: 'success', text: 'Granted' },
        { p: 'badge', tone: 'danger', text: 'Refused' },
        { p: 'badge', tone: 'neutral', text: 'Draft' },
      ] },
      { p: 'row', kids: [
        { p: 'avatar', text: 'MV' }, { p: 'avatar', text: 'KB' }, { p: 'avatar', text: 'AY' },
        { p: 'muted', text: 'and six others on this case' },
      ] },
    ] },
  },
  {
    id: 'controls', rung: 'parts', title: 'Every control', span: 6,
    node: { p: 'panel', kids: [{ p: 'stack', gap: 3, kids: [
      { p: 'row', kids: [
        { p: 'button', tone: 'brand', text: 'Primary' },
        { p: 'button', tone: 'secondary', text: 'Secondary' },
        { p: 'button', tone: 'ghost', text: 'Ghost' },
        { p: 'button', tone: 'danger', text: 'Danger' },
      ] },
      { p: 'row', kids: [{ p: 'input', placeholder: 'Search…' }, { p: 'select', options: ['All', 'Mine'] }] },
      { p: 'row', kids: [{ p: 'checkbox', on: true, text: 'Checkbox' }, { p: 'switch', on: true, text: 'Switch' }] },
    ] }] },
  },
  {
    /* The rung the wall was missing: not a panel out of an app but a PAGE, with
       the two things every page has and no component library talks about — the
       bar at the top and the block at the bottom. */
    id: 'site', rung: 'page', title: 'A whole page', span: 12,
    node: { p: 'stack', gap: 0, kids: [
      { p: 'navbar', brand: 'Havenstad', items: ['Requests', 'Decisions', 'Reports'],
        kids: [{ p: 'button', tone: 'secondary', text: 'Sign in' }, { p: 'button', tone: 'brand', text: 'Start a request' }] },
      { p: 'stack', gap: 4, pad: true, kids: [
        { p: 'heading', level: 2, text: 'What you can arrange here' },
        { p: 'grid', cols: 3, kids: [
          { p: 'mediacard', title: 'Building work', text: 'Permission to build, convert or demolish, and what the neighbours are told.', action: 'Read on' },
          { p: 'mediacard', title: 'Waste and recycling', text: 'Collection days, bulky items, and where the containers are.', action: 'Read on' },
          { p: 'mediacard', title: 'Parking permits', text: 'For residents, visitors and trades. Renewals open six weeks ahead.', action: 'Read on' },
        ] },
      ] },
      { p: 'footer', note: '© 2026 Gemeente Havenstad · Accessibility statement · Privacy',
        groups: [
          { title: 'Arrange', items: ['Requests', 'Permits', 'Objections'] },
          { title: 'Find', items: ['Opening hours', 'Locations', 'Contact'] },
          { title: 'About', items: ['Council', 'Decisions', 'Vacancies'] },
        ] },
    ] },
  },
  {
    /* The two foundations no component library shows you: how strongly things
       lift, and where the keyboard is. The focus ring cannot be drawn without
       focusing something, and a wall that steals focus is worse than one that
       does not show it — so the specimen asks you to tab into it. */
    id: 'foundation', rung: 'parts', title: 'Elevation and focus', span: 6,
    node: { p: 'stack', gap: 4, kids: [
      { p: 'muted', text: 'Elevation' },
      { p: 'elevation', levels: ['sm', 'md', 'lg'] },
      { p: 'muted', text: 'Focus ring — tab into this field to see it' },
      { p: 'input', placeholder: 'Tab here' },
    ] },
  },
]
