import { Sparkles, Palette, Type, FileCode2, Zap, ShieldCheck, BarChart3, Layers3, Smartphone, Link2, RefreshCw, Lock, Braces, MousePointerClick, Accessibility, Check } from 'lucide-react'
import { useEffect, useRef, type CSSProperties } from 'react'
import { ComponentBouquet } from './ComponentBouquet'
import { MktFooter } from './MktFooter'
import { MktStats } from './MktStats'
// Note: feature icons stay Lucide (decorative). The brand mark uses the
// actual /logo.svg so the nav matches the panel inside /app exactly.

interface MarketingPageProps {
  onLaunch: () => void
  onDocs: () => void
  navigate: (to: string) => void
}

/**
 * Interactive dot grid behind the hero text. Two stacked layers:
 *   1. Base dots — faint grey, always visible across the whole hero
 *   2. Spotlight dots — Apple-blue, masked to a radius around the cursor
 *
 * The mousemove handler updates two CSS custom properties (`--mx`, `--my`)
 * on the grid element, and the CSS mask uses those to draw the spotlight.
 * Writing styles directly (not via React state) keeps the paint on the
 * compositor thread — no re-renders per frame. rAF throttles the writes
 * to one per paint, even when the OS fires mousemove faster.
 */
function HeroDotGrid() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    let pendingX = 0
    let pendingY = 0
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      pendingX = e.clientX - rect.left
      pendingY = e.clientY - rect.top
      if (raf) return
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${pendingX}px`)
        el.style.setProperty('--my', `${pendingY}px`)
        raf = 0
      })
    }
    const onLeave = () => {
      // Park the spotlight off-screen so it fades out cleanly.
      el.style.setProperty('--mx', '-9999px')
      el.style.setProperty('--my', '-9999px')
    }
    // Listen on the parent (the hero) so the spotlight tracks cursor even
    // when it's over the text content — the grid itself is pointer-events: none.
    const parent = el.parentElement
    parent?.addEventListener('mousemove', onMove)
    parent?.addEventListener('mouseleave', onLeave)
    return () => {
      parent?.removeEventListener('mousemove', onMove)
      parent?.removeEventListener('mouseleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return <div ref={ref} className="mkt__hero-grid" aria-hidden="true" />
}

/**
 * Marketing landing page at /. System font + Apple blue accent.
 * The "Build my UI kit" CTA hands off to the configurator at /app via
 * the onLaunch prop (parent-managed client-side routing — no React Router).
 */
export function MarketingPage({ onLaunch, onDocs, navigate }: MarketingPageProps) {
  return (
    <div className="mkt">
      <header className="mkt__nav">
        <div className="mkt__container mkt__nav-inner">
          <a href="/" className="mkt__brand" onClick={(e) => e.preventDefault()}>
            <img src="/logo.svg" alt="" width={28} height={28} className="mkt__brand-logo" />
            UIcockpit
          </a>
          <nav className="mkt__nav-links">
            <a href="#features" className="mkt__nav-link">Features</a>
            <a href="#anatomy" className="mkt__nav-link">Components</a>
            <a href="#livekit" className="mkt__nav-link">Live kit</a>
            <a href="#how" className="mkt__nav-link">How it works</a>
            <a href="/docs" className="mkt__nav-link" onClick={(e) => { e.preventDefault(); onDocs() }}>Docs</a>
            {/* GitHub link returns when the OSS launch pack ships — see task #86.
                Leaving a placeholder href would be a false promise to visitors. */}
          </nav>
          <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={onLaunch}>
            Build my UI kit
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mkt__hero">
        <HeroDotGrid />
        <div className="mkt__container">
          <div className="mkt__eyebrow">
            <span className="mkt__eyebrow-dot" />
            100% Free · Framework-neutral · No Lock-In
          </div>
          <h1>Stop shipping the generic AI look.</h1>
          <p className="mkt__hero-sub">
            Today's AI builders hand every app the same grey defaults. UIcockpit is the
            design language on top — colour, type, shape and motion as framework-neutral
            tokens, in one artefact your AI applies in a single shot. Build a kit in 60
            seconds; come back to tweak it any time.
          </p>
          <div className="mkt__hero-ctas">
            <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={onLaunch}>
              Build my UI kit →
            </button>
            <a href="#how" className="mkt-btn mkt-btn--ghost mkt-btn--lg">
              See how it works
            </a>
          </div>
        </div>

        {/* Hero showcase — the REAL <ComponentGallery/>, full-bleed and brand-blue,
            edges dissolved by a CSS mask. It IS the live component library (built by
            the token engine), so it can never drift from the actual components. */}
        <div className="mkt__showcase">
          <ComponentBouquet />
        </div>
      </section>

      {/* Stats strip */}
      <section className="mkt__container">
        <MktStats />
      </section>

      {/* Features */}
      <section className="mkt__section" id="features">
        <div className="mkt__container">
          <div className="mkt__section-head">
            <h2>The opinion layer on top.</h2>
            <p className="mkt__section-sub">
              Component kits ship neutral primitives. UIcockpit ships the opinion on top —
              and an export your AI reads, so every generation stays on-brand.
            </p>
          </div>
          <div className="mkt__features">
            <div className="mkt__feature">
              <span className="mkt__feature-icon"><Palette size={20} strokeWidth={1.75} /></span>
              <h3>Coherent, not generic</h3>
              <p>
                Every decision — colour, type, radius, density, motion — resolves into one
                opinionated system. Pick a Style and a brand colour; the engine derives a
                kit that looks designed, not defaulted.
              </p>
            </div>
            <div className="mkt__feature">
              <span className="mkt__feature-icon"><FileCode2 size={20} strokeWidth={1.75} /></span>
              <h3>Component recipes included</h3>
              <p>
                Every export ships with per-component CSS — buttons, inputs, dialogs, tabs, badges
                with full hover/focus/disabled state contracts. Not just tokens, the real recipe
                so AI tools generate components that actually match your system.
              </p>
            </div>
            <div className="mkt__feature">
              <span className="mkt__feature-icon"><ShieldCheck size={20} strokeWidth={1.75} /></span>
              <h3>WCAG audit on every kit</h3>
              <p>
                16 contrast pairs tested against WCAG AA before you download — text on surfaces,
                buttons on fills, status colors on their tints. Pass count visible in the topbar.
                No more guessing whether your blue is accessible.
              </p>
            </div>
            <div className="mkt__feature">
              <span className="mkt__feature-icon"><Layers3 size={20} strokeWidth={1.75} /></span>
              <h3>Layout primitives, sorted</h3>
              <p>
                Z-index stack (dropdown, modal, toast, tooltip), Tailwind-aligned breakpoints,
                container widths — exported alongside your colors so layout questions have
                token answers, not gut feelings.
              </p>
            </div>
            <div className="mkt__feature">
              <span className="mkt__feature-icon"><BarChart3 size={20} strokeWidth={1.75} /></span>
              <h3>Charts that match the brand</h3>
              <p>
                A 6-color data-viz palette auto-derived from your primary, accent, and system
                colors. Drop into Recharts, Chart.js, Tremor — series colors that look like
                the rest of your app, not random rainbow defaults.
              </p>
            </div>
            <div className="mkt__feature">
              <span className="mkt__feature-icon"><Zap size={20} strokeWidth={1.75} /></span>
              <h3>Motion that feels premium</h3>
              <p>
                Spec-grade three-tier durations + direction-aware easings.
                Named animation shorthands. Respects <code>prefers-reduced-motion</code>.
                Choose Snappy, Smooth, or Playful — the whole system shifts together.
              </p>
            </div>
            <div className="mkt__feature">
              <span className="mkt__feature-icon"><Type size={20} strokeWidth={1.75} /></span>
              <h3>Type scale, properly</h3>
              <p>
                Display, h1–h5, body, small, caption, eyebrow — full hierarchy derived from
                one modular ratio. System fonts, 16 Google fonts, or drag-and-drop your own
                <code>.woff2</code>. Stays in your session.
              </p>
            </div>
            <div className="mkt__feature">
              <span className="mkt__feature-icon"><Smartphone size={20} strokeWidth={1.75} /></span>
              <h3>AI prompt, behavior-shaping</h3>
              <p>
                Paste one prompt into your AI tool's rules file (<code>.cursorrules</code>,
                <code>CLAUDE.md</code>, a system prompt) — and every generation respects the
                tokens, breakpoints, z-index stack, and chart palette automatically.
              </p>
            </div>
            <div className="mkt__feature">
              <span className="mkt__feature-icon"><Sparkles size={20} strokeWidth={1.75} /></span>
              <h3>A kit you come back to</h3>
              <p>
                No accounts. Your whole setup lives in the link — share it, or reopen it
                later to tweak and re-export. The kit is a place you return to, not a
                one-time download.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Anatomy — what every component is guaranteed to be built from */}
      <section className="mkt__section" id="anatomy">
        <div className="mkt__container">
          <div className="mkt__section-head">
            <div className="mkt__eyebrow">
              <span className="mkt__eyebrow-dot" />
              Built to a standard
            </div>
            <h2>Anatomy of a UIcockpit component.</h2>
            <p className="mkt__section-sub">
              Every component is built the same way — so a developer coming from shadcn or
              Tailwind can trust it on sight. Here's what's under the hood, and exactly what
              you can rely on.
            </p>
          </div>

          <div className="mkt__anatomy">
            {/* Left — exploded model: the layers that make up one component */}
            <figure className="mkt__exploded" aria-hidden="true">
              <div className="mkt__exploded-stack">
                <div className="mkt__layer" style={{ '--i': 0 } as CSSProperties}>
                  <span className="mkt__layer-ic"><Braces size={15} strokeWidth={2} /></span>
                  <span className="mkt__layer-body"><code>&lt;button class="btn"&gt;</code></span>
                  <span className="mkt__layer-tag">Semantic markup</span>
                </div>
                <div className="mkt__layer" style={{ '--i': 1 } as CSSProperties}>
                  <span className="mkt__layer-ic"><Palette size={15} strokeWidth={2} /></span>
                  <span className="mkt__layer-body">
                    <span className="mkt__layer-dots"><i /><i /><i /></span>
                    --k-primary · --k-radius
                  </span>
                  <span className="mkt__layer-tag">Design tokens</span>
                </div>
                <div className="mkt__layer" style={{ '--i': 2 } as CSSProperties}>
                  <span className="mkt__layer-ic"><MousePointerClick size={15} strokeWidth={2} /></span>
                  <span className="mkt__layer-body">hover · focus · active · disabled</span>
                  <span className="mkt__layer-tag">Interaction states</span>
                </div>
                <div className="mkt__layer" style={{ '--i': 3 } as CSSProperties}>
                  <span className="mkt__layer-ic"><Accessibility size={15} strokeWidth={2} /></span>
                  <span className="mkt__layer-body">role · aria · focus ring</span>
                  <span className="mkt__layer-tag">Accessibility</span>
                </div>
                <div className="mkt__layer mkt__layer--final" style={{ '--i': 4 } as CSSProperties}>
                  <button type="button" className="mkt__demo-btn" tabIndex={-1}>
                    <Check size={15} strokeWidth={2.4} /> Save changes
                  </button>
                  <span className="mkt__layer-tag mkt__layer-tag--final">Shipped component</span>
                </div>
              </div>
            </figure>

            {/* Right — the guarantee list */}
            <ul className="mkt__guarantees">
              <li><Check className="mkt__guarantee-tick" size={17} strokeWidth={2.4} /><div><strong>Real semantic HTML.</strong> Buttons, inputs, lists, links — keyboard-operable and screen-reader-named, never a clickable <code>&lt;div&gt;</code>.</div></li>
              <li><Check className="mkt__guarantee-tick" size={17} strokeWidth={2.4} /><div><strong>Every state, covered.</strong> hover · focus-visible · active · disabled · loading — on every interactive part, not just the happy path.</div></li>
              <li><Check className="mkt__guarantee-tick" size={17} strokeWidth={2.4} /><div><strong>ARIA done right.</strong> listbox, progressbar, tooltip, radiogroup, <code>aria-current</code> — the contracts assistive tech actually relies on.</div></li>
              <li><Check className="mkt__guarantee-tick" size={17} strokeWidth={2.4} /><div><strong>Visible focus rings, AA contrast.</strong> 2px rings on every control; 16 contrast pairs tested to WCAG AA before you download.</div></li>
              <li><Check className="mkt__guarantee-tick" size={17} strokeWidth={2.4} /><div><strong>100% token-driven.</strong> No hardcoded hex or px — restyle the entire kit by changing one config.</div></li>
              <li><Check className="mkt__guarantee-tick" size={17} strokeWidth={2.4} /><div><strong>Framework-neutral.</strong> Plain CSS recipes — drop into React, Vue, Svelte, or a static HTML page.</div></li>
              <li><Check className="mkt__guarantee-tick" size={17} strokeWidth={2.4} /><div><strong>Benchmarked vs shadcn, Radix &amp; Tailwind.</strong> Graded component-by-component — parity or better is the bar.</div></li>
            </ul>
          </div>

          <div className="mkt__anatomy-note">
            <ShieldCheck size={16} strokeWidth={1.9} />
            The same contract holds for all 80+ components — so the kit feels like one system, end to end.
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mkt__section mkt__section--alt" id="how">
        <div className="mkt__container">
          <div className="mkt__section-head">
            <h2>Three steps. No spreadsheet.</h2>
            <p className="mkt__section-sub">
              Cockpit replaces the "pick 60 hex codes by hand" phase with one panel of decisions.
            </p>
          </div>
          <div className="mkt__steps">
            <div className="mkt__step">
              <span className="mkt__step-num" aria-hidden />
              <h3>Pick a starting point</h3>
              <p>
                Choose a Style and a brand colour, or start from a single hex code and let
                the engine derive the rest of the system.
              </p>
            </div>
            <div className="mkt__step">
              <span className="mkt__step-num" aria-hidden />
              <h3>Tweak any decision live</h3>
              <p>
                Radius, density, motion, typography, fonts, button shape — every change re-renders
                a 40-card component gallery and a live dashboard preview.
              </p>
            </div>
            <div className="mkt__step">
              <span className="mkt__step-num" aria-hidden />
              <h3>Export, ship, return</h3>
              <p>
                Hand off to your engineers or any AI coding tool in eight framework-neutral
                formats. Come back any time to tweak the kit and re-export.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live kit (CDN) — the hosted, returnable, auto-updating link */}
      <section className="mkt__section mkt__section--alt" id="livekit">
        <div className="mkt__container">
          <div className="mkt__section-head">
            <div className="mkt__eyebrow">
              <span className="mkt__eyebrow-dot" />
              Live kit · CDN
            </div>
            <h2>Link it once. Keep tweaking.</h2>
            <p className="mkt__section-sub">
              Host your kit behind one <code>&lt;link&gt;</code>. Come back, change a colour
              or bump the type, and every app on the live link restyles — no re-export,
              no redeploy.
            </p>
          </div>

          <div className="mkt__kit">
            <div className="mkt__kit-head">
              <div className="mkt__kit-tabs">
                <span className="mkt__kit-tab mkt__kit-tab--on">Dev · live</span>
                <span className="mkt__kit-tab">Production · pinned</span>
              </div>
              <span className="mkt__kit-flag">Shipping with launch</span>
            </div>
            <pre className="mkt__kit-code"><code>{`<link rel="stylesheet"
      href="https://kit.uicockpit.com/a7f3c2.css">`}</code></pre>
            <div className="mkt__kit-foot">
              <RefreshCw size={15} strokeWidth={1.9} />
              Update your kit → every app on the Dev link updates along.
            </div>
          </div>

          <div className="mkt__kit-trio">
            <div className="mkt__kit-point">
              <span className="mkt__feature-icon"><Link2 size={18} strokeWidth={1.9} /></span>
              <h3>One link, whole kit</h3>
              <p>
                Tokens and component styles behind a single URL. Drop it in your
                <code>&lt;head&gt;</code> and your buttons just work — no build step.
              </p>
            </div>
            <div className="mkt__kit-point">
              <span className="mkt__feature-icon"><RefreshCw size={18} strokeWidth={1.9} /></span>
              <h3>Live or pinned</h3>
              <p>
                The Dev link auto-updates as you tweak. Pin a version for production so a
                later change can't surprise prod — you bump it deliberately.
              </p>
            </div>
            <div className="mkt__kit-point">
              <span className="mkt__feature-icon"><Lock size={18} strokeWidth={1.9} /></span>
              <h3>No accounts, no lock-in</h3>
              <p>
                Ownership is a private edit link, not a login. Don't want the CDN? Eject to
                static files in one click — same kit, byte for byte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mkt__final">
        <div className="mkt__container">
          <h2>Stop picking hex codes.<br />Start shipping kits.</h2>
          <p className="mkt__final-sub">
            Build a coherent, opinion-rich design system in under a minute — 100% free,
            no account.
          </p>
          <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={onLaunch}>
            Build my UI kit →
          </button>
        </div>
      </section>

      {/* Footer — shared mega-footer (SEO hub) */}
      <MktFooter navigate={navigate} />
    </div>
  )
}
