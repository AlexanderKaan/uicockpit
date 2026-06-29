# Foundation coherence — the clash-pair audit

**Thesis.** UICockpit's promise is "make whatever you want, we straighten it." That
guarantee has to hold for the **foundation knobs** too, not just the component
grammar. The knobs are all individually good — but some *combinations* pull in
opposite directions and produce an incoherent (ugly) kit. The canonical example:
`Scale: compact` (tight density — 32px controls, 16px padding) + `Text size: XL`
(h1 = 38px) = towering headings crammed into a dense layout.

The wrong fix is shadcn-style **removal** (delete knob positions until nothing can
clash). We keep every position; we make the *combinations* coherent-by-construction.
Three mechanisms, in order of preference:

- **COUPLE** — make one knob a function of another so the pair stays proportional
  (the type hierarchy re-centers on the chosen density). Nothing is removed; every
  position still resolves, just harmonized. ← preferred.
- **CLAMP** — bound one knob's range by another (only when coupling can't express it).
  Mildly removes reach at the extreme.
- **GUARD** — a coherence invariant that auto-corrects or flags a broken combination
  (the I2 selected-edge that survives any Elevation/Surface/Border combo is one).
- **LEAVE** — the pair is *two valid options*, not a clash (a square card with pill
  buttons is a deliberate style, not a bug). Don't manufacture a rule.

This is the foundation-tier sibling of the component **Invariant Engine**
(`COMPONENT-CRAFT.md` Part V): there, craft laws became non-regressing checks; here,
knob-pairs become coherence guarantees.

## The matrix (17 knobs → the pairs that can clash)

| # | Pair | How it goes incoherent | Verdict | State |
|---|------|------------------------|---------|-------|
| 1 | **Scale × Text size** | dense layout + huge display type (compact + XL) | **COUPLE** | ✅ **SHIPPED** (pilot) |
| 2 | **Elevation × Surface × Border** = the *surface-separation* family | Flat + Plain + Faint ⇒ blocks don't separate from the page | **GUARD** | ✅ **SHIPPED** (pilot 2) — engine floors the edge if all three go off; panel LOCKS the dissolving option (visible padlock). |
| 3 | **Palette × Harmony × Neutrals** = the *colour-temperature/saturation* family | cold accent + warm neutrals; over-saturated accent ramp | **GUARD** | ✅ **VERIFIED** — 96 extreme Palette×Neutral×Harmony×mode combos, **0 WCAG-AA fails** (worst anchor 4.54). `clampToAA` anchors + CP-guardrails (Expression 150%) + harmony engine hold across the whole space. Temperature pairings (warm-grey + cool accent) are deliberate two-valid styles, not breaks. No engine work needed. |
| 4 | **Display font × Body font** | two clashing families (two display serifs, a script body) | LEAVE / soft-recommend | ⚪ taste/content — a curated *pairing* hint is the only honest guard; not a hard rule. |
| 5 | Box radius × Button radius | square card + pill button | LEAVE | ⚪ two-valid-options — a real, deliberate style. |
| 6 | Scale × Radius | big fixed radius on tiny compact controls | LEAVE | ⚪ pills cap at half-height; fixed radii read fine on small controls. |
| 7 | Motion × Motion-tempo | snappy base + generous tempo | — | ✅ composed multiplicatively by design (`MOT_BASE × TEMPO`); coherent by construction. |
| 8 | Icons × Scale | icon glyphs not tracking text/density | — | ✅ `--k-icon-xs/sm/md` are rem-based (track text) — C2 sweep. |

**The honest finding:** it is *not* "21 knobs all clash." Only **two families** needed
engine work — type×density and surface-separation — both now shipped + deployed. The
colour family was verified clean (0/96 WCAG fails); everything else is coherent-by-design
or a genuine two-valid choice. That respects "all the options are good": they are — the
incoherence was narrow, and it's now closed.

## Pilot #1 — Scale × Text size (SHIPPED)

`buildTokens.ts`, right after the `TS[typeScale]` lookup. Density modulates the
**display contrast** — how far the heading tier (h1/h2/h3) out-sizes body:

```
HIER_CONTRAST = { compact: 0.85, default: 1, comfortable: 1.08 }
heading = round( body + (heading_raw − body) × HIER_CONTRAST[scale] )
```

- We compress the **gap above body**, not a flat multiplier — so h3 never collapses
  into body, and **body/small are untouched** (they keep the 13–14px readability
  floor the `TS` table guards).
- **`default` scale is the identity** — the default kit and every export snapshot are
  byte-for-byte unchanged. Only off-default combinations re-center.
- Every S/M/L/XL still resolves and stays **distinct** — nothing removed.

Effect on the canonical clash:

| | h1 | h2 | h3 | body |
|---|----|----|----|------|
| compact + XL **before** | 38 | 27 | 19 | 16 |
| compact + XL **after** | **34.7** | **25.4** | **18.6** | 16 |
| comfortable + XL after | **39.8** | 27.9 | 19.2 | 16 |

Compact flattens the hierarchy to suit its density; comfortable lets it tower.

## Pilot #2 — surface-separation (SHIPPED, GUARD + visible lock)

A block must separate from the page by ≥1 channel. The three, and when each CARRIES
the separation (`coherence.ts`, the single source for both layers):

- **shadow** — `surfaceDepth !== 'flat'`
- **border** — `surface === 'outlined'` OR `borders !== 'faint'` (a faint hairline
  alone is too weak to be the sole separator)
- **fill** — `surface === 'filled'`

The only fully-invisible combination is therefore exactly **flat + plain + faint**.

Two layers, same rule:

1. **Engine floor** (`buildTokens.ts`, the real guarantee — holds for export/CDN/agent):
   `guardedBorders(cfg)` floors the block edge to `subtle` when all three channels are
   off. A no-op for every other config (blast radius = exactly the broken corner).
2. **Visible lock** (`Panel.tsx`, the honesty Alexander asked for): when two channels
   are already off, the *third knob's dissolving option LOCKS* instead of silently
   correcting —
   - on the **Segmented** Surface knob, `plain` is **disabled + padlocked**;
   - on the **Slider** Elevation/Border knobs, the lock raises the slider's **min**
     (you physically can't drag past the floor) and shows a padlock.
   Release by turning another channel back on. `wouldZeroSeparation(cfg, override)` is
   the shared predicate, so the lock and the engine agree by construction.

Verified live: at `flat + plain + subtle` the Border slider clamps to `subtle` (min
raised, padlock); at `flat + outlined + faint` the Surface `plain` segment is disabled
with a padlock while `filled` stays free. "Make whatever you want, we straighten it" —
shown, not silently done.
