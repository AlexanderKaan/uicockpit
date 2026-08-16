/**
 * The kit's GLOBAL layer — everything that isn't a single component recipe:
 * keyframes, the focus-ring system (outset + inset), the disabled state,
 * ::selection, the reduced-motion guard, the heavy-surface easing override and
 * the form-validation contract.
 *
 * Authored ONCE here and shared by both consumers (no mirror):
 *   - export / CDN  → `globalLayer({ exportExtras: true })`   (unscoped; ships a
 *                      body baseline + the heavy-surface override for a bare project)
 *   - live preview  → `globalLayer({ scope: '.cockpit-preview' })`   (scoped so the
 *                      kit's focus/disabled/selection rules don't bleed onto the
 *                      configurator chrome; no body baseline, no heavy-surface)
 *
 * `@keyframes` are NEVER scoped (they're global by spec). Component-targeting
 * selectors get the `scope` prefix; the universal reduced-motion guard scopes to
 * `${scope} *` so the preview only cuts motion inside its own subtree.
 */

interface GlobalLayerOpts {
  /** Selector prefix, e.g. '.cockpit-preview'. '' = unscoped (export). */
  scope?: string
  /** Emit the export-only bits: the `body` baseline + heavy-surface override. */
  exportExtras?: boolean
}

export function globalLayer({ scope = '', exportExtras = false }: GlobalLayerOpts = {}): string {
  const s = scope ? scope.trim() + ' ' : ''

  const body = exportExtras
    ? `
/* Body baseline — keeps the system consistent when this file is dropped
   into a fresh project. Override per your reset preference. */
body {
  background: var(--k-bg);
  color: var(--k-fg);
  font-family: var(--k-font-body);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
`
    : ''

  const heavySurface = exportExtras
    ? `
/* Heavy-surface override — Playful motion is fun on popover/menu/hover-card
   but reads as glitch on a confirmation dialog or large drawer. If you build
   your own Dialog/Sheet components, mirror this rule (or just match the
   selector below). */
[role="dialog"][aria-modal="true"], [data-cockpit-heavy-surface] {
  animation-timing-function: cubic-bezier(.05,.7,.1,1) !important;
}
`
    : ''

  return `/* Selected-text gets the brand soft-tint */
${s}::selection { background: var(--k-selection, var(--k-primary-soft)); }

/* === The scroll rail, declared ONCE for everything =========================
   A scrollbar is a property of the THEME, not of a component — the same kind of
   thing as ::selection directly above. It was being treated as a component
   detail instead, so .scroll-area carried the treatment, .menu got a copy of
   it this morning, and every other scrolling surface in the product fell through
   to the OS default: a heavy platform-grey bar down a light panel, and a black
   bar through a white one in dark mode.

   Measured rather than assumed — audit:uniformity derives every element that
   ACTUALLY scrolls and found 8 of 11 untreated, including the week calendar,
   the data table body, the dialog body and the sheet body. Fixing them one at a
   time is how you get an eleventh next month.

   The two properties behave differently and the difference matters: per the CSS
   Scrollbars module, scrollbar-color IS inherited and scrollbar-width is NOT.
   (This comment claimed both were, the calendar came back themed-but-not-thin,
   and the measurement corrected the text.) So the colour — the actual complaint,
   a black bar through a white panel — rides inheritance from the scope root and
   reaches every descendant that will ever exist; the width needs the same
   universal reach the reduced-motion guard below already uses.

   Either way there is no list to maintain and nothing for a new component to
   forget. The ::-webkit- pseudos are neither inherited nor universal and stay
   per-surface (.scroll-area / .menu) where a thicker, bordered thumb is wanted. */
${s ? s.trim() : ':root'} { scrollbar-color: var(--k-border) transparent; }
${s || ':root '}* { scrollbar-width: thin; }
${body}
/* Motion system — three-tier duration scale + direction-aware easings.
   --k-dur-fast (microinteractions)  · --k-dur (standard)  · --k-dur-slow (large surfaces)
   --k-ease-out (enters, decelerate) · --k-ease (state changes) · --k-ease-in (exits, accelerate)
   Pattern: pair ease-out with fast/normal for enters, ease-in with fast for exits.
   Based on Material 3 emphasized easing curves and shadcn/Radix conventions. */

/* Named animation keyframes — pair with --k-anim-* shorthand tokens.
   Usage: \`animation: var(--k-anim-fade-in);\` on any element.
   For k-scale-in/-out, set \`transform-origin\` to anchor the zoom to a trigger. */
@keyframes k-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes k-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes k-slide-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes k-slide-down {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes k-scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
/* CP1 hero entrance (--k-anim-rise) — a focal element rises further (12px) and
   scales up a touch as it fades in, so it reads as a deliberate "lands into
   place" moment rather than a micro slide. Pairs with the emphasized-decel
   curve + the slow duration tier. */
@keyframes k-rise {
  from { opacity: 0; transform: translateY(12px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes k-scale-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.96); }
}
@keyframes k-spin { to { transform: rotate(360deg); } }
/* MD3 fade-through — outgoing drops to 0 in first 35%, incoming rises over the
   last 65%; the brief mid plateau kills the "double fade" of a crude crossfade. */
@keyframes k-fade-through {
  0%   { opacity: 1; }
  35%  { opacity: 0; }
  100% { opacity: 1; }
}
/* Live-dot pulse (#127) + skeleton shimmer — system motion tokens. */
@keyframes k-pulse {
  0%, 100% { transform: scale(1);    opacity: 0.5; }
  50%      { transform: scale(1.35); opacity: 0;   }
}
@keyframes k-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
/* Menu "roll-down" signature — pair --k-anim-menu on the panel (set
   transform-origin:top; overflow:hidden) with --k-anim-menu-item on each
   item, staggered via: animation-delay: calc(var(--stagger-i,0) * var(--k-menu-stagger)). */
@keyframes k-menu-roll {
  from { max-height: 0; opacity: 0.6; }
  to { max-height: 380px; opacity: 1; }
}
@keyframes k-menu-item {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
${heavySurface}
/* Respect the OS reduced-motion preference — cut animations and transitions
   to near-instant. Critical state (focus rings, hover backgrounds) still works
   because they're CSS color changes, not animations. */
@media (prefers-reduced-motion: reduce) {
  ${s}*, ${s}::before, ${s}::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Disabled state — apply via the :disabled attribute or .is-disabled class.
   bg + color use !important so a component's own fill (e.g. .btn--primary)
   can't out-specify the disabled greying.
   EXCEPT .toggle: a disabled-ON switch ("always on, can't be disabled") must keep
   its blue track — the !important grey would otherwise flatten it to read as OFF.
   The toggle self-manages disabled via .toggle--disabled (opacity + not-allowed +
   pointer-events: none), so it doesn't need — and must not get — the global grey. */
${s}:disabled:not(.toggle), ${s}.is-disabled:not(.toggle) {
  background: var(--k-disabled-bg) !important;
  color: var(--k-disabled-fg) !important;
  opacity: var(--k-disabled-opacity);
  cursor: not-allowed;
  pointer-events: none;
}
/* Disabled OPTION / menu items — a role="option"/"menuitem" on a <li>/<div>
   can't take :disabled, so it's marked [aria-disabled="true"]. These get the
   LIGHT treatment (dim + muted + not-allowed), NOT the solid grey-box of form
   controls: a disabled option reads as FADED, not filled (Radix/shadcn). */
${s} .menu__item[aria-disabled="true"],
${s} .cmdp__item[aria-disabled="true"],
${s} .combobox__item[aria-disabled="true"],
${s} .list__row[aria-disabled="true"] {
  color: var(--k-fg-muted);
  opacity: var(--k-disabled-opacity);
  cursor: not-allowed;
  pointer-events: none;
}

/* === Role Canvas · \`selectable\` — the generative binding ===================
   The kit's ONE selected treatment (chromatic fill + the inset --k-selected-edge)
   bound once to the ARIA state that NAMES selection (aria-selected on option /
   row / gridcell / tab, aria-checked on radio) + a thin [data-role="selectable"]
   for markup not yet wired to ARIA. Wrapped in :where() so it carries ZERO
   specificity — a true FLOOR: any component rule (even a single class) overrides
   it completely, while UNKNOWN markup (a selectable we never built) inherits the
   uniform look for free. This is what stops chip / list / tab / table / segmented
   from each re-rolling the selected state. See contracts.ts + ROLE-CANVAS.md
   (role → guaranteed treatment). Enforced by audit:role-treatments. */
${s}:where(
  [data-role="selectable"][aria-selected="true"],
  [data-role="selectable"][aria-checked="true"],
  [data-role="selectable"].is-selected,
  [role="option"][aria-selected="true"],
  [role="row"][aria-selected="true"],
  [role="gridcell"][aria-selected="true"],
  [role="tab"][aria-selected="true"],
  [role="radio"][aria-checked="true"]
) {
  background: var(--k-state-selected-bg, var(--k-primary-soft));
  box-shadow: var(--k-selected-edge);
}

/* === Role Canvas · \`surface\` — the generative binding (perceptual role) ====
   ARIA has no attribute for "this is a raised surface", so this role — one of the
   perceptual roles ARIA can't name — binds to the thin [data-role="surface"].
   Same zero-specificity :where() FLOOR: an UNKNOWN container tagged
   data-role="surface" inherits the kit's separation treatment (surface bg +
   hairline border + radius + the sm elevation) so it reads as "off the ground",
   while any component (.card, .stat, .pane, .well…) fully overrides it. The
   perceptual companion to the ARIA-named \`selectable\` binding. Enforced by
   audit:role-treatments; the surface-vs-bg contrast itself is guarded by the
   foundation coherence rail. */
${s}:where([data-role="surface"]) {
  background: var(--k-surface);
  color: var(--k-fg);
  border: 1px solid var(--k-border);
  border-radius: var(--k-radius-lg);
  box-shadow: var(--k-shadow-sm);
}

/* === Role Canvas · \`control\` — the generative binding (perceptual role) =====
   The most common role; its guarantee is height · focus-ring · hit-target. The
   FOCUS ring is already universal (the :focus-visible rule below) and the
   hit-target floor picks [data-role="control"] up in the coarse-pointer block,
   so the piece the generative binding adds is the HEIGHT invariant — the
   proof-of-one-role (--k-control-h-* centralised → zero drift). Bound to the thin
   [data-role="control"] (+ an optional [data-size] for the sm/lg tiers), in a
   zero-specificity :where() floor so any component (.btn / .in / .select-trigger…)
   overrides it while an UNKNOWN control inherits the exact kit height + vertical
   centering. */
${s}:where([data-role="control"]) {
  display: inline-flex;
  align-items: center;
  min-height: var(--k-control-h-md);
}
${s}:where([data-role="control"][data-size="sm"]) { min-height: var(--k-control-h-sm); }
${s}:where([data-role="control"][data-size="lg"]) { min-height: var(--k-control-h-lg); }

/* === Role Canvas · \`text-slot\` — the generative binding (perceptual role) ===
   The guarantee: text that must not break the layout. The kit already ships the
   explicit \`.truncate\` utility (24ch cap); this is its ROLE form — an unknown
   element tagged [data-role="text-slot"] inherits the single-line clamp and, via
   min-width:0, actually shrinks inside a flex parent (the classic truncation
   gotcha). Zero-specificity :where() floor; any component overrides it. */
${s}:where([data-role="text-slot"]) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* === Role Canvas · \`overlay\` — the generative binding =======================
   A floating list surface must cap its height and scroll the overflow so a long
   list can't run off-screen. Bound to the ARIA roles that name a floating list
   (role=menu / role=listbox) + a thin [data-role="overlay"] — an UNKNOWN dropdown
   inherits the height cap + scroll. Zero-specificity :where() floor; any component
   (.menu / .cmdp__list) overrides it. Only the CSS half of the guarantee lives
   here: focus-trap / ESC / focus-return are a BEHAVIOUR concern, deliberately
   left to the framework or the optional behavior.js shim (the Radix-complement
   boundary). NB [role=dialog] is excluded — a modal sizes itself, not from a
   dropdown height cap. */
${s}:where([data-role="overlay"], [role="menu"], [role="listbox"]) {
  max-height: var(--k-overlay-max, 22rem);
  overflow: hidden auto;
}

/* === Role Canvas · \`tone-bearer\` — the generative binding (perceptual role) =
   Unlike the other roles, tone-bearer isn't one treatment but a FAMILY keyed to a
   tone VALUE — so it binds to [data-role="tone-bearer"] + [data-tone="…"]. Each
   tone maps to the paired --k-<tone>-soft tint + its --k-<tone>-soft-fg, the
   AA-derived ink the tone-bearer token gate already guarantees legible — so an
   UNKNOWN badge/pill/banner tagged with a tone inherits a tint that its text is
   provably readable on. Base (no tone) = a neutral chip. Zero-specificity
   :where() floor; any component (.badge/.alert/.banner) overrides it. Enforced by
   audit:role-treatments (the binding + the paired-ink guarantee). */
${s}:where([data-role="tone-bearer"]) {
  background: var(--k-surface-sunken, var(--k-surface-2));
  color: var(--k-fg-muted);
}
${s}:where([data-role="tone-bearer"][data-tone="primary"])   { background: var(--k-primary-soft);   color: var(--k-primary-soft-fg); }
${s}:where([data-role="tone-bearer"][data-tone="secondary"]) { background: var(--k-secondary-soft); color: var(--k-secondary-soft-fg); }
${s}:where([data-role="tone-bearer"][data-tone="accent"])    { background: var(--k-accent-soft);    color: var(--k-accent-soft-fg); }
${s}:where([data-role="tone-bearer"][data-tone="success"])   { background: var(--k-success-soft);   color: var(--k-success-soft-fg); }
${s}:where([data-role="tone-bearer"][data-tone="warning"])   { background: var(--k-warning-soft);   color: var(--k-warning-soft-fg); }
${s}:where([data-role="tone-bearer"][data-tone="danger"])    { background: var(--k-danger-soft);    color: var(--k-danger-soft-fg); }
${s}:where([data-role="tone-bearer"][data-tone="info"])      { background: var(--k-info-soft);      color: var(--k-info-soft-fg); }

/* Focus ring — keyboard focus only (avoids mouse-click flashes).
   --k-focus-ring-offset is +2px (outset) by default — lifts the ring
   off the element for clear visibility on standalone buttons/inputs.
   (Modern browsers already wrap the outline around the element's own
   border-radius, so no radius override is needed here.) */
${s}:focus-visible {
  outline: var(--k-focus-ring-width) solid var(--k-ring);
  outline-offset: var(--k-focus-ring-offset);
}

/* Inset focus rings for container-bound children.
   System rule: elements that sit inside a tightly-packed parent (tabs row,
   segmented control, menu list, table row, nav stack) put the ring INSIDE
   their own box. Prevents bleeding into adjacent siblings or parent edges.
   Pattern parity with Linear, Notion, Apple HIG, Material 3. */
${s}.tab:focus-visible,
${s}.segctrl__btn:focus-visible,
${s}.menu__item:focus-visible,
${s}.cmdp__item:focus-visible,
${s}.table__row:focus-visible,
${s}.navrow:focus-visible,
${s}.accordion summary:focus-visible,
${s}.convo:focus-visible,
${s}.combobox__item:focus-visible,
${s}.tree__row:focus-visible,
${s}.list__row:focus-visible,
${s}.phoneinput__country:focus-visible,
${s}.fab-stack__btn:focus-visible,
${s}.chip__remove:focus-visible,
${s}.taginput__remove:focus-visible,
${s}.calendar__cell:focus-visible,
${s}.kanban__card:focus-visible,
${s}.navsuite__item:focus-visible,
${s}.navmenu__item:focus-visible,
${s}.att-chip__x:focus-visible,
${s}.list__item:focus-visible,
${s}.barchart__bar:focus-visible {
  outline-offset: -2px;
}

/* Placeholder — a designed state of every text field, not the browser default.
   Faint tier + opacity:1 (Firefox dims placeholders otherwise) so the empty-field
   hint is consistent and clears the same quiet contrast everywhere. */
${s}.in::placeholder,
${s}.tx::placeholder,
${s}.searchinput__field::placeholder,
${s}.numinput__field::placeholder,
${s}.pwinput__field::placeholder {
  color: var(--k-fg-muted);
  opacity: 1;
}

/* Browser autofill — repaint Chrome's native yellow fill back to the kit field
   surface (a huge inset box-shadow over the native bg) so an autofilled email/
   password keeps the one-family look and stays legible in dark mode, where the
   native fill can drop ink to near-invisible. Covers every field shape so they
   all inherit it. (See the focus-radius autofill trap.) */
${s}.in:-webkit-autofill, ${s}.in:-webkit-autofill:focus,
${s}.tx:-webkit-autofill,
${s}.numinput__field:-webkit-autofill,
${s}.pwinput__field:-webkit-autofill,
${s}.searchinput__field:-webkit-autofill,
${s}.phoneinput__field:-webkit-autofill {
  -webkit-text-fill-color: var(--k-fg);
  -webkit-box-shadow: 0 0 0 100vmax var(--k-field-bg, var(--k-input-bg)) inset;
  caret-color: var(--k-fg);
}

/* Form validation — combine with the input border (use --k-bw for width):
   <input class="in" aria-invalid="true"> red · .in.is-success green · .in.is-warning amber.
   Each state owns ONE coherent ring: border + halo share the state hue so they
   read as a single softening ring (not "colored border + separate indigo halo"). */
${s}.in[aria-invalid='true'],
${s}.in.is-error,
${s}.phoneinput--invalid,
${s}.numinput--invalid,
${s}.pwinput--invalid,
${s}.searchinput--invalid {
  border-color: var(--k-input-error-border);
}
${s}.in.is-success { border-color: var(--k-input-success-border); }
${s}.in.is-warning { border-color: var(--k-input-warning-border); }
/* Validation borders are SEMANTIC — keep a ≥1px width even when Borders is Off
   (--k-bw: 0px), so error/success/warning feedback never vanishes. */
${s}.in.is-error,
${s}.in.is-success,
${s}.in.is-warning,
${s}.in[aria-invalid='true'],
${s}.phoneinput--invalid,
${s}.numinput--invalid,
${s}.pwinput--invalid,
${s}.searchinput--invalid {
  border-width: max(1px, var(--k-bw));
  border-style: solid;
}
/* State-matched focus halos — border + halo SAME state color → one coherent ring. */
${s}.in[aria-invalid='true']:focus,
${s}.in[aria-invalid='true']:focus-within,
${s}.in.is-error:focus,
${s}.in.is-error:focus-within,
${s}.phoneinput--invalid:focus-within,
${s}.numinput--invalid:focus-within,
${s}.pwinput--invalid:focus-within,
${s}.searchinput--invalid:focus-within {
  border-color: var(--k-input-error-border);
  box-shadow: 0 0 0 var(--k-ring-w, 3px) color-mix(in srgb, var(--k-input-error-border) 28%, transparent);
}
${s}.in.is-success:focus,
${s}.in.is-success:focus-within {
  border-color: var(--k-input-success-border);
  box-shadow: 0 0 0 var(--k-ring-w, 3px) color-mix(in srgb, var(--k-input-success-border) 28%, transparent);
}
${s}.in.is-warning:focus,
${s}.in.is-warning:focus-within {
  border-color: var(--k-input-warning-border);
  box-shadow: 0 0 0 var(--k-ring-w, 3px) color-mix(in srgb, var(--k-input-warning-border) 28%, transparent);
}
/* Pressed / :active tier — the nav families carried a hover wash but no pressed
   state, so a tap jumped hover→release with no tactile confirm. Uses the new
   --k-state-press layer (a notch stronger than --k-state-hover). Buttons, slider,
   numinput, kanban already have their own :active, so they're not duplicated. */
${s}.menu__item:active,
${s}.navrow:active,
${s}.navsub__item:active,
${s}.navmenu__item:active,
${s}.sidenav__toggle:active { background: var(--k-state-press); }

/* Composed-field disabled — plain .in gets :disabled for free, but the wrapper
   fields (number/password/search/phone/tag input) hold the disabled <input>
   inside, so the WRAPPER needs the dimming. Covers a real [disabled] descendant
   (:has) and an explicit [aria-disabled] on the wrapper. */
${s}.numinput:has(:disabled), ${s}.pwinput:has(:disabled),
${s}.searchinput:has(:disabled), ${s}.phoneinput:has(:disabled),
${s}.taginput:has(:disabled),
${s}.numinput[aria-disabled="true"], ${s}.pwinput[aria-disabled="true"],
${s}.searchinput[aria-disabled="true"], ${s}.phoneinput[aria-disabled="true"],
${s}.taginput[aria-disabled="true"] {
  opacity: var(--k-disabled-opacity, 0.55);
  cursor: not-allowed;
  pointer-events: none;
}

/* [hidden] must actually hide. The one reset line every kit needs and ours did
 * not have.
 *
 * The UA rule is [hidden] { display: none } and ANY author display declaration
 * beats it — so .card, .list, .toolbar and every other component that sets
 * its own display silently ignored the attribute. Measured against a no-CSS
 * control: bare [hidden] hides correctly, [hidden] + display:flex does not, and
 * all three of our components rendered visible.
 *
 * That matters more than the dialog case because [hidden] is everywhere — it is
 * what Angular's [hidden], server-rendered toggles and half the conditional
 * rendering in the wild come down to. A component that cannot be hidden by the
 * platform's own attribute is a component that will be hidden with
 * style="display:none" instead, and that is how inline styles get into a
 * codebase we then audit for exactly that.
 *
 * !important is correct here and is what normalize.css has shipped for a decade:
 * beating a component's own display is the entire job. */
${s}[hidden] {
  display: none !important;
}

/* The platform's closed state wins over our layout. Non-negotiable.
 *
 * A user agent hides a closed <dialog> and a closed [popover] with
 * display:none. That rule lives in the UA origin, and ANY author declaration
 * beats it regardless of specificity — so the moment someone puts our .dialog or
 * .popover class (which set display:flex / display:grid for their internal
 * layout) on a real platform element, the closed content renders. Measured, not
 * reasoned: a closed <dialog class="dialog"> laid out at 186x68 and a closed
 * [popover] at 170x40.
 *
 * That is a bad failure for a CSS kit to have, because it only appears for the
 * consumers doing the RIGHT thing — reaching for <dialog>/showModal() and the
 * Popover API instead of re-implementing modality in JavaScript. Open UI's whole
 * argument is that design systems should stop re-inventing built-in controls; a
 * kit that punishes you for taking that advice is worse than one that never
 * offered it.
 *
 * Restated here in the author origin so it outranks our own layout rules. Placed
 * before them in the cascade would not be enough — these have to win on
 * specificity too, hence the element/attribute qualifiers. */
${s}dialog:not([open]),
${s}[popover]:not(:popover-open) {
  display: none;
}

/* And the modal backdrop, so showModal() looks like the rest of the kit rather
 * than the UA's default black wash. Only reachable via the platform path — a
 * hand-rolled div-with-a-scrim never renders ::backdrop, which is one more small
 * reason to use the element. */
${s}dialog::backdrop {
  background: color-mix(in srgb, var(--k-fg) 55%, transparent);
  backdrop-filter: blur(2px);
}

/* Visually hidden — text for assistive tech that takes no space on screen.
 *
 * A foundational primitive we did not have, which is how it ended up hand-rolled
 * twice: .skiplink and the stacked-table thead each carry their own copy of
 * the clip trick. Two implementations of one idea is exactly the drift this kit
 * exists to stop, and the one place it hurts most is accessibility, where the
 * copies quietly diverge and one of them stops working.
 *
 * .sr-only is a misnomer — it is visually hidden, not screen-reader-only, and
 * Bootstrap 5 renamed it for that reason. We ship it under this name anyway
 * because Tailwind made it the thing people type, and .visually-hidden is
 * aliased onto it so the accurate name also resolves. Same reasoning as .btn.
 *
 * NOT display:none and NOT visibility:hidden — both remove it from the
 * accessibility tree, which is the opposite of the point. */
${s}.sr-only,
${s}.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Touch-target floor (WCAG 2.5.5 / 2.5.8) — on a COARSE pointer (touch), tappable
 * controls grow to a 44px minimum so they're comfortably hit-able, WITHOUT
 * inflating dense desktop (fine-pointer) layouts where this never fires. Covers
 * the full interactive roster, not just buttons/inputs: row/item-like controls
 * grow vertically (min-height); icon-only controls become 44×44 squares.
 * NOTE: sub-token visual controls whose box IS the visual (toggle knob, checkbox/
 * radio 16px box, the 3px slider track, the chip × and eye glyphs) are NOT here —
 * forcing min-height on them would distort the visual; they need a hit-expanding
 * ::after pseudo, which collides with their existing ::after art, so that's a
 * separate careful pass. Their text LABEL usually already provides the target. */
@media (pointer: coarse) {
  ${s}.btn, ${s}.in, ${s}.select-trigger,
  ${s}.menu__item, ${s}.navsub__item, ${s}.navmenu__item, ${s}.list__row,
  ${s}.tab, ${s}.segctrl__btn, ${s}.calendar__cell, ${s}.sidenav__toggle,
  ${s}.phoneinput__country,
  ${s}[data-role="control"] { min-height: var(--k-touch-target); }
  ${s}.btn--icon, ${s}.btn--circle,
  ${s}.lightbox__btn, ${s}.alert__close, ${s}.banner__close, ${s}.toast__close {
    min-width: var(--k-touch-target); min-height: var(--k-touch-target);
  }
  /* iOS-zoom guard — Mobile Safari ZOOMS the page when a focused field's
     font-size is < 16px (and never zooms back). Every field uses --k-type-small
     (~12-13px), so on a coarse pointer we floor the field text to 16px. Desktop
     (fine pointer) keeps the dense --k-type-small. Covers the bare fields, the
     custom select/OTP, and the inner <input> of every composed wrapper. */
  ${s}.in, ${s}textarea.in, ${s}select.select, ${s}.select-trigger, ${s}.otp__slot,
  ${s}.numinput input, ${s}.pwinput input, ${s}.searchinput input, ${s}.phoneinput input,
  ${s}.taginput input, ${s}.cmdp__input, ${s}.combobox__input {
    font-size: max(var(--k-type-small), var(--k-type-input-min));
  }
}`
}

/**
 * THE PLATFORM FLOOR — every HTML element the platform gives us, styled once,
 * at ZERO specificity.
 *
 * The position this belongs to: we are not for people shopping for a nicer
 * button. We are for a civil servant who wants defensive CSS and HTML and has to
 * ship a solid tax form. For that person "beautiful" has a testable meaning —
 * IT NEVER SURPRISES ME. Nothing clipped, nothing overlapping, nothing broken by
 * a forty-character surname or a bank account number that cannot wrap.
 *
 * So they write plain semantic HTML and get a page that holds:
 *
 *     <link rel="stylesheet" href="ui.css">
 *     <h1>Aangifte inkomstenbelasting</h1>
 *     <label for="iban">Rekeningnummer</label>
 *     <input id="iban" type="text">
 *
 * No wrapper class, no vocabulary. That is also why an AI writing UI gets a
 * correct result with ZERO instructions: semantic HTML is a model's default
 * output, while a class vocabulary is something it has to be told, correctly,
 * every time — which is the drift `check` exists to catch.
 *
 * 🔑 EVERY RULE IS WRAPPED IN :where(), SO ITS SPECIFICITY IS 0,0,0. Measured
 * rather than assumed: a `:where()` rule loses to a single class, to a bare tag
 * selector, and even to an author rule declared EARLIER in the cascade. That is
 * what makes it a floor rather than an opinion — it cannot fight anything, it
 * only fills in where nobody else spoke. It is why this needs no scope class:
 * scope was the wrong instrument for "do not break markup you do not control".
 * Specificity is the right one.
 *
 * ⚠️ DEFENSIVE FIRST, DECORATIVE SECOND. `check:components` over 11 conditions
 * put `unbreakable` — a string that cannot wrap — as our WORST condition at 82
 * content-lost findings, ahead of 200% zoom and 320px. An unbreakable string is
 * what a government form is made of: an IBAN, a reference number, a case number,
 * a BSN. So the first block below is not decoration; it is the reason this file
 * exists, and the decoration follows it.
 *
 * ⚠️ AND NOT EVERY ELEMENT GETS A LOOK. `<main>`, `<section>` and `<article>`
 * are structure; giving them a visual treatment would be inventing an opinion to
 * satisfy a counter, which is the same failure as a back-fitted provenance. They
 * get defensive rules and nothing else.
 */
export function platformFloor({ scope = '' }: { scope?: string } = {}): string {
  const s = scope ? scope.trim() + ' ' : ''
  const w = (sel: string) => sel.split(',').map((x) => `${s}:where(${x.trim()})`).join(',\n')

  return `
/* ============================================================================
   THE PLATFORM FLOOR — :where(), so anything you write wins over it.
   ============================================================================ */

/* ---- 1 · DEFENSIVE. The rules that stop content being lost. ---------------
   These are the whole reason a public body can trust generated or translated
   content. They are listed first because they matter most, not because they
   are the tidiest. */

/* Media can never be wider than its column. The single most load-bearing
   defensive rule in CSS, and the reason <img> came back as "browser default"
   in our own kit. */
${w('img, svg, video, canvas, audio, iframe, embed, object')} {
  max-width: 100%;
}
${w('img, video')} { height: auto; }

/* An IBAN, a reference number, a case number. Value anywhere, not
   break-word, so it also shrinks the element's min-content size — without
   that, a long token still forces a scrollbar on the container. */
${w('p, li, dd, dt, figcaption, blockquote')} {
  overflow-wrap: anywhere;
}
/* ⚠️ break-word, NOT anywhere, ON SHORT LABELS. The two look interchangeable and
   are not: anywhere also counts for MIN-CONTENT sizing, so a grid or table
   track will happily shrink to one character per line. With it on <th>, a data
   table rendered its "SERVICE" header as S/E/R/V/I/C/E stacked vertically.
   break-word gives the same last-resort break without letting the column
   collapse. Free-running text above keeps anywhere, because there we DO want
   an IBAN to shrink its container rather than overflow it. */
${w('td, th, caption, label, legend, summary, h1, h2, h3, h4, h5, h6')} {
  overflow-wrap: break-word;
}

/* Code and preformatted text keep their line breaks, so they scroll rather
   than push the page sideways. */
${w('pre')} { overflow-x: auto; max-width: 100%; }

/* A grid/flex child is never narrower than its content unless told. This is
   the "min-width: 0 law" from the recipes, applied to the elements that most often sit
   in a form row. */
${w('input, select, textarea, button, fieldset')} { min-width: 0; }

/* A fieldset defaults to min-width:min-content, which makes it refuse to
   shrink and overflow its parent — a 25-year-old UA quirk that breaks every
   responsive form built from correct markup. */
${w('fieldset')} { min-inline-size: 0; }

/* sub/sup raise the line box and make a paragraph's leading jump. */
${w('sub, sup')} { line-height: 0; position: relative; vertical-align: baseline; font-size: 75%; }
${w('sup')} { top: -0.5em; }
${w('sub')} { bottom: -0.25em; }

/* ---- 2 · RUNNING TEXT ------------------------------------------------------ */

${w('h1')} { font-family: var(--k-font-display); font-size: var(--k-type-display); font-weight: var(--k-weight-display); line-height: var(--k-leading-tight); letter-spacing: var(--k-track-display); margin: 0 0 var(--k-s-16); }
${w('h2')} { font-family: var(--k-font-display); font-size: var(--k-type-h1); font-weight: var(--k-weight-semibold); line-height: var(--k-leading-tight); letter-spacing: var(--k-track-tight); margin: var(--k-s-32) 0 var(--k-s-12); }
${w('h3')} { font-family: var(--k-font-display); font-size: var(--k-type-h2); font-weight: var(--k-weight-semibold); line-height: var(--k-leading-snug); margin: var(--k-s-24) 0 var(--k-s-8); }
${w('h4, h5, h6')} { font-size: var(--k-type-h3); font-weight: var(--k-weight-semibold); line-height: var(--k-leading-snug); margin: var(--k-s-20) 0 var(--k-s-8); }

${w('p')} { margin: 0 0 var(--k-s-12); line-height: var(--k-leading-normal); }
${w('blockquote')} { margin: var(--k-s-16) 0; padding-inline-start: var(--k-s-16); border-inline-start: var(--k-s-2) solid var(--k-border); color: var(--k-fg-muted); }
${w('hr')} { border: 0; block-size: var(--k-bw); background: var(--k-border); margin: var(--k-s-24) 0; }

${w('ul, ol')} { margin: 0 0 var(--k-s-12); padding-inline-start: var(--k-s-24); }
${w('li')} { margin-block-end: var(--k-s-4); line-height: var(--k-leading-normal); }
${w('dl')} { margin: 0 0 var(--k-s-12); }
${w('dt')} { font-weight: var(--k-weight-semibold); }
${w('dd')} { margin: 0 0 var(--k-s-8); color: var(--k-fg-muted); }

/* ---- 3 · INLINE SEMANTICS -------------------------------------------------- */

${w('a')} { color: var(--k-primary-text); text-underline-offset: 0.15em; }
${w('a:hover')} { color: var(--k-primary-text-hover); }

${w('code, samp, var, kbd')} { font-family: var(--k-font-mono); font-size: 0.9em; }
${w('code, samp')} { background: var(--k-surface-sunken); padding: 0.1em 0.35em; border-radius: var(--k-radius-sm); }
${w('var')} { font-style: normal; color: var(--k-fg-muted); }
${w('pre')} { font-family: var(--k-font-mono); font-size: var(--k-type-small); background: var(--k-surface-sunken); padding: var(--k-s-12); border-radius: var(--k-radius-md); margin: 0 0 var(--k-s-12); }
${w('pre code, pre samp')} { background: none; padding: 0; }
${w('kbd')} { border: var(--k-hairline, 1px solid var(--k-border)); border-block-end-width: var(--k-s-2); border-radius: var(--k-radius-sm); padding: 0.1em 0.4em; background: var(--k-surface); }

${w('mark')} { background: var(--k-primary-soft); color: var(--k-primary-soft-fg); padding: 0 0.15em; border-radius: var(--k-radius-sm); }
${w('small')} { font-size: var(--k-type-caption); color: var(--k-fg-muted); }
${w('abbr[title]')} { text-decoration: underline dotted; cursor: help; text-decoration-thickness: var(--k-bw); }
${w('cite')} { font-style: normal; color: var(--k-fg-muted); }
${w('s, del')} { text-decoration-line: line-through; color: var(--k-fg-muted); }
${w('strong, b')} { font-weight: var(--k-weight-semibold); }
${w('time')} { font-variant-numeric: tabular-nums; }
${w('figure')} { margin: var(--k-s-16) 0; }
${w('figcaption')} { font-size: var(--k-type-caption); color: var(--k-fg-muted); margin-block-start: var(--k-s-6); }

/* ---- 4 · TABLES ------------------------------------------------------------ */

${w('table')} { border-collapse: collapse; inline-size: 100%; font-size: var(--k-type-small); }
${w('caption')} { text-align: start; font-size: var(--k-type-caption); color: var(--k-fg-muted); padding-block-end: var(--k-s-8); }
${w('th, td')} { padding: var(--k-s-8) var(--k-s-10); text-align: start; border-block-end: var(--k-hairline, 1px solid var(--k-border)); }
${w('th')} { font-weight: var(--k-weight-semibold); color: var(--k-fg-muted); }

/* ---- 5 · FORMS. The reason a service exists. ------------------------------- */

${w('label')} { display: inline-block; font-size: var(--k-type-small); font-weight: var(--k-ui-weight, 500); margin-block-end: var(--k-s-6); }
${w('fieldset')} { border: 0; padding: 0; margin: 0 0 var(--k-s-16); }
${w('legend')} { padding: 0; font-size: var(--k-type-h3); font-weight: var(--k-weight-semibold); margin-block-end: var(--k-s-4); }

/* The field. Same tokens the .in recipe reads, so a bare <input> and an
   <input class="in"> are the same field — one of them just does not need to
   be told. */
${w('input:not([role]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea:not([role]), select:not([role])')} {
  display: block;
  inline-size: 100%;
  min-block-size: var(--k-in-h-default, 40px);
  padding-inline: max(var(--k-s-12), calc(var(--k-radius-md) * 0.6));
  border-radius: var(--k-in-radius, var(--k-field-radius));
  background: var(--k-in-bg, var(--k-field-bg));
  border: var(--k-bw, 1px) solid var(--k-field-border-color);
  border-block-end-color: var(--k-field-underline-color);
  color: var(--k-fg);
  font-family: var(--k-font-body);
  font-size: max(var(--k-type-small), var(--k-type-input-min));
}
${w('textarea')} { padding-block: var(--k-s-8); min-block-size: calc(var(--k-in-h-default, 40px) * 2); resize: vertical; }
${w('select')} { appearance: none; -webkit-appearance: none; padding-inline-end: var(--k-s-28, 28px); }
${w('input::placeholder, textarea::placeholder')} { color: var(--k-fg-faint); }

/* A neutral button, NOT a primary one. The floor gives the shape and the hit
   target; .btn--primary adds the fill. A floor that painted every button
   brand-coloured would be an opinion, not a floor.

   🚨 AND NOT WHEN THE ELEMENT HAS BEEN REPURPOSED. Zero specificity only loses
   to what a component DECLARES — what a component OMITS, the floor silently
   fills in. .toggle is a <button role="switch"> that never sets a height, so
   the floor's min-block-size: 40px squashed a 36x20 switch into 32x36, and with
   border-radius: 999px on top it rendered as a circle with a bite out of it.
   Found by eye, on a screenshot, which is exactly the loop this work exists to
   end.

   The rule that generalises: AN EXPLICIT role ATTRIBUTE MEANS THE ELEMENT IS NO LONGER
   DOING ITS DEFAULT JOB, so the floor has no opinion about it. A switch, a tab,
   a menuitem and an option are all <button> in markup and none of them wants a
   button's box. Same reasoning as the platform floor itself — style what the
   element IS, and an element with a role attribute has told you it is something
   else. */
${w('button:not([role]), button[role="button"], input[type="submit"], input[type="button"], input[type="reset"]')} {
  display: inline-flex; align-items: center; justify-content: center;
  gap: var(--k-s-6);
  min-block-size: var(--k-in-h-default, 40px);
  min-inline-size: var(--k-hit-min, 24px);
  padding-inline: var(--k-s-14, 14px);
  border-radius: var(--k-radius-button, var(--k-radius-md));
  border: var(--k-bw, 1px) solid var(--k-border);
  background: var(--k-surface);
  color: var(--k-fg);
  font: inherit;
  font-size: var(--k-type-small);
  font-weight: var(--k-ui-weight, 500);
  cursor: pointer;
}
${w('button:not([role]):hover:not(:disabled), button[role="button"]:hover:not(:disabled)')} { background: var(--k-state-hover); }

${w('input[type="checkbox"]:not([role]), input[type="radio"]:not([role])')} {
  inline-size: var(--k-s-16); block-size: var(--k-s-16);
  accent-color: var(--k-primary);
  margin: 0;
}
${w('input[type="range"]')} { accent-color: var(--k-primary); inline-size: 100%; }
${w('input[type="file"]')} { font-size: var(--k-type-small); }

${w('output')} { font-variant-numeric: tabular-nums; font-weight: var(--k-weight-semibold); }
${w('progress, meter')} { inline-size: 100%; block-size: var(--k-stroke-progress, 6px); }

/* ---- 6 · INTERACTIVE ------------------------------------------------------- */

${w('details')} { border-block-end: var(--k-hairline, 1px solid var(--k-border)); }
${w('summary')} { padding: var(--k-s-10) 0; cursor: pointer; font-weight: var(--k-ui-weight, 500); min-block-size: var(--k-hit-min, 24px); }
${w('summary::marker')} { color: var(--k-fg-muted); }

${w('dialog')} {
  border: var(--k-hairline, 1px solid var(--k-border));
  border-radius: var(--k-radius-lg);
  background: var(--k-surface-raised, var(--k-surface));
  color: var(--k-fg);
  padding: var(--k-s-20, 20px);
  box-shadow: var(--k-shadow-lg);
  max-inline-size: min(90vw, 32rem);
}
${w('dialog::backdrop')} { background: var(--k-scrim, rgb(0 0 0 / 0.4)); }

/* ---- 7 · STRUCTURE gets defence and nothing else. -------------------------- */
${w('header, footer, main, nav, aside, section, article')} { min-inline-size: 0; }
`
}
