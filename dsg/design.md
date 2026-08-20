# The chrome around the wall

Our own interface has one job and one constraint. The job is to get out of the
way. The constraint is that the thing it surrounds shows five different design
systems at once — Bootstrap blue next to Material purple next to whatever the
visitor just rolled — so any colour we put in the chrome is a colour that fights
one of them.

The reference is Relume's canvas, and what makes it work is not a palette. It is
that the chrome is **greyscale plus one black button**, and that everything
floats on a warm ground instead of sitting in full-width bars.

## The ground is warm, not blue

    --ground   #efeeec      warm off-white, the canvas everything floats on
    --panel    #ffffff      anything you can put content in
    --sunken   #e7e6e3      a track a control sits in (segment, slider)
    --ink      #1c1b19      warm near-black
    --muted    #6b6862      secondary text
    --line     #00000014    a hairline, not a border

A warm neutral is not a taste decision here, it is a technical one: a blue-grey
chrome shares a hue family with half the kits and reads as *our* opinion
bleeding into their preview. Warm grey belongs to nobody.

## Everything floats

No full-width bars and no edge-to-edge sections. Panels are inset from the
window by `12px` and from each other by `12px`, with `10px` corners. The canvas
shows through between them, and that gap is what makes a panel read as an
object rather than as a region of the page.

Shadows stay off. Relume's panels have none; the contrast between `#fff` and
`#efeeec` is the whole separation, and it survives dark mode, printing and a
bad monitor better than a shadow does.

## Controls

    height     36px minimum — 2.5.8 asks 24, we are not going to argue about 12
    radius     10px on panels and toolbars, 8px on things inside them
    button     white with a hairline; the ONE primary action is near-black
    segment    a --sunken track, the active item white
    icon rail  40×40 squares, 10px corners, active is near-black

One primary action per surface. Relume has exactly one black button on screen
and it is the one that costs money; ours is Download.

## Icons are read, not drawn

lucide-static, ISC, read from its own package at build time by `icons.mjs`. Every
icon in this project used to be hand-drawn from memory of the shape, which is
the same mistake as typing a kit's default colour: right by luck, stale by their
next release. A name lucide does not have is a build error, never a blank square.

Stroke 2, size given by the caller, colour always `currentColor`.

## What the chrome may never do

- Introduce a hue. If something needs emphasis, it gets weight or a black fill.
- Put a border on a preview. The wall is dressed by its kit and by nothing else.
- Animate on every change. The stack switch earns a transition; a slider does not.

---

# The marketing site

There already is one, and it has a style. Reading it beats inventing a second —
the same rule this project applies to every kit, applied to ourselves. These are
the live values, read from what uicockpit.com actually serves.

    --mkt-bg        #fff        white, not a warm ground
    --mkt-sunken    #f7f7f8
    --mkt-border    #ececef
    --mkt-fg        #0a0a0b
    --mkt-fg-muted  #6b6b73
    --mkt-fg-faint  #9a9aa1
    --mkt-accent    #007aff     with --k-primary able to override it

Inter and JetBrains Mono. The hero is centred and big:

    h1     clamp(2.5rem, 6vw, 4.5rem) · 600 · -.035em · 1.02 · max 54rem
    sub    clamp(1.0625rem, 2vw, 1.25rem) · muted · 1.5 · max 40rem
    hero   padding 0 1.5rem 6rem, text-wrap balance on both

## The dot grid behind the header

The signature detail, and it is cheap. A 22px grid of 1px dots at 10% black,
faded out downward by a linear mask — and over it the SAME grid in the accent
colour, revealed only inside a 220px circle that follows the pointer.

    .mkt__hero-grid
      background-image: radial-gradient(circle, #0000001a 1px, #0000 1.6px)
      background-size: 22px 22px
      mask-image: linear-gradient(#000 55%, #0000 100%)
      position: absolute; inset: 0; pointer-events: none

    .mkt__hero-grid::after
      background-image: radial-gradient(circle, var(--mkt-accent) 1.3px, transparent 1.8px)
      background-size: 22px 22px
      mask-image: radial-gradient(circle 220px at var(--mx,-9999px) var(--my,-9999px),
                                  black 0%, #0009 40%, transparent 100%)
      transition: opacity .3s

Two custom properties updated on pointermove is the whole interaction. No
canvas, no library, and it costs nothing when the pointer is away because the
mask defaults off-screen.

What changes on the site is the CONTENT — the proposition, and cutting what no
longer applies. Not the typography, not the palette, not the dots.
