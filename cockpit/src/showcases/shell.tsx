import { Icon } from '../icons/Icon'
import type { ShowcaseManifest, PaneSpec } from './manifests'
import { renderSection } from './sections'

/**
 * The section tier's consumer — a manifest rendered as a live app shell.
 *
 * WHY THIS FILE EXISTS, given nothing routes to it
 * The kit exports an adaptive scaffold: `.scaffold` + `.pane` morph a shell's
 * navigation bar → rail → sidebar at the container's own 600/1200px
 * breakpoints. That is the section tier, and it is the part of the kit a
 * component library does not have — so it is the last thing that should ship
 * unverified.
 *
 * Until the Showcases loupe was retired, that view was the scaffold's only
 * consumer. Deleting it would have left ~29 lines of exported CSS with nothing
 * rendering them: dead weight in every download, and a claim on the marketing
 * page with no code behind it. So the shell moved here instead of dying with
 * the screen it happened to live in.
 *
 * It sits beside `sections.tsx` in exactly the same status: a CONFORMANCE
 * FIXTURE. `audit:surfaces` (six axes, one read) and `audit:values` read this
 * directory from disk and hold the kit to it. Nothing imports it at runtime, so
 * it costs the bundle nothing — but delete it and the auditors quietly stop
 * proving anything about the section tier.
 *
 * Kit classes only. No preview chrome (`shc__*`), no inspect affordances, no
 * width slider — those belonged to the loupe. What is left is the composition
 * itself, which is the part worth guaranteeing.
 */

const PANE_CLASS = {
  flex: 'pane pane--flex',
  fixed: 'pane pane--fixed',
  detail: 'pane pane--flex pane--detail',
  supporting: 'pane pane--fixed pane--supporting',
} as const

function paneOf(pane: PaneSpec, i: number) {
  return (
    <section className={PANE_CLASS[pane.role]} key={i} aria-label={`${pane.role} pane`}>
      {pane.sections.map((b, j) => renderSection(b, j))}
    </section>
  )
}

export function ShowcaseShell({ manifest: m }: { manifest: ShowcaseManifest }) {
  return (
    <div className={`scaffold scaffold--${m.archetype}`}>
      {/* GOV.UK Cookie banner — a labelled region BEFORE everything else on the
          page. Page furniture for every public service in the EU, which is why a
          design system for them ships one and a component census does not. */}
      <div className="cookiebanner" role="region" aria-label={`Cookies on ${m.title}`}>
        <div className="cookiebanner__inner">
          <h2 className="cookiebanner__heading">Cookies on {m.title}</h2>
          <p className="cookiebanner__body">We use some essential cookies to make this service work. We would also like to use analytics cookies so we can understand how you use it and make improvements.</p>
          <div className="cookiebanner__actions">
            <button type="button" className="btn btn--primary">Accept analytics cookies</button>
            <button type="button" className="btn btn--secondary">Reject analytics cookies</button>
            <a href="#cookies">View cookies</a>
          </div>
        </div>
      </div>
      <div className="scaffold__frame">
        <div className="scaffold__bar appbar">
          <span className="appbar__title">{m.barTitle}</span>
          {m.nav === 'topbar' && (
            <nav className="tabs" aria-label={`${m.title} navigation`}>
              {m.navItems.map((it, i) => (
                <span key={it.label} className={`tab ${i === 0 ? 'tab--on' : ''}`}>{it.label}</span>
              ))}
            </nav>
          )}
          <span className="appbar__spacer" />
        </div>

        {m.nav === 'suite' && (
          <nav className="scaffold__nav" aria-label={`${m.title} navigation`}>
            <div className="navsuite">
              {m.navItems.map((it, i) => (
                <span
                  key={it.label}
                  className={`navsuite__item ${i === 0 ? 'navsuite__item--on' : ''}`}
                  aria-current={i === 0 ? 'page' : undefined}
                >
                  <span className="navsuite__icon"><Icon name={it.icon} size={18} /></span>
                  <span className="navsuite__label">{it.label}</span>
                </span>
              ))}
            </div>
          </nav>
        )}

        <div className="scaffold__body">{m.panes.map(paneOf)}</div>
      </div>
    </div>
  )
}
