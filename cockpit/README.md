# cockpit/ — the app

The Vite + React 19 + TypeScript app for UIcockpit — the configurator, the live
preview, and the token engine.

- **What it is + how it fits →** the [root README](../README.md) · [roadmap](../docs/roadmap.md).
- **Dev:** `npm run dev`
- **Build (runs the full audit + type gate):** `npm run build`
- **Tests:** `npx vitest run`

The kit is single-sourced: component CSS lives once in `src/kit/recipes/index.ts` and
feeds both the export and the live preview.
