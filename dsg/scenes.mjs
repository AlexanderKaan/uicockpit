import { render, BINDING_ICONS } from './parts.mjs'

/**
 * THE WALL — written once, rendered by whichever kit is on.
 *
 * Every kit's own site has a page like this: a mosaic of specimens you scroll
 * through to decide whether you like it. Two things are wrong with all of them.
 * You can only ever see ONE kit at a time, and the mosaic is a bag of parts —
 * a button here, a card there — rather than a system you could ship.
 *
 * So this is a mosaic you PAN, left to right, through six boards in the order
 * you actually decide things:
 *
 *   Foundations → what the system is made of, before there are components
 *   Controls    → everything a finger or a keyboard touches
 *   Forms       → those controls doing a job, with real copy
 *   Data        → the screens that carry numbers
 *   Navigation  → how you know where you are
 *   A whole page → all of it at once, with a bar on top and a block at the end
 *
 * A board is a set of COLUMNS and a column is an ordered set of cards, because
 * the arrangement is the design: packing this automatically gives you a wall
 * that is merely full. Widths are in pixels because the pan is horizontal and a
 * column that reflows is a column that moves while you are reading it.
 *
 * A card is data. It contains no classes, no colours and no kit names: the
 * moment a card knows which kit it is in, adding a kit stops being a table.
 */
export const BOARDS = [
  /* ── 1 ─────────────────────────────────────────────────────────────────── */
  {
    id: 'foundations', label: 'Foundations',
    note: 'The values everything else is built from, and what this stack calls each one.',
    cols: [
      { w: 440, cards: [
        { id: 'roles', title: 'Colour roles', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'muted', text: 'Every role, painted by the variable this stack really reads — and named, where it has one.' },
          { p: 'swatches', roles: ['brand', 'onBrand', 'page', 'surface', 'ink', 'inkMuted', 'line', 'success', 'warning', 'danger', 'focus'] },
        ] } },
        { id: 'shape', title: 'Corners and borders', panel: true, node: { p: 'shapes' } },
      ] },
      { w: 400, cards: [
        { id: 'type', title: 'Type scale', panel: true, node: { p: 'typespec', rows: [
          { size: 'xl', text: 'Rhythm and hierarchy' },
          { size: 'lg', text: 'A heading that has to carry a whole section' },
          { size: 'md', text: 'Body text is the size everything else is measured against. It should sit comfortably at the width a paragraph really gets.' },
          { size: 'sm', text: 'Small print, captions, the row under a field.' },
        ] } },
        { id: 'depth', title: 'Elevation', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'muted', text: 'How strongly a thing lifts off the page.' },
          { p: 'elevation', levels: ['sm', 'md', 'lg'] },
        ] } },
        { id: 'focusring', title: 'Focus ring', panel: true, node: { p: 'stack', gap: 2, kids: [
          { p: 'muted', text: 'The one specimen that cannot be drawn — tab into the field to see it.' },
          { p: 'input', placeholder: 'Tab here' },
        ] } },
      ] },
    ],
  },

  /* ── 2 ─────────────────────────────────────────────────────────────────── */
  {
    id: 'controls', label: 'Controls',
    note: 'Everything a finger or a keyboard touches, at the sizes this stack ships.',
    cols: [
      { w: 380, cards: [
        { id: 'buttons', title: 'Buttons', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'row', kids: [
            { p: 'button', tone: 'brand', text: 'Primary' },
            { p: 'button', tone: 'secondary', text: 'Secondary' },
            { p: 'button', tone: 'ghost', text: 'Ghost' },
            { p: 'button', tone: 'danger', text: 'Delete' },
          ] },
          { p: 'divider' },
          { p: 'muted', text: 'Icon buttons, the toolbar case' },
          { p: 'iconrow', items: ['copy', 'info', 'trash-2', 'share', 'archive', 'refresh-cw', 'ellipsis', 'plus'] },
        ] } },
        { id: 'badges', title: 'Status', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'row', kids: [
            { p: 'badge', tone: 'brand', text: 'Under review' },
            { p: 'badge', tone: 'success', text: 'Granted' },
            { p: 'badge', tone: 'warning', text: 'Waiting' },
            { p: 'badge', tone: 'danger', text: 'Refused' },
            { p: 'badge', tone: 'neutral', text: 'Draft' },
          ] },
          { p: 'tabs', items: ['Open', 'Decided', 'Withdrawn'] },
        ] } },
        { id: 'ranges', title: 'Ranges', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'label', text: 'Distance' },
          { p: 'slider', value: 62 },
          { p: 'label', text: 'Uploaded' },
          { p: 'progress', value: 65 },
        ] } },
      ] },
      { w: 370, cards: [
        { id: 'fields', title: 'Fields', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'Reference' }, { p: 'input', value: '2026-04471' }] },
          { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'Category' }, { p: 'select', options: ['Building work', 'Felling', 'Signage'] }] },
          { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'Anything we should know' }, { p: 'textarea', placeholder: 'Optional' }] },
        ] } },
        { id: 'choices', title: 'Choices', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'checkbox', on: true, text: 'This is my own household' },
          /* and one that is OFF. Every checkbox on this wall used to be ticked,
             so the empty state was never on screen — which is how Radix went out
             with no box around an unticked one for weeks. */
          { p: 'checkbox', on: false, text: 'Send me a copy by post' },
          { p: 'switch', on: true, text: 'Notify me by email' },
          { p: 'divider' },
          { p: 'radio', name: 'send', on: 1, items: ['By post', 'By email', 'Collect in person'] },
        ] } },
      ] },
    ],
  },

  /* ── 3 ─────────────────────────────────────────────────────────────────── */
  {
    id: 'forms', label: 'Forms',
    note: 'The controls doing a job, with the copy a real service would use.',
    cols: [
      { w: 390, cards: [
        { id: 'request', title: 'A form', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'heading', text: 'New request' },
          { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'Reference' }, { p: 'input', value: '2026-04471' }] },
          { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'Category' }, { p: 'select', options: ['Building work', 'Felling', 'Signage'] }] },
          { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'Postcode' }, { p: 'input', placeholder: '3011 AA' }] },
          { p: 'checkbox', on: true, text: 'This is my own household' },
          { p: 'row', between: true, kids: [
            { p: 'button', tone: 'ghost', text: 'Cancel' },
            { p: 'button', tone: 'brand', text: 'Submit' },
          ] },
        ] } },
        { id: 'feedback', title: 'When something happens', panel: false, node: { p: 'stack', gap: 2, kids: [
          { p: 'alert', tone: 'success', text: 'Saved. Your changes are live.' },
          { p: 'alert', tone: 'warning', text: 'Check this. The due date is in the past.' },
          { p: 'alert', tone: 'danger', text: 'Not sent. Two fields are missing.' },
        ] } },
      ] },
      { w: 390, cards: [
        { id: 'report', title: 'A form that asks for prose', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'heading', text: 'Report a problem' },
          { p: 'muted', text: 'Tell us what went wrong and we will pass it on.' },
          { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'What is it about' }, { p: 'select', options: ['A decision', 'A payment', 'Something on this site'] }] },
          { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'What happened' }, { p: 'textarea', placeholder: 'Start with what you were trying to do' }] },
          { p: 'switch', on: true, text: 'Send me a copy' },
          { p: 'button', tone: 'brand', text: 'Send report' },
        ] } },
        { id: 'prefs', title: 'Settings rows', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'heading', text: 'Notifications' },
          { p: 'switch', on: true, text: 'A decision on one of my requests' },
          { p: 'switch', on: true, text: 'A reply from a case worker' },
          { p: 'switch', on: false, text: 'Everything else' },
          { p: 'divider' },
          { p: 'row', between: true, kids: [
            { p: 'button', tone: 'ghost', text: 'Reset' },
            { p: 'button', tone: 'brand', text: 'Save' },
          ] },
        ] } },
      ] },
    ],
  },

  /* ── 4 ─────────────────────────────────────────────────────────────────── */
  {
    id: 'data', label: 'Data',
    note: 'The screens that carry numbers, where a type scale either works or does not.',
    cols: [
      { w: 420, cards: [
        { id: 'traffic', title: 'A chart card', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'heading', text: 'Requests by month' },
          { p: 'muted', text: 'Submitted online against submitted at the desk, last six months.' },
          { p: 'chart', legend: ['Online', 'At the desk'], bars: [
            { label: 'Apr', a: 82, b: 34 }, { label: 'May', a: 96, b: 30 }, { label: 'Jun', a: 74, b: 41 },
            { label: 'Jul', a: 110, b: 28 }, { label: 'Aug', a: 91, b: 33 }, { label: 'Sep', a: 124, b: 22 },
          ] },
          { p: 'button', tone: 'brand', text: 'View the report' },
        ] } },
        { id: 'tiles', title: 'Figures', panel: false, node: { p: 'grid', cols: 2, kids: [
          { p: 'stat', label: 'Open requests', value: '128' },
          { p: 'stat', label: 'Median decision', value: '19 days' },
          { p: 'stat', label: 'Overdue', value: '7' },
          { p: 'stat', label: 'Satisfaction', value: '4.4' },
        ] } },
      ] },
      { w: 440, cards: [
        { id: 'queue', title: 'A table', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'row', between: true, kids: [
            { p: 'heading', text: 'Requests' },
            { p: 'button', tone: 'secondary', text: 'Filter' },
          ] },
          { p: 'table', cols: ['Reference', 'Owner', 'Status', 'Due'], rows: [
            ['2026-04471', 'M. Visser', 'Under review', '28 Sep'],
            ['2026-03918', 'K. Boone', 'Granted', '—'],
            ['2026-03744', 'A. Yildiz', 'Refused', '—'],
            ['2026-03502', 'T. Okonkwo', 'Under review', '4 Oct'],
          ] },
        ] } },
        { id: 'goals', title: 'Progress', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'Decided within the term' }, { p: 'progress', value: 78 }] },
          { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'Answered within two days' }, { p: 'progress', value: 54 }] },
          { p: 'stack', gap: 1, kids: [{ p: 'label', text: 'Objections upheld' }, { p: 'progress', value: 12 }] },
        ] } },
      ] },
      { w: 400, cards: [
        { id: 'activity', title: 'A list', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'heading', text: 'Recent activity' },
          { p: 'list', rows: [
            { icon: 'file-text', title: 'Permit granted', sub: '2026-03918 · K. Boone', meta: 'Today' },
            { icon: 'credit-card', title: 'Fee paid', sub: '2026-04471 · online', meta: 'Yesterday' },
            { icon: 'shopping-cart', title: 'Bulky waste booked', sub: 'Kerkstraat 12', meta: '12 Sep' },
            { icon: 'car', title: 'Parking permit renewed', sub: 'Zone C · resident', meta: '11 Sep' },
            { icon: 'coffee', title: 'Terrace licence expired', sub: 'Havenplein 4', meta: '10 Sep' },
          ] },
        ] } },
        { id: 'env', title: 'Key and value', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'heading', text: 'Connections' },
          { p: 'kv', rows: [
            ['REGISTER_URL', 'api.havenstad.example'],
            ['PAYMENT_KEY', '••••••••'],
            ['NOTIFY_FROM', 'no-reply@havenstad'],
          ] },
        ] } },
      ] },
    ],
  },

  /* ── 5 ─────────────────────────────────────────────────────────────────── */
  {
    id: 'navigation', label: 'Navigation',
    note: 'How someone knows where they are — the parts every kit shows last, or not at all.',
    cols: [
      { w: 640, cards: [
        { id: 'topbar', title: 'A bar across the top', panel: false, node: { p: 'navbar', brand: 'Havenstad',
          items: ['Requests', 'Decisions', 'Reports'],
          kids: [{ p: 'button', tone: 'secondary', text: 'Sign in' }, { p: 'button', tone: 'brand', text: 'Start a request' }] } },
        { id: 'trail', title: 'Where you are', panel: true, node: { p: 'stack', gap: 3, kids: [
          { p: 'breadcrumb', items: ['Home', 'Payments', 'Direct debits'] },
          { p: 'divider' },
          { p: 'tabs', items: ['Overview', 'Documents', 'History'] },
        ] } },
        { id: 'team', title: 'Who is on it', panel: true, node: { p: 'row', kids: [
          { p: 'avatar', text: 'MV' }, { p: 'avatar', text: 'KB' }, { p: 'avatar', text: 'AY' },
          { p: 'muted', text: 'and six others on this case' },
        ] } },
        { id: 'end', title: 'The block at the end', panel: false, node: { p: 'footer',
          note: '2026 Gemeente Havenstad · Accessibility statement · Privacy',
          groups: [
            { title: 'Arrange', items: ['Requests', 'Permits', 'Objections'] },
            { title: 'Find', items: ['Opening hours', 'Locations', 'Contact'] },
            { title: 'About', items: ['Council', 'Decisions', 'Vacancies'] },
          ] } },
      ] },
      { w: 300, cards: [
        { id: 'rail', title: 'A sidebar', panel: true, node: { p: 'sidenav', groups: [
          { title: 'Casework', items: [
            { icon: 'layout-dashboard', text: 'Overview', on: true },
            { icon: 'inbox', text: 'Requests', count: '24' },
            { icon: 'arrow-left-right', text: 'Transfers' },
            { icon: 'trending-up', text: 'Trends' },
          ] },
          { title: 'Account', items: [
            { icon: 'user', text: 'Profile' },
            { icon: 'bell', text: 'Notifications' },
            { icon: 'shield', text: 'Security' },
            { icon: 'life-buoy', text: 'Help' },
          ] },
        ] } },
        { id: 'actions', title: 'A menu, open', panel: true, node: { p: 'menu',
          icon: 'chevron-down', trigger: 'Actions', label: 'This request',
          items: ['Assign to someone', 'Ask for documents', 'Put on hold'],
          danger: 'Withdraw' } },
      ] },
      { w: 340, cards: [
        { id: 'nothing', title: 'When there is nothing yet', panel: true, node: { p: 'empty',
          icon: 'inbox', title: 'No requests yet',
          text: 'When someone submits a request it lands here, with the newest at the top.',
          kids: [{ p: 'button', tone: 'brand', text: 'Start a request' }] } },
        { id: 'promo', title: 'A card with a picture', panel: false, node: { p: 'mediacard',
          title: 'Parking permits', text: 'For residents, visitors and trades. Renewals open six weeks ahead.', action: 'Read on' } },
      ] },
    ],
  },

  /* ── 6 ─────────────────────────────────────────────────────────────────── */
  {
    id: 'page', label: 'A whole page',
    note: 'The two things every page has and no component library talks about: the bar on top and the block at the end.',
    cols: [
      { w: 1080, cards: [
        { id: 'site', title: 'A whole page', panel: false, node: { p: 'stack', gap: 0, kids: [
          { p: 'navbar', brand: 'Havenstad', items: ['Requests', 'Decisions', 'Reports'],
            kids: [{ p: 'button', tone: 'secondary', text: 'Sign in' }, { p: 'button', tone: 'brand', text: 'Start a request' }] },
          { p: 'stack', gap: 4, pad: true, kids: [
            { p: 'heading', level: 2, text: 'What you can arrange here' },
            { p: 'text', text: 'Most of it can be done online. Where a form asks for something on paper we say so before you start, and you can always finish it at the desk.' },
            { p: 'grid', cols: 3, kids: [
              { p: 'mediacard', title: 'Building work', text: 'Permission to build, convert or demolish, and what the neighbours are told.', action: 'Read on' },
              { p: 'mediacard', title: 'Waste and recycling', text: 'Collection days, bulky items, and where the containers are.', action: 'Read on' },
              { p: 'mediacard', title: 'Parking permits', text: 'For residents, visitors and trades. Renewals open six weeks ahead.', action: 'Read on' },
            ] },
          ] },
          { p: 'footer', note: '2026 Gemeente Havenstad · Accessibility statement · Privacy',
            groups: [
              { title: 'Arrange', items: ['Requests', 'Permits', 'Objections'] },
              { title: 'Find', items: ['Opening hours', 'Locations', 'Contact'] },
              { title: 'About', items: ['Council', 'Decisions', 'Vacancies'] },
            ] },
        ] } },
      ] },
    ],
  },
]

/**
 * A card as it is really rendered.
 *
 * `panel: true` means the card sits in the kit's OWN card component — which is
 * what makes the mosaic look like their site rather than like ours. It is a
 * flag on the card and not markup in the card, so the data stays readable, and
 * this one function is what everything downstream renders.
 */
export const nodeOf = (card) => (card.panel ? { p: 'panel', kids: [card.node] } : card.node)

/**
 * Every card on the wall, flat and in reading order, already wrapped.
 *
 * The meters count classes over the whole wall and the tests render each card
 * in every kit; neither of them cares which column a card sits in. Derived, so
 * a card can never be on the wall and missing from the count — and counted on
 * exactly the markup the wall shows, not on an unwrapped version of it.
 */
export const SCENES = BOARDS.flatMap((b) => b.cols.flatMap((c) => c.cards.map((card) =>
  ({ ...card, board: b.id, node: nodeOf(card) }))))

/**
 * Every icon a card names, walked out of the cards themselves.
 *
 * The build reads exactly these out of lucide and hands them to the bindings,
 * and lucide throws on a name it does not have. So an icon can be wrong at
 * build time or not at all — never a blank square on the wall, which is how a
 * missing glyph used to ship.
 */
export const ICON_NAMES = (() => {
  const out = new Set(BINDING_ICONS)
  const walk = (n) => {
    if (!n || typeof n !== 'object') return
    if (n.icon) out.add(n.icon)
    if (n.p === 'iconrow') for (const i of n.items ?? []) out.add(i)
    for (const k of ['kids', 'items', 'groups', 'rows']) for (const c of Array.isArray(n[k]) ? n[k] : []) walk(c)
  }
  SCENES.forEach((c) => walk(c.node))
  return [...out].sort()
})()

/* The wall carries a script of its own — the pan — and this module is INLINED
 * into the page's own script block. A literal closing tag anywhere in this
 * source ends that block where it stands and the rest of the page parses as
 * HTML: a blank tool, a heap of SVG errors, and nothing that says why. So the
 * tag is assembled and never written. */
const CLOSE = '</' + 'script>'

/**
 * The wall as JSON, safe to write INTO a script tag.
 *
 * The escape goes on the JSON TEXT, not on the value: escaping the value first
 * makes JSON.stringify double the backslash and what reaches the markup is a
 * literal backslash-slash rather than a closing tag. Both build scripts write
 * the wall into a page, so both need this and neither should have its own.
 */
export const safeJson = (value) => JSON.stringify(value).split('</scr' + 'ipt').join('<\\/scr' + 'ipt')

/**
 * THE WALL FOR ONE KIT, as a strip you pan.
 *
 * One implementation: the page, the quick preview and the hero shot all render
 * this, so what you look at while turning a knob is the arrangement the meters
 * counted. Everything of OURS in this document is four class names and a
 * hairline — the kits are the only things on the page allowed to have a look.
 */
export const wallMarkup = (bind, boards = BOARDS) => `<main id="strip">${boards.map((b) =>
  `<section class="board" id="b_${b.id}" data-board="${b.id}">
    <header class="board__top"><h2 class="board__name">${b.label}</h2><p class="board__note">${b.note}</p></header>
    <div class="board__cols">${b.cols.map((c) => `<div class="col" style="width:${c.w}px">${c.cards.map((card) =>
      `<figure class="card" data-card="${card.id}"><figcaption class="cap">${card.title}</figcaption>${render(nodeOf(card), bind)}</figure>`).join('')}</div>`).join('')}</div>
  </section>`).join('')}</main>
<style>/* NO font-family here. The wrapper setting one hard-coded our chrome over
   every kit's own typography, so the font knobs moved the card and nothing
   else — the kit's stylesheet decides what this page is set in. */
*,*::before,*::after{box-sizing:border-box}
html,body{height:100%}
body{margin:0;overflow:hidden}
#strip{height:100%;display:flex;align-items:stretch;overflow:auto;scroll-snap-type:x proximity;overscroll-behavior-x:contain;cursor:grab}
#strip.pan{cursor:grabbing;user-select:none}
.board{flex:none;display:flex;flex-direction:column;gap:16px;padding:22px 26px;scroll-snap-align:start;border-inline-end:1px solid rgb(128 128 128 / .16)}
.board:last-child{border-inline-end:0}
.board__top{display:flex;flex-direction:column;gap:3px;max-width:62ch}
.board__name{margin:0;font-size:13px;font-weight:650;letter-spacing:.01em;opacity:.9;line-height:1.2}
.board__note{margin:0;font-size:11.5px;line-height:1.45;opacity:.5}
.board__cols{flex:1;min-height:0;display:flex;gap:20px;align-items:flex-start}
.col{flex:none;display:flex;flex-direction:column;gap:20px;min-width:0}
.card{margin:0;display:flex;flex-direction:column;gap:8px;cursor:auto}
.cap{margin:0;font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.42;font-weight:600}</style>
<script>(function(){
  var m=document.getElementById('strip')
  /* A mouse has one wheel and this wall runs the other way, so a vertical wheel
     pans — but only while there is nothing to scroll vertically, or a short
     window would trap the bottom of a column off screen. */
  m.addEventListener('wheel',function(e){
    if(m.scrollHeight>m.clientHeight+2)return
    if(Math.abs(e.deltaY)<=Math.abs(e.deltaX))return
    m.scrollLeft+=e.deltaY; e.preventDefault()
  },{passive:false})
  /* and drag, the way a map does — never starting on something you can operate */
  var d=null
  m.addEventListener('pointerdown',function(e){
    if(e.button!==0)return
    if(e.target.closest('input,select,textarea,button,a,label,summary,[role=radio],[role=checkbox],[role=slider]'))return
    d={x:e.clientX,l:m.scrollLeft}; m.classList.add('pan')
  })
  m.addEventListener('pointermove',function(e){ if(d)m.scrollLeft=d.l-(e.clientX-d.x) })
  addEventListener('pointerup',function(){ d=null; m.classList.remove('pan') })

  /* ── AND THE WALL BEHAVES ───────────────────────────────────────────────
   * Four of these kits keep a control's state in ATTRIBUTES and CLASSES
   * rather than in a pseudo-class, because their real components are React
   * and React writes them. Markup on its own writes nothing back, so a
   * switch did not switch, a tab did not move and a slider did not drag —
   * which are the first three things anybody tries.
   *
   * Nothing below decides how a kit should behave. Every rule reads what
   * that kit ALREADY WROTE for the two states it rendered side by side and
   * moves the difference across. The kit whose chosen tab differs by a
   * class gets its class moved; the one that differs by an attribute gets
   * its attribute moved; the one that writes a percentage into a calc()
   * gets a new number inside the same calc(). None of those shapes is one
   * we picked, and a kit we have never seen would work the same way. */

  /* A LINK TO NOWHERE IS STILL A LINK.
     Every kit's nav, breadcrumb and menu is built from anchors, and a wall
     writes href="#" because there is nowhere to go. Inside a srcdoc frame
     that is not inert: the frame resolves it against the PARENT page and
     navigates itself to the whole wall, so one click on a breadcrumb
     replaced five of the seven specimens with a copy of the page they were
     sitting in. It looked like the tool had crashed. Nothing in any kit is
     at fault and nothing in any kit can fix it. */
  m.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a'),h=a&&a.getAttribute('href')
    if(a&&(!h||h.charAt(0)==='#'))e.preventDefault()
  })

  /* EVERY BACKSLASH IN HERE IS DOUBLED, because this whole script is a
     template literal and one of them is eaten on the way out. A split on
     whitespace written with a single backslash shipped as a regular
     expression that matches nothing — so a class list never split, no state
     word was ever found, and Bootstrap's sidebar was the only chooser on the
     wall that did not move. It failed silently in one place out of seven. */

  /* what makes this element different from that one: attribute by
     attribute, class attribute included, and never id or style */
  function sig(el){
    var a=[],x=el.attributes,i
    for(i=0;i<x.length;i++){ if(x[i].name==='style'||x[i].name==='id')continue; a.push(x[i].name+'\\u0001'+x[i].value) }
    return a.sort().join('\\u0002')
  }
  /* the pairs of (name, chosen value, unchosen value) that separate them.
     null on either side means the attribute is simply absent there. */
  function mark(on,off){
    var out=[],seen={},i,n
    for(i=0;i<on.attributes.length;i++){ n=on.attributes[i].name
      if(n==='style'||n==='id')continue; seen[n]=1
      if(off.getAttribute(n)!==on.attributes[i].value)out.push([n,on.attributes[i].value,off.getAttribute(n)]) }
    for(i=0;i<off.attributes.length;i++){ n=off.attributes[i].name
      if(n==='style'||n==='id'||seen[n])continue; out.push([n,null,off.getAttribute(n)]) }
    return out
  }
  function put(el,name,v){ if(v===null)el.removeAttribute(name); else el.setAttribute(name,v) }

  /* THE VOCABULARY OF BEING THE CHOSEN ONE.
     Every kit here says it with one of these names, and the whole point is
     that we do not have to know which. What does NOT count is a difference
     that is merely a difference: a red menu item is not a chosen menu item,
     and a colour class is not a state. Without this the wall let you click
     Delete and watch it stop being red while Rename went red instead. */
  var STATEATTR=/^(data-(state|active|selected|checked|current)|aria-(selected|current|checked|pressed))$/
  var STATECLASS=/(^|[-_])(active|selected|current|checked|open)([-_]|$)/
  function saysChosen(m){
    for(var i=0;i<m.length;i++){
      if(STATEATTR.test(m[i][0]))return true
      if(m[i][0]==='class'){
        var a=(m[i][1]||'').split(/\\s+/),b=(m[i][2]||'').split(/\\s+/),j
        for(j=0;j<a.length;j++)if(b.indexOf(a[j])<0&&STATECLASS.test(a[j]))return true
        for(j=0;j<b.length;j++)if(a.indexOf(b[j])<0&&STATECLASS.test(b[j]))return true
      }
    }
    return false
  }

  /* A CHOOSER IS A ROW WHERE EXACTLY ONE IS DIFFERENT.
     Three or more of the same tag, two shapes between them, one of which
     appears once: that one is the chosen one, whatever this kit calls it.
     Only things you can operate — a link, a button, or anything that names
     its own role — and never a custom element, whose own code already runs.
     Anything a rule above already owns is left to that rule. */
  function chooser(set){
    if(set.length<3)return
    var tag=set[0].tagName,i,el
    if(tag.indexOf('-')>0)return
    for(i=0;i<set.length;i++){ el=set[i]
      if(el.tagName!==tag)return
      if(tag!=='A'&&tag!=='BUTTON'&&!el.getAttribute('role'))return
      if(/^(switch|checkbox|radio)$/.test(el.getAttribute('role')||''))return
    }
    var by={},k
    for(i=0;i<set.length;i++){ k=sig(set[i]); (by[k]=by[k]||[]).push(set[i]) }
    var keys=Object.keys(by); if(keys.length!==2)return
    var one=by[keys[0]].length===1?by[keys[0]][0]:by[keys[1]].length===1?by[keys[1]][0]:null
    if(!one)return
    var other=null
    for(i=0;i<set.length;i++)if(set[i]!==one){other=set[i];break}
    var m=mark(one,other)
    if(!m.length||!saysChosen(m))return
    set.forEach(function(el){ el.addEventListener('click',function(){
      set.forEach(function(o){ m.forEach(function(p){ put(o,p[0],o===el?p[1]:p[2]) }) })
    }) })
  }
  /* THE SET IS A TAG, NOT A ROW.
     A rail is not a clean row of four links: there is a heading above them
     and one of them carries a count. Insisting the whole row be identical in
     shape meant a rail was a chooser in one kit and not in the six others,
     which is an accident and not a decision. So the row is grouped BY TAG and
     each tag with three or more members is offered on its own. */
  function bytag(set,fn){
    var by={},i,t
    for(i=0;i<set.length;i++){ if(!set[i])continue; t=set[i].tagName; (by[t]=by[t]||[]).push(set[i]) }
    for(t in by)if(by[t].length>=3)fn(by[t])
  }
  var all=m.querySelectorAll('*')
  for(var q=0;q<all.length;q++){
    var kids=Array.prototype.slice.call(all[q].children)
    if(kids.length<3)continue
    bytag(kids,chooser)
    /* one wrapper deep, for a kit that puts each choice in its own li or div */
    bytag(kids.map(function(k){return k.firstElementChild}),chooser)
  }

  /* A BUTTON THAT SAYS IT IS A SWITCH, A BOX OR A RADIO.
     Their components put the answer in aria-checked and repeat it in
     data-state down the subtree, so both move together. */
  function checked(el,on){
    el.setAttribute('aria-checked',on?'true':'false')
    var n=[el].concat(Array.prototype.slice.call(el.querySelectorAll('[data-state]')))
    n.forEach(function(x){ var v=x.getAttribute('data-state')
      if(v==='checked'||v==='unchecked')x.setAttribute('data-state',on?'checked':'unchecked') })
  }
  m.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('button[role=switch],button[role=checkbox],button[role=radio]')
    if(!b)return
    if(b.getAttribute('role')==='radio'){
      var g=b.closest('[role=radiogroup]')||b.parentElement.parentElement
      Array.prototype.forEach.call(g.querySelectorAll('[role=radio]'),function(r){checked(r,false)})
      return checked(b,true)
    }
    checked(b,b.getAttribute('aria-checked')!=='true')
  })
  /* and a kit that uses a real input but repeats the answer on a wrapper */
  m.addEventListener('change',function(e){
    var i=e.target; if(!i.matches||!i.matches('input'))return
    for(var n=i;n&&n!==m;n=n.parentElement)
      if(n.hasAttribute('data-checked'))n.setAttribute('data-checked',i.checked?'true':'false')
  })

  /* A THING THAT SAYS IT IS EXPANDED CAN BE.
     aria-expanded is not a kit's invention, it is the attribute a select
     trigger is REQUIRED to carry — so the panel it opens is found without
     knowing whose select it is: the next element along, hidden. Their own
     data-state moves with it, because that is what their CSS watches. */
  m.addEventListener('click',function(e){
    var t=e.target.closest&&e.target.closest('[aria-expanded]'); if(!t)return
    var pan=t.nextElementSibling; if(!pan)return
    var open=t.getAttribute('aria-expanded')!=='true'
    t.setAttribute('aria-expanded',open?'true':'false')
    pan.hidden=!open
    if(pan.getAttribute('data-state'))pan.setAttribute('data-state',open?'open':'closed')
  })
  /* and clicking away closes it, the way every one of them does — but only
     what was drawn CLOSED. This wall draws its menus open on purpose, since a
     closed one shows nothing, and a menu that vanished on the first stray
     click and had to be hunted back would be a worse specimen, not a truer
     one. Anything that starts closed is a select, and a select closes. */
  Array.prototype.forEach.call(m.querySelectorAll('[aria-expanded=true]'),function(t){t.dataset.wallOpen='1'})
  m.addEventListener('click',function(e){
    Array.prototype.forEach.call(m.querySelectorAll('[aria-expanded=true]'),function(t){
      if(t.dataset.wallOpen)return
      if(t===e.target||t.contains(e.target))return
      var pan=t.nextElementSibling; if(!pan||pan.contains(e.target))return
      t.setAttribute('aria-expanded','false'); pan.hidden=true
      if(pan.getAttribute('data-state'))pan.setAttribute('data-state','closed')
    })
  })

  /* A SLIDER DRAGS.
     Three of these draw theirs out of divs, and each writes the value as a
     percentage somewhere in an inline style — a width, a left, a custom
     property inside a calc(). Which one is not our business: the percent
     that is already there is taken out and the style kept as a stencil, so
     dragging writes the kit's own expression with a different number. */
  Array.prototype.forEach.call(m.querySelectorAll('[role=slider]'),function(th){
    var box=th.offsetParent; if(!box)return
    var now=+th.getAttribute('aria-valuenow'); if(!(now>=0))return
    var cut=String(now)+'%', tpl=[]
    var nodes=[box].concat(Array.prototype.slice.call(box.querySelectorAll('*')))
    nodes.forEach(function(el){ var t=el.style.cssText
      if(t&&t.indexOf(cut)>=0)tpl.push([el,t.split(cut).join('\\u0000')]) })
    if(!tpl.length)return
    function at(pct){
      pct=Math.max(0,Math.min(100,Math.round(pct)))
      tpl.forEach(function(p){ p[0].style.cssText=p[1].split('\\u0000').join(pct+'%') })
      th.setAttribute('aria-valuenow',pct)
    }
    /* Measured on the box itself, padding included. A percentage in a left
       or a width resolves against the containing block, and that is the
       padding box — so a kit that insets its track by half a thumb has
       already accounted for it. Taking the padding off again put its thumb
       three pixels behind the pointer. (No backticks in here: this whole
       block is a template literal. Fifth time.) */
    function from(x){ var r=box.getBoundingClientRect(); return r.width>0?(x-r.left)/r.width*100:0 }
    var drag=false
    box.addEventListener('pointerdown',function(e){ drag=true; box.setPointerCapture&&box.setPointerCapture(e.pointerId); at(from(e.clientX)); e.preventDefault() })
    box.addEventListener('pointermove',function(e){ if(drag)at(from(e.clientX)) })
    addEventListener('pointerup',function(){ drag=false })
    th.addEventListener('keydown',function(e){
      var v=+th.getAttribute('aria-valuenow'),k=e.key
      if(k==='ArrowLeft'||k==='ArrowDown')at(v-1); else if(k==='ArrowRight'||k==='ArrowUp')at(v+1)
      else if(k==='Home')at(0); else if(k==='End')at(100); else return
      e.preventDefault()
    })
  })
})()${CLOSE}`
