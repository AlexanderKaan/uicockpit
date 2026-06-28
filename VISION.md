# UICockpit — the coherence compiler

> A token names a decision. A component is a whole assembly. The value lives in
> the gap between them — and that gap is where coherence is won or lost.

## The one line

**UICockpit isn't a component library. It's a coherence compiler.**

Configure your design language once → and you get not 40 components, but the
*grammar* that makes every component you'll ever assemble come out coherent —
including the ones you haven't thought of yet.

## Why now

It used to be a human reading your design files, smoothing drift over by eye.
Now it's an agent. An agent doesn't smooth anything — it builds exactly what it
finds and guesses the rest. A finite catalog of components guarantees that,
sooner or later, the agent needs one you never built — and guesses. Every guess
is a drift away from your design language.

You cannot win this by drawing more boxes. There are infinite screens a person
might want, and you will never draw them all.

## The shift: from catalog to grammar

- A **token** holds one decision (`--k-primary`, `--k-radius-lg`).
- A **component** is a finished assembly (`.card`, `.btn`).
- The decisive layer is the one **between** them: the recurring bundles every
  component is quietly made of — *a raised surface*, *a cozy inset*, *a
  section-title type set*, *a selected state*, *an emphasized column*.

Most systems bake those bundles invisibly into each component. So an agent that
needs a *new* component has nothing to recombine — it hand-rolls the bundle off
your grammar, and drifts. UICockpit names that middle layer and hands it to the
agent as building blocks. **The agent composes; the grammar guarantees the result
belongs.**

## How it holds together (the moat)

A grammar would be a nice idea without enforcement. UICockpit ships the
enforcement: `npx uicockpit check`. Today it catches a hardcoded hex or an
off-grid pixel. The trajectory: it verifies that *anything* an agent assembles —
a component that has never existed — is built only from your grammar. That is a
**coherence guarantee for things not yet designed.**

A finite kit can, at best, be "complete." A grammar plus a verifier is
*generative* — it covers the infinite tail of screens nobody drew.

## The honest boundary

A style grammar is look, layout, structure. Hover, focus, error, behaviour, and
accessibility live in the component, wired by you or your agent. UICockpit is
deliberately a *look + structure* system and says so — its **behaviour contract**
tells the agent exactly what it must wire (state via aria, keyboard for custom
controls, overlay placement). That isn't a gap. It's the line that keeps the
grammar a single, human-authored source of truth that agents *compile from* and
never quietly become.

## Where this sits

- **vs component libraries (shadcn et al.):** they hand you a fixed set of
  beautiful components to copy. We hand you the *language* those components are
  made of — open-ended, and re-themeable in one config.
- **vs generative-UI renderers (A2UI / AG-UI):** they render an agent's UI spec
  against a *fixed catalog*; an off-catalog request falls flat. Our catalog is
  open, because the agent composes from a grammar instead of picking from a menu —
  and the verifier keeps the result coherent.

## The bet, stated plainly

> A token names a decision. A *hypertoken* names a decision you keep making. A
> *grammar* names how those decisions combine — so the thing reading your files
> can build what you didn't think to draw, and still get it right.

---

*This document is the canonical narrative. The marketing site and the repo README
are derived from it — edit here first.*
