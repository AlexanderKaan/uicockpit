import type { GenNode, GenType } from './spec'

/**
 * ONE sample per catalogue type — MAXIMAL: every field the type has, so the
 * sample doubles as the type's field list (spec.ts derives KNOWN_KEYS from it
 * and warns about a field a sample does not carry). Three consumers, so none
 * can drift: the sandbox's "What you can ask for" renders and INSERTS these,
 * genui.test.ts admits and renders every one in kit classes, and admission
 * reads the field list off them. A type without a sample fails the test; a
 * sample that does not admit fails the test — so what the reference offers is
 * exactly what the renderer can paint. (A `false` boolean in a sample is not
 * noise: it is the field's name, shown.)
 */
export const SAMPLES: Record<GenType, GenNode> = {
  heading: { type: 'heading', eyebrow: 'Eyebrow', text: 'A heading', sub: 'A line under it', level: 2 },
  text: { type: 'text', text: 'Flowing text takes the kit\'s prose typography.' },
  link: { type: 'link', text: 'Read the full decision', href: '#', external: false },
  stack: { type: 'stack', children: [{ type: 'text', text: 'One thing' }, { type: 'text', text: 'under another' }] },
  cluster: { type: 'cluster', children: [{ type: 'badge', text: 'Open', tone: 'info' }, { type: 'badge', text: 'Paid', tone: 'success' }] },
  grid: { type: 'grid', min: '12rem', children: [{ type: 'card', title: 'One' }, { type: 'card', title: 'Two' }] },
  strip: { type: 'strip', label: 'Nearby locations', slide: '15rem', children: [
    { type: 'card', media: { alt: 'Map — Tractieweg 2', map: true }, title: 'Tractieweg', desc: '2.1 km · open now', actions: [{ type: 'button', text: 'Route', variant: 'primary', size: 'sm' }] },
    { type: 'card', media: { alt: 'Map — Sophialaan 5', map: true }, title: 'Lage Weide', desc: '4.8 km · closes 17:00', actions: [{ type: 'button', text: 'Route', variant: 'primary', size: 'sm' }] },
    { type: 'card', media: { alt: 'Map — Ambachtsweg 26', map: true }, title: 'Nieuwegein', desc: '5.9 km · residents only', actions: [{ type: 'button', text: 'Route', variant: 'ghost', size: 'sm' }] },
  ] },
  figure: { type: 'figure', alt: 'Map — Tractieweg 2, Utrecht', map: true, caption: 'Afvalscheidingsstation Tractieweg — Tractieweg 2, Utrecht', action: { text: 'Open in Maps', href: '#' }, ratio: '16 / 9' },
  card: { type: 'card', title: 'A card', desc: 'With a description.', badge: { text: 'New', tone: 'primary' }, media: { alt: 'A media slot', map: false }, well: false, children: [{ type: 'text', text: 'Content in the body.' }], actions: [{ type: 'button', text: 'Primary', variant: 'primary', size: 'sm' }, { type: 'button', text: 'Later', variant: 'ghost', size: 'sm' }] },
  button: { type: 'button', text: 'Continue', variant: 'primary', size: 'sm', icon: 'chevR', href: '#' },
  badge: { type: 'badge', text: 'Under review', tone: 'info', dot: true },
  metric: { type: 'metric', label: 'Open cases', value: '12', sub: '3 due this week', icon: 'chart' },
  metrics: { type: 'metrics', items: [{ label: 'Received', value: '48' }, { label: 'Decided', value: '31', sub: 'this month' }, { label: 'Overdue', value: '2' }] },
  facts: { type: 'facts', items: [{ label: 'Case', value: '2026-04471' }, { label: 'Status', value: 'Under review', badge: { text: 'Under review', tone: 'info' } }, { label: 'Portal', value: 'Mijn Omgeving', href: '#' }] },
  list: { type: 'list', section: 'Documents', items: [{ title: 'Application form', sub: 'PDF · 1.2 MB', icon: 'file', href: '#' }, { title: 'Rear elevation drawing', sub: 'received 11 Aug', icon: 'file', trail: { badge: { text: 'New', tone: 'success' } } }] },
  table: { type: 'table', caption: 'Your cases', columns: ['Case', 'Subject', 'Status'], rows: [['2026-04471', 'Dormer window', { badge: { text: 'Under review', tone: 'info' } }], ['2026-03918', 'Tree felling', { badge: { text: 'Granted', tone: 'success' } }]] },
  alert: { type: 'alert', tone: 'info', title: 'Good to know', text: 'The decision period can be extended once, by six weeks.' },
  banner: { type: 'banner', strong: 'Maintenance', text: 'Mijn Omgeving is unavailable on Sunday 02:00–04:00.', link: { text: 'More', href: '#' }, warn: false },
  warning: { type: 'warning', text: 'You may not start work until the objection period has passed.' },
  steps: { type: 'steps', items: [{ title: 'Check the zoning plan', body: 'Is a dormer allowed on your street?' }, { title: 'Apply', body: 'With drawings and a description.' }, { title: 'Wait for the decision', body: 'Eight weeks, extendable once.' }] },
  tasks: { type: 'tasks', items: [{ name: 'Personal details', status: { text: 'Completed', tone: 'success' } }, { name: 'Upload drawings', status: { text: 'Incomplete', tone: 'warn' }, hint: '2 of 3 files' }, { name: 'Pay the fee', status: { text: 'Cannot start yet' }, locked: true }] },
  progress: { type: 'progress', label: 'Storage', value: 7.8, max: 10, unit: 'GB', hint: '2.2 GB left this month', warn: false },
  stepper: { type: 'stepper', label: 'Case progress', steps: ['Received', 'Review', 'Decision'], current: 1 },
  accordion: { type: 'accordion', items: [{ summary: 'What counts as a dormer?', body: 'A window structure that projects from a sloping roof.' }, { summary: 'Do I need a permit?', body: 'Usually at the front; often not at the back.' }], open: 0 },
  tabs: { type: 'tabs', label: 'Views', items: ['Overview', 'Documents', 'Timeline'], selected: 0 },
  activity: { type: 'activity', items: [{ text: 'Decision sent', time: 'Today', tone: 'success' }, { text: 'Committee advice received', meta: 'welfare committee', time: '2 days ago', tone: 'info' }] },
  requirements: { type: 'requirements', items: [{ text: 'You are registered at this address', met: true }, { text: 'Your DigiD is activated', met: false }] },
  choice: { type: 'choice', label: 'How do you want the decision?', options: [{ title: 'By post', desc: 'Within 5 working days' }, { title: 'In Mijn Omgeving', desc: 'Same day', meta: 'recommended' }], selected: 1 },
  input: { type: 'input', label: 'E-mail address', kind: 'email', placeholder: 'name@example.nl', hint: 'For the confirmation only.', required: true },
  divider: { type: 'divider' },
}

export const SAMPLE_TYPES = Object.keys(SAMPLES) as GenType[]
