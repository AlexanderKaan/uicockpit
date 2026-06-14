/**
 * Ledger fixtures — the canonical recurring cast.
 *
 * The coherence lever (flagship-billing-pilot): a real app reads like there's one
 * database behind it because the SAME people and companies recur across every
 * screen. Both the Invoice-detail and the Cashflow-home screens import from here,
 * so Alex Curren / Tuple / SavvyCal are the same entity everywhere.
 *
 * Portraits are pinned real photos (randomuser.me) shown via the kit's
 * .avatar__img slot with an initial fallback; logos are the designed marks in
 * logos.tsx. Pure data — swap the avatar URLs for bundled/own files any time.
 */

const P = (g: 'men' | 'women', n: number) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`

export const PEOPLE = {
  alex: { name: 'Alex Curren', role: 'Billing lead', avatar: P('men', 32) },
  chelsea: { name: 'Chelsea Hagon', role: 'Founder', avatar: P('women', 44) },
  tom: { name: 'Tom Cook', role: 'Operations', avatar: P('men', 75) },
  priya: { name: 'Priya Nair', role: 'Finance', avatar: P('women', 68) },
  michael: { name: 'Michael Foster', role: 'Design', avatar: P('men', 41) },
} as const

export const COMPANIES = {
  tuple: { name: 'Tuple, Inc', logo: 'tuple' },
  savvy: { name: 'SavvyCal', logo: 'savvy' },
  reform: { name: 'Reform', logo: 'reform' },
  loomis: { name: 'Loomis Studio', logo: 'loomis' },
  vantage: { name: 'Vantage', logo: 'vantage' },
  cedar: { name: 'Cedar Health', logo: 'cedar' },
} as const
