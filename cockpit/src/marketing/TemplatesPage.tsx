import { useEffect } from 'react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'
import { LEDGER_SCREENS, SHOWCASES } from '../showcases/manifests'

/**
 * /templates (IA-5) — the ship-ready page templates as a site page. The Astryx
 * "ship-ready templates" clause, made browsable: the 8 Ledger screens that
 * scripts/gen-templates.tsx prebuilds into public/templates/*.html. Each row
 * links to the raw file and shows the one CLI command that drops it into a
 * project wearing YOUR kit. Derived from the SAME manifests gen-templates uses,
 * so this list can't drift from what actually ships.
 */
const TEMPLATES = LEDGER_SCREENS.map((screen) => {
  const m = SHOWCASES.find((s) => s.id === screen.id)!
  const name = m.id.replace(/^ledger-?/, '') || 'home'
  // Blurb bodies read "Billing flagship — <the useful part>."; take the part after the dash.
  const blurb = (m.blurb.split('—')[1] ?? m.blurb).trim()
  return { name, title: m.title.replace(/^Ledger · /, ''), blurb }
})
const TEMPLATE_BY_NAME = new Map(TEMPLATES.map((t) => [t.name, t]))

export function TemplatesPage({ navigate }: { navigate: (to: string) => void }) {
  useEffect(() => {
    const prev = document.title
    document.title = 'Templates — ship-ready pages that wear your kit — UIcockpit'
    return () => { document.title = prev }
  }, [])
  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="templates" />
      <section className="mkt__section">
        <div className="mkt__container">
          <div className="mkt__section-head">
            <div className="mkt__eyebrow">
              <span className="mkt__eyebrow-dot" />
              Templates
            </div>
            <h1>Ship-ready pages that wear your kit.</h1>
            <p className="mkt__section-sub">
              Whole screens from the Ledger flagship — dashboard, tables, settings, an AI chat —
              as plain HTML built purely from the kit&apos;s components. One command drops any of
              them into your project, already wearing <em>your</em> kit.
            </p>
          </div>

          <div className="mkt__tpl-install">
            <span className="mkt__tpl-install-label">Install any template</span>
            <code>npx uicockpit template &lt;name&gt;</code>
          </div>

          <div className="mkt__tpl-list">
            {TEMPLATES.map((t) => (
              <div className="mkt__tpl-row" key={t.name}>
                <div className="mkt__tpl-info">
                  <div className="mkt__tpl-name">{t.title}</div>
                  <div className="mkt__tpl-blurb">{t.blurb}</div>
                </div>
                <code className="mkt__tpl-cmd">uicockpit template {t.name}</code>
                <a
                  className="mkt-btn mkt-btn--ghost mkt__tpl-view"
                  href={`/templates/preview/${t.name}`}
                  onClick={(e) => { e.preventDefault(); navigate(`/templates/preview/${t.name}`) }}
                >
                  Preview →
                </a>
              </div>
            ))}
          </div>

          <div className="mkt__tpl-cta">
            <button className="mkt-btn mkt-btn--primary mkt-btn--lg" onClick={() => navigate('/app')}>
              Tune the kit these wear →
            </button>
          </div>
        </div>
      </section>
      <MktFooter navigate={navigate} />
    </div>
  )
}

/**
 * /templates/preview/<name> — a thin preview SHELL: a back bar (← Templates) +
 * the install command, over the raw template loaded in an <iframe>. The iframe
 * keeps the template HTML CHROME-FREE (it's the exact file the CLI fetches +
 * ships), while still giving the visitor a way back — the dead-end a bare
 * new-tab .html link left them in. Unknown name → bounce to the list.
 */
export function TemplatePreview({ name, navigate }: { name: string; navigate: (to: string) => void }) {
  const t = TEMPLATE_BY_NAME.get(name)
  useEffect(() => {
    if (!t) { navigate('/templates'); return }
    const prev = document.title
    document.title = `${t.title} template — preview — UIcockpit`
    return () => { document.title = prev }
  }, [t, navigate])
  if (!t) return null
  return (
    <div className="tplview">
      <header className="tplview__bar">
        <a
          className="tplview__back"
          href="/templates"
          onClick={(e) => { e.preventDefault(); navigate('/templates') }}
        >
          ← Templates
        </a>
        <span className="tplview__name">Ledger · {t.title}</span>
        <div className="tplview__actions">
          <code className="tplview__cmd">npx uicockpit template {t.name}</code>
          <a className="tplview__raw" href={`/templates/${t.name}.html`} target="_blank" rel="noopener noreferrer">
            Open raw ↗
          </a>
        </div>
      </header>
      <iframe className="tplview__frame" src={`/templates/${t.name}.html`} title={`${t.title} template preview`} />
    </div>
  )
}
