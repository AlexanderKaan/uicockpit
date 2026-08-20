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
