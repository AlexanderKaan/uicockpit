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
   can't out-specify the disabled greying. */
${s}:disabled, ${s}.is-disabled {
  background: var(--k-disabled-bg) !important;
  color: var(--k-disabled-fg) !important;
  opacity: var(--k-disabled-opacity);
  cursor: not-allowed;
  pointer-events: none;
}

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
${s}.tbl__row:focus-visible,
${s}.navrow:focus-visible,
${s}.accordion summary:focus-visible,
${s}.convo:focus-visible,
${s}.combobox__item:focus-visible,
${s}.tree__row:focus-visible,
${s}.list__row:focus-visible,
${s}.phoneinput__country:focus-visible,
${s}.fab-stack__btn:focus-visible {
  outline-offset: -2px;
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
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--k-input-error-border) 28%, transparent);
}
${s}.in.is-success:focus,
${s}.in.is-success:focus-within {
  border-color: var(--k-input-success-border);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--k-input-success-border) 28%, transparent);
}
${s}.in.is-warning:focus,
${s}.in.is-warning:focus-within {
  border-color: var(--k-input-warning-border);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--k-input-warning-border) 28%, transparent);
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
  ${s}.phoneinput__country { min-height: var(--k-touch-target); }
  ${s}.btn--icon, ${s}.btn--circle,
  ${s}.lightbox__btn, ${s}.alert__close, ${s}.banner__close, ${s}.toast__close {
    min-width: var(--k-touch-target); min-height: var(--k-touch-target);
  }
}`
}
