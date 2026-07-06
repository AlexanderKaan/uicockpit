# Why I'm building UICockpit

*by Alexander Kaan*

A friend of mine described his last project in a single sentence:

> *"You can vibecode a working app with an LLM in an afternoon. And then you spend
> days tweaking the little things — nudge a colour, make a button a bit bigger,
> swap the dropdown for another one. Again, and again."*

I laughed, because I've been stuck in that exact loop for years — long before an AI was
the one building the app. I did it by hand.

I kept building the same button.

Never quite the same one — a little more padding here, a border that didn't match
there, a "selected" state that looked different on the third tab than the first.
Twenty screens in, the app quietly stopped feeling like one product. Nothing was
broken. It had just drifted.

Design systems, tokens and component libraries all help — I use them. But none of
them fix that, because the drift lives *between* the pieces they hand you. A token
says `--primary` is blue. A component gives you a finished `Button`. Neither tells
you what to do the moment you need something nobody designed yet — and you *always*
need something nobody designed yet.

## So here's the idea

**You design your UI once — turn every knob until it's yours — and then keep it
that way.**

Concretely: you tune colour, type, shape, spacing and motion in a small visual
configurator — a full component gallery updates as you go — until it looks right,
about a minute, no account. Then you export it as a framework-neutral kit (tokens +
component recipes) and drop it into any stack. And it isn't a one-time download:
host it behind a link, come back to re-tune it later, and every app on that link
restyles — so your system stays up to date instead of going stale in a folder.

Because it's a real, machine-readable contract, it also *holds*. Your agent builds
new screens from it instead of guessing, and `npx uicockpit check` flags anything
that drifts off it — a hardcoded colour, an off-grid size, a one-off component.
Whether the drift is an AI next session or you six months later, the whole thing
stays coherent as it grows. Configure once; stay coherent everywhere.

## Why it matters more now

For years the thing turning a design into a screen was a person — and a person
smooths. Hit a gap in the system and you match the spacing by eye, borrow the shape
from the component next door, keep the thread without being told. An agent doesn't.
It builds what it can find and guesses the rest: fast, tireless, no eye. Give it
forty components and it needs the forty-first, so it invents one — reasonable,
plausible, and *just* off your design language. Every guess is a small drift, and
now they pile up in an afternoon instead of over months.

## A language, not a bigger catalog

You can't fix that by drawing more components — there are infinitely many screens
someone might ask for, and you'll never draw them all. That's why the answer is a
language to build *from*, not a catalog to pick *out of*. A fixed kit can, at best,
be *complete*; a language is *generative* — it covers the endless tail of screens
nobody drew.

And the check is what makes it hold. Today `npx uicockpit check` catches the small
sins — a hardcoded colour, an off-grid pixel. Where it's going is the part I care
about most: verifying that even a component that has never existed before was built
only from your design language — not "does this match the catalog," but "does this
belong." A coherence guarantee for things nobody has designed yet. As far as I know,
nobody hands you that.

## What UICockpit is *not*

I want to be honest about the edges, because overpromising is how tools lose trust.

UICockpit is a **look-and-structure** system: colour, type, shape, spacing,
composition. It is deliberately *not* your behaviour layer. Hover, focus, keyboard
navigation, error handling, accessibility wiring — that lives in the component,
done by you or your framework, and done properly. UICockpit's job is to tell the
agent exactly what it must wire and then get out of the way. That boundary isn't a
missing feature. It's the line that keeps the grammar a single, human-authored
source of truth — something agents *compile from* and never quietly turn into
something else.

And to be clear about the neighbours: this isn't a competitor to shadcn or the
component libraries I love and use. They give you the components; we give you the
design language those components wear. We sit a layer above, and we're happy there.
In a word: those are design systems — UICockpit is a design system *generator*. A
design system ships someone else's taste, beautifully themed; a generator is the
machine that makes yours, and then keeps it honest.

## This is ours, not mine

The honest version: I started this because I kept wishing it existed. But a design
grammar is not the kind of thing one person finishes in a garage. A grammar is only
as good as the range of things people throw at it — every screen someone builds that
*doesn't* quite fit is a gift, because it shows exactly where the grammar is still
too thin. I can't generate that range alone. Nobody can. So this is built in the
open, on purpose, from the start.

Here's the deal, plainly:

- **It's free to use.** Configure your design language, export the pack, run the
  check — no paywall on the core. If you're building something with it, it's yours.
- **Contributions are the point, not a favour.** A missing component, a role that
  should exist, a check that's too strict or too loose, a rough edge in the docs —
  open an issue, send a PR, or just tell me it's wrong. The gaps you hit are the
  roadmap.
- **We decide the hard parts together.** How many roles the language needs, where the
  boundary between "us" and "your framework" should sit, what "coherent" even means
  in the edge cases — these are real open questions, and I'd rather argue them in
  public with the people using it than settle them alone and be quietly wrong.

Some of what's above is shipped and working today, and some of it is the direction
we're rowing toward — out loud, so you can row too. The world is moving from *people
who smooth* to *agents that don't*, and that shift needs a layer that keeps the
result coherent without a human eyeballing every gap. I don't think any one person
should own the answer to that. I think it should be a grammar, plus a guarantee,
plus a community that keeps both honest.

That's UICockpit. If this itches for you the way it itched for me — grab it, use it,
break it, and help build the rest. Let's do it together.

— Alexander
