# UICockpit — positioning

> Companion to [VISION.md](./VISION.md). VISION is the *why* (the coherence-compiler
> idea). This is the *where* and the *when*: what it is, what it does, why it exists,
> when to reach for it — and the exact slot it claims in the stack.

## The one line

**Tailwind is how you style. shadcn is what you assemble. UICockpit is the design
language that makes it yours — and keeps it that way.**

Short form: **the design layer for the AI dev stack.**

## What · does · why · when

**What it is.** The design-language layer of the modern (AI) front-end stack. Make a
handful of taste decisions — colour, type, shape, density — and UICockpit compiles
them into framework-neutral `--k-*` tokens, matching component recipes, and an
*enforceable contract*.

**What it does.** Makes everything you or your agent build look like one designed
product — and keeps it coherent as the app grows, because `uicockpit check` catches
drift the moment it appears.

**Why it exists.** An AI agent builds exactly what it finds in your files and guesses
the rest. A finite catalog of components can never cover every screen, so the agent
guesses, and the UI drifts. Nothing else in the stack *owns the design language and
enforces it*: Tailwind is unopinionated, component kits ship a default look, and design
tokens in Figma don't run and drift from code. That ownership is the gap we fill.

**When to reach for it.** At the start of any app where you care how it looks (set the
language once), and on every build after (the agent applies it; the verifier keeps it
honest). Especially when an AI writes your UI.

## Triangulation — what we are, by what we are not

- **Not Tailwind.** Tailwind is *how* you write styles (utilities). We are the
  *decisions* those utilities encode — the layer above it.
- **Not shadcn / Radix.** They give you components and behaviour. We give you the
  *design language* that makes any components — theirs, yours, or the agent's — look
  like the same product. We sit above them, framework-neutral.
- **Not Figma / Style Dictionary / Tokens Studio.** They author the design *source*,
  but it doesn't run, it drifts from code, and it needs handoff. We are executable,
  framework-neutral, read directly by the agent, and *self-enforcing*.
- **Not A2UI / generative-UI renderers.** They render an agent's UI against a *fixed
  catalog*. We are the *open grammar* the agent composes against — coherent even for
  components nobody drew.

```
   who builds it       you + your AI agent   (Cursor · Claude Code · v0 · Lovable · Bolt)
   what they assemble  shadcn/ui + Radix, or hand-rolled markup
   how they style it   Tailwind / CSS
  ──────────────────────────────────────────────────────────────────
 ▶ the design language  UICockpit  —  owned · executable · framework-neutral · enforced
  ──────────────────────────────────────────────────────────────────
   where design lives   Figma + tokens   (authoring; doesn't run; drifts; handoff)
```

## Where we sit in the dev loop — the three touchpoints we own

UICockpit isn't a one-time asset; it's threaded through the build loop:

1. **Define** — at kickoff: configure the language → export / `npx uicockpit init`.
   *"Give my app a look."*
2. **Apply** — on every agent edit: the MCP server / skill / `AGENTS.md` teach the
   agent the contract. *"Build it on-brand."*
3. **Verify** — continuously / in CI: `npx uicockpit check`. *"Did we drift? Fix it."*

**Define → Apply → Verify.** Own all three and you're not a library someone installs
once — you're in the loop every time the UI changes.

## The sentence to leave them with

*Someone has to own how your app looks, and keep it that way. In an AI dev stack that
owner has to be executable, framework-neutral, and self-enforcing. That's UICockpit.*
