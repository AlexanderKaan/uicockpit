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
    aria: ['Each header is a <button> inside a heading element', 'aria-expanded on the button', 'aria-controls pointing at the panel'],
    free: 'Use <details>/<summary> and the toggle, aria-expanded equivalent and keyboard handling are all the browser’s.',
  },
  'alert-dialog': {
    pattern: 'Alert Dialog',
    url: `${APG}/alertdialog/`,
    keys: [
      ['Escape', 'Close the dialog'],
      ['Tab / Shift+Tab', 'Cycle within the dialog only — focus must not escape'],
    ],
    aria: ['role="alertdialog"', 'aria-modal="true"', 'aria-labelledby on the title', 'aria-describedby on the message'],
    free: '<dialog> + showModal() gives the focus trap, Escape, inert background and top-layer stacking.',
  },
  dialog: {
    pattern: 'Dialog (Modal)',
    url: `${APG}/dialog-modal/`,
    keys: [
      ['Escape', 'Close the dialog'],
      ['Tab / Shift+Tab', 'Cycle within the dialog only'],
    ],
    aria: ['role="dialog"', 'aria-modal="true"', 'aria-labelledby or aria-label', 'Focus moves INTO the dialog on open and RETURNS to the trigger on close'],
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
    url: 'https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/',
    keys: [],
    aria: ['<header>/<nav>/<main>/<footer> rather than divs with roles', 'aria-label on each nav when more than one is present', 'Exactly one <main>'],
    free: 'The elements are the landmarks. role="banner" on a <header> is the same thing said twice.',
  },
}

/** Recipe ids that deliberately have no APG pattern, and why. */
export const APG_NOT_APPLICABLE: Record<string, string> = {
  card: 'A card is a visual container, not an interaction pattern. APG has none, and inventing roles for it is how a div ends up announced as a widget.',
  'badges-pills': 'Static text with a tone. Its meaning must be in the words, which is WCAG 1.4.1, not an APG pattern.',
  skeleton: 'A loading placeholder. It should be aria-hidden and the region should carry aria-busy instead.',
  prose: 'Long-form content — HTML semantics, not a widget.',
  identifier: 'Institutional furniture. Landmarks apply; there is no interaction pattern.',
  charcount: 'A live region attached to a field. The pattern is the live region, covered under the field, not a widget of its own.',
}
