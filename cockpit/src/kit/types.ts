/**
 * The kit's single source of truth — structured recipe objects.
 *
 * Each `Recipe` is one component family's CSS, authored ONCE here and consumed
 * by BOTH the live preview (`scripts/gen-kit-css.mjs` → `kit.generated.css`) and
 * the standalone/CDN export (`genCss.ts`). There is no second copy to mirror —
 * the old `preview.css` ↔ `componentRecipes.ts` drift is gone by construction.
 *
 * The `css` is static, entirely `var(--k-*)`-driven CSS — it never branches on
 * config. Theming happens at the token layer (`:root` / `.dark`), so the recipe
 * text is identical for every kit. Selectors are UNSCOPED (`.btn`, not
 * `.cockpit-preview .btn`) exactly as a CDN consumer needs; the preview codegen
 * leaves component selectors unscoped too (the configurator chrome uses a
 * disjoint class namespace) and only scopes the global layer.
 */
/**
 * Per-component craft rules (LP1 doc-cards) — the Do/Don't knowledge that the
 * class vocabulary alone can't carry: WHEN to reach for the component and how
 * to compose it. One source, three consumers: the design.md export (→ CDN → the
 * MCP's get_design_context), the gallery's best-practices disclosure, and any
 * future per-component docs page.
 */
export interface RecipeDoc {
  /** Imperative craft rules — what a correct usage does. */
  dos: string[]
  /** The anti-patterns this component exists to prevent. */
  donts: string[]
  /** Recipe ids this component typically composes with (reserved; not yet rendered). */
  pairsWith?: string[]
}

export interface Recipe {
  /** Stable id, used by the gates (`audit:provenance`, modifiers). e.g. 'button'. */
  id: string
  /** Human banner emitted as a `/* === … === *\/` comment above the block. */
  section: string
  /** The component's CSS block — `var(--k-*)`-driven, no per-config branching. */
  css: string
  /** Do/Don't craft rules (LP1) — flagship components first; optional elsewhere. */
  doc?: RecipeDoc
}
