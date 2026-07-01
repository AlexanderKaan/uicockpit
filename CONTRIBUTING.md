# Contributing to UIcockpit

Thanks for helping build the design-language layer above generic primitives. New signature styles,
colour themes, component recipes, export targets, and framework adapters are all very welcome.

## Development setup

```bash
git clone https://github.com/alexanderkaan/uicockpit.git
cd uicockpit/cockpit
npm install
npm run dev          # configurator at http://localhost:5173
```

Stack: Vite + React 19 + TypeScript (strict). All commands run from `cockpit/`.

## The build gate is the authority

A change is "done" when this is green:

```bash
npm run build        # verify:icons → audit:{tokens,type,cascade,parity,components,coverage,modifiers,provenance} → tsc -b → vite build
npx vitest run       # unit + snapshot suite
```

The auditors enforce real invariants: no hardcoded tokens/font-sizes, every control cascades to the
preview, every component the demo app renders traces back to the kit, and no BEM-modifier drift.
**Always run `npm run build` before opening a PR.** If you change tokens, the snapshots drift —
re-baseline with `npx vitest run -u` and confirm the diff is only your change.

## One single source — no mirrors

All exportable component CSS lives in **one place**: `cockpit/src/kit/recipes/` (structured recipe
objects). It feeds *both* the live preview (`src/main.tsx` injects it) **and** every export +
the CDN (`src/export/genCss.ts`). There is no second copy to keep in sync.

- **Component look** → edit the recipe in `src/kit/recipes/`.
- **Global layer** (keyframes, focus, disabled, validation) → `src/kit/globalLayer.ts`.
- **Non-exportable preview scaffolding** (gallery masonry, demo-app chrome) → `src/styles/preview-only.css`.
- **Tokens** → `src/tokens/buildTokens.ts`.

The kit is single-sourced: component CSS lives once in `src/kit/recipes/index.ts` and
feeds both the export and the live preview — edit there, and `npm run build` runs the
full audit suite that keeps everything coherent. Keep it green before opening a PR.

## Common contributions

- **A colour theme** → add it to the theme table in `src/tokens/stylesAndThemes.ts`.
- **A component recipe** → add the recipe object in `src/kit/recipes/`, demonstrate it in a gallery
  card (`src/stage/views/ComponentGallery.tsx`), and use it in a real app screen (the coverage
  audit needs ≥1 live usage). Generic names only (`.radio-card`, never `.delivopt`).
- **An export adapter** (Style Dictionary, CSS-in-JS, Figma variables) → a new `src/export/gen*.ts`
  + a tab in `ExportModal.tsx`.
- **Accessibility fixes** are always welcome.

## House rules

- The **component gallery is the source of truth**; the demo app is built *from* it, never the reverse.
- Keep everything token-driven (`var(--k-*)`) — no hardcoded colours or sizes in recipes.
- Match the existing voice and restraint; this kit aims for shadcn-level taste, not maximalism.

## Pull requests

1. Branch from `main`.
2. Make the change; keep `npm run build` and `npx vitest run` green.
3. Describe **what** changed and **why**; screenshots for any visual change.
4. One focused change per PR.

By contributing you agree your work is licensed under the [MIT License](./LICENSE) and that you'll
follow the [Code of Conduct](./CODE_OF_CONDUCT.md).
