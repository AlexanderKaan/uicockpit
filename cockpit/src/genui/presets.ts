import type { GenSpec } from './spec'

/**
 * The sandbox's presets — one prompt, answered twice: as prose (what an
 * assistant does today) and as a spec on the components (what it could do).
 * The prose is written to be a fair answer, not a straw man: the same facts,
 * in the order a model would give them. The point the split makes is
 * structural — the same information as interface, made only of components
 * that have a source.
 *
 * Three of the four are public-service situations (a benefit, a permit, an
 * appointment) because that is where the fourth service is aimed: an
 * assistant a municipality or ministry would let paint UI. The first is the
 * OpenUI hotel example, kept so the two can be compared side by side.
 */
export type Preset = { id: string; name: string; prompt: string; prose: string[]; spec: GenSpec }

export const PRESETS: Preset[] = [
  {
    id: 'hotels',
    name: 'Hotels in Paris',
    prompt: 'I need a hotel with a modern design in Paris',
    prose: [
      'Paris offers a wide selection of modern-design hotels that blend contemporary architecture, thoughtful interiors and premium hospitality. Many of these properties are located in central neighbourhoods close to major landmarks, shopping districts and cultural sites, making them convenient bases for both first-time visitors and returning travellers. Modern hotels in the city often emphasise clean lines, natural materials, curated lighting and spacious layouts, while still preserving elements of Parisian elegance.',
      '• Hotel Plaza Athénée — situated near the Champs-Élysées, this property combines classic Parisian prestige with refined modern upgrades. Guests often choose it for its courtyard dining spaces, luxury spa and polished service.',
      '• Four Seasons Hotel George V — a historic landmark that has been carefully modernised, offering spacious rooms, world-class dining and extensive wellness offerings.',
      '• Le Bristol Paris — a palace hotel with a rooftop pool and a garden courtyard, quietly updated behind its 1925 façade.',
      'Across the Paris hospitality market, occupancy rates in upscale hotels have remained relatively consistent in recent months, indicating stable demand rather than sharp seasonal swings. Visitors planning a stay should keep in mind that the local currency is the euro, that everyday experiences often include sampling classic Parisian foods such as macarons and crêpes, and that the public transport system — the metro, buses and suburban trains — is extensive and efficient. Spring is popular for its mild weather; October is quieter.',
    ],
    spec: {
      title: 'Modern Hotels in Paris',
      blocks: [
        { type: 'heading', text: 'Modern Hotels in Paris', sub: 'Showing 3 results' },
        {
          type: 'grid', min: '12rem', children: [
            { type: 'card', media: { alt: 'Hotel Plaza Athénée, façade at dusk', label: 'Avenue Montaigne' }, badge: { text: 'Free Wi-Fi', tone: 'success' }, title: 'Hotel Plaza Athénée', desc: 'Haute-couture suites, courtyard dining, Dior spa — near the Champs-Élysées.', actions: [{ type: 'button', text: 'Book', variant: 'primary', size: 'sm', icon: 'chevR' }] },
            { type: 'card', media: { alt: 'Four Seasons George V, illuminated windows', label: 'Avenue George V' }, badge: { text: 'Family-friendly', tone: 'info' }, title: 'Four Seasons George V', desc: 'Landmark hotel with opulent rooms, Michelin dining and a lavish spa.', actions: [{ type: 'button', text: 'Book', variant: 'primary', size: 'sm', icon: 'chevR' }] },
            { type: 'card', media: { alt: 'Le Bristol Paris, rooftop pool', label: 'Rue du Faubourg Saint-Honoré' }, badge: { text: 'Rooftop pool', tone: 'primary' }, title: 'Le Bristol Paris', desc: 'A palace hotel with a garden courtyard, quietly updated behind its 1925 façade.', actions: [{ type: 'button', text: 'Book', variant: 'primary', size: 'sm', icon: 'chevR' }] },
          ],
        },
        { type: 'text', text: 'The occupancy rate has remained stable over the past three months, indicating consistent demand.' },
        { type: 'heading', text: 'Highlights', level: 3 },
        {
          type: 'facts', items: [
            { label: 'Currency', value: 'Euro (€)' },
            { label: 'Local cuisine', value: 'Macarons, crêpes' },
            { label: 'Getting around', value: 'Metro, bus, RER' },
            { label: 'Best time to visit', value: 'April to October' },
          ],
        },
      ],
    },
  },
  {
    id: 'benefit',
    name: 'Childcare benefit — am I eligible?',
    prompt: 'Can I get childcare benefit? I work 32 hours, my partner studies, our daughter is 3.',
    prose: [
      'In the Netherlands, childcare benefit (kinderopvangtoeslag) is a contribution towards the cost of registered childcare, paid by the Tax Administration\'s Benefits department. Whether you are eligible depends on a number of conditions. Both you and your partner must work, study, follow an integration course or a reintegration programme; you must use a registered childcare provider (a daycare centre, an out-of-school care provider or a registered childminder through an agency); you must have a valid contract with that provider; your child must live at your address; and you must have Dutch nationality or a valid residence permit. The number of hours you can claim is linked to the working hours of the partner who works the least. In your situation — you work 32 hours a week and your partner studies — you would generally both meet the "work or study" condition, and a three-year-old is well within the age range.',
      'To apply, you need a DigiD for both partners, the registration number of the childcare provider (LRK number), the number of hours per month agreed in your contract, the hourly rate, and an estimate of your joint annual income. You apply through Mijn toeslagen; the benefit is usually paid monthly in advance, and you must apply within three months of the month in which you first want to receive it. If your income or hours change during the year, you must report the change, or you may have to repay part of the benefit later. Keep in mind that the maximum hourly rate that is compensated differs per type of childcare, and that the percentage compensated declines as your joint income rises.',
    ],
    spec: {
      title: 'Childcare benefit — your situation',
      blocks: [
        { type: 'heading', text: 'Childcare benefit', sub: 'Checked against the conditions for 2026 — based on what you told me, not on your records.' },
        { type: 'requirements', items: [
          { text: 'You work or study — you work 32 hours a week', met: true },
          { text: 'Your partner works or studies — your partner studies', met: true },
          { text: 'Your child lives at your address and is under 12 — your daughter is 3', met: true },
          { text: 'You use a REGISTERED provider (LRK number) — not yet known', met: false },
          { text: 'You and your partner have a DigiD — not yet known', met: false },
        ] },
        { type: 'alert', tone: 'info', title: 'You likely qualify', text: 'Two conditions depend on your provider and your DigiD. Confirm those two and you can apply today; the benefit is paid monthly in advance.' },
        { type: 'steps', items: [
          { title: 'Find the LRK number of your provider', body: 'It is on your contract, or in the national childcare register (Landelijk Register Kinderopvang).' },
          { title: 'Have these ready', body: 'Hours per month from the contract, the hourly rate, and an estimate of your joint 2026 income.' },
          { title: 'Apply in Mijn toeslagen', body: 'Within three months of the first month you want the benefit for. Both partners log in with DigiD.' },
        ] },
        { type: 'warning', text: 'Report a change in hours or income during the year, or part of the benefit may have to be repaid.' },
        { type: 'cluster', children: [
          { type: 'button', text: 'Open Mijn toeslagen', variant: 'primary', href: '#' },
          { type: 'button', text: 'Look up an LRK number', variant: 'ghost', href: '#', icon: 'search' },
        ] },
      ],
    },
  },
  {
    id: 'permit',
    name: 'Where is my permit application?',
    prompt: 'What is the status of my dormer permit, case 2026-04471?',
    prose: [
      'Your application for a dormer window (case number 2026-04471) was received on 3 August 2026 and was checked for completeness on 5 August. The municipality then requested one additional document — a drawing of the rear elevation with the dormer\'s dimensions — which you submitted on 11 August. Since 12 August the application has been under substantive review by the building-control department; this includes a check against the zoning plan (Omgevingsplan) and, because the property is in a protected townscape, advice from the welfare committee. The statutory decision period for a regular procedure is eight weeks from the date of receipt, which means a decision is due by 28 September 2026 unless the municipality extends the period once, by six weeks at most, in which case you will be notified in writing. There is currently no indication of an extension.',
      'While the review is running you do not need to do anything. If the committee has questions you will be contacted by the case officer, whose name and telephone number are in the confirmation letter. Once a decision is taken it is published, and interested parties can object within six weeks; you may not start work until that period has passed unless the decision states otherwise. You can follow the case, download the letters and upload documents through Mijn Omgeving.',
    ],
    spec: {
      title: 'Case 2026-04471',
      blocks: [
        { type: 'heading', eyebrow: 'Omgevingsvergunning', text: 'Dormer window — case 2026-04471', sub: 'Under substantive review since 12 August 2026' },
        { type: 'stepper', label: 'Case progress: step 3 of 5', steps: ['Received', 'Complete', 'Under review', 'Decision', 'Objection period'], current: 2 },
        { type: 'facts', items: [
          { label: 'Received', value: '3 August 2026' },
          { label: 'Decision due', value: '28 September 2026' },
          { label: 'Procedure', value: 'Regular (8 weeks)' },
          { label: 'Status', value: 'Under review', badge: { text: 'Under review', tone: 'info' } },
          { label: 'Case officer', value: 'Building control, Gemeente Utrecht' },
        ] },
        { type: 'activity', items: [
          { text: 'Substantive review started', meta: 'building control + welfare committee', time: '12 Aug' },
          { text: 'Rear elevation drawing received', time: '11 Aug' },
          { text: 'Additional document requested', meta: 'rear elevation with dimensions', time: '5 Aug' },
          { text: 'Application received', time: '3 Aug' },
        ] },
        { type: 'alert', tone: 'success', title: 'Nothing to do right now', text: 'The municipality may extend the period once, by six weeks at most — you would be told in writing. There is no indication of that today.' },
        { type: 'cluster', children: [
          { type: 'button', text: 'Open the case in Mijn Omgeving', variant: 'primary', href: '#' },
          { type: 'button', text: 'Download the confirmation letter', variant: 'ghost', href: '#', icon: 'file' },
        ] },
      ],
    },
  },
  {
    id: 'appointment',
    name: 'Passport appointment',
    prompt: 'I need to renew my passport. What do I bring, and when can I come?',
    prose: [
      'To renew a Dutch passport you make an appointment at the municipality where you are registered; renewals cannot be done online because your fingerprints and signature are taken at the counter. Bring your current passport (even if it has expired), one recent colour passport photo that meets the Dutch photo requirements — taken within the last six months, neutral expression, plain light background — and a means of payment; the fee for an adult passport is around €86 and is paid at the appointment. If your passport was lost or stolen, bring the police or municipal declaration. The passport is usually ready for collection after five working days, and you collect it in person at the same desk. There is an urgent procedure with a surcharge if you need it sooner.',
      'The Stadskantoor has appointments this week on Wednesday afternoon from 13:15, Thursday morning from 09:00 and Friday morning from 10:30; the district office in Overvecht has slots on Thursday afternoon. Appointments last about ten minutes. You will receive a confirmation by e-mail with a code you can use to change or cancel the appointment.',
    ],
    spec: {
      title: 'Passport renewal',
      blocks: [
        { type: 'heading', text: 'Renew your passport', sub: 'In person, at the counter — fingerprints and signature are taken there.' },
        { type: 'grid', min: '16rem', children: [
          { type: 'card', title: 'What to bring', children: [
            { type: 'requirements', items: [
              { text: 'Your current passport, even if expired', met: true },
              { text: 'One recent colour photo (Dutch photo requirements)', met: true },
              { text: 'A means of payment — about €86', met: true },
              { text: 'Police or municipal declaration, if lost or stolen', met: false },
            ] },
          ] },
          { type: 'card', title: 'Choose a moment', children: [
            { type: 'choice', label: 'Available appointments', selected: 1, options: [
              { title: 'Wednesday 13:15', desc: 'Stadskantoor, desk 4', meta: '10 min' },
              { title: 'Thursday 09:00', desc: 'Stadskantoor, desk 4', meta: '10 min' },
              { title: 'Thursday 14:30', desc: 'District office Overvecht', meta: '10 min' },
              { title: 'Friday 10:30', desc: 'Stadskantoor, desk 2', meta: '10 min' },
            ] },
          ], actions: [{ type: 'button', text: 'Book Thursday 09:00', variant: 'primary', size: 'sm' }] },
        ] },
        { type: 'facts', items: [
          { label: 'Ready for collection', value: 'After 5 working days, in person' },
          { label: 'Urgent procedure', value: 'Available, with a surcharge' },
          { label: 'Change or cancel', value: 'With the code in your confirmation e-mail' },
        ] },
        { type: 'input', label: 'E-mail for the confirmation', kind: 'email', placeholder: 'name@example.nl', required: true, hint: 'Only used to send the confirmation and the change code.' },
      ],
    },
  },
  {
    id: 'refusals',
    name: 'What gets refused',
    prompt: 'Show my cases as a kanban board with a carousel of photos and a card inside each card',
    prose: [
      'This preset exists to show the sandbox refusing. An assistant that can paint UI must not be able to invent it: a kanban board is named by no layer of the derivation, a carousel exists in the kit but is not admitted to generative output, and the card recipe forbids a card inside a card. Each refusal renders in place, with the reason, so the answer shows exactly where the assistant reached past the components.',
    ],
    spec: {
      title: 'Refusals',
      blocks: [
        { type: 'heading', text: 'Your cases', sub: 'Three of the four things asked for are refused below — on purpose.' },
        { type: 'kanban', columns: ['Open', 'Waiting', 'Done'] } as never,
        { type: 'carousel', items: ['photo 1', 'photo 2'] } as never,
        { type: 'card', title: 'Case 2026-04471', desc: 'Dormer window', children: [
          { type: 'card', title: 'A card inside a card' },
          { type: 'badge', text: 'Under review', tone: 'info' },
        ] },
        { type: 'table', columns: ['Case', 'Subject', 'Status'], rows: [
          ['2026-04471', 'Dormer window', { badge: { text: 'Under review', tone: 'info' } }],
          ['2026-03918', 'Tree felling', { badge: { text: 'Granted', tone: 'success' } }],
          ['2026-02207', 'Terrace licence', { badge: { text: 'Objection period', tone: 'warn' } }],
        ] },
      ],
    },
  },
]
