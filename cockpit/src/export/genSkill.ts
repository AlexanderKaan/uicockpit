import { buildTokens } from '../tokens/buildTokens'
import type { Config } from '../tokens/types'
import { ICON_LIBS } from './iconLibs'

/* The SKILL file — the binding layer. design.md is the SPEC (read once, lives in
 * the repo); this is the ENFORCEMENT layer: short imperative "always / never"
 * commandments an agent loads EVERY session, plus a self-check step that points
 * back at design.md + contract.json. Rules-as-context is a nudge; the thing that
 * actually binds is the write → `uicockpit check` → fix loop in the footer.
 *
 * Body is agent-agnostic; the delivery filename + any frontmatter (Claude SKILL.md,
 * Cursor .mdc, AGENTS.md) is chosen at delivery time (Slice 3), not here. */
export function genSkill(cfg: Config): string {
  const tk = buildTokens(cfg)
  const lib = ICON_LIBS[cfg.iconSet]
  // Matched button+input height per Scale (same mapping genBrief/genAiPrompt use).
  const h = cfg.scale === 'compact' ? '32px' : cfg.scale === 'comfortable' ? '40px' : '36px'

  return `# UICockpit design-system rules

You are building inside a configured design system. Apply it to every component
you create or restyle. These are the binding rules — load them every session.

## Always
- **Read a token, never a literal.** Colour → \`var(--k-primary)\` / \`--k-fg\` / \`--k-surface\`…;
  spacing → \`--k-pad\` / \`--k-space\` / \`--k-stack-gap\`; radius → \`--k-radius-*\`;
  type → \`--k-type-*\`; shadow → \`--k-shadow-*\`; motion → \`--k-dur-*\` / \`--k-ease-*\`.
  A hardcoded \`#hex\`, \`gap: 7px\` or \`font-size: 15px\` opts that element out of theming.
- **Primary actions** use \`var(--k-primary)\` bg + \`var(--k-primary-fg)\` text — solid, never a gradient.
- **Button and input share one height** per the Scale (this kit: ${cfg.scale} → ${h}); an action
  row like \`[input] [Submit]\` sits on one baseline. Never mix \`.btn--sm\` with a default \`.in\`.
- **Compose the kit's recipes**, one family per pattern: \`.btn\` \`.card\` \`.in\` \`.tbl\` \`.list\`
  \`.dl\` \`.stat-tile\` \`.segctrl\` \`.menu\` \`.toolbar\` \`.navrow\`. Reach for the component that
  owns the job (data surface → Data table; form → Form panel; filter a list → Filter bar).
- **Status** uses the system colours (\`--k-success\` / \`-warning\` / \`-danger\` / \`-info\`,
  each with \`-fg\` + \`-soft\`); pair colour with text/icon, never colour alone (WCAG 1.4.1).
- **Real semantics:** a button is \`<button>\`, a link is \`<a>\`, inputs carry their \`type\`;
  every control has an accessible name; \`:focus-visible\` ring on everything interactive.
- **Icons:** ${lib.label} only — \`${lib.install}\`. Don't mix libraries.
- **Dark mode:** add \`.dark\` to a parent; the tokens re-resolve. Respect \`prefers-reduced-motion\`.

## Never
- Never hardcode a colour, radius, spacing, font-size, shadow or duration.
- Never put a gradient on a button, or use a system status colour for decoration.
- Never hand-roll a pattern that already has a recipe, or fork a one-off per-screen variant.
- Never scale chart bars / sliders / toggle knobs / avatars with the theme radius — those are
  fixed (3–4px or 999px). Never use \`--k-type-small\` (12px) for sentence content.
- Never rewrite the app's logic to fit the kit — re-skin look/layout/composition only.

## This kit at a glance
- Brand \`var(--k-primary)\` = ${tk.primaryHex} · Scale ${cfg.scale} (control height ${h})
- Radius ${cfg.radius} · Button shape ${cfg.buttonShape} · Surface ${cfg.surface} · Elevation ${({ flat: 'Flat', soft: 'Soft', deep: 'Deep' } as const)[cfg.surfaceDepth]}
- Type: ${cfg.fontDisplay} display / ${cfg.fontBody} body · Icons ${lib.label}
- Full values + rationale live in **design.md**; the live \`tokens.css\` link is the source of truth.

## Verify (the loop that actually binds)
After you apply the kit, run the verifier against this pack's \`contract.json\` and
fix what it flags — don't trust the rules alone, agents drift:

\`\`\`bash
npx uicockpit check
\`\`\`

It catches hardcoded hex, off-grid spacing, magic px and wrong tokens. Re-run until clean.
`
}
