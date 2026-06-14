import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import type { Config, Tokens } from '../../tokens/types'
import type { IconName } from '../../icons/concepts'
import { Icon } from '../../icons/Icon'

/* The Foundations view — the FIRST rung of the ladder, twinned 1:1 with the panel
 * groups. It shows the *resolved* token scales AND their live values, so you see the
 * impact of every choice: type sizes carry their px and grow with Text size, the
 * density visuals resize with Scale, the motion dots run at the resolved durations,
 * etc. Everything is drawn with `var(--k-*)` (the enclosing `.cockpit-preview` sets
 * them from the live config) — so it ripples on every change ("author the foundation,
 * see it resolved"). Pure preview chrome: the `.fnd*` classes live in preview-only.css. */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/* The panel shows outcome-named caps that differ from the raw enum (surfaceDepth
 * 'layered' → "Deep", iconSet 'hairline' → "Iconoir"). Mirror those caps here so the
 * Foundations view reads identically to the control that drives it. Keep in sync with
 * the *_OPTS arrays in src/panel/Panel.tsx. */
const LABELS: Record<string, Record<string, string>> = {
  surfaceDepth: { flat: 'Flat', soft: 'Subtle', raised: 'Raised', layered: 'Deep' },
  iconSet: { hairline: 'Iconoir', line: 'Lucide', rounded: 'Phosphor', bold: 'Phosphor Bold', solid: 'Heroicons' },
  surface: { outlined: 'Outlined', filled: 'Filled', plain: 'Plain' },
  borders: { faint: 'Faint', subtle: 'Subtle', medium: 'Medium', strong: 'Strong' },
  buttonShape: { match: 'Match', none: 'None', subtle: 'Subtle', soft: 'Soft', round: 'Round', pill: 'Pill' },
  neutral: { auto: 'Auto (brand)', cool: 'Cool', neutral: 'Neutral', warm: 'Warm' },
}
const lbl = (k: string, v: string) => LABELS[k]?.[v] ?? cap(v)

export function FoundationsView({ cfg, tokens }: { cfg: Config; tokens: Tokens }) {
  // Resolved token value (raw), and a px-formatted version (rem→px for readability).
  const val = (name: string) => String(tokens.vars[name] ?? '')
  const px = (name: string) => {
    const s = val(name)
    const m = s.match(/^([\d.]+)rem$/)
    return m ? `${Math.round(parseFloat(m[1] ?? '0') * 16)}px` : s
  }

  // Same interlocking masonry as the Components gallery: each section reserves as many
  // 1px grid-auto-rows as its measured height needs (dense flow packs them tight,
  // wide cards span two columns). Re-measures on resize + late content via ResizeObserver.
  const gridRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const root = gridRef.current
    if (!root) return
    const cards = Array.from(root.querySelectorAll(':scope > .fnd__card')) as HTMLElement[]
    const layout = () => {
      const gs = getComputedStyle(root)
      const ROW = parseFloat(gs.gridAutoRows) || 1
      const VGAP = parseFloat(gs.columnGap) || 20
      for (const el of cards) {
        el.style.gridRowEnd = 'auto'
        const h = el.getBoundingClientRect().height
        el.style.gridRowEnd = `span ${Math.max(1, Math.ceil((h + VGAP) / ROW))}`
      }
    }
    layout()
    const ro = new ResizeObserver(layout)
    cards.forEach((c) => ro.observe(c))
    window.addEventListener('resize', layout)
    return () => { ro.disconnect(); window.removeEventListener('resize', layout) }
  }, [])

  return (
    <div className="fnd">
      {/* Sections mirror the side-panel groups 1:1 — same names, same grouping:
          Color · Scale · Typography · Shape · Surface · Motion & icons. They pack into
          the same interlocking masonry as the Components gallery (row-span by height). */}
      <div className="fnd__grid" ref={gridRef}>
        <Section title="Color" hint={`${cap(cfg.colorTheme)} · ${cap(cfg.palette)}`} wide>
          <SwGroup label="Brand" items={[['--k-primary', 'Primary'], ['--k-primary-soft', 'Primary soft'], ['--k-secondary', 'Secondary'], ['--k-secondary-soft', 'Secondary soft'], ['--k-accent', 'Accent'], ['--k-accent-soft', 'Accent soft']]} val={val} />
          <SwGroup label="System" items={[['--k-success', 'Success'], ['--k-warning', 'Warning'], ['--k-danger', 'Danger'], ['--k-info', 'Info']]} val={val} />
          <SwGroup label={`Neutrals · ${lbl('neutral', cfg.neutral)}`} items={[['--k-surface', 'Surface'], ['--k-surface-raised', 'Raised'], ['--k-surface-sunken', 'Sunken'], ['--k-border', 'Border'], ['--k-fg', 'Text'], ['--k-fg-muted', 'Muted']]} val={val} />
          <div className="fnd__sw-group-label">Decorative palette</div>
          <div className="fnd__palette">
            {[1, 2, 3, 4, 5, 6].map((n) => <span key={n} className="fnd__palette-cell" />)}
          </div>
        </Section>

        {/* Scale = the panel's single spacing control. Everything it resolves to lives
            here: density, the spacing grid, and the layout primitives (whose gaps
            track Scale). No separate "Space"/"Layout" — the panel has neither. */}
        <Section title="Scale" hint={cap(cfg.scale)} wide>
          <div className="fnd__sw-group-label">Density — what Scale moves</div>
          <div className="fnd__density">
            <div className="fnd__density-cell">
              <span className="fnd__density-gap" style={{ width: 'var(--k-space)' }} />
              <span className="fnd__density-meta"><b>Gap</b>{px('--k-space')}</span>
            </div>
            <div className="fnd__density-cell">
              <span className="fnd__density-ctl" style={{ height: 'var(--k-in-h-default)' }} />
              <span className="fnd__density-meta"><b>Control</b>{px('--k-in-h-default')}</span>
            </div>
          </div>
          <div className="fnd__sw-group-label">Spacing grid (fixed reference)</div>
          <div className="fnd__space">
            {[2, 4, 6, 8, 10, 12, 16, 20, 24, 32].map((n) => (
              <div key={n} className="fnd__space-row">
                <span className="fnd__space-bar" style={{ width: `var(--k-s-${n})` }} />
                <span className="fnd__space-label">{n}px</span>
              </div>
            ))}
          </div>
          <div className="fnd__sw-group-label">Layout — gaps track Scale ({px('--k-space')}, tighter on Compact); measure in ch tracks font</div>
          <div className="l-stack fnd__layout">
            <div>
              <div className="fnd__sw-group-label">Cluster — wraps · gap {px('--k-space')}</div>
              <div className="l-cluster">{['Design', 'Engineering', 'Product', 'Ops', 'Growth'].map((t) => <div key={t} className="fnd__l-tile">{t}</div>)}</div>
            </div>
            <div>
              <div className="fnd__sw-group-label">Switcher — flips to a column · threshold 28rem</div>
              <div className="l-switcher">{['Pane A', 'Pane B', 'Pane C'].map((t) => <div key={t} className="fnd__l-tile">{t}</div>)}</div>
            </div>
            <div>
              <div className="fnd__sw-group-label">Grid — responsive auto-fit · min column 16rem</div>
              <div className="l-grid">{['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map((t) => <div key={t} className="fnd__l-tile">{t}</div>)}</div>
            </div>
            <div>
              <div className="fnd__sw-group-label">Bento — the smart grid · a hero spans the row, the rest reflow</div>
              <div className="bento">
                <div className="bento__item--hero fnd__l-tile">Hero — spans the full row</div>
                {['Two', 'Three', 'Four'].map((t) => <div key={t} className="fnd__l-tile">{t}</div>)}
              </div>
              <div className="bento bento--cols fnd__bento-cols" style={{ '--bento-cols': 3 } as CSSProperties}>
                <div className="fnd__l-tile" style={{ '--bento-span': 2 } as CSSProperties}>Span 2 of 3</div>
                <div className="fnd__l-tile">1</div>
              </div>
            </div>
            <div>
              <div className="fnd__sw-group-label">Sidebar — side 16rem + flexible main</div>
              <div className="l-sidebar">
                <div className="l-sidebar__side"><div className="fnd__l-tile">Side · 16rem</div></div>
                <div className="l-sidebar__main"><div className="fnd__l-tile">Main — grows, wraps under when narrow</div></div>
              </div>
            </div>
            <div>
              <div className="fnd__sw-group-label">Center — measure in ch (tracks font)</div>
              <div className="l-center l-center--narrow"><div className="fnd__l-tile">Narrow · 48ch</div></div>
              <div className="l-center l-center--wide"><div className="fnd__l-tile">Wide · 90ch</div></div>
            </div>
          </div>
        </Section>

        <Section title="Typography" hint={`${cfg.fontDisplay} / ${cfg.fontBody}`}>
          {([['--k-type-display', 'Display'], ['--k-type-h1', 'Title'], ['--k-type-h2', 'Heading'], ['--k-type-h3', 'Subhead'], ['--k-type-body', 'Body'], ['--k-type-small', 'Small'], ['--k-type-caption', 'Caption']] as [string, string][]).map(([v, label]) => (
            <div key={v} className="fnd__type-row">
              <span className="fnd__type-sample" style={{ fontSize: `var(${v})` }}>Ag</span>
              <span className="fnd__type-meta"><b>{label}</b><span>{v.replace('--k-type-', '')}</span></span>
              <span className="fnd__type-px">{px(v)}</span>
            </div>
          ))}
          {/* The roles working together — em-based rhythm so it scales with Text size. */}
          <div className="fnd__prose">
            <div className="fnd__sw-group-label">In prose</div>
            <h3 className="fnd__prose-display">Display 1</h3>
            <p className="fnd__prose-lead">Lead paragraph — sets the tone right under a display headline.</p>
            <h4 className="fnd__prose-h">Heading 2</h4>
            <p className="fnd__prose-body">Body — the workhorse size. Longer sentences let you feel how the line-height creates breathing room between rows.</p>
            <p className="fnd__prose-small">Small — captions, helpers, microcopy.</p>
          </div>
        </Section>

        <Section title="Shape" hint={`Box ${cap(cfg.radius)} · Button ${lbl('buttonShape', cfg.buttonShape)}`}>
          <div className="fnd__sw-group-label">Box radius</div>
          <div className="fnd__radii">
            {([['--k-radius-sm', 'sm'], ['--k-radius-md', 'md'], ['--k-radius-lg', 'lg']] as [string, string][]).map(([v, label]) => (
              <div key={v} className="fnd__radius-cell">
                <span className="fnd__radius-box" style={{ borderRadius: `var(${v})` }} />
                <span className="fnd__radius-label">{label}</span>
                <span className="fnd__radius-px">{px(v)}</span>
              </div>
            ))}
          </div>
          {/* Button radius is its own control (decoupled from Box) — show a real
              .btn so its corner reads at a glance. 'Match' tracks Box radius. */}
          <div className="fnd__sw-group-label">Button radius</div>
          <div className="fnd__shape-btns">
            <button type="button" className="btn btn--primary">Button</button>
            <button type="button" className="btn">Secondary</button>
            <span className="fnd__radius-px">{lbl('buttonShape', cfg.buttonShape)}</span>
          </div>
        </Section>

        <Section title="Surface" hint={`${lbl('surfaceDepth', cfg.surfaceDepth)} · ${lbl('surface', cfg.surface)} · ${lbl('borders', cfg.borders)}`}>
          <div className="fnd__sw-group-label">Elevation · {lbl('surfaceDepth', cfg.surfaceDepth)}</div>
          <div className="fnd__shadows">
            {([['--k-shadow-xs', 'xs'], ['--k-shadow-sm', 'sm'], ['--k-shadow-md', 'md'], ['--k-shadow-lg', 'lg']] as [string, string][]).map(([v, label]) => (
              <div key={v} className="fnd__shadow-cell">
                <span className="fnd__shadow-tile" style={{ boxShadow: `var(${v})` }} />
                <span className="fnd__shadow-label">{label}</span>
              </div>
            ))}
          </div>
          <div className="fnd__sw-group-label">Separation · {lbl('surface', cfg.surface)}</div>
          <div className="fnd__surface-fields">
            <input className="in" defaultValue="Sample field" aria-label="Surface treatment sample" />
            <div className="in in--inline"><Icon name="search" /><input defaultValue="Inline field" aria-label="Inline sample" /></div>
          </div>
          <div className="fnd__sw-group-label">Border · {lbl('borders', cfg.borders)}</div>
          <div className="fnd__surface-border" />
        </Section>

        <Section title="Motion & icons" hint={`${cap(cfg.motion)} · ${lbl('iconSet', cfg.iconSet)}`}>
          <div className="fnd__sw-group-label">Motion · {cap(cfg.motion)}</div>
          <p className="fnd__hint-line">Hover a row — the dot makes one real transition at that speed, like a UI state change.</p>
          <div className="fnd__motion">
            {([['Fast', '--k-dur-fast', 'Hover · focus'], ['Normal', '--k-dur', 'Toggle · menu'], ['Slow', '--k-dur-slow', 'Sheet · dialog']] as [string, string, string][]).map(([label, durVar, use]) => (
              <div key={label} className="fnd__motion-row">
                <span className="fnd__motion-meta"><b>{label}</b><span>{use}</span></span>
                <span className="fnd__motion-track"><span className="fnd__motion-box" style={{ transitionDuration: `var(${durVar})` } as CSSProperties} /></span>
                <span className="fnd__motion-val">{val(durVar)}</span>
              </div>
            ))}
          </div>
          <div className="fnd__motion-ease">
            <span>Easing</span>
            <b className="fnd__motion-ease-val">{val('--k-ease')}</b>
          </div>
          <div className="fnd__sw-group-label">Icons · {lbl('iconSet', cfg.iconSet)}</div>
          <div className="fnd__icons">
            {ICONS.map((n) => <span key={n} className="fnd__icon"><Icon name={n} /></span>)}
          </div>
        </Section>
      </div>
    </div>
  )
}

// One colour chip — a token swatch with the role name + the CSS var, resolved value on hover.
function Sw({ v, label, val }: { v: string; label: string; val: (n: string) => string }) {
  return (
    <div className="fnd__sw" title={`${v}: ${val(v)}`}>
      <span className="fnd__sw-chip" style={{ background: `var(${v})` }} />
      <span className="fnd__sw-label">{label}</span>
      <span className="fnd__sw-var">{v.replace('--k-', '')}</span>
    </div>
  )
}

function SwGroup({ label, items, val }: { label: string; items: [string, string][]; val: (n: string) => string }) {
  return (
    <>
      <div className="fnd__sw-group-label">{label}</div>
      <div className="fnd__swatches">
        {items.map(([v, l]) => <Sw key={v} v={v} label={l} val={val} />)}
      </div>
    </>
  )
}

function Section({ title, hint, children, wide }: { title: string; hint?: string; children: ReactNode; wide?: boolean }) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return (
    <section id={`fnd-${slug}`} className={`card fnd__card${wide ? ' fnd__card--wide' : ''}`}>
      <div className="fnd__card-head">
        <h3 className="fnd__card-title">{title}</h3>
        {hint && <span className="fnd__card-hint">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

const ICONS: IconName[] = ['home', 'search', 'bell', 'cog', 'chart', 'grid', 'plus', 'check', 'file', 'cal', 'edit', 'trash']
