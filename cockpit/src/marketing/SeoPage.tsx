import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'
import { MktStats } from './MktStats'
import { findEntry, type SeoEntry } from './seo/seoData'

interface SeoPageProps {
  entry: SeoEntry
  navigate: (to: string) => void
}

const SITE = 'https://uicockpit.com'

/**
 * Renderer for every SEO landing page (comparison / alternative / use-case).
 * Pure presentation over a `SeoEntry` from `seoData.ts` — the route layer in
 * App.tsx looks up the entry by path and hands it here.
 *
 * SEO: sets a per-page <title> + meta description + canonical, and injects
 * FAQ structured data, so each route is independently indexable even though
 * this is a client-rendered SPA (crawlers that run JS pick it up; a build-time
 * prerender is a later optimisation).
 */
export function SeoPage({ entry, navigate }: SeoPageProps) {
  const go = (e: React.MouseEvent, to: string) => {
    e.preventDefault()
    navigate(to)
  }

  // Per-route document head: title, description, canonical, FAQ JSON-LD.
  useEffect(() => {
    const prevTitle = document.title
    document.title = entry.title

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector)
      if (!el) {
        el = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
        document.head.appendChild(el)
      }
      el.setAttribute(attr, value)
      return el
    }
    setMeta('meta[name="description"]', 'content', entry.metaDescription)
    const canonical = setMeta('link[rel="canonical"]', 'href', `${SITE}${location.pathname}`)
    canonical.setAttribute('rel', 'canonical')

    // FAQ structured data (rich-result eligible). Removed on unmount.
    let faqScript: HTMLScriptElement | null = null
    if (entry.faq?.length) {
      faqScript = document.createElement('script')
      faqScript.type = 'application/ld+json'
      faqScript.setAttribute('data-seo', 'faq')
      faqScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: entry.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      })
      document.head.appendChild(faqScript)
    }

    return () => {
      document.title = prevTitle
      faqScript?.remove()
    }
  }, [entry])

  return (
    <div className="mkt">
      {/* Nav — shared shell with the landing / manifesto pages. */}
      <MktNav navigate={navigate} />

      {/* Hero */}
      <section className="mkt__section seo__hero">
        <div className="mkt__container">
          <div className="mkt__eyebrow">
            <span className="mkt__eyebrow-dot" />
            {entry.eyebrow}
          </div>
          <h1 className="seo__h1">{entry.h1}</h1>
          <p className="seo__sub">{entry.sub}</p>
          <div className="seo__ctas">
            <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={() => navigate('/app')}>
              Build my UI kit →
            </button>
            <a href="/docs" className="mkt-btn mkt-btn--ghost mkt-btn--lg" onClick={(e) => go(e, '/docs')}>
              Read the docs
            </a>
          </div>
        </div>
      </section>

      {/* Intro */}
      {entry.intro?.length ? (
        <section className="mkt__section seo__prose">
          <div className="mkt__container">
            {entry.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      ) : null}

      {/* Trust strip — $0 + proof points, same as the landing page */}
      <section className="mkt__container">
        <MktStats />
      </section>

      {/* Comparison table */}
      {entry.compare ? (
        <section className="mkt__section mkt__section--alt">
          <div className="mkt__container">
            <div className="mkt__section-head">
              <h2>UIcockpit vs {entry.compare.themName}</h2>
              {entry.compare.caption ? (
                <p className="mkt__section-sub">{entry.compare.caption}</p>
              ) : null}
            </div>
            <div className="cmp">
              <div className="cmp__row cmp__row--head" role="row">
                <span className="cmp__feat" />
                <span className="cmp__col cmp__col--us">UIcockpit</span>
                <span className="cmp__col">{entry.compare.themName}</span>
              </div>
              {entry.compare.rows.map((r, i) => (
                <div className="cmp__row" role="row" key={i}>
                  <span className="cmp__feat">{r.feature}</span>
                  <span className={`cmp__col cmp__col--us${r.winner === 'us' ? ' is-win' : ''}`}>
                    {r.winner === 'us' ? <Check size={15} strokeWidth={2.5} className="cmp__chk" /> : null}
                    {r.us}
                  </span>
                  <span className={`cmp__col${r.winner === 'them' ? ' is-win' : ''}`}>{r.them}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Differentiator points */}
      {entry.points?.length ? (
        <section className="mkt__section">
          <div className="mkt__container">
            <div className="mkt__features seo__points">
              {entry.points.map((pt, i) => (
                <div className="mkt__feature" key={i}>
                  <h3>{pt.h}</h3>
                  <p>{pt.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      {entry.faq?.length ? (
        <section className="mkt__section mkt__section--alt">
          <div className="mkt__container">
            <div className="mkt__section-head">
              <h2>Frequently asked</h2>
            </div>
            <dl className="docs__deflist seo__faq">
              {entry.faq.map((f, i) => (
                <div key={i}>
                  <dt>{f.q}</dt>
                  <dd>{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      {/* Related cross-links */}
      {entry.related?.length ? (
        <section className="mkt__section seo__related">
          <div className="mkt__container">
            <div className="mkt__section-head">
              <h2>Keep comparing</h2>
            </div>
            <div className="seo__relgrid">
              {entry.related.map((to) => {
                const e = findEntry(to)
                if (!e) return null
                return (
                  <a key={to} href={to} className="seo__relcard" onClick={(ev) => go(ev, to)}>
                    <span className="seo__rel-eyebrow">{e.eyebrow}</span>
                    <span className="seo__rel-title">{e.navLabel}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Final CTA */}
      <section className="mkt__final">
        <div className="mkt__container">
          <h2>Generate a design system your AI agent follows.</h2>
          <p className="mkt__final-sub">
            100% free, framework-neutral tokens — no account, no lock-in, your design language,
            your file.
          </p>
          <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={() => navigate('/app')}>
            Build my UI kit →
          </button>
        </div>
      </section>

      <MktFooter navigate={navigate} />
    </div>
  )
}
