# Badge & chip — best-practice library + compliance scan

> Component: `.badge` (+ `.chip` · `.taginput__chip` · `.att-chip` · `.meta-status` · `.rating`) · recipe `cockpit/src/kit/recipes/index.ts:1110–1227` (badge), `:5704–5775` (chip), `:3616–3678` (tag-input), `:4208–4285` (att-chip), `:4288–4399` (inline-status meta), `:109–120` (rating) · scanned 2026-06-30

Scope note: this audit covers the **status/token idiom** as a family. The kit deliberately
splits it into FIVE distinct atoms with different metaphors, and the split itself is a
best-practice answer (Material/M3 call the same split badge-vs-assist-chip-vs-input-chip):

- **`.badge`** — PASSIVE status / tag text ("Healthy", "Overdue", "PDF"). Not a control.
- **`.badge--count`** — numeric digit-in-a-circle (nav counters, notification counts).
- **`.chip`** — INTERACTIVE chip (real `<button>`): assist / filter (`--on`) / input (`--input`) / suggestion.
- **`.taginput__chip`** / **`.att-chip`** — removable token INSIDE an input / a file pill.
- **`.meta-status`** — inline live-status dot row (online/away/busy); **`.rating`** — star scale.

Where a rule is a sibling atom's job (e.g. removable hit-target lives on `.chip`/`.taginput`,
not on passive `.badge`), the scan says *Delegated* rather than failing `.badge` for it.

Grounding: Linear / Stripe / Notion / Attio status pills · Apple HIG (badges, tags) · shadcn/ui
Badge · Material 3 (badge + the 4 chip species: assist/filter/input/suggestion) · Carbon Tag ·
Adobe Spectrum (Badge, status-light) · IBM/Polaris status semantics. Severities align to the 10
craft laws in `COMPONENT-CRAFT.md` (esp. L4 hit-target / I4, L6 state-completeness / I2 selected-edge).

---

## A. Best-practice library (supply)

### Tone ladder & contrast (soft vs solid)
1. **A 5-rung semantic ladder — success / warning / danger / info / neutral — each a named pair, never raw hue.** [LOAD-BEARING] — status is the badge's whole job; a fixed vocabulary lets one class carry meaning to colour-blind-safe + dark-mode-safe pairs. `.badge--success{background:var(--k-success-soft);color:var(--k-success-soft-fg)}` … one rule per tone.
2. **Every tone ships BOTH a soft (low-emphasis fill) and a solid (high-emphasis) form.** [LOAD-BEARING] — Stripe/Linear use soft for resting status, solid for "act now"; one emphasis axis the consumer picks per density. `.badge--solid-success{background:var(--k-success);color:var(--k-success-fg)}` etc.
3. **The text colour of each fill is contrast-DERIVED, not hand-picked.** [LOAD-BEARING] — a status pill that fails AA is the classic illegible-selected-state bug (Invariant Engine). `--k-{tone}-soft-fg = aaInk(soft)` and `--k-{tone}-fg = aaInk(main)` (`buildTokens.ts:479–481`) recompute per light/dark so contrast holds at every theme.
4. **Tone hues lean ≤15° toward the brand so the ladder reads as family with any accent.** [polish] — un-harmonised semantics clash with a strong brand hue. `harmonizeHue(h0, ph)` per status (`buildTokens.ts:474`).
5. **A primary/brand badge for UI-driven counters ("New", notification count) — distinct from the fixed semantic blue of info.** [polish] — "new" is a brand statement, not an info status; conflating them mis-colours. `.badge--solid-primary{background:var(--k-primary)}` + `.badge--primary` soft.
6. **Complete the role matrix: a soft chip for every role, incl. accent/tertiary.** [polish] — gaps force agents to hand-roll an off-grammar fill. `.badge--accent{background:var(--k-accent-soft);color:var(--k-accent-soft-fg)}`.

### The dot / leading icon
7. **A leading status DOT for the "neutral pill + coloured live-dot" pattern (the Linear/Vercel status idiom).** [LOAD-BEARING] — a dot encodes status without spending the whole pill on colour, and survives colour-blindness when paired with a label. `.badge__dot{width:6px;height:6px;border-radius:50%;background:currentColor}` (inherits tone; override inline for a green dot on a neutral pill).
8. **A leading ICON sits optically centred with the label, never baseline-misaligned.** [LOAD-BEARING] — a tiny check/info glyph that floats is the #1 badge crafting tell. `line-height:1` + `.badge>svg{flex-shrink:0;display:block}` (the `.btn` centering trick).
9. **Status dots have a SHARED semantic vocabulary (online/away/busy → success/warning/danger) + a token size.** [polish] — three teams inventing three dot colours = no system. `.meta-status__dot--online{background:var(--k-success)}` … sized off `--k-dot` (`buildTokens.ts:1158`); online adds a pulse ring.
10. **An anchored badge (dot or count pinned to a host's corner) with a surface-coloured ring for legibility on any host.** [LOAD-BEARING] — bell/avatar/tab counts must read on top of arbitrary content. `.anchor__badge{position:absolute;…;box-shadow:0 0 0 2px var(--k-surface)}`.

### Removable chip & hit-target
11. **A removable token's × must reach the WCAG-2.2 24px hit floor even though the glyph stays small.** [LOAD-BEARING] — craft L4 / Invariant I4; a 16px × is a sub-target miss (was one of the 4 found). `.chip__remove::before / .taginput__remove::before / .att-chip__x::before { width/height: var(--k-hit-min) }` centres a 24px click area.
12. **The remove control is keyboard-reachable + labelled, not a bare glyph.** [LOAD-BEARING] — screen-reader users must remove tokens; `aria-label="Remove …"` is a usage obligation. Real `<button class="chip__remove">` + `aria-label` in gallery + showcases.
13. **Mid-string truncation on a long file/token label (clip the middle, keep the extension).** [polish] — Apple Finder pattern; clipping the end hides ".pdf". `.att-chip__label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}` (+ direction:rtl trick noted in comment).

### Selected / toggle chip state
14. **A filter/toggle chip has an unambiguous SELECTED state distinct from hover, on a real container colour.** [LOAD-BEARING] — craft L6 state-completeness; "selected looks like hover" is a core failure. `.chip--on{background:var(--k-secondary-soft);border-color:transparent;color:var(--k-secondary-soft-fg)}`.
15. **Selected state is announced, not just painted (`aria-pressed` / `role=radio aria-checked`).** [LOAD-BEARING] — toggle semantics are invisible to AT without it. Usage carries `aria-pressed={…}` (gallery `ChipsCard`) and `role=radio aria-checked` (showcase `chips`).
16. **The selected edge should match the kit's cross-component selected-edge invariant (I2).** [polish] — table/list/menu selection should read identically; a chip that only fills (no `--k-selected-edge` inset) is a minor inconsistency. **Not applied** — `.chip--on` is fill-only.

### Sizing parity, shape & truncation
17. **Interactive chips sit one control-scale notch under buttons, on the shared height ladder.** [LOAD-BEARING] — chips next to buttons must align (craft L1/toolbar invariant). `.chip{min-height:var(--k-control-h-sm)}`.
18. **Badge radius FOLLOWS the box radius (square theme → square chip), but count-chips/dots stay pill by metaphor.** [LOAD-BEARING] — a pill chip in a square kit breaks the signature. `.badge{border-radius:var(--k-badge-radius,var(--k-radius-md))}` vs `.badge--count / .badge__dot / .anchor__badge--dot{border-radius:999px}`.
19. **Count chips use tabular figures + an em-based circle that hugs 1 digit and auto-pills at 2+.** [LOAD-BEARING] — "99+" must not jump the layout and digits must not jitter. `.badge--count{height:1.5em;min-width:1.5em;font-variant-numeric:tabular-nums;border-radius:999px}`.
20. **A long single-badge label should cap/truncate so a status pill can't blow out a table cell or row.** [LOAD-BEARING] — an un-truncated badge in a fixed cell pushes the layout; the field expects `max-width`+ellipsis on the pill. **Absent on `.badge`** (only `.att-chip__label` truncates).
21. **Disabled chip fades rather than inheriting the global opaque grey box (a transparent control must stay transparent).** [polish] — a transparent assist chip turning into a grey box on disable looks broken. `.chip:disabled{background:transparent!important;opacity:var(--k-disabled-opacity)}`.

---

## B. Compliance scan (check)

| # | Rule | Status | Evidence (recipe line / usage file, OR "absent") | Delegated? | Severity |
|---|------|--------|--------------------------------------------------|-----------|----------|
| 1 | 5-rung tone ladder | ✅ PASS | `.badge--success/warn/danger/info/neutral` recipe `:1138–1142`; rendered `badge--${tone}` in sections.tsx:25,576,656,765 | — | — |
| 2 | Soft + solid per tone | ✅ PASS | solid set `:1145–1148` + `--solid-primary/info`; soft set above. Solid shown in gallery (`badge--solid-primary/danger`:2263,2373) | — | — |
| 3 | Contrast-derived text colour | ✅ PASS | `aaInk(soft)` / `aaInk(main)` `buildTokens.ts:479–481` — AA per light/dark, per tone | — | — |
| 4 | Tone hues brand-harmonised | ✅ PASS | `harmonizeHue(h0, ph)` `buildTokens.ts:474` | — | — |
| 5 | Brand/primary counter badge | ✅ PASS | `.badge--solid-primary`:1152 / `.badge--primary`:1153; used in nav count:2263 | — | — |
| 6 | Accent soft completes matrix | ⚠️ PARTIAL | `.badge--accent`:1156 DEFINED but never rendered in gallery or showcases | No | LOW |
| 7 | Leading status dot | ✅ PASS | `.badge__dot`:1221; "neutral pill + green dot" gallery:3694–3695; `<span class="badge__dot"/>` in table status sections.tsx:437,656,707,768 | — | — |
| 8 | Leading icon optically centred | ✅ PASS | `line-height:1`:1133 + `.badge>svg{flex-shrink:0;display:block}`:1137 | — | — |
| 9 | Shared dot vocab + token size | ✅ PASS | `.meta-status__dot--online/away/busy`:4310–4325 → success/warn/danger; size `var(--k-dot)`:4305 | — | — |
| 10 | Anchored corner badge + ring | ✅ PASS | `.anchor__badge{box-shadow:0 0 0 2px var(--k-surface)}`:1207–1214; gallery anchored count+dot:2370–2377 | — | — |
| 11 | Remove × ≥ 24px hit floor | ✅ PASS | `::before{width/height:var(--k-hit-min)}` on `.chip__remove`:5772 · `.taginput__remove`:3664 · `.att-chip__x`:4284 | — | — |
| 12 | Remove is a labelled `<button>` | ✅ PASS | real `<button aria-label="Remove …">` gallery:843,3615 + sections | Yes (usage) | — |
| 13 | Mid-string label truncation | ✅ PASS | `.att-chip__label` ellipsis `:4257–4259` (Finder rtl trick noted) | — | — |
| 14 | Selected ≠ hover toggle state | ✅ PASS | `.chip--on{background:var(--k-secondary-soft);color:var(--k-secondary-soft-fg)}`:5745–5749 | — | — |
| 15 | Selected state announced (aria) | ✅ PASS | `aria-pressed` gallery `ChipsCard`:832; `role=radio aria-checked` sections.tsx:1013 | Yes (usage) | — |
| 16 | Selected-edge matches I2 invariant | ⚠️ PARTIAL | `.chip--on` is fill-only — no `--k-selected-edge` inset; table/list use the edge, chip doesn't | No | LOW |
| 17 | Chip height = control-h-sm (parity) | ✅ PASS | `.chip{min-height:var(--k-control-h-sm)}`:5721 | — | — |
| 18 | Radius follows box; count/dot stay pill | ✅ PASS | `.badge{border-radius:var(--k-badge-radius,var(--k-radius-md))}`:1125 vs `--count`/`__dot` `999px`:1192,1224 | — | — |
| 19 | Count tabular + auto-pill | ✅ PASS | `.badge--count{height:1.5em;min-width:1.5em;tabular-nums}`:1186–1193 | — | — |
| 20 | Long-label cap/truncate on `.badge` | ❌ GAP | no `max-width`/`overflow`/ellipsis on `.badge`; a long status string in a table cell pushes the row | No | MED |
| 21 | Disabled chip fades (no grey box) | ✅ PASS | `.chip:disabled{background:transparent!important;opacity:var(--k-disabled-opacity)}`:5740–5743 | — | — |

**Tally: 17 PASS · 2 PARTIAL (#6, #16) · 1 GAP (#20).** Note `badge--info` / `badge--solid-success/warn/info`
are also DEFINED-but-not-demonstrated in the gallery, but the modifier audit only requires the
`badge--` AXIS shown (it is), so the build is green — these are catalogue-completeness, not drift.

---

## C. Gap worklist (ranked)

1. **#20 (MED) — no truncation guard on `.badge`.** A long status label ("Awaiting customer approval")
   in a fixed table cell or entity-card row blows out the layout. Add a single capped-truncate
   modifier rather than baking it on (most badges are short, single-word):
   `.badge--truncate{max-width:var(--k-badge-max,12ch);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`
   — `--k-badge-max` a free `--k-*` knob; ships zero-risk (opt-in modifier). Demo it in a gallery card so `audit:modifiers` stays green.
2. **#16 (LOW) — `.chip--on` is fill-only; doesn't carry the I2 selected-edge.** For cross-component
   selection consistency, add the inset edge the table/list use:
   `.chip--on{box-shadow:inset 0 0 0 var(--k-selected-edge,0) var(--k-secondary)}` (no-op until the edge token is non-zero, so safe). Deferrable — chips read fine on fill alone.
3. **#6 (LOW) — `.badge--accent` defined but never rendered.** Either add one accent chip to a gallery
   card (closes the catalogue gap) or accept it as a role-matrix completeness class. Same applies to the
   undemonstrated `badge--info` / `badge--solid-{success,warn,info}` siblings — one "all tones" gallery
   strip would demonstrate the full ladder at once.

---

## D. Loop notes (meta)

- **Research half = cheap, scan = mostly already-strong.** The family is a genuine strength: the
  contrast-DERIVED `soft-fg`/`fg` pairs (rule 3) are the kit's best answer to the illegible-status-pill
  bug, and all three removable-× variants already clear the I4 24px floor (a closed Invariant-Engine
  item). 17/20 PASS is an honest "this is good," not a soft grade.
- **The Delegated? column earned its keep — twice.** Rules 11/12/15 (remove hit-target, labelled remove,
  aria-pressed selected) look "absent on `.badge`" in a CSS-only read, but `.badge` is the PASSIVE atom by
  design — those belong to `.chip`/`.taginput` and ARE shipped there + in usage. A naive scan would have
  filed 3 false-positive GAPs against the wrong atom. Splitting passive-vs-interactive up front avoided it.
- **One real gap (#20 truncation) + two LOW inconsistencies (#16 edge, #6 accent).** The truncation gap is
  the only one that bites in practice (badges live in table cells); the other two are catalogue/consistency
  polish. The "defined-but-undemonstrated tone siblings" are a build-allowed (axis-level) catalogue gap, not drift.
- **Format verdict:** A (tone ladder + dot + hit-target + radius-follows-box rules) = durable `get_design_context`
  knowledge — the *grammar* of when to use soft vs solid vs count vs chip is exactly what a taste-free builder
  needs. B/C = a re-runnable scan that goes stale on any recipe edit. **Mechanizable into `audit:craft`:** rule 3
  (every `--{tone}-soft` MUST emit a paired `-soft-fg` via `aaInk`) and rule 11 (every `*__remove`/`__x`/`*remove`
  control MUST carry a `::before` hit-min) — both are structural invariants a regression could silently reopen.
