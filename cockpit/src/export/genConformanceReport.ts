import { buildTokens } from '../tokens/buildTokens'
import { auditContrast } from '../tokens/extras'
import type { Config } from '../tokens/types'

/**
 * The design system's conformance report — the evidence half of a compliance
 * conversation.
 *
 * The European Accessibility Act, and the Web Accessibility Directive before it,
 * require an **accessibility statement**: a public declaration of how accessible
 * a service is, on what basis, assessed when and by whom. A statement is a claim,
 * and a claim needs evidence.
 *
 * ⚠️ THIS FILE IS NOT THAT STATEMENT, and saying otherwise would be the exact
 * overclaim the rest of this codebase spends its time preventing. A statement is
 * about someone's whole service: their organisation, their non-conforming
 * content, their feedback route, their enforcement procedure. We know none of
 * that. What we can supply is the part about the DESIGN SYSTEM — the artefact a
 * supplier hands over during procurement (an ACR, in VPAT terms) and which the
 * body then cites in a statement it writes itself.
 *
 * The structure follows from that. Scope and limits come FIRST, before any
 * number, because a conformance report whose caveats are in a footnote is a
 * marketing document wearing a lab coat.
 *
 * One distinction runs through the whole file and is marked at every result:
 * some lines are computed live for THEIR configuration, and some are what our own
 * CI measured on the kit. Blurring those would let a number earned on one
 * configuration quietly vouch for another — which is precisely the mistake that
 * made "0 violations" true for light mode and false for dark for months.
 */

/** What we run, so the report can name its own instruments honestly. */
const INSTRUMENTS = [
  {
    name: 'axe-core 4.10.2',
    what: 'WCAG 2.2 A + AA rule set, run against the RENDERED component gallery',
    scope: '3 densities x 2 colour modes = 6 configurations, 1440px viewport',
    result: '0 violations',
    command: 'npm run a11y:matrix',
  },
  {
    name: 'Target-size measurement',
    what: 'Rendered geometry of every interactive control, both axes',
    scope: '250 controls at the AAA setting',
    result: '0 below 44x44 CSS px',
    command: 'npm run a11y:matrix',
  },
  {
    name: 'Accessibility-tree walk (Chrome DevTools Protocol)',
    what: 'Computed roles, names, reading order, focus movement, landmarks',
    scope: 'Heading outline, task list, toggletip, error summary, skip link, 567 interactive nodes',
    result: 'no findings',
    command: 'npm run a11y:tree',
  },
  {
    name: 'Configuration sweep',
    what: 'Every position of every control, against every contrast floor',
    scope: '19 controls x 16 themes x 2 modes',
    result: 'no reachable setting breaks a floor',
    command: 'vitest src/tokens/__tests__/knobSweep.test.ts',
  },
] as const

/**
 * What we have NOT done. Stated as prominently as what we have, because the
 * distance between "passes an automated checker" and "works for the people the
 * rules exist for" is the honest subject of this section.
 */
const LIMITATIONS = [
  'No testing with disabled users. Everything above is automated. GOV.UK names usability-with-disabled-users as a criterion a component must meet, and we have not met it — this is the largest gap between the ambition and the claim.',
  'No assistive-technology matrix. The tree walk reads the accessibility tree the platform exposes; it does not run JAWS, NVDA or VoiceOver, and those disagree with each other and with the tree.',
  'Automated tooling detects a minority of WCAG failures. Rule checkers are good at contrast, names and structure; they cannot judge whether a label is meaningful, whether an error message helps, or whether a flow can be completed.',
  'Scope is the design system, not your application. Content, page structure, media alternatives, forms you assemble and journeys you build are yours, and most accessibility failures live there.',
  'EN 301 549 currently harmonises WCAG 2.1 AA. We build and test to 2.2, which is stricter, but 2.2 is not yet the harmonised standard — do not cite it as the legal bar.',
]

const CRITERIA = [
  ['1.4.1 Use of Colour', 'A', 'State is carried in text or shape as well as colour — status badges name their status, the character count changes its wording over the limit, requirement rules carry met/unmet in visually-hidden text.'],
  ['1.4.3 Contrast (Minimum)', 'AA', 'Every ink tier and every semantic text role is floored at 4.5:1 against the worst surface it can land on, in both polarities. Measured live for your configuration below.'],
  ['1.4.11 Non-text Contrast', 'AA', 'Input borders floored at 3:1 against both the field fill and the page. Focus ring floored at 3:1. Where a brand colour does not separate from the page, primary buttons receive a boundary rather than the brand being altered.'],
  ['2.1.1 Keyboard', 'A', 'No component depends on pointer input. Toggletip, menu, dialog and combobox are button-triggered and key-operable.'],
  ['2.4.1 Bypass Blocks', 'A', 'Skip link ships in the kit and is the first tab stop.'],
  ['2.4.7 Focus Visible', 'AA', 'A single focus treatment in the global layer, never removed by a component.'],
  ['2.4.11 Focus Not Obscured', 'AA', 'Sticky surfaces leave the focused element visible.'],
  ['2.5.7 Dragging Movements', 'AA', 'Every drag affordance has a single-pointer alternative.'],
  ['2.5.8 Target Size (Minimum)', 'AA', '24x24 CSS px floor via --k-hit-min; small glyph controls keep their visual size and centre a transparent hit area.'],
  ['2.5.5 Target Size (Enhanced)', 'AAA', 'Reached only at the AAA conformance setting, where every density rung lifts to 44x44 and Scale governs whitespace instead.'],
  ['3.3.1 Error Identification', 'A', 'Errors are named in text at the field and repeated in an error summary that moves focus to the control.'],
  ['3.3.2 Labels or Instructions', 'A', 'Visible labels above the field. Placeholder-as-label is not available: the floating-label recipes were removed.'],
  ['3.1.2 Language of Parts', 'AA', 'The language navigation names each option in its own language with lang and hreflang.'],
] as const

export function genConformanceReport(cfg: Config, assessedOn = '(fill in the date this was generated)'): string {
  const tk = buildTokens(cfg)
  const pairs = auditContrast(tk)
  const failing = pairs.filter((p) => !p.passes)
  const level = cfg.conformance === 'aaa' ? 'WCAG 2.2 AA, plus 2.5.5 Target Size (AAA)' : 'WCAG 2.2 AA'

  const pairRows = pairs
    .map((p) => `| ${p.label} | ${p.ratio.toFixed(2)}:1 | ${p.required}:1 | ${p.passes ? 'Pass' : '**Fail**'} |`)
    .join('\n')

  return `# Design system conformance report

**Subject:** the UIcockpit design system as configured below
**Target level:** ${level}
**Assessed on:** ${assessedOn}
**Method:** self-assessment, automated tooling (see Instruments)

---

## What this document is, and is not

This is a conformance report **for a design system**. It is the kind of artefact a
supplier hands over during procurement so a buyer can see what the building
material guarantees.

**It is not an accessibility statement.** The European Accessibility Act and the
Web Accessibility Directive require a statement about a *service*: which
organisation runs it, which parts are not accessible and why, how someone reports
a problem, and which body enforces it. Only you can write that. This report is
evidence you can cite inside it, for the part of your service that is this design
system.

**Using components that conform does not make a service conform.** Most
accessibility failures live in content, structure, journeys and the assembly of
components — none of which this document covers.

---

## Scope

Everything in this report applies to the kit at exactly this configuration.
Change a setting and the contrast figures change; the structural findings
(landmarks, names, keyboard behaviour, reading order) do not.

| Setting | Value |
|---|---|
| Conformance | ${cfg.conformance === 'aaa' ? 'AA + AAA target size' : 'WCAG AA'} |
| Colour theme | ${cfg.colorTheme} |
| Brand colour | ${cfg.cPrimary} |
| Mode | ${cfg.mode} |
| Scale | ${cfg.scale} |
| Text size | ${cfg.typeScale} |
| Surface | ${cfg.surface} |
| Border | ${cfg.borders} |
| Background | ${cfg.canvas} |

---

## Results

### Measured live, for the configuration above

${failing.length === 0
  ? `All ${pairs.length} audited colour relationships meet their required ratio.`
  : `**${failing.length} of ${pairs.length} audited colour relationships do not meet their required ratio.** They are marked below and must be resolved, or listed as non-conforming content in your statement.`}

| Relationship | Measured | Required | |
|---|---|---|---|
${pairRows}

${cfg.conformance === 'aaa'
  ? '\nAt this setting every interactive target is at least 44x44 CSS px. Density controls whitespace only.\n'
  : '\nTargets meet the 24x24 minimum of SC 2.5.8. To reach the 44x44 of SC 2.5.5 — the level NL Design System raises to mandatory — set Conformance to AAA.\n'}

### Measured on the kit itself, by our continuous checks

These are properties of the components as shipped. They are not re-run for your
configuration; they are the tests the kit must pass before it is released.

| Instrument | What it checks | Scope | Result |
|---|---|---|---|
${INSTRUMENTS.map((i) => `| ${i.name} | ${i.what} | ${i.scope} | ${i.result} |`).join('\n')}

Each is reproducible from the repository:

${INSTRUMENTS.map((i) => `- \`${i.command}\` — ${i.name}`).join('\n')}

---

## Success criteria addressed

Criteria the design system takes responsibility for. Everything not listed is
either not applicable to a component library, or is yours: content, media
alternatives, page titles, journeys, timing, and the assembly of these parts.

| Criterion | Level | How it is met |
|---|---|---|
${CRITERIA.map(([c, l, how]) => `| ${c} | ${l} | ${how} |`).join('\n')}

---

## Known limitations

${LIMITATIONS.map((l) => `- ${l}`).join('\n')}

---

## Citing this in your own statement

A statement typically needs: the standard applied, the assessment method and
date, and a list of what is not accessible. For the design-system portion you can
say, adapting the wording to your situation:

> The user-interface components are built on the UIcockpit design system,
> assessed against ${level} on ${assessedOn} by automated testing
> (axe-core, accessibility-tree inspection and rendered target-size measurement)
> across ${cfg.conformance === 'aaa' ? 'the enhanced-target' : 'the standard'}
> configuration recorded in its conformance report. That assessment did not
> include testing with disabled users.

Keep the last sentence. It is the part that is true of almost every statement
filed, and the part most of them leave out.
`
}
