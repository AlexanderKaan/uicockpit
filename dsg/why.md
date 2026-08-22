# What this is, and who it is for

**The start of your design system, whatever you build in.**

Not a component library. Not a React tool. You bring one colour and a handful of
decisions; you leave with a real design system written in the vocabulary of a
kit somebody else maintains — its variables, its class names, its own idea of
what a border is.

## Whatever you build in

Nine kits sit in the picker and **five of them ask nothing at all of your app**.
Tailwind, daisyUI, Bootstrap, Material 3 and Open Props name no framework in
their own manifests, so they run in Vue, in Svelte, in Rails, in a folder of
HTML files. Four — shadcn/ui, Radix Themes, Mantine, Ant Design — name React as
a peer dependency and are closed to everybody else.

That split is read out of the packages, never decided here, and the picker says
it on every card before you set a single knob. A tool that let someone on Vue
theme Mantine for ten minutes and then handed them a package they cannot
install would be worse than no tool.

It would be a sharper position to say "React design systems" — the four hardest
kits here are React, and the four-band model that makes sense of them is a
React-shaped idea. It would also throw away the two most-installed things in the
list, and Tailwind is the *engine* under two of the others. So the audience is
everybody, and the honesty about who can use what is the product rather than a
disclaimer.

## Nine kits, and no more for now

The catalogue is closed on purpose while the idea is being tested. What is here
already covers every KIND of kit there is:

| | how it publishes what it is |
|---|---|
| Tailwind · daisyUI · Bootstrap · Open Props | a stylesheet you can read |
| Material 3 | a generator: one seed, forty-seven roles |
| shadcn/ui | its own source, in a registry |
| Ant Design | nothing at all — it has to be run |

Element Plus, Vuetify and Bulma are all the first kind. Adding them is rows, not
reach, and each row is a promise to keep it working. When the catalogue grows it
should be because a kit answers a question none of these nine can.

## The rules that do not bend

**Nothing here is ours.** Every variable, class name and element on the wall
belongs to the kit that publishes it. The meter counts this and prints a number:
anything less than 100% is something we made up, named out loud.

**Where a kit has no answer, it says so.** A part a kit ships no component for
is drawn from that kit's tokens and declared as drawn — never quietly
substituted. Material has no data table; Ant Design has no chart. Those are
facts about them, and a wall that hid them would be a wall you cannot trust.

**Read the kit's own published pair, take the relationship out of it, put your
value through it.** Their dark mode, their scale, their derivation — our number.
This is the rule the whole tool keeps arriving back at, and every time it has
been broken the result has been a value we invented wearing somebody else's
name.
