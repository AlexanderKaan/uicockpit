# Why this exists

The argument is over. Almost nobody still believes a model should emit
executable interface code into a running product. The pattern that won is a
*controlled vocabulary*: the model names components from a list the application
published, with typed properties, and the application renders them through
components it owns and tested. Sonu Kapoor put it in one line in InfoWorld:
["Let the model compose. Let the application control."][iw]

Google's A2UI protocol is the same idea, standardised: a schema-only catalog on
the wire, a renderer per platform, a data model kept apart from the components.

So the architecture is settled, and it is also easy. A union type, a registry
object, a Zod schema and a `parse` — an afternoon's work, and every team is
writing their own. If that were the whole job there would be nothing to build
here.

It is not the whole job. The pattern stops in four places, and the gap between
"the model cannot invent a component" and "what the reader gets is any good"
is where this project lives.

## 1 · A schema validates shape, not meaning

`safeParse` returns `success` and the field still has no label.

That is not hypothetical. In Google's own Basic Catalog, `ChoicePicker`,
`Slider` and `DateTimeInput` each have a `label` property — and none of them
*requires* it. Every schema generated from that catalog, by hand or by us,
admits an unlabelled input. It is valid, it renders, and a screen-reader user
is told nothing about what they are filling in.

Validation asks *is this the right shape*. Somebody still has to ask *is this
answer usable*, and that question is answered on the component tree, after the
schema is happy. Eight rules, run every time, on any catalog: heading order, a
control with no name, a field with no label, a table with no headers, an image
with no alternative, status carried by colour alone. Plus six things it refuses
to claim, returned by name rather than counted as passing.

## 2 · Silence is not a refusal

The registry pattern, as it is usually written, ends `if (!Component) return
null` — and the parse ends `return []`. Both make a piece of the answer
disappear with nothing said. The reader sees a gap and cannot tell whether the
agent had nothing to say or the application refused what it sent. The developer
sees nothing at all.

A refusal is a result. It renders in place, it says what was refused and why,
and it is counted separately from an accessibility failure — because a
component the catalog does not have was correctly turned away, while a
component it *has* and never gave semantics to was painted and could not be
checked. Conflating those two is dishonest in both directions.

## 3 · The catalog itself can be the failure

Every version of this pattern says the same reassuring thing: accessibility
lives in the components. It is not true, and it is checkable.

Run the verdict over the A2UI Basic Catalog and three things come back that no
renderer, no design system and no agent can fix:

| | |
|---|---|
| `Video` | `url` and `posterUrl`, and nothing else — no property can carry a text alternative, so WCAG 1.1.1 cannot be met |
| `Modal` | `trigger` and `content` — the dialog has no accessible name for 4.1.2 |
| *no heading* | `Text` offers `caption` and `body` and no level, so nothing rendered from this catalog has structure to navigate by (1.3.1) |

Those are properties of the *vocabulary*, not of anyone's implementation. They
are reported apart from findings about the answer, because they are not the
answer's fault — and they are the strongest argument that a catalog is a thing
worth reviewing before you hand it to an agent.

This is meant as a contribution to a young protocol, not a scoreboard. The
`instructions` field and a sidecar close all three.

## 4 · Rendering is not permission

The pattern is careful here and right: an action registry, authorised on the
server, keyed by ids the application owns. But it says nothing about the
catalog, and the catalog is where it leaks.

A2UI's Basic Catalog **requires** every `Button` to carry an `action` — and
enumerates not one action anywhere. The property is a free string. So nothing
between the agent and the click can tell an allowed action from an invented
one, and a control can be painted that implies a capability the user does not
have. A catalog that names its side effects can be checked; one that does not
puts the whole question on the application, silently.

Ours enumerates them. The check reads the enum and fails an answer that asks
for anything else.

## What this is, then

A builder for A2UI catalogs **and** their renderers. You take the standard
components, point a library at them — plain CSS, Tailwind, daisyUI, shadcn/ui —
and copy out three things you then own: the catalog, the renderer for your
stack, and the catalog as types you can validate with. A binding is a table, not
a program, so adding a library is a mapping rather than a rewrite.

And every answer gets a verdict, on the tree rather than the markup, so the same
rules hold whatever you render with.

## What it is not

It is not a component library with a chat interface, it does not put a model in
the render path, and it does not claim what it has not measured. The binding
certificate says 54 of 60 configurations rather than rounding up to *certified*,
because extending it to the controls this catalog made us render found a checked
checkbox at 1.61:1 in two dark themes. Measuring our own page found four target
sizes under the 24px WCAG asks. Both are written down, and one of them is still
open.

That is the standard we are asking of a catalog. It would be strange to hold
ourselves to a lower one.

[iw]: https://www.infoworld.com/article/4210616/a-better-approach-to-generative-ui.html
