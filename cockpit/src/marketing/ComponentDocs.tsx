import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import { MktNav } from './MktNav'
import { MktFooter } from './MktFooter'
import { IconProvider } from '../icons/Icon'
import { buildTokens } from '../tokens/buildTokens'
import { DEFAULT_CONFIG } from '../tokens/defaults'
import { COMPONENT_PAGES, componentPageBySlug, type ComponentPage } from '../stage/views/ComponentGallery'
import { RECIPES } from '../kit'
import { tierOf, usesOf } from '../kit/segments'

/** The component reference always shows the DEFAULT kit — one canonical look for
 *  the docs, no per-visitor toggle (the /app configurator is where you re-theme). */
function useDefaultKit() {
  const tokens = useMemo(() => buildTokens(DEFAULT_CONFIG).vars as CSSProperties, [])
  return { tokens, iconSet: DEFAULT_CONFIG.iconSet }
}

/* IA-2b — the public component reference: a persistent sidebar index + per-slug
 * detail pages, the "normal" components docs shadcn/Astryx have. Everything is
 * derived from COMPONENT_PAGES (the slug→recipe→preview registry) + the recipe
 * and segment sources, so it can't drift from the kit. */

/** Groups in first-seen order — the sidebar + index section order. */
const GROUPS = COMPONENT_PAGES.reduce<string[]>((acc, c) => (acc.includes(c.group) ? acc : [...acc, c.group]), [])
const byGroup = (g: string) => COMPONENT_PAGES.filter((c) => c.group === g)
const recipeOf = (id: string) => RECIPES.find((r) => r.id === id)
const label = (id: string) => COMPONENT_PAGES.find((c) => c.recipeId === id)?.name ?? recipeOf(id)?.section ?? id

/** Left index rail, shared by the index + every detail page. */
function Sidebar({ current, navigate }: { current?: string; navigate: (to: string) => void }) {
  const go = (e: React.MouseEvent, to: string) => { e.preventDefault(); navigate(to) }
  return (
    <nav className="cmpdoc__side" aria-label="Components">
      <a href="/components" className={`cmpdoc__side-link cmpdoc__side-over ${!current ? 'cmpdoc__side-link--on' : ''}`} onClick={(e) => go(e, '/components')}>Overview</a>
      {GROUPS.map((g) => (
        <div className="cmpdoc__side-group" key={g}>
          <div className="cmpdoc__side-head">{g}</div>
          {byGroup(g).map((c) => (
            <a
              key={c.slug}
              href={`/components/${c.slug}`}
              className={`cmpdoc__side-link ${current === c.slug ? 'cmpdoc__side-link--on' : ''}`}
              aria-current={current === c.slug ? 'page' : undefined}
              onClick={(e) => go(e, `/components/${c.slug}`)}
            >{c.name}</a>
          ))}
        </div>
      ))}
    </nav>
  )
}

/** Shell = site nav + the two-column [sidebar · content] docs body + footer. */
function DocsShell({ current, navigate, children }: { current?: string; navigate: (to: string) => void; children: ReactNode }) {
  return (
    <div className="mkt">
      <MktNav navigate={navigate} current="components" />
      <div className="mkt__container cmpdoc">
        <Sidebar current={current} navigate={navigate} />
        <main className="cmpdoc__main">{children}</main>
      </div>
      <MktFooter navigate={navigate} />
    </div>
  )
}

/* ── The index — every component as a grouped, linkable preview tile ────────── */
export function ComponentsIndexPage({ navigate }: { navigate: (to: string) => void }) {
  const { tokens, iconSet } = useDefaultKit()
  useEffect(() => {
    const prev = document.title
    document.title = 'Components — 60+ accessible components, themed by your kit — UIcockpit'
    return () => { document.title = prev }
  }, [])
  return (
    <DocsShell navigate={navigate}>
      <div className="cmpdoc__head">
        <h1>Components</h1>
        <p className="cmpdoc__lead">
          Every component in the kit — accessible, framework-neutral, and endlessly themeable.
          Pick one for its markup, recipe CSS and best-practice rules.
        </p>
      </div>
      <div className="cockpit-preview cmpdoc__previews" style={tokens}>
        <IconProvider set={iconSet}>
          {GROUPS.map((g) => (
            <section className="cmpdoc__section" key={g}>
              <h2 className="cmpdoc__section-head">{g}</h2>
              <div className="cmpdoc__grid">
                {byGroup(g).map((c) => (
                  <a key={c.slug} className="cmpdoc__tile" href={`/components/${c.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/components/${c.slug}`) }}>
                    <div className="cmpdoc__tile-preview"><c.Preview /></div>
                    <div className="cmpdoc__tile-name">{c.name}</div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </IconProvider>
      </div>
    </DocsShell>
  )
}

/* ── The detail — one component: preview · composition · recipe CSS · Do/Don't ── */
export function ComponentDetailPage({ slug, navigate }: { slug: string; navigate: (to: string) => void }) {
  const page = componentPageBySlug(slug) as ComponentPage
  const { tokens, iconSet } = useDefaultKit()
  const recipe = recipeOf(page.recipeId)
  const tier = tierOf(page.recipeId)
  const composes = usesOf(page.recipeId)
  const doc = recipe?.doc

  useEffect(() => {
    const prev = document.title
    document.title = `${page.name} — a themeable ${page.name} component — UIcockpit`
    return () => { document.title = prev }
  }, [page.name])

  return (
    <DocsShell current={slug} navigate={navigate}>
      <div className="cmpdoc__crumbs">
        <a href="/components" onClick={(e) => { e.preventDefault(); navigate('/components') }}>Components</a>
        <span aria-hidden="true"> / </span>
        <span>{page.name}</span>
      </div>
      <div className="cmpdoc__head">
        <div className="cmpdoc__title-row">
          <h1>{page.name}</h1>
          <span className={`cmpdoc__tier cmpdoc__tier--${tier}`}>{tier}</span>
        </div>
        <p className="cmpdoc__lead">{page.blurb}</p>
        <div className="cmpdoc__tools">
          <a className="mkt-btn mkt-btn--primary cmpdoc__use" href="/app">Open in configurator →</a>
        </div>
      </div>

      <div className="cockpit-preview cmpdoc__stage" style={tokens}>
        <IconProvider set={iconSet}>
          <page.Preview />
        </IconProvider>
      </div>

      {composes.length > 0 && (
        <p className="cmpdoc__composes">
          <strong>Composes:</strong>{' '}
          {composes.map((id, i) => (
            <span key={id}>{i > 0 ? ' · ' : ''}{label(id)}</span>
          ))}
        </p>
      )}

      {doc && (
        <section className="cmpdoc__block">
          <h2>Best practices</h2>
          <div className="cmpdoc__dodont">
            <div>
              <div className="cmpdoc__dh cmpdoc__dh--do">Do</div>
              <ul>{doc.dos.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div>
              <div className="cmpdoc__dh cmpdoc__dh--dont">Don&apos;t</div>
              <ul>{doc.donts.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </div>
        </section>
      )}

      {recipe && (
        <section className="cmpdoc__block">
          <h2>Recipe CSS</h2>
          <p className="cmpdoc__note">
            This is the exact CSS your kit ships for <code>{page.name}</code> — token-driven, so it
            re-themes with every knob. Get it (and the rest) from the configurator&apos;s{' '}
            <a href="/app" onClick={(e) => { e.preventDefault(); navigate('/app') }}>Use&nbsp;kit</a> panel.
          </p>
          <pre className="cmpdoc__css"><code>{recipe.css}</code></pre>
        </section>
      )}
    </DocsShell>
  )
}
