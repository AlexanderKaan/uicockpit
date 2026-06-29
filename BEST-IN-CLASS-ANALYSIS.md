# Best-in-class coverage test — 12 expert-canonical apps × UICockpit's knobs

**Why.** Two jobs in one: (1) ground the named "Style" kits in real best-in-class apps
instead of guesswork; (2) STRESS-TEST whether UICockpit's foundation vocabulary can
actually express the best modern design — the foundation-tier sibling of the
`uikit-dumb-build` test. Each app was mapped to one value per knob, then audited for
what the vocabulary **cannot** say.

## The 12 apps (4 clusters)

Technical/minimal: **Linear · Vercel · Raycast** · Premium/fintech: **Stripe · Mercury ·
Ramp** · Productivity: **Notion · Figma · Attio** · Refined-consumer: **Arc · Things 3 ·
Superhuman**.

## Mapping (the expressible skeleton)

| App | radius | scale | font (display/body) | surface | elev | border | neutral | palette | harmony | canvas | motion | mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Linear | subtle | compact | Inter / Inter | outlined | soft | faint | cool | vivid | tonal | neutral | snappy | dark |
| Vercel | subtle | default | Geist(mono!) / Geist | outlined | flat | subtle | neutral | vivid | mono | white/black | smooth | dark |
| Raycast | subtle | compact | Inter+ss03 / Inter | filled | deep | faint | neutral | bright | mono | near-black | snappy | dark |
| Stripe | soft | default | Söhne / Söhne | outlined | soft | faint | cool | vivid | complement | white | smooth | light |
| Mercury | subtle | default | Arcadia(condensed) | outlined | soft | subtle | cool | vivid | tonal | neutral/dark | smooth | split |
| Ramp | soft | default | TWK Lausanne(optical) | outlined | soft | subtle | neutral | vivid | tonal | white | snappy | light |
| Notion | subtle | compact | System / Inter(doc) | plain | soft | faint | warm | pastel | mono | white | smooth | light |
| Figma | subtle | compact | Inter / Inter | outlined | soft | subtle | cool | vivid | tonal | neutral | snappy | dark |
| Attio | soft | default | grotesk / Inter | outlined | soft | subtle | cool | vivid | tonal | white | snappy | light |
| Arc | round | comfortable | System | filled | soft | faint | auto | vivid | expressive | gradient | playful | dark |
| Things 3 | soft | comfortable | System | plain | soft | faint | warm | pastel | tonal | white(warm) | smooth | light |
| Superhuman | subtle | compact | Custom / Custom | plain | soft | subtle | cool | vivid | tonal | neutral/dark | snappy | dark |

**The skeleton maps cleanly.** radius · scale · surface · borders · neutral · harmony ·
accent-hex · mode · motion-bucket landed meaningfully for all 12. UICockpit's range is
**strong on geometry/structure.**

## The coverage gaps — ranked by recurrence (the real result)

UICockpit is weak in exactly two places, and every app's *signature* lives there:

### A. Typography beyond family (THE frontier — recurs in 9/12)
- **Display weight** — Stripe ultralight 300, Mercury bespoke 480, Ramp 400-carries/500-nav. *The premium signal IS weight, and we can't set it.* ⬅ highest-value missing knob.
- **Leading / line-height** — Mercury spacious 1.625, Ramp compressed 0.74 hero. Defining AND opposite; both invisible.
- **Mono as a role** — Vercel headings in Geist Mono, Linear IDs in Berkeley Mono, Raycast numerics. Our 2 sans-slots can't say "mono for headings/IDs."
- **OpenType / stylistic sets** — Raycast ss03, Stripe/Ramp ss01. "Inter" ≠ tuned Inter.
- **Condensed / optical faces** — Mercury condensed, Ramp 11-step optical. None in our list.
- **Tracking** — Stripe −1.4px display, Figma 11px tight UI. No tracking knob.
- **`Custom-upload` is a label, not intent** — hosts a file, encodes nothing about feel.
- **Chrome-vs-content font split** — Notion (System chrome + Inter prose).

### B. Surface richness beyond flat (recurs in 8/12)
- **Material / glass / vibrancy / backdrop-blur** — Arc, Raycast, Things, Superhuman. No `material` axis; we have shadow + fill + border only (a light-web mental model).
- **Mesh / aurora gradients** — Stripe, Linear, Arc, Mercury heroes. Our `canvas: gradient` = one flat 2-stop wash.
- **Glow / bloom on accent** — Linear, Raycast, Superhuman selection states.
- **Dark-elevation-by-lightness** — Figma/Superhuman/Raycast dark UIs separate by lightness steps, not shadow. Our elevation/surface are light-theme models.
- **Texture / grain** — Linear's film-grain dark surfaces.

### C. Color beyond a single accent (recurs in 5/12)
- **Categorical multi-hue data palette** — Notion block-tints, Figma mode-accents, Attio object-tags + generated avatars. We model ONE accent + relationships, not a color *vocabulary for data*.
- **Secondary accent ramp** — Stripe data-viz cyan/teal/orange.
- **Accent-on-surface pairing** — Ramp acid-yellow needs a dark pair.

### D. Single global config (mostly out-of-scope, but real)
- **Per-region density** — Superhuman zone-contrast, Figma inspector vs canvas, Notion chrome vs document. `scale` is one global value.
- **User-switchable themes** — Arc Spaces, Superhuman themes. We configure one.
- **Marketing vs product / hand-tuned light vs dark** — Vercel, Stripe, Mercury run split systems.
- **Table/data-grid tier** — Notion/Figma/Attio: grid weight, header treatment, row density. (= the known "section/header tier" gap, confirmed from outside.)
- **Bespoke iconography** — Things/Superhuman custom marks, Notion emoji. `iconSet` picks a family, not a brand library.

## What to add — ROI order

1. **Display-weight + display-tracking** — cheap, captures the entire premium cluster's signal.
2. **Leading / line-height** — cheap, two apps depend on opposite extremes.
3. **A mono font option (+ "mono for headings/IDs" role)** — addable to the font list; unlocks Vercel/Linear/Raycast.
4. **Mesh-gradient canvas** — medium; Stripe/Linear/Arc heroes.
5. **A material/blur hint + dark-elevation-by-lightness** — medium; every modern dark UI.
6. **Secondary / categorical accent set** — medium; data tools.

The honest headline: **on our CURRENT knobs the 12 apps collapse into ~5–6 distinct looks** — because much of what separates them (weight, mono, material, data-color) lives in the gaps. Adding A1–A3 alone would meaningfully de-collapse them.

## The 7 app-grounded kits (subtle, shared-base)

Each = a subtle restyle of the shared base (scale default · match · soft elevation ·
outlined · vivid · Tonal — constant), varying only radius · font · surface · elevation ·
neutral · palette · canvas. Grounded in the apps above.

| Kit | grounded in | radius | font | surface/elev/border | neutral | palette | feel |
|---|---|---|---|---|---|---|---|
| **Clean** | shadcn baseline | soft | Inter | outlined/soft/subtle | auto | vivid | the safe default |
| **Precision** | Linear · Figma | subtle | Inter | outlined/flat/subtle | cool | vivid | crisp, borders carry |
| **Minimal** | Vercel | subtle | Geist | outlined/flat/subtle | neutral | vivid (mono) | stark greyscale |
| **Refined** | Stripe · Ramp | soft | Inter | outlined/soft/faint | cool | pastel | premium, quiet |
| **Calm** | Notion | subtle | System | plain/soft/faint | warm | pastel | seamless document |
| **Soft** | Things · Arc | round | Inter | filled/soft/faint | warm | pastel | friendly, warm |
| **Editorial** | (serif) | soft | Newsreader | plain/soft/subtle | warm | pastel | calm serif headings |

NB: Precision/Minimal/Refined differ subtly *today* (radius + neutral + flat + font);
they'd separate much more with the mono + weight knobs (A1–A3).
