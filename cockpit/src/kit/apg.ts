/**
 * WAI-ARIA Authoring Practices as the normative behaviour anchor.
 *
 * Our CSS decides how a component looks. APG decides how it must BEHAVE — which
 * keys do what, which roles and states carry the meaning. Those are different
 * questions, and until now we only answered the first one in writing.
 *
 * The reason to anchor here rather than invent our own keyboard contracts is the
 * same reason the naming gate anchors on Open UI's matrix: a claim needs a
 * reference. "Our tabs are keyboard accessible" is a promise; "our tabs
 * implement the APG Tabs pattern, and here is the key map" is something an
 * auditor can check, a supplier can be held to, and a second implementer can
 * match. APG appears in the Open UI matrix as a peer source for exactly this
 * reason.
 *
 * ⚠️ SCOPE, stated plainly because this file could otherwise read as a claim we
 * have not earned. We ship CSS over semantic HTML — the keyboard behaviour below
 * is what the CONSUMER owes, not what our stylesheet performs. Where the platform
 * provides it (a <button>, a <details>, a <dialog> opened with showModal()) it is
 * free and we say so. Where it does not, this is the contract they must
 * implement, and writing it down is the difference between a kit that hands over
 * a responsibility and one that hides it.
 *
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/
 */

export interface ApgPattern {
  /** The APG pattern name, spelled as APG spells it. */
  pattern: string
  /** Deep link to the pattern page. */
  url: string
  /** Key → what it must do. The normative half. */
  keys: Array<[string, string]>
  /** Roles/states/properties the pattern requires. */
  aria: string[]
  /**
   * What the PLATFORM already does if you use the right element, so a consumer
   * can see how much of the contract they actually owe. The honest answer is
   * often "most of it", and that is the argument for the platform primitive.
   */
  free?: string
}

const APG = 'https://www.w3.org/WAI/ARIA/apg/patterns'
const LANDMARKS = 'https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/'

/** Recipe id → the pattern it must implement.
 *
 * RECIPE ids, not class names. The first version keyed three of these on the
 * class (`badge`, `breadcrumb`, `checkbox`) where the recipes are `badges-pills`,
 * `pagination-breadcrumb` and `form-primitives`; `audit:apg` caught all three on
 * its first run, which is the argument for the gate existing at all — a
 * behaviour contract pointing at nothing reads as coverage. */
export const APG_PATTERNS: Record<string, ApgPattern> = {
  accordion: {
    pattern: 'Accordion',
    url: `${APG}/accordion/`,
    keys: [
      ['Enter / Space', 'Toggle the panel of the focused header'],
      ['Tab', 'Move to the next focusable element — headers are NOT arrow-navigated'],
    ],
    aria: ['Each header is a <button> inside a heading element', 'aria-expanded on the button', 'aria-controls pointing at the panel, unless the accordion is built from <details>/<summary> — there the relationship is structural and the attribute is redundant'],
    free: 'Use <details>/<summary> and the toggle, aria-expanded equivalent and keyboard handling are all the browser’s.',
  },
  'alert-dialog': {
    pattern: 'Alert Dialog',
    url: `${APG}/alertdialog/`,
    keys: [
      ['Escape', 'Close the dialog'],
      ['Tab / Shift+Tab', 'Cycle within the dialog only — focus must not escape'],
    ],
    aria: ['role="alertdialog"', 'aria-modal="true" when it IS modal — showModal() sets it, and a docked <dialog open> must not claim it', 'aria-labelledby on the title', 'aria-describedby on the message'],
    free: '<dialog> + showModal() gives the focus trap, Escape, inert background and top-layer stacking.',
  },
  dialog: {
    pattern: 'Dialog (Modal)',
    url: `${APG}/dialog-modal/`,
    keys: [
      ['Escape', 'Close the dialog'],
      ['Tab / Shift+Tab', 'Cycle within the dialog only'],
    ],
    aria: ['role="dialog"', 'aria-modal="true" when it IS modal — showModal() sets it, and a docked <dialog open> must not claim it', 'aria-labelledby or aria-label', 'Focus moves INTO the dialog on open and RETURNS to the trigger on close'],
    free: '<dialog> + showModal() gives all of it except the return-focus-to-trigger, which the browser does too when the dialog is closed properly.',
  },
  tabs: {
    pattern: 'Tabs',
    url: `${APG}/tabs/`,
    keys: [
      ['Left / Right', 'Move between tabs in a horizontal tablist'],
      ['Home / End', 'First / last tab'],
      ['Tab', 'Leave the tablist and enter the active panel — the tablist is ONE tab stop'],
    ],
    aria: ['role="tablist" · role="tab" · role="tabpanel"', 'aria-selected on the active tab', 'aria-controls / aria-labelledby linking tab and panel', 'roving tabindex: only the active tab is tabbable'],
  },
  combobox: {
    pattern: 'Combobox',
    url: `${APG}/combobox/`,
    keys: [
      ['Down / Up', 'Open the listbox and move the visual focus through options'],
      ['Enter', 'Accept the focused option'],
      ['Escape', 'Close the listbox; a second press clears the input'],
      ['Alt+Down', 'Open without moving the selection'],
    ],
    aria: ['role="combobox" on the input', 'aria-expanded', 'aria-controls pointing at the listbox', 'aria-activedescendant — DOM focus stays in the input'],
  },
  'select-trigger': {
    pattern: 'Listbox',
    url: `${APG}/listbox/`,
    keys: [
      ['Down / Up', 'Move to the next / previous option'],
      ['Home / End', 'First / last option'],
      ['A–Z', 'Jump to the next option starting with that character'],
      ['Escape', 'Close without changing the selection'],
    ],
    aria: ['role="listbox" · role="option"', 'aria-selected on the chosen option', 'aria-activedescendant or roving tabindex'],
    free: 'A native <select> gives every one of these, in the platform’s own idiom, on every device.',
  },
  'dropdown-menu': {
    pattern: 'Menu Button',
    url: `${APG}/menu-button/`,
    keys: [
      ['Enter / Space / Down', 'Open the menu and focus the first item'],
      ['Up / Down', 'Move between items'],
      ['Escape', 'Close and return focus to the button'],
      ['A–Z', 'Jump to the next item starting with that character'],
    ],
    aria: ['aria-haspopup="true" and aria-expanded on the button', 'role="menu" · role="menuitem"', 'Focus moves INTO the menu; the button is not part of the item cycle'],
  },
  menubar: {
    pattern: 'Menubar',
    url: `${APG}/menubar/`,
    keys: [
      ['Left / Right', 'Move between top-level menus'],
      ['Down', 'Open the focused menu'],
      ['Escape', 'Close the submenu, keep focus on its parent'],
    ],
    aria: ['role="menubar" · role="menuitem"', 'Roving tabindex: the menubar is one tab stop'],
  },
  'switch-toggle': {
    pattern: 'Switch',
    url: `${APG}/switch/`,
    keys: [['Space', 'Toggle the state'], ['Enter', 'Toggle (optional, but expected on a button element)']],
    aria: ['role="switch"', 'aria-checked', 'An accessible name — a switch with no name announces only its state'],
    free: 'A <button> gives the key handling; role and aria-checked are yours.',
  },
  slider: {
    pattern: 'Slider',
    url: `${APG}/slider/`,
    keys: [
      ['Left / Down', 'Decrease by one step'],
      ['Right / Up', 'Increase by one step'],
      ['Home / End', 'Minimum / maximum'],
      ['Page Up / Page Down', 'Larger jump'],
    ],
    aria: ['role="slider"', 'aria-valuenow · aria-valuemin · aria-valuemax', 'aria-valuetext when the number alone is not meaningful ("Medium", not "2")'],
    free: '<input type="range"> gives all keys, the value announcements and touch behaviour.',
  },
  numberinput: {
    pattern: 'Spinbutton',
    url: `${APG}/spinbutton/`,
    keys: [['Up / Down', 'Increase / decrease by one step'], ['Page Up / Page Down', 'Larger jump'], ['Home / End', 'Minimum / maximum']],
    aria: ['role="spinbutton" (or a native number input)', 'aria-valuenow · aria-valuemin · aria-valuemax'],
    free: '<input type="number"> gives the keys — but it also clamps and rejects input in ways that fight people typing a leading zero. inputmode="numeric" on a text input is often the better trade.',
  },
  tooltip: {
    pattern: 'Tooltip',
    url: `${APG}/tooltip/`,
    keys: [['Escape', 'Dismiss the tooltip while the trigger keeps focus']],
    aria: ['role="tooltip"', 'aria-describedby on the trigger', 'Appears on BOTH hover and focus, and stays while the pointer moves onto it (WCAG 1.4.13)'],
  },
  toggletip: {
    pattern: 'Tooltip (toggle variant)',
    url: `${APG}/tooltip/`,
    keys: [['Enter / Space', 'Toggle the bubble'], ['Escape', 'Close it']],
    aria: ['A <button> trigger with an accessible name', 'A live region receives the content — it must start EMPTY or nothing is announced'],
  },
  toolbar: {
    pattern: 'Toolbar',
    url: `${APG}/toolbar/`,
    keys: [['Left / Right', 'Move between controls'], ['Home / End', 'First / last control'], ['Tab', 'Leave the toolbar — it is ONE tab stop']],
    aria: ['role="toolbar"', 'Roving tabindex', 'aria-label when more than one toolbar is present'],
  },
  'pagination-breadcrumb': {
    pattern: 'Breadcrumb',
    url: `${APG}/breadcrumb/`,
    keys: [['Tab', 'Move between links — no arrow navigation']],
    aria: ['<nav aria-label="Breadcrumb">', 'An ordered list of links', 'aria-current="page" on the last item'],
  },
  carousel: {
    pattern: 'Carousel',
    url: `${APG}/carousel/`,
    keys: [['Tab', 'Reach the controls'], ['Enter / Space', 'Activate previous / next']],
    aria: ['role="group" with aria-roledescription="carousel"', 'A visible, keyboard-reachable pause control if it auto-rotates (WCAG 2.2.2)', 'aria-live="polite" on the slide container while paused'],
  },
  'radio-card': {
    pattern: 'Radio Group',
    url: `${APG}/radio/`,
    keys: [
      ['Arrow keys', 'Move to and SELECT the next option — selection follows focus'],
      ['Tab', 'Enter or leave the group; the group is one tab stop'],
    ],
    aria: ['role="radiogroup" with a name', 'role="radio" with aria-checked', 'Roving tabindex'],
    free: 'Native <input type="radio"> with a shared name gives all of it, including the one-tab-stop behaviour.',
  },
  'form-primitives': {
    pattern: 'Checkbox',
    url: `${APG}/checkbox/`,
    keys: [['Space', 'Toggle']],
    aria: ['role="checkbox" with aria-checked, or a native input', 'aria-checked="mixed" for a tri-state parent'],
    free: 'Native <input type="checkbox"> gives the key, the state and the mixed value.',
  },
  buttons: {
    pattern: 'Button',
    url: `${APG}/button/`,
    keys: [['Enter', 'Activate'], ['Space', 'Activate']],
    aria: ['Use <button>. A div with role="button" owes both keys, the focusability and the disabled semantics.'],
    free: 'Everything, if it is a <button>.',
  },
  alert: {
    pattern: 'Alert',
    url: `${APG}/alert/`,
    keys: [],
    aria: ['role="alert" (implicitly aria-live="assertive")', 'The element must exist BEFORE the text is inserted, or nothing is announced', 'Never move focus to an alert'],
  },
  table: {
    pattern: 'Table',
    url: `${APG}/table/`,
    keys: [],
    aria: ['Use a real <table> with <th scope>', 'A caption or aria-label naming the table', 'aria-sort on the sorted column header'],
    free: 'A native table gives the whole structure; ARIA table roles exist only for when you cannot use one.',
  },
  'interactive-list-row': {
    pattern: 'Grid (for interactive rows)',
    url: `${APG}/grid/`,
    keys: [['Arrow keys', 'Move between cells or rows'], ['Tab', 'Leave the grid — it is one tab stop']],
    aria: ['role="grid" only when rows are genuinely interactive; a list of links is a list, not a grid'],
  },
  scaffold: {
    pattern: 'Landmarks',
    url: LANDMARKS,
    keys: [],
    aria: ['<header>/<nav>/<main>/<footer> rather than divs with roles', 'aria-label on each nav when more than one is present', 'Exactly one <main>'],
    free: 'The elements are the landmarks. role="banner" on a <header> is the same thing said twice.',
  },

  /* ── The second pass ──────────────────────────────────────────────────────
   * Everything above was mapped when the anchor was introduced; everything
   * below closes the 85-recipe gap the ratchet was carrying. Two things worth
   * saying about doing it in bulk:
   *
   * The interesting answer was often "no pattern, and here is why" — a rating
   * that only DISPLAYS a score is text, not a widget, and dressing it in radio
   * semantics would announce a control nobody can operate. Those live in
   * APG_NOT_APPLICABLE, and there are more of them than there are patterns.
   *
   * And several recipes turn out to be the same pattern wearing different
   * clothes: four calendars are one Grid, three collapsibles are one Disclosure,
   * eight pieces of navigation furniture are Landmarks. That convergence is the
   * point of anchoring to a standard rather than inventing per-component
   * contracts — it is also how we find out our own set is smaller than it looks.
   */

  // — Disclosure: one pattern, three recipes —
  popover: {
    pattern: 'Disclosure',
    url: `${APG}/disclosure/`,
    keys: [['Enter / Space', 'Toggle the panel'], ['Escape', 'Close it and return focus to the trigger']],
    aria: ['A <button> trigger with aria-expanded', 'aria-controls pointing at the panel'],
    free: 'The Popover API ([popover] + popovertarget) gives light-dismiss, Escape and top-layer stacking; aria-expanded is still yours.',
  },
  'tool-call': {
    pattern: 'Disclosure',
    url: `${APG}/disclosure/`,
    keys: [['Enter / Space', 'Toggle the payload']],
    aria: ['aria-expanded on the trigger', 'The status is text, not colour alone (WCAG 1.4.1)'],
    free: '<details>/<summary> gives the toggle, the state and the keys.',
  },
  reasoning: {
    pattern: 'Disclosure',
    url: `${APG}/disclosure/`,
    keys: [['Enter / Space', 'Toggle the reasoning block']],
    aria: ['aria-expanded on the trigger', 'While streaming, the region needs aria-live="polite" or the text arrives silently'],
    free: '<details>/<summary>, as above.',
  },

  // — Dialog: the modal family —
  lightbox: {
    pattern: 'Dialog (Modal)',
    url: `${APG}/dialog-modal/`,
    keys: [['Escape', 'Close'], ['Tab / Shift+Tab', 'Cycle within the lightbox only'], ['Left / Right', 'Previous / next image, if the set is navigable']],
    aria: ['aria-modal="true" and a name', 'Each image needs its alt text — a lightbox of undescribed images is a gallery of nothing', 'Focus returns to the thumbnail that opened it'],
    free: '<dialog> + showModal() gives the trap, Escape and the inert background.',
  },
  'sheet-drawer': {
    pattern: 'Dialog (Modal)',
    url: `${APG}/dialog-modal/`,
    keys: [['Escape', 'Close'], ['Tab / Shift+Tab', 'Cycle within the sheet while it is modal']],
    aria: ['aria-modal="true" only when it really is modal — a non-modal drawer that claims it lies to a screen reader', 'A name from its heading', 'Focus returns to the trigger'],
    free: '<dialog> + showModal() for the modal case; a non-modal drawer owes its own focus handling.',
  },

  // — Alert / live regions —
  'toast-stack': {
    pattern: 'Alert',
    url: `${APG}/alert/`,
    keys: [['Tab', 'Reach the toast’s own action or dismiss control']],
    aria: ['role="status" for the ordinary case, role="alert" only when it is genuinely urgent', 'The container must EXIST before the toast is inserted or nothing is announced', 'Never move focus to a toast', 'Auto-dismiss fights WCAG 2.2.1 — give a way to keep it'],
  },
  banner: {
    pattern: 'Alert',
    url: `${APG}/alert/`,
    keys: [['Tab', 'Reach the dismiss control']],
    aria: ['role="status" for informational tones, role="alert" for errors', 'The tone is named in the text, never carried by colour alone'],
  },
  errorsummary: {
    pattern: 'Alert',
    url: `${APG}/alert/`,
    keys: [['Enter', 'Follow a link to the field it names']],
    aria: ['A heading plus a list of links, each pointing at the control that failed', 'Focus MOVES to the summary after a failed submit — this is the one live region you do focus', 'aria-invalid and aria-describedby on each named field'],
  },

  // — Combobox: three recipes, one pattern —
  'command-palette': {
    pattern: 'Combobox',
    url: `${APG}/combobox/`,
    keys: [['Down / Up', 'Move through results'], ['Enter', 'Run the focused command'], ['Escape', 'Close and return focus to where it came from']],
    aria: ['role="combobox" on the input with aria-expanded and aria-controls', 'aria-activedescendant — DOM focus stays in the input', 'The result count belongs in a live region, or a blind user cannot tell an empty search from a slow one'],
  },
  'tag-input': {
    pattern: 'Combobox',
    url: `${APG}/combobox/`,
    keys: [['Enter', 'Commit the typed token'], ['Backspace', 'Remove the last token when the input is empty'], ['Down / Up', 'Move through suggestions'], ['Escape', 'Close the suggestions']],
    aria: ['Each token carries its own remove button with a name that includes the token ("Remove Design")', 'The token count belongs in a live region', 'aria-describedby telling the person how to commit a token'],
  },
  searchinput: {
    pattern: 'Combobox',
    url: `${APG}/combobox/`,
    keys: [['Down / Up', 'Move through suggestions, when there are any'], ['Escape', 'Clear the suggestions, then the field']],
    aria: ['<input type="search"> inside <form role="search">', 'Combobox roles ONLY when it actually suggests — a plain search field that claims aria-expanded is announcing a listbox that does not exist'],
    free: 'type="search" gives the clear affordance and the platform’s own search idiom.',
  },

  // — Grid: four calendars, one pattern —
  calendar: {
    pattern: 'Grid (date grid)',
    url: `${APG}/grid/`,
    keys: [
      ['Left / Right', 'Previous / next day'],
      ['Up / Down', 'Same weekday, previous / next week'],
      ['Home / End', 'First / last day of the week'],
      ['Page Up / Page Down', 'Previous / next month'],
      ['Tab', 'Leave the grid — the whole month is ONE tab stop'],
    ],
    aria: ['role="grid" with role="gridcell" days — NOT implemented here, only when the calendar is restructured into rows: adding the role to our flat button grid took a11y:matrix from 3 violations to 16 (aria-required-children), so the pattern is ROADMAP Sprint G and until then this is a labelled group of date buttons', 'aria-selected on the chosen day', 'The month and year are announced when they change', 'Each day needs its full date as its name — "14" alone is not a date'],
    free: '<input type="date"> gives the entire pattern in the platform’s idiom, including on mobile. Reach for the grid when the date IS the content.',
  },
  'calendar-week': {
    pattern: 'Grid (date grid)',
    url: `${APG}/grid/`,
    keys: [['Arrow keys', 'Move between time slots'], ['Tab', 'Leave the grid']],
    aria: ['Events are buttons with a name carrying title AND time — position in the grid is not available to a screen reader', 'The grid needs a name saying which week it shows'],
  },
  'calendar-year': {
    pattern: 'Grid (date grid)',
    url: `${APG}/grid/`,
    keys: [['Arrow keys', 'Move between days across month boundaries'], ['Tab', 'Leave the grid']],
    aria: ['Each month grid carries its own name', 'Twelve grids is twelve tab stops unless they are one composite widget — decide which, and say so'],
  },
  'calendar-range': {
    pattern: 'Grid (date grid)',
    url: `${APG}/grid/`,
    keys: [['Arrow keys', 'Move within and between the two month grids'], ['Enter', 'Set the start, then the end'], ['Escape', 'Abandon a half-made range']],
    aria: ['The forming range must be announced, not only shaded — aria-live carrying "12 May to 18 May"', 'Start and end days say which they are in their names'],
  },

  // — Menus, toolbars, groups —
  'context-menu': {
    pattern: 'Menu Button',
    url: `${APG}/menu-button/`,
    keys: [['Shift+F10 / Context key', 'Open the menu from the keyboard — right-click alone excludes anyone not using a mouse'], ['Up / Down', 'Move between items'], ['Escape', 'Close and return focus']],
    aria: ['role="menu" · role="menuitem"', 'aria-expanded on whatever opens it', 'A context menu with no keyboard opener is a feature only mouse users have'],
  },
  'navigation-menu': {
    pattern: 'Disclosure Navigation',
    url: `${APG}/disclosure/`,
    keys: [['Enter / Space', 'Open the submenu'], ['Escape', 'Close it, focus stays on its trigger'], ['Tab', 'Move through the links — this is navigation, not a menu widget']],
    aria: ['aria-expanded on each top-level trigger', 'role="menu" is for application menus; site navigation is a <nav> with lists and links'],
  },
  'button-group': {
    pattern: 'Toolbar',
    url: `${APG}/toolbar/`,
    keys: [['Left / Right', 'Move between the buttons'], ['Tab', 'Leave the group — it is one tab stop']],
    aria: ['role="toolbar" with a name, or plain buttons if they are unrelated', 'aria-pressed when a button is a toggle'],
  },
  'filter-bar': {
    pattern: 'Toolbar',
    url: `${APG}/toolbar/`,
    keys: [['Left / Right', 'Move between filters'], ['Tab', 'Leave the bar']],
    aria: ['role="toolbar" with a name', 'The number of results after filtering belongs in a live region — the change is invisible otherwise', 'Each active filter is removable and says what it removes'],
  },
  'segmented-control-toggle-group': {
    pattern: 'Radio Group',
    url: `${APG}/radio/`,
    keys: [['Arrow keys', 'Move to and SELECT the next segment'], ['Tab', 'Enter or leave the group']],
    aria: ['role="radiogroup" with a name when exactly one may be chosen', 'Multi-select instead: a toolbar of aria-pressed toggle buttons — the two must not be mixed'],
    free: 'Native radios with a shared name give the whole pattern, including the one-tab-stop behaviour.',
  },
  tasklist: {
    pattern: 'Checkbox',
    url: `${APG}/checkbox/`,
    keys: [['Space', 'Toggle the focused task']],
    aria: ['A real <input type="checkbox"> per row, labelled by the task text', 'Completion is carried in the checked state, not by a line through the text'],
    free: 'Native checkboxes give the key, the state and the label association.',
  },
  chip: {
    pattern: 'Button',
    url: `${APG}/button/`,
    keys: [['Enter / Space', 'Activate'], ['Backspace / Delete', 'Remove, on a removable chip']],
    aria: ['aria-pressed on a filter chip — it is a toggle, and a toggle that does not say so reads as a plain button', 'A removable chip needs a remove control naming what it removes'],
    free: 'A <button> gives activation and focus; the pressed state is yours.',
  },

  // — Meters —
  progress: {
    pattern: 'Progressbar',
    url: `${APG}/progressbar/`,
    keys: [],
    aria: ['role="progressbar" for a task that completes, role="progressbar" (or a native <progress>) for a level that fluctuates', 'aria-valuenow · aria-valuemin · aria-valuemax, or omit valuenow for indeterminate', 'A name saying WHAT is progressing'],
    free: '<progress> gives the role and the value semantics.',
  },
  'usage-meter': {
    pattern: 'Meter',
    url: `${APG}/meter/`,
    keys: [],
    aria: ['role="meter" — a quota is a level, not a task', 'aria-valuetext where the raw number is not the meaning ("8.2 GB of 10 GB")', 'Approaching the limit is said in text, not shown only as a colour change'],
    free: '<meter> gives the role, the value and the low/high/optimum semantics.',
  },

  // — The rest —
  'data-table': {
    pattern: 'Table (sortable)',
    url: `${APG}/table/`,
    keys: [['Enter / Space', 'Sort by the focused column header'], ['Tab', 'Move between the interactive cells']],
    aria: ['aria-sort on the sorted header, and on ONE header only', 'Sort controls are buttons inside <th>, not click handlers on the cell', 'Row selection announces how many rows are selected'],
    free: 'A real <table> with <th scope> gives the structure a screen reader reads rows and columns with.',
  },
  'activity-feed': {
    pattern: 'Feed',
    url: `${APG}/feed/`,
    keys: [['Page Down / Page Up', 'Move to the next / previous article'], ['Ctrl+Home / Ctrl+End', 'First / last article']],
    aria: ['role="feed" with role="article" children', 'aria-posinset and aria-setsize on each article', 'aria-busy on the feed while new items are being loaded in'],
  },
  resizable: {
    pattern: 'Window Splitter',
    url: `${APG}/windowsplitter/`,
    keys: [['Left / Right (or Up / Down)', 'Move the splitter by a step'], ['Home / End', 'Minimum / maximum'], ['Enter', 'Collapse or restore the pane']],
    aria: ['role="separator" with tabindex="0" — a splitter that cannot be focused can only be dragged, which fails WCAG 2.5.7', 'aria-valuenow · aria-valuemin · aria-valuemax', 'aria-controls naming the pane it sizes'],
  },
  'hover-card': {
    pattern: 'Tooltip',
    url: `${APG}/tooltip/`,
    keys: [['Escape', 'Dismiss while the trigger keeps focus']],
    aria: ['Opens on FOCUS as well as hover, or it does not exist for a keyboard', 'Stays open while the pointer travels onto it (WCAG 1.4.13)', 'Rich content belongs in a disclosure instead — anything interactive inside a tooltip is unreachable'],
  },

  // — Navigation furniture: eight recipes, one practice —
  appbar: {
    pattern: 'Landmarks',
    url: LANDMARKS,
    keys: [],
    aria: ['<header> is the banner landmark', 'Its nav needs a name when the page has more than one'],
    free: 'The element is the landmark.',
  },
  sidebar: {
    pattern: 'Landmarks',
    url: LANDMARKS,
    keys: [['Tab', 'Move through the links — site navigation is not arrow-navigated']],
    aria: ['<nav> with a name distinguishing it from the other navs', 'aria-current="page" on the current item — the highlight is not available to a screen reader'],
  },
  navsuite: {
    pattern: 'Landmarks',
    url: LANDMARKS,
    keys: [['Tab', 'Move through the links']],
    aria: ['aria-current="page" on the active item', 'A collapsed rail still needs names — an icon with no label is an unnamed link'],
  },
  'navigation-row': {
    pattern: 'Landmarks',
    url: LANDMARKS,
    keys: [['Tab', 'Move through the rows']],
    aria: ['aria-current="page" on the active row', 'The whole row is one control, not a link wrapped around a button'],
  },
  inpagenav: {
    pattern: 'Landmarks',
    url: LANDMARKS,
    keys: [['Tab', 'Move through the anchors']],
    aria: ['<nav aria-label="On this page">', 'aria-current="true" on the section being read', 'The anchors must point at real headings, in document order'],
  },
  langnav: {
    pattern: 'Landmarks',
    url: LANDMARKS,
    keys: [['Tab', 'Move through the languages']],
    aria: ['Each option named IN ITS OWN LANGUAGE with a matching lang attribute (WCAG 3.1.2)', 'hreflang on each link', '"Nederlands", never a flag — a flag is a country, not a language'],
  },
  sitefooter: {
    pattern: 'Landmarks',
    url: LANDMARKS,
    keys: [],
    aria: ['<footer> is the contentinfo landmark', 'Its link groups are headed lists, not a wall of anchors'],
    free: 'The element is the landmark.',
  },
  skiplink: {
    pattern: 'Landmarks (bypass blocks)',
    url: LANDMARKS,
    keys: [['Tab', 'It is the FIRST tab stop, and becomes visible on focus']],
    aria: ['Points at the <main> id', 'The target takes focus, not merely the scroll position — otherwise the next Tab returns to the top of the page'],
  },
}

/** Recipe ids that deliberately have no APG pattern, and why.
 *
 * This half is longer than the pattern half, and that is the honest shape of a
 * component library: most of what we ship is structure and surface, and only a
 * minority is behaviour that a standard specifies. The reason has to be a real
 * one. "No pattern applies" as a stock phrase would make this table a way of
 * clearing the gate rather than a way of answering the question — so each entry
 * says what the recipe owes INSTEAD, and several of those obligations
 * (a name, a live region, a text alternative) are stricter than a key map.
 */
export const APG_NOT_APPLICABLE: Record<string, string> = {
  card: 'A card is a visual container, not an interaction pattern. APG has none, and inventing roles for it is how a div ends up announced as a widget.',
  'badges-pills': 'Static text with a tone. Its meaning must be in the words, which is WCAG 1.4.1, not an APG pattern.',
  skeleton: 'A loading placeholder. It should be aria-hidden and the region should carry aria-busy instead.',
  prose: 'Long-form content — HTML semantics, not a widget.',
  identifier: 'Institutional furniture. Landmarks apply; there is no interaction pattern.',
  charcount: 'A live region attached to a field. The pattern is the live region, covered under the field, not a widget of its own.',

  // — Layout and composition: no behaviour to specify —
  composition: 'Utilities that arrange other components. They have no semantics of their own, which is the point — a layout that announces itself is a layout in the way.',
  'layout-primitives': 'Stack, cluster, grid. Structure only. Whatever they contain carries the semantics.',
  twocolumnlayout: 'A two-column arrangement. The reading order it produces is the accessibility question, and that is source order, not a role.',
  pane: 'A region of a shell. It needs a name if it is a landmark and nothing at all if it is not — see Window Splitter for the resizable case.',
  section: 'A titled block of content. Its heading is the semantics; a role would be a second, weaker copy of it.',
  'page-head': 'A title block. The <h1> does the work.',
  'form-panel': 'A form in a panel. The fields carry the semantics; the panel is a surface.',
  'action-panel': 'A row of copy beside a control. Both halves already have semantics; the arrangement has none.',
  auth: 'A page composition of fields and buttons. Every part is covered by its own recipe.',
  form: 'A <form> is HTML, not a widget. What matters lives in the fields, the labels and the error handling — and in a submit button that says what it submits.',
  fieldset: '<fieldset>/<legend> IS the grouping mechanism; APG has no pattern because HTML already has the element. The failure mode is not using it: a set of radios without a legend has options with no question.',
  'entity-card': 'A card describing a thing. If the whole card is clickable it is one link with one name, not a card full of separate targets — that is the only real decision here.',
  infocard: 'A compact information tile. Label/value pairs; a description list if the pairs are data.',
  'stat-tile': 'A number with a label. The label must be part of the accessible name — a screen reader reading "1,284" alone has been told nothing.',
  'file-grid': 'A grid of file tiles. Visually a grid, semantically a list — role="grid" here would promise arrow-key navigation between cells that no file browser actually wants.',
  list: 'A list. <ul>/<li>, and the row semantics come from what is in the row.',
  'description-list': 'Term and definition pairs. <dl>/<dt>/<dd> is the pattern, and it is HTML.',
  timeline: 'An ordered list of events with times. <ol> plus <time> — a role would add nothing a screen reader does not already get.',
  processlist: 'Numbered steps that carry content. An <ol>, where the number is the list, not a painted circle.',
  stepper: 'A read-only progress indicator through a wizard. Not a widget — an <ol> with aria-current="step". The current step must be in TEXT ("Step 2 of 4"), because a filled dot is not available to a screen reader.',
  wizardstepper: 'Same as the stepper: an indicator, not a control. aria-current="step" and the position said in words.',

  // — Media, text and status: the alternative IS the obligation —
  avatar: 'An image or initials. Decorative beside a name (aria-hidden), and named when it stands alone — a photo whose alt text is the file name is the classic failure.',
  spinner: 'A busy indicator. aria-busy on the region it belongs to, and a live region announcing the outcome. Never a spinner that announces itself forever.',
  'empty-state': 'A message and usually one action. The message is text; there is nothing to specify.',
  chart: 'No APG pattern, and the largest text-alternative obligation in the kit: a chart is unreadable to a screen reader unless the same information exists as text or a table. Colour alone cannot carry a series (WCAG 1.4.1), which is why the legend uses markers as well.',
  sparkline: 'A trend glyph. It needs the trend in words beside it ("up 12% this week"); on its own it is decoration and takes aria-hidden.',
  kbd: 'A key name. <kbd>. The trap is symbols — "⌘K" needs to be readable, not a glyph a screen reader spells out or skips.',
  codeblock: 'A code block. <pre><code>, with a language label as text. The copy button is a plain button that must confirm what it did in a live region. And the <pre> itself needs tabindex="0" with a role and a name: it scrolls sideways whenever the code is wider than the box, and a scroll container with no focusable content cannot be reached by keyboard at all (WCAG 2.1.1, Level A). Found here for real — and only at widths where the code overflows, which a scan pinned at one viewport never reaches.',
  'roll-down-item-stagger': 'An entrance animation. It must respect prefers-reduced-motion, which is WCAG 2.3.3 and a media query, not a role.',
  'button-finish': 'A surface treatment for buttons. The Button pattern covers the behaviour; this changes only how it looks.',

  // — Fields whose obligations are HTML, not ARIA —
  'memorable-date': 'Three text inputs in a fieldset — the GOV.UK pattern, chosen BECAUSE it has no widget behaviour to get wrong. Day/month/year as separate labelled inputs, legend as the question, and no date picker between the person and the answer.',
  'input-otp': 'A row of single-character inputs. autocomplete="one-time-code" and inputmode="numeric" are the whole accessibility story; the slots need one name for the group, not six unrelated fields.',
  passwordinput: 'A password field. The reveal control is a toggle button that must say which state it is in ("Show password" / "Hide password"), and the field must permit paste — blocking it breaks password managers, which is an accessibility failure with a security costume.',
  phoneinput: 'A country select beside a tel input. Both halves are ordinary form controls; the pairing needs one label that covers both.',
  requirements: 'A checklist that updates as the person types. The pattern is the live region, not a widget: each rule states met/unmet in text, and the region must be polite or every keystroke interrupts.',
  'file-upload-dropzone': 'No APG pattern, and one hard requirement: the drop target must be paired with a real <input type="file">. A drag-only upload fails WCAG 2.5.7, and drag is also the interaction most likely to be impossible for the person using this.',
}
