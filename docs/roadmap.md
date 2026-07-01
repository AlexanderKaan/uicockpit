# UIcockpit — Roadmap

UIcockpit is built in the open. This is the honest picture: what works today, what
we're building next, and where we're headed. It's a direction, not a promise of dates —
and the gaps you hit while using it are the best input we get, so [open an issue](https://github.com/alexanderkaan/uicockpit/issues)
or a PR.

Legend: ✅ shipped & live · 🚧 in progress · ⏭ next · 🔭 exploring

---

## ✅ Shipped — works today

- **The configurator** — ~19 visual controls (Style · Brand · Type · Shape · Surface ·
  Motion) that resolve into one coherent design language. Start from a named style
  (Clean, Precision, Minimal, Refined…) and make it yours.
- **Framework-neutral tokens** — everything exports as plain `--k-*` CSS variables that
  drop into plain HTML, React, Vue, Svelte, Tailwind, shadcn — anything.
- **100+ component recipes** — real per-component CSS (buttons, inputs, dialogs, tables,
  charts, nav…) with full hover / focus / disabled state contracts, not just tokens.
- **The hosted live kit** — `kit.uicockpit.com/k/<key>.css`, byte-identical to the file
  you'd download, so the `<link>` and the export never disagree.
- **Agent-native** — `npx uicockpit init` writes the tokens + a machine-readable
  contract, and `npx uicockpit check` verifies what your agent builds stays on the
  language. Plus a **MCP server** (`uicockpit-mcp`) exposing the kit to Claude / Cursor /
  Windsurf.
- **The Role Canvas** — a small, closed set of roles (control · selectable · surface ·
  tone-bearer · text-slot · overlay), each guaranteeing one perceptual treatment. Any
  markup that tags a role — via `data-role` or the ARIA state that names it — inherits
  that treatment, so even a component we never built comes out coherent. Enforced in the
  build; visible live in the app's loupe.
- **WCAG AA audit** — every kit's contrast pairs (text on surfaces, buttons on fills,
  status colours on their tints) are checked before you export.
- **7 export formats** — CSS · JSON · Tailwind config · shadcn `globals.css` · a design
  brief · an AI-prompt pack · the contract.

Free, no account — your whole setup lives in the URL.

---

## 🚧 In progress

- **Coverage across real screens** — a set of reference-grade app archetypes (billing,
  issues, inbox, CRM, calendar, analytics, files, settings, pricing) that collectively
  exercise every component, so the demo and the coverage guarantee are the same surface.
- **Deeper agent context** — teaching `get_design_context` the full composition grammar
  (part anatomy + rules), so an agent composes from the language instead of guessing.

---

## ⏭ Next

- **A tiny behaviour shim** — an optional ~1KB script for vanilla / LLM-generated HTML
  that wires the universally-safe ARIA toggles (expand, check, select). Hard accessibility
  (focus-trap, ESC, keyboard) stays with your framework — we're the styling + coherence
  layer, not a behaviour library.
- **Stateful live kits** — a shareable `/kit/<id>` you can reopen and re-tune, so
  "tweak once → every screen updates along" holds over time.
- **One-click signature styles** — zero-config starting points that give a first-timer a
  genuinely good kit in a single click.
- **Mobile polish** — finishing the responsive pass on the app's own chrome.

---

## 🔭 Exploring

- **The coherence compiler** — the north star. Not a component library but the *grammar*
  that makes any component cohere, plus a verifier that guarantees it. A finite kit can be
  "complete"; a grammar + a check is *generative* — it covers the infinite tail of screens
  nobody drew. ([The full thinking →](../VISION.md))
- **Generative-UI fit** — as agents move toward emitting UI specs against a themed catalog,
  UIcockpit is the styling layer that keeps the rendered result coherent.
- **Role-set closure** — is six roles the right closed set? This is an open question we'd
  rather argue in public with the people using it.

---

## How to help

- **Hit a wall?** A missing component, a role that should exist, a check that's too strict
  or too loose, a rough edge in the docs — that's exactly the signal we want. Open an
  issue or a PR.
- **Building something with it?** Tell us what the pack didn't determine for you — the
  decisions it left you to guess are our next work.

See [`CONTRIBUTING.md`](../CONTRIBUTING.md) to get started.
