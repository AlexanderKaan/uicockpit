<div align="center">

# A2UI Cockpit

### Pick the blocks your agent may render. Pick your stack. Copy the catalog and the renderer.

**A2UI keeps the catalog and the renderer apart on purpose** — *"the catalog is
schema-only… each renderer SDK independently maps catalog component types to
native widgets."* So everyone who defines their own catalog has to build the
renderer too, in every framework they target, by hand. There is no tooling for
it, no gallery of catalogs, and the protocol says nothing at all about
accessibility.

This is that tooling.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
![Status](https://img.shields.io/badge/status-early-f59e0b)

</div>

---

## Try it

```bash
cd a2ui && node build.mjs && open builder.html
```

One self-contained page. No install, no server, no CDN. Tick the blocks your
agent may use, switch between **UIcockpit kit · Tailwind · daisyUI · shadcn/ui**, and copy
three things: the `catalog.json`, the renderer for your stack, and the A2UI
stream that produced what you see.

```bash
node probe.mjs                    # the conformance verdict on a clean answer
node probe.mjs broken.jsonl bad   # …and on a deliberately broken one
```

## What it is

- **A catalog** — 12 components, each carrying the source it comes from: GOV.UK,
  USWDS, NL Design System, WAI-ARIA or the HTML spec. Not "because we liked it".
- **Bindings, as tables** — a binding is a mapping, not a program, so adding a
  library is an afternoon rather than a rewrite. Four ship today.
- **A verdict per answer** — eight rules on the answer itself (heading order,
  a control without a name, a table without headers, a status carried by colour
  alone…), plus the binding's CI certificate. And six things it refuses to claim.

## The split that makes the guarantee honest

Accessibility of a generated answer has two halves, and only one is per-answer.

**The binding is certified once, in CI.** Contrast, target size, focus ring —
properties of the implementation and its tokens, not of what the agent asked for.
Measuring them per answer is waste; claiming them without measuring is a lie.
The certificate is generated from real measurement (1200 contrast pairs over 60
theme × mode × density combinations) and travels with the verdict.

**The answer is checked every time**, on the component tree rather than the
markup — so the same rules hold for shadcn, Tailwind, Flutter or SwiftUI.
No certificate → the verdict reads `unverified`, never `AA`.

And what a machine cannot judge is returned **by name**, never counted as
passing: whether the alt text describes the image, whether a heading describes
its section, whether an error says how to fix it.

## Where this came from

This repository was a design-system configurator: 88 components with a
four-layer provenance line each, a code audit that reads 97–99 % of sixteen real
repositories and identified 8 of 8 brands correctly against the running
product's screen, an accessibility matrix at zero violations across six
configurations, a component forge, a CLI and an MCP server. 57 000 lines.

It did too many things, and the part worth keeping turned out to be the smallest
one. All of it is preserved at the tag
[`archive/cockpit-2026-08-17`](../../tree/archive/cockpit-2026-08-17) — nothing
was lost, and every measurement above stays citable. What travelled here is the
kit binding's stylesheet (151 rules extracted from 88 components, down to what
these bindings actually render) and the certificate that library's accessibility
harness issued.

## The repository

    a2ui/
      core.mjs          the A2UI core — stream, data model, dynamic values, tree
      catalog.json      12 components, each with the source it comes from
      bindings.mjs      four bindings, as tables
      check.mjs         the verdict: 8 rules, and 6 things it will not claim
      kit/              the kit binding's stylesheet — plain CSS, yours to edit
      binding.json      the certificate: 1200 contrast pairs over 60 configurations
      builder.*         the palette → one self-contained page (node build.mjs)

About 1 500 lines, no dependencies, no build step for anything that runs.

## Status

Early, and honest about it. The builder runs, the verdict is real, the generated
renderer compiles. Not published to npm, no hosted version, no stable API, and
the catalog is 12 components rather than a set anyone should call complete.

MIT.
