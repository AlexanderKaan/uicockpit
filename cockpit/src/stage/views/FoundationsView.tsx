import type { ReactNode } from 'react'
import type { Config, Tokens } from '../../tokens/types'
import type { IconName } from '../../icons/concepts'
import { Icon } from '../../icons/Icon'

/* The Foundations view — the FIRST rung of the ladder, twinned 1:1 with the panel
 * groups. It shows the *resolved* token scales (not controls): the colour roles +
 * ramps, the type scale, shape, space, elevation, motion and icons. Everything is
 * drawn with `var(--k-*)`, which the enclosing `.cockpit-preview` container sets
 * from the live config — so changing any control on the left ripples here instantly
 * ("author the foundation, see it resolved"). Pure preview chrome: the `.foundations*`
 * classes live in preview-only.css and never ship to a kit consumer. */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// One colour chip — a token swatch with the role name + the CSS var beneath it.
function Sw({ v, label }: { v: string; label: string }) {
  return (
    <div className="fnd__sw">
      <span className="fnd__sw-chip" style={{ background: `var(${v})` }} />
      <span className="fnd__sw-label">{label}</span>
      <span className="fnd__sw-var">{v.replace('--k-', '')}</span>
    </div>
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

const TYPE_STEPS: [string, string][] = [
  ['--k-type-h1', 'Display'], ['--k-type-h2', 'Heading'], ['--k-type-h3', 'Subhead'],
  ['--k-type-body', 'Body'], ['--k-type-small', 'Small'], ['--k-type-caption', 'Caption'],
]
const SPACE_STEPS = [2, 4, 6, 8, 10, 12, 16, 20, 24, 32]
const SHADOWS: [string, string][] = [['--k-shadow-xs', 'xs'], ['--k-shadow-sm', 'sm'], ['--k-shadow-md', 'md'], ['--k-shadow-lg', 'lg']]
const RADII: [string, string][] = [['--k-radius-sm', 'sm'], ['--k-radius-md', 'md'], ['--k-radius-lg', 'lg']]
const ICONS: IconName[] = ['home', 'search', 'bell', 'cog', 'chart', 'grid', 'plus', 'check', 'file', 'cal', 'edit', 'trash']

export function FoundationsView({ cfg, tokens }: { cfg: Config; tokens: Tokens }) {
  return (
    <div className="fnd">
      <header className="fnd__head">
        <div className="fnd__eyebrow">Foundation</div>
        <h1 className="fnd__title">Your design language, resolved</h1>
        <p className="fnd__sub">
          The token scales every Atom, Block and Page inherits. Author them on the
          left — watch them ripple across every layer above.
        </p>
      </header>

      <div className="fnd__grid">
        <Section title="Color" hint="roles · system · neutrals · decorative" wide>
          <div className="fnd__sw-group-label">Brand</div>
          <div className="fnd__swatches">
            <Sw v="--k-primary" label="Primary" /><Sw v="--k-primary-soft" label="Primary soft" />
            <Sw v="--k-secondary" label="Secondary" /><Sw v="--k-secondary-soft" label="Secondary soft" />
            <Sw v="--k-accent" label="Accent" /><Sw v="--k-accent-soft" label="Accent soft" />
          </div>
          <div className="fnd__sw-group-label">System</div>
          <div className="fnd__swatches">
            <Sw v="--k-success" label="Success" /><Sw v="--k-warning" label="Warning" />
            <Sw v="--k-danger" label="Danger" /><Sw v="--k-info" label="Info" />
          </div>
          <div className="fnd__sw-group-label">Neutrals</div>
          <div className="fnd__swatches">
            <Sw v="--k-surface" label="Surface" /><Sw v="--k-surface-raised" label="Raised" />
            <Sw v="--k-surface-sunken" label="Sunken" /><Sw v="--k-border" label="Border" />
            <Sw v="--k-fg" label="Text" /><Sw v="--k-fg-muted" label="Muted" />
          </div>
          <div className="fnd__sw-group-label">Decorative palette</div>
          <div className="fnd__palette">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <span key={n} className="fnd__palette-cell" />
            ))}
          </div>
        </Section>

        <Section title="Typography" hint={`${cfg.fontDisplay} / ${cfg.fontBody}`}>
          {TYPE_STEPS.map(([v, label]) => (
            <div key={v} className="fnd__type-row">
              <span className="fnd__type-sample" style={{ fontSize: `var(${v})` }}>Ag</span>
              <span className="fnd__type-meta"><b>{label}</b><span>{v.replace('--k-type-', '')}</span></span>
            </div>
          ))}
        </Section>

        <Section title="Shape" hint={cap(cfg.radius)}>
          <div className="fnd__radii">
            {RADII.map(([v, label]) => (
              <div key={v} className="fnd__radius-cell">
                <span className="fnd__radius-box" style={{ borderRadius: `var(${v})` }} />
                <span className="fnd__radius-label">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Space" hint={cap(cfg.scale)}>
          <div className="fnd__space">
            {SPACE_STEPS.map((n) => (
              <div key={n} className="fnd__space-row">
                <span className="fnd__space-bar" style={{ width: `var(--k-s-${n})` }} />
                <span className="fnd__space-label">{n}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Elevation" hint={cap(cfg.surfaceDepth)}>
          <div className="fnd__shadows">
            {SHADOWS.map(([v, label]) => (
              <div key={v} className="fnd__shadow-cell">
                <span className="fnd__shadow-tile" style={{ boxShadow: `var(${v})` }} />
                <span className="fnd__shadow-label">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Motion" hint={cap(cfg.motion)}>
          <div className="fnd__motion">
            {([['Fast', '--k-dur-fast'], ['Normal', '--k-dur'], ['Slow', '--k-dur-slow'], ['Easing', '--k-ease']] as [string, string][]).map(([label, v]) => (
              <div key={v} className="fnd__motion-row">
                <span className="fnd__motion-label">{label}</span>
                <span className="fnd__motion-val">{String(tokens.vars[v] ?? '')}</span>
              </div>
            ))}
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
