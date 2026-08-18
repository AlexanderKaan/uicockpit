<div align="center">

# A2UI Cockpit

### Take a standard A2UI component. Point a library at it. Copy the catalog and the renderer.

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

One self-contained page, split down the middle: **what your agent sent** on the
left, **what the reader gets** on the right, with the verdict on it.

The left half is a text box, not an output. Paste the stream your agent
produced — JSONL, a JSON array, or a single message out of a log — and it
renders in your stack and gets checked. If the stream names a catalog the page
knows, it switches to it; if the JSON is broken it tells you which line.

The page itself is built out of the kit it ships — same tokens, same recipes,
same contrast floors — so a regression in the kit shows up in the tool before it
shows up in anyone's product. A CSS scope limit keeps that honest: chrome styles
stop dead at the preview, so nothing the page wears can reach the answer.

Or build a stream by ticking components. You land on **Google's A2UI Basic
Catalog** — the 18 components every A2UI renderer is expected to know — switch
between **UIcockpit kit · Tailwind · daisyUI · shadcn/ui**, and copy three
things: the A2UI stream, the `catalog.json`, and the renderer for your stack.

The second tab is our own **public-service extension** — the components a
form-and-status service needs that the Basic Catalog has no name for (a task
list, a summary list, a step-by-step, a status badge). Same bindings, same
verdict, one switch.

```bash
node probe.mjs                    # the conformance verdict on a clean answer
node probe.mjs broken.jsonl bad   # …and on a deliberately broken one
node --test test.mjs              # the meter: 17 tests over both catalogs
```

## What it is

- **Two catalogs** — Google's Basic Catalog as it is published, and our
  public-service extension: 12 components, each carrying the source it comes
  from (GOV.UK, USWDS, NL Design System, WAI-ARIA, the HTML spec), never
  "because we liked it".
- **Bindings, as tables** — a binding is a mapping, not a program, so adding a
  library is an afternoon rather than a rewrite. Four ship today, and each one
  covers both catalogs: the same component name renders the same way, and where
  the two differ in shape the table absorbs it (our Button carries a `label`,
  A2UI's takes a child `Text`, one case handles either).
- **A verdict per answer** — eight rules on the answer itself (heading order,
  a control without a name, a table without headers, a status carried by colour
  alone…), plus the binding's CI certificate. And six things it refuses to claim.
  The rules read semantics the catalog *declares*, never component names, so they
  work on a catalog you did not write — including Google's Basic Catalog, through
  a sidecar that states the reading instead of guessing it.

## What the check found, in Google's catalog and in our own

Running the verdict over the Basic Catalog reports three things no renderer and
no agent can fix, because the vocabulary to fix them is not in the schema:

| | |
|---|---|
| `Video` | `url` and `posterUrl`, and nothing else — there is no property that can carry a text alternative, so 1.1.1 cannot be met |
| `Modal` | `trigger` and `content` — the dialog has no name for 4.1.2 |
| *no heading* | `Text` offers `caption` and `body` and no level, so nothing rendered from this catalog has structure to navigate by (1.3.1) |

These are reported apart from findings about the answer, because they are not
the answer's fault. A gap the answer actually *runs into* caps the verdict at
`partial` and names the catalog; a gap sitting unused is listed and nothing more.
This is meant as a contribution to a young protocol, not a scoreboard — the
`instructions` field and the sidecar together are enough to close all three.

It found things in **our own** work too, which is the point of owning a meter:

- extending the certificate to the controls this catalog made us render found a
  checked checkbox at **1.61:1** against its surface in two dark themes — below
  the 3:1 that 1.4.11 asks of a state indicator. It is in `binding.json`, by
  name, and the certificate says 54 of 60 rather than rounding up;
- measuring the built page found target sizes under the 24px WCAG 2.5.8 asks —
  a checkbox row at **17px** in the kit binding, a disclosure at 20px in
  Tailwind and shadcn, a range input at 16px everywhere. All fixed. The
  certificate used to list target size among the things "measured in CI"; that
  measurement belonged to the archived library's harness and its own markup, so
  the claim now says exactly that instead;
- the Role Canvas floor binds the selected treatment to ARIA, and the `tab`
  recipe has one of its own — so a selected tab wore both an underline and an
  inset ring. A recipe with its own treatment has to switch the floor off
  through the token the floor reads;
- the kit turned out to have **two tone vocabularies** (`badge--warn` but
  `alert--warning`), so a Callout with tone `warn` had been rendering with no
  tone at all;
- the kit had **no divider recipe** at all, and a bare `<hr>` in a flex column
  collapses to nothing.

## The split that makes the guarantee honest

Accessibility of a generated answer has two halves, and only one is per-answer.

**The binding is certified once, in CI.** Contrast, target size, focus ring —
properties of the implementation and its tokens, not of what the agent asked for.
Measuring them per answer is waste; claiming them without measuring is a lie.
The certificate is generated from real measurement — 1500 contrast pairs over 60
theme × mode × density combinations — and travels with the verdict, including
the part that failed: 54 of those 60 configurations are clean, the other six are
named. A certificate that rounded that up would be the thing it exists to
prevent.

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
      catalogs/         Google's Basic Catalog, its demos, and the a11y sidecar
      catalog.json      our public-service extension, each with its source
      bindings.mjs      four bindings, as tables, over both catalogs
      check.mjs         the verdict: 8 schema-driven rules, and 6 things it will not claim
      kit/              the kit binding's stylesheet — plain CSS, yours to edit
      binding.json      the certificate: 1500 contrast pairs, 54 of 60 clean
      test.mjs          the meter (node --test)
      builder.*         the palette → one self-contained page (node build.mjs)

About 2 300 lines, no dependencies, no build step for anything that runs.

## Status

Early, and honest about it. The builder runs, the verdict is real, the generated
renderer compiles, and 17 tests hold both catalogs against all four bindings.
Not published to npm, no hosted version, no stable API. Tabs render as
disclosures in the class-based bindings rather than as a scripted tab widget,
and only the kit binding has a certificate — the other three read `unverified`,
which is what they are.

MIT.
