import type { Config } from '../tokens/types'
import { genBrief } from './genBrief'
import { componentModel, bestPractices } from './genAiPrompt'

/* design.md — ONE doc, two voices. The headline artifact of the "Use this kit"
 * pack: the human handoff (what the system is + every token + the rules, from
 * genBrief) followed by a delimited `## For your AI agent` appendix carrying the
 * composition contract genBrief lacks (the tier ladder from the segment graph)
 * plus the imperative framing an agent needs to APPLY the system.
 *
 * It deliberately does NOT re-dump the tokens — genBrief already embeds the full
 * tokens.css once. The SKILL file (genSkill) is the short enforcement layer that
 * points back here + to contract.json; this is the spec it enforces. */
export function genDesignMd(cfg: Config): string {
  return `${genBrief(cfg)}

---

## For your AI agent — applying this system

Everything above is the spec. This appendix is the imperative layer: how an AI
coding agent should *apply* it. Load it into your agent's rules (Cursor
\`.cursorrules\` / a \`CLAUDE.md\` / \`AGENTS.md\`), or use the dedicated **skill file**
in this pack — it's the short, always-on version of these commandments.

**The contract, in one breath:** you are building inside a design system. Use the
\`--k-*\` tokens for every component you create — colours, radii, spacing, fonts,
shadows, transitions. Never hardcode a literal; a hardcoded value silently opts
that element out of theming, and the user's UI drifts back out of alignment.
Touch only look / layout / composition — never rewrite the app's logic to fit the
kit.

${componentModel()}

${bestPractices()}

## Verify your work

This pack ships a machine-readable \`contract.json\`. After applying the kit, run
the verifier to catch drift (hardcoded hex, off-grid spacing, magic px, wrong
tokens):

\`\`\`bash
npx uicockpit check
\`\`\`

Fix what it flags. The hosted \`tokens.css\` link in this pack is the single source
of truth for the values — if the live link and your local copy disagree, the live
link wins. The skill file in this pack restates these rules as short imperative
"always / never" commandments for an agent to load every session.
`
}
