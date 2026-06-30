# The Role Canvas — a universal role→treatment layer

> **Status:** concept / foundation draft (2026-06-30). The *name* is a placeholder
> ("role canvas" / "role", "trait", "treatment-layer" are candidates — deferred).
> This doc captures the thesis, the empirical case, and the external validation, so
> we have a foundation before we pick a name or write code.

## The gap (the thing that doesn't exist yet)

Atomic design, tokens, primitives — all real, named, understood. But they describe
*things* (values, components, taxonomy). None of them is a **universal design
language**: a place where the rules that make *any* element cohere live, independent
of which element it is. Today those rules live **inside** each component — every
recipe re-declares its own height, its own selected-state, its own focus ring. Result:
60 self-contained blocks, each subtly different, and **drift**. And because the rules
are baked per-component, an **unknown** component a user brings has nothing to inherit
— it can only be styled by an author who remembers all the rules.

shadcn/Tailwind feel more usable not because their components are better, but because
they're more clearly *described* against a shared vocabulary. We need to go further: a
layer where universal design rules are fixed **on one canvas**, keyed to the **role** a
part plays — so coherence is inherited, not re-authored, and an unknown element styles
itself.

## The thesis

> A small, **closed set of roles** (control, surface, selectable, text-slot,
> tone-bearer, overlay…). Each role declares a **guaranteed treatment** (height,
> focus-ring, hit-target, selected-edge, separation, AA-derived ink, truncation,
> scroll-containment). Any markup — *including a component the system has never seen* —
> opts into roles via a tag. The canvas styles it.

The decoupling is the whole point: **what a thing *is*** (its content/semantics) is
separated from **how it must look and behave** (the universal rules). You never need to
know it's a "seat-picker row"; you need to know it contains a *control* that is
*selected* on a *surface* with a *text-slot*. Four role-tags → fully, coherently styled
— component never seen before.

## Why now — the sweep proved it empirically

The 11-component best-practice sweep (`component-best-practices/SYSTEM-LEARNINGS.md`)
found that the **same** handful of gaps recur across unrelated idioms because they're
**grammar gaps, not knowledge gaps**. The four perceptual/state invariants are applied
ad-hoc 15–70%:

- **height (I1)** is the STRONG one — `--k-control-h-*` is shared by button·input·select
  → **zero drift**. *This is the existing proof that one role, centralised, works.*
- **selected-edge (I2)**, **focus-ring (I3)**, **hit-target (I4)** lag — re-implemented
  or forgotten per recipe — *precisely because they were never centralised the way
  height was.*

The Role Canvas is simply: **do for the other roles what we already did for height.**
The sweep's L1–L6 are the *content* of the canvas; the invariant-engine is its
*enforcement* half; A2UI is its *demand* half. Four threads, one layer.

## External validation — the fusion is unclaimed

Five research passes (shadcn/CVA · Radix/Ark/React-Aria · Open UI/ARIA · CSS
`:state()`/`@layer`/SMACSS/BEM · the design-token semantic layer · classless/CUBE/A2UI)
converged: **the ingredients all exist in the wild; nobody ships the fusion.**

| Near-neighbour | Closest on… | Where it stops (our gap) |
|---|---|---|
| **ARIA 1.2** | a *closed role + state set* | "a role guarantees an a11y-tree entry — **never a pixel**" |
| **shadcn `data-slot`** | the **mechanism** (central data-attr styling) — *the one to watch* | slots are per-component & ad-hoc; no closed roles, no guarantees |
| **Radix/Ark/React-Aria** | normalised state hooks (`data-state`/`data-part`) | deliberately treatment-free; only their own components |
| **Material 3 "color roles"** | the **terminology** ("roles", on-X) | **color-only**; sizing lives in per-component tokens |
| **EightShapes / Spectrum tokens** | component tokens | per-component, per-state; a new component gets nothing |
| **Classless CSS (Pico…)** | styling **unknown markup** | keyed off the HTML *element*, not a role; a `<div>` gets nothing |
| **CUBE CSS** | global-first cascade philosophy | open-ended, author-defined; no closed role contract |
| **A2UI / generative-UI** | the **goal** (coherent emitted UI) | renders a **fixed catalog**; doesn't style the arbitrary unknown |

**The demand side confirms it too.** Every shipping generative-UI system
(A2UI · Vercel v0 · Thesys C1 · CopilotKit/AG-UI · MCP-UI · Shopify Polaris) answers
coherence one of two ways: **constrain to a known catalog** ("out-of-catalog components
fail validation") or **inject tokens and hope** the LLM applies them. *None* style the
novel. "Styling the unknown rather than whitelisting the known, with a `check` to
enforce it, is a real, unoccupied position in the generative-UI stack." A2UI's
renderer-controlled `variant` model ("agents provide semantic hints, not visual styles;
renderers decide how it looks") is the closest precedent and the right **interop
target** — same instinct, but it stops at a closed catalog exactly where the Role
Canvas extends to arbitrary compositions.

**The positioning lines that fell out:**
- "Semantic tokens give a role a **value**; we give a role a **treatment**."
- "Material has **color** roles; we add **perceptual** roles."
- "Classless CSS styles the unknown by **element**; we style it by **role**."
- "A2UI renders a **fixed catalog**; we're its missing **styling layer**, not its rival."

**The substrate is free and standards-blessed.** We don't invent the role/state
vocabulary: **ARIA** already gives a closed role + state set (`aria-selected`,
`aria-disabled`, `aria-expanded`, `aria-checked`), **`data-slot`/`data-part`** is the
ready keying mechanism, and **`@layer`** is the cascade container. The empty
bovenverdieping — the binding *role/state → guaranteed treatment, enforced from one
place* — is ours. New enough to own; grounded enough to work today.

**Watch-item:** shadcn `data-slot` is closest on mechanism and *could* evolve toward
this — but today it pushes the opposite way (specific per-component slots, no
guarantees). There's a window.

## The model — the role × state matrix

The canvas is literally a table: **rows = roles, columns = states, cells = the
guaranteed treatment.** Drawn from the sweep (✓ = already centralised, ⚠ = the work):

| Role | rest | hover | selected | focus | disabled |
|---|---|---|---|---|---|
| **Control** ✓ | `control-h` + hit-floor | state-hover | — | inset ring | disabled wash |
| **Selectable** ⚠ | — | state-hover | **selected-edge** + fill | inset ring | `aria-disabled` |
| **Surface** ⚠ | elevation + separation | — | — | focus-within | — |
| **Tone-bearer** ⚠ | tint + **aaInk** fg | — | solid + aaInk | — | muted |
| **Text-slot** ⚠ | truncate / clamp | — | — | — | — |
| **Overlay** ⚠ | max-height + scroll + scrim | — | — | trap + return | — |

The matrix doubles as a **coverage map** (which cells are filled) and a **drift
detector** (a component deviating from a cell lights up). The role set must stay
**small and closed** — that closure is what makes it a language rather than another
open token pile.

## How it works (sketch — to be specced)

1. **Declare** the matrix once, in its own `@layer` (`recipes` → references it).
2. **Key** treatments to a tag — adopt the `data-slot` / ARIA-state convention:
   `[data-role~="control"]`, `[data-role~="selectable"][aria-selected]`, etc. (final
   syntax = open question: data-attr vs `.is-*` class vs both).
3. **Compose**: every existing recipe stops re-declaring and instead *wears* roles
   (button = `control`; chip-on = `selectable[aria-selected]`). Drift → structurally
   impossible.
4. **Enforce**: extend `audit:state-edge`/`audit:focus` to assert every role-tagged
   part carries its guaranteed treatment — a closed gap can't reopen.
5. **Supply**: `get_design_context` emits the **roles + their guarantees**, not 60
   per-component CSS dumps — so an agent building an unknown component tags roles
   instead of inferring craft. (This is the behaviour-carrying SUPPLY from L4.)

## Three lenses on one model (the visualization)

These aren't three features — they're three views of the same matrix, mirroring the
loupe's continuous-zoom philosophy. New IA altitude: **Tokens (values) → Roles (rules)
→ Components (compositions).**

1. **The matrix** — the model *edited*. The canonical declaration + audit surface.
2. **The X-ray overlay** — the model *inspected on real UI*. Cheap to add to the
   existing loupe Inspect mode: a "Roles" lens that colours each part by role; an
   unknown component visibly decomposes into known roles.
3. **The playground** — the model *exercised on new UI*. Blank markup + drag role-tags
   → watch it style. The generative proof + the A2UI/marketing demo. Later.

## Open questions (before code)

- **Name.** "Role canvas" / "role" / "trait" / "treatment-layer". Own "role → treatment".
- **Role-set closure.** Is six right? (control · selectable · surface · tone-bearer ·
  text-slot · overlay). What about *divider/edge*, *media*, *field-group*? Closure is the
  hard design call.
- **Binding syntax.** `data-role` attribute vs `.is-*`/role class vs lean on ARIA
  states directly. Probably: ARIA states for what ARIA already names + a thin
  `data-role` for the perceptual roles ARIA doesn't (control/surface/text-slot).
- **Migration order.** Start with `selectable` (the #1 scattered gap) — retrofit
  chip·list·nav·table onto one `selectable` role, prove drift→0 + audit-enforced, like
  the height invariant already proves the model.

## Lineage

Supersedes nothing; *unifies*: [[hypertoken-coherence-compiler]] (the "missing middle
layer" it names), [[invariant-engine]] (the enforce rail), the
`component-best-practices` sweep (the content), [[a2ui-agent-driven-rendering]] (the
demand). The height invariant is the working proof-of-one-role.
