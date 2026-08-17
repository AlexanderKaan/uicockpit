import type { GenSpec } from './spec'

/**
 * The sandbox's presets — one prompt, answered twice: as prose (what an
 * assistant does today) and as a spec on the components (what it could do).
 * The prose is written to be a fair answer, not a straw man: the same facts,
 * in the order a model would give them. The point the split makes is
 * structural — the same information as interface, made only of components
 * that have a source.
 *
 * All six are PUBLIC-SERVICE situations — where to bring hazardous waste, a
 * benefit, a permit, an appointment, today's air quality, a tax return —
 * because that is where the fourth service is aimed: an assistant a
 * municipality, an environmental service or the tax administration would let
 * paint UI. Dutch institutions, English copy. Between them the six exercise
 * EVERY type in the catalogue (genui.test.ts holds that), so the sandbox shows
 * the whole vocabulary in use, not a corner of it. The seventh preset shows
 * what gets refused — and read.
 */
export type Preset = { id: string; name: string; prompt: string; prose: string[]; spec: GenSpec }

export const PRESETS: Preset[] = [
  {
    id: 'waste',
    name: 'Recycling centres near you',
    prompt: 'Where can I bring old paint and a broken TV? I live in Utrecht Overvecht.',
    prose: [
      'Paint, solvents, batteries and small electrical appliances such as a television count as household hazardous or electronic waste and cannot go in the regular bins; you bring them to a municipal recycling centre (afvalscheidingsstation). From Overvecht the nearest is Afvalscheidingsstation Tractieweg (Tractieweg 2), about 2 kilometres away, open Monday to Saturday from 08:00 to 17:00 and reachable by car and by bike. Afvalscheidingsstation Lage Weide (Sophialaan 5), about 5 kilometres away, has the same hours and is the only Utrecht location that also accepts wrapped asbestos, up to 35 square metres per visit. The Milieustraat in Nieuwegein (Ambachtsweg 26) is close as well but serves Nieuwegein residents only.',
      'Households may make eight free visits per year with a car; after that a fee applies. Bring proof of address, because a drop-off without it is refused. Paint and solvents go in the chemical-waste container in their original packaging; batteries and lamps can also be handed in at most supermarkets; a television goes to the electronics container and is recycled free of charge under the producer scheme. Medicines are not accepted at the recycling centre — return those to a pharmacy. If you cannot get there yourself, the municipality collects bulky waste and appliances at home by appointment.',
    ],
    spec: {
      title: 'Recycling centres near Overvecht',
      blocks: [
        { type: 'heading', text: 'Recycling centres near Overvecht', sub: '4 locations within 9 km · 2 open now · paint and electronics accepted at all of them' },
        { type: 'metrics', items: [{ label: 'Nearest', value: '2.1 km', sub: 'Tractieweg' }, { label: 'Open now', value: '2 of 4' }, { label: 'Free visits left', value: '6', sub: 'of 8 this year' }] },
        {
          type: 'strip', label: 'Recycling centres, nearest first', slide: '15rem', children: [
            { type: 'card', media: { alt: 'Map — Tractieweg 2, Utrecht', map: true }, badge: { text: 'Open now · until 17:00', tone: 'success' }, title: 'Afvalscheidingsstation Tractieweg', desc: '2.1 km · Mon–Sat 08:00–17:00 · car and bike access.', actions: [{ type: 'button', text: 'Route', variant: 'primary', size: 'sm', icon: 'chevR' }, { type: 'button', text: 'Hours', variant: 'ghost', size: 'sm' }] },
            { type: 'card', media: { alt: 'Map — Sophialaan 5, Utrecht', map: true }, badge: { text: 'Open now · until 17:00', tone: 'success' }, title: 'Afvalscheidingsstation Lage Weide', desc: '4.8 km · Mon–Sat 08:00–17:00 · also accepts wrapped asbestos.', actions: [{ type: 'button', text: 'Route', variant: 'primary', size: 'sm', icon: 'chevR' }, { type: 'button', text: 'Hours', variant: 'ghost', size: 'sm' }] },
            { type: 'card', media: { alt: 'Map — Ambachtsweg 26, Nieuwegein', map: true }, badge: { text: 'Nieuwegein residents only', tone: 'neutral' }, title: 'Milieustraat Nieuwegein', desc: '5.9 km · Tue–Sat 09:00–16:30 · proof of a Nieuwegein address required.', actions: [{ type: 'button', text: 'Route', variant: 'ghost', size: 'sm' }] },
            { type: 'card', media: { alt: 'Map — Fornhese 2, Zeist', map: true }, badge: { text: 'Closed today', tone: 'neutral' }, title: 'Milieupark Zeist', desc: '8.4 km · Tue–Sat 08:30–16:00 · Zeist and Bunnik residents.', actions: [{ type: 'button', text: 'Route', variant: 'ghost', size: 'sm' }] },
          ],
        },
        { type: 'figure', alt: 'Map — Tractieweg 2, Utrecht, the nearest centre', map: true, caption: 'Nearest: Afvalscheidingsstation Tractieweg — Tractieweg 2, Utrecht', action: { text: 'Open in Maps', href: '#' }, ratio: '21 / 9' },
        { type: 'facts', items: [
          { label: 'Paint and solvents', value: 'Yes — in the original packaging' },
          { label: 'Television', value: 'Yes — electronics container, free of charge' },
          { label: 'Batteries and lamps', value: 'Yes — or at most supermarkets' },
          { label: 'Asbestos', value: 'Lage Weide only, wrapped, max 35 m²', badge: { text: 'Lage Weide only', tone: 'warn' } },
          { label: 'Medicines', value: 'No — return them to a pharmacy' },
        ] },
        { type: 'warning', text: 'Bring proof of address. A drop-off without it is refused, and the eight free visits count per household per year.' },
        { type: 'link', text: 'Cannot get there? Book a home collection for bulky waste and appliances', href: '#' },
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
          { text: 'Substantive review started', meta: 'building control + welfare committee', time: '12 Aug', tone: 'info' },
          { text: 'Rear elevation drawing received', time: '11 Aug', tone: 'success' },
          { text: 'Additional document requested', meta: 'rear elevation with dimensions', time: '5 Aug', tone: 'warn' },
          { text: 'Application received', time: '3 Aug', tone: 'neutral' },
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
    id: 'air',
    name: 'Air quality today',
    prompt: 'Is the air quality in Hoogvliet OK today? My son has asthma.',
    prose: [
      'DCMR Milieudienst Rijnmond, the environmental service for the Rotterdam-Rijnmond region, measures air quality hourly at stations across the area, including Hoogvliet. As of 08:00 this morning the Hoogvliet station reads 12 micrograms per cubic metre of fine particulate matter (PM2.5), 28 micrograms of nitrogen dioxide (NO₂) and 61 micrograms of ozone; on the Dutch air-quality index (1–11) that is a 4, "moderate". The WHO guideline for a 24-hour PM2.5 average is 15 micrograms, so today\'s value is under it, but nitrogen dioxide is somewhat elevated because of the morning traffic on the A15 and the wind from the industrial area to the west. Neighbouring stations show similar values: Rotterdam-Zwartewaalstraat 14 and 31, Maassluis 9 and 19, Schiedam 13 and 27.',
      'For someone with asthma "moderate" means: normal activity is fine, but keep the reliever inhaler at hand and prefer the morning or late evening for sport, when ozone and traffic are lower; if symptoms increase, reduce exertion outdoors. DCMR expects the values to fall in the afternoon as the wind turns north. Fine particulate matter is dust smaller than 2.5 micrometres that penetrates deep into the lungs; nitrogen dioxide comes mostly from traffic and irritates the airways. You can report odour, noise or dust nuisance to the DCMR complaints line, which is staffed 24 hours a day, and you can set an alert in the app for the "unhealthy" level.',
    ],
    spec: {
      title: 'Air quality in Hoogvliet',
      blocks: [
        { type: 'heading', eyebrow: 'DCMR Milieudienst Rijnmond', text: 'Air quality in Hoogvliet', sub: 'Measured at 08:00 · updated hourly · station Hoogvliet' },
        { type: 'cluster', children: [
          { type: 'badge', text: 'Live', tone: 'success', dot: true },
          { type: 'badge', text: 'Index 4 · moderate', tone: 'warn' },
          { type: 'badge', text: 'Wind W 3 Bft', tone: 'neutral', dot: false },
        ] },
        { type: 'tabs', label: 'What is measured', items: ['Air', 'Noise', 'Odour'], selected: 0 },
        { type: 'alert', tone: 'warning', title: 'Moderate — fine for normal activity', text: 'With asthma: keep the reliever inhaler at hand and prefer the morning or late evening for sport, when ozone and traffic are lower.' },
        { type: 'metrics', items: [
          { label: 'PM2.5 · µg/m³', value: '12', sub: 'WHO guideline 15' },
          { label: 'NO₂ · µg/m³', value: '28', sub: 'elevated · A15' },
          { label: 'Ozone · µg/m³', value: '61', sub: 'falls this afternoon' },
        ] },
        { type: 'grid', min: '13rem', children: [
          { type: 'card', title: 'Right now, at your station', children: [
            { type: 'stack', children: [
              { type: 'metric', label: 'Air quality index', value: '4', sub: 'Moderate — on a scale of 1 to 11', icon: 'chart' },
              { type: 'text', text: 'Values are expected to fall this afternoon as the wind turns north.' },
            ] },
          ], actions: [{ type: 'button', text: 'Set an alert for “unhealthy”', variant: 'primary', size: 'sm', icon: 'bell' }] },
          { type: 'card', title: 'Nearby stations', children: [
            { type: 'list', items: [
              { title: 'Rotterdam-Zwartewaalstraat', sub: 'PM2.5 14 · NO₂ 31', icon: 'chart', trail: '4.2 km', href: '#' },
              { title: 'Schiedam', sub: 'PM2.5 13 · NO₂ 27', icon: 'chart', trail: '6.8 km', href: '#' },
              { title: 'Maassluis', sub: 'PM2.5 9 · NO₂ 19', icon: 'chart', trail: '9.1 km', href: '#' },
            ] },
          ] },
        ] },
        { type: 'table', caption: 'Stations in the region, last hour', columns: ['Station', 'PM2.5', 'NO₂', 'Index'], rows: [
          ['Hoogvliet', { num: '12' }, { num: '28' }, { badge: { text: 'Moderate', tone: 'warn' } }],
          ['Rotterdam-Zwartewaalstraat', { num: '14' }, { num: '31' }, { badge: { text: 'Moderate', tone: 'warn' } }],
          ['Schiedam', { num: '13' }, { num: '27' }, { badge: { text: 'Moderate', tone: 'warn' } }],
          ['Maassluis', { num: '9' }, { num: '19' }, { badge: { text: 'Good', tone: 'success' } }],
        ] },
        { type: 'accordion', open: 0, items: [
          { summary: 'What is PM2.5?', body: 'Dust smaller than 2.5 micrometres — small enough to penetrate deep into the lungs. It comes from traffic, industry, wood burning and from far away.' },
          { summary: 'What does “moderate” mean for asthma?', body: 'Normal activity is fine. Keep the reliever inhaler at hand, and if symptoms increase, reduce exertion outdoors until the values fall.' },
        ] },
        { type: 'banner', strong: 'Nuisance?', text: 'Odour, noise or dust — the DCMR complaints line is staffed 24 hours a day.', link: { text: 'Report a nuisance', href: '#' } },
      ],
    },
  },
  {
    id: 'tax',
    name: 'Income tax return 2025',
    prompt: 'What do I still need to do for my 2025 income tax return?',
    prose: [
      'Your 2025 income tax return (aangifte inkomstenbelasting) has to be filed before 1 May 2026, unless you request an extension before that date, in which case you have until 1 September. Two of the six sections are done: your personal details and your income, for which the employer statement (jaaropgaaf) was prefilled and confirmed. The section on your own home is incomplete because the WOZ value for 2025 is missing — the reference date is 1 January 2024 and the value is on the assessment your municipality sent in February, or in MijnOverheid. Deductions — healthcare costs above the threshold and gifts to registered charities — have not been started. Your partner\'s income cannot be entered until your partner logs in with their own DigiD, and the final check-and-sign step opens only when every section is complete.',
      'Everything you enter is saved as you go, so you can stop and come back later. Most figures are prefilled from your employer, your bank and your municipality; you must check them, and you are responsible for what you file. If you file before 1 April, the Tax Administration usually sends the assessment before 1 July; a refund is normally paid within a few weeks of the assessment. If you notice a mistake after sending, you can simply file again — the latest return counts.',
    ],
    spec: {
      title: 'Your 2025 income tax return',
      blocks: [
        { type: 'heading', eyebrow: 'Belastingdienst', text: 'Your 2025 income tax return', sub: 'File before 1 May 2026 — 2 of 6 sections done, about 25 minutes to go' },
        { type: 'progress', label: 'Sections completed', value: 2, max: 6, unit: 'sections', hint: '4 to go — everything you enter is saved as you go' },
        { type: 'tasks', items: [
          { name: 'Personal details', status: { text: 'Completed', tone: 'success' }, href: '#' },
          { name: 'Income and employer statement', status: { text: 'Completed', tone: 'success' }, hint: 'prefilled from your employer — confirmed', href: '#' },
          { name: 'Your own home', status: { text: 'Incomplete', tone: 'warn' }, hint: 'WOZ value 2025 missing — on the municipal assessment or in MijnOverheid', href: '#' },
          { name: 'Deductions — healthcare costs, gifts', status: { text: 'Not started', tone: 'neutral' }, href: '#' },
          { name: 'Your partner’s income', status: { text: 'Cannot start yet' }, hint: 'your partner logs in with their own DigiD', locked: true },
          { name: 'Check and sign', status: { text: 'Cannot start yet' }, hint: 'opens when every section is complete', locked: true },
        ] },
        { type: 'divider' },
        { type: 'facts', items: [
          { label: 'Deadline', value: '1 May 2026' },
          { label: 'Extension', value: 'Until 1 September — request it before 1 May' },
          { label: 'Prefilled', value: 'Employer, bank, WOZ — check them; you are responsible for what you file' },
          { label: 'Assessment', value: 'Usually before 1 July if you file before 1 April' },
        ] },
        { type: 'accordion', items: [
          { summary: 'My employer statement is missing — what now?', body: 'Ask your employer for the jaaropgaaf 2025; you can also read the totals from your December payslip. The prefilled figure is what your employer reported to us.' },
          { summary: 'Can I change my return after sending?', body: 'Yes — file again. The latest return counts, also after the deadline.' },
        ] },
        { type: 'text', text: 'You can stop at any point and return with DigiD; nothing is sent until you sign.' },
        { type: 'cluster', children: [
          { type: 'button', text: 'Continue where you left off', variant: 'primary', href: '#', icon: 'chevR' },
          { type: 'button', text: 'Request an extension', variant: 'ghost', href: '#' },
        ] },
      ],
    },
  },
  {
    id: 'refusals',
    name: 'What gets refused',
    prompt: 'Show my cases as a kanban board with a lightbox of photos, a card inside each card, and a summary list',
    prose: [
      'This preset exists to show the sandbox refusing — and reading. An assistant that can paint UI must not be able to invent it: a kanban board is named by no layer of the derivation, a lightbox exists in the kit but is not admitted to generative output (an assistant does not open an overlay on its own), and the card recipe forbids a card inside a card. Each refusal renders in place, with the reason, so the answer shows exactly where the assistant reached past the components. And a name that is not ours but IS our component — "summary list", GOV.UK’s word for the description list — is read through the forge and rendered, with a note that says so.',
    ],
    spec: {
      title: 'Refusals',
      blocks: [
        { type: 'heading', text: 'Your cases', sub: 'Three of the five things asked for are refused below — on purpose; one is read through the forge.' },
        { type: 'summary list', items: [{ label: 'Open cases', value: '3' }, { label: 'Oldest', value: '2026-02207 · terrace licence' }] } as never,
        { type: 'kanban', columns: ['Open', 'Waiting', 'Done'] } as never,
        { type: 'lightbox', items: ['photo 1', 'photo 2'] } as never,
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
