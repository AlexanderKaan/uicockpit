import { buildTokens } from '../tokens/buildTokens'
import type { Config } from '../tokens/types'
import { auditContrast } from '../tokens/extras'
import { RECIPES } from '../kit/recipes'
import {
  tierOf,
  usesOf,
  idsByTier,
  orphanAtoms,
  STANDALONE_ATOMS,
  type Tier,
} from '../kit/segments'

/**
 * Fase D1 — `contract.json`, the machine-readable artefact.
 *
 * BRIEF.md / the AI-prompt are the HUMAN/LLM-prose views of a kit. This is the
 * view *tooling* builds on: a closed, enumerable description of the kit — its
 * token vocabulary, its component graph, the BEM class vocabulary, and the rules
 * as DATA (not prose) — generated from the same single source as every other
 * export. It is what `uicockpit check` (D4) reads to verify an arbitrary codebase
 * against the design contract.
 *
 * Pure + deterministic: a function of `cfg` only (no timestamps), so it
 * snapshots cleanly and the kit's identity stays the config that made it.
 */

const CONTRACT_SCHEMA_VERSION = 1

/* The kit's BEM vocabulary, extracted from the static recipe CSS (the single
 * source). Each class selector splits into root / part / modifier:
 *   .btn            -> root 'btn'
 *   .btn--primary   -> root 'btn', modifier 'primary'
 *   .card__head     -> root 'card', part 'head'
 *   .list__item--on -> root 'list', part 'item', modifier 'on'
 * The recipe CSS is config-independent (themes at the :root token layer), so
 * every class is literal here — no dynamic-class guessing needed. */
interface ClassEntry {
  modifiers: string[]
  parts: string[]
}
function extractClasses(recipes: readonly { css: string }[]): Record<string, ClassEntry> {
  const SEL = /\.(-?[A-Za-z_][\w-]*)/g
  const roots = new Map<string, { modifiers: Set<string>; parts: Set<string> }>()
  const get = (root: string) => {
    let e = roots.get(root)
    if (!e) { e = { modifiers: new Set(), parts: new Set() }; roots.set(root, e) }
    return e
  }
  for (const r of recipes) {
    for (const m of r.css.matchAll(SEL)) {
      const cls = m[1]
      if (!cls) continue
      // modifier = the segment after the FIRST `--`; base = everything before it.
      const dd = cls.indexOf('--')
      const base = dd === -1 ? cls : cls.slice(0, dd)
      const modifier = dd === -1 ? null : cls.slice(dd + 2)
      // part = the segment after `__` in the base.
      const uu = base.indexOf('__')
      const root = uu === -1 ? base : base.slice(0, uu)
      const part = uu === -1 ? null : base.slice(uu + 2)
      if (!root) continue
      const e = get(root)
      if (part) e.parts.add(part)
      if (modifier) e.modifiers.add(modifier)
    }
  }
  // Deterministic: sort roots, modifiers, parts.
  const out: Record<string, ClassEntry> = {}
  for (const root of [...roots.keys()].sort()) {
    const e = roots.get(root)!
    out[root] = {
      modifiers: [...e.modifiers].sort(),
      parts: [...e.parts].sort(),
    }
  }
  return out
}

/* The system's invariants, as DATA. `check` (when present) names the machine
 * verification `uicockpit check` runs against a consumer codebase; rules without
 * a `check` are contract-of-record (true by construction inside the kit, not
 * verifiable from the outside). Severity drives the checker's exit code. */
interface ContractRule {
  id: string
  statement: string
  severity: 'error' | 'warn' | 'info'
  check?: 'tokens-exist' | 'no-raw-color' | 'spacing-grid' | 'radius-scale' | 'font-size-scale' | 'known-modifiers'
}
const RULES: ContractRule[] = [
  { id: 'tokens-exist', severity: 'error', check: 'tokens-exist',
    statement: 'Every var(--k-*) reference must resolve to a token defined in this contract.' },
  { id: 'no-raw-color', severity: 'warn', check: 'no-raw-color',
    statement: 'Use the --k-* colour tokens, not raw hex / rgb / hsl literals — this is the anti-generic guarantee.' },
  { id: 'spacing-on-grid', severity: 'warn', check: 'spacing-grid',
    statement: 'Spacing (margin / padding / gap) should use the --k-s-* scale or land on the 4px grid.' },
  { id: 'radius-from-scale', severity: 'warn', check: 'radius-scale',
    statement: 'border-radius should use the --k-radius-* tokens, not arbitrary px.' },
  { id: 'font-size-from-scale', severity: 'warn', check: 'font-size-scale',
    statement: 'font-size should use the --k-type-* scale, not hardcoded px.' },
  { id: 'known-modifiers', severity: 'error', check: 'known-modifiers',
    statement: 'A kit class written as root--modifier must use a modifier this contract defines.' },
  // Contract-of-record (true by construction inside the kit) ─────────────────
  { id: 'primary-never-rotates', severity: 'info',
    statement: 'The brand primary hue never rotates; Harmony governs only the derived secondary/accent/decorative family.' },
  { id: 'one-recipe-per-pattern', severity: 'info',
    statement: 'Each UI pattern has exactly one recipe — the single source feeds both the live preview and every export.' },
  { id: 'unscoped-drop-in', severity: 'info',
    statement: 'Component CSS is unscoped and token-driven, so it drops into any app at :root without a wrapper class.' },
  { id: 'app-subset-of-gallery', severity: 'info',
    statement: 'Every class the product surface renders is defined in the exportable kit and demonstrated in the gallery.' },
  { id: 'modifiers-defined-and-demoed', severity: 'info',
    statement: 'Every root--modifier is defined in CSS and its variant axis is demonstrated.' },
  { id: 'control-height-invariant', severity: 'info',
    statement: 'Buttons, inputs and selects share one height per scale tier (32 / 36 / 44), so controls align in a row.' },
]

export function genContract(cfg: Config): string {
  const tk = buildTokens(cfg)
  const V = tk.vars
  const dark = buildTokens({ ...cfg, mode: 'dark' }).vars

  // Token vocabulary — the flat name->value map, plus the dark-mode deltas.
  const tokens: Record<string, string> = {}
  for (const k of Object.keys(V).sort()) tokens[k] = String(V[k])
  const tokensDark: Record<string, string> = {}
  for (const k of Object.keys(dark).sort()) if (dark[k] !== V[k]) tokensDark[k] = String(dark[k])

  // Component graph — the tier model + declared `uses` edges, straight from the
  // segment graph (the single machine source for the component MODEL).
  const TIERS: Tier[] = ['foundation', 'atom', 'block', 'shell']
  const tiers = Object.fromEntries(TIERS.map((t) => [t, idsByTier(t)])) as Record<Tier, string[]>
  const recipes: Record<string, { tier: Tier; section: string; uses: string[] }> = {}
  for (const r of RECIPES) {
    recipes[r.id] = { tier: tierOf(r.id), section: r.section, uses: [...usesOf(r.id)] }
  }

  const out = {
    $schema: 'https://uicockpit.com/contract/v1',
    contractVersion: CONTRACT_SCHEMA_VERSION,
    name: 'uicockpit-kit',
    // The Config IS the kit's identity — the contract is content-addressed by it.
    config: cfg,
    tokens,
    tokensDark,
    components: {
      tiers,
      recipes,
      classes: extractClasses(RECIPES),
      standalone: [...STANDALONE_ATOMS].sort(),
      // The coverage worklist — should be empty for a valid kit (every atom has
      // a home block or is a blessed standalone primitive).
      orphans: orphanAtoms().sort(),
    },
    rules: RULES,
    accessibility: {
      pairs: auditContrast(tk).map((p) => ({
        label: p.label,
        ratio: p.ratio,
        required: p.required,
        passes: p.passes,
      })),
    },
  }

  return JSON.stringify(out, null, 2)
}
