import { useEffect, useState } from 'react'
import { MktFooter } from './MktFooter'

interface DocsPageProps {
  onLaunch: () => void
  onHome: () => void
  navigate: (to: string) => void
}

/** Section registry — drives BOTH the sticky TOC and the scroll-spy observer,
 *  so the list of links can never drift from the headings on the page. */
const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'quickstart', label: 'Quick start' },
  { id: 'exports', label: 'The exports' },
  { id: 'livekit', label: 'Live kit (CDN)' },
  { id: 'adoption', label: 'Agent adoption' },
  { id: 'tokens', label: 'Token model' },
  { id: 'composition', label: 'Composition rules' },
  { id: 'sizing', label: 'Sizing & decision tree' },
  { id: 'icons-fonts', label: 'Icons & fonts' },
  { id: 'dos-donts', label: "Do's & don'ts" },
  { id: 'designers', label: 'For designers' },
] as const

/**
 * Documentation page at /docs — "how to use the system". A third route next to
 * `/` (marketing) and `/app` (configurator). Evergreen + framework-neutral: it
 * explains the SYSTEM, not one generated kit, so nothing here depends on a
 * config. The left TOC is sticky and scroll-spies the active section.
 */
export function DocsPage({ onLaunch, onHome, navigate }: DocsPageProps) {
  const [active, setActive] = useState<string>(SECTIONS[0].id)

  // Scroll-spy: highlight the TOC entry whose section is near the top of the
  // viewport. rootMargin pulls the "active band" up so a heading lights up as
  // it reaches the top, not the middle.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id)
        }
      },
      { rootMargin: '-72px 0px -65% 0px', threshold: 0 },
    )
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    }
    return () => obs.disconnect()
  }, [])

  const jump = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      history.replaceState(null, '', `#${id}`)
      setActive(id)
    }
  }

  return (
    <div className="mkt">
      {/* Nav — same shell as the landing page for visual continuity. */}
      <header className="mkt__nav">
        <div className="mkt__container mkt__nav-inner">
          <a href="/" className="mkt__brand" onClick={(e) => { e.preventDefault(); onHome() }}>
            <img src="/logo.svg" alt="" width={28} height={28} className="mkt__brand-logo" />
            UIcockpit
          </a>
          <nav className="mkt__nav-links">
            <a href="/" className="mkt__nav-link" onClick={(e) => { e.preventDefault(); onHome() }}>Home</a>
            <a href="/docs" className="mkt__nav-link mkt__nav-link--active" onClick={(e) => e.preventDefault()}>Docs</a>
          </nav>
          <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={onLaunch}>
            Build my UI kit
          </button>
        </div>
      </header>

      <div className="docs">
        {/* Sticky table of contents */}
        <aside className="docs__toc" aria-label="On this page">
          <div className="docs__toc-head">On this page</div>
          <nav>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`docs__toc-link${active === s.id ? ' is-active' : ''}`}
                onClick={(e) => jump(e, s.id)}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Body */}
        <main className="docs__body">
          <div className="docs__lede">
            <h1>How to use UIcockpit</h1>
            <p>
              UIcockpit turns a handful of design decisions into a coherent,
              framework-neutral design system — the <strong>opinion layer above
              generic primitives</strong>, so your app doesn't look generic.
              You can apply the output two ways: <strong>paste the files</strong> into
              your project, or <strong>link a hosted kit</strong> you return to and
              keep tweaking (see <a href="#livekit" className="docs__link" onClick={(e) => jump(e, 'livekit')}>Live kit</a>).
              This page explains how the system is built and how to apply it — the
              configurator itself lives at{' '}
              <a href="/app" className="docs__link" onClick={(e) => { e.preventDefault(); onLaunch() }}>/app</a>.
            </p>
          </div>

          <section id="overview">
            <h2>Overview</h2>
            <p>
              You make decisions in one panel — a <strong>Style</strong> (form &amp;
              shape), a <strong>Color theme</strong> (brand hue), typography,
              density, motion. UIcockpit derives ~120 design tokens from those
              choices and renders them live across a full component gallery and
              a working super-app, so you can see every change before you ship it.
            </p>
            <p>
              The mental model that matters most: <strong>tokens guarantee that
              values are consistent, not that you combined them well.</strong> A
              token system makes sure there is one red, one radius scale, one
              spacing unit. It can't stop you from putting a small button next to
              a large input — that's a <em>composition</em> decision. UIcockpit
              addresses both layers: tokens for values, and a set of recipes +
              rules (see <a href="#composition" className="docs__link" onClick={(e) => jump(e, 'composition')}>Composition rules</a>)
              for how they sit together.
            </p>
          </section>

          <section id="quickstart">
            <h2>Quick start</h2>
            <ol className="docs__steps">
              <li>
                <strong>Configure.</strong> Open <a href="/app" className="docs__link" onClick={(e) => { e.preventDefault(); onLaunch() }}>the
                app</a>, pick a Style and Color theme, then tweak radius, density,
                motion and type until the live preview feels right. Your whole
                config lives in the URL hash — copy the link to save or share it.
              </li>
              <li>
                <strong>Export.</strong> Hit <em>Export</em> and choose the format
                that matches your stack (see below). Copy it, or download the file.
              </li>
              <li>
                <strong>Paste, link, or prompt.</strong> Drop the tokens into your
                global CSS, add the hosted <a href="#livekit" className="docs__link" onClick={(e) => jump(e, 'livekit')}>Live-kit <code>&lt;link&gt;</code></a>,
                or hand the AI prompt to your AI coding tool. Reference the
                <code>--k-*</code> tokens in every component — never hardcode a value —
                and the whole UI inherits the brand, density and dark mode
                automatically.
              </li>
            </ol>
          </section>

          <section id="exports">
            <h2>The exports</h2>
            <p>
              Every export is self-contained — it ships the full token set, the
              relevant config, and install info for your chosen icon library. Pick
              one:
            </p>
            <dl className="docs__deflist">
              <dt><code>tokens.css</code></dt>
              <dd>
                The source of truth. CSS custom properties under the
                <code>--k-*</code> namespace, with light + dark values and a
                per-component <em>recipe</em> block (button, input, dialog, tabs,
                badge… with full hover/focus/disabled state contracts). Drop into
                your <code>globals.css</code> and you're done.
              </dd>
              <dt><code>tokens.json</code></dt>
              <dd>
                The same tokens in the W3C Design Tokens format — for tooling,
                Style Dictionary pipelines, or Figma (see{' '}
                <a href="#designers" className="docs__link" onClick={(e) => jump(e, 'designers')}>For designers</a>).
              </dd>
              <dt>Tailwind v4</dt>
              <dd>
                A <code>@theme</code> block mapping every token to a Tailwind
                variable, so <code>bg-primary</code>, <code>rounded-md</code>,
                <code>text-muted</code> etc. resolve to your system.
              </dd>
              <dt>shadcn/ui</dt>
              <dd>
                A drop-in <code>globals.css</code> with the shadcn CSS-variable
                contract (<code>--background</code>, <code>--primary</code>,
                <code>--radius</code>…) wired to your tokens — restyle an existing
                shadcn project without touching components.
              </dd>
              <dt><code>BRIEF.md</code></dt>
              <dd>
                A human- and AI-readable spec of the whole system: the decisions,
                the rules, the WCAG audit, the component decision tree. Hand it to
                an engineer or an AI tool as the single source of intent.
              </dd>
              <dt>AI prompt</dt>
              <dd>
                The behaviour-shaping export. Paste it into your AI tool's rules
                file (<code>.cursorrules</code>, <code>CLAUDE.md</code>, a system
                prompt) — it tells the AI <em>how</em> to use the system (which
                token, which variant, what sits next to what), so every generation
                stays on-system.
              </dd>
            </dl>
          </section>

          <section id="livekit">
            <h2>Live kit (CDN) <span className="docs__tag">Live now</span></h2>
            <p>
              Besides downloading files, you can host your kit behind a single
              <code>&lt;link&gt;</code> — the <em>same artefact</em> the exports
              produce, served from a CDN. Drop it in your <code>&lt;head&gt;</code>
              and the tokens <strong>and</strong> the component recipes load with no
              build step, so your buttons just work.
            </p>
            <pre className="docs__code"><code>{`<link rel="stylesheet" href="https://kit.uicockpit.com/<id>.css">`}</code></pre>
            <ul className="docs__list">
              <li>
                <strong>One link, the whole kit.</strong> The hosted CSS carries the
                full <code>--k-*</code> token set <em>and</em> the per-component
                recipes — a true drop-in, not just variables.
              </li>
              <li>
                <strong>Two link kinds — pick on purpose.</strong> A{' '}
                <strong>Dev</strong> link (<code>/kit/&lt;id&gt;.css</code>) always
                serves the latest: return to UIcockpit, tweak, and every app on that
                link restyles. A <strong>Production</strong> link
                (<code>/kit/&lt;id&gt;/v&lt;n&gt;.css</code>) is a pinned, immutable
                snapshot, so a later change can't surprise prod — you bump the version
                deliberately.
              </li>
              <li>
                <strong>No accounts, no lock-in.</strong> Ownership is a private edit
                link (a per-kit secret), not a login. The static download is always
                available — eject to files in one click, byte-identical to the hosted
                CSS.
              </li>
            </ul>
            <p>
              Same source, your choice of transport: <strong>paste the files</strong>,
              {' '}<strong>link the hosted kit</strong>, or <strong>hand the AI prompt</strong>
              {' '}to your agent — all three derive from one config, so they can never
              disagree.
            </p>
          </section>

          <section id="adoption">
            <h2>Agent adoption <span className="docs__tag">CLI · MCP</span></h2>
            <p>
              The deepest integration isn't a paste — it's handing the kit to the
              coding agent you already have open, and letting it <strong>apply</strong>
              {' '}the system and <strong>keep it consistent</strong>. One command pulls
              the kit into any repo:
            </p>
            <pre className="docs__code"><code>{`npx uicockpit init <kit-hash>
npx uicockpit check        # catch any drift from the contract`}</code></pre>
            <p><code>init</code> writes five files — the kit, plus everything your agent reads:</p>
            <ul className="docs__list">
              <li><strong><code>uicockpit.tokens.css</code></strong> — the full kit (tokens <em>and</em> recipes); import it once at your app root.</li>
              <li><strong><code>uicockpit.contract.json</code></strong> — the machine-checkable contract <code>check</code> verifies your code against.</li>
              <li><strong><code>AGENTS.md</code></strong> — the rules, in the file your coding agent picks up automatically.</li>
              <li><strong><code>design.md</code></strong> — the full human spec + recipe catalog.</li>
              <li><strong><code>uicockpit.json</code></strong> — your adoption settings (below). Local + hand-editable; <code>init</code> never clobbers it.</li>
            </ul>
            <p>
              <strong><code>check</code> is the moat.</strong> It reads the contract and
              your code and reports where the two drift — unknown tokens, undefined
              modifiers, raw colours, off-grid spacing, and a hand-rebuilt composition
              utility (a silent second version of <code>.eyebrow</code> or
              <code>.metric</code>). With a CI exit code, so <em>generate → apply → check</em>
              {' '}is a loop, not a hope.
            </p>

            <h3>The <code>uicockpit.json</code> config</h3>
            <p>
              The adoption file (the shadcn <code>components.json</code> model): how the
              kit settles into <em>your</em> codebase, especially a brownfield one.
              {' '}<code>check</code> reads it; <code>init</code> applies the rest.
            </p>
            <pre className="docs__code"><code>{`{
  "prefix": "",
  "tokenStrategy": "css-vars",
  "darkStrategy": "class",
  "framework": "react",
  "aliasMap": { "--k-primary": "--brand-500" },
  "allowColors": ["#1da1f2"]
}`}</code></pre>
            <ul className="docs__list">
              <li>
                <strong><code>aliasMap</code> — adopt your existing palette.</strong>
                {' '}Map a kit token onto a value you already have. On
                {' '}<code>init</code> the kit picks up your brand without touching the
                kit CSS — a <code>--</code> value is wrapped in <code>var()</code>, a
                literal is used as-is. Append-only, so it's safe and reversible.
              </li>
              <li>
                <strong><code>allowColors</code> — a sanctioned escape hatch.</strong>
                {' '}A foreign brand colour (a partner logo) you <em>do</em> want to
                hardcode. List it here, or tag a single line
                {' '}<code>/* uicockpit-allow-color */</code>, and <code>check</code>
                {' '}stops flagging it — without muting the rule everywhere.
              </li>
              <li>
                <strong><code>prefix</code> · <code>tokenStrategy</code> ·
                {' '}<code>darkStrategy</code> · <code>framework</code>.</strong>
                {' '}Class-collision prefix, the export shape (CSS vars / Tailwind
                <code>@theme</code> / shadcn globals), how dark is toggled, and the
                framework your agent writes. Set once; <code>init</code> honours them.
              </li>
            </ul>
          </section>

          <section id="tokens">
            <h2>Token model</h2>
            <p>
              Everything derives from one function — your config in, tokens out.
              The exports are just transforms of that single source, so they can
              never disagree.
            </p>
            <ul className="docs__list">
              <li>
                <strong>Namespace.</strong> Preview/app tokens are
                <code>--k-*</code>. Colors, radii, spacing, type, motion, shadows,
                z-index, breakpoints and a 6-colour chart/decorative palette all
                live here.
              </li>
              <li>
                <strong>Light &amp; dark.</strong> Both are emitted. Add the class
                <code>.dark</code> to a parent and every token re-resolves — no
                duplicate component code.
              </li>
              <li>
                <strong>Orthogonal axes.</strong> Style (form), Color theme (hue)
                and Typography are independent — mix any combination freely.
                Density is its own global macro knob.
              </li>
              <li>
                <strong>Never hardcode.</strong> Reference a token for every
                colour, radius, space, shadow and transition. The one place this
                bends: a few always-round and always-thin elements (see the round
                rule below) that intentionally ignore the global radius.
              </li>
            </ul>
          </section>

          <section id="composition">
            <h2>Composition rules</h2>
            <p>
              These are the rules tokens can't enforce on their own — the layer
              that decides <em>what sits next to what</em>. They're also baked into
              the BRIEF and AI-prompt exports, so AI tools follow them too.
            </p>
            <ul className="docs__list">
              <li>
                <strong>A toolbar is one control height.</strong> Any horizontal
                row of controls (search, filters, selects, action buttons) should
                share a single height. Use the <code>.toolbar</code> recipe — it
                forces every direct <code>.btn</code> / <code>.in</code> /
                <code>.select</code> child onto one height
                (<code>--k-control-h-md</code>, or <code>--k-control-h-sm</code>
                via <code>.toolbar--sm</code>), so you can't accidentally mix a
                small button with a default input. Push trailing actions right with
                <code>.toolbar__spacer</code>.
              </li>
              <li>
                <strong>Same-size controls pair by token.</strong>
                <code>--k-control-h-md</code> <em>is</em> the default button height
                and the default input height — so a plain button next to a plain
                input already lines up. Never set an ad-hoc <code>height</code> on
                a control; use the scale.
              </li>
              <li>
                <strong>One primary per action group.</strong> A button cluster has
                at most one filled <code>--k-primary</code> button — the
                affirmative or destination action. Everything else is ghost or
                secondary. Two primaries side by side means the hierarchy is
                undecided.
              </li>
              <li>
                <strong>Group, then separate.</strong> A toolbar has TWO gap
                levels. Unrelated items/groups sit a comfortable{' '}
                <code>--k-space</code> apart (the toolbar's own gap). Related
                controls — a filter pair, a label+select — go in a{' '}
                <code>.toolbar__group</code>, which clusters them tight (8px) so
                the eye reads them as one unit. One flat gap can't say what
                belongs together; grouping can. Default reading order:
                context/filters left, primary actions right (push them apart with{' '}
                <code>.toolbar__spacer</code>).
              </li>
              <li>
                <strong>Use the real element.</strong> A button is a{' '}
                <code>&lt;button&gt;</code> (keyboard + screen-reader for free), a
                link is an <code>&lt;a&gt;</code>, never a clickable{' '}
                <code>&lt;div&gt;</code>. Inputs carry their semantic type —{' '}
                <code>type="search"</code>, <code>type="email"</code>,{' '}
                <code>inputmode="numeric"</code> — so keyboards, autofill and
                assistive tech behave. Every control has an accessible name (a{' '}
                <code>&lt;label&gt;</code> or <code>aria-label</code>); icon-only
                buttons especially.
              </li>
              <li>
                <strong>Three radius families.</strong> Corners are governed by
                <em>what kind</em> of control it is, not by one global dial:
                {' '}<strong>(1) Solid buttons</strong> (primary/secondary/danger)
                follow <code>--k-radius-button</code>. By default that{' '}
                <em>matches</em> the box radius (so buttons line up with cards &amp;
                inputs); set it to pill/square only for a deliberate divergence
                (Airbnb pill CTAs). <strong>(2) Fields &amp; quiet controls</strong>
                {' '}— inputs, selects, segmented controls and <em>ghost buttons</em>
                {' '}(toolbar filters, dropdown triggers) <em>plus text badges &amp;
                tags</em> (status "Healthy", "POPULAR" — they're chips, not pills) —
                all follow the box radius, so the "Button radius" dial never
                reshapes them. <strong>(3) Always-pill</strong> (numeric count-chips,
                status dots, toggles, sliders, progress, avatars) is fixed at 999px.
                For a real button pair (Cancel next to Save), use{' '}
                <code>.btn--secondary</code> rather than a ghost button so both
                share the button radius.
              </li>
              <li>
                <strong>The round-element rule.</strong> The only round controls are
                avatars and icon-only square buttons (<code>.btn--icon</code> /
                <code>.btn--circle</code>), plus the always-pill set (numeric
                count-chips, status dots, toggles, sliders, progress). Text
                badges/tags are NOT in that set — they follow the radius scale like
                everything else. <code>Borders: none</code> removes <em>borders</em>,
                not <em>rounding</em> — a still-round control in a square theme is
                one of these by-design exceptions, not a bug.
              </li>
            </ul>
            <pre className="docs__code"><code>{`<div class="toolbar">
  <label class="in in--inline">…search…</label>
  <button class="btn btn--ghost">Filter</button>
  <span class="toolbar__spacer"></span>
  <select class="select">…</select>
  <button class="btn btn--primary">New</button>
</div>
<!-- every control lines up at one height, automatically -->`}</code></pre>
          </section>

          <section id="sizing">
            <h2>Sizing &amp; decision tree</h2>
            <p>
              Most components ship in three sizes — <code>--sm</code> / default /
              <code>--lg</code>. The rule is <strong>size follows row context, not
              taste</strong>:
            </p>
            <ul className="docs__list">
              <li><strong>Dense</strong> (cards, table cells, toolbars) → <code>--sm</code>.</li>
              <li><strong>Default</strong> (forms, modals, page CTAs) → no modifier. Pick this when in doubt.</li>
              <li><strong>Destination</strong> (marketing CTAs, mobile primary, settings heroes) → <code>--lg</code>.</li>
            </ul>
            <p>
              List-style rows have their own grammar: <code>--k-row-h-sm</code>
              (28px, dropdown/table rows), <code>--k-row-h-md</code> (32px, command
              palette/search), <code>--k-row-h-lg</code> (40px, sidebar nav /
              settings). That's separate from form-control heights — mixing the two
              is exactly what makes toolbars misalign, which is why the
              <code>.toolbar</code> recipe exists.
            </p>
          </section>

          <section id="icons-fonts">
            <h2>Icons &amp; fonts</h2>
            <p>
              UIcockpit is icon-library-agnostic — pick one of five supported sets
              (Lucide, Iconoir, Phosphor, Heroicons) and every export ships its
              exact install command and import example. <strong>Don't mix
              libraries</strong>; consistency of stroke and corner is part of the
              look.
            </p>
            <p>
              Fonts: a system stack, 16 curated Google fonts, or drag-and-drop your
              own <code>.woff2</code> (kept in your session). The display and body
              roles are independent so you can pair a characterful headline with a
              neutral body — the full type scale (display → h5 → body → caption →
              eyebrow) derives from one modular ratio.
            </p>
          </section>

          <section id="dos-donts">
            <h2>Do's &amp; don'ts</h2>
            <div className="docs__cols">
              <div className="docs__col docs__col--do">
                <h3>Do</h3>
                <ul className="docs__list">
                  <li>Reference <code>--k-*</code> tokens for every value.</li>
                  <li>Use <code>.toolbar</code> for any mixed row of controls.</li>
                  <li>Keep one filled primary per action group.</li>
                  <li>Use <code>--k-radius-button</code> on buttons (independent of card radius).</li>
                  <li>Respect <code>prefers-reduced-motion</code> — the tokens already cut animation to ~instant.</li>
                  <li>Use system colours (<code>success/warning/danger/info</code>) for status only.</li>
                </ul>
              </div>
              <div className="docs__col docs__col--dont">
                <h3>Don't</h3>
                <ul className="docs__list">
                  <li>Hardcode a hex, radius, spacing or shadow.</li>
                  <li>Mix a <code>--sm</code> control with a default one in the same bar.</li>
                  <li>Put gradients on buttons — text contrast varies along the fade.</li>
                  <li>Scale chart bars / sliders / toggles with the global radius.</li>
                  <li>Use the primary colour for body text — use a <code>-soft</code> tint.</li>
                  <li>Mix icon libraries.</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="designers">
            <h2>For designers</h2>
            <p>
              The <code>tokens.json</code> export follows the W3C Design Tokens
              Community Group format. Import it into Figma via the <strong>Tokens
              Studio for Figma</strong> plugin — every token becomes a Figma
              variable with the same name and the same light/dark resolution, so
              design and code read from one source.
            </p>
            <div className="docs__cta">
              <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={onLaunch}>
                Build my UI kit →
              </button>
            </div>
          </section>
        </main>
      </div>

      <MktFooter navigate={navigate} />
    </div>
  )
}
