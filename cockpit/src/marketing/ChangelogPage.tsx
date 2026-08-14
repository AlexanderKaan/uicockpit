import { useEffect } from 'react'
import { MktNav, UICOCKPIT_VERSION, REPO_URL } from './MktNav'
import { MktFooter } from './MktFooter'
import { CHANGELOG, CHANGELOG_INTRO } from './changelog'
import { MCP_VERSION } from './versions'

/**
 * /changelog — the product clock.
 *
 * It exists because the version menu offered "Release notes" and pointed at a
 * GitHub releases page with nothing on it: a dead promise, live. The deeper
 * problem was that the promise could not be kept in that form. Most of what we
 * ship — the site, the audit, a fix to what the audit says about your app — is
 * not a package release at all, so a releases page listing only CLI bumps would
 * under-report the product and over-report npm.
 *
 * Hence dates here and semver on the packages, stated side by side so nobody
 * has to guess which number applies to them.
 */

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export function ChangelogPage({ navigate }: { navigate: (to: string) => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = "What's new — UIcockpit changelog"
    return () => { document.title = prev }
  }, [])

  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="changelog" />

      <main className="mkt__container chg">
        <h1>What&rsquo;s new</h1>
        <p className="chg__lede">{CHANGELOG_INTRO.split('\n\n')[0]}</p>

        {/* The two clocks, as a fact rather than a paragraph — this is the
            answer to "which version am I on", and it has two halves. */}
        <div className="chg__clocks">
          <div className="chg__clock">
            <span className="chg__clock-label">This site, the audit, your kits</span>
            <strong>Continuously deployed</strong>
            <span className="chg__clock-note">Dated below. Nothing to install, so nothing to version.</span>
          </div>
          <div className="chg__clock">
            <span className="chg__clock-label">Installed packages</span>
            <strong>
              <code>uicockpit</code> {UICOCKPIT_VERSION} · <code>uicockpit-mcp</code> {MCP_VERSION}
            </strong>
            <span className="chg__clock-note">
              Semver, tagged and released on{' '}
              <a href={`${REPO_URL}/releases`} target="_blank" rel="noopener noreferrer">GitHub</a>.
            </span>
          </div>
          <div className="chg__clock">
            <span className="chg__clock-label">A kit you exported</span>
            <strong>Its own hash</strong>
            <span className="chg__clock-note">
              <code>/k/&lt;hash&gt;.css</code> is immutable — the link cannot change under you.
            </span>
          </div>
        </div>

        <ol className="chg__list">
          {CHANGELOG.map((entry) => (
            <li key={entry.date} className="chg__entry">
              <h2 className="chg__date">
                <time dateTime={entry.date}>{DATE_FMT.format(new Date(`${entry.date}T00:00:00Z`))}</time>
              </h2>
              <div className="chg__body">
                {entry.sections.map((s) => (
                  <section key={s.kind} className="chg__section">
                    <h3 className={`chg__kind chg__kind--${s.kind.toLowerCase()}`}>{s.kind}</h3>
                    <ul>
                      {s.items.map((item, i) => (
                        <li key={i}>{renderInline(item)}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </main>

      <MktFooter navigate={navigate} />
    </div>
  )
}

/**
 * The only inline markup a changelog entry is allowed: **bold** and `code`.
 *
 * Deliberately not a markdown renderer, and deliberately not raw-HTML injection.
 * Restricting the grammar means the page builds real React elements from a file
 * that also lives on GitHub, where anything at all could be pasted into it.
 */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    // Recursive, because the two nest: a bold lead-in regularly names a path or
    // a flag. Treating them as alternatives rendered **`/styles`** with its
    // backticks showing.
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{renderInline(p.slice(2, -2))}</strong>
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>
    return p
  })
}
