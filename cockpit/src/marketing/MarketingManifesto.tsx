import { useEffect } from 'react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'

interface MarketingManifestoProps {
  onLaunch: () => void
  onDocs: () => void
  navigate: (to: string) => void
}

/**
 * /manifesto — the human, first-person "why we're building this" page.
 * Marketing-voice long-form (not the crisp product thesis in VISION.md). Reuses
 * the `.mkt` chrome (nav + mega-footer) and renders the manifesto as a centered
 * article column (`.mkt__manifesto` in marketing.css). Canonical prose source =
 * repo-root MANIFESTO.md — keep the two in sync when the words change.
 */
export function MarketingManifesto({ onLaunch, onDocs, navigate }: MarketingManifestoProps) {
  // Per-route document head so the page is independently shareable/indexable.
  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Manifesto — UIcockpit'
    return () => {
      document.title = prevTitle
    }
  }, [])

  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="manifesto" />

      <article className="mkt__manifesto">
        <div className="mkt__eyebrow">
          <span className="mkt__eyebrow-dot" />
          The manifesto
        </div>
        <h1>Why I'm building UIcockpit</h1>
        <p className="mkt__manifesto-byline">by Alexander Kaan</p>

        <p>A friend of mine described his last project in a single sentence:</p>
        <blockquote className="mkt__manifesto-quote">
          "You can vibecode a working app with an LLM in an afternoon. And then you spend days
          tweaking the little things — nudge a colour, make a button a bit bigger, swap the
          dropdown for another one. Again, and again."
        </blockquote>
        <p>
          I laughed, because I've been stuck in that exact loop for years — long before an
          AI was the one building the app. I did it by hand.
        </p>

        <p className="mkt__manifesto-lead">I kept building the same button.</p>

        <p>
          Never quite the same one — a little more padding here, a border that didn't match
          there, a "selected" state that looked different on the third tab than the first.
          Twenty screens in, the app quietly stopped feeling like one product. Nothing was
          broken. It had just drifted.
        </p>
        <p>
          Design systems, tokens and component libraries all help — I use them. But none of
          them fix that, because the drift lives <em>between</em> the pieces they hand you. A
          token says <code>--primary</code> is blue. A component gives you a finished{' '}
          <code>Button</code>. Neither tells you what to do the moment you need something
          nobody designed yet — and you <em>always</em> need something nobody designed yet.
        </p>

        <h2>So here's the idea</h2>
        <p className="mkt__manifesto-lead">
          You design your UI once — turn every knob until it's yours — and then keep it that way.
        </p>
        <p>
          Concretely: you tune colour, type, shape, spacing and motion in a small visual
          configurator — a full component gallery updates as you go — until it looks right,
          about a minute, no account. Then you export it as a framework-neutral kit (tokens +
          component recipes) and drop it into any stack. And it isn't a one-time download: host
          it behind a link, come back to re-tune it later, and every app on that link restyles —
          so your system stays up to date instead of going stale in a folder.
        </p>
        <p>
          Because it's a real, machine-readable contract, it also <em>holds</em>. Your agent
          builds new screens from it instead of guessing, and <code>npx uicockpit check</code>{' '}
          flags anything that drifts off it — a hardcoded colour, an off-grid size, a one-off
          component. Whether the drift is an AI next session or you six months later, the whole
          thing stays coherent as it grows. Configure once; stay coherent everywhere.
        </p>

        <h2>Why it matters more now</h2>
        <p>
          For years the thing turning a design into a screen was a person — and a person
          smooths. Hit a gap in the system and you match the spacing by eye, borrow the shape
          from the component next door, keep the thread without being told. An agent doesn't.
          It builds what it can find and guesses the rest: fast, tireless, no eye. Give it
          forty components and it needs the forty-first, so it invents one — reasonable,
          plausible, and <em>just</em> off your design language. Every guess is a small drift,
          and now they pile up in an afternoon instead of over months.
        </p>

        <h2>A language, not a bigger catalog</h2>
        <p>
          You can't fix that by drawing more components — there are infinitely many screens
          someone might ask for, and you'll never draw them all. That's why the answer is a
          language to build <em>from</em>, not a catalog to pick <em>out of</em>. A fixed kit
          can, at best, be <em>complete</em>; a language is <em>generative</em> — it covers
          the endless tail of screens nobody drew.
        </p>
        <p>
          And the check is what makes it hold. Today <code>npx uicockpit check</code> catches
          the small sins — a hardcoded colour, an off-grid pixel. Where it's going is the part
          I care about most: verifying that even a component that has never existed before was
          built only from your design language — not "does this match the catalog," but "does
          this belong." A coherence guarantee for things nobody has designed yet. As far as I
          know, nobody hands you that.
        </p>

        <h2>What UIcockpit is <em>not</em></h2>
        <p>
          I want to be honest about the edges, because overpromising is how tools lose trust.
        </p>
        <p>
          UIcockpit is a <strong>look-and-structure</strong> system: colour, type, shape,
          spacing, composition. It is deliberately <em>not</em> your behaviour layer. Hover,
          focus, keyboard navigation, error handling, accessibility wiring — that lives in the
          component, done by you or your framework, and done properly. UIcockpit's job is to
          tell the agent exactly what it must wire and then get out of the way. That boundary
          isn't a missing feature. It's the line that keeps the grammar a single,
          human-authored source of truth — something agents <em>compile from</em> and never
          quietly turn into something else.
        </p>
        <p>
          And to be clear about the neighbours: this isn't a competitor to shadcn or the
          component libraries I love and use. They give you the components; we give you the
          design language those components wear. We sit a layer above, and we're happy there.
          In a word: those are design systems — UIcockpit is a design system{' '}
          <em>generator</em>. A design system ships someone else&apos;s taste, beautifully
          themed; a generator is the machine that makes yours, and then keeps it honest.
        </p>

        <h2>This is ours, not mine</h2>
        <p>
          The honest version: I started this because I kept wishing it existed. But a design
          grammar is not the kind of thing one person finishes in a garage. A grammar is only
          as good as the range of things people throw at it — every screen someone builds that{' '}
          <em>doesn't</em> quite fit is a gift, because it shows exactly where the grammar is
          still too thin. I can't generate that range alone. Nobody can. So this is built in
          the open, on purpose, from the start.
        </p>
        <p>Here's the deal, plainly:</p>
        <ul className="mkt__manifesto-list">
          <li>
            <strong>It's free to use.</strong> Configure your design language, export the pack,
            run the check — no paywall on the core. If you're building something with it, it's
            yours.
          </li>
          <li>
            <strong>Contributions are the point, not a favour.</strong> A missing component, a
            role that should exist, a check that's too strict or too loose, a rough edge in the
            docs — open an issue, send a PR, or just tell me it's wrong. The gaps you hit are
            the roadmap.
          </li>
          <li>
            <strong>We decide the hard parts together.</strong> How many roles the language
            needs, where the boundary between "us" and "your framework" should sit, what
            "coherent" even means in the edge cases — these are real open questions, and I'd
            rather argue them in public with the people using it than settle them alone and be
            quietly wrong.
          </li>
        </ul>
        <p>
          Some of what's above is shipped and working today, and some of it is the direction
          we're rowing toward — out loud, so you can row too. The world is moving from{' '}
          <em>people who smooth</em> to <em>agents that don't</em>, and that shift needs a
          layer that keeps the result coherent without a human eyeballing every gap. I don't
          think any one person should own the answer to that. I think it should be a grammar,
          plus a guarantee, plus a community that keeps both honest.
        </p>
        <p>
          That's UIcockpit. If this itches for you the way it itched for me — grab it, use it,
          break it, and help build the rest. Let's do it together.
        </p>
        <p className="mkt__manifesto-sign">— Alexander</p>

        <div className="mkt__manifesto-ctas">
          <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={onLaunch}>
            Build my UI kit →
          </button>
          <a href="/docs" className="mkt-btn mkt-btn--ghost mkt-btn--lg" onClick={(e) => { e.preventDefault(); onDocs() }}>
            Read the docs
          </a>
        </div>
      </article>

      <MktFooter navigate={navigate} />
    </div>
  )
}
