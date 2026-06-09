import type { CSSProperties, ReactNode } from 'react'
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

export function FoundationsView({ cfg, tokens }: { cfg: Config; tokens: Tokens }) {
  // Resolved token value (raw), and a px-formatted version (rem→px for readability).
  const val = (name: string) => String(tokens.vars[name] ?? '')
  const px = (name: string) => {
    const s = val(name)
    const m = s.match(/^([\d.]+)rem$/)
    return m ? `${Math.round(parseFloat(m[1] ?? '0') * 16)}px` : s
  }

  return (
    <div className="fnd">
      <header className="fnd__head">
        <div className="fnd__eyebrow">Foundation</div>
        <h1 className="fnd__title">Your design language, resolved</h1>
        <p className="fnd__sub">
          The token scales every Atom, Block and Page inherits — with their live
          values. Author them on the left; watch the numbers and visuals move here.
        </p>
      </header>

      <div className="fnd__grid">
        <Section title="Color" hint={`${cap(cfg.colorTheme)} · ${cap(cfg.palette)}`} wide>
          <SwGroup label="Brand" items={[['--k-primary', 'Primary'], ['--k-primary-soft', 'Primary soft'], ['--k-secondary', 'Secondary'], ['--k-secondary-soft', 'Secondary soft'], ['--k-accent', 'Accent'], ['--k-accent-soft', 'Accent soft']]} val={val} />
          <SwGroup label="System" items={[['--k-success', 'Success'], ['--k-warning', 'Warning'], ['--k-danger', 'Danger'], ['--k-info', 'Info']]} val={val} />
          <SwGroup label="Neutrals" items={[['--k-surface', 'Surface'], ['--k-surface-raised', 'Raised'], ['--k-surface-sunken', 'Sunken'], ['--k-border', 'Border'], ['--k-fg', 'Text'], ['--k-fg-muted', 'Muted']]} val={val} />
          <div className="fnd__sw-group-label">Decorative palette</div>
          <div className="fnd__palette">
            {[1, 2, 3, 4, 5, 6].map((n) => <span key={n} className="fnd__palette-cell" />)}
          </div>
        </Section>

        <Section title="Typography" hint={`${cfg.fontDisplay} / ${cfg.fontBody}`}>
          {([['--k-type-h1', 'Display'], ['--k-type-h2', 'Heading'], ['--k-type-h3', 'Subhead'], ['--k-type-body', 'Body'], ['--k-type-small', 'Small'], ['--k-type-caption', 'Caption']] as [string, string][]).map(([v, label]) => (
            <div key={v} className="fnd__type-row">
              <span className="fnd__type-sample" style={{ fontSize: `var(${v})` }}>Ag</span>
              <span className="fnd__type-meta"><b>{label}</b><span>{v.replace('--k-type-', '')}</span></span>
              <span className="fnd__type-px">{px(v)}</span>
            </div>
          ))}
        </Section>

        <Section title="Shape" hint={cap(cfg.radius)}>
          <div className="fnd__radii">
            {([['--k-radius-sm', 'sm'], ['--k-radius-md', 'md'], ['--k-radius-lg', 'lg']] as [string, string][]).map(([v, label]) => (
              <div key={v} className="fnd__radius-cell">
                <span className="fnd__radius-box" style={{ borderRadius: `var(${v})` }} />
                <span className="fnd__radius-label">{label}</span>
                <span className="fnd__radius-px">{px(v)}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Space" hint={cap(cfg.scale)}>
          {/* Density — the values Scale actually moves (the grid below is a fixed
              reference). Both visuals resize live as you change Scale. */}
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
          <div className="fnd__sw-group-label">Grid (reference)</div>
          <div className="fnd__space">
            {[2, 4, 6, 8, 10, 12, 16, 20, 24, 32].map((n) => (
              <div key={n} className="fnd__space-row">
                <span className="fnd__space-bar" style={{ width: `var(--k-s-${n})` }} />
                <span className="fnd__space-label">{n}px</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Elevation" hint={cap(cfg.surfaceDepth)}>
          <div className="fnd__active">Active: <b>{cap(cfg.surfaceDepth)}</b></div>
          <div className="fnd__shadows">
            {([['--k-shadow-xs', 'xs'], ['--k-shadow-sm', 'sm'], ['--k-shadow-md', 'md'], ['--k-shadow-lg', 'lg']] as [string, string][]).map(([v, label]) => (
              <div key={v} className="fnd__shadow-cell">
                <span className="fnd__shadow-tile" style={{ boxShadow: `var(${v})` }} />
                <span className="fnd__shadow-label">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Motion" hint={cap(cfg.motion)}>
          <div className="fnd__motion">
            {([['Fast', '--k-dur-fast'], ['Normal', '--k-dur'], ['Slow', '--k-dur-slow']] as [string, string][]).map(([label, durVar]) => (
              <div key={label} className="fnd__motion-row">
                <span className="fnd__motion-label">{label}</span>
                <span className="fnd__motion-track"><span className="fnd__motion-dot" style={{ animationDuration: `var(${durVar})` } as CSSProperties} /></span>
                <span className="fnd__motion-val">{val(durVar)}</span>
              </div>
            ))}
            <div className="fnd__motion-row">
              <span className="fnd__motion-label">Easing</span>
              <span className="fnd__motion-track"><span className="fnd__motion-dot" style={{ animationDuration: 'var(--k-dur-slow)' } as CSSProperties} /></span>
              <span className="fnd__motion-val">{val('--k-ease')}</span>
            </div>
          </div>
        </Section>

        <Section title="Icons" hint={cfg.iconSet}>
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
  return (
    <section id={`fnd-${title.toLowerCase()}`} className={`card fnd__card${wide ? ' fnd__card--wide' : ''}`}>
      <div className="fnd__card-head">
        <h3 className="fnd__card-title">{title}</h3>
        {hint && <span className="fnd__card-hint">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

const ICONS: IconName[] = ['home', 'search', 'bell', 'cog', 'chart', 'grid', 'plus', 'check', 'file', 'cal', 'edit', 'trash']
