/**
 * SEO landing-page content — data-driven. One renderer (`SeoPage.tsx`) reads
 * these entries; adding a target = adding an entry here, never a new component.
 *
 * Three kinds, three URL prefixes:
 *   compare → /compare/<slug>        "UIcockpit vs X" (head-to-head)
 *   alt     → /alternatives/<slug>   "X alternative"  (intent capture)
 *   use     → /uses/<slug>           keyword/use-case landing (no competitor)
 *
 * House rule for this file: comparisons are FACTUAL AND FAIR. We never claim a
 * competitor lacks something it has, and we acknowledge where they're stronger
 * (e.g. shadcn's owned component source, MUI's mature component set). Honest
 * comparisons rank better, build trust, and keep us out of legal trouble. We win
 * on our real differentiators: framework-neutral, the design-language layer,
 * no lock-in, the returnable hosted kit, and the AI-readable handoff.
 */

export type SeoKind = 'compare' | 'alt' | 'use'

/** A row in a comparison table. `winner` only tints the cell — never hides a fact. */
export interface CompareRow {
  feature: string
  us: string
  them: string
  winner?: 'us' | 'them' | 'tie'
}

export interface SeoEntry {
  kind: SeoKind
  slug: string
  /** Short label for footer + cross-links. */
  navLabel: string
  /** <title> (crawler + tab). */
  title: string
  metaDescription: string
  /** Hero. */
  eyebrow: string
  h1: string
  sub: string
  /** Body. */
  intro?: string[]
  compare?: { themName: string; rows: CompareRow[]; caption?: string }
  points?: { h: string; p: string }[]
  faq?: { q: string; a: string }[]
  /** Cross-links — full paths to other SEO entries. */
  related?: string[]
}

export const KIND_SEGMENT: Record<SeoKind, string> = {
  compare: 'compare',
  alt: 'alternatives',
  use: 'uses',
}

export const pathFor = (e: SeoEntry): string => `/${KIND_SEGMENT[e.kind]}/${e.slug}`

/* ── Reusable closing differentiators (kept consistent across pages) ───────── */
const TRANSPORT_POINT = {
  h: 'One source, many transports',
  p: 'Tokens (CSS + JSON), a Tailwind @theme block, a shadcn globals.css, an AI prompt and a machine-readable contract — all derive from one config, so they can never disagree. Plus a hosted live <link> you return to, and a CLI + MCP so your agent reads the system and checks its own work against it.',
}
const NEUTRAL_POINT = {
  h: 'Framework-neutral by design',
  p: 'The output is plain CSS custom properties (--k-*). They drop into React, Vue, Svelte, plain HTML — anything. You are never tied to one framework to wear your own brand.',
}
const NOLOCKIN_POINT = {
  h: 'No accounts, no lock-in',
  p: 'No login to configure or export. Your whole setup lives in the link; the static download is always one click away, byte-identical to the hosted kit. Eject any time.',
}
const CHECK_POINT = {
  h: 'A check that fails the build',
  p: 'Every kit ships a machine-readable contract and a verifier — uicockpit check, over a CLI and an MCP server. Wire it as a pre-commit or CI gate (--strict) and any drift — a raw hex, an off-scale radius, the wrong token — fails the build, so what your AI generates stays on-system across every screen and session.',
}

export const SEO_ENTRIES: SeoEntry[] = [
  /* ══════════════ COMPARISONS ══════════════ */
  {
    kind: 'compare',
    slug: 'shadcn',
    navLabel: 'vs shadcn/ui',
    title: 'UIcockpit vs shadcn/ui — design language vs component primitives',
    metaDescription:
      'UIcockpit vs shadcn/ui: shadcn gives you components you own; UIcockpit gives you the framework-neutral design language on top — colour, type, shape, motion as tokens. They pair: UIcockpit even exports a shadcn theme.',
    eyebrow: 'Comparison',
    h1: 'UIcockpit vs shadcn/ui',
    sub: 'shadcn/ui hands you neutral component primitives you own. UIcockpit hands you the design language that sits on top — so your app does not look like every other shadcn build. They are complementary, not rivals.',
    intro: [
      'shadcn/ui is a brilliant collection of accessible React components you copy into your repo and own outright. What it deliberately does not give you is an opinion: out of the box, every shadcn app shares the same neutral grey look.',
      'UIcockpit is the layer above. You make a handful of visual decisions — colour, type, shape, density, motion — and it derives a coherent set of framework-neutral design tokens. It even exports a drop-in shadcn globals.css, so the two work together: keep your shadcn components, wear your own brand.',
    ],
    compare: {
      themName: 'shadcn/ui',
      caption: 'Where each one is the right tool — honestly.',
      rows: [
        { feature: 'Stack', us: 'Framework-neutral (HTML, Vue, Svelte, React…)', them: 'React + Tailwind + Radix', winner: 'us' },
        { feature: 'What you get', us: 'A complete design language as tokens + recipes', them: 'Component source code you own', winner: 'tie' },
        { feature: 'Ready-made components', us: '100+ recipe CSS (full state contracts), not copy-paste source', them: 'Yes — accessible React components', winner: 'them' },
        { feature: 'Visual editor', us: '19 controls, live gallery + app preview', them: 'Hand-edit CSS variables', winner: 'us' },
        { feature: 'Export formats', us: '7 (tokens.css / JSON / Tailwind / shadcn / AI prompt / contract …)', them: 'Component files', winner: 'us' },
        { feature: 'Works with shadcn', us: 'Yes — exports a shadcn-compatible globals.css', them: 'It is shadcn', winner: 'tie' },
        { feature: 'AI handoff', us: 'Behaviour-shaping AI prompt + rules pack', them: 'Human-readable docs', winner: 'us' },
        { feature: 'Hosted live kit', us: 'Yes — one <link>, returnable, auto-updating', them: 'No', winner: 'us' },
        { feature: 'Lock-in', us: 'None — eject to files', them: 'None — you own the code', winner: 'tie' },
      ],
    },
    points: [
      { h: 'Sits above, not against', p: 'We do not replace shadcn — we theme it. UIcockpit exports a shadcn globals.css so you can restyle an existing shadcn project without touching a single component.' },
      NEUTRAL_POINT,
      TRANSPORT_POINT,
    ],
    faq: [
      { q: 'Is UIcockpit a shadcn alternative?', a: 'Not exactly — it solves a different problem. shadcn gives you components; UIcockpit gives you the design language to make them look like yours. Most people use both.' },
      { q: 'Can I use UIcockpit with my existing shadcn project?', a: 'Yes. Export the shadcn globals.css and drop it in — your components inherit the new brand, density and dark mode with no component edits.' },
      { q: 'Does UIcockpit give me components too?', a: 'It ships 100+ component recipes — CSS with full hover/focus/disabled contracts — plus the grammar an agent composes new components from, verified by uicockpit check. Not copy-paste React source like shadcn, so most people pair the two.' },
    ],
    related: ['/alternatives/shadcn', '/uses/shadcn-theme-generator', '/compare/tweakcn'],
  },
  {
    kind: 'compare',
    slug: 'v0',
    navLabel: 'vs v0',
    title: 'UIcockpit vs v0 — a design system vs AI-generated UI',
    metaDescription:
      'UIcockpit vs v0: v0 generates one-off UI from prompts; UIcockpit gives you a consistent, framework-neutral design system across every screen. Feed UIcockpit’s AI prompt into v0 so its output stays on-brand.',
    eyebrow: 'Comparison',
    h1: 'UIcockpit vs v0',
    sub: 'v0 is great at scaffolding a screen from a prompt. What it does not give you is a consistent design language — so multi-screen apps drift. UIcockpit supplies that system, and you can feed it straight into v0.',
    intro: [
      'v0 turns a prompt into UI code, fast. The trade-off is consistency: each generation interprets your intent afresh, so colour, spacing and shape wander from screen to screen — the classic generic AI-built look.',
      'UIcockpit is deterministic. You set the brand once and get framework-neutral tokens plus a behaviour-shaping AI prompt. Paste that prompt into v0 and every generation respects the same tokens, breakpoints and palette — coherent, not random.',
    ],
    compare: {
      themName: 'v0',
      rows: [
        { feature: 'Type', us: 'Design-system configurator (deterministic)', them: 'AI UI generator (prompt → code)', winner: 'tie' },
        { feature: 'Output', us: 'Reusable tokens + recipes for your whole app', them: 'One-off generated components', winner: 'us' },
        { feature: 'Consistency', us: 'One coherent system across every screen', them: 'Varies per prompt / per generation', winner: 'us' },
        { feature: 'Catches drift before ship', us: 'uicockpit check --strict fails the build on off-token values', them: 'No check — you eyeball each screen', winner: 'us' },
        { feature: 'Stack', us: 'Framework-neutral', them: 'React + Tailwind / shadcn', winner: 'us' },
        { feature: 'Brand control', us: '19 explicit controls (colour/type/shape/motion)', them: 'Described in prose, hard to pin down', winner: 'us' },
        { feature: 'Speed to a first screen', us: 'Configure, then build', them: 'Instant scaffold from a prompt', winner: 'them' },
        { feature: 'Accounts', us: 'None', them: 'Account, credit-based', winner: 'us' },
        { feature: 'Use together', us: 'Feed our AI prompt into v0 → on-brand output', them: '—', winner: 'tie' },
      ],
    },
    points: [
      { h: 'Coherence v0 can’t guarantee', p: 'A generator optimises one screen at a time. UIcockpit fixes the system once, so the tenth screen matches the first.' },
      { h: 'Better together', p: 'Keep using v0 to scaffold. Paste UIcockpit’s AI prompt so every generation inherits your tokens, palette and composition rules.' },
      CHECK_POINT,
      NEUTRAL_POINT,
    ],
    faq: [
      { q: 'Does UIcockpit generate UI code like v0?', a: 'No — and that is the point. It generates a reusable design system (tokens + recipes), not one-off screens. Use it to make v0’s output consistent.' },
      { q: 'Why does AI-built UI look generic?', a: 'Generators default to neutral primitives. UIcockpit gives the model an opinion to apply — your colour, type, shape and motion — so the result looks designed.' },
    ],
    related: ['/alternatives/v0', '/uses/ai-design-system', '/compare/shadcn'],
  },
  {
    kind: 'compare',
    slug: 'tweakcn',
    navLabel: 'vs TweakCN',
    title: 'UIcockpit vs TweakCN — framework-neutral design system vs shadcn theme editor',
    metaDescription:
      'UIcockpit vs TweakCN: TweakCN is a focused visual theme editor for shadcn/ui. UIcockpit is a full, framework-neutral design system — colour, type, shape, density, motion, component recipes and a hosted live kit.',
    eyebrow: 'Comparison',
    h1: 'UIcockpit vs TweakCN',
    sub: 'TweakCN is a sharp visual theme editor for shadcn/ui. UIcockpit is a broader, framework-neutral design system — more axes of control, more export formats, and a hosted kit you return to.',
    intro: [
      'TweakCN does one thing well: it lets you tune shadcn/ui theme variables (colours, radius) visually and copy the result. If you only ever ship shadcn, that focus is a genuine strength.',
      'UIcockpit widens the scope. It is framework-neutral, controls colour, type, shape, density and motion, ships per-component recipes and 8 export formats, and hosts your kit behind a returnable, auto-updating <link>.',
    ],
    compare: {
      themName: 'TweakCN',
      rows: [
        { feature: 'Scope', us: 'Colour, type, shape, density, motion + component recipes', them: 'shadcn theme variables (colour, radius)', winner: 'us' },
        { feature: 'Stack', us: 'Framework-neutral', them: 'shadcn (React + Tailwind)', winner: 'us' },
        { feature: 'Preview', us: 'Full component gallery + real app screens', them: 'shadcn component preview', winner: 'us' },
        { feature: 'Export formats', us: '7 (tokens.css / JSON / Tailwind / shadcn / AI prompt / contract …)', them: 'shadcn CSS variables', winner: 'us' },
        { feature: 'Best if you ship only shadcn', us: 'Works great, plus everything else', them: 'Focused, lightweight choice', winner: 'them' },
        { feature: 'AI handoff', us: 'Behaviour-shaping AI prompt + rules', them: '—', winner: 'us' },
        { feature: 'Hosted live kit', us: 'Yes — returnable, auto-updating', them: 'No', winner: 'us' },
        { feature: 'Accounts', us: 'None', them: 'None', winner: 'tie' },
      ],
    },
    points: [
      { h: 'More than colour + radius', p: 'Type scale, density, motion, elevation, chart palette and per-component recipes — a whole system, not just theme variables.' },
      NEUTRAL_POINT,
      TRANSPORT_POINT,
    ],
    faq: [
      { q: 'Is UIcockpit a TweakCN alternative?', a: 'Yes, and a broader one. If you live entirely in shadcn, TweakCN is focused and great. If you want a framework-neutral system with more control and a hosted kit, UIcockpit fits.' },
      { q: 'Can UIcockpit theme shadcn like TweakCN?', a: 'Yes — it exports a drop-in shadcn globals.css, alongside seven other formats.' },
    ],
    related: ['/alternatives/tweakcn', '/uses/shadcn-theme-generator', '/compare/shadcn'],
  },
  {
    kind: 'compare',
    slug: 'material-ui',
    navLabel: 'vs Material UI',
    title: 'UIcockpit vs Material UI (MUI) — your own design language vs Material Design',
    metaDescription:
      'UIcockpit vs Material UI: MUI is a mature React component library with the Material Design look. UIcockpit is a framework-neutral, zero-runtime token system for your own brand — no Material aesthetic, no React lock-in.',
    eyebrow: 'Comparison',
    h1: 'UIcockpit vs Material UI',
    sub: 'Material UI gives you a large, battle-tested React component set wearing Google’s Material Design. UIcockpit gives you framework-neutral tokens for your own look — zero runtime, no aesthetic lock-in.',
    intro: [
      'Material UI (MUI) is a mature React component library. If you want a complete, accessible component set and the Material Design aesthetic suits you, MUI is a strong, well-supported choice.',
      'UIcockpit is for the opposite need: owning your own design language, on any stack, with no runtime. It outputs plain CSS custom properties — so you are not tied to React or to one brand’s visual style.',
    ],
    compare: {
      themName: 'Material UI',
      rows: [
        { feature: 'Aesthetic', us: 'Your own design language (any look)', them: 'Material Design by default', winner: 'us' },
        { feature: 'Stack', us: 'Framework-neutral', them: 'React', winner: 'us' },
        { feature: 'Runtime', us: 'Zero runtime — just CSS variables', them: 'Component-library runtime', winner: 'us' },
        { feature: 'Component breadth', us: '100+ recipe CSS (state contracts), not a runtime library', them: 'Large, mature component set', winner: 'them' },
        { feature: 'Theming', us: '19 visual controls → tokens', them: 'JS theme object (in code)', winner: 'us' },
        { feature: 'Output', us: 'Framework-neutral tokens (7 formats)', them: 'React components + theme', winner: 'tie' },
        { feature: 'Lock-in', us: 'None — eject to files', them: 'React + MUI runtime', winner: 'us' },
      ],
    },
    points: [
      { h: 'Not locked to one look', p: 'Material UI is Material Design. UIcockpit lets you author any aesthetic and emit it as neutral tokens.' },
      { h: 'Zero runtime', p: 'No component library to ship — just CSS custom properties that theme whatever components you already use.' },
      NEUTRAL_POINT,
    ],
    faq: [
      { q: 'Is UIcockpit a Material UI alternative?', a: 'For the theming/design-language layer, yes. For a ready-made React component set, MUI is more complete today — UIcockpit themes the components you choose, on any stack.' },
      { q: 'Do I have to use React?', a: 'No. UIcockpit’s output is framework-neutral CSS variables that work in Vue, Svelte, plain HTML or React.' },
    ],
    related: ['/alternatives/material-ui', '/uses/framework-neutral-design-tokens', '/compare/tailwind-ui'],
  },
  {
    kind: 'compare',
    slug: 'tailwind-ui',
    navLabel: 'vs Tailwind UI',
    title: 'UIcockpit vs Tailwind UI — a design system vs ready-made component blocks',
    metaDescription:
      'UIcockpit vs Tailwind UI: Tailwind UI is a library of pre-built component and page blocks. UIcockpit is a free, framework-neutral design system that themes them — colour, type, shape, motion as tokens.',
    eyebrow: 'Comparison',
    h1: 'UIcockpit vs Tailwind UI',
    sub: 'Tailwind UI sells beautiful ready-made blocks. UIcockpit gives you the reusable design system to brand them — they pair perfectly: assemble with Tailwind UI, theme with UIcockpit.',
    intro: [
      'Tailwind UI is a library of professionally designed component and marketing-page blocks you copy into a Tailwind project. It is a head start on layout, not a design system: the blocks ship Tailwind’s default styling for you to customise by hand.',
      'UIcockpit gives you that system. Set your brand once and get framework-neutral tokens (plus a Tailwind v4 @theme block) that re-skin any markup — including Tailwind UI blocks — consistently.',
    ],
    compare: {
      themName: 'Tailwind UI',
      rows: [
        { feature: 'What it is', us: 'A design-system generator (tokens)', them: 'A library of pre-built blocks', winner: 'tie' },
        { feature: 'Output', us: 'Tokens that theme any components', them: 'Copy-paste Tailwind markup', winner: 'us' },
        { feature: 'Customisation', us: 'Token control of colour/type/shape/motion', them: 'Edit utility classes by hand', winner: 'us' },
        { feature: 'Ready-made layouts', us: 'Component recipes (not full page blocks)', them: 'Yes — many polished blocks', winner: 'them' },
        { feature: 'Stack', us: 'Framework-neutral', them: 'Tailwind CSS (HTML / React / Vue)', winner: 'us' },
        { feature: 'Cost', us: 'Free', them: 'Paid', winner: 'us' },
        { feature: 'AI handoff', us: 'AI prompt + rules pack', them: '—', winner: 'us' },
      ],
    },
    points: [
      { h: 'Brand the blocks', p: 'Tailwind UI blocks look like Tailwind UI. Apply UIcockpit tokens and they look like you — same blocks, your design language.' },
      { h: 'Free, framework-neutral', p: 'No paywall, and the tokens are not tied to Tailwind — though we ship a Tailwind v4 @theme export if that is your stack.' },
      TRANSPORT_POINT,
    ],
    faq: [
      { q: 'Can I use UIcockpit with Tailwind UI?', a: 'Yes — that is the ideal pairing. Build screens fast with Tailwind UI blocks, then theme them coherently with UIcockpit’s Tailwind v4 @theme export.' },
      { q: 'Is UIcockpit free?', a: 'Yes. Configure and export with no account, no paywall, no lock-in.' },
    ],
    related: ['/uses/design-tokens-for-tailwind', '/compare/material-ui', '/compare/shadcn'],
  },

  /* ══════════════ ALTERNATIVES ══════════════ */
  {
    kind: 'alt',
    slug: 'shadcn',
    navLabel: 'shadcn alternative',
    title: 'A shadcn/ui alternative for theming — UIcockpit',
    metaDescription:
      'Looking for a shadcn/ui alternative for theming? UIcockpit is a framework-neutral design-system generator that gives you the opinion shadcn leaves neutral — and exports a drop-in shadcn theme.',
    eyebrow: 'Alternative',
    h1: 'A shadcn/ui alternative for theming',
    sub: 'If you love shadcn but want it to stop looking generic, you do not need a different component library — you need a design language. That is UIcockpit.',
    intro: [
      'People searching for a shadcn alternative usually do not want different components — they want their shadcn app to look distinct, on a stack they choose. UIcockpit delivers that without making you rip anything out.',
      'Configure your brand visually, export a shadcn globals.css (or framework-neutral tokens), and your existing components inherit a coherent look. No account, no lock-in.',
    ],
    points: [
      { h: 'Keep your components', p: 'No migration. UIcockpit themes shadcn via a drop-in globals.css — your components, your brand.' },
      NEUTRAL_POINT,
      NOLOCKIN_POINT,
    ],
    faq: [
      { q: 'Will I have to replace my shadcn components?', a: 'No. UIcockpit is a theming layer — export the shadcn globals.css and keep every component.' },
      { q: 'Is it really framework-neutral?', a: 'Yes. The core output is plain CSS custom properties; the shadcn export is one of eight formats.' },
    ],
    related: ['/compare/shadcn', '/uses/shadcn-theme-generator', '/alternatives/tweakcn'],
  },
  {
    kind: 'alt',
    slug: 'v0',
    navLabel: 'v0 alternative',
    title: 'A v0 alternative for a consistent design system — UIcockpit',
    metaDescription:
      'A v0 alternative when you need consistency, not one-off screens. UIcockpit is a deterministic, framework-neutral design-system generator — and it makes v0’s own output stay on-brand.',
    eyebrow: 'Alternative',
    h1: 'A v0 alternative for consistency',
    sub: 'v0 is excellent at a first screen. When the tenth screen no longer matches the first, what you actually need is a design system — deterministic, reusable, framework-neutral.',
    intro: [
      'If you reached for a v0 alternative because AI-generated screens drift, the fix is not another generator — it is a fixed design language every screen inherits. UIcockpit produces that as tokens.',
      'You can still use v0: paste UIcockpit’s AI prompt and the generator’s output snaps to your tokens, palette and composition rules.',
    ],
    points: [
      { h: 'Deterministic, not per-prompt', p: 'Set the system once; every screen and every generation matches.' },
      { h: 'Make v0 consistent', p: 'Not a replacement you must pick — feed our AI prompt into v0 and keep generating, on-brand.' },
      CHECK_POINT,
      NEUTRAL_POINT,
    ],
    faq: [
      { q: 'Does this generate screens like v0?', a: 'No — it generates the reusable design system that makes generated screens consistent.' },
      { q: 'Do I have to stop using v0?', a: 'Not at all. They complement each other: v0 scaffolds, UIcockpit keeps it coherent.' },
    ],
    related: ['/compare/v0', '/uses/ai-design-system', '/alternatives/shadcn'],
  },
  {
    kind: 'alt',
    slug: 'tweakcn',
    navLabel: 'TweakCN alternative',
    title: 'A TweakCN alternative — framework-neutral and broader — UIcockpit',
    metaDescription:
      'A TweakCN alternative that goes beyond shadcn theme variables: UIcockpit controls colour, type, shape, density and motion, ships component recipes, 8 export formats and a hosted live kit.',
    eyebrow: 'Alternative',
    h1: 'A broader TweakCN alternative',
    sub: 'TweakCN is a focused shadcn theme editor. If you want the same visual ease but framework-neutral and across a whole design system, UIcockpit is the wider tool.',
    intro: [
      'TweakCN nails visual shadcn theming. People look for an alternative when they need more than colour and radius, or a stack other than shadcn — both of which are UIcockpit’s home turf.',
      'You still get a drop-in shadcn export; you just also get type, density, motion, recipes, eight formats and a returnable hosted kit.',
    ],
    points: [
      { h: 'Beyond colour + radius', p: 'A full system — type scale, density, motion, elevation, chart palette and component recipes.' },
      NEUTRAL_POINT,
      TRANSPORT_POINT,
    ],
    faq: [
      { q: 'Can it still theme shadcn?', a: 'Yes — the shadcn globals.css export is built in, alongside framework-neutral tokens.' },
      { q: 'Why pick the broader tool?', a: 'If your UI might ever leave shadcn, framework-neutral tokens travel; a shadcn-only theme does not.' },
    ],
    related: ['/compare/tweakcn', '/compare/shadcn', '/uses/shadcn-theme-generator'],
  },
  {
    kind: 'alt',
    slug: 'material-ui',
    navLabel: 'Material UI alternative',
    title: 'A Material UI alternative for your own brand — UIcockpit',
    metaDescription:
      'A Material UI alternative when you want your own look, on any stack: UIcockpit emits framework-neutral, zero-runtime design tokens — no Material Design aesthetic, no React lock-in.',
    eyebrow: 'Alternative',
    h1: 'A Material UI alternative for your own brand',
    sub: 'Material UI is Material Design, in React. If you want a different look or a different stack — without a runtime component library — UIcockpit emits your brand as neutral tokens.',
    intro: [
      'A common reason to seek a Material UI alternative is the aesthetic or the React-and-runtime commitment. UIcockpit sidesteps both: it is not a component library and it has no runtime.',
      'You author any visual style and export framework-neutral CSS variables that theme whatever components you already use.',
    ],
    points: [
      { h: 'Any look, not Material', p: 'Design your own language instead of adopting Material Design.' },
      { h: 'Zero runtime, any framework', p: 'Just CSS custom properties — React, Vue, Svelte or plain HTML.' },
      NOLOCKIN_POINT,
    ],
    faq: [
      { q: 'Is it a full component library like MUI?', a: 'No — it is the design-language layer. MUI ships a mature component set; UIcockpit themes the components you choose.' },
      { q: 'Can I keep React?', a: 'Yes, or any stack. The tokens are framework-neutral.' },
    ],
    related: ['/compare/material-ui', '/uses/framework-neutral-design-tokens', '/compare/tailwind-ui'],
  },

  /* ══════════════ USE-CASE / KEYWORD ══════════════ */
  {
    kind: 'use',
    slug: 'design-tokens-for-tailwind',
    navLabel: 'Design tokens for Tailwind',
    title: 'Design tokens for Tailwind v4 — generate a @theme block — UIcockpit',
    metaDescription:
      'Generate design tokens for Tailwind v4 visually. UIcockpit exports a ready @theme block — colours, radii, spacing, type and motion — so bg-primary, rounded-md and text-muted resolve to your brand.',
    eyebrow: 'Use case',
    h1: 'Design tokens for Tailwind v4',
    sub: 'Stop hand-writing a @theme block. Design your system visually and export a complete Tailwind v4 theme — every utility resolves to your brand.',
    intro: [
      'Tailwind v4 moved theming into CSS with the @theme directive. UIcockpit generates that block for you: pick colour, type, shape, density and motion in a live preview, then copy a complete, on-grid @theme.',
      'Because the tokens are framework-neutral underneath, the same system also exports as plain tokens.css, JSON, a shadcn theme or an AI prompt — Tailwind is just one of the transports.',
    ],
    points: [
      { h: 'A real @theme, not a stub', p: 'Colours, radii, spacing, the full type scale, motion and breakpoints — mapped so bg-primary, rounded-md and text-muted just work.' },
      { h: 'Light + dark included', p: 'Both modes emit; add the dark class and every utility re-resolves. No duplicate config.' },
      TRANSPORT_POINT,
    ],
    faq: [
      { q: 'Does this work with Tailwind v4’s @theme?', a: 'Yes — the export is a drop-in @theme block for Tailwind v4. Older setups can use the plain tokens.css.' },
      { q: 'Are the tokens Tailwind-only?', a: 'No. They are framework-neutral CSS variables; the Tailwind @theme is one of eight export formats.' },
    ],
    related: ['/compare/tailwind-ui', '/uses/framework-neutral-design-tokens', '/compare/shadcn'],
  },
  {
    kind: 'use',
    slug: 'shadcn-theme-generator',
    navLabel: 'shadcn theme generator',
    title: 'shadcn theme generator — visual, free, no lock-in — UIcockpit',
    metaDescription:
      'A visual shadcn theme generator: design colour, radius, type and more in a live preview, then export a drop-in shadcn globals.css. Free, no account, framework-neutral tokens included.',
    eyebrow: 'Use case',
    h1: 'A visual shadcn theme generator',
    sub: 'Design your shadcn theme visually and export a drop-in globals.css with the full CSS-variable contract — then restyle an existing project without touching components.',
    intro: [
      'UIcockpit generates a shadcn-compatible globals.css: the --background, --primary, --radius and related variables, wired to a system you tuned in a live preview across real components.',
      'It goes further than colour and radius — type, density, motion and a chart palette come along — and because the core is framework-neutral, you are never locked to shadcn.',
    ],
    points: [
      { h: 'Drop-in globals.css', p: 'The exact shadcn CSS-variable contract, ready to paste — restyle an existing shadcn app with zero component edits.' },
      { h: 'More than a colour picker', p: 'Type scale, density, motion and elevation, all previewed on a full component gallery before you export.' },
      NOLOCKIN_POINT,
    ],
    faq: [
      { q: 'Will the theme break my shadcn components?', a: 'No — it maps to the standard shadcn variable names, so components inherit it cleanly.' },
      { q: 'Is it free?', a: 'Yes — no account, no paywall, and the static export is always available.' },
    ],
    related: ['/compare/shadcn', '/compare/tweakcn', '/alternatives/shadcn'],
  },
  {
    kind: 'use',
    slug: 'design-system-generator',
    navLabel: 'Design system generator',
    title: 'Design system generator — generate your own, don’t theme someone else’s — UIcockpit',
    metaDescription:
      'A design system generator, not another design system: turn 19 live controls into your own system — 100+ components, WCAG-audited, framework-neutral exports, and a verifier (uicockpit check) that keeps AI-generated code on it.',
    eyebrow: 'Use case',
    h1: 'A design system generator, not another design system',
    sub: 'A design system ships someone else’s taste, themed. A generator ships yours — dialed in live, exported anywhere, and enforced as you and your AI build.',
    intro: [
      'Design systems — shadcn, Material, Meta’s Astryx — hand you their components with theming on top: pick a preset, or hand-write a theme file. UIcockpit sits one level above: it GENERATES the system itself. Nineteen live controls (colour, type, shape, density, motion, elevation) re-render 100+ real components as you decide, so what you export is a system of your own, not a preset from a shelf.',
      'And because a generated system is machine-made, it stays machine-checkable: every kit ships a contract and a verifier, so the system you generated is the system your app keeps wearing — even when an AI writes the screens.',
    ],
    points: [
      { h: 'Generated, not picked', p: 'No fixed theme list. Every control combination is a valid, coherent system — guardrails keep the combinations from going ugly, a live WCAG audit (16 pairs) keeps them accessible.' },
      CHECK_POINT,
      NEUTRAL_POINT,
      TRANSPORT_POINT,
    ],
    faq: [
      { q: 'How is a generator different from a design system?', a: 'A design system is a fixed set of styled components you adopt (and theme). A generator produces the system itself from your decisions — the tokens, the component recipes, the docs and the contract all derive from your configuration.' },
      { q: 'Is this a competitor to shadcn or Astryx?', a: 'No — it feeds them. The output is framework-neutral tokens plus per-tool transports (Tailwind @theme, shadcn globals.css, plain CSS), so you can wear your generated system on top of the primitives you already use.' },
      { q: 'What keeps the generated system from drifting?', a: 'uicockpit check — a verifier that reads the kit’s machine-readable contract and fails the build (--strict) on raw hex, off-grid spacing or wrong tokens. It runs as a CLI and inside agents via MCP.' },
    ],
    related: ['/uses/ai-design-system', '/compare/shadcn', '/uses/framework-neutral-design-tokens'],
  },
  {
    kind: 'use',
    slug: 'ai-design-system',
    navLabel: 'AI design system',
    title: 'AI design system generator — tokens + an AI prompt that applies them — UIcockpit',
    metaDescription:
      'Generate a design system for AI coding tools. UIcockpit outputs framework-neutral tokens plus a behaviour-shaping AI prompt, so generated components match your brand, breakpoints and palette automatically.',
    eyebrow: 'Use case',
    h1: 'A design system your AI actually applies',
    sub: 'AI builders default to generic primitives. Give the model a design language it can apply in one shot — UIcockpit exports the tokens and the prompt that wields them.',
    intro: [
      'The reason AI-built apps look alike is that the model has no opinion to apply. UIcockpit fixes that: configure a system, then export a behaviour-shaping prompt that tells any AI tool which token, which variant and what sits next to what.',
      'Drop the prompt into your tool’s rules file (.cursorrules, CLAUDE.md, a system prompt) and every generation respects the tokens, breakpoints, z-index stack and chart palette — automatically.',
    ],
    points: [
      { h: 'Tokens + the prompt to apply them', p: 'Not just variables — a rules file that teaches the model how to use them consistently.' },
      CHECK_POINT,
      { h: 'Works with any AI tool', p: 'Framework-neutral output and a portable prompt fit any AI coding workflow — plus an MCP server so agents install the kit, read its design context and check conformance natively.' },
      TRANSPORT_POINT,
    ],
    faq: [
      { q: 'How does the AI prompt help?', a: 'It encodes the token contract and composition rules, so generated UI uses the right values instead of inventing new ones.' },
      { q: 'What actually stops the AI from drifting?', a: 'uicockpit check. It reads the same machine-readable contract and fails the build (--strict) on any off-token value — a raw hex, an off-scale radius, the wrong token. It runs as a CLI and an MCP server, so the agent verifies its own work.' },
      { q: 'Which AI tools does it support?', a: 'Any that read a rules file or system prompt — the export is plain, portable text. Claude Code, Cursor and Windsurf also get the native MCP server (install_kit · get_design_context · check_conformance).' },
    ],
    related: ['/compare/v0', '/alternatives/v0', '/uses/framework-neutral-design-tokens'],
  },
  {
    kind: 'use',
    slug: 'framework-neutral-design-tokens',
    navLabel: 'Framework-neutral tokens',
    title: 'Framework-neutral design tokens generator — UIcockpit',
    metaDescription:
      'Generate framework-neutral design tokens (W3C-format CSS variables) that drop into React, Vue, Svelte or plain HTML. Light + dark, no runtime, no lock-in — export to Tailwind, shadcn, JSON and more.',
    eyebrow: 'Use case',
    h1: 'Framework-neutral design tokens',
    sub: 'One set of tokens that works everywhere — React, Vue, Svelte, plain HTML. Plain CSS custom properties, light and dark, zero runtime, no lock-in.',
    intro: [
      'Most theming tools assume a stack. UIcockpit does not: its output is plain --k-* CSS custom properties plus a W3C Design Tokens JSON, so the same system drops into any framework.',
      'From that single source it also emits a Tailwind v4 @theme block, a shadcn globals.css, an AI prompt and a machine-readable contract — pick the transport your project needs.',
    ],
    points: [
      NEUTRAL_POINT,
      { h: 'Standards-based', p: 'A W3C Design Tokens JSON imports into Figma via Tokens Studio, so design and code read from one source.' },
      TRANSPORT_POINT,
    ],
    faq: [
      { q: 'What format are the tokens?', a: 'Plain CSS custom properties (--k-*) and W3C Design Tokens JSON, with light and dark values.' },
      { q: 'Do they work without a framework?', a: 'Yes — drop the CSS variables into plain HTML, or any framework. Nothing is required at runtime.' },
    ],
    related: ['/uses/design-tokens-for-tailwind', '/compare/material-ui', '/uses/ai-design-system'],
  },
]

export const findEntry = (path: string): SeoEntry | undefined =>
  SEO_ENTRIES.find((e) => pathFor(e) === path)

/** Footer hub groups — derived from the entries so links never drift. */
export const footerGroups = (): { heading: string; kind: SeoKind }[] => [
  { heading: 'Compare', kind: 'compare' },
  { heading: 'Alternatives', kind: 'alt' },
  { heading: 'Use cases', kind: 'use' },
]
