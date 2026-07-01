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
- **Compose the kit's recipes — don't hand-roll.** ~80 classes cover most jobs:
  atoms (\`.btn\` \`.in\` \`.select-trigger\` \`.badge\` \`.chip\` \`.avatar\` \`.switch\`/\`.toggle\` \`.radio\`),
  data (\`.tbl\` \`.datatable\` \`.list\` \`.dl\` \`.stat-tile\`/\`.stat-tile-grid\`), forms (\`.formpanel\` \`.field\`),
  nav/shell (\`.toolbar\` \`.navrow\` \`.navsuite\` \`.sidenav\` \`.scaffold\` \`.page-head\` \`.section\`),
  overlays (\`.menu\` \`.dialog\` \`.popover\` \`.toast\`), filters (\`.filterbar\` \`.searchinput\` \`.combobox\`).
  **The FULL catalog (every class + its modifiers) is in \`contract.json\` → \`components.classes\`;
  \`design.md\` has each recipe's intent + how to compose it. Consult them before inventing a class.**
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

## Behaviour contract (what the kit does NOT ship)
The kit is CSS + tokens — look, layout, composition, a11y *structure*. It ships NO JS
behaviour runtime; you wire interaction yourself (or use your framework's primitive —
Radix / Headless UI / cmdk):
- **State via aria, not just a class.** Selected toggle/segmented/tab → set \`aria-checked\`
  / \`aria-selected\` / \`aria-pressed\` (the recipe styles off the attribute, so the a11y
  truth drives the visual). Open menus/dialogs need focus-trap + Esc + focus-return.
- **Listboxes & custom triggers** (select-trigger · combobox · dropdown · menubar ·
  navmenu): you own keyboard nav (arrows / typeahead / Esc) + open/close. Prefer the
  NATIVE \`<select class="select">\` (fully accessible, zero JS) when a native control fits.
- **OTP / slider:** wire focus-advance+paste / keyboard + \`aria-valuenow\` yourself.
- **Overlays** (popover · tooltip · hover-card) open ONE static side (placement modifiers
  e.g. \`.tt__pop--bottom\` / \`--left\` / \`--right\`, \`.popover--top\` / \`--end\`); there's no
  JS collision-flip — pick the side that clears the viewport edge, and portal the overlay
  if a parent clips it.
- **Scroll-area** styles the NATIVE scrollbar (Chromium + Firefox); Safari keeps the OS
  default — best-effort, degrades gracefully. Don't expect a pixel-identical thumb cross-browser.

## This kit at a glance
- Brand \`var(--k-primary)\` = ${tk.primaryHex} · Scale ${cfg.scale} (control height ${h})
- Radius ${cfg.radius} · Button shape ${cfg.buttonShape} · Surface ${cfg.surface} · Elevation ${({ flat: 'Flat', soft: 'Soft', deep: 'Deep' } as const)[cfg.surfaceDepth]}
- Type: ${cfg.fontDisplay} display / ${cfg.fontBody} body · Icons ${lib.label}
- Full values + rationale live in **design.md**; the live \`tokens.css\` link is the source of truth.

## Verify — run this after EVERY change, not once (the loop that actually binds)
The rules above are a nudge; a fresh session — or a later you — drifts anyway (a wrong
blue, an off-scale radius, a magic \`20px\`). Nothing catches that by eye. So after **every**
UI edit, run the verifier against this pack's \`contract.json\` and treat a violation like a
failing test — fix it before you move on:

\`\`\`bash
npx uicockpit check          # or, over MCP: call the check_conformance tool
\`\`\`

It flags hardcoded hex, off-grid spacing, magic px and wrong tokens. Re-run until clean.

**Make it automatic** so coherence survives a fresh context window: add \`npx uicockpit check\`
as a **pre-commit hook and/or a CI step**. That turns "please use the token" into a check that
**fails the build** on drift — the only thing that reliably holds across many screens, sessions
and hands.
`
}
