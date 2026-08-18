# A2UI Cockpit

**Pick the blocks your agent may render. Pick your stack. Copy the catalog and the
renderer — you own both.**

A2UI keeps the catalog (schema) and the renderer (implementation) apart on
purpose: *"the catalog is schema-only… each renderer SDK independently maps
catalog component types to native widgets."* So everyone who defines a catalog
has to build the renderer too, in every framework they target, by hand. There is
no tooling for it, no gallery of catalogs, and the protocol says nothing at all
about accessibility.

This is that tooling — and every answer it renders comes back with a verdict
that says where the guarantee stops.

One real A2UI stream → a custom catalog → a renderer → a conformance verdict.
Runs on plain node, no build, no dependencies.

    node build.mjs && open builder.html     # THE BUILDER: pick blocks, pick your stack, copy both
    node probe.mjs                          # the verdict on a clean answer
    node probe.mjs broken.jsonl bad         # the verdict on a broken one
    node probe.mjs message.jsonl permit_1 --html > out.html

| file | what | regels |
|---|---|---:|
| `core.mjs` | the A2UI core: JSONL stream · data model (RFC 6901) · dynamic values · flat map → tree | 100 |
| `catalog.json` | 2 components (GOV.UK Task list, Summary list) + 1 function + the `instructions` block | 19 |
| `bind-kit.mjs` | binding A — our kit, plain HTML. Renders the refusal in place | 62 |
| `bind-shadcn.tsx` | binding B — shadcn/ui. The artefact the builder would generate; you own it | 63 |
| `bindings.mjs` | **four bindings as TABLES**: our kit · Tailwind · daisyUI · shadcn/ui. `h()` renders the preview, `emit()` writes the artefact you own | 175 |
| `builder.template.html` + `build.mjs` | the clickable palette → one self-contained `builder.html` (no toolchain, mail it to someone) | 230 |
| `demos.json` | one demo node per component — **bound by JSON Pointer**, with its data-model fragment beside it, so the generated code reads `read(data, '/facts')` instead of baking content in | 60 |
| `check.mjs` | the per-answer verdict, **schema-driven**: 8 rules that read declared semantics, never component names · 6 criteria it refuses to claim | 175 |
| `catalogs/` | how to check a catalog you do NOT own: a sidecar stating our reading of Google's Basic Catalog, plus a stub of its names and an example stream | 100 |
| `binding.json` | the CI certificate: 1200 contrast pairs over 60 configurations | — |
| `certify.ts` | generates that certificate from real measurement (`auditContrast` × 60 configs) | 30 |
| `preview.ts` | renders the output into a standalone page with the real tokens + kit CSS | 22 |

Both generators run from the cockpit (they import its token engine):

    cd ../cockpit && npx vite-node ../a2ui/certify.ts   # → binding.json
    cd ../cockpit && npx vite-node ../a2ui/preview.ts   # → preview.html (gitignored)

## A binding is a TABLE, not a program

That is the whole reason a builder is possible. A2UI keeps the catalog (schema)
and the renderer (implementation) apart on purpose, so "support another library"
means adding a mapping, not writing a renderer. The three here are ~40 lines each:

| stack | what it emits |
|---|---|
| **UIcockpit kit** | plain CSS classes — works in any renderer, and it is the one binding with a CI certificate |
| **Tailwind CSS** | utility classes only, no component library |
| **daisyUI** | semantic classes on Tailwind, zero JS, 35 themes — any framework |
| **shadcn/ui** | a real `.tsx` file importing your own components, reading the data model by pointer |

Add a fifth by adding a table. MUI, Ant, Chakra, Mantine, Bootstrap, GOV.UK
Frontend, NL Design System — the class-based ones are an afternoon each.

**What a table has to encode, and a generator gets wrong.** daisyUI ships a
component called `steps`. This binding does not use it for our `Steps`: theirs
is a progress indicator (where you are in a flow), ours is GOV.UK's *step by
step* (what to do, in order). Rendering instructions as a progress bar would
tell the reader something untrue, so `Steps` stays an ordered list. Matching on
the name alone is exactly the mistake a machine makes. The tone vocabulary
differs too — `warn`/`danger` here, `warning`/`error` there — and translating
that is the binding's job, never the agent's.

## A rule may not know a component's name

A rule that looks for `"Button"` works on our catalog and nothing else — and
A2UI exists precisely so that everyone defines their own. But you cannot derive
meaning from a JSON Schema either: a schema describes SHAPE. So the catalog
declares meaning, in a twelve-key vocabulary:

```jsonc
"TaskList": {
  "x-a11y": { "role": "list", "items": "items",
              "itemName": "name", "itemStatus": "status", "itemTone": "tone" },
  "properties": { … }
}
```

For a catalog you do not own, you state your reading in a **sidecar** rather
than guessing at runtime — `catalogs/a2ui-basic.a11y.json` is ours for Google's
Basic Catalog, which declares no accessibility semantics at all:

```bash
node probe.mjs catalogs/a2ui-basic.example.jsonl basic   --catalog=catalogs/a2ui-basic.catalog.json --a11y=catalogs/a2ui-basic.a11y.json
```

Different component names, a different property for emphasis (`style`, not
`variant`) — and the same eight rules find the missing alt text, the field with
only a placeholder, the unnamed control and the two primary actions. No rule
changed.

**And silence is never a pass.** A component the catalog does not have was
*refused* — the renderer showed a refusal, nothing was painted, and that is no
accessibility gap. A component the catalog HAS but never gave semantics to was
painted and could not be checked: it is returned as `unannotated`, by name, and
the verdict drops to `partial`.

## The split that makes the claim honest

Accessibility of a generated answer has two halves, and only one is per-answer:

- **The binding is certified ONCE, in CI.** Contrast, target size, focus ring —
  properties of the implementation and its tokens, not of what the agent asked.
  Measuring per answer is waste; claiming it without measuring is a lie.
  `binding.json` is generated by real measurement (`auditContrast` over every
  theme × mode × density) and travels with the verdict.
- **The answer is checked EVERY time**, here, on the TREE — so it holds for every
  binding, shadcn or Flutter or SwiftUI. Zero deps, microseconds, safe in production.

No certificate → the verdict is `unverified`, never `AA`.

## What it never claims

`check()` returns `unchecked` by name: whether alt text *describes* the image,
whether a heading *describes* its section, whether an error says how to fix it,
the language of the answer — and contrast/target size, which belong to the binding.
Nothing unmeasured is ever counted as passing.
