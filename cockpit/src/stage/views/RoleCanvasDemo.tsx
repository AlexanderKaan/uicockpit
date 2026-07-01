import { useState } from 'react'
import { ROLE_GUARANTEE, type Role } from '../../kit/contracts'

/**
 * RoleCanvasDemo — the loupe's page-level "Role Canvas" playground.
 *
 * Makes the GENERATIVE binding visible: one switch flips six mini specimens
 * between UNTAGGED (plain markup) and ROLE-TAGGED (a `data-role`/aria attribute).
 * When tagged, each specimen inherits the kit's guaranteed treatment via the
 * zero-specificity `:where()` floors in globalLayer.ts — the exact "style the
 * unknown" claim, live. The specimens carry NO kit component class; only the
 * `.rcx-*` scaffolding (a neutral frame) + the role attribute, so what you see
 * adopting is purely the role binding. Lives inside `.cockpit-preview`, so those
 * floors are active here.
 */

/** Each row: the role, the attribute it toggles on, and a live specimen. */
const ROLES: { role: Role; attr: string; note: string }[] = [
  { role: 'surface', attr: 'data-role="surface"', note: 'a bare box becomes a raised surface' },
  { role: 'control', attr: 'data-role="control"', note: 'inherits the height invariant + centering' },
  { role: 'selectable', attr: 'aria-selected', note: 'a row gains the selected edge + fill' },
  { role: 'tone-bearer', attr: 'data-tone="danger"', note: 'a tint with provably legible ink' },
  { role: 'text-slot', attr: 'data-role="text-slot"', note: 'long text truncates instead of breaking' },
  { role: 'overlay', attr: 'role="menu"', note: 'a long list caps its height + scrolls' },
]

/** The live specimen for each role — tagged only when `on`. No kit class; the
 *  role attribute is the only thing the binding keys on. */
function Specimen({ role, on }: { role: Role; on: boolean }) {
  switch (role) {
    case 'surface':
      return <div className="rcx-box" data-role={on ? 'surface' : undefined}>Panel</div>
    case 'control':
      return <div className="rcx-ctrl" data-role={on ? 'control' : undefined}>Submit</div>
    case 'selectable':
      return <div className="rcx-opt" role="option" aria-selected={on ? 'true' : undefined}>Selected row</div>
    case 'tone-bearer':
      return (
        <span className="rcx-pill" data-role={on ? 'tone-bearer' : undefined} data-tone={on ? 'danger' : undefined}>
          Overdue
        </span>
      )
    case 'text-slot':
      return (
        <div className="rcx-textrow">
          <span data-role={on ? 'text-slot' : undefined}>invoice-2026-Q3-final-revised-approved.pdf</span>
        </div>
      )
    case 'overlay':
      // Untagged clips (items unreachable); tagged role="menu" inherits
      // overflow:auto from the floor → the same list caps + scrolls.
      return (
        <div className={`rcx-menu${on ? '' : ' rcx-menu--clip'}`} role={on ? 'menu' : undefined}>
          {Array.from({ length: 9 }, (_, i) => (
            <div className="rcx-mi" key={i}>Item {i + 1}</div>
          ))}
        </div>
      )
  }
}

export function RoleCanvasDemo() {
  const [on, setOn] = useState(true)
  return (
    <div className="rcx">
      <div className="shc__loupe-head">The Role Canvas</div>
      <p className="shc__loupe-blurb">
        Six roles, each a guaranteed treatment. Tag any markup — even a component we never
        built — and it inherits. Flip the switch:
      </p>

      <div className="rcx-switch" role="group" aria-label="Role Canvas binding">
        <button type="button" className="rcx-switch__btn" aria-pressed={!on} onClick={() => setOn(false)}>Untagged</button>
        <button type="button" className="rcx-switch__btn" aria-pressed={on} onClick={() => setOn(true)}>Role-tagged</button>
      </div>

      <ul className="rcx-list">
        {ROLES.map(({ role, attr, note }) => (
          <li className="rcx-row" key={role}>
            <div className="rcx-row__head">
              <span className={`shc__role shc__role--${role}`}>{role}</span>
              <code className="rcx-attr" data-on={on ? 'true' : undefined}>{attr}</code>
            </div>
            <div className="rcx-demo"><Specimen role={role} on={on} /></div>
            <div className="rcx-gtee">{note} — <em>{ROLE_GUARANTEE[role]}</em></div>
          </li>
        ))}
      </ul>
    </div>
  )
}
